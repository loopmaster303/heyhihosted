# HeyHi Technical Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "Client Side"
        UI[React UI Components]
        State[ChatProvider Context]
        Local[LocalStorage]
        Hooks[Custom Hooks]
    end
    
    subgraph "Next.js Backend"
        API[API Routes]
        Auth[Authentication Middleware]
        Upload[File Upload Handler]
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
    
    subgraph "Page Components"
        Entry[EntryDraftPage]
        Chat[ChatInterface]
        Visualize[VisualizeProPage]
        Settings[SettingsPage]
    end
    
    subgraph "Feature Components"
        ChatView[ChatView]
        ChatInput[ChatInput]
        ImageTool[UnifiedImageTool]
        Personalization[PersonalizationTool]
        Welcome[WelcomeScreen]
    end
    
    subgraph "UI Components"
        Button[Button]
        Input[Input]
        Select[Select]
        Card[Card]
        Modal[Modal Components]
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
    ChatProvider-->>UI: Update State
    UI-->>User: Display Response
```

## State Management Flow

```mermaid
graph LR
    subgraph "State Sources"
        UserInput[User Input]
        APIResponses[API Responses]
        LocalStorage[LocalStorage]
        FileUploads[File Uploads]
    end
    
    subgraph "State Management"
        ChatProvider[ChatProvider]
        Hooks[Custom Hooks]
        Reducers[State Reducers]
    end
    
    subgraph "State Consumers"
        Components[UI Components]
        Effects[Side Effects]
        Persistence[Data Persistence]
    end
    
    UserInput --> ChatProvider
    APIResponses --> ChatProvider
    LocalStorage --> Hooks
    FileUploads --> ChatProvider
    
    ChatProvider --> Hooks
    Hooks --> Reducers
    
    Reducers --> Components
    Reducers --> Effects
    Reducers --> Persistence
```

## API Architecture

```mermaid
graph TB
    subgraph "Client"
        Frontend[React Frontend]
    end
    
    subgraph "Next.js API Routes"
        ChatAPI[/api/chat/completion]
        ImageAPI[/api/generate]
        ReplicateAPI[/api/replicate]
        UploadAPI[/api/upload]
        TitleAPI[/api/chat/title]
        STTAPI[/api/stt]
        TTSAPI[/api/tts]
    end
    
    subgraph "External APIs"
        PollinationsChat[Pollinations Chat]
        PollinationsImage[Pollinations Image]
        ReplicateModels[Replicate Models]
    end
    
    subgraph "Storage"
        BlobStorage[Vercel Blob Storage]
    end
    
    Frontend --> ChatAPI
    Frontend --> ImageAPI
    Frontend --> ReplicateAPI
    Frontend --> UploadAPI
    Frontend --> TitleAPI
    Frontend --> STTAPI
    Frontend --> TTSAPI
    
    ChatAPI --> PollinationsChat
    ImageAPI --> PollinationsImage
    ReplicateAPI --> ReplicateModels
    UploadAPI --> BlobStorage
    
    ChatAPI --> TitleAPI
    STTAPI --> PollinationsChat
    TTSAPI --> PollinationsChat
```

## Model Integration Architecture

```mermaid
graph TD
    subgraph "Model Registry"
        UnifiedRegistry[Unified Model Registry]
        ModelConfigs[Model Configurations]
        ProviderMapping[Provider Mapping]
    end
    
    subgraph "Model Providers"
        PollinationsProvider[Pollinations Provider]
        ReplicateProvider[Replicate Provider]
    end
    
    subgraph "Model Types"
        TextModels[Text Models]
        ImageModels[Image Models]
        VideoModels[Video Models]
    end
    
    subgraph "Model Features"
        FreeModels[Free Models]
        PremiumModels[Premium Models]
        ReferenceSupport[Reference Image Support]
    end
    
    UnifiedRegistry --> ModelConfigs
    UnifiedRegistry --> ProviderMapping
    
    ProviderMapping --> PollinationsProvider
    ProviderMapping --> ReplicateProvider
    
    ModelConfigs --> TextModels
    ModelConfigs --> ImageModels
    ModelConfigs --> VideoModels
    
    TextModels --> FreeModels
    ImageModels --> FreeModels
    ImageModels --> PremiumModels
    VideoModels --> PremiumModels
    
    ImageModels --> ReferenceSupport
    VideoModels --> ReferenceSupport
```

## File Upload & Storage Architecture

```mermaid
graph LR
    subgraph "Client Side"
        FileInput[File Input Component]
        ImagePreview[Image Preview]
        Validation[File Validation]
    end
    
    subgraph "Upload Process"
        FormData[FormData Creation]
        UploadAPI[Upload API Route]
        ProgressTracking[Upload Progress]
    end
    
    subgraph "Storage Backend"
        VercelBlob[Vercel Blob Storage]
        URLGeneration[URL Generation]
        CleanupProcess[Cleanup Process]
    end
    
    subgraph "Storage Frontend"
        LocalStorage[LocalStorage Cache]
        HistoryManagement[History Management]
        ReferenceHandling[Reference Image Handling]
    end
    
    FileInput --> Validation
    Validation --> ImagePreview
    Validation --> FormData
    FormData --> UploadAPI
    UploadAPI --> ProgressTracking
    UploadAPI --> VercelBlob
    VercelBlob --> URLGeneration
    URLGeneration --> LocalStorage
    LocalStorage --> HistoryManagement
    LocalStorage --> ReferenceHandling
    VercelBlob --> CleanupProcess
```

## Authentication & Security Architecture

```mermaid
graph TB
    subgraph "Client Side"
        UserInput[User Input]
        PasswordField[Password Field]
        TokenStorage[Token Storage]
    end
    
    subgraph "Security Layer"
        InputValidation[Input Validation]
        Sanitization[Data Sanitization]
        RateLimiting[Rate Limiting]
    end
    
    subgraph "Authentication"
        PasswordCheck[Password Validation]
        EnvVariables[Environment Variables]
        APIKeyManagement[API Key Management]
    end
    
    subgraph "External API Security"
        ReplicateAuth[Replicate Authentication]
        PollinationsAuth[Pollinations Authentication]
        SecureHeaders[Secure Headers]
    end
    
    UserInput --> InputValidation
    PasswordField --> PasswordCheck
    InputValidation --> Sanitization
    Sanitization --> RateLimiting
    
    PasswordCheck --> EnvVariables
    EnvVariables --> APIKeyManagement
    
    APIKeyManagement --> ReplicateAuth
    APIKeyManagement --> PollinationsAuth
    ReplicateAuth --> SecureHeaders
    PollinationsAuth --> SecureHeaders