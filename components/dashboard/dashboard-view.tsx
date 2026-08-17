"use client";

import * as React from "react";
import {
  ApplicationWithRelations,
  ApplicationStats,
  TagData,
  ApplicationStatus,
} from "@/lib/types";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/common/stat-card";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { KanbanBoard } from "@/components/board/kanban-board";
import { ApplicationDrawer } from "@/components/applications/application-drawer";
import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { DeleteDialog } from "@/components/applications/delete-dialog";
import { CommandPalette } from "@/components/common/command-palette";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Kanban,
  Table as TableIcon,
  Sparkles,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface DashboardViewProps {
  initialApplications: ApplicationWithRelations[];
  initialStats: ApplicationStats;
  initialTags: TagData[];
}

export function DashboardView({
  initialApplications,
  initialStats,
  initialTags,
}: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = React.useState<ApplicationWithRelations[]>(initialApplications);
  const [stats, setStats] = React.useState<ApplicationStats>(initialStats);
  const [tags, setTags] = React.useState<TagData[]>(initialTags);

  // View state: 'table' or 'board'
  const [currentView, setCurrentView] = React.useState<"table" | "board">("table");

  // Modal / Drawer states
  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationWithRelations | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingApplication, setEditingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingApplication, setDeletingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setApplications(initialApplications);
    setStats(initialStats);
    setTags(initialTags);
  }, [initialApplications, initialStats, initialTags]);

  const handleOpenAddModal = (defaultStatus?: ApplicationStatus) => {
    setEditingApplication(
      defaultStatus ? ({ status: defaultStatus } as ApplicationWithRelations) : null
    );
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (app: ApplicationWithRelations) => {
    setIsDrawerOpen(false);
    setEditingApplication(app);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteDialog = (app: ApplicationWithRelations) => {
    setIsDrawerOpen(false);
    setDeletingApplication(app);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectApplication = (app: ApplicationWithRelations) => {
    setSelectedApplication(app);
    setIsDrawerOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 h-full">
        <Sidebar
          stats={stats}
          onOpenAddModal={() => handleOpenAddModal()}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar Header */}
        <Header
          stats={stats}
          onOpenAddModal={() => handleOpenAddModal()}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Title & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury tracking-tight text-foreground">
                Applications Pipeline
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Track, optimize, and advance opportunities through your hiring stages.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80 self-start sm:self-auto shadow-xs">
              <button
                type="button"
                onClick={() => setCurrentView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === "table"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" /> Table View
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === "board"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" /> Kanban Board
              </button>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <StatCard
              label="Total Tracked"
              value={stats.total}
              icon={Layers}
              colorScheme="default"
              changeText="All Pipeline"
            />
            <StatCard
              label="Applied / Pending"
              value={stats.applied}
              icon={Clock}
              colorScheme="amber"
              changeText="Awaiting response"
            />
            <StatCard
              label="Interviewing"
              value={stats.screening + stats.interviewing}
              icon={Calendar}
              colorScheme="sky"
              changeText={`${stats.interviewScheduledCount} scheduled`}
            />
            <StatCard
              label="Offers Received"
              value={stats.offer}
              icon={CheckCircle2}
              colorScheme="emerald"
              changeText={`${stats.offerRate}% conversion`}
            />
            <StatCard
              label="Archived"
              value={stats.rejected + stats.archived}
              icon={XCircle}
              colorScheme="rose"
              changeText="Past rounds"
            />
          </div>

          {/* Applications View Area */}
          {currentView === "table" ? (
            <ApplicationsTable
              applications={applications}
              allTags={tags}
              onSelectApplication={handleSelectApplication}
              onEditApplication={handleOpenEditModal}
              onDeleteApplication={handleOpenDeleteDialog}
              onOpenAddModal={() => handleOpenAddModal()}
              onRefresh={handleRefresh}
            />
          ) : (
            <KanbanBoard
              applications={applications}
              onSelectApplication={handleSelectApplication}
              onOpenAddModal={handleOpenAddModal}
              onRefresh={handleRefresh}
            />
          )}
        </main>
      </div>

      {/* 360° Application Detail Drawer */}
      <ApplicationDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        application={selectedApplication}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
        onRefresh={handleRefresh}
      />

      {/* Add / Edit Application Form Modal */}
      <ApplicationFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={editingApplication}
        allTags={tags}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        applicationId={deletingApplication?.id || null}
        companyName={deletingApplication?.company || ""}
        jobTitle={deletingApplication?.title || ""}
        onDeleted={handleRefresh}
      />

      {/* Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        applications={applications}
        onSelectApplication={handleSelectApplication}
        onOpenAddModal={() => handleOpenAddModal()}
      />
    </div>
  );
}
