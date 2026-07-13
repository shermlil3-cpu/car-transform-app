import { NextResponse } from "next/server";
import { getRunStatus, extractVideoUrl } from "@/lib/magica";

export async function GET(
  _request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const status = await getRunStatus(params.runId);
    const videoUrl = extractVideoUrl(status.output);

    return NextResponse.json({
      status: status.status,
      videoUrl,
      error: status.error ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
