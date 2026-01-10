# 🚀 HeyHi Storage & Auth Migration Plan

**Datum:** 2025-12-09  
**Ziel:** Migration von LocalStorage zu einer datenschutzsicheren Lösung + Privacy-First Login für Power-User

**Status Note (2026-01-10):** ✅ **PHASE 1 COMPLETE.**
- IndexedDB (Dexie) implementation is live (v3 schema).
- Conversations, Messages, and Assets are fully migrated to local DB.
- Hybrid Asset Storage (S3 + Local Blobs) is active.
- **Next Up**: Phase 2 (Encryption Layer) and Phase 3 (Optional Cloud Sync).

---

## 📊 IST-Analyse (Updated Jan 2026)

### Aktuelle Nutzung (Post-Migration)

Das Projekt nutzt aktuell **IndexedDB (Dexie)** für:

1.  **Chat-Daten:**
    -   `conversations` Tabelle: Metadaten
    -   `messages` Tabelle: Inhalte
    -   `assets` Tabelle: Binäre Blobs (Bilder/Audio)

2.  **LocalStorage (Legacy/Prefs):**
    -   UI-Präferenzen (Sidebar, Theme, Sprache)
    -   User Identity (DisplayName)

**Verbleibende Challenges:**
-   Daten liegen unverschlüsselt in IndexedDB (Browser-Zugriff möglich).
-   Kein Cross-Device Sync.

---

## 🎯 Ziele der Migration

### 1. Datenschutz & Privacy-First
- **Zero-Knowledge Architecture**: Betreiber kann KEINE Inhalte lesen
- **End-to-End Encryption**: Alle sensiblen Daten verschlüsselt
- **Client-Side nur**: Schlüssel bleiben auf dem User-Gerät

### 2. Power-User Features
- **Optionaler Login**: Nur für User die erweiterten Kontext wollen
- **Cross-Device Sync**: Konversationen über Geräte hinweg
- **Unbegrenzter Context**: "Geisteskranker" langer Kontext-Speicher

---

## 📋 Variante A: IndexedDB + Optional Cloud Sync (CHOSEN PATH)

### Tech Stack Implementation Status

- **Dexie.js**: ✅ Implemented (v3 Schema)
- **Web Crypto API**: ⏳ Scheduled for Phase 2
- **Supabase**: ⏳ Scheduled for Phase 3

### Implementation Steps

#### Phase 1: IndexedDB Migration (COMPLETED)
- ✅ Dexie.js Setup (`src/lib/services/database.ts`)
- ✅ Schema Definition (Conversations, Messages, Assets)
- ✅ Hook Integration (`useChatPersistence`)
- ✅ Asset Handling (Blob Storage)

#### Phase 2: Encryption Layer (Next)
**Ziel:** Verschlüsselung der `messages` und `assets` Tabellen-Inhalte "at rest".

```typescript
// Proposed Crypto Service Architecture
class EncryptionService {
  // Uses Web Crypto API to encrypt content before it hits Dexie
  async encryptPayload(content: string): Promise<string> {
    // AES-GCM encryption
  }
  
  async decryptPayload(encrypted: string): Promise<string> {
    // AES-GCM decryption
  }
}

// Integration into DatabaseService
// db.messages.add(encrypt(message))
```

#### Phase 3: Cloud Sync (Future)
**Ziel:** Verschlüsselte Blobs via Supabase synchronisieren.

---

## 🔒 Datenschutz-Garantien

### Technische Umsetzung

```typescript
// Garantierte Nicht-Lesbarkeit durch Betreiber
interface PrivacyGuarantees {
  // 1. Master Key niemals auf Server
  masterKey: 'client-only' | 'never-transmitted';
  
  // 2. Passwort nur für Auth, nicht für Verschlüsselung
  passwordUsage: {
    authentication: 'argon2-hashed',
    encryption: 'separate-salt-derived-key'
  };
  
  // 3. Server sieht nur Blobs
  serverKnowledge: {
    conversationContent: false,
    messageContent: false,
    userPreferences: false,
    onlyMetadata: ['userId', 'timestamp', 'blobSize']
  };
}
```

---

**Ende des Plans.**