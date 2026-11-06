import { API_BASE_URL } from "./apiConfig";
import { apiFetch } from "./components/auth/apiClient";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(" ") : "";
    throw new Error(
      fields || problem?.detail || problem?.title || `Error del servidor (${response.status}).`,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
