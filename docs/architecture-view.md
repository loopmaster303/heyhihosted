# HeyHi Technical Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "Client Side"
        UI[React UI Components]
        State[ChatProvider Context]
        Local[IndexedDB & LocalStorage]
        Hooks[Custom Hooks]
    end
    
    subgraph "Next.js Backend"
        API[API Routes]
        Auth[Authentication Middleware]
        Upload[File Handler]
    end
    
    subgraph "External Services"
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

## Component Architecture

```mermaid
graph TD
    subgraph "Layout Components"
        AppLayout[AppLayout]
        Sidebar[AppSidebar]
        Theme[ThemeProvider]
        Lang[LanguageProvider]
    end
    
    subgraph "Page Routes"
        Home[/unified]
        Settings[/settings]
        About[/about]
    end
    
    subgraph "Feature Components"
        Landing[LandingView]
        Chat[ChatInterface]
        ImageTool[UnifiedImageTool]
        Personalization[PersonalizationTool]
    end
    
    Home --> Landing
    Home --> Chat
    Landing --> ImageTool
    Chat --> ImageTool
    Settings --> Personalization
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant ChatProvider
    participant API
    participant ExternalAPI
    
    User->>UI: Send Message
    UI->>ChatProvider: sendMessage()
    ChatProvider->>API: POST /api/chat/completion
    API->>ExternalAPI: Request to Pollinations/Replicate
    ExternalAPI-->>API: Response (Streaming)
    API-->>ChatProvider: Stream Response
    ChatProvider->>IndexedDB: Save Conversation
    ChatProvider-->>UI: Update State
    UI-->>User: Display Response
```

## State Management Flow

```mermaid
graph LR
    subgraph "State Sources"
        UserInput[User Input]
        APIResponses[API Responses]
        IndexedDB[IndexedDB]
        LocalStorage[LocalStorage]
    end
    
    subgraph "State Management"
        ChatProvider[ChatProvider]
        Hooks[Custom Hooks]
    end
    
    UserInput --> ChatProvider
    APIResponses --> ChatProvider
    IndexedDB --> ChatProvider
    LocalStorage --> Hooks
    
    ChatProvider --> Hooks
    Hooks --> UI
```

## Storage Architecture

```mermaid
graph LR
    subgraph "Browser Storage"
        IDB[(IndexedDB)]
        LS[(LocalStorage)]
    end
    
    IDB -- "Full Chat Objects" --> ChatProvider
    LS -- "UI Prefs & System Prompts" --> Hooks
    
    subgraph "Asset Storage"
        VercelBlob[Vercel Blob]
    end
    
    API -- "Upload Media" --> VercelBlob
    VercelBlob -- "Public URL" --> IDB