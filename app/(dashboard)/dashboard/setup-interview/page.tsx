"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  Target,
  Code2,
  Users2,
  Layers,
  Clock,
  CheckCircle2,
  Sliders,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SetupInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const initialTopic = searchParams.get("topic") || searchParams.get("focus");
  const initialRole = searchParams.get("role");

  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [targetRole, setTargetRole] = React.useState(initialRole || "Full-Stack Developer");
  const [customRole, setCustomRole] = React.useState("");
  const [resumeId, setResumeId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [interviewType, setInterviewType] = React.useState(
    initialType ? initialType.toUpperCase() : "TECHNICAL"
  );
  const [difficulty, setDifficulty] = React.useState("INTERMEDIATE");
  const [questionCount, setQuestionCount] = React.useState(3);
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(20);
  const [focusArea, setFocusArea] = React.useState(initialTopic || "");

  // Available Resumes
  const [resumes, setResumes] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => {
        if (data.resumes && data.resumes.length > 0) {
          setResumes(data.resumes);
          const primary = data.resumes.find((r: any) => r.isPrimary);
          if (primary) {
            setResumeId(primary.id);
          } else {
            setResumeId(data.resumes[0].id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const roles = [
    "Full-Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Software Engineer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Product Manager",
    "Custom",
  ];

  const interviewTypes = [
    {
      id: "TECHNICAL",
      title: "Technical Round",
      desc: "Algorithms, architecture, data structures, and engineering problem solving.",
      icon: Code2,
      badge: "Core CS",
    },
    {
      id: "BEHAVIORAL",
      title: "Behavioral Round",
      desc: "STAR method scenarios, leadership, conflict handling, and teamwork.",
      icon: Users2,
      badge: "STAR Method",
    },
    {
      id: "HR",
      title: "HR & Culture Fit",
      desc: "Company motivation, career trajectory, soft skills, and role alignment.",
      icon: Briefcase,
      badge: "Culture",
    },
    {
      id: "PROJECT_BASED",
      title: "Project Defense",
      desc: "Technical deep dive into your resume projects, stack decisions, and trade-offs.",
      icon: Layers,
      badge: "Architecture",
    },
  ];

  const handleLaunch = async () => {
    setLoading(true);
    setError(null);

    const effectiveRole = targetRole === "Custom" ? customRole.trim() || "Software Engineer" : targetRole;

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: effectiveRole,
          companyName: companyName.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          interviewType,
          difficulty,
          questionCount: Number(questionCount),
          timeLimitMinutes: Number(timeLimitMinutes),
          resumeId: resumeId || undefined,
          focusArea: focusArea.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize interview");
      }

      router.push(`/dashboard/interview/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start interview");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Wizard Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interview Configuration Wizard • Step {step} of 7</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {step === 1 && "Step 1: Select Your Target Engineering Role"}
          {step === 2 && "Step 2: Resume Personalization"}
          {step === 3 && "Step 3: Company & Job Description (Optional)"}
          {step === 4 && "Step 4: Select Interview Round Type"}
          {step === 5 && "Step 5: Calibrate Round Difficulty"}
          {step === 6 && "Step 6: Session Parameters & Time Limit"}
          {step === 7 && "Step 7: Review & Launch Your Session"}
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure a realistic mock interview tailored to your upcoming placement drive.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: ROLE */}
      {step === 1 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Select Target Discipline</CardTitle>
            <CardDescription>
              Our AI synthesizes questions aligned specifically with industry benchmarks for this role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTargetRole(r)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    targetRole === r
                      ? "border-primary bg-primary/15 text-primary font-bold shadow-sm"
                      : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {targetRole === "Custom" && (
              <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-semibold text-foreground">Specify Custom Role Title</label>
                <Input
                  placeholder="e.g. Site Reliability Engineer, Blockchain Developer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setStep(2)} className="gap-2">
                <span>Continue: Resume</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: RESUME */}
      {step === 2 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Select Resume for Personalization</CardTitle>
            <CardDescription>
              We question you on your stated projects, libraries, and internships.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setResumeId(null)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  resumeId === null
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold"
                    : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Standard Role Interview (No Resume)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Practice general benchmark questions for {targetRole}
                  </p>
                </div>
                {resumeId === null && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>

              {resumes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setResumeId(r.id)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    resumeId === r.id
                      ? "border-primary bg-primary/15 text-primary font-semibold shadow-sm"
                      : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{r.fileName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {r.extractedSkills?.length || 0} skills detected
                      </p>
                    </div>
                  </div>
                  {resumeId === r.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                <span>Continue: Job Description</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: JOB DESCRIPTION */}
      {step === 3 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Paste Target Job Description (Optional)</CardTitle>
            <CardDescription>
              Simulate the exact hiring loop for an upcoming campus drive or job listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Company Name (Optional)</label>
              <Input
                placeholder="e.g. Google, Razorpay, Atlassian, Microsoft, Startup"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Job Description Text</label>
              <Textarea
                rows={5}
                placeholder="Paste the requirements, responsibilities, and qualifications from the job posting..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="gap-2">
                <span>Continue: Round Type</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: INTERVIEW TYPE */}
      {step === 4 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Select Interview Category</CardTitle>
            <CardDescription>
              Different rounds evaluate completely distinct cognitive and communication dimensions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = interviewType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/10"
                        : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-background border border-border/50">
                          {type.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{type.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={() => setStep(5)} className="gap-2">
                <span>Continue: Difficulty</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: DIFFICULTY */}
      {step === 5 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Calibrate Difficulty Level</CardTitle>
            <CardDescription>
              Adjust question complexity from entry-level foundational knowledge to system-scale trade-offs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "BEGINNER",
                  label: "Beginner / Junior",
                  desc: "Core syntax, common data structures, standard behavioral questions.",
                },
                {
                  id: "INTERMEDIATE",
                  label: "Intermediate (Recommended)",
                  desc: "Algorithmic edge cases, state management, STAR scenario questions.",
                },
                {
                  id: "ADVANCED",
                  label: "Advanced / Senior",
                  desc: "High concurrency, distributed systems, architectural defense.",
                },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    difficulty === diff.id
                      ? "border-violet-500 bg-violet-500/15 text-violet-400 font-semibold shadow-md"
                      : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                  }`}
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-foreground">{diff.label}</p>
                    <p className="text-[11px] text-muted-foreground">{diff.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button onClick={() => setStep(6)} className="gap-2">
                <span>Continue: Parameters</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: PARAMETERS */}
      {step === 6 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle className="text-lg">Configure Session Parameters</CardTitle>
            <CardDescription>
              Set question count, time limits, and optional conceptual focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setQuestionCount(num);
                      setTimeLimitMinutes(num * 7);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      questionCount === num
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                        : "border-border/60 bg-card/50 text-foreground hover:border-border"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Estimated Duration: {timeLimitMinutes} minutes</label>
              <p className="text-[11px] text-muted-foreground">
                Timer runs in the interview room to simulate realistic placement pressure.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Specific Topic Focus (Optional)</label>
              <Input
                placeholder="e.g. React Performance, SQL Indexing, Microservices"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)}>
                Back
              </Button>
              <Button onClick={() => setStep(7)} className="gap-2">
                <span>Review & Summary</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: REVIEW & LAUNCH */}
      {step === 7 && (
        <Card className="border-primary/40 bg-gradient-to-b from-card/90 to-card/60 shadow-2xl animate-in fade-in duration-200">
          <CardHeader>
            <Badge variant="cyan" className="w-fit font-mono text-[10px] mb-1">
              Configuration Ready
            </Badge>
            <CardTitle className="text-xl">Interview Setup Summary</CardTitle>
            <CardDescription>
              Review your interview parameters before generating questions and launching the room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-background/70 border border-border/50 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Target Role</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{targetRole === "Custom" ? customRole : targetRole}</p>
              </div>

              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Round Type</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{interviewType.replace("_", " ")}</p>
              </div>

              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Difficulty</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{difficulty}</p>
              </div>

              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Questions / Time</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{questionCount} Qs • {timeLimitMinutes} Mins</p>
              </div>

              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Personalized Resume</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {resumeId ? "Selected CV Active" : "General Role Questions"}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground font-mono uppercase text-[10px]">Target Company</span>
                <p className="font-semibold text-foreground mt-0.5">{companyName || "Standard Placement Benchmark"}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep(6)} disabled={loading}>
                Back to Edit
              </Button>
              <Button
                onClick={handleLaunch}
                size="lg"
                isLoading={loading}
                className="gap-2 px-8 shadow-xl shadow-indigo-500/25"
              >
                <span>Launch Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SetupInterviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      }
    >
      <SetupInterviewContent />
    </React.Suspense>
  );
}
