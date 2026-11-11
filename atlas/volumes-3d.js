/* IPR Atlas · volumes-3d.js (11/11/2026). Pedido do Nuno, 00h30: «Era fixe também termos os volumes de árvores e edifícios
   no Atlas, e trazia a tridimensionalidade à vista 3D». Caixa às 00h4x: árvores das duas fontes (mapa global agora; LiDAR
   da Base quando houver acesso ao servidor).
   Quando o mapa está inclinado (vista 3D, mais de 20°) e perto do chão:
   1. Edifícios em volume: camada «building» dos mosaicos OpenFreeMap (OpenStreetMap), com a altura registada
      (render_height) ou 6 m quando não há.
   2. Árvores em volume: altura da copa do mapa global Meta CHM v2 (Meta / Data for Good, Taylor Geospatial; CC BY 4.0;
      píxel de 1,2 m, imagens de 2005 a 2020), lido directamente dos COG em data.source.coop (CORS aberto), em células de
      cerca de 5 m. Só as copas com 2 m ou mais.
   Funciona no mapa principal e nas vistas 3D das fichas. Não muda o desenho em vista de cima.
   Mais tarde: altura das árvores medida no LiDAR da DGT de cada Base (MDS menos MDT), quando o worker tiver acesso.
   Desligar: window.IPR_VOL3D_OFF = true, ?vol3d=0 ou localStorage ipr_vol3d = 0. Propriedade de IPR, Lda. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (W.IPR_VOL3D_OFF || /[?&]vol3d=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_vol3d") === "0") return; } catch (e) {}
  if (W.__iprVol3d) return; W.__iprVol3d = 1;

  var GEOTIFF = "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist-browser/geotiff.js";
  var CHM = "https://data.source.coop/tge-labs/meta-chm-v2/chm/";
  var OFM = "https://tiles.openfreemap.org/planet";
  var INCL = 20, ZMIN_EDIF = 14, ZMIN_ARV = 15, LADO_MAX = 1000, CEL = 5, H_MIN = 2;
  var R = 6378137, MEIO = Math.PI * R;
  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en"; }

  // ---------- geotiff.js, carregado só quando é preciso ----------
  var gtP = null;
  function geotiff() {
    if (W.GeoTIFF) return Promise.resolve(W.GeoTIFF);
    if (gtP) return gtP;
    gtP = new Promise(function (ok, falha) {
      // o pacote é UMD: se a página tiver um carregador AMD (define.amd), esconde-o enquanto carrega, para ficar em window.GeoTIFF
      var amd = W.define && W.define.amd ? W.define : null; if (amd) W.define = undefined;
      var s = D.createElement("script"); s.src = GEOTIFF; s.async = true; s.crossOrigin = "anonymous";
      s.onload = function () { if (amd) W.define = amd; W.GeoTIFF ? ok(W.GeoTIFF) : falha(new Error("geotiff")); };
      s.onerror = function () { if (amd) W.define = amd; gtP = null; falha(new Error("geotiff")); };
      D.head.appendChild(s);
    });
    return gtP;
  }

  // ---------- Web Mercator ----------
  function mx(lon) { return lon * MEIO / 180; }
  function my(lat) { return Math.log(Math.tan((90 + lat) * Math.PI / 360)) * R; }
  function lon(x) { return x / MEIO * 180; }
  function lat(y) { return (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI; }
  function quadkey(x, y, z) {
    var q = ""; for (var i = z; i > 0; i--) { var d = 0, m = 1 << (i - 1); if (x & m) d++; if (y & m) d += 2; q += d; } return q;
  }
  var Z = 10, N = 1 << Z, LADO_T = 2 * MEIO / N;
  function tileDe(X, Y) { return { x: Math.floor((X + MEIO) / LADO_T), y: Math.floor((MEIO - Y) / LADO_T) }; }

  // ---------- leitura das copas ----------
  var tifs = {};
  function tif(q) {
    if (!tifs[q]) tifs[q] = geotiff().then(function (G) { return G.fromUrl(CHM + q + ".tif", { allowFullFile: false }); }).then(function (t) { return t.getImage(0).then(function (img) { return { t: t, w: img.getWidth(), h: img.getHeight() }; }); })
      .catch(function () { delete tifs[q]; return null; });
    return tifs[q];
  }
  // Lê a caixa [x0,y0,x1,y1] (metros Mercator) em células de CEL m; devolve um GeoJSON de células com a altura.
  function copas(cx) {
    var t0 = tileDe(cx[0], cx[3]), t1 = tileDe(cx[2], cx[1]), pedidos = [];
    for (var tx = t0.x; tx <= t1.x; tx++) for (var ty = t0.y; ty <= t1.y; ty++) pedidos.push(lerTile(tx, ty, cx));
    return Promise.all(pedidos).then(function (ls) {
      var f = []; ls.forEach(function (l) { if (l) f.push.apply(f, l); });
      return { type: "FeatureCollection", features: f };
    });
  }
  function lerTile(tx, ty, cx) {
    var tX0 = -MEIO + tx * LADO_T, tY1 = MEIO - ty * LADO_T;
    var a = Math.max(cx[0], tX0), b = Math.min(cx[2], tX0 + LADO_T), c = Math.max(cx[1], tY1 - LADO_T), d = Math.min(cx[3], tY1);
    if (b <= a || d <= c) return Promise.resolve(null);
    return tif(quadkey(tx, ty, Z)).then(function (o) {
      if (!o) return null;
      var px = LADO_T / o.w, py = LADO_T / o.h;
      var win = [Math.floor((a - tX0) / px), Math.floor((tY1 - d) / py), Math.ceil((b - tX0) / px), Math.ceil((tY1 - c) / py)];
      var cw = Math.max(1, Math.round((b - a) / CEL)), ch = Math.max(1, Math.round((d - c) / CEL));
      return o.t.readRasters({ window: win, width: cw, height: ch, samples: [0], interleave: true, resampleMethod: "nearest" }).then(function (r) {
        var f = [], sx = (win[2] - win[0]) * px / cw, sy = (win[3] - win[1]) * py / ch, x0 = tX0 + win[0] * px, y0 = tY1 - win[1] * py, enc = 0.12;
        for (var j = 0; j < ch; j++) for (var i = 0; i < cw; i++) {
          var h = r[j * cw + i]; if (!h || h < H_MIN || h > 254) continue;
          var X0 = x0 + (i + enc) * sx, X1 = x0 + (i + 1 - enc) * sx, Y0 = y0 - (j + enc) * sy, Y1 = y0 - (j + 1 - enc) * sy;
          f.push({ type: "Feature", properties: { h: h }, geometry: { type: "Polygon", coordinates: [[[lon(X0), lat(Y0)], [lon(X1), lat(Y0)], [lon(X1), lat(Y1)], [lon(X0), lat(Y1)], [lon(X0), lat(Y0)]]] } });
        }
        return f;
      });
    }).catch(function () { return null; });
  }

  // ---------- camadas no mapa ----------
  var VAZIO = { type: "FeatureCollection", features: [] };
  function montar(m) {
    if (m.__iprVol) return; m.__iprVol = { ult: "", n: 0 };
    function poe() {
      try {
        if (!m.getSource("ipr-ofm-edif")) m.addSource("ipr-ofm-edif", { type: "vector", url: OFM, attribution: "© OpenStreetMap" });
        if (!m.getLayer("ipr-vol-edif")) m.addLayer({ id: "ipr-vol-edif", type: "fill-extrusion", source: "ipr-ofm-edif", "source-layer": "building", minzoom: ZMIN_EDIF,
          layout: { visibility: "none" },
          paint: { "fill-extrusion-color": "#d9cfbd", "fill-extrusion-opacity": 0.92,
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0] } });
        if (!m.getSource("ipr-vol-arv")) m.addSource("ipr-vol-arv", { type: "geojson", data: VAZIO, attribution: "Copas: Meta CHM v2 (Meta / Data for Good, Taylor Geospatial), CC BY 4.0" });
        if (!m.getLayer("ipr-vol-arv")) m.addLayer({ id: "ipr-vol-arv", type: "fill-extrusion", source: "ipr-vol-arv", minzoom: ZMIN_ARV,
          layout: { visibility: "none" },
          paint: { "fill-extrusion-color": ["interpolate", ["linear"], ["get", "h"], 2, "#8fb45a", 8, "#4f8a3c", 16, "#2f6a34", 30, "#1d4a2a"],
            "fill-extrusion-opacity": 0.95, "fill-extrusion-height": ["get", "h"], "fill-extrusion-base": 0 } });
      } catch (e) {}
      actualiza();
    }
    var t = 0;
    function actualiza() {
      clearTimeout(t);
      t = setTimeout(function () {
        var on = m.getPitch() > INCL, z = m.getZoom();
        try {
          if (m.getLayer("ipr-vol-edif")) m.setLayoutProperty("ipr-vol-edif", "visibility", on && z >= ZMIN_EDIF ? "visible" : "none");
          if (m.getLayer("ipr-vol-arv")) m.setLayoutProperty("ipr-vol-arv", "visibility", on && z >= ZMIN_ARV ? "visible" : "none");
        } catch (e) { return; }
        if (!on || z < ZMIN_ARV) return;
        var c = m.getCenter(), X = mx(c.lng), Y = my(c.lat), b = m.getBounds();
        var meia = Math.min(LADO_MAX / 2, Math.max(150, (mx(b.getEast()) - mx(b.getWest())) / 2));
        var cx = [X - meia, Y - meia, X + meia, Y + meia].map(function (v) { return Math.round(v / 50) * 50; });
        var chave = cx.join(","); if (chave === m.__iprVol.ult) return; m.__iprVol.ult = chave;
        var n = ++m.__iprVol.n;
        copas(cx).then(function (fc) {
          if (n !== m.__iprVol.n) return;
          var s = m.getSource("ipr-vol-arv"); if (s) s.setData(fc);
        });
      }, 350);
    }
    if (m.isStyleLoaded && m.isStyleLoaded()) poe(); else m.once("load", poe);
    m.on("styledata", function () { if (!m.getLayer("ipr-vol-edif") || !m.getLayer("ipr-vol-arv")) setTimeout(poe, 50); });
    m.on("pitchend", actualiza); m.on("moveend", actualiza);
  }

  // mapas já criados (principal) e os que vierem (vistas 3D das fichas)
  function procurar() {
    var m = W.__ipe && W.__ipe.mapa; if (m && m.getPitch) montar(m);
  }
  var ML = W.maplibregl;
  if (ML && ML.Map && !ML.Map.__iprVol) {
    var Orig = ML.Map;
    var Novo = function (o) { var m = new Orig(o); try { setTimeout(function () { montar(m); }, 0); } catch (e) {} return m; };
    Novo.prototype = Orig.prototype; Object.keys(Orig).forEach(function (k) { try { Novo[k] = Orig[k]; } catch (e) {} });
    Novo.__iprVol = 1; ML.Map = Novo;
  }
  var k = 0; (function espera() { procurar(); if (k++ < 40) setTimeout(espera, 500); })();
  W.__iprVol3d = { montar: montar, copas: copas, quadkey: quadkey };
})();
