import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

const sendMessage = jest.fn(async () => {});
let inputValue = '';
const setChatInputValue = jest.fn((v: string) => { inputValue = v; });
const toggleWebBrowsing = jest.fn();
const toggleCodeMode = jest.fn();

jest.mock('@/components/ChatProvider', () => ({
  useChatComposer: () => ({ chatInputValue: inputValue, setChatInputValue, sendMessage, isAiResponding: false }),
  useChatConversation: () => ({ activeConversation: { selectedModelId: 'deepseek', isCodeMode: false, uploadedFilePreview: null } }),
  useChatModes: () => ({ webBrowsingEnabled: false, toggleWebBrowsing, toggleCodeMode, handleModelChange: jest.fn() }),
  useChatMedia: () => ({
    isRecording: false, isTranscribing: false, startRecording: jest.fn(), stopRecording: jest.fn(),
    openCamera: jest.fn(), handleFileSelect: jest.fn(),
  }),
}));
jest.mock('@/components/LanguageProvider', () => ({ useLanguage: () => ({ t: (k: string) => k, language: 'de' }) }));
jest.mock('@/hooks/useVisiblePollinationsTextModels', () => ({
  useVisiblePollinationsTextModels: () => ({ findModelById: () => ({ name: 'DeepSeek' }), visibleModels: [] }),
}));
jest.mock('./input/ModelSelector', () => ({ ModelSelectorPanel: () => <div>Modellliste</div> }));
jest.mock('./input/ModelLogo', () => ({ ModelLogo: () => null }));

import { Composer } from './Composer';

describe('Composer', () => {
  beforeEach(() => {
    inputValue = '';
    jest.clearAllMocks();
  });

  it('sends with Enter and keeps Shift+Enter for a new line', async () => {
    inputValue = 'Hallo Welt';
    render(<Composer />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, '{Shift>}{Enter}{/Shift}');
    expect(sendMessage).not.toHaveBeenCalled();
    await userEvent.type(textarea, '{Enter}');
    expect(sendMessage).toHaveBeenCalledWith('Hallo Welt');
  });

  it('does not send an empty message', async () => {
    render(<Composer />);
    expect(screen.getByRole('button', { name: 'chat.send' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('opens one tray at a time; Escape closes it and returns focus to its button', async () => {
    render(<Composer />);
    const attach = screen.getByRole('button', { name: 'menu.section.upload' });
    await userEvent.click(attach);
    expect(attach).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'chat.camera' })).toBeInTheDocument();

    await act(async () => { await userEvent.keyboard('{Escape}'); });
    expect(attach).toHaveAttribute('aria-expanded', 'false');
    expect(attach).toHaveFocus();
  });

  it('exposes research and code as pressed toggles', async () => {
    render(<Composer />);
    const research = screen.getByRole('button', { name: 'composer.research' });
    expect(research).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(research);
    expect(toggleWebBrowsing).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Composer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
