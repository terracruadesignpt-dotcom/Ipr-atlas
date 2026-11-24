/* IPR Atlas · Limpezas pedidas pelo Nuno (24/11/2026, 22h04). Terracrua Design.
   1. «Espanha» por cima de Portugal (telemóvel, 21h00): é o selo do país do centro do mapa (#ipr-c89-p, bandeira e nome).
      Com o mapa de Portugal inteiro o centro caía em Espanha e confundia. O selo sai.
   2. «Duas bússolas» no computador (21h05): a de cima à direita é a rosa (.ipe-rosa) da barra vertical .ipe-tools, que o
      nt1124-ferramentas.js já queria esconder mas a regra dele perdia para a da interface 2. Fica só o controlo de baixo
      à esquerda (#ipr-nav). Os botões da barra continuam no DOM (os menus Analisar/Desenhar/Recolher carregam neles).
   Só CSS. Desligar: ?limpezas=0. */
(function () {
  "use strict";
  var D = document;
  if (/[?&]limpezas=0(&|$)/.test(location.search) || D.getElementById("ipr-lz-css")) return;
  var s = D.createElement("style"); s.id = "ipr-lz-css";
  s.textContent =
    "#ipr-c89-p{display:none!important}" +
    "@media (min-width:1024px){html:has(#ipr-nav) body #ipe-mapa.ipe-mapa>.ipe-tools.ipe-tools{display:none!important}}";
  (D.head || D.documentElement).appendChild(s);
})();
