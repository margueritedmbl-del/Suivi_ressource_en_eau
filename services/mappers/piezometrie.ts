import { getValue, findLocation, safeNumber, sourceId } from "../epicollect/client";
import { findPiezoReference } from "@/lib/piezo-reference";

function pick(entry:any, labels:string[]) { return getValue(entry, labels); }

export function mapPiezometre(entry:any){
  const loc=findLocation(entry);
  const commune=pick(entry,["Commune","Nom de la Commune"]);
  const village=pick(entry,["Villages","Village","Localité","Localite","Nom de la localité / site","Site"]);
  const rawCode=pick(entry,["Code piézomètre","Code piezometre","Code du piézomètre","Code / Numéro du piézomètre"]);
  const ref=findPiezoReference([village, rawCode]);
  return {
    code_piezo: ref?.code || rawCode || sourceId(entry),
    commune: ref?.commune || commune || null,
    village: ref?.village || village || null,
    localite: ref?.village || village || null,
    latitude: loc.latitude ?? ref?.latitude ?? null,
    longitude: loc.longitude ?? ref?.longitude ?? null,
    profondeur: safeNumber(pick(entry,["Profondeur totale (m)","Profondeur"])) ?? ref?.profondeur_totale_m ?? null,
    aquifere: pick(entry,["Nom de l'aquifère capté","Nom de l'aquifère","Nom aquifère","Aquifère"]),
    source_entry_id:sourceId(entry),
    synced_at:new Date().toISOString()
  };
}

export function mapPiezoObservation(entry:any){
  const loc=findLocation(entry);
  const commune=pick(entry,["Commune","Nom de la Commune"]);
  const village=pick(entry,["Villages","Village","Localité","Localite","Nom de la localité / site","Site","Nom du site"]);
  const rawCode=pick(entry,["Code piézomètre","Code piezometre","Code du piézomètre","Code / Numéro du piézomètre"]);
  const ref=findPiezoReference([village, rawCode]);
  return {
    code_piezo: ref?.code || rawCode || null,
    date_observation:pick(entry,["Date de mesure","Date mesure","Date","Date observation"]),
    niveau_statique:safeNumber(pick(entry,["Niveau statique (m)","Niveau statique","Niveau d'eau"])),
    observateur:pick(entry,["Observateur","Nom observateur"]),
    commentaire:pick(entry,["Commentaires","Commentaire","Observations"]),
    photo_url:pick(entry,["Photo de mesure","Photo mesure","Photo du site","Photo"]),
    source_entry_id:sourceId(entry),
    synced_at:new Date().toISOString()
  };
}
