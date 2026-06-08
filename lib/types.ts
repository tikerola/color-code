export interface Song {
  title: string;
  subtitle?: string;
  artist: string;
  url: string;
  chords: string[];
}

export interface Progression {
  sequence: string[];
  repeatCount: number;
}

export interface Chord {
  name: string;
  color: string;
}

export interface ChordDiagram {
  chord: string;
  instrument: "guitar" | "ukulele" | "piano" | "bass";
  svg: string;
}

export enum Instrument {
  GUITAR = "guitar",
  UKULELE = "ukulele",
  PIANO = "piano",
}

export interface ChordPosition {
  frets: number[];
  fingers?: number[];
  barres?: { fret: number; fromString: number; toString: number }[];
  baseFret?: number;
}

export interface PreviewResponse {
  song: Song;
  progression: Progression;
  chords: Chord[];
  diagrams: ChordDiagram[];
}

export interface GenerateResponse {
  pdfUrl: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export type PianoNoteItem      = { kind: "note";      letter: string; octave: number };
export type PianoBarlineItem   = { kind: "barline" };
export type PianoRepeatItem    = { kind: "repeat";    count: number };
export type PianoLineBreakItem = { kind: "linebreak" };
export type PianoSeqItem       = PianoNoteItem | PianoBarlineItem | PianoRepeatItem | PianoLineBreakItem;
