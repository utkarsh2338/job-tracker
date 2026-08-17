import { prisma } from "@/lib/prisma";
import { ApplicationWithRelations, ApplicationStats, TagData, InterviewData } from "@/lib/types";

export async function getApplications(params?: {
  search?: string;
  status?: string;
  workType?: string;
  tagId?: string;
  sortBy?: "dateApplied" | "company" | "salaryMax" | "status" | "priority" | "orderIndex";
  sortOrder?: "asc" | "desc";
}): Promise<ApplicationWithRelations[]> {
  try {
    const { search, status, workType, tagId, sortBy = "dateApplied", sortOrder = "desc" } = params || {};

    const where: any = {};

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { company: { contains: q } },
        { title: { contains: q } },
        { location: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (workType && workType !== "ALL") {
      where.workType = workType;
    }

    if (tagId && tagId !== "ALL") {
      where.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    const orderBy: any = {};
    if (sortBy === "salaryMax") {
      orderBy.salaryMax = sortOrder;
    } else if (sortBy === "company") {
      orderBy.company = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else if (sortBy === "priority") {
      orderBy.priority = sortOrder;
    } else if (sortBy === "orderIndex") {
      orderBy.orderIndex = sortOrder;
    } else {
      orderBy.dateApplied = sortOrder;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        timelineEvents: {
          orderBy: {
            eventDate: "desc",
          },
        },
        interviews: {
          orderBy: {
            scheduledAt: "asc",
          },
        },
        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return applications as unknown as ApplicationWithRelations[];
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

export async function getApplicationById(id: string): Promise<ApplicationWithRelations | null> {
  try {
    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        timelineEvents: {
          orderBy: {
            eventDate: "desc",
          },
        },
        interviews: {
          orderBy: {
            scheduledAt: "asc",
          },
        },
        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return app as unknown as ApplicationWithRelations | null;
  } catch (error) {
    console.error("Error fetching application by id:", error);
    return null;
  }
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  try {
    const apps = await prisma.application.findMany({
      select: {
        id: true,
        status: true,
        followUpDate: true,
        salaryMax: true,
        interviews: {
          select: {
            id: true,
            completed: true,
            scheduledAt: true,
          },
        },
      },
    });

    const total = apps.length;
    const applied = apps.filter((a) => a.status === "APPLIED").length;
    const screening = apps.filter((a) => a.status === "SCREENING").length;
    const interviewing = apps.filter((a) => a.status === "INTERVIEWING").length;
    const offer = apps.filter((a) => a.status === "OFFER").length;
    const rejected = apps.filter((a) => a.status === "REJECTED").length;
    const archived = apps.filter((a) => a.status === "ARCHIVED").length;

    const now = new Date();
    const needsFollowUp = apps.filter((a) => {
      if (!a.followUpDate) return false;
      const d = new Date(a.followUpDate);
      return d <= now && a.status !== "OFFER" && a.status !== "REJECTED" && a.status !== "ARCHIVED";
    }).length;

    const interviewScheduledCount = apps.reduce((sum, a) => {
      const activeInterviews = a.interviews.filter((i) => !i.completed && new Date(i.scheduledAt) >= now);
      return sum + activeInterviews.length;
    }, 0);

    const respondedCount = screening + interviewing + offer + rejected;
    const responseRate = total > 0 ? Math.round((respondedCount / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round((offer / total) * 100) : 0;

    const salaries = apps.map((a) => a.salaryMax).filter((s): s is number => typeof s === "number" && s > 0);
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null;

    return {
      total,
      applied,
      screening,
      interviewing,
      offer,
      rejected,
      archived,
      needsFollowUp,
      interviewScheduledCount,
      responseRate,
      offerRate,
      avgSalary,
    };
  } catch (error) {
    console.error("Error computing application stats:", error);
    return {
      total: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      archived: 0,
      needsFollowUp: 0,
      interviewScheduledCount: 0,
      responseRate: 0,
      offerRate: 0,
      avgSalary: null,
    };
  }
}

export async function getAllTags(): Promise<TagData[]> {
  try {
    return await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function getAllInterviews() {
  try {
    return await prisma.interview.findMany({
      include: {
        application: {
          select: {
            id: true,
            company: true,
            title: true,
            status: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching all interviews:", error);
    return [];
  }
}
