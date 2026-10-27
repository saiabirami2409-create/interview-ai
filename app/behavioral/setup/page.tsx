"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Video,
  Mic,
  Building2,
  Briefcase,
  Layers,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Shield,
  Bot,
  Clock,
  Upload,
  Check,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

const TARGET_COMPANIES = [
  { name: "Google", values: "Googleyness, navigating ambiguity, collaborative leadership, 10x impact" },
  { name: "Amazon", values: "Customer obsession, ownership, bias for action, invent and simplify, deliver results" },
  { name: "Microsoft", values: "Growth mindset, customer empathy, diversity and inclusion, one Microsoft" },
  { name: "Meta", values: "Move fast, focus on long-term impact, build awesome things, be direct" },
  { name: "Netflix", values: "Context not control, high performance culture, candid feedback, freedom & responsibility" },
  { name: "Stripe", values: "Users first, rigorous execution, operational excellence, macro curiosity" },
  { name: "Early-Stage Startup", values: "Scrappy adaptability, extreme ownership, rapid iteration, speed of delivery" },
];

function BehavioralSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSession = searchParams.get("fromSession");
  const initialRole = searchParams.get("role") || "Software Engineer";

  const [role, setRole] = React.useState(initialRole);
  const [selectedCompany, setSelectedCompany] = React.useState(TARGET_COMPANIES[0].name);
  const [cultureNotes, setCultureNotes] = React.useState(TARGET_COMPANIES[0].values);
  const [durationMinutes, setDurationMinutes] = React.useState(15);
  const [resumeFileName, setResumeFileName] = React.useState<string | null>(null);
  const [candidateContext, setCandidateContext] = React.useState(
    "Final-year student / Fresher with hands-on project experience in web engineering and team hackathons."
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCompanySelect = (comp: typeof TARGET_COMPANIES[0]) => {
    setSelectedCompany(comp.name);
    setCultureNotes(comp.values);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
    }
  };

  const handleProceed = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/behavioral/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          company: selectedCompany,
          durationMinutes,
          fromSession: fromSession || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to initialize behavioral round");
      }

      const sessionId = json.data?.sessionId || json.sessionId;
      router.push(
        `/behavioral/meeting?sessionId=${sessionId}&role=${encodeURIComponent(role)}&company=${encodeURIComponent(
          selectedCompany
        )}`
      );
    } catch (err: any) {
      setError(err.message || "Could not start behavioral interview session.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href={fromSession ? `/technical/results?sessionId=${fromSession}` : "/dashboard"}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Round 4: Behavioral Round
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={4} completedRounds={[1, 2, 3]} />

        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none">
            Round 4: Behavioral & Leadership (STAR Method)
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Behavioral Interview Preparation
          </h1>
          <p className="text-sm text-muted-foreground">
            Practice real-world behavioral interview questions with an AI interviewer.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Target Job Role */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-500" />
              Job Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Software Engineer, Frontend Engineer, AI Engineer"
            />
          </div>

          {/* Target Company Selection */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-500" />
                Target Company
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                The AI behavioral interviewer adjusts probing questions based on the company's evaluation rubric.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {TARGET_COMPANIES.map((comp) => {
                const isSelected = selectedCompany === comp.name;
                return (
                  <button
                    key={comp.name}
                    type="button"
                    onClick={() => handleCompanySelect(comp)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{comp.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resume Upload & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume Upload */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Resume Upload (Optional)
              </label>
              <p className="text-xs text-muted-foreground">
                Tailor situational questions to projects and experiences on your resume.
              </p>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-foreground">
                  {resumeFileName ? resumeFileName : "Upload PDF or DOCX resume"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Interview Duration */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Interview Duration
              </label>
              <p className="text-xs text-muted-foreground">
                Select your preferred mock interview duration.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-3 rounded-xl border text-center font-bold text-xs transition ${
                      durationMinutes === mins
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Camera and Microphone Setup Information */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-500" />
              Interview Device Permissions Notice
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To respect your privacy, camera and microphone access will be requested only when you launch Round 4 and enter the meeting room. You can record your responses, replay them, or proceed without recording at any time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-bold">Webcam Video</p>
                    <p className="text-[10px] text-muted-foreground">Requested upon room entry</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 dark:border-purple-800">
                  On-Demand
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-bold">Microphone & Speech</p>
                    <p className="text-[10px] text-muted-foreground">For verbal answers & STAR analysis</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 dark:border-purple-800">
                  On-Demand
                </Badge>
              </div>
            </div>
          </div>

          {/* Launch Behavioral Round Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={handleProceed}
              disabled={loading || !role.trim()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 px-8 h-12 gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Configuring Interview Room...</span>
                </>
              ) : (
                <>
                  <span>Launch Behavioral Round</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BehavioralSetupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BehavioralSetupContent />
    </React.Suspense>
  );
}
