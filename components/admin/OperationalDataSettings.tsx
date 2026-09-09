"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function OperationalDataSettings() {
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch("/api/admin/operational-date");
        if (cancelled) return;

        if (response.status === 403) {
          setVisible(false);
          return;
        }

        const payload = await response.json();
        if (cancelled) return;

        setVisible(true);
        if (payload.ok) {
          setDate(payload.date || "");
        } else {
          setMsg(payload.error || "Erreur lors du chargement du seuil opérationnel.");
        }
      } catch {
        if (!cancelled) {
          setVisible(true);
          setMsg("Impossible de charger la date opérationnelle.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(value: string) {
    setMsg("Enregistrement...");
    try {
      const response = await authFetch("/api/admin/operational-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: value }),
      });
      const payload = await response.json();

      if (payload.ok) {
        setDate(value);
        setMsg(
          value
            ? "Date opérationnelle enregistrée. Les tableaux de bord utiliseront cette date comme seuil."
            : "Seuil supprimé : mode test, toutes les mesures sont visibles."
        );
      } else {
        setMsg(`Erreur : ${payload.error || "enregistrement impossible"}`);
      }
    } catch {
      setMsg("Erreur : impossible d’enregistrer la date opérationnelle.");
    }
  }

  if (!visible) return null;

  return (
    <div className="panel">
      <h2>Bascule données réelles</h2>
      <p className="muted">
        Réservé au Super administrateur. Avant la date définie, les données restent stockées pour la
        traçabilité mais sont exclues des analyses opérationnelles.
      </p>
      <div className="filters-grid compact">
        <label>
          <span>Date de début des données opérationnelles</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>
      <div className="quick-actions">
        <button className="btn btn-primary" type="button" onClick={() => void save(date)}>
          Enregistrer
        </button>
        <button className="btn btn-soft" type="button" onClick={() => void save("")}>
          Effacer le seuil
        </button>
      </div>
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
