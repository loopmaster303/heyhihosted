
import { NextResponse } from 'next/server';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  console.log('\n--- NEUE ANFRAGE an /api/generate-bfl ---');
  try {
    const body = await request.json();
    console.log('1. Frontend-Body empfangen:', body);

    const { prompt, model, input_image, aspect_ratio, ...restParams } = body;

    if (!prompt && !input_image) {
      console.error('Fehler: Weder Prompt noch Bild vorhanden.');
      return NextResponse.json({ error: 'Prompt oder Bild ist erforderlich.' }, { status: 400 });
    }

    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
      console.error('Fehler: BFL_API_KEY nicht gefunden in .env');
      return NextResponse.json({ error: 'BFL_API_KEY nicht konfiguriert.' }, { status: 500 });
    }

    // BFL API differentiation for text-to-image vs image-to-image (FLUX Kontext)
    // The 'model' field in payload to BFL is crucial.
    // For image-to-image with FLUX Kontext, the model is implicitly flux-kontext-pro via endpoint.
    // For text-to-image, you specify the model in the payload (e.g., 'flux', 'dalle-3')
    let jobStartUrl;
    const payload: any = { prompt, aspect_ratio, ...restParams };

    if (input_image && typeof input_image === 'string' && input_image.startsWith('data:')) {
      jobStartUrl = `https://api.bfl.ai/v1/flux-kontext-pro`; // Image-to-Image endpoint
      const base64Image = input_image.split(',')[1];
      payload.input_image = base64Image;
      // 'model' field is not typically sent for flux-kontext-pro endpoint itself in payload
      console.log('2a. Bilddaten zu reinem Base64 konvertiert für FLUX Kontext (Image-to-Image).');
    } else if (prompt && model) { // This case would be for text-to-image, if 'model' was passed
      jobStartUrl = `https://api.bfl.ai/v1/${model}`; // Text-to-Image endpoint (e.g. /v1/flux)
      payload.model = model; // Ensure model is in payload for text-to-image
      console.log(`2a. Kein Eingabebild. Bereite für Text-to-Image mit Modell: ${model}.`);
    } else if (prompt) { // Fallback to a default text-to-image model if no image and no model specified from FE
      // This case might need adjustment based on how you want to handle text-only requests for FLUX Kontext tile
      // For now, let's assume if it hits this API, and input_image is not present, it's an error or needs a default model.
      // The frontend logic for ImageKontextTool currently ensures input_image or prompt is there, and uses model='flux-kontext-pro' implicitly via URL
      console.warn('Warnung: Prompt ohne input_image und ohne explizites Text-To-Image-Modell. BFL-Logik dafür prüfen.');
      // Defaulting to FLUX for text-to-image if no image and no specific model from FE for this route
      payload.model = 'flux'; // A default text-to-image model
      jobStartUrl = `https://api.bfl.ai/v1/${payload.model}`;
      console.log(`2a. Kein Eingabebild. Nutze Default Text-to-Image Modell: ${payload.model}.`);
    } else {
        console.error('Fehler: Ungültige Anfragekonfiguration.');
        return NextResponse.json({ error: 'Ungültige Anfragekonfiguration. Prompt oder Bild benötigt.' }, { status: 400 });
    }

    console.log(`2b. Sende Payload an BFL (${jobStartUrl}):`, JSON.stringify(OmitSensitiveData(payload), null, 2));

    const startJobResponse = await fetch(jobStartUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log(`3. Antwort-Status von BFL (Job Start): ${startJobResponse.status}`);

    if (!startJobResponse.ok) {
        const errorText = await startJobResponse.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            errorData = { error: "Failed to parse BFL error response", details: errorText };
        }
        console.error('4a. FEHLER von BFL (Job Start):', errorData);
        return NextResponse.json({ error: `BFL API Fehler (Job Start): ${errorData.error || JSON.stringify(errorData)}` }, { status: startJobResponse.status });
    }

    const job = await startJobResponse.json();
    console.log('4b. Erfolgreiche Antwort von BFL (Job Start):', job);

    const jobId = job.id;
    if (!jobId) {
      console.error('Fehler: Job ID nicht in BFL-Antwort enthalten.');
      return NextResponse.json({ error: 'BFL API Fehler: Job ID nicht erhalten.' }, { status: 500 });
    }

    let finalResult;
    const maxRetries = 30; // approx 60 seconds

    for (let i = 0; i < maxRetries; i++) {
      await sleep(2000); // 2 seconds delay

      let fetchUrl;
      // BFL's polling_url might already contain the ID or other parameters.
      if (job.polling_url) {
        // If polling_url is absolute and already has query params, it might be complete
        // If it's relative or needs the ID, construct it carefully.
        // Assuming polling_url might be a full URL like "https://api.bfl.ai/v1/some_status_endpoint?id=JOBID"
        // or just a base like "https://api.bfl.ai/v1/some_status_endpoint"
        if (job.polling_url.includes('?')) {
            fetchUrl = job.polling_url.includes(`id=${jobId}`) ? job.polling_url : `${job.polling_url}&id=${jobId}`;
        } else {
            fetchUrl = `${job.polling_url}?id=${jobId}`;
        }
      } else {
        // Default polling if no specific URL provided
        fetchUrl = `https://api.bfl.ai/v1/get_result?id=${jobId}`;
      }


      console.log(`5. Polling bei: ${fetchUrl} (Versuch ${i + 1}/${maxRetries})`);
      const getResultResponse = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-key': apiKey,
        }
      });

      console.log(`6. Polling-Antwort-Status: ${getResultResponse.status}`);
      if (!getResultResponse.ok) {
        const errorText = await getResultResponse.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch(e) {
            errorData = { error: "Failed to parse BFL polling error response", details: errorText };
        }
        console.error('Polling-Fehler:', errorData);
        // Don't throw immediately, could be a transient issue. Maybe retry or handle specific codes.
        // For now, if polling fails badly, we will eventually timeout.
        // If status is 404 (job not found), that might be a permanent error.
        if (getResultResponse.status === 404) {
            return NextResponse.json({ error: `BFL API Fehler: Job ${jobId} nicht gefunden beim Pollen.` }, { status: 404 });
        }
        // Continue polling for other errors for now.
      } else {
        const result = await getResultResponse.json();
        console.log(`7. Polling-Ergebnis: Status ist '${result.status}'`, result);

        if (result.status === 'Ready' || result.status === 'finished') { // Some APIs use 'finished'
          console.log('8. JOB ERFOLGREICH!');
          finalResult = result;
          break;
        }
        if (result.status === 'Failed' || result.status === 'Error' || result.status === 'failed') {
          console.error('Job fehlgeschlagen:', result);
          return NextResponse.json({ error: `BFL API Job ist fehlgeschlagen: ${JSON.stringify(result.error || result)}` }, { status: 500 });
        }
      }
    }

    if (!finalResult) {
        console.error('BFL API Job hat zu lange gedauert oder konnte nicht abgeschlossen werden.');
        return NextResponse.json({ error: 'BFL API Job hat zu lange gedauert oder konnte nicht abgeschlossen werden.' }, { status: 504 }); // Gateway Timeout
    }
    
    // Assuming the result structure contains a direct image URL or a path to it
    const temporaryImageUrl = finalResult.result?.sample || finalResult.result?.[0]?.url || finalResult.result?.url || finalResult.url || finalResult.output?.[0];

    if (!temporaryImageUrl) {
        console.error('Keine Bild-URL im finalen Ergebnis von BFL gefunden:', finalResult);
        return NextResponse.json({ error: 'Keine Bild-URL im finalen Ergebnis von BFL gefunden.' }, { status: 500 });
    }
    console.log('9. Finale Bild-URL von BFL:', temporaryImageUrl);

    const imageResponse = await fetch(temporaryImageUrl);
    if (!imageResponse.ok) {
        console.error(`Konnte finales Bild nicht von ${temporaryImageUrl} herunterladen. Status: ${imageResponse.status}`);
        return NextResponse.json({ error: 'Konnte finales Bild nicht herunterladen.' }, { status: 502 }); // Bad Gateway
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = imageResponse.headers.get('content-type') || 'image/png'; // Default to png
    const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;

    console.log('10. Bild erfolgreich als Data URL konvertiert. Sende an Frontend.');
    return NextResponse.json({ imageUrl: dataUrl });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler.';
    console.error('--- ENDE DER ANFRAGE MIT FEHLER ---', errorMessage, error.stack);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


function OmitSensitiveData(payload: any) {
    if (payload && payload.input_image && typeof payload.input_image === 'string' && payload.input_image.length > 100) {
        return { ...payload, input_image: payload.input_image.substring(0, 50) + '...[TRUNCATED]' };
    }
    return payload;
}
