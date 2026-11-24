/* IPR Atlas · Faixas das ferramentas arrumadas (24/11/2026, 21h28). Terracrua Design.
   Nuno (fotografia, 21h28): «Epá, está muito mal». A faixa do modo (#ipr-modos-acc, «Analisar: …») e a segunda faixa
   (#ipr-trb, «Novo: O que há aqui…», nt1124-trabalho.js) ficavam soltas, uma centrada debaixo da outra, e passavam por cima
   do painel da direita.
   Agora as duas ficam alinhadas à esquerda, uma colada à outra, e só ocupam o espaço livre entre o painel das camadas e o
   painel da direita (partem linha quando não cabem). Só no computador (1024 px ou mais).
   Só acrescenta: não edita os ficheiros das faixas; usa variáveis CSS para não lutar com o posicionamento deles.
   Desligar: ?faixas=0 ou localStorage ipr_faixas=0. */
(function () {
  "use strict";
  var W = window, D = document, R = D.documentElement;
  try { if (/[?&]faixas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_faixas") === "0") return; } catch (e) {}
  if (W.__iprFaixas) return; W.__iprFaixas = 1;
  function pc() { try { return W.matchMedia("(min-width: 1024px)").matches; } catch (e) { return W.innerWidth >= 1024; } }

  var CSS =
    "html.ipr-fx #ipr-modos-acc{max-width:var(--ipr-fx-w)!important;flex-wrap:wrap!important;justify-content:flex-start!important;border-radius:18px!important;row-gap:4px}" +
    "html.ipr-fx #ipr-trb{left:var(--ipr-fx-x)!important;top:var(--ipr-fx-y)!important;transform:none!important;min-width:0!important;max-width:var(--ipr-fx-w)!important;align-items:flex-start!important}" +
    "html.ipr-fx #ipr-trb .fx{justify-content:flex-start!important;border-radius:18px!important;max-width:100%}";

  function visivel(e) { return e && e.getClientRects().length && getComputedStyle(e).display !== "none"; }
  function direita() {
    var c = ["ipe-dir", "ipr-exd-dir"].map(function (i) { return D.getElementById(i); }).filter(visivel), x = W.innerWidth;
    c.forEach(function (e) { var r = e.getBoundingClientRect(); if (r.width > 120 && r.left > W.innerWidth / 2) x = Math.min(x, r.left); });
    return x;
  }
  function correr() {
    if (!D.head) return;
    if (!pc()) { R.classList.remove("ipr-fx"); return; }
    if (!D.getElementById("ipr-fx-css")) { var s = D.createElement("style"); s.id = "ipr-fx-css"; s.textContent = CSS; D.head.appendChild(s); }
    var acc = D.getElementById("ipr-modos-acc");
    if (!visivel(acc)) { R.classList.remove("ipr-fx"); return; }
    R.classList.add("ipr-fx");
    var r = acc.getBoundingClientRect(), livre = Math.max(320, Math.round(direita() - r.left - 14));
    R.style.setProperty("--ipr-fx-w", livre + "px");
    R.style.setProperty("--ipr-fx-x", Math.round(r.left) + "px");
    R.style.setProperty("--ipr-fx-y", Math.round(r.bottom + 6) + "px");
  }
  (function vez(n) { correr(); if (n < 60) setTimeout(function () { vez(n + 1); }, 500); })(0);
  setInterval(correr, 700);
  W.addEventListener("resize", correr);
})();
