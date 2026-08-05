# Import manuel des données dans PSORE

## Objectif

Ce mécanisme constitue une solution de secours lorsque l’API Epicollect5 est indisponible, limitée ou bloquée par une erreur 429. Il permet d’importer le dernier export CSV/XLSX dans Supabase depuis l’administration PSORE.

## Accès

1. Se connecter avec un rôle Super administrateur, Administrateur PTCS ou DNH/DRHK.
2. Ouvrir `/admin/synchronisation`.
3. Utiliser la section **Import manuel de secours**.

## Types pris en charge

- Points d’eau — inventaire
- Pluviométrie — référentiel et relevés
- Piézométrie — référentiel et mesures
- Limnimétrie — stations et lectures

## Procédure

1. Dans Epicollect5, exporter la fiche concernée au format CSV ou XLSX.
2. Ne pas renommer les colonnes.
3. Dans PSORE, sélectionner le type correspondant.
4. Choisir le fichier et cliquer sur **Importer**.
5. Vérifier le bilan : lignes lues, reconnues, intégrées, ignorées et rejetées.
6. Actualiser le module ou le dashboard.

## Comportement

- L’import effectue un ajout ou une mise à jour (`upsert`).
- L’identifiant Epicollect5 est utilisé pour éviter les doublons.
- Si cet identifiant manque, PSORE génère un identifiant stable à partir de la ligne.
- Les conflits sur les codes de stations/ouvrages sont résolus par mise à jour de l’enregistrement existant.
- Chaque import est enregistré dans l’historique des synchronisations.

## Limites

- Taille maximale par fichier : 4 Mo, afin de respecter la limite des fonctions Vercel.
- Pour un fichier plus volumineux, le scinder en plusieurs parties avec les mêmes colonnes.
- La première feuille d’un classeur Excel est importée.
- Les photographies référencées par URL sont conservées comme texte ; les fichiers image ne sont pas transférés par l’import CSV/XLSX.

## Recommandation opérationnelle

Utiliser l’import manuel comme mode de continuité de service. Conserver la synchronisation automatique Epicollect5 active, mais ne pas relancer plusieurs fois de suite lorsqu’une erreur 429 survient.
