import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentItems, captionOptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/utils";
import type { ExtendedSession } from "@/lib/auth";

/**
 * GET /api/content/[id]
 * Fetch a single content item with its captions
 * Row-level security: user can only access their own content
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await auth()) as ExtendedSession;

    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

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
      return apiError("Not found", 404);
    }

    return apiSuccess(item);
  } catch (error) {
    console.error("[GET /api/content/[id]] Error:", error);
    return apiError("Failed to fetch content", 500);
  }
}

/**
 * PATCH /api/content/[id]
 * Update content item (scheduling, status, caption selection)
 * Row-level security: user can only update their own content
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await auth()) as ExtendedSession;

    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Verify ownership
    const item = await db.query.contentItems.findFirst({
      where: and(
        eq(contentItems.id, params.id),
        eq(contentItems.userId, session.user.id)
      ),
    });

    if (!item) {
      return apiError("Not found", 404);
    }

    const body = await request.json();
    const updates: any = { updatedAt: new Date().toISOString() };

    // Allow updates to scheduling and caption selection
    if (body.scheduledForFb) updates.scheduledForFb = body.scheduledForFb;
    if (body.scheduledForIg) updates.scheduledForIg = body.scheduledForIg;
    if (body.fbStatus) updates.fbStatus = body.fbStatus;
    if (body.igStatus) updates.igStatus = body.igStatus;

    // Update selected caption
    if (body.selectedCaptionId) {
      // Clear previous selection
      await db
        .update(captionOptions)
        .set({ selected: false })
        .where(eq(captionOptions.contentId, params.id));

      // Set new selection
      await db
        .update(captionOptions)
        .set({ selected: true })
        .where(eq(captionOptions.id, body.selectedCaptionId));
    }

    // Update content item
    const updated = await db
      .update(contentItems)
      .set(updates)
      .where(eq(contentItems.id, params.id));

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[PATCH /api/content/[id]] Error:", error);
    return apiError("Failed to update content", 500);
  }
}
