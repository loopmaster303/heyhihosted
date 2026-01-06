# Chat mit Mistral - Test Anleitung

## Schnelltest für Chat mit Mistral

### 1. Browser-Konsole Tests
Öffne die Browser-Entwicklerkonsole und führe nacheinander aus:

```javascript
// 1. Direkter Mistral API Test
await window.testMistralDirect()

// 2. Chat mit Mistral Test
await window.testChatMistral()

// 3. Image Tools Test (optional)
await window.testImageTools()

// 4. Chat Title Test (optional)
await window.testChatTitle()
```

### 2. Manueller Chat Test

#### Schritt 1: Chat öffnen
1. Gehe zur Chat-Seite
2. Klicke auf das Modell-Auswahl-Menü
3. Wähle ein Mistral-Modell:
   - "Mistral Large 3 (Direct)"
   - "Mistral Medium 3.1 (Direct)"
   - "Ministral 3 (Direct)"

#### Schritt 2: Nachricht senden
1. Gib eine einfache Nachricht ein: "Hallo, wer bist du?"
2. Sende die Nachricht
3. Beobachte die Antwort

#### Schritt 3: Fallback testen
1. Wähle ein Pollinations-Modell (z.B. "Claude Sonnet 4.5")
2. Aktiviere "Use Mistral Fallback" Toggle (falls vorhanden)
3. Sende eine Nachricht
4. Prüfe, ob bei Fehlern auf Mistral gefallen wird

### 3. API-Endpunkt Tests

#### Direkter API Test
Besuche: `http://localhost:3000/api/test-mistral`

#### Chat Completion Test
```javascript
fetch('/api/chat/completion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hallo' }],
    modelId: 'mistral-large',
    mistralFallbackEnabled: true
  })
}).then(r => r.json()).then(console.log)
```

### 4. Erwartete Ergebnisse

#### Erfolgreicher Test
✅ API-Verbindung steht  
✅ Modell-Antwort kommt zurück  
✅ Tokens werden gezählt  
✅ Fallback funktioniert  

#### Mögliche Fehler und Lösungen

**401 Unauthorized**
- API-Key fehlt oder falsch
- Lösung: `.env` Datei prüfen

**404 Model Not Found**
- Modell-ID falsch
- Lösung: Korrekte Modell-IDs verwenden

**500 Server Error**
- Mistral API Problem
- Lösung: Später versuchen

### 5. Debug-Informationen

In der Browser-Konsole solltest du sehen:
```
[Chat API] Using Mistral directly for model: mistral-large
[FALLBACK] Pollinations claude failed, using Mistral mistral-large-latest
```

### 6. Test-Checkliste

- [ ] Direkter Mistral API Test erfolgreich
- [ ] Chat mit Mistral Large funktioniert
- [ ] Chat mit Mistral Medium funktioniert  
- [ ] Chat mit Mistral Small funktioniert
- [ ] Fallback von Pollinations zu Mistral funktioniert
- [ ] Chat Title Generation mit Mistral funktioniert
- [ ] Image Prompt Enhancement mit Mistral funktioniert

### 7. Nächste Schritte

Wenn alle Tests erfolgreich sind:
1. Chat mit verschiedenen Prompts testen
2. Lange Konversationen testen
3. Multimodale Funktionen testen (Bilder)
4. Performance unter Last testen

### 8. Troubleshooting

Falls etwas nicht funktioniert:
1. Browser-Konsole auf Fehler prüfen
2. Network-Tab auf fehlgeschlagene Requests prüfen
3. API-Key in `.env` validieren
4. Modell-IDs in Konfiguration prüfen

---
*Mistral Integration sollte jetzt voll funktionsfähig sein!*
