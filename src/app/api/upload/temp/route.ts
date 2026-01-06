import { NextResponse } from 'next/server';

/**
 * Temp Upload Relay
 * Uploads images to Catbox.moe anonymously to provide 
 * public URLs for Pollinations/Replicate models.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Blob for Catbox API
    const catboxData = new FormData();
    catboxData.append('reqtype', 'fileupload');
    catboxData.append('fileToUpload', file);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to temp storage');
    }

    const url = await response.text();

    return NextResponse.json({ url: url.trim() });
  } catch (error: any) {
    console.error('Temp upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
