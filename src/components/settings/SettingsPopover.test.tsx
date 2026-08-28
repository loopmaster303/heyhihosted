import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SettingsPopover } from './SettingsPopover';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    'aria-label': ariaLabel,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={value} onChange={onChange} aria-label={ariaLabel} {...props} />
  ),
}));

jest.mock('@/components/ui/popup', () => ({
  ModalPopup: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));

import { usePollenKey } from '@/hooks/usePollenKey';

describe('SettingsPopover', () => {
  const mockOnClose = jest.fn();
  const mockConnectManual = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    (usePollenKey as jest.Mock).mockReturnValue({
      pollenKey: '',
      isConnected: false,
      connectManual: mockConnectManual,
      disconnect: mockDisconnect,
    });
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<SettingsPopover open={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows Pollinations and Pruna sections when open is true', () => {
    render(<SettingsPopover open={true} onClose={mockOnClose} />);

    // Seit dem Zusammenlegen steht "Pollinations" zweimal: als Zugang-Ueberschrift
    // und als Label am Provider-Schalter unter Voreinstellungen.
    expect(screen.getAllByText('Pollinations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pruna').length).toBeGreaterThan(0);
  });

  it('saves the typed Pruna key to localStorage when Verbinden is clicked', () => {
    render(<SettingsPopover open={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Pruna-Key');
    fireEvent.change(input, { target: { value: 'my-pruna-secret' } });

    const connectButton = within(input.parentElement!).getByText('Verbinden');
    fireEvent.click(connectButton);

    expect(localStorage.getItem('prunaApiKey')).toBe('my-pruna-secret');
  });

  // So kommt der Schluessel wirklich an: usePollenKey liest localStorage erst
  // nach dem Mount, der erste Render sieht von dort also nichts. Wer den Wert
  // nur als Startwert aus dem Hook nimmt, zeigt dauerhaft ein leeres Feld
  // neben einer gruenen Lampe.
  it('shows the stored pollen key even before the hook reports it', () => {
    localStorage.setItem('pollenApiKey', 'connected-pollen-key');
    (usePollenKey as jest.Mock).mockReturnValue({
      pollenKey: null,
      isConnected: false,
      connectManual: mockConnectManual,
      disconnect: mockDisconnect,
    });

    render(<SettingsPopover open={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Pollen-Key')).toHaveValue('connected-pollen-key');
  });

  it('leaves the Pollen-Key input empty when nothing is stored', () => {
    render(<SettingsPopover open={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Pollen-Key')).toHaveValue('');
  });
});
