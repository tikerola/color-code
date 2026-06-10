import type { ChordDiagram, ChordPosition } from "../types";
import { GUITAR_CHORDS } from "../data/guitar-chords";
import { UKULELE_CHORDS } from "../data/ukulele-chords";
import { getNoteColor } from "./chord-colors";

const FRET_ROWS = 5;

function guitarSvg(chord: string, pos: ChordPosition): string {
  const strings = 6;
  const w = 110, h = 116;
  const padLeft = 22, padTop = 14, padRight = 10;
  const colW = (w - padLeft - padRight) / (strings - 1);
  const rowH = (h - padTop - 12) / FRET_ROWS;
  const baseFret = pos.baseFret ?? 1;
  const minFret = Math.min(...pos.frets.filter((f) => f > 0));
  const displayBase = pos.frets.some((f) => f > FRET_ROWS) ? minFret : 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  // Nut or base fret indicator
  if (displayBase === 1) {
    svg += `<rect x="${padLeft}" y="${padTop}" width="${(strings - 1) * colW}" height="4" fill="black"/>`;
  } else {
    svg += `<text x="${padLeft - 9}" y="${padTop + rowH * 0.6}" text-anchor="end" font-size="9" font-family="Helvetica">${displayBase}fr</text>`;
  }

  // Fret lines
  for (let f = 0; f <= FRET_ROWS; f++) {
    const y = padTop + (displayBase === 1 ? 4 : 0) + f * rowH;
    svg += `<line x1="${padLeft}" y1="${y}" x2="${padLeft + (strings - 1) * colW}" y2="${y}" stroke="#999" stroke-width="1"/>`;
  }

  // String lines
  for (let s = 0; s < strings; s++) {
    const x = padLeft + s * colW;
    const topY = padTop + (displayBase === 1 ? 4 : 0);
    svg += `<line x1="${x}" y1="${topY}" x2="${x}" y2="${padTop + (displayBase === 1 ? 4 : 0) + FRET_ROWS * rowH}" stroke="#555" stroke-width="1.2"/>`;
  }

  // Barres
  if (pos.barres) {
    for (const b of pos.barres) {
      const relFret = b.fret - displayBase + 1;
      if (relFret < 1 || relFret > FRET_ROWS) continue;
      const y = padTop + (displayBase === 1 ? 4 : 0) + (relFret - 0.5) * rowH;
      const x1 = padLeft + (6 - b.fromString) * colW;
      const x2 = padLeft + (6 - b.toString) * colW;
      svg += `<rect x="${Math.min(x1,x2)}" y="${y - rowH * 0.3}" width="${Math.abs(x2-x1)}" height="${rowH * 0.6}" rx="${rowH * 0.3}" fill="#333"/>`;
    }
  }

  // Dots
  for (let s = 0; s < strings; s++) {
    const fret = pos.frets[s];
    const x = padLeft + s * colW;
    if (fret === -1) {
      svg += `<text x="${x}" y="${padTop - 4}" text-anchor="middle" font-size="10" fill="#c00" font-family="Helvetica">✕</text>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x}" cy="${padTop - 5}" r="4" fill="none" stroke="#555" stroke-width="1.2"/>`;
    } else {
      const relFret = fret - displayBase + 1;
      if (relFret >= 1 && relFret <= FRET_ROWS) {
        const y = padTop + (displayBase === 1 ? 4 : 0) + (relFret - 0.5) * rowH;
        svg += `<circle cx="${x}" cy="${y}" r="${rowH * 0.3}" fill="#333"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

function ukuleleSvg(chord: string, pos: ChordPosition): string {
  const strings = 4;
  const w = 80, h = 116;
  const padLeft = 18, padTop = 14, padRight = 10;
  const colW = (w - padLeft - padRight) / (strings - 1);
  const rowH = (h - padTop - 12) / FRET_ROWS;
  const minFret = Math.min(...pos.frets.filter((f) => f > 0));
  const displayBase = pos.frets.some((f) => f > FRET_ROWS) ? minFret : 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  if (displayBase === 1) {
    svg += `<rect x="${padLeft}" y="${padTop}" width="${(strings - 1) * colW}" height="4" fill="black"/>`;
  } else {
    svg += `<text x="${padLeft - 4}" y="${padTop + rowH * 0.6}" text-anchor="end" font-size="8" font-family="Helvetica">${displayBase}fr</text>`;
  }

  for (let f = 0; f <= FRET_ROWS; f++) {
    const y = padTop + (displayBase === 1 ? 4 : 0) + f * rowH;
    svg += `<line x1="${padLeft}" y1="${y}" x2="${padLeft + (strings - 1) * colW}" y2="${y}" stroke="#999" stroke-width="1"/>`;
  }

  for (let s = 0; s < strings; s++) {
    const x = padLeft + s * colW;
    const topY = padTop + (displayBase === 1 ? 4 : 0);
    svg += `<line x1="${x}" y1="${topY}" x2="${x}" y2="${topY + FRET_ROWS * rowH}" stroke="#555" stroke-width="1.2"/>`;
  }

  if (pos.barres) {
    for (const b of pos.barres) {
      const relFret = b.fret - displayBase + 1;
      if (relFret < 1 || relFret > FRET_ROWS) continue;
      const y = padTop + (displayBase === 1 ? 4 : 0) + (relFret - 0.5) * rowH;
      const fromIdx = strings - b.fromString;
      const toIdx = strings - b.toString;
      const x1 = padLeft + Math.min(fromIdx, toIdx) * colW;
      const x2 = padLeft + Math.max(fromIdx, toIdx) * colW;
      svg += `<rect x="${x1}" y="${y - rowH * 0.3}" width="${x2 - x1}" height="${rowH * 0.6}" rx="${rowH * 0.3}" fill="#333"/>`;
    }
  }

  for (let s = 0; s < strings; s++) {
    const fret = pos.frets[s];
    const x = padLeft + s * colW;
    if (fret === -1) {
      svg += `<text x="${x}" y="${padTop - 4}" text-anchor="middle" font-size="9" fill="#c00" font-family="Helvetica">✕</text>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x}" cy="${padTop - 5}" r="4" fill="none" stroke="#555" stroke-width="1.2"/>`;
    } else {
      const relFret = fret - displayBase + 1;
      if (relFret >= 1 && relFret <= FRET_ROWS) {
        const y = padTop + (displayBase === 1 ? 4 : 0) + (relFret - 0.5) * rowH;
        svg += `<circle cx="${x}" cy="${y}" r="${rowH * 0.3}" fill="#333"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

const OCTAVE_WHITE = ["C", "D", "E", "F", "G", "A", "B"] as const;
const OCTAVE_SHARP = ["C#", "D#", "", "F#", "G#", "A#", ""] as const;

// Treble half: show C D E F (4 keys) — covers all triad 5ths that wrap around
const TREBLE_COUNT = 4;

// Compute root-position MIDI notes for a chord, optionally voice-led toward prevMidi.
// Root octave is chosen (from 3, 4, 5) to minimise total semitone distance to prevMidi.
function getVoicedMidi(chord: string, prevMidi?: number[]): number[] {
  const allNotes = chordToNotes(chord);
  const root = normalizeNote(parseRoot(chord));
  const rootSemi = NOTE_ORDER.indexOf(root);
  if (rootSemi === -1 || allNotes.length === 0) return [];

  // MIDI for root in scientific octave N: C_N = 12*(N+1), root = C_N + rootSemi
  const rootMidiForOctave = (oct: number) => 12 * (oct + 1) + rootSemi;
  const notesToMidi = (rootMidi: number) =>
    allNotes.map((n) => rootMidi + (NOTE_ORDER.indexOf(n) - rootSemi + 12) % 12);

  if (!prevMidi || prevMidi.length === 0) {
    return notesToMidi(rootMidiForOctave(4));
  }

  let bestMidi: number[] = [];
  let bestDist = Infinity;
  const sortedPrev = [...prevMidi].sort((a, b) => a - b);

  for (const oct of [3, 4, 5]) {
    const candidate = notesToMidi(rootMidiForOctave(oct));
    const sorted = [...candidate].sort((a, b) => a - b);
    const n = Math.max(sorted.length, sortedPrev.length);
    let dist = 0;
    for (let i = 0; i < n; i++) {
      dist += Math.abs(
        sorted[Math.min(i, sorted.length - 1)] - sortedPrev[Math.min(i, sortedPrev.length - 1)]
      );
    }
    if (dist < bestDist) { bestDist = dist; bestMidi = candidate; }
  }
  return bestMidi;
}

function pianoSvgFromMidi(midiNotes: number[]): string {
  if (midiNotes.length === 0) {
    const w = 122, h = 88;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"/>`;
  }

  const rootMidi = Math.min(...midiNotes);
  // MIDI tier: floor(60/12)=5 → scientific octave 4 (C4=60). So octave = tier-1.
  const rootTier   = Math.floor(rootMidi / 12);
  const bassOctave = rootTier - 1;

  const bassNotes   = new Set<string>();
  const trebleNotes = new Set<string>();
  for (const m of midiNotes) {
    const name = NOTE_ORDER[m % 12];
    if (Math.floor(m / 12) === rootTier) bassNotes.add(name);
    else                                  trebleNotes.add(name);
  }

  const TOTAL = 7 + TREBLE_COUNT;
  const pad = 2;
  const wkW = 10.5;
  const w = Math.ceil(pad + TOTAL * wkW + wkW * 0.6 / 2 + pad);
  const keyTop = 4;
  const wkH = 80;
  const h = keyTop + wkH + 4;
  const bkW = wkW * 0.6;
  const bkH = wkH * 0.58;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  // Bass octave: 7 white keys (C–B)
  for (let i = 0; i < 7; i++) {
    const x = pad + i * wkW;
    svg += `<rect x="${x + 0.5}" y="${keyTop}" width="${wkW - 1}" height="${wkH}" fill="white" stroke="#bbb" stroke-width="0.8" rx="1"/>`;
    if (bassNotes.has(OCTAVE_WHITE[i]))
      svg += kuvionuottiSvg(x + wkW / 2, keyTop + wkH - 7, wkW * 0.36, OCTAVE_WHITE[i], bassOctave);
  }

  // Treble half: first TREBLE_COUNT white keys (C D E F)
  for (let i = 0; i < TREBLE_COUNT; i++) {
    const x = pad + (7 + i) * wkW;
    svg += `<rect x="${x + 0.5}" y="${keyTop}" width="${wkW - 1}" height="${wkH}" fill="white" stroke="#bbb" stroke-width="0.8" rx="1"/>`;
    if (trebleNotes.has(OCTAVE_WHITE[i]))
      svg += kuvionuottiSvg(x + wkW / 2, keyTop + wkH - 7, wkW * 0.36, OCTAVE_WHITE[i], bassOctave + 1);
  }

  // Octave divider
  const divX = pad + 7 * wkW;
  svg += `<line x1="${divX}" y1="${keyTop}" x2="${divX}" y2="${keyTop + wkH}" stroke="#999" stroke-width="1.5"/>`;

  // Bass black keys
  for (let i = 0; i < 7; i++) {
    const sharp = OCTAVE_SHARP[i];
    if (!sharp) continue;
    const x = pad + i * wkW + wkW - bkW / 2;
    svg += `<rect x="${x}" y="${keyTop}" width="${bkW}" height="${bkH}" fill="#222" stroke="#111" stroke-width="0.5" rx="1"/>`;
    if (bassNotes.has(sharp))
      svg += kuvionuottiSvg(x + bkW / 2, keyTop + bkH - 5, bkW * 0.36, sharp, bassOctave);
  }

  // Treble black keys (within TREBLE_COUNT range)
  for (let i = 0; i < TREBLE_COUNT; i++) {
    const sharp = OCTAVE_SHARP[i];
    if (!sharp) continue;
    const x = pad + (7 + i) * wkW + wkW - bkW / 2;
    svg += `<rect x="${x}" y="${keyTop}" width="${bkW}" height="${bkH}" fill="#222" stroke="#111" stroke-width="0.5" rx="1"/>`;
    if (trebleNotes.has(sharp))
      svg += kuvionuottiSvg(x + bkW / 2, keyTop + bkH - 5, bkW * 0.36, sharp, bassOctave + 1);
  }

  svg += `</svg>`;
  return svg;
}

// Build voice-led piano diagrams for a whole sequence (each chord references the previous).
export function buildPianoSequenceDiagrams(sequence: string[]): ChordDiagram[] {
  const result: ChordDiagram[] = [];
  let prevMidi: number[] | undefined;
  for (let i = 0; i < sequence.length; i++) {
    const midi = getVoicedMidi(sequence[i], prevMidi);
    result.push({ chord: sequence[i], instrument: "piano", svg: pianoSvgFromMidi(midi), sequenceIndex: i });
    prevMidi = midi;
  }
  return result;
}

// Shape encodes the octave (official kuvionuotti): square=3, circle=4, triangle=5.
// Color encodes the note letter.
function kuvionuottiSvg(cx: number, cy: number, r: number, note: string, octave: number): string {
  const color = getNoteColor(note);
  const s = `stroke="white" stroke-width="0.8"`;
  if (octave <= 3) {
    return `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="${color}" ${s} rx="${r * 0.2}"/>`;
  } else if (octave >= 5) {
    return `<polygon points="${cx},${cy - r} ${cx + r * 1.2},${cy + r} ${cx - r * 1.2},${cy + r}" fill="${color}" ${s}/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${s}/>`;
}

function chordToNotes(chord: string): string[] {
  const root = parseRoot(chord);
  const quality = chord.slice(root.length);
  const rootIdx = NOTE_ORDER.indexOf(normalizeNote(root));
  if (rootIdx === -1) return [root];

  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS[""] ?? [0, 4, 7];
  return intervals.map((i) => NOTE_ORDER[(rootIdx + i) % 12]);
}

const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const CHORD_INTERVALS: Record<string, number[]> = {
  "":     [0, 4, 7],
  "m":    [0, 3, 7],
  "7":    [0, 4, 7, 10],
  "m7":   [0, 3, 7, 10],
  "maj7": [0, 4, 7, 11],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
  "dim":  [0, 3, 6],
  "aug":  [0, 4, 8],
  "add9": [0, 4, 7, 14],
};

function normalizeNote(note: string): string {
  const map: Record<string, string> = { "Db": "C#", "Eb": "D#", "Fb": "E", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Cb": "B" };
  return map[note] ?? note;
}

function parseRoot(chord: string): string {
  if (chord.length >= 2 && (chord[1] === "#" || chord[1] === "b")) return chord.slice(0, 2);
  return chord.slice(0, 1);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Enharmonic equivalents — both directions so C# ↔ Db, G# ↔ Ab, etc.
const ENHARMONIC: Record<string, string> = {
  "C#": "Db", "Db": "C#",
  "D#": "Eb", "Eb": "D#",
  "F#": "Gb", "Gb": "F#",
  "G#": "Ab", "Ab": "G#",
  "A#": "Bb", "Bb": "A#",
};

function findChordPos(
  data: Record<string, ChordPosition>,
  chordName: string
): ChordPosition | undefined {
  if (data[chordName]) return data[chordName];
  const root = parseRoot(chordName);
  const altRoot = ENHARMONIC[root];
  if (altRoot) return data[altRoot + chordName.slice(root.length)];
  return undefined;
}

function bassSvg(pos: ChordPosition): string {
  const strings = 4;
  const w = 80, h = 116;
  const padLeft = 18, padTop = 14, padRight = 10;
  const colW = (w - padLeft - padRight) / (strings - 1);
  const rowH = (h - padTop - 12) / FRET_ROWS;
  const minFret = Math.min(...pos.frets.filter((f) => f > 0));
  const displayBase = pos.frets.some((f) => f > FRET_ROWS) ? minFret : 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  if (displayBase === 1) {
    svg += `<rect x="${padLeft}" y="${padTop}" width="${(strings - 1) * colW}" height="4" fill="black"/>`;
  } else {
    // Place fret indicator above the grid, well clear of the first dot
    svg += `<text x="${padLeft - 4}" y="${padTop - 3}" text-anchor="end" font-size="8" font-family="Helvetica">${displayBase}fr</text>`;
  }

  for (let f = 0; f <= FRET_ROWS; f++) {
    const y = padTop + (displayBase === 1 ? 4 : 0) + f * rowH;
    svg += `<line x1="${padLeft}" y1="${y}" x2="${padLeft + (strings - 1) * colW}" y2="${y}" stroke="#999" stroke-width="1"/>`;
  }

  for (let s = 0; s < strings; s++) {
    const x = padLeft + s * colW;
    const topY = padTop + (displayBase === 1 ? 4 : 0);
    svg += `<line x1="${x}" y1="${topY}" x2="${x}" y2="${topY + FRET_ROWS * rowH}" stroke="#555" stroke-width="1.2"/>`;
  }

  const BASS_STRINGS = ["E", "A", "D", "G"];
  for (let s = 0; s < strings; s++) {
    svg += `<text x="${padLeft + s * colW}" y="${h - 2}" text-anchor="middle" font-size="7" fill="#aaa" font-family="Helvetica">${BASS_STRINGS[s]}</text>`;
  }

  for (let s = 0; s < strings; s++) {
    const fret = pos.frets[s];
    const x = padLeft + s * colW;
    if (fret === -1) {
      svg += `<text x="${x}" y="${padTop - 4}" text-anchor="middle" font-size="10" fill="#c00" font-family="Helvetica">✕</text>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x}" cy="${padTop - 5}" r="4" fill="none" stroke="#555" stroke-width="1.2"/>`;
    } else {
      const relFret = fret - displayBase + 1;
      if (relFret >= 1 && relFret <= FRET_ROWS) {
        const y = padTop + (displayBase === 1 ? 4 : 0) + (relFret - 0.5) * rowH;
        svg += `<circle cx="${x}" cy="${y}" r="${rowH * 0.3}" fill="#333"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

function fallbackBassChord(name: string): ChordPosition {
  const root = parseRoot(name);
  const semi = NOTE_ORDER.indexOf(normalizeNote(root));
  if (semi === -1) return { frets: [-1, -1, -1, -1] };
  const eFret = (semi - 4 + 12) % 12; // 0 = open E (avoid)
  const aFret = (semi - 9 + 12) % 12; // 0 = open A (avoid)
  // Prefer frets 1-5 on lowest string first (student-friendly positions)
  if (eFret >= 1 && eFret <= 5) return { frets: [eFret, -1, -1, -1] };
  if (aFret >= 1 && aFret <= 5) return { frets: [-1, aFret, -1, -1] };
  // Fallback: lowest available closed fret across both strings
  const closedE = eFret === 0 ? Infinity : eFret;
  const closedA = aFret === 0 ? Infinity : aFret;
  return closedA <= closedE
    ? { frets: [-1, aFret, -1, -1] }
    : { frets: [eFret, -1, -1, -1] };
}

export function getChordDiagram(chordName: string, instrument: "guitar" | "ukulele" | "piano" | "bass"): ChordDiagram {
  let svg: string;

  if (instrument === "piano") {
    svg = pianoSvgFromMidi(getVoicedMidi(chordName));
  } else if (instrument === "guitar") {
    const pos = findChordPos(GUITAR_CHORDS, chordName) ?? fallbackGuitarChord(chordName);
    svg = guitarSvg(chordName, pos);
  } else if (instrument === "bass") {
    svg = bassSvg(fallbackBassChord(chordName));
  } else {
    const pos = findChordPos(UKULELE_CHORDS, chordName) ?? fallbackUkuleleChord(chordName);
    svg = ukuleleSvg(chordName, pos);
  }

  return { chord: chordName, instrument, svg };
}

function fallbackGuitarChord(name: string): ChordPosition {
  const root = parseRoot(name);
  const quality = name.slice(root.length);
  const fret = NOTE_ORDER.indexOf(normalizeNote(root));
  const isMajor = !quality.startsWith("m") || quality.startsWith("maj");
  if (fret >= 0) {
    return isMajor
      ? { frets: [fret + 1, fret + 3, fret + 3, fret + 2, fret + 1, fret + 1], barres: [{ fret: fret + 1, fromString: 6, toString: 1 }] }
      : { frets: [fret + 1, fret + 3, fret + 3, fret + 1, fret + 1, fret + 1], barres: [{ fret: fret + 1, fromString: 6, toString: 1 }] };
  }
  return { frets: [0, 0, 0, 0, 0, 0] };
}

function fallbackUkuleleChord(name: string): ChordPosition {
  const root = parseRoot(name);
  const quality = name.slice(root.length);
  const isMajor = !quality.startsWith("m") || quality.startsWith("maj");
  const rootSemi = NOTE_ORDER.indexOf(normalizeNote(root));
  if (rootSemi < 0) return { frets: [0, 0, 0, 0] };

  // A-shape movable barre. Open A major = [2,1,0,0]; offset n semitones above A (idx 9).
  const n = ((rootSemi - 9) + 12) % 12;
  if (isMajor) {
    if (n === 0) return { frets: [2, 1, 0, 0] };
    return {
      frets: [n + 2, n + 1, n, n],
      barres: [{ fret: n, fromString: 4, toString: 1 }],
    };
  } else {
    // Am-shape: open Am = [2,0,0,0]
    if (n === 0) return { frets: [2, 0, 0, 0] };
    return {
      frets: [n + 2, n, n, n],
      barres: [{ fret: n, fromString: 3, toString: 1 }],
    };
  }
}

