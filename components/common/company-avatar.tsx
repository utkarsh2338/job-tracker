"use client";

import * as React from "react";
import { getCompanyLogoUrl } from "@/lib/utils";
import { Briefcase } from "lucide-react";

interface CompanyAvatarProps {
  company: string;
  customLogoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs rounded-lg",
  md: "w-9 h-9 text-sm rounded-xl",
  lg: "w-12 h-12 text-base rounded-2xl",
  xl: "w-16 h-16 text-xl rounded-2xl",
};

const iconSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

// Curated pastel/gradient backgrounds based on company name
const gradientPresets = [
  "from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  "from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "from-slate-500/20 to-zinc-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
];

function getGradientIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradientPresets.length;
}

export function CompanyAvatar({
  company,
  customLogoUrl,
  size = "md",
  className = "",
}: CompanyAvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const logoUrl = getCompanyLogoUrl(company, customLogoUrl);
  const initials = company
    ? company
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "JB";

  const gradient = gradientPresets[getGradientIndex(company || "company")];

  if (!imgError && logoUrl) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 border border-border/80 shadow-xs overflow-hidden ${sizeClasses[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${company} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center shrink-0 font-bold font-serif-luxury bg-gradient-to-br border shadow-xs ${gradient} ${sizeClasses[size]} ${className}`}
    >
      {initials || <Briefcase className={iconSizes[size]} />}
    </div>
  );
}
