/**
 * Test Chat with Mistral Integration
 */

export async function testChatWithMistral() {
    console.log('=== Testing Chat with Mistral ===');

    try {
        // Test 1: Direct Mistral Model
        console.log('\n1. Testing direct Mistral model...');
        const directResponse = await fetch('/api/chat/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hallo, wer bist du?' }
                ],
                modelId: 'mistral-large',
                mistralFallbackEnabled: true,
                systemPrompt: 'Du bist ein hilfreicher deutscher Assistent.'
            })
        });

        if (directResponse.ok) {
            const directResult = await directResponse.json();
            console.log('✅ Direct Mistral Success:');
            console.log('  Model:', directResult.model);
            console.log('  Response:', directResult.choices[0]?.message?.content?.substring(0, 100) + '...');
            console.log('  Usage:', directResult.usage);
        } else {
            const errorText = await directResponse.text();
            console.error('❌ Direct Mistral failed:', directResponse.status, errorText);
        }

        // Test 2: Pollinations Model with Fallback
        console.log('\n2. Testing Pollinations model with Mistral fallback...');
        const fallbackResponse = await fetch('/api/chat/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Was ist die Hauptstadt von Deutschland?' }
                ],
                modelId: 'claude', // This should fallback to Mistral if Pollinations fails
                mistralFallbackEnabled: true,
                systemPrompt: 'Antworte kurz und präzise.'
            })
        });

        if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            console.log('✅ Fallback Success:');
            console.log('  Model:', fallbackResult.model);
            console.log('  Response:', fallbackResult.choices[0]?.message?.content);
            console.log('  Usage:', fallbackResult.usage);
        } else {
            const errorText = await fallbackResponse.text();
            console.error('❌ Fallback failed:', fallbackResponse.status, errorText);
        }

        // Test 3: Test all Mistral models
        console.log('\n3. Testing all Mistral models...');
        const mistralModels = ['mistral-large', 'mistral-medium', 'mistral-small'];

        for (const modelId of mistralModels) {
            try {
                const modelResponse = await fetch('/api/chat/completion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'user', content: `Test message for ${modelId}` }
                        ],
                        modelId,
                        mistralFallbackEnabled: true,
                        maxCompletionTokens: 100
                    })
                });

                if (modelResponse.ok) {
                    const modelResult = await modelResponse.json();
                    console.log(`✅ ${modelId}: Success`);
                } else {
                    console.log(`❌ ${modelId}: Failed (${modelResponse.status})`);
                }
            } catch (error) {
                console.log(`❌ ${modelId}: Error - ${error}`);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Chat Mistral test failed:', error);
        return { success: false, error };
    }
}

// Browser-accessible test function
declare global {
    interface Window {
        testChatMistral: () => Promise<void>;
    }
}

export function setupChatMistralTest() {
    if (typeof window !== 'undefined') {
        window.testChatMistral = async () => {
            console.log('Starting Chat with Mistral test...');
            await testChatWithMistral();
            console.log('Chat Mistral test completed!');
        };
    }
}

// Auto-setup in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setupChatMistralTest();
}