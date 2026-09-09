export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_SUPER_ADMIN } from "@/lib/permissions";

const KEY="operational_data_start_date";
export async function GET(req:NextRequest){const auth=await requireApiRole(req,[ROLE_SUPER_ADMIN]);if(auth.response)return auth.response;const{data,error}=await supabaseAdmin.from("system_settings").select("value,updated_at").eq("key",KEY).maybeSingle();if(error)return NextResponse.json({ok:false,error:error.message},{status:500});return NextResponse.json({ok:true,date:data?.value||"",updated_at:data?.updated_at||null});}
export async function POST(req:NextRequest){const auth=await requireApiRole(req,[ROLE_SUPER_ADMIN]);if(auth.response)return auth.response;const body=await req.json().catch(()=>({}));const date=String(body?.date||"").trim();if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return NextResponse.json({ok:false,error:"Date invalide. Format attendu : YYYY-MM-DD."},{status:400});const{error}=await supabaseAdmin.from("system_settings").upsert({key:KEY,value:date||null,description:"Date à partir de laquelle les mesures Epicollect sont considérées comme opérationnelles",updated_at:new Date().toISOString()},{onConflict:"key"});if(error)return NextResponse.json({ok:false,error:error.message},{status:500});return NextResponse.json({ok:true,date});}
