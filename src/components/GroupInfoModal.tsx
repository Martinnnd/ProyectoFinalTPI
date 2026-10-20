import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, DoorOpen, Edit3, MessageSquareText, Trash2, UserRound, Users, X } from 'lucide-react';
import { availableDecades } from '../eras/registry';
import {
  deleteGroup,
  getGroup,
  getGroupMembers,
  leaveGroup,
  updateGroup,
  type GroupMember,
} from '../groupsApi';
import type { CommunityGroup, Decade } from '../types';

type GroupInfoModalProps = {
  group: CommunityGroup;
  memoryCount: number;
  onClose: () => void;
  onUpdated: (group: CommunityGroup) => void;
  onDeleted: (groupId: string) => void;
  onLeft: (groupId: string) => void;
  onOpenMember: (member: GroupMember) => void;
};

function formatDate(value?: string) {
  if (!value) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(value));
}

export default function GroupInfoModal({ group, memoryCount, onClose, onUpdated, onDeleted, onLeft, onOpenMember }: GroupInfoModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState(group);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<'delete' | 'leave' | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [decade, setDecade] = useState<Decade>(group.decade);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const controller = new AbortController();
    dialog.current?.showModal();
    Promise.all([
      getGroup(group.id, controller.signal),
      getGroupMembers(group.id, controller.signal),
    ]).then(([nextDetail, nextMembers]) => {
      if (controller.signal.aborted) return;
      setDetail(nextDetail);
      setMembers(nextMembers);
      setName(nextDetail.name);
      setDescription(nextDetail.description);
      setDecade(nextDetail.decade);
      setLoading(false);
    }).catch(loadError => {
      if (!controller.signal.aborted) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la información del grupo.');
        setLoading(false);
      }
    });
    return () => {
      controller.abort();
      if (previous?.isConnected) previous.focus();
    };
  }, [group.id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);setError('');setStatus('');
    try {
      const updated = await updateGroup(detail.id, { name: name.trim(), description: description.trim(), decade });
      setDetail(updated);setEditing(false);setStatus('Grupo actualizado.');onUpdated(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el grupo.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);setError('');
    try {
      await deleteGroup(detail.id);
      onDeleted(detail.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el grupo.');
      setBusy(false);setConfirming(null);
    }
  }

  async function leave() {
    if (busy) return;
    setBusy(true);setError('');
    try {
      await leaveGroup(detail.id);
      onLeft(detail.id);
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'No se pudo salir del grupo.');
      setBusy(false);setConfirming(null);
    }
  }

  return (
    <dialog ref={dialog} className="group-info-dialog" aria-labelledby="group-info-title" onCancel={event => {event.preventDefault();event.stopPropagation();if(!busy)onClose();}} onKeyDown={event => event.stopPropagation()}>
      <header className="group-info-heading">
        <div><small>INFORMACIÓN DEL GRUPO</small><h2 id="group-info-title">{detail.name}</h2></div>
        <button type="button" className="icon-button" disabled={busy} aria-label="Cerrar información del grupo" onClick={onClose}><X size={18}/></button>
      </header>

      <div className="group-info-content">
        {loading && <p role="status">Cargando información…</p>}
        {!loading && !editing && <>
          <div className="group-info-stats" aria-label="Resumen del grupo">
            <span><CalendarDays size={18}/><strong>{detail.decade}–{detail.decade + 9}</strong><small>Década</small></span>
            <span><Users size={18}/><strong>{detail.memberCount ?? members.length}</strong><small>Integrantes</small></span>
            <span><MessageSquareText size={18}/><strong>{memoryCount}</strong><small>Recuerdos</small></span>
          </div>
          <section className="group-info-description">
            <h3>Acerca del grupo</h3>
            <p>{detail.description || 'Este grupo todavía no tiene una descripción.'}</p>
            <small>Creado por {detail.creator?.username ?? members.find(member => member.isCreator)?.username ?? 'usuario desconocido'} · {formatDate(detail.createdAt)}</small>
          </section>
          <section className="group-member-list">
            <h3>Integrantes</h3>
            {members.length ? <ul>{members.map(member => <li key={member.id}><button type="button" className="group-member-profile" onClick={()=>onOpenMember(member)} aria-label={`Ver perfil de ${member.username}`}><span className="group-member-avatar"><UserRound size={17}/></span><span><strong>{member.username}</strong><small>Se unió el {formatDate(member.joinedAt)}</small></span></button>{member.isCreator&&<em>Creador</em>}</li>)}</ul>:<p>No hay integrantes para mostrar.</p>}
          </section>
        </>}

        {editing && <form className="group-edit-form" onSubmit={save}>
          <label>Nombre<input required minLength={3} maxLength={100} value={name} onChange={event => setName(event.target.value)} disabled={busy}/></label>
          <label>Descripción<textarea maxLength={500} rows={4} value={description} onChange={event => setDescription(event.target.value)} disabled={busy}/></label>
          <label>Década<select value={decade} onChange={event => setDecade(Number(event.target.value) as Decade)} disabled={busy}>{availableDecades.map(value => <option key={value} value={value}>{value}–{value + 9}</option>)}</select></label>
          <div className="group-edit-actions"><button type="button" disabled={busy} onClick={()=>{setEditing(false);setName(detail.name);setDescription(detail.description);setDecade(detail.decade);}}>Cancelar</button><button type="submit" className="community-publish" disabled={busy}>{busy?'Guardando…':'Guardar cambios'}</button></div>
        </form>}

        {confirming && <div className="group-danger-confirm" role="alert">
          <strong>{confirming==='delete'?'¿Eliminar definitivamente este grupo?':'¿Salir de este grupo?'}</strong>
          <p>{confirming==='delete'?'Los recuerdos se conservarán como publicaciones normales, pero esta acción no se puede deshacer.':'El grupo dejará de aparecer en Mis grupos y ya no podrás publicar dentro de él.'}</p>
          <div><button type="button" disabled={busy} onClick={()=>setConfirming(null)}>Cancelar</button><button type="button" className="group-danger-button" disabled={busy} onClick={()=>void (confirming==='delete'?remove():leave())}>{busy?'Procesando…':confirming==='delete'?'Eliminar grupo':'Salir del grupo'}</button></div>
        </div>}

        {error&&<p role="alert" className="community-form-error">{error}</p>}
        {status&&<p role="status" className="group-info-status">{status}</p>}
      </div>

      {!loading && !editing && !confirming && <footer className="group-info-actions">
        {detail.isCreator&&<><button type="button" onClick={()=>{setEditing(true);setStatus('');}}><Edit3 size={16}/>Editar grupo</button><button type="button" className="group-danger-button" onClick={()=>setConfirming('delete')}><Trash2 size={16}/>Eliminar grupo</button></>}
        {detail.isMember&&!detail.isCreator&&<button type="button" className="group-danger-button" onClick={()=>setConfirming('leave')}><DoorOpen size={16}/>Salir del grupo</button>}
        <button type="button" onClick={onClose}>Cerrar</button>
      </footer>}
    </dialog>
  );
}
