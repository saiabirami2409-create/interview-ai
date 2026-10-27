"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, ArrowRight, CheckCircle2, Sparkles, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Form State
  const [targetRole, setTargetRole] = React.useState("Full-Stack Developer");
  const [experienceLevel, setExperienceLevel] = React.useState("FRESHER");
  const [college, setCollege] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [graduationYear, setGraduationYear] = React.useState(2025);
  const [targetCompanies, setTargetCompanies] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([
    "TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
  ]);
  const [newSkill, setNewSkill] = React.useState("");

  const popularRoles = [
    "Full-Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Software Engineer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
  ];

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const navigateNext = () => {
    const type = searchParams.get("type");
    const topic = searchParams.get("topic");
    if (type) {
      const q = new URLSearchParams();
      q.set("type", type);
      if (topic) q.set("topic", topic);
      router.push(`/dashboard/setup-interview?${q.toString()}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          college: college || "College of Engineering",
          degree: degree || "B.Tech Computer Science",
          graduationYear: Number(graduationYear) || 2025,
          targetCompanies: targetCompanies || "Top Tech Companies",
          skills,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      navigateNext();
    } catch (err) {
      console.error(err);
      navigateNext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/15 to-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Progress header */}
      <div className="w-full max-w-lg mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Placement Profile Setup • Step {step} of 3</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {step === 1 && "What is your primary target role?"}
          {step === 2 && "Academic Details & Placement Timelines"}
          {step === 3 && "Core Technical Skills & Target Companies"}
        </h1>
        <p className="text-xs text-muted-foreground">
          This grounds your AI mock interview questions in your real academic goals.
        </p>

        {/* Progress indicator */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Card */}
      <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card/75 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Select Target Role</label>
              <div className="grid grid-cols-2 gap-2.5">
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      targetRole === role
                        ? "border-primary bg-primary/15 text-primary font-semibold shadow-sm"
                        : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Experience Stage</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "FRESHER", label: "Fresher (College/Grad)" },
                  { id: "INTERMEDIATE", label: "Junior (1-2 yrs)" },
                  { id: "EXPERIENCED", label: "Experienced (3+ yrs)" },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperienceLevel(exp.id)}
                    className={`p-2.5 rounded-xl border text-[11px] font-medium text-center transition-all ${
                      experienceLevel === exp.id
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold"
                        : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full gap-2 mt-4">
              <span>Next: Academic Details</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">College / University Name</label>
              <Input
                placeholder="e.g. National Institute of Technology, IIT, BITS"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Degree / Major</label>
              <Input
                placeholder="e.g. B.Tech Computer Science, B.S. Software Eng"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Expected Graduation Year</label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="flex h-11 w-full rounded-xl border border-border/70 bg-card/50 px-3.5 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr} className="bg-card text-foreground">
                    Class of {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="w-2/3 gap-2">
                <span>Next: Skills</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Your Technical Skills</label>
              <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-2xl bg-card/50 border border-border/60">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-medium border border-primary/25"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add skill (e.g. Docker, Python, Redis)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="md" onClick={handleAddSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Dream Companies (Optional)</label>
              <Input
                placeholder="e.g. Google, Amazon, Microsoft, Uber, Razorpay"
                value={targetCompanies}
                onChange={(e) => setTargetCompanies(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="w-1/3">
                Back
              </Button>
              <Button onClick={handleFinish} className="w-2/3 gap-2" isLoading={loading}>
                <span>Launch My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OnboardingWizard />
    </React.Suspense>
  );
}
