import { useId, useState } from 'react';
import { ArrowUpRight, Plus, Search, Users } from 'lucide-react';
import type { CommunityGroup } from '../types';

type GroupSearchProps = {
  groups: CommunityGroup[];
  onSelect: (groupId: string) => void;
  onJoin: (groupId: string) => Promise<string | null>;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

export default function GroupSearch({ groups, onSelect, onJoin }: GroupSearchProps) {
  const [query, setQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputId = useId();
  const resultsId = useId();
  const search = normalize(query.trim());
  const results = search ? groups.filter(group => !group.isMember && normalize(group.name).includes(search)) : [];

  function select(groupId: string) {
    setQuery('');
    onSelect(groupId);
  }

  async function join(groupId: string) {
    if (joiningId) return;
    setJoiningId(groupId);
    setError('');
    try {
      const joinError = await onJoin(groupId);
      if (joinError) setError(joinError);
      else setQuery('');
    } catch {
      setError('No se pudo unir al grupo. Intentá de nuevo.');
    } finally {
      setJoiningId(null);
    }
  }

  return <div className="group-search">
    <label htmlFor={inputId}><span><Search size={14}/> Buscar grupos</span></label>
    <input id={inputId} type="search" role="combobox" autoComplete="off" placeholder="Escribí el nombre del grupo" value={query} aria-autocomplete="list" aria-controls={query ? resultsId : undefined} aria-expanded={Boolean(query)} onChange={event => { setQuery(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); select(results[0].id); } }}/>
    {query && <div className="group-search-results" id={resultsId} aria-live="polite">
      {results.length ? results.map(group => <div className="group-search-result" key={group.id}>
        <Users size={18} aria-hidden="true"/>
        <button type="button" className="group-search-open" onClick={() => select(group.id)}><span className="group-search-result-copy"><strong>{group.name}</strong><small>No sos integrante · Ver grupo</small></span><ArrowUpRight size={16} aria-hidden="true"/></button>
        <button type="button" className="group-search-join" aria-label={`Unirse a ${group.name}`} disabled={joiningId !== null} onClick={() => void join(group.id)}><Plus size={16} aria-hidden="true"/><span>{joiningId === group.id ? 'Uniéndome…' : 'Unirse'}</span></button>
      </div>) : <p>No encontramos grupos con ese nombre.</p>}
      {error && <p role="alert" className="community-form-error">{error}</p>}
    </div>}
  </div>;
}
