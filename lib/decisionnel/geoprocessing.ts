export type Position = [number, number];
export type Feature = { type: "Feature"; geometry: any; properties?: Record<string, any> };
export type FeatureCollection = { type: "FeatureCollection"; features: Feature[] };

const R = 6371.0088;
export function haversineKm(a: Position, b: Position) {
  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLon = (b[0] - a[0]) * Math.PI / 180;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function ringContains(point: Position, ring: number[][]) {
  let inside = false; const [x,y] = point;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    const hit=((yi>y)!==(yj>y)) && x < ((xj-xi)*(y-yi))/((yj-yi)||Number.EPSILON)+xi;
    if(hit) inside=!inside;
  }
  return inside;
}
export function pointInGeometry(point: Position, geometry: any) {
  if (!geometry) return false;
  const polygon = (rings:number[][][]) => ringContains(point,rings[0]) && !rings.slice(1).some(r=>ringContains(point,r));
  if (geometry.type === "Polygon") return polygon(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((p:number[][][])=>polygon(p));
  return false;
}
export function centroid(feature: Feature): Position {
  const g=feature.geometry;
  if(g?.type==="Point") return g.coordinates;
  const points: Position[]=[];
  const collect=(v:any)=>{ if(Array.isArray(v)&&typeof v[0]==="number"&&typeof v[1]==="number") points.push([v[0],v[1]]); else if(Array.isArray(v)) v.forEach(collect); };
  collect(g?.coordinates);
  if(!points.length) return [0,0];
  return [points.reduce((s,p)=>s+p[0],0)/points.length,points.reduce((s,p)=>s+p[1],0)/points.length];
}
export function pointsInside(features: Feature[], polygon: Feature) {
  return features.filter(f=>f.geometry?.type==="Point" && pointInGeometry(f.geometry.coordinates,polygon.geometry));
}
export function polygonsByCentroid(features: Feature[], polygon: Feature) {
  return features.filter(f=>pointInGeometry(centroid(f),polygon.geometry));
}
export function nearbyFeatures(origin: Feature, candidates: Feature[], radiusKm: number) {
  const c=centroid(origin);
  return candidates.map(f=>({feature:f,distanceKm:haversineKm(c,centroid(f))})).filter(x=>x.distanceKm<=radiusKm).sort((a,b)=>a.distanceKm-b.distanceKm);
}
export function countBy<T>(items:T[], key:(item:T)=>string) {
  const out:Record<string,number>={}; items.forEach(i=>{const k=key(i)||"Non renseigné";out[k]=(out[k]||0)+1;}); return out;
}
export function sumBy<T>(items:T[], value:(item:T)=>number) { return items.reduce((s,i)=>s+(Number(value(i))||0),0); }
export function linearTrend(values:Array<{date:string;value:number}>) {
  const clean=values.filter(v=>Number.isFinite(v.value)&&v.date).sort((a,b)=>a.date.localeCompare(b.date));
  if(clean.length<2) return {slope:null,delta:null,count:clean.length,classification:"Données insuffisantes"};
  const ys=clean.map(v=>v.value); const n=ys.length; const meanX=(n-1)/2; const meanY=ys.reduce((a,b)=>a+b,0)/n;
  let num=0,den=0; ys.forEach((y,x)=>{num+=(x-meanX)*(y-meanY);den+=(x-meanX)**2;});
  const slope=den?num/den:0; const delta=ys[n-1]-ys[0];
  // Pour une profondeur à l'eau, une pente négative indique généralement une remontée de nappe.
  const classification=slope < -0.02 ? "Amélioration" : slope > 0.02 ? "Dégradation" : "Stable";
  return {slope:Math.round(slope*1000)/1000,delta:Math.round(delta*100)/100,count:n,classification};
}
