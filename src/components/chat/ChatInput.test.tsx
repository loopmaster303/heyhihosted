/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ChatInput, { dispatchAttachmentAction } from './ChatInput';
import { useChatInputLogic } from '@/hooks/useChatInputLogic';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/useChatInputLogic', () => ({
  useChatInputLogic: jest.fn(),
}));

jest.mock('./input/AttachmentPreviewRow', () => ({
  AttachmentPreviewRow: ({ items }: { items: Array<{ fileName: string }> }) => (
    <div data-testid="attachment-preview-row">
      <button type="button" aria-label="Anhang entfernen">Remove attachment</button>
      {items.map((item) => <span key={item.fileName}>{item.fileName}</span>)}
    </div>
  ),
}));

jest.mock('@/components/tools/visualize/VisualizeInlineHeader', () => ({
  VisualizeInlineHeader: ({ section, disabled }: { section?: 'model' | 'parameters'; disabled?: boolean }) => (
    <div data-testid="visualize-model-header">
      {section !== 'parameters' && (
        <button type="button" disabled={disabled}>Visualize model selector</button>
      )}
      {section !== 'model' && <input aria-label="visualize parameter" disabled={disabled} />}
    </div>
  ),
}));

jest.mock('@/components/tools/compose/ComposeInlineHeader', () => ({
  ComposeInlineHeader: () => null,
}));

jest.mock('./input/ModelSelector', () => ({ ModelSelector: () => null }));
jest.mock('./input/ToolsBadges', () => ({ ToolsBadges: () => null }));
jest.mock('./input/UploadBadges', () => ({
  CapabilityUploadBadges: ({ actions }: { actions: Array<{ kind: string; disabled?: boolean }> }) => (
    <div data-testid="upload-actions">
      {actions.map((action) => <button key={action.kind} type="button" disabled={action.disabled}>{action.kind}</button>)}
    </div>
  ),
}));
jest.mock('./input/VisualizeReferenceBadges', () => ({ VisualizeReferenceBadges: () => null }));
jest.mock('./input/UnifiedMobileDrawer', () => ({
  UnifiedMobileDrawer: ({
    isOpen,
    initialSection,
    modelContent,
    parametersContent,
  }: {
    isOpen: boolean;
    initialSection: string;
    modelContent?: React.ReactNode;
    parametersContent?: React.ReactNode;
  }) => isOpen ? <div data-testid="mobile-drawer-parameters">{initialSection === 'model' ? modelContent : parametersContent}</div> : null,
}));

const mockUseChatInputLogic = useChatInputLogic as jest.MockedFunction<typeof useChatInputLogic>;

it('dispatches every attachment action to its specific input or camera handler', () => {
  const handlers = {
    image: jest.fn(), document: jest.fn(), camera: jest.fn(), sourceVideo: jest.fn(), startFrame: jest.fn(), endFrame: jest.fn(),
  };
  dispatchAttachmentAction('image', handlers);
  dispatchAttachmentAction('reference', handlers);
  dispatchAttachmentAction('document', handlers);
  dispatchAttachmentAction('camera', handlers);
  dispatchAttachmentAction('source-video', handlers);
  dispatchAttachmentAction('start-frame', handlers);
  dispatchAttachmentAction('end-frame', handlers);

  expect(handlers.image).toHaveBeenCalledTimes(2);
  expect(handlers.document).toHaveBeenCalledTimes(1);
  expect(handlers.camera).toHaveBeenCalledTimes(1);
  expect(handlers.sourceVideo).toHaveBeenCalledTimes(1);
  expect(handlers.startFrame).toHaveBeenCalledTimes(1);
  expect(handlers.endFrame).toHaveBeenCalledTimes(1);
});

describe('ChatInput Visualize desktop composer', () => {
  beforeEach(() => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false,
      activeBadgeRow: null,
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null },
      modeButtonRef: { current: null },
      modelButtonRef: { current: null },
      paramsButtonRef: { current: null },
      docInputRef: { current: null },
      imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(),
      setActiveMode: jest.fn(),
      handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(),
      handleFileChange: jest.fn(),
    });
  });

  it('keeps desktop upload actions reachable beside model configuration and previews', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()}
        isLoading={false}
        uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()}
        isLongLanguageLoopActive={false}
        inputValue=""
        onInputChange={jest.fn()}
        isImageMode
        onToggleImageMode={jest.fn()}
        selectedModelId="openai"
        handleModelChange={jest.fn()}
        webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()}
        isRecording={false}
        isTranscribing={false}
        startRecording={jest.fn()}
        stopRecording={jest.fn()}
        openCamera={jest.fn()}
        visualizeToolState={{
          uploadedImages: [{ url: 'https://example.com/reference.png' }],
          isUploading: false,
          supportsReference: true,
          requiresSourceVideo: false,
          maxImages: 4,
          selectedModelId: 'openai',
          setSelectedModelId: jest.fn(),
          currentModelConfig: { id: 'openai', name: 'OpenAI', inputs: [] },
          formFields: {},
          handleFieldChange: jest.fn(),
          setFormFields: jest.fn(),
          isGptImage: false,
          isSeedream: false,
          isNanoPollen: false,
          isPollenModel: false,
          isPollinationsVideo: false,
          providerMode: 'pollinations',
          prunaAvailable: false,
          isVideoModel: false,
          supportsEndFrame: false,
          sourceVideo: null,
          handleRemoveImage: jest.fn(),
          handleRemoveSourceVideo: jest.fn(),
          handleEnhancePrompt: jest.fn(),
          isEnhancing: false,
          setPrompt: jest.fn(),
        } as any}
      />,
    );

    expect(screen.getByRole('button', { name: 'modelSelector.select' })).toBeInTheDocument();
    expect(screen.queryByTestId('visualize-model-header')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'menu.section.upload' })).toBeInTheDocument();
    expect(screen.getByTestId('attachment-preview-row')).toBeInTheDocument();
    expect(screen.getByText('chat.attachment.referenceImage 1')).toBeInTheDocument();
  });

  it('renders one standard attachment preview and removal affordance', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()}
        isLoading={false}
        uploadedFilePreviewUrl="data:image/png;base64,reference"
        onFileSelect={jest.fn()}
        isLongLanguageLoopActive={false}
        inputValue=""
        onInputChange={jest.fn()}
        isImageMode={false}
        onToggleImageMode={jest.fn()}
        selectedModelId="openai"
        handleModelChange={jest.fn()}
        webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()}
        isRecording={false}
        isTranscribing={false}
        startRecording={jest.fn()}
        stopRecording={jest.fn()}
        openCamera={jest.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Anhang entfernen' })).toHaveLength(1);
  });

  it('does not expose standard-chat uploads for a Visualize model without reference capabilities', () => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false, activeBadgeRow: 'upload', badgePanelRef: { current: null }, uploadButtonRef: { current: null }, badgeActionsRef: { current: null },
      modeButtonRef: { current: null }, modelButtonRef: { current: null }, paramsButtonRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(), setActiveMode: jest.fn(), handleSelectMode: jest.fn(), handleSubmit: jest.fn(), handleFileChange: jest.fn(),
    });
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null} onFileSelect={jest.fn()}
        isLongLanguageLoopActive={false} inputValue="" onInputChange={jest.fn()} isImageMode
        onToggleImageMode={jest.fn()} selectedModelId="visual-only" handleModelChange={jest.fn()}
        webBrowsingEnabled={false} onToggleWebBrowsing={jest.fn()} isRecording={false}
        isTranscribing={false} startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
        visualizeToolState={{
          uploadedImages: [], isUploading: false, supportsReference: false, requiresSourceVideo: false,
          maxImages: 0, selectedModelId: 'visual-only', setSelectedModelId: jest.fn(),
          currentModelConfig: { id: 'visual-only', name: 'Visual only', inputs: [] }, formFields: {},
          handleFieldChange: jest.fn(), setFormFields: jest.fn(), isGptImage: false, isSeedream: false,
          isNanoPollen: false, isPollenModel: false, isPollinationsVideo: false, providerMode: 'pollinations',
          prunaAvailable: false, isVideoModel: false, supportsEndFrame: false, sourceVideo: null,
          handleRemoveImage: jest.fn(), handleRemoveSourceVideo: jest.fn(), handleEnhancePrompt: jest.fn(),
          isEnhancing: false, setPrompt: jest.fn(),
        } as any}
      />,
    );

    expect(screen.getByTestId('upload-actions')).toBeEmptyDOMElement();
    expect(screen.queryByRole('button', { name: 'image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'camera' })).not.toBeInTheDocument();
  });
});

describe('ChatInput mobile configuration drawer', () => {
  beforeEach(() => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: true,
      activeBadgeRow: null,
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null },
      modeButtonRef: { current: null },
      modelButtonRef: { current: null },
      paramsButtonRef: { current: null },
      docInputRef: { current: null },
      imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(),
      setActiveMode: jest.fn(),
      handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(),
      handleFileChange: jest.fn(),
    });
  });

  it('puts editable Visualize parameters in the unified mobile drawer', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} isTranscribing={false}
        startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
        visualizeToolState={{
          uploadedImages: [], isUploading: false, supportsReference: true, requiresSourceVideo: false,
          maxImages: 4, selectedModelId: 'openai', setSelectedModelId: jest.fn(),
          currentModelConfig: { id: 'openai', name: 'OpenAI', inputs: [] }, formFields: {},
          handleFieldChange: jest.fn(), setFormFields: jest.fn(), isGptImage: false,
          isSeedream: false, isNanoPollen: false, isPollenModel: false,
          isPollinationsVideo: false, providerMode: 'pollinations', prunaAvailable: false,
          isVideoModel: false, supportsEndFrame: false, sourceVideo: null,
          handleRemoveImage: jest.fn(), handleRemoveSourceVideo: jest.fn(),
          handleEnhancePrompt: jest.fn(), isEnhancing: false, setPrompt: jest.fn(),
        } as any}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'menu.section.parameters' }));

    expect(screen.getByTestId('mobile-drawer-parameters')).toContainElement(
      screen.getByLabelText('visualize parameter'),
    );
  });

  it('keeps the model selector separate from Visualize parameters in the mobile drawer', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} isTranscribing={false}
        startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
        visualizeToolState={{
          uploadedImages: [], isUploading: false, supportsReference: true, requiresSourceVideo: false,
          maxImages: 4, selectedModelId: 'openai', setSelectedModelId: jest.fn(),
          currentModelConfig: { id: 'openai', name: 'OpenAI', inputs: [] }, formFields: {},
          handleFieldChange: jest.fn(), setFormFields: jest.fn(), isGptImage: false,
          isSeedream: false, isNanoPollen: false, isPollenModel: false,
          isPollinationsVideo: false, providerMode: 'pollinations', prunaAvailable: false,
          isVideoModel: false, supportsEndFrame: false, sourceVideo: null,
          handleRemoveImage: jest.fn(), handleRemoveSourceVideo: jest.fn(),
          handleEnhancePrompt: jest.fn(), isEnhancing: false, setPrompt: jest.fn(),
        } as any}
      />,
    );

    fireEvent.click(screen.getByText('OpenAI'));
    expect(screen.getByText('Visualize model selector')).toBeInTheDocument();
    expect(screen.queryByLabelText('visualize parameter')).not.toBeInTheDocument();
  });

  it('uses translated standard-mode and model fallback labels', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode={false} onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} isTranscribing={false}
        startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
      />,
    );

    expect(screen.getByText('tools.standard')).toBeInTheDocument();
  });

  it('does not expose attachment actions while Compose is active', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode={false} onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} isTranscribing={false}
        startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
        isComposeMode
        composeToolState={{
          selectedModel: 'ace-step', duration: 30, availableDurations: [30], hasPollenKey: false,
          instrumental: false, setSelectedModel: jest.fn(), setDuration: jest.fn(),
          setInstrumental: jest.fn(), enhancePrompt: jest.fn(), isEnhancing: false,
        } as any}
      />,
    );

    expect(screen.queryByRole('button', { name: 'menu.section.upload' })).not.toBeInTheDocument();
  });

  it('does not render a stale desktop upload panel while Compose is active', () => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false,
      activeBadgeRow: 'upload',
      badgePanelRef: { current: null }, uploadButtonRef: { current: null }, badgeActionsRef: { current: null },
      modeButtonRef: { current: null }, modelButtonRef: { current: null }, paramsButtonRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null }, toggleBadgeRow: jest.fn(),
      setActiveMode: jest.fn(), handleSelectMode: jest.fn(), handleSubmit: jest.fn(),
      handleFileChange: jest.fn(),
    });

    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode={false} onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} isTranscribing={false}
        startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
        isComposeMode
        composeToolState={{
          selectedModel: 'ace-step', duration: 30, availableDurations: [30], hasPollenKey: false,
          instrumental: false, setSelectedModel: jest.fn(), setDuration: jest.fn(),
          setInstrumental: jest.fn(), enhancePrompt: jest.fn(), isEnhancing: false,
        } as any}
      />,
    );

    expect(screen.queryByText('Upload choices')).not.toBeInTheDocument();
  });
});


/**
 * A2: Waehrend einer laufenden Generierung bleibt in Visualize nur der
 * Senden-Weg gesperrt. Modell, Parameter und Referenz-Slots wirken ab dann auf
 * den naechsten Lauf — der abgeschickte Request ist eingefroren.
 */
describe('ChatInput Visualize controls during a running generation', () => {
  const visualizeState = {
    uploadedImages: [],
    isUploading: false,
    supportsReference: true,
    requiresSourceVideo: false,
    maxImages: 4,
    selectedModelId: 'flux',
    setSelectedModelId: jest.fn(),
    currentModelConfig: { id: 'flux', name: 'Flux', inputs: [] },
    formFields: {},
    handleFieldChange: jest.fn(),
    setFormFields: jest.fn(),
    isGptImage: false,
    isSeedream: false,
    isNanoPollen: false,
    isPollenModel: false,
    isPollinationsVideo: false,
    providerMode: 'pollinations',
    prunaAvailable: false,
    isVideoModel: false,
    supportsEndFrame: false,
    sourceVideo: null,
    handleRemoveImage: jest.fn(),
    handleRemoveSourceVideo: jest.fn(),
    handleEnhancePrompt: jest.fn(),
    isEnhancing: false,
    setPrompt: jest.fn(),
  };

  const renderComposer = (over: { isLoading?: boolean; isRecording?: boolean; isTranscribing?: boolean; row?: string | null }) => {
    mockUseChatInputLogic.mockReturnValue({
      ...(mockUseChatInputLogic.mock.results[0]?.value ?? {}),
      isMobile: false,
      activeBadgeRow: over.row === undefined ? 'upload' : over.row,
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null },
      modeButtonRef: { current: null }, modelButtonRef: { current: null }, paramsButtonRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(), setActiveMode: jest.fn(), handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(), handleFileChange: jest.fn(),
    } as any);
    return render(
    <ChatInput
      onSendMessage={jest.fn()} uploadedFilePreviewUrl={null} onFileSelect={jest.fn()}
      isLongLanguageLoopActive={false} inputValue="" onInputChange={jest.fn()}
      isImageMode onToggleImageMode={jest.fn()} selectedModelId="openai"
      handleModelChange={jest.fn()} webBrowsingEnabled={false} onToggleWebBrowsing={jest.fn()}
      startRecording={jest.fn()} stopRecording={jest.fn()} openCamera={jest.fn()}
      isLoading={over.isLoading ?? false}
      isRecording={over.isRecording ?? false}
      isTranscribing={over.isTranscribing ?? false}
      visualizeToolState={visualizeState as any}
    />,
    );
  };

  beforeEach(() => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false,
      activeBadgeRow: 'upload',
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null },
      modeButtonRef: { current: null },
      modelButtonRef: { current: null },
      paramsButtonRef: { current: null },
      docInputRef: { current: null },
      imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(),
      setActiveMode: jest.fn(),
      handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(),
      handleFileChange: jest.fn(),
    });
  });

  it('leaves model, parameters and reference slots usable while a generation runs', () => {
    // Geschlossene Auswahl: die Chips tragen den Zugang.
    const { unmount } = renderComposer({ isLoading: true, row: null });
    expect(screen.getByRole('button', { name: 'modelSelector.select' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'menu.section.parameters' })).toBeEnabled();
    unmount();

    // Offene Auswahl: die Leiste *ist* die Auswahl, die Chips sind ersetzt.
    renderComposer({ isLoading: true, row: 'upload' });
    expect(screen.queryByRole('button', { name: 'modelSelector.select' })).toBeNull();
    expect(screen.getByRole('button', { name: 'reference' })).toBeEnabled();
  });

  it('still locks them while recording or transcribing — they share the input', () => {
    const { unmount } = renderComposer({ isRecording: true, row: null });
    expect(screen.getByRole('button', { name: 'modelSelector.select' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'menu.section.parameters' })).toBeDisabled();
    unmount();

    const second = renderComposer({ isRecording: true, row: 'upload' });
    expect(screen.getByRole('button', { name: 'reference' })).toBeDisabled();
    second.unmount();

    renderComposer({ isTranscribing: true, row: null });
    expect(screen.getByRole('button', { name: 'modelSelector.select' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'menu.section.parameters' })).toBeDisabled();
  });
});

/**
 * Der Kern von Schnitt 02+01: rechts stehen in jedem Modus dieselben zwei
 * Elemente, und der Zugang zu Stimme/Stil verschwindet nicht, nur weil ein
 * Werkzeug laeuft. Beides war vorher modusabhaengig.
 */
describe('ChatInput fixed slots across modes', () => {
  const baseProps = {
    onSendMessage: jest.fn(), isLoading: false, uploadedFilePreviewUrl: null,
    onFileSelect: jest.fn(), isLongLanguageLoopActive: false, inputValue: 'ein prompt',
    onInputChange: jest.fn(), onToggleImageMode: jest.fn(), selectedModelId: 'openai',
    handleModelChange: jest.fn(), onToggleWebBrowsing: jest.fn(), isRecording: false,
    isTranscribing: false, startRecording: jest.fn(), stopRecording: jest.fn(),
    openCamera: jest.fn(),
  };

  const visualizeState = {
    uploadedImages: [], isUploading: false, supportsReference: true, requiresSourceVideo: false,
    maxImages: 4, selectedModelId: 'flux', setSelectedModelId: jest.fn(),
    currentModelConfig: { id: 'flux', name: 'Flux', inputs: [] }, formFields: { aspect_ratio: '16:9' },
    handleFieldChange: jest.fn(), setFormFields: jest.fn(), isPollenModel: false,
    isPollinationsVideo: false, providerMode: 'pollinations', prunaAvailable: false,
    isVideoModel: false, supportsEndFrame: false, sourceVideo: null,
    handleRemoveImage: jest.fn(), handleRemoveSourceVideo: jest.fn(),
    handleEnhancePrompt: jest.fn(), isEnhancing: false, setPrompt: jest.fn(),
  };

  const MODES = [
    ['standard', {}],
    ['visualize', { isImageMode: true, visualizeToolState: visualizeState }],
    ['research', { webBrowsingEnabled: true }],
    ['code', { isCodeMode: true, onToggleCodeMode: jest.fn() }],
  ] as const;

  beforeEach(() => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false, activeBadgeRow: null,
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null }, modeButtonRef: { current: null },
      modelButtonRef: { current: null }, paramsButtonRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(), setActiveMode: jest.fn(), handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(), handleFileChange: jest.fn(),
    });
  });

  it.each(MODES)('keeps the send side to microphone and send in %s mode', (_name, modeProps) => {
    const { unmount } = render(
      <ChatInput
        {...baseProps}
        isImageMode={false}
        webBrowsingEnabled={false}
        {...(modeProps as Record<string, unknown>)}
      />,
    );

    const right = screen.getByTestId('bar-actions-right');
    // Aufnahme und Senden stehen in jedem Modus rechts; Visualize und Compose
    // legen die Prompt-Verbesserung davor.
    expect(within(right).getByRole('button', { name: 'chat.send' })).toBeInTheDocument();
    expect(within(right).getByRole('button', { name: 'chat.startRecording' })).toBeInTheDocument();
    unmount();
  });

  /**
   * Antwortstil, Stimme und Tempo lagen doppelt vor — hier und in der Sidebar,
   * beide aus demselben useChatModes(). Die Leiste traegt sie nicht mehr; dieser
   * Test haelt den Rueckfall auf.
   */
  it('no longer carries voice and style — they live in settings only', () => {
    mockUseChatInputLogic.mockReturnValue({
      isMobile: false, activeBadgeRow: null,
      badgePanelRef: { current: null }, uploadButtonRef: { current: null },
      badgeActionsRef: { current: null }, modeButtonRef: { current: null },
      modelButtonRef: { current: null }, paramsButtonRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null },
      toggleBadgeRow: jest.fn(), setActiveMode: jest.fn(), handleSelectMode: jest.fn(),
      handleSubmit: jest.fn(), handleFileChange: jest.fn(),
    } as any);
    render(<ChatInput {...baseProps} isImageMode={false} webBrowsingEnabled={false} onToggleCodeMode={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'chat.quickSettings' })).toBeNull();
  });

  /** Prompt-Verbesserung steht vor Aufnahme und Senden — alle drei sind Aktionen. */
  it('puts prompt enhancement first in the action group', () => {
    render(
      <ChatInput {...baseProps} isImageMode webBrowsingEnabled={false} visualizeToolState={visualizeState as any} />,
    );

    const right = screen.getByTestId('bar-actions-right');
    const enhance = within(right).getByRole('button', { name: 'action.enhancePrompt' });
    expect(right.children[0]).toBe(enhance);
  });

  /**
   * Ohne Text belegt Senden keine Breite, damit Aufnahme und Verbesserung am
   * rechten Rand sitzen. Gemountet bleibt der Knopf trotzdem — beim Aus- und
   * Einhaengen verliert das Eingabefeld waehrend des Tippens den Fokus.
   */
  it('collapses send while there is nothing to send, without unmounting it', () => {
    const { unmount } = render(
      <ChatInput {...baseProps} inputValue="" isImageMode={false} webBrowsingEnabled={false} />,
    );
    const collapsed = screen.getByRole('button', { name: 'chat.send' });
    expect(collapsed).toBeInTheDocument();
    expect(collapsed.className).toContain('max-w-0');
    expect(collapsed).toBeDisabled();
    unmount();

    render(<ChatInput {...baseProps} inputValue="yo" isImageMode={false} webBrowsingEnabled={false} />);
    const expanded = screen.getByRole('button', { name: 'chat.send' });
    expect(expanded.className).not.toContain('max-w-0');
    expect(expanded).toBeEnabled();
  });
});

describe('ChatInput mode panel', () => {
  const baseProps = {
    onSendMessage: jest.fn(),
    isLoading: false,
    uploadedFilePreviewUrl: null,
    onFileSelect: jest.fn(),
    isLongLanguageLoopActive: false,
    inputValue: '',
    onInputChange: jest.fn(),
    isImageMode: false,
    onToggleImageMode: jest.fn(),
    selectedModelId: 'openai',
    handleModelChange: jest.fn(),
    webBrowsingEnabled: false,
    onToggleWebBrowsing: jest.fn(),
    isRecording: false,
    isTranscribing: false,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    openCamera: jest.fn(),
  };

  const logicMock = (overrides: Record<string, unknown>) => ({
    isMobile: false,
    activeBadgeRow: null,
    badgePanelRef: { current: null },
    uploadButtonRef: { current: null },
    badgeActionsRef: { current: null },
    modeButtonRef: { current: null },
    modelButtonRef: { current: null },
    paramsButtonRef: { current: null },
    docInputRef: { current: null },
    imageInputRef: { current: null },
    toggleBadgeRow: jest.fn(),
    setActiveMode: jest.fn(),
    handleSelectMode: jest.fn(),
    handleSubmit: jest.fn(),
    handleFileChange: jest.fn(),
    ...overrides,
  });

  it('opens the mode panel from the mode chip', () => {
    const toggleBadgeRow = jest.fn();
    mockUseChatInputLogic.mockReturnValue(logicMock({ toggleBadgeRow }) as any);

    render(<ChatInput {...baseProps} onToggleCodeMode={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'menu.section.mode' }));
    expect(toggleBadgeRow).toHaveBeenCalledWith('mode');
  });

  /**
   * Der Text hat die ganze Breite, die Steuerung steht darunter in *einer*
   * Reihe. Einzeilig verschmolzen brach der Platzhalter neben langen
   * Modellnamen um und lief unten aus der Leiste.
   */
  it('gives the input its own full-width row, controls below it', () => {
    mockUseChatInputLogic.mockReturnValue(logicMock({}) as any);
    const { container } = render(
      <ChatInput {...baseProps} isImageMode={false} webBrowsingEnabled={false} onToggleCodeMode={jest.fn()} />,
    );

    const textarea = container.querySelector('textarea');
    const rightActions = screen.getByTestId('bar-actions-right');
    expect(textarea).not.toBeNull();

    // Die Eingabe teilt sich ihre Zeile mit niemandem.
    expect(textarea!.parentElement).not.toContainElement(rightActions);

    // Konfiguration und Aktionen dagegen stehen zusammen in einer Reihe.
    const controlRow = rightActions.parentElement!;
    expect(controlRow.className).toContain('flex');
    expect(controlRow.querySelectorAll('button').length).toBeGreaterThan(1);
  });

  it('replaces the bar contents with the options — no second trigger, no doubled value', () => {
    mockUseChatInputLogic.mockReturnValue(logicMock({ activeBadgeRow: 'mode' }) as any);
    render(<ChatInput {...baseProps} onToggleCodeMode={jest.fn()} />);

    // Textzeile und Chip-Reihe sind fort: die Leiste *ist* die Auswahl.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('bar-actions-right')).toBeNull();

    // Der aktive Modus steht genau einmal da — als Option, nicht zusaetzlich
    // als Ausloeser darunter.
    const group = screen.getByRole('radiogroup', { name: 'menu.section.mode' });
    expect(within(group).getAllByText('tools.chat')).toHaveLength(1);
    expect(screen.getAllByText('tools.chat')).toHaveLength(1);
  });

  it('renders the mode options while the mode row is open and selects a mode', () => {
    const handleSelectMode = jest.fn();
    mockUseChatInputLogic.mockReturnValue(
      logicMock({ activeBadgeRow: 'mode', handleSelectMode }) as any,
    );

    render(<ChatInput {...baseProps} onToggleCodeMode={jest.fn()} />);

    const group = screen.getByRole('radiogroup', { name: 'menu.section.mode' });
    expect(within(group).getByRole('radio', { name: /tools.visualize/ })).toBeInTheDocument();

    fireEvent.click(within(group).getByRole('radio', { name: /tools.chat/ }));
    expect(handleSelectMode).toHaveBeenCalledWith('standard');
  });
});
