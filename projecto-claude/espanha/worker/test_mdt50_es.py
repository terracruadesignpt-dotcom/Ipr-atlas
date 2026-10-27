"""Testes de 21/10/2026: MDT50cm da 3.ª cobertura (COG com CRS) e WCS do IGN só em 25830."""
import os
import numpy as np
import rasterio
from rasterio.transform import from_origin
from pyproj import Transformer
import fonte_es as F
from test_fonte_es import _cfg


def _cog(pasta, nome, epsg, x0, y0, lado=1000, res=0.5, z=300.0):
    n = int(lado / res)
    a = (z + np.add.outer(np.arange(n), np.arange(n)) * 0.01).astype("float32")
    with rasterio.open(os.path.join(pasta, nome), "w", driver="GTiff", height=n, width=n, count=1, dtype="float32",
                       crs=f"EPSG:{epsg}", transform=from_origin(x0, y0 + lado, res, res), nodata=-9999.0,
                       tiled=True, blockxsize=256, blockysize=256, compress="deflate") as d:
        d.write(a, 1)


def test_mdt50_cog_serve_para_a_base(tmp_path):
    """Folhas COG com o nome do CNIG e CRS próprio: a Base sai do MDT50cm, a 0,5 m, com a atribuição oficial."""
    cfg = _cfg(tmp_path)
    lon, lat = -6.97, 38.88  # Badajoz (fuso 29)
    x, y = Transformer.from_crs("EPSG:4326", "EPSG:25829", always_xy=True).transform(lon, lat)
    p = next(f for f in cfg.fontes if f.id == "pnoa3").pasta
    for i in range(2):
        for j in range(2):
            _cog(p, f"MDT50CM-ETRS89-H29-0776-{i + 1}-{j + 1}-COB3-V1.tif", 25829, x - 1000 + 1000 * i, y - 1000 + 1000 * j)
    r = F.obter_mdt_es(F.quadrado_ha(lon, lat, 2), str(tmp_path / "o"), cfg, log=lambda *a: None)
    assert r["fonte"] == "pnoa3" and r["resolucao_fonte_m"] == 0.5 and r["crs"] == "EPSG:25829"
    assert "MDT50cm-cob3 2022-2025 CC-BY 4.0 scne.es" in r["atribuicao"]
    assert len(r["folhas"]) >= 1 and all(n.startswith("MDT50CM-ETRS89-H29-") for n in r["folhas"])


def test_wcs_pede_em_25830_quando_a_parcela_esta_noutro_fuso(tmp_path, monkeypatch):
    """O IGN só tem Elevacion25830_5 na Península: uma parcela no fuso 29 pede em 25830 e reprojecta."""
    cfg = _cfg(tmp_path)
    w = next(f for f in cfg.fontes if f.tipo == "wcs")
    assert F.epsg_servico(w, "25829") == "25830" and F.epsg_servico(w, "25831") == "25830" and F.epsg_servico(w, "4083") == "4083"
    pedidos = []

    def falso(sess, fonte, epsg, b, res, cfg_):
        pedidos.append((epsg, b))
        x0, y0, x1, y1 = b
        nx, ny = max(1, round((x1 - x0) / res)), max(1, round((y1 - y0) / res))
        from rasterio.io import MemoryFile
        with MemoryFile() as mf:
            with mf.open(driver="GTiff", height=ny, width=nx, count=1, dtype="float32", crs=f"EPSG:{epsg}",
                         transform=from_origin(x0, y1, res, res), nodata=-9999.0) as d:
                d.write(np.full((ny, nx), 412.0, dtype="float32"), 1)
            return mf.read()
    monkeypatch.setattr(F, "pedir_bloco", falso)
    lon, lat = -6.97, 38.88
    x, y = Transformer.from_crs("EPSG:4326", "EPSG:25829", always_xy=True).transform(lon, lat)
    bnds = (x - 500, y - 500, x + 500, y + 500)
    dest = str(tmp_path / "w.tif")
    F.montar_de_wcs(w, "25829", bnds, 5.0, cfg, dest)
    assert pedidos and all(e == "25830" for e, _ in pedidos)
    with rasterio.open(dest) as d:
        a = d.read(1)
        assert d.crs.to_epsg() == 25829 and abs(d.bounds.left - bnds[0]) < 1e-6 and abs(d.res[0] - 5.0) < 1e-9
        assert (a == -9999.0).mean() < 0.01 and abs(float(a[a != -9999.0].mean()) - 412.0) < 1e-3


def test_mdt05_nunca_e_base():
    cfg = F.ler_config()
    w = next(f for f in cfg.fontes if f.tipo == "wcs")
    assert w.base_permitida is False
