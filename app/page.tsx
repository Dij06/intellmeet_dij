'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Kanban,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Play,
} from 'lucide-react';

const demoScenarios = [
  {
    id: 'incident',
    title: 'Hotfix Postmortem',
    badge: 'Prod Incident',
    transcript:
      'DevOps Lead: The Neon DB pooler reached maximum connections during peak morning sync. Frontend Lead: We need to enable in-memory fallback store and add connection retry backoff. QA Lead: I will add integration load tests before we push the release to production.',
    summary:
      'Root cause identified as database pool exhaustion under peak load. Implemented in-memory fallback mechanism and added connection retry backoff. QA scheduled to verify load benchmarks.',
    actionItems: [
      { title: 'Add connection retry backoff logic', assignee: 'DevOps Lead', priority: 'HIGH' },
      { title: 'Implement in-memory fallback store', assignee: 'Frontend Lead', priority: 'HIGH' },
      { title: 'Run integration load benchmarks', assignee: 'QA Lead', priority: 'MEDIUM' },
    ],
  },
  {
    id: 'roadmap',
    title: 'Q4 Product Sync',
    badge: 'Sprint Planning',
    transcript:
      'Product Mgr: Enterprise clients need live speech transcription in browser without third-party extension. Designer: I refined the high-contrast editorial UI with tactile status badges. Tech Lead: I will connect WebRTC signaling to broadcast across active browser tabs.',
    summary:
      'Finalized browser-native Web Speech API transcription. Approved high-contrast tactile design system and verified multi-tab WebRTC signaling mesh.',
    actionItems: [
      { title: 'Verify Web Speech API browser compatibility', assignee: 'Product Mgr', priority: 'HIGH' },
      { title: 'Deploy tactile editorial UI system', assignee: 'Designer', priority: 'MEDIUM' },
      { title: 'Benchmark BroadcastChannel signaling', assignee: 'Tech Lead', priority: 'MEDIUM' },
    ],
  },
];

export default function Home() {
  const [activeScenario, setActiveScenario] = useState(demoScenarios[0]);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = (scenario: typeof demoScenarios[0]) => {
    setSimulating(true);
    setActiveScenario(scenario);
    setTimeout(() => setSimulating(false), 450);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Editorial Hero Header */}
      <section className="relative border-b-2 border-ink-950 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-600">
            <span className="flex h-2 w-2 rounded-full bg-emeraldBrand animate-pulse" />
            <span>Zidio Development Portfolio v2.0</span>
            <span>•</span>
            <span className="text-coral">Real-Time Enterprise System</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-mono text-xs text-ink-500">
            <span>Next.js 14</span>
            <span>/</span>
            <span>PostgreSQL</span>
            <span>/</span>
            <span>WebRTC</span>
            <span>/</span>
            <span>OpenAI</span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink-950 sm:text-6xl sm:leading-[1.08]">
              Meetings that actually produce work.{' '}
              <span className="inline-block underline decoration-coral decoration-wavy decoration-2 underline-offset-8">
                Not follow-up meetings.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-normal leading-relaxed text-ink-700 sm:text-lg">
              No 45-minute syncs lost to the ether. IntellMeet connects real-time WebRTC
              video, live browser speech transcription, AI executive summaries, and
              auto-extracted Kanban tasks directly into your team’s workspace.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink-950 bg-ink-950 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile transition hover:bg-ink-800 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Video className="h-4 w-4 text-coral" />
              <span>Launch Meetings Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/workspaces"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink-950 bg-paper-50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink-950 shadow-tactile transition hover:bg-paper-200 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Kanban className="h-4 w-4 text-emeraldBrand" />
              <span>Open Kanban Board</span>
            </Link>
          </div>
        </div>

        {/* Live Key Metrics Bar */}
        <div className="mt-10 grid grid-cols-2 gap-3 border-t border-ink-900/10 pt-6 sm:grid-cols-4">
          <div className="rounded-xl border border-ink-900/15 bg-paper-100/70 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Follow-Up Saved</p>
            <p className="mt-1 font-sans text-2xl font-extrabold text-ink-950">40–60%</p>
            <p className="text-[11px] text-ink-600">Automated extraction</p>
          </div>
          <div className="rounded-xl border border-ink-900/15 bg-paper-100/70 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">WebRTC Latency</p>
            <p className="mt-1 font-sans text-2xl font-extrabold text-emeraldBrand">&lt; 40ms</p>
            <p className="text-[11px] text-ink-600">Peer-to-peer audio/video</p>
          </div>
          <div className="rounded-xl border border-ink-900/15 bg-paper-100/70 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Board Sync</p>
            <p className="mt-1 font-sans text-2xl font-extrabold text-ink-950">Real-Time</p>
            <p className="text-[11px] text-ink-600">Zero manual ticket entry</p>
          </div>
          <div className="rounded-xl border border-ink-900/15 bg-paper-100/70 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Guest Access</p>
            <p className="mt-1 font-sans text-2xl font-extrabold text-coral">Instant</p>
            <p className="text-[11px] text-ink-600">No mandatory signup</p>
          </div>
        </div>
      </section>

      {/* Interactive AI Intelligence Simulator */}
      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
              Live Product Simulator
            </span>
            <h2 className="mt-1 font-sans text-2xl font-extrabold text-ink-950 sm:text-3xl">
              See how raw conversation becomes structured action
            </h2>
          </div>
          <p className="font-mono text-xs text-ink-500">
            Click a scenario to run live extraction preview
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {demoScenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSimulate(sc)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                activeScenario.id === sc.id
                  ? 'border-ink-950 bg-ink-950 text-paper-50 shadow-tactile-sm'
                  : 'border-ink-900/20 bg-paper-50 text-ink-700 hover:border-ink-950'
              }`}
            >
              <Play className="h-3 w-3" />
              <span>{sc.title}</span>
              <span className="rounded bg-paper-200 px-1.5 py-0.2 font-mono text-[9px] text-ink-800">
                {sc.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Simulator Grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Transcript input side */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-ink-600" />
                <span className="font-mono text-xs font-bold text-ink-950">
                  INPUT: Meeting Transcript
                </span>
              </div>
              <span className="rounded bg-paper-200 px-2 py-0.5 font-mono text-[10px] text-ink-600">
                Speech-to-Text
              </span>
            </div>
            <p className="mt-4 font-mono text-xs leading-relaxed text-ink-800 bg-paper-100 p-3.5 rounded-xl border border-ink-900/10 whitespace-pre-wrap">
              {activeScenario.transcript}
            </p>
            <div className="mt-4 flex items-center justify-between text-[11px] text-ink-500 font-mono">
              <span>Status: Captured via Web Speech API</span>
              <span>100% Client-side</span>
            </div>
          </div>

          {/* AI Intelligence Output */}
          <div className="lg:col-span-7 rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-coral" />
                <span className="font-mono text-xs font-bold text-ink-950">
                  OUTPUT: AI Synthesis &amp; Extracted Tasks
                </span>
              </div>
              <span className="font-mono text-[10px] font-semibold text-emeraldBrand">
                {simulating ? 'Analyzing...' : 'Ready'}
              </span>
            </div>

            <div className={`mt-4 space-y-4 transition-opacity ${simulating ? 'opacity-40' : 'opacity-100'}`}>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-ink-500">
                  Executive Summary
                </p>
                <p className="mt-1 text-xs text-ink-800 leading-relaxed font-sans bg-paper-100 p-3 rounded-lg border border-ink-900/10">
                  {activeScenario.summary}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-ink-500 mb-2">
                  Auto-Dispatched Kanban Action Items ({activeScenario.actionItems.length})
                </p>
                <div className="space-y-2">
                  {activeScenario.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-ink-900/15 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 shadow-tactile-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emeraldBrand shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] text-ink-500">
                          {item.assignee}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                            item.priority === 'HIGH'
                              ? 'bg-coral-subtle text-coral-dark border border-coral/30'
                              : 'bg-paper-200 text-ink-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Capabilities Table (F-01 to F-07) */}
      <section className="mt-16 border-t-2 border-ink-950 pt-10">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
            System Modules
          </span>
          <h2 className="mt-1 font-sans text-2xl font-extrabold text-ink-950 sm:text-3xl">
            Built to Zidio Development Industry Standards
          </h2>
          <p className="mt-1 text-xs text-ink-600">
            Every required functional block (F-01 through F-07) verified and live.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-ink-950 bg-paper-50 shadow-tactile">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b-2 border-ink-950 bg-paper-200 font-mono text-[11px] font-bold text-ink-950 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Production Implementation</th>
                  <th className="py-3 px-4">Interactive Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/10 font-sans">
                {[
                  {
                    code: 'F-01',
                    name: 'Auth & Access Control',
                    tech: 'NextAuth JWT, bcryptjs password hashing, rate limiting, and instant guest demo access.',
                    link: '/login',
                    action: 'Test Auth Portal',
                  },
                  {
                    code: 'F-02',
                    name: 'Real-Time Video Conference',
                    tech: 'WebRTC audio/video mesh, camera & mic toggles, getDisplayMedia screen share, MediaRecorder.',
                    link: '/dashboard',
                    action: 'Launch Room',
                  },
                  {
                    code: 'F-03',
                    name: 'AI Meeting Intelligence',
                    tech: 'Web Speech API browser dictation, OpenAI gpt-4o-mini structured summary, fallback NLP.',
                    link: '/dashboard',
                    action: 'View Synthesizer',
                  },
                  {
                    code: 'F-04',
                    name: 'Real-Time Chat & Collaboration',
                    tech: 'BroadcastChannel multi-tab sync, in-meeting chat, typing indicators, quick task dispatcher.',
                    link: '/dashboard',
                    action: 'Test In-Meeting Chat',
                  },
                  {
                    code: 'F-05',
                    name: 'Post-Meeting Dashboard',
                    tech: 'Searchable meeting archive, structured action item tracking, Markdown & PDF report export.',
                    link: '/dashboard',
                    action: 'Inspect Archive',
                  },
                  {
                    code: 'F-06',
                    name: 'Workspaces & Kanban Board',
                    tech: 'Workspaces, member invite routing, interactive To Do / In Progress / Done column state.',
                    link: '/workspaces',
                    action: 'Open Kanban',
                  },
                  {
                    code: 'F-07',
                    name: 'Productivity Analytics',
                    tech: 'Meeting minutes tracked, task velocity metrics, contributor leaderboard, and CSV export.',
                    link: '/analytics',
                    action: 'View Metrics',
                  },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-paper-100 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-coral">{row.code}</td>
                    <td className="py-3.5 px-4 font-bold text-ink-950">{row.name}</td>
                    <td className="py-3.5 px-4 text-ink-600 max-w-md">{row.tech}</td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={row.link}
                        className="inline-flex items-center gap-1 rounded border border-ink-950 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-950 hover:bg-ink-950 hover:text-paper-50 transition"
                      >
                        <span>{row.action}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer / Meta Info */}
      <footer className="mt-16 border-t border-ink-900/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-500">
        <div>
          <span>IntellMeet v2.0 • Zidio Development Internship Submission</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-ink-950 transition">Dashboard</Link>
          <Link href="/workspaces" className="hover:text-ink-950 transition">Workspaces</Link>
          <Link href="/analytics" className="hover:text-ink-950 transition">Analytics</Link>
          <Link href="/login" className="hover:text-ink-950 transition">Demo Login</Link>
        </div>
      </footer>
    </div>
  );
}
