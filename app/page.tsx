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
  Layers,
  ShieldCheck,
  FileText,
} from 'lucide-react';

const demoScenarios = [
  {
    id: 'incident',
    title: 'Hotfix Postmortem',
    badge: 'Prod Incident',
    transcript:
      'DevOps Lead: The Neon DB pooler reached maximum connections during peak morning sync.\nFrontend Lead: We enabled in-memory fallback store and added connection retry backoff.\nQA Lead: Verified automated test suite passes with zero regressions before deploying release.',
    summary:
      'Root cause identified as database pool exhaustion under peak load. Implemented in-memory fallback mechanism and added connection retry backoff. QA verified automated test suite passes cleanly.',
    actionItems: [
      { title: 'Add connection retry backoff logic', assignee: 'DevOps Lead', priority: 'HIGH' },
      { title: 'Implement in-memory fallback store', assignee: 'Frontend Lead', priority: 'HIGH' },
      { title: 'Run integration load benchmarks', assignee: 'QA Lead', priority: 'MEDIUM' },
    ],
  },
  {
    id: 'roadmap',
    title: 'Product Sprint Planning',
    badge: 'Sprint Planning',
    transcript:
      'Product Mgr: Enterprise clients need live speech transcription in browser without third-party extensions.\nDesigner: We aligned the editorial UI with clean typography, restrained borders, and light/dark mode.\nTech Lead: WebRTC signaling and task dispatch are fully hooked up across workspaces.',
    summary:
      'Finalized browser-native Web Speech API transcription. Approved clean editorial design system with light/dark theme persistence and multi-tab WebRTC signaling.',
    actionItems: [
      { title: 'Verify Web Speech API browser compatibility', assignee: 'Product Mgr', priority: 'HIGH' },
      { title: 'Deploy refined editorial UI system', assignee: 'Designer', priority: 'MEDIUM' },
      { title: 'Benchmark BroadcastChannel signaling mesh', assignee: 'Tech Lead', priority: 'MEDIUM' },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture Review',
    badge: 'Design Review',
    transcript:
      'Lead Architect: We need unified state management between meeting action items and workspace Kanban tasks.\nSecurity Engineer: All API routes must validate NextAuth session JWTs with rate limiting.\nFull-Stack Dev: Added Word DOCX and Markdown export for instant executive minutes generation.',
    summary:
      'Architecture aligned around unified task dispatching from meetings into team workspaces. Validated session-based route security and post-meeting documentation exports.',
    actionItems: [
      { title: 'Connect auto-dispatch action items to workspace board', assignee: 'Full-Stack Dev', priority: 'HIGH' },
      { title: 'Audit JWT validation and API rate limiting', assignee: 'Security Engineer', priority: 'HIGH' },
      { title: 'Finalize meeting minutes DOCX & PDF exports', assignee: 'Lead Architect', priority: 'LOW' },
    ],
  },
];

export default function Home() {
  const [activeScenario, setActiveScenario] = useState(demoScenarios[0]);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = (scenario: (typeof demoScenarios)[0]) => {
    setSimulating(true);
    setActiveScenario(scenario);
    setTimeout(() => setSimulating(false), 300);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-14">
      {/* Editorial Hero Header */}
      <section className="relative border-b border-[var(--border)] pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-[var(--text-secondary)]">
            <span className="flex h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span>Enterprise Meeting Intelligence</span>
            <span>•</span>
            <span className="text-[var(--accent)] font-semibold">Real-Time Platform</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
            <span>Next.js 14</span>
            <span className="opacity-40">/</span>
            <span>WebRTC</span>
            <span className="opacity-40">/</span>
            <span>PostgreSQL</span>
            <span className="opacity-40">/</span>
            <span>OpenAI</span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-6xl sm:leading-[1.1]">
              Meetings that actually produce work.{' '}
              <span className="inline-block underline decoration-[var(--accent)] decoration-wavy decoration-2 underline-offset-8">
                Not follow-up meetings.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-normal leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              No 45-minute syncs lost to the ether. IntellMeet connects real-time WebRTC
              video, live browser speech transcription, AI executive summaries, and
              auto-extracted Kanban tasks directly into your team’s workspace.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--bg-page)] shadow-sm hover:opacity-90 transition active:scale-[0.99]"
            >
              <Video className="h-4 w-4 text-[var(--accent)]" />
              <span>Launch Meetings</span>
              <ArrowRight className="h-3.5 w-3.5 ml-auto sm:ml-0" />
            </Link>
            <Link
              href="/workspaces"
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition active:scale-[0.99]"
            >
              <Kanban className="h-4 w-4 text-[var(--success)]" />
              <span>Explore Workspace</span>
            </Link>
          </div>
        </div>

        {/* Real Platform Capabilities Bar */}
        <div className="mt-10 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--text-secondary)]">WebRTC Video</p>
            <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">Peer-to-Peer</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Encrypted audio, video & screen share</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--text-secondary)]">Speech Recognition</p>
            <p className="mt-1 text-xl font-bold text-[var(--success)]">Live Dictation</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Browser Web Speech API & audio uploads</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--text-secondary)]">AI Synthesis</p>
            <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">Structured Minutes</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Summaries, decisions & action items</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--text-secondary)]">Workspace Sync</p>
            <p className="mt-1 text-xl font-bold text-[var(--accent)]">Task Board</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Auto-dispatched team action items</p>
          </div>
        </div>
      </section>

      {/* Interactive AI Intelligence Simulator */}
      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Interactive Preview
            </span>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              From conversation to structured action items
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Select a scenario to view transcript processing and task extraction
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {demoScenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSimulate(sc)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
                activeScenario.id === sc.id
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
              }`}
            >
              <Play className="h-3 w-3" />
              <span>{sc.title}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  activeScenario.id === sc.id
                    ? 'bg-[var(--bg-surface)]/20 text-[var(--bg-page)]'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                }`}
              >
                {sc.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Simulator Grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Transcript input */}
          <div className="lg:col-span-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Meeting Transcript
                </span>
              </div>
              <span className="rounded bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] font-mono">
                Speech-to-Text
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-page)] p-3.5 rounded-lg border border-[var(--border)] font-mono whitespace-pre-wrap">
              {activeScenario.transcript}
            </p>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>Status: Live capture ready</span>
              <span className="font-mono">Client-side transcription</span>
            </div>
          </div>

          {/* AI Intelligence Output */}
          <div className="lg:col-span-7 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  AI Synthesis &amp; Extracted Tasks
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--success)]">
                {simulating ? 'Analyzing...' : 'Ready'}
              </span>
            </div>

            <div className={`mt-4 space-y-4 transition-opacity ${simulating ? 'opacity-40' : 'opacity-100'}`}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Executive Summary
                </p>
                <p className="mt-1 text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-page)] p-3 rounded-lg border border-[var(--border)]">
                  {activeScenario.summary}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Auto-Dispatched Action Items ({activeScenario.actionItems.length})
                </p>
                <div className="space-y-2">
                  {activeScenario.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                          {item.assignee}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.priority === 'HIGH'
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
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

      {/* Core Architectural Capabilities */}
      <section className="mt-16 border-t border-[var(--border)] pt-10">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            Core Modules
          </span>
          <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            End-to-End Meeting Platform
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Integrated architecture connecting video, transcription, summarization, and team project management.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-page)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Implementation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  {
                    code: 'F-01',
                    name: 'Authentication & Profiles',
                    tech: 'NextAuth session management, bcrypt password hashing, and instant demo access.',
                    link: '/login',
                    action: 'Sign In',
                  },
                  {
                    code: 'F-02',
                    name: 'Real-Time Video Conference',
                    tech: 'WebRTC audio/video mesh, camera & mic toggles, screen share, and MediaRecorder.',
                    link: '/dashboard',
                    action: 'Launch Room',
                  },
                  {
                    code: 'F-03',
                    name: 'AI Meeting Intelligence',
                    tech: 'Web Speech API browser dictation, OpenAI structured summaries, and fallback NLP.',
                    link: '/dashboard',
                    action: 'Generate Minutes',
                  },
                  {
                    code: 'F-04',
                    name: 'Live Chat & Collaboration',
                    tech: 'Multi-tab BroadcastChannel sync, real-time in-meeting chat, and task dispatcher.',
                    link: '/dashboard',
                    action: 'Open Meetings',
                  },
                  {
                    code: 'F-05',
                    name: 'Meeting Minutes & Export',
                    tech: 'Searchable meeting archive, audio file processing, Word DOCX and Markdown export.',
                    link: '/dashboard',
                    action: 'View Archive',
                  },
                  {
                    code: 'F-06',
                    name: 'Workspaces & Task Board',
                    tech: 'Team workspaces, member invitations, and 3-column To Do / In Progress / Done board.',
                    link: '/workspaces',
                    action: 'Open Board',
                  },
                  {
                    code: 'F-07',
                    name: 'Productivity Analytics',
                    tech: 'Meeting minutes tracked, task velocity metrics, member activity, and CSV export.',
                    link: '/analytics',
                    action: 'View Analytics',
                  },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-[var(--bg-surface-hover)] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent)]">{row.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">{row.name}</td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-md">{row.tech}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={row.link}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
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

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div>
          <span>IntellMeet • AI-Powered Meeting & Collaboration Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition">Meetings</Link>
          <Link href="/workspaces" className="hover:text-[var(--text-primary)] transition">Workspace</Link>
          <Link href="/analytics" className="hover:text-[var(--text-primary)] transition">Analytics</Link>
          <Link href="/login" className="hover:text-[var(--text-primary)] transition">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
