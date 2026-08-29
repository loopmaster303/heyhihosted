import type { Viewport } from 'next';
import { PlaygroundShell } from './PlaygroundShell';

export const metadata = { title: 'heyhi / create' };

// viewport-fit=cover ist die Voraussetzung dafuer, dass env(safe-area-inset-*)
// auf iOS ueberhaupt Werte ungleich 0 liefert — ohne das kann die Sendeleiste
// keinen Abstand zum Home-Indicator halten. Bewusst nur hier und nicht im
// Root-Layout: der Chat behandelt safe-area nirgends und wuerde die Aenderung
// ungefragt mitbekommen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function PlaygroundPage() {
  return <PlaygroundShell />;
}
