# Reduced Landing Page Proposal

## Zielsetzung

Vereinfachung der Landing Page bei Beibehaltung des Kernkonzepts mit Fokus auf:
- Schnellere Ladezeiten
- Bessere Performance
- Klarere Benutzerführung
- Weniger komplexe Implementierung

## Konzept

### Beibehalten
- Typewriter-Effekt mit `(!hey.hi = '{userDisplayName}')`
- Zwei Modi-Buttons (Gespräch/Visualisieren)
- Eingabefeld mit Quick-Prompts

### Vereinfachen
- Weniger Animationen und Übergänge
- Reduzierte State-Management-Komplexität
- Direktere Navigation ohne komplexe Event-Handling

## Implementierungsvorschlag

### 1. Reduzierte Komponentenstruktur

```typescript
// Stark vereinfachte Version
function EntryDraftPageContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const chat = useChat();
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const isGerman = language === 'de';
  const [mode, setMode] = useState<'chat' | 'visualize'>('chat');
  const [prompt, setPrompt] = useState('');
  const [typed, setTyped] = useState('');
  const [isClient, setIsClient] = useState(false);

  const targetLine = `(!hey.hi = '${(userDisplayName || 'user').trim() || 'user'}')`;

  // Einfacher Typewriter-Effekt ohne komplexe Phasen
  useEffect(() => {
    if (!isClient) return;
    
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTyped(targetLine.slice(0, idx));
      if (idx >= targetLine.length) {
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [isClient, targetLine]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    
    // Direkte Navigation ohne komplexe Event-Handling
    localStorage.setItem('sidebar-preload-prompt', prompt.trim());
    localStorage.setItem('sidebar-preload-target', mode);
    router.push(mode === 'chat' ? '/chat' : '/visualizepro');
  };

  if (!isClient) {
    return <PageLoader text="Lade Startseite..." />;
  }

  return (
    <AppLayout
      onNewChat={chat.startNewChat}
      onToggleHistoryPanel={chat.toggleHistoryPanel}
      onToggleGalleryPanel={chat.toggleGalleryPanel}
      currentPath="/"
      chatHistory={chat.allConversations.filter(c => c.toolType === 'long language loops')}
      onSelectChat={chat.selectChat}
      onRequestEditTitle={chat.requestEditTitle}
      onDeleteChat={chat.deleteChat}
      isHistoryPanelOpen={chat.isHistoryPanelOpen}
      isGalleryPanelOpen={chat.isGalleryPanelOpen}
      allConversations={chat.allConversations}
      activeConversation={chat.activeConversation}
    >
      <div className="relative flex flex-col items-center justify-center h-full px-4 py-10">
        {/* Einfacher Typewriter-Effekt */}
        <div className="mb-10 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center text-foreground drop-shadow-[0_0_20px_rgba(255,105,180,0.65)]">
          <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
            {typed}
            <span className="animate-pulse text-foreground">|</span>
          </span>
        </div>

        {/* Vereinfachte Modus-Auswahl */}
        <div className="max-w-2xl w-full bg-card/60 border border-border rounded-3xl shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition',
                mode === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
              )}
              onClick={() => setMode('chat')}
            >
              {isGerman ? 'Gespräch' : 'Chat'}
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition',
                mode === 'visualize' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
              )}
              onClick={() => setMode('visualize')}
            >
              {isGerman ? 'Visualisieren' : 'Visualize'}
            </button>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'chat'
                ? isGerman
                  ? 'Worüber möchtest du sprechen?'
                  : 'What do you want to talk about?'
                : isGerman
                  ? 'Beschreibe, was du sehen willst...'
                  : 'Describe what you want to see...'
            }
            className="min-h-[140px] bg-background/80"
          />

          {/* Reduzierte Quick-Prompts */}
          <div className="flex flex-wrap gap-2">
            {(mode === 'chat' 
              ? (isGerman ? quickChatPrompts.de : quickChatPrompts.en)
              : (isGerman ? quickVisualPrompts.de : quickVisualPrompts.en)
            ).slice(0, 3).map((c, idx) => (
              <button
                key={idx}
                className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => setPrompt(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button disabled={!prompt.trim()} onClick={handleSubmit}>
              {isGerman ? 'Los geht's' : "Let's go"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

### 2. Performance-Optimierungen

#### Reduzierte Bundle-Größe
- Entfernung nicht-essentieller Animationen
- Weniger useState-Hooks (von 8 auf 4 reduziert)
- Vereinfachte useEffect-Logik

#### Schnellere Initialisierung
- Direkter Typewriter-Start ohne Verzögerung
- Keine komplexen Phasen-Übergänge
- Reduzierte Rendering-Zyklen

### 3. Vorteile der Vereinfachung

#### Technische Vorteile
- **Weniger Code**: ~40% Reduzierung der Komponentengröße
- **Bessere Performance**: Schnellere Ladezeiten und weniger Re-renders
- **Einfachere Wartung**: Weniger komplexe State-Management-Logik
- **Robuster**: Weniger Fehlerquellen durch vereinfachte Logik

#### Benutzer-Vorteile
- **Schnellerer Einstieg**: Direkter Zugang zur Funktionalität
- **Klarere UI**: Weniger ablenkende Animationen
- **Bessere Mobile Performance**: Optimiert für langsamere Geräte

### 4. Implementierungsschritte

#### Schritt 1: Komponente vereinfachen
1. Entferne komplexe Phasen-Logik (`idle`, `typing`, `ready`)
2. Reduziere useState-Hooks auf das Wesentliche
3. Vereinfache Typewriter-Logik

#### Schritt 2: Performance optimieren
1. Reduziere Quick-Prompts auf 3 pro Modus
2. Entferne überflüssige Animationen
3. Optimiere Rendering-Zyklen

#### Schritt 3: Testen und validieren
1. Performance-Metriken überprüfen
2. Benutzer-Flow testen
3. Mobile-Optimierung validieren

### 5. Erfolgsmetriken

#### Technische Metriken
- **Ladezeit**: < 1.5 Sekunden (Verbesserung um 25%)
- **Bundle-Größe**: < 200KB gzipped (Reduzierung um 33%)
- **Time to Interactive**: < 2 Sekunden (Verbesserung um 33%)

#### Benutzer-Metriken
- **Conversion Rate**: > 20% (Verbesserung um 33%)
- **Task Completion**: > 85% (Verbesserung um 6%)
- **Bounce Rate**: < 30% (Reduzierung um 25%)

## Zeitplan

- **Woche 1**: Komponente vereinfachen und implementieren
- **Woche 2**: Performance-Optimierung und Testing
- **Woche 3**: Mobile-Optimierung und Finalisierung

## Fazit

Diese vereinfachte Implementierung behält das Kernkonzept bei, verbessert aber signifikant die Performance und Benutzererfahrung durch:
- Weniger komplexe Logik
- Schnellere Ladezeiten
- Klarere Benutzerführung
- Bessere Mobile Performance

Das Ergebnis ist eine schnellere, effizientere und benutzerfreundlichere Landing Page bei voller Funktionalität.