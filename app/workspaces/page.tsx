'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Kanban,
  Plus,
  Users,
  Trash2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';

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

const columns: Array<{ key: Task['status']; label: string; accent: string }> = [
  { key: 'TODO', label: 'To Do', accent: 'border-stone-200 bg-stone-50/70' },
  { key: 'IN_PROGRESS', label: 'In Progress', accent: 'border-amber-200 bg-amber-50/40' },
  { key: 'DONE', label: 'Done', accent: 'border-emerald-200 bg-emerald-50/40' },
];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [wsName, setWsName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const loadWorkspaces = useCallback(async () => {
    const res = await fetch('/api/workspace');
    const data = await res.json();
    if (data.workspaces) {
      setWorkspaces(data.workspaces);
      if (!selectedWsId && data.workspaces.length > 0) {
        setSelectedWsId(data.workspaces[0].id);
      }
    }
  }, [selectedWsId]);

  const loadTasks = useCallback(async () => {
    const url = selectedWsId
      ? `/api/tasks?workspaceId=${selectedWsId}`
      : '/api/tasks';
    const res = await fetch(url);
    const data = await res.json();
    if (data.tasks) setTasks(data.tasks);
  }, [selectedWsId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: wsName.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.workspace) {
      setWsName('');
      await loadWorkspaces();
      setSelectedWsId(data.workspace.id);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsId || !memberEmail.trim()) return;
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
      loadWorkspaces();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
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
      loadTasks();
    }
  };

  const moveTask = async (taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  const activeWorkspace = workspaces.find((w) => w.id === selectedWsId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
          <Kanban className="h-7 w-7 text-emerald-700" aria-hidden="true" />
          Team Workspaces &amp; Kanban Board
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage team members and track action items extracted from meetings.
        </p>
      </div>

      {/* Workspace Controls */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <label htmlFor="ws-select" className="block text-xs font-medium text-stone-600 mb-1.5">
            Active Workspace
          </label>
          <select
            id="ws-select"
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-sm text-stone-900"
          >
            <option value="">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.members.length} members)
              </option>
            ))}
          </select>

          {activeWorkspace && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeWorkspace.members.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-700"
                >
                  <Users className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                  {m.user.name || m.user.email}
                </span>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleCreateWorkspace}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2.5"
        >
          <label htmlFor="new-ws" className="block text-xs font-medium text-stone-600">
            Create New Workspace
          </label>
          <div className="flex gap-2">
            <input
              id="new-ws"
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Mobile Engineering"
              className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </form>

        <form
          onSubmit={handleInviteMember}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2.5"
        >
          <label htmlFor="invite-email" className="block text-xs font-medium text-stone-600">
            Invite Member to Workspace
          </label>
          <div className="flex gap-2">
            <input
              id="invite-email"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
            <button
              type="submit"
              disabled={!selectedWsId}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Add Task Bar */}
      <form
        onSubmit={handleCreateTask}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Add a new Kanban task..."
          className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          required
        />
        <input
          type="text"
          value={taskAssignee}
          onChange={(e) => setTaskAssignee(e.target.value)}
          placeholder="Assignee (e.g. Alex)"
          className="sm:w-44 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        />
        <select
          aria-label="Task priority"
          value={taskPriority}
          onChange={(e) =>
            setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
          }
          className="sm:w-32 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        >
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </form>

      {/* Kanban Columns */}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-2xl border ${col.accent} p-4`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-4 text-center text-xs text-stone-400">
                    No tasks in {col.label}
                  </p>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-stone-900">
                          {task.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.priority === 'LOW'
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-stone-500">
                        Assignee: {task.assigneeName || 'Unassigned'}
                      </p>

                      {task.meeting && (
                        <p className="mt-1 text-[11px] font-medium text-emerald-700">
                          From: {task.meeting.title}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                        <div className="flex gap-1.5">
                          {col.key !== 'TODO' && (
                            <button
                              type="button"
                              aria-label="Move left"
                              onClick={() =>
                                moveTask(
                                  task.id,
                                  col.key === 'DONE' ? 'IN_PROGRESS' : 'TODO'
                                )
                              }
                              className="rounded-lg border border-stone-200 p-1 text-stone-600 hover:bg-stone-100"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {col.key !== 'DONE' && (
                            <button
                              type="button"
                              aria-label="Move right"
                              onClick={() =>
                                moveTask(
                                  task.id,
                                  col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE'
                                )
                              }
                              className="rounded-lg border border-stone-200 p-1 text-stone-600 hover:bg-stone-100"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Delete task ${task.title}`}
                          onClick={() => deleteTask(task.id)}
                          className="text-stone-400 hover:text-rose-600"
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
