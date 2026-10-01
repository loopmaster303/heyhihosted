# Pollinations Model Drift Audit — 2026-03-16

## Kontext
Kurzer lokaler Abgleich der HeyHi-Pollinations-Integration gegen die aktuell erreichbaren Pollinations-Endpunkte:

- `https://gen.pollinations.ai/v1/models`
- `https://gen.pollinations.ai/image/models`

Fokus:
- Textmodell-Mismatch
- Image/Video-Modell-Mismatch
- potenzielle Upload-/Ingest-Unklarheiten

---

## 1. Textmodelle

### Ergebnis
**Kein direkter lokaler Textmodell-Mismatch gefunden.**

Die in `src/config/chat-options.ts` eingetragenen lokalen Textmodell-IDs haben aktuell einen gültigen Match in der live abgefragten Pollinations-API.

### Fazit
Textseite sieht aktuell sauber aus.

---

## 2. Upload vs. Ingest — was genau die offene Frage ist

### Lokale Fakten

#### `src/app/api/media/upload/route.ts`
- erwartet `multipart/form-data`
- liest `file` aus `FormData`
- sendet an `https://media.pollinations.ai/upload` erneut als **multipart upload**

#### `src/app/api/media/ingest/route.ts`
- erwartet JSON mit `sourceUrl`
- lädt die Datei selbst herunter
- sendet an denselben Endpoint den **rohen Buffer** mit gesetztem `Content-Type`

### Bedeutung
Das ist **nicht automatisch ein Bug**. Die zwei lokalen Routen haben unterschiedliche Jobs und dürfen unterschiedlich arbeiten.

Die offene technische Frage ist nur:

> Akzeptiert `https://media.pollinations.ai/upload` wirklich stabil sowohl multipart als auch raw-body uploads?

Wenn ja: kein Problem.
Wenn nein: `ingest` ist der wahrscheinlichere Wackelkandidat.

### Fazit
- Lokal logisch: **ja**
- Upstream-Kompatibilität: **noch verifizieren**

---

## 3. Image/Video-Modellabgleich

## 3.1 Echte lokale IDs ohne Upstream-Match
Nach Alias-Normalisierung bleiben als echte Mismatch-Kandidaten:

- `klein-large`
- `seedream`
- `seedream-pro`

### Einordnung
- `seedream` und `seedream-pro` wirken wie absichtlich konservierte Alt-/Deprecated-Einträge
- `klein-large` ist lokal ein Sonderfall / Fallback-Modell, aber aktuell nicht als sichtbarer Upstream-Modellname vorhanden

---

## 3.2 Lokale IDs, die nur Alias-/Benennungsunterschiede sind
Diese Punkte sind **kein echter Drift**, sondern nur andere lokale Namen:

- `gpt-image` → Upstream: `gptimage`
- `grok-image` → Upstream: `grok-imagine`

---

## 3.3 Modelle, die live bei Pollinations vorhanden sind, aber lokal nicht in der Registry auftauchen

- `veo`
- `seedance-pro`
- `dirtberry-pro`
- `p-image`
- `p-image-edit`
- `p-video`

### Bedeutung
Das sind die relevanten Kandidaten für:
- „bewusst lokal nicht übernommen“
- oder „lokale Registry hinkt hinterher“

---

## 4. Kurzfazit

### Sauber
- Textmodelle matchen aktuell
- einige vermeintliche Bildmodell-Probleme sind nur Alias-Fragen

### Echte Drift-/Entscheidungspunkte
- lokale Alt-/Sondermodelle:
  - `klein-large`
  - `seedream`
  - `seedream-pro`
- neue Upstream-Modelle, die lokal nicht auftauchen:
  - `veo`
  - `seedance-pro`
  - `dirtberry-pro`
  - `p-image`
  - `p-image-edit`
  - `p-video`

### Offene technische Verifikation
- `media/upload` vs `media/ingest` gegen denselben Upload-Endpoint

---

## 5. Sinnvolle nächste Schritte

1. Entscheiden, ob `seedream`, `seedream-pro` und `klein-large` absichtliche Legacy-/Fallback-Einträge bleiben sollen.
2. Prüfen, ob `veo`, `seedance-pro`, `dirtberry-pro`, `p-image`, `p-image-edit`, `p-video` lokal aufgenommen werden sollen.
3. Einmal gezielt verifizieren, ob `media.pollinations.ai/upload` raw-body Uploads genauso sauber unterstützt wie multipart.
4. Den Audit-Check in `scripts/audit/check-pollinations.sh` alias-aware machen, damit `gpt-image` vs `gptimage` und `grok-image` vs `grok-imagine` nicht unnötig als Drift wirken.

---

## Betroffene Dateien

- `src/config/chat-options.ts`
- `src/config/unified-image-models.ts`
- `src/app/api/media/upload/route.ts`
- `src/app/api/media/ingest/route.ts`
- `scripts/audit/check-pollinations.sh`
