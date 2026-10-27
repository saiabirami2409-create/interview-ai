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
  PhoneOff,
  UserCheck,
  User,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Pause,
  Play,
  Square,
  Save,
  Film,
  RotateCcw,
  Camera,
  RefreshCw,
  Bot,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveInterview } from "@/context/ActiveInterviewContext";

interface HRQuestion {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  expectedCriteria: string;
  hints?: string;
}

interface HRSessionData {
  id: string;
  title: string;
  targetRole: string;
  companyName: string;
  questions: HRQuestion[];
}

type RecordingStatus = "idle" | "recording" | "paused" | "stopped" | "saving" | "saved";

function HRMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Recording Refs & State
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = React.useState<RecordingStatus>("idle");
  const [recordingSec, setRecordingSec] = React.useState(0);
  const [showConsentModal, setShowConsentModal] = React.useState(false);
  const [hasConsent, setHasConsent] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState(false);

  const [session, setSession] = React.useState<HRSessionData | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [submittingAnswer, setSubmittingAnswer] = React.useState(false);
  const [endingSession, setEndingSession] = React.useState(false);
  const [showEndModal, setShowEndModal] = React.useState(false);

  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string>("");
  const [isSpeakingHR, setIsSpeakingHR] = React.useState(false);
  const [isListeningCandidate, setIsListeningCandidate] = React.useState(false);

  const [transcript, setTranscript] = React.useState("");
  const [durationSec, setDurationSec] = React.useState(0);
  const [elapsedSec, setElapsedSec] = React.useState(0);

  // Overall meeting timer
  React.useEffect(() => {
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Per-question duration
  React.useEffect(() => {
    const qTimer = setInterval(() => setDurationSec((s) => s + 1), 1000);
    return () => clearInterval(qTimer);
  }, [currentIdx]);

  // Video Recording Timer
  React.useEffect(() => {
    let recTimer: NodeJS.Timeout | null = null;
    if (recordingState === "recording") {
      recTimer = setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [recordingState]);

  // Load session
  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/hr/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load session");
        const s = json.data.session;
        setSession({
          id: s.id,
          title: s.title,
          targetRole: s.targetRole,
          companyName: s.companyName || "Company",
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

  // Enumerate cameras safely without re-triggering camera stream remounts
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

  // Start candidate camera
  const startCamera = React.useCallback(async (targetDeviceId?: string) => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
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
      await enumerateCameras();
    } catch (e: any) {
      console.warn("Camera/Mic access error:", e);
      setCameraError(
        e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : e.message || "Unable to access video camera."
      );
    }
  }, [enumerateCameras, selectedCameraId]);

  React.useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIdx = videoDevices.findIndex((d) => d.deviceId === selectedCameraId);
    const nextIdx = (currentIdx + 1) % videoDevices.length;
    const nextDevId = videoDevices[nextIdx].deviceId;
    setSelectedCameraId(nextDevId);
    startCamera(nextDevId);
  };

  // Speech Recognition setup
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

      await fetch("/api/hr/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: "[Unable to assess — candidate marked audio as unclear / opted out]",
          durationSeconds: durationSec,
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
      alert("Error saving HR response: " + err.message);
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
      utterance.pitch = 1.1; // Female tone for Sarah Jenkins
      utterance.onstart = () => setIsSpeakingHR(true);
      utterance.onend = () => setIsSpeakingHR(false);
      utterance.onerror = () => setIsSpeakingHR(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- RECORDING ENGINE ---
  const handleRequestStartRecording = () => {
    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }
    executeStartRecording();
  };

  const executeStartRecording = () => {
    setShowConsentModal(false);
    setHasConsent(true);

    if (!streamRef.current) {
      alert("Camera and microphone stream are required to record the interview.");
      return;
    }

    try {
      recordedChunksRef.current = [];
      let mimeType = "video/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        }
      }

      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
      };

      recorder.start(1000); // chunk every 1 second
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Could not initialize video recording: " + err.message);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
    }
  };

  const handleSaveRecording = async (callbackAfterSave?: () => void) => {
    // If still actively recording, stop first
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
    }

    setRecordingState("saving");

    // Wait slightly to ensure onstop finishes compiling blob
    setTimeout(async () => {
      try {
        const chunks = recordedChunksRef.current;
        if (!chunks || chunks.length === 0) {
          alert("No recording data was captured.");
          setRecordingState("idle");
          if (callbackAfterSave) callbackAfterSave();
          return;
        }

        const mimeType = mediaRecorderRef.current?.mimeType || "video/webm";
        const blobToUpload = recordedBlob || new Blob(chunks, { type: mimeType });

        const formData = new FormData();
        formData.append("video", blobToUpload, "hr-interview.webm");
        if (sessionId) formData.append("sessionId", sessionId);
        if (session?.targetRole) formData.append("jobRole", session.targetRole);
        formData.append("title", `HR Interview - ${session?.targetRole || "Role"}`);
        formData.append("duration", recordingSec.toString());

        const res = await fetch("/api/hr/recordings/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to upload recording");
        }

        setRecordingState("saved");
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 5000);

        if (callbackAfterSave) {
          callbackAfterSave();
        }
      } catch (err: any) {
        console.error("Save recording error:", err);
        alert("Failed to save recording: " + err.message);
        setRecordingState("stopped");
      }
    }, 600);
  };

  const currentQ = session?.questions[currentIdx];
  const { setActiveQuestion } = useActiveInterview();

  React.useEffect(() => {
    if (!currentQ) {
      setActiveQuestion(null);
      return;
    }
    setActiveQuestion({
      roundNumber: 5,
      roundName: "HR Round",
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
      alert("Please provide an answer before submitting.");
      return;
    }

    setSubmittingAnswer(true);

    try {
      if (isListeningCandidate && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListeningCandidate(false);
      }

      await fetch("/api/hr/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: transcript.trim(),
          durationSeconds: durationSec,
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
      alert("Error saving HR response: " + err.message);
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

      await fetch("/api/hr/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          transcript: "[Question skipped by candidate]",
          durationSeconds: durationSec,
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

      await fetch("/api/hr/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      router.push(`/hr/results?sessionId=${sessionId}`);
    } catch (err: any) {
      alert("Failed to conclude HR round: " + err.message);
      setEndingSession(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAutoStartHR = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Software Engineer",
          company: "Google",
          experienceLevel: "FRESHER",
          tone: "PROFESSIONAL",
        }),
      });
      const json = await res.json();
      const newSessionId = json.data?.sessionId || json.sessionId;
      if (newSessionId) {
        router.push(`/hr/meeting?sessionId=${newSessionId}`);
      } else {
        router.push("/hr/setup");
      }
    } catch {
      router.push("/hr/setup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Connecting with Senior HR Director...</p>
      </div>
    );
  }

  if (!session || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-slate-900 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Round 5 HR Room</h2>
          <p className="text-xs text-slate-400">Could not locate an active HR interview session. Start fresh to begin Round 5.</p>
          <div className="space-y-2 pt-2">
            <Button onClick={handleAutoStartHR} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Start Round 5 Now
            </Button>
            <Button variant="outline" onClick={() => router.push("/hr/setup")} className="w-full border-slate-700 text-slate-200">
              Configure HR Round
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Google Meet Bar */}
      <header className="h-14 px-4 md:px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>HR Director Interview • {session.targetRole}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">{session.companyName}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Recording Status Pill */}
          {recordingState === "recording" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>REC {formatTimer(recordingSec)}</span>
            </div>
          )}
          {recordingState === "paused" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>PAUSED {formatTimer(recordingSec)}</span>
            </div>
          )}
          {recordingState === "saved" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </div>
          )}
          {recordingState === "stopped" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Square className="w-3 h-3" />
              <span>Stopped (Unsaved)</span>
            </div>
          )}
          {recordingState === "idle" && (
            <button
              onClick={handleRequestStartRecording}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-purple-500/60 text-slate-300 hover:text-white text-xs transition-colors"
              title="Click to start optional video recording"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Record Interview</span>
            </button>
          )}

          {/* Meeting Elapsed Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono">
            <span>Room {formatTimer(elapsedSec)}</span>
          </div>

          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
            Question {currentIdx + 1}/{session.questions.length}
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
            onClick={handleSaveAndExit}
            className="text-xs h-8 px-3 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            title="Leave room and preserve progress"
          >
            Save & Exit
          </Button>
        </div>
      </header>

      {/* Main Grid: 2 Video Feeds */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Panel 1: AI HR Director (Sarah Jenkins) */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl transition-transform ${
                  isSpeakingHR ? "scale-105 ring-4 ring-rose-500/50" : ""
                }`}
              >
                <UserCheck className="w-12 h-12 md:w-16 md:h-16" />
              </div>
              {isSpeakingHR && (
                <div className="absolute inset-0 rounded-3xl border-2 border-rose-400 animate-ping opacity-75" />
              )}
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white">Sarah Jenkins</h3>
              <p className="text-xs text-slate-400">Senior HR Director • 15+ Yrs Experience</p>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 h-6">
              {[50, 80, 95, 65, 75, 45, 90, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeakingHR ? "bg-rose-400" : "bg-slate-700"
                  }`}
                  style={{ height: isSpeakingHR ? `${h}%` : "20%" }}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 backdrop-blur-md border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              HR Director Connected
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

        {/* Panel 2: Candidate Video */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xl min-h-[280px]">
          {videoEnabled && !cameraError ? (
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
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">
                  {cameraError ? "Camera Access Required" : "Camera Disabled"}
                </span>
                {cameraError && (
                  <p className="text-[11px] text-rose-400 max-w-xs">{cameraError}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCamera()}
                className="text-xs h-7 gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Camera Permission</span>
              </Button>
            </div>
          )}

          {/* Recording indicator badge inside candidate video */}
          {recordingState === "recording" && (
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-rose-500/40 text-[11px] font-mono text-rose-400 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>RECORDING {formatTimer(recordingSec)}</span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>You (Candidate)</span>
          </div>

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
                  HR Question {currentIdx + 1} of {session.questions.length}
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
            {/* Left Controls: Media & Recording */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
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
                onClick={() => setAudioEnabled(!audioEnabled)}
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

              {/* Recording Controls */}
              {recordingState === "idle" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestStartRecording}
                  className="text-xs h-9 gap-1.5 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300"
                >
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Record</span>
                </Button>
              )}

              {recordingState === "recording" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseRecording}
                    className="text-xs h-9 gap-1.5 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopRecording}
                    className="text-xs h-9 gap-1.5 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </Button>
                </div>
              )}

              {recordingState === "paused" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeRecording}
                    className="text-xs h-9 gap-1.5 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopRecording}
                    className="text-xs h-9 gap-1.5 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </Button>
                </div>
              )}

              {recordingState === "stopped" && (
                <Button
                  size="sm"
                  onClick={() => handleSaveRecording()}
                  className="text-xs h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Recording</span>
                </Button>
              )}

              {recordingState === "saving" && (
                <Button
                  size="sm"
                  disabled
                  className="text-xs h-9 gap-1.5 bg-slate-800 text-slate-300 border border-slate-700"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Saving to Repository...</span>
                </Button>
              )}

              {saveSuccessNotice && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
                  Recording Saved Successfully!
                </Badge>
              )}
            </div>

            {/* Right Controls: Assessment Flow */}
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
                <span>End HR Round</span>
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
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentIdx < session.questions.length - 1 ? "Submit & Next Question" : "Submit & Complete HR Round"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* Explicit User Consent Modal for Recording & Speech Transcription */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">HR Interview Recording & Transcription</h3>
                <p className="text-xs text-slate-400">Privacy, Retention & Fair Evaluation Standards</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Speech-to-Text Transcription:</strong> Spoken responses are transcribed using your browser speech engine. You can inspect, edit, or correct any transcription errors before submitting.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Ethical Non-Discrimination:</strong> Evaluation is strictly content- and evidence-based (Role fit, motivation, collaboration). There is <em>zero marks penalty</em> for speaking confidence, accent, minor grammar slips, disability-related speech differences, or recording quality.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Optional Video Recording:</strong> Recording video is 100% optional for personal review. If audio is unclear or speech recognition fails, you can retry, type manually, or mark questions as "Unable to Assess" without zero penalty.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Data Retention & Control:</strong> The recording is saved strictly to your personal account in the HR Recordings tab. You can download or permanently delete your recordings anytime.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConsentModal(false)}
                className="text-xs border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Continue Without Recording
              </Button>
              <Button
                size="sm"
                onClick={executeStartRecording}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Film className="w-4 h-4" />
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
            <h3 className="text-lg font-bold text-white">Conclude HR Interview?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your answers will be analyzed by the HR Director across all 5 evaluation criteria (Communication, Role Fit, Professional Presence, Problem Solving, and Behavioral Competency).
            </p>

            {/* Prompt if recording is active or unsaved */}
            {(recordingState === "recording" || recordingState === "paused" || recordingState === "stopped") && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                <Film className="w-4 h-4 shrink-0 text-purple-400" />
                <span>You have an interview recording. Would you like to save it before concluding?</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEndModal(false)}
                className="text-xs w-full sm:w-auto border-slate-700 text-slate-300"
              >
                Return to Meeting
              </Button>

              {(recordingState === "recording" || recordingState === "paused" || recordingState === "stopped") && (
                <Button
                  size="sm"
                  onClick={() => handleSaveRecording(handleEndMeeting)}
                  disabled={endingSession}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs w-full sm:w-auto"
                >
                  Save & Conclude
                </Button>
              )}

              <Button
                size="sm"
                disabled={endingSession}
                onClick={handleEndMeeting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs w-full sm:w-auto"
              >
                {endingSession ? "Evaluating..." : "Conclude & View Results"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HRMeetingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <HRMeetingContent />
    </React.Suspense>
  );
}
