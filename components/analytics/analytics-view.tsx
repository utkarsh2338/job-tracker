"use client";

import * as React from "react";
import {
  ApplicationWithRelations,
  ApplicationStats,
  TagData,
} from "@/lib/types";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/stat-card";
import { ApplicationDrawer } from "@/components/applications/application-drawer";
import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { DeleteDialog } from "@/components/applications/delete-dialog";
import { CommandPalette } from "@/components/common/command-palette";
import { formatSalary } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Percent,
  CheckCircle2,
  DollarSign,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";

interface AnalyticsViewProps {
  initialApplications: ApplicationWithRelations[];
  initialStats: ApplicationStats;
  initialTags: TagData[];
}

const COLORS = ["#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ec4899", "#64748b"];

export function AnalyticsView({
  initialApplications,
  initialStats,
  initialTags,
}: AnalyticsViewProps) {
  const [applications] = React.useState(initialApplications);
  const [stats] = React.useState(initialStats);
  const [tags] = React.useState(initialTags);

  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationWithRelations | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // 1. Funnel Data
  const funnelData = React.useMemo(() => {
    const total = applications.length;
    const screening = applications.filter((a) =>
      ["SCREENING", "INTERVIEWING", "OFFER", "REJECTED"].includes(a.status)
    ).length;
    const interviewing = applications.filter((a) =>
      ["INTERVIEWING", "OFFER"].includes(a.status) || (a.interviews && a.interviews.length > 0)
    ).length;
    const offer = applications.filter((a) => a.status === "OFFER").length;

    return [
      { name: "Total Applied", value: total, rate: "100%", fill: "#64748b" },
      {
        name: "Recruiter Screen",
        value: screening,
        rate: total > 0 ? `${Math.round((screening / total) * 100)}%` : "0%",
        fill: "#f59e0b",
      },
      {
        name: "Interviewing",
        value: interviewing,
        rate: total > 0 ? `${Math.round((interviewing / total) * 100)}%` : "0%",
        fill: "#0ea5e9",
      },
      {
        name: "Offer Received",
        value: offer,
        rate: total > 0 ? `${Math.round((offer / total) * 100)}%` : "0%",
        fill: "#10b981",
      },
    ];
  }, [applications]);

  // 2. Timeline Activity (Applications by Week)
  const timelineData = React.useMemo(() => {
    const weeks: Record<string, { week: string; count: number; offers: number }> = {};

    // Generate last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 7);
      const weekLabel = format(startOfWeek(date), "MMM d");
      weeks[weekLabel] = { week: weekLabel, count: 0, offers: 0 };
    }

    applications.forEach((app) => {
      const weekLabel = format(startOfWeek(new Date(app.dateApplied)), "MMM d");
      if (weeks[weekLabel]) {
        weeks[weekLabel].count += 1;
        if (app.status === "OFFER") weeks[weekLabel].offers += 1;
      }
    });

    return Object.values(weeks);
  }, [applications]);

  // 3. Work Type Breakdown (Remote vs Hybrid vs Onsite)
  const workTypeData = React.useMemo(() => {
    const counts: Record<string, number> = { Remote: 0, Hybrid: 0, "On-site": 0 };
    applications.forEach((app) => {
      if (app.workType === "REMOTE") counts["Remote"] += 1;
      else if (app.workType === "HYBRID") counts["Hybrid"] += 1;
      else counts["On-site"] += 1;
    });

    return [
      { name: "Remote", value: counts["Remote"], color: "#10b981" },
      { name: "Hybrid", value: counts["Hybrid"], color: "#0ea5e9" },
      { name: "On-site", value: counts["On-site"], color: "#8b5cf6" },
    ].filter((item) => item.value > 0);
  }, [applications]);

  // 4. Compensation Ranges Distribution
  const salaryData = React.useMemo(() => {
    const buckets: Record<string, number> = {
      "< $150k": 0,
      "$150k - $180k": 0,
      "$180k - $210k": 0,
      "$210k+": 0,
    };

    applications.forEach((app) => {
      const sal = app.salaryMax || app.salaryMin;
      if (!sal) return;
      if (sal < 150000) buckets["< $150k"] += 1;
      else if (sal <= 180000) buckets["$150k - $180k"] += 1;
      else if (sal <= 210000) buckets["$180k - $210k"] += 1;
      else buckets["$210k+"] += 1;
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  }, [applications]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block w-72 shrink-0 h-full">
        <Sidebar
          stats={stats}
          onOpenAddModal={() => setIsFormModalOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          stats={stats}
          onOpenAddModal={() => setIsFormModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury tracking-tight text-foreground">
              Pipeline Analytics & Conversion
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Actionable insights on stage conversion, velocity, compensation distribution, and response rates.
            </p>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Response Rate
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-serif-luxury text-sky-600 dark:text-sky-400">
                  {stats.responseRate}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.screening + stats.interviewing + stats.offer} of {stats.total}
                </span>
              </div>
              <div className="mt-3 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${stats.responseRate}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Offer Conversion Rate
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-serif-luxury text-emerald-600 dark:text-emerald-400">
                  {stats.offerRate}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.offer} accepted
                </span>
              </div>
              <div className="mt-3 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${stats.offerRate}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Average Target / Offer
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-serif-luxury text-foreground">
                  {stats.avgSalary ? formatSalary(stats.avgSalary) : "—"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Across {applications.filter((a) => a.salaryMax).length} roles with compensation listed
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Interview Rounds
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-serif-luxury text-purple-600 dark:text-purple-400">
                  {stats.interviewScheduledCount}
                </span>
                <span className="text-xs text-muted-foreground">In Calendar</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                {stats.screening + stats.interviewing} companies currently in active loops
              </p>
            </Card>
          </div>

          {/* Charts Row 1: Funnel & Activity Over Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Chart */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Application Funnel Progression
                </CardTitle>
                <CardDescription>
                  Stage drop-off and conversion from initial application to final offer.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2 space-y-4">
                <div className="space-y-3">
                  {funnelData.map((item, idx) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-foreground">{item.value}</span>
                          <span className="text-muted-foreground">({item.rate})</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.value / (funnelData[0].value || 1)) * 100}%`,
                            backgroundColor: item.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Applications Over Time (Weekly) */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Applications Submitted Over Time
                </CardTitle>
                <CardDescription>
                  Volume of new roles added per week.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="week" stroke="#888888" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#888888" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Applications"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: Work Type & Compensation Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Type Donut */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Work Arrangement Distribution
                </CardTitle>
                <CardDescription>
                  Remote vs Hybrid vs On-site opportunities in pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2 h-60 flex items-center justify-between">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {workTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-1/2 space-y-3 pl-4 border-l border-border/60">
                  {workTypeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono text-muted-foreground">
                        {item.value} ({Math.round((item.value / applications.length) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compensation Distribution Bar */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Salary Bracket Breakdown
                </CardTitle>
                <CardDescription>
                  Target and offered compensation across tracked positions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="range" stroke="#888888" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#888888" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Applications" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ApplicationFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        allTags={tags}
      />

      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        applications={applications}
        onSelectApplication={(app) => {
          setSelectedApplication(app);
          setIsDrawerOpen(true);
        }}
        onOpenAddModal={() => setIsFormModalOpen(true)}
      />
    </div>
  );
}
