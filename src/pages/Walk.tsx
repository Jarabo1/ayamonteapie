import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import { START_POINT } from "../data/routes";
import { haversineM, formatDistance, formatDuration, formatSpeed, estimateCalories } from "../utils/geo";
import { saveWalk, getAllCustomRoutes, getChosenRouteId, getKV } from "../utils/storage";
import { routes as staticRoutes } from "../data/routes";
import type { TrackPoint, LatLng, Route } from "../types";

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
  const [chosenRoute, setChosenRoute] = useState<Route | null>(null);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [autoPause, setAutoPause] = useState<boolean>(true);
  useEffect(() => { autoPauseRef.current = autoPause; }, [autoPause]);

  async function sos() {
    const p = pos || (pointsRef.current.length ? [pointsRef.current[pointsRef.current.length - 1].lat, pointsRef.current[pointsRef.current.length - 1].lng] as LatLng : null);
    const url = p ? `https://maps.google.com/?q=${p[0]},${p[1]}` : "";
    const text = p ? `Necesito ayuda. Mi ubicación: ${url}` : "Necesito ayuda.";
    if (navigator.share) {
      try { await navigator.share({ title: "SOS Ayamonte a Pie", text }); return; } catch {}
    }
    if (url) window.open(url, "_blank");
  }

  useEffect(() => { chosenRouteRef.current = chosenRoute; }, [chosenRoute]);

  // Mantener la pantalla activa mientras se camina (Wake Lock) y re-adquirir al volver a primer plano.
  useEffect(() => {
    async function reacquire() {
      if (status !== "running") return;
      if (document.visibilityState !== "visible") return;
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current?.release?.();
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    }
    const onVis = () => { if (document.visibilityState === "visible") reacquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [status]);

  function speak(text: string) {
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window)) return;
    try {
      if (navigator.vibrate) navigator.vibrate(200);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function guide(pos: LatLng) {
    const r = chosenRouteRef.current;
    if (!r || !r.geometry || r.geometry.length < 2 || !r.indications || !r.indications.length) return;
    const geom = r.geometry;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < geom.length; i++) {
      const d = haversineM(pos, geom[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    const progress = best / (geom.length - 1);
    const idx = Math.min(r.indications.length - 1, Math.floor(progress * r.indications.length));
    if (idx > lastSpokenIdxRef.current) {
      lastSpokenIdxRef.current = idx;
      speak(r.indications[idx]);
    }
  }

  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      const id = await getChosenRouteId();
      if (id) {
        const custom = await getAllCustomRoutes();
        const all = [...staticRoutes, ...custom];
        const r = all.find((x) => x.id === id) || null;
        setChosenRoute(r);
        chosenRouteRef.current = r;
      }
      const w = await getKV<number>("weightKg");
      if (w) setWeightKg(w);
    })();
  }, []);
  const pausedAtRef = useRef<number>(0);
  const pausedMsRef = useRef<number>(0);
  const pointsRef = useRef<TrackPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const maxSpeedRef = useRef<number>(0);
  const lastSpokenIdxRef = useRef<number>(-1);
  const lastMoveRef = useRef<number>(0);
  const autoPauseRef = useRef<boolean>(true);
  const chosenRouteRef = useRef<Route | null>(null);

  useEffect(() => {
    let iv: any = null;
    if (status === "running") {
      lastMoveRef.current = Date.now();
      iv = setInterval(() => {
        setTick((t) => t + 1);
        if (autoPauseRef.current && lastMoveRef.current && Date.now() - lastMoveRef.current > 60000) {
          pause();
        }
      }, 1000);
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
    lastSpokenIdxRef.current = -1;
    const r = chosenRouteRef.current;
    if (r) {
      const first = r.indications && r.indications.length ? r.indications[0] : "el punto de salida";
      speak(`Iniciando caminata por la ruta ${r.name}. Dirígete hacia ${first}.`);
      lastSpokenIdxRef.current = 0;
    } else {
      speak("Caminata libre iniciada.");
    }

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
        guide([pt.lat, pt.lng]);
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
          lastMoveRef.current = Date.now();
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
        guide([pt.lat, pt.lng]);
        if (pt.accuracy > MAX_ACCURACY) return;
        const prev = pointsRef.current[pointsRef.current.length - 1];
        if (prev) {
          const dt = (pt.timestamp - prev.timestamp) / 1000;
          const dist = haversineM([prev.lat, prev.lng], [pt.lat, pt.lng]);
          if (dt > 0 && (dist/1000)/(dt/3600) > MAX_JUMP_SPEED_KMH) return;
          if (dist < 2) return;
          lastMoveRef.current = Date.now();        }
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
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
      calories: estimateCalories(dur, weightKg),
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
        {chosenRoute && (
          <p style={{ fontSize: "0.85rem", color: "#2e7d5b", margin: "4px 0" }}>
            Ruta elegida: <strong>{chosenRoute.name}</strong> — guía por voz activa.
          </p>
        )}
        <label style={{ fontSize: "0.85rem" }}>
          <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} /> Guía por voz
        </label>
        <label style={{ fontSize: "0.85rem", marginLeft: 12 }}>
          <input type="checkbox" checked={autoPause} onChange={(e) => setAutoPause(e.target.checked)} /> Auto-pausa si te detienes
        </label>
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
          Puntos registrados: {points.length} · Calorías est.: {estimateCalories(elapsedSec, weightKg)} (aprox.)
        </p>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-danger" onClick={sos}>� SOS / Compartir ubicación</button>
        </div>
      </div>
    </div>
  );
}