
"use client";

import { useEffect, type RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;
type RefArray = RefObject<HTMLElement>[];

// Updated to also ignore clicks within Radix popper content wrappers,
// which is necessary for Select/Dropdown menus that render in a portal.
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  refs: RefArray,
  handler: (event: AnyEvent) => void,
  ignoredClass?: string,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const target = event.target as Node;

      // Do nothing if the click is on an element with the ignored class
      if (ignoredClass && (target as Element).closest(`.${ignoredClass}`)) {
        return;
      }
      
      // Do nothing if the click is inside a Radix popper (for Selects, Dropdowns etc.)
      if ((target as Element).closest('[data-radix-popper-content-wrapper]')) {
        return;
      }

      // Do nothing if the click is on one of the refs' elements or their descendants
      const isInside = refs.some(ref => {
        const el = ref?.current;
        return el && el.contains(target);
      });

      if (isInside) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, ignoredClass]);
}
