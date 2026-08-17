import { getApplications, getApplicationStats, getAllTags } from "@/lib/data";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [applications, stats, tags] = await Promise.all([
    getApplications(),
    getApplicationStats(),
    getAllTags(),
  ]);

  return (
    <AnalyticsView
      initialApplications={applications}
      initialStats={stats}
      initialTags={tags}
    />
  );
}
