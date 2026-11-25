#!/usr/bin/env python3
"""IPR Atlas · cadastro europeu em dados abertos (fase 1: França, Países Baixos, Chéquia, Luxemburgo). Terracrua Design.
Nuno, 25/11/2026 13h30: «queremos o cadastro de toda a Europa [...] aproveita agora esta cena do GitHub».
Cada fatia descarrega a sua parte, converte para GeoJSON por linhas em EPSG:4326 (GDAL) e escreve <saida>/<nome>.geojsons.
Licenças: FR Licence Ouverte Etalab 2.0 (DGFiP/Etalab); NL CC BY 4.0 (Kadaster/PDOK); CZ CC BY 4.0 (ČÚZK); LU CC0 (ACT).
Uso: eu_cadastro.py <pais> <fatia> <n_fatias> <saida>"""
import gzip, json, os, re, shutil, subprocess, sys, time, urllib.request
pais, fatia, nf, saida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
os.makedirs(saida, exist_ok=True); T = os.environ.get("RUNNER_TEMP", "/tmp") + "/eu"; os.makedirs(T, exist_ok=True)
UA = {"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt; dados abertos)"}
def baixar(u, f, tent=0):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=600) as r, open(f, "wb") as o: shutil.copyfileobj(r, o, 1 << 20)
        return True
    except Exception as e:
        if tent < 5: time.sleep(20 * (tent + 1)); return baixar(u, f, tent + 1)
        print("falhou", u, e, flush=True); return False
def texto(u): 
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read().decode("utf-8", "replace")
def ogr(src, dst, extra=()):
    subprocess.run(["ogr2ogr", "-f", "GeoJSONSeq", "-t_srs", "EPSG:4326", "-lco", "RS=NO", dst, src, *extra], check=False)
if pais == "fr":
    deps = ["%02d" % i for i in range(1, 96) if i != 20] + ["2A", "2B", "971", "972", "973", "974", "976"]
    for d in deps[fatia::nf]:
        g = os.path.join(T, d + ".json.gz")
        if not baixar("https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/departements/%s/cadastre-%s-parcelles.json.gz" % (d, d), g): continue
        n = 0
        with gzip.open(g, "rt", encoding="utf-8") as i, open(os.path.join(saida, "fr-%s.geojsons" % d), "w") as o:
            j = json.load(i)
            for f in j.get("features", []):
                p = f.get("properties", {}); f["properties"] = {k: p.get(k) for k in ("id", "commune", "prefixe", "section", "numero", "contenance") if k in p}
                o.write(json.dumps(f, ensure_ascii=False, separators=(",", ":")) + "\n"); n += 1
        os.remove(g); print("fr", d, n, "parcelas", flush=True)
elif pais == "cz":
    BASE = None
    for b in ("https://services.cuzk.gov.cz/gml/inspire/cp/epsg-4258/", "https://services.cuzk.cz/gml/inspire/cp/epsg-4258/"):
        try: idx = texto(b); BASE = b; break
        except Exception as e: print("cz índice", b, e, flush=True)
    if not BASE: sys.exit(1)
    kus = sorted(set(re.findall(r"(\d{6})\.zip", idx)))[fatia::nf]
    print("cz", len(kus), "katastrální území", flush=True)
    out = os.path.join(saida, "cz-%d.geojsons" % fatia)
    for i, k in enumerate(kus):
        z = os.path.join(T, k + ".zip")
        if not baixar(BASE + "%s.zip" % k, z): continue
        tmp = os.path.join(T, k + ".geojsons"); ogr("/vsizip/" + z, tmp, ("CadastralParcel",))
        if os.path.exists(tmp):
            with open(out, "a") as o, open(tmp) as s: shutil.copyfileobj(s, o)
            os.remove(tmp)
        os.remove(z)
        if i % 200 == 0: print("cz", i, "/", len(kus), flush=True)
elif pais == "lu":
    busca = json.loads(texto("https://data.public.lu/api/1/datasets/?q=INSPIRE%20CadastralParcel&page_size=20"))
    res = []
    for d in busca.get("data", []):
        if "cadastr" in (d.get("title", "") + d.get("slug", "")).lower(): res += d.get("resources", [])
    print("lu recursos", len(res), flush=True)
    for r in res:
        u = r.get("url", "")
        if not re.search(r"\.gml$", u, re.I) and "gml" not in (r.get("format") or "").lower(): continue
        f = os.path.join(T, re.sub(r"[^A-Za-z0-9_.-]", "_", r.get("title") or "lu.gml"))
        if baixar(u, f): ogr(f, os.path.join(saida, "lu-%s.geojsons" % re.sub(r"[^A-Za-z0-9]+", "_", (r.get("title") or "x").replace(".gml", ""))[-30:])); os.remove(f)
elif pais == "nl":
    # ATOM INSPIRE (GML do país inteiro, CC BY 4.0). Segue as ligações até ao ficheiro de dados.
    feed = texto("https://service.pdok.nl/kadaster/cp/atom/v1_0/index.xml")
    subs = re.findall(r'href="([^"]+\.xml)"', feed)
    zips = []
    for s in subs[:5]:
        try: zips += re.findall(r'href="([^"]+\.(?:zip|gml|gpkg)[^"]*)"', texto(s))
        except Exception as e: print("nl", s, e)
    zips = [z.replace("&amp;", "&") for z in zips if "parcel" in z.lower() or "perce" in z.lower()] or [z.replace("&amp;", "&") for z in zips]
    print("nl ficheiros:", zips[:5], flush=True)
    for u in zips[:2]:
        f = os.path.join(T, os.path.basename(u.split("?")[0]) or "nl.zip")
        if baixar(u, f): ogr(("/vsizip/" + f) if f.endswith(".zip") else f, os.path.join(saida, "nl-%s.geojsons" % os.path.basename(f).split(".")[0]))
print("FIM", pais, fatia, os.listdir(saida), flush=True)
