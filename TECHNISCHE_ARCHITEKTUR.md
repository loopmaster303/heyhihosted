# HeyHi Technische Architektur

## Systemübersicht

```mermaid
graph TB
    subgraph "Client-Seite"
        UI[React UI Komponenten]
        State[ChatProvider Context]
        Local[LocalStorage]
        Hooks[Custom Hooks]
    end
    
    subgraph "Next.js Backend"
        API[API Routen]
        Auth[Authentifizierungs-Middleware]
        Upload[Datei-Upload Handler]
    end
    
    subgraph "Externe Services"
        Pollinations[Pollinations API]
        Replicate[Replicate API]
        VercelBlob[Vercel Blob Storage]
    end
    
    UI --> State
    State --> Local
    State --> Hooks
    UI --> API
    API --> Auth
    API --> Pollinations
    API --> Replicate
    Upload --> VercelBlob
    Hooks --> Local
```

## Komponentenarchitektur

```mermaid
graph TD
    subgraph "Layout Komponenten"
        AppLayout[AppLayout]
        Sidebar[AppSidebar]
        Theme[ThemeProvider]
        Lang[LanguageProvider]
    end
    
    subgraph "Seiten Komponenten"
        Entry[EntryDraftPage]
        Chat[ChatInterface]
        Visualize[VisualizeProPage]
        Settings[SettingsPage]
    end
    
    subgraph "Funktions Komponenten"
        ChatView[ChatView]
        ChatInput[ChatInput]
        ImageTool[UnifiedImageTool]
        Personalization[PersonalizationTool]
        Welcome[WelcomeScreen]
    end
    
    subgraph "UI Komponenten"
        Button[Button]
        Input[Input]
        Select[Select]
        Card[Card]
        Modal[Modal Komponenten]
    end
    
    AppLayout --> Sidebar
    AppLayout --> Theme
    AppLayout --> Lang
    
    Entry --> Welcome
    Chat --> ChatView
    Chat --> ChatInput
    Visualize --> ImageTool
    Settings --> Personalization
    
    ChatView --> Modal
    ChatInput --> Button
    ChatInput --> Input
    ImageTool --> Select
    ImageTool --> Card
    ImageTool --> Modal
```

## Datenflussarchitektur

```mermaid
sequenceDiagram
    participant Benutzer
    participant UI
    participant ChatProvider
    participant API
    participant ExterneAPI
    
    Benutzer->>UI: Nachricht senden
    UI->>ChatProvider: sendMessage()
    ChatProvider->>API: POST /api/chat/completion
    API->>ExterneAPI: Anfrage an Pollinations/Replicate
    ExterneAPI-->>API: Antwort (Streaming)
    API-->>ChatProvider: Stream Antwort
    ChatProvider-->>UI: Zustand aktualisieren
    UI-->>Benutzer: Antwort anzeigen
```

## State Management Flow

```mermaid
graph LR
    subgraph "State Quellen"
        Benutzereingabe[Benutzereingabe]
        APIAntworten[API Antworten]
        LocalStorage[LocalStorage]
        Dateiuploads[Datei-Uploads]
    end
    
    subgraph "State Management"
        ChatProvider[ChatProvider]
        Hooks[Custom Hooks]
        Reduzierer[State Reduzierer]
    end
    
    subgraph "State Verbraucher"
        Komponenten[UI Komponenten]
        Seiteneffekte[Side Effects]
        Persistenz[Data Persistenz]
    end
    
    Benutzereingabe --> ChatProvider
    APIAntworten --> ChatProvider
    LocalStorage --> Hooks
    Dateiuploads --> ChatProvider
    
    ChatProvider --> Hooks
    Hooks --> Reduzierer
    
    Reduzierer --> Komponenten
    Reduzierer --> Seiteneffekte
    Reduzierer --> Persistenz
```

## API-Architektur

```mermaid
graph TB
    subgraph "Client"
        Frontend[React Frontend]
    end
    
    subgraph "Next.js API Routen"
        ChatAPI[/api/chat/completion]
        BildAPI[/api/generate]
        ReplicateAPI[/api/replicate]
        UploadAPI[/api/upload]
        TitelAPI[/api/chat/title]
        STTAPI[/api/stt]
        TTSAPI[/api/tts]
    end
    
    subgraph "Externe APIs"
        PollinationsChat[Pollinations Chat]
        PollinationsBild[Pollinations Bild]
        ReplicateModelle[Replicate Modelle]
    end
    
    subgraph "Speicher"
        BlobStorage[Vercel Blob Storage]
    end
    
    Frontend --> ChatAPI
    Frontend --> BildAPI
    Frontend --> ReplicateAPI
    Frontend --> UploadAPI
    Frontend --> TitelAPI
    Frontend --> STTAPI
    Frontend --> TTSAPI
    
    ChatAPI --> PollinationsChat
    BildAPI --> PollinationsBild
    ReplicateAPI --> ReplicateModelle
    UploadAPI --> BlobStorage
    
    ChatAPI --> TitelAPI
    STTAPI --> PollinationsChat
    TTSAPI --> PollinationsChat
```

## Modellintegrationsarchitektur

```mermaid
graph TD
    subgraph "Modell Registry"
        UnifiedRegistry[Unified Model Registry]
        ModellConfigs[Modell Konfigurationen]
        ProviderMapping[Provider Mapping]
    end
    
    subgraph "Modell Provider"
        PollinationsProvider[Pollinations Provider]
        ReplicateProvider[Replicate Provider]
    end
    
    subgraph "Modell Typen"
        TextModelle[Text Modelle]
        BildModelle[Bild Modelle]
        VideoModelle[Video Modelle]
    end
    
    subgraph "Modell Features"
        KostenloseModelle[Kostenlose Modelle]
        PremiumModelle[Premium Modelle]
        Referenzunterstützung[Referenz Bild Unterstützung]
    end
    
    UnifiedRegistry --> ModellConfigs
    UnifiedRegistry --> ProviderMapping
    
    ProviderMapping --> PollinationsProvider
    ProviderMapping --> ReplicateProvider
    
    ModellConfigs --> TextModelle
    ModellConfigs --> BildModelle
    ModellConfigs --> VideoModelle
    
    TextModelle --> KostenloseModelle
    BildModelle --> KostenloseModelle
    BildModelle --> PremiumModelle
    VideoModelle --> PremiumModelle
    
    BildModelle --> Referenzunterstützung
    VideoModelle --> Referenzunterstützung
```

## Datei-Upload & Speicherarchitektur

```mermaid
graph LR
    subgraph "Client-Seite"
        Dateieingabe[Datei Eingabe Komponente]
        Bildvorschau[Bildvorschau]
        Validierung[Datei-Validierung]
    end
    
    subgraph "Upload Prozess"
        FormData[FormData Erstellung]
        UploadAPI[Upload API Route]
        FortschrittVerfolgung[Upload Fortschritt]
    end
    
    subgraph "Speicher Backend"
        VercelBlob[Vercel Blob Storage]
        URLGenerierung[URL Generierung]
        Aufräumprozess[Aufräumprozess]
    end
    
    subgraph "Speicher Frontend"
        LocalStorage[LocalStorage Cache]
        Verlaufsverwaltung[Verlaufsverwaltung]
        Referenzhandling[Referenz Bild Handling]
    end
    
    Dateieingabe --> Validierung
    Validierung --> Bildvorschau
    Validierung --> FormData
    FormData --> UploadAPI
    UploadAPI --> FortschrittVerfolgung
    UploadAPI --> VercelBlob
    VercelBlob --> URLGenerierung
    URLGenerierung --> LocalStorage
    LocalStorage --> Verlaufsverwaltung
    LocalStorage --> Referenzhandling
    VercelBlob --> Aufräumprozess
```

## Authentifizierung & Sicherheitsarchitektur

```mermaid
graph TB
    subgraph "Client-Seite"
        Benutzereingabe[Benutzereingabe]
        Passwortfeld[Passwortfeld]
        TokenSpeicherung[Token Speicherung]
    end
    
    subgraph "Sicherheitsschicht"
        Eingabevalidierung[Eingabevalidierung]
        Bereinigung[Datenbereinigung]
        Ratenbegrenzung[Ratenbegrenzung]
    end
    
    subgraph "Authentifizierung"
        Passwortprüfung[Passwortvalidierung]
        Umgebungsvariablen[Umgebungsvariablen]
        APISchlüsselVerwaltung[API Schlüssel Verwaltung]
    end
    
    subgraph "Externe API Sicherheit"
        ReplicateAuth[Replicate Authentifizierung]
        PollinationsAuth[Pollinations Authentifizierung]
        SichereHeader[Sichere Header]
    end
    
    Benutzereingabe --> Eingabevalidierung
    Passwortfeld --> Passwortprüfung
    Eingabevalidierung --> Bereinigung
    Bereinigung --> Ratenbegrenzung
    
    Passwortprüfung --> Umgebungsvariablen
    Umgebungsvariablen --> APISchlüsselVerwaltung
    
    APISchlüsselVerwaltung --> ReplicateAuth
    APISchlüsselVerwaltung --> PollinationsAuth
    ReplicateAuth --> SichereHeader
    PollinationsAuth --> SichereHeader