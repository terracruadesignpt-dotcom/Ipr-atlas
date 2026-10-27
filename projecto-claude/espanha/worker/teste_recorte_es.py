"""Portão 1 de Espanha: recortes de teste de 5 ha a partir do servidor.

Corre no servidor de processamento (ou no motor), onde há acesso aos
serviços do IGN. Não toca no site nem em encomendas.

    python3 teste_recorte_es.py            # diagnóstico + 8 recortes
    python3 teste_recorte_es.py --so-diag  # só GetCapabilities

Saída: pasta ./teste_es_AAAAMMDD-HHMM/ com os GeoTIFF, relatorio.json e
relatorio.md (para colar na conversa).
"""
import json
import os
import sys
import time

import fonte_es as F

# Terrenos de teste: um quadrado de 5 ha em cada situação que importa.
CASOS = [
    ("Extremadura, dehesa junto à fronteira (Badajoz)", -6.97, 38.78),
    ("Andaluzia, Sierra de Aracena (Huelva), montado denso", -6.58, 37.90),
    ("Andaluzia, Alpujarras (Granada), relevo forte", -3.30, 36.93),
    ("Galiza, Ourense, minifúndio e floresta", -7.95, 42.28),
    ("Castela e Leão, Zamora, fronteira (Arribes)", -6.45, 41.35),
    ("Catalunha, Lleida, 3.ª cobertura iniciada em 2022", 1.20, 41.95),
    ("Baleares, Maiorca (Tramuntana)", 2.75, 39.75),
    ("Canárias, Tenerife (REGCAN95, fuso 28)", -16.50, 28.35),
]


def main():
    cfg = F.ler_config()
    pasta = os.path.abspath(time.strftime("teste_es_%Y%m%d-%H%M"))
    os.makedirs(pasta, exist_ok=True)
    rel = {"quando": time.strftime("%Y-%m-%d %H:%M"), "diagnostico": F.diagnostico(cfg),
           "casos": []}
    if "--so-diag" not in sys.argv:
        for nome, lon, lat in CASOS:
            t0 = time.time()
            linha = {"caso": nome, "lon": lon, "lat": lat}
            try:
                r = F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), os.path.join(pasta, f"{lon}_{lat}"),
                                   cfg, log=lambda *a: None)
                linha.update(ok=True, fonte=r["fonte"], crs=r["crs"], res=r["resolucao_m"],
                             nodata=round(r["nodata_frac"], 4), zmin=r["zmin"], zmax=r["zmax"],
                             tentativas=r["tentativas"])
            except F.SemLidar as e:
                linha.update(ok=False, motivo="sem LiDAR", detalhe=json.loads(str(e)))
            except Exception as e:  # noqa: BLE001
                linha.update(ok=False, motivo=repr(e))
            # Envolvente a 5 m (bacias, ficha do terreno): testa o WCS do IGN.
            try:
                e = F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), os.path.join(pasta, f"{lon}_{lat}_5m"),
                                   cfg, log=lambda *a: None, so_base=False)
                linha["envolvente_5m"] = f"{e['fonte']} {e['resolucao_m']} m, sem dado {e['nodata_frac']:.1%}"
            except Exception as ex:  # noqa: BLE001
                linha["envolvente_5m"] = f"falhou: {ex}"[:200]
            linha["segundos"] = round(time.time() - t0, 1)
            rel["casos"].append(linha)
            print(("OK  " if linha.get("ok") else "FALHA ") + nome, flush=True)

    with open(os.path.join(pasta, "relatorio.json"), "w", encoding="utf-8") as f:
        json.dump(rel, f, indent=2, ensure_ascii=False, default=str)

    md = [f"# Recortes de teste Espanha · {rel['quando']}", "", "## Diagnóstico", ""]
    for url, d in rel["diagnostico"].items():
        md.append(f"- {url}: {json.dumps(d, ensure_ascii=False)}")
    md += ["", "## Recortes de 5 ha", "",
           "| Caso | Base | Fonte | CRS | Res. | Sem dado | Cotas | Envolvente 5 m | s |",
           "|---|---|---|---|---|---|---|---|---|"]
    for c in rel["casos"]:
        env = c.get("envolvente_5m", "")
        if c.get("ok"):
            md.append(f"| {c['caso']} | ok | {c['fonte']} | {c['crs']} | {c['res']} m | "
                      f"{c['nodata']:.1%} | {c['zmin']:.0f}–{c['zmax']:.0f} m | {env} | {c['segundos']} |")
        else:
            md.append(f"| {c['caso']} | **{c.get('motivo')}** | | | | | | {env} | {c['segundos']} |")
    with open(os.path.join(pasta, "relatorio.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print("\n".join(md))
    print(f"\nPasta: {pasta}")


if __name__ == "__main__":
    main()
