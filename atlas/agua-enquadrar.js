/* IPR Atlas · Simular água: separadores todos à vista e «As minhas simulações» no topo (Nuno, 04/11/2026 10h43:
   «não dá para ver os separadores todos» e «não estou a ver onde estão as minhas simulações»).
   Só acrescenta: CSS para os separadores em grelha e, depois de cada pintura do painel #ipr-as, passa o bloco
   «Simulações deste mapa» (que ficava no fim, depois dos resultados) para o topo do corpo, numa caixa.
   Não mexe no agua-simulador.js. Desliga-se com ?agua-enquadrar=0 ou localStorage ipr_agua_enq_off=1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try {
    if (/[?&]agua-enquadrar=0\b/.test(location.search) || W.localStorage.getItem("ipr_agua_enq_off") === "1") return;
  } catch (e) {}
  var st = D.createElement("style");
  st.id = "ipr-agua-enq-css";
  st.textContent =
    "#ipr-as{width:400px}" +
    "#ipr-as .as-tabs{display:grid!important;grid-template-columns:1fr 1fr;gap:4px;overflow:visible!important;padding:8px}" +
    "#ipr-as .as-tabs button{white-space:normal!important;text-align:center;padding:6px 8px;line-height:1.25;border:1px solid var(--ln,#2b3024)!important}" +
    "#ipr-as .as-minhas{margin:0 0 12px;padding:8px 10px;border:1px solid var(--ln2,#3b4232);border-radius:9px;background:var(--p2,#1d2118)}" +
    "#ipr-as .as-minhas>.as-h{margin:0 0 6px}#ipr-as .as-minhas ul{margin:0;max-height:150px;overflow:auto}" +
    "#ipr-as .as-minhas p.nota{margin:0}" +
    "@media (max-width:600px){#ipr-as{width:auto}}";
  D.head.appendChild(st);
  var ROT = ["simulações deste mapa", "simulations for this map"];
  var ROT_NOVO = { pt: "As minhas simulações deste mapa", en: "My simulations for this map" };
  function arrumar(P) {
    var c = P.querySelector(".as-corpo");
    if (!c || c.querySelector(".as-minhas")) return;
    var hs = c.querySelectorAll(".as-h"), h = null;
    for (var i = 0; i < hs.length; i++) { if (ROT.indexOf((hs[i].textContent || "").trim().toLowerCase()) >= 0) { h = hs[i]; break; } }
    if (!h) return;
    var lista = h.nextElementSibling;
    var cx = D.createElement("div"); cx.className = "as-minhas";
    var en = (D.documentElement.lang || "").indexOf("en") === 0;
    var n = lista && lista.tagName === "UL" ? lista.children.length : 0;
    h.textContent = (en ? ROT_NOVO.en : ROT_NOVO.pt) + (n ? " (" + n + ")" : "");
    c.insertBefore(cx, c.firstChild);
    cx.appendChild(h);
    if (lista && (lista.tagName === "UL" || (lista.classList && lista.classList.contains("nota")))) cx.appendChild(lista);
  }
  function ligar(P) {
    arrumar(P);
    new MutationObserver(function () { arrumar(P); }).observe(P, { childList: true });
  }
  var P = D.getElementById("ipr-as");
  if (P) { ligar(P); return; }
  var ob = new MutationObserver(function () {
    var p = D.getElementById("ipr-as");
    if (p) { ob.disconnect(); ligar(p); }
  });
  ob.observe(D.body || D.documentElement, { childList: true, subtree: true });
})();
