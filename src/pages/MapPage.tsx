import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import { routes as staticRoutes } from "../data/routes";
import { START_POINT } from "../data/routes";
import { getAllCustomRoutes } from "../utils/storage";
import { useUserLocation } from "../hooks/useUserLocation";
import type { Route, LatLng } from "../types";

export default function MapPage() {
  const { pos, error: geoError, request } = useUserLocation();
  const [selected, setSelected] = useState<string>("");
  const [center, setCenter] = useState<LatLng | null>(null);
  const [allRoutes, setAllRoutes] = useState<Route[]>(staticRoutes);

  useEffect(() => { getAllCustomRoutes().then((c) => setAllRoutes([...staticRoutes, ...c])); }, []);

  const route = allRoutes.find((r) => r.id === selected);
  const geom = (route?.geometry || []) as LatLng[];
  const displayCenter: LatLng = center || (pos || START_POINT);

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mapa interactivo</h2>
        <label>Ruta a visualizar</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— Ninguna —</option>
          {allRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}{r.isCustom ? " (creada)" : ""}</option>)}
        </select>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={() => setCenter(START_POINT)}>Centrar en salida fija</button>
          <button className="btn btn-secondary" onClick={() => pos && setCenter(pos)}>Centrar en mi posición</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={request}>Activar mi ubicación (GPS)</button>
        </div>
        {pos && <p style={{ color: "#2e7d5b", fontSize: "0.85rem", marginTop: 6 }}>Ubicación activa.</p>}
        {geoError && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>GPS: {geoError}. Activa el permiso en el navegador.</p>}
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 6 }}>
          {pos ? "Punto de salida: tu ubicación actual." : "Punto de salida: confluencia de calle Estadio con calle Sor Eloisa."}
        </p>
      </div>
      <MapView center={displayCenter} routeGeometry={geom.length ? geom : undefined} userPos={pos} startPoint={pos ? pos : START_POINT} waypoints={route?.isCustom ? route.waypoints : undefined} height="65vh" />
      <div className="card">
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          <strong>PUNTO DE SALIDA:</strong> {pos ? "Tu ubicación actual (GPS)." : "Confluencia de calle Estadio con calle Sor Eloisa, Ayamonte (Huelva)."}
        </p>
      </div>
    </div>
  );
}