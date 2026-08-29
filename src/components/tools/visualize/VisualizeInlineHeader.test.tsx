import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualizeInlineHeader } from './VisualizeInlineHeader';
import { getChatImageModelGroups } from '@/config/unified-image-models';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <div data-select-value={value}>{children}</div>
  ),
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

let mockHasPollenKey = true;
jest.mock('@/hooks/useHasPollenKey', () => ({
  useHasPollenKey: () => mockHasPollenKey,
}));

jest.mock('@/config/image-aspect-ratio-presets', () => ({
  getAspectRatioPresetsForModel: () => ({
    '1:1': { width: 1024, height: 1024 },
  }),
}));

jest.mock('@/config/unified-image-models', () => ({
  shouldIncludeByopHidden: (
    provider: string,
    entitlements: { prunaAvailable: boolean; hasPollenKey: boolean },
  ) => provider === 'pruna' ? entitlements.prunaAvailable : entitlements.hasPollenKey,
  getDurationOptionsSeconds: (model?: { temporalControl?: Record<string, any> }) => {
    const control = model?.temporalControl;
    if (control?.mode === 'seconds') {
      return Array.from({ length: control.max - control.min + 1 }, (_, index) => control.min + index);
    }
    return control?.mode === 'frame-backed-seconds' ? control.secondOptions : [];
  },
  getDefaultDurationSeconds: (model?: { temporalControl?: Record<string, any> }) =>
    model?.temporalControl?.defaultSeconds,
  getUnifiedModel: (id: string) => {
    const temporalControls: Record<string, object> = {
      'p-video': { mode: 'seconds', min: 1, max: 20, step: 1, defaultSeconds: 5 },
      'wan-t2v': { mode: 'frame-backed-seconds', secondOptions: [5, 6, 7, 7.5], defaultSeconds: 5 },
      'p-video-avatar': { mode: 'speech-driven' },
      'p-video-animate': { mode: 'source-video-driven' },
      'vace': { mode: 'fixed-frames', frames: 81 },
    };
    return {
      provider: id.startsWith('p-video') || id.startsWith('wan-') ? 'pruna' : 'pollinations',
      kind: temporalControls[id] ? 'video' : 'image',
      supportsAudio: false,
      temporalControl: temporalControls[id],
    };
  },
  getChatImageModelGroups: jest.fn(() => [
    {
      key: 'image-free',
      label: 'IMAGE FREE',
      category: 'Standard',
      kind: 'image',
      modelIds: ['flux'],
      models: [{ id: 'flux', name: 'Flux.1 Fast' }],
    },
  ]),
}));

const mockGetChatImageModelGroups =
  getChatImageModelGroups as jest.MockedFunction<typeof getChatImageModelGroups>;

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
  beforeEach(() => {
    mockHasPollenKey = true;
    mockGetChatImageModelGroups.mockClear();
  });

  const renderVideoHeader = (
    selectedModelId: string,
    formFields: Record<string, unknown> = { duration: 5 },
  ) => render(
    <VisualizeInlineHeader
      selectedModelId={selectedModelId}
      onModelChange={jest.fn()}
      currentModelConfig={{
        id: selectedModelId,
        name: selectedModelId,
        outputType: 'video',
        inputs: [],
      }}
      formFields={formFields}
      handleFieldChange={jest.fn()}
      setFormFields={jest.fn()}
      isPollenModel={false}
      isPollinationsVideo={false}
    />
  );

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
        isPollenModel={true}
        isPollinationsVideo={false}
        inlineContent={<span>ref</span>}
      />
    );

    expect(screen.queryByText('Visualize with')).not.toBeInTheDocument();

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
        isPollenModel={true}
        isPollinationsVideo={false}
      />
    );

    // Model without audio/enhance renders no Switch at all now that the provider
    // toggle lives in the config sidebar.
    expect(screen.queryByRole('button', { name: 'switch' })).toBeNull();
    expect(screen.queryByText('provider.pruna')).toBeNull();
  });

  it('renders P-Video duration as integer seconds from 1 through 20', () => {
    renderVideoHeader('p-video');

    expect(screen.getByText('1s')).toBeInTheDocument();
    expect(screen.getByText('20s')).toBeInTheDocument();
    expect(screen.getAllByText(/^\d+s$/)).toHaveLength(20);
  });

  it('uses the configured five-second default for P-Video', () => {
    const { container } = renderVideoHeader('p-video', {});

    expect(container.querySelector('[data-select-value="5"]')).toBeInTheDocument();
  });

  it('renders Wan frame-backed duration as supported second choices', () => {
    renderVideoHeader('wan-t2v');

    expect(screen.getByText('5s')).toBeInTheDocument();
    expect(screen.getByText('6s')).toBeInTheDocument();
    expect(screen.getByText('7s')).toBeInTheDocument();
    expect(screen.getByText('7.5s')).toBeInTheDocument();
    expect(screen.queryByText('10s')).not.toBeInTheDocument();
  });

  it('limits Pruna video aspect ratios to values accepted by the adapter', () => {
    render(
      <VisualizeInlineHeader
        selectedModelId="wan-t2v"
        onModelChange={jest.fn()}
        currentModelConfig={{
          id: 'wan-t2v',
          name: 'Wan T2V',
          outputType: 'video',
          inputs: [{ name: 'aspect_ratio', default: '16:9' }],
        }}
        formFields={{ aspect_ratio: '16:9', duration: 5 }}
        handleFieldChange={jest.fn()}
        setFormFields={jest.fn()}
        isPollenModel={false}
        isPollinationsVideo={false}
      />
    );

    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.queryByText('Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    expect(screen.queryByText('4:5')).not.toBeInTheDocument();
  });

  it('does not render editable duration for speech-driven video models', () => {
    renderVideoHeader('p-video-avatar');

    expect(screen.queryByText(/\d+(?:\.\d+)?s/)).not.toBeInTheDocument();
  });

  it.each(['p-video-animate', 'vace'])(
    'does not render editable duration for %s',
    (modelId) => {
      renderVideoHeader(modelId);

      expect(screen.queryByText(/\d+(?:\.\d+)?s/)).not.toBeInTheDocument();
    },
  );

  it('fuehrt im Modellbereich keine Advanced-Gruppe und keinen Mehr-anzeigen-Umschalter', () => {
    render(
      <VisualizeInlineHeader
        selectedModelId="flux"
        onModelChange={jest.fn()}
        currentModelConfig={{ id: 'flux', name: 'flux', outputType: 'image', inputs: [] } as never}
        formFields={{}}
        handleFieldChange={jest.fn()}
        setFormFields={jest.fn()}
        isPollenModel={false}
        isPollinationsVideo={false}
        section="model"
      />,
    );

    expect(screen.queryByText('visualize.showMore')).toBeNull();
    expect(screen.queryByText('visualize.showLess')).toBeNull();
  });
});
