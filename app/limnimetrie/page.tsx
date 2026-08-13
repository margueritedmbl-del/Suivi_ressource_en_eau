export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import ProtectedActions from "@/components/auth/ProtectedActions";
import RequireAuth from "@/components/auth/RequireAuth";
import ThematicModuleDashboard from "@/components/dashboard/ThematicModuleDashboard";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardShell title="Suivi limnimétrique" subtitle="Lectures d’échelles, évolution des hauteurs d’eau et alertes">
        <div className="thematic-hero"><img src="/visuels/logo-limnimetrie.png" alt="Suivi limnimétrique" /><div className="panel"><h2>Suivi limnimétrique — V2_4</h2><p>Tableau de bord dynamique des eaux de surface : KPI, carte, évolution temporelle, tableau et exports.</p><ProtectedActions formUrl="https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro" syncUrl="/api/sync/limnimetrie" exportModule="limnimetrie" /></div></div>
        <ThematicModuleDashboard module="limnimetrie" />
      </DashboardShell>
    </RequireAuth>
  );
}
