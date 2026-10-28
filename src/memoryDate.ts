export function memoryDateIso(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const instant = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(instant.getTime())) return null;
  const iso = instant.toISOString();
  return iso.slice(0, 10) === date ? iso : null;
}

export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
