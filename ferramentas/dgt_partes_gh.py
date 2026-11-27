#!/usr/bin/env python3
"""IPR Atlas · cópia rápida das colecções grandes da OGC API da DGT, em paralelo no GitHub Actions (Terracrua Design).
Nuno, 25/11/2026 13h06: «isto está a demorar muito tempo, não consegues acelerar isto? [...] não pares».
O Worker ipr-copia-dgt faz no máximo ~20 pedidos por minuto (limites da conta gratuita) e a DGT responde 429 a quem pede
muito do mesmo IP. Aqui cada fatia corre numa máquina do GitHub, com IP próprio, e escreve GeoJSON por linhas (um elemento
por linha, sem repetidos pelo id). A DGT dá no máximo 100 por pedido e recusa offset >= 10000: por isso reparte-se por
freguesia (administrativeunit = DICOFRE) ou por quadrícula de 0,1°.
27/11/2026: regras da DGT (Eng.º Danilo Furtado, Chefe da Divisão de Informação Geográfica, 27/11 16h59) depois do bloqueio
de 26/11: a OGC API serve para consulta, não para descarga integral; limitar os pedidos concorrentes, usar a paginação, evitar
pedidos repetidos, reutilizar resultados, preferir os ZIP de descarga directa e nunca copiar tudo todos os dias. Por isso: um só
fio (DGT_FIOS=1), uma pausa entre pedidos (DGT_PAUSA, 1,5 s), uma só máquina de cada vez no fluxo, e um 403 pára logo a cópia
(não se insiste). Só se copia o que falta.
Uso: dgt_partes_gh.py <colecção> <freguesias|grelha> <fatia> <n_fatias> <saida.geojsons>"""
import json, os, sys, time, urllib.request, urllib.error, concurrent.futures as cf, threading
OGC = "https://ogcapi.dgterritorio.gov.pt/collections/"
col, modo, fatia, nf, saida = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
FIOS = int(os.environ.get("DGT_FIOS", "1"))
PAUSA = float(os.environ.get("DGT_PAUSA", "1.5"))
# 26/11/2026: o GitHub mata a fatia aos 350 min e perde-se tudo o que copiou. A fatia pára sozinha antes (DGT_TEMPO, segundos),
# grava o que tem e lista as partes por fazer, para a próxima volta.
T0, LIMITE = time.time(), float(os.environ.get("DGT_TEMPO", "18900"))
por_fazer = []
def parar(msg):
    """Pára a cópia sem insistir, mas guarda o que já se copiou (o fluxo junta-o ao que já havia)."""
    print("PAROU:", msg, flush=True)
    try: out.flush(); out.close()
    except Exception: pass
    os._exit(0)
def pedir(u, tent=0):
    time.sleep(PAUSA)
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "IPR-Atlas/1.0 (terracruadesign.pt)"}), timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 403:  # a DGT bloqueou: parar tudo, sem insistir
            parar("a DGT respondeu 403")
        if e.code == 429:
            if tent >= 3: parar("a DGT respondeu 429 três vezes")
            try: w = int(e.headers.get("Retry-After") or 0)
            except Exception: w = 0
            time.sleep(max(w, 120 * (tent + 1))); return pedir(u, tent + 1)
        if tent < 4 and e.code >= 500: time.sleep(30 * (tent + 1)); return pedir(u, tent + 1)
        raise
    except Exception:
        if tent < 4: time.sleep(30 * (tent + 1)); return pedir(u, tent + 1)
        raise
TODAS = []
def caixa(fr):
    """Rectângulo envolvente de uma freguesia (colecção freguesias da DGT)."""
    j = pedir(OGC + "freguesias/items?f=json&limit=5&dtmnfr=" + fr)
    fs = [f for f in j.get("features", []) if str(f.get("properties", {}).get("dtmnfr")) == fr]
    if not fs:  # o filtro por propriedade não é aceite: percorre a colecção toda uma vez
        if not TODAS:
            for o in range(0, 9000, 100):
                k = pedir(OGC + "freguesias/items?f=json&limit=100&offset=%d" % o).get("features", [])
                TODAS.extend(k)
                if len(k) < 100: break
        fs = [f for f in TODAS if str(f.get("properties", {}).get("dtmnfr")) == fr]
    xs, ys = [], []
    def anda(c):
        if c and isinstance(c[0], (int, float)): xs.append(c[0]); ys.append(c[1])
        else:
            for k in c: anda(k)
    for f in fs: anda(f["geometry"]["coordinates"])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None
def partes():
    if modo == "fregbbox":
        # 26/11/2026: freguesias com mais de 9900 parcelas (a DGT recusa offset >= 10000). Cada uma parte-se em quadrículas
        # de 0,02° dentro da freguesia (administrativeunit + bbox); a parte() volta a partir em 4 se ainda passar de 9900.
        l = []
        for fr in sorted(set(x.strip() for x in os.environ.get("DGT_FREG", "").split(",") if x.strip())):
            b = caixa(fr)
            if not b: print("freguesia sem geometria:", fr, flush=True); continue
            x = b[0]
            while x < b[2]:
                y = b[1]
                while y < b[3]: l.append("%s|%.4f,%.4f,%.4f,%.4f" % (fr, x, y, x + 0.02, y + 0.02)); y += 0.02
                x += 0.02
        return l
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
falhadas = []
def parte(p):
    """26/11/2026: nas curvas de nível a DGT respondia sempre 503 a algumas quadrículas de 0,1° (muitos elementos) e a fatia
    inteira morria, deitando fora tudo o que já tinha copiado. Agora uma quadrícula que falha parte-se em 4 (até 0,0125°);
    se mesmo assim falhar, fica registada e a fatia continua."""
    if time.time() - T0 > LIMITE:
        with trinco: por_fazer.append(p)
        return p, False
    try:
        return parte1(p)
    except Exception as e:  # noqa: BLE001
        if modo in ("grelha", "fregbbox"):
            pre, _, bb = p.rpartition("|"); pre = pre + "|" if pre else ""
            x0, y0, x1, y1 = [float(v) for v in bb.split(",")]
            if x1 - x0 > (0.0024 if modo == "fregbbox" else 0.013):
                h, g = (x1 - x0) / 2, False
                for a in (x0, x0 + h):
                    for b in (y0, y0 + h):
                        g = parte(pre + ",".join("%.4f" % v for v in (a, b, a + h, b + h)))[1] or g
                return p, g
        with trinco: falhadas.append(p)
        print("parte falhada:", p, str(e)[:80], flush=True)
        return p, False
def parte1(p):
    if modo == "fregbbox": fr, bb = p.split("|"); q = "administrativeunit=%s&bbox=%s" % (fr, bb)
    else: q = ("administrativeunit=" if modo == "freguesias" else "bbox=") + p
    off, grandes = 0, False
    while True:
        if off >= 9900:
            if modo == "fregbbox": raise RuntimeError("mais de 9900")  # parte() parte em 4
            grandes = True; break
        if time.time() - T0 > LIMITE:
            with trinco: por_fazer.append(p)
            break
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
print("partes que a DGT não deu (ficam para a próxima volta):", len(falhadas), falhadas[:50], flush=True)
print("partes por fazer (tempo esgotado):", len(por_fazer), por_fazer[:50], flush=True)
if n_el[0] == 0 and falhadas: sys.exit(1)
