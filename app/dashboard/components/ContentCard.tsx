"use client";

import { ContentItem } from "@/lib/types";
import { getStatusColor, getQualityColor } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export function ContentCard({ item }: { item: ContentItem }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image preview */}
      <div className="relative h-48 bg-slate-100">
        <Image
          src={item.igImageUrl}
          alt="Content"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Quality badge */}
        <div
          className={`absolute top-2 right-2 ${getQualityColor(
            item.qualityScore
          )} font-bold text-xs px-2 py-1 rounded bg-white`}
        >
          {item.qualityScore}/100
        </div>
      </div>

      {/* Status badges */}
      <div className="p-3 border-b border-slate-100 flex gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
            item.fbStatus
          )}`}
        >
          FB: {item.fbStatus}
        </span>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
            item.igStatus
          )}`}
        >
          IG: {item.igStatus}
        </span>
      </div>

      {/* Content info */}
      <div className="p-4">
        <p className="text-sm text-slate-600 mb-3">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left text-sm font-medium text-blue-600 hover:text-blue-700 mb-2"
        >
          {showDetails ? "Hide" : "View"} details →
        </button>

        {showDetails && (
          <div className="mt-3 p-3 bg-slate-50 rounded text-xs space-y-2">
            <p>
              <span className="font-medium">Image ID:</span> {item.imageId}
            </p>
            {item.fbPostId && (
              <p>
                <span className="font-medium">FB Post:</span> {item.fbPostId}
              </p>
            )}
            {item.igPostId && (
              <p>
                <span className="font-medium">IG Post:</span> {item.igPostId}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <a
          href={`/dashboard/content/${item.id}`}
          className="block w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors text-center"
        >
          {item.fbStatus === "pending" || item.igStatus === "pending"
            ? "Edit & Approve"
            : "View Details"}
        </a>
      </div>
    </div>
  );
}
