export const ACCOUNT_ACTION_DENIED = 'nostalgiar:account-action-denied';
export type AccountActionDenied = { userId: number | null; status: number; title: string; description: string };

export async function notifyAccountActionDenied(response: Response, userId: number | null) {
  if (typeof window === 'undefined' || (response.status !== 403 && response.status !== 429)) return;
  const problem = await response.clone().json().catch(() => null);
  window.dispatchEvent(new CustomEvent<AccountActionDenied>(ACCOUNT_ACTION_DENIED, { detail: {
    userId,
    status: response.status,
    title: problem?.title || (response.status === 429 ? 'Límite alcanzado' : 'Acción no disponible'),
    description: problem?.detail || 'Actualizá la información de tu cuenta y volvé a intentar.',
  } }));
}
