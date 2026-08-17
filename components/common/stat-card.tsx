"use client";

import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorScheme: "default" | "amber" | "sky" | "emerald" | "rose" | "purple";
  changeText?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const colorMap = {
  default: {
    iconBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    glow: "hover:border-slate-300 dark:hover:border-slate-700",
    activeGlow: "ring-2 ring-slate-400 dark:ring-slate-600 bg-slate-50/50 dark:bg-slate-900/50",
    accent: "text-slate-900 dark:text-slate-50",
  },
  amber: {
    iconBg: "bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    glow: "hover:border-amber-300 dark:hover:border-amber-800",
    activeGlow: "ring-2 ring-amber-400 dark:ring-amber-600 bg-amber-50/30 dark:bg-amber-950/20",
    accent: "text-amber-600 dark:text-amber-400",
  },
  sky: {
    iconBg: "bg-sky-100/70 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
    glow: "hover:border-sky-300 dark:hover:border-sky-800",
    activeGlow: "ring-2 ring-sky-400 dark:ring-sky-600 bg-sky-50/30 dark:bg-sky-950/20",
    accent: "text-sky-600 dark:text-sky-400",
  },
  emerald: {
    iconBg: "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    glow: "hover:border-emerald-300 dark:hover:border-emerald-800",
    activeGlow: "ring-2 ring-emerald-400 dark:ring-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    iconBg: "bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    glow: "hover:border-rose-300 dark:hover:border-rose-800",
    activeGlow: "ring-2 ring-rose-400 dark:ring-rose-600 bg-rose-50/30 dark:bg-rose-950/20",
    accent: "text-rose-600 dark:text-rose-400",
  },
  purple: {
    iconBg: "bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
    glow: "hover:border-purple-300 dark:hover:border-purple-800",
    activeGlow: "ring-2 ring-purple-400 dark:ring-purple-600 bg-purple-50/30 dark:bg-purple-950/20",
    accent: "text-purple-600 dark:text-purple-400",
  },
};

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toString());

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  colorScheme = "default",
  changeText,
  onClick,
  isActive = false,
}: StatCardProps) {
  const config = colorMap[colorScheme];

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden p-5 cursor-pointer select-none transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 border-border/80 ${
        config.glow
      } ${isActive ? config.activeGlow : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight font-serif-luxury text-foreground">
              <AnimatedNumber value={value} />
            </span>
            {changeText && (
              <span className="text-xs text-muted-foreground font-medium">
                {changeText}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-110 ${config.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Subtle bottom decorative accent */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-60 ${
          colorScheme === "emerald"
            ? "bg-emerald-500"
            : colorScheme === "amber"
            ? "bg-amber-500"
            : colorScheme === "sky"
            ? "bg-sky-500"
            : colorScheme === "rose"
            ? "bg-rose-500"
            : colorScheme === "purple"
            ? "bg-purple-500"
            : "bg-slate-400"
        }`}
      />
    </Card>
  );
}
