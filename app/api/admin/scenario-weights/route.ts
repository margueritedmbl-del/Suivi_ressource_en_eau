export const dynamic="force-dynamic";
import {NextRequest,NextResponse} from "next/server";
import {supabaseAdmin} from "@/lib/supabase-admin";
import {requireApiRole} from "@/lib/auth-server";
import {ROLE_SUPER_ADMIN} from "@/lib/permissions";
const DEFAULT={restauration:25,piezometrie:25,pluie:15,microbarrages:15,prelevements:10,deficit_suivi:10};
function clean(v:any){const out:any={};let total=0;Object.keys(DEFAULT).forEach(k=>{const n=Number(v?.[k]);out[k]=Number.isFinite(n)&&n>=0?n:(DEFAULT as any)[k];total+=out[k]});if(total<=0)return DEFAULT;Object.keys(out).forEach(k=>out[k]=Number((out[k]*100/total).toFixed(2)));return out}
export async function GET(req:NextRequest){const a=await requireApiRole(req,[ROLE_SUPER_ADMIN]);if("response" in a)return a.response;const{data}=await supabaseAdmin.from("system_settings").select("value").eq("key","decision_scenario_weights").maybeSingle();let value:any=DEFAULT;try{if(data?.value)value=clean(JSON.parse(data.value))}catch{}return NextResponse.json({ok:true,value,default:DEFAULT})}
export async function POST(req:NextRequest){const a=await requireApiRole(req,[ROLE_SUPER_ADMIN]);if("response" in a)return a.response;const body=await req.json().catch(()=>({}));const value=clean(body?.value);const{error}=await supabaseAdmin.from("system_settings").upsert({key:"decision_scenario_weights",value:JSON.stringify(value),description:"Pondérations (%) du moteur d'aide à la décision PSORE"},{onConflict:"key"});if(error)return NextResponse.json({ok:false,error:error.message},{status:500});return NextResponse.json({ok:true,value})}
