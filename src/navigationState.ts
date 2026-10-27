import { categories, type Period } from './types';

export function readNavigation(search: string) {
  const params = new URLSearchParams(search);
  const requested = Number(params.get('era'));
  const decade: Period['decade'] = requested === 1970 || requested === 1980 || requested === 2000 || requested === 2010 ? requested : 1990;
  const year = Number(params.get('year'));
  const requestedView = params.get('view');
  const view: 'map' | 'feed' | 'profile' | 'chat' = requestedView === 'feed' || requestedView === 'profile' || requestedView === 'chat' ? requestedView : 'map';
  const post = params.get('post');
  return {
    period: { decade, year: Number.isInteger(year) && year >= decade && year < decade + 10 ? year : null } as Period,
    view,
    selectedId: post && /^[1-9]\d*$/.test(post) ? post : null,
    profileAuthor: params.get('profile') || null,
    category: categories.find(value => value === params.get('category')) ?? 'Todas' as const,
    panelOpen: params.get('panel') === 'stories',
    factsOpen: params.get('panel') === 'facts',
  };
}

export function navigationUrl(href: string, state: ReturnType<typeof readNavigation>) {
  const url = new URL(href);
  const values = {
    era: String(state.period.decade), view: state.view,
    year: state.period.year === null ? null : String(state.period.year),
    post: state.selectedId, profile: state.view === 'profile' ? state.profileAuthor : null,
    category: state.category === 'Todas' ? null : state.category,
    panel: state.view === 'map' ? state.panelOpen ? 'stories' : state.factsOpen ? 'facts' : null : null,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
