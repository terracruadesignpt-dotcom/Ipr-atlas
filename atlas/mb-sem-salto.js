/* IPR Atlas · lista das camadas da Base sem saltos (Nuno, 2/11/2026, 09h12: «Quando carrego no check de uma camada o ecrã
   salta»). Acrescento, sem mexer no minhas-bases.js: a cada caixa ligada ou desligada, o minhas-bases.js refaz a lista toda
   (pintar: esvazia a caixa #ipr-mb e volta a enchê-la). A caixa tinha altura máxima de 52 % do ecrã e barra de rolar própria
   (invisível no Mac): ao esvaziar, essa barra voltava ao início, e era o salto. A mesma altura máxima escondia metade das
   camadas da Base (Hidrologia, Erosão, vento) dentro da caixa, sem se perceber que havia mais (Nuno, 09h15, Monte Branco
   da Serra: as 16 camadas estão na entrega, só não se viam).
   Este guião: (1) tira a altura máxima, para a lista toda correr com a barra da esquerda; (2) guarda, antes do clique, onde
   estava a linha no ecrã e o deslocamento das caixas com barra de rolar; depois de cada refazer (o primeiro e os que vêm
   logo a seguir, quando a camada acaba de ligar) põe a mesma linha no mesmo sítio e devolve o foco à caixa, sem rolar.
   Desligar: ?mbsalto=0 ou localStorage ipr_mbsalto_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]mbsalto=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_mbsalto_off") === "1") return; } catch (e) {}
  if (W.__iprMbSalto) return; W.__iprMbSalto = 1;

  var ANC = null, OBS = null, OBSBOX = null;
  try {
    var st = D.createElement("style"); st.id = "ipr-mbsalto-css";
    st.textContent = "#ipr-mb{max-height:none!important;overflow-y:visible!important}";
    (D.head || D.documentElement).appendChild(st);
  } catch (e) {}

  function rolaveis(el) {
    var r = [];
    for (var p = el; p && p !== D.documentElement; p = p.parentElement) {
      if (p.scrollHeight > p.clientHeight + 1) {
        var o = getComputedStyle(p).overflowY; if (o === "auto" || o === "scroll" || o === "overlay") r.push({ el: p, top: p.scrollTop });
      }
    }
    return r;
  }
  function chaveDe(el) {
    var c = el.closest("[data-mb-c]"); if (c) return { a: "data-mb-c", v: c.getAttribute("data-mb-c"), b: (el.closest("[data-mb]") || {}).getAttribute ? el.closest("[data-mb]").getAttribute("data-mb") : "" };
    var f = el.closest("[data-mb-foco]"); if (f) return { a: "data-mb-foco", v: f.getAttribute("data-mb-foco"), b: "" };
    return null;
  }
  function procura(box, k) {
    var q = "[" + k.a + '="' + String(k.v).replace(/["\\]/g, "\\$&") + '"]';
    if (k.b) { var li = box.querySelector('[data-mb="' + String(k.b).replace(/["\\]/g, "\\$&") + '"]'); var x = li && li.querySelector(q); if (x) return x; }
    return box.querySelector(q);
  }
  function guarda(alvo) {
    var box = D.getElementById("ipr-mb"); if (!box || !box.contains(alvo)) return;
    var k = chaveDe(alvo); if (!k) return;
    var linha = procura(box, k) || alvo;
    ANC = { k: k, y: linha.getBoundingClientRect().top, rol: rolaveis(box), wy: W.scrollY, ck: alvo.type === "checkbox", ate: Date.now() + 2500 };
    vigia(box);
  }
  function repoe() {
    if (!ANC) return;
    if (Date.now() > ANC.ate) { ANC = null; return; }
    var box = D.getElementById("ipr-mb"); if (!box) return;
    // 1) devolve o deslocamento que havia (o esvaziar cortou-o)
    ANC.rol.forEach(function (r) { if (D.contains(r.el) && Math.abs(r.el.scrollTop - r.top) > 1) r.el.scrollTop = r.top; });
    if (Math.abs(W.scrollY - ANC.wy) > 1) W.scrollTo(W.scrollX, ANC.wy);
    // 2) acerta para a linha ficar exactamente onde estava (a lista pode ter mudado de altura por cima dela)
    var linha = procura(box, ANC.k); if (!linha) return;
    var dy = linha.getBoundingClientRect().top - ANC.y;
    if (Math.abs(dy) > 1 && ANC.rol.length) { var c = ANC.rol[0].el; c.scrollTop += dy; ANC.rol[0].top = c.scrollTop; }
    // 3) foco de volta à caixa, sem rolar
    if (ANC.ck) {
      var ck = linha.matches && linha.matches('input[type="checkbox"]') ? linha : linha.querySelector('input[type="checkbox"]');
      if (ck && D.activeElement !== ck) try { ck.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  function vigia(box) {
    if (OBSBOX === box) return;
    if (OBS) try { OBS.disconnect(); } catch (e) {}
    OBSBOX = box;
    OBS = new MutationObserver(function () { if (ANC) { repoe(); W.requestAnimationFrame(repoe); } });
    OBS.observe(box, { childList: true });
  }

  // Corre antes do minhas-bases.js (que ouve na própria caixa): fase de captura no documento.
  D.addEventListener("pointerdown", function (e) { try { if (e.target.closest && e.target.closest("#ipr-mb")) guarda(e.target); } catch (x) {} }, true);
  D.addEventListener("keydown", function (e) { try { if ((e.key === " " || e.key === "Enter") && e.target.closest && e.target.closest("#ipr-mb")) guarda(e.target); } catch (x) {} }, true);
  D.addEventListener("change", function (e) {
    try {
      var t = e.target; if (!t || t.type !== "checkbox" || !t.closest || !t.closest("#ipr-mb")) return;
      if (!ANC) guarda(t); else ANC.ate = Date.now() + 2500;
      // o refazer acontece já a seguir (no mesmo evento) e outra vez quando a camada acaba de ligar
      W.requestAnimationFrame(repoe); setTimeout(repoe, 150); setTimeout(repoe, 600);
    } catch (x) {}
  }, true);
  D.addEventListener("click", function (e) {
    try {
      var b = e.target.closest && e.target.closest("#ipr-mb [data-mb-acc]"); if (!b) return;
      var a = b.getAttribute("data-mb-acc"); if (a === "ver" || a === "ficha") return; // estes mudam de vista de propósito
      if (!ANC) guarda(b);
      W.requestAnimationFrame(repoe); setTimeout(repoe, 150);
    } catch (x) {}
  }, true);
})();
