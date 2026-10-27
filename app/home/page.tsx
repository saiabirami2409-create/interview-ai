"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Brain,
  FileText,
  Target,
  BarChart3,
  Bot,
  Layers,
  Code2,
  Users2,
  Briefcase,
  HelpCircle,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Award,
  ChevronDown,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeroCoreScene } from "@/components/3d/HeroCoreScene";
import { ConverzaLogo } from "@/components/ui/logo";

export default function HomePage() {
  const router = useRouter();
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);
  const [loadingSession, setLoadingSession] = React.useState(true);
  const [user, setUser] = React.useState<any | null>(null);

  // Soft session detection so both visitors and authenticated users can view the portal
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingSession(false);
      });
  }, []);

  const interviewTypes = [
    {
      id: "technical",
      title: "Technical Interview",
      badge: "Core CS & Coding",
      description:
        "Rigorous algorithm analysis, system design concepts, data structures, and tech stack trade-offs tailored to your target role.",
      evaluates: "Factual correctness, time/space complexity, edge-case coverage, and engineering logic.",
      href: "/dashboard/setup-interview?type=technical",
      icon: Code2,
      color: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30",
    },
    {
      id: "behavioral",
      title: "Behavioral Interview",
      badge: "STAR Methodology",
      description:
        "Scenario-based leadership, conflict resolution, ownership, and team communication challenges.",
      evaluates: "Situation, Task, Action, Result structured reasoning, empathy, and professional integrity.",
      href: "/dashboard/setup-interview?type=behavioral",
      icon: Users2,
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    },
    {
      id: "hr",
      title: "HR & Culture Round",
      badge: "Career Alignment",
      description:
        "Role motivation, organizational fit, salary expectations, adaptability, and long-term trajectory.",
      evaluates: "Communication poise, company values alignment, concise articulation, and self-awareness.",
      href: "/dashboard/setup-interview?type=hr",
      icon: Briefcase,
      color: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    },
    {
      id: "project_based",
      title: "Project-Based Technical",
      badge: "Architecture & Trade-offs",
      description:
        "In-depth interrogation of projects listed on your resume, database schemas, and architectural choices.",
      evaluates: "Authentic project ownership, tech stack justification, scalability defenses, and debugging experience.",
      href: "/dashboard/setup-interview?type=project_based",
      icon: Layers,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    },
  ];

  const features = [
    {
      icon: Bot,
      title: "24/7 AI Interview Coach Chatbot",
      description:
        "Instant interactive advice on interview preparation, STAR frameworks, role recommendations, and guided practice.",
    },
    {
      icon: Brain,
      title: "AI-Generated Role Questions",
      description:
        "Questions dynamically synthesized for 10+ software roles — from Frontend and Backend to ML and Data Science.",
    },
    {
      icon: FileText,
      title: "Resume-Aware Personalization",
      description:
        "Extracts skills, frameworks, and projects from your uploaded resume to tailor questions to your actual background.",
    },
    {
      icon: Target,
      title: "Job-Description Grounding",
      description:
        "Paste any target company job posting. Converza extracts required competencies and simulates that specific hiring loop.",
    },
    {
      icon: Code2,
      title: "Technical Answer Evaluation",
      description:
        "Assesses algorithmic correctness, architectural principles, computational complexity, and best practices.",
    },
    {
      icon: Users2,
      title: "Communication Quality Analysis",
      description:
        "Evaluates professional clarity, structured STAR delivery, and eliminates rambling or evasive responses.",
    },
    {
      icon: Layers,
      title: "Project Technical Defense",
      description:
        "Pressure-tests the projects on your CV — challenging design decisions, database normalization, and scaling bottlenecks.",
    },
    {
      icon: Sparkles,
      title: "Actionable Improvement Rubrics",
      description:
        "Receive question-by-question scoring, identified conceptual gaps, and exemplary 95+ model answer outlines.",
    },
    {
      icon: BarChart3,
      title: "Longitudinal Analytics",
      description:
        "Track your score trajectories, 5-axis competency radars, and readiness velocity across successive interview loops.",
    },
    {
      icon: Zap,
      title: "Weak Topic Curriculum",
      description:
        "Automatically identifies knowledge gaps and lets you launch targeted 1-click drill sessions on struggling concepts.",
    },
  ];

  const problemsAndSolutions = [
    {
      problem: "Generic question lists that don't match the actual company or role.",
      solution: "Bespoke questions generated dynamically from target JDs and candidate resumes.",
    },
    {
      problem: "Vague feedback like 'good effort' with no actionable technical critique.",
      solution: "5-axis rubric scores, identified missing concepts, and concrete model answers.",
    },
    {
      problem: "Nervousness, poor STAR structure, and rambling under pressure.",
      solution: "Distraction-free realistic practice room with live timer and communication scoring.",
    },
    {
      problem: "No visibility into whether you are actually placement ready.",
      solution: "Data-backed readiness score index with benchmark comparisons before the real round.",
    },
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Foundational interview practice for college placement starters.",
      features: [
        "3 AI mock interviews per month",
        "Core Technical & HR question categories",
        "Basic question-wise rubric scoring",
        "Session history & basic feedback",
        "Standard interview duration (15 min)",
      ],
      cta: "Current Free Practice",
      href: "/dashboard/setup-interview",
      popular: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "per month",
      description: "Comprehensive preparation for active placement season candidates.",
      features: [
        "15 AI mock interviews per month",
        "Resume-aware question personalization",
        "Job description pasting & custom loops",
        "5-axis in-depth competency reports",
        "Detailed model answer outlines",
        "Personalized weak topic drills",
        "Downloadable PDF performance reports",
      ],
      cta: "Upgrade to Pro",
      href: "/dashboard/setup-interview?plan=pro",
      popular: true,
    },
    {
      name: "Career Plus",
      price: "₹999",
      period: "per month",
      description: "Intensive training for tier-1 tech company recruitment drives.",
      features: [
        "Unlimited AI mock interviews",
        "Advanced System Design & Project rounds",
        "STAR behavioral mastery feedback",
        "Full historical analytics & radar tracking",
        "Priority model latency & response speed",
        "Custom role & difficulty tuning",
        "Placement readiness certification report",
      ],
      cta: "Choose Career Plus",
      href: "/dashboard/setup-interview?plan=career_plus",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "How does Converza evaluate candidate answers?",
      a: "Converza evaluates every response across 5 standardized rubrics: Relevance, Technical Correctness, Completeness & Depth, Communication Quality, and Logical Reasoning. It identifies specific missing technical terms or edge cases and provides a model answer outline illustrating what a 95+ score response looks like.",
    },
    {
      q: "Do I need to upload a resume to practice?",
      a: "No, a resume is completely optional. You can practice standard role-based loops (e.g. Frontend, Backend, ML) without one. However, uploading your resume unlocks deep personalization where the AI questions you directly on your stated projects, internships, and technical stack.",
    },
    {
      q: "What interview formats and categories are supported?",
      a: "Converza supports 4 primary formats: Technical Interviews (data structures, algorithms, system architecture), HR Interviews (motivation, adaptability, culture fit), Behavioral Interviews (STAR situation, task, action, result), and Project-Based Technical Interviews (architecture trade-offs and code choices).",
    },
    {
      q: "How should I interpret the Readiness Score?",
      a: "The Interview Readiness Score (0–100%) represents an algorithmic estimate of your preparation based on rubric consistency, technical depth, and communication clarity. It is a diagnostic preparation metric and explicitly does not guarantee real-world job offers or placement outcomes.",
    },
    {
      q: "How is my resume and personal data protected?",
      a: "Your resume is stored in an encrypted, isolated private partition accessible only by your authenticated session. We never sell student data, expose transcripts publicly, or use candidate submissions to train public AI models. You can permanently delete your resume and transcripts anytime with one click.",
    },
    {
      q: "What is the difference between Free and Pro tiers?",
      a: "The Free plan provides 3 baseline interviews per month for foundational practice. Pro provides 15 monthly sessions, full resume-parsing personalization, custom job description matching, in-depth 5-axis diagnostic reports, and weak-topic practice drills.",
    },
    {
      q: "How can I improve my scores between sessions?",
      a: "After each interview, review your Performance Report to inspect specific missing concepts and recommended preparation topics. Navigate to the Preparation Topics tab on your dashboard to complete focused practice drills targeting your identified skill gaps before retaking the interview.",
    },
    {
      q: "Does Converza guarantee campus placement or employment?",
      a: "No platform can guarantee hiring decisions. Converza is an educational preparation platform designed to help you practice under realistic conditions, identify blind spots, and refine your answers before facing real recruiters and technical interviewers.",
    },
  ];

  const testimonials = [
    {
      name: "Rohan Verma",
      role: "Associate Software Engineer at Fintech Corp",
      college: "B.Tech CSE, Batch of 2025 (Sample Student)",
      quote:
        "The project-based technical mock interview grilled me on indexing and database locks in my e-commerce project — the exact questions my real interviewer asked two weeks later.",
      score: "Readiness Score: 88/100",
    },
    {
      name: "Sneha Nair",
      role: "Frontend Developer at SaaS Startup",
      college: "B.E. Information Technology (Sample Student)",
      quote:
        "I always froze during behavioral questions. The STAR feedback showed me how to stop rambling and structure my answers with concrete metrics.",
      score: "Readiness Score: 92/100",
    },
    {
      name: "Tanmay Deshmukh",
      role: "Graduate Trainee Engineer",
      college: "Computer Engineering, Class of 2024 (Sample Student)",
      quote:
        "Pasting the actual job description from the campus drive and getting tailored questions was a game changer. The model answers showed me exactly what recruiters looked for.",
      score: "Readiness Score: 85/100",
    },
  ];

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <ConverzaLogo size="lg" />
          <span className="text-xs text-muted-foreground font-mono animate-pulse">Loading Converza Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          {/* Ambient luminous glow background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-cyan-400/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Copy & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Powered Placement & Mock Interview Intelligence</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
                  Your Next Interview Deserves Your{" "}
                  <span className="bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Best Answer.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Practice with an AI interviewer built around your resume, target role, and job description. Get detailed feedback on technical accuracy, communication, answer quality, and interview readiness — before the real opportunity arrives.
                </p>

                {/* Primary, AI Chatbot & Secondary CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Button href="/aptitude/setup" size="lg" className="w-full sm:w-auto gap-2.5 h-13 px-8 text-base shadow-xl shadow-indigo-500/25">
                    <span>Start Mock Interview</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    href="/chat"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-13 px-6 text-base gap-2 border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 shadow-sm"
                  >
                    <Bot className="w-5 h-5 text-purple-500 animate-pulse" />
                    <span>Chat with AI Coach</span>
                  </Button>

                  <Button href="/how-it-works" variant="ghost" size="lg" className="w-full sm:w-auto h-13 px-5 text-base text-muted-foreground hover:text-foreground">
                    How It Works
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Personalized questions</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>5-axis rubric feedback</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>Track progress over time</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Centerpiece */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="w-full max-w-[500px]">
                  <HeroCoreScene />
                </div>
              </div>
            </div>

            {/* PRODUCT DASHBOARD MOCKUP PREVIEW */}
            <div className="mt-16 md:mt-24 pt-6">
              <div className="relative rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-border/80 via-border/30 to-border/10 border border-border/60 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 mb-3 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-sans font-medium text-foreground">Converza Workspace Preview</span>
                  </div>
                  <Badge variant="cyan" className="font-mono text-[10px]">
                    *Illustrative Demo Data
                  </Badge>
                </div>

                {/* Inner Mockup UI */}
                <div className="rounded-2xl bg-card/90 border border-border/40 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  {/* Readiness Score Card */}
                  <div className="p-4 rounded-xl bg-background/60 border border-border/50 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-mono">Overall Readiness</span>
                    <div className="my-2">
                      <span className="text-4xl font-extrabold text-emerald-400 font-mono">82%</span>
                      <span className="text-xs text-emerald-400/90 ml-2 font-medium">Placement Ready</span>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[82%]" />
                    </div>
                  </div>

                  {/* Technical Score Card */}
                  <div className="p-4 rounded-xl bg-background/60 border border-border/50 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-mono">Technical Accuracy</span>
                    <div className="my-2">
                      <span className="text-4xl font-extrabold text-violet-400 font-mono">88%</span>
                      <span className="text-xs text-muted-foreground ml-2">5 Evaluated</span>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-400 h-full w-[88%]" />
                    </div>
                  </div>

                  {/* Communication Card */}
                  <div className="p-4 rounded-xl bg-background/60 border border-border/50 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-mono">Communication Poise</span>
                    <div className="my-2">
                      <span className="text-4xl font-extrabold text-cyan-400 font-mono">79%</span>
                      <span className="text-xs text-muted-foreground ml-2">STAR Structure</span>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[79%]" />
                    </div>
                  </div>

                  {/* Identified Weak Topic */}
                  <div className="p-4 rounded-xl bg-background/60 border border-border/50 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-mono">Priority Weak Topic</span>
                    <div className="my-1">
                      <p className="text-sm font-semibold text-foreground">SQL Indexing & Locks</p>
                      <p className="text-xs text-amber-400">Action: Review B-Tree Tradeoffs</p>
                    </div>
                    <div className="pt-1">
                      <Button
                        href="/dashboard/topics"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-[11px] text-primary font-medium hover:underline justify-start gap-1"
                      >
                        <span>1-Click Practice Available</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM & SOLUTION SECTION */}
        <section className="py-20 border-t border-border/40 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="violet">Placement Challenges</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Why Traditional Interview Practice Falls Short
              </h2>
              <p className="text-muted-foreground text-base">
                Most students practice with static cheat sheets or peer mocks that offer little technical depth. Converza gives you institutional-grade evaluation before your real hiring rounds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {problemsAndSolutions.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card/50 p-6 flex flex-col justify-between hover:border-violet-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
                        <X className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          The Problem
                        </span>
                        <p className="text-sm text-foreground/90 font-medium mt-0.5">{item.problem}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-border/40">
                      <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                          The Converza Solution
                        </span>
                        <p className="text-sm text-foreground font-semibold mt-0.5">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-24 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="cyan">Full Platform Capabilities</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Engineered for Rigorous Mock Interview Preparation
              </h2>
              <p className="text-muted-foreground text-base">
                Everything you need to transform theoretical knowledge into calm, structured interview excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <Card
                    key={idx}
                    className="border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{feat.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed pt-1">
                        {feat.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-24 border-t border-border/40 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="violet">Simple 4-Step Process</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                From Resume to Ready in 4 Steps
              </h2>
              <p className="text-muted-foreground text-base">
                A seamless preparation journey built around your real career targets and placement deadlines.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Profile & Resume",
                  desc: "Create your student account and upload your PDF/DOCX resume for automated skill extraction.",
                },
                {
                  step: "02",
                  title: "Select Role & JD",
                  desc: "Pick your target engineering role or paste the exact job posting from the company hiring drive.",
                },
                {
                  step: "03",
                  title: "Realistic AI Interview",
                  desc: "Answer bespoke technical, project, and behavioral questions in our focused interview room.",
                },
                {
                  step: "04",
                  title: "Review & Drill Gaps",
                  desc: "Inspect your 5-axis readiness report, review model answers, and drill targeted weak topics.",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative p-6 rounded-2xl border border-border/60 bg-card/50 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="font-mono text-3xl font-black bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
                      {step.step}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERVIEW TYPES SECTION */}
        <section id="interview-types" className="py-24 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="default">Specialized Rounds</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Prepare for Every Stage of the Hiring Loop
              </h2>
              <p className="text-muted-foreground text-base">
                Click any interview format below to begin a diagnostic session customized for that specific evaluation standard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`rounded-2xl border p-6 sm:p-8 bg-gradient-to-br ${type.color} flex flex-col justify-between space-y-6 backdrop-blur-md`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-xl bg-background/80 border border-border/50 text-foreground">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {type.badge}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-foreground">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {type.description}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-background/60 border border-border/40 text-xs">
                        <span className="font-semibold text-foreground">Evaluates: </span>
                        <span className="text-muted-foreground">{type.evaluates}</span>
                      </div>
                    </div>

                    <Button href={type.href} variant="outline" className="w-full justify-between group">
                      <span>Practice {type.title}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS & SOCIAL PROOF */}
        <section className="py-24 border-t border-border/40 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="cyan">Placement Experiences</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Built for College Placements & Tech Careers
              </h2>
              <p className="text-muted-foreground text-base">
                See how simulated hiring loops help candidates identify technical blind spots before facing real recruitment panels.
              </p>
              <p className="text-xs text-muted-foreground/70 font-mono">
                *The following are sample student experiences illustrative of platform workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between space-y-4"
                >
                  <p className="text-sm text-foreground/90 italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                      <p className="text-[11px] text-muted-foreground/80">{t.college}</p>
                    </div>
                    <Badge variant="success" className="font-mono text-[10px]">
                      {t.score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="violet">Simple & Transparent</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Affordable Plans for Every Placement Stage
              </h2>
              <p className="text-muted-foreground text-base">
                Start for free, then upgrade as your campus drives approach for unlimited resume-grounded practice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-3xl border p-8 flex flex-col justify-between relative transition-all duration-300 ${
                    tier.popular
                      ? "border-violet-500 bg-gradient-to-b from-violet-500/10 via-card to-card shadow-2xl shadow-violet-500/10 md:-translate-y-2"
                      : "border-border/70 bg-card/60"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge variant="violet" className="px-3 py-1 text-[11px] shadow-md uppercase font-mono tracking-wider">
                        Recommended for Placements
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black font-mono text-foreground">{tier.price}</span>
                      <span className="text-xs text-muted-foreground">/{tier.period}</span>
                    </div>

                    <div className="pt-4 border-t border-border/40 space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Included Features:
                      </span>
                      <ul className="space-y-2.5 text-xs text-foreground/90">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Button
                      type="button"
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => setSelectedTier(tier.name)}
                      className="w-full py-3 h-11 font-semibold text-sm shadow-md"
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground font-mono mt-8">
              *All pricing options support transparent demo plan activation during evaluation. No payment required.
            </p>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24 border-t border-border/40 bg-card/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="cyan">Placement Answers</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-base">
                Everything you need to know about AI rubrics, resume privacy, and mock evaluation.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-sm hover:text-primary transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30 animate-in fade-in-50 duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CTA */}
        <section className="py-24 relative overflow-hidden border-t border-border/40">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/15 to-cyan-500/10 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative">
            <Badge variant="violet">Begin Preparation</Badge>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Turn Every Practice Session Into Progress.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Experience a realistic, AI-evaluated hiring round before facing recruitment panels.
            </p>
            <div className="pt-2">
              <Button href="/aptitude/setup" size="lg" className="h-14 px-10 text-base shadow-2xl shadow-indigo-500/30 gap-2">
                <span>Start Mock Interview</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Demo Checkout / Plan Selection Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground">Selected Plan: {selectedTier}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTier(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              You selected the <strong className="text-foreground">{selectedTier}</strong> plan. In accordance with platform design standards, payment gateways are currently in transparent simulation mode — no credit card is required.
            </p>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground font-mono space-y-1">
              <p>Status: Ready to activate</p>
              <p>Simulated billing: 0.00 INR</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setSelectedTier(null)}
              >
                Cancel
              </Button>
              <Button
                href={`/dashboard/setup-interview?plan=${selectedTier.toLowerCase().replace(" ", "_")}`}
                className="w-1/2"
                onClick={() => setSelectedTier(null)}
              >
                Activate & Practice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
