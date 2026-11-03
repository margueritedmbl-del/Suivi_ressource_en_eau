// Used only by the Super administrator API; never imported by client components.
export const agrFinances = [
  ...["AGR-SRK-01","AGR-SRK-02","AGR-SRK-03","AGR-SRK-04"].map(code=>({code,montant_ht_fcfa:42643320,perimetre:"Tranche conditionnelle : aménagement; hors mobilisation de la ressource",methode:"Montant individuel du tableau 11",source_pages_pdf:[30,36],reserve:"Écart d’un FCFA entre somme des sites et total imprimé du lot."})),
  ...["AGR-KLA-05","AGR-KLA-06","AGR-KLA-07"].map(code=>({code,montant_ht_fcfa:35128459,perimetre:"Tranche conditionnelle : aménagement; hors mobilisation de la ressource",methode:"Montant individuel du tableau 12",source_pages_pdf:[31,36],reserve:"Ne représente pas le coût complet du site."})),
  ...["AGR-MGT-08","AGR-MGT-09"].map(code=>({code,montant_ht_fcfa:55607348,perimetre:"Tranche conditionnelle : aménagement; hors mobilisation de la ressource",methode:"Montant individuel du tableau 13",source_pages_pdf:[32,37],reserve:"Ne représente pas le coût complet du site."})),
  {code:"AGR-MGT-10",montant_ht_fcfa:55110175,perimetre:"Tranche conditionnelle : aménagement piscicole; hors mobilisation de la ressource",methode:"Montant individuel du tableau 13",source_pages_pdf:[32,37],reserve:"Ne représente pas le coût complet du site."},
  {code:"AGR-DMB-12",montant_ht_fcfa:9153449,perimetre:"Boutique Kossaba, y compris installation",methode:"Total Kossaba du tableau 14",source_pages_pdf:[33,37],reserve:"Montant HT, distinct du TTC global du lot."},
  {code:"AGR-DMB-11",montant_ht_fcfa:46345116,perimetre:"Travaux UAB Dibaro",methode:"Calcul : lot 4 HT 55 498 565 − Kossaba HT 9 153 449",source_pages_pdf:[33,37],reserve:"Calcul par différence, et non total individuel imprimé."},
];
