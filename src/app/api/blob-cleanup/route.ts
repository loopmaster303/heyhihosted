import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export const runtime = 'nodejs';

// Default: delete uploads older than 30 minutes
const MAX_AGE_MS = 30 * 60 * 1000;
const UPLOAD_PREFIX = 'uploads/';

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing BLOB_READ_WRITE_TOKEN' },
      { status: 500 }
    );
  }

  try {
    const cutoff = Date.now() - MAX_AGE_MS;
    const res = await list({
      token,
      prefix: UPLOAD_PREFIX,
      limit: 1000, // safety cap per run
    });

    const targets = res.blobs.filter((b) => {
      const match = b.pathname.match(/uploads\/(\d+)-/);
      if (!match) return false;
      const ts = Number(match[1]);
      return Number.isFinite(ts) && ts < cutoff;
    });

    let deleted = 0;
    for (const blob of targets) {
      await del(blob.url, { token });
      deleted += 1;
    }

    return NextResponse.json({
      deleted,
      scanned: res.blobs.length,
      maxAgeMinutes: MAX_AGE_MS / 60000,
    });
  } catch (error) {
    console.error('Blob cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
