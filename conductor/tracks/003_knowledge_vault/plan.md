# Plan: Personal Knowledge Base & "Playa" Memory

**Ziel**: Den "Assistant Computer" in ein echtes externes Gehirn verwandeln, das über alle Chats hinweg bescheid weiß und dem User ermöglicht, sein gesammeltes Wissen zu exportieren.

## 1. Anforderungen

### Cross-Chat Context (High Context)
- [ ] **Globaler Überblick**: Beim Start eines neuen Chats soll die AI alle bisherigen Chat-Überschriften lesen, um den Kontext des Users zu verstehen.
- [ ] **Smart Trigger**: Der globale Kontext wird nur bei der 1. Nachricht und danach alle 50 Nachrichten (oder bei Fragen wie "Erinnerst du dich...") aufgefrischt.
- [ ] **Bild-Metadaten**: Bilder in der IndexedDB sollen mit kurzen Beschreibungen versehen werden, damit die AI weiß, was sie "gesehen" hat.

### Knowledge Base & Export
- [ ] **Extraktions-Logik**: Verfeinerung des MemoryService, um widerspruchsfreie Fakten zu speichern.
- [ ] **Export-Tool**: Ein Button in der Personalisierung, um alle Chats + Memories als strukturiertes Markdown/JSON zu laden.
- [ ] **Import-Tool**: Bestehende Knowledge-Bases einlesen.

## 2. Technische Umsetzung
- **Speicher**: Dexie.js (Bereits integriert).
- **Injektion**: Dynamische System-Prompts im `ChatProvider`.
- **Anonymität**: Alle Daten bleiben lokal, bis der User den optionalen (anonymen) Sync aktiviert.

## 3. Nächste Schritte
1. [ ] Implementierung der `getGlobalContextSummary()` im MemoryService.
2. [ ] Integration der 50-Nachrichten-Logik im ChatProvider.
3. [ ] Bild-Storage-Optimierung (Dexie statt idb-keyval für bessere Verknüpfung).
