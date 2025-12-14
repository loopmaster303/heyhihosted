import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().optional().default('Analysiere dieses Bild detailliert. Beschreibe was du siehst, was darauf zu sehen ist, und gib relevante Details an.'),
  modelId: z.string().optional().default('claude'), // Default to Claude Vision
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt, modelId } = requestSchema.parse(body);

    // Convert to OpenAI-compatible format for Pollinations.ai
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    const pollenApiKey = process.env.POLLEN_API_KEY;
    const legacyApiKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;

    if (!pollenApiKey && !legacyApiKey) {
      throw new Error('Polination API-Schlüssel nicht konfiguriert');
    }

    const apiUrl = pollenApiKey 
      ? 'https://enter.pollinations.ai/api/generate/v1/chat/completions'
      : 'https://text.pollinations.ai/openai';

    const apiKey = pollenApiKey || legacyApiKey;

    const payload = {
      model: modelId,
      messages,
      max_tokens: 2000,
      temperature: 0.1,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API-Fehler: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract the analysis text from the OpenAI-compatible response
    const analysisText = result.choices?.[0]?.message?.content || 'Keine Analyse verfügbar.';

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      model: modelId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Vision analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}