import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

import { ReferenceSlots } from './ReferenceSlots';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';

function model(overrides: Partial<PlaygroundModelEntry> = {}): PlaygroundModelEntry {
  return {
    id: 'wan-i2v',
    name: 'Wan I2V',
    provider: 'pruna',
    kind: 'video',
    supportsReference: true,
    requiresReference: true,
    maxImages: 2,
    referenceMode: 'start-end-frame',
    unmapped: false,
    supportsEndFrame: false,
    supportsAudio: false,
    paidOnly: true,
    community: false,
    ...overrides,
  };
}

describe('ReferenceSlots', () => {
  it('renders nothing when the model does not support references', () => {
    const { container } = render(
      <ReferenceSlots
        model={model({ supportsReference: false, maxImages: 0 })}
        uploads={[]}
        onChange={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });


  it('removing a filled slot calls onChange without that url', () => {
    const onChange = jest.fn();
    render(
      <ReferenceSlots
        model={model()}
        uploads={['https://x/a.png', 'https://x/b.png']}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start entfernen' }));
    expect(onChange).toHaveBeenCalledWith(['https://x/b.png']);
  });

  // Nicht zehn leere Kaesten: immer nur der naechste freie Platz, das Limit
  // steht als Hinweis darueber.
  it('shows one empty slot at a time and names the limit', () => {
    render(<ReferenceSlots model={model({ maxImages: 5, referenceMode: undefined })} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText('0 von bis zu 5 Bildern')).toBeInTheDocument();
    expect(screen.getAllByText(/^#\d$/)).toHaveLength(1);
  });

  it('reveals the next slot once one is filled', () => {
    render(
      <ReferenceSlots
        model={model({ maxImages: 5, referenceMode: undefined })}
        uploads={['https://x/a.png']}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('1 von bis zu 5 Bildern')).toBeInTheDocument();
    // Ein gefuellter Platz plus ein freier.
    expect(screen.getByRole('button', { name: /entfernen/ })).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('stops adding slots at the limit', () => {
    render(
      <ReferenceSlots
        model={model({ maxImages: 2, referenceMode: undefined })}
        uploads={['https://x/a.png', 'https://x/b.png']}
        onChange={() => {}}
      />
    );
    expect(screen.getAllByRole('button', { name: /entfernen/ })).toHaveLength(2);
    expect(screen.queryByText('#3')).not.toBeInTheDocument();
  });

  // Das Endframe ergibt sich aus derselben Regel: ohne Startframe kein zweiter Platz.
  it('unlocks the end frame only after a start frame', () => {
    const { rerender } = render(<ReferenceSlots model={model()} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.queryByText('Ende')).not.toBeInTheDocument();

    rerender(<ReferenceSlots model={model()} uploads={['https://x/start.png']} onChange={() => {}} />);
    expect(screen.getByText('Ende')).toBeInTheDocument();
  });
});
