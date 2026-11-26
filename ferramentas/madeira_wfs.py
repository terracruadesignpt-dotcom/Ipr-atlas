#!/usr/bin/env python3
"""IPR Atlas · cópia das camadas vectoriais da DROTe (Governo Regional da Madeira) para GeoJSON por linhas. Terracrua Design.
Nuno, 26/11/2026 10h11: «temos tudo o que é possível da Madeira, Porto Santo, já no Atlas?»; autorizou a cópia própria às 10h25.
O GeoServer regional só responde por espaço de trabalho (geoservices.madeira.gov.pt/geoserver/<ws>/wfs). Para cada espaço
lê o GetCapabilities, guarda as condições de uso (Fees, AccessConstraints) e copia cada tipo de elemento com o ogr2ogr.
Espaços cujas condições proíbem o uso comercial ficam de fora (como no Atlas: MDT, ortofotos, cheias).
Uso: madeira_wfs.py <saida>"""
import json, os, re, subprocess, sys, urllib.request
BASE = "https://geoservices.madeira.gov.pt/geoserver/"
ESPACOS = ["LC_COSRAM_2018", "HY_PGRH_2Ver", "TN_RedeViaria_AMRAM", "TN_RedeViaria", "AU_UnidadesAdministrativas",
           "PS_SitiosProtegidos", "PS_AreasProtegidas", "GN_NomesGeograficos", "AD_Enderecos", "BU_Edificios", "US_Equipamentos",
           "HB_Habitats", "GE_Geologia", "NZ_ZonasRisco", "AM_ZonasGestao", "AM_QualidadeAr", "LU_UsoSolo", "SO_Solos"]
saida = sys.argv[1]; os.makedirs(saida, exist_ok=True)
UA = {"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt; dados abertos)"}
man = {"fonte": "DROTe / Governo Regional da Madeira", "espacos": {}}
for ws in ESPACOS:
    u = BASE + ws + "/wfs?service=WFS&version=2.0.0&request=GetCapabilities"
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: cap = r.read().decode("utf-8", "replace")
    except Exception as e:
        print("sem serviço:", ws, str(e)[:80], flush=True); continue
    cond = " ".join(re.findall(r"<(?:ows:)?(?:Fees|AccessConstraints)>(.*?)</", cap, re.S)).strip()
    tipos = re.findall(r"<(?:wfs:)?FeatureType[^>]*>\s*<(?:wfs:)?Name>([^<]+)</", cap)
    print(ws, len(tipos), "tipos · condições:", cond[:200], flush=True)
    man["espacos"][ws] = {"condicoes": cond, "tipos": tipos, "copiados": []}
    if re.search(r"comercial[^.]{0,60}(proibid|sem consentimento)", cond, re.I):
        print("  fica de fora (uso comercial proibido)", flush=True); continue
    for t in tipos:
        nome = "md-" + re.sub(r"[^A-Za-z0-9]+", "_", t.split(":")[-1]).strip("_")[:60]
        dst = os.path.join(saida, nome + ".geojsons")
        p = subprocess.run(["ogr2ogr", "-f", "GeoJSONSeq", "-t_srs", "EPSG:4326", "-lco", "RS=NO", dst,
                            "WFS:" + BASE + ws + "/wfs", t], capture_output=True, text=True, timeout=3000)
        n = sum(1 for _ in open(dst)) if os.path.exists(dst) else 0
        print("  ", t, "->", nome, n, "elementos", (p.stderr or "")[-160:].strip(), flush=True)
        if n: man["espacos"][ws]["copiados"].append({"tipo": t, "ficheiro": nome + ".pmtiles", "elementos": n})
        elif os.path.exists(dst): os.remove(dst)
json.dump(man, open(os.path.join(saida, "madeira__manifesto.json"), "w"), ensure_ascii=False, indent=1)
print("FIM", sum(len(v["copiados"]) for v in man["espacos"].values()), "camadas", flush=True)
