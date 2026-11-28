import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstallPrompt from "../components/InstallPrompt";
import MapView from "../components/MapView";
import { getAllWalks, getAllCustomRoutes, getChosenRouteId, setChosenRouteId, getKV } from "../utils/storage";
import { routes as staticRoutes } from "../data/routes";
import { formatDistance, formatDuration } from "../utils/geo";
import type { Walk, Route, LatLng } from "../types";

export default function Home() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>(staticRoutes);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [goalKm, setGoalKm] = useState<number>(10);
  const [weeklyKm, setWeeklyKm] = useState<number>(0);

  useEffect(() => {
    getAllWalks().then((ws) => {
      setWalks(ws);
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const km = ws.filter((w) => w.startedAt >= start.getTime()).reduce((s, w) => s + w.distanceM, 0) / 1000;
      setWeeklyKm(km);
    });
    getAllCustomRoutes().then((c) => setAllRoutes([...staticRoutes, ...c]));
    getChosenRouteId().then(setChosenId);
    getKV<number>("goalKm").then((g) => { if (g) setGoalKm(g); });
  }, []);

  const chosenRoute = allRoutes.find((r) => r.id === chosenId) || null;

  async function choose(id: string) {
    const val = id || null;
    await setChosenRouteId(val);
    setChosenId(val);
  }

  const totalKm = walks.reduce((s, w) => s + w.distanceM, 0) / 1000;
  const totalSec = walks.reduce((s, w) => s + w.durationSec, 0);

  const center: LatLng = chosenRoute
    ? (chosenRoute.geometry && chosenRoute.geometry.length ? chosenRoute.geometry[0] : chosenRoute.startPoint)
    : [37.2169243, -7.3973623];

  return (
    <div>
      <InstallPrompt />
      <div className="card" style={{ textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Bienvenido a AYAMONTE A PIE</h2>
        <p style={{ color: "#6b7280" }}>Descubre y recorre Ayamonte caminando.</p>
        <Link to="/caminar"><button className="btn btn-primary track-btn">🚶 INICIAR CAMINATA</button></Link>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ruta elegida</h3>
        <label>Ruta a mostrar en inicio</label>
        <select value={chosenId ?? ""} onChange={(e) => choose(e.target.value)}>
          <option value="">— Ninguna —</option>
          {allRoutes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.isCustom ? " (creada)" : ""}</option>
          ))}
        </select>
        {chosenRoute ? (
          <div style={{ marginTop: 10 }}>
            <h4 style={{ margin: "4px 0" }}>{chosenRoute.name} {chosenRoute.isCustom && <span className="badge">Creada por ti</span>}</h4>
            <div className="route-meta">
              {chosenRoute.category === "urbana" ? "Urbana" : "Natural"} · {chosenRoute.difficulty} · {chosenRoute.distanceVerified ? `${chosenRoute.distanceKm?.toFixed(2)} km` : "Distancia pendiente de verificar"} · {chosenRoute.estimatedDurationMin} min
            </div>
            <p style={{ fontSize: "0.85rem", margin: "6px 0", color: "#374151" }}>{chosenRoute.description}</p>
            <div style={{ marginTop: 8 }}>
              <MapView center={center} routeGeometry={chosenRoute.geometry} startPoint={chosenRoute.startPoint} waypoints={chosenRoute.isCustom ? chosenRoute.waypoints : undefined} height="30vh" fitBounds />
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <Link to={`/rutas/${chosenRoute.id}`}><button className="btn btn-secondary">Ver detalle</button></Link>
              <Link to="/caminar"><button className="btn btn-primary">Iniciar caminata</button></Link>
            </div>
          </div>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 8 }}>No hay ruta elegida. Selecciona una en el desplegable o en la pantalla de Rutas.</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Objetivo semanal</h3>
        <div style={{ background: "#e5e7eb", borderRadius: 999, height: 12, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (weeklyKm / (goalKm || 1)) * 100)}%`, background: "var(--primary)", height: "100%" }} />
        </div>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 6 }}>{weeklyKm.toFixed(1)} / {goalKm} km esta semana</p>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="val">{walks.length}</div><div className="lbl">Caminatas</div></div>
        <div className="stat"><div className="val">{totalKm.toFixed(1)}</div><div className="lbl">km totales</div></div>
        <div className="stat"><div className="val">{formatDuration(totalSec)}</div><div className="lbl">Tiempo total</div></div>
        <div className="stat"><div className="val">{walks.length ? (totalKm / walks.length).toFixed(1) : "0"}</div><div className="lbl">km media</div></div>
      </div>
      <div className="card">
        <h3>Últimas caminatas</h3>
        {walks.length === 0 && <p style={{ color: "#6b7280" }}>Aún no hay caminatas guardadas.</p>}
        {walks.slice(0, 5).map((w) => (
          <div key={w.id} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <strong>{formatDistance(w.distanceM)}</strong> · {formatDuration(w.durationSec)} · {new Date(w.startedAt).toLocaleDateString("es-ES")}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Punto de salida</h3>
        <p>Confluencia de calle Estadio con calle Sor Eloisa, Ayamonte (Huelva).</p>
        <Link to="/mapa"><button className="btn btn-secondary">Ver en el mapa</button></Link>
      </div>
    </div>
  );
}