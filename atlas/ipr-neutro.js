/* IPR Atlas · tema escuro neutro (grafite) e ecrãs novos do Pedro Bolito. Acompanha o ipr-neutro.css.
   Decisões do Nuno, 04/11/2026, 22h2x (propostas em regenerativo.pt/interface/ajustes-atlas, /interface e /atlas-design):
   «Grafite em tudo», legenda «Mínima», Formiga fora do mapa (fica no menu «⋯»), Comprar passo 1, Terreno e estimativa,
   painel da Base. Só aspecto e textos: não muda preços, encomendas, rotas nem o que cada botão faz.
   O que faz:
   1. Troca as cores verdes escuras fixas (fundos, linhas, painéis do tema B e do bolito.css) pelas da paleta grafite nas
      folhas do Atlas (lidas outra vez do mesmo endereço e postas logo a seguir, com a original desligada), nos estilos que
      os outros ficheiros injectam e nos atributos style dos painéis. As cores das camadas do mapa e das legendas não mudam.
   2. Legenda «Mínima»: classe n5-min no #ipr-lgd, nomes curtos, rampa vertical do MDT e uma linha só para as linhas de
      água. O texto original fica no DOM (só escondido), para o bolito.js e o viz.js continuarem a funcionar.
   3. Formiga: o botão sobre o mapa esconde-se no Atlas; no menu «⋯» do topo aparece «Formiga», que abre o mesmo painel.
   4. Comprar passo 1: preço com IVA por baixo do preço sem IVA, etiqueta «Sem conta prévia» na Base e na Leitura, e as
      ligações «Não sei bem o que preciso» (WhatsApp) e «Só quero explorar o mapa» (fecha o painel).
      Terreno e estimativa: condicionantes da Leitura em etiquetas. Painel da Base: «.zip» em etiqueta.
   Desligar: ?neutro=0 (ou localStorage ipr_neutro_off = 1); ?neutro=1 volta a ligar. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  try {
    if (/[?&]neutro=1(&|$)/.test(location.search)) W.localStorage.removeItem("ipr_neutro_off");
    if (/[?&]neutro=0(&|$)/.test(location.search)) W.localStorage.setItem("ipr_neutro_off", "1");
    if (W.localStorage.getItem("ipr_neutro_off") === "1") { H.setAttribute("data-neutro-off", ""); return; }
  } catch (e) {}
  if (W.__iprNeutro) return; W.__iprNeutro = 1;
  function en() { return (W.IPR_LINGUA || H.lang || "pt").indexOf("en") === 0; }

  // ---------- 1. cores ----------
  var HEX = {
    "0f170b": "141513", "121410": "141513", "14200f": "1b1c19", "171a13": "1b1c19", "18200f": "1b1c19",
    "1b2816": "232420", "1d221c": "232420", "252a1f": "2a2b26", "22311c": "2a2b26",
    "2e3a26": "383a33", "3c4b32": "45473f", "3b4232": "45473f", "3a3f30": "383a33", "404632": "2a2b26",
    "545b42": "45473f", "5a6147": "45473f", "4a5740": "45473f", "4b5a2c": "45473f", "5e6647": "5a5c53",
    "a9b88a": "c3c5bc", "c9cfbc": "d6d7cf", "9aa088": "c3c5bc", "e4e2d8": "f5f4ee", "e9e7dd": "f5f4ee"
  };
  var RGB = [["15,23,11", "20,21,19"], ["20,32,15", "27,28,25"], ["27,40,22", "35,36,32"], ["64,70,50", "42,43,38"]];
  var reHex = new RegExp("#(" + Object.keys(HEX).join("|") + ")(?![0-9a-f])", "gi");
  var reRgb = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
  function trocar(t) {
    if (!t) return t;
    var n = t.replace(reHex, function (m, x) { return "#" + HEX[x.toLowerCase()]; });
    return n.replace(reRgb, function (m, r, g, b) {
      var k = r + "," + g + "," + b;
      for (var i = 0; i < RGB.length; i++) if (RGB[i][0] === k) return m.replace(k, RGB[i][1]).replace(/\s/g, "");
      return m;
    });
  }
  function estilos() {
    [].forEach.call(D.querySelectorAll("style:not([data-n5-de])"), function (st) {
      if (st.id === "n5-css") return;
      var t = st.textContent; if (st.__n5 === t) return;
      var n = trocar(t); st.__n5 = n; if (n !== t) st.textContent = n;
    });
  }
  function folhas() {
    [].forEach.call(D.querySelectorAll('link[rel="stylesheet"]'), function (l) {
      var h = l.href || "";
      if (l.__n5 || !/Ipr-atlas@|\/terracrua-nucleo\/assets\/atlas\//i.test(h) || /ipr-neutro\.css/.test(h)) return;
      l.__n5 = 1;
      fetch(h, { credentials: "omit" }).then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); }).then(function (t) {
        var n = trocar(t); if (n === t) return;
        n = n.replace(/url\(\s*(['"]?)(?!data:|https?:|\/\/|#)([^'")]+)\1\s*\)/g, function (m, q, u) { try { return "url(" + q + new URL(u, h).href + q + ")"; } catch (e) { return m; } });
        var s = D.createElement("style"); s.setAttribute("data-n5-de", h); s.textContent = n; s.__n5 = n;
        if (l.parentNode) { l.parentNode.insertBefore(s, l.nextSibling); l.media = "not all"; }
      }).catch(function () {});
    });
  }
  var FORA = "#ipr-lgd, #ipr-lgd *, canvas, svg, svg *, s, i, .ov-cor, .maplibregl-canvas-container, [class*=cor], [class*=sw]";
  function inline() {
    [].forEach.call(D.querySelectorAll("body [style]"), function (e) {
      var st = e.getAttribute("style"); if (!st || st === e.__n5) return;
      if (!/#|rgb/i.test(st) || e.matches(FORA)) { e.__n5 = st; return; }
      var n = trocar(st); e.__n5 = n; if (n !== st) e.setAttribute("style", n);
    });
  }

  // ---------- 2. legenda mínima ----------
  function curto(t) {
    var s = t.replace(/\s+/g, " ").trim();
    if (en()) return s.replace(/^Contour lines?\b.*$/i, "Contours").replace(/^Hypsometry\b.*$/i, "DTM").replace(/^(Shaded relief|Hillshade)\b.*$/i, "Hillshade").replace(/^Watercourses?\b.*$/i, "Streams").replace(/^(Property )?cadastre\b.*$/i, "Cadastre");
    return s.replace(/^Curvas de n[ií]vel\b.*$/i, "Curvas").replace(/^Hipsometria\b.*$/i, "MDT").replace(/^(Relevo sombreado|Sombreamento)\b.*$/i, "Sombreamento").replace(/^Linhas de [áa]gua\b.*$/i, "Linhas de água").replace(/^Cadastro predial\b.*$/i, "Cadastro");
  }
  function detalhe(t) {
    var m = /(\d+(?:[.,]\d+)?)\s*(?:a|to|–|-)\s*(\d+)\s*m\b/i.exec(t); if (m) return m[1] + "–" + m[2] + " m";
    m = /\b(\d+(?:[.,]\d+)?)\s*m\b/.exec(t); if (m && /curva|contour/i.test(t)) return m[1] + " m";
    if (/strahler/i.test(t)) return "Strahler";
    return "";
  }
  function nc(nome, det, traco) {
    var s = D.createElement("span"); s.className = "n5-nc";
    if (traco) s.appendChild(traco);
    s.appendChild(D.createTextNode(nome));
    if (det) { var d = D.createElement("small"); d.textContent = det; s.appendChild(d); }
    return s;
  }
  function legenda() {
    var L = D.getElementById("ipr-lgd"); if (!L) return;
    if (!L.classList.contains("n5-min")) L.classList.add("n5-min");
    var c = L.querySelector(".c"); if (!c) return;
    [].forEach.call(c.querySelectorAll(":scope>.one"), function (o) {
      if (o.querySelector(":scope>.n5-nc,:scope>.n5-rp")) return;
      var sp = o.querySelector(":scope>span"), dd = o.querySelector(":scope>small.d");
      var tx = (sp ? (sp.firstChild && sp.firstChild.nodeType === 3 ? sp.firstChild.nodeValue : sp.textContent) : o.textContent) || "";
      var full = tx + (dd ? " (" + dd.textContent + ")" : "");
      if (o.classList.contains("rampa") || /hipsom|hypsom/i.test(full)) {
        o.classList.add("rampa");
        var r = D.createElement("span"); r.className = "n5-rp";
        var a = D.createElement("small"), b = D.createElement("small"), n = D.createElement("b");
        n.textContent = en() ? "DTM" : "MDT"; n.style.cssText = "font-weight:400;color:#F5F4EE;margin-right:5px";
        a.appendChild(n); a.appendChild(D.createTextNode(en() ? "high" : "alto")); b.textContent = en() ? "low" : "baixo";
        r.appendChild(a); r.appendChild(b); o.appendChild(r); return;
      }
      o.appendChild(nc(curto(tx), detalhe(full)));
    });
    [].forEach.call(c.querySelectorAll(":scope>.l"), function (o) {
      if (o.querySelector(":scope>.n5-nc")) return;
      var b = o.querySelector(":scope>b"); if (!b) return;
      var tx = (b.firstChild && b.firstChild.nodeType === 3 ? b.firstChild.nodeValue : b.textContent) || "";
      var full = b.textContent + " " + (o.querySelector(".ipr-ii-f") ? "" : "");
      var rs = o.querySelectorAll(".r>s"), cor = "";
      if (rs.length) { var x = rs[Math.min(2, rs.length - 1)]; cor = x.style.background || x.style.backgroundColor || ""; }
      var tr = null;
      if (cor && /linhas de [áa]gua|watercourse|stream|strahler|curvas|contour/i.test(full)) { tr = D.createElement("s"); tr.className = "n5-tr"; tr.style.setProperty("--b-cor", cor); }
      o.insertBefore(nc(curto(tx), detalhe(full), tr), b);
    });
  }

  // ---------- 3. Formiga no menu «⋯» ----------
  function formiga() {
    if (D.getElementById("ipe")) H.classList.add("n5-atlas");
    var m = D.querySelector("#ipe .ipe-mais-m"), fb = D.getElementById("tcdfmb");
    if (!m || !fb || m.querySelector("#n5-fm")) return;
    var b = D.createElement("button"); b.type = "button"; b.id = "n5-fm"; b.setAttribute("role", "menuitem");
    b.textContent = en() ? "Formiga · help and problems" : "Formiga · ajuda e problemas";
    b.title = en() ? "Ask a question or report a problem" : "Fazer uma pergunta ou reportar um problema";
    b.addEventListener("click", function () { var x = D.getElementById("tcdfmb"); if (x) x.click(); });
    m.appendChild(b);
  }

  // ---------- 4. ecrãs novos ----------
  function euro(v) { return v.toFixed(2).replace(".", ",") + " €"; }
  function comprar() {
    var pn = D.getElementById("ipr-cp-pn"); if (!pn) return;
    [].forEach.call(pn.querySelectorAll(".ipr-cp-i"), function (it) {
      var p = it.querySelector(".ipr-cp-p");
      if (p && !p.querySelector(".n5-iva")) {
        var t = p.textContent.replace(/\s+/g, " "), ns = t.match(/(\d+(?:[.,]\d+)?)\s*€/g);
        if (ns && ns.length) {
          var v = parseFloat(ns[ns.length - 1].replace(/[^\d.,]/g, "").replace(",", ".")), mes = /€\s*\/\s*(mês|month)/.test(t);
          if (v > 0) { var s = D.createElement("span"); s.className = "n5-iva"; s.textContent = euro(v * 1.23) + (mes ? (en() ? "/month" : "/mês") : "") + (en() ? " with VAT" : " com IVA"); p.appendChild(s); }
        }
      }
      var k = it.getAttribute("data-cp") || "";
      if ((k === "p-base" || k === "p-leitura") && !it.querySelector(".n5-et")) {
        var sp = it.querySelector(":scope>span:not(.ipr-cp-p)");
        if (sp) { var e = D.createElement("span"); e.className = "n5-et"; e.textContent = en() ? "No prior account" : "Sem conta prévia"; e.style.display = "table"; sp.appendChild(e); }
      }
    });
    var l = pn.querySelector(".ipr-cp-l");
    if (l && !pn.querySelector(".n5-mais")) {
      var d = D.createElement("div"); d.className = "n5-mais";
      var a = D.createElement("a"); a.href = "https://wa.me/351910748670"; a.target = "_blank"; a.rel = "noopener";
      a.textContent = en() ? "I'm not sure what I need" : "Não sei bem o que preciso";
      var b = D.createElement("button"); b.type = "button"; b.textContent = en() ? "I just want to explore the map" : "Só quero explorar o mapa";
      b.addEventListener("click", function () { var x = pn.querySelector('[data-cp="fechar"]'); if (x) x.click(); });
      d.appendChild(a); d.appendChild(b); l.parentNode.insertBefore(d, l.nextSibling);
    }
    var pd = D.getElementById("ipr-cp-pd"), dm = pn.querySelector(".n5-mais");
    if (dm) dm.hidden = !!(pd && !pd.hidden);
  }
  function formulario() {
    var pl = D.getElementById("ipe-preco-l"); if (!pl) return;
    var lab = pl.closest("label"); if (!lab || lab.querySelector(".n5-tags")) return;
    var sp = lab.querySelector(":scope>span"); if (!sp) return;
    var t = D.createElement("span"); t.className = "n5-tags"; t.setAttribute("aria-hidden", "true");
    (en() ? ["REN", "RAN", "PDM", "Natura 2000", "Water", "Fire"] : ["REN", "RAN", "PDM", "Rede Natura", "Água", "Fogo"]).forEach(function (x) { var i = D.createElement("i"); i.textContent = x; t.appendChild(i); });
    sp.appendChild(t);
  }
  function base() {
    [].forEach.call(D.querySelectorAll("#ipe .ipe-fl2 li.ipe-fl-tudo .ipe-fl-t>b"), function (b) {
      if (b.querySelector(".n5-zip")) return;
      var m = /^(.*?)\s*·\s*(\.zip)\s*$/i.exec(b.textContent); if (!m) return;
      b.textContent = m[1] + " "; var z = D.createElement("span"); z.className = "n5-zip"; z.textContent = m[2]; b.appendChild(z);
    });
  }

  // ---------- ciclo ----------
  function tudo() {
    try { estilos(); } catch (e) {}
    try { folhas(); } catch (e) {}
    try { inline(); } catch (e) {}
    try { legenda(); } catch (e) {}
    try { formiga(); } catch (e) {}
    try { comprar(); } catch (e) {}
    try { formulario(); } catch (e) {}
    try { base(); } catch (e) {}
  }
  var t = 0, aCorrer = false;
  // Limitador (não «debounce»): o mapa mexe em atributos style sem parar e um debounce nunca chegaria a correr.
  function agenda() { if (aCorrer || t) return; t = setTimeout(function () { t = 0; aCorrer = true; try { tudo(); } finally { setTimeout(function () { aCorrer = false; }, 0); } }, 200); }
  function arranca() {
    tudo();
    new MutationObserver(agenda).observe(H, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "hidden", "class"] });
    D.addEventListener("ipr:lingua", function () {
      [].forEach.call(D.querySelectorAll(".n5-nc,.n5-rp,.n5-iva,.n5-et,.n5-mais,.n5-tags,#n5-fm"), function (x) { x.remove(); });
      agenda();
    });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arranca); else arranca();
})();
