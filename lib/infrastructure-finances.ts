// Server-only financial source. Never import this module from a client component.
const source = "Coûts Infrastructures CRR et PM.xlsx";
export const infrastructureFinances = [
  {code:"AGR-EXISTANT-15",type:"PM",site:"Babougou",forage:34082500,amenagement:33675857,equipement:null,semences:750000,total:68508357,feuille:"PM",ligne:3},
  {code:"AGR-EXISTANT-13",type:"PM",site:"Kenekele",forage:35442500,amenagement:35583818,equipement:null,semences:750000,total:71776318,feuille:"PM",ligne:4},
  {code:"AGR-EXISTANT-14",type:"PM",site:"Nadiobougou",forage:35480000,amenagement:34165670,equipement:null,semences:750000,total:70395670,feuille:"PM",ligne:5},
  {code:"AGR-EXISTANT-16",type:"PM",site:"Monzona",forage:37035000,amenagement:32008721,equipement:null,semences:750000,total:69793721,feuille:"PM",ligne:6},
  {code:"CRR-DOUMBA",type:"CRR",site:"Doumba",forage:38260000,amenagement:88426641,equipement:5115000,semences:2207000,total:134008641,feuille:"CRR",ligne:3},
  {code:"CRR-SIRAKOROLA",type:"CRR",site:"Sirakorola",forage:34235000,amenagement:88714931,equipement:5115000,semences:2207000,total:130271931,feuille:"CRR",ligne:4},
  {code:"CRR-KOULA",type:"CRR",site:"Koula",forage:40920000,amenagement:97752381,equipement:5115000,semences:2207000,total:145994381,feuille:"CRR",ligne:5},
  {code:"CRR-MEGUETAN",type:"CRR",site:"Méguétan",forage:28550000,amenagement:98941881,equipement:5115000,semences:2207000,total:134813881,feuille:"CRR",ligne:6},
].map(row=>({...row,source,devise:"FCFA",base_fiscale:"HT",confirmation:"Devise FCFA et base HT confirmées par le commanditaire le 3 novembre 2026",portee:"Site : montant forage global, sans ventilation par forage individuel",reserve:"Une cellule équipement vide reste non renseignée. Méguétan est le libellé source; aucun rapprochement automatique avec Kékan."}));
