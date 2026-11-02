/* IPR Atlas · um só botão de modo no topo (2/11/2026, 14h35; vídeo do Bernardo: «Mapa simples» e «Modo simples» lado a
   lado, nomes quase iguais e a trocar de lugar enquanto a página carrega, porque o limpo.js e o mapa-simples.js põem cada
   um o seu botão em primeiro lugar). Escolha do Nuno: «Um só botão». Fica o «Modo simples / Modo completo» (limpo.js);
   o botão «Mapa simples» (mapa-simples.js, #ipr-msimples) deixa de aparecer no topo. Tirar as camadas faz-se com
   «Limpar mapa», no painel das camadas ligadas (activas.js), que tem «Desfazer». O mapa simples automático ao encomendar
   continua. Sem mexer no limpo.js nem no mapa-simples.js. Desligar: ?umbotao=0. */
(function () {
  "use strict";
  try { if (/[?&]umbotao=0\b/.test(location.search)) return; } catch (e) {}
  if (window.__iprUmBotao) return; window.__iprUmBotao = 1;
  try {
    var st = document.createElement("style"); st.id = "ipr-umbotao-css";
    st.textContent = "#ipe .ipe-top #ipr-msimples,#ipe .ipe-top #ipr-ms-b{display:none!important}";
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
})();
