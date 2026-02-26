import type { users, contentItems, captionOptions } from "./db/schema";

/**
 * Custom types for the application
 */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type CaptionOption = typeof captionOptions.$inferSelect;
export type NewCaptionOption = typeof captionOptions.$inferInsert;

export type CaptionAngle =
  | "excitement"
  | "behind_scenes"
  | "parental_appeal"
  | "social_proof"
  | "call_to_action";

export type PublishStatus = "pending" | "published" | "failed" | "retry";

export type Platform = "facebook" | "instagram";

/**
 * Sync payload from image_analyzer.py
 */
export interface SyncPayload {
  metadata: {
    source_file: string;
    image_path: string;
    analysis: {
      description: string;
      mood: string;
    };
    captions: Array<{
      angle: string;
      text: string;
      hashtags: string[];
    }>;
    generated_at: string;
  };
  images: {
    instagram: string; // Dropbox shared link ?raw=1
    facebook: string;  // Dropbox shared link ?raw=1
  };
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncResult {
  imported: number;
  skipped: number;
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

export interface PublishResult {
  published: number;
  failed: number;
  details: Array<{
    contentId: string;
    platform: Platform;
    success: boolean;
    postId?: string;
    error?: string;
  }>;
}
