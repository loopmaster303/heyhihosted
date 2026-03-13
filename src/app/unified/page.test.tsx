import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { UnifiedAppContent } from './page';

const appLayoutSpy = jest.fn();
const landingViewSpy = jest.fn();
const chatInterfaceSpy = jest.fn();

const mockComposeToolState = {
  selectedModel: 'elevenmusic' as const,
  duration: 60,
  instrumental: false,
  isGenerating: false,
  isEnhancing: false,
  audioUrl: null,
  error: null,
  setSelectedModel: jest.fn(),
  setDuration: jest.fn(),
  setInstrumental: jest.fn(),
  generateMusic: jest.fn(),
  enhancePrompt: jest.fn(),
  reset: jest.fn(),
};

const mockConversation = {
  activeConversation: {
    id: 'conv-1',
    messages: [],
    selectedModelId: 'claude',
    selectedResponseStyleName: 'Basic',
    uploadedFilePreview: null,
    isCodeMode: false,
    toolType: 'long language loops',
  },
  allConversations: [
    {
      id: 'conv-1',
      messages: [],
      selectedModelId: 'claude',
      selectedResponseStyleName: 'Basic',
      uploadedFilePreview: null,
      isCodeMode: false,
      toolType: 'long language loops',
    },
  ],
  startNewChat: jest.fn(),
  selectChat: jest.fn(),
  deleteChat: jest.fn(),
};

const mockComposer = {
  isAiResponding: false,
  sendMessage: jest.fn(),
  setChatInputValue: jest.fn(),
  chatInputValue: '',
};

const mockMedia = {
  isCameraOpen: false,
  closeCamera: jest.fn(),
  handleFileSelect: jest.fn(),
};

const mockModes = {
  isImageMode: false,
  isComposeMode: false,
  webBrowsingEnabled: false,
  selectedImageModelId: 'flux',
  handleModelChange: jest.fn(),
};

const mockPanels = {
  toggleHistoryPanel: jest.fn(),
  isHistoryPanelOpen: false,
};

const mockVisualizeToolState = {
  formFields: {},
  uploadedImages: [],
  selectedModelId: 'flux',
};

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/chat'),
}));

jest.mock('@/hooks/useLocalStorageState', () => ({
  __esModule: true,
  default: jest.fn(() => ['gemini-fast', jest.fn()]),
}));

jest.mock('@/hooks/useUnifiedImageToolState', () => ({
  useUnifiedImageToolState: jest.fn(() => mockVisualizeToolState),
}));

jest.mock('@/hooks/useComposeMusicState', () => ({
  useComposeMusicState: jest.fn(() => mockComposeToolState),
}));

jest.mock('@/components/ChatProvider', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useChatComposer: jest.fn(() => mockComposer),
  useChatConversation: jest.fn(() => mockConversation),
  useChatMedia: jest.fn(() => mockMedia),
  useChatModes: jest.fn(() => mockModes),
  useChatPanels: jest.fn(() => mockPanels),
}));

jest.mock('@/components/layout/AppLayout', () => ({
  __esModule: true,
  default: (props: any) => {
    appLayoutSpy(props);
    return <div data-testid="app-layout">{props.children}</div>;
  },
}));

jest.mock('@/components/page/LandingView', () => ({
  __esModule: true,
  default: (props: any) => {
    landingViewSpy(props);
    return <div data-testid="landing-view" />;
  },
}));

jest.mock('@/components/page/ChatInterface', () => ({
  __esModule: true,
  default: (props: any) => {
    chatInterfaceSpy(props);
    return <div data-testid="chat-interface" />;
  },
}));

jest.mock('@/components/dialogs/CameraCaptureDialog', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/PageLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="page-loader" />,
}));

jest.mock('@/components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('UnifiedAppContent', () => {
  beforeEach(() => {
    appLayoutSpy.mockClear();
    landingViewSpy.mockClear();
    chatInterfaceSpy.mockClear();
  });

  it('uses the visible default model instead of falling back to hidden claude in chat layout props', async () => {
    render(<UnifiedAppContent initialState="chat" />);

    await waitFor(() => expect(appLayoutSpy).toHaveBeenCalled());

    const lastProps = appLayoutSpy.mock.calls.at(-1)?.[0];
    expect(lastProps.selectedModelId).toBe('gemini-fast');
  });

  it('passes one shared compose tool state from the page layer into landing and chat views', async () => {
    const { rerender } = render(<UnifiedAppContent initialState="landing" />);

    await waitFor(() => expect(landingViewSpy).toHaveBeenCalled());
    expect(landingViewSpy.mock.calls.at(-1)?.[0].composeToolState).toBe(mockComposeToolState);

    rerender(<UnifiedAppContent initialState="chat" />);

    await waitFor(() => expect(chatInterfaceSpy).toHaveBeenCalled());
    expect(chatInterfaceSpy.mock.calls.at(-1)?.[0].composeToolState).toBe(mockComposeToolState);
  });
});
