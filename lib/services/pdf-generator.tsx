import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Chord, ChordDiagram, PianoSeqItem, Progression, Song } from "../types";
import { getNoteColor } from "./chord-colors";

const LABEL_W = 48;
const COL_GAP = 12;
const PAGE_PAD = 32;
const A4_W = 595;
const USABLE_W = A4_W - 2 * PAGE_PAD; // 531pt

const styles = StyleSheet.create({
  page:              { padding: PAGE_PAD, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header:            { marginBottom: 20 },
  title:             { fontSize: 20, fontWeight: "bold", marginBottom: 2 },
  artist:            { fontSize: 13, color: "#555", marginBottom: 2 },
  url:               { fontSize: 8, color: "#999" },
  labelCell:         { width: LABEL_W },
  rowLabel:          { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", paddingTop: 6 },
  progressionLabel:  { fontSize: 8, fontWeight: "bold", color: "#aaa", textTransform: "uppercase" },
  repeatNote:        { fontSize: 7, color: "#bbb" },
  chordBox:          { borderWidth: 4, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, alignItems: "center", minWidth: 32 },
  chordLabel:        { fontSize: 13, fontWeight: "bold" },
  footer:            { position: "absolute", bottom: 16, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText:        { fontSize: 8, color: "#aaa" },
  pianoHeader:       { fontSize: 10, fontWeight: "bold", color: "#888", textTransform: "uppercase", marginBottom: 8 },
});

const INSTRUMENTS = [
  { key: "guitar",  label: "Guitar"  },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano",   label: "Piano"   },
] as const;

// ── Figurenote helpers ─────────────────────────────────────────────────────────

function pianoNoteDataUri(letter: string, octave: number): string {
  const color = getNoteColor(letter);
  let shape: string;
  if (octave === 1) {
    shape = `<circle cx="20" cy="20" r="17" fill="${color}"/>`;
  } else if (octave === 2) {
    shape = `<polygon points="20,3 37,37 3,37" fill="${color}"/>`;
  } else {
    shape = `<circle cx="20" cy="20" r="17" fill="${color}"/><text x="20" y="25" text-anchor="middle" font-size="13" fill="white" font-weight="bold">${octave}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${shape}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ── Keyboard SVG ───────────────────────────────────────────────────────────────

const KB_WKW = 36;          // white key width
const KB_WKH = 80;          // white key height
const KB_BKW = 22;          // black key width
const KB_BKH = 50;          // black key height
const KB_OCT_W = KB_WKW * 7;
const KB_TOTAL_W = KB_OCT_W * 2;

const WHITE_KEYS_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEY_DEFS = [
  { letter: "C#", x: 25 },
  { letter: "D#", x: 61 },
  { letter: "F#", x: 133 },
  { letter: "G#", x: 169 },
  { letter: "A#", x: 205 },
];

function keyboardSvgDataUri(notes: PianoSeqItem[]): string {
  // Collect unique note keys present in the sequence
  const active = new Set<string>();
  for (const item of notes) {
    if (item.kind === "note") active.add(`${item.letter}${item.octave}`);
  }

  function symbolOnKey(cx: number, cy: number, r: number, letter: string, octave: number): string {
    const color = getNoteColor(letter);
    if (octave === 1) {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="white" stroke-width="0.8"/>`;
    }
    const pts = `${cx},${cy - r} ${cx + r * 1.2},${cy + r} ${cx - r * 1.2},${cy + r}`;
    return `<polygon points="${pts}" fill="${color}" stroke="white" stroke-width="0.8"/>`;
  }

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${KB_TOTAL_W} ${KB_WKH}" width="${KB_TOTAL_W}" height="${KB_WKH}">`;

  for (let octIdx = 0; octIdx < 2; octIdx++) {
    const oct = octIdx + 1;
    const ox = octIdx * KB_OCT_W;

    // White keys
    for (let i = 0; i < WHITE_KEYS_LETTERS.length; i++) {
      const letter = WHITE_KEYS_LETTERS[i];
      const x = ox + i * KB_WKW;
      out += `<rect x="${x}" y="0" width="${KB_WKW - 1}" height="${KB_WKH}" fill="white" stroke="#ccc" stroke-width="1" rx="1"/>`;
      // "C1"/"C2" label on C key
      if (letter === "C") {
        out += `<text x="${x + 3}" y="${KB_WKH - 4}" font-size="7" fill="#aaa" font-family="Helvetica">C${oct}</text>`;
      }
    }

    // Symbols on white keys (drawn before black keys so blacks overlay top portion)
    for (let i = 0; i < WHITE_KEYS_LETTERS.length; i++) {
      const letter = WHITE_KEYS_LETTERS[i];
      if (!active.has(`${letter}${oct}`)) continue;
      const cx = ox + i * KB_WKW + (KB_WKW - 1) / 2;
      const cy = KB_BKH + (KB_WKH - KB_BKH) / 2; // centre of lower white area
      out += symbolOnKey(cx, cy, 12, letter, oct);
    }

    // Black keys
    for (const { letter, x: bx } of BLACK_KEY_DEFS) {
      const x = ox + bx;
      out += `<rect x="${x}" y="0" width="${KB_BKW}" height="${KB_BKH}" fill="#222" rx="2"/>`;
    }

    // Symbols on black keys
    for (const { letter, x: bx } of BLACK_KEY_DEFS) {
      if (!active.has(`${letter}${oct}`)) continue;
      const cx = ox + bx + KB_BKW / 2;
      const cy = KB_BKH - 10;
      out += symbolOnKey(cx, cy, 8, letter, oct);
    }
  }

  out += `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(out).toString("base64")}`;
}

function buildPianoRows(notes: PianoSeqItem[]): Exclude<PianoSeqItem, { kind: "linebreak" }>[][] {
  const rows: Exclude<PianoSeqItem, { kind: "linebreak" }>[][] = [[]];
  for (const item of notes) {
    if (item.kind === "linebreak") {
      rows.push([]);
    } else {
      rows[rows.length - 1].push(item as Exclude<PianoSeqItem, { kind: "linebreak" }>);
    }
  }
  return rows.filter((r) => r.length > 0);
}

// ── Piano notes PDF section ────────────────────────────────────────────────────

function PianoNotesPdfSection({ notes }: { notes: PianoSeqItem[] }) {
  const rows = buildPianoRows(notes);
  if (rows.length === 0) return null;

  const kbUri = keyboardSvgDataUri(notes);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.pianoHeader}>Piano Note Sequence</Text>
      {/* Keyboard overview with active keys marked */}
      <Image src={kbUri} style={{ width: KB_TOTAL_W, height: KB_WKH, marginBottom: 10 }} />
      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}
        >
          {row.map((item, idx) => {
            if (item.kind === "note") {
              const color = getNoteColor(item.letter);
              return (
                <View key={idx} style={{ alignItems: "center", marginRight: 6 }}>
                  <Image
                    src={pianoNoteDataUri(item.letter, item.octave)}
                    style={{ width: 26, height: 26 }}
                  />
                  <Text style={{ fontSize: 7, color, fontWeight: "bold", marginTop: 1 }}>
                    {item.letter}{item.octave}
                  </Text>
                </View>
              );
            }
            if (item.kind === "barline") {
              return (
                <View
                  key={idx}
                  style={{ width: 1.5, height: 38, backgroundColor: "#888", marginHorizontal: 4, alignSelf: "center" }}
                />
              );
            }
            if (item.kind === "repeat") {
              return (
                <View
                  key={idx}
                  style={{ borderWidth: 0.5, borderColor: "#ccc", borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2, marginRight: 6, alignSelf: "center" }}
                >
                  <Text style={{ fontSize: 8, color: "#666" }}>×{item.count}</Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      ))}
    </View>
  );
}

// ── Main PDF document ──────────────────────────────────────────────────────────

interface PdfProps {
  song: Song;
  progression: Progression;
  chords: Chord[];
  diagrams: ChordDiagram[];
  pianoNotes?: PianoSeqItem[];
}

function PdfDocument({ song, progression, chords, diagrams, pianoNotes }: PdfProps) {
  const chordMap = new Map(chords.map((c) => [c.name, c]));
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  // Dynamic column width: fill page width based on chord count
  const n = progression.sequence.length;
  const colW = Math.max(40, Math.floor((USABLE_W - LABEL_W - n * COL_GAP) / n));
  const diagH = Math.round(colW * 1.18); // ~guitar aspect ratio

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.artist}>{song.artist}</Text>
          <Text style={styles.url}>{song.url}</Text>
        </View>

        {/* Chord grid */}
        <View style={{ flexDirection: "column" }}>

          {/* Progression row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: COL_GAP }}>
            <View style={styles.labelCell}>
              <Text style={styles.progressionLabel}>Chords</Text>
              {progression.repeatCount > 1 && (
                <Text style={styles.repeatNote}>×{progression.repeatCount}</Text>
              )}
            </View>
            {progression.sequence.map((name) => {
              const chord = chordMap.get(name) ?? { name, color: "#333" };
              return (
                <View key={name} style={{ width: colW, alignItems: "center" }}>
                  <View style={[styles.chordBox, { borderColor: chord.color }]}>
                    <Text style={[styles.chordLabel, { color: chord.color }]}>{chord.name}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* One row per instrument */}
          {INSTRUMENTS.map(({ key, label }) => (
            <View key={key} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4, gap: COL_GAP }}>
              <View style={styles.labelCell}>
                <Text style={styles.rowLabel}>{label}</Text>
              </View>
              {progression.sequence.map((name) => {
                const d = diagrams.find((d) => d.chord === name && d.instrument === key);
                const dataUri = d
                  ? `data:image/svg+xml;base64,${Buffer.from(d.svg).toString("base64")}`
                  : undefined;
                return (
                  <View key={name} style={{ width: colW, alignItems: "center" }}>
                    {dataUri && (
                      <Image src={dataUri} style={{ width: colW, height: diagH }} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Piano notes section */}
        {pianoNotes && pianoNotes.length > 0 && (
          <PianoNotesPdfSection notes={pianoNotes} />
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated: {timestamp}</Text>
          <Text style={styles.footerText}>{song.url}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePdf(props: PdfProps): Promise<Buffer> {
  const buffer = await renderToBuffer(<PdfDocument {...props} />);
  return Buffer.from(buffer);
}
