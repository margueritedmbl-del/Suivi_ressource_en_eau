import { getValue, findLocation, safeNumber, safeDate, sourceId, parentSourceId, rawEntry } from "../epicollect/client";
import { resolveStation } from "@/lib/network-registry";
function pick(entry:any,labels:string[]){return getValue(entry,labels);}
export function mapLimniStation(entry:any){
  const loc=findLocation(entry);
  const village=pick(entry,["4_Village","5_Localit_hameauQuar","Village","Localité","Localite","Site","Nom du site"]);
  const rawCode=pick(entry,["7_Code_station","Code station","Code échelle","Code echelle","Code limnimètre","Code limnimetre"]);
  const resolved=resolveStation("limnimetrie",{code:rawCode,locality:village});
  return {
    code_station:resolved.code||rawCode||null,
    cours_eau:pick(entry,["9_Nom_cours_deau","Nom cours d’eau","Nom cours d'eau","Cours d'eau","Nom du cours d'eau","Cours d’eau"]),
    commune:resolved.meta?.commune||pick(entry,["3_Commune","Commune","Nom de la Commune"])||null,
    village:resolved.meta?.locality||village||null,localite:resolved.meta?.locality||village||null,
    latitude:loc.latitude,longitude:loc.longitude,source_entry_id:sourceId(entry),synced_at:new Date().toISOString()
  };
}
export function mapLimniObservation(entry:any){return {
  code_station:pick(entry,["7_Code_station","Code station","Code échelle","Code echelle","Code limnimètre","Code limnimetre"]),
  date_observation:safeDate(pick(entry,["27_Date_lecture","Date lecture","Date de lecture","Date du relevé","Date releve","Date de mesure","Date mesure","Date"])),
  periode:pick(entry,["28_Heure_lecture","Période","Periode","Moment","Heure lecture","Heure de lecture","Matin / soir","Matin/soir"])||null,
  hauteur_eau:safeNumber(pick(entry,["30_Niveau_deau_obser","Niveau d’eau observé","Niveau d'eau observé","Niveau eau","Hauteur eau","Hauteur d'eau","Hauteur d’eau","Lecture limnimétrique","Lecture limnimetrique","Niveau limnimétrique","Niveau limnimetrique"])),
  observateur:pick(entry,["29_Nom_observateur_l","Observateur","Nom observateur","Collecteur"]),commentaire:pick(entry,["Commentaire technique","Observation générale","Observation generale","Commentaire","Observations"]),
  photo_url:pick(entry,["33_Photo_lecture_du_","Photo lecture du jour","Photo lecture","Photo","Photo de la lecture"]),source_parent_id:parentSourceId(entry),raw_payload:rawEntry(entry),source_entry_id:sourceId(entry),synced_at:new Date().toISOString()};}
