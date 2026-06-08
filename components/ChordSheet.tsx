"use client";
import React, { useMemo } from "react";
import type { PreviewResponse } from "../lib/types";
import { applyTransposition } from "../lib/services/transpose";

interface Props {
  data: PreviewResponse;
  transpose: number;
  onTransposeChange: (n: number) => void;
  activeInstruments: string[];
  onActiveInstrumentsChange: (v: string[]) => void;
  onDownload?: (transpose: number) => void;
  downloading?: boolean;
}

// B natural → H (Finnish notation); Bb stays as Bb
const displayChordName = (n: string) =>
  n.startsWith("B") && n[1] !== "b" ? "H" + n.slice(1) : n;

const ALL_INSTRUMENTS = [
  { key: "guitar",  label: "Kitara"  },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano",   label: "Piano"   },
  { key: "bass",    label: "Basso"   },
] as const;

export function ChordSheet({ data, transpose, onTransposeChange, activeInstruments, onActiveInstrumentsChange, onDownload, downloading }: Props) {
  const setTranspose = onTransposeChange;
  const instruments = activeInstruments
    .map((key) => ALL_INSTRUMENTS.find((i) => i.key === key))
    .filter((i): i is typeof ALL_INSTRUMENTS[number] => i !== undefined);

  function toggleInstrument(key: string) {
    onActiveInstrumentsChange(
      activeInstruments.includes(key)
        ? activeInstruments.filter((k) => k !== key)
        : [...activeInstruments, key]
    );
  }

  const { song, progression, chords, diagrams } = useMemo(
    () => applyTransposition(data, transpose),
    [data, transpose]
  );

  const chordMap = new Map(chords.map((c) => [c.name, c]));
  const n = progression.sequence.length;

  const transposeLabel = `${transpose > 0 ? "+" : ""}${transpose}`;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Song header */}
      <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{song.title}</h2>
          {song.subtitle && <p className="text-base text-gray-500 mt-0.5">{song.subtitle}</p>}
          <p className="text-gray-500 mt-0.5">{song.artist}</p>
          <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{song.url}</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Transpose control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Transponointi
            </span>
            <button
              onClick={() => setTranspose(Math.max(-11, transpose - 1))}
              className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center transition-colors"
              aria-label="Transponoi alas"
              title="Transponoi puolisävelaskel alaspäin"
            >
              −
            </button>
            <span
              className="w-16 text-center text-sm font-semibold text-gray-700"
              title={transpose === 0 ? "Alkuperäinen sävelkorkeus" : `Transponoitu ${transpose > 0 ? "+" : ""}${transpose} puolisävelaskelta`}
            >
              {transposeLabel}
            </span>
            <button
              onClick={() => setTranspose(Math.min(11, transpose + 1))}
              className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center transition-colors"
              aria-label="Transponoi ylös"
              title="Transponoi puolisävelaskel ylöspäin"
            >
              +
            </button>
          </div>

          {/* Download */}
          {onDownload && (
            <button
              onClick={() => onDownload(transpose)}
              disabled={downloading}
              className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              title="Lataa sointukortti PDF-tiedostona"
            >
              {downloading ? <><Spinner /> Luodaan PDF…</> : <><DownloadIcon /> Lataa PDF</>}
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
            Sointukierto
            {progression.repeatCount > 1 && (
              <span className="block font-normal normal-case text-gray-300">
                ×{progression.repeatCount}
              </span>
            )}
          </div>
          {progression.sequence.map((name, i) => {
            const chord = chordMap.get(name);
            return (
              <div
                key={i}
                className="rounded-full px-3 py-1 font-bold text-sm text-center text-white shadow-sm"
                style={{ backgroundColor: chord?.color ?? "#999" }}
              >
                {displayChordName(name)}
              </div>
            );
          })}

          {/* Instrument rows */}
          {instruments.map(({ key, label }) => (
            <React.Fragment key={key}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-start pt-3">
                {label}
              </div>
              {progression.sequence.map((name, i) => {
                const d = diagrams.find((d) => d.chord === name && d.instrument === key);
                return (
                  <div
                    key={i}
                    className="flex justify-center"
                    dangerouslySetInnerHTML={{ __html: d?.svg ?? "" }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Instrument toggles */}
        <div className="flex items-center gap-2 flex-wrap mt-5 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Instrumentit:</span>
          {ALL_INSTRUMENTS.map(({ key, label }) => {
            const active = activeInstruments.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleInstrument(key)}
                title={active ? `Piilota ${label}-kaaviot` : `Näytä ${label}-kaaviot`}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-400 border-gray-300 hover:border-gray-400 hover:text-gray-600"
                }`}
              >
                {active ? `− ${label}` : `+ ${label}`}
              </button>
            );
          })}
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
