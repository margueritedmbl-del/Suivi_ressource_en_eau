# Audit PSORE V2.2 consolidée

## Corrections intégrées

- Page d’accueil publique : suppression de l’accès direct au Dashboard, maintien du bouton Connexion et de la cartographie publique.
- Topbar publique : suppression du lien Dashboard ; maintien des liens vers Cartographie et modules thématiques.
- Menus latéraux dynamiques selon session et rôle :
  - Public : modules + cartographie uniquement.
  - Collecteur : consultation des modules.
  - DNH/DRHK : Dashboard, modules, cartographie, rapports, exports CSV/XLSX.
  - Administrateur PTCS : accès total, y compris Observatoire et Administration.
- Pages modules : cartes filtrées par module.
  - Pluviométrie : uniquement points pluviométriques.
  - Piézométrie : uniquement piézomètres.
  - Limnimétrie : uniquement points limnimétriques.
  - Points d’eau : uniquement points d’eau.
- Actions modules :
  - Public/Collecteur : boutons internes masqués.
  - DNH/DRHK : CSV/XLSX visibles, DOCX/PDF masqués.
  - Administrateur PTCS : CSV/XLSX/DOCX/PDF visibles.
- Gestion utilisateurs : création directe avec mot de passe saisi ou généré ; copie du mot de passe ; invitation Supabase conservée en option.
- Bootstrap admin : si l’utilisateur existe déjà, le mot de passe ADMIN_PASSWORD est réappliqué pour éviter l’erreur Invalid login credentials.
- Accueil dynamique : remplacement des éléments figés par carte Leaflet connectée à Supabase et synthèse hydrologique dynamique.
- Rôles attendus : Administrateur PTCS, DNH/DRHK, Collecteur.

## Test local

La compilation Next.js a atteint `Compiled successfully` et la validation TypeScript a démarré. Le build complet a été interrompu par le délai d’exécution du conteneur pendant `Collecting page data`, sans erreur TypeScript affichée avant interruption.

## Après déploiement

1. Vérifier `/api/health`.
2. Vérifier `/api/auth/client-health`.
3. Ouvrir `/api/admin/bootstrap` après chaque changement de `ADMIN_PASSWORD`.
4. Tester la connexion `gireexpert@gmail.com`.
5. Vérifier que Supabase Auth affiche bien l’utilisateur.
6. Vérifier les menus en mode public, DNH/DRHK et Administrateur PTCS.
