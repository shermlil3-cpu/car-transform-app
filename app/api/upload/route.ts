import { NextResponse } from "next/server";

// Anonymous, no-API-key image host used purely to turn a locally-uploaded
// file into a public HTTPS URL the video model can consume. Swap this out
// for your own storage (S3, Cloudinary, Magica Library, etc.) if you want
// uploads to persist under your control.
//
// Note: catbox.moe's plain /user/api.php endpoint blocks many server/cloud
// IP ranges ("Invalid uploader"). uguu.se (same underlying software family)
// does not, and litterbox.catbox.moe (1-hour-expiry sibling of catbox) is
// kept as a fallback.
const UPLOAD_ENDPOINTS = [
  { url: "https://uguu.se/upload.php", field: "files[]" },
  { url: "https://litterbox.catbox.moe/resources/internals/api.php", field: "fileToUpload", extra: { reqtype: "fileupload", time: "1h" } },
] as const;

function extractUrl(endpointUrl: string, text: string): string | null {
  if (endpointUrl.includes("uguu.se")) {
    try {
      const data = JSON.parse(text);
      return data?.files?.[0]?.url ?? null;
    } catch {
      return null;
    }
  }
  // litterbox / catbox return the plain URL as the response body
  const trimmed = text.trim();
  return trimmed.startsWith("http") ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const file = incoming.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 25MB)." },
        { status: 400 }
      );
    }

    const filename = (file as File).name ?? "upload.jpg";
    let lastError = "";

    for (const endpoint of UPLOAD_ENDPOINTS) {
      try {
        const outgoing = new FormData();
        if ("extra" in endpoint && endpoint.extra) {
          for (const [key, value] of Object.entries(endpoint.extra)) {
            outgoing.append(key, value);
          }
        }
        outgoing.append(endpoint.field, file, filename);

        const res = await fetch(endpoint.url, { method: "POST", body: outgoing });
        const text = await res.text();

        if (!res.ok) {
          lastError = `${endpoint.url} -> ${res.status} ${text}`;
          continue;
        }

        const url = extractUrl(endpoint.url, text);
        if (url) {
          return NextResponse.json({ url });
        }
        lastError = `${endpoint.url} -> unexpected response: ${text}`;
      } catch (err) {
        lastError = `${endpoint.url} -> ${err instanceof Error ? err.message : "unknown error"}`;
      }
    }

    return NextResponse.json(
      { error: `All upload hosts failed. Last error: ${lastError}` },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
