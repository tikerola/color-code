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
  chordBox:          { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, alignItems: "center", minWidth: 24 },
  chordLabel:        { fontSize: 9, fontWeight: "bold", color: "#fff" },
  footer:            { position: "absolute", bottom: 14, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" },
  footerText:        { fontSize: 8, color: "#aaa" },
});

const ALL_PDF_INSTRUMENTS = [
  { key: "guitar",  label: "Kitara"  },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano",   label: "Piano"   },
  { key: "bass",    label: "Basso"   },
] as const;

// ── Encoding helper ────────────────────────────────────────────────────────────

function svgToDataUri(svg: string): string {
  const b64 = btoa(
    encodeURIComponent(svg).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
  return `data:image/svg+xml;base64,${b64}`;
}

// ── Finnish note/chord display (B → H) ────────────────────────────────────────

const displayLetter = (l: string) => l === "B" ? "H" : l;
const displayChordName = (n: string) =>
  n.startsWith("B") && n[1] !== "b" ? "H" + n.slice(1) : n;

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

// ── Melody row builder ─────────────────────────────────────────────────────────

type PdfMelodyRow = { label: string | null; items: PianoSeqItem[] };

function buildPianoRows(notes: PianoSeqItem[]): PdfMelodyRow[] {
  const rows: PdfMelodyRow[] = [{ label: null, items: [] }];
  for (const item of notes) {
    if (item.kind === "linebreak") {
      rows.push({ label: null, items: [] });
    } else if (item.kind === "label") {
      rows.push({ label: item.text, items: [] });
    } else {
      rows[rows.length - 1].items.push(item);
    }
  }
  return rows.filter((r) => r.items.length > 0 || r.label !== null);
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
      {rows.map((row, rowIdx) => (
        <View key={rowIdx}>
          {row.label !== null && (
            <View style={{ marginTop: 5, marginBottom: 2 }}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: "#555" }}>{row.label}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 5 }}>
            {row.items.map((item, idx) => {
              if (item.kind === "note") {
                const color = getNoteColor(item.letter);
                return (
                  <View key={idx} style={{ alignItems: "center", marginRight: 6 }}>
                    <Image src={pianoNoteDataUri(item.letter, item.octave)} style={{ width: 22, height: 22 }} />
                    <Text style={{ fontSize: 7, color, fontWeight: "bold", marginTop: 1 }}>
                      {displayLetter(item.letter)}{item.octave}
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
                    <Text style={styles.chordLabel}>{displayChordName(chord.name)}</Text>
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
