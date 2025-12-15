/**
 * Mistral AI Model Configuration
 * Direct Mistral API integration for fallback strategy
 */

export interface MistralModel {
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    multimodal: boolean;
    useCase: string;
    costPerToken?: number;
}

export const MISTRAL_MODELS: Record<string, MistralModel> = {
    'mistral-large': {
        id: 'mistral-large-latest',
        name: 'Mistral Large Latest',
        contextWindow: 262144,
        maxTokens: 8192,
        multimodal: true,
        useCase: 'Komplexe Aufgaben, Code, Mathematik, Langdokumente',
        costPerToken: 0.000003
    },
    'mistral-medium': {
        id: 'mistral-medium-latest',
        name: 'Mistral Medium Latest',
        contextWindow: 131072,
        maxTokens: 4096,
        multimodal: true,
        useCase: 'Programmierung, mathematische Aufgaben, Dialoge',
        costPerToken: 0.000001
    },
    'mistral-small': {
        id: 'mistral-small-latest',
        name: 'Mistral Small Latest',
        contextWindow: 131072,
        maxTokens: 8192,
        multimodal: true,
        useCase: 'Edge, SaaS, skalierbare Anwendungen',
        costPerToken: 0.0000002
    }
};

// Zusätzliche Modell-IDs für direkte Verwendung
export const DIRECT_MISTRAL_MODELS: Record<string, string> = {
    'mistral-large-3': 'mistral-large',
    'mistral-medium-3.1': 'mistral-medium',
    'mistral-small-3': 'mistral-small',
    'mistral-large-latest': 'mistral-large',
    'mistral-medium-latest': 'mistral-medium',
    'mistral-small-latest': 'mistral-small',
    'mistral-large-2512': 'mistral-large',
    'mistral-medium-2508': 'mistral-medium',
    'mistral-small-2506': 'mistral-small'
};

// Intelligentes Mapping basierend auf Fähigkeiten und Kosten
export const POLLINATIONS_TO_MISTRAL_MAPPING: Record<string, string> = {
    // Premium Modelle -> Mistral Large
    'openai-large': 'mistral-large',
    'openai-reasoning': 'mistral-large',
    'claude-large': 'mistral-large',
    'gemini-large': 'mistral-large',
    'moonshot': 'mistral-large',
    'perplexity-reasoning': 'mistral-large',

    // Standard Modelle -> Mistral Medium
    'claude': 'mistral-medium',
    'gemini': 'mistral-medium',
    'deepseek': 'mistral-medium',
    'grok': 'mistral-medium',
    'gemini-search': 'mistral-medium',

    // Fast/Compact Modelle -> Mistral Small
    'claude-fast': 'mistral-small',
    'perplexity-fast': 'mistral-small',
    'qwen-coder': 'mistral-small',
    'mistral': 'mistral-small'
};

// API Konfiguration
export const MISTRAL_CONFIG = {
    baseURL: 'https://api.mistral.ai/v1',
    timeout: 10000, // 10 Sekunden
    maxRetries: 3,
    retryDelay: 2000,
    retryCondition: (error: any) => {
        // Retry bei Netzwerkfehlern, 5xx oder 429 (Rate Limit)
        return !error.response || error.response.status >= 500 || error.response.status === 429;
    }
};

// Hilfsfunktionen
export const getMistralModel = (modelId: string): MistralModel | undefined => {
    return MISTRAL_MODELS[modelId];
};

export const mapPollinationsToMistralModel = (pollinationsModel: string): string => {
    // Prüfe zuerst auf direkte Modell-IDs
    if (DIRECT_MISTRAL_MODELS[pollinationsModel]) {
        return DIRECT_MISTRAL_MODELS[pollinationsModel];
    }

    // Dann prüfe auf Pollinations Mapping
    return POLLINATIONS_TO_MISTRAL_MAPPING[pollinationsModel] || 'mistral-medium';
};

export const calculateMistralCost = (
    model: string,
    inputTokens: number,
    outputTokens: number
): number => {
    const modelConfig = MISTRAL_MODELS[model];
    if (!modelConfig?.costPerToken) return 0;

    return (inputTokens + outputTokens) * modelConfig.costPerToken;
};

// Mistral API Request/Response Typen
export interface MistralChatRequest {
    model: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string | Array<{
            type: 'text' | 'image_url';
            text?: string;
            image_url?: { url: string };
        }>;
    }>;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}

export interface MistralChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
