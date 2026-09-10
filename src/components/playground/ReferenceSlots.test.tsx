import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

// Nur die Dexie-Aufrufe werden ersetzt: Dexie braucht IndexedDB, das jsdom
// nicht hat. Die Handle-Erkennung kommt aus dem echten Modul, damit der Test
// nicht eine zweite Kopie derselben Regel prueft.
jest.mock('@/lib/upload/pruna-reference-preview', () => ({
  ...jest.requireActual('@/lib/upload/pruna-reference-preview'),
  getPrunaReferencePreviews: jest.fn(async () => new Map()),
  rememberPrunaReferencePreview: jest.fn(async () => {}),
  forgetPrunaReferencePreview: jest.fn(async () => {}),
}));

import { ReferenceSlots, uploadPlaygroundReference } from './ReferenceSlots';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import {
  forgetPrunaReferencePreview,
  getPrunaReferencePreviews,
  rememberPrunaReferencePreview,
} from '@/lib/upload/pruna-reference-preview';

// jsdom kennt keine Objekt-URLs; BlobManager erzeugt daraus die Vorschau.
let objectUrlCounter = 0;
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: jest.fn(() => `blob:reference-preview-${++objectUrlCounter}`),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: jest.fn(),
});

const PRUNA_HANDLE =
  'https://api.pruna.ai/v1/files/NTNlZjczNmEtNzM1Mi00NTliLWIzZWYtMDc3ZWM1NzM3YTQ4.jpeg';

/** Antwortet wie der echte Cache: nur, was gefragt wurde. */
function servePreview(blob: Blob) {
  const entries: Array<[string, Blob]> = [[PRUNA_HANDLE, blob]];
  (getPrunaReferencePreviews as jest.Mock).mockImplementation(async (handles: string[]) =>
    new Map(entries.filter(([handle]) => handles.includes(handle)))
  );
}

function model(overrides: Partial<PlaygroundModelEntry> = {}): PlaygroundModelEntry {
  return {
    id: 'wan-i2v',
    name: 'Wan I2V',
    provider: 'pruna',
    kind: 'video',
    supportsReference: true,
    requiresReference: true,
    maxImages: 2,
    referenceMode: 'start-end-frame',
    unmapped: false,
    supportsEndFrame: false,
    supportsAudio: false,
    paidOnly: true,
    community: false,
    ...overrides,
  };
}

describe('ReferenceSlots', () => {
  beforeEach(() => {
    (getPrunaReferencePreviews as jest.Mock).mockImplementation(async () => new Map());
    (forgetPrunaReferencePreview as jest.Mock).mockImplementation(async () => {});
  });

  it('renders nothing when the model does not support references', () => {
    const { container } = render(
      <ReferenceSlots
        model={model({ supportsReference: false, maxImages: 0 })}
        uploads={[]}
        onChange={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });


  it('removing a filled slot calls onChange without that url', () => {
    const onChange = jest.fn();
    render(
      <ReferenceSlots
        model={model()}
        uploads={['https://x/a.png', 'https://x/b.png']}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start entfernen' }));
    expect(onChange).toHaveBeenCalledWith(['https://x/b.png']);
  });

  // Nicht zehn leere Kaesten: immer nur der naechste freie Platz, das Limit
  // steht als Hinweis darueber.
  it('shows one empty slot at a time and names the limit', () => {
    render(<ReferenceSlots model={model({ maxImages: 5, referenceMode: undefined })} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText('0 von bis zu 5 Bildern')).toBeInTheDocument();
    expect(screen.getAllByText(/^#\d$/)).toHaveLength(1);
  });

  it('reveals the next slot once one is filled', () => {
    render(
      <ReferenceSlots
        model={model({ maxImages: 5, referenceMode: undefined })}
        uploads={['https://x/a.png']}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('1 von bis zu 5 Bildern')).toBeInTheDocument();
    // Ein gefuellter Platz plus ein freier.
    expect(screen.getByRole('button', { name: /entfernen/ })).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('stops adding slots at the limit', () => {
    render(
      <ReferenceSlots
        model={model({ maxImages: 2, referenceMode: undefined })}
        uploads={['https://x/a.png', 'https://x/b.png']}
        onChange={() => {}}
      />
    );
    expect(screen.getAllByRole('button', { name: /entfernen/ })).toHaveLength(2);
    expect(screen.queryByText('#3')).not.toBeInTheDocument();
  });

  it('reports a failed upload instead of silently doing nothing', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 413,
      text: async () => 'file too large',
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    const onChange = jest.fn();

    try {
      const { container } = render(
        <ReferenceSlots model={model({ maxImages: 1, referenceMode: undefined })} uploads={[]} onChange={onChange} />
      );
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['x'], 'shot.png', { type: 'image/png' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(await screen.findByRole('alert')).toHaveTextContent('shot.png');
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  // Das Endframe ergibt sich aus derselben Regel: ohne Startframe kein zweiter Platz.
  it('unlocks the end frame only after a start frame', () => {
    const { rerender } = render(<ReferenceSlots model={model()} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.queryByText('Ende')).not.toBeInTheDocument();

    rerender(<ReferenceSlots model={model()} uploads={['https://x/start.png']} onChange={() => {}} />);
    expect(screen.getByText('Ende')).toBeInTheDocument();
  });

  // Pruna liefert mit urls.get eine API-Referenz, keine Bildadresse: ein
  // <img src={handle}> ist garantiert kaputt (GET /v1/files/<id> -> 404) und
  // zeigte nur das Broken-Image-Symbol mit herausquellendem Alt-Text.
  it('shows a placeholder for a Pruna handle without a cached preview', async () => {
    const { container } = render(
      <ReferenceSlots model={model()} uploads={[PRUNA_HANDLE]} onChange={() => {}} />
    );

    expect(await screen.findByText('Vorschau fehlt')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    // Der Platz bleibt bedienbar: entfernen geht weiter.
    expect(screen.getByRole('button', { name: 'Start entfernen' })).toBeInTheDocument();
  });

  it('renders the cached preview for a Pruna handle', async () => {
    servePreview(new Blob(['x'], { type: 'image/png' }));

    const { container } = render(
      <ReferenceSlots model={model()} uploads={[PRUNA_HANDLE]} onChange={() => {}} />
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toMatch(/^blob:reference-preview-\d+$/);
    expect(container.querySelector('img')).toBe(image);
    expect(screen.queryByText('Vorschau fehlt')).not.toBeInTheDocument();
  });

  it('keeps loading references that are not Pruna handles straight from the URL', () => {
    const { container } = render(
      <ReferenceSlots model={model()} uploads={['https://x/a.png']} onChange={() => {}} />
    );

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://x/a.png');
  });

  // Sonst sammeln sich Handles samt Bytes in IndexedDB, die niemand mehr sieht.
  it('drops the cached preview when the reference is removed', async () => {
    render(<ReferenceSlots model={model()} uploads={[PRUNA_HANDLE]} onChange={() => {}} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Start entfernen' }));

    await waitFor(() => expect(forgetPrunaReferencePreview).toHaveBeenCalledWith(PRUNA_HANDLE));
  });

  // Ein Wechsel der Ansicht ist kein Entfernen: derselbe Handle kann in einer
  // anderen Liste haengen. Nur die Objekt-URL geht zurueck.
  it('releases the preview URL when the reference leaves the view without deleting the cache', async () => {
    servePreview(new Blob(['x'], { type: 'image/png' }));

    const { rerender } = render(
      <ReferenceSlots model={model()} uploads={[PRUNA_HANDLE]} onChange={() => {}} />
    );
    const image = await screen.findByRole('img');

    rerender(<ReferenceSlots model={model()} uploads={[]} onChange={() => {}} />);

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.getAttribute('src')));
    expect(forgetPrunaReferencePreview).not.toHaveBeenCalled();
  });
});


/**
 * Der Upload schickte nie die BYOP-Keys mit. Serverseitig sah `resolvePrunaKey`
 * darum nur die Env-Variable und antwortete mit 503 — obwohl der Key in den
 * Einstellungen lag. Der Generate-Aufruf schickte ihn laengst mit, nur der
 * Upload davor nicht, also scheiterte jedes Referenzbild bei Pruna-Modellen.
 */
describe('uploadPlaygroundReference', () => {
  const file = () => new File([new Uint8Array([1, 2, 3])], 'ref.png', { type: 'image/png' });

  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://x/ref.png' }),
    });
  });

  it('sends the stored Pruna key to the Pruna upload route', async () => {
    localStorage.setItem('prunaApiKey', 'pruna_secret');

    await uploadPlaygroundReference(file(), 'pruna');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/pruna/upload');
    expect(init.headers['X-Pruna-Key']).toBe('pruna_secret');
    expect(init.headers['Content-Type']).toBe('image/png');
  });

  // Die Bytes liegen beim Upload im Browser — genau dort entsteht die
  // Vorschau, die der Slot danach anzeigt.
  it('remembers a local preview for the uploaded Pruna handle', async () => {
    const uploaded = new File([new Uint8Array([1, 2, 3])], 'ref.png', { type: 'image/png' });

    const handle = await uploadPlaygroundReference(uploaded, 'pruna');

    expect(handle).toBe('https://x/ref.png');
    expect(rememberPrunaReferencePreview).toHaveBeenCalledWith('https://x/ref.png', uploaded);
  });

  it('sends the stored Pollen key to the media upload route', async () => {
    localStorage.setItem('pollenApiKey', 'pollen_secret');

    await uploadPlaygroundReference(file(), 'pollinations');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/media/upload');
    expect(init.headers['X-Pollen-Key']).toBe('pollen_secret');
  });

  it('never sends multipart — the routes reject it with 415', async () => {
    await uploadPlaygroundReference(file(), 'pruna');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeInstanceOf(File);
    expect(String(init.headers['Content-Type'])).not.toContain('multipart');
  });

  it('omits key headers entirely when nothing is stored', async () => {
    await uploadPlaygroundReference(file(), 'pruna');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['X-Pruna-Key']).toBeUndefined();
    expect(init.headers['X-Pollen-Key']).toBeUndefined();
  });

  it('surfaces the server error message instead of the bare status code', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'A Pruna API key is required' }),
    });

    await expect(uploadPlaygroundReference(file(), 'pruna'))
      .rejects.toThrow('A Pruna API key is required');
  });
});
