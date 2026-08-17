"use client";

import * as React from "react";
import {
  Bell,
  Briefcase,
  Command as CommandIcon,
  Menu,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { ApplicationStats } from "@/lib/types";

interface HeaderProps {
  stats?: ApplicationStats;
  onOpenAddModal: () => void;
  onOpenCommandPalette: () => void;
}

export function Header({
  stats,
  onOpenAddModal,
  onOpenCommandPalette,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-4 sm:px-6 backdrop-blur-md transition-all">
      {/* Left: Mobile Nav & Search Bar */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="iconSm" className="rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar
              stats={stats}
              onOpenAddModal={() => {
                setMobileMenuOpen(false);
                onOpenAddModal();
              }}
              onNavigate={() => setMobileMenuOpen(false)}
              isMobile
            />
          </SheetContent>
        </Sheet>

        {/* Global Search / Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex h-9 w-64 sm:w-80 items-center justify-between rounded-xl border border-border/80 bg-card/60 px-3 text-xs text-muted-foreground shadow-xs hover:border-primary/50 hover:bg-card transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search or type a command...</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-secondary/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Follow-up / Alerts Notification Pill */}
        {stats && stats.needsFollowUp > 0 && (
          <div
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition-colors"
            title={`${stats.needsFollowUp} application follow-ups need attention`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>{stats.needsFollowUp} Action(s) Due</span>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Add Application Button */}
        <Button
          onClick={onOpenAddModal}
          variant="luxury"
          size="sm"
          className="gap-1.5 h-9 px-3 sm:px-4 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Application</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
}
