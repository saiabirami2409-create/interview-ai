"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calculator,
  Brain,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Clock,
  HelpCircle,
  Award,
  Layers,
  CheckCircle2,
  Sliders,
  Shield,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

const APTITUDE_CATEGORIES = [
  {
    id: "Mixed",
    name: "Mixed Comprehensive",
    description: "Balanced rotation across Quantitative, Logical Reasoning, and Verbal Ability.",
    icon: Sparkles,
    color: "from-purple-600 to-indigo-600",
    topics: ["Percentages", "Number Series", "Profit & Loss", "Blood Relations", "Sentence Correction", "Time & Work"],
  },
  {
    id: "Quantitative Aptitude",
    name: "Quantitative Aptitude",
    description: "Numerical reasoning, arithmetic, profit/loss, percentages, algebra, and data interpretation.",
    icon: Calculator,
    color: "from-blue-600 to-cyan-500",
    topics: ["Profit & Loss", "Percentages", "Time, Speed & Distance", "Simple/Compound Interest", "Probability", "Mixtures"],
  },
  {
    id: "Logical Reasoning",
    name: "Logical Reasoning",
    description: "Deductive logic, patterns, series, seating arrangements, syllogisms, and puzzles.",
    icon: Brain,
    color: "from-amber-600 to-orange-500",
    topics: ["Number Series", "Coding & Decoding", "Blood Relations", "Direction Sense", "Syllogisms", "Seating Plans"],
  },
  {
    id: "Verbal Ability",
    name: "Verbal Ability",
    description: "Grammar, reading comprehension, synonyms/antonyms, error identification, and para-jumbles.",
    icon: BookOpen,
    color: "from-emerald-600 to-teal-500",
    topics: ["Reading Comprehension", "Synonyms & Antonyms", "Sentence Correction", "Grammar", "Vocabulary", "Para Jumbles"],
  },
];

export default function AptitudeSetupPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState("Mixed");
  const [difficulty, setDifficulty] = React.useState<"Beginner" | "Intermediate" | "Advanced" | "Mixed">("Mixed");
  const [questionCount, setQuestionCount] = React.useState<10 | 15 | 20 | 30>(15);
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStartRound = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aptitude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty,
          questionCount,
          timeLimitMinutes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to initialize aptitude assessment");
      }

      const { assessmentId } = json.data;
      router.push(`/aptitude/questions?assessmentId=${assessmentId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start assessment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
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
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            Round 1 of 5
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5" />
            <span>ROUND 1 – APTITUDE ASSESSMENT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Configure Your Aptitude Round
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Test quantitative reasoning, logical thinking, and verbal proficiency with verified mathematical solutions, hints, and step-by-step shortcuts.
          </p>
        </div>

        {/* 5-Round Progress Stepper */}
        <FiveRoundStepper currentRound={1} />

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* 1. Category Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>1. Select Aptitude Category</span>
            </h2>
            <span className="text-xs text-muted-foreground">Choose mixed or specialized track</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {APTITUDE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/30 shadow-md"
                      : "border-border/60 bg-card hover:border-purple-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {cat.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cat.topics.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Difficulty & Question Count Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Difficulty */}
          <Card className="border-border/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                2. Difficulty Level
              </CardTitle>
              <CardDescription className="text-xs">Adjust problem complexity</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {[
                { id: "Mixed", label: "Mixed (20% Beg / 60% Int / 20% Adv)" },
                { id: "Beginner", label: "Beginner (Foundational)" },
                { id: "Intermediate", label: "Intermediate (Standard)" },
                { id: "Advanced", label: "Advanced (Challenging)" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as any)}
                  className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    difficulty === d.id
                      ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Question Count */}
          <Card className="border-border/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                3. Number of Questions
              </CardTitle>
              <CardDescription className="text-xs">Test length</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 grid grid-cols-2 gap-2">
              {([10, 15, 20, 30] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setQuestionCount(count);
                    setTimeLimitMinutes(Math.max(15, count));
                  }}
                  className={`py-3 text-center text-xs font-bold rounded-xl border transition-all ${
                    questionCount === count
                      ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Time Limit & Accuracy */}
          <Card className="border-border/60 flex flex-col justify-between">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                4. Time Limit
              </CardTitle>
              <CardDescription className="text-xs">Suggested: ~1 min per question</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeLimitMinutes(mins)}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                      timeLimitMinutes === mins
                        ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300">
                ⚡ Instant answer checking & step-by-step verification available per question.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border/60 shadow-lg">
          <div>
            <h3 className="text-sm font-bold">Ready to Start Aptitude Assessment?</h3>
            <p className="text-xs text-muted-foreground">
              {questionCount} Questions • {selectedCategory} • {difficulty} Difficulty • {timeLimitMinutes} Minutes
            </p>
          </div>

          <Button
            onClick={handleStartRound}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 px-8 h-12 text-sm gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Preparing Verified Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Aptitude Round</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
