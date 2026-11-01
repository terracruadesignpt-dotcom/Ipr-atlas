/* IPR Atlas · «Ficha da propriedade» em todas as menções (Nuno, 1/11/2026, 21h00: «Muda para ficha da propriedade em todas
   as menções»). Acrescento, sem mexer nos guiões donos dos textos (app.js, ajustes.js, ficha.js, minhas-bases.js, valor.js,
   produtos.js, intervencao.js): troca no que se vê «Ficha do projecto», «Ficha do projeto», «Ficha do terreno» e «Ficha da
   Base» por «Ficha da propriedade» (e as formas em minúsculas), nos textos e nos atributos title, aria-label e placeholder.
   Corre a cada mudança da página (MutationObserver), só nos nós novos ou alterados. Nenhum guião procura estes textos para
   encontrar botões (verificado a 1/11 nos 46 ficheiros do atlas.json), por isso a troca é só de aparência.
   Desligar: ?fprop=0 ou localStorage ipr_fprop_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]fprop=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_fprop_off") === "1") return; } catch (e) {}
  if (W.__iprFprop) return; W.__iprFprop = 1;

  var RE = /([Ff])icha d(?:o projec?to|o terreno|a Base)\b/g;
  function troca(s) { return s.replace(RE, function (m, f) { return f + "icha da propriedade"; }); }
  function tem(s) { RE.lastIndex = 0; var r = RE.test(s); RE.lastIndex = 0; return r; }
  var SALTA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1 };
  var ATR = ["title", "aria-label", "placeholder"];

  function noTexto(n) {
    var p = n.parentNode; if (!p || SALTA[p.nodeName] || p.isContentEditable) return;
    var v = n.nodeValue; if (v && tem(v)) { var t = troca(v); if (t !== v) n.nodeValue = t; }
  }
  function noEl(el) {
    if (!el || el.nodeType !== 1 || SALTA[el.nodeName]) return;
    for (var i = 0; i < ATR.length; i++) {
      var a = el.getAttribute(ATR[i]); if (a && tem(a)) el.setAttribute(ATR[i], troca(a));
    }
  }
  function varre(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { noTexto(raiz); return; }
    if (raiz.nodeType !== 1 || SALTA[raiz.nodeName]) return;
    noEl(raiz);
    if (!tem(raiz.textContent || "") && !raiz.querySelector("[title],[aria-label],[placeholder]")) return;
    var w = D.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) noTexto(n);
    [].forEach.call(raiz.querySelectorAll("[title],[aria-label],[placeholder]"), noEl);
  }

  var fila = [], marcado = false;
  function corre() {
    marcado = false; var f = fila; fila = [];
    for (var i = 0; i < f.length; i++) { try { varre(f[i]); } catch (e) {} }
  }
  function agenda(n) { fila.push(n); if (!marcado) { marcado = true; Promise.resolve().then(corre); } }

  function ligar() {
    if (!D.body) return false;
    varre(D.body);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === "characterData") agenda(m.target);
        else if (m.type === "attributes") agenda(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) agenda(m.addedNodes[j]);
      }
    }).observe(D.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
    return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
