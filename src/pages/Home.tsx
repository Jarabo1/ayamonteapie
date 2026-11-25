import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstallPrompt from "../components/InstallPrompt";
import { getAllWalks } from "../utils/storage";
import { formatDistance, formatDuration } from "../utils/geo";
import type { Walk } from "../types";

export default function Home() {
  const [walks, setWalks] = useState<Walk[]>([]);
  useEffect(() => { getAllWalks().then(setWalks); }, []);

  const totalKm = walks.reduce((s, w) => s + w.distanceM, 0) / 1000;
  const totalSec = walks.reduce((s, w) => s + w.durationSec, 0);

  return (
    <div>
      <InstallPrompt />
      <div className="card" style={{ textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Bienvenido a AYAMONTE A PIE</h2>
        <p style={{ color: "#6b7280" }}>Descubre y recorre Ayamonte caminando.</p>
        <Link to="/caminar"><button className="btn btn-primary track-btn">🚶 INICIAR CAMINATA</button></Link>
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