export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { infrastructureFinances } from "@/lib/infrastructure-finances";
import { agrFinances } from "@/lib/agr-finances";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;
  const headers = {"Cache-Control":"private, no-store, max-age=0"};
  if (req.nextUrl.searchParams.get("format") === "csv") {
    const siteMode=req.nextUrl.searchParams.get("scope")==="sites";
    const rows:Record<string,unknown>[]=siteMode?infrastructureFinances:agrFinances;
    const keys = siteMode?["code","type","site","forage","amenagement","equipement","semences","total","devise","base_fiscale","source","feuille","ligne","portee","reserve"]:["code","montant","devise","base_fiscale","montant_ht_fcfa","perimetre","methode","source","reference","reserve"];
    const quote = (v:unknown) => `"${String(v??"").replace(/"/g,'""')}"`;
    const body = "\uFEFF" + [keys.join(";"),...rows.map(r=>keys.map(k=>quote(r[k])).join(";"))].join("\r\n");
    return new Response(body,{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=ouvrages-couts.csv"}});
  }
  return NextResponse.json({ok:true,rows:agrFinances,sites:infrastructureFinances},{headers});
}
