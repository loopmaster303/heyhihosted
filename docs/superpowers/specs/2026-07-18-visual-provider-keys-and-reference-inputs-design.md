# Visual Provider Keys and Reference Inputs — Design

## Objective

Make the visual generation flow accurately reflect the capabilities of the enabled Pollinations and Pruna models, expose semantic start/end-frame inputs for video models, and allow a user-supplied Pruna API key in both local and hosted deployments.

## Access model

Provider access is additive and explicit:

- Without a user key, the application exposes only the curated free Pollinations models.
- A Pollen key additionally exposes Pollinations BYOP models allowed by the key.
- A Pruna key additionally enables the Pruna image and video provider.
- Server-side `PRUNA_API_KEY` remains a fallback for self-hosted deployments.
- A request-provided Pruna key takes precedence over the server fallback and is forwarded to Pruna only as its `apikey` header.

The Pruna key is stored locally and masked in the sidebar, parallel in user experience to the Pollen connection but implemented separately because Pollen includes account/OAuth semantics while Pruna is a manual API key.

## Reference semantics

Image models continue to use an ordered multi-reference list with a model-specific maximum. Video models use semantic fields:

- Start-frame models show one `Startbild` upload.
- Start/end-frame models show separate `Startbild` and `Endbild` uploads.
- The request adapter serializes them in the provider-required order and the server validates the selected model's capability.

This prevents a generic reference list from silently swapping the meaning of video frames.

## Model capability corrections

Pollinations image limits are represented from the live model API: GPT Image variants 16, Klein 10, Wan Image variants 9, Nano Banana 3, Nano Banana 2 variants 14, and Grok Imagine variants 1. Ideogram v4 remains text-only; Turbo and Quality are separate choices.

Pollinations video models that accept a final frame are marked explicitly (`veo`, `veo-1080p`, `seedance-2.0`, `wan-fast`, `wan-pro`, `wan-pro-1080p`). Start-only models stay limited to one frame, including `grok-video-pro`.

Pruna mappings follow the documented field shapes:

- P-Image Edit: `images`, 1–5.
- Qwen Image Edit Plus: `image`, 1–2.
- P-Image Try-On: one person image plus garment images.
- P-Video: `image` plus optional `last_frame_image`.
- P-Video Replace: `video` plus `images`, 1–3.
- VACE: `src_ref_images`, 1–3.

## Pruna-only media path

A Pruna request must not require Pollinations Media Storage. When no Pollen key is available, the generate route downloads the Pruna result and returns the media bytes with their content type. The client creates a temporary blob URL, and the existing output/gallery pipeline persists the blob in IndexedDB. When a Pollen key is available, the existing permanent media-storage path can still be used.

## Validation and security

- Accept the Pruna key only through the internal `X-Pruna-Key` header.
- Reject empty, implausibly short, oversized, or control-character-bearing keys without assuming a specific vendor prefix.
- Never return or log the key.
- Validate reference counts and end-frame usage against the selected registry entry on the server.
- Preserve reference order during URL resolution and provider serialization.

## Architectural audit

The feature extends the current model registry, `useUnifiedImageToolState`, send coordinator, internal generate route, and existing output service instead of adding a second generation pipeline. Pruna key handling remains provider-specific, avoiding a generic secret abstraction that would conflate manual Pruna keys with Pollen account state. The binary fallback reuses the existing non-Pollinations local persistence path, so Pruna-only access stays local-first and does not break gallery hooks.

