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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { CommandPalette } from "@/components/common/command-palette";
import {
  createTag,
  deleteTag,
} from "@/app/actions/applications";
import {
  importApplicationsFromParsedCSV,
  resetAndSeedDatabase,
} from "@/app/actions/data-management";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Plus,
  RefreshCw,
  Tag as TagIcon,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  initialApplications: ApplicationWithRelations[];
  initialStats: ApplicationStats;
  initialTags: TagData[];
}

export function SettingsView({
  initialApplications,
  initialStats,
  initialTags,
}: SettingsViewProps) {
  const router = useRouter();

  const [applications, setApplications] = React.useState(initialApplications);
  const [stats, setStats] = React.useState(initialStats);
  const [tags, setTags] = React.useState(initialTags);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // New Tag State
  const [newTagName, setNewTagName] = React.useState("");
  const [newTagColor, setNewTagColor] = React.useState("#10b981");

  // CSV Import State
  const [isImporting, setIsImporting] = React.useState(false);
  const [parsedRows, setParsedRows] = React.useState<any[]>([]);
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    setApplications(initialApplications);
    setStats(initialStats);
    setTags(initialTags);
  }, [initialApplications, initialStats, initialTags]);

  // Export CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      toast.error("No applications to export");
      return;
    }

    const headers = [
      "Company",
      "Job Title",
      "Location",
      "Work Type",
      "Status",
      "Date Applied",
      "Salary Min",
      "Salary Max",
      "Currency",
      "Application Link",
      "Notes",
      "Tags",
      "Contact Name",
      "Contact Email",
    ];

    const csvRows = [headers.join(",")];

    applications.forEach((app) => {
      const tagStr = app.tags ? app.tags.map((t) => t.tag.name).join(";") : "";
      const row = [
        `"${(app.company || "").replace(/"/g, '""')}"`,
        `"${(app.title || "").replace(/"/g, '""')}"`,
        `"${(app.location || "").replace(/"/g, '""')}"`,
        `"${app.workType || "REMOTE"}"`,
        `"${app.status || "APPLIED"}"`,
        `"${format(new Date(app.dateApplied), "yyyy-MM-dd")}"`,
        app.salaryMin || "",
        app.salaryMax || "",
        `"${app.salaryCurrency || "USD"}"`,
        `"${(app.link || "").replace(/"/g, '""')}"`,
        `"${(app.notes || "").replace(/"/g, '""')}"`,
        `"${tagStr}"`,
        `"${(app.contactName || "").replace(/"/g, '""')}"`,
        `"${(app.contactEmail || "").replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `job_applications_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV file downloaded successfully!");
  };

  // CSV File Reader & Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const rows: any[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        // Simple regex parser for quoted CSV
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
          c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()
        );

        if (cols.length >= 2 && cols[0] && cols[1]) {
          rows.push({
            company: cols[0],
            title: cols[1],
            location: cols[2] || undefined,
            workType: cols[3] || "REMOTE",
            status: cols[4] || "APPLIED",
            dateApplied: cols[5] || undefined,
            salaryMin: cols[6] ? Number(cols[6]) : undefined,
            salaryMax: cols[7] ? Number(cols[7]) : undefined,
            salaryCurrency: cols[8] || "USD",
            link: cols[9] || undefined,
            notes: cols[10] || undefined,
            tags: cols[11] || undefined,
          });
        }
      }

      setParsedRows(rows);
      toast.info(`Found ${rows.length} valid application rows to import`);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await importApplicationsFromParsedCSV(parsedRows);
      if (res.success) {
        toast.success(`Successfully imported ${res.count} applications!`);
        setParsedRows([]);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to import CSV");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to import CSV");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await createTag(newTagName.trim(), newTagColor);
      if (res.success) {
        toast.success(`Tag "${newTagName}" created`);
        setNewTagName("");
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Failed to create tag");
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      const res = await deleteTag(id);
      if (res.success) {
        toast.success("Tag deleted");
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Failed to delete tag");
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the database and reload the 14 realistic sample applications? This will overwrite existing records.")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await resetAndSeedDatabase();
      if (res.success) {
        toast.success("Database restored to demo dataset!");
        router.refresh();
      } else {
        toast.error("Failed to reset database");
      }
    } catch (e: any) {
      toast.error("Failed to reset database");
    } finally {
      setIsResetting(false);
    }
  };

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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury tracking-tight text-foreground">
              Settings & Data Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Export data to CSV, import external applications, configure pipeline tags, and manage local persistence.
            </p>
          </div>

          {/* Section 1: CSV Export & Import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Card */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" /> Export Data (CSV)
                </CardTitle>
                <CardDescription>
                  Download all {applications.length} applications with stages, salary notes, and timestamps to a standard CSV.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Export {applications.length} Applications as CSV
                </Button>
              </CardContent>
            </Card>

            {/* Import Card */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-sky-500" /> Import from CSV
                </CardTitle>
                <CardDescription>
                  Upload a spreadsheet to bulk-add applications and assign stages.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-3 space-y-3">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="text-xs cursor-pointer file:cursor-pointer"
                />

                {parsedRows.length > 0 && (
                  <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-50/20 dark:bg-sky-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        Ready to import {parsedRows.length} applications
                      </span>
                      <Button
                        size="sm"
                        variant="luxury"
                        onClick={handleConfirmImport}
                        disabled={isImporting}
                        className="h-7 text-xs"
                      >
                        {isImporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Confirm Import"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Tags Management */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-purple-500" /> Pipeline Tags & Labels
              </CardTitle>
              <CardDescription>
                Customize color-coded tags to categorize applications (e.g. Dream Job, Referral, Tier 1, Remote).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2 space-y-4">
              {/* Add New Tag */}
              <div className="flex flex-wrap items-center gap-2.5 max-w-md">
                <Input
                  placeholder="New tag label (e.g. Top Tier, Urgent)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="text-xs flex-1 min-w-[180px]"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0.5"
                  title="Choose tag color"
                />
                <Button
                  size="sm"
                  variant="luxury"
                  onClick={handleCreateTag}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" /> Create Tag
                </Button>
              </div>

              {/* Tag Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border shadow-xs"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors ml-1"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Database Reset & Architecture Info */}
          <Card className="p-6 border-rose-500/20 bg-card">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Database className="h-4 w-4 text-amber-500" /> Database & Dev State
              </CardTitle>
              <CardDescription>
                Running locally on SQLite (`prisma/dev.db`) structured for instant PostgreSQL migration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground">Reset & Reload Demo Seed Dataset</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Restores 14 curated high-quality job applications across top tech companies.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="text-xs gap-1.5 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 shrink-0"
              >
                {isResetting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Reset to Sample Dataset
              </Button>
            </CardContent>
          </Card>
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
        onSelectApplication={() => {}}
        onOpenAddModal={() => setIsFormModalOpen(true)}
      />
    </div>
  );
}
