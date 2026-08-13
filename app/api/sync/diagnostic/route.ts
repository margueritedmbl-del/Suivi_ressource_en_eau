export const dynamic="force-dynamic";
import { NextRequest,NextResponse } from "next/server";
import { authorizeSync } from "@/app/api/sync/_auth";
import { getActiveEpicollectSources } from "@/services/epicollect/sources";
import { hasSupabaseAdminEnv,getSupabaseAdminEnvStatus } from "@/lib/supabase-admin";
export async function GET(req:NextRequest){const auth=await authorizeSync(req);if(!auth.ok)return auth.response;const sources=await getActiveEpicollectSources();return NextResponse.json({ok:true,mode:auth.mode,supabase:hasSupabaseAdminEnv(),environment:getSupabaseAdminEnvStatus(),cronSecretConfigured:Boolean(process.env.CRON_SECRET||process.env.SYNC_SECRET),sources:sources.map(s=>({module:s.module,type_source:s.type_source,project_slug:s.project_slug,actif:s.actif!==false}))});}
