export const categoryCodes = ['Errante', 'Nostalgico', 'Aedo', 'Mnemosine', 'Marca'] as const;
export type AccountCategoryCode = typeof categoryCodes[number];
export type AccountPermission =
  | 'DarLike' | 'GuardarPublicacion' | 'SerEtiquetado' | 'SeguirPerfil'
  | 'CrearRecuerdo' | 'Comentar' | 'Compartir' | 'EtiquetarUsuario'
  | 'PuntuarPublicacion' | 'VotarCancion' | 'AgregarMusicaAPublicacion'
  | 'SugerirMusica' | 'AdjuntarVariasFotos' | 'UsarPinEspecial'
  | 'PublicitarPublicacion' | 'VerificacionDeMarca' | 'UsarPerfilFijo';

export type AccountCategory = {
  codigo: AccountCategoryCode;
  nombre: string;
  publicacionesSemanales: number | null;
  publicacionesIlimitadas: boolean;
  permitePrimerRecuerdo: boolean;
  prioridadVisibilidad: string;
  permisos: string[];
};

export type AccountCategoryState = {
  categoria: AccountCategory;
  publicacionesConsumidas: number;
  publicacionesRestantes: number | null;
  semanaInicio: string;
  reinicioSemana: string;
  maximoAdjuntos: number;
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function dateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseAccountCategoryState(value: unknown): AccountCategoryState {
  if (!record(value) || !record(value.categoria))
    throw new Error('El servidor no devolvió el estado de tu categoría.');
  const category = value.categoria;
  if (!categoryCodes.includes(category.codigo as AccountCategoryCode)
    || typeof category.nombre !== 'string' || !category.nombre.trim()
    || !(category.publicacionesSemanales === null || nonnegative(category.publicacionesSemanales))
    || typeof category.publicacionesIlimitadas !== 'boolean'
    || typeof category.permitePrimerRecuerdo !== 'boolean'
    || typeof category.prioridadVisibilidad !== 'string'
    || !Array.isArray(category.permisos) || !category.permisos.every(permission => typeof permission === 'string')
    || !nonnegative(value.publicacionesConsumidas)
    || !(value.publicacionesRestantes === null || nonnegative(value.publicacionesRestantes))
    || !dateOnly(value.semanaInicio) || !dateOnly(value.reinicioSemana)
    || !nonnegative(value.maximoAdjuntos) || value.maximoAdjuntos < 1 || value.maximoAdjuntos > 4)
    throw new Error('No pudimos interpretar los permisos de tu cuenta. Volvé a consultar tu categoría.');
  return value as AccountCategoryState;
}

export function hasAccountPermission(state: AccountCategoryState | null, permission: AccountPermission): boolean {
  return state?.categoria.permisos.includes(permission) ?? false;
}

export function canCreateMemory(state: AccountCategoryState | null): boolean {
  return Boolean(state && (state.categoria.permitePrimerRecuerdo || hasAccountPermission(state, 'CrearRecuerdo'))
    && state.publicacionesRestantes !== 0);
}

export function formatWeekReset(date: string): string {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(date + 'T12:00:00Z'));
}

export function quotaDescription(state: AccountCategoryState): string {
  if (state.publicacionesRestantes === null) return 'Publicaciones ilimitadas';
  const remaining = state.publicacionesRestantes;
  return remaining === 1 ? 'Te queda 1 recuerdo esta semana'
    : 'Te quedan ' + remaining + ' recuerdos esta semana';
}

export function isCategoryPromotion(previous: AccountCategoryCode, next: AccountCategoryCode): boolean {
  return categoryCodes.indexOf(next) > categoryCodes.indexOf(previous);
}

export function permissionDescription(permission: AccountPermission): string {
  if (permission === 'AgregarMusicaAPublicacion')
    return 'La música en tus publicaciones se habilita desde Aedo. Llegás cuando un recuerdo recibe 30 puntos de nostalgia.';
  if (permission === 'AdjuntarVariasFotos')
    return 'Los adjuntos múltiples están disponibles para Mnemosine y cuentas Marca.';
  return 'Publicá tu primer recuerdo para pasar de Errante a Nostálgico y habilitar comentarios, puntuaciones y reposts.';
}

export function creationRestriction(state: AccountCategoryState | null): string | null {
  if (!state) return 'Estamos consultando la categoría y el cupo de tu cuenta.';
  if (state.publicacionesRestantes === 0)
    return 'Alcanzaste tu cupo semanal. Se renueva el ' + formatWeekReset(state.reinicioSemana) + ' a las 00:00 (Argentina).';
  if (!state.categoria.permitePrimerRecuerdo && !hasAccountPermission(state, 'CrearRecuerdo'))
    return 'Tu categoría no permite crear recuerdos.';
  return null;
}
