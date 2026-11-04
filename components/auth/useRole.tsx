"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {canAccessOuvrages,canViewRestorations,ROLE_ADMIN,ROLE_DNH,ROLE_PUBLIC,ROLE_SUPER_ADMIN,canAccessDashboard,canAccessObservatoire,canAccessReports,canAccessSigDecisionnel,canAccessPrivateMap,canConfigureScenarios,canExportAdvanced,canExportCsvXlsx,canManageUsers,canSync,canViewInternal,canViewFinances} from "@/lib/permissions";
export function useRole(){
 const[role,setRole]=useState(ROLE_PUBLIC),[loading,setLoading]=useState(true),[authenticated,setAuthenticated]=useState(false);
 useEffect(()=>{
  let active=true, generation=0;
  async function update(session:any){
   const current=++generation;
   if(!session?.access_token){if(active){setAuthenticated(false);setRole(ROLE_PUBLIC);setLoading(false)}return}
   setLoading(true);
   try{
    const res=await fetch("/api/auth/me",{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
    const json=res.ok?await res.json():null;
    if(active&&current===generation){setAuthenticated(true);setRole(json?.role||ROLE_PUBLIC)}
   }catch{if(active&&current===generation){setAuthenticated(false);setRole(ROLE_PUBLIC)}}
   finally{if(active&&current===generation)setLoading(false)}
  }
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void update(session)});
  const initialGeneration=generation;
  void supabase.auth.getSession().then(({data})=>{if(active&&generation===initialGeneration)void update(data.session)}).catch(()=>{if(active&&generation===initialGeneration)void update(null)});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);

 return{role,loading,authenticated,canAccessOuvrages:canAccessOuvrages(role),canViewRestorations:canViewRestorations(role),isAdmin:role===ROLE_ADMIN,isSuperAdmin:role===ROLE_SUPER_ADMIN,isDnh:role===ROLE_DNH,canManage:canManageUsers(role),canOperate:canSync(role),canSync:canSync(role),canExportCsvXlsx:canExportCsvXlsx(role),canExportAdvanced:canExportAdvanced(role),canViewInternal:canViewInternal(role),canAccessDashboard:canAccessDashboard(role),canAccessObservatoire:canAccessObservatoire(role),canAccessReports:canAccessReports(role),canAccessSigDecisionnel:canAccessSigDecisionnel(role),canAccessPrivateMap:canAccessPrivateMap(role),canConfigureScenarios:canConfigureScenarios(role),canViewFinances:canViewFinances(role)};
}
