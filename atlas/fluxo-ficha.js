/* IPR Atlas · fluxo-ficha.js (05/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 05/11/2026, 11h27, 11h32 e 11h33:
   1. «Projecto aberto» (barra da esquerda, minhas-bases.js) mais magro, a ocupar metade: linhas de camada, botões, títulos e
      barras de opacidade mais baixos e estreitos.
   2. «Projecto Terracrua Design» (projecto-design.js) só a equipa vê assim; para os outros diz «Projecto».
   3. Painel da direita: a categoria «Projectos» passa a «Em projecto» (a ordem Todas, Bases para rever fica no m90737).
   4. Carregar numa Base ou projecto da direita abre a Ficha da propriedade ali; o botão «Ficha da propriedade» da esquerda
      também. A ficha é a do próprio cartão (botão «Ver a ficha da propriedade», app.js), que as linhas finas
      (bases-finas.js) deixavam escondida.
   5. «Ficha do terreno» e variantes passam a «Ficha da propriedade» também nas formas que o ficha-propriedade.js não apanha.
   Desligar: ?fficha=0 ou localStorage ipr_fficha_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]fficha=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_fficha_off") === "1") return; } catch (e) {}
  if (W.__iprFFicha) return; W.__iprFFicha = 1;

  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function equipa() { var q = W.tcdEquipa; return !!(q && typeof q === "object" && q.email); }
  function est() { return W.__ipe && W.__ipe.estado || null; }

  // ---------- 1. Esquerda mais magra ----------
  var S = "html body #ipr-mb ";
  var css = D.createElement("style"); css.id = "ipr-fficha-css";
  css.textContent =
    S + "{max-height:45vh!important}" +
    S + ".ipr-mb-b{margin:0 6px 4px!important}" +
    S + ".ipr-mb-bt{padding:4px 6px 4px 8px!important;font:600 12.5px/1.25 Inter,system-ui,sans-serif!important;gap:6px!important}" +
    S + ".ipr-mb-t small{font-size:10.5px!important;margin-top:1px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    S + ".ipr-mb-ir{padding:0 8px!important;font-size:11.5px!important}" +
    S + ".ipr-mb-corpo{padding:2px 0 4px!important}" +
    S + ".ipr-mb-nota{margin:1px 8px 3px!important;font-size:11px!important}" +
    S + ".ipr-mb-acc{padding:2px 6px 3px!important;gap:3px!important}" +
    S + ".ipr-mb-acc button{padding:2px 7px!important;font-size:11px!important;line-height:1.3!important;min-height:0!important;border-radius:5px!important}" +
    S + ".ipr-mb-sub{padding:4px 10px 0 12px!important;font-size:9.5px!important}" +
    S + ".ipr-mb-it{padding:0 6px 0 4px!important}" +
    S + ".ipr-mb-it label{padding:1px 4px!important;gap:5px!important;font:12px/1.25 Inter,system-ui,sans-serif!important;align-items:center!important;min-height:0!important}" +
    S + ".ipr-mb-it input[type=checkbox]{width:13px!important;height:13px!important;margin:0!important}" +
    S + ".ipr-mb-cor{width:8px!important;height:8px!important;margin-top:0!important}" +
    S + ".ipr-mb-n small{font-size:10px!important}" +
    S + "input[type=range]{display:block;height:8px!important;width:calc(100% - 40px)!important;max-width:220px;margin:0 0 2px 26px!important;padding:0!important}" +
    S + "input[type=range]::-webkit-slider-thumb{width:10px!important;height:10px!important}" +
    S + "input[type=range]::-moz-range-thumb{width:10px!important;height:10px!important}" +
    S + "input[type=range]::-webkit-slider-runnable-track{height:3px!important}" +
    S + "input[type=range]::-moz-range-track{height:3px!important}" +
    S + ".ipr-mb-b.ab .ipr-mb-cam{max-height:min(340px,32vh);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}" +
    S + ".ipr-mb-it:has(> input[type=range]){display:flex;align-items:center}" +
    S + ".ipr-mb-it:has(> input[type=range]) > label{flex:1 1 auto;min-width:0}" +
    S + ".ipr-mb-it > input[type=range]{flex:0 0 64px;width:64px!important;margin:0 2px 0 4px!important}" +
    "#ipe-proj .ipe-card.ipr-ff-on .ipe-res--proj{scroll-margin-top:12px}";
  (D.head || D.documentElement).appendChild(css);

  // ---------- 2, 3 e 5. Textos ----------
  var REF = /([Ff])icha d(?:o|e) [Tt]erreno\b|([Ff])icha do [Pp]rojec?to\b/g;
  function texto(n) {
    var v = n.nodeValue; if (!v) return;
    var t = v;
    if (REF.test(t)) { REF.lastIndex = 0; t = t.replace(REF, function (m, a, b) { return (a || b) + "icha da propriedade"; }); }
    REF.lastIndex = 0;
    if (!equipa() && /Projecto Terracrua Design|Terracrua Design project/.test(t)) t = t.replace("Projecto Terracrua Design", "Projecto").replace("Terracrua Design project", "Project");
    if (t !== v) n.nodeValue = t;
  }
  function categoria() {
    var b = D.querySelector('#ipr-ac-a button[data-ac="projecto"],#ipr-ac-b button[data-ac="projecto"]'); if (!b) return;
    var w = D.createTreeWalker(b, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (/^\s*Projectos\s*$/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace("Projectos", "Em projecto");
      else if (/^\s*Projects\s*$/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace("Projects", "In design");
    }
  }
  function varre(r) {
    if (!r) return;
    if (r.nodeType === 3) { texto(r); return; }
    if (r.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(r.nodeName)) return;
    var s = r.textContent || "";
    if (!/icha d|Terracrua Design/.test(s)) return;
    var w = D.createTreeWalker(r, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) texto(n);
  }

  // ---------- 4. Ficha da propriedade ----------
  function cartaoDe(id) {
    var E = est(); if (!E || !E.mapas) return null;
    for (var i = 0; i < E.mapas.length; i++) if (String(E.mapas[i].id) === String(id)) return D.querySelector('#ipe-proj .ipe-card[data-i="' + i + '"]');
    return null;
  }
  function mostrarFicha(c) {
    if (!c) return false;
    c.classList.add("ipr-ff-on");
    if (c.classList.contains("ipr-fn") && !c.classList.contains("ipr-fn-on")) {
      var h = c.querySelector(".ipr-fn-h"); if (h) h.click(); else c.classList.add("ipr-fn-on");
    }
    var cx = c.querySelector(".ipe-cx"); if (cx && getComputedStyle(cx).display === "none") cx.style.setProperty("display", "block", "important");
    var b = c.querySelector("[data-res-proj]"), out = b && c.querySelector('[data-res-out="' + b.getAttribute("data-res-proj") + '"]');
    if (b && !b.disabled && (!out || !out.children.length)) b.click();
    setTimeout(function () {
      var o = c.querySelector("[data-res-out]"), r = c.querySelector(".ipe-res--proj");
      var alvo = (o && o.offsetParent) ? o : (r && r.offsetParent) ? r : c;
      try { alvo.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {}
    }, 400);
    return true;
  }
  function abrirFicha(id) {
    var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="proj"]'); if (tab && !tab.classList.contains("on")) tab.click();
    var raiz = D.getElementById("ipe");
    if (raiz && raiz.classList.contains("sem-dir")) { var pn = D.getElementById("ipe-pn"); if (pn) pn.click(); }
    var c = cartaoDe(id);
    if (c && c.classList.contains("ipr-bt-esc")) { var td = D.querySelector('#ipr-ac-a button[data-ac=""]'); if (td) td.click(); }
    setTimeout(function () { mostrarFicha(cartaoDe(id)); }, 180);
  }
  W.__iprAbrirFicha = abrirFicha;

  // Linha fina da direita: depois de o bases-finas.js abrir o cartão, mostra a ficha.
  D.addEventListener("click", function (ev) {
    var h = ev.target && ev.target.closest && ev.target.closest("#ipe-proj .ipe-card .ipr-fn-h");
    if (!h || (ev.target.closest && ev.target.closest(".ipr-bt-b,[aria-haspopup],a[href]"))) return;
    var c = h.closest(".ipe-card");
    setTimeout(function () { if (c.classList.contains("ipr-fn-on")) mostrarFicha(c); else c.classList.remove("ipr-ff-on"); }, 120);
  }, true); // captura: o bases-finas.js pára a propagação

  // Botão «Ficha da propriedade» da esquerda (minhas-bases.js: só mudava de separador).
  D.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("#ipr-mb .ipr-mb-acc button");
    if (!b || !/icha da propriedade|Property|Plot summary/i.test(b.textContent || "")) return;
    var li = b.closest(".ipr-mb-b"); if (!li) return;
    var id = li.getAttribute("data-mb"), E = est();
    if (!id && li.classList.contains("actual") && E && E.actual) id = E.actual.id;
    if (!id) return;
    setTimeout(function () { abrirFicha(id); }, 200);
  }, true);

  // ---------- arranque ----------
  var t = 0, fila = [];
  function corre() { t = 0; var f = fila; fila = []; for (var i = 0; i < f.length; i++) { try { varre(f[i]); } catch (e) {} } categoria(); }
  function agenda(n) { fila.push(n); if (!t) t = setTimeout(corre, 80); }
  function ligar() {
    if (!D.body) return false;
    varre(D.body); categoria();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === "characterData") agenda(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) agenda(m.addedNodes[j]);
      }
    }).observe(D.body, { childList: true, subtree: true, characterData: true });
    return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
