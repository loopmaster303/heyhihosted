/**
 * Der Anbieter lehnt den INHALT ab — nicht den Schluessel und nicht sich
 * selbst. Live belegt am 2026-09-10 gegen ein gpt-image-Modell:
 *
 *   400 {"message":"Your request was rejected by the safety system."}
 *
 * Unser Media-Ingest las das als "wiederholtes 4xx" und meldete
 * PROVIDER_UNAVAILABLE: "Der Anbieter antwortet gerade nicht. Das liegt nicht
 * an deiner Eingabe — in ein paar Minuten erneut versuchen." Der Nutzer haette
 * denselben Prompt beliebig oft erneut gesendet; ein abgelehnter Prompt wird
 * durch Warten nicht besser. Diese Funktion trennt die beiden Faelle, damit
 * der Satz die Ursache nennt.
 */
const CONTENT_REJECTION_PATTERN =
  /safety system|content[_ ]polic|moderation|violat\w* (?:our|the) polic|unsafe content|flagged as unsafe|rejected by the safety/i;

/**
 * Nur die Status, bei denen ein abgelehnter Inhalt wirklich vorkommt. Ein 403
 * mit "not allowed for this API key" ist ausdruecklich KEIN Inhaltsfall — er
 * spricht ueber einen Schluessel und wird woanders uebersetzt.
 */
export function isContentRejection(status: number, bodyText: string): boolean {
  if (status !== 400 && status !== 422 && status !== 451) return false;
  return CONTENT_REJECTION_PATTERN.test(bodyText);
}
