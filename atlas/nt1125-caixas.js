/* IPR Atlas · Caixas que saem sozinhas, no telemóvel (25/11/2026, 19h25). Terracrua Design.
   Nuno (19h21, três fotografias do telemóvel): «Na versão mobile não era para ter tanta box em cima. E as caixas, quando se
   carrega no que está por trás da caixa, a caixa devia sair. Quando se carrega 2 vezes na caixa, a caixa devia sair.»
   No telemóvel e tablet (até 900 px):
   1. Tocar fora de uma caixa aberta fecha-a: o painel das camadas (#ipe-esq) e qualquer caixa com botão de fechar
      («×», «Fechar», «Agora não»...), como o aviso «Há projectos com estado novo». Os painéis de ferramentas (Desenhar,
      Medir, faixa das ferramentas) não fecham quando se toca no mapa, porque é no mapa que se desenha.
   2. Dois toques seguidos dentro da caixa (fora de botões, ligações e campos) fecham-na.
   3. Menos caixas por cima do mapa: o botão «Bacia do Mira» sai do mapa no telemóvel (continua no computador) e o
      «Do terreno» só aparece quando há alguma coisa (número maior que 0).
   Nada é apagado: fechar é carregar no botão de fechar da própria caixa, ou esconder o painel como o botão das camadas faz.
   Desligar: ?caixas=0 ou localStorage ipr_caixas=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]caixas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_caixas") === "0") return; } catch (e) {}
  if (W.__iprCaixas) return; W.__iprCaixas = 1;

  function movel() { return W.innerWidth <= 900; }
  var FECHAR = /^(×|✕|✖|x|fechar|close|cerrar|agora não|agora nao|not now|ahora no|dispensar|ok, fechar)$/i;
  var FERRAMENTAS = "#ipe-dir,#ipr-dp,#ipr-trb,#ipr-modos-acc,#ipr-modos,.ipe-tools,.maplibregl-ctrl,#tb-bar,[data-ipr-fica]";
  var INTERACTIVO = "button,a,input,select,textarea,label,summary,[role=button],[contenteditable=true],.maplibregl-canvas";

  function visivel(e) { if (!e || !e.isConnected) return false; var r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; var s = getComputedStyle(e); return s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0.05; }
  function rotulo(b) { return String(b.getAttribute("aria-label") || b.getAttribute("title") || b.textContent || "").replace(/\s+/g, " ").trim(); }
  function posicionado(e) { var s = getComputedStyle(e); return s.position === "fixed" || s.position === "absolute" || s.position === "sticky"; }

  // caixas abertas com botão de fechar: [caixa, botão]
  function caixas() {
    var out = [], vistos = [];
    D.querySelectorAll("button,[role=button],a[href='#'],a:not([href])").forEach(function (b) {
      if (!FECHAR.test(rotulo(b)) || !visivel(b)) return;
      var c = b.parentElement, n = 0;
      while (c && c !== D.body && n < 8) { if (posicionado(c) && c.offsetWidth < W.innerWidth * 0.99 + 1 || c.getAttribute("role") === "dialog" || c.getAttribute("role") === "alertdialog") break; c = c.parentElement; n++; }
      if (!c || c === D.body || vistos.indexOf(c) >= 0) return;
      if (c.matches && c.matches(FERRAMENTAS)) return; // painéis de ferramentas ficam
      if (c.closest && c.closest("#ipe-esq")) return;   // o painel das camadas trata-se à parte
      var r = c.getBoundingClientRect(); if (r.width >= W.innerWidth - 2 && r.height >= W.innerHeight - 2) return; // ecrã inteiro: não é caixa
      vistos.push(c); out.push([c, b]);
    });
    return out;
  }
  function esq() { var M = D.getElementById("ipe"); return M && M.classList.contains("esq-aberto") ? D.getElementById("ipe-esq") : null; }
  function fecharEsq() {
    var M = D.getElementById("ipe"); if (!M) return;
    M.classList.remove("esq-aberto");
    var t = M.querySelector('[data-tool="lado"]'); if (t) t.setAttribute("aria-pressed", "false");
    try { var m = W.__ipe && W.__ipe.mapa; if (m) setTimeout(function () { m.resize(); }, 80); } catch (e) {}
  }
  function noMapa(t) { return !!(t && t.closest && t.closest(".maplibregl-canvas,.maplibregl-canvas-container")); }

  // 1. toque fora
  D.addEventListener("click", function (ev) {
    if (!movel()) return;
    var t = ev.target, antes = caixas(), painel = esq();
    setTimeout(function () {
      if (painel && esq() === painel && !painel.contains(t) && !(t.closest && t.closest('[data-tool="lado"],.ipe-tools'))) fecharEsq();
      antes.forEach(function (x) {
        var c = x[0], b = x[1];
        if (!visivel(c) || c.contains(t)) return;
        if (noMapa(t) && !/agora n|not now|ahora no/i.test(rotulo(b)) && c.getAttribute("role") !== "dialog" && c.getAttribute("role") !== "alertdialog") return;
        try { b.click(); } catch (e) {}
        if (visivel(c) && x[2] !== 1) { c.style.setProperty("display", "none", "important"); c.setAttribute("data-ipr-fechada", "1"); }
      });
    }, 0);
  }, true);

  // 2. dois toques dentro da caixa
  var ult = { t: 0, c: null };
  D.addEventListener("pointerup", function (ev) {
    if (!movel() || (ev.pointerType && ev.pointerType === "mouse")) return;
    var t = ev.target; if (t.closest && t.closest(INTERACTIVO)) { ult.c = null; return; }
    var lista = caixas(), alvo = null, botao = null;
    lista.forEach(function (x) { if (x[0].contains(t) && (!alvo || alvo.contains(x[0]))) { alvo = x[0]; botao = x[1]; } });
    var p = esq(); if (!alvo && p && p.contains(t)) alvo = p;
    if (!alvo) { ult.c = null; return; }
    var agora = Date.now();
    if (ult.c === alvo && agora - ult.t < 380) {
      ult.c = null; ev.preventDefault();
      if (alvo === p) fecharEsq(); else if (botao) { botao.click(); if (visivel(alvo)) alvo.style.setProperty("display", "none", "important"); }
      return;
    }
    ult.t = agora; ult.c = alvo;
  }, true);

  // 3. menos caixas por cima do mapa
  var CSS = "@media (max-width:900px){.maplibregl-ctrl:has(>#ipr-mira-btn){display:none!important}}" +
    ".maplibregl-ctrl:has(>#iptq-btn.ipr-vazio){display:none!important}";
  function arrumar() {
    if (!D.getElementById("ipr-caixas-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-caixas-css"; s.textContent = CSS; D.head.appendChild(s); }
    var q = D.getElementById("iptq-btn");
    if (q) { var b = q.querySelector("b"), n = b ? parseInt(b.textContent, 10) : NaN; q.classList.toggle("ipr-vazio", n === 0); }
  }
  (function vez(n) { arrumar(); if (n < 60) setTimeout(function () { vez(n + 1); }, 1000); })(0);
  setInterval(arrumar, 5000);
})();
