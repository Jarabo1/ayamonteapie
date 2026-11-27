const START = [37.2169243, -7.3973623];
const variants = {
  r11: [[START, [37.225, -7.39], [37.222, -7.385], START], [START, [37.224, -7.388], [37.221, -7.383], START]],
  r13: [[START, [37.2185, -7.385], [37.2190, -7.378], START], [START, [37.218, -7.382], [37.2175, -7.379], START]],
  r7: [[START, [37.2126, -7.4034], [37.2143, -7.4090], [37.2254, -7.4082], [37.2185, -7.4051], START]],
};
async function dist(wps) {
  const coords = wps.map(p => `${p[1]},${p[0]}`).join(";");
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=false`;
  const res = await fetch(url);
  const json = await res.json();
  return json.routes[0].distance;
}
for (const [id, vs] of Object.entries(variants)) {
  for (const v of vs) {
    const d = await dist(v);
    console.log(id, (d/1000).toFixed(2), "km", JSON.stringify(v));
    await new Promise(r=>setTimeout(r,1200));
  }
}