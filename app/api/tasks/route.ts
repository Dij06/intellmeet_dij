import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTaskSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || undefined;
  const meetingId = searchParams.get('meetingId') || undefined;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(meetingId ? { meetingId } : {}),
      },
      include: {
        meeting: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      const tasks = store.tasks
        .filter((t) => {
          if (workspaceId && t.workspaceId !== workspaceId) return false;
          if (meetingId && t.meetingId !== meetingId) return false;
          return true;
        })
        .map((t) => ({
          ...t,
          meeting: store.meetings.find((m) => m.id === t.meetingId)
            ? { id: t.meetingId!, title: store.meetings.find((m) => m.id === t.meetingId)!.title }
            : null,
        }));
      return NextResponse.json({ tasks, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid task payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    try {
      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description || null,
          status: data.status || 'TODO',
          priority: data.priority || 'MEDIUM',
          meetingId: data.meetingId || null,
          workspaceId: data.workspaceId || null,
          assigneeName: data.assigneeName || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      });
      return NextResponse.json({ task }, { status: 201 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const now = new Date().toISOString();
        const task = {
          id: `task-${Date.now()}`,
          title: data.title,
          description: data.description || null,
          status: data.status || 'TODO',
          priority: data.priority || 'MEDIUM',
          dueDate: data.dueDate || null,
          meetingId: data.meetingId || null,
          workspaceId: data.workspaceId || null,
          assigneeName: data.assigneeName || null,
          createdAt: now,
          updatedAt: now,
        };
        store.tasks.unshift(task);
        return NextResponse.json({ task, demoMode: true }, { status: 201 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create task' },
      { status: 500 }
    );
  }
}
