import { checkRateLimit } from './rate-limit';

function requestWithIp(ip: string): Request {
  return new Request('http://localhost/api/test', {
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  });
}

describe('checkRateLimit', () => {
  const options = { name: 'test-route', limit: 3, windowMs: 60_000 };

  it('allows requests up to the limit', () => {
    const request = requestWithIp('1.1.1.1');
    expect(checkRateLimit(request, options).ok).toBe(true);
    expect(checkRateLimit(request, options).ok).toBe(true);
    expect(checkRateLimit(request, options).ok).toBe(true);
  });

  it('blocks requests beyond the limit and reports retry-after', () => {
    const request = requestWithIp('2.2.2.2');
    for (let i = 0; i < 3; i++) checkRateLimit(request, options);

    const result = checkRateLimit(request, options);
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('tracks clients independently', () => {
    const blocked = requestWithIp('3.3.3.3');
    for (let i = 0; i < 3; i++) checkRateLimit(blocked, options);
    expect(checkRateLimit(blocked, options).ok).toBe(false);

    expect(checkRateLimit(requestWithIp('4.4.4.4'), options).ok).toBe(true);
  });

  it('separates buckets by route name', () => {
    const request = requestWithIp('5.5.5.5');
    for (let i = 0; i < 3; i++) checkRateLimit(request, options);
    expect(checkRateLimit(request, options).ok).toBe(false);
    expect(checkRateLimit(request, { ...options, name: 'other-route' }).ok).toBe(true);
  });

  it('allows again after the window has passed', () => {
    jest.useFakeTimers();
    try {
      const request = requestWithIp('6.6.6.6');
      for (let i = 0; i < 3; i++) checkRateLimit(request, options);
      expect(checkRateLimit(request, options).ok).toBe(false);

      jest.advanceTimersByTime(60_001);
      expect(checkRateLimit(request, options).ok).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('falls back to a shared bucket when no IP headers exist', () => {
    const anonymous = new Request('http://localhost/api/test');
    for (let i = 0; i < 3; i++) checkRateLimit(anonymous, { name: 'anon-route', limit: 3, windowMs: 60_000 });
    expect(checkRateLimit(anonymous, { name: 'anon-route', limit: 3, windowMs: 60_000 }).ok).toBe(false);
  });
});
