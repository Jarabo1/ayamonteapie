import { readFileSync, writeFileSync } from "fs";
const res = JSON.parse(readFileSync("scripts/routes_result.json", "utf8"));

const meta = {
 r1: { name:"Centro de Ayamonte y Parque Prudencio Navarro", cat:"urbana", desc:"Recorrido por el centro de Ayamonte, sus calles principales y el Parque Municipal Prudencio Navarro. Ideal para conocer la vida urbana y los espacios verdes de la ciudad.", diff:"Fácil", terrain:"Urbano, asfalto y aceras", dur:75, elevV:false, indications:["Salir del punto de salida hacia el centro.","Pasear por las calles comerciales.","Entrar al Parque Prudencio Navarro.","Regresar al punto de salida."], photos:[] },
 r2: { name:"Casco histórico y Barrio de La Villa", cat:"urbana", desc:"Ruta por el casco histórico de Ayamonte y el Barrio de La Villa, con sus calles estrechas y tradicionales.", diff:"Moderada", terrain:"Urbano, adoquín y rampas", dur:90, elevV:false, indications:["Subir hacia el Barrio de La Villa.","Recorrer calles históricas.","Disfrutar de los miradores.","Descender al centro."], photos:[] },
 r3: { name:"Barrio Alto y calles tradicionales", cat:"urbana", desc:"Paseo por el Barrio Alto, zona residencial tradicional con calles tranquilas y vistas.", diff:"Fácil", terrain:"Urbano, asfalto", dur:80, elevV:false, indications:["Dirigirse al Barrio Alto.","Recorrer sus calles tradicionales.","Volver al punto de salida."], photos:[] },
 r4: { name:"La Villa y sus miradores", cat:"urbana", desc:"Ruta centrada en el Barrio de La Villa y sus miradores sobre el Guadiana y la ciudad.", diff:"Moderada", terrain:"Urbano, rampas y escaleras", dur:95, elevV:false, indications:["Subir a La Villa.","Visitar los miradores.","Descender por calles distintas."], photos:[] },
 r5: { name:"Centro histórico y paseo de la Ribera", cat:"urbana", desc:"Combina el centro histórico con el paseo fluvial de la Ribera, junto al Guadiana.", diff:"Fácil", terrain:"Urbano y paseo fluvial", dur:75, elevV:false, indications:["Recorrer centro histórico.","Bajar al paseo de la Ribera.","Volver al punto de salida."], photos:[] },
 r6: { name:"Barriadas y zonas residenciales", cat:"urbana", desc:"Ruta por las barriadas y zonas residenciales de Ayamonte.", diff:"Fácil", terrain:"Urbano, asfalto", dur:80, elevV:false, indications:["Atravesar barriadas residenciales.","Volver al punto de salida."], photos:[] },
 r7: { name:"Ruta urbana completa de Ayamonte", cat:"urbana", desc:"Gran recorrido que une los principales barrios y zonas urbanas de Ayamonte.", diff:"Moderada", terrain:"Urbano variado", dur:130, elevV:false, indications:["Seguir el itinerario completo por todos los barrios.","Finalizar en el punto de salida."], photos:[] },
 r8: { name:"Campiña y caminos rurales", cat:"natural", desc:"Salida hacia la campiña ayamontina por caminos rurales y senderos. Distancia larga; llevar agua.", diff:"Difícil", terrain:"Camino rural, tierra", dur:300, elevV:false, indications:["Salir hacia la campiña.","Seguir caminos rurales.","Regresar con precaución."], photos:[] },
 r9: { name:"Camino de la Noria", cat:"natural", desc:"Ruta por el Camino de la Noria, entorno semiurbano y rural.", diff:"Fácil", terrain:"Camino asfaltado y tierra", dur:45, elevV:false, indications:["Seguir el Camino de la Noria.","Volver al punto de salida."], photos:[] },
 r10:{ name:"Camino de la Puente", cat:"natural", desc:"Recorrido hacia el entorno del Puente Internacional del Guadiana.", diff:"Moderada", terrain:"Carretera y camino", dur:180, elevV:false, indications:["Dirigirse hacia el puente.","Regresar por el mismo itinerario."], photos:[] },
 r11:{ name:"Valdecerros", cat:"natural", desc:"Ruta hacia la zona de Valdecerros, entorno natural y rural.", diff:"Difícil", terrain:"Camino rural", dur:310, elevV:false, indications:["Salir hacia Valdecerros.","Regresar con precaución."], photos:[] },
 r12:{ name:"Vera Abajo", cat:"natural", desc:"Ruta hacia la zona de Vera Abajo y entorno natural.", diff:"Moderada", terrain:"Camino y sendero", dur:150, elevV:false, indications:["Seguir hacia Vera Abajo.","Regresar al punto de salida."], photos:[] },
 r13:{ name:"Vía Verde del Litoral", cat:"natural", desc:"Recorrido por la Vía Verde del Litoral, antigua vía ferroviaria reconvertida en sendero.", diff:"Moderada", terrain:"Vía verde, firme compacto", dur:90, elevV:false, startPoint:[37.2188812,-7.3762292], indications:["Acceder a la Vía Verde.","Seguir el trazado lineal.","Regresar."], photos:[] },
 r14:{ name:"Caminos y senderos de los alrededores de Ayamonte", cat:"natural", desc:"Gran ruta circular por los caminos y senderos del entorno de Ayamonte.", diff:"Difícil", terrain:"Mixto", dur:420, elevV:false, indications:["Seguir el itinerario circular.","Llevar provisión de agua."], photos:[] },
};

const START = [37.2169243, -7.3973623];

let ts = `import type { Route } from "../types";\n\nexport const START_POINT: [number, number] = [${START[0]}, ${START[1]}];\n\nexport const routes: Route[] = [\n`;
for (const id of Object.keys(meta)) {
  const m = meta[id];
  const r = res[id];
  const distKm = r ? (r.distance/1000) : undefined;
  const geom = r ? r.geometry : [];
  const verified = !!r;
  ts += `  {\n`;
  ts += `    id: "${id}",\n`;
  ts += `    name: ${JSON.stringify(m.name)},\n`;
  ts += `    category: "${m.cat}",\n`;
  ts += `    description: ${JSON.stringify(m.desc)},\n`;
  ts += `    difficulty: "${m.diff}",\n`;
  ts += `    terrain: ${JSON.stringify(m.terrain)},\n`;
  ts += `    estimatedDurationMin: ${m.dur},\n`;
  ts += `    elevationGainM: undefined,\n`;
  ts += `    elevationVerified: false,\n`;
  ts += `    distanceKm: ${distKm !== undefined ? distKm.toFixed(3) : "undefined"},\n`;
  ts += `    distanceVerified: ${verified},\n`;
  const sp = m.startPoint || START;
  ts += `    startPoint: [${sp[0]}, ${sp[1]}],\n`;
  ts += `    waypoints: ${JSON.stringify(m.wps || [])},\n`.replace("undefined", "[]");
  // waypoints not in meta; use empty
  ts += `    geometry: ${JSON.stringify(geom)},\n`;
  const ind = (r && Array.isArray(r.streets) && r.streets.length) ? r.streets : m.indications;
  ts += `    indications: ${JSON.stringify(ind)},\n`;
  ts += `    photos: [],\n`;
  ts += `    verified: ${verified},\n`;
  ts += `  },\n`;
}
ts += `];\n`;

// fix waypoints: put START + maybe; we didn't store wps in meta. Set waypoints to [] to avoid huge; geometry already there.
ts = ts.replace(/    waypoints: \[\],\n/, "    waypoints: [],\n");

writeFileSync("src/data/routes.ts", ts);
console.log("written");
