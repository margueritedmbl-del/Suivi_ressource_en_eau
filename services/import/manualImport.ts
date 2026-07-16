import { createHash } from "node:crypto";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapPluvioStation, mapPluvioObservation } from "@/services/mappers/pluviometrie";
import { mapPiezometre, mapPiezoObservation } from "@/services/mappers/piezometrie";
import { mapLimniStation, mapLimniObservation } from "@/services/mappers/limnimetrie";
import { mapPointEau } from "@/services/mappers/points-eau";

export type ManualImportTarget = {
  key: string;
  module: string;
  source: string;
  label: string;
  table: string;
  mapper: (entry: any) => any;
  naturalKey?: string;
};

export const MANUAL_IMPORT_TARGETS: ManualImportTarget[] = [
  { key: "points_eau:inventaire", module: "points_eau", source: "inventaire", label: "Points d’eau — inventaire", table: "points_eau", mapper: mapPointEau, naturalKey: "code_pe" },
  { key: "pluviometrie:stations", module: "pluviometrie", source: "stations", label: "Pluviométrie — référentiel des stations", table: "stations_pluvio", mapper: mapPluvioStation, naturalKey: "code_station" },
  { key: "pluviometrie:releves", module: "pluviometrie", source: "releves", label: "Pluviométrie — relevés", table: "observations_pluvio", mapper: mapPluvioObservation },
  { key: "piezometrie:referentiel", module: "piezometrie", source: "referentiel", label: "Piézométrie — référentiel", table: "piezometres", mapper: mapPiezometre, naturalKey: "code_piezo" },
  { key: "piezometrie:mesures", module: "piezometrie", source: "mesures", label: "Piézométrie — campagnes de mesures", table: "observations_piezo", mapper: mapPiezoObservation },
  { key: "limnimetrie:stations", module: "limnimetrie", source: "stations", label: "Limnimétrie — stations", table: "stations_limni", mapper: mapLimniStation, naturalKey: "code_station" },
  { key: "limnimetrie:lectures", module: "limnimetrie", source: "lectures", label: "Limnimétrie — lectures", table: "observations_limni", mapper: mapLimniObservation },
];

export type ManualImportResult = {
  target: string;
  module: string;
  source: string;
  table: string;
  filename: string;
  sheet: string;
  read: number;
  mapped: number;
  skipped: number;
  insertedOrUpdated: number;
  failed: number;
  warnings: string[];
  errors: string[];
  durationMs: number;
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function normalizeRow(input: Record<string, any>) {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    const cleanKey = normalizeHeader(key);
    if (!cleanKey) continue;
    output[cleanKey] = typeof value === "string" ? value.trim() : value;
  }
  return output;
}

function isBlankRow(row: Record<string, any>) {
  return !Object.values(row).some((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

function stableRowId(targetKey: string, row: Record<string, any>) {
  const existing = row.ec5_uuid || row.uuid || row._id || row.id || row.source_entry_id || row.created_at || row.createdAt;
  if (existing) return String(existing);
  const ordered = Object.keys(row).sort().reduce((acc, key) => {
    acc[key] = row[key];
    return acc;
  }, {} as Record<string, any>);
  return `manual_${createHash("sha256").update(`${targetKey}:${JSON.stringify(ordered)}`).digest("hex").slice(0, 40)}`;
}

export function parseWorkbook(buffer: Buffer, filename: string) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Le fichier ne contient aucune feuille exploitable.");
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null, raw: false });
  const rows = rawRows.map(normalizeRow).filter((row) => !isBlankRow(row));
  if (!rows.length) throw new Error("Le fichier ne contient aucun enregistrement.");
  return { rows, sheetName, filename };
}

async function upsertOne(target: ManualImportTarget, row: Record<string, any>) {
  const sourceId = String(row.source_entry_id || "").trim();
  if (sourceId) {
    const existing = await supabaseAdmin.from(target.table).select("id").eq("source_entry_id", sourceId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) {
      const updated = await supabaseAdmin.from(target.table).update(row).eq("id", existing.data.id);
      if (updated.error) throw updated.error;
      return;
    }
  }

  if (target.naturalKey && row[target.naturalKey]) {
    const existing = await supabaseAdmin.from(target.table).select("id").eq(target.naturalKey, row[target.naturalKey]).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) {
      const updated = await supabaseAdmin.from(target.table).update(row).eq("id", existing.data.id);
      if (updated.error) throw updated.error;
      return;
    }
  }

  const inserted = await supabaseAdmin.from(target.table).insert(row);
  if (inserted.error) throw inserted.error;
}

async function writeImportLog(result: ManualImportResult, userEmail: string) {
  const message = `Import manuel ${result.filename} : ${result.insertedOrUpdated}/${result.read} ligne(s) intégrée(s), ${result.skipped} ignorée(s), ${result.failed} erreur(s), feuille=${result.sheet}, utilisateur=${userEmail}.`;
  try {
    await supabaseAdmin.from("sync_log").insert({
      module: result.module,
      source: `import_manuel:${result.source}`,
      nb_enregistrements: result.insertedOrUpdated,
      statut: result.failed ? "warning" : "success",
      message,
      fetched_count: result.read,
      mapped_count: result.mapped,
      skipped_count: result.skipped,
      upserted_count: result.insertedOrUpdated,
      page_count: 1,
      duration_ms: result.durationMs,
      api_url: null,
    });
  } catch (_) {
    try {
      await supabaseAdmin.from("sync_log").insert({
        module: result.module,
        source: `import_manuel:${result.source}`,
        nb_enregistrements: result.insertedOrUpdated,
        statut: result.failed ? "warning" : "success",
        message,
      });
    } catch (_) {}
  }
}

export async function importManualFile(args: {
  targetKey: string;
  buffer: Buffer;
  filename: string;
  userEmail: string;
}): Promise<ManualImportResult> {
  const started = Date.now();
  const target = MANUAL_IMPORT_TARGETS.find((item) => item.key === args.targetKey);
  if (!target) throw new Error("Type de données non reconnu.");

  const parsed = parseWorkbook(args.buffer, args.filename);
  const warnings: string[] = [];
  const errors: string[] = [];
  const mappedRows: Record<string, any>[] = [];
  let skipped = 0;

  for (let index = 0; index < parsed.rows.length; index++) {
    const source = { ...parsed.rows[index] };
    if (!source.ec5_uuid && !source.uuid && !source.id && !source.source_entry_id) {
      source.ec5_uuid = stableRowId(target.key, source);
      if (warnings.length < 10) warnings.push(`Ligne ${index + 2} : identifiant Epicollect absent, identifiant stable généré.`);
    }
    try {
      const mapped = target.mapper(source);
      if (!mapped?.source_entry_id) {
        skipped++;
        if (errors.length < 30) errors.push(`Ligne ${index + 2} ignorée : identifiant source manquant.`);
        continue;
      }
      mappedRows.push(mapped);
    } catch (error: any) {
      skipped++;
      if (errors.length < 30) errors.push(`Ligne ${index + 2} non mappée : ${error?.message || "erreur inconnue"}.`);
    }
  }

  let insertedOrUpdated = 0;
  let failed = 0;
  const batchSize = 250;

  for (let offset = 0; offset < mappedRows.length; offset += batchSize) {
    const batch = mappedRows.slice(offset, offset + batchSize);
    const bulk = await supabaseAdmin.from(target.table).upsert(batch, { onConflict: "source_entry_id" });
    if (!bulk.error) {
      insertedOrUpdated += batch.length;
      continue;
    }

    // Repli ligne par ligne : traite également les conflits sur les codes métier uniques.
    for (let localIndex = 0; localIndex < batch.length; localIndex++) {
      try {
        await upsertOne(target, batch[localIndex]);
        insertedOrUpdated++;
      } catch (error: any) {
        failed++;
        const line = offset + localIndex + 2;
        if (errors.length < 30) errors.push(`Ligne ${line} non intégrée : ${error?.message || "erreur Supabase"}.`);
      }
    }
  }

  const result: ManualImportResult = {
    target: target.key,
    module: target.module,
    source: target.source,
    table: target.table,
    filename: args.filename,
    sheet: parsed.sheetName,
    read: parsed.rows.length,
    mapped: mappedRows.length,
    skipped,
    insertedOrUpdated,
    failed,
    warnings,
    errors,
    durationMs: Date.now() - started,
  };

  await writeImportLog(result, args.userEmail);
  return result;
}
