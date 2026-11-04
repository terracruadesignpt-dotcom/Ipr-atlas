/* IPR Atlas · agua-entrada.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Queixa do Nuno, 04/11/2026, 12h55: «a partilha das simulações não está a funcionar, não carrega o mapa».
   Causa: quem abre uma ligação só de ver (/atlas/?agua=<código>) sem ter usado o Atlas antes recebe o ecrã de entrada do
   inicio.js («O seu terreno, num mapa», fundo opaco por cima de tudo). O inicio.js só se cala quando o endereço traz um
   destino (modo, mapa, nic, v, tour…) e «agua» não estava na lista; o cartão do resultado e as camadas ficavam por baixo.
   Quem já tinha carregado em «Explorar o mapa completo» (como a equipa) não via o problema.
   Aqui, com ?agua=<código> válido:
   1. window.IPR_INICIO_OFF = true antes do inicio.js (o mesmo que o convites-visiveis.js faz para os convites);
   2. se ainda assim aparecer um ecrã de entrada (#ipr-ini) ou a triagem «Por onde começar?» nos primeiros 30 s, fecha-se
      pelos próprios botões.
   Entra no atlas.json antes do inicio.js. Desligar: ?agua-entrada=0. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document, q;
  try { q = new URLSearchParams(W.location.search); } catch (e) { return; }
  var cod = q.get("agua");
  if (!cod || !/^[A-Za-z0-9]{12}$/.test(cod) || q.get("agua-entrada") === "0") return;
  W.IPR_INICIO_OFF = true;
  if (W.__iprAguaEntrada) return; W.__iprAguaEntrada = 1;
  var t0 = Date.now();
  function limpar() {
    try {
      var ini = D.getElementById("ipr-ini");
      if (ini) ini.remove();
      var tri = D.querySelector('[data-a63="fechar"]');
      if (tri && tri.offsetParent !== null) tri.click();
    } catch (e) {}
  }
  var obs = W.MutationObserver ? new MutationObserver(function () { if (Date.now() - t0 > 30000) { obs.disconnect(); return; } limpar(); }) : null;
  function ligar() { if (obs && D.body) obs.observe(D.body, { childList: true, subtree: true }); limpar(); }
  if (D.body) ligar(); else D.addEventListener("DOMContentLoaded", ligar);
  setTimeout(function () { if (obs) obs.disconnect(); }, 30000);
})();
