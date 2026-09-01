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
    paidOnly: false,
    community: false,
  },
];

describe('ModelPicker', () => {
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

  it('clicking a model item calls onChange with that model id', () => {
    const onChange = jest.fn();
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={onChange} loading={false} fallbackActive={false} />);
    fireEvent.click(screen.getByText('Flux'));
    expect(onChange).toHaveBeenCalledWith('flux');
  });

  it('shows free and key-gated models under separate group labels', () => {
    render(<ModelPicker entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={false} />);
    expect(screen.getByText('Frei')).toBeInTheDocument();
    expect(screen.getByText('Key nötig')).toBeInTheDocument();
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
