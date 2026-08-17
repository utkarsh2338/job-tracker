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
import { KanbanBoard } from "@/components/board/kanban-board";
import { ApplicationDrawer } from "@/components/applications/application-drawer";
import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { DeleteDialog } from "@/components/applications/delete-dialog";
import { CommandPalette } from "@/components/common/command-palette";
import { useRouter } from "next/navigation";
import { Kanban, Table as TableIcon } from "lucide-react";
import Link from "next/link";

interface BoardViewWrapperProps {
  initialApplications: ApplicationWithRelations[];
  initialStats: ApplicationStats;
  initialTags: TagData[];
}

export function BoardViewWrapper({
  initialApplications,
  initialStats,
  initialTags,
}: BoardViewWrapperProps) {
  const router = useRouter();

  const [applications, setApplications] = React.useState(initialApplications);
  const [stats, setStats] = React.useState(initialStats);
  const [tags, setTags] = React.useState(initialTags);

  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationWithRelations | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingApplication, setEditingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingApplication, setDeletingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

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
        <Header
          stats={stats}
          onOpenAddModal={() => handleOpenAddModal()}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury tracking-tight text-foreground">
                Kanban Pipeline Board
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Drag applications across stages to seamlessly track your interview progress.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80 shadow-xs">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                <TableIcon className="h-3.5 w-3.5" /> Table View
              </Link>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card text-foreground shadow-xs">
                <Kanban className="h-3.5 w-3.5" /> Kanban Board
              </div>
            </div>
          </div>

          <KanbanBoard
            applications={applications}
            onSelectApplication={handleSelectApplication}
            onOpenAddModal={handleOpenAddModal}
            onRefresh={handleRefresh}
          />
        </main>
      </div>

      <ApplicationDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        application={selectedApplication}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
        onRefresh={handleRefresh}
      />

      <ApplicationFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={editingApplication}
        allTags={tags}
        onSuccess={handleRefresh}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        applicationId={deletingApplication?.id || null}
        companyName={deletingApplication?.company || ""}
        jobTitle={deletingApplication?.title || ""}
        onDeleted={handleRefresh}
      />

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
