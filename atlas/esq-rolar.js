/* IPR Atlas · a barra da esquerda rola sempre (Nuno, 3/11/2026, 18h40: «a barra da esquerda das camadas, às vezes quando
   se carrega lá em baixo nas últimas categorias, depois é que fica preso, já não faz scroll»).
   Causa, reproduzida no Atlas real: dentro da barra (#ipe-esq) há caixas com barra de rolar própria (.ipe-sbc, .ipr-arv,
   .ipr-cq-c das Camadas ligadas) com overscroll-behavior: contain. Com o dedo ou o rato em cima de uma delas, quando ela
   já não tem mais para rolar (ou não tem nada para rolar), o gesto morre ali e não passa para a barra: a barra fica presa.
   Correcção: só a barra mantém «contain» (para a página não saltar); as caixas lá dentro passam o gesto à barra quando
   chegam ao fim. Nada mais muda. Desligar: ?esqrolar=0 ou localStorage ipr_esqrolar_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]esqrolar=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_esqrolar_off") === "1") return; } catch (e) {}
  if (W.__iprEsqRolar) return; W.__iprEsqRolar = 1;
  try {
    var st = D.createElement("style"); st.id = "ipr-esq-rolar";
    st.textContent = "#ipe #ipe-esq *,#ipe #ipe-esq.ipe-esq *{overscroll-behavior:auto!important;overscroll-behavior-y:auto!important}" +
      "#ipe #ipe-esq{overscroll-behavior-y:contain}";
    (D.head || D.documentElement).appendChild(st);
  } catch (e) {}
})();
