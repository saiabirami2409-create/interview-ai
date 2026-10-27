"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  Filter,
  Sparkles,
  Code2,
  Check,
  X,
  RotateCcw,
  Video,
  ArrowRight,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

function AnswerReviewContent() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [questions, setQuestions] = React.useState<ReviewQuestion[]>([]);
  const [filter, setFilter] = React.useState<"all" | "correct" | "incorrect" | "unanswered">("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/interviews/${assessmentId}/review`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load answer review.");
        }
        setQuestions(json.data.questions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  const filteredQuestions = questions.filter((q) => {
    if (filter === "correct") return q.isCorrect;
    if (filter === "incorrect") return !q.isCorrect && q.selectedOption !== null;
    if (filter === "unanswered") return q.selectedOption === null;
    return true;
  });

  const correctCount = questions.filter((q) => q.isCorrect).length;
  const incorrectCount = questions.filter((q) => !q.isCorrect && q.selectedOption !== null).length;
  const unansweredCount = questions.filter((q) => q.selectedOption === null).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading Verified Answer Key & Explanations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-lg">
          <h2 className="text-lg font-bold">Review Unavailable</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">
              Detailed Answer Key & Reasoning
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/interview/results?id=${assessmentId}`}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Report</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Title & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Diagnostic Review</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Question-by-Question Analysis
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Analyze correct solutions and understand why distractor options are incorrect.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "all" ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter("correct")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "correct" ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "incorrect" ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Incorrect ({incorrectCount})
            </button>
            {unansweredCount > 0 && (
              <button
                onClick={() => setFilter("unanswered")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === "unanswered" ? "bg-white dark:bg-slate-900 text-slate-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Unanswered ({unansweredCount})
              </button>
            )}
          </div>
        </div>

        {/* QUESTIONS LIST */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const isUnanswered = q.selectedOption === null;
            const isCorrect = q.isCorrect;

            let statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Correct</span>
              </span>
            );

            if (isUnanswered) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Unanswered</span>
                </span>
              );
            } else if (!isCorrect) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Incorrect</span>
                </span>
              );
            }

            return (
              <div
                key={q.questionId}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs font-mono">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Topic: {q.topic}</span>
                  </div>
                  <div>{statusBadge}</div>
                </div>

                {/* Question Text */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap font-sans">
                  {q.question}
                </h3>

                {/* 4 Options with Visual Highlight */}
                <div className="space-y-2.5">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const optText = q.options[letter];
                    const isUserChoice = q.selectedOption === letter;
                    const isRightAnswer = q.correctOption === letter;

                    let cardClass =
                      "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300";

                    if (isRightAnswer) {
                      cardClass =
                        "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500";
                    } else if (isUserChoice && !isRightAnswer) {
                      cardClass =
                        "border-red-400 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 line-through ring-1 ring-red-400";
                    }

                    return (
                      <div
                        key={letter}
                        className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${cardClass}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                            isRightAnswer
                              ? "bg-emerald-600 text-white"
                              : isUserChoice
                              ? "bg-red-500 text-white"
                              : "border border-slate-300 dark:border-slate-600 text-slate-500"
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1 font-mono sm:font-sans leading-relaxed">
                          {optText}
                        </div>
                        {isRightAnswer && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 uppercase tracking-wider">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isRightAnswer && (
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0 uppercase tracking-wider">
                            ✗ Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-1.5 text-xs">
                  <div className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Technical Explanation & Execution Logic</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Back Button */}
        <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/interview/results?id=${assessmentId}`}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Score Report</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/interview/behavioral?from=${assessmentId}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-sm"
            >
              <Video className="w-4 h-4" />
              <span>Proceed to Round 2: Behavioral</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/interview/setup"
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Start New Interview
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12">
        © 2026 InterviewAI • Practice Smarter. Interview Better.
      </footer>
    </div>
  );
}

export default function AnswerReviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading Verified Answer Key & Explanations...</p>
          </div>
        </div>
      }
    >
      <AnswerReviewContent />
    </React.Suspense>
  );
}
