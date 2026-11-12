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
} from 'lucide-react';

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

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      if (res.ok && data.meeting) {
        setMeeting(data.meeting);
        setTranscriptInput(data.meeting.transcript || '');
        setSharedNotes(data.meeting.sharedNotes || '');
        setTasks(data.meeting.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching meeting detail:', err);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (meetingId) fetchMeeting();
  }, [meetingId, fetchMeeting]);

  const toggleDictation = () => {
    if (dictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setDictating(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setStatusMsg('Live speech recognition is supported in Chrome/Edge. You can still paste or type transcript text.');
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
  };

  const handleSummarize = async () => {
    if (!transcriptInput.trim()) {
      setStatusMsg('Please enter or dictate a transcript first.');
      return;
    }
    setSummarizing(true);
    setStatusMsg('');
    try {
      const res = await fetch(`/api/meetings/${meetingId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptInput }),
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
        setStatusMsg(
          `AI Summary generated (${data.source === 'openai' ? 'OpenAI GPT-4o-mini' : 'Smart NLP Engine'}) and ${data.actionItems?.length || 0} action item(s) added to Kanban!`
        );
      } else {
        setStatusMsg(data.error || 'Summarization failed');
      }
    } catch {
      setStatusMsg('Failed to reach summarization API.');
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
      if (res.ok) setStatusMsg('Shared notes saved.');
    } finally {
      setSavingNotes(false);
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
  };

  const handleExportMarkdown = () => {
    if (!meeting) return;
    const md = [
      `# ${meeting.title}`,
      meeting.description ? `\n${meeting.description}\n` : '',
      `## AI Summary\n${meeting.summary || 'Not generated yet.'}`,
      `\n## Action Items\n${
        tasks.length > 0
          ? tasks
              .map(
                (t) =>
                  `- [${t.status === 'DONE' ? 'x' : ' '}] **${t.title}** (${t.priority}) — ${t.assigneeName || 'Unassigned'}`
              )
              .join('\n')
          : '- None'
      }`,
      `\n## Shared Notes\n${sharedNotes || 'None'}`,
      `\n## Transcript\n${transcriptInput || 'None'}`,
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-300">Loading meeting intelligence...</div>;
  }
  if (!meeting) {
    return (
      <div className="p-8 text-center text-slate-300">
        Meeting not found.{' '}
        <Link href="/dashboard" className="text-indigo-400 underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{meeting.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {meeting.description || 'Post-meeting intelligence, transcript, and action items'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/meetings/${meeting.id}/room`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            Join Live Room
          </Link>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export .MD
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print / PDF
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm text-indigo-200">
          {statusMsg}
        </div>
      )}

      {/* Transcript + AI Summary */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Meeting Transcript</h2>
            <button
              type="button"
              onClick={toggleDictation}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                dictating
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {dictating ? (
                <>
                  <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Stop Live Dictation
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                  Live Speech-to-Text
                </>
              )}
            </button>
          </div>
          <textarea
            className="h-56 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="Paste transcript or click 'Live Speech-to-Text' to dictate..."
            value={transcriptInput}
            onChange={(e) => setTranscriptInput(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {summarizing
              ? 'Generating AI Summary & Action Items...'
              : 'Generate AI Summary & Extract Action Items'}
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">
            AI Executive Summary
          </h2>
          {meeting.summary ? (
            <div className="h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300 leading-relaxed">
              {meeting.summary}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
              No summary yet. Add a transcript and click Generate AI Summary to
              extract key points and Kanban action items.
            </div>
          )}
        </div>
      </div>

      {/* Action Items & Shared Notes */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Extracted Action Items ({tasks.length})
            </h2>
            <Link
              href="/workspaces"
              className="text-xs font-medium text-indigo-400 hover:underline"
            >
              Open Kanban Board →
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Action items will appear here automatically after AI summarization.
            </p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => cycleTaskStatus(task)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-left hover:border-indigo-500/40 transition"
                >
                  <div className="flex items-center gap-3">
                    {task.status === 'DONE' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : task.status === 'IN_PROGRESS' ? (
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          task.status === 'DONE'
                            ? 'line-through text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        Assignee: {task.assigneeName || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      task.priority === 'HIGH'
                        ? 'bg-rose-500/15 text-rose-300'
                        : task.priority === 'LOW'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Shared Meeting Notes</h2>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
          <textarea
            className="h-48 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="Collaborative meeting notes, decisions, links..."
            value={sharedNotes}
            onChange={(e) => setSharedNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
