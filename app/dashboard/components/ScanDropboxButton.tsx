"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanDropboxButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch("/api/sync/scan", { method: "POST" });
      const data = await resp.json();

      if (data.success) {
        const { imported, skipped, errors } = data.data;
        const parts = [];
        if (imported > 0) parts.push(`${imported} imported`);
        if (skipped > 0) parts.push(`${skipped} skipped`);
        if (errors?.length > 0) parts.push(`${errors.length} errors`);
        setResult(parts.join(", ") || "Nothing to import");
        if (imported > 0) router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setResult("Scan failed — check console");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleScan}
        disabled={loading}
        className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? "Scanning..." : "📦 Scan Dropbox"}
      </button>

      {result && (
        <span className="text-sm text-slate-600">{result}</span>
      )}
    </div>
  );
}
