/* IPR Atlas · Citação da DGADR nas camadas de solos. Terracrua Design.
   27/11/2026: a DGADR (Direcção, ref. DGADR-S04899-202611-DSTAR\DOER) autorizou o uso livre da informação geográfica para
   planeamento, investigação e produtos derivados, com a menção obrigatória da fonte em todas as publicações e suportes:
   «Informação cedida pela Direção-Geral de Agricultura e Desenvolvimento Rural». Nuno, 23h50: «Pública já».
   Reescreve o campo «fonte» das camadas do catálogo (window.IPRViz.catalogo) com dados da DGADR e junta a menção à atribuição
   do mapa. Não mexe no viz.js. Desligar: ?citacaodgadr=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]citacaodgadr=0(&|$)/.test(location.search) || W.__iprCitacaoDgadr) return;
  var MENCAO = "Informação cedida pela Direção-Geral de Agricultura e Desenvolvimento Rural";
  function ehDgadr(c) { return /\bDGADR\b|dgadr/i.test(String(c.fonte || "") + " " + String(c.url || "") + " " + String(c.u || "")); }
  function citar(f) {
    f = String(f || "");
    if (f.indexOf(MENCAO) >= 0) return f;
    if (/^\s*DGADR\s*$/i.test(f) || !f.trim()) return MENCAO;
    if (/\bDGADR\b/.test(f)) return f.replace(/\bDGADR\b/, MENCAO);
    return f + " · " + MENCAO;
  }
  var feitos = 0, ha = false;
  function aplicar() {
    var cat = W.IPRViz && W.IPRViz.catalogo;
    if (!cat || !cat.length) return false;
    for (var i = 0; i < cat.length; i++) {
      var c = cat[i]; if (!c || c.__citDgadr) continue;
      if (ehDgadr(c)) { var b = citar(c.fonte); if (b !== c.fonte) { c.fonte = b; feitos++; } ha = true; }
      c.__citDgadr = 1;
    }
    return true;
  }
  function atribuicao() {
    if (!ha) return true;
    var el = D.querySelector(".maplibregl-ctrl-attrib-inner"); if (!el) return false;
    if (el.textContent.indexOf(MENCAO) >= 0) return true;
    var s = D.createElement("span"); s.setAttribute("data-cit-dgadr", "1");
    s.textContent = (el.textContent.trim() ? " | " : "") + "Solos: " + MENCAO;
    el.appendChild(s); return true;
  }
  (function vez(n) { var a = false, b = false; try { a = aplicar(); b = atribuicao(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 200); })(0);
  setInterval(function () { try { aplicar(); atribuicao(); } catch (e) {} }, 5000);
  W.__iprCitacaoDgadr = { citar: citar, feitos: function () { return feitos; } };
})();
