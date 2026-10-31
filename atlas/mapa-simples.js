/* IPR Atlas · botão «Mapa simples» (Nuno, 31/10/2026, 00h50: «um botão num sítio bem visível, se calhar lá em cima, ao lado
   do Comprar [...] voltar ao mapa simples. A ideia é que as pessoas possam descomplicar o mapa quando tem camadas e temas
   [...] o mapa que mostra a visão básica»).
   - Computador: na barra de cima, logo antes do «Comprar». Telemóvel e ecrãs estreitos (a barra não tem espaço): um botão
     pequeno no topo do mapa, ao centro; com o painel das camadas aberto, no topo do painel.
   - Carregar: desliga todas as camadas e temas do Atlas e as dos simuladores e add-ons, põe o ortofotomapa por fundo e
     mostra a visão básica, como um mapa de rua: localidades, estradas, nomes das ruas (zoom 13), sítios (zoom 15) e
     números de porta (zoom 17), do OpenStreetMap (OpenFreeMap).
   - Carregar outra vez («Repor camadas»): volta tudo ao que estava.
   - Enquanto o assistente de compra ou o cartão de preços estão abertos o botão esconde-se (eles já põem o mapa simples).
   Não mexe noutros ficheiros. Desligar: window.IPR_MAPA_SIMPLES_OFF = true, ou ?mapa_simples=0 no endereço. */
(function () {
  "use strict";
  if (window.__iprMapaSimples) return;
  try { if (window.IPR_MAPA_SIMPLES_OFF || /[?&]mapa_simples=0(?:&|$)/.test(location.search)) return; } catch (e) {}
  window.__iprMapaSimples = 1;

  function en() { return String(window.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en"; }
  function T() {
    return en()
      ? { on: "Simple map", onT: "Turn off every layer and theme and show the basic map: orthophoto, places, roads, street names and house numbers", off: "Restore layers", offT: "Bring back the layers and themes you had on" }
      : { on: "Mapa simples", onT: "Desligar todas as camadas e temas e ver o mapa básico: ortofoto, localidades, estradas, nomes das ruas e números de porta", off: "Repor camadas", offT: "Voltar a ligar as camadas e os temas que tinha" };
  }
  var MANTER = { f_ortosat: 1, f_sub: 1, o_nomes: 1, o_estradas: 1 };
  var OK = /^(iprv-f_ortosat|iprv-f_sub|iprv-o_nomes|iprv-o_estradas|iprv-bg|ipr-simples-|ipr-compra-|ipe-cad|ipe-loc|ipe-med|gl-draw)/;
  var ETQ = ["ipr-simples-ruas", "ipr-simples-poi", "ipr-simples-num"];
  var EST = null; // estado guardado enquanto o mapa simples está ligado

  function mapa() { return window.__ipe && window.__ipe.mapa; }
  function viz() { return window.__ipe && window.__ipe.viz; }
  function ocupado() { var R = document.getElementById("ipe"); return !!(R && (R.classList.contains("ipr-as-on") || R.classList.contains("ipr-cp-foco"))); }

  function etiquetas(on) {
    var m = mapa(); if (!m || !m.getStyle) return;
    try {
      if (!on) { ETQ.forEach(function (id) { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", "none"); }); return; }
      if (!m.getSource("iprv-omt")) m.addSource("iprv-omt", { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: "© OpenStreetMap · OpenFreeMap" });
      var F = ["Noto Sans Regular"], N = ["coalesce", ["get", "name:pt"], ["get", "name"]];
      var halo = { "text-color": "#ffffff", "text-halo-color": "rgba(10,14,8,.88)", "text-halo-width": 1.6 };
      [
        { id: ETQ[0], type: "symbol", source: "iprv-omt", "source-layer": "transportation_name", minzoom: 13,
          layout: { "symbol-placement": "line", "text-field": N, "text-font": F, "text-size": ["interpolate", ["linear"], ["zoom"], 13, 11, 17, 14], "text-max-angle": 30, "text-padding": 2 }, paint: halo },
        { id: ETQ[1], type: "symbol", source: "iprv-omt", "source-layer": "poi", minzoom: 15,
          layout: { "text-field": N, "text-font": F, "text-size": 11.5, "text-optional": true, "text-max-width": 9, "text-padding": 4 },
          paint: { "text-color": "#ffe9a8", "text-halo-color": "rgba(10,14,8,.88)", "text-halo-width": 1.5 } },
        { id: ETQ[2], type: "symbol", source: "iprv-omt", "source-layer": "housenumber", minzoom: 17,
          layout: { "text-field": ["get", "housenumber"], "text-font": F, "text-size": 11, "text-padding": 1 }, paint: halo }
      ].forEach(function (d) {
        if (m.getLayer(d.id)) { m.setLayoutProperty(d.id, "visibility", "visible"); try { m.moveLayer(d.id); } catch (e) {} }
        else m.addLayer(d);
      });
    } catch (e) {}
  }

  function ligar() {
    var V = viz(), m = mapa(); if (!m) return;
    EST = { viz: [], cam: [], ligadas: [], fundoLigado: 0 };
    try {
      if (V && V.activas) {
        V.activas().forEach(function (id) { if (!MANTER[id]) { EST.viz.push(id); try { V.ligar(id, false); } catch (e) {} } });
        if (V.activas().indexOf("f_ortosat") < 0 && V.fundo) { EST.fundoLigado = 1; try { V.fundo("f_ortosat"); } catch (e) {} }
        ["o_nomes", "o_estradas"].forEach(function (id) { if (V.activas().indexOf(id) < 0) { EST.ligadas.push(id); try { V.ligar(id, true); } catch (e) {} } });
      }
    } catch (e) {}
    try {
      (m.getStyle().layers || []).forEach(function (l) {
        if (OK.test(l.id) || l.type === "background") return;
        if (m.getLayoutProperty(l.id, "visibility") === "none") return;
        EST.cam.push(l.id); m.setLayoutProperty(l.id, "visibility", "none");
      });
    } catch (e) {}
    etiquetas(!ocupado());
    desenhar();
  }
  function repor() {
    var V = viz(), m = mapa(), X = EST; EST = null;
    etiquetas(false);
    if (!X || !m) return desenhar();
    try {
      X.cam.forEach(function (id) { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", "visible"); });
      if (V) {
        X.ligadas.forEach(function (id) { try { V.ligar(id, false); } catch (e) {} });
        var fundoAntes = X.viz.filter(function (id) { return /^f_/.test(id); })[0];
        if (fundoAntes && V.fundo) { try { V.fundo(fundoAntes); } catch (e) {} } else if (X.fundoLigado) { try { V.ligar("f_ortosat", false); } catch (e) {} }
        X.viz.forEach(function (id) { if (/^f_/.test(id) && id === fundoAntes) return; try { V.ligar(id, true); } catch (e) {} });
      }
    } catch (e) {}
    desenhar();
  }

  // ---------- botão ----------
  var ICONE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>';
  var CSS = "#ipr-ms-b{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;margin-right:8px;border-radius:999px;border:1px solid rgba(181,208,90,.55);background:rgba(181,208,90,.12);color:#e8f0d0;font:500 13px/1 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}" +
    "#ipr-ms-b:hover{background:rgba(181,208,90,.24)}#ipr-ms-b[aria-pressed=true]{background:#b5d05a;color:#141a0e;border-color:#b5d05a}" +
    "#ipr-ms-b.flut{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:5;margin:0;box-shadow:0 2px 10px rgba(0,0,0,.35);background:rgba(16,22,12,.9)}" +
    "#ipr-ms-b.flut[aria-pressed=true]{background:#b5d05a}" +
    "#ipr-ms-b.painel{display:flex;justify-content:center;width:calc(100% - 20px);margin:10px 10px 4px;height:36px}" +
    "#ipe.ipr-as-on #ipr-ms-b,#ipe.ipr-cp-foco #ipr-ms-b,html.ipr-ini-on #ipr-ms-b{display:none!important}" +
    "@media print{#ipr-ms-b{display:none!important}}";
  function botao() {
    var b = document.getElementById("ipr-ms-b");
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.id = "ipr-ms-b";
      b.addEventListener("click", function () { if (EST) repor(); else ligar(); });
    }
    return b;
  }
  function comprar(tr) {
    return [].slice.call(tr.querySelectorAll("button, a")).filter(function (x) { return /^\s*(Comprar|Buy)\s*$/.test(x.textContent || ""); })[0];
  }
  function desenhar() {
    var b = botao(), t = T(), on = !!EST;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.title = on ? t.offT : t.onT; b.setAttribute("aria-label", on ? t.off : t.on);
    b.innerHTML = ICONE + "<span>" + (on ? t.off : t.on) + "</span>";
  }
  function colocar() {
    var R = document.getElementById("ipe"); if (!R) return;
    var tr = R.querySelector(".ipe-top .ipe-tr"), b = botao(), estreito = window.innerWidth < 900;
    var mapaEl = R.querySelector(".ipe-mapa") || (document.getElementById("ipe-mapa") || {}).parentElement;
    if (!estreito && tr) {
      var c = comprar(tr);
      if (c && c.parentElement) { if (b.nextSibling !== c || b.parentElement !== c.parentElement) c.parentElement.insertBefore(b, c); }
      else if (b.parentElement !== tr) tr.insertBefore(b, tr.firstChild);
      b.classList.remove("flut");
    } else {
      // ecrã estreito: com o painel das camadas aberto, o botão vai para o topo do painel; fechado, fica por cima do mapa
      var esq = document.getElementById("ipe-esq"), r = esq && esq.getBoundingClientRect();
      if (esq && r && r.right > 60 && r.width > 0) {
        if (b.parentElement !== esq || esq.firstElementChild !== b) esq.insertBefore(b, esq.firstChild);
        b.classList.remove("flut"); b.classList.add("painel");
      } else if (mapaEl) {
        if (b.parentElement !== mapaEl) mapaEl.appendChild(b);
        b.classList.remove("painel"); b.classList.add("flut");
      }
    }
    if (!estreito) b.classList.remove("painel");
    if (!b.firstChild) desenhar();
  }
  function iniciar() {
    if (!document.getElementById("ipr-ms-css")) { var s = document.createElement("style"); s.id = "ipr-ms-css"; s.textContent = CSS; document.head.appendChild(s); }
    colocar();
    var R = document.getElementById("ipe");
    // a barra de cima é refeita por outros ficheiros (língua, sessão, Comprar); volta-se a pôr o botão no sítio
    var t = 0;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { colocar(); if (EST) etiquetas(!ocupado()); }, 120); }).observe(R, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(colocar, 150); });
    // o painel das camadas abre e fecha a deslizar; nos ecrãs estreitos confirma-se o sítio do botão de segundo a segundo
    setInterval(function () { if (window.innerWidth < 900) colocar(); }, 1000);
    var m = mapa(); if (m && m.on) m.on("styledata", function () { if (EST && !ocupado()) etiquetas(true); });
  }
  (function esperar(n) {
    if (window.__ipe && window.__ipe.mapa && document.getElementById("ipe")) return iniciar();
    if (n > 240) return;
    setTimeout(function () { esperar(n + 1); }, 500);
  })(0);
})();
