"use client";

import * as React from "react";
import Link from "next/link";
import {
  Brain,
  Code2,
  Database,
  Cpu,
  Globe,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Flag,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Filter,
  BarChart3,
  BookOpen,
  Info,
  ChevronRight,
  Award,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MCQ_TOPIC_METADATA } from "@/server/data/curated-mcq-bank";

interface Question {
  id: string;
  topic: string;
  subtopic?: string | null;
  difficulty: string;
  question: string;
  codeSnippet?: string | null;
  language?: string | null;
  languageVersion?: string | null;
  isVersionDependent: boolean;
  versionWarning?: string | null;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  shuffledIndices: number[];
  referenceTitle?: string | null;
  referenceUrl?: string | null;
  isReviewed: boolean;
  reviewedBy?: string | null;
}

interface AnswerFeedback {
  isCorrect: boolean;
  correctLetter: "A" | "B" | "C" | "D";
  correctOptionIndex: number;
  explanation: string;
  optionExplanations: Record<string, string>;
  referenceTitle?: string | null;
  referenceUrl?: string | null;
  languageVersion?: string | null;
  isVersionDependent: boolean;
  versionWarning?: string | null;
  isReviewed: boolean;
  reviewedBy?: string | null;
}

export default function PracticeQuizPage() {
  // Setup State
  const [selectedTopic, setSelectedTopic] = React.useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("ALL");
  const [selectedCount, setSelectedCount] = React.useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<number | null>(null);
  const [instantFeedbackMode, setInstantFeedbackMode] = React.useState<boolean>(true);

  // Quiz State
  const [quizState, setQuizState] = React.useState<"setup" | "active" | "completed">("setup");
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [selectedOption, setSelectedOption] = React.useState<"A" | "B" | "C" | "D" | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<AnswerFeedback | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = React.useState<Record<string, boolean>>({});

  // Timer & Analytics State
  const [startTime, setStartTime] = React.useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const [resultsSummary, setResultsSummary] = React.useState<{
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    topicsToRevisit: string[];
  } | null>(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = React.useState<boolean>(false);
  const [reportReason, setReportReason] = React.useState<string>("AMBIGUOUS");
  const [reportNotes, setReportNotes] = React.useState<string>("");
  const [reportSuggestedFix, setReportSuggestedFix] = React.useState<string>("");
  const [reportStatus, setReportStatus] = React.useState<string | null>(null);
  const [isReporting, setIsReporting] = React.useState<boolean>(false);

  // UI loading
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submittingAnswer, setSubmittingAnswer] = React.useState<boolean>(false);

  // Countdown timer effect
  React.useEffect(() => {
    if (quizState !== "active" || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      handleCompleteQuiz();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [quizState, remainingSeconds]);

  // Start Practice Quiz
  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/practice/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
          questionCount: selectedCount,
          timeLimitMinutes: timeLimitMinutes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to start practice quiz.");
      }

      setSessionId(json.data.session.id);
      setQuestions(json.data.questions || []);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setFeedback(null);
      setStartTime(Date.now());

      if (timeLimitMinutes) {
        setRemainingSeconds(timeLimitMinutes * 60);
      } else {
        setRemainingSeconds(null);
      }

      setQuizState("active");
    } catch (err: any) {
      alert(`Could not start quiz: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!selectedOption || !sessionId || !currentQ) return;

    setSubmittingAnswer(true);
    try {
      const res = await fetch("/api/practice/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          selectedLetter: selectedOption,
          shuffledIndices: currentQ.shuffledIndices,
          timeSpentSec: 15,
          isBookmarked: Boolean(bookmarkedQuestions[currentQ.id]),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit answer.");
      }

      setFeedback(json.data);
      setIsAnswerSubmitted(true);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Move to Next Question
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setFeedback(null);
    } else {
      handleCompleteQuiz();
    }
  };

  // Complete Quiz & Synthesize Topics to Revisit
  const handleCompleteQuiz = async () => {
    if (!sessionId) return;
    setLoading(true);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const res = await fetch("/api/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          totalTimeSpentSeconds: elapsedSeconds,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to complete quiz.");
      }

      setResultsSummary({
        scorePercentage: json.data.scorePercentage,
        correctCount: json.data.correctCount,
        totalQuestions: json.data.totalQuestions,
        timeSpentSeconds: json.data.timeSpentSeconds,
        topicsToRevisit: json.data.topicsToRevisit || [],
      });
      setQuizState("completed");
    } catch (err: any) {
      console.error("Complete quiz error:", err);
      setQuizState("completed");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (qId: string) => {
    setBookmarkedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Submit Question Report
  const handleSubmitReport = async () => {
    if (!currentQ || !reportNotes.trim()) return;
    setIsReporting(true);
    try {
      const res = await fetch("/api/practice/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          reason: reportReason,
          userNotes: reportNotes,
          suggestedCorrection: reportSuggestedFix,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setReportStatus("Thank you! Your report has been dispatched to our engineering review board.");
        setTimeout(() => {
          setShowReportModal(false);
          setReportStatus(null);
          setReportNotes("");
          setReportSuggestedFix("");
        }, 2000);
      } else {
        alert(json.error?.message || "Failed to submit report.");
      }
    } catch {
      alert("Error submitting report.");
    } finally {
      setIsReporting(false);
    }
  };

  const currentQ = questions[currentIndex];

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-purple-600 dark:text-purple-400 font-bold">MCQ Practice Mode</span>
              <span>•</span>
              <span>Verified Accuracy Question Bank</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/mcq"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400"
            >
              Admin Review
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* ========================================================= */}
        {/* VIEW 1: QUIZ SETUP VIEW */}
        {/* ========================================================= */}
        {quizState === "setup" && (
          <div className="space-y-8">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Peer-Reviewed & Fact-Checked Technical Question Bank</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Technical MCQ Practice Mode
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Practice topic-based quizzes with verified code outputs, single unambiguous answers, and authoritative documentation citations.
              </p>
            </div>

            {/* Topic Selection Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Topic Area
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mixed / All Topics Card */}
                <button
                  type="button"
                  onClick={() => setSelectedTopic("all")}
                  className={`p-5 rounded-2xl border text-left transition relative overflow-hidden group ${
                    selectedTopic === "all"
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-500 group-hover:rotate-12 transition-transform" />
                    </div>
                    {selectedTopic === "all" && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="font-bold text-sm mb-1">Comprehensive Mixed Quiz</h3>
                  <p className={`text-xs leading-relaxed ${selectedTopic === "all" ? "text-purple-100" : "text-slate-500"}`}>
                    Covers questions across programming, algorithms, databases, operating systems, and networking.
                  </p>
                </button>

                {/* Specific Topic Cards */}
                {Object.entries(MCQ_TOPIC_METADATA).map(([key, data]) => {
                  const isSelected = selectedTopic === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTopic(key)}
                      className={`p-5 rounded-2xl border text-left transition relative overflow-hidden group ${
                        isSelected
                          ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {key === "programming" && <Code2 className="w-5 h-5 text-blue-500" />}
                          {key === "dsa" && <Brain className="w-5 h-5 text-purple-500" />}
                          {key === "databases" && <Database className="w-5 h-5 text-emerald-500" />}
                          {key === "os" && <Cpu className="w-5 h-5 text-amber-500" />}
                          {key === "networking" && <Globe className="w-5 h-5 text-cyan-500" />}
                          {key === "system-design" && <Layers className="w-5 h-5 text-rose-500" />}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <h3 className="font-bold text-sm mb-1">{data.title}</h3>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? "text-purple-100" : "text-slate-500"}`}>
                        {data.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customization Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ALL", label: "Mixed" },
                    { id: "BEGINNER", label: "Beginner" },
                    { id: "INTERMEDIATE", label: "Intermediate" },
                    { id: "ADVANCED", label: "Advanced" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(d.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        selectedDifficulty === d.id
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedCount(count)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        selectedCount === count
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Limit */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Time Limit (Optional)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: null, label: "Untimed" },
                    { val: 5, label: "5m" },
                    { val: 10, label: "10m" },
                    { val: 15, label: "15m" },
                  ].map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTimeLimitMinutes(t.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                        timeLimitMinutes === t.val
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading Reviewed Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Practice Quiz</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ACTIVE QUIZ VIEW */}
        {/* ========================================================= */}
        {quizState === "active" && currentQ && (
          <div className="space-y-6">
            {/* Top Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQ.subtopic || currentQ.topic}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentQ.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer if enabled */}
                {remainingSeconds !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(remainingSeconds)}</span>
                  </div>
                )}

                {/* Bookmark Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(currentQ.id)}
                  className={`p-2 rounded-xl border transition ${
                    bookmarkedQuestions[currentQ.id]
                      ? "bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-600"
                      : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                  }`}
                  title="Bookmark question for review"
                >
                  {bookmarkedQuestions[currentQ.id] ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>

                {/* Report Question Button */}
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 transition"
                  title="Report flawed or ambiguous question"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question}
              </h2>

              {/* Code Snippet Box */}
              {currentQ.codeSnippet && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-mono text-slate-300">{currentQ.language || "code"}</span>
                    </div>
                    {currentQ.languageVersion && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                        {currentQ.languageVersion}
                      </span>
                    )}
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Options List */}
              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const text = currentQ.options[letter];
                  if (!text) return null;

                  const isSelected = selectedOption === letter;
                  const isCorrect = feedback?.correctLetter === letter;
                  const isWrongSelected = isAnswerSubmitted && isSelected && !feedback?.isCorrect;

                  let borderClass = "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700";
                  let bgClass = "bg-white dark:bg-slate-900";

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      borderClass = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100";
                    } else if (isWrongSelected) {
                      borderClass = "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100";
                    }
                  } else if (isSelected) {
                    borderClass = "border-purple-600 ring-2 ring-purple-600/20";
                    bgClass = "bg-purple-50/50 dark:bg-purple-950/30";
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => setSelectedOption(letter)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 ${borderClass} ${bgClass}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAnswerSubmitted && isCorrect
                            ? "bg-emerald-500 text-white"
                            : isAnswerSubmitted && isWrongSelected
                            ? "bg-rose-500 text-white"
                            : isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-xs sm:text-sm pt-0.5 leading-relaxed font-sans">
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Check Answer / Next Question */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  {isAnswerSubmitted
                    ? "Answer evaluated with verified references."
                    : "Select one unambiguous option to continue."}
                </span>

                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || submittingAnswer}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {submittingAnswer ? "Evaluating..." : "Check Answer"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-2 shadow-sm"
                  >
                    <span>{currentIndex + 1 < questions.length ? "Next Question" : "Complete Quiz"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* EXPLANATION PANEL (REVEALED IMMEDIATELY AFTER SUBMIT) */}
            {/* ========================================================= */}
            {isAnswerSubmitted && feedback && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Result Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    feedback.isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold block">
                      {feedback.isCorrect ? "Correct!" : "Incorrect."}
                    </span>
                    <span>
                      The correct answer is <strong>Option {feedback.correctLetter}</strong>.
                    </span>
                  </div>
                </div>

                {/* Core Explanation */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Why Option {feedback.correctLetter} is Correct
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {feedback.explanation}
                  </p>
                </div>

                {/* Per-Option Breakdown (Distractor Analysis) */}
                {feedback.optionExplanations && Object.keys(feedback.optionExplanations).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Option Analysis & Distractor Explanations
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5 text-xs">
                      {Object.entries(feedback.optionExplanations).map(([optIdx, expl]) => {
                        const isThisCorrect = Number(optIdx) === feedback.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3.5 rounded-xl border ${
                              isThisCorrect
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="font-bold mr-1">
                              {isThisCorrect ? "✓ Key Answer:" : "✗ Distractor:"}
                            </span>
                            <span>{expl}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Version Dependency Notice if applicable */}
                {feedback.isVersionDependent && feedback.versionWarning && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Version-Dependent Nuance</span>
                      <span>{feedback.versionWarning}</span>
                    </div>
                  </div>
                )}

                {/* Verified Reference Link */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Verified by {feedback.reviewedBy || "Senior Engineering Review Board"}</span>
                  </div>

                  {feedback.referenceUrl && (
                    <a
                      href={feedback.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>{feedback.referenceTitle || "Official Documentation Reference"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: QUIZ RESULTS & TOPICS TO REVISIT */}
        {/* ========================================================= */}
        {quizState === "completed" && resultsSummary && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                Quiz Completed
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Practice Session Summary
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Completed {resultsSummary.totalQuestions} questions in {Math.round(resultsSummary.timeSpentSeconds / 60)} minutes.
              </p>
            </div>

            {/* Score Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/15 via-white dark:via-slate-900 to-indigo-900/10 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full border-4 border-purple-500 bg-white dark:bg-slate-950 flex items-center justify-center shadow-lg shrink-0">
                  <div className="text-center">
                    <span className="block text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {resultsSummary.scorePercentage}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Accuracy</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold">
                    {resultsSummary.correctCount} of {resultsSummary.totalQuestions} Questions Correct
                  </h3>
                  <p className="text-xs text-slate-500">
                    {resultsSummary.scorePercentage >= 75
                      ? "Outstanding grasp of verified technical concepts."
                      : "Targeted refinement recommended on flagged topics below."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuizState("setup")}
                className="px-6 py-3 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-2 shrink-0 shadow-md shadow-purple-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start Another Quiz</span>
              </button>
            </div>

            {/* Topics to Revisit Card */}
            {resultsSummary.topicsToRevisit.length > 0 ? (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Topics to Revisit Based on Your Answers</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  You missed questions in the following conceptual areas. Reviewing these specific topics will build comprehensive readiness:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {resultsSummary.topicsToRevisit.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200 shadow-xs"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopic("all");
                      setQuizState("setup");
                    }}
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <span>Practice these concepts again</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Zero major topic weaknesses detected! You demonstrated consistent accuracy across all tested concepts.</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* REPORT FLAWED QUESTION MODAL */}
      {/* ========================================================= */}
      {showReportModal && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <Flag className="w-4 h-4" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Report Flawed Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Our engineering board investigates every report. If this question contains ambiguous wording, an incorrect key, or outdated runtime quirks, please let us know:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Issue Category
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="AMBIGUOUS">Ambiguous Wording / Multiple Interpretations</option>
                  <option value="INCORRECT_KEY">Incorrect Answer Marked Correct</option>
                  <option value="OUTDATED_VERSION">Outdated Runtime / Version Nuance</option>
                  <option value="CODE_BUG">Code Snippet Syntax Error / Bug</option>
                  <option value="POOR_EXPLANATION">Explanation is Incomplete or Unclear</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  What is wrong with this question? (Required)
                </label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Explain why the marked answer is incorrect or ambiguous..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Suggested Correction or Reference Link (Optional)
                </label>
                <input
                  type="text"
                  value={reportSuggestedFix}
                  onChange={(e) => setReportSuggestedFix(e.target.value)}
                  placeholder="e.g., In Python 3.12 this behaves differently, link to docs..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {reportStatus && (
              <p className="text-xs text-emerald-600 font-semibold">{reportStatus}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportNotes.trim() || isReporting}
                onClick={handleSubmitReport}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {isReporting ? "Sending..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12">
        © 2026 InterviewAI • Verified Accurate Technical Interview Preparation.
      </footer>
    </div>
  );
}
