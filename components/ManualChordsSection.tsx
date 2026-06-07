"use client";
import { useState } from "react";
import { ChordSheet } from "./ChordSheet";
import { getChordColor } from "../lib/services/chord-colors";
import { getChordDiagram } from "../lib/services/chord-diagram";
import { applyTransposition } from "../lib/services/transpose";
import { generatePdfBlob } from "../lib/services/pdf-generator";
import type { PreviewResponse, PianoSeqItem } from "../lib/types";

function parseChordInput(raw: string): string[] {
  return raw
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter((t) => /^[A-Ga-g]/.test(t))
    .map((t) => t[0].toUpperCase() + t.slice(1));
}

function buildChordData(title: string, chords: string[]): PreviewResponse {
  const unique = [...new Set(chords)];
  return {
    song: { title, artist: "", url: "", chords: unique },
    progression: { sequence: chords, repeatCount: 1 },
    chords: unique.map((name) => ({ name, color: getChordColor(name) })),
    diagrams: [
      ...unique.map((name) => getChordDiagram(name, "guitar")),
      ...unique.map((name) => getChordDiagram(name, "ukulele")),
      ...unique.map((name) => getChordDiagram(name, "piano")),
    ],
  };
}

export function ManualChordsSection({ pianoNotes }: { pianoNotes?: PianoSeqItem[] } = {}) {
  const [chordsInput, setChordsInput]         = useState("");
  const [titleInput, setTitleInput]           = useState("");
  const [data, setData]                       = useState<PreviewResponse | null>(null);
  const [submittedChords, setSubmittedChords] = useState<string[]>([]);
  const [submittedTitle, setSubmittedTitle]   = useState("");
  const [downloading, setDownloading]         = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chords = parseChordInput(chordsInput);
    if (chords.length === 0) return;
    const title = titleInput.trim() || "Custom Chords";
    setSubmittedChords(chords);
    setSubmittedTitle(title);
    setError(null);
    setData(buildChordData(title, chords));
  }

  async function handleDownload(transpose: number) {
    setDownloading(true);
    setError(null);
    try {
      const raw = buildChordData(submittedTitle, submittedChords);
      const transposed = applyTransposition(raw, transpose);
      const blob = await generatePdfBlob({ ...transposed, pianoNotes });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${submittedTitle.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "chord-sheet"}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Chord Sheet</h2>
        <p className="text-sm text-gray-500 mb-5">
          Type chord names to generate colour-coded chord charts and a printable PDF
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={chordsInput}
            onChange={(e) => setChordsInput(e.target.value)}
            placeholder="e.g.  C  Am  F  G  Em  Dm"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Title (optional)"
            className="sm:w-52 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Generate
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
            <strong>Error: </strong>{error}
          </div>
        )}
      </div>

      {data && (
        <ChordSheet
          data={data}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  );
}
