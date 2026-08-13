import { NextResponse } from "next/server";
import { BUILD_LABEL, BUILD_VERSION } from "@/lib/navigation";
export const dynamic = "force-dynamic";
export function GET(){ return NextResponse.json({ ok:true, version: BUILD_VERSION, label: BUILD_LABEL, builtAt: "2026-08-13" }, { headers: { "Cache-Control": "no-store, max-age=0" } }); }
