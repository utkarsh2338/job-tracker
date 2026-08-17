import { getApplications, getApplicationStats, getAllTags } from "@/lib/data";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [applications, stats, tags] = await Promise.all([
    getApplications(),
    getApplicationStats(),
    getAllTags(),
  ]);

  return (
    <SettingsView
      initialApplications={applications}
      initialStats={stats}
      initialTags={tags}
    />
  );
}
