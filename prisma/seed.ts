import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Clean] Removing all existing application data...");
  await prisma.attachment.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.applicationTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();

  console.log("[Clean] Creating default starter tags...");
  const starterTags = [
    { name: "Dream Job", color: "#8b5cf6" },
    { name: "Remote", color: "#10b981" },
    { name: "Tier 1", color: "#f59e0b" },
    { name: "Referral", color: "#06b6d4" },
    { name: "High Comp", color: "#ec4899" },
    { name: "AI / ML", color: "#6366f1" },
    { name: "Fintech", color: "#3b82f6" },
    { name: "Design-Driven", color: "#14b8a6" },
  ];

  for (const t of starterTags) {
    await prisma.tag.create({ data: t });
  }

  console.log("[Clean] Database is now completely clean and ready for your own applications!");
}

main()
  .catch((e) => {
    console.error("[Clean] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
