export const dynamic="force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import DocumentsManager from "@/components/admin/DocumentsManager";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";
export default function Page(){return <RequireAuth allowedRoles={[ROLE_ADMIN,ROLE_SUPER_ADMIN]}><DashboardShell title="Documents techniques" subtitle="Analyses d’eau et essais de pompage — Supabase Storage"><DocumentsManager/></DashboardShell></RequireAuth>}
