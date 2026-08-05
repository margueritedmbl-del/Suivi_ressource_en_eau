"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ROLE_ADMIN, ROLE_DNH, ROLE_PUBLIC, canAccessDashboard, canAccessObservatoire, canAccessReports, canExportAdvanced, canExportCsvXlsx, canManageUsers, canSync, canViewInternal } from "@/lib/permissions";

export function useRole() {
  const [role, setRole] = useState(ROLE_PUBLIC);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setRole(json.role || ROLE_PUBLIC);
      } catch {
        setRole(ROLE_PUBLIC);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return {
    role,
    loading,
    authenticated,
    isAdmin: role === ROLE_ADMIN,
    isDnh: role === ROLE_DNH,
    canManage: canManageUsers(role),
    canOperate: canSync(role),
    canSync: canSync(role),
    canExportCsvXlsx: canExportCsvXlsx(role),
    canExportAdvanced: canExportAdvanced(role),
    canViewInternal: canViewInternal(role),
    canAccessDashboard: canAccessDashboard(role),
    canAccessObservatoire: canAccessObservatoire(role),
    canAccessReports: canAccessReports(role),
  };
}
