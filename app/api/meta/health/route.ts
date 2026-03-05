import { auth } from "@/lib/auth";
import type { ExtendedSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { metaHealthCheck } from "@/lib/meta";

/**
 * GET /api/meta/health
 *
 * Internal connectivity check for Meta Graph API.
 * Requires an authenticated session.
 */
export async function GET() {
  try {
    const session = (await auth()) as ExtendedSession;

    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const data = await metaHealthCheck();

    // Don’t leak tokens; this endpoint only returns ids/usernames.
    return apiSuccess(data);
  } catch (error: any) {
    console.error("[GET /api/meta/health] Error:", error);
    return apiError(error?.message ?? "Meta health check failed", 500);
  }
}
