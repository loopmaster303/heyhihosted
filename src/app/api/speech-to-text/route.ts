
import { NextResponse } from 'next/server';

// Speech-to-text functionality has been removed.
export async function POST(request: Request) {
    return NextResponse.json({ error: "This feature has been disabled." }, { status: 410 }); // 410 Gone
}
