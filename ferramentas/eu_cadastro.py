#!/usr/bin/env python3
"""IPR Atlas · cadastro europeu em dados abertos (fase 1: França, Países Baixos, Chéquia, Luxemburgo). Terracrua Design.
Nuno, 25/11/2026 13h30: «queremos o cadastro de toda a Europa [...] aproveita agora esta cena do GitHub».
Cada fatia descarrega a sua parte, converte para GeoJSON por linhas em EPSG:4326 (GDAL) e escreve <saida>/<nome>.geojsons.
Licenças: FR Licence Ouverte Etalab 2.0 (DGFiP/Etalab); NL CC BY 4.0 (Kadaster/PDOK); CZ CC BY 4.0 (ČÚZK); LU CC0 (ACT).
26/11/2026 (Nuno: «avança já»): Espanha (Catastro, INSPIRE ATOM, uso livre citando a Dirección General del Catastro; o País
Basco e Navarra têm cadastro próprio e ficam de fora). Cada ficheiro acabado (departamento, província, fatia) vira logo um
PMTiles próprio, é publicado e copiado para o R2 (EU_ENTREGAR=1): um PMTiles do país inteiro passaria dos 2 GB que as
versões do GitHub aceitam, e assim um corte a meio não deita fora o que já ficou pronto.
Uso: eu_cadastro.py <pais> <fatia> <n_fatias> <saida>"""
import gzip, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, zipfile
INICIO = time.time()
# 26/11/2026, 19h50: o GitHub corta cada fatia aos 350 min. Pára antes (EU_LIMITE_S, 5 h 20 min por omissão), entrega o que
# já tem e o resto faz-se na corrida seguinte (as províncias já publicadas são saltadas).
LIMITE = float(os.environ.get("EU_LIMITE_S", "19200"))
def tempo_acabou(): return time.time() - INICIO > LIMITE
pais, fatia, nf, saida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
os.makedirs(saida, exist_ok=True); T = os.environ.get("RUNNER_TEMP", "/tmp") + "/eu"; os.makedirs(T, exist_ok=True)
UA = {"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt; dados abertos)"}
def baixar(u, f, tent=0):
    # 26/11, 19h50: os nomes dos municípios do Catastro têm espaços e acentos («07015-CIUTADELLA DE MENORCA»); o urllib recusava
    # o endereço e cada recusa gastava 5 min em tentativas. O caminho passa a ir codificado e um endereço inválido não se repete.
    u = urllib.parse.quote(u, safe=":/?&=%#+,;@~")
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=600) as r, open(f, "wb") as o: shutil.copyfileobj(r, o, 1 << 20)
        return True
    except (ValueError, urllib.error.HTTPError) as e:
        if isinstance(e, urllib.error.HTTPError) and e.code >= 500 and tent < 2: time.sleep(15 * (tent + 1)); return baixar(u, f, tent + 1)
        print("falhou", u, e, flush=True); return False
    except Exception as e:
        if tent < 3: time.sleep(15 * (tent + 1)); return baixar(u, f, tent + 1)
        print("falhou", u, e, flush=True); return False
def entregar(g):
    """Faz o PMTiles de um ficheiro acabado, publica-o na versão eu-<pais>-pmtiles e pede a cópia para o R2."""
    if os.environ.get("EU_ENTREGAR") != "1" or not os.path.exists(g) or os.path.getsize(g) == 0: return
    b = os.path.splitext(os.path.basename(g))[0]; pm = os.path.join(T, "eu-%s-cadastro.pmtiles" % b); rel = "eu-%s-pmtiles" % pais
    for z in ("16", "15", "14"):
        subprocess.run(["tippecanoe", "-o", pm, "-l", "cadastro", "-A", "Cadastro (dados abertos) · cópia IPR Atlas", "-Z12", "-z" + z,
                        "--drop-densest-as-needed", "--no-tile-size-limit", "-P", "-t", T, "--force", g], check=False)
        if os.path.exists(pm) and os.path.getsize(pm) < 1900000000: break
    if not os.path.exists(pm): print("sem PMTiles", b, flush=True); return
    rp = os.environ.get("GITHUB_REPOSITORY", "")
    if subprocess.run(["gh", "release", "view", rel, "-R", rp], capture_output=True).returncode:
        subprocess.run(["gh", "release", "create", rel, "-R", rp, "-t", "Cadastro %s (dados abertos)" % pais, "-n", "Cópia IPR Atlas. Licença da fonte de origem."], check=False)
    subprocess.run(["gh", "release", "upload", rel, pm, "-R", rp, "--clobber"], check=False)
    r2(rel, os.path.basename(pm))
    print("entregue", b, round(os.path.getsize(pm) / 1e6), "MB", flush=True)
    os.remove(pm); os.remove(g)
def r2(rel, nome):
    """26/11: o Worker recusa (403) o User-Agent do urllib; com curl passa, como nos outros fluxos."""
    for t in range(3):
        p = subprocess.run(["curl", "-sS", "--max-time", "900", "https://ipr-copia-ficheiro.terracrua-ipr.workers.dev/?ext=%s/%s&ir=1" % (rel, nome)], capture_output=True, text=True)
        print("R2", nome, (p.stdout or p.stderr)[:200], flush=True)
        if '"copiado":true' in p.stdout: return True
        time.sleep(30)
    return False
if pais == "r2":  # só copia para o R2 o que já está nas versões eu-<país>-pmtiles
    rp = os.environ.get("GITHUB_REPOSITORY", "")
    for pp in os.environ.get("EU_PAISES", "es,fr,cz,nl,lu").split(","):
        rel = "eu-%s-pmtiles" % pp
        nomes = subprocess.run(["gh", "release", "view", rel, "-R", rp, "--json", "assets", "-q", ".assets[].name"], capture_output=True, text=True).stdout.split()
        print(rel, len(nomes), "ficheiros", flush=True)
        for n in nomes:
            if n.endswith(".pmtiles"): r2(rel, n)
    sys.exit(0)
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
        entregar(os.path.join(saida, "fr-%s.geojsons" % d))
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
    entregar(out)
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
elif pais == "es":
    # ATOM INSPIRE do Catastro: feed geral -> feed por província -> um zip GML por município (EPSG 25829/25830/25831, 4326 no fim).
    BASE = "https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/"
    provs = sorted(set(re.findall(r'(https?://[^"<>]+ES\.SDGC\.CP\.atom_\d+\.xml)', texto(BASE + "ES.SDGC.CP.atom.xml"))))
    print("es", len(provs), "províncias no ATOM", flush=True)
    # 26/11, 19h50: retoma; as províncias já publicadas em eu-es-pmtiles saltam-se. EU_ES_PROVS limita a uma lista (ex.: "07,15").
    feitas = set(re.findall(r"eu-es-(\d+)-cadastro\.pmtiles", subprocess.run(["gh", "release", "view", "eu-es-pmtiles", "-R",
                 os.environ.get("GITHUB_REPOSITORY", ""), "--json", "assets", "-q", ".assets[].name"], capture_output=True, text=True).stdout))
    so = [x.strip() for x in os.environ.get("EU_ES_PROVS", "").split(",") if x.strip()]
    provs = [p for p in provs if re.search(r"atom_(\d+)\.xml", p).group(1) not in feitas and (not so or re.search(r"atom_(\d+)\.xml", p).group(1) in so)]
    print("es", len(provs), "por fazer (já feitas:", sorted(feitas), ")", flush=True)
    for pf in provs[fatia::nf]:
        if tempo_acabou(): print("es: tempo acabou, fica para a próxima corrida", flush=True); break
        cod = re.search(r"atom_(\d+)\.xml", pf).group(1)
        try: zs = sorted(set(z.replace("&amp;", "&") for z in re.findall(r'(https?://[^"<>]+\.zip)', texto(pf))))
        except Exception as e: print("es província", cod, e, flush=True); continue
        out = os.path.join(saida, "es-%s.geojsons" % cod); print("es", cod, len(zs), "municípios", flush=True)
        parcial = False
        for i, u in enumerate(zs):
            if tempo_acabou(): parcial = True; print("es", cod, "tempo acabou em", i, "/", len(zs), flush=True); break
            z = os.path.join(T, "m.zip")
            if not baixar(u.replace("http://", "https://"), z): continue
            # 26/11: o zip traz vários GML; abre-se o das parcelas (cadastralparcel), não o zip inteiro.
            try: nomes = zipfile.ZipFile(z).namelist()
            except Exception as e: print("zip", u, e, flush=True); os.remove(z); continue
            gml = [n for n in nomes if n.lower().endswith(".gml") and "cadastralparcel" in n.lower()] or [n for n in nomes if n.lower().endswith(".gml")]
            if not gml: os.remove(z); continue
            tmp = os.path.join(T, "m.geojsons"); ogr("/vsizip/" + z + "/" + gml[0], tmp, ("-select", "nationalCadastralReference,areaValue"))
            if os.path.exists(tmp):
                with open(out, "a") as o, open(tmp) as s2: shutil.copyfileobj(s2, o)
                os.remove(tmp)
            os.remove(z)
            if i % 25 == 0: print("es", cod, i, "/", len(zs), round((time.time() - INICIO) / 60), "min", flush=True)
        if parcial and os.path.exists(out):   # meia província: fica com nome próprio e a província não conta como feita
            q = out.replace("es-%s.geojsons" % cod, "es-%sp%d.geojsons" % (cod, int(time.time()))); os.rename(out, q); out = q
        entregar(out)
        if tempo_acabou(): break
for g in [os.path.join(saida, f) for f in os.listdir(saida) if f.endswith(".geojsons")]: entregar(g)
print("FIM", pais, fatia, os.listdir(saida), flush=True)
