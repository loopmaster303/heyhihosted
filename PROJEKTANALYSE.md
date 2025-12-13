# HeyHi Projektanalyse

## Projektübersicht

**HeyHi** ist eine moderne, multimodale KI-Anwendung, die mit Next.js 15 entwickelt wurde und Benutzern kostenlosen und kostenpflichtigen Zugang zu verschiedenen KI-Modellen für Texterstellung, Bilderzeugung und Videoerstellung bietet. Die Anwendung verfolgt die Philosophie "KI demokratisieren" und bietet sowohl kostenlose Pollinations-Modelle als auch Premium-Replicate-Modelle an.

## Kernarchitektur

### Technologiestack
- **Frontend**: Next.js 15 mit React 18, TypeScript
- **Styling**: Tailwind CSS mit Radix UI-Komponenten
- **State Management**: React Context (ChatProvider) mit localStorage-Persistenz
- **API-Routen**: Next.js API-Routen für Backend-Funktionalität
- **Externe APIs**: Pollinations (kostenlose Stufe) und Replicate (Premium-Stufe)
- **Speicher**: Vercel Blob für Datei-Uploads
- **Audio**: Web Speech API für STT/TTS-Funktionalität

### Anwendungsstruktur

```
src/
├── app/                    # Next.js App Router Seiten
│   ├── api/               # API-Routen für externe Integrationen
│   ├── chat/              # Chat-Interface Seite
│   ├── visualizepro/      # Bild/Video-Generierungs-Interface
│   └── settings/          # Benutzereinstellungen Seite
├── components/
│   ├── chat/              # Chat-bezogene Komponenten
│   ├── layout/            # Layout-Komponenten (AppLayout, AppSidebar)
│   ├── page/              # Seiten-Komponenten
│   ├── tools/             # KI-Tool-Komponenten (UnifiedImageTool)
│   └── ui/                # Wiederverwendbare UI-Komponenten
├── config/                # Konfigurationsdateien für Modelle und Optionen
├── hooks/                 # Custom React Hooks
├── lib/                   # Utility-Funktionen und Services
└── types/                 # TypeScript-Typdefinitionen
```

## Hauptfunktionen

### 1. Multimodales Chat-Interface
- **Text-Chat**: Integration mit verschiedenen Sprachmodellen über Pollinations
- **Bildgenerierung**: Unterstützung für verschiedene Bildgenerierungsmodelle
- **Videogenerierung**: Unterstützung für Videoerstellungsmodelle
- **Datei-Upload**: Bild-Upload für visuellen Kontext in Gesprächen
- **Sprachfunktionen**: Speech-to-Text und Text-to-Speech Fähigkeiten
- **Konversationsverwaltung**: Verlauf, Titelerstellung und Organisation

### 2. Unified Image Generation Tool
- **Modellauswahl**: Unterstützung für sowohl Pollinations (kostenlos) als auch Replicate (Premium) Modelle
- **Referenzbilder**: Möglichkeit zum Hochladen von Referenzbildern für Generierung
- **Seitenverhältnis-Steuerung**: Multiple Seitenverhältnis-Optionen
- **Ausgabekonfiguration**: Auflösung, Format und Qualitätseinstellungen
- **Verlaufsverwaltung**: Lokale Speicherung des Generierungsverlaufs
- **Prompt-Verbesserung**: KI-gestützte Prompt-Verbesserung

### 3. User Experience Funktionen
- **Mehrsprachige Unterstützung**: Deutsche und englische Sprachoptionen
- **Theme-System**: Hell/Dunkel Modus Umschaltung
- **Responsives Design**: Mobile-freundliches Interface
- **Personalisierung**: Benutzer-Anzeigename und -einstellungen
- **Willkommens-Erlebnis**: Onboarding mit schnellen Prompts

## Technische Implementierung

### State Management
Die Anwendung verwendet einen zentralen `ChatProvider`, der verwaltet:
- Aktiven Konversationszustand
- Chat-Verlauf und Persistenz
- Modellauswahl und Konfiguration
- UI-Zustand (Panels, Modals, Ladezustände)
- Audio-Aufnahme und Wiedergabe

### API-Integration
- **Pollinations API**: Kostenlose Modelle für Text- und Bildgenerierung
- **Replicate API**: Premium-Modelle mit Passwortschutz
- **Unified Interface**: Abstrahierte Service-Schicht für verschiedene Provider
- **Error Handling**: Umfassende Fehlerbehandlung und Benutzerfeedback

### Dateibehandlung
- **Upload-System**: Vercel Blob Integration für Dateispeicherung
- **Bildverarbeitung**: Client-seitige Bildvorschau und Validierung
- **Verlaufsspeicherung**: LocalStorage für Konversations- und Bildverlauf

## Konfigurationssystem

### Modell-Registry
Die Anwendung verwaltet eine einheitliche Modell-Registry (`unified-image-models.ts`), die:
- Verfügbare Modelle von verschiedenen Anbietern definiert
- Modellfähigkeiten spezifiziert (Bild/Video, Referenzunterstützung)
- Provider-spezifische Parameterzuordnung behandelt
- Zugriff auf kostenlose vs Premium-Modelle verwaltet

### Benutzereinstellungen
- **Modellauswahl**: Persistente Modellpräferenzen pro Konversation
- **Antwortstile**: Verschiedene KI-Antwortstile
- **Spracheinstellungen**: TTS-Stimmauswahl
- **Sprache/Theme**: Benutzeroberflächenpräferenzen

## Sicherheit und Zugriffskontrolle

### Premium-Modellzugriff
- **Passwortschutz**: Umgebungsvariable-basierter Passwortschutz für Replicate-Modelle
- **API-Schlüssel-Management**: Server-seitige API-Token-Speicherung
- **Anfrage-Validierung**: Eingabebereinigung und Validierung

### Datenschutz
- **Keine persistenten Benutzerdaten**: Gespräche werden lokal gespeichert
- **Temporäre Dateispeicherung**: Hochgeladene Dateien haben begrenzte Lebensdauer
- **Kein Tracking**: Keine Analysen oder Benutzertracking implementiert

## Entwicklungsüberlegungen

### Code-Organisation
- **Modulare Architektur**: Klare Trennung der Zuständigkeiten
- **Type Safety**: Umfassende TypeScript-Verwendung
- **Komponenten-Wiederverwendbarkeit**: Geteilte UI-Komponenten
- **Custom Hooks**: Extrahierte Logik für Wiederverwendbarkeit

### Performance-Optimierungen
- **Lazy Loading**: Komponenten werden bei Bedarf geladen
- **Bildoptimierung**: Next.js Image Komponentenverwendung
- **Streaming-Antworten**: Echtzeit-Chat-Antwort-Streaming
- **Local Storage**: Client-seitiges Caching für besseres UX

## Aktuelle Einschränkungen

1. **Skalierbarkeit**: LocalStorage-basierter Konversationsverlauf begrenzt
2. **Benutzerverwaltung**: Keine Authentifizierung oder Benutzerkonten
3. **Zusammenarbeit**: Keine Sharing- oder Kollaborationsfunktionen
4. **Mobile App**: Keine native mobile Anwendung
5. **Erweiterte Funktionen**: Begrenzte erweiterte KI-Fähigkeiten (z.B. Fine-tuning)

## Bereitstellung und Infrastruktur

- **Hosting**: Vercel-Bereitstellung mit App Hosting Konfiguration
- **Umgebung**: Umgebungsbasierte Konfiguration
- **Blob Storage**: Vercel Blob für Datei-Uploads
- **CDN**: Vercels Edge-Netzwerk für statische Assets