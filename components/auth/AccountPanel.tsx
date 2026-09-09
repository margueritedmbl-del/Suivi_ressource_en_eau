"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/components/auth/useRole";

export default function AccountPanel() {
  const { role } = useRole();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setMsg("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setMsg("Les deux mots de passe ne correspondent pas."); return; }
    setMsg("Mise à jour en cours...");
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(error ? `Erreur : ${error.message}` : "Mot de passe modifié avec succès.");
    if (!error) { setPassword(""); setConfirm(""); }
  }
  async function logout() { await supabase.auth.signOut(); window.location.href = "/login"; }
  return <div className="grid-2"><div className="panel"><h2>Informations du compte</h2><p><span className="role-badge">Rôle : {role}</span></p><p className="muted">Utilisez cette page après le déploiement pour remplacer le mot de passe temporaire communiqué par l’administrateur.</p><button className="btn btn-soft" onClick={logout}>Se déconnecter</button></div><div className="panel"><h2>Modifier le mot de passe</h2><form onSubmit={changePassword}><input className="input" type="password" placeholder="Nouveau mot de passe" value={password} onChange={(e)=>setPassword(e.target.value)} /><input className="input" type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={(e)=>setConfirm(e.target.value)} /><button className="btn btn-primary" style={{marginTop:14}}>Mettre à jour</button></form>{msg && <p><strong>{msg}</strong></p>}</div></div>;
}
