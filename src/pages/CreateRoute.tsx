import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import { useUserLocation } from "../hooks/useUserLocation";
import { saveCustomRoute } from "../utils/storage";
import { haversineM } from "../utils/geo";
import type { Route, LatLng, Difficulty } from "../types";

function offsetKm(origin: LatLng, km: number, angleRad: number): LatLng {
  const R = 6371;
  const d = km / R;
  const lat1 = (origin[0] * Math.PI) / 180;
  const lng1 = (origin[1] * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(angleRad));
  const lng2 = lng1 + Math.atan2(Math.sin(angleRad) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

export default function CreateRoute() {
  const navigate = useNavigate();
  const { pos } = useUserLocation();
  const center = pos || [37.2169243, -7.3973623] as LatLng;

  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Fácil");
  const [terrain, setTerrain] = useState("Urbano, asfalto");
  const [duration, setDuration] = useState(60);
  const [targetKm, setTargetKm] = useState(5);
  const [useTime, setUseTime] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [geometry, setGeometry] = useState<LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [streets, setStreets] = useState<string[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  function addPoint(p: LatLng) {
    setPoints((prev) => [...prev, p]);
    setGeometry([]);
    setDistanceKm(null);
  }

  function undo() {
    setPoints((prev) => prev.slice(0, -1));
    setGeometry([]);
    setDistanceKm(null);
    setStreets([]);
  }

  function clear() {
    setPoints([]);
    setGeometry([]);
    setDistanceKm(null);
    setStreets([]);
  }

  async function generateAuto() {
    const origin = pos || center;
    const speedKmh = difficulty === "Fácil" ? 4.5 : difficulty === "Moderada" ? 5.5 : 6.5;
    const km = useTime ? (targetKm > 0 ? targetKm : (duration / 60) * speedKmh) : targetKm;
    const target = Math.max(2, Math.min(9.5, km));
    setGenerating(true);
    setError("");
    let best: { points: LatLng[]; geometry: LatLng[]; distance: number; streets: string[] } | null = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const radius = (target / (2 * Math.PI)) * (0.45 + Math.random() * 0.35);
      const n = 4 + Math.floor(Math.random() * 3);
      const wps: LatLng[] = [origin];
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * 2 * Math.PI + (Math.random() - 0.5) * 0.6;
        const d = Math.max(0.5, radius + (Math.random() - 0.5) * 1.0);
        wps.push(offsetKm(origin, d, angle));
      }
      wps.push(origin);
      try {
        const coords = wps.map((p) => `${p[1]},${p[0]}`).join(";");
        const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`);
        const json = await res.json();
        if (json.code !== "Ok") continue;
        const r = json.routes[0];
        const geom = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLng);
        const dist = r.distance / 1000;
        const sts: string[] = [];
        for (const leg of r.legs) for (const step of leg.steps) {
          const n = (step.name || "").trim();
          if (n && (sts.length === 0 || sts[sts.length - 1] !== n)) sts.push(n);
        }
        if (!best || Math.abs(dist - target) < Math.abs(best.distance - target)) {
          best = { points: wps, geometry: geom, distance: dist, streets: sts };
        }
        if (Math.abs(dist - target) < target * 0.15) break;
      } catch {
        // try next
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    setGenerating(false);
    if (!best) {
      // fallback: straight line polygon
      const radius = target / (2 * Math.PI);
      const wps: LatLng[] = [origin];
      for (let i = 0; i < 5; i++) {
        wps.push(offsetKm(origin, radius, (i / 5) * 2 * Math.PI));
      }
      wps.push(origin);
      let d = 0;
      for (let i = 1; i < wps.length; i++) d += haversineM(wps[i - 1], wps[i]);
      best = { points: wps, geometry: wps, distance: d / 1000, streets: [] };
      setError("No se pudo generar por calles; ruta aproximada en línea recta.");
    }
    setPoints(best.points);
    setGeometry(best.geometry);
    setDistanceKm(best.distance);
    setStreets(best.streets);
    setName(`Ruta generada ${best.distance.toFixed(1)} km`);
    setDescription(`Ruta generada automáticamente (${difficulty}).`);
  }

  async function calculate() {
    if (points.length < 2) { setError("Añade al menos 2 puntos."); return; }
    setCalculating(true);
    setError("");
    try {
      const wps = points[0][0] === points[points.length-1][0] && points[0][1] === points[points.length-1][1]
        ? points : [...points, points[0]];
      const coords = wps.map((p) => `${p[1]},${p[0]}`).join(";");
      const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`);
      const json = await res.json();
      if (json.code !== "Ok") throw new Error(json.code);
      const r = json.routes[0];
      const geom = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLng);
      setGeometry(geom);
      setDistanceKm(r.distance / 1000);
      const sts: string[] = [];
      for (const leg of r.legs) for (const step of leg.steps) {
        const n = (step.name || "").trim();
        if (n && (sts.length === 0 || sts[sts.length - 1] !== n)) sts.push(n);
      }
      setStreets(sts);
    } catch {
      // fallback haversine
      const wps = points[0][0] === points[points.length-1][0] && points[0][1] === points[points.length-1][1]
        ? points : [...points, points[0]];
      let d = 0;
      for (let i = 1; i < wps.length; i++) d += haversineM(wps[i - 1], wps[i]);
      setGeometry(wps);
      setDistanceKm(d / 1000);
      setStreets([]);
      setError("No se pudo calcular la ruta por calles; se usa distancia en línea recta (pendiente de verificar).");
    } finally {
      setCalculating(false);
    }
  }

  async function save() {
    if (!name.trim()) { setError("Indica un nombre para la ruta."); return; }
    if (points.length < 2) { setError("Añade al menos 2 puntos."); return; }
    const route: Route = {
      id: "custom-" + crypto.randomUUID(),
      name: name.trim(),
      category: "urbana",
      description: description.trim() || "Ruta creada por el usuario.",
      difficulty,
      terrain,
      estimatedDurationMin: duration,
      elevationVerified: false,
      distanceKm: distanceKm ?? undefined,
      distanceVerified: distanceKm !== null,
      startPoint: points[0],
      waypoints: points,
      geometry: (() => {
        const g = geometry.length ? geometry : (points.length ? [...points] : []);
        if (g.length >= 2 && (g[0][0] !== g[g.length-1][0] || g[0][1] !== g[g.length-1][1])) {
          return [...g, g[0]];
        }
        return g;
      })(),
      indications: streets.length ? streets : (points.length > 1 ? points.map((_, i) => `Punto ${i + 1}`) : []),
      photos: [],
      verified: false,
      isCustom: true,
    };
    await saveCustomRoute(route);
    navigate("/rutas");
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Crear ruta</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className={"btn " + (mode === "manual" ? "btn-primary" : "btn-secondary")} onClick={() => setMode("manual")}>Manual</button>
          <button className={"btn " + (mode === "auto" ? "btn-primary" : "btn-secondary")} onClick={() => setMode("auto")}>Automática</button>
        </div>
        {mode === "manual" && <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Toca el mapa para añadir puntos. Calcula la ruta real y guárdala.</p>}
        {mode === "auto" && (
          <div>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Indica la distancia o el tiempo y la dificultad. La app genera la ruta por calles reales desde tu ubicación.</p>
            <div className="row">
              <button className={"btn " + (!useTime ? "btn-primary" : "btn-secondary")} onClick={() => setUseTime(false)}>Por distancia</button>
              <button className={"btn " + (useTime ? "btn-primary" : "btn-secondary")} onClick={() => setUseTime(true)}>Por tiempo</button>
            </div>
            {!useTime && (
              <div style={{ marginTop: 8 }}>
                <label>Distancia (km)</label>
                <input type="number" step="0.5" min="2" max="9" value={targetKm} onChange={(e) => setTargetKm(Number(e.target.value))} />
              </div>
            )}
            {useTime && (
              <div style={{ marginTop: 8 }}>
                <label>Tiempo (min)</label>
                <input type="number" min="20" max="120" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <label>Dificultad</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                <option>Fácil</option>
                <option>Moderada</option>
                <option>Difícil</option>
              </select>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={generateAuto} disabled={generating}>
                {generating ? "Generando..." : "Generar ruta automáticamente"}
              </button>
            </div>
          </div>
        )}
        <label>Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi ruta" />
        <label style={{ marginTop: 8 }}>Descripción</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" />
        <div className="row" style={{ marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Dificultad</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option>Fácil</option>
              <option>Moderada</option>
              <option>Difícil</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Duración (min)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
        </div>
        <label style={{ marginTop: 8 }}>Terreno</label>
        <input value={terrain} onChange={(e) => setTerrain(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={undo} disabled={points.length === 0}>Deshacer</button>
          <button className="btn btn-secondary" onClick={clear} disabled={points.length === 0}>Limpiar</button>
        </div>
        {mode === "manual" && (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={calculate} disabled={points.length < 2 || calculating}>
              {calculating ? "Calculando..." : "Calcular ruta real"}
            </button>
          </div>
        )}
        {distanceKm !== null && (
          <p style={{ marginTop: 8, fontWeight: 600 }}>Distancia: {distanceKm.toFixed(2)} km · {points.length} puntos</p>
        )}
        {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>}
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save}>Guardar ruta</button>
        </div>
      </div>
      <MapView center={center} onMapClick={addPoint} waypoints={points} routeGeometry={geometry.length ? geometry : undefined} height="60vh" />
    </div>
  );
}