export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function pathDistanceM(points: [number, number][]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineM(points[i - 1], points[i]);
  return d;
}

export function formatDistance(m: number): string {
  if (m >= 1000) return (m / 1000).toFixed(2) + " km";
  return Math.round(m) + " m";
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatSpeed(kmh: number): string {
  return kmh.toFixed(1) + " km/h";
}

export function estimateCalories(durationSec: number, weightKg: number): number {
  // MET ~3.5 for walking; kcal = MET * weight * hours
  const hours = durationSec / 3600;
  return Math.round(3.5 * weightKg * hours);
}

const FOOT_ROUTER_BASE = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

export interface FootRouteResult {
  geometry: [number, number][];
  distanceM: number;
  durationSec: number;
  streets: string[];
}

/** Calcula un recorrido peatonal entre los puntos indicados usando el perfil foot de OSM. */
export async function fetchFootRoute(waypoints: [number, number][]): Promise<FootRouteResult> {
  const coords = waypoints.map((p) => `${p[1]},${p[0]}`).join(";");
  const res = await fetch(`${FOOT_ROUTER_BASE}/${coords}?overview=full&geometries=geojson&steps=true`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) throw new Error(json.code || "No route");
  const r = json.routes[0];
  const geometry = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
  const streets: string[] = [];
  for (const leg of r.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const name = (step.name || "").trim();
      if (name && (streets.length === 0 || streets[streets.length - 1] !== name)) {
        streets.push(name);
      }
    }
  }
  return {
    geometry,
    distanceM: r.distance,
    durationSec: r.duration,
    streets,
  };
}