"use client";
import { useEffect, useRef, useState } from "react";
import foragesData from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometresData from "@/public/data/referentiels/piezometres_reference.json";
import microbarragesData from "@/public/data/referentiels/microbarrages_reference.json";
declare global { interface Window { L:any } }

function loadLeaflet(){
  return new Promise<void>((resolve,reject)=>{
    if(window.L){resolve();return;}
    if(!document.getElementById("leaflet-css")){const l=document.createElement("link");l.id="leaflet-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    const existing=document.getElementById("leaflet-js") as HTMLScriptElement|null;
    if(existing){existing.addEventListener("load",()=>resolve(),{once:true});existing.addEventListener("error",()=>reject(new Error("Leaflet indisponible")),{once:true});return;}
    const s=document.createElement("script");s.id="leaflet-js";s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.async=true;s.onload=()=>resolve();s.onerror=()=>reject(new Error("Impossible de charger Leaflet"));document.body.appendChild(s);
  });
}

export default function IntegratedAssetsMap({ showFinancials=false, financials={} }:{ showFinancials?:boolean; financials?:Record<string,number> }){
  const ref=useRef<HTMLDivElement>(null), mapRef=useRef<any>(null); const [status,setStatus]=useState("Chargement de la carte…");
  useEffect(()=>{let cancelled=false;(async()=>{
    await loadLeaflet(); if(cancelled||!ref.current||mapRef.current)return; const L=window.L; if(!L) throw new Error("Bibliothèque cartographique absente");
    const map=L.map(ref.current).setView([13.05,-7.45],9);mapRef.current=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
    const forages:any[] = foragesData as any[]; const piezos:any[] = piezometresData as any[]; const barrages:any[]=microbarragesData as any[];
    const cr=L.featureGroup(),pm=L.featureGroup(),pz=L.featureGroup(),mb=L.featureGroup();
    forages.filter((f:any)=>Number.isFinite(Number(f.latitude))&&Number.isFinite(Number(f.longitude))).forEach((f:any)=>L.circleMarker([Number(f.latitude),Number(f.longitude)],{radius:8,color:"#fff",weight:2,fillColor:f.composante==="CRR"?"#7c3aed":"#f97316",fillOpacity:.95}).bindPopup(`<strong>${f.code}</strong><br/>${f.commune} / ${f.site}<br/>Débit : ${f.debit_exploitation_m3h} m³/h<br/>CIP : ${f.cote_installation_pompe_m} m`).addTo(f.composante==="CRR"?cr:pm));
    piezos.filter((p:any)=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))).forEach((p:any)=>L.circleMarker([Number(p.latitude),Number(p.longitude)],{radius:7,color:"#fff",weight:2,fillColor:"#0891b2",fillOpacity:.95}).bindPopup(`<strong>${p.code} · ${p.village}</strong><br/>${p.commune}<br/>Profondeur : ${p.profondeur_totale_m??"—"} m<br/>Niveau statique : ${p.niveau_statique_m??"—"} m`).addTo(pz));
    barrages.filter((b:any)=>Number.isFinite(Number(b.latitude))&&Number.isFinite(Number(b.longitude))).forEach((b:any)=>{ const amount=financials[b.code]; const financeLine=showFinancials&&Number.isFinite(Number(amount))?`<br/>Montant exécuté : ${Number(amount).toLocaleString('fr-FR')} FCFA`:''; L.circleMarker([Number(b.latitude),Number(b.longitude)],{radius:10,color:"#fff",weight:2,fillColor:"#166534",fillOpacity:.98}).bindPopup(`<strong>${b.code} · Micro-barrage de ${b.nom}</strong><br/>${b.commune}<br/>Travaux : ${b.statut_travaux}<br/>Surface inondée : ${b.surface_inondee_ha} ha<br/>Curage : ${b.curage_surface_ha} ha${financeLine}`).addTo(mb); });
    cr.addTo(map);pm.addTo(map);pz.addTo(map);mb.addTo(map);L.control.layers({}, {"Forages CRR":cr,"Forages PM":pm,"Piézomètres":pz,"Micro-barrages":mb},{collapsed:false}).addTo(map);
    const layers=[...cr.getLayers(),...pm.getLayers(),...pz.getLayers(),...mb.getLayers()]; if(layers.length){const all=L.featureGroup(layers);map.fitBounds(all.getBounds().pad(.18));}
    setStatus("40 ouvrages géolocalisés · 16 forages, 20 piézomètres et 4 micro-barrages");
  })().catch(e=>setStatus(`Carte indisponible : ${e?.message||"erreur inconnue"}`));return()=>{cancelled=true;if(mapRef.current){mapRef.current.remove();mapRef.current=null;}}},[showFinancials,financials]);
  return <section className="panel"><h2>Carte intégrée des ouvrages</h2><div ref={ref} className="integrated-assets-map"/><div className="map-theme-legend"><span><i style={{background:"#7c3aed"}}/>CRR</span><span><i style={{background:"#f97316"}}/>PM</span><span><i style={{background:"#0891b2"}}/>Piézomètres</span><span><i style={{background:"#166534"}}/>Micro-barrages</span></div><div className="notice-empty">{status}</div></section>
}
