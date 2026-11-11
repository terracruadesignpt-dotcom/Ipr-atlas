/* IPR Atlas · Créditos de desenvolvimento dos simuladores. Terracrua Design.
   Pedido do Nuno, 10/11/2026, 21h28: «Os simuladores prestam crédito aos que ajudam. Para além de mim, o Bernardo Sampaio
   fica já nos créditos de desenvolvimento do simulador de água.»
   Acrescenta uma linha discreta ao fundo dos painéis «Simular água» (#ipr-as) e «Simular fogo» (#ipr-fs).
   Não mexe em agua-simulador.js nem em fogo-simulador.js: liga-se pelo DOM e volta a pôr a linha se o painel for redesenhado.
   Para acrescentar alguém: juntar o nome à lista do simulador em CRED. */
(function (W, D) {
  "use strict";
  if (W.__iprSimCreditos) return; W.__iprSimCreditos = true;
  var CRED = {
    "ipr-as": ["Nuno Mamede Santos", "Bernardo Sampaio"],
    "ipr-fs": ["Nuno Mamede Santos"]
  };
  function lingua() { var l = String(W.IPR_LINGUA || D.documentElement.lang || "pt").toLowerCase(); return l.indexOf("pt") === 0 ? "pt" : "en"; }
  function lista(nomes, pt) {
    if (nomes.length < 2) return nomes.join("");
    return nomes.slice(0, -1).join(", ") + (pt ? " e " : " and ") + nomes[nomes.length - 1];
  }
  function texto(id) {
    var pt = lingua() === "pt";
    return (pt ? "Desenvolvimento: " : "Development: ") + lista(CRED[id], pt) + " · IPR";
  }
  var CSS = ".ipr-sim-cred{margin:0;padding:6px 12px 8px;border-top:1px solid var(--ln,#2b3024);font:400 11px Inter,sans-serif;color:var(--mu,#a3a690);opacity:.85;letter-spacing:.01em}";
  function estilo() {
    if (D.getElementById("ipr-sim-cred-css")) return;
    var s = D.createElement("style"); s.id = "ipr-sim-cred-css"; s.textContent = CSS; (D.head || D.documentElement).appendChild(s);
  }
  function por() {
    for (var id in CRED) {
      var p = D.getElementById(id);
      if (!p) continue;
      var c = p.querySelector(":scope > .ipr-sim-cred");
      var t = texto(id);
      if (c && c === p.lastElementChild) { if (c.textContent !== t) c.textContent = t; continue; }
      if (c) c.remove();
      estilo();
      c = D.createElement("p"); c.className = "ipr-sim-cred"; c.textContent = t;
      p.appendChild(c);
    }
  }
  var marca = 0;
  function agenda() { if (marca) return; marca = W.requestAnimationFrame ? W.requestAnimationFrame(function () { marca = 0; por(); }) : setTimeout(function () { marca = 0; por(); }, 50); }
  function arranca() {
    por();
    if (W.MutationObserver) new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arranca); else arranca();
})(window, document);
