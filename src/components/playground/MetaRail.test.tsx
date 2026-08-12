/**
 * MetaRail unit tests: curated chips from stored params, action wiring,
 * placeholder without selection. ESM-only ui packages are stubbed because
 * jest does not transform node_modules.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { MetaRail, chipsFor } from './MetaRail';
import type { GalleryItem } from './Gallery';

const ITEM: GalleryItem = {
  id: 'a1',
  url: 'https://x/a.png',
  kind: 'image',
  prompt: 'ein Fuchs',
  modelId: 'flux',
  timestamp: Date.now(),
  params: {
    aspect_ratio: '1:1',
    seed: 84213,
    steps: 30,
    guidance: 7.5,
    duration: 5,
    go_fast: false,
    audio: true,
  },
};

describe('MetaRail', () => {
  it('renders curated chips from the stored params', () => {
    render(<MetaRail item={ITEM} />);
    for (const chip of ['flux', 'ar 1:1', 'seed 84213', 'steps 30', 'guid 7.5', '5 s', 'audio']) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
    // false-Booleans erzeugen keinen Chip
    expect(screen.queryByText('fast')).not.toBeInTheDocument();
  });

  it('wires Laden / Nochmal / Als Referenz uebernehmen', async () => {
    const user = userEvent.setup();
    const onLoad = jest.fn();
    const onRerun = jest.fn();
    const onUseAsReference = jest.fn();
    render(
      <MetaRail item={ITEM} onLoad={onLoad} onRerun={onRerun} onUseAsReference={onUseAsReference} />,
    );

    await user.click(screen.getByRole('button', { name: 'Laden' }));
    await user.click(screen.getByRole('button', { name: 'Nochmal' }));
    await user.click(screen.getByRole('button', { name: 'Als Referenz übernehmen' }));

    expect(onLoad).toHaveBeenCalledWith(ITEM);
    expect(onRerun).toHaveBeenCalledWith(ITEM);
    expect(onUseAsReference).toHaveBeenCalledWith(ITEM);
  });

  it('shows a placeholder when nothing is selected', () => {
    render(<MetaRail item={null} />);
    expect(screen.getByText(/Wähl ein Ergebnis/)).toBeInTheDocument();
  });

  it('chipsFor skips false booleans and formats duration', () => {
    expect(chipsFor({ go_fast: false, audio: true, duration: 8 })).toEqual(['8 s', 'audio']);
    expect(chipsFor(undefined)).toEqual([]);
  });
});
