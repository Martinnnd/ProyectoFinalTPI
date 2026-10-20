import { useId, useState } from 'react';
import { ArrowUpRight, Search, Users } from 'lucide-react';
import type { CommunityGroup } from '../types';

type GroupSearchProps = {
  groups: CommunityGroup[];
  onSelect: (groupId: string) => void;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export default function GroupSearch({ groups, onSelect }: GroupSearchProps) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const resultsId = useId();
  const search = normalize(query.trim());
  const results = search
    ? groups.filter(group => !group.isMember && normalize(group.name).includes(search))
    : [];

  function select(groupId: string) {
    setQuery('');
    onSelect(groupId);
  }

  return (
    <div className="group-search">
      <label htmlFor={inputId}>
        <span><Search size={14}/> Buscar grupos</span>
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        autoComplete="off"
        placeholder="Escribí el nombre del grupo"
        value={query}
        aria-autocomplete="list"
        aria-controls={query ? resultsId : undefined}
        aria-expanded={Boolean(query)}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && results[0]) {
            event.preventDefault();
            select(results[0].id);
          }
        }}
      />
      {query && (
        <div className="group-search-results" id={resultsId} aria-live="polite">
          {results.length ? results.map(group => (
            <button type="button" className="group-search-result" key={group.id} onClick={() => select(group.id)}>
              <Users size={18} aria-hidden="true"/>
              <span className="group-search-result-copy">
                <strong>{group.name}</strong>
                <small>No sos integrante · Ver grupo</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true"/>
            </button>
          )) : <p>No encontramos grupos con ese nombre.</p>}
        </div>
      )}
    </div>
  );
}
