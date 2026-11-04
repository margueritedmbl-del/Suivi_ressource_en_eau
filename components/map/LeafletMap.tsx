"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {useRole} from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";
declare global { interface Window { L: any } }

type ModuleKey = "pluviometrie" | "piezometrie" | "limnimetrie" | "points_eau";
const moduleColors: Record<ModuleKey,string> = { points_eau:"#0077B6", piezometrie:"#48CAE4", pluviometrie:"#7C3AED", limnimetrie:"#16A34A" };
const moduleLabels: Record<ModuleKey,string> = { points_eau:"Point d’eau", piezometrie:"Piézomètre", pluviometrie:"Pluviomètre", limnimetrie:"Limnimètre" };
const allModules: ModuleKey[] = ["points_eau","piezometrie","pluviometrie","limnimetrie"];
const themes = [["fonctionnalite","Fonctionnalité"],["type","Type d’ouvrage"],["rehabilitation","Réhabilitation"],["equipement","Équipement"],["organe","Organe de gestion"],["qualite","Qualité eau"],["donnees","Qualité données"]];
const themeLegends: Record<string,Array<[string,string]>> = {
  fonctionnalite:[["Fonctionnel","#16a34a"],["Non fonctionnel","#dc2626"],["Partiel","#f97316"],["Abandonné","#111827"],["Non renseigné","#64748b"]],
  type:[["Forage","#0077B6"],["Puits","#B45309"],["Non renseigné","#64748b"]],
  rehabilitation:[["Priorité élevée","#dc2626"],["Priorité moyenne","#f97316"],["Priorité faible","#eab308"]],
  equipement:[["PMH","#2563eb"],["SHVA / SHPA","#7c3aed"],["SAEP / SAES","#0891b2"],["Non équipé","#991b1b"],["Autre","#64748b"]],
  organe:[["Organe présent","#16a34a"],["Organe absent","#dc2626"],["Non renseigné","#64748b"]],
  qualite:[["Qualité normale","#16a34a"],["Alerte qualité","#be123c"]],
  donnees:[["Données GPS OK","#16a34a"],["GPS manquant","#f97316"]],
};
function safe(v:any){return String(v??"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c] as string));}

export default function LeafletMap({ module }: { module?: ModuleKey }) {
  const {canViewRestorations}=useRole();
  const ref=useRef<HTMLDivElement>(null), mapRef=useRef<any>(null), layerRef=useRef<any>(null), geoLayersRef=useRef<Record<string,any>>({});
  const [mapReady,setMapReady]=useState(false);
  const [status,setStatus]=useState("Chargement de la cartographie…");
  const [theme,setTheme]=useState("fonctionnalite");
  const [geoEnabled,setGeoEnabled]=useState<Record<string,boolean>>({bassins:true,sousBassins:false,communes:false,restaurations:false,drainage:false});
  const [summary,setSummary]=useState<Record<string,number>>({}), [cartographiables,setCartographiables]=useState<Record<string,number>>({});
  const [enabled,setEnabled]=useState<Record<ModuleKey,boolean>>({points_eau:false,piezometrie:false,pluviometrie:false,limnimetrie:false});
  const selectedModules=useMemo(()=>module?[module]:allModules.filter(m=>enabled[m]),[module,enabled]);

  useEffect(()=>{
    let cancelled=false; let resize=()=>{}; let observer:ResizeObserver|undefined;
    async function init(){
      try{
        if(!document.getElementById("leaflet-css")){const l=document.createElement("link");l.id="leaflet-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
        if(!window.L) await new Promise<void>((resolve,reject)=>{const old=document.getElementById("leaflet-js") as HTMLScriptElement|null;if(old){old.addEventListener("load",()=>resolve(),{once:true});old.addEventListener("error",()=>reject(new Error("Leaflet indisponible")),{once:true});return;}const s=document.createElement("script");s.id="leaflet-js";s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.async=true;s.onload=()=>resolve();s.onerror=()=>reject(new Error("Impossible de charger Leaflet"));document.body.appendChild(s);});
        if(cancelled||!ref.current||mapRef.current||!window.L)return;
        const L=window.L, map=L.map(ref.current,{preferCanvas:true}).setView([12.86,-7.56],8);mapRef.current=map;setMapReady(true);
        const osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors",crossOrigin:true});
        const carto=L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{maxZoom:20,attribution:"© OpenStreetMap © CARTO",crossOrigin:true});
        const sat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Tiles © Esri",crossOrigin:true});
        osm.on("tileerror",()=>setStatus("Fond OpenStreetMap indisponible — essayez CARTO ou Satellite."));carto.on("tileerror",()=>setStatus("Fond CARTO indisponible — essayez OpenStreetMap ou Satellite."));sat.on("tileerror",()=>setStatus("Fond Satellite indisponible — essayez OpenStreetMap."));
        osm.addTo(map);L.control.layers({"OpenStreetMap":osm,"CARTO clair":carto,"Satellite":sat},{},{collapsed:false,position:"topright"}).addTo(map);
        resize=()=>map.invalidateSize({animate:false});observer=new ResizeObserver(resize);observer.observe(ref.current!);window.addEventListener("resize",resize);setTimeout(resize,100);setTimeout(resize,500);setTimeout(resize,1000);
        const layerDefs:any[]=[["bassins","/data/decisionnel/bassins.geojson",{color:"#0f4c81",weight:2.5,fillOpacity:.04}],["sousBassins","/data/decisionnel/sous_bassins.geojson",{color:"#38a3a5",weight:1,fillOpacity:.02}],["communes","/data/decisionnel/communes_projet_enabel.geojson",{color:"#7c3aed",weight:2,fillOpacity:.03}],["restaurations","/data/decisionnel/restaurations.geojson",{color:"#a16207",weight:1,fillOpacity:.12}],["drainage","/data/decisionnel/sens_drainage.geojson",{color:"#0284c7",weight:1,fillOpacity:0}]];
        for(const [key,url,style] of layerDefs){if(key==="restaurations")continue;try{const rr=await fetch(url,{cache:"force-cache"});if(!rr.ok)continue;const data=await rr.json();if(cancelled)continue;const lyr=L.geoJSON(data,{style:()=>style,onEachFeature:(f:any,l:any)=>{const pr=f?.properties||{};const title=key==="bassins"?`Bassin ${pr.Num_bassin??pr.Id??""}`:key==="sousBassins"?`Sous-bassin ${pr.HydroID??pr.OBJECTID??""}`:key==="communes"?`Commune : ${pr.laa??pr.name??pr.nom??""}`:key==="restaurations"?`Restauration : ${pr.ID??""}`:`Drainage ${pr.HydroID??""}`;l.bindPopup(safe(title));}});geoLayersRef.current[key]=lyr;if(key==="bassins")lyr.addTo(map);}catch{}}
      }catch(e:any){if(!cancelled)setStatus(`Carte indisponible : ${e?.message||"erreur de chargement"}`);}
    }
    init();return()=>{cancelled=true;observer?.disconnect();geoLayersRef.current={};layerRef.current=null;window.removeEventListener("resize",resize);try{if(mapRef.current){mapRef.current.remove();mapRef.current=null;}}catch{}};
  },[]);

  useEffect(()=>{let cancelled=false;const map=mapRef.current;if(!mapReady||!map)return;const existing=geoLayersRef.current.restaurations;if(!canViewRestorations){if(existing){map.removeLayer(existing);delete geoLayersRef.current.restaurations;}return;}if(existing){if(geoEnabled.restaurations)existing.addTo(map);else map.removeLayer(existing);return;}fetch("/data/decisionnel/restaurations.geojson",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Couche indisponible");return r.json();}).then(data=>{if(cancelled||!window.L)return;const layer=window.L.geoJSON(data,{style:()=>({color:"#a16207",weight:1,fillOpacity:.12}),onEachFeature:(f:any,l:any)=>l.bindPopup(safe(`Restauration : ${f?.properties?.ID??""}`))});geoLayersRef.current.restaurations=layer;if(geoEnabled.restaurations)layer.addTo(map);}).catch(()=>{});return()=>{cancelled=true;};},[mapReady,canViewRestorations,geoEnabled.restaurations]);
  useEffect(()=>{const map=mapRef.current;if(!map)return;for(const [k,l] of Object.entries(geoLayersRef.current)){try{if(geoEnabled[k]&&(k!=="restaurations"||canViewRestorations)){if(!map.hasLayer(l))l.addTo(map);}else if(map.hasLayer(l))map.removeLayer(l);}catch{}}},[geoEnabled,canViewRestorations]);
  useEffect(()=>{
    const controller=new AbortController();
    async function loadPoints(){if(!mapReady||!window.L||!mapRef.current)return;const L=window.L,map=mapRef.current;if(layerRef.current){map.removeLayer(layerRef.current);layerRef.current=null;}const params=new URLSearchParams({theme,modules:selectedModules.length?selectedModules.join(","):"none",detail:module?"connected":"public"});const request=module?authFetch(`/api/map/points?${params}`,{signal:controller.signal}):fetch(`/api/map/points?${params}`,{signal:controller.signal});let j:any;try{const response=await request;if(!response.ok)throw new Error(`HTTP ${response.status}`);j=await response.json();}catch(e:any){if(controller.signal.aborted)return;setSummary({});setCartographiables({});setStatus(`Données cartographiques indisponibles : ${e?.message||"erreur"}`);return;}if(controller.signal.aborted)return;setSummary(j.summary||{});setCartographiables(j.cartographiables||{});const pts=(j.data||[]).filter((p:any)=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));if(!pts.length){setStatus(selectedModules.length?"Aucune donnée GPS à afficher pour le filtre choisi.":"Sélectionnez un réseau pour afficher les stations/ouvrages.");return;}const g=L.featureGroup();pts.forEach((p:any)=>{const mod=p.module as ModuleKey,color=p.couleur||moduleColors[mod]||"#111827";const html=p.popup_html||(mod==="points_eau"?`<strong>Point d’eau</strong><br/>Commune : ${safe(p.commune||"--")}<br/>Village/localité : ${safe(p.village||p.libelle||"--")}<br/>Type d’ouvrage : ${safe(p.type_infrastructure||"--")}`:`<strong>${safe(moduleLabels[mod]||mod)}</strong><br/>Emplacement : ${safe(p.libelle||p.code||"--")}<br/>Latitude : ${safe(p.latitude)}<br/>Longitude : ${safe(p.longitude)}`);L.circleMarker([Number(p.latitude),Number(p.longitude)],{radius:mod==="points_eau"?7:8,color:"white",weight:2,fillColor:color,fillOpacity:.95}).bindPopup(html).addTo(g);});g.addTo(map);layerRef.current=g;try{map.fitBounds(g.getBounds().pad(.25));map.invalidateSize({animate:false});}catch{}setStatus(`${pts.length} point(s) GPS affiché(s). Fond cartographique : OpenStreetMap / CARTO / Satellite.`);}
    loadPoints();return()=>controller.abort();
  },[mapReady,module,theme,selectedModules.join(",")]);

  return <div><div className="map-tools module-filter-tools"><button className={geoEnabled.bassins?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,bassins:!x.bassins}))}>Bassins</button><button className={geoEnabled.sousBassins?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,sousBassins:!x.sousBassins}))}>Sous-bassins</button><button className={geoEnabled.communes?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,communes:!x.communes}))}>Communes du projet</button><button disabled={!canViewRestorations} title={!canViewRestorations?"Couche réservée aux administrateurs":undefined} className={geoEnabled.restaurations?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,restaurations:!x.restaurations}))}>Restaurations</button><button className={geoEnabled.drainage?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,drainage:!x.drainage}))}>Drainage</button></div>{!module&&<div className="map-tools module-filter-tools">{allModules.map(m=>{const total=summary[m]??0,gps=cartographiables[m]??0,label=m==="points_eau"?`${moduleLabels[m]} (${total} inventoriés / ${gps} carto)`: `${moduleLabels[m]} (${total} réseau / ${gps} carto)`;return <button key={m} className={enabled[m]?"btn btn-primary":"btn btn-soft"} onClick={()=>setEnabled(e=>({...e,[m]:!e[m]}))}>{label}</button>})}</div>}{module==="points_eau"&&<><div className="map-tools">{themes.map(([k,label])=><button key={k} className={theme===k?"btn btn-primary":"btn btn-soft"} onClick={()=>setTheme(k)}>{label}</button>)}</div><div className="map-theme-legend">{(themeLegends[theme]||[]).map(([label,color])=><span key={label}><i style={{background:color}}></i>{label}</span>)}</div></>}<div ref={ref} className="map-real"></div><div className="map-legend"><strong>Fonds cartographiques</strong><span>OpenStreetMap</span><span>CARTO clair</span><span>Satellite Esri</span>{allModules.filter(m=>module?m===module:enabled[m]).map(m=><span key={m}><i style={{background:moduleColors[m]}}></i>{moduleLabels[m]}</span>)}</div><div className="notice-empty">{status}</div></div>;
}
