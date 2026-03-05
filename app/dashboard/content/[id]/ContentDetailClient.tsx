"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaptionSelector } from "../../components/CaptionSelector";
import type { ContentItem } from "@/lib/types";
import type { CaptionOptionRow } from "@/lib/captions";
import { getStatusColor, getQualityColor } from "@/lib/utils";

interface ContentDetailClientProps {
  item: ContentItem & {
    captions: CaptionOptionRow[];
    hashtags: any[];
  };
}

/**
 * Client component for content detail page
 * Handles caption selection, status updates, and scheduling
 */
export function ContentDetailClient({ item }: ContentDetailClientProps) {
  const router = useRouter();
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(
    item.captions.find((c) => c.selected)?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Scheduling state
  const [fbScheduleDate, setFbScheduleDate] = useState(item.scheduledForFb || "");
  const [igScheduleDate, setIgScheduleDate] = useState(item.scheduledForIg || "");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  const handleSaveCaption = async () => {
    if (!selectedCaptionId) {
      setSaveMessage("Please select a caption first");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCaptionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveMessage("✓ Caption saved!");
      
      // Refresh the page data
      router.refresh();

      // Clear success message after 2 seconds
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!fbScheduleDate && !igScheduleDate) {
      setScheduleMessage("Please set at least one schedule date");
      return;
    }

    setIsScheduling(true);
    setScheduleMessage(null);

    try {
      const updates: any = {};
      
      if (fbScheduleDate) {
        updates.scheduledForFb = fbScheduleDate;
        updates.fbStatus = "scheduled";
      }
      
      if (igScheduleDate) {
        updates.scheduledForIg = igScheduleDate;
        updates.igStatus = "scheduled";
      }

      const response = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save schedule");
      }

      setScheduleMessage("✓ Schedule saved!");
      
      // Refresh the page data
      router.refresh();

      // Clear success message after 2 seconds
      setTimeout(() => setScheduleMessage(null), 2000);
    } catch (error) {
      console.error("Schedule error:", error);
      setScheduleMessage("Failed to save schedule. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  const selectedCaption = item.captions.find((c) => c.id === selectedCaptionId);
  const hashtags = item.hashtags[0]?.tags || [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <a
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
        >
          ← Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Content Details
        </h1>
        <p className="text-slate-600">
          Select a caption, schedule posts, and manage this content item
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image and metadata */}
        <div>
          {/* Image preview */}
          <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={item.igImageUrl}
              alt="Content preview"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Quality badge */}
            <div
              className={`absolute top-3 right-3 ${getQualityColor(
                item.qualityScore
              )} font-bold text-sm px-3 py-1.5 rounded bg-white shadow-sm`}
            >
              Quality: {item.qualityScore}/100
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-3 mb-4">
            <span
              className={`text-sm font-medium px-3 py-1.5 rounded ${getStatusColor(
                item.fbStatus
              )}`}
            >
              Facebook: {item.fbStatus}
            </span>
            <span
              className={`text-sm font-medium px-3 py-1.5 rounded ${getStatusColor(
                item.igStatus
              )}`}
            >
              Instagram: {item.igStatus}
            </span>
          </div>

          {/* Metadata */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-700">Created:</span>{" "}
              <span className="text-slate-600">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Image ID:</span>{" "}
              <span className="text-slate-600">{item.imageId}</span>
            </div>
            {item.description && (
              <div>
                <span className="font-medium text-slate-700">Description:</span>{" "}
                <span className="text-slate-600">{item.description}</span>
              </div>
            )}
            {item.mood && (
              <div>
                <span className="font-medium text-slate-700">Mood:</span>{" "}
                <span className="text-slate-600">{item.mood}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Caption selector and actions */}
        <div>
          {/* Caption selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-4">
            <CaptionSelector
              captions={item.captions}
              selectedId={selectedCaptionId}
              onSelect={setSelectedCaptionId}
            />

            {/* Save button */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSaveCaption}
                disabled={isSaving || !selectedCaptionId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-md transition-colors"
              >
                {isSaving ? "Saving..." : "Save Caption"}
              </button>
            </div>

            {/* Save status message */}
            {saveMessage && (
              <p
                className={`mt-3 text-sm text-center ${
                  saveMessage.startsWith("✓")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {saveMessage}
              </p>
            )}
          </div>

          {/* Selected caption preview */}
          {selectedCaption && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium text-slate-900 mb-3">
                Selected Caption Preview
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                {selectedCaption.text}
              </p>

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-2">
                    Hashtags:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scheduling UI */}
          <div className="mt-4 bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-medium text-slate-900 mb-4">
              Schedule Posts
            </h3>
            
            {/* Facebook Schedule */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Facebook
              </label>
              <input
                type="datetime-local"
                value={fbScheduleDate}
                onChange={(e) => setFbScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
              {item.scheduledForFb && (
                <p className="text-xs text-slate-500 mt-1">
                  Currently scheduled: {new Date(item.scheduledForFb).toLocaleString()}
                </p>
              )}
            </div>

            {/* Instagram Schedule */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Instagram
              </label>
              <input
                type="datetime-local"
                value={igScheduleDate}
                onChange={(e) => setIgScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
              {item.scheduledForIg && (
                <p className="text-xs text-slate-500 mt-1">
                  Currently scheduled: {new Date(item.scheduledForIg).toLocaleString()}
                </p>
              )}
            </div>

            {/* Save Schedule Button */}
            <button
              onClick={handleSaveSchedule}
              disabled={isScheduling || (!fbScheduleDate && !igScheduleDate)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isScheduling ? "Saving..." : "Save Schedule"}
            </button>

            {/* Schedule status message */}
            {scheduleMessage && (
              <p
                className={`mt-3 text-sm text-center ${
                  scheduleMessage.startsWith("✓")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {scheduleMessage}
              </p>
            )}

            {/* Helper text */}
            <p className="mt-3 text-xs text-slate-500">
              Set different publish times for each platform, or leave one blank to skip it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
