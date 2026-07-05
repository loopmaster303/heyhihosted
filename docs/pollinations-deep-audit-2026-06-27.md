# Pollinations Integration — Deep Audit 2026-06-27

Tiefenaudit der gesamten Pollinations-Integrationsschicht gegen die Live-Registry
(`gen.pollinations.ai/models`, Namen + Aliase) und gegen den realen Code-Datenfluss.
Basis-Abgleich der Modell-IDs siehe [pollinations-api-audit-2026-06-01.md](pollinations-api-audit-2026-06-01.md).

Bereits behoben in dieser Session:
- `grok-video` deaktiviert (existiert upstream nicht mehr, nur `grok-video-pro`).
- Alias `grok-imagine-video` korrigiert: `grok-video` → `grok-video-pro`.
- Zugehöriger Test angepasst.

---

## Key-Modell (3 Ebenen)

1. **„Free für alle"** — Server-Env `POLLEN_API_KEY`, nur serverseitig, `resolvePollenKey()`-Fallback.
   Schaltet die `enabled: true`-Modelle frei.
2. **Eigener Key** — `connectManual()` → `localStorage['pollenApiKey']` → Header `X-Pollen-Key`.
3. **Pollinations Connect (OAuth)** — [usePollenKey.ts:140](../src/hooks/usePollenKey.ts) →
   `enter.pollinations.ai/authorize?permissions=profile,balance,usage&expiry=30`, Key kommt im
   URL-Fragment zurück (nie an Server, sofort aus URL entfernt — sauber). Gleicher Speicher wie (2).

Modell-Sichtbarkeit gated auf `useHasPollenKey()` → `getVisualizeModelGroups({ includeByopHidden })`:
ohne eigenen Key nur Free-Auswahl, mit Key/Connect zusätzlich der BYOP-Block.

---

## P0 — Security: API-Key leakt in zurückgegebene URL (beide Key-Quellen)

**Datei:** [src/lib/pollinations-sdk.ts:73-75,111-113](../src/lib/pollinations-sdk.ts) + [src/app/api/generate/route.ts:135](../src/app/api/generate/route.ts)

Der GET-Pfad hängt den API-Key als Query-Param an: `...?...&key=<KEY>`.
Dieser Pfad wird genutzt für **alle Videos** und **alle I2I-Bildgenerierungen** (Referenzbild).
Die fertige URL wird als `{ imageUrl/videoUrl }` an den Client zurückgegeben (Zeile 135),
dort geladen und teils als Asset-URL in IndexedDB persistiert.

**Betrifft beide Key-Quellen:**
- **Anonyme User:** `resolvePollenKey()` liefert den **Server-Env-Key** (Ebene 1) → der geteilte
  „Free-für-alle"-Key landet im Browser **jedes** Besuchers und ist an das eigene Pollen-Konto/
  -Budget/-Rate-Limit gebunden. Abgreifbar → Fremdverbrauch des Kontingents.
- **User mit eigenem Key/OAuth (Ebene 2/3):** der **persönliche** Key (OAuth mit `balance,usage`-Rechten)
  landet in dessen IndexedDB-Asset-URL → bei XSS abgreifbar.

Der parallele v1-POST-Pfad (Text→Bild ohne Referenz) macht es richtig (`Authorization: Bearer`,
Key bleibt serverseitig).

**Fix-Richtung:** Key niemals in der an den Client zurückgegebenen URL. Optionen:
- GET-Generierung serverseitig ausführen und nur die fertige Media-URL (ohne `key`) zurückgeben, oder
- Key vor dem Return aus der URL strippen, oder
- I2I/Video ebenfalls über einen authentifizierten POST/Proxy laufen lassen.

---

## P1 — Toter, falsch verdrahteter BYOP-Pfad

**Datei:** [src/lib/services/pollinations-fetch.ts](../src/lib/services/pollinations-fetch.ts)

`pollinationsFetch()` ist **ungenutzt** (kein Caller im gesamten `src`). Es ist zudem doppelt falsch:
- Liest aus `sessionStorage['pollen_user_key']` — der echte Key liegt in `localStorage['pollenApiKey']`.
- Sendet Header `X-Pollen-User-Key` — der Server (`resolvePollenKey`) liest nur `X-Pollen-Key`.

Bei Reaktivierung würde BYOP still fehlschlagen (kein Key durchgereicht, lautloser env-Fallback).

**Fix-Richtung:** Datei löschen. Der kanonische Pfad ist `getPollenHeaders()` → `X-Pollen-Key` →
`resolvePollenKey()` (12 Caller, konsistent).

---

## P2 — Key-Prefix-Logging

**Datei:** [src/app/api/generate/route.ts:62](../src/app/api/generate/route.ts)

`console.log(... '| key prefix:', apiKey?.slice(0, 6))` loggt die ersten 6 Zeichen des Keys.
Auf Vercel landen `console.log` in den Function-Logs. Prefix raus oder auf reines
`source: BYOP|env`-Logging reduzieren.

---

## P2 — Zwei divergierende Image-Pfade ohne klare Grenze

- `pollinations-image-v1.ts` → POST `/v1/images/generations` (OpenAI-kompatibel, Bearer) — Text→Bild ohne Ref.
- `pollinations-sdk.ts` → GET `/image/{prompt}?...` — Video + I2I.

Begründung steht im Code (v1-POST akzeptiert keine Referenzbilder, [route.ts:111](../src/app/api/generate/route.ts)).
Tragfähig, aber die Verzweigung ist implizit und der GET-Pfad ist genau der mit dem Key-Leak (P0).
Nach P0-Fix prüfen, ob ein einheitlicher authentifizierter Pfad möglich ist.

---

## P3 — Param-Naming `aspectRatio` verifizieren

**Datei:** [src/lib/pollinations-sdk.ts:57,96](../src/lib/pollinations-sdk.ts)

Gesendet wird `aspectRatio` (camelCase). Viele Pollinations-Params sind snake_case
(`negative_prompt`). Live gegen die API gegenprüfen, ob `aspect_ratio` erwartet wird —
sonst wird das Seitenverhältnis still ignoriert.

---

## Neue Modelle (Erweiterung, kein Fehler)

Verfügbar in der Live-Registry, nicht in der Config:

| Kategorie | Neu |
|-----------|-----|
| Image | `ideogram-v4-turbo/balanced/quality`, `nova-canvas`, `seedream-pro`, `gpt-image-2` |
| Audio | `stable-audio-3-large/medium`, `eleven-sfx`, `eleven-multilingual-v2` |
| Text | `gemini-3-flash`, `mercury`, `polly`, `kimi-code`, `gpt-5.4`/`-mini` (Text-Set bewusst kuratiert) |

Separate Produktentscheidung — kein Korrektur-, sondern Erweiterungsthema.

---

## Empfohlene Reihenfolge

1. **P0** Key-Leak schließen (Security, höchste Prio).
2. **P1** `pollinations-fetch.ts` löschen (toter Risiko-Code).
3. **P2** Key-Prefix-Logging entfernen.
4. **P3** `aspectRatio` live verifizieren.
5. Neue Modelle als eigenes Vorhaben bewerten.
