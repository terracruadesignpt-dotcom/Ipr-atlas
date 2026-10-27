"""Adaptadores europeus da Base Cartográfica (Terracrua Design / IPR).

Abre-se fonte a fonte, não país a país: cada fonte de relevo LiDAR é uma
entrada declarativa em fontes_eu.json e um de cinco tipos de adaptador:

- stac        pesquisa STAC (items por bbox) e escolha de assets por regex (Suíça);
- cog_grid    folhas numa grelha regular com modelo de URL (Áustria, Países Baixos, Baviera);
- wcs         WCS 2.0.1 GetCoverage por blocos (Inglaterra, Noruega, Finlândia, Flandres);
- tile_index  índice de folhas por WFS, ATOM, JSON, lista de nomes ou API udata (Polónia, NRW, AHN, Luxemburgo);
- laz_tiles   nuvens de pontos de terreno por folha, rasterizadas com PDAL ou WhiteboxTools (Chéquia; esboço).

Mais dois tipos de encaminhamento: "externo" (Portugal e Espanha, que têm adaptador
próprio em produção ou em espanha/worker) e "alias" (Liechtenstein no swissALTI3D).

Regras da casa, iguais às de Portugal e Espanha:
- Só LiDAR oficial. Sem MDT LiDAR com resolução de 2 m ou melhor não há Base (SemLidar).
- Copernicus GLO-30, SRTM, EU-DEM e FABDEM nunca entram como Base (nem existem aqui como fonte).
- Processa-se no CRS métrico da fonte (crs_processamento); reprojecta-se só à saída (reprojectar_saida).
- A atribuição sai das folhas efectivamente usadas, com os anos de voo quando se conhecem.
- Cache por fonte, versão e folha; modo diagnóstico por adaptador (python3 fontes_eu.py diagnostico).

Uso pelo worker:
    from fontes_eu import obter_mdt, SemLidar
    res = obter_mdt(geojson, pasta_trabalho)              # escolhe a fonte pela localização
    res = obter_mdt(geojson, pasta, fonte_id="at_bev")    # força uma fonte (testes)
"""

from __future__ import annotations

import hashlib
import importlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from urllib.parse import urlencode

import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.errors import RasterioIOError
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
from rasterio.vrt import WarpedVRT
from rasterio.warp import Resampling, transform_bounds
from pyproj import Transformer
from shapely.geometry import Polygon, box, mapping, shape
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union

AQUI = os.path.dirname(os.path.abspath(__file__))
CONFIG_PADRAO = os.path.join(AQUI, "fontes_eu.json")
UA = "TerracruaDesign-IPR-worker/1.0 (+https://terracruadesign.pt; info@terracruadesign.pt)"
ND = -9999.0
TIPOS = ("stac", "cog_grid", "wcs", "tile_index", "laz_tiles", "externo", "alias")
PROIBIDAS = ("glo-30", "glo30", "copernicus dem", "srtm", "eu-dem", "fabdem")


class SemLidar(Exception):
    """Não há LiDAR oficial adequado para a parcela: a encomenda não é confirmada."""


class FonteExterna(Exception):
    """A parcela pertence a uma fonte com adaptador próprio (Portugal)."""


class FonteIndisponivel(Exception):
    """A fonte existe mas não pode servir agora (rasterizador em falta, chave em falta)."""


# --- Configuração ---------------------------------------------------------------------------

@dataclass
class Fonte:
    id: str
    tipo: str
    pais: str
    rotulo: str
    resolucao_m: float
    cobertura_bbox: list
    prioridade: int = 50
    epsg: str = ""
    crs_tiles: str = ""
    crs_processamento: str = ""
    datum_vertical: str = ""
    licenca: str = ""
    atribuicao: str = ""
    atribuicao_confirmada: bool = False
    versao: str = ""
    regras: dict = field(default_factory=dict)
    ponto_teste: list = field(default_factory=list)
    estado: str = "nao_testado"
    extra: dict = field(default_factory=dict)

    def get(self, chave, omissao=None):
        return self.extra.get(chave, omissao)


@dataclass
class Config:
    fontes: list
    res_max_base_m: float = 2.0
    buffer_frac: float = 0.2
    buffer_min_m: float = 100.0
    buffer_max_m: float = 2000.0
    nodata_max_frac: float = 0.01
    timeout_s: int = 90
    tentativas: int = 3
    cache: str = os.path.join(tempfile.gettempdir(), "tcd-lidar-eu-cache")

    def fonte(self, fid: str) -> Fonte:
        for f in self.fontes:
            if f.id == fid:
                return f
        raise KeyError(fid)


_CAMPOS = {f for f in Fonte.__dataclass_fields__} - {"extra"}


def validar_fonte(d: dict) -> None:
    falta = [k for k in ("id", "tipo", "pais", "rotulo", "resolucao_m", "cobertura_bbox") if k not in d]
    if falta:
        raise ValueError(f"fonte {d.get('id', '?')}: faltam {falta}")
    if d["tipo"] not in TIPOS:
        raise ValueError(f"fonte {d['id']}: tipo desconhecido {d['tipo']}")
    texto = (d.get("rotulo", "") + " " + d.get("id", "")).lower()
    if any(p in texto for p in PROIBIDAS):
        raise ValueError(f"fonte {d['id']}: modelos globais não são Base")
    if d["tipo"] in ("stac", "cog_grid", "wcs", "tile_index", "laz_tiles"):
        for k in ("epsg", "crs_processamento", "licenca", "atribuicao", "datum_vertical"):
            if not d.get(k):
                raise ValueError(f"fonte {d['id']}: falta {k}")


def ler_config(caminho: str = CONFIG_PADRAO) -> Config:
    with open(caminho, encoding="utf-8") as fh:
        bruto = json.load(fh)
    fontes = []
    for d in bruto.get("fontes", []):
        validar_fonte(d)
        base = {k: v for k, v in d.items() if k in _CAMPOS}
        base["extra"] = {k: v for k, v in d.items() if k not in _CAMPOS}
        fontes.append(Fonte(**base))
    cfg = Config(fontes=fontes)
    for k in ("res_max_base_m", "buffer_frac", "buffer_min_m", "buffer_max_m", "nodata_max_frac",
              "timeout_s", "tentativas", "cache"):
        if k in bruto:
            setattr(cfg, k, bruto[k])
    return cfg


# --- Geometria ------------------------------------------------------------------------------

def _tf(a: str, b: str):
    return Transformer.from_crs(a, b, always_xy=True).transform


def para_crs(geom, epsg: str, de: str = "4326"):
    return shp_transform(_tf(f"EPSG:{de}", f"EPSG:{epsg}"), geom)


def ler_geometria(geojson: dict):
    """Aceita Geometry, Feature ou FeatureCollection."""
    t = geojson.get("type")
    if t == "FeatureCollection":
        return unary_union([shape(f["geometry"]) for f in geojson["features"]])
    if t == "Feature":
        return shape(geojson["geometry"])
    return shape(geojson)


def area_com_buffer(geom_m, cfg: Config):
    minx, miny, maxx, maxy = geom_m.bounds
    maior = max(maxx - minx, maxy - miny)
    b = min(max(maior * cfg.buffer_frac, cfg.buffer_min_m), cfg.buffer_max_m)
    return geom_m.buffer(b), b


def resolucao_trabalho(area_buffer_ha: float, res_fonte: float) -> float:
    """Como em Portugal: 0,5 m até 400 ha de buffer, 1 m até 2500 ha, 2 m acima; nunca mais fino que a fonte."""
    alvo = 0.5 if area_buffer_ha <= 400 else (1.0 if area_buffer_ha <= 2500 else 2.0)
    return max(alvo, res_fonte)


def quadrado_ha(lon: float, lat: float, ha: float) -> dict:
    """Quadrado de `ha` hectares centrado no ponto (para testes e diagnóstico)."""
    lado = math.sqrt(ha * 10000.0)
    dlat = lado / 2 / 111320.0
    dlon = lado / 2 / (111320.0 * math.cos(math.radians(lat)))
    return {"type": "Polygon", "coordinates": [[[lon - dlon, lat - dlat], [lon + dlon, lat - dlat],
                                                [lon + dlon, lat + dlat], [lon - dlon, lat + dlat],
                                                [lon - dlon, lat - dlat]]]}


def candidatas(geom_ll, cfg: Config, pais: str | None = None) -> list:
    """Fontes cuja cobertura toca a parcela, resolvendo aliases, por prioridade e resolução."""
    out, vistos = [], set()
    for f in cfg.fontes:
        if pais and not (f.pais == pais or f.pais.startswith(pais + "-")):
            continue
        if not box(*f.cobertura_bbox).intersects(geom_ll):
            continue
        if f.get("cobertura_poligono") and not Polygon(f.get("cobertura_poligono")).intersects(geom_ll):
            continue
        alvo = cfg.fonte(f.get("alias_de")) if f.tipo == "alias" else f
        if alvo.id in vistos:
            continue
        vistos.add(alvo.id)
        out.append((f.prioridade, alvo.resolucao_m, alvo))
    return [f for _, _, f in sorted(out, key=lambda t: (t[0], t[1]))]


# --- HTTP (substituível nos testes) ---------------------------------------------------------

class Http:
    def __init__(self, timeout: int = 90, tentativas: int = 3):
        import requests
        self.s = requests.Session()
        self.s.headers["User-Agent"] = UA
        self.timeout, self.tentativas = timeout, tentativas

    def get(self, url: str, params=None) -> bytes:
        ultimo = None
        for _ in range(self.tentativas):
            try:
                r = self.s.get(url, params=params, timeout=self.timeout)
                if r.status_code == 200:
                    return r.content
                ultimo = f"HTTP {r.status_code}"
                if r.status_code in (400, 401, 403, 404):
                    break
            except Exception as e:  # rede
                ultimo = str(e)
        raise FonteIndisponivel(f"{url}: {ultimo}")

    def head(self, url: str) -> int:
        try:
            return self.s.head(url, timeout=self.timeout, allow_redirects=True).status_code
        except Exception:
            return 0


# --- Folhas ---------------------------------------------------------------------------------

@dataclass
class Folha:
    id: str
    url: str
    bbox: tuple | None = None       # no crs_tiles da fonte (ou WGS84 em STAC)
    ano: str = ""
    crs_bbox: str = ""
    dados: bytes | None = None      # WCS: o bloco já descarregado


def _anos(folhas) -> str:
    anos = sorted({f.ano for f in folhas if f.ano})
    if not anos:
        return "ano por indicar"
    return anos[0] if len(anos) == 1 else f"{anos[0]}–{anos[-1]}"


class Adaptador:
    def __init__(self, fonte: Fonte, cfg: Config, http=None):
        self.f, self.cfg = fonte, cfg
        self.http = http or Http(cfg.timeout_s, cfg.tentativas)

    @property
    def crs_tiles(self) -> str:
        return self.f.crs_tiles or self.f.epsg

    def folhas(self, bnds_proc) -> list:
        raise NotImplementedError

    def sondas(self) -> list:
        """(descrição, url) a pedir no diagnóstico."""
        return []

    def disponivel(self) -> tuple[bool, str]:
        return True, ""

    def abrir(self, folha: Folha):
        if folha.dados is not None:
            return MemoryFile(folha.dados).open()
        return rasterio.open(folha.url)

    def _bnds_em(self, bnds_proc, epsg: str):
        if epsg == self.f.crs_processamento:
            return bnds_proc
        return transform_bounds(f"EPSG:{self.f.crs_processamento}", f"EPSG:{epsg}", *bnds_proc, densify_pts=21)


class AdaptadorCogGrid(Adaptador):
    def chave(self, x: float, y: float) -> str:
        g = self.f.get("grelha")
        fmt = g.get("formato")
        if not fmt:
            return f"{int(round(y))}_{int(round(x))}"
        return fmt.format(x=x, y=y, xk=int(round(x / 1000)), yk=int(round(y / 1000)))

    def folhas(self, bnds_proc):
        g = self.f.get("grelha")
        t, ox, oy = float(g["tamanho"]), float(g.get("origem_x", 0)), float(g.get("origem_y", 0))
        x0, y0, x1, y1 = self._bnds_em(bnds_proc, self.crs_tiles)
        eps = t * 1e-9
        i0, i1 = math.floor((x0 - ox) / t + eps), math.floor((x1 - ox) / t - eps)
        j0, j1 = math.floor((y0 - oy) / t + eps), math.floor((y1 - oy) / t - eps)
        out = []
        for i in range(i0, i1 + 1):
            for j in range(j0, j1 + 1):
                x, y = ox + i * t, oy + j * t
                if t < 1:  # graus: evitar 52.099999
                    x, y = round(x, 6), round(y, 6)
                xi, yi = (x, y) if t < 1 else (int(round(x)), int(round(y)))
                k = self.chave(xi, yi)
                url = self.f.get("url_modelo").format(x=xi, y=yi, chave=k, versao=self.f.versao,
                                                      xk=int(round(x / 1000)), yk=int(round(y / 1000)))
                out.append(Folha(id=k, url=url, bbox=(x, y, x + t, y + t), ano=self.f.get("ano", ""),
                                 crs_bbox=self.crs_tiles))
        return out

    def sondas(self):
        if not self.f.ponto_teste:
            return []
        lon, lat = self.f.ponto_teste
        p = para_crs(box(lon, lat, lon + 1e-4, lat + 1e-4), self.f.crs_processamento).bounds
        fs = self.folhas(p)
        return [("HEAD folha do ponto de teste", fs[0].url)] if fs else []


class AdaptadorStac(Adaptador):
    def folhas(self, bnds_proc):
        s = self.f.get("stac")
        ll = self._bnds_em(bnds_proc, "4326")
        url = f"{s['url'].rstrip('/')}/collections/{s['coleccao']}/items"
        params = {"bbox": ",".join(f"{v:.6f}" for v in ll), "limit": s.get("limite", 100)}
        rx = re.compile(s["asset_regex"])
        out, pag = [], 0
        while url and pag < 50:
            dados = json.loads(self.http.get(url, params=params))
            for it in dados.get("features", []):
                ano = str(it.get("properties", {}).get("datetime") or "")[:4]
                for nome, a in (it.get("assets") or {}).items():
                    href = a.get("href", "")
                    if rx.search(href) or rx.search(nome):
                        out.append(Folha(id=it.get("id", nome), url=href, bbox=tuple(it.get("bbox") or ()) or None,
                                         ano=ano, crs_bbox="4326"))
            nxt = [l for l in dados.get("links", []) if l.get("rel") == "next"]
            url, params, pag = (nxt[0]["href"], None, pag + 1) if nxt else (None, None, pag)
        # A mesma folha pode existir em vários anos: fica a mais recente.
        por_id = {}
        for f in out:
            if f.id not in por_id or f.ano > por_id[f.id].ano:
                por_id[f.id] = f
        return list(por_id.values())

    def sondas(self):
        s = self.f.get("stac")
        return [("colecção STAC", f"{s['url'].rstrip('/')}/collections/{s['coleccao']}")]


class AdaptadorWcs(Adaptador):
    def disponivel(self):
        w = self.f.get("wcs")
        if w.get("chave_env") and not os.environ.get(w["chave_env"]):
            return False, f"falta a chave na variável {w['chave_env']}"
        return True, ""

    def _base(self):
        w = self.f.get("wcs")
        p = [("service", "WCS"), ("version", w.get("versao", "2.0.1"))]
        if w.get("chave_env") and os.environ.get(w["chave_env"]):
            p.append((w.get("chave_param", "api-key"), os.environ[w["chave_env"]]))
        return w, p

    def url_bloco(self, b, res):
        w, p = self._base()
        ex, ey = w.get("eixos", ["x", "y"])
        uri = f"http://www.opengis.net/def/crs/EPSG/0/{self.f.epsg}"
        x0, y0, x1, y1 = b
        p += [("request", "GetCoverage"), ("coverageId", w["coverage"]), ("format", w.get("formato", "image/tiff")),
              ("subset", f"{ex}({x0:.2f},{x1:.2f})"), ("subset", f"{ey}({y0:.2f},{y1:.2f})"),
              ("subsettingCrs", uri), ("outputCrs", uri),
              ("scaleSize", f"{ex}({max(1, round((x1 - x0) / res))}),{ey}({max(1, round((y1 - y0) / res))})")]
        return w["url"] + "?" + urlencode(p)

    def folhas(self, bnds_proc, res: float | None = None):
        ok, motivo = self.disponivel()
        if not ok:
            raise FonteIndisponivel(motivo)
        res = res or self.f.resolucao_m
        w = self.f.get("wcs")
        x0, y0, x1, y1 = self._bnds_em(bnds_proc, self.f.epsg)
        m = 2 * res
        x0, y0 = math.floor((x0 - m) / res) * res, math.floor((y0 - m) / res) * res
        x1, y1 = math.ceil((x1 + m) / res) * res, math.ceil((y1 + m) / res) * res
        passo = res * w.get("max_px", 4000)
        out = []
        for i in range(max(1, math.ceil((x1 - x0) / passo))):
            for j in range(max(1, math.ceil((y1 - y0) / passo))):
                b = (x0 + i * passo, y0 + j * passo, min(x0 + (i + 1) * passo, x1), min(y0 + (j + 1) * passo, y1))
                url = self.url_bloco(b, res)
                dados = self.http.get(url)
                if dados[:4] not in (b"II*\x00", b"MM\x00*"):
                    raise FonteIndisponivel(f"{self.f.id}: o WCS não devolveu GeoTIFF ({dados[:120]!r})")
                out.append(Folha(id=f"bloco_{i}_{j}", url=url, bbox=b, ano=self.f.get("ano", ""),
                                 crs_bbox=self.f.epsg, dados=dados))
        return out

    def sondas(self):
        w, p = self._base()
        return [("GetCapabilities", w["url"] + "?" + urlencode(p + [("request", "GetCapabilities")]))]


def _num(s):
    return [float(v) for v in re.split(r"[\s,]+", s.strip()) if v]


class AdaptadorTileIndex(Adaptador):
    """Índice de folhas: wfs | atom | json | lista_nomes | udata."""

    def _entradas(self, bnds_tiles) -> list:
        ix = self.f.get("indice")
        fmt = ix["formato"]
        if fmt == "wfs":
            p = {"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": ix["typename"],
                 "outputFormat": "application/json", "srsName": f"EPSG:{self.crs_tiles}",
                 "bbox": ",".join(f"{v:.2f}" for v in bnds_tiles) + f",EPSG:{self.crs_tiles}"}
            dados = json.loads(self.http.get(ix["url"], params=p))
            return self._de_geojson(dados, ix)
        if fmt == "json":
            return self._de_geojson(json.loads(self.http.get(ix["url"])), ix)
        if fmt == "atom":
            return self._de_atom(self.http.get(ix["url"]), ix, profundidade=0)
        if fmt == "lista_nomes":
            return self._de_nomes(json.loads(self.http.get(ix["url"])), ix)
        if fmt == "udata":
            dados = json.loads(self.http.get(ix["url"]))
            nomes = [{"url": r.get("url", ""), "titulo": r.get("title", "")} for r in dados.get("resources", [])]
            return self._de_udata(nomes, ix)
        raise ValueError(f"formato de índice desconhecido: {fmt}")

    def _de_geojson(self, dados, ix):
        out = []
        cu, ca, ci = ix.get("campo_url", "url"), ix.get("campo_ano", "ano"), ix.get("campo_id", "id")
        for ft in dados.get("features", []):
            pr = ft.get("properties", {})
            if not pr.get(cu):
                continue
            g = shape(ft["geometry"]) if ft.get("geometry") else None
            out.append(Folha(id=str(pr.get(ci) or pr[cu].rsplit("/", 1)[-1]), url=pr[cu],
                             bbox=g.bounds if g is not None else None, ano=str(pr.get(ca) or "")[:4],
                             crs_bbox=self.crs_tiles))
        return out

    def _de_atom(self, xml: bytes, ix, profundidade: int):
        ns = {"a": "http://www.w3.org/2005/Atom", "georss": "http://www.georss.org/georss"}
        raiz = ET.fromstring(xml)
        out, sub = [], []
        ordem = ix.get("bbox_ordem", "xyxy")
        for e in raiz.findall(".//a:entry", ns) + [raiz]:
            for l in e.findall("a:link", ns):
                href, tipo = l.get("href", ""), (l.get("type") or "").lower()
                if "atom" in tipo and l.get("rel") in ("alternate", "related", None) and e is not raiz:
                    sub.append(href)
                    continue
                if not re.search(r"\.(tif|tiff|asc|laz|las|zip)(\?|$)", href, re.I):
                    continue
                bb = None
                if l.get("bbox"):
                    v = _num(l.get("bbox"))
                    bb = (v[1], v[0], v[3], v[2]) if ordem == "yxyx" else tuple(v[:4])
                out.append(Folha(id=href.rsplit("/", 1)[-1], url=href, bbox=bb,
                                 ano=(re.search(r"(19|20)\d{2}", href) or [""])[0], crs_bbox=ix.get("bbox_crs", self.crs_tiles)))
        if not out and sub and profundidade < 1:
            for s in sub[:5]:
                out += self._de_atom(self.http.get(s), ix, profundidade + 1)
        return out

    def _de_nomes(self, dados, ix):
        rx = re.compile(ix["regex"])
        t = float(ix.get("tamanho", 1000))
        nomes = []

        def andar(v):
            if isinstance(v, str):
                nomes.append(v)
            elif isinstance(v, dict):
                for w in v.values():
                    andar(w)
            elif isinstance(v, list):
                for w in v:
                    andar(w)
        andar(dados)
        por_folha = {}
        for n in nomes:
            m = rx.search(n)
            if not m:
                continue
            x, y = int(m.group("xk")) * 1000, int(m.group("yk")) * 1000
            ano = m.groupdict().get("ano") or ""
            k = (x, y)
            if k not in por_folha or ano > por_folha[k].ano:
                nome = n.rsplit("/", 1)[-1]
                por_folha[k] = Folha(id=nome, url=ix.get("base", "") + nome, bbox=(x, y, x + t, y + t), ano=ano,
                                     crs_bbox=self.crs_tiles)
        return list(por_folha.values())

    def _de_udata(self, nomes, ix):
        rx, t = re.compile(ix["regex_bbox"]), float(ix.get("tamanho", 1000))
        out = []
        for n in nomes:
            m = rx.search(n["titulo"] + " " + n["url"])
            if not m:
                continue
            x, y = float(m.group(1)), float(m.group(2))
            out.append(Folha(id=n["url"].rsplit("/", 1)[-1], url=n["url"], bbox=(x, y, x + t, y + t),
                             crs_bbox=self.crs_tiles))
        return out

    def folhas(self, bnds_proc):
        alvo = self._bnds_em(bnds_proc, self.crs_tiles)
        bb = box(*alvo)
        out = []
        for f in self._entradas(alvo):
            if f.bbox is None:
                out.append(f)
                continue
            fb = f.bbox
            if f.crs_bbox and f.crs_bbox != self.crs_tiles:
                fb = transform_bounds(f"EPSG:{f.crs_bbox}", f"EPSG:{self.crs_tiles}", *fb, densify_pts=5)
            if box(*fb).intersects(bb):
                out.append(f)
        return out

    def sondas(self):
        ix = self.f.get("indice")
        if ix["formato"] == "wfs":
            return [("GetCapabilities do índice", ix["url"] + "?" + urlencode({"service": "WFS", "request": "GetCapabilities"}))]
        return [("índice de folhas", ix["url"])]


def rasterizador() -> str:
    if shutil.which("pdal"):
        return "pdal"
    if shutil.which("whitebox_tools"):
        return "whitebox_tools"
    try:
        importlib.import_module("whitebox_workflows")
        return "whitebox_workflows"
    except ImportError:
        return ""


class AdaptadorLaz(AdaptadorTileIndex):
    """Esboço: descarrega a nuvem de pontos de cada folha e rasteriza só a classe 2 (solo)."""

    def disponivel(self):
        r = rasterizador()
        return (True, r) if r else (False, "sem PDAL nem WhiteboxTools no servidor")

    def folhas(self, bnds_proc):
        ok, motivo = self.disponivel()
        if not ok:
            raise FonteIndisponivel(f"{self.f.id}: {motivo}")
        return super().folhas(bnds_proc)

    def abrir(self, folha: Folha):
        destino = os.path.join(_pasta_cache(self.cfg, self.f), "laz", hashlib.sha1(folha.url.encode()).hexdigest()[:20])
        tif = destino + ".tif"
        if not os.path.exists(tif):
            os.makedirs(os.path.dirname(tif), exist_ok=True)
            laz = destino + ".laz"
            if not os.path.exists(laz):
                with open(laz, "wb") as fh:
                    fh.write(self.http.get(folha.url))
            rasterizar_laz(laz, tif, self.f.resolucao_m, self.f.epsg)
        return rasterio.open(tif)

    def sondas(self):
        return super().sondas() + [("rasterizador", rasterizador() or "em falta")]


def rasterizar_laz(laz: str, tif: str, res: float, epsg: str) -> None:
    r = rasterizador()
    if r == "pdal":
        pipe = {"pipeline": [laz, {"type": "filters.range", "limits": "Classification[2:2]"},
                             {"type": "writers.gdal", "filename": tif, "resolution": res, "output_type": "idw",
                              "data_type": "float32", "nodata": ND, "override_srs": f"EPSG:{epsg}"}]}
        subprocess.run(["pdal", "pipeline", "--stdin"], input=json.dumps(pipe).encode(), check=True, timeout=1800)
    elif r == "whitebox_tools":
        subprocess.run(["whitebox_tools", "-r=LidarTINGridding", f"-i={laz}", f"-o={tif}", "--parameter=elevation",
                        "--returns=all", f"--resolution={res}", "--exclude_cls=0,1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18"],
                       check=True, timeout=1800)
    else:
        raise FonteIndisponivel("sem rasterizador de LAZ")


ADAPTADORES = {"stac": AdaptadorStac, "cog_grid": AdaptadorCogGrid, "wcs": AdaptadorWcs,
               "tile_index": AdaptadorTileIndex, "laz_tiles": AdaptadorLaz}


def adaptador(fonte: Fonte, cfg: Config, http=None) -> Adaptador:
    return ADAPTADORES[fonte.tipo](fonte, cfg, http)


# --- Cache ----------------------------------------------------------------------------------

def _pasta_cache(cfg: Config, f: Fonte) -> str:
    return os.path.join(cfg.cache, f.id, f.versao or "v0")


def _chave_cache(f: Fonte, folha: Folha, grelha) -> str:
    base = json.dumps([f.id, f.versao, folha.url if folha.dados is None else hashlib.sha1(folha.dados).hexdigest(),
                       grelha], sort_keys=True)
    return hashlib.sha1(base.encode()).hexdigest()[:24]


# --- Montagem -------------------------------------------------------------------------------

def _ler_para_grelha(ad: Adaptador, folha: Folha, crs_dst: CRS, tr, w: int, h: int, grelha_id) -> np.ndarray | None:
    """Lê a parte da folha que cabe na grelha de destino (janela, sem descarregar a folha toda se for COG)."""
    cache = os.path.join(_pasta_cache(ad.cfg, ad.f), "janelas", _chave_cache(ad.f, folha, grelha_id) + ".npy")
    if os.path.exists(cache):
        return np.load(cache)
    try:
        src = ad.abrir(folha)
    except (RasterioIOError, FonteIndisponivel):
        return None  # folha inexistente (mar, fronteira) ou indisponível
    with src:
        crs_src = src.crs or CRS.from_epsg(int(ad.f.epsg))
        nd = src.nodata if src.nodata is not None else ND
        with WarpedVRT(src, src_crs=crs_src, crs=crs_dst, transform=tr, width=w, height=h,
                       resampling=Resampling.bilinear, src_nodata=nd, nodata=ND) as vrt:
            a = vrt.read(1).astype("float32")
    a[~np.isfinite(a) | (a < -500)] = ND
    os.makedirs(os.path.dirname(cache), exist_ok=True)
    np.save(cache, a)
    return a


def _gravar(a, tr, crs, destino):
    perfil = dict(driver="GTiff", height=a.shape[0], width=a.shape[1], count=1, dtype="float32",
                  transform=tr, crs=crs, nodata=ND, compress="deflate", tiled=True,
                  blockxsize=256, blockysize=256, BIGTIFF="IF_SAFER")
    with rasterio.open(destino, "w", **perfil) as dst:
        dst.write(a.astype("float32"), 1)


def fraccao_nodata(a: np.ndarray, tr, geom_m) -> float:
    from rasterio.features import geometry_mask
    fora = geometry_mask([mapping(geom_m)], out_shape=a.shape, transform=tr, all_touched=True)
    v = a[~fora]
    return 1.0 if v.size == 0 else float((v == ND).sum()) / float(v.size)


def preencher_vazios(a: np.ndarray, max_px: int) -> tuple[np.ndarray, bool]:
    """Preenche vazios pequenos (água e edifícios no AHN). Devolve (array, conseguiu)."""
    from rasterio.fill import fillnodata
    from scipy.ndimage import label
    vaz = a == ND
    if not vaz.any():
        return a, True
    rot, n = label(vaz)
    tamanhos = np.bincount(rot.ravel())[1:]
    if n and tamanhos.max() > max_px:
        return a, False
    mask = (~vaz).astype("uint8")
    b = fillnodata(a.copy(), mask=mask, max_search_distance=max(10, int(math.sqrt(max_px)) * 3))
    return b, not (b == ND).any()


def montar(ad: Adaptador, geom_m, bnds, res: float, destino: str):
    """Monta o MDT da fonte na grelha da parcela (crs_processamento). Devolve (folhas usadas, fracção de vazios)."""
    f = ad.f
    x0, y0 = math.floor(bnds[0] / res) * res, math.floor(bnds[1] / res) * res
    x1, y1 = math.ceil(bnds[2] / res) * res, math.ceil(bnds[3] / res) * res
    w, h = max(1, round((x1 - x0) / res)), max(1, round((y1 - y0) / res))
    tr = from_origin(x0, y1, res, res)
    crs = CRS.from_epsg(int(f.crs_processamento))
    folhas = ad.folhas((x0, y0, x1, y1), res) if isinstance(ad, AdaptadorWcs) else ad.folhas((x0, y0, x1, y1))
    folhas = sorted(folhas, key=lambda fl: fl.ano, reverse=True)  # a mais recente manda nas sobreposições
    a = np.full((h, w), ND, dtype="float32")
    usadas = []
    grelha_id = [f.crs_processamento, x0, y1, res, w, h]
    for fl in folhas:
        parte = _ler_para_grelha(ad, fl, crs, tr, w, h, grelha_id)
        if parte is None:
            continue
        novo = (a == ND) & (parte != ND)
        if novo.any():
            a[novo] = parte[novo]
            usadas.append(fl)
    frac = fraccao_nodata(a, tr, geom_m)
    if frac > ad.cfg.nodata_max_frac and f.regras.get("vazios") == "preencher":
        b, ok = preencher_vazios(a, int(f.regras.get("max_preencher_px", 400)))
        if ok:
            a, frac = b, fraccao_nodata(b, tr, geom_m)
    _gravar(a, tr, crs, destino)
    return usadas, frac


def atribuicao(f: Fonte, folhas) -> str:
    anos = _anos(folhas)
    pub = max([fl.ano for fl in folhas if fl.ano] or [str(__import__("datetime").date.today().year)])
    return f.atribuicao.format(anos=anos, ano_publicacao=pub)


def _externo(f: Fonte, geojson: dict, pasta: str, log):
    if f.get("modulo") == "fonte_es":
        sys.path.insert(0, os.path.join(AQUI, "..", "..", "espanha", "worker"))
        mod = importlib.import_module("fonte_es")
        return mod.obter_mdt_es(geojson, pasta, log=log)
    raise FonteExterna(f"{f.id}: usar o adaptador {f.get('modulo')}")


def obter_mdt(geojson: dict, pasta: str, cfg: Config | None = None, pais: str | None = None,
              fonte_id: str | None = None, http=None, log=print) -> dict:
    cfg = cfg or ler_config()
    geom_ll = ler_geometria(geojson)
    if fonte_id:
        fontes = [cfg.fonte(fonte_id)]
    else:
        fontes = candidatas(geom_ll, cfg, pais)
    if not fontes:
        raise SemLidar("Não há fonte LiDAR europeia registada para este terreno.")
    motivos = []
    for f in fontes:
        if f.tipo == "externo":
            return _externo(f, geojson, pasta, log)
        if f.resolucao_m > cfg.res_max_base_m:
            motivos.append(f"{f.id}: resolução {f.resolucao_m} m acima de {cfg.res_max_base_m} m")
            continue
        ad = adaptador(f, cfg, http)
        ok, porque = ad.disponivel()
        if not ok:
            motivos.append(f"{f.id}: {porque}")
            continue
        geom_m = para_crs(geom_ll, f.crs_processamento)
        buf, b = area_com_buffer(geom_m, cfg)
        res = resolucao_trabalho(buf.area / 10000.0, f.resolucao_m)
        os.makedirs(pasta, exist_ok=True)
        destino = os.path.join(pasta, f"mdt_{f.id}.tif")
        try:
            usadas, frac = montar(ad, geom_m, buf.bounds, res, destino)
        except FonteIndisponivel as e:
            motivos.append(f"{f.id}: {e}")
            continue
        if not usadas:
            motivos.append(f"{f.id}: sem folhas para a parcela")
            continue
        if frac > cfg.nodata_max_frac:
            motivos.append(f"{f.id}: {frac:.1%} da parcela sem dado")
            continue
        log(f"[eu] {f.id}: {len(usadas)} folha(s), {res} m, vazios {frac:.2%}")
        return {"tif": destino, "fonte": f.id, "pais": f.pais, "rotulo": f.rotulo, "epsg": f.crs_processamento,
                "datum_vertical": f.datum_vertical, "resolucao_m": res, "resolucao_fonte_m": f.resolucao_m,
                "buffer_m": round(b, 1), "folhas": [{"id": u.id, "ano": u.ano, "url": u.url if u.dados is None else "WCS"}
                                                    for u in usadas],
                "anos": _anos(usadas), "licenca": f.licenca, "atribuicao": atribuicao(f, usadas),
                "atribuicao_confirmada": f.atribuicao_confirmada, "vazios_frac": round(frac, 5),
                "estado_fonte": f.estado}
    raise SemLidar("Sem LiDAR adequado: " + "; ".join(motivos))


def reprojectar_saida(tif: str, epsg: str, destino: str, res: float | None = None) -> str:
    """Só à saída: reprojecta o MDT montado para o CRS pedido (por exemplo o do projecto QGIS do cliente)."""
    from rasterio.warp import calculate_default_transform, reproject
    with rasterio.open(tif) as src:
        dst_crs = CRS.from_epsg(int(epsg))
        tr, w, h = calculate_default_transform(src.crs, dst_crs, src.width, src.height, *src.bounds,
                                               resolution=res)
        a = np.full((h, w), ND, dtype="float32")
        reproject(src.read(1), a, src_transform=src.transform, src_crs=src.crs, src_nodata=ND,
                  dst_transform=tr, dst_crs=dst_crs, dst_nodata=ND, resampling=Resampling.bilinear)
    _gravar(a, tr, dst_crs, destino)
    return destino


# --- Diagnóstico e linha de comandos ---------------------------------------------------------

def diagnostico(cfg: Config | None = None, so: str | None = None, http=None) -> list:
    cfg = cfg or ler_config()
    http = http or Http(min(cfg.timeout_s, 30), 1)
    out = []
    for f in cfg.fontes:
        if so and f.id != so:
            continue
        if f.tipo in ("externo", "alias"):
            out.append({"fonte": f.id, "tipo": f.tipo, "ok": None, "nota": "fora deste módulo"})
            continue
        ad = adaptador(f, cfg, http)
        ok, porque = ad.disponivel()
        linha = {"fonte": f.id, "pais": f.pais, "tipo": f.tipo, "estado": f.estado, "disponivel": ok, "nota": porque,
                 "sondas": []}
        for desc, url in ad.sondas():
            if not url.startswith("http"):
                linha["sondas"].append({"desc": desc, "resultado": url})
                continue
            cod = http.head(url) if desc.startswith("HEAD") else None
            if cod is None:
                try:
                    corpo = http.get(url)
                    cod, amostra = 200, corpo[:80].decode("utf-8", "replace")
                except FonteIndisponivel as e:
                    cod, amostra = 0, str(e)[:120]
            else:
                amostra = ""
            linha["sondas"].append({"desc": desc, "url": url, "http": cod, "amostra": amostra})
        out.append(linha)
    return out


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cfg = ler_config()
    if argv[0] == "diagnostico":
        print(json.dumps(diagnostico(cfg, argv[1] if len(argv) > 1 else None), ensure_ascii=False, indent=1))
        return 0
    if argv[0] == "cobertura":
        lon, lat = float(argv[1]), float(argv[2])
        fs = candidatas(box(lon - 1e-4, lat - 1e-4, lon + 1e-4, lat + 1e-4), cfg)
        print(json.dumps([{"id": f.id, "pais": f.pais, "tipo": f.tipo, "res": f.resolucao_m, "estado": f.estado}
                          for f in fs], ensure_ascii=False, indent=1))
        return 0
    if argv[0] == "recorte":
        f = cfg.fonte(argv[1])
        ha = float(argv[2]) if len(argv) > 2 else 5.0
        lon, lat = f.ponto_teste
        pasta = tempfile.mkdtemp(prefix=f"recorte_{f.id}_")
        try:
            r = obter_mdt(quadrado_ha(lon, lat, ha), pasta, cfg, fonte_id=f.id)
            print(json.dumps(r, ensure_ascii=False, indent=1))
            return 0
        except (SemLidar, FonteExterna, FonteIndisponivel) as e:
            print(json.dumps({"fonte": f.id, "erro": str(e)}, ensure_ascii=False))
            return 2
    print("comandos: diagnostico [id] | cobertura LON LAT | recorte ID [HA]")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
