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

export type MappedChunk = {
  target: ManualImportTarget;
  mappedRows: Record<string, any>[];
  mapped: number;
  skipped: number;
  warnings: string[];
  errors: string[];
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

export function getManualImportTarget(targetKey: string) {
  return MANUAL_IMPORT_TARGETS.find((item) => item.key === targetKey) || null;
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

function cleanMappedRow(input: Record<string, any>) {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    if (typeof value === "number" && !Number.isFinite(value)) {
      output[key] = null;
      continue;
    }
    output[key] = value;
  }
  return output;
}

function errorMessage(error: any) {
  return String(error?.message || error?.details || error?.hint || "erreur Supabase");
}

export function mapManualRows(targetKey: string, rows: Record<string, any>[], baseIndex = 0): MappedChunk {
  const target = getManualImportTarget(targetKey);
  if (!target) throw new Error("Type de données non reconnu.");

  const warnings: string[] = [];
  const errors: string[] = [];
  const mappedRows: Record<string, any>[] = [];
  let skipped = 0;

  for (let index = 0; index < rows.length; index++) {
    const source = { ...rows[index] };
    const lineNumber = baseIndex + index + 2;
    if (!source.ec5_uuid && !source.uuid && !source.id && !source.source_entry_id) {
      source.ec5_uuid = stableRowId(target.key, source);
      if (warnings.length < 10) warnings.push(`Ligne ${lineNumber} : identifiant Epicollect absent, identifiant stable généré.`);
    }
    try {
      const mapped = cleanMappedRow(target.mapper(source));
      if (!mapped?.source_entry_id) {
        skipped++;
        if (errors.length < 30) errors.push(`Ligne ${lineNumber} ignorée : identifiant source manquant.`);
        continue;
      }
      mappedRows.push(mapped);
    } catch (error: any) {
      skipped++;
      if (errors.length < 30) errors.push(`Ligne ${lineNumber} non mappée : ${error?.message || "erreur inconnue"}.`);
    }
  }

  return { target, mappedRows, mapped: mappedRows.length, skipped, warnings, errors };
}

async function upsertBatchAdaptive(
  target: ManualImportTarget,
  rows: Record<string, any>[],
  baseIndex: number,
  errors: string[],
): Promise<{ ok: number; failed: number }> {
  if (!rows.length) return { ok: 0, failed: 0 };

  const attempt = await supabaseAdmin
    .from(target.table)
    .upsert(rows, { onConflict: "source_entry_id", ignoreDuplicates: false });

  if (!attempt.error) return { ok: rows.length, failed: 0 };

  if (rows.length > 1) {
    const middle = Math.ceil(rows.length / 2);
    const left = await upsertBatchAdaptive(target, rows.slice(0, middle), baseIndex, errors);
    const right = await upsertBatchAdaptive(target, rows.slice(middle), baseIndex + middle, errors);
    return { ok: left.ok + right.ok, failed: left.failed + right.failed };
  }

  if (target.naturalKey && rows[0][target.naturalKey]) {
    const naturalAttempt = await supabaseAdmin
      .from(target.table)
      .upsert(rows[0], { onConflict: target.naturalKey, ignoreDuplicates: false });
    if (!naturalAttempt.error) return { ok: 1, failed: 0 };
  }

  if (errors.length < 40) errors.push(`Ligne ${baseIndex + 2} non intégrée : ${errorMessage(attempt.error)}.`);
  return { ok: 0, failed: 1 };
}

export async function upsertManualRows(target: ManualImportTarget, rows: Record<string, any>[], baseIndex = 0) {
  const errors: string[] = [];
  const outcome = await upsertBatchAdaptive(target, rows, baseIndex, errors);
  return { ...outcome, errors };
}

export async function writeImportLog(result: ManualImportResult, userEmail: string) {
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

// Conservé pour les petits fichiers et la compatibilité avec les anciennes routes.
export async function importManualFile(args: {
  targetKey: string;
  buffer: Buffer;
  filename: string;
  userEmail: string;
}): Promise<ManualImportResult> {
  const started = Date.now();
  const parsed = parseWorkbook(args.buffer, args.filename);
  const mapped = mapManualRows(args.targetKey, parsed.rows, 0);
  const outcome = await upsertManualRows(mapped.target, mapped.mappedRows, 0);

  const result: ManualImportResult = {
    target: mapped.target.key,
    module: mapped.target.module,
    source: mapped.target.source,
    table: mapped.target.table,
    filename: args.filename,
    sheet: parsed.sheetName,
    read: parsed.rows.length,
    mapped: mapped.mapped,
    skipped: mapped.skipped,
    insertedOrUpdated: outcome.ok,
    failed: outcome.failed,
    warnings: mapped.warnings,
    errors: [...mapped.errors, ...outcome.errors],
    durationMs: Date.now() - started,
  };

  await writeImportLog(result, args.userEmail);
  return result;
}
