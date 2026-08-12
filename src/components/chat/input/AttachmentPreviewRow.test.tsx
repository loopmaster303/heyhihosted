/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AttachmentPreviewRow } from './AttachmentPreviewRow';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

it('keeps remove visible on touch layouts and when the attachment receives keyboard focus', () => {
  render(<AttachmentPreviewRow items={[{ id: 'ref-1', type: 'image', fileName: 'Reference' }]} onRemove={jest.fn()} />);
  const remove = screen.getByRole('button', { name: 'chat.attachment.remove: Reference' });
  expect(remove).toHaveClass('opacity-100');
  expect(remove).toHaveClass('focus-visible:opacity-100');
});

it('gives non-image attachment tiles and their remove buttons an item-specific accessible name', () => {
  render(
    <AttachmentPreviewRow
      items={[
        { id: 'document', type: 'document', fileName: 'Brief.pdf' },
        { id: 'video', type: 'video', fileName: 'Clip.mp4' },
      ]}
      onRemove={jest.fn()}
    />,
  );

  expect(screen.getByRole('img', { name: 'Brief.pdf' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Clip.mp4' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'chat.attachment.remove: Brief.pdf' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'chat.attachment.remove: Clip.mp4' })).toBeInTheDocument();
});
