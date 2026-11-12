import { NextResponse } from 'next/server';

interface PeerState {
  peerId: string;
  name: string;
  muted: boolean;
  cameraOff: boolean;
  typing: boolean;
  lastSeen: number;
}

interface SignalItem {
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'ice';
  payload: unknown;
  createdAt: number;
}

interface RoomState {
  peers: Map<string, PeerState>;
  signals: SignalItem[];
}

const globalForSignal = globalThis as unknown as {
  __intellmeetRooms?: Map<string, RoomState>;
};

function getRoom(meetingId: string): RoomState {
  if (!globalForSignal.__intellmeetRooms) {
    globalForSignal.__intellmeetRooms = new Map();
  }
  let room = globalForSignal.__intellmeetRooms.get(meetingId);
  if (!room) {
    room = { peers: new Map(), signals: [] };
    globalForSignal.__intellmeetRooms.set(meetingId, room);
  }
  const now = Date.now();
  // Prune stale peers (> 15s inactive) and old signals (> 30s)
  for (const [id, peer] of Array.from(room.peers.entries())) {
    if (now - peer.lastSeen > 15_000) room.peers.delete(id);
  }
  room.signals = room.signals.filter((s) => now - s.createdAt < 30_000);
  return room;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const peerId = searchParams.get('peerId') || '';
  const room = getRoom(params.id);

  const peers = Array.from(room.peers.values());
  const signals = peerId
    ? room.signals.filter((s) => s.to === peerId)
    : [];

  // Deliver once
  if (peerId) {
    room.signals = room.signals.filter((s) => s.to !== peerId);
  }

  return NextResponse.json({ peers, signals }, { status: 200 });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const room = getRoom(params.id);

    if (body.action === 'leave' && body.peerId) {
      room.peers.delete(body.peerId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (body.action === 'heartbeat' && body.peerId) {
      room.peers.set(body.peerId, {
        peerId: body.peerId,
        name: body.name || 'Guest',
        muted: Boolean(body.muted),
        cameraOff: Boolean(body.cameraOff),
        typing: Boolean(body.typing),
        lastSeen: Date.now(),
      });
      return NextResponse.json(
        { peers: Array.from(room.peers.values()) },
        { status: 200 }
      );
    }

    if (body.action === 'signal' && body.from && body.to && body.type) {
      room.signals.push({
        from: body.from,
        to: body.to,
        type: body.type,
        payload: body.payload,
        createdAt: Date.now(),
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid signal action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Signal error' },
      { status: 500 }
    );
  }
}
