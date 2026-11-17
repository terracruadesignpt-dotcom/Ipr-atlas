# IPR Atlas · junta os blocos da nossa cópia da DGT (R2 tcd-camadas, dgt/<colecção>/) num só GeoJSONSeq, para o tippecanoe.
# A lista dos blocos está em dgt/_listas/<colecção>.txt. Os blocos de repescagem (rep/) e os principais podem repetir
# elementos: fica o primeiro de cada id. Terracrua Design, 17/11/2026.
import json, sys, concurrent.futures as cf, urllib.request, time
BASE = "https://camadas.terracruadesign.pt/"
col, saida = sys.argv[1], sys.argv[2]
def ler(u, n=6):
    for i in range(n):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + u, headers={"User-Agent": "ipr-atlas-pmtiles"}), timeout=120) as r:
                return r.read()
        except Exception as e:
            if i == n - 1: raise
            time.sleep(5 * (i + 1))
chaves = [k for k in ler("dgt/_listas/" + col + ".txt").decode().split("\n") if k.strip()]
print(col, len(chaves), "blocos", flush=True)
vistos, n, rep = set(), 0, 0
with open(saida, "w") as f, cf.ThreadPoolExecutor(8) as ex:
    for k, b in zip(chaves, ex.map(ler, chaves)):
        j = json.loads(b)
        for x in j.get("features") or []:
            if not x or not x.get("geometry"): continue
            p = x.get("properties") or {}
            i = x.get("id", p.get("ogc_fid", p.get("id")))
            if i is not None:
                if i in vistos: rep += 1; continue
                vistos.add(i)
            f.write(json.dumps({"type": "Feature", "properties": p, "geometry": x["geometry"]}, separators=(",", ":"), ensure_ascii=False) + "\n")
            n += 1
print(col, n, "elementos;", rep, "repetidos", flush=True)
