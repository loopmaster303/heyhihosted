import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) => (
    <button onClick={onSelect} {...props}>{children}</button>
  ),
}));

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/usePrunaKey', () => ({ usePrunaKey: jest.fn() }));

import { ProviderSelect } from './ProviderSelect';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import { usePrunaKey } from '@/hooks/usePrunaKey';

const connectManual = jest.fn();
const prunaConnect = jest.fn();

function setup({
  providerMode = 'pollinations',
  pollenConnected = false,
  prunaConnected = false,
}: { providerMode?: string; pollenConnected?: boolean; prunaConnected?: boolean } = {}) {
  (useProviderMode as jest.Mock).mockReturnValue({
    providerMode,
    setProviderMode: jest.fn(),
    prunaAvailable: true,
  });
  (usePollenKey as jest.Mock).mockReturnValue({
    pollenKey: pollenConnected ? 'pk-live' : '',
    isConnected: pollenConnected,
    connectManual,
    disconnect: jest.fn(),
  });
  (usePrunaKey as jest.Mock).mockReturnValue({
    prunaKey: prunaConnected ? 'pr-live' : '',
    isConnected: prunaConnected,
    connect: prunaConnect,
    disconnect: jest.fn(),
  });
  render(<ProviderSelect />);
}

describe('ProviderSelect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows only the status lamp when the provider is connected', () => {
    setup({ pollenConnected: true });
    expect(screen.queryByLabelText('Pollen-Key')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verbinden' })).not.toBeInTheDocument();
  });

  it('explains what to do and offers a key field when the provider has no key', () => {
    setup();
    expect(screen.getByLabelText('Pollen-Key')).toBeInTheDocument();
    expect(screen.getByText(/nur die freien Modelle/i)).toBeInTheDocument();
  });

  it('connects the pollen key that was typed inline', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Pollen-Key'), { target: { value: 'pk-typed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verbinden' }));
    expect(connectManual).toHaveBeenCalledWith('pk-typed');
  });

  it('routes the inline key to Pruna when Pruna is the active provider', () => {
    setup({ providerMode: 'pruna' });
    fireEvent.change(screen.getByLabelText('Pruna-Key'), { target: { value: 'pr-typed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verbinden' }));
    expect(prunaConnect).toHaveBeenCalledWith('pr-typed');
  });

  it('marks a keyless provider in the dropdown as needing a key', () => {
    setup({ pollenConnected: true });
    expect(screen.getByText('Benötigt Key in Settings')).toBeInTheDocument();
  });
});
