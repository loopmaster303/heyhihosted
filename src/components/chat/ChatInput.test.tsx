/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

jest.mock('./input/VisualCorner', () => ({
  VisualCorner: () => <div data-testid="visual-corner" />,
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
  VisualizeInlineHeader: ({ section }: { section?: 'model' | 'parameters' }) => (
    <div data-testid="visualize-model-header">
      {section !== 'parameters' && <span>Visualize model selector</span>}
      {section !== 'model' && <input aria-label="visualize parameter" />}
    </div>
  ),
}));

jest.mock('@/components/tools/compose/ComposeInlineHeader', () => ({
  ComposeInlineHeader: () => null,
}));

jest.mock('./input/ModelSelector', () => ({ ModelSelector: () => null }));
jest.mock('./input/QuickSettingsBadges', () => ({ QuickSettingsBadges: () => null }));
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
      hasActiveTool: true,
      badgePanelRef: { current: null },
      badgeActionsRef: { current: null },
      docInputRef: { current: null },
      imageInputRef: { current: null },
      quickSettingsButtonRef: { current: null },
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
        selectedResponseStyleName="default"
        handleStyleChange={jest.fn()}
        selectedVoice=""
        handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1}
        handleTtsSpeedChange={jest.fn()}
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

    expect(screen.getByTestId('visualize-model-header')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'menu.section.upload' })).toBeInTheDocument();
    expect(screen.getByTestId('visual-corner')).toBeInTheDocument();
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
        selectedResponseStyleName="default"
        handleStyleChange={jest.fn()}
        selectedVoice=""
        handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1}
        handleTtsSpeedChange={jest.fn()}
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
      isMobile: false, activeBadgeRow: 'upload', hasActiveTool: true,
      badgePanelRef: { current: null }, badgeActionsRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null }, quickSettingsButtonRef: { current: null },
      toggleBadgeRow: jest.fn(), setActiveMode: jest.fn(), handleSelectMode: jest.fn(), handleSubmit: jest.fn(), handleFileChange: jest.fn(),
    });
    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null} onFileSelect={jest.fn()}
        isLongLanguageLoopActive={false} inputValue="" onInputChange={jest.fn()} isImageMode
        onToggleImageMode={jest.fn()} selectedModelId="visual-only" handleModelChange={jest.fn()}
        webBrowsingEnabled={false} onToggleWebBrowsing={jest.fn()} isRecording={false}
        selectedResponseStyleName="default" handleStyleChange={jest.fn()} selectedVoice=""
        handleVoiceChange={jest.fn()} selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()}
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
      hasActiveTool: true,
      badgePanelRef: { current: null },
      badgeActionsRef: { current: null },
      docInputRef: { current: null },
      imageInputRef: { current: null },
      quickSettingsButtonRef: { current: null },
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
        onToggleWebBrowsing={jest.fn()} isRecording={false} selectedResponseStyleName="default"
        handleStyleChange={jest.fn()} selectedVoice="" handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()} isTranscribing={false}
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
        onToggleWebBrowsing={jest.fn()} isRecording={false} selectedResponseStyleName="default"
        handleStyleChange={jest.fn()} selectedVoice="" handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()} isTranscribing={false}
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
        onToggleWebBrowsing={jest.fn()} isRecording={false} selectedResponseStyleName="default"
        handleStyleChange={jest.fn()} selectedVoice="" handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()} isTranscribing={false}
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
        onToggleWebBrowsing={jest.fn()} isRecording={false} selectedResponseStyleName="default"
        handleStyleChange={jest.fn()} selectedVoice="" handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()} isTranscribing={false}
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
      hasActiveTool: true,
      badgePanelRef: { current: null }, badgeActionsRef: { current: null },
      docInputRef: { current: null }, imageInputRef: { current: null },
      quickSettingsButtonRef: { current: null }, toggleBadgeRow: jest.fn(),
      setActiveMode: jest.fn(), handleSelectMode: jest.fn(), handleSubmit: jest.fn(),
      handleFileChange: jest.fn(),
    });

    render(
      <ChatInput
        onSendMessage={jest.fn()} isLoading={false} uploadedFilePreviewUrl={null}
        onFileSelect={jest.fn()} isLongLanguageLoopActive={false} inputValue=""
        onInputChange={jest.fn()} isImageMode={false} onToggleImageMode={jest.fn()}
        selectedModelId="openai" handleModelChange={jest.fn()} webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()} isRecording={false} selectedResponseStyleName="default"
        handleStyleChange={jest.fn()} selectedVoice="" handleVoiceChange={jest.fn()}
        selectedTtsSpeed={1} handleTtsSpeedChange={jest.fn()} isTranscribing={false}
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
