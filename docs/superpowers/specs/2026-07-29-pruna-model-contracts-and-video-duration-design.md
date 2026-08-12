# Pruna Model Contracts and Video Duration Design

## Objective

Make every enabled Pruna visual model submit only fields accepted by its current API schema, keep an explicitly selected Pruna model on Pruna, and present video length consistently in seconds without pretending that every model accepts a `duration` parameter.

## Provider dispatch

The selected model remains the dispatch authority. Models registered with `provider: 'pruna'` are generated through Pruna when a Pruna key is available. A Pruna result may still be persisted in Pollinations Media Storage when a Pollen key exists; storage location does not change the generation provider. The `zimage` silent fallback to Pollinations is removed so the provider choice is observable and deterministic.

## Per-model payload contracts

- Wan T2V accepts `aspect_ratio` and controls length with `num_frames`.
- Wan I2V derives its aspect ratio from the input image, forbids `aspect_ratio`, controls length with `num_frames`, and accepts an optional `last_image`.
- VACE uses `size` and `frame_num`; generic `aspect_ratio` and `duration` fields must not be sent.
- P-Video accepts direct seconds through `duration` and supports 1–20 seconds.
- P-Video Avatar length follows `voice_script`. The existing prompt becomes the required speech script instead of an unrelated video prompt. Uploaded-audio conditioning is intentionally outside this change because the current Visualize flow has no audio-file input.
- P-Video Animate and P-Video Replace inherit their duration from the uploaded source video and accept no duration field.

## User-facing time semantics

The UI always communicates time in seconds. The model registry describes how seconds map to the provider:

- Direct seconds: send the selected value unchanged.
- Frame-backed seconds: convert seconds to frames in the provider adapter and enforce the documented frame bounds.
- Source-driven: show that length follows the uploaded source video and do not render an editable duration selector.
- Speech-driven: show that length follows the script and do not render an editable duration selector.
- Fixed/unknown conversion: do not offer invented seconds. VACE stays at its documented 81-frame default until a reliable output FPS is part of the contract.

Wan runs at 16 FPS with 81–121 frames. The meaningful UI choices are 5, 6, 7, and 7.5 seconds, mapped to 81, 96, 112, and 120 frames respectively. The five-second choice necessarily rounds up from 80 to the 81-frame minimum.

## UI and request flow

`UnifiedImageModel` gains a discriminated temporal capability. `VisualizeInlineHeader` renders a seconds selector only for controllable seconds/frame-backed models. The send coordinator continues to pass seconds; `pruna-models.ts` owns conversion to provider fields. This keeps frame terminology out of the product UI and provider details out of React components.

Existing Pollinations video entries keep their established `durationRange` contract in this change; the request adapter treats that legacy metadata as a controllable seconds model. Pruna models use only `temporalControl`. A full Pollinations registry migration is outside this Pruna repair.

Model controls must also match actual capabilities: Wan T2V/I2V do not expose an audio toggle, while P-Video retains its output-audio switch. Avatar/Animate/Replace do not show a meaningless duration selector.

## Error handling and validation

The server validates user-facing seconds against the selected model capability before dispatch. Model builders emit allowlisted fields only. Unsupported fields are omitted rather than passed through. Pruna errors remain explicit and never trigger another generation provider.

## Testing

- Exact payload-key tests for Wan T2V, Wan I2V, VACE, and P-Video variants.
- Boundary and conversion tests for Wan seconds-to-frames mapping.
- Registry/UI tests for direct, frame-backed, source-driven, speech-driven, and fixed time behavior.
- Route tests proving Pruna image models do not call Pollinations generation, including Pruna failures.
- Focused tests followed by typecheck, lint, full Jest, and production build.

## Architectural audit

This extends the existing registry, request coordinator, and Pruna adapters rather than introducing a second generation pipeline. The discriminated temporal capability replaces scattered model-ID conditionals and prevents UI/provider drift. Existing chat state, reference upload flow, blob persistence, and output storage remain intact.
