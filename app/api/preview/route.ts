import { NextRequest } from "next/server";
import { buildPreviewData } from "../../../lib/services/orchestrator";

export async function POST(req: NextRequest) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
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
    const data = await buildPreviewData(url);
    return Response.json(data);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    console.error("[preview]", err);
    return Response.json(
      { code: e?.code ?? "EXTRACTION_FAILED", message: e?.message ?? "Unable to extract chord data" },
      { status: 500 }
    );
  }
}
