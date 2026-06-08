"use client";
import React, { useState, useRef, useEffect } from "react";
import { getNoteColor } from "../lib/services/chord-colors";
import type { PianoSeqItem } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type NoteItem      = { kind: "note";      letter: string; octave: number; uid: string };
type BarlineItem   = { kind: "barline";   uid: string };
type RepeatItem    = { kind: "repeat";    count: number;  uid: string };
type LineBreakItem = { kind: "linebreak"; uid: string };
type LabelItem     = { kind: "label";     text: string;   uid: string };
type SeqItem       = NoteItem | BarlineItem | RepeatItem | LineBreakItem | LabelItem;

type RowItem = NoteItem | BarlineItem | RepeatItem;
type Row = { label: string | null; labelUid: string | null; items: RowItem[]; linebreakUid: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);

const displayLetter = (l: string) => l === "B" ? "H" : l;

// Classical octave notation: oct2=capital (C,D…H), oct3=lowercase (c,d…h),
// oct4=c1/d1…, oct5=c2/d2…  (c1 = keski-C = scientific C4)
const octaveLabel = (oct: number): string =>
  oct <= 3 ? "c" : `c${oct - 3}`;
const noteLabel = (letter: string, oct: number): string => {
  const l = displayLetter(letter);
  if (oct <= 2) return l.toUpperCase();
  const suffix = oct === 3 ? "" : String(oct - 3);
  return l.toLowerCase() + suffix;
};

function makeNote(letter: string, octave: number): NoteItem {
  return { kind: "note", letter, octave, uid: uid() };
}

function buildRows(items: SeqItem[]): Row[] {
  const rows: Row[] = [];
  let current: RowItem[] = [];
  let pendingLabel: string | null = null;
  let pendingLabelUid: string | null = null;
  for (const item of items) {
    if (item.kind === "linebreak") {
      rows.push({ label: pendingLabel, labelUid: pendingLabelUid, items: current, linebreakUid: item.uid });
      current = [];
      pendingLabel = null;
      pendingLabelUid = null;
    } else if (item.kind === "label") {
      if (current.length > 0 || pendingLabel !== null) {
        rows.push({ label: pendingLabel, labelUid: pendingLabelUid, items: current, linebreakUid: null });
        current = [];
      }
      pendingLabel = item.text;
      pendingLabelUid = item.uid;
    } else {
      current.push(item as RowItem);
    }
  }
  rows.push({ label: pendingLabel, labelUid: pendingLabelUid, items: current, linebreakUid: null });
  return rows.filter((r) => r.items.length > 0 || r.label !== null);
}

function toShareable(item: SeqItem): PianoSeqItem {
  if (item.kind === "note")     return { kind: "note", letter: item.letter, octave: item.octave };
  if (item.kind === "barline")  return { kind: "barline" };
  if (item.kind === "repeat")   return { kind: "repeat", count: item.count };
  if (item.kind === "label")    return { kind: "label", text: item.text };
  return { kind: "linebreak" };
}

// ── Note transposition ────────────────────────────────────────────────────────

const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NORM: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };

function transposeNote(letter: string, octave: number, semitones: number): { letter: string; octave: number } {
  if (semitones === 0) return { letter, octave };
  const normalized = FLAT_NORM[letter] ?? letter;
  const idx = CHROMATIC_NOTES.indexOf(normalized as (typeof CHROMATIC_NOTES)[number]);
  if (idx === -1) return { letter, octave };
  const rawNew = idx + semitones;
  return {
    letter: CHROMATIC_NOTES[((rawNew % 12) + 12) % 12],
    octave: octave + Math.floor(rawNew / 12),
  };
}

// ── Fretboard constants (shared) ──────────────────────────────────────────────

const FB_LABEL_W = 28;
const FB_OPEN_W  = 38;
const FB_NUT_W   = 4;
const FB_FRET_W  = 42;
const FB_ROW_H   = 22;

function fbStringTopY(si: number)    { return si * FB_ROW_H; }
function fbStringCenterY(si: number) { return si * FB_ROW_H + FB_ROW_H / 2; }

const CHROMATIC_FB = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;

function midiToNote(midi: number): { letter: string; octave: number } {
  const semis = midi - 12;
  return { octave: Math.floor(semis / 12), letter: CHROMATIC_FB[semis % 12] };
}

// ── Instrument string definitions ─────────────────────────────────────────────

const GUITAR_STRING_DEFS = [
  { name: "e", openMidi: 64 },
  { name: "H", openMidi: 59 },
  { name: "G", openMidi: 55 },
  { name: "D", openMidi: 50 },
  { name: "A", openMidi: 45 },
  { name: "E", openMidi: 40 },
] as const;

const UKULELE_STRING_DEFS = [
  { name: "G", openMidi: 67 },
  { name: "C", openMidi: 60 },
  { name: "E", openMidi: 64 },
  { name: "A", openMidi: 69 },
] as const;

const GUITAR_FRETS   = 12;
const GUITAR_MARKERS = new Set([3, 5, 7, 9]);
const UKE_FRETS      = 12;
const UKE_MARKERS    = new Set([5, 7, 10]);

// ── Piano keyboard constants ──────────────────────────────────────────────────

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const WHITE_KEY_W = 36;
const WHITE_KEY_H = 100;
const BLACK_KEY_W = 22;
const BLACK_KEY_H = 62;
const OCTAVE_W = WHITE_KEY_W * 7;
const KEYBOARD_OCTAVES = [3, 4, 5] as const;

const BLACK_KEY_OFFSETS = [
  { letter: "C#", left: 25 },
  { letter: "D#", left: 61 },
  { letter: "F#", left: 133 },
  { letter: "G#", left: 169 },
  { letter: "A#", left: 205 },
];

// ── Audio synthesis ───────────────────────────────────────────────────────────

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4,
  F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

function noteToFrequency(letter: string, octave: number): number {
  const semi = NOTE_SEMITONES[letter] ?? 0;
  const midi = 12 + octave * 12 + semi; // C1 = MIDI 24
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playPianoNote(ctx: AudioContext, frequency: number) {
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = Math.min(frequency * 10, 10000);
  filter.Q.value = 0.8;
  filter.connect(master);

  [[1, 1.0], [2, 0.45], [3, 0.2], [4, 0.1], [5, 0.05]].forEach(([mult, gain]) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency * mult;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(filter);
    osc.start(now);
    osc.stop(now + 2.5);
  });

  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.35, now + 0.008);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
  master.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
}

// ── Figurenote symbol ─────────────────────────────────────────────────────────

function FigureNoteSymbol({ letter, octave }: { letter: string; octave: number }) {
  const color = getNoteColor(letter);
  let shape: React.ReactNode;
  if (octave <= 2) {
    // × cross
    shape = (
      <>
        <line x1={6} y1={6} x2={34} y2={34} stroke={color} strokeWidth={8} strokeLinecap="round" />
        <line x1={34} y1={6} x2={6} y2={34} stroke={color} strokeWidth={8} strokeLinecap="round" />
      </>
    );
  } else if (octave === 3) {
    shape = <rect x={4} y={4} width={32} height={32} fill={color} rx={3} />;
  } else if (octave === 4) {
    shape = <circle cx={20} cy={20} r={17} fill={color} />;
  } else if (octave === 5) {
    shape = <polygon points="20,3 37,37 3,37" fill={color} />;
  } else {
    // Diamond for octave 6+
    shape = <polygon points="20,2 38,20 20,38 2,20" fill={color} />;
  }
  return <svg width={40} height={40} viewBox="0 0 40 40">{shape}</svg>;
}

// ── Fretboard input component (guitar & ukulele) ──────────────────────────────

function FretboardInput({
  stringDefs,
  frets,
  markers,
  onNotePress,
}: {
  stringDefs: readonly { readonly name: string; readonly openMidi: number }[];
  frets: number;
  markers: Set<number>;
  onNotePress: (letter: string, octave: number) => void;
}) {
  const totalW  = FB_LABEL_W + FB_OPEN_W + FB_NUT_W + frets * FB_FRET_W;
  const totalH  = stringDefs.length * FB_ROW_H;
  const inlayCY = Math.floor(stringDefs.length / 2) * FB_ROW_H;

  return (
    <div className="overflow-x-auto select-none">
      {/* Fret numbers */}
      <div className="flex mb-1" style={{ width: totalW }}>
        <div style={{ width: FB_LABEL_W }} />
        <div style={{ width: FB_OPEN_W }} className="text-center text-xs text-gray-400">0</div>
        <div style={{ width: FB_NUT_W }} />
        {Array.from({ length: frets }, (_, i) => (
          <div key={i} style={{ width: FB_FRET_W }} className="text-center text-xs text-gray-400">{i + 1}</div>
        ))}
      </div>

      {/* Fretboard body */}
      <div style={{ position: "relative", width: totalW, height: totalH }}>

        {/* Background: string lines */}
        {stringDefs.map((_, si) => (
          <div key={si} style={{
            position: "absolute",
            left: FB_LABEL_W,
            top: fbStringCenterY(si),
            width: totalW - FB_LABEL_W,
            height: 1 + (stringDefs.length - 1 - si) * 0.2,
            backgroundColor: "#ccc",
            pointerEvents: "none",
          }} />
        ))}

        {/* Background: nut */}
        <div style={{
          position: "absolute",
          left: FB_LABEL_W + FB_OPEN_W,
          top: 0,
          width: FB_NUT_W,
          height: totalH,
          backgroundColor: "#555",
          pointerEvents: "none",
        }} />

        {/* Background: fret wires */}
        {Array.from({ length: frets }, (_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: FB_LABEL_W + FB_OPEN_W + FB_NUT_W + (i + 1) * FB_FRET_W,
            top: 0,
            width: 1,
            height: totalH,
            backgroundColor: "#e5e7eb",
            pointerEvents: "none",
          }} />
        ))}

        {/* Background: inlay dots */}
        {Array.from({ length: frets }, (_, i) => {
          const fret = i + 1;
          const cx = FB_LABEL_W + FB_OPEN_W + FB_NUT_W + (fret - 0.5) * FB_FRET_W;
          if (fret === 12) return (
            <React.Fragment key={fret}>
              <div style={{ position: "absolute", left: cx - 9, top: inlayCY - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ddd", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: cx + 1, top: inlayCY - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ddd", pointerEvents: "none" }} />
            </React.Fragment>
          );
          if (!markers.has(fret)) return null;
          return (
            <div key={fret} style={{ position: "absolute", left: cx - 4, top: inlayCY - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ddd", pointerEvents: "none" }} />
          );
        })}

        {/* Interactive: string labels + buttons */}
        {stringDefs.map((str, si) => {
          const top = fbStringTopY(si);
          return (
            <div key={si} style={{ position: "absolute", top, left: 0, height: FB_ROW_H, display: "flex", alignItems: "center" }}>
              <div style={{ width: FB_LABEL_W }} className="text-xs font-bold text-gray-500 text-center shrink-0">{str.name}</div>
              {(() => {
                const { letter, octave } = midiToNote(str.openMidi);
                const color = getNoteColor(letter);
                return (
                  <button
                    onClick={() => onNotePress(letter, octave)}
                    title={`${displayLetter(letter)}${octave} (avoin)`}
                    style={{ width: FB_OPEN_W, height: FB_ROW_H }}
                    className="relative flex items-center justify-center hover:bg-blue-50/70 active:bg-blue-100/70 transition-colors group shrink-0"
                  >
                    <div className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-20 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: color }}>
                      {displayLetter(letter).replace("#", "♯")}
                    </div>
                  </button>
                );
              })()}
              <div style={{ width: FB_NUT_W, height: FB_ROW_H, flexShrink: 0 }} />
              {Array.from({ length: frets }, (_, fi) => {
                const { letter, octave } = midiToNote(str.openMidi + fi + 1);
                const color = getNoteColor(letter);
                return (
                  <button
                    key={fi}
                    onClick={() => onNotePress(letter, octave)}
                    title={`${displayLetter(letter)}${octave}`}
                    style={{ width: FB_FRET_W, height: FB_ROW_H }}
                    className="relative flex items-center justify-center hover:bg-blue-50/70 active:bg-blue-100/70 transition-colors group shrink-0"
                  >
                    <div className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: color }}>
                      {displayLetter(letter).replace("#", "♯")}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sequence item components ──────────────────────────────────────────────────

function NoteDisplay({
  item, selected, onToggleSelect, onRemove, onPlay,
}: {
  item: NoteItem;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onPlay: () => void;
}) {
  const color = getNoteColor(item.letter);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggleSelect(); onPlay(); }}
      className={`relative group flex flex-col items-center gap-1 rounded-lg p-1 cursor-pointer transition-all ${
        selected
          ? "ring-2 ring-blue-400 ring-offset-1 bg-blue-50"
          : "hover:bg-gray-50"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label={`Poista ${noteLabel(item.letter, item.octave)}`}
        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 text-xs hidden group-hover:flex items-center justify-center leading-none z-10"
      >
        ×
      </button>
      <FigureNoteSymbol letter={item.letter} octave={item.octave} />
      <span className="text-base font-bold" style={{ color }}>
        {noteLabel(item.letter, item.octave)}
      </span>
    </div>
  );
}

function BarlineDisplay({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="relative group flex items-center self-stretch py-1">
      <button
        onClick={onRemove}
        aria-label="Poista tahtiviiva"
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-200 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 text-xs hidden group-hover:flex items-center justify-center leading-none z-10"
      >
        ×
      </button>
      <div className="w-0.5 h-10 bg-gray-400 mx-2 rounded-full" />
    </div>
  );
}

function RepeatDisplay({ item, onRemove }: { item: RepeatItem; onRemove: () => void }) {
  return (
    <div className="relative group flex items-center">
      <button
        onClick={onRemove}
        aria-label="Poista toisto"
        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 text-xs hidden group-hover:flex items-center justify-center leading-none z-10"
      >
        ×
      </button>
      <span className="text-sm font-bold text-gray-500 border border-dashed border-gray-300 rounded-lg px-2 py-1">
        ×{item.count}
      </span>
    </div>
  );
}

function LineBreakMarker({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="relative group flex items-center ml-1">
      <button
        onClick={onRemove}
        aria-label="Poista rivinvaihto"
        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 text-xs hidden group-hover:flex items-center justify-center leading-none z-10"
      >
        ×
      </button>
      <span className="text-gray-300 text-xl select-none" title="Rivinvaihto (vie hiiri päälle poistaaksesi)">↵</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PianoNotesSection({ onNotesChange, transpose = 0 }: { onNotesChange?: (notes: PianoSeqItem[]) => void; transpose?: number } = {}) {
  const [items, setItems]             = useState<SeqItem[]>([]);
  const [repeatCount, setRepeatCount] = useState(2);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [history, setHistory]         = useState<SeqItem[][]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [inputMode, setInputMode]     = useState<"piano" | "guitar" | "ukulele">("piano");
  const [labelInput, setLabelInput]   = useState("");
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    onNotesChange?.(items.map(toShareable));
  }, [items, onNotesChange]);

  function play(letter: string, octave: number) {
    if (typeof window === "undefined") return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    playPianoNote(ctx, noteToFrequency(letter, octave));
  }

  // ── History ─────────────────────────────────────────────────────────────

  function snapshot() {
    setHistory((h) => [...h.slice(-49), items]);
  }

  function undo() {
    if (history.length === 0) return;
    setItems(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setSelectedUid(null);
  }

  // ── Item mutations ──────────────────────────────────────────────────────

  function append(...newItems: SeqItem[]) {
    snapshot();
    setItems((prev) => [...prev, ...newItems]);
  }

  function insertAfterSelected(...newItems: SeqItem[]) {
    snapshot();
    if (!selectedUid) { setItems((prev) => [...prev, ...newItems]); return; }
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.uid === selectedUid);
      if (idx === -1) return [...prev, ...newItems];
      return [...prev.slice(0, idx + 1), ...newItems, ...prev.slice(idx + 1)];
    });
    setSelectedUid(null);
  }

  function removeItem(itemUid: string) {
    snapshot();
    if (selectedUid === itemUid) setSelectedUid(null);
    setItems((prev) => prev.filter((it) => it.uid !== itemUid));
  }

  function updateNote(itemUid: string, letter: string, octave: number) {
    snapshot();
    setItems((prev) =>
      prev.map((it) =>
        it.uid === itemUid && it.kind === "note" ? { ...it, letter, octave } : it
      )
    );
  }

  function addLineBreak() {
    snapshot();
    const item: LineBreakItem = { kind: "linebreak", uid: uid() };
    if (selectedUid) {
      setItems((prev) => {
        const idx = prev.findIndex((it) => it.uid === selectedUid);
        if (idx === -1) return [...prev, item];
        return [...prev.slice(0, idx), item, ...prev.slice(idx)];
      });
      setSelectedUid(null);
    } else {
      setItems((prev) => [...prev, item]);
    }
  }

  function handleKeyPress(letter: string, octave: number) {
    play(letter, octave);
    if (previewMode) return;
    if (selectedUid) {
      updateNote(selectedUid, letter, octave);
      setSelectedUid(null);
    } else {
      append(makeNote(letter, octave));
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const totalKeyboardW = OCTAVE_W * KEYBOARD_OCTAVES.length;
  const rows = buildRows(items);
  const noteCount = items.filter((i) => i.kind === "note").length;
  const isReplacing = selectedUid !== null;

  const inputHint =
    previewMode    ? "Esikatselutila — nuotteja ei tallenneta" :
    isReplacing    ? "Napsauta korvataksesi valittu nuotti" :
    inputMode !== "piano" ? "Napsauta nauhaa lisätäksesi nuotteja" :
                   "Napsauta koskettimia lisätäksesi nuotteja";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6" onClick={() => setSelectedUid(null)}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Kuvionuottisarja</h3>
          <p className="text-sm text-gray-500">Rakenna melodia kuvionuoteilla</p>
        </div>
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              onClick={undo}
              title="Kumoa viimeisin muutos"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ↩ Kumoa
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={() => { snapshot(); setItems([]); setSelectedUid(null); }}
              title="Poista kaikki nuotit, tahtiviivat ja toistot"
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Tyhjennä kaikki
            </button>
          )}
        </div>
      </div>

      {/* Input mode + instrument */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Mode switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
              {(["piano", "guitar", "ukulele"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                    inputMode === mode
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {mode === "piano" ? "Piano" : mode === "guitar" ? "Kitara" : "Ukulele"}
                </button>
              ))}
            </div>
            <p className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
              previewMode ? "text-amber-500" : isReplacing ? "text-blue-500" : "text-gray-400"
            }`}>
              {inputHint}
            </p>
          </div>
          <button
            onClick={() => setPreviewMode((p) => !p)}
            title={previewMode ? "Poistu esikatselutilasta — koskettimien painallukset tallentuvat taas nuoteiksi" : "Siirry esikatselutilaan — voit soittaa koskettimia tallentamatta nuotteja"}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              previewMode
                ? "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                : "bg-red-50 text-red-600 border-red-300"
            }`}
          >
            {!previewMode && (
              <svg width={8} height={8} viewBox="0 0 8 8" className="shrink-0">
                <circle cx={4} cy={4} r={4} fill="currentColor" />
              </svg>
            )}
            {previewMode ? "Nauhoitus pois" : "Nauhoitus päällä"}
          </button>
        </div>

        {inputMode === "piano" && (
          <div className="overflow-x-auto">
            <div style={{ width: totalKeyboardW }} className="flex mb-1">
              {KEYBOARD_OCTAVES.map((oct) => (
                <div key={oct} style={{ width: OCTAVE_W }} className="text-xs text-gray-400 font-semibold pl-1">
                  {octaveLabel(oct)}
                </div>
              ))}
            </div>
            <div className="relative select-none" style={{ width: totalKeyboardW, height: WHITE_KEY_H }}>
              {KEYBOARD_OCTAVES.map((oct, octIdx) => {
                const octOffset = octIdx * OCTAVE_W;
                return (
                  <React.Fragment key={oct}>
                    {WHITE_KEYS.map((letter, i) => (
                      <button
                        key={`${letter}${oct}`}
                        onClick={() => handleKeyPress(letter, oct)}
                        title={noteLabel(letter, oct)}
                        style={{
                          position: "absolute",
                          left: octOffset + i * WHITE_KEY_W,
                          top: 0,
                          width: WHITE_KEY_W - 1,
                          height: WHITE_KEY_H,
                        }}
                        className="bg-white hover:bg-blue-50 active:bg-blue-100 border border-gray-300 rounded-b-md flex items-end justify-center pb-2 text-xs text-gray-500 font-medium transition-colors"
                      >
                        {displayLetter(letter)}
                      </button>
                    ))}
                    {BLACK_KEY_OFFSETS.map(({ letter, left }) => (
                      <button
                        key={`${letter}${oct}`}
                        onClick={() => handleKeyPress(letter, oct)}
                        title={noteLabel(letter, oct)}
                        style={{
                          position: "absolute",
                          left: octOffset + left,
                          top: 0,
                          width: BLACK_KEY_W,
                          height: BLACK_KEY_H,
                          zIndex: 1,
                        }}
                        className="bg-gray-900 hover:bg-gray-700 active:bg-gray-600 rounded-b-md text-gray-400 text-[9px] flex items-end justify-center pb-1 transition-colors"
                      >
                        {letter}
                      </button>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {inputMode === "guitar" && (
          <FretboardInput
            stringDefs={GUITAR_STRING_DEFS}
            frets={GUITAR_FRETS}
            markers={GUITAR_MARKERS}
            onNotePress={handleKeyPress}
          />
        )}

        {inputMode === "ukulele" && (
          <FretboardInput
            stringDefs={UKULELE_STRING_DEFS}
            frets={UKE_FRETS}
            markers={UKE_MARKERS}
            onNotePress={handleKeyPress}
          />
        )}
      </div>

      {/* Insert toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lisää:</span>

        <button
          onClick={() => insertAfterSelected({ kind: "barline", uid: uid() })}
          title="Lisää tahtiviiva sarjaan — erottaa tahteja toisistaan"
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          <span className="font-bold text-gray-400 text-base leading-none">|</span>
          Tahtiviiva
        </button>

        <div className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5">
          <span className="text-sm text-gray-500">×</span>
          <input
            type="number"
            value={repeatCount}
            onChange={(e) => setRepeatCount(Math.max(2, parseInt(e.target.value) || 2))}
            min={2}
            title="Toistomäärä — kuinka monta kertaa edellinen osio toistetaan"
            className="w-10 text-center border border-gray-200 rounded text-sm font-semibold text-gray-700 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={() => insertAfterSelected({ kind: "repeat", count: repeatCount, uid: uid() })}
            title={`Lisää toistomerkki — toistaa edellisen osion ${repeatCount} kertaa`}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Toisto
          </button>
        </div>

        <button
          onClick={addLineBreak}
          title="Lisää rivinvaihto — aloittaa uuden rivin nuottisarjassa"
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          ↵ Uusi rivi
        </button>

        <div className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && labelInput.trim()) {
                insertAfterSelected({ kind: "label", text: labelInput.trim(), uid: uid() });
                setLabelInput("");
              }
            }}
            placeholder="Osio..."
            title="Osion otsikko nuottisarjaan, esim. Intro, Säkeistö, Kertosäe"
            className="w-24 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={() => {
              if (!labelInput.trim()) return;
              insertAfterSelected({ kind: "label", text: labelInput.trim(), uid: uid() });
              setLabelInput("");
            }}
            title="Lisää osio-otsikko nuottisarjaan"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
          >
            Lisää otsikko
          </button>
        </div>
      </div>

      {/* Sequence display */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Sarja ({noteCount} {noteCount === 1 ? "nuotti" : "nuottia"})
            </p>
            {transpose !== 0 && (
              <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                Transponoitu {transpose > 0 ? "+" : ""}{transpose}
              </span>
            )}
          </div>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {row.label !== null && (
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <span className="text-sm font-bold text-gray-700 bg-gray-100 rounded-md px-2 py-0.5">
                    {row.label}
                  </span>
                  {row.labelUid && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(row.labelUid!); }}
                      aria-label={`Poista otsikko ${row.label}`}
                      className="w-4 h-4 bg-gray-200 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 min-h-16 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                {row.items.map((item) => {
                  if (item.kind === "note") {
                    const displayed = transposeNote(item.letter, item.octave, transpose);
                    return (
                      <NoteDisplay
                        key={item.uid}
                        item={{ ...item, ...displayed }}
                        selected={selectedUid === item.uid}
                        onToggleSelect={() =>
                          setSelectedUid((prev) => (prev === item.uid ? null : item.uid))
                        }
                        onRemove={() => removeItem(item.uid)}
                        onPlay={() => play(displayed.letter, displayed.octave)}
                      />
                    );
                  }
                  if (item.kind === "barline") {
                    return <BarlineDisplay key={item.uid} onRemove={() => removeItem(item.uid)} />;
                  }
                  if (item.kind === "repeat") {
                    return (
                      <RepeatDisplay
                        key={item.uid}
                        item={item}
                        onRemove={() => removeItem(item.uid)}
                      />
                    );
                  }
                  return null;
                })}
                {row.linebreakUid && (
                  <LineBreakMarker onRemove={() => removeItem(row.linebreakUid!)} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          Napsauta mitä tahansa koskettimia aloittaaksesi nuottien lisäämisen
        </div>
      )}
    </div>
  );
}
