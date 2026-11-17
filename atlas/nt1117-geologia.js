/* IPR Atlas · Geologia, recursos minerais e direitos mineiros (Nuno, 17/11/2026, 20h59: «procura as camadas de concessões
   mineiras, de geologia, de recursos minérios, tanto do Alentejo como do Norte»). Terracrua Design.
   Só acrescenta ao catálogo por IPRViz.juntar (como o condicionantes-extra.js); não mexe no viz.js nem no app.js.
   Fontes (ArcGIS REST, lidas a 17/11/2026):
   · LNEG, geoPortal da Energia e Geologia (sig.lneg.pt, inspire.lneg.pt): cartas geológicas 1:1 000 000, 1:500 000, 1:200 000
     e 1:50 000; Carta Geológica da Zona Sul Portuguesa; SIORMINP (ocorrências minerais); áreas potenciais de recursos minerais;
     matérias-primas críticas (2023); depósitos minerais do Norte e 1:200 000; jazigos; mapa metalogenético da Zona Sul
     Portuguesa; mármores de Estremoz e de Viana–Alvito; concessões e áreas de prospecção históricas. WMS de acesso livre;
     licença CC BY 4.0 indicada nos metadados INSPIRE do LNEG (SIORMINP, CGP1M); nas outras cartas confirmar na ficha.
   · DGEG (servergeo.dgeg.gov.pt, Visualizadores): concessões mineiras, prospecção e pesquisa, contratos em vigor, pedreiras
     (CC BY 4.0 nos metadados INSPIRE), recuperação ambiental de minas, salvaguarda de urânio, áreas de reserva e cativas,
     área de protecção de Moncorvo e servidão administrativa da Mina do Barroso. Restantes: «confirmar na fonte».
   Grupo Solo, subgrupos «Geologia», «Recursos minerais (LNEG)» e «Minas e direitos mineiros (DGEG)».
   Desligar: ?geologia=0. */
(function () {
  "use strict";
  var W = window;
  if (/[?&]geologia=0(&|$)/.test(location.search) || W.__iprGeo1117) return; W.__iprGeo1117 = 1;
  var L = "https://sig.lneg.pt/server/rest/services/", LI = "https://inspire.lneg.pt/arcgis/rest/services/";
  var G = "https://servergeo.dgeg.gov.pt/arcgis/rest/services/Visualizadores/";
  var GEO = ["Geologia", "Geology"], MIN = ["Recursos minerais (LNEG)", "Mineral resources (LNEG)"], DIR = ["Minas e direitos mineiros (DGEG)", "Mines and mining rights (DGEG)"];
  var LNEG = "LNEG · geoPortal da Energia e Geologia", LNEGv = LNEG + ", CC BY 4.0";
  var DGEG = "DGEG · Direcção-Geral de Energia e Geologia";
  var NOTA_D = "Indicativo; faz fé o título publicado pela DGEG e em Diário da República";
  // [id, sub, nome pt, nome en, url, camadas, cor, opacidade, zoom mínimo, fonte, licença v|a, nota]
  var C = [
    ["geo_cgp1m", GEO, "Carta Geológica de Portugal 1:1 000 000 (continente e ilhas)", "Geological map of Portugal 1:1,000,000", L + "CGP1M/MapServer", null, "#8d6e63", .55, 5, LNEGv, "v", "LNEG, edição de 2010"],
    ["geo_cgp500k", GEO, "Carta Geológica de Portugal 1:500 000", "Geological map of Portugal 1:500,000", L + "CGP500k/MapServer", "show:2,1", "#8d6e63", .55, 6, LNEG, "a", "Serviços Geológicos de Portugal, 5.ª edição, 1992"],
    ["geo_cgp200k", GEO, "Carta Geológica 1:200 000 (folhas publicadas)", "Geological map 1:200,000 (published sheets)", L + "CGP200k/MapServer", null, "#795548", .6, 8, LNEG, "a", "Mosaico das folhas publicadas"],
    ["geo_cgp50k", GEO, "Carta Geológica 1:50 000 · litologia (INSPIRE)", "Geological map 1:50,000 · lithology (INSPIRE)", LI + "CartografiaGeologica/CGP50k/MapServer", "show:2", "#6d4c41", .55, 10, LNEG, "a", "Só onde há folhas 1:50 000 publicadas"],
    ["geo_zsp", GEO, "Carta Geológica da Zona Sul Portuguesa 1:400 000 (Alentejo e Algarve)", "Geological map of the South Portuguese Zone 1:400,000", L + "CartaZonaSulPortuguesa/MapServer", null, "#a1887f", .6, 7, LNEG, "a", "Projecto GEO_FPI, 2020"],
    ["min_ocorr", MIN, "Ocorrências e recursos minerais (SIORMINP)", "Mineral occurrences and resources (SIORMINP)", L + "OcorrenciasMinerais/MapServer", null, "#ff6f00", 1, 7, LNEGv, "v", "Continente"],
    ["min_potencial", MIN, "Áreas potenciais de recursos minerais", "Mineral potential areas", L + "AreasPotenciaisRecursosMinerais/MapServer", null, "#f9a825", .5, 6, LNEG, "a", "Visão geral; não substitui estudo local"],
    ["min_litio", MIN, "Potencial de quartzo, feldspato, lítio e berilo", "Quartz, feldspar, lithium and beryl potential", L + "AreasPotenciaisRecursosMinerais/MapServer", "show:5", "#7e57c2", .5, 6, LNEG, "a", "Subconjunto das áreas potenciais"],
    ["min_crm", MIN, "Matérias-primas críticas e estratégicas (2023)", "Critical and strategic raw materials (2023)", L + "CRM2023/MapServer", "show:5,6,7", "#d84315", 1, 6, LNEG, "a", "Compilação de ocorrências"],
    ["min_dep_norte", MIN, "Depósitos minerais e minas da Região Norte 1:200 000", "Mineral deposits and mines, North region 1:200,000", L + "CartaDepositosMinerais_Norte/MapServer", "show:2,3,4", "#bf360c", 1, 7, LNEG, "a", "Norte"],
    ["min_dep200k", MIN, "Carta de depósitos minerais 1:200 000", "Mineral deposits map 1:200,000", L + "CartaDepositosMinerais200k/MapServer", "show:0", "#e65100", 1, 7, LNEG, "a", ""],
    ["min_jazigos", MIN, "Jazigos minerais", "Mineral deposits (main)", L + "JazigosMinerais/MapServer", null, "#ef6c00", 1, 6, LNEG, "a", ""],
    ["min_metal_zsp", MIN, "Jazigos de minerais metálicos da Zona Sul Portuguesa (Faixa Piritosa)", "Metallic mineral deposits, South Portuguese Zone", L + "MapaMetalogeneticoZSP/MapServer", "show:11", "#c62828", 1, 7, LNEG, "a", "Alentejo e Algarve"],
    ["min_marm_est", MIN, "Mármores do anticlinal de Estremoz: pedreiras, escombreiras e área cativa", "Estremoz anticline marbles: quarries, spoil heaps, reserved area", L + "NucleosMarmoreAnticlinalEstremoz/MapServer", "show:3,2,4,6", "#9e9e9e", .8, 10, LNEG, "a", "2003–2008"],
    ["min_marm_va", MIN, "Mármores de Viana do Alentejo–Alvito: pedreiras e escombreiras", "Viana do Alentejo–Alvito marbles: quarries and spoil heaps", L + "MarmoresVianaAlvito/MapServer", "show:4,5", "#9e9e9e", .8, 10, LNEG, "a", ""],
    ["min_conc_hist", MIN, "Concessões mineiras históricas (1836–1992)", "Historical mining concessions (1836–1992)", L + "ConcessoesMineiras/MapServer", null, "#6d4c41", .5, 7, LNEG, "a", "Histórico; não são títulos em vigor"],
    ["min_pp_hist", MIN, "Áreas de prospecção e pesquisa históricas (desde 1955)", "Historical exploration areas (since 1955)", L + "AreasProspecaoPesquisa/MapServer", null, "#8e24aa", .4, 7, LNEG, "a", "Histórico; não são títulos em vigor"],
    ["dgeg_conc", DIR, "Concessões mineiras (depósitos minerais)", "Mining concessions (mineral deposits)", G + "CMDP/MapServer", null, "#b71c1c", .5, 6, DGEG, "a", NOTA_D],
    ["dgeg_pp", DIR, "Prospecção e pesquisa de depósitos minerais", "Mineral exploration licences", G + "PPDP/MapServer", null, "#6a1b9a", .45, 6, DGEG, "a", NOTA_D],
    ["dgeg_contr", DIR, "Contratos em vigor (prospecção e concessão)", "Contracts in force (exploration and concession)", G + "CM_PP_ContratosVigor/MapServer", null, "#ad1457", .45, 6, DGEG, "a", NOTA_D],
    ["dgeg_barroso", DIR, "Servidão administrativa da Mina do Barroso", "Administrative easement of the Barroso mine", G + "ServidaoMinaBarroso/MapServer", null, "#d50000", .55, 9, DGEG, "a", NOTA_D],
    ["dgeg_emm", DIR, "Pedreiras licenciadas (exploração de massas minerais)", "Licensed quarries", G + "EMM/MapServer", null, "#757575", .6, 8, DGEG + ", CC BY 4.0", "v", NOTA_D],
    ["dgeg_radm", DIR, "Minas abandonadas: recuperação ambiental", "Abandoned mines: environmental recovery", G + "RADM/MapServer", null, "#4e342e", .55, 7, DGEG, "a", ""],
    ["dgeg_seu", DIR, "Salvaguarda de ocorrências de urânio", "Uranium occurrence safeguard areas", G + "SEU/MapServer", null, "#fdd835", .45, 6, DGEG, "a", NOTA_D],
    ["dgeg_arc", DIR, "Áreas de reserva e áreas cativas", "Reserve and captive areas", G + "ARC/MapServer", null, "#455a64", .45, 6, DGEG, "a", NOTA_D],
    ["dgeg_apm", DIR, "Área de protecção dos jazigos de ferro de Moncorvo", "Moncorvo iron deposits protection area", G + "APM/MapServer", null, "#5d4037", .45, 7, DGEG, "a", NOTA_D]
  ];
  function registar() {
    var V = W.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    var ja = {}; V.catalogo.forEach(function (e) { if (e && e.id) ja[e.id] = 1; });
    C.forEach(function (d) {
      if (ja[d[0]]) return;
      var e = { id: d[0], g: "solo", sub: d[1][0], subEn: d[1][1], n: d[2], en: d[3], t: "ags", url: d[4], lic: d[10], op: d[7], cor: d[6], minz: d[8], fonte: d[9] };
      if (d[5]) e.layers = d[5];
      if (d[11]) e.nota = d[11];
      e._sub = d[1][0];
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 60) setTimeout(function () { vez(n + 1); }, 100); })(0);
})();
