/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { UnifiedMobileDrawer } from './UnifiedMobileDrawer';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, icon) => (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(icon)} {...props} />,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) => ({
      'menu.section.mode': 'Mode',
      'menu.section.upload': 'Attachment',
      'menu.section.model': 'Model',
      'menu.section.parameters': 'Parameters',
      'menu.options': 'Options',
      'action.close': 'Close',
      'menu.noOptions': 'No options',
      'tools.code': 'Code mode',
    }[key] || key),
  }),
}));

describe('UnifiedMobileDrawer', () => {
  it('uses the translated code-mode label in its header', () => {
    render(
      <UnifiedMobileDrawer
        isOpen
        onClose={jest.fn()}
        currentMode="code"
        modeContent={<div>Mode controls</div>}
      />,
    );

    expect(screen.getByText('Code mode')).toBeInTheDocument();
  });

  it('switches sections and closes when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <UnifiedMobileDrawer
        isOpen
        onClose={onClose}
        initialSection="model"
        modelContent={<div>Model controls</div>}
        parametersContent={<div>Parameter controls</div>}
      />,
    );

    expect(screen.getByText('Model controls')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Parameters' }));
    expect(screen.getByText('Parameter controls')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets to the requested section when reopened', () => {
    const { rerender } = render(
      <UnifiedMobileDrawer
        isOpen
        onClose={jest.fn()}
        initialSection="model"
        modelContent={<div>Model controls</div>}
        parametersContent={<div>Parameter controls</div>}
      />,
    );
    expect(screen.getByText('Model controls')).toBeInTheDocument();

    rerender(
      <UnifiedMobileDrawer
        isOpen={false}
        onClose={jest.fn()}
        initialSection="parameters"
        modelContent={<div>Model controls</div>}
        parametersContent={<div>Parameter controls</div>}
      />,
    );
    rerender(
      <UnifiedMobileDrawer
        isOpen
        onClose={jest.fn()}
        initialSection="parameters"
        modelContent={<div>Model controls</div>}
        parametersContent={<div>Parameter controls</div>}
      />,
    );

    expect(screen.getByText('Parameter controls')).toBeInTheDocument();
  });

  it('contains focus, closes from its backdrop, and returns focus to its opener', () => {
    const Harness = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>Open options</button>
          <button type="button">Background action</button>
          <UnifiedMobileDrawer
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            modeContent={<button type="button">Mode control</button>}
          />
        </>
      );
    };
    render(<Harness />);

    const opener = screen.getByRole('button', { name: 'Open options' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();
    const dialogButtons = within(dialog).getAllByRole('button');
    const first = dialogButtons[0];
    const last = dialogButtons[dialogButtons.length - 1];

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(first).toHaveFocus();
    dialog.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(opener).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
