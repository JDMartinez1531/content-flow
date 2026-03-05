import { auth } from "@/lib/auth";
import type { ExtendedSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { captionOptions, contentItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/utils";

/**
 * PATCH /api/caption-options/[id]
 * Update a single caption option's text.
 * Row-level security: user can only update captions for their own content.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = (await auth()) as ExtendedSession;

    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => null);
    const caption = body?.caption;

    if (typeof caption !== "string") {
      return apiError("Missing caption", 400);
    }

    // Find the caption option row
    const opt = await db.query.captionOptions.findFirst({
      where: eq(captionOptions.id, id),
    });

    if (!opt) {
      return apiError("Not found", 404);
    }

    // Verify the parent content item belongs to the user
    const parent = await db.query.contentItems.findFirst({
      where: and(
        eq(contentItems.id, opt.contentId),
        eq(contentItems.userId, session.user.id)
      ),
    });

    if (!parent) {
      return apiError("Not found", 404);
    }

    await db
      .update(captionOptions)
      .set({ caption })
      .where(eq(captionOptions.id, id));

    return apiSuccess({ id, caption });
  } catch (error) {
    console.error("[PATCH /api/caption-options/[id]] Error:", error);
    return apiError("Failed to update caption option", 500);
  }
}
