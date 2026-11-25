import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { routes as staticRoutes } from "../data/routes";
import { getAllCustomRoutes, deleteCustomRoute } from "../utils/storage";
import { START_POINT } from "../data/routes";
import MapView from "../components/MapView";
import { useUserLocation } from "../hooks/useUserLocation";
import type { Route, LatLng } from "../types";
import { haversineM } from "../utils/geo";

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pos, request } = useUserLocation();
  const [allRoutes, setAllRoutes] = useState<Route[]>(staticRoutes);
  const [approxInGeom, setApproxInGeom] = useState<LatLng[]>([]);
  const [approxInDist, setApproxInDist] = useState<number>(0);
  const [approxInStreets, setApproxInStreets] = useState<string[]>([]);
  const [approxOutGeom, setApproxOutGeom] = useState<LatLng[]>([]);
  const [approxOutDist, setApproxOutDist] = useState<number>(0);
  const [approxOutStreets, setApproxOutStreets] = useState<string[]>([]);
  const [userStreet, setUserStreet] = useState<string>("");

  useEffect(() => {
    getAllCustomRoutes().then((c) => setAllRoutes([...staticRoutes, ...c]));
  }, []);

  const route = allRoutes.find((r) => r.id === id);

  useEffect(() => {
    setUserStreet("");
    if (!pos) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`, { headers: { "Accept-Language": "es" } })
      .then((r) => r.json())
      .then((json) => {
        const road = json?.address?.road || json?.address?.pedestrian || json?.address?.footway || json?.name;
        if (road) setUserStreet(road);
      })
      .catch(() => {});
  }, [pos]);

  useEffect(() => {
    setApproxInGeom([]);
    setApproxInDist(0);
    setApproxOutGeom([]);
    setApproxOutDist(0);
    if (!pos || !route || route.isCustom) return;
    const geom = (route.geometry && route.geometry.length) ? route.geometry : [];
    const reverse = geom.length >= 2 && haversineM(pos, geom[geom.length - 1]) < haversineM(pos, geom[0]);
    const usedGeom = reverse ? [...geom].reverse() : geom;
    const first = usedGeom.length ? usedGeom[0] : route.startPoint;
    const last = usedGeom.length ? usedGeom[usedGeom.length - 1] : route.startPoint;
    const urlIn = `https://router.project-osrm.org/route/v1/foot/${pos[1]},${pos[0]};${first[1]},${first[0]}?overview=full&geometries=geojson&steps=true`;
    const urlOut = `https://router.project-osrm.org/route/v1/foot/${last[1]},${last[0]};${pos[1]},${pos[0]}?overview=full&geometries=geojson&steps=true`;
    fetch(urlIn).then((r) => r.json()).then((json) => {
      if (json.code !== "Ok") return;
      const r0 = json.routes[0];
      setApproxInGeom(r0.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLng));
      setApproxInDist(r0.distance);
      const sts: string[] = [];
      for (const leg of r0.legs) for (const step of leg.steps) {
        const n = (step.name || "").trim();
        if (n && (sts.length === 0 || sts[sts.length - 1] !== n)) sts.push(n);
      }
      setApproxInStreets(sts);
    }).catch(() => {});
    fetch(urlOut).then((r) => r.json()).then((json) => {
      if (json.code !== "Ok") return;
      const r0 = json.routes[0];
      setApproxOutGeom(r0.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLng));
      setApproxOutDist(r0.distance);
      const sts: string[] = [];
      for (const leg of r0.legs) for (const step of leg.steps) {
        const n = (step.name || "").trim();
        if (n && (sts.length === 0 || sts[sts.length - 1] !== n)) sts.push(n);
      }
      setApproxOutStreets(sts);
    }).catch(() => {});
  }, [pos, route]);

  if (!route) return <div className="card">Ruta no encontrada.</div>;

  const baseGeomRaw = (route.geometry || []) as LatLng[];
  const reverse = !!pos && !route.isCustom && baseGeomRaw.length >= 2 && haversineM(pos, baseGeomRaw[baseGeomRaw.length - 1]) < haversineM(pos, baseGeomRaw[0]);
  const baseGeom = reverse ? [...baseGeomRaw].reverse() : baseGeomRaw;
  const baseIndications = reverse ? [...route.indications].reverse() : route.indications;
  const hasApprox = !route.isCustom && (approxInGeom.length || approxOutGeom.length);
  const displayIndications = (() => {
    if (!pos || route.isCustom) return route.indications;
    const combined: string[] = [];
    const push = (arr: string[]) => { for (const s of arr) if (combined.length === 0 || combined[combined.length - 1] !== s) combined.push(s); };
    if (userStreet) push([userStreet]);
    push(approxInStreets);
    push(baseIndications);
    push(approxOutStreets);
    return combined.length ? combined : route.indications;
  })();
  const geom = hasApprox
    ? [...(approxInGeom.length ? approxInGeom : []), ...baseGeom.slice(approxInGeom.length ? 1 : 0), ...(approxOutGeom.length ? approxOutGeom.slice(1) : [])]
    : baseGeom;
  const center: LatLng = pos || (geom.length ? geom[0] : (route.startPoint || START_POINT));
  const totalKm = ((approxInDist + (route.distanceKm ? route.distanceKm * 1000 : 0) + approxOutDist) / 1000);

  async function handleDelete() {
    if (!route || !route.isCustom) return;
    if (!confirm("¿Eliminar esta ruta creada?")) return;
    await deleteCustomRoute(route.id);
    navigate("/rutas");
  }

  return (
    <div>
      <Link to="/rutas" style={{ textDecoration: "none" }}>← Volver</Link>
      <div className="card" style={{ marginTop: 8 }}>
        <h2 style={{ marginTop: 0 }}>{route.name} {route.isCustom && <span className="badge">Creada por ti</span>}</h2>
        <div className="route-meta">{route.category === "urbana" ? "Urbana" : "Natural"} · {route.difficulty}</div>
        <p>{route.description}</p>
        <div className="stat-grid">
          <div className="stat"><div className="val">{route.distanceVerified ? (pos && (approxInDist || approxOutDist) && !route.isCustom ? totalKm.toFixed(2) + " km" : route.distanceKm?.toFixed(2) + " km") : "—"}</div><div className="lbl">Distancia {pos && (approxInDist || approxOutDist) && !route.isCustom ? "(circular, incl. aproximación)" : ""}</div></div>
          <div className="stat"><div className="val">{route.estimatedDurationMin} min</div><div className="lbl">Duración est.</div></div>
          <div className="stat"><div className="val">{route.elevationVerified ? route.elevationGainM + " m" : "Pendiente"}</div><div className="lbl">Desnivel</div></div>
          <div className="stat"><div className="val">{route.terrain}</div><div className="lbl">Terreno</div></div>
        </div>
        {pos && (approxInDist > 0 || approxOutDist > 0) && !route.isCustom && <div className="pending">⚠ Ruta circular: incluye tramos de aproximación desde/hasta tu ubicación (OSRM).</div>}
        {pos && userStreet && <div style={{ fontSize: "0.8rem", color: "#2e7d5b", marginTop: 4 }}>Tu ubicación actual: {userStreet}</div>}
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={request}>{pos ? "Actualizar mi ubicación" : "Activar mi ubicación (GPS)"}</button>
        </div>
        {!pos && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>Activa la ubicación para ver las calles desde tu posición.</p>}
        {!route.distanceVerified && <div className="pending">⚠ Distancia pendiente de verificar</div>}
        {!route.elevationVerified && <div className="pending">⚠ Desnivel pendiente de verificar</div>}
        {!route.isCustom && <div className="pending">⚠ Fotografías ilustrativas pendientes de añadir</div>}
      </div>
      <div className="card">
        <h3>Mapa de la ruta</h3>
        <MapView center={center} routeGeometry={geom} startPoint={route.startPoint} waypoints={route.isCustom ? route.waypoints : undefined} height="50vh" fitBounds />
      </div>
      <div className="card">
        <h3>Calles del recorrido (en orden)</h3>
        {displayIndications.length === 0 && <p style={{ color: "#6b7280" }}>Sin indicaciones.</p>}
        <ol>{displayIndications.map((ind, i) => <li key={i}>{ind}</li>)}</ol>
      </div>
      <div className="card">
        {route.isCustom && (
          <button className="btn btn-danger" onClick={handleDelete} style={{ marginBottom: 8 }}>Eliminar ruta</button>
        )}
        <Link to="/caminar"><button className="btn btn-primary">Iniciar caminata por esta ruta</button></Link>
      </div>
    </div>
  );
}