import { ERROR_CODES, type ErrorCode } from './error-codes';

export interface ErrorDescription {
  satz: string;
  aktion?: 'settings' | 'retry' | 'pick-model';
}

export interface DescribeContext {
  modelLabel?: string;
  field?: string;
  retryAfterSeconds?: number;
}

const TABLE: Record<ErrorCode, (ctx: DescribeContext) => ErrorDescription> = {
  MISSING_PRUNA_KEY: (ctx) => ({
    satz: `**${ctx.modelLabel ?? 'Dieses Modell'}** läuft über Pruna und braucht deinen eigenen Pruna-Schlüssel.`,
    aktion: 'settings',
  }),
  PRUNA_API_ERROR: (ctx) => ({
    satz: `**${ctx.modelLabel ?? 'Dieses Modell'}** kennt die Einstellung \`${ctx.field ?? 'unbekannt'}\` nicht. Das ist ein Fehler bei uns, nicht bei dir — bitte melden. Ohne diese Einstellung erneut versuchen.`,
    aktion: 'retry',
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
  UNKNOWN_MODEL: (ctx) => ({
    satz: ctx.modelLabel
      ? `Das Modell \`${ctx.modelLabel}\` gibt es nicht (mehr).`
      : 'Das Modell gibt es nicht (mehr).',
    aktion: 'pick-model',
  }),
  VALIDATION_ERROR: (ctx) => ({
    satz: ctx.field === 'prompt'
      ? 'Der Prompt fehlt.'
      : ctx.field
        ? `Das Feld \`${ctx.field}\` ist ungültig.`
        : 'Die Eingabe ist unvollständig oder ungültig.',
  }),
  REFERENCE_NOT_SUPPORTED: (ctx) => ({
    satz: `**${ctx.modelLabel ?? 'Dieses Modell'}** kann keine Referenzbilder. Entferne das Bild oder wähle ein Modell, das sie nimmt.`,
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

export function describeUnknown(status: number, raw: string): ErrorDescription {
  const basis = `Der Dienst hat mit ${status} geantwortet und keine Begründung geliefert.`;
  return { satz: raw ? `${basis} ${raw}` : basis };
}
