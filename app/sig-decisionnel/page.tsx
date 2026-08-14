export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import SigDecisionnelDashboard from "@/components/sig/SigDecisionnelDashboard";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export default function SigDecisionnelPage(){
  return <RequireAuth allowedRoles={[ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN]}>
    <DashboardShell title="SIG décisionnel" subtitle="Analyses spatiales, pressions, interventions et aide à la décision — PSORE V4.9.0">
      <SigDecisionnelDashboard />
    </DashboardShell>
  </RequireAuth>;
}
