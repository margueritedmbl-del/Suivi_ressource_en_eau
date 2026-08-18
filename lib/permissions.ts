export const ROLE_PUBLIC = "Public";
export const ROLE_OBSERVATEUR = "Observateur";
export const ROLE_COLLECTEUR = "Collecteur";
export const ROLE_DNH = "DNH/DRHK";
export const ROLE_ADMIN = "Administrateur PTCS";
export const ROLE_SUPER_ADMIN = "Super administrateur";

const CONNECTED=[ROLE_OBSERVATEUR,ROLE_COLLECTEUR,ROLE_DNH,ROLE_ADMIN,ROLE_SUPER_ADMIN];
const DECISION=[ROLE_DNH,ROLE_ADMIN,ROLE_SUPER_ADMIN];
const ADMIN=[ROLE_ADMIN,ROLE_SUPER_ADMIN];

export const ACCESS_MATRIX={
  publicModules:[ROLE_PUBLIC,...CONNECTED],
  privateMap:CONNECTED,
  dashboard:DECISION,
  observatoire:DECISION,
  reports:DECISION,
  sigDecisionnel:DECISION,
  sync:ADMIN,
  userManagement:ADMIN,
  scenarioConfig:[ROLE_SUPER_ADMIN],
  finances:[ROLE_SUPER_ADMIN],
} as const;

function has(roles:readonly string[],role?:string){return roles.includes(role||ROLE_PUBLIC);}
export function canViewInternal(role?:string){return has(CONNECTED,role);}
export function canAccessDashboard(role?:string){return has(DECISION,role);}
export function canAccessObservatoire(role?:string){return has(DECISION,role);}
export function canAccessReports(role?:string){return has(DECISION,role);}
export function canAccessSigDecisionnel(role?:string){return has(DECISION,role);}
export function canAccessPrivateMap(role?:string){return has(CONNECTED,role);}
export function canExportCsvXlsx(role?:string){return has(DECISION,role);}
export function canExportAdvanced(role?:string){return has(DECISION,role);}
export function canSync(role?:string){return has(ADMIN,role);}
export function canManageUsers(role?:string){return has(ADMIN,role);}
export function canConfigureScenarios(role?:string){return role===ROLE_SUPER_ADMIN;}
export function canViewFinances(role?:string){return role===ROLE_SUPER_ADMIN;}
