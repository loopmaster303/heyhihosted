import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug || !/^g_[a-z0-9]{8,}$/i.test(slug)) {
      return NextResponse.json({ error: 'Invalid or missing slug' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'galleries';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase not configured on server' }, { status: 500 });
    }

    const listUrl = `${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(BUCKET)}`;
    const body = {
      prefix: `${slug}/`,
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' as const },
    };

    const res = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json({ error: `Supabase list failed: ${res.status} ${t}` }, { status: 500 });
    }

    const entries = await res.json();
    // entries is an array of objects with { name, id, updated_at, created_at, last_accessed_at, metadata, ... }
    const items = (entries || []).filter((e: any) => e && e.name).map((e: any) => ({
      name: e.name,
      path: `${slug}/${e.name}`,
      size: e.metadata?.size ?? null,
      contentType: e.metadata?.mimetype ?? null,
      createdAt: e.created_at ?? null,
      publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${slug}/${e.name}`,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

