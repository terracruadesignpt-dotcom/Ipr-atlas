"""Testes dos adaptadores europeus, sem rede: folhas sintéticas em disco e HTTP falso."""

import copy
import json
import os
import re
from urllib.parse import parse_qs, urlparse

import numpy as np
import pytest
import rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
from shapely.geometry import box

import fontes_eu as eu

ND = eu.ND


def plano(epsg, x0, y0, x1, y1, res=1.0, z0=100.0, nodata_box=None):
    w, h = int(round((x1 - x0) / res)), int(round((y1 - y0) / res))
    tr = from_origin(x0, y1, res, res)
    xs = x0 + (np.arange(w) + 0.5) * res
    a = np.tile((z0 + 0.001 * (xs - x0)).astype("float32"), (h, 1))
    if nodata_box:
        c0, r0, c1, r1 = nodata_box
        a[r0:r1, c0:c1] = ND
    return a, tr


def gravar(caminho, epsg, bnds, res=1.0, **kw):
    a, tr = plano(epsg, *bnds, res=res, **kw)
    with rasterio.open(caminho, "w", driver="GTiff", height=a.shape[0], width=a.shape[1], count=1, dtype="float32",
                       crs=f"EPSG:{epsg}", transform=tr, nodata=ND) as d:
        d.write(a, 1)
    return caminho


def bytes_tif(epsg, bnds, res=1.0):
    a, tr = plano(epsg, *bnds, res=res)
    with MemoryFile() as m:
        with m.open(driver="GTiff", height=a.shape[0], width=a.shape[1], count=1, dtype="float32",
                    crs=f"EPSG:{epsg}", transform=tr, nodata=ND) as d:
            d.write(a, 1)
        return m.read()


class FakeHttp:
    def __init__(self, respostas):
        self.respostas, self.pedidos = respostas, []

    def get(self, url, params=None):
        self.pedidos.append((url, params))
        for padrao, resp in self.respostas:
            if re.search(padrao, url):
                return resp(url, params) if callable(resp) else resp
        raise eu.FonteIndisponivel(f"sem resposta para {url}")

    def head(self, url):
        return 200


def cfg_com(fonte: dict, tmp, **extra) -> eu.Config:
    eu.validar_fonte(fonte)
    base = {k: v for k, v in fonte.items() if k in eu._CAMPOS}
    base["extra"] = {k: v for k, v in fonte.items() if k not in eu._CAMPOS}
    c = eu.Config(fontes=[eu.Fonte(**base)], cache=str(tmp / "cache"))
    for k, v in extra.items():
        setattr(c, k, v)
    return c


def fonte_base(**kw):
    d = {"id": "t", "tipo": "cog_grid", "pais": "AT", "rotulo": "teste", "resolucao_m": 1.0,
         "cobertura_bbox": [9.5, 46.3, 17.2, 49.1], "epsg": "3035", "crs_tiles": "3035", "crs_processamento": "3035",
         "datum_vertical": "teste", "licenca": "CC BY 4.0", "atribuicao": "Fonte X ({anos})", "regras": {"vazios": "recusar"}}
    d.update(kw)
    return d


PONTO = (14.5, 47.3)  # Áustria


def bnds_parcela(epsg="3035", ha=5.0, buffer=250):
    g = eu.para_crs(eu.ler_geometria(eu.quadrado_ha(*PONTO, ha)), epsg)
    x0, y0, x1, y1 = g.buffer(buffer).bounds
    return x0, y0, x1, y1


# --- configuração ---------------------------------------------------------------------------

def test_config_real_valida_e_sem_modelos_globais():
    cfg = eu.ler_config()
    ids = {f.id for f in cfg.fontes}
    assert {"at_bev", "ch_swissalti3d", "nl_ahn_05m", "nl_hoogte_dtm", "lu_lidar2019", "gb_eng_ea", "no_dtm1",
            "fi_mml_2m", "pl_nmt_evrf2007", "cz_dmr5g", "de_by_dgm1", "de_nw_dgm1", "be_vl_dhmv2"} <= ids
    for f in cfg.fontes:
        assert f.resolucao_m <= 2.0, f.id
        if f.tipo not in ("externo", "alias"):
            assert f.atribuicao and f.licenca and f.datum_vertical and f.crs_processamento


def test_glo30_recusado_como_fonte():
    with pytest.raises(ValueError):
        eu.validar_fonte(fonte_base(id="copernicus_glo30", rotulo="Copernicus GLO-30"))


@pytest.mark.parametrize("lon,lat,esperada", [
    (16.37, 48.21, "at_bev"), (7.44, 46.95, "ch_swissalti3d"), (9.52, 47.15, "ch_swissalti3d"),
    (5.12, 52.09, "nl_ahn_05m"), (21.01, 52.23, "pl_nmt_evrf2007"), (-1.5, 52.4, "gb_eng_ea"),
    (-8.0, 37.5, "pt_dgt"), (-3.7, 40.4, "es_ign"), (11.58, 48.14, "de_by_dgm1"), (6.96, 50.94, "de_nw_dgm1")])
def test_candidata_principal(lon, lat, esperada):
    cfg = eu.ler_config()
    fs = eu.candidatas(box(lon - 1e-4, lat - 1e-4, lon + 1e-4, lat + 1e-4), cfg)
    assert fs and fs[0].id == esperada


def test_polonia_prefere_evrf2007_e_nl_prefere_05m():
    cfg = eu.ler_config()
    pl = [f.id for f in eu.candidatas(box(21, 52.2, 21.01, 52.21), cfg)]
    assert pl.index("pl_nmt_evrf2007") < pl.index("pl_nmt_kron86")
    nl = [f.id for f in eu.candidatas(box(5.1, 52.0, 5.11, 52.01), cfg)]
    assert nl[:2] == ["nl_ahn_05m", "nl_hoogte_dtm"]


def test_sem_fonte_e_sem_lidar(tmp_path):
    with pytest.raises(eu.SemLidar):
        eu.obter_mdt(eu.quadrado_ha(-21.9, 64.1, 5), str(tmp_path), eu.ler_config())  # Islândia


def test_portugal_e_externo(tmp_path):
    with pytest.raises(eu.FonteExterna):
        eu.obter_mdt(eu.quadrado_ha(-8.0, 37.5, 5), str(tmp_path), eu.ler_config())


# --- cog_grid -------------------------------------------------------------------------------

def test_urls_reais_cog_grid():
    cfg = eu.ler_config()
    at = eu.adaptador(cfg.fonte("at_bev"), cfg, FakeHttp([]))
    f = at.folhas(bnds_parcela())[0]
    m = re.fullmatch(r"https://data\.bev\.gv\.at/download/ALS/DTM/20250915/ALS_DTM_CRS3035RES50000mN(\d+)E(\d+)\.tif", f.url)
    assert m and int(m.group(1)) % 50000 == 0 and int(m.group(2)) % 50000 == 0, f.url
    nl = eu.adaptador(cfg.fonte("nl_hoogte_dtm"), cfg, FakeHttp([]))
    g = eu.para_crs(eu.ler_geometria(eu.quadrado_ha(5.34, 52.13, 5)), "28992").bounds
    urls = {x.url for x in nl.folhas(g)}
    assert "https://service.pdok.nl/rws/hoogte-nederland-land-dtm/atom/downloads/52.1_5.3.tif" in urls
    by = eu.adaptador(cfg.fonte("de_by_dgm1"), cfg, FakeHttp([]))
    g = eu.para_crs(eu.ler_geometria(eu.quadrado_ha(11.58, 48.14, 1)), "25832").bounds
    assert all(re.search(r"/\d{3}_\d{4}\.tif$", x.url) for x in by.folhas(g))


def _fonte_cog_local(tmp_path, t=500, epsg_proc="3035", **kw):
    pasta = tmp_path / "folhas"
    pasta.mkdir(exist_ok=True)
    return fonte_base(grelha={"tamanho": t, "origem_x": 0, "origem_y": 0}, crs_processamento=epsg_proc,
                      url_modelo=str(pasta / "{y}_{x}.tif"), ano="2023", **kw), pasta


def _criar_folhas(pasta, t=500, buraco=0):
    """Folhas de t metros à volta da parcela; `buraco` = lado (px) de um quadrado sem dado no centro da parcela."""
    x0, y0, x1, y1 = bnds_parcela()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for i in range(int(x0 // t) - 1, int(x1 // t) + 2):
        for j in range(int(y0 // t) - 1, int(y1 // t) + 2):
            nd = None
            if buraco and i * t <= cx < (i + 1) * t and j * t <= cy < (j + 1) * t:
                c, r = int(cx - i * t), int((j + 1) * t - cy)
                h = buraco // 2
                nd = (max(0, c - h), max(0, r - h), c + h, r + h)
            gravar(str(pasta / f"{j * t}_{i * t}.tif"), "3035", (i * t, j * t, (i + 1) * t, (j + 1) * t), nodata_box=nd)


def test_cog_grid_ponta_a_ponta_com_reprojeccao(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path, epsg_proc="31287")
    _criar_folhas(pasta)
    cfg = cfg_com(d, tmp_path)
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "out"), cfg, log=lambda *_: None)
    assert r["fonte"] == "t" and r["epsg"] == "31287" and r["vazios_frac"] == 0
    assert r["atribuicao"] == "Fonte X (2023)" and len(r["folhas"]) >= 1
    with rasterio.open(r["tif"]) as s:
        assert s.crs.to_epsg() == 31287 and s.res[0] == 1.0
        a = s.read(1)
        assert (a != ND).mean() > 0.99 and 99 < a[a != ND].min() < 101


def test_folha_em_falta_recusa(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path)
    _criar_folhas(pasta)
    x0, y0, x1, y1 = bnds_parcela()
    t = 500
    os.remove(pasta / f"{int((y0 + y1) / 2 // t) * t}_{int((x0 + x1) / 2 // t) * t}.tif")
    with pytest.raises(eu.SemLidar, match="sem dado"):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "out"), cfg_com(d, tmp_path), log=lambda *_: None)


def test_vazios_pequenos_preenchidos_so_com_regra(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path)
    _criar_folhas(pasta, buraco=40)  # 1600 px sem dado no meio da parcela
    with pytest.raises(eu.SemLidar):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o1"), cfg_com(d, tmp_path), log=lambda *_: None)
    d2 = dict(d, regras={"vazios": "preencher", "max_preencher_px": 2000})
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o2"), cfg_com(d2, tmp_path / "c2"), log=lambda *_: None)
    assert r["vazios_frac"] == 0


def test_cache_por_folha(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path)
    _criar_folhas(pasta)
    cfg = cfg_com(d, tmp_path)
    eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o1"), cfg, log=lambda *_: None)
    for f in pasta.iterdir():
        f.unlink()
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o2"), cfg, log=lambda *_: None)
    assert r["vazios_frac"] == 0


def test_resolucao_acima_de_2m_nao_e_base(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path, resolucao_m=5.0)
    with pytest.raises(eu.SemLidar, match="resolução"):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), log=lambda *_: None)


# --- STAC -----------------------------------------------------------------------------------

def test_stac_escolhe_05m_e_ano_mais_recente(tmp_path):
    x0, y0, x1, y1 = bnds_parcela("2056")
    t05 = gravar(str(tmp_path / "a_0.5_2056_5728.tif"), "2056", (x0 - 50, y0 - 50, x1 + 50, y1 + 50), res=0.5)
    t2 = gravar(str(tmp_path / "a_2_2056_5728.tif"), "2056", (x0 - 50, y0 - 50, x1 + 50, y1 + 50), res=2.0, z0=999)
    velho = gravar(str(tmp_path / "v_0.5_2056_5728.tif"), "2056", (x0 - 50, y0 - 50, x1 + 50, y1 + 50), res=0.5, z0=500)
    itens = {"features": [
        {"id": "t1", "bbox": [PONTO[0] - .1, PONTO[1] - .1, PONTO[0] + .1, PONTO[1] + .1],
         "properties": {"datetime": "2021-01-01T00:00:00Z"},
         "assets": {"a05": {"href": t05}, "a2": {"href": t2}}},
        {"id": "t1", "bbox": None, "properties": {"datetime": "2015-01-01T00:00:00Z"}, "assets": {"v": {"href": velho}}}],
        "links": []}
    d = fonte_base(id="ch", tipo="stac", epsg="2056", crs_processamento="2056", resolucao_m=0.5,
                   stac={"url": "https://stac.test", "coleccao": "c", "asset_regex": r"_0\.5_2056_5728\.tif$"},
                   atribuicao="© swisstopo ({anos})")
    http = FakeHttp([(r"stac\.test/collections/c/items", json.dumps(itens).encode())])
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)
    assert r["atribuicao"] == "© swisstopo (2021)" and r["resolucao_fonte_m"] == 0.5
    with rasterio.open(r["tif"]) as s:
        a = s.read(1)
        assert a[a != ND].max() < 200  # nem a de 2 m (999) nem a antiga (500)
    assert "bbox" in http.pedidos[0][1]


# --- WCS ------------------------------------------------------------------------------------

def _wcs_resp(epsg):
    def f(url, params):
        q = parse_qs(urlparse(url).query)
        xs = [s for s in q["subset"] if s[0] in "xE"][0]
        ys = [s for s in q["subset"] if s[0] in "yN"][0]
        x0, x1 = map(float, xs[xs.index("(") + 1:-1].split(","))
        y0, y1 = map(float, ys[ys.index("(") + 1:-1].split(","))
        return bytes_tif(epsg, (x0, y0, x1, y1))
    return f


def test_wcs_por_blocos_e_chave(tmp_path, monkeypatch):
    d = fonte_base(id="w", tipo="wcs", epsg="3035", crs_processamento="3035",
                   wcs={"url": "https://wcs.test/x", "coverage": "dtm", "eixos": ["E", "N"], "max_px": 300,
                        "chave_env": "TCD_TESTE_KEY", "chave_param": "api-key"})
    http = FakeHttp([(r"wcs\.test", _wcs_resp("3035"))])
    monkeypatch.delenv("TCD_TESTE_KEY", raising=False)
    with pytest.raises(eu.SemLidar, match="falta a chave"):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)
    monkeypatch.setenv("TCD_TESTE_KEY", "abc")
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)
    assert r["vazios_frac"] == 0 and len(http.pedidos) > 1
    assert all("api-key=abc" in u and "coverageId=dtm" in u for u, _ in http.pedidos)


def test_wcs_que_devolve_erro_xml(tmp_path):
    d = fonte_base(id="w", tipo="wcs", wcs={"url": "https://wcs.test/x", "coverage": "dtm"})
    http = FakeHttp([(r"wcs\.test", b"<ows:ExceptionReport/>")])
    with pytest.raises(eu.SemLidar, match="GeoTIFF"):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)


# --- tile_index -----------------------------------------------------------------------------

def test_indice_wfs(tmp_path):
    x0, y0, x1, y1 = bnds_parcela()
    t = gravar(str(tmp_path / "folha.tif"), "3035", (x0 - 10, y0 - 10, x1 + 10, y1 + 10))
    longe = gravar(str(tmp_path / "longe.tif"), "3035", (0, 0, 10, 10))
    fc = {"features": [
        {"geometry": {"type": "Polygon", "coordinates": [[[x0 - 10, y0 - 10], [x1 + 10, y0 - 10], [x1 + 10, y1 + 10], [x0 - 10, y1 + 10], [x0 - 10, y0 - 10]]]},
         "properties": {"url_do_pobrania": t, "rok_wykonania": "2019", "godlo": "N-34"}},
        {"geometry": {"type": "Polygon", "coordinates": [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]},
         "properties": {"url_do_pobrania": longe, "rok_wykonania": "2020", "godlo": "X"}}]}
    d = fonte_base(id="pl", tipo="tile_index", indice={"formato": "wfs", "url": "https://wfs.test", "typename": "a",
                                                       "campo_url": "url_do_pobrania", "campo_ano": "rok_wykonania", "campo_id": "godlo"})
    http = FakeHttp([(r"wfs\.test", json.dumps(fc).encode())])
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)
    assert [f["id"] for f in r["folhas"]] == ["N-34"] and r["anos"] == "2019"
    assert http.pedidos[0][1]["typeNames"] == "a" and http.pedidos[0][1]["outputFormat"] == "application/json"


def test_indice_lista_de_nomes_escolhe_ano_mais_recente(tmp_path):
    x0, y0, x1, y1 = bnds_parcela("25832")
    base = tmp_path / "nrw"
    base.mkdir()
    nomes = []
    for xk in range(int(x0 // 1000), int(x1 // 1000) + 1):
        for yk in range(int(y0 // 1000), int(y1 // 1000) + 1):
            for ano, z in (("2019", 500), ("2023", 100)):
                n = f"dgm1_32_{xk:03d}_{yk:04d}_1_nw_{ano}.tif"
                gravar(str(base / n), "25832", (xk * 1000, yk * 1000, xk * 1000 + 1000, yk * 1000 + 1000), z0=z)
                nomes.append(n)
    d = fonte_base(id="nw", tipo="tile_index", epsg="25832", crs_tiles="25832", crs_processamento="25832",
                   indice={"formato": "lista_nomes", "url": "https://nrw.test/index.json", "base": str(base) + "/",
                           "regex": r"dgm1_32_(?P<xk>\d{3})_(?P<yk>\d{4})_1_nw_(?P<ano>\d{4})\.tif", "tamanho": 1000})
    http = FakeHttp([(r"nrw\.test", json.dumps({"datasets": [{"files": [{"name": n} for n in nomes]}]}).encode())])
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=http, log=lambda *_: None)
    assert r["anos"] == "2023"
    with rasterio.open(r["tif"]) as s:
        a = s.read(1)
        assert a[a != ND].max() < 200


def test_indice_atom_com_bbox_lat_lon(tmp_path):
    x0, y0, x1, y1 = bnds_parcela("4258", buffer=0.01)
    t = gravar(str(tmp_path / "52.1_5.3.tif"), "4258", (x0, y0, x1, y1), res=0.00002)
    xml = f"""<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>x</title>
      <link href="{t}" type="image/tiff" bbox="{y0} {x0} {y1} {x1}"/>
      <link href="/longe/9.9_9.9.tif" type="image/tiff" bbox="9.9 9.9 10.0 10.0"/></entry></feed>""".encode()
    d = fonte_base(id="nl", tipo="tile_index", epsg="4258", crs_tiles="4258", crs_processamento="3035",
                   indice={"formato": "atom", "url": "https://atom.test", "bbox_ordem": "yxyx"})
    http = FakeHttp([(r"atom\.test", xml)])
    ad = eu.adaptador(cfg_com(d, tmp_path).fontes[0], cfg_com(d, tmp_path), http)
    fs = ad.folhas(eu.para_crs(eu.ler_geometria(eu.quadrado_ha(*PONTO, 5)), "3035").bounds)
    assert [f.url for f in fs] == [t]


# --- LAZ ------------------------------------------------------------------------------------

def test_laz_sem_rasterizador_nao_ha_base(tmp_path, monkeypatch):
    monkeypatch.setattr(eu, "rasterizador", lambda: "")
    d = fonte_base(id="cz", tipo="laz_tiles", indice={"formato": "atom", "url": "https://atom.test"})
    with pytest.raises(eu.SemLidar, match="sem PDAL"):
        eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), http=FakeHttp([]),
                     log=lambda *_: None)


# --- saída e diagnóstico --------------------------------------------------------------------

def test_reprojectar_so_a_saida(tmp_path):
    d, pasta = _fonte_cog_local(tmp_path)
    _criar_folhas(pasta)
    r = eu.obter_mdt(eu.quadrado_ha(*PONTO, 5), str(tmp_path / "o"), cfg_com(d, tmp_path), log=lambda *_: None)
    out = eu.reprojectar_saida(r["tif"], "4326", str(tmp_path / "o" / "wgs84.tif"))
    with rasterio.open(out) as s:
        assert s.crs.to_epsg() == 4326


def test_diagnostico_sem_rede():
    cfg = eu.ler_config()
    http = FakeHttp([(r".", b"<Capabilities/>")])
    linhas = eu.diagnostico(cfg, http=http)
    por_id = {l["fonte"]: l for l in linhas}
    assert por_id["fi_mml_2m"]["disponivel"] in (True, False)
    assert por_id["at_bev"]["sondas"] and por_id["at_bev"]["sondas"][0]["http"] == 200
    assert por_id["ch_swissalti3d"]["sondas"][0]["url"].endswith("/collections/ch.swisstopo.swissalti3d")
    assert por_id["pt_dgt"]["ok"] is None
