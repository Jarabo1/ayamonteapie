import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { LatLng } from "../types";

const startIcon = L.divIcon({
  className: "start-marker",
  html: '<div style="background:#2e7d5b;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)">S</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const userIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background:#2b6cb0;color:white;border-radius:50%;width:22px;height:22px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  routeGeometry?: LatLng[];
  walked?: LatLng[];
  userPos?: LatLng | null;
  startPoint?: LatLng | null;
  waypoints?: LatLng[];
  height?: string;
  onMapClick?: (p: LatLng) => void;
  fitBounds?: boolean;
}

export default function MapView({
  center, zoom = 15, routeGeometry, walked, userPos, startPoint, waypoints, height = "60vh", onMapClick, fitBounds = false,
}: MapViewProps) {
  // fit bounds
  const Fit = () => {
    const map = useMap();
    useEffect(() => {
      const pts: LatLng[] = [];
      if (routeGeometry) pts.push(...routeGeometry);
      if (walked && walked.length) pts.push(...walked);
      if (pts.length > 1) {
        const b = L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(b, { padding: [20, 20] });
      }
    }, [map]);
    return null;
  };

  const ClickHandler = () => {
    useMapEvents({ click: (e) => onMapClick?.([e.latlng.lat, e.latlng.lng]) });
    return null;
  };

  return (
    <div style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler />}
        {fitBounds && <Fit />}
        {startPoint && <Marker position={startPoint} icon={startIcon} title="PUNTO DE SALIDA" />}
        {routeGeometry && routeGeometry.length > 1 && (
          <Polyline positions={routeGeometry} color="#2e7d5b" weight={4} opacity={0.8} />
        )}
        {walked && walked.length > 1 && (
          <Polyline positions={walked} color="#2b6cb0" weight={4} opacity={0.9} />
        )}
        {waypoints && waypoints.map((w, i) => (
          <Marker key={i} position={w} icon={L.divIcon({
            className: "wp-marker",
            html: `<div style="background:#d4a373;color:#1f2937;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);font-size:12px">${i + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })} title={`Punto ${i + 1}`} />
        ))}
        {userPos && <Marker position={userPos} icon={userIcon} title="Tu posición" />}
      </MapContainer>
    </div>
  );
}