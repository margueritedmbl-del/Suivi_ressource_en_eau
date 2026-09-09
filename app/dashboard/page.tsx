export const dynamic = "force-dynamic";

import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import InstitutionalDashboard from "@/components/dashboard/InstitutionalDashboard";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export default function Dashboard() {
  return (
    <RequireAuth allowedRoles={[ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN]}>
      <DashboardShell title="Dashboard institutionnel PSORE" subtitle="Pilotage consolidé des ressources en eau, points d’eau, alertes et synchronisations Epicollect5">
        <InstitutionalDashboard />
      </DashboardShell>
    </RequireAuth>
  );
}
