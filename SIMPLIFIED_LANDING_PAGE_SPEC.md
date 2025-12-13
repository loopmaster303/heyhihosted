# Simplified Landing Page Specification

## Anforderungen

### 1. Typewriter-Effekt bleibt erhalten
- Der bestehende Typewriter-Effekt mit `(!hey.hi = '{userDisplayName}')` bleibt erhalten
- Nach Abschluss des Effekts bleibt der Text sichtbar

### 2. Modus-Toggle (Gespräch/Visualisieren)
- Zwei Buttons zur Auswahl des Modus
- Gespräch → Link zu `/chat`
- Visualisieren → Link zu `/visualizepro`

### 3. Kein Eingabe-Prompt-Feld
- **Kein Textarea-Input**
- **Kein Eingabefeld für Benutzer**
- Nur statische Anzeige

### 4. Platzhalter-Text
- Bei Gespräch: Einfacher Plain-Text "Lorem ipsum..." (nicht anklickbar)
- Bei Visualisieren: Gleicher Plain-Text "Lorem ipsum..." (nicht anklickbar)

### 5. "Los geht's" Button
- Bei Gespräch: Button mit Link zu `/chat`
- Bei Visualisieren: Button mit Link zu `/visualizepro`
- Keine komplexe Logik, nur einfache Navigation

## Implementierungsdetails

### Struktur
```
┌─────────────────────────────────┐
│        Typewriter-Effekt       │
│    (!hey.hi = 'user')       │
├─────────────────────────────────┤
│                             │
│   [Gespräch] [Visualisieren] │
│                             │
│        Lorem ipsum...          │
│                             │
│      [Los geht's]            │
│                             │
└─────────────────────────────────┘
```

### Verhalten
1. **Laden**: Typewriter-Effekt startet automatisch
2. **Nach Typewriter**: Modus-Buttons und Platzhalter-Text werden sichtbar
3. **Modus-Wechsel**: Wechselt zwischen Gespräch/Visualisieren
4. **Los geht's**: Navigiert zur entsprechenden Seite

### Technische Umsetzung

#### 1. Vereinfachte State-Logik
```typescript
const [mode, setMode] = useState<'chat' | 'visualize'>('chat');
const [typed, setTyped] = useState('');
const [isTypingComplete, setIsTypingComplete] = useState(false);

// Typewriter-Effekt (vereinfacht)
useEffect(() => {
    // Bestehender Typewriter-Logik
}, []);

// Navigation
const handleNavigate = () => {
    router.push(mode === 'chat' ? '/chat' : '/visualizepro');
};
```

#### 2. Einfaches Markup
```typescript
return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-10">
        {/* Typewriter-Effekt */}
        <div className="mb-10 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center">
            <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
                {typed}
                {isTyping && <span className="animate-pulse">|</span>}
            </span>
        </div>

        {/* Modus-Toggle - nur wenn Typewriter komplett */}
        {isTypingComplete && (
            <>
                <div className="flex gap-4 mb-8">
                    <button
                        className={cn(
                            'px-6 py-2 rounded-full text-sm font-medium transition',
                            mode === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
                        )}
                        onClick={() => setMode('chat')}
                    >
                        Gespräch
                    </button>
                    <button
                        className={cn(
                            'px-6 py-2 rounded-full text-sm font-medium transition',
                            mode === 'visualize' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
                        )}
                        onClick={() => setMode('visualize')}
                    >
                        Visualisieren
                    </button>
                </div>

                {/* Platzhalter-Text */}
                <div className="mb-8 text-center text-muted-foreground max-w-md">
                    Lorem ipsum...
                </div>

                {/* Los geht's Button */}
                <button
                    onClick={handleNavigate}
                    className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
                >
                    Los geht's
                </button>
            </>
        )}
    </div>
);
```

## Vorteile

1. **Maximale Einfachheit**: Keine komplexen State-Management
2. **Schnelle Ladezeiten**: Minimaler Code, keine überflüssigen Komponenten
3. **Klare Benutzerführung**: Direkte Navigation ohne Verwirrung
4. **Performance**: Keine doppelten Rendering-Zyklen
5. **Wartbarkeit**: Weniger Code, weniger Fehlerquellen

## Umsetzungsschritte

1. **EntryDraftPage vereinfachen**: Komplett neu schreiben mit minimaler Logik
2. **Typewriter-Effekt beibehalten**: Bestehende Logik übernehmen
3. **Modus-Toggle implementieren**: Einfache State-Änderung
4. **Navigation hinzufügen**: Direkte Links zu Zielseiten
5. **Testing**: Sicherstellen, dass Navigation funktioniert

Dies entspricht genau der Anforderung: "typewritereffekt bleibt, das feld mit dem gespräch und visualisieren toggle auch aber kein eingabe prompt feld und prompt beispiele bei chat einfach ein erstm text plain nicht anklickbar 'lorem ipsum....' darunter der los gehts button (link zu /chat) klick auf visualisieren das gleiche plaintext 'lorem ipsum' darunter los gehts button mit link zu /visualizepro".