import { NextRequest } from "next/server";
import { buildPreviewData } from "../../../lib/services/orchestrator";
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
  let url: string;
  let transpose = 0;
  let pianoNotes: PianoSeqItem[] = [];
  try {
    const body = await req.json();
    url = body?.url;
    transpose = Number.isInteger(body?.transpose) ? body.transpose : 0;
    pianoNotes = parsePianoNotes(body?.pianoNotes);
  } catch {
    return Response.json({ code: "INVALID_REQUEST", message: "Invalid JSON body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return Response.json({ code: "MISSING_URL", message: "url is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return Response.json({ code: "INVALID_URL", message: "Provided URL is not valid" }, { status: 400 });
  }

  try {
    const pdfStart = Date.now();
    const raw = await buildPreviewData(url);
    const data = applyTransposition(raw, transpose);
    const pdfBuffer = await generatePdf({ ...data, pianoNotes });
    console.log(`[generate] pdf generation: ${Date.now() - pdfStart}ms`);

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(data.song.title)}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    console.error("[generate]", err);
    return Response.json(
      { code: e?.code ?? "GENERATION_FAILED", message: e?.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_") || "chord-sheet";
}
