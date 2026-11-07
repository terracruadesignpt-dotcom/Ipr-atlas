/* IPR Atlas · camadas mundiais (Nuno, 24/10/2026: 22h54 «Mete Angola, camadas de qualidade»; 23h25 «para todos os países
   do mundo», com a mesma regra de níveis de Portugal: no Explorer ficam livres os limites, a imagem de satélite diária e as
   luzes nocturnas; ocupação do solo, água e solos são do Intelligence, como os grupos Água e Solo de Portugal).
   Um grupo «Mundo · fontes globais» na barra de camadas, em qualquer ponto do mapa. Fontes abertas, de cobertura mundial, testadas a 24/10 a partir de um navegador na origem
   terracruadesign.pt (resposta 200, imagem com conteúdo, CORS aberto). Os fundos de satélite (Sentinel-2 sem nuvens,
   Esri), o relevo e as camadas do OpenStreetMap do Atlas já cobrem Angola e não se repetem aqui.
   Fica de fora, por licença ou por falta de CORS: WDPA (uso comercial não permitido), Digital Earth Africa (sem CORS),
   ESA WorldCover pela Terrascope (servidor não responde do navegador). Não mexe no app.js: usa window.__ipe.mapa.
   7/11/2026 (Nuno, 20h48: «executa tudo, para o país todo e para a Europa toda, desde que não torne o site pesado»):
   cheias pelo radar Sentinel-1 (Copernicus EMS, GFM), humidade do solo na zona das raízes (SMAP) e o grupo «Europa ·
   Copernicus (10 m)» com as camadas de alta resolução do Copernicus Land (EEA): pastagens 2018 e mudança 2015-2018,
   sebes e pequenos bosquetes 2021 (densidade e linhas a 5 m), vegetação lenhosa 2021, perda e ganho de copa 2015-2018,
   água e zonas húmidas 2018; depois (21h07, «mais camadas do género»): CLC+ 2021 a 10 m, galerias ripícolas 2018,
   produtividade da vegetação 2000-2019 e tendência 2000-2016, rede EU-Hydro com Strahler, e o perigo meteorológico
   de incêndio (FWI) do EFFIS. Testadas a 7/11 da origem terracruadesign.pt (200, imagem com conteúdo, CORS aberto).
   Nada se descarrega enquanto a camada não for ligada. Ficam de fora por falta de CORS: Terrascope (VITO), European
   Drought Observatory; e o Google Earth Engine, por exigir licença comercial. */
(function () {
  "use strict";
  var EXPL = window.IPR_NIVEL === "explorer";
  var DIA = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10), GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/";
  function wms(base, camada) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + encodeURIComponent(camada) +
      "&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true";
  }
  function R(id, nome, url, min, max, op, attr, nota, intel) { return { id: id, nome: nome, url: url, min: min, max: max, op: op, attr: attr, nota: nota || "", intel: !!intel }; }
  function V(id, nome, nivel, cor, largura, attr) { return { id: id, nome: nome, vec: true, nivel: nivel, cor: cor, w: largura, attr: attr }; }
  var SG = function (mapa, camada) { return wms("https://maps.isric.org/mapserv?map=/map/" + mapa + ".map", camada); };
  var CLMS = "https://image.discomap.eea.europa.eu/arcgis/rest/services/GioLandPublic/";
  function HRL(svc) { return CLMS + svc + "/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image"; }
  var CLMS_A = "© União Europeia, Copernicus Land Monitoring Service (EEA)";
  var GFM = "https://geoserver.gfm.eodc.eu/geoserver/gfm/wms";
  var EEA = "https://image.discomap.eea.europa.eu/arcgis/rest/services/";
  function EIMG(pasta, svc) { return EEA + pasta + "/" + svc + "/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image"; }
  function EMAP(pasta, svc, cam) { return EEA + pasta + "/" + svc + "/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image" + (cam ? "&layers=show:" + cam : ""); }
  var EFFIS = "https://maps.effis.emergency.copernicus.eu/effis";
  var LULC = "https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image&time=1704067200000,1735689599000";
  var CAT = [
    ["Limites", [
      V("ao-prov", "Regiões e províncias", 4, "#f2e6c9", 1.6, "© OpenStreetMap"),
      V("ao-mun", "Municípios e concelhos", 6, "#e8dcc0", 0.8, "© OpenStreetMap")
    ]],
    ["Satélite", [
      R("mu-viirs", "Imagem de satélite do dia (" + DIA.split("-").reverse().join("/") + ")", GIBS + "VIIRS_SNPP_CorrectedReflectance_TrueColor/default/" + DIA + "/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg", 0, 9, 1,
        "Imagem: NASA EOSDIS GIBS (VIIRS)", "Imagem de há dois dias, a 375 m: nuvens, fumo, cheias e cor da vegetação neste momento."),
      R("mu-luzes", "Luzes nocturnas", GIBS + "VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png", 0, 8, 0.9,
        "Black Marble 2016: NASA Earth Observatory", "Povoamento e infra-estruturas vistos de noite.")
    ]],
    ["Relevo", [
      R("mu-aster", "Relevo a cores (altitude e sombra)", GIBS + "ASTER_GDEM_Color_Shaded_Relief/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpeg", 0, 12, 0.75,
        "ASTER GDEM: NASA e METI", "Altitude em cores, com sombra, a 30 m. Para ler serras, vales e planaltos de qualquer país.")
    ]],
    ["Clima e tempo", [
      R("mu-chuva", "Chuva · último dia", GIBS + "IMERG_Precipitation_Rate/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png", 0, 6, 0.7,
        "IMERG: NASA GPM, via GIBS", "Intensidade média da chuva no último dia disponível (satélites GPM, cerca de 10 km)."),
      R("mu-temp", "Temperatura do ar · último mês", GIBS + "MERRA2_2m_Air_Temperature_Monthly/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png", 0, 6, 0.6,
        "MERRA-2: NASA GMAO, via GIBS", "Média mensal a 2 m do solo, cerca de 50 km: dá o clima da região, não o do terreno."),
      R("mu-cheia", "Cheias · últimos 3 dias", GIBS + "MODIS_Combined_Flood_3-Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png", 0, 9, 0.85,
        "Cheias: NASA LANCE MODIS, via GIBS", "Água fora do sítio habitual detectada por satélite (cerca de 250 m)."),
      R("mu-cheia-s1", "Cheias · radar Sentinel-1 (20 m)", wms(GFM, "observed_flood_extent"), 5, 22, 0.85,
        "Global Flood Monitoring: © União Europeia, Copernicus Emergency Management Service", "Água de cheia vista pelo radar do Sentinel-1 na última passagem, mesmo com nuvens (20 m). Serve para confirmar onde a água se acumula de facto."),
      R("mu-humid", "Humidade do solo na zona das raízes", GIBS + "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png", 0, 6, 0.6,
        "SMAP L4: NASA, via GIBS", "Água no solo até cerca de 1 m de profundidade, no último dia disponível (9 km). Mostra a seca ou a saturação da região, não do terreno.", 1)
    ]],
    ["Vegetação e floresta", [
      R("mu-evi", "Vigor da vegetação · últimos 8 dias", GIBS + "MODIS_Terra_EVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png", 0, 9, 0.7,
        "EVI: NASA MODIS, via GIBS", "Índice de vegetação (EVI) a 250 m: verde mais escuro é vegetação mais activa."),
      R("mu-perda", "Perda de floresta 2001 a 2024", "https://tiles.globalforestwatch.org/umd_tree_cover_loss/latest/dynamic/{z}/{x}/{y}.png?start_year=2001&end_year=2024&tree_cover_density_threshold=30", 3, 12, 0.9,
        "Hansen/UMD/Google/USGS/NASA, via Global Forest Watch, CC BY 4.0", "Áreas onde o coberto arbóreo desapareceu, por ano (Landsat, 30 m).", 1),
      R("mu-altura", "Altura do coberto vegetal", GIBS + "GEDI_ISS_L3_Canopy_Height_Mean_RH100_201904-202108/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.75,
        "GEDI: NASA e Universidade de Maryland, via GIBS", "Altura média das árvores medida por laser a partir da estação espacial (1 km; entre 52°N e 52°S).", 1),
      R("mu-biomassa", "Biomassa aérea", GIBS + "GEDI_ISS_L4B_Aboveground_Biomass_Density_Mean_201904-202303/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.75,
        "GEDI L4B: NASA, via GIBS", "Toneladas de biomassa por hectare (1 km; entre 52°N e 52°S).", 1)
    ]],
    ["População", [
      R("mu-pop", "Densidade de população 2020", GIBS + "GPW_Population_Density_2020/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.7,
        "GPWv4: NASA SEDAC / CIESIN, CC BY 4.0", "Pessoas por km², a cerca de 1 km.")
    ]],
    ["Riscos naturais", [
      R("mu-rcheia", "Frequência de cheias", GIBS + "NDH_Flood_Hazard_Frequency_Distribution_1985-2003/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.7,
        "Natural Disaster Hotspots: NASA SEDAC / CIESIN, Banco Mundial", "Cheias registadas de 1985 a 2003, em classes.", 1),
      R("mu-rseca", "Frequência de secas", GIBS + "NDH_Drought_Hazard_Frequency_Distribution_1980-2000/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.7,
        "Natural Disaster Hotspots: NASA SEDAC / CIESIN, Banco Mundial", "Secas de 1980 a 2000, em classes.", 1),
      R("mu-rdesl", "Perigo de deslizamentos", GIBS + "NDH_Landslide_Hazard_Distribution_2000/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png", 0, 7, 0.7,
        "Natural Disaster Hotspots: NASA SEDAC / NGI, Banco Mundial", "Perigo de deslizamento de terras, em classes.", 1),
      R("mu-fwi", "Perigo meteorológico de incêndio (FWI) · previsão", wms(EFFIS, "mf010.fwi"), 0, 22, 0.6,
        "EFFIS: © União Europeia, Copernicus Emergency Management Service", "Índice canadiano de perigo de incêndio (FWI) previsto pelo EFFIS para hoje: junta temperatura, humidade, vento e secura dos combustíveis (cerca de 8 km).")
    ]],
    ["Europa · Copernicus (10 m)", [
      R("eu-past", "Pastagens permanentes 2018", HRL("HRL_Grassland_2018"), 6, 22, 0.7, CLMS_A,
        "Pastagens e prados que não foram lavrados (10 m, só Europa). Ajuda a separar pastagem permanente de terra mobilizada.", 1),
      R("eu-past-mud", "Pastagens · mudança 2015 a 2018", HRL("HRL_GrasslandChange_15_18"), 6, 22, 0.75, CLMS_A,
        "Onde a pastagem apareceu ou desapareceu entre 2015 e 2018 (só Europa): sinal de lavoura, abandono ou reconversão.", 1),
      R("eu-sebes", "Sebes e pequenos bosquetes · densidade 2021", HRL("HRL_SmallWoodyFeaturesDensity_2021_100m"), 6, 13, 0.7, CLMS_A,
        "Percentagem de sebes, alinhamentos de árvores e pequenos bosquetes por hectare (só Europa). Conectividade ecológica e quebra-ventos.", 1),
      R("eu-sebes5", "Sebes e pequenos bosquetes · linhas 2021 (5 m)", HRL("HRL_SmallWoodyFeatures_2021_005m"), 13, 22, 0.85, CLMS_A,
        "Cada sebe e pequeno bosquete desenhado a 5 m (só Europa). Aparece a partir do zoom 13.", 1),
      R("eu-lenhosa", "Vegetação lenhosa 2021", HRL("HRL_WoodyVegetationLayer_2021"), 6, 22, 0.7, CLMS_A,
        "Toda a vegetação lenhosa, árvores e arbustos, a 10 m (só Europa).", 1),
      R("eu-copa-mud", "Copa arbórea · perda e ganho 2015 a 2018", HRL("HRL_TreeCoverChangeMask_15_18"), 6, 22, 0.8, CLMS_A,
        "Onde o coberto arbóreo diminuiu ou aumentou entre 2015 e 2018 (só Europa): cortes, incêndios e regeneração.", 1),
      R("eu-humidas", "Água e zonas húmidas 2018", HRL("HRL_WaterWetness_2018"), 6, 22, 0.8, CLMS_A,
        "Água permanente e temporária e zonas húmidas, permanentes ou temporárias, a 10 m (só Europa). Charcas, lagoas temporárias e baixas encharcadas.", 1),
      R("eu-clcplus", "Ocupação do solo CLC+ 2021 (10 m)", EIMG("CLC_plus", "CLMS_CLCplus_RASTER_2021_010m_eu"), 6, 22, 0.65, CLMS_A,
        "Onze classes a 10 m (construído, árvores folhosas e resinosas, arbustos, herbáceas permanentes e periódicas, sem vegetação, água, neve), igual em toda a Europa.", 1),
      R("eu-ripar", "Galerias ripícolas 2018", EMAP("RiparianZones", "RZ_2018"), 8, 22, 0.75, CLMS_A,
        "Ocupação do solo das margens dos rios e ribeiras (zonas ripícolas, só Europa).", 1),
      R("eu-prod", "Produtividade da vegetação 2000 a 2019", EIMG("MR_VPP", "Large_integral_productivity_2000_2019"), 6, 22, 0.65, CLMS_A,
        "Produtividade anual média da vegetação, medida por satélite ao longo de 20 anos (só Europa).", 1),
      R("eu-tend", "Tendência da produtividade da terra 2000 a 2016", EIMG("Land_Productivity", "LINT_2000_2016_16B"), 6, 22, 0.65, CLMS_A,
        "Onde a produtividade da terra subiu, estagnou ou desceu entre 2000 e 2016: sinal de degradação ou de recuperação (só Europa).", 1),
      R("eu-hidro", "Rede hidrográfica EU-Hydro (ordem de Strahler)", EMAP("EUHydro", "EUHydro_RiverNetworkDatabase", "2,4"), 7, 22, 0.9, CLMS_A,
        "Rios, ribeiras e massas de água de toda a Europa, com a ordem de Strahler de cada troço.")
    ]],
    ["Ocupação do solo", [
      R("ao-lulc", "Ocupação do solo 10 m (Sentinel-2, 2024)", LULC, 4, 22, 0.65,
        "Ocupação do solo: Impact Observatory, Microsoft e Esri (Sentinel-2 10 m), CC BY 4.0",
        "Classes: água, árvores, vegetação inundada, culturas, área construída, solo nu, neve, nuvens, pastagem e mato.", 1)
    ]],
    ["Água", [
      R("ao-agua-oc", "Água superficial · frequência 1984 a 2021", "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png", 3, 22, 0.85,
        "Global Surface Water: EC JRC / Google (Pekel et al. 2016)", "Percentagem do tempo em que houve água em cada ponto (satélites Landsat).", 1),
      R("ao-agua-saz", "Água superficial · sazonalidade", "https://storage.googleapis.com/global-surface-water/tiles2021/seasonality/{z}/{x}/{y}.png", 3, 22, 0.85,
        "Global Surface Water: EC JRC / Google (Pekel et al. 2016)", "Número de meses por ano com água.", 1)
    ]],
    ["Solos (0 a 5 cm)", [
      R("ao-solo-c", "Carbono orgânico do solo", SG("soc", "soc_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Modelo mundial a 250 m: serve para comparar zonas, não substitui análise de solo.", 1),
      R("ao-solo-ph", "pH do solo (água)", SG("phh2o", "phh2o_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "", 1),
      R("ao-solo-arg", "Argila", SG("clay", "clay_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "", 1),
      R("mu-solo-areia", "Areia", SG("sand", "sand_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "", 1),
      R("mu-solo-n", "Azoto total", SG("nitrogen", "nitrogen_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "", 1)
    ]]
  ];
  function itens() { var r = []; CAT.forEach(function (g) { r = r.concat(g[1]); }); return r; }
  function itemPor(id) { var l = itens(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  var CHAVE = "tcd_atlas_mundo", ligados = {};
  try { ligados = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function antes(I) { var Ls = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < Ls.length; i++) if (/^tme-|^gl-draw|^tcd-terreno/.test(Ls[i].id)) return Ls[i].id; return undefined; }
  function ligar(it) {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (I.isStyleLoaded && !I.isStyleLoaded() && I.style && I.style._loaded === false) { I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(it); }, 0); }); return; }
    try {
      if (it.vec) {
        if (!I.getSource("ao-omt")) I.addSource("ao-omt", { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: "© OpenStreetMap · OpenFreeMap" });
        if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "line", source: "ao-omt", "source-layer": "boundary", minzoom: it.nivel === 6 ? 6 : 3,
          filter: ["all", ["==", ["get", "admin_level"], it.nivel], ["!=", ["get", "maritime"], 1]],
          layout: { "line-join": "round" }, paint: { "line-color": it.cor, "line-width": it.w, "line-opacity": 0.85, "line-dasharray": it.nivel === 6 ? ["literal", [3, 2]] : ["literal", [1, 0]] } }, antes(I));
        return;
      }
      if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.attr, minzoom: 0, maxzoom: it.max > 19 ? 19 : it.max });
      if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op } }, antes(I));
    } catch (e) { if (window.console) console.warn("[mundo-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    try { if (I.getLayer(it.id)) I.removeLayer(it.id); } catch (e) {}
    if (!it.vec) { try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {} }
  }
  var CSS = ".tao:not(.aberto)>*:not(h4){display:none}.tao h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tao h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tao.aberto h4::before{transform:rotate(90deg)}" +
    ".tao{padding:8px 10px;border-bottom:1px solid var(--ln,#ddd)}.tao h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tao label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tao label.bl{opacity:.6;cursor:default}.tao label i{display:block;font-style:normal;font-size:11.5px;color:var(--mu,#777)}" +
    ".tao small{display:block;margin-top:6px;font-size:11px;color:var(--mu,#777)}";
  function tranc(it) { return EXPL && it.intel; }
  function caixa(it) {
    if (tranc(it)) return '<label class="bl" title="Do IPR Atlas Intelligence"><input type="checkbox" disabled><span>' + it.nome + '<i>Intelligence</i></span></label>';
    return '<label><input type="checkbox" data-tao="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "><span>" + it.nome + (it.nota ? "<i>" + it.nota + "</i>" : "") + "</span></label>";
  }
  function preencher(d) {
    var h = "<h4>Mundo · fontes globais</h4>";
    CAT.forEach(function (g) { h += "<h5>" + g[0] + "</h5>"; g[1].forEach(function (it) { h += caixa(it); }); });
    h += "<small>Fontes abertas de cobertura mundial, para qualquer país. As de clima, cheias e vegetação actualizam-se sozinhas com a última data publicada. Os fundos de satélite, o relevo, o OpenStreetMap, a biodiversidade (GBIF) e a água e clima (NASA) do Atlas também cobrem o mundo. Informação indicativa: a referência vinculativa é a dos organismos de cada país.</small>";
    d.innerHTML = h;
  }
  function montar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (document.getElementById("tao")) return true;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("div"); d.id = "tao"; d.className = "tao ipr-g"; d.setAttribute("data-g", "ao"); d.hidden = true;
    cam.insertBefore(d, cam.firstChild); preencher(d);
    try { if (localStorage.getItem(CHAVE + "_ab") === "1") d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tao]"); if (!c) return;
      var it = itemPor(c.getAttribute("data-tao")); if (!it) return;
      if (c.checked) { ligados[it.id] = 1; ligar(it); } else { delete ligados[it.id]; desligar(it); }
      guardar();
    });
    return true;
  }
  function verificar() {
    var I = mapa(), d = document.getElementById("tao"); if (!I || !d || !I.getCenter) return;
    if (d.hidden) d.hidden = false;
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it && !tranc(it)) ligar(it); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa(); verificar(); repor();
    if (I.on) { I.on("moveend", verificar); I.on("styledata", function () { setTimeout(repor, 0); }); }
  }
  window.__tcdMundoCamadas = { CAT: CAT };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
