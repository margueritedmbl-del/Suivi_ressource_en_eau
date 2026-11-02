export function toCsv(rows:Record<string,any>[]){
  if(!rows?.length)return "";
  const headers=Array.from(new Set(rows.flatMap(row=>Object.keys(row))));
  const esc=(v:any)=>`"${String(v??"").replaceAll('"','""')}"`;
  return [headers.map(esc).join(","),...rows.map(r=>headers.map(h=>esc(r[h])).join(","))].join("\n");
}
