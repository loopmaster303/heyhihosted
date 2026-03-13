const ALLOWED_REMOTE_MEDIA_HOSTS = new Set([
  'media.pollinations.ai',
  'gen.pollinations.ai',
  'image.pollinations.ai',
]);

const IPV4_PARTS_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function isPrivateIpv4(hostname: string): boolean {
  if (!IPV4_PARTS_PATTERN.test(hostname)) return false;

  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized === '[::1]' ||
    normalized.endsWith('.localhost') ||
    isPrivateIpv4(normalized)
  );
}

export interface RemoteMediaUrlPolicyResult {
  allowed: boolean;
  reason?: 'invalid-url' | 'protocol-not-allowed' | 'private-network-host' | 'host-not-allowed';
}

export function validateRemoteMediaUrl(rawUrl: string): RemoteMediaUrlPolicyResult {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: 'invalid-url' };
  }

  if (parsed.protocol !== 'https:') {
    return { allowed: false, reason: 'protocol-not-allowed' };
  }

  if (isPrivateHostname(parsed.hostname)) {
    return { allowed: false, reason: 'private-network-host' };
  }

  if (!ALLOWED_REMOTE_MEDIA_HOSTS.has(parsed.hostname)) {
    return { allowed: false, reason: 'host-not-allowed' };
  }

  return { allowed: true };
}

export function isAllowedRemoteMediaUrl(rawUrl: string): boolean {
  return validateRemoteMediaUrl(rawUrl).allowed;
}
