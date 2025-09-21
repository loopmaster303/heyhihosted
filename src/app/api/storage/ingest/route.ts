import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/webm',
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB cap

function extFromContentType(ct: string | null | undefined): string | null {
  if (!ct) return null;
  if (ct.includes('image/webp')) return 'webp';
  if (ct.includes('image/jpeg')) return 'jpg';
  if (ct.includes('image/png')) return 'png';
  if (ct.includes('image/gif')) return 'gif';
  if (ct.includes('video/mp4')) return 'mp4';
  if (ct.includes('video/webm')) return 'webm';
  return null;
}

function extFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (!m) return null;
    const ext = m[1];
    if (['webp', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
    return null;
  } catch {
    return null;
  }
}

function isAllowedContentType(ct: string | null | undefined): boolean {
  if (!ct) return false;
  for (const allowed of ALLOWED_CONTENT_TYPES) {
    if (ct.includes(allowed)) return true;
  }
  return false;
}

function yyyymmdd(d = new Date()): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export async function POST(req: NextRequest) {
  try {
    const { slug, sourceUrl, filename, contentType: contentTypeHint } = await req.json();

    if (!slug || typeof slug !== 'string' || !/^g_[a-z0-9]{8,}$/i.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return NextResponse.json({ error: 'Missing sourceUrl' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'galleries';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase not configured on server' }, { status: 500 });
    }

    // Try to peek headers for size and type
    let contentType: string | null = null;
    let contentLength: number | null = null;
    try {
      const headRes = await fetch(sourceUrl, { method: 'HEAD' });
      if (headRes.ok) {
        const ct = headRes.headers.get('content-type');
        const cl = headRes.headers.get('content-length');
        if (ct) contentType = ct;
        if (cl && !Number.isNaN(Number(cl))) contentLength = Number(cl);
      }
    } catch {}

    // Fallback to hint or URL
    if (!contentType && typeof contentTypeHint === 'string') contentType = contentTypeHint;
    if (!contentType) {
      const ext = extFromUrl(sourceUrl);
      if (ext === 'jpg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'webm') contentType = 'video/webm';
    }

    if (!contentType || !isAllowedContentType(contentType)) {
      return NextResponse.json({ error: `Unsupported or unknown content-type: ${contentType || 'n/a'}` }, { status: 415 });
    }

    if (contentLength && contentLength > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (${contentLength} bytes)` }, { status: 413 });
    }

    // Download the file (limit size by checking after download if needed)
    const fileRes = await fetch(sourceUrl);
    if (!fileRes.ok) {
      const t = await fileRes.text().catch(() => '');
      return NextResponse.json({ error: `Source fetch failed: ${fileRes.status} ${t}` }, { status: 502 });
    }
    const buf = Buffer.from(await fileRes.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (${buf.byteLength} bytes)` }, { status: 413 });
    }

    // Compute hash & path
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    let ext = extFromContentType(contentType) || extFromUrl(sourceUrl) || 'bin';
    if (ext === 'jpeg') ext = 'jpg';
    const day = yyyymmdd();
    const safeBase = (filename && typeof filename === 'string') ? filename.replace(/[^a-zA-Z0-9._-]+/g, '_') : `${hash}.${ext}`;
    const objectPath = `${slug}/${day}/${safeBase}`;

    // Upload to Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${objectPath}`;
    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: buf,
    });

    if (!upRes.ok) {
      const errText = await upRes.text().catch(() => '');
      return NextResponse.json({ error: `Supabase upload failed: ${upRes.status} ${errText}` }, { status: 500 });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${objectPath}`;
    return NextResponse.json({
      publicUrl,
      path: objectPath,
      size: buf.byteLength,
      contentType,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

