import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UploadSignSchema = z.object({
  filename: z.string().min(1, 'filename is required'),
  contentType: z.string().optional(),
  sessionId: z.string().optional(),
  folder: z.string().optional(),
});

const EXPIRY_SECONDS = 60 * 60; // 1 hour

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

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing AWS_S3_BUCKET' }, { status: 500 });
    }

    const body = await request.json();
    const { filename, contentType, sessionId, folder } = UploadSignSchema.parse(body);

    const cleanName = sanitizeFilename(filename);
    const safeFolder = folder && folder.trim() ? folder.trim() : 'uploads';
    const safeSession = sessionId && sessionId.trim() ? sessionId.trim() : 'anonymous';
    const key = `${safeFolder}/${safeSession}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

    const client = getS3Client();
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });
    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const uploadUrl = await getSignedUrl(client, uploadCommand, { expiresIn: EXPIRY_SECONDS });
    const downloadUrl = await getSignedUrl(client, downloadCommand, { expiresIn: EXPIRY_SECONDS });

    return NextResponse.json({
      uploadUrl,
      downloadUrl,
      key,
      expiresIn: EXPIRY_SECONDS,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to create signed upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
