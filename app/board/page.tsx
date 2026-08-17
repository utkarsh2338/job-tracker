import { getApplications, getApplicationStats, getAllTags } from "@/lib/data";
import { BoardViewWrapper } from "@/components/board/board-view-wrapper";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const [applications, stats, tags] = await Promise.all([
    getApplications(),
    getApplicationStats(),
    getAllTags(),
  ]);

  return (
    <BoardViewWrapper
      initialApplications={applications}
      initialStats={stats}
      initialTags={tags}
    />
  );
}
