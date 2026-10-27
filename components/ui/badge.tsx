import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "cyan"
  | "violet";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-primary/15 text-primary border-primary/30",
    secondary:
      "bg-secondary text-secondary-foreground border-border/40",
    outline:
      "border-border text-muted-foreground",
    success:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cyan:
      "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    violet:
      "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}