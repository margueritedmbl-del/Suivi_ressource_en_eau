"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("gireexpert@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Connexion en cours...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(
        "Erreur : " +
          error.message +
          " — Vérifiez NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, le mot de passe et l'exécution de /api/admin/bootstrap."
      );
      return;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (token) {
      try {
        const me = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
        if (String(me.role || "").includes("administrateur") || String(me.role || "").includes("Administrateur")) {
          window.location.href = "/admin";
          return;
        }
      } catch {}
    }
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={signIn}>
      <input
        className="input"
        placeholder="Adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} type="submit">
        Accéder à la plateforme
      </button>
      {message && <p style={{ color: "#64748b", textAlign: "center", marginTop: 14 }}>{message}</p>}
    </form>
  );
}
