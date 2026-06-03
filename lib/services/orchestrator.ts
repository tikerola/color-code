import { getProvider } from "../providers/registry";
import { ProgressionDetector } from "./progression-detector";
import { getChordColor } from "./chord-colors";
import { getChordDiagram } from "./chord-diagram";
import type { Chord, ChordDiagram, PreviewResponse } from "../types";
import { Instrument } from "../types";

export async function buildPreviewData(url: string): Promise<PreviewResponse> {
  const start = Date.now();

  const provider = getProvider(url);
  const song = await provider.extract(url);
  console.log(`[orchestrator] extraction: ${Date.now() - start}ms, chords: ${song.chords.length}`);

  const progressionStart = Date.now();
  const progression = ProgressionDetector.detect(song.chords);
  console.log(`[orchestrator] progression detection: ${Date.now() - progressionStart}ms`);

  const chords: Chord[] = progression.sequence.map((name) => ({
    name,
    color: getChordColor(name),
  }));

  const diagramStart = Date.now();
  const diagrams: ChordDiagram[] = [];
  for (const chord of progression.sequence) {
    for (const instrument of [Instrument.GUITAR, Instrument.UKULELE, Instrument.PIANO] as const) {
      diagrams.push(getChordDiagram(chord, instrument));
    }
  }
  console.log(`[orchestrator] diagram generation: ${Date.now() - diagramStart}ms`);

  return { song, progression, chords, diagrams };
}
