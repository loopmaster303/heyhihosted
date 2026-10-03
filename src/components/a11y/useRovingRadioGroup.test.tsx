import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRovingRadioGroup, type RovingRadioOption } from './useRovingRadioGroup';

function TestGroup({ options, active }: { options: RovingRadioOption<string>[]; active: string }) {
  const { containerProps, getTabIndex } = useRovingRadioGroup(options, active);
  return (
    <div role="radiogroup" aria-label="test" {...containerProps}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === active}
          tabIndex={getTabIndex(option.value)}
          disabled={option.disabled}
        >
          {option.value}
        </button>
      ))}
    </div>
  );
}

describe('useRovingRadioGroup', () => {
  it('gibt genau einem Knopf tabIndex=0 — der aktiven Option', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b' }, { value: 'c' }]} active="b" />);
    expect(screen.getByRole('radio', { name: 'a' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'b' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'c' })).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight bewegt den Fokus zur naechsten Option und laeuft am Ende um', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b' }, { value: 'c' }]} active="a" />);
    const [a, b, c] = screen.getAllByRole('radio');
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    expect(b).toHaveFocus();
    fireEvent.keyDown(b, { key: 'ArrowRight' });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: 'ArrowRight' });
    expect(a).toHaveFocus();
  });

  it('ArrowLeft bewegt den Fokus rueckwaerts und laeuft am Anfang um', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b' }, { value: 'c' }]} active="a" />);
    const [a, b, c] = screen.getAllByRole('radio');
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowLeft' });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: 'ArrowLeft' });
    expect(b).toHaveFocus();
  });

  it('ArrowDown und ArrowUp verhalten sich wie ArrowRight und ArrowLeft', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b' }, { value: 'c' }]} active="a" />);
    const [a, b] = screen.getAllByRole('radio');
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    expect(b).toHaveFocus();
    fireEvent.keyDown(b, { key: 'ArrowUp' });
    expect(a).toHaveFocus();
  });

  it('Home und End springen an die Enden', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b' }, { value: 'c' }]} active="a" />);
    const [a, , c] = screen.getAllByRole('radio');
    a.focus();
    fireEvent.keyDown(a, { key: 'End' });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: 'Home' });
    expect(a).toHaveFocus();
  });

  it('ueberspringt deaktivierte Optionen bei der Pfeiltastennavigation', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }]} active="a" />);
    const [a, , c] = screen.getAllByRole('radio');
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    expect(c).toHaveFocus();
  });

  it('traegt tabIndex=0 auf die erste aktivierbare Option, wenn die aktive deaktiviert ist', () => {
    render(<TestGroup options={[{ value: 'a', disabled: true }, { value: 'b' }, { value: 'c' }]} active="a" />);
    expect(screen.getByRole('radio', { name: 'a' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'b' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'c' })).toHaveAttribute('tabindex', '-1');
  });

  it('meldet aria-disabled am Container, wenn keine Option aktivierbar ist', () => {
    render(<TestGroup options={[{ value: 'a', disabled: true }, { value: 'b', disabled: true }]} active="a" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).toHaveAttribute('tabindex', '-1'));
  });

  it('setzt kein aria-disabled, solange mindestens eine Option aktivierbar ist', () => {
    render(<TestGroup options={[{ value: 'a' }, { value: 'b', disabled: true }]} active="a" />);
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-disabled');
  });
});
