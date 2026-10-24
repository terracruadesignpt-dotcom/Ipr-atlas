/* IPR Atlas · camadas de Angola (pedido do Nuno, 24/10/2026, 22h54: «Mete Angola, camadas de qualidade»).
   Um grupo na barra de camadas que só aparece quando o centro do mapa está em Angola (caixa 11,4°E a 24,2°E, 4,3°S a
   18,1°S, com Cabinda). Fontes abertas, de cobertura mundial, testadas a 24/10 a partir de um navegador na origem
   terracruadesign.pt (resposta 200, imagem com conteúdo, CORS aberto). Os fundos de satélite (Sentinel-2 sem nuvens,
   Esri), o relevo e as camadas do OpenStreetMap do Atlas já cobrem Angola e não se repetem aqui.
   Fica de fora, por licença ou por falta de CORS: WDPA (uso comercial não permitido), Digital Earth Africa (sem CORS),
   ESA WorldCover pela Terrascope (servidor não responde do navegador). Não mexe no app.js: usa window.__ipe.mapa. */
(function () {
  "use strict";
  function emAngola(x, y) { return x >= 11.4 && x <= 24.2 && y >= -18.1 && y <= -4.3; }
  function wms(base, camada) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + encodeURIComponent(camada) +
      "&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true";
  }
  function R(id, nome, url, min, max, op, attr, nota) { return { id: id, nome: nome, url: url, min: min, max: max, op: op, attr: attr, nota: nota || "" }; }
  function V(id, nome, nivel, cor, largura, attr) { return { id: id, nome: nome, vec: true, nivel: nivel, cor: cor, w: largura, attr: attr }; }
  var SG = function (mapa, camada) { return wms("https://maps.isric.org/mapserv?map=/map/" + mapa + ".map", camada); };
  var LULC = "https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image&time=1704067200000,1735689599000";
  var CAT = [
    ["Limites", [
      V("ao-prov", "Províncias", 4, "#f2e6c9", 1.6, "© OpenStreetMap"),
      V("ao-mun", "Municípios", 6, "#e8dcc0", 0.8, "© OpenStreetMap")
    ]],
    ["Ocupação do solo", [
      R("ao-lulc", "Ocupação do solo 10 m (Sentinel-2, 2024)", LULC, 4, 22, 0.65,
        "Ocupação do solo: Impact Observatory, Microsoft e Esri (Sentinel-2 10 m), CC BY 4.0",
        "Classes: água, árvores, vegetação inundada, culturas, área construída, solo nu, neve, nuvens, pastagem e mato.")
    ]],
    ["Água", [
      R("ao-agua-oc", "Água superficial · frequência 1984 a 2021", "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png", 3, 22, 0.85,
        "Global Surface Water: EC JRC / Google (Pekel et al. 2016)", "Percentagem do tempo em que houve água em cada ponto (satélites Landsat)."),
      R("ao-agua-saz", "Água superficial · sazonalidade", "https://storage.googleapis.com/global-surface-water/tiles2021/seasonality/{z}/{x}/{y}.png", 3, 22, 0.85,
        "Global Surface Water: EC JRC / Google (Pekel et al. 2016)", "Número de meses por ano com água.")
    ]],
    ["Solos (0 a 5 cm)", [
      R("ao-solo-c", "Carbono orgânico do solo", SG("soc", "soc_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Modelo global a 250 m: serve para comparar zonas, não substitui análise de solo."),
      R("ao-solo-ph", "pH do solo (água)", SG("phh2o", "phh2o_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0"),
      R("ao-solo-arg", "Argila", SG("clay", "clay_0-5cm_mean"), 3, 22, 0.7, "SoilGrids 2.0 © ISRIC, CC BY 4.0")
    ]]
  ];
  function itens() { var r = []; CAT.forEach(function (g) { r = r.concat(g[1]); }); return r; }
  function itemPor(id) { var l = itens(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  var CHAVE = "tcd_atlas_ao", ligados = {};
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
      if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.attr, minzoom: 0, maxzoom: it.max > 19 ? 19 : it.max, bounds: [11.4, -18.1, 24.2, -4.3] });
      if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op } }, antes(I));
    } catch (e) { if (window.console) console.warn("[ao-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    try { if (I.getLayer(it.id)) I.removeLayer(it.id); } catch (e) {}
    if (!it.vec) { try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {} }
  }
  var CSS = ".tao:not(.aberto)>*:not(h4){display:none}.tao h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tao h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tao.aberto h4::before{transform:rotate(90deg)}" +
    ".tao{padding:8px 10px;border-bottom:1px solid var(--ln,#ddd)}.tao h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tao label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tao label i{display:block;font-style:normal;font-size:11.5px;color:var(--mu,#777)}" +
    ".tao small{display:block;margin-top:6px;font-size:11px;color:var(--mu,#777)}";
  function caixa(it) { return '<label><input type="checkbox" data-tao="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "><span>" + it.nome + (it.nota ? "<i>" + it.nota + "</i>" : "") + "</span></label>"; }
  function preencher(d) {
    var h = "<h4>Angola</h4>";
    CAT.forEach(function (g) { h += "<h5>" + g[0] + "</h5>"; g[1].forEach(function (it) { h += caixa(it); }); });
    h += "<small>Fontes abertas de cobertura mundial. Os fundos de satélite, o relevo e o OpenStreetMap do Atlas também cobrem Angola. Informação indicativa: a referência vinculativa é a dos organismos angolanos.</small>";
    d.innerHTML = h;
  }
  function montar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (document.getElementById("tao")) return true;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("div"); d.id = "tao"; d.className = "tao ipr-g"; d.setAttribute("data-g", "ao"); d.hidden = true;
    cam.insertBefore(d, cam.firstChild); preencher(d);
    try { if (localStorage.getItem(CHAVE + "_ab") !== "0") d.classList.add("aberto"); } catch (e) { d.classList.add("aberto"); }
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
    var c = I.getCenter(), vis = emAngola(c.lng, c.lat); if (d.hidden === vis) d.hidden = !vis;
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it) ligar(it); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa(); verificar(); repor();
    if (I.on) { I.on("moveend", verificar); I.on("styledata", function () { setTimeout(repor, 0); }); }
  }
  window.__tcdAoCamadas = { CAT: CAT, emAngola: emAngola };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
