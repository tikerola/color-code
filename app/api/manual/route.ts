import { NextRequest } from "next/server";
import { getChordColor } from "../../../lib/services/chord-colors";
import { getChordDiagram } from "../../../lib/services/chord-diagram";

export async function POST(req: NextRequest) {
  let body: { title?: string; chords?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Custom Chords";
  const rawChords = Array.isArray(body.chords)
    ? (body.chords as unknown[]).filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  if (rawChords.length === 0) {
    return Response.json({ message: "No valid chords provided" }, { status: 400 });
  }

  const unique = [...new Set(rawChords)];

  return Response.json({
    song: { title, artist: "", url: "", chords: unique },
    progression: { sequence: rawChords, repeatCount: 1 },
    chords: unique.map((name) => ({ name, color: getChordColor(name) })),
    diagrams: [
      ...unique.map((name) => getChordDiagram(name, "guitar")),
      ...unique.map((name) => getChordDiagram(name, "ukulele")),
      ...unique.map((name) => getChordDiagram(name, "piano")),
    ],
  });
}
