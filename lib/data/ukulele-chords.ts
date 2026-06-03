import type { ChordPosition } from "../types";

// frets: [string4(G), string3(C), string2(E), string1(A)]
// -1 = muted, 0 = open
export const UKULELE_CHORDS: Record<string, ChordPosition> = {
  // Natural notes
  C:   { frets: [0, 0, 0, 3] },
  Cm:  { frets: [0, 3, 3, 3], barres: [{ fret: 3, fromString: 3, toString: 1 }] },
  D:   { frets: [2, 2, 2, 0] },
  Dm:  { frets: [2, 2, 1, 0] },
  E:   { frets: [4, 4, 4, 2] },
  Em:  { frets: [0, 4, 3, 2] },
  F:   { frets: [2, 0, 1, 0] },
  Fm:  { frets: [1, 0, 1, 3] },
  G:   { frets: [0, 2, 3, 2] },
  Gm:  { frets: [0, 2, 3, 1] },
  A:   { frets: [2, 1, 0, 0] },
  Am:  { frets: [2, 0, 0, 0] },
  B:   { frets: [4, 3, 2, 2] },
  Bm:  { frets: [4, 2, 2, 2], barres: [{ fret: 2, fromString: 3, toString: 1 }] },

  // Flat names (kept so existing lookups still work)
  Bb:  { frets: [3, 2, 1, 1], barres: [{ fret: 1, fromString: 3, toString: 1 }] },
  Eb:  { frets: [0, 3, 3, 1] },
  Ab:  { frets: [5, 4, 4, 3] },
  Db:  { frets: [1, 1, 1, 4], barres: [{ fret: 1, fromString: 4, toString: 2 }] },
  Gb:  { frets: [3, 1, 2, 1], barres: [{ fret: 1, fromString: 3, toString: 1 }] },

  // Sharp names — produced by the transposer
  "C#": { frets: [1, 1, 1, 4], barres: [{ fret: 1, fromString: 4, toString: 2 }] },
  "C#m": { frets: [1, 1, 0, 4] },
  "D#": { frets: [3, 3, 3, 1], barres: [{ fret: 1, fromString: 1, toString: 1 }] },
  "D#m": { frets: [3, 3, 2, 1] },
  "F#": { frets: [3, 1, 2, 1], barres: [{ fret: 1, fromString: 3, toString: 1 }] },
  "F#m": { frets: [2, 1, 2, 0] },
  "G#": { frets: [5, 4, 4, 3] },                  // same shape as Ab
  "G#m": { frets: [1, 3, 4, 2] },
  "A#": { frets: [3, 2, 1, 1], barres: [{ fret: 1, fromString: 3, toString: 1 }] },
  "A#m": { frets: [3, 1, 1, 1], barres: [{ fret: 1, fromString: 3, toString: 1 }] },

  // 7th / extended chords
  G7:    { frets: [0, 2, 1, 2] },
  D7:    { frets: [2, 2, 2, 3] },
  E7:    { frets: [1, 2, 0, 2] },
  A7:    { frets: [0, 1, 0, 0] },
  Cmaj7: { frets: [0, 0, 0, 2] },
  Fmaj7: { frets: [2, 0, 1, 0] },
  Dsus4: { frets: [0, 2, 3, 0] },
  Asus4: { frets: [2, 2, 0, 0] },
};
