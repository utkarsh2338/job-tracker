export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

export type WorkType = "REMOTE" | "HYBRID" | "ONSITE";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "DREAM";

export interface TagData {
  id: string;
  name: string;
  color: string;
}

export interface TimelineEventData {
  id: string;
  applicationId: string;
  type: string;
  title: string;
  description: string | null;
  eventDate: string | Date;
  createdAt: string | Date;
}

export interface InterviewData {
  id: string;
  applicationId: string;
  title: string;
  round?: number | null;
  scheduledAt: string | Date;
  durationMin: number;
  location?: string | null;
  meetingLink?: string | null;
  interviewer?: string | null;
  notes?: string | null;
  completed: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AttachmentData {
  id: string;
  applicationId: string;
  name: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string | Date;
}

export interface ApplicationWithRelations {
  id: string;
  userId?: string | null;
  company: string;
  title: string;
  location: string | null;
  workType: string;
  status: string;
  dateApplied: string | Date;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  link: string | null;
  notes: string | null;
  followUpDate: string | Date | null;
  logoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactRole: string | null;
  priority: string;
  rating: number;
  orderIndex: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags: {
    tag: TagData;
  }[];
  timelineEvents: TimelineEventData[];
  interviews: InterviewData[];
  attachments: AttachmentData[];
}

export interface ApplicationStats {
  total: number;
  applied: number;
  screening: number;
  interviewing: number;
  offer: number;
  rejected: number;
  archived: number;
  needsFollowUp: number;
  interviewScheduledCount: number;
  responseRate: number; // percentage
  offerRate: number; // percentage
  avgSalary: number | null;
}
