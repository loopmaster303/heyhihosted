import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualizeInlineHeader } from './VisualizeInlineHeader';

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({
    children,
    className,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
  SelectValue: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    disabled,
    title,
    checked,
  }: {
    disabled?: boolean;
    title?: string;
    checked?: boolean;
  }) => (
    <button type="button" disabled={disabled} title={title} aria-pressed={checked}>
      switch
    </button>
  ),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/useHasPollenKey', () => ({
  useHasPollenKey: () => true,
}));

jest.mock('@/config/image-aspect-ratio-presets', () => ({
  getAspectRatioPresetsForModel: () => ({
    '1:1': { width: 1024, height: 1024 },
  }),
}));

jest.mock('@/config/unified-image-models', () => ({
  getUnifiedModel: () => ({
    provider: 'pollinations',
    kind: 'image',
    supportsAudio: false,
  }),
  getVisualizeModelGroupsForProvider: () => [
    {
      key: 'standard-image',
      label: 'Standard',
      category: 'Standard',
      kind: 'image',
      models: [{ id: 'nanobanana-pro', name: 'Nano Banana Pro' }],
    },
  ],
}));

jest.mock('@/config/ui-constants', () => ({
  imageModelIcons: {},
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

describe('VisualizeInlineHeader', () => {
  it('uses tighter spacing so dropdown chevrons stay closer to their values', () => {
    render(
      <VisualizeInlineHeader
        selectedModelId="nanobanana-pro"
        onModelChange={jest.fn()}
        currentModelConfig={{
          id: 'nanobanana-pro',
          name: 'Nano Banana Pro',
          inputs: [
            { name: 'aspect_ratio', default: '1:1' },
            { name: 'resolution', default: '2K' },
          ],
        }}
        formFields={{ aspect_ratio: '1:1', resolution: '2K' }}
        handleFieldChange={jest.fn()}
        setFormFields={jest.fn()}
        isGptImage={false}
        isSeedream={false}
        isNanoPollen={true}
        isPollenModel={true}
        isPollinationsVideo={false}
        inlineContent={<span>ref</span>}
      />
    );

    const visualizeLabel = screen.getByText('Visualize with');
    expect(visualizeLabel.parentElement).toHaveClass('px-2.5', 'gap-1.5');

    const triggerButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('min-w-['));

    expect(triggerButtons.some((button) => button.className.includes('min-w-[80px]'))).toBe(true);
    expect(triggerButtons.some((button) => button.className.includes('[&>span]:gap-1'))).toBe(true);
    expect(triggerButtons.some((button) => button.className.includes('min-w-[52px]'))).toBe(true);
  });

  it('no longer renders the provider switch (moved to the config sidebar)', () => {
    render(
      <VisualizeInlineHeader
        selectedModelId="nanobanana-pro"
        onModelChange={jest.fn()}
        currentModelConfig={{
          id: 'nanobanana-pro',
          name: 'Nano Banana Pro',
          inputs: [],
        }}
        formFields={{}}
        handleFieldChange={jest.fn()}
        setFormFields={jest.fn()}
        isGptImage={false}
        isSeedream={false}
        isNanoPollen={true}
        isPollenModel={true}
        isPollinationsVideo={false}
        providerMode="pollinations"
      />
    );

    // Model without audio/enhance renders no Switch at all now that the provider
    // toggle lives in the config sidebar.
    expect(screen.queryByRole('button', { name: 'switch' })).toBeNull();
    expect(screen.queryByText('provider.pruna')).toBeNull();
  });
});
