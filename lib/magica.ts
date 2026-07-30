// Thin client for the Magica public REST API.
// Docs: https://magica.com/docs/

const BASE_URL = "https://api.magica.com/api/v1";

function apiKey(): string {
  const key = process.env.MAGICA_API_KEY;
  if (!key) {
    throw new Error(
      "MAGICA_API_KEY is not set. Create a key at Settings -> API Keys in Magica and add it to .env.local"
    );
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface MagicaModel {
  nodeType: string;
  subModels?: { subModelId: string }[];
}

// The public catalog groups variants of a model under a `nodeType`, with the
// exact runnable id in `subModels[].subModelId`. We resolve the nodeType for
// our target subModelId once per request instead of hardcoding it, since the
// mapping is an implementation detail that can change.
let cachedNodeType: string | null = null;

export async function resolveNodeType(subModelId: string): Promise<string> {
  if (cachedNodeType) return cachedNodeType;

  const res = await fetch(`${BASE_URL}/models`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status} ${await res.text()}`);
  }
  const models: MagicaModel[] = await res.json();

  const match = models.find((m) =>
    m.subModels?.some((s) => s.subModelId === subModelId)
  );

  if (!match) {
    throw new Error(
      `Could not find a model with subModelId "${subModelId}" in your Magica catalog.`
    );
  }

  cachedNodeType = match.nodeType;
  return match.nodeType;
}

export async function startNodeRun(
  nodeType: string,
  subModelId: string,
  input: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${BASE_URL}/nodes/${nodeType}/run`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ subModelId, input }),
  });

  if (!res.ok) {
    throw new Error(`Failed to start run: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const runId = data.runId ?? data.id;
  if (!runId) {
    throw new Error(`Run started but no runId was returned: ${JSON.stringify(data)}`);
  }
  return runId;
}

export interface RunStatus {
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED" | string;
  output?: Record<string, unknown>;
  error?: string;
}

export async function getRunStatus(runId: string): Promise<RunStatus> {
  const res = await fetch(`${BASE_URL}/nodes/runs/${runId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch run status: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Pull the first video URL out of whatever shape the node output has.
// Confirmed shapes from the live API: { result: ["<url>", ...] } is the
// primary shape for seedance-2.0-image-to-video; videoUrl/videoUrls are
// kept as fallbacks in case other node types use a different key.
export function extractVideoUrl(output: Record<string, unknown> | undefined): string | null {
  if (!output) return null;

  const result = output.result;
  if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  if (typeof result === "string") return result;

  const direct = output.videoUrl ?? output.video_url;
  if (typeof direct === "string") return direct;

  const arr = output.videoUrls ?? output.video_urls;
  if (Array.isArray(arr) && typeof arr[0] === "string") return arr[0];

  return null;
}
