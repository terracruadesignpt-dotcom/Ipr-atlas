/* IPR Atlas · Citação da DGT nas camadas. Terracrua Design.
   26/11/2026: a DGT (Eng.º Danilo Furtado, Chefe da Divisão de Informação Geográfica) confirmou que os dados (LiDAR, SRUP, CRUS,
   COS 2023, cadastro, CAOP, ortofotomapas) são CC BY 4.0, uso comercial incluído, desde que se indique
   «Fonte: Direção-Geral do Território (DGT)» com a referência à licença CC BY 4.0. Nuno, 17h40: «muda as citações, origem dos dados».
   Este módulo reescreve o campo «fonte» de todas as camadas do catálogo (window.IPRViz.catalogo) que usam dados da DGT, para levar
   a menção exacta pedida, e junta a mesma menção à atribuição do mapa. Não mexe no viz.js. Desligar: ?citacaodgt=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]citacaodgt=0(&|$)/.test(location.search) || W.__iprCitacaoDgt) return;
  var NOME = "Direção-Geral do Território (DGT)";
  var MENCAO = "Fonte: " + NOME;
  function citar(f) {
    f = String(f || "");
    if (!/\bDGT\b|dgterritorio/i.test(f) || f.indexOf(NOME) >= 0) return f;
    if (/^\s*DGT\b/.test(f)) f = f.replace(/^\s*DGT\b\s*(·|,|\/)?\s*/, MENCAO + " · ");
    else f = f + " · " + MENCAO;
    f = f.replace(/\s·\s*$/, "");
    if (!/CC BY 4\.0/.test(f)) f += " · CC BY 4.0";
    return f;
  }
  var feitos = 0;
  function aplicar() {
    var cat = W.IPRViz && W.IPRViz.catalogo;
    if (!cat || !cat.length) return false;
    for (var i = 0; i < cat.length; i++) {
      var c = cat[i]; if (!c || c.__citDgt) continue;
      var a = c.fonte, b = citar(a);
      if (b !== a) { c.fonte = b; feitos++; }
      c.__citDgt = 1;
    }
    return true;
  }
  function atribuicao() {
    var el = D.querySelector(".maplibregl-ctrl-attrib-inner"); if (!el) return false;
    if (el.textContent.indexOf(NOME) >= 0) return true;
    var s = D.createElement("span"); s.setAttribute("data-cit-dgt", "1");
    s.textContent = (el.textContent.trim() ? " | " : "") + MENCAO + ", CC BY 4.0";
    el.appendChild(s); return true;
  }
  (function vez(n) { var a = false, b = false; try { a = aplicar(); b = atribuicao(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 200); })(0);
  setInterval(function () { try { aplicar(); atribuicao(); } catch (e) {} }, 5000);
  W.__iprCitacaoDgt = { citar: citar, feitos: function () { return feitos; } };
})();
