/* IPR Atlas · janelas.js (31/10/2026). Terracrua Design. Só acrescenta, não mexe nos outros ficheiros.
   Nuno, 30/10, 23h33: «sempre que aparece um pop-up, tem que dar para fechar, voltar atrás e mover no ecrã, e ter um
   regulador de transparência»; 31/10, 02h38: «todas as janelas que apareçam por cima do mapa têm que dar para mover e para
   mexer a transparência. Todas.»
   Cada janela que aparece por cima do mapa (diálogos, fichas do clique, pop-ups do mapa, painéis dos simuladores, a
   Formiga, a legenda, avisos) ganha uma pequena barra flutuante, colada ao canto de cima, com:
   - uma pega para arrastar a janela (desloca-a com a propriedade CSS «translate», que se soma à posição que o próprio
     ficheiro lhe dá, por isso não estraga o layout nem os pop-ups que o mapa reposiciona); duplo toque repõe;
   - um regulador de transparência (35 a 100 %).
   Posição e transparência ficam lembradas por janela neste navegador (localStorage; falha em silêncio).
   Janelas que já têm a barra própria (.ipr-jan: assistente e cartão de preços) ficam como estão.
   Fora: a barra de cima, os painéis laterais e a gaveta do telemóvel, o ecrã de entrada (ocupa o ecrã todo) e o aviso
   de cookies. Desligar: ?janelas=0 ou localStorage ipr_janelas_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.__iprJanelas) return;
  try { if (/[?&]janelas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_janelas_off") === "1") return; } catch (e) {}
  W.__iprJanelas = 1;

  var NOME = /(^|[\s_-])(popup|pop|modal|dialog|dlg|janela|ficha|painel|panel|card|caixa|aviso|toast|legenda|lgd|formiga|sim|tip)([\s_-]|$)/i;
  var FORA_ID = /^(ipe|ipe-mapa|ipe-top|ipe-esq|ipe-dir|ipe-tools|tcdck|ipr-ini|ipr-ms-b|ipr-cp-b|ipr-as-b|ipr-as-fundo|wpadminbar)$/;
  var FORA_SEL = ".ipe-top,.ipe-esq,.ipe-dir,.ipe-tools,.maplibregl-ctrl,.maplibregl-canvas-container,#tcdck,#wpadminbar,.ipr-janb";
  var T = function () { return (D.documentElement.lang || "").indexOf("en") === 0 || W.IPR_LINGUA === "en" ? { m: "Move (double-tap to reset)", o: "Transparency" } : { m: "Mover (duplo toque repõe)", o: "Transparência" }; };
  var VIVAS = []; // { el, bar, k, G }
  var SEL = "[role=dialog],[aria-modal=true],.maplibregl-popup,[id*=lgd],[id*=popup],[id*=painel],[id*=dlg],[id*=janela],[id*=ficha],[class*=popup],[class*=modal],[class*=dialog],[class*=painel],[class*=panel],[class*=ficha],[class*=janela],[class*=legenda]";

  function css() {
    if (D.getElementById("ipr-janb-css")) return;
    var s = D.createElement("style"); s.id = "ipr-janb-css";
    s.textContent = ".ipr-janb{position:fixed;z-index:2147483000;display:flex;align-items:center;gap:4px;padding:2px 6px 2px 2px;border-radius:14px;background:rgba(18,22,15,.92);border:1px solid #2E3A26;box-shadow:0 2px 8px rgba(0,0,0,.35);opacity:.55;transition:opacity .15s}" +
      ".ipr-janb:hover,.ipr-janb:focus-within,.ipr-janb.on{opacity:1}" +
      ".ipr-janb button{all:unset;box-sizing:border-box;cursor:grab;touch-action:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:13px;color:#cfd6bd}" +
      ".ipr-janb button:active{cursor:grabbing}.ipr-janb button:focus-visible{outline:2px solid #94BE39}" +
      ".ipr-janb input{width:58px;height:18px;margin:0;accent-color:#94BE39;cursor:pointer;touch-action:pan-x}" +
      "@media (hover:none){.ipr-janb{opacity:.85}}";
    D.head.appendChild(s);
  }
  function chave(el) {
    var c = el.id || (typeof el.className === "string" ? el.className.split(/\s+/).filter(function (x) { return x && !/^(on|aberto|open|show|ativo|activo|visible|is-)/.test(x); })[0] : "") || el.tagName;
    return "ipr_janb_" + String(c).slice(0, 40);
  }
  function visivel(el) {
    if (!el.isConnected || !el.getClientRects().length) return false;
    var s = getComputedStyle(el); if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) return false;
    var b = el.getBoundingClientRect(); return b.width >= 120 && b.height >= 50 && b.bottom > 0 && b.right > 0 && b.top < innerHeight && b.left < innerWidth;
  }
  function candidata(el) {
    if (!el || el.nodeType !== 1 || el === D.body || el === D.documentElement) return false;
    if (el.id && FORA_ID.test(el.id)) return false;
    if (el.closest(FORA_SEL) || el.querySelector(".ipr-jan")) return false;
    if (el.classList.contains("ipr-jan") || el.classList.contains("ipr-janb")) return false;
    var s = getComputedStyle(el); if (s.position !== "fixed" && s.position !== "absolute") return false;
    var b = el.getBoundingClientRect();
    if (b.width < 160 || b.height < 60) return false;
    if (b.width >= innerWidth * 0.95 && b.height >= innerHeight * 0.85) return false; // ecrãs inteiros (entrada, fundos)
    var nome = (el.id || "") + " " + (typeof el.className === "string" ? el.className : "");
    var ehDialogo = el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true" || el.classList.contains("maplibregl-popup") || NOME.test(nome);
    var z = parseInt(s.zIndex, 10) || 0;
    if (!ehDialogo && !(s.position === "fixed" && z >= 10)) return false;
    // só sobre o mapa: tem de tocar na área do mapa
    var m = D.getElementById("ipe-mapa"); if (m) { var r = m.getBoundingClientRect(); if (b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom) return false; }
    // a mais exterior: se um antepassado já é janela, não
    for (var p = el.parentElement; p && p !== D.body; p = p.parentElement) { if (p.__iprJanb) return false; }
    return true;
  }
  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function gravar(k, G) { try { localStorage.setItem(k, JSON.stringify(G)); } catch (e) {} }

  function ligar(el) {
    if (el.__iprJanb) return;
    css();
    var k = chave(el), G = ler(k), t = T();
    el.__iprJanb = 1;
    var bar = D.createElement("div"); bar.className = "ipr-janb"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", t.m + " · " + t.o);
    var pg = D.createElement("button"); pg.type = "button"; pg.title = t.m; pg.setAttribute("aria-label", t.m);
    pg.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2l3 3h-2v4h4V7l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9z"/></svg>';
    var op = D.createElement("input"); op.type = "range"; op.min = "35"; op.max = "100"; op.step = "5"; op.value = String(G.o || 100); op.title = t.o; op.setAttribute("aria-label", t.o);
    bar.appendChild(pg); bar.appendChild(op); D.body.appendChild(bar);
    var J = { el: el, bar: bar, k: k, G: G };
    function aplicar() {
      el.style.setProperty("opacity", String(Math.max(35, Math.min(100, +op.value || 100)) / 100), "important");
      if (G.dx || G.dy) el.style.setProperty("translate", Math.round(G.dx || 0) + "px " + Math.round(G.dy || 0) + "px", "important");
      else el.style.removeProperty("translate");
    }
    if ((G.o || 100) < 100 || G.dx || G.dy) aplicar();
    op.addEventListener("input", function () { G.o = +op.value; aplicar(); gravar(k, G); });
    ["pointerdown", "mousedown", "touchstart", "click", "wheel", "keydown"].forEach(function (ev) { op.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); bar.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    var A = null;
    pg.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); A = { x: e.clientX, y: e.clientY, dx: G.dx || 0, dy: G.dy || 0 }; bar.classList.add("on"); try { pg.setPointerCapture(e.pointerId); } catch (x) {} });
    pg.addEventListener("pointermove", function (e) {
      if (!A) return; e.preventDefault();
      G.dx = A.dx + e.clientX - A.x; G.dy = A.dy + e.clientY - A.y;
      // não deixa a janela sair toda do ecrã
      var b = el.getBoundingClientRect();
      if (b.top < 0) G.dy -= b.top; if (b.top > innerHeight - 40) G.dy -= b.top - (innerHeight - 40);
      if (b.right < 60) G.dx += 60 - b.right; if (b.left > innerWidth - 60) G.dx -= b.left - (innerWidth - 60);
      aplicar(); seguir(J);
    });
    function fim(e) { if (!A) return; A = null; bar.classList.remove("on"); gravar(k, G); try { pg.releasePointerCapture(e.pointerId); } catch (x) {} }
    pg.addEventListener("pointerup", fim); pg.addEventListener("pointercancel", fim);
    pg.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key]; if (!d) return;
      e.preventDefault(); G.dx = (G.dx || 0) + d[0]; G.dy = (G.dy || 0) + d[1]; aplicar(); seguir(J); gravar(k, G);
    });
    pg.addEventListener("dblclick", function () { G = J.G = { o: G.o }; aplicar(); seguir(J); gravar(k, G); });
    VIVAS.push(J); seguir(J);
  }
  function seguir(J) {
    var el = J.el, bar = J.bar;
    if (!el.isConnected || !visivel(el)) { bar.style.display = "none"; return; }
    bar.style.display = "";
    var b = el.getBoundingClientRect(), bw = bar.offsetWidth || 96, bh = bar.offsetHeight || 30;
    var x = Math.max(4, Math.min(innerWidth - bw - 4, b.right - bw - 44));
    var y = b.top - bh - 2; if (y < 2) y = b.top + 4; // sem espaço por cima: dentro, no canto
    bar.style.left = Math.round(x) + "px"; bar.style.top = Math.round(y) + "px";
  }
  function arrumar() {
    for (var i = VIVAS.length - 1; i >= 0; i--) {
      var J = VIVAS[i];
      if (!J.el.isConnected) { J.bar.remove(); J.el.__iprJanb = 0; VIVAS.splice(i, 1); continue; }
      seguir(J);
    }
  }
  var POR = [];
  function rever(raiz) {
    var lista = raiz && raiz.nodeType === 1 ? [raiz].concat([].slice.call(raiz.querySelectorAll("*"), 0, 400)) : [];
    lista.forEach(function (el) { if (POR.indexOf(el) < 0) POR.push(el); });
  }
  function processar() {
    var l = POR; POR = [];
    l.forEach(function (el) { try { if (!el.__iprJanb && candidata(el) && visivel(el)) ligar(el); } catch (e) {} });
  }
  // janelas que aparecem depois (e as que mudam de classe para ficar visíveis)
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === "childList") [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && !n.classList.contains("ipr-janb")) rever(n); });
      else if (m.target && m.target.nodeType === 1 && !m.target.__iprJanb && !m.target.classList.contains("ipr-janb")) { if (POR.indexOf(m.target) < 0) POR.push(m.target); }
    });
  }).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "open"] });
  // ritmo calmo: processa os candidatos e acompanha as barras (os pop-ups do mapa mexem com o mapa)
  var volta = 0;
  (function ciclo() {
    try {
      // de 2 em 2 s, revê por cima as janelas que apareceram só por mudança de estilo (display) sem nova classe
      if (++volta % 5 === 0) { [].forEach.call(D.querySelectorAll(SEL), function (n) { if (!n.__iprJanb && POR.indexOf(n) < 0) POR.push(n); }); [].forEach.call(D.body.children, function (n) { if (POR.indexOf(n) < 0) POR.push(n); }); var r = D.getElementById("ipe"); if (r) [].forEach.call(r.querySelectorAll(":scope > *, .ipe-mapa > *, #ipe-mapa > *"), function (n) { if (POR.indexOf(n) < 0) POR.push(n); }); }
      processar(); arrumar();
    } catch (e) {}
    setTimeout(ciclo, 400);
  })();
  addEventListener("resize", arrumar); addEventListener("scroll", arrumar, true);
  setTimeout(function () { rever(D.body); }, 1500);
  W.__iprJanelasDiag = function (el) { return { candidata: candidata(el), visivel: visivel(el) }; };
})();
