export const dynamic="force-dynamic";
export const revalidate=0;
export const fetchCache="force-no-store";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export async function GET() {
  const alerts:any[] = [];
  for (const [table, module] of [["v_pluviometrie_dashboard_v47","pluviometrie"],["v_piezometrie_dashboard_v47","piezometrie"],["v_limnimetrie_dashboard_v47","limnimetrie"],["points_eau","points_eau"]]) {
    const { count } = await supabaseAdmin.from(table).select("*", { count:"exact", head:true });
    if (!count) alerts.push({ module, niveau:"info", message:"Aucune donnée collectée pour le moment." });
  }
  for (const a of alerts) await supabaseAdmin.from("alertes").insert({ module:a.module, niveau:a.niveau, message:a.message, statut:"ouverte" });
  return NextResponse.json({ ok:true, alerts, email_notification:"préparée - fournisseur email à brancher" });
}
