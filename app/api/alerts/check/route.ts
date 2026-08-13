export const dynamic="force-dynamic";
export const revalidate=0;
export const fetchCache="force-no-store";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export async function GET() {
  const alerts:any[] = [];
  for (const [table, module] of [["observations_pluvio","pluviometrie"],["observations_piezo","piezometrie"],["observations_limni","limnimetrie"],["points_eau","points_eau"]]) {
    const { count } = await supabaseAdmin.from(table).select("*", { count:"exact", head:true });
    if (!count) alerts.push({ module, niveau:"info", message:"Aucune donnée collectée pour le moment." });
  }
  for (const a of alerts) await supabaseAdmin.from("alertes").insert({ module:a.module, niveau:a.niveau, message:a.message, statut:"ouverte" });
  return NextResponse.json({ ok:true, alerts, email_notification:"préparée - fournisseur email à brancher" });
}
