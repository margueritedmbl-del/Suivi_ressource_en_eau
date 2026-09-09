export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, modules: [
    { key: "points_eau", label: "Point d’eau", color: "#0077B6", publicDefault: true },
    { key: "piezometrie", label: "Piézomètre", color: "#48CAE4", publicDefault: false },
    { key: "pluviometrie", label: "Pluviomètre", color: "#7C3AED", publicDefault: false },
    { key: "limnimetrie", label: "Limnimètre", color: "#16A34A", publicDefault: false },
  ], themes: {
    fonctionnalite: ["Fonctionnel", "Non fonctionnel", "Partiel", "Abandonné", "Non renseigné"],
    type: ["Forage", "Puits", "Non renseigné"],
    rehabilitation: ["Priorité élevée", "Priorité moyenne", "Priorité faible"],
    equipement: ["PMH", "SHVA/SHPA", "SAEP/SAES", "Non équipé", "Autre"],
    organe: ["Organe présent", "Organe absent", "Non renseigné"],
    qualite: ["Qualité normale", "Alerte qualité"],
    donnees: ["Données GPS OK", "GPS manquant"],
  }});
}
