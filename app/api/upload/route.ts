import { NextResponse } from "next/server";

// Anonymous, no-API-key image host used purely to turn a locally-uploaded
// file into a public HTTPS URL the video model can consume. Swap this out
// for your own storage (S3, Cloudinary, Magica Library, etc.) if you want
// uploads to persist under your control.
const CATBOX_UPLOAD_URL = "https://catbox.moe/user/api.php";

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

    const outgoing = new FormData();
    outgoing.append("reqtype", "fileupload");
    outgoing.append("fileToUpload", file, (file as File).name ?? "upload.jpg");

    const res = await fetch(CATBOX_UPLOAD_URL, {
      method: "POST",
      body: outgoing,
    });

    const text = await res.text();

    if (!res.ok || !text.startsWith("http")) {
      return NextResponse.json(
        { error: `Upload failed: ${text || res.statusText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
