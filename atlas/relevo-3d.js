/* IPR Atlas · relevo-3d.js (3/11/2026). Pedido do Nuno, 09h16: «nas fichas de projectos, na ficha de propriedade, o 3D
   que apresentamos aos clientes, de cada base cartográfica, eu quero que seja assim, neste estilo» (vídeos «IPR relevo»
   do Zêzere e do Douro). A vista 3D das fichas (ajustes.js §59, contentor .ipr-3d-c) passa a abrir com o mesmo estilo dos
   vídeos: cor por altitude, sombreado, céu com névoa e exagero vertical 1,6×. A cor estica-se entre a cota mais baixa e a
   mais alta à volta do terreno, para se ler o relevo mesmo em terrenos planos. A imagem de satélite continua a um botão.
   Não edita o ajustes.js: embrulha o construtor do mapa e só mexe nos mapas criados dentro de .ipr-3d-c.
   Desligar: window.IPR_RELEVO3D_OFF = true, ou ?relevo3d=0 no endereço. */
(function () {
  "use strict";
  if (window.IPR_RELEVO3D_OFF || /[?&]relevo3d=0\b/.test(location.search)) return;
  var EX = 1.6;
  var CORES = [[0, "#2f5b3c"], [0.12, "#3f6e43"], [0.25, "#5f8a4a"], [0.4, "#97a35a"], [0.52, "#c7b46a"], [0.64, "#d8a861"], [0.76, "#c58650"], [0.88, "#a8623f"], [1, "#8a4f3a"]];
  function rampa(a, b) {
    var r = ["interpolate", ["linear"], ["elevation"]];
    CORES.forEach(function (c) { r.push(a + (b - a) * c[0], c[1]); });
    return r;
  }
  function estilo(o) {
    var s = o.style, dem = s.sources.dem;
    // O sombreado e a cor precisam de uma fonte própria com outro endereço (com o mesmo endereço do terreno não chegam a
    // carregar); usa-se o Worker de relevo do IPR, que serve os mesmos dados da Mapterhorn (o mesmo dos vídeos).
    var shT = (dem.tiles || []).map(function (u) { return /tiles\.mapterhorn\.com/.test(u) ? location.origin + "/ipr-relevo/{z}/{x}/{y}.webp" : u + (u.indexOf("?") < 0 ? "?sh" : "&sh"); });
    s.sources.sh = { type: "raster-dem", tiles: shT, encoding: dem.encoding || "terrarium", tileSize: dem.tileSize || 512, maxzoom: dem.maxzoom || 15 };
    var novas = [
      { id: "r3-fundo", type: "background", paint: { "background-color": "#c7b46a" } },
      { id: "r3-cor", type: "color-relief", source: "sh", paint: { "color-relief-opacity": 1, "color-relief-color": rampa(0, 600) } },
      { id: "r3-sombra", type: "hillshade", source: "sh", paint: { "hillshade-exaggeration": 0.55, "hillshade-shadow-color": "#0e120b", "hillshade-highlight-color": "#fff6dc", "hillshade-accent-color": "#2a2a1e", "hillshade-illumination-direction": 315, "hillshade-illumination-anchor": "map" } }
    ];
    var L = [];
    s.layers.forEach(function (l) {
      if (l.id === "sat") { l.layout = Object.assign({}, l.layout, { visibility: "none" }); L.push(l); novas.forEach(function (n) { L.push(n); }); }
      else L.push(l);
    });
    if (L.length === s.layers.length) L = novas.concat(s.layers);
    s.layers = L;
    s.sky = { "sky-color": "#33414c", "horizon-color": "#b9b39a", "fog-color": "#4a4a3c", "sky-horizon-blend": 0.5, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.25 };
    s.terrain = { source: "dem", exaggeration: EX };
  }
  function depois(m, C) {
    var feito = false;
    function cotas() {
      if (feito) return;
      try {
        var tx = (m.getTerrain && m.getTerrain() && m.getTerrain().exaggeration) || 1, b = m.getBounds(), w = b.getWest(), e = b.getEast(), so = b.getSouth(), n = b.getNorth(), lo = Infinity, hi = -Infinity, k = 0;
        for (var i = 0; i <= 12; i++) for (var j = 0; j <= 12; j++) {
          var h = m.queryTerrainElevation([w + (e - w) * i / 12, so + (n - so) * j / 12]); if (h != null) h = h / tx; // devolve a cota já exagerada
          if (h != null && isFinite(h)) { lo = Math.min(lo, h); hi = Math.max(hi, h); k++; }
        }
        if (k < 20) return;
        feito = true;
        if (hi - lo < 30) { var c = (hi + lo) / 2; lo = c - 15; hi = c + 15; }
        var pad = (hi - lo) * 0.05;
        m.setPaintProperty("r3-cor", "color-relief-color", rampa(lo - pad, hi + pad));
      } catch (x) {}
    }
    m.on("idle", cotas);
    // Se o Worker de relevo falhar, a cor e o sombreado passam a ler directamente da Mapterhorn (com outro endereço).
    var trocou = false;
    m.on("error", function (ev) {
      if (trocou || !ev || ev.sourceId !== "sh") return; trocou = true;
      try { var d = m.getStyle().sources.dem.tiles || []; m.getSource("sh").setTiles(d.map(function (u) { return u + (u.indexOf("?") < 0 ? "?sh" : "&sh"); })); } catch (x) {}
    });
    m.on("load", function () {
      var raiz = C.closest(".ipr-3d-c"); if (!raiz) return;
      var bar = raiz.querySelector(".b"), S = raiz.querySelector(".s");
      var bex = bar && bar.querySelector('[data-v="ex"]'); if (bex) bex.textContent = "1,6×";
      if (bar && !bar.querySelector('[data-v="r3"]')) {
        var t = document.createElement("button"); t.type = "button"; t.dataset.v = "r3"; t.title = "Mudar entre relevo e imagem de satélite"; t.textContent = "Satélite";
        t.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var sat = m.getLayoutProperty("sat", "visibility") !== "none";
          m.setLayoutProperty("sat", "visibility", sat ? "none" : "visible");
          ["r3-fundo", "r3-cor", "r3-sombra"].forEach(function (id) { m.setLayoutProperty(id, "visibility", sat ? "visible" : "none"); });
          t.textContent = sat ? "Satélite" : "Relevo";
        });
        bar.insertBefore(t, bar.firstChild);
      }
      setTimeout(function () { if (S) S.textContent = "Relevo: Mapterhorn (LiDAR DGT 0,5 m onde existe; Copernicus GLO-30 no resto) · cor pela altitude do terreno, com sombreado · exagero vertical 1,6× (só para leitura; as cotas e medições usam a escala real). Arraste para rodar e inclinar; roda do rato para aproximar."; }, 50);
    });
  }
  function embrulhar() {
    var gl = window.maplibregl; if (!gl || !gl.Map || gl.Map.__iprR3) return !!(gl && gl.Map && gl.Map.__iprR3);
    var M0 = gl.Map;
    var M = function (o) {
      var C = o && o.container, alvo = null;
      try {
        if (C && C.nodeType === 1 && C.closest && C.closest(".ipr-3d-c") && o.style && o.style.sources && o.style.sources.dem && o.style.layers) { estilo(o); alvo = C; }
      } catch (x) { alvo = null; }
      var m = new M0(o);
      if (alvo) { try { depois(m, alvo); } catch (x) {} }
      return m;
    };
    M.prototype = M0.prototype;
    try { Object.setPrototypeOf(M, M0); } catch (x) {}
    M.__iprR3 = true;
    gl.Map = M;
    return true;
  }
  if (!embrulhar()) { var n = 0, iv = setInterval(function () { if (embrulhar() || ++n > 100) clearInterval(iv); }, 100); }
})();
