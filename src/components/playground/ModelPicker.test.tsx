import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelPicker } from './ModelPicker';

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
  DropdownMenuItem: ({
    children,
    onSelect,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) => (
    <button onClick={onSelect} {...props}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

// Ohne eigenen Schluessel sind die Bezahl-Klassiker gesperrt — der Test setzt
// ihn punktuell und prueft beide Zustaende.
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn(() => ({ pollenKey: null })) }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: () => false }));

import { usePollenKey } from '@/hooks/usePollenKey';

jest.mock('@/config/unified-image-models', () => ({
  getUnifiedModel: jest.fn((id: string) => {
    if (id === 'flux') return { isFree: true };
    if (id === 'grok-imagine-pro') return { isFree: false };
    return undefined;
  }),
}));

jest.mock('@/lib/playground/mode-mapping', () => ({
  isModelInMode: () => true,
}));

const entries = [
  {
    id: 'z-image',
    name: 'Z-Image Turbo',
    provider: 'pollinations' as const,
    kind: 'image' as const,
    supportsReference: false,
    requiresReference: false,
    maxImages: 0,
    unmapped: false,
    supportsEndFrame: false,
    supportsAudio: false,
    paidOnly: false,
    community: false,
    runnableOnKey: true,
  },
  {
    id: 'flux',
    name: 'Flux',
    provider: 'pollinations' as const,
    kind: 'image' as const,
    supportsReference: false,
    requiresReference: false,
    maxImages: 0,
    unmapped: false,
    supportsEndFrame: false,
    supportsAudio: false,
    paidOnly: true,
    community: false,
    // Kuratierter Bezahl-Klassiker: live (2026-09-10) am Betreiber-Schluessel 403.
    runnableOnKey: false,
  },
  {
    id: 'grok-imagine-pro',
    name: 'Grok Imagine Pro',
    provider: 'pollinations' as const,
    kind: 'image' as const,
    supportsReference: true,
    requiresReference: false,
    maxImages: 1,
    unmapped: false,
    supportsEndFrame: false,
    supportsAudio: false,
    // Kostenpflichtig, aber vom effektiven Schluessel bedienbar: kein Klassiker.
    paidOnly: true,
    community: false,
    runnableOnKey: true,
  },
];

describe('ModelPicker', () => {
  beforeEach(() => {
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: null });
  });

  it('trigger is disabled while loading', () => {
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={() => {}} loading={true} fallbackActive={false} />);
    // The stubbed menu content always renders its items, so several buttons
    // exist. Target the trigger by the label it shows while loading.
    expect(screen.getByText('Lädt…').closest('button')).toBeDisabled();
  });

  it('renders fallback notice when fallbackActive is true', () => {
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={true} />);
    expect(screen.getByText('playground.fallbackNotice')).toBeInTheDocument();
  });

  it('clicking a free model item calls onChange with that model id', () => {
    const onChange = jest.fn();
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={onChange} loading={false} fallbackActive={false} />);
    fireEvent.click(screen.getByText('Z-Image Turbo'));
    expect(onChange).toHaveBeenCalledWith('z-image');
  });

  it('shows free and key-gated models under separate group labels', () => {
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={false} />);
    expect(screen.getByText('Frei')).toBeInTheDocument();
    expect(screen.getByText('Key nötig')).toBeInTheDocument();
    expect(screen.getByText('Bezahlt — eigener Pollen-Schlüssel')).toBeInTheDocument();
  });

  // Der gesperrte Klassiker ist der Grund fuer `runnableOnKey`: ohne eigenen
  // Pollen-Schluessel laeuft er nicht (live belegt 2026-09-10, 403 am
  // Betreiber-Schluessel). Ein Klick darf ihn deshalb nicht auswaehlen — er
  // muss den Grund nennen, sonst wirkt der Klick wie ein Defekt.
  it('waehlt einen gesperrten Bezahl-Klassiker nicht aus und erklaert warum', () => {
    const onChange = jest.fn();
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={onChange} loading={false} fallbackActive={false} />);

    const klassiker = screen.getByText('Flux').closest('button');
    expect(klassiker).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByText('Flux'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('note')).toHaveTextContent('eigenen Pollen-Schlüssel');
  });

  it('laesst den Klassiker mit eigenem Pollen-Schluessel waehlen', () => {
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: 'sk-eigener' });
    const onChange = jest.fn();
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={onChange} loading={false} fallbackActive={false} />);

    fireEvent.click(screen.getByText('Flux'));

    expect(onChange).toHaveBeenCalledWith('flux');
    // Die Sperre haengt am Schluessel, nicht am Eintrag: Flux bleibt als
    // "bezahlt" gebadged (Eintrag), nur der Hinweis verschwindet.
    expect(screen.getAllByText('bezahlt').length).toBeGreaterThan(0);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

// L-I.3: Seit Phase 3 ist Video vollstaendig schluesselpflichtig. Wer t2v
// waehlt und keinen Schluessel hat, sah bisher nur "Kein Modell für diesen
// Modus" — eine Sackgasse ohne Grund.
describe('L-I.3: leerer Videomodus erklaert sich', () => {
  it('nennt die Schluesselpflicht, wenn im Videomodus nichts uebrig bleibt', () => {
    render(<ModelPicker entries={[]} mode="t2v" value="" onChange={() => {}} loading={false} fallbackActive={false} />);
    expect(screen.getByRole('note')).toHaveTextContent('kein kostenloses Modell');
  });

  it('schweigt im Bildmodus — dort gibt es freie Modelle', () => {
    render(<ModelPicker entries={[]} mode="t2i" value="" onChange={() => {}} loading={false} fallbackActive={false} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
