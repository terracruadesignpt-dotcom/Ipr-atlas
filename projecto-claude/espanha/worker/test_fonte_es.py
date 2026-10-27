"""Testes locais do adaptador Espanha, sem rede."""
import io
import json
import os

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin
from pyproj import Transformer

import fonte_es as F


def _tiff_bytes(epsg, b, res, vazio=False):
    x0, y0, x1, y1 = b
    w, h = max(1, round((x1 - x0) / res)), max(1, round((y1 - y0) / res))
    xs = np.linspace(x0, x1, w)[None, :].repeat(h, 0)
    a = np.full((h, w), -32767.0, "float32") if vazio else (200 + 0.05 * (xs - x0)).astype("float32")
    with rasterio.MemoryFile() as mf:
        with mf.open(driver="GTiff", width=w, height=h, count=1, dtype="float32",
                     crs=f"EPSG:{epsg}", transform=from_origin(x0, y1, res, res), nodata=-32767.0) as d:
            d.write(a, 1)
        return mf.read()


def _folha_asc(pasta, nome, x0, y0, lado=2000, res=2.0):
    """Folha ASC tipo CNIG, sem .prj (o fuso vem no nome)."""
    n = int(lado / res)
    xs = np.arange(n) * res
    a = 150 + 0.03 * xs[None, :].repeat(n, 0) + 0.02 * (np.arange(n)[:, None] * res)
    caminho = os.path.join(pasta, nome)
    with open(caminho, "w") as f:
        f.write(f"ncols {n}\nnrows {n}\nxllcorner {x0}\nyllcorner {y0}\ncellsize {res}\nNODATA_value -9999\n")
        np.savetxt(f, a[::-1], fmt="%.2f")
    return caminho


def _cfg(tmp_path):
    cfg = F.ler_config()
    for f in cfg.fontes:
        if f.tipo == "pasta":
            f.pasta = str(tmp_path / f.id)
            os.makedirs(f.pasta, exist_ok=True)
        else:
            f.max_px = 300
    return cfg


def test_crs_por_regiao():
    assert F.crs_destino(-8.0, 42.6) == "25829"
    assert F.crs_destino(-3.7, 40.4) == "25830"
    assert F.crs_destino(1.95, 41.9) == "25831"
    assert F.crs_destino(-16.5, 28.35) == "4083"


def test_mdt02_de_pasta_asc_sem_crs(tmp_path):
    cfg = _cfg(tmp_path)
    lon, lat = -6.97, 38.78
    x, y = Transformer.from_crs("EPSG:4326", "EPSG:25829", always_xy=True).transform(lon, lat)
    x0, y0 = (x // 2000) * 2000 - 2000, (y // 2000) * 2000 - 2000
    mdt02 = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    for i in range(3):
        for j in range(3):
            _folha_asc(mdt02, f"PNOA_MDT02_ETRS89_HU29_{int(x0/1000)+2*i}_{int(y0/1000)+2*j}_LID.asc",
                       x0 + 2000 * i, y0 + 2000 * j)
    res = F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), str(tmp_path / "out"), cfg, log=lambda *a: None)
    assert res["fonte"] == "mdt02" and res["crs"] == "EPSG:25829"
    assert res["resolucao_m"] == 2.0 and res["nodata_frac"] == 0.0
    assert "2.ª cobertura" in res["cobertura"] and "scne.es" in res["atribuicao"]
    assert res["tentativas"][0]["resultado"] == "sem folhas adequadas na pasta"   # regional
    with rasterio.open(res["tif"]) as s:
        assert s.crs.to_epsg() == 25829 and abs(s.res[0] - 2.0) < 1e-6
    cob = F.cobertura(F.quadrado_ha(lon, lat, 5), cfg)
    assert cob["fonte"] == "mdt02" and cob["cobertura"] == "total"


def test_folhas_noutro_fuso_sao_reprojectadas(tmp_path):
    """Parcela no fuso 30 servida por folhas que vêm no 29 (fronteira de fuso)."""
    cfg = _cfg(tmp_path)
    lon, lat = -5.98, 38.9
    x, y = Transformer.from_crs("EPSG:4326", "EPSG:25829", always_xy=True).transform(lon, lat)
    x0, y0 = (x // 2000) * 2000 - 4000, (y // 2000) * 2000 - 4000
    p = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    for i in range(5):
        for j in range(5):
            _folha_asc(p, f"PNOA_MDT02_HU29_{i}_{j}.asc", x0 + 2000 * i, y0 + 2000 * j)
    res = F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), str(tmp_path / "o"), cfg, log=lambda *a: None)
    assert res["crs"] == "EPSG:25830" and res["nodata_frac"] == 0.0


def test_so_5m_nao_da_base(tmp_path, monkeypatch):
    cfg = _cfg(tmp_path)
    monkeypatch.setattr(F, "pedir_bloco", lambda s, f, e, b, r, c: _tiff_bytes(e, b, r))
    with pytest.raises(F.SemLidar) as e:
        F.obter_mdt_es(F.quadrado_ha(-3.7, 40.4, 5), str(tmp_path / "o"), cfg, log=lambda *a: None)
    assert "não serve para a Base" in str(e.value)
    # para envolventes (bacias) o 5 m serve
    r = F.obter_mdt_es(F.quadrado_ha(-3.7, 40.4, 5), str(tmp_path / "o"), cfg, log=lambda *a: None,
                       so_base=False)
    assert r["fonte"] == "mdt05_wcs" and r["resolucao_m"] == 5.0


def test_folha_incompleta_passa_a_seguinte(tmp_path):
    """Pasta pnoa3 cobre só metade: cai para a mdt02, que cobre tudo."""
    cfg = _cfg(tmp_path)
    lon, lat = -3.3, 36.93
    x, y = Transformer.from_crs("EPSG:4326", "EPSG:25830", always_xy=True).transform(lon, lat)
    x0, y0 = (x // 2000) * 2000 - 2000, (y // 2000) * 2000 - 2000
    p3 = next(f for f in cfg.fontes if f.id == "pnoa3").pasta
    p2 = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    _folha_asc(p3, "MDT50CM-ETRS89-H30-1056-1-1-COB3-V1.asc", x - 2000, y - 1000, lado=2000, res=0.5)   # acaba em x
    for i in range(3):
        for j in range(3):
            _folha_asc(p2, f"MDT02_HU30_{i}{j}.asc", x0 + 2000 * i, y0 + 2000 * j)
    r = F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), str(tmp_path / "o"), cfg, log=lambda *a: None)
    assert r["fonte"] == "mdt02"
    assert any(t["fonte"] == "pnoa3" and t.get("nodata_frac", 0) > 0.3 for t in r["tentativas"])


def test_url_getcoverage():
    cfg = F.ler_config()
    w = next(f for f in cfg.fontes if f.tipo == "wcs")
    url, p = F.url_getcoverage(w, "25830", (400000, 4400000, 401000, 4401000), 5.0)
    assert ("coverageId", "Elevacion25830_5") in p and ("scaleSize", "x(200),y(200)") in p
