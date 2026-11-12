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
} from 'lucide-react';

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

  const [meetingTitle, setMeetingTitle] = useState('Live Meeting Room');
  const [displayName, setDisplayName] = useState('Demo User');
  const [peerId] = useState(() => `peer-${Math.random().toString(36).slice(2, 9)}`);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [mediaNotice, setMediaNotice] = useState('');

  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'participants'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [sharedNotes, setSharedNotes] = useState('');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Load meeting info & chat messages
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
      // Ignore transient load error
    }
  }, [meetingId]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Initialize local camera/mic
  useEffect(() => {
    let active = true;
    async function initMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaNotice('Camera/Mic API unavailable in this browser. Chat, notes & AI still work.');
        setCameraOff(true);
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
        setMediaNotice(
          'Camera/microphone permission not granted or no device detected. Running in audio-less demo mode.'
        );
        setCameraOff(true);
      }
    }
    initMedia();

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  // BroadcastChannel + polling for real-time presence & chat across tabs
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
        // Ignore polling errors
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
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
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
    } catch {
      setMediaNotice('Screen sharing was cancelled or is unsupported in this browser.');
    }
  };

  const toggleRecording = () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    const streamToRecord = screenStreamRef.current || localStreamRef.current;
    if (!streamToRecord) {
      setMediaNotice('Start camera or screen share before recording.');
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
        a.download = `intellmeet-recording-${meetingId}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMediaNotice('Recording is not supported in this browser.');
    }
  };

  const toggleCaptions = () => {
    if (captionsOn && recognitionRef.current) {
      recognitionRef.current.stop();
      setCaptionsOn(false);
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setMediaNotice('Live captions require Chrome or Edge.');
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
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput('');
    setTyping(false);

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
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const title = quickTaskTitle.trim();
    setQuickTaskTitle('');
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
    setMediaNotice(`Task "${title}" added to Kanban board.`);
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
    router.push(`/meetings/${meetingId}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-bold text-white">{meetingTitle}</h1>
          </div>
          <p className="text-xs text-slate-400">
            Room ID: <span className="font-mono">{meetingId}</span> • {Math.max(1, peers.length)} active participant(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
            placeholder="Your Name"
          />
          <Link
            href={`/meetings/${meetingId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Post-Meeting AI
          </Link>
        </div>
      </div>

      {mediaNotice && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          {mediaNotice}
        </div>
      )}

      {/* Main Grid: Video Stage + Collaboration Sidebar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Video Stage */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraOff && !screenSharing ? 'hidden' : ''}`}
            />
            {cameraOff && !screenSharing && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20 text-2xl font-bold text-indigo-300">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-slate-500">Camera is off</p>
              </div>
            )}

            {/* Live Captions Overlay */}
            {captionsOn && (
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-950/85 px-3 py-2 text-xs text-slate-200 border border-slate-700">
                <span className="font-semibold text-indigo-400">Live Captions: </span>
                {transcriptLines[transcriptLines.length - 1] || 'Listening...'}
              </div>
            )}
          </div>

          {/* Meeting Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 p-3">
            <button
              type="button"
              onClick={toggleMute}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                muted
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {muted ? 'Unmute' : 'Mute'}
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                cameraOff
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              {cameraOff ? 'Start Video' : 'Stop Video'}
            </button>

            <button
              type="button"
              onClick={toggleScreenShare}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                screenSharing
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {screenSharing ? (
                <MonitorOff className="h-4 w-4" />
              ) : (
                <MonitorUp className="h-4 w-4" />
              )}
              {screenSharing ? 'Stop Share' : 'Share Screen'}
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                recording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {recording ? <Square className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
              {recording ? 'Stop & Save' : 'Record'}
            </button>

            <button
              type="button"
              onClick={toggleCaptions}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                captionsOn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {captionsOn ? 'Captions On' : 'Live Captions'}
            </button>

            <button
              type="button"
              onClick={handleLeaveAndSummarize}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
            >
              <PhoneOff className="h-4 w-4" />
              Leave &amp; Summarize
            </button>
          </div>
        </div>

        {/* Collaboration Sidebar */}
        <div className="flex h-[520px] flex-col rounded-2xl border border-slate-800 bg-slate-900/90">
          <div className="grid grid-cols-3 border-b border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Notes &amp; Tasks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                activeTab === 'participants'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              People ({Math.max(1, peers.length)})
            </button>
          </div>

          {activeTab === 'chat' && (
            <>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-500">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-indigo-300">
                          {m.senderName}
                        </span>
                        <span className="text-slate-500">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-200">{m.content}</p>
                    </div>
                  ))
                )}
              </div>
              {peers.some((p) => p.peerId !== peerId && p.typing) && (
                <p className="px-3 pb-1 text-[11px] italic text-slate-400">
                  Someone is typing...
                </p>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 border-t border-slate-800 p-3"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    setTyping(e.target.value.length > 0);
                  }}
                  placeholder="Send a message..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}

          {activeTab === 'notes' && (
            <div className="flex flex-1 flex-col gap-3 p-3">
              <textarea
                value={sharedNotes}
                onChange={(e) => setSharedNotes(e.target.value)}
                placeholder="Shared meeting notes (saved when you leave)..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <form onSubmit={handleCreateQuickTask} className="flex gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Quick Kanban task..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Task
                </button>
              </form>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {(peers.length > 0
                ? peers
                : [{ peerId, name: displayName, muted, cameraOff, typing: false }]
              ).map((p) => (
                <div
                  key={p.peerId}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5"
                >
                  <span className="text-xs font-medium text-white">
                    {p.name} {p.peerId === peerId ? '(You)' : ''}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    {p.muted ? (
                      <MicOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {p.cameraOff ? (
                      <VideoOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                    )}
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
