import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateMeetingSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    return NextResponse.json({ meeting }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      const meeting = store.meetings.find((m) => m.id === id);
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }
      return NextResponse.json(
        {
          meeting: {
            ...meeting,
            workspace: store.workspaces.find((w) => w.id === meeting.workspaceId) || null,
            tasks: store.tasks.filter((t) => t.meetingId === id),
            messages: store.messages.filter((msg) => msg.meetingId === id),
          },
          demoMode: true,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to load meeting' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await req.json();
    const parsed = updateMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid update payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    try {
      const meeting = await prisma.meeting.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.transcript !== undefined ? { transcript: data.transcript } : {}),
          ...(data.sharedNotes !== undefined ? { sharedNotes: data.sharedNotes } : {}),
          ...(data.scheduledAt !== undefined
            ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }
            : {}),
        },
      });
      return NextResponse.json({ meeting }, { status: 200 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const idx = store.meetings.findIndex((m) => m.id === id);
        if (idx === -1) {
          return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        store.meetings[idx] = {
          ...store.meetings[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json(
          { meeting: store.meetings[idx], demoMode: true },
          { status: 200 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      store.meetings = store.meetings.filter((m) => m.id !== id);
      return NextResponse.json({ deleted: true, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
