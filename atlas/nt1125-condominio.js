/* IPR Atlas · Condomínio de Aldeia (25/11/2026). Terracrua Design.
   Nuno, 18h01: «Vamos implementar isso no Atlas já e, quando terminado, enviamos o convite à TAGUS»; exemplo: Ferraria de São João.
   1.ª fase, só no navegador (nada é gravado no servidor):
   - toca-se na aldeia; o aglomerado sai da COS 2023 da DGT (tecido edificado junto ao toque, unido quando as manchas estão a
     menos de 50 m); a faixa de 100 m à volta do aglomerado é a área do condomínio;
   - dentro da faixa: ocupação do solo (COS 2023), perigosidade de incêndio rural (SRUP da DGT) e prédios do cadastro geométrico
     (DGT; o BUPi não está incluído, por isso mostra-se a parte da faixa sem cadastro);
   - cada mancha recebe uma acção (reconverter, gerir combustível, manter mosaico, manter e gerir folhosas) e um custo por hectare
     de partida, editável. Não é orçamento;
   - desenha a faixa e as acções no mapa e descarrega GeoJSON (faixa, acções, prédios) e CSV dos prédios.
   Entradas: cartão «Condomínio de Aldeia» nos Simuladores, ?condominio=lng,lat, window.__iprCondominio.abrir([lng,lat]).
   Desligar: ?condominio=0 ou localStorage ipr_cda_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]condominio=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_cda_off") === "1") return; } catch (e) {}
  if (W.__iprCondominio) return;

  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/";
  var TURF = "https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/turf.min.js";
  var FAIXA = 100;
  function en() { return (W.IPR_LINGUA || "pt") === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function ha(m2) { return m2 / 10000; }
  function fmt(n, d) { return (+n).toLocaleString(en() ? "en-GB" : "pt-PT", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  // ---------- acções por classe da COS 2023 ----------
  var ACCOES = [
    { k: "reconv", n: t("Reconverter (eucalipto e invasoras)", "Convert (eucalyptus, invasives)"), cor: "#d9534f", eur: 4000,
      r: /eucalipt|invasora|ac[aá]cia|haquea|aliant/i },
    { k: "pinhal", n: t("Gerir combustível e reconverter em parte (pinhal)", "Fuel management, partial conversion (pine)"), cor: "#e8913a", eur: 2000,
      r: /pinheiro|resinosa|pinhal/i },
    { k: "matos", n: t("Gerir combustível (matos)", "Fuel management (shrubland)"), cor: "#f2c14e", eur: 800,
      r: /mato|herb[aá]ce|vegeta[cç][aã]o esparsa|espa[cç]os descobertos|clareira/i },
    { k: "folhosas", n: t("Manter e gerir folhosas", "Keep and manage broadleaves"), cor: "#4f9a4a", eur: 600,
      r: /sobreir|azinheir|carvalh|castanheir|folhosa|rip[ií]col|medronh/i },
    { k: "agricola", n: t("Manter ou recuperar mosaico agrícola", "Keep or restore farm mosaic"), cor: "#b9cf6a", eur: 1500,
      r: /agr[ií]col|cultura|oliva|vinha|pomar|pastage|hort[ií]col|mosaico|sistemas agroflorestais|arroz/i },
    { k: "agua", n: t("Água", "Water"), cor: "#4fb3d9", eur: 0, r: /[aá]gua|curso|lago|albufeira|zonas h[uú]midas/i },
    { k: "artif", n: t("Edificado e vias (fora da intervenção)", "Built-up and roads (excluded)"), cor: "#9e9e9e", eur: 0,
      r: /artificial|tecido|edif|estrada|equipament|ind[uú]stria|com[eé]rcio|parque|infraestrutura|via/i },
    { k: "outro", n: t("Ver no terreno", "Check on site"), cor: "#8d8d8d", eur: 0, r: /./ }
  ];
  function porK(k) { for (var i = 0; i < ACCOES.length; i++) if (ACCOES[i].k === k) return ACCOES[i]; return ACCOES[ACCOES.length - 1]; }
  function accaoDe(rot, cod) {
    for (var i = 0; i < ACCOES.length - 1; i++) if (ACCOES[i].r.test(rot || "")) return ACCOES[i];
    // pelo código da COS quando o nome não diz: 1 artificial, 2 e 3 agrícola e pastagens, 4 agroflorestal, 5.1.2 resinosas,
    // 5.1.1 folhosas, 6 matos, 7 sem vegetação, 8 e 9 zonas húmidas e água
    var c = String(cod || "");
    if (/^1/.test(c)) return porK("artif");
    if (/^[234]/.test(c)) return porK("agricola");
    if (/^5\.1\.2/.test(c)) return porK("pinhal");
    if (/^5/.test(c)) return porK("folhosas");
    if (/^[67]/.test(c)) return porK("matos");
    if (/^[89]/.test(c)) return porK("agua");
    return porK("outro");
  }
  var EUR = {}; ACCOES.forEach(function (a) { EUR[a.k] = a.eur; });

  // ---------- turf (só quando é preciso) ----------
  var turfP = null;
  function comTurf() {
    if (W.turf && W.turf.buffer) return Promise.resolve(W.turf);
    if (turfP) return turfP;
    turfP = new Promise(function (ok, mal) {
      var s = D.createElement("script"); s.src = TURF; s.crossOrigin = "anonymous";
      s.onload = function () { W.turf ? ok(W.turf) : mal(new Error("turf")); };
      s.onerror = function () { turfP = null; mal(new Error("turf")); };
      D.head.appendChild(s);
    });
    return turfP;
  }

  function itens(col, bb, lim) {
    var u = OGC + col + "/items?f=json&limit=" + (lim || 1000) + "&bbox=" + bb.map(function (x) { return x.toFixed(6); }).join(",");
    var ac = W.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 30000);
    return fetch(u, ac ? { signal: ac.signal } : {}).then(function (r) { if (!r.ok) throw new Error(col + " " + r.status); return r.json(); })
      .then(function (j) { return (j && j.features) || []; });
  }

  // ---------- análise ----------
  function analisar(ll) {
    var T, res = { ll: ll };
    return comTurf().then(function (tf) {
      T = tf;
      var d = 0.012;
      return itens("cos2023v1", [ll[0] - d, ll[1] - d, ll[0] + d, ll[1] + d]);
    }).then(function (cos) {
      var pt = T.point(ll);
      var edif = cos.filter(function (f) { return /^1\.1/.test(String(f.properties.cos23_n4_c || "")); });
      // mancha de edificado no toque ou a menos de 300 m
      var melhor = null, dm = 1e9;
      edif.forEach(function (f) {
        try {
          var dd = T.booleanPointInPolygon(pt, f) ? 0 : T.pointToPolygonDistance(pt, f, { units: "meters" });
          if (dd < dm) { dm = dd; melhor = f; }
        } catch (e) {}
      });
      var aglo;
      if (melhor && dm <= 300) {
        // juntar manchas a menos de 50 m umas das outras (crescendo a partir da escolhida)
        var dentro = [melhor], resto = edif.filter(function (f) { return f !== melhor; }), mudou = true;
        while (mudou) {
          mudou = false;
          var zona = T.buffer(dentro.length > 1 ? T.union(T.featureCollection(dentro)) : dentro[0], 50, { units: "meters" });
          for (var i = resto.length - 1; i >= 0; i--) {
            if (T.booleanIntersects(zona, resto[i])) { dentro.push(resto[i]); resto.splice(i, 1); mudou = true; }
          }
        }
        aglo = dentro.length > 1 ? T.union(T.featureCollection(dentro)) : dentro[0];
        res.agloFonte = "cos";
      } else {
        aglo = T.buffer(pt, 60, { units: "meters" });
        res.agloFonte = "circulo";
      }
      aglo = T.feature(aglo.geometry, {});
      var area = T.buffer(aglo, FAIXA, { units: "meters" });
      var faixa = T.difference(T.featureCollection([area, aglo])) || area;
      res.aglo = aglo; res.area = area; res.faixa = faixa;
      res.haAglo = ha(T.area(aglo)); res.haFaixa = ha(T.area(faixa));
      res.bbox = T.bbox(area);
      var b = res.bbox, m = 0.001, bb = [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
      return Promise.all([
        itens("cos2023v1", bb).catch(function () { return cos; }),
        itens("srup_perigosidade_inc_rural", bb).catch(function () { return null; }),
        itens("cadastro", bb).catch(function () { return null; })
      ]);
    }).then(function (r) {
      var cos = r[0], per = r[1], cad = r[2], b = res.bbox;
      function cortar(f) {
        try {
          var c = T.bboxClip(f, b); if (!c || !c.geometry || !c.geometry.coordinates.length) return null;
          var x = T.intersect(T.featureCollection([c, res.faixa])); return x;
        } catch (e) { return null; }
      }
      // ocupação e acções
      var porClasse = {}, porAccao = {}, manchas = [];
      cos.forEach(function (f) {
        var x = cortar(f); if (!x) return;
        var a = ha(T.area(x)); if (a < 0.001) return;
        var rot = f.properties.cos23_n4_l || f.properties.cos23_n4_c || "?", ac = accaoDe(rot, f.properties.cos23_n4_c);
        porClasse[rot] = (porClasse[rot] || 0) + a;
        porAccao[ac.k] = (porAccao[ac.k] || 0) + a;
        x.properties = { tipo: "accao", accao: ac.k, accao_nome: ac.n, cos23: rot, cos23_c: f.properties.cos23_n4_c || "", ha: +a.toFixed(4), cor: ac.cor };
        manchas.push(x);
      });
      res.porClasse = porClasse; res.porAccao = porAccao; res.manchas = manchas;
      // perigosidade
      if (per) {
        var pp = {};
        per.forEach(function (f) { var x = cortar(f); if (!x) return; var k = f.properties.tipologia || "?"; pp[k] = (pp[k] || 0) + ha(T.area(x)); });
        res.perigo = pp;
      }
      // cadastro
      if (cad) {
        var pr = [], soma = 0;
        cad.forEach(function (f) {
          var x = cortar(f); if (!x) return;
          var a = ha(T.area(x)); if (a < 0.0005) return;
          soma += a;
          pr.push({ ref: f.properties.nationalcadastralreference || f.properties.label || "", ha: a,
                    haTotal: (+f.properties.areavalue || 0) / 10000, geo: f.geometry });
        });
        pr.sort(function (a, b2) { return b2.ha - a.ha; });
        res.predios = pr; res.haCad = soma;
      }
      return estradas(T, res).then(function () { pastoreio(T, res); return res; });
    }).then(function (res) {
      res.nome = nomeAldeia(res.ll);
      if (res.nome) return res;
      return fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&accept-language=pt&lat=" + res.ll[1] + "&lon=" + res.ll[0])
        .then(function (r2) { return r2.json(); }).then(function (j) {
          var a = (j && j.address) || {}; res.nome = a.hamlet || a.village || a.neighbourhood || a.locality || a.town || ""; return res;
        }).catch(function () { return res; });
    });
  }

  // ---------- faixas laterais da rede viária (DL 82/2021: 10 m de cada lado, a cargo de quem gere a via) ----------
  var VIA_M = 10, MARGEM_VIA = 300;
  var MEIA = { motorway: 12, trunk: 7, primary: 5, secondary: 4.5, tertiary: 3.5, unclassified: 3, residential: 3, living_street: 3, service: 2.5, track: 2 };
  function entidadeVia(tags) {
    var r = String(tags.ref || "").toUpperCase(), h = tags.highway;
    if (/^(A|IP|IC)\s?\d/.test(r) || h === "motorway" || h === "trunk") return t("IP ou concessionária (a confirmar)", "IP or concessionaire (to confirm)");
    if (/^(N|EN|ER)\s?\d/.test(r) || h === "primary" || h === "secondary") return t("Infraestruturas de Portugal (a confirmar)", "Infraestruturas de Portugal (to confirm)");
    if (/^(M|EM|CM)\s?\d/.test(r) || h === "tertiary" || h === "unclassified" || h === "residential" || h === "living_street") return t("Câmara Municipal (a confirmar)", "Municipality (to confirm)");
    return t("Proprietários ou junta (a confirmar)", "Owners or parish (to confirm)");
  }
  var OVERPASS = ["https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];
  var OMT = { motorway: "motorway", trunk: "trunk", primary: "primary", secondary: "secondary", tertiary: "tertiary", minor: "unclassified", service: "service", track: "track" };
  // vias: primeiro as que o mapa já tem carregadas (OpenMapTiles, rápido e sem depender de terceiros); sem elas, o Overpass
  function viasMapa(b) {
    var m = mapa(), out = []; if (!m) return out;
    try {
      m.querySourceFeatures("iprv-omt", { sourceLayer: "transportation" }).forEach(function (f) {
        var h = OMT[f.properties.class]; if (!h) return; var g = f.geometry;
        if (g.type !== "LineString" && g.type !== "MultiLineString") return;
        var cs = g.type === "LineString" ? [g.coordinates] : g.coordinates, dentro = cs.some(function (c) { return c.some(function (p) { return p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]; }); });
        if (dentro) out.push({ tags: { highway: h, name: f.properties.name || "", ref: f.properties.ref || "" }, coords: cs });
      });
    } catch (e) {}
    out.fonte = "mapa"; return out;
  }
  function esperarMapa(b) { // o mapa pode ainda estar a carregar a zona (ligação directa, voo): esperar até 10 s
    return new Promise(function (ok) {
      var n = 0, volta = function () { var vm = viasMapa(b); if (vm.length > 3 || ++n > 25) return ok(vm); setTimeout(volta, 400); }; volta();
    });
  }
  function viasOSM(b) {
    return esperarMapa(b).then(function (vm) { if (vm.length > 3) return vm; return viasRede(b, vm); });
  }
  function viasRede(b, vm) {
    var q = "[out:json][timeout:25];way[highway~\"^(" + Object.keys(MEIA).join("|") + ")$\"](" + [b[1], b[0], b[3], b[2]].map(function (x) { return x.toFixed(5); }).join(",") + ");out tags geom;";
    var pedidos = OVERPASS.map(function (u) {
      var ac = W.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 25000);
      return fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ac ? ac.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("overpass " + r.status); return r.json(); })
        .then(function (j) { return (j.elements || []).filter(function (w) { return w.geometry && w.geometry.length > 1; }).map(function (w) { return { tags: w.tags || {}, coords: [w.geometry.map(function (p) { return [p.lon, p.lat]; })] }; }); });
    });
    return (Promise.any ? Promise.any(pedidos) : pedidos[0]).catch(function () { if (vm.length) return vm; throw new Error("sem vias"); });
  }
  function pausa(x) { return new Promise(function (ok) { setTimeout(function () { ok(x); }, 0); }); }
  function estradas(T, res) {
    var b = T.bbox(T.buffer(res.area, MARGEM_VIA, { units: "meters" }));
    return viasOSM(b).then(function (vs) {
      // juntar as linhas por entidade e largura: um só buffer por grupo (rápido, e já sem sobreposições)
      var grupos = {}, km = 0, nomes = {};
      vs.forEach(function (w) {
        var meia = MEIA[w.tags.highway] || 3, ent = entidadeVia(w.tags), k = ent + "|" + meia;
        var g0 = grupos[k] = grupos[k] || { ent: ent, meia: meia, ls: [] };
        w.coords.forEach(function (c) { // só o troço dentro da caixa: o Overpass devolve a via inteira, às vezes com quilómetros
          if (!c || c.length < 2) return;
          try { var x = T.bboxClip(T.lineString(c), b).geometry; (x.type === "LineString" ? [x.coordinates] : x.coordinates).forEach(function (cc) { if (cc.length > 1) g0.ls.push(cc); }); } catch (e) {}
        });
        var nm = w.tags.name || w.tags.ref; if (nm) (nomes[ent] = nomes[ent] || {})[nm] = 1;
        if (!vs.fonte) w.coords.forEach(function (c) { try { var x = T.bboxClip(T.lineString(c), b); if (x.geometry.coordinates.length > 1) km += T.length(x, { units: "kilometers" }); } catch (e) {} });
      });
      var caixa = T.bboxPolygon(b), porEnt = {}, ks = Object.keys(grupos);
      var passo = function (n) {
        if (n >= ks.length) return Promise.resolve();
        var g = grupos[ks[n]];
        try {
          var ml = T.multiLineString(g.ls), fora = T.buffer(ml, g.meia + VIA_M, { units: "meters", steps: 4 }), dentro = T.buffer(ml, g.meia, { units: "meters", steps: 4 });
          var tira = fora && dentro ? T.difference(T.featureCollection([fora, dentro])) : null;
          if (tira) tira = T.intersect(T.featureCollection([tira, caixa]));
          if (tira && res.aglo) tira = T.difference(T.featureCollection([tira, res.aglo]));
          if (tira) (porEnt[g.ent] = porEnt[g.ent] || []).push(tira);
        } catch (e) {}
        return pausa(n + 1).then(passo);
      };
      return passo(0).then(function () {
        var junta = function (a) { try { return a.length > 1 ? T.union(T.featureCollection(a)) : a[0]; } catch (e) { return a[0]; } };
        res.viaEnt = {}; res.vias = [];
        Object.keys(porEnt).forEach(function (k) { var u = junta(porEnt[k]); if (!u) return; var a = ha(T.area(u)); if (a < 0.01) return; res.viaEnt[k] = a; u.properties = { tipo: "via", entidade: k, largura_m: VIA_M, ha: +a.toFixed(4), vias: Object.keys(nomes[k] || {}).slice(0, 12).join("; ") }; res.vias.push(u); });
        res.viaKm = vs.fonte ? 0 : km; res.viaFonte = vs.fonte || "osm";
        return pausa().then(function () {
          var u = junta(res.vias.slice()); res.viaU = u || null; res.haVia = u ? ha(T.area(u)) : 0;
          try { var f100 = u ? T.difference(T.featureCollection([u, res.area])) : null; res.haViaFora = f100 ? ha(T.area(f100)) : 0; } catch (e) { res.haViaFora = 0; }
        });
      });
    }).catch(function (e) { res.vias = null; res.viaErro = String(e && e.message || e); });
  }

  // ---------- pastoreio: parcelas de rotação na faixa e nas bermas ----------
  var PAST = { matos: 1, pinhal: 1, folhosas: 1, outro: 1 }, PARCELAS = 8, DIAS = 10, EUR_PAST = 0;
  function pastoreio(T, res) {
    res.parcelas = []; res.haPast = 0;
    try {
      var pecas = res.manchas.filter(function (m) { return PAST[m.properties.accao]; });
      if (res.viaU) pecas.push(res.viaU);
      if (!pecas.length) return;
      var u = pecas.length > 1 ? T.union(T.featureCollection(pecas)) : pecas[0]; if (!u) return;
      var tot = T.area(u); res.haPast = ha(tot);
      var lado = Math.max(30, Math.sqrt(tot / (PARCELAS * 3))) / 1000, grelha = T.squareGrid(T.bbox(u), lado, { units: "kilometers" }), c = T.centroid(res.aglo), cel = [];
      grelha.features.forEach(function (g) {
        var x = null; try { x = T.intersect(T.featureCollection([g, u])); } catch (e) {} if (!x) return;
        var a = T.area(x); if (a < 20) return; x.properties = { a: a, rumo: T.bearing(c, T.centroid(x)) }; cel.push(x);
      });
      cel.sort(function (a, b) { return a.properties.rumo - b.properties.rumo; });
      var alvo = tot / PARCELAS, grupos = [[]], acc = 0;
      cel.forEach(function (x) { if (acc >= alvo * (grupos.length) && grupos.length < PARCELAS) grupos.push([]); grupos[grupos.length - 1].push(x); acc += x.properties.a; });
      var ps = [];
      grupos.forEach(function (gr) { if (!gr.length) return; var x; try { x = gr.length > 1 ? T.union(T.featureCollection(gr)) : gr[0]; } catch (e) { x = gr[0]; } if (!x) return; x.properties = { tipo: "parcela", ha: +ha(T.area(x)).toFixed(3) }; ps.push(x); });
      ps.forEach(function (p, i) { p.properties.n = i + 1; p.properties.ordem = i + 1; p.properties.dias = DIAS; p.properties.estado = "proposta";
        p.properties.abelhas = i % 2 ? t("descanso na Primavera (flor para as abelhas)", "rest in spring (flowers for bees)") : ""; });
      res.parcelas = ps;
    } catch (e) { res.parcelas = []; }
  }

  function nomeAldeia(ll) {
    var m = mapa(); if (!m) return "";
    try {
      var ps = m.querySourceFeatures("iprv-omt", { sourceLayer: "place" }), best = "", bd = 1e9;
      ps.forEach(function (f) {
        if (!f.properties || !f.properties.name || f.geometry.type !== "Point") return;
        var c = f.geometry.coordinates, dx = (c[0] - ll[0]) * Math.cos(ll[1] * Math.PI / 180), dy = c[1] - ll[1], d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = f.properties["name:pt"] || f.properties.name; }
      });
      return bd < 0.00002 ? best : "";   // ~500 m
    } catch (e) { return ""; }
  }

  // ---------- mapa ----------
  var SRC = "ipr-cda", CAMADAS = ["ipr-cda-parc-n", "ipr-cda-parc", "ipr-cda-via", "ipr-cda-acc", "ipr-cda-aglo", "ipr-cda-cad", "ipr-cda-faixa"];
  function desenhar(res) {
    var m = mapa(); if (!m) return;
    var fs = res.manchas.slice();
    fs.push(Object.assign({}, res.aglo, { properties: { tipo: "aglo" } }));
    fs.push(Object.assign({}, res.area, { properties: { tipo: "faixa" } }));
    (res.predios || []).forEach(function (p) { fs.push({ type: "Feature", geometry: p.geo, properties: { tipo: "predio", ref: p.ref } }); });
    (res.vias || []).forEach(function (v) { fs.push(v); });
    (res.parcelas || []).forEach(function (p) { fs.push(p); });
    var fc = { type: "FeatureCollection", features: fs };
    if (m.getSource(SRC)) { m.getSource(SRC).setData(fc); }
    else {
      m.addSource(SRC, { type: "geojson", data: fc });
      m.addLayer({ id: "ipr-cda-acc", type: "fill", source: SRC, filter: ["==", ["get", "tipo"], "accao"], paint: { "fill-color": ["get", "cor"], "fill-opacity": 0.45 } });
      m.addLayer({ id: "ipr-cda-aglo", type: "fill", source: SRC, filter: ["==", ["get", "tipo"], "aglo"], paint: { "fill-color": "#5b5b5b", "fill-opacity": 0.35 } });
      m.addLayer({ id: "ipr-cda-cad", type: "line", source: SRC, filter: ["==", ["get", "tipo"], "predio"], paint: { "line-color": "#ffffff", "line-width": 0.8, "line-opacity": 0.8 } });
      m.addLayer({ id: "ipr-cda-faixa", type: "line", source: SRC, filter: ["==", ["get", "tipo"], "faixa"], paint: { "line-color": "#94BE39", "line-width": 2.5 } });
      m.addLayer({ id: "ipr-cda-via", type: "fill", source: SRC, filter: ["==", ["get", "tipo"], "via"], paint: { "fill-color": "#c06a2b", "fill-opacity": 0.55 } });
      m.addLayer({ id: "ipr-cda-parc", type: "line", source: SRC, filter: ["==", ["get", "tipo"], "parcela"], paint: { "line-color": "#f5e663", "line-width": 1.6, "line-dasharray": [2, 1.5] } });
      try { m.addLayer({ id: "ipr-cda-parc-n", type: "symbol", source: SRC, filter: ["==", ["get", "tipo"], "parcela"], layout: { "text-field": ["to-string", ["get", "n"]], "text-size": 13, "text-allow-overlap": false }, paint: { "text-color": "#f5e663", "text-halo-color": "#1a1d14", "text-halo-width": 1.5 } }); } catch (e) {}
    }
    var b = res.bbox; try { m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 80, duration: 600, maxZoom: 17 }); } catch (e) {}
  }
  function tirar() {
    var m = mapa(); if (!m) return;
    CAMADAS.forEach(function (id) { try { if (m.getLayer(id)) m.removeLayer(id); } catch (e) {} });
    try { if (m.getSource(SRC)) m.removeSource(SRC); } catch (e) {}
  }

  // ---------- painel ----------
  var CSS =
    "#ipr-cda{position:fixed;z-index:99995;top:70px;right:calc(var(--ipr-cda-dir,240px) + 12px);width:min(430px,calc(100vw - 24px));max-height:calc(100vh - 110px);overflow:auto;" +
    "background:var(--p2,#22261b);color:var(--tx,#e9eadf);border:1px solid var(--ln,#3a3f30);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif;padding:12px 14px}" +
    "#ipr-cda h3{margin:0 0 2px;font:600 15px Outfit,Inter,sans-serif}#ipr-cda h4{margin:12px 0 4px;font:600 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a7ab98)}" +
    "#ipr-cda .x{position:absolute;top:8px;right:10px;all:unset;cursor:pointer;font-size:18px;line-height:1;color:var(--mu,#a7ab98);padding:4px}" +
    "#ipr-cda #ipr-cda-x{position:absolute;top:8px;right:10px}" +
    "#ipr-cda p{margin:4px 0}#ipr-cda small{color:var(--mu,#a7ab98)}#ipr-cda table{width:100%;border-collapse:collapse;font-size:12.5px;table-layout:auto}#ipr-cda table.ac td:first-child{width:56%}" +
    "#ipr-cda td,#ipr-cda th{padding:3px 4px;border-bottom:1px solid var(--ln,#3a3f30);text-align:left;vertical-align:top}#ipr-cda td.n,#ipr-cda th.n{text-align:right;white-space:nowrap}" +
    "#ipr-cda i.c{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}" +
    "#ipr-cda input.e{width:64px;background:var(--p3,#1d2117);color:inherit;border:1px solid var(--ln,#3a3f30);border-radius:5px;padding:2px 4px;text-align:right;font:inherit}" +
    "#ipr-cda .bt{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}#ipr-cda .bt button{all:unset;cursor:pointer;padding:6px 10px;border-radius:7px;border:1px solid var(--ln,#3a3f30);font-weight:600;font-size:12.5px}" +
    "#ipr-cda .org{margin-top:12px;padding-top:10px;border-top:1px solid var(--ln,#3a3f30)}#ipr-cda .org h4{margin:0 0 6px;font-size:14px}#ipr-cda .org input[type=text],#ipr-cda .org input[type=search]{width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid var(--ln,#3a3f30);background:transparent;color:inherit;font:inherit}" +
    "#ipr-cda .rl{max-height:170px;overflow:auto;margin:4px 0}#ipr-cda .ro{display:grid;grid-template-columns:auto 1fr auto auto;gap:4px;align-items:center;font-size:12px;padding:2px 0}#ipr-cda .ro select{font-size:11.5px;background:transparent;color:inherit;border:1px solid var(--ln,#3a3f30);border-radius:5px}#ipr-cda .ro select option{color:#222}" +
    "#ipr-cda .bt a.ac{padding:6px 10px;border-radius:7px;font-weight:600;font-size:12.5px;background:var(--ac,#9BC53D);color:#14200F;text-decoration:none}#ipr-cda .rs{margin-top:6px;font-size:12.5px}#ipr-cda .pp label{margin-right:8px;font-size:12px;white-space:nowrap}" +
    "#ipr-cda .bt button.ac{background:var(--ac,#9BC53D);color:#14200F;border-color:transparent}#ipr-cda details{margin-top:6px}#ipr-cda summary{cursor:pointer;color:var(--mu,#a7ab98)}" +
    "#ipr-cda .tot td{font-weight:600}#ipr-cda .av{background:rgba(232,145,58,.12);border-left:3px solid #e8913a;padding:6px 8px;border-radius:4px;margin:6px 0}" +
    "@media (max-width:900px){#ipr-cda{top:auto;bottom:0;right:0;left:0;width:auto;max-height:60vh;border-radius:12px 12px 0 0}}";
  var painel = null, ultimo = null, aEscolher = false;

  function abrirPainel(html) {
    if (!D.getElementById("ipr-cda-css")) { var s = D.createElement("style"); s.id = "ipr-cda-css"; s.textContent = CSS; D.head.appendChild(s); }
    if (!painel) {
      painel = D.createElement("div"); painel.id = "ipr-cda"; painel.setAttribute("role", "dialog"); painel.setAttribute("aria-label", t("Condomínio de Aldeia", "Village Condominium"));
      D.body.appendChild(painel);
      painel.addEventListener("click", clique); painel.addEventListener("input", mudouEur);
    }
    var dir = D.getElementById("ipe-dir"); var w = dir && dir.getBoundingClientRect().width;
    D.documentElement.style.setProperty("--ipr-cda-dir", (w && w < 600 ? Math.round(w) : 0) + "px");
    painel.innerHTML = '<button type="button" id="ipr-cda-x" class="x" aria-label="' + t("Fechar", "Close") + '">×</button>' + html;
  }
  function fechar() { aEscolher = false; var m = mapa(); if (m) m.getCanvas().style.cursor = ""; tirar(); if (painel) { painel.remove(); painel = null; } ultimo = null; }

  function nivelOk() { return (W.IPR_NIVEL || "") !== "explorer"; }

  function iniciar() {
    if (!nivelOk()) {
      abrirPainel("<h3>" + t("Condomínio de Aldeia", "Village Condominium") + "</h3><p>" + t("Disponível no IPR Atlas Intelligence.", "Available in IPR Atlas Intelligence.") + "</p>");
      return;
    }
    aEscolher = true;
    var m = mapa(); if (m) m.getCanvas().style.cursor = "crosshair";
    abrirPainel("<h3>" + t("Condomínio de Aldeia", "Village Condominium") + "</h3>" +
      "<p>" + t("Toque no centro da aldeia. O Atlas encontra o aglomerado, desenha a faixa de 100 m à volta e mostra o que há dentro: ocupação do solo, perigosidade de incêndio e prédios do cadastro.",
               "Tap the centre of the village. The Atlas finds the built-up area, draws the 100 m belt around it and shows what lies inside: land cover, wildfire hazard and cadastral parcels.") + "</p>" +
      "<small>" + t("Fontes: COS 2023, perigosidade de incêndio rural e cadastro predial, todos da DGT.", "Sources: COS 2023, rural wildfire hazard and land registry, all from DGT.") + "</small>");
  }

  function correr(ll) {
    aEscolher = false; var m = mapa(); if (m) m.getCanvas().style.cursor = "";
    abrirPainel("<h3>" + t("Condomínio de Aldeia", "Village Condominium") + "</h3><p>" + t("A ler a DGT e a calcular a faixa…", "Reading DGT data and computing the belt…") + "</p>");
    analisar(ll).then(function (res) { ultimo = res; desenhar(res); mostrar(res); })
      .catch(function (e) { abrirPainel("<h3>" + t("Condomínio de Aldeia", "Village Condominium") + "</h3><p>" + t("Não foi possível ler os dados da DGT agora. Tente de novo dentro de momentos.", "Could not read DGT data right now. Please try again shortly.") + "</p><small>" + esc(e && e.message) + "</small><div class='bt'><button type='button' data-cda-de-novo>" + t("Escolher outra vez", "Pick again") + "</button></div>"); });
  }

  function custoTotal(res) { var s = 0; Object.keys(res.porAccao).forEach(function (k) { s += res.porAccao[k] * (EUR[k] || 0); }); return s; }

  function mostrar(res) {
    var h = "<h3>" + t("Condomínio de Aldeia", "Village Condominium") + (res.nome ? " · " + esc(res.nome) : "") + "</h3>";
    h += "<p><b>" + fmt(res.haFaixa, 1) + " ha</b> " + t("na faixa de 100 m", "in the 100 m belt") + " · " + fmt(res.haAglo, 1) + " ha " + t("de aglomerado", "built-up") + "</p>";
    if (res.agloFonte === "circulo") h += "<div class='av'>" + t("Não encontrei edificado na COS 2023 junto ao toque: usei um círculo de 60 m como aglomerado. Toque mais perto das casas para um resultado melhor.", "No built-up area found in COS 2023 near the tap: a 60 m circle was used. Tap closer to the houses for a better result.") + "</div>";
    // acções
    h += "<h4>" + t("O que fazer na faixa", "What to do in the belt") + "</h4><table class='ac'><tr><th>" + t("Acção", "Action") + "</th><th class='n'>ha</th><th class='n'>€/ha</th><th class='n'>€</th></tr>";
    ACCOES.forEach(function (a) {
      var v = res.porAccao[a.k]; if (!v) return;
      h += "<tr><td><i class='c' style='background:" + a.cor + "'></i>" + esc(a.n) + "</td><td class='n'>" + fmt(v, 2) + "</td><td class='n'>" +
        (a.eur || EUR[a.k] ? "<input class='e' type='number' min='0' step='50' data-eur='" + a.k + "' value='" + (EUR[a.k] || 0) + "' aria-label='€/ha'>" : "–") +
        "</td><td class='n' data-sub='" + a.k + "'>" + fmt(v * (EUR[a.k] || 0)) + "</td></tr>";
    });
    h += "<tr class='tot'><td>" + t("Total indicativo", "Indicative total") + "</td><td class='n'>" + fmt(res.haFaixa, 2) + "</td><td></td><td class='n' data-tot>" + fmt(custoTotal(res)) + " €</td></tr></table>";
    h += "<small>" + t("Custos por hectare de partida, editáveis. Servem para comparar cenários, não são orçamento.", "Starting costs per hectare, editable. For comparing scenarios, not a quote.") + "</small>";
    h += blocoVias(res) + "<div data-past-bloco>" + blocoPast(res) + "</div>";
    // perigosidade
    if (res.perigo) {
      var ord = ["muito alta", "alta", "média", "baixa", "muito baixa"], pos = function (k) { var i = ord.indexOf(String(k).toLowerCase()); return i < 0 ? 9 : i; }, ks = Object.keys(res.perigo).sort(function (a, b) { return pos(a) - pos(b); });
      h += "<h4>" + t("Perigosidade de incêndio rural", "Rural wildfire hazard") + "</h4><table>";
      ks.forEach(function (k) { h += "<tr><td>" + esc(k === "?" ? t("Sem classe", "Unclassified") : k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()) + "</td><td class='n'>" + fmt(res.perigo[k], 2) + " ha</td><td class='n'>" + fmt(100 * res.perigo[k] / res.haFaixa) + " %</td></tr>"; });
      h += "</table>";
    }
    // cadastro
    if (res.predios) {
      var cob = res.haFaixa ? 100 * res.haCad / res.haFaixa : 0;
      h += "<h4>" + t("Prédios do cadastro", "Cadastral parcels") + "</h4><p><b>" + res.predios.length + "</b> " + t("prédios tocam a faixa", "parcels touch the belt") + " · " + fmt(Math.min(cob, 100)) + " % " + t("da faixa com cadastro geométrico", "of the belt with geometric cadastre") + "</p>";
      if (cob < 80) h += "<div class='av'>" + t("Parte da faixa não tem cadastro geométrico na DGT (o BUPi não está incluído). Os prédios em falta têm de vir da câmara, do BUPi ou dos proprietários.", "Part of the belt has no geometric cadastre at DGT (BUPi is not included). Missing parcels must come from the municipality, BUPi or the owners.") + "</div>";
      if (res.predios.length) {
        h += "<details><summary>" + t("Ver a lista", "Show the list") + "</summary><table><tr><th>" + t("Prédio", "Parcel") + "</th><th class='n'>" + t("na faixa", "in belt") + "</th><th class='n'>total</th></tr>";
        res.predios.slice(0, 200).forEach(function (p) { h += "<tr><td>" + esc(p.ref) + "</td><td class='n'>" + fmt(p.ha, 3) + "</td><td class='n'>" + (p.haTotal ? fmt(p.haTotal, 3) : "–") + "</td></tr>"; });
        h += "</table></details>";
      }
    }
    // ocupação detalhada
    var cl = Object.keys(res.porClasse).sort(function (a, b) { return res.porClasse[b] - res.porClasse[a]; });
    h += "<details><summary>" + t("Ocupação do solo (COS 2023) em detalhe", "Land cover (COS 2023) in detail") + "</summary><table>";
    cl.forEach(function (k) { h += "<tr><td>" + esc(k) + "</td><td class='n'>" + fmt(res.porClasse[k], 2) + " ha</td></tr>"; });
    h += "</table></details>";
    h += "<div class='bt'><button type='button' class='ac' data-cda-geo>" + t("Descarregar GeoJSON", "Download GeoJSON") + "</button>" +
      (res.predios && res.predios.length ? "<button type='button' data-cda-csv>" + t("Prédios (CSV)", "Parcels (CSV)") + "</button>" : "") +
      "<button type='button' data-cda-de-novo>" + t("Outra aldeia", "Another village") + "</button></div>";
    h += "<p><small>" + t("Faixa de 100 m em torno do aglomerado (Decreto-Lei 82/2021). Dados: DGT (COS 2023, SRUP perigosidade, cadastro predial). Cálculo IPR Atlas.", "100 m belt around the settlement (Decree-Law 82/2021). Data: DGT (COS 2023, hazard, land registry). IPR Atlas computation.") + "</small></p>";
    h += "<div class='org' data-cda-org><small>" + t("A ver se pode criar este condomínio como organização…", "Checking whether you can create this condominium as an organisation…") + "</small></div>";
    abrirPainel(h);
    blocoOrg();
  }

  // ---------- criar o condomínio como organização (m93992) ----------
  var AJAX = "/wp-admin/admin-ajax.php", ctx = null;
  function contexto() {
    if (ctx) return Promise.resolve(ctx);
    return fetch(AJAX + "?action=tcd_cda_contexto", { credentials: "same-origin" }).then(function (r) { return r.text(); })
      .then(function (x) { var j = null; try { j = JSON.parse(x); } catch (e) {} ctx = j && j.success ? j.data : { fora: 1 }; return ctx; })
      .catch(function () { return { fora: 1, erro: 1 }; });
  }
  function tipoDe(o) { if (o.modelo === "municipio" && /junta|freguesia/i.test(o.nome)) return "co-gestao"; if (o.modelo === "municipio") return "tutela"; return "parceria"; }
  function permDe(tp) { return tp === "parceria" ? "editar" : "administrar"; }
  function perto(c) { var p = String(c.ll || "").split(",").map(Number); return p.length === 2 && Math.abs(p[0] - ultimo.ll[0]) < 0.0012 && Math.abs(p[1] - ultimo.ll[1]) < 0.0009; }
  function linhaOrg(o) {
    var tp = tipoDe(o), pm = permDe(tp), op = function (v, l, sel) { return "<option value='" + v + "'" + (v === sel ? " selected" : "") + ">" + esc(l) + "</option>"; };
    return "<label class='ro' data-nome='" + esc(o.nome.toLowerCase()) + "'><input type='checkbox' data-rel='" + o.id + "'> <span>" + esc(o.nome) + "</span>" +
      "<select data-rel-tipo='" + o.id + "'>" + op("tutela", t("tutela", "oversight"), tp) + op("co-gestao", t("co-gestão", "co-management"), tp) + op("parceria", t("parceria", "partner"), tp) + op("financiamento", t("financiamento", "funder"), tp) + op("rede", t("rede", "network"), tp) + "</select>" +
      "<select data-rel-perm='" + o.id + "'>" + op("administrar", t("administra", "manages"), pm) + op("editar", t("edita", "edits"), pm) + op("ver", t("vê", "views"), pm) + op("agregados", t("só números", "totals only"), pm) + "</select></label>";
  }
  function blocoOrg() {
    var cx = painel && painel.querySelector("[data-cda-org]"); if (!cx || !ultimo) return;
    contexto().then(function (c) {
      cx = painel && painel.querySelector("[data-cda-org]"); if (!cx) return;
      if (c.fora) { cx.innerHTML = "<h4>" + t("Criar este condomínio", "Create this condominium") + "</h4><p><small>" + t("Para guardar este condomínio como organização no IPR Atlas, com as camadas, os prédios e quem o gere, ", "To save this condominium as an IPR Atlas organisation, with its layers, parcels and managers, ") + "<a href='/conta/?redirect_to=" + encodeURIComponent(location.pathname + "?condominio=" + ultimo.ll.join(",")) + "'>" + t("entre na sua conta", "sign in") + "</a>.</small></p>"; return; }
      var ja = (c.meus || []).filter(perto)[0];
      if (ja) { var pode = /dono|gestor|editor/.test(ja.papel || ""); cx.innerHTML = "<h4>" + t("Condomínio já criado", "Condominium already created") + "</h4><p>" + esc(ja.nome) + (ja.papel ? " · " + esc(ja.papel) : "") + "</p><div class='bt'><a class='ac' href='/oficina/'>" + t("Abrir na Oficina", "Open in the Workshop") + "</a>" + (pode && ((ultimo.vias && ultimo.vias.length) || (ultimo.parcelas && ultimo.parcelas.length)) ? "<button type='button' data-cda-juntar='" + ja.id + "'>" + t("Juntar bermas e pastoreio", "Add road strips and grazing") + "</button>" : "") + "</div><div class='rs' data-cda-res></div>"; return; }
      if (!c.pode) { cx.innerHTML = "<h4>" + t("Criar este condomínio", "Create this condominium") + "</h4><p><small>" + t("Só quem gere uma organização no IPR Atlas (município, junta, associação) cria condomínios. Escreva-nos para info@terracruadesign.pt.", "Only managers of an IPR Atlas organisation (municipality, parish, association) can create condominiums. Write to info@terracruadesign.pt.") + "</small></p>"; return; }
      var orgs = (c.orgs || []).slice().sort(function (a, b) { return (b.gere - a.gere) || ((b.modelo === "municipio") - (a.modelo === "municipio")) || a.nome.localeCompare(b.nome); });
      cx.innerHTML = "<h4>" + t("Criar este condomínio", "Create this condominium") + "</h4>" +
        "<p><small>" + t("Fica uma organização própria no IPR Atlas, com a área, a faixa, o plano de acções e os prédios por contactar. Escolha as entidades que o acompanham: quem as gere entra no condomínio com o papel indicado.", "It becomes its own IPR Atlas organisation, with the area, the belt, the action plan and the parcels to contact. Pick the bodies involved: their managers join with the chosen role.") + "</small></p>" +
        "<p><input type='text' data-cda-nome value='" + esc(ultimo.nome || "") + "' placeholder='" + t("nome da aldeia", "village name") + "'></p>" +
        (orgs.length > 6 ? "<p><input type='search' data-cda-filtro placeholder='" + t("procurar entidade", "search body") + "'></p>" : "") +
        "<div class='rl'>" + orgs.map(linhaOrg).join("") + "</div>" +
        "<div class='bt'><button type='button' class='ac' data-cda-criar>" + t("Criar este condomínio", "Create this condominium") + "</button></div><div class='rs' data-cda-res></div>";
    });
  }
  function fc(f) { return { type: "FeatureCollection", features: [f] }; }
  function extras(f, u) {
    if (u.vias && u.vias.length) f.append("viaria", JSON.stringify({ type: "FeatureCollection", features: u.vias }));
    if (u.parcelas && u.parcelas.length) f.append("pastoreio", JSON.stringify({ type: "FeatureCollection", features: u.parcelas.map(function (p) { var q = Object.assign({}, p.properties); delete q.tipo; delete q.rumo; q.eur_ha = EUR_PAST; return { type: "Feature", geometry: p.geometry, properties: q }; }) }));
  }
  function extrasPara(org) { // bermas e pastoreio (m93993)
    var f = new FormData(); f.append("action", "tcd_cda_juntar"); f.append("n", ctx.n); f.append("org", org); extras(f, ultimo);
    if (!f.has("viaria") && !f.has("pastoreio")) return Promise.resolve(null);
    return fetch(AJAX, { method: "POST", body: f, credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) { return j && j.success ? j.data : null; }).catch(function () { return null; });
  }
  function juntar(b) {
    var cx = painel.querySelector("[data-cda-org]"), out = cx.querySelector("[data-cda-res]"), f = new FormData();
    f.append("action", "tcd_cda_juntar"); f.append("n", ctx.n); f.append("org", b.getAttribute("data-cda-juntar")); extras(f, ultimo);
    b.disabled = true; out.textContent = t("A juntar…", "Adding…");
    fetch(AJAX, { method: "POST", body: f, credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.success) { out.textContent = t("Juntei ao condomínio: ", "Added to the condominium: ") + Object.keys(j.data.camadas).map(function (k) { return (k === "viaria" ? t("bermas da estrada", "road strips") : t("parcelas de pastoreio", "grazing plots")) + (typeof j.data.camadas[k] === "number" ? "" : " (" + j.data.camadas[k] + ")"); }).join(", ") + "."; }
      else { b.disabled = false; out.textContent = (j && j.data) || t("Não foi possível juntar.", "Could not add."); }
    }).catch(function () { b.disabled = false; out.textContent = t("Sem ligação. Tente de novo.", "No connection. Try again."); });
  }
  function criar(b) {
    var cx = painel.querySelector("[data-cda-org]"), out = cx.querySelector("[data-cda-res]"), nome = (cx.querySelector("[data-cda-nome]").value || "").trim();
    if (!nome) { out.textContent = t("Falta o nome da aldeia.", "Village name missing."); return; }
    var rels = [];
    cx.querySelectorAll("[data-rel]").forEach(function (i) { if (!i.checked) return; var id = i.getAttribute("data-rel"); rels.push({ org: +id, tipo: cx.querySelector("[data-rel-tipo='" + id + "']").value, perm: cx.querySelector("[data-rel-perm='" + id + "']").value }); });
    var T = W.turf, u = ultimo, per = u.perigo || {}, alta = 0; Object.keys(per).forEach(function (k) { if (/alta/i.test(k)) alta += per[k]; });
    var f = new FormData();
    f.append("action", "tcd_cda_criar"); f.append("n", ctx.n); f.append("nome", nome); f.append("ll", u.ll.map(function (x) { return x.toFixed(6); }).join(","));
    f.append("area", JSON.stringify(fc(Object.assign({}, u.area, { properties: { tipo: "area_condominio", ha: +ha(T.area(u.area)).toFixed(3) } }))));
    f.append("faixa", JSON.stringify(fc(Object.assign({}, u.faixa, { properties: { tipo: "faixa_100m", ha: +u.haFaixa.toFixed(3) } }))));
    f.append("aglo", JSON.stringify(fc(Object.assign({}, u.aglo, { properties: { tipo: "aglomerado", ha: +u.haAglo.toFixed(3) } }))));
    if (u.manchas.length) f.append("accoes", JSON.stringify({ type: "FeatureCollection", features: u.manchas.map(function (m) { var p = Object.assign({}, m.properties); p.eur_ha = EUR[p.accao] || 0; p.eur = Math.round(p.ha * p.eur_ha); p.estado = "proposta"; return { type: "Feature", geometry: m.geometry, properties: p }; }) }));
    if (u.predios && u.predios.length) f.append("predios", JSON.stringify({ type: "FeatureCollection", features: u.predios.map(function (p) { return { type: "Feature", geometry: p.geo, properties: { ref: p.ref, ha_na_faixa: +p.ha.toFixed(4), ha_total: +(p.haTotal || 0).toFixed(4) } }; }) }));
    f.append("resumo", JSON.stringify({ faixa_ha: +u.haFaixa.toFixed(2), aglo_ha: +u.haAglo.toFixed(2), custo_eur: Math.round(custoTotal(u)), cadastro_pct: u.haCad ? Math.round(100 * u.haCad / u.haFaixa) : 0, predios: (u.predios || []).length, perigo_alta_pct: u.haFaixa ? Math.round(100 * alta / u.haFaixa) : 0 }));
    f.append("rels", JSON.stringify(rels));
    b.disabled = true; out.textContent = t("A criar…", "Creating…");
    fetch(AJAX, { method: "POST", body: f, credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.success) return extrasPara(j.data.org).then(function (x) { if (x && x.camadas) Object.keys(x.camadas).forEach(function (k) { j.data.camadas[k] = x.camadas[k]; }); return j; });
      return j;
    }).then(function (j) {
      if (j && j.success) {
        ctx = null; var d = j.data, n = Object.keys(d.camadas || {}).filter(function (k) { return typeof d.camadas[k] === "number"; }).length;
        cx.innerHTML = "<h4>" + t("Condomínio criado", "Condominium created") + "</h4><p>" + esc(d.nome) + "<br><small>" + n + " " + t("camadas", "layers") + ", " + (d.rels || []).length + " " + t("entidades ligadas", "linked bodies") + (d.codigo ? ", " + t("código de convite", "invite code") + " " + esc(d.codigo) : "") + ".</small></p><div class='bt'><a class='ac' href='" + esc(d.oficina) + "'>" + t("Abrir na Oficina", "Open in the Workshop") + "</a></div>";
      } else { b.disabled = false; var m = j && j.data; out.textContent = (m && m.m) || (typeof m === "string" ? m : t("Não foi possível criar.", "Could not create.")); }
    }).catch(function () { b.disabled = false; out.textContent = t("Sem ligação. Tente de novo.", "No connection. Try again."); });
  }

  function blocoVias(res) {
    var h = "<h4>" + t("Bermas da estrada (10 m de cada lado)", "Roadside strips (10 m each side)") + "</h4>";
    if (!res.vias) return h + "<p><small>" + t("Não consegui ler as estradas do OpenStreetMap agora.", "Could not read OpenStreetMap roads right now.") + "</small></p>";
    if (!res.vias.length) return h + "<p><small>" + t("Sem estradas cartografadas na zona.", "No mapped roads nearby.") + "</small></p>";
    h += "<p><b>" + fmt(res.haVia, 1) + " ha</b>" + (res.viaKm ? " " + t("em", "along") + " " + fmt(res.viaKm, 1) + " km " + t("de vias", "of roads") : "") + " · " + fmt(res.haViaFora, 1) + " ha " + t("fora da faixa de 100 m", "outside the 100 m belt") + "</p><table>";
    Object.keys(res.viaEnt).sort(function (a, b) { return res.viaEnt[b] - res.viaEnt[a]; }).forEach(function (k) { h += "<tr><td>" + esc(k) + "</td><td class='n'>" + fmt(res.viaEnt[k], 2) + " ha</td></tr>"; });
    return h + "</table><small>" + t("A lei põe a gestão destas faixas a cargo de quem gere a via. São contínuas e fáceis de percorrer: boas para começar o pastoreio e para estudar a vegetação. Vias do OpenStreetMap; quem gere cada via está por confirmar.", "The law puts these strips on whoever manages the road. Continuous and easy to walk: good to start grazing and to study vegetation. Roads from OpenStreetMap; road managers to be confirmed.") + "</small>";
  }
  function blocoPast(res) {
    var h = "<h4>" + t("Pastoreio (cabras e ovelhas)", "Grazing (goats and sheep)") + "</h4>";
    if (!res.parcelas || !res.parcelas.length) return h + "<p><small>" + t("Sem área pastável identificada.", "No grazeable area found.") + "</small></p>";
    var n = res.parcelas.length;
    h += "<p>" + t("Área pastável", "Grazeable area") + ": <b>" + fmt(res.haPast, 1) + " ha</b> (" + t("matos, pinhal, folhosas e bermas", "shrubland, pine, broadleaves and road strips") + ") · <b>" + n + "</b> " + t("parcelas de rotação", "rotation plots") + "</p>";
    h += "<p class='pp'><label>" + t("Parcelas", "Plots") + " <input class='e' type='number' min='2' max='40' data-past='parcelas' value='" + PARCELAS + "'></label> <label>" + t("dias por parcela", "days per plot") + " <input class='e' type='number' min='1' max='90' data-past='dias' value='" + DIAS + "'></label> <label>€/ha <input class='e' type='number' min='0' step='50' data-past='eur' value='" + EUR_PAST + "'></label></p>";
    h += "<p><small>" + t("Uma volta completa leva", "A full round takes") + " <b data-past-ciclo>" + n * DIAS + "</b> " + t("dias.", "days.") + " <span data-past-comp>" + compPast(res) + "</span></small></p>";
    return h + "<small>" + t("Proposta de partida para acertar com o pastor: número de animais, cercas móveis, água e datas. As parcelas pares descansam na Primavera para dar flor às abelhas. O fogo controlado fica como último recurso.", "Starting proposal to settle with the herder: herd size, mobile fencing, water and dates. Even plots rest in spring to flower for bees. Prescribed fire is the last resort.") + "</small>";
  }
  function compPast(res) {
    if (!EUR_PAST) return t("Ponha o €/ha combinado com o pastor para comparar com meios mecânicos.", "Enter the €/ha agreed with the herder to compare with machinery.");
    var mec = 0; res.manchas.forEach(function (m) { if (PAST[m.properties.accao]) mec += m.properties.ha * (EUR[m.properties.accao] || 0); });
    var p = res.haPast * EUR_PAST; return t("Com pastoreio", "With grazing") + ": " + fmt(p) + " € · " + t("mecânico na mesma área da faixa", "machinery on the same belt area") + ": " + fmt(mec) + " €.";
  }

  function mudouEur(e) {
    var i = e.target;
    if (i && i.hasAttribute && i.hasAttribute("data-past") && ultimo) {
      var k = i.getAttribute("data-past"), v = +i.value || 0;
      if (k === "eur") { EUR_PAST = Math.max(0, v); }
      if (k === "dias") { DIAS = Math.min(90, Math.max(1, v)); (ultimo.parcelas || []).forEach(function (p) { p.properties.dias = DIAS; }); }
      if (k === "parcelas" && v >= 2 && v <= 40 && v !== PARCELAS) { PARCELAS = v; clearTimeout(i.__t); i.__t = setTimeout(function () { pastoreio(W.turf, ultimo); desenhar(ultimo); var bl = painel.querySelector("[data-past-bloco]"); if (bl) bl.innerHTML = blocoPast(ultimo); }, 600); return; }
      var cy = painel.querySelector("[data-past-ciclo]"); if (cy) cy.textContent = (ultimo.parcelas || []).length * DIAS;
      var cp = painel.querySelector("[data-past-comp]"); if (cp) cp.textContent = compPast(ultimo);
      return;
    }
    if (i && i.hasAttribute && i.hasAttribute("data-cda-filtro")) { var q = i.value.toLowerCase(); painel.querySelectorAll(".ro").forEach(function (l) { l.style.display = !q || l.getAttribute("data-nome").indexOf(q) >= 0 ? "" : "none"; }); return; } if (!i || !i.hasAttribute || !i.hasAttribute("data-eur") || !ultimo) return;
    var k = i.getAttribute("data-eur"); EUR[k] = Math.max(0, +i.value || 0);
    var sub = painel.querySelector("[data-sub='" + k + "']"); if (sub) sub.textContent = fmt((ultimo.porAccao[k] || 0) * EUR[k]);
    var tot = painel.querySelector("[data-tot]"); if (tot) tot.textContent = fmt(custoTotal(ultimo)) + " €";
  }

  function baixar(nome, tipo, txt) {
    var b = new Blob([txt], { type: tipo }), a = D.createElement("a");
    a.href = URL.createObjectURL(b); a.download = nome; D.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function slug() { return "condominio-" + (ultimo.nome ? ultimo.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-") : ultimo.ll.map(function (x) { return x.toFixed(4); }).join("_")); }

  function clique(e) {
    var b = e.target.closest && e.target.closest("button"); if (!b) return;
    if (b.id === "ipr-cda-x") return fechar();
    if (b.hasAttribute("data-cda-de-novo")) { tirar(); return iniciar(); }
    if (!ultimo) return;
    if (b.hasAttribute("data-cda-criar")) return criar(b);
    if (b.hasAttribute("data-cda-juntar")) return juntar(b);
    if (b.hasAttribute("data-cda-geo")) {
      var fs = [Object.assign({}, ultimo.area, { properties: { tipo: "area_condominio", ha: +ha(W.turf.area(ultimo.area)).toFixed(3) } }),
                Object.assign({}, ultimo.faixa, { properties: { tipo: "faixa_100m", ha: +ultimo.haFaixa.toFixed(3) } }),
                Object.assign({}, ultimo.aglo, { properties: { tipo: "aglomerado", ha: +ultimo.haAglo.toFixed(3) } })]
        .concat(ultimo.manchas.map(function (f) { var p = Object.assign({}, f.properties); p.eur_ha = EUR[p.accao] || 0; p.eur = Math.round(p.ha * p.eur_ha); return Object.assign({}, f, { properties: p }); }))
        .concat((ultimo.predios || []).map(function (p) { return { type: "Feature", geometry: p.geo, properties: { tipo: "predio", ref: p.ref, ha_na_faixa: +p.ha.toFixed(4), ha_total: p.haTotal } }; }))
        .concat(ultimo.vias || []).concat(ultimo.parcelas || []);
      baixar(slug() + ".geojson", "application/geo+json", JSON.stringify({ type: "FeatureCollection", name: slug(), features: fs }));
    }
    if (b.hasAttribute("data-cda-csv")) {
      var l = ["referencia;ha_na_faixa;ha_total"].concat(ultimo.predios.map(function (p) { return p.ref + ";" + p.ha.toFixed(4).replace(".", ",") + ";" + (p.haTotal ? p.haTotal.toFixed(4).replace(".", ",") : ""); }));
      baixar(slug() + "-predios.csv", "text/csv;charset=utf-8", "﻿" + l.join("\n"));
    }
  }

  // ---------- ligação ao mapa e ao painel da direita ----------
  function ligarMapa() {
    var m = mapa(); if (!m || m.__iprCda) return !!m;
    m.__iprCda = 1;
    m.on("click", function (e) { if (!aEscolher) return; correr([e.lngLat.lng, e.lngLat.lat]); });
    var q = location.search.match(/[?&]condominio=(-?[\d.]+),(-?[\d.]+)/);
    if (q) { var ll = [+q[1], +q[2]]; m.jumpTo({ center: ll, zoom: 16 }); setTimeout(function () { correr(ll); }, 800); }
    return true;
  }
  var CARTAO = "<button type='button' data-cda-abrir>" + t("Condomínio de Aldeia", "Village Condominium") + "<small>" + t("Faixa, prédios e custos", "Belt, parcels and costs") + "</small></button>";
  function cartao() {
    var hs = D.querySelectorAll("#ipe-dir h5");
    for (var i = 0; i < hs.length; i++) {
      if (!/Simuladores|Simulators/i.test(hs[i].textContent)) continue;
      var g = hs[i].nextElementSibling;
      if (g && !g.querySelector("[data-cda-abrir]")) g.insertAdjacentHTML("beforeend", CARTAO);
    }
  }
  D.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-cda-abrir]"); if (b) { e.preventDefault(); iniciar(); } });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && painel) fechar(); });

  var ult = 0, pend = 0;
  function volta() { pend = 0; ult = Date.now(); cartao(); ligarMapa(); }
  function pedir() { if (pend) return; var d = Math.max(0, 250 - (Date.now() - ult)); pend = setTimeout(volta, d); }
  if (W.MutationObserver) new MutationObserver(pedir).observe(D.documentElement, { childList: true, subtree: true });
  var tent = 0, iv = setInterval(function () { volta(); if (ligarMapa() || ++tent > 120) clearInterval(iv); }, 500);

  W.__iprCondominio = { abrir: function (ll) { if (ll) correr(ll); else iniciar(); }, fechar: fechar, ultimo: function () { return ultimo; } };
})();
