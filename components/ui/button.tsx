"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "glow";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      children,
      disabled,
      href,
      type = "button",
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer select-none";

    const variants = {
      default:
        "bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 border border-white/10",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50",
      outline:
        "border border-border/70 bg-card/60 backdrop-blur-md text-foreground hover:bg-muted/50 hover:border-border",
      ghost: "text-foreground/80 hover:text-foreground hover:bg-muted/50",
      danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20",
      glow:
        "bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    const loadingSpinner = isLoading && (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

    // If an href is supplied, render as a Next.js Link for semantic navigation and to avoid invalid <a href><button> nesting
    if (href) {
      return (
        <Link
          href={href}
          className={cn(combinedClassName, (disabled || isLoading) && "opacity-50 pointer-events-none")}
          onClick={
            onClick || disabled || isLoading
              ? (e) => {
                  if (disabled || isLoading) {
                    e.preventDefault();
                    return;
                  }
                  if (onClick) {
                    (onClick as any)(e);
                  }
                }
              : undefined
          }
          {...(props as any)}
        >
          {loadingSpinner}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={disabled || isLoading}
        onClick={onClick}
        {...props}
      >
        {loadingSpinner}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
