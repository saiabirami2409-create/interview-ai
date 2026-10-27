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
  Sliders,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  X,
  Target,
  BarChart,
  Mic,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface JobRoleOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultTopics: string[];
}

const JOB_ROLES: JobRoleOption[] = [
  {
    id: "python-developer",
    name: "Python Developer",
    description: "Backend architectures, data pipelines, asyncio, and Python internal mechanics.",
    icon: Terminal,
    color: "from-blue-600 to-cyan-500",
    defaultTopics: [
      "Python Fundamentals",
      "Object-Oriented Programming",
      "Lists, Tuples, Sets, Dictionaries",
      "Functions and Decorators",
      "Exception Handling",
      "File Handling",
      "Data Structures",
      "Algorithms",
      "Time Complexity",
      "Memory Management",
      "Python Output Prediction",
    ],
  },
  {
    id: "java-developer",
    name: "Java Developer",
    description: "Enterprise backend, JVM internals, multithreading, and OOP design patterns.",
    icon: CoffeeIcon,
    color: "from-amber-600 to-red-500",
    defaultTopics: [
      "Java Fundamentals",
      "OOP Concepts",
      "Inheritance",
      "Polymorphism",
      "Exception Handling",
      "Collections Framework",
      "Multithreading",
      "JVM Internals",
      "Memory Management",
      "Java Output Prediction",
    ],
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    description: "Modern web standards, responsive UI, rendering engines, and DOM APIs.",
    icon: Globe,
    color: "from-violet-600 to-purple-500",
    defaultTopics: [
      "HTML5 & Semantic Web",
      "CSS Grid & Flexbox",
      "Modern JavaScript (ES6+)",
      "DOM Manipulation & Events",
      "Browser Performance & CWV",
      "Web Accessibility (WCAG)",
      "Asynchronous JS & Fetch API",
      "Web Security (CORS, XSS, CSRF)",
    ],
  },
  {
    id: "backend-developer",
    name: "Backend Developer",
    description: "Distributed services, REST & GraphQL APIs, caching, and database design.",
    icon: Server,
    color: "from-emerald-600 to-teal-500",
    defaultTopics: [
      "API Design & Protocols (REST/gRPC)",
      "Authentication & JWT/OAuth",
      "Relational Database Indexing",
      "Redis Caching Strategies",
      "Message Queues & Event-Driven",
      "Microservices Architecture",
      "Concurrency & Rate Limiting",
      "System Design & Scalability",
    ],
  },
  {
    id: "fullstack-developer",
    name: "Full Stack Developer",
    description: "End-to-end web engineering, state management, full system integration.",
    icon: Layers,
    color: "from-purple-600 to-blue-500",
    defaultTopics: [
      "Full Stack Architecture",
      "Client-Server Data Flow",
      "Database Modeling & ORMs",
      "API Integration & Middleware",
      "State Management",
      "Authentication & Security",
      "CI/CD & Deployment",
      "Performance Tuning",
    ],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "SQL querying, business intelligence, data cleaning, and statistical metrics.",
    icon: LineChart,
    color: "from-sky-600 to-indigo-500",
    defaultTopics: [
      "Advanced SQL & Window Functions",
      "Data Cleaning & Wrangling",
      "Descriptive Statistics",
      "Excel & BI Dashboards",
      "Hypothesis Testing",
      "Cohort & Retention Analysis",
      "Data Visualization Best Practices",
    ],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    description: "Statistical modeling, predictive algorithms, exploratory analysis, and math.",
    icon: Brain,
    color: "from-fuchsia-600 to-pink-500",
    defaultTopics: [
      "Python",
      "NumPy",
      "Pandas",
      "Statistics",
      "Probability",
      "Machine Learning",
      "Data Preprocessing",
      "SQL",
      "Model Evaluation",
      "Feature Engineering",
    ],
  },
  {
    id: "aiml-engineer",
    name: "AI/ML Engineer",
    description: "Deep learning models, embeddings, LLM orchestration, and MLOps pipelines.",
    icon: Cpu,
    color: "from-indigo-600 to-purple-600",
    defaultTopics: [
      "Neural Networks & Deep Learning",
      "Transformers & LLM Architectures",
      "Fine-Tuning & Prompt Engineering",
      "Vector Embeddings & RAG",
      "Model Quantization & Inference",
      "Loss Functions & Optimizers",
      "MLOps & Model Monitoring",
    ],
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    description: "Data structures, algorithms, system architecture, and clean code principles.",
    icon: Code2,
    color: "from-blue-700 to-indigo-600",
    defaultTopics: [
      "Data Structures & Complexity",
      "Sorting & Searching Algorithms",
      "System Design Fundamentals",
      "Design Patterns & SOLID",
      "Memory Allocation & Pointers",
      "Testing & Debugging Strategies",
      "Version Control & Git Workflows",
    ],
  },
  {
    id: "react-developer",
    name: "React Developer",
    description: "Component lifecycle, Hooks, React 19 compiler, Server Components, and Next.js.",
    icon: Flame,
    color: "from-cyan-600 to-blue-600",
    defaultTopics: [
      "React Core & Virtual DOM",
      "Hooks & Custom Hooks",
      "Component Lifecycle & Re-renders",
      "React Server Components (RSC)",
      "Next.js App Router Architecture",
      "Context API & State Management",
      "Performance Optimization & Memo",
    ],
  },
  {
    id: "database-developer",
    name: "Database Developer",
    description: "ACID transactions, query plans, index tuning, and database normalization.",
    icon: Database,
    color: "from-teal-600 to-emerald-600",
    defaultTopics: [
      "SQL Schema Normalization",
      "Indexing & B-Tree Structures",
      "Transaction Isolation Levels (ACID)",
      "Query Optimization & Execution Plans",
      "Stored Procedures & Triggers",
      "Partitioning & Sharding",
      "NoSQL vs Relational Paradigms",
    ],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    description: "Containers, Kubernetes, infrastructure as code, CI/CD, and site reliability.",
    icon: Workflow,
    color: "from-orange-600 to-amber-500",
    defaultTopics: [
      "Docker & Containerization",
      "Kubernetes & Orchestration",
      "CI/CD Pipelines (GitHub Actions)",
      "Infrastructure as Code (Terraform)",
      "Linux Systems & Shell Scripting",
      "Monitoring & Observability",
      "Cloud Security & Networking",
    ],
  },
];

function CoffeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

const QUESTION_CATEGORIES = [
  { id: "core_concepts", label: "Core Concepts", desc: "Fundamental principles, definitions & language semantics" },
  { id: "code_output", label: "Code Output Prediction", desc: "Predicting outputs of subtle syntax & runtime code snippets" },
  { id: "debugging", label: "Debugging & Tracing", desc: "Identifying logical flaws, edge conditions & runtime bugs" },
  { id: "edge_cases", label: "Edge Cases & Boundaries", desc: "Off-by-one, null pointers, overflow & rare input handling" },
  { id: "performance_optimization", label: "Performance Optimization", desc: "Big-O complexity, memory consumption & latency trade-offs" },
  { id: "real_world_scenarios", label: "Real-World Scenarios", desc: "Applied engineering problems & realistic architecture constraints" },
];

export default function InterviewSetupPage() {
  const router = useRouter();

  // Wizard state
  const [selectedRole, setSelectedRole] = React.useState<string>("python-developer");
  const [customRole, setCustomRole] = React.useState<string>("");
  const [isCustomRole, setIsCustomRole] = React.useState<boolean>(false);

  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = React.useState<string>("");

  const [questionCount, setQuestionCount] = React.useState<5 | 10 | 15 | 20>(10);
  const [durationMinutes, setDurationMinutes] = React.useState<10 | 15 | 20 | 30>(15);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([
    "core_concepts",
    "code_output",
    "edge_cases",
    "performance_optimization",
  ]);

  const [loading, setLoading] = React.useState(false);
  const [generationStep, setGenerationStep] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  // When role changes, initialize topics
  React.useEffect(() => {
    if (!isCustomRole) {
      const roleObj = JOB_ROLES.find((r) => r.id === selectedRole);
      if (roleObj) {
        setSelectedTopics(roleObj.defaultTopics.slice(0, 6));
      }
    } else {
      setSelectedTopics(["Core Principles", "System Architecture", "Problem Solving"]);
    }
  }, [selectedRole, isCustomRole]);

  // Derived difficulty breakdown: 60% Intermediate, 40% Advanced
  const intermediateCount = Math.round(questionCount * 0.6);
  const advancedCount = questionCount - intermediateCount;

  const currentRoleName = isCustomRole
    ? customRole.trim() || "Custom Role"
    : JOB_ROLES.find((r) => r.id === selectedRole)?.name || "Software Engineer";

  const handleToggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length === 1) {
        setError("Please select at least one technical topic.");
        return;
      }
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setError(null);
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    const clean = customTopicInput.trim();
    if (!selectedTopics.includes(clean)) {
      setSelectedTopics([...selectedTopics, clean]);
    }
    setCustomTopicInput("");
  };

  const handleToggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return;
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleStartInterview = async () => {
    setError(null);

    if (isCustomRole && !customRole.trim()) {
      setError("Please enter your custom job role name.");
      return;
    }

    if (selectedTopics.length === 0) {
      setError("Please select at least one technical topic.");
      return;
    }

    setLoading(true);
    setGenerationStep("Contacting Gemini AI Engine...");

    try {
      // Step 1: Pre-validate setup with server
      setGenerationStep("Validating interview parameters & difficulty distribution...");
      const valRes = await fetch("/api/interviews/setup/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: currentRoleName,
          topics: selectedTopics,
          customJobRole: isCustomRole ? customRole : undefined,
          questionCount,
          durationMinutes,
          categories: selectedCategories,
        }),
      });

      const valData = await valRes.json();
      if (!valRes.ok) {
        throw new Error(valData?.error?.message || "Invalid configuration parameters.");
      }

      // Step 2: Create assessment and generate Gemini MCQs
      setGenerationStep(
        `Gemini AI is authoring ${questionCount} MCQs (${intermediateCount} Intermediate, ${advancedCount} Advanced)...`
      );

      const createRes = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: currentRoleName,
          topics: selectedTopics,
          customJobRole: isCustomRole ? customRole : undefined,
          questionCount,
          durationMinutes,
          categories: selectedCategories,
          difficultyDistribution: {
            intermediatePercent: 60,
            advancedPercent: 40,
          },
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData?.error?.message || "Failed to initialize interview.");
      }

      const assessmentId = createData.data?.assessment?.id;
      if (!assessmentId) {
        throw new Error("No assessment ID returned by server.");
      }

      setGenerationStep("Assessment room ready! Redirecting to timed test...");
      router.push(`/interview/questions?id=${assessmentId}`);
    } catch (err: any) {
      console.error(err);
      const raw = (err.message || "").toLowerCase();
      let friendlyMsg = "Unable to generate technical questions. Please try again.";
      if (raw.includes("network") || raw.includes("failed to fetch") || raw.includes("connection")) {
        friendlyMsg = "Connection lost. Please check your internet connection.";
      } else if (raw.includes("429") || raw.includes("busy") || raw.includes("quota") || raw.includes("rate limit")) {
        friendlyMsg = "The AI service is temporarily busy. Please try again shortly.";
      } else if (raw.includes("unauthorized") || raw.includes("401") || raw.includes("session")) {
        friendlyMsg = "Your session has expired. Please sign in again.";
      } else if (raw.includes("select") || raw.includes("topic") || raw.includes("role")) {
        friendlyMsg = "Please select your job role and technical topics.";
      } else if (err.message) {
        friendlyMsg = err.message;
      }
      setError(friendlyMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span>/</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">Assessment Setup</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Adaptive Assessment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customize Your Technical Interview
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Select your target career path, fine-tune core topics, and configure realistic interview constraints.
          </p>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Setup Notice</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: JOB ROLE SELECTION */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                <span>Phase 01</span>
                <span>•</span>
                <span>Role Selection</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Choose Your Dream Job Role
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prepare with AI-generated questions tailored to your career goals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomRole(!isCustomRole)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                  isCustomRole
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-slate-300 dark:border-slate-700 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isCustomRole ? "← Choose From Standard Roles" : "+ Enter Custom Role"}
              </button>
            </div>
          </div>

          {isCustomRole ? (
            <div className="p-6 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 max-w-xl mx-auto space-y-3">
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                Custom Target Role
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Embedded Firmware Engineer, Cloud Architect, QA Automation..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gemini will dynamically calibrate technical criteria and questions for this specific discipline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {JOB_ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id && !isCustomRole;
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setIsCustomRole(false);
                    }}
                    className={`group relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between text-left ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 ring-2 ring-purple-600/30 shadow-lg shadow-purple-600/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-700 shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${role.color} text-white flex items-center justify-center shadow-md`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 group-hover:border-purple-400 transition" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {role.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      <span>{role.defaultTopics.length} Core Topics</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Select →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: TECHNICAL TOPICS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                <span>Phase 02</span>
                <span>•</span>
                <span>Curriculum Specialization</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Select Technical Topics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the exact engineering subjects to test. Multiple selections allowed.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                {selectedTopics.length}
              </span>{" "}
              topics selected
            </div>
          </div>

          {/* Topics Badges Grid */}
          <div className="flex flex-wrap gap-2.5">
            {(!isCustomRole
              ? JOB_ROLES.find((r) => r.id === selectedRole)?.defaultTopics || []
              : []
            ).map((topic) => {
              const isChecked = selectedTopics.includes(topic);
              return (
                <button
                  type="button"
                  key={topic}
                  onClick={() => handleToggleTopic(topic)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                    isChecked
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isChecked ? "border-white bg-white/20" : "border-slate-400 dark:border-slate-600"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span>{topic}</span>
                </button>
              );
            })}

            {/* Custom Topics Already Added */}
            {selectedTopics
              .filter(
                (t) =>
                  isCustomRole ||
                  !(JOB_ROLES.find((r) => r.id === selectedRole)?.defaultTopics || []).includes(t)
              )
              .map((custom) => (
                <div
                  key={custom}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white border border-blue-600 flex items-center gap-2 shadow-sm"
                >
                  <span>{custom}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTopic(custom)}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>

          {/* Add Custom Topic Input */}
          <form onSubmit={handleAddCustomTopic} className="flex gap-2 max-w-md pt-2">
            <input
              type="text"
              placeholder="Add another topic (e.g. Asyncio, SQL Joins, Garbage Collection)..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </form>
        </section>

        {/* SECTION 3: CONFIGURATION & DIFFICULTY DISTRIBUTION */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
              <span>Phase 03</span>
              <span>•</span>
              <span>Test Parameters</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Assessment Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure question counts, time budgets, and algorithmic difficulty splits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Question Count */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Question Count</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Number of MCQs synthesized for this interview.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num as any)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      questionCount === num
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400"
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 font-mono text-center">
                Default: 10 Questions
              </div>
            </div>

            {/* Card 2: Difficulty Distribution */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Difficulty Distribution
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic ratio enforced by the Gemini prompt.
              </p>

              {/* Progress split bar */}
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: "60%" }}
                    className="bg-blue-600 h-full rounded-l-full"
                    title="Intermediate: 60%"
                  />
                  <div
                    style={{ width: "40%" }}
                    className="bg-purple-600 h-full rounded-r-full"
                    title="Advanced: 40%"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-blue-600 dark:text-blue-400">
                    Intermediate: 60% ({intermediateCount} Qs)
                  </span>
                  <span className="text-purple-600 dark:text-purple-400">
                    Advanced: 40% ({advancedCount} Qs)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Intermediate tests core reasoning & syntax; Advanced tests deep internals, edge cases & output tracing.
              </p>
            </div>

            {/* Card 3: Assessment Duration */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Assessment Duration
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enforced server-side deadline with auto-submission.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDurationMinutes(dur as any)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      durationMinutes === dur
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400"
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 font-mono text-center">
                Approx {Math.round((durationMinutes * 60) / questionCount)} seconds per question
              </div>
            </div>
          </div>

          {/* Question Categories Checkboxes */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Target Question Categories</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize which analytical competencies Gemini will inject into questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUESTION_CATEGORIES.map((cat) => {
                const isChecked = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isChecked
                        ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-600/60"
                        : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{cat.label}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>
              Powered by <strong className="text-slate-800 dark:text-slate-200">Google Gemini API</strong> (gemini-2.5-flash)
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleStartInterview}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-violet-600 to-blue-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{generationStep || "Generating AI Questions..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Technical Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* FULLSCREEN AI GENERATION OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl border border-purple-500/30 bg-slate-900 p-8 text-center text-white space-y-6 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center border border-white/20">
                <Brain className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">Synthesizing Technical MCQs</h3>
              <p className="text-xs text-purple-200/80 leading-relaxed font-mono">
                {generationStep}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Role:</span>
                <span className="text-purple-300 font-bold">{currentRoleName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Questions:</span>
                <span className="text-purple-300 font-bold">{questionCount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Difficulty Ratio:</span>
                <span className="text-purple-300 font-bold">
                  {intermediateCount} Intermediate / {advancedCount} Advanced
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Time Budget:</span>
                <span className="text-purple-300 font-bold">{durationMinutes} Minutes</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Validating schema constraints, four distinct options, single-answer key, and comprehensive reasoning explanations.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12">
        © 2026 InterviewAI – Practice Smarter. Interview Better.
      </footer>
    </div>
  );
}
