import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const IngestSchema = z.object({
  sourceUrl: z.string().url(),
  sessionId: z.string().optional(),
  kind: z.enum(['image', 'video']).optional(),
});

const MIN_BYTES = 1000;

function getS3Client() {
  const region = process.env.AWS_REGION || 'eu-north-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getExtensionFromType(contentType: string | null, kind?: 'image' | 'video') {
  if (contentType) {
    const match = contentType.match(/\/([a-zA-Z0-9.+-]+)/);
    if (match?.[1]) {
      if (match[1] === 'jpeg') return 'jpg';
      return match[1].replace('x-', '');
    }
  }
  return kind === 'video' ? 'mp4' : 'jpg';
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing AWS_S3_BUCKET' }, { status: 500 });
    }

    const body = await request.json();
    const { sourceUrl, sessionId, kind } = IngestSchema.parse(body);

    const safeSession = sessionId && sessionId.trim() ? sessionId.trim() : 'anonymous';
    const startTime = Date.now();
    const pollTimeout = kind === 'video' ? 180000 : 60000;
    const pollDelay = kind === 'video' ? 4000 : 2000;

    let buffer: Buffer | null = null;
    let contentType: string | null = null;

    while (Date.now() - startTime < pollTimeout) {
      const response = await fetch(sourceUrl);
      if (response.ok) {
        contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MIN_BYTES) {
          buffer = Buffer.from(arrayBuffer);
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
    }

    if (!buffer) {
      return NextResponse.json({ error: 'Timed out waiting for media' }, { status: 504 });
    }

    const extension = getExtensionFromType(contentType, kind);
    const key = `generated/${safeSession}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || undefined,
      })
    );

    return NextResponse.json({
      key,
      contentType: contentType || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to ingest asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
