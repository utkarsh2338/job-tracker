import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { ApplicationStatus, Priority, WorkType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, pattern: string = "MMM d, yyyy"): string {
  if (!date) return "—";
  try {
    return format(new Date(date), pattern);
  } catch {
    return "—";
  }
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function formatSalary(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = "USD"
): string {
  if (!min && !max) return "—";
  if (min && !max) return `From ${formatSalary(min, currency)}`;
  if (!min && max) return `Up to ${formatSalary(max, currency)}`;
  if (min === max) return formatSalary(min, currency);
  return `${formatSalary(min, currency)} – ${formatSalary(max, currency)}`;
}

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  APPLIED: {
    label: "Applied",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
    bgLight: "bg-slate-50 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
  SCREENING: {
    label: "Screening",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
    bgLight: "bg-amber-50/50 dark:bg-amber-950/20",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300 dark:border-amber-800",
  },
  INTERVIEWING: {
    label: "Interviewing",
    badgeClass: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
    dotClass: "bg-sky-500",
    bgLight: "bg-sky-50/50 dark:bg-sky-950/20",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-300 dark:border-sky-800",
  },
  OFFER: {
    label: "Offer / Accepted",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
    bgLight: "bg-emerald-50/50 dark:bg-emerald-950/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300 dark:border-emerald-800",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
    bgLight: "bg-rose-50/50 dark:bg-rose-950/20",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-300 dark:border-rose-800",
  },
  ARCHIVED: {
    label: "Archived",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    dotClass: "bg-zinc-400",
    bgLight: "bg-zinc-50 dark:bg-zinc-900/30",
    textColor: "text-zinc-500 dark:text-zinc-400",
    borderColor: "border-zinc-300 dark:border-zinc-700",
  },
};

export const WORK_TYPE_CONFIG: Record<WorkType, { label: string; icon: string }> = {
  REMOTE: { label: "Remote", icon: "Globe" },
  HYBRID: { label: "Hybrid", icon: "Building2" },
  ONSITE: { label: "On-site", icon: "MapPin" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string }> = {
  LOW: { label: "Low", badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  MEDIUM: { label: "Medium", badgeClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  HIGH: { label: "High", badgeClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  DREAM: { label: "Dream Job", badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700" },
};

export function getCompanyLogoUrl(company: string, customLogoUrl?: string | null): string {
  if (customLogoUrl && customLogoUrl.trim() !== "") {
    return customLogoUrl;
  }
  // Sanitize company name to infer likely domain
  const clean = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  
  if (!clean) return "";
  
  const knownDomains: Record<string, string> = {
    google: "google.com",
    stripe: "stripe.com",
    vercel: "vercel.com",
    linear: "linear.app",
    figma: "figma.com",
    airbnb: "airbnb.com",
    anthropic: "anthropic.com",
    openai: "openai.com",
    shopify: "shopify.com",
    meta: "meta.com",
    apple: "apple.com",
    microsoft: "microsoft.com",
    amazon: "amazon.com",
    netflix: "netflix.com",
    spotify: "spotify.com",
    github: "github.com",
    gitlab: "gitlab.com",
    notion: "notion.so",
    slack: "slack.com",
    discord: "discord.com",
    uber: "uber.com",
    doordash: "doordash.com",
    coinbase: "coinbase.com",
  };

  const domain = knownDomains[clean] || `${clean}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function isFollowUpOverdue(followUpDate: string | Date | null | undefined): boolean {
  if (!followUpDate) return false;
  try {
    const d = new Date(followUpDate);
    return isPast(d) || isToday(d);
  } catch {
    return false;
  }
}
