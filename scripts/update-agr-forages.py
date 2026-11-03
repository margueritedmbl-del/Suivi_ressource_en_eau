"""Separate AGR sites and installed wells using CEST recap tables, PDF pp.166/168/170.
Run once against the November 3 baseline; existing well values are preserved.
"""
import collections
import csv
import json
from pathlib import Path
import unicodedata

root = Path(__file__).resolve().parents[1]
folder = root / 'public/data/referentiels'
def read(name): return json.loads((folder / name).read_text())
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if c.isalnum())
def write(name, rows):
    path = folder / name
    path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    if not isinstance(rows,list): return
    with path.with_suffix('.csv').open('w',encoding='utf-8-sig',newline='') as stream:
        keys=list(dict.fromkeys(k for row in rows for k in row))
        writer=csv.DictWriter(stream,fieldnames=keys,delimiter=';',lineterminator='\n')
        writer.writeheader()
        writer.writerows({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in row.items()} for row in rows)

agr=[a for a in read('infrastructures_agr_2026.json') if a['type']!='CRR']
assert len(agr)==16
for a in agr:
    a['type']={'Pisciculture':'EP','Unité d’aliment bétail':'UAB','Boutique d’intrants':'BIA'}.get(a['type'],a['type'])
    a['surface_ha']=a['surface_ha_source'] if a['type'] in ['PM','EP'] else None
    a['capacite_stockage_m3_source_gps']=a['donnees_techniques_a_confirmer']['capacite_m3'] if a['type'] in ['PM','EP'] else None
    if a['type']=='EP':
        a['capacite_stockage_m3_rapport']=10
        a['points_a_verifier']=['Stockage : fichier GPS 20 m³; légende photographique du rapport p.456 : 10 m³.']
wells=read('forages_exploitation_crr_pm.json')
assert len(wells)==16, 'Already applied or unexpected baseline'
# lot, commune, site, well, drilled depth, HMT, CIP, airlift, short test,
# long-test maximum, pump model, source power, count of 250 W modules.
rows=[
 (1,'Sirakorola','Dogoni','F1',100,78,70,7.2,6,39.93,'LORENTZ PS2-4000 C-SJ8-15',4,24),
 (1,'Sirakorola','Dogoni','F3',120,68,60,6.8,60,46.15,'GRUNDFOS SQ 5-70',1.85,12),
 (1,'Sirakorola','M’Pièbougou','F1',100,48,40,7,8,60.37,'LORENTZ PS2-1800 C-SJ1-25',1.8,12),
 (1,'Sirakorola','M’Pièbougou','F2',80,58,50,17,8,34.95,'LORENTZ PS2-4000 C-SJ8-15',4,24),
 (1,'Sirakorola','N’Gabakoro','F1',75,48,40,28,15,63.71,'LORENTZ PS2-4000 C-SJ5-25',4,24),
 (1,'Sirakorola','Zana','F1',57.78,58,50,None,None,5.46,'LORENTZ PS2-1800 C-SJ1-25',1.8,12),
 (1,'Sirakorola','Zana','F2',50.6,48,40,None,None,37.94,'LORENTZ PS2-1800 C-SJ1-25',1.8,12),
 (2,'Koula','Diéni','F1',100,78,70,6,6,138.3,'LORENTZ PS2-4000 C-SJ5-25',4,24),
 (2,'Koula','Diéni','F3',80,88,80,5.42,None,None,'GRUNDFOS SQF 1.2-2',1.2,16),
 (2,'Koula','Fassoumbougou','F1',91.77,93,85,4.5,4.5,3.19,'GRUNDFOS SPA-25 2.2 kW',2.2,24),
 (2,'Koula','Fassoumbougou','F2',101,103,95,6.5,4.5,3.55,'LORENTZ PS2-1800 C-SJ1-25',4,16),
 (2,'Koula','Tamani Bassala','F1',105,108,100,5,4.5,5.46,'LORENTZ PS2-4000 C-SJ5-25',4,32),
 (2,'Koula','Tamani Bassala','F2',110,108,100,4,4,4.07,'GRUNDFOS SQF 2.5-2',2.5,16),
 (3,'Méguétan','Dogoni','F1',101,88,80,None,5,5,'LORENTZ PS2-4000 C-SJ5-25',4,24),
 (3,'Méguétan','Dogoni','F3',70,72,64,None,10,32,'LORENTZ PS2-4000 C-SJ8-15',4,24),
 (3,'Méguétan','Fèya','F2',101,98,90,None,4,7,'LORENTZ PS2-4000 C-SJ5-25',4,24),
 (3,'Méguétan','Fèya','F3',111.2,98,90,None,4.2,5,'LORENTZ PS2-4000 C-SJ5-25',4,24),
 (3,'Méguétan','Tanabougou','F1',101.2,96,90,None,4.2,5,'LORENTZ PS2-1800 C-SJ1-25',1.8,12),
]
for lot,c,s,ref,depth,hmt,cip,air,short,long,pump,power,modules in rows:
    a=next(a for a in agr if norm(a['commune'])==norm(c) and norm(a['site'])==norm(s))
    page={1:166,2:168,3:170}[lot]
    prefix={'Sirakorola':'SRK','Koula':'KLA','Méguétan':'MGT'}[c]
    code=f"{a['type']}-{prefix}-{norm(s).upper()}-{ref}"
    alerts=['Puissance source différente de nombre de modules × 250 W; signification de la puissance source à vérifier.']
    if s=='Dogoni' and lot==1 and ref=='F3': alerts.append('F3 dans le tableau; F2/SE2 dans une annexe : désignation à confirmer.')
    if lot==2 and cip>=depth: alerts.append('CIP égale ou supérieure à la profondeur indiquée; cotes à vérifier.')
    if air and short and short>2*air: alerts.append('Débit court imprimé très supérieur au débit airlift; valeur source à vérifier.')
    if lot==3: alerts.append('Tableau : SEEBA; corps du rapport pour le lot 3 : SETRA SA.')
    wells.append(dict(code=code,composante=a['type'],commune=c,site=s,forage=ref,agr_code=a['code'],latitude=None,longitude=None,latitude_site=a['latitude'],longitude_site=a['longitude'],position_type='Position individuelle non renseignée; coordonnées du site AGR séparées',profondeur_foree_m=depth,hmt_m=hmt,cote_installation_pompe_m=cip,debit_airlift_m3h=air,debit_essai_courte_duree_m3h=short,debit_maximal_essai_longue_duree_m3h=long,debit_exploitation_m3h=short if lot==3 else None,qualification_debit_exploitation='Débit d’exploitation après essai court (intitulé tableau)' if lot==3 else 'Non qualifié comme débit d’exploitation; essais conservés séparément',marque_pompe=pump,puissance_champ_source_kw=power,puissance_pompe_kw=None,nombre_modules=modules,puissance_module_w=250,puissance_installee_kwc=modules*.25,methode_puissance_installee='Calcul théorique : nombre_modules × puissance_module_w / 1000',entreprise={1:'SORY BUILDING',2:'HAICO/ETIMAC/E2GO',3:'SETRA SA'}[lot],entreprise_tableau_source='SEEBA' if lot==3 else None,source='Rapport final AGR CEST du 14 août 2026',source_pages_pdf=[page],alertes_source=alerts,volume_preleve_m3=None,heures_pompage=None,index_compteur_m3=None))
    a['forages_reference'].append(code)
for well in wells:
    if well['composante']=='PM' and not well.get('agr_code'):
        matches=[a for a in agr if well['code'] in a['forages_reference']]
        if matches: well['agr_code']=matches[0]['code']
for a in agr:
    a['nombre_forages_documentes']=len(a['forages_reference'])
    declared=a['donnees_techniques_a_confirmer']['nombre_forages']
    if a['type'] in ['PM','EP'] and declared!=len(a['forages_reference']):
        a.setdefault('points_a_verifier',[]).append(f"Nombre de forages : {declared} dans le fichier GPS; {len(a['forages_reference'])} documentés.")
assert len(wells)==34 and len({w['code'] for w in wells})==34
write('forages_exploitation_crr_pm.json',wells)
write('infrastructures_agr_2026.json',agr)
summary=read('referentiel_resume.json')
known=[w for w in wells if w['debit_exploitation_m3h'] is not None]
summary['forages_exploitation'].update(total=34,crr=8,pm=25,ep=1,debits_exploitation_renseignes=len(known),debits_exploitation_non_renseignes=34-len(known),debit_nominal_total_m3h=round(sum(w['debit_exploitation_m3h'] for w in known),2),modules_pv=sum(w['nombre_modules'] for w in wells),puissance_installee_totale_kwc=round(sum(w['puissance_installee_kwc'] for w in wells),2))
summary['agr']={'total':16,'types':dict(collections.Counter(a['type'] for a in agr))}
summary['notes']+=['Débits d’essai et volumes prélevés restent distincts.','18 forages supplémentaires sans position individuelle; coordonnées du site AGR disponibles séparément.','Puissance photovoltaïque théorique calculée depuis les modules; divergences source signalées.']
write('referentiel_resume.json',summary)
print('16 AGR sans CRR; 34 forages dont 18 ajouts; données source et liens conservés.')
