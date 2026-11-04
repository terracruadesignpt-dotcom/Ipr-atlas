/* IPR Atlas · menos janelas ao abrir (Nuno, 04/11/2026, 01h23, captura do iPhone com «Comprar passo a passo» aberto:
   «Isto não devia estar sempre a aparecer»). O assistente de compra (assistente.js v2) abre sozinho uma vez por sessão do
   navegador; no iPhone a sessão recomeça quase sempre, por isso aparecia em cada visita. Agora abre sozinho só na primeira
   visita deste navegador e nunca com sessão iniciada (conta da equipa ou de cliente). O botão do assistente continua no
   mapa. Carrega-se antes do assistente.js e só marca a chave que ele já respeita (sessionStorage ipr_as_auto).
   Desligar: localStorage ipr_menos_janelas_off = 1. Terracrua Design. */
(function () {
  "use strict";
  try {
    if (localStorage.getItem("ipr_menos_janelas_off") === "1") return;
    var visto = localStorage.getItem("ipr_as_visto") === "1";
    var sessao = !!window.tcdNonce || /(^|;\s*)wordpress_logged_in_/.test(document.cookie);
    if (visto || sessao) sessionStorage.setItem("ipr_as_auto", "1");
    localStorage.setItem("ipr_as_visto", "1");
  } catch (e) {}
})();
