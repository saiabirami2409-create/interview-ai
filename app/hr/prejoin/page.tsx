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
  UserCheck,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function HRPrejoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const role = searchParams.get("role") || "Software Engineer";
  const company = searchParams.get("company") || "Google";

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [micVolume, setMicVolume] = React.useState(0);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [speakerTested, setSpeakerTested] = React.useState(false);

  React.useEffect(() => {
    let localStream: MediaStream | null = null;

    async function initMedia() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(localStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setHasPermission(false);
      }
    }

    initMedia();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (!stream) return;
    const vTrack = stream.getVideoTracks()[0];
    if (vTrack) {
      vTrack.enabled = !vTrack.enabled;
      setVideoEnabled(vTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!stream) return;
    const aTrack = stream.getAudioTracks()[0];
    if (aTrack) {
      aTrack.enabled = !aTrack.enabled;
      setAudioEnabled(aTrack.enabled);
    }
  };

  const testSpeakers = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
      setSpeakerTested(true);
      setTimeout(() => setSpeakerTested(false), 2500);
    } catch {}
  };

  const handleEnterMeeting = () => {
    if (!sessionId) {
      alert("Session ID missing.");
      return;
    }
    router.push(`/hr/meeting?sessionId=${sessionId}`);
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
            HR Pre-Flight Check
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Video Preview */}
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
                <span className="text-xs font-medium">Camera is off</span>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Candidate Preview</span>
            </div>

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
                  : "bg-rose-600/20 border-rose-500 text-rose-400"
              }`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3.5 rounded-2xl border transition-all ${
                audioEnabled
                  ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-100"
                  : "bg-rose-600/20 border-rose-500 text-rose-400"
              }`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={testSpeakers}
              className="p-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-100 transition-all flex items-center gap-2 text-xs font-semibold px-4"
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>{speakerTested ? "Chime Heard!" : "Test Audio"}</span>
            </button>
          </div>
        </div>

        {/* Right: Meeting Info & Enter CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
              Round 3 Executive Interview
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enter HR Director Room
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interviewing with <span className="text-slate-200 font-semibold">Sarah Jenkins</span> for the{" "}
              <span className="text-slate-200 font-semibold">{role}</span> role at{" "}
              <span className="text-slate-200 font-semibold">{company}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              HR Evaluation Criteria
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>1. Communication Clarity</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span>2. Professional Presence</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span>3. Culture & Team Alignment</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span>4. Motivation & Self-Awareness</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span>5. Conflict Resolution</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <Button
            onClick={handleEnterMeeting}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/20 h-13 text-sm gap-2"
          >
            <span>Enter HR Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function HRPrejoinPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <HRPrejoinContent />
    </React.Suspense>
  );
}
