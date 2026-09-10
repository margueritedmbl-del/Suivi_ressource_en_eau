import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const routePath = resolve("app/api/reports/export-v5/route.ts");
const panelPath = resolve("components/reports/ReportsPanel.tsx");
let route = readFileSync(routePath, "utf8");

// Build the replacement as plain source lines so JavaScript does not interpolate
// the template literals that belong to the generated TypeScript source.
const newQuality = [
  "function quality(rows: HydroRow[], module: Hydro) {",
  "  const cfg = CFG[module];",
  "  // Only an exact repeated observation is a duplicate.",
  "  // Same station/date with different readings remains usable.",
  "  const exactCounts = new Map<string, number>();",
  "  const sameObservationCounts = new Map<string, number>();",
  "  for (const r of rows) {",
  "    const code = text(r.code_site || r.code_station || r.code_piezo);",
  "    const d = dateText(r.date_observation);",
  "    const h = observationHour(r);",
  "    const value = number(r[cfg.value]);",
  "    const identity = code + \"|\" + d + \"|\" + h + \"|\" + (value === null ? \"\" : value);",
  "    const slot = code + \"|\" + d + \"|\" + h;",
  "    exactCounts.set(identity, (exactCounts.get(identity) || 0) + 1);",
  "    sameObservationCounts.set(slot, (sameObservationCounts.get(slot) || 0) + 1);",
  "  }",
  "",
  "  const values = rows.map(r => number(r[cfg.value])).filter((x): x is number => x !== null).sort((a, b) => a - b);",
  "  const quartile = (p: number) => values[Math.floor((values.length - 1) * p)];",
  "  const bounds = values.length >= 4 ? (() => {",
  "    const q1 = quartile(.25), q3 = quartile(.75), iqr = q3 - q1;",
  "    return { lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };",
  "  })() : null;",
  "  const today = new Date().toISOString().slice(0, 10);",
  "  const seenExact = new Set<string>();",
  "",
  "  return rows.map((r: any) => {",
  "    const code = text(r.code_site || r.code_station || r.code_piezo);",
  "    const d = dateText(r.date_observation);",
  "    const h = observationHour(r);",
  "    const value = number(r[cfg.value]);",
  "    const identity = code + \"|\" + d + \"|\" + h + \"|\" + (value === null ? \"\" : value);",
  "    const slot = code + \"|\" + d + \"|\" + h;",
  "    const exactRepeat = (exactCounts.get(identity) || 0) > 1 && seenExact.has(identity);",
  "    seenExact.add(identity);",
  "",
  "    // Missing time on limnimetry is not a reason to reject the observation.",
  "    const sameDayNoHour = module === \"limnimetrie\" && !h &&",
  "      rows.filter(x => text(x.code_site || x.code_station || x.code_piezo) === code && dateText(x.date_observation) === d).length > 1;",
  "    const sameSlotMultiple = (sameObservationCounts.get(slot) || 0) > 1;",
  "    const incomplete = !code || !validDate(d) || value === null;",
  "    const atypical = !!(bounds && value !== null && (value < bounds.lo || value > bounds.hi));",
  "    const future = validDate(d) && d > today;",
  "    const gpsBad = !gpsValid(r);",
  "",
  "    let status = \"Validée\";",
  "    if (exactRepeat) status = \"Doublon\";",
  "    else if (incomplete || future) status = \"Rejetée\";",
  "    else if (gpsBad || atypical || sameDayNoHour || (sameSlotMultiple && !exactRepeat)) status = \"À vérifier\";",
  "",
  "    // GPS affects mapping only. A technically complete hydro observation stays analytic.",
  "    const usable = !incomplete && !future && !exactRepeat;",
  "",
  "    return {",
  "      ...r,",
  "      __status: status,",
  "      __duplicate: exactRepeat,",
  "      __usable: usable,",
  "      __atypical: atypical,",
  "      __future: future,",
  "      __gpsBad: gpsBad,",
  "      __fewDailyMeasurements: sameDayNoHour,",
  "    };",
  "  });",
  "}"
].join("\n");

const qualityPattern = /function quality\(rows: HydroRow\[\], module: Hydro\) \{.*?\n\}\n\nfunction qualitySummary/s;
if (qualityPattern.test(route)) {
  route = route.replace(qualityPattern, newQuality + "\n\nfunction qualitySummary");
}

route = route.replaceAll('rows.filter(x => x.__status === "Validée")', 'rows.filter(x => x.__usable)');
route = route.replaceAll('rows.filter(r => r.__status === "Validée")', 'rows.filter(r => r.__usable)');

const oldSummary = `function qualitySummary(rows: any[], loaderRejected = 0) {
  return {
    total: rows.length + loaderRejected,
    loaded: rows.length,
    valid: rows.filter(r => r.__status === "Validée").length,
    verify: rows.filter(r => r.__status === "À vérifier").length,
    rejected: rows.filter(r => r.__status === "Rejetée").length + loaderRejected,
    duplicates: rows.filter(r => r.__duplicate).length,
    atypical: rows.filter(r => r.__atypical).length,
    gps: rows.filter(r => r.__gpsBad).length,
    future: rows.filter(r => r.__future).length,
    missingHourReview: rows.filter(r => r.__fewDailyMeasurements).length,
  };
}`;
const newSummary = `function qualitySummary(rows: any[], loaderRejected = 0) {
  return {
    total: rows.length + loaderRejected,
    loaded: rows.length,
    valid: rows.filter(r => r.__status === "Validée").length,
    usable: rows.filter(r => r.__usable).length,
    verify: rows.filter(r => r.__status === "À vérifier").length,
    rejected: rows.filter(r => r.__status === "Rejetée").length + loaderRejected,
    duplicates: rows.filter(r => r.__duplicate).length,
    atypical: rows.filter(r => r.__atypical).length,
    gps: rows.filter(r => r.__gpsBad).length,
    future: rows.filter(r => r.__future).length,
    missingHourReview: rows.filter(r => r.__fewDailyMeasurements).length,
  };
}`;
if (route.includes(oldSummary)) route = route.replace(oldSummary, newSummary);

route = route.replaceAll('"Doublon certain": r.__duplicate ? "Oui" : "Non",', '"Doublon exact": r.__duplicate ? "Oui" : "Non",\n    "Utilisable pour analyse": r.__usable ? "Oui" : "Non",');
route = route.replaceAll("Aucune donnée validée", "Aucune donnée utilisable");
route = route.replaceAll("seules les données validées alimentent les indicateurs.", "toutes les données techniquement utilisables alimentent les indicateurs ; les doublons exacts et données structurellement invalides sont exclus.");
route = route.replaceAll("doublons certains", "doublons exacts");

if (!route.includes("const exactCounts") || !route.includes("__usable")) {
  throw new Error("La correction V5 n'a pas pu être appliquée.");
}
writeFileSync(routePath, route);

let panel = readFileSync(panelPath, "utf8");
panel = panel.replaceAll("Doublon certain", "Doublon exact");
writeFileSync(panelPath, panel);

console.log("PSORE V5: quality rules applied — exact duplicates only; technically usable À vérifier records retained for analytics.");
