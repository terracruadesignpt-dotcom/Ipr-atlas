/* IPR Atlas · textos e pequenos arranjos do sistema de design do Pedro Bolito (regenerativo.pt/interface/). Acompanha o
   ipr-interface.css. Pedido do Nuno, 04/11/2026, 23h34: aplicar todas as directrizes da página, também ao que já estava feito.
   Só aspecto e textos visíveis; não muda identificadores, preços, encomendas nem o que cada botão faz.
   1. Títulos de secção do painel da direita no formato «01 · TERRENO» (Plex Mono 11 px verde, no CSS).
   2. Comprar passo a passo: título «Olá! O que precisa para o seu terreno?», a frase «Responda a umas perguntas rápidas.
      Não precisa de saber usar o mapa.», etiqueta «Sem conta» nos três produtos (Base, Leitura e Planta; a Planta compra-se
      sem conta desde 30/10, m90590) e, em «Não sei bem o que preciso», a linha «Ajudamos a escolher em 10 segundos.».
   2b. Textos antigos que diziam que a Planta só se faz a partir de um terreno guardado num projecto (ajustes.js: s4h_planta,
      plantaSem, p_urb; arrumar.js: plantaSem) passam a dizer o fluxo actual: pede-se em Comprar, sem conta, desenhando ou
      indicando o terreno. Troca só o texto quando aparece na página; não mexe nesses ficheiros nem no que os botões fazem.
   3. Temas com os nomes do Pedro: «Incêndio», «Trabalho de campo», «Agricultura biológica» (só o rótulo).
   4. Legenda mínima: MDT na horizontal, com a rampa de baixo a alto em linha.
   5. Projectos: o estado «Entregue» passa a «● Entregue», em etiqueta.
   Desligar: ?neutro=0 (o mesmo interruptor do ipr-neutro). Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  try {
    if (/[?&]neutro=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_neutro_off") === "1") return;
  } catch (e) {}
  if (W.__iprInterface) return; W.__iprInterface = 1;
  function en() { return (W.IPR_LINGUA || H.lang || "pt").indexOf("en") === 0; }
  function T(a, b) { return en() ? b : a; }

  // 1. títulos de secção «01 · TERRENO»
  function seccoes() {
    [].forEach.call(D.querySelectorAll("#ipe .ipe-dir h3.ipe-h"), function (h) {
      var b = h.firstElementChild;
      if (!b || b.tagName !== "B" || !/^\d{2}$/.test(b.textContent.trim())) return;
      if (!h.classList.contains("n6-sec")) h.classList.add("n6-sec");
      var n = b.nextSibling;
      if (n && n.nodeType === 3 && !/^\s*·/.test(n.nodeValue)) n.nodeValue = " · " + n.nodeValue.replace(/^\s+/, "");
    });
  }

  // 2. Comprar passo a passo
  var TIT = ["O que quer comprar?", "What would you like to buy?"];
  function comprar() {
    var pn = D.getElementById("ipr-cp-pn"); if (!pn) return;
    var h = pn.querySelector(":scope>h2");
    if (h) {
      var alvo = T("Olá! O que precisa para o seu terreno?", "Hello! What does your land need?");
      var pd = D.getElementById("ipr-cp-pd"), noPasso1 = !(pd && !pd.hidden);
      if (noPasso1 && h.textContent !== alvo && (TIT.indexOf(h.textContent.trim()) >= 0 || h.dataset.n6)) { h.dataset.n6 = h.textContent; h.textContent = alvo; }
      var s = pn.querySelector(":scope>.n6-sub");
      if (!s) { s = D.createElement("p"); s.className = "n6-sub"; h.parentNode.insertBefore(s, h.nextSibling); }
      var st = T("Responda a umas perguntas rápidas. Não precisa de saber usar o mapa.", "Answer a few quick questions. You don't need to know how to use the map.");
      if (s.textContent !== st) s.textContent = st;
      s.hidden = !noPasso1;
      if (!noPasso1 && h.dataset.n6 && h.textContent === alvo) h.textContent = h.dataset.n6;
    }
    var pl = pn.querySelector('.ipr-cp-i[data-cp="p-planta"]');
    if (pl && !pl.querySelector(".n5-et")) {
      var sp = pl.querySelector(":scope>span:not(.ipr-cp-p)");
      if (sp) { var et = D.createElement("span"); et.className = "n5-et"; et.style.display = "table"; sp.appendChild(et); }
    }
    [].forEach.call(pn.querySelectorAll(".n5-et"), function (e) { var t = T("Sem conta", "No account"); if (e.textContent !== t) e.textContent = t; });
    var a = pn.querySelector(".n5-mais a");
    if (a && !a.querySelector("small")) { var sm = D.createElement("small"); sm.textContent = T("Ajudamos a escolher em 10 segundos.", "We help you choose in 10 seconds."); a.appendChild(sm); }
  }

  // 3. nomes dos temas
  var TEMAS = { fogo: ["Incêndio", "Wildfire"], campo: ["Trabalho de campo", "Fieldwork"], bio: ["Agricultura biológica", "Organic farming"] };
  function temas() {
    Object.keys(TEMAS).forEach(function (k) {
      var n = D.querySelector('#ipr-t62 button[data-t62="' + k + '"] .n'); if (!n) return;
      var t = T(TEMAS[k][0], TEMAS[k][1]); if (n.textContent !== t) n.textContent = t;
    });
  }

  // 4. legenda: MDT na horizontal
  function legenda() {
    [].forEach.call(D.querySelectorAll("#ipr-lgd.n5-min .c .one.rampa"), function (o) {
      var rh = o.querySelector(":scope>.n6-rh");
      var k = en() ? "en" : "pt";
      if (rh && rh.dataset.l === k) return;
      if (rh) rh.remove();
      rh = D.createElement("span"); rh.className = "n6-rh"; rh.dataset.l = k;
      var b = D.createElement("b"); b.textContent = T("MDT", "DTM");
      var s = D.createElement("s");
      var e = D.createElement("span"), i1 = D.createElement("i"), i2 = D.createElement("i");
      i1.textContent = T("baixo", "low"); i2.textContent = T("alto", "high"); i1.style.fontStyle = i2.style.fontStyle = "normal";
      e.appendChild(i1); e.appendChild(i2);
      rh.appendChild(b); rh.appendChild(s); rh.appendChild(e);
      o.appendChild(rh);
    });
  }

  // 5. «● Entregue»
  function entregue() {
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-card *, #ipe .ipr-ca *"), function (x) {
      if (x.children.length || x.classList.contains("n6-entregue")) return;
      var t = (x.textContent || "").trim();
      if (t === "Entregue" || t === "Delivered") { x.classList.add("n6-entregue"); x.textContent = "● " + t; }
    });
  }

  // 2b. textos antigos da Planta
  var PLANTA = [
    ["Abra o separador Projectos, escolha o projecto e carregue em «Planta de localização». Se ainda não tem projecto, guarde primeiro o terreno.",
     "Peça a Planta em Comprar, sem conta: desenhe ou indique o terreno. Se o terreno já está num projecto, também pode carregar em «Planta de localização» no separador Projectos."],
    ["A Planta de Localização faz-se a partir de um terreno guardado num projecto (separador Projectos).",
     "A Planta de Localização pede-se em Comprar, sem conta: desenhe ou indique o terreno."],
    ["A Planta de Localização faz-se a partir de um terreno guardado num projecto.",
     "A Planta de Localização pede-se em Comprar, sem conta: desenhe ou indique o terreno."],
    ["Faz-se a partir de um terreno guardado num projecto.",
     "Pede-se em Comprar, sem conta: desenhe ou indique o terreno."],
    ["Open the Projects tab, choose the project and press «Location plan». If you have no project yet, save the plot first.",
     "Order the plan in Buy, no account needed: draw or indicate the plot. If the plot is already in a project, you can also press «Location plan» in the Projects tab."],
    ["The Location Plan is made from a plot saved in a project (Projects tab).",
     "The Location Plan is ordered in Buy, no account needed: draw or indicate the plot."],
    ["The Location Plan is made from a plot saved in a project.",
     "The Location Plan is ordered in Buy, no account needed: draw or indicate the plot."]
  ];
  function textoPlanta(n) {
    if (!n || n.nodeType !== 3) return;
    var v = n.nodeValue; if (!v || v.indexOf("guard") < 0 && v.indexOf("saved") < 0 && v.indexOf("save the plot") < 0) return;
    var w = v; PLANTA.forEach(function (p) { if (w.indexOf(p[0]) >= 0) w = w.split(p[0]).join(p[1]); });
    if (w !== v) n.nodeValue = w;
  }
  function varrer(r) {
    if (!r) return;
    if (r.nodeType === 3) { textoPlanta(r); return; }
    if (r.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(r.tagName)) return;
    var tw = D.createTreeWalker(r, NodeFilter.SHOW_TEXT, null), x;
    while ((x = tw.nextNode())) textoPlanta(x);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === "characterData") textoPlanta(m.target);
      else [].forEach.call(m.addedNodes, varrer);
    });
  }).observe(H, { childList: true, subtree: true, characterData: true });
  if (D.body) varrer(D.body); else D.addEventListener("DOMContentLoaded", function () { varrer(D.body); });

  function tudo() {
    try { seccoes(); } catch (e) {}
    try { comprar(); } catch (e) {}
    try { temas(); } catch (e) {}
    try { legenda(); } catch (e) {}
    try { entregue(); } catch (e) {}
  }
  var t = 0, ocupado = false;
  function agenda() { if (ocupado || t) return; t = setTimeout(function () { t = 0; ocupado = true; try { tudo(); } finally { setTimeout(function () { ocupado = false; }, 0); } }, 250); }
  function arranca() {
    tudo();
    new MutationObserver(agenda).observe(H, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "aria-selected"] });
    D.addEventListener("ipr:lingua", function () {
      [].forEach.call(D.querySelectorAll(".n6-rh,.ipr-cp-pn .n5-mais a small"), function (x) { x.remove(); });
      agenda();
    });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arranca); else arranca();
})();
