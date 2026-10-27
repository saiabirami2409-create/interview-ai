"use client";

import * as React from "react";
import { Settings, Shield, Bell, Moon, Sun, Trash2, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = React.useState(true);
  const [dataPurged, setDataPurged] = React.useState(false);

  const handlePurgeHistory = () => {
    if (confirm("Are you sure you want to clear your local interview session drafts?")) {
      localStorage.clear();
      setDataPurged(true);
      setTimeout(() => setDataPurged(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Settings & Privacy
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure appearance, notifications, data sovereignty, and security preferences.
          </p>
        </div>
      </div>

      {dataPurged && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Local session drafts purged successfully!</span>
        </div>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Moon className="w-4 h-4" />
            <span>Visual Experience</span>
          </div>
          <CardTitle className="text-lg">Appearance & Theme</CardTitle>
          <CardDescription>
            Choose between dark mode or warm neutral light mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              theme === "dark"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-md shadow-primary/10"
                : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
            }`}
          >
            <Moon className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-sm font-semibold">Midnight Dark</p>
              <p className="text-[11px] text-muted-foreground">Default AI SaaS theme</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              theme === "light"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-md shadow-primary/10"
                : "border-border/60 bg-card/50 text-foreground/80 hover:border-border"
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold">Clean Light</p>
              <p className="text-[11px] text-muted-foreground">High-contrast daytime view</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
            <Bell className="w-4 h-4" />
            <span>Communications</span>
          </div>
          <CardTitle className="text-lg">Interview Notifications</CardTitle>
          <CardDescription>
            Manage notifications for completed evaluations and score reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-card/50 border border-border/50">
            <div>
              <p className="text-xs font-semibold text-foreground">Score Report Email Summaries</p>
              <p className="text-[11px] text-muted-foreground">
                Receive 5-axis competency breakdown after completing interview sessions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                emailAlerts ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform absolute top-1 ${
                  emailAlerts ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Sovereignty */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Shield className="w-4 h-4" />
            <span>Data Sovereignty</span>
          </div>
          <CardTitle className="text-lg">Privacy & Resume Controls</CardTitle>
          <CardDescription>
            You possess full rights to inspect, download, or permanently purge your mock interview history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Clear Local Drafts & Caches</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Purges autosaved answer drafts and cached question payloads from browser storage.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePurgeHistory} className="gap-1.5 shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Purge Drafts</span>
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Delete Account & Erase All Records</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Permanently deletes your student profile, uploaded resumes, transcripts, and evaluation history.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => alert("To delete your account permanently, please contact privacy@converza.platform or confirm via registered email.")}
              className="shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
