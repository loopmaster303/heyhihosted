import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ChatImage } from './ChatImage';

jest.mock('@/hooks/useAssetUrl', () => ({ useAssetUrl: () => ({ url: undefined }) }));

describe('ChatImage — ein Bild entsteht sichtbar (E15)', () => {
  it('holds its place with the ASCII field and a running caption while pending', async () => {
    const { container } = render(
      <ChatImage image={{ url: '', status: 'pending', prompt: 'a red fox', modelId: 'flux', isGenerated: true }} />,
    );
    expect(container.querySelector('figure')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/flux · erzeugt · 0:00/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the sentence and a retry in place when generation failed', async () => {
    const onRetry = jest.fn();
    const { container } = render(
      <ChatImage image={{ url: '', status: 'error', error: 'Pollinations antwortet nicht.', prompt: 'a fox', modelId: 'flux' }} onRetry={onRetry} />,
    );
    expect(screen.getByText('Pollinations antwortet nicht.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('appears frameless once decoded and offers zoom, download and Create', async () => {
    const onZoom = jest.fn();
    const onOpenInCreate = jest.fn();
    const { container } = render(
      <ChatImage
        image={{ url: 'https://media.example/fox.png', prompt: 'a red fox', modelId: 'flux', isGenerated: true }}
        onZoom={onZoom}
        onOpenInCreate={onOpenInCreate}
      />,
    );
    const img = screen.getByRole('img', { name: 'a red fox' });
    fireEvent.load(img);
    await waitFor(() => expect(screen.getByRole('button', { name: 'In Create weiterarbeiten' })).toBeInTheDocument());
    // rahmenlos: kein border am Bild, nur der Radius
    expect(img.className).not.toMatch(/\bborder\b/);
    await userEvent.click(screen.getByRole('button', { name: 'In Create weiterarbeiten' }));
    expect(onOpenInCreate).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Bild vergrößern: a red fox' }));
    expect(onZoom).toHaveBeenCalledWith('https://media.example/fox.png');
    expect(await axe(container)).toHaveNoViolations();
  });
});
