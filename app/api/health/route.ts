import { apiSuccess } from "@/lib/utils";

/**
 * GET /api/health
 * Health check endpoint
 * Can be called without authentication for status monitoring
 *
 * Phase 2: Add token validation for Dropbox and Meta API
 */
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "connected", // TODO: Actually test DB connection
    dropbox: "unknown", // TODO: Validate Dropbox token
    meta: "unknown", // TODO: Validate Meta tokens
  };

  return apiSuccess(health);
}
