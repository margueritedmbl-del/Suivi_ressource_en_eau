import { getValue, findLocation, safeNumber, safeDate, sourceId, parentSourceId, rawEntry } from "../epicollect/client";
import { resolveStation } from "@/lib/network-registry";
function pick(entry:any,labels:string[]){return getValue(entry,labels);}

export function mapPluvioStation(entry:any){
  const loc=findLocation(entry);
  const village=pick(entry,["5_Localit","Village","Localité","Localite","Site","Nom du site","Nom de la localité / site"]);
  const rawCode=pick(entry,["4_Code_pluviomtre","Code pluviomètre","Code pluviometre","Code station","Code du pluviomètre","Code / Numéro du pluviomètre"]);
  const resolved=resolveStation("pluviometrie",{code:rawCode,locality:village});
  const code=resolved.code||rawCode||null;
  return {
    code_station:code,
    nom_station:pick(entry,["7_Nom_de_la_station","Nom de la station","Nom station","Localité","Localite","Village","Site"])||village||code,
    commune:resolved.meta?.commune||pick(entry,["3_Commune","Commune","Nom de la Commune"])||null,
    village:resolved.meta?.locality||village||null,
    latitude:loc.latitude,longitude:loc.longitude,
    altitude:safeNumber(pick(entry,["Altitude","Altitude (m)"])),
    source_entry_id:sourceId(entry),synced_at:new Date().toISOString()
  };
}

export function mapPluvioObservation(entry:any){
  return {
    code_station:pick(entry,["Code pluviomètre","Code pluviometre","Code station","Code du pluviomètre"]),
    date_observation:safeDate(pick(entry,["23_Date_du_relev","Date du relevé","Date releve","Date de mesure","Date mesure","Date lecture","Date","Jour de mesure"])),
    pluie_24h_mm:safeNumber(pick(entry,["26_Prcipitations_obs","Précipitations observées (mm/24h)","Precipitations observees","Hauteur de pluie 24h (mm)","Hauteur de pluie (mm)","Hauteur pluie","Pluie (mm)","Pluie 24h","Quantité de pluie","Quantite de pluie","Lecture pluviomètre","Lecture pluviometre"])),
    cumul_mensuel_mm:safeNumber(pick(entry,["Cumul mensuel","Cumul mensuel (mm)","Cumul pluie","Cumul"])) ,
    observateur:pick(entry,["25_Observateur","Observateur","Nom observateur","Nom de l'observateur","Collecteur"]),
    commentaire:pick(entry,["Commentaire","Commentaires","Observation","Observations"]),
    photo_url:pick(entry,["30_Photo_de_la_lectu","Photo du pluviomètre","Photo du pluviometre","Photo de la lecture","Photo","Photo lecture"]),
    source_parent_id:parentSourceId(entry),
    raw_payload:rawEntry(entry),
    source_entry_id:sourceId(entry),synced_at:new Date().toISOString()
  };
}
