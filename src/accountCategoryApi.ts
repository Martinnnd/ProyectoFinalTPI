import { API_BASE_URL } from './apiConfig';
import { apiFetch } from './components/auth/apiClient';
import { parseAccountCategoryState } from './accountCategories';

export async function getAccountCategory(signal?: AbortSignal) {
  const response = await apiFetch(API_BASE_URL + '/api/categorias-cuenta/me', { signal, cache: 'no-store' });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail || problem?.title || 'No se pudo consultar tu categoría. Intentá nuevamente.');
  }
  return parseAccountCategoryState(await response.json());
}
