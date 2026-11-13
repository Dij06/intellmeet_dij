'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Download,
  Video,
  CheckCircle2,
  Sparkles,
  Clock,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useToast } from '@/app/components/Toast';

interface AnalyticsData {
  overview: {
    totalMeetings: number;
    summarizedMeetings: number;
    totalMinutes: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
    workspaceCount: number;
    messageCount: number;
  };
  priorityBreakdown: { HIGH: number; MEDIUM: number; LOW: number };
  statusBreakdown: { LIVE: number; SCHEDULED: number; ENDED: number };
  topContributors: Array<{ name: string; taskCount: number }>;
  recentMeetings?: Array<{
    id: string;
    title: string;
    status: string;
    durationMinutes: number;
    summary: string | null;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const d = await res.json();
      setData(d);
    } catch {
      showToast('Error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Meetings Processed', String(data.overview.totalMeetings)],
      ['AI Summarized Meetings', String(data.overview.summarizedMeetings)],
      ['Total Meeting Minutes', String(data.overview.totalMinutes)],
      ['Total Action Items', String(data.overview.totalTasks)],
      ['Completed Action Items', String(data.overview.completedTasks)],
      ['Completion Rate (%)', String(data.overview.completionRate)],
      ['High Priority Tasks', String(data.priorityBreakdown.HIGH)],
      ['Active Workspaces', String(data.overview.workspaceCount)],
      ['Chat Messages Synchronized', String(data.overview.messageCount)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intellmeet-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Analytics CSV exported successfully', 'success');
  };

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-12 text-center font-mono text-xs text-ink-500">
        Aggregating system intelligence metrics...
      </div>
    );
  }

  const { overview, priorityBreakdown, statusBreakdown, topContributors } = data;
  const maxPriority = Math.max(1, priorityBreakdown.HIGH, priorityBreakdown.MEDIUM, priorityBreakdown.LOW);
  const maxStatus = Math.max(1, statusBreakdown.LIVE, statusBreakdown.SCHEDULED, statusBreakdown.ENDED);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b-2 border-ink-950 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
            <LineChart className="h-3.5 w-3.5" />
            <span>Productivity &amp; Velocity Observability</span>
          </div>
          <h1 className="mt-1 font-sans text-3xl font-extrabold text-ink-950 sm:text-4xl">
            System Analytics &amp; Insights
          </h1>
          <p className="mt-1 text-xs text-ink-600">
            Real-time reporting on meeting intelligence coverage, task velocity, and team workload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAnalytics}
            className="flex items-center gap-1.5 rounded-lg border border-ink-950 bg-paper-50 px-3 py-2 text-xs font-bold text-ink-950 shadow-tactile-sm transition hover:bg-paper-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink-950 bg-ink-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile transition hover:bg-ink-800 active:translate-x-0.5 active:translate-y-0.5"
          >
            <Download className="h-3.5 w-3.5 text-coral" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase text-ink-500">
            <span>Meetings Archive</span>
            <Video className="h-4 w-4 text-ink-900" />
          </div>
          <p className="mt-2 font-sans text-3xl font-black text-ink-950">
            {overview.totalMeetings}
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-600">
            {statusBreakdown.LIVE} live room(s) • {statusBreakdown.SCHEDULED} scheduled
          </p>
        </div>

        <div className="rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase text-ink-500">
            <span>AI Coverage</span>
            <Sparkles className="h-4 w-4 text-emeraldBrand" />
          </div>
          <p className="mt-2 font-sans text-3xl font-black text-emeraldBrand">
            {overview.totalMeetings > 0
              ? Math.round((overview.summarizedMeetings / overview.totalMeetings) * 100)
              : 0}%
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-600">
            {overview.summarizedMeetings} of {overview.totalMeetings} calls synthesized
          </p>
        </div>

        <div className="rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase text-ink-500">
            <span>Task Completion</span>
            <CheckCircle2 className="h-4 w-4 text-coral" />
          </div>
          <p className="mt-2 font-sans text-3xl font-black text-coral">
            {overview.completionRate}%
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-600">
            {overview.completedTasks} / {overview.totalTasks} action items closed
          </p>
        </div>

        <div className="rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 shadow-tactile">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase text-ink-500">
            <span>Tracked Time</span>
            <Clock className="h-4 w-4 text-ink-900" />
          </div>
          <p className="mt-2 font-sans text-3xl font-black text-ink-950">
            {overview.totalMinutes}m
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-600">
            {overview.messageCount} chat interactions logged
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Action Items by Priority */}
        <div className="lg:col-span-6 rounded-2xl border-2 border-ink-950 bg-paper-50 p-6 shadow-tactile">
          <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
            <h2 className="font-sans text-sm font-extrabold uppercase text-ink-950">
              Action Items By Priority
            </h2>
            <span className="font-mono text-xs text-ink-500">
              {overview.totalTasks} total tasks
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { label: 'High Priority', count: priorityBreakdown.HIGH, barColor: 'bg-coral' },
              { label: 'Medium Priority', count: priorityBreakdown.MEDIUM, barColor: 'bg-amberBrand' },
              { label: 'Low Priority', count: priorityBreakdown.LOW, barColor: 'bg-ink-400' },
            ].map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex justify-between font-mono text-xs text-ink-700">
                  <span className="font-bold">{p.label}</span>
                  <span className="font-extrabold text-ink-950">{p.count}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-paper-200 border border-ink-900/15 overflow-hidden">
                  <div
                    className={`h-full ${p.barColor} transition-all`}
                    style={{ width: `${Math.round((p.count / maxPriority) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-ink-900/10 pt-4 flex justify-between font-mono text-[11px] text-ink-500">
            <span>To Do: {overview.todoTasks}</span>
            <span>In Progress: {overview.inProgressTasks}</span>
            <span>Done: {overview.completedTasks}</span>
          </div>
        </div>

        {/* Meeting Status Breakdown */}
        <div className="lg:col-span-6 rounded-2xl border-2 border-ink-950 bg-paper-50 p-6 shadow-tactile">
          <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
            <h2 className="font-sans text-sm font-extrabold uppercase text-ink-950">
              Meeting Status Distribution
            </h2>
            <span className="font-mono text-xs text-ink-500">Lifecycle State</span>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { label: 'Active Live Rooms', count: statusBreakdown.LIVE, barColor: 'bg-coral' },
              { label: 'Scheduled Upcoming', count: statusBreakdown.SCHEDULED, barColor: 'bg-emeraldBrand' },
              { label: 'Ended & Archived', count: statusBreakdown.ENDED, barColor: 'bg-ink-600' },
            ].map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between font-mono text-xs text-ink-700">
                  <span className="font-bold">{s.label}</span>
                  <span className="font-extrabold text-ink-950">{s.count}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-paper-200 border border-ink-900/15 overflow-hidden">
                  <div
                    className={`h-full ${s.barColor} transition-all`}
                    style={{ width: `${Math.round((s.count / maxStatus) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-ink-900/10 pt-4 flex justify-between font-mono text-[11px] text-ink-500">
            <span>Workspaces: {overview.workspaceCount}</span>
            <span>Total Sync: Real-time PostgreSQL</span>
          </div>
        </div>

        {/* Contributor Leaderboard */}
        <div className="lg:col-span-12 rounded-2xl border-2 border-ink-950 bg-paper-50 p-6 shadow-tactile">
          <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ink-900" />
              <h2 className="font-sans text-sm font-extrabold uppercase text-ink-950">
                Action Item Ownership Distribution
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-500">By Assignee</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {topContributors.length === 0 ? (
              <p className="col-span-full py-6 text-center font-mono text-xs text-ink-400">
                No assigned tasks recorded yet.
              </p>
            ) : (
              topContributors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-xl border border-ink-900/20 bg-paper-100 p-3 shadow-tactile-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950 text-paper-50 font-mono text-xs font-bold">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-sans text-xs font-bold text-ink-950">{c.name}</span>
                  </div>
                  <span className="rounded bg-paper-50 border border-ink-900/20 px-2 py-0.5 font-mono text-[11px] font-bold text-coral">
                    {c.taskCount} tasks
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
