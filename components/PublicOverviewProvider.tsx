"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
type ModuleOverview={status:string;network:number;stations:number|null;measurements:number|null;lastDate:string|null;unit:string;series:{date:string;value:number|null;stations:number}[]};
type Overview={generatedAt:string;period:{start:string;end:string};points:{count:number|null;source:string;status:string};modules:Record<string,ModuleOverview>};
const Context=createContext<{data:Overview|null;error:string}>({data:null,error:""});
export function PublicOverviewProvider({children}:{children:ReactNode}){
 const [data,setData]=useState<Overview|null>(null),[error,setError]=useState("");
 useEffect(()=>{let alive=true,busy=false;const controller=new AbortController();async function refresh(){if(busy)return;busy=true;try{const r=await fetch("/api/public/stats",{cache:"no-store",signal:controller.signal});if(!r.ok)throw Error("Données publiques indisponibles");const j=await r.json();if(alive){setData(j);setError("");}}catch(e){if(alive)setError("Actualisation indisponible. Réessayez dans quelques instants.");}finally{busy=false;}}refresh();const timer=setInterval(refresh,300000);window.addEventListener("focus",refresh);return()=>{alive=false;controller.abort();clearInterval(timer);window.removeEventListener("focus",refresh);};},[]);
 return <Context.Provider value={{data,error}}>{children}</Context.Provider>;
}
export const usePublicOverview=()=>useContext(Context);
