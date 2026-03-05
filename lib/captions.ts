import type { CaptionAngle, CaptionOption } from "./types";

export const ANGLE_EMOJI: Record<CaptionAngle, string> = {
  excitement: "🎉",
  behind_scenes: "🎬",
  parental_appeal: "👨‍👩‍👧‍👦",
  social_proof: "⭐",
  call_to_action: "👉",
};

// What the UI needs from caption_options rows
// Note: Drizzle infers `angle` as string; UI narrows it to CaptionAngle.
export type CaptionOptionRow = {
  id: string;
  angle: CaptionAngle;
  caption: string;
  selected: boolean;
};
