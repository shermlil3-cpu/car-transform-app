import { NextResponse } from "next/server";
import { resolveNodeType, startNodeRun } from "@/lib/magica";
import { buildTransformationPrompt, SEEDANCE_MODEL_ID } from "@/lib/prompt-template";

interface GenerateBody {
  startImageUrl: string;
  endImageUrl: string;
  startVehicle: string;
  endVehicle: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateBody = await request.json();

    if (!body.startImageUrl || !body.endImageUrl) {
      return NextResponse.json(
        { error: "Both startImageUrl and endImageUrl are required." },
        { status: 400 }
      );
    }

    const prompt = buildTransformationPrompt(
      body.startVehicle || "the first vehicle",
      body.endVehicle || "the second vehicle"
    );

    const nodeType = await resolveNodeType(SEEDANCE_MODEL_ID);

    const runId = await startNodeRun(nodeType, SEEDANCE_MODEL_ID, {
      image_url: body.startImageUrl,
      end_image_url: body.endImageUrl,
      prompt,
      duration: body.duration ?? 5,
      resolution: body.resolution ?? "720p",
      aspect_ratio: body.aspectRatio ?? "4:3",
      generate_audio: true,
    });

    return NextResponse.json({ runId, prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
