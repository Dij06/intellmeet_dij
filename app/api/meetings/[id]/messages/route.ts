import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrDemoUser } from '@/lib/auth';
import { createMessageSchema } from '@/lib/validation';
import { getDemoStore, isDbConnectionError } from '@/lib/demo-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const meetingId = params.id;
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const store = getDemoStore();
      const messages = store.messages.filter((m) => m.meetingId === meetingId);
      return NextResponse.json({ messages, demoMode: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to load messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const meetingId = params.id;
  try {
    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid message' },
        { status: 400 }
      );
    }

    const { content, senderName } = parsed.data;

    try {
      const user = await getCurrentOrDemoUser();
      const message = await prisma.chatMessage.create({
        data: {
          content,
          senderName: senderName || user.name || 'Participant',
          meetingId,
          userId: user.id,
        },
      });
      return NextResponse.json({ message }, { status: 201 });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const store = getDemoStore();
        const message = {
          id: `msg-${Date.now()}`,
          content,
          senderName: senderName || 'Demo User',
          meetingId,
          createdAt: new Date().toISOString(),
        };
        store.messages.push(message);
        return NextResponse.json({ message, demoMode: true }, { status: 201 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
