import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing BLOB_READ_WRITE_TOKEN' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create a unique path; keep names simple to avoid URL issues.
    const filename = file.name ? file.name.replace(/\s+/g, '_') : 'upload.bin';
    const key = `uploads/${Date.now()}-${filename}`;

    const blob = await put(key, file, {
      access: 'public',
      token,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
