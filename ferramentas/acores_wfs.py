#!/usr/bin/env python3
# IPR Atlas · copia por páginas uma camada WFS do Governo dos Açores (dados abertos, CC BY 4.0) para GeoJSON por linhas
# (um elemento por linha, formato que o tippecanoe lê). Usado no fluxo dados-acores-pmtiles para os conjuntos grandes demais
# para o Worker (ex.: susceptibilidade a movimentos de vertente). Terracrua Design, 17/11/2026.
import json, sys, time, urllib.parse, urllib.request

srv, camada, saida = sys.argv[1], sys.argv[2], sys.argv[3]
base = "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/" + srv + "/cgi-bin/qgis_mapserv.fcgi"
N, i, total = 5000, 0, 0
with open(saida, "w") as f:
    while True:
        q = {"SERVICE": "WFS", "VERSION": "1.1.0", "REQUEST": "GetFeature", "TYPENAME": camada,
             "OUTPUTFORMAT": "application/json", "SRSNAME": "EPSG:4326", "MAXFEATURES": str(N), "STARTINDEX": str(i)}
        url = base + "?" + urllib.parse.urlencode(q)
        for tent in range(5):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "IPR-Atlas-copia/1.0 (Terracrua Design; dados abertos CC BY 4.0)"})
                js = json.load(urllib.request.urlopen(req, timeout=600))
                break
            except Exception as e:
                print("falhou", i, tent, str(e)[:120], flush=True); time.sleep(30)
        else:
            sys.exit("página " + str(i) + " sem resposta")
        fs = js.get("features") or []
        for ft in fs:
            f.write(json.dumps(ft, ensure_ascii=False, separators=(",", ":")) + "\n")
        total += len(fs)
        print("página", i, len(fs), "total", total, flush=True)
        if len(fs) < N:
            break
        i += N
print("elementos:", total)
if total == 0:
    sys.exit("nenhum elemento")
