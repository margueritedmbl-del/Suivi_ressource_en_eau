import { getValue, findLocation, safeNumber, sourceId } from "../epicollect/client";

function val(entry: any, labels: string[]) { return getValue(entry, labels); }
function dateValue(entry: any, labels: string[]) { const v = val(entry, labels); return v || null; }

export function mapPointEau(entry: any) {
  const loc = findLocation(entry);
  const id = sourceId(entry);
  const type = val(entry, ["13_Type", "Type", "Type d'ouvrage", "Type ouvrage", "Type de point d'eau", "Type point d'eau"]);
  const title = val(entry, ["title", "Titre", "Village", "Localité", "Localite"]);
  return {
    code_pe: val(entry, ["Code PE", "Code point d'eau", "code_pe", "title", "Village", "Localité", "Localite"]) || title || id,
    type_ouvrage: type,
    titre_source: title,
    enqueteur_initial: val(entry, ["2_Initial_Enquteur", "Initial enquêteur", "Initial Enquêteur"]),
    date_collecte: dateValue(entry, ["3_Date", "Date", "Date collecte"]),
    heure_collecte: val(entry, ["4_Heure", "Heure"]),
    commune: val(entry, ["6_Commune", "Commune"]),
    village: val(entry, ["7_Village", "Village"]),
    localite: val(entry, ["8_Localit_hameauQuar", "Localité", "Localite", "Hameau", "Quartier"]),
    latitude: loc.latitude || safeNumber(val(entry, ["lat_10_Coordonnes_infras", "Latitude", "lat"])),
    longitude: loc.longitude || safeNumber(val(entry, ["long_10_Coordonnes_infras", "Longitude", "long", "lon"])),
    precision_gps: safeNumber(val(entry, ["accuracy_10_Coordonnes_infras", "Précision GPS", "Accuracy"])),
    utm_northing: safeNumber(val(entry, ["UTM_Northing_10_Coordonnes_infras", "UTM Northing"])),
    utm_easting: safeNumber(val(entry, ["UTM_Easting_10_Coordonnes_infras", "UTM Easting"])),
    utm_zone: val(entry, ["UTM_Zone_10_Coordonnes_infras", "UTM Zone"]),
    photo_infrastructure: val(entry, ["11_Photo_Infrastruct", "Photo Infrastructure", "Photo infrastructure"]),
    photo_emprise: val(entry, ["12_Photo_Emprise_Inf", "Photo Emprise"]),
    type_infrastructure: type,
    type_puits: val(entry, ["16_Type", "Type puits"]),
    equipement_puits: val(entry, ["17_Equipement", "Equipement puits", "Équipement puits"]),
    date_realisation_puits: val(entry, ["18_Date_de_ralisatio", "Date réalisation puits"]),
    hauteur_margelle: safeNumber(val(entry, ["19_Hauteur_margelle_", "Hauteur margelle"])),
    diametre_cm: safeNumber(val(entry, ["20_Diamtre_en_cm", "Diamètre en cm"])),
    commentaire_puits: val(entry, ["21_Commentaire", "Commentaire puits"]),
    type_forage: val(entry, ["23_Type", "Type forage"]),
    fonctionnalite_forage: val(entry, ["24_Fonctionnalit_for", "Fonctionnalité forage", "Fonctionnalite forage", "Etat", "État"]),
    equipement_forage: val(entry, ["25_Equipement", "Equipement forage", "Équipement forage"]),
    date_realisation_forage: val(entry, ["26_Date_de_ralisatio", "Date réalisation forage"]),
    nombre_total_bornes: safeNumber(val(entry, ["27_Nombre_total_de_b", "Nombre total de bornes"])),
    nombre_bornes_fonctionnelles: safeNumber(val(entry, ["28_Nombre_de_bornes_", "Nombre de bornes fonctionnelles"])),
    organe_gestion: val(entry, ["29_Organe_de_Gestion", "Organe de Gestion", "Organe de gestion"]),
    type_organe: val(entry, ["30_Type_dorgane", "Type d'organe"]),
    fonctionnalite_organe: val(entry, ["31_Fonctionnalit_de_", "Fonctionnalité de l'organe", "Fonctionnalite organe"]),
    commentaire_gestion: val(entry, ["32_Commentaire", "Commentaire gestion"]),
    date_mesure: dateValue(entry, ["34_Date_de_la_mesure", "Date de la mesure"]),
    niveau_eau: safeNumber(val(entry, ["35_Niveau_de_leau__N", "Niveau de l'eau", "Niveau eau"])),
    profondeur_ouvrage: safeNumber(val(entry, ["36_Profondeur_ouvrag", "Profondeur ouvrage", "Profondeur"])),
    commentaire_mesure: val(entry, ["37_Commentaire", "Commentaire mesure"]),
    temperature_c: safeNumber(val(entry, ["39_Temprature_C", "Température C", "Temperature C"])),
    ph: safeNumber(val(entry, ["40_pH_", "pH"])),
    conductivite: safeNumber(val(entry, ["41_Conductivit_lectr", "Conductivité électrique", "Conductivite"])),
    turbidite_ntu: safeNumber(val(entry, ["42_Turbidit_NTU", "Turbidité NTU", "Turbidite"])),
    tds: safeNumber(val(entry, ["43_TDS_", "TDS"])),
    presence_odeur: val(entry, ["44_Prsence_dodeur", "Présence d'odeur", "Presence odeur"]),
    commentaire_qualite: val(entry, ["45_Commentaire", "Commentaire qualité"]),
    etat_apparent: val(entry, ["47_tat_apparent_de_l", "État apparent", "Etat apparent"]),
    problemes: val(entry, ["48_Problmes_ou_dysfo", "Problèmes ou dysfonctionnements", "Problemes"]),
    besoin_rehabilitation: val(entry, ["49_Besoin_en_rhabili", "Besoin en réhabilitation", "Besoin rehabilitation"]),
    nom_repondant: val(entry, ["51_Nom_et_Prenom", "Nom et Prénom", "Nom repondant"]),
    contact_repondant: val(entry, ["52_Contact_tlphoniqu", "Contact téléphonique", "Téléphone"]),
    recommandation: val(entry, ["53_Recommandation_pa", "Recommandation"]),
    etat: val(entry, ["24_Fonctionnalit_for", "Etat", "État", "Fonctionnalité", "Fonctionnalite"]),
    profondeur: safeNumber(val(entry, ["36_Profondeur_ouvrag", "Profondeur", "Profondeur totale"])),
    source_entry_id: id,
    synced_at: new Date().toISOString(),
  };
}
