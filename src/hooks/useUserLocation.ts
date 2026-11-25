import { useEffect, useState } from "react";
import type { LatLng } from "../types";
import { START_POINT } from "../data/routes";

export function useUserLocation() {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const request = () => {
    if (!navigator.geolocation) { setError("Geolocalización no disponible"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos([p.coords.latitude, p.coords.longitude]); setError(""); setLoading(false); },
      (e) => { setError(e.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    request();
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const effectiveStart: LatLng = pos || START_POINT;
  return { pos, error, loading, effectiveStart, isUser: !!pos, request };
}