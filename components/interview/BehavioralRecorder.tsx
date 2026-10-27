"use client";

import * as React from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Volume2,
  FileText,
  HelpCircle,
  Eye,
  Radio,
  Send,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BehavioralRecorderProps {
  questionId: string;
  questionText: string;
  orderIndex: number;
  totalQuestions: number;
  category: string;
  competency?: string;
  onAnswerSubmit: (data: {
    transcript: string;
    durationSeconds: number;
    videoBlob?: Blob;
    isTextOnly: boolean;
    userConsented: boolean;
  }) => Promise<void>;
  submitting: boolean;
}

export function BehavioralRecorder({
  questionId,
  questionText,
  orderIndex,
  totalQuestions,
  category,
  competency = "Communication & Leadership",
  onAnswerSubmit,
  submitting,
}: BehavioralRecorderProps) {
  // Mode: "video" | "text_only"
  const [mode, setMode] = React.useState<"video" | "text_only">("video");

  // Consent & Permission States
  const [hasConsented, setHasConsented] = React.useState(false);
  const [hasStreamAccess, setHasStreamAccess] = React.useState(false);
  const [mediaError, setMediaError] = React.useState<string | null>(null);

  // Recording Lifecycle: "idle" | "recording" | "paused" | "stopped"
  const [recordingState, setRecordingState] = React.useState<
    "idle" | "recording" | "paused" | "stopped"
  >("idle");

  // Media stream & recorder refs
  const videoPreviewRef = React.useRef<HTMLVideoElement | null>(null);
  const videoReplayRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Recorded blob & preview URL
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = React.useState<string | null>(null);

  // Replay playback states
  const [isPlayingReplay, setIsPlayingReplay] = React.useState(false);

  // Audio level visualizer (Web Audio API)
  const [audioLevel, setAudioLevel] = React.useState(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  // Speech-to-Text (Web Speech API)
  const [transcript, setTranscript] = React.useState("");
  const recognitionRef = React.useRef<any>(null);

  // Text-only mode typed input
  const [typedAnswer, setTypedAnswer] = React.useState("");

  // Running recording timer
  const [secondsElapsed, setSecondsElapsed] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize audio meter
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(Math.round((avg / 128) * 100), 100);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn("Audio meter init error:", e);
    }
  };

  // 2. Request Camera & Mic Permission (Explicit Consent)
  const handleRequestAccess = async () => {
    setMediaError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam & microphone are not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setHasStreamAccess(true);
      setHasConsented(true);

      setupAudioMeter(stream);
    } catch (err: any) {
      console.warn("Camera/Mic access error:", err);
      setMediaError(
        err.message || "Failed to access camera and microphone. Please check browser permissions."
      );
    }
  };

  // 3. Setup Web Speech Recognition for real-time dictation
  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        setTranscript(fullTranscript.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition init error:", e);
    }
  };

  // 4. Clean up tracks and audio context
  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      stopAllTracks();
    };
  }, []);

  // 5. Start Recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setSecondsElapsed(0);
    setTranscript("");

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedVideoUrl(url);
      };

      recorder.start(1000); // 1-second chunks
      setRecordingState("recording");

      // Start timer
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev >= 180) {
            // Auto stop at 3 minutes
            handleStopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);

      // Start speech dictation
      setupSpeechRecognition();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      setMediaError("Could not start recording. Please try again.");
    }
  };

  // 6. Pause Recording
  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  // 7. Resume Recording
  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  };

  // 8. Stop Recording
  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  // 9. Retake Answer (Clears recorded media with confirmation)
  const handleRetakeAnswer = () => {
    if (
      confirm("Are you sure you want to discard this recording and record a new answer?")
    ) {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      setRecordedBlob(null);
      setRecordedVideoUrl(null);
      setRecordingState("idle");
      setSecondsElapsed(0);
      setTranscript("");
      setIsPlayingReplay(false);
    }
  };

  // 10. Replay video controls
  const handleToggleReplay = () => {
    if (!videoReplayRef.current) return;
    if (videoReplayRef.current.paused) {
      videoReplayRef.current.play();
      setIsPlayingReplay(true);
    } else {
      videoReplayRef.current.pause();
      setIsPlayingReplay(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Handle final submission
  const handleSubmit = async () => {
    const isText = mode === "text_only";
    const finalTranscript = isText ? typedAnswer.trim() : transcript.trim();

    if (!finalTranscript && !recordedBlob) {
      alert("Please record or write your answer before submitting.");
      return;
    }

    await onAnswerSubmit({
      transcript: finalTranscript,
      durationSeconds: isText ? 60 : Math.max(secondsElapsed, 15),
      videoBlob: recordedBlob || undefined,
      isTextOnly: isText,
      userConsented: hasConsented,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* QUESTION HEADER CARD */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="violet" className="text-xs font-mono">
              Question {orderIndex + 1} of {totalQuestions}
            </Badge>
            <Badge variant="cyan" className="text-xs font-mono">
              Round 2: Behavioral
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "video" ? "text_only" : "video")}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>
                {mode === "video"
                  ? "Switch to Text-Only Mode (Accessible)"
                  : "Switch to Camera & Mic Video Mode"}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Competency: {category} ({competency})</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
            {questionText}
          </h2>
        </div>

        {/* STAR Strategy Tip */}
        <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>STAR Guidance:</strong> Structure your response around <strong>Situation</strong> (context & stakes), <strong>Task</strong> (your explicit responsibility), <strong>Action</strong> (specific choices & technical steps you drove), and <strong>Result</strong> (quantifiable metrics or lessons learned).
          </p>
        </div>
      </div>

      {/* MODE 1: ACCESSIBLE TEXT-ONLY ALTERNATIVE */}
      {mode === "text_only" && (
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Accessible Text-Only Response Mode</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type your behavioral answer at your own pace. Your answer will be evaluated with the exact same rigorous content and STAR rubrics.
            </p>
          </div>

          <textarea
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            rows={8}
            placeholder="Structure your answer using the STAR method:&#10;&#10;Situation: During our peak release cycle...&#10;Task: My responsibility was to...&#10;Action: I decided to...&#10;Result: We achieved a 40% reduction in..."
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-sans placeholder:text-slate-400"
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Word count: {typedAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              Tip: Answers with 80+ words and concrete metrics score highest.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !typedAnswer.trim()}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Content & STAR Rubric...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Submit Text Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: CAMERA & MICROPHONE VIDEO MODE */}
      {mode === "video" && (
        <div className="space-y-6">
          {/* STEP 1: PRE-RECORDING CONSENT & PERMISSIONS MODAL/BOX */}
          {!hasStreamAccess && (
            <div className="p-6 sm:p-8 rounded-3xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-b from-purple-50/50 to-white dark:from-slate-900 dark:to-slate-950 shadow-xl space-y-6 text-center animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Video className="w-7 h-7" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Camera & Microphone Permissions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  To provide a realistic mock interview experience, this round captures your camera preview and microphone audio for automated pacing and STAR analysis.
                </p>
              </div>

              {/* Privacy and Sovereignty Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>No Background Recording</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Recording starts strictly when you click Record and terminates when you stop.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Review Before Submit</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Replay, retake, or delete your recording before finalizing submission.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>Full Delete Controls</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    You can permanently purge any recording from storage with a single click.
                  </p>
                </div>
              </div>

              {mediaError && (
                <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{mediaError}</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={handleRequestAccess}
                  className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Grant Access & Start Preview</span>
                </button>
                <button
                  onClick={() => setMode("text_only")}
                  className="text-xs text-slate-500 hover:text-purple-600 underline cursor-pointer"
                >
                  I don&apos;t have a camera or microphone — Use Text-Only Mode
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE VIDEO CONSOLE (PREVIEW / RECORD / REPLAY) */}
          {hasStreamAccess && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
              {/* VIDEO VIEWFINDER AREA */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {/* 1. Live Camera Preview (when idle, recording, or paused) */}
                {recordingState !== "stopped" && (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                )}

                {/* 2. Replay Video Element (when stopped) */}
                {recordingState === "stopped" && recordedVideoUrl && (
                  <video
                    ref={videoReplayRef}
                    src={recordedVideoUrl}
                    playsInline
                    onEnded={() => setIsPlayingReplay(false)}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Live Face Guide Overlay (Optional visual cue) */}
                {recordingState === "idle" && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center">
                      <span className="text-[11px] font-mono text-white/60 bg-black/40 px-2 py-0.5 rounded-full">
                        Align Face Here
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Status Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  {recordingState === "recording" && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold font-mono animate-pulse shadow-lg">
                      <Radio className="w-3.5 h-3.5" />
                      <span>REC {formatTime(secondsElapsed)} / 03:00</span>
                    </div>
                  )}

                  {recordingState === "paused" && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold font-mono shadow-lg">
                      <Pause className="w-3.5 h-3.5" />
                      <span>PAUSED ({formatTime(secondsElapsed)})</span>
                    </div>
                  )}

                  {recordingState === "stopped" && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold font-mono shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Answer Recorded ({formatTime(secondsElapsed)})</span>
                    </div>
                  )}

                  {recordingState === "idle" && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-mono backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Camera Preview Ready</span>
                    </div>
                  )}

                  {/* Audio Level Visualizer Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-mono">
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <div className="flex items-center gap-0.5 h-3 w-16 bg-white/20 rounded-full px-1">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-purple-400 transition-all duration-75"
                        style={{ width: `${Math.max(audioLevel, 5)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-300">
                      {audioLevel > 15 ? "Audible" : "Mic Live"}
                    </span>
                  </div>
                </div>

                {/* Replay Overlay Controls (when in stopped review state) */}
                {recordingState === "stopped" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <button
                      onClick={handleToggleReplay}
                      className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl transition transform hover:scale-105 cursor-pointer"
                    >
                      {isPlayingReplay ? (
                        <Pause className="w-7 h-7" />
                      ) : (
                        <Play className="w-7 h-7 ml-1" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* RECORDING CONTROL BUTTONS BAR */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Start Recording (from idle) */}
                  {recordingState === "idle" && (
                    <button
                      onClick={handleStartRecording}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Start Recording</span>
                    </button>
                  )}

                  {/* Pause / Resume Recording */}
                  {recordingState === "recording" && (
                    <button
                      onClick={handlePauseRecording}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}

                  {recordingState === "paused" && (
                    <button
                      onClick={handleResumeRecording}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                  )}

                  {/* Stop Recording */}
                  {(recordingState === "recording" || recordingState === "paused") && (
                    <button
                      onClick={handleStopRecording}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop & Review</span>
                    </button>
                  )}

                  {/* Replay Button (when stopped) */}
                  {recordingState === "stopped" && (
                    <button
                      onClick={handleToggleReplay}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPlayingReplay ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Replay</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Replay Answer</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Retake Button (when stopped) */}
                  {recordingState === "stopped" && (
                    <button
                      onClick={handleRetakeAnswer}
                      className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Answer</span>
                    </button>
                  )}
                </div>

                {/* Right side: Delete or Submit */}
                <div className="flex items-center gap-2">
                  {recordingState === "stopped" && (
                    <>
                      <button
                        onClick={handleRetakeAnswer}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Delete this recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing STAR Structure...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Confirm & Submit Answer</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* LIVE TRANSCRIPT REVIEW AREA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Real-Time Speech Transcription & Verbal Draft:</span>
                  </span>
                  <span>{transcript ? transcript.split(/\s+/).length : 0} words transcribed</span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    recordingState === "recording"
                      ? "Listening to your spoken response in real-time..."
                      : "Your transcribed verbal answer will appear here. You can also edit it before submitting."
                  }
                  rows={3}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
