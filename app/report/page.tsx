"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Brain,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Award,
  Printer,
  ChevronRight,
  ChevronDown,
  Code2,
  Video,
  ArrowLeft,
  UserCheck,
  Building2,
  FileText,
  Bot,
  Layers,
  HelpCircle,
  Check,
  X,
  Compass,
  Calculator,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

interface QuestionEvidenceFeedback {
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
  isMachineTranscript?: boolean;
}

interface AptitudeQuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  difficulty: string;
  options: Record<string, string>;
  userAnswer: string | null;
  correctOption: string;
  isCorrect: boolean;
  isSkipped: boolean;
  explanation: string;
  formula?: string | null;
  shortcut?: string | null;
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
}

interface TechnicalQuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  difficulty: string;
  topic: string;
  options: Record<string, string>;
  userAnswer: string | null;
  correctOption: string;
  isCorrect: boolean;
  isSkipped: boolean;
  explanation: string;
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
}

interface ProjectQuestionItem {
  id: string;
  orderIndex: number;
  category: string;
  questionText: string;
  options?: Record<string, string>;
  userAnswer?: string | null;
  correctOption?: string;
  isCorrect?: boolean;
  isSkipped: boolean;
  explanation?: string;
  candidateResponse?: string;
  overallScore?: number | null;
  feedback?: string;
  strengths?: string[];
  missingDetails?: string[];
  hints?: string | null;
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
}

interface BehavioralQuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  candidateResponse: string;
  isSkipped: boolean;
  overallScore: number | null;
  starBreakdown: {
    situation: number;
    task: number;
    action: number;
    result: number;
    relevance: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  feedback: string;
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
  isMachineTranscript?: boolean;
}

interface HRQuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  candidateResponse: string;
  isSkipped: boolean;
  overallScore: number | null;
  criteria: {
    communicationClarity: number;
    professionalPresence: number;
    cultureFit: number;
    motivationSelfAwareness: number;
    conflictProblemSolving: number;
  };
  executiveSummary: string;
  strengths: string[];
  areasForGrowth: string[];
  hrDirectorTip: string;
  marksEarned?: number | null;
  maxMarks?: number;
  rubricCriteria?: string;
  evidenceExplanation?: string;
  whatAnsweredWell?: string;
  whatWasMissing?: string;
  practicalSuggestion?: string;
  unableToAssess?: boolean;
  unableToAssessReason?: string;
  isMachineTranscript?: boolean;
}

interface ReportData {
  sessionId?: string;
  hasSessions?: boolean;
  targetRole: string;
  companyName: string;
  completedAt: string;
  scores: {
    aptitude: number | null;
    technical: number | null;
    project: number | null;
    behavioral: number | null;
    hr: number | null;
    overall: number | null;
  };
  marksSummary?: {
    aptitude: { marksEarned: number | null; maxMarks: number; percentage: number | null };
    technical: { marksEarned: number | null; maxMarks: number; percentage: number | null };
    project: { marksEarned: number | null; maxMarks: number; percentage: number | null; correctCount: number; totalQuestions: number };
    behavioral: { marksEarned: number | null; maxMarks: number; percentage: number | null; assessedCount: number; unableToAssessCount: number };
    hr: { marksEarned: number | null; maxMarks: number; percentage: number | null; assessedCount: number; unableToAssessCount: number };
    overall: { marksEarned: number | null; maxMarks: number; percentage: number | null };
  };
  weightsExplanation?: string;
  missingItemsDisclosure?: string;
  formulaExplanation?: string;
  demonstratedEvidenceSummary?: string[];
  growthSuggestionsSummary?: string[];
  disclaimer?: string;
  practicalNextSteps?: Array<{
    title: string;
    description: string;
    actionUrl: string;
    actionText: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  aptitudeQuestions?: AptitudeQuestionItem[];
  aptitudeCategoryScores?: any;
  technicalQuestions?: TechnicalQuestionItem[];
  projectQuestions?: ProjectQuestionItem[];
  projectCompetencies?: {
    understanding: number;
    technical: number;
    problemSolving: number;
    implementation: number;
    contribution: number;
  } | null;
  behavioralQuestions?: BehavioralQuestionItem[];
  hrQuestions?: HRQuestionItem[];
  roundsDetail: {
    aptitude: {
      status: string;
      score: number | null;
      marksEarned?: number | null;
      maxMarks?: number;
      percentage?: number | null;
      questionsCount?: number;
      correctCount?: number;
    };
    technical: {
      status: string;
      score: number | null;
      marksEarned?: number | null;
      maxMarks?: number;
      percentage?: number | null;
      questionsCount?: number;
      correctCount?: number;
      skippedCount?: number;
    };
    project: {
      status: string;
      score: number | null;
      marksEarned?: number | null;
      maxMarks?: number;
      percentage?: number | null;
      questionsCount?: number;
      correctCount?: number;
    };
    behavioral: {
      status: string;
      score: number | null;
      marksEarned?: number | null;
      maxMarks?: number;
      percentage?: number | null;
      questionsCount?: number;
      assessedCount?: number;
      unableToAssessCount?: number;
    };
    hr: {
      status: string;
      score: number | null;
      marksEarned?: number | null;
      maxMarks?: number;
      percentage?: number | null;
      questionsCount?: number;
      assessedCount?: number;
      unableToAssessCount?: number;
    };
  };
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"aptitude" | "technical" | "project" | "behavioral" | "hr">("aptitude");
  const [expandedQuestions, setExpandedQuestions] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  React.useEffect(() => {
    const url = sessionId ? `/api/reports/${sessionId}` : `/api/reports/latest`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load report");
        setData(json.data);

        // Select the first round with questions by default
        if (json.data?.aptitudeQuestions?.length > 0) {
          setActiveTab("aptitude");
        } else if (json.data?.technicalQuestions?.length > 0) {
          setActiveTab("technical");
        } else if (json.data?.projectQuestions?.length > 0) {
          setActiveTab("project");
        } else if (json.data?.behavioralQuestions?.length > 0) {
          setActiveTab("behavioral");
        } else if (json.data?.hrQuestions?.length > 0) {
          setActiveTab("hr");
        }
      })
      .catch((err) => {
        setError(err.message || "Could not retrieve report.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Generating Comprehensive 5-Round Analytics Report...
        </p>
      </div>
    );
  }

  if (error || !data || (data.hasSessions === false && !data.scores?.overall)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-border/80 bg-card text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">No Completed Interviews Yet</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Complete at least one interview round (Aptitude, Technical, Project, Behavioral, or HR) to generate your comprehensive performance report.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button onClick={() => router.push("/dashboard")} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push("/aptitude/setup")} className="w-full text-xs">
              Start Round 1 Aptitude
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { scores } = data;

  const barChartData = [
    {
      name: "R1 Aptitude",
      score: scores.aptitude ?? 0,
      attempted: scores.aptitude !== null,
      fill: "#9333EA", // Purple
    },
    {
      name: "R2 Technical",
      score: scores.technical ?? 0,
      attempted: scores.technical !== null,
      fill: "#7C3AED", // Violet
    },
    {
      name: "R3 Project",
      score: scores.project ?? 0,
      attempted: scores.project !== null,
      fill: "#4F46E5", // Indigo
    },
    {
      name: "R4 Behavioral",
      score: scores.behavioral ?? 0,
      attempted: scores.behavioral !== null,
      fill: "#2563EB", // Blue
    },
    {
      name: "R5 HR Director",
      score: scores.hr ?? 0,
      attempted: scores.hr !== null,
      fill: "#0891B2", // Cyan
    },
  ];

  const radarData = [
    { subject: "Analytical Math", score: scores.aptitude ?? 70 },
    { subject: "Technical Core", score: scores.technical ?? 75 },
    { subject: "System Architecture", score: scores.project ?? 70 },
    { subject: "STAR Method", score: scores.behavioral ?? 75 },
    { subject: "Executive Presence", score: scores.hr ?? 80 },
  ];

  const getScoreColor = (val: number | null) => {
    if (val === null) return "text-muted-foreground";
    if (val >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (val >= 60) return "text-blue-600 dark:text-blue-400";
    return "text-amber-600 dark:text-amber-400";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col print:bg-white print:text-black">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Download PDF
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* 5-Round Completion Stepper */}
        <div className="print:hidden">
          <FiveRoundStepper currentRound={5} completedRounds={[1, 2, 3, 4, 5]} />
        </div>

        {/* Header Title Banner */}
        <section className="bg-gradient-to-br from-card via-card to-purple-500/5 border border-border/70 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Five-Round Assessment
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {data.targetRole}
                </Badge>
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                  {data.companyName}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Unified Five-Round Performance Report
              </h1>
              <p className="text-xs text-muted-foreground max-w-xl">
                Comprehensive candidate evaluation combining Quantitative Aptitude, Technical MCQs, Project Defense, Behavioral STAR, and HR Director Alignment.
              </p>
            </div>

            {/* Combined Overall Score Pill */}
            <div className="flex flex-col items-center justify-center w-44 h-44 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-purple-600/20 shrink-0 p-3 text-center">
              <span className="text-4xl md:text-5xl font-black">
                {scores.overall !== null ? `${scores.overall}%` : "N/A"}
              </span>
              <span className="text-[11px] font-semibold text-white/95 uppercase tracking-wider mt-0.5">
                Overall Score
              </span>
              {data.marksSummary?.overall.marksEarned !== null && data.marksSummary?.overall.marksEarned !== undefined && (
                <span className="text-[10px] font-mono font-medium text-white/80 bg-black/20 px-2 py-0.5 rounded-full mt-1.5">
                  {data.marksSummary.overall.marksEarned} / {data.marksSummary.overall.maxMarks} Total Marks
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 5 Summary Cards in Strict Order */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Card 1: Aptitude Round */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">R1 Aptitude</span>
              <Calculator className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className={`text-xl font-extrabold ${getScoreColor(scores.aptitude)}`}>
              {scores.aptitude !== null ? `${scores.aptitude}%` : "Not Attempted"}
            </div>
            <div className="text-[11px] font-semibold text-foreground/80">
              {data.marksSummary?.aptitude.marksEarned !== null && data.marksSummary?.aptitude.marksEarned !== undefined
                ? `${data.marksSummary.aptitude.marksEarned} / ${data.marksSummary.aptitude.maxMarks} Marks`
                : scores.aptitude !== null ? `${scores.aptitude} / 100 Marks` : "0 / 100 Marks"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {scores.aptitude !== null ? "Quant / Logic / Verbal" : "Round pending"}
            </p>
          </div>

          {/* Card 2: Technical Round */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">R2 Technical</span>
              <Code2 className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className={`text-xl font-extrabold ${getScoreColor(scores.technical)}`}>
              {scores.technical !== null ? `${scores.technical}%` : "Not Attempted"}
            </div>
            <div className="text-[11px] font-semibold text-foreground/80">
              {data.marksSummary?.technical.marksEarned !== null && data.marksSummary?.technical.marksEarned !== undefined
                ? `${data.marksSummary.technical.marksEarned} / ${data.marksSummary.technical.maxMarks} Marks`
                : scores.technical !== null ? `${scores.technical} / 100 Marks` : "0 / 50 Marks"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {scores.technical !== null ? "Role MCQs & Problem Solving" : "Round pending"}
            </p>
          </div>

          {/* Card 3: Project-Based Round */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">R3 Project</span>
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className={`text-xl font-extrabold ${getScoreColor(scores.project)}`}>
              {scores.project !== null ? `${scores.project}%` : "Not Attempted"}
            </div>
            <div className="text-[11px] font-semibold text-foreground/80">
              {data.marksSummary?.project
                ? `${data.marksSummary.project.marksEarned ?? 0} / ${data.marksSummary.project.maxMarks} Marks`
                : scores.project !== null ? `${scores.project} / 100 Marks` : "0 / 100 Marks"}
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              {data.marksSummary?.project
                ? `${data.marksSummary.project.correctCount} / ${data.marksSummary.project.totalQuestions} Correct`
                : scores.project !== null ? "Architecture Defense" : "Round pending"}
            </p>
          </div>

          {/* Card 4: Behavioral Round */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">R4 Behavioral</span>
              <Video className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className={`text-xl font-extrabold ${getScoreColor(scores.behavioral)}`}>
              {scores.behavioral !== null ? `${scores.behavioral}%` : "Not Attempted"}
            </div>
            <div className="text-[11px] font-semibold text-foreground/80">
              {data.marksSummary?.behavioral.marksEarned !== null && data.marksSummary?.behavioral.marksEarned !== undefined
                ? `${data.marksSummary.behavioral.marksEarned} / ${data.marksSummary.behavioral.maxMarks} Marks`
                : scores.behavioral !== null ? `${scores.behavioral} / 100 Marks` : "0 / 30 Marks"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.marksSummary?.behavioral?.assessedCount !== undefined
                ? `${data.marksSummary.behavioral.assessedCount} assessed${data.marksSummary.behavioral.unableToAssessCount ? ` • ${data.marksSummary.behavioral.unableToAssessCount} omitted` : ""}`
                : "STAR Criteria"}
            </p>
          </div>

          {/* Card 5: HR Round */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1.5 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">R5 HR Director</span>
              <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className={`text-xl font-extrabold ${getScoreColor(scores.hr)}`}>
              {scores.hr !== null ? `${scores.hr}%` : "Not Attempted"}
            </div>
            <div className="text-[11px] font-semibold text-foreground/80">
              {data.marksSummary?.hr.marksEarned !== null && data.marksSummary?.hr.marksEarned !== undefined
                ? `${data.marksSummary.hr.marksEarned} / ${data.marksSummary.hr.maxMarks} Marks`
                : scores.hr !== null ? `${scores.hr} / 100 Marks` : "0 / 60 Marks"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.marksSummary?.hr?.assessedCount !== undefined
                ? `${data.marksSummary.hr.assessedCount} assessed${data.marksSummary.hr.unableToAssessCount ? ` • ${data.marksSummary.hr.unableToAssessCount} omitted` : ""}`
                : "5-criteria Culture Fit"}
            </p>
          </div>
        </section>

        {/* Weights, Formula Transparency & Missing Items Disclosures */}
        <section className="space-y-3">
          {data.weightsExplanation && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Round Weights & Arithmetic Mean Methodology
                </h4>
                <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                  {data.weightsExplanation}
                </p>
                {data.formulaExplanation && (
                  <p className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold pt-0.5">
                    {data.formulaExplanation}
                  </p>
                )}
              </div>
            </div>
          )}

          {data.missingItemsDisclosure && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Ethical Evaluation & Omitted Items Disclosure
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {data.missingItemsDisclosure}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Visual Charts: Recharts Bar Chart & Radar Dimensions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Round Comparison Bar Chart */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold">Five-Round Percentage Comparison</h3>
              <p className="text-xs text-muted-foreground">Side-by-side performance across all five sequential interview rounds.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val}%`, "Score"]}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Competency Radar Chart */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold">Candidate Competency Matrix</h3>
              <p className="text-xs text-muted-foreground">Radar evaluation across five core interview dimensions.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#888888" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" fontSize={9} />
                  <Radar name="Candidate" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val}%`, "Rating"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Demonstrated Evidence Summary & Growth Suggestions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demonstrated Evidence Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Demonstrated Evidence & Competence
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Verified substantive performance derived strictly from candidate answers across rounds.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-foreground/90 leading-relaxed">
              {(data.demonstratedEvidenceSummary && data.demonstratedEvidenceSummary.length > 0
                ? data.demonstratedEvidenceSummary
                : data.strengths
              ).map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth & Practical Action Plan Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Growth Areas & Practical Improvements
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Actionable study goals, quantifiable STAR suggestions, and knowledge gaps to address.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-foreground/90 leading-relaxed">
              {(data.growthSuggestionsSummary && data.growthSuggestionsSummary.length > 0
                ? data.growthSuggestionsSummary
                : data.weaknesses
              ).map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Question-by-Question Detailed Review Audit Section */}
        <section className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-lg font-bold">Round-by-Round Question & Response Audit</h2>
              <p className="text-xs text-muted-foreground">
                In-depth review of every question, candidate response, grading breakdown, formulas, and rubrics.
              </p>
            </div>

            {/* 5-Tab Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("aptitude")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "aptitude"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                R1 Aptitude ({data.aptitudeQuestions?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("technical")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "technical"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                R2 Technical ({data.technicalQuestions?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("project")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "project"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                R3 Project ({data.projectQuestions?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("behavioral")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "behavioral"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                R4 Behavioral ({data.behavioralQuestions?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("hr")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "hr"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                R5 HR ({data.hrQuestions?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab 1: Aptitude Questions */}
          {activeTab === "aptitude" && (
            <div className="space-y-4">
              {!data.aptitudeQuestions || data.aptitudeQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                  <Calculator className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p>No aptitude assessment records found in this interview session.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/aptitude/setup")}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  >
                    Take Aptitude Round
                  </Button>
                </div>
              ) : (
                data.aptitudeQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[q.id] !== false;
                  return (
                    <div
                      key={q.id}
                      className="border border-border/70 rounded-2xl p-5 bg-card/60 space-y-4"
                    >
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              Question {idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-muted capitalize">
                              {q.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-muted/60 capitalize">
                              {q.difficulty}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                q.isSkipped
                                  ? "border-slate-500/40 text-slate-400 bg-slate-500/10"
                                  : q.isCorrect
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : "border-destructive/40 text-destructive bg-destructive/10"
                              }`}
                            >
                              {q.isSkipped
                                ? "Skipped (Omitted)"
                                : q.marksEarned !== undefined && q.marksEarned !== null
                                ? `${q.marksEarned} / ${q.maxMarks || 10} Marks`
                                : q.isCorrect
                                ? "10 / 10 Marks"
                                : "0 / 10 Marks"}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t border-border/40 text-xs">
                          {/* Visible Rubric Criteria */}
                          <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                            <strong>Rubric:</strong> {q.rubricCriteria || "Accurate quantitative derivation, formula execution, and correct option choice (10 marks max)"}
                          </div>

                          {/* 4 Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(["A", "B", "C", "D"] as const).map((key) => {
                              const text = q.options[key];
                              if (!text) return null;
                              const isCandidateChoice = q.userAnswer === key;
                              const isCorrectAnswer = q.correctOption === key;

                              let optBorder = "border-border/60 bg-muted/20 text-muted-foreground";
                              if (isCorrectAnswer) {
                                optBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/40";
                              } else if (isCandidateChoice && !isCorrectAnswer) {
                                optBorder = "border-destructive bg-destructive/10 text-destructive font-semibold";
                              }

                              return (
                                <div
                                  key={key}
                                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${optBorder}`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {key}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{text}</span>
                                  {isCorrectAnswer && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  )}
                                  {isCandidateChoice && !isCorrectAnswer && (
                                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                            <span>
                              Candidate Choice:{" "}
                              <strong className="text-foreground">
                                {q.userAnswer ? `Option ${q.userAnswer}` : "Skipped / Unanswered"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Correct Answer:{" "}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                Option {q.correctOption}
                              </strong>
                            </span>
                          </div>

                          {/* Formula Box */}
                          {q.formula && (
                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-foreground/90 space-y-1">
                              <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px]">
                                📐 Mathematical Formula & Concept:
                              </span>
                              <p className="font-mono text-xs leading-relaxed">{q.formula}</p>
                            </div>
                          )}

                          {/* Speed Shortcut Box */}
                          {q.shortcut && (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-foreground/90 space-y-1">
                              <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                                ⚡ Speed Shortcut & Exam Trick:
                              </span>
                              <p className="leading-relaxed">{q.shortcut}</p>
                            </div>
                          )}

                          {/* Step-by-Step Explanation */}
                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-foreground/90 space-y-1">
                              <span className="font-bold text-muted-foreground block text-[11px]">
                                💡 Step-by-Step Verification:
                              </span>
                              <p className="leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                            </div>
                          )}

                          {/* 3 Structured Evidence Blocks */}
                          {(q.whatAnsweredWell || q.whatWasMissing || q.practicalSuggestion) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  What was Answered Well
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatAnsweredWell || (q.isCorrect ? "Selected correct option and applied valid logic." : "Attempted core quantitative reasoning.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  What was Missing / Discrepant
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatWasMissing || (q.isCorrect ? "None. Calculation verified." : "Calculation discrepancy. Review the verified formula.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px] flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  Practical Suggestion
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.practicalSuggestion || "Practice high-speed calculation shortcuts for this question pattern."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Technical Questions */}
          {activeTab === "technical" && (
            <div className="space-y-4">
              {!data.technicalQuestions || data.technicalQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                  <Code2 className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p>No technical questions recorded in this interview session.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/technical/setup")}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                  >
                    Take Technical Round
                  </Button>
                </div>
              ) : (
                data.technicalQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[q.id] !== false;
                  return (
                    <div
                      key={q.id}
                      className="border border-border/70 rounded-2xl p-5 bg-card/60 space-y-4"
                    >
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              Question {idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-muted">
                              {q.topic}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                q.isSkipped
                                  ? "border-slate-500/40 text-slate-400 bg-slate-500/10"
                                  : q.isCorrect
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : "border-destructive/40 text-destructive bg-destructive/10"
                              }`}
                            >
                              {q.isSkipped
                                ? "Skipped (Omitted)"
                                : q.marksEarned !== undefined && q.marksEarned !== null
                                ? `${q.marksEarned} / ${q.maxMarks || 10} Marks`
                                : q.isCorrect
                                ? "10 / 10 Marks"
                                : "0 / 10 Marks"}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t border-border/40 text-xs">
                          {/* Visible Rubric Criteria */}
                          <div className="text-[11px] font-mono text-violet-700 dark:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20">
                            <strong>Rubric:</strong> {q.rubricCriteria || "Core technical correctness, runtime/memory complexity, and problem-solving logic (10 marks max)"}
                          </div>

                          {/* 4 Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(["A", "B", "C", "D"] as const).map((key) => {
                              const text = q.options[key];
                              if (!text) return null;
                              const isCandidateChoice = q.userAnswer === key;
                              const isCorrectAnswer = q.correctOption === key;

                              let optBorder = "border-border/60 bg-muted/20 text-muted-foreground";
                              if (isCorrectAnswer) {
                                optBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/40";
                              } else if (isCandidateChoice && !isCorrectAnswer) {
                                optBorder = "border-destructive bg-destructive/10 text-destructive font-semibold";
                              }

                              return (
                                <div
                                  key={key}
                                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${optBorder}`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {key}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{text}</span>
                                  {isCorrectAnswer && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  )}
                                  {isCandidateChoice && !isCorrectAnswer && (
                                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                            <span>
                              Candidate Choice:{" "}
                              <strong className="text-foreground">
                                {q.userAnswer ? `Option ${q.userAnswer}` : "Skipped / Unanswered"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Correct Answer:{" "}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                Option {q.correctOption}
                              </strong>
                            </span>
                          </div>

                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-foreground/90 space-y-1">
                              <span className="font-bold text-purple-600 dark:text-purple-400 block">
                                💡 Explanation & Core Concept:
                              </span>
                              <p className="leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                            </div>
                          )}

                          {/* 3 Structured Evidence Blocks */}
                          {(q.whatAnsweredWell || q.whatWasMissing || q.practicalSuggestion) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  What was Answered Well
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatAnsweredWell || (q.isCorrect ? "Correctly identified algorithm behavior and edge conditions." : "Attempted core algorithmic concept.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  What was Missing / Discrepant
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatWasMissing || (q.isCorrect ? "None. Complexity derivation verified." : "Complexity or edge condition gap. Review the concept explanation.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px] flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  Practical Suggestion
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.practicalSuggestion || "Practice writing out recurrence relations and pointer manipulations step-by-step."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Project-Based Questions */}
          {activeTab === "project" && (
            <div className="space-y-4">
              {!data.projectQuestions || data.projectQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                  <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p>No project-based interview records found in this interview session.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/project/setup")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    Take Project Interview
                  </Button>
                </div>
              ) : (
                data.projectQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[q.id] !== false;
                  return (
                    <div
                      key={q.id}
                      className="border border-border/70 rounded-2xl p-5 bg-card/60 space-y-4"
                    >
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              Question {idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-muted">
                              {q.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                q.isSkipped
                                  ? "border-slate-500/40 text-slate-400 bg-slate-500/10"
                                  : q.options
                                  ? q.isCorrect
                                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                    : "border-destructive/40 text-destructive bg-destructive/10"
                                  : "border-indigo-500/40 text-indigo-600 bg-indigo-500/10"
                              }`}
                            >
                              {q.isSkipped
                                ? "Skipped (Omitted)"
                                : q.marksEarned !== undefined && q.marksEarned !== null
                                ? `${q.marksEarned} / ${q.maxMarks || 20} Marks`
                                : q.isCorrect
                                ? "20 / 20 Marks"
                                : "0 / 20 Marks"}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 pt-3 border-t border-border/40 text-xs">
                          {/* Visible Rubric Criteria */}
                          <div className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                            <strong>Rubric:</strong> {q.rubricCriteria || "System architecture defense, component trade-offs, and fault-tolerance (20 marks max)"}
                          </div>
                          {q.options && Object.keys(q.options).length > 0 ? (
                            <>
                              {/* 4 Options Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(["A", "B", "C", "D"] as const).map((key) => {
                                  const text = q.options ? q.options[key] : "";
                                  if (!text) return null;
                                  const isCandidateChoice = q.userAnswer === key;
                                  const isCorrectAnswer = q.correctOption === key;

                                  let optBorder = "border-border/60 bg-muted/20 text-muted-foreground";
                                  if (isCorrectAnswer) {
                                    optBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/40";
                                  } else if (isCandidateChoice && !isCorrectAnswer) {
                                    optBorder = "border-destructive bg-destructive/10 text-destructive font-semibold";
                                  }

                                  return (
                                    <div
                                      key={key}
                                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${optBorder}`}
                                    >
                                      <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                        {key}
                                      </span>
                                      <span className="flex-1 leading-relaxed">{text}</span>
                                      {isCorrectAnswer && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      )}
                                      {isCandidateChoice && !isCorrectAnswer && (
                                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                                <span>
                                  Candidate Choice:{" "}
                                  <strong className="text-foreground">
                                    {q.userAnswer ? `Option ${q.userAnswer}` : "Skipped / Unanswered"}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Correct Answer:{" "}
                                  <strong className="text-emerald-600 dark:text-emerald-400">
                                    Option {q.correctOption}
                                  </strong>
                                </span>
                              </div>

                              {q.explanation && (
                                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-foreground/90 space-y-1">
                                  <span className="font-bold text-purple-600 dark:text-purple-400 block">
                                    💡 Architectural Rationale & Trade-offs:
                                  </span>
                                  <p className="leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                                </div>
                              )}

                              {/* 3 Structured Evidence Blocks */}
                              {(q.whatAnsweredWell || q.whatWasMissing || q.practicalSuggestion) && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      What was Answered Well
                                    </span>
                                    <p className="text-[11px] text-foreground/90 leading-relaxed">
                                      {q.whatAnsweredWell || (q.isCorrect ? "Correct architectural component selection." : "Evaluated system design requirement.")}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                    <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      What was Missing / Discrepant
                                    </span>
                                    <p className="text-[11px] text-foreground/90 leading-relaxed">
                                      {q.whatWasMissing || (q.isCorrect ? "None. Trade-off justification sound." : "Trade-off disparity. Review system resilience patterns.")}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                    <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px] flex items-center gap-1">
                                      <Lightbulb className="w-3.5 h-3.5" />
                                      Practical Suggestion
                                    </span>
                                    <p className="text-[11px] text-foreground/90 leading-relaxed">
                                      {q.practicalSuggestion || "Compare read-heavy vs write-heavy patterns when designing data stores."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Legacy candidate transcript fallback */}
                              <div className="space-y-1.5">
                                <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">
                                  Candidate Architectural Defense:
                                </span>
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-foreground italic leading-relaxed whitespace-pre-wrap">
                                  &quot;{q.candidateResponse}&quot;
                                </div>
                              </div>
                              {q.feedback && (
                                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                                    Architectural Evaluation:
                                  </span>
                                  <p className="leading-relaxed text-foreground/90">{q.feedback}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 4: Behavioral STAR Questions */}
          {activeTab === "behavioral" && (
            <div className="space-y-4">
              {!data.behavioralQuestions || data.behavioralQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                  <Video className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p>No behavioral round records found in this interview session.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/behavioral/setup?fromSession=${data.sessionId || ""}`)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                  >
                    Take Behavioral Round
                  </Button>
                </div>
              ) : (
                data.behavioralQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[q.id] !== false;
                  return (
                    <div
                      key={q.id}
                      className="border border-border/70 rounded-2xl p-5 bg-card/60 space-y-4"
                    >
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              Question {idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-muted">
                              {q.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                q.unableToAssess || q.isSkipped
                                  ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                                  : "border-blue-500/40 text-blue-600 bg-blue-500/10"
                              }`}
                            >
                              {q.unableToAssess || q.isSkipped
                                ? "Unable to Assess (Excluded)"
                                : q.marksEarned !== undefined && q.marksEarned !== null
                                ? `${q.marksEarned} / ${q.maxMarks || 10} Marks (${q.overallScore}%)`
                                : `STAR Score: ${q.overallScore}%`}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 pt-3 border-t border-border/40 text-xs">
                          {/* Visible Rubric Criteria */}
                          <div className="text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                            <strong>Rubric:</strong> {q.rubricCriteria || "STAR Methodology: Situation (2.5), Task (2.5), Action (2.5), Result (2.5) — 10 max marks"}
                          </div>

                          {/* Candidate Answer Transcript */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">
                                Candidate Response Transcript:
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 font-medium">
                                <Bot className="w-3 h-3 text-purple-400" />
                                Machine-Generated Transcript (Candidate Reviewed)
                              </Badge>
                            </div>
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-foreground italic leading-relaxed whitespace-pre-wrap">
                              &quot;{q.candidateResponse}&quot;
                            </div>
                          </div>

                          {/* 5-Axis STAR Breakdown */}
                          {!q.isSkipped && !q.unableToAssess && (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { label: "Situation", val: q.starBreakdown.situation },
                                { label: "Task", val: q.starBreakdown.task },
                                { label: "Action", val: q.starBreakdown.action },
                                { label: "Result", val: q.starBreakdown.result },
                                { label: "Relevance", val: q.starBreakdown.relevance },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="p-2.5 rounded-xl border border-border/60 bg-card text-center"
                                >
                                  <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                                  <span className="text-sm font-extrabold text-foreground">{item.val}%</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 3 Structured Evidence Blocks */}
                          {(q.whatAnsweredWell || q.whatWasMissing || q.practicalSuggestion) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  What was Answered Well
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatAnsweredWell || (q.strengths?.[0] || "Structured narrative addressing personal engineering decisions.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  What was Missing / Discrepant
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatWasMissing || (q.areasForImprovement?.[0] || "Consider providing more specific quantifiable results (e.g. latency, error reduction).")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px] flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  Practical Suggestion
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.practicalSuggestion || "Conclude your answer with a concrete metric (e.g. latency decrease or uptime percentage)."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Strengths & Growth Areas */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
                                Strengths Identified:
                              </span>
                              <ul className="list-disc list-inside text-foreground/90 space-y-0.5">
                                {q.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                              <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                                Recommended STAR Polish:
                              </span>
                              <ul className="list-disc list-inside text-foreground/90 space-y-0.5">
                                {q.areasForImprovement.map((im, i) => (
                                  <li key={i}>{im}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 5: HR Director Questions */}
          {activeTab === "hr" && (
            <div className="space-y-4">
              {!data.hrQuestions || data.hrQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                  <UserCheck className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p>No HR interview records found in this interview session.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/hr/setup?fromSession=${data.sessionId || ""}`)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                  >
                    Take HR Round
                  </Button>
                </div>
              ) : (
                data.hrQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[q.id] !== false;
                  return (
                    <div
                      key={q.id}
                      className="border border-border/70 rounded-2xl p-5 bg-card/60 space-y-4"
                    >
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              Question {idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-muted">
                              {q.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                q.unableToAssess || q.isSkipped
                                  ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                                  : "border-cyan-500/40 text-cyan-600 bg-cyan-500/10"
                              }`}
                            >
                              {q.unableToAssess || q.isSkipped
                                ? "Unable to Assess (Excluded)"
                                : q.marksEarned !== undefined && q.marksEarned !== null
                                ? `${q.marksEarned} / ${q.maxMarks || 10} Marks (${q.overallScore}%)`
                                : `HR Score: ${q.overallScore}%`}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 pt-3 border-t border-border/40 text-xs">
                          {/* Visible Rubric Criteria */}
                          <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                            <strong>Rubric:</strong> {q.rubricCriteria || "HR Competency: Relevance (3.0), Clarity (2.0), Motivation (3.0), Collaboration (2.0) — 10 max marks"}
                          </div>

                          {/* Candidate Response Transcript */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">
                                Candidate Response Transcript:
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 font-medium">
                                <Bot className="w-3 h-3 text-purple-400" />
                                Machine-Generated Transcript (Candidate Reviewed)
                              </Badge>
                            </div>
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-foreground italic leading-relaxed whitespace-pre-wrap">
                              &quot;{q.candidateResponse}&quot;
                            </div>
                          </div>

                          {/* 5-Criteria Rubric Breakdown */}
                          {!q.isSkipped && !q.unableToAssess && (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { label: "Clarity", val: q.criteria.communicationClarity },
                                { label: "Presence", val: q.criteria.professionalPresence },
                                { label: "Culture Fit", val: q.criteria.cultureFit },
                                { label: "Self-Awareness", val: q.criteria.motivationSelfAwareness },
                                { label: "Problem Solving", val: q.criteria.conflictProblemSolving },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="p-2.5 rounded-xl border border-border/60 bg-card text-center"
                                >
                                  <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                                  <span className="text-sm font-extrabold text-foreground">{item.val}%</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 3 Structured Evidence Blocks */}
                          {(q.whatAnsweredWell || q.whatWasMissing || q.practicalSuggestion) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  What was Answered Well
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatAnsweredWell || (q.strengths?.[0] || "Articulated genuine career interests and collaborative attitude.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  What was Missing / Discrepant
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.whatWasMissing || (q.areasForGrowth?.[0] || "Deepen alignment with specific enterprise products or mission.")}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px] flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  Practical Suggestion
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  {q.practicalSuggestion || (q.hrDirectorTip || "Tie past team successes to real-world impact and business metrics.")}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Strengths & Growth Areas */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
                                HR Director Praises:
                              </span>
                              <ul className="list-disc list-inside text-foreground/90 space-y-0.5">
                                {q.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                              <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                                Leadership Development Advice:
                              </span>
                              <ul className="list-disc list-inside text-foreground/90 space-y-0.5">
                                {q.areasForGrowth.map((im, i) => (
                                  <li key={i}>{im}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Executive Tip */}
                          {q.hrDirectorTip && (
                            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-foreground/90 space-y-1">
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 block text-[11px]">
                                💼 HR Director Sarah Jenkins&apos; Tip:
                              </span>
                              <p className="leading-relaxed">{q.hrDirectorTip}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Prominent AI Advisory Feedback Disclaimer Banner */}
        <section className="bg-muted/40 border border-border/70 rounded-3xl p-5 shadow-sm flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
              <span>AI Evaluation & Educational Benchmarking Notice</span>
              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                Ethical Fairness Standard
              </Badge>
            </h4>
            <p>
              {data.disclaimer || "All scores, marks, and feedback are algorithmically generated educational evaluations intended for practice and benchmarking. They evaluate content and evidence only—never penalizing accent, minor grammar, appearance, or recording quality. They do not constitute an objective or guaranteed hiring decision."}
            </p>
          </div>
        </section>

        {/* Practical Next Steps */}
        {data.practicalNextSteps && data.practicalNextSteps.length > 0 && (
          <section className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-600" />
                Targeted Placement Growth Roadmap
              </h3>
              <p className="text-xs text-muted-foreground">
                Actionable recommendations based on your five-round evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.practicalNextSteps.slice(0, 3).map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-border/70 bg-card/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <Link href={step.actionUrl}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold h-8 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
                    >
                      {step.actionText}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground print:hidden">
        <p>InterviewAI – Practice Smarter. Interview Better. Verified Five-Round Performance Report.</p>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading Report...</p>
        </div>
      }
    >
      <ReportContent />
    </React.Suspense>
  );
}
