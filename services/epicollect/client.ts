export type EpicollectFetchResult = {
  entries: any[];
  pages: number;
  requestedUrls: string[];
  firstUrl: string;
  lastUrl: string;
  perPage: number;
  retries: number;
  rateLimitWaitMs: number;
};

export type EpicollectFetchOptions = {
  perPage?: number;
  maxPages?: number;
  pageDelayMs?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
};

const globalRateState = globalThis as typeof globalThis & {
  __psoreEpicollectNextRequestAt?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleRequests(minDelayMs: number) {
  const now = Date.now();
  const nextAt = globalRateState.__psoreEpicollectNextRequestAt || 0;
  if (nextAt > now) await sleep(nextAt - now);
  globalRateState.__psoreEpicollectNextRequestAt = Date.now() + minDelayMs;
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const when = Date.parse(value);
  if (Number.isFinite(when)) return Math.max(0, when - Date.now());
  return null;
}

function jitter(ms: number) {
  return ms + Math.floor(Math.random() * Math.max(250, Math.round(ms * 0.2)));
}

function asAbsoluteUrl(value: string, base: URL) {
  return value.startsWith("http") ? value : new URL(value, base.origin).toString();
}

function nextFromPayload(payload: any) {
  const meta = payload?.meta || payload?.data?.meta || {};
  const links = payload?.links || payload?.data?.links || {};
  return links?.next || meta?.next || meta?.next_page_url || payload?.next_page_url || payload?.next || null;
}

function pageInfo(payload: any) {
  const meta = payload?.meta || payload?.data?.meta || {};
  return {
    current: Number(meta?.current_page || payload?.current_page || 0),
    last: Number(meta?.last_page || payload?.last_page || 0),
  };
}

function isEntriesLimitError(status: number, body: string) {
  const normalized = body.toLowerCase();
  return status === 400 && (
    normalized.includes("ec5_335") ||
    normalized.includes("max allowed entries limit exceeded") ||
    normalized.includes("lower `per_page`") ||
    normalized.includes("lower per_page")
  );
}

function isRateLimitError(status: number, body: string) {
  const normalized = body.toLowerCase();
  return status === 429 || normalized.includes("ec5_255") || normalized.includes("too many requests");
}

function isTransientServerError(status: number) {
  return status === 408 || status === 425 || status === 500 || status === 502 || status === 503 || status === 504;
}

function buildPerPageCandidates(requested: number) {
  const candidates = [requested, 50, 25, 20, 10, 5]
    .map((value) => Math.max(1, Math.min(100, Math.trunc(value))))
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => b - a);
  return candidates.filter((value) => value <= requested);
}

type PageFetchStats = { retries: number; rateLimitWaitMs: number };

async function fetchWithRetry(
  requestUrl: string,
  options: Required<Pick<EpicollectFetchOptions, "pageDelayMs" | "maxRetries" | "baseRetryDelayMs" | "maxRetryDelayMs">>,
  stats: PageFetchStats
) {
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    await throttleRequests(options.pageDelayMs);
    const response = await fetch(requestUrl, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "PSORE-Epicollect-Synchronizer/2.4.4" },
    });

    if (response.ok) return response;

    const text = await response.text().catch(() => "");
    const lastError = `Epicollect API error ${response.status}: ${response.statusText}${text ? ` - ${text.slice(0, 500)}` : ""}`;
    const retryable = isRateLimitError(response.status, text) || isTransientServerError(response.status);
    if (!retryable || attempt >= options.maxRetries) {
      if (isRateLimitError(response.status, text)) {
        throw new Error(`${lastError}. Limite temporaire Epicollect5 atteinte. Attendez quelques minutes avant une nouvelle synchronisation.`);
      }
      throw new Error(lastError);
    }

    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
    const exponential = Math.min(options.maxRetryDelayMs, options.baseRetryDelayMs * 2 ** attempt);
    const waitMs = jitter(Math.max(retryAfterMs || 0, exponential));
    stats.retries += 1;
    stats.rateLimitWaitMs += waitMs;
    await sleep(waitMs);
  }

  throw new Error("Échec inattendu de la requête Epicollect5.");
}

async function fetchPageWithAdaptiveLimit(
  url: URL,
  requestedPerPage: number,
  options: Required<Pick<EpicollectFetchOptions, "pageDelayMs" | "maxRetries" | "baseRetryDelayMs" | "maxRetryDelayMs">>,
  stats: PageFetchStats
) {
  const candidates = buildPerPageCandidates(requestedPerPage);
  let lastError = "";

  for (const perPage of candidates) {
    const requestUrl = new URL(url.toString());
    requestUrl.searchParams.set("per_page", String(perPage));

    try {
      const response = await fetchWithRetry(requestUrl.toString(), options, stats);
      return { payload: await response.json(), requestUrl: requestUrl.toString(), perPage };
    } catch (error: any) {
      lastError = error?.message || String(error);
      if (!lastError.toLowerCase().includes("ec5_335") && !lastError.toLowerCase().includes("max allowed entries limit exceeded")) {
        throw error;
      }
    }
  }

  throw new Error(`${lastError || "Epicollect refuse la taille de page."} La synchronisation a essayé automatiquement per_page=50, 25, 20, 10 et 5.`);
}

export async function fetchEpicollectEntries(
  url: string,
  options: EpicollectFetchOptions = {}
): Promise<EpicollectFetchResult> {
  if (!url) throw new Error("URL Epicollect manquante");

  let effectivePerPage = Math.max(1, Math.min(options.perPage || 20, 100));
  const maxPages = options.maxPages || 1000;
  const retryOptions = {
    pageDelayMs: Math.max(500, options.pageDelayMs ?? 1500),
    maxRetries: Math.max(0, options.maxRetries ?? 4),
    baseRetryDelayMs: Math.max(1000, options.baseRetryDelayMs ?? 10_000),
    maxRetryDelayMs: Math.max(5000, options.maxRetryDelayMs ?? 60_000),
  };
  const entries: any[] = [];
  const requestedUrls: string[] = [];
  const seen = new Set<string>();
  const stats: PageFetchStats = { retries: 0, rateLimitWaitMs: 0 };
  let next: string | null = url;
  let pageCounter = 0;
  let lastUrl = url;

  while (next && pageCounter < maxPages) {
    const u = new URL(next);
    if (!u.searchParams.has("page") && pageCounter > 0) u.searchParams.set("page", String(pageCounter + 1));

    const seenUrl = new URL(u.toString());
    seenUrl.searchParams.delete("per_page");
    const seenKey = seenUrl.toString();
    if (seen.has(seenKey)) break;
    seen.add(seenKey);

    const page = await fetchPageWithAdaptiveLimit(u, effectivePerPage, retryOptions, stats);
    effectivePerPage = page.perPage;
    requestedUrls.push(page.requestUrl);
    lastUrl = page.requestUrl;
    pageCounter++;

    const payload = page.payload;
    const pageEntries = extractEntries(payload);
    entries.push(...pageEntries);

    const payloadNext = nextFromPayload(payload);
    if (payloadNext) {
      const nextUrl = new URL(asAbsoluteUrl(String(payloadNext), u));
      nextUrl.searchParams.set("per_page", String(effectivePerPage));
      next = nextUrl.toString();
      continue;
    }

    const { current, last } = pageInfo(payload);
    if (last && current && current < last) {
      u.searchParams.set("page", String(current + 1));
      u.searchParams.set("per_page", String(effectivePerPage));
      next = u.toString();
      continue;
    }

    if (pageEntries.length >= effectivePerPage) {
      u.searchParams.set("page", String(pageCounter + 1));
      u.searchParams.set("per_page", String(effectivePerPage));
      next = u.toString();
      continue;
    }

    next = null;
  }

  if (pageCounter >= maxPages && next) throw new Error(`Synchronisation arrêtée : limite de ${maxPages} pages atteinte.`);

  return {
    entries,
    pages: pageCounter,
    requestedUrls,
    firstUrl: requestedUrls[0] || url,
    lastUrl,
    perPage: effectivePerPage,
    retries: stats.retries,
    rateLimitWaitMs: stats.rateLimitWaitMs,
  };
}

export function extractEntries(p:any):any[]{if(Array.isArray(p?.data?.entries))return p.data.entries;if(Array.isArray(p?.entries))return p.entries;if(Array.isArray(p?.data))return p.data;if(Array.isArray(p))return p;let out:any[]=[];function walk(v:any){if(!v||typeof v!=="object")return;if(Array.isArray(v)){if(v.some(x=>x&&typeof x==="object"&&(x.ec5_uuid||x.uuid||x.id||x.created_at||x.answers||x.title))){out.push(...v.filter(x=>x&&typeof x==="object"));return}v.forEach(walk);return}Object.values(v).forEach(walk)}walk(p);return out}
export function unwrapAnswer(v:any):any{if(v&&typeof v==="object"){if(v.answer!==undefined)return unwrapAnswer(v.answer);if(v.value!==undefined)return unwrapAnswer(v.value);if(v.name!==undefined)return unwrapAnswer(v.name)}return v}
export function norm(k:string){return String(k||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
export function getValue(e:any,labels:string[]){const wanted=labels.map(norm);let res:any=null;function scan(v:any){if(res!==null||!v||typeof v!=="object")return;if(Array.isArray(v)){v.forEach(scan);return}for(const [k,val] of Object.entries(v)){if(wanted.includes(norm(k))){res=unwrapAnswer(val);return}scan(val)}}scan(e);return res}
export function safeNumber(v:any){if(v===null||v===undefined||v==="")return null;if(typeof v==="number")return Number.isFinite(v)?v:null;const m=String(v).replace(",",".").match(/-?\d+(\.\d+)?/);if(!m)return null;const n=Number(m[0]);return Number.isFinite(n)?n:null}
export function parseLocation(v:any){v=unwrapAnswer(v);if(!v)return{latitude:null,longitude:null};if(typeof v==="object"){let lat=safeNumber(v.latitude??v.lat??v.y??v.Latitude??v.LATITUDE),lon=safeNumber(v.longitude??v.lng??v.lon??v.x??v.Longitude??v.LONGITUDE);if(lat!==null&&lon!==null)return{latitude:lat,longitude:lon};if(Array.isArray(v.coordinates)&&v.coordinates.length>=2)return{latitude:safeNumber(v.coordinates[1]),longitude:safeNumber(v.coordinates[0])}}if(typeof v==="string"){const nums=v.replace(/[;|]/g," ").split(/[ ,]+/).map(Number).filter(n=>!Number.isNaN(n));if(nums.length>=2){const a=nums[0],b=nums[1];return Math.abs(a)<=25?{latitude:a,longitude:b}:{latitude:b,longitude:a}}}return{latitude:null,longitude:null}}
export function findLocation(e:any){let loc=parseLocation(getValue(e,["Coordonnées GPS","Coordonnees GPS","Coordonnées infrastructures","Coordonnees infrastructures","10_Coordonnes_infras","GPS","Geolocalisation","Géolocalisation","Localisation GPS","Point GPS","location","coordinates","Latitude Longitude"]));if(loc.latitude!==null&&loc.longitude!==null)return loc;loc={latitude:safeNumber(getValue(e,["Latitude","lat","Y","lat_10_Coordonnes_infras"])),longitude:safeNumber(getValue(e,["Longitude","long","lng","lon","X","long_10_Coordonnes_infras"]))};if(loc.latitude!==null&&loc.longitude!==null)return loc;let found:any={latitude:null,longitude:null};function walk(v:any){if(found.latitude!==null&&found.longitude!==null)return;if(!v||typeof v!=="object")return;const p=parseLocation(v);if(p.latitude!==null&&p.longitude!==null){found=p;return}Array.isArray(v)?v.forEach(walk):Object.values(v).forEach(walk)}walk(e);return found}
export function sourceId(e:any){return e?.ec5_uuid||e?.uuid||e?.id||e?._id||e?.created_at||JSON.stringify(e).slice(0,120)}
