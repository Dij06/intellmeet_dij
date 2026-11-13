'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  CircleDot,
  Square,
  PhoneOff,
  Send,
  Users,
  MessageSquare,
  FileText,
  Sparkles,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/app/components/Toast';

interface ChatMessage {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

interface PeerInfo {
  peerId: string;
  name: string;
  muted: boolean;
  cameraOff: boolean;
  typing: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
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

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params?.id as string;
  const { showToast } = useToast();

  const [meetingTitle, setMeetingTitle] = useState('Live Meeting Room');
  const [displayName, setDisplayName] = useState('Demo User');
  const [peerId] = useState(() => `peer-${Math.random().toString(36).slice(2, 9)}`);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'participants'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [sharedNotes, setSharedNotes] = useState('');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const loadRoomData = useCallback(async () => {
    try {
      const [mtgRes, msgRes] = await Promise.all([
        fetch(`/api/meetings/${meetingId}`),
        fetch(`/api/meetings/${meetingId}/messages`),
      ]);
      const mtgData = await mtgRes.json();
      if (mtgRes.ok && mtgData.meeting) {
        setMeetingTitle(mtgData.meeting.title);
        setSharedNotes(mtgData.meeting.sharedNotes || '');
      }
      const msgData = await msgRes.json();
      if (msgRes.ok && msgData.messages) {
        setMessages(msgData.messages);
      }
    } catch {
      // Ignore
    }
  }, [meetingId]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Media initialization
  useEffect(() => {
    let active = true;
    async function initMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraOff(true);
        showToast('Camera/Mic unsupported in this environment. Audio-less demo mode.', 'info');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        setCameraOff(true);
        showToast('No camera detected or permission denied. Running in demo mode.', 'info');
      }
    }
    initMedia();

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
    };
  }, [showToast]);

  // Multi-tab broadcast channel + signal polling
  useEffect(() => {
    const channel = new BroadcastChannel(`intellmeet-room-${meetingId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (event.data?.type === 'chat' && event.data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.data.message.id)) return prev;
          return [...prev, event.data.message];
        });
      }
    };

    const interval = setInterval(async () => {
      try {
        await fetch(`/api/meetings/${meetingId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            peerId,
            name: displayName,
            muted,
            cameraOff,
            typing,
          }),
        });
        const [sigRes, msgRes] = await Promise.all([
          fetch(`/api/meetings/${meetingId}/signal?peerId=${peerId}`),
          fetch(`/api/meetings/${meetingId}/messages`),
        ]);
        const sigData = await sigRes.json();
        if (sigData.peers) setPeers(sigData.peers);
        const msgData = await msgRes.json();
        if (msgData.messages) setMessages(msgData.messages);
      } catch {
        // Ignore
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      channel.close();
      fetch(`/api/meetings/${meetingId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', peerId }),
      }).catch(() => {});
    };
  }, [meetingId, peerId, displayName, muted, cameraOff, typing]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    showToast(next ? 'Microphone muted' : 'Microphone unmuted', 'info');
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    showToast(next ? 'Camera stopped' : 'Camera started', 'info');
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      showToast('Screen sharing ended', 'info');
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        showToast('Screen sharing not supported on this device/browser', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setScreenSharing(true);
      showToast('Screen sharing active', 'success');

      stream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    } catch {
      showToast('Screen share cancelled', 'info');
    }
  };

  const toggleRecording = () => {
    if (recording) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      setRecording(false);
      showToast('Meeting recording saved and downloaded', 'success');
      return;
    }

    const stream = screenStreamRef.current || localStreamRef.current;
    if (!stream) {
      showToast('No active stream to record', 'error');
      return;
    }

    try {
      recordedChunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-${meetingId.slice(0, 8)}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecording(true);
      showToast('Recording started. Video will download upon stopping.', 'info');
    } catch {
      showToast('Failed to start recorder in this browser', 'error');
    }
  };

  const toggleCaptions = () => {
    if (captionsOn) {
      recognitionRef.current?.stop();
      setCaptionsOn(false);
      showToast('Live captions stopped', 'info');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      showToast('Browser Speech Recognition not supported in this browser.', 'error');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const line = last?.[0]?.transcript?.trim();
        if (line) {
          setTranscriptLines((prev) => [...prev.slice(-15), line]);
        }
      };
      rec.onerror = () => setCaptionsOn(false);
      rec.onend = () => setCaptionsOn(false);
      rec.start();
      recognitionRef.current = rec;
      setCaptionsOn(true);
      showToast('Live speech captions active', 'success');
    } catch {
      showToast('Could not initialize speech recognizer', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput.trim();
    setChatInput('');
    setTyping(false);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderName: displayName }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        channelRef.current?.postMessage({ type: 'chat', message: data.message });
      }
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const title = quickTaskTitle.trim();
    setQuickTaskTitle('');
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          meetingId,
          assigneeName: displayName,
          priority: 'MEDIUM',
        }),
      });
      showToast(`Task "${title}" dispatched to workspace board!`, 'success');
    } catch {
      showToast('Failed to create task', 'error');
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    showToast('Meeting link copied! Share with colleagues to join.', 'success');
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleLeaveAndSummarize = async () => {
    if (transcriptLines.length > 0 || sharedNotes.trim()) {
      await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptLines.join('\n') || undefined,
          sharedNotes: sharedNotes || undefined,
          status: 'ENDED',
        }),
      });
    }
    showToast('Meeting ended. Generating post-meeting intelligence...', 'info');
    router.push(`/meetings/${meetingId}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[var(--text-primary)]">
                {meetingTitle}
              </h1>
              <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Room ID: {meetingId.slice(0, 8)} • {Math.max(1, peers.length)} participant(s)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            {linkCopied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{linkCopied ? 'Link Copied' : 'Invite link'}</span>
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--border)]">
            <span className="text-xs text-[var(--text-secondary)]">You:</span>
            <input
              type="text"
              aria-label="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-28 rounded-md border border-[var(--border)] bg-[var(--bg-page)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <Link
            href={`/meetings/${meetingId}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--success)]" />
            <span>AI Notes</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Video Stage + Collaboration Sidebar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Video Stage */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border)] bg-[#0d0e12] shadow-sm flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraOff && !screenSharing ? 'hidden' : ''}`}
            />
            {cameraOff && !screenSharing && (
              <div className="flex flex-col items-center gap-3 text-neutral-300">
                <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-neutral-800 text-xl font-bold text-[var(--accent)]">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <span className="text-xs text-neutral-500">
                  Camera feed inactive
                </span>
              </div>
            )}

            {/* Live speech captions overlay */}
            {captionsOn && (
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/80 backdrop-blur border border-white/10 px-4 py-2.5 text-xs text-white">
                <span className="font-semibold text-[var(--accent)]">[Live Captions]: </span>
                <span>{transcriptLines[transcriptLines.length - 1] || 'Listening for speech input...'}</span>
              </div>
            )}
          </div>

          {/* Meeting Control Console */}
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-sm">
            <button
              type="button"
              onClick={toggleMute}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                muted
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-[var(--success)]" />}
              <span>{muted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                cameraOff
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {cameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4 text-[var(--success)]" />}
              <span>{cameraOff ? 'Start Video' : 'Stop Video'}</span>
            </button>

            <button
              type="button"
              onClick={toggleScreenShare}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                screenSharing
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)]'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {screenSharing ? <MonitorOff className="h-4 w-4 text-[var(--accent)]" /> : <MonitorUp className="h-4 w-4" />}
              <span>{screenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                recording
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white animate-pulse'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {recording ? <Square className="h-4 w-4" /> : <CircleDot className="h-4 w-4 text-[var(--accent)]" />}
              <span>{recording ? 'Stop & Save' : 'Record'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCaptions}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                captionsOn
                  ? 'border-[var(--success)] bg-[var(--success)] text-white'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{captionsOn ? 'Captions On' : 'Live Captions'}</span>
            </button>

            <button
              type="button"
              onClick={handleLeaveAndSummarize}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 shadow-sm transition"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave &amp; Summarize</span>
            </button>
          </div>
        </div>

        {/* Collaboration Sidebar */}
        <div className="lg:col-span-4 flex h-[520px] flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--bg-page)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition ${
                activeTab === 'chat'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition ${
                activeTab === 'notes'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition ${
                activeTab === 'participants'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Peers ({Math.max(1, peers.length)})</span>
            </button>
          </div>

          {/* Tab: Chat */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-3.5">
                {messages.length === 0 ? (
                  <p className="py-12 text-center text-xs text-[var(--text-secondary)]">
                    No messages sent yet. Send a note to participants!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[var(--accent)]">{m.senderName}</span>
                        <span className="text-[var(--text-secondary)] font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-primary)]">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {peers.some((p) => p.peerId !== peerId && p.typing) && (
                <p className="px-3 pb-1 text-[11px] text-[var(--text-secondary)] italic">
                  Someone is typing...
                </p>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-[var(--border)] p-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    setTyping(e.target.value.length > 0);
                  }}
                  placeholder="Send in-room chat..."
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-[var(--bg-page)] hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}

          {/* Tab: Notes & Quick Tasks */}
          {activeTab === 'notes' && (
            <div className="flex flex-1 flex-col gap-3 p-3.5">
              <div className="flex-1 flex flex-col">
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Shared Session Notes
                </label>
                <textarea
                  value={sharedNotes}
                  onChange={(e) => setSharedNotes(e.target.value)}
                  placeholder="Notes typed here are preserved when you exit..."
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="border-t border-[var(--border)] pt-2.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                  Quick Action Item to Workspace
                </label>
                <form onSubmit={handleCreateQuickTask} className="flex gap-2">
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="e.g. Update API schema..."
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90"
                  >
                    <Plus className="h-3 w-3" />
                    <span>File</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab: Participants */}
          {activeTab === 'participants' && (
            <div className="flex-1 space-y-2 overflow-y-auto p-3.5">
              {(peers.length > 0
                ? peers
                : [{ peerId, name: displayName, muted, cameraOff, typing: false }]
              ).map((p) => (
                <div
                  key={p.peerId}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                    <span>{p.name}</span>
                    {p.peerId === peerId && <span className="text-[11px] text-[var(--accent)] font-mono">(You)</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.muted ? <MicOff className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Mic className="h-3.5 w-3.5 text-[var(--success)]" />}
                    {p.cameraOff ? <VideoOff className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Video className="h-3.5 w-3.5 text-[var(--success)]" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
