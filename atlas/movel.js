/* IPR Atlas · ajustes para telemóvel, 1/11/2026. IPR – Instituto de Planeamento Regenerativo. Só acrescenta CSS e uma classe;
   não mexe noutros ficheiros. Pedido do Nuno (16h47): «Não se vê as camadas nem o botão das línguas»; 16h48: «Versão mobile
   não dá para simular ou escolher o ponto».
   1. Barra de topo (ecrã até 640 px): o grupo da direita (.ipe-tr) passava a largura do ecrã (553 px num ecrã de 428) e
      empurrava para fora o botão Camadas, metade do PT/EN, Entrar, Mais e Comprar. Passa a deslizar na horizontal, com
      Camadas e PT/EN à frente, e os botões ficam mais compactos.
   2. Painel das camadas (à esquerda) por cima dos botões do mapa (zoom, bússola, localização), que o tapavam.
   3. Simuladores de fogo (#ipr-fs) e de água (#ipr-as): enquanto se marca no mapa (caixa .des), o painel encolhe para o
      cabeçalho e a caixa da marcação, encostado em baixo, e o mapa fica livre para tocar. Acaba quando a caixa sai.
   4. (01/11/2026, auditoria do funil) «Comprar» e «Entrar» passam para o início da barra de topo, sempre à vista; o resto
      continua lá, a deslizar.
   Desligar: ?movel=0 ou localStorage ipr_movel_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]movel=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_movel_off") === "1") return; } catch (e) {}
  if (D.getElementById("ipr-movel-css")) return;
  var CSS =
    "@media (max-width:640px){" +
      "#ipe .ipe-top{gap:6px!important;padding-left:8px!important;padding-right:8px!important;min-width:0!important}" +
      "#ipe .ipe-top>.ipe-marca{flex:0 0 auto}" +
      "#ipe #ipe-nivel{font-size:10px!important;padding:3px 6px!important;letter-spacing:.03em!important;flex:0 0 auto}" +
      "#ipe .ipe-tr{flex:1 1 auto!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden;justify-content:flex-start!important;gap:6px!important;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}" +
      "#ipe .ipe-tr::-webkit-scrollbar{display:none}" +
      "#ipe .ipe-tr>*{flex:0 0 auto!important}" +
      "#ipe #ipr-cp-b{order:-6}#ipe #ipe-entrar{order:-5}#ipe #ipe-camadas{order:-3}#ipe #ipr-lg-topo{order:-2}#ipe #ipr-msimples{order:-1;font-size:12px!important;padding:5px 9px!important}" +
      "#ipe>.ipe-esq,#ipe>#ipe-esq{z-index:31!important}" +
      "#ipr-fs.ipr-mv-pick,#ipr-as.ipr-mv-pick{top:auto!important;bottom:64px!important;max-height:none!important;height:auto!important}" +
      "#ipr-fs.ipr-mv-pick .fs-tabs,#ipr-as.ipr-mv-pick .fs-tabs,#ipr-as.ipr-mv-pick [class*=tabs]{display:none!important}" +
      "#ipr-fs.ipr-mv-pick .fs-corpo *:not(.des):not(.des *):not(:has(.des)),#ipr-as.ipr-mv-pick .fs-corpo *:not(.des):not(.des *):not(:has(.des)){display:none!important}" +
      "#ipr-fs.ipr-mv-pick .fs-corpo,#ipr-as.ipr-mv-pick .fs-corpo{overflow:visible!important;padding-top:4px!important;padding-bottom:6px!important}" +
      "#ipr-fs.ipr-mv-pick .des,#ipr-as.ipr-mv-pick .des{margin:2px 0!important}" +
    "}";
  var st = D.createElement("style"); st.id = "ipr-movel-css"; st.textContent = CSS; D.head.appendChild(st);
  function estreito() { return W.matchMedia ? W.matchMedia("(max-width:640px)").matches : W.innerWidth <= 640; }
  function rever() {
    ["ipr-fs", "ipr-as"].forEach(function (id) {
      var p = D.getElementById(id); if (!p) return;
      var on = estreito() && !p.hidden && !!p.querySelector(".des");
      if (p.classList.contains("ipr-mv-pick") !== on) p.classList.toggle("ipr-mv-pick", on);
    });
    // Mostrar o botão Camadas na faixa visível, uma vez, quando a barra desliza.
    var tr = D.querySelector("#ipe .ipe-tr");
    if (tr && estreito() && tr.scrollWidth > tr.clientWidth && !tr.__mv) { tr.__mv = 1; tr.scrollLeft = 0; }
  }
  var pend = 0;
  function agendar() { if (pend) return; pend = 1; (W.requestAnimationFrame || setTimeout)(function () { pend = 0; rever(); }); }
  function arrancar() {
    try { new MutationObserver(agendar).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] }); } catch (e) {}
    W.addEventListener("resize", agendar);
    rever();
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
