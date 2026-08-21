"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-client";
declare global { interface Window { L: any } }

type ModuleKey = "pluviometrie" | "piezometrie" | "limnimetrie" | "points_eau";
const moduleColors: Record<ModuleKey, string> = { points_eau: "#0077B6", piezometrie: "#48CAE4", pluviometrie: "#7C3AED", limnimetrie: "#16A34A" };
const moduleLabels: Record<ModuleKey, string> = { points_eau: "Point d’eau", piezometrie: "Piézomètre", pluviometrie: "Pluviomètre", limnimetrie: "Limnimètre" };
const allModules: ModuleKey[] = ["points_eau", "piezometrie", "pluviometrie", "limnimetrie"];
const themes = [
  ["fonctionnalite", "Fonctionnalité"],
  ["type", "Type d’ouvrage"],
  ["rehabilitation", "Réhabilitation"],
  ["equipement", "Équipement"],
  ["organe", "Organe de gestion"],
  ["qualite", "Qualité eau"],
  ["donnees", "Qualité données"],
];

const themeLegends: Record<string, Array<[string, string]>> = {
  fonctionnalite: [["Fonctionnel", "#16a34a"], ["Non fonctionnel", "#dc2626"], ["Partiel", "#f97316"], ["Abandonné", "#111827"], ["Non renseigné", "#64748b"]],
  type: [["Forage", "#0077B6"], ["Puits", "#B45309"], ["Non renseigné", "#64748b"]],
  rehabilitation: [["Priorité élevée", "#dc2626"], ["Priorité moyenne", "#f97316"], ["Priorité faible", "#eab308"]],
  equipement: [["PMH", "#2563eb"], ["SHVA / SHPA", "#7c3aed"], ["SAEP / SAES", "#0891b2"], ["Non équipé", "#991b1b"], ["Autre", "#64748b"]],
  organe: [["Organe présent", "#16a34a"], ["Organe absent", "#dc2626"], ["Non renseigné", "#64748b"]],
  qualite: [["Qualité normale", "#16a34a"], ["Alerte qualité", "#be123c"]],
  donnees: [["Données GPS OK", "#16a34a"], ["GPS manquant", "#f97316"]],
};

function safe(v: any) { return String(v ?? "").replace(/[<>&"]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;"}[c] as string)); }

export default function LeafletMap({ module }: { module?: ModuleKey }) {
  const ref = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), layerRef = useRef<any>(null), geoLayersRef = useRef<Record<string,any>>({});
  const [status, setStatus] = useState("Chargement...");
  const [theme, setTheme] = useState("fonctionnalite");
  const [geoEnabled,setGeoEnabled]=useState<Record<string,boolean>>({bassins:true,sousBassins:false,communes:false,restaurations:false,drainage:false});
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [cartographiables,setCartographiables]=useState<Record<string,number>>({});
  const [enabled, setEnabled] = useState<Record<ModuleKey, boolean>>({ points_eau: false, piezometrie: false, pluviometrie: false, limnimetrie: false });
  const selectedModules = useMemo(() => module ? [module] : allModules.filter((m) => enabled[m]), [module, enabled]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (!document.getElementById("leaflet-css")) { const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
        if (!window.L) await new Promise<void>((resolve, reject) => {
          const existing=document.getElementById("leaflet-js") as HTMLScriptElement|null;
          if(existing){ existing.addEventListener("load",()=>resolve(),{once:true}); existing.addEventListener("error",()=>reject(new Error("Leaflet indisponible")),{once:true}); return; }
          const s = document.createElement("script"); s.id="leaflet-js"; s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.async=true; s.onload = () => resolve(); s.onerror=()=>reject(new Error("Impossible de charger Leaflet")); document.body.appendChild(s);
        });
        if (cancelled || !ref.current || mapRef.current || !window.L) return;
        const L = window.L;
        const map = L.map(ref.current).setView([12.86, -7.56], 8); mapRef.current = map;
        const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
        const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles © Esri" });
        osm.addTo(map); L.control.layers({ OpenStreetMap: osm, Satellite: sat }, {}, { collapsed: true }).addTo(map);
        const layerDefs:any[]=[
          ["bassins","/data/decisionnel/bassins.geojson",{color:"#0f4c81",weight:2.5,fillOpacity:.04}],
          ["sousBassins","/data/decisionnel/sous_bassins.geojson",{color:"#38a3a5",weight:1,fillOpacity:.02}],
          ["communes","/data/decisionnel/communes_projet_enabel.geojson",{color:"#7c3aed",weight:2,fillOpacity:.03}],
          ["restaurations","/data/decisionnel/restaurations.geojson",{color:"#a16207",weight:1,fillOpacity:.12}],
          ["drainage","/data/decisionnel/sens_drainage.geojson",{color:"#0284c7",weight:1,fillOpacity:0}]
        ];
        for(const [key,url,style] of layerDefs){
          try{const rr=await fetch(url,{cache:"force-cache"});if(!rr.ok)continue;const data=await rr.json();if(cancelled)continue;
            const lyr=L.geoJSON(data,{style:()=>style,onEachFeature:(f:any,l:any)=>{const pr=f?.properties||{};const title=key==="bassins"?`Bassin ${pr.Num_bassin??pr.Id??""}`:key==="sousBassins"?`Sous-bassin ${pr.HydroID??pr.OBJECTID??""}`:key==="communes"?`Commune : ${pr.laa??pr.name??pr.nom??""}`:key==="restaurations"?`Restauration : ${pr.ID??""}`:`Drainage ${pr.HydroID??""}`;l.bindPopup(safe(title));if(key==="bassins")l.on("click",()=>setGeoEnabled(x=>({...x,sousBassins:true})));}});
            geoLayersRef.current[key]=lyr;if((key==="bassins"))lyr.addTo(map);
          }catch{}
        }
      } catch(e:any) { if(!cancelled) setStatus(`Carte indisponible : ${e?.message || "erreur de chargement"}`); }
    }
    init();
    return()=>{ cancelled=true; try{ if(mapRef.current){ mapRef.current.remove(); mapRef.current=null; } }catch{} };
  }, []);

  useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    for(const [k,l] of Object.entries(geoLayersRef.current)){try{if(geoEnabled[k]){if(!map.hasLayer(l))l.addTo(map);}else if(map.hasLayer(l))map.removeLayer(l);}catch{}}
  },[geoEnabled]);

  useEffect(() => {
    async function loadPoints() {
      if (!window.L || !mapRef.current) return;
      const L = window.L, map = mapRef.current;
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
      const params = new URLSearchParams();
      params.set("theme", theme);
      params.set("modules", selectedModules.length ? selectedModules.join(",") : "none");
      params.set("detail", module ? "connected" : "public");
      const request = module ? authFetch(`/api/map/points?${params.toString()}`) : fetch(`/api/map/points?${params.toString()}`);
      let j:any;
      try { const response=await request; if(!response.ok) throw new Error(`HTTP ${response.status}`); j=await response.json(); }
      catch(e:any){ setSummary({}); setCartographiables({}); setStatus(`Données cartographiques indisponibles : ${e?.message || "erreur"}`); return; }
      setSummary(j.summary || {}); setCartographiables(j.cartographiables || {});
      const pts = (j.data || []).filter((p: any) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)));
      if (!pts.length) { setStatus(selectedModules.length ? "Aucune donnée GPS à afficher pour le filtre choisi." : "Aucune couche de suivi sélectionnée. Cliquez sur un bouton pour afficher les stations/ouvrages."); return; }
      const g = L.featureGroup();
      pts.forEach((p: any) => {
        const mod = p.module as ModuleKey;
        const color = p.couleur || moduleColors[mod] || "#111827";
        const html = p.popup_html || (mod === "points_eau"
          ? `<strong>Point d’eau</strong><br/>Commune : ${safe(p.commune || "--")}<br/>Village/localité : ${safe(p.village || p.libelle || "--")}<br/>Type d’ouvrage : ${safe(p.type_infrastructure || "--")}`
          : `<strong>${safe(moduleLabels[mod] || mod)}</strong><br/>Emplacement : ${safe(p.libelle || p.code || "--")}<br/>Latitude : ${safe(p.latitude)}<br/>Longitude : ${safe(p.longitude)}`);
        L.circleMarker([Number(p.latitude), Number(p.longitude)], { radius: mod === "points_eau" ? 7 : 8, color: "white", weight: 2, fillColor: color, fillOpacity: .95 }).bindPopup(html).addTo(g);
      });
      g.addTo(map); layerRef.current = g;
      try { map.fitBounds(g.getBounds().pad(.25)); } catch {}
      setStatus(`${pts.length} point(s) GPS affiché(s). Source : ${j.source}${module === "points_eau" ? ` • thème : ${themes.find((t) => t[0] === theme)?.[1]}` : ""}`);
    }
    loadPoints();
  }, [module, theme, selectedModules.join(",")]);

  return <div>
    <div className="map-tools module-filter-tools">
      <button className={geoEnabled.bassins?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,bassins:!x.bassins}))}>Bassins</button>
      <button className={geoEnabled.sousBassins?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,sousBassins:!x.sousBassins}))}>Sous-bassins</button>
      <button className={geoEnabled.communes?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,communes:!x.communes}))}>Communes du projet</button>
      <button className={geoEnabled.restaurations?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,restaurations:!x.restaurations}))}>Restaurations</button>
      <button className={geoEnabled.drainage?"btn btn-primary":"btn btn-soft"} onClick={()=>setGeoEnabled(x=>({...x,drainage:!x.drainage}))}>Drainage</button>
    </div>
    {!module && <div className="map-tools module-filter-tools">{allModules.map((m) => {const total=summary[m]??0;const gps=cartographiables[m]??0;const label=m==="points_eau"?`${moduleLabels[m]} (${total} inventoriés / ${gps} carto)`:`${moduleLabels[m]} (${total} réseau / ${gps} carto)`;return <button key={m} className={enabled[m] ? "btn btn-primary" : "btn btn-soft"} onClick={() => setEnabled((e) => ({ ...e, [m]: !e[m] }))}>{label}</button>})}</div>}
    {module === "points_eau" && <><div className="map-tools">{themes.map(([k, label]) => <button key={k} className={theme === k ? "btn btn-primary" : "btn btn-soft"} onClick={() => setTheme(k)}>{label}</button>)}</div><div className="map-theme-legend">{(themeLegends[theme] || []).map(([label, color]) => <span key={label}><i style={{ background: color }}></i>{label}</span>)}</div></>}
    <div ref={ref} className="map-real"></div>
    <div className="map-legend"><strong>Légende</strong>{allModules.filter((m) => module ? m === module : enabled[m]).map((m) => <span key={m}><i style={{background: moduleColors[m]}}></i>{moduleLabels[m]}</span>)}{module === "points_eau" && <small>Thème actif : {themes.find((t) => t[0] === theme)?.[1]}. Les détails avancés sont réservés aux utilisateurs connectés.</small>}</div>
    <div className="notice-empty">{status}</div>
  </div>;
}
