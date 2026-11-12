import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET() {
  try {
    const [meetings, tasks, workspaces, messageCount] = await Promise.all([
      prisma.meeting.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          durationMinutes: true,
          summary: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        select: {
          id: true,
          status: true,
          priority: true,
          assigneeName: true,
          createdAt: true,
        },
      }),
      prisma.workspace.count(),
      prisma.chatMessage.count(),
    ]);

    return NextResponse.json(
      buildAnalyticsPayload(meetings, tasks, workspaces, messageCount),
      { status: 200 }
    );
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      return NextResponse.json(
        {
          ...buildAnalyticsPayload(
            store.meetings,
            store.tasks,
            store.workspaces.length,
            store.messages.length
          ),
          demoMode: true,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to compute analytics' },
      { status: 500 }
    );
  }
}

function buildAnalyticsPayload(
  meetings: Array<{
    id: string;
    title: string;
    status: string;
    durationMinutes: number;
    summary: string | null;
    createdAt: Date | string;
  }>,
  tasks: Array<{
    id: string;
    status: string;
    priority: string;
    assigneeName: string | null;
  }>,
  workspaceCount: number,
  messageCount: number
) {
  const totalMeetings = meetings.length;
  const summarizedMeetings = meetings.filter((m) => Boolean(m.summary)).length;
  const totalMinutes = meetings.reduce((sum, m) => sum + (m.durationMinutes || 30), 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const priorityBreakdown = {
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
  };

  const statusBreakdown = {
    LIVE: meetings.filter((m) => m.status === 'LIVE').length,
    SCHEDULED: meetings.filter((m) => m.status === 'SCHEDULED').length,
    ENDED: meetings.filter((m) => m.status === 'ENDED').length,
  };

  const assigneeMap = new Map<string, number>();
  for (const t of tasks) {
    const name = t.assigneeName || 'Unassigned';
    assigneeMap.set(name, (assigneeMap.get(name) || 0) + 1);
  }

  const topContributors = Array.from(assigneeMap.entries())
    .map(([name, taskCount]) => ({ name, taskCount }))
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 5);

  return {
    overview: {
      totalMeetings,
      summarizedMeetings,
      totalMinutes,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      workspaceCount,
      messageCount,
    },
    priorityBreakdown,
    statusBreakdown,
    topContributors,
    recentMeetings: meetings.slice(0, 5),
  };
}
