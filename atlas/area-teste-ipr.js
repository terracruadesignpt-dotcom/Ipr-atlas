/* IPR Atlas · Área de teste IPR (30/10/2026). Mosaicos finos que o guião da área de teste do worker (ipr_area_teste.py)
   calcula a partir do LiDAR da DGT: bacia do Mira a 5 m e bacia da ribeira do Torgal a 1 m (relevo sombreado, MDT,
   acumulação, linhas de água, rede hidrográfica, bacias e limite da área).
   O site (m90562) recebe as pastas atlas/ do worker e escreve o manifesto em window.IPR_AREA_TESTE_IPR nas páginas do
   Atlas (também em GET /wp-json/tcd/v1/area-teste-ipr). A equipa vê as áreas logo que chegam; os clientes só quando o
   Nuno ligar tcd_at_ipr_publico. Sem áreas, este ficheiro não acrescenta nada.
   Como entra no mapa: um grupo novo «Área de teste IPR» na calha (depois de «Relevo e terreno»), uma subsecção por área com
   o botão «Enquadrar», e uma entrada do tipo «ext» do viz.js por camada (o viz.js trata de ligar, desligar, opacidade e
   ordem). O catálogo do viz.js fecha-se antes de o mapa se criar: o manifesto vem do site (window.IPR_AREA_TESTE_IPR) ou,
   sem ele, da visita anterior (localStorage).
   Leitura dos PMTiles por pedidos Range (a pasta do site é servida sem compressão, como a do m90007). Se o servidor
   responder com o ficheiro inteiro, só se aceita até 64 MB; acima disso a camada não liga e diz porquê.
   Só acrescenta: não mexe noutros ficheiros nem no protocolo «pmtiles» do viz.js nem no «ipr-pmtiles» das bacias.
   Desligar: ?area-teste-ipr=0 no endereço, ou localStorage ipr_area-teste-ipr_off = 1. */
(function () {
  "use strict";
  var NOME = "area-teste-ipr";
  try { if (new URLSearchParams(location.search).get(NOME) === "0") return; } catch (e) {}
  try { if (localStorage.getItem("ipr_" + NOME + "_off") === "1") return; } catch (e) {}
  if (window.__iprAreaTeste) return;
  window.__iprAreaTeste = 1;
  var V = window.IPRViz;
  if (!V || typeof V.juntar !== "function") return;

  var CHAVE = "ipr-area-teste-ipr-v1", G = "ipr_teste", INTEIRO_MAX = 64 * 1048576;
  function LG() { return window.IPR_LINGUA === "en" ? "en" : "pt"; }
  var TX = {
    pt: { g: "Área de teste IPR", enq: "Enquadrar", enqT: "Enquadrar a área de teste no mapa", equipa: "só equipa",
      nota: "Calculado pelo IPR a partir do LiDAR da DGT, área de teste.", semRange: "o servidor não respondeu por partes" },
    en: { g: "IPR test area", enq: "Zoom to area", enqT: "Zoom the map to the test area", equipa: "team only",
      nota: "Computed by IPR from the DGT LiDAR, test area.", semRange: "the server did not answer range requests" }
  };
  // Nomes curtos por camada (o nome comprido do manifesto fica na nota). [pt, en]
  var CURTOS = {
    limite: ["Limite da área", "Area boundary"], somb_bw: ["Relevo sombreado", "Hillshade"], mdt: ["MDT", "DTM"],
    acumulacao: ["Acumulação", "Flow accumulation"], declives: ["Declives", "Slopes"], exposicao: ["Exposição solar", "Aspect"],
    geomorphons: ["Formas do relevo", "Landforms"], twi: ["Humidade topográfica", "Topographic wetness"], erosao: ["Risco de erosão", "Erosion risk"],
    vento: ["Exposição ao vento", "Wind exposure"], streams: ["Linhas de água", "Drainage lines"], rios: ["Rede hidrográfica (Strahler)", "River network (Strahler)"],
    escorrencia: ["Escorrência", "Runoff lines"], festos: ["Festos e cumeadas", "Ridges"], bacias_ipr: ["Bacias, sub-bacias e micro-bacias", "Basins, sub-basins and micro-basins"],
    curvas05: ["Curvas de nível 0,5 m", "Contours 0.5 m"], curvas1: ["Curvas de nível 1 m", "Contours 1 m"], curvas2: ["Curvas de nível 2 m", "Contours 2 m"], curvas5: ["Curvas de nível 5 m", "Contours 5 m"]
  };

  // ---------- manifesto ----------
  function cor(c, d) { return /^#[0-9a-fA-F]{6}$/.test(String(c || "")) ? c : d; }
  function num(v, a, b, d) { v = +v; return isFinite(v) && v >= a && v <= b ? v : d; }
  function urlBoa(u) {
    try { var x = new URL(String(u), location.href); return (x.protocol === "https:" || x.origin === location.origin) && /\.(pmtiles|geojson)$/i.test(x.pathname) ? x.href : ""; } catch (e) { return ""; }
  }
  function valido(j) {
    if (!j || !Array.isArray(j.areas)) return null;
    var out = [];
    j.areas.forEach(function (a) {
      if (!a || !/^[a-z][a-z0-9-]{0,19}$/.test(String(a.id || "")) || !Array.isArray(a.camadas)) return;
      var cs = a.camadas.filter(function (c) { return c && /^[a-z0-9_]{1,40}$/.test(String(c.id || "")) && urlBoa(c.url); });
      if (cs.length) out.push({ a: a, cs: cs });
    });
    return out;
  }
  function ler() {
    var w = window.IPR_AREA_TESTE_IPR;
    if (w && Array.isArray(w.areas)) { try { localStorage.setItem(CHAVE, JSON.stringify(w)); } catch (e) {} return { j: w, site: true }; }
    try { var j = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (j && Array.isArray(j.areas)) return { j: j, site: false }; } catch (e) {}
    return { j: { areas: [] }, site: false };
  }

  // ---------- PMTiles ----------
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
      // Protocolo próprio: o «pmtiles» é do viz.js e o «ipr-pmtiles» das bacias; registar um deles de novo tirava-lhes as
      // fontes. O Protocol reconhece o URL pela parte «pmtiles://…», que «ipr-at-pmtiles://…» também contém.
      var p = new window.pmtiles.Protocol();
      maplibregl.addProtocol("ipr-at-pmtiles", p.tile);
      return p;
    });
    return PROTO;
  }
  // Lê por pedidos Range. Se o servidor devolver o ficheiro inteiro (200), guarda-o em memória até 64 MB e serve as fatias
  // daí; acima disso pára a descarga e a camada não liga (não se descarregam GB por engano).
  function lerAte(r, max) {
    if (!r.body || !r.body.getReader) return r.arrayBuffer().then(function (b) { if (b.byteLength > max) throw new Error(TX[LG()].semRange); return b; });
    var rd = r.body.getReader(), partes = [], n = 0;
    return (function passo() {
      return rd.read().then(function (x) {
        if (x.done) { var u = new Uint8Array(n), o = 0; partes.forEach(function (p) { u.set(p, o); o += p.length; }); return u.buffer; }
        n += x.value.length;
        if (n > max) { try { rd.cancel(); } catch (e) {} throw new Error(TX[LG()].semRange); }
        partes.push(x.value);
        return passo();
      });
    })();
  }
  var INTEIROS = {};
  function fonte(url) {
    return {
      getKey: function () { return url; },
      getBytes: function (o, n, sinal) {
        if (INTEIROS[url]) return INTEIROS[url].then(function (b) { return { data: b.slice(o, o + n) }; });
        return fetch(url, { credentials: "omit", signal: sinal, headers: { Range: "bytes=" + o + "-" + (o + n - 1) } }).then(function (r) {
          if (r.status === 206) return r.arrayBuffer().then(function (b) { return { data: b, etag: r.headers.get("etag") || undefined }; });
          if (r.status === 200) {
            var len = +(r.headers.get("content-length") || 0);
            if (len > INTEIRO_MAX) { try { r.body && r.body.cancel(); } catch (e) {} throw new Error(TX[LG()].semRange); }
            INTEIROS[url] = lerAte(r, INTEIRO_MAX).catch(function (e) { delete INTEIROS[url]; throw e; });
            return INTEIROS[url].then(function (b) { return { data: b.slice(o, o + n) }; });
          }
          throw new Error("HTTP " + r.status);
        });
      }
    };
  }
  var PMS = {};
  function cabecalho(url) {
    return protocolo().then(function (p) {
      if (!PMS[url]) { PMS[url] = new window.pmtiles.PMTiles(fonte(url)); try { p.add(PMS[url]); } catch (e) {} }
      return PMS[url].getHeader().catch(function (e) { delete PMS[url]; throw e; });
    });
  }
  function fontePm(c, url, tipo, h, extra) {
    if (c.mapa.getSource(c.id)) return;
    var s = { type: tipo, tiles: ["ipr-at-pmtiles://" + url + "/{z}/{x}/{y}"], minzoom: h.minZoom, maxzoom: h.maxZoom, attribution: c.atrib };
    if (isFinite(h.minLon) && h.maxLon > h.minLon) s.bounds = [h.minLon, h.minLat, h.maxLon, h.maxLat];
    if (extra) for (var k in extra) s[k] = extra[k];
    c.mapa.addSource(c.id, s);
  }

  // ---------- desenho de cada tipo de camada ----------
  function largura(z0, a, b) { return ["interpolate", ["linear"], ["zoom"], z0, a, z0 + 6, b]; }
  function ligarRaster(k, url) {
    return function (c) {
      return cabecalho(url).then(function (h) {
        fontePm(c, url, "raster", h, { tileSize: 256 });
        c.camada({ id: c.id + "-r", type: "raster", source: c.id, minzoom: h.minZoom,
          paint: { "raster-opacity": c.op, "raster-fade-duration": 150, "raster-resampling": "linear" } }, "raster");
      });
    };
  }
  function ligarVector(k, url) {
    var cams = Array.isArray(k.camadas) ? k.camadas : (k.camada ? [k.camada] : []), cr = cor(k.cor, "#3a8fd8");
    return function (c) {
      return cabecalho(url).then(function (h) {
        fontePm(c, url, "vector", h);
        var z0 = Math.max(h.minZoom || 0, k.zmin || 0), op = c.op;
        if (k.id === "bacias_ipr" || (cams.indexOf("bacia") >= 0 && cams.indexOf("microbacia") >= 0)) {
          var inc = ["==", ["get", "tipo"], "incompleta"];
          c.camada({ id: c.id + "-q", type: "fill", source: c.id, "source-layer": "microbacia", paint: { "fill-color": "#000", "fill-opacity": 0 } }, "fill");
          c.camada({ id: c.id + "-lm", type: "line", source: c.id, "source-layer": "microbacia", minzoom: Math.max(z0, 11),
            paint: { "line-color": cr, "line-opacity": 0.6 * op, "line-width": largura(11, 0.4, 1.1) } }, "line");
          c.camada({ id: c.id + "-ls", type: "line", source: c.id, "source-layer": "subbacia",
            paint: { "line-color": cr, "line-opacity": 0.85 * op, "line-width": largura(z0, 0.7, 1.8) } }, "line");
          c.camada({ id: c.id + "-lb", type: "line", source: c.id, "source-layer": "bacia", filter: ["!", inc],
            paint: { "line-color": cr, "line-opacity": op, "line-width": largura(z0, 1.2, 3) } }, "line");
          return;
        }
        cams.forEach(function (sl, i) {
          var base = { source: c.id, "source-layer": sl, minzoom: z0 }, id = c.id + "-" + i;
          if (k.tipo === "poligono") {
            c.camada(Object.assign({ id: id + "f", type: "fill", paint: { "fill-color": cr, "fill-opacity": num(k.fop, 0, 1, 0.08) * op } }, base), "fill");
            c.camada(Object.assign({ id: id + "l", type: "line", paint: { "line-color": cr, "line-opacity": op, "line-width": num(k.larg, 0, 20, 1) } }, base), "line");
          } else if (k.tipo === "ponto") {
            c.camada(Object.assign({ id: id + "p", type: "circle", paint: { "circle-color": cr, "circle-opacity": op, "circle-radius": 3 } }, base), "circle");
          } else {
            var w = largura(z0, 0.6, 1.8), cc = cr, cl = k.classes;
            if (cl && cl.campo && Array.isArray(cl.valores) && cl.valores.length && Array.isArray(cl.cores) && cl.cores.length === cl.valores.length) {
              cc = ["match", ["to-number", ["get", cl.campo]]]; cl.valores.forEach(function (v, j) { cc.push(+v, cor(cl.cores[j], cr)); }); cc.push(cr);
              if (Array.isArray(cl.larguras) && cl.larguras.length === cl.valores.length) { w = ["match", ["to-number", ["get", cl.campo]]]; cl.valores.forEach(function (v, j) { w.push(+v, +cl.larguras[j] || 1); }); w.push(1); }
            } else if (k.id === "rios" || k.id === "streams") {
              // Ordem de Strahler no campo ORDER (terreno.py e o guião da área de teste): as ordens altas mais largas.
              var ord = ["coalesce", ["to-number", ["get", "ORDER"]], 1];
              w = ["interpolate", ["linear"], ["zoom"], z0, ["*", 0.35, ord], z0 + 6, ["*", 0.8, ord]];
            }
            c.camada(Object.assign({ id: id + "l", type: "line", layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": cc, "line-opacity": op, "line-width": w } }, base), "line");
          }
        });
      });
    };
  }
  var GJ = {};
  function geojson(url) {
    if (!GJ[url]) GJ[url] = fetch(url, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function (e) { delete GJ[url]; throw e; });
    return GJ[url];
  }
  function ligarGeojson(k, url) {
    var cr = cor(k.cor, "#ff9a3c");
    return function (c) {
      return geojson(url).then(function (d) {
        if (!c.mapa.getSource(c.id)) c.mapa.addSource(c.id, { type: "geojson", data: d, attribution: c.atrib });
        if (k.tipo === "poligono") {
          c.camada({ id: c.id + "-f", type: "fill", source: c.id, paint: { "fill-color": cr, "fill-opacity": num(k.fop, 0, 1, 0.06) * c.op } }, "fill");
          c.camada({ id: c.id + "-l", type: "line", source: c.id, paint: { "line-color": cr, "line-opacity": c.op, "line-width": num(k.larg, 0, 20, 2) } }, "line");
        } else if (k.tipo === "ponto") {
          c.camada({ id: c.id + "-p", type: "circle", source: c.id, paint: { "circle-color": cr, "circle-opacity": c.op, "circle-radius": 4 } }, "circle");
        } else {
          c.camada({ id: c.id + "-l", type: "line", source: c.id, paint: { "line-color": cr, "line-opacity": c.op, "line-width": num(k.larg, 0, 20, 1.2) } }, "line");
        }
      });
    };
  }

  // ---------- registo no catálogo ----------
  function rotulo(a) {
    if (a.rotulo) return String(a.rotulo).slice(0, 40);
    var n = a.id.charAt(0).toUpperCase() + a.id.slice(1).replace(/-/g, " ");
    return a.resolucao_m ? n + " " + String(+a.resolucao_m).replace(".", ",") + " m" : n;
  }
  function subDe(a, l) { var r = rotulo(a).replace(/ (\d[\d,]*) m$/, " · $1 m"); return a.publico ? r : r + " · " + TX[l].equipa; }
  var AREAS = {}, VISTOS = {};
  function grupo() {
    var gs = V.grupos;
    if (!Array.isArray(gs) || gs.some(function (g) { return g && g.id === G; })) return;
    var i = gs.map(function (g) { return g && g.id; }).indexOf("lidar");
    gs.splice(i >= 0 ? i + 1 : gs.length, 0, { id: G, nome: TX[LG()].g, nomeEn: TX.en.g, icone: "lidar" });
  }
  function registar(lista) {
    var l = LG(), n = 0;
    lista.forEach(function (x) {
      var a = x.a, ra = rotulo(a), pre = "atipr_" + a.id.replace(/-/g, "_") + "_";
      AREAS[a.id] = a;
      x.cs.forEach(function (k, i) {
        var id = pre + i; // índice e não o id da camada: o viz.js dá opacidades fixas a ids com «mdt» ou «acumul»
        if (VISTOS[id]) return;
        var url = urlBoa(k.url), pm = /\.pmtiles$/i.test(new URL(url).pathname), cur = CURTOS[k.id] || [k.nome || k.id, k.nome || k.id];
        var lig = !pm ? ligarGeojson(k, url) : k.tipo === "raster" ? ligarRaster(k, url) : ligarVector(k, url);
        var e = { id: id, g: G, sub: subDe(a, l), subEn: subDe(a, "en"), n: (l === "en" ? cur[1] : cur[0]) + " · " + ra, en: cur[1] + " · " + ra,
          t: "ext", cor: cor(k.cor, "#888888"), op: num(k.op, 0.05, 1, k.tipo === "raster" ? 0.85 : 1), lic: "v",
          fonte: a.fonte || "IPR · LiDAR DGT", nota: (k.nome && k.nome !== cur[0] ? k.nome + ". " : "") + TX.pt.nota, notaEn: TX.en.nota,
          area: a.id, ligar: lig };
        if (pm && k.tipo === "raster" && k.zmin > 0) e.minz = k.zmin; // a calha diz «aproxime o mapa para ver»
        if (V.juntar(e)) { VISTOS[id] = 1; n++; }
      });
    });
    if (n) grupo();
    return n;
  }

  // ---------- «Enquadrar» em cada área ----------
  function caixa(g) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (g && g.features ? g.features : [g]).map(function (f) { return f && (f.geometry ? f.geometry.coordinates : f.coordinates); }));
    return isFinite(b[0]) && b[0] <= b[2] ? b : null;
  }
  function caixaArea(a) {
    if (Array.isArray(a.bbox) && a.bbox.length === 4 && a.bbox.every(isFinite)) return Promise.resolve(a.bbox);
    var lim = (a.camadas || []).filter(function (c) { return c && /\.geojson$/i.test(String(c.url || "")) && urlBoa(c.url); })[0];
    if (lim) return geojson(urlBoa(lim.url)).then(caixa);
    if (Array.isArray(a.centro)) return Promise.resolve([a.centro[0], a.centro[1], a.centro[0], a.centro[1]]);
    return Promise.resolve(null);
  }
  function enquadrar(a) {
    var M = window.__ipe && window.__ipe.mapa;
    if (!M) return;
    caixaArea(a).then(function (b) {
      if (!b) return;
      try {
        if (b[2] - b[0] < 1e-6) M.flyTo({ center: [b[0], b[1]], zoom: num(a.zoom, 0, 22, 12) });
        else M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: window.innerWidth < 700 ? 24 : 60, maxZoom: 16, duration: 700 });
      } catch (e) {}
    }).catch(function () {});
  }
  function estilo() {
    if (document.getElementById("ipr-atipr-css")) return;
    var s = document.createElement("style"); s.id = "ipr-atipr-css";
    s.textContent = '.ipr-g[data-g="' + G + '"] .ipr-sub{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      ".ipr-atipr-enq{min-height:40px;min-width:40px;padding:0 12px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer;opacity:.85;flex:none}" +
      ".ipr-atipr-enq:hover,.ipr-atipr-enq:focus-visible{opacity:1}";
    document.head.appendChild(s);
  }
  function pintar() {
    var gdiv = document.querySelector('#ipe-cam .ipr-g[data-g="' + G + '"]');
    if (!gdiv) return;
    var l = LG(), subs = {};
    Object.keys(AREAS).forEach(function (k) { subs[subDe(AREAS[k], "pt")] = k; subs[subDe(AREAS[k], "en")] = k; });
    Array.prototype.forEach.call(gdiv.querySelectorAll(".ipr-sub"), function (li) {
      var bt = li.querySelector(".ipr-atipr-enq"), txt = (li.firstChild && li.firstChild.nodeType === 3 ? li.firstChild.nodeValue : li.textContent.replace(bt ? bt.textContent : "", "")).trim();
      var k = subs[txt];
      if (!k) return;
      if (!bt) {
        estilo();
        bt = document.createElement("button"); bt.type = "button"; bt.className = "ipr-atipr-enq";
        bt.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); enquadrar(AREAS[bt.getAttribute("data-area")]); });
        li.appendChild(bt);
      }
      bt.setAttribute("data-area", k);
      bt.textContent = TX[l].enq; bt.title = TX[l].enqT; bt.setAttribute("aria-label", TX[l].enqT + " (" + rotulo(AREAS[k]) + ")");
    });
  }
  function observar() {
    var cam = document.getElementById("ipe-cam");
    if (!cam) { if ((observar.n = (observar.n || 0) + 1) < 240) setTimeout(observar, 500); return; }
    try { pintar(); } catch (e) {}
    try { new MutationObserver(function () { clearTimeout(observar.t); observar.t = setTimeout(function () { try { pintar(); } catch (e) {} }, 80); }).observe(cam, { childList: true, subtree: true }); } catch (e) {}
  }

  var inicio = ler(), n = 0;
  try { n = registar(valido(inicio.j) || []); } catch (e) {}
  if (n) observar();
  document.addEventListener("ipr:lingua", function () { try { pintar(); } catch (e) {} });
  // Sem o manifesto escrito pelo site (página em cache antiga ou m90562 desligado): pede-o para a visita seguinte e regista
  // já, se o catálogo ainda aceitar entradas.
  if (!inicio.site) {
    var h = {}; try { if (window.wpApiSettings && window.wpApiSettings.nonce) h["X-WP-Nonce"] = window.wpApiSettings.nonce; } catch (e) {}
    fetch("/wp-json/tcd/v1/" + NOME, { credentials: "same-origin", headers: h }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var v = valido(j);
      if (!v) return;
      try { localStorage.setItem(CHAVE, JSON.stringify(j)); } catch (e) {}
      try { if (registar(v)) observar(); } catch (e) {}
    }).catch(function () {});
  }
  window.IPRAreaTeste = { areas: function () { return Object.keys(AREAS).map(function (k) { return AREAS[k]; }); }, enquadrar: function (id) { if (AREAS[id]) enquadrar(AREAS[id]); } };
})();
