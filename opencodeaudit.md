# OpenCode Audit Report

## 1. Ziel & Scope
Dieser Audit bewertet Architektur, Datenflüsse, Sicherheit/Privacy, Stabilität und Wartbarkeit der HeyHi-Repository-Struktur. Grundlage sind Quellcode-Review, API-Routen, Konfiguration und Tests.

## 2. Zusammenfassung (Executive Summary)
- Architektur ist klar auf Next.js App Router (Client-Heavy) und lokale Persistenz via IndexedDB (Dexie) ausgelegt.
- Kernlogik für Chat, Bildgenerierung und Gallery ist konsistent modularisiert (Hooks + Services).
- Es existiert eine starke Local-First Story, aber mehrere Cloud-/Third-Party Touchpoints (Pollinations, Replicate, S3, Vercel Blob, Catbox, Deepgram).
- Sicherheits- und Betriebsrisiken liegen primär in Token-Handling, Proxying externer URLs und Cleanup-Strategien.
- Tests existieren (Jest), aber nur punktuell (ChatService). Kein CI sichtbar.

## 3. Architektur-Überblick
### 3.1 App-Entry & Routing
- Next.js App Router, Einstieg über `src/app/page.tsx` → `src/app/unified/page.tsx`.
- Zentrale UI-Composition: `ChatProvider` + `AppLayout` + Dialoge + `ChatInterface`.
- Root layout mit Theme/Language Provider und globalen Fonts.

### 3.2 Modulstruktur (High-Level)
- UI: `src/components/*`
- State/Logic: `src/hooks/*`
- Services: `src/lib/services/*`
- API-Routes: `src/app/api/*/route.ts`
- AI Flows: `src/ai/flows/*`

### 3.3 State & Orchestrierung
- Chat-Logik stark zentralisiert in `ChatProvider` und zugehörigen Hooks (`useChatState`, `useChatEffects`, `useChatPersistence`, `useChatMedia`, `useChatAudio`, `useChatRecording`).
- Unified Image Tool State in `useUnifiedImageToolState` inklusive Upload- und Enhance-Flows.
- Modell- und UI-Settings werden über `useLocalStorageState` stabilisiert.

## 4. Datenflüsse (Core Flows)
### 4.1 Chat Flow (Text/Multimodal)
1. UI → `ChatProvider.sendMessage`
2. Optionaler Vision-Upload via S3 Signed URL
3. ChatService → `/api/chat/completion`
4. Server: Pollinations/Mistral/Replicate je nach Modell
5. Persistenz in IndexedDB (Dexie) + Memory-Service

### 4.2 Image Generation Flow
- Auswahl Model → Uploads (S3 Signed URL) → `ChatService.generateImage`
- Pollinations oder Replicate → Ergebnis-URL
- Persistenz lokal in Dexie (Blob) oder remote über S3 ingest

### 4.3 Gallery/Assets
- Assets in Dexie gespeichert (`db.assets`), Galerie liest via `useGalleryAssets`.
- `useAssetUrl` löst Blob/remoteUrl/storageKey zu finaler URL auf.

## 5. Datenhaltung & Persistenz
- Hauptspeicher: IndexedDB via Dexie (HeyHiVault)
- Chat-Verläufe & Nachrichten in getrennten Tabellen (conversations/messages)
- Assets mit Blob/remoteUrl/storageKey
- Migration von legacy localStorage nach Dexie vorhanden
- localStorage bleibt für Settings, SessionId und Migration Flag

## 6. API-Oberfläche (Server)
Wesentliche API-Routen:
- `/api/chat/completion`: Pollinations/Mistral/Replicate Gateway
- `/api/chat/title`: Titelgenerierung
- `/api/generate` + `/api/generate-video`: Pollinations Media
- `/api/replicate`: Replicate Gateway (inkl. Passwortschutz)
- `/api/upload/sign`, `/api/upload/sign-read`: S3 Signed URLs
- `/api/upload/ingest`: Pollinations-Output ingest nach S3
- `/api/upload`: Vercel Blob Upload/Delete
- `/api/upload/temp`: Catbox Temp Upload
- `/api/proxy-image`: Proxy für externe Bild-URLs
- `/api/blob-cleanup`: Vercel Blob Cleanup
- `/api/stt`, `/api/tts`: Speech In/Out
- `/api/enhance-prompt`: Prompt Enhancement via Pollinations

## 7. Externe Abhängigkeiten & Services
- Pollinations (Chat/Image/Enhance/WebContext/Search)
- Replicate (Image/Video + TTS)
- Deepgram (STT)
- AWS S3 (Signed Upload + Ingest)
- Vercel Blob (Upload + Cleanup)
- Catbox.moe (Temp Upload für öffentliche URLs)
- Mistral API (Direkte Nutzung + Streaming)

## 8. Sicherheit & Privacy
### 8.1 Positiv
- API Secrets in `process.env` (keine hardcodierten Tokens)
- Signed URLs für Upload/Read in S3
- Private Mode handling bei Pollinations (Fallback wenn Key fehlt)
- Fehlerbehandlung zentral über `api-error-handler`

### 8.2 Risiken & Findings
1. `/api/proxy-image` ist ein open proxy für beliebige URLs (potenziell SSRF). Keine allowlist, keine domain checks.
2. Catbox-Temp-Upload exfiltriert Medien an Drittdienst, muss explizit kommuniziert werden.
3. Vercel Blob Cleanup basiert auf Dateiname-Timestamp-Pattern (`uploads/(\d+)-`) – erzeugte Keys nutzen `crypto.randomUUID` und enthalten keine Timestamp → Cleanup greift nicht zuverlässig.
4. WebContext/Search nutzen Pollinations API mit kurzen Timeouts, aber ohne Circuit-Breaker oder Exponential Backoff.
5. lokal gespeicherte Medien bleiben dauerhaft; keine UI-Exposition für Retention-Policy.

## 9. Stabilität & Resilienz
- Mistral direkter Modus hat Retry/Timeouts.
- Pollinations hat Legacy-Fallback auf text endpoint.
- Replicate-Polling mit timeouts und maxAttempts.
- ChatProvider setzt `MAX_STORED_CONVERSATIONS` und löscht oldest.

## 10. Testing & Tooling
- Jest vorhanden, aber Testabdeckung begrenzt auf `ChatService`.
- ESLint: `next/core-web-vitals`
- TypeScript strict aktiviert.
- Keine CI config im Review sichtbar.

## 11. Architektonische Beobachtungen (Design-Fit)
- Local-First wird konsistent umgesetzt (Dexie + localStorage).
- Gleichzeitige Nutzung von S3, Vercel Blob, Catbox für unterschiedliche Upload-Szenarien → erhöhter Komplexitätsgrad.
- Image-Flow divergiert: Pollinations-Assets über ingest, Replicate-Assets via fetch+Blob fallback.
- WebContext/Search direkt im Chat Completion Flow gekoppelt.

## 12. Konkrete Findings (Risiko + Impact)
1. **Blob Cleanup Mismatch**: Cleanup sucht `uploads/<timestamp>-` aber Uploads generieren `uploads/<uuid>-name`.
   - Impact: Stale blobs bleiben, Kosten + Privacy-Risiko.
2. **Proxy-Image SSRF Risiko**: Kein Domain-Filter.
   - Impact: Missbrauch für interne Netzwerkzugriffe.
3. **Temp Upload via Catbox**: Keine explizite Opt-In/Disclosure im Codepfad sichtbar.
   - Impact: Datenschutz-/Compliance Risiko.
4. **Title Update vs updatedAt**: Title-Edit in `ChatProvider` nutzt `updateConversationMetadata` ohne klaren `updatedAt` bump.
   - Impact: UI/Sortierung kann inkonsistent sein.
5. **Legacy Migration**: Migration speichert `content` als JSON.stringify bei nicht-string Content; später wird nicht mehr korrekt deserialisiert.
   - Impact: Potenzieller Content-Format Drift in Alt-Daten.

## 13. Empfehlungen (Priorisiert)
### Kurzfristig (1–2 Tage)
- Domain-Allowlist für `/api/proxy-image` (Pollinations, Replicate, S3, Blob).
- Fix Blob Cleanup: Key-Schema angleichen oder Cleanup auf metadata/createdAt umstellen.
- Logische Anpassung: `updatedAt` beim Title-Update aktualisieren.
- Transparenzbanner/Tooltips für Catbox-Temp-Upload.

### Mittelfristig (1–2 Wochen)
- Upload Pipeline vereinheitlichen (S3 vs Vercel Blob vs Catbox)
- Canonical Asset Record definieren (Blob vs remoteUrl vs storageKey), inkl. Lifecycle-Policies
- Retry/Backoff für Pollinations WebContext/Search

### Langfristig (1–2 Monate)
- CI Pipeline (lint + typecheck + tests)
- Security review + threat model (SSRF, token exposure, data retention)
- Asset retention policy + UI-based cleanup

## 14. Offene Fragen
- Soll der Temp Upload via Catbox dauerhaft bleiben oder ersetzt werden?
- Welche Retention-Strategie für Gallery-Assets ist gewünscht?
- Welche Modelle/Provider sind strategisch „first-class“, welche werden auslaufen?

## 15. Referenzen (Codepfade)
- Entry/Router: `src/app/page.tsx`, `src/app/unified/page.tsx`, `src/app/layout.tsx`
- Chat Logic: `src/components/ChatProvider.tsx`, `src/hooks/useChatState.ts`, `src/hooks/useChatEffects.ts`
- Persistence: `src/lib/services/database.ts`, `src/lib/services/migration.ts`, `src/hooks/useChatPersistence.ts`
- Uploads: `src/lib/upload/s3-upload.ts`, `src/app/api/upload/sign/route.ts`, `src/app/api/upload/ingest/route.ts`
- Media APIs: `src/app/api/generate/route.ts`, `src/app/api/replicate/route.ts`, `src/app/api/upload/temp/route.ts`
- Proxy: `src/app/api/proxy-image/route.ts`
- WebContext/Search: `src/lib/services/web-context-service.ts`, `src/lib/services/search-service.ts`
- Tests: `src/lib/services/__tests__/chat-service.test.ts`
