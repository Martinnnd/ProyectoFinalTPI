import { describe, expect, it } from 'vitest';
import { navigationUrl, readNavigation } from './navigationState';

describe('navigation on refresh', () => {
  it.each([1970, 1980, 1990, 2000])('preserves a feed publication in %i', era => {
    const state = readNavigation(`?era=${era}&view=feed&post=42`);
    const url = navigationUrl('https://nostalgiar.test/explorar', state);
    expect(readNavigation(new URL(url, 'https://nostalgiar.test').search)).toEqual(state);
    expect(state.selectedId).toBe('42');
    expect(state.period.decade).toBe(era);
  });
  it('preserves another profile, year and category', () => {
    const state = readNavigation('?era=2000&year=2003&view=profile&profile=juan&category=Cine');
    expect(readNavigation(new URL(navigationUrl('https://example.com/explorar', state), 'https://example.com').search)).toEqual(state);
  });
  it('rejects invalid navigation parameters', () => {
    const state = readNavigation('?era=2025&year=1975&view=invalid&post=../secret&category=invalid');
    expect(state).toMatchObject({ period: { decade: 1990, year: null }, view: 'map', selectedId: null, category: 'Todas' });
  });
  it('removes closed publications and preserves unrelated query parameters', () => {
    const state = readNavigation('?era=1970&view=map&panel=stories');
    const url = navigationUrl('https://example.com/explorar?post=42&profile=juan&utm_source=test#map', state);
    expect(url).not.toContain('post=');
    expect(url).not.toContain('profile=');
    expect(url).toContain('utm_source=test');
    expect(url).toContain('panel=stories');
    expect(url).toContain('#map');
  });
});
