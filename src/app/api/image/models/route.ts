
import { NextResponse } from 'next/server';

const SUPPORTED_POLLINATIONS_MODELS = ['flux', 'turbo', 'gptimage']; // "gptimage" is now a selectable option

export async function GET() {
  try {
    // We now fetch all models and filter to our supported list, which includes gptimage.
    const resp = await fetch('https://image.pollinations.ai/models', { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'hey.hi-app/1.0'
      }
    });
    
    if (!resp.ok) {
      console.error('Error fetching image models from Pollinations:', resp.status, resp.statusText);
      // Return fallback models instead of error
      return NextResponse.json({ 
        models: SUPPORTED_POLLINATIONS_MODELS 
      });
    }
    
    const modelsData = await resp.json(); 
    
    if (Array.isArray(modelsData) && modelsData.every(item => typeof item === 'string')) {
      // Filter the fetched models against our explicit list of supported ones.
      const filteredModels = modelsData.filter(model => SUPPORTED_POLLINATIONS_MODELS.includes(model));
      if (filteredModels.length === 0) { 
        // If API returns empty or none of our supported models, fallback to our known good ones
        return NextResponse.json({ models: SUPPORTED_POLLINATIONS_MODELS });
      }
      return NextResponse.json({ models: filteredModels });
    } else {
      console.error('Unexpected format from Pollinations /models endpoint:', modelsData);
      // Return fallback models instead of error
      return NextResponse.json({ 
        models: SUPPORTED_POLLINATIONS_MODELS 
      });
    }
  } catch (err: any) {
    console.error('Internal error in /api/image/models:', err);
    // Return fallback models instead of error
    return NextResponse.json({ 
      models: SUPPORTED_POLLINATIONS_MODELS
    });
  }
}
