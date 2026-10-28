/* IPR Atlas · Bacias hidrográficas do IPR a partir do LiDAR (27/10/2026, pedido do Nuno: «Só bacias próprias do LiDAR»).
   Três níveis encaixados calculados pelo worker (bacias.py, 1.0.37) sobre o MDT da DGT com o WhiteboxTools: bacia
   (MIRA), sub-bacia (MIRA.03) e micro-bacia (MIRA.03.017), com divisórias alisadas e sem buracos nem sobreposições.
   O site (m90420) só as mostra depois de revistas e publicadas: manifesto em /wp-json/tcd/v1/bacias-ipr.
   Não mexe nas bacias da APA («bacias», «bac_troco»): ficam no catálogo como estão.
   Como entra no mapa: tipo «ext» do viz.js (a entrada traz a sua função ligar; o viz.js trata do resto: calha, opacidade,
   ordem das camadas e desligar, que tira todas as camadas iprv-<id>-* e a fonte iprv-<id>).
   O catálogo do viz.js tem de estar completo antes de o mapa se criar, por isso o manifesto lido aqui é o da visita anterior
   (localStorage) ou o que o site escrever em window.IPR_BACIAS_IPR; o pedido ao site actualiza-o para a visita seguinte. */
(function () {
  "use strict";
  var V = window.IPRViz;
  if (!V || typeof V.juntar !== "function") return;
  var CHAVE = "ipr-bacias-ipr-v1", LG = function () { return window.IPR_LINGUA === "en" ? "en" : "pt"; };
  var TX = {
    pt: { n: "Bacias hidrográficas (IPR, LiDAR)", sub: "Bacias próprias (LiDAR)", nota: "Bacia, sub-bacia e micro-bacia calculadas pelo IPR a partir do LiDAR da DGT. As linhas finas (micro-bacias) aparecem ao aproximar. Tracejado: bacia cortada pelo limite da área calculada." },
    en: { n: "River basins (IPR, LiDAR)", sub: "IPR basins (LiDAR)", nota: "Basin, sub-basin and micro-basin computed by IPR from the DGT LiDAR. The thin lines (micro-basins) appear when zooming in. Dashed: basin cut by the edge of the computed area." }
  };
  function ler() {
    if (window.IPR_BACIAS_IPR && Array.isArray(window.IPR_BACIAS_IPR.regioes)) return window.IPR_BACIAS_IPR;
    try { var j = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (j && Array.isArray(j.regioes)) return j; } catch (e) {}
    return { regioes: [] };
  }
  function guardar(j) { try { localStorage.setItem(CHAVE, JSON.stringify(j)); } catch (e) {} }

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
      // Protocolo próprio («ipr-pmtiles»): o «pmtiles» é do viz.js (Bases) e registá-lo de novo tirava-lhe as fontes. O
      // Protocol do pmtiles reconhece o URL pela parte «pmtiles://…», que «ipr-pmtiles://…» também contém.
      var p = new window.pmtiles.Protocol();
      maplibregl.addProtocol("ipr-pmtiles", p.tile);
      return p;
    });
    return PROTO;
  }

  var INTEIROS = {};
  function fonteInteira(url) {
    return {
      getKey: function () { return url; },
      getBytes: function (o, n) {
        if (!INTEIROS[url]) INTEIROS[url] = fetch(url, { credentials: "omit" }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.arrayBuffer();
        }).catch(function (e) { delete INTEIROS[url]; throw e; });
        return INTEIROS[url].then(function (b) { return { data: b.slice(o, o + n) }; });
      }
    };
  }

  function ligar(rg) {
    return function (c) {
      var url = new URL(rg.ficheiros.bacias, location.href).href, M = c.mapa, op = c.op, id = c.id;
      return protocolo().then(function (p) {
        // O alojamento (Cloudflare) não respeita pedidos Range neste ficheiro: devolve-o inteiro (e comprimido), e o leitor
        // do pmtiles recusa respostas maiores do que o pedido. Descarrega-se uma vez e servem-se as fatias da memória
        // (o PMTiles do Mira tem 5,5 MB). 28/10/2026, reporte do Nuno: a camada ficava a carregar.
        var pm = new window.pmtiles.PMTiles(fonteInteira(url));
        try { p.add(pm); } catch (e) {}
        return pm.getHeader();
      }).then(function (h) {
        // Fonte com «tiles» e não «url»: o pedido de TileJSON do Protocol só serve o esquema «pmtiles://» (corta 10
        // caracteres), o dos mosaicos procura «pmtiles://» em qualquer ponto do URL.
        if (!M.getSource(id)) M.addSource(id, { type: "vector", tiles: ["ipr-pmtiles://" + url + "/{z}/{x}/{y}"], minzoom: h.minZoom, maxzoom: h.maxZoom,
          bounds: [h.minLon, h.minLat, h.maxLon, h.maxLat], attribution: c.atrib });
        var inc = ["==", ["get", "tipo"], "incompleta"];
        // Transparente, só para o clique (identificar) mostrar a micro-bacia, a sub-bacia e a bacia.
        c.camada({ id: id + "-q", type: "fill", source: id, "source-layer": "microbacia", paint: { "fill-color": "#000", "fill-opacity": 0 } }, "fill");
        c.camada({ id: id + "-f", type: "fill", source: id, "source-layer": "bacia", filter: ["!", inc], maxzoom: 11,
          paint: { "fill-color": "#2f6f9f", "fill-opacity": 0.05 * op } }, "fill");
        c.camada({ id: id + "-lm", type: "line", source: id, "source-layer": "microbacia", minzoom: 11,
          paint: { "line-color": "#5b8fb9", "line-opacity": 0.75 * op, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 15, 1.1] } }, "line");
        c.camada({ id: id + "-ls", type: "line", source: id, "source-layer": "subbacia", minzoom: 8,
          paint: { "line-color": "#2f6f9f", "line-opacity": 0.85 * op, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.7, 14, 1.8] } }, "line");
        c.camada({ id: id + "-lb", type: "line", source: id, "source-layer": "bacia", filter: ["!", inc],
          paint: { "line-color": "#1f4e79", "line-opacity": op, "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.2, 14, 3.2] } }, "line");
        c.camada({ id: id + "-li", type: "line", source: id, "source-layer": "bacia", filter: inc,
          paint: { "line-color": "#7a8794", "line-opacity": 0.6 * op, "line-width": 1, "line-dasharray": [3, 2] } }, "line");
        var txt = { "text-color": "#1f4e79", "text-halo-color": "rgba(252,250,243,.92)", "text-halo-width": 1.4 };
        c.camada({ id: id + "-tb", type: "symbol", source: id, "source-layer": "bacia", filter: ["!", inc], maxzoom: 11,
          layout: { "text-field": ["get", "nome"], "text-font": ["Noto Sans Regular"], "text-size": 13, "text-padding": 8 }, paint: txt }, "symbol");
        c.camada({ id: id + "-ts", type: "symbol", source: id, "source-layer": "subbacia", minzoom: 10, maxzoom: 14,
          layout: { "text-field": ["get", "nome"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-padding": 6 }, paint: txt }, "symbol");
      });
    };
  }

  var VISTOS = {};
  function registar(j) {
    var t = TX[LG()];
    (j.regioes || []).forEach(function (rg) {
      if (!rg || !rg.id || !rg.ficheiros || !rg.ficheiros.bacias || VISTOS[rg.id]) return;
      var e = { id: "bip_" + rg.id, g: "agua", sub: t.sub, subEn: TX.en.sub, n: TX.pt.n + " · " + rg.nome, en: TX.en.n + " · " + rg.nome,
        t: "ext", cor: "#1f4e79", op: 1, lic: "v", fonte: rg.fonte || "IPR · LiDAR DGT", nota: TX.pt.nota, notaEn: TX.en.nota, ligar: ligar(rg) };
      if (V.juntar(e)) VISTOS[rg.id] = 1;
    });
  }
  try { registar(ler()); } catch (e) {}
  // Para a visita seguinte (e já nesta, se o catálogo ainda aceitar entradas).
  fetch("/wp-json/tcd/v1/bacias-ipr", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || !Array.isArray(j.regioes)) return;
    guardar(j);
    try { registar(j); } catch (e) {}
  }).catch(function () {});
})();
