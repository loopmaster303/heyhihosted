# 🧠 GEMINI_CONTEXT.md: heyhihosted (The Agent Handbook)

Dieses Dokument ist die **Single Source of Truth** für die Architektur, Funktionalität und die Entwicklungsregeln dieses Projekts. **Lies dies zuerst, bevor du Code änderst.**

---

## 1. 🚀 Projekt-Identität
*   **Zweck:** High-End AI-Schnittstelle für Chat, Bild- und Videogenerierung.
*   **Framework:** Next.js 15 (App Router) mit Turbopack.
*   **Design-Sprache:** Modernes Glass-Morphism, Frosted Glass Effekte, dezent-elegantes UI (Electric Purple / Pink).
*   **Speicher-Paradigma:** "Privacy First". Chat-Inhalte liegen **ausschließlich** im lokalen Browser-Speicher (`localStorage`). Es gibt keine serverseitige User-Datenbank für Chats.

---

## 2. 🏗 Architektur & Datenfluss

### A. Chat & Personas
*   **State:** `ChatProvider.tsx` orchestriert den globalen Zustand via Hooks (`useChatState`, `useChatLogic`).
*   **Context Engineering:** Jede Nachricht an die API wird dynamisch aus drei Komponenten zusammengebaut:
    1.  **Persona:** (aus `chat-options.ts`) – XML-strukturiert, englische Logik, Few-Shot Beispiele.
    2.  **Runtime Metadata:** (Datum, Uhrzeit, Umgebung).
    3.  **Internal Protocol:** Anweisung zur internen Absichtsanalyse (Hidden Reasoning).
*   **Streaming:** Nutzt Server-Sent Events (SSE) für flüssige Antworten.

### B. Bild- & Videogenerierung
*   **Provider:** Pollinations (Pollen API) und Replicate.
*   **API-Routen:** `src/app/api/generate` (Pollinations) und `/api/replicate`.
*   **Wichtig:** Pollinations-Bilder werden oft asynchron generiert. Der Client nutzt eine `GalleryImage`-Komponente mit Retry-Logik (HEAD-Requests), um "Broken Image"-Icons zu vermeiden.
*   **Referenz-Bilder:** Unterstützt Image-to-Image (img2img). Bild-URLs werden als Parameter `?image=...` übergeben **und** zusätzlich in den Text-Prompt injiziert für maximale Zuverlässigkeit.

### C. Speicher (Vercel Blob)
*   User-Uploads (Dokumente/Bilder) werden verschlüsselt und landen im **Vercel Blob Storage**.
*   **Pfad:** `uploads/{uuid}-{filename}`.
*   **Cleanup:** Ein täglicher Cron-Job (`vercel.json`) löscht verwaiste Blobs.

---

## 3. 🚨 Die "Goldenen Regeln" (Strict Enforcement)

### 🔴 Regel 1: Bild-Tags & `next/image`
*   **Verwende NIEMALS `next/image`** für User-Uploads, Blobs oder generierte KI-Bilder.
*   **Grund:** `next/image` kann `blob:`-URLs nicht optimieren und führt zu massiven CORS- und Whitelist-Problemen.
*   **Vorgehen:** Nutze natives `<img>` und unterdrücke die Linter-Warnung mit `{/* eslint-disable-next-line @next/next/no-img-element */}`.

### 🔴 Regel 2: UI-Layering (Portale)
*   **Lightboxen und Overlays** (wie das große Galerie-Grid oder Bild-Vergrößerungen) **müssen** via `createPortal` in den `document.body` gerendert werden.
*   **Grund:** Virtuelle Listen (`react-virtuoso`) oder Framer Motion Animationen im Parent schneiden `fixed` positionierte Elemente sonst ab.

### 🔴 Regel 3: Prompt-Engineering (Personas)
*   Ändere Personas nur in `src/config/chat-options.ts`.
*   Halte dich an den **XML-Stil** (`<identity>`, `<few_shot_example>`).
*   System-Logik immer auf **Englisch**, Output-Direktive immer auf **Deutsch** (Language Guard).

### 🔴 Regel 4: Performance & virtualisierte Listen
*   Der Chat-Verlauf in `ChatView.tsx` nutzt `Virtuoso`.
*   Achte darauf, dass Nachrichten-Arrays in `useMemo` gewrappt sind, um unnötige Re-Renders bei jedem Tastenanschlag im Input zu vermeiden.

---

## 4. 🛠 Wichtige Dateipfade
*   `src/config/chat-options.ts`: Personas, Modelle, Stimmen.
*   `src/components/ChatProvider.tsx`: Das "Gehirn" der App.
*   `src/components/layout/AppSidebar.tsx`: Navigation und Galerie-Logik.
*   `src/app/api/enhance-prompt/sanitize.ts`: Regex-Türsteher für Bild-Prompts.
*   `src/assets/icons-models/`: Icons für die Modell-Auswahl.

---

## 5. 🔍 Troubleshooting-Muster
*   **Broken Icons?** Prüfe die `GalleryImage` Komponente und den `gen.pollinations.ai` Endpunkt.
*   **Chat überdeckt?** Prüfe `UnifiedInput.tsx`. Die `topElements` müssen im normalen Layout-Fluss (nicht `absolute`) liegen.
*   **API Fehler?** Prüfe die `allowedDevOrigins` in `next.config.ts` für deine aktuelle IP.

---
*Status: Optimiert & Gesichert am 04.01.2026*