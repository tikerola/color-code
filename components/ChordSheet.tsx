"use client";
import React, { useMemo, useState } from "react";
import type { PreviewResponse } from "../lib/types";
import { applyTransposition } from "../lib/services/transpose";

interface Props {
  data: PreviewResponse;
  onDownload?: (transpose: number) => void;
  downloading?: boolean;
}

const INSTRUMENTS = [
  { key: "guitar",  label: "Guitar"  },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano",   label: "Piano"   },
] as const;

export function ChordSheet({ data, onDownload, downloading }: Props) {
  const [transpose, setTranspose] = useState(0);

  const { song, progression, chords, diagrams } = useMemo(
    () => applyTransposition(data, transpose),
    [data, transpose]
  );

  const chordMap = new Map(chords.map((c) => [c.name, c]));
  const n = progression.sequence.length;

  const transposeLabel =
    transpose === 0 ? "Original" : `${transpose > 0 ? "+" : ""}${transpose}`;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Song header */}
      <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{song.title}</h2>
          <p className="text-gray-500 mt-0.5">{song.artist}</p>
          <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{song.url}</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Transpose control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Transpose
            </span>
            <button
              onClick={() => setTranspose((t) => Math.max(-11, t - 1))}
              className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center transition-colors"
              aria-label="Transpose down"
            >
              −
            </button>
            <span className="w-16 text-center text-sm font-semibold text-gray-700">
              {transposeLabel}
            </span>
            <button
              onClick={() => setTranspose((t) => Math.min(11, t + 1))}
              className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center transition-colors"
              aria-label="Transpose up"
            >
              +
            </button>
            {transpose !== 0 && (
              <button
                onClick={() => setTranspose(0)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Download */}
          {onDownload && (
            <button
              onClick={() => onDownload(transpose)}
              disabled={downloading}
              className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {downloading ? <><Spinner /> Generating PDF…</> : <><DownloadIcon /> Download PDF</>}
            </button>
          )}
        </div>
      </div>

      {/* Chord grid */}
      <div className="border-t border-gray-100 p-6 overflow-x-auto">
        <div
          className="grid items-center gap-x-4 gap-y-2"
          style={{ gridTemplateColumns: `6rem repeat(${n}, minmax(80px, 1fr))` }}
        >
          {/* Progression row */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-center">
            Progression
            {progression.repeatCount > 1 && (
              <span className="block font-normal normal-case text-gray-300">
                ×{progression.repeatCount}
              </span>
            )}
          </div>
          {progression.sequence.map((name) => {
            const chord = chordMap.get(name);
            return (
              <div
                key={name}
                className="rounded-md px-2 py-1 font-bold text-sm text-center"
                style={{ border: `3px solid ${chord?.color ?? "#999"}`, color: chord?.color ?? "#999" }}
              >
                {name}
              </div>
            );
          })}

          {/* Instrument rows */}
          {INSTRUMENTS.map(({ key, label }) => (
            <React.Fragment key={key}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-start pt-3">
                {label}
              </div>
              {progression.sequence.map((name) => {
                const d = diagrams.find((d) => d.chord === name && d.instrument === key);
                return (
                  <div
                    key={`${key}-${name}`}
                    className="flex justify-center"
                    dangerouslySetInnerHTML={{ __html: d?.svg ?? "" }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
