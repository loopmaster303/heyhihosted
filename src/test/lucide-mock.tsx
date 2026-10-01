/**
 * lucide-react liefert nur ESM, Jest laeuft hier mit CommonJS. Jedes Icon wird
 * im Test zu einem schlichten <svg data-icon="Name">. Tests, die ein Icon
 * gezielt brauchen, mocken weiterhin selbst (jest.mock hat Vorrang).
 */
import React from 'react';

const icons = new Proxy({} as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>, {
  get: (_target, prop) => {
    if (prop === '__esModule') return true;
    const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...props} />;
    Icon.displayName = String(prop);
    return Icon;
  },
});

module.exports = icons;
