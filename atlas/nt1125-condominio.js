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
      r: /agr[ií]col|cultura|olival|vinha|pomar|pastage|hort[ií]col|mosaico|sistemas agroflorestais|arroz/i },
    { k: "agua", n: t("Água", "Water"), cor: "#4fb3d9", eur: 0, r: /[aá]gua|curso|lago|albufeira|zonas h[uú]midas/i },
    { k: "artif", n: t("Edificado e vias (fora da intervenção)", "Built-up and roads (excluded)"), cor: "#9e9e9e", eur: 0,
      r: /artificial|tecido|edif|estrada|equipament|ind[uú]stria|com[eé]rcio|parque|infraestrutura|via/i },
    { k: "outro", n: t("Ver no terreno", "Check on site"), cor: "#8d8d8d", eur: 0, r: /./ }
  ];
  function accaoDe(rot) { for (var i = 0; i < ACCOES.length; i++) if (ACCOES[i].r.test(rot || "")) return ACCOES[i]; return ACCOES[ACCOES.length - 1]; }
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
        var rot = f.properties.cos23_n4_l || f.properties.cos23_n4_c || "?", ac = accaoDe(rot);
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
      res.nome = nomeAldeia(res.ll);
      return res;
    });
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
  var SRC = "ipr-cda", CAMADAS = ["ipr-cda-acc", "ipr-cda-aglo", "ipr-cda-cad", "ipr-cda-faixa"];
  function desenhar(res) {
    var m = mapa(); if (!m) return;
    var fs = res.manchas.slice();
    fs.push(Object.assign({}, res.aglo, { properties: { tipo: "aglo" } }));
    fs.push(Object.assign({}, res.area, { properties: { tipo: "faixa" } }));
    (res.predios || []).forEach(function (p) { fs.push({ type: "Feature", geometry: p.geo, properties: { tipo: "predio", ref: p.ref } }); });
    var fc = { type: "FeatureCollection", features: fs };
    if (m.getSource(SRC)) { m.getSource(SRC).setData(fc); }
    else {
      m.addSource(SRC, { type: "geojson", data: fc });
      m.addLayer({ id: "ipr-cda-acc", type: "fill", source: SRC, filter: ["==", ["get", "tipo"], "accao"], paint: { "fill-color": ["get", "cor"], "fill-opacity": 0.45 } });
      m.addLayer({ id: "ipr-cda-aglo", type: "fill", source: SRC, filter: ["==", ["get", "tipo"], "aglo"], paint: { "fill-color": "#5b5b5b", "fill-opacity": 0.35 } });
      m.addLayer({ id: "ipr-cda-cad", type: "line", source: SRC, filter: ["==", ["get", "tipo"], "predio"], paint: { "line-color": "#ffffff", "line-width": 0.8, "line-opacity": 0.8 } });
      m.addLayer({ id: "ipr-cda-faixa", type: "line", source: SRC, filter: ["==", ["get", "tipo"], "faixa"], paint: { "line-color": "#94BE39", "line-width": 2.5 } });
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
    abrirPainel(h);
  }

  function mudouEur(e) {
    var i = e.target; if (!i || !i.hasAttribute || !i.hasAttribute("data-eur") || !ultimo) return;
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
    if (b.hasAttribute("data-cda-geo")) {
      var fs = [Object.assign({}, ultimo.area, { properties: { tipo: "area_condominio", ha: +ha(W.turf.area(ultimo.area)).toFixed(3) } }),
                Object.assign({}, ultimo.faixa, { properties: { tipo: "faixa_100m", ha: +ultimo.haFaixa.toFixed(3) } }),
                Object.assign({}, ultimo.aglo, { properties: { tipo: "aglomerado", ha: +ultimo.haAglo.toFixed(3) } })]
        .concat(ultimo.manchas.map(function (f) { var p = Object.assign({}, f.properties); p.eur_ha = EUR[p.accao] || 0; p.eur = Math.round(p.ha * p.eur_ha); return Object.assign({}, f, { properties: p }); }))
        .concat((ultimo.predios || []).map(function (p) { return { type: "Feature", geometry: p.geo, properties: { tipo: "predio", ref: p.ref, ha_na_faixa: +p.ha.toFixed(4), ha_total: p.haTotal } }; }));
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
