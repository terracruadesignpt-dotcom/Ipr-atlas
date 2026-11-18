/* IPR Atlas · Bacias hidrográficas da Península, inteiras e encaixadas (18/11/2026). Terracrua Design.
   Regra canónica do Nuno (18/11, 13h25): «quero a bacia do Douro e do Tejo e do Guadalquivir e do Guadiana, tudo completo
   [...] olhar para o Guadiana e ver a sub-bacia do Vascão; só quando faço zoom na sub-bacia do Vascão é que vejo as
   sub-bacias da sub-bacia [...] quando abres Portugal vês o Mira, vês o Tejo; quando fazes zoom começas a ver o Torgal».
   Três níveis encaixados, calculados a partir do HydroBASINS nível 12 (HydroSHEDS, WWF) pela topologia da rede:
     bacia      = tudo o que drena para a mesma foz (o rio que chega ao mar), inteira, Portugal e Espanha;
     subbacia   = cada afluente do rio principal com 100 km² ou mais;
     microbacia = cada afluente desses afluentes com 30 km² ou mais.
   O nome de cada uma é o do rio que a drena (OpenStreetMap). Ao abrir o país vêem-se só as bacias; as sub-bacias aparecem
   ao aproximar (zoom 7) e as sub-bacias da sub-bacia mais perto (zoom 9,5). Para mais pormenor em Portugal há as bacias de
   cada troço (APA) e as bacias do IPR a partir do LiDAR.
   Entra no catálogo como tipo «ext» (o viz.js trata da calha, opacidade, ordem e desligar). Não mexe nas bacias da APA. */
(function () {
  "use strict";
  var V = window.IPRViz;
  if (!V || typeof V.juntar !== "function" || window.__iprBacIb) return;
  window.__iprBacIb = 1;
  // Ficheiro de dados fixado por commit (o mesmo repositório público do Atlas, servido pelo jsDelivr).
  var URL_PMT = "https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@502bf2fc4a33eeaba4c9c86b4c4ab379f8d8877c/atlas/dados/bacias-ibericas.pmtiles";
  var PROTO = null;
  function protocolo() {
    if (PROTO) return PROTO;
    PROTO = new Promise(function (ok, falha) {
      if (window.pmtiles) return ok();
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js";
      s.onload = ok; s.onerror = function () { PROTO = null; falha(new Error("pmtiles")); };
      document.head.appendChild(s);
    }).then(function () {
      if (!window.__iprPmtProto) { window.__iprPmtProto = new window.pmtiles.Protocol(); try { maplibregl.addProtocol("ipr-pmtiles", window.__iprPmtProto.tile); } catch (e) {} }
      return window.__iprPmtProto;
    });
    return PROTO;
  }
  // O ficheiro descarrega-se uma vez e as fatias servem-se da memória (como no bacias-ipr.js).
  var INTEIRO = null;
  var FONTE = {
    getKey: function () { return URL_PMT; },
    getBytes: function (o, n) {
      if (!INTEIRO) INTEIRO = fetch(URL_PMT, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
        .catch(function (e) { INTEIRO = null; throw e; });
      return INTEIRO.then(function (b) { return { data: b.slice(o, o + n) }; });
    }
  };
  function ligar(c) {
    var M = c.mapa, op = c.op, id = c.id;
    return protocolo().then(function (p) {
      var pm = new window.pmtiles.PMTiles(FONTE);
      try { p.add(pm); } catch (e) {}
      return pm.getHeader();
    }).then(function (h) {
      if (!M.getSource(id)) M.addSource(id, { type: "vector", tiles: ["ipr-pmtiles://" + URL_PMT + "/{z}/{x}/{y}"], minzoom: h.minZoom, maxzoom: h.maxZoom,
        bounds: [h.minLon, h.minLat, h.maxLon, h.maxLat], attribution: c.atrib });
      var w = function (a, b, c2, d) { return ["interpolate", ["linear"], ["zoom"], a, b, c2, d]; };
      // Transparentes, só para o clique (identificar) dizer a bacia, a sub-bacia e a sub-bacia da sub-bacia.
      c.camada({ id: id + "-qb", type: "fill", source: id, "source-layer": "bacia", paint: { "fill-color": "#000", "fill-opacity": 0 } }, "fill");
      c.camada({ id: id + "-qs", type: "fill", source: id, "source-layer": "subbacia", minzoom: 7, paint: { "fill-color": "#000", "fill-opacity": 0 } }, "fill");
      c.camada({ id: id + "-qm", type: "fill", source: id, "source-layer": "microbacia", minzoom: 9.5, paint: { "fill-color": "#000", "fill-opacity": 0 } }, "fill");
      c.camada({ id: id + "-lm", type: "line", source: id, "source-layer": "microbacia", minzoom: 9.5,
        paint: { "line-color": "#6f9fc4", "line-opacity": 0.8 * op, "line-width": w(9.5, 0.5, 14, 1.2) } }, "line");
      c.camada({ id: id + "-ls", type: "line", source: id, "source-layer": "subbacia", minzoom: 7,
        paint: { "line-color": "#2f6f9f", "line-opacity": 0.9 * op, "line-width": w(7, 0.7, 14, 2) } }, "line");
      c.camada({ id: id + "-lb", type: "line", source: id, "source-layer": "bacia",
        paint: { "line-color": "#1f4e79", "line-opacity": op, "line-width": w(4, 0.9, 14, 3.4) } }, "line");
      var txt = { "text-color": "#1f4e79", "text-halo-color": "rgba(252,250,243,.92)", "text-halo-width": 1.5 };
      var nome = ["get", "nome"], tem = ["!=", ["get", "nome"], ""];
      c.camada({ id: id + "-tb", type: "symbol", source: id, "source-layer": "bacia_r", maxzoom: 9.5,
        filter: ["all", tem, [">=", ["get", "km2"], ["step", ["zoom"], 3000, 6, 700, 7, 150, 8, 40]]],
        layout: { "text-field": nome, "text-font": ["Noto Sans Bold"], "text-size": w(4, 11, 9, 15), "text-padding": 6, "text-max-width": 8 }, paint: txt }, "symbol");
      c.camada({ id: id + "-ts", type: "symbol", source: id, "source-layer": "subbacia_r", minzoom: 7.5, maxzoom: 11.5, filter: tem,
        layout: { "text-field": nome, "text-font": ["Noto Sans Regular"], "text-size": w(7.5, 10.5, 11, 13), "text-padding": 5, "text-max-width": 8 },
        paint: { "text-color": "#2f6f9f", "text-halo-color": "rgba(252,250,243,.92)", "text-halo-width": 1.4 } }, "symbol");
      c.camada({ id: id + "-tm", type: "symbol", source: id, "source-layer": "microbacia_r", minzoom: 10, filter: tem,
        layout: { "text-field": nome, "text-font": ["Noto Sans Italic"], "text-size": 11, "text-padding": 4, "text-max-width": 8 },
        paint: { "text-color": "#3f7aa8", "text-halo-color": "rgba(252,250,243,.92)", "text-halo-width": 1.3 } }, "symbol");
    });
  }
  var e = { id: "bac_ib", g: "agua", sub: "Superficial", subEn: "Surface water",
    n: "Bacias hidrográficas inteiras (bacia, sub-bacia, sub-bacia da sub-bacia)", en: "Whole river basins (basin, sub-basin, sub-sub-basin)",
    t: "ext", cor: "#1f4e79", op: 1, lic: "v", fonte: "IPR, a partir do HydroBASINS (HydroSHEDS, WWF) e do © OpenStreetMap",
    nota: "Cada bacia inteira, de Portugal e de Espanha, até à foz. Ao aproximar aparecem as sub-bacias (os afluentes do rio principal) e, mais perto, as sub-bacias de cada sub-bacia. Cada uma com o nome do rio que a drena.",
    notaEn: "Each whole basin, in Portugal and Spain, down to the river mouth. Zoom in for the sub-basins (tributaries of the main river) and, closer, their own sub-basins.",
    ligar: ligar };
  (function vez(n) { try { if (V.juntar(e)) return; } catch (x) {} if (n < 60) setTimeout(function () { vez(n + 1); }, 50); })(0);
})();
