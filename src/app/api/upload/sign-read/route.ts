import { NextResponse } from 'next/server';
import { z } from 'zod';

const ReadSignSchema = z.object({
  key: z.string().min(1, 'key is required'),
});

const IMMUTABLE_EXPIRES_SECONDS = 60 * 60 * 24 * 365 * 10;

/**
 * Legacy compatibility route.
 * Converts stored media hash/key into immutable Pollinations media URL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key } = ReadSignSchema.parse(body);
    const downloadUrl = `https://media.pollinations.ai/${encodeURIComponent(key)}`;
    return NextResponse.json({ downloadUrl, expiresIn: IMMUTABLE_EXPIRES_SECONDS });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to resolve media URL' },
      { status: 500 }
    );
  }
}
