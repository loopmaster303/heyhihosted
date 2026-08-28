/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ResearchDepthBadges, resolveResearchDepth, researchDepthLabelKey } from './ResearchDepthBadges';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_t, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('research depth', () => {
  it('names the two models the mode has always used', () => {
    expect(resolveResearchDepth('perplexity-fast')).toBe('fast');
    expect(resolveResearchDepth('perplexity-reasoning')).toBe('thorough');
  });

  it('falls back to a custom label for any other model', () => {
    expect(resolveResearchDepth('deepseek')).toBeNull();
    expect(researchDepthLabelKey(null)).toBe('research.depth.custom');
  });

  it('switches the model when the other depth is picked', () => {
    const onModelChange = jest.fn();
    render(<ResearchDepthBadges selectedModelId="perplexity-fast" onModelChange={onModelChange} />);

    expect(screen.getByRole('radio', { name: 'research.depth.fast' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'research.depth.thorough' }));
    expect(onModelChange).toHaveBeenCalledWith('perplexity-reasoning');
  });

  it('locks both options while the input is busy', () => {
    render(<ResearchDepthBadges selectedModelId="perplexity-fast" onModelChange={jest.fn()} disabled />);
    screen.getAllByRole('radio').forEach((option) => expect(option).toBeDisabled());
  });
});
