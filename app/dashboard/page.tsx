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
  Calendar,
  X,
  ArrowRight,
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Filters
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
        setShowScheduleModal(false);
        showToast('Meeting scheduled successfully', 'success');
        fetchMeetings();
      } else {
        showToast('Failed to schedule meeting', 'error');
      }
    } catch {
      showToast('Network error creating meeting', 'error');
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
          title: `Instant Sync • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
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
    showToast('Meeting link copied to clipboard', 'info');
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
        showToast(`Meeting status updated to ${nextStatus}`, 'success');
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

  const liveRooms = meetings.filter((m) => m.status === 'LIVE');
  const summarizedCount = meetings.filter((m) => Boolean(m.summary)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header section with Linear/Notion styling */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Meetings Control</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Meetings &amp; Video Rooms
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Launch instant WebRTC rooms, schedule team sessions, and review post-call AI summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition shadow-sm"
          >
            <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
            <span>Schedule meeting</span>
          </button>

          <button
            type="button"
            onClick={handleInstantMeeting}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition shadow-sm disabled:opacity-50"
          >
            <Video className="h-4 w-4" />
            <span>Start instant room</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">Total Meetings</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{meetings.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">Active Live Rooms</p>
          <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{liveRooms.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">AI Summarized</p>
          <p className="mt-1 text-2xl font-bold text-[var(--success)]">{summarizedCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">Workspaces</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{workspaces.length}</p>
        </div>
      </div>

      {/* Meeting Archive & Search */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Meetings Archive
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Filter by status or search title and description
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <input
                type="search"
                aria-label="Search meetings"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meetings..."
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">Live Rooms</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        {/* Meeting list */}
        <div className="mt-4 space-y-3">
          {fetching ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-secondary)]">
              Loading meetings...
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No meetings found</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Start an instant room or schedule a new meeting above.
              </p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="group flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm hover:border-[var(--text-secondary)]/40 transition sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title="Click to cycle status"
                      onClick={() => handleUpdateStatus(meeting.id, meeting.status)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                        meeting.status === 'LIVE'
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                          : meeting.status === 'ENDED'
                          ? 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                          : 'bg-[var(--success)]/15 text-[var(--success)]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          meeting.status === 'LIVE'
                            ? 'bg-[var(--accent)] animate-pulse'
                            : meeting.status === 'ENDED'
                            ? 'bg-[var(--text-secondary)]'
                            : 'bg-[var(--success)]'
                        }`}
                      />
                      <span>{meeting.status}</span>
                    </button>

                    {meeting.workspace && (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                        <Layers className="h-3 w-3" />
                        {meeting.workspace.name}
                      </span>
                    )}

                    {meeting.summary && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
                        <Sparkles className="h-3 w-3" />
                        AI Summary
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {meeting.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {meeting.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      {new Date(meeting.scheduledAt || meeting.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 opacity-60" />
                      {meeting._count?.tasks ?? 0} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 opacity-60" />
                      {meeting._count?.messages ?? 0} chats
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meeting.id)}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                  >
                    {copiedId === meeting.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/meetings/${meeting.id}/room`}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm"
                  >
                    <Video className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Join Room</span>
                  </Link>

                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[var(--success)]" />
                    <span>Minutes</span>
                  </Link>

                  <button
                    type="button"
                    aria-label={`Delete meeting ${meeting.title}`}
                    title="Delete meeting"
                    onClick={() => handleDelete(meeting.id, meeting.title)}
                    className="rounded-lg p-1.5 text-[var(--text-secondary)]/50 hover:text-[var(--accent)] hover:bg-[var(--bg-surface-hover)] transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Schedule new meeting
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Architecture Sync"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Workspace
                  </label>
                  <select
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
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
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Description / Agenda Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key discussion topics, expected attendees, or milestones..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
