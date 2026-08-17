"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { subDays, addDays } from "date-fns";

export async function importApplicationsFromParsedCSV(
  rows: Array<{
    company: string;
    title: string;
    location?: string;
    workType?: string;
    status?: string;
    dateApplied?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    link?: string;
    notes?: string;
    tags?: string;
  }>
) {
  try {
    let importedCount = 0;

    for (const row of rows) {
      if (!row.company || !row.title) continue;

      const dateApplied = row.dateApplied ? new Date(row.dateApplied) : new Date();
      const status = row.status || "APPLIED";
      const workType = row.workType || "REMOTE";

      // Process tags
      const tagNames = row.tags
        ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const createdApp = await prisma.application.create({
        data: {
          company: row.company,
          title: row.title,
          location: row.location || null,
          workType: ["REMOTE", "HYBRID", "ONSITE"].includes(workType) ? workType : "REMOTE",
          status: ["APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"].includes(status)
            ? status
            : "APPLIED",
          dateApplied,
          salaryMin: row.salaryMin || null,
          salaryMax: row.salaryMax || null,
          salaryCurrency: row.salaryCurrency || "USD",
          link: row.link || null,
          notes: row.notes || null,
          timelineEvents: {
            create: [
              {
                type: "STATUS_CHANGE",
                title: "Imported via CSV",
                description: `Imported application record with initial status ${status}.`,
                eventDate: dateApplied,
              },
            ],
          },
        },
      });

      // Link tags
      for (const tagName of tagNames) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, color: "#10b981" },
        });

        await prisma.applicationTag.create({
          data: {
            applicationId: createdApp.id,
            tagId: tag.id,
          },
        });
      }

      importedCount++;
    }

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error("CSV import failed:", error);
    return { success: false, error: error.message || "Failed to import CSV" };
  }
}

export async function resetAndSeedDatabase() {
  try {
    await prisma.attachment.deleteMany();
    await prisma.timelineEvent.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.applicationTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();

    const tagsData = [
      { name: "Dream Job", color: "#8b5cf6" },
      { name: "Remote", color: "#10b981" },
      { name: "Tier 1", color: "#f59e0b" },
      { name: "Referral", color: "#06b6d4" },
      { name: "High Comp", color: "#ec4899" },
      { name: "AI / ML", color: "#6366f1" },
      { name: "Fintech", color: "#3b82f6" },
      { name: "Design-Driven", color: "#14b8a6" },
    ];

    const createdTags: Record<string, string> = {};
    for (const t of tagsData) {
      const tag = await prisma.tag.create({ data: t });
      createdTags[t.name] = tag.id;
    }

    // Stripe
    await prisma.application.create({
      data: {
        company: "Stripe",
        title: "Senior Frontend Engineer - Billing Platform",
        location: "San Francisco, CA (Remote Option)",
        workType: "REMOTE",
        status: "OFFER",
        dateApplied: subDays(new Date(), 28),
        salaryMin: 185000,
        salaryMax: 215000,
        salaryCurrency: "USD",
        link: "https://stripe.com/jobs/senior-frontend-engineer",
        notes: "Met with Sarah Jenkins from Billing infra. Strong emphasis on financial correctness, micro-frontends, and performance benchmarks.",
        followUpDate: addDays(new Date(), 2),
        priority: "DREAM",
        rating: 5,
        contactName: "Sarah Jenkins",
        contactEmail: "sarah.j@stripe.com",
        contactRole: "Engineering Director",
        tags: {
          create: [
            { tagId: createdTags["Dream Job"] },
            { tagId: createdTags["Remote"] },
            { tagId: createdTags["Fintech"] },
            { tagId: createdTags["High Comp"] },
          ],
        },
        timelineEvents: {
          create: [
            {
              type: "STATUS_CHANGE",
              title: "Application Submitted",
              eventDate: subDays(new Date(), 28),
            },
            {
              type: "OFFER",
              title: "Written Offer Received",
              description: "Base $200k + $80k equity/yr + $25k sign-on.",
              eventDate: subDays(new Date(), 2),
            },
          ],
        },
        interviews: {
          create: [
            {
              title: "Offer Negotiation & Team Match Call",
              round: 5,
              scheduledAt: addDays(new Date(), 1),
              durationMin: 30,
              location: "Google Meet",
              meetingLink: "https://meet.google.com/abc-xyz-str",
              interviewer: "Marcus Vance",
            },
          ],
        },
      },
    });

    // Linear
    await prisma.application.create({
      data: {
        company: "Linear",
        title: "Product Engineer - Core Web",
        location: "San Francisco / Remote",
        workType: "REMOTE",
        status: "INTERVIEWING",
        dateApplied: subDays(new Date(), 18),
        salaryMin: 170000,
        salaryMax: 200000,
        salaryCurrency: "USD",
        link: "https://linear.app/careers/product-engineer",
        notes: "Obsessed with keyboard shortcuts, instant sync, and ultra-fast UI rendering.",
        followUpDate: addDays(new Date(), 3),
        priority: "DREAM",
        rating: 5,
        tags: {
          create: [
            { tagId: createdTags["Dream Job"] },
            { tagId: createdTags["Remote"] },
            { tagId: createdTags["Design-Driven"] },
          ],
        },
        interviews: {
          create: [
            {
              title: "Live Pairing & Architecture Session",
              round: 2,
              scheduledAt: addDays(new Date(), 2),
              durationMin: 60,
              location: "Zoom",
              meetingLink: "https://zoom.us/j/9876543210",
              interviewer: "Karri Saarinen & Tuomas",
            },
          ],
        },
      },
    });

    // Vercel
    await prisma.application.create({
      data: {
        company: "Vercel",
        title: "Senior Framework Engineer (Next.js)",
        location: "Remote - Worldwide",
        workType: "REMOTE",
        status: "INTERVIEWING",
        dateApplied: subDays(new Date(), 22),
        salaryMin: 165000,
        salaryMax: 195000,
        salaryCurrency: "USD",
        link: "https://vercel.com/careers",
        notes: "Role focused on App Router performance and Server Actions.",
        followUpDate: addDays(new Date(), 4),
        priority: "HIGH",
        rating: 5,
        tags: {
          create: [
            { tagId: createdTags["Tier 1"] },
            { tagId: createdTags["Remote"] },
          ],
        },
        interviews: {
          create: [
            {
              title: "VP of Product Conversation",
              round: 3,
              scheduledAt: addDays(new Date(), 4),
              durationMin: 45,
              location: "Google Meet",
              meetingLink: "https://meet.google.com/vcl-eng-chat",
              interviewer: "Lee Robinson",
            },
          ],
        },
      },
    });

    // Anthropic
    await prisma.application.create({
      data: {
        company: "Anthropic",
        title: "Frontend Systems Engineer - Claude Artifacts",
        location: "San Francisco, CA",
        workType: "HYBRID",
        status: "SCREENING",
        dateApplied: subDays(new Date(), 9),
        salaryMin: 210000,
        salaryMax: 260000,
        salaryCurrency: "USD",
        link: "https://anthropic.com/careers",
        notes: "Building execution playground for Claude.",
        followUpDate: addDays(new Date(), 1),
        priority: "DREAM",
        rating: 5,
        tags: {
          create: [
            { tagId: createdTags["AI / ML"] },
            { tagId: createdTags["High Comp"] },
          ],
        },
        interviews: {
          create: [
            {
              title: "Initial Recruiter Screen",
              round: 1,
              scheduledAt: addDays(new Date(), 1),
              durationMin: 30,
              location: "Google Meet",
              meetingLink: "https://meet.google.com/ant-scr",
              interviewer: "Elena Rostova",
            },
          ],
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
