"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApplicationWithRelations,
  TagData,
  ApplicationStatus,
  WorkType,
  Priority,
} from "@/lib/types";
import { createApplication, updateApplication, createTag } from "@/app/actions/applications";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Globe,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Tag as TagIcon,
  User,
  X,
} from "lucide-react";
import { addDays, format } from "date-fns";
import confetti from "canvas-confetti";

const formSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Job title is required"),
  location: z.string().optional().nullable(),
  workType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).default("REMOTE"),
  status: z.enum(["APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"]).default("APPLIED"),
  dateApplied: z.string().min(1, "Date applied is required"),
  salaryMin: z.coerce.number().optional().nullable(),
  salaryMax: z.coerce.number().optional().nullable(),
  salaryCurrency: z.string().default("USD"),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  contactRole: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "DREAM"]).default("MEDIUM"),
  rating: z.coerce.number().min(1).max(5).default(3),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ApplicationWithRelations | null;
  allTags: TagData[];
  onSuccess?: (app: any) => void;
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  initialData,
  allTags: initialTags,
  onSuccess,
}: ApplicationFormModalProps) {
  const [tags, setTags] = React.useState<TagData[]>(initialTags || []);
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");
  const [newTagColor, setNewTagColor] = React.useState("#10b981");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEdit = !!initialData;

  const defaultDate = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      title: "",
      location: "",
      workType: "REMOTE",
      status: "APPLIED",
      dateApplied: defaultDate,
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: "USD",
      link: "",
      notes: "",
      followUpDate: "",
      contactName: "",
      contactEmail: "",
      contactRole: "",
      priority: "MEDIUM",
      rating: 3,
      tagIds: [],
    },
  });

  React.useEffect(() => {
    setTags(initialTags || []);
  }, [initialTags]);

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        company: initialData.company,
        title: initialData.title,
        location: initialData.location || "",
        workType: (initialData.workType as WorkType) || "REMOTE",
        status: (initialData.status as ApplicationStatus) || "APPLIED",
        dateApplied: initialData.dateApplied
          ? format(new Date(initialData.dateApplied), "yyyy-MM-dd")
          : defaultDate,
        salaryMin: initialData.salaryMin || undefined,
        salaryMax: initialData.salaryMax || undefined,
        salaryCurrency: initialData.salaryCurrency || "USD",
        link: initialData.link || "",
        notes: initialData.notes || "",
        followUpDate: initialData.followUpDate
          ? format(new Date(initialData.followUpDate), "yyyy-MM-dd")
          : "",
        contactName: initialData.contactName || "",
        contactEmail: initialData.contactEmail || "",
        contactRole: initialData.contactRole || "",
        priority: (initialData.priority as Priority) || "MEDIUM",
        rating: initialData.rating || 3,
        tagIds: initialData.tags ? initialData.tags.map((t) => t.tag.id) : [],
      });
    } else {
      form.reset({
        company: "",
        title: "",
        location: "",
        workType: "REMOTE",
        status: "APPLIED",
        dateApplied: defaultDate,
        salaryMin: undefined,
        salaryMax: undefined,
        salaryCurrency: "USD",
        link: "",
        notes: "",
        followUpDate: "",
        contactName: "",
        contactEmail: "",
        contactRole: "",
        priority: "MEDIUM",
        rating: 3,
        tagIds: [],
      });
    }
  }, [initialData, open, form, defaultDate]);

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await createTag(newTagName.trim(), newTagColor);
      if (res.success && res.data) {
        const created = res.data as TagData;
        setTags((prev) => [...prev.filter((t) => t.id !== created.id), created]);
        const currentSelected = form.getValues("tagIds");
        form.setValue("tagIds", [...currentSelected, created.id]);
        setNewTagName("");
        setIsCreatingTag(false);
        toast.success(`Tag "${created.name}" created!`);
      }
    } catch (e: any) {
      toast.error("Failed to create tag");
    }
  };

  const toggleTag = (tagId: string) => {
    const current = form.getValues("tagIds");
    if (current.includes(tagId)) {
      form.setValue(
        "tagIds",
        current.filter((id) => id !== tagId)
      );
    } else {
      form.setValue("tagIds", [...current, tagId]);
    }
  };

  const setQuickFollowUp = (days: number) => {
    const target = addDays(new Date(), days);
    form.setValue("followUpDate", format(target, "yyyy-MM-dd"));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        const res = await updateApplication(initialData.id, values as any);
        if (res.success) {
          toast.success(`Updated ${values.company} application`, {
            description: "All changes and activity history have been saved.",
          });
          onOpenChange(false);
          if (onSuccess) onSuccess(res.data);
        } else {
          toast.error(res.error || "Failed to update application");
        }
      } else {
        const res = await createApplication(values as any);
        if (res.success) {
          if (values.status === "OFFER") {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          toast.success(`Tracked application for ${values.company}!`, {
            description: `Position: ${values.title}`,
          });
          onOpenChange(false);
          if (onSuccess) onSuccess(res.data);
        } else {
          toast.error(res.error || "Failed to create application");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTagIds = form.watch("tagIds");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            {isEdit ? "Edit Application" : "Track New Application"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update company info, stage, salary details, and notes."
              : "Add a new role to your tracking pipeline with details, salary, and notes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Row 1: Company & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("company")}
                  placeholder="e.g. Stripe, Linear, Apple"
                  className="pl-9"
                />
              </div>
              {form.formState.errors.company && (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.company.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("title")}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="pl-9"
                />
              </div>
              {form.formState.errors.title && (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Status & Work Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Stage
              </label>
              <Select
                value={form.watch("status")}
                onValueChange={(val) => form.setValue("status", val as ApplicationStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLIED">Applied / Pending</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                  <SelectItem value="OFFER">Offer / Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work Type
              </label>
              <Select
                value={form.watch("workType")}
                onValueChange={(val) => form.setValue("workType", val as WorkType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <Select
                value={form.watch("priority")}
                onValueChange={(val) => form.setValue("priority", val as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="DREAM">Dream Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Location & Application URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("location")}
                  placeholder="e.g. San Francisco, CA or Remote - US"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Job Posting / Referral Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("link")}
                  type="url"
                  placeholder="https://..."
                  className="pl-9"
                />
              </div>
              {form.formState.errors.link && (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.link.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Dates (Date Applied & Follow-up Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Date Applied
              </label>
              <Input
                type="date"
                {...form.register("dateApplied")}
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" /> Follow-Up Reminder
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(3)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(7)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium"
                  >
                    +1w
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(14)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium"
                  >
                    +2w
                  </button>
                </div>
              </div>
              <Input
                type="date"
                {...form.register("followUpDate")}
                className="bg-card"
              />
            </div>
          </div>

          {/* Row 5: Salary Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Target / Offered Compensation
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">Min $</span>
                <Input
                  type="number"
                  {...form.register("salaryMin")}
                  placeholder="150000"
                  className="pl-14"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">Max $</span>
                <Input
                  type="number"
                  {...form.register("salaryMax")}
                  placeholder="190000"
                  className="pl-14"
                />
              </div>
              <Select
                value={form.watch("salaryCurrency")}
                onValueChange={(val) => form.setValue("salaryCurrency", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: Tags Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-purple-500" /> Tags & Labels
              </label>
              {!isCreatingTag && (
                <button
                  type="button"
                  onClick={() => setIsCreatingTag(true)}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New Tag
                </button>
              )}
            </div>

            {isCreatingTag && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/30 bg-primary/5">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name (e.g. Dream Job, Referral)"
                  className="h-8 text-xs bg-card"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border border-border"
                  title="Pick tag color"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="luxury"
                  onClick={handleCreateNewTag}
                  className="h-8 text-xs"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="iconSm"
                  variant="ghost"
                  onClick={() => setIsCreatingTag(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-foreground text-background shadow-xs ring-1 ring-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/80"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 7: Recruiter / Contact Details */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-500" /> Primary Contact / Recruiter (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                {...form.register("contactName")}
                placeholder="Contact Name"
                className="text-xs"
              />
              <Input
                {...form.register("contactRole")}
                placeholder="Role (e.g. Lead Recruiter)"
                className="text-xs"
              />
              <Input
                {...form.register("contactEmail")}
                placeholder="Email Address"
                type="email"
                className="text-xs"
              />
            </div>
          </div>

          {/* Row 8: Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes & Key Highlights
            </label>
            <Textarea
              {...form.register("notes")}
              placeholder="Notes on the team, tech stack, referral details, interview tips, etc."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="luxury"
              disabled={isSubmitting}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isEdit ? "Save Changes" : "Track Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
