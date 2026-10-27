"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PhoneOff,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Award,
  Maximize2,
  Minimize2,
  RefreshCw,
  Camera,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveInterview } from "@/context/ActiveInterviewContext";

interface BehavioralQuestion {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  expectedCriteria: string;
  hints?: string;
  answer?: any;
}

interface BehavioralSessionData {
  id: string;
  title: string;
  targetRole: string;
  companyName: string;
  questions: BehavioralQuestion[];
}

function BehavioralMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // Media streams & recognition
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [session, setSession] = React.useState<BehavioralSessionData | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [submittingAnswer, setSubmittingAnswer] = React.useState(false);
  const [endingSession, setEndingSession] = React.useState(false);
  const [showEndModal, setShowEndModal] = React.useState(false);
  const [showConsentModal, setShowConsentModal] = React.useState(false);
  const [hasConsent, setHasConsent] = React.useState(false);

  // Video / Audio device states
  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [permissionErrorType, setPermissionErrorType] = React.useState<"denied" | "unavailable" | "recording_error" | null>(null);
  const [continueWithoutRecording, setContinueWithoutRecording] = React.useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = React.useState(false);
  const [isListeningCandidate, setIsListeningCandidate] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // MediaRecorder states & refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = React.useState<"idle" | "recording" | "recorded">("idle");
  const [recordedBlobUrl, setRecordedBlobUrl] = React.useState<string | null>(null);
  const [showReplayModal, setShowReplayModal] = React.useState(false);

  // Available camera devices for switching
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string>("");

  // Real-time answer transcript
  const [transcript, setTranscript] = React.useState("");
  const [durationSec, setDurationSec] = React.useState(0);
  const [elapsedSec, setElapsedSec] = React.useState(0);

  // Overall timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Per-question duration timer
  React.useEffect(() => {
    const qTimer = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(qTimer);
  }, [currentIdx]);

  // Load session data
  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/behavioral/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load session");
        const s = json.data.session;
        setSession({
          id: s.id,
          title: s.title,
          targetRole: s.targetRole,
          companyName: s.companyName || "Tech Company",
          questions: s.questions || [],
        });
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  // Enumerate cameras safely without triggering state re-mount cascades
  const enumerateCameras = React.useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(vDevs);
        setSelectedCameraId((prev) => prev || (vDevs.length > 0 ? vDevs[0].deviceId : ""));
      }
    } catch {
      // Non-critical device listing
    }
  }, []);

  // Initialize webcam video (Clearly Visible, 1280x720 ideal, aspect ratio preserved)
  const startCamera = React.useCallback(async (targetDeviceId?: string) => {
    setCameraError(null);
    setPermissionErrorType(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionErrorType("unavailable");
        throw new Error("getUserMedia is not supported by your browser");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const activeDevId = targetDeviceId || selectedCameraId;
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      };
      if (activeDevId) {
        videoConstraints.deviceId = { exact: activeDevId };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setVideoEnabled(true);
      setAudioEnabled(true);
      setPermissionErrorType(null);
      await enumerateCameras();
    } catch (e: any) {
      console.warn("Camera initialization warning:", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setPermissionErrorType("denied");
        setCameraError("Camera and microphone permission was denied. Please allow access in your browser or continue without recording.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setPermissionErrorType("unavailable");
        setCameraError("No camera or microphone hardware found on this device.");
      } else {
        setPermissionErrorType("recording_error");
        setCameraError(e.message || "Unable to access video camera.");
      }
    }
  }, [enumerateCameras, selectedCameraId]);

  React.useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Request start recording with explicit consent check
  const handleRequestStartRecording = () => {
    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }
    executeStartRecording();
  };

  // Start MediaRecorder
  const executeStartRecording = () => {
    setShowConsentModal(false);
    setHasConsent(true);
    if (!streamRef.current) {
      setPermissionErrorType("unavailable");
      setCameraError("Video stream is not available to record. You can type or speak without recording.");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? { mimeType: "video/webm;codecs=vp9,opus" }
        : MediaRecorder.isTypeSupported("video/webm")
        ? { mimeType: "video/webm" }
        : undefined;

      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (recordedBlobUrl) {
          URL.revokeObjectURL(recordedBlobUrl);
        }
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setRecordingState("recorded");
      };

      recorder.onerror = (event: any) => {
        console.warn("MediaRecorder error event:", event);
        setPermissionErrorType("recording_error");
        setCameraError("Recording error occurred. You can continue without recording.");
        setRecordingState("idle");
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
    } catch (err: any) {
      console.warn("Failed to initialize MediaRecorder:", err);
      setPermissionErrorType("recording_error");
      setCameraError("Failed to start video recording: " + (err.message || "Unknown error"));
    }
  };

  const startRecording = executeStartRecording;

  // Stop MediaRecorder
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Reset recording when question changes
  React.useEffect(() => {
    if (recordingState === "recording") {
      stopRecording();
    }
    setRecordingState("idle");
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      setRecordedBlobUrl(null);
    }
  }, [currentIdx]);

  // Toggle Video Track
  const toggleVideo = () => {
    if (streamRef.current) {
      const vTrack = streamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setVideoEnabled(vTrack.enabled);
      }
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (streamRef.current) {
      const aTrack = streamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setAudioEnabled(aTrack.enabled);
      }
    }
  };

  // Switch to next available camera
  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIdx = videoDevices.findIndex((d) => d.deviceId === selectedCameraId);
    const nextIdx = (currentIdx + 1) % videoDevices.length;
    const nextDevId = videoDevices[nextIdx].deviceId;
    setSelectedCameraId(nextDevId);
    startCamera(nextDevId);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Web Speech API for voice speech-to-text
  React.useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript((prev) => {
          const base = prev ? prev.trim() + " " : "";
          return base + currentTranscript;
        });
      };

      recognition.onerror = () => setIsListeningCandidate(false);
      recognition.onend = () => setIsListeningCandidate(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type your response directly.");
      return;
    }

    if (isListeningCandidate) {
      recognitionRef.current.stop();
      setIsListeningCandidate(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningCandidate(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleRetrySpeaking = () => {
    setTranscript("");
    if (recognitionRef.current) {
      try {
        if (isListeningCandidate) {
          recognitionRef.current.stop();
        }
        recognitionRef.current.start();
        setIsListeningCandidate(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleClearTranscript = () => {
    setTranscript("");
    if (isListeningCandidate && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningCandidate(false);
    }
  };

  const handleMarkUnableToAssess = async () => {
    if (!currentQ || submittingAnswer) return;
    setSubmittingAnswer(true);

    try {
      if (isListeningCandidate && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListeningCandidate(false);
      }

      await fetch("/api/behavioral/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: "[Unable to assess — candidate marked audio as unclear / opted out]",
          durationSeconds: durationSec,
          isTextOnly: true,
          userConsented: true,
        }),
      });

      setTranscript("");
      setDurationSec(0);

      if (session && currentIdx < session.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        handleEndMeeting();
      }
    } catch (err: any) {
      alert("Error saving response: " + err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const playQuestionAudio = () => {
    if (!session || !session.questions[currentIdx]) return;
    const qText = session.questions[currentIdx].questionText;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(qText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeakingAI(true);
      utterance.onend = () => setIsSpeakingAI(false);
      utterance.onerror = () => setIsSpeakingAI(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentQ = session?.questions[currentIdx];
  const { setActiveQuestion } = useActiveInterview();

  React.useEffect(() => {
    if (!currentQ) {
      setActiveQuestion(null);
      return;
    }
    setActiveQuestion({
      roundNumber: 4,
      roundName: "Behavioral Round",
      questionId: currentQ.id,
      questionText: currentQ.questionText,
      category: currentQ.category,
      onAnswerSubmit: async (ans) => {
        setTranscript((prev) => (prev ? `${prev} ${ans}` : ans));
      },
    });
    return () => setActiveQuestion(null);
  }, [currentQ?.id, currentQ?.questionText, setActiveQuestion]);

  const handleNextOrSubmit = async () => {
    if (!currentQ || submittingAnswer) return;

    if (!transcript.trim()) {
      alert("Please provide an answer using speech or text before submitting.");
      return;
    }

    setSubmittingAnswer(true);

    try {
      if (isListeningCandidate && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListeningCandidate(false);
      }

      await fetch("/api/behavioral/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: transcript.trim(),
          durationSeconds: durationSec,
          isTextOnly: false,
          userConsented: true,
        }),
      });

      setTranscript("");
      setDurationSec(0);

      if (session && currentIdx < session.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        handleEndMeeting();
      }
    } catch (err: any) {
      alert("Error saving response: " + err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQ || submittingAnswer) return;
    setSubmittingAnswer(true);

    try {
      if (isListeningCandidate && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListeningCandidate(false);
      }

      await fetch("/api/behavioral/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: "[Question skipped by candidate]",
          durationSeconds: durationSec,
          isTextOnly: true,
          userConsented: true,
        }),
      });

      setTranscript("");
      setDurationSec(0);

      if (session && currentIdx < session.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        handleEndMeeting();
      }
    } catch (err: any) {
      alert("Error skipping question: " + err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSaveAndExit = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    router.push("/dashboard");
  };

  const handleEndMeeting = async () => {
    setEndingSession(true);
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      await fetch("/api/behavioral/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      router.push(`/behavioral/results?sessionId=${sessionId}`);
    } catch (err: any) {
      alert("Failed to conclude behavioral session: " + err.message);
      setEndingSession(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAutoStartBehavioral = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/behavioral/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Software Engineer",
          company: "Google",
          durationMinutes: 15,
        }),
      });
      const json = await res.json();
      const newSessionId = json.data?.sessionId || json.sessionId;
      if (newSessionId) {
        router.push(`/behavioral/meeting?sessionId=${newSessionId}`);
      } else {
        router.push("/behavioral/setup");
      }
    } catch {
      router.push("/behavioral/setup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Connecting to Dr. Marcus Vance...</p>
      </div>
    );
  }

  if (!session || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-slate-900 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Round 4 Behavioral Room</h2>
          <p className="text-xs text-slate-400">Could not locate an active behavioral interview room. Start fresh to begin Round 4.</p>
          <div className="space-y-2 pt-2">
            <Button onClick={handleAutoStartBehavioral} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Start Round 4 Now
            </Button>
            <Button variant="outline" onClick={() => router.push("/behavioral/setup")} className="w-full border-slate-700 text-slate-200">
              Configure Behavioral Round
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Google Meet Bar */}
      <header className="h-14 px-4 md:px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Behavioral Interview • {session.targetRole}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">{session.companyName}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-xs font-mono">
            <span>Room {formatTimer(elapsedSec)}</span>
          </div>

          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
            Q {currentIdx + 1}/{session.questions.length}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConsentModal(true)}
            className="text-xs h-8 px-2.5 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hidden sm:flex items-center gap-1.5"
            title="Review Recording, Speech Transcription & Evaluation Transparency Policy"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Privacy & Scoring</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-xs h-8 px-2.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hidden sm:flex items-center gap-1"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndExit}
            className="text-xs h-8 px-3 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            title="Leave room and preserve progress"
          >
            Save & Exit
          </Button>
        </div>
      </header>

      {/* Main Grid: 2 Large Video Feeds (AI Interviewer + Candidate Live Camera) */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Panel 1: AI Behavioral Interviewer */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xl min-h-[280px]">
          {/* Avatar & Waveform Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl transition-transform ${
                  isSpeakingAI ? "scale-105 ring-4 ring-purple-500/50" : ""
                }`}
              >
                <Bot className="w-12 h-12 md:w-16 md:h-16" />
              </div>

              {isSpeakingAI && (
                <div className="absolute inset-0 rounded-3xl border-2 border-purple-400 animate-ping opacity-75" />
              )}
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white">Dr. Marcus Vance</h3>
              <p className="text-xs text-slate-400">Lead AI Behavioral Assessor • STAR Method</p>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 h-6">
              {[40, 70, 90, 60, 80, 50, 95, 30].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeakingAI ? "bg-purple-400" : "bg-slate-700"
                  }`}
                  style={{ height: isSpeakingAI ? `${h}%` : "20%" }}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 backdrop-blur-md border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              AI Evaluator Online
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={playQuestionAudio}
              className="text-xs h-7 gap-1.5 bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              Replay Question Audio
            </Button>
          </div>
        </div>

        {/* Panel 2: Candidate Live Webcam Stream & Recording Controls */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xl min-h-[280px]">
          {videoEnabled && !cameraError && !continueWithoutRecording ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 p-6 text-center">
              <VideoOff className="w-12 h-12 text-slate-600" />
              <div className="space-y-1.5 max-w-sm">
                <span className="text-xs font-semibold text-slate-300">
                  {continueWithoutRecording
                    ? "Participating in Text/Speech Mode (Recording Bypassed)"
                    : permissionErrorType === "denied"
                    ? "Camera & Microphone Permission Denied"
                    : permissionErrorType === "unavailable"
                    ? "No Camera or Microphone Hardware Found"
                    : permissionErrorType === "recording_error"
                    ? "Recording Error Occurred"
                    : "Camera Disabled"}
                </span>
                {cameraError && !continueWithoutRecording && (
                  <p className="text-[11px] text-rose-400 leading-relaxed">{cameraError}</p>
                )}
                {continueWithoutRecording && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    You can type your answers or use Speech-to-Text directly. Video recording is disabled.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {!continueWithoutRecording && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera()}
                      className="text-xs h-7 gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Permissions</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContinueWithoutRecording(true);
                        setCameraError(null);
                        setPermissionErrorType(null);
                      }}
                      className="text-xs h-7 gap-1.5 border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300"
                    >
                      <span>Continue without recording</span>
                    </Button>
                  </>
                )}
                {continueWithoutRecording && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setContinueWithoutRecording(false);
                      startCamera();
                    }}
                    className="text-xs h-7 gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try Enabling Camera</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Candidate Floating Overlay Name Pill */}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>You (Candidate)</span>
            {recordingState === "recording" && (
              <span className="flex items-center gap-1 text-rose-400 font-mono text-[10px] pl-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> REC
              </span>
            )}
            {recordingState === "recorded" && (
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] pl-1">
                <CheckCircle2 className="w-3 h-3" /> Clip Saved
              </span>
            )}
          </div>

          {/* Top Recording Bar on Video */}
          {!continueWithoutRecording && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-auto">
              <div className="flex items-center gap-2">
                {recordingState === "idle" && (
                  <Button
                    size="sm"
                    onClick={handleRequestStartRecording}
                    className="h-7 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Start Recording
                  </Button>
                )}

                {recordingState === "recording" && (
                  <Button
                    size="sm"
                    onClick={stopRecording}
                    className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30"
                  >
                    <span className="w-2 h-2 bg-white rounded-xs" />
                    Stop Recording
                  </Button>
                )}

                {recordingState === "recorded" && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setShowReplayModal(true)}
                      className="h-7 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Replay Recording
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startRecording}
                      className="h-7 text-xs gap-1.5 bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-record
                    </Button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setContinueWithoutRecording(true)}
                className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-700/60 transition"
              >
                Skip Video Recording
              </button>
            </div>
          )}

          {/* Audio Indicator */}
          <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs flex items-center gap-2">
            {videoDevices.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                title="Switch Camera"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
              </button>
            )}

            {audioEnabled ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Question & Answer Bar */}
      <footer className="p-4 md:px-6 bg-slate-900/95 border-t border-slate-800 shrink-0 space-y-3 z-30">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Question {currentIdx + 1} of {session.questions.length}
                </Badge>
                <span className="text-xs font-semibold text-slate-400">{currentQ.category}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-100 leading-snug">
                {currentQ.questionText}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30 flex items-center gap-1 font-medium">
                  <Bot className="w-3 h-3 text-purple-400" />
                  Machine-Generated Transcript (Candidate Editable)
                </Badge>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Review & edit text before submitting. Evaluated on evidence only (zero penalty for accent, speaking confidence, or speech differences).
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRetrySpeaking}
                  className="text-[11px] text-purple-400 hover:text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition flex items-center gap-1"
                  title="Clear text and restart voice recognition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Speaking</span>
                </button>
                {transcript && (
                  <button
                    type="button"
                    onClick={handleClearTranscript}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
                  >
                    Clear Text
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your answer will appear here in real-time as you speak... (You can edit, fix typos, or type your response directly)"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVideo}
                className={`p-2.5 rounded-xl border transition-all ${
                  videoEnabled
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    : "bg-rose-600/20 border-rose-500 text-rose-400"
                }`}
                title={videoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleAudio}
                className={`p-2.5 rounded-xl border transition-all ${
                  audioEnabled
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    : "bg-rose-600/20 border-rose-500 text-rose-400"
                }`}
                title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleSpeechRecognition}
                className={`text-xs h-9 gap-2 border font-medium ${
                  isListeningCandidate
                    ? "border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse"
                    : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListeningCandidate ? "Listening... (Click to stop)" : "Start Speaking"}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={submittingAnswer}
                onClick={handleMarkUnableToAssess}
                className="text-xs h-9 gap-1.5 border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-700 hover:text-amber-200"
                title="If audio is unclear or speech recognition failed, exclude this question without penalty"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Unable to Assess</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={submittingAnswer}
                onClick={handleSkipQuestion}
                className="text-xs h-9 gap-1.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Skip Question
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowEndModal(true)}
                className="text-xs h-9 gap-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Behavioral Round</span>
              </Button>

              <Button
                onClick={handleNextOrSubmit}
                disabled={submittingAnswer || !transcript.trim()}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-md shadow-purple-600/20"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating STAR...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentIdx < session.questions.length - 1 ? "Submit & Next Question" : "Submit & Complete Round"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Recording & Speech Transcription Fair Evaluation Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Video Recording & Speech Transcription</h3>
                <p className="text-xs text-slate-400">Privacy, Retention & Fair Evaluation Standards</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Speech-to-Text Transcription:</strong> Spoken responses are transcribed into text using your browser engine. You can inspect, edit, or correct any transcription errors before submitting.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Ethical Non-Discrimination:</strong> Evaluation is strictly content- and evidence-based (STAR criteria). There is <em>zero marks penalty</em> for speaking confidence, accent, minor grammar, disability-related speech differences, or recording quality.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Optional Video Recording:</strong> Recording video is 100% optional for personal practice. If video hardware is unavailable or audio is unclear, you can continue without recording or mark questions as "Unable to Assess" without zero penalties.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Data Retention & Control:</strong> Recordings and transcripts remain private to your session. You can review, download, or re-record at any time.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowConsentModal(false);
                  setContinueWithoutRecording(true);
                }}
                className="text-xs border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Continue Without Recording
              </Button>
              <Button
                size="sm"
                onClick={executeStartRecording}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Video className="w-4 h-4" />
                <span>Allow & Start Recording</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Conclude Behavioral Interview?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dr. Marcus Vance will analyze your answers across all STAR criteria (Situation, Task, Action, Result) and generate a verified behavioral scorecard.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEndModal(false)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Return to Meeting
              </Button>
              <Button
                size="sm"
                disabled={endingSession}
                onClick={handleEndMeeting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {endingSession ? "Evaluating..." : "Conclude & View Results"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Recording Replay Modal */}
      {showReplayModal && recordedBlobUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Replay Your Recorded Answer</h3>
              </div>
              <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/40">
                Question {currentIdx + 1}
              </Badge>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                src={recordedBlobUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Review your delivery, vocal pacing, and facial clarity. You can re-record if you wish or proceed to submit.
            </p>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplayModal(false);
                  startRecording();
                }}
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Re-record Clip
              </Button>

              <Button
                size="sm"
                onClick={() => setShowReplayModal(false)}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                Keep & Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BehavioralMeetingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BehavioralMeetingContent />
    </React.Suspense>
  );
}
