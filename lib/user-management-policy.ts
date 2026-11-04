import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ROLE_SUPER_ADMIN, isEnabledRole } from "@/lib/permissions";
export function profileRole(profile:any){return Array.isArray(profile?.roles)?profile.roles[0]?.nom_role:profile?.roles?.nom_role;}
export async function checkManagedTarget(actor:string,key:"id"|"email",value:string){
 const result=await supabaseAdmin.from("profils").select("id,role_id,roles(nom_role)").eq(key,value).maybeSingle();
 if(result.error)return NextResponse.json({ok:false,error:"Vérification du compte impossible."},{status:500});
 if(actor!==ROLE_SUPER_ADMIN&&profileRole(result.data)===ROLE_SUPER_ADMIN)return NextResponse.json({ok:false,error:"Compte non administrable avec votre rôle."},{status:403});
 return null;
}
export async function checkAssignableRole(actor:string,id:string){
 const result=await supabaseAdmin.from("roles").select("id,nom_role").eq("id",id).maybeSingle();
 if(result.error)return NextResponse.json({ok:false,error:"Vérification du rôle impossible."},{status:500});
 if(!result.data)return NextResponse.json({ok:false,error:"Rôle introuvable."},{status:400});
 if(!isEnabledRole(result.data.nom_role)||(actor!==ROLE_SUPER_ADMIN&&result.data.nom_role===ROLE_SUPER_ADMIN))return NextResponse.json({ok:false,error:"Attribution de ce rôle non autorisée."},{status:403});
 return null;
}
