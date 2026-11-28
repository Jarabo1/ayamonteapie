import { useEffect, useState } from "react";
import { getAllWalks, deleteWalk, clearWalks, exportBackup, importBackup } from "../utils/storage";
import { downloadCSV, downloadGPX, downloadAllGPX } from "../utils/export";
import { formatDistance, formatDuration, formatSpeed } from "../utils/geo";
import MapView from "../components/MapView";
import type { Walk, LatLng } from "../types";

export default function History() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  async function reload() { setWalks(await getAllWalks()); }
  useEffect(() => { reload(); }, []);

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Historial de caminatas</h2>
        <div className="row">
          <button className="btn btn-secondary" onClick={() => downloadCSV(walks)}>Exportar CSV</button>
          <button className="btn btn-secondary" onClick={() => downloadAllGPX(walks)}>Exportar GPX</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={async () => {
            const json = await exportBackup();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "ayamonte-backup.json"; a.click();
            URL.revokeObjectURL(url);
          }}>Exportar backup JSON</button>
          <label className="btn btn-secondary" style={{ textAlign: "center", cursor: "pointer" }}>
            Importar backup
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              await importBackup(text);
              reload();
              alert("Backup importado");
            }} />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-danger" onClick={async () => { if (confirm("¿Eliminar todo el historial?")) { await clearWalks(); reload(); } }}>Borrar todo</button>
        </div>
      </div>

      {walks.length === 0 && <div className="card">No hay caminatas guardadas.</div>}

      {walks.map((w) => {
        const walked: LatLng[] = w.points.map((p) => [p.lat, p.lng]);
        const center: LatLng = walked.length ? walked[0] : [37.2169243, -7.3973623];
        return (
          <div className="card" key={w.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{new Date(w.startedAt).toLocaleString("es-ES")}</strong>
                <div className="route-meta">{formatDistance(w.distanceM)} · {formatDuration(w.durationSec)} · {formatSpeed(w.avgSpeedKmh)}</div>
              </div>
              <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => setOpenId(openId === w.id ? null : w.id)}>
                {openId === w.id ? "Ocultar" : "Ver mapa"}
              </button>
            </div>
            {openId === w.id && walked.length > 1 && (
              <div style={{ marginTop: 8 }}>
                <MapView center={center} walked={walked} height="40vh" fitBounds />
              </div>
            )}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => downloadGPX(w)}>GPX</button>
              <button className="btn btn-secondary" onClick={async () => {
                if (navigator.share) {
                  try { await navigator.share({ title: "Caminata Ayamonte a Pie", text: `${formatDistance(w.distanceM)} en ${formatDuration(w.durationSec)}` }); } catch {}
                } else { alert("Compartir no disponible"); }
              }}>Compartir</button>
              <button className="btn btn-danger" onClick={async () => { if (confirm("¿Eliminar esta caminata?")) { await deleteWalk(w.id); reload(); } }}>Eliminar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}