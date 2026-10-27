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
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Settings,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function BehavioralPrejoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const role = searchParams.get("role") || "Software Engineer";
  const company = searchParams.get("company") || "Google";

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [micVolume, setMicVolume] = React.useState(0);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [speakerTested, setSpeakerTested] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Initialize camera & mic
  React.useEffect(() => {
    let localStream: MediaStream | null = null;

    async function setupDevices() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera and Microphone APIs not supported in this browser.");
        }

        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        // Set up Web Audio API volume meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(localStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err: any) {
        console.warn("Media device access error:", err);
        setHasPermission(false);
        setErrorMsg(
          err.name === "NotAllowedError"
            ? "Camera/Microphone permission denied. Please allow camera and mic permissions in your browser bar."
            : err.message || "Failed to access camera or microphone."
        );
      }
    }

    setupDevices();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const testSpeakers = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);

      setSpeakerTested(true);
      setTimeout(() => setSpeakerTested(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinMeeting = () => {
    if (!sessionId) {
      alert("Session ID missing. Please return to setup.");
      return;
    }
    router.push(`/behavioral/meeting?sessionId=${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
            Device Pre-Flight Check
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Camera Preview Stream (Google Meet Pre-join Style) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {videoEnabled && hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                <VideoOff className="w-12 h-12" />
                <span className="text-xs font-medium">Camera is turned off</span>
              </div>
            )}

            {/* Video Overlay Name Pill */}
            <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Candidate Preview</span>
            </div>

            {/* Audio Volume Visualizer Pill */}
            <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
              {audioEnabled ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${audioEnabled ? micVolume : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl border transition-all ${
                videoEnabled
                  ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-100"
                  : "bg-rose-600/20 border-rose-500 text-rose-400 hover:bg-rose-600/30"
              }`}
              title="Toggle Camera"
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3.5 rounded-2xl border transition-all ${
                audioEnabled
                  ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-100"
                  : "bg-rose-600/20 border-rose-500 text-rose-400 hover:bg-rose-600/30"
              }`}
              title="Toggle Microphone"
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={testSpeakers}
              className="p-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-100 transition-all flex items-center gap-2 text-xs font-semibold px-4"
              title="Test Speakers"
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>{speakerTested ? "Chime Played!" : "Test Audio"}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Meeting Readiness Card & Join CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
              Google Meet Experience
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ready to Join the Meeting?
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are about to enter the live Behavioral Interview for{" "}
              <span className="font-semibold text-slate-200">{role}</span> at{" "}
              <span className="font-semibold text-slate-200">{company}</span>.
            </p>
          </div>

          {/* Readiness Checklist */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              System Pre-Flight Checklist
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Camera Feed</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {videoEnabled && hasPermission ? "Ready" : "Turned Off"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Microphone Input</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {audioEnabled && hasPermission ? "Active" : "Muted"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Speech-to-Text Engine</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">STAR Evaluator</span>
                <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Active
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleJoinMeeting}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/20 h-13 text-sm gap-2"
          >
            <span>Join Behavioral Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-[11px] text-center text-slate-500">
            No video recording is stored permanently. Audio is transcribed client-side for evaluation.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function BehavioralPrejoinPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BehavioralPrejoinContent />
    </React.Suspense>
  );
}
