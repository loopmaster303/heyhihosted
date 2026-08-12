/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CapabilityUploadBadges, type AttachmentAction } from './UploadBadges';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

const action = (kind: AttachmentAction['kind'], disabled = false): AttachmentAction => ({
  kind,
  disabled,
});

describe('CapabilityUploadBadges', () => {
  it('renders only the supplied Visualize frame and source-video actions', () => {
    const start = action('start-frame');
    const end = action('end-frame', true);
    const source = action('source-video');
    const onActionSelect = jest.fn();
    render(<CapabilityUploadBadges actions={[source, start, end]} onActionSelect={onActionSelect} />);

    expect(screen.getByRole('button', { name: 'chat.attachment.sourceVideo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'chat.attachment.startFrame' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'chat.attachment.endFrame' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'action.uploadDocument' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'chat.attachment.sourceVideo' }));
    expect(onActionSelect).toHaveBeenCalledWith('source-video');
  });

  it('renders no fallback standard actions when no actions are supplied', () => {
    render(<CapabilityUploadBadges actions={[]} onActionSelect={jest.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
