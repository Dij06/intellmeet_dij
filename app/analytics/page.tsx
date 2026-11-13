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
    showToast('Analytics CSV exported', 'success');
  };

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-12 text-center text-xs text-[var(--text-secondary)]">
        Aggregating system analytics and metrics...
      </div>
    );
  }

  const { overview, priorityBreakdown, statusBreakdown, topContributors } = data;
  const maxPriority = Math.max(1, priorityBreakdown.HIGH, priorityBreakdown.MEDIUM, priorityBreakdown.LOW);
  const maxStatus = Math.max(1, statusBreakdown.LIVE, statusBreakdown.SCHEDULED, statusBreakdown.ENDED);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <LineChart className="h-4 w-4" />
            <span>Productivity &amp; Insights</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Analytics &amp; Productivity
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Observability on meeting coverage, task completion velocity, and team contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAnalytics}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Total Meetings</span>
            <Video className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {overview.totalMeetings}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {statusBreakdown.LIVE} live • {statusBreakdown.SCHEDULED} scheduled
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>AI Summaries</span>
            <Sparkles className="h-4 w-4 text-[var(--success)]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--success)]">
            {overview.totalMeetings > 0
              ? Math.round((overview.summarizedMeetings / overview.totalMeetings) * 100)
              : 0}%
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {overview.summarizedMeetings} of {overview.totalMeetings} meetings synthesized
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Task Completion</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--accent)]">
            {overview.completionRate}%
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {overview.completedTasks} / {overview.totalTasks} action items closed
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Meeting Minutes</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {overview.totalMinutes}m
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {overview.messageCount} chat interactions logged
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Action Items by Priority */}
        <div className="lg:col-span-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Action Items By Priority
            </h2>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {overview.totalTasks} tasks
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { label: 'High Priority', count: priorityBreakdown.HIGH, barColor: 'bg-[var(--accent)]' },
              { label: 'Medium Priority', count: priorityBreakdown.MEDIUM, barColor: 'bg-[var(--warning)]' },
              { label: 'Low Priority', count: priorityBreakdown.LOW, barColor: 'bg-[var(--text-secondary)]' },
            ].map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{p.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{p.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                  <div
                    className={`h-full ${p.barColor} transition-all duration-300`}
                    style={{ width: `${Math.round((p.count / maxPriority) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4 flex justify-between text-xs text-[var(--text-secondary)]">
            <span>To Do: {overview.todoTasks}</span>
            <span>In Progress: {overview.inProgressTasks}</span>
            <span>Done: {overview.completedTasks}</span>
          </div>
        </div>

        {/* Meeting Status Breakdown */}
        <div className="lg:col-span-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Meeting Status Breakdown
            </h2>
            <span className="text-xs text-[var(--text-secondary)] font-mono">Lifecycle</span>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { label: 'Live Video Rooms', count: statusBreakdown.LIVE, barColor: 'bg-[var(--accent)]' },
              { label: 'Scheduled Upcoming', count: statusBreakdown.SCHEDULED, barColor: 'bg-[var(--success)]' },
              { label: 'Ended & Archived', count: statusBreakdown.ENDED, barColor: 'bg-[var(--text-secondary)]' },
            ].map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{s.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{s.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                  <div
                    className={`h-full ${s.barColor} transition-all duration-300`}
                    style={{ width: `${Math.round((s.count / maxStatus) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4 flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Workspaces: {overview.workspaceCount}</span>
            <span>Sync: Real-time PostgreSQL</span>
          </div>
        </div>

        {/* Contributor Leaderboard */}
        <div className="lg:col-span-12 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--text-secondary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Action Item Ownership Distribution
              </h2>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">By Assignee</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {topContributors.length === 0 ? (
              <p className="col-span-full py-6 text-center text-xs text-[var(--text-secondary)]">
                No assigned tasks recorded yet.
              </p>
            ) : (
              topContributors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--text-primary)] text-[var(--bg-page)] font-mono text-xs font-semibold">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{c.name}</span>
                  </div>
                  <span className="rounded bg-[var(--bg-surface)] border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
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
