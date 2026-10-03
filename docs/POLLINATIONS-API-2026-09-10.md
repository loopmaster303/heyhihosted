# Pollinations API — gemessene Wahrheit (2026-09-10)

Status: Referenz. Ersetzt alles, was in aelteren Audits, Handoffs oder im
Modellwissen ueber Pollinations steht.

## 0. Herkunft dieser Datei

Alles hier ist am **2026-09-10** direkt an der Quelle gemessen, nicht erinnert:

| Quelle | Ergebnis |
|---|---|
| `GET https://gen.pollinations.ai/openapi.json` | **200**, 470 KB, `info.version = "0.3.0"`, genau **ein** Server: `https://gen.pollinations.ai` |
| `GET https://gen.pollinations.ai/image/models` (mit Serverkey) | 200, **5** Eintraege |
| `GET https://gen.pollinations.ai/image/models` (ohne Key) | 200, **83** Eintraege |
| `GET https://gen.pollinations.ai/video/models` (mit Key / ohne Key) | 200, **0** / **19** Eintraege |
| `GET https://gen.pollinations.ai/text/models` (mit Key) | 200, **84** Eintraege, davon **44** `paid_only` |
| `GET https://gen.pollinations.ai/account/balance` | 200, `balance 15.13`, `tier 12.32`, `paid 2.81` |
| `https://registry.npmjs.org/@pollinations%2Fsdk` | latest **5.0.0** (alpha 5.1.0-alpha.7), keine Runtime-Deps |
| `https://registry.npmjs.org/@pollinations%2Fcli` | latest **0.1.13**, Binary `polli` |

## 1. Hosts — es gibt genau zwei

| Host | Zweck |
|---|---|
| `gen.pollinations.ai` | **alles** Generieren: Text, Bild, Video, Audio, 3D, Embeddings, Modelle, Konto |
| `media.pollinations.ai` | Medien-Speicher: `/upload`, `/media`, `/{id}` |

`image.pollinations.ai` und `text.pollinations.ai` sind **Legacy und tot**. Die
OpenAPI-Datei nennt sie nicht ein einziges Mal; jeder Request dorthin ist ein
Fehler, kein Fallback. Im Repo sind sie geloescht (`next.config.ts`,
`src/lib/media/remote-fetch-policy.ts`); der einzige verbliebene Treffer ist der
Kommentar, der erklaert, warum sie fehlen.

`/upload`, `/media`, `/{id}` und `/{id}/metadata` ueberschreiben den Server in
der Spec ausdruecklich mit `https://media.pollinations.ai` — der Pfad allein
verraet also nicht, welcher Host gemeint ist. Die Spec ist die Wahrheit.

## 2. Authentifizierung

Alle Generierungs-Endpunkte brauchen einen Key. **Modelllisten antworten auch
ohne Key** — aber mit einem anderen Inhalt, und genau das war unsere Falle
(s. 5.).

| Typ | Prefix | Zweck | Limits |
|---|---|---|---|
| Secret | `sk_` | Server-Anwendungen, unser Betreiber-Key | keine |
| App Key + BYOP | `pk_` + Redirect-URIs | Nutzer autorisiert per OAuth/PKCE oder Device-Flow, App bekommt ein befristetes `sk_` | keine am App-Key |
| Raw publishable | `pk_` ohne App-Bindung | **Legacy**, nicht mehr fuer neue Integrationen | 1 pollen / IP / Stunde |

Uebertragung: `Authorization: Bearer <key>` **oder** Query-Parameter `?key=`.
Keys kommen von `enter.pollinations.ai/keys`. Der dokumentierte Nutzer-Weg heisst
**Connect User Wallets** (BYOP) — das ist das offizielle Verfahren fuer "der
Nutzer zahlt selbst", nicht ein selbstgebautes Key-Eingabefeld.

## 3. Endpunkte

### Text
`POST /v1/chat/completions` (OpenAI-kompatibel, Streaming per `stream: true`),
`POST /v1/responses`, `POST /text` (Messages), `GET /text/{prompt}`,
`POST /v1/embeddings`, `GET /realtime` und `/v1/realtime` (WebSocket).

### Bild
`POST /v1/images/generations`, `POST /v1/images/edits`, `GET /image/{prompt}`.

### Video / 3D
`GET /video/{prompt}`, `GET,POST /3d/{prompt}`.

### Audio
`POST /v1/audio/speech`, `POST /v1/audio/speech/with-timestamps`,
`POST /v1/audio/transcriptions`, `POST /v1/audio/voice-changer`,
`POST /v1/audio/voice-isolator`, `GET /audio/{text}`.

### Modelle
`GET /models`, `GET /v1/models`, `GET /v1/models/{model}`,
`GET /image/models`, `GET /video/models`, `GET /text/models`,
`GET /audio/models`, `GET /embeddings/models`, `GET /3d/models`,
`GET /v1/models/status`. Alle nehmen optional `?community=`.

### Konto
`GET /account/balance`, `/account/profile`, `/account/usage`,
`/account/usage/daily`, `/account/key`, `/account/key/usage`,
`GET,POST /account/keys`, `DELETE /account/keys/{id}`, `/account/quests`,
`/account/earnings`, `/account/earnings/transactions`, sowie die
My-Models-/Agent-Familie (`/account/my-models/*`, `/account/agents*`).

### Medien
`POST /upload`, `GET /media`, `GET /{id}`, `GET /{id}/metadata`,
`DELETE /media/{id}` — alle auf `media.pollinations.ai`.

## 4. Das Modell-Objekt (das nuetzlichste Stueck der Spec)

`/image/models` liefert ein Array mit diesen Feldern:
`name`, `aliases`, `category`, `publisher`, `brand_url`, `community`,
`agent`, `base_model`, `per_user_rpm`, `pricing`, `pricing_variants`,
`pricing_default_label`, `pricing_adjustments`, `resolutions`, `title`,
`description`, `input_modalities`, `output_modalities`, `required_safety`,
`supported_endpoints`, `video_capabilities`, `min_duration`, `max_duration`,
`default_duration`, `allowed_durations`, `duration_step`,
`max_reference_images`, `max_reference_videos`, `capabilities`, `tools`,
`reasoning`, `context_length`, `voices`, `is_specialized`, `paid_only`,
`pending_change`, `alpha`, `flat_rate`, `added_date`.

Das heisst: **die Oberflaeche muss nichts ueber Modelle hartcodieren.**
`max_reference_images`, `input_modalities`, `resolutions`,
`supported_endpoints` und `video_capabilities` sind genau die Felder, die
unsere Config heute von Hand pflegt (`maxImages`, `supportsReference`,
`resolution`). Wer sie live liest, kann nicht mehr driften.

## 5. Die Kernwahrheit: Modelllisten sind key-abhaengig

Gemessen mit demselben Endpunkt, nur anderer Header:

| Sicht | Bildmodelle | Videomodelle |
|---|---|---|
| **Betreiber-Key (`sk_`)** | **5** | **0** |
| ohne Key (Registry-Sicht) | 83 | 19 |

Die fuenf, die der Betreiber-Key darf:

| Kanonischer Name | Aliase | rpm | Preis | Referenzen |
|---|---|---|---|---|
| `tongyi-mai/z-image-turbo` | `z-image`, `z-image-turbo`, `zimage` | 60 | 0.004 | — |
| `lykon/dreamshaper-8-lcm` | `sana`, `dreamshaper` | 300 | 0.0001 | — |
| `openai/gpt-image-2` | `gpt-image-2` | 6 | Text 0.00000375 / Bild 0.000006 / Ausgabe 0.0000225 | 16 |
| `black-forest-labs/flux.2-klein-4b` | `flux-klein`, `klein` | 60 | 0.005 | 10 |
| `black-forest-labs/flux.1-kontext-pro` | `kontext` | — | 0.03 | 1 |

Alle fuenf nennen `/v1/images/generations`, `/v1/images/edits`,
`/image/{prompt}`, `/v1/responses` und `/v1/chat/completions` als
`supported_endpoints`.

**Konsequenzen, die vorher falsch im Repo standen:**

1. **"Anonym als Fallback" existiert nicht.** Ohne Key antworten
   Generierungs-Endpunkte mit 401 ("A valid API key is required"). Der Pfad
   "402 → nochmal ohne Schluessel" ist toter Code.
2. **`paid_only` ist nicht die Freigabe.** `paid_only: false` heisst "im
   Prinzip frei", nicht "dieser Key darf es". Die Freigabe steht nur in der
   Antwort **mit** Key. Beispiel: `black-forest-labs/flux.1-schnell` traegt
   `paid_only: false` und antwortet am Betreiber-Key mit **403**.
3. **Video ist mit dem Serverkey gar nicht vorhanden** — die Liste ist leer,
   nicht leer aus Zufall. Video braucht einen Nutzer-Key (BYOP).
4. **Die Registry-Sicht ist trotzdem wertvoll.** Sie ist der Katalog dessen, was
   ein Nutzer mit eigenem Guthaben kaufen kann (Nano Banana, Grok Imagine,
   Seedream, Qwen Image, Veo, Seedance, …). Deshalb erscheinen diese Modelle in
   Create sichtbar, aber gesperrt, markiert als "bezahlt".

## 6. Referenzbilder — wie sie wirklich gehen

- `GET /image/{prompt}`: Parameter `image` ist ein **String**,
  mehrere URLs durch `|` oder `,` getrennt. Bei Bildmodellen "editieren oder
  Stil-Referenz"; bei Videomodellen ist `image[0]` das Startbild und
  `image[1]` das optionale Endbild. `reference_images`, `reference_videos`
  und `reference_audios` sind **Video-only**.
- `POST /v1/images/generations`: `image` ist `string | string[]` — die
  Spec nennt es ausdruecklich "Reference image URL(s) for image-to-image
  generation (Pollinations extension)".
- `POST /v1/images/edits`: **zwei** Content-Types, `application/json` **und**
  `multipart/form-data`. Ein Upload muss also nicht erst auf eine URL warten.
- Wie viele Referenzen erlaubt sind, sagt `max_reference_images` pro Modell
  (live: gpt-image-2 = 16, flux.2-klein-4b = 10, kontext-pro = 1).
- **Zwingend sind URLs, nicht Bytes.** Die Pipeline lautet deshalb:
  Datei → `media.pollinations.ai/upload` → oeffentliche URL → in `image`
  setzen. Genau das repariert den leeren Referenz-Slot: das Vorschaubild kommt
  aus der lokalen Datei (Object URL), die Generierung aus der media-URL. Beides
  darf nie am selben Ergebnis haengen.

## 7. Medien-Speicher

| Regel | Wert |
|---|---|
| Formate | `multipart/form-data` Feld `file` **oder** `application/json` mit base64 `data` (+ `contentType`, `name`, `tags`) |
| Antwort | `{ id, url, contentType, size, tags }` |
| Limit | 100 MB (dekodiert) in beiden Formaten |
| Lebensdauer | 30 Tage ab Upload; `GET` verlaengert, sobald die Datei **mindestens 15 Tage** alt ist (Metadata/HEAD verlaengern nicht) |
| Eigene ID | `id` setzbar (case-sensitive, max. 128 Zeichen), verlangt einen Nutzer-eigenen Key; vorhandene Datei → **409**, ohne Ueberschreiben |
| Loeschen | nur getaggte, eigene Uploads (`DELETE /media/{id}`, `sk_`) |
| Verknuepfung | Generierungsantworten setzen `Link: <...>; rel="enclosure"`; `response_format: "url"` legt die URL zusaetzlich in `data[].url` |
| Tags | `tags` **publiziert** in die oeffentliche Galerie `GET /media?tag=…` (Alpha) |

Wichtig fuer uns: das Ablaufdatum ist eine echte Frist. Eine media-URL, die
heute als Referenz gespeichert wird, ist in 30 Tagen tot — Assets, die bleiben
sollen, muessen bei uns liegen (BlobManager/IndexedDB), nicht nur als Link.

## 8. Fehler, Wiederholung und Sicherheit

Fehlerform ist immer `{ status, success: false, error: { code, message } }`
(bei Validierungsfehlern zusaetzlich `details`).

| Status | Bedeutung | Was wir tun |
|---|---|---|
| `400` | ungueltige Parameter | nicht wiederholen, Fehler zeigen |
| `401` | Key fehlt/ungueltig | Key-Problem melden, nie "anonym" nachschiessen |
| `402` | zu wenig Pollen | Guthaben-Hinweis + Top-up-Link |
| `403` | Key darf das Modell nicht | Modell als gesperrt markieren, **vor** der Auswahl |
| `429` | Rate-Limit (`per_user_rpm`) | warten, nicht sofort erneut |
| `500` | Serverfehler | wiederholen |
| `503` | Safety-Dienst nicht erreichbar (bei `safe`) | wiederholen |

**Die wichtigste Betreiber-Regel aus der Doku:** Wer in einen Timeout laeuft,
soll **exakt denselben Request** nochmal senden — gleicher Endpunkt, Body, Query
und Seed. Die Generierung laeuft nach dem Verbindungsabbruch weiter; die
Wiederholung wartet auf das laufende Ergebnis oder bekommt das bereits
fertige, gecachte Resultat. **Abgerechnet wird nur die Generierung, nicht die
Wiederholung und nicht der Cache-Treffer.** Das gilt fuer Text (nicht-streamend),
Embeddings, Bild, Video, 3D, Audio und Transkription, inklusive der
OpenAI-kompatiblen Endpunkte.

Daraus folgt fuer `src/lib/media/server-media-ingest.ts` und `/api/generate`:
ein 504 "Timed out waiting for media" ist **kein** Endzustand. Derselbe Request
muss wiederholt werden, sonst bezahlt der Nutzer eine Generierung, die fertig
geworden waere.

Safety ist optional und standardmaessig aus (`safe`, auch als Header
`Pollinations-Safe`): `privacy`, `secrets`, `sexual`, `violence`,
`shield`; `true` = `privacy,secrets`, `nsfw` = `sexual,violence`.
`required_safety` im Modell-Objekt ist **nicht** abschaltbar. Blockierte
Anfragen: `400` mit `error.type: "safety_error"`.

## 9. SDK, CLI, MCP

- **`@pollinations/sdk` 5.0.0** (2026-09-08): "Official SDK", **keine
  Runtime-Abhaengigkeiten**, ESM + CJS + Browser-Build, eigener
  `./react`-Export (Peer: React 18/19), Node >= 18. Ein echter Kandidat, um
  unsere handgeschriebenen Fetch-Schichten zu ersetzen.
- **`@pollinations/cli` 0.1.13**: Binary `polli` (`npx @pollinations/cli gen
  image "…" --output x.png`), `--json` fuer Agenten, Credentials unter
  `~/.pollinations/credentials.json`. Das Paket enthaelt eine
  `SKILL.md` — der offizielle Weg, einem Agenten die API beizubringen.
- **MCP-Server** unter `gen.pollinations.ai/mcp/{pollinations,ffmpeg,exa,composio}`
  (Streamable HTTP, Bearer-Header). Der Pollinations-Server kann Modelle
  entdecken, Text und Medien generieren, Embeddings und 3D, Status und Guthaben.
  `curl https://gen.pollinations.ai/mcp` listet Endpunkte und Preise.

## 10. Offene Punkte, die aus dieser Messung folgen

1. `image.pollinations.ai` ist aus dem Repo entfernt — als Naechstes aus alten
   Docs/Handoffs streichen, damit kein Agent die Erinnerung wieder ausgraebt.
2. Der "402 → anonym"-Fallback ist toter Code (401) und muss raus.
3. 504 ist wiederholbar: Retry mit identischem Request statt Nutzer-Fehler.
4. Video und die Bezahl-Klassiker brauchen BYOP (`pk_` + OAuth) oder einen
   eigenen Nutzer-Key; am Betreiber-Key sind sie nicht bedienbar.
5. `safe`/Safety-Status ist bisher nirgends gesetzt — bewusste Entscheidung
   dokumentieren oder Header auswerten (`X-Safety-Applied`).
6. Modell-Metadaten (`max_reference_images`, `resolutions`,
   `input_modalities`) live lesen statt in `unified-image-models.ts` pflegen.
7. `GET /api/pollen/account` wird im Log im Sekundentakt gerufen (`1334ms`,
   `1349ms`, `1335ms` …). Das braucht Cache/Dedupe.
