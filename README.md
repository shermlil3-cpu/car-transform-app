# Car Transformation Generator

Plug in two car images (drag & drop, or paste a URL), hit **Generate**, and play the resulting mechanical "Transformers-style" transformation video.

## How it works

1. Drop in a start image and end image (plus short vehicle descriptions used to fill in the reusable prompt template).
2. The app calls the **Magica public REST API** (`api.magica.com`) to run the `seedance-2.0-image-to-video` model with those two images as the start/end frames and the mechanical-transformation prompt baked in.
3. It polls the run until it's `COMPLETED`, then plays the video inline.

## Setup

1. Get a Magica API key: sign in to Magica -> **Settings -> API Keys -> Create Key**. Copy the `gx_...` token (shown once).
2. Put it in `.env.local`:
   ```
   MAGICA_API_KEY=gx_your_key_here
   ```
3. Install deps and run:
   ```
   npm install
   npm run dev
   ```
4. Open the app, drop in two car images, and click **Generate**.

## Deploying to Vercel

1. Import this repo at https://vercel.com/new.
2. Add the `MAGICA_API_KEY` environment variable in the Vercel project settings.
3. Deploy.

## Notes

- File uploads are proxied through an anonymous image host (catbox.moe) purely to get a public HTTPS URL for the video model. Swap `app/api/upload/route.ts` for your own storage if you want uploads to persist under your control.
- The prompt template lives in `lib/prompt-template.ts` — edit `buildTransformationPrompt` to change the transformation style.
- Each generation costs Magica credits, charged to the account owning the API key.
