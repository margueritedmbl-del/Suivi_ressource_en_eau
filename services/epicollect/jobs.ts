import { getActiveEpicollectSources, getEpicollectSource, withChildParentRef } from "@/services/epicollect/sources";
import { syncTable, type SyncResult } from "@/services/epicollect/syncTable";
import { mapPluvioStation, mapPluvioObservation } from "@/services/mappers/pluviometrie";
import { mapPiezometre, mapPiezoObservation } from "@/services/mappers/piezometrie";
import { mapLimniStation, mapLimniObservation } from "@/services/mappers/limnimetrie";
import { mapPointEau } from "@/services/mappers/points-eau";

const TARGETS: Record<string, { table: string; mapper: (entry: any) => any }> = {
  "pluviometrie:stations": { table: "stations_pluvio", mapper: mapPluvioStation },
  "pluviometrie:releves": { table: "observations_pluvio", mapper: mapPluvioObservation },
  "piezometrie:referentiel": { table: "piezometres", mapper: mapPiezometre },
  "piezometrie:mesures": { table: "observations_piezo", mapper: mapPiezoObservation },
  "limnimetrie:stations": { table: "stations_limni", mapper: mapLimniStation },
  "limnimetrie:lectures": { table: "observations_limni", mapper: mapLimniObservation },
  "points_eau:inventaire": { table: "points_eau", mapper: mapPointEau },
};

const globalSyncState = globalThis as typeof globalThis & { __psoreSyncLocks?: Set<string> };
const syncLocks = globalSyncState.__psoreSyncLocks || (globalSyncState.__psoreSyncLocks = new Set<string>());

function targetKey(module: string, typeSource: string) {
  return `${module}:${typeSource}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withSyncLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  if (syncLocks.has("all") || syncLocks.has(key) || (key === "all" && syncLocks.size > 0)) {
    throw new Error("Une synchronisation est déjà en cours. Attendez sa fin avant de relancer.");
  }
  syncLocks.add(key);
  try {
    return await task();
  } finally {
    syncLocks.delete(key);
  }
}

export async function syncOne(module: string, typeSource: string, options: { full?: boolean } = {}): Promise<SyncResult> {
  return withSyncLock(targetKey(module, typeSource), async () => {
    const moduleSources = await getActiveEpicollectSources(module);
    const rawSource = await getEpicollectSource(module, typeSource);
    const source = withChildParentRef(rawSource, moduleSources);
    const target = TARGETS[targetKey(source.module, source.type_source)];
    if (!target) throw new Error(`Aucun mapper configuré pour ${source.module}/${source.type_source}`);
    return syncTable(source, target.table, target.mapper, options);
  });
}

export async function syncModule(module: string, options: { full?: boolean } = {}): Promise<SyncResult[]> {
  return withSyncLock(module, async () => {
    const rawSources = await getActiveEpicollectSources(module);
    const moduleOrder: Record<string,string[]> = {
      pluviometrie:["stations","releves"],
      piezometrie:["referentiel","mesures"],
      limnimetrie:["stations","lectures"],
      points_eau:["inventaire"],
    };
    const order = moduleOrder[module] || [];
    const sources = [...rawSources].sort((a,b)=>order.indexOf(a.type_source)-order.indexOf(b.type_source)).map(s=>withChildParentRef(s, rawSources));
    const results: SyncResult[] = [];
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index];
      const target = TARGETS[targetKey(source.module, source.type_source)];
      if (!target) continue;
      if (index > 0) await sleep(3000);
      results.push(await syncTable(source, target.table, target.mapper, options));
    }
    return results;
  });
}

export async function syncAll(options: { full?: boolean } = {}): Promise<SyncResult[]> {
  return withSyncLock("all", async () => {
    const sources = await getActiveEpicollectSources();
    const order = [
      "pluviometrie:stations",
      "pluviometrie:releves",
      "piezometrie:referentiel",
      "piezometrie:mesures",
      "limnimetrie:stations",
      "limnimetrie:lectures",
      "points_eau:inventaire",
    ];
    const sorted = [...sources].sort((a, b) => order.indexOf(targetKey(a.module, a.type_source)) - order.indexOf(targetKey(b.module, b.type_source))).map((s)=>withChildParentRef(s, sources.filter(x=>x.module===s.module)));
    const results: SyncResult[] = [];
    for (let index = 0; index < sorted.length; index++) {
      const source = sorted[index];
      const target = TARGETS[targetKey(source.module, source.type_source)];
      if (!target) continue;
      if (index > 0) await sleep(5000);
      results.push(await syncTable(source, target.table, target.mapper, options));
    }
    return results;
  });
}
