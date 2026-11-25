const START = [37.2169243, -7.3973623];
const P = {
  parque: [37.2125895, -7.4034414],
  ayunt: [37.2143429, -7.4090158],
  mirador: [37.2254285, -7.4082161],
  angustias: [37.2134377, -7.4092216],
  ribera: [37.2126098, -7.4072998],
  viaverde: [37.2188812, -7.3762292],
  valdecerros: [37.2383765, -7.3739840],
  noria: [37.2184970, -7.4050699],
  puente: [37.2376563, -7.4178615],
  laVilla: [37.2209206, -7.4071236],
};

const routes = [
  { id: "r1", name: "Centro de Ayamonte y Parque Prudencio Navarro", cat: "urbana", wps: [START, P.parque, P.ayunt, P.ribera, START] },
  { id: "r2", name: "Casco histórico y Barrio de La Villa", cat: "urbana", wps: [START, P.angustias, P.laVilla, P.mirador, START] },
  { id: "r3", name: "Barrio Alto y calles tradicionales", cat: "urbana", wps: [START, P.noria, P.laVilla, P.mirador, START] },
  { id: "r4", name: "La Villa y sus miradores", cat: "urbana", wps: [START, P.laVilla, P.mirador, START] },
  { id: "r5", name: "Centro histórico y paseo de la Ribera", cat: "urbana", wps: [START, P.angustias, P.ribera, P.parque, START] },
  { id: "r6", name: "Barriadas y zonas residenciales", cat: "urbana", wps: [START, P.noria, P.parque, P.ribera, START] },
  { id: "r7", name: "Ruta urbana completa de Ayamonte", cat: "urbana", wps: [START, P.parque, P.ayunt, P.ribera, P.noria, START] },
  { id: "r8", name: "Campiña y caminos rurales", cat: "natural", wps: [START, P.noria, [37.222, -7.39], [37.220, -7.395], START] },
  { id: "r9", name: "Camino de la Noria", cat: "natural", wps: [START, P.noria, [37.2209, -7.4049], P.mirador, START] },
  { id: "r10", name: "Camino de la Puente", cat: "natural", wps: [START, [37.225, -7.408], [37.220, -7.405], START] },
  { id: "r11", name: "Valdecerros", cat: "natural", wps: [START, [37.225, -7.39], [37.222, -7.385], START] },
  { id: "r12", name: "Vera Abajo", cat: "natural", wps: [START, P.noria, [37.220, -7.39], [37.218, -7.385], START] },
  { id: "r13", name: "Vía Verde del Litoral", cat: "natural", wps: [[37.2188812, -7.3762292], [37.2206543, -7.3520724], [37.2188812, -7.3762292]] },
  { id: "r14", name: "Caminos y senderos de los alrededores de Ayamonte", cat: "natural", wps: [START, P.noria, [37.225, -7.39], [37.220, -7.395], START] },
];

async function fetchRoute(wps) {
  const coords = wps.map(p => `${p[1]},${p[0]}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== "Ok") throw new Error(json.code);
  const r = json.routes[0];
  const geom = r.geometry.coordinates.map(c => [c[1], c[0]]);
  const streets = [];
  for (const leg of r.legs) {
    for (const step of leg.steps) {
      const name = (step.name || "").trim();
      if (name && (streets.length === 0 || streets[streets.length-1] !== name)) {
        streets.push(name);
      }
    }
  }
  return { distance: r.distance, duration: r.duration, geometry: geom, streets };
}

const out = {};
for (const r of routes) {
  try {
    console.log("fetching", r.id, r.name);
    const res = await fetchRoute(r.wps);
    out[r.id] = res;
    console.log("  ok", (res.distance/1000).toFixed(2), "km", res.streets.length, "calles");
  } catch (e) {
    console.error("  FAIL", r.id, e.message);
    out[r.id] = null;
  }
  await new Promise(res => setTimeout(res, 1200));
}

import { writeFileSync } from "fs";
writeFileSync("scripts/routes_result.json", JSON.stringify(out, null, 2));
console.log("done");
