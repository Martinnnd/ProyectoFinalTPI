import { API_BASE_URL } from './apiConfig';
import { apiFetch } from './components/auth/apiClient';
import { buildPublicationFormData } from './publicationFormData';
import { toMemory, type Publication } from './publicationsApi';
import type { CommunityGroup, Decade, Memory } from './types';

type ApiGroup = {
  id: number;
  nombre: string;
  descripcion: string;
  decada: number;
};

export type CreateGroupInput = Omit<CommunityGroup, 'id'>;

const supportedDecades = new Set<Decade>([1970, 1980, 1990, 2000]);

function mapGroup(group: ApiGroup): CommunityGroup {
  if (!supportedDecades.has(group.decada as Decade)) {
    throw new Error(`La década ${group.decada} todavía no está disponible en el frontend.`);
  }

  return {
    id: String(group.id),
    name: group.nombre,
    description: group.descripcion,
    decade: group.decada as Decade,
  };
}

async function groupRequest<T>(path = '', options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const response = await apiFetch(`${API_BASE_URL}/api/grupos${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors
      ? Object.values(problem.errors).flat().join(' ')
      : '';
    throw new Error(
      fields ||
      problem?.detail ||
      problem?.mensaje ||
      problem?.title ||
      `No se pudo completar la operación (${response.status}).`,
    );
  }

  return response.json();
}

export async function getGroups(signal?: AbortSignal): Promise<CommunityGroup[]> {
  const groups = await groupRequest<ApiGroup[]>('', { signal });
  return groups.map(mapGroup);
}

export async function createGroup(input: CreateGroupInput): Promise<CommunityGroup> {
  const group = await groupRequest<ApiGroup>('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: input.name,
      descripcion: input.description,
      decada: input.decade,
    }),
  });

  return mapGroup(group);
}

export async function createGroupMemory(
  groupId: string,
  memory: Memory,
): Promise<{ id: number }> {
  if (!/^[1-9]\d*$/.test(groupId)) {
    throw new Error('El grupo no tiene un identificador válido.');
  }

  return groupRequest<{ id: number }>(`/${groupId}/recuerdos`, {
    method: 'POST',
    body: buildPublicationFormData(memory),
  });
}

export async function getGroupMemories(
  groupId: string,
  signal?: AbortSignal,
): Promise<Memory[]> {
  if (!/^[1-9]\d*$/.test(groupId)) {
    throw new Error('El grupo no tiene un identificador vÃ¡lido.');
  }

  const publications = await groupRequest<Publication[]>(`/${groupId}/recuerdos`, { signal });
  return publications.map((publication) => toMemory(publication, {
    id: String(publication.id),
    title: publication.titulo,
    description: '',
    year: new Date(publication.fecha).getUTCFullYear(),
    category: 'Personales',
    author: '',
    place: publication.lugar?.nombre ?? '',
    lat: publication.lugar?.latitud ?? 0,
    lng: publication.lugar?.longitud ?? 0,
    source: 'backend',
    groupId,
  }));
}
