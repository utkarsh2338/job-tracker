"use client";

import * as React from "react";
import {
  ApplicationWithRelations,
  ApplicationStats,
  InterviewData,
  TagData,
} from "@/lib/types";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ApplicationDrawer } from "@/components/applications/application-drawer";
import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { DeleteDialog } from "@/components/applications/delete-dialog";
import { CommandPalette } from "@/components/common/command-palette";
import { CompanyAvatar } from "@/components/common/company-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  User,
  Video,
  CheckCircle2,
  Check,
  Sparkles,
} from "lucide-react";
import {
  addInterview,
  toggleInterviewComplete,
} from "@/app/actions/applications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface CalendarViewProps {
  initialApplications: ApplicationWithRelations[];
  initialStats: ApplicationStats;
  initialTags: TagData[];
}

export function CalendarView({
  initialApplications,
  initialStats,
  initialTags,
}: CalendarViewProps) {
  const router = useRouter();

  const [applications, setApplications] = React.useState(initialApplications);
  const [stats, setStats] = React.useState(initialStats);
  const [tags, setTags] = React.useState(initialTags);

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date>(new Date());

  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationWithRelations | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingApplication, setEditingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingApplication, setDeletingApplication] = React.useState<ApplicationWithRelations | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Quick schedule interview modal state
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [targetAppId, setTargetAppId] = React.useState<string>("");
  const [scheduleTitle, setScheduleTitle] = React.useState("Technical Round");
  const [scheduleDate, setScheduleDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduleTime, setScheduleTime] = React.useState("10:00");
  const [scheduleDuration, setScheduleDuration] = React.useState(45);
  const [scheduleInterviewer, setScheduleInterviewer] = React.useState("");
  const [scheduleMeetingLink, setScheduleMeetingLink] = React.useState("");
  const [scheduleLocation, setScheduleLocation] = React.useState("Google Meet");

  React.useEffect(() => {
    setApplications(initialApplications);
    setStats(initialStats);
    setTags(initialTags);
  }, [initialApplications, initialStats, initialTags]);

  // Aggregate all interviews across applications
  const allInterviews = React.useMemo(() => {
    const list: {
      interview: InterviewData;
      app: ApplicationWithRelations;
    }[] = [];

    applications.forEach((app) => {
      if (app.interviews) {
        app.interviews.forEach((i) => {
          list.push({ interview: i, app });
        });
      }
    });

    return list.sort(
      (a, b) =>
        new Date(a.interview.scheduledAt).getTime() -
        new Date(b.interview.scheduledAt).getTime()
    );
  }, [applications]);

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayInterviews = (day: Date) => {
    return allInterviews.filter((item) =>
      isSameDay(new Date(item.interview.scheduledAt), day)
    );
  };

  const getDayFollowUps = (day: Date) => {
    return applications.filter(
      (app) => app.followUpDate && isSameDay(new Date(app.followUpDate), day)
    );
  };

  const handleToggleComplete = async (interviewId: string, completed: boolean) => {
    try {
      const res = await toggleInterviewComplete(interviewId, completed);
      if (res.success) {
        toast.success(completed ? "Interview marked completed" : "Interview marked pending");
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Failed to update interview");
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAppId || !scheduleTitle.trim() || !scheduleDate) return;

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime || "10:00"}`);
      const res = await addInterview(targetAppId, {
        title: scheduleTitle.trim(),
        scheduledAt,
        durationMin: scheduleDuration,
        interviewer: scheduleInterviewer.trim() || undefined,
        meetingLink: scheduleMeetingLink.trim() || undefined,
        location: scheduleLocation,
      });

      if (res.success) {
        toast.success("Interview scheduled!");
        setIsScheduleOpen(false);
        setScheduleTitle("Technical Round");
        setScheduleInterviewer("");
        setScheduleMeetingLink("");
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Failed to schedule interview");
    }
  };

  const selectedDayInterviews = getDayInterviews(selectedDay);
  const selectedDayFollowUps = getDayFollowUps(selectedDay);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 h-full">
        <Sidebar
          stats={stats}
          onOpenAddModal={() => setIsFormModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          stats={stats}
          onOpenAddModal={() => setIsFormModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury tracking-tight text-foreground">
                Interview Calendar
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Schedule, track, and prepare for upcoming interview rounds and follow-ups.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDay(new Date());
                }}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="luxury"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Schedule Interview
              </Button>
            </div>
          </div>

          {/* Quick Schedule Form Card (if toggled) */}
          {isScheduleOpen && (
            <form
              onSubmit={handleScheduleSubmit}
              className="p-5 rounded-2xl border border-primary/30 bg-card shadow-card space-y-4 animate-in fade-in-0 duration-200"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold font-serif-luxury text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Schedule Interview Round
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsScheduleOpen(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Select Company</label>
                  <Select value={targetAppId} onValueChange={setTargetAppId}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose application..." />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.company} — {app.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Round Title</label>
                  <Input
                    placeholder="e.g. System Design, Onsite Round 2"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Location / Platform</label>
                  <Input
                    placeholder="e.g. Google Meet, Zoom"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Time</label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                  <Select
                    value={scheduleDuration.toString()}
                    onValueChange={(val) => setScheduleDuration(Number(val))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Interviewer Name</label>
                  <Input
                    placeholder="e.g. Sarah Jenkins"
                    value={scheduleInterviewer}
                    onChange={(e) => setScheduleInterviewer(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Input
                  placeholder="Meeting Link (https://meet.google.com/... or Zoom)"
                  value={scheduleMeetingLink}
                  onChange={(e) => setScheduleMeetingLink(e.target.value)}
                  className="text-xs max-w-md"
                />
                <Button type="submit" variant="luxury" size="sm" className="text-xs font-semibold">
                  Confirm & Add to Calendar
                </Button>
              </div>
            </form>
          )}

          {/* Calendar Grid & Day Detail Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Month Calendar Grid */}
            <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-serif-luxury text-foreground">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    size="iconSm"
                    variant="outline"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="outline"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const dayInterviews = getDayInterviews(day);
                  const dayFollowUps = getDayFollowUps(day);
                  const isSelected = isSameDay(day, selectedDay);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[85px] p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "border-border/60 bg-background/50 hover:border-primary/40 hover:bg-secondary/30"
                      } ${!isCurrentMonth ? "opacity-30" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                            isTodayDate
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {(dayInterviews.length > 0 || dayFollowUps.length > 0) && (
                          <div className="flex items-center gap-1">
                            {dayInterviews.length > 0 && (
                              <span className="h-2 w-2 rounded-full bg-sky-500" />
                            )}
                            {dayFollowUps.length > 0 && (
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Event Snippets on Calendar Tile */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayInterviews.slice(0, 1).map((item) => (
                          <div
                            key={item.interview.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${
                              item.interview.completed
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 line-through opacity-70"
                                : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
                            }`}
                          >
                            {item.app.company}: {item.interview.title}
                          </div>
                        ))}

                        {dayInterviews.length > 1 && (
                          <span className="text-[9px] text-muted-foreground font-mono pl-1">
                            +{dayInterviews.length - 1} more
                          </span>
                        )}

                        {dayFollowUps.length > 0 && dayInterviews.length === 0 && (
                          <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 shrink-0" /> {dayFollowUps[0].company} Follow-up
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Day Schedule & Upcoming Agenda */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-serif-luxury text-foreground">
                    {format(selectedDay, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedDayInterviews.length} interview(s) • {selectedDayFollowUps.length} follow-up(s)
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setScheduleDate(format(selectedDay, "yyyy-MM-dd"));
                    setIsScheduleOpen(true);
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Event
                </Button>
              </div>

              {/* Day Events List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[480px]">
                {/* Interviews */}
                {selectedDayInterviews.map(({ interview, app }) => (
                  <div
                    key={interview.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      interview.completed
                        ? "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/20 opacity-75"
                        : "border-sky-500/30 bg-sky-50/20 dark:bg-sky-950/20 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <CompanyAvatar company={app.company} customLogoUrl={app.logoUrl} size="sm" />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">
                            {interview.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">{app.company}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleComplete(interview.id, !interview.completed)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs transition-colors ${
                          interview.completed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-border hover:border-foreground/60"
                        }`}
                        title={interview.completed ? "Mark pending" : "Mark completed"}
                      >
                        {interview.completed && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {format(new Date(interview.scheduledAt), "h:mm a")} ({interview.durationMin}m)
                      </span>

                      {interview.interviewer && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {interview.interviewer}
                        </span>
                      )}
                    </div>

                    {interview.meetingLink && (
                      <div className="pt-1">
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Video Call
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {/* Follow Ups */}
                {selectedDayFollowUps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Follow-Up Reminder</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsDrawerOpen(true);
                        }}
                        className="h-6 text-[10px] px-2"
                      >
                        View App
                      </Button>
                    </div>
                    <p className="text-xs">
                      Reach out regarding <strong>{app.title}</strong> at <strong>{app.company}</strong>.
                    </p>
                  </div>
                ))}

                {selectedDayInterviews.length === 0 && selectedDayFollowUps.length === 0 && (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    No scheduled interviews or follow-ups for this day.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <ApplicationDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        application={selectedApplication}
        onEdit={(app) => {
          setIsDrawerOpen(false);
          setEditingApplication(app);
          setIsFormModalOpen(true);
        }}
        onDelete={(app) => {
          setIsDrawerOpen(false);
          setDeletingApplication(app);
          setIsDeleteDialogOpen(true);
        }}
        onRefresh={() => router.refresh()}
      />

      <ApplicationFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={editingApplication}
        allTags={tags}
        onSuccess={() => router.refresh()}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        applicationId={deletingApplication?.id || null}
        companyName={deletingApplication?.company || ""}
        jobTitle={deletingApplication?.title || ""}
        onDeleted={() => router.refresh()}
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
