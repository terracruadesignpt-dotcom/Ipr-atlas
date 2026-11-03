/* IPR Atlas · condicionantes que faltavam (orla costeira e inundações), 3/11/2026. Terracrua Design.
   Pedido do Nuno (3/11, 20h48): «avança com as camadas que vamos identificando que fazem falta e vamos organizar as camadas
   no bloco lateral esquerdo das condicionantes ... orla, inundações, começa a importar isso tudo».
   Só acrescenta ao catálogo por IPRViz.juntar (como o habitats.js); não mexe no viz.js nem no app.js.
   Fontes (Agência Portuguesa do Ambiente, ArcGIS REST, lidas a 3/11/2026):
   · SNIAmb/POC: Programas da Orla Costeira em vigor (área de intervenção, margem, faixas de salvaguarda, zona terrestre
     de protecção, área crítica).
   · SNIAmb/ZonasAdjacentes_PubDR: zonas adjacentes publicadas em Diário da República (servidão: ocupação edificada
     proibida ou condicionada).
   · SNIAmb/Risco_Inundacao_Potencialmente_Significativas: zonas com risco potencial significativo de inundação (ARPSI).
   · Visualizador/PGRI_2C_Perigo_IGT: perigo de inundação para os instrumentos de gestão territorial (2.º ciclo do PGRI).
   · Visualizador/Diretiva60CE2007_2ciclo_v2: áreas inundáveis para 20, 100 e 1000 anos (Directiva 2007/60/CE).
   · SNIAmb/POAAP: Planos de Ordenamento de Albufeiras de Águas Públicas.
   Arrumação dentro de Condicionantes: Ordenamento (PDM) · Orla costeira · Reservas · Natureza · Água (com os planos das
   albufeiras) · Inundações · Servidões. As legendas vêm do próprio serviço (§77 do arrumar.js).
   Informação indicativa: vinculativo é o publicado em Diário da República e na APA.
   Desligar: ?condx=0 ou localStorage ipr_condx_off = 1. */
(function () {
  "use strict";
  if (window.__iprCondExtra) return;
  window.__iprCondExtra = 1;
  try { if (/[?&]condx=0(&|$)/.test(location.search) || window.localStorage.getItem("ipr_condx_off") === "1") return; } catch (e) {}
  var R = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/";
  var POC = R + "SNIAmb/POC/MapServer", ZA = R + "SNIAmb/ZonasAdjacentes_PubDR/MapServer",
    ARPSI = R + "SNIAmb/Risco_Inundacao_Potencialmente_Significativas/MapServer",
    PGRI = R + "Visualizador/PGRI_2C_Perigo_IGT/MapServer", DI = R + "Visualizador/Diretiva60CE2007_2ciclo_v2/MapServer",
    POAAP = R + "SNIAmb/POAAP/MapServer";
  var NOTA = "Indicativo; vinculativo é o publicado em DR e na APA";
  var ORLA = ["Orla costeira", "Coastline"], INUN = ["Inundações", "Flooding"], AGUA = ["Água", "Water"];
  // [id, sub, nome pt, nome en, url, camadas, cor, opacidade, zoom mínimo, nota]
  var L = [
    ["poc_area", ORLA, "Programa da Orla Costeira · área de intervenção", "Coastal programme · area covered", POC, "show:0", "#0d47a1", .25, 8],
    ["poc_ztp", ORLA, "Zona terrestre de protecção (POC)", "Land protection zone (coastal programme)", POC, "show:16", "#1565c0", .4, 10],
    ["poc_margem", ORLA, "Margem (POC)", "Shore margin (coastal programme)", POC, "show:8", "#4fc3f7", .55, 11],
    ["poc_fs_arenoso", ORLA, "Faixas de salvaguarda · litoral arenoso (galgamento e erosão)", "Safeguard strips · sandy coast (overtopping and erosion)", POC, "show:10,11", "#e65100", .5, 10],
    ["poc_fs_arriba", ORLA, "Faixas de salvaguarda · litoral de arriba", "Safeguard strips · cliff coast", POC, "show:12", "#bf360c", .5, 10],
    ["poc_critica", ORLA, "Áreas críticas (POC)", "Critical areas (coastal programme)", POC, "show:15", "#c62828", .45, 10],
    ["poaap", AGUA, "Planos de ordenamento de albufeiras (POAAP)", "Reservoir management plans", POAAP, "show:0", "#0277bd", .35, 9],
    ["zadj", INUN, "Zonas adjacentes (servidão, publicadas em DR)", "Adjacent zones (legal easement)", ZA, "show:0", "#ff3d00", .5, 9],
    ["pgri_perigo", INUN, "Perigo de inundação para os PDM (PGRI, 2.º ciclo)", "Flood hazard for land-use plans (2nd cycle)", PGRI, "show:0", "#e53935", .5, 9],
    ["inund_t20", INUN, "Área inundável · 20 anos (probabilidade elevada)", "Flood area · 20 years (high probability)", DI, "show:230", "#0d47a1", .5, 9],
    ["inund_t100", INUN, "Área inundável · 100 anos (fluvial e costeira)", "Flood area · 100 years (river and coastal)", DI, "show:179,210", "#1e88e5", .45, 9],
    ["inund_t1000", INUN, "Área inundável · 1000 anos (probabilidade baixa)", "Flood area · 1000 years (low probability)", DI, "show:147", "#90caf9", .45, 9],
    ["arpsi", INUN, "Zonas com risco potencial significativo de inundação (ARPSI)", "Areas of potential significant flood risk", ARPSI, "show:0", "#6a1b9a", .4, 7]
  ];
  function lg() { var l = String(window.IPR_LINGUA || window.IPR_LANG || "pt").toLowerCase(); return l.indexOf("pt") === 0 ? "pt" : "en"; }
  // Onde entra cada subgrupo: antes do primeiro item do subgrupo indicado (ordem dos subgrupos = primeira aparição).
  var ANTES = { "Orla costeira": "Reservas", "Inundações": "Servidões" };
  function arrumar(E, novos) {
    novos.forEach(function (e) { var i = E.indexOf(e); if (i >= 0) E.splice(i, 1); });
    novos.forEach(function (e) {
      var j = -1, k;
      if (e._sub === "Água") { for (k = E.length - 1; k >= 0; k--) if (E[k].g === "cond" && E[k]._sub0 === "Água") { j = k + 1; break; } }
      else { var alvo = ANTES[e._sub];
        for (k = 0; k < E.length; k++) if (E[k].g === "cond" && E[k]._sub0 === alvo) { j = k; break; }
        if (j >= 0) { for (k = j - 1; k >= 0; k--) if (E[k].g === "cond" && E[k]._sub0 === e._sub) { j = k + 1; break; } } }
      if (j < 0) E.push(e); else E.splice(j, 0, e);
      e._sub0 = e._sub;
    });
  }
  function registar() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    var en = lg() === "en", E = V.catalogo, novos = [];
    E.forEach(function (x) { if (x && x.g === "cond" && x._sub0 == null) x._sub0 = String(x.sub || ""); });
    L.forEach(function (d) {
      var e = { id: d[0], g: "cond", sub: en ? d[1][1] : d[1][0], subEn: d[1][1], n: en ? d[3] : d[2], en: d[3], t: "ags", url: d[4], layers: d[5],
        lic: "v", op: d[7], cor: d[6], minz: d[8], fonte: "APA", nota: NOTA };
      e._sub = d[1][0];
      if (V.juntar(e)) novos.push(e);
    });
    try { arrumar(E, novos); } catch (x) {}
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 40) setTimeout(function () { vez(n + 1); }, 50); })(0);
})();
