import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderSelect } from './ProviderSelect';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <div />,
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/useHasPollenKey', () => ({ useHasPollenKey: jest.fn() }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: jest.fn() }));

import { useProviderMode } from '@/hooks/useProviderMode';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';
import { useHasPrunaKey } from '@/hooks/useHasPrunaKey';

describe('ProviderSelect', () => {
  const mockSetProviderMode = jest.fn();
  const mockOnOpenSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not show settings link when selected provider has a key', () => {
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations',
      setProviderMode: mockSetProviderMode,
      prunaAvailable: false,
    });
    (useHasPollenKey as jest.Mock).mockReturnValue(true);
    (useHasPrunaKey as jest.Mock).mockReturnValue(false);

    render(<ProviderSelect onOpenSettings={mockOnOpenSettings} />);

    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument();
  });

  it('calls onOpenSettings when settings link is clicked for missing key', () => {
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pruna',
      setProviderMode: mockSetProviderMode,
      prunaAvailable: false,
    });
    (useHasPollenKey as jest.Mock).mockReturnValue(false);
    (useHasPrunaKey as jest.Mock).mockReturnValue(false);

    render(<ProviderSelect onOpenSettings={mockOnOpenSettings} />);

    const settingsButton = screen.getByText('Einstellungen');
    fireEvent.click(settingsButton);

    expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('shows the selected provider name in the trigger', () => {
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations',
      setProviderMode: mockSetProviderMode,
      prunaAvailable: false,
    });
    (useHasPollenKey as jest.Mock).mockReturnValue(true);
    (useHasPrunaKey as jest.Mock).mockReturnValue(false);

    render(<ProviderSelect onOpenSettings={mockOnOpenSettings} />);

    expect(screen.getAllByText('Pollinations')).toHaveLength(2);
  });
});
