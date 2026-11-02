/* IPR Atlas · camadas do projecto Terracrua Design na ficha da propriedade (Nuno, 2/11/2026, 09h10: «porque não consigo ver
   as camadas de projecto da Terracrua Design? se aparecem as camadas da base, quero ver as camadas do projecto meu, tudo bem
   organizado na ficha de propriedade»; 09h17: «Faz»).
   Acrescento, sem mexer no minhas-bases.js: na Base aberta de «Os meus projectos» (#ipr-mb), por baixo das camadas da Base
   Cartográfica, uma secção «Projecto Terracrua Design» com os ficheiros do projecto já convertidos no servidor (m90353,
   GET /tcd/v1/carregar?projecto=<encomenda>, estado «pronto» com GeoJSON). Cada camada liga e desliga no mapa; «Ligar todas».
   Nomes, ordem e cores vêm do projecto QGIS (.qgs) guardado nos «Ficheiros do projecto» da mesma encomenda (m90381,
   /tcd/v1/pfich?alvo=e:<id>): renderers singleSymbol, categorizedSymbol e RuleRenderer (primeiro símbolo). Sem .qgs, cores
   fixas por ordem. Só aparece a quem tem acesso ao projecto (as rotas já o garantem). A secção é reposta sempre que a lista
   é refeita. Desligar: ?pdesign=0 ou localStorage ipr_pdesign_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]pdesign=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_pdesign_off") === "1") return; } catch (e) {}
  if (W.__iprPDesign) return; W.__iprPDesign = 1;

  var EN = function () { return (W.IPR_LINGUA || "pt") === "en"; };
  var T = {
    tit: ["Projecto Terracrua Design", "Terracrua Design project"],
    todas: ["Ligar todas", "Turn all on"], nenhuma: ["Desligar todas", "Turn all off"],
    vazio: ["Ainda não há camadas de desenho convertidas neste projecto.", "No converted design layers in this project yet."],
    aCarregar: ["A carregar as camadas do projecto…", "Loading project layers…"],
    erro: ["Não foi possível ler as camadas do projecto.", "Could not read the project layers."],
    falha: ["camada sem dados", "layer without data"]
  };
  function t(k) { return T[k][EN() ? 1 : 0]; }
  function I() { return W.__ipe || null; }
  function mapa() { var i = I(); return i && i.mapa; }
  function nonce() { return W.tcdNonce || (W.wpApiSettings && W.wpApiSettings.nonce) || ""; }
  function api(p) { return fetch("/wp-json/tcd/v1/" + p, { credentials: "same-origin", headers: { "X-WP-Nonce": nonce() } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r; }); }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }

  // ---------- dados por projecto ----------
  var P = {}; // id -> {estado, camadas:[{id,nome,ordem,url,estilo}], on:{}}
  var PAL = ["#e07b39", "#4f8edc", "#7bb661", "#c74b50", "#9b6bc3", "#d9a521", "#3fb3a7", "#b0567a"];

  function rgba(v) {
    var p = String(v || "").split(",").map(function (x) { return +x; });
    if (p.length < 3 || p.some(isNaN)) return null;
    return { c: "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")", a: p.length > 3 ? Math.max(0, Math.min(1, p[3] / 255)) : 1 };
  }
  function props(symEl) {
    // Propriedades da primeira camada de símbolo: formato novo (<Option name= value=>) e antigo (<prop k= v=>).
    var o = {}, lay = symEl && symEl.querySelector("layer"); if (!lay) return o;
    [].forEach.call(lay.querySelectorAll("Option[name][value]"), function (x) { o[x.getAttribute("name")] = x.getAttribute("value"); });
    [].forEach.call(lay.querySelectorAll("prop[k][v]"), function (x) { if (!(x.getAttribute("k") in o)) o[x.getAttribute("k")] = x.getAttribute("v"); });
    o.__classe = lay.getAttribute("class") || ""; o.__tipo = symEl.getAttribute("type") || "";
    return o;
  }
  function estiloDe(o) {
    var f = rgba(o.color), l = rgba(o.line_color || o.outline_color || o.color);
    var w = parseFloat(o.line_width || o.outline_width || "0.46") || 0.46;
    var s = { cor: (f || l || {}).c, alpha: f ? f.a : 1, linha: (l || f || {}).c, larg: Math.max(0.6, Math.min(8, w * 3.2)) };
    if (o.style === "no" || /no/i.test(o.style || "") && o.__tipo === "fill") s.semFundo = true;
    if (o.outline_style === "no") s.semLinha = true;
    return s;
  }
  function lerQgs(txt) {
    var out = {}, ordem = 0, doc;
    try { doc = new DOMParser().parseFromString(txt, "text/xml"); } catch (e) { return out; }
    // Ordem da árvore de camadas (de cima para baixo), quando existe.
    var arv = {}; [].forEach.call(doc.querySelectorAll("layer-tree-group layer-tree-layer"), function (x, i) { arv[x.getAttribute("id")] = i; });
    [].forEach.call(doc.querySelectorAll("projectlayers > maplayer, maplayer"), function (ml) {
      var ds = (ml.querySelector("datasource") || {}).textContent || "";
      var m = ds.match(/([^\/\\|]+)\.gpkg/i); if (!m) return;
      var chave = m[1].toLowerCase(), id = (ml.querySelector("id") || {}).textContent || "";
      if (out[chave]) return;
      var nome = (ml.querySelector("layername") || {}).textContent || m[1];
      var r = ml.querySelector("renderer-v2"), e = { nome: nome, ordem: id in arv ? arv[id] : 1000 + (ordem++) };
      if (r) {
        var tipo = r.getAttribute("type");
        var syms = {}; [].forEach.call(r.querySelectorAll(":scope > symbols > symbol"), function (s) { syms[s.getAttribute("name")] = s; });
        if (tipo === "categorizedSymbol") {
          e.campo = r.getAttribute("attr"); e.cat = [];
          [].forEach.call(r.querySelectorAll("categories > category"), function (c) {
            var s = syms[c.getAttribute("symbol")]; if (!s || c.getAttribute("render") === "false") return;
            e.cat.push({ v: c.getAttribute("value"), st: estiloDe(props(s)) });
          });
          var s0 = syms["0"] || r.querySelector("symbols > symbol"); e.st = estiloDe(props(s0));
        } else {
          var s1 = syms["0"] || r.querySelector("symbols > symbol"); e.st = estiloDe(props(s1));
        }
      }
      out[chave] = e;
    });
    return out;
  }
  function carregar(id) {
    if (P[id]) return; P[id] = { estado: "a", camadas: [], on: {} };
    var lista = api("carregar?projecto=" + encodeURIComponent(id)).then(function (r) { return r.json(); });
    var qgs = api("pfich?alvo=" + encodeURIComponent("e:" + id)).then(function (r) { return r.json(); }).then(function (j) {
      var f = (j && j.ficheiros || []).filter(function (x) { return /\.qgs$/i.test(x.nome || ""); })[0];
      if (!f) return {};
      return fetch(String(f.url) + (/\?/.test(f.url) ? "&" : "?") + "dl=1", { credentials: "same-origin", headers: { "X-WP-Nonce": nonce() } })
        .then(function (r) { return r.ok ? r.text() : ""; }).then(lerQgs);
    }).catch(function () { return {}; });
    Promise.all([lista, qgs]).then(function (v) {
      var fs = (v[0] && v[0].ficheiros || []).filter(function (f) { return f.estado === "pronto" && f.geojson; });
      var est = v[1] || {}, n = 0;
      P[id].camadas = fs.map(function (f) {
        var chave = String(f.nome || "").replace(/\.[^.]+$/, "").toLowerCase(), e = est[chave] || {};
        return { id: f.id, nome: e.nome || String(f.nome || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), ordem: e.ordem != null ? e.ordem : 5000 + n, url: f.geojson, e: e, cor: (e.st && e.st.cor) || PAL[(n++) % PAL.length] };
      }).sort(function (a, b) { return a.ordem - b.ordem; });
      P[id].estado = "ok"; pintar();
    }).catch(function () { P[id].estado = "erro"; pintar(); });
  }

  // ---------- mapa ----------
  function cores(e, chave, def) {
    if (e.cat && e.cat.length && e.campo) {
      var m = ["match", ["to-string", ["get", e.campo]]];
      e.cat.forEach(function (c) { if (c.st && c.st[chave]) m.push(String(c.v), c.st[chave]); });
      m.push(def); return m.length > 3 ? m : def;
    }
    return def;
  }
  function ligar(c, on) {
    var M = mapa(); if (!M) return Promise.resolve(false);
    var sid = "ipr-pd-" + c.id, ids = [sid + "-f", sid + "-l", sid + "-p"];
    if (!on) { ids.forEach(function (x) { try { if (M.getLayer(x)) M.setLayoutProperty(x, "visibility", "none"); } catch (e) {} }); return Promise.resolve(true); }
    if (M.getSource(sid)) { ids.forEach(function (x) { try { if (M.getLayer(x)) M.setLayoutProperty(x, "visibility", "visible"); } catch (e) {} }); return Promise.resolve(true); }
    return fetch(c.url, { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (gj) {
      if (M.getSource(sid)) return true;
      M.addSource(sid, { type: "geojson", data: gj });
      var e = c.e || {}, st = e.st || {}, cor = st.cor || c.cor, linha = st.linha || cor;
      if (!st.semFundo) M.addLayer({ id: sid + "-f", type: "fill", source: sid, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": cores(e, "cor", cor), "fill-opacity": Math.min(0.55, (st.alpha != null ? st.alpha : 1) * 0.45) } });
      M.addLayer({ id: sid + "-l", type: "line", source: sid, filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]], paint: { "line-color": cores(e, "linha", linha), "line-width": st.larg || 1.6 } });
      M.addLayer({ id: sid + "-p", type: "circle", source: sid, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": cores(e, "cor", cor), "circle-radius": 4.5, "circle-stroke-color": "#fff", "circle-stroke-width": 1 } });
      return true;
    }).catch(function () { return false; });
  }

  // ---------- interface ----------
  var css = D.createElement("style");
  css.textContent = ".ipr-pdz{margin:8px 0 2px;padding-top:8px;border-top:1px dashed var(--ln,#444)}" +
    ".ipr-pdz h5{margin:0 0 6px;font:600 11px/1.2 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--ac2,var(--ac,#94BE39))}" +
    ".ipr-pdz .acc{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 6px}.ipr-pdz .acc button{font:600 12px Inter,system-ui,sans-serif;border:1px solid var(--ln);background:transparent;color:var(--tx);border-radius:6px;padding:3px 9px;cursor:pointer}" +
    ".ipr-pdz ul{list-style:none;margin:0;padding:0}.ipr-pdz li label{display:flex;align-items:center;gap:8px;padding:4px 2px;cursor:pointer;font:13px/1.3 Inter,system-ui,sans-serif;color:var(--tx)}" +
    ".ipr-pdz li i{flex:none;width:11px;height:11px;border-radius:2px;border:1px solid rgba(0,0,0,.25)}.ipr-pdz li.mau span{opacity:.55}.ipr-pdz .nota{font:12px/1.4 Inter,system-ui,sans-serif;color:var(--mu,#888);margin:2px 0 4px}";
  (D.head || D.documentElement).appendChild(css);

  function seccao(id) {
    var p = P[id], s = el("div", "ipr-pdz"); s.setAttribute("data-pdz", id);
    s.appendChild(el("h5", "", t("tit")));
    if (!p || p.estado === "a") { s.appendChild(el("p", "nota", t("aCarregar"))); return s; }
    if (p.estado === "erro") { s.appendChild(el("p", "nota", t("erro"))); return s; }
    if (!p.camadas.length) { s.appendChild(el("p", "nota", t("vazio"))); return s; }
    var acc = el("div", "acc"), b1 = el("button", "", t("todas")), b2 = el("button", "", t("nenhuma"));
    b1.type = b2.type = "button"; b1.setAttribute("data-pdz-a", "todas"); b2.setAttribute("data-pdz-a", "nenhuma");
    acc.appendChild(b1); acc.appendChild(b2); s.appendChild(acc);
    var ul = el("ul");
    p.camadas.forEach(function (c) {
      var li = el("li", p.mau && p.mau[c.id] ? "mau" : ""), lab = el("label"), ck = el("input"), q = el("i");
      ck.type = "checkbox"; ck.checked = !!p.on[c.id]; ck.setAttribute("data-pdz-c", c.id);
      q.style.background = c.cor; lab.appendChild(ck); lab.appendChild(q);
      var sp = el("span", "", c.nome); if (p.mau && p.mau[c.id]) sp.title = t("falha"); lab.appendChild(sp);
      li.appendChild(lab); ul.appendChild(li);
    });
    s.appendChild(ul);
    return s;
  }
  function baseAberta() {
    var li = D.querySelector("#ipr-mb li.ipr-mb-b.actual.ab") || D.querySelector("#ipr-mb li.ipr-mb-b.actual");
    return li && li.querySelector(".ipr-mb-corpo") ? li : null;
  }
  var aPintar = false;
  function pintar() {
    if (aPintar) return; aPintar = true;
    try {
      [].forEach.call(D.querySelectorAll(".ipr-pdz"), function (x) { var li = x.closest("li.ipr-mb-b"); if (!li || li !== baseAberta()) x.remove(); });
      var li = baseAberta(); if (!li) return;
      var id = li.getAttribute("data-mb"); if (!id) return;
      carregar(id);
      var velho = li.querySelector(".ipr-pdz"), novo = seccao(id);
      if (velho) { if (velho.innerHTML !== novo.innerHTML) velho.replaceWith(novo); }
      else li.querySelector(".ipr-mb-corpo").appendChild(novo);
    } catch (e) {} finally { aPintar = false; }
  }
  D.addEventListener("change", function (e) {
    var ck = e.target; if (!ck || !ck.getAttribute || !ck.hasAttribute("data-pdz-c")) return;
    var s = ck.closest(".ipr-pdz"), id = s && s.getAttribute("data-pdz"), p = P[id]; if (!p) return;
    var c = p.camadas.filter(function (x) { return String(x.id) === ck.getAttribute("data-pdz-c"); })[0]; if (!c) return;
    p.on[c.id] = ck.checked;
    ligar(c, ck.checked).then(function (ok) { if (!ok && ck.checked) { p.mau = p.mau || {}; p.mau[c.id] = 1; p.on[c.id] = false; pintar(); } });
  }, true);
  D.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pdz-a]"); if (!b) return;
    var s = b.closest(".ipr-pdz"), id = s && s.getAttribute("data-pdz"), p = P[id]; if (!p) return;
    var on = b.getAttribute("data-pdz-a") === "todas";
    p.camadas.forEach(function (c) { p.on[c.id] = on; ligar(c, on); });
    pintar();
  }, true);

  var marcado = false;
  function agenda() { if (marcado) return; marcado = true; setTimeout(function () { marcado = false; pintar(); }, 60); }
  function vigiar() {
    var b = D.getElementById("ipr-mb");
    if (!b) { setTimeout(vigiar, 800); return; }
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var t0 = ms[i].target; if (!(t0.closest && t0.closest(".ipr-pdz"))) { agenda(); return; } }
    }).observe(b, { childList: true, subtree: true });
    pintar();
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", vigiar); else vigiar();
})();
