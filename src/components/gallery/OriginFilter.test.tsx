import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OriginFilter } from './OriginFilter';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

describe('OriginFilter', () => {
  it('markiert die aktive Wahl', () => {
    render(<OriginFilter value={['create']} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'gallery.filterCreate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'gallery.filterChat' })).not.toBeChecked();
  });

  it('undefined bedeutet alles', () => {
    render(<OriginFilter value={undefined} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'gallery.filterAll' })).toBeChecked();
  });

  it('meldet den Chat-Bereich inklusive Compose', async () => {
    const onChange = jest.fn();
    render(<OriginFilter value={['create']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'gallery.filterChat' }));
    expect(onChange).toHaveBeenCalledWith(['chat', 'compose']);
  });

  it('meldet undefined fuer alles', async () => {
    const onChange = jest.fn();
    render(<OriginFilter value={['create']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'gallery.filterAll' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
