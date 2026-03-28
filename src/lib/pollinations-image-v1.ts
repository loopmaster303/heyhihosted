import { ApiError } from '@/lib/api-error-handler';

const POLLINATIONS_IMAGE_V1_URL = 'https://gen.pollinations.ai/v1/images/generations';

interface GeneratePollinationsImageInput {
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
  safe?: boolean;
  transparent?: boolean;
  negative_prompt?: string;
  image?: string | string[];
  apiKey?: string;
}

interface PollinationsImageV1Response {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  } | string;
}

function toImageSize(width?: number, height?: number): string {
  return `${width || 1024}x${height || 1024}`;
}

export async function generatePollinationsImage(input: GeneratePollinationsImageInput): Promise<string> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (input.apiKey) {
    headers['Authorization'] = `Bearer ${input.apiKey}`;
  }

  const payload = {
    model: input.model,
    prompt: input.prompt,
    size: toImageSize(input.width, input.height),
    ...(input.seed !== undefined ? { seed: input.seed } : {}),
    ...(input.nologo !== undefined ? { nologo: input.nologo } : {}),
    ...(input.enhance !== undefined ? { enhance: input.enhance } : {}),
    ...(input.safe !== undefined ? { safe: input.safe } : {}),
    ...(input.transparent !== undefined ? { transparent: input.transparent } : {}),
    ...(input.negative_prompt ? { negative_prompt: input.negative_prompt } : {}),
    ...(input.image ? { image: input.image } : {}),
    response_format: 'url',
  };

  const response = await fetch(POLLINATIONS_IMAGE_V1_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({})) as PollinationsImageV1Response;
  if (!response.ok) {
    const detail = typeof result.error === 'string'
      ? result.error
      : result.error?.message || 'Unknown Pollinations image generation error';
    throw new ApiError(response.status, `Pollinations API error: ${detail}`);
  }

  const firstAsset = result.data?.[0];
  if (firstAsset?.url) {
    return firstAsset.url;
  }

  if (firstAsset?.b64_json) {
    return `data:image/png;base64,${firstAsset.b64_json}`;
  }

  throw new ApiError(502, 'Pollinations API error: missing image output');
}
