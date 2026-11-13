import { API_BASE_URL } from "./apiConfig";
import { apiFetch } from "./components/auth/apiClient";
import { buildPublicationFormData } from "./publicationFormData";
import { toMemory, type Publication } from "./publicationsApi";
import type { CommunityGroup, Decade, Memory } from "./types";

type ApiGroup = {
  id: number;
  nombre: string;
  descripcion: string;
  decada: number;
  esIntegrante: boolean;
  esCreador: boolean;
  fechaCreacion?: string;
  cantidadIntegrantes?: number;
  creador?: { id: number; username: string };
};

export type CreateGroupInput = Pick<CommunityGroup, "name" | "description" | "decade">;
export type UpdateGroupInput = CreateGroupInput;
export type GroupMember = {
  id: number;
  username: string;
  joinedAt: string;
  isCreator: boolean;
};

type ApiGroupMember = {
  usuario: { id: number; username: string };
  fechaUnion: string;
  esCreador: boolean;
};

const supportedDecades = new Set<Decade>([1970, 1980, 1990, 2000, 2010, 2020]);

function mapGroup(group: ApiGroup): CommunityGroup {
  if (!supportedDecades.has(group.decada as Decade)) {
    throw new Error(`La década ${group.decada} todavía no está disponible en el frontend.`);
  }

  return {
    id: String(group.id),
    name: group.nombre,
    description: group.descripcion,
    decade: group.decada as Decade,
    isMember: group.esIntegrante,
    isCreator: group.esCreador,
    createdAt: group.fechaCreacion,
    memberCount: group.cantidadIntegrantes,
    creator: group.creador,
  };
}

function requireGroupId(groupId: string) {
  if (!/^[1-9]\d*$/.test(groupId)) {
    throw new Error("El grupo no tiene un identificador válido.");
  }
}

async function groupRequest<T>(path = "", options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const response = await apiFetch(`${API_BASE_URL}/api/grupos${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(" ") : "";
    throw new Error(
      fields ||
        problem?.detail ||
        problem?.mensaje ||
        problem?.title ||
        `No se pudo completar la operación (${response.status}).`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function getGroups(signal?: AbortSignal): Promise<CommunityGroup[]> {
  const groups = await groupRequest<ApiGroup[]>("", { signal });
  return groups.map(mapGroup);
}

export async function createGroup(input: CreateGroupInput): Promise<CommunityGroup> {
  const group = await groupRequest<ApiGroup>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: input.name,
      descripcion: input.description,
      decada: input.decade,
    }),
  });

  return mapGroup(group);
}

export async function getGroup(groupId: string, signal?: AbortSignal): Promise<CommunityGroup> {
  requireGroupId(groupId);
  return mapGroup(await groupRequest<ApiGroup>(`/${groupId}`, { signal }));
}

export async function getGroupMembers(
  groupId: string,
  signal?: AbortSignal,
): Promise<GroupMember[]> {
  requireGroupId(groupId);
  const members = await groupRequest<ApiGroupMember[]>(`/${groupId}/integrantes`, { signal });
  return members.map((member) => ({
    id: member.usuario.id,
    username: member.usuario.username,
    joinedAt: member.fechaUnion,
    isCreator: member.esCreador,
  }));
}

export async function updateGroup(
  groupId: string,
  input: UpdateGroupInput,
): Promise<CommunityGroup> {
  requireGroupId(groupId);
  const group = await groupRequest<ApiGroup>(`/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: input.name,
      descripcion: input.description,
      decada: input.decade,
    }),
  });
  return mapGroup(group);
}

export async function deleteGroup(groupId: string): Promise<void> {
  requireGroupId(groupId);
  await groupRequest<void>(`/${groupId}`, { method: "DELETE" });
}

export async function leaveGroup(groupId: string): Promise<void> {
  requireGroupId(groupId);
  await groupRequest<void>(`/${groupId}/salir`, { method: "DELETE" });
}

export async function joinGroup(groupId: string): Promise<void> {
  requireGroupId(groupId);
  await groupRequest<void>(`/${groupId}/unirse`, { method: "POST" });
}

export async function createGroupMemory(groupId: string, memory: Memory): Promise<{ id: number }> {
  requireGroupId(groupId);

  return groupRequest<{ id: number }>(`/${groupId}/recuerdos`, {
    method: "POST",
    body: buildPublicationFormData(memory),
  });
}

export async function getGroupMemories(groupId: string, signal?: AbortSignal): Promise<Memory[]> {
  requireGroupId(groupId);

  const publications = await groupRequest<Publication[]>(`/${groupId}/recuerdos`, { signal });
  return publications.map((publication) =>
    toMemory(publication, {
      id: String(publication.id),
      title: publication.titulo,
      description: "",
      year: new Date(publication.fecha).getUTCFullYear(),
      category: "Personales",
      author: "",
      place: publication.lugar?.nombre ?? "",
      lat: publication.lugar?.latitud ?? 0,
      lng: publication.lugar?.longitud ?? 0,
      source: "backend",
      groupId,
    }),
  );
}
