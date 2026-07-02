export type EpicollectFetchResult = {
  entries: any[];
  pages: number;
  requestedUrls: string[];
  firstUrl: string;
  lastUrl: string;
};

export type EpicollectFetchOptions = {
  perPage?: number;
  maxPages?: number;
};

function asAbsoluteUrl(value: string, base: URL) {
  return value.startsWith("http") ? value : new URL(value, base.origin).toString();
}

function nextFromPayload(payload: any) {
  const meta = payload?.meta || payload?.data?.meta || {};
  const links = payload?.links || payload?.data?.links || {};
  return (
    links?.next ||
    meta?.next ||
    meta?.next_page_url ||
    payload?.next_page_url ||
    payload?.next ||
    null
  );
}

function pageInfo(payload: any) {
  const meta = payload?.meta || payload?.data?.meta || {};
  return {
    current: Number(meta?.current_page || payload?.current_page || 0),
    last: Number(meta?.last_page || payload?.last_page || 0),
  };
}

export async function fetchEpicollectEntries(
  url: string,
  options: EpicollectFetchOptions = {}
): Promise<EpicollectFetchResult> {
  if (!url) throw new Error("URL Epicollect manquante");

  const perPage = options.perPage || 1000;
  const maxPages = options.maxPages || 500;
  const entries: any[] = [];
  const requestedUrls: string[] = [];
  const seen = new Set<string>();
  let next: string | null = url;
  let pageCounter = 0;
  let lastUrl = url;

  while (next && pageCounter < maxPages && !seen.has(next)) {
    const u = new URL(next);
    if (!u.searchParams.has("per_page")) u.searchParams.set("per_page", String(perPage));
    if (!u.searchParams.has("page") && pageCounter > 0) u.searchParams.set("page", String(pageCounter + 1));

    const requestUrl = u.toString();
    seen.add(next);
    seen.add(requestUrl);
    requestedUrls.push(requestUrl);
    lastUrl = requestUrl;
    pageCounter++;

    const response = await fetch(requestUrl, { cache: "no-store" });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Epicollect API error ${response.status}: ${response.statusText}${text ? ` - ${text.slice(0, 250)}` : ""}`);
    }

    const payload = await response.json();
    const pageEntries = extractEntries(payload);
    entries.push(...pageEntries);

    const payloadNext = nextFromPayload(payload);
    if (payloadNext) {
      next = asAbsoluteUrl(String(payloadNext), u);
      continue;
    }

    const { current, last } = pageInfo(payload);
    if (last && current && current < last) {
      u.searchParams.set("page", String(current + 1));
      next = u.toString();
      continue;
    }

    // Fallback for APIs that omit pagination metadata but return a full page.
    if (pageEntries.length >= perPage) {
      u.searchParams.set("page", String(pageCounter + 1));
      next = u.toString();
      continue;
    }

    next = null;
  }

  if (pageCounter >= maxPages && next) {
    throw new Error(`Synchronisation arrêtée : limite de ${maxPages} pages atteinte.`);
  }

  return { entries, pages: pageCounter, requestedUrls, firstUrl: requestedUrls[0] || url, lastUrl };
}

export function extractEntries(p:any):any[]{if(Array.isArray(p?.data?.entries))return p.data.entries;if(Array.isArray(p?.entries))return p.entries;if(Array.isArray(p?.data))return p.data;if(Array.isArray(p))return p;let out:any[]=[];function walk(v:any){if(!v||typeof v!=="object")return;if(Array.isArray(v)){if(v.some(x=>x&&typeof x==="object"&&(x.ec5_uuid||x.uuid||x.id||x.created_at||x.answers||x.title))){out.push(...v.filter(x=>x&&typeof x==="object"));return}v.forEach(walk);return}Object.values(v).forEach(walk)}walk(p);return out}
export function unwrapAnswer(v:any):any{if(v&&typeof v==="object"){if(v.answer!==undefined)return unwrapAnswer(v.answer);if(v.value!==undefined)return unwrapAnswer(v.value);if(v.name!==undefined)return unwrapAnswer(v.name)}return v}
export function norm(k:string){return String(k||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
export function getValue(e:any,labels:string[]){const wanted=labels.map(norm);let res:any=null;function scan(v:any){if(res!==null||!v||typeof v!=="object")return;if(Array.isArray(v)){v.forEach(scan);return}for(const [k,val] of Object.entries(v)){if(wanted.includes(norm(k))){res=unwrapAnswer(val);return}scan(val)}}scan(e);return res}
export function safeNumber(v:any){if(v===null||v===undefined||v==="")return null;if(typeof v==="number")return Number.isFinite(v)?v:null;const m=String(v).replace(",",".").match(/-?\d+(\.\d+)?/);if(!m)return null;const n=Number(m[0]);return Number.isFinite(n)?n:null}
export function parseLocation(v:any){v=unwrapAnswer(v);if(!v)return{latitude:null,longitude:null};if(typeof v==="object"){let lat=safeNumber(v.latitude??v.lat??v.y??v.Latitude??v.LATITUDE),lon=safeNumber(v.longitude??v.lng??v.lon??v.x??v.Longitude??v.LONGITUDE);if(lat!==null&&lon!==null)return{latitude:lat,longitude:lon};if(Array.isArray(v.coordinates)&&v.coordinates.length>=2)return{latitude:safeNumber(v.coordinates[1]),longitude:safeNumber(v.coordinates[0])}}if(typeof v==="string"){const nums=v.replace(/[;|]/g," ").split(/[ ,]+/).map(Number).filter(n=>!Number.isNaN(n));if(nums.length>=2){const a=nums[0],b=nums[1];return Math.abs(a)<=25?{latitude:a,longitude:b}:{latitude:b,longitude:a}}}return{latitude:null,longitude:null}}
export function findLocation(e:any){let loc=parseLocation(getValue(e,["Coordonnées GPS","Coordonnees GPS","Coordonnées infrastructures","Coordonnees infrastructures","10_Coordonnes_infras","GPS","Geolocalisation","Géolocalisation","Localisation GPS","Point GPS","location","coordinates","Latitude Longitude"]));if(loc.latitude!==null&&loc.longitude!==null)return loc;loc={latitude:safeNumber(getValue(e,["Latitude","lat","Y","lat_10_Coordonnes_infras"])),longitude:safeNumber(getValue(e,["Longitude","long","lng","lon","X","long_10_Coordonnes_infras"]))};if(loc.latitude!==null&&loc.longitude!==null)return loc;let found:any={latitude:null,longitude:null};function walk(v:any){if(found.latitude!==null&&found.longitude!==null)return;if(!v||typeof v!=="object")return;const p=parseLocation(v);if(p.latitude!==null&&p.longitude!==null){found=p;return}Array.isArray(v)?v.forEach(walk):Object.values(v).forEach(walk)}walk(e);return found}
export function sourceId(e:any){return e?.ec5_uuid||e?.uuid||e?.id||e?._id||e?.created_at||JSON.stringify(e).slice(0,120)}
