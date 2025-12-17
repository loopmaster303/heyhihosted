// src/lib/services/search-service.ts

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    source?: string;
}

export interface SearchResponse {
    results: SearchResult[];
    query: string;
    timestamp: string;
}

/**
 * Search Service for WebBrowsing functionality
 * Uses Pollinations.ai API for real-time web search
 */
export class SearchService {
    private static readonly POLLEN_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
    private static readonly MAX_SEARCH_RESULTS = 5;
    private static readonly SEARCH_TIMEOUT = 10000; // 10 seconds

    /**
     * Perform web search using Pollinations.ai API
     * @param query - Search query string
     * @returns Promise<SearchResult[]> - Array of search results
     */
    static async webSearch(query: string): Promise<SearchResult[]> {
        try {
            // Use Pollinations.ai web search API


            const apiKey = process.env.POLLEN_API_KEY;
            if (!apiKey) {
                console.warn('[SearchService] POLLEN_API_KEY not configured, returning empty results');
                return [];
            }

            // Clean and validate query
            const cleanQuery = this.cleanSearchQuery(query);
            if (!cleanQuery || cleanQuery.length < 2) {
                console.warn('[SearchService] Query too short or empty:', query);
                return [];
            }

            // Call Pollinations.ai web search API
            const response = await fetch(this.POLLEN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'perplexity-fast', // Use Pollinations' web search model
                    messages: [
                        {
                            role: 'user',
                            content: `Search for current information about: ${cleanQuery}. Return exactly 5 most relevant results with titles, URLs, and brief snippets. Focus on recent and authoritative sources.`
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.1, // Low temperature for consistent search results
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[SearchService] Pollinations API error (${response.status}):`, errorText);
                return [];
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                console.warn('[SearchService] No content in Pollinations response');
                return [];
            }

            // Parse search results from the response
            const results = this.parseSearchResults(content, query);


            return results;

        } catch (error) {
            console.error('[SearchService] Search failed:', error);

            // Return empty results on error to avoid breaking the chat flow
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn('[SearchService] Search timeout for query:', query);
            }

            return [];
        }
    }

    /**
     * Clean and validate search query
     * @param query - Raw search query
     * @returns Cleaned query string
     */
    private static cleanSearchQuery(query: string): string {
        return query
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/["']/g, '') // Remove quotes
            .substring(0, 200); // Limit query length
    }

    /**
     * Parse search results from Pollinations API response
     * @param content - Response content
     * @param query - Original search query
     * @returns Parsed search results
     */
    private static parseSearchResults(content: string, query: string): SearchResult[] {
        try {
            // Try to extract structured search results
            const results = this.extractStructuredResults(content);

            // If structured extraction fails, try fallback parsing
            if (results.length === 0) {
                return this.extractFallbackResults(content, query);
            }

            return results.slice(0, this.MAX_SEARCH_RESULTS);

        } catch (error) {
            console.error('[SearchService] Failed to parse search results:', error);
            return [];
        }
    }

    /**
     * Extract structured search results from content
     * @param content - Response content
     * @returns Array of search results
     */
    private static extractStructuredResults(content: string): SearchResult[] {
        const results: SearchResult[] = [];

        // Try to find numbered list patterns or bullet points
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
            // Look for patterns like: 1. Title - URL [snippet]
            const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(https?:\/\/[^\s]+)(?:\s*\[(.+?)\])?/);

            if (match) {
                const [, title, url, snippet] = match;
                results.push({
                    title: title.trim(),
                    url: url.trim(),
                    snippet: snippet?.trim() || title.trim(),
                    source: 'Pollinations Search',
                });
            }
        }

        return results;
    }

    /**
     * Fallback extraction method for unstructured content
     * @param content - Response content
     * @param query - Original search query
     * @returns Array of search results
     */
    private static extractFallbackResults(content: string, query: string): SearchResult[] {
        const results: SearchResult[] = [];

        // Look for URLs in the content
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const urls = content.match(urlRegex) || [];

        // Extract text around URLs as potential titles/snippets
        for (const url of urls.slice(0, this.MAX_SEARCH_RESULTS)) {
            const urlIndex = content.indexOf(url);
            const beforeUrl = content.substring(Math.max(0, urlIndex - 100), urlIndex);
            const afterUrl = content.substring(urlIndex, urlIndex + 200);

            // Try to extract a title from the surrounding text
            const titleMatch = beforeUrl.match(/([^.!?]*[.!?]\s*$)/);
            const title = titleMatch ? titleMatch[1].trim() : `Search result for "${query}"`;

            results.push({
                title: title,
                url: url,
                snippet: afterUrl.substring(0, 150) + '...',
                source: 'Pollinations Search',
            });
        }

        return results;
    }

    /**
     * Format search results for inclusion in LLM prompt
     * @param results - Array of search results
     * @returns Formatted string for LLM
     */
    static formatResultsForLLM(results: SearchResult[]): string {
        if (results.length === 0) {
            return 'No recent web search results found.';
        }

        return results.map((result, index) =>
            `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.url}`
        ).join('\n\n');
    }

    /**
     * Check if web search should be triggered for a given message
     * @param message - User message content
     * @returns Boolean indicating if search should be performed
     */
    static shouldTriggerSearch(message: string): boolean {
        // Don't search for very short messages
        if (message.length < 10) return false;

        // Don't search for simple greetings or basic questions
        const noSearchPatterns = [
            /^(hi|hello|hey|thanks|thank you|bye|goodbye)/i,
            /^(how are you|what's up|sup)/i,
            /^(yes|no|ok|sure|maybe)/i,
            /^(help|commands|settings)/i,
        ];

        return !noSearchPatterns.some(pattern => pattern.test(message.trim()));
    }

    /**
     * Extract search query from user message
     * @param message - Full user message
     * @returns Extracted search query
     */
    static extractSearchQuery(message: string): string {
        // Remove common prefixes that don't need search
        const cleanMessage = message
            .replace(/^(tell me|explain|describe|what is|how to|why is|when did)/i, '')
            .replace(/^(please|can you|could you)/i, '')
            .trim();

        return cleanMessage;
    }
}