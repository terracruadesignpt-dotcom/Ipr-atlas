/* IPR Atlas · Energia, gás e títulos da DGEG em falta no catálogo (17/11/2026, 23h40; especificação de 17/11, secção 6:
   «Energia em Portugal e Espanha … parques, licenças …» e inventário de lacunas). Terracrua Design.
   Só acrescenta ao catálogo por IPRViz.juntar, como o nt1117-geologia.js; não mexe no viz.js nem no app.js.
   Fonte: DGEG, servergeo.dgeg.gov.pt, pasta Visualizadores (ArcGIS REST, lido a 17/11/2026): centrais eólicas (2892
   registos), solares (748), hídricas (189), térmicas (17), cogeração (24), consumidores de biogás (56), autoconsumo
   colectivo (1038), distribuição de gás natural por município, postos de abastecimento (3375), perímetros de protecção de
   água mineral natural (268), exploração experimental de depósitos minerais e áreas de petróleo.
   Licença: confirmar na ficha de metadados da DGEG antes de publicar em lote; aqui só se mostram as imagens do serviço.
   Indica centros electroprodutores registados; não distingue licença, operação confirmada e pedido de ligação.
   Grupo «Ambiente e actividades», subgrupo «Energia (DGEG)»; os títulos vão para Solo e Água.
   Desligar: ?energia=0. */
(function () {
  "use strict";
  var W = window;
  if (/[?&]energia=0(&|$)/.test(location.search) || W.__iprEn1117) return; W.__iprEn1117 = 1;
  var G = "https://servergeo.dgeg.gov.pt/arcgis/rest/services/Visualizadores/";
  var DGEG = "DGEG · Direcção-Geral de Energia e Geologia";
  var EN = ["Energia (DGEG)", "Energy (DGEG)"], DIR = ["Minas e direitos mineiros (DGEG)", "Mines and mining rights (DGEG)"],
      PROT = ["Protecção", "Protection"];
  var NE = "Registo da DGEG; não distingue licença, operação confirmada e pedido de ligação";
  var NOTA_D = "Indicativo; faz fé o título publicado pela DGEG e em Diário da República";
  // [id, grupo, sub, nome pt, nome en, serviço, camadas, cor, opacidade, zoom mínimo, nota]
  var C = [
    ["en_eolicas", "amb", EN, "Centrais eólicas", "Wind power plants", "CE", null, "#26a69a", 1, 7, NE],
    ["en_solares", "amb", EN, "Centrais solares", "Solar power plants", "CS", null, "#fbc02d", 1, 7, NE],
    ["en_hidricas", "amb", EN, "Centrais hídricas", "Hydro power plants", "CH", null, "#1e88e5", 1, 7, NE],
    ["en_termicas", "amb", EN, "Centrais térmicas", "Thermal power plants", "CT", null, "#e53935", 1, 6, NE],
    ["en_cogeracao", "amb", EN, "Centrais de cogeração", "Cogeneration plants", "CC", null, "#8e24aa", 1, 7, NE],
    ["en_biogas", "amb", EN, "Consumidores de biogás", "Biogas consumers", "Biogas", null, "#6d4c41", 1, 7, NE],
    ["en_autocons", "amb", EN, "Autoconsumo colectivo e comunidades de energia", "Collective self-consumption", "ACC", null, "#43a047", 1, 8, "Registo da DGEG"],
    ["en_gas", "amb", EN, "Distribuição de gás natural por município", "Natural gas distribution by municipality", "DistribuicaoGas", null, "#5c6bc0", .45, 6, "Concessão, licença local ou sem rede"],
    ["en_postos", "amb", EN, "Postos de abastecimento de combustíveis", "Fuel stations", "PACVR", null, "#546e7a", 1, 10, "Registo da DGEG"],
    ["dgeg_pee", "solo", DIR, "Exploração experimental de depósitos minerais", "Experimental mining (mineral deposits)", "PEE", null, "#c2185b", .5, 6, NOTA_D],
    ["dgeg_petroleo", "solo", DIR, "Petróleo: áreas de pesquisa e exploração", "Oil: exploration areas", "PPEP", "show:0,1,3", "#37474f", .4, 6, NOTA_D],
    ["dgeg_ppro_amn", "agua", PROT, "Perímetros de protecção de água mineral natural", "Natural mineral water protection perimeters", "PPROTAMN", null, "#0097a7", .4, 8, NOTA_D]
  ];
  function registar() {
    var V = W.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    var ja = {}; V.catalogo.forEach(function (e) { if (e && e.id) ja[e.id] = 1; });
    C.forEach(function (d) {
      if (ja[d[0]]) return;
      var e = { id: d[0], g: d[1], sub: d[2][0], subEn: d[2][1], n: d[3], en: d[4], t: "ags", url: G + d[5] + "/MapServer",
        lic: "a", op: d[8], cor: d[7], minz: d[9], fonte: DGEG };
      if (d[6]) e.layers = d[6];
      if (d[10]) e.nota = d[10];
      e._sub = d[2][0];
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 60) setTimeout(function () { vez(n + 1); }, 100); })(0);
})();
