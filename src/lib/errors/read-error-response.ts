export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
  raw: string;
  field?: string;
  retryAfterSeconds?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function readErrorResponse(res: Response): Promise<ErrorResponse> {
  const raw = await res.text();

  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }

  let message = '';
  let code: string | undefined;
  let field: string | undefined;

  if (isRecord(body)) {
    const err = body.error;
    if (typeof err === 'string') {
      message = err;
    } else if (isRecord(err)) {
      if (typeof err.message === 'string') message = err.message;
      if (typeof err.code === 'string') code = err.code;
    }
    if (!code && typeof body.code === 'string') code = body.code;
    if (!message && typeof body.message === 'string') message = body.message;

    const details = body.details;
    if (isRecord(details) && typeof details.field === 'string') {
      field = details.field;
    } else if (Array.isArray(details) && isRecord(details[0]) && Array.isArray(details[0].path)) {
      const path = details[0].path;
      if (typeof path[0] === 'string') field = path[0];
    }
  }

  let retryAfterSeconds: number | undefined;
  const retryAfter = res.headers.get('Retry-After');
  if (retryAfter !== null) {
    const parsed = parseInt(retryAfter, 10);
    if (!Number.isNaN(parsed)) retryAfterSeconds = parsed;
  }

  return { status: res.status, message, code, raw, field, retryAfterSeconds };
}
