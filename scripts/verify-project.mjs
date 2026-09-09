import { existsSync, readFileSync } from 'node:fs';
const requiredFiles = ['package.json','vercel.json','.env.example','database/00_migration_complete_v2_4.sql','database/99_verification.sql','docs/INSTALLATION.md','docs/DEPLOIEMENT_VERCEL.md','docs/CONFIGURATION_SUPABASE.md','docs/RECETTE_FINALE.md','app/api/admin/bootstrap/route.ts','app/api/sync/all/route.ts','app/api/dashboard/institutionnel/route.ts'];
const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) { console.error('Fichiers manquants :'); for (const file of missing) console.error(`- ${file}`); process.exit(1); }
const pkg = JSON.parse(readFileSync('package.json','utf8'));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const dep of ['next','react','react-dom','@supabase/supabase-js']) { if (!deps[dep]) { console.error(`Dépendance manquante : ${dep}`); process.exit(1); } }
console.log('Vérification projet PSORE V2.4 : OK');
