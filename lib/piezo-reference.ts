import piezoReference from "@/public/data/referentiels/piezometres_reference.json";

export type PiezoReference = {
  code: string;
  commune: string;
  village: string;
  point_implantation?: string;
  latitude?: number;
  longitude?: number;
  profondeur_totale_m?: number;
  niveau_statique_m?: number;
  date_essai?: string;
  debit_developpement_m3h?: number;
  rabattement_max_m?: number;
};

const ALIASES: Record<string, string> = {
  "NIAMAKOROBOUGOU": "GNAMAKOROBOUGOU",
  "NIAMAKORO BOUGOU": "GNAMAKOROBOUGOU",
  "WOLOKORODJIE": "WOLOKORODJI",
  "NIOBOUBOU": "NIOBOUGOU",
  "SIRAKOROLA": "SIRAKOROLA OUEST",
  "SIRAKOROLA OUEST": "SIRAKOROLA OUEST",
  "DIANGUINEBOUGOU": "DIAGUINEBOUGOU",
  "DIAGUINABOUGOU": "DIAGUINEBOUGOU",
  "DIAGUINEBOUGOU": "DIAGUINEBOUGOU",
  "DONTIEREBOUGOU": "DONTEREBOUGOU",
  "DONTEREBOUGOU": "DONTEREBOUGOU",
  "DLADIE": "DILADJE",
  "DILADIE": "DILADJE",
  "DILADJE": "DILADJE",
  "BORON CISSE": "BORON CISSE",
  "MONZONBALA": "MONZOMBALA",
};

export function normalizeLocality(value: unknown) {
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[’'`]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ALIASES[raw] || raw;
}

export const PIEZO_REFERENCES: PiezoReference[] = (piezoReference as PiezoReference[]).map((p) => ({ ...p }));

export function findPiezoReferenceByLocality(value: unknown) {
  const key = normalizeLocality(value);
  if (!key) return null;
  return PIEZO_REFERENCES.find((p) => normalizeLocality(p.village) === key) || null;
}

export function findPiezoReference(values: unknown[]) {
  for (const value of values) {
    const ref = findPiezoReferenceByLocality(value);
    if (ref) return ref;
  }
  return null;
}

export function classifyPiezoEvolution(reference: unknown, current: unknown, tolerance = 0.10) {
  const r = Number(reference);
  const c = Number(current);
  if (!Number.isFinite(r) || !Number.isFinite(c)) return { delta: null, status: "Non comparable" as const };
  const delta = Math.round((c - r) * 100) / 100;
  // Le niveau statique est une profondeur sous le repère : une valeur plus grande signifie une nappe plus profonde.
  if (Math.abs(delta) <= tolerance) return { delta, status: "Stable" as const };
  return delta > 0 ? { delta, status: "Baisse" as const } : { delta, status: "Hausse" as const };
}
