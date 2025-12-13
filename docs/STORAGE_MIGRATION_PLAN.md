# 🚀 HeyHi Storage & Auth Migration Plan

**Datum:** 2025-12-09  
**Ziel:** Migration von LocalStorage zu einer datenschutzsicheren Lösung + Privacy-First Login für Power-User

---

## 📊 IST-Analyse

### Aktuelle LocalStorage Nutzung

Das Projekt nutzt aktuell `localStorage` für:

1. **Chat-Daten:**
   - Konversationen und Nachrichten (via `useLocalStorageState`)
   - Conversation History
   - Temporäre Sidebar-Preloads

2. **UI-Präferenzen:**
   - Sidebar-Zustand (`sidebarExpanded`)
   - Benutzername (`userDisplayName`)
   - Sprache (`language`)
   - Theme-Einstellungen

3. **Tool-Daten:**
   - Image Generation History (`IMAGE_HISTORY_KEY`)

**Probleme der aktuellen Lösung:**
- ❌ Keine Synchronisation zwischen Geräten
- ❌ Daten beim Löschen des Browsers verloren
- ❌ Keine Verschlüsselung sensibler Daten
- ❌ Kein Backup-Mechanismus
- ❌ Speicher-Limit (5-10MB)
- ❌ Keine Multi-User-Fähigkeit

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
- **Permanente Erinnerung**: AI merkt sich frühere Chats

### 3. Free-User Experience
- **Keine Anmeldung nötig**: Weiterhin anonyme Nutzung möglich
- **Lokale Speicherung**: Verbesserte Browser-Storage-Lösung
- **Seamless Upgrade**: Einfacher Übergang zu Power-User

---

## 🔐 Privacy-First Architektur (Alle Varianten)

### Verschlüsselungs-Konzept

```
User Device                    Server (HeyHi)
┌──────────────┐              ┌──────────────┐
│              │              │              │
│ Master Key   │─────X────────│   NO KEY!    │
│ (lokal nur)  │              │              │
│              │              │              │
│ Encrypted    │─────→────────│  Encrypted   │
│ Data         │              │  Blob only   │
│              │              │              │
└──────────────┘              └──────────────┘
```

**Prinzipien:**
1. **Master Key** wird nur client-side generiert & gespeichert
2. **Passwort-basierte Verschlüsselung** (PBKDF2 oder Argon2)
3. **AES-256-GCM** für Daten-Verschlüsselung
4. Server speichert nur verschlüsselte Blobs
5. Server kann NIEMALS entschlüsseln

---

## 📋 Variante A: IndexedDB + Optional Cloud Sync

### Konzept
**Hybrid-Ansatz**: Lokale IndexedDB als Basis + optionale E2E-verschlüsselte Cloud-Sync für eingeloggte User

### Architektur

```typescript
┌─────────────────────────────────────────────┐
│          Storage Architecture               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────┐    │
│  │ Free User    │      │ Power User  │    │
│  ├──────────────┤      ├─────────────┤    │
│  │ IndexedDB    │      │ IndexedDB   │    │
│  │ (local only) │      │ + Cloud Sync│    │
│  └──────────────┘      └─────────────┘    │
│                              │              │
│                              ▼              │
│                    ┌──────────────────┐    │
│                    │ E2E Encrypted    │    │
│                    │ Cloud Storage    │    │
│                    └──────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Dexie.js**: Moderne IndexedDB Wrapper
- **Web Crypto API**: Verschlüsselung
- **Firebase/Supabase**: Backend (nur verschlüsselte Blobs)
- **Service Worker**: Offline-First Support

### Implementation Steps

#### Phase 1: IndexedDB Migration (Woche 1-2)
```typescript
// 1. Dexie.js Setup
import Dexie from 'dexie';

class HeyHiDatabase extends Dexie {
  conversations!: Dexie.Table<Conversation, string>;
  messages!: Dexie.Table<Message, string>;
  userPreferences!: Dexie.Table<UserPreference, string>;
  imageHistory!: Dexie.Table<ImageHistoryItem, string>;
  
  constructor() {
    super('HeyHiDB');
    this.version(1).stores({
      conversations: '++id, userId, createdAt, updatedAt',
      messages: '++id, conversationId, timestamp',
      userPreferences: 'key, value',
      imageHistory: '++id, timestamp'
    });
  }
}

// 2. Migration von localStorage
async function migrateFromLocalStorage() {
  const db = new HeyHiDatabase();
  
  // Migrate conversations
  const conversations = getAllConversationsFromLocalStorage();
  await db.conversations.bulkAdd(conversations);
  
  // Migrate preferences
  const prefs = getAllPreferencesFromLocalStorage();
  await db.userPreferences.bulkAdd(prefs);
  
  // Clear old localStorage after successful migration
  localStorage.clear();
}
```

#### Phase 2: Encryption Layer (Woche 2-3)
```typescript
// Crypto Service
class CryptoService {
  private masterKey: CryptoKey | null = null;

  // Generate master key from password
  async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data
  async encrypt(data: any): Promise<EncryptedBlob> {
    if (!this.masterKey) throw new Error('No master key');
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encodedData
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  // Decrypt data
  async decrypt(blob: EncryptedBlob): Promise<any> {
    if (!this.masterKey) throw new Error('No master key');
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(blob.iv) },
      this.masterKey,
      new Uint8Array(blob.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

#### Phase 3: Cloud Sync (Woche 3-4)
```typescript
// Sync Service
class SyncService {
  private db: HeyHiDatabase;
  private crypto: CryptoService;
  private cloudProvider: CloudProvider; // Firebase/Supabase

  async syncToCloud() {
    // Get all conversations modified since last sync
    const conversations = await this.db.conversations
      .where('updatedAt')
      .above(this.lastSyncTimestamp)
      .toArray();

    // Encrypt each conversation
    const encrypted = await Promise.all(
      conversations.map(c => this.crypto.encrypt(c))
    );

    // Upload encrypted blobs
    await this.cloudProvider.upload(encrypted);
    
    // Update sync timestamp
    this.lastSyncTimestamp = Date.now();
  }

  async syncFromCloud() {
    // Download encrypted blobs
    const encryptedBlobs = await this.cloudProvider.download();

    // Decrypt and store locally
    const decrypted = await Promise.all(
      encryptedBlobs.map(b => this.crypto.decrypt(b))
    );

    await this.db.conversations.bulkPut(decrypted);
  }
}
```

#### Phase 4: Authentication (Woche 4-5)
```typescript
// Minimal Auth für Power Users
interface PowerUserAuth {
  email: string;
  passwordHash: string; // Nur für Login, nicht für Verschlüsselung!
  encryptionSalt: Uint8Array; // Für Master Key Ableitung
  deviceId: string;
}

class AuthService {
  async registerPowerUser(email: string, password: string) {
    // 1. Hash password für Server-Auth (Argon2)
    const passwordHash = await this.hashPassword(password);
    
    // 2. Generate encryption salt
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    
    // 3. Derive master key (stays local!)
    const masterKey = await cryptoService.generateKey(password, salt);
    
    // 4. Store encrypted salt on server
    const encryptedSalt = await this.encryptSaltForServer(salt);
    
    // 5. Register with server
    await this.cloudProvider.register({
      email,
      passwordHash,
      encryptedSalt,
      deviceId: this.getDeviceId()
    });
    
    // 6. Store master key locally (IndexedDB non-extractable)
    await this.storeMasterKeyLocally(masterKey);
  }

  async loginPowerUser(email: string, password: string) {
    // 1. Authenticate with server
    const authToken = await this.cloudProvider.login(email, password);
    
    // 2. Fetch encrypted salt
    const encryptedSalt = await this.cloudProvider.getEncryptionSalt();
    
    // 3. Derive master key locally
    const masterKey = await cryptoService.generateKey(password, encryptedSalt);
    
    // 4. Try to decrypt a test blob to verify key
    const isValid = await this.verifyMasterKey(masterKey);
    
    if (isValid) {
      await this.storeMasterKeyLocally(masterKey);
      return authToken;
    } else {
      throw new Error('Invalid password');
    }
  }
}
```

### UI/UX Flow

```
┌─────────────────────────────────────────────┐
│        First-Time User Journey              │
├─────────────────────────────────────────────┤
│                                             │
│  1. User chats anonymously (IndexedDB)      │
│  2. Sees subtle "Unlock Power Features" CTA │
│  3. Clicks → Modal appears                  │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ 🚀 Upgrade to Power User           │     │
│  ├───────────────────────────────────┤     │
│  │                                   │     │
│  │ Get:                              │     │
│  │ ✓ Sync across devices             │     │
│  │ ✓ Unlimited context memory        │     │
│  │ ✓ Never lose conversations        │     │
│  │                                   │     │
│  │ Privacy:                          │     │
│  │ 🔒 End-to-end encrypted           │     │
│  │ 🔒 We can't read your chats       │     │
│  │ 🔒 Keys never leave your device   │     │
│  │                                   │     │
│  │ Email: [____________]             │     │
│  │ Password: [____________]          │     │
│  │                                   │     │
│  │ [Create Power Account]            │     │
│  └───────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### Vorteile ✅
- ✅ Beste Performance (lokales IndexedDB)
- ✅ Volle Offline-Funktionalität
- ✅ Schrittweise Migration möglich
- ✅ Zero-Knowledge für Power Users
- ✅ Free Users ohne Einschränkung
- ✅ Unbegrenzter lokaler Speicher
- ✅ Standard Web APIs (keine Vendor Lock-in)

### Nachteile ❌
- ❌ Komplexer als reine Cloud-Lösung
- ❌ Sync-Konflikte möglich
- ❌ Mehraufwand in Entwicklung
- ❌ Browser-spezifische Bugs möglich

### Kosten
- **Entwicklung:** ~4-6 Wochen
- **Infrastructure:** 
  - Firebase Free Tier: 0€ (bis 10k Users)
  - Supabase Free Tier: 0€ (500MB DB)

---

## 📋 Variante B: Reine Client-Side Encrypted Cloud

### Konzept
**Full-Cloud-Ansatz**: Alle Daten direkt in verschlüsseltem Cloud Storage, kein lokales IndexedDB (außer Cache)

### Architektur

```typescript
┌─────────────────────────────────────────────┐
│       Pure Cloud Architecture               │
├─────────────────────────────────────────────┤
│                                             │
│  Browser                   Cloud            │
│  ┌──────────┐             ┌──────────┐     │
│  │ Master   │             │Encrypted │     │
│  │ Key      │──encrypt──→ │Blobs     │     │
│  │ (memory) │             │          │     │
│  └──────────┘             └──────────┘     │
│       │                                     │
│       │ derive from                         │
│       │                                     │
│  ┌──────────┐             ┌──────────┐     │
│  │Password  │             │User      │     │
│  │          │──auth────→  │Account   │     │
│  └──────────┘             └──────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Supabase**: Backend & Auth
- **Web Crypto API**: Verschlüsselung
- **React Query**: Data Fetching & Caching
- **Service Worker**: Offline Queue

### Implementation Steps

#### Phase 1: Supabase Setup (Woche 1)
```typescript
// supabase/schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  encryption_salt_encrypted TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE encrypted_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  encrypted_blob TEXT NOT NULL, -- Base64 encoded
  iv TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE encrypted_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES encrypted_conversations(id),
  encrypted_blob TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE encrypted_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own conversations"
  ON encrypted_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own messages"
  ON encrypted_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM encrypted_conversations WHERE user_id = auth.uid()
    )
  );
```

#### Phase 2: E2E Encryption Service (Woche 1-2)
```typescript
// services/e2e-encryption.ts
class E2EEncryptionService {
  private masterKey: CryptoKey | null = null;

  async initializeFromPassword(password: string, salt: Uint8Array) {
    this.masterKey = await this.deriveKey(password, salt);
  }

  async encryptConversation(conversation: Conversation): Promise<EncryptedBlob> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(conversation));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey!,
      data
    );

    return {
      blob: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async decryptConversation(encrypted: EncryptedBlob): Promise<Conversation> {
    const data = Uint8Array.from(atob(encrypted.blob), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.masterKey!,
      data
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

#### Phase 3: React Query Integration (Woche 2-3)
```typescript
// hooks/useEncryptedConversations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEncryptedConversations() {
  const encryption = useE2EEncryption();
  const supabase = useSupabase();

  // Fetch & decrypt
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('encrypted_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      // Decrypt all
      return Promise.all(
        data.map(enc => encryption.decryptConversation(enc))
      );
    },
    staleTime: 30000, // Cache for 30s
  });

  // Create encrypted conversation
  const createMutation = useMutation({
    mutationFn: async (conversation: Conversation) => {
      // Encrypt
      const encrypted = await encryption.encryptConversation(conversation);
      
      // Upload
      const { data } = await supabase
        .from('encrypted_conversations')
        .insert({
          encrypted_blob: encrypted.blob,
          iv: encrypted.iv
        })
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    }
  });

  return { conversations, createConversation: createMutation.mutate };
}
```

#### Phase 4: Free User Fallback (Woche 3)
```typescript
// Für nicht-eingeloggte User: localStorage als Fallback
function useHybridStorage() {
  const { user } = useAuth();
  
  // Power User: encrypted cloud
  const cloudStorage = useEncryptedConversations();
  
  // Free User: localStorage
  const localStorage = useLocalStorageState('conversations', []);

  return user ? cloudStorage : localStorage;
}
```

### Vorteile ✅
- ✅ Einfachste Architektur
- ✅ Keine Sync-Konflikte
- ✅ Automatisches Backup
- ✅ Zugriff von überall
- ✅ Zero-Knowledge Architecture
- ✅ Supabase RLS für Security

### Nachteile ❌
- ❌ Abhängigkeit von Internet
- ❌ Latenz bei jedem Request
- ❌ Supabase Vendor Lock-in
- ❌ Kosten bei vielen Usern
- ❌ Keine Offline-Erstellung (nur Queue)

### Kosten
- **Entwicklung:** ~3-4 Wochen
- **Infrastructure:**
  - Supabase Free: 0€ (500MB, 50k requests/month)
  - Supabase Pro: 25€/Monat (unlimited)

---

## 📋 Variante C: Hybrid CRDT mit Local-First

### Konzept
**Cutting-Edge-Ansatz**: Conflict-free Replicated Data Types (CRDT) für echte Peer-to-Peer Sync + optional selbst-gehosteter Relay-Server

### Architektur

```typescript
┌─────────────────────────────────────────────┐
│         Local-First CRDT                    │
├─────────────────────────────────────────────┤
│                                             │
│  Device 1        Relay Server    Device 2  │
│  ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │ IndexedDB│   │ Optional │   │IndexedDB│ │
│  │ + CRDT   │←─→│ Relay    │←─→│+ CRDT  │ │
│  │          │   │ (E2E enc)│   │        │ │
│  └──────────┘   └──────────┘   └────────┘ │
│                                             │
│  Eventual Consistency                       │
│  No Conflicts Ever!                         │
│                                             │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Automerge**: CRDT Library
- **IndexedDB**: Lokale Persistenz
- **WebRTC**: P2P Sync (optional)
- **Simple Relay**: WebSocket Server (minimal)

### Implementation Steps

#### Phase 1: Automerge Setup (Woche 1-2)
```typescript
import * as Automerge from '@automerge/automerge';
import { IndexeddbPersistence } from '@automerge/automerge-repo-storage-indexeddb';
import { Repo } from '@automerge/automerge-repo';

// Initialize Automerge Repo
const repo = new Repo({
  storage: new IndexeddbPersistence(),
  network: [], // Add network adapters later
});

// Define Document Types
type ConversationDoc = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

// Create conversation
const handle = repo.create<ConversationDoc>();
handle.change(doc => {
  doc.id = generateId();
  doc.title = 'New Chat';
  doc.messages = [];
  doc.createdAt = Date.now();
});

// Changes sync automatically!
```

#### Phase 2: E2E Encrypted Network Layer (Woche 2-3)
```typescript
// Custom encrypted network adapter
class E2EEncryptedNetworkAdapter {
  private masterKey: CryptoKey;
  private ws: WebSocket;

  async sendSyncMessage(docId: string, changes: Uint8Array) {
    // Encrypt changes
    const encrypted = await this.encrypt(changes);
    
    // Send to relay
    this.ws.send(JSON.stringify({
      type: 'sync',
      docId,
      encrypted
    }));
  }

  async receiveSyncMessage(message: EncryptedSyncMessage) {
    // Decrypt changes
    const changes = await this.decrypt(message.encrypted);
    
    // Apply to local Automerge doc
    this.repo.applyChanges(message.docId, changes);
  }
}

// Add to repo
repo.networkSubsystem.addNetworkAdapter(
  new E2EEncryptedNetworkAdapter(masterKey)
);
```

#### Phase 3: Minimal Relay Server (Woche 3)
```typescript
// relay-server/index.ts (Deno/Node.js)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Simple message relay - no decryption!
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Forward encrypted blob to all peers in room
    const room = rooms.get(msg.docId) || new Set();
    room.forEach(peer => {
      if (peer !== ws) {
        peer.send(data); // Forward as-is (encrypted!)
      }
    });
    
    room.add(ws);
    rooms.set(msg.docId, room);
  });
});
```

#### Phase 4: React Integration (Woche 4)
```typescript
// hooks/useAutomergeConversation.ts
import { useDocument } from '@automerge/automerge-repo-react-hooks';

export function useConversation(docId: string) {
  const [doc, changeDoc] = useDocument<ConversationDoc>(docId);

  const addMessage = (content: string) => {
    changeDoc(d => {
      d.messages.push({
        id: generateId(),
        content,
        timestamp: Date.now()
      });
      d.updatedAt = Date.now();
    });
    // Automatically syncs to all devices!
  };

  return { conversation: doc, addMessage };
}
```

### Vorteile ✅
- ✅ **Echtes Local-First**: Funktioniert komplett offline
- ✅ **Keine Konflikte**: CRDT löst alles automatisch
- ✅ **P2P möglich**: Direkte Geräte-Sync ohne Server
- ✅ **Minimal Server**: Relay braucht kaum Ressourcen
- ✅ **Zero-Knowledge**: Server sieht nur verschlüsselte Blobs
- ✅ **Selbst-hostbar**: Volle Kontrolle möglich
- ✅ **Cutting-Edge Tech**: Zukunftssicher

### Nachteile ❌
- ❌ **Komplexeste Lösung**: Steile Lernkurve
- ❌ **Neue Technologie**: Weniger battle-tested
- ❌ **Bundle Size**: Automerge ist ~200KB
- ❌ **Weniger Tooling**: Nicht so ausgereift wie Supabase
- ❌ **Debugging schwierig**: CRDT-Konflikte verstehen

### Kosten
- **Entwicklung:** ~5-7 Wochen
- **Infrastructure:**
  - Relay Server: ~5€/Monat (Hetzner Cloud)
  - Oder selbst-hosten: 0€

---

## 📊 Vergleichstabelle

| Feature | Variante A<br>(IndexedDB + Cloud) | Variante B<br>(Pure Cloud) | Variante C<br>(CRDT Local-First) |
|---------|-----------|-------------|--------------|
| **Offline-First** | ✅ Vollständig | ⚠️ Queue only | ✅ Vollständig |
| **Entwicklungszeit** | 4-6 Wochen | 3-4 Wochen | 5-7 Wochen |
| **Komplexität** | Mittel | Niedrig | Hoch |
| **Zero-Knowledge** | ✅ Ja | ✅ Ja | ✅ Ja |
| **Sync-Konflikte** | ⚠️ Möglich | ⚠️ Möglich | ✅ Unmöglich (CRDT) |
| **Performance** | ✅ Exzellent | ⚠️ Netzwerk-abhängig | ✅ Exzellent |
| **Kosten @ 1k Users** | ~0-10€/Monat | ~25€/Monat | ~5€/Monat |
| **Kosten @ 10k Users** | ~50€/Monat | ~100€/Monat | ~10€/Monat |
| **Self-Hosting** | ⚠️ Möglich | ❌ Vendor Lock-in | ✅ Einfach |
| **Battle-Tested** | ✅ Ja | ✅ Ja | ⚠️ Neu |
| **Bundle Size** | ~50KB | ~30KB | ~200KB |
| **Free User Support** | ✅ Nahtlos | ✅ Nahtlos | ✅ Nahtlos |
| **P2P Sync** | ❌ Nein | ❌ Nein | ✅ Möglich |

---

## 🎯 Empfehlung

### **WINNER: Variante A (IndexedDB + Optional Cloud Sync)**

**Begründung:**
1. **Beste Balance** zwischen Features, Komplexität und Kosten
2. **Zukunftssicher**: Kann später zu Variante C migriert werden
3. **Free Users** bekommen volle Offline-Funktionalität
4. **Power Users** bekommen Zero-Knowledge Cloud-Sync
5. **Schrittweise Migration**: Kann in Phasen ausgerollt werden

### Implementierungsplan (Variante A)

**Sprint 1 (Woche 1-2): IndexedDB Foundation**
- [ ] Dexie.js Setup & Schema
- [ ] Migration Script von localStorage → IndexedDB
- [ ] Neue `useIndexedDBState` Hook
- [ ] AB-Test: 10% User auf IndexedDB
- [ ] Monitoring & Rollback-Plan

**Sprint 2 (Woche 2-3): Encryption Layer**
- [ ] Web Crypto Service Implementation
- [ ] Master Key Management (IndexedDB non-extractable)
- [ ] Encryption Performance Tests
- [ ] Security Audit (intern)

**Sprint 3 (Woche 3-4): Cloud Sync (Read-Only)**
- [ ] Firebase/Supabase Setup
- [ ] Upload verschlüsselter Conversations
- [ ] Download & Merge Logic
- [ ] Conflict Resolution UI

**Sprint 4 (Woche 4-5): Authentication**
- [ ] Power User Registration Flow
- [ ] Login/Logout Flow
- [ ] "Upgrade to Power" CTA im UI
- [ ] Email Verification

**Sprint 5 (Woche 5-6): Polish & Launch**
- [ ] Sync Status Indicator
- [ ] Offline Mode Indicator
- [ ] Migration Tool für bestehende User
- [ ] Dokumentation & FAQ
- [ ] Beta Launch mit 100 Power Users

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
  
  // 4. Open Source Crypto
  cryptoLibrary: 'web-crypto-api' | 'auditable';
}
```

### Marketing Message

```
┌─────────────────────────────────────────────┐
│   🔒 HeyHi Privacy-First Promise 🔒         │
├─────────────────────────────────────────────┤
│                                             │
│  "Was du chattest, bleibt deins."          │
│                                             │
│  ✓ Wir können deine Chats NICHT lesen      │
│  ✓ Deine Schlüssel verlassen nie dein Gerät│
│  ✓ End-to-End Verschlüsselung               │
│  ✓ Open Source Crypto (auditierbar)        │
│                                             │
│  Auch als Betreiber können wir nicht       │
│  auf deine Nachrichten zugreifen.          │
│                                             │
│  [Mehr erfahren] [Source Code]             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 Power-User Features

### Kontext & Erinnerung

```typescript
// Unbegrenzter Kontext für Power Users
interface PowerUserFeatures {
  // 1. Gesamter Chat-History verfügbar
  contextWindow: 'unlimited';
  
  // 2. Semantic Search über alle Chats
  searchFeatures: {
    fullTextSearch: true,
    semanticSearch: true, // Vector DB
    crossConversation: true
  };
  
  // 3. AI "Erinnerung"
  aiMemory: {
    persistentContext: true,
    userPreferences: true,
    learningEnabled: true,
    exampleQuery: "Erinnerst du dich an das Projekt von letzter Woche?"
  };
  
  // 4. Export & Backup
  dataPortability: {
    exportFormat: ['JSON', 'Markdown', 'PDF'],
    automaticBackup: true,
    downloadAnytime: true
  };
}
```

### UI für Power Features

```tsx
// PowerUserBadge.tsx
export function PowerUserBadge() {
  const { isPowerUser } = useAuth();
  
  if (!isPowerUser) return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
      <Zap className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-medium">Power</span>
      <Badge variant="secondary" className="text-xs">
        {conversationCount} Memories
      </Badge>
    </div>
  );
}

// UpgradeCTA.tsx - Subtil aber effektiv
export function UpgradeCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-8 max-w-sm"
    >
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-pink-900/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">
            🧠 Unlock Infinite Memory
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Power Users get unlimited context across all chats, 
            synced securely across devices.
          </p>
          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Remember everything forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Sync across all devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
          <Button className="w-full" onClick={showUpgradeModal}>
            Become Power User
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

## 🔄 Migration Strategy

### Für bestehende User

```typescript
// Migration Wizard
interface MigrationStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

const migrationSteps: MigrationStep[] = [
  {
    id: 'backup',
    title: 'Backup erstellen (localStorage → Download)'
  },
  {
    id: 'indexeddb',
    title: 'Daten nach IndexedDB migrieren'
  },
  {
    id: 'verify',
    title: 'Integrität überprüfen'
  },
  {
    id: 'cleanup',
    title: 'Alte Daten aufräumen'
  }
];

// Automatische Migration beim ersten Laden
export function useMigrationWizard() {
  useEffect(() => {
    const hasLegacyData = checkForLegacyLocalStorage();
    
    if (hasLegacyData) {
      // Show migration modal
      showMigrationWizard();
    }
  }, []);

  async function migrateLegacyData() {
    try {
      // Step 1: Backup
      const backup = createBackupFromLocalStorage();
      downloadBackup(backup);
      
      // Step 2: Migrate to IndexedDB
      await migrateToIndexedDB(backup);
      
      // Step 3: Verify
      const isValid = await verifyMigration();
      if (!isValid) throw new Error('Verification failed');
      
      // Step 4: Cleanup
      localStorage.clear();
      
      toast.success('Migration erfolgreich! ✅');
    } catch (error) {
      toast.error('Migration fehlgeschlagen. Deine Daten sind sicher im Backup.');
    }
  }
}
```

---

## 📈 Success Metrics

### KPIs für Feature-Launch

```typescript
interface LaunchMetrics {
  // Adoption
  powerUserConversionRate: number; // Target: >5%
  migrationSuccessRate: number; // Target: >99%
  
  // Performance
  averageLoadTime: number; // Target: <100ms (IndexedDB)
  syncLatency: number; // Target: <500ms (Cloud)
  
  // Retention
  day7Retention: number; // Power Users
  day30Retention: number;
  
  // Privacy (Monitoring ohne Inhalt!)
  encryptionFailureRate: number; // Target: 0%
  dataLeakIncidents: number; // Target: 0 (obviously!)
  
  // User Satisfaction
  nps: number; // Net Promoter Score
  supportTickets: number; // Related to sync/encryption
}
```

---

## 🛠 Nächste Schritte

### Immediate Actions (Diese Woche)

1. **Decision Meeting** (2h)
   - Team-Review dieses Plans
   - Variante wählen (Empfehlung: A)
   - Timeline committen

2. **Spike: IndexedDB** (1 Tag)
   - Proof-of-Concept mit Dexie.js
   - Performance Tests
   - Migration Script Prototype

3. **Spike: Encryption** (1 Tag)
   - Web Crypto API Tests
   - Key Derivation Performance
   - Verschlüsselungs-Overhead messen

4. **Architecture Review** (1h)
   - Security Audit (intern oder extern?)
   - Compliance Check (DSGVO)
   - Infrastructure Sizing

### Phase 1 Start (Nächste Woche)

- [ ] Ticket Creation im Backlog
- [ ] Dexie.js Installation
- [ ] DB Schema Design
- [ ] Migration Script v1
- [ ] Feature Flag Setup (`enable_indexeddb`)

---

## 💭 Offene Fragen

1. **Free vs. Power User Split:**
   - Sollen Free Users zeitlich limitiert werden?
   - Oder nur Feature-limitiert (kein Sync)?
   - **Empfehlung:** Kein Time-Limit, nur Sync als Unterscheidung

2. **Preismodell Power User:**
   - Komplett kostenlos (als USP)?
   - Symbolischer Betrag (z.B. 2€/Monat)?
   - **Empfehlung:** Erstmal kostenlos für Beta, dann 1-2€/Monat

3. **Backend Choice:**
   - Firebase (einfacher, teurer)
   - Supabase (Open Source, selbst-hostbar)
   - **Empfehlung:** Supabase für Flexibilität

4. **Audit:**
   - Professionelles Security Audit?
   - **Empfehlung:** Ja, nach Phase 2 (Encryption)

---

## 📚 Appendix

### Inspirations & References

- **Signal Protocol**: E2E Encryption Architecture
- **Obsidian Sync**: Local-First with Cloud Backup
- **Notion**: Seamless Sync UX
- **Standard Notes**: Zero-Knowledge Notes App
- **LobeChat**: AI Chat with local/cloud storage

### Libraries & Tools

```json
{
  "storage": {
    "dexie": "^4.0.0",
    "@automerge/automerge": "^2.0.0" // Für Variante C
  },
  "crypto": {
    "web-crypto-api": "native" // Kein Package nötig
  },
  "backend": {
    "@supabase/supabase-js": "^2.0.0",
    "firebase": "^10.0.0" // Alternative
  },
  "sync": {
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Security Checklist

- [ ] Master Key niemals auf Server
- [ ] Passwort ≠ Encryption Key
- [ ] Salt pro User (zufällig generiert)
- [ ] AES-256-GCM für Verschlüsselung
- [ ] PBKDF2 oder Argon2 für Key Derivation
- [ ] IV (Initialization Vector) für jede Nachricht unique
- [ ] Server kann nur Metadaten sehen (timestamp, size, userId)
- [ ] Row Level Security (RLS) in Datenbank
- [ ] Rate Limiting für API
- [ ] Security Headers (CSP, HSTS, etc.)
- [ ] Regular Security Audits
- [ ] Responsible Disclosure Policy

---

**Ende des Plans. Ready to implement! 🚀**

*Let me know which variant you prefer and I'll create detailed implementation tickets.*
