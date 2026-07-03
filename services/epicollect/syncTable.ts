import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchEpicollectEntries } from "@/services/epicollect/client";
import type { EpicollectSource } from "@/services/epicollect/sources";

export type SyncResult = {
  module: string;
  source: string;
  table: string;
  status: "success" | "error";
  fetched: number;
  mapped: number;
  skipped: number;
  upserted: number;
  pages: number;
  durationMs: number;
  error?: string;
};

async function writeSyncLog(result: SyncResult, message: string, apiUrl?: string) {
  const payload: Record<string, any> = {
    module: result.module,
    source: result.source,
    nb_enregistrements: result.upserted,
    statut: result.status,
    message,
    fetched_count: result.fetched,
    mapped_count: result.mapped,
    skipped_count: result.skipped,
    upserted_count: result.upserted,
    page_count: result.pages,
    duration_ms: result.durationMs,
    api_url: apiUrl || null,
  };

  try {
    const { error } = await supabaseAdmin.from("sync_log").insert(payload);
    if (!error) return;
  } catch (_) {}

  // Compatibilité avec les anciennes bases dont sync_log ne contient que les colonnes V2.3.
  try {
    await supabaseAdmin.from("sync_log").insert({
      module: result.module,
      source: result.source,
      nb_enregistrements: result.upserted,
      statut: result.status,
      message,
    });
  } catch (_) {}
}

export async function syncTable(source: EpicollectSource, table: string, mapper: (e: any) => any): Promise<SyncResult> {
  const started = Date.now();
  const baseResult = {
    module: source.module,
    source: source.type_source,
    table,
    fetched: 0,
    mapped: 0,
    skipped: 0,
    upserted: 0,
    pages: 0,
    durationMs: 0,
  };

  try {
    const fetched = await fetchEpicollectEntries(source.api_url, { perPage: 1000, maxPages: 500 });
    const rows = fetched.entries.map(mapper).filter((row) => row && row.source_entry_id);
    const skipped = fetched.entries.length - rows.length;

    let upserted = 0;
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabaseAdmin.from(table).upsert(batch, { onConflict: "source_entry_id" });
      if (error) throw error;
      upserted += batch.length;
    }

    const result: SyncResult = {
      ...baseResult,
      status: "success",
      fetched: fetched.entries.length,
      mapped: rows.length,
      skipped,
      upserted,
      pages: fetched.pages,
      durationMs: Date.now() - started,
    };

    await writeSyncLog(
      result,
      `${source.libelle} : ${upserted}/${fetched.entries.length} enregistrement(s) synchronisé(s), ${fetched.pages} page(s).`,
      source.api_url
    );

    return result;
  } catch (error: any) {
    const result: SyncResult = {
      ...baseResult,
      status: "error",
      durationMs: Date.now() - started,
      error: error.message || "Erreur inconnue",
    };
    await writeSyncLog(result, result.error || "Erreur de synchronisation", source.api_url);
    return result;
  }
}
