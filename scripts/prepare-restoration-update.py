"""Prepare the October 2026 restoration replacement from the supplied shapefiles.

Run with the extracted shapefile directory as the only argument.
Requires pyshp, shapely and pyproj. Does not publish or modify source files.
"""
import collections
import datetime
import hashlib
import json
import pathlib
import sys
import warnings

import shapefile
from pyproj import CRS
from shapely.geometry import shape

warnings.filterwarnings('ignore', category=UserWarning, module='shapefile')
root = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1])
target = root / 'public/data/decisionnel'
target.mkdir(parents=True, exist_ok=True)

def write(name, value):
    (target / name).write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + '\n')

def read(pattern):
    paths = list(source.rglob(pattern))
    if len(paths) != 1:
        raise ValueError(f'Expected one layer: {pattern}')
    path = paths[0]
    assert CRS.from_wkt(path.with_suffix('.prj').read_text()).to_epsg() == 4326
    # UTF-8 values are intact; some DBF field names were truncated mid-character.
    reader = shapefile.Reader(str(path), encoding='utf-8', encodingErrors='replace')
    return path, list(reader.iterShapeRecords())

def commune(v):
    return {'Meguetan': 'Méguétan', 'Méguétan': 'Méguétan'}.get(str(v).strip(), str(v).strip())

path, raw = read('*polygon*.shp')
_, points = read('Restauration globale*point*.shp')
assert len(raw) == len(points)
features, records, seen, removed = [], [], {}, []
flags = ['Aménageme', 'RNA', 'Mise en d�', 'Forêt com', 'Zaï', 'Demi-lune', 'Digue filt', 'Cordon pie', 'Compostage', 'Reboisemen', 'Enrichisse']
for sr, point in zip(raw, points):
    row = sr.record.as_dict()
    assert row == point.record.as_dict(), 'Point/polygon attributes differ'
    geom = sr.shape.__geo_interface__
    polygon = shape(geom)
    assert polygon.is_valid and not polygon.is_empty
    assert -9 < polygon.bounds[0] < polygon.bounds[2] < -6
    assert 12 < polygon.bounds[1] < polygon.bounds[3] < 15
    signature = json.dumps([list(sr.record), geom], sort_keys=True, ensure_ascii=False)
    identity = str(row['ID'])
    if identity in seen:
        assert seen[identity] == signature, 'Conflicting source ID'
        removed.append(identity)
        continue
    seen[identity] = signature
    area = float(row['Surf_ha'])
    assert area > 0
    technology = str(row['Méthode d']).strip()
    assert '\ufffd' not in technology
    source_date = row['Date de _1']
    date = datetime.date.fromisoformat(source_date.replace('/', '-')).isoformat()
    props = {'ID': row['ID'], 'Date de _1': date,
             'commune_2': commune(row['commune_2']), 'village_2': row['village_2'],
             'Surf_ha': area, 'Méthode de': technology,
             'source_layer': path.stem, 'source_version': '2026-10-29'}
    for key in flags:
        props[key.replace('�', '')] = row.get(key)
    features.append({'type': 'Feature', 'id': identity, 'properties': props, 'geometry': geom})
    lon, lat = point.shape.points[0]
    records.append({'id': identity, 'date': date, 'commune': props['commune_2'],
                    'village': row['village_2'], 'surface_ha': area, 'technologie': technology,
                    'latitude': lat, 'longitude': lon})
fc = {'type': 'FeatureCollection', 'features': features}
write('restaurations_data.json', fc)
write('restaurations.geojson', fc)
summary = {'sites': len(records), 'surface_ha': round(sum(r['surface_ha'] for r in records), 2),
           'technologies': dict(collections.Counter(r['technologie'] for r in records)),
           'communes': dict(collections.Counter(r['commune'] for r in records)), 'records': records,
           'source_version': '2026-10-29', 'surface_method': 'Somme du champ source Surf_ha après suppression des doublons strictement identiques; ne représente pas une union spatiale.'}
write('restaurations_resume.json', summary)
audit = {'source_features': len(raw), 'retained_features': len(records), 'removed_exact_duplicate_ids': removed,
         'surface_ha': summary['surface_ha'], 'valid_geometries': len(features), 'crs': 'EPSG:4326',
         'source_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
         'excluded_from_totals': ['Représentation ponctuelle des mêmes parcelles', 'Synthèse par village', 'Fumure organique (couche distincte, recouvrement non vérifié)'],
         'public_attributes': 'Champs agronomiques et territoriaux uniquement; aucun nom de bénéficiaire.'}
write('restaurations_audit_20261029.json', audit)
print(json.dumps(audit, ensure_ascii=False, indent=2))
