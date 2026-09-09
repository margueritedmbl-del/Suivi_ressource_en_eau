import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const source = resolve(process.argv[2] || process.env.PSORE_STORAGE_SOURCE || "../PSORE_V4_1_STORAGE_ASSETS");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const bucket = process.env.PSORE_DOCUMENTS_BUCKET || "psore-documents";

if (!url || !key) {
  console.error("Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!existsSync(source)) {
  console.error(`Dossier source introuvable : ${source}`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

const pdfs = files(source).filter((file) => file.toLowerCase().endsWith(".pdf"));
if (!pdfs.length) {
  console.error("Aucun PDF trouvé dans le dossier source.");
  process.exit(1);
}

let ok = 0;
let failed = 0;
for (const file of pdfs) {
  const storagePath = relative(source, file).split(sep).join("/");
  const size = statSync(file).size;
  process.stdout.write(`Transfert ${storagePath} (${(size / 1024 / 1024).toFixed(2)} Mo)... `);
  const buffer = await import("node:fs/promises").then((fs) => fs.readFile(file));
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    failed++;
    console.log(`ÉCHEC : ${error.message}`);
  } else {
    ok++;
    console.log("OK");
  }
}
console.log(`\nTerminé : ${ok} fichier(s) transféré(s), ${failed} échec(s).`);
process.exit(failed ? 2 : 0);
