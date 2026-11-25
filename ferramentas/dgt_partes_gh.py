#!/usr/bin/env python3
"""IPR Atlas · cópia rápida das colecções grandes da OGC API da DGT, em paralelo no GitHub Actions (Terracrua Design).
Nuno, 25/11/2026 13h06: «isto está a demorar muito tempo, não consegues acelerar isto? [...] não pares».
O Worker ipr-copia-dgt faz no máximo ~20 pedidos por minuto (limites da conta gratuita) e a DGT responde 429 a quem pede
muito do mesmo IP. Aqui cada fatia corre numa máquina do GitHub, com IP próprio, e escreve GeoJSON por linhas (um elemento
por linha, sem repetidos pelo id). A DGT dá no máximo 100 por pedido e recusa offset >= 10000: por isso reparte-se por
freguesia (administrativeunit = DICOFRE) ou por quadrícula de 0,1°.
Uso: dgt_partes_gh.py <colecção> <freguesias|grelha> <fatia> <n_fatias> <saida.geojsons>"""
import json, sys, time, urllib.request, urllib.error, concurrent.futures as cf, threading
OGC = "https://ogcapi.dgterritorio.gov.pt/collections/"
col, modo, fatia, nf, saida = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
FIOS = 3
def pedir(u, tent=0):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt)"}), timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if tent < 12 and (e.code == 429 or e.code >= 500): time.sleep(min(300, 10 * (tent + 1))); return pedir(u, tent + 1)
        raise
    except Exception:
        if tent < 12: time.sleep(min(300, 10 * (tent + 1))); return pedir(u, tent + 1)
        raise
def partes():
    if modo == "freguesias":
        l = []
        for o in range(0, 9000, 100):
            j = pedir(OGC + "freguesias/items?f=json&limit=100&skipGeometry=true&offset=%d" % o)
            l += [str(f["properties"]["dtmnfr"]) for f in j.get("features", []) if f.get("properties", {}).get("dtmnfr")]
            if len(j.get("features", [])) < 100: break
        return sorted(set(l))
    l, d, x = [], 0.1, -9.6
    while x < -6.15:
        y = 36.9
        while y < 42.2: l.append(",".join("%.3f" % v for v in (x, y, x + d, y + d))); y += d
        x += d
    return l
P = partes()[fatia::nf]
print(col, modo, "fatia", fatia, "de", nf, ":", len(P), "partes", flush=True)
vistos, trinco, n_el, n_ped = set(), threading.Lock(), [0], [0]
out = open(saida, "w")
def parte(p):
    q = ("administrativeunit=" if modo == "freguesias" else "bbox=") + p
    off, grandes = 0, False
    while True:
        if off >= 9900: grandes = True; break
        j = pedir(OGC + col + "/items?f=json&limit=100&offset=%d&%s" % (off, q))
        fs = j.get("features", [])
        with trinco:
            n_ped[0] += 1
            for f in fs:
                k = f.get("id") or json.dumps(f.get("properties"), sort_keys=True)[:200]
                if k in vistos: continue
                vistos.add(k); out.write(json.dumps(f, ensure_ascii=False, separators=(",", ":")) + "\n"); n_el[0] += 1
        off += len(fs)
        nm = j.get("numberMatched")
        if not fs or len(fs) < 100 or (nm is not None and off >= nm): break
    return p, grandes
grandes, t0 = [], time.time()
with cf.ThreadPoolExecutor(FIOS) as ex:
    for i, (p, g) in enumerate(ex.map(parte, P)):
        if g: grandes.append(p)
        if i % 50 == 0: print("%d/%d partes · %d elementos · %d pedidos · %.0f s" % (i, len(P), n_el[0], n_ped[0], time.time() - t0), flush=True)
out.close()
print("FIM", col, "fatia", fatia, ":", n_el[0], "elementos,", n_ped[0], "pedidos, partes com mais de 9900:", grandes, flush=True)
