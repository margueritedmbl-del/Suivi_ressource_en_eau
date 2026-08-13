export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";import FormsManager from "@/components/admin/FormsManager";import RequireAuth from "@/components/auth/RequireAuth";import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";
export default function FormulairesPage(){return <RequireAuth allowedRoles={[ROLE_ADMIN, ROLE_SUPER_ADMIN]}><DashboardShell title="Formulaires Epicollect5" subtitle="Accès direct aux formulaires et sources API"><FormsManager/></DashboardShell></RequireAuth>}
