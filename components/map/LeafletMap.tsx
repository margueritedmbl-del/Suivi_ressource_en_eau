"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-client";

declare global { interface Window { L: any } }

type ModuleKey = "pluviometrie" | "piezometrie" | "limnimetrie" | "points_eau";
type BoundaryKey = "bassins" | "sousBassins" | "administratif";
type LayerStyle = { stroke: string; fill: string; weight: number; opacity: number; fillOpacity: number; dashArray: string };
type SpatialSelection = { layer: BoundaryKey; id: string; label: string; geometry: any } | null;

const moduleColors: Record<ModuleKey, string> = { points_eau: "#0077B6", piezometrie: "#48CAE4", pluviometrie: "#7C3AED", limnimetrie: "#16A34A" };
const moduleLabels: Record<ModuleKey, string> = { points_eau: "Point d’eau", piezometrie: "Piézomètre", pluviometrie: "Pluviomètre", limnimetrie: "Limnimètre" };
const allModules: ModuleKey[] = ["points_eau", "piezometrie", "pluviometrie", "limnimetrie"];
const layerLabels: Record<BoundaryKey, string> = { bassins: "Bassins", sousBassins: "Sous-bassins", administratif: "Limites administratives" };
const layerUrls: Record<BoundaryKey, string> = { bassins: "/data/hydrographie/grand_bassin.geojson", sousBassins: "/data/hydrographie/sous_bassins.geojson", administratif: "/data/admin-boundaries.geojson" };
const defaultStyles: Record<BoundaryKey, LayerStyle> = {
  bassins: { stroke: "#0f4c81", fill: "#60a5fa", weight: 3, opacity: 0.95, fillOpacity: 0.10, dashArray: "" },
  sousBassins: { stroke: "#0891b2", fill: "#67e8f9", weight: 1.4, opacity: 0.85, fillOpacity: 0.05, dashArray: "5 4" },
  administratif: { stroke: "#475569", fill: "#cbd5e1", weight: 1.7, opacity: 0.85, fillOpacity: 0.02, dashArray: "8 5" },
};
const themes = [["fonctionnalite", "Fonctionnalité"], ["type", "Type d’ouvrage"], ["rehabilitation", "Réhabilitation"], ["equipement", "Équipement"], ["organe", "Organe de gestion"], ["qualite", "Qualité eau"], ["donnees", "Qualité données"]];
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
function ringContains(point: [number, number], ring: number[][]) { let inside = false; const [x, y] = point; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; const hit = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi; if (hit) inside = !inside; } return inside; }
function polygonContains(point: [number, number], polygon: number[][][]) { if (!polygon?.length || !ringContains(point, polygon[0])) return false; for (let i = 1; i < polygon.length; i++) if (ringContains(point, polygon[i])) return false; return true; }
function geometryContains(geometry: any, point: [number, number]) { if (!geometry) return false; if (geometry.type === "Polygon") return polygonContains(point, geometry.coordinates); if (geometry.type === "MultiPolygon") return geometry.coordinates.some((polygon: number[][][]) => polygonContains(point, polygon)); return false; }
function featureIdentity(key: BoundaryKey, feature: any, index: number) { const p = feature.properties || {}; if (key === "bassins") return { id: String(p.Num_bassin ?? p.nom ?? index + 1), label: String(p.Nom ?? p.nom ?? `Bassin ${p.Num_bassin ?? index + 1}`) }; if (key === "sousBassins") return { id: String(p.HydroID ?? p.OBJECTID ?? index + 1), label: String(p.Nom ?? p.nom ?? `Sous-bassin ${p.HydroID ?? p.OBJECTID ?? index + 1}`) }; return { id: String(p.code ?? p.name ?? index + 1), label: String(p.name ?? p.nom ?? `Limite ${index + 1}`) }; }
function attributeRows(properties: Record<string, any>, publicView: boolean) { const entries = Object.entries(properties || {}).filter(([, v]) => v !== null && v !== ""); const shown = publicView ? entries.slice(0, 3) : entries.slice(0, 12); return shown.map(([k, v]) => `<tr><th>${safe(k)}</th><td>${safe(v)}</td></tr>`).join(""); }

export default function LeafletMap({ module }: { module?: ModuleKey }) {
  const ref = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), pointLayerRef = useRef<any>(null);
  const boundaryRefs = useRef<Partial<Record<BoundaryKey, any>>>({});
  const boundaryDataRef = useRef<Partial<Record<BoundaryKey, any>>>({});
  const allPointsRef = useRef<any[]>([]);
  const selectionRef = useRef<SpatialSelection>(null);
  const [status, setStatus] = useState("Chargement...");
  const [boundaryStatus, setBoundaryStatus] = useState("");
  const [theme, setTheme] = useState("fonctionnalite");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [enabled, setEnabled] = useState<Record<ModuleKey, boolean>>({ points_eau: true, piezometrie: false, pluviometrie: false, limnimetrie: false });
  const [boundaryEnabled, setBoundaryEnabled] = useState<Record<BoundaryKey, boolean>>({ bassins: true, sousBassins: false, administratif: false });
  const [styles, setStyles] = useState<Record<BoundaryKey, LayerStyle>>(defaultStyles);
  const [selection, setSelection] = useState<SpatialSelection>(null);
  const [spatialStats, setSpatialStats] = useState<Record<string, number>>({});
  const [styleOpen, setStyleOpen] = useState(false);
  const selectedModules = useMemo(() => module ? [module] : allModules.filter((m) => enabled[m]), [module, enabled]);
  const publicView = !module;

  useEffect(() => { try { const stored = localStorage.getItem("psore-boundary-styles-v1"); if (stored) setStyles({ ...defaultStyles, ...JSON.parse(stored) }); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("psore-boundary-styles-v1", JSON.stringify(styles)); } catch {} }, [styles]);
  useEffect(() => { selectionRef.current = selection; }, [selection]);

  function selectedPoints(points = allPointsRef.current) { const current = selectionRef.current; if (!current) return points; return points.filter((p) => geometryContains(current.geometry, [Number(p.longitude), Number(p.latitude)])); }
  function computeStats(points: any[]) { const stats: Record<string, number> = { total: points.length, points_eau: 0, piezometrie: 0, pluviometrie: 0, limnimetrie: 0, fonctionnels: 0, alertes: 0 }; points.forEach((p) => { stats[p.module] = (stats[p.module] || 0) + 1; const s = String(p.statut_fonctionnalite || "").toLowerCase(); if (s.includes("fonctionnel") && !s.includes("non")) stats.fonctionnels++; if (p.alerte_qualite_eau || p.alerte_gps || s.includes("non fonctionnel")) stats.alertes++; }); return stats; }
  function renderPoints(points: any[]) { if (!window.L || !mapRef.current) return; const L = window.L, map = mapRef.current; if (pointLayerRef.current) map.removeLayer(pointLayerRef.current); const g = L.featureGroup(); points.forEach((p: any) => { const mod = p.module as ModuleKey; const color = p.couleur || moduleColors[mod] || "#111827"; const html = p.popup_html || `<strong>${safe(moduleLabels[mod] || mod)}</strong><br/>${safe(p.libelle || p.code || "")}`; L.circleMarker([Number(p.latitude), Number(p.longitude)], { pane: "monitoringPoints", radius: mod === "points_eau" ? 7 : 8, color: "white", weight: 2, fillColor: color, fillOpacity: .95 }).bindPopup(html).addTo(g); }); g.addTo(map); pointLayerRef.current = g; setSpatialStats(computeStats(points)); if (points.length) { try { map.fitBounds(g.getBounds().pad(.18)); } catch {} } setStatus(`${points.length} point(s) GPS affiché(s)${selectionRef.current ? ` dans ${selectionRef.current.label}` : ""}.`); }

  function applySelection(next: SpatialSelection) { setSelection(next); selectionRef.current = next; const points = next ? selectedPoints(allPointsRef.current) : allPointsRef.current; renderPoints(points); const detail = next ? { layer: next.layer, id: next.id, label: next.label } : null; try { if (detail) localStorage.setItem("psore-spatial-filter", JSON.stringify(detail)); else localStorage.removeItem("psore-spatial-filter"); } catch {} window.dispatchEvent(new CustomEvent("psore:spatial-filter", { detail })); }

  useEffect(() => {
    async function init() {
      if (!document.getElementById("leaflet-css")) { const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
      if (!window.L) await new Promise<void>((resolve) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = () => resolve(); document.body.appendChild(s); });
      if (!ref.current || mapRef.current) return;
      const L = window.L, map = L.map(ref.current).setView([12.86, -7.56], 8); mapRef.current = map;
      map.createPane("boundaries"); map.getPane("boundaries").style.zIndex = "310"; map.createPane("monitoringPoints"); map.getPane("monitoringPoints").style.zIndex = "450";
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
      const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles © Esri" });
      osm.addTo(map); L.control.layers({ OpenStreetMap: osm, Satellite: sat }, {}, { collapsed: true }).addTo(map);
    }
    init();
  }, []);

  useEffect(() => {
    async function syncBoundaries() {
      if (!window.L || !mapRef.current) return; const L = window.L, map = mapRef.current;
      for (const key of Object.keys(layerLabels) as BoundaryKey[]) {
        const existing = boundaryRefs.current[key];
        if (!boundaryEnabled[key]) { if (existing && map.hasLayer(existing)) map.removeLayer(existing); continue; }
        try {
          let data = boundaryDataRef.current[key]; if (!data) { const response = await fetch(layerUrls[key]); if (!response.ok) throw new Error(`HTTP ${response.status}`); data = await response.json(); boundaryDataRef.current[key] = data; }
          if (existing) { existing.setStyle(() => ({ pane: "boundaries", color: styles[key].stroke, fillColor: styles[key].fill, weight: styles[key].weight, opacity: styles[key].opacity, fillOpacity: styles[key].fillOpacity, dashArray: styles[key].dashArray })); if (!map.hasLayer(existing)) existing.addTo(map); continue; }
          const layer = L.geoJSON(data, {
            pane: "boundaries",
            style: () => ({ color: styles[key].stroke, fillColor: styles[key].fill, weight: styles[key].weight, opacity: styles[key].opacity, fillOpacity: styles[key].fillOpacity, dashArray: styles[key].dashArray }),
            onEachFeature: (feature: any, featureLayer: any) => {
              const index = feature?.properties?.OBJECTID ?? feature?.properties?.Num_bassin ?? 0; const ident = featureIdentity(key, feature, Number(index));
              const stats = computeStats(allPointsRef.current.filter((p) => geometryContains(feature.geometry, [Number(p.longitude), Number(p.latitude)])));
              const statsHtml = `<div class="spatial-popup-stats"><b>${stats.total}</b> sites • PE ${stats.points_eau} • PZ ${stats.piezometrie} • PL ${stats.pluviometrie} • LIM ${stats.limnimetrie}${publicView ? "" : ` • Alertes ${stats.alertes}`}</div>`;
              const html = `<div class="spatial-popup"><h4>${safe(ident.label)}</h4>${statsHtml}<table>${attributeRows(feature.properties || {}, publicView)}</table><button type="button" class="psore-spatial-filter-btn">Filtrer les données sur cette zone</button></div>`;
              featureLayer.bindPopup(html, { maxWidth: 360 }); featureLayer.on("popupopen", (event: any) => { const btn = event.popup.getElement()?.querySelector(".psore-spatial-filter-btn"); if (btn) btn.onclick = () => { applySelection({ layer: key, id: ident.id, label: ident.label, geometry: feature.geometry }); map.closePopup(); }; });
              if (key === "bassins") featureLayer.bindTooltip(ident.label, { permanent: true, direction: "center", className: "basin-label" });
            },
          });
          layer.addTo(map); boundaryRefs.current[key] = layer;
          if (key === "bassins") { const updateLabels = () => layer.eachLayer((item: any) => { if (!item.getTooltip()) return; if (map.getZoom() >= 7) item.openTooltip(); else item.closeTooltip(); }); map.on("zoomend", updateLabels); updateLabels(); }
        } catch (error: any) { setBoundaryStatus(`Échec du chargement de ${layerLabels[key]} : ${error?.message || "erreur"}`); }
      }
      const active = (Object.keys(boundaryEnabled) as BoundaryKey[]).filter((key) => boundaryEnabled[key]); setBoundaryStatus(active.length ? `${active.map((key) => layerLabels[key]).join(", ")} actif(s).` : "Toutes les limites sont masquées.");
    }
    syncBoundaries();
  }, [boundaryEnabled, styles, publicView]);

  useEffect(() => {
    async function loadPoints() {
      if (!window.L || !mapRef.current) return; const params = new URLSearchParams(); params.set("theme", theme); params.set("modules", selectedModules.length ? selectedModules.join(",") : "none"); params.set("detail", module ? "connected" : "public");
      try { const request = module ? authFetch(`/api/map/points?${params}`) : fetch(`/api/map/points?${params}`); const j = await request.then((r) => r.json()); setSummary(j.summary || {}); const pts = (j.data || []).filter((p: any) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))); allPointsRef.current = pts; renderPoints(selectedPoints(pts)); setStatus(`${selectedPoints(pts).length} point(s) GPS affiché(s). Source : ${j.source}`); } catch (error: any) { setStatus(`Impossible de charger les points : ${error?.message || "erreur"}`); }
    }
    loadPoints();
  }, [module, theme, selectedModules.join(",")]);

  function zoomToBoundaries() { const active = (Object.keys(boundaryRefs.current) as BoundaryKey[]).filter((key) => boundaryEnabled[key] && boundaryRefs.current[key]); if (!active.length || !mapRef.current) return; try { mapRef.current.fitBounds(window.L.featureGroup(active.map((key) => boundaryRefs.current[key])).getBounds().pad(.04)); } catch {} }
  function updateStyle(key: BoundaryKey, patch: Partial<LayerStyle>) { setStyles((current) => ({ ...current, [key]: { ...current[key], ...patch } })); }

  return <div>
    {!module && <div className="map-tools module-filter-tools">{allModules.map((m) => <button key={m} className={enabled[m] ? "btn btn-primary" : "btn btn-soft"} onClick={() => setEnabled((e) => ({ ...e, [m]: !e[m] }))}>{moduleLabels[m]} ({summary[m] ?? 0})</button>)}</div>}
    <section className="boundary-panel">
      <div className="boundary-panel-header"><div><strong>Couches territoriales</strong><small>Bassins, sous-bassins et limites administratives</small></div><button className="btn btn-soft" onClick={() => setStyleOpen((v) => !v)}>{styleOpen ? "Fermer la palette" : "Palette des styles"}</button></div>
      <div className="map-tools boundary-toggle-tools">{(Object.keys(layerLabels) as BoundaryKey[]).map((key) => <button key={key} className={boundaryEnabled[key] ? "btn btn-primary" : "btn btn-soft"} onClick={() => setBoundaryEnabled((current) => ({ ...current, [key]: !current[key] }))}>{boundaryEnabled[key] ? "✓ " : ""}{layerLabels[key]}</button>)}<button className="btn btn-soft" onClick={() => setBoundaryEnabled({ bassins: true, sousBassins: true, administratif: true })}>Tout afficher</button><button className="btn btn-soft" onClick={() => setBoundaryEnabled({ bassins: false, sousBassins: false, administratif: false })}>Tout masquer</button><button className="btn btn-soft" onClick={zoomToBoundaries}>Zoom sur les couches</button></div>
      {styleOpen && <div className="boundary-style-grid">{(Object.keys(layerLabels) as BoundaryKey[]).map((key) => <div className="boundary-style-card" key={key}><h4>{layerLabels[key]}</h4><label>Contour <input type="color" value={styles[key].stroke} onChange={(e) => updateStyle(key, { stroke: e.target.value })}/></label><label>Remplissage <input type="color" value={styles[key].fill} onChange={(e) => updateStyle(key, { fill: e.target.value })}/></label><label>Épaisseur <input type="range" min="0.5" max="6" step="0.1" value={styles[key].weight} onChange={(e) => updateStyle(key, { weight: Number(e.target.value) })}/><span>{styles[key].weight}</span></label><label>Opacité contour <input type="range" min="0" max="1" step="0.05" value={styles[key].opacity} onChange={(e) => updateStyle(key, { opacity: Number(e.target.value) })}/><span>{Math.round(styles[key].opacity * 100)}%</span></label><label>Opacité remplissage <input type="range" min="0" max="0.8" step="0.02" value={styles[key].fillOpacity} onChange={(e) => updateStyle(key, { fillOpacity: Number(e.target.value) })}/><span>{Math.round(styles[key].fillOpacity * 100)}%</span></label><label>Trait <select value={styles[key].dashArray} onChange={(e) => updateStyle(key, { dashArray: e.target.value })}><option value="">Continu</option><option value="5 4">Tirets courts</option><option value="10 6">Tirets longs</option><option value="2 5">Pointillé</option></select></label></div>)}</div>}
    </section>
    {selection && <div className="spatial-selection-banner"><div><strong>Filtre spatial actif : {selection.label}</strong><small>{spatialStats.total || 0} sites • {spatialStats.points_eau || 0} points d’eau • {spatialStats.piezometrie || 0} piézomètres • {spatialStats.pluviometrie || 0} pluviomètres • {spatialStats.limnimetrie || 0} limnimètres{publicView ? "" : ` • ${spatialStats.alertes || 0} alertes`}</small></div><button className="btn btn-soft" onClick={() => applySelection(null)}>Effacer le filtre</button></div>}
    {module === "points_eau" && <><div className="map-tools">{themes.map(([k, label]) => <button key={k} className={theme === k ? "btn btn-primary" : "btn btn-soft"} onClick={() => setTheme(k)}>{label}</button>)}</div><div className="map-theme-legend">{(themeLegends[theme] || []).map(([label, color]) => <span key={label}><i style={{ background: color }}></i>{label}</span>)}</div></>}
    <div ref={ref} className="map-real"></div>
    <div className="map-legend"><strong>Légende</strong>{allModules.filter((m) => module ? m === module : enabled[m]).map((m) => <span key={m}><i style={{background: moduleColors[m]}}></i>{moduleLabels[m]}</span>)}{(Object.keys(layerLabels) as BoundaryKey[]).filter((key) => boundaryEnabled[key]).map((key) => <span key={key}><i className="legend-boundary" style={{ borderColor: styles[key].stroke, background: styles[key].fill, opacity: Math.max(styles[key].opacity, .45) }}></i>{layerLabels[key]}</span>)}</div>
    <div className="notice-empty">{status}<br/><small>{boundaryStatus}</small></div>
  </div>;
}
