/* IPR Atlas · Ferramentas num só sítio (24/11/2026, 16h56). Terracrua Design.
   Nuno: «temos o analisar, o desenhar e o recolher, que eu gosto muito, e temos repetido em botões ali do lado direito [...]
   aquela barra desaparece, a barra vertical, e esses botões vão todos parar àquelas 3 cenas [...] a rosa dos ventos está muito
   fraca [...] voltamos a ter a rosa dos ventos maior, com o botão mais e menos». E (16h57): o logótipo «Atlas» levava à página
   da Terracrua Design; «o melhor é não sair dali». E (16h54): duas contagens diferentes (grupos de «O essencial» e o chip das
   camadas ligadas).
   1. A barra vertical (.ipe-tools) fica escondida. Os botões que só lá estavam passam para os menus Analisar, Desenhar e
      Recolher (#ipr-modos-acc) como botões que carregam nos originais (mesmos eventos).
   2. Controlo de navegação próprio, em baixo à direita: rosa dos ventos grande (roda com o mapa; clique volta ao norte),
      mais, menos, a minha posição e ecrã inteiro.
   3. O logótipo deixa de sair do Atlas: volta à vista de Portugal.
   4. Em «O essencial» saem as contagens por grupo; a única contagem é a do chip das camadas ligadas.
   Desligar: ?ferramentas=0 ou localStorage ipr_ferr=0. Só acrescenta; não edita outros ficheiros. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ferramentas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ferr") === "0") return; } catch (e) {}
  if (W.__iprFerr) return; W.__iprFerr = 1;
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function orig(re) {
    var bs = D.querySelectorAll(".ipe-tools button");
    for (var i = 0; i < bs.length; i++) { var s = bs[i].title || bs[i].getAttribute("aria-label") || ""; if (re.test(s)) return bs[i]; }
    return null;
  }

  var CSS =
    ".ipe-mapa>.ipe-tools{display:none!important}" +
    "#ipr-eng summary .n{display:none!important}" +
    "#ipr-modos-acc .ipr-fe-x{border-style:dashed}" +
    "#ipr-nav{position:absolute;left:14px;right:auto;bottom:40px;z-index:5;display:flex;flex-direction:column;align-items:flex-start;gap:8px;pointer-events:none}" +
    "#ipr-nav>*{pointer-events:auto}" +
    "#ipr-nav .b,#ipr-nav .g{border:1px solid rgba(255,255,255,.1);background:rgba(13,17,11,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 26px -8px rgba(0,0,0,.55)}" +
    "#ipr-nav .b{width:44px;height:44px;border-radius:50%;padding:0;display:grid;place-items:center;color:#e6e4d9;cursor:pointer;font:600 12px Geist,Inter,system-ui,sans-serif;letter-spacing:.02em}" +
    "#ipr-nav .b:hover,#ipr-nav .g button:hover{background:rgba(148,190,57,.18)}" +
    "#ipr-nav .b.on{color:#11160d;background:#a6cc4f}" +
    "#ipr-nav .rosa svg{width:36px;height:36px;transition:transform .15s linear}" +
    "#ipr-nav .g{display:flex;flex-direction:column;border-radius:999px;overflow:hidden}" +
    "#ipr-nav .g button{width:44px;height:42px;border:0;background:none;color:#e6e4d9;font:300 19px Geist,Inter,system-ui,sans-serif;cursor:pointer;display:grid;place-items:center}" +
    "#ipr-nav .g button+button{border-top:1px solid rgba(255,255,255,.08)}" +
    "#ipr-nav .g svg{width:18px;height:18px}";

  var ROSA = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="rgba(236,234,224,.18)" stroke-width="1"/><polygon points="20,5 25,20 15,20" fill="#e5484d"/><polygon points="20,35 25,20 15,20" fill="#ecebe3"/><circle cx="20" cy="20" r="1.6" fill="#11160d"/></svg>';
  var I_POS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
  var I_FS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  function nav() {
    var M = mapa(), cont = D.querySelector(".ipe-mapa");
    if (!M || !cont || D.getElementById("ipr-nav")) return;
    var n = D.createElement("div"); n.id = "ipr-nav";
    n.innerHTML = '<button type="button" class="b" data-n="pos" title="' + t("A minha localização", "My location") + '">' + I_POS + "</button>" +
      '<button type="button" class="b" data-n="3d" title="' + t("Alternar 2D e 3D", "Toggle 2D and 3D") + '">3D</button>' +
      '<button type="button" class="b rosa" title="' + t("Bússola: clique para voltar ao norte", "Compass: click to reset north") + '">' + ROSA + "</button>" +
      '<div class="g"><button type="button" data-n="mais" title="' + t("Aproximar", "Zoom in") + '">+</button><button type="button" data-n="menos" title="' + t("Afastar", "Zoom out") + '">−</button></div>';
    cont.appendChild(n);
    function encostar() {
      var e = D.getElementById("ipe-esq"), c = cont.getBoundingClientRect(), r = e && e.getBoundingClientRect();
      var x = r && r.width > 40 && r.right > c.left ? r.right - c.left + 12 : 14;
      n.style.left = Math.round(x) + "px";
    }
    encostar(); setInterval(encostar, 1500); W.addEventListener("resize", encostar);
    var sv = n.querySelector(".rosa svg");
    function rodar() { try { sv.style.transform = "rotate(" + (-M.getBearing()) + "deg)"; } catch (e) {} }
    M.on("rotate", rodar); rodar();
    n.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("rosa")) { M.easeTo({ bearing: 0, pitch: 0, duration: 400 }); return; }
      var k = b.getAttribute("data-n");
      if (k === "mais") M.zoomIn(); else if (k === "menos") M.zoomOut();
      else if (k === "3d") { var p3 = D.getElementById("ipr-pb-3d") || orig(/relevo 3d|3d terrain/i); if (p3) p3.click(); else M.easeTo({ pitch: M.getPitch() > 5 ? 0 : 60, duration: 500 }); setTimeout(function () { b.classList.toggle("on", M.getPitch() > 5); }, 700); }
      else if (k === "pos") { var o = orig(/minha localiza|my location/i); if (o) o.click(); }
      else if (k === "fs") { var f = orig(/cr[aã] inteiro|full ?screen/i); if (f) f.click(); else { try { D.fullscreenElement ? D.exitFullscreen() : D.documentElement.requestFullscreen(); } catch (x) {} } }
    });
  }

  // botões a juntar a cada menu: [rótulo, expressão do título do original]
  var EXTRA = {
    Analisar: [[t("Imagens históricas", "Historical imagery"), /imagens hist|historical/i], [t("Sol e sombra", "Sun and shade"), /^sol|^sun/i], [t("Árvores e edifícios", "Trees and buildings"), /rvores e edif|trees and build/i], [t("Parcelas aqui", "Parcels here"), /parcelas aqui|parcels here/i], [t("Exportar prancha", "Export sheet"), /exportar prancha|export/i]],
    Desenhar: [[t("Desenhar o terreno", "Draw the plot"), /desenhar o terreno|draw the plot/i], [t("Escolher parcelas", "Pick parcels"), /parcelas do cadastro|cadastral parcels/i], [t("Marcador", "Marker"), /adicionar marcador|add marker/i], [t("Apagar terreno", "Erase plot"), /apagar terreno|erase/i]],
    Recolher: [[t("Pedir visita técnica", "Request a site visit"), /visita t[eé]cnica|site visit/i]]
  };
  function menus() {
    var acc = D.getElementById("ipr-modos-acc"); if (!acc || !acc.getClientRects().length) return;
    var tit = (acc.textContent || "").trim().split(":")[0];
    var lista = EXTRA[tit] || EXTRA[{ Analyse: "Analisar", Analyze: "Analisar", Draw: "Desenhar", Collect: "Recolher" }[tit]];
    if (!lista || acc.getAttribute("data-fe") === tit) return;
    var fechar = [].filter.call(acc.querySelectorAll("button"), function (b) { return b.textContent.trim() === "×"; })[0];
    var modelo = [].filter.call(acc.querySelectorAll("button"), function (b) { return b !== fechar; })[0];
    lista.forEach(function (it) {
      var o = orig(it[1]); if (!o) return;
      var b = D.createElement("button"); b.type = "button"; b.textContent = it[0]; b.className = (modelo ? modelo.className + " " : "") + "ipr-fe-x";
      b.addEventListener("click", function () { var x = orig(it[1]); if (x) x.click(); });
      if (fechar) fechar.parentNode.insertBefore(b, fechar); else acc.appendChild(b);
    });
    acc.setAttribute("data-fe", tit);
  }

  function marca() {
    var a = D.querySelector(".ipe-top .ipe-marca"); if (!a || a.getAttribute("data-fe")) return;
    a.setAttribute("data-fe", "1"); a.title = t("IPR Atlas · voltar à vista de Portugal", "IPR Atlas · back to the Portugal view");
    a.addEventListener("click", function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      var M = mapa(); if (M) M.fitBounds([[-9.6, 36.9], [-6.1, 42.2]], { padding: 40, duration: 700 });
    }, true);
  }

  function correr() {
    if (!D.getElementById("ipr-fe-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-fe-css"; s.textContent = CSS; D.head.appendChild(s); }
    try { nav(); } catch (e) {}
    try { menus(); } catch (e) {}
    try { marca(); } catch (e) {}
    var acc = D.getElementById("ipr-modos-acc");
    if (acc && !acc.__fe && W.MutationObserver) { acc.__fe = 1; new MutationObserver(function () { if (acc.getAttribute("data-fe") && acc.querySelector(".ipr-fe-x") === null) acc.removeAttribute("data-fe"); menus(); }).observe(acc, { childList: true, subtree: true }); }
  }
  (function vez(n) { correr(); if (n < 60) setTimeout(function () { vez(n + 1); }, 250); })(0);
  setInterval(correr, 3000);
})();
