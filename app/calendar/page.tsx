import { getApplications, getApplicationStats, getAllTags } from "@/lib/data";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [applications, stats, tags] = await Promise.all([
    getApplications(),
    getApplicationStats(),
    getAllTags(),
  ]);

  return (
    <CalendarView
      initialApplications={applications}
      initialStats={stats}
      initialTags={tags}
    />
  );
}
