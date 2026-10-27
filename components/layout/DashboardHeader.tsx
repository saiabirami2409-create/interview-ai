"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path.includes("/setup-interview")) return "Configure New Interview";
    if (path.includes("/interview/")) return "Interview Practice Room";
    if (path.includes("/report/")) return "Performance Evaluation Report";
    if (path.includes("/history")) return "Interview History & Archive";
    if (path.includes("/analytics")) return "Competency & Longitudinal Analytics";
    if (path.includes("/resume")) return "Resume Center & Skill Extraction";
    if (path.includes("/topics")) return "Weak Topics & Targeted Drills";
    if (path.includes("/profile")) return "Student Profile Settings";
    if (path.includes("/settings")) return "Platform & Account Settings";
    return "Placement Preparation Dashboard";
  };

  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono hidden sm:block">
            InterviewAI Technical Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <Button href="/aptitude/setup" size="sm" className="gap-1.5 shadow-md shadow-indigo-500/20 text-xs">
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Start Mock Interview</span>
          <span className="sm:hidden">Start</span>
        </Button>
      </div>
    </header>
  );
}
