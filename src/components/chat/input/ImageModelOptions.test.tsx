import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { ImageModelOptions } from './ImageModelOptions';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('./ModelLogo', () => ({
  ModelLogo: () => <span data-testid="model-logo" />,
}));

describe('ImageModelOptions', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('zeigt genau die schluesselfreien Bildmodelle', async () => {
    const onModelChange = jest.fn();
    render(<ImageModelOptions selectedModelId="flux" onModelChange={onModelChange} />);

    const options = screen
      .getAllByRole('button')
      .filter((el) => el.hasAttribute('aria-pressed'))
      .map((el) => el.textContent);
    expect(options).toHaveLength(3);
    expect(options.join(' ')).toMatch(/Flux/);
    expect(options.join(' ')).toMatch(/GPT Image/);
    expect(options.join(' ')).toMatch(/Klein/);

    const active = screen.getByRole('button', { name: 'Flux.1 Fast' });
    expect(active).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'GPT Image 1 Mini' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Flux.2 Klein 4B' }));
    expect(onModelChange).toHaveBeenCalledWith('klein');
  });

  it('deaktiviert die Modellauswahl, wenn disabled gesetzt ist', async () => {
    const onModelChange = jest.fn();
    render(<ImageModelOptions selectedModelId="flux" onModelChange={onModelChange} disabled />);

    const buttons = screen
      .getAllByRole('button')
      .filter((el) => el.hasAttribute('aria-pressed'));
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }

    await userEvent.click(screen.getByRole('button', { name: 'Flux.2 Klein 4B' }));
    expect(onModelChange).not.toHaveBeenCalled();
  });

  it('zeigt kein Video- und kein Pruna-Modell', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    // E7-2 / E7-3: strukturell abwesend, nicht bloss ausgegraut.
    const body = screen.getByRole('group').textContent ?? '';
    for (const forbidden of ['P-Video', 'P-Image', 'Wan', 'Veo', 'Seedance', 'Nova Reel']) {
      expect(body).not.toContain(forbidden);
    }
    expect(screen.queryByText('VIDEO ADVANCED')).toBeNull();
    expect(screen.queryByText('IMAGE ADVANCED')).toBeNull();
  });

  it('benennt den Weg ins Create und fuehrt dorthin', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    // L-F.1: der Verweis ist als Beschriftung vorhanden und fuehrt dorthin.
    const link = screen.getByRole('button', { name: 'modelSelector.allModelsInCreate' });
    link.click();
    expect(mockPush).toHaveBeenCalledWith('/create');
  });
});
