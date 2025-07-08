
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { token } = body;

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ isValid: false, error: 'Token is required' }, { status: 400 });
  }

  try {
    const tokenRef = firestore.collection('usage_tokens').doc(token);
    const doc = await tokenRef.get();

    if (!doc.exists) {
      return NextResponse.json({ isValid: false, remainingUses: 0, error: 'Invalid token' });
    }

    const data = doc.data();
    if (!data || typeof data.totalUses !== 'number' || typeof data.currentUses !== 'number') {
        console.error("Malformed token data in Firestore for token:", token);
        return NextResponse.json({ isValid: false, remainingUses: 0, error: 'Token data is malformed on server' });
    }

    const remainingUses = Math.max(0, data.totalUses - data.currentUses);
    
    return NextResponse.json({ isValid: true, remainingUses });

  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ isValid: false, error: 'Internal server error' }, { status: 500 });
  }
}
