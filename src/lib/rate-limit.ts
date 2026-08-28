/**
 * In-memory fixed-window rate limiter for API routes.
 *
 * Known limitation: state lives per server instance. On App Hosting
 * (maxInstances: 1) this is a hard limit; on multi-instance deployments
 * (e.g. Vercel) it acts as a soft per-instance limit. Swap the store for
 * Redis/Upstash if stronger guarantees are needed.
 */

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

/** Periodically drop expired entries so the map cannot grow unbounded. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, state] of windows) {
    if (state.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitOptions {
  /** Unique bucket name, usually the route path. */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/** Test helper: clear all buckets between suites. */
export function _resetRateLimitForTesting(): void {
  windows.clear();
  lastCleanup = Date.now();
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const key = `${options.name}:${ip}`;
  const now = Date.now();

  cleanup(now);

  let state = windows.get(key);
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + options.windowMs };
    windows.set(key, state);
  }

  state.count += 1;

  if (state.count > options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    };
  }

  return { ok: true, retryAfterSeconds: 0 };
}
