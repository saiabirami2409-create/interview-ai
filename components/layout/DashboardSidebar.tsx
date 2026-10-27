"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BarChart3,
  FileText,
  BookOpen,
  User,
  Settings,
  LogOut,
  Bot,
  ChevronRight,
  ShieldCheck,
  Video,
  Calculator,
  Layers,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InterviewAILogo } from "@/components/ui/logo";

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = React.useState("Aarya Kumar");
  const [userEmail, setUserEmail] = React.useState("aarya.kumar@example.com");
  const [userRole, setUserRole] = React.useState("Full-Stack Developer");

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserName(data.user.name);
          setUserEmail(data.user.email);
          if (data.user.profile?.targetRole) {
            setUserRole(data.user.profile.targetRole);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Aptitude Round", href: "/aptitude/setup", icon: Calculator, badge: "R1" },
    { label: "Technical Round", href: "/technical/setup", icon: Code2, badge: "R2" },
    { label: "Project Interview", href: "/project/setup", icon: Layers, badge: "R3" },
    { label: "Behavioral Round", href: "/behavioral/setup", icon: ShieldCheck, badge: "R4" },
    { label: "HR Round", href: "/hr/setup", icon: User, badge: "R5" },
    { label: "AI Chatbot", href: "/chatbot", icon: Bot, badge: "AI" },
    { label: "Performance Report", href: "/report", icon: BarChart3 },
    { label: "HR Recordings", href: "/hr/recordings", icon: Video, badge: "REC" },
    { label: "Interview History", href: "/history", icon: History },
  ];

  const secondaryNav = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border/50 bg-card/60 backdrop-blur-xl flex flex-col justify-between h-full select-none">
      {/* Brand & Top */}
      <div>
        <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between">
          <Link href="/home" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <InterviewAILogo size="sm" showWordmark />
          </Link>
        </div>

        {/* User Card Pill */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-card border border-border/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
            <Badge variant="cyan" className="text-[9px] font-mono py-0 px-2">
              {userRole}
            </Badge>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-semibold">
            Preparation Loop
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-500/25 ring-1 ring-white/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className={cn("truncate", isActive ? "text-white font-semibold" : "")}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ml-1.5 font-semibold",
                      isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-3 mt-6 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-semibold">
            Account & Preferences
          </p>
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-500/25 ring-1 ring-white/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className={cn(isActive ? "text-white font-semibold" : "")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Sign Out */}
      <div className="p-3 border-t border-border/40">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
