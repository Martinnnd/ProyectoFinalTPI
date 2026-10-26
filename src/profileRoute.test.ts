import { afterEach, expect, it, vi } from 'vitest';
import { decodeProfileUsername } from './profileRoute';
import { getPerfilUsuario } from './userApi';

afterEach(() => vi.unstubAllGlobals());

it.each(['agustin@gmail.com', 'agustin%40gmail.com'])(
  'consulta el perfil de %s codificando el arroba una sola vez', async (routeValue) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ username: 'agustin@gmail.com' })));
    vi.stubGlobal('fetch', fetch);
    const username = decodeProfileUsername(routeValue);
    expect(username).toBe('agustin@gmail.com');
    await getPerfilUsuario(username);
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/api/usuario/perfil/agustin%40gmail.com');
    expect(fetch.mock.calls[0][0]).not.toContain('%2540');
  },
);

it('conserva nombres con porcentajes literales y decodifica caracteres Unicode', () => {
  expect(decodeProfileUsername('ana%')).toBe('ana%');
  expect(decodeProfileUsername('Jos%C3%A9%40gmail.com')).toBe('José@gmail.com');
});
