/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { GenerationControlStrip } from './GenerationControlStrip';
import type { GenerationRecord } from '@/types';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_t, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/config/image-aspect-ratio-presets', () => ({
  getAspectRatioPresetsForModel: () => ({
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
  }),
}));

jest.mock('@/config/unified-image-models', () => ({
  getUnifiedModel: (id: string) => (id === 'wan-t2v'
    ? { id, name: 'Wan T2V', kind: 'video', supportsAudio: true }
    : { id, name: 'Flux', kind: 'image' }),
  getDurationOptionsSeconds: () => [4, 8],
}));

const image: GenerationRecord = { prompt: 'a crab', modelId: 'flux', aspectRatio: '1:1' };

describe('GenerationControlStrip', () => {
  it('re-runs the same prompt when the ratio is changed', () => {
    const onRerun = jest.fn();
    render(<GenerationControlStrip generation={image} onRerun={onRerun} />);

    fireEvent.click(screen.getByRole('button', { name: 'generation.ratio: 1:1' }));
    expect(onRerun).toHaveBeenCalledWith({ ...image, aspectRatio: '16:9' });
  });

  it('re-rolls with the values untouched', () => {
    const onRerun = jest.fn();
    render(<GenerationControlStrip generation={image} onRerun={onRerun} />);

    fireEvent.click(screen.getByRole('button', { name: 'generation.rerun' }));
    expect(onRerun).toHaveBeenCalledWith(image);
  });

  it('carries the references of the run, so a re-run is not a different picture', () => {
    const onRerun = jest.fn();
    const withRefs: GenerationRecord = { ...image, references: [{ url: 'https://example.com/ref.png' } as any] };
    render(<GenerationControlStrip generation={withRefs} onRerun={onRerun} />);

    fireEvent.click(screen.getByRole('button', { name: 'generation.rerun' }));
    expect(onRerun.mock.calls[0][0].references).toEqual(withRefs.references);
  });

  it('offers duration and audio only for a video model', () => {
    const { unmount } = render(<GenerationControlStrip generation={image} onRerun={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'generation.audio' })).not.toBeInTheDocument();
    unmount();

    const video: GenerationRecord = { prompt: 'a crab', modelId: 'wan-t2v', aspectRatio: '16:9', duration: 4, audio: false };
    const onRerun = jest.fn();
    render(<GenerationControlStrip generation={video} onRerun={onRerun} />);

    fireEvent.click(screen.getByRole('button', { name: 'generation.audio' }));
    expect(onRerun).toHaveBeenCalledWith({ ...video, audio: true });

    fireEvent.click(screen.getByRole('button', { name: 'generation.duration: 4s' }));
    expect(onRerun).toHaveBeenCalledWith({ ...video, duration: 8 });
  });
});
