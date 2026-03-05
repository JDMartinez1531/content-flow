"use client";

import { useMemo, useState } from "react";
import { ANGLE_EMOJI } from "@/lib/captions";
import type { CaptionOptionRow } from "@/lib/captions";

interface CaptionSelectorProps {
  captions: CaptionOptionRow[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  onSaveCaption?: (id: string, caption: string) => Promise<void>;
}

/**
 * Caption selector + editor.
 *
 * - Selection is radio-style (exactly one selected).
 * - Each option is editable independently.
 * - Editing does NOT auto-select (Joshua preference: “Option 1”).
 */
export function CaptionSelector({
  captions,
  selectedId,
  onSelect,
  onSaveCaption,
}: CaptionSelectorProps) {
  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of captions) map[c.id] = c.caption;
    return map;
  }, [captions]);

  const [drafts, setDrafts] = useState<Record<string, string>>(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<Record<string, string | null>>({});

  // Keep drafts in sync if captions change (e.g. router.refresh)
  // Minimal internal-ready approach: merge new server values without nuking local edits.
  useMemo(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const c of captions) {
        if (next[c.id] === undefined) next[c.id] = c.caption;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  if (captions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No captions available</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Choose a caption (and edit any option):</p>

      <div className="space-y-3">
        {captions.map((c) => {
          const isSelected = c.id === selectedId;
          const emoji = ANGLE_EMOJI[c.angle] ?? "📝";
          const draft = drafts[c.id] ?? c.caption;
          const isDirty = draft !== c.caption;

          const canInteract = Boolean(onSelect);
          const canSave = Boolean(onSaveCaption) && isDirty && !savingId;

          return (
            <div
              key={c.id}
              className={`rounded-md border p-3 ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!canInteract}
                  onClick={() => onSelect?.(c.id)}
                  className={`flex-1 text-left text-sm ${
                    canInteract ? "hover:opacity-90" : "opacity-80"
                  }`}
                >
                  <span className="mr-2">{emoji}</span>
                  <span className={isSelected ? "font-medium" : ""}>
                    {c.angle.replaceAll("_", " ")}
                  </span>
                  {isSelected ? (
                    <span className="ml-2 text-xs text-blue-700">(selected)</span>
                  ) : null}
                  {isDirty ? (
                    <span className="ml-2 text-xs text-amber-700">(unsaved)</span>
                  ) : null}
                </button>

                <button
                  type="button"
                  disabled={!canSave}
                  onClick={async () => {
                    if (!onSaveCaption) return;
                    setSavingId(c.id);
                    setSaveMsg((m) => ({ ...m, [c.id]: null }));
                    try {
                      await onSaveCaption(c.id, draft);
                      setSaveMsg((m) => ({ ...m, [c.id]: "✓ Saved" }));
                      setTimeout(
                        () =>
                          setSaveMsg((m) => ({ ...m, [c.id]: null })),
                        1500
                      );
                    } catch (e) {
                      console.error(e);
                      setSaveMsg((m) => ({ ...m, [c.id]: "Save failed" }));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {savingId === c.id ? "Saving…" : "Save"}
                </button>
              </div>

              <div className="mt-2">
                <textarea
                  value={draft}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                  }
                  rows={5}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />

                {saveMsg[c.id] ? (
                  <p
                    className={`mt-1 text-xs ${
                      saveMsg[c.id]?.startsWith("✓")
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {saveMsg[c.id]}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
