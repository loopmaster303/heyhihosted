import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import MessageBubble from './MessageBubble';
import type { ChatMessage } from '@/types';

jest.mock('@/components/LanguageProvider', () => ({ useLanguage: () => ({ t: (k: string) => k, language: 'de' }) }));
jest.mock('@/hooks/useAssetUrl', () => ({ useAssetUrl: () => ({ url: undefined }) }));
jest.mock('@/components/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}));

describe('MessageBubble', () => {
  it('puts a generated image outside the text bubble — no frame around it', async () => {
    const message: ChatMessage = {
      id: 'a1',
      role: 'assistant',
      timestamp: 't',
      content: [
        { type: 'text', text: 'Hier ist dein Fuchs.' },
        { type: 'image_url', image_url: { url: '', status: 'pending', prompt: 'a red fox', modelId: 'flux', isGenerated: true } },
      ],
    };
    const { container } = render(<MessageBubble message={message} />);
    const bubble = screen.getByTestId('markdown').closest('div.rounded-3xl');
    const figure = container.querySelector('figure');
    expect(bubble).not.toBeNull();
    expect(figure).not.toBeNull();
    expect(bubble!.contains(figure)).toBe(false);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('never shows the model-facing vision label to the person', () => {
    const message: ChatMessage = {
      id: 'u1',
      role: 'user',
      timestamp: 't',
      content: [
        { type: 'text', text: 'Vision Context:\n- IMAGE_0: Current Upload\n\nWas ist das?' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,xx', isUploaded: true, altText: 'foto.png' } },
      ],
    };
    render(<MessageBubble message={message} />);
    expect(screen.getByText('Was ist das?')).toBeInTheDocument();
    expect(screen.queryByText(/Vision Context/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hochgeladenes Bild vergrößern/ })).toBeInTheDocument();
  });

  it('keeps actions reachable by keyboard, not only on hover', () => {
    const message: ChatMessage = { id: 'a2', role: 'assistant', timestamp: 't', content: 'Antwort.' };
    render(<MessageBubble message={message} onCopy={jest.fn()} onPlayAudio={jest.fn()} />);
    const copy = screen.getByRole('button', { name: 'action.copy' });
    expect(copy.closest('.reveal-on-hover')).not.toBeNull();
  });
});
