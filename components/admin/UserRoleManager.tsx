"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  let out = "Psore_";
  for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function UserRoleManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  async function load() {
    const r = await authFetch("/api/admin/users");
    const j = await r.json();
    if (!j.ok) { setMsg("Erreur : " + j.error); return; }
    setUsers(j.users || []);
    setRoles(j.roles || []);
  }

  useEffect(() => { load(); }, []);

  async function updateUser(user_id: string, patch: any) {
    setMsg("Mise à jour...");
    const r = await authFetch("/api/admin/users/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, ...patch }),
    });
    const j = await r.json();
    setMsg(j.ok ? "Utilisateur mis à jour." : "Erreur : " + j.error);
    await load();
  }

  async function resetUserPassword(user_id: string) {
    const pwd = resetPassword || generatePassword();
    setMsg("Réinitialisation...");
    const r = await authFetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, password: pwd }),
    });
    const j = await r.json();
    if (j.ok) {
      await navigator.clipboard.writeText(pwd);
      setMsg("Mot de passe réinitialisé et copié dans le presse-papiers.");
      setResetPassword("");
    } else {
      setMsg("Erreur : " + j.error);
    }
  }

  return (
    <div className="panel">
      <h2>Gestion des rôles et comptes</h2>
      <p style={{ color: "#64748b" }}>Attribuer les rôles, activer/désactiver un compte et réinitialiser un mot de passe.</p>
      {msg && <p><strong>{msg}</strong></p>}
      <div className="quick-actions" style={{ alignItems: "center", marginBottom: 12 }}>
        <input className="input" placeholder="Mot de passe de réinitialisation (optionnel)" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
        <button className="btn btn-soft" onClick={() => setResetPassword(generatePassword())}>Générer</button>
      </div>
      <table className="table">
        <thead><tr><th>Email</th><th>Nom</th><th>Rôle actuel</th><th>Nouveau rôle</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{[u.prenom, u.nom].filter(Boolean).join(" ") || "—"}</td>
              <td>{u.roles?.nom_role || "Non attribué"}</td>
              <td>
                <select className="input" value={u.role_id || ""} onChange={(e) => updateUser(u.id, { role_id: e.target.value, actif: u.actif !== false })}>
                  <option value="" disabled>Choisir</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.nom_role}</option>)}
                </select>
              </td>
              <td>{u.actif ? "Actif" : "Désactivé"}</td>
              <td>
                <div className="quick-actions">
                  <button className="btn btn-soft" onClick={() => updateUser(u.id, { actif: !u.actif, role_id: u.role_id })}>{u.actif ? "Désactiver" : "Activer"}</button>
                  <button className="btn btn-soft" onClick={() => resetUserPassword(u.id)}>Réinitialiser MDP</button>
                </div>
              </td>
            </tr>
          ))}
          {!users.length && <tr><td colSpan={6}>Aucun profil trouvé. Configurez ADMIN_PASSWORD puis ouvrez /api/admin/bootstrap.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
