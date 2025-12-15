/**
 * Test utilities for Image Tools with Mistral integration
 */

export async function testImagePromptEnhancement(prompt: string) {
    try {
        const response = await fetch('/api/enhance-image-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                modelId: 'mistral-medium-3.1'
            })
        });

        const result = await response.json();

        console.log('=== Image Prompt Enhancement Test ===');
        console.log('Original Prompt:', prompt);
        console.log('Enhanced Prompt:', result.enhancedPrompt);
        console.log('Provider:', result.provider);
        console.log('Success:', result.success);

        return result;
    } catch (error) {
        console.error('Image prompt enhancement test failed:', error);
        return { success: false, error };
    }
}

export async function testChatTitleGeneration(messages: any[]) {
    try {
        const response = await fetch('/api/chat/title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                useMistral: false // Test with fallback
            })
        });

        const result = await response.json();

        console.log('=== Chat Title Generation Test ===');
        console.log('Messages:', messages.length, 'messages');
        console.log('Generated Title:', result.title);
        console.log('Provider:', result.provider);
        console.log('Fallback:', result.fallback);
        console.log('Success:', result.success);

        return result;
    } catch (error) {
        console.error('Chat title generation test failed:', error);
        return { success: false, error };
    }
}

// Browser-accessible test function
declare global {
    interface Window {
        testImageTools: () => void;
        testChatTitle: () => void;
    }
}

export function setupImageToolsTests() {
    if (typeof window !== 'undefined') {
        window.testImageTools = async () => {
            console.log('Testing Image Tools with Mistral integration...');

            // Test prompt enhancement
            await testImagePromptEnhancement('a beautiful sunset');
            await testImagePromptEnhancement('create a futuristic city');
            await testImagePromptEnhancement('portrait of a person');

            console.log('Image Tools tests completed!');
        };

        window.testChatTitle = async () => {
            console.log('Testing Chat Title Generation with Mistral fallback...');

            // Test title generation
            await testChatTitleGeneration([
                { role: 'user', content: 'How do I create a React component?' },
                { role: 'assistant', content: 'Here\'s how you can create a React component...' }
            ]);

            await testChatTitleGeneration([
                { role: 'user', content: 'Tell me about machine learning' }
            ]);

            console.log('Chat Title tests completed!');
        };
    }
}

// Auto-setup tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setupImageToolsTests();
}