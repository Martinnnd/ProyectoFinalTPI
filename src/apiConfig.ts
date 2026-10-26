// API_URL es el nombre de develop; API_BASE_URL mantiene la configuración de logros.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim()
  || process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  || "http://localhost:5199"
).replace(/\/+$/, "");
