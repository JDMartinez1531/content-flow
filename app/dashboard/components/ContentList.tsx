"use client";

import { ContentItem } from "@/lib/types";
import { ContentCard } from "./ContentCard";

export function ContentList({ items }: { items: ContentItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600 mb-4">No content yet</p>
        <p className="text-sm text-slate-500">
          Upload images using the image analyzer to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
