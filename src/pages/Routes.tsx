import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { routes as staticRoutes } from "../data/routes";
import { getAllCustomRoutes, getChosenRouteId, setChosenRouteId } from "../utils/storage";
import type { Route } from "../types";

export default function RoutesPage() {
  const [filter, setFilter] = useState<"all" | "urbana" | "natural">("all");
  const [custom, setCustom] = useState<Route[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);

  useEffect(() => {
    getAllCustomRoutes().then(setCustom);
    getChosenRouteId().then(setChosenId);
  }, []);

  const allRoutes = [...staticRoutes, ...custom];
  const filtered = allRoutes.filter((r) => filter === "all" || r.category === filter);

  async function choose(id: string) {
    await setChosenRouteId(id);
    setChosenId(id);
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Catálogo de rutas</h2>
        <div className="row">
          <button className="btn btn-secondary" onClick={() => setFilter("all")}>Todas</button>
          <button className="btn btn-secondary" onClick={() => setFilter("urbana")}>Urbanas</button>
          <button className="btn btn-secondary" onClick={() => setFilter("natural")}>Naturales</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <Link to="/crear"><button className="btn btn-primary">+ Crear nueva ruta</button></Link>
        </div>
      </div>
      {filtered.map((r: Route) => (
        <div key={r.id} className="card route-item" style={{ position: "relative" }}>
          <Link to={`/rutas/${r.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0 }}>{r.name} {r.isCustom && <span className="badge">Creada por ti</span>} {chosenId === r.id && <span className="badge" style={{ background: "#2e7d5b", color: "#fff" }}>Elegida</span>}</h3>
            <div className="route-meta">
              {r.category === "urbana" ? "Urbana" : "Natural"} · {r.difficulty} · {r.distanceVerified ? `${r.distanceKm?.toFixed(2)} km` : "Distancia pendiente de verificar"} · {r.estimatedDurationMin} min
            </div>
            <p style={{ fontSize: "0.85rem", margin: "6px 0 0", color: "#374151" }}>{r.description}</p>
            {!r.distanceVerified && <div className="pending">⚠ Distancia pendiente de verificar</div>}
            {!r.elevationVerified && <div className="pending">⚠ Desnivel pendiente de verificar</div>}
          </Link>
          <div style={{ marginTop: 8 }}>
            <button
              className={"btn " + (chosenId === r.id ? "btn-secondary" : "btn-primary")}
              onClick={() => choose(r.id)}
              disabled={chosenId === r.id}
            >
              {chosenId === r.id ? "Ruta elegida ✓" : "Elegir esta ruta"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}