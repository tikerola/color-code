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
import type { Chord, ChordDiagram, Progression, Song } from "../types";

const LABEL_W = 48;
const DIAGRAM_W = 80;
const DIAGRAM_H = 95;
const COL_GAP = 12;

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 2 },
  artist: { fontSize: 13, color: "#555", marginBottom: 2 },
  url: { fontSize: 8, color: "#999" },
  grid: { flexDirection: "column" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: COL_GAP },
  instrRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4, gap: COL_GAP },
  labelCell: { width: LABEL_W },
  rowLabel: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", paddingTop: 6 },
  progressionLabel: { fontSize: 8, fontWeight: "bold", color: "#aaa", textTransform: "uppercase" },
  repeatNote: { fontSize: 7, color: "#bbb" },
  chordCell: { width: DIAGRAM_W, alignItems: "center" },
  chordBox: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, alignItems: "center", minWidth: 32 },
  chordLabel: { fontSize: 13, fontWeight: "bold" },
  diagramCell: { width: DIAGRAM_W, alignItems: "center" },
  footer: { position: "absolute", bottom: 16, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#aaa" },
});

const INSTRUMENTS = [
  { key: "guitar", label: "Guitar" },
  { key: "ukulele", label: "Ukulele" },
  { key: "piano", label: "Piano" },
] as const;

interface PdfProps {
  song: Song;
  progression: Progression;
  chords: Chord[];
  diagrams: ChordDiagram[];
}

function PdfDocument({ song, progression, chords, diagrams }: PdfProps) {
  const chordMap = new Map(chords.map((c) => [c.name, c]));
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.artist}>{song.artist}</Text>
          <Text style={styles.url}>{song.url}</Text>
        </View>

        {/* Column-aligned chord grid */}
        <View style={styles.grid}>

          {/* Progression row */}
          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.progressionLabel}>Chords</Text>
              {progression.repeatCount > 1 && (
                <Text style={styles.repeatNote}>×{progression.repeatCount}</Text>
              )}
            </View>
            {progression.sequence.map((name) => {
              const chord = chordMap.get(name) ?? { name, color: "#333" };
              return (
                <View key={name} style={styles.chordCell}>
                  <View style={[styles.chordBox, { borderColor: chord.color }]}>
                    <Text style={[styles.chordLabel, { color: chord.color }]}>{chord.name}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* One row per instrument */}
          {INSTRUMENTS.map(({ key, label }) => (
            <View key={key} style={styles.instrRow}>
              <View style={styles.labelCell}>
                <Text style={styles.rowLabel}>{label}</Text>
              </View>
              {progression.sequence.map((name) => {
                const d = diagrams.find((d) => d.chord === name && d.instrument === key);
                const dataUri = d
                  ? `data:image/svg+xml;base64,${Buffer.from(d.svg).toString("base64")}`
                  : undefined;
                return (
                  <View key={name} style={styles.diagramCell}>
                    {dataUri && <Image src={dataUri} style={{ width: DIAGRAM_W, height: DIAGRAM_H }} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

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
