import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';

const setLanguage = jest.fn();
const setTheme = jest.fn();
jest.mock('@/components/LanguageProvider', () => ({ useLanguage: () => ({ language: 'de', setLanguage }) }));
jest.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark', setTheme }) }));

import { QuickToggles } from './QuickToggles';

describe('QuickToggles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('switches language with one tap and marks the current one', () => {
    render(<QuickToggles />);
    expect(screen.getByRole('button', { name: 'de' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    expect(setLanguage).toHaveBeenCalledWith('en');
  });

  it('flips the theme between dark and light', () => {
    render(<QuickToggles />);
    fireEvent.click(screen.getByRole('button', { name: /Light theme/ }));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('has no axe violations', async () => {
    const { container } = render(<QuickToggles />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
