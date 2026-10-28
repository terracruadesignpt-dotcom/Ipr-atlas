/* IPR Atlas · Limite de aproximação à resolução dos dados e camadas do worker 1.0.38 (Nuno, 28/10/2026, 14h22: «não está
   apresentável, não posso vender isto com estes pixels»; 15h25: «Publica e reprocessa»).
   1. O mapa deixava aproximar até ao nível 22 (cerca de 3 cm por píxel), quando os dados mais finos têm 25 a 50 cm. O
      máximo passa a 19,5, onde ortofoto e rasters ainda se vêem nítidos. Os vectores continuam nítidos a qualquer escala.
   2. Rasters contínuos com reamostragem linear; exposição, formas do relevo e vento (classes) sem mistura de cores
      (nearest), para não se inventarem cores entre classes quando se aproxima para lá do último nível.
   3. «Linhas de escorrência» (escorrencia.geojson, worker 1.0.38): acumulação de fluxo em linhas, desenhadas pela classe
      de área contributiva (1 < 0,5 ha · 2 até 2 ha · 3 até 10 ha · 4 ≥ 10 ha), mais grossas e escuras onde corre mais água;
      abaixo do nível 15 só as classes 3 e 4. As Bases antigas não têm o ficheiro e a camada fica simplesmente vazia.
   Desligar: window.IPR_NITIDEZ_OFF = true, ou ?zmax=22 no endereço. */
(function () {
  "use strict";
  if (window.IPR_NITIDEZ_OFF || window.__iprNitidez) return;
  window.__iprNitidez = 1;
  var q = new URLSearchParams(location.search), Z = parseFloat(q.get("zmax")) || 19.5;
  var CLASSES = /l_(exposicao|geomorphons|vento)/;
  var ESC_COR = ["match", ["to-number", ["get", "classe"], 1], 1, "#9ecae1", 2, "#6baed6", 3, "#3182bd", 4, "#08519c", "#6baed6"];
  var ESC_LARG = ["interpolate", ["linear"], ["zoom"], 12, ["match", ["to-number", ["get", "classe"], 1], 4, 1.2, 3, 0.7, 0.3], 16, ["match", ["to-number", ["get", "classe"], 1], 4, 2.8, 3, 1.8, 2, 1, 0.6], 19, ["match", ["to-number", ["get", "classe"], 1], 4, 4.5, 3, 3, 2, 1.8, 1.1]];
  var ESC_FILTRO = ["any", [">=", ["zoom"], 15], [">=", ["to-number", ["get", "classe"], 1], 3]];

  // Camada nova no catálogo da Base (antes de o mapa se criar, como as outras camadas da Base do viz.js).
  try {
    var V = window.IPRViz;
    if (V && typeof V.juntar === "function") {
      V.juntar({ id: "l_escorrencia", lid: "escorrencia", g: "lidar", sub: "Base Cartográfica · Hidrologia", n: "Linhas de escorrência (acumulação em linhas)", en: "Overland flow lines (flow accumulation as lines)",
        t: "lidar", forma: "linha", leg: [["#9ecae1", "menos de 0,5 ha"], ["#6baed6", "0,5 a 2 ha"], ["#3182bd", "2 a 10 ha"], ["#08519c", "10 ha ou mais"]], lic: "v", op: 1, cor: "#3182bd", fonte: "LiDAR DGT · processamento IPR (worker 1.0.38)" });
    }
  } catch (e) {}

  function aplicar(m) {
    try {
      if (m.getMaxZoom() > Z) m.setMaxZoom(Z);
      (m.getStyle().layers || []).forEach(function (l) {
        if (l.type === "raster") {
          var r = CLASSES.test(l.id) ? "nearest" : "linear";
          if (m.getPaintProperty(l.id, "raster-resampling") !== r) m.setPaintProperty(l.id, "raster-resampling", r);
        } else if (l.type === "line" && l.id.indexOf("iprv-l_escorrencia") === 0 && !l.__esc) {
          if (JSON.stringify(m.getPaintProperty(l.id, "line-width")) !== JSON.stringify(ESC_LARG)) {
            m.setPaintProperty(l.id, "line-color", ESC_COR);
            m.setPaintProperty(l.id, "line-width", ESC_LARG);
            m.setFilter(l.id, ESC_FILTRO);
            try { m.setLayoutProperty(l.id, "line-sort-key", ["to-number", ["get", "area_m2"], 0]); m.setLayoutProperty(l.id, "line-cap", "round"); m.setLayoutProperty(l.id, "line-join", "round"); } catch (e) {}
          }
        }
      });
    } catch (e) {}
  }
  var visto = null;
  (function vez(n) {
    var m = window.__ipe && window.__ipe.mapa;
    if (m && m !== visto) { visto = m; aplicar(m); m.on("styledata", function () { aplicar(m); }); }
    if (n < 2400) setTimeout(function () { vez(n + 1); }, m ? 1500 : 250); // o Atlas recria o mapa ao mudar de modo
  })(0);
})();
