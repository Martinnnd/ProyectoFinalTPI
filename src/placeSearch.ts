import type { Point } from "./components/MemoryMap";
export type PlaceResult = Point & { id: string; label: string };

// The caller debounces suggestions and cancels superseded requests.
export async function findPlaces(query: string, signal: AbortSignal): Promise<PlaceResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({ q: query, limit: "5", lat: "-34.6", lon: "-58.4", zoom: "5" }).toString();
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
  if (!response.ok) throw new Error("Place search unavailable");
  const data = await response.json();
  if (!Array.isArray(data.features)) throw new Error("Invalid place response");
  return data.features.flatMap((feature: { geometry?: { coordinates?: unknown[] }; properties?: Record<string, unknown> }, index: number) => {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    const p = feature.properties ?? {};
    const text = (key: string) => typeof p[key] === "string" ? p[key] as string : "";
    const street = [text("street"), text("housenumber")].filter(Boolean).join(" ");
    const label = [...new Set([text("name"), street, text("city") || text("district"), text("state"), text("country")].filter(Boolean))].join(", ");
    return label ? [{ id: `${p.osm_type}-${p.osm_id}-${index}`, lat, lng, label }] : [];
  });
}
