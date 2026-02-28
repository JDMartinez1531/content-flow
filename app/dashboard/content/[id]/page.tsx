import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ContentDetailClient } from "./ContentDetailClient";
import type { ExtendedSession } from "@/lib/auth";

/**
 * Content detail page — edit, select caption, schedule
 * Server component fetches data, client component handles interactions
 */
export default async function ContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = (await auth()) as ExtendedSession;

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch content item with captions and hashtags
  const item = await db.query.contentItems.findFirst({
    where: and(
      eq(contentItems.id, params.id),
      eq(contentItems.userId, session.user.id)
    ),
    with: {
      captions: true,
      hashtags: true,
    },
  });

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Not Found</h1>
        <p className="text-slate-600 mb-6">
          This content item doesn't exist or you don't have access to it.
        </p>
        <a
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Dashboard
        </a>
      </div>
    );
  }

  return <ContentDetailClient item={item} />;
}
