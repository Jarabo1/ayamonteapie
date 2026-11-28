import { useEffect, useState } from "react";
import { getAllWalks, getKV, setKV } from "../utils/storage";
import { formatDuration, formatSpeed } from "../utils/geo";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Walk } from "../types";

export default function Stats() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [weight, setWeight] = useState<number>(70);
  const [goalKm, setGoalKm] = useState<number>(10);
  useEffect(() => { getAllWalks().then(setWalks); getKV<number>("weightKg").then((w) => { if (w) setWeight(w); }); getKV<number>("goalKm").then((g) => { if (g) setGoalKm(g); }); }, []);

  const totalKm = walks.reduce((s, w) => s + w.distanceM, 0) / 1000;
  const totalSec = walks.reduce((s, w) => s + w.durationSec, 0);
  const avgDist = walks.length ? totalKm / walks.length : 0;
  const avgSpeed = walks.length ? walks.reduce((s, w) => s + w.avgSpeedKmh, 0) / walks.length : 0;
  const bestDist = walks.length ? Math.max(...walks.map((w) => w.distanceM)) / 1000 : 0;
  const bestDur = walks.length ? Math.max(...walks.map((w) => w.durationSec)) : 0;

  // weekly (last 7 days)
  const now = new Date();
  const days: { name: string; km: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const km = walks
      .filter((w) => new Date(w.startedAt).toDateString() === key)
      .reduce((s, w) => s + w.distanceM, 0) / 1000;
    days.push({ name: d.toLocaleDateString("es-ES", { weekday: "short" }), km: Number(km.toFixed(2)) });
  }

  // monthly (last 4 weeks)
  const weeks: { name: string; km: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const km = walks
      .filter((w) => w.startedAt >= start.getTime() && w.startedAt < end.getTime())
      .reduce((s, w) => s + w.distanceM, 0) / 1000;
    weeks.push({ name: `S${4 - i}`, km: Number(km.toFixed(2)) });
  }

  return (
    <div>
      <div className="card"><h2 style={{ marginTop: 0 }}>Estadísticas personales</h2></div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Logros</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {walks.length >= 1 && <li>Primera caminata completada</li>}
          {totalKm >= 5 && <li>Más de 5 km acumulados</li>}
          {totalKm >= 25 && <li>Más de 25 km acumulados</li>}
          {walks.length >= 10 && <li>10 caminatas realizadas</li>}
          {bestDist >= 10 && <li>Récord de 10 km en una caminata</li>}
          {walks.length === 0 && <li>Aún sin logros: ¡sal a caminar!</li>}
        </ul>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ajustes</h3>
        <label>Peso (kg) para calorías</label>
        <input type="number" value={weight} onChange={async (e) => { const v = Number(e.target.value); setWeight(v); await setKV("weightKg", v); }} />
        <label style={{ marginTop: 8 }}>Objetivo semanal (km)</label>
        <input type="number" value={goalKm} onChange={async (e) => { const v = Number(e.target.value); setGoalKm(v); await setKV("goalKm", v); }} />
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="val">{totalKm.toFixed(1)}</div><div className="lbl">km totales</div></div>
        <div className="stat"><div className="val">{walks.length}</div><div className="lbl">caminatas</div></div>
        <div className="stat"><div className="val">{formatDuration(totalSec)}</div><div className="lbl">tiempo total</div></div>
        <div className="stat"><div className="val">{avgDist.toFixed(2)}</div><div className="lbl">km media</div></div>
        <div className="stat"><div className="val">{formatSpeed(avgSpeed)}</div><div className="lbl">vel. media</div></div>
        <div className="stat"><div className="val">{bestDist.toFixed(2)}</div><div className="lbl">mejor distancia</div></div>
        <div className="stat"><div className="val">{formatDuration(bestDur)}</div><div className="lbl">récord duración</div></div>
      </div>
      <div className="card">
        <h3>Actividad semanal (km)</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="km" fill="#2e7d5b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3>Actividad mensual (km por semana)</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="km" fill="#2b6cb0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}