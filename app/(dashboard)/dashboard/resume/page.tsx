"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, Trash2, Star, Plus, X, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ResumeItem {
  id: string;
  fileName: string;
  fileSize: number;
  isPrimary: boolean;
  extractedSkills: string[];
  createdAt: string;
}

export default function ResumePage() {
  const [resumes, setResumes] = React.useState<ResumeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (data.resumes) {
        setResumes(data.resumes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit. Please upload a smaller PDF or DOCX file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      await fetchResumes();
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const res = await fetch(`/api/resume?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setResumes(resumes.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch("/api/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setResumes(
          resumes.map((r) => ({
            ...r,
            isPrimary: r.id === id,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Resume Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload and manage your CVs for automated skill extraction and tailored interview questions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border/70 hover:border-primary/50 bg-card/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUpload(e.target.files[0]);
                }
              }}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {uploading ? "Analyzing & Extracting Skills..." : "Upload Your Resume"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
              Drag and drop your PDF or DOCX file here, or browse from your computer. Max file size: 5MB.
            </p>

            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploading}
                size="md"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Select Resume File</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>Uploaded Resumes ({resumes.length})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            <div className="h-24 w-full bg-muted/40 rounded-2xl skeleton-shimmer" />
            <div className="h-24 w-full bg-muted/40 rounded-2xl skeleton-shimmer" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/60 bg-card/40 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">No resumes uploaded yet</p>
            <p className="text-xs text-muted-foreground">
              Upload your resume above to ground your AI mock interview questions in your real projects and background.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{resume.fileName}</h4>
                          {resume.isPrimary && (
                            <Badge variant="cyan" className="font-mono text-[10px]">
                              Primary Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFileSize(resume.fileSize)} • Uploaded on {formatDate(resume.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!resume.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(resume.id)}
                          className="text-xs gap-1"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>Make Primary</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(resume.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Extracted Skills Preview */}
                  {resume.extractedSkills && resume.extractedSkills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Extracted Skills ({resume.extractedSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.extractedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-lg bg-card border border-border/60 text-xs text-foreground/80 font-mono"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
