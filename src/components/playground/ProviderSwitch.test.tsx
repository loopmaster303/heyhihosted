import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderSwitch } from './ProviderSwitch';

jest.mock('@/hooks/useProviderMode', () => ({
  useProviderMode: jest.fn(),
}));
import { useProviderMode } from '@/hooks/useProviderMode';

describe('ProviderSwitch', () => {
  it('renders both providers and marks the active one', () => {
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: true,
    });
    render(<ProviderSwitch />);
    const pollen = screen.getByRole('tab', { name: /pollinations/i });
    const pruna = screen.getByRole('tab', { name: /pruna/i });
    expect(pollen).toHaveAttribute('aria-selected', 'true');
    expect(pruna).toHaveAttribute('aria-selected', 'false');
  });

  it('switches provider on click', () => {
    const setProviderMode = jest.fn();
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations', setProviderMode, prunaAvailable: true,
    });
    render(<ProviderSwitch />);
    fireEvent.click(screen.getByRole('tab', { name: /pruna/i }));
    expect(setProviderMode).toHaveBeenCalledWith('pruna');
  });
});
