import type { Walk } from "../types";

export function walksToCSV(walks: Walk[]): string {
  const header = ["id", "fecha", "hora", "distancia_m", "duracion_s", "tiempo_movimiento_s", "velocidad_media_kmh", "velocidad_max_kmh", "calorias", "ruta"];
  const rows = walks.map((w) => {
    const d = new Date(w.startedAt);
    return [
      w.id,
      d.toLocaleDateString("es-ES"),
      d.toLocaleTimeString("es-ES"),
      w.distanceM.toFixed(1),
      w.durationSec,
      w.movingSec,
      w.avgSpeedKmh.toFixed(2),
      w.maxSpeedKmh.toFixed(2),
      w.calories,
      (w.routeName || "").replace(/,/g, " "),
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function downloadCSV(walks: Walk[]): void {
  const csv = walksToCSV(walks);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ayamonte-a-pie-historial.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function walkToGPX(walk: Walk): string {
  const pts = walk.points
    .map((p) => `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.timestamp).toISOString()}</time></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ayamonte a Pie" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${walk.routeName || "Caminata"}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>`;
}

export function downloadGPX(walk: Walk): void {
  const gpx = walkToGPX(walk);
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caminata-${walk.id}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllGPX(walks: Walk[]): void {
  // bundle as single gpx with multiple tracks
  const tracks = walks
    .map((w) => {
      const pts = w.points
        .map((p) => `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.timestamp).toISOString()}</time></trkpt>`)
        .join("\n");
      return `  <trk>\n    <name>${w.routeName || "Caminata"} - ${new Date(w.startedAt).toLocaleString("es-ES")}</name>\n    <trkseg>\n${pts}\n    </trkseg>\n  </trk>`;
    })
    .join("\n");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ayamonte a Pie" xmlns="http://www.topografix.com/GPX/1/1">
${tracks}
</gpx>`;
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ayamonte-a-pie-historial.gpx";
  a.click();
  URL.revokeObjectURL(url);
}