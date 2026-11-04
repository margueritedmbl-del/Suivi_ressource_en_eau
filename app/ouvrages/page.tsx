import RequireAuth from "@/components/auth/RequireAuth";
import {ROLE_ADMIN,ROLE_SUPER_ADMIN} from "@/lib/permissions";
import DashboardShell from "@/components/DashboardShell";
import OuvragesIntegratedDashboard from "@/components/ouvrages/OuvragesIntegratedDashboard";

export default function OuvragesPage() {
  return <RequireAuth allowedRoles={[ROLE_ADMIN,ROLE_SUPER_ADMIN]}><DashboardShell title="Observatoire intégré des ouvrages" subtitle="Forages CRR et PM, piézomètres, analyses d’eau et micro-barrages réhabilités — Version 4.4.1">
    <OuvragesIntegratedDashboard />
  </DashboardShell></RequireAuth>;
}
