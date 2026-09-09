"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/components/auth/useRole";

export default function RequireAuth({
  children,
  allowedRoles,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}) {
  const { loading, authenticated, role } = useRole();
  const authorized = !allowedRoles?.length || allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && !authenticated) window.location.href = redirectTo;
  }, [loading, authenticated, redirectTo]);

  if (loading) {
    return <div className="auth-gate"><div className="panel"><h2>Vérification de l’accès...</h2><p className="muted">Veuillez patienter.</p></div></div>;
  }

  if (!authenticated) {
    return <div className="auth-gate"><div className="panel"><h2>Accès réservé</h2><p>Cette page est réservée aux utilisateurs connectés autorisés.</p><Link className="btn btn-primary" href="/login">Se connecter</Link></div></div>;
  }

  if (!authorized) {
    return <div className="auth-gate"><div className="panel"><h2>Accès non autorisé</h2><p>Votre rôle actuel ne permet pas d’ouvrir cette page.</p><p><span className="role-badge">Rôle : {role}</span></p><Link className="btn btn-soft" href="/dashboard">Retour au dashboard</Link></div></div>;
  }

  return <>{children}</>;
}
