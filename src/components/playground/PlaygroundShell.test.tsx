/**
 * Integration smoke test for PlaygroundShell — the only wiring layer of the
 * Playground. Covers the loading state, the presence of every core control,
 * and the send gating. The generate flow itself lives in playground.e2e.test.tsx.
 *
 * usePlaygroundState runs for real so the shell's actual wiring is exercised.
 * Everything that reaches for ESM-only packages (lucide, the Radix/vaul/framer
 * based ui components) is stubbed — jest does not transform node_modules.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DropdownMenuItem: ({ children, onSelect, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) => (
    <button onClick={onSelect} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

// value/onValueChange statt value/onChange — der reale Slider ist Radix.
// Ungefiltert durchgereicht (`{...props}`) landen beide als unbekannte
// DOM-Attribute auf dem <input> und React beschwert sich doppelt (unbekanntes
// Event-Handler-Property, dazu ein value ohne onChange). p-video-2 ist das
// erste Modell in dieser Datei mit einem "seconds"-Feld (Dauer) und damit das
// erste, das den Slider ueberhaupt rendert — die uebrigen Tests trifft das
// nicht. Gleiche Uebersetzung wie in ParamControls.test.tsx.
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value: number[]; onValueChange: (v: number[]) => void }) => (
    <input type="range" value={value[0]} onChange={(e) => onValueChange([Number(e.target.value)])} />
  ),
}));

// P-Video 2's Schema zeigt "Automatische Dauer" als boolesches Feld im
// Hauptbereich (nicht hinter "Erweitert" versteckt) — anders als bei Flux
// (dem Dummy-Modell der uebrigen Tests) rendert die Shell damit erstmals
// einen Switch. Radix + framer-motion sind ESM und werden von jest nicht
// transformiert, deshalb hier derselbe Stub wie in ParamControls.test.tsx.
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  ),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'de', setLanguage: jest.fn() }),
}));

jest.mock('@/hooks/usePlaygroundModels', () => ({ usePlaygroundModels: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/useHasPollenKey', () => ({ useHasPollenKey: () => true }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: () => false }));

// Der Erzeugungsweg fuer den Fertig-Hinweis: eine fertige JSON-Antwort, ein
// gespeichertes Asset, ein beobachtbarer Toast.
jest.mock('@/lib/generation/request-generation', () => ({
  requestGeneration: jest.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ imageUrl: 'https://x/neu.png' }),
  })),
  pollPrediction: jest.fn(),
}));
jest.mock('@/lib/services/output-service', () => ({
  OutputService: { saveGeneratedAsset: jest.fn(async () => 'neu-1') },
}));
jest.mock('@/hooks/use-toast', () => ({ toast: jest.fn() }));
jest.mock('@/components/ui/toast', () => ({
  ToastAction: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

jest.mock('@/lib/services/database', () => {
  const rows = [
    { id: 'g1', remoteUrl: 'https://x/g.png', prompt: 'gallery item', modelId: 'flux', conversationId: '__playground__', timestamp: 1, contentType: 'image/png', params: { seed: 7 } },
  ];
  return {
    db: {
      assets: {
        orderBy: () => ({
          reverse: () => ({
            filter: (pred: (a: Record<string, unknown>) => boolean) => ({
              limit: () => ({
                toArray: async () => rows.filter(pred),
              }),
            }),
          }),
        }),
      },
    },
  };
});

import { PlaygroundShell } from './PlaygroundShell';
import { ShellContext } from '@/components/shell/ShellContext';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import { toast } from '@/hooks/use-toast';
import { OutputService } from '@/lib/services/output-service';
import { saveStoredRun } from '@/lib/generation/run-store';
import { pollPrediction, requestGeneration } from '@/lib/generation/request-generation';

const DUMMY_MODEL = {
  id: 'flux',
  name: 'Dummy Flux',
  provider: 'pollinations' as const,
  kind: 'image' as const,
  supportsReference: false,
  requiresReference: false,
  maxImages: 0,
  unmapped: false,
};

// PlaygroundModelEntry-Fixture fuer P-Video 2, wie sie buildPrunaEntries()
// (src/lib/playground/model-source.ts) fuer die registrierte Pruna-ID liefert:
// Video, Start/Ende-Referenz, kostenpflichtig, aber ueber den eigenen
// Pruna-Schluessel lauffaehig.
const P_VIDEO_2_MODEL = {
  id: 'p-video-2',
  name: 'P-Video 2',
  provider: 'pruna' as const,
  kind: 'video' as const,
  supportsReference: true,
  requiresReference: false,
  maxImages: 2,
  referenceMode: 'start-end-frame' as const,
  unmapped: false,
  supportsEndFrame: true,
  supportsAudio: true,
  paidOnly: true,
  community: false,
  runnableOnKey: true,
};

const P_VIDEO_2_PRO_MODEL = {
  id: 'p-video-2-pro',
  name: 'P-Video 2 Pro',
  provider: 'pruna' as const,
  kind: 'video' as const,
  supportsReference: true,
  requiresReference: false,
  maxImages: 2,
  referenceMode: 'start-end-frame' as const,
  unmapped: false,
  supportsEndFrame: true,
  supportsAudio: true,
  paidOnly: true,
  community: false,
  runnableOnKey: true,
};

// Die Smoke-Suite mockt den Erzeugungsweg weg; die P-Video-Durchlaeufe pruefen
// ihn selbst und lassen deshalb den echten Weg bis zum fetch-Spy durch.
function useRealGenerationRequests() {
  const actual = jest.requireActual('@/lib/generation/request-generation');
  (requestGeneration as jest.Mock).mockImplementation(actual.requestGeneration);
  (pollPrediction as jest.Mock).mockImplementation(actual.pollPrediction);
}

function mockHooks(overrides: Record<string, unknown> = {}) {
  (usePlaygroundModels as jest.Mock).mockReturnValue({
    entries: [DUMMY_MODEL],
    loading: false,
    error: null,
    fallbackActive: false,
    reload: jest.fn(),
    ...overrides,
  });
  (usePollenKey as jest.Mock).mockReturnValue({
    pollenKey: null,
    isConnected: false,
    connectManual: jest.fn(),
    disconnect: jest.fn(),
  });
  (useProviderMode as jest.Mock).mockReturnValue({
    providerMode: 'pollinations',
    setProviderMode: jest.fn(),
    prunaAvailable: true,
  });
}

describe('PlaygroundShell smoke', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockHooks();
    // jest.setup stubbt matchMedia mit matches:false (= schmaler Viewport).
    // Die Shell-Tests laufen auf Desktop: breite Viewports melden.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes('1280'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('renders without crashing while the model list is loading', async () => {
    mockHooks({ entries: [], loading: true });
    render(<PlaygroundShell />);

    expect(screen.getByText('Lädt…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();

    // Gallery laedt unabhaengig vom Modell-Ladezustand per (gemocktem)
    // db.assets...toArray() nach — ein `await` in ihrem useEffect. Ohne
    // diesen Abschluss abzuwarten, laeuft dieser (ohnehin schon synchrone)
    // Test durch, bevor der Microtask feuert, und React meldet ein
    // State-Update ausserhalb von act() im naechsten Test.
    expect(await screen.findByText('flux')).toBeInTheDocument();
  });

  it('renders every core control once a model is loaded', async () => {
    render(<PlaygroundShell />);

    // Provider picker
    expect(screen.getAllByText('Pollinations').length).toBeGreaterThan(0);
    // Mode tabs
    expect(screen.getByRole('tab', { name: 't2i' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    // Model picker resolved the dummy entry
    expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0);
    // Prompt bar
    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
    // Raumwechsel und Einstellungen gehoeren der Huelle — Create traegt keine
    // eigene Kopfzeile mehr, also auch keinen Rueckweg-Link.
    expect(screen.queryByRole('link', { name: 'Zurück zum Chat' })).not.toBeInTheDocument();
    // Gallery renders the stored row
    expect(await screen.findByText('flux')).toBeInTheDocument();
  });

  it('keeps Senden disabled while the prompt is empty', async () => {
    render(<PlaygroundShell />);
    await waitFor(() => expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
  });

  it('enables Senden after typing a prompt', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await waitFor(() => expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0));

    await user.type(screen.getByLabelText('Prompt'), 'ein roter Fuchs');

    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled();
  });

  it('takes a handoff from the chat: prompt lands in the composer, nothing is sent', async () => {
    const consumeHandoff = jest.fn();
    const shell = {
      space: 'create' as const,
      goToSpace: jest.fn(),
      panel: null,
      openPanel: jest.fn(),
      closePanel: jest.fn(),
      createHandoff: { id: 7, prompt: 'ein roter Fuchs im Schnee', modelId: 'flux' },
      handoffToCreate: jest.fn(),
      consumeHandoff,
      openLightbox: jest.fn(),
    };
    render(
      <ShellContext.Provider value={shell}>
        <PlaygroundShell />
      </ShellContext.Provider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Prompt')).toHaveValue('ein roter Fuchs im Schnee'));
    expect(consumeHandoff).toHaveBeenCalledWith(7);
  });

  it('loads a stored result into the composer via Nochmal — without auto-sending', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    // Karte waehlen -> Rail zeigt die gespeicherten Parameter als Chips
    const card = await screen.findByRole('button', { name: /gallery item/ });
    await user.click(card);
    expect(await screen.findByText('seed 7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nochmal' }));
    expect(screen.getByLabelText('Prompt')).toHaveValue('gallery item');
    // Kein Auto-Senden: der Senden-Knopf wartet weiter auf den Nutzer
    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled();
  });

  it('refuses to adopt a reference for a model that takes none', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    const card = await screen.findByRole('button', { name: /gallery item/ });
    await user.click(card);
    await user.click(screen.getByRole('button', { name: /Als Referenz übernehmen/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('nimmt keine Referenzbilder');
  });

  it('stops adopting references once maxImages is reached', async () => {
    mockHooks({
      entries: [{ ...DUMMY_MODEL, supportsReference: true, maxImages: 1 }],
    });
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    const card = await screen.findByRole('button', { name: /gallery item/ });
    await user.click(card);

    const adopt = screen.getByRole('button', { name: /Als Referenz übernehmen/ });
    await user.click(adopt);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(adopt);
    expect(await screen.findByRole('alert')).toHaveTextContent('höchstens 1 Referenzbild');
  });

  it('opens the details as a bottom drawer on narrow viewports', async () => {
    // Schmaler Viewport (wie in jest.setup): keine Media-Query matcht.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    const card = await screen.findByRole('button', { name: /gallery item/ });
    await user.click(card);

    // Rail (unsichtbar unter xl) UND Drawer zeigen die Details an.
    expect((await screen.findAllByText('seed 7')).length).toBe(2);
  });

  function shellIn(space: 'chat' | 'create') {
    return {
      space,
      goToSpace: jest.fn(),
      panel: null,
      openPanel: jest.fn(),
      closePanel: jest.fn(),
      createHandoff: null,
      handoffToCreate: jest.fn(),
      consumeHandoff: jest.fn(),
      openLightbox: jest.fn(),
    };
  }

  async function sendOnePrompt() {
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0));
    await user.type(screen.getByLabelText('Prompt'), 'ein roter Fuchs');
    await user.click(screen.getByRole('button', { name: 'Senden' }));
  }

  it('announces a finished run while you are in the chat (E13)', async () => {
    render(
      <ShellContext.Provider value={shellIn('chat')}>
        <PlaygroundShell />
      </ShellContext.Provider>,
    );
    await sendOnePrompt();

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Bild fertig' })));
  });

  it('stays quiet when the run finishes in front of you', async () => {
    render(
      <ShellContext.Provider value={shellIn('create')}>
        <PlaygroundShell />
      </ShellContext.Provider>,
    );
    await sendOnePrompt();

    // Das Ergebnis ist gespeichert — erst dann waere ein Hinweis gefallen.
    const { OutputService } = jest.requireMock('@/lib/services/output-service');
    await waitFor(() => expect(OutputService.saveGeneratedAsset).toHaveBeenCalled());
    expect(toast).not.toHaveBeenCalled();
  });
});

/**
 * Aufgabe 4 — Integrierte Abnahme fuer P-Video 2: Modellauswahl, Parameter-
 * transport (inkl. Auto-Dauer) und Wiederholung mit eingefrorenem Request.
 * fetch ist hier (anders als in der Smoke-Suite oben) ein echter Spy, weil
 * der Sendefluss selbst geprüft wird, nicht nur das Rendering.
 */
describe('PlaygroundShell generate flow: P-Video 2', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    useRealGenerationRequests();
    mockHooks({ entries: [DUMMY_MODEL, P_VIDEO_2_MODEL] });
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes('1280'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    // L-K.2: ein Pruna-Lauf fragt einmal per window.confirm nach, ob der
    // Nutzer die Nicht-Abbrechbarkeit akzeptiert. Hier schon bestaetigt, sonst
    // haengt der Sendefluss am (in jsdom nicht gemockten) Dialog.
    localStorage.setItem('heyhi_pruna_irreversible_ack', '1');
  });

  /** t2i (Vorgabe) -> t2v wechseln, wo im Fixture-Katalog nur P-Video 2 steht. */
  async function selectPVideo2(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() => expect(screen.queryByText('Lädt…')).not.toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: 't2v' }));
    await waitFor(() => expect(screen.getAllByText('P-Video 2').length).toBeGreaterThan(0));
  }

  it('sendet P-Video 2 mit Parametern und speichert das Ergebnis als Video mit Modell-ID', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('asset-p-video-2');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ videoUrl: 'https://x/out.mp4' }),
    });

    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await selectPVideo2(user);

    // Automatische Dauer an: die feste Dauer verschwindet aus dem Regler und
    // muss aus BEIDEN Request-Ebenen verschwinden (oberste Ebene und params).
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '1080p' }));
    await user.click(screen.getByRole('button', { name: '48 fps' }));
    await user.type(screen.getByLabelText('Prompt'), 'ein Zeitraffer über der Stadt');
    await user.click(screen.getByRole('button', { name: 'Senden' }));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(1));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/generate');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('p-video-2');
    expect(body.resolution).toBe('1080p');
    expect(body.duration).toBeUndefined();
    expect(body.params.duration_auto).toBeUndefined();
    expect(body.params.duration).toBeUndefined();
    expect(body.params).toMatchObject({ resolution: '1080p', fps: '48', aspect_ratio: '16:9' });

    // Das gespeicherte Ergebnis traegt die Modell-ID und ist als Video markiert;
    // die Composer-Parameter (inkl. duration_auto) bleiben fuer "Nochmal" erhalten
    // — nur der upstream-Request wurde bereinigt, nicht der gesicherte Zustand.
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://x/out.mp4',
      prompt: 'ein Zeitraffer über der Stadt',
      modelId: 'p-video-2',
      isVideo: true,
      params: expect.objectContaining({ duration_auto: true, resolution: '1080p', fps: '48' }),
    }));
  });

  it('Erneut versuchen sendet den eingefrorenen Request — Auto-Dauer bleibt trotz Parameteränderung ausgelassen', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('asset-p-video-2');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'upstream kaputt' }),
    });

    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await selectPVideo2(user);

    // Erster Versuch mit Auto-Dauer an — schlaegt fehl.
    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText('Prompt'), 'ein Zeitraffer über der Stadt');
    await user.click(screen.getByRole('button', { name: 'Senden' }));
    await screen.findByRole('button', { name: 'Erneut versuchen' });

    const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(firstBody.duration).toBeUndefined();
    expect(firstBody.params.duration_auto).toBeUndefined();
    expect(firstBody.params.duration).toBeUndefined();

    // Der Nutzer aendert den Composer, BEVOR er den Neuversuch anstoesst:
    // Auto-Dauer wieder aus (feste Dauer waere jetzt Teil eines neuen Sends)
    // und ein neuer Auflösungswert.
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '1080p' }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ videoUrl: 'https://x/out.mp4' }),
    });
    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(2));
    const retryBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    // Der Retry ist der eingefrorene erste Request, nicht der veraenderte
    // Composer-Zustand: identischer Body, weiterhin ohne Dauer-Felder.
    expect(retryBody).toEqual(firstBody);
    expect(retryBody.resolution).not.toBe('1080p');
    expect(retryBody.duration).toBeUndefined();
    expect(retryBody.params.duration_auto).toBeUndefined();
    expect(retryBody.params.duration).toBeUndefined();

    // Der erfolgreiche Retry speichert wie ein Erstversuch. Das hier
    // abzuwarten haelt den anschliessenden Galerie-Refresh (setGalleryKey)
    // noch innerhalb des Tests, statt ihn unbeobachtet auslaufen zu lassen.
    await waitFor(() => expect(OutputService.saveGeneratedAsset).toHaveBeenCalledTimes(1));
  });
});

describe('PlaygroundShell generate flow: P-Video 2 Pro', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    useRealGenerationRequests();
    mockHooks({ entries: [DUMMY_MODEL, P_VIDEO_2_MODEL, P_VIDEO_2_PRO_MODEL] });
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes('1280'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    localStorage.setItem('heyhi_pruna_irreversible_ack', '1');
  });

  async function selectPro(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() => expect(screen.queryByText('Lädt…')).not.toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: 't2v' }));
    await waitFor(() => expect(screen.getAllByText('P-Video 2').length).toBeGreaterThan(0));

    // The test dropdown renders its menu items eagerly. The first matching
    // button is the picker trigger; the exact Pro label is the menu item.
    await user.click(screen.getAllByRole('button', { name: /P-Video 2/ })[0]);
    await user.click(screen.getByRole('button', { name: 'P-Video 2 Pro' }));
    await waitFor(() => expect(screen.getAllByText('P-Video 2 Pro').length).toBeGreaterThan(0));
  }

  function clickLastButton(name: string) {
    const buttons = screen.getAllByRole('button', { name });
    fireEvent.click(buttons[buttons.length - 1]);
  }

  it('switches from P-Video 2 to Pro defaults without carrying incompatible controls', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await selectPro(user);

    expect(screen.getByText('Video · 24 fps · mit Ton')).toBeInTheDocument();
    expect(screen.getAllByText('768p').length).toBeGreaterThan(0);
    expect(screen.queryByText('Automatische Dauer')).not.toBeInTheDocument();
    expect(screen.queryByText('48 fps')).not.toBeInTheDocument();
    expect(screen.queryByText('Entwurf')).not.toBeInTheDocument();
    expect(screen.queryByText('Audio speichern')).not.toBeInTheDocument();
    expect(screen.queryByText('Prompt-Upsampling')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Qualität' }));
    expect(screen.getByText('Generierungsmodus')).toBeInTheDocument();
    expect(screen.getByText('Prompt-Upsampler')).toBeInTheDocument();
  });

  it('restores a persisted Pro selection and valid values after remount', async () => {
    const user = userEvent.setup();
    const first = render(<PlaygroundShell />);
    await selectPro(user);
    await user.click(screen.getByRole('slider'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    clickLastButton('480p');
    await user.click(screen.getByRole('button', { name: 'Qualität' }));
    clickLastButton('Qualität');
    clickLastButton('Max');

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('playgroundState') ?? '{}');
      expect(stored.modelId).toBe('p-video-2-pro');
      expect(stored.mode).toBe('t2v');
      expect(stored.params).toMatchObject({
        duration: 13,
        resolution: '480p',
        mode: 'quality',
        prompt_upsampler: 'max',
      });
    });

    first.unmount();
    render(<PlaygroundShell />);
    await waitFor(() => expect(screen.getByText('Video · 24 fps · mit Ton')).toBeInTheDocument());
    expect(screen.getByRole('slider')).toHaveValue('8');
    expect(screen.getAllByRole('button', { name: '480p' })[0]).toHaveTextContent('480p');
    expect(screen.queryByText('Automatische Dauer')).not.toBeInTheDocument();
  });

  it('saves a finished Pro result as video with the exact model and params', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('asset-p-video-2-pro');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ videoUrl: 'https://x/pro.mp4' }),
    });

    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await selectPro(user);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    clickLastButton('480p');
    await user.click(screen.getByRole('button', { name: 'Qualität' }));
    clickLastButton('Qualität');
    clickLastButton('Max');
    await user.type(screen.getByLabelText('Prompt'), 'ein Pro-Testvideo');
    await user.click(screen.getByRole('button', { name: 'Senden' }));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(1));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      model: 'p-video-2-pro',
      duration: 12,
      params: {
        duration: 12,
        resolution: '480p',
        mode: 'quality',
        prompt_upsampler: 'max',
      },
    });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://x/pro.mp4',
      prompt: 'ein Pro-Testvideo',
      modelId: 'p-video-2-pro',
      isVideo: true,
      params: expect.objectContaining({
        duration: 12,
        resolution: '480p',
        mode: 'quality',
        prompt_upsampler: 'max',
      }),
    }));
  });

  it('retries the frozen Pro request including mode and upsampler after composer changes', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('asset-p-video-2-pro');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'upstream kaputt' }),
    });

    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await selectPro(user);
    await user.click(screen.getByRole('button', { name: 'Qualität' }));
    clickLastButton('Qualität');
    clickLastButton('Max');
    await user.type(screen.getByLabelText('Prompt'), 'eingefrorener Pro-Lauf');
    await user.click(screen.getByRole('button', { name: 'Senden' }));
    await screen.findByRole('button', { name: 'Erneut versuchen' });
    const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

    clickLastButton('Speed');
    clickLastButton('Aus');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ videoUrl: 'https://x/pro-retry.mp4' }),
    });
    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(2));
    const retryBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(retryBody).toEqual(firstBody);
    expect(retryBody.model).toBe('p-video-2-pro');
    expect(retryBody.params.mode).toBe('quality');
    expect(retryBody.params.prompt_upsampler).toBe('max');
    await waitFor(() => expect(OutputService.saveGeneratedAsset).toHaveBeenCalledTimes(1));
  });

  it('resumes an existing Pro pending run by polling without redispatching', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('asset-p-video-2-pro');
    saveStoredRun({
      runId: 'resume-pro',
      predictionId: 'prediction-pro',
      model: 'p-video-2-pro',
      prompt: 'wiederaufgenommenes Pro-Video',
      params: {
        duration: 11,
        resolution: '480p',
        aspect_ratio: '9:16',
        mode: 'quality',
        prompt_upsampler: 'max',
        seed: 0,
      },
      isVideo: true,
      aspectRatio: '9:16',
      startedAt: Date.now(),
      body: {
        prompt: 'wiederaufgenommenes Pro-Video',
        model: 'p-video-2-pro',
        duration: 11,
        params: {
          duration: 11,
          resolution: '480p',
          aspect_ratio: '9:16',
          mode: 'quality',
          prompt_upsampler: 'max',
          seed: 0,
        },
      },
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ videoUrl: 'https://x/resumed-pro.mp4' }),
    });

    jest.useFakeTimers();
    try {
      render(<PlaygroundShell />);
      await act(async () => { jest.advanceTimersByTime(3_000); });
      await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(1));
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        '/api/pruna/status?id=prediction-pro&model=p-video-2-pro',
      );
      expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBeUndefined();
      await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
        modelId: 'p-video-2-pro',
        isVideo: true,
        params: expect.objectContaining({ mode: 'quality', prompt_upsampler: 'max' }),
      })));
      expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === '/api/generate')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
