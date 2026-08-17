"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  stats?: {
    total: number;
    applied: number;
    screening: number;
    interviewing: number;
    offer: number;
    rejected: number;
    needsFollowUp: number;
    interviewScheduledCount: number;
  };
  onOpenAddModal?: () => void;
  className?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  stats,
  onOpenAddModal,
  className,
  isMobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard & Table",
      href: "/",
      icon: LayoutDashboard,
      badge: stats?.total ? stats.total.toString() : undefined,
    },
    {
      name: "Kanban Board",
      href: "/board",
      icon: Kanban,
      badge: stats ? (stats.applied + stats.screening + stats.interviewing).toString() : undefined,
    },
    {
      name: "Interview Calendar",
      href: "/calendar",
      icon: Calendar,
      badge: stats?.interviewScheduledCount ? `${stats.interviewScheduledCount} upcoming` : undefined,
      badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    },
    {
      name: "Analytics & Funnel",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings & Data",
      href: "/settings",
      icon: Settings,
    },
  ];

  const quickStages = [
    { name: "Applied / Pending", status: "APPLIED", count: stats?.applied ?? 0, color: "bg-slate-400" },
    { name: "Screening", status: "SCREENING", count: stats?.screening ?? 0, color: "bg-amber-500" },
    { name: "Interviewing", status: "INTERVIEWING", count: stats?.interviewing ?? 0, color: "bg-sky-500" },
    { name: "Offer Received", status: "OFFER", count: stats?.offer ?? 0, color: "bg-emerald-500" },
    { name: "Archived", status: "REJECTED", count: stats?.rejected ?? 0, color: "bg-rose-500" },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border/80 text-card-foreground select-none transition-all duration-300",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-border/60">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-800/20 transition-transform group-hover:scale-105 border border-emerald-500/30">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury font-bold text-lg tracking-tight text-foreground">
                JobTrack
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Career Pipeline Intelligence
            </p>
          </div>
        </Link>

        {/* Quick Add Action Button */}
        {onOpenAddModal && (
          <Button
            onClick={onOpenAddModal}
            variant="luxury"
            className="w-full mt-4 h-9 text-xs font-semibold gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Application
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        item.badgeColor || (isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Stage Overview */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Pipeline Stages
          </p>
          <div className="space-y-1">
            {quickStages.map((stage) => (
              <Link
                key={stage.status}
                href={`/?status=${stage.status}`}
                onClick={onNavigate}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <span>{stage.name}</span>
                </div>
                <span className="font-mono text-[11px] font-medium opacity-80">
                  {stage.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Follow Up Alerts Banner */}
        {stats && stats.needsFollowUp > 0 && (
          <div className="mx-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{stats.needsFollowUp} Action(s) Due</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-tight">
              Applications requiring recruiter follow-up today.
            </p>
            <Link
              href="/"
              onClick={onNavigate}
              className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline pt-0.5"
            >
              Review follow-ups <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Pipeline Status Footer */}
      <div className="p-4 border-t border-border/60 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-foreground">Pipeline Active</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
