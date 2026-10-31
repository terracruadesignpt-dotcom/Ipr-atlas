/* IPR Atlas · Correcções dos reportes da equipa e três decisões de marca (Nuno, 29 e 30/10/2026).
   Complemento: não altera os outros ficheiros do Atlas; liga-se pelo DOM e pelo mapa (window.__ipe.mapa).
   1. Marca (decisões do Nuno de 29/10, itens 3-16 a 3-18 do levantamento terracrua/marca-ipr-2026-10-28.md):
      3-16 a camada «Projectos IPR na vizinhança» passa a «Projectos da Terracrua Design», com a fonte
           «Terracrua Design · com autorização dos clientes, localização a cerca de 5 km»;
      3-17 o tema de uma organização sem nome deixa de se chamar «Design · Terracrua Design»: nome de reserva
           «A minha organização» (o nome real da organização, quando existe, continua a aparecer);
      3-18 boas-vindas do Município de Almodôvar assinadas pelos dois: «IPR – Instituto de Planeamento Regenerativo, Lda.
           e Terracrua Design».
   2. Bacias de drenagem da Base (reporte 16462): a cor saía do rótulo (A1, A2…) e bacias vizinhas podiam ficar com a mesma
      cor (sem rótulo, ficavam todas iguais). Agora as cores escolhem-se pelas vizinhas: duas bacias que se tocam nunca
      ficam com a mesma cor (seis cores).
   3. Linhas de escorrência e acumulação de fluxo (reporte 16456): linhas mais escuras, com um contorno claro por baixo para
      se lerem sobre o relevo e a ortofoto; o raster da acumulação com mais contraste.
   4. «Reportar» com captura (reportes 16442 e 16441): na captura da página as caixas ligadas das camadas saíam desligadas
      (a cópia da página só lê atributos) e a caixa de avisos do mapa ficava a meio da imagem. Antes de cada captura o
      estado das caixas e dos campos passa para os atributos, e a caixa de avisos esconde-se enquanto se tira a captura
      (menos quando se está a medir).
   5. Projectos (reporte 16419): quem não é administrador não via como eliminar. Junto de «Arquivar» aparece «Eliminar?»,
      que explica o que cada um faz e como pedir a eliminação.
   6. Encomendar Base com ficheiro KML (reporte 16427): depois de carregar o ficheiro, uma barra pequena explica e permite
      editar os pontos dos polígonos (arrastar, acrescentar a meio de um lado, apagar o ponto escolhido).
   7. Projecto exemplo (reporte 16417): o grupo «Base Cartográfica» aparecia bloqueado sem dizer onde estão as camadas do
      exemplo; passa a ter a ligação «Ver as camadas do projecto exemplo».
   Desligar tudo: window.IPR_CORRECOES_OFF = true; uma parte: window.IPR_CORRECOES_SEM = ["marca", "bacias", …]. */
(function () {
  "use strict";
  if (window.IPR_CORRECOES_OFF || window.__iprCorrecoes) return;
  window.__iprCorrecoes = 1;
  var SEM = window.IPR_CORRECOES_SEM || [];
  function ligado(k) { return SEM.indexOf(k) < 0; }
  function en() { return String(window.IPR_LINGUA || document.documentElement.lang || "pt").toLowerCase().indexOf("pt") !== 0; }
  function mapa() { return window.__ipe && window.__ipe.mapa; }
  function css(id, t) { if (document.getElementById(id)) return; var s = document.createElement("style"); s.id = id; s.textContent = t; (document.head || document.documentElement).appendChild(s); }

  // ---------------------------------------------------------------- 1. Marca (3-16, 3-17, 3-18)
  var F = [
    ["Projectos IPR da Terracrua Design na vizinhança", "Projectos da Terracrua Design na vizinhança"],
    ["Projectos acompanhados pelo IPR na vizinhança", "Projectos da Terracrua Design na vizinhança"],
    ["Projectos IPR na vizinhança", "Projectos da Terracrua Design"],
    ["Terracrua Design · com autorização dos clientes, localização arredondada a cerca de 5 km", "Terracrua Design · com autorização dos clientes, localização a cerca de 5 km"],
    ["Oferta do IPR – Instituto de Planeamento Regenerativo e da Terracrua Design ao Município de Almodôvar.", "Oferta do IPR – Instituto de Planeamento Regenerativo, Lda. e da Terracrua Design ao Município de Almodôvar."],
    ["Offered by IPR – Instituto de Planeamento Regenerativo and Terracrua Design to the Municipality of Almodôvar.", "Offered by IPR – Instituto de Planeamento Regenerativo, Lda. and Terracrua Design to the Municipality of Almodôvar."]
  ];
  // 3-17: só quando a organização da pessoa não tem nome (o app troca o nome em falta por «Terracrua Design»).
  function orgSemNome() {
    try { var d = window.tcdOrg && window.tcdOrg.dados && window.tcdOrg.dados(); return !!(d && d.org && (d.camadas || []).length && !String(d.org.nome || "").trim()); } catch (e) { return false; }
  }
  function tr(s) {
    if (!s) return s;
    if (s.indexOf("vizinhança") >= 0 || s.indexOf("Almodôvar") >= 0 || s.indexOf("5 km") >= 0) {
      for (var i = 0; i < F.length; i++) if (s.indexOf(F[i][0]) >= 0) s = s.split(F[i][0]).join(F[i][1]);
    }
    if (s.indexOf("Design · Terracrua Design") >= 0 && orgSemNome()) s = s.split("Design · Terracrua Design").join("Design · " + (en() ? "My organisation" : "A minha organização"));
    return s;
  }
  function textos(n) {
    if (!n) return;
    if (n.nodeType === 3) { var v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(n.nodeName) || n.isContentEditable) return;
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), x = n;
    do {
      if (x.nodeType === 3) {
        var p = x.parentNode; if (p && (/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName) || p.isContentEditable)) continue;
        var t = tr(x.nodeValue); if (t !== x.nodeValue) x.nodeValue = t;
      } else {
        for (var k = 0, at = ["title", "aria-label"]; k < at.length; k++) { var a = x.getAttribute(at[k]); if (a) { var b = tr(a); if (b !== a) x.setAttribute(at[k], b); } }
      }
    } while ((x = w.nextNode()));
  }

  // ---------------------------------------------------------------- 2. Bacias: cores pelas vizinhas (16462)
  var COR_B = ["#E8A4C8", "#7ECFC0", "#B5D46A", "#9B8EC4", "#F2C46B", "#7FA8E0"];
  var PINTA_B = ["match", ["to-number", ["get", "_ipr_cor"], 0]].concat(COR_B.reduce(function (l, c, i) { return l.concat([i, c]); }, [])).concat(["#9B8EC4"]);
  function chaves(g) {
    var s = {};
    (function per(c) { if (typeof c[0] === "number") s[Math.round(c[0] * 1e5) + "," + Math.round(c[1] * 1e5)] = 1; else for (var i = 0; i < c.length; i++) per(c[i]); })(g.coordinates);
    return s;
  }
  function colorir(fc) {
    var fs = (fc.features || []).filter(function (f) { return f && f.geometry && /Polygon/.test(f.geometry.type); });
    var n = fs.length, viz = [], dono = {};
    for (var i = 0; i < n; i++) {
      viz.push({});
      var ks = chaves(fs[i].geometry);
      for (var k in ks) { var d = dono[k]; if (d) { for (var j in d) if (+j !== i) { viz[i][j] = 1; viz[+j][i] = 1; } d[i] = 1; } else { dono[k] = {}; dono[k][i] = 1; } }
    }
    // Welsh-Powell: das mais ligadas para as menos; cada uma fica com a primeira cor que nenhuma vizinha tem.
    var ordem = fs.map(function (_, i) { return i; }).sort(function (a, b) { return Object.keys(viz[b]).length - Object.keys(viz[a]).length || a - b; });
    var cor = new Array(n);
    ordem.forEach(function (i) {
      var usadas = {}; for (var j in viz[i]) if (cor[+j] != null) usadas[cor[+j]] = 1;
      var c = 0; while (usadas[c] && c < COR_B.length) c++;
      cor[i] = c < COR_B.length ? c : i % COR_B.length;
    });
    var out = { type: "FeatureCollection", features: (fc.features || []).map(function (f) {
      var i = fs.indexOf(f); if (i < 0) return f;
      var p = {}; for (var q in (f.properties || {})) p[q] = f.properties[q]; p._ipr_cor = cor[i];
      return { type: "Feature", id: f.id, properties: p, geometry: f.geometry };
    }) };
    return out;
  }
  function dadosFonte(src) {
    try { var s = src.serialize && src.serialize(); if (s && s.data && typeof s.data === "object" && s.data.features) return s.data; } catch (e) {}
    try { var d = src._data; if (d && d.geojson && d.geojson.features) return d.geojson; if (d && d.features) return d; } catch (e) {} // MapLibre 5 guarda {geojson}
    return null;
  }
  function bacias(m) {
    var ls = (m.getStyle() || {}).layers || [];
    ls.forEach(function (l) {
      if (l.type !== "fill" || !/^(iprv-.*bacias_l.*|ipe-am-.*bacia.*)-f$/.test(l.id)) return;
      var src = m.getSource(l.source); if (!src || src.type !== "geojson") return;
      if (src.__iprCor !== true) {
        var d = dadosFonte(src); if (!d || !d.features || !d.features.length) return;
        src.__iprCor = true;
        try { src.setData(colorir(d)); } catch (e) { return; }
      }
      try { if (JSON.stringify(m.getPaintProperty(l.id, "fill-color")) !== JSON.stringify(PINTA_B)) m.setPaintProperty(l.id, "fill-color", PINTA_B); } catch (e) {}
    });
  }

  // ---------------------------------------------------------------- 3. Escorrência e acumulação mais visíveis (16456)
  var CL = ["to-number", ["get", "classe"], 1];
  var ESC_COR = ["match", CL, 1, "#4a90c8", 2, "#2171b5", 3, "#08519c", 4, "#08306b", "#2171b5"];
  var HALO_ID = "ipr-ce-esc-halo";
  var HALO_W = ["interpolate", ["linear"], ["zoom"], 12, ["match", CL, 4, 3.2, 3, 2.5, 1.9], 16, ["match", CL, 4, 5.2, 3, 4.2, 2, 3.2, 2.4], 19, ["match", CL, 4, 7.5, 3, 5.6, 2, 4.2, 3.1]];
  function escorrencia(m) {
    var ls = (m.getStyle() || {}).layers || [], prin = null, halo = null;
    ls.forEach(function (l) { if (l.type === "line" && l.id.indexOf("iprv-l_escorrencia") === 0) prin = l; if (l.id === HALO_ID) halo = l; });
    if (!prin) { if (halo) try { m.removeLayer(HALO_ID); } catch (e) {} return; }
    try {
      if (JSON.stringify(m.getPaintProperty(prin.id, "line-color")) !== JSON.stringify(ESC_COR)) m.setPaintProperty(prin.id, "line-color", ESC_COR);
      var op = m.getPaintProperty(prin.id, "line-opacity"); if (typeof op === "number" && op < 0.95 && op > 0.4) m.setPaintProperty(prin.id, "line-opacity", 1);
      var vis = m.getLayoutProperty(prin.id, "visibility") || "visible";
      if (!halo) {
        m.addLayer({ id: HALO_ID, type: "line", source: prin.source, minzoom: prin.minzoom || 0, layout: { "line-cap": "round", "line-join": "round", visibility: vis },
          paint: { "line-color": "#ffffff", "line-width": HALO_W, "line-opacity": 0.55, "line-blur": 0.4 } }, prin.id);
      } else if ((m.getLayoutProperty(HALO_ID, "visibility") || "visible") !== vis) m.setLayoutProperty(HALO_ID, "visibility", vis);
      var f = m.getFilter(prin.id); if (JSON.stringify(f || null) !== JSON.stringify(m.getFilter(HALO_ID) || null)) m.setFilter(HALO_ID, f || null);
      var op2 = m.getPaintProperty(prin.id, "line-opacity"), hop = typeof op2 === "number" ? Math.round(0.55 * op2 * 100) / 100 : 0.55;
      if (m.getPaintProperty(HALO_ID, "line-opacity") !== hop) m.setPaintProperty(HALO_ID, "line-opacity", hop);
    } catch (e) {}
  }
  function acumulacao(m) {
    ((m.getStyle() || {}).layers || []).forEach(function (l) {
      if (l.type !== "raster" || !/^(iprv-l_acumulacao|ipe-am-acumulacao)/.test(l.id)) return;
      try {
        if (m.getPaintProperty(l.id, "raster-contrast") !== 0.35) m.setPaintProperty(l.id, "raster-contrast", 0.35);
        if (m.getPaintProperty(l.id, "raster-brightness-max") !== 0.85) m.setPaintProperty(l.id, "raster-brightness-max", 0.85);
        if (m.getPaintProperty(l.id, "raster-saturation") !== 0.25) m.setPaintProperty(l.id, "raster-saturation", 0.25);
      } catch (e) {}
    });
  }

  // ---------------------------------------------------------------- 4. Captura do «Reportar» (16442, 16441)
  function atributos() {
    var is = document.querySelectorAll("input, select");
    for (var i = 0; i < is.length; i++) {
      var e = is[i];
      try {
        if (e.nodeName === "SELECT") { for (var k = 0; k < e.options.length; k++) { var o = e.options[k]; if (o.selected !== o.hasAttribute("selected")) { if (o.selected) o.setAttribute("selected", ""); else o.removeAttribute("selected"); } } continue; }
        var t = (e.type || "").toLowerCase();
        if (t === "checkbox" || t === "radio") { if (e.checked !== e.hasAttribute("checked")) { if (e.checked) e.setAttribute("checked", ""); else e.removeAttribute("checked"); } }
        else if (t === "range" || t === "number" || t === "search" || t === "text") { if (t !== "text" || e.closest("#ipe")) { if (e.getAttribute("value") !== e.value) e.setAttribute("value", e.value); } }
      } catch (x) {}
    }
  }
  var capT = 0;
  function captura() {
    atributos();
    var m = window.__ipe && window.__ipe.estado, medir = m && (m.tool === "regua" || m.tool === "area");
    if (!medir) { document.documentElement.classList.add("ipr-ce-cap"); clearTimeout(capT); capT = setTimeout(fimCaptura, 25000); }
  }
  function fimCaptura() { clearTimeout(capT); document.documentElement.classList.remove("ipr-ce-cap"); }
  if (ligado("captura")) {
    css("ipr-ce-cap-css", "html.ipr-ce-cap #ipe-hud{visibility:hidden!important}");
    document.addEventListener("click", function (e) { var b = e.target && e.target.closest && e.target.closest("[data-cap]"); if (b) captura(); }, true);
    // Acaba quando aparece o recorte, a pré-visualização ou o aviso de falha (o painel volta a abrir).
    new MutationObserver(function () {
      if (!document.documentElement.classList.contains("ipr-ce-cap")) return;
      if (document.querySelector(".tcdr2-crop") || document.querySelector(".tcdr2-p.on")) fimCaptura();
    }).observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  // ---------------------------------------------------------------- 5. «Eliminar?» para quem não é administrador (16419)
  var T5 = {
    pt: { b: "Eliminar?", t: "Como eliminar este projecto", m: "«Arquivar» esconde o projecto da sua lista e não apaga nada; volta com «Mostrar arquivados». Eliminar de vez só a administração do IPR o faz: peça-o na Formiga, em «Reportar um problema», com o número do projecto (#{id}).", ok: "Entendido" },
    en: { b: "Delete?", t: "How to delete this project", m: "“Archive” hides the project from your list and deletes nothing; it comes back with “Show archived”. Only the IPR administration deletes projects for good: ask for it in Formiga, under “Report a problem”, with the project number (#{id}).", ok: "Got it" }
  };
  function eliminar() {
    var P = document.getElementById("ipe-proj"); if (!P) return;
    P.querySelectorAll(".ipe-card .ipr-ca").forEach(function (ca) {
      var arq = ca.querySelector("[data-arq]"); if (!arq) return;
      var ex = ca.querySelector(".ipr-ce-del");
      if (ca.querySelector("[data-pdel]")) { if (ex) ex.remove(); return; } // administrador: já tem «Eliminar»
      var L = en() ? T5.en : T5.pt;
      if (ex) { if (ex.textContent !== L.b) ex.textContent = L.b; return; }
      var b = document.createElement("button"); b.type = "button"; b.className = "ipr-ce-del"; b.textContent = L.b; b.dataset.id = arq.dataset.arq;
      b.setAttribute("aria-expanded", "false");
      arq.insertAdjacentElement("afterend", b);
    });
  }
  if (ligado("eliminar")) {
    css("ipr-ce-del-css", ".ipr-ca .ipr-ce-del{color:var(--mu,#9aa08a)!important;font-style:normal}.ipr-ca .ipr-ce-del:hover{color:var(--tx,#e8e6dc)!important}" +
      ".ipr-ce-nota{flex:1 0 100%;margin:6px 0 2px;padding:8px 10px;border:1px solid var(--ln,rgba(255,255,255,.18));border-radius:6px;font:12.5px/1.45 Inter,sans-serif;color:var(--tx,#e8e6dc);background:var(--p2,transparent)}" +
      ".ipr-ce-nota b{display:block;margin-bottom:3px;font-weight:600}.ipr-ce-nota button{all:unset;cursor:pointer;margin-top:6px;font:600 12px Inter,sans-serif;color:var(--ac,#b5c46a)}");
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".ipr-ce-del, .ipr-ce-nota button"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var ca = b.closest(".ipr-ca"); if (!ca) return;
      var nota = ca.querySelector(".ipr-ce-nota"), bt = ca.querySelector(".ipr-ce-del");
      if (nota) { nota.remove(); if (bt) { bt.setAttribute("aria-expanded", "false"); if (b !== bt) bt.focus(); } return; }
      var L = en() ? T5.en : T5.pt, id = (bt && bt.dataset.id) || "";
      nota = document.createElement("div"); nota.className = "ipr-ce-nota"; nota.setAttribute("role", "note"); nota.id = "ipr-ce-nota-" + id;
      var h = document.createElement("b"); h.textContent = L.t; var p = document.createElement("span"); p.textContent = L.m.replace("{id}", id);
      var ok = document.createElement("button"); ok.type = "button"; ok.textContent = L.ok;
      nota.appendChild(h); nota.appendChild(p); nota.appendChild(document.createElement("br")); nota.appendChild(ok);
      ca.appendChild(nota); if (bt) { bt.setAttribute("aria-expanded", "true"); bt.setAttribute("aria-controls", nota.id); }
    }, true);
  }

  // ---------------------------------------------------------------- 6. Editar os pontos do terreno carregado (16427)
  var T6 = {
    pt: { d: "Para corrigir o limite: clique no polígono e depois num ponto para o arrastar; clique no meio de um lado para acrescentar um ponto.", e: "Editar pontos", a: "Apagar ponto", f: "Concluir", s: "Escolha um ponto (fica destacado) e carregue em «Apagar ponto».", n: "Clique primeiro no polígono a corrigir." },
    en: { d: "To fix the boundary: click the polygon, then a point to drag it; click the middle of a side to add a point.", e: "Edit points", a: "Delete point", f: "Done", s: "Pick a point (it is highlighted) and press “Delete point”.", n: "Click the polygon you want to fix first." }
  };
  function desenho(m) {
    var cs = (m && m._controls) || [];
    for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (c && typeof c.getAll === "function" && typeof c.changeMode === "function" && typeof c.trash === "function") return c; }
    return null;
  }
  function barraPontos() {
    var m = mapa(), est = window.__ipe && window.__ipe.estado, D = m && desenho(m), bar = document.getElementById("ipr-ce-pts");
    var mostra = !!(D && est && est.modo === "encomenda" && D.getAll().features.some(function (f) { return /Polygon/.test(f.geometry.type); }));
    if (!mostra) { if (bar) bar.remove(); return; }
    var L = en() ? T6.en : T6.pt;
    if (!bar) {
      var cont = m.getContainer(); if (!cont) return;
      bar = document.createElement("div"); bar.id = "ipr-ce-pts"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", L.e);
      bar.innerHTML = '<span class="d"></span><span class="b"><button type="button" data-p="e"></button><button type="button" data-p="a"></button><button type="button" data-p="f"></button></span>';
      cont.appendChild(bar);
      ["mousedown", "pointerdown", "touchstart", "dblclick", "wheel"].forEach(function (t) { bar.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
      bar.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; e.preventDefault(); e.stopPropagation();
        var M = mapa(), Dr = M && desenho(M); if (!Dr) return; var L2 = en() ? T6.en : T6.pt, d = bar.querySelector(".d");
        if (b.dataset.p === "e") {
          var sel = Dr.getSelectedIds(), pol = Dr.getAll().features.filter(function (f) { return /Polygon/.test(f.geometry.type); });
          var id = sel.filter(function (x) { return pol.some(function (f) { return f.id === x; }); })[0] || (pol.length === 1 ? pol[0].id : null);
          if (!id) { d.textContent = L2.n; return; }
          Dr.changeMode("direct_select", { featureId: id }); d.textContent = L2.s;
        } else if (b.dataset.p === "a") {
          if (Dr.getMode() !== "direct_select" || !(Dr.getSelectedPoints().features || []).length) { d.textContent = L2.s; return; }
          Dr.trash();
        } else { Dr.changeMode("simple_select"); d.textContent = L2.d; }
      });
    }
    var dd = bar.querySelector(".d"); if (!dd.textContent || (dd.textContent !== L.d && [T6.pt.d, T6.en.d].indexOf(dd.textContent) >= 0)) dd.textContent = L.d;
    var bs = bar.querySelectorAll("button"); [L.e, L.a, L.f].forEach(function (t, i) { if (bs[i].textContent !== t) bs[i].textContent = t; });
    var modo = D.getMode(); bar.classList.toggle("ed", modo === "direct_select");
  }
  if (ligado("pontos")) {
    css("ipr-ce-pts-css", "#ipr-ce-pts{position:absolute;left:50%;transform:translateX(-50%);top:10px;z-index:6;max-width:min(560px,calc(100% - 120px));display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:8px 10px;border-radius:2px;background:var(--p1,rgba(20,26,18,.92));color:var(--tx,#e8e6dc);border:1px solid var(--ln,rgba(255,255,255,.16));font:12.5px/1.4 Inter,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
      "#ipr-ce-pts .d{flex:1 1 220px}#ipr-ce-pts .b{display:flex;gap:6px;flex-wrap:wrap}#ipr-ce-pts button{all:unset;cursor:pointer;min-height:30px;padding:0 10px;display:inline-flex;align-items:center;border:1px solid var(--ln,rgba(255,255,255,.25));border-radius:2px;font:600 12px Inter,sans-serif}" +
      "#ipr-ce-pts button:hover,#ipr-ce-pts button:focus-visible{border-color:var(--ac,#b5c46a);color:var(--ac,#b5c46a)}#ipr-ce-pts:not(.ed) [data-p=a],#ipr-ce-pts:not(.ed) [data-p=f]{display:none}#ipr-ce-pts.ed [data-p=e]{display:none}" +
      "@media (max-width:600px){#ipr-ce-pts{top:auto;bottom:64px;max-width:calc(100% - 24px);width:calc(100% - 24px);box-sizing:border-box}}");
  }

  // ---------------------------------------------------------------- 7. Projecto exemplo: onde estão as camadas da Base (16417)
  var T7 = { pt: "Ver as camadas do projecto exemplo", en: "See the example project layers" };
  function exemplo() {
    var ir = document.querySelector('#ipe-locais [data-am="ir"]'), cx = document.querySelectorAll('#ipe-locais input[data-am]');
    var ex = document.querySelectorAll(".ipr-ce-ex");
    if (!ir || !cx.length) { ex.forEach(function (x) { x.remove(); }); return; }
    var txt = en() ? T7.en : T7.pt;
    // linha bloqueada «17 camadas de relevo, morfologia e hidrologia · Intelligence» do grupo Base Cartográfica (l_resumo, viz.js)
    document.querySelectorAll('#ipe-esq li[data-id="l_resumo"]').forEach(function (linha) {
      if (linha.querySelector(".ipr-ce-ex")) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "ipr-ce-ex"; b.textContent = txt;
      linha.appendChild(b);
    });
    ex.forEach(function (x) { if (x.textContent !== txt) x.textContent = txt; });
  }
  if (ligado("exemplo")) {
    css("ipr-ce-ex-css", ".ipr-ce-ex{all:unset;display:block;cursor:pointer;margin-top:3px;font:600 12px Inter,sans-serif;color:var(--ac,#b5c46a);text-decoration:underline;text-underline-offset:2px}.ipr-ce-ex:focus-visible{outline:2px solid var(--ac,#b5c46a);outline-offset:2px}");
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".ipr-ce-ex"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var sb = document.querySelector('#ipe-esq [data-sb="locais"]'); if (sb && sb.classList.contains("fechado")) { var h = sb.querySelector(".ipe-sbh"); if (h) h.click(); }
      var ir = document.querySelector('#ipe-locais [data-am="ir"]'); if (ir) ir.click();
      var cx = document.querySelectorAll('#ipe-locais input[data-am]');
      if (cx.length && ![].some.call(cx, function (c) { return c.checked; })) cx[0].click();
      var alvo = document.getElementById("ipe-locais"); if (alvo) try { alvo.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (x) {}
    }, true);
  }

  // Catálogo do viz.js (antes de o mapa e a árvore se criarem): nome e fonte da camada 3-16; legenda da escorrência com as
  // cores novas.
  try {
    (window.IPRViz && window.IPRViz.catalogo || []).forEach(function (e) {
      if (!e) return;
      if (e.id === "r_projipr" && ligado("marca")) { e.n = "Projectos da Terracrua Design"; e.fonte = "Terracrua Design · com autorização dos clientes, localização a cerca de 5 km"; }
      if (e.id === "l_escorrencia" && ligado("escorrencia") && e.leg && e.leg.length === 4) { e.leg = [["#4a90c8", e.leg[0][1]], ["#2171b5", e.leg[1][1]], ["#08519c", e.leg[2][1]], ["#08306b", e.leg[3][1]]]; }
    });
  } catch (e) {}

  // ---------------------------------------------------------------- arranque
  function mapaPronto(m) {
    function tudo() {
      if (ligado("bacias")) try { bacias(m); } catch (e) {}
      if (ligado("escorrencia")) { try { escorrencia(m); } catch (e) {} try { acumulacao(m); } catch (e) {} }
    }
    tudo();
    var t = 0;
    m.on("styledata", function () { clearTimeout(t); t = setTimeout(tudo, 60); });
    m.on("sourcedata", function (e) { if (e && e.sourceId && /bacia/.test(e.sourceId) && e.isSourceLoaded) { clearTimeout(t); t = setTimeout(tudo, 60); } });
  }
  var visto = null;
  (function vez(n) {
    var m = mapa();
    if (m && m !== visto && typeof m.on === "function") { visto = m; try { mapaPronto(m); } catch (e) {} } // o Atlas recria o mapa ao mudar de modo
    if (n < 2400) setTimeout(function () { vez(n + 1); }, m ? 1500 : 250);
  })(0);
  var tq = 0;
  function dom() { if (ligado("eliminar")) try { eliminar(); } catch (e) {} if (ligado("exemplo")) try { exemplo(); } catch (e) {} if (ligado("pontos")) try { barraPontos(); } catch (e) {} }
  function arrancar() {
    if (ligado("marca")) try { textos(document.body); } catch (e) {}
    dom();
    new MutationObserver(function (ms) {
      if (ligado("marca")) ms.forEach(function (x) {
        if (x.type === "characterData") textos(x.target);
        else for (var i = 0; i < x.addedNodes.length; i++) textos(x.addedNodes[i]);
      });
      clearTimeout(tq); tq = setTimeout(dom, 120);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(function () { if (!document.hidden && ligado("pontos")) try { barraPontos(); } catch (e) {} }, 1000);
    document.addEventListener("ipr:lingua", function () { setTimeout(function () { try { textos(document.body); } catch (e) {} dom(); }, 50); });
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
  window.__iprCorrecoesT = { colorir: colorir, tr: tr };
})();
