export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import FormsManager from "@/components/admin/FormsManager";
import SyncLogs from "@/components/admin/SyncLogs";
import OperationalDataSettings from "@/components/admin/OperationalDataSettings";
import RequireAuth from "@/components/auth/RequireAuth";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export default function SynchronisationPage() {
  return <RequireAuth allowedRoles={[ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]}>
    <DashboardShell title="Synchronisation" subtitle="Epicollect5 vers Supabase">
      <OperationalDataSettings />
      <div style={{ height: 18 }} />
      <FormsManager />
      <div style={{ height: 18 }} />
      <SyncLogs />
    </DashboardShell>
  </RequireAuth>;
}
