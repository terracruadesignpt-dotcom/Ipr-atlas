/* IPR Atlas · camadas de Espanha (21/10/2026). Grupo próprio na barra de camadas, que só aparece quando o mapa está em
   Espanha. Todas as fontes foram verificadas a 21/10 a partir de um navegador (resposta 200 e CORS aberto):
   ortofoto PNOA e mapa IGN Base (WMTS do IGN), Catastro (WMS INSPIRE da DG del Catastro), recintos SIGPAC (MVT do FEGA),
   limites administrativos (WMS do IGN), Rede Natura 2000 (WMS da Agência Europeia do Ambiente; o WMS do MITECO estava
   com erro interno nesse dia), zonas inundáveis T10/T100/T500 (WMS do IDEE), pontos de água (WMS do IGME) e curvas de
   nível (WMS MDT do IDEE). Não mexe no app.js: usa window.__ipe.mapa. Textos em castelhano em /es (IPR_LANG). */
(function () {
  "use strict";
  var ES = (window.IPR_LANG === "es");
  function t(pt, es) { return ES ? es : pt; }
  var ANEL = [-8.79,42.62,-8.83,42.65,-8.86,42.6,-9.04,42.53,-9.09,42.6,-9.05,42.72,-8.98,42.78,-9.11,42.74,-9.15,42.9,-9.19,42.93,-9.27,42.87,-9.29,42.89,-9.3,43.06,-9.17,43.13,-9.23,43.14,-9.23,43.17,-8.97,43.24,-9.0,43.3,-8.83,43.36,-8.69,43.32,-8.39,43.4,-8.36,43.38,-8.33,43.43,-8.22,43.35,-8.2,43.4,-8.35,43.46,-8.33,43.58,-8.07,43.66,-8.07,43.73,-7.91,43.79,-7.83,43.72,-7.68,43.81,-7.61,43.72,-7.54,43.75,-7.36,43.7,-7.26,43.58,-7.04,43.58,-7.02,43.56,-6.07,43.59,-5.92,43.61,-5.85,43.68,-5.67,43.58,-5.42,43.58,-5.4,43.53,-5.3,43.56,-4.48,43.4,-3.77,43.5,-3.75,43.47,-3.58,43.54,-3.42,43.49,-3.46,43.43,-3.04,43.35,-3.04,43.39,-2.95,43.45,-2.77,43.47,-2.69,43.4,-2.66,43.43,-2.13,43.31,-1.79,43.41,-1.73,43.31,-1.39,43.26,-1.46,43.08,-1.45,43.06,-1.38,43.06,-1.36,43.11,-1.28,43.13,-1.28,43.08,-1.14,43.02,-0.75,42.96,-0.72,42.9,-0.57,42.79,-0.32,42.86,-0.23,42.81,-0.15,42.81,-0.11,42.73,-0.04,42.71,0.17,42.75,0.27,42.69,0.35,42.74,0.62,42.71,0.64,42.85,0.81,42.85,1.1,42.79,1.16,42.73,1.35,42.72,1.45,42.6,1.43,42.54,1.47,42.51,1.44,42.48,1.46,42.46,1.71,42.52,1.94,42.45,2.02,42.37,2.28,42.45,2.53,42.35,2.63,42.36,2.63,42.38,2.68,42.42,2.93,42.49,3.19,42.45,3.21,42.37,3.34,42.32,3.27,42.22,3.14,42.21,3.25,41.94,3.16,41.83,2.94,41.69,2.31,41.45,2.14,41.28,1.03,41.03,0.73,40.8,0.89,40.74,0.87,40.67,0.68,40.55,0.57,40.57,0.37,40.27,-0.08,39.83,-0.3,39.51,-0.28,39.33,-0.11,38.97,0.16,38.85,0.26,38.74,0.09,38.61,-0.03,38.59,-0.06,38.52,-0.32,38.45,-0.4,38.35,-0.49,38.32,-0.49,38.2,-0.61,38.15,-0.64,37.98,-0.7,37.93,-0.75,37.78,-0.79,37.79,-0.83,37.74,-0.69,37.63,-0.69,37.6,-0.92,37.54,-1.08,37.56,-1.11,37.51,-1.32,37.54,-1.49,37.41,-1.66,37.35,-1.79,37.2,-1.88,36.93,-1.98,36.88,-2.12,36.72,-2.37,36.82,-2.55,36.8,-2.6,36.71,-2.72,36.66,-2.94,36.73,-3.32,36.73,-3.41,36.68,-3.84,36.73,-4.39,36.7,-4.51,36.56,-4.65,36.49,-4.91,36.48,-5.16,36.4,-5.32,36.13,-5.41,36.15,-5.42,36.05,-5.61,35.99,-5.92,36.16,-6.05,36.18,-6.33,36.52,-6.31,36.55,-6.25,36.51,-6.3,36.59,-6.41,36.63,-6.46,36.75,-6.4,36.79,-6.51,36.94,-6.91,37.16,-7.1,37.2,-7.43,37.18,-7.53,37.6,-7.32,37.86,-7.29,37.99,-7.13,38.06,-7.04,38.04,-6.98,38.17,-7.12,38.16,-7.38,38.45,-7.29,38.62,-7.29,38.74,-7.07,38.87,-7.0,39.02,-7.03,39.08,-7.17,39.09,-7.19,39.16,-7.27,39.2,-7.27,39.26,-7.35,39.34,-7.33,39.45,-7.48,39.54,-7.58,39.69,-7.04,39.71,-6.91,40.01,-7.06,40.19,-6.82,40.36,-6.88,40.44,-6.84,40.51,-6.87,40.57,-6.84,40.85,-6.96,41.02,-6.83,41.07,-6.66,41.28,-6.5,41.31,-6.33,41.43,-6.23,41.56,-6.37,41.64,-6.56,41.64,-6.6,41.74,-6.55,41.86,-6.61,41.94,-6.73,41.91,-6.82,41.96,-6.85,41.92,-7.05,41.92,-7.15,41.96,-7.21,41.86,-7.44,41.79,-7.49,41.83,-7.61,41.81,-7.63,41.86,-7.72,41.88,-7.9,41.84,-7.92,41.88,-8.04,41.8,-8.19,41.79,-8.25,41.91,-8.13,42.03,-8.22,42.06,-8.24,42.13,-8.62,42.03,-8.89,41.87,-8.91,42.13,-8.72,42.29,-8.88,42.24,-8.85,42.35,-8.8,42.38,-8.96,42.47,-8.88,42.52,-8.84,42.5,-8.84,42.58,-8.79,42.62];
  function dentro(x, y) {
    var dentro = false, n = ANEL.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = ANEL[2 * i], yi = ANEL[2 * i + 1], xj = ANEL[2 * j], yj = ANEL[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi) dentro = !dentro;
    }
    return dentro || (x >= 1.1 && x <= 4.4 && y >= 38.6 && y <= 40.2); // Baleares
  }
  function wms(base, camada, extra) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + encodeURIComponent(camada) +
      "&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true" + (extra || "");
  }
  function wmts(base, camada, fmt) {
    return base + "?layer=" + camada + "&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=" +
      fmt + "&TileMatrix={z}&TileCol={x}&TileRow={y}";
  }
  var IGN = "CC BY 4.0 scne.es";
  var CAT = [
    { sub: t("Fundo", "Fondo"), itens: [
      { id: "es-pnoa", nome: t("Ortofoto PNOA (IGN)", "Ortofoto PNOA (IGN)"), tipo: "raster", url: wmts("https://www.ign.es/wmts/pnoa-ma", "OI.OrthoimageCoverage", "image/jpeg"), min: 0, max: 20, op: 1, attr: "PNOA " + IGN },
      { id: "es-ignbase", nome: t("Mapa IGN Base", "Mapa IGN Base"), tipo: "raster", url: wmts("https://www.ign.es/wmts/ign-base", "IGNBaseTodo", "image/png"), min: 0, max: 18, op: 1, attr: "IGN Base " + IGN }
    ] },
    { sub: t("Propriedade e limites", "Propiedad y límites"), itens: [
      { id: "es-catastro", nome: t("Cadastro (Catastro)", "Catastro (parcelas)"), tipo: "raster", url: wmws("https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx", "CP.CadastralParcel"), min: 15, max: 22, op: 0.9, attr: "Fuente: Dirección General del Catastro" },
      { id: "es-sigpac", nome: t("Recintos SIGPAC (uso agrícola)", "Recintos SIGPAC (uso agrícola)"), tipo: "sigpac", min: 13, max: 22, attr: "Fuente: SIGPAC - FEGA" },
      { id: "es-limites", nome: t("Limites administrativos", "Límites administrativos"), tipo: "raster", url: wms("https://www.ign.es/wms-inspire/unidades-administrativas", "AU.AdministrativeBoundary"), min: 6, max: 22, op: 0.9, attr: "Límites " + IGN }
    ] },
    { sub: t("Condicionantes", "Condicionantes"), itens: [
      { id: "es-natura", nome: t("Rede Natura 2000", "Red Natura 2000"), tipo: "raster", url: wms("https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WMSServer", "0,1,2"), min: 7, max: 22, op: 0.6, attr: "Natura 2000 © EEA" },
      { id: "es-inund10", nome: t("Zona inundável T10", "Zona inundable T10"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT10"), min: 9, max: 22, op: 0.6, attr: "SNCZI - MITECO" },
      { id: "es-inund100", nome: t("Zona inundável T100", "Zona inundable T100"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT100"), min: 9, max: 22, op: 0.6, attr: "SNCZI - MITECO" },
      { id: "es-inund500", nome: t("Zona inundável T500", "Zona inundable T500"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT500"), min: 9, max: 22, op: 0.5, attr: "SNCZI - MITECO" }
    ] },
    { sub: t("Água e relevo", "Agua y relieve"), itens: [
      { id: "es-pontosagua", nome: t("Pontos de água (IGME)", "Puntos de agua (IGME)"), tipo: "raster", url: wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_PuntosAgua/MapServer/WMSServer", "0,1"), min: 10, max: 22, op: 1, attr: "IGME-CSIC CC BY 4.0" },
      { id: "es-curvas", nome: t("Curvas de nível (IGN)", "Curvas de nivel (IGN)"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/mdt", "EL.ContourLine"), min: 13, max: 22, op: 0.9, attr: "MDT " + IGN }
    ] }
  ];
  function wmws(b, c) { return wms(b, c); }
  var CHAVE = "tcd_atlas_es";
  var ligados = {};
  try { ligados = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return CAT[g].itens[i]; return null; }
  var CORES = { TA: "#e0c36b", TH: "#e8d48a", PS: "#9bc46a", PR: "#b8d68c", PA: "#7fae55", FO: "#3f7d3a", OV: "#8a9a3c", VI: "#a0558a", FY: "#c48a4a", CI: "#e39d3a", IM: "#9a9a9a", ZU: "#c9c9c9", AG: "#6aa6d8", CA: "#bdbdbd" };
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno/.test(L[i].id)) return L[i].id; return undefined; }
  function ligar(it) {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(it); }, 0); }); return; } /* 22/10: o estilo basta; à espera de «idle» a camada só aparecia depois de todas as teselas */
    try {
      if (it.tipo === "sigpac") {
        if (!I.getSource(it.id)) I.addSource(it.id, { type: "vector", tiles: ["https://sigpac-hubcloud.es/mvt/recinto@3857@pbf/{z}/{x}/{y}.pbf"], minzoom: 13, maxzoom: 15, attribution: it.attr });
        var cor = ["match", ["get", "uso_sigpac"]]; Object.keys(CORES).forEach(function (k) { cor.push(k, CORES[k]); }); cor.push("#d6cfa8");
        if (!I.getLayer(it.id + "-f")) I.addLayer({ id: it.id + "-f", type: "fill", source: it.id, "source-layer": "recinto", minzoom: it.min, paint: { "fill-color": cor, "fill-opacity": 0.35 } }, antes(I));
        if (!I.getLayer(it.id + "-l")) I.addLayer({ id: it.id + "-l", type: "line", source: it.id, "source-layer": "recinto", minzoom: it.min, paint: { "line-color": "#6b5a2e", "line-width": 0.6 } }, antes(I));
      } else {
        if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.attr, minzoom: 0, maxzoom: it.max > 19 ? 19 : it.max });
        if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op } }, antes(I));
      }
    } catch (e) { if (window.console) console.warn("[es-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    [it.id, it.id + "-f", it.id + "-l"].forEach(function (l) { try { if (I.getLayer(l)) I.removeLayer(l); } catch (e) {} });
    try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {}
  }
  var CSS = ".tes:not(.aberto)>*:not(h4){display:none}.tes h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important}.tes h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tes.aberto h4::before{transform:rotate(90deg)}.tes.aberto h4{margin:0 0 6px!important}" + ".tes{margin:8px 0 4px;border:1px solid var(--ln2,#ddd);border-radius:8px;padding:8px 10px;background:var(--p2,transparent)}" +
    ".tes h4{margin:0 0 6px;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}.tes h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tes label{display:flex;gap:7px;align-items:center;font:13px Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tes small{display:block;margin-top:6px;font-size:11px;color:var(--mu,#777)}";
  function montar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (document.getElementById("tes")) return true;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("div"); d.id = "tes"; d.className = "tes ipr-g"; d.setAttribute("data-g", "es"); d.hidden = true;
    var h = "<h4>" + t("Espanha", "España") + "</h4>";
    CAT.forEach(function (g) {
      h += "<h5>" + g.sub + "</h5>";
      g.itens.forEach(function (it) { h += '<label><input type="checkbox" data-tes="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> " + it.nome + "</label>"; });
    });
    h += "<small>" + t("Fontes oficiais espanholas e europeias. Informação indicativa; a referência vinculativa é a publicada pelo organismo.", "Fuentes oficiales españolas y europeas. Información orientativa; la referencia vinculante es la publicada por cada organismo.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tes]"); if (!c) return;
      var it = itemPor(c.getAttribute("data-tes")); if (!it) return;
      if (c.checked) { ligados[it.id] = 1; ligar(it); } else { delete ligados[it.id]; desligar(it); }
      guardar();
    });
    return true;
  }
  function verificar() {
    var I = mapa(), d = document.getElementById("tes"); if (!I || !d || !I.getCenter) return;
    var c = I.getCenter(), em = dentro(c.lng, c.lat);
    if (d.hidden === em) d.hidden = !em;
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it) ligar(it); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor();
    if (I.on) { I.on("moveend", verificar); I.on("styledata", function () { setTimeout(repor, 0); }); }
  }
  window.__tcdEsCamadas = { dentro: dentro, CAT: CAT };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
