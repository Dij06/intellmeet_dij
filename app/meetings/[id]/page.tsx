'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Mic,
  MicOff,
  Download,
  Printer,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  FileText,
  FileDown,
} from 'lucide-react';
import { useToast } from '@/app/components/Toast';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeName: string | null;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  status: string;
  transcript: string | null;
  summary: string | null;
  sharedNotes: string | null;
  tasks?: Task[];
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = params?.id as string;
  const { showToast } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [dictating, setDictating] = useState(false);

  // Edit metadata
  const [editingMeta, setEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Task adder
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      if (res.ok && data.meeting) {
        setMeeting(data.meeting);
        setEditTitle(data.meeting.title);
        setEditDescription(data.meeting.description || '');
        setTranscriptInput(data.meeting.transcript || '');
        setSharedNotes(data.meeting.sharedNotes || '');
        setTasks(data.meeting.tasks || []);
      }
    } catch {
      showToast('Error loading meeting details', 'error');
    } finally {
      setLoading(false);
    }
  }, [meetingId, showToast]);

  useEffect(() => {
    if (meetingId) fetchMeeting();
  }, [meetingId, fetchMeeting]);

  const toggleDictation = () => {
    if (dictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setDictating(false);
      showToast('Live dictation paused', 'info');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      showToast('Speech Recognition requires Chrome or Edge browser.', 'error');
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last?.[0]?.transcript?.trim();
      if (text) {
        setTranscriptInput((prev) => (prev ? `${prev}\n${text}` : text));
      }
    };
    recognition.onerror = () => setDictating(false);
    recognition.onend = () => setDictating(false);
    recognition.start();
    recognitionRef.current = recognition;
    setDictating(true);
    showToast('Listening... Speak into your microphone', 'success');
  };

  const handleSummarize = async () => {
    if (!transcriptInput.trim()) {
      showToast('Please type, paste, or dictate a transcript first.', 'error');
      return;
    }
    setSummarizing(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeeting((prev) =>
          prev
            ? { ...prev, summary: data.summary, transcript: transcriptInput, status: 'ENDED' }
            : null
        );
        if (Array.isArray(data.actionItems)) {
          setTasks((prev) => [...data.actionItems, ...prev]);
        }
        showToast(
          `AI summary complete! Extracted ${data.actionItems?.length || 0} action items.`,
          'success'
        );
      } else {
        showToast(data.error || 'Summarization failed', 'error');
      }
    } catch {
      showToast('Network error during summarization', 'error');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedNotes }),
      });
      if (res.ok) {
        showToast('Collaborative notes saved', 'success');
      } else {
        showToast('Failed to save notes', 'error');
      }
    } catch {
      showToast('Network error saving notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setMeeting((prev) =>
          prev ? { ...prev, title: editTitle.trim(), description: editDescription.trim() || null } : null
        );
        setEditingMeta(false);
        showToast('Meeting updated', 'success');
      }
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          assigneeName: newTaskAssignee.trim() || 'Unassigned',
          priority: newTaskPriority,
          meetingId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setNewTaskTitle('');
        setNewTaskAssignee('');
        showToast('Action item added', 'success');
      }
    } catch {
      showToast('Failed to create task', 'error');
    }
  };

  const cycleTaskStatus = async (task: Task) => {
    const nextStatus: Record<Task['status'], Task['status']> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'TODO',
    };
    const status = nextStatus[task.status];
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    showToast(`Task moved to ${status}`, 'info');
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    showToast('Task removed', 'info');
  };

  const handleExportMarkdown = () => {
    if (!meeting) return;
    const md = [
      `# ${meeting.title}`,
      meeting.description ? `\n> ${meeting.description}\n` : '',
      `## Executive Summary\n${meeting.summary || 'No summary generated yet.'}`,
      `\n## Extracted Action Items (${tasks.length})\n${
        tasks.length > 0
          ? tasks
              .map(
                (t) =>
                  `- [${t.status === 'DONE' ? 'x' : ' '}] **${t.title}** (${t.priority}) — Owner: ${t.assigneeName || 'Unassigned'}`
              )
              .join('\n')
          : '- None'
      }`,
      `\n## Meeting Notes\n${sharedNotes || 'None'}`,
      `\n## Raw Transcript\n${transcriptInput || 'None'}`,
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Markdown notes exported', 'success');
  };

  const handleExportWord = () => {
    if (!meeting) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${meeting.title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
        h1 { color: #111; font-size: 24pt; margin-bottom: 4px; }
        .meta { color: #666; font-size: 10pt; margin-bottom: 24px; }
        h2 { color: #FF513D; font-size: 14pt; border-bottom: 1px solid #E5E2DC; padding-bottom: 4px; margin-top: 20px; }
        p { font-size: 11pt; margin-bottom: 12px; }
        ul { margin-top: 4px; }
        li { font-size: 11pt; margin-bottom: 6px; }
      </style>
      </head>
      <body>
        <h1>${meeting.title}</h1>
        <p class="meta">Status: ${meeting.status} • Generated by IntellMeet Platform</p>
        ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
        <h2>Executive Summary</h2>
        <p>${(meeting.summary || 'No summary generated.').replace(/\n/g, '<br/>')}</p>
        <h2>Action Items (${tasks.length})</h2>
        <ul>
          ${
            tasks.length > 0
              ? tasks
                  .map(
                    (t) =>
                      `<li><strong>[${t.status}]</strong> ${t.title} (Priority: ${t.priority}) — Owner: ${t.assigneeName || 'Unassigned'}</li>`
                  )
                  .join('')
              : '<li>None</li>'
          }
        </ul>
        <h2>Collaborative Notes</h2>
        <p>${(sharedNotes || 'None').replace(/\n/g, '<br/>')}</p>
        <h2>Meeting Transcript</h2>
        <p>${(transcriptInput || 'None').replace(/\n/g, '<br/>')}</p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-minutes.doc`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Word document exported', 'success');
  };

  const handlePrefillTranscript = (type: 'sprint' | 'client') => {
    if (type === 'sprint') {
      setTranscriptInput(
        'Dev Lead: The WebRTC video room has low latency tested across browsers.\nUX Designer: I updated the light/dark theme system with warm off-white and charcoal palettes.\nProduct Owner: Please verify live speech transcription in browser and auto-file action items.'
      );
    } else {
      setTranscriptInput(
        'Client Director: We need the security report demonstrating session handling and route rate-limiting.\nEngineering Lead: NextAuth handles JWT session tokens with bcrypt encryption, and API routes have sliding window rate limits.\nQA Lead: I will export the audit report before final release.'
      );
    }
    showToast('Sample transcript loaded', 'info');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-12 text-center text-xs text-[var(--text-secondary)]">
        Loading meeting details...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <p className="text-base font-semibold text-[var(--text-primary)]">Meeting not found</p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block rounded-lg bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-[var(--bg-page)]"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Meetings</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/meetings/${meeting.id}/room`}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition shadow-sm"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Launch Live Room</span>
          </Link>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Word .doc</span>
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Markdown</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Meeting Title Banner */}
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
        {editingMeta ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-2 text-base font-bold text-[var(--text-primary)] focus:outline-none"
              placeholder="Meeting title"
            />
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-2 text-xs text-[var(--text-primary)] focus:outline-none"
              placeholder="Meeting agenda / description"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveMetadata}
                className="flex items-center gap-1 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)]"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingMeta(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-primary)]">
                  {meeting.status}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  ID: {meeting.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {meeting.title}
              </h1>
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                {meeting.description || 'No description provided.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingMeta(true)}
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column (Transcript & Ingestion) + Right Column (AI Intelligence & Tasks) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Column: Transcript Ingestion */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Meeting Transcript
                </h2>
              </div>
              <button
                type="button"
                onClick={toggleDictation}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  dictating
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white animate-pulse'
                    : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {dictating ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    <span>Pause Speech Ingestion</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Live Dictation</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick prefill helpers */}
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Sample:</span>
              <button
                type="button"
                onClick={() => handlePrefillTranscript('sprint')}
                className="hover:text-[var(--text-primary)] underline"
              >
                Sprint Sync
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handlePrefillTranscript('client')}
                className="hover:text-[var(--text-primary)] underline"
              >
                Security Audit
              </button>
            </div>

            <textarea
              rows={11}
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="Paste conversation notes or speak directly with Live Dictation..."
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-3 text-xs leading-relaxed text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            />

            <button
              type="button"
              onClick={handleSummarize}
              disabled={summarizing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] py-2.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <span>
                {summarizing ? 'Generating AI Summary...' : 'Generate AI Summary & Extract Action Items'}
              </span>
            </button>
          </div>

          {/* Shared Notes Box */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Collaborative Meeting Notes
              </h2>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              placeholder="Key decisions, references, or links discussed in this meeting..."
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Right Column: AI Executive Summary + Action Items */}
        <div className="lg:col-span-6 space-y-4">
          {/* Executive Summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--success)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  AI Executive Summary
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {meeting.summary ? 'Synthesized' : 'Awaiting Transcript'}
              </span>
            </div>

            {meeting.summary ? (
              <div className="mt-3 h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-4 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {meeting.summary}
              </div>
            ) : (
              <div className="mt-3 flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-page)]/50 p-6 text-center">
                <Sparkles className="h-6 w-6 text-[var(--text-secondary)]/40 mb-2" />
                <p className="text-xs font-semibold text-[var(--text-primary)]">No summary generated yet</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-xs">
                  Paste or record a transcript on the left and click Generate AI Summary.
                </p>
              </div>
            )}
          </div>

          {/* Action Items List & Creator */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Extracted Action Items ({tasks.length})
                </h2>
              </div>
              <Link
                href="/workspaces"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Open Workspace →
              </Link>
            </div>

            {/* Quick Task Adder */}
            <form onSubmit={handleCreateTask} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add action item..."
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="Owner"
                className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <select
                aria-label="Priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-2 py-1.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Med</option>
                <option value="LOW">Low</option>
              </select>
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-secondary)]">
                  No action items recorded yet. Auto-extract from transcript or add one above.
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-2.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--text-secondary)]/40"
                  >
                    <button
                      type="button"
                      onClick={() => cycleTaskStatus(task)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      {task.status === 'DONE' ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
                      ) : task.status === 'IN_PROGRESS' ? (
                        <Clock className="h-4 w-4 text-[var(--warning)] shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-[var(--text-secondary)]/50 shrink-0" />
                      )}
                      <div>
                        <p className={task.status === 'DONE' ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          Owner: {task.assigneeName || 'Unassigned'} • Status: {task.status}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          task.priority === 'HIGH'
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : task.priority === 'LOW'
                            ? 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                            : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete task ${task.title}`}
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-[var(--text-secondary)]/50 hover:text-[var(--accent)] transition p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
