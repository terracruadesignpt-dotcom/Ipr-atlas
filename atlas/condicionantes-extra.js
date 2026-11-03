/* IPR Atlas · condicionantes que faltavam (orla costeira e inundações), 3/11/2026. Terracrua Design.
   Pedido do Nuno (3/11, 20h48): «avança com as camadas que vamos identificando que fazem falta e vamos organizar as camadas
   no bloco lateral esquerdo das condicionantes ... orla, inundações, começa a importar isso tudo».
   Só acrescenta ao catálogo por IPRViz.juntar (como o habitats.js); não mexe no viz.js nem no app.js.
   Fontes (Agência Portuguesa do Ambiente, ArcGIS REST, lidas a 3/11/2026):
   · SNIAmb/POC: Programas da Orla Costeira em vigor (área de intervenção, margem, faixas de salvaguarda, zona terrestre
     de protecção, área crítica).
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
  var POC = R + "SNIAmb/POC/MapServer", PGRI = R + "Visualizador/PGRI_2C_Perigo_IGT/MapServer";
  var NOTA = "Indicativo; vinculativo é o publicado em DR e na APA";
  var ORLA = ["Litoral", "Coastline"], INUN = ["Inundações", "Flooding"];
  // [id, sub, nome pt, nome en, url, camadas, cor, opacidade, zoom mínimo, nota]
  var L = [
    ["poc_area", ORLA, "Programa da Orla Costeira · área de intervenção", "Coastal programme · area covered", POC, "show:0", "#0d47a1", .25, 8],
    ["poc_ztp", ORLA, "Zona terrestre de protecção (POC)", "Land protection zone (coastal programme)", POC, "show:16", "#1565c0", .4, 10],
    ["poc_margem", ORLA, "Margem (POC)", "Shore margin (coastal programme)", POC, "show:8", "#4fc3f7", .55, 11],
    ["poc_critica", ORLA, "Áreas críticas (POC)", "Critical areas (coastal programme)", POC, "show:15", "#c62828", .45, 10],
    ["pgri_perigo", INUN, "Perigo de inundação para os PDM (PGRI, 2.º ciclo)", "Flood hazard for land-use plans (2nd cycle)", PGRI, "show:0", "#e53935", .5, 9]
  ];
  // Ordem dos subgrupos de Condicionantes (pedido do Nuno, 3/11, 20h48: «organizar ... que faça sentido»). O painel ordena
  // os subgrupos pela primeira aparição no catálogo; aqui reordenam-se só as entradas «cond», nas mesmas posições, de forma
  // estável. Subgrupos que não estejam na lista ficam no fim, pela ordem em que estavam.
  var ORDEM = ["Ordenamento (PDM)", "PDM · planta de condicionantes (imagem)", "Litoral", "Reservas", "Natureza", "Áreas classificadas",
    "Água", "Inundações", "Servidões", "Servidões oficiais (SRUP · DGT)", "Caça e lazer"];
  var ITEM = { poc_area: 0, poc_ztp: 1, poc_margem: 2, poc_faixas: 3, poc_critica: 4 };
  function arrumar(E) {
    var pos = [], it = [];
    E.forEach(function (e, i) { if (e && e.g === "cond") { pos.push(i); it.push({ e: e, i: i }); } });
    function rank(x) { var k = ORDEM.indexOf(String(x.e._sub || x.e.sub || "")); return k < 0 ? ORDEM.length : k; }
    it.sort(function (a, b) { return rank(a) - rank(b) || ((ITEM[a.e.id] != null && ITEM[b.e.id] != null) ? ITEM[a.e.id] - ITEM[b.e.id] : a.i - b.i); });
    pos.forEach(function (p, k) { E[p] = it[k].e; });
  }
  function registar() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    var E = V.catalogo;
    L.forEach(function (d) {
      var e = { id: d[0], g: "cond", sub: d[1][0], subEn: d[1][1], n: d[2], en: d[3], t: "ags", url: d[4], layers: d[5],
        lic: "v", op: d[7], cor: d[6], minz: d[8], fonte: "APA", nota: NOTA };
      e._sub = d[1][0];
      V.juntar(e);
    });
    try { arrumar(E); } catch (x) {}
    return true;
  }
  (function vez(n) { try { if (registar()) { [300, 1000, 2500, 5000].forEach(function (t) { setTimeout(function () { try { arrumar(window.IPRViz.catalogo); } catch (x) {} }, t); }); return; } } catch (e) {} if (n < 40) setTimeout(function () { vez(n + 1); }, 50); })(0);
})();
