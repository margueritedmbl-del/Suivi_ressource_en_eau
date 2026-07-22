import { access } from 'node:fs/promises';

const required = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.js',
  'components/DashboardShell.tsx',
  'components/auth/RequireAuth.tsx',
  'lib/permissions.ts',
  'app/admin/page.tsx',
  'app/api/health/route.ts',
];

const missing = [];
for (const file of required) {
  try { await access(file); } catch { missing.push(file); }
}
if (missing.length) {
  console.error('Fichiers indispensables manquants :');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`Vérification Render OK : ${required.length} fichiers indispensables présents.`);
