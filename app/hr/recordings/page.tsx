"use client";

import * as React from "react";
import Link from "next/link";
import {
  Video,
  Play,
  Download,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  FileText,
  AlertCircle,
  PlusCircle,
  X,
  Sparkles,
  Volume2,
  Maximize2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HrRecordingItem {
  id: string;
  title: string;
  jobRole?: string | null;
  duration: number;
  fileSize: number;
  mediaType: string;
  status: string;
  createdAt: string;
  hrSessionId?: string | null;
  session?: {
    id: string;
    title: string;
    targetRole: string;
    companyName?: string | null;
  } | null;
}

export default function HrRecordingsPage() {
  const [recordings, setRecordings] = React.useState<HrRecordingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRecording, setSelectedRecording] = React.useState<HrRecordingItem | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(1);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const videoElementRef = React.useRef<HTMLVideoElement | null>(null);

  const fetchRecordings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/recordings");
      const json = await res.json();
      if (json.success && json.data) {
        setRecordings(json.data.recordings || []);
      }
    } catch (err) {
      console.error("Failed to fetch HR recordings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Handle Playback Speed
  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = speed;
    }
  };

  // Delete Recording
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this HR recording? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/hr/recordings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecordings((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecording?.id === id) {
          setSelectedRecording(null);
        }
      } else {
        alert(data.error || "Failed to delete recording");
      }
    } catch (err: any) {
      alert("Error deleting recording: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
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
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">
              HR Interview Recordings
            </span>
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

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
              <Video className="w-3.5 h-3.5" />
              <span>HR Video Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My HR Interview Recordings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review your recorded HR interviews and improve your interview performance.
            </p>
          </div>

          <Link
            href="/hr/setup"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Practice HR Round</span>
          </Link>
        </div>

        {/* Content Body: Loading / Empty / Grid */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500">Loading interview recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No HR interview recordings yet.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Practice and record your HR interview to review your body language, eye contact, and communication skills.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/hr/setup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start HR Interview</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                {/* Card Thumbnail / Preview Header */}
                <div
                  onClick={() => setSelectedRecording(recording)}
                  className="relative aspect-video bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center cursor-pointer group/thumb"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600/80 group-hover/thumb:bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-slate-950/80 border-slate-700 text-slate-300">
                      {recording.jobRole || "HR Interview"}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>{formatDuration(recording.duration)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {recording.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDate(recording.createdAt)}</span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {formatFileSize(recording.fileSize)}
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0">
                      {recording.status}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => setSelectedRecording(recording)}
                        className="text-xs h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Play</span>
                      </Button>

                      <a
                        href={`/api/hr/recordings/${recording.id}/download`}
                        download
                        className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                        title="Download Video File"
                      >
                        <Download className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(recording.id, e)}
                        disabled={deletingId === recording.id}
                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                        title="Delete Recording"
                      >
                        {deletingId === recording.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {recording.hrSessionId && (
                      <Link
                        href={`/hr/results?sessionId=${recording.hrSessionId}`}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Report</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* HTML5 Video Player Modal */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {selectedRecording.title}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedRecording.jobRole} • {formatDuration(selectedRecording.duration)} • {formatFileSize(selectedRecording.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/hr/recordings/${selectedRecording.id}/download`}
                  download
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download className="w-3 h-3 text-purple-400" />
                  <span>Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedRecording(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoElementRef}
                src={`/api/hr/recordings/${selectedRecording.id}`}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Playback Controls Footer */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Speed:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSetSpeed(rate)}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-all ${
                      playbackSpeed === rate
                        ? "bg-purple-600 text-white font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {selectedRecording.hrSessionId && (
                  <Link
                    href={`/hr/results?sessionId=${selectedRecording.hrSessionId}`}
                    className="px-3 py-1 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Evaluation Report</span>
                  </Link>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecording(null)}
                  className="text-xs h-7 border-slate-700 text-slate-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
