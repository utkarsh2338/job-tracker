"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationWithRelations, ApplicationStatus, TagData } from "@/lib/types";
import {
  STATUS_CONFIG,
  WORK_TYPE_CONFIG,
  PRIORITY_CONFIG,
  formatSalary,
  formatDate,
  formatRelative,
  isFollowUpOverdue,
} from "@/lib/utils";
import { CompanyAvatar } from "@/components/common/company-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/app/actions/applications";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  GripVertical,
  MapPin,
  MoreVertical,
  Plus,
  Sparkles,
} from "lucide-react";

interface KanbanBoardProps {
  applications: ApplicationWithRelations[];
  onSelectApplication: (app: ApplicationWithRelations) => void;
  onOpenAddModal: (defaultStatus?: ApplicationStatus) => void;
  onRefresh?: () => void;
}

const COLUMNS: { id: ApplicationStatus; title: string; color: string }[] = [
  { id: "APPLIED", title: "Applied", color: "border-slate-300 dark:border-slate-700 bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  { id: "SCREENING", title: "Screening", color: "border-amber-300 dark:border-amber-700 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { id: "INTERVIEWING", title: "Interviewing", color: "border-sky-300 dark:border-sky-700 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { id: "OFFER", title: "Offer / Accepted", color: "border-emerald-300 dark:border-emerald-700 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "REJECTED", title: "Archived / Rejected", color: "border-rose-300 dark:border-rose-700 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
];

function KanbanCard({
  app,
  onClick,
  isOverlay = false,
}: {
  app: ApplicationWithRelations;
  onClick?: () => void;
  isOverlay?: boolean;
}) {
  const isOverdue = isFollowUpOverdue(app.followUpDate);
  const nextInterview = app.interviews?.find((i) => !i.completed);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle hover:shadow-card hover:border-primary/50 transition-all duration-200 cursor-pointer select-none space-y-2.5 ${
        isOverlay ? "rotate-2 scale-105 shadow-2xl ring-2 ring-primary border-transparent bg-card" : ""
      }`}
    >
      {/* Top: Avatar & Company & Priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyAvatar
            company={app.company}
            customLogoUrl={app.logoUrl}
            size="sm"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {app.title}
            </h4>
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              {app.company}
            </p>
          </div>
        </div>

        {app.priority === "DREAM" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Dream
          </span>
        )}
      </div>

      {/* Details Row: Location & Salary */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {app.location && (
          <span className="flex items-center gap-1 truncate max-w-[140px]">
            <MapPin className="h-3 w-3 shrink-0" />
            {app.location}
          </span>
        )}
        {app.salaryMax && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
            {formatSalary(app.salaryMax, app.salaryCurrency)}
          </span>
        )}
      </div>

      {/* Tags */}
      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {app.tags.slice(0, 3).map((t) => (
            <span
              key={t.tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.tag.color }}
              />
              {t.tag.name}
            </span>
          ))}
          {app.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              +{app.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Alerts / Interview footer */}
      {(nextInterview || isOverdue) && (
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          {nextInterview ? (
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
              <Calendar className="h-3 w-3" />
              {formatDate(nextInterview.scheduledAt, "MMM d")}
            </span>
          ) : isOverdue ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="h-3 w-3" />
              Follow-up due
            </span>
          ) : null}

          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatRelative(app.dateApplied)}
          </span>
        </div>
      )}
    </div>
  );
}

function SortableItem({
  app,
  onSelect,
}: {
  app: ApplicationWithRelations;
  onSelect: (app: ApplicationWithRelations) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard app={app} onClick={() => onSelect(app)} />
    </div>
  );
}

export function KanbanBoard({
  applications,
  onSelectApplication,
  onOpenAddModal,
  onRefresh,
}: KanbanBoardProps) {
  const [apps, setApps] = React.useState<ApplicationWithRelations[]>(applications);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setApps(applications);
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeApp = React.useMemo(
    () => apps.find((a) => a.id === activeId),
    [apps, activeId]
  );

  const getColumnApplications = (status: ApplicationStatus) => {
    return apps.filter((a) => a.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeAppId = active.id as string;
    const overId = over.id as string;

    const currentApp = apps.find((a) => a.id === activeAppId);
    if (!currentApp) return;

    // Check if dropped onto a column or onto another card
    let targetStatus: ApplicationStatus | null = null;

    if (COLUMNS.some((col) => col.id === overId)) {
      targetStatus = overId as ApplicationStatus;
    } else {
      const overApp = apps.find((a) => a.id === overId);
      if (overApp) {
        targetStatus = overApp.status as ApplicationStatus;
      }
    }

    if (targetStatus && targetStatus !== currentApp.status) {
      // Optimistic update
      const previousApps = [...apps];
      setApps((prev) =>
        prev.map((a) => (a.id === activeAppId ? { ...a, status: targetStatus! } : a))
      );

      if (targetStatus === "OFFER") {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      try {
        const res = await updateApplicationStatus(activeAppId, targetStatus);
        if (res.success) {
          toast.success(`Moved ${currentApp.company} to ${STATUS_CONFIG[targetStatus].label}`);
          if (onRefresh) onRefresh();
        } else {
          setApps(previousApps);
          toast.error("Failed to update status");
        }
      } catch (e: any) {
        setApps(previousApps);
        toast.error("Failed to update status");
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4.5 pb-6 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colApps = getColumnApplications(col.id);
          const totalSalary = colApps.reduce(
            (sum, a) => sum + (a.salaryMax || a.salaryMin || 0),
            0
          );

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl border border-border/80 bg-secondary/30 min-w-[280px] max-w-[340px] flex-1 max-h-[calc(100vh-210px)]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.color}`}>
                    {colApps.length}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {col.title}
                    </h3>
                    {totalSalary > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatSalary(totalSalary, colApps[0]?.salaryCurrency || "USD")} vol
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={() => onOpenAddModal(col.id)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title={`Add to ${col.title}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Column Cards Container */}
              <SortableContext
                id={col.id}
                items={colApps.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[150px]">
                  {colApps.map((app) => (
                    <SortableItem
                      key={app.id}
                      app={app}
                      onSelect={onSelectApplication}
                    />
                  ))}

                  {colApps.length === 0 && (
                    <div
                      onClick={() => onOpenAddModal(col.id)}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/60 rounded-xl text-center cursor-pointer hover:border-primary/40 hover:bg-card/40 transition-all text-muted-foreground group"
                    >
                      <Plus className="h-4 w-4 mb-1 group-hover:text-primary transition-colors" />
                      <span className="text-[11px] font-medium">Add application</span>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeApp ? <KanbanCard app={activeApp} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
