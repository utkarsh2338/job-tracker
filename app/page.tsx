import { getApplications, getApplicationStats, getAllTags } from "@/lib/data";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [applications, stats, tags] = await Promise.all([
    getApplications(),
    getApplicationStats(),
    getAllTags(),
  ]);

  return (
    <DashboardView
      initialApplications={applications}
      initialStats={stats}
      initialTags={tags}
    />
  );
}
