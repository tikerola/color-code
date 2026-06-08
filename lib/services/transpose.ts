import type { Chord, ChordDiagram, PreviewResponse, PianoSeqItem } from "../types";
import { getChordColor } from "./chord-colors";
import { getChordDiagram } from "./chord-diagram";

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NORMALIZE: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B",
};

function parseRoot(chord: string): string {
  if (chord.length >= 2 && (chord[1] === "#" || chord[1] === "b")) return chord.slice(0, 2);
  return chord.slice(0, 1);
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  const root = parseRoot(chord);
  const quality = chord.slice(root.length);
  const normalized = FLAT_NORMALIZE[root] ?? root;
  const idx = CHROMATIC.indexOf(normalized as typeof CHROMATIC[number]);
  if (idx === -1) return chord;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx] + quality;
}

export function transposePianoNotes(notes: PianoSeqItem[], semitones: number): PianoSeqItem[] {
  if (semitones === 0) return notes;
  return notes.map((item) => {
    if (item.kind !== "note") return item;
    const normalized = FLAT_NORMALIZE[item.letter] ?? item.letter;
    const idx = CHROMATIC.indexOf(normalized as typeof CHROMATIC[number]);
    if (idx === -1) return item;
    const rawNewIdx = idx + semitones;
    const octaveShift = Math.floor(rawNewIdx / 12);
    const newIdx = ((rawNewIdx % 12) + 12) % 12;
    return { ...item, letter: CHROMATIC[newIdx], octave: item.octave + octaveShift };
  });
}

export function applyTransposition(data: PreviewResponse, semitones: number): PreviewResponse {
  if (semitones === 0) return data;

  const newSequence = data.progression.sequence.map((c) => transposeChord(c, semitones));

  const chords: Chord[] = newSequence.map((name) => ({
    name,
    color: getChordColor(name),
  }));

  const diagrams: ChordDiagram[] = [];
  for (const chord of newSequence) {
    for (const instrument of ["guitar", "ukulele", "piano"] as const) {
      diagrams.push(getChordDiagram(chord, instrument));
    }
  }

  return {
    song: data.song,
    progression: { ...data.progression, sequence: newSequence },
    chords,
    diagrams,
  };
}
