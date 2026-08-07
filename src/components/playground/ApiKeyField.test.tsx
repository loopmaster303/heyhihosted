import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyField } from './ApiKeyField';

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';

describe('ApiKeyField', () => {
  const mockConnectManual = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows Pollinations label when provider is pollinations', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    render(<ApiKeyField />);
    expect(screen.getByLabelText(/pollinations key/i)).toBeInTheDocument();
  });

  it('writes prunaApiKey to localStorage when provider is pruna', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pruna', setProviderMode: jest.fn(), prunaAvailable: true });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    render(<ApiKeyField />);
    const input = screen.getByLabelText(/pruna key/i);
    fireEvent.change(input, { target: { value: 'sk_test' } });
    expect(localStorage.getItem('prunaApiKey')).toBe('sk_test');

    fireEvent.change(input, { target: { value: '' } });
    expect(localStorage.getItem('prunaApiKey')).toBeNull();
  });

  it('calls connectManual or disconnect for pollinations provider', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    render(<ApiKeyField />);
    const input = screen.getByLabelText(/pollinations key/i);
    fireEvent.change(input, { target: { value: 'pk_123' } });
    expect(mockConnectManual).toHaveBeenCalledWith('pk_123');

    fireEvent.change(input, { target: { value: '' } });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('toggles password visibility when reveal button is clicked', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: 'secret_key', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    render(<ApiKeyField />);
    const input = screen.getByLabelText(/pollinations key/i) as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /show key/i });
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');

    const hideBtn = screen.getByRole('button', { name: /hide key/i });
    fireEvent.click(hideBtn);
    expect(input.type).toBe('password');
  });

  it('tests Pollinations API key and updates status dot', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: 'pk_valid', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ApiKeyField />);
    const testBtn = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testBtn);

    const statusDot = screen.getByTestId('key-status');
    await waitFor(() => {
      expect(statusDot).toHaveAttribute('data-status', 'ok');
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/pollen/account', {
      headers: { 'X-Pollen-Key': 'pk_valid' },
    });
  });

  it('handles test failure for Pruna key', async () => {
    localStorage.setItem('prunaApiKey', 'sk_invalid');
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pruna', setProviderMode: jest.fn(), prunaAvailable: true });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', connectManual: mockConnectManual, disconnect: mockDisconnect, accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ApiKeyField />);
    const testBtn = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testBtn);

    const statusDot = screen.getByTestId('key-status');
    await waitFor(() => {
      expect(statusDot).toHaveAttribute('data-status', 'error');
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/capabilities', {
      headers: { 'X-Pruna-Key': 'sk_invalid' },
    });
  });
});
