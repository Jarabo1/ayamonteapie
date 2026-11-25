export type LatLng = [number, number]; // [lat, lng]

export type Difficulty = "Fácil" | "Moderada" | "Difícil";

export type Terrain = string;

export interface Route {
  id: string;
  name: string;
  category: "urbana" | "natural";
  description: string;
  difficulty: Difficulty;
  terrain: Terrain;
  estimatedDurationMin: number;
  elevationGainM?: number; // pending if undefined
  elevationVerified: boolean;
  distanceKm?: number; // computed/verified
  distanceVerified: boolean;
  startPoint: LatLng;
  waypoints: LatLng[];
  // geometry filled after routing
  geometry?: LatLng[];
  indications: string[];
  photos: string[]; // urls
  verified: boolean;
  isCustom?: boolean;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
}

export interface Walk {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  movingSec: number;
  distanceM: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  calories: number;
  routeId?: string;
  routeName?: string;
  points: TrackPoint[];
}

export interface Settings {
  weightKg: number;
}