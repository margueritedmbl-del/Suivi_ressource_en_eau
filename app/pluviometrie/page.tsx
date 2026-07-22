export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import ProtectedActions from "@/components/auth/ProtectedActions";
import RequireAuth from "@/components/auth/RequireAuth";
import ThematicModuleDashboard from "@/components/dashboard/ThematicModuleDashboard";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardShell title="Suivi pluviométrique" subtitle="Relevés, cumuls, alertes et cartographie thématique">
        <div className="thematic-hero"><img src="/visuels/logo-pluviometrie.png" alt="Suivi pluviométrique" /><div className="panel"><h2>Suivi pluviométrique — V2_4</h2><p>Tableau de bord dynamique avec KPI, filtres, évolution temporelle, carte et exports.</p><ProtectedActions formUrl="https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs" syncUrl="/api/sync/pluviometrie" exportModule="pluviometrie" /></div></div>
        <ThematicModuleDashboard module="pluviometrie" />
      </DashboardShell>
    </RequireAuth>
  );
}
