import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    src,
    fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/popup', () => ({
  ModalPopup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/useVisiblePollinationsTextModels', () => ({
  useVisiblePollinationsTextModels: () => ({
    visibleModels: [
      {
        id: 'gemini',
        name: 'Gemini',
        description: 'Fast model',
      },
    ],
    findModelById: (id: string) =>
      id === 'gemini'
        ? {
            id: 'gemini',
            name: 'Gemini',
            description: 'Fast model',
          }
        : undefined,
  }),
}));

jest.mock('@/config/ui-constants', () => ({
  modelIcons: {
    gemini: '/gemini-color.png',
  },
  featuredModels: [
    {
      id: 'gemini',
      name: 'Gemini',
    },
  ],
  modelDisplayMap: {
    gemini: 'Gemini',
  },
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

describe('ModelSelector', () => {
  it('provides a sizes hint for the compact fill icon', () => {
    render(
      <ModelSelector
        selectedModelId="gemini"
        onModelChange={jest.fn()}
        compact
      />
    );

    const icon = document.querySelector('img[src="/gemini-color.png"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('sizes', '16px');
  });
});
