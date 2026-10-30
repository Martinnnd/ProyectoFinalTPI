import { useState } from 'react';
import { Info, Plus, Share2 } from 'lucide-react';
import type { CommunityGroup } from '../types';

export default function GroupHeaderActions({ group, canPublish, onInfo, onPublish, onJoin }: {
  group: CommunityGroup;
  canPublish: boolean;
  onInfo: () => void;
  onPublish: () => void;
  onJoin: () => Promise<string | null>;
}) {
  const [status, setStatus] = useState('');
  const [joining, setJoining] = useState(false);
  async function share() {
    try {
      const url = new URL('/feed', window.location.origin);
      url.searchParams.set('scope', group.id);
      await navigator.clipboard.writeText(url.href);
      setStatus('¡Enlace copiado!');
    } catch { setStatus('No se pudo copiar el enlace. Intentá de nuevo.'); }
  }
  async function join() {
    setJoining(true);
    try { setStatus(await onJoin() ?? 'Ya sos integrante del grupo.'); }
    finally { setJoining(false); }
  }
  return <div className="feed-group-header-actions">
    <button type="button" aria-label="Compartir grupo" title="Compartir grupo" onClick={()=>void share()}><Share2 size={18}/></button>
    <button type="button" aria-label="Información del grupo" title="Información del grupo" onClick={onInfo}><Info size={18}/></button>
    {canPublish && group.isMember && <button type="button" aria-label="Publicar recuerdo en este grupo" title="Publicar recuerdo en este grupo" onClick={onPublish}><Plus size={18}/></button>}
    {canPublish && !group.isMember && <button type="button" disabled={joining} onClick={()=>void join()}>{joining ? 'Uniéndome…' : 'Unirme al grupo'}</button>}
    {status && <span className="feed-group-action-status" role="status">{status}</span>}
  </div>;
}
