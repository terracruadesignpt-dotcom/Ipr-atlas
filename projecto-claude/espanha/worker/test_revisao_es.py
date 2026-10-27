"""Testes da revisão independente de 20/10/2026 (defeitos encontrados e corrigidos)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, pytest, rasterio
from pyproj import Transformer
import fonte_es as F
from test_fonte_es import _folha_asc, _cfg  # reutiliza utilitários, sem os alterar


def _xy(lon, lat, epsg):
    return Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True).transform(lon, lat)


def test_folha_5m_na_pasta_mdt02_nao_pode_dar_base(tmp_path):
    """Regra «Base exige MDT ≤2 m»: o código confia em resolucao_m do JSON e ignora a
    resolução real da folha (guardada no índice). Uma folha MDT05 posta à mão na pasta
    mdt02 (modo «a pedido») sai como Base a 2 m."""
    cfg = _cfg(tmp_path); lon, lat = -6.97, 38.78
    x, y = _xy(lon, lat, 25829)
    p = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    _folha_asc(p, "PNOA_MDT05_ETRS89_HU29_0001_LID.asc", x - 5000, y - 5000, lado=10000, res=5.0)
    with pytest.raises(F.SemLidar):
        F.obter_mdt_es(F.quadrado_ha(lon, lat, 5), str(tmp_path / "o"), cfg, log=lambda *a: None)


def test_buraco_no_buffer_e_detectado(tmp_path):
    """fraccao_nodata só mede dentro do polígono; falta de folha no buffer passa."""
    cfg = _cfg(tmp_path); lon, lat = -6.97, 38.78
    x, y = _xy(lon, lat, 25829)
    p = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    # uma única folha 2x2 km centrada na parcela; buffer de 100 m cabe, mas cortamos a leste
    _folha_asc(p, "A_HU29.asc", x - 1000, y - 1000, lado=2000)
    _folha_asc(p, "B_HU29.asc", x - 1000, y - 1000 - 2000, lado=2000)  # sul; leste fica sem nada
    q = F.quadrado_ha(lon, lat, 300)  # ~1,73 km de lado: buffer sai da folha a leste
    with pytest.raises(F.SemLidar):
        F.obter_mdt_es(q, str(tmp_path / "o"), cfg, log=lambda *a: None)


def test_cobertura_escolhe_fonte_total_e_nao_a_primeira_parcial(tmp_path):
    cfg = _cfg(tmp_path); lon, lat = -3.3, 36.93
    x, y = _xy(lon, lat, 25830)
    p3 = next(f for f in cfg.fontes if f.id == "pnoa3").pasta
    p2 = next(f for f in cfg.fontes if f.id == "mdt02").pasta
    _folha_asc(p3, "P3_HU30.asc", x - 2000, y - 1000, lado=2000, res=1.0)
    _folha_asc(p2, "M2_HU30.asc", x - 3000, y - 3000, lado=6000)
    c = F.cobertura(F.quadrado_ha(lon, lat, 5), cfg)
    assert c["cobertura"] == "total", c


def test_fuso_invalido_no_nome_nao_derruba_o_indice(tmp_path):
    cfg = _cfg(tmp_path)
    p = next(f for f in cfg.fontes if f.id == "mdt02")
    _folha_asc(p.pasta, "lixo_HU99.asc", 0, 0, lado=20)
    F.indice_pasta(p)  # CRSError não é RasterioIOError


def test_cache_do_indice_nao_reflecte_mudanca_de_config(tmp_path):
    """Índice guardado com epsg da 1.ª leitura; mudar regex/crs_omissao não reindexa."""
    cfg = _cfg(tmp_path)
    p = next(f for f in cfg.fontes if f.id == "mdt02")
    _folha_asc(p.pasta, "sem_fuso.asc", 500000, 4300000, lado=20)
    p.crs_omissao = "25829"; a = F.indice_pasta(p)
    p.crs_omissao = "25830"; b = F.indice_pasta(p)
    assert a[0]["epsg"] != b[0]["epsg"]
