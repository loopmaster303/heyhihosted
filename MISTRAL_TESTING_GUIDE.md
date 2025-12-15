# Mistral Integration Testing Guide

## Problembehebung für Mistral-Modelle

Wenn die Mistral-Modelle nicht funktionieren, folge diesen Schritten:

## 1. API-Test durchführen

### Browser-Konsole Test
Öffne die Browser-Entwicklerkonsole und führe aus:

```javascript
// Direkter Mistral API Test
await window.testMistralDirect()

// Image Tools Test
await window.testImageTools()

// Chat Title Test
await window.testChatTitle()
```

### API-Endpunkt Test
Besuche direkt: `http://localhost:3000/api/test-mistral`

## 2. Wichtige Prüfungen

### API-Key Validierung
- Stelle sicher, dass `MISTRAL_API_KEY` in der `.env` Datei korrekt ist
- Der Key sollte mit `Wgp5DfqlsV2gDPFAHqeQJ28aYOulZMwv` beginnen

### Modell-IDs
Die korrekten Modell-IDs sind:
- `mistral-large-latest` (für Large 3)
- `mistral-small-latest` (für Small 3)
- `mistral-large-latest` (Fallback für Medium)

### API-Endpunkt
- Base URL: `https://api.mistral.ai/v1`
- Chat Completions: `/chat/completions`
- Models: `/models`

## 3. Fehlerbehebung

### Häufige Fehler

1. **401 Unauthorized**
   - API-Key ist falsch oder fehlt
   - Lösung: API-Key in `.env` überprüfen

2. **404 Model Not Found**
   - Modell-ID ist falsch
   - Lösung: Korrekte Modell-IDs verwenden

3. **429 Rate Limited**
   - Zu viele Anfragen
   - Lösung: Weniger Anfragen oder warten

4. **500 Server Error**
   - Mistral API Problem
   - Lösung: Später erneut versuchen

### Debug-Steps

1. **API-Verbindung testen**
   ```javascript
   fetch('https://api.mistral.ai/v1/models', {
     headers: { 'Authorization': 'Bearer Wgp5DfqlsV2gDPFAHqeQJ28aYOulZMwv' }
   })
   ```

2. **Chat Completion testen**
   ```javascript
   fetch('https://api.mistral.ai/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer Wgp5DfqlsV2gDPFAHqeQJ28aYOulZMwv',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       model: 'mistral-small-latest',
       messages: [{ role: 'user', content: 'Hello' }],
       max_tokens: 50
     })
   })
   ```

## 4. Integration Test

### Chat Integration
1. Öffne den Chat
2. Wähle ein Modell, das auf Mistral mappen soll (z.B. 'claude')
3. Aktiviere den "Use Mistral Fallback" Toggle
4. Sende eine Nachricht
5. Prüfe die Konsole für Logs

### Image Tools Integration
1. Öffne Image Tools
2. Wähle ein Mistral-Modell aus
3. Gib einen einfachen Prompt ein
4. Prüfe das Enhanced Prompt Ergebnis

### Title Generation
1. Starte einen neuen Chat
2. Sende einige Nachrichten
3. Prüfe, ob der Titel korrekt generiert wird

## 5. Konfigurations-Check

### Environment Variablen
```bash
MISTRAL_API_KEY=dein_key_hier
```

### Modell-Konfiguration
Prüfe `src/config/mistral-models.ts`:
- Korrekte Modell-IDs
- Richtige API-Endpunkte
- Timeout-Konfiguration

## 6. Logging

Aktiviere detailliertes Logging in der Browser-Konsole:
```javascript
localStorage.setItem('debug', 'mistral:*')
```

## 7. Fallback-Strategie

Die Anwendung sollte automatisch:
1. Pollinations versuchen
2. Bei Fehlern zu Mistral wechseln
3. Bei erneuten Fehlern Generic-Fallback verwenden

## 8. Support

Wenn alles nicht funktioniert:
1. Browser-Konsole Screenshots machen
2. API-Response Logs sammeln
3. Network-Tab überprüfen
4. Fehlermeldung genau dokumentieren

---
*Diese Anleitung hilft bei der Diagnose und Behebung von Mistral-Integrationsproblemen.*