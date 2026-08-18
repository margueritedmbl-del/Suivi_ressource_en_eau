import { supabaseAdmin } from "@/lib/supabase-admin";

export type EpicollectSource = {
  module: string;
  type_source: string;
  libelle: string;
  project_slug: string;
  api_url: string;
  form_url: string;
  actif?: boolean;
};

export const FALLBACK_SOURCES: EpicollectSource[] = [
  {
    module: "pluviometrie",
    type_source: "stations",
    libelle: "Référentiel des pluviomètres",
    project_slug: "suivi-pluviometrique-koulikoro-ptcs",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs",
    actif: true,
  },
  {
    module: "pluviometrie",
    type_source: "releves",
    libelle: "Relevés pluviométriques",
    project_slug: "suivi-pluviometrique-koulikoro-ptcs",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a05a7178bf71&parent_form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs",
    actif: true,
  },
  {
    module: "piezometrie",
    type_source: "referentiel",
    libelle: "Référentiel piézomètres",
    project_slug: "suivi-piezo-koulikoro-ptcs",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs",
    actif: true,
  },
  {
    module: "piezometrie",
    type_source: "mesures",
    libelle: "Mesures piézométriques",
    project_slug: "suivi-piezo-koulikoro-ptcs",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a05a7178bf71&parent_form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs",
    actif: true,
  },
  {
    module: "limnimetrie",
    type_source: "stations",
    libelle: "Stations limnimétriques",
    project_slug: "suivi-limnimetrique-ce-koulikoro",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro",
    actif: true,
  },
  {
    module: "limnimetrie",
    type_source: "lectures",
    libelle: "Lectures limnimétriques",
    project_slug: "suivi-limnimetrique-ce-koulikoro",
    api_url: "https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a05a7178bf71&parent_form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4",
    form_url: "https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro",
    actif: true,
  },
  {
    module: "points_eau",
    type_source: "inventaire",
    libelle: "Inventaire points d’eau",
    project_slug: "etat-des-lieux-pe-ptcs",
    api_url: "https://five.epicollect.net/api/export/entries/etat-des-lieux-pe-ptcs?form_ref=9365afaa5ef642ffb8ed24b8b51bf93a_5db097aea78d5",
    form_url: "https://five.epicollect.net/project/etat-des-lieux-pe-ptcs",
    actif: true,
  },
];

export const EPICOLLECT_SOURCES = {
  pluviometrie: {
    stations: FALLBACK_SOURCES.find((s) => s.module === "pluviometrie" && s.type_source === "stations")!.api_url,
    releves: FALLBACK_SOURCES.find((s) => s.module === "pluviometrie" && s.type_source === "releves")!.api_url,
  },
  piezometrie: {
    referentiel: FALLBACK_SOURCES.find((s) => s.module === "piezometrie" && s.type_source === "referentiel")!.api_url,
    mesures: FALLBACK_SOURCES.find((s) => s.module === "piezometrie" && s.type_source === "mesures")!.api_url,
  },
  limnimetrie: {
    stations: FALLBACK_SOURCES.find((s) => s.module === "limnimetrie" && s.type_source === "stations")!.api_url,
    lectures: FALLBACK_SOURCES.find((s) => s.module === "limnimetrie" && s.type_source === "lectures")!.api_url,
  },
  pointsEau: {
    inventaire: FALLBACK_SOURCES.find((s) => s.module === "points_eau" && s.type_source === "inventaire")!.api_url,
  },
};

export function sourceKey(module: string, typeSource: string) {
  return `${module}:${typeSource}`;
}

export async function getActiveEpicollectSources(module?: string): Promise<EpicollectSource[]> {
  try {
    let query = supabaseAdmin
      .from("epicollect_sources")
      .select("module,type_source,libelle,project_slug,api_url,form_url,actif")
      .eq("actif", true)
      .order("module")
      .order("type_source");
    if (module) query = query.eq("module", module);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) {
      const rows=data as EpicollectSource[];
      // V5.2 : les références de formulaires embarquées sont canoniques pour les 7 sources PTCS.
      // Cela évite qu'une ancienne URL conservée en base réactive un formulaire obsolète.
      return rows.map((row)=>{
        const canonical=FALLBACK_SOURCES.find(x=>x.module===row.module&&x.type_source===row.type_source);
        return canonical?{...row,project_slug:canonical.project_slug,api_url:canonical.api_url,form_url:canonical.form_url}:row;
      });
    }
  } catch (_) {
    // Base non migrée ou Supabase indisponible : fallback contrôlé.
  }
  return FALLBACK_SOURCES.filter((source) => source.actif !== false && (!module || source.module === module));
}

export async function getEpicollectSource(module: string, typeSource: string): Promise<EpicollectSource> {
  const sources = await getActiveEpicollectSources(module);
  const found = sources.find((s) => s.type_source === typeSource);
  if (!found) throw new Error(`Source Epicollect introuvable : ${module}/${typeSource}`);
  return found;
}


export function formRefFromApiUrl(apiUrl: string) {
  try { return new URL(apiUrl).searchParams.get("form_ref"); } catch { return null; }
}

const PARENT_SOURCE_BY_CHILD: Record<string,string> = {
  "pluviometrie:releves": "stations",
  "piezometrie:mesures": "referentiel",
  "limnimetrie:lectures": "stations",
};

export function withChildParentRef(source: EpicollectSource, _parent?: EpicollectSource | EpicollectSource[]) {
  // V4.7: les relevés PTCS sont des formulaires enfants de type hierarchy.
  // form_ref pointe vers le formulaire enfant et parent_form_ref vers son formulaire parent.
  return source;
}
