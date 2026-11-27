const START=[37.2169243,-7.3973623];
const parque=[37.2125895,-7.4034414];
const ayunt=[37.2143429,-7.4090158];
const ribera=[37.2126098,-7.4072998];
const noria=[37.2184970,-7.4050699];
const mirador=[37.2254285,-7.4082161];
const angustias=[37.2134377,-7.4092216];
const laVilla=[37.2209206,-7.4071236];
const combos = {
  a: [START,parque,ayunt,ribera,noria,START],
  b: [START,parque,ayunt,ribera,mirador,noria,START],
  c: [START,parque,ayunt,angustias,laVilla,mirador,noria,START],
  d: [START,parque,ayunt,ribera,angustias,laVilla,mirador,START],
};
async function dist(wps){const coords=wps.map(p=>p[1]+','+p[0]).join(';');const r=await fetch('https://routing.openstreetmap.de/routed-foot/route/v1/foot/'+coords+'?overview=false');const j=await r.json();return j.routes[0].distance;}
for (const [k,wps] of Object.entries(combos)){
  const d=await dist(wps); console.log(k,(d/1000).toFixed(2),'km'); await new Promise(r=>setTimeout(r,1200));
}