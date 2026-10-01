/**
 * Alte Adressen stehen in Lesezeichen und geteilten Links. Ein Tippfehler im
 * Ziel faellt erst am Live-Deploy auf, deshalb steht jede Umleitung hier fest.
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

  it('carries no host-bound rules — Chat und Create teilen einen Ursprung', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects.every((r) => !('has' in r))).toBe(true);
  });
});
