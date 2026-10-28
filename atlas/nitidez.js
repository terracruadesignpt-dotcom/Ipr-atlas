/* IPR Atlas · Limite de aproximação à resolução dos dados (Nuno, 28/10/2026, 14h22: «não está apresentável, não posso vender
   isto com estes pixels», sobre a Base da Bacia do Vale da Vinha vista no máximo de aproximação).
   O mapa deixava aproximar até ao nível 22 (cerca de 3 cm por píxel de ecrã), quando os dados mais finos têm 25 a 50 cm
   (ortofotos da DGT e rasters da Base: acumulação de fluxo, TWI, declives) e o LiDAR 50 cm. A esse nível cada célula de
   50 cm ocupa 15 a 20 píxeis e tudo parece desfocado ou em quadrados. Aqui o máximo passa a 19,5 (cerca de 30 cm por píxel
   em Portugal), o nível em que ortofoto e rasters ainda se vêem nítidos. Os vectores (curvas, linhas de água, limites)
   continuam nítidos a qualquer escala. Desligar: window.IPR_NITIDEZ_OFF = true, ou ?zmax=22 no endereço. */
(function () {
  "use strict";
  if (window.IPR_NITIDEZ_OFF || window.__iprNitidez) return;
  window.__iprNitidez = 1;
  var q = new URLSearchParams(location.search), Z = parseFloat(q.get("zmax")) || 19.5;
  function aplicar(m) {
    try {
      if (m.getMaxZoom() > Z) m.setMaxZoom(Z);
      (m.getStyle().layers || []).forEach(function (l) { if (l.type === "raster" && m.getPaintProperty(l.id, "raster-resampling") !== "linear") m.setPaintProperty(l.id, "raster-resampling", "linear"); });
    } catch (e) {}
  }
  var visto = null;
  (function vez(n) {
    var m = window.__ipe && window.__ipe.mapa;
    if (m && m !== visto) { visto = m; aplicar(m); m.on("styledata", function () { aplicar(m); }); }
    if (n < 2400) setTimeout(function () { vez(n + 1); }, m ? 1500 : 250); // o Atlas recria o mapa ao mudar de modo
  })(0);
})();
