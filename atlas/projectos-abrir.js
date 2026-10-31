/* IPR Atlas · projectos-abrir.js (31/10/2026, 01h50). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   1. «Ver no mapa» nos cartões dos projectos (botão do ajustes.js §24/10) só enquadrava o limite: o projecto aberto
      continuava a ser o anterior (por exemplo uma Base «para rever»), com as camadas e o bloco da esquerda dele. Nuno, 01h26:
      «carrego num, ver no mapa, e está sempre a voltar para uma base para rever». Agora, se o projecto do cartão não é o
      que está aberto, abre-o pelo caminho normal do Atlas (o mesmo do toque no cartão), que já enquadra o terreno. Se já é o
      aberto, deixa o ajustes.js enquadrar como antes.
   2. «Partilhar» na barra de ícones: nas Bases «para rever» (e nas que não são suas) o cartão não tem a parte de partilha e
      o botão não fazia nada. Agora diz porquê, em vez de ficar calado.
   Desligar: ?pabrir=0 ou localStorage ipr_pabrir_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]pabrir=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_pabrir_off") === "1") return; } catch (e) {}
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function aviso(junto, txt) {
    var a = D.createElement("div");
    a.setAttribute("role", "status");
    a.style.cssText = "position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:100000;max-width:min(92vw,460px);background:#14200F;color:#F2EFE6;border:1px solid #9BC53D;border-radius:8px;padding:10px 14px;font:13px/1.4 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)";
    a.textContent = txt;
    D.body.appendChild(a);
    setTimeout(function () { try { a.remove(); } catch (e) {} }, 6000);
  }
  // 1. Ver no mapa: abre o projecto do cartão
  D.addEventListener("click", function (e) {
    var bt = e.target && e.target.closest && e.target.closest(".ipr-ver-mapa"); if (!bt) return;
    var card = bt.closest(".ipe-card[data-i]"), P = est(); if (!card || !P || !P.mapas) return;
    var m = P.mapas[+card.dataset.i]; if (!m) return;
    if (P.modo === "cliente" && P.actual === m) return; // já é o aberto: o ajustes.js enquadra
    var alvo = card.querySelector(".ipe-thumb") || card.querySelector(".ipe-ct strong");
    if (!alvo) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    alvo.click(); // o app.js abre o projecto (B «cliente») e enquadra o terreno
  }, true);
  // 2. Partilhar sem parte de partilha no cartão
  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-psh],[data-a=partilhar]"); if (!b) return;
    var id = +(b.dataset.psh || 0), t0 = Date.now();
    setTimeout(function ver() {
      var sh = D.querySelector("#ipe-proj .ipe-sh");
      if (sh && sh.offsetParent) return;
      if (Date.now() - t0 < 2500) return void setTimeout(ver, 300);
      var P = est(), m = null;
      (P && P.mapas || []).forEach(function (x) { if (+(x.encomenda || x.id) === id || +x.id === id) m = x; });
      var txt;
      if (m && m.rever) txt = pt() ? "Esta Base ainda está em revisão pela equipa: só se pode partilhar depois de entregue ao cliente." : "This Base Map is still in team review: it can be shared once it is delivered.";
      else if (m && m.dono === false) txt = pt() ? "Este projecto foi partilhado consigo: só quem o encomendou o pode partilhar." : "This project was shared with you: only its owner can share it.";
      else txt = pt() ? "Não foi possível abrir a partilha deste projecto. Abra o cartão e use «Partilhar» lá dentro." : "Could not open sharing for this project. Open the card and use «Share» inside it.";
      aviso(b, txt);
    }, 300);
  }, true);
})();
