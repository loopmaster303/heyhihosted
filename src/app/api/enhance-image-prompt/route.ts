import { NextRequest, NextResponse } from 'next/server';
import { getMistralModel } from '@/config/mistral-models';
import { getMistralChatCompletion } from '@/ai/flows/mistral-chat-flow';

export async function POST(request: NextRequest) {
    try {
        const { prompt, modelId = 'mistral-medium-3.1' } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Get Mistral model configuration
        const mistralModel = getMistralModel(modelId);
        if (!mistralModel) {
            return NextResponse.json(
                { error: 'Invalid Mistral model specified' },
                { status: 400 }
            );
        }

        // Enhanced system prompt for image generation
        const systemPrompt = `You are an expert prompt engineer for AI image generation systems. Your task is to enhance user prompts to create better, more detailed, and more effective image generation prompts.

Guidelines:
1. Add specific details about style, lighting, composition, and mood
2. Include technical specifications that image generators understand
3. Maintain the user's original intent while adding professional enhancements
4. Use descriptive adjectives and artistic terminology
5. Consider aspect ratios and composition rules
6. Add appropriate camera angles and lighting descriptions
7. Include color palette suggestions when relevant
8. Keep prompts concise but comprehensive (under 200 words)

Return ONLY the enhanced prompt without explanations or additional text.`;

        // Generate enhanced prompt using Mistral
        const mistralResponse = await getMistralChatCompletion({
            messages: [{ role: 'user', content: prompt }],
            modelId,
            apiKey: process.env.MISTRAL_API_KEY || '',
            systemPrompt,
            maxCompletionTokens: 500,
            temperature: 0.7
        });

        return NextResponse.json({
            success: true,
            originalPrompt: prompt,
            enhancedPrompt: mistralResponse.responseText.trim(),
            modelUsed: mistralResponse.modelUsed,
            provider: mistralResponse.provider
        });

    } catch (error) {
        console.error('Error enhancing image prompt:', error);

        // Fallback: return original prompt if enhancement fails
        const { prompt } = await request.json().catch(() => ({ prompt: '' }));

        return NextResponse.json({
            success: false,
            error: 'Failed to enhance prompt',
            originalPrompt: prompt,
            enhancedPrompt: prompt, // Fallback to original
            provider: 'fallback'
        }, { status: 500 });
    }
}