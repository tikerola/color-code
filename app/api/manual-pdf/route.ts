import { NextRequest } from "next/server";
import { getChordColor } from "../../../lib/services/chord-colors";
import { getChordDiagram } from "../../../lib/services/chord-diagram";
import { applyTransposition } from "../../../lib/services/transpose";
import { generatePdf } from "../../../lib/services/pdf-generator";
import type { PianoSeqItem } from "../../../lib/types";

function parsePianoNotes(raw: unknown): PianoSeqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PianoSeqItem => {
    if (typeof item !== "object" || item === null) return false;
    const o = item as Record<string, unknown>;
    if (o.kind === "note") return typeof o.letter === "string" && typeof o.octave === "number";
    if (o.kind === "barline" || o.kind === "linebreak") return true;
    if (o.kind === "repeat") return typeof o.count === "number";
    return false;
  });
}

export async function POST(req: NextRequest) {
  let body: { title?: string; chords?: unknown; transpose?: unknown; pianoNotes?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Custom Chords";
  const rawChords = Array.isArray(body.chords)
    ? (body.chords as unknown[]).filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];
  const transpose = Number.isInteger(body.transpose) ? (body.transpose as number) : 0;
  const pianoNotes = parsePianoNotes(body.pianoNotes);

  if (rawChords.length === 0) {
    return Response.json({ message: "No valid chords provided" }, { status: 400 });
  }

  try {
    const unique = [...new Set(rawChords)];
    const raw = {
      song: { title, artist: "", url: "", chords: unique },
      progression: { sequence: rawChords, repeatCount: 1 },
      chords: unique.map((name) => ({ name, color: getChordColor(name) })),
      diagrams: [
        ...unique.map((name) => getChordDiagram(name, "guitar")),
        ...unique.map((name) => getChordDiagram(name, "ukulele")),
        ...unique.map((name) => getChordDiagram(name, "piano")),
      ],
    };

    const data = applyTransposition(raw, transpose);
    const pdfBuffer = await generatePdf({ ...data, pianoNotes });

    const filename = title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_") || "chord-sheet";
    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("[manual-pdf]", err);
    return Response.json({ message: e?.message ?? "PDF generation failed" }, { status: 500 });
  }
}
