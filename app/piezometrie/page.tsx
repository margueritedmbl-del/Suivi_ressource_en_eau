export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import ProtectedActions from "@/components/auth/ProtectedActions";
import RequireAuth from "@/components/auth/RequireAuth";
import ThematicModuleDashboard from "@/components/dashboard/ThematicModuleDashboard";
import PiezoReferenceComparison from "@/components/piezometrie/PiezoReferenceComparison";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardShell title="Suivi piézométrique" subtitle="Niveaux statiques, tendances de nappe, alertes et cartographie">
        <div className="thematic-hero"><img src="/visuels/logo-piezometrie.jpeg" alt="Suivi piézométrique" /><div className="panel"><h2>Suivi piézométrique — V4.4</h2><p>Analyse dynamique des observations piézométriques, filtres par site/commune, évolution et exports.</p><ProtectedActions formUrl="https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs" syncUrl="/api/sync/piezometrie" exportModule="piezometrie" /></div></div>
        <PiezoReferenceComparison />
        <ThematicModuleDashboard module="piezometrie" />
      </DashboardShell>
    </RequireAuth>
  );
}
