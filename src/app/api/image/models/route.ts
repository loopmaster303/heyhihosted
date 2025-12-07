
import { NextResponse } from 'next/server';

type ModelInfo = {
  id: string;
  supportsReference: boolean;
  kind: 'image' | 'video';
};

const ALLOWED_IDS = ['kontext', 'nanobanana', 'nanobanana-pro', 'seedream', 'seedream-pro', 'seedance', 'seedance-pro', 'veo'];
const FALLBACK_MODELS: ModelInfo[] = [
  { id: 'kontext', supportsReference: true, kind: 'image' },
  { id: 'nanobanana', supportsReference: true, kind: 'image' },
  { id: 'nanobanana-pro', supportsReference: true, kind: 'image' },
  { id: 'seedream', supportsReference: true, kind: 'image' },
  { id: 'seedream-pro', supportsReference: true, kind: 'image' },
  { id: 'seedance', supportsReference: true, kind: 'video' },
  { id: 'seedance-pro', supportsReference: true, kind: 'video' },
  { id: 'veo', supportsReference: false, kind: 'video' },
];

// Image-only models for chat (no video models)
const CHAT_IMAGE_MODELS = FALLBACK_MODELS.filter(m => m.kind === 'image').map(m => m.id);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forChat = searchParams.get('for') === 'chat'; // Filter video models for chat
  try {
    const token = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    
    const headers: Record<string, string> = {
      'User-Agent': 'hey.hi-app/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const resp = await fetch('https://enter.pollinations.ai/api/generate/image/models', { 
      cache: 'no-store',
      headers
    });
    
    if (!resp.ok) {
      console.error('Error fetching image models from Pollen:', resp.status, resp.statusText);
      const fallback = forChat ? CHAT_IMAGE_MODELS : FALLBACK_MODELS.map(m => m.id);
      return NextResponse.json({ models: fallback });
    }
    
    const modelsData = await resp.json(); 
    if (Array.isArray(modelsData)) {
      const collected: ModelInfo[] = [];
      for (const item of modelsData) {
        if (!item || typeof item !== 'object') continue;
        const name = (item as any).name;
        if (typeof name !== 'string') continue;
        const aliases: string[] = Array.isArray((item as any).aliases) ? (item as any).aliases : [];
        const inputModalities: string[] = Array.isArray((item as any).input_modalities) ? (item as any).input_modalities : [];
        const outputModalities: string[] = Array.isArray((item as any).output_modalities) ? (item as any).output_modalities : [];
        const supportsReference = inputModalities.includes('image');
        const kind: 'image' | 'video' = outputModalities.includes('video') ? 'video' : 'image';

        const pushIfAllowed = (id: string) => {
          if (!ALLOWED_IDS.includes(id)) return;
          collected.push({ id, supportsReference, kind });
        };

        pushIfAllowed(name);
        aliases.forEach(a => typeof a === 'string' && pushIfAllowed(a));
      }

      // Deduplicate while preserving order, ensure all allowed ids exist
      const seen = new Set<string>();
      const unique: ModelInfo[] = [];
      for (const m of collected) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        unique.push(m);
      }
      // Append any missing allowed ids from fallback
      for (const fb of FALLBACK_MODELS) {
        if (!seen.has(fb.id)) {
          unique.push(fb);
          seen.add(fb.id);
        }
      }

      // Filter video models if requested for chat
      const filteredModels = forChat 
        ? unique.filter(m => m.kind === 'image')
        : unique;
      
      // Return only the IDs as strings, matching the expected ImageModelsResponse type
      return NextResponse.json({ models: filteredModels.map(m => m.id) });
    } else {
      console.error('Unexpected format from Pollen /generate/image/models endpoint:', modelsData);
      const fallback = forChat ? CHAT_IMAGE_MODELS : FALLBACK_MODELS.map(m => m.id);
      return NextResponse.json({ models: fallback });
    }
  } catch (err: any) {
    console.error('Internal error in /api/image/models:', err);
    const fallback = forChat ? CHAT_IMAGE_MODELS : FALLBACK_MODELS.map(m => m.id);
    return NextResponse.json({ models: fallback });
  }
}
