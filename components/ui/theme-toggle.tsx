"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="p-2 rounded-lg border border-border/50 bg-card/60 text-muted-foreground transition hover:text-foreground"
      >
        <span className="w-5 h-5 block" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="p-2 rounded-lg border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-200"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in fade-in" />
      ) : (
        <Moon className="w-4 h-4 text-violet-500 animate-in fade-in" />
      )}
    </button>
  );
}
