import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrDemoUser } from '@/lib/auth';
import { createMeetingSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const status = searchParams.get('status') || '';

  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        workspace: { select: { id: true, name: true } },
        _count: { select: { tasks: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ meetings }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      const meetings = store.meetings
        .filter((m) => {
          const matchStatus = !status || status === 'ALL' || m.status === status;
          const matchQuery =
            !query ||
            m.title.toLowerCase().includes(query) ||
            (m.description || '').toLowerCase().includes(query);
          return matchStatus && matchQuery;
        })
        .map((m) => ({
          ...m,
          workspace: store.workspaces.find((w) => w.id === m.workspaceId) || null,
          _count: {
            tasks: store.tasks.filter((t) => t.meetingId === m.id).length,
            messages: store.messages.filter((msg) => msg.meetingId === m.id).length,
          },
        }));
      return NextResponse.json({ meetings, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid meeting payload' },
        { status: 400 }
      );
    }

    const { title, description, scheduledAt, durationMinutes, workspaceId, status } =
      parsed.data;

    try {
      const user = await getCurrentOrDemoUser();
      const newMeeting = await prisma.meeting.create({
        data: {
          title,
          description: description || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
          durationMinutes: durationMinutes || 30,
          workspaceId: workspaceId || null,
          status: status || 'SCHEDULED',
          userId: user.id,
        },
      });
      return NextResponse.json({ meeting: newMeeting }, { status: 201 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const now = new Date().toISOString();
        const newMeeting = {
          id: `mtg-${Date.now()}`,
          title,
          description: description || null,
          roomCode: `room-${Math.random().toString(36).slice(2, 8)}`,
          status: (status || 'SCHEDULED') as 'SCHEDULED' | 'LIVE' | 'ENDED',
          scheduledAt: scheduledAt || now,
          durationMinutes: durationMinutes || 30,
          transcript: null,
          summary: null,
          sharedNotes: null,
          userId: 'demo-user',
          workspaceId: workspaceId || null,
          createdAt: now,
          updatedAt: now,
        };
        store.meetings.unshift(newMeeting);
        return NextResponse.json({ meeting: newMeeting, demoMode: true }, { status: 201 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
