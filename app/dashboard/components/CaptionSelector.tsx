"use client";

import { ANGLE_EMOJI } from "@/lib/captions";
import type { CaptionOptionRow } from "@/lib/captions";

interface CaptionSelectorProps {
  captions: CaptionOptionRow[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
}

/**
 * Radio-style caption selector — displays 5 caption angles with emoji indicators.
 *
 * Each caption shows its angle emoji + text. The selected caption gets
 * a highlighted border. When readonly (onSelect undefined), items are
 * not interactive.
 */
export function CaptionSelector({
  captions,
  selectedId,
  onSelect,
}: CaptionSelectorProps) {
  if (captions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No captions available
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Choose a caption:</p>
      <div className="space-y-1.5">
        {captions.map((caption) => {
          const isSelected = caption.id === selectedId;
          const emoji = ANGLE_EMOJI[caption.angle] ?? "📝";

          return (
            <button
              key={caption.id}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(caption.id)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : onSelect
                    ? "border-border hover:border-primary/50 hover:bg-accent"
                    : "border-border opacity-75"
              }`}
            >
              <span className="mr-1.5">{emoji}</span>
              <span className={isSelected ? "font-medium" : ""}>
                {caption.caption}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
