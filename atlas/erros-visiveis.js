/* IPR Atlas · Erros visíveis. Terracrua Design. Auditoria de 10/11/2026 (Nuno: «procure exaustivamente», «avança com tudo»).
   No registo de erros da equipa (tcd_acp_erros) a maior parte das entradas era «Script error.», sem mensagem nem linha.
   Causa: guiões de outros domínios injectados a meio do arranque sem crossorigin (pmtiles em viz.js, bacias-ipr.js e
   area-teste-ipr.js; pdf.js, sql.js e qrcode em ajustes.js, qfield.js e pdf-janela.js). O navegador esconde a mensagem de
   qualquer erro desses guiões. Este ficheiro corre primeiro e, antes de um <script> do jsDelivr ou do cdnjs entrar na página,
   põe-lhe crossorigin="anonymous" (os dois CDN respondem com Access-Control-Allow-Origin: *, como os do atlas.json, que já
   levam a mesma marca desde 31/10). Não muda o que o guião faz; só deixa o erro chegar ao registo com mensagem e linha.
   Desligar: localStorage «ipr-erros-visiveis» = «0» no navegador. Não mexe em nenhum outro ficheiro. */
(function (W, D) {
  "use strict";
  if (W.__iprErrosVisiveis) return; W.__iprErrosVisiveis = true;
  try { if (W.localStorage && W.localStorage.getItem("ipr-erros-visiveis") === "0") return; } catch (e) {}
  var CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\//i;
  function marca(n) {
    try {
      if (n && n.nodeType === 1 && n.tagName === "SCRIPT" && !n.hasAttribute("crossorigin")) {
        var s = n.getAttribute("src") || "";
        if (CDN.test(s)) n.crossOrigin = "anonymous";
      }
    } catch (e) {}
    return n;
  }
  var P = W.Node && W.Node.prototype; if (!P) return;
  ["appendChild", "insertBefore", "replaceChild"].forEach(function (k) {
    var f = P[k]; if (typeof f !== "function") return;
    P[k] = function (n) { marca(n); return f.apply(this, arguments); };
  });
  var E = W.Element && W.Element.prototype;
  if (E) ["append", "prepend", "before", "after", "replaceWith"].forEach(function (k) {
    var f = E[k]; if (typeof f !== "function") return;
    E[k] = function () { for (var i = 0; i < arguments.length; i++) marca(arguments[i]); return f.apply(this, arguments); };
  });
})(window, document);
