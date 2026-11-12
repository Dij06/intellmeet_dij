import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summarizeSchema } from '@/lib/validation';
import { generateMeetingIntelligence } from '@/lib/ai';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id;
    const body = await req.json();
    const parsed = summarizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Transcript is required' },
        { status: 400 }
      );
    }

    const { transcript } = parsed.data;
    const intelligence = await generateMeetingIntelligence(transcript);

    try {
      const existingMeeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: { workspaceId: true },
      });

      const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          transcript,
          summary: intelligence.summary,
          status: 'ENDED',
        },
      });

      const createdTasks = await Promise.all(
        intelligence.actionItems.map((item) =>
          prisma.task.create({
            data: {
              title: item.title,
              description: `Auto-extracted from meeting: ${updatedMeeting.title}`,
              priority: item.priority,
              assigneeName: item.assigneeName,
              status: 'TODO',
              meetingId,
              workspaceId: existingMeeting?.workspaceId || null,
            },
          })
        )
      );

      return NextResponse.json(
        {
          summary: intelligence.summary,
          actionItems: createdTasks,
          source: intelligence.source,
          meeting: updatedMeeting,
        },
        { status: 200 }
      );
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const idx = store.meetings.findIndex((m) => m.id === meetingId);
        if (idx === -1) {
          return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        const now = new Date().toISOString();
        store.meetings[idx] = {
          ...store.meetings[idx],
          transcript,
          summary: intelligence.summary,
          status: 'ENDED',
          updatedAt: now,
        };

        const createdTasks = intelligence.actionItems.map((item, i) => {
          const task = {
            id: `task-${Date.now()}-${i}`,
            title: item.title,
            description: `Auto-extracted from meeting: ${store.meetings[idx].title}`,
            status: 'TODO' as const,
            priority: item.priority,
            dueDate: null,
            meetingId,
            workspaceId: store.meetings[idx].workspaceId,
            assigneeName: item.assigneeName,
            createdAt: now,
            updatedAt: now,
          };
          store.tasks.unshift(task);
          return task;
        });

        return NextResponse.json(
          {
            summary: intelligence.summary,
            actionItems: createdTasks,
            source: intelligence.source,
            meeting: store.meetings[idx],
            demoMode: true,
          },
          { status: 200 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
