"use client";
import { useState } from "react";
import { ChordSheet } from "./ChordSheet";
import { getChordColor } from "../lib/services/chord-colors";
import { getChordDiagram } from "../lib/services/chord-diagram";
import { applyTransposition, transposePianoNotes } from "../lib/services/transpose";
import { generatePdfBlob } from "../lib/services/pdf-generator";
import type { PreviewResponse, PianoSeqItem } from "../lib/types";

function parseChordInput(raw: string): string[] {
  return raw
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter((t) => /^[A-Ga-g]/.test(t))
    .map((t) => t[0].toUpperCase() + t.slice(1));
}

function buildChordData(title: string, subtitle: string, chords: string[]): PreviewResponse {
  const unique = [...new Set(chords)];
  return {
    song: { title, subtitle, artist: "", url: "", chords: unique },
    progression: { sequence: chords, repeatCount: 1 },
    chords: unique.map((name) => ({ name, color: getChordColor(name) })),
    diagrams: [
      ...unique.map((name) => getChordDiagram(name, "guitar")),
      ...unique.map((name) => getChordDiagram(name, "ukulele")),
      ...unique.map((name) => getChordDiagram(name, "piano")),
      ...unique.map((name) => getChordDiagram(name, "bass")),
    ],
  };
}

interface ManualChordsSectionProps {
  pianoNotes?: PianoSeqItem[];
  transpose: number;
  onTransposeChange: (n: number) => void;
  melodyInputMode?: "piano" | "guitar";
}

export function ManualChordsSection({ pianoNotes, transpose, onTransposeChange, melodyInputMode = "piano" }: ManualChordsSectionProps) {
  const [activeInstruments, setActiveInstruments] = useState<string[]>([]);
  const [chordsInput, setChordsInput]           = useState("");
  const [titleInput, setTitleInput]             = useState("");
  const [subtitleInput, setSubtitleInput]       = useState("");
  const [data, setData]                         = useState<PreviewResponse | null>(null);
  const [submittedChords, setSubmittedChords]   = useState<string[]>([]);
  const [submittedTitle, setSubmittedTitle]     = useState("");
  const [submittedSubtitle, setSubmittedSubtitle] = useState("");
  const [downloading, setDownloading]           = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chords = parseChordInput(chordsInput);
    if (chords.length === 0) return;
    const title    = titleInput.trim();
    const subtitle = subtitleInput.trim();
    setSubmittedChords(chords);
    setSubmittedTitle(title);
    setSubmittedSubtitle(subtitle);
    setError(null);
    setData(buildChordData(title, subtitle, chords));
  }

  async function handleDownload(transpose: number) {
    setDownloading(true);
    setError(null);
    try {
      const raw = buildChordData(submittedTitle, submittedSubtitle, submittedChords);
      const transposed = applyTransposition(raw, transpose);
      const blob = await generatePdfBlob({ ...transposed, pianoNotes: transposePianoNotes(pianoNotes ?? [], transpose), activeInstruments, melodyInputMode });
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Sointukortti</h2>
        <p className="text-sm text-gray-500 mb-5">
          Kirjoita sointujen nimet luodaksesi värikoodatut sointukaaviot ja tulostettavan PDF:n
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={chordsInput}
            onChange={(e) => setChordsInput(e.target.value)}
            placeholder="esim.  C  Am  F  G  Em  Dm"
            title="Soinnut välilyönnillä tai pilkulla erotettuna, esim. C Am F G Em Dm"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Otsikko (valinnainen)"
            title="Kappaleen otsikko — näkyy PDF:n yläreunassa"
            className="sm:w-44 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={subtitleInput}
            onChange={(e) => setSubtitleInput(e.target.value)}
            placeholder="Alaotsikko / tekijät (valinnainen)"
            title="Alaotsikko tai tekijätiedot — näkyy otsikon alla PDF:ssä"
            className="sm:w-52 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            title="Luo sointukaaviot syötetyistä soinnuista"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Luo
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
            <strong>Virhe: </strong>{error}
          </div>
        )}
      </div>

      {data && (
        <ChordSheet
          data={data}
          transpose={transpose}
          onTransposeChange={onTransposeChange}
          activeInstruments={activeInstruments}
          onActiveInstrumentsChange={setActiveInstruments}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  );
}
