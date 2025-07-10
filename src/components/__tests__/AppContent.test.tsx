import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppContent from '../page/AppContent';
import { ChatProvider } from '../ChatProvider';

// Mock child components to isolate AppContent
jest.mock('../page/HomePage', () => ({ onSelectTile }: { onSelectTile: (id: string) => void }) => (
  <div>
    <h1>HomePage</h1>
    <button onClick={() => onSelectTile('long language loops')}>Go to Chat</button>
    <button onClick={() => onSelectTile('nocost imagination')}>Go to Image Tool</button>
  </div>
));
jest.mock('../page/ChatInterface', () => () => <div>ChatInterface</div>);
jest.mock('../tools/VisualizingLoopsTool', () => () => <div>VisualizingLoopsTool</div>);
jest.mock('../tools/ReplicateImageTool', () => () => <div>ReplicateImageTool</div>);
jest.mock('../tools/PersonalizationTool', () => () => <div>PersonalizationTool</div>);
jest.mock('../dialogs/EditTitleDialog', () => () => <div>EditTitleDialog</div>);
jest.mock('../dialogs/DeleteChatDialog', () => () => <div>DeleteChatDialog</div>);
jest.mock('../page/AppHeader', () => () => <div>AppHeader</div>);
jest.mock('lucide-react', () => ({ RefreshCw: () => <svg /> }));
// Mock AI flows and toast hook to avoid loading ESM modules
jest.mock('@/ai/flows/generate-chat-title', () => ({ generateChatTitle: jest.fn() }));
jest.mock('@/ai/flows/pollinations-chat-flow', () => ({ getPollinationsChatCompletion: jest.fn() }));
jest.mock('@/ai/flows/tts-flow', () => ({ textToSpeech: jest.fn() }));
jest.mock('@/ai/flows/stt-flow', () => ({ speechToText: jest.fn() }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

describe('AppContent Navigation', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
  });

  it('renders HomePage by default', () => {
    render(
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    );

    expect(screen.getByText('HomePage')).toBeInTheDocument();
    expect(screen.queryByText('ChatInterface')).not.toBeInTheDocument();
  });

  it('navigates to ChatInterface when a chat tile is clicked', async () => {
    render(
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    );

    // Initial state
    expect(screen.getByText('HomePage')).toBeInTheDocument();

    // Click button to navigate to chat
    fireEvent.click(screen.getByText('Go to Chat'));

    // Check that ChatInterface is now rendered
    expect(await screen.findByText('ChatInterface')).toBeInTheDocument();
    expect(screen.queryByText('HomePage')).not.toBeInTheDocument();
  });

  it('navigates to the image tool when its tile is clicked', async () => {
    render(
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    );

    // Initial state
    expect(screen.getByText('HomePage')).toBeInTheDocument();

    // Click button to navigate to image tool
    fireEvent.click(screen.getByText('Go to Image Tool'));

    // Check that VisualizingLoopsTool is now rendered
    expect(await screen.findByText('VisualizingLoopsTool')).toBeInTheDocument();
    expect(screen.queryByText('HomePage')).not.toBeInTheDocument();
  });
});
