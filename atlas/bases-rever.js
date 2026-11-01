/* IPR Atlas · separador «Bases»: as Bases para rever aparecem primeiro (Nuno, 1/11/2026, 19h44: «As bases para rever
   deviam aparecer logo em primeiro lugar, no separador de bases»).
   Acrescento ao projectos-grupos.js, sem lhe mexer:
   - sem grupos, os cartões «Para rever» passam para o topo da lista;
   - com grupos da equipa, os grupos com Bases para rever vêm primeiro e, dentro de cada grupo, as Bases para rever à frente;
   - o separador fino «Para rever» passa para o primeiro lugar, logo a seguir a «Todas».
   Corre logo a seguir a cada mudança da lista (MutationObserver), por isso não pisca.
   Desligar: ?rever1=0 ou localStorage ipr_rever1_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]rever1=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_rever1_off") === "1") return; } catch (e) {}

  function mapas() { var e = W.__ipe && W.__ipe.estado; return (e && e.mapas) || null; }
  function rever(m) { return !!(m && (m.rever || /revis/i.test(String(m.estado || "")))); }
  function eRev(c, L) { var i = +c.getAttribute("data-i"); return rever(L[i]); }
  function ord(x) { var v = parseInt(x.style.order, 10); return isNaN(v) ? 0 : v; }
  function poe(x, v) { v = String(v); if (x.style.order !== v) x.style.order = v; }

  var A_CORRER = false;
  function aplicar() {
    if (A_CORRER) return; A_CORRER = true;
    try {
      var L = mapas(); if (!L) return;
      [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-cards"), function (box) {
        var cs = [].slice.call(box.querySelectorAll(":scope > .ipe-card[data-i]"));
        if (!cs.length) return;
        var rv = cs.filter(function (c) { return eRev(c, L); });
        if (!rv.length) return;
        if (!box.classList.contains("ipr-pg-on")) {
          // Sem grupos: mover para o topo, mantendo a ordem entre elas.
          var primeiro = box.firstElementChild, ok = true;
          for (var i = 0; i < rv.length; i++) { if (cs[i] !== rv[i]) { ok = false; break; } }
          if (ok) return;
          rv.forEach(function (c) { box.insertBefore(c, primeiro); });
          rv.forEach(function (c, k) { if (k) box.insertBefore(c, rv[k - 1].nextSibling); });
          return;
        }
        // Com grupos: reordenar pelo «order» que o projectos-grupos.js atribuiu.
        var itens = [].slice.call(box.querySelectorAll(":scope > .ipr-pg-h, :scope > .ipe-card[data-i]"))
          .filter(function (x) { return !x.classList.contains("ipr-pg-esc"); })
          .sort(function (a, b) { return ord(a) - ord(b); });
        var gs = [], g = null;
        itens.forEach(function (x) {
          if (x.classList.contains("ipr-pg-h")) { g = { h: x, c: [], o: ord(x) }; gs.push(g); }
          else { if (!g) { g = { h: null, c: [], o: ord(x) }; gs.push(g); } g.c.push(x); }
        });
        gs.forEach(function (q) { q.r = q.c.filter(function (c) { return eRev(c, L); }).length; });
        gs.sort(function (a, b) { return ((b.r > 0) - (a.r > 0)) || (a.o - b.o); });
        var o = 1;
        gs.forEach(function (q) {
          if (q.h) poe(q.h, o++);
          q.c.slice().sort(function (a, b) { return (eRev(b, L) - eRev(a, L)) || (ord(a) - ord(b)); }).forEach(function (c) { poe(c, o++); });
        });
      });
      // Separador fino «Para rever» logo a seguir a «Todas».
      var abas = D.querySelector("#ipr-pg-f .abas"), b = abas && abas.querySelector('[data-aba="rev"]');
      if (b) { var t = abas.querySelector('[data-aba=""]'); var alvo = t ? t.nextElementSibling : abas.firstElementChild; if (alvo !== b) abas.insertBefore(b, alvo); }
    } catch (e) {} finally { A_CORRER = false; }
  }

  var pend = false;
  function agenda() { if (pend) return; pend = true; Promise.resolve().then(function () { pend = false; aplicar(); }); }
  function ligar() {
    var alvo = D.getElementById("ipe") || D.body; if (!alvo) return false;
    new MutationObserver(agenda).observe(alvo, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    agenda(); return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
  setInterval(function () { if (!D.hidden) aplicar(); }, 3000);
})();
