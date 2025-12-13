# LLM Models Update Plan

## Zielsetzung

Update der verfügbaren LLM-Modelle mit den neuen Modellen von Pollinations.ai und Implementierung der intelligenten Modell-Logik.

## Neue Modelle von Pollinations.ai

### Premium Modelle
- **openai-large** - OpenAI GPT-5.2 - Most Powerful & Intelligent
- **qwen-coder** - Qwen 2.5 Coder 32B - Specialized for Code Generation
- **mistral** - Mistral Small 3.2 24B - Efficient & Cost-Effective
- **openai-reasoning** - OpenAI GPT-5.2 - Hybrid Reasoning Model
- **gemini** - Google Gemini 2.5 Flash Lite - Fast & Multimodal
- **deepseek** - DeepSeek V3.1 - Advanced Reasoning & Coding
- **grok** - xAI Grok 4 Fast - High Speed & Real-Time
- **gemini-search** - Google Gemini 2.5 Flash Lite - With Google Search
- **claude-fast** - Anthropic Claude Haiku 4.5 - Fast & Intelligent
- **claude** - Anthropic Claude Sonnet 4.5 - Most Capable & Balanced
- **claude-large** - Anthropic Claude Opus 4.5 - Most Intelligent Model
- **perplexity-fast** - Perplexity Sonar - Fast & Affordable with Web Search
- **perplexity-reasoning** - Perplexity Sonar Reasoning - Advanced Reasoning with Web Search
- **kimi-k2-thinking** - Moonshot Kimi K2 Thinking - Deep Reasoning & Tool Orchestration
- **gemini-large** - Google Gemini 3 Pro - Most Intelligent Model with 1M Context (Preview)

## Implementierungsplan

### 1. Modelle in Chat-System integrieren
```typescript
// Neue Modelle in chat-options.ts
export const AVAILABLE_POLLINATIONS_MODELS = [
    {
        id: 'openai-large',
        name: 'OpenAI GPT-5.2',
        description: 'Most Powerful & Intelligent',
        provider: 'openai',
        contextWindow: 128000,
        maxTokens: 4096,
        vision: true,
        costPerToken: 0.000015,
        category: 'premium'
    },
    {
        id: 'qwen-coder',
        name: 'Qwen 2.5 Coder',
        description: 'Specialized for Code Generation',
        provider: 'qwen',
        contextWindow: 32768,
        maxTokens: 8192,
        vision: true,
        costPerToken: 0.000001,
        category: 'coding'
    },
    {
        id: 'claude',
        name: 'Claude Sonnet 4.5',
        description: 'Most Capable & Balanced',
        provider: 'anthropic',
        contextWindow: 200000,
        maxTokens: 4096,
        vision: true,
        costPerToken: 0.000015,
        category: 'premium'
    },
    // ... weitere Modelle
];
```

### 2. Intelligente Modell-Logik implementieren

#### Standard-Modell
- **Claude Sonnet 4.5** als Standard-Modell (`claude`)
- Bester Kompromiss aus Intelligenz, Geschwindigkeit und Kosten

#### Web Browsing Logik
```typescript
const getModelForWebBrowsing = (currentModel: string) => {
    // Wenn Web Browsing aktiviert, bevorzuge Modelle mit Search
    if (webBrowsingEnabled) {
        return 'perplexity-reasoning'; // Beste Wahl mit Web Search
    }
    return currentModel;
};
```

#### Automatische Modell-Optimierung
```typescript
const getOptimalModel = (task: string, context: any) => {
    // Code-Generation
    if (task.includes('code') || task.includes('programming')) {
        return 'qwen-coder';
    }
    
    // Reasoning-Heavy Tasks
    if (task.includes('analyze') || task.includes('reason')) {
        return 'openai-reasoning';
    }
    
    // Fast Response Needed
    if (context.requiresSpeed) {
        return 'claude-fast';
    }
    
    // Default
    return 'claude';
};
```

### 3. UI-Komponenten aktualisieren

#### Model-Selector im Chat
```typescript
// Neue Modelle im Dropdown anzeigen
// Premium-Modelle mit speziellen Icons
// Kosten-Indikatoren für jedes Modell
// Smart-Recommendations basierend auf Kontext
```

#### Model-Informationen
```typescript
// Detaillierte Modell-Infos anzeigen:
// - Kontextfenster-Größe
// - Kosten pro Token
// - Spezialgebiete
// - Geschwindigkeit
// - Vision-Unterstützung
```

### 4. API-Integration

#### Provider-Switching
```typescript
// Automatische Provider-Wechsel basierend auf Modell
const getProviderForModel = (modelId: string) => {
    const model = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === modelId);
    return model?.provider || 'pollinations';
};
```

#### Fallback-Logik
```typescript
// Bei Fehlern automatisch zuverlässiges Modell wechseln
const getFallbackModel = (failedModel: string) => {
    const fallbackOrder = [
        'claude',          // Stabilster
        'openai-large',    // Mächtigster
        'gemini',          // Schnellster
        'perplexity-fast'  // Günstigster
    ];
    
    return fallbackOrder.find(m => m !== failedModel) || 'claude';
};
```

## Implementierungsschritte

1. **Modelle aktualisieren** (`chat-options.ts`)
2. **API-Endpunkte erweitern** für neue Provider
3. **UI-Komponenten anpassen** für neue Modelle
4. **Intelligente Logik implementieren** für automatische Modell-Auswahl
5. **Fallback-Mechanismen** erstellen
6. **Testing** mit allen neuen Modellen

## Erfolgsmetriken

### Technische Metriken
- **Modell-Verfügbarkeit**: > 95% uptime
- **Response-Zeit**: < 3 Sekunden für Premium-Modelle
- **Kosten-Effizienz**: Automatische Auswahl des kostengünstigsten Modells

### Benutzer-Metriken
- **Modell-Zufriedenheit**: > 4.5/5.0
- **Task-Erfolgsrate**: > 90% mit automatischer Modell-Auswahl
- **Kosten-Transparenz**: Klare Kostenanzeige pro Modell

## Zeitplan

- **Woche 1**: Modelle integrieren und API-Endpunkte erweitern
- **Woche 2**: UI-Komponenten aktualisieren
- **Woche 3**: Intelligente Logik implementieren
- **Woche 4**: Testing und Optimierung

Dieser Plan stellt sicher, dass die neuen LLM-Modelle optimal integriert werden mit intelligenter Auswahl-Logik und Fallback-Mechanismen.