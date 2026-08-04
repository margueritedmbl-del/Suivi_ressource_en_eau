"use client";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { L:any } }

export default function IntegratedAssetsMap(){
  const ref=useRef<HTMLDivElement>(null), mapRef=useRef<any>(null); const [status,setStatus]=useState("Chargement de la carte…");
  useEffect(()=>{(async()=>{
    if(!document.getElementById("leaflet-css")){const l=document.createElement("link");l.id="leaflet-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l)}
    if(!window.L) await new Promise<void>(resolve=>{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>resolve();document.body.appendChild(s)});
    if(!ref.current||mapRef.current)return; const L=window.L; const map=L.map(ref.current).setView([13.05,-7.45],9);mapRef.current=map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
    const [forages,piezos]=await Promise.all([fetch("/data/referentiels/forages_exploitation_crr_pm.json").then(r=>r.json()),fetch("/data/referentiels/piezometres_reference.json").then(r=>r.json())]);
    const cr=L.featureGroup(),pm=L.featureGroup(),pz=L.featureGroup();
    forages.forEach((f:any)=>L.circleMarker([f.latitude,f.longitude],{radius:8,color:"#fff",weight:2,fillColor:f.composante==="CRR"?"#7c3aed":"#f97316",fillOpacity:.95}).bindPopup(`<strong>${f.code}</strong><br/>${f.commune} / ${f.site}<br/>Débit : ${f.debit_exploitation_m3h} m³/h<br/>CIP : ${f.cote_installation_pompe_m} m`).addTo(f.composante==="CRR"?cr:pm));
    piezos.forEach((p:any)=>L.circleMarker([p.latitude,p.longitude],{radius:7,color:"#fff",weight:2,fillColor:"#0891b2",fillOpacity:.95}).bindPopup(`<strong>${p.code} · ${p.village}</strong><br/>${p.commune}<br/>Profondeur : ${p.profondeur_totale_m??"—"} m<br/>Niveau statique : ${p.niveau_statique_m??"—"} m`).addTo(pz));
    cr.addTo(map);pm.addTo(map);pz.addTo(map);L.control.layers({}, {"Forages CRR":cr,"Forages PM":pm,"Piézomètres":pz},{collapsed:false}).addTo(map);
    const all=L.featureGroup([...cr.getLayers(),...pm.getLayers(),...pz.getLayers()]);map.fitBounds(all.getBounds().pad(.18));setStatus("36 ouvrages géolocalisés · EPSG:32629 converti en WGS 84");
  })().catch(e=>setStatus(`Carte indisponible : ${e?.message||"erreur"}`))},[]);
  return <section className="panel"><h2>Carte intégrée des ouvrages</h2><div ref={ref} className="integrated-assets-map"/><div className="map-theme-legend"><span><i style={{background:"#7c3aed"}}/>CRR</span><span><i style={{background:"#f97316"}}/>PM</span><span><i style={{background:"#0891b2"}}/>Piézomètres</span></div><div className="notice-empty">{status}</div></section>
}
