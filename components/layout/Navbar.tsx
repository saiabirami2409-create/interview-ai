"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Menu, X, ArrowRight, Bot, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InterviewAILogo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<any | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { label: "MCQ Practice", href: "/practice" },
    { label: "AI Coach", href: "/chat" },
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ];

  const brandHref = user ? "/home" : "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={brandHref}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          <InterviewAILogo size="md" showWordmark />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            href="/chat"
            variant="outline"
            size="sm"
            className="gap-1.5 border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500 shadow-xs"
          >
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span>AI Chatbot</span>
          </Button>

          <ThemeToggle />
          {user ? (
            <>
              <Button href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button href="/aptitude/setup" variant="default" size="sm" className="gap-1.5 shadow-md shadow-indigo-500/25">
                <span>Start Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button href="/aptitude/setup" variant="default" size="sm" className="gap-1.5 shadow-md shadow-indigo-500/25">
                <span>Start Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/login" variant="ghost" size="sm">
                Sign In
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/60 bg-card/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  pathname === link.href
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
            <Button
              href="/chat"
              variant="outline"
              className="w-full justify-center gap-2 border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Bot className="w-4 h-4 text-purple-500" />
              <span>Chat with AI Coach</span>
            </Button>

            {user ? (
              <>
                <Button
                  href="/dashboard"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Button>
                <Button
                  href="/aptitude/setup"
                  variant="default"
                  className="w-full justify-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 text-destructive"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  href="/aptitude/setup"
                  variant="default"
                  className="w-full justify-center gap-2 shadow-md shadow-indigo-500/25"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  href="/login"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
