import { z } from "zod";

export const applicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Job title is required"),
  location: z.string().optional().nullable(),
  workType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).default("REMOTE"),
  status: z.enum(["APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"]).default("APPLIED"),
  dateApplied: z.string().or(z.date()).default(() => new Date()),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  salaryCurrency: z.string().default("USD"),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  followUpDate: z.string().or(z.date()).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  contactRole: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "DREAM"]).default("MEDIUM"),
  rating: z.number().min(1).max(5).default(3),
  tagIds: z.array(z.string()).default([]),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
