/**
 * D3.1: Die Trigger-Liste war rund 90 breite Einzelwoerter, gegen die eine
 * zweite Liste anlief. "Show me a matching function now" traf vier davon und
 * kostete eine echte Suchanfrage. Der Tabellentest haelt beide Richtungen fest.
 */
import { SmartRouter } from './smart-router';

describe('SmartRouter.shouldRouteToSearch', () => {
  describe('routes to search', () => {
    const cases = [
      'Was läuft heute Abend in Berlin?',
      'Wie ist das Wetter morgen?',
      'Gibt es aktuelle Nachrichten zur Wahl?',
      'Recherchiere die Geschichte des Bauhaus',
      'search for the current bitcoin price',
      'What is happening in the markets?',
      'Wer ist Ada Lovelace?',
      'tell me about the Voyager probes',
      'Welche Ausstellung läuft gerade im Museum?',
      // Schwacher Trigger plus Aktualitaet — genau die Kombination, die zaehlt.
      'Wie steht das Spiel heute?',
      "What's the score in the game right now?",
      'Welche Filme laufen diese Woche?',
    ];

    it.each(cases)('%s', (prompt) => {
      expect(SmartRouter.shouldRouteToSearch(prompt)).toBe(true);
    });
  });

  describe('does not route to search', () => {
    const cases = [
      // Der Fall aus dem Plan: show + match + now, alle drei schwach.
      'Show me a matching function now',
      // Entwickler-Prosa, die frueher reihenweise Fehlalarme ausloeste.
      'How do I add an event listener to this button?',
      'The regex match returns null, why?',
      'What HTTP status code should this endpoint return?',
      'Wie kann ich das Ergebnis der Funktion cachen?',
      'Write a game loop in TypeScript',
      'search the array for the first even number',
      'Show me the profile output of this function',
      'Refactor the opening of the file handle',
      'Erkläre mir den Unterschied zwischen let und const',
      'Schreib mir ein Gedicht über den Herbst',
      // Vergangenheitserzaehlung — der bestehende Suppressor.
      'Ich war gestern im Kino und der Film war gut',
      'I went to the museum yesterday and saw the exhibition',
      '',
    ];

    it.each(cases)('%s', (prompt) => {
      expect(SmartRouter.shouldRouteToSearch(prompt)).toBe(false);
    });
  });

  // Bekannte, bewusst in Kauf genommene Grenzen. Sie hier festzuhalten ist
  // ehrlicher, als die Heuristik zu verbiegen, bis der Testfall gruen wird —
  // die Klassifikation gehoert am Ende zum Modell (D3.2), nicht in eine Regex.
  describe('known limits of the heuristic', () => {
    it('still fires on a local "status" question because "aktuell" is a strong trigger', () => {
      expect(SmartRouter.shouldRouteToSearch('Wie ist der aktuelle Status meiner Datei?')).toBe(true);
    });

    it('misses a genuine live question that carries no qualifier', () => {
      expect(SmartRouter.shouldRouteToSearch('Where can I watch the game?')).toBe(false);
    });
  });
});
