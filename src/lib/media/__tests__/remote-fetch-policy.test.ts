import { isAllowedRemoteMediaUrl, validateRemoteMediaFetchUrl, validateRemoteMediaUrl } from '../remote-fetch-policy';

describe('remote media policy', () => {
  it('allows current Pollinations media origins', () => {
    expect(isAllowedRemoteMediaUrl('https://media.pollinations.ai/hash')).toBe(true);
    expect(isAllowedRemoteMediaUrl('https://gen.pollinations.ai/image/example.png')).toBe(true);
  });

  it('rejects non-https and private-network targets', () => {
    expect(isAllowedRemoteMediaUrl('http://media.pollinations.ai/hash')).toBe(false);
    expect(isAllowedRemoteMediaUrl('http://127.0.0.1:3000/test.png')).toBe(false);
    expect(isAllowedRemoteMediaUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
  });

  it('rejects URLs containing username or password userinfo', () => {
    expect(isAllowedRemoteMediaUrl('https://user:pass@media.pollinations.ai/hash')).toBe(false);
    expect(validateRemoteMediaUrl('https://user:pass@cdn.example.com/image.png')).toEqual({
      allowed: false,
      reason: 'userinfo-not-allowed',
    });
  });
});

describe('validateRemoteMediaFetchUrl', () => {
  it('allows public http and https URLs', () => {
    expect(validateRemoteMediaFetchUrl('https://cdn.example.com/image.png')).toEqual({ allowed: true });
    expect(validateRemoteMediaFetchUrl('http://cdn.example.com/image.png')).toEqual({ allowed: true });
  });

  it('rejects non-http(s) protocols', () => {
    expect(validateRemoteMediaFetchUrl('ftp://cdn.example.com/image.png')).toEqual({
      allowed: false,
      reason: 'protocol-not-allowed',
    });
    expect(validateRemoteMediaFetchUrl('file:///etc/passwd')).toEqual({
      allowed: false,
      reason: 'protocol-not-allowed',
    });
  });

  it('rejects localhost and loopback targets', () => {
    expect(validateRemoteMediaFetchUrl('http://localhost:3000/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://127.0.0.1:3000/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
  });

  it('rejects private IPv4 ranges', () => {
    expect(validateRemoteMediaFetchUrl('http://10.0.0.1/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://192.168.1.1/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://172.16.0.1/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
  });

  it('rejects link-local targets', () => {
    expect(validateRemoteMediaFetchUrl('http://169.254.169.254/latest/meta-data')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
  });

  it('rejects private and loopback IPv6 targets', () => {
    expect(validateRemoteMediaFetchUrl('http://[::1]/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://[fe80::1]/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://[fd00::1]/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://[::ffff:127.0.0.1]/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
  });

  it('rejects obvious internal hostnames', () => {
    expect(validateRemoteMediaFetchUrl('http://server.local/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
    expect(validateRemoteMediaFetchUrl('http://server.internal/image.png')).toEqual({
      allowed: false,
      reason: 'private-network-host',
    });
  });

  it('blocks the real cloud-metadata endpoints via IP and reserved-TLD rules', () => {
    // AWS/GCP/Azure metadata IP (link-local)
    expect(validateRemoteMediaFetchUrl('http://169.254.169.254/latest/meta-data').allowed).toBe(false);
    // GCP metadata hostname ends in the reserved .internal TLD
    expect(validateRemoteMediaFetchUrl('http://metadata.google.internal/computeMetadata').allowed).toBe(false);
  });

  it('deliberately allows public hosts with scary-looking subdomain labels', () => {
    // Decision (Phase 3): we do NOT label-block public subdomains like
    // "metadata"/"internal"/"localhost" — they must still resolve to a public
    // IP to be reachable, DNS-rebinding is not caught by hostname checks anyway,
    // and label-blocking causes false positives on legitimate CDNs. The real
    // defense is the private-IP + reserved-TLD rules above.
    expect(validateRemoteMediaFetchUrl('https://metadata.example.com/x.png').allowed).toBe(true);
    expect(validateRemoteMediaFetchUrl('https://internal.example.com/x.png').allowed).toBe(true);
  });

  it('rejects URLs containing username or password userinfo', () => {
    expect(validateRemoteMediaFetchUrl('https://user:pass@cdn.example.com/image.png')).toEqual({
      allowed: false,
      reason: 'userinfo-not-allowed',
    });
    expect(validateRemoteMediaFetchUrl('http://user:pass@127.0.0.1/image.png')).toEqual({
      allowed: false,
      reason: 'userinfo-not-allowed',
    });
  });
});
