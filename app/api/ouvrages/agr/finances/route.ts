export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { agrFinances } from "@/lib/agr-finances";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;
  const headers = {"Cache-Control":"private, no-store, max-age=0"};
  if (req.nextUrl.searchParams.get("format") === "csv") {
    const keys = ["code","montant_ht_fcfa","perimetre","methode","source_pages_pdf","reserve"] as const;
    const quote = (v:unknown) => `"${String(v??"").replace(/"/g,'""')}"`;
    const body = "\uFEFF" + [keys.join(";"),...agrFinances.map(r=>keys.map(k=>quote(r[k])).join(";"))].join("\r\n");
    return new Response(body,{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=agr-couts-ht.csv"}});
  }
  return NextResponse.json({ok:true,rows:agrFinances},{headers});
}
