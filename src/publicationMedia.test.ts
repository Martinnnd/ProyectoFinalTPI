import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicationMediaError } from './publicationMedia';

describe('regla de multimedia para crear recuerdos', () => {
  it('permite omitir el adjunto en el modo de presentación', () => {
    expect(publicationMediaError('', 'image', false)).toBeNull();
    expect(publicationMediaError('  ', 'video', false)).toBeNull();
  });
  it('permite volver a exigir un adjunto', () => {
    expect(publicationMediaError('', 'image', true)).toContain('Adjuntá');
    expect(publicationMediaError('https://example.test/foto.jpg', 'image', true)).toBeNull();
    expect(publicationMediaError('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', true)).toBeNull();
  });
  it('rechaza un adjunto inválido aunque sea opcional', () => {
    expect(publicationMediaError('http://example.test/foto.jpg', 'image', false)).not.toBeNull();
    expect(publicationMediaError('https://example.test/video', 'youtube', false)).not.toBeNull();
  });
});


afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it.each(['true', 'false'])('respeta la configuración NEXT_PUBLIC_REQUIRE_PUBLICATION_MEDIA=%s', async value => {
  vi.stubEnv('NEXT_PUBLIC_REQUIRE_PUBLICATION_MEDIA', value);
  vi.resetModules();
  const policy = await import('./publicationMedia');
  expect(policy.REQUIRE_PUBLICATION_MEDIA).toBe(value === 'true');
  expect(policy.publicationMediaError('', 'image') === null).toBe(value !== 'true');
});
