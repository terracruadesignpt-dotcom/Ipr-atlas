/* IPR Atlas · hipsometria à escala da vista (Nuno, 26/11/2026, 14h34: «quando vejo o país todo, quero ver os vermelhos da
   Serra da Estrela; quando me aproximo, quero ver a diferença de altimetria à escala do que estou a ver»).
   Quando a camada «Hipsometria (DGT)» (r_hipso) está ligada, a imagem da DGT dá lugar a um relevo colorido feito no browser
   a partir do MDE já usado no 3D (ipr-longe-dem). Até ao zoom 8 a escala é a do país (0 a 2 000 m); a partir daí, a escala
   vai do mínimo ao máximo da área à vista (percentis 2 e 98), recalculada sempre que o mapa pára. A legenda diz as cotas.
   Desligar: ?hipsoescala=0. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.__iprHipsoEscala || /[?&]hipsoescala=0/.test(location.search)) return;
  W.__iprHipsoEscala = 1;
  var ID = "ipr-hipso-escala", SRC = "ipr-longe-dem", WMS = /(^|-)r_hipso(-|$)/;
  var CORES = ["#3a7a3a", "#78a94e", "#c3d37a", "#efe3a0", "#e0b56b", "#c97b42", "#a8432e", "#7d2a24", "#f1ece4"];
  var PAIS = [0, 2000], esc = PAIS.slice(), ult = 0, legenda = null;
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function wmsLayers(I) { return ((I.getStyle() && I.getStyle().layers) || []).filter(function (l) { return WMS.test(l.id) && l.type === "raster"; }); }
  function ligada(I) { return wmsLayers(I).some(function (l) { return I.getLayoutProperty(l.id, "visibility") !== "none"; }); }
  function rampa(a, b) {
    if (b - a < 4) { var m = (a + b) / 2; a = m - 2; b = m + 2; }
    var e = ["interpolate", ["linear"], ["elevation"]], n = CORES.length - 1;
    CORES.forEach(function (c, i) { e.push(a + (b - a) * i / n, c); });
    return e;
  }
  function antes(I) { var L = I.getStyle().layers || []; for (var i = 0; i < L.length; i++) if (/^(iprv-s-label|iprv-o_|iprv-l_curvas|iprv-l_streams|iprv-s-aoi)/.test(L[i].id)) return L[i].id; return undefined; }
  function poeLegenda(on) {
    if (!on) { if (legenda) legenda.style.display = "none"; return; }
    if (!legenda) {
      legenda = D.createElement("div"); legenda.id = "ipr-hipso-leg";
      legenda.style.cssText = "position:absolute;right:12px;bottom:34px;z-index:5;font:11px/1.3 Inter,system-ui,sans-serif;color:#f1ece4;background:rgba(28,30,24,.82);border-radius:8px;padding:6px 8px;pointer-events:none";
      (mapa().getContainer() || D.body).appendChild(legenda);
    }
    legenda.style.display = "block";
    legenda.innerHTML = '<div style="height:8px;width:150px;border-radius:3px;background:linear-gradient(90deg,' + CORES.join(",") + ')"></div>' +
      '<div style="display:flex;justify-content:space-between;width:150px;margin-top:2px"><span>' + Math.round(esc[0]) + " m</span><span>" +
      (esc === PAIS || (esc[0] === PAIS[0] && esc[1] === PAIS[1]) ? "país" : "à vista") + "</span><span>" + Math.round(esc[1]) + " m</span></div>";
  }
  // Mínimo e máximo da vista, lidos dos mosaicos terrarium (até z12) que cobrem o ecrã.
  function lx(lng, z) { return (lng + 180) / 360 * Math.pow(2, z); }
  function ly(lat, z) { var r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z); }
  function intervalo(I, cb) {
    var s = I.getStyle().sources[SRC], u = s && s.tiles && s.tiles[0]; if (!u) { cb(null); return; }
    var b = I.getBounds(), z = Math.max(0, Math.min(12, Math.floor(I.getZoom()) - 1));
    var x0 = lx(b.getWest(), z), x1 = lx(b.getEast(), z), y0 = ly(b.getNorth(), z), y1 = ly(b.getSouth(), z);
    while ((Math.floor(x1) - Math.floor(x0) + 1) * (Math.floor(y1) - Math.floor(y0) + 1) > 9 && z > 0) { z--; x0 /= 2; x1 /= 2; y0 /= 2; y1 /= 2; }
    var vals = [], falta = 0, tiles = [];
    for (var tx = Math.floor(x0); tx <= Math.floor(x1); tx++) for (var ty = Math.floor(y0); ty <= Math.floor(y1); ty++) tiles.push([tx, ty]);
    falta = tiles.length; if (!falta) { cb(null); return; }
    tiles.forEach(function (t) {
      var img = new Image(); img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          var c = D.createElement("canvas"); c.width = img.width; c.height = img.height;
          var g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
          var d = g.getImageData(0, 0, c.width, c.height).data, n = c.width;
          var ax = Math.max(0, Math.floor((x0 - t[0]) * n)), bx = Math.min(n, Math.ceil((x1 - t[0]) * n));
          var ay = Math.max(0, Math.floor((y0 - t[1]) * n)), by = Math.min(n, Math.ceil((y1 - t[1]) * n));
          var passo = Math.max(1, Math.floor(Math.sqrt(((bx - ax) * (by - ay)) / 4000)));
          for (var py = ay; py < by; py += passo) for (var px = ax; px < bx; px += passo) {
            var k = (py * n + px) * 4, h = d[k] * 256 + d[k + 1] + d[k + 2] / 256 - 32768;
            if (h > -50 && h < 3000) vals.push(h);
          }
        } catch (e) {}
        if (--falta === 0) fim();
      };
      img.onerror = function () { if (--falta === 0) fim(); };
      img.src = u.replace("{z}", z).replace("{x}", t[0]).replace("{y}", t[1]);
    });
    function fim() {
      if (vals.length < 20) { cb(null); return; }
      vals.sort(function (a, b) { return a - b; });
      cb([vals[Math.floor(vals.length * 0.02)], vals[Math.floor(vals.length * 0.98)]]);
    }
  }
  function aplicar() {
    var I = mapa(); if (!I || !I.getStyle || !I.getStyle()) return;
    var on = ligada(I) && !!I.getSource(SRC);
    wmsLayers(I).forEach(function (l) { try { I.setPaintProperty(l.id, "raster-opacity", on ? 0 : 0.7); } catch (e) {} });
    if (!on) { if (I.getLayer(ID)) I.setLayoutProperty(ID, "visibility", "none"); poeLegenda(false); return; }
    if (!I.getLayer(ID)) {
      try { I.addLayer({ id: ID, type: "color-relief", source: SRC, paint: { "color-relief-opacity": 0.62, "color-relief-color": rampa(PAIS[0], PAIS[1]) } }, antes(I)); }
      catch (e) { wmsLayers(I).forEach(function (l) { try { I.setPaintProperty(l.id, "raster-opacity", 0.7); } catch (x) {} }); return; }
    }
    I.setLayoutProperty(ID, "visibility", "visible");
    var pedido = ++ult;
    if (I.getZoom() < 8) { esc = PAIS.slice(); I.setPaintProperty(ID, "color-relief-color", rampa(PAIS[0], PAIS[1])); poeLegenda(true); return; }
    intervalo(I, function (r) {
      if (pedido !== ult || !r) return;
      esc = r; try { I.setPaintProperty(ID, "color-relief-color", rampa(r[0], r[1])); } catch (e) {}
      poeLegenda(true);
    });
  }
  var preso = false, ultimo = 0, estava = null;
  setInterval(function () {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (!preso) { preso = true; I.on("moveend", function () { if (I.getLayer(ID) && I.getLayoutProperty(ID, "visibility") !== "none") aplicar(); }); }
    var agora = ligada(I);
    if (agora !== estava || (agora && !I.getLayer(ID))) { estava = agora; var t = Date.now(); if (t - ultimo > 400) { ultimo = t; aplicar(); } }
  }, 500);
  W.__iprHipsoEscalaAplicar = aplicar;
})();
