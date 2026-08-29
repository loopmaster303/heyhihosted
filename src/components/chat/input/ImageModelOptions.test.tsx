import React from 'react';
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

  it('zeigt genau die schluesselfreien Bildmodelle', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    const options = screen.getAllByRole('radio').map((el) => el.textContent);
    expect(options).toHaveLength(3);
    expect(options.join(' ')).toMatch(/Flux/);
    expect(options.join(' ')).toMatch(/GPT Image/);
    expect(options.join(' ')).toMatch(/Klein/);
  });

  it('zeigt kein Video- und kein Pruna-Modell', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    // E7-2 / E7-3: strukturell abwesend, nicht bloss ausgegraut.
    const body = screen.getByRole('radiogroup').textContent ?? '';
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
