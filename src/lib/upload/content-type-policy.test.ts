import { isActiveContentType } from './content-type-policy';

describe('isActiveContentType', () => {
  it.each([
    'text/html',
    'application/xhtml+xml',
    'image/svg+xml',
    'text/javascript',
    'application/javascript',
    'application/x-javascript',
    'application/xml',
    'text/xml',
  ])('blocks active content type %s', (contentType) => {
    expect(isActiveContentType(contentType)).toBe(true);
  });

  it.each([
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'application/octet-stream',
  ])('allows passive content type %s', (contentType) => {
    expect(isActiveContentType(contentType)).toBe(false);
  });

  it('ignores parameters and casing', () => {
    expect(isActiveContentType('Image/SVG+XML; charset=utf-8')).toBe(true);
    expect(isActiveContentType('TEXT/HTML')).toBe(true);
    expect(isActiveContentType('image/png; boundary=x')).toBe(false);
  });
});
