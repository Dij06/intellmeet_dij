'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Kanban,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Search,
  Filter,
} from 'lucide-react';
import { useToast } from '@/app/components/Toast';

interface WorkspaceMember {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  members: WorkspaceMember[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeName: string | null;
  workspaceId: string | null;
  meeting?: { id: string; title: string } | null;
}

const columns: Array<{ key: Task['status']; label: string; headerColor: string }> = [
  { key: 'TODO', label: 'To Do', headerColor: 'bg-paper-200 text-ink-950' },
  { key: 'IN_PROGRESS', label: 'In Progress', headerColor: 'bg-amberBrand text-paper-50' },
  { key: 'DONE', label: 'Done / Verified', headerColor: 'bg-emeraldBrand text-paper-50' },
];

export default function WorkspacesPage() {
  const { showToast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [wsName, setWsName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const [taskSearch, setTaskSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace');
      const data = await res.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        if (!selectedWsId && data.workspaces.length > 0) {
          setSelectedWsId(data.workspaces[0].id);
        }
      }
    } catch {
      showToast('Error loading workspaces', 'error');
    }
  }, [selectedWsId, showToast]);

  const loadTasks = useCallback(async () => {
    try {
      const url = selectedWsId
        ? `/api/tasks?workspaceId=${selectedWsId}`
        : '/api/tasks';
      const res = await fetch(url);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch {
      showToast('Error loading tasks', 'error');
    }
  }, [selectedWsId, showToast]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wsName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        setWsName('');
        showToast(`Workspace "${data.workspace.name}" created`, 'success');
        await loadWorkspaces();
        setSelectedWsId(data.workspace.id);
      }
    } catch {
      showToast('Workspace creation failed', 'error');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsId || !memberEmail.trim()) {
      showToast('Select a workspace and enter an email first', 'error');
      return;
    }
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWsId,
          email: memberEmail.trim(),
        }),
      });
      if (res.ok) {
        setMemberEmail('');
        showToast(`Teammate invited to workspace`, 'success');
        loadWorkspaces();
      } else {
        showToast('Failed to invite member', 'error');
      }
    } catch {
      showToast('Network error inviting member', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          assigneeName: taskAssignee.trim() || 'Team Member',
          priority: taskPriority,
          workspaceId: selectedWsId || null,
        }),
      });
      if (res.ok) {
        setTaskTitle('');
        setTaskAssignee('');
        showToast('Kanban task added', 'success');
        loadTasks();
      }
    } catch {
      showToast('Task creation failed', 'error');
    }
  };

  const moveTask = async (taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      showToast(`Task moved to ${status}`, 'info');
    } catch {
      showToast('Failed to sync task status', 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    showToast('Task deleted from board', 'info');
  };

  const activeWorkspace = workspaces.find((w) => w.id === selectedWsId);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      !taskSearch.trim() ||
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.assigneeName || '').toLowerCase().includes(taskSearch.toLowerCase());
    const matchPriority =
      priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 border-b-2 border-ink-950 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-coral">
            <Kanban className="h-3.5 w-3.5" />
            <span>Project Management Engine</span>
          </div>
          <h1 className="mt-1 font-sans text-3xl font-extrabold text-ink-950 sm:text-4xl">
            Team Workspaces &amp; Kanban
          </h1>
          <p className="mt-1 text-xs text-ink-600">
            Action items auto-filed from meetings or created manually across team workspaces.
          </p>
        </div>

        {/* Progress Bar Widget */}
        <div className="rounded-xl border-2 border-ink-950 bg-paper-50 p-3 shadow-tactile-sm min-w-[200px]">
          <div className="flex justify-between font-mono text-[10px] font-bold uppercase text-ink-600 mb-1">
            <span>Velocity</span>
            <span className="text-emeraldBrand">{progressPercent}% Done</span>
          </div>
          <div className="h-2 w-full rounded-full bg-paper-200 overflow-hidden border border-ink-900/10">
            <div
              className="h-full bg-emeraldBrand transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[9px] text-ink-500">
            {completedCount} of {tasks.length} action items resolved
          </p>
        </div>
      </div>

      {/* Workspace Management Bar */}
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        {/* Workspace Selector */}
        <div className="lg:col-span-4 rounded-xl border-2 border-ink-950 bg-paper-50 p-4 shadow-tactile">
          <label htmlFor="ws-select" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1.5">
            Active Workspace
          </label>
          <select
            id="ws-select"
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(e.target.value)}
            className="w-full rounded-lg border border-ink-900/30 bg-paper-100 p-2 text-xs font-bold text-ink-950 focus:border-ink-950 focus:outline-none"
          >
            <option value="">All Workspaces ({workspaces.length})</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.members?.length || 1} members)
              </option>
            ))}
          </select>

          {activeWorkspace && (
            <div className="mt-3 flex flex-wrap gap-1 border-t border-ink-900/10 pt-2.5">
              <span className="font-mono text-[10px] text-ink-500 self-center mr-1">Members:</span>
              {activeWorkspace.members?.map((m) => (
                <span
                  key={m.id}
                  className="rounded bg-paper-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-800"
                >
                  {m.user.name || m.user.email}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Create Workspace */}
        <form
          onSubmit={handleCreateWorkspace}
          className="lg:col-span-4 rounded-xl border-2 border-ink-950 bg-paper-50 p-4 shadow-tactile"
        >
          <label htmlFor="new-ws" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1.5">
            Create Workspace
          </label>
          <div className="flex gap-2">
            <input
              id="new-ws"
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Design Systems"
              className="flex-1 rounded-lg border border-ink-900/30 bg-paper-100 px-3 py-1.5 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg border border-ink-950 bg-ink-950 px-3 py-1.5 text-xs font-bold text-paper-50 shadow-tactile-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create</span>
            </button>
          </div>
        </form>

        {/* Invite Member */}
        <form
          onSubmit={handleInviteMember}
          className="lg:col-span-4 rounded-xl border-2 border-ink-950 bg-paper-50 p-4 shadow-tactile"
        >
          <label htmlFor="invite-email" className="block font-mono text-[11px] font-bold uppercase text-ink-700 mb-1.5">
            Add Team Member
          </label>
          <div className="flex gap-2">
            <input
              id="invite-email"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 rounded-lg border border-ink-900/30 bg-paper-100 px-3 py-1.5 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!selectedWsId}
              className="flex items-center gap-1 rounded-lg border border-ink-950 bg-emeraldBrand px-3 py-1.5 text-xs font-bold text-paper-50 shadow-tactile-sm disabled:opacity-40"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite</span>
            </button>
          </div>
        </form>
      </div>

      {/* Task Creation & Search Controls Bar */}
      <div className="mt-6 rounded-2xl border-2 border-ink-950 bg-paper-50 p-4 shadow-tactile space-y-3">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Add new task directly to board..."
            required
            className="flex-1 rounded-lg border border-ink-900/25 bg-paper-100 px-3 py-2 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
          />
          <input
            type="text"
            value={taskAssignee}
            onChange={(e) => setTaskAssignee(e.target.value)}
            placeholder="Assignee (e.g. Maya)"
            className="sm:w-40 rounded-lg border border-ink-900/25 bg-paper-100 px-3 py-2 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
          />
          <select
            aria-label="Priority"
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
            className="sm:w-28 rounded-lg border border-ink-900/25 bg-paper-100 px-2 py-2 text-xs font-semibold text-ink-950 focus:border-ink-950 focus:outline-none"
          >
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-ink-950 bg-ink-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile-sm transition hover:bg-ink-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </button>
        </form>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-2.5">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <input
              type="search"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Filter tasks by keyword or owner..."
              className="rounded border border-ink-900/20 bg-paper-50 px-2 py-1 text-xs text-ink-950 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Filter className="h-3 w-3 text-ink-500" />
            <span className="text-ink-600">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded border border-ink-900/20 bg-paper-50 px-2 py-0.5 text-xs font-bold text-ink-950 focus:outline-none"
            >
              <option value="ALL">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3 Kanban Columns */}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col rounded-2xl border-2 border-ink-950 bg-paper-50 shadow-tactile overflow-hidden min-h-[460px]"
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between border-b-2 border-ink-950 px-4 py-3 ${col.headerColor}`}>
                <h2 className="font-sans text-xs font-black uppercase tracking-wider">
                  {col.label}
                </h2>
                <span className="rounded-full border border-current px-2 py-0.2 font-mono text-[10px] font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 p-3.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ink-900/20 bg-paper-100/50 p-6 text-center font-mono text-xs text-ink-400">
                    No items in {col.label}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border-2 border-ink-950 bg-paper-50 p-3.5 shadow-tactile-sm transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-sans text-xs font-bold text-ink-950 leading-snug">
                          {task.title}
                        </h3>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold shrink-0 ${
                            task.priority === 'HIGH'
                              ? 'bg-coral-subtle text-coral-dark border border-coral/30'
                              : task.priority === 'LOW'
                              ? 'bg-paper-200 text-ink-600'
                              : 'bg-amberBrand/15 text-amberBrand border border-amberBrand/30'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-ink-500">
                        <span>Assignee: {task.assigneeName || 'Unassigned'}</span>
                        {task.meeting && (
                          <span className="text-[10px] text-coral truncate max-w-[120px]">
                            {task.meeting.title}
                          </span>
                        )}
                      </div>

                      {/* Card Shift Controls */}
                      <div className="mt-3 flex items-center justify-between border-t border-ink-900/10 pt-2">
                        <div className="flex gap-1.5">
                          {col.key !== 'TODO' && (
                            <button
                              type="button"
                              aria-label="Move left"
                              onClick={() =>
                                moveTask(task.id, col.key === 'DONE' ? 'IN_PROGRESS' : 'TODO')
                              }
                              className="rounded border border-ink-900/20 p-1 text-ink-700 hover:border-ink-950 hover:bg-paper-200 transition"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                          )}
                          {col.key !== 'DONE' && (
                            <button
                              type="button"
                              aria-label="Move right"
                              onClick={() =>
                                moveTask(task.id, col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE')
                              }
                              className="rounded border border-ink-900/20 p-1 text-ink-700 hover:border-ink-950 hover:bg-paper-200 transition"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={`Delete ${task.title}`}
                          onClick={() => deleteTask(task.id)}
                          className="text-ink-300 hover:text-coral transition p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
