# heyhireset createwith — Brainstorm + Annotations

**Session:** 2026-06-01  
**Status:** Übergabe an Coding Agent zur Planerstellung

---

## Kernvision (aus Gespräch)

Eine App, ein Chatfeld. Intent wird erkannt, App entscheidet alles dahinter.
Wirkt intelligent — nicht wie ein API-Wrapper.

> „Man könnte einfach wie in ChatGPT/Gemini eine simple Chat-App haben."

---

## Design-Entscheidungen

### 1. Simple Mode vs. Advanced Mode

- **Simple Mode (Default):** Kein Model-Picker, keine Params-UI. User schreibt/spricht, App erkennt Intent und entscheidet autonom: Modell, Seitenverhältnis, Länge, Enhancement.
- **Manual Mode Choices bleiben:** Chat / Bild / Musik als explizite Mode-Buttons — aber nur das, keine tausend Sub-Optionen.
- **Advanced Mode:** Versteckte Params für Power-User zugänglich (collapsible / separater Tab).

### 2. Intent-Resolution als eigene Architektur-Unit

Neue Unit zwischen Chat-Core und Transport:

```
User Input → Intent-Resolution → { mode, model, params } → Transport → Proxy → Pollinations
```

Intent-Resolution klassifiziert: `chat | image | video | music` und wählt Standardmodell + Standardparams (Seitenverhältnis, Länge, Qualität).

### 3. Asset-Metadata-Schema (Pflichtfelder)

Jedes generierte Asset bekommt:
```typescript
{
  promptSent: string,       // der tatsächlich gesendete (enhanced) Prompt
  modelUsed: string,        // welches Modell wurde gewählt
  intentDetected: string,   // 'image' | 'video' | 'music' | 'chat'
  params: Record<string, unknown>  // aspect ratio, duration, seed, etc.
}
```

### 4. Asset-Flow: Chat + Vault/Gallery

Generiertes Asset erscheint:
- **Inline im Chat** (als Bubble/Card)
- **Automatisch in Vault/Gallery** (kein manueller Schritt)

Hover auf Asset → voller gesendeter Prompt sichtbar, kopierbar. Bild zoombar.

### 5. Prompt-Enhancement bleibt

Modell enhanced User-Prompt vor dem Senden. Enhancement-Prompt landet in Metadaten (`promptSent` = der enhanced Prompt). User kann Enhancement-Prompt bei Hover sehen und kopieren.

### 6. App Capability Knowledge-Base

App hat ein internes Verständnis ihrer eigenen Fähigkeiten:
- Kann jederzeit erklären was ein Modell tut und warum es gewählt wurde
- System-Prompt enthält Selbstbeschreibung der App-Fähigkeiten
- Fühlt sich intelligent an, nicht wie ein Formular

### 7. Model-Registry: `simpleMode` Flag

```typescript
{
  id: 'flux-schnell',
  simpleMode: true,   // erscheint im Default-UI
  ...
}
```

Nur `simpleMode: true` Modelle sind im Standard sichtbar. Advanced-Mode zeigt alle.

---

## Anmerkungen / Offene Punkte (Claude)

**1. Intent-Resolution: LLM oder heuristics?**
Kleine Klassifikations-LLM-Calls kosten Latenz + Pollinations-Quota. Alternative: regelbasierte Heuristik (Keywords `"bild von", "zeichne", "musik"` → image/music). Empfehlung: Heuristik first, LLM-Fallback optional. Im Plan explizit entscheiden.

**2. `promptSent` vs. `promptOriginal`**
Beide speichern: Original-User-Input + Enhanced-Prompt. Hover zeigt welchen? Klären: zeigt der Hover den enhanced Prompt (= was gesendet wurde) oder den Original-Input? Beides speichern, Hover zeigt `promptSent`.

**3. Simple/Advanced Mode Persistenz**
Wo wird gespeichert ob User im Advanced Mode ist? LocalStorage reicht. Kein Dexie nötig für diese Preference.

**4. Gallery/Vault ist Phase-2-Scope laut Spec**
Die Spec schreibt Gallery explizit raus (eigener späterer Spec). Der Auto-Land-in-Gallery-Flow muss trotzdem im Asset-Schema vorbereitet werden — aber das UI für Gallery ist nicht in der createwith-Scheibe. Im Plan klarstellen: Schema vorbereiten, Gallery-UI raus.

**5. Spec-Update nötig vor Plan-Execution**
Diese Punkte sind noch nicht in der offiziellen Spec (`2026-05-31-heyhireset-foundation-createwith-design.md`). Entweder Spec updaten oder Plan als "Spec-Extension" markieren.

---

## Übergabe an Coding Agent

Der Agent soll auf Basis dieser Notizen + der bestehenden Spec einen ausführlichen Implementierungsplan schreiben nach dem Muster der heyhihosted-Pläne in `docs/plans/`.

Phasen-Vorschlag:
- Phase 0: Next.js Scaffold + Tooling
- Phase 1: Model-Registry mit simpleMode-Flag + TDD
- Phase 2: Persistence (Dexie-Schema inkl. Asset-Metadata)
- Phase 3: Intent-Resolution Unit + TDD
- Phase 4: Transport + Proxy (Route Handler)
- Phase 5: Chat-Core + Send-Loop
- Phase 6: App-Shell (Landing ↔ Chat State)
- Phase 7: Asset-Inline-Display im Chat
- Phase 8: Prompt-Enhancement-Integration
- Phase 9: Capability Knowledge-Base (System-Prompt)
- Phase Final: Build-Verify + Deployment-Check Vercel
