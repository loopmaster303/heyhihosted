import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualizeReferenceBadges } from './VisualizeReferenceBadges';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

describe('VisualizeReferenceBadges', () => {
  it('shows a visible image-plus upload trigger for reference-capable models', () => {
    const { container } = render(
      <VisualizeReferenceBadges
        uploadedImages={[]}
        maxImages={14}
        supportsReference
        onRemove={jest.fn()}
        onUploadClick={jest.fn()}
        selectedModelId="nanobanana-2"
      />
    );

    const button = screen.getByRole('button', { name: 'Add reference image' });
    expect(screen.getByText('0/14')).toBeInTheDocument();
    expect(screen.queryByText(/Referenzen/i)).toBeNull();
    expect(button).toHaveClass('h-6', 'w-6', 'rounded-md');
    expect(button.querySelector('[data-icon="ImagePlus"]')).not.toBeNull();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('gap-1.5');
    expect(wrapper.children[0]).toBe(button);
    expect(wrapper.children[1]).toHaveTextContent('0/14');
  });

  it('shows separate source-video and reference-image upload triggers for source-video models', () => {
    render(
      <VisualizeReferenceBadges
        uploadedImages={[]}
        maxImages={3}
        supportsReference
        requiresSourceVideo
        onRemove={jest.fn()}
        onUploadClick={jest.fn()}
        onSourceVideoUploadClick={jest.fn()}
        selectedModelId="p-video-replace"
      />
    );

    expect(screen.getByRole('button', { name: 'Add source video' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reference image' })).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('shows source-video upload even when a model has no reference-image support', () => {
    render(
      <VisualizeReferenceBadges
        uploadedImages={[]}
        maxImages={0}
        supportsReference={false}
        requiresSourceVideo
        onRemove={jest.fn()}
        onUploadClick={jest.fn()}
        onSourceVideoUploadClick={jest.fn()}
        selectedModelId="future-source-video-only"
      />
    );

    expect(screen.getByRole('button', { name: 'Add source video' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add reference image' })).toBeNull();
  });

  it('keeps reference-image uploads available after a source video is attached', () => {
    render(
      <VisualizeReferenceBadges
        uploadedImages={[{ url: 'https://example.com/frame.jpg' }]}
        maxImages={3}
        supportsReference
        requiresSourceVideo
        sourceVideo={{ url: 'https://example.com/source.mp4' }}
        onRemove={jest.fn()}
        onUploadClick={jest.fn()}
        onSourceVideoRemove={jest.fn()}
        selectedModelId="p-video-replace"
      />
    );

    expect(screen.getByRole('button', { name: 'Remove source video' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reference image' })).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });
});
