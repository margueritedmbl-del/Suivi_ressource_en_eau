export const dynamic = "force-dynamic";
import Topbar from "@/components/Topbar";
import ModuleCard from "@/components/ModuleCard";
import Link from "next/link";
import PublicStats from "@/components/PublicStats";
import LeafletMap from "@/components/map/LeafletMap";
import HydroTrend from "@/components/HydroTrend";

export default function Home(){
  return <div>
    <Topbar/>
    <section className="hero">
      <div className="hero-inner">
        <div>
          <span className="eyebrow">🌍 eau-ptcs-mali.org • Koulikoro</span>
          <h1>Plateforme de Suivi des Ressources en Eau</h1>
          <p>Données fiables, décisions éclairées, ressources durables. Un portail institutionnel pour collecter, surveiller, analyser et décider à partir des données du PTCS Volet Mali.</p>
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary">Connexion</Link>
            <Link href="/cartographie" className="btn btn-white">Voir la cartographie</Link>
          </div>
        </div>
        <div>
          <img className="home-visual-poster" src="/visuels/accueil-plateforme-eau.png" alt="Plateforme de Suivi des Ressources en Eau"/>
        </div>
      </div>
    </section>

    <div className="partner-strip"><div className="partner-box"><img src="/logos/mali-header.jpg" alt="République du Mali"/><img src="/logos/enabel.png" alt="Enabel"/><img src="/logos/dnh.png" alt="DNH"/><img src="/logos/psore.png" alt="PSORE"/></div></div>

    <section className="section">
      <div className="section-head"><div><h2>Modules de suivi</h2><p>Modules visibles en accès public. L’ouverture des détails est réservée aux utilisateurs connectés autorisés.</p></div></div>
      <div className="grid-4">
        <ModuleCard href="/pluviometrie" icon="🌧️" title="Pluviométrie" text="Relevés quotidiens et cumuls mensuels des précipitations."/>
        <ModuleCard href="/piezometrie" icon="💧" title="Piézométrie" text="Niveaux statiques journaliers et tendances des nappes."/>
        <ModuleCard href="/limnimetrie" icon="🌊" title="Limnimétrie" text="Lectures matin/soir et suivi des eaux de surface."/>
        <ModuleCard href="/points-eau" icon="🚰" title="Points d'eau" text="Inventaire, contrôles, fonctionnalité et pannes."/>
      </div>
    </section>

    <section className="section"><div className="grid-3"><div className="panel" style={{gridColumn:"span 2"}}><h2>Cartographie du dispositif PTCS</h2><LeafletMap/></div><div className="panel"><h2>Tendances hydrologiques</h2><HydroTrend/></div></div></section>
    <section className="section"><div className="section-head"><div><h2>Statistiques publiques</h2><p>Données agrégées non sensibles, mises à jour après synchronisation.</p></div></div><PublicStats/></section>
    <footer className="footer">PSORE – PTCS – Enabel – DNH/DRHK | Plateforme de Suivi et d'Observation des Ressources en Eau</footer>
  </div>
}
