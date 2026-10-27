"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  Code2,
  Cpu,
  Database,
  Shield,
  ArrowRight,
  ArrowLeft,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Terminal,
  Server,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

const COMMON_DOMAINS = [
  "Full-Stack Web Development",
  "AI & Machine Learning",
  "Cloud & Distributed Systems",
  "Mobile App Development (iOS/Android)",
  "Data Engineering & Pipelines",
  "Cybersecurity & DevSecOps",
  "IoT & Embedded Systems",
  "Blockchain & Web3",
];

export default function ProjectSetupPage() {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [domain, setDomain] = React.useState("Full-Stack Web Development");
  const [description, setDescription] = React.useState("");
  const [technologies, setTechnologies] = React.useState("React, TypeScript, Node.js, PostgreSQL, Docker");
  const [candidateRole, setCandidateRole] = React.useState("Full-Stack Developer");
  const [challengesFaced, setChallengesFaced] = React.useState("Database query optimization, real-time socket latency, and state caching");
  const [outcomes, setOutcomes] = React.useState("Deployed to production with sub-100ms API response times and 99.9% uptime");
  const [isOngoingOrProposed, setIsOngoingOrProposed] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Quick preset sample for faster testing
  const handleLoadSampleProject = () => {
    setTitle("Distributed Task Orchestration & Telemetry Platform");
    setDomain("Cloud & Distributed Systems");
    setDescription(
      "A high-throughput distributed job scheduling engine built to execute asynchronous worker tasks with exponential backoff retries, Prometheus metrics telemetry, and dead-letter queue recovery."
    );
    setTechnologies("Go, Python, Redis, PostgreSQL, Docker, Kubernetes, Prometheus, gRPC");
    setCandidateRole("Lead Backend Architect");
    setChallengesFaced("Preventing race conditions during distributed worker lock contention, and mitigating Redis memory spikes under bursty write loads.");
    setOutcomes("Handled 25,000 requests/sec with zero job duplication and sub-10ms job dequeuing latency.");
    setIsOngoingOrProposed(false);
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project title");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a project description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/project/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDetails: {
            title: title.trim(),
            domain,
            description: description.trim(),
            technologies: technologies.split(",").map((t) => t.trim()).filter(Boolean),
            candidateRole: candidateRole.trim(),
            challengesFaced: challengesFaced.trim(),
            outcomes: outcomes.trim(),
            isOngoingOrProposed,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to initialize project interview");
      }

      router.push(`/project/interview?sessionId=${json.data.sessionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start interview");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold">
              Round 3 • Project-Based Interview
            </Badge>
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

      {/* Main Form Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={3} completedRounds={[1, 2]} />

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Round 3 • Project-Based MCQ Assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Project Architecture Assessment Setup
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Our AI Principal Architect generates 5 targeted, project-grounded Multiple-Choice Questions (MCQs) testing your system design choices, database indexing, concurrency control, security, and scalability trade-offs.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadSampleProject}
            className="text-xs h-8 gap-1.5 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Load Example Project</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Card 1: Project Identity */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" />
                <span>Project Identity & Domain</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Specify what you built and the engineering domain it addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Orchestrator, AI Medical Image Classifier, Real-Time E-Commerce Platform"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Domain / Field
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {COMMON_DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Specific Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    placeholder="e.g. Lead Backend Engineer, Full-Stack Developer, ML Engineer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project Description & Architecture Overview *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a 2-4 sentence summary of what problem the project solves, its core workflows, and architectural components..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Tech Stack & Implementation */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Tech Stack & Engineering Challenges</span>
              </CardTitle>
              <CardDescription className="text-xs">
                The AI interviewer will ask specific questions about these technologies and bottlenecks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Technologies, Frameworks & Databases Used *
                </label>
                <input
                  type="text"
                  required
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="e.g. React, Next.js, Node.js, PostgreSQL, Prisma, Redis, Docker, AWS S3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-400">Separate technologies with commas.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Key Technical Challenges Faced & Debugging Process
                </label>
                <textarea
                  rows={2}
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="e.g. Concurrency deadlocks, database connection saturation, caching cache-invalidation, socket reconnections..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project Outcomes, Performance Metrics & Testing
                </label>
                <input
                  type="text"
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  placeholder="e.g. 99.9% uptime, handled 10k daily users, unit test coverage of 85%, reduced query latency by 45%"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={isOngoingOrProposed}
                    onChange={(e) => setIsOngoingOrProposed(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      This is an ongoing, proposed, or academic portfolio project
                    </span>
                    <p className="text-[11px] text-slate-500">
                      The AI will adapt questions for early-stage or conceptual designs rather than production SLAs.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/interview/setup"
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Technical Round</span>
            </Link>

            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Project Inquiries...</span>
                </>
              ) : (
                <>
                  <span>Launch Project Round</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
