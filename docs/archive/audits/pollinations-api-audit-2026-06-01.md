# Pollinations API Audit — 2026-06-01

Basis: 4 Scrape-Agenten + manuelle UI-Verifikation (vollständige Modell-Liste).

---

## Korrektur gegenüber Agent-Findings

Die Agenten haben den tier-gated `/models`-Endpoint getroffen — sieht nur anonymous-Tier.  
Die echte vollständige Modell-Liste kommt aus dem UI. Konsequenz:

**Alle unsere bestehenden Text-IDs sind gültig.** Kein Breaking Change.

---

## Text-Modelle — Vollständige Karte

### Bestehende heyhihosted-IDs — alle korrekt ✅

| Lokale ID | Tatsächliches Modell | Neu? |
|-----------|---------------------|------|
| `claude-fast` | Claude Haiku 4.5 | — |
| `gemini-fast` | Gemini 2.5 Flash Lite | backing unverändert |
| `gemini-search` | Gemini 2.5 Flash Lite + Search | — |
| `deepseek` | DeepSeek **V4** Flash Lite | ⚠️ V3 → V4 (upgrade) |
| `nova-fast` | Nova Micro | — |
| `mistral` | Mistral Small 3.2 | — |
| `perplexity-fast` | Perplexity Sonar | — |
| `perplexity-reasoning` | Perplexity Sonar Reasoning | — |
| `kimi` | Moonshot Kimi K2.5 | backing update |
| `glm` | Z.ai GLM-5.1 | — |
| `minimax` | MiniMax M2.7 | — |
| `qwen-coder` | Qwen3 Coder 30B | — |

### Neue Tier-Struktur: was bedeutet "PAID"

Modelle mit PAID-Flag brauchen einen Pollinations-Key (BYOP). Entspricht unserem bestehenden `byopVisible`-Konzept.

---

### Vollständige neue Modell-Liste (nicht in unserer Config)

#### Sofort interessant — Standard-Tier (hoch verfügbar)

| API-ID | Modell | Besonderheit | Req-Indikator |
|--------|--------|--------------|---------------|
| `openai-fast` | GPT-5 Nano | Vision, Cache | 700 |
| `openai` | GPT-5.4 Nano | Vision | 1.3K |
| `llama-scout` | Meta Llama 4 Scout | Vision | 3.5K |
| `qwen-vision` | Qwen3 VL 30B | Vision | 1.1K |
| `nova` | Nova 2 Lite | Vision + Reasoning | 750 |
| `gemma` | Gemma 4 26B A4B | Vision + Reasoning | 1.9K |
| `mistral-4` | Mistral Small 4 | Vision | 800 |
| `deepseek-pro` | DeepSeek V4 Pro | Reasoning | 60 |
| `qwen-large` | Qwen3.6 Plus | Vision + Reasoning | 100 |
| `step-3.5-flash` | StepFun Step 3.5 | Reasoning | **NEU** |
| `step-flash` | StepFun Step 3.7 | Vision + Reasoning | **NEU** |
| `perplexity-deep` | Perplexity Sonar | Search | **NEU** |
| `perplexity` | Perplexity Sonar Pro | Search | **NEU** |
| `kimi-k2.6` | Moonshot Kimi K2.6 | Vision + Reasoning | 55 |
| `llama` | Meta Llama 3.3 70B | — | 900 |
| `qwen-coder-large` | Qwen3 Coder Next | — | 60 |
| `qwen-vision-pro` | Qwen3 VL 235B | Vision + Reasoning | 250 |
| `midijourney` | MIDIjourney | Kreativ | 350 |

#### PAID-Modelle (BYOP-Key nötig) — hochwertig

| API-ID | Modell | Besonderheit |
|--------|--------|--------------|
| `claude` | Claude Sonnet 4.6 | Vision |
| `claude-large` | Claude Opus 4.6 | Vision |
| `claude-opus-4.7` | Claude Opus 4.7 | Vision |
| `claude-opus-4.8` | Claude Opus 4.8 | Vision — **NEU** |
| `openai-large` | GPT-5.4 | Vision + Reasoning |
| `gpt-5.4-mini` | GPT-5.4 Mini | Vision |
| `gpt-5.5` | GPT-5.5 | Vision + Reasoning |
| `gemini` | Gemini 3 Flash | Vision + Video + Voice + Search |
| `gemini-large` | Gemini 3.1 Pro | Vision + Video + Voice + Reasoning + Search |
| `gemini-3.5-flash` | Gemini 3.5 Flash | Video + Voice + Search — **NEU** |
| `gemini-flash-lite-3.1` | Gemini 3.1 Flash Lite | Voice + Search — **NEU** |
| `gemini-search-fast` | Gemini 3.1 Flash Lite Search | Voice — **NEU** |
| `gemini-search-large` | Gemini 3.5 Flash Search | **NEU** |
| `grok` | Grok 4.20 | Vision |
| `grok-large` | Grok 4.20 Reasoning | Vision + Reasoning |
| `grok-4.3` | Grok 4.3 | Vision + Reasoning — **NEU** |
| `llama-maverick` | Meta Llama 4 Maverick | Vision |
| `mistral-large` | Mistral Large 3 | Vision + Reasoning |

#### Audio (Text ↔ Voice)
| API-ID | Modell | Modalität |
|--------|--------|-----------|
| `openai-audio` | GPT Audio Mini | Chat + Voice in/out |
| `openai-audio-large` | GPT Audio 1.5 | Chat + Voice in/out |

---

## Video-Modelle — vollständige Capability-Matrix

Alle folgenden IDs laufen über `gen.pollinations.ai/video/{prompt}`.  
**Kritische neue Erkenntnis: Alle Video-Modelle unterstützen jetzt I2V (start_frame).**

| API-ID | T2V | I2V | End-Frame | Audio | Duration | Free? |
|--------|-----|-----|-----------|-------|----------|-------|
| `veo` | ✅ | ✅ | ✅ | ✅ | 4/6/8s | nein |
| `seedance-pro` | ✅ | ✅ | ❌ | ❌ | 2–10s | nein |
| `seedance-2.0` | ✅ | ✅ | ✅ | ✅ | 4–15s | nein |
| `wan` | ✅ | ✅ | ❌ | ✅ (immer) | 2–15s | nein |
| `wan-fast` | ✅ | ✅ | ✅ | ❌ | fest 5s | nein |
| `wan-pro` | ✅ | ✅ | ❌ | ✅ | 720p–1080p | nein |
| `grok-video-pro` | ✅ | ✅ | ❌ | ❌ | 1–15s | nein |
| `ltx-2` | ✅ | ✅ | ❌ | ❌ | — | **✅** |
| `p-video` | ✅ | ✅ | ❌ | ❌ | bis 1080p | nein |
| `nova-reel` | ✅ | ✅ | ❌ | ❌ | 6–120s (×6) | **✅** |

### Lokale Config vs. offiziell — Video

| Lokale ID | Status | Aktion |
|-----------|--------|--------|
| `seedance` | ⚠️ | → `seedance-pro` umbenennen |
| `wan` | ✅ | Audio-Flag: generiert immer (kein opt-out) |
| `wan-fast` | ✅ | End-Frame-Support neu dokumentieren |
| `ltx-2` | ✅ | kostenlos ✅ |
| `grok-video` (free) | ❓ | Nicht in Docs — live prüfen |
| `grok-video-pro` | ✅ | — |
| `p-video` | ✅ | alias: pruna-video |

**Neu hinzufügen:**
- `veo` — höchste Qualität, Start+End-Frame, native Audio
- `seedance-2.0` — native Audio + End-Frame
- `wan-pro` — Wan 2.7, 1080p, native Audio
- `nova-reel` — einzige Langform-Option (bis 120s), kostenlos

---

## Audio / Music / TTS / STT

Endpoint: `GET gen.pollinations.ai/audio/{text}?model=<id>`

### Music
| API-ID | Free | Max-Duration | Besonderheit |
|--------|------|-------------|--------------|
| `elevenmusic` | ✅ (bis 120s) | 300s mit Key | `instrumental`, `duration` |
| `acestep` | ❌ (Auth nötig) | — | ACE-Step open-source |

### TTS
| API-ID | Free | Voices |
|--------|------|--------|
| `elevenlabs` | ✅ | 34 |
| `elevenflash` | ✅ | 34 |
| `qwen-tts` | ✅ | 34 |
| `qwen-tts-instruct` | ✅ | 34 |
| `openai-audio` | ✅ | 34 |

### STT (neu)
| API-ID | Provider |
|--------|---------|
| `whisper` | OpenAI |
| `scribe` | ElevenLabs — **NEU** |
| `universal-2` | AssemblyAI — **NEU** |
| `universal-3-pro` | AssemblyAI — **NEU** |

### Voices: 34 total (war ~18)
OpenAI (11): `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `ash`, `ballad`, `coral`, `sage`, `verse`  
ElevenLabs (24): `rachel`, `domi`, `bella`, `elli`, `charlotte`, `dorothy`, `sarah`, `emily`, `lily`, `matilda`, `adam`, `antoni`, `arnold`, `josh`, `sam`, `daniel`, `charlie`, `james`, `fin`, `callum`, `liam`, `george`, `brian`, `bill`

---

## Image-Modelle

Offizielle IDs via `gen.pollinations.ai/image/` (bzw. `enter.pollinations.ai` für BYOP):

| API-ID | Tier | I2I | Backing |
|--------|------|-----|---------|
| `sana` / `flux` | free | ❌ | Sana (io.net) |
| `kontext` | nectar/BYOP | ✅ (1 Ref) | Flux Kontext Pro |
| `seedream` | nectar/BYOP | ✅ (bis 10 Refs) | ByteDance Seedream 4.0 |
| `nanobanana` | nectar/BYOP | ✅ (mehrere) | Gemini 2.5 Flash (Vertex) |
| `gptimage` | enter.pollinations.ai | ✅ | gpt-image-1-mini |

### Lokale IDs mit Problem

| Lokale ID | Befund |
|-----------|--------|
| `seedream5` | API-ID ist `seedream` — korrigieren |
| `klein` | nicht im Registry — live prüfen |
| `nanobanana-2`, `nanobanana-pro` | nicht im Registry — disablen |
| `gptimage-large` | nicht im Registry — disablen |
| `qwen-image` | nicht im Image-Registry |
| `grok-imagine` | nicht im anon-tier — ggf. BYOP-only oder veraltet |

---

## Empfehlungen

### heyhihosted — Priorität-Liste

**Sofort (keine Breaking Changes, einfach hinzufügen):**
1. `openai-fast` (GPT-5 Nano, free, hohe Verfügbarkeit) → neues Standard-Freimodell
2. `openai` (GPT-5.4 Nano, Vision) → starkes Freimodell
3. `veo`, `seedance-2.0`, `wan-pro`, `nova-reel` → Video-Config ergänzen
4. `deepseek-pro` → für Research/Reasoning als BYOP-Option
5. `claude` (Sonnet 4.6) + `claude-large` (Opus) → Premium-Tier Text

**Config-Korrekturen (Breaking-Change-frei):**
1. `seedance` → `seedance-pro` (ID-Update, Name im UI anpassen)
2. `seedream5` → API-ID zu `seedream` korrigieren
3. End-Frame-Flag für `veo`, `seedance-2.0`, `wan-fast` in UnifiedImageModel
4. `deepseek`-Beschreibung: V3.2 → V4 Flash Lite

**Prüfen (live-test nötig):**
- `grok-video` (free): funktioniert noch?
- `klein`: 404?
- `nanobanana-2`/`nanobanana-pro`: 404?

### heyhireset createwith — korrektes Modell-Set

**Text simpleMode:**
```
openai-fast   GPT-5 Nano        free, robust, hohe Verfügbarkeit
gemini-fast   Gemini 2.5 Flash  seed, Vision
```

**Text Advanced:**
```
claude-fast   Claude Haiku 4.5
deepseek      DeepSeek V4 Flash Lite
gemini-search Gemini + Search
claude        Claude Sonnet 4.6  PAID
```

**Image simpleMode:**
```
flux/sana     free
seedream      BYOP, bis 4K, 10 Refs
```

**Video simpleMode:**
```
ltx-2         free
wan           BYOP, native Audio
```

**Video Advanced:**
```
veo           Premium, Audio + EndFrame
seedance-2.0  Audio + EndFrame
nova-reel     bis 120s, kostenlos
```

**Music:**
```
elevenmusic   free bis 120s
```
