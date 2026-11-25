/* IPR Atlas · Plantas do PDM da câmara (cópia IPR do SNIT da DGT). Terracrua Design.
   Nuno, 24/11/2026, 12h23: «As plantas do PDM [...] têm que entrar de forma organizada nas camadas do Atlas. Eu não quero ver
   ali milhares de cenas, tem que ser tudo [recolhido]».
   Uma só entrada no topo das camadas, «Plantas do PDM da câmara», fechada por omissão. Ligada, o Atlas vê em que concelho está o
   centro do mapa (CAOP, pela rota do site /tcd/v1/pedido-produto/caop), lê camadas.terracruadesign.pt/snit/<DICO>/servico.json
   (copiado pelo fluxo dados-snit-pdm) e mostra só as plantas dessa câmara, em dois grupos recolhidos (Ordenamento e
   Condicionantes). Uma planta de cada vez, com a legenda da câmara e a opacidade. Muda de concelho sozinho quando o mapa sai dele.
   Mosaicos: PMTiles raster em camadas.terracruadesign.pt/pmtiles/snit/<srv>__<camada>.pmtiles (z12 a z16).
   Câmara ainda não copiada: diz que a cópia está a decorrer e lembra a camada «Ordenamento (PDM)» (CRUS) que já existe.
   Não mexe no viz.js nem no app.js. Mapa: window.__ipe.mapa. API: window.__iprPdmCamara = {ligar(bool), estado()}.
   Desligar: ?pdmcamara=0.
   v3 (Nuno, 24/11 22h30: «arruma lá as plantas, agrupa-as por concelho e quero ter o download disso tudo pronto»):
   - todas as plantas da câmara (servico.json «todas»), não só as 10 primeiras;
   - «Por concelho»: distrito → concelhos, cada um com o número de plantas copiadas (ou «em cópia»); carregar leva o mapa
     ao concelho e mostra as plantas dele. Nomes e limites dos concelhos: CAOP (ogcapi da DGT, colecção municipios);
   - Intelligence: descarregar cada planta (PMTiles, abre no QGIS 3.32+ e no GDAL 3.8+), a legenda e a lista de todas
     as ligações do concelho (.txt). O Explorer não descarrega.
   v4 (Nuno, 24/11 23h29: «olha bem para aquilo no Chrome e melhora-me o estilo gráfico»): o painel passa a ter o desenho das outras
   secções das camadas (sem caixa, ▾ verde, Geist 13 px, linhas recuadas); o concelho no centro do mapa lê-se primeiro da CAOP da DGT
   (ogcapi, colecção municipios), porque a rota do site /pedido-produto/caop estava a demorar mais de 20 s e o painel ficava vazio. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]pdmcamara=0(&|$)/.test(location.search) || W.__iprPdmCamara) return;
  var R2 = "https://camadas.terracruadesign.pt/";
  var PMT = "https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js";
  var SRC = "ipr-pdmc", LAY = "ipr-pdmc-l";
  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/municipios/items";
  var LISTA = null, LISTA_P = null, DIST = "";
  var S = { antiga: "", antigaOn: false, on: false, dico: "", nome: "", srv: "", camadas: [], escolhida: "", op: 0.75, estado: "", ultimoCentro: "" };
  try { var g = JSON.parse(W.localStorage.getItem("ipr_pdmc") || "{}"); S.op = typeof g.op === "number" ? g.op : 0.75; S.preferida = g.pref || ""; } catch (e) {}
  function guardar() { try { W.localStorage.setItem("ipr_pdmc", JSON.stringify({ op: S.op, pref: S.preferida || "" })); } catch (e) {} }
  function en() { return (D.documentElement.lang || "").slice(0, 2) === "en" || /[?&]lang=en/.test(location.search); }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }

  // ---------- protocolo pmtiles (o Atlas pode já o ter registado) ----------
  var pmPronto = null;
  function pmtiles() {
    if (pmPronto) return pmPronto;
    pmPronto = new Promise(function (ok, mau) {
      function reg() { try { if (!W.__iprPmProto) { var p = new W.pmtiles.Protocol(); W.maplibregl.addProtocol("pmtiles", p.tile); W.__iprPmProto = p; } } catch (e) {} ok(); }
      if (W.pmtiles) return reg();
      var s = D.createElement("script"); s.src = PMT; s.onload = reg; s.onerror = function () { pmPronto = null; mau(new Error("pmtiles")); }; D.head.appendChild(s);
    });
    return pmPronto;
  }

  // ---------- concelho no centro do mapa ----------
  var CACHE = {};
  function dicoDe(p) {
    var v = p.dtmnfr || p.DTMNFR || p.dicofre || p.DICOFRE || p.dtmn || p.DTMN || p.cod_freg || "";
    v = String(v).replace(/\D/g, "");
    return v.length >= 4 ? v.slice(0, 4) : "";
  }
  function concelho(lng, lat, cb) {
    var k = lng.toFixed(2) + "," + lat.toFixed(2);
    if (CACHE[k]) return cb(CACHE[k]);
    var d = 0.0005, bb = [lng - d, lat - d, lng + d, lat + d].map(function (x) { return x.toFixed(5); }).join(",");
    function site() {
      fetch("/wp-json/tcd/v1/pedido-produto/caop?bbox=" + bb, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
        var f = j && j.features && j.features[0], p = (f && f.properties) || {};
        var r = { dico: dicoDe(p), nome: p.municipio || p.concelho || p.Concelho || p.Municipio || "" };
        if (r.dico) CACHE[k] = r; cb(r);
      }).catch(function () { cb({ dico: "", nome: "" }); });
    }
    var ac = W.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 12000);
    // 25/11: o filtro bbox do ogcapi compara envelopes; perto da fronteira vinham dois concelhos e o limit=1 escolhia o vizinho
    // (Santa Comba Dão dava Tábua, Crato dava Alter do Chão). Com mais de um, decide o polígono (descarregado uma vez e guardado).
    function ok(p) { var r = { dico: String(p.dtmn), nome: p.municipio || "" }; CACHE[k] = r; cb(r); }
    fetch(OGC + "?f=json&limit=10&skipGeometry=true&bbox=" + bb, ac ? { signal: ac.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
      var fs = ((j && j.features) || []).filter(function (f) { return f && f.properties && f.properties.dtmn; });
      if (!fs.length) return site();
      if (fs.length === 1) return ok(fs[0].properties);
      Promise.all(fs.map(function (f) { return geo(f.id); })).then(function (gs) {
        for (var i = 0; i < fs.length; i++) if (gs[i] && dentro(lng, lat, gs[i])) return ok(fs[i].properties);
        ok(fs[0].properties);
      }).catch(function () { ok(fs[0].properties); });
    }).catch(site);
  }
  var GEO = {};
  function geo(id) {
    if (GEO[id]) return GEO[id];
    return (GEO[id] = fetch(OGC + "/" + encodeURIComponent(id) + "?f=json").then(function (r) { return r.json(); }).then(function (f) { return f && f.geometry; }).catch(function () { delete GEO[id]; return null; }));
  }
  function anel(x, y, a) {
    var d = false;
    for (var i = 0, j = a.length - 1; i < a.length; j = i++) {
      var xi = a[i][0], yi = a[i][1], xj = a[j][0], yj = a[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
    }
    return d;
  }
  function dentro(x, y, g) {
    var ps = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (var i = 0; i < ps.length; i++) {
      var d = false; for (var k2 = 0; k2 < ps[i].length; k2++) if (anel(x, y, ps[i][k2])) d = !d;
      if (d) return true;
    }
    return false;
  }

  // ---------- plantas da câmara ----------
  var SERV = {}, VAZIO = {};
  function servico(dico, cb) {
    if (SERV[dico] !== undefined) return cb(SERV[dico]);
    fetch(R2 + "snit/" + dico + "/servico.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (j && j.todas && j.todas.length) j.camadas = j.todas;   // v3: todas as plantas
      SERV[dico] = j && j.srv && j.camadas && j.camadas.length ? j : null;
      if (!SERV[dico] && j && j.fim) VAZIO[dico] = 1;   // 25/11: cópia acabada sem plantas (Beja, Proença-a-Nova): não dizer «a ser copiadas»
      cb(SERV[dico]);
    }).catch(function () { SERV[dico] = null; cb(null); });
  }
  // ---------- concelhos (CAOP) ----------
  function lista() {
    if (LISTA) return Promise.resolve(LISTA);
    if (LISTA_P) return LISTA_P;
    try { var c = JSON.parse(W.localStorage.getItem("ipr_pdmc_conc") || "null"); if (c && c.t > Date.now() - 30 * 864e5 && c.l && c.l.length > 250) { LISTA = c.l; return Promise.resolve(LISTA); } } catch (e) {}
    var l = [];
    function pag(o) {
      return fetch(OGC + "?f=json&limit=100&offset=" + o + "&skipGeometry=true").then(function (r) { return r.json(); }).then(function (j) {
        (j.features || []).forEach(function (f) { var p = f.properties || {}; if (p.dtmn && p.nuts1 === "Continente") l.push([p.dtmn, p.municipio, p.distrito_ilha]); });
        if ((j.features || []).length === 100 && o < 1000) return pag(o + 100);
      });
    }
    LISTA_P = pag(0).then(function () {
      l.sort(function (a, b) { return a[1].localeCompare(b[1], "pt"); }); LISTA = l;
      try { W.localStorage.setItem("ipr_pdmc_conc", JSON.stringify({ t: Date.now(), l: l })); } catch (e) {}
      return l;
    }).catch(function () { LISTA_P = null; return []; });
    return LISTA_P;
  }
  function irPara(dico) {
    fetch(OGC + "?f=json&limit=1&dtmn=" + dico).then(function (r) { return r.json(); }).then(function (j) {
      var g = j.features && j.features[0] && j.features[0].geometry; if (!g) return;
      var b = [180, 90, -180, -90];
      JSON.stringify(g.coordinates).replace(/\[(-?\d+\.?\d*),(-?\d+\.?\d*)\]/g, function (m, x, y) { x = +x; y = +y; b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; return m; });
      var I = mapa(); if (!I) return;
      if (!S.on) ligar(true);
      S.ultimoCentro = ""; I.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 30, maxZoom: 13 });
    }).catch(function () {});
  }
  function urlPlanta(srv, nome) { return R2 + "pmtiles/snit/" + srv + "__" + nome + ".pmtiles"; }
  function urlLegenda(srv, nome) { return R2 + "snit/" + srv + "/" + nome + "/leg.png"; }
  function txtLigacoes() {
    var l = [t("Plantas do PDM", "PDM plans") + " · " + (S.nome || S.dico) + " (" + S.dico + ")", t("Fonte: Câmara Municipal / DGT, SNIT. Cópia IPR Atlas. Informação indicativa.", "Source: Municipality / DGT, SNIT. Indicative."),
      t("PMTiles raster, EPSG:3857, zoom 12 a 16. Abre no QGIS 3.32+ (Camada › Adicionar camada raster) e no GDAL 3.8+.", "Raster PMTiles, EPSG:3857, zoom 12-16. Opens in QGIS 3.32+ and GDAL 3.8+."), ""];
    S.camadas.forEach(function (x) { l.push(x[1]); l.push(urlPlanta(S.srv, x[0])); l.push(urlLegenda(S.srv, x[0])); l.push(""); });
    var a = D.createElement("a"); a.href = URL.createObjectURL(new Blob([l.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    a.download = "pdm-" + S.dico + "-" + String(S.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase() + ".txt";
    D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function pintarConcelhos(el) {
    if (!el) return;
    lista().then(function (l) {
      if (!l.length) { el.innerHTML = '<div class="es">' + t("Lista de concelhos indisponível.", "Municipality list unavailable.") + "</div>"; return; }
      var ds = []; l.forEach(function (x) { if (ds.indexOf(x[2]) < 0) ds.push(x[2]); }); ds.sort(function (a, b) { return a.localeCompare(b, "pt"); });
      var h = '<select data-pdmc="dist" style="width:100%;margin:4px 0"><option value="">' + t("Escolha o distrito", "Choose district") + "</option>" +
        ds.map(function (d) { return '<option' + (d === DIST ? " selected" : "") + ">" + esc(d) + "</option>"; }).join("") + "</select><div data-pdmc-lc></div>";
      el.innerHTML = h;
      if (DIST) pintarDistrito(el.querySelector("[data-pdmc-lc]"), l);
    });
  }
  function pintarDistrito(box, l) {
    var cs = l.filter(function (x) { return x[2] === DIST; });
    box.innerHTML = cs.map(function (x) { return '<div class="lc" data-pdmc-ir="' + x[0] + '"><span>' + esc(x[1]) + '</span><em data-pdmc-n="' + x[0] + '">…</em></div>'; }).join("");
    cs.forEach(function (x) {
      servico(x[0], function (j) {
        var e = box.querySelector('[data-pdmc-n="' + x[0] + '"]'); if (!e) return;
        e.textContent = j ? j.camadas.length + " " + t("plantas", "plans") : t("em cópia", "copying");
        if (!j) e.className = "nf";
      });
    });
  }
  function grupo(nome) { return /condicionant/i.test(nome) ? "cond" : "ord"; }
  function rotulo(nome) {
    return String(nome).replace(/^Planta\s+de\s+(Ordenamento|Condicionantes)\s*[-–]?\s*/i, "").replace(/^[\dIVX.]+\s*[-–]\s*/, "").trim() || nome;
  }
  function escolherInicial() {
    if (!S.camadas.length) return "";
    var pref = S.preferida || "";
    var c = S.camadas.filter(function (x) { return pref && x[0].indexOf(pref) >= 0; })[0]
      || S.camadas.filter(function (x) { return /Classifica|Qualifica/i.test(x[0]); })[0]
      || S.camadas.filter(function (x) { return grupo(x[1]) === "ord"; })[0] || S.camadas[0];
    return c[0];
  }

  function explorer() { return W.IPR_NIVEL === "explorer"; }
  // Planta antiga (imagem do SNIT pelo proxy do site, catálogo pdm_<DICO>: ajustes.js PDM64 e m92572), usada enquanto a
  // câmara não está copiada. Liga-se pelo próprio visualizador.
  function antigaId(dico) {
    var id = "pdm_" + dico, cat = W.IPRViz && W.IPRViz.catalogo;
    return cat && cat.some && cat.some(function (x) { return x && x.id === id; }) ? id : "";
  }
  function antiga(v) {
    if (!S.antiga) { S.antigaOn = false; return; }
    var z = W.__ipe && W.__ipe.viz;
    try { if (z && typeof z.ligar === "function") z.ligar(S.antiga, !!v); } catch (e) {}
    S.antigaOn = !!v;
  }

  // ---------- entradas antigas escondidas (Nuno, 24/11 13h27: «Esconder já») ----------
  // As subsecções soltas «PDM · planta de condicionantes (imagem)» e «PDM do concelho · planta de condicionantes» e as
  // linhas de cada câmara saem da árvore; o PDM fica todo dentro desta entrada. Só se esconde (nada é apagado).
  var SUBS = ["pdm · planta de condicionantes (imagem)", "pdm do concelho · planta de condicionantes"];
  function norm(x) { return String(x || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function linhaAntiga(x) { return /^planta de condicionantes · /.test(x) || /^pdm · .+ · planta de condicionantes$/.test(x); }
  function esconder(el) { if (el && el.style.display !== "none") { el.style.display = "none"; el.setAttribute("data-pdmc-esc", "1"); } }
  function esconderAntigos() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return;
    var els = cam.querySelectorAll("li,summary,button,span,div,b,strong,label");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest("#ipr-pdmc") || el.closest("[data-pdmc-esc]")) continue;
      var x = norm(el.textContent).replace(/\s*\(?\d+\)?$/, "");
      if (x.length > 90) continue;
      if (SUBS.indexOf(x) >= 0) {
        var sm = el.closest("summary");
        if (sm && sm.parentNode && sm.parentNode.tagName === "DETAILS" && cam.contains(sm.parentNode)) { esconder(sm.parentNode); continue; }
        var li = el.closest("li");
        if (li && cam.contains(li) && norm(li.textContent).length <= x.length + 12) {
          esconder(li);
          if (li.classList.contains("ipr-sub")) { var n = li.nextElementSibling; while (n && !n.classList.contains("ipr-sub")) { esconder(n); n = n.nextElementSibling; } }
          continue;
        }
        var row = el.parentNode && norm(el.parentNode.textContent).length <= x.length + 12 ? el.parentNode : el;
        esconder(row);
        var nx = row.nextElementSibling; if (nx && /^(UL|OL|DIV)$/.test(nx.tagName) && linhaAntiga(norm(nx.textContent).slice(0, 80))) esconder(nx);
        continue;
      }
      if (linhaAntiga(x) && el.querySelector && !el.querySelector("li")) {
        var r = el.closest("li") || el.closest("label") || el;
        if (cam.contains(r) && norm(r.textContent).length <= x.length + 12) esconder(r);
      }
    }
  }

  // ---------- desenho ----------
  function tirar() {
    var I = mapa(); if (!I) return;
    try { if (I.getLayer(LAY)) I.removeLayer(LAY); } catch (e) {}
    try { if (I.getSource(SRC)) I.removeSource(SRC); } catch (e) {}
  }
  function desenhar() {
    var I = mapa(); if (!I || !I.getStyle) return;
    tirar();
    if (!S.on || !S.srv || !S.escolhida) return;
    pmtiles().then(function () {
      var I2 = mapa(); if (!I2) return;
      try {
        I2.addSource(SRC, { type: "raster", url: "pmtiles://" + R2 + "pmtiles/snit/" + S.srv + "__" + S.escolhida + ".pmtiles", tileSize: 256,
          attribution: "Plantas do PDM: Câmara Municipal / DGT · SNIT (cópia IPR)" });
        I2.addLayer({ id: LAY, type: "raster", source: SRC, minzoom: 10, paint: { "raster-opacity": S.op, "raster-resampling": "nearest" } });
      } catch (e) {}
    }).catch(function () { S.estado = t("Não foi possível carregar o leitor de mosaicos.", "Could not load the tile reader."); pintar(); });
  }

  // ---------- painel ----------
  var V = "#94BE39";
  var CSS = "#ipr-pdmc{margin:0 0 4px;padding:5px 0;color:#e9e6da;font:13px/1.45 Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;border-bottom:1px solid rgba(233,230,218,.08)}" +
    "#ipr-pdmc summary{list-style:none;cursor:pointer;display:flex;align-items:center;font-weight:600;color:#e9e6da;user-select:none}" +
    "#ipr-pdmc summary::-webkit-details-marker{display:none}" +
    "#ipr-pdmc summary:before{content:'▾';color:" + V + ";margin:0 6px 0 0;display:inline-block;transform:rotate(-90deg);transition:transform .15s}" +
    "#ipr-pdmc details[open]>summary:before,#ipr-pdmc[open]>summary:before{transform:none}" +
    "#ipr-pdmc summary .n{margin-left:auto;font-weight:600;font-size:12px;color:" + V + "}" +
    "#ipr-pdmc .c{padding:2px 0 0}" +
    "#ipr-pdmc label{display:flex;gap:8px;align-items:flex-start;margin:3px 0 3px 14px;cursor:pointer;color:#e9e6da}" +
    "#ipr-pdmc label span{flex:1;min-width:0}" +
    "#ipr-pdmc input[type=checkbox],#ipr-pdmc input[type=radio]{accent-color:" + V + ";margin-top:3px}" +
    "#ipr-pdmc details{margin:4px 0 2px 14px}#ipr-pdmc details>summary{font-weight:600;font-size:12.5px;color:#cfd6bd}" +
    "#ipr-pdmc details label{margin-left:14px}" +
    "#ipr-pdmc .es{color:#b9bda8;font-size:12px;margin:4px 0 4px 14px}" +
    "#ipr-pdmc .op{display:flex;align-items:center;gap:8px;margin:6px 0 2px 14px;font-size:12px;color:#b9bda8}#ipr-pdmc .op input{flex:1;accent-color:" + V + "}" +
    "#ipr-pdmc img{display:block;max-width:calc(100% - 14px);margin:8px 0 0 14px;background:#fff;border-radius:4px}" +
    "#ipr-pdmc small{color:#9a9e8a;display:block;margin:6px 0 0 14px;font-size:11.5px;line-height:1.4}" +
    "#ipr-pdmc .lc{display:flex;justify-content:space-between;gap:8px;margin:0 0 0 14px;padding:2px 6px;border-radius:4px;cursor:pointer}#ipr-pdmc .lc:hover{background:rgba(148,190,57,.12)}" +
    "#ipr-pdmc .lc em{font-style:normal;color:" + V + ";font-size:12px;white-space:nowrap}#ipr-pdmc .lc em.nf{color:#7d8170}" +
    "#ipr-pdmc a.dl{color:" + V + ";text-decoration:none;font-size:11.5px;white-space:nowrap;opacity:.85}#ipr-pdmc a.dl:hover{opacity:1;text-decoration:underline}" +
    "#ipr-pdmc button.dlt{display:block;margin:8px 0 0 14px;width:calc(100% - 14px);padding:6px 10px;border:1px solid rgba(148,190,57,.45);border-radius:999px;background:transparent;color:#e9e6da;font:600 12px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-pdmc button.dlt:hover{background:rgba(148,190,57,.14)}" +
    "#ipr-pdmc select{display:block;width:calc(100% - 14px);margin:4px 0 4px 14px;background:rgba(20,26,16,.6);color:#e9e6da;border:1px solid rgba(233,230,218,.15);border-radius:6px;padding:4px 6px;font:12.5px Geist,Inter,system-ui,sans-serif}";
  function pintar() {
    var d = D.getElementById("ipr-pdmc"); if (!d) return;
    var c = d.querySelector(".c"); if (!c) return;
    var h = '<label><input type="checkbox" data-pdmc="on"' + (S.on ? " checked" : "") + "> <span>" + t("Mostrar a planta da câmara onde está o mapa", "Show the plan of the municipality in view") + "</span></label>";
    if (S.on) {
      if (S.estado) h += '<div class="es">' + esc(S.estado) + "</div>";
      if (S.antiga) h += '<label><input type="checkbox" data-pdmc="antiga"' + (S.antigaOn ? " checked" : "") + "> <span>" + t("Planta de condicionantes (imagem publicada pela câmara)", "Constraints plan (image published by the municipality)") + "</span></label>";
      if (explorer()) h += "<small>" + t("As plantas completas do PDM de cada câmara fazem parte do IPR Atlas Intelligence. Membros da Ordem dos Engenheiros: regenerativo.pt/ordem-dos-engenheiros.",
        "Full municipal PDM plans are part of IPR Atlas Intelligence.") + "</small>";
      if (S.camadas.length) {
        ["ord", "cond"].forEach(function (gr) {
          var l = S.camadas.filter(function (x) { return grupo(x[1]) === gr; }); if (!l.length) return;
          var aberto = l.some(function (x) { return x[0] === S.escolhida; });
          h += "<details" + (aberto ? " open" : "") + "><summary>" + (gr === "ord" ? t("Planta de Ordenamento", "Zoning plan") : t("Planta de Condicionantes", "Constraints plan")) + '<span class="n">' + l.length + "</span></summary>";
          l.forEach(function (x) { h += '<label><input type="radio" name="ipr-pdmc-r" data-pdmc-c="' + esc(x[0]) + '"' + (x[0] === S.escolhida ? " checked" : "") + "> <span>" + esc(rotulo(x[1])) + "</span>" +
            (explorer() ? "" : '<a class="dl" download href="' + esc(urlPlanta(S.srv, x[0])) + '" title="' + esc(t("Descarregar esta planta (PMTiles, abre no QGIS)", "Download this plan (PMTiles)")) + '">↓ PMTiles</a>') + "</label>"; });
          h += "</details>";
        });
        h += '<div class="op">' + t("Opacidade", "Opacity") + ' <input type="range" min="0.2" max="1" step="0.05" value="' + S.op + '" data-pdmc="op"></div>';
        if (!explorer()) h += '<button type="button" class="dlt" data-pdmc="txt">' + t("Descarregar todas as plantas deste concelho (lista de ligações)", "Download all plans of this municipality (link list)") + "</button>" +
          "<small>" + t("PMTiles abre no QGIS 3.32 ou mais recente. A lista traz as ligações de todas as plantas e legendas.", "PMTiles opens in QGIS 3.32+. The list has every link.") + "</small>";
        if (S.escolhida) h += '<img alt="' + esc(t("Legenda da planta", "Plan legend")) + '" src="' + esc(R2 + "snit/" + S.srv + "/" + S.escolhida + "/leg.png") + '" onerror="this.remove()">';
        h += "<small>" + t("Fonte: Câmara Municipal, plantas do PDM publicadas no SNIT (DGT), copiadas pelo IPR. Informação indicativa: não substitui as plantas oficiais nem a consulta à câmara.",
          "Source: Municipality, PDM plans published on SNIT (DGT), copied by IPR. Indicative only.") + "</small>";
      }
    } else {
      h += "<small>" + t("Uma câmara de cada vez: ao ligar, aparecem só as plantas do concelho onde está o mapa, e mudam sozinhas quando muda de concelho.",
        "One municipality at a time: only the plans of the municipality in view appear, and they change by themselves.") + "</small>";
    }
    h += '<details data-pdmc="conc"' + (DIST ? " open" : "") + "><summary>" + t("Por concelho", "By municipality") + '</summary><div data-pdmc-cl></div></details>';
    c.innerHTML = h;
    var dc = c.querySelector('[data-pdmc="conc"]');
    if (dc && dc.open) pintarConcelhos(dc.querySelector("[data-pdmc-cl]"));
    if (dc) dc.addEventListener("toggle", function () { if (dc.open) pintarConcelhos(dc.querySelector("[data-pdmc-cl]")); });
  }
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-pdmc")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("details"); d.id = "ipr-pdmc";
    d.innerHTML = "<summary>" + t("Plantas do PDM da câmara", "Municipal PDM plans") + '</summary><div class="c"></div>';
    cam.insertBefore(d, cam.firstChild);
    d.addEventListener("change", function (e) {
      var x = e.target;
      if (x.getAttribute("data-pdmc") === "on") { ligar(x.checked); return; }
      if (x.getAttribute("data-pdmc") === "antiga") { antiga(x.checked); pintar(); return; }
      if (x.getAttribute("data-pdmc") === "dist") { DIST = x.value; var cl = x.closest("[data-pdmc-cl]"); if (cl) lista().then(function (l) { var b = cl.querySelector("[data-pdmc-lc]"); if (b && DIST) pintarDistrito(b, l); else if (b) b.innerHTML = ""; }); return; }
      if (x.getAttribute("data-pdmc-c")) { S.escolhida = x.getAttribute("data-pdmc-c"); S.preferida = rotulo(S.escolhida).slice(0, 12); guardar(); desenhar(); pintar(); }
    });
    d.addEventListener("click", function (e) {
      var x = e.target.closest ? e.target.closest("[data-pdmc-ir],[data-pdmc=txt]") : null; if (!x) return;
      if (x.getAttribute("data-pdmc") === "txt") { txtLigacoes(); return; }
      irPara(x.getAttribute("data-pdmc-ir"));
    });
    d.addEventListener("input", function (e) {
      var x = e.target; if (x.getAttribute("data-pdmc") !== "op") return;
      S.op = parseFloat(x.value) || 0.75; guardar();
      var I = mapa(); try { if (I && I.getLayer(LAY)) I.setPaintProperty(LAY, "raster-opacity", S.op); } catch (er) {}
    });
    pintar();
    return true;
  }

  // ---------- seguir o mapa ----------
  function actualizar() {
    var I = mapa(); if (!S.on || !I) return;
    if (I.getZoom() < 10) { S.estado = t("Aproxime o mapa a um concelho (zoom 10 ou mais).", "Zoom in to a municipality (zoom 10+)."); pintar(); return; }
    var c = I.getCenter(), k = c.lng.toFixed(2) + "," + c.lat.toFixed(2);
    if (k === S.ultimoCentro && S.dico) return; S.ultimoCentro = k;
    concelho(c.lng, c.lat, function (r) {
      if (!r.dico) { antiga(false); S.antiga = ""; S.estado = t("Fora do continente ou concelho por identificar.", "Outside mainland Portugal or municipality not found."); S.dico = ""; S.camadas = []; S.srv = ""; tirar(); pintar(); return; }
      if (r.dico === S.dico) return;
      antiga(false); S.antiga = "";
      S.dico = r.dico; S.nome = r.nome;
      servico(r.dico, function (j) {
        if (r.dico !== S.dico) return;
        if (explorer()) j = null;
        if (!j) {
          S.srv = ""; S.camadas = []; S.escolhida = ""; tirar();
          S.antiga = antigaId(r.dico);
          if (S.antiga) antiga(true);
          S.estado = (r.nome ? r.nome + ": " : "") + (explorer() ? (S.antiga ? t("imagem publicada da planta de condicionantes.", "published constraints plan image.") : t("sem planta disponível no Explorer.", "no plan available in Explorer."))
            : (VAZIO[r.dico] ? t("ainda não há plantas desta câmara na cópia do SNIT.", "no plans for this municipality in the SNIT copy yet.") : t("as plantas desta câmara ainda estão a ser copiadas do SNIT.", "this municipality's plans are still being copied.")) + " " + (S.antiga ? t("Entretanto, mostra-se a imagem publicada da planta de condicionantes.", "Meanwhile the published constraints image is shown.")
            : t("Entretanto, use a camada «Ordenamento (PDM)».", "Meanwhile use the «Zoning (PDM)» layer.")));
        } else {
          S.srv = j.srv; S.camadas = j.camadas; S.escolhida = escolherInicial();
          S.estado = (r.nome || t("Concelho ", "Municipality ") + r.dico) + " · " + j.camadas.length + " " + t("plantas", "plans");
          desenhar();
        }
        pintar();
      });
    });
  }
  function ligar(v) {
    S.on = !!v;
    if (!S.on) { tirar(); antiga(false); S.antiga = ""; S.estado = ""; pintar(); return; }
    S.dico = ""; S.ultimoCentro = ""; pintar(); actualizar();
  }
  var preso = false;
  function prender() {
    var I = mapa(); if (!I || preso) return !!preso;
    preso = true;
    var tmp = null;
    I.on("moveend", function () { clearTimeout(tmp); tmp = setTimeout(actualizar, 400); });
    I.on("styledata", function () { if (S.on && S.srv && !I.getLayer(LAY)) setTimeout(desenhar, 50); });
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  setInterval(function () { try { bloco(); esconderAntigos(); } catch (e) {} }, 3000);
  setTimeout(function () { try { new MutationObserver(function () { clearTimeout(W.__iprPdmcMo); W.__iprPdmcMo = setTimeout(function () { try { esconderAntigos(); } catch (e) {} }, 120); })
    .observe(D.getElementById("ipe-cam") || D.body, { childList: true, subtree: true }); } catch (e) {} }, 4000);
  W.__iprPdmCamara = { ligar: ligar, estado: function () { return JSON.parse(JSON.stringify(S)); } };
})();
