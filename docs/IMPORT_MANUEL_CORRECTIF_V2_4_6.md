# Correctif PSORE V2.4.6 — Import manuel

Ce correctif traite l’erreur navigateur `Unexpected token 'A' ... is not valid JSON` et les expirations Vercel pendant l’import de fichiers volumineux.

## Corrections

- lecture sûre des réponses HTTP, y compris les erreurs texte de Vercel ;
- réponse JSON structurée avec indication de l’étape en échec ;
- import par lots de 50 lignes ;
- subdivision automatique d’un lot en cas de ligne invalide ;
- suppression du repli lent effectuant plusieurs requêtes pour chacune des 540 lignes ;
- nettoyage des valeurs `undefined`, `NaN` et infinies ;
- chargement dynamique du moteur XLSX pour capturer ses erreurs ;
- journal serveur préfixé `[PSORE import manuel]`.

## Utilisation

Déployer le projet, puis importer le CSV Epicollect5 depuis `/admin/synchronisation`. En cas d’erreur, l’interface affiche maintenant le statut HTTP et le message réel. Le détail est aussi disponible dans les logs Vercel.
