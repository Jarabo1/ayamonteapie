import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import { START_POINT } from "../data/routes";
import { haversineM, formatDistance, formatDuration, formatSpeed, estimateCalories } from "../utils/geo";
import { saveWalk } from "../utils/storage";
import type { TrackPoint, LatLng } from "../types";

const MAX_ACCURACY = 30; // meters
const MAX_JUMP_SPEED_KMH = 15;

export default function Walk() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [error, setError] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [summary, setSummary] = useState<{ distanceM: number; durationSec: number; avgSpeedKmh: number; maxSpeedKmh: number; calories: number } | null>(null);

  const startedAtRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const pausedMsRef = useRef<number>(0);
  const pointsRef = useRef<TrackPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const maxSpeedRef = useRef<number>(0);

  useEffect(() => {
    let iv: any = null;
    if (status === "running") {
      iv = setInterval(() => setTick((t) => t + 1), 1000);
    }
    return () => { if (iv) clearInterval(iv); };
  }, [status]);

  const elapsedSec = (() => {
    if (status === "idle" || status === "finished") return 0;
    const base = status === "paused" ? pausedAtRef.current : Date.now();
    return Math.max(0, (base - startedAtRef.current - pausedMsRef.current) / 1000) + tick * 0;
  })();

  const distanceM = (() => {
    const pts = pointsRef.current;
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += haversineM([pts[i-1].lat, pts[i-1].lng], [pts[i].lat, pts[i].lng]);
    return d;
  })();

  const avgSpeedKmh = elapsedSec > 0 ? (distanceM / 1000) / (elapsedSec / 3600) : 0;

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch {}
  }

  function releaseWakeLock() {
    try { wakeLockRef.current?.release(); } catch {}
    wakeLockRef.current = null;
  }

  function start() {
    if (!navigator.geolocation) { setError("Geolocalización no soportada"); return; }
    setError("");
    pointsRef.current = [];
    setPoints([]);
    setSummary(null);
    maxSpeedRef.current = 0;
    startedAtRef.current = Date.now();
    pausedMsRef.current = 0;
    setStatus("running");
    requestWakeLock();

    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pt: TrackPoint = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp || Date.now(),
          speed: p.coords.speed ?? undefined,
        };
        setPos([pt.lat, pt.lng]);
        // filter accuracy
        if (pt.accuracy > MAX_ACCURACY) return;
        const prev = pointsRef.current[pointsRef.current.length - 1];
        if (prev) {
          const dt = (pt.timestamp - prev.timestamp) / 1000;
          const dist = haversineM([prev.lat, prev.lng], [pt.lat, pt.lng]);
          if (dt > 0) {
            const speedKmh = (dist / 1000) / (dt / 3600);
            if (speedKmh > MAX_JUMP_SPEED_KMH) return; // anomaly
          }
          if (dist < 2) return; // ignore tiny jitter
        }
        // compute instantaneous speed
        if (prev) {
          const dt = (pt.timestamp - prev.timestamp) / 1000;
          if (dt > 0) {
            const sp = (haversineM([prev.lat, prev.lng], [pt.lat, pt.lng]) / 1000) / (dt / 3600);
            if (sp > maxSpeedRef.current) maxSpeedRef.current = sp;
          }
        }
        pointsRef.current = [...pointsRef.current, pt];
        setPoints(pointsRef.current);
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    watchIdRef.current = id;
  }

  function pause() {
    if (status !== "running") return;
    pausedAtRef.current = Date.now();
    setStatus("paused");
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function resume() {
    if (status !== "paused") return;
    pausedMsRef.current += Date.now() - pausedAtRef.current;
    setStatus("running");
    requestWakeLock();
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pt: TrackPoint = {
          lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy,
          timestamp: p.timestamp || Date.now(), speed: p.coords.speed ?? undefined,
        };
        setPos([pt.lat, pt.lng]);
        if (pt.accuracy > MAX_ACCURACY) return;
        const prev = pointsRef.current[pointsRef.current.length - 1];
        if (prev) {
          const dt = (pt.timestamp - prev.timestamp) / 1000;
          const dist = haversineM([prev.lat, prev.lng], [pt.lat, pt.lng]);
          if (dt > 0 && (dist/1000)/(dt/3600) > MAX_JUMP_SPEED_KMH) return;
          if (dist < 2) return;
        }
        if (prev) {
          const dt = (pt.timestamp - prev.timestamp) / 1000;
          if (dt > 0) {
            const sp = (haversineM([prev.lat, prev.lng], [pt.lat, pt.lng]) / 1000) / (dt / 3600);
            if (sp > maxSpeedRef.current) maxSpeedRef.current = sp;
          }
        }
        pointsRef.current = [...pointsRef.current, pt];
        setPoints(pointsRef.current);
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    watchIdRef.current = id;
  }

  async function finish() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    const endedAt = Date.now();
    const dur = Math.max(0, (endedAt - startedAtRef.current - pausedMsRef.current) / 1000);
    const dist = distanceM;
    const walk = {
      id: crypto.randomUUID(),
      startedAt: startedAtRef.current,
      endedAt,
      durationSec: dur,
      movingSec: dur,
      distanceM: dist,
      avgSpeedKmh: dur > 0 ? (dist/1000)/(dur/3600) : 0,
      maxSpeedKmh: maxSpeedRef.current,
      calories: estimateCalories(dur, 70),
      points: pointsRef.current,
    };
    await saveWalk(walk);
    setSummary({ distanceM: dist, durationSec: dur, avgSpeedKmh: walk.avgSpeedKmh, maxSpeedKmh: walk.maxSpeedKmh, calories: walk.calories });
    setStatus("finished");
  }

  function reset() {
    setStatus("idle");
    setPoints([]);
    pointsRef.current = [];
    setSummary(null);
    setError("");
  }

  const displayDistance = summary ? summary.distanceM : distanceM;
  const displayDuration = summary ? summary.durationSec : elapsedSec;
  const displayAvg = summary ? summary.avgSpeedKmh : avgSpeedKmh;
  const displayMax = summary ? summary.maxSpeedKmh : maxSpeedRef.current;
  const center: LatLng = pos || START_POINT;
  const walked: LatLng[] = points.map((p) => [p.lat, p.lng]);

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Caminata GPS</h2>
        {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>GPS: {error}</p>}
        <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          El seguimiento puede interrumpirse si Android suspende el navegador. Mantén la pantalla activa.
        </p>
      </div>

      <MapView center={center} userPos={pos} walked={walked.length ? walked : undefined} startPoint={pos || START_POINT} height="45vh" />

      <div className="walk-stats">
        <div className="walk-stat"><div className="v">{formatDistance(displayDistance)}</div><div className="l">Distancia</div></div>
        <div className="walk-stat"><div className="v">{formatDuration(displayDuration)}</div><div className="l">Duración</div></div>
        <div className="walk-stat"><div className="v">{formatSpeed(displayAvg)}</div><div className="l">Vel. media</div></div>
        <div className="walk-stat"><div className="v">{formatSpeed(displayMax)}</div><div className="l">Vel. máx</div></div>
      </div>

      <div className="card">
        {status === "idle" && (
          <button className="btn btn-primary track-btn" onClick={start}>▶ INICIAR CAMINATA</button>
        )}
        {status === "running" && (
          <div className="row">
            <button className="btn btn-secondary" onClick={pause}>⏸ PAUSAR</button>
            <button className="btn btn-danger" onClick={finish}>⏹ FINALIZAR</button>
          </div>
        )}
        {status === "paused" && (
          <div className="row">
            <button className="btn btn-primary" onClick={resume}>▶ REANUDAR</button>
            <button className="btn btn-danger" onClick={finish}>⏹ FINALIZAR</button>
          </div>
        )}
        {status === "finished" && summary && (
          <div>
            <p><strong>Caminata guardada.</strong> {formatDistance(summary.distanceM)} en {formatDuration(summary.durationSec)}.</p>
            <div className="row">
              <button className="btn btn-secondary" onClick={() => navigate("/historial")}>Ver historial</button>
              <button className="btn btn-primary" onClick={reset}>Nueva caminata</button>
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
          Puntos registrados: {points.length} · Calorías est.: {estimateCalories(elapsedSec, 70)} (aprox.)
        </p>
      </div>
    </div>
  );
}