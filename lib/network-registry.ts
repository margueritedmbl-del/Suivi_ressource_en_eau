export type HydroModule = "pluviometrie" | "piezometrie" | "limnimetrie";

type StationMeta = {
  code: string;
  shortCode?: string;
  locality?: string;
  commune?: string;
  aliases?: string[];
};

export const NETWORK_STATIONS: Record<HydroModule, StationMeta[]> = {
  pluviometrie: [
    {code:"PL-MGT-GOU-001",locality:"Gouni",commune:"Meguetan"},
    {code:"PL-DMB-DOM-001",locality:"Dombana",commune:"Doumba"},
    {code:"PL-DMB-DIB-001",locality:"Dibaro",commune:"Doumba"},
    {code:"PL-DMB-FAN-001",locality:"Fani",commune:"Doumba"},
    {code:"PL-KLA-DKB-001",locality:"Dialakorobougou",commune:"Koula"},
    {code:"PL-KLA-GKB-001",locality:"Gnamakorobougou",commune:"Koula",aliases:["Niamakorobougou"]},
    {code:"PL-KLA-FEL-001",locality:"Félou",commune:"Koula",aliases:["Felou"]},
    {code:"PL-SRK-DLN-001",locality:"Dlana",commune:"Sirakorola"},
    {code:"PL-SRK-BRC-001",locality:"Boron Cissé",commune:"Sirakorola",aliases:["Boron Cisse"]},
    {code:"PL-SRK-DTB-001",locality:"Dontiérébougou",commune:"Sirakorola",aliases:["Dontierebougou","Dontérébougou"]},
  ],
  piezometrie: [
    {code:"PZ-DMB-FAN-001",shortCode:"PZ-01",locality:"Fani",commune:"Doumba"},
    {code:"PZ-DMB-SIN-001",shortCode:"PZ-02",locality:"Dombana",commune:"Doumba",aliases:["Sinzani"]},
    {code:"PZ-DMB-DOM-001",shortCode:"PZ-03",locality:"Doumba",commune:"Doumba"},
    {code:"PZ-KLA-DKB-001",shortCode:"PZ-04",locality:"Dialakorobougou",commune:"Koula"},
    {code:"PZ-KLA-WLK-001",shortCode:"PZ-05",locality:"Wolokorodji",commune:"Koula",aliases:["Wolokorodjie"]},
    {code:"PZ-KLA-NMCBG-001",shortCode:"PZ-06",locality:"Gnamakorobougou",commune:"Koula",aliases:["Niamakorobougou"]},
    {code:"PZ-KLA-FEL-001",shortCode:"PZ-07",locality:"Félou",commune:"Koula",aliases:["Felou"]},
    {code:"PZ-KLA-NIO-001",shortCode:"PZ-08",locality:"Niobougou",commune:"Koula",aliases:["Nioboubou"]},
    {code:"PZ-SRK-O-001",shortCode:"PZ-09",locality:"Sirakorola Ouest",commune:"Sirakorola",aliases:["Sirakorola"]},
    {code:"PZ-SRK-MON-001",shortCode:"PZ-10",locality:"Monzombala",commune:"Sirakorola",aliases:["Monzobala"]},
    {code:"PZ-SRK-DLN-001",shortCode:"PZ-11",locality:"Dlana",commune:"Sirakorola"},
    {code:"PZ-SRK-BRC-001",shortCode:"PZ-12",locality:"Boron Cissé",commune:"Sirakorola",aliases:["Boron Cisse"]},
    {code:"PZ-SRK-DTB-001",shortCode:"PZ-13",locality:"Dontérébougou",commune:"Sirakorola",aliases:["Dontierebougou","Dontiérébougou"]},
    {code:"PZ-SRK-KOR-001",shortCode:"PZ-14",locality:"Koroka",commune:"Sirakorola"},
    {code:"PZ-SRK-ZAN-001",shortCode:"PZ-15",locality:"Zana",commune:"Sirakorola"},
    {code:"PZ-MGT-GOU-001",shortCode:"PZ-16",locality:"Gouni",commune:"Méguétan",aliases:["Meguetan"]},
    {code:"PZ-MGT-FEG-001",shortCode:"PZ-17",locality:"Fégoun",commune:"Méguétan",aliases:["Fegoun"]},
    {code:"PZ-MGT-DGB-001",shortCode:"PZ-18",locality:"Diaguinébougou",commune:"Méguétan",aliases:["Dianguinebougou"]},
    {code:"PZ-MGT-STG-001",shortCode:"PZ-19",locality:"Siratiguila",commune:"Méguétan"},
    {code:"PZ-MGT-DLDJ-001",shortCode:"PZ-20",locality:"Diladjè",commune:"Méguétan",aliases:["Diladié","Dladie"]},
  ],
  limnimetrie: [
    {code:"CE-KLK-001_B-FANI",locality:"Fani",commune:"Doumba"},
    {code:"CE-KLK-002_B-WLKRDJI",locality:"Wolokorodji",commune:"Koula"},
    {code:"CE-KLK-003_B-BDO",locality:"Bodo",commune:"Koula"},
    {code:"CE-KLK-004_B-SRMSNI",locality:"Sirimansoni",commune:"Koula"},
    {code:"CE-KLK-005_R-BBGOU-PNT",locality:"Babougou",commune:"Doumba"},
    {code:"CE-KLK-006_R-TNKA-PNT",locality:"Tanaka",commune:"Doumba"},
    {code:"CE-KLK-007_R-DBNA",locality:"Dombana",commune:"Doumba"},
    {code:"CE-KLK-008_R-DLNA",locality:"Dlana",commune:"Sirakorola"},
    {code:"CE-KLK-009_R-DNTRBGOU",locality:"Dontiérébougou",commune:"Sirakorola"},
    {code:"CE-KLK-008_R-BRN-CSSE",locality:"Boron Cissé",commune:"Sirakorola"},
  ],
};

export const OFFICIAL_NETWORK: Record<HydroModule, { label: string; codes: string[] }> = {
  pluviometrie:{label:"Stations pluviométriques",codes:NETWORK_STATIONS.pluviometrie.map(x=>x.code)},
  piezometrie:{label:"Piézomètres",codes:NETWORK_STATIONS.piezometrie.map(x=>x.code)},
  limnimetrie:{label:"Stations limnimétriques",codes:NETWORK_STATIONS.limnimetrie.map(x=>x.code)},
};

export function normalizeCode(v:any){return String(v??"").trim().toUpperCase();}
export function normalizeName(v:any){return String(v??"").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");}

export function stationMeta(module:HydroModule,value:any,locality?:any){
  const code=normalizeCode(value); const loc=normalizeName(locality);
  return NETWORK_STATIONS[module].find(s=>normalizeCode(s.code)===code||normalizeCode(s.shortCode)===code)||
    (loc?NETWORK_STATIONS[module].find(s=>[s.locality,...(s.aliases||[])].some(a=>normalizeName(a)===loc)):undefined)||null;
}
export function officialCode(module:HydroModule,value:any,locality?:any){return stationMeta(module,value,locality)?.code||null;}
export function shortCodeForPiezo(value:any,locality?:any){return stationMeta("piezometrie",value,locality)?.shortCode||null;}
export function networkTotal(module:HydroModule){return NETWORK_STATIONS[module].length;}
export function distinctOfficialSites(module:HydroModule,rows:any[]){
  const vals=rows.map(r=>officialCode(module,r?.code_site||r?.code_station||r?.code_piezo,r?.nom_site||r?.village||r?.localite)).filter(Boolean) as string[];
  return new Set(vals);
}
export function displayStationCode(module:HydroModule,value:any,locality?:any){
  const s=stationMeta(module,value,locality); if(!s)return normalizeCode(value)||"Non renseigné";
  return module==="piezometrie"&&s.shortCode?`${s.shortCode} · ${s.code}`:s.code;
}
