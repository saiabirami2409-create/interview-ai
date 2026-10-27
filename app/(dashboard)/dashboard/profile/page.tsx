"use client";

import * as React from "react";
import { User, School, Briefcase, Sparkles, CheckCircle2, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("Full-Stack Developer");
  const [experienceLevel, setExperienceLevel] = React.useState("FRESHER");
  const [college, setCollege] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [graduationYear, setGraduationYear] = React.useState(2025);
  const [targetCompanies, setTargetCompanies] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [newSkill, setNewSkill] = React.useState("");

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          if (data.user.profile) {
            setTargetRole(data.user.profile.targetRole || "Full-Stack Developer");
            setExperienceLevel(data.user.profile.experienceLevel || "FRESHER");
            setCollege(data.user.profile.college || "");
            setDegree(data.user.profile.degree || "");
            setGraduationYear(data.user.profile.graduationYear || 2025);
            setTargetCompanies(data.user.profile.targetCompanies || "");
            setBio(data.user.profile.bio || "");
            if (data.user.profile.skills) {
              setSkills(data.user.profile.skills.map((s: any) => s.skillName));
            }
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          college,
          degree,
          graduationYear: Number(graduationYear),
          targetCompanies,
          bio,
          skills,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile changes");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-48 bg-muted/60 rounded-xl skeleton-shimmer" />
        <div className="h-64 w-full bg-muted/40 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Student Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your academic credentials, target roles, and core technical skills.
          </p>
        </div>
        <Badge variant="cyan" className="font-mono text-xs w-fit">
          Verified Student Account
        </Badge>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <User className="w-4 h-4" />
              <span>Identity & Contact</span>
            </div>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <Input value={name} disabled className="opacity-80" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input value={email} disabled className="opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
              <School className="w-4 h-4" />
              <span>Placement & Education</span>
            </div>
            <CardTitle className="text-lg">Academic Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">College / University</label>
                <Input
                  placeholder="e.g. National Institute of Technology"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Degree & Branch</label>
                <Input
                  placeholder="e.g. B.Tech Computer Science"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Graduation Year</label>
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="flex h-11 w-full rounded-xl border border-border/70 bg-card/50 px-3.5 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[2023, 2024, 2025, 2026, 2027, 2028].map((yr) => (
                    <option key={yr} value={yr} className="bg-card text-foreground">
                      Class of {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Experience Stage</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border/70 bg-card/50 px-3.5 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FRESHER" className="bg-card text-foreground">Fresher (Campus Placements)</option>
                  <option value="INTERMEDIATE" className="bg-card text-foreground">Junior (1-2 years experience)</option>
                  <option value="EXPERIENCED" className="bg-card text-foreground">Experienced (3+ years)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Role & Skills */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <Briefcase className="w-4 h-4" />
              <span>Hiring Targets</span>
            </div>
            <CardTitle className="text-lg">Career Aspirations & Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Preferred Target Role</label>
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Developer, Backend Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Dream Target Companies</label>
                <Input
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Razorpay, Atlassian"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground">Core Technical Skills</label>
              <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-2xl bg-card/50 border border-border/60">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/15 text-primary text-xs font-medium border border-primary/25"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add skill (e.g. Docker, GraphQL, Kubernetes)..."
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

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">Candidate Bio / Background</label>
              <Textarea
                rows={3}
                placeholder="Brief summary of your academic projects and career objectives..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" isLoading={saving} className="px-8">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
