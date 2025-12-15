/**
 * Test utility for Mistral API integration
 * Can be used to validate the Mistral fallback functionality
 */

import { getMistralChatCompletion } from '@/ai/flows/mistral-chat-flow';

export interface TestResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

/**
 * Test Mistral API connectivity
 */
export async function testMistralAPI(apiKey: string): Promise<TestResult> {
    try {
        console.log('[MISTRAL TEST] Testing Mistral API connectivity...');

        const result = await getMistralChatCompletion({
            messages: [
                { role: 'user', content: 'Hello! This is a test message.' }
            ],
            modelId: 'mistral-medium',
            systemPrompt: 'You are a helpful assistant.',
            apiKey: apiKey,
            maxCompletionTokens: 100,
            temperature: 0.7
        });

        console.log('[MISTRAL TEST] Success:', result);

        return {
            success: true,
            message: 'Mistral API test successful',
            data: result
        };

    } catch (error) {
        console.error('[MISTRAL TEST] Error:', error);

        return {
            success: false,
            message: 'Mistral API test failed',
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Test Pollinations to Mistral model mapping
 */
export function testModelMapping(): TestResult {
    try {
        const { mapPollinationsToMistralModel } = require('@/config/mistral-models');

        const testMappings = [
            { pollinations: 'openai-large', expected: 'mistral-large' },
            { pollinations: 'claude', expected: 'mistral-medium' },
            { pollinations: 'claude-fast', expected: 'mistral-small' },
            { pollinations: 'gemini-large', expected: 'mistral-large' },
            { pollinations: 'deepseek', expected: 'mistral-medium' },
            { pollinations: 'perplexity-fast', expected: 'mistral-small' }
        ];

        const results = testMappings.map(({ pollinations, expected }) => {
            const actual = mapPollinationsToMistralModel(pollinations);
            const passed = actual === expected;

            console.log(`[MAPPING TEST] ${pollinations} -> ${actual} (expected: ${expected}) ${passed ? '✅' : '❌'}`);

            return {
                pollinations,
                expected,
                actual,
                passed
            };
        });

        const allPassed = results.every(r => r.passed);

        return {
            success: allPassed,
            message: `Model mapping test ${allPassed ? 'passed' : 'failed'}`,
            data: results
        };

    } catch (error) {
        return {
            success: false,
            message: 'Model mapping test failed',
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Run all Mistral integration tests
 */
export async function runMistralTests(apiKey?: string): Promise<TestResult[]> {
    console.log('[MISTRAL TEST] Starting Mistral integration tests...');

    const results: TestResult[] = [];

    // Test model mapping
    results.push(testModelMapping());

    // Test API connectivity if key provided
    if (apiKey) {
        results.push(await testMistralAPI(apiKey));
    } else {
        results.push({
            success: false,
            message: 'No API key provided, skipping API test'
        });
    }

    const summary = {
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length
    };

    console.log('[MISTRAL TEST] Test Summary:', summary);

    return results;
}

/**
 * Browser console test function
 * Can be called from browser console for debugging
 */
declare global {
    interface Window {
        testMistral?: (apiKey?: string) => Promise<TestResult[]>;
    }
}

if (typeof window !== 'undefined') {
    window.testMistral = runMistralTests;
}