"use client";

import * as React from "react";
import {
  ApplicationWithRelations,
  ApplicationStatus,
  TagData,
  TimelineEventData,
  InterviewData,
} from "@/lib/types";
import {
  STATUS_CONFIG,
  WORK_TYPE_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  formatRelative,
  formatSalaryRange,
  isFollowUpOverdue,
} from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyAvatar } from "@/components/common/company-avatar";
import {
  updateApplicationStatus,
  addTimelineEvent,
  deleteTimelineEvent,
  addInterview,
  toggleInterviewComplete,
  deleteInterview,
  addAttachment,
  deleteAttachment,
  updateApplication,
} from "@/app/actions/applications";
import { toast } from "sonner";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";

interface ApplicationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationWithRelations | null;
  onEdit: (app: ApplicationWithRelations) => void;
  onDelete: (app: ApplicationWithRelations) => void;
  onRefresh?: () => void;
}

export function ApplicationDrawer({
  open,
  onOpenChange,
  application,
  onEdit,
  onDelete,
  onRefresh,
}: ApplicationDrawerProps) {
  const [activeTab, setActiveTab] = React.useState("timeline");

  // Timeline Event Form State
  const [isAddingEvent, setIsAddingEvent] = React.useState(false);
  const [eventType, setEventType] = React.useState("NOTE");
  const [eventTitle, setEventTitle] = React.useState("");
  const [eventDescription, setEventDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");

  // Interview Form State
  const [isAddingInterview, setIsAddingInterview] = React.useState(false);
  const [interviewTitle, setInterviewTitle] = React.useState("Technical Interview");
  const [interviewRound, setInterviewRound] = React.useState(1);
  const [interviewDate, setInterviewDate] = React.useState("");
  const [interviewTime, setInterviewTime] = React.useState("10:00");
  const [interviewDuration, setInterviewDuration] = React.useState(45);
  const [interviewerName, setInterviewerName] = React.useState("");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [interviewLocation, setInterviewLocation] = React.useState("Google Meet");

  // Attachment Form State
  const [isAddingAttachment, setIsAddingAttachment] = React.useState(false);
  const [attachmentName, setAttachmentName] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [attachmentType, setAttachmentType] = React.useState("RESUME");

  if (!application) return null;

  const statusConfig = STATUS_CONFIG[application.status as ApplicationStatus] || STATUS_CONFIG.APPLIED;
  const isOverdue = isFollowUpOverdue(application.followUpDate);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await updateApplicationStatus(application.id, newStatus);
      if (res.success) {
        if (newStatus === "OFFER") {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
        toast.success(`Moved to ${newStatus}`, {
          description: `Stage updated for ${application.company}.`,
        });
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkFollowUpDone = async () => {
    try {
      await updateApplication(application.id, { followUpDate: null as any });
      await addTimelineEvent(application.id, {
        type: "FOLLOW_UP",
        title: "Follow-Up Completed",
        description: "Marked follow-up as resolved.",
      });
      toast.success("Follow-up marked as resolved!");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to update follow-up");
    }
  };

  const handleCreateTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      const res = await addTimelineEvent(application.id, {
        type: eventType,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
      });

      if (res.success) {
        toast.success("Activity logged");
        setEventTitle("");
        setEventDescription("");
        setEventDate("");
        setIsAddingEvent(false);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error("Failed to log activity");
    }
  };

  const handleDeleteTimelineEvent = async (id: string) => {
    try {
      await deleteTimelineEvent(id);
      toast.success("Activity removed");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to remove activity");
    }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewTitle.trim() || !interviewDate) return;

    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime || "10:00"}`);
      const res = await addInterview(application.id, {
        title: interviewTitle.trim(),
        round: interviewRound,
        scheduledAt,
        durationMin: interviewDuration,
        interviewer: interviewerName.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        location: interviewLocation,
      });

      if (res.success) {
        toast.success("Interview scheduled & added to calendar");
        setIsAddingInterview(false);
        setInterviewTitle("Technical Interview");
        setInterviewerName("");
        setMeetingLink("");
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error("Failed to schedule interview");
    }
  };

  const handleToggleInterview = async (id: string, completed: boolean) => {
    try {
      await toggleInterviewComplete(id, completed);
      toast.success(completed ? "Interview marked as completed" : "Interview marked as pending");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to update interview status");
    }
  };

  const handleDeleteInterview = async (id: string) => {
    try {
      await deleteInterview(id);
      toast.success("Interview deleted");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to delete interview");
    }
  };

  const handleCreateAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim() || !attachmentUrl.trim()) return;

    try {
      const res = await addAttachment(application.id, {
        name: attachmentName.trim(),
        fileUrl: attachmentUrl.trim(),
        fileType: attachmentType,
      });

      if (res.success) {
        toast.success("Document attached");
        setAttachmentName("");
        setAttachmentUrl("");
        setIsAddingAttachment(false);
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      toast.error("Failed to add attachment");
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      await deleteAttachment(id);
      toast.success("Attachment removed");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to remove attachment");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-card border-l border-border/80">
        {/* Drawer Header */}
        <div className="p-6 pb-4 border-b border-border/60 bg-secondary/20 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <CompanyAvatar
                company={application.company}
                customLogoUrl={application.logoUrl}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold font-serif-luxury leading-snug text-foreground">
                  {application.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{application.company}</span>
                  {application.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {application.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="iconSm"
                variant="outline"
                onClick={() => onEdit(application)}
                title="Edit Application"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="iconSm"
                variant="destructive"
                onClick={() => onDelete(application)}
                title="Delete Application"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subheader Details Pill Row */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/40">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                Stage:
              </span>
              <Select
                value={application.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-7 px-2.5 text-xs font-semibold rounded-full border border-border">
                  <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${statusConfig.dotClass}`} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                  <SelectItem value="OFFER">Offer / Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Work Type Badge */}
            <Badge variant="outline" className="text-xs py-0.5 px-2 font-medium">
              <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
              {WORK_TYPE_CONFIG[application.workType as keyof typeof WORK_TYPE_CONFIG]?.label || application.workType}
            </Badge>

            {/* Priority Badge */}
            {application.priority && (
              <Badge
                variant="outline"
                className={`text-xs py-0.5 px-2 font-medium ${
                  PRIORITY_CONFIG[application.priority as keyof typeof PRIORITY_CONFIG]?.badgeClass
                }`}
              >
                {PRIORITY_CONFIG[application.priority as keyof typeof PRIORITY_CONFIG]?.label}
              </Badge>
            )}

            {/* Salary */}
            {(application.salaryMin || application.salaryMax) && (
              <Badge variant="secondary" className="text-xs py-0.5 px-2 font-medium text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-3 w-3 mr-0.5" />
                {formatSalaryRange(
                  application.salaryMin,
                  application.salaryMax,
                  application.salaryCurrency
                )}
              </Badge>
            )}

            {/* External Link */}
            {application.link && (
              <a
                href={application.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium ml-auto"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Posting
              </a>
            )}
          </div>

          {/* Follow-up reminder alert if applicable */}
          {application.followUpDate && (
            <div
              className={`mt-3 p-2.5 rounded-lg flex items-center justify-between text-xs ${
                isOverdue
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-secondary/60 border border-border text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${isOverdue ? "text-amber-600 dark:text-amber-400" : "text-primary"}`} />
                <span>
                  Follow-up {isOverdue ? "Overdue!" : "Scheduled"}:{" "}
                  <strong>{formatDate(application.followUpDate)}</strong> ({formatRelative(application.followUpDate)})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkFollowUpDone}
                className="h-6 text-xs px-2 hover:bg-background/80"
              >
                <Check className="h-3 w-3 mr-1" /> Done
              </Button>
            </div>
          )}
        </div>

        {/* Drawer Tabs */}
        <div className="flex-1 p-6 pt-3 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-10 mb-4">
              <TabsTrigger value="timeline" className="text-xs gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="interviews" className="text-xs gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Interviews ({application.interviews?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Notes & Info
              </TabsTrigger>
              <TabsTrigger value="docs" className="text-xs gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Docs ({application.attachments?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: TIMELINE */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Activity & Milestones
                </h4>
                {!isAddingEvent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingEvent(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" /> Log Activity
                  </Button>
                )}
              </div>

              {/* Add Activity Form */}
              {isAddingEvent && (
                <form
                  onSubmit={handleCreateTimelineEvent}
                  className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Log New Event / Note</span>
                    <Button
                      type="button"
                      size="iconSm"
                      variant="ghost"
                      onClick={() => setIsAddingEvent(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue placeholder="Event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOTE">Note</SelectItem>
                        <SelectItem value="CALL">Phone Call</SelectItem>
                        <SelectItem value="EMAIL">Email Update</SelectItem>
                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                        <SelectItem value="OFFER">Offer</SelectItem>
                        <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                  <Input
                    placeholder="Headline (e.g. Recruiter phone screen completed)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="h-8 text-xs bg-card"
                    required
                  />
                  <Textarea
                    placeholder="Details, feedback, or next steps..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="text-xs bg-card"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingEvent(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" variant="luxury" className="h-7 text-xs">
                      Save Event
                    </Button>
                  </div>
                </form>
              )}

              {/* Timeline List */}
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {application.timelineEvents && application.timelineEvents.length > 0 ? (
                  application.timelineEvents.map((evt) => {
                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline node */}
                        <div className="absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 border-card bg-primary shadow-xs ring-4 ring-background" />

                        <div className="p-3 rounded-xl border border-border/70 bg-card hover:bg-secondary/20 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {evt.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(evt.eventDate)} ({formatRelative(evt.eventDate)})
                              </span>
                            </div>
                            <Button
                              size="iconSm"
                              variant="ghost"
                              onClick={() => handleDeleteTimelineEvent(evt.id)}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-rose-500 transition-opacity"
                              title="Delete event"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {evt.description && (
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No timeline events yet. Add your first note or status update above.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: INTERVIEWS */}
            <TabsContent value="interviews" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Scheduled Interviews
                </h4>
                {!isAddingInterview && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingInterview(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" /> Schedule Round
                  </Button>
                )}
              </div>

              {/* Schedule Interview Form */}
              {isAddingInterview && (
                <form
                  onSubmit={handleCreateInterview}
                  className="p-4 rounded-xl border border-sky-500/30 bg-sky-50/20 dark:bg-sky-950/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Schedule Interview Round</span>
                    <Button
                      type="button"
                      size="iconSm"
                      variant="ghost"
                      onClick={() => setIsAddingInterview(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Round Title (e.g. System Design)"
                        value={interviewTitle}
                        onChange={(e) => setInterviewTitle(e.target.value)}
                        className="h-8 text-xs bg-card"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Round #"
                        value={interviewRound}
                        onChange={(e) => setInterviewRound(Number(e.target.value))}
                        className="h-8 text-xs bg-card"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="h-8 text-xs bg-card"
                      required
                    />
                    <Input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="h-8 text-xs bg-card"
                    />
                    <Select
                      value={interviewDuration.toString()}
                      onValueChange={(val) => setInterviewDuration(Number(val))}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Interviewer Name(s)"
                      value={interviewerName}
                      onChange={(e) => setInterviewerName(e.target.value)}
                      className="h-8 text-xs bg-card"
                    />
                    <Input
                      placeholder="Meeting URL (Zoom/Meet)"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="h-8 text-xs bg-card"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingInterview(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" variant="luxury" className="h-7 text-xs">
                      Confirm Schedule
                    </Button>
                  </div>
                </form>
              )}

              {/* Interview Rounds List */}
              <div className="space-y-3">
                {application.interviews && application.interviews.length > 0 ? (
                  application.interviews.map((interview) => {
                    return (
                      <div
                        key={interview.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          interview.completed
                            ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 opacity-75"
                            : "border-border bg-card shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleInterview(interview.id, !interview.completed)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                interview.completed
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-border hover:border-foreground/50"
                              }`}
                              title={interview.completed ? "Mark pending" : "Mark completed"}
                            >
                              {interview.completed && <Check className="h-3.5 w-3.5" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {interview.title}
                                </span>
                                {interview.round && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                    Round {interview.round}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  {formatDate(interview.scheduledAt, "EEEE, MMM d, yyyy • h:mm a")}
                                </span>
                                <span>({interview.durationMin}m)</span>
                                {interview.interviewer && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {interview.interviewer}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {interview.meetingLink && (
                              <a
                                href={interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-xs"
                              >
                                <Video className="h-3.5 w-3.5" /> Join Call
                              </a>
                            )}
                            <Button
                              size="iconSm"
                              variant="ghost"
                              onClick={() => handleDeleteInterview(interview.id)}
                              className="text-muted-foreground hover:text-rose-500 h-7 w-7"
                              title="Delete interview"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No interviews scheduled yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: DETAILS & NOTES */}
            <TabsContent value="details" className="space-y-4">
              {/* Tags */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Applied Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {application.tags && application.tags.length > 0 ? (
                    application.tags.map((t) => (
                      <span
                        key={t.tag.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.tag.color }}
                        />
                        {t.tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Recruiter / Contact info */}
              {(application.contactName || application.contactEmail) && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Point of Contact
                  </h4>
                  <div className="text-xs space-y-1">
                    {application.contactName && (
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {application.contactName}{" "}
                        {application.contactRole && (
                          <span className="font-normal text-muted-foreground">({application.contactRole})</span>
                        )}
                      </p>
                    )}
                    {application.contactEmail && (
                      <a
                        href={`mailto:${application.contactEmail}`}
                        className="text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {application.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Full Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes & Details
                </h4>
                <div className="p-4 rounded-xl border border-border/80 bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {application.notes ? application.notes : "No notes recorded yet."}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Applied on {formatDate(application.dateApplied)}</span>
                <span>Last updated {formatRelative(application.updatedAt)}</span>
              </div>
            </TabsContent>

            {/* TAB 4: ATTACHMENTS */}
            <TabsContent value="docs" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attached Documents & Links
                </h4>
                {!isAddingAttachment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingAttachment(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Link / File
                  </Button>
                )}
              </div>

              {/* Add Attachment Form */}
              {isAddingAttachment && (
                <form
                  onSubmit={handleCreateAttachment}
                  className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Attach File or Link</span>
                    <Button
                      type="button"
                      size="iconSm"
                      variant="ghost"
                      onClick={() => setIsAddingAttachment(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Title (e.g. Frontend Resume v4)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="h-8 text-xs bg-card"
                      required
                    />
                    <Select value={attachmentType} onValueChange={setAttachmentType}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESUME">Resume Version</SelectItem>
                        <SelectItem value="COVER_LETTER">Cover Letter</SelectItem>
                        <SelectItem value="PORTFOLIO">Portfolio / Demo</SelectItem>
                        <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="URL (e.g. https://drive.google.com/... or GitHub link)"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="h-8 text-xs bg-card"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingAttachment(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" variant="luxury" className="h-7 text-xs">
                      Attach
                    </Button>
                  </div>
                </form>
              )}

              {/* Attachments List */}
              <div className="space-y-2">
                {application.attachments && application.attachments.length > 0 ? (
                  application.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{att.name}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {att.fileType || "Document"} • Added {formatDate(att.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-primary hover:bg-secondary"
                          title="Open document"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                          title="Delete attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No documents attached yet. Add your resume, portfolio link, or offer letter.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
