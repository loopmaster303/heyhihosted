// src/lib/services/web-context-service.ts
// Service for fetching realtime web context via Perplexity API

export interface WebContext {
    facts: string[];
    timestamp: string;
    mode: 'light' | 'deep';
    sources?: string[];
}

interface PerplexityResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

const POLLEN_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
const LIGHT_TIMEOUT_MS = 500;
const DEEP_TIMEOUT_MS = 3000;

// Simple in-memory cache (5 min TTL)
const contextCache = new Map<string, { data: WebContext; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Skip patterns - don't fetch web context for these
const SKIP_PATTERNS = [
    /^(hi|hello|hey|hallo|moin|servus)[\s!?.]*$/i,
    /^(ja|nein|ok|okay|danke|thanks)[\s!?.]*$/i,
    /^(wie geht|how are).*$/i,
];

/**
 * WebContextService - Fetches realtime web information
 * Light mode: Fast, minimal facts for general context
 * Deep mode: Comprehensive research with sources
 */
export class WebContextService {
    /**
     * Get web context based on mode
     */
    static async getContext(
        query: string,
        mode: 'light' | 'deep' = 'light'
    ): Promise<WebContext> {
        // Check if we should skip this query
        if (this.shouldSkip(query)) {
            return this.emptyContext(mode);
        }

        // Check cache
        const cacheKey = `${mode}:${query.toLowerCase().trim()}`;
        const cached = contextCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }

        const timeoutMs = mode === 'light' ? LIGHT_TIMEOUT_MS : DEEP_TIMEOUT_MS;

        try {
            const result = await Promise.race([
                mode === 'light'
                    ? this.fetchLightContext(query)
                    : this.fetchDeepContext(query),
                this.timeout(timeoutMs)
            ]);

            // Cache the result
            if (result.facts.length > 0) {
                contextCache.set(cacheKey, { data: result, timestamp: Date.now() });
            }

            return result;
        } catch (error) {
            console.warn('[WebContextService] Failed to fetch context:', error);
            return this.emptyContext(mode);
        }
    }

    /**
     * Light Context: Quick facts, minimal latency
     */
    private static async fetchLightContext(query: string): Promise<WebContext> {
        const apiKey = process.env.POLLEN_API_KEY;
        if (!apiKey) {
            return this.emptyContext('light');
        }

        const systemPrompt = `Du bist ein Fakten-Extraktor. Gib NUR 3-5 kurze, aktuelle Fakten zurück die für die Anfrage relevant sein könnten.
Format: Eine Zeile pro Fakt, mit Strichpunkt beginnen.
Beispiel:
- Bitcoin: 98.500€
- Datum heute: 22. Dezember 2024
- Wetter Berlin: 4°C, bewölkt
Keine Einleitung, keine Erklärung, nur Fakten.`;

        const response = await fetch(POLLEN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'perplexity-fast',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Aktuelle Fakten zu: ${query}` }
                ],
                max_tokens: 300,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: PerplexityResponse = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        return {
            facts: this.parseFacts(content),
            timestamp: new Date().toISOString(),
            mode: 'light',
        };
    }

    /**
     * Deep Context: Comprehensive research with sources
     */
    private static async fetchDeepContext(query: string): Promise<WebContext> {
        const apiKey = process.env.POLLEN_API_KEY;
        if (!apiKey) {
            return this.emptyContext('deep');
        }

        const systemPrompt = `Du bist ein Research-Assistent. Recherchiere gründlich und gib 8-10 relevante Fakten mit Quellen zurück.
Format:
- Fakt hier [Quelle: domain.com]
- Weiterer Fakt [Quelle: andere-domain.de]
Keine Einleitung, keine Zusammenfassung, nur Fakten mit Quellen.`;

        const response = await fetch(POLLEN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'perplexity-reasoning',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Recherchiere ausführlich: ${query}` }
                ],
                max_tokens: 800,
                temperature: 0.2,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: PerplexityResponse = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const facts = this.parseFacts(content);

        // Extract sources from facts
        const sources = facts
            .map(f => {
                const match = f.match(/\[Quelle:\s*([^\]]+)\]/);
                return match ? match[1].trim() : null;
            })
            .filter((s): s is string => s !== null);

        return {
            facts,
            timestamp: new Date().toISOString(),
            mode: 'deep',
            sources: [...new Set(sources)],
        };
    }

    /**
     * Parse facts from response content
     */
    private static parseFacts(content: string): string[] {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, '').trim())
            .filter(line => line.length > 5);
    }

    /**
     * Check if query should skip web context
     */
    private static shouldSkip(query: string): boolean {
        const trimmed = query.trim();
        if (trimmed.length < 3) return true;
        return SKIP_PATTERNS.some(pattern => pattern.test(trimmed));
    }

    /**
     * Create empty context
     */
    private static emptyContext(mode: 'light' | 'deep'): WebContext {
        return {
            facts: [],
            timestamp: new Date().toISOString(),
            mode,
        };
    }

    /**
     * Timeout promise
     */
    private static timeout(ms: number): Promise<WebContext> {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
        );
    }

    /**
     * Build the web context block for system prompt injection
     */
    static buildContextBlock(context: WebContext): string {
        if (context.facts.length === 0) {
            return '';
        }

        const factsFormatted = context.facts
            .map(f => `        - ${f}`)
            .join('\n');

        return `
[SYSTEM MESSAGE: REAL-TIME WEB SEARCH RESULTS AVAILABLE]
You have been provided with the following real-time search results to answer the user's question.
Do NOT claim you cannot access the internet. Use these facts:

<web_context timestamp="${context.timestamp}" mode="${context.mode}">
    <facts>
${factsFormatted}
    </facts>
    <usage_rules>
        NUTZE diese Fakten NUR wenn relevant für die Anfrage.
        IGNORIERE bei kreativen/emotionalen Themen.
        safety_protocol hat IMMER Vorrang.
    </usage_rules>
</web_context>`;
    }

    /**
     * Inject web context into existing system prompt
     */
    static injectIntoSystemPrompt(
        systemPrompt: string,
        context: WebContext
    ): string {
        const block = this.buildContextBlock(context);
        if (!block) {
            return systemPrompt;
        }

        // Insert before </system_prompt> if present
        if (systemPrompt.includes('</system_prompt>')) {
            return systemPrompt.replace(
                '</system_prompt>',
                block + '\n</system_prompt>'
            );
        }

        // Otherwise append at end
        return systemPrompt + block;
    }
}
