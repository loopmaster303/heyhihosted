
import { NextResponse } from 'next/server';

// Text-to-speech functionality has been removed.
export async function POST(request: Request) {
  return NextResponse.json({ error: "This feature has been disabled." }, { status: 410 }); // 410 Gone
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
