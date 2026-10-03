import { ERROR_CODES, type ErrorCode } from './error-codes';

export interface ErrorDescription {
  satz: string;
  aktion?: 'settings' | 'retry' | 'pick-model';
}

export interface DescribeContext {
  modelLabel?: string;
  field?: string;
  retryAfterSeconds?: number;
  /** Obergrenze eines Feldes, damit der Satz sie nennen kann statt nur „ungueltig". */
  limit?: number;
}

const TABLE: Record<ErrorCode, (ctx: DescribeContext) => ErrorDescription> = {
  MISSING_PRUNA_KEY: (ctx) => ({
    satz: `${ctx.modelLabel ?? 'Dieses Modell'} läuft über Pruna und braucht deinen eigenen Pruna-Schlüssel.`,
    aktion: 'settings',
  }),
  PRUNA_API_ERROR: (ctx) => ({
    // Ohne Feldnamen sagt die Pruna-4xx nichts ueber eine Einstellung — dann
    // darf der Satz auch keine erfinden.
    satz: ctx.field
      ? `${ctx.modelLabel ?? 'Dieses Modell'} kennt die Einstellung „${ctx.field}" nicht. Das ist ein Fehler bei uns, nicht bei dir — bitte melden. Ohne diese Einstellung erneut versuchen.`
      : 'Pruna hat den Lauf abgelehnt. Der genaue Wortlaut steht in den Details der Karte.',
    aktion: 'retry',
  }),
  // Live belegt am 2026-09-10 gegen die Pruna-API: 403 "Forbidden: no more
  // credit available. Please go to https://dashboard.pruna.ai/ and add more
  // credit." Ohne eigenen Code las der Nutzer den Unknown-Field-Satz, also
  // "ein Fehler bei uns" — fuer eine Rechnung, die er selbst begleichen muss.
  PRUNA_NO_CREDIT: () => ({
    satz: 'Der verwendete Pruna-Schlüssel hat kein Guthaben mehr. Lade bei Pruna auf oder hinterlege in den Einstellungen einen Schlüssel mit Guthaben.',
    aktion: 'settings',
  }),
  PRUNA_PREDICTION_FAILED: () => ({
    satz: 'Der Lauf bei Pruna ist fehlgeschlagen. Erneut versuchen.',
    aktion: 'retry',
  }),
  PRUNA_RUN_ABANDONED: () => ({
    satz: 'Der Lauf läuft seit 30 Minuten ohne Ergebnis und wurde hier aufgegeben. Bei Pruna kann er weiterlaufen und trotzdem abgerechnet werden.',
  }),
  POLLEN_KEY_REQUIRED: () => ({
    satz: 'Dieses Modell braucht einen Pollen-Schlüssel.',
    aktion: 'settings',
  }),
  POLLEN_INSUFFICIENT: () => ({
    satz: 'Dein Pollen-Guthaben reicht für dieses Modell nicht.',
    aktion: 'settings',
  }),
  // Live belegt am 2026-09-10: der Betreiber-Schluessel hat 0.0000 Budget,
  // Pollinations antwortet 402. Der Lauf ging ueber unseren Schluessel, also
  // darf der Satz nicht von "deinem" Guthaben sprechen — der Nutzer sucht
  // sonst in einem Konto nach einem Problem, das er nicht hat. Der Ausweg
  // bleibt derselbe: eigener Schluessel.
  POLLEN_SERVER_BUDGET: (ctx) => ({
    satz: `Unser Pollen-Schlüssel hat kein Guthaben mehr, deshalb läuft ${ctx.modelLabel ?? 'dieses Modell'} gerade nicht. Mit einem eigenen Pollen-Schlüssel läuft es, sonst ein anderes Modell wählen.`,
    aktion: 'settings',
  }),
  // Live belegt am 2026-09-01: `kontext` antwortet 403 "Model 'kontext' is not
  // allowed for this API key". Gemeint ist der Schluessel des Betreibers, nicht
  // der des Nutzers — ohne eigenen Satz las der Nutzer einen englischen
  // Rohtext ueber einen Schluessel, den er gar nicht hat.
  POLLEN_MODEL_NOT_ALLOWED: (ctx) => ({
    satz: `${ctx.modelLabel ?? 'Dieses Modell'} ist auf unserem Schlüssel nicht freigeschaltet. Mit einem eigenen Pollen-Schlüssel läuft es, sonst ein anderes Modell wählen.`,
    aktion: 'settings',
  }),
  // Der Lauf hatte einen eigenen Schluessel des Nutzers. Derselbe 403-Rohtext
  // ("not allowed for this API key") meint dann SEINEN Schluessel — der alte
  // Satz haette ihm unseren erklaert und ihm geraten, genau den Schluessel
  // einzusetzen, mit dem er gerade unterwegs war.
  POLLEN_MODEL_NOT_ALLOWED_OWN_KEY: (ctx) => ({
    satz: `Dein Pollen-Schlüssel darf ${ctx.modelLabel ?? 'dieses Modell'} nicht nutzen. Wähle ein anderes Modell oder setze in den Einstellungen einen Schlüssel mit Zugriff auf dieses ein.`,
    aktion: 'pick-model',
  }),
  // Der Anbieter antwortet gar nicht oder mit 5xx. Nichts davon kann der
  // Nutzer beheben — der einzige sinnvolle Rat ist warten und erneut senden.
  PROVIDER_UNAVAILABLE: (ctx) => ({
    satz: ctx.retryAfterSeconds
      ? `Der Anbieter antwortet gerade nicht. In etwa ${ctx.retryAfterSeconds} Sekunden nochmal versuchen.`
      : 'Der Anbieter antwortet gerade nicht. Das liegt nicht an deiner Eingabe — in ein paar Minuten erneut versuchen.',
    aktion: 'retry',
  }),
  // Live belegt am 2026-09-10: ein gpt-image-Modell antwortet 400 "Your request
  // was rejected by the safety system". Das kam vorher als PROVIDER_UNAVAILABLE
  // an — also als Ausfall mit dem Rat zu warten, obwohl derselbe Prompt immer
  // wieder abgelehnt wird. Der einzige Ausweg ist ein anderer Prompt oder ein
  // anderes Modell, deshalb steht beides im Satz.
  CONTENT_REJECTED: (ctx) => ({
    // Der Media-Ingest kennt den Modellnamen nicht (er holt nur die URL ab),
    // deshalb muss der Satz auch ohne ihn stehen: "undefined hat den Prompt
    // abgelehnt" waere schlimmer als gar kein Name.
    satz: `${ctx.modelLabel ? `${ctx.modelLabel} hat` : 'Der Anbieter hat'} den Prompt abgelehnt: sein Sicherheitsfilter hat ihn beanstandet. Ein erneuter Versuch mit demselben Prompt scheitert genauso — ändere den Prompt oder wähle ein anderes Modell.`,
    aktion: 'pick-model',
  }),
  UNKNOWN_MODEL: (ctx) => ({
    satz: ctx.modelLabel
      ? `Das Modell „${ctx.modelLabel}" gibt es nicht (mehr).`
      : 'Das Modell gibt es nicht (mehr).',
    aktion: 'pick-model',
  }),
  VALIDATION_ERROR: (ctx) => ({
    satz: ctx.field === 'prompt'
      ? 'Der Prompt fehlt.'
      : ctx.field
        ? `Das Feld „${ctx.field}" ist ungültig.`
        : 'Die Eingabe ist unvollständig oder ungültig.',
  }),
  REFERENCE_NOT_SUPPORTED: (ctx) => ({
    satz: `${ctx.modelLabel ?? 'Dieses Modell'} kann keine Referenzbilder. Entferne das Bild oder wähle ein Modell, das sie nimmt.`,
  }),
  RATE_LIMITED: (ctx) => ({
    satz: ctx.retryAfterSeconds === undefined
      ? 'Zu viele Anfragen. Es geht in Kürze weiter.'
      : `Zu viele Anfragen. Es geht in ${ctx.retryAfterSeconds} s weiter.`,
  }),
  PRUNA_NETWORK_ERROR: () => ({
    satz: 'Die Verbindung zu Pruna ist fehlgeschlagen.',
  }),
  PRUNA_STATUS_ERROR: () => ({
    satz: 'Pruna hat einen ungültigen Lauf-Status gemeldet.',
  }),
  PRUNA_DOWNLOAD_ERROR: () => ({
    satz: 'Das Ergebnis bei Pruna konnte nicht geladen werden.',
  }),
  PRUNA_UPLOAD_ERROR: () => ({
    satz: 'Der Upload zu Pruna ist fehlgeschlagen.',
  }),
  PRUNA_MISSING_STATUS: () => ({
    satz: 'Pruna hat keinen Lauf-Status geliefert.',
  }),
  PRUNA_INVALID_ID: () => ({
    satz: 'Diese Lauf-ID ist bei Pruna unbekannt.',
  }),
  PRUNA_ABORTED: () => ({
    satz: 'Der Lauf bei Pruna wurde abgebrochen.',
  }),
  UNKNOWN_PRUNA_MODEL: () => ({
    satz: 'Dieses Pruna-Modell ist unbekannt.',
  }),
  PRUNA_MODEL_CONFIG_ERROR: () => ({
    satz: 'Die Konfiguration dieses Pruna-Modells ist fehlerhaft.',
  }),
  PRUNA_UNSAFE_URL: () => ({
    satz: 'Pruna hat eine unsichere URL abgelehnt.',
  }),
  PRUNA_UNSAFE_REDIRECT: () => ({
    satz: 'Pruna hat eine unsichere Weiterleitung abgelehnt.',
  }),
  PRUNA_UPLOAD_MISSING_URL: () => ({
    satz: 'Für den Upload fehlt die Ziel-URL.',
  }),
  // ---- Sound (selbst gehostetes ACE-Step auf Modal) ----
  // Die Route lief bis 2026-09-03 ganz ohne Codes; der Nutzer las englische
  // Rohtexte ueber einen Modal-Endpunkt, von dem er nichts wissen kann.
  SOUND_NOT_CONFIGURED: () => ({
    satz: 'Die Musikerzeugung ist auf diesem Server nicht eingerichtet. Das liegt nicht an dir — bitte melden.',
  }),
  SOUND_BACKEND_ERROR: () => ({
    satz: 'Der Musik-Server antwortet, aber nicht sinnvoll. Erneut versuchen; bleibt es dabei, bitte melden.',
    aktion: 'retry',
  }),
  SOUND_INVALID_PATH: () => ({
    satz: 'Diese Audio-Adresse gehoert nicht zu einem Ergebnis. Nichts abgerufen.',
  }),
  SOUND_FIELD_TOO_LONG: (ctx) => ({
    satz: ctx.field === 'lyrics'
      ? `Die Lyrics sind zu lang${ctx.limit ? ` — höchstens ${ctx.limit} Zeichen` : ''}. Kürze sie.`
      : `Die Tags sind zu lang${ctx.limit ? ` — höchstens ${ctx.limit} Zeichen` : ''}. ACE-Step arbeitet am besten mit 3 bis 7 Stichworten.`,
  }),
  // Der Modal-Container kann kalt starten; das dauert Minuten. Bricht der
  // Lauf danach immer noch nicht ab, ist er verloren — nicht bloss langsam.
  SOUND_TIMEOUT: () => ({
    satz: 'Der Lauf hat kein Ergebnis geliefert. Beim ersten Mal nach einer Pause startet der Musik-Server erst hoch — direkt nochmal versuchen geht meist schneller.',
    aktion: 'retry',
  }),
  SOUND_NO_AUDIO: () => ({
    satz: 'Der Lauf ist fertig, hat aber keine Audiodatei zurückgegeben. Erneut versuchen — meist hilft ein anderer Seed.',
    aktion: 'retry',
  }),
  INTERNAL_ERROR: () => ({
    satz: 'Im Dienst ist ein interner Fehler aufgetreten. Erneut versuchen.',
  }),
  UNKNOWN_ERROR: () => ({
    satz: 'Ein unbekannter Fehler ist aufgetreten. Erneut versuchen.',
  }),
};

export function describeError(code: string | undefined, ctx: DescribeContext): ErrorDescription | null {
  if (!code || !(ERROR_CODES as readonly string[]).includes(code)) return null;
  return TABLE[code as ErrorCode](ctx);
}
