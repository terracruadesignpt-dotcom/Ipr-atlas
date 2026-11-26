/* IPR Atlas · linhas de água sobre a via pública (26/11/2026).
   Base #20571 (Espinho): as linhas de água calculadas seguiam as ruas a direito. O Nuno escolheu «Marcar como via»: a partir
   do worker 1.0.129 os troços sobre ruas vêm com VIA = 1 (NOTA «escoamento pela via pública»). Aqui, em todas as camadas
   de linhas de água das Bases (catálogo l_streams, Base aberta no estúdio, Bases extra da lista), esses troços saem da
   camada original e desenham-se por cima a cinzento, a tracejado. As Bases antigas não têm VIA: nada muda.
   Corre no máximo de 500 em 500 ms (o Atlas mexe no estilo sem parar). Desligar: ?aguavias=0. Terracrua Design. */
(function () {
  "use strict";
  var W = window;
  try { if (/[?&]aguavias=0(&|$)/.test(location.search)) return; } catch (e) {}
  if (W.__iprAguaVias1126) return;
  W.__iprAguaVias1126 = 1;
  var ALVO = /^(ipe-am-streams-l|ipb-\d+-agua|iprv-l_streams.*)$/;
  var SEM_VIA = ["!=", ["to-number", ["coalesce", ["get", "VIA"], 0]], 1];
  var COM_VIA = ["==", ["to-number", ["coalesce", ["get", "VIA"], 0]], 1];
  var feitos = {};
  function mapa() { return W.IPR_MAPA || (W.__ipe && W.__ipe.mapa); }
  function correr() {
    var m = mapa(); if (!m || !m.getStyle) return;
    var st; try { st = m.getStyle(); } catch (e) { return; }
    var L = (st && st.layers) || [];
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      if (l.type !== "line" || !ALVO.test(l.id) || /-via$/.test(l.id)) continue;
      var vid = l.id + "-via";
      if (feitos[l.id] && m.getLayer(vid)) continue;
      try {
        var f = l.filter;
        var ja = JSON.stringify(f || null).indexOf('"VIA"') >= 0;
        if (!ja) m.setFilter(l.id, f ? ["all", f, SEM_VIA] : SEM_VIA);
        if (!m.getLayer(vid)) {
          var w = (l.paint && l.paint["line-width"]) || 1.4;
          if (typeof w !== "number") w = ["interpolate", ["linear"], ["zoom"], 11, 0.9, 17, 2.4];
          var def = { id: vid, type: "line", source: l.source, filter: f ? ["all", f, COM_VIA] : COM_VIA,
            layout: { "line-cap": "butt", "line-join": "round", visibility: (l.layout && l.layout.visibility) || "visible" },
            paint: { "line-color": "#55606b", "line-width": w, "line-dasharray": [2, 1.6], "line-opacity": 0.95 } };
          if (l["source-layer"]) def["source-layer"] = l["source-layer"];
          if (l.minzoom != null) def.minzoom = l.minzoom;
          if (l.maxzoom != null) def.maxzoom = l.maxzoom;
          var prox = L[i + 1] ? L[i + 1].id : undefined;
          m.addLayer(def, prox && m.getLayer(prox) ? prox : undefined);
        }
        feitos[l.id] = 1;
      } catch (e) {}
    }
    // a cópia acompanha a visibilidade da original e sai com ela
    for (var k in feitos) {
      if (!m.getLayer(k + "-via")) continue;
      try {
        if (!m.getLayer(k)) { m.removeLayer(k + "-via"); delete feitos[k]; continue; }
        var v = m.getLayoutProperty(k, "visibility") || "visible";
        if ((m.getLayoutProperty(k + "-via", "visibility") || "visible") !== v) m.setLayoutProperty(k + "-via", "visibility", v);
      } catch (e) {}
    }
  }
  var ult = 0, pend = null;
  function pedir() {
    var agora = Date.now();
    if (agora - ult >= 500) { ult = agora; correr(); return; }
    if (!pend) pend = setTimeout(function () { pend = null; ult = Date.now(); correr(); }, 500 - (agora - ult));
  }
  var ligado = false;
  function ligar() {
    var m = mapa();
    if (m && m.on && !ligado) { ligado = true; m.on("styledata", pedir); m.on("sourcedata", pedir); }
    pedir();
  }
  setInterval(ligar, 2000);
  ligar();
})();
