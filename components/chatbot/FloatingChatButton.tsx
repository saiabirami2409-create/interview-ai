"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Bot, MessageSquare } from "lucide-react";

function FloatingChatButtonContent() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [showCallout, setShowCallout] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid SSR mismatch and hide the floating button if already on the dedicated chat page
  if (!mounted || pathname === "/chat") {
    return null;
  }

  return (
    <aside
      aria-label="AI Interview Coach Assistant"
      className="fixed bottom-6 right-6 z-[9999] print:hidden"
    >
      {/* Friendly Speech Bubble / Callout */}
      {showCallout && (
        <div className="absolute -top-12 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-card/95 text-white border border-purple-500/40 text-[11px] font-medium shadow-xl backdrop-blur-md animate-bounce pointer-events-none whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span>Chat with AI Coach</span>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900/90 dark:bg-card/95 border-r border-b border-purple-500/40 rotate-45" />
        </div>
      )}

      <Link
        href="/chat"
        aria-label="Chat with AI"
        onMouseEnter={() => setShowCallout(false)}
        className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-purple-700 via-violet-600 to-blue-600 hover:from-purple-600 hover:to-blue-500 text-white shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/50 border-2 border-white/25 cursor-pointer"
      >
        {/* Pulsing Online Indicator Dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
        </span>

        {/* AI Icon with subtle glow */}
        <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:rotate-12 transition-transform shadow-inner">
          <Bot className="w-5 h-5 text-white" />
          <Sparkles className="w-3 h-3 text-cyan-300 absolute -top-0.5 -right-0.5 animate-pulse" />
        </div>

        {/* Text Label - Visible across devices with rich typography */}
        <div className="flex flex-col text-left">
          <span className="text-xs sm:text-sm font-extrabold tracking-wide text-white leading-tight flex items-center gap-1">
            <span>Chat with AI</span>
          </span>
          <span className="text-[10px] text-purple-200 font-medium leading-none">
            24/7 Interview Coach
          </span>
        </div>

        {/* Accessible label for screen readers */}
        <span className="sr-only">Chat with AI</span>
      </Link>
    </aside>
  );
}

export function FloatingChatButton() {
  return (
    <React.Suspense fallback={null}>
      <FloatingChatButtonContent />
    </React.Suspense>
  );
}
