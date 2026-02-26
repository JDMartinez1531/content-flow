import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentItems, captionOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId, apiError, apiSuccess } from "@/lib/utils";
import type { SyncPayload, SyncResult } from "@/lib/types";

/**
 * POST /api/sync
 * Primary sync path — called by image_analyzer.py after processing
 * Accepts single item or array of items
 *
 * Auth: CRON_API_KEY (from image_analyzer.py) or session (from dashboard)
 */
export async function POST(request: Request) {
  try {
    // Validate authorization
    const authHeader = request.headers.get("Authorization");
    const cronApiKey = process.env.CRON_API_KEY;
    const session = await auth();

    const isAuthorized =
      (cronApiKey && authHeader === `Bearer ${cronApiKey}`) ||
      !!session?.user;

    if (!isAuthorized) {
      return apiError("Unauthorized", 401);
    }

    // For CRON_API_KEY calls, use the first admin user
    // For session calls, use the logged-in user
    let userId: string;
    if (session?.user) {
      userId = (session.user as any).id;
    } else {
      // Find first admin user for automated imports
      const [admin] = await db
        .select()
        .from(contentItems)
        .limit(0); // Just need the schema
      // TODO: Look up admin user properly
      // For now, require a userId header from image_analyzer.py
      const headerUserId = request.headers.get("X-User-Id");
      if (!headerUserId) {
        return apiError("X-User-Id header required for API key auth", 400);
      }
      userId = headerUserId;
    }

    const body = await request.json();
    const items: SyncPayload[] = Array.isArray(body) ? body : [body];

    const result: SyncResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.metadata?.source_file || !item.images?.instagram || !item.images?.facebook) {
          throw new Error("Missing required fields: metadata.source_file, images.instagram, images.facebook");
        }

        // Idempotency check — skip if source_file already imported
        const [existing] = await db
          .select()
          .from(contentItems)
          .where(eq(contentItems.sourceFile, item.metadata.source_file))
          .limit(1);

        if (existing) {
          result.skipped++;
          continue;
        }

        const contentId = generateId();
        const now = new Date().toISOString();

        // Insert content item
        await db.insert(contentItems).values({
          id: contentId,
          userId,
          imageId: item.metadata.image_path || contentId,
          sourceFile: item.metadata.source_file,
          qualityScore: 0, // Not in new payload, default to 0
          igImageUrl: item.images.instagram,
          fbImageUrl: item.images.facebook,
          description: item.metadata.analysis?.description || null,
          mood: item.metadata.analysis?.mood || null,
          fbStatus: "pending",
          igStatus: "pending",
          createdAt: now,
          updatedAt: now,
        });

        // Insert caption options
        if (item.metadata.captions?.length) {
          for (const cap of item.metadata.captions) {
            await db.insert(captionOptions).values({
              id: generateId(),
              contentId,
              angle: cap.angle,
              caption: cap.text,
              hashtags: JSON.stringify(cap.hashtags || []),
              createdAt: now,
            });
          }
        }

        result.imported++;
      } catch (error) {
        result.errors.push({
          filename: item.metadata?.source_file || "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("[/api/sync] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}

/**
 * GET /api/sync
 * Returns sync endpoint documentation
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  return apiSuccess({
    message: "POST to this endpoint with image analyzer output",
    payload_shape: {
      metadata: {
        source_file: "foam_party_001_metadata.json",
        image_path: "/PENDING_APPROVAL/foam_party_001",
        analysis: {
          description: "Kids playing in foam at outdoor birthday party",
          mood: "energetic, joyful",
        },
        captions: [
          {
            angle: "excitement",
            text: "Caption text...",
            hashtags: ["#foamparty", "#austintx"],
          },
        ],
        generated_at: "2026-03-15T14:30:00Z",
      },
      images: {
        instagram: "https://www.dropbox.com/scl/fi/...?raw=1",
        facebook: "https://www.dropbox.com/scl/fi/...?raw=1",
      },
    },
    auth: "Bearer CRON_API_KEY header + X-User-Id header, or session cookie",
  });
}
