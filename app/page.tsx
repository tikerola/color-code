"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChordSheet } from "../components/ChordSheet";
import { PianoNotesSection } from "../components/PianoNotesSection";
import type { PreviewResponse } from "../lib/types";

async function fetchPreview(url: string): Promise<PreviewResponse> {
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to extract chord data");
  }
  return res.json();
}

async function downloadPdf(url: string, title: string, transpose: number): Promise<void> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, transpose }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "PDF generation failed");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "chord-sheet"}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");

  const preview = useMutation({
    mutationFn: (url: string) => fetchPreview(url),
  });

  const download = useMutation({
    mutationFn: ({ url, title, transpose }: { url: string; title: string; transpose: number }) =>
      downloadPdf(url, title, transpose),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;
    setSubmittedUrl(url);
    preview.mutate(url);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chord Sheet PDF</h1>
          <p className="text-gray-500 text-lg">
            Paste a chord-sheet URL to generate a printable PDF with chord diagrams
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://tabs.ultimate-guitar.com/tab/…"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={preview.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {preview.isPending ? "Loading…" : "Extract"}
          </button>
        </form>

        {preview.isPending && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg animate-pulse">Fetching chord sheet…</p>
          </div>
        )}

        {preview.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6">
            <strong>Error: </strong>
            {preview.error?.message}
          </div>
        )}

        {download.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6">
            <strong>PDF Error: </strong>
            {download.error?.message}
          </div>
        )}

        {preview.data && (
          <ChordSheet
            data={preview.data}
            onDownload={(transpose) =>
              download.mutate({ url: submittedUrl, title: preview.data!.song.title, transpose })
            }
            downloading={download.isPending}
          />
        )}

        <PianoNotesSection />
      </div>
    </main>
  );
}
