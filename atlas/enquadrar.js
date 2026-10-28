/* IPR Atlas · Abrir uma Base enquadrada no terreno (Nuno, 28/10/2026, 16h29: «quando carrega bem no mapa, eu quero que
   faça um zoom à parcela, à base cartográfica, senão o que é que isto serve?»).
   Ao abrir /atlas/?mapa=N (ligação do e-mail de revisão, da área de cliente ou de uma partilha), o mapa criava-se já
   enquadrado no terreno, mas a abertura animada (voo desde a Península, obrigatória até 31/10/2026) passava por cima e
   deixava a vista longe da Base; um clique no mapa durante o voo também saltava para o fim do voo e não para o terreno.
   Aqui, quando há ?mapa= e a Base está carregada: salta-se a abertura (botão «Saltar» do próprio Atlas, que liga também
   as camadas da Base) e enquadra-se o limite do terreno. Volta a enquadrar uma vez se, nos primeiros segundos e sem a
   pessoa mexer no mapa, a vista tiver ido para fora do terreno. Não toca em nada depois de a pessoa mexer no mapa.
   Desligar: window.IPR_ENQUADRAR_OFF = true, ou ?enquadrar=0 no endereço. */
(function () {
  "use strict";
  if (window.IPR_ENQUADRAR_OFF || window.__iprEnquadrar) return;
  window.__iprEnquadrar = 1;
  var q = new URLSearchParams(location.search), alvo = q.get("mapa");
  if (!alvo || q.get("enquadrar") === "0" || /[?&](c|ll|cam)=/.test(location.search)) return;

  function caixa(gj) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    function per(c) {
      if (!c || !c.length) return;
      if (typeof c[0] === "number") {
        if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1];
        if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1];
      } else c.forEach(per);
    }
    try {
      if (typeof gj === "string") gj = JSON.parse(gj);
      var fs = gj && gj.type === "FeatureCollection" ? gj.features : [gj];
      (fs || []).forEach(function (f) { per(f && (f.geometry ? f.geometry.coordinates : f.coordinates)); });
    } catch (e) { return null; }
    return b[0] <= b[2] && isFinite(b[0]) ? b : null;
  }

  var mexeu = false, feito = 0, inicio = Date.now(), mapaVisto = null;
  function marcar() { mexeu = true; }
  function vigiar(M) {
    if (mapaVisto === M) return;
    mapaVisto = M;
    try {
      var c = M.getCanvasContainer ? M.getCanvasContainer() : M.getCanvas();
      ["mousedown", "touchstart", "wheel", "keydown"].forEach(function (v) { c.addEventListener(v, marcar, { passive: true }); });
    } catch (e) {}
  }
  function enquadrar(M, b, dur) {
    try {
      M.stop();
      if (b[2] - b[0] < 1e-6 && b[3] - b[1] < 1e-6) M.jumpTo({ center: [b[0], b[1]], zoom: 16.5, pitch: 0, bearing: 0 });
      else M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: window.innerWidth < 700 ? 30 : 70, maxZoom: 17.5, pitch: 0, bearing: 0, duration: dur });
    } catch (e) {}
  }
  function dentro(M, b) {
    try {
      var c = M.getCenter(), z = M.getZoom(), mx = (b[2] - b[0]) * 1.5 + 0.002, my = (b[3] - b[1]) * 1.5 + 0.002;
      return z >= 12 && c.lng > b[0] - mx && c.lng < b[2] + mx && c.lat > b[1] - my && c.lat < b[3] + my;
    } catch (e) { return true; }
  }

  (function ciclo() {
    if (Date.now() - inicio > 45000) return;
    var I = window.__ipe, M = I && I.mapa, A = I && I.estado && I.estado.actual;
    if (!M || !A || String(A.id) !== String(alvo) || !A.geojson || !M.loaded || !M.isStyleLoaded()) { setTimeout(ciclo, 300); return; }
    vigiar(M);
    var b = caixa(A.geojson);
    if (!b) return;
    if (!feito) {
      var s = document.querySelector('.ipe-ab-saltar [data-ab="s"]');
      if (s) { try { s.click(); } catch (e) {} }
      feito = 1;
      setTimeout(function () { enquadrar(M, b, 700); }, 60);
      setTimeout(ciclo, 1500);
      return;
    }
    // segunda passagem: só se ninguém mexeu e a vista fugiu do terreno (a abertura ou outro módulo moveu o mapa)
    if (feito === 1) {
      feito = 2;
      if (!mexeu && !dentro(M, b)) enquadrar(M, b, 500);
      if (Date.now() - inicio < 9000) { feito = 1; setTimeout(ciclo, 1500); }
    }
  })();
})();
