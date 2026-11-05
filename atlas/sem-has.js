/* IPR Atlas · sem-has.js (05/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Nuno, 05/11/2026, 11h25: «isto está a demorar demasiado tempo, isto está encravado, já nem carrega».
   Medição no Chrome do Nuno: com o Atlas parado, 7 a 8 s de bloqueio em cada 8 s. Causa principal: seis folhas de estilo
   (ipr-69, ipc-admin, ipr-arr, ipr-as, ipr-pa, ipr-cp) têm regras do tipo «body:has(#x) #y», «html:has(…)» ou
   «#ipe:has(…)». Com regras destas no topo da página, qualquer mudança em qualquer sítio obriga o navegador a reavaliar a
   página toda (15 000 elementos, 9 000 regras): 40 a 55 ms por mudança, dezenas de vezes por segundo. Sem elas: 0 a 3 ms.
   Aqui: cada uma dessas regras é trocada por uma classe no mesmo elemento (html, body ou #ipe), com o mesmo peso
   (especificidade), e a classe só é posta ou tirada quando a condição muda de facto. O aspecto fica igual.
   As regras com :has() dentro de um elemento pequeno (por exemplo «#ipr-mb:has(> ul)») ficam como estão: não pesam.
   Desligar: ?semhas=0 ou localStorage ipr_semhas_off = 1. Diagnóstico: window.__iprSemHas(). */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]semhas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_semhas_off") === "1") return; } catch (e) {}
  if (W.__iprSemHasOn) return; W.__iprSemHasOn = 1;
  try { if (!W.CSS || !CSS.supports("selector(:is(a))")) return; } catch (e) { return; }

  var CONDS = [];          // { q: selector de teste, alvo: "html"|"body"|"#ipe", cls, on }
  var POR = {};            // chave alvo|arg -> índice
  var FEITAS = typeof WeakSet === "function" ? new WeakSet() : null;
  var trocadas = 0;

  // divide por vírgulas de topo (fora de parênteses e parênteses rectos)
  function partir(s) {
    var r = [], n = 0, a = 0, i, c, q = "";
    for (i = 0; i < s.length; i++) {
      c = s[i];
      if (q) { if (c === q) q = ""; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === "(" || c === "[") n++;
      else if (c === ")" || c === "]") n--;
      else if (c === "," && n === 0) { r.push(s.slice(a, i).trim()); a = i + 1; }
    }
    r.push(s.slice(a).trim());
    return r.filter(Boolean);
  }
  // fim do parêntese que abre em s[i] (s[i] === "(")
  function fecho(s, i) {
    var n = 0, q = "";
    for (var j = i; j < s.length; j++) {
      var c = s[j];
      if (q) { if (c === q) q = ""; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === "(") n++; else if (c === ")") { n--; if (n === 0) return j; }
    }
    return -1;
  }
  // «html…:has(ARG)resto», «body…:has(ARG)resto» ou «#ipe…:has(ARG)resto», com :has no primeiro composto
  var RE = /^(html|body|#ipe)((?:\.[\w-]+|\[[^\]]*\]|:not\([^()]*\))*):has\(/;
  function cond(alvo, extra, arg) {
    var k = alvo + extra + "|" + arg;
    if (POR[k] != null) return CONDS[POR[k]];
    var testes = partir(arg).map(function (a) { return alvo + extra + " " + a; }).join(", ");
    try { D.querySelector(testes); } catch (e) { return null; }
    var o = { q: testes, alvo: alvo, cls: "iprh-" + CONDS.length, on: null };
    POR[k] = CONDS.length; CONDS.push(o);
    return o;
  }
  function trocarSel(sel) {
    var m = RE.exec(sel); if (!m) return null;
    var ini = m[0].length - 1, fim = fecho(sel, ini); if (fim < 0) return null;
    var arg = sel.slice(ini + 1, fim), resto = sel.slice(fim + 1);
    if (/:has\(/.test(resto)) return null;
    var c = cond(m[1], m[2], arg); if (!c) return null;
    // o mesmo peso que :has(ARG): o do ARG mais pesado, sem nunca coincidir (:not(*))
    var pesos = partir(arg).map(function (a) { return a.replace(/^[>+~]\s*/, ""); }).join(", ");
    return m[1] + m[2] + ":is(." + c.cls + ", :is(" + pesos + "):not(*))" + resto;
  }
  function tratarFolha(sh) {
    if (!sh || (FEITAS && FEITAS.has(sh))) return;
    var rs; try { rs = sh.cssRules; } catch (e) { return; }
    if (!rs) return;
    if (FEITAS) FEITAS.add(sh);
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i];
      if (r.type === 4 && r.cssRules) { tratarFolha(r); continue; } // @media
      if (r.type !== 1 || !r.selectorText || r.selectorText.indexOf(":has(") < 0) continue;
      var partes = partir(r.selectorText), mudou = false;
      var novas = partes.map(function (p) { var t = trocarSel(p); if (t) { mudou = true; return t; } return p; });
      if (!mudou) continue;
      var txt = novas.join(", ") + "{" + r.style.cssText + "}";
      try { sh.deleteRule(i); sh.insertRule(txt, i); trocadas++; }
      catch (e) { try { sh.insertRule(r.cssText, i); } catch (x) {} }
    }
  }
  function varrer() { for (var i = 0; i < D.styleSheets.length; i++) tratarFolha(D.styleSheets[i]); }

  function elAlvo(a) { return a === "html" ? D.documentElement : a === "body" ? D.body : D.getElementById("ipe"); }
  function avaliar() {
    for (var i = 0; i < CONDS.length; i++) {
      var c = CONDS[i], e = elAlvo(c.alvo); if (!e) continue;
      var v = false; try { v = !!D.querySelector(c.q); } catch (x) {}
      if (v !== c.on || e.classList.contains(c.cls) !== v) { c.on = v; e.classList.toggle(c.cls, v); }
    }
  }
  var pend = 0, novaFolha = false;
  function agendar() {
    if (pend) return;
    pend = requestAnimationFrame(function () { pend = 0; if (novaFolha) { novaFolha = false; try { varrer(); } catch (e) {} } try { avaliar(); } catch (e) {} });
  }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === "childList") {
        var t = m.target;
        if (t && (t.nodeName === "STYLE" || t.nodeName === "HEAD")) novaFolha = true;
        for (var j = 0; j < m.addedNodes.length; j++) { var n = m.addedNodes[j]; if (n.nodeName === "STYLE" || n.nodeName === "LINK") { novaFolha = true; if (n.nodeName === "LINK") n.addEventListener("load", function () { novaFolha = true; agendar(); }); } }
      }
    }
    agendar();
  }).observe(D.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id", "class", "hidden"] });
  W.addEventListener("load", function () { novaFolha = true; agendar(); });
  varrer(); avaliar();
  W.__iprSemHas = function () { return { trocadas: trocadas, condicoes: CONDS.map(function (c) { return c.cls + " " + (c.on ? "sim" : "não") + " · " + c.q; }) }; };
})();
