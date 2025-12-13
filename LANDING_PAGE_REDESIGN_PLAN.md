# Landing Page Redesign Plan

## Problemstellung

Die aktuelle Landing Page (`src/app/entry-draft/page.tsx`) hat mehrere UX-Probleme:
1. **Verwirrende Doppelung**: Typewriter-Effekt bleibt bestehen, auch nach der ersten Interaktion
2. **Unklare Navigation**: Die Modus-Buttons sind nicht deutlich als primäre Navigation erkennbar
3. **Überladene Vorschläge**: Zu viele gleichzeitig sichtbare Quick-Prompts überladen die Benutzeroberfläche
4. **Fehlende Kontext**: Keine Erklärung, was nach dem Klick auf "Los geht's" passiert

## Lösungskonzept

### 1. Vereinfachte Landing Page
- **Minimalistischer Ansatz**: Weniger ist mehr - bessere Benutzerführung
- **Klare Handlungsaufforderung**: Direkter Pfad zur gewünschten Funktionalität
- **Progressive Enhancement**: Schrittweise Einführung von Features

### 2. Verbesserte User Experience
- **Schneller Einstieg**: Reduzierte Ladezeit und direkter Zugang zu Hauptfunktionen
- **Intuitive Bedienung**: Klare visuelle Hierarchie und konsistente Interaktionsmuster
- **Kontextbewahrung**: Benutzer verstehen jederzeit, wo sie sich befinden und was sie tun können

## Detaillierter Plan

### Phase 1: Grundlegende Struktur (1 Woche)

#### 1.1 Typewriter-Effekt optimieren
```typescript
// Problem: Typewriter bleibt bestehen und stört
// Lösung: Einmaliger Effekt nur beim ersten Besuch

const [showTypewriter, setShowTypewriter] = useState(true);
const [hasInteracted, setHasInteracted] = useState(false);

useEffect(() => {
    if (hasInteracted) {
        setShowTypewriter(false);
    }
}, [hasInteracted]);
```

#### 1.2 Navigation vereinfachen
```typescript
// Problem: Zu viele Optionen auf kleiner Fläche
// Lösung: Klare Hauptaktionen mit sekundären Optionen

<div className="space-y-6">
    {/* Primäre Aktionen */}
    <div className="flex gap-4">
        <Button size="lg" onClick={() => navigateToChat()}>
            Gespräch beginnen
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigateToVisualize()}>
            Bild erstellen
        </Button>
    </div>
    
    {/* Sekundäre Optionen */}
    <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={() => navigateToHistory()}>
            Verlauf
        </Button>
        <Button variant="ghost" onClick={() => navigateToSettings()}>
            Einstellungen
        </Button>
    </div>
</div>
```

#### 1.3 Kontextbezogene Vorschläge
```typescript
// Problem: Feste Vorschläge sind nicht kontextbezogen
// Lösung: Dynamische Vorschläge basierend auf Modus

const contextualPrompts = {
    chat: [
        "Erzähle mir von deinem Tag",
        "Was beschäftigt dich gerade?",
        "Hilf mir bei einem Problem"
    ],
    visualize: [
        "Eine Sonnenuntergang am Strand",
        "Ein modernes Büro im Cyberpunk-Stil",
        "Ein abstraktes Kunstwerk mit leuchtenden Farben"
    ]
};
```

### Phase 2: Verbesserte Funktionalität (2 Wochen)

#### 2.1 Smart-Onboarding
```typescript
// Problem: Neue Benutzer werden nicht angeleitet
// Lösung: Kontextbezogene Tour für erste Besucher

const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
    const hasVisited = localStorage.getItem('has-visited-landing');
    if (!hasVisited) {
        setShowOnboarding(true);
        localStorage.setItem('has-visited-landing', 'true');
    }
}, []);
```

#### 2.2 Performance-Optimierung
```typescript
// Problem: Unnötige Re-renders
// Lösung: React.memo und useCallback optimieren

const OptimizedComponent = React.memo(({ data }) => {
    const processedData = useMemo(() => {
        return expensiveCalculation(data);
    }, [data]);
    
    return <div>{processedData}</div>;
});
```

#### 2.3 Responsive Design
```typescript
// Problem: Mobile Darstellung ist nicht optimal
// Lösung: Adaptive Layouts

const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Phase 3: Barrierefreiheit und Accessibility (3 Wochen)

#### 3.1 Tastaturnavigation
```typescript
// Problem: Keine Shortcuts für wichtige Funktionen
// Lösung: Globale Tastaturkürzel implementieren

useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    navigateToChat();
                    break;
                case 'v':
                    navigateToVisualize();
                    break;
                case 'h':
                    navigateToHistory();
                    break;
                case 's':
                    navigateToSettings();
                    break;
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### 3.2 Screen Reader Support
```typescript
// Problem: Unzureichende ARIA-Labels
// Lösung: Vollständige Accessibility-Implementierung

<div
    role="main"
    aria-label="Chat-Anwendung Landing Page"
    aria-describedby="landing-description"
>
    <div id="landing-description" className="sr-only">
        Willkommen bei hey.hi - Ihre KI-Chat-Anwendung. Wählen Sie zwischen Gespräch oder Bild-Erstellung.
    </div>
    
    <Button
        aria-label="Gespräch beginnen"
        aria-describedby="chat-description"
    >
        Gespräch beginnen
    </Button>
</div>
```

### Phase 4: Analytics und Testing (1 Woche)

#### 4.1 Benutzer-Tracking
```typescript
// Problem: Keine Daten über Benutzerinteraktionen
// Lösung: Analytics-Implementierung

const trackLandingPageInteraction = (action: string, context?: string) => {
    // Analytics-Event senden
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'landing_page_interaction', {
            action,
            context,
            timestamp: new Date().toISOString()
        });
    }
};
```

#### 4.2 A/B-Testing-Framework
```typescript
// Problem: Keine Möglichkeit zur Optimierung durch Tests
// Lösung: Feature-Flag-System implementieren

const useFeatureFlag = (flagName: string) => {
    const [isEnabled, setIsEnabled] = useState(false);
    
    useEffect(() => {
        const flag = localStorage.getItem(`feature_${flagName}`);
        setIsEnabled(flag === 'true');
    }, [flagName]);
    
    return isEnabled;
};
```

## Erfolgsmetriken

### Technische Metriken
- **Ladezeit**: < 2 Sekunden für erste Darstellung
- **Time to Interactive**: < 3 Sekunden zur ersten Interaktion
- **Bundle-Größe**: < 300KB gzipped
- **Memory-Nutzung**: < 30MB für typische Sitzung

### Benutzer-Metriken
- **Conversion Rate**: > 15% von Landing Page zu Chat
- **Task Completion Rate**: > 80% für Hauptaufgaben
- **User Satisfaction**: > 4.0/5.0 in Umfragen
- **Retention**: > 60% nach 7 Tagen

## Implementierungszeitplan

- **Woche 1**: Grundlegende Struktur und Typewriter-Optimierung
- **Woche 2**: Funktionalität und Performance
- **Woche 3**: Barrierefreiheit und Accessibility
- **Woche 4**: Analytics, Testing und Feinabstimmung

## Prioritäten

### 1. Kritisch (Blocker)
- Typewriter-Effekt entfernen nach erster Interaktion
- Hauptnavigation vereinfachen und klarer gestalten
- Mobile-Responsivität sicherstellen

### 2. Hoch
- Performance-Optimierung
- Kontextbezogene Vorschläge
- Barrierefreiheit gemäß WCAG 2.1 AA

### 3. Mittel
- Analytics-Implementierung
- A/B-Testing-Framework
- Benutzer-Feedback-Mechanismen

Dieser Plan stellt sicher, dass die Landing Page benutzerfreundlicher, performanter und barrierefreier wird, während gleichzeitig die technische Qualität gewahrt bleibt.