"use client";

import * as React from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        <React.Suspense fallback={<div className="w-64 h-full bg-card/60" />}>
          <DashboardSidebar />
        </React.Suspense>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full bg-card shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <React.Suspense fallback={<div className="w-64 h-full bg-card" />}>
              <DashboardSidebar onClose={() => setMobileMenuOpen(false)} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <React.Suspense fallback={<div className="h-16 border-b border-border/40" />}>
          <DashboardHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        </React.Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <React.Suspense fallback={<div className="space-y-4"><div className="h-12 w-48 bg-muted/40 rounded-xl" /></div>}>
            {children}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
