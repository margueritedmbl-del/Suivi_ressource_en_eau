export const dynamic = "force-dynamic";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import LeafletMap from "@/components/map/LeafletMap";

export default function Page() {
  return (
    <DashboardShell title="Cartographie générale" subtitle="Carte publique limitée et détails complets après connexion autorisée">
      <div className="panel">
        <h2>Cartographie du dispositif PTCS</h2>
        <p className="muted">Les bassins versants sont visibles par défaut. Activez ou désactivez les sous-bassins, communes du projet, restaurations, drainage et réseaux de suivi selon le besoin. Les détails publics restent limités aux informations non sensibles.</p>
        <div className="map-tools"><Link className="btn btn-soft" href="/cartographie/privee">Ouvrir la cartographie privée</Link></div>
        <LeafletMap />
      </div>
    </DashboardShell>
  );
}
