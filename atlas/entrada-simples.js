/* IPR Atlas · Entrada simples no computador. Terracrua Design.
   Nuno, 11/11/2026, 11h32 («simplifica, tira isso»), achados E-08 e E-09 da auditoria de 10/11:
   - com a janela de boas-vindas aberta (#ipr-exd-bv), o aviso «A preparar o mapa…» (#ipr-ca, carregar-aviso.js) ficava por
     cima do texto da Planta de Localização: enquanto a janela está aberta, o aviso não aparece (o mapa carrega por trás);
   - havia duas caixas de pesquisa à vista ao mesmo tempo (a da barra de cima, #ipr-exd-q, e a da janela): enquanto a janela
     está aberta, a da barra de cima fica escondida; volta quando a janela fecha.
   - no Explorer, a entrada antiga do inicio.js nunca volta a aparecer por cima (nem depois dos primeiros 30 s).
   Só CSS e uma marca na <html>; não mexe no explorer-pc.js nem no carregar-aviso.js. Desligar: ?entrada=0. */
(function (W, D) {
  "use strict";
  if (W.__iprEntradaSimples) return; W.__iprEntradaSimples = true;
  try { if (/[?&]entrada=0\b/.test(location.search)) return; } catch (e) {}
  var CL = "ipr-bv-aberta", H = null;
  function estilo() {
    if (D.getElementById("ipr-entrada-simples-css")) return;
    var s = D.createElement("style"); s.id = "ipr-entrada-simples-css";
    s.textContent = "html." + CL + " #ipr-ca{display:none!important}" +
      "html." + CL + " #ipr-exd-top form:has(#ipr-exd-q){visibility:hidden!important}";
    (D.head || D.documentElement).appendChild(s);
  }
  function aberta() {
    var b = D.getElementById("ipr-exd-bv"); if (!b || b.hidden) return false;
    var c = getComputedStyle(b), r = b.getBoundingClientRect();
    return c.display !== "none" && c.visibility !== "hidden" && +c.opacity > 0 && r.width > 0 && r.height > 0;
  }
  var t = 0, vigia = 0;
  // A entrada antiga do inicio.js (#ipr-ini) sai sempre que a do Explorer existe: o nt1111-funil-direto.js só a tirava
  // nos primeiros 30 s, e numa ligação lenta ela aparecia depois, como terceira entrada (teste de 11/11, 11h50).
  function semIni() {
    var c = H.classList; if (!(c.contains("ipr-exd") || c.contains("ipr-exm"))) return;
    var o = D.getElementById("ipr-ini"); if (o) { o.remove(); c.remove("ipr-ini-on"); }
  }
  function ver() {
    t = 0; semIni();
    var a = aberta(); if (a !== H.classList.contains(CL)) H.classList.toggle(CL, a);
    // enquanto a janela está marcada como aberta, confirma de 0,7 em 0,7 s (ela fecha com transição, sem mais mudanças)
    if (a && !vigia) vigia = setInterval(function () { if (!aberta()) { H.classList.remove(CL); clearInterval(vigia); vigia = 0; } }, 700);
  }
  function agenda() { if (!t) t = setTimeout(ver, 120); }
  function arranca() {
    H = D.documentElement; estilo(); ver();
    if (W.MutationObserver) new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arranca); else arranca();
})(window, document);
