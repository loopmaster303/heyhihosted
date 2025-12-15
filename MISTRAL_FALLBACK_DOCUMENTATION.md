# Mistral Fallback-Strategie Dokumentation

## Übersicht

Diese Dokumentation beschreibt die implementierte Mistral Fallback-Strategie für die hey.hi Anwendung. Die Strategie ermöglicht es, nahtlos auf Mistral AI Modelle umzuschalten, wenn die Pollinations API nicht verfügbar ist.

## Architektur

### Komponenten

1. **Mistral Model Configuration** (`src/config/mistral-models.ts`)
   - Modell-Definitionen für Large 3, Medium 3.1, und Ministral 3
   - Mapping von Pollinations zu Mistral Modellen
   - API-Konfiguration und Helper-Funktionen

2. **Mistral Chat Flow** (`src/ai/flows/mistral-chat-flow.ts`)
   - Direkte Integration mit Mistral API
   - Fehlerbehandlung und Timeout-Management
   - Streaming-Unterstützung

3. **Fallback-Logik** (`src/app/api/chat/completion/route.ts`)
   - Automatische Erkennung von Pollinations-Ausfällen
   - Intelligente Fehleranalyse
   - Manuelles und automatisches Umschalten

4. **UI-Integration** (`src/components/chat/ChatInput.tsx`)
   - Provider-Toggle in Quick Settings
   - Visuelle Indikatoren für aktiven Provider
   - Modell-Icons für Mistral Modelle

## Funktionsweise

### Automatischer Fallback

Die Anwendung nutzt standardmäßig Pollinations als primären Provider. Bei folgenden Situationen wird automatisch zu Mistral gewechselt:

1. **Timeouts** (> 10 Sekunden)
2. **5xx Serverfehler** 
3. **Spezifische Pollinations-Fehler** (unavailable, maintenance)
4. **Verbindungsprobleme**

### Manuelles Umschalten

Benutzer können über den "Provider-Modus" Toggle in den Quick Settings zwischen folgenden Modi wählen:

- **Pollinations (Auto)**: Standardmodus mit automatischem Fallback
- **Mistral (Direct)**: Direkte Nutzung von Mistral API

### Modell-Mapping

| Pollinations Modell | Mistral Fallback | Kontextfenster | Spezialgebiet |
|-------------------|------------------|----------------|---------------|
| openai-large | mistral-large | 256K | Komplexe Aufgaben |
| openai-reasoning | mistral-large | 256K | Reasoning |
| claude-large | mistral-large | 256K | Intelligenz |
| gemini-large | mistral-large | 256K | Lange Dokumente |
| moonshot | mistral-large | 256K | Deep Reasoning |
| perplexity-reasoning | mistral-large | 256K | Web + Reasoning |
| claude | mistral-medium | 128K | Balance |
| gemini | mistral-medium | 128K | Multimodal |
| deepseek | mistral-medium | 128K | Kostenoptimiert |
| grok | mistral-medium | 128K | Echtzeit |
| gemini-search | mistral-medium | 128K | Web-Suche |
| claude-fast | mistral-small | 32K | Geschwindigkeit |
| perplexity-fast | mistral-small | 32K | Schnelle Antworten |
| qwen-coder | mistral-small | 32K | Code-Generation |
| mistral | mistral-small | 32K | Standard |

## Konfiguration

### Umgebungsvariablen

```bash
MISTRAL_API_KEY=your_api_key_here
```

### API-Endpunkte

- **Base URL**: `https://api.mistral.ai/v1`
- **Chat Completions**: `/chat/completions`
- **Timeout**: 10 Sekunden
- **Max Retries**: 2

## Fehlerbehandlung

### Fehlerkategorien

1. **Retryable Errors** (wird Fallback versucht)
   - Netzwerkfehler
   - 5xx Serverfehler
   - Timeouts

2. **Non-Retryable Errors** (sofortiger Fehler)
   - 4xx Clientfehler
   - Authentifizierungsfehler
   - Invalid Request

### Logging

Alle Fallback-Versuche werden mit folgenden Informationen geloggt:

```javascript
{
  error: "Fehlermeldung",
  timestamp: "2025-01-15T07:00:00.000Z",
  originalProvider: "pollinations",
  fallbackProvider: "mistral",
  originalModel: "claude",
  fallbackModel: "mistral-medium"
}
```

## Testing

### Test-Utilities

Die Datei `src/utils/mistral-test.ts` enthält Test-Funktionen:

1. **API-Konnektivitätstest**
   - Testet grundlegende Mistral API-Verbindung
   - Validiert Authentifizierung

2. **Modell-Mapping-Test**
   - Überprüft korrektes Mapping von Pollinations zu Mistral
   - Validiert alle Modell-Übersetzungen

### Browser-Testing

Im Browser kann getestet werden mit:

```javascript
// In Browser-Konsole ausführen
await window.testMistral('your_api_key');
```

## Monitoring

### Metriken

Folgende Metriken sollten überwacht werden:

1. **Fallback-Rate**: Wie oft wird zu Mistral gewechselt?
2. **Response-Zeiten**: Vergleich Pollinations vs Mistral
3. **Fehler-Raten**: Erfolgquote pro Provider
4. **Kosten**: Token-Verbrauch pro Provider

### Alerts

Bei hoher Fallback-Rate (> 20%) sollten Alerts eingerichtet werden:

1. **Performance-Alert**: Pollinations-API optimieren
2. **Kapazitäts-Alert**: Load-Balancing prüfen
3. **Cost-Alert**: Kostenüberwachung aktivieren

## Sicherheit

### API-Key Schutz

- API-Keys nur in Environment-Variablen
- Keine Hardcoding in Client-Code
- Rotation der Keys alle 30 Tage empfohlen

### Rate Limiting

- Mistral: Standard-Rate-Limits beachten
- Pollinations: Eigene Rate-Limits
- Client-seitiges Rate Limiting implementiert

## Wartung

### Troubleshooting

1. **Kein Fallback bei Ausfall**
   - MISTRAL_API_KEY überprüfen
   - Netzwerkverbindung prüfen
   - Logs überprüfen

2. **Performance-Probleme**
   - Timeout-Werte anpassen
   - Retry-Logik optimieren
   - Caching erwägen

3. **Modell-Mapping-Fehler**
   - Mapping-Tabelle überprüfen
   - Modell-Konfiguration validieren

## Zukunftsentwicklung

### Mögliche Erweiterungen

1. **Load Balancing**: Intelligente Verteilung auf beide Provider
2. **Cost Optimization**: Automatische Wahl des günstigsten Providers
3. **Health Monitoring**: Proaktive Überwachung der Provider-Status
4. **Caching Layer**: Zwischenspeicherung für häufige Anfragen

### Versionierung

- **v1.0**: Grundlegende Fallback-Strategie
- **v1.1**: Manuelles Umschalten hinzugefügt
- **v1.2**: Erweiterte Fehleranalyse und Logging

## Support

Bei Problemen mit der Mistral-Integration:

1. **Logs prüfen**: Browser-Console und Server-Logs
2. **API-Key validieren**: Korrektheit und Berechtigungen
3. **Netzwerk testen**: Firewall und DNS-Einstellungen
4. **Dokumentation konsultieren**: Aktuelle Fehlermeldungen prüfen

---

*Letzte Aktualisierung: 15.12.2025*
*Version: 1.0*