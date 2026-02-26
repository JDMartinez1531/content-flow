import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { and, lte } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/utils";
import type { PublishResult } from "@/lib/types";

/**
 * POST /api/publish-due
 * Called by GitHub Actions cron every 5 minutes
 * Publishes content scheduled for posting
 *
 * Requires CRON_API_KEY for authentication
 */
export async function POST(request: Request) {
  try {
    // Validate CRON_API_KEY
    const authHeader = request.headers.get("Authorization");
    const cronApiKey = process.env.CRON_API_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronApiKey}`) {
      return apiError("Unauthorized", 401);
    }

    const now = new Date().toISOString();

    // Find content scheduled for publishing
    const dueFb = await db.query.contentItems.findMany({
      where: and(
        (t) => lte(t.scheduledForFb, now),
        (t) => t.fbStatus === "pending"
      ),
    });

    const dueIg = await db.query.contentItems.findMany({
      where: and(
        (t) => lte(t.scheduledForIg, now),
        (t) => t.igStatus === "pending"
      ),
    });

    const result: PublishResult = {
      published: 0,
      failed: 0,
      details: [],
    };

    // Publish to Facebook
    for (const item of dueFb) {
      try {
        // TODO: Implement Meta Graph API publishing
        // For now, just mark as published
        await db
          .update(contentItems)
          .set({
            fbStatus: "published",
            fbPostId: `fbpost-${item.id}`,
            publishedAtFb: now,
            updatedAt: now,
          })
          .where((t) => t.id === item.id);

        result.published++;
        result.details.push({
          contentId: item.id,
          platform: "facebook",
          success: true,
          postId: `fbpost-${item.id}`,
        });
      } catch (error) {
        await db
          .update(contentItems)
          .set({
            fbStatus: "failed",
            updatedAt: now,
          })
          .where((t) => t.id === item.id);

        result.failed++;
        result.details.push({
          contentId: item.id,
          platform: "facebook",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Publish to Instagram
    for (const item of dueIg) {
      try {
        // TODO: Implement Meta Graph API publishing
        // For now, just mark as published
        await db
          .update(contentItems)
          .set({
            igStatus: "published",
            igPostId: `igpost-${item.id}`,
            publishedAtIg: now,
            updatedAt: now,
          })
          .where((t) => t.id === item.id);

        result.published++;
        result.details.push({
          contentId: item.id,
          platform: "instagram",
          success: true,
          postId: `igpost-${item.id}`,
        });
      } catch (error) {
        await db
          .update(contentItems)
          .set({
            igStatus: "failed",
            updatedAt: now,
          })
          .where((t) => t.id === item.id);

        result.failed++;
        result.details.push({
          contentId: item.id,
          platform: "instagram",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("[/api/publish-due] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Publish failed",
      500
    );
  }
}
