export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import ProtectedActions from "@/components/auth/ProtectedActions";
import RequireAuth from "@/components/auth/RequireAuth";
import PointsEauDashboard from "@/components/dashboard/PointsEauDashboard";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardShell title="Inventaire des points d’eau" subtitle="Fonctionnalité, gouvernance, qualité de l’eau, priorisation et cartographie thématique">
        <div className="thematic-hero">
          <img src="/visuels/accueil-plateforme-eau.png" alt="Inventaire des points d'eau" />
          <div className="panel">
            <h2>Module Points d’eau — V2_4</h2>
            <p>Analyse dynamique des 540 points d’eau : forages, puits, équipements, organes de gestion, qualité de l’eau, besoins de réhabilitation et alertes qualité.</p>
            <ProtectedActions formUrl="https://five.epicollect.net/project/etat-des-lieux-pe-ptcs" syncUrl="/api/sync/points-eau" exportModule="points_eau" />
          </div>
        </div>
        <PointsEauDashboard />
      </DashboardShell>
    </RequireAuth>
  );
}
