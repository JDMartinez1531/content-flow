import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ContentList } from "./components/ContentList";
import { ScanDropboxButton } from "./components/ScanDropboxButton";

/**
 * Dashboard page — main hub for content management
 * Shows pending, scheduled, and published content
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  // Fetch content for current user
  let items: any[] = [];
  try {
    items = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.userId, (session.user as any).id || ""))
      .orderBy((t) => [t.createdAt]);
  } catch (err) {
    console.error("[dashboard] DB error:", err);
  }

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.fbStatus === "pending" || i.igStatus === "pending").length,
    published: items.filter((i) => i.fbStatus === "published" && i.igStatus === "published").length,
    failed: items.filter((i) => i.fbStatus === "failed" || i.igStatus === "failed").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h2>
        <p className="text-slate-600">
          Manage, approve, and schedule your content
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Published" value={stats.published} color="green" />
        <StatCard label="Failed" value={stats.failed} color="red" />
      </div>

      {/* Actions */}
      <div className="mb-6">
        <ScanDropboxButton />
      </div>

      {/* Content list */}
      <ContentList items={items} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number;
  color?: "blue" | "yellow" | "green" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-900",
    yellow: "bg-yellow-50 text-yellow-900",
    green: "bg-green-50 text-green-900",
    red: "bg-red-50 text-red-900",
  };

  const numberClasses = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    red: "text-red-600",
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className={`text-3xl font-bold ${numberClasses[color]}`}>{value}</p>
    </div>
  );
}
