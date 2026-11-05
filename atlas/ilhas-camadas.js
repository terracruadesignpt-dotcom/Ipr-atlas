/* IPR Atlas · camadas dos Açores e da Madeira, 3/11/2026. Só acrescenta; não mexe noutros ficheiros (mesmo modelo do
   edia-camadas.js). Pedido do Nuno (3/11, 13h53): «Avança com tudo para as ilhas, máxima qualidade como no continente».
   Só entram camadas com licença que permite uso comercial (levantamento em atlas/ilhas-fontes-2026-11-03.md no projecto):
   · Açores: relevo sombreado 1:1000 (SRAAC, «acesso e uso sem condições»), COS.A 2018 e 2007, Rede Natura 2000 e áreas
     protegidas (SRAAC, CC BY 4.0, metadados de 29/10/2026).
   · Madeira: COSRAM 2018 (DROTe, CC BY 4.0) e Rede Natura 2000 (Agência Europeia do Ambiente, CC BY 4.0).
   As camadas de licença não comercial (ortofotos, MDT 10 m, cadastro, cheias da Madeira) ficam de fora até haver
   autorização escrita (pedidos enviados a 3/11 à SRAAC e ao IFCN; DROTe e DRAM a seguir).
   4/11/2026: a SRAAC respondeu (IDEA, 4/11, 16h49) que os dados geográficos pedidos estão em CC BY 4.0, uso comercial sem
     autorização específica, com a atribuição «© SRAAC/GRA». Entram os habitats, os sítios protegidos, a Reserva da Biosfera,
     as zonas de risco de inundação (PGRIA), as zonas de protecção às captações e as zonas vulneráveis. Ortofotos, MDT de
     10 m e cadastro não estavam no pedido: continuam de fora. Cada camada ligada mostra a fonte e a legenda do serviço.
   Os GeoServer wssig3 e wssig4 dos Açores não aceitam pedidos de outros sítios (sem CORS): passam pelo Worker ipr-ilhas
   (Cloudflare, cache de 7 dias). O grupo só aparece quando o mapa está sobre um dos arquipélagos.
   5/11/2026: segunda resposta da IDEA (Marta Medeiros, 16h03). Entram, em CC BY 4.0 com «© SRAAC/GRA»: os ortofotomapas
     de 2024 das 9 ilhas (qgisserver do ambiente.azores.gov.pt, pelo relé) e os de 2004 a 2008 (wssig4, pelo relé); os
     planos especiais POOC (7 ilhas), POBHL (Flores, Pico, São Miguel) e POPPVIP (Paisagem da Vinha do Pico), planta de
     síntese de cada um. Ficam de fora: as ortoimagens de 2017/2018 (só para entidades do Governo dos Açores) e a
     cartografia cadastral (acesso restrito). O MDT do LiDAR de 2024 está em CC BY 4.0 no Centro de Dados da DGT e entra
     pelo worker da Base (adaptador dos Açores), não por aqui.
   Desligar: ?ilhas=0 ou localStorage ipr_ilhas_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ilhas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ilhas_off") === "1") return; } catch (e) {}
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var RELE = "https://ipr-ilhas.terracrua-ipr.workers.dev/";
  var CCBY = '<a href="https://creativecommons.org/licenses/by/4.0/deed.pt" target="_blank" rel="noopener">CC BY 4.0</a>';
  var A_SRAAC = "© SRAAC/GRA (Secretaria Regional do Ambiente e Ação Climática, Governo dos Açores) · " + CCBY;
  var A_RELEVO = "© SRAAC/GRA (relevo VRICON, 2012–2017) · " + CCBY;
  var A_DROTE = "© Direção Regional do Ordenamento do Território / Governo Regional da Madeira · " + CCBY;
  var A_AEA = "© Agência Europeia do Ambiente (Natura 2000) · " + CCBY;
  function wms(base, camada) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "service=WMS&version=1.3.0&request=GetMap&layers=" + encodeURIComponent(camada) +
      "&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true";
  }
  var COSA = "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/idea/public/cosa/cgi-bin/qgis_mapserv.fcgi";
  var AEA = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer/export" +
    "?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=png32&transparent=true&f=image";
  // Ilhas: limites [oeste, este, sul, norte] tirados das capacidades WMS dos ortofotomapas de 2024 (5/11/2026).
  var ILHAS = {
    cor: ["Corvo", [-31.175, -31.036, 39.663, 39.732]], flo: ["Flores", [-31.359, -31.019, 39.359, 39.544]],
    fai: ["Faial", [-28.86, -28.572, 38.506, 38.652]], pic: ["Pico", [-28.566, -28.008, 38.33, 38.614]],
    sjo: ["São Jorge", [-28.432, -27.638, 38.427, 38.864]], gra: ["Graciosa", [-28.11, -27.9, 39.002, 39.103]],
    ter: ["Terceira", [-27.442, -26.98, 38.601, 38.83]], smg: ["São Miguel", [-25.863, -25.127, 37.697, 37.915]],
    sma: ["Santa Maria", [-25.202, -24.996, 36.912, 37.039]]
  };
  function cx4(b) { return [b[0], b[2], b[1], b[3]]; }
  function wmsF(base, camada, fmt) { return wms(base, camada).replace("format=image/png", "format=" + encodeURIComponent(fmt)); }
  var A_ORTO24 = "© SRAAC/GRA · ortofotomapas de 2024 · " + CCBY;
  var A_ORTOV = "© SRAAC/GRA · ortofotomapas de 2004 a 2008 · " + CCBY;
  var ORTO24 = Object.keys(ILHAS).map(function (k) { return { url: wmsF(RELE + "ambiente.azores.gov.pt/qgisserver/" + k + "/orto2024/qgis_mapserv.fcgi", "ortofotomapa_2024_" + k, "image/webp"), cx: cx4(ILHAS[k][1]) }; });
  var ORTOV = [["smg", "ortofoto_2004_smg"], ["sma", "ortofoto_2005_sma"], ["pic", "ortofoto_2007_pic"], ["ter", "ortofoto_2004_ter"], ["fai", "ortofoto_2004_fai"],
    ["cor", "ortofoto_2008_cor"], ["flo", "ortoimagem_2004_flo"], ["gra", "ortofoto_2007_gra"], ["sjo", "ortofoto_2004_sjo"]].map(function (a) {
    return { url: wmsF(RELE + "wssig4.azores.gov.pt/geoserver/" + a[1] + "/wms", a[1], "image/jpeg"), cx: cx4(ILHAS[a[0]][1]) }; });
  var IDEA = "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/idea/public/";
  function plano(srv, camada, b) { return { url: wms(IDEA + srv + "/cgi-bin/qgis_mapserv.fcgi", camada), cx: cx4(b) }; }
  var POOC = [plano("pooc_cor", "planta_sintese", [-31.204, -30.997, 39.651, 39.748]), plano("pooc_flo", "planta_sintese_pooc_ps", [-31.415, -30.991, 39.35, 39.548]),
    plano("pooc_fai", "pooc_fai_ps", [-28.872, -28.56, 38.508, 38.655]), plano("pooc_pic", "pooc_pic_ps", [-28.57, -28.003, 38.316, 38.633]),
    plano("pooc_sjo", "pooc_sjo_ps", [-28.357, -27.721, 38.494, 38.797]), plano("pooc_gra", "pooc_gra_ps", [-28.137, -27.872, 38.995, 39.11])];
  var POBHL = [plano("pobhl_flo", "Planta de Síntese", [-31.406, -30.969, 39.35, 39.541]), plano("pobhl_pic", "Plano de Ordenamento das Bacias Hidrográficas (POBHLP)", [-28.562, -28.014, 38.352, 38.592]),
    plano("pobhl_smg", "pobhl_smg", [-26.116, -24.87, 37.528, 38.081])];
  var POPPVIP = [plano("poppvip", "plantasintese1alt_poppvip", [-28.561, -28.014, 38.323, 38.622])];
  var REG = {
    acores: { nome: "Açores", cx: [-31.6, 36.8, -24.8, 39.95] },
    madeira: { nome: "Madeira", cx: [-17.4, 32.3, -16.1, 33.2] }
  };
  var CAT = [
    { reg: "acores", sub: t("Açores · ortofotomapas", "Azores · orthophotos"), itens: [
      { id: "ilh-az-orto24", nome: t("Ortofotomapas de 2024 (9 ilhas)", "Orthophotos 2024 (9 islands)"), partes: ORTO24, op: 1, min: 9, at: A_ORTO24, fundo: 1 },
      { id: "ilh-az-ortov", nome: t("Ortofotomapas de 2004 a 2008 (histórico)", "Orthophotos 2004–2008 (historical)"), partes: ORTOV, op: 1, min: 9, at: A_ORTOV, fundo: 1 }
    ] },
    { reg: "acores", sub: t("Açores · planos especiais", "Azores · special plans"), itens: [
      { id: "ilh-az-pooc", nome: t("POOC · orla costeira, planta de síntese (6 ilhas)", "POOC · coastal plans, summary map (6 islands)"), partes: POOC, op: 0.75, min: 10, at: A_SRAAC },
      { id: "ilh-az-pobhl", nome: t("POBHL · bacias das lagoas (Flores, Pico, São Miguel)", "POBHL · lake basins (Flores, Pico, São Miguel)"), partes: POBHL, op: 0.75, min: 10, at: A_SRAAC },
      { id: "ilh-az-poppvip", nome: t("POPPVIP · Paisagem da Cultura da Vinha do Pico", "POPPVIP · Pico Vineyard Culture Landscape"), partes: POPPVIP, op: 0.75, min: 10, at: A_SRAAC }
    ] },
    { reg: "acores", sub: t("Açores · relevo e ocupação", "Azores · relief and land cover"), itens: [
      { id: "ilh-az-relevo", nome: t("Relevo sombreado 1:1000 (9 ilhas)", "Hillshade 1:1,000 (9 islands)"), url: wms(RELE + "wssig4.azores.gov.pt/geoserver/relevo/wms", "azo"), op: 0.75, min: 8, at: A_RELEVO },
      { id: "ilh-az-cosa18", nome: t("Ocupação do solo COS.A 2018 (nível 1)", "Land cover COS.A 2018 (level 1)"), url: wms(COSA, "cosa2018_n1"), op: 0.6, min: 9, at: A_SRAAC },
      { id: "ilh-az-cosa07", nome: t("Ocupação do solo COS.A 2007", "Land cover COS.A 2007"), url: wms(COSA, "cosa_2007"), op: 0.6, min: 9, at: A_SRAAC }
    ] },
    { reg: "acores", sub: t("Açores · conservação da natureza", "Azores · nature conservation"), itens: [
      { id: "ilh-az-n2000", nome: t("Rede Natura 2000 (ZEC e ZPE)", "Natura 2000 (SAC and SPA)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatura2000"), op: 0.7, min: 7, at: A_SRAAC },
      { id: "ilh-az-ap", nome: t("Áreas protegidas (parques naturais de ilha)", "Protected areas (island natural parks)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatureConservation"), op: 0.7, min: 7, at: A_SRAAC },
      { id: "ilh-az-sitios", nome: t("Sítios protegidos (todas as figuras)", "Protected sites (all designations)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSites"), op: 0.7, min: 7, at: A_SRAAC },
      { id: "ilh-az-biosfera", nome: t("Reservas da Biosfera", "Biosphere reserves"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesBiosphereReserve"), op: 0.6, min: 7, at: A_SRAAC },
      { id: "ilh-az-hab", nome: t("Habitats da Directiva (relatório 2013-2018)", "Habitats Directive (2013-2018 report)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/hbd/wms", "HBD.HabitatDistribution_2013_2018"), op: 0.7, min: 8, at: A_SRAAC },
      { id: "ilh-az-biotopos", nome: t("Biótopos Corine", "Corine biotopes"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/hb/wms", "HB.Habitat"), op: 0.6, min: 8, at: A_SRAAC }
    ] },
    { reg: "acores", sub: t("Açores · água e riscos", "Azores · water and hazards"), itens: [
      { id: "ilh-az-inund", nome: t("Zonas com risco de inundação (PGRIA)", "Flood risk zones (PGRIA)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/nz/wms", "NZ.RiskZone"), op: 0.7, min: 8, at: A_SRAAC },
      { id: "ilh-az-capt", nome: t("Zonas de protecção às captações de água", "Drinking water protection zones"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/am/wms", "AM.DrinkingWaterProtectionArea"), op: 0.7, min: 8, at: A_SRAAC },
      { id: "ilh-az-nitr", nome: t("Zonas vulneráveis a nitratos", "Nitrate vulnerable zones"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/am/wms", "AM.NitrateVulnerableZone"), op: 0.6, min: 7, at: A_SRAAC }
    ] },
    { reg: "madeira", sub: t("Madeira e Porto Santo", "Madeira and Porto Santo"), itens: [
      { id: "ilh-md-cosram", nome: t("Ocupação do solo COSRAM 2018", "Land cover COSRAM 2018"), url: wms("https://geoservices.madeira.gov.pt/geoserver/LC_COSRAM_2018/wms", "LC.LandCoverSurfaces"), op: 0.6, min: 9, at: A_DROTE },
      { id: "ilh-md-n2000", nome: t("Rede Natura 2000 (Agência Europeia do Ambiente)", "Natura 2000 (European Environment Agency)"), url: AEA, op: 0.7, min: 7, at: A_AEA }
    ] }
  ];
  // Legenda do próprio serviço (WMS GetLegendGraphic) para as camadas WMS; a Natura 2000 da AEA é ArcGIS (legenda simples).
  function legImg(it) {
    if (it.partes) { if (it.fundo) return ""; it = { id: it.id, url: it.partes[0].url }; }
    if (!/request=GetMap/.test(it.url) || /ilh-az-relevo/.test(it.id)) return "";
    var u = it.url.split("?")[0] + "?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&layer=" + encodeURIComponent((/layers=([^&]+)/.exec(it.url) || [])[1] ? decodeURIComponent(/layers=([^&]+)/.exec(it.url)[1]) : "");
    return '<img alt="" loading="lazy" src="' + u + '" onerror="this.remove()">';
  }
  var CHAVE = "tcd_atlas_ilhas";
  var ligados = {};
  try { ligados = JSON.parse(W.localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { W.localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return { it: CAT[g].itens[i], reg: CAT[g].reg }; return null; }
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno|^iprv-l_|^ipr-ter/.test(L[i].id)) return L[i].id; return undefined; }
  var falhas = {};
  function ligar(x) {
    var it = x.it, cx = REG[x.reg].cx, I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(x); }, 0); }); return; }
    var partes = it.partes ? it.partes.map(function (p, i) { return { id: it.id + "-" + i, url: p.url, cx: p.cx }; }) : [{ id: it.id, url: it.url, cx: cx }];
    var pos = antes(I);
    // Ortofotomapas por baixo das outras camadas das ilhas, para não as tapar
    if (it.fundo) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var j = 0; j < L.length; j++) if (/^ilh-/.test(L[j].id) && !/^ilh-az-orto/.test(L[j].id)) { pos = L[j].id; break; } }
    partes.forEach(function (p) {
      try {
        if (!I.getSource(p.id)) I.addSource(p.id, { type: "raster", tiles: [p.url], tileSize: 256, attribution: it.at, minzoom: 6, maxzoom: 20, bounds: p.cx });
        if (!I.getLayer(p.id)) I.addLayer({ id: p.id, type: "raster", source: p.id, minzoom: it.min, paint: { "raster-opacity": it.op, "raster-fade-duration": 150 } }, pos);
      } catch (e) { if (W.console) console.warn("[ilhas-camadas]", p.id, e && e.message); }
    });
  }
  function desligar(x) {
    var it = x.it, I = mapa(); if (!I || !I.getLayer) return;
    var ids = it.partes ? it.partes.map(function (p, i) { return it.id + "-" + i; }) : [it.id];
    ids.forEach(function (id) {
      try { if (I.getLayer(id)) I.removeLayer(id); } catch (e) {}
      try { if (I.getSource(id)) I.removeSource(id); } catch (e) {}
    });
  }
  var CSS = ".tilh:not(.aberto)>*:not(h4){display:none}.tilh h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tilh h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tilh.aberto h4::before{transform:rotate(90deg)}" +
    ".tilh h4 em{font:500 10.5px Inter,system-ui,sans-serif;font-style:normal;color:var(--mu,#777);margin-left:auto}" +
    ".tilh h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tilh label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tilh label input{margin-top:2px}" +
    ".tilh small{display:block;margin-top:6px;font-size:11px;line-height:1.4;color:var(--mu,#777)}.tilh small a{color:inherit}" +
    ".tilh .lg{display:block;margin:2px 0 6px 22px;font-size:10.5px;line-height:1.35;color:var(--mu,#777)}.tilh .lg img{display:block;max-width:100%;margin-top:3px;background:#fff;border-radius:3px;padding:2px}.tilh .lg[hidden]{display:none}" +
    ".tilh .av{display:none;margin-top:6px;font-size:11.5px;color:#b6432e}.tilh.falha .av{display:block}.tilh [data-reg][hidden]{display:none}";
  function montar() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("tilh")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("div"); d.id = "tilh"; d.className = "tilh ipr-g"; d.setAttribute("data-g", "ilhas"); d.hidden = true;
    var h = "<h4><span class=\"tilh-t\">" + t("Açores e Madeira", "Azores and Madeira") + "</span><em>" + t("dados regionais", "regional data") + "</em></h4>";
    CAT.forEach(function (g) {
      h += '<div data-reg="' + g.reg + '"><h5>' + g.sub + "</h5>";
      g.itens.forEach(function (it) { h += '<label><input type="checkbox" data-tilh="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> <span>" + it.nome + "</span></label>" + '<span class="lg" data-lg="' + it.id + '"' + (ligados[it.id] ? "" : " hidden") + ">" + t("Fonte: ", "Source: ") + it.at + legImg(it) + "</span>"; });
      h += "</div>";
    });
    h += '<p class="av" role="status">' + t("Um dos serviços regionais não respondeu. Tente mais tarde.", "One of the regional services did not respond. Please try later.") + "</p>";
    h += "<small>" + t("Dados dos governos regionais dos Açores e da Madeira e da Agência Europeia do Ambiente, com as licenças indicadas em cada mapa. As entidades não estão associadas ao IPR Atlas. Informação indicativa: não substitui a consulta às entidades. Os planos especiais mostram-se como informação; quem decide é a Câmara, pelo PIP.",
      "Data from the regional governments of the Azores and Madeira and the European Environment Agency, under the licences shown on each map. These bodies are not associated with IPR Atlas. Indicative information: it does not replace consulting the authorities.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (W.localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { W.localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tilh]"); if (!c) return;
      var x = itemPor(c.getAttribute("data-tilh")); if (!x) return;
      if (c.checked) { ligados[x.it.id] = 1; ligar(x); } else { delete ligados[x.it.id]; desligar(x); }
      var lg = d.querySelector('[data-lg="' + x.it.id + '"]'); if (lg) lg.hidden = !c.checked;
      guardar();
    });
    return true;
  }
  function regiao(c) { for (var k in REG) { var b = REG[k].cx; if (c.lng >= b[0] && c.lng <= b[2] && c.lat >= b[1] && c.lat <= b[3]) return k; } return null; }
  function verificar() {
    var I = mapa(), d = D.getElementById("tilh"); if (!I || !d || !I.getCenter) return;
    var r = regiao(I.getCenter());
    if (d.hidden === !!r) d.hidden = !r;
    if (r) {
      d.querySelectorAll("[data-reg]").forEach(function (n) { n.hidden = n.getAttribute("data-reg") !== r; });
      var tt = d.querySelector(".tilh-t"); if (tt) tt.textContent = REG[r].nome;
    }
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var x = itemPor(id); if (x) ligar(x); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor();
    if (I.on) {
      I.on("moveend", verificar);
      I.on("styledata", function () { setTimeout(repor, 0); });
      I.on("error", function (e) {
        var sid = e && (e.sourceId || (e.source && e.source.id)); if (!sid || !/^ilh-/.test(sid)) return;
        falhas[sid] = (falhas[sid] || 0) + 1;
        if (falhas[sid] === 6) { var d = D.getElementById("tilh"); if (d) d.classList.add("falha"); }
      });
    }
  }
  W.__tcdIlhasCamadas = { CAT: CAT, regiao: regiao };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
