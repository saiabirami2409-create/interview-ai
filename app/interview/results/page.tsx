"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  BarChart3,
  Brain,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Award,
  Printer,
  Copy,
  Check,
  Share2,
  Zap,
  FileText,
  Filter,
  ShieldCheck,
  ChevronRight,
  Code2,
  Video,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface ResultsData {
  assessment: {
    id: string;
    jobRole: string;
    topics: string[];
    submittedAt: string;
    status: "submitted" | "expired";
  };
  result: {
    assessmentId: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    score: number;
    percentage: number;
    accuracy: number;
    timeTakenSeconds: number;
    category:
      | "excellent"
      | "very_good"
      | "good"
      | "needs_improvement"
      | "more_practice_recommended";
  };
  topicPerformance: Array<{
    topic: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  difficultyPerformance: Array<{
    difficulty: "Intermediate" | "Advanced";
    total: number;
    correct: number;
    percentage: number;
  }>;
}

interface FeedbackReport {
  id: string;
  assessmentId: string;
  overallSummary: string;
  strongestSkills: string[];
  areasForImprovement: string[];
  recommendedTopics: string[];
  suggestedNextAssessment: {
    jobRole: string;
    topics: string[];
    difficulty: "Intermediate" | "Advanced";
  };
}

interface ReviewQuestion {
  questionId: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedOption: "A" | "B" | "C" | "D" | null;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: "Intermediate" | "Advanced";
  topic: string;
  isCorrect: boolean;
}

type ActiveTab = "overview" | "questions" | "ai_insights" | "action_plan";

function AssessmentResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [data, setData] = React.useState<ResultsData | null>(null);
  const [feedback, setFeedback] = React.useState<FeedbackReport | null>(null);
  const [reviewQuestions, setReviewQuestions] = React.useState<ReviewQuestion[]>([]);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("overview");
  const [questionFilter, setQuestionFilter] = React.useState<"all" | "incorrect" | "correct" | "unanswered">("all");
  const [copied, setCopied] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [feedbackLoading, setFeedbackLoading] = React.useState(true);
  const [reviewLoading, setReviewLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided.");
      setLoading(false);
      return;
    }

    // 1. Fetch assessment summary results
    fetch(`/api/interviews/${assessmentId}/results`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load results.");
        }
        setData(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // 2. Fetch or generate AI feedback report
    fetch(`/api/ai/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.report) {
          setFeedback(json.data.report);
        }
      })
      .catch((err) => console.error("Feedback error:", err))
      .finally(() => setFeedbackLoading(false));

    // 3. Fetch detailed review questions for the integrated deep-dive tab
    fetch(`/api/interviews/${assessmentId}/review`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.questions)) {
          setReviewQuestions(json.data.questions);
        }
      })
      .catch((err) => console.error("Review fetch error:", err))
      .finally(() => setReviewLoading(false));
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Synthesizing Assessment Telemetry...
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Compiling score matrices, topic mastery, and Gemini intelligence
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Assessment Report Unavailable</h2>
          <p className="text-xs text-slate-500">{error || "Could not load test report."}</p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { result, topicPerformance, difficultyPerformance, assessment } = data;

  // Format time taken
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Speed and pacing analysis
  const avgSecondsPerQ = result.totalQuestions > 0 ? Math.round(result.timeTakenSeconds / result.totalQuestions) : 0;
  const getPacingAnalysis = () => {
    if (avgSecondsPerQ < 25) {
      return {
        label: "Rapid Pacing",
        badge: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        desc: "Answered rapidly. Ensure edge cases and tricky distractors are double-checked.",
      };
    }
    if (avgSecondsPerQ <= 75) {
      return {
        label: "Optimal Pacing",
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        desc: "Balanced time-per-question demonstrating steady reasoning under pressure.",
      };
    }
    return {
      label: "Methodical / Deliberate",
      badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      desc: "Thorough consideration. Practice time-boxed drills to avoid deadline pressure.",
    };
  };
  const pacingInfo = getPacingAnalysis();

  // Performance category styling & text
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "excellent":
        return {
          title: "Placement Ready",
          tierName: "Top 5% Tier",
          badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          ringColor: "border-emerald-500",
          desc: "90–100% Score — Outstanding technical aptitude across core fundamentals and advanced architecture.",
        };
      case "very_good":
        return {
          title: "Strong Competency",
          tierName: "Interview Ready",
          badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          ringColor: "border-blue-500",
          desc: "75–89% Score — Solid conceptual foundation with minor refinements needed in complex edge cases.",
        };
      case "good":
        return {
          title: "Competent",
          tierName: "Targeted Refinement",
          badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
          ringColor: "border-purple-500",
          desc: "60–74% Score — Core knowledge established. Deeper focus recommended on output prediction and optimization.",
        };
      case "needs_improvement":
        return {
          title: "Developing",
          tierName: "Foundational Gaps",
          badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          ringColor: "border-amber-500",
          desc: "40–59% Score — Core topics understood but advanced scenarios and edge cases require deliberate practice.",
        };
      default:
        return {
          title: "Foundational Practice",
          tierName: "Preparation Stage",
          badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
          ringColor: "border-rose-500",
          desc: "Below 40% Score — Review core principles and code output logic before attempting high-concurrency rounds.",
        };
    }
  };

  const catDetails = getCategoryDetails(result.category);

  // Donut chart data
  const donutData = [
    { name: "Correct", value: result.correctAnswers, color: "#10B981" },
    { name: "Incorrect", value: result.incorrectAnswers, color: "#EF4444" },
    { name: "Unanswered", value: result.unansweredQuestions, color: "#94A3B8" },
  ].filter((d) => d.value > 0);

  // Filtering review questions
  const filteredQuestions = reviewQuestions.filter((q) => {
    if (questionFilter === "incorrect") return !q.isCorrect && q.selectedOption !== null;
    if (questionFilter === "correct") return q.isCorrect;
    if (questionFilter === "unanswered") return q.selectedOption === null;
    return true;
  });

  // Action: Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Action: Copy Summary
  const handleCopySummary = () => {
    const text = `📊 InterviewAI Performance Report
Job Role: ${assessment.jobRole}
Date: ${new Date(assessment.submittedAt).toLocaleDateString()}
Score: ${result.score}/${result.totalQuestions} (${result.percentage}%)
Accuracy: ${result.accuracy}%
Readiness Tier: ${catDetails.title} (${catDetails.tierName})
Pacing: ${formatDuration(result.timeTakenSeconds)} (avg ${avgSecondsPerQ}s/question)
AI Summary: ${feedback?.overallSummary || "Successfully evaluated under strict server-side timed conditions."}
Verified on InterviewAI.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors print:bg-white print:text-black">
      {/* Top Header - Hidden when printing */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{assessment.jobRole}</span>
              <span>•</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">Executive Report</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8 print:p-0 print:space-y-6">
        {/* REPORT HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Verified Technical Evaluation • {assessment.jobRole}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Technical Assessment Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Session ID: <span className="font-mono text-purple-600 dark:text-purple-400">{assessment.id.slice(0, 16)}...</span> • Completed on{" "}
              {new Date(assessment.submittedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Print / PDF</span>
            </button>

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
              href={`/interview/behavioral?from=${assessment.id}&role=${encodeURIComponent(assessment.jobRole)}`}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-2 group"
            >
              <Video className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Round 2: Behavioral Round</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/interview/setup"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Test</span>
            </Link>
          </div>
        </div>

        {/* ROUND 2 PROMOTION BANNER */}
        <div className="rounded-3xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-900/15 via-indigo-900/10 to-pink-900/10 p-6 sm:p-7 shadow-lg relative overflow-hidden print:hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-500/30">
                <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Next Step: Round 2 Behavioral Assessment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Complete Your Hiring Loop with Round 2: Behavioral Round
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You&apos;ve completed Round 1 (Technical MCQ). Now practice answering real behavioral questions on camera with our AI interviewer. Get instant STAR method evaluation, pacing analysis, and separated presentation tips.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href={`/interview/behavioral?from=${assessment.id}&role=${encodeURIComponent(assessment.jobRole)}`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5"
              >
                <Video className="w-4 h-4" />
                <span>Start Round 2: Behavioral</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* EXECUTIVE BANNER: SCORE RING & READINESS TIER */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-900/10 via-white dark:via-slate-900 to-indigo-900/5 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Circular Score Badge */}
            <div className={`relative w-36 h-36 flex items-center justify-center rounded-full bg-white dark:bg-slate-950 border-4 ${catDetails.ringColor} shadow-xl shrink-0`}>
              <div className="text-center">
                <span className="block text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {result.percentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Final Score
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catDetails.badgeColor}`}>
                  <Award className="w-4 h-4" />
                  <span>{catDetails.title}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {catDetails.tierName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {result.score} of {result.totalQuestions} Questions Solved Correctly
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                {catDetails.desc}
              </p>
            </div>
          </div>

          {/* Quick Assessment Meta Card */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2 w-full md:w-72 font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Target Role:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{assessment.jobRole}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Assessment Time:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDuration(result.timeTakenSeconds)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Avg Speed:</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">{avgSecondsPerQ}s / question</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Pacing Status:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{pacingInfo.label}</span>
            </div>
          </div>
        </div>

        {/* 6 PERFORMANCE STATISTIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Score */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Total Marks</span>
            <div className="text-2xl font-extrabold text-purple-600 font-mono">
              {result.score}/{result.totalQuestions}
            </div>
            <span className="text-[10px] text-slate-400">1 mark per Q</span>
          </div>

          {/* Card 2: Correct */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Correct Answers</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">
              {result.correctAnswers}
            </div>
            <span className="text-[10px] text-emerald-600/80 font-medium">
              +{result.score} pts
            </span>
          </div>

          {/* Card 3: Incorrect */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Incorrect Answers</span>
            <div className="text-2xl font-extrabold text-red-500 font-mono">
              {result.incorrectAnswers}
            </div>
            <span className="text-[10px] text-red-500/80 font-medium">0 pts awarded</span>
          </div>

          {/* Card 4: Unanswered */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Unanswered</span>
            <div className="text-2xl font-extrabold text-slate-400 font-mono">
              {result.unansweredQuestions}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Skipped / Expired</span>
          </div>

          {/* Card 5: Accuracy */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Accuracy Rate</span>
            <div className="text-2xl font-extrabold text-blue-600 font-mono">
              {result.accuracy}%
            </div>
            <span className="text-[10px] text-slate-400">Correct / Attempted</span>
          </div>

          {/* Card 6: Time */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Total Duration</span>
            <div className="text-2xl font-extrabold text-indigo-600 font-mono">
              {formatDuration(result.timeTakenSeconds)}
            </div>
            <span className="text-[10px] text-slate-400">{avgSecondsPerQ}s / Q avg</span>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Overview & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "questions"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question-by-Question Deep Dive ({reviewQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ai_insights")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ai_insights"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Gemini AI Technical Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("action_plan")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "action_plan"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Remediation Roadmap</span>
          </button>
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW & CHARTS */}
        {(activeTab === "overview" || typeof window === "undefined") && (
          <div className="space-y-8">
            {/* 3 Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Donut Answer Breakdown */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span>Answer Distribution</span>
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Difficulty Performance */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Difficulty Performance (%)</span>
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyPerformance}>
                      <XAxis dataKey="difficulty" stroke="#94A3B8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Topic-wise Performance Bar Chart */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Topic-Wise Mastery (%)</span>
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicPerformance} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                      <YAxis dataKey="topic" type="category" width={95} stroke="#94A3B8" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#06B6D4" radius={[0, 4, 4, 0]} name="Mastery %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Topic Competency Matrix */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Technical Topic Competency Matrix</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicPerformance.map((t, idx) => {
                  const isMastered = t.percentage >= 80;
                  const isCompetent = t.percentage >= 50 && t.percentage < 80;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{t.topic}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            isMastered
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : isCompetent
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isMastered ? "Mastered" : isCompetent ? "Competent" : "Needs Practice"} ({t.correct}/{t.total})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMastered ? "bg-emerald-500" : isCompetent ? "bg-blue-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${t.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GEMINI AI TECHNICAL AUDIT */}
        {(activeTab === "ai_insights" || typeof window === "undefined") && (
          <section className="rounded-3xl border border-purple-200 dark:border-purple-800/80 bg-gradient-to-br from-purple-500/5 via-card to-card p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-mono">
                  <Brain className="w-4 h-4" />
                  <span>Google Gemini AI • Bar-Raiser Technical Audit</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Intelligent Assessment Evaluation
                </h2>
              </div>
              {feedbackLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-600 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing evaluation...</span>
                </div>
              )}
            </div>

            {feedback ? (
              <div className="space-y-6 text-sm">
                {/* Executive Summary */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive Interviewer Summary</span>
                  </span>
                  <p className="text-sm leading-relaxed">{feedback.overallSummary}</p>
                </div>

                {/* Grid: Strengths vs Blindspots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strongest Skills */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                    <h3 className="font-bold text-xs uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Demonstrated Strengths</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {feedback.strongestSkills.map((skill, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
                    <h3 className="font-bold text-xs uppercase text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>Critical Blindspots & Gaps</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {feedback.areasForImprovement.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Next Assessment Recommendation Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Suggested Next Technical Milestone</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
                      Role: {feedback.suggestedNextAssessment?.jobRole || assessment.jobRole}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
                      Difficulty: {feedback.suggestedNextAssessment?.difficulty || "Advanced"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(feedback.recommendedTopics || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Evaluating candidate responses and generating feedback...
              </div>
            )}
          </section>
        )}

        {/* TAB 3: QUESTION-BY-QUESTION DEEP DIVE */}
        {(activeTab === "questions" || typeof window === "undefined") && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Filter Assessment Questions:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setQuestionFilter("all")}
                  className={`px-3 py-1 rounded-lg transition ${
                    questionFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({reviewQuestions.length})
                </button>
                <button
                  onClick={() => setQuestionFilter("incorrect")}
                  className={`px-3 py-1 rounded-lg transition ${
                    questionFilter === "incorrect"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Incorrect ({result.incorrectAnswers})
                </button>
                <button
                  onClick={() => setQuestionFilter("correct")}
                  className={`px-3 py-1 rounded-lg transition ${
                    questionFilter === "correct"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Correct ({result.correctAnswers})
                </button>
                <button
                  onClick={() => setQuestionFilter("unanswered")}
                  className={`px-3 py-1 rounded-lg transition ${
                    questionFilter === "unanswered"
                      ? "bg-slate-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Skipped ({result.unansweredQuestions})
                </button>
              </div>
            </div>

            {/* Questions List */}
            {reviewLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                Loading verified answer keys & model explanations...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No questions found under the "{questionFilter}" filter.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredQuestions.map((q, idx) => {
                  const isSkipped = q.selectedOption === null;
                  return (
                    <div
                      key={q.questionId || idx}
                      className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 transition space-y-4 shadow-sm ${
                        q.isCorrect
                          ? "border-emerald-200 dark:border-emerald-950/80"
                          : isSkipped
                          ? "border-slate-200 dark:border-slate-800"
                          : "border-red-200 dark:border-red-950/80"
                      }`}
                    >
                      {/* Question Top Tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {q.topic}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {q.difficulty}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {q.isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct (+1)</span>
                            </span>
                          ) : isSkipped ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-500 border border-slate-500/30">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Skipped / Unanswered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {q.question}
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {(["A", "B", "C", "D"] as const).map((optKey) => {
                          const optionText = q.options[optKey];
                          const isCandidateChoice = q.selectedOption === optKey;
                          const isCorrectOption = q.correctOption === optKey;

                          let optionStyle =
                            "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300";

                          if (isCorrectOption) {
                            optionStyle =
                              "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold";
                          } else if (isCandidateChoice && !q.isCorrect) {
                            optionStyle =
                              "border-red-500 bg-red-500/10 text-red-900 dark:text-red-200 font-semibold";
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${optionStyle}`}
                            >
                              <span className="font-mono font-bold shrink-0">{optKey}.</span>
                              <span className="flex-1">{optionText}</span>
                              {isCorrectOption && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded shrink-0">
                                  Correct Key
                                </span>
                              )}
                              {isCandidateChoice && !isCorrectOption && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded shrink-0">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Technical Explanation Box */}
                      <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 text-xs space-y-1.5">
                        <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" />
                          <span>Technical Reasoning & Distractor Analysis:</span>
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REMEDIATION ROADMAP & ACTION PLAN */}
        {(activeTab === "action_plan" || typeof window === "undefined") && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Target className="w-3.5 h-3.5" />
                  <span>Structured 3-Step Remediation Plan</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Actionable Steps to Reach Top-Tier Readiness
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personalized based on your exact incorrect options and topic performance in this assessment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Targeted Topic Drills
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Review foundational logic in{" "}
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {feedback?.areasForImprovement?.[0] || "your lowest scoring topics"}
                    </span>
                    . Work through syntax and memory model edge cases.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Code Output & Distractor Defense
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Practice predicting output of tricky multi-threaded or asynchronous code blocks without running them in a compiler first.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Simulated Follow-up Test
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Retake an assessment configured with 10 questions at Advanced difficulty to lock in concept retention.
                  </p>
                </div>
              </div>

              {/* Follow-up CTA Button */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ready for your follow-up challenge?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target: {feedback?.suggestedNextAssessment?.jobRole || assessment.jobRole} ({feedback?.suggestedNextAssessment?.difficulty || "Advanced"})
                  </p>
                </div>
                <Link
                  href="/interview/setup"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-2 shrink-0"
                >
                  <span>Launch Follow-up Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 print:hidden">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 transition flex items-center gap-1.5"
          >
            <span>← Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/interview/setup"
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Configure New Test</span>
            </Link>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12 print:text-black print:border-black">
        © 2026 InterviewAI • Practice Smarter. Interview Better. • Official Candidate Assessment Report Card
      </footer>
    </div>
  );
}

export default function AssessmentResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Aggregating Performance Analytics...</p>
          </div>
        </div>
      }
    >
      <AssessmentResultsContent />
    </React.Suspense>
  );
}
