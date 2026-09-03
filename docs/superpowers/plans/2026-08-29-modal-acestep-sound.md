# ACE-Step 1.5 on Modal + /sound Route — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

## Betreiberentscheidungen (2026-08-29, maßgeblich)

- **Status:** Prototype. Chunk 1 (Modal-Endpoint, Tasks 1–4) ist repo-unabhängig und
  darf **jederzeit** parallel zum Patch-Plan/Phase-8 gestartet werden (eigenes
  Verzeichnis, curl-Testbar, kein Repo-Kontakt). Chunk 2 (`/sound` im Repo) startet
  sinnvollerweise nach dem Patch-Merge — eigener Worktree, dateidisjunkt von beiden.
  Gate-Ergebnisse (Task A–C des Phase-8-Plans) sind keine Voraussetzung. Neues Feature
  neben Create — es erinnert an Compose, ist aber kein Launch-Bestandteil.
- **Ziel:** Musikmodell selbst hosten (Modal), unabhängig von Pollinations. Keine
  Chat-Integration. Eigene Seite `/sound` neben `/create`.
- **UI:** `docs/design/sound-mockup.html` ist die Source of Truth (Topbar mit Badge,
  Sidebar Modell/Dauer/Stimme/Format, Waveform-Galerie, MetaRail, PromptBar mit ⌘↵).
- **Auth:** Kein Pollen-Gate. `/api/sound` ist anonym, aber mit Rate-Limit
  (`checkRateLimit`, ~10/min, Muster aus `src/app/api/compose/route.ts:20`). Der
  Modal-Endpoint selbst ist durch `MODAL_ENDPOINT_KEY` geschützt.
- **Pollinations-Berührung:** ausschließlich serverseitiges Prompt-Enhancement mit
  dem vorhandenen Server-Key. Kein Client-Key, keine Pollinations-Media-Storage-Nutzung,
  kein `storageKey`.
- **Speicherung:** eigener lokaler Store — eigene Dexie-Tabelle (z. B.
  `db.soundAssets`), **nicht** `db.assets`, **nicht** `OutputService`. (Wörtliches
  localStorage ist für Audio-Blobs ungeeignet — ~5 MB-Limit, Strings-only;
  IndexedDB/Dexie ist hier der „eigene lokale Speicher“.) Kein Origin-Filter, keine
  gemeinsame Galerie; Zeilenlöschung in der eigenen Tabelle räumt den Blob mit weg.
- **Konsequenz für Task 5/6:** Task 5 Step 3 („Persist via OutputService im Route“)
  entfällt — die Route liefert nur Audio. Task 6 persistiert client-seitig in die
  eigene Tabelle.

**Goal:** Host ACE-Step 1.5 as a self-hosted Modal web endpoint and wire it into a new HeyHi `/sound` route for text-to-music generation.

**Architecture:** Two independent subsystems, deployed in order. (1) A Modal app exposes an HTTPS endpoint wrapping the ACE-Step 1.5 pipeline (GPU inference, model weights cached in a Modal Volume). (2) A Next.js API route (`/api/sound`) proxies HeyHi frontend requests to that endpoint (anonymous + rate limit, Modal-Endpoint-Key server-seitig). The `/sound` page consumes it with a new `useSoundStudioState` hook, mirroring the `/create` PlaygroundShell layout; Persistenz läuft ausschließlich client-seitig in eine **eigene Dexie-Tabelle** (`soundAssets`), siehe Betreiberentscheidungen oben.

**Tech Stack:** Python 3.11, Modal, ACE-Step 1.5 (`ACE-Step/Ace-Step1.5` on HuggingFace, Apache-2.0), diffusers, torch 2.x; Next.js App Router, TypeScript, Dexie (eigene Tabelle `soundAssets`), Pollinations nur serverseitig für Prompt-Enhancement.

---

## Chunk 1: Modal ACE-Step Endpoint (independent of HeyHi repo)

This is a standalone Python project — recommend a sibling directory (e.g. `~/acestep-modal/`) or a `modal/` subfolder inside heyhihosted. Keeping it separate avoids bloating the Next.js bundle and lets you deploy GPU changes without redeploying the frontend.

### Task 1: Scaffold Modal project

**Files:**
- Create: `modal/main.py` (or `~/acestep-modal/main.py`)
- Create: `modal/requirements.txt`
- Create: `modal/.env.example` (for `HF_TOKEN` if the model is gated; currently Apache-2.0, likely not gated)

- [ ] **Step 1: Install Modal CLI + login**

```bash
python3 -m pip install modal
modal token new   # opens browser, authenticates
```

- [ ] **Step 2: Create `modal/requirements.txt`**

```
torch==2.4.1
torchaudio==2.4.1
diffusers>=0.31.0
transformers>=4.45.0
accelerate>=0.34.0
soundfile>=0.12.1
numpy<2.0
```

> Note: exact versions depend on what ACE-Step 1.5's reference repo pins. Check https://github.com/ace-step/ACE-Step for their `requirements.txt` and mirror it.

- [ ] **Step 3: Create `modal/main.py` skeleton**

```python
import modal

app = modal.App("acestep-sound")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_requirements("requirements.txt")
    .run_command("apt-get update && apt-get install -y ffmpeg")
)

volume = modal.Volume.from_name("acestep-weights", create_if_missing=True)

@app.cls(
    image=image,
    gpu="A10G",           # 24 GB VRAM — safe for 3.5B/4B DiT. Use "L4" for cost saving, "A100" for speed.
    volumes={"/weights": volume},
    scaledown_window=300,  # keep warm 5min after last request
    timeout=600,
    secrets=[modal.Secret.from_name("huggingface")],  # optional, only if HF_TOKEN needed
)
class AceStep:
    @modal.enter(snap=False)
    def load(self):
        """Runs once per container cold-start. Loads model weights into VRAM."""
        from huggingface_hub import snapshot_download
        import torch

        path = snapshot_download(
            "ACE-Step/Ace-Step1.5",
            cache_dir="/weights/hf",
        )
        # TODO: instantiate ACE-Step pipeline per their reference repo.
        # The exact class depends on ACE-Step's inference entrypoint — check
        # github.com/ace-step/ACE-Step for `ACEStepPipeline` or equivalent.
        self.pipe = None  # placeholder, fill in Task 2

    @modal.method()
    def generate(
        self,
        prompt: str,
        duration: int = 60,
        instrumental: bool = True,
        format: str = "mp3",
    ) -> bytes:
        """Runs per request. Returns audio bytes."""
        # TODO: call self.pipe(...) and encode to mp3/wav via soundfile/ffmpeg.
        raise NotImplementedError

@app.function(
    image=image,
    timeout=300,
)
@modal.web_server(8000, startup_timeout=600)
def web():
    """FastAPI wrapper exposing /generate as HTTPS endpoint."""
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import Response
    import uvicorn

    web_app = FastAPI()

    @web_app.post("/generate")
    def generate_endpoint(body: dict):
        # calls AceStep().generate.remote(...)
        raise NotImplementedError

    uvicorn.run(web_app, host="0.0.0.0", port=8000)
```

> **Reality note:** The exact pipeline class and call signature for ACE-Step 1.5 must come from the reference repo. The Modal structure (app, image, volume, GPU, web_server) is stable — only the `load()` and `generate()` bodies need filling from ACE-Step's docs.

- [ ] **Step 4: First deploy (no model yet, just structure)**

```bash
cd modal/
modal deploy main.py
```
Expected: Modal prints a URL like `https://<workspace>--acestep-sound-web.modal.run`. Save it — this becomes `MODAL_ACESTEP_URL` for HeyHi later.

### Task 2: Wire real ACE-Step inference

**Files:**
- Modify: `modal/main.py` (fill `load()` and `generate()`)

- [ ] **Step 1: Read ACE-Step reference repo for 1.5 pipeline**

```bash
curl -sL https://raw.githubusercontent.com/ace-step/ACE-Step/main/README.md | head -200
```
Look for: (1) pipeline class name, (2) `from_pretrained` / checkpoint-load call, (3) `infer` / `generate` kwargs (prompt, lyrics, duration, infer_steps, etc.).

- [ ] **Step 2: Fill `load()`**

```python
# inside @modal.enter
from acestep import ACEStepPipeline   # exact import from their repo
import torch

self.pipe = ACEStepPipeline(
    checkpoint=path,
    torch_dtype=torch.float16,
)
```

> The `snapshot_download` result gives a local path inside the volume; the pipeline reads weights from there on cold-start. First cold-start downloads ~14 GB to the volume (one-time), subsequent cold-starts load from cache in ~30–60 s.

- [ ] **Step 3: Fill `generate()`**

```python
@modal.method()
def generate(self, prompt: str, duration: int = 60, instrumental: bool = True, format: str = "mp3") -> bytes:
    import soundfile as sf
    import io

    kwargs = {
        "prompt": prompt,
        "duration": duration,
        "infer_steps": 27,      # 27 steps = RTF 27x on A100, good default
    }
    if not instrumental:
        kwargs["lyrics"] = "[instrumental]"  # or actual lyrics if supported

    audio_array, sample_rate = self.pipe(**kwargs)
    buffer = io.BytesIO()
    sf.write(buffer, audio_array, sample_rate, format="wav")
    buffer.seek(0)

    if format == "mp3":
        # ffmpeg subprocess for mp3 encoding (wav is too big for browser download UX)
        import subprocess
        proc = subprocess.run(
            ["ffmpeg", "-i", "pipe:0", "-b:a", "192k", "-f", "mp3", "pipe:1"],
            input=buffer.read(), capture_output=True
        )
        return proc.stdout
    return buffer.getvalue()
```

> Verify exact return signature of ACE-Step's pipeline (array + sr vs. file path) — adapt accordingly.

- [ ] **Step 4: Test cold-start + generate via `modal run`**

```bash
modal run main.py::test_generate
```
(Add a small `@app.local_entrypoint()` test that calls `AceStep().generate.remote("acid house 123bpm", duration=30)` and prints duration of returned bytes.)

Expected: First run downloads weights to Volume (~5–10 min), subsequent runs generate audio in ~5–20 s depending on GPU and duration.

- [ ] **Step 5: Deploy + curl the HTTPS endpoint**

```bash
modal deploy main.py
curl -X POST https://<workspace>--acestep-sound-web.modal.run/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"raw acid house 123 bpm","duration":30,"instrumental":true}' \
  --output test.mp3
```
Expected: `test.mp3` plays, is ~30 s.

### Task 3: Production hardening on Modal

- [ ] **Step 1: Add API-key auth to the endpoint** (so random internet traffic can't burn GPU credits)

```python
@web_app.post("/generate")
def generate_endpoint(body: dict, request: Request):
    auth = request.headers.get("x-modal-key")
    if auth != os.environ["MODAL_ENDPOINT_KEY"]:
        raise HTTPException(401)
    ...
```
Set via `modal secret create modal-endpoint-key MODAL_ENDPOINT_KEY=...`.

- [ ] **Step 2: Set request timeout + payload validation** (duration 10–240 s, prompt length max 1000 chars, reject everything else with 400).

- [ ] **Step 3: Add basic concurrency limit** (`@app.cls(concurrency_limit=1, container_idle_timeout=300)`) so a burst of requests queues instead of spawning N GPUs. Raise later if needed.

- [ ] **Step 4: Optional — `modal.Volume` prewarm** to skip first cold-start download: run `modal run main.py::download_weights` once manually.

### Task 4: Commit modal project

- [ ] `git init` in modal folder if separate repo, or commit inside heyhihosted under `modal/` — decide based on where you want to keep it. Commit message: `feat: modal endpoint for acestep 1.5`.

---

## Chunk 2: HeyHi `/api/sound` + `/sound` Route

### Task 5: API route

**Files:**
- Create: `src/app/api/sound/route.ts`
- Modify: `src/lib/media/compose-music.ts` (add `acestep-modal` as model option, or create a sibling `src/lib/media/sound.ts` — prefer sibling to keep compose-music untouched)

- [ ] **Step 1: Add env var**

`.env.local`:
```
MODAL_ACESTEP_URL=https://<workspace>--acestep-sound-web.modal.run
MODAL_ACESTEP_KEY=<from modal secret>
```

- [ ] **Step 2: Write `src/lib/media/sound.ts`** — thin client like `compose-music.ts`:

```typescript
export interface SoundInput {
  prompt: string;
  duration?: number;        // seconds, 10..240
  instrumental?: boolean;
  format?: 'mp3' | 'wav';
}

export class SoundError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = 'SoundError'; }
}

export async function generateSound(input: SoundInput): Promise<{ audioUrl: string }> {
  if (!input.prompt.trim()) throw new SoundError('Prompt required', 0);

  const res = await fetch('/api/sound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new SoundError(data?.error ?? 'Sound generation failed', res.status);
  return data;
}
```

- [ ] **Step 3: Write `src/app/api/sound/route.ts`**

Follows the pattern of `/api/compose/route.ts` — but **anonymous** (no Pollen key resolve): rate limit via `checkRateLimit` (10/min, own bucket name e.g. `'sound'`), payload validation (duration 10..240, prompt ≤1000 chars), then server-side fetch to `MODAL_ACESTEP_URL` with `x-modal-key` header. Returns JSON `{ audioUrl }` where audioUrl is either the Modal response (base64 → data URL) or a temporary URL the frontend converts.

Return the audio to the frontend as `{ audioUrl }` (temporary URL or base64 data URL from the Modal response). **No persistence in the route** — Dexie is browser-only; the hook persists client-side into the dedicated `soundAssets` table per the Betreiberentscheidungen above.

- [ ] **Step 4: Write test** — jest, mock `fetch`, assert payload validation and error paths.

### Task 6: Frontend

**Files:**
- Create: `src/app/sound/page.tsx`
- Create: `src/app/sound/SoundShell.tsx` (client component, mirrors `PlaygroundShell` structure)
- Create: `src/hooks/useSoundStudioState.ts`
- Create: `src/components/sound/SoundSidebar.tsx` (params)
- Create: `src/components/sound/SoundGallery.tsx` (track cards with waveform)
- Create: `src/components/sound/SoundMetaRail.tsx` (details rail)
- Create: `src/components/sound/SoundPromptBar.tsx`

- [ ] **Step 1: `useSoundStudioState`** — mirror `usePlaygroundState` shape but for audio: `isGenerating`, `audioUrl`, `error`, `duration`, `instrumental`, `format`, `generateSound()`, `reset()`. Uses `generateSound()` from `src/lib/media/sound.ts` and persists into the dedicated `soundAssets` Dexie table (own store, NOT `db.assets`, NOT `OutputService` — see Betreiberentscheidungen). **No changes to `useComposeMusicState` or `useChatState`.**

- [ ] **Step 2: `SoundShell.tsx`** — copy the grid structure from `PlaygroundShell.tsx:537` (46px topbar, 3-column layout, mobile drawer for sidebar, bottom error banner). Replace Gallery/MetaRail/PromptBar with the sound-specific components.

- [ ] **Step 3: `SoundGallery`** — renders track cards from the `soundAssets` Dexie table, with waveform placeholder bars (real waveform can come later via Web Audio decode — YAGNI for MVP), play button, chips (duration/format), favorite toggle.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run dev
# open http://localhost:3000/sound
```
Expected: page renders, generate with real prompt returns audio after 10–30 s, card appears in gallery, click selects + shows MetaRail.

### Task 7: Verification + cleanup

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm test` — existing tests still pass (sound tests included)
- [ ] Manual: generate 3 tracks, reload page, tracks persist (own `soundAssets` table)
- [ ] Remove any leftover TODO comments, dead code
- [ ] Commit: `feat: /sound route with ACE-Step via Modal`

---

## Chunk boundaries

- **Chunk 1** (Tasks 1–4) is deployable and testable with curl alone — no HeyHi code needed. Do this first.
- **Chunk 2** (Tasks 5–7) depends on Chunk 1's endpoint URL + key. Do this second.

**Effort estimate:** Chunk 1 ≈ 1 day (mostly ACE-Step API discovery + first cold-start wait), Chunk 2 ≈ 1–2 days (UI + hook + tests). Total ≈ 2–3 working days.
