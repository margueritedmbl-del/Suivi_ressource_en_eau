export const ROLE_PUBLIC = "Public";
export const ROLE_OBSERVATEUR = "Observateur";
export const ROLE_COLLECTEUR = "Collecteur";
export const ROLE_DNH = "DNH/DRHK";
export const ROLE_ADMIN = "Administrateur PTCS";
export const ROLE_SUPER_ADMIN = "Super administrateur";

const INTERNAL_ROLES = [ROLE_OBSERVATEUR, ROLE_COLLECTEUR, ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const DASHBOARD_ROLES = [ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const OPERATE_ROLES = [ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const MANAGE_ROLES = [ROLE_ADMIN, ROLE_SUPER_ADMIN];

export function canViewInternal(role?: string) {
  return INTERNAL_ROLES.includes(role || ROLE_PUBLIC);
}
export function canAccessDashboard(role?: string) {
  return DASHBOARD_ROLES.includes(role || ROLE_PUBLIC);
}
export function canAccessObservatoire(role?: string) {
  return [ROLE_ADMIN, ROLE_SUPER_ADMIN].includes(role || ROLE_PUBLIC);
}
export function canAccessReports(role?: string) {
  return DASHBOARD_ROLES.includes(role || ROLE_PUBLIC);
}
export function canExportCsvXlsx(role?: string) {
  return OPERATE_ROLES.includes(role || ROLE_PUBLIC);
}
export function canExportAdvanced(role?: string) {
  return [ROLE_ADMIN, ROLE_SUPER_ADMIN].includes(role || ROLE_PUBLIC);
}
export function canSync(role?: string) {
  return OPERATE_ROLES.includes(role || ROLE_PUBLIC);
}
export function canManageUsers(role?: string) {
  return MANAGE_ROLES.includes(role || ROLE_PUBLIC);
}
