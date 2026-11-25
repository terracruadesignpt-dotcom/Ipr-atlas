/* IPR Atlas · «Conversores» no menu Ferramentas (25/11/2026, 00h50). Terracrua Design.
   Nuno (00h06): «nas ferramentas do IPR, quero ter lá a página Conversores». Acrescenta um botão ao fim da barra
   Ferramentas (#ipr-pb-barra: Medir, Desenhar, Perfil, 3D, Imprimir) que abre /conversores/ noutro separador, para o mapa
   ficar como está. Só acrescenta; não edita outros ficheiros. Desligar: ?conversores=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]conversores=0(&|$)/.test(location.search) || W.__iprCvMenu) return; W.__iprCvMenu = 1;
  var en = function () { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; };
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/></svg>';
  function por() {
    var b = D.getElementById("ipr-pb-barra"); if (!b || b.querySelector("[data-ipr-cv]")) return;
    var x = D.createElement("button"); x.type = "button"; x.setAttribute("data-ipr-cv", "1");
    var t = en() ? "Converters: AutoCAD, GIS, survey and 3D files" : "Conversores: AutoCAD, SIG, topografia e 3D";
    x.setAttribute("aria-label", t); x.setAttribute("data-ipr-tip", t);
    x.innerHTML = SVG + "<span>" + (en() ? "Converters" : "Conversores") + "</span>";
    x.addEventListener("click", function () { var w = W.open("/conversores/", "_blank", "noopener"); if (!w) location.href = "/conversores/"; });
    b.appendChild(x);
  }
  por(); var n = 0, t = setInterval(function () { por(); if (++n > 40) { clearInterval(t); setInterval(por, 10000); } }, 1500);
})();
