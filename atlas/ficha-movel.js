/* IPR Atlas · ficha da propriedade no telemóvel (Nuno, 5/11/2026: «todos», das quatro melhorias da entrada e da compra).
   No telemóvel o painel já sobe do fundo do ecrã por cima do mapa. Faltavam duas coisas:
   1. Com o painel aberto, os botões do mapa (zoom, bússola, localização, ecrã inteiro) ficavam por cima da ficha e
      tapavam o texto. Passam para baixo do painel enquanto ele está aberto; com o painel fechado ficam como estavam.
   2. A compra ficava lá em baixo, depois de toda a ficha. Com uma ficha aberta aparece uma barra fixa no fundo do painel
      com os três produtos e o preço de cada um (Planta, Leitura, Base). Cada botão carrega no botão de compra da própria
      ficha (ficha-gratuita.js), por isso o caminho de compra e os preços são exactamente os mesmos.
   Só no ecrã até 640 px. Desligar: ?fmovel=0 ou localStorage ipr_fmovel_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]fmovel=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_fmovel_off") === "1") return; } catch (e) {}
  if (D.getElementById("ipr-fm-css")) return;
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var CSS = "@media (max-width:640px){" +
    "#ipe:has(#ipe-dir.aberto) .maplibregl-control-container>div{z-index:8!important}" +
    ".ipr-fm{position:sticky;bottom:0;z-index:5;display:flex;gap:6px;margin:10px -12px 0;padding:8px 64px 10px 12px;" +
    "background:var(--bg,#141a10);border-top:1px solid rgba(255,255,255,.12);box-shadow:0 -6px 16px rgba(0,0,0,.25)}" +
    ".ipr-fm button{flex:1 1 0;min-width:0;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:7px 4px;background:transparent;color:var(--tx,#eef0e8);" +
    "font:600 12px/1.2 Inter,system-ui,sans-serif;cursor:pointer}.ipr-fm button small{display:block;font-weight:500;font-size:11px;opacity:.8;margin-top:2px}" +
    ".ipr-fm button.ac{background:var(--ac,#8bc34a);border-color:transparent;color:#10160c}" +
    "}@media (min-width:641px){.ipr-fm{display:none!important}}";
  var NOMES = { planta: t("Planta", "Site plan"), leitura: t("Leitura", "Reading"), base: t("Base", "Base") };
  function barra() {
    if (W.innerWidth > 640) return;
    var out = D.querySelector("#ipe-res .ipr-fg-out") || D.querySelector(".ipr-ficha-out .ipr-fg-out") || D.querySelector(".ipr-fg-out");
    var bts = out ? out.querySelectorAll("[data-fg-compra]") : [];
    var b = D.getElementById("ipr-fm");
    if (!bts.length) { if (b) b.remove(); return; }
    var chave = [].map.call(bts, function (x) { var r = x.closest("div,li,p"); return x.dataset.fgCompra + ":" + (r ? (r.innerText.match(/(\d[\d .]*)\s*€/) || [])[1] : ""); }).join("|");
    if (b && b.dataset.k === chave && b.parentNode) return;
    if (!b) { b = D.createElement("div"); b.id = "ipr-fm"; b.className = "ipr-fm"; b.setAttribute("role", "group"); b.setAttribute("aria-label", t("Comprar para este terreno", "Buy for this plot")); }
    b.dataset.k = chave; b.innerHTML = "";
    [].forEach.call(bts, function (x, i) {
      var k = x.dataset.fgCompra, r = x.closest("div,li,p"), pr = r ? (r.innerText.match(/(\d[\d .]*)\s*€/) || [])[1] : "";
      var bt = D.createElement("button"); bt.type = "button"; if (k === "base") bt.className = "ac";
      bt.innerHTML = (NOMES[k] || x.textContent) + (pr ? "<small>" + pr.trim() + " €</small>" : "");
      bt.addEventListener("click", function (e) { e.preventDefault(); x.click(); });
      b.appendChild(bt);
    });
    // fica no fim da ficha, dentro do mesmo contentor que rola, para se colar ao fundo do painel
    var sec = out.closest("#ipe-res") || out.parentNode;
    if (b.parentNode !== sec) sec.appendChild(b);
  }
  var st = D.createElement("style"); st.id = "ipr-fm-css"; st.textContent = CSS; D.head.appendChild(st);
  var tm = null;
  function logo() { if (!tm) tm = setTimeout(function () { tm = null; barra(); }, 300); }
  new MutationObserver(logo).observe(D.documentElement, { childList: true, subtree: true });
  W.addEventListener("resize", logo);
})();
