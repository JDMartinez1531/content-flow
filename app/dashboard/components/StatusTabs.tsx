"use client";

import { useState } from "react";
import { ContentCard } from "./ContentCard";
import type { ContentItemWithCaptions } from "@/lib/types";

interface StatusTabsProps {
  pending: ContentItemWithCaptions[];
  scheduled: ContentItemWithCaptions[];
  posted: ContentItemWithCaptions[];
}

type Tab = "pending" | "scheduled" | "posted";

/**
 * Tabbed view for content items grouped by workflow status.
 * Badge counts update as items move between states.
 */
export function StatusTabs({ pending, scheduled, posted }: StatusTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pending.length },
    { key: "scheduled", label: "Scheduled", count: scheduled.length },
    { key: "posted", label: "Posted", count: posted.length },
  ];

  const items =
    activeTab === "pending"
      ? pending
      : activeTab === "scheduled"
        ? scheduled
        : posted;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">
            {activeTab === "pending"
              ? "No pending content. Hit Sync to import from Dropbox."
              : activeTab === "scheduled"
                ? "No scheduled posts."
                : "No published posts yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              readonly={activeTab === "posted"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
