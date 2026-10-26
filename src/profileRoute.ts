/** Normalize the route boundary before the API encodes its own URL segment. */
export function decodeProfileUsername(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
