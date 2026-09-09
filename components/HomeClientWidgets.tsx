"use client";

import dynamic from "next/dynamic";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false, loading: () => <div className="notice-empty">Chargement de la carte…</div> });
const HydroTrend = dynamic(() => import("@/components/HydroTrend"), { ssr: false, loading: () => <div className="notice-empty">Chargement des tendances…</div> });

export default function HomeClientWidgets() {
  return <section className="section"><div className="grid-3">
    <div className="panel" style={{gridColumn:"span 2"}}><h2>Cartographie du dispositif PTCS</h2><ClientErrorBoundary label="Cartographie"><LeafletMap/></ClientErrorBoundary></div>
    <div className="panel"><h2>Tendances hydrologiques</h2><ClientErrorBoundary label="Tendances hydrologiques"><HydroTrend/></ClientErrorBoundary></div>
  </div></section>;
}
