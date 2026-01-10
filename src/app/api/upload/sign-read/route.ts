import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ReadSignSchema = z.object({
  key: z.string().min(1, 'key is required'),
});

const EXPIRY_SECONDS = 60 * 60;

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

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing AWS_S3_BUCKET' }, { status: 500 });
    }

    const body = await request.json();
    const { key } = ReadSignSchema.parse(body);

    const client = getS3Client();
    const downloadUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: EXPIRY_SECONDS }
    );

    return NextResponse.json({ downloadUrl, expiresIn: EXPIRY_SECONDS });
  } catch (error: any) {
    const message = error?.message || 'Failed to sign read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
