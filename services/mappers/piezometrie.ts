import { getValue, findLocation, safeNumber, safeDate, sourceId, parentSourceId, rawEntry } from "../epicollect/client";
import { findPiezoReference } from "@/lib/piezo-reference";
function pick(entry:any,labels:string[]){return getValue(entry,labels);}

export function mapPiezometre(entry:any){
  const loc=findLocation(entry);const commune=pick(entry,["Commune","Nom de la Commune"]);const village=pick(entry,["Villages","Village","Localité","Localite","Nom de la localité / site","Site","Nom du site"]);const rawCode=pick(entry,["Code piézomètre","Code piezometre","Code du piézomètre","Code / Numéro du piézomètre"]);const ref=findPiezoReference([village,rawCode]);
  return {code_piezo:ref?.code||rawCode||sourceId(entry),commune:ref?.commune||commune||null,village:ref?.village||village||null,localite:ref?.village||village||null,latitude:loc.latitude??ref?.latitude??null,longitude:loc.longitude??ref?.longitude??null,profondeur:safeNumber(pick(entry,["Profondeur totale (m)","Profondeur","Profondeur du forage"]))??ref?.profondeur_totale_m??null,aquifere:pick(entry,["Nom de l'aquifère capté","Nom de l'aquifère","Nom aquifère","Aquifère"]),source_entry_id:sourceId(entry),synced_at:new Date().toISOString()};
}

export function mapPiezoObservation(entry:any){
  const commune=pick(entry,["Commune","Nom de la Commune"]);const village=pick(entry,["Villages","Village","Localité","Localite","Nom de la localité / site","Site","Nom du site"]);const rawCode=pick(entry,["Code piézomètre","Code piezometre","Code du piézomètre","Code / Numéro du piézomètre"]);const ref=findPiezoReference([village,rawCode]);
  return {code_piezo:ref?.code||rawCode||null,date_observation:safeDate(pick(entry,["Date de mesure","Date mesure","Date du relevé","Date relevé","Date","Date observation","Date de la mesure"])),niveau_statique:safeNumber(pick(entry,["Niveau statique (m)","Niveau statique","Niveau d'eau","Niveau de l'eau","Niveau de la nappe","Niveau nappe","Profondeur de la nappe","Profondeur nappe","Profondeur / nappe","Mesure piézométrique","Mesure piezometrique"])),observateur:pick(entry,["Observateur","Nom observateur","Collecteur"]),commentaire:pick(entry,["Commentaires","Commentaire","Observations","Observation"]),photo_url:pick(entry,["Photo de mesure","Photo mesure","Photo du site","Photo","Photo lecture"]),source_parent_id:parentSourceId(entry),raw_payload:rawEntry(entry),source_entry_id:sourceId(entry),synced_at:new Date().toISOString()};
}
