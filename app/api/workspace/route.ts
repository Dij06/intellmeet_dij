import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrDemoUser } from '@/lib/auth';
import { addMemberSchema, createWorkspaceSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { meetings: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      const workspaces = store.workspaces.map((w) => ({
        ...w,
        _count: {
          meetings: store.meetings.filter((m) => m.workspaceId === w.id).length,
          tasks: store.tasks.filter((t) => t.workspaceId === w.id).length,
        },
      }));
      return NextResponse.json({ workspaces, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to load workspaces' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Workspace name is required' },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    try {
      const user = await getCurrentOrDemoUser();
      const workspace = await prisma.workspace.create({
        data: {
          name,
          description: description || null,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      return NextResponse.json({ workspace }, { status: 201 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const now = new Date().toISOString();
        const wsId = `ws-${Date.now()}`;
        const workspace = {
          id: wsId,
          name,
          description: description || null,
          ownerId: 'demo-user',
          createdAt: now,
          updatedAt: now,
          members: [
            {
              id: `mem-${Date.now()}`,
              workspaceId: wsId,
              userId: 'demo-user',
              role: 'ADMIN',
              user: { id: 'demo-user', name: 'Demo User', email: 'demo@intellmeet.com' },
            },
          ],
        };
        store.workspaces.unshift(workspace);
        return NextResponse.json({ workspace, demoMode: true }, { status: 201 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid member details' },
        { status: 400 }
      );
    }

    const { workspaceId, email, name, role } = parsed.data;

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            role: role || 'MEMBER',
          },
        });
      }

      const member = await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
        update: { role: role || 'MEMBER' },
        create: {
          workspaceId,
          userId: user.id,
          role: role || 'MEMBER',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ member }, { status: 200 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const ws = store.workspaces.find((w) => w.id === workspaceId);
        if (!ws) {
          return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }
        const member = {
          id: `mem-${Date.now()}`,
          workspaceId,
          userId: `user-${Date.now()}`,
          role: role || 'MEMBER',
          user: {
            id: `user-${Date.now()}`,
            name: name || email.split('@')[0],
            email,
          },
        };
        ws.members.push(member);
        return NextResponse.json({ member, demoMode: true }, { status: 200 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to add member' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Workspace id is required' }, { status: 400 });
    }

    try {
      await prisma.workspace.delete({ where: { id } });
      return NextResponse.json({ deleted: true }, { status: 200 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        store.workspaces = store.workspaces.filter((w) => w.id !== id);
        return NextResponse.json({ deleted: true, demoMode: true }, { status: 200 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
