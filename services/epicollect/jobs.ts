import { getActiveEpicollectSources, getEpicollectSource } from "@/services/epicollect/sources";
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

function targetKey(module: string, typeSource: string) {
  return `${module}:${typeSource}`;
}

export async function syncOne(module: string, typeSource: string): Promise<SyncResult> {
  const source = await getEpicollectSource(module, typeSource);
  const target = TARGETS[targetKey(source.module, source.type_source)];
  if (!target) throw new Error(`Aucun mapper configuré pour ${source.module}/${source.type_source}`);
  return syncTable(source, target.table, target.mapper);
}

export async function syncModule(module: string): Promise<SyncResult[]> {
  const sources = await getActiveEpicollectSources(module);
  const results: SyncResult[] = [];
  for (const source of sources) {
    const target = TARGETS[targetKey(source.module, source.type_source)];
    if (!target) continue;
    results.push(await syncTable(source, target.table, target.mapper));
  }
  return results;
}

export async function syncAll(): Promise<SyncResult[]> {
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
  const sorted = [...sources].sort((a, b) => order.indexOf(targetKey(a.module, a.type_source)) - order.indexOf(targetKey(b.module, b.type_source)));
  const results: SyncResult[] = [];
  for (const source of sorted) {
    const target = TARGETS[targetKey(source.module, source.type_source)];
    if (!target) continue;
    results.push(await syncTable(source, target.table, target.mapper));
  }
  return results;
}
