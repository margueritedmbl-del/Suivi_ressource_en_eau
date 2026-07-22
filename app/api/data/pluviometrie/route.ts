export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextResponse } from "next/server";import { supabaseAdmin } from "@/lib/supabase-admin";
export async function GET(){const {data,error}=await supabaseAdmin.from("observations_pluvio").select("*").limit(500);if(error)return NextResponse.json({ok:false,error:error.message},{status:500});return NextResponse.json({ok:true,data});}
