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
      'Meeting frequency, task completion rates, contributor workload charts, and CSV report exports.',
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Hero Section */}
      <section className="rounded-3xl border border-stone-200 bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/50 p-8 sm:p-12 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Zidio Development • Enterprise Collaboration v2.0
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Turn Every Meeting Into{' '}
            <span className="text-emerald-700">Actionable Intelligence</span>
          </h1>
          <p className="mt-4 text-base text-stone-600 sm:text-lg leading-relaxed">
            IntellMeet unifies real-time WebRTC video conferencing, live speech
            transcription, AI-generated summaries, automatic Kanban action items,
            and enterprise productivity analytics in one calm, focused workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              Open Meetings Hub
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition"
            >
              Kanban Workspaces
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition"
            >
              Analytics
            </Link>
          </div>
        </div>

        {/* Demo Instructions Banner */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-stone-700">
          <p className="font-semibold text-amber-900">
            Quick Demo Guide (No Sign-Up Required):
          </p>
          <p className="mt-1">
            Head into{' '}
            <Link href="/dashboard" className="font-semibold text-emerald-800 underline">
              Meetings Hub
            </Link>{' '}
            to launch a live WebRTC video room, test live speech captions &amp;
            chat, generate AI summaries that auto-populate the{' '}
            <Link href="/workspaces" className="font-semibold text-emerald-800 underline">
              Kanban Board
            </Link>
            , or inspect{' '}
            <Link href="/analytics" className="font-semibold text-emerald-800 underline">
              Analytics
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="mt-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900">
            Core Enterprise Capabilities
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Built to satisfy all functional requirements (F-01 through F-07).
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-medium text-stone-500">
                    {cap.id}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
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
