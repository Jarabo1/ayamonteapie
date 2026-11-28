import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { routes as staticRoutes } from "../data/routes";
import { getAllCustomRoutes, getChosenRouteId, setChosenRouteId, getFavorites, toggleFavorite, deleteCustomRoute } from "../utils/storage";
import type { Route } from "../types";

export default function RoutesPage() {
  const [filter, setFilter] = useState<"all" | "urbana" | "natural">("all");
  const [diffFilter, setDiffFilter] = useState<"all" | "Fácil" | "Moderada" | "Difícil">("all");
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [custom, setCustom] = useState<Route[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    getAllCustomRoutes().then(setCustom);
    getChosenRouteId().then(setChosenId);
    getFavorites().then(setFavorites);
  }, []);

  const allRoutes = [...staticRoutes, ...custom];
  const filtered = allRoutes.filter((r) => {
    if (filter !== "all" && r.category !== filter) return false;
    if (diffFilter !== "all" && r.difficulty !== diffFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (favOnly && !favorites.includes(r.id)) return false;
    return true;
  });

  async function choose(id: string) {
    await setChosenRouteId(id);
    setChosenId(id);
  }

  async function handleDeleteRoute(id: string) {
    if (!confirm("¿Eliminar esta ruta creada?")) return;
    await deleteCustomRoute(id);
    setCustom((prev) => prev.filter((r) => r.id !== id));
    if (chosenId === id) {
      await setChosenRouteId(null);
      setChosenId(null);
    }
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Catálogo de rutas</h2>
        <input placeholder="Buscar ruta..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
        <div className="row">
          <button className="btn btn-secondary" onClick={() => setFilter("all")}>Todas</button>
          <button className="btn btn-secondary" onClick={() => setFilter("urbana")}>Urbanas</button>
          <button className="btn btn-secondary" onClick={() => setFilter("natural")}>Naturales</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className={"btn " + (favOnly ? "btn-primary" : "btn-secondary")} onClick={() => setFavOnly(!favOnly)}>★ Favoritas</button>
          <button className="btn btn-secondary" onClick={() => setDiffFilter("all")}>Cualquier dificultad</button>
          <button className="btn btn-secondary" onClick={() => setDiffFilter("Fácil")}>Fácil</button>
          <button className="btn btn-secondary" onClick={() => setDiffFilter("Moderada")}>Moderada</button>
          <button className="btn btn-secondary" onClick={() => setDiffFilter("Difícil")}>Difícil</button>
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
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              className={"btn " + (chosenId === r.id ? "btn-secondary" : "btn-primary")}
              onClick={() => choose(r.id)}
              disabled={chosenId === r.id}
              style={{ flex: 1 }}
            >
              {chosenId === r.id ? "Ruta elegida ✓" : "Elegir esta ruta"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => { const n = await toggleFavorite(r.id); setFavorites(n); }}
              style={{ width: 60 }}
            >
              {favorites.includes(r.id) ? "★" : "☆"}
            </button>
            {r.isCustom && (
              <button className="btn btn-danger" onClick={() => handleDeleteRoute(r.id)} style={{ width: 60 }}>
                🗑
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}