'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Search,
  Sparkles,
  Trash2,
  CheckSquare,
  MessageSquare,
  Copy,
  Check,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';
import { useToast } from '@/app/components/Toast';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: string | null;
  summary: string | null;
  workspace?: { id: string; name: string } | null;
  _count?: { tasks: number; messages: number };
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/meetings?${params.toString()}`);
      const data = await res.json();
      if (data.meetings) {
        setMeetings(data.meetings);
      }
    } catch {
      showToast('Error loading meetings', 'error');
    } finally {
      setFetching(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => r.json())
      .then((d) => {
        if (d.workspaces) setWorkspaces(d.workspaces);
      })
      .catch(() => {});
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          workspaceId: workspaceId || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setScheduledAt('');
        showToast('Meeting scheduled successfully', 'success');
        fetchMeetings();
      } else {
        showToast('Failed to schedule meeting', 'error');
      }
    } catch {
      showToast('Network error while creating meeting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Live Sync • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          description: 'Instant P2P WebRTC video & collaboration room',
          status: 'LIVE',
          workspaceId: workspaces[0]?.id || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.meeting?.id) {
        showToast('Live room created! Entering...', 'success');
        router.push(`/meetings/${data.meeting.id}/room`);
      } else {
        showToast('Failed to create instant room', 'error');
      }
    } catch {
      showToast('Network error starting room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (meetingId: string) => {
    const link = `${window.location.origin}/meetings/${meetingId}/room`;
    navigator.clipboard.writeText(link);
    setCopiedId(meetingId);
    showToast('Meeting room link copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpdateStatus = async (meetingId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      SCHEDULED: 'LIVE',
      LIVE: 'ENDED',
      ENDED: 'SCHEDULED',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'SCHEDULED';

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setMeetings((prev) =>
          prev.map((m) => (m.id === meetingId ? { ...m, status: nextStatus } : m))
        );
        showToast(`Meeting status marked as ${nextStatus}`, 'success');
      }
    } catch {
      showToast('Could not update status', 'error');
    }
  };

  const handleDelete = async (id: string, meetingTitle: string) => {
    if (!window.confirm(`Delete meeting "${meetingTitle}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        showToast('Meeting deleted', 'info');
      } else {
        showToast('Failed to delete meeting', 'error');
      }
    } catch {
      showToast('Delete request failed', 'error');
    }
  };

  const handlePrefillSample = () => {
    setTitle('Quarterly Product & Scalability Review');
    setDescription(
      'Review WebRTC mesh latency benchmarks, automated Kanban action item filing, and Neon DB query optimization.'
    );
    showToast('Sample details populated', 'info');
  };

  const liveRooms = meetings.filter((m) => m.status === 'LIVE');
  const summarizedCount = meetings.filter((m) => Boolean(m.summary)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner & Fast Action Bar */}
      <div className="flex flex-col gap-4 border-b-2 border-ink-950 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
            <Radio className="h-3.5 w-3.5 text-coral animate-pulse" />
            <span>Control Center</span>
          </div>
          <h1 className="mt-1 font-sans text-3xl font-extrabold text-ink-950 sm:text-4xl">
            Meetings &amp; Video Rooms
          </h1>
          <p className="mt-1 text-xs text-ink-600 max-w-xl">
            Launch instant WebRTC rooms, schedule team sessions, and review post-call AI summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleInstantMeeting}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border-2 border-ink-950 bg-coral px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile transition hover:bg-coral-hover active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            <span>Start Instant Room</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ink-900/15 bg-paper-50 p-4 shadow-tactile-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Total Archive</p>
          <p className="mt-1 font-sans text-2xl font-extrabold text-ink-950">{meetings.length}</p>
        </div>
        <div className="rounded-xl border border-ink-900/15 bg-paper-50 p-4 shadow-tactile-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Live Active Rooms</p>
          <p className="mt-1 font-sans text-2xl font-extrabold text-coral">{liveRooms.length}</p>
        </div>
        <div className="rounded-xl border border-ink-900/15 bg-paper-50 p-4 shadow-tactile-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">AI Summarized</p>
          <p className="mt-1 font-sans text-2xl font-extrabold text-emeraldBrand">{summarizedCount}</p>
        </div>
        <div className="rounded-xl border border-ink-900/15 bg-paper-50 p-4 shadow-tactile-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Active Workspaces</p>
          <p className="mt-1 font-sans text-2xl font-extrabold text-ink-950">{workspaces.length}</p>
        </div>
      </div>

      {/* Schedule Meeting Accordion / Box */}
      <section className="mt-6 rounded-2xl border-2 border-ink-950 bg-paper-50 p-5 sm:p-6 shadow-tactile">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 pb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-coral" />
            <h2 className="font-sans text-sm font-extrabold uppercase tracking-wide text-ink-950">
              Schedule or Provision New Meeting
            </h2>
          </div>
          <button
            type="button"
            onClick={handlePrefillSample}
            className="rounded border border-ink-900/20 bg-paper-200 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-700 hover:border-ink-950 hover:text-ink-950 transition"
          >
            Prefill Sample Details
          </button>
        </div>

        <form onSubmit={handleCreateMeeting} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="meeting-title" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1">
              Title *
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Architecture Sync"
              required
              className="w-full rounded-lg border border-ink-900/25 bg-paper-50 p-2.5 text-xs font-medium text-ink-950 placeholder:text-ink-400 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="meeting-ws" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1">
                Workspace
              </label>
              <select
                id="meeting-ws"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full rounded-lg border border-ink-900/25 bg-paper-50 p-2.5 text-xs font-medium text-ink-950 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
              >
                <option value="">Personal / Independent</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="meeting-date" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1">
                Scheduled Time
              </label>
              <input
                id="meeting-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-ink-900/25 bg-paper-50 p-2 text-xs font-medium text-ink-950 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="meeting-desc" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1">
              Description / Agenda Notes
            </label>
            <textarea
              id="meeting-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key discussion topics, expected attendees, or milestones..."
              className="w-full rounded-lg border border-ink-900/25 bg-paper-50 p-2.5 text-xs font-medium text-ink-950 placeholder:text-ink-400 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border-2 border-ink-950 bg-ink-950 px-5 py-2 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile transition hover:bg-ink-800 disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{loading ? 'Creating...' : 'Create Meeting'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Meeting Archive & Search */}
      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sans text-xl font-extrabold text-ink-950">
              Meetings Archive ({meetings.length})
            </h2>
            <p className="text-xs text-ink-500">
              Filter by status or search title and description
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
              <input
                type="search"
                aria-label="Search meetings"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meetings..."
                className="rounded-lg border border-ink-900/20 bg-paper-50 py-1.5 pl-8 pr-3 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
              />
            </div>
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-ink-900/20 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-950 focus:border-ink-950 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">Live Rooms</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {fetching ? (
            <div className="rounded-xl border border-ink-900/10 bg-paper-50 p-8 text-center text-xs font-mono text-ink-500">
              Fetching meeting records...
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-ink-900/20 bg-paper-50 p-8 text-center">
              <p className="font-sans text-sm font-bold text-ink-950">No meetings match your filter</p>
              <p className="mt-1 text-xs text-ink-600">
                Create a new meeting above or launch an instant room to get started.
              </p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="group flex flex-col gap-4 rounded-xl border-2 border-ink-950 bg-paper-50 p-4 shadow-tactile transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title="Click to toggle meeting status"
                      onClick={() => handleUpdateStatus(meeting.id, meeting.status)}
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                        meeting.status === 'LIVE'
                          ? 'bg-coral text-paper-50'
                          : meeting.status === 'ENDED'
                          ? 'bg-paper-200 text-ink-600'
                          : 'bg-emeraldBrand text-paper-50'
                      }`}
                    >
                      {meeting.status} ↻
                    </button>

                    {meeting.workspace && (
                      <span className="flex items-center gap-1 rounded bg-paper-200/80 px-2 py-0.5 font-mono text-[10px] text-ink-700">
                        <Layers className="h-3 w-3 text-ink-500" />
                        {meeting.workspace.name}
                      </span>
                    )}

                    {meeting.summary && (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emeraldBrand">
                        <Sparkles className="h-3 w-3" />
                        AI Summarized
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans text-base font-extrabold text-ink-950">
                    {meeting.title}
                  </h3>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    {meeting.description || 'No description entered.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[11px] text-ink-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-ink-400" />
                      {new Date(meeting.scheduledAt || meeting.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-ink-400" />
                      {meeting._count?.tasks ?? 0} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-ink-400" />
                      {meeting._count?.messages ?? 0} chats
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meeting.id)}
                    className="flex items-center gap-1 rounded-lg border border-ink-900/20 bg-paper-100 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-700 hover:border-ink-950 hover:text-ink-950 transition"
                  >
                    {copiedId === meeting.id ? (
                      <>
                        <Check className="h-3 w-3 text-emeraldBrand" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Link</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/meetings/${meeting.id}/room`}
                    className="flex items-center gap-1.5 rounded-lg border border-ink-950 bg-ink-950 px-3 py-1.5 text-xs font-bold text-paper-50 shadow-tactile-sm transition hover:bg-ink-800"
                  >
                    <Video className="h-3.5 w-3.5 text-coral" />
                    <span>Join Room</span>
                  </Link>

                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-ink-950 bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink-950 shadow-tactile-sm transition hover:bg-paper-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emeraldBrand" />
                    <span>AI Notes</span>
                  </Link>

                  <button
                    type="button"
                    aria-label={`Delete meeting ${meeting.title}`}
                    onClick={() => handleDelete(meeting.id, meeting.title)}
                    className="rounded-lg border border-ink-900/20 p-1.5 text-ink-400 hover:border-coral hover:text-coral transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
