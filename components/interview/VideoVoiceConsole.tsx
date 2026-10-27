"use client";

import * as React from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Radio,
  Play,
  Square,
  RefreshCw,
  Eye,
  Shield,
  Layers,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoVoiceConsoleProps {
  onTranscriptChange: (text: string) => void;
  currentAnswerText: string;
  questionText?: string;
  interviewType?: string;
  className?: string;
}

export function VideoVoiceConsole({
  onTranscriptChange,
  currentAnswerText,
  questionText = "",
  interviewType = "BEHAVIORAL",
  className = "",
}: VideoVoiceConsoleProps) {
  // Video & Stream State
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = React.useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = React.useState<boolean>(true);
  const [isMirror, setIsMirror] = React.useState<boolean>(true);
  const [showFaceGuide, setShowFaceGuide] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Speech Recognition (Voice Access / STT)
  const [isListening, setIsListening] = React.useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = React.useState<string>("");
  const recognitionRef = React.useRef<any>(null);

  // Text-to-Speech (Interviewer Voice)
  const [isSpeakingQuestion, setIsSpeakingQuestion] = React.useState<boolean>(false);

  // Audio level visualizer (Web Audio API)
  const [audioLevel, setAudioLevel] = React.useState<number>(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  // Speaking timer
  const [speakingSeconds, setSpeakingSeconds] = React.useState<number>(0);

  // 1. Initialize Webcam & Microphone on Mount
  const startMedia = async () => {
    try {
      setErrorMessage(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Camera & Microphone are not supported in this browser environment.");
        setHasCameraPermission(false);
        return;
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);

      // Setup audio level meter
      setupAudioMeter(stream);
    } catch (err: any) {
      console.warn("Media stream access error:", err);
      setHasCameraPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera/Microphone permission was denied. Please allow access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No webcam or microphone detected on this device.");
      } else {
        setErrorMessage(err.message || "Unable to acquire media stream.");
      }
    }
  };

  // Setup Web Audio API Analyser for live microphone level animation
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level (0 - 100)
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
      console.warn("Web Audio API visualization error:", e);
    }
  };

  // Toggle Video Track
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      const nextState = !isVideoEnabled;
      videoTracks.forEach((track) => (track.enabled = nextState));
      setIsVideoEnabled(nextState);
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const nextState = !isAudioEnabled;
      audioTracks.forEach((track) => (track.enabled = nextState));
      setIsAudioEnabled(nextState);
      if (!nextState && isListening) {
        stopSpeechRecognition();
      }
    }
  };

  // 2. Real-Time Speech Recognition (Voice Access)
  React.useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptChunk + " ";
        } else {
          interim += transcriptChunk;
        }
      }

      setInterimTranscript(interim);

      if (final.trim()) {
        const spacer = currentAnswerText.trim() && !currentAnswerText.endsWith(" ") ? " " : "";
        onTranscriptChange(currentAnswerText + spacer + final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [currentAnswerText, isListening, onTranscriptChange]);

  const startSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("Speech-to-text is not supported by your browser. You can type your response directly.");
      return;
    }

    try {
      setIsListening(true);
      setInterimTranscript("");
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
    }
  };

  const stopSpeechRecognition = () => {
    setIsListening(false);
    setInterimTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  // 3. Speaking timer when listening
  React.useEffect(() => {
    let interval: any = null;
    if (isListening) {
      interval = setInterval(() => {
        setSpeakingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  // 4. Text-to-Speech: AI Interviewer reads question aloud
  const toggleSpeakQuestion = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
      return;
    }

    if (!questionText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  // Start media on mount
  React.useEffect(() => {
    startMedia();

    return () => {
      // Cleanup streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // STAR quick injection
  const injectStarSection = (phase: "Situation" | "Task" | "Action" | "Result") => {
    const tag = `\n[${phase.toUpperCase()}]: `;
    onTranscriptChange(currentAnswerText + tag);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video & Interviewer Console Card */}
      <div className="relative rounded-3xl border border-border/80 bg-slate-900 text-white overflow-hidden shadow-xl shadow-purple-950/20">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              LIVE BEHAVIORAL INTERVIEW
            </span>
            <Badge variant="cyan" className="font-mono text-[10px] py-0 px-2 ml-1">
              HD 720p
            </Badge>
          </div>

          {/* Audio Activity Meter in Header */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Mic Level:
            </span>
            <div className="flex items-end gap-0.5 h-4 w-14 bg-slate-800/80 p-0.5 rounded border border-white/10">
              {[20, 40, 60, 80, 100].map((threshold, idx) => (
                <div
                  key={idx}
                  className={`w-2 rounded-xs transition-all duration-75 ${
                    audioLevel >= threshold
                      ? threshold > 80
                        ? "bg-red-500 h-full"
                        : threshold > 50
                        ? "bg-amber-400 h-3/4"
                        : "bg-emerald-400 h-1/2"
                      : "bg-slate-700 h-1"
                  }`}
                />
              ))}
            </div>

            {/* Speaking Timer */}
            {isListening && (
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                REC {formatSecs(speakingSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Video Stage Container */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Real Webcam Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-all duration-300 ${
              isMirror ? "-scale-x-100" : "scale-x-100"
            } ${!isVideoEnabled || !hasCameraPermission ? "hidden" : "block"}`}
          />

          {/* Fallback Camera Off or Disabled View */}
          {(!isVideoEnabled || !hasCameraPermission) && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
                <VideoOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {!hasCameraPermission ? "Camera Permission Required" : "Camera Turned Off"}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  {errorMessage ||
                    "Enable your camera to simulate an authentic executive video interview."}
                </p>
              </div>
              {!hasCameraPermission && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startMedia}
                  className="gap-1.5 text-xs bg-slate-800 border-white/20 text-white hover:bg-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Camera Access</span>
                </Button>
              )}
            </div>
          )}

          {/* Face Centering Guidance Overlay */}
          {isVideoEnabled && hasCameraPermission && showFaceGuide && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-[48%] border-2 border-dashed border-purple-400/40 animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-mono font-semibold text-purple-300 bg-slate-950/70 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Center Face for Eye Contact
                </span>
              </div>
            </div>
          )}

          {/* AI Interviewer Audio Speaking Indicator */}
          {isSpeakingQuestion && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/90 backdrop-blur-md text-white text-xs font-semibold shadow-lg animate-in fade-in">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Interviewer is Speaking...</span>
            </div>
          )}

          {/* Live Voice Dictation Floating Subtitle */}
          {isListening && interimTranscript && (
            <div className="absolute bottom-16 left-4 right-4 z-10 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-xs text-emerald-300 font-mono animate-in slide-in-from-bottom-2">
              <span className="text-slate-400 mr-1.5 font-bold">Live Transcript:</span>
              <span>"{interimTranscript}"</span>
            </div>
          )}

          {/* Floating In-Video Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-2xl border border-white/10">
              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-2 rounded-xl transition ${
                  isVideoEnabled
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              {/* Microphone Toggle */}
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-2 rounded-xl transition ${
                  isAudioEnabled
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
                title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Mirror Toggle */}
              <button
                type="button"
                onClick={() => setIsMirror(!isMirror)}
                className={`p-2 rounded-xl transition ${
                  isMirror ? "text-purple-400 bg-purple-950/60" : "text-slate-400 hover:text-white"
                }`}
                title="Toggle camera mirror mode"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Face Guide Toggle */}
              <button
                type="button"
                onClick={() => setShowFaceGuide(!showFaceGuide)}
                className={`p-2 rounded-xl transition ${
                  showFaceGuide ? "text-cyan-400 bg-cyan-950/60" : "text-slate-400 hover:text-white"
                }`}
                title="Toggle eye-contact positioning guide"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* AI Voice Read-Aloud Button */}
            {questionText && (
              <button
                type="button"
                onClick={toggleSpeakQuestion}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition shadow-md ${
                  isSpeakingQuestion
                    ? "bg-purple-600 text-white"
                    : "bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-white/10"
                }`}
              >
                {isSpeakingQuestion ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Listen to Question</span>
                    <span className="sm:hidden">Listen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Interactive Voice-to-Text Bar */}
        <div className="p-4 bg-slate-950 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Primary Voice Recording Button */}
            <div className="flex items-center gap-2">
              {!isListening ? (
                <Button
                  type="button"
                  size="md"
                  onClick={startSpeechRecognition}
                  disabled={!isAudioEnabled}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2 px-4 shadow-lg shadow-emerald-950/40"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Start Voice Response (Dictation)</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="md"
                  onClick={stopSpeechRecognition}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold gap-2 px-4 shadow-lg shadow-red-950/40"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Voice Dictation</span>
                </Button>
              )}

              {isListening && (
                <span className="text-xs font-mono text-emerald-400 animate-pulse hidden sm:flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Listening & transcribing spoken answer...</span>
                </span>
              )}
            </div>

            {/* STAR Framework Helper Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 mr-1 hidden md:inline">
                STAR Inject:
              </span>
              {(["Situation", "Task", "Action", "Result"] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => injectStarSection(step)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-semibold border border-white/10 transition"
                  title={`Insert [${step.toUpperCase()}] anchor`}
                >
                  {step[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
