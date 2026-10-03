import { useCallback, useRef } from 'react';

/**
 * Eine Option der Radiogruppe: der Wert, den der Knopf traegt, und ob er
 * gerade aktivierbar ist. `disabled` kommt vollstaendig vom Aufrufer — der
 * Hook entscheidet nur, was daraus fuer Fokus und Tastatur folgt.
 */
export interface RovingRadioOption<T> {
  readonly value: T;
  readonly disabled?: boolean;
}

export interface RovingRadioGroupContainerProps {
  ref: React.RefObject<HTMLDivElement | null>;
  onKeyDown: (event: React.KeyboardEvent) => void;
  'aria-disabled'?: true;
}

export interface UseRovingRadioGroupResult<T> {
  containerProps: RovingRadioGroupContainerProps;
  /** 0 fuer genau eine Option im Container, -1 fuer alle anderen. */
  getTabIndex: (value: T) => 0 | -1;
}

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/**
 * Roving Tabindex fuer eine role="radiogroup". Vorbild ist handleKeyDown in
 * ToolsBadges.tsx: die Pfeiltasten laufen ueber die Knoepfe im Container und
 * rufen .focus() auf dem Ziel, statt einen eigenen Fokuszustand zu fuehren.
 *
 * Ein deaktivierter Knopf kann keinen Fokus halten. tabIndex=0 bekommt deshalb
 * die aktive Option, sofern sie aktivierbar ist, sonst die erste aktivierbare.
 * Ist keine Option aktivierbar, bleibt kein tabIndex=0 uebrig, und der
 * Container meldet das ueber aria-disabled — der einzige Fall, in dem die
 * Gruppe nicht mehr per Tab erreichbar ist.
 *
 * WARUM ein Hook und nicht vier Kopien: vier Gruppen brauchen dieselbe Regel,
 * und vier Kopien laufen auseinander. Genau so ist der Zustand entstanden, den
 * das hier repariert — drei Gruppen ohne onKeyDown neben einer mit.
 */
export function useRovingRadioGroup<T>(
  options: readonly RovingRadioOption<T>[],
  activeValue: T,
): UseRovingRadioGroupResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!NAV_KEYS.has(event.key)) return;
    event.preventDefault();
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!buttons?.length) return;
    const list = Array.from(buttons);
    const current = list.findIndex((b) => b === document.activeElement);
    let next: number;
    if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = list.length - 1;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = current === -1 ? 0 : (current + 1) % list.length;
    } else {
      next = current === -1 ? list.length - 1 : (current - 1 + list.length) % list.length;
    }
    list[next]?.focus();
  }, []);

  const enabled = options.filter((option) => !option.disabled);
  const target = enabled.find((option) => option.value === activeValue) ?? enabled[0];

  const getTabIndex = (value: T): 0 | -1 => (target !== undefined && target.value === value ? 0 : -1);

  const containerProps: RovingRadioGroupContainerProps = {
    ref: containerRef,
    onKeyDown: handleKeyDown,
    ...(enabled.length === 0 ? { 'aria-disabled': true as const } : {}),
  };

  return { containerProps, getTabIndex };
}
