import { render, screen, fireEvent } from '@testing-library/react';
import { GenerateButton } from './GenerateButton';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'en', setLanguage: jest.fn() }),
}));

describe('GenerateButton', () => {
  it('renders Generate and fires onClick when idle', () => {
    const onClick = jest.fn();
    render(<GenerateButton state="idle" onClick={onClick} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(onClick).toHaveBeenCalled();
  });
  it('is disabled when disabled', () => {
    render(<GenerateButton state="disabled" onClick={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled();
  });
  it('renders Cancel and fires onCancel when working', () => {
    const onCancel = jest.fn();
    render(<GenerateButton state="working" onClick={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
