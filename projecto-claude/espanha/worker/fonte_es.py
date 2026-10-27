"""Adaptador Espanha da Base Cartográfica (Terracrua Design / IPR).

Obtém o MDT oficial espanhol para o polígono de uma encomenda e devolve um
GeoTIFF recortado ao buffer, no CRS métrico da parcela (ETRS89 UTM 29/30/31;
REGCAN95 UTM 28 nas Canárias), com os metadados do relatório.

Regras do produto (iguais às de Portugal):
- Fonte única de relevo: LiDAR oficial. Sem LiDAR adequado, não há Base.
- A Base exige MDT de 2 m ou melhor. O MDT05 (5 m) do serviço WCS/OGC API do
  IGN serve só para envolventes grandes (bacias) e para a ficha do terreno;
  nunca é Base (`base_permitida: false`).
- Nunca Copernicus/SRTM/EU-DEM.
- O relatório diz que cobertura serviu de base, com o ano e a densidade.

Tipos de fonte (fonte_es.json, por ordem de preferência):
- "pasta": folhas MDT descarregadas (GeoTIFF ou ASC do CNIG, ou de uma fonte
  regional) numa pasta do servidor. O adaptador indexa a pasta, escolhe as
  folhas que tocam o buffer, reprojecta e junta. As folhas chegam por um
  descarregador próprio (a construir depois do diagnóstico do Centro de
  Descargas) ou, na fase «a pedido», colocadas pela equipa.
- "wcs": WCS 2.0.1 do IDEE (5 m). Só envolvente.

Uso pelo worker:
    from fonte_es import obter_mdt_es, SemLidar
    res = obter_mdt_es(geojson_poligono, pasta_trabalho)

Linha de comandos:
    python3 fonte_es.py diagnostico          # serviços e pastas configurados
    python3 fonte_es.py cobertura LON LAT HA # que folhas/fonte servem
    python3 fonte_es.py recorte LON LAT HA   # recorte de teste
"""

from __future__ import annotations

import glob
import hashlib
import json
import math
import os
import re
import sys
import tempfile
import time
from dataclasses import dataclass, field

import numpy as np
import requests
import rasterio
from rasterio.crs import CRS
from rasterio.errors import CRSError
from rasterio.io import MemoryFile
from rasterio.merge import merge
from rasterio.vrt import WarpedVRT
from rasterio.warp import Resampling, transform_bounds
from pyproj import Transformer
from shapely import STRtree
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union
from shapely.ops import transform as shp_transform

AQUI = os.path.dirname(os.path.abspath(__file__))
CONFIG_PADRAO = os.path.join(AQUI, "fonte_es.json")
UA = "TerracruaDesign-IPR-worker/1.0 (+https://terracruadesign.pt; info@terracruadesign.pt)"
EXT_RASTER = (".tif", ".tiff", ".asc")


class SemLidar(Exception):
    """Não há LiDAR oficial adequado para a parcela: a encomenda não é confirmada."""


@dataclass
class Fonte:
    id: str
    tipo: str                      # "pasta" | "wcs"
    rotulo: str
    resolucao_m: float
    base_permitida: bool = True
    pasta: str = ""                # tipo pasta
    crs_omissao: str = ""          # EPSG quando o ficheiro não traz CRS
    regex_fuso: str = r"HU(\d{2})" # fuso no nome do ficheiro (CNIG)
    url: str = ""                  # tipo wcs
    coverage: dict = field(default_factory=dict)
    coverage_omissao: str = ""     # EPSG do serviço quando o fuso da parcela não tem coverage (o IGN só serve 25830 na Península)
    formato: str = "image/tiff"
    max_px: int = 4000
    cobertura: str = ""            # ex.: "PNOA-LiDAR 2.ª cobertura (2015–2021)"
    densidade: str = ""
    atribuicao: str = ""
    nota: str = ""


@dataclass
class Config:
    fontes: list
    buffer_frac: float = 0.20
    buffer_min_m: float = 100.0
    buffer_max_m: float = 2000.0
    nodata_max_frac: float = 0.01          # dentro do polígono
    nodata_buffer_max_frac: float = 0.02   # no buffer (hidrologia da orla)
    pasta_indice: str = "/var/lib/tcd/es"  # índices das pastas, fora das pastas de dados
    indice_ttl_s: int = 3600               # reler a pasta no máximo de hora a hora
    timeout_s: int = 90
    tentativas: int = 3
    licenca: str = ""


def ler_config(caminho: str = CONFIG_PADRAO) -> Config:
    with open(caminho, encoding="utf-8") as f:
        d = json.load(f)
    d = {k: v for k, v in d.items() if not k.startswith("_")}
    fontes = [Fonte(**{k: v for k, v in x.items() if not k.startswith("_")})
              for x in d.pop("fontes")]
    return Config(fontes=fontes, **d)


# --- CRS e geometria ---------------------------------------------------------

def crs_destino(lon: float, lat: float) -> str:
    if lat < 30.5 and lon < -12.0:
        return "4083"
    if lon < -6.0:
        return "25829"
    if lon < 0.0:
        return "25830"
    return "25831"


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
    """Como em Portugal: 0,5 m até 400 ha de buffer, 1 m até 2500 ha, 2 m acima;
    nunca mais fino do que a fonte."""
    alvo = 0.5 if area_buffer_ha <= 400 else (1.0 if area_buffer_ha <= 2500 else 2.0)
    return max(alvo, res_fonte)


# --- Fonte "pasta": índice de folhas -----------------------------------------

def _crs_ficheiro(src, caminho: str, fonte: Fonte) -> CRS | None:
    if src.crs:
        return src.crs
    m = re.search(fonte.regex_fuso, os.path.basename(caminho), re.I) if fonte.regex_fuso else None
    if m:
        fuso = int(m.group(1))
        if fuso == 28:
            return CRS.from_epsg(4083)
        if 28 < fuso <= 31:
            return CRS.from_epsg(25800 + fuso)
        return None
    return CRS.from_epsg(int(fonte.crs_omissao)) if fonte.crs_omissao else None


VERSAO_INDICE = 2
_MEM: dict = {}   # assinatura -> (instante, linhas, árvore espacial)


def _assinatura(fonte: Fonte) -> str:
    base = json.dumps([VERSAO_INDICE, os.path.abspath(fonte.pasta), fonte.regex_fuso,
                       fonte.crs_omissao], ensure_ascii=False)
    return hashlib.sha1(base.encode()).hexdigest()[:16]


def _ficheiro_indice(fonte: Fonte, cfg: Config | None) -> str:
    pasta = (cfg.pasta_indice if cfg else "/var/lib/tcd/es")
    try:
        os.makedirs(pasta, exist_ok=True)
        if not os.access(pasta, os.W_OK):
            raise PermissionError(pasta)
    except OSError:
        pasta = os.path.join(tempfile.gettempdir(), "tcd_es_indice")
        os.makedirs(pasta, exist_ok=True)
    return os.path.join(pasta, f"{fonte.id}-{_assinatura(fonte)}.json")


def indice_pasta(fonte: Fonte, cfg: Config | None = None, forcar: bool = False) -> list[dict]:
    """Limites (em graus) e resolução de cada folha da pasta.

    O índice guarda-se fora da pasta de dados, com assinatura da configuração
    (mudar regex_fuso ou crs_omissao obriga a reindexar) e escrita atómica.
    Em memória fica válido durante indice_ttl_s; folhas novas entram na
    releitura seguinte, ou já com forcar=True (o descarregador chama-o)."""
    ttl = cfg.indice_ttl_s if cfg else 3600
    ass = _assinatura(fonte)
    agora = time.time()
    m = _MEM.get(ass)
    if m and not forcar and agora - m[0] < ttl:
        return m[1]
    cache = _ficheiro_indice(fonte, cfg)
    antigo = {}
    try:
        with open(cache, encoding="utf-8") as f:
            antigo = {r["caminho"]: r for r in json.load(f)}
    except (OSError, ValueError, KeyError, TypeError):
        antigo = {}
    linhas = []
    for c in sorted(glob.glob(os.path.join(fonte.pasta, "**", "*"), recursive=True)):
        if not c.lower().endswith(EXT_RASTER):
            continue
        try:
            mt = os.path.getmtime(c)
        except OSError:
            continue
        r = antigo.get(c)
        if r and r.get("mtime") == mt:
            linhas.append(r)
            continue
        try:
            with rasterio.open(c) as src:
                crs = _crs_ficheiro(src, c, fonte)
                if crs is None:
                    continue
                w, s, e, n = transform_bounds(crs, "EPSG:4326", *src.bounds)
                linhas.append({"caminho": c, "mtime": mt, "epsg": crs.to_epsg(),
                               "res": abs(src.res[0]), "bbox": [w, s, e, n]})
        except (rasterio.errors.RasterioError, CRSError, ValueError):
            continue   # uma folha má não derruba o índice
    try:
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(cache), suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(linhas, f)
        os.replace(tmp, cache)
    except OSError:
        pass
    arvore = STRtree([box(*r["bbox"]) for r in linhas]) if linhas else None
    _MEM[ass] = (agora, linhas, arvore)
    return linhas


def folhas_para(fonte: Fonte, geom_ll, cfg: Config | None = None, forcar: bool = False) -> list[dict]:
    linhas = indice_pasta(fonte, cfg, forcar)
    arvore = _MEM[_assinatura(fonte)][2]
    if arvore is None:
        return []
    idx = arvore.query(geom_ll, predicate="intersects")
    return [linhas[int(i)] for i in sorted(idx)]


def montar_de_pasta(fonte: Fonte, folhas: list[dict], epsg: str, bnds, res: float, destino: str):
    """Junta as folhas no CRS da parcela e escreve directamente em disco (sem
    guardar o mosaico inteiro em memória duas vezes)."""
    crs_alvo = CRS.from_epsg(int(epsg))
    vrts, srcs = [], []
    try:
        for r in folhas:
            src = rasterio.open(r["caminho"])
            srcs.append(src)
            crs = _crs_ficheiro(src, r["caminho"], fonte)
            nd = src.nodata if src.nodata is not None else -9999.0
            vrts.append(WarpedVRT(src, src_crs=crs, crs=crs_alvo, src_nodata=nd, nodata=-9999.0,
                                  resampling=Resampling.bilinear))
        merge(vrts, bounds=bnds, res=res, nodata=-9999.0, dtype="float32", dst_path=destino,
              dst_kwds=dict(driver="GTiff", compress="deflate", tiled=True, blockxsize=512,
                            blockysize=512, BIGTIFF="IF_SAFER"))
    finally:
        for v in vrts:
            v.close()
        for s in srcs:
            s.close()


def separar_por_resolucao(fonte: Fonte, folhas: list[dict]):
    """A regra «Base com MDT de 2 m ou melhor» verifica-se folha a folha: uma
    folha mais grosseira do que a fonte declara (ex.: MDT05 posto na pasta do
    MDT02) é posta de parte, nunca reamostrada para parecer melhor."""
    boas = [r for r in folhas if r["res"] <= fonte.resolucao_m * 1.05]
    mas = [os.path.basename(r["caminho"]) + f" ({r['res']:g} m)" for r in folhas if r not in boas]
    return boas, mas


def _gravar(a, tr, crs, destino):
    perfil = dict(driver="GTiff", height=a.shape[0], width=a.shape[1], count=1, dtype="float32",
                  transform=tr, crs=crs, nodata=-9999.0, compress="deflate", tiled=True,
                  blockxsize=512, blockysize=512, BIGTIFF="IF_SAFER")
    with rasterio.open(destino, "w", **perfil) as dst:
        dst.write(a, 1)


# --- Fonte "wcs" (envolvente a 5 m) ------------------------------------------

def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def blocos(bounds, res: float, max_px: int):
    minx, miny, maxx, maxy = bounds
    passo = res * max_px
    for i in range(max(1, math.ceil((maxx - minx) / passo))):
        for j in range(max(1, math.ceil((maxy - miny) / passo))):
            x0, y0 = minx + i * passo, miny + j * passo
            yield (x0, y0, min(x0 + passo, maxx), min(y0 + passo, maxy))


def url_getcoverage(fonte: Fonte, epsg: str, b, res: float):
    cov = fonte.coverage.get(epsg)
    if not cov:
        raise KeyError(f"cobertura não definida para EPSG:{epsg} em {fonte.id}")
    uri = f"http://www.opengis.net/def/crs/EPSG/0/{epsg}"
    x0, y0, x1, y1 = b
    params = [("service", "WCS"), ("version", "2.0.1"), ("request", "GetCoverage"),
              ("coverageId", cov), ("format", fonte.formato),
              ("subset", f"x({x0:.2f},{x1:.2f})"), ("subset", f"y({y0:.2f},{y1:.2f})"),
              ("subsettingCrs", uri), ("outputCrs", uri),
              ("scaleSize", f"x({max(1, round((x1 - x0) / res))}),y({max(1, round((y1 - y0) / res))})")]
    return fonte.url, params


def pedir_bloco(sess, fonte, epsg, b, res, cfg: Config) -> bytes:
    url, params = url_getcoverage(fonte, epsg, b, res)
    ultimo = None
    for t in range(cfg.tentativas):
        try:
            r = sess.get(url, params=params, timeout=cfg.timeout_s)
            if r.status_code == 200 and r.content[:4] in (b"II*\x00", b"MM\x00*"):
                return r.content
            ultimo = f"HTTP {r.status_code} {r.headers.get('Content-Type', '')} {r.text[:300]!r}"
        except requests.RequestException as e:
            ultimo = repr(e)
        time.sleep(2 * (t + 1))
    raise RuntimeError(f"{fonte.id}: GetCoverage falhou: {ultimo}")


def epsg_servico(fonte: Fonte, epsg: str) -> str | None:
    """EPSG em que se pede ao serviço: o da parcela, se houver coverage, senão o de omissão."""
    if epsg in fonte.coverage:
        return epsg
    if fonte.coverage_omissao and fonte.coverage_omissao in fonte.coverage:
        return fonte.coverage_omissao
    return None


def montar_de_wcs(fonte, epsg, bnds, res, cfg, destino):
    sess = _sessao()
    ep_srv = epsg_servico(fonte, epsg) or epsg
    if ep_srv == epsg:
        b_srv = bnds
    else:  # pedir no CRS do serviço, com margem, e reprojectar para a grelha da parcela
        x0, y0, x1, y1 = transform_bounds(f"EPSG:{epsg}", f"EPSG:{ep_srv}", *bnds, densify_pts=21)
        m = 4 * res
        b_srv = (math.floor((x0 - m) / res) * res, math.floor((y0 - m) / res) * res,
                 math.ceil((x1 + m) / res) * res, math.ceil((y1 + m) / res) * res)
    partes = [pedir_bloco(sess, fonte, ep_srv, b, res, cfg) for b in blocos(b_srv, res, fonte.max_px)]
    abertos = [MemoryFile(p).open() for p in partes]
    try:
        arr, tr = merge(abertos, nodata=-9999.0)
    finally:
        for a in abertos:
            a.close()
    if ep_srv == epsg:
        _gravar(arr[0].astype("float32"), tr, CRS.from_epsg(int(epsg)), destino)
        return
    from rasterio.warp import reproject
    largura = max(1, round((bnds[2] - bnds[0]) / res)); altura = max(1, round((bnds[3] - bnds[1]) / res))
    tr_dst = rasterio.transform.from_origin(bnds[0], bnds[3], res, res)
    dst = np.full((altura, largura), -9999.0, dtype="float32")
    reproject(arr[0].astype("float32"), dst, src_transform=tr, src_crs=CRS.from_epsg(int(ep_srv)), src_nodata=-9999.0,
              dst_transform=tr_dst, dst_crs=CRS.from_epsg(int(epsg)), dst_nodata=-9999.0, resampling=Resampling.bilinear)
    _gravar(dst, tr_dst, CRS.from_epsg(int(epsg)), destino)


# --- Qualidade ---------------------------------------------------------------

def fraccao_nodata(tif: str, geom_m) -> tuple[float, float, float]:
    """Fracção de células sem dado dentro de geom_m, e cotas mínima e máxima.
    A máscara do polígono calcula-se à parte: as células sem dado são as que
    queremos contar, não as que queremos esconder."""
    from rasterio.features import geometry_mask
    with rasterio.open(tif) as src:
        a = src.read(1)
        nd = src.nodata
        fora = geometry_mask([mapping(geom_m)], out_shape=a.shape, transform=src.transform,
                             all_touched=False)
    v = a[~fora]
    if v.size == 0:
        return 1.0, float("nan"), float("nan")
    inval = ~np.isfinite(v) | (v < -500)
    if nd is not None:
        inval |= v == nd
    ok = v[~inval]
    frac = float(inval.sum()) / float(v.size)
    return (frac, float(ok.min()), float(ok.max())) if ok.size else (frac, float("nan"), float("nan"))


def ler_geometria(geojson: dict):
    """Aceita Geometry, Feature ou FeatureCollection (várias parcelas do Catastro)."""
    if geojson.get("type") == "FeatureCollection":
        return unary_union([shape(f["geometry"]) for f in geojson.get("features", []) if f.get("geometry")])
    return shape(geojson["geometry"] if "geometry" in geojson else geojson)


# --- Entrada principal -------------------------------------------------------

def obter_mdt_es(geojson: dict, pasta: str, cfg: Config | None = None, log=print,
                 so_base: bool = True) -> dict:
    """Devolve o MDT da parcela. Com so_base=True (encomenda da Base) só usa
    fontes com base_permitida; com False aceita também o MDT05 (envolventes)."""
    cfg = cfg or ler_config()
    os.makedirs(pasta, exist_ok=True)
    g = ler_geometria(geojson)
    if g.is_empty:
        raise ValueError("geometria vazia")
    c = g.centroid
    epsg = crs_destino(c.x, c.y)
    g_m = para_crs(g, epsg)
    g_buf, b_m = area_com_buffer(g_m, cfg)
    g_buf_ll = shp_transform(_tf(f"EPSG:{epsg}", "EPSG:4326"), g_buf)
    area_buf_ha = g_buf.area / 10_000
    tentativas = []

    for fonte in cfg.fontes:
        if so_base and not fonte.base_permitida:
            tentativas.append({"fonte": fonte.id, "resultado": "não serve para a Base"})
            continue
        res = resolucao_trabalho(area_buf_ha, fonte.resolucao_m)
        x0, y0, x1, y1 = g_buf.bounds
        bnds = (math.floor(x0 / res) * res, math.floor(y0 / res) * res,
                math.ceil(x1 / res) * res, math.ceil(y1 / res) * res)
        destino = os.path.join(pasta, f"mdt_es_{fonte.id}.tif")
        t0 = time.time()
        extra = {}
        try:
            if fonte.tipo == "pasta":
                folhas = folhas_para(fonte, g_buf_ll, cfg) or folhas_para(fonte, g_buf_ll, cfg, forcar=True)
                folhas, postas_de_parte = separar_por_resolucao(fonte, folhas)
                if postas_de_parte:
                    extra["folhas_postas_de_parte"] = postas_de_parte
                if not folhas:
                    tentativas.append({"fonte": fonte.id, "resultado": "sem folhas adequadas na pasta", **extra})
                    continue
                montar_de_pasta(fonte, folhas, epsg, bnds, res, destino)
                extra["folhas"] = [os.path.basename(r["caminho"]) for r in folhas]
            elif fonte.tipo == "wcs":
                if not epsg_servico(fonte, epsg):
                    tentativas.append({"fonte": fonte.id, "resultado": f"sem cobertura EPSG:{epsg}"})
                    continue
                montar_de_wcs(fonte, epsg, bnds, res, cfg, destino)
            else:
                raise ValueError(f"tipo de fonte desconhecido: {fonte.tipo}")
            frac, zmin, zmax = fraccao_nodata(destino, g_m)
            frac_buf = fraccao_nodata(destino, g_buf)[0]
        except Exception as e:  # noqa: BLE001 - registar e passar à seguinte
            tentativas.append({"fonte": fonte.id, "resultado": f"erro: {e}"})
            log(f"[fonte_es] {fonte.id}: {e}")
            continue
        tentativas.append({"fonte": fonte.id, "nodata_frac": round(frac, 4),
                           "nodata_buffer_frac": round(frac_buf, 4), "zmin": zmin,
                           "zmax": zmax, "segundos": round(time.time() - t0, 1), **extra})
        if frac <= cfg.nodata_max_frac and frac_buf <= cfg.nodata_buffer_max_frac:
            return {"tif": destino, "crs": f"EPSG:{epsg}", "fonte": fonte.id,
                    "fonte_rotulo": fonte.rotulo, "cobertura": fonte.cobertura,
                    "densidade": fonte.densidade, "resolucao_m": res,
                    "resolucao_fonte_m": fonte.resolucao_m, "buffer_m": round(b_m, 1),
                    "area_buffer_ha": round(area_buf_ha, 2), "nodata_frac": frac,
                    "nodata_buffer_frac": frac_buf,
                    "zmin": zmin, "zmax": zmax, "atribuicao": fonte.atribuicao,
                    "licenca": cfg.licenca, "nota": fonte.nota, "tentativas": tentativas, **extra}
        log(f"[fonte_es] {fonte.id}: {frac:.1%} sem dado no polígono e {frac_buf:.1%} no buffer; "
            "passa à seguinte")

    raise SemLidar(json.dumps({"epsg": epsg, "tentativas": tentativas}, ensure_ascii=False))


def cobertura(geojson: dict, cfg: Config | None = None) -> dict:
    """Resposta rápida para o mapa de encomenda, sem descarregar: a melhor fonte
    com cobertura total, senão a de maior percentagem. É uma estimativa pelos
    limites das folhas (folhas costeiras podem ter vazios); a verificação
    definitiva é a do obter_mdt_es, antes da entrega."""
    cfg = cfg or ler_config()
    g = ler_geometria(geojson)
    epsg = crs_destino(g.centroid.x, g.centroid.y)
    g_buf, _ = area_com_buffer(para_crs(g, epsg), cfg)
    g_buf_ll = shp_transform(_tf(f"EPSG:{epsg}", "EPSG:4326"), g_buf)
    melhor = None
    for fonte in cfg.fontes:
        if fonte.tipo != "pasta" or not fonte.base_permitida:
            continue
        folhas, _ = separar_por_resolucao(fonte, folhas_para(fonte, g_buf_ll, cfg))
        if not folhas:
            continue
        coberto = unary_union([box(*r["bbox"]) for r in folhas])
        frac = g_buf_ll.intersection(coberto).area / g_buf_ll.area
        cand = {"fonte": fonte.id, "rotulo": fonte.rotulo, "res": fonte.resolucao_m,
                "cobertura": "total" if frac > 0.999 else "parcial",
                "percentagem": round(100 * frac), "epsg": epsg}
        if cand["cobertura"] == "total":
            return cand
        if melhor is None or frac * 100 > melhor["percentagem"]:
            melhor = cand
    return melhor or {"fonte": None, "cobertura": "a_confirmar", "epsg": epsg}


def diagnostico(cfg: Config | None = None) -> dict:
    cfg = cfg or ler_config()
    saida = {}
    sess = _sessao()
    for f in cfg.fontes:
        if f.tipo == "pasta":
            try:
                idx = indice_pasta(f, cfg, forcar=True) if os.path.isdir(f.pasta) else []
                saida[f.id] = {"pasta": f.pasta, "existe": os.path.isdir(f.pasta), "folhas": len(idx)}
            except OSError as e:
                saida[f.id] = {"erro": repr(e)}
        elif f.tipo == "wcs":
            try:
                r = sess.get(f.url, params={"service": "WCS", "request": "GetCapabilities",
                                            "version": "2.0.1"}, timeout=cfg.timeout_s)
                ids = re.findall(r"<wcs:CoverageId>([^<]+)</wcs:CoverageId>", r.text)
                saida[f.id] = {"http": r.status_code, "coverages_no_servico": ids,
                               "configuradas": {v: (v in ids) for v in f.coverage.values()}}
            except requests.RequestException as e:
                saida[f.id] = {"erro": repr(e)}
    return saida


def quadrado_ha(lon: float, lat: float, ha: float) -> dict:
    epsg = crs_destino(lon, lat)
    x, y = _tf("EPSG:4326", f"EPSG:{epsg}")(lon, lat)
    l = math.sqrt(ha * 10_000) / 2
    q = box(x - l, y - l, x + l, y + l)
    return {"type": "Feature", "properties": {},
            "geometry": mapping(shp_transform(_tf(f"EPSG:{epsg}", "EPSG:4326"), q))}


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["diagnostico"]:
        print(json.dumps(diagnostico(), indent=2, ensure_ascii=False))
    elif a[:1] in (["cobertura"], ["recorte"]) and len(a) == 4:
        lon, lat, ha = map(float, a[1:4])
        q = quadrado_ha(lon, lat, ha)
        if a[0] == "cobertura":
            print(json.dumps(cobertura(q), indent=2, ensure_ascii=False))
        else:
            try:
                print(json.dumps(obter_mdt_es(q, os.path.join(os.getcwd(), "recorte_es")),
                                 indent=2, ensure_ascii=False, default=str))
            except SemLidar as e:
                print("SEM LIDAR:", e)
                sys.exit(2)
    else:
        print(__doc__)
