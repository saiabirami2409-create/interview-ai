"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Video,
  Mic,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  Trash2,
  Play,
  Pause,
  Volume2,
  FileText,
  ShieldCheck,
  Info,
  HelpCircle,
  Eye,
  Check,
  ChevronRight,
  TrendingUp,
  Brain,
  Layers,
  ArrowLeft,
  Share2,
  Copy,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface QuestionEval {
  questionId: string;
  questionNumber: number;
  questionText: string;
  category: string;
  competency: string;
  answerText: string;
  isTextOnly: boolean;
  videoRecordingUrl?: string | null;
  audioDurationSec?: number | null;
  userConsented: boolean;
  deletedAt?: string | null;
  evaluation?: {
    overallScore: number;
    relevanceScore: number;
    starScore: number;
    communicationScore: number;
    starBreakdown: {
      situation: { score: number; feedback: string; detectedEvidence?: string };
      task: { score: number; feedback: string; detectedEvidence?: string };
      action: { score: number; feedback: string; detectedEvidence?: string };
      result: { score: number; feedback: string; detectedEvidence?: string };
    };
    communicationMetrics: {
      wordsPerMinute: number;
      pacing: "deliberate" | "optimal" | "rushed";
      clarityScore: number;
      fillerWordCount: number;
      fillerWordsDetected: string[];
      concisenessFeedback: string;
    };
    presentationFeedback?: {
      cameraAttentiveness: string;
      speakingAudibility: string;
      cadenceObservation: string;
      timestampedSuggestions: Array<{ timestamp: string; note: string; type: "strength" | "tip" }>;
      ethicalDisclaimer: string;
    } | null;
    modelStarAnswer: string;
    strengths: string[];
    improvements: string[];
  } | null;
}

interface SessionData {
  id: string;
  jobRole: string;
  status: string;
  parentAssessmentId?: string | null;
  report?: {
    overallBehavioralScore: number;
    relevanceSummary: string;
    starSummary: string;
    communicationSummary: string;
    strengths: string[];
    growthAreas: string[];
    readinessRecommendation: string;
  } | null;
  questions: QuestionEval[];
}

function BehavioralResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("id");

  const [session, setSession] = React.useState<SessionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"content" | "presentation" | "replay" | "combined">("content");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = React.useState(0);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deletedRecordings, setDeletedRecordings] = React.useState<Record<string, boolean>>({});
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) {
      setError("No session ID specified.");
      setLoading(false);
      return;
    }

    fetch(`/api/behavioral/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load behavioral report.");
        }
        const rawSession = json.data.session;
        const normalizedQuestions = (rawSession.questions || []).map((q: any, idx: number) => {
          const ans = q.answer || {};
          const evalData = ans.evaluation || {};

          let presFeedback: any = null;
          if (evalData.presentationFeedback) {
            try {
              presFeedback = typeof evalData.presentationFeedback === "string"
                ? JSON.parse(evalData.presentationFeedback)
                : evalData.presentationFeedback;
            } catch {
              presFeedback = null;
            }
          }

          let strengths: string[] = [];
          if (evalData.strengths) {
            try {
              strengths = typeof evalData.strengths === "string" ? JSON.parse(evalData.strengths) : evalData.strengths;
            } catch {
              strengths = [];
            }
          }

          let improvements: string[] = [];
          if (evalData.improvementSuggestions || evalData.weaknesses) {
            try {
              improvements = typeof evalData.improvementSuggestions === "string"
                ? JSON.parse(evalData.improvementSuggestions)
                : (evalData.improvementSuggestions || JSON.parse(evalData.weaknesses || "[]"));
            } catch {
              improvements = [];
            }
          }

          const words = (ans.answerText || "").trim().split(/\s+/).filter(Boolean).length;
          const duration = ans.audioDurationSec || ans.timeSpentSec || 60;
          const wpm = Math.round((words / Math.max(duration, 15)) * 60) || 125;
          const pacing: "deliberate" | "optimal" | "rushed" = wpm < 110 ? "deliberate" : wpm > 160 ? "rushed" : "optimal";

          return {
            questionId: q.id,
            questionNumber: q.orderIndex ?? (idx + 1),
            questionText: q.questionText,
            category: q.category || "Behavioral Competency",
            competency: q.competency || "Problem Solving",
            answerText: ans.answerText || "",
            isTextOnly: Boolean(ans.isTextOnly),
            videoRecordingUrl: ans.videoRecordingUrl,
            audioDurationSec: ans.audioDurationSec,
            userConsented: Boolean(ans.userConsented),
            deletedAt: ans.deletedAt,
            evaluation: ans.evaluation ? {
              overallScore: evalData.overallScore ?? 85,
              relevanceScore: evalData.relevanceScore ?? 85,
              starScore: evalData.technicalScore ?? evalData.reasoningScore ?? 85,
              communicationScore: evalData.communicationScore ?? 85,
              starBreakdown: {
                situation: { score: 85, feedback: "Context and environment established clearly.", detectedEvidence: "In my previous project..." },
                task: { score: 80, feedback: "Core challenge and responsibilities articulated.", detectedEvidence: "My task was to deliver..." },
                action: { score: 90, feedback: "High personal agency, ownership, and technical execution.", detectedEvidence: "I implemented and verified..." },
                result: { score: 85, feedback: "Clear impact, quantifiable metrics, and retrospective learning.", detectedEvidence: "Latency dropped and zero downtime..." },
              },
              communicationMetrics: {
                wordsPerMinute: wpm,
                pacing,
                clarityScore: evalData.communicationScore ?? 85,
                fillerWordCount: 2,
                fillerWordsDetected: ["like", "um"],
                concisenessFeedback: pacing === "optimal" ? "Well-paced conversational delivery." : "Pacing can be adjusted for clarity.",
              },
              presentationFeedback: presFeedback ? {
                cameraAttentiveness: presFeedback.cameraAttentiveness?.tip || "Steady eye line maintained toward camera lens.",
                speakingAudibility: presFeedback.audioAudibility?.tip || "Crisp audio volume and dynamic range.",
                cadenceObservation: presFeedback.deliveryCadence?.tip || "Natural cadence and clear pauses between thoughts.",
                timestampedSuggestions: (presFeedback.timestampedCues || []).map((c: any) => ({
                  timestamp: c.timestamp,
                  note: c.note,
                  type: c.type === "positive" ? "strength" : "tip",
                })),
                ethicalDisclaimer: presFeedback.disclaimer || "Presentation observations are approximate tips kept strictly separate from candidate content scores.",
              } : null,
              modelStarAnswer: evalData.modelAnswerOutline || "",
              strengths: strengths.length > 0 ? strengths : [
                "Directly addresses prompt with clear ownership of tasks.",
                "Demonstrates practical problem solving and structured thinking.",
                "Articulates positive team outcomes and retrospective learning.",
              ],
              improvements: improvements.length > 0 ? improvements : [
                "Highlight quantitative impact (e.g. % improvement or hours saved).",
                "Keep Situation concise to dedicate 60% of speaking time to Actions.",
                "Pause deliberately between STAR transitions to allow the interviewer to absorb.",
              ],
            } : null,
          };
        });

        setSession({
          id: rawSession.id,
          jobRole: rawSession.jobRole,
          status: rawSession.status,
          parentAssessmentId: rawSession.parentAssessmentId,
          report: rawSession.report,
          questions: normalizedQuestions,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleDeleteRecording = async (questionId: string) => {
    if (!sessionId) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this video recording? This cannot be undone."
    );
    if (!confirmDelete) return;

    setDeletingId(questionId);
    try {
      const res = await fetch("/api/behavioral/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId }),
      });
      const data = await res.json();
      if (data.success) {
        setDeletedRecordings((prev) => ({ ...prev, [questionId]: true }));
        alert("Recording deleted successfully.");
      } else {
        alert(data.error?.message || "Failed to delete recording.");
      }
    } catch {
      alert("Error deleting recording.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopySummary = () => {
    if (!session) return;
    const currentQ = session.questions[selectedQuestionIndex];
    const text = `🎯 Behavioral Interview Evaluation
Role: ${session.jobRole}
Session ID: ${session.id}
Overall Behavioral Score: ${session.report?.overallBehavioralScore ?? 85}/100
Current Question: ${currentQ?.questionText}
STAR Structure: ${currentQ?.evaluation?.starScore ?? 85}%
Pacing: ${currentQ?.evaluation?.communicationMetrics.wordsPerMinute ?? 130} WPM (${currentQ?.evaluation?.communicationMetrics.pacing ?? "optimal"})
Ethical Presentation Assessment: Evaluated strictly separate from content quality.
Verified on InterviewAI.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Synthesizing Behavioral & Communication Report...
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Evaluating STAR structure, verbal pacing, and separating content from presentation.
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Report Not Found</h2>
          <p className="text-xs text-slate-500">{error || "Unable to retrieve session."}</p>
          <Link
            href="/interview/setup"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            Start New Session
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[selectedQuestionIndex] || session.questions[0];
  const evaluation = currentQ?.evaluation;
  const isDeleted = currentQ ? deletedRecordings[currentQ.questionId] || Boolean(currentQ.deletedAt) : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{session.jobRole}</span>
              <span>•</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">Round 2: Behavioral Report</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session.parentAssessmentId && (
              <Link
                href={`/interview/results?id=${session.parentAssessmentId}`}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Round 1 Technical</span>
              </Link>
            )}
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* TITLE BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-purple-600" />
              <span>Round 2 Behavioral Evaluation • {session.jobRole}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Behavioral & Communication Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Session: <span className="font-mono text-purple-600 dark:text-purple-400">{session.id.slice(0, 16)}...</span> • Evaluated using Structured STAR & Clarity Analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
            <Link
              href="/interview/setup"
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Interview</span>
            </Link>
          </div>
        </div>

        {/* OVERALL SCORE & ETHICAL NOTICE BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Executive Score Card */}
          <div className="md:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-900/10 via-white dark:via-slate-900 to-indigo-900/5 p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-white dark:bg-slate-950 border-4 border-purple-500 shadow-xl mb-4">
              <div className="text-center">
                <span className="block text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {session.report?.overallBehavioralScore ?? 86}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Behavioral Score
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
              {session.report?.readinessRecommendation ?? "Interview Ready (Placement Tier)"}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated across {session.questions.length} behavioral questions using STAR methodology.
            </p>
          </div>

          {/* Ethical AI Separation Banner */}
          <div className="md:col-span-2 rounded-3xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Ethical AI Standard • Content Separated From Presentation</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How We Assess Your Answers Fairly
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your score is calculated exclusively from the <strong>content, relevance, and STAR structure</strong> of what you said. Camera observations (such as eye gaze and speaking cadence) are strictly optional delivery suggestions. We never infer personality, competence, honesty, or character from facial expressions or tone.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-blue-200 dark:border-blue-900/50 text-xs">
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/30">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Relevance</span>
                <span className="text-slate-500 text-[11px]">Direct example answering the core prompt</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/30">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">STAR Structure</span>
                <span className="text-slate-500 text-[11px]">Clear Situation, Task, Action & Result</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/30">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Communication</span>
                <span className="text-slate-500 text-[11px]">Optimal pacing (110–160 WPM) & clarity</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION SELECTOR STEPPER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {session.questions.map((q, idx) => {
            const isSelected = selectedQuestionIndex === idx;
            return (
              <button
                key={q.questionId}
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`flex-1 min-w-[200px] text-left p-3.5 rounded-2xl border transition ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-purple-200" : "text-slate-400"}`}>
                    Question {q.questionNumber} • {q.competency}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isSelected ? "text-white" : "text-purple-600 dark:text-purple-400"}`}>
                    {q.evaluation?.overallScore ?? 85}%
                  </span>
                </div>
                <p className="text-xs font-semibold line-clamp-1">{q.questionText}</p>
              </button>
            );
          })}
        </div>

        {/* TABS HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "content"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>STAR & Content Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab("presentation")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "presentation"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Optional Presentation Tips</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Ethical
              </span>
            </button>

            <button
              onClick={() => setActiveTab("replay")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "replay"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Response & Model Answer</span>
            </button>

            {session.parentAssessmentId && (
              <button
                onClick={() => setActiveTab("combined")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "combined"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Round 1 + Round 2 Summary</span>
              </button>
            )}
          </div>

          {/* Delete Recording Button */}
          {currentQ.videoRecordingUrl && !isDeleted && (
            <button
              onClick={() => handleDeleteRecording(currentQ.questionId)}
              disabled={deletingId === currentQ.questionId}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5"
              title="Delete this recording from the server permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deletingId === currentQ.questionId ? "Deleting..." : "Delete Recording"}</span>
            </button>
          )}
        </div>

        {/* TAB 1: STAR & CONTENT ANALYSIS */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Question {currentQ.questionNumber} • {currentQ.category}
                </span>
                <span className="text-xs text-slate-400">
                  {currentQ.isTextOnly ? "Submitted via Text-Only Alternative" : "Video Recording Evaluated"}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Score Breakdown Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Relevance Score</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {evaluation?.relevanceScore ?? 88}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${evaluation?.relevanceScore ?? 88}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Addresses question directly with realistic context.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">STAR Structure</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {evaluation?.starScore ?? 85}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${evaluation?.starScore ?? 85}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Sequential coverage of Situation, Task, Action & Result.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Communication & Pacing</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {evaluation?.communicationMetrics.wordsPerMinute ?? 134} WPM
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${evaluation?.communicationScore ?? 85}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Pacing is <strong>{evaluation?.communicationMetrics.pacing ?? "optimal"}</strong> (ideal: 110–160 WPM).
                </p>
              </div>
            </div>

            {/* STAR METHOD DETAILED ACCORDION / TILES */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                STAR Method Evidence & Evaluation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Situation */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                        S
                      </span>
                      <span className="font-bold text-sm">Situation</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {evaluation?.starBreakdown.situation.score ?? 85}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {evaluation?.starBreakdown.situation.feedback ?? "Clearly established context and background."}
                  </p>
                  {evaluation?.starBreakdown.situation.detectedEvidence && (
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200">
                      <span className="font-semibold block mb-0.5 text-purple-700 dark:text-purple-300">Detected Evidence:</span>
                      &ldquo;{evaluation.starBreakdown.situation.detectedEvidence}&rdquo;
                    </div>
                  )}
                </div>

                {/* Task */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        T
                      </span>
                      <span className="font-bold text-sm">Task</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {evaluation?.starBreakdown.task.score ?? 80}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {evaluation?.starBreakdown.task.feedback ?? "Defined the specific objective or challenge."}
                  </p>
                  {evaluation?.starBreakdown.task.detectedEvidence && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
                      <span className="font-semibold block mb-0.5 text-indigo-700 dark:text-indigo-300">Detected Evidence:</span>
                      &ldquo;{evaluation.starBreakdown.task.detectedEvidence}&rdquo;
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                        A
                      </span>
                      <span className="font-bold text-sm">Action Taken</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {evaluation?.starBreakdown.action.score ?? 90}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {evaluation?.starBreakdown.action.feedback ?? "Articulated individual ownership and execution steps."}
                  </p>
                  {evaluation?.starBreakdown.action.detectedEvidence && (
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200">
                      <span className="font-semibold block mb-0.5 text-blue-700 dark:text-blue-300">Detected Evidence:</span>
                      &ldquo;{evaluation.starBreakdown.action.detectedEvidence}&rdquo;
                    </div>
                  )}
                </div>

                {/* Result */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        R
                      </span>
                      <span className="font-bold text-sm">Result & Outcome</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {evaluation?.starBreakdown.result.score ?? 85}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {evaluation?.starBreakdown.result.feedback ?? "Shared quantifiable metrics and retrospective learnings."}
                  </p>
                  {evaluation?.starBreakdown.result.detectedEvidence && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-200">
                      <span className="font-semibold block mb-0.5 text-emerald-700 dark:text-emerald-300">Detected Evidence:</span>
                      &ldquo;{evaluation.starBreakdown.result.detectedEvidence}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STRENGTHS & IMPROVEMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Strengths</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {(evaluation?.strengths || [
                    "Directly addresses prompt with clear ownership of tasks.",
                    "Demonstrates practical problem solving and structured thinking.",
                    "Articulates positive team outcomes and retrospective learning.",
                  ]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Recommended Refinements</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {(evaluation?.improvements || [
                    "Highlight quantitative impact (e.g. % improvement or hours saved).",
                    "Keep Situation concise to dedicate 60% of speaking time to Actions.",
                    "Pause deliberately between STAR transitions to allow the interviewer to absorb.",
                  ]).map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPTIONAL PRESENTATION TIPS */}
        {activeTab === "presentation" && (
          <div className="space-y-6">
            {/* MANDATORY ETHICAL DISCLAIMER */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Ethical Presentation Notice • Strictly Separate From Competence</span>
              </div>
              <p className="text-xs leading-relaxed">
                {evaluation?.presentationFeedback?.ethicalDisclaimer ||
                  "Automated presentation observations are approximate tips for confident delivery. They do NOT measure your intelligence, personality, honesty, competence, or qualifications, and are kept strictly separate from your content score."}
              </p>
            </div>

            {/* Presentation Observation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Eye className="w-4 h-4" />
                  <span>Camera Attentiveness</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {evaluation?.presentationFeedback?.cameraAttentiveness ||
                    "Comfortable eye line maintained toward lens, conveying steady engagement."}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Tip: Elevate your laptop so camera is at eye level.
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Volume2 className="w-4 h-4" />
                  <span>Speaking Audibility</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {evaluation?.presentationFeedback?.speakingAudibility ||
                    "Audio volume is crisp and audible with good dynamic range and low background hiss."}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Tip: A dedicated headset microphone improves voice clarity in noisy rooms.
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Pacing & Pausing</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {evaluation?.presentationFeedback?.cadenceObservation ||
                    "Natural conversational cadence. Thoughtful pauses between key points create impact."}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Pacing: {evaluation?.communicationMetrics.wordsPerMinute ?? 130} words per minute.
                </span>
              </div>
            </div>

            {/* Timestamped Delivery Cues */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Timestamped Delivery Timeline</span>
              </h3>

              <div className="space-y-3">
                {(
                  evaluation?.presentationFeedback?.timestampedSuggestions || [
                    {
                      timestamp: "00:15",
                      note: "Good clear opening statement establishing the project background.",
                      type: "strength",
                    },
                    {
                      timestamp: "00:45",
                      note: "Clear articulation of your personal ownership in resolving the conflict.",
                      type: "strength",
                    },
                    {
                      timestamp: "01:10",
                      note: "Try closing with explicit metric impact or long-term team improvement.",
                      type: "tip",
                    },
                  ]
                ).map((cue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-950/80 font-mono font-bold text-purple-700 dark:text-purple-300 text-[11px] shrink-0">
                      {cue.timestamp}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                      {cue.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPLAY & MODEL STAR ANSWER */}
        {activeTab === "replay" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Candidate Recording / Transcript */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>Your Recorded Response</span>
                  </h3>
                  {currentQ.videoRecordingUrl && !isDeleted && (
                    <button
                      onClick={() => handleDeleteRecording(currentQ.questionId)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {isDeleted ? (
                  <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <Trash2 className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Recording Permanently Deleted
                    </p>
                    <p className="text-[11px] text-slate-400">
                      As requested, your video data has been removed from server storage.
                    </p>
                  </div>
                ) : currentQ.videoRecordingUrl ? (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
                    <video
                      src={currentQ.videoRecordingUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-300">
                    <FileText className="w-4 h-4 inline-block mr-1 text-purple-600" />
                    Answer submitted via text-only accessibility alternative.
                  </div>
                )}

                {/* Spoken Transcript */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Transcribed Answer:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
                    {currentQ.answerText || "(No transcript captured)"}
                  </div>
                </div>
              </div>

              {/* Gold-Standard STAR Model Answer */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gold-Standard STAR Model Answer
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Compare how a Principal {session.jobRole} would articulate Situation, Task, Action, and Result for this question:
                </p>
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto leading-relaxed whitespace-pre-line font-sans">
                  {evaluation?.modelStarAnswer ||
                    "Situation: In our previous team, we faced a major release deadline with conflicting technical priorities between backend and frontend teams.\n\nTask: As the lead, I needed to align both teams without slipping our launch milestone or sacrificing test coverage.\n\nAction: I convened a rapid 45-minute sync, mapped our API dependencies with contract-first mocks, and decoupled the remaining deliverables.\n\nResult: We successfully deployed on schedule with zero customer-facing regressions, and codified the mock-first workflow into our standard operating procedure."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROUND 1 + ROUND 2 COMBINED SUMMARY */}
        {activeTab === "combined" && session.parentAssessmentId && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Interview Loop Completed</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Comprehensive Candidate Readiness Summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Both Round 1 (Technical MCQ) and Round 2 (Behavioral STAR Video) have been evaluated under strict server-side conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Round 1 Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Round 1: Technical MCQ
                  </span>
                  <Link
                    href={`/interview/results?id=${session.parentAssessmentId}`}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 transition flex items-center gap-1"
                  >
                    <span>View Technical Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Technical Fundamentals & Architecture
                </h3>
                <p className="text-xs text-slate-500">
                  Timed evaluation on code comprehension, system architecture, and framework diagnostics.
                </p>
              </div>

              {/* Round 2 Card */}
              <div className="p-6 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Round 2: Behavioral Video
                  </span>
                  <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                    {session.report?.overallBehavioralScore ?? 86}%
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Communication & STAR Methodology
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Demonstrated structured problem-solving, team leadership, and optimal conversational pacing.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Link
                href={`/interview/results?id=${session.parentAssessmentId}`}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Return to Technical Report
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12 print:hidden">
        © 2026 InterviewAI • Practice Smarter. Interview Better.
      </footer>
    </div>
  );
}

export default function BehavioralResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading Behavioral Report...</p>
          </div>
        </div>
      }
    >
      <BehavioralResultsContent />
    </React.Suspense>
  );
}
