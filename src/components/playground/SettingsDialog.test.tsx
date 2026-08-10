import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SettingsDialog } from './SettingsDialog';

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

describe('SettingsDialog', () => {
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
    const { container } = render(<SettingsDialog open={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows Pollinations and Pruna sections when open is true', () => {
    render(<SettingsDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Pollinations')).toBeInTheDocument();
    expect(screen.getByText('Pruna')).toBeInTheDocument();
  });

  it('saves the typed Pruna key to localStorage when Verbinden is clicked', () => {
    render(<SettingsDialog open={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Pruna-Key');
    fireEvent.change(input, { target: { value: 'my-pruna-secret' } });

    const connectButton = within(input.parentElement!).getByText('Verbinden');
    fireEvent.click(connectButton);

    expect(localStorage.getItem('prunaApiKey')).toBe('my-pruna-secret');
  });

  it('shows the connected pollen key in the Pollen-Key input', () => {
    (usePollenKey as jest.Mock).mockReturnValue({
      pollenKey: 'connected-pollen-key',
      isConnected: true,
      connectManual: mockConnectManual,
      disconnect: mockDisconnect,
    });

    render(<SettingsDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Pollen-Key')).toHaveValue('connected-pollen-key');
  });
});
