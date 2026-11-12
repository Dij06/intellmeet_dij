import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTaskSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid task update' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    try {
      const task = await prisma.task.update({
        where: { id },
        data,
      });
      return NextResponse.json({ task }, { status: 200 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const idx = store.tasks.findIndex((t) => t.id === id);
        if (idx === -1) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        store.tasks[idx] = {
          ...store.tasks[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json(
          { task: store.tasks[idx], demoMode: true },
          { status: 200 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update task' },
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
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      store.tasks = store.tasks.filter((t) => t.id !== id);
      return NextResponse.json({ deleted: true, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}
