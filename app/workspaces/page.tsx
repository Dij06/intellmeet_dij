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
  CheckCircle2,
  Circle,
  Clock,
  Users,
  X,
  Briefcase,
  Sparkles,
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

const columns: Array<{
  key: Task['status'];
  label: string;
  dotColor: string;
  badgeBg: string;
}> = [
  {
    key: 'TODO',
    label: 'To Do',
    dotColor: 'bg-[var(--text-secondary)]',
    badgeBg: 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    dotColor: 'bg-[var(--warning)]',
    badgeBg: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  },
  {
    key: 'DONE',
    label: 'Done',
    dotColor: 'bg-[var(--success)]',
    badgeBg: 'bg-[var(--success)]/15 text-[var(--success)]',
  },
];

export default function WorkspacesPage() {
  const { showToast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Modals state
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form states
  const [wsName, setWsName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // Filter & Search states
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
        setShowCreateWsModal(false);
        showToast(`Workspace "${data.workspace.name}" created`, 'success');
        await loadWorkspaces();
        setSelectedWsId(data.workspace.id);
      } else {
        showToast(data.error || 'Failed to create workspace', 'error');
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
        setShowInviteModal(false);
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
        showToast('Task added to board', 'success');
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
      showToast(`Task moved to ${status === 'IN_PROGRESS' ? 'In Progress' : status === 'DONE' ? 'Done' : 'To Do'}`, 'info');
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
      {/* Header section with Linear/Notion styling */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <Kanban className="h-4 w-4" />
            <span>Task Board</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Your team&apos;s workspace
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Organize projects, manage tasks and keep track of what your team needs to get done.
          </p>
        </div>

        {/* Task completion progress */}
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Completion</span>
              <span className="font-semibold text-[var(--success)]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-36 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
              <div
                className="h-full bg-[var(--success)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">
              {completedCount} of {tasks.length} tasks resolved
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Selector & Action Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Workspace select dropdown */}
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[var(--text-secondary)] ml-1" />
            <select
              aria-label="Select workspace"
              value={selectedWsId}
              onChange={(e) => setSelectedWsId(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            >
              <option value="">All Workspaces ({workspaces.length})</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.members?.length || 1} members)
                </option>
              ))}
            </select>
          </div>

          {/* Active members pill */}
          {activeWorkspace && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <Users className="h-3.5 w-3.5" />
              <div className="flex items-center gap-1">
                {activeWorkspace.members?.map((m) => (
                  <span
                    key={m.id}
                    title={m.user.email}
                    className="inline-flex items-center rounded bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)]"
                  >
                    {m.user.name || m.user.email.split('@')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            disabled={!selectedWsId}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition disabled:opacity-40"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite teammate</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateWsModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New workspace</span>
          </button>
        </div>
      </div>

      {/* Task Creation & Search / Filter Bar */}
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm space-y-3">
        {/* Quick Task Creation Form */}
        <form onSubmit={handleCreateTask} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Add a new action item or task..."
            required
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
          <input
            type="text"
            value={taskAssignee}
            onChange={(e) => setTaskAssignee(e.target.value)}
            placeholder="Assignee (e.g. Maya)"
            className="sm:w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
          <select
            aria-label="Priority"
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
            className="sm:w-32 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-2 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
          >
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add task</span>
          </button>
        </form>

        {/* Search & Priority Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="search"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Filter tasks by title or assignee..."
              className="rounded-md border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Filter className="h-3.5 w-3.5" />
            <span>Priority:</span>
            <select
              aria-label="Filter priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-page)] px-2 py-0.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3-Column Task Board: To Do | In Progress | Done */}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-sm min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                  <h2 className="text-xs font-semibold tracking-wide text-[var(--text-primary)]">
                    {col.label}
                  </h2>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${col.badgeBg}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Items */}
              <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-secondary)]">
                    <p>No tasks in {col.label}</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-3 shadow-sm hover:border-[var(--text-secondary)]/40 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                          {task.title}
                        </h3>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                            task.priority === 'HIGH'
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : task.priority === 'LOW'
                              ? 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                              : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]/50" />
                          <span>{task.assigneeName || 'Unassigned'}</span>
                        </span>
                        {task.meeting && (
                          <span className="text-[10px] text-[var(--accent)] truncate max-w-[120px]">
                            {task.meeting.title}
                          </span>
                        )}
                      </div>

                      {/* Card Move & Delete Controls */}
                      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2">
                        <div className="flex items-center gap-1">
                          {col.key !== 'TODO' && (
                            <button
                              type="button"
                              aria-label="Move left"
                              title="Move back"
                              onClick={() =>
                                moveTask(task.id, col.key === 'DONE' ? 'IN_PROGRESS' : 'TODO')
                              }
                              className="rounded p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {col.key !== 'DONE' && (
                            <button
                              type="button"
                              aria-label="Move right"
                              title="Move forward"
                              onClick={() =>
                                moveTask(task.id, col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE')
                              }
                              className="rounded p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={`Delete ${task.title}`}
                          title="Delete task"
                          onClick={() => deleteTask(task.id)}
                          className="rounded p-1 text-[var(--text-secondary)]/50 hover:text-[var(--accent)] transition"
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

      {/* Create Workspace Modal */}
      {showCreateWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Create new workspace
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateWsModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Engineering, Design Systems"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWsModal(false)}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 shadow-sm"
                >
                  Create workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Teammate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Invite teammate to {activeWorkspace?.name || 'workspace'}
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Teammate Email
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 shadow-sm"
                >
                  Send invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
