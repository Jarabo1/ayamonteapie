import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { routes as staticRoutes } from "../data/routes";
import { getAllCustomRoutes } from "../utils/storage";
import type { Route } from "../types";

export default function RoutesPage() {
  const [filter, setFilter] = useState<"all" | "urbana" | "natural">("all");
  const [custom, setCustom] = useState<Route[]>([]);

  useEffect(() => { getAllCustomRoutes().then(setCustom); }, []);

  const allRoutes = [...staticRoutes, ...custom];
  const filtered = allRoutes.filter((r) => filter === "all" || r.category === filter);

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
        <Link to={`/rutas/${r.id}`} key={r.id} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card route-item">
            <h3>{r.name} {r.isCustom && <span className="badge">Creada por ti</span>}</h3>
            <div className="route-meta">
              {r.category === "urbana" ? "Urbana" : "Natural"} · {r.difficulty} · {r.distanceVerified ? `${r.distanceKm?.toFixed(2)} km` : "Distancia pendiente de verificar"} · {r.estimatedDurationMin} min
            </div>
            <p style={{ fontSize: "0.85rem", margin: "6px 0 0", color: "#374151" }}>{r.description}</p>
            {!r.distanceVerified && <div className="pending">⚠ Distancia pendiente de verificar</div>}
            {!r.elevationVerified && <div className="pending">⚠ Desnivel pendiente de verificar</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}