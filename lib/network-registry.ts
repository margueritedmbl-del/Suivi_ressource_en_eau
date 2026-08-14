export type HydroModule = "pluviometrie" | "piezometrie" | "limnimetrie";

export const OFFICIAL_NETWORK: Record<HydroModule, { label: string; codes: string[] }> = {
  pluviometrie: {
    label: "Stations pluviométriques",
    codes: [
      "PL-MGT-GOU-001","PL-DMB-DOM-001","PL-DMB-DIB-001","PL-DMB-FAN-001","PL-KLA-DKB-001",
      "PL-KLA-GKB-001","PL-KLA-FEL-001","PL-SRK-DLN-001","PL-SRK-BRC-001","PL-SRK-DTB-001",
    ],
  },
  piezometrie: {
    label: "Piézomètres",
    codes: [
      "PZ-DMB-FAN-001","PZ-DMB-DOM-001","PZ-DMB-SIN-001","PZ-KLA-NMCBG-001","PZ-KLA-DKB-001",
      "PZ-KLA-WLK-001","PZ-KLA-NIO-001","PZ-KLA-FEL-001","PZ-SRK-MON-001","PZ-SRK-DLN-001",
      "PZ-SRK-BRC-001","PZ-SRK-DTB-001","PZ-SRK-KOR-001","PZ-SRK-ZAN-001","PZ-SRK-O-001",
      "PZ-MGT-GOU-001","PZ-MGT-FEG-001","PZ-MGT-DGB-001","PZ-MGT-STG-001","PZ-MGT-DLDJ-001",
    ],
  },
  limnimetrie: {
    label: "Stations limnimétriques",
    codes: [
      "CE-KLK-001_B-FANI","CE-KLK-002_B-WLKRDJI","CE-KLK-003_B-BDO","CE-KLK-004_B-SRMSNI","CE-KLK-005_R-BBGOU-PNT",
      "CE-KLK-006_R-TNKA-PNT","CE-KLK-007_R-DBNA","CE-KLK-008_R-DLNA","CE-KLK-009_R-DNTRBGOU","CE-KLK-008_R-BRN-CSSE",
    ],
  },
};

export function normalizeCode(v: any) {
  return String(v ?? "").trim().toUpperCase();
}

export function officialCode(module: HydroModule, value: any) {
  const code = normalizeCode(value);
  return OFFICIAL_NETWORK[module].codes.includes(code) ? code : null;
}

export function networkTotal(module: HydroModule) {
  return OFFICIAL_NETWORK[module].codes.length;
}

export function distinctOfficialSites(module: HydroModule, rows: any[]) {
  return new Set(rows.map(r => officialCode(module, r?.code_site || r?.code_station || r?.code_piezo)).filter(Boolean) as string[]);
}
