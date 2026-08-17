"use client";

import * as React from "react";
import {
  ApplicationWithRelations,
  ApplicationStatus,
  WorkType,
  Priority,
  TagData,
} from "@/lib/types";
import {
  STATUS_CONFIG,
  WORK_TYPE_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  formatRelative,
  formatSalaryRange,
  formatSalary,
  isFollowUpOverdue,
} from "@/lib/utils";
import { CompanyAvatar } from "@/components/common/company-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Filter,
  Globe,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { updateApplicationStatus } from "@/app/actions/applications";
import { toast } from "sonner";

interface ApplicationsTableProps {
  applications: ApplicationWithRelations[];
  allTags: TagData[];
  onSelectApplication: (app: ApplicationWithRelations) => void;
  onEditApplication: (app: ApplicationWithRelations) => void;
  onDeleteApplication: (app: ApplicationWithRelations) => void;
  onOpenAddModal: () => void;
  onRefresh?: () => void;
}

export function ApplicationsTable({
  applications,
  allTags,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onOpenAddModal,
  onRefresh,
}: ApplicationsTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [workTypeFilter, setWorkTypeFilter] = React.useState<string>("ALL");
  const [tagFilter, setTagFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<string>("dateApplied");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Filtering Logic
  const filteredApplications = React.useMemo(() => {
    return applications
      .filter((app) => {
        // Search filter (company, title, location, notes)
        if (search.trim() !== "") {
          const q = search.toLowerCase();
          const matchCompany = app.company.toLowerCase().includes(q);
          const matchTitle = app.title.toLowerCase().includes(q);
          const matchLocation = app.location ? app.location.toLowerCase().includes(q) : false;
          const matchNotes = app.notes ? app.notes.toLowerCase().includes(q) : false;
          if (!matchCompany && !matchTitle && !matchLocation && !matchNotes) return false;
        }

        // Status filter
        if (statusFilter !== "ALL" && app.status !== statusFilter) {
          return false;
        }

        // Work Type filter
        if (workTypeFilter !== "ALL" && app.workType !== workTypeFilter) {
          return false;
        }

        // Tag filter
        if (tagFilter !== "ALL") {
          const hasTag = app.tags.some((t) => t.tag.id === tagFilter);
          if (!hasTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === "company") {
          comp = a.company.localeCompare(b.company);
        } else if (sortBy === "title") {
          comp = a.title.localeCompare(b.title);
        } else if (sortBy === "salary") {
          const salA = a.salaryMax || a.salaryMin || 0;
          const salB = b.salaryMax || b.salaryMin || 0;
          comp = salA - salB;
        } else if (sortBy === "status") {
          comp = a.status.localeCompare(b.status);
        } else {
          // default dateApplied
          const dateA = new Date(a.dateApplied).getTime();
          const dateB = new Date(b.dateApplied).getTime();
          comp = dateA - dateB;
        }
        return sortOrder === "asc" ? comp : -comp;
      });
  }, [applications, search, statusFilter, workTypeFilter, tagFilter, sortBy, sortOrder]);

  const handleQuickStatusChange = async (appId: string, company: string, newStatus: string) => {
    try {
      const res = await updateApplicationStatus(appId, newStatus);
      if (res.success) {
        toast.success(`Updated ${company} status to ${STATUS_CONFIG[newStatus as ApplicationStatus]?.label || newStatus}`);
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  const hasActiveFilters =
    search !== "" || statusFilter !== "ALL" || workTypeFilter !== "ALL" || tagFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setWorkTypeFilter("ALL");
    setTagFilter("ALL");
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search, Filters, Sorting */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, role title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="SCREENING">Screening</SelectItem>
              <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
              <SelectItem value="OFFER">Offer / Accepted</SelectItem>
              <SelectItem value="REJECTED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Work Type Filter */}
          <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-[120px] bg-background/50">
              <SelectValue placeholder="Work Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
              <SelectItem value="ONSITE">On-site</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          {allTags && allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-9 text-xs w-[120px] bg-background/50">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs w-[135px] bg-background/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateApplied">Date Applied</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="title">Role Title</SelectItem>
              <SelectItem value="salary">Compensation</SelectItem>
              <SelectItem value="status">Status Stage</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order Toggle */}
          <Button
            size="iconSm"
            variant="outline"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            className="h-9 w-9 bg-background/50"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-9 text-xs px-2.5 text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
              Search: "{search}"
              <button onClick={() => setSearch("")} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
              Stage: {statusFilter}
              <button onClick={() => setStatusFilter("ALL")} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {workTypeFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
              Type: {workTypeFilter}
              <button onClick={() => setWorkTypeFilter("ALL")} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {tagFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
              Tag: {allTags.find((t) => t.id === tagFilter)?.name || tagFilter}
              <button onClick={() => setTagFilter("ALL")} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-[11px] text-primary hover:underline font-medium ml-1"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Results Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Showing <strong>{filteredApplications.length}</strong> of{" "}
          <strong>{applications.length}</strong> applications
        </span>
      </div>

      {/* Applications Table (Desktop) */}
      <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/70">
            <tr>
              <th className="py-3.5 pl-5 pr-3">Company & Role</th>
              <th className="py-3.5 px-3">Location & Type</th>
              <th className="py-3.5 px-3">Compensation</th>
              <th className="py-3.5 px-3">Applied Date</th>
              <th className="py-3.5 px-3">Stage</th>
              <th className="py-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                const statusConfig =
                  STATUS_CONFIG[app.status as ApplicationStatus] || STATUS_CONFIG.APPLIED;
                const isOverdue = isFollowUpOverdue(app.followUpDate);
                const nextInterview = app.interviews?.find((i) => !i.completed);

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="group hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    {/* Company & Role */}
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar
                          company={app.company}
                          customLogoUrl={app.logoUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {app.title}
                            </span>
                            {app.priority === "DREAM" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-semibold inline-flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Dream
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              {app.company}
                            </span>
                            {app.tags && app.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {app.tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t.tag.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground"
                                  >
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{ backgroundColor: t.tag.color }}
                                    />
                                    {t.tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location & Type */}
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground/90">
                          {WORK_TYPE_CONFIG[app.workType as WorkType]?.label || app.workType}
                        </span>
                        <span className="text-[11px] truncate max-w-[140px]">
                          {app.location || "Remote"}
                        </span>
                      </div>
                    </td>

                    {/* Compensation */}
                    <td className="py-3.5 px-3 text-xs font-mono">
                      {app.salaryMax || app.salaryMin ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatSalaryRange(app.salaryMin, app.salaryMax, app.salaryCurrency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Applied Date & Alerts */}
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span>{formatDate(app.dateApplied)}</span>
                        {nextInterview ? (
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" /> Interview {formatDate(nextInterview.scheduledAt, "MMM d")}
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" /> Follow-up due
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Stage Pill with inline quick change */}
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${statusConfig.badgeClass}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${statusConfig.dotClass}`} />
                            <span>{statusConfig.label}</span>
                            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(app.id, app.company, "APPLIED")}>
                            Applied
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(app.id, app.company, "SCREENING")}>
                            Screening
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(app.id, app.company, "INTERVIEWING")}>
                            Interviewing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(app.id, app.company, "OFFER")}>
                            Offer / Accepted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(app.id, app.company, "REJECTED")}>
                            Archived
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {app.link && (
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Open posting"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => onEditApplication(app)}
                          title="Edit application"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => onDeleteApplication(app)}
                          title="Delete application"
                          className="hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="mx-auto max-w-sm flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">No applications found</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      {hasActiveFilters
                        ? "Try clearing some filters to see more applications."
                        : "Start tracking your first opportunity to fill your pipeline."}
                    </p>
                    {hasActiveFilters ? (
                      <Button size="sm" variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    ) : (
                      <Button size="sm" variant="luxury" onClick={onOpenAddModal} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Track Application
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => {
            const statusConfig =
              STATUS_CONFIG[app.status as ApplicationStatus] || STATUS_CONFIG.APPLIED;
            const isOverdue = isFollowUpOverdue(app.followUpDate);
            const nextInterview = app.interviews?.find((i) => !i.completed);

            return (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-primary/50 transition-all space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar
                      company={app.company}
                      customLogoUrl={app.logoUrl}
                      size="md"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{app.title}</h4>
                      <p className="text-xs text-muted-foreground">{app.company}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <span>{app.location || "Remote"}</span>
                  {app.salaryMax && (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatSalary(app.salaryMax, app.salaryCurrency)}
                    </span>
                  )}
                </div>

                {(nextInterview || isOverdue) && (
                  <div className="text-[11px] pt-1 border-t border-border/40">
                    {nextInterview ? (
                      <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Interview {formatDate(nextInterview.scheduledAt, "MMM d")}
                      </span>
                    ) : isOverdue ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Follow-up due today
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-card rounded-2xl border border-border/80 text-muted-foreground text-xs">
            No matching applications found.
          </div>
        )}
      </div>
    </div>
  );
}
