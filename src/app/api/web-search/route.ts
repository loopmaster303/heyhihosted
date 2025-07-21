
import { NextResponse } from 'next/server';

const ELIXPOSEARCH_API_URL = 'https://text.pollinations.ai/search';

// This function will handle the search request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ error: 'Query is required and must be a non-empty string.' }, { status: 400 });
    }

    const searchUrl = `${ELIXPOSEARCH_API_URL}?q=${encodeURIComponent(query.trim())}`;
    
    // Using the Pollinations API token for authorization if available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.POLLINATIONS_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.POLLINATIONS_API_TOKEN}`;
    }

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Elixposearch API request failed with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    const results = await response.json();
    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Error in /api/web-search:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
