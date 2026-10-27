"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  Brain,
  Code2,
  Database,
  Cpu,
  Layers,
  Server,
  Terminal,
  Workflow,
  LineChart,
  Globe,
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  X,
  Target,
  Sliders,
  Award,
  BookOpen,
  Check,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

interface RoleConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultTopics: string[];
}

const PREDEFINED_ROLES: RoleConfig[] = [
  {
    id: "python-dev",
    name: "Python Developer",
    description: "Backend architectures, asyncio, internal mechanics, and data manipulation.",
    icon: Terminal,
    color: "from-blue-600 to-cyan-500",
    defaultTopics: [
      "Python Fundamentals",
      "OOP in Python",
      "Lists & Dictionaries",
      "Functions & Decorators",
      "Exception Handling",
      "Data Structures & Algorithms",
      "Memory Management",
      "Time Complexity",
    ],
  },
  {
    id: "java-dev",
    name: "Java Developer",
    description: "Enterprise backend, JVM internals, multithreading, and OOP design patterns.",
    icon: Server,
    color: "from-amber-600 to-red-500",
    defaultTopics: [
      "Java Fundamentals",
      "Inheritance & Polymorphism",
      "Collections Framework",
      "Exception Handling",
      "Multithreading & Concurrency",
      "JVM Internals",
      "Design Patterns",
    ],
  },
  {
    id: "software-eng",
    name: "Software Engineer",
    description: "System design, data structures, algorithms, modular engineering.",
    icon: Cpu,
    color: "from-purple-600 to-indigo-600",
    defaultTopics: [
      "Data Structures & Algorithms",
      "System Design Fundamentals",
      "Database Modeling",
      "Clean Code & Refactoring",
      "API Design & REST",
      "Concurrency & Locking",
    ],
  },
  {
    id: "frontend-dev",
    name: "Frontend Developer",
    description: "DOM APIs, performance, TypeScript, modern CSS, and bundle optimization.",
    icon: Globe,
    color: "from-cyan-600 to-blue-500",
    defaultTopics: [
      "HTML5 & Semantic Markup",
      "Modern CSS & Flexbox/Grid",
      "JavaScript ES6+ Internals",
      "TypeScript Typing & Generics",
      "Browser Rendering & DOM",
      "Web Performance & LCP",
    ],
  },
  {
    id: "backend-dev",
    name: "Backend Developer",
    description: "Distributed architectures, microservices, caching, and database queries.",
    icon: Layers,
    color: "from-emerald-600 to-teal-500",
    defaultTopics: [
      "RESTful API & GraphQL",
      "Relational & NoSQL Databases",
      "Redis & Distributed Caching",
      "Authentication & JWT/OAuth",
      "Message Queues (Kafka/RabbitMQ)",
      "High Availability & Scaling",
    ],
  },
  {
    id: "fullstack-dev",
    name: "Full Stack Developer",
    description: "End-to-end web engineering, React/Node integrations, state, and databases.",
    icon: Code2,
    color: "from-violet-600 to-pink-500",
    defaultTopics: [
      "Frontend State Management",
      "Backend API Construction",
      "SQL Query Optimization",
      "Full-Stack Authentication",
      "CI/CD & Cloud Deployment",
      "End-to-End Testing",
    ],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "SQL window functions, business analytics, data hygiene, and visualization.",
    icon: LineChart,
    color: "from-amber-500 to-orange-500",
    defaultTopics: [
      "Advanced SQL & Window Functions",
      "Data Aggregation & Grouping",
      "Data Cleaning & Hygiene",
      "Statistical Summaries",
      "KPI Metric Formulation",
      "Data Storytelling",
    ],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    description: "Statistical modeling, hypothesis testing, Pandas/NumPy, and predictive algorithms.",
    icon: Brain,
    color: "from-purple-500 to-teal-500",
    defaultTopics: [
      "Pandas & NumPy Mechanics",
      "Hypothesis Testing & p-values",
      "Regression & Classification",
      "Feature Engineering",
      "Model Evaluation Metrics",
      "Overfitting Prevention",
    ],
  },
  {
    id: "aiml-eng",
    name: "AI/ML Engineer",
    description: "Deep learning, transformer architectures, embeddings, and model serving.",
    icon: Sparkles,
    color: "from-fuchsia-600 to-purple-600",
    defaultTopics: [
      "Neural Network Architecture",
      "Transformers & Self-Attention",
      "Vector Search & Embeddings",
      "Loss Functions & Optimizers",
      "Model Fine-Tuning & Quantization",
      "MLOps & Model Deployment",
    ],
  },
  {
    id: "react-dev",
    name: "React Developer",
    description: "Hooks, reconciliation, virtual DOM, SSR/RSC, and state management.",
    icon: Workflow,
    color: "from-cyan-500 to-blue-600",
    defaultTopics: [
      "React Hooks (useEffect, useMemo)",
      "Virtual DOM & Reconciliation",
      "Context API & Global Stores",
      "Server Components & Hydration",
      "Custom Hook Architecture",
      "Component Re-render Optimization",
    ],
  },
  {
    id: "database-dev",
    name: "Database Developer",
    description: "Schema design, index tuning, query execution plans, transactions, ACID.",
    icon: Database,
    color: "from-emerald-500 to-blue-600",
    defaultTopics: [
      "Relational Normalization (3NF/BCNF)",
      "B-Tree & Hash Indexes",
      "ACID & Transaction Isolation",
      "Query Execution Plans & EXPLAIN",
      "Partitioning & Sharding",
      "Stored Procedures & Triggers",
    ],
  },
  {
    id: "devops-eng",
    name: "DevOps Engineer",
    description: "Docker, Kubernetes, Terraform, cloud networking, and zero-downtime releases.",
    icon: Workflow,
    color: "from-blue-600 to-indigo-700",
    defaultTopics: [
      "Docker Containers & Multi-stage",
      "Kubernetes Pods & Services",
      "CI/CD Pipeline Automation",
      "Infrastructure as Code (Terraform)",
      "Linux Sysadmin & Networking",
      "Observability & Monitoring",
    ],
  },
];

export default function TechnicalSetupPage() {
  const router = useRouter();

  // Selection states
  const [selectedRole, setSelectedRole] = React.useState<RoleConfig>(PREDEFINED_ROLES[0]);
  const [isCustomRole, setIsCustomRole] = React.useState(false);
  const [customRoleText, setCustomRoleText] = React.useState("");

  const [topics, setTopics] = React.useState<string[]>(PREDEFINED_ROLES[0].defaultTopics);
  const [newTopicInput, setNewTopicInput] = React.useState("");

  const [questionCount, setQuestionCount] = React.useState<5 | 10 | 15 | 20>(10);
  const [durationMinutes, setDurationMinutes] = React.useState<10 | 15 | 20 | 30>(15);
  const [experienceLevel, setExperienceLevel] = React.useState<"INTERN" | "FRESHER" | "JUNIOR" | "MID" | "SENIOR">("FRESHER");
  const [assessmentMode, setAssessmentMode] = React.useState<"PRACTICE" | "EXAM">("PRACTICE");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // When selected role changes, update default topics
  const handleSelectRole = (role: RoleConfig) => {
    setSelectedRole(role);
    setIsCustomRole(false);
    setTopics(role.defaultTopics);
  };

  const toggleTopic = (topic: string) => {
    if (topics.includes(topic)) {
      if (topics.length === 1) return; // Keep at least one
      setTopics(topics.filter((t) => t !== topic));
    } else {
      setTopics([...topics, topic]);
    }
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicInput.trim() && !topics.includes(newTopicInput.trim())) {
      setTopics([...topics, newTopicInput.trim()]);
      setNewTopicInput("");
    }
  };

  const handleStartRound = async () => {
    setError(null);
    setLoading(true);

    try {
      const jobRole = isCustomRole ? customRoleText.trim() : selectedRole.name;
      if (!jobRole) {
        throw new Error("Please specify a target job role.");
      }
      if (topics.length === 0) {
        throw new Error("Please select at least one technical topic.");
      }

      const res = await fetch("/api/technical/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          topics,
          questionCount,
          durationMinutes,
          experienceLevel,
          assessmentMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to start technical round");
      }

      const sessionId = json.data?.sessionId || json.sessionId;
      router.push(`/technical/questions?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to initialize technical round. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/interview/select"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Interview Hub</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Module 2: Technical Round
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge className="bg-purple-600 text-white hover:bg-purple-600">
            AI-Generated Technical MCQs
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Configure Technical Interview
          </h1>
          <p className="text-sm text-muted-foreground">
            Select your target role, customized topic syllabus, assessment duration, and mode.
          </p>
        </div>

        {/* 5-Round Progress Stepper */}
        <FiveRoundStepper currentRound={2} completedRounds={[1]} />

        {error && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* 1. Target Job Role */}
        <section className="space-y-4 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                1. Select Target Job Role
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose from 12 industry benchmarks or define a custom domain.
              </p>
            </div>
            <Button
              variant={isCustomRole ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCustomRole(!isCustomRole)}
              className="text-xs h-8"
            >
              {isCustomRole ? "Use Predefined Roles" : "Custom Role"}
            </Button>
          </div>

          {isCustomRole ? (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
              <label className="text-xs font-semibold">Custom Target Job Role</label>
              <input
                type="text"
                value={customRoleText}
                onChange={(e) => setCustomRoleText(e.target.value)}
                placeholder="e.g. Embedded Firmware Engineer, Cloud Security Architect..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {PREDEFINED_ROLES.map((role) => {
                const isSelected = selectedRole.id === role.id && !isCustomRole;
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                      isSelected
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold line-clamp-1">{role.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{role.defaultTopics.length} topics</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Topics Selection */}
        <section className="space-y-4 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                2. Select Topics ({topics.length} selected)
              </h2>
              <p className="text-xs text-muted-foreground">
                Toggle topics to include in your question bank or add custom topics.
              </p>
            </div>
          </div>

          {/* Topics Chips */}
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t}
                onClick={() => toggleTopic(t)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 cursor-pointer hover:bg-purple-500/25 transition-colors select-none"
              >
                <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                {t}
              </span>
            ))}
          </div>

          {/* Add Custom Topic Input */}
          <form onSubmit={handleAddCustomTopic} className="flex gap-2 max-w-md pt-2">
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              placeholder="Add another topic (e.g. Graph Algorithms)..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button type="submit" variant="outline" size="sm" className="text-xs h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </form>
        </section>

        {/* 3. Question Count & Duration & Difficulty Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Count & Time */}
          <section className="space-y-4 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              3. Questions & Duration
            </h2>

            <div>
              <label className="text-xs font-semibold block mb-2">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {([5, 10, 15, 20] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      questionCount === count
                        ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Time Limit</label>
              <div className="grid grid-cols-4 gap-2">
                {([10, 15, 20, 30] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      durationMinutes === mins
                        ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Candidate Experience Level</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "INTERN", label: "Intern" },
                  { id: "FRESHER", label: "Fresher" },
                  { id: "MID", label: "Mid (2-4y)" },
                  { id: "SENIOR", label: "Senior (5y+)" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.id as any)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      experienceLevel === lvl.id
                        ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span>Difficulty Distribution:</span>
              <span className="font-semibold text-foreground">
                {experienceLevel === "SENIOR" || experienceLevel === "MID"
                  ? "40% Intermediate / 60% Advanced"
                  : experienceLevel === "INTERN"
                  ? "80% Intermediate / 20% Advanced"
                  : "60% Intermediate / 40% Advanced"}
              </span>
            </div>
          </section>

          {/* 4. Assessment Mode */}
          <section className="space-y-4 bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                4. Select Practice or Exam Mode
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Choose how you want to experience your technical evaluation.
              </p>

              <div className="space-y-3">
                <div
                  onClick={() => setAssessmentMode("PRACTICE")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    assessmentMode === "PRACTICE"
                      ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-500" />
                      Practice Mode (Recommended)
                    </span>
                    <Badge variant="outline" className="text-[10px]">Instant Learning</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Check answers per question, reveal hints, inspect in-depth explanations immediately, and re-attempt.
                  </p>
                </div>

                <div
                  onClick={() => setAssessmentMode("EXAM")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    assessmentMode === "EXAM"
                      ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Exam Mode
                    </span>
                    <Badge variant="outline" className="text-[10px]">Strict Mock Test</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Strict timed environment without instant hints. Final score and comprehensive explanations revealed upon submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <Button
              onClick={handleStartRound}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 h-12 gap-2 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating AI Questions with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Start Technical Round</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
