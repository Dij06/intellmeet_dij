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
        showToast('Camera/Mic unsupported in this environment. Running audio-less mode.', 'info');
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
        showToast('No camera detected or permission denied. Running in audio-less demo mode.', 'info');
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
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
      showToast('Screen sharing stopped', 'info');
      return;
    }

    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screen;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screen;
      }
      screen.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
      setScreenSharing(true);
      showToast('Screen sharing active', 'success');
    } catch {
      showToast('Screen sharing cancelled or unsupported', 'error');
    }
  };

  const toggleRecording = () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      showToast('Recording saved & downloaded', 'success');
      return;
    }

    const streamToRecord = screenStreamRef.current || localStreamRef.current;
    if (!streamToRecord) {
      showToast('Enable camera or screen share before recording', 'error');
      return;
    }

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(streamToRecord);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intellmeet-session-${meetingId}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      showToast('Recording started... Click again to stop & save', 'info');
    } catch {
      showToast('Recording unsupported in this browser', 'error');
    }
  };

  const toggleCaptions = () => {
    if (captionsOn && recognitionRef.current) {
      recognitionRef.current.stop();
      setCaptionsOn(false);
      showToast('Live captions turned off', 'info');
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Speech recognition requires Chrome/Edge', 'error');
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = e.results[e.results.length - 1]?.[0]?.transcript?.trim();
      if (text) {
        setTranscriptLines((prev) => [...prev.slice(-20), `${displayName}: ${text}`]);
      }
    };
    rec.onerror = () => setCaptionsOn(false);
    rec.onend = () => setCaptionsOn(false);
    rec.start();
    recognitionRef.current = rec;
    setCaptionsOn(true);
    showToast('Live speech captions activated', 'success');
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
      showToast('Failed to deliver chat', 'error');
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
      showToast(`Task "${title}" dispatched to Kanban!`, 'success');
    } catch {
      showToast('Failed to create task', 'error');
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    showToast('Room link copied! Share with colleagues to test peer sync.', 'success');
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink-950 bg-paper-50 px-5 py-3.5 shadow-tactile">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-coral animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-base font-extrabold text-ink-950 sm:text-lg">
                {meetingTitle}
              </h1>
              <span className="rounded bg-coral px-1.5 py-0.2 font-mono text-[9px] font-bold text-paper-50 uppercase">
                LIVE
              </span>
            </div>
            <p className="font-mono text-[11px] text-ink-500">
              Room ID: {meetingId} • {Math.max(1, peers.length)} peer(s) connected
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 rounded-lg border border-ink-950 bg-paper-100 px-3 py-1.5 font-mono text-xs font-bold text-ink-950 hover:bg-paper-200 transition"
          >
            {linkCopied ? <Check className="h-3.5 w-3.5 text-emeraldBrand" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{linkCopied ? 'Link Copied' : 'Invite Link'}</span>
          </button>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-500 uppercase">You:</span>
            <input
              type="text"
              aria-label="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-32 rounded border border-ink-900/30 bg-paper-50 px-2 py-1 text-xs font-bold text-ink-950 focus:border-ink-950 focus:outline-none"
            />
          </div>

          <Link
            href={`/meetings/${meetingId}`}
            className="flex items-center gap-1 rounded-lg border border-ink-950 bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink-950 hover:bg-paper-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-emeraldBrand" />
            <span>AI Synthesis</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Video Stage + Interactive Panel */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Video Stage */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border-2 border-ink-950 bg-ink-950 shadow-tactile flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraOff && !screenSharing ? 'hidden' : ''}`}
            />
            {cameraOff && !screenSharing && (
              <div className="flex flex-col items-center gap-3 text-paper-200">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-paper-50 bg-ink-900 font-mono text-2xl font-black text-coral shadow-tactile-sm">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <p className="font-sans text-sm font-bold text-paper-50">{displayName}</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  Camera Feed Inactive
                </span>
              </div>
            )}

            {/* Live speech captions overlay */}
            {captionsOn && (
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-paper-50/20 bg-ink-950/90 backdrop-blur px-4 py-2 text-xs font-mono text-paper-100 shadow-tactile">
                <span className="font-bold text-coral uppercase tracking-wider">[Live Captions]: </span>
                <span>{transcriptLines[transcriptLines.length - 1] || 'Listening for speech input...'}</span>
              </div>
            )}
          </div>

          {/* Meeting Control Console */}
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-ink-950 bg-paper-50 p-3 shadow-tactile">
            <button
              type="button"
              onClick={toggleMute}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-ink-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                muted ? 'bg-coral text-paper-50' : 'bg-paper-100 text-ink-950 hover:bg-paper-200'
              }`}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emeraldBrand" />}
              <span>{muted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-ink-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                cameraOff ? 'bg-coral text-paper-50' : 'bg-paper-100 text-ink-950 hover:bg-paper-200'
              }`}
            >
              {cameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4 text-emeraldBrand" />}
              <span>{cameraOff ? 'Start Video' : 'Stop Video'}</span>
            </button>

            <button
              type="button"
              onClick={toggleScreenShare}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-ink-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                screenSharing ? 'bg-ink-950 text-paper-50' : 'bg-paper-100 text-ink-950 hover:bg-paper-200'
              }`}
            >
              {screenSharing ? <MonitorOff className="h-4 w-4 text-coral" /> : <MonitorUp className="h-4 w-4" />}
              <span>{screenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-ink-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                recording ? 'bg-coral text-paper-50 animate-pulse' : 'bg-paper-100 text-ink-950 hover:bg-paper-200'
              }`}
            >
              {recording ? <Square className="h-4 w-4" /> : <CircleDot className="h-4 w-4 text-coral" />}
              <span>{recording ? 'Stop & Save' : 'Record Call'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCaptions}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-ink-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                captionsOn ? 'bg-emeraldBrand text-paper-50' : 'bg-paper-100 text-ink-950 hover:bg-paper-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{captionsOn ? 'Captions Active' : 'Live Captions'}</span>
            </button>

            <button
              type="button"
              onClick={handleLeaveAndSummarize}
              className="flex items-center gap-1.5 rounded-lg border-2 border-ink-950 bg-ink-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-coral shadow-tactile transition hover:bg-ink-800"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave &amp; Summarize</span>
            </button>
          </div>
        </div>

        {/* Collaboration Sidebar */}
        <div className="lg:col-span-4 flex h-[530px] flex-col rounded-2xl border-2 border-ink-950 bg-paper-50 shadow-tactile">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 border-b-2 border-ink-950 bg-paper-200 p-1 rounded-t-xl">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold transition ${
                activeTab === 'chat' ? 'bg-ink-950 text-paper-50 shadow-tactile-sm' : 'text-ink-700'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold transition ${
                activeTab === 'notes' ? 'bg-ink-950 text-paper-50 shadow-tactile-sm' : 'text-ink-700'
              }`}
            >
              <FileText className="h-3 w-3" />
              <span>Notes/Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold transition ${
                activeTab === 'participants' ? 'bg-ink-950 text-paper-50 shadow-tactile-sm' : 'text-ink-700'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Peers ({Math.max(1, peers.length)})</span>
            </button>
          </div>

          {/* Tab: Chat */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-3.5">
                {messages.length === 0 ? (
                  <p className="py-12 text-center font-mono text-xs text-ink-500">
                    No messages sent yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="rounded-lg border border-ink-900/10 bg-paper-100 p-2.5">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold text-coral">{m.senderName}</span>
                        <span className="text-ink-400">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-950 font-sans">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {peers.some((p) => p.peerId !== peerId && p.typing) && (
                <p className="px-3 pb-1 font-mono text-[10px] text-ink-500 italic">
                  Peer is typing...
                </p>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t-2 border-ink-950 p-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    setTyping(e.target.value.length > 0);
                  }}
                  placeholder="Send in-room chat..."
                  className="flex-1 rounded-lg border border-ink-900/25 bg-paper-50 px-3 py-1.5 text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="rounded-lg border border-ink-950 bg-ink-950 px-3 py-1.5 text-paper-50 shadow-tactile-sm"
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
                <label className="font-mono text-[10px] font-bold uppercase text-ink-600 mb-1">
                  Shared Session Notes
                </label>
                <textarea
                  value={sharedNotes}
                  onChange={(e) => setSharedNotes(e.target.value)}
                  placeholder="Notes typed here are saved when you leave..."
                  className="flex-1 rounded-xl border border-ink-900/25 bg-paper-100 p-2.5 font-mono text-xs text-ink-950 focus:border-ink-950 focus:outline-none"
                />
              </div>

              <div className="border-t border-ink-900/10 pt-2">
                <label className="font-mono text-[10px] font-bold uppercase text-ink-600 mb-1 block">
                  Quick Kanban Action Item
                </label>
                <form onSubmit={handleCreateQuickTask} className="flex gap-2">
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="e.g. Update API schema..."
                    className="flex-1 rounded-lg border border-ink-900/25 bg-paper-50 px-2.5 py-1.5 text-xs text-ink-950 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg border border-ink-950 bg-emeraldBrand px-3 py-1.5 text-xs font-bold text-paper-50 shadow-tactile-sm"
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
                  className="flex items-center justify-between rounded-lg border border-ink-900/15 bg-paper-100 px-3 py-2 text-xs font-bold text-ink-950"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emeraldBrand" />
                    <span>{p.name}</span>
                    {p.peerId === peerId && <span className="font-mono text-[10px] text-coral">(You)</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.muted ? <MicOff className="h-3.5 w-3.5 text-coral" /> : <Mic className="h-3.5 w-3.5 text-emeraldBrand" />}
                    {p.cameraOff ? <VideoOff className="h-3.5 w-3.5 text-coral" /> : <Video className="h-3.5 w-3.5 text-emeraldBrand" />}
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
