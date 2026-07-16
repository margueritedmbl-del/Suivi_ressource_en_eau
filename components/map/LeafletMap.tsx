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
  const ref = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), layerRef = useRef<any>(null);
  const [status, setStatus] = useState("Chargement...");
  const [theme, setTheme] = useState("fonctionnalite");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [enabled, setEnabled] = useState<Record<ModuleKey, boolean>>({ points_eau: true, piezometrie: false, pluviometrie: false, limnimetrie: false });
  const selectedModules = useMemo(() => module ? [module] : allModules.filter((m) => enabled[m]), [module, enabled]);

  useEffect(() => {
    async function init() {
      if (!document.getElementById("leaflet-css")) { const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
      if (!window.L) await new Promise<void>((resolve) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = () => resolve(); document.body.appendChild(s); });
      if (!ref.current || mapRef.current) return;
      const L = window.L;
      const map = L.map(ref.current).setView([12.86, -7.56], 8); mapRef.current = map;
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
      const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles © Esri" });
      osm.addTo(map); L.control.layers({ OpenStreetMap: osm, Satellite: sat }, {}, { collapsed: true }).addTo(map);
      try { const b = await fetch("/data/admin-boundaries.geojson").then((r) => r.json()); L.geoJSON(b, { style: (f: any) => ({ color: f.properties.level === "Pays" ? "#5B2A86" : "#2D6A4F", weight: 2, fillOpacity: .05 }), onEachFeature: (f: any, l: any) => l.bindPopup(`${safe(f.properties.level)} : ${safe(f.properties.name)}`) }).addTo(map); } catch {}
    }
    init();
  }, []);

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
      const j = await request.then((r) => r.json());
      setSummary(j.summary || {});
      const pts = (j.data || []).filter((p: any) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)));
      if (!pts.length) { setStatus("Aucune donnée GPS à afficher pour le filtre choisi."); return; }
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
    {!module && <div className="map-tools module-filter-tools">{allModules.map((m) => <button key={m} className={enabled[m] ? "btn btn-primary" : "btn btn-soft"} onClick={() => setEnabled((e) => ({ ...e, [m]: !e[m] }))}>{moduleLabels[m]} ({summary[m] ?? 0})</button>)}</div>}
    {module === "points_eau" && <><div className="map-tools">{themes.map(([k, label]) => <button key={k} className={theme === k ? "btn btn-primary" : "btn btn-soft"} onClick={() => setTheme(k)}>{label}</button>)}</div><div className="map-theme-legend">{(themeLegends[theme] || []).map(([label, color]) => <span key={label}><i style={{ background: color }}></i>{label}</span>)}</div></>}
    <div ref={ref} className="map-real"></div>
    <div className="map-legend"><strong>Légende</strong>{allModules.filter((m) => module ? m === module : enabled[m]).map((m) => <span key={m}><i style={{background: moduleColors[m]}}></i>{moduleLabels[m]}</span>)}{module === "points_eau" && <small>Thème actif : {themes.find((t) => t[0] === theme)?.[1]}. Les détails avancés sont réservés aux utilisateurs connectés.</small>}</div>
    <div className="notice-empty">{status}</div>
  </div>;
}
