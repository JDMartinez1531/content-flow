import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentItems, captionOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId, apiError, apiSuccess } from "@/lib/utils";
import type { SyncResult } from "@/lib/types";

/**
 * POST /api/sync/scan
 * Manual fallback — scans Dropbox PENDING_APPROVAL/ folder
 * Imports any _metadata.json files not already in the database
 *
 * Requires session auth (dashboard button)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = (session.user as any).id;

    // Dropbox credentials from env
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;
    const folderPath = process.env.DROPBOX_FOLDER_PATH || "/Foam";

    if (!accessToken && !refreshToken) {
      return apiError("Dropbox credentials not configured", 500);
    }

    // Get a valid access token
    let token = accessToken;
    if (refreshToken && appKey && appSecret) {
      // Refresh the token
      const tokenResp = await fetch("https://api.dropboxapi.com/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: appKey,
          client_secret: appSecret,
        }),
      });

      if (!tokenResp.ok) {
        return apiError("Failed to refresh Dropbox token", 500);
      }

      const tokenData = await tokenResp.json();
      token = tokenData.access_token;
    }

    // List files in PENDING_APPROVAL
    const pendingPath = `${folderPath}/PENDING_APPROVAL`;
    const listResp = await fetch(
      "https://api.dropboxapi.com/2/files/list_folder",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: pendingPath,
          recursive: false,
          limit: 100,
        }),
      }
    );

    if (!listResp.ok) {
      const err = await listResp.text();
      return apiError(`Dropbox list failed: ${err}`, 500);
    }

    const listData = await listResp.json();
    const metadataFiles = listData.entries.filter(
      (e: any) => e[".tag"] === "file" && e.name.endsWith("_metadata.json")
    );

    const result: SyncResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const file of metadataFiles) {
      try {
        // Check if already imported
        const [existing] = await db
          .select()
          .from(contentItems)
          .where(eq(contentItems.sourceFile, file.name))
          .limit(1);

        if (existing) {
          result.skipped++;
          continue;
        }

        // Download metadata JSON
        const downloadResp = await fetch(
          "https://content.dropboxapi.com/2/files/download",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Dropbox-API-Arg": JSON.stringify({ path: file.path_lower }),
            },
          }
        );

        if (!downloadResp.ok) {
          throw new Error(`Failed to download ${file.name}`);
        }

        const metadata = await downloadResp.json();
        const baseName = file.name.replace("_metadata.json", "");

        // Create shared links for images
        const igLink = await getOrCreateSharedLink(
          token!,
          `${pendingPath}/${baseName}_instagram.jpg`
        );
        const fbLink = await getOrCreateSharedLink(
          token!,
          `${pendingPath}/${baseName}_facebook.jpg`
        );

        if (!igLink || !fbLink) {
          throw new Error("Failed to create shared links for images");
        }

        const contentId = generateId();
        const now = new Date().toISOString();

        // Insert content item
        await db.insert(contentItems).values({
          id: contentId,
          userId,
          imageId: metadata.id || baseName,
          sourceFile: file.name,
          qualityScore: metadata.quality_score || 0,
          igImageUrl: igLink,
          fbImageUrl: fbLink,
          description: metadata.description || null,
          mood: metadata.mood || null,
          fbStatus: "pending",
          igStatus: "pending",
          createdAt: now,
          updatedAt: now,
        });

        // Insert captions
        if (metadata.captions) {
          const captions = Array.isArray(metadata.captions)
            ? metadata.captions
            : Object.entries(metadata.captions).map(([angle, data]: [string, any]) => ({
                angle,
                text: data.text || data.caption,
                hashtags: [],
              }));

          for (const cap of captions) {
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
          filename: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("[/api/sync/scan] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Scan failed",
      500
    );
  }
}

/**
 * Get or create a Dropbox shared link for a file
 * Returns direct URL with ?raw=1
 */
async function getOrCreateSharedLink(
  token: string,
  path: string
): Promise<string | null> {
  try {
    // Try to create
    const createResp = await fetch(
      "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          settings: { requested_visibility: "public" },
        }),
      }
    );

    if (createResp.ok) {
      const data = await createResp.json();
      return data.url.replace("dl=0", "raw=1");
    }

    // If link already exists, fetch it
    const err = await createResp.json();
    if (err.error?.[".tag"] === "shared_link_already_exists") {
      const listResp = await fetch(
        "https://api.dropboxapi.com/2/sharing/list_shared_links",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path, direct_only: true }),
        }
      );

      if (listResp.ok) {
        const listData = await listResp.json();
        if (listData.links?.length) {
          return listData.links[0].url.replace("dl=0", "raw=1");
        }
      }
    }

    console.error(`[shared_link] Failed for ${path}:`, err);
    return null;
  } catch (error) {
    console.error(`[shared_link] Error for ${path}:`, error);
    return null;
  }
}
