import { supabaseAdmin } from "@/lib/supabase-admin";
import { getManualImportTarget, mapManualRows, parseWorkbook, upsertManualRows, writeImportLog, type ManualImportResult } from "@/services/import/manualImport";

export const IMPORT_BUCKET = "manual-imports";
export const IMPORT_CHUNK_SIZE = 20;

export type ImportJob = {
  id: string;
  user_id: string;
  user_email: string;
  target_key: string;
  module: string;
  source: string;
  table_name: string;
  filename: string;
  storage_path: string;
  sheet_name: string | null;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  total_rows: number;
  processed_rows: number;
  mapped_rows: number;
  skipped_rows: number;
  upserted_rows: number;
  failed_rows: number;
  warnings: string[];
  errors: string[];
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export async function ensureImportBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(IMPORT_BUCKET);
  if (data) return;
  const created = await supabaseAdmin.storage.createBucket(IMPORT_BUCKET, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ],
  });
  if (created.error && !String(created.error.message).toLowerCase().includes("already")) throw created.error;
}

export async function createImportJob(args: {
  userId: string;
  userEmail: string;
  targetKey: string;
  filename: string;
  buffer: Buffer;
  contentType?: string;
}) {
  const target = getManualImportTarget(args.targetKey);
  if (!target) throw new Error("Type de données non reconnu.");

  const parsed = parseWorkbook(args.buffer, args.filename);
  await ensureImportBucket();

  const safeName = args.filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
  const storagePath = `${args.userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const uploaded = await supabaseAdmin.storage.from(IMPORT_BUCKET).upload(storagePath, args.buffer, {
    contentType: args.contentType || "application/octet-stream",
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;

  const inserted = await supabaseAdmin.from("import_jobs").insert({
    user_id: args.userId,
    user_email: args.userEmail,
    target_key: target.key,
    module: target.module,
    source: target.source,
    table_name: target.table,
    filename: args.filename,
    storage_path: storagePath,
    sheet_name: parsed.sheetName,
    status: "queued",
    total_rows: parsed.rows.length,
    processed_rows: 0,
    mapped_rows: 0,
    skipped_rows: 0,
    upserted_rows: 0,
    failed_rows: 0,
    warnings: [],
    errors: [],
  }).select("*").single();

  if (inserted.error) {
    await supabaseAdmin.storage.from(IMPORT_BUCKET).remove([storagePath]);
    throw inserted.error;
  }
  return inserted.data as ImportJob;
}

export async function getImportJob(id: string) {
  const result = await supabaseAdmin.from("import_jobs").select("*").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  return result.data as ImportJob | null;
}

export async function listImportJobs(limit = 12) {
  const result = await supabaseAdmin.from("import_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (result.error) throw result.error;
  return (result.data || []) as ImportJob[];
}

function limitedMerge(existing: unknown, incoming: string[], max = 80) {
  const current = Array.isArray(existing) ? existing.map(String) : [];
  return [...current, ...incoming].slice(-max);
}

export async function processImportJobChunk(job: ImportJob) {
  if (["completed", "completed_with_errors", "failed"].includes(job.status)) return job;

  const claimed = await supabaseAdmin.from("import_jobs").update({
    status: "processing",
    started_at: job.started_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", job.id).in("status", ["queued", "processing"]).select("*").single();
  if (claimed.error) throw claimed.error;
  job = claimed.data as ImportJob;

  const downloaded = await supabaseAdmin.storage.from(IMPORT_BUCKET).download(job.storage_path);
  if (downloaded.error) throw downloaded.error;
  const buffer = Buffer.from(await downloaded.data.arrayBuffer());
  const parsed = parseWorkbook(buffer, job.filename);

  const start = job.processed_rows;
  const end = Math.min(start + IMPORT_CHUNK_SIZE, parsed.rows.length);
  const sourceChunk = parsed.rows.slice(start, end);
  const mapped = mapManualRows(job.target_key, sourceChunk, start);
  const outcome = await upsertManualRows(mapped.target, mapped.mappedRows, start);

  const processedRows = end;
  const mappedRows = job.mapped_rows + mapped.mapped;
  const skippedRows = job.skipped_rows + mapped.skipped;
  const upsertedRows = job.upserted_rows + outcome.ok;
  const failedRows = job.failed_rows + outcome.failed;
  const done = processedRows >= parsed.rows.length;
  const status = done ? (failedRows > 0 ? "completed_with_errors" : "completed") : "processing";
  const warnings = limitedMerge(job.warnings, mapped.warnings);
  const errors = limitedMerge(job.errors, [...mapped.errors, ...outcome.errors]);

  const updated = await supabaseAdmin.from("import_jobs").update({
    status,
    total_rows: parsed.rows.length,
    sheet_name: parsed.sheetName,
    processed_rows: processedRows,
    mapped_rows: mappedRows,
    skipped_rows: skippedRows,
    upserted_rows: upsertedRows,
    failed_rows: failedRows,
    warnings,
    errors,
    completed_at: done ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", job.id).select("*").single();
  if (updated.error) throw updated.error;

  const finalJob = updated.data as ImportJob;
  if (done) {
    const startedMs = finalJob.started_at ? new Date(finalJob.started_at).getTime() : new Date(finalJob.created_at).getTime();
    const result: ManualImportResult = {
      target: finalJob.target_key,
      module: finalJob.module,
      source: finalJob.source,
      table: finalJob.table_name,
      filename: finalJob.filename,
      sheet: finalJob.sheet_name || "Feuille 1",
      read: finalJob.total_rows,
      mapped: finalJob.mapped_rows,
      skipped: finalJob.skipped_rows,
      insertedOrUpdated: finalJob.upserted_rows,
      failed: finalJob.failed_rows,
      warnings: finalJob.warnings || [],
      errors: finalJob.errors || [],
      durationMs: Math.max(0, Date.now() - startedMs),
    };
    await writeImportLog(result, finalJob.user_email);
    await supabaseAdmin.storage.from(IMPORT_BUCKET).remove([finalJob.storage_path]);
  }

  return finalJob;
}

export async function failImportJob(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Erreur d’import inconnue");
  await supabaseAdmin.from("import_jobs").update({
    status: "failed",
    error_message: message,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  return message;
}
