"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BookOpen,
  FileText,
  AlertCircle,
  RotateCcw,
  Bot,
  Flame,
  Target,
  History as HistoryIcon,
  HelpCircle,
  ChevronRight,
  Video,
  Mic,
  Code2,
  Users2,
  Calculator,
  Layers,
  PlayCircle,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RoundStatusItem {
  roundNumber: number;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  id: string | null;
  completedAt: string | null;
}

interface DashboardData {
  fiveRounds?: {
    aptitude: RoundStatusItem;
    technical: RoundStatusItem;
    project: RoundStatusItem;
    behavioral: RoundStatusItem;
    hr: RoundStatusItem;
  };
  perfReport?: {
    overallPercentage: number | null;
    completedRoundsCount: number;
  } | null;
  stats: {
    totalInterviews: number;
    averageScore: number | null;
    questionsPracticed: number;
    strongestSkill: string | null;
    aptitudeRoundScore?: number | null;
    technicalRoundScore?: number | null;
    projectRoundScore?: number | null;
    behavioralRoundScore?: number | null;
    hrRoundScore?: number | null;
    fiveRoundAverage?: number | null;
    completedRoundsCount?: number;
    overallImprovement?: string | null;
  };
  recentAssessments: Array<{
    id: string;
    jobRole: string;
    score: number;
    percentage: number;
    completedAt: string;
  }>;
  topicProgress: Array<{
    topic: string;
    attempted: number;
    correct: number;
    percentage: number;
  }>;
}

export default function DashboardOverviewPage() {
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ])
      .then(([sessionData, dashData]) => {
        if (sessionData.user) setUser(sessionData.user);
        if (dashData.success && dashData.data) {
          setDashboard(dashData.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {
    totalInterviews: 0,
    averageScore: null,
    questionsPracticed: 0,
    strongestSkill: null,
  };

  const recentAssessments = dashboard?.recentAssessments || [];
  const topicProgress = dashboard?.topicProgress || [];
  const candidateName = user?.name || "Candidate";

  // Score history for trend chart
  const trendData = [...recentAssessments].reverse().map((a, idx) => ({
    session: `Test ${idx + 1}`,
    score: a.percentage,
    role: a.jobRole,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* SECTION 8: DASHBOARD HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-gradient-to-r from-purple-700/15 via-card to-card backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Mock Interview Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to InterviewAI!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            Your personalized AI interview preparation journey starts here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/interview/select"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-violet-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-purple-600/25 flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Interview Hub</span>
          </Link>
          <Link
            href="/chatbot"
            className="px-5 py-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-2 transition"
          >
            <Bot className="w-4 h-4 text-purple-500" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* 5-ROUND SEQUENTIAL MODE BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Placement Simulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Complete Mock Interview (5-Round Sequential Mode)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Step through the full corporate recruitment pipeline in strict sequence:
              <strong className="text-foreground"> Round 1 Aptitude</strong> →
              <strong className="text-foreground"> Round 2 Technical</strong> →
              <strong className="text-foreground"> Round 3 Project-Based</strong> →
              <strong className="text-foreground"> Round 4 Behavioral</strong> →
              <strong className="text-foreground"> Round 5 HR Director</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/aptitude/setup?sequential=true">
              <Button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-purple-600/25 flex items-center gap-2 transition">
                <PlayCircle className="w-4 h-4" />
                <span>Start Sequential Interview</span>
              </Button>
            </Link>
            <Link href="/report">
              <Button variant="outline" className="px-5 py-3 rounded-2xl border-border/80 text-xs font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span>Unified 5-Round Report</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 5-Round Sequential Stepper Progress Bar */}
        <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { num: "1", title: "Aptitude", icon: Calculator, status: dashboard?.fiveRounds?.aptitude.status, score: dashboard?.fiveRounds?.aptitude.score },
            { num: "2", title: "Technical", icon: Code2, status: dashboard?.fiveRounds?.technical.status, score: dashboard?.fiveRounds?.technical.score },
            { num: "3", title: "Project", icon: Layers, status: dashboard?.fiveRounds?.project.status, score: dashboard?.fiveRounds?.project.score },
            { num: "4", title: "Behavioral", icon: Video, status: dashboard?.fiveRounds?.behavioral.status, score: dashboard?.fiveRounds?.behavioral.score },
            { num: "5", title: "HR Director", icon: Users2, status: dashboard?.fiveRounds?.hr.status, score: dashboard?.fiveRounds?.hr.score },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isCompleted = item.status === "COMPLETED";
            const isInProgress = item.status === "IN_PROGRESS";
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : isInProgress
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-card/40 border-border/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isInProgress
                      ? "bg-amber-500 text-black font-extrabold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.num}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate text-foreground flex items-center gap-1">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[10px]">
                    {isCompleted ? `${item.score}%` : isInProgress ? "In Progress" : "Not Started"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 PROMINENT INTERVIEW ROUND CARDS IN EXACT SEQUENTIAL ORDER */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Interview Rounds
          </h3>
          <span className="text-xs text-muted-foreground">
            Take rounds individually or sequentially
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Aptitude Round */}
          {(() => {
            const r1 = dashboard?.fiveRounds?.aptitude;
            const isCompleted = r1?.status === "COMPLETED";
            const isInProgress = r1?.status === "IN_PROGRESS";
            return (
              <Card className="border-border/60 hover:border-purple-500 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className={`text-[10px] ${isCompleted ? "bg-emerald-600 text-white" : isInProgress ? "bg-amber-500/20 text-amber-500" : ""}`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-purple-500 tracking-wider uppercase">
                    Round 1
                  </div>
                  <CardTitle className="text-base font-bold">Aptitude Round</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    Quantitative, Logical Reasoning, and Verbal Ability MCQs with instant verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Score</span>
                    <span className="font-mono font-bold text-foreground">
                      {isCompleted ? `${r1.score}%` : "Not Attempted"}
                    </span>
                  </div>
                  <Link href={isCompleted ? `/aptitude/results?id=${r1.id}` : isInProgress ? `/aptitude/questions?id=${r1.id}` : `/aptitude/setup`}>
                    <Button className="w-full text-xs font-bold h-9 bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
                      {isCompleted ? "Review Results" : isInProgress ? "Continue Round" : "Start Round"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* Card 2: Technical Round */}
          {(() => {
            const r2 = dashboard?.fiveRounds?.technical;
            const isCompleted = r2?.status === "COMPLETED";
            const isInProgress = r2?.status === "IN_PROGRESS";
            return (
              <Card className="border-border/60 hover:border-violet-500 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className={`text-[10px] ${isCompleted ? "bg-emerald-600 text-white" : isInProgress ? "bg-amber-500/20 text-amber-500" : ""}`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-violet-500 tracking-wider uppercase">
                    Round 2
                  </div>
                  <CardTitle className="text-base font-bold">Technical Round</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    Role-based technical MCQs, algorithmic problem solving, code analysis, and architecture.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Score</span>
                    <span className="font-mono font-bold text-foreground">
                      {isCompleted ? `${r2.score}%` : "Not Attempted"}
                    </span>
                  </div>
                  <Link href={isCompleted ? `/technical/results/${r2.id}` : `/technical/setup`}>
                    <Button className="w-full text-xs font-bold h-9 bg-violet-600 hover:bg-violet-500 text-white rounded-xl">
                      {isCompleted ? "Review Results" : isInProgress ? "Continue Round" : "Start Round"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* Card 3: Project-Based Interview */}
          {(() => {
            const r3 = dashboard?.fiveRounds?.project;
            const isCompleted = r3?.status === "COMPLETED";
            const isInProgress = r3?.status === "IN_PROGRESS";
            return (
              <Card className="border-border/60 hover:border-indigo-500 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className={`text-[10px] ${isCompleted ? "bg-emerald-600 text-white" : isInProgress ? "bg-amber-500/20 text-amber-500" : ""}`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase">
                    Round 3
                  </div>
                  <CardTitle className="text-base font-bold">Project Interview</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    AI questions based on candidate projects, architecture, and tech stack with David Chen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Score</span>
                    <span className="font-mono font-bold text-foreground">
                      {isCompleted ? `${r3.score}%` : "Not Attempted"}
                    </span>
                  </div>
                  <Link href={isCompleted ? `/project/results?sessionId=${r3.id}` : isInProgress ? `/project/interview?sessionId=${r3.id}` : `/project/setup`}>
                    <Button className="w-full text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                      {isCompleted ? "Review Results" : isInProgress ? "Continue Round" : "Start Round"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* Card 4: Behavioral Round */}
          {(() => {
            const r4 = dashboard?.fiveRounds?.behavioral;
            const isCompleted = r4?.status === "COMPLETED";
            const isInProgress = r4?.status === "IN_PROGRESS";
            return (
              <Card className="border-border/60 hover:border-blue-500 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className={`text-[10px] ${isCompleted ? "bg-emerald-600 text-white" : isInProgress ? "bg-amber-500/20 text-amber-500" : ""}`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-blue-500 tracking-wider uppercase">
                    Round 4
                  </div>
                  <CardTitle className="text-base font-bold">Behavioral Round</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    Online video meeting with Dr. Marcus Vance in Google Meet UI with STAR evaluation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Score</span>
                    <span className="font-mono font-bold text-foreground">
                      {isCompleted ? `${r4.score}%` : "Not Attempted"}
                    </span>
                  </div>
                  <Link href={isCompleted ? `/report?sessionId=${r4.id}` : `/behavioral/setup`}>
                    <Button className="w-full text-xs font-bold h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                      {isCompleted ? "Review Results" : isInProgress ? "Continue Round" : "Start Round"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* Card 5: HR Round */}
          {(() => {
            const r5 = dashboard?.fiveRounds?.hr;
            const isCompleted = r5?.status === "COMPLETED";
            const isInProgress = r5?.status === "IN_PROGRESS";
            return (
              <Card className="border-border/60 hover:border-cyan-500 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className={`text-[10px] ${isCompleted ? "bg-emerald-600 text-white" : isInProgress ? "bg-amber-500/20 text-amber-500" : ""}`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-cyan-500 tracking-wider uppercase">
                    Round 5
                  </div>
                  <CardTitle className="text-base font-bold">HR Round</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    HR interview with Sarah Jenkins evaluating culture, leadership, and salary expectations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Score</span>
                    <span className="font-mono font-bold text-foreground">
                      {isCompleted ? `${r5.score}%` : "Not Attempted"}
                    </span>
                  </div>
                  <Link href={isCompleted ? `/report?sessionId=${r5.id}` : `/hr/setup`}>
                    <Button className="w-full text-xs font-bold h-9 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl">
                      {isCompleted ? "Review Results" : isInProgress ? "Continue Round" : "Start Round"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* 6 DASHBOARD STATISTICS */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Five-Round Performance Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Stat 1: Overall Average */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Overall Score</span>
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {stats.fiveRoundAverage !== null && stats.fiveRoundAverage !== undefined
                  ? `${stats.fiveRoundAverage}%`
                  : stats.averageScore !== null
                  ? `${stats.averageScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {stats.completedRoundsCount ? `${stats.completedRoundsCount} of 5 rounds completed` : "Across completed tests"}
              </p>
            </CardContent>
          </Card>

          {/* Stat 2: Round 1 Aptitude */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>R1 Aptitude</span>
                <Calculator className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {stats.aptitudeRoundScore !== null && stats.aptitudeRoundScore !== undefined
                  ? `${stats.aptitudeRoundScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">Quant / Logic / Verbal</p>
            </CardContent>
          </Card>

          {/* Stat 3: Round 2 Technical */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>R2 Technical</span>
                <Code2 className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <div className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
                {stats.technicalRoundScore !== null && stats.technicalRoundScore !== undefined
                  ? `${stats.technicalRoundScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">Role MCQs & Coding</p>
            </CardContent>
          </Card>

          {/* Stat 4: Round 3 Project */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>R3 Project</span>
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {stats.projectRoundScore !== null && stats.projectRoundScore !== undefined
                  ? `${stats.projectRoundScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">Architecture Defense</p>
            </CardContent>
          </Card>

          {/* Stat 5: Round 4 Behavioral */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>R4 Behavioral</span>
                <Video className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {stats.behavioralRoundScore !== null && stats.behavioralRoundScore !== undefined
                  ? `${stats.behavioralRoundScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">STAR Video Meeting</p>
            </CardContent>
          </Card>

          {/* Stat 6: Round 5 HR */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>R5 HR Director</span>
                <Users2 className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {stats.hrRoundScore !== null && stats.hrRoundScore !== undefined
                  ? `${stats.hrRoundScore}%`
                  : "Not Attempted"}
              </div>
              <p className="text-[10px] text-muted-foreground">Culture & Leadership</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PERFORMANCE OVERVIEW & TOPIC-WISE PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Overview Chart */}
        <Card className="lg:col-span-7 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Performance Overview</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Progression across completed technical assessments
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                Real Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {trendData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="session" stroke="#94A3B8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                      name="Score %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Target className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Complete your first assessment to visualize your score trajectory.
                </p>
                <Link
                  href="/interview/setup"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
                >
                  Start Assessment
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic-Wise Progress */}
        <Card className="lg:col-span-5 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Topic-Wise Progress</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Accuracy breakdown by engineering subject
                </CardDescription>
              </div>
              <Badge variant="cyan" className="font-mono text-[10px]">
                {topicProgress.length} Topics
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3.5">
            {topicProgress.length > 0 ? (
              topicProgress.slice(0, 5).map((t, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {t.topic}
                    </span>
                    <span className="font-mono font-bold text-muted-foreground">
                      {t.correct}/{t.attempted} ({t.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        t.percentage >= 75
                          ? "bg-emerald-500"
                          : t.percentage >= 50
                          ? "bg-purple-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <HelpCircle className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>No topic telemetry yet. Begin practice to unlock breakdown.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT ASSESSMENTS & RECOMMENDED PRACTICE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Assessments */}
        <Card className="lg:col-span-8 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Recent Assessments</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Your latest technical assessment results
                </CardDescription>
              </div>
              <Link
                href="/history"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentAssessments.length > 0 ? (
              <div className="divide-y divide-border/60">
                {recentAssessments.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{item.jobRole}</h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Completed: {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block font-bold text-sm text-purple-600 font-mono">
                          {item.percentage}%
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Score: {item.score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/interview/results?id=${item.id}`}
                          className="px-3 py-1.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-semibold transition"
                        >
                          Report
                        </Link>
                        <Link
                          href={`/interview/review?id=${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold transition"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>No recent assessments. Start an interview to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Practice */}
        <Card className="lg:col-span-4 border-border/60 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Recommended Practice</span>
            </CardTitle>
            <CardDescription className="text-xs">
              AI-suggested preparation pathways
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
              <span className="font-bold text-purple-700 dark:text-purple-300">
                Next Suggested Track
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Take a 10-question drill focused on Code Output Prediction and Edge Cases in Python or Java.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">
                High-Yield Competencies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Asyncio & Event Loop",
                  "Memory Management",
                  "SQL Indexing",
                  "System Design",
                  "Algorithms",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-border/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/interview/setup"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <span>Setup Customized Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
