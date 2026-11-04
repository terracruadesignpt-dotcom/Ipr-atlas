/* IPR Atlas · encomenda, passo 1 «Procure o terreno»: campo de pesquisa dentro do próprio painel (Nuno, 04/11/2026
   15h10). Antes, o painel dizia «Escreva o lugar…» e o campo mais à vista era «Filtrar camadas», que não procura lugares;
   a pesquisa certa estava no topo e demora 5 a 10 s sem dar sinal.
   Só acrescenta: copia o texto para a pesquisa do topo (a mesma de sempre), carrega Enter por ela e mostra «A procurar…»
   até o mapa se mexer. Desliga-se com ?passo1=0. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]passo1=0\b/.test(location.search)) return;
  var EN = function () { return (D.documentElement.lang || "").indexOf("en") === 0; };
  var T = {
    ph: function () { return EN() ? "Place, address, coordinates or NIC" : "Lugar, morada, coordenadas ou NIC"; },
    bt: function () { return EN() ? "Search" : "Procurar"; },
    pr: function () { return EN() ? "Searching… this can take a few seconds." : "A procurar… pode levar alguns segundos."; },
    ok: function () { return EN() ? "Found. Zoom in until you see the parcels, then press «I found the land»." : "Encontrado. Aproxime até ver as parcelas e carregue em «Já encontrei o terreno»."; },
    nd: function () { return EN() ? "Nothing yet. Choose a result in the list at the top, or try another name." : "Ainda nada. Escolha um resultado na lista do topo ou tente outro nome."; }
  };
  var st = D.createElement("style");
  st.textContent = ".ipr-p1{display:flex;gap:6px;margin:10px 0 4px}.ipr-p1 input{flex:1;min-width:0;padding:8px 10px;border-radius:6px;border:1px solid #c9d36a;background:#fff;color:#1d2118;font:14px Inter,system-ui,sans-serif}" +
    ".ipr-p1 button{padding:8px 12px;border:0;border-radius:6px;background:#c9d36a;color:#1d2118;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}.ipr-p1-e{font:12.5px/1.4 Inter,system-ui,sans-serif;opacity:.9;min-height:1em;margin:2px 0 6px}";
  D.head.appendChild(st);
  function topo() { return [].slice.call(D.querySelectorAll("input")).filter(function (i) { return /coordenadas ou NIC|coordinates or NIC/i.test(i.placeholder || "") || /^(Procurar|Search)$/i.test(i.getAttribute("aria-label") || i.placeholder || ""); })[0] || null; }
  function abrirTopo() { var b = [].slice.call(D.querySelectorAll("button")).filter(function (x) { return /Pesquisar locais|Search places/i.test(x.getAttribute("aria-label") || x.title || ""); })[0]; if (b) b.click(); }
  function mapa() { return W.IPR_MAPA || (W.IPR && W.IPR.map) || W.iprMapa || null; }
  function procurar(v, est, n) {
    if (!v) return;
    var t = topo();
    if (!t || !t.getClientRects().length) { if ((n || 0) < 1) { abrirTopo(); setTimeout(function () { procurar(v, est, 1); }, 400); return; } }
    if (!t) { est.textContent = T.nd(); return; }
    var set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(t, v); t.dispatchEvent(new Event("input", { bubbles: true })); t.focus();
    ["keydown", "keypress", "keyup"].forEach(function (k) { t.dispatchEvent(new KeyboardEvent(k, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true })); });
    est.textContent = T.pr();
    var m = mapa(), feito = false;
    if (m && m.once) m.once("moveend", function () { feito = true; est.textContent = T.ok(); });
    setTimeout(function () { if (!feito) est.textContent = T.nd(); }, 15000);
  }
  function ligar(painel) {
    if (painel.querySelector(".ipr-p1")) return;
    var alvo = [].slice.call(painel.querySelectorAll("p,div")).filter(function (e) { return /Escreva o lugar|Type the place/i.test(e.textContent || "") && e.children.length < 3; })[0];
    if (!alvo) return;
    var f = D.createElement("form"); f.className = "ipr-p1";
    var i = D.createElement("input"); i.type = "search"; i.placeholder = T.ph(); i.setAttribute("enterkeyhint", "search"); i.autocomplete = "off";
    var b = D.createElement("button"); b.type = "submit"; b.textContent = T.bt();
    var e = D.createElement("div"); e.className = "ipr-p1-e"; e.setAttribute("role", "status");
    f.appendChild(i); f.appendChild(b);
    f.addEventListener("submit", function (ev) { ev.preventDefault(); ev.stopPropagation(); procurar(i.value.trim(), e); });
    f.addEventListener("keydown", function (ev) { ev.stopPropagation(); });
    alvo.parentNode.insertBefore(e, alvo.nextSibling); alvo.parentNode.insertBefore(f, e);
    setTimeout(function () { try { i.focus(); } catch (x) {} }, 300);
  }
  function ver() {
    var g = D.getElementById("ipr-gu");
    if (g && g.getClientRects().length && /passo 1 de 6|step 1 of 6/i.test(g.textContent || "") && /Procure o terreno|Find the land/i.test(g.textContent || "")) ligar(g);
  }
  var pend = 0;
  new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = 0; ver(); }, 250); }).observe(D.body || D.documentElement, { childList: true, subtree: true });
  ver();
})();
