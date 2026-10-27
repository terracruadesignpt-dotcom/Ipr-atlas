"""Testes do adaptador França (sem rede: o WMS-R é simulado). pytest -q test_fonte_fr.py"""
import json
import os

import numpy as np
import pytest
import rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin

import fonte_fr as F


class Resp:
    def __init__(self, status, content, ct="image/geotiff"):
        self.status_code, self.content, self.headers = status, content, {"Content-Type": ct}


class WMSFalso:
    """Devolve um GeoTIFF float para o BBOX pedido. zicad = caixa (x0,y0,x1,y1) em Lambert-93 sem dados."""
    def __init__(self, zicad=None, falhas=0, sem_nodata=False):
        self.zicad, self.falhas, self.pedidos, self.sem_nodata = zicad, falhas, [], sem_nodata

    def get(self, url, params=None, timeout=None):
        p = dict(params)
        self.pedidos.append(p)
        if p.get("REQUEST") == "GetCapabilities":
            return Resp(200, b"", "text/xml")
        if self.falhas:
            self.falhas -= 1
            return Resp(500, b"<ServiceException>ocupado</ServiceException>", "text/xml")
        x0, y0, x1, y1 = map(float, p["BBOX"].split(","))
        w, h = int(p["WIDTH"]), int(p["HEIGHT"])
        rx, ry = (x1 - x0) / w, (y1 - y0) / h
        xs = x0 + (np.arange(w) + 0.5) * rx
        ys = y1 - (np.arange(h) + 0.5) * ry
        X, Y = np.meshgrid(xs, ys)
        a = (100 + (X - x0) * 0.01 + (Y - y0) * 0.02).astype("float32")
        if self.zicad:
            zx0, zy0, zx1, zy1 = self.zicad
            a[(X >= zx0) & (X <= zx1) & (Y >= zy0) & (Y <= zy1)] = -9999
        epsg = int(p["CRS"].split(":")[1])
        with MemoryFile() as mf:
            kw = dict(driver="GTiff", width=w, height=h, count=1, dtype="float32",
                      transform=from_origin(x0, y1, rx, ry), crs=f"EPSG:{epsg}")
            if not self.sem_nodata:
                kw["nodata"] = -9999
            with mf.open(**kw) as d:
                d.write(a, 1)
            return Resp(200, mf.read())


@pytest.fixture
def cfg():
    c = F.ler_config()
    c.pausa_s = 0
    return c


PERIGUEUX = (0.95, 45.05)


def test_crs_destino():
    assert F.crs_destino(*PERIGUEUX) == "2154"
    assert F.crs_destino(9.0, 42.1) == "2154"          # Córsega
    assert F.crs_destino(55.5, -21.1) == "2975"        # Reunião
    assert F.crs_destino(-7.9, 37.5) is None           # Portugal (fora da caixa)
    assert F.crs_destino(-61.5, 16.2) is None          # Guadalupe: fora nesta fase


def test_getmap_alinhado_a_grelha(cfg):
    f = cfg.fontes[0]
    p = dict(F.params_getmap(f, "2154", (521000.0, 6455000.0, 521200.0, 6455200.0), 0.5))
    assert p["LAYERS"] == "IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93"
    assert p["CRS"] == "EPSG:2154" and p["FORMAT"] == "image/geotiff"
    assert (p["WIDTH"], p["HEIGHT"]) == ("400", "400")
    assert F.alinhar((10.3, 20.7, 30.1, 40.2), 0.5) == (10.0, 20.5, 30.5, 40.5)


def test_blocos_respeitam_limite():
    bl = list(F.blocos((0, 0, 4500, 2000), 0.5, 4000))   # 9000 x 4000 px
    assert len(bl) == 3 * 1
    assert all((b[2] - b[0]) / 0.5 <= 4000 and (b[3] - b[1]) / 0.5 <= 4000 for b in bl)


def test_recorte_ok(tmp_path, cfg):
    wms = WMSFalso()
    r = F.obter_mdt_fr(F.quadrado_ha(*PERIGUEUX, 5), str(tmp_path), cfg, log=lambda *a: None, sess=wms)
    assert r["crs"] == "EPSG:2154" and r["resolucao_m"] == 0.5 and r["nodata_frac"] == 0
    assert "Licence Ouverte 2.0" in r["atribuicao"] and "30/09/2026" in r["atribuicao"]
    with rasterio.open(r["tif"]) as s:
        assert s.crs.to_epsg() == 2154 and abs(s.res[0] - 0.5) < 1e-9 and s.nodata == -9999
        a = s.read(1)
        assert (a > 50).all()
    assert all(int(p["WIDTH"]) <= 4000 for p in wms.pedidos)


def test_zicad_recusa_explicita(tmp_path, cfg):
    g = F.quadrado_ha(*PERIGUEUX, 5)
    x, y = F._tf("EPSG:4326", "EPSG:2154")(*PERIGUEUX)
    wms = WMSFalso(zicad=(x - 50, y - 50, x + 50, y + 50))   # 1 ha sem dados no meio
    with pytest.raises(F.SemLidar) as e:
        F.obter_mdt_fr(g, str(tmp_path), cfg, log=lambda *a: None, sess=wms)
    d = json.loads(str(e.value))
    assert d["motivo"] == "zicad_ou_sem_cobertura" and d["tentativas"][0]["nodata_frac"] > 0.1


def test_fora_de_franca(tmp_path, cfg):
    with pytest.raises(F.SemLidar) as e:
        F.obter_mdt_fr(F.quadrado_ha(-7.9, 37.5, 5), str(tmp_path), cfg, log=lambda *a: None, sess=WMSFalso())
    assert "fora_de_franca" in str(e.value)


def test_repete_quando_o_servico_falha(tmp_path, cfg):
    wms = WMSFalso(falhas=2)
    r = F.obter_mdt_fr(F.quadrado_ha(*PERIGUEUX, 2), str(tmp_path), cfg, log=lambda *a: None, sess=wms)
    assert r["nodata_frac"] == 0


def test_desiste_ao_fim_das_tentativas(tmp_path, cfg):
    with pytest.raises(F.SemLidar) as e:
        F.obter_mdt_fr(F.quadrado_ha(*PERIGUEUX, 2), str(tmp_path), cfg, log=lambda *a: None, sess=WMSFalso(falhas=99))
    assert json.loads(str(e.value))["motivo"] == "sem_fonte"


def test_grande_parcela_passa_a_1_m(tmp_path, cfg):
    wms = WMSFalso()
    r = F.obter_mdt_fr(F.quadrado_ha(*PERIGUEUX, 600), str(tmp_path), cfg, log=lambda *a: None, sess=wms)
    assert r["resolucao_m"] == 1.0 and len(wms.pedidos) >= 1


def test_tiff_sem_nodata_declarado(tmp_path, cfg):
    g = F.quadrado_ha(*PERIGUEUX, 5)
    x, y = F._tf("EPSG:4326", "EPSG:2154")(*PERIGUEUX)
    with pytest.raises(F.SemLidar):
        F.obter_mdt_fr(g, str(tmp_path), cfg, log=lambda *a: None,
                       sess=WMSFalso(zicad=(x - 50, y - 50, x + 50, y + 50), sem_nodata=True))
