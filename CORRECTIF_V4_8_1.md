# PSORE V4.8.1

Correctif de compilation Render pour le moteur de rapports.

## Cause
`app/api/reports/export/route.ts` déclarait une fonction avec `function head(){...}` à l'intérieur du bloc `if (format === "pdf")`. Avec la cible ES5 et les modules en mode strict, TypeScript refuse ce type de déclaration dans un bloc.

## Correction
La déclaration est remplacée par `const drawHeader = () => { ... }`.

Aucune migration Supabase supplémentaire n'est nécessaire pour ce correctif.
