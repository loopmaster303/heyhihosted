/**
 * Direct Mistral API Test
 * Tests the Mistral API connection and model availability
 */

export async function testMistralDirect() {
    const apiKey = process.env.MISTRAL_API_KEY || 'Wgp5DfqlsV2gDPFAHqeQJ28aYOulZMwv';
    const baseURL = 'https://api.mistral.ai/v1';

    console.log('=== Direct Mistral API Test ===');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    console.log('Base URL:', baseURL);

    try {
        // Test 1: List available models
        console.log('\n1. Testing model list...');
        const modelsResponse = await fetch(`${baseURL}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!modelsResponse.ok) {
            throw new Error(`Models API failed: ${modelsResponse.status} ${modelsResponse.statusText}`);
        }

        const modelsData = await modelsResponse.json();
        console.log('Available models:');
        modelsData.data.forEach((model: any) => {
            console.log(`  - ${model.id} (${model.object})`);
        });

        // Test 2: Simple chat completion
        console.log('\n2. Testing chat completion...');
        const chatResponse = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello in German'
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            throw new Error(`Chat API failed: ${chatResponse.status} ${chatResponse.statusText} - ${errorText}`);
        }

        const chatData = await chatResponse.json();
        console.log('Chat response:');
        console.log(`  Model: ${chatData.model}`);
        console.log(`  Response: ${chatData.choices[0].message.content}`);
        console.log(`  Usage: ${JSON.stringify(chatData.usage)}`);

        return {
            success: true,
            models: modelsData.data,
            chatResponse: chatData
        };

    } catch (error) {
        console.error('Mistral API test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// Browser-accessible test function
declare global {
    interface Window {
        testMistralDirect: () => Promise<void>;
    }
}

export function setupMistralDirectTest() {
    if (typeof window !== 'undefined') {
        window.testMistralDirect = async () => {
            console.log('Starting direct Mistral API test...');
            const result = await testMistralDirect();
            console.log('Test result:', result);
        };
    }
}

// Auto-setup in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setupMistralDirectTest();
}