import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Sheet } from './Sheet';

describe('Sheet — der eine Panel-Baustein', () => {
  it('is a labelled dialog with a reachable close button and no axe violations', async () => {
    const onOpenChange = jest.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} side="right" title="Einstellungen">
        <p>Inhalt</p>
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    expect(dialog).toBeInTheDocument();
    // vaul wertet Zeiger-Gesten aus (Wischen); in jsdom fehlt dafuer
    // setPointerCapture. Ein Klick ohne Zeiger entspricht der Tastatur.
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('closes on Escape', async () => {
    const onOpenChange = jest.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} side="left" title="Verlauf">
        <button type="button">Eintrag</button>
      </Sheet>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
