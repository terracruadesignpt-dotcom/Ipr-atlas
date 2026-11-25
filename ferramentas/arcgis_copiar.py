#!/usr/bin/env python3
"""IPR Atlas · cópia das camadas vectoriais do ICNF e da APA (ArcGIS REST) para PMTiles próprias. Terracrua Design.
Nuno, 25/11/2026 13h07: «Copia tudo do ICNF, da APA, tudo. Não queremos estar dependentes.»
  lista <saida.json>                        lista os serviços MapServer/FeatureServer das pastas do ICNF e da APA
  copiar <url do serviço> <org> <pasta>     copia todas as camadas de elementos do serviço para <pasta>/<nome>__<id>.geojsons
Dados abertos (ICNF e APA, CC BY 4.0 salvo indicação na própria camada)."""
import json, os, re, sys, time, urllib.parse, urllib.request
RAIZES = {
    "icnf": ["https://sigservices.icnf.pt/server/rest/services/BDG"],
    "apa": ["https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb", "https://sniambgeoogc.apambiente.pt/getogc/rest/services/PGRH",
            "https://sniambgeoogc.apambiente.pt/getogc/rest/services/Atlas", "https://sniambgeoogc.apambiente.pt/getogc/rest/services/Visualizador"],
}
def pedir(u, tent=0):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt)"}), timeout=180) as r:
            return json.loads(r.read())
    except Exception as e:
        if tent < 6: time.sleep(15 * (tent + 1)); return pedir(u, tent + 1)
        raise
def lista(saida):
    out = []
    for org, rs in RAIZES.items():
        for r in rs:
            try: j = pedir(r + "?f=json")
            except Exception as e: print("falhou", r, e); continue
            for s in j.get("services", []):
                if s.get("type") in ("MapServer", "FeatureServer"):
                    base = r.rsplit("/rest/services/", 1)[0] + "/rest/services/"
                    out.append({"org": org, "url": base + s["name"] + "/" + s["type"], "nome": re.sub(r"[^A-Za-z0-9]+", "_", s["name"].split("/")[-1])})
    json.dump(out, open(saida, "w")); print(len(out), "serviços")
def copiar(url, org, pasta):
    os.makedirs(pasta, exist_ok=True)
    nome = re.sub(r"[^A-Za-z0-9]+", "_", url.split("/rest/services/")[1].rsplit("/", 1)[0].split("/")[-1])
    sv = pedir(url + "?f=json")
    man = {"servico": url, "org": org, "camadas": []}
    for ly in sv.get("layers", []) + sv.get("tables", []):
        lid = ly["id"]
        try: info = pedir("%s/%d?f=json" % (url, lid))
        except Exception as e: print("camada", lid, e); continue
        if info.get("type") != "Feature Layer" or "Query" not in (info.get("capabilities") or "Query"): continue
        mx = int(info.get("maxRecordCount") or 1000); pag = (info.get("advancedQueryCapabilities") or {}).get("supportsPagination", False)
        f = os.path.join(pasta, "%s__%d.geojsons" % (nome, lid)); n = 0
        with open(f, "w") as o:
            if pag:
                off, pg = 0, mx  # 25/11: se o servidor der erro (500) numa página, reduz-se a página; uma página de 1 que falhe salta-se
                while True:
                    q = urllib.parse.urlencode({"where": "1=1", "outFields": "*", "outSR": 4326, "f": "geojson", "resultOffset": off, "resultRecordCount": pg, "returnGeometry": "true"})
                    try: j = pedir("%s/%d/query?%s" % (url, lid, q), 4)
                    except Exception as e:
                        if pg > 1: pg = max(1, pg // 4); print("página menor", lid, off, pg, e, flush=True); continue
                        print("salta", lid, off, e, flush=True); off += 1; pg = mx; continue
                    fs = j.get("features", [])
                    for x in fs: o.write(json.dumps(x, ensure_ascii=False, separators=(",", ":")) + "\n")
                    n += len(fs); off += len(fs)
                    if not fs or (len(fs) < pg and not j.get("exceededTransferLimit")): break
            else:
                ids = pedir("%s/%d/query?%s" % (url, lid, urllib.parse.urlencode({"where": "1=1", "returnIdsOnly": "true", "f": "json"}))).get("objectIds") or []
                ids.sort()
                for i in range(0, len(ids), min(mx, 500)):
                    q = urllib.parse.urlencode({"objectIds": ",".join(map(str, ids[i:i + min(mx, 500)])), "outFields": "*", "outSR": 4326, "f": "geojson"})
                    try: j = pedir("%s/%d/query?%s" % (url, lid, q), 4)
                    except Exception as e: print("bloco falhou", lid, i, e, flush=True); continue
                    for x in j.get("features", []): o.write(json.dumps(x, ensure_ascii=False, separators=(",", ":")) + "\n"); n += 1
        print(nome, lid, ly.get("name"), n, "elementos", flush=True)
        if n == 0: os.remove(f); continue
        man["camadas"].append({"id": lid, "nome": ly.get("name"), "geom": info.get("geometryType"), "n": n, "ficheiro": os.path.basename(f).replace(".geojsons", ".pmtiles")})
    json.dump(man, open(os.path.join(pasta, nome + "__manifesto.json"), "w"), ensure_ascii=False)
if __name__ == "__main__":
    if sys.argv[1] == "lista": lista(sys.argv[2])
    else: copiar(sys.argv[2], sys.argv[3], sys.argv[4])
