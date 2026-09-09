import { getValue, findLocation, safeNumber, safeDate, sourceId, parentSourceId, rawEntry } from "../epicollect/client";
import { findPiezoReference } from "@/lib/piezo-reference";
import { resolveStation } from "@/lib/network-registry";
function pick(entry:any,labels:string[]){return getValue(entry,labels);}

export function mapPiezometre(entry:any){
  const loc=findLocation(entry);
  const commune=pick(entry,["3_Commune","Commune","Nom de la Commune"]);
  const village=pick(entry,["4_Villages","Villages","Village","Localité","Localite","Nom de la localité / site","Site","Nom du site"]);
  const rawCode=pick(entry,["5_Code_pizomtre","Code piézomètre","Code piezometre","Code du piézomètre","Code / Numéro du piézomètre"]);
  const resolved=resolveStation("piezometrie",{code:rawCode,locality:village});
  const ref=findPiezoReference([resolved.meta?.locality,village,resolved.meta?.shortCode]);
  return {
    code_piezo:resolved.code||rawCode||null,
    commune:resolved.meta?.commune||ref?.commune||commune||null,
    village:resolved.meta?.locality||ref?.village||village||null,
    localite:resolved.meta?.locality||ref?.village||village||null,
    latitude:loc.latitude??ref?.latitude??null,longitude:loc.longitude??ref?.longitude??null,
    profondeur:safeNumber(pick(entry,["14_Profondeur_totale","Profondeur totale (m)","Profondeur","Profondeur du forage"]))??ref?.profondeur_totale_m??null,
    aquifere:pick(entry,["18_Nom_de_lAquifre_c","Nom de l'aquifère capté","Nom de l'aquifère","Nom aquifère","Aquifère"]),
    source_entry_id:sourceId(entry),synced_at:new Date().toISOString()
  };
}

export function mapPiezoObservation(entry:any){
  return {
    code_piezo:pick(entry,["Code piézomètre","Code piezometre","Code du piézomètre"]),
    date_observation:safeDate(pick(entry,["32_Date_de_mesure","Date de mesure","Date mesure","Date du relevé","Date relevé","Date","Date observation","Date de la mesure"])),
    niveau_statique:safeNumber(pick(entry,["35_Niveau_statique_m","Niveau statique (m)","Niveau statique","Niveau d'eau","Niveau de l'eau","Niveau de la nappe","Niveau nappe","Profondeur de la nappe","Profondeur nappe","Profondeur / nappe","Mesure piézométrique","Mesure piezometrique"])),
    observateur:pick(entry,["34_Observateur","Observateur","Nom observateur","Collecteur"]),
    commentaire:pick(entry,["Commentaires","Commentaire","Observations","Observation"]),
    photo_url:pick(entry,["37_Photo_de_mesure","Photo de mesure","Photo mesure","Photo du site","Photo","Photo lecture"]),
    source_parent_id:parentSourceId(entry),raw_payload:rawEntry(entry),source_entry_id:sourceId(entry),synced_at:new Date().toISOString()
  };
}
