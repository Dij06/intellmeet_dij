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
  Calendar,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';

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
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setFetching(false);
    }
  }, [search, statusFilter]);

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
          title,
          description: description || null,
          workspaceId: workspaceId || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setScheduledAt('');
        fetchMeetings();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
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
          title: `Instant Sync (${new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })})`,
          description: 'Instant WebRTC video & AI collaboration room',
          status: 'LIVE',
          workspaceId: workspaces[0]?.id || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.meeting?.id) {
        router.push(`/meetings/${data.meeting.id}/room`);
      }
    } catch (error) {
      console.error('Error starting instant meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const liveCount = meetings.filter((m) => m.status === 'LIVE').length;
  const summarizedCount = meetings.filter((m) => Boolean(m.summary)).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Meetings Hub
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Schedule sessions, launch live WebRTC rooms, or review AI summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstantMeeting}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition"
        >
          <Video className="h-4 w-4" aria-hidden="true" />
          Start Instant Meeting
        </button>
      </div>

      {/* Quick Summary Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">Total Meetings</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{meetings.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">Live Rooms Now</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{liveCount}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">AI Summarized</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{summarizedCount}</p>
        </div>
      </div>

      {/* Create / Schedule Meeting Form */}
      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
          <Plus className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Schedule a New Meeting
        </h2>
        <form onSubmit={handleCreateMeeting} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="meeting-title"
              className="block text-xs font-medium text-stone-600 mb-1"
            >
              Meeting Title *
            </label>
            <input
              id="meeting-title"
              type="text"
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Architecture Review"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="meeting-ws"
                className="block text-xs font-medium text-stone-600 mb-1"
              >
                Workspace
              </label>
              <select
                id="meeting-ws"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Personal / General</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="meeting-date"
                className="block text-xs font-medium text-stone-600 mb-1"
              >
                Date &amp; Time
              </label>
              <input
                id="meeting-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="meeting-desc"
              className="block text-xs font-medium text-stone-600 mb-1"
            >
              Agenda / Description
            </label>
            <textarea
              id="meeting-desc"
              rows={2}
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key topics, goals, or participants..."
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </section>

      {/* Search & Filter */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-stone-900">
            Meeting History &amp; Rooms
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4 text-stone-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search meetings"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meetings..."
                className="rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <select
              aria-label="Filter by meeting status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">Live</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {fetching ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading meetings...
            </p>
          ) : meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
              No meetings found. Schedule one above or start an instant meeting!
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        meeting.status === 'LIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : meeting.status === 'ENDED'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {meeting.status}
                    </span>
                    {meeting.workspace && (
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        {meeting.workspace.name}
                      </span>
                    )}
                    {meeting.summary && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        AI Summarized
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-stone-900">
                    {meeting.title}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {meeting.description || 'No agenda provided'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(
                        meeting.scheduledAt || meeting.createdAt
                      ).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {meeting._count?.tasks ?? 0} action items
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {meeting._count?.messages ?? 0} messages
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/meetings/${meeting.id}/room`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                  >
                    <Video className="h-3.5 w-3.5" aria-hidden="true" />
                    Join Room
                  </Link>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    Summary &amp; Notes
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${meeting.title}`}
                    onClick={() => handleDelete(meeting.id)}
                    className="rounded-xl border border-stone-200 p-2 text-stone-400 hover:border-rose-300 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
