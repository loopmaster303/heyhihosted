const ALLOWED_REMOTE_MEDIA_HOSTS = new Set([
  'media.pollinations.ai',
  'gen.pollinations.ai',
  'image.pollinations.ai',
]);

const IPV4_PARTS_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;

const RESERVED_INTERNAL_TLDS = new Set([
  'localhost',
  'local',
  'internal',
  'lan',
  'home',
  'corp',
  'intranet',
  'private',
]);

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

function parseIpv4MappedIpv6(ipv6: string): string | null {
  const prefix = '::ffff:';
  if (!ipv6.toLowerCase().startsWith(prefix)) return null;

  const suffix = ipv6.slice(prefix.length).toLowerCase();

  // ::ffff:127.0.0.1
  if (IPV4_PARTS_PATTERN.test(suffix)) {
    return suffix;
  }

  // ::ffff:7f00:1 (normalized IPv4-mapped)
  const hexParts = suffix.split(':');
  if (hexParts.length === 2) {
    const high = parseInt(hexParts[0], 16);
    const low = parseInt(hexParts[1], 16);
    if (Number.isFinite(high) && Number.isFinite(low)) {
      return `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
    }
  }

  return null;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  const mappedIpv4 = parseIpv4MappedIpv6(normalized);
  if (mappedIpv4 && isPrivateIpv4(mappedIpv4)) {
    return true;
  }

  // Link-local (fe80::/10) and unique-local/private (fc00::/7)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  ) {
    return true;
  }

  return false;
}

function isInternalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (normalized === 'localhost' || normalized === '::1' || normalized === '[::1]') {
    return true;
  }
  if (isPrivateIpv4(normalized) || isPrivateIpv6(normalized)) {
    return true;
  }

  const parts = normalized.split('.');
  const tld = parts[parts.length - 1];
  return RESERVED_INTERNAL_TLDS.has(tld);
}

export interface RemoteMediaUrlPolicyResult {
  allowed: boolean;
  reason?: 'invalid-url' | 'protocol-not-allowed' | 'private-network-host' | 'host-not-allowed' | 'userinfo-not-allowed';
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

  if (parsed.username || parsed.password) {
    return { allowed: false, reason: 'userinfo-not-allowed' };
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

export interface RemoteMediaFetchUrlPolicyResult {
  allowed: boolean;
  reason?: 'invalid-url' | 'protocol-not-allowed' | 'private-network-host' | 'userinfo-not-allowed';
}

/**
 * Safety validator for server-side media fetches. Allows any public http(s)
 * origin but blocks internal/private targets. Used for both the initial URL
 * and every redirect target during ingest to prevent SSRF.
 */
export function validateRemoteMediaFetchUrl(
  rawUrl: string,
): RemoteMediaFetchUrlPolicyResult {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: 'invalid-url' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { allowed: false, reason: 'protocol-not-allowed' };
  }

  if (parsed.username || parsed.password) {
    return { allowed: false, reason: 'userinfo-not-allowed' };
  }

  if (isInternalHostname(parsed.hostname)) {
    return { allowed: false, reason: 'private-network-host' };
  }

  return { allowed: true };
}
