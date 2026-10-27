"""Adaptador França da Base Cartográfica (Terracrua Design / IPR).

Obtém o MNT LiDAR HD do IGN (0,5 m) para o polígono de uma encomenda e devolve
um GeoTIFF recortado ao buffer, em Lambert-93 (EPSG:2154; Reunião em
EPSG:2975), com os metadados do relatório.

Regras do produto (iguais às de Portugal e Espanha):
- Fonte única de relevo: LiDAR oficial. Sem LiDAR adequado, não há Base.
- Nunca Copernicus/SRTM/EU-DEM; o RGE ALTI de 1 m (parcialmente
  fotogramétrico) também não é Base.
- As ZICAD (zonas interditas à captação aérea) e as zonas ainda sem LiDAR HD
  chegam como nodata (-9999): acima do limite, recusa explícita.
- O relatório cita a fonte e a data de actualização (Licence Ouverte 2.0).

Acesso: Géoplateforme WMS-R (verificado a 21/10/2026), GetMap em GeoTIFF float
a 0,5 m alinhado à grelha, em blocos de até 4000 px (o serviço aceita 5010).
Não é preciso conta, chave nem formulário.

Uso pelo worker:
    from fonte_fr import obter_mdt_fr, SemLidar
    res = obter_mdt_fr(geojson_poligono, pasta_trabalho)

Linha de comandos:
    python3 fonte_fr.py diagnostico
    python3 fonte_fr.py recorte LON LAT HA
"""

from __future__ import annotations

import json
import math
import os
import sys
import time
from dataclasses import dataclass, field

import numpy as np
import rasterio
import requests
from pyproj import Transformer
from rasterio.crs import CRS
from rasterio.io import MemoryFile
from rasterio.merge import merge
from shapely.geometry import box, mapping, shape
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union

AQUI = os.path.dirname(os.path.abspath(__file__))
CONFIG_PADRAO = os.path.join(AQUI, "fonte_fr.json")
UA = "TerracruaDesign-IPR-worker/1.0 (+https://terracruadesign.pt; info@terracruadesign.pt)"
NODATA = -9999.0


class SemLidar(Exception):
    """Não há LiDAR HD adequado para a parcela: a encomenda não é confirmada."""


@dataclass
class Fonte:
    id: str
    tipo: str                         # "wmsr"
    rotulo: str
    resolucao_m: float
    url: str = ""
    camadas: dict = field(default_factory=dict)   # EPSG -> nome da camada
    formato: str = "image/geotiff"
    nodata: float = NODATA
    max_px: int = 4000
    base_permitida: bool = True
    cobertura: str = ""
    densidade: str = ""
    atribuicao: str = ""
    data_actualizacao: str = ""
    nota: str = ""


@dataclass
class Config:
    fontes: list
    buffer_frac: float = 0.20
    buffer_min_m: float = 100.0
    buffer_max_m: float = 2000.0
    nodata_max_frac: float = 0.01
    nodata_buffer_max_frac: float = 0.02
    timeout_s: int = 90
    tentativas: int = 3
    pausa_s: float = 2.0
    licenca: str = ""


def ler_config(caminho: str = CONFIG_PADRAO) -> Config:
    with open(caminho, encoding="utf-8") as f:
        d = json.load(f)
    d = {k: v for k, v in d.items() if not k.startswith("_")}
    fontes = [Fonte(**{k: v for k, v in x.items() if not k.startswith("_")}) for x in d.pop("fontes")]
    return Config(fontes=fontes, **d)


# --- CRS e geometria ---------------------------------------------------------

# Caixas largas (graus) dos territórios servidos. A Córsega está em Lambert-93.
METROPOLE = box(-5.6, 41.2, 10.0, 51.3)
REUNIAO = box(55.1, -21.5, 56.0, -20.8)


def crs_destino(lon: float, lat: float) -> str | None:
    if REUNIAO.contains(shape({"type": "Point", "coordinates": [lon, lat]})):
        return "2975"
    if METROPOLE.contains(shape({"type": "Point", "coordinates": [lon, lat]})):
        return "2154"
    return None


def _tf(a: str, b: str):
    return Transformer.from_crs(a, b, always_xy=True).transform


def para_crs(geom, epsg: str):
    return shp_transform(_tf("EPSG:4326", f"EPSG:{epsg}"), geom)


def area_com_buffer(geom_m, cfg: Config):
    minx, miny, maxx, maxy = geom_m.bounds
    maior = max(maxx - minx, maxy - miny)
    b = min(max(maior * cfg.buffer_frac, cfg.buffer_min_m), cfg.buffer_max_m)
    return geom_m.buffer(b), b


def resolucao_trabalho(area_buffer_ha: float, res_fonte: float) -> float:
    """Como em Portugal: 0,5 m até 400 ha de buffer, 1 m até 2500 ha, 2 m acima."""
    alvo = 0.5 if area_buffer_ha <= 400 else (1.0 if area_buffer_ha <= 2500 else 2.0)
    return max(alvo, res_fonte)


def alinhar(bounds, res: float):
    x0, y0, x1, y1 = bounds
    return (math.floor(x0 / res) * res, math.floor(y0 / res) * res,
            math.ceil(x1 / res) * res, math.ceil(y1 / res) * res)


def blocos(bounds, res: float, max_px: int):
    minx, miny, maxx, maxy = bounds
    passo = res * max_px
    for i in range(max(1, math.ceil(round((maxx - minx) / passo, 9)))):
        for j in range(max(1, math.ceil(round((maxy - miny) / passo, 9)))):
            x0, y0 = minx + i * passo, miny + j * passo
            yield (x0, y0, min(x0 + passo, maxx), min(y0 + passo, maxy))


# --- WMS-R da Géoplateforme --------------------------------------------------

def params_getmap(fonte: Fonte, epsg: str, b, res: float) -> list:
    camada = fonte.camadas.get(epsg)
    if not camada:
        raise KeyError(f"{fonte.id}: sem camada para EPSG:{epsg}")
    x0, y0, x1, y1 = b
    w = max(1, round((x1 - x0) / res))
    h = max(1, round((y1 - y0) / res))
    # WMS 1.3.0 com EPSG projectado: BBOX em x,y (Lambert-93 e UTM têm eixos este, norte).
    return [("SERVICE", "WMS"), ("VERSION", "1.3.0"), ("REQUEST", "GetMap"),
            ("LAYERS", camada), ("STYLES", ""), ("CRS", f"EPSG:{epsg}"),
            ("BBOX", f"{x0:.2f},{y0:.2f},{x1:.2f},{y1:.2f}"),
            ("WIDTH", str(w)), ("HEIGHT", str(h)), ("FORMAT", fonte.formato)]


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def pedir_bloco(sess, fonte: Fonte, epsg: str, b, res: float, cfg: Config) -> bytes:
    params = params_getmap(fonte, epsg, b, res)
    ultimo = None
    for t in range(cfg.tentativas):
        try:
            r = sess.get(fonte.url, params=params, timeout=cfg.timeout_s)
            if r.status_code == 200 and r.content[:4] in (b"II*\x00", b"MM\x00*"):
                return r.content
            ultimo = f"HTTP {r.status_code} {r.headers.get('Content-Type', '')} {r.content[:300]!r}"
        except requests.RequestException as e:
            ultimo = repr(e)
        if cfg.pausa_s:
            time.sleep(cfg.pausa_s * (t + 1))
    raise RuntimeError(f"{fonte.id}: GetMap falhou: {ultimo}")


def montar(fonte: Fonte, epsg: str, bnds, res: float, cfg: Config, destino: str, sess=None):
    sess = sess or _sessao()
    partes = [pedir_bloco(sess, fonte, epsg, b, res, cfg) for b in blocos(bnds, res, fonte.max_px)]
    abertos = []
    try:
        for p in partes:
            src = MemoryFile(p).open()
            abertos.append(src)
        # O GeoTIFF do WMS traz a georreferência; se faltar o nodata, usa-se o da fonte.
        arr, tr = merge(abertos, bounds=bnds, res=res, nodata=fonte.nodata)
    finally:
        for a in abertos:
            a.close()
    a = arr[0].astype("float32")
    a[~np.isfinite(a)] = NODATA
    a[a <= fonte.nodata + 0.5] = NODATA
    perfil = dict(driver="GTiff", height=a.shape[0], width=a.shape[1], count=1, dtype="float32",
                  transform=tr, crs=CRS.from_epsg(int(epsg)), nodata=NODATA, compress="deflate",
                  tiled=True, blockxsize=512, blockysize=512, BIGTIFF="IF_SAFER")
    with rasterio.open(destino, "w", **perfil) as dst:
        dst.write(a, 1)


# --- Qualidade ---------------------------------------------------------------

def fraccao_nodata(tif: str, geom_m) -> tuple[float, float, float]:
    from rasterio.features import geometry_mask
    with rasterio.open(tif) as src:
        a = src.read(1)
        fora = geometry_mask([mapping(geom_m)], out_shape=a.shape, transform=src.transform)
    v = a[~fora]
    if v.size == 0:
        return 1.0, float("nan"), float("nan")
    inval = ~np.isfinite(v) | (v <= NODATA + 0.5)
    ok = v[~inval]
    frac = float(inval.sum()) / float(v.size)
    return (frac, float(ok.min()), float(ok.max())) if ok.size else (frac, float("nan"), float("nan"))


def ler_geometria(geojson: dict):
    if geojson.get("type") == "FeatureCollection":
        return unary_union([shape(f["geometry"]) for f in geojson.get("features", []) if f.get("geometry")])
    return shape(geojson["geometry"] if "geometry" in geojson else geojson)


def atribuicao(fonte: Fonte) -> str:
    a = fonte.atribuicao
    if fonte.data_actualizacao:
        a = a.replace("{data}", fonte.data_actualizacao)
    return a


# --- Entrada principal -------------------------------------------------------

def obter_mdt_fr(geojson: dict, pasta: str, cfg: Config | None = None, log=print, sess=None) -> dict:
    cfg = cfg or ler_config()
    os.makedirs(pasta, exist_ok=True)
    g = ler_geometria(geojson)
    if g.is_empty:
        raise ValueError("geometria vazia")
    c = g.centroid
    epsg = crs_destino(c.x, c.y)
    if not epsg:
        raise SemLidar(json.dumps({"motivo": "fora_de_franca", "lon": c.x, "lat": c.y}))
    g_m = para_crs(g, epsg)
    g_buf, b_m = area_com_buffer(g_m, cfg)
    area_buf_ha = g_buf.area / 10_000
    tentativas = []
    for fonte in cfg.fontes:
        if not fonte.base_permitida:
            tentativas.append({"fonte": fonte.id, "resultado": "não serve para a Base"})
            continue
        if epsg not in fonte.camadas:
            tentativas.append({"fonte": fonte.id, "resultado": f"sem camada para EPSG:{epsg}"})
            continue
        res = resolucao_trabalho(area_buf_ha, fonte.resolucao_m)
        bnds = alinhar(g_buf.bounds, res)
        destino = os.path.join(pasta, f"mdt_fr_{fonte.id}.tif")
        t0 = time.time()
        try:
            montar(fonte, epsg, bnds, res, cfg, destino, sess=sess)
            frac, zmin, zmax = fraccao_nodata(destino, g_m)
            frac_buf = fraccao_nodata(destino, g_buf)[0]
        except Exception as e:  # noqa: BLE001
            tentativas.append({"fonte": fonte.id, "resultado": f"erro: {e}"})
            log(f"[fonte_fr] {fonte.id}: {e}")
            continue
        info = {"fonte": fonte.id, "nodata_frac": round(frac, 4), "nodata_buffer_frac": round(frac_buf, 4),
                "zmin": zmin, "zmax": zmax, "segundos": round(time.time() - t0, 1)}
        tentativas.append(info)
        if frac <= cfg.nodata_max_frac and frac_buf <= cfg.nodata_buffer_max_frac:
            return {"tif": destino, "crs": f"EPSG:{epsg}", "fonte": fonte.id, "fonte_rotulo": fonte.rotulo,
                    "cobertura": fonte.cobertura, "densidade": fonte.densidade, "resolucao_m": res,
                    "resolucao_fonte_m": fonte.resolucao_m, "buffer_m": round(b_m, 1),
                    "area_buffer_ha": round(area_buf_ha, 2), "nodata_frac": frac,
                    "nodata_buffer_frac": frac_buf, "zmin": zmin, "zmax": zmax,
                    "atribuicao": atribuicao(fonte), "licenca": cfg.licenca, "nota": fonte.nota,
                    "tentativas": tentativas}
        log(f"[fonte_fr] {fonte.id}: {frac:.1%} sem dado no polígono, {frac_buf:.1%} no buffer")
    motivo = "zicad_ou_sem_cobertura" if any("nodata_frac" in t for t in tentativas) else "sem_fonte"
    raise SemLidar(json.dumps({"motivo": motivo, "epsg": epsg, "tentativas": tentativas}, ensure_ascii=False))


def diagnostico(cfg: Config | None = None, sess=None) -> dict:
    """GetCapabilities de cada fonte: confirma que as camadas configuradas existem."""
    cfg = cfg or ler_config()
    sess = sess or _sessao()
    saida = {}
    for f in cfg.fontes:
        try:
            r = sess.get(f.url, params={"SERVICE": "WMS", "REQUEST": "GetCapabilities", "VERSION": "1.3.0"},
                         timeout=cfg.timeout_s)
            saida[f.id] = {"http": r.status_code,
                           "camadas": {c: (f"<Name>{c}</Name>" in r.text) for c in f.camadas.values()}}
        except requests.RequestException as e:
            saida[f.id] = {"erro": repr(e)}
    return saida


def quadrado_ha(lon: float, lat: float, ha: float) -> dict:
    epsg = crs_destino(lon, lat) or "2154"
    x, y = _tf("EPSG:4326", f"EPSG:{epsg}")(lon, lat)
    l = math.sqrt(ha * 10_000) / 2
    q = box(x - l, y - l, x + l, y + l)
    return {"type": "Feature", "properties": {},
            "geometry": mapping(shp_transform(_tf(f"EPSG:{epsg}", "EPSG:4326"), q))}


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["diagnostico"]:
        print(json.dumps(diagnostico(), indent=2, ensure_ascii=False))
    elif a[:1] == ["recorte"] and len(a) == 4:
        lon, lat, ha = map(float, a[1:4])
        try:
            print(json.dumps(obter_mdt_fr(quadrado_ha(lon, lat, ha), os.path.join(os.getcwd(), "recorte_fr")),
                             indent=2, ensure_ascii=False, default=str))
        except SemLidar as e:
            print("SEM LIDAR:", e)
            sys.exit(2)
    else:
        print(__doc__)
