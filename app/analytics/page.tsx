'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Video,
  CheckCircle2,
  Sparkles,
  Clock,
} from 'lucide-react';

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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Meetings', String(data.overview.totalMeetings)],
      ['AI Summarized Meetings', String(data.overview.summarizedMeetings)],
      ['Total Meeting Minutes', String(data.overview.totalMinutes)],
      ['Total Action Items', String(data.overview.totalTasks)],
      ['Completed Action Items', String(data.overview.completedTasks)],
      ['Completion Rate (%)', String(data.overview.completionRate)],
      ['Active Workspaces', String(data.overview.workspaceCount)],
      ['Chat Messages', String(data.overview.messageCount)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intellmeet-analytics-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-stone-500">Loading analytics...</div>
    );
  }

  const { overview, priorityBreakdown, statusBreakdown, topContributors } = data;
  const maxPriority = Math.max(
    1,
    priorityBreakdown.HIGH,
    priorityBreakdown.MEDIUM,
    priorityBreakdown.LOW
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
            <BarChart3 className="h-7 w-7 text-emerald-700" aria-hidden="true" />
            Analytics &amp; Productivity Insights
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Track meeting intelligence coverage, action item velocity, and team engagement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Meetings</span>
            <Video className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {overview.totalMeetings}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {statusBreakdown.LIVE} live • {statusBreakdown.SCHEDULED} scheduled
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">AI Summarized</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {overview.summarizedMeetings}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {overview.totalMeetings > 0
              ? Math.round((overview.summarizedMeetings / overview.totalMeetings) * 100)
              : 0}
            % meeting intelligence coverage
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Task Completion Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {overview.completionRate}%
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {overview.completedTasks} of {overview.totalTasks} action items done
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Meeting Time Tracked</span>
            <Clock className="h-4 w-4 text-teal-700" />
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {overview.totalMinutes}m
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {overview.messageCount} live chat messages exchanged
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">
            Action Items by Priority
          </h2>
          <div className="mt-5 space-y-4">
            {[
              { label: 'High Priority', count: priorityBreakdown.HIGH, color: 'bg-rose-500' },
              { label: 'Medium Priority', count: priorityBreakdown.MEDIUM, color: 'bg-amber-500' },
              { label: 'Low Priority', count: priorityBreakdown.LOW, color: 'bg-stone-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-xs text-stone-600">
                  <span>{item.label}</span>
                  <span className="font-semibold text-stone-900">{item.count}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: `${Math.round((item.count / maxPriority) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">
            Action Item Ownership
          </h2>
          {topContributors.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">No assigned tasks yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {topContributors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-stone-900">{c.name}</span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {c.taskCount} task(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
