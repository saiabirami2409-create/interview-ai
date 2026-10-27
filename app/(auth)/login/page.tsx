"use client";

import * as React from "react";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthLoginForm />
    </React.Suspense>
  );
}
