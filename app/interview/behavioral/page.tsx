"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Send,
  Loader2,
  FileText,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { BehavioralRecorder } from "@/components/interview/BehavioralRecorder";

interface BehavioralQuestion {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  expectedCriteria: string;
  hints?: string;
  answer?: {
    id: string;
    answerText: string;
    videoRecordingUrl?: string;
    evaluation?: any;
  } | null;
}

interface BehavioralSession {
  id: string;
  title: string;
  targetRole: string;
  interviewType: string;
  status: string;
  questions: BehavioralQuestion[];
}

function BehavioralInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAssessmentId = searchParams.get("from");
  const targetRoleParam = searchParams.get("role") || "Software Engineer";

  const [session, setSession] = React.useState<BehavioralSession | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize or fetch behavioral session
  React.useEffect(() => {
    async function initSession() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/behavioral/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole: targetRoleParam,
            parentAssessmentId: fromAssessmentId || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to start behavioral round.");
        }

        setSession(json.data.session);

        // Advance to first unanswered question if returning to an in-progress session
        const questions: BehavioralQuestion[] = json.data.session.questions || [];
        const firstUnanswered = questions.findIndex((q) => !q.answer);
        if (firstUnanswered !== -1) {
          setCurrentIdx(firstUnanswered);
        } else if (questions.length > 0 && questions.every((q) => q.answer)) {
          router.push(`/interview/behavioral/results?id=${json.data.session.id}`);
          return;
        }
      } catch (err: any) {
        console.error("Init behavioral session error:", err);
        setError(err.message || "Failed to load behavioral session.");
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [fromAssessmentId, targetRoleParam]);

  // Handle Answer Submission
  const handleAnswerSubmit = async (data: {
    transcript: string;
    durationSeconds: number;
    videoBlob?: Blob;
    isTextOnly: boolean;
    userConsented: boolean;
  }) => {
    if (!session) return;
    const currentQ = session.questions[currentIdx];
    if (!currentQ) return;

    setSubmitting(true);
    try {
      let videoRecordingUrl: string | undefined = undefined;

      // 1. Upload video if present
      if (data.videoBlob) {
        const formData = new FormData();
        formData.append("video", data.videoBlob, `${currentQ.id}.webm`);
        formData.append("sessionId", session.id);
        formData.append("questionId", currentQ.id);

        const uploadRes = await fetch("/api/behavioral/upload", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.success) {
          videoRecordingUrl = uploadJson.data.recordingUrl;
        }
      }

      // 2. Submit Answer & Evaluation
      const submitRes = await fetch("/api/behavioral/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQ.id,
          transcript: data.transcript,
          durationSeconds: data.durationSeconds,
          videoRecordingUrl,
          isTextOnly: data.isTextOnly,
          userConsented: data.userConsented,
        }),
      });

      const submitJson = await submitRes.json();
      if (!submitRes.ok || !submitJson.success) {
        throw new Error(submitJson?.error?.message || "Failed to evaluate answer.");
      }

      // 3. Move to next question or complete interview
      if (currentIdx + 1 < session.questions.length) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        // All questions completed! Route to behavioral evaluation report
        router.push(`/interview/behavioral/results?id=${session.id}`);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">
            Calibrating Round 2: Behavioral Video Interview...
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold">Round 2 Unavailable</h2>
          <p className="text-xs text-slate-500">{error || "Could not load session."}</p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
              <Badge variant="cyan" className="font-mono text-[10px]">
                Round 2 of 2
              </Badge>
              <span className="text-slate-600 dark:text-slate-400">
                Behavioral Video Interview • {session.targetRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {fromAssessmentId && (
              <Link
                href={`/interview/results?id=${fromAssessmentId}`}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline hidden sm:inline"
              >
                ← View Round 1 Report
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* QUESTION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {session.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                  idx === currentIdx
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : q.answer
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-500">
            {session.questions.filter((q) => q.answer).length} / {session.questions.length} Answered
          </span>
        </div>
      </div>

      {/* MAIN RECORDING WORKSPACE */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {currentQuestion && (
          <BehavioralRecorder
            key={currentQuestion.id}
            questionId={currentQuestion.id}
            questionText={currentQuestion.questionText}
            orderIndex={currentIdx}
            totalQuestions={session.questions.length}
            category={currentQuestion.category}
            onAnswerSubmit={handleAnswerSubmit}
            submitting={submitting}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12">
        © 2026 InterviewAI • Practice Smarter. Interview Better. • Round 2 Behavioral Video Console
      </footer>
    </div>
  );
}

export default function BehavioralInterviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading Behavioral Interview Room...</p>
          </div>
        </div>
      }
    >
      <BehavioralInterviewContent />
    </React.Suspense>
  );
}
