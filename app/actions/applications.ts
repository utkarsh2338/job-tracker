"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { applicationSchema, ApplicationInput } from "@/lib/schemas";

export async function createApplication(input: ApplicationInput) {
  try {
    const validated = applicationSchema.parse(input);
    const dateApplied = new Date(validated.dateApplied);
    const followUpDate = validated.followUpDate ? new Date(validated.followUpDate) : null;

    const newApp = await prisma.application.create({
      data: {
        company: validated.company,
        title: validated.title,
        location: validated.location || null,
        workType: validated.workType,
        status: validated.status,
        dateApplied,
        salaryMin: validated.salaryMin || null,
        salaryMax: validated.salaryMax || null,
        salaryCurrency: validated.salaryCurrency || "USD",
        link: validated.link || null,
        notes: validated.notes || null,
        followUpDate,
        logoUrl: validated.logoUrl || null,
        contactName: validated.contactName || null,
        contactEmail: validated.contactEmail || null,
        contactRole: validated.contactRole || null,
        priority: validated.priority,
        rating: validated.rating,
        tags: {
          create: validated.tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        timelineEvents: {
          create: [
            {
              type: "STATUS_CHANGE",
              title: "Application Tracked",
              description: `Initial status set to ${validated.status}.`,
              eventDate: dateApplied,
            },
          ],
        },
      },
      include: {
        tags: { include: { tag: true } },
        timelineEvents: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true, data: newApp };
  } catch (error: any) {
    console.error("Error creating application:", error);
    return { success: false, error: error.message || "Failed to create application" };
  }
}

export async function updateApplication(id: string, input: Partial<ApplicationInput>) {
  try {
    const current = await prisma.application.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!current) throw new Error("Application not found");

    const updateData: any = {};
    if (input.company !== undefined) updateData.company = input.company;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.location !== undefined) updateData.location = input.location || null;
    if (input.workType !== undefined) updateData.workType = input.workType;
    if (input.dateApplied !== undefined) updateData.dateApplied = new Date(input.dateApplied);
    if (input.salaryMin !== undefined) updateData.salaryMin = input.salaryMin || null;
    if (input.salaryMax !== undefined) updateData.salaryMax = input.salaryMax || null;
    if (input.salaryCurrency !== undefined) updateData.salaryCurrency = input.salaryCurrency;
    if (input.link !== undefined) updateData.link = input.link || null;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.followUpDate !== undefined) updateData.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl || null;
    if (input.contactName !== undefined) updateData.contactName = input.contactName || null;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail || null;
    if (input.contactRole !== undefined) updateData.contactRole = input.contactRole || null;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.rating !== undefined) updateData.rating = input.rating;

    // Handle tag synchronization if provided
    if (input.tagIds !== undefined) {
      await prisma.applicationTag.deleteMany({
        where: { applicationId: id },
      });
      updateData.tags = {
        create: input.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      };
    }

    // Status change auto-logging
    if (input.status !== undefined && input.status !== current.status) {
      updateData.status = input.status;
      await prisma.timelineEvent.create({
        data: {
          applicationId: id,
          type: "STATUS_CHANGE",
          title: `Status changed to ${input.status}`,
          description: `Moved from ${current.status} to ${input.status}.`,
          eventDate: new Date(),
        },
      });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
        timelineEvents: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating application:", error);
    return { success: false, error: error.message || "Failed to update application" };
  }
}

export async function updateApplicationStatus(id: string, newStatus: string) {
  try {
    const current = await prisma.application.findUnique({
      where: { id },
      select: { status: true, company: true, title: true },
    });

    if (!current) throw new Error("Application not found");
    if (current.status === newStatus) return { success: true };

    await prisma.application.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.timelineEvent.create({
      data: {
        applicationId: id,
        type: "STATUS_CHANGE",
        title: `Moved to ${newStatus}`,
        description: `Stage shifted from ${current.status} to ${newStatus}.`,
        eventDate: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating status:", error);
    return { success: false, error: error.message || "Failed to update status" };
  }
}

export async function deleteApplication(id: string) {
  try {
    await prisma.application.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting application:", error);
    return { success: false, error: error.message || "Failed to delete application" };
  }
}

export async function addTimelineEvent(
  applicationId: string,
  event: { type: string; title: string; description?: string; eventDate?: Date | string }
) {
  try {
    const created = await prisma.timelineEvent.create({
      data: {
        applicationId,
        type: event.type || "NOTE",
        title: event.title,
        description: event.description || null,
        eventDate: event.eventDate ? new Date(event.eventDate) : new Date(),
      },
    });

    revalidatePath("/");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Error adding timeline event:", error);
    return { success: false, error: error.message || "Failed to add timeline event" };
  }
}

export async function deleteTimelineEvent(id: string) {
  try {
    await prisma.timelineEvent.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInterview(
  applicationId: string,
  data: {
    title: string;
    round?: number;
    scheduledAt: string | Date;
    durationMin?: number;
    location?: string;
    meetingLink?: string;
    interviewer?: string;
    notes?: string;
  }
) {
  try {
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        title: data.title,
        round: data.round || 1,
        scheduledAt: new Date(data.scheduledAt),
        durationMin: data.durationMin || 45,
        location: data.location || null,
        meetingLink: data.meetingLink || null,
        interviewer: data.interviewer || null,
        notes: data.notes || null,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        applicationId,
        type: "INTERVIEW",
        title: `Interview Scheduled: ${data.title}`,
        description: `Scheduled for ${new Date(data.scheduledAt).toLocaleString()} with ${data.interviewer || "interviewer"}.`,
        eventDate: new Date(),
      },
    });

    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true, data: interview };
  } catch (error: any) {
    console.error("Error adding interview:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleInterviewComplete(id: string, completed: boolean) {
  try {
    const updated = await prisma.interview.update({
      where: { id },
      data: { completed },
    });
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInterview(id: string) {
  try {
    await prisma.interview.delete({ where: { id } });
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addAttachment(
  applicationId: string,
  data: { name: string; fileUrl: string; fileType?: string; fileSize?: number }
) {
  try {
    const attachment = await prisma.attachment.create({
      data: {
        applicationId,
        name: data.name,
        fileUrl: data.fileUrl,
        fileType: data.fileType || "RESUME",
        fileSize: data.fileSize || null,
      },
    });
    revalidatePath("/");
    return { success: true, data: attachment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAttachment(id: string) {
  try {
    await prisma.attachment.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTag(name: string, color: string = "#10b981") {
  try {
    const tag = await prisma.tag.upsert({
      where: { name: name.trim() },
      update: { color },
      create: { name: name.trim(), color },
    });
    revalidatePath("/");
    return { success: true, data: tag };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTag(id: string) {
  try {
    await prisma.tag.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
