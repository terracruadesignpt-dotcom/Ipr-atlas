/* IPR Atlas · Camadas novas do ICNF e da APA (Nuno, 28/10/2026, 13h01: «avancemos com tudo»; no cartão escolheu os quatro
   grupos: áreas protegidas e corredores, fogo, solo e ecologia, espécies e caça).
   Lista e prioridades da auditoria research_notes/apa_icnf_auditoria_2026-10-28.md, secção 5. Serviços lidos a 28/10/2026.
   Como o agua.js e o habitats.js: só catálogo (IPRViz.juntar) e fichas (window.IPR_FICHAS); não mexe no viz.js nem no app.js.
   Todas as camadas são «export» do ArcGIS REST em 3857 com o desenho do próprio serviço. Licença «a» (âmbar): dados abertos
   com citação, uso num serviço pago por confirmar (ICNF: carta enviada a 28/10; APA: pedido previsto a sniamb@). */
(function () {
  "use strict";
  if (window.__iprNatureza) return;
  window.__iprNatureza = 1;
  var EXPL = window.IPR_NIVEL === "explorer";
  var I = "https://sigservices.icnf.pt/server/rest/services/", A = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/Atlas/Atlas_Ambiente/MapServer";
  var DATA = "28/10/2026";
  function lg() { var l = String(window.IPR_LINGUA || "pt").toLowerCase(); return l.indexOf("pt") === 0 ? "pt" : "en"; }

  // [id, grupo, chave do subgrupo, nome pt, nome en, url, camadas ("" = todas), cor, opacidade, minz, nível, família, legenda]
  var SUB = {
    ac: ["Áreas classificadas", "Protected areas"], cor: ["Corredores e ordenamento florestal", "Corridors and forest planning"],
    rec: ["Recorrência e severidade", "Recurrence and severity"], dfci: ["Prioridades de defesa", "Defence priorities"],
    eco: ["Bioclima e ecologia (Atlas do Ambiente)", "Bioclimate and ecology (Environment Atlas)"], sub: ["Subterrânea", "Groundwater"],
    flo: ["Floresta", "Forest"], deg: ["Solo", "Soil"], esp: ["Espécies (quadrículas)", "Species (grid cells)"], caca: ["Caça e lazer", "Hunting and recreation"]
  };
  var C = [
    // Áreas protegidas e corredores
    ["peap_rp", "cond", "ac", "Regimes de protecção das áreas protegidas (PEAP)", "Protection regimes in protected areas (PEAP)", I + "BDG/peap/MapServer", "show:3", "#6a1b9a", .5, 0, "e", "peap", [["#4a148c", "Parcial tipo I"], ["#8e24aa", "Parcial tipo II"], ["#ce93d8", "Complementar"], ["#eeeeee", "Fora de regimes"]]],
    ["peap_aie", "cond", "ac", "Áreas de intervenção específica (PEAP)", "Specific intervention areas (PEAP)", I + "BDG/peap/MapServer", "show:2,0", "#ab47bc", .6, 0, "e", "peapaie"],
    ["zec_so", "cond", "ac", "Rede Natura · SIC/ZEC (habitats e espécies)", "Natura 2000 · SCI/SAC (habitats and species)", I + "BDG/RN2000/MapServer", "show:1", "#2e7d32", .4, 0, "e", "zec"],
    ["zpe_so", "cond", "ac", "Rede Natura · ZPE (aves)", "Natura 2000 · SPA (birds)", I + "BDG/RN2000/MapServer", "show:0", "#0277bd", .4, 0, "e", "zpe"],
    ["ramsar", "cond", "ac", "Sítios Ramsar (zonas húmidas)", "Ramsar sites (wetlands)", I + "BDG/RAMSAR/MapServer", "", "#00838f", .5, 0, "e", "ramsar"],
    ["biosfera", "cond", "ac", "Reservas da Biosfera (limites e zonamento)", "Biosphere Reserves (limits and zoning)", I + "BDG/BIOSFERA/MapServer", "show:0,1", "#558b2f", .45, 0, "e", "biosfera"],
    ["geossitios", "nat", "ac", "Geossítios", "Geosites", I + "BDG/Geossitios/MapServer", "", "#8d6e63", .7, 0, "e", "geo"],
    ["prof_cor", "nat", "cor", "Corredores ecológicos (PROF)", "Ecological corridors (regional forest plans)", I + "BDG/PROF/MapServer", "show:2", "#43a047", .5, 0, "e", "corredores"],
    ["prof_sub", "solo", "cor", "Sub-regiões homogéneas (PROF)", "Homogeneous sub-regions (regional forest plans)", I + "BDG/PROF/MapServer", "show:1", "#7cb342", .35, 0, "e", "profsub"],
    ["prof_reg", "solo", "cor", "Regiões PROF", "Regional forest plan regions", I + "BDG/PROF/MapServer", "show:0", "#33691e", .3, 0, "e", "profreg"],
    // Fogo
    ["fogo_ret", "fogo", "rec", "Intervalo de retorno do fogo (1975–2022)", "Fire return interval (1975–2022)", I + "DFCI/GIFR_AArdidas_IndicadorRetorno/MapServer", "show:2", "#bf360c", .6, 9, "e", "retorno"],
    ["fogo_n", "fogo", "rec", "Número de incêndios por parcela (1975–2022)", "Number of fires per parcel (1975–2022)", I + "DFCI/GIFR_AArdidas_IndicadorRetorno/MapServer", "show:1", "#d84315", .6, 9, "e", "ninc"],
    ["fogo_ult", "fogo", "rec", "Ano do último incêndio (1975–2022)", "Year of the last fire (1975–2022)", I + "DFCI/GIFR_AArdidas_IndicadorRetorno/MapServer", "show:0", "#e64a19", .6, 9, "e", "ultimo"],
    ["sev25", "fogo", "rec", "Severidade das áreas ardidas · 2025", "Burn severity · 2025", I + "DFCI/DFCI_Severidade/MapServer", "show:9", "#b71c1c", .7, 0, "e", "sev"],
    ["sev19", "fogo", "rec", "Severidade das áreas ardidas · 2019–2024", "Burn severity · 2019–2024", I + "DFCI/DFCI_Severidade/MapServer", "show:7,6,3,0,1,2", "#c62828", .65, 0, "e", "sev"],
    ["freg_dfci", "fogo", "dfci", "Freguesias prioritárias para a fiscalização das faixas · 2025", "Priority parishes for fuel-break enforcement · 2025", I + "BDG/FREG_PRIORITARIAS_DFCI/MapServer", "show:11", "#ff7043", .35, 0, "e", "fregp"],
    ["loc_crit", "fogo", "dfci", "Locais críticos para incêndio rural", "Critical sites for rural fires", I + "BDG/Locais_criticos/MapServer", "", "#ff5722", .6, 0, "e", "loccrit"],
    ["nematodo", "fogo", "dfci", "Nemátodo da madeira do pinheiro · freguesias e zona tampão", "Pine wood nematode · parishes and buffer zone", I + "BDG/NEMATODO/MapServer", "", "#795548", .4, 0, "e", "nematodo"],
    // Solo e ecologia
    ["ldi", "solo", "deg", "Tendência de produtividade das terras 2000–2010 (degradação)", "Land productivity trend 2000–2010 (degradation)", I + "BDG/LDI/MapServer", "show:0", "#a1887f", .6, 0, "e", "ldi"],
    ["zon_eco", "nat", "eco", "Zonas ecológicas (andares)", "Ecological zones (altitudinal belts)", A, "show:32", "#689f38", .55, 0, "e", "eco"],
    ["reg_nat", "nat", "eco", "Regiões naturais (divisão regional)", "Natural regions (regional division)", A, "show:33", "#9e9d24", .45, 0, "e", "eco"],
    ["paisagem", "nat", "eco", "Tipos de paisagem", "Landscape types", A, "show:34", "#827717", .45, 0, "e", "eco"],
    ["fitogeo", "nat", "eco", "Zonas fitogeográficas predominantes", "Main phytogeographic zones", A, "show:35", "#558b2f", .5, 0, "e", "eco"],
    ["insolacao", "nat", "eco", "Insolação (horas de sol por ano)", "Sunshine (hours per year)", A, "show:1", "#f9a825", .5, 0, "e", "clima"],
    ["radiacao", "nat", "eco", "Radiação solar global", "Global solar radiation", A, "show:3", "#ff8f00", .5, 0, "e", "clima"],
    ["humidade", "nat", "eco", "Humidade relativa do ar", "Relative air humidity", A, "show:8", "#4fc3f7", .5, 0, "e", "clima"],
    ["aq_residuo", "agua", "sub", "Águas subterrâneas · resíduo seco", "Groundwater · total dissolved solids", A, "show:18", "#90a4ae", .5, 0, "e", "quim"],
    ["aq_cloretos", "agua", "sub", "Águas subterrâneas · cloretos", "Groundwater · chlorides", A, "show:19", "#78909c", .5, 0, "e", "quim"],
    ["aq_sulfatos", "agua", "sub", "Águas subterrâneas · sulfatos", "Groundwater · sulphates", A, "show:20", "#607d8b", .5, 0, "e", "quim"],
    ["aq_dureza", "agua", "sub", "Águas subterrâneas · dureza", "Groundwater · hardness", A, "show:21", "#546e7a", .5, 0, "e", "quim"],
    ["ifn15", "solo", "flo", "Espécies florestais por fotoponto (IFN 2015)", "Forest species by sample point (NFI 2015)", I + "BDG/IFN_especies_florestais/MapServer", "show:0", "#2e7d32", .9, 10, "e", "ifn"],
    ["rp_azinheira", "solo", "flo", "Região de proveniência · azinheira", "Seed provenance region · holm oak", I + "BDG/rp_florestais/MapServer", "show:3", "#6b8e23", .4, 0, "i", "rp"],
    ["rp_castanheiro", "solo", "flo", "Região de proveniência · castanheiro", "Seed provenance region · sweet chestnut", I + "BDG/rp_florestais/MapServer", "show:6", "#8d6e63", .4, 0, "i", "rp"],
    ["rp_freixo", "solo", "flo", "Região de proveniência · freixo", "Seed provenance region · narrow-leaved ash", I + "BDG/rp_florestais/MapServer", "show:12", "#7cb342", .4, 0, "i", "rp"],
    ["rp_amieiro", "solo", "flo", "Região de proveniência · amieiro", "Seed provenance region · alder", I + "BDG/rp_florestais/MapServer", "show:2", "#26a69a", .4, 0, "i", "rp"],
    ["rp_cerejeira", "solo", "flo", "Região de proveniência · cerejeira-brava", "Seed provenance region · wild cherry", I + "BDG/rp_florestais/MapServer", "show:8", "#ad1457", .4, 0, "i", "rp"],
    ["rp_manso", "solo", "flo", "Região de proveniência · pinheiro-manso", "Seed provenance region · stone pine", I + "BDG/rp_florestais/MapServer", "show:16", "#558b2f", .4, 0, "i", "rp"],
    ["rp_bravo", "solo", "flo", "Região de proveniência · pinheiro-bravo", "Seed provenance region · maritime pine", I + "BDG/rp_florestais/MapServer", "show:14", "#33691e", .4, 0, "i", "rp"],
    ["rp_vidoeiro", "solo", "flo", "Região de proveniência · vidoeiro", "Seed provenance region · downy birch", I + "BDG/rp_florestais/MapServer", "show:20", "#9ccc65", .4, 0, "i", "rp"],
    // Espécies e caça
    ["lv_flora", "nat", "esp", "Flora ameaçada · Lista Vermelha (quadrícula 10 km)", "Threatened flora · Red List (10 km grid)", I + "BDG/lv_flora10k/MapServer", "", "#c2185b", .45, 0, "i", "lvflora"],
    ["art17_esp", "nat", "esp", "Espécies da Directiva Habitats · art. 17.º (10 km)", "Habitats Directive species · Article 17 (10 km)", I + "BDG/rel_art17_especies/MapServer", "", "#6a1b9a", .35, 0, "i", "art17e"],
    ["art12_aves", "nat", "esp", "Aves · relatório art. 12.º (10 km)", "Birds · Article 12 report (10 km)", I + "BDG/rel_art12_aves/MapServer", "", "#1565c0", .35, 0, "i", "art12"],
    ["atlas_aves", "nat", "esp", "II Atlas das Aves Nidificantes", "2nd Breeding Bird Atlas", I + "BDG/II_Atlas_Aves_Nidificantes/MapServer", "show:0", "#0d47a1", .35, 0, "i", "atlasaves"],
    ["zonas_caca", "cond", "caca", "Zonas de caça (associativa, municipal, turística, nacional)", "Hunting zones (associative, municipal, tourist, national)", I + "BDG/zonas_caca/MapServer", "show:0", "#8d6e63", .4, 0, "e", "caca", [["#a1887f", "Associativa"], ["#ffb74d", "Municipal"], ["#e57373", "Turística"], ["#64b5f6", "Nacional"]]],
    ["percursos", "nat", "caca", "Percursos pedestres na natureza (ICNF)", "Nature walking trails (ICNF)", I + "BDG/percursos_pedestres/MapServer", "", "#ef6c00", 1, 0, "e", "percursos"]
  ];

  function registar() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function") return false;
    C.forEach(function (c) {
      if (EXPL && c[10] === "i") return;
      var e = { id: c[0], g: c[1], sub: SUB[c[2]][0], n: c[3], en: c[4], t: "ags", url: c[5], lic: "a", op: c[8], cor: c[7],
        fonte: /apambiente/.test(c[5]) ? "APA · Atlas do Ambiente" : "ICNF", nota: c[10] === "i" ? "Intelligence" : "", niv: c[10] };
      if (c[6]) e.layers = c[6];
      if (c[9]) e.minz = c[9];
      if (c[12]) e.leg = c[12];
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 40) setTimeout(function () { vez(n + 1); }, 50); })(0);

  // Fichas (formato do §28), escritas em português e em inglês. [o que serve, como se lê, fonte, cobertura, escala, limitações, exemplo]
  var F = {
    peap: { pt: ["Saber o que se pode fazer dentro de um parque ou reserva: cada regime tem regras próprias para obras, cortes e usos.", "Protecção parcial I é a mais restritiva, seguida da parcial II e da complementar. Clique para ver o regime e o programa especial.", "Programas especiais das áreas protegidas (PEAP), ICNF.", "Áreas protegidas com PEAP publicado.", "Escala dos programas (1:25 000).", "Onde o PEAP ainda não foi publicado vale o plano de ordenamento antigo (POAP). Confirme sempre o regulamento.", "Ver se um monte no Parque Natural do Vale do Guadiana fica em protecção parcial antes de projectar uma charca."],
      en: ["Find out what is allowed inside a park or reserve: each regime has its own rules for works, felling and land uses.", "Partial protection I is the strictest, followed by partial II and complementary. Click for the regime and the special programme.", "Special programmes for protected areas (PEAP), ICNF.", "Protected areas with a published PEAP.", "Programme scale (1:25,000).", "Where no PEAP has been published, the older management plan (POAP) applies. Always check the regulations.", "Check whether a farm in the Vale do Guadiana Natural Park is under partial protection before designing a pond."] },
    peapaie: { pt: ["Ver as áreas e pontos com regras específicas dentro das áreas protegidas.", "Polígonos e pontos com o tipo de intervenção prevista.", "PEAP, ICNF.", "Áreas protegidas com PEAP.", "1:25 000.", "Leia sempre o regulamento do programa.", "Ver se há uma área de intervenção específica num vale."],
      en: ["See areas and points with specific rules inside protected areas.", "Polygons and points with the planned type of intervention.", "PEAP, ICNF.", "Protected areas with a PEAP.", "1:25,000.", "Always read the programme regulations.", "Check for a specific intervention area in a valley."] },
    zec: { pt: ["Separar os sítios de habitats e espécies (SIC/ZEC) das zonas para aves: as obrigações são diferentes.", "Mancha verde: SIC ou ZEC. Clique para o código e o nome do sítio.", "Rede Natura 2000, ICNF (limites aferidos a 1:25 000, DR n.º 1/2020).", "Continente.", "1:25 000.", "Obras e mudanças de uso dentro da Rede Natura podem precisar de parecer do ICNF.", "Saber se um terreno está numa ZEC antes de pedir licença para uma construção."],
      en: ["Tell habitat and species sites (SCI/SAC) apart from bird areas: the obligations differ.", "Green patch: SCI or SAC. Click for the site code and name.", "Natura 2000 network, ICNF (boundaries refined at 1:25,000, Regulatory Decree 1/2020).", "Mainland Portugal.", "1:25,000.", "Works and land-use changes inside Natura 2000 may need an ICNF opinion.", "Check whether a plot is in a SAC before applying for a building permit."] },
    zpe: { pt: ["Ver as zonas de protecção especial para aves.", "Mancha azul: ZPE. Clique para o código e o nome.", "Rede Natura 2000, ICNF.", "Continente.", "1:25 000.", "Restrições próprias em época de nidificação; confirme com o ICNF.", "Planear trabalhos fora da época de reprodução numa ZPE de estepe."],
      en: ["See the special protection areas for birds.", "Blue patch: SPA. Click for the code and name.", "Natura 2000 network, ICNF.", "Mainland Portugal.", "1:25,000.", "Specific restrictions during the breeding season; check with ICNF.", "Plan works outside the breeding season in a steppe SPA."] },
    ramsar: { pt: ["Identificar zonas húmidas de importância internacional.", "Polígonos dos sítios Ramsar.", "Convenção de Ramsar, ICNF.", "Continente.", "Variável.", "Não é uma condicionante legal por si; muitas coincidem com a Rede Natura.", "Enquadrar um projecto junto a um estuário ou lagoa."],
      en: ["Identify wetlands of international importance.", "Ramsar site polygons.", "Ramsar Convention, ICNF.", "Mainland Portugal.", "Varies.", "Not a legal constraint in itself; many overlap with Natura 2000.", "Frame a project next to an estuary or lagoon."] },
    biosfera: { pt: ["Ver as reservas da biosfera da UNESCO e as suas zonas núcleo, tampão e de transição.", "Limites e zonamento; clique para o nome e a zona.", "UNESCO MAB, ICNF.", "Portugal continental.", "Variável.", "O zonamento orienta, não proíbe; as regras vêm de outros instrumentos.", "Ligar um projecto de turismo de natureza à reserva da biosfera onde está."],
      en: ["See UNESCO Biosphere Reserves with their core, buffer and transition zones.", "Limits and zoning; click for the name and zone.", "UNESCO MAB, ICNF.", "Mainland Portugal.", "Varies.", "Zoning guides rather than forbids; the rules come from other instruments.", "Link a nature tourism project to the biosphere reserve it lies in."] },
    geo: { pt: ["Saber se há património geológico a proteger ou valorizar.", "Geossítios do inventário nacional; clique para o nome e o valor.", "Inventário de geossítios (Universidade do Minho, 2011), ICNF.", "Continente.", "1:25 000.", "Inventário de 2011; pode não incluir sítios descritos depois.", "Evitar um caminho novo sobre um afloramento classificado."],
      en: ["Find geological heritage to protect or showcase.", "Geosites from the national inventory; click for name and value.", "Geosite inventory (University of Minho, 2011), ICNF.", "Mainland Portugal.", "1:25,000.", "2011 inventory; may miss sites described since.", "Avoid routing a new track over a listed outcrop."] },
    corredores: { pt: ["Desenhar a ligação entre manchas de natureza: o corredor ecológico é a base da conectividade num projecto regenerativo.", "Faixas dos corredores ecológicos dos PROF de 2.ª geração.", "Programas regionais de ordenamento florestal (PROF), ICNF.", "Continente.", "Regional.", "Traçado regional e esquemático; afine no terreno pelas linhas de água e pela vegetação.", "Escolher onde plantar uma sebe ou galeria ripícola para ligar dois bosques."],
      en: ["Design links between patches of nature: the ecological corridor is the backbone of connectivity in a regenerative project.", "Corridor strips from the 2nd-generation regional forest plans.", "Regional forest management programmes (PROF), ICNF.", "Mainland Portugal.", "Regional.", "Regional and schematic route; refine on the ground using streams and vegetation.", "Choose where to plant a hedge or riparian strip to link two woodlands."] },
    profsub: { pt: ["Saber que espécies e normas de silvicultura o PROF privilegia em cada zona.", "Sub-regiões homogéneas; clique para o nome e consulte o regulamento do PROF.", "PROF, ICNF.", "Continente.", "Regional.", "As espécies a privilegiar estão no regulamento, não no mapa.", "Escolher as árvores de uma plantação de acordo com o PROF."],
      en: ["Find which species and forestry rules the regional plan favours in each zone.", "Homogeneous sub-regions; click for the name and see the plan regulations.", "PROF, ICNF.", "Mainland Portugal.", "Regional.", "Favoured species are in the regulations, not on the map.", "Choose the trees for a plantation in line with the plan."] },
    profreg: { pt: ["Saber que PROF se aplica.", "Regiões PROF; clique para o nome.", "PROF, ICNF.", "Continente.", "Regional.", "Só enquadramento.", "Encontrar o regulamento certo."],
      en: ["Find which regional forest plan applies.", "PROF regions; click for the name.", "PROF, ICNF.", "Mainland Portugal.", "Regional.", "Context only.", "Find the right regulations."] },
    retorno: { pt: ["Ver onde o fogo volta mais depressa: chave para desenhar mosaicos e faixas.", "Classes do intervalo de retorno calculado sobre as áreas ardidas desde 1975. Aparece a partir da aproximação 9.", "Cartografia nacional de áreas ardidas 1975–2022 e indicador de retorno (Venâncio 2020), ICNF/CNFSBF.", "Continente, só onde ardeu.", "Parcela de área ardida.", "Onde nunca ardeu não há valor. Não é uma previsão.", "Decidir onde pôr pastoreio ou culturas de sequeiro como corta-fogo."],
      en: ["See where fire returns fastest: key to designing mosaics and fuel breaks.", "Return interval classes computed from burnt areas since 1975. Appears from zoom 9.", "National burnt area mapping 1975–2022 and return indicator (Venâncio 2020), ICNF/CNFSBF.", "Mainland Portugal, only where fire has occurred.", "Burnt area parcel.", "No value where it never burnt. Not a forecast.", "Decide where to place grazing or dryland crops as firebreaks."] },
    ninc: { pt: ["Contar quantas vezes ardeu cada sítio.", "De 1 a mais de 18 incêndios desde 1975. Aparece a partir da aproximação 9.", "ICNF/CNFSBF.", "Continente, só onde ardeu.", "Parcela.", "Os incêndios mais antigos têm limites menos precisos.", "Ver se um terreno à venda arde de dez em dez anos."],
      en: ["Count how often each place has burnt.", "From 1 to over 18 fires since 1975. Appears from zoom 9.", "ICNF/CNFSBF.", "Mainland Portugal, only where fire has occurred.", "Parcel.", "Older fires have less precise outlines.", "Check whether a plot for sale burns every ten years."] },
    ultimo: { pt: ["Saber há quanto tempo ardeu cada sítio.", "Ano do último incêndio; clique para o valor. Aparece a partir da aproximação 9.", "ICNF/CNFSBF.", "Continente, só onde ardeu.", "Parcela.", "Até 2022; para os anos seguintes use as áreas ardidas.", "Estimar a idade da vegetação depois do último fogo."],
      en: ["Find how long ago each place burnt.", "Year of the last fire; click for the value. Appears from zoom 9.", "ICNF/CNFSBF.", "Mainland Portugal, only where fire has occurred.", "Parcel.", "Up to 2022; for later years use the burnt areas.", "Estimate vegetation age since the last fire."] },
    sev: { pt: ["Orientar o restauro depois do fogo: onde o solo e a vegetação ficaram mais afectados.", "Classes de severidade (RdNBR, Sentinel-2) do ICNF; clique para a classe e a área.", "Severidade das áreas ardidas, ICNF (DFCI).", "Continente, áreas ardidas do ano.", "Pixel de 10 a 20 m agregado em polígonos.", "Índice de satélite; confirme no terreno antes de decidir.", "Escolher onde fazer primeiro o controlo de erosão depois de um incêndio."],
      en: ["Guide post-fire restoration: where soil and vegetation were hit hardest.", "ICNF severity classes (RdNBR, Sentinel-2); click for class and area.", "Burn severity, ICNF (DFCI).", "Mainland Portugal, burnt areas of the year.", "10 to 20 m pixels aggregated into polygons.", "Satellite index; check on the ground before deciding.", "Choose where to start erosion control after a fire."] },
    fregp: { pt: ["Saber se a freguesia é prioritária na fiscalização da gestão de combustível.", "Freguesias prioritárias de 2025.", "ICNF (DFCI).", "Continente.", "Freguesia.", "A lista muda todos os anos.", "Planear a limpeza das faixas a tempo."],
      en: ["Find whether the parish is a priority for fuel management enforcement.", "Priority parishes for 2025.", "ICNF (DFCI).", "Mainland Portugal.", "Parish.", "The list changes every year.", "Plan fuel-break clearing in time."] },
    loccrit: { pt: ["Ver os locais identificados como críticos para incêndio rural.", "Polígonos; clique para o nome.", "ICNF.", "Continente.", "Variável.", "Lista oficial; pode não estar actualizada.", "Reforçar a defesa de um aglomerado junto a um local crítico."],
      en: ["See places identified as critical for rural fire.", "Polygons; click for the name.", "ICNF.", "Mainland Portugal.", "Varies.", "Official list; may be out of date.", "Strengthen the defence of a village next to a critical site."] },
    nematodo: { pt: ["Saber se há restrições ao corte e ao transporte de pinheiro.", "Freguesias com nemátodo e zona tampão.", "ICNF.", "Continente.", "Freguesia.", "Confirme as regras em vigor no ICNF.", "Planear o abate e o transporte de madeira de pinho."],
      en: ["Find whether pine felling and transport are restricted.", "Parishes with pine wood nematode and the buffer zone.", "ICNF.", "Mainland Portugal.", "Parish.", "Check current rules with ICNF.", "Plan felling and transport of pine timber."] },
    ldi: { pt: ["Ver onde a produtividade das terras desceu ou subiu: é o que um projecto regenerativo quer inverter.", "Tendência da produtividade entre 2000 e 2010 (indicador ODS 15.3); clique para a classe.", "ICNF (LDI).", "Continente.", "Satélite (MODIS), pequena escala.", "Período antigo e resolução grosseira; serve de enquadramento.", "Escolher uma área degradada para um projecto-piloto de restauro."],
      en: ["See where land productivity fell or rose: what a regenerative project aims to reverse.", "Productivity trend 2000–2010 (SDG indicator 15.3); click for the class.", "ICNF (LDI).", "Mainland Portugal.", "Satellite (MODIS), small scale.", "Old period and coarse resolution; context only.", "Pick a degraded area for a restoration pilot."] },
    eco: { pt: ["Ler a bioregião: que vegetação natural e que clima de fundo tem o lugar.", "Classes da carta do Atlas do Ambiente; clique para o nome.", "Atlas do Ambiente, APA.", "Continente.", "1:1 000 000.", "Escala nacional: só enquadramento, não serve para limites de terreno.", "Escolher espécies de uma sebe de acordo com o andar ecológico."],
      en: ["Read the bioregion: the natural vegetation and background climate of the place.", "Classes from the Environment Atlas map; click for the name.", "Environment Atlas, APA.", "Mainland Portugal.", "1:1,000,000.", "National scale: context only, not for plot boundaries.", "Choose hedge species to suit the ecological belt."] },
    clima: { pt: ["Ler o clima de fundo para a Leitura Territorial: sol, radiação e humidade.", "Classes da carta do Atlas do Ambiente; clique para o valor.", "Atlas do Ambiente, APA.", "Continente.", "1:1 000 000.", "Normais antigas; não reflectem o clima recente.", "Pré-dimensionar uma instalação solar ou um secador."],
      en: ["Read the background climate for the Territorial Reading: sun, radiation and humidity.", "Classes from the Environment Atlas map; click for the value.", "Environment Atlas, APA.", "Mainland Portugal.", "1:1,000,000.", "Old climate normals; do not reflect the recent climate.", "Pre-size a solar installation or a dryer."] },
    quim: { pt: ["Ter uma primeira ideia da aptidão da água subterrânea para rega e consumo.", "Classes da carta; clique para o valor.", "Atlas do Ambiente, APA.", "Continente.", "1:1 000 000.", "Carta antiga e regional: analise sempre a água do furo.", "Prever se a água de um furo novo pode salinizar o solo."],
      en: ["Get a first idea of whether groundwater suits irrigation and drinking.", "Map classes; click for the value.", "Environment Atlas, APA.", "Mainland Portugal.", "1:1,000,000.", "Old regional map: always test the water from the borehole.", "Anticipate whether a new borehole may salinise the soil."] },
    ifn: { pt: ["Ver que árvores existem à volta: montado, sobreiro, azinheira, pinheiro, eucalipto.", "Pontos de amostragem do Inventário Florestal Nacional 2015; clique para a ocupação principal, a secundária e o coberto. Aparece a partir da aproximação 10.", "IFN 2015, ICNF.", "Continente (malha de amostragem).", "Ponto.", "São amostras, não manchas: entre pontos não há informação.", "Confirmar se há montado de sobro na zona de um terreno."],
      en: ["See which trees grow around: dehesa, cork oak, holm oak, pine, eucalyptus.", "Sample points of the 2015 National Forest Inventory; click for main and secondary cover and canopy. Appears from zoom 10.", "NFI 2015, ICNF.", "Mainland Portugal (sampling grid).", "Point.", "Samples, not patches: no information between points.", "Confirm whether there is cork oak dehesa near a plot."] },
    rp: { pt: ["Saber de onde deve vir a semente ou a planta de uma espécie florestal, para que se adapte ao lugar.", "Regiões de proveniência da espécie; clique para o nome da região.", "Regiões de proveniência das espécies florestais, ICNF.", "Continente.", "Regional.", "Obrigatório em plantações com materiais florestais de reprodução certificados.", "Pedir ao viveiro plantas de azinheira da região de proveniência certa."],
      en: ["Find where seed or plants of a forest species should come from, so they suit the place.", "Provenance regions for the species; click for the region name.", "Provenance regions of forest species, ICNF.", "Mainland Portugal.", "Regional.", "Mandatory for plantations with certified forest reproductive material.", "Ask the nursery for holm oak from the right provenance region."] },
    lvflora: { pt: ["Saber que plantas ameaçadas foram registadas perto.", "Quadrículas de 10 km com registos da Lista Vermelha da flora; clique para a espécie e a categoria.", "Lista Vermelha da Flora Vascular de Portugal Continental, ICNF.", "Continente.", "Quadrícula UTM de 10 km.", "Presença na quadrícula, não no terreno. O clique mostra só os dois primeiros registos.", "Pedir um levantamento botânico antes de lavrar uma pastagem antiga."],
      en: ["Find which threatened plants have been recorded nearby.", "10 km cells with Red List flora records; click for species and category.", "Red List of the Vascular Flora of Mainland Portugal, ICNF.", "Mainland Portugal.", "10 km UTM grid.", "Presence in the cell, not on the ground. A click shows only the first two records.", "Order a botanical survey before ploughing an old pasture."] },
    art17e: { pt: ["Ver que espécies da Directiva Habitats ocorrem na região.", "Quadrículas de 10 km; clique para a espécie e o estado.", "Relatório art. 17.º, 2013–2018, ICNF.", "Todo o país.", "Quadrícula de 10 km.", "Presença na quadrícula; o clique mostra só os dois primeiros registos.", "Saber se há lontra ou cágado na bacia de uma ribeira a restaurar."],
      en: ["See which Habitats Directive species occur in the area.", "10 km cells; click for species and status.", "Article 17 report, 2013–2018, ICNF.", "Whole country.", "10 km grid.", "Presence in the cell; a click shows only the first two records.", "Find whether otter or terrapin occur in a stream catchment to be restored."] },
    art12: { pt: ["Ver que aves ocorrem na região, segundo o relatório europeu.", "Quadrículas de 10 km; clique para a espécie.", "Relatório art. 12.º da Directiva Aves, ICNF.", "Todo o país.", "Quadrícula de 10 km.", "Presença na quadrícula; o clique mostra só os dois primeiros registos.", "Planear sebes e charcas a pensar nas aves da zona."],
      en: ["See which birds occur in the area, according to the EU report.", "10 km cells; click for the species.", "Article 12 report under the Birds Directive, ICNF.", "Whole country.", "10 km grid.", "Presence in the cell; a click shows only the first two records.", "Plan hedges and ponds with the local birds in mind."] },
    atlasaves: { pt: ["Ver as aves que nidificam na zona.", "Quadrículas do II Atlas; clique para a espécie e o grau de confirmação.", "II Atlas das Aves Nidificantes de Portugal, ICNF.", "Continente.", "Quadrícula de 10 km.", "Dados de censo; o clique mostra só os dois primeiros registos.", "Evitar trabalhos em época de nidificação de uma espécie sensível."],
      en: ["See which birds breed in the area.", "Cells from the 2nd Atlas; click for species and breeding evidence.", "2nd Breeding Bird Atlas of Portugal, ICNF.", "Mainland Portugal.", "10 km grid.", "Census data; a click shows only the first two records.", "Avoid works during the breeding season of a sensitive species."] },
    caca: { pt: ["Saber se o terreno está numa zona de caça e de que tipo.", "Cores por tipo de zona; clique para o número e a designação.", "Zonas de caça, ICNF.", "Continente.", "Variável.", "Não substitui a sinalização no terreno. O proprietário pode pedir a exclusão do seu prédio nos termos da lei.", "Saber a quem pedir para não haver caça junto a um projecto de turismo."],
      en: ["Find whether the land lies in a hunting zone and of which type.", "Colours by zone type; click for number and name.", "Hunting zones, ICNF.", "Mainland Portugal.", "Varies.", "Does not replace signage on the ground. Owners may ask for their land to be excluded as the law provides.", "Find whom to ask so there is no hunting next to a tourism project."] },
    percursos: { pt: ["Ver percursos pedestres homologados ou divulgados pelo ICNF.", "Linhas dos percursos; clique para o nome e a extensão.", "Percursos pedestres, ICNF.", "Áreas protegidas e outros locais.", "Linha.", "Complementa o OpenStreetMap; confirme o estado no terreno.", "Ligar uma casa de turismo rural a um percurso existente."],
      en: ["See walking trails approved or promoted by ICNF.", "Trail lines; click for name and length.", "Walking trails, ICNF.", "Protected areas and other places.", "Line.", "Complements OpenStreetMap; check conditions on the ground.", "Connect a rural guesthouse to an existing trail."] }
  };
  var GN = { pt: { cond: "Condicionantes", fogo: "Fogo", solo: "Solo, ocupação e vegetação", nat: "Natureza e clima", agua: "Água" },
    en: { cond: "Constraints", fogo: "Fire", solo: "Soil, land cover and vegetation", nat: "Nature and climate", agua: "Water" } };
  function ficha(c, l) {
    var x = F[c[11]][l], k = l === "pt" ? 0 : 1, fonte = /apambiente/.test(c[5]) ? "APA" : "ICNF", svc = c[5].replace(/^https:\/\/[^/]+/, "");
    return { id: c[0], n: l === "pt" ? c[3] : c[4], g: GN[l][c[1]] + " · " + SUB[c[2]][k] + (c[10] === "i" ? " · Intelligence" : ""),
      o: (l === "pt" ? c[3] : c[4]) + ".", s: x[0], l: x[1], d: x[2], c: x[3], e: x[4], lim: x[5], ex: x[6],
      f: l === "pt" ? fonte + ", " + svc + (c[6] ? " (" + c[6] + ")" : "") + ", consultado em " + DATA + ". Dados abertos com citação; uso num serviço pago por confirmar (âmbar)."
        : fonte + ", " + svc + (c[6] ? " (" + c[6] + ")" : "") + ", accessed " + DATA + ". Open data with attribution; use in a paid service to be confirmed (amber).",
      est: l === "pt" ? "disponível" : "available", porConfirmar: [] };
  }
  function fichas() {
    var FX = window.IPR_FICHAS; if (!FX) return false;
    var l = lg(); C.forEach(function (c) { if (!(EXPL && c[10] === "i")) FX[c[0]] = ficha(c, l); });
    return true;
  }
  (function vez(n) { if (!fichas() && n < 150) setTimeout(function () { vez(n + 1); }, 800); })(0);
  document.addEventListener("ipr:lingua", function () { try { fichas(); } catch (e) {} });
})();
