/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedInput } from './unified-input';

jest.mock('../LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('UnifiedInput keyboard handling', () => {
  function setup(onSubmit: jest.Mock, onKeyDown?: (e: React.KeyboardEvent) => void) {
    render(
      <UnifiedInput
        value="hello"
        onChange={() => {}}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
        placeholder="type here"
      />,
    );
    return screen.getByLabelText('type here');
  }

  it('submits on plain Enter', () => {
    const onSubmit = jest.fn();
    const textarea = setup(onSubmit);

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Shift+Enter', () => {
    const onSubmit = jest.fn();
    const textarea = setup(onSubmit);

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('respects preventDefault from the consumer onKeyDown', () => {
    const onSubmit = jest.fn();
    const textarea = setup(onSubmit, (e) => e.preventDefault());

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit while IME composition is active', () => {
    const onSubmit = jest.fn();
    const textarea = setup(onSubmit);

    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
