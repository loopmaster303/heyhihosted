import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../chat/ChatInput';
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
jest.mock('lucide-react', () => ({
  Mic: () => <svg />,
  MicOff: () => <svg />,
  ImageIcon: () => <svg />,
  X: () => <svg />,
  Paperclip: () => <svg />,
  Send: () => <svg />,
  Brain: () => <svg />,
  Fingerprint: () => <svg />,
  Speech: () => <svg />,
}));

const baseProps = {
  onSendMessage: jest.fn(),
  isLoading: false,
  isImageModeActive: false,
  onToggleImageMode: jest.fn(),
  uploadedFilePreviewUrl: null as string | null,
  onFileSelect: jest.fn(),
  isLongLanguageLoopActive: false,
  selectedModelId: AVAILABLE_POLLINATIONS_MODELS[0].id,
  selectedResponseStyleName: AVAILABLE_RESPONSE_STYLES[0].name,
  onModelChange: jest.fn(),
  onStyleChange: jest.fn(),
  isRecording: false,
  onToggleRecording: jest.fn(),
  inputValue: '',
  onInputChange: jest.fn(),
  selectedVoice: AVAILABLE_TTS_VOICES[0].id,
  onVoiceChange: jest.fn(),
};

describe('ChatInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a message when Enter is pressed', () => {
    render(<ChatInput {...baseProps} inputValue="Hello" />);
    const textarea = screen.getByLabelText('Chat message input');
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(baseProps.onSendMessage).toHaveBeenCalledWith('Hello', { isImageModeIntent: undefined });
  });

  it('calls onFileSelect when a file is uploaded', () => {
    const { container } = render(<ChatInput {...baseProps} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(baseProps.onFileSelect).toHaveBeenCalledWith(file);
    expect(fileInput.value).toBe('');
  });
});
