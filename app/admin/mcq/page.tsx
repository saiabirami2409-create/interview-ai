"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  RotateCcw,
  Check,
  Edit3,
  Layers,
  ArrowLeft,
  ExternalLink,
  Filter,
  Eye,
  Archive,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface QuestionReportItem {
  id: string;
  questionId: string;
  reason: string;
  userNotes: string;
  suggestedCorrection?: string | null;
  status: "PENDING_REVIEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  adminNotes?: string | null;
  reviewedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  question: {
    id: string;
    topic: string;
    subtopic?: string | null;
    difficulty: string;
    question: string;
    codeSnippet?: string | null;
    language?: string | null;
    languageVersion?: string | null;
    isVersionDependent: boolean;
    versionWarning?: string | null;
    options: string;
    correctOptionIndex: number;
    explanation: string;
    optionExplanations: string;
    referenceTitle?: string | null;
    referenceUrl?: string | null;
    status: string;
  };
}

export default function AdminMcqReportsPage() {
  const [reports, setReports] = React.useState<QuestionReportItem[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | "PENDING_REVIEW" | "RESOLVED">("PENDING_REVIEW");

  // Edit / Review Modal state
  const [selectedReport, setSelectedReport] = React.useState<QuestionReportItem | null>(null);
  const [editQuestionText, setEditQuestionText] = React.useState("");
  const [editCodeSnippet, setEditCodeSnippet] = React.useState("");
  const [editLanguageVersion, setEditLanguageVersion] = React.useState("");
  const [editIsVersionDep, setEditIsVersionDep] = React.useState(false);
  const [editVersionWarning, setEditVersionWarning] = React.useState("");
  const [editOptions, setEditOptions] = React.useState<string[]>(["", "", "", ""]);
  const [editCorrectIdx, setEditCorrectIdx] = React.useState(0);
  const [editExplanation, setEditExplanation] = React.useState("");
  const [editOptionExplanations, setEditOptionExplanations] = React.useState<Record<string, string>>({});
  const [editRefTitle, setEditRefTitle] = React.useState("");
  const [editRefUrl, setEditRefUrl] = React.useState("");
  const [adminNotes, setAdminNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Fetch reports on mount
  const fetchReports = () => {
    setLoading(true);
    fetch("/api/admin/mcq/reports")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReports(json.data.reports || []);
          setStats(json.data.stats || null);
        }
      })
      .catch((err) => console.error("Error fetching reports:", err))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchReports();
  }, []);

  // Open Edit Modal
  const handleOpenReviewModal = (report: QuestionReportItem) => {
    setSelectedReport(report);
    const q = report.question;
    setEditQuestionText(q.question);
    setEditCodeSnippet(q.codeSnippet || "");
    setEditLanguageVersion(q.languageVersion || "");
    setEditIsVersionDep(Boolean(q.isVersionDependent));
    setEditVersionWarning(q.versionWarning || "");

    try {
      const opts = JSON.parse(q.options || "[]");
      setEditOptions(opts.length === 4 ? opts : ["", "", "", ""]);
    } catch {
      setEditOptions(["", "", "", ""]);
    }

    setEditCorrectIdx(q.correctOptionIndex);
    setEditExplanation(q.explanation);

    try {
      setEditOptionExplanations(JSON.parse(q.optionExplanations || "{}"));
    } catch {
      setEditOptionExplanations({});
    }

    setEditRefTitle(q.referenceTitle || "");
    setEditRefUrl(q.referenceUrl || "");
    setAdminNotes(report.adminNotes || "");
  };

  // Submit Correction / Resolution
  const handleSaveResolution = async (action: "RESOLVED" | "DISMISSED") => {
    if (!selectedReport) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mcq/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          questionId: selectedReport.questionId,
          questionText: editQuestionText,
          codeSnippet: editCodeSnippet,
          languageVersion: editLanguageVersion,
          isVersionDependent: editIsVersionDep,
          versionWarning: editVersionWarning,
          options: editOptions,
          correctOptionIndex: editCorrectIdx,
          explanation: editExplanation,
          optionExplanations: editOptionExplanations,
          referenceTitle: editRefTitle,
          referenceUrl: editRefUrl,
          status: "ACTIVE",
          adminNotes,
          resolutionAction: action,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert(`Question updated and report marked as ${action}!`);
        setSelectedReport(null);
        fetchReports();
      } else {
        alert(json.error?.message || "Failed to save resolution.");
      }
    } catch {
      alert("Error saving review.");
    } finally {
      setSaving(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-purple-600 dark:text-purple-400 font-bold">Admin Hub</span>
              <span>•</span>
              <span>Question Bank Curation & Flaw Resolution</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Practice</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Curated Bank Quality Assurance Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Question Bank Review & Correction Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Review reported flaws from candidates, inspect factual correctness, update compiler/runtime version notes, and resolve questions before returning them to the live quiz bank.
          </p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Reviewed Bank
              </span>
              <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {stats.totalQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active in Quizzes
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {stats.activeQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pending Reports
              </span>
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {stats.pendingReports}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Resolved & Verified
              </span>
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {stats.resolvedReports}
              </span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {(
            [
              { id: "PENDING_REVIEW", label: `Pending Review (${stats?.pendingReports ?? 0})` },
              { id: "RESOLVED", label: "Resolved" },
              { id: "ALL", label: "All Reports" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === t.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Reports Table / List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            Loading reports and question definitions...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold">No Reports in this category</h3>
            <p className="text-xs text-slate-400">All questions in the active bank are verified and clear.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {report.question.topic} • {report.question.subtopic}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        report.status === "PENDING_REVIEW"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      Issue: {report.reason}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Reported on {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {report.question.question}
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">User Feedback:</span>
                    &ldquo;{report.userNotes}&rdquo;
                    {report.suggestedCorrection && (
                      <span className="block mt-1 text-purple-600 dark:text-purple-400">
                        Suggested Fix: {report.suggestedCorrection}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleOpenReviewModal(report)}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Review & Correct Question</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* REVIEW & CORRECTION MODAL */}
      {/* ========================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Review & Correct Question #{selectedReport.questionId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Feedback Callout */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold block">User Report Reason: {selectedReport.reason}</span>
              <p>&ldquo;{selectedReport.userNotes}&rdquo;</p>
              {selectedReport.suggestedCorrection && (
                <p className="text-purple-700 dark:text-purple-300 font-semibold pt-1">
                  Suggested Fix: {selectedReport.suggestedCorrection}
                </p>
              )}
            </div>

            {/* Editable Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-sans"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">
                  Code Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editCodeSnippet}
                  onChange={(e) => setEditCodeSnippet(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-slate-400 block mb-1">
                    Language & Runtime Version
                  </label>
                  <input
                    type="text"
                    value={editLanguageVersion}
                    onChange={(e) => setEditLanguageVersion(e.target.value)}
                    placeholder="e.g. Python 3.11+, PostgreSQL 16"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400 block mb-1">
                    Version Dependency
                  </label>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsVersionDep}
                      onChange={(e) => setEditIsVersionDep(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Flags version-dependent behavior (not universal)</span>
                  </label>
                </div>
              </div>

              {editIsVersionDep && (
                <div>
                  <label className="font-bold uppercase text-slate-400 block mb-1">
                    Version Nuance / Warning Caveat
                  </label>
                  <input
                    type="text"
                    value={editVersionWarning}
                    onChange={(e) => setEditVersionWarning(e.target.value)}
                    placeholder="e.g., In Python 3.7+ order is guaranteed, but earlier versions differed..."
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                <label className="font-bold uppercase text-slate-400 block">
                  Options & Correct Answer Selection
                </label>
                {(["Option A", "Option B", "Option C", "Option D"] as const).map((label, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={editCorrectIdx === idx}
                      onChange={() => setEditCorrectIdx(idx)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={editOptions[idx] || ""}
                      onChange={(e) => {
                        const newOpts = [...editOptions];
                        newOpts[idx] = e.target.value;
                        setEditOptions(newOpts);
                      }}
                      placeholder={label}
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>
                ))}
              </div>

              {/* Explanations */}
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">
                  Overall Verified Explanation
                </label>
                <textarea
                  rows={3}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* References */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-slate-400 block mb-1">
                    Reference Title (e.g. Official Docs / RFC)
                  </label>
                  <input
                    type="text"
                    value={editRefTitle}
                    onChange={(e) => setEditRefTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-400 block mb-1">
                    Reference Documentation URL
                  </label>
                  <input
                    type="url"
                    value={editRefUrl}
                    onChange={(e) => setEditRefUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">
                  Admin Review Notes (Resolution Rationale)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Clarified option wording against official Python documentation."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveResolution("DISMISSED")}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Dismiss Report
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveResolution("RESOLVED")}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Apply Fix & Mark Resolved"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12">
        © 2026 InterviewAI • Verified Accurate Technical Interview Preparation.
      </footer>
    </div>
  );
}
