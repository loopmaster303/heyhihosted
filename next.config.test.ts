/**
 * Guard for the create-host redirect in next.config.ts. The hyphen typo
 * (create.heyhi.cloud) fails silently — the rule simply never matches and the
 * page answers, just wrong. Only noticeable at the live deploy by hand, so the
 * exact spelling is asserted here.
 */
import nextConfig from './next.config';

describe('next.config redirects', () => {
  it('keeps the old /playground path reachable — it lives in bookmarks and shared links', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects[0]).toMatchObject({
      source: '/playground',
      destination: '/create',
      permanent: false,
    });
    // Keine Host-Bedingung: der alte Pfad muss unter jedem Host greifen.
    expect(redirects[0]).not.toHaveProperty('has');
  });

  it('redirects the create host onto the shared chat origin — hyphen included', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects).toHaveLength(3);
    expect(redirects[1]).toMatchObject({
      source: '/',
      has: [{ type: 'host', value: 'create.hey-hi.cloud' }],
      destination: 'https://chat.hey-hi.cloud/create',
      permanent: false,
    });
    expect(redirects[2]).toMatchObject({
      source: '/:path*',
      has: [{ type: 'host', value: 'create.hey-hi.cloud' }],
      destination: 'https://chat.hey-hi.cloud/:path*',
      permanent: false,
    });
  });
});
