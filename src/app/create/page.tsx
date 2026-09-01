import { PlaygroundShell } from './PlaygroundShell';

// L-A.5: eigene Beschreibung statt der geerbten aus dem Root-Layout — die
// beschreibt den Chat und benennt Create nicht.
export const metadata = {
  title: 'heyhi / create',
  description:
    'Create — der Vollbild-Arbeitsplatz für Bild und Video. Modellwahl, Referenzbilder, Parameter und Galerie an einem Ort. Ergebnisse bleiben im Browser.',
};

export default function CreatePage() {
  return <PlaygroundShell />;
}
