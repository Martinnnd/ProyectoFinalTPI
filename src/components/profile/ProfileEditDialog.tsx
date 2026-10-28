import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import type { UserProfile } from '../../profileApi';

type Props = {
  profile: UserProfile;
  onClose: () => void;
  onChangeUsername: (username: string) => Promise<UserProfile>;
  onChangePhoto: (file: File) => Promise<UserProfile>;
};

export default function ProfileEditDialog({ profile, onClose, onChangeUsername, onChangePhoto }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [username, setUsername] = useState(profile.username);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'username' | 'photo' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);

  async function saveUsername(event: FormEvent) {
    event.preventDefault();
    const value = username.trim();
    if (value.length < 3 || value.length > 50) {
      setError('El nombre de usuario debe tener entre 3 y 50 caracteres.');
      return;
    }
    if (value === profile.username) return;
    setBusy('username');
    setError('');
    setMessage('');
    try {
      await onChangeUsername(value);
      setMessage('Nombre de usuario actualizado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el nombre de usuario.');
    } finally {
      setBusy(null);
    }
  }

  async function savePhoto(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy('photo');
    setError('');
    setMessage('');
    try {
      await onChangePhoto(file);
      setFile(null);
      setMessage('Foto de perfil actualizada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <dialog ref={dialog} className="profile-edit-dialog" aria-labelledby="profile-edit-title" onClose={onClose}>
      <header>
        <h2 id="profile-edit-title">Editar mi perfil</h2>
        <button type="button" className="icon-button" aria-label="Cerrar" disabled={!!busy} onClick={onClose}><X size={20} /></button>
      </header>
      <form onSubmit={saveUsername}>
        <label htmlFor="profile-edit-username">Nombre de usuario</label>
        <div className="profile-edit-row">
          <input id="profile-edit-username" value={username} maxLength={50} minLength={3} required disabled={!!busy}
            onChange={event => setUsername(event.target.value)} />
          <button type="submit" className="primary-button" disabled={!!busy || username.trim() === profile.username}>
            {busy === 'username' ? <LoaderCircle size={16} className="spin" /> : null} Guardar nombre
          </button>
        </div>
        <small>Entre 3 y 50 caracteres.</small>
      </form>
      <form onSubmit={savePhoto}>
        <label htmlFor="profile-edit-photo">Foto de perfil</label>
        <input id="profile-edit-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy}
          onChange={event => setFile(event.target.files?.[0] ?? null)} />
        <small>JPG, PNG o WebP. Hasta 2 MiB.</small>
        <button type="submit" className="primary-button" disabled={!!busy || !file}>
          {busy === 'photo' ? <LoaderCircle size={16} className="spin" /> : null} Subir foto
        </button>
      </form>
      {error && <p role="alert" className="profile-edit-error">{error}</p>}
      {message && <p role="status" className="profile-edit-success">{message}</p>}
    </dialog>
  );
}
