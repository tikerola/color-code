import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Chord, ChordDiagram, PianoSeqItem, Progression, Song } from "../types";
import { getNoteColor } from "./chord-colors";

const COL_GAP = 10;
const PAGE_PAD = 24;
const A4_W = 595;
const USABLE_W = A4_W - 2 * PAGE_PAD; // 547pt

const styles = StyleSheet.create({
  page:              { padding: PAGE_PAD, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header:            { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 0.75, borderBottomColor: "#e0e0e0" },
  title:             { fontSize: 18, fontWeight: "bold", marginBottom: 2, color: "#111" },
  subtitle:          { fontSize: 12, color: "#555", marginBottom: 2 },
  artist:            { fontSize: 11, color: "#555", marginBottom: 1 },
  url:               { fontSize: 8, color: "#999" },
  sectionHeaderWrap: { marginTop: 10, marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: "#ddd", paddingBottom: 3 },
  sectionHeaderText: { fontSize: 8, fontWeight: "bold", color: "#666", textTransform: "uppercase" },
  repeatNote:        { fontSize: 7, color: "#bbb" },
  chordBox:          { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, alignItems: "center", minWidth: 24 },
  chordLabel:        { fontSize: 9, fontWeight: "bold", color: "#fff" },
  melodyHeaderWrap:  { marginTop: 6, marginBottom: 4 },
  melodyHeaderText:  { fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase" },
  footer:            { position: "absolute", bottom: 14, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" },
  footerText:        { fontSize: 8, color: "#aaa" },
});

const ALL_PDF_INSTRUMENTS = [
  { key: "guitar",  label: "Kitara"  },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano",   label: "Piano"   },
  { key: "bass",    label: "Basso"   },
] as const;

// ── Encoding helper (works in browser and Node.js) ─────────────────────────────

function svgToDataUri(svg: string): string {
  // encodeURIComponent → Latin-1 bytes → btoa avoids Buffer (Node-only)
  const b64 = btoa(
    encodeURIComponent(svg).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
  return `data:image/svg+xml;base64,${b64}`;
}

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
  return svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${shape}</svg>`);
}

// ── Keyboard SVG ───────────────────────────────────────────────────────────────

const KB_WKW = 36;
const KB_WKH = 60;
const KB_BKW = 22;
const KB_BKH = 37;
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
  const active = new Set<string>();
  for (const item of notes) {
    if (item.kind === "note") active.add(`${item.letter}${item.octave}`);
  }

  function symbolOnKey(cx: number, cy: number, r: number, letter: string, octave: number): string {
    const color = getNoteColor(letter);
    const fs = letter.length > 1 ? (r < 8 ? 4 : 5) : (r < 8 ? 5 : 6);
    const tx = `text-anchor="middle" font-size="${fs}" fill="white" font-weight="bold" font-family="Helvetica"`;
    if (octave === 1) {
      const ty = cy + fs * 0.38;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="white" stroke-width="0.8"/>`
           + `<text x="${cx}" y="${ty}" ${tx}>${letter}</text>`;
    }
    const pts = `${cx},${cy - r} ${cx + r * 1.2},${cy + r} ${cx - r * 1.2},${cy + r}`;
    const ty = cy + r / 3 + fs * 0.38;
    return `<polygon points="${pts}" fill="${color}" stroke="white" stroke-width="0.8"/>`
         + `<text x="${cx}" y="${ty}" ${tx}>${letter}</text>`;
  }

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${KB_TOTAL_W} ${KB_WKH}" width="${KB_TOTAL_W}" height="${KB_WKH}">`;

  for (let octIdx = 0; octIdx < 2; octIdx++) {
    const oct = octIdx + 1;
    const ox = octIdx * KB_OCT_W;

    for (let i = 0; i < WHITE_KEYS_LETTERS.length; i++) {
      const letter = WHITE_KEYS_LETTERS[i];
      const x = ox + i * KB_WKW;
      out += `<rect x="${x}" y="0" width="${KB_WKW - 1}" height="${KB_WKH}" fill="white" stroke="#ccc" stroke-width="1" rx="1"/>`;
      if (letter === "C") {
        out += `<text x="${x + 3}" y="${KB_WKH - 4}" font-size="7" fill="#aaa" font-family="Helvetica">C${oct}</text>`;
      }
    }

    for (let i = 0; i < WHITE_KEYS_LETTERS.length; i++) {
      const letter = WHITE_KEYS_LETTERS[i];
      if (!active.has(`${letter}${oct}`)) continue;
      const cx = ox + i * KB_WKW + (KB_WKW - 1) / 2;
      const cy = KB_BKH + (KB_WKH - KB_BKH) / 2;
      out += symbolOnKey(cx, cy, 9, letter, oct);
    }

    for (const { letter, x: bx } of BLACK_KEY_DEFS) {
      out += `<rect x="${ox + bx}" y="0" width="${KB_BKW}" height="${KB_BKH}" fill="#222" rx="2"/>`;
    }

    for (const { letter, x: bx } of BLACK_KEY_DEFS) {
      if (!active.has(`${letter}${oct}`)) continue;
      const cx = ox + bx + KB_BKW / 2;
      out += symbolOnKey(cx, KB_BKH - 7, 6, letter, oct);
    }
  }

  out += `</svg>`;
  return svgToDataUri(out);
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

  return (
    <View>
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeaderText}>Kuvionuottisarja</Text>
      </View>
      <Image src={keyboardSvgDataUri(notes)} style={{ width: KB_TOTAL_W, height: KB_WKH, marginBottom: 2 }} />
      <View style={styles.melodyHeaderWrap}>
        <Text style={styles.melodyHeaderText}>Melodia</Text>
      </View>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 5 }}>
          {row.map((item, idx) => {
            if (item.kind === "note") {
              const color = getNoteColor(item.letter);
              return (
                <View key={idx} style={{ alignItems: "center", marginRight: 6 }}>
                  <Image src={pianoNoteDataUri(item.letter, item.octave)} style={{ width: 22, height: 22 }} />
                  <Text style={{ fontSize: 7, color, fontWeight: "bold", marginTop: 1 }}>
                    {item.letter}{item.octave}
                  </Text>
                </View>
              );
            }
            if (item.kind === "barline") {
              return (
                <View key={idx} style={{ width: 1.5, height: 30, backgroundColor: "#888", marginHorizontal: 4, alignSelf: "center" }} />
              );
            }
            if (item.kind === "repeat") {
              return (
                <View key={idx} style={{ borderWidth: 0.5, borderColor: "#ccc", borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2, marginRight: 6, alignSelf: "center" }}>
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

export interface PdfProps {
  song: Song;
  progression: Progression;
  chords: Chord[];
  diagrams: ChordDiagram[];
  pianoNotes?: PianoSeqItem[];
  activeInstruments?: string[];
}

function PdfDocument({ song, progression, chords, diagrams, pianoNotes, activeInstruments }: PdfProps) {
  const chordMap = new Map(chords.map((c) => [c.name, c]));
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const instruments = (activeInstruments ?? [])
    .map((key) => ALL_PDF_INSTRUMENTS.find((i) => i.key === key))
    .filter((i): i is typeof ALL_PDF_INSTRUMENTS[number] => i !== undefined);

  const n = progression.sequence.length;
  const colW = Math.max(40, Math.floor((USABLE_W - n * COL_GAP) / n));
  const diagH = colW;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{song.title}</Text>
          {song.subtitle ? <Text style={styles.subtitle}>{song.subtitle}</Text> : null}
          <Text style={styles.artist}>{song.artist}</Text>
          <Text style={styles.url}>{song.url}</Text>
        </View>

        <View style={{ flexDirection: "column" }}>
          {/* Chords */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: COL_GAP }}>
            {progression.sequence.map((name) => {
              const chord = chordMap.get(name) ?? { name, color: "#333" };
              return (
                <View key={name} style={{ width: colW, alignItems: "center" }}>
                  <View style={[styles.chordBox, { backgroundColor: chord.color }]}>
                    <Text style={styles.chordLabel}>{chord.name}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Instrument diagram sections */}
          {instruments.map(({ key, label }) => (
            <View key={key}>
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionHeaderText}>{label}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 2, gap: COL_GAP }}>
                {progression.sequence.map((name) => {
                  const d = diagrams.find((d) => d.chord === name && d.instrument === key);
                  return (
                    <View key={name} style={{ width: colW, alignItems: "center" }}>
                      {d && <Image src={svgToDataUri(d.svg)} style={{ width: colW, height: diagH }} />}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

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

export async function generatePdfBlob(props: PdfProps): Promise<Blob> {
  // Dynamic import keeps the heavy pdf() renderer out of the SSR/build pass
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<PdfDocument {...props} />).toBlob();
}
