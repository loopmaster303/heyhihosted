import { isAllowedRemoteMediaUrl } from '../remote-fetch-policy';

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
});
