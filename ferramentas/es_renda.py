# IPR Atlas · Espanha: renda das famílias por secção censal e por município (INE, Atlas de Distribución de Renta de los Hogares,
# CC BY 4.0), a partir do pacote de dados ineAtlas.data (cópia fiel das tabelas do INE). Terracrua Design, 17/11/2026.
# Uso: python3 es_renda.py <dir com os csv> <seccoes.geojsons (EPSG:4326)> <saida.geojsons> <dir de saída dos municípios>
import csv, glob, json, os, sys
d, ent, sai, dmun = sys.argv[1:5]
def ler(pasta):
    return list(csv.DictReader(open(glob.glob(os.path.join(d, pasta, '*.csv'))[0], encoding='utf-8')))
num = lambda v: (int(float(v)) if v not in ('', 'NA', None) else None)
sec = {}
for x in ler('t'):
    if x['year'] == '2024': sec[x['tract_code']] = x
mun, hist = {}, {}
for x in ler('m'):
    hist.setdefault(x['mun_code'], {})[x['year']] = num(x['net_income_pc'])
    if x['year'] == '2024': mun[x['mun_code']] = x
gini = {}
for x in ler('g'):
    if x['year'] == '2024': gini[x['mun_code']] = x
n = 0
with open(ent, encoding='utf-8') as f, open(sai, 'w', encoding='utf-8') as o:
    for l in f:
        l = l.strip().lstrip('\x1e')
        if not l: continue
        g = json.loads(l); c = g['properties'].get('tract_code')
        x = sec.get(c)
        p = {'s': c, 'm': (x or {}).get('mun_name', '')}
        if x: p.update({'r': num(x['net_income_pc']), 'rh': num(x['net_income_hh']), 'med': num(x['median_income_equiv']), 'b': num(x['gross_income_pc'])})
        g['properties'] = p; o.write(json.dumps(g, ensure_ascii=False, separators=(',', ':')) + '\n'); n += 1
print('secções:', n, 'com renda:', sum(1 for _ in sec))
os.makedirs(dmun, exist_ok=True)
prov = {}
for c, x in mun.items():
    gi = gini.get(c, {})
    prov.setdefault(c[:2], {})[c] = {'n': x['mun_name'], 'ano': 2024, 'r': num(x['net_income_pc']), 'rh': num(x['net_income_hh']),
        'med': num(x['median_income_equiv']), 'b': num(x['gross_income_pc']), 'gini': (float(gi['gini']) if gi.get('gini') not in (None, '', 'NA') else None),
        'p80p20': (float(gi['p80p20']) if gi.get('p80p20') not in (None, '', 'NA') else None),
        'hist': {a: v for a, v in sorted(hist.get(c, {}).items()) if v is not None}}
for p, t in prov.items():
    json.dump({'fonte': 'INE, Atlas de Distribución de Renta de los Hogares (CC BY 4.0)', 'renda': t}, open(os.path.join(dmun, 'es-renda-%s.json' % p), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('províncias:', len(prov), 'municípios:', len(mun))
