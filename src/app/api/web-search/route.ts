
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

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Elixposearch API request failed with status ${response.status}: ${responseText}` },
        { status: response.status }
      );
    }
    
    // Attempt to parse as JSON. If successful and it's an array, it's likely search results.
    // Otherwise, it's treated as a plain text response from the underlying AI.
    try {
        const results = JSON.parse(responseText);
        if (Array.isArray(results)) {
            // It's a list of search results
            return NextResponse.json({ type: 'results', data: results });
        }
        // It's some other JSON object, treat as plain text for simplicity
        return NextResponse.json({ type: 'text', data: responseText.trim() });
    } catch (e) {
        // If parsing fails, the response is definitely plain text.
        return NextResponse.json({ type: 'text', data: responseText.trim() });
    }

  } catch (error: any) {
    console.error('Error in /api/web-search:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
