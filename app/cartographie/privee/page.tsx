export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import LeafletMap from "@/components/map/LeafletMap";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardShell title="Cartographie privée" subtitle="Couches détaillées réservées aux utilisateurs connectés autorisés">
        <div className="panel">
          <h2>Cartographie analytique PSORE</h2>
          <p className="muted">La carte privée donne accès aux pop-up détaillées et aux légendes thématiques. Les données personnelles restent masquées.</p>
          <LeafletMap module="points_eau" />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
