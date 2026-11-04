export const dynamic="force-dynamic";
export const revalidate=0;
export const fetchCache="force-no-store";
export const runtime="nodejs";
import { NextResponse } from "next/server";
import { buildPublicOverview } from "@/services/public/overview";
export async function GET(){const overview=await buildPublicOverview();return NextResponse.json({ok:true,...overview,data:{points_eau:overview.points.count,...Object.fromEntries(Object.entries(overview.modules).map(([m,v])=>[m,v.measurements]))}},{headers:{"Cache-Control":"no-store, max-age=0"}});}
