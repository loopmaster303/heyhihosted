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

  it('labels the two slots Start and Ende for start-end-frame models', () => {
    render(<ReferenceSlots model={model()} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Ende')).toBeInTheDocument();
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
});
