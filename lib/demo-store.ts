/**
 * In-memory fallback store used only when the PostgreSQL database is unreachable,
 * ensuring demo and local evaluation flows never fail with 500 errors.
 */

export interface DemoWorkspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }>;
}

export interface DemoTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  meetingId: string | null;
  workspaceId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoMessage {
  id: string;
  content: string;
  senderName: string;
  meetingId: string;
  createdAt: string;
}

export interface DemoMeeting {
  id: string;
  title: string;
  description: string | null;
  roomCode: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  scheduledAt: string | null;
  durationMinutes: number;
  transcript: string | null;
  summary: string | null;
  sharedNotes: string | null;
  userId: string;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoreState {
  workspaces: DemoWorkspace[];
  meetings: DemoMeeting[];
  tasks: DemoTask[];
  messages: DemoMessage[];
}

const globalForDemo = globalThis as unknown as { __intellmeetDemoStore?: StoreState };

function createInitialState(): StoreState {
  const now = new Date().toISOString();
  const wsId = 'ws-enterprise-core';
  const m1Id = 'mtg-q4-roadmap';
  const m2Id = 'mtg-ai-sprint';

  return {
    workspaces: [
      {
        id: wsId,
        name: 'Enterprise Product & Engineering',
        description: 'Cross-functional workspace for IntellMeet product launches and sprint syncs.',
        ownerId: 'demo-user',
        createdAt: now,
        updatedAt: now,
        members: [
          {
            id: 'mem-1',
            workspaceId: wsId,
            userId: 'demo-user',
            role: 'ADMIN',
            user: { id: 'demo-user', name: 'Demo User', email: 'demo@intellmeet.com' },
          },
          {
            id: 'mem-2',
            workspaceId: wsId,
            userId: 'user-alex',
            role: 'MEMBER',
            user: { id: 'user-alex', name: 'Alex Rivera', email: 'alex@intellmeet.com' },
          },
          {
            id: 'mem-3',
            workspaceId: wsId,
            userId: 'user-priya',
            role: 'MEMBER',
            user: { id: 'user-priya', name: 'Priya Sharma', email: 'priya@intellmeet.com' },
          },
        ],
      },
    ],
    meetings: [
      {
        id: m1Id,
        title: 'Q4 Enterprise Architecture & AI Sync',
        description: 'Review WebRTC scaling, AI action item extraction, and release checklist.',
        roomCode: 'q4-arch-sync',
        status: 'ENDED',
        scheduledAt: now,
        durationMinutes: 45,
        transcript:
          'Alex: Let us finalize the WebRTC video room and screen sharing controls by Friday. Priya: I will connect the OpenAI summary endpoint to auto-create Kanban tasks with assignees. Demo User: Great, please also export the post-meeting analytics report for stakeholders.',
        summary:
          '### Executive Summary\nThe team aligned on finalizing the WebRTC meeting room, automating Kanban task creation from AI summaries, and preparing stakeholder analytics exports.\n\n### Key Discussion Points\n- WebRTC peer-to-peer video and screen sharing controls are targeted for completion by Friday.\n- AI summarization will automatically extract structured action items and assignees into the workspace Kanban board.\n- Post-meeting analytics exports will be prepared for enterprise stakeholders.',
        sharedNotes: '- Confirm TURN/STUN server config for production\n- Verify demo mode works without mandatory sign-up',
        userId: 'demo-user',
        workspaceId: wsId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: m2Id,
        title: 'Weekly Product Standup (Live Demo Room)',
        description: 'Join this live room to test WebRTC video, screen share, live captions, and chat.',
        roomCode: 'weekly-standup-live',
        status: 'LIVE',
        scheduledAt: now,
        durationMinutes: 30,
        transcript: null,
        summary: null,
        sharedNotes: 'Welcome! Use the video controls below or open this room in a second tab to test real-time sync.',
        userId: 'demo-user',
        workspaceId: wsId,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Finalize WebRTC video & screen sharing controls',
        description: 'Extracted from Q4 Enterprise Architecture & AI Sync',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: null,
        meetingId: m1Id,
        workspaceId: wsId,
        assigneeName: 'Alex Rivera',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-2',
        title: 'Connect AI summary action items to Kanban board',
        description: 'Extracted from Q4 Enterprise Architecture & AI Sync',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: null,
        meetingId: m1Id,
        workspaceId: wsId,
        assigneeName: 'Priya Sharma',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-3',
        title: 'Prepare stakeholder analytics CSV/JSON export',
        description: 'Extracted from Q4 Enterprise Architecture & AI Sync',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        meetingId: m1Id,
        workspaceId: wsId,
        assigneeName: 'Demo User',
        createdAt: now,
        updatedAt: now,
      },
    ],
    messages: [
      {
        id: 'msg-1',
        content: 'Welcome to the live meeting room! Chat messages sync in real time.',
        senderName: 'IntellMeet Bot',
        meetingId: m2Id,
        createdAt: now,
      },
    ],
  };
}

export function getDemoStore(): StoreState {
  if (!globalForDemo.__intellmeetDemoStore) {
    globalForDemo.__intellmeetDemoStore = createInitialState();
  }
  return globalForDemo.__intellmeetDemoStore;
}

export function isDbConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const msg = e.message || '';
  return (
    e.code === 'P1001' ||
    e.code === 'P1002' ||
    e.code === 'ECONNREFUSED' ||
    e.code === 'ENOTFOUND' ||
    msg.includes("Can't reach database server") ||
    msg.includes('Connection terminated') ||
    msg.includes('ECONNREFUSED')
  );
}
