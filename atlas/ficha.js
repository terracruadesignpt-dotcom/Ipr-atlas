/* IPR Atlas · Ficha do projecto arrumada por separadores (pedido do Nuno, 29/10/2026, 14h43: «vais organizar a ficha do
   projeto para estar mais intuitiva»).
   O cartão aberto de cada projecto (separador Projectos) junta muita coisa vinda de vários guiões: o 3D e os números do
   terreno (ajustes.js), o valor indicativo (valor.js), as acções, as camadas da Base, a ficha gratuita, os ficheiros, o
   diário e a partilha (app.js). Aqui não se move nada de sítio, para não partir os guiões que procuram os blocos onde
   estão: cada bloco recebe uma marca (data-fk) e o cartão mostra só os blocos do separador escolhido.
     Resumo     o terreno em 3D, os números, o valor indicativo, pagar, visita técnica e, para a equipa, «Para rever»;
     No mapa    as camadas da Base Cartográfica e a ficha gratuita do terreno;
     Ficheiros  o que se descarrega;
     Partilhar  o diário e a conversa, e os convites.
   Um separador sem nada não aparece. O separador escolhido fica lembrado por projecto enquanto a página estiver aberta.
   Desligar: window.IPR_FICHA_OFF = true. Terracrua Design. */
(function () {
  "use strict";
  if (window.IPR_FICHA_OFF || window.__iprFicha) return;
  window.__iprFicha = 1;
  var EN = function () { return (window.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en"; };
  var NOMES = {
    resumo: ["Resumo", "Overview"],
    mapa: ["No mapa", "On the map"],
    fich: ["Ficheiros", "Files"],
    part: ["Partilhar", "Share"]
  };
  var ORDEM = ["resumo", "mapa", "fich", "part"];
  var escolhido = {}; // id do projecto -> separador

  function ORDEM_CSS() {
    // esconde só os blocos dos outros separadores; os do escolhido ficam com o aspecto que já tinham
    return ["resumo", "mapa", "fich", "part"].map(function (k) { return ".ipe-card.on[data-fk-sel=" + k + "] [data-fk]:not([data-fk=" + k + "])"; }).join(",") + "{display:none!important}";
  }
  var css = document.createElement("style");
  css.id = "ipr-ficha-css";
  css.textContent =
    ".ipe-card.on .ipr-fk-t{display:flex;gap:4px;margin:10px 0 8px;padding:3px;border-radius:10px;background:rgba(127,127,127,.12);overflow-x:auto;scrollbar-width:none}" +
    ".ipr-fk-t::-webkit-scrollbar{display:none}" +
    ".ipr-fk-t button{flex:1 0 auto;min-height:36px;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font:600 12.5px Inter,sans-serif;opacity:.75;cursor:pointer;white-space:nowrap}" +
    ".ipr-fk-t button[aria-selected=true]{background:rgba(127,127,127,.3);opacity:1;box-shadow:inset 0 -2px 0 #b8652f}" +
    ".ipr-fk-t button b{font-weight:600;opacity:.55;margin-left:4px}" +
    ORDEM_CSS() +
    ".ipe-card.on .ipe-cx>h4[data-fk]:first-child{margin-top:4px}" +
    ".ipr-fk-vazio{font:13px/1.45 Inter,sans-serif;opacity:.7;margin:6px 0}";
  (document.head || document.documentElement).appendChild(css);

  function texto(el) { return String((el && el.textContent) || "").trim(); }
  function idDe(c) {
    var m = c.querySelector(".mono");
    return String(texto(m)).replace(/^#?(\d+).*/, "$1") || c.getAttribute("data-i") || "";
  }
  // Marca um filho do .ipe-cx; devolve a secção (ou null para seguir a anterior).
  function classe(el, atual) {
    if (el.classList.contains("ipe-rv")) return "resumo";
    if (el.classList.contains("ipe-basecam") || el.classList.contains("ipe-res--proj") || el.classList.contains("ipr-ficha-out") || el.hasAttribute("data-res-out")) return "mapa";
    if (el.classList.contains("ipc-proj") || el.hasAttribute("data-com-proj")) return "part";
    if (el.tagName === "H4") {
      var t = texto(el);
      if (/^(Descarregar|Ficheiros|Files|Download)/i.test(t)) return "fich";
      if (/^(Partilhar|Share)/i.test(t)) return "part";
      if (/^Camadas|^Layers/i.test(t)) return "mapa";
      return null;
    }
    if (el.classList.contains("ipe-acc")) {
      if (el.querySelector("[data-sh]")) return "part";
      if (el.querySelector("[data-entregar]")) return "resumo";
      if (atual === null || atual === "resumo") return "resumo";
      return null;
    }
    if (el.classList.contains("ipe-sh") || el.hasAttribute("data-sh-lista") || el.hasAttribute("data-sh-msg")) return "part";
    if (el.matches && el.matches("ul.ipe-fl2,ul.ipe-fl:not([data-sh-lista])")) return atual === "part" ? "part" : "fich";
    return null;
  }

  function arrumar(c) {
    var cx = c.querySelector(":scope > .ipe-cx");
    if (!cx) return;
    var cont = { resumo: 0, mapa: 0, fich: 0, part: 0 };
    var fx = c.querySelector(":scope > .ipr-fx");
    if (fx) { fx.setAttribute("data-fk", "resumo"); cont.resumo++; }
    var atual = null;
    Array.prototype.forEach.call(cx.children, function (el) {
      if (el.classList.contains("ipr-fk-t")) return;
      var k = classe(el, atual);
      if (k === null) k = atual || "resumo";
      atual = k;
      if (el.getAttribute("data-fk") !== k) el.setAttribute("data-fk", k);
      // conta só o que tem conteúdo visível (um .ipe-acc vazio não abre separador)
      if (texto(el) || el.querySelector("button,a,input,img,svg,canvas")) cont[k]++;
    });
    // Ficheiros: os itens da lista, para mostrar o número no separador
    var nf = cx.querySelectorAll('[data-fk=fich] li').length;

    var barra = c.querySelector(":scope > .ipr-fk-t");
    var id = idDe(c);
    var sel = escolhido[id] || "resumo";
    if (!cont[sel]) sel = ORDEM.filter(function (k) { return cont[k]; })[0] || "resumo";
    var chave = ORDEM.map(function (k) { return cont[k] ? k : ""; }).join(",") + "|" + nf + "|" + (EN() ? "en" : "pt");
    if (!barra) {
      barra = document.createElement("div");
      barra.className = "ipr-fk-t"; barra.setAttribute("role", "tablist");
      var cc = c.querySelector(":scope > .ipe-cc");
      c.insertBefore(barra, cc ? cc.nextSibling : c.firstChild);
      barra.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("button[data-fk-b]"); if (!b) return;
        e.stopPropagation(); e.preventDefault();
        escolhido[id] = b.getAttribute("data-fk-b");
        c.setAttribute("data-fk-sel", escolhido[id]);
        barra.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      }, true);
    }
    if (barra.getAttribute("data-k") !== chave) {
      barra.setAttribute("data-k", chave);
      barra.innerHTML = ORDEM.filter(function (k) { return cont[k]; }).map(function (k) {
        return '<button type="button" role="tab" data-fk-b="' + k + '" aria-selected="' + (k === sel) + '">' + NOMES[k][EN() ? 1 : 0] + (k === "fich" && nf ? "<b>" + nf + "</b>" : "") + "</button>";
      }).join("");
    }
    if (c.getAttribute("data-fk-sel") !== sel) c.setAttribute("data-fk-sel", sel);
    barra.querySelectorAll("button").forEach(function (x) { var on = x.getAttribute("data-fk-b") === sel; if ((x.getAttribute("aria-selected") === "true") !== on) x.setAttribute("aria-selected", on ? "true" : "false"); });
  }

  function varrer() {
    document.querySelectorAll("#ipe .ipe-card.on").forEach(arrumar);
    // cartões fechados: tira o estado, para abrirem sempre arrumados
    document.querySelectorAll("#ipe .ipe-card[data-fk-sel]:not(.on)").forEach(function (c) { c.removeAttribute("data-fk-sel"); });
  }
  var t = null;
  function agendar() { clearTimeout(t); t = setTimeout(varrer, 120); }
  function ligar() {
    var r = document.getElementById("ipe") || document.body;
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (m.target && m.target.closest && m.target.closest(".ipr-fk-t")) continue; agendar(); return; }
    }).observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    varrer();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar); else ligar();
})();
