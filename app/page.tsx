import Link from 'next/link';
import {
  Video,
  Sparkles,
  MessageSquare,
  Kanban,
  BarChart3,
  ShieldCheck,
  FileText,
  ArrowRight,
} from 'lucide-react';

const capabilities = [
  {
    id: 'F-01',
    title: 'Auth & Role-Based Access',
    description:
      'NextAuth JWT sessions, bcrypt password hashing, rate-limited registration, plus zero-friction demo access.',
    icon: ShieldCheck,
  },
  {
    id: 'F-02',
    title: 'Real-Time WebRTC Video',
    description:
      'Peer-to-peer video & audio, screen sharing, local recording, mute/camera controls, and live participant presence.',
    icon: Video,
  },
  {
    id: 'F-03',
    title: 'AI Meeting Intelligence',
    description:
      'Live browser speech transcription, OpenAI-powered executive summaries, and automatic action item extraction.',
    icon: Sparkles,
  },
  {
    id: 'F-04',
    title: 'Real-Time Chat & Notes',
    description:
      'In-meeting live chat with typing indicators, collaborative shared notes, and instant task creation.',
    icon: MessageSquare,
  },
  {
    id: 'F-05',
    title: 'Post-Meeting Dashboard',
    description:
      'Searchable meeting history, structured action item tracking, and one-click Markdown / Print-to-PDF exports.',
    icon: FileText,
  },
  {
    id: 'F-06',
    title: 'Workspaces & Kanban Boards',
    description:
      'Team workspaces with member management and interactive To Do / In Progress / Done project boards.',
    icon: Kanban,
  },
  {
    id: 'F-07',
    title: 'Analytics & Insights',
    description:
      'Meeting frequency, task completion rates, contributor workload charts, and CSV/JSON report exports.',
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero Section */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Zidio Development • Production Enterprise Platform v2.0
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Turn Every Meeting Into{' '}
            <span className="text-indigo-400">Actionable Intelligence</span>
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg leading-relaxed">
            IntellMeet unifies real-time WebRTC video conferencing, live speech
            transcription, AI-generated summaries, automatic Kanban action items,
            and enterprise productivity analytics in one workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition"
            >
              Launch Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Open Kanban Board
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Demo Instructions Banner */}
        <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-300">
            Quick Demo Guide (No Sign-Up Required):
          </p>
          <p className="mt-1 text-slate-300">
            Jump straight into <Link href="/dashboard" className="underline text-emerald-300">Meetings Dashboard</Link> to
            create or join a live WebRTC video room, test live speech captions &amp;
            chat, generate AI summaries that auto-populate the{' '}
            <Link href="/workspaces" className="underline text-emerald-300">Kanban Board</Link>, or inspect{' '}
            <Link href="/analytics" className="underline text-emerald-300">Analytics</Link>.
          </p>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="mt-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Core Enterprise Capabilities
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Built to satisfy all functional requirements (F-01 through F-07).
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 hover:border-indigo-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
                    {cap.id}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
