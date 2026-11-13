"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { getAccountCategory } from '../accountCategoryApi';
import {
  creationRestriction, hasAccountPermission, isCategoryPromotion, permissionDescription,
  type AccountCategoryCode, type AccountCategoryState, type AccountPermission,
} from '../accountCategories';
import { ACHIEVEMENTS_CHANGED } from '../achievementEvents';
import { ACCOUNT_ACTION_DENIED, type AccountActionDenied } from '../accountCategoryEvents';

export type AccountNotice = {
  id: number;
  ownerId: number | null;
  kind: 'promotion' | 'permission' | 'limit' | 'error';
  title: string;
  description: string;
};

type AccountCategoryContextValue = {
  account: AccountCategoryState | null;
  loading: boolean;
  error: string | null;
  notice: AccountNotice | null;
  refresh: () => Promise<AccountCategoryState | null>;
  hasPermission: (permission: AccountPermission) => boolean;
  requirePermission: (permission: AccountPermission) => boolean;
  requireCreation: () => boolean;
  dismissNotice: () => void;
};

const AccountCategoryContext = createContext<AccountCategoryContextValue | null>(null);

export function AccountCategoryProvider({ children }: { children: ReactNode }) {
  const { session, status } = useAuth();
  const userId = session?.usuarioId ?? null;
  const activeUser = useRef(userId);
  activeUser.current = userId;
  const [snapshot, setSnapshot] = useState<{ userId: number; account: AccountCategoryState } | null>(null);
  const [failure, setFailure] = useState<{ userId: number; message: string } | null>(null);
  const [storedNotice, setNotice] = useState<AccountNotice | null>(null);
  const previous = useRef<{ userId: number; category: AccountCategoryCode } | null>(null);
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const noticeId = useRef(0);
  const account = snapshot?.userId === userId ? snapshot.account : null;
  const notice = storedNotice?.ownerId === userId ? storedNotice : null;
  const error = failure?.userId === userId ? failure.message : null;
  const loading = status === 'loading' || (userId !== null && account === null && error === null);

  const showNotice = useCallback((kind: AccountNotice['kind'], title: string, description: string) => {
    setNotice({ id: ++noticeId.current, ownerId: activeUser.current, kind, title, description });
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const refresh = useCallback(async () => {
    if (userId === null || status !== 'authenticated') return null;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++revision.current;
    try {
      const next = await getAccountCategory(controller.signal);
      if (controller.signal.aborted || current !== revision.current || activeUser.current !== userId) return null;
      const last = previous.current;
      if (last?.userId === userId && isCategoryPromotion(last.category, next.categoria.codigo)) {
        showNotice('promotion', '¡Ahora sos ' + next.categoria.nombre + '!',
          next.categoria.codigo === 'Nostalgico'
            ? 'Tu primer recuerdo abrió una nueva etapa: ya podés comentar, puntuar y repostear. Ese recuerdo cuenta en tu cupo semanal.'
            : next.categoria.codigo === 'Aedo'
              ? 'Un recuerdo llegó a 30 puntos de nostalgia. Tenés 7 recuerdos semanales, música en tus publicaciones y mayor visibilidad.'
              : 'Tu cuenta tiene nuevos beneficios. Consultalos en tu perfil.');
      }
      previous.current = { userId, category: next.categoria.codigo };
      setSnapshot({ userId, account: next });
      setFailure(null);
      return next;
    } catch (reason) {
      if (!controller.signal.aborted && current === revision.current && activeUser.current === userId)
        setFailure({ userId, message: reason instanceof Error ? reason.message : 'No se pudo consultar tu categoría.' });
      return null;
    }
  }, [userId, status, showNotice]);

  useEffect(() => {
    previous.current = null;
    setSnapshot(null);
    setFailure(null);
    setNotice(null);
    void refresh();
    return () => { ++revision.current; request.current?.abort(); };
  }, [refresh]);

  useEffect(() => {
    if (userId === null) return;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { void refresh(); }, 150);
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const denied = (event: Event) => {
      const details = (event as CustomEvent<AccountActionDenied>).detail;
      if (details.userId !== userId) return;
      showNotice(details.status === 429 ? 'limit' : 'error', details.title, details.description);
      changed();
    };
    const poll = setInterval(visible, 60_000);
    window.addEventListener(ACHIEVEMENTS_CHANGED, changed);
    window.addEventListener(ACCOUNT_ACTION_DENIED, denied);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearTimeout(debounce);
      clearInterval(poll);
      window.removeEventListener(ACHIEVEMENTS_CHANGED, changed);
      window.removeEventListener(ACCOUNT_ACTION_DENIED, denied);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [userId, refresh, showNotice]);

  const hasPermission = useCallback((permission: AccountPermission) => hasAccountPermission(account, permission), [account]);
  const requirePermission = useCallback((permission: AccountPermission) => {
    if (hasAccountPermission(account, permission)) return true;
    showNotice('permission', userId === null ? 'Iniciá sesión para continuar' : account ? 'Disponible desde otra categoría' : 'Consultá tu categoría',
      userId === null ? 'Iniciá sesión para usar las funciones de tu cuenta.' : account ? permissionDescription(permission) : error || 'Esperá a que termine de cargar tu cuenta.');
    return false;
  }, [account, error, showNotice, userId]);
  const requireCreation = useCallback(() => {
    if (userId === null) {
      showNotice('permission', 'Iniciá sesión para publicar', 'Tu cuenta guarda tus recuerdos, tu categoría y tu cupo semanal.');
      return false;
    }
    const restriction = creationRestriction(account);
    if (!restriction) return true;
    showNotice(account?.publicacionesRestantes === 0 ? 'limit' : 'permission',
      account?.publicacionesRestantes === 0 ? 'Cupo semanal alcanzado' : 'No pudimos habilitar la publicación',
      error || restriction);
    return false;
  }, [account, error, showNotice, userId]);

  const value = useMemo(() => ({
    account, loading, error, notice, refresh, hasPermission, requirePermission, requireCreation, dismissNotice,
  }), [account, loading, error, notice, refresh, hasPermission, requirePermission, requireCreation, dismissNotice]);
  return <AccountCategoryContext.Provider value={value}>{children}</AccountCategoryContext.Provider>;
}

export function useAccountCategory() {
  const context = useContext(AccountCategoryContext);
  if (!context) throw new Error('useAccountCategory debe usarse dentro de AccountCategoryProvider.');
  return context;
}
