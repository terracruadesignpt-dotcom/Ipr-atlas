/* IPR Atlas · Água (Nuno, 27/10/2026, 10h06: «Avança com tudo o que tem a ver com a água [...] é para andar tudo hoje»).
   Ficheiro próprio, carregado depois de camadas.js, viz.js, app.js, arranque.js, ajustes.js, mundo-camadas.js e intervencao.js.
   Não mexe nesses ficheiros: estende em tempo de execução o que eles expõem (IPRViz.juntar e IPRViz.grupos, window.IPR_FICHAS do
   §28, o painel #ipr-t62 do §62, a legenda #ipr-lgd do §71, window.__iprTemas e window.__iprLingua).
   Fonte do levantamento: propostas/ipr-ideias/03-apa-camadas.md (27/10/2026), secções 6 e 7; perfis em 01-pessoas-contas-perfis.md §4.
   Testes a partir do servidor (POST /tcd/v1/viz/diag, 27/10/2026): todos os pedidos «export» em EPSG:3857 e todas as legendas
   «/legend?f=json» responderam 200 com CORS aberto para terracruadesign.pt. Os mapas municipais de ruído devolveram imagem vazia
   em Lisboa e no Porto (0,9 kB): ficam «por activar» e fora do catálogo.
   §A1 catálogo · §A2 fichas · §A3 legendas no mapa · §A4 tema «Água no terreno» · §A5 perfis Água e Protecção Civil · §A6 estilos */
(function () {
  "use strict";
  if (window.__iprAgua) return;
  var EXPL = window.IPR_NIVEL === "explorer";
  var R = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/";
  var DATA_TESTE = "27/10/2026";
  function lg() { var l = String(window.IPR_LINGUA || "pt").toLowerCase(); return l.indexOf("pt") === 0 ? "pt" : "en"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function viz() { return window.__ipe && window.__ipe.viz; }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function catIdx() { var m = {}; try { (window.IPRViz.catalogo || []).forEach(function (e) { m[e.id] = e; }); } catch (e) {} return m; }
  function activas() { try { return viz().activas(); } catch (e) { return []; } }

  // §A1 Catálogo. Camadas das «20 primeiras» do relatório 03 que ainda não existiam no viz.js. Todas por «export» do ArcGIS REST
  // em 3857 (tipo «ags», o mesmo pedido de mosaicos que o Atlas já usa para a APA). Licença «a» (âmbar) até a APA confirmar por
  // escrito (relatório 03, secção 3). niv: «e» Explorer, «i» Intelligence (no Explorer não entram no catálogo; o tema mostra-as
  // com cadeado). off: falhou no teste do servidor, fica fora do catálogo e aparece como «por activar».
  // [id, grupo, subgrupo pt, subgrupo en, nome pt, nome en, serviço, camadas, cor, opacidade, minz, niv, família da ficha, off]
  var DIR = "Visualizador/Diretiva60CE2007_2ciclo_v2", IGT = "Visualizador/PGRI_2C_Perigo_IGT", APRI = "Visualizador/APRI_3ciclo_DAGRI_consultapublica",
    AAG = "Atlas/Atlas_Agua", AAM = "Atlas/Atlas_Ambiente", DPH = "Visualizador/DominioPublicoHidrico", PG3 = "PGRH/3_PGRH_3_Status_Objectives", PG2 = "PGRH/2_PGRH_3_Pressures";
  var CAM = [
    ["inund20", "agua", "Cheias", "Floods", "Zonas inundáveis · T = 20 anos (probabilidade elevada)", "Flood areas · 20-year return period (high probability)", DIR, "230", "#0d47a1", .55, 0, "e", "cheia"],
    ["inund100", "agua", "Cheias", "Floods", "Zonas inundáveis · T = 100 anos (fluvial e costeira)", "Flood areas · 100-year return period (river and coastal)", DIR, "179,210", "#1976d2", .5, 0, "e", "cheia"],
    ["inund1000", "agua", "Cheias", "Floods", "Zonas inundáveis · T = 1000 anos (probabilidade baixa)", "Flood areas · 1000-year return period (low probability)", DIR, "147", "#64b5f6", .45, 0, "e", "cheia"],
    ["perigo_igt", "agua", "Cheias", "Floods", "Perigo de inundação para os planos (IGT)", "Flood hazard for land-use plans (IGT)", IGT, "0", "#c62828", .55, 0, "e", "igt"],
    ["cotas_cheia", "agua", "Cheias", "Floods", "Cotas de cheia (PGRI 2.º ciclo)", "Flood levels (2nd-cycle flood risk plans)", IGT, "1", "#283593", 1, 10, "e", "cotas"],
    ["eventos_cheia", "agua", "Cheias", "Floods", "Eventos de inundação reportados (APRI 3.º ciclo)", "Reported flood events (3rd-cycle preliminary assessment)", APRI, "1", "#6a1b9a", 1, 0, "e", "eventos"],
    ["arpsi3", "agua", "Cheias", "Floods", "Proposta de ARPSI do 3.º ciclo (consulta pública)", "Proposed 3rd-cycle significant flood risk areas (public consultation)", APRI, "4", "#4527a0", .5, 0, "e", "arpsi3"],
    ["cheia_prof20", "agua", "Cheias", "Floods", "Profundidade da cheia · T = 20 anos", "Flood depth · 20-year return period", DIR, "242", "#0277bd", .6, 11, "i", "prof"],
    ["cheia_prof100", "agua", "Cheias", "Floods", "Profundidade da cheia · T = 100 anos", "Flood depth · 100-year return period", DIR, "191", "#0288d1", .6, 11, "i", "prof"],
    ["cheia_prof1000", "agua", "Cheias", "Floods", "Profundidade da cheia · T = 1000 anos", "Flood depth · 1000-year return period", DIR, "159", "#039be5", .6, 11, "i", "prof"],
    ["cheia_per20", "agua", "Cheias", "Floods", "Perigosidade da cheia · T = 20 anos", "Flood hazard · 20-year return period", DIR, "233", "#d84315", .6, 10, "i", "perig"],
    ["cheia_per100", "agua", "Cheias", "Floods", "Perigosidade da cheia · T = 100 anos", "Flood hazard · 100-year return period", DIR, "182", "#e64a19", .6, 10, "i", "perig"],
    ["cheia_per1000", "agua", "Cheias", "Floods", "Perigosidade da cheia · T = 1000 anos", "Flood hazard · 1000-year return period", DIR, "150", "#f4511e", .6, 10, "i", "perig"],
    ["alb_snirh", "agua", "Armazenamento", "Storage", "Albufeiras da rede SNIRH (ficha da barragem)", "SNIRH-monitored reservoirs (dam record)", AAG, "9", "#01579b", 1, 0, "e", "alb"],
    ["alb_bacia", "agua", "Armazenamento", "Storage", "Bacias drenantes das albufeiras (SNIRH)", "Reservoir catchments (SNIRH)", AAG, "10", "#4fc3f7", .4, 0, "e", "albbac"],
    ["precmax", "agua", "Clima", "Climate", "Precipitação máxima diária anual", "Maximum daily rainfall (annual)", AAG, "47", "#5c6bc0", .55, 0, "e", "precmax"],
    ["etr", "agua", "Clima", "Climate", "Evapotranspiração real (Atlas do Ambiente)", "Actual evapotranspiration (Environment Atlas)", AAM, "10", "#8d6e63", .55, 0, "e", "clima"],
    ["coef_esc", "agua", "Hidrologia do solo", "Soil hydrology", "Coeficientes de escoamento · T = 100 anos", "Runoff coefficients · 100-year return period", AAG, "13", "#795548", .55, 0, "i", "coef"],
    ["temp_med", "nat", "Clima (Atlas do Ambiente)", "Climate (Environment Atlas)", "Temperatura média anual", "Mean annual temperature", AAM, "2", "#ef6c00", .55, 0, "e", "clima"],
    ["geada_ano", "nat", "Clima (Atlas do Ambiente)", "Climate (Environment Atlas)", "Geada · duração do período (ano agrícola)", "Frost · length of the frost season (farming year)", AAM, "6", "#90caf9", .55, 0, "e", "clima"],
    ["geada_dias", "nat", "Clima (Atlas do Ambiente)", "Climate (Environment Atlas)", "Geada · dias por ano", "Frost · days per year", AAM, "7", "#bbdefb", .55, 0, "e", "clima"],
    ["dph_dem", "cond", "Água", "Water", "Domínio público hídrico · linhas demarcadas (LLL, LLM, arriba)", "Public water domain · demarcated lines (bed, bank, cliff top)", DPH, "19,20,21,22,23,24", "#0d47a1", 1, 11, "e", "dphdem"],
    ["dph_autos", "cond", "Água", "Water", "Domínio hídrico · autos de delimitação publicados", "Water domain · published delimitation records", DPH, "3,4", "#1565c0", 1, 11, "e", "dphautos"],
    ["lagoas_pub", "cond", "Água", "Water", "Lagoas e lagos de águas públicas", "Public lagoons and lakes", "SNIAmb/Lagoas_Lagos_AguasPublicas", "0", "#29b6f6", .6, 0, "e", "lagoas"],
    ["poaap", "cond", "Água", "Water", "Planos de ordenamento de albufeiras (POAAP · âmbito)", "Reservoir management plans (POAAP · extent)", "SNIAmb/POAAP", "0", "#7e57c2", .4, 0, "e", "poaap"],
    ["poc_faixas", "cond", "Litoral", "Coast", "Faixas de salvaguarda da orla costeira (POC)", "Coastal safeguard strips (coastal programmes, POC)", DPH, "69,70,71,73,74,75,76,77,78,79,82,83,84,85,86,87,88,89,90,91,94,96,99,101,104", "#ad1457", .5, 9, "e", "poc"],
    ["ma_quim", "agua", "Estado das águas", "Water status", "Estado químico das massas de água (PGRH 3)", "Chemical status of water bodies (RBMP 3)", PG3, "10,11,12,13,14", "#00897b", .6, 0, "i", "estado"],
    ["ma_glob", "agua", "Estado das águas", "Water status", "Estado global das massas de água (PGRH 3)", "Overall status of water bodies (RBMP 3)", PG3, "22,23,24,25,26", "#00695c", .6, 0, "i", "estado"],
    ["press_agr", "agua", "Pressões", "Pressures", "Pressões agrícolas e pecuárias (cargas de azoto e fósforo)", "Farming and livestock pressures (nitrogen and phosphorus loads)", PG2, "92,95,106,109", "#9e9d24", .6, 0, "i", "press"],
    ["press_vol", "agua", "Escassez", "Scarcity", "Volumes captados estimados (agricultura e pecuária, hm³)", "Estimated abstraction volumes (farming and livestock, hm³)", PG2, "126,130", "#c0a060", .6, 0, "i", "pressvol"],
    ["est_qual", "agua", "Estações", "Stations", "Estações de qualidade das águas superficiais", "Surface water quality stations", "SNIAmb/Estacoes_monitorizacao_qualidade_aguas_superficias", "0", "#26a69a", 1, 0, "e", "estqual"],
    ["aia", "amb", "AIA", "EIA", "Projectos sujeitos a avaliação de impacte ambiental", "Projects subject to environmental impact assessment", "AIA/AIA_externo", "41", "#6d4c41", .5, 0, "i", "aia"],
    ["seveso", "amb", "Riscos industriais", "Industrial hazards", "Estabelecimentos Seveso (DL 150/2015)", "Seveso establishments (Decree-Law 150/2015)", "SNIAmb/Prevencao_Acidentes_Graves", "0", "#d50000", 1, 0, "i", "seveso"],
    ["ruido_lden", "amb", "Ruído", "Noise", "Mapas municipais de ruído · Lden", "Municipal noise maps · Lden", "Visualizador/MapasMunicipaisRuido", "0", "#ff7043", .55, 0, "e", "ruido", 1],
    ["ruido_ln", "amb", "Ruído", "Noise", "Mapas municipais de ruído · Ln", "Municipal noise maps · Ln", "Visualizador/MapasMunicipaisRuido", "1", "#ff8a65", .55, 0, "e", "ruido", 1]
  ];
  var DEF = {}, NOVAS = [];
  CAM.forEach(function (c) {
    DEF[c[0]] = { id: c[0], g: c[1], sub: c[2], subEn: c[3], n: c[4], en: c[5], svc: c[6], ids: c[7], cor: c[8], op: c[9], minz: c[10], niv: c[11], fam: c[12], off: !!c[13] };
  });
  function registar() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function") return false;
    if (V.grupos && !V.grupos.some(function (g) { return g.id === "amb"; })) {
      var i = -1; V.grupos.forEach(function (g, k) { if (g.id === "ref") i = k; });
      var G = { id: "amb", nome: "Ambiente e actividades", en: "Environment and activities" };
      if (i >= 0) V.grupos.splice(i, 0, G); else V.grupos.push(G);
    }
    CAM.forEach(function (c) {
      var d = DEF[c[0]]; if (d.off) return;
      if (EXPL && d.niv === "i") return;
      var e = { id: d.id, g: d.g, sub: d.sub, n: d.n, en: d.en, t: "ags", url: R + d.svc + "/MapServer", layers: "show:" + d.ids, lic: "a", op: d.op, cor: d.cor,
        fonte: "APA · SNIAmb (" + d.svc.split("/").pop() + ")", nota: d.niv === "i" ? "Intelligence" : "", agua: 1, niv: d.niv };
      if (d.minz) e.minz = d.minz;
      if (V.juntar(e)) NOVAS.push(d.id);
    });
    return true;
  }
  try { registar(); } catch (e) {}

  // §A2 Fichas de camada (formato do §28: o que é, para que serve, como se lê, fonte, data, cobertura, escala, limitações,
  // exemplo, estado). Textos do relatório 03, secção 6, escritos em português e em inglês (sem tradução automática).
  var CIT = { pt: "Agência Portuguesa do Ambiente, I.P. (SNIAmb), serviço {s}, consultado em " + DATA_TESTE + ". Licença por confirmar por escrito (âmbar): consulta com citação.",
    en: "Agência Portuguesa do Ambiente, I.P. (SNIAmb), service {s}, accessed " + DATA_TESTE + ". Licence to be confirmed in writing (amber): viewing with attribution." };
  var FAM = {
    cheia: {
      pt: { s: "Perceber se um terreno, um caminho ou uma construção está numa zona de cheia conhecida.", l: "Azul mais escuro, cheia mais frequente: T = 20 anos é a mais provável, T = 1000 a mais rara. Clique para ver os atributos.", d: "PGRI do 2.º ciclo (RCM n.º 63/2024).", c: "Só as 63 áreas de risco potencial significativo de inundação (ARPSI) do continente.", e: "Cartografia de pormenor nas ARPSI.", lim: "Fora das ARPSI o mapa está vazio por falta de estudo, não por falta de risco. Não modela pequenas linhas de água nem o escoamento de encosta.", ex: "Antes de comprar uma casa junto ao Tejo, ver se fica na mancha de 100 anos." },
      en: { s: "See whether a plot, track or building lies in a known flood area.", l: "Darker blue means more frequent flooding: the 20-year flood is the most likely, the 1000-year the rarest. Click for attributes.", d: "2nd-cycle flood risk management plans (RCM 63/2024).", c: "Only the 63 areas of potential significant flood risk (APSFR) in mainland Portugal.", e: "Detailed mapping within the APSFR.", lim: "Outside the APSFR the map is empty because there is no study, not because there is no risk. Small streams and hillside runoff are not modelled.", ex: "Before buying a house near the Tagus, check whether it is inside the 100-year flood area." } },
    prof: {
      pt: { s: "Ler a gravidade da cheia: quanta água pode chegar a cada sítio.", l: "Classes de profundidade conforme a legenda da APA, por região hidrográfica.", d: "PGRI do 2.º ciclo.", c: "Só as ARPSI.", e: "Pormenor; só aparece a partir da aproximação 11.", lim: "Camada pesada no servidor da APA (8 a 9 s por mosaico no teste). Mesmas limitações de cobertura das zonas inundáveis.", ex: "Ver se um armazém agrícola numa várzea ficaria com mais de 1 m de água numa cheia de 100 anos." },
      en: { s: "Read how severe a flood is: how deep the water may get at each spot.", l: "Depth classes as in the APA legend, by river basin district.", d: "2nd-cycle flood risk management plans.", c: "Only the APSFR.", e: "Detailed; appears from zoom 11.", lim: "Heavy layer on the APA server (8 to 9 s per tile in testing). Same coverage limits as the flood areas.", ex: "Check whether a farm store on a floodplain would get more than 1 m of water in a 100-year flood." } },
    perig: {
      pt: { s: "Combinar profundidade e velocidade numa só classe de perigo para pessoas e bens.", l: "Classes de perigosidade conforme a legenda da APA (de baixa a muito elevada).", d: "PGRI do 2.º ciclo.", c: "Só as ARPSI.", e: "Pormenor; aparece a partir da aproximação 10.", lim: "Mesma cobertura das zonas inundáveis. Não substitui o plano municipal de emergência.", ex: "Escolher o caminho de evacuação de uma aldeia ribeirinha pelas zonas de menor perigo." },
      en: { s: "Combine depth and velocity into one hazard class for people and property.", l: "Hazard classes as in the APA legend (low to very high).", d: "2nd-cycle flood risk management plans.", c: "Only the APSFR.", e: "Detailed; appears from zoom 10.", lim: "Same coverage as the flood areas. Does not replace the municipal emergency plan.", ex: "Choose an evacuation route for a riverside village through the lower-hazard areas." } },
    igt: {
      pt: { s: "Antecipar o que a câmara vai considerar ao rever o PDM ou ao licenciar.", l: "Vermelho é perigo alto ou muito alto; seguem-se médio, baixo e muito baixo. Fluvial e costeiro.", d: "PGRI do 2.º ciclo, cartografia para integrar nos instrumentos de gestão territorial.", c: "ARPSI do continente.", e: "Visível entre 1:10 000 000 e 1:1 000.", lim: "É a cartografia do 2.º ciclo; o PDM em vigor pode ainda usar outra.", ex: "Saber, antes de um pedido de informação prévia, se o terreno está em perigo alto." },
      en: { s: "Anticipate what the council will consider when revising the municipal plan or licensing.", l: "Red is high or very high hazard, followed by medium, low and very low. River and coastal.", d: "2nd-cycle flood risk plans, mapping meant for land-use plans.", c: "APSFR in mainland Portugal.", e: "Visible between 1:10,000,000 and 1:1,000.", lim: "This is the 2nd-cycle mapping; the plan in force may still use an older one.", ex: "Before asking the council for prior information, check whether the plot is in high hazard." } },
    cotas: {
      pt: { s: "Saber a que cota chega a água nos cenários de cheia estudados.", l: "Cada elemento tem a cota da cheia; clique para ver o valor.", d: "PGRI do 2.º ciclo.", c: "ARPSI.", e: "Aparece a partir da aproximação 10.", lim: "Cotas do modelo hidráulico da APA, não medições.", ex: "Comparar a cota de cheia com a cota do pavimento de uma casa." },
      en: { s: "Know the water level reached in the flood scenarios studied.", l: "Each feature carries a flood level; click to see the value.", d: "2nd-cycle flood risk plans.", c: "APSFR.", e: "Appears from zoom 10.", lim: "Levels from the APA hydraulic model, not measurements.", ex: "Compare the flood level with the floor level of a house." } },
    eventos: {
      pt: { s: "Memória do território: cheias que já aconteceram, a juntar às marcas de cheia.", l: "Cada ponto é um evento; o popup mostra a data e a origem.", d: "Avaliação preliminar do risco de inundação do 3.º ciclo (2028–2033), versão de consulta pública.", c: "Continente.", e: "Pontos.", lim: "Versão de consulta pública; registo incompleto antes dos anos 2000.", ex: "Ver se a ribeira junto ao monte já saiu do leito em anos recentes." },
      en: { s: "The land's memory: floods that have already happened, alongside the flood marks.", l: "Each point is an event; the popup shows the date and source.", d: "3rd-cycle preliminary flood risk assessment (2028–2033), public consultation version.", c: "Mainland Portugal.", e: "Points.", lim: "Public consultation version; records are incomplete before the 2000s.", ex: "Check whether the stream by the farmhouse has burst its banks in recent years." } },
    arpsi3: {
      pt: { s: "Ver onde a APA propõe estudar o risco de cheia no próximo ciclo.", l: "Polígonos das áreas propostas.", d: "APRI do 3.º ciclo, consulta pública.", c: "Continente.", e: "Polígonos.", lim: "Proposta, não aprovada.", ex: "Uma junta de freguesia vê se a sua ribeira entra no próximo ciclo de estudo." },
      en: { s: "See where APA proposes to study flood risk in the next cycle.", l: "Polygons of the proposed areas.", d: "3rd-cycle preliminary assessment, public consultation.", c: "Mainland Portugal.", e: "Polygons.", lim: "Proposal, not approved.", ex: "A parish council checks whether its stream is in the next study cycle." } },
    alb: {
      pt: { s: "Perceber que reservas públicas existem na bacia e quanto escoa em média.", l: "Clique no ponto da barragem para ver a ficha: cota do coroamento, NPA, NMC, volume, área inundada, ano, escoamento médio.", d: "Atlas da Água (SNIRH); data por confirmar.", c: "Albufeiras da rede de monitorização do continente.", e: "Pontos.", lim: "Não inclui pequenas barragens nem charcas privadas; valores de escoamento são médias de longo prazo.", ex: "Ver o volume útil da albufeira a jusante antes de dimensionar uma charca." },
      en: { s: "See which public reservoirs exist in the basin and how much runs off on average.", l: "Click a dam point for its record: crest level, full supply level, minimum level, volume, flooded area, year, mean runoff.", d: "Water Atlas (SNIRH); date to be confirmed.", c: "Reservoirs in the mainland monitoring network.", e: "Points.", lim: "Small dams and private ponds are not included; runoff values are long-term averages.", ex: "Check the live storage of the reservoir downstream before sizing a pond." } },
    albbac: {
      pt: { s: "Ver o território que alimenta cada albufeira monitorizada.", l: "Polígono da bacia drenante de cada albufeira SNIRH.", d: "Atlas da Água (SNIRH).", c: "Continente.", e: "Pequena e média escala.", lim: "Só as albufeiras da rede SNIRH.", ex: "Saber se um terreno drena para uma albufeira de abastecimento público." },
      en: { s: "See the land that feeds each monitored reservoir.", l: "Catchment polygon of each SNIRH reservoir.", d: "Water Atlas (SNIRH).", c: "Mainland Portugal.", e: "Small to medium scale.", lim: "Only SNIRH network reservoirs.", ex: "Find out whether a plot drains into a public-supply reservoir." } },
    precmax: {
      pt: { s: "Dimensionar descarregadores, valas e passagens hidráulicas com a chuva mais forte de um dia.", l: "Classes de precipitação máxima diária anual (mm); clique para ver o intervalo.", d: "Atlas da Água; período da normal por confirmar.", c: "Continente.", e: "Pequena escala.", lim: "Normal antiga; não reflecte as alterações climáticas recentes.", ex: "Escolher a secção do descarregador de uma charca." },
      en: { s: "Size spillways, ditches and culverts with the heaviest one-day rainfall.", l: "Classes of maximum daily rainfall (mm); click to see the range.", d: "Water Atlas; reference period to be confirmed.", c: "Mainland Portugal.", e: "Small scale.", lim: "Old climate normal; does not reflect recent climate change.", ex: "Choose the spillway section of a pond." } },
    coef: {
      pt: { s: "Estimar que parte da chuva de uma cheia de 100 anos escorre à superfície.", l: "Classes de coeficiente (0 a 1): mais alto, mais escoamento.", d: "Atlas da Água.", c: "Continente.", e: "Pequena escala; só para enquadramento.", lim: "Não substitui o cálculo com o solo e o declive do próprio terreno.", ex: "Primeira estimativa do caudal que chega a um açude." },
      en: { s: "Estimate how much of a 100-year storm runs off at the surface.", l: "Coefficient classes (0 to 1): higher means more runoff.", d: "Water Atlas.", c: "Mainland Portugal.", e: "Small scale; for context only.", lim: "Does not replace a calculation with the plot's own soil and slope.", ex: "First estimate of the flow reaching a weir." } },
    clima: {
      pt: { s: "Enquadrar a escolha de espécies, a época de geadas e o balanço de água de uma charca.", l: "Cada cor é uma classe; o popup mostra o intervalo.", d: "Atlas do Ambiente: cartas nacionais publicadas em papel ao longo de mais de 30 anos; data de cada carta por confirmar.", c: "Continente.", e: "Ordem de 1:1 000 000.", lim: "Pequena escala e normais antigas: não reflectem as alterações climáticas recentes nem o microclima de um vale.", ex: "Ver se a zona tem geadas tardias antes de plantar amendoeiras." },
      en: { s: "Frame species choice, the frost season and the water balance of a pond.", l: "Each colour is a class; the popup shows the range.", d: "Environment Atlas: national maps published on paper over more than 30 years; date of each map to be confirmed.", c: "Mainland Portugal.", e: "Around 1:1,000,000.", lim: "Small scale and old normals: they do not reflect recent climate change or the microclimate of a valley.", ex: "Check for late frosts before planting almond trees." } },
    dphdem: {
      pt: { s: "Saber onde começa o domínio público e a servidão de passagem.", l: "A linha do leito separa a água da margem; a margem tem 50 m nas águas do mar e navegáveis, 30 m nas flutuáveis e 10 m nas restantes.", d: "Demarcação actualizada publicada pela APA.", c: "Sobretudo margens marítimas e estuarinas.", e: "Pormenor; aparece a partir da aproximação 11.", lim: "Nos rios do interior quase não há demarcação: vale a regra legal a partir da linha de água. Não substitui a delimitação oficial.", ex: "Ver onde passa a linha da margem junto a um terreno na ria." },
      en: { s: "Know where the public domain and the right of way begin.", l: "The bed line separates water from bank; the bank is 50 m on sea and navigable waters, 30 m on floatable waters and 10 m elsewhere.", d: "Updated demarcation published by APA.", c: "Mostly sea and estuary shores.", e: "Detailed; appears from zoom 11.", lim: "Inland rivers are rarely demarcated: the legal rule from the watercourse applies. Does not replace official delimitation.", ex: "See where the bank line runs next to a plot on the lagoon." } },
    dphautos: {
      pt: { s: "Ver onde houve processo oficial de delimitação do domínio hídrico.", l: "Vértices e poligonais dos autos publicados.", d: "Autos de delimitação publicados.", c: "Pontual.", e: "Pormenor; aparece a partir da aproximação 11.", lim: "Só onde houve processo de delimitação.", ex: "Confirmar se uma margem já foi delimitada antes de discutir uma vedação." },
      en: { s: "See where an official water domain delimitation took place.", l: "Vertices and boundary lines of the published records.", d: "Published delimitation records.", c: "Scattered.", e: "Detailed; appears from zoom 11.", lim: "Only where a delimitation process took place.", ex: "Check whether a bank has been delimited before discussing a fence." } },
    lagoas: {
      pt: { s: "Ver lagoas e lagos que são águas públicas, com o regime de protecção que isso implica.", l: "Polígonos das lagoas e lagos classificados.", d: "APA, conjunto de lagoas e lagos de águas públicas.", c: "Continente.", e: "Polígonos.", lim: "A zona reservada e a zona de protecção estão no tema Condicionantes (albufeiras e lagoas · zona reservada).", ex: "Ver se a lagoa junto ao terreno é água pública." },
      en: { s: "See lagoons and lakes that are public waters, with the protection regime that implies.", l: "Polygons of classified lagoons and lakes.", d: "APA, public lagoons and lakes dataset.", c: "Mainland Portugal.", e: "Polygons.", lim: "The reserved and protection zones are under Constraints (reservoirs and lagoons · reserved zone).", ex: "Check whether the lagoon next to the plot is a public water." } },
    poaap: {
      pt: { s: "Saber se um terreno está abrangido por um plano de ordenamento de albufeira.", l: "Mostra o âmbito do plano, não o zonamento interno.", d: "APA (POAAP).", c: "Albufeiras com plano.", e: "Polígonos.", lim: "Para as regras concretas é preciso ler o plano publicado.", ex: "Ver se uma casa junto ao Castelo do Bode está dentro do plano." },
      en: { s: "Know whether a plot is covered by a reservoir management plan.", l: "Shows the plan's extent, not its internal zoning.", d: "APA (POAAP).", c: "Reservoirs with a plan.", e: "Polygons.", lim: "Read the published plan for the actual rules.", ex: "Check whether a house by the Castelo do Bode reservoir is inside the plan." } },
    poc: {
      pt: { s: "Saber se um terreno junto à costa está numa faixa que condiciona construção ou alteração.", l: "Nível I é a faixa de maior perigo, nível II a de perigo a prazo mais longo; nas arribas, a faixa para terra mostra o recuo esperado.", d: "Programas da Orla Costeira de 2.ª geração (versões entre 2019 e 2022).", c: "Costa continental; Burgau a Vila Real de Santo António segue ainda as faixas do POOC.", e: "Pormenor; aparece a partir da aproximação 9.", lim: "Mostra as camadas indicadas como em vigor por troço no levantamento de 27/10; confirmar a versão no plano publicado.", ex: "Ver se um terreno sobre a arriba está na faixa de salvaguarda para terra." },
      en: { s: "Know whether a coastal plot lies in a strip that restricts building or change.", l: "Level I is the highest-hazard strip, level II the longer-term one; on cliffs, the landward strip shows the expected retreat.", d: "2nd-generation coastal programmes (versions from 2019 to 2022).", c: "Mainland coast; Burgau to Vila Real de Santo António still follows the older POOC strips.", e: "Detailed; appears from zoom 9.", lim: "Shows the layers listed as in force per stretch in the 27/10 survey; confirm the version in the published plan.", ex: "Check whether a clifftop plot is in the landward safeguard strip." } },
    estado: {
      pt: { s: "Perceber a qualidade da água que passa ou está por baixo de um terreno e os objectivos que a APA fixou.", l: "Verde é bom, vermelho é inferior a bom; o estado global é o pior entre o ecológico e o químico.", d: "PGRH do 3.º ciclo (RCM n.º 62/2024).", c: "Rios, albufeiras, águas de transição, costeiras e subterrâneas do continente.", e: "Um valor por massa de água.", lim: "Não diz nada sobre um poço ou uma nascente concretos.", ex: "Ver se o aquífero por baixo de uma exploração está em mau estado químico." },
      en: { s: "Understand the quality of the water flowing past or beneath a plot, and APA's objectives.", l: "Green is good, red is less than good; overall status is the worse of ecological and chemical.", d: "3rd-cycle river basin management plans (RCM 62/2024).", c: "Rivers, reservoirs, transitional, coastal and ground waters of mainland Portugal.", e: "One value per water body.", lim: "Says nothing about a particular well or spring.", ex: "Check whether the aquifer beneath a farm is in poor chemical status." } },
    press: {
      pt: { s: "Perceber a pressão que a bacia já tem e justificar práticas regenerativas.", l: "Cores mais intensas indicam mais kg por ano.", d: "PGRH do 3.º ciclo.", c: "Continente, por massa de água.", e: "Polígono por massa de água.", lim: "Estimativas por massa de água, não medições por exploração.", ex: "Mostrar a um financiador que a bacia tem carga de azoto alta." },
      en: { s: "Understand the pressure the basin already carries and make the case for regenerative practice.", l: "Stronger colours mean more kg per year.", d: "3rd-cycle river basin management plans.", c: "Mainland Portugal, per water body.", e: "Polygon per water body.", lim: "Estimates per water body, not measurements per farm.", ex: "Show a funder that the basin has a high nitrogen load." } },
    pressvol: {
      pt: { s: "Ver quanta água a agricultura e a pecuária já tiram de cada massa de água.", l: "Volumes estimados em hm³ por ano; cores mais intensas, mais volume.", d: "PGRH do 3.º ciclo.", c: "Continente, por massa de água.", e: "Polígono por massa de água.", lim: "Estimativas da APA a partir de áreas e consumos tipo.", ex: "Avaliar se faz sentido pedir uma nova captação." },
      en: { s: "See how much water farming and livestock already take from each water body.", l: "Estimated volumes in hm³ per year; stronger colours, more volume.", d: "3rd-cycle river basin management plans.", c: "Mainland Portugal, per water body.", e: "Polygon per water body.", lim: "APA estimates from areas and typical consumption.", ex: "Judge whether it makes sense to apply for a new abstraction." } },
    estqual: {
      pt: { s: "Encontrar a estação mais próxima com medições de qualidade da água.", l: "Cada ponto é uma estação; as séries estão no SNIRH.", d: "Rede de monitorização da APA.", c: "Continente.", e: "Pontos.", lim: "As séries não são mostradas aqui.", ex: "Procurar dados de nitratos a jusante de uma zona agrícola." },
      en: { s: "Find the nearest station measuring water quality.", l: "Each point is a station; the time series are on SNIRH.", d: "APA monitoring network.", c: "Mainland Portugal.", e: "Points.", lim: "Time series are not shown here.", ex: "Look for nitrate data downstream of a farming area." } },
    aia: {
      pt: { s: "Saber que grandes projectos (solar, estradas, regadio, pedreiras) estão ou estiveram previstos perto.", l: "O popup mostra o projecto, a tipologia, a fase e o sentido da decisão.", d: "APA, serviço AIA_externo.", c: "Continente.", e: "Polígonos da área submetida.", lim: "O contorno é o da área submetida, que pode ter mudado depois. Serviço com descrição interna de teste: a APA tem de confirmar a utilização.", ex: "Ver se há uma central solar prevista ao lado de um terreno à venda." },
      en: { s: "Find out which large projects (solar, roads, irrigation, quarries) are or were planned nearby.", l: "The popup shows the project, type, stage and outcome of the decision.", d: "APA, AIA_externo service.", c: "Mainland Portugal.", e: "Polygons of the submitted area.", lim: "The outline is the submitted area, which may have changed since. The service carries an internal test description: APA must confirm its use.", ex: "Check whether a solar plant is planned next to a plot for sale." } },
    seveso: {
      pt: { s: "Planeamento de emergência e enquadramento de usos sensíveis.", l: "Pontos dos estabelecimentos de nível superior e inferior.", d: "APA (DL n.º 150/2015).", c: "Nacional.", e: "Pontos.", lim: "Mostra a localização, não as zonas de perigo.", ex: "Ver se há um estabelecimento Seveso perto de uma escola." },
      en: { s: "Emergency planning and siting of sensitive uses.", l: "Points for upper and lower tier establishments.", d: "APA (Decree-Law 150/2015).", c: "National.", e: "Points.", lim: "Shows location, not hazard zones.", ex: "Check whether a Seveso establishment is close to a school." } },
    ruido: {
      pt: { s: "Escolher onde pôr habitação ou turismo e ler o contexto de uma propriedade.", l: "Níveis Lden e Ln por classes.", d: "Mapas municipais entregues à APA.", c: "Só onde o município entregou o mapa.", e: "Polígonos.", lim: "Por activar: o teste de 27/10 devolveu imagens vazias.", ex: "" },
      en: { s: "Choose where to put housing or tourism and read a property's context.", l: "Lden and Ln levels by class.", d: "Municipal maps delivered to APA.", c: "Only where the municipality has delivered a map.", e: "Polygons.", lim: "Not active yet: the 27/10 test returned empty images.", ex: "" } }
  };
  var GN = { pt: { agua: "Água", cond: "Condicionantes", nat: "Natureza e clima", amb: "Ambiente e actividades" }, en: { agua: "Water", cond: "Constraints", nat: "Nature and climate", amb: "Environment and activities" } };
  function ficha(d, l) {
    var F = (FAM[d.fam] || FAM.clima)[l], cit = CIT[l].replace("{s}", d.svc.split("/").pop());
    var est = d.off ? (l === "pt" ? "previsto" : "planned") : (l === "pt" ? "disponível" : "available");
    return { id: d.id, n: l === "pt" ? d.n : d.en, g: GN[l][d.g] + " · " + (l === "pt" ? d.sub : d.subEn) + (d.niv === "i" ? " · Intelligence" : ""),
      o: (l === "pt" ? d.n : d.en) + ". " + (l === "pt" ? "Camada " : "Layer ") + d.ids + (l === "pt" ? " do serviço " : " of service ") + d.svc + ".",
      s: F.s, l: F.l, f: cit, d: F.d, c: F.c, e: F.e, lim: F.lim, ex: F.ex || "", est: est, porConfirmar: [] };
  }
  function fichas() {
    var F = window.IPR_FICHAS; if (!F) return false;
    var l = lg(); CAM.forEach(function (c) { F[c[0]] = ficha(DEF[c[0]], l); });
    return true;
  }
  (function vez() { if (!fichas()) setTimeout(vez, 800); })();
  document.addEventListener("ipr:lingua", function () { try { fichas(); } catch (e) {} });

  // §A3 Legendas no mapa. A caixa do §71 mostra, para as camadas sem classes, só a cor e o nome. Para as camadas da APA juntadas
  // aqui (e as já existentes do tema), lê-se a legenda oficial do ArcGIS (/legend?f=json, CORS aberto) e as imagens de cada
  // classe substituem a linha simples. Uma leitura por serviço e por sessão; se falhar, fica a linha do §71.
  var LEG = {}, SVC = {};
  function lerJson(u) { return fetch(u, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
  function legendaServico(url) { return LEG[url] || (LEG[url] = lerJson(url + "/legend?f=json").catch(function () { delete LEG[url]; return null; })); }
  function servico(url) { return SVC[url] || (SVC[url] = lerJson(url + "?f=json").catch(function () { delete SVC[url]; return null; })); }
  function idsDe(e) { var m = /show:([\d,]+)/.exec(e.layers || ""); return m ? m[1].split(",").map(Number) : null; }
  function entradas(e) {
    return legendaServico(e.url).then(function (j) {
      if (!j || !j.layers) return [];
      var quer = idsDe(e), por = {}; j.layers.forEach(function (x) { por[x.layerId] = x; });
      function junta(ids) { var out = [], vistos = {}; ids.forEach(function (id) { var x = por[id]; if (!x) return; (x.legend || []).forEach(function (g) { var k = g.label + "|" + g.imageData; if (vistos[k]) return; vistos[k] = 1; out.push({ t: g.label || x.layerName || "", img: "data:" + (g.contentType || "image/png") + ";base64," + g.imageData }); }); }); return out; }
      if (!quer) return junta(j.layers.map(function (x) { return x.layerId; }));
      var r = junta(quer); if (r.length) return r;
      // camadas de grupo: descer às subcamadas pelo descritor do serviço
      return servico(e.url).then(function (s) {
        if (!s || !s.layers) return [];
        var filhos = {}, todos = []; s.layers.forEach(function (x) { filhos[x.id] = x.subLayerIds || []; });
        (function desce(ids) { ids.forEach(function (i) { if ((filhos[i] || []).length) desce(filhos[i]); else todos.push(i); }); })(quer);
        return junta(todos);
      });
    });
  }
  function ehApa(e) { return e && e.t === "ags" && /sniambgeoogc\.apambiente\.pt/.test(e.url || ""); }
  function pintarLegenda() {
    var box = document.getElementById("ipr-lgd"); if (!box || box.hidden) return;
    var c = box.querySelector(".c"); if (!c) return;
    var C = catIdx(), ids = activas().filter(function (id) { var e = C[id], g = e && (e.g || e.grupo); return e && g !== "fundo" && g !== "ref" && g !== "base"; });
    if (c.children.length !== ids.length) return;
    var en = lg() === "en";
    ids.forEach(function (id, i) {
      var e = C[id], el = c.children[i]; if (!ehApa(e) || (e.leg && e.leg.length > 1) || !el || el.getAttribute("data-ag")) return;
      el.setAttribute("data-ag", id);
      entradas(e).then(function (L) {
        if (!L.length || !el.isConnected) return;
        var nome = esc((en && e.en) || e.n || id), mais = L.length > 10 ? '<div class="ag-n">' + (en ? "+ " + (L.length - 10) + " more classes (see layer record)" : "+ " + (L.length - 10) + " classes (ver ficha da camada)") + "</div>" : "";
        el.className = "l ag-l"; el.innerHTML = "<b>" + nome + "</b>" + L.slice(0, 10).map(function (x) { return '<div class="ag-r"><img alt="" src="' + esc(x.img) + '"><span>' + esc(x.t) + "</span></div>"; }).join("") + mais;
      }).catch(function () {});
    });
  }
  (function liga() {
    var box = document.getElementById("ipr-lgd");
    if (!box) { setTimeout(liga, 1500); return; }
    new MutationObserver(function () { clearTimeout(liga.t); liga.t = setTimeout(pintarLegenda, 30); }).observe(box, { childList: true });
    pintarLegenda();
  })();

  // §A4 Tema IPR «Água no terreno». O T62 do ajustes.js é interno; o tema entra no painel #ipr-t62 pelo lado de fora: um botão
  // a mais na grelha dos temas e uma secção com as mesmas classes do §62 (caixas data-c62, ferramentas data-f62 e produto
  // data-p62 continuam a ser tratados pelo ajustes.js). O estado guarda-se em ipr_ag_tema. Quando se escolhe outro tema, este sai.
  var T = {
    pt: {
      nome: "Água no terreno", sub: "Escolha o que quer ver. Cada tema liga as camadas certas e explica o que está no mapa.",
      ver: "Rede hidrográfica, linhas de água com bacia acima de 350 ha, albufeiras públicas e da rede SNIRH, zonas inundáveis e pontos de água DFCI, por cima do relevo. Abaixo, as cheias por período de retorno, a hidrologia do solo, o clima e as águas subterrâneas, para enquadrar uma charca, um açude ou uma captação.",
      aviso: "Contexto indicativo. Não substitui estudos técnicos nem decisões de licenciamento (APA, CCDR, município).",
      oQueVe: "O que está a ver", legenda: "Legenda", camadas: "Camadas do tema", ferramentas: "Ferramentas", produto: "Produto ligado", sair: "Sair do tema",
      g_cheias: "Cheias", g_arm: "Armazenamento e captações", g_solo: "Solo, chuva e escoamento", g_sub: "Águas subterrâneas",
      tranc: "Intelligence", trancT: "Camada do Intelligence. Abre com qualquer serviço contratado ou por assinatura.", porActivar: "por activar", ficha: "Ficha da camada",
      fechadas: "{n} camadas deste tema são do Intelligence e estão fechadas.",
      lgA: "Linhas de água", lgB: "Albufeiras", lgC: "Zona inundável (T = 100)", lgD: "Pontos de água DFCI",
      chT: "Charcas e pequenas barragens: o que diz a APA",
      ch: ["<b>Charca</b>: escavação para guardar água. Fora das margens das linhas de água da carta militar 1:25 000, fora da faixa de 10 m do leito e impermeabilizada (natural ou artificialmente), a APA considera-a não sujeita a licenciamento; para candidaturas a fundos pede-se parecer de dispensa.",
        "Se for alimentada por águas subterrâneas, é tratada como captação (poço). Na margem, impermeabilizada e sem captação, é construção no domínio hídrico; enchida por bombagem de um rio, precisa também de título de captação superficial.",
        "<b>Barragem ou açude</b>: no leito e na margem da linha de água. Autorização se represa águas particulares, licença se represa águas públicas; o título da barragem não dá direito a captar. Aplica-se o Regulamento de Pequenas Barragens (DL n.º 21/2018) e pode haver AIA.",
        "<b>Captações subterrâneas novas</b>: só por autorização; 100 m entre captações de utilizadores diferentes, salvo outro valor da ARH.",
        "As linhas de água que a APA usa são as da carta militar 1:25 000; as do LiDAR podem mostrar mais (ou menos)."],
      chF: "Fonte: APA, apresentação geral à CAP, 01/02/2023; DL n.º 21/2018. Resumo em propostas/ipr-ideias/03-apa-camadas.md, secção 5.",
      pf: "Perfil inicial", pf0: "Nenhum", pf_agua: "Água", pf_pc: "Protecção Civil", pfT: "O perfil abre o Atlas com um tema, camadas e ferramentas próprios. Fica guardado neste navegador.",
      pfAviso_agua: "Perfil Água: as análises são indicativas. Não substituem estudos técnicos, projecto nem licenciamento (APA, CCDR, DGADR, Município). A falta de dados nunca significa facilidade.",
      pfAviso_pc: "Perfil Protecção Civil: fogo, pontos de água, acessos e cheias. Informação de apoio; prevalecem os planos de emergência e a informação oficial."
    },
    en: {
      nome: "Water on the land", sub: "Choose what you want to see. Each theme turns on the right layers and explains what is on the map.",
      ver: "River network, watercourses draining more than 350 ha, public and SNIRH reservoirs, flood areas and wildfire water points, on top of the terrain. Below are floods by return period, soil hydrology, climate and groundwater, to frame a pond, a weir or a borehole.",
      aviso: "Indicative context. It does not replace technical studies or licensing decisions (APA, CCDR, municipality).",
      oQueVe: "What you are looking at", legenda: "Legend", camadas: "Layers in this theme", ferramentas: "Tools", produto: "Related product", sair: "Leave theme",
      g_cheias: "Floods", g_arm: "Storage and abstractions", g_solo: "Soil, rain and runoff", g_sub: "Groundwater",
      tranc: "Intelligence", trancT: "Intelligence layer. Unlocked with any service you order from us, or by subscription.", porActivar: "not active yet", ficha: "Layer record",
      fechadas: "{n} layers in this theme belong to Intelligence and are locked.",
      lgA: "Watercourses", lgB: "Reservoirs", lgC: "Flood area (100-year)", lgD: "Wildfire water points",
      chT: "Ponds and small dams: what APA says",
      ch: ["<b>Pond</b>: an excavation to store water. Outside the banks of the watercourses on the 1:25,000 military map, outside the 10 m strip from the bed and sealed (naturally or artificially), APA considers it exempt from licensing; for grant applications an exemption opinion is requested.",
        "If fed by groundwater it is treated as an abstraction (well). On a bank, sealed and without abstraction, it is a construction in the water domain; if filled by pumping from a river it also needs a surface abstraction permit.",
        "<b>Dam or weir</b>: built in the bed and bank of a watercourse. Authorisation if it impounds private water, licence if it impounds public water; the dam permit gives no right to abstract. The Small Dams Regulation (Decree-Law 21/2018) applies and an EIA may be required.",
        "<b>New boreholes</b>: by authorisation only; 100 m between abstractions of different users, unless the river basin authority sets another distance.",
        "The watercourses APA uses are those of the 1:25,000 military map; LiDAR-derived lines may show more (or fewer)."],
      chF: "Source: APA, general presentation to CAP, 01/02/2023; Decree-Law 21/2018. Summary in propostas/ipr-ideias/03-apa-camadas.md, section 5.",
      pf: "Starting profile", pf0: "None", pf_agua: "Water", pf_pc: "Civil Protection", pfT: "A profile opens the Atlas with its own theme, layers and tools. It is saved in this browser.",
      pfAviso_agua: "Water profile: analyses are indicative. They do not replace technical studies, design or licensing (APA, CCDR, DGADR, municipality). Missing data never means it is easy.",
      pfAviso_pc: "Civil Protection profile: fire, water points, access and floods. Support information; emergency plans and official information prevail."
    }
  };
  function t(k, v) { var s = T[lg()][k]; if (s == null) s = T.pt[k]; if (s == null) s = k; if (v) Object.keys(v).forEach(function (x) { s = String(s).split("{" + x + "}").join(v[x]); }); return s; }
  var TEMA = {
    id: "agua_terreno", ic: "M12 3c-3 5-6 8.5-6 12a6 6 0 0 0 12 0c0-3.5-3-7-6-12zM9 15a3 3 0 0 0 3 3", fundo: "f_relevo",
    c: ["r_somb", "hidro", "la350", "albpub", "alb_snirh", "inund100", "icnfpa"],
    grupos: [["g_cheias", ["inund20", "inund1000", "perigo_igt", "cotas_cheia", "eventos_cheia", "arpsi3", "cheia_prof100", "cheia_per100"]],
      ["g_arm", ["alb_bacia", "capt_p", "dph", "wei"]],
      ["g_solo", ["scs", "cn", "esc_med", "precip", "precmax", "etr", "coef_esc"]],
      ["g_sub", ["aquif", "ma_quant"]]],
    leg: [["lgA", "#2b7bb9", "linha"], ["lgB", "#4fc3f7", "area"], ["lgC", "#1976d2", "area"], ["lgD", "#e65100", "ponto"]],
    ferr: ["perfil", "3d", "area", "regua", "historico"], prod: "base"
  };
  function todasDoTema() { var l = TEMA.c.slice(); TEMA.grupos.forEach(function (g) { l = l.concat(g[1]); }); return l; }
  var EST = { tema: ler("ipr_ag_tema") === TEMA.id ? TEMA.id : null, abertos: {} };
  var CAD = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function estado(id, C) {
    var e = C[id], d = DEF[id];
    if (d && d.off) return "srv";
    if (!e) return d && d.niv === "i" && EXPL ? "tranc" : "fora";
    if (EXPL && e.lic === "r") return "fora";
    if (EXPL && /^(cond|agua|solo|fogo)$/.test(e.g) && e.lic === "v" && !/Pré-visualização/.test(String(e.sub || ""))) return "tranc";
    return "ok";
  }
  function nome(id, C) { var e = C[id], d = DEF[id], en = lg() === "en"; if (e) return en && e.en ? e.en : e.n; if (d) return en ? d.en : d.n; return id; }
  function linha(id, C) {
    var st = estado(id, C); if (st === "fora") return "";
    var nm = esc(nome(id, C)), on = activas().indexOf(id) >= 0;
    var fi = window.IPR_FICHAS && window.IPR_FICHAS[id] ? '<button type="button" class="ag-i" data-ipr-ficha="' + id + '" title="' + esc(t("ficha")) + '" aria-label="' + esc(t("ficha") + " · " + nome(id, C)) + '">i</button>' : "";
    if (st === "tranc") return '<div class="ipr-t62-l tranc" title="' + esc(t("trancT")) + '"><span class="cad">' + CAD + "</span><span>" + nm + "</span><em>" + esc(t("tranc")) + "</em></div>";
    if (st === "srv") return '<div class="ipr-t62-l srv"><span>' + nm + "</span><em>" + esc(t("porActivar")) + "</em></div>";
    return '<div class="ipr-t62-l"><label><input type="checkbox" data-c62="' + id + '"' + (on ? " checked" : "") + "> <span>" + nm + "</span></label>" + fi + "</div>";
  }
  function seccao() {
    var C = catIdx(), fech = 0;
    todasDoTema().forEach(function (id) { if (estado(id, C) === "tranc") fech++; });
    var h = '<section class="ipr-t62-c ipr-ag-c" aria-label="' + esc(t("nome")) + '"><div class="ipr-t62-ct"><b>' + esc(t("nome")) + '</b><button type="button" class="ipr-t62-x" data-agsair>' + esc(t("sair")) + "</button></div>";
    h += '<div class="ipr-t62-ver"><span class="ipr-t62-h">' + esc(t("oQueVe")) + "</span><p>" + esc(t("ver")) + "</p></div>";
    h += '<p class="ipr-t62-dr">' + esc(t("aviso")) + "</p>";
    h += '<div class="ipr-t62-leg"><span class="ipr-t62-h">' + esc(t("legenda")) + "</span>" + TEMA.leg.map(function (l) { return '<span class="lg"><i class="' + l[2] + '" style="--c:' + l[1] + '"></i>' + esc(t(l[0])) + "</span>"; }).join("") + "</div>";
    h += '<div class="ipr-t62-cs"><span class="ipr-t62-h">' + esc(t("camadas")) + "</span>" + TEMA.c.map(function (id) { return linha(id, C); }).join("");
    TEMA.grupos.forEach(function (g) {
      var hh = g[1].map(function (id) { return linha(id, C); }).join(""), n = (hh.match(/class="ipr-t62-l/g) || []).length; if (!n) return;
      h += '<details data-agd="' + g[0] + '"' + (EST.abertos[g[0]] ? " open" : "") + "><summary>" + esc(t(g[0])) + " <i>" + n + "</i></summary>" + hh + "</details>";
    });
    h += '<details class="ag-ch" data-agd="ch"' + (EST.abertos.ch ? " open" : "") + "><summary>" + esc(t("chT")) + "</summary>" + t("ch").map(function (p) { return "<p>" + p + "</p>"; }).join("") + '<p class="ipr-t62-lic">' + esc(t("chF")) + "</p></details>";
    h += "</div>";
    if (fech) h += '<p class="ipr-t62-n">' + CAD + " " + esc(t("fechadas", { n: fech })) + "</p>";
    var L62 = window.__iprLingua; function t62(k) { try { return L62.t(k); } catch (e) { return k; } }
    h += '<div class="ipr-t62-f"><span class="ipr-t62-h">' + esc(t("ferramentas")) + "</span>" + TEMA.ferr.map(function (f) { return '<button type="button" data-f62="' + f + '">' + esc(t62("f_" + f)) + "</button>"; }).join("") + "</div>";
    h += '<div class="ipr-t62-p"><span class="ipr-t62-h">' + esc(t("produto")) + '</span><button type="button" data-p62="' + TEMA.prod + '"><b>' + esc(t62("p_" + TEMA.prod)) + "</b><small>" + esc(t62("pr_" + TEMA.prod)) + "</small></button>";
    if (fech) h += '<button type="button" class="sec" data-p62="intel"><b>' + CAD + " " + esc(t62("p_intel")) + "</b></button>";
    return h + "</div></section>";
  }
  function seletorPerfil() {
    var p = perfilGuardado();
    return '<div class="ipr-ag-pf" title="' + esc(t("pfT")) + '"><label><span>' + esc(t("pf")) + '</span><select data-agperfil>' +
      [["", "pf0"], ["agua", "pf_agua"], ["pc", "pf_pc"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === p ? " selected" : "") + ">" + esc(t(o[1])) + "</option>"; }).join("") + "</select></label></div>";
  }
  var A_INJ = false;
  function injetar() {
    var w = document.getElementById("ipr-t62"); if (!w || A_INJ) return;
    A_INJ = true;
    try {
      var g = w.querySelector(".ipr-t62-g"); if (!g) return;
      var outra = w.querySelector(".ipr-t62-c:not(.ipr-ag-c)");
      if (outra && EST.tema) { EST.tema = null; gravar("ipr_ag_tema", null); }
      var b = g.querySelector('[data-agt="' + TEMA.id + '"]');
      if (!b) {
        b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "listitem"); b.setAttribute("data-agt", TEMA.id);
        g.appendChild(b);
      }
      var n = g.querySelectorAll("button").length;
      b.innerHTML = '<span class="tp"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + TEMA.ic + '"/></svg><i>' + n + '</i></span><span class="n">' + esc(t("nome")) + "</span>";
      b.setAttribute("lang", lg()); b.setAttribute("aria-pressed", String(EST.tema === TEMA.id));
      var sub = w.querySelector(".ipr-t62-sub"), sec = w.querySelector(".ipr-ag-c");
      if (EST.tema === TEMA.id) {
        g.classList.add("cmp"); if (sub) sub.style.display = "none";
        [].forEach.call(g.querySelectorAll("[data-t62]"), function (x) { x.setAttribute("aria-pressed", "false"); });
        var novo = document.createElement("div"); novo.innerHTML = seccao(); novo = novo.firstChild;
        if (sec) sec.parentNode.replaceChild(novo, sec); else g.parentNode.insertBefore(novo, g.nextSibling);
      } else {
        if (sec) sec.parentNode.removeChild(sec);
        if (!outra) { g.classList.remove("cmp"); if (sub) sub.style.display = ""; }
      }
      var pf = w.querySelector(".ipr-ag-pf"), novoPf = document.createElement("div"); novoPf.innerHTML = seletorPerfil(); novoPf = novoPf.firstChild;
      var todas = w.querySelector(".ipr-t62-todas");
      if (pf) pf.parentNode.replaceChild(novoPf, pf); else if (todas) w.insertBefore(novoPf, todas); else w.appendChild(novoPf);
    } finally { setTimeout(function () { A_INJ = false; }, 0); }
  }
  function desligarNovas() { var R2 = viz(); if (!R2) return; activas().forEach(function (id) { if (DEF[id]) try { R2.ligar(id, false); } catch (e) {} }); }
  function aplicarTema() {
    var R2 = viz(); if (!R2) return false;
    var w = document.getElementById("ipr-t62"), sairOutra = w && w.querySelector(".ipr-t62-c:not(.ipr-ag-c) [data-t62sair]");
    if (sairOutra) sairOutra.click();
    EST.tema = TEMA.id; gravar("ipr_ag_tema", TEMA.id);
    var C = catIdx(), quer = {};
    TEMA.c.forEach(function (id) { if (estado(id, C) === "ok") quer[id] = 1; });
    activas().forEach(function (id) {
      var e = C[id]; if (!e || quer[id] || /^l_/.test(id) || /^f_/.test(id)) return;
      if (/^(cond|agua|solo|fogo|lidar|prop|ref|nat|amb)$/.test(e.g)) try { R2.ligar(id, false); } catch (x) {}
    });
    Object.keys(quer).forEach(function (id) { try { if (activas().indexOf(id) < 0) R2.ligar(id, true); } catch (x) {} });
    try { R2.fundo(TEMA.fundo); } catch (x) {}
    injetar();
    var s = document.querySelector(".ipr-ag-c"); if (s) try { s.scrollIntoView({ block: "nearest" }); } catch (x) {}
    return true;
  }
  function sairTema() { EST.tema = null; gravar("ipr_ag_tema", null); desligarNovas(); injetar(); }
  function prepararPainel() {
    var w = document.getElementById("ipr-t62"); if (!w) return false;
    if (w.__ag) return true; w.__ag = 1;
    new MutationObserver(function () { if (!A_INJ) injetar(); }).observe(w, { childList: true });
    // fase de captura: corre antes do ouvinte do ajustes.js no mesmo #ipr-t62
    w.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-agt],[data-agsair],[data-t62]");
      if (!b) return;
      if (b.hasAttribute("data-agt")) { e.stopPropagation(); if (EST.tema === TEMA.id) sairTema(); else aplicarTema(); return; }
      if (b.hasAttribute("data-agsair")) { e.stopPropagation(); sairTema(); return; }
      if (b.hasAttribute("data-t62") && EST.tema) { EST.tema = null; gravar("ipr_ag_tema", null); desligarNovas(); }
    }, true);
    w.addEventListener("toggle", function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute("data-agd")) EST.abertos[d.getAttribute("data-agd")] = d.open ? 1 : 0; }, true);
    w.addEventListener("change", function (e) {
      var s = e.target.closest && e.target.closest("[data-agperfil]"); if (!s) return;
      var v = s.value; gravar("ipr_perfil", v || null); if (v) aplicarPerfil(v, true);
    });
    document.addEventListener("ipr:lingua", function () { setTimeout(injetar, 0); });
    setInterval(function () {
      if (!EST.tema || document.hidden) return;
      var on = activas(); document.querySelectorAll(".ipr-ag-c [data-c62]").forEach(function (c) { var x = on.indexOf(c.getAttribute("data-c62")) >= 0; if (c.checked !== x) c.checked = x; });
    }, 1500);
    injetar();
    if (EST.tema === TEMA.id && !w.querySelector(".ipr-t62-c:not(.ipr-ag-c)")) { var R2 = viz(); if (R2) injetar(); }
    return true;
  }

  // §A5 Perfis iniciais «Água» e «Protecção Civil» (modelo do §68: tema, camadas ligadas, ferramentas, centro). Escolhem-se por
  // ?perfil=agua ou ?perfil=pc, ou no selector discreto do painel dos temas; ficam em ipr_perfil (neste navegador). Aplicam-se
  // uma vez por sessão, e não quando o endereço pede outro sítio (?mapa=, ?org_camada=, ?ll=) nem quando há perfil municipal
  // do §68 (window.IPR_PERFIL_ORG). Por agora não estão ligados a nenhuma conta.
  var PERFIS = {
    agua: { perfil: "agua", tema: TEMA.id, camadas: ["wei", "capt_p", "barragens", "ma_quant", "bac_troco", "press_vol", "coef_esc"], ferr: ["3d", "perfil", "area", "regua", "historico"],
      d3: true, centro: [-8.45, 37.62], zoom: 9 },
    pc: { perfil: "pc", tema: "fogo", camadas: ["perig_e", "ard15", "redeprim", "zif", "icnfpa", "o_caminhos", "concelhos", "inund100", "perigo_igt", "eventos_cheia", "marcas", "zadj", "seveso"],
      ferr: ["3d", "marcador", "gps", "qfield", "historico"], d3: false }
  };
  function perfilGuardado() {
    var m = /[?&]perfil=(agua|pc)\b/.exec(location.search);
    if (m) { gravar("ipr_perfil", m[1]); return m[1]; }
    var g = ler("ipr_perfil"); return PERFIS[g] ? g : "";
  }
  function aviso(txt) {
    var a = document.getElementById("ipr-ag-av");
    if (!a) { a = document.createElement("div"); a.id = "ipr-ag-av"; a.setAttribute("role", "status"); (document.getElementById("ipe") || document.body).appendChild(a); a.addEventListener("click", function () { a.classList.remove("on"); }); }
    a.textContent = txt; a.classList.add("on"); clearTimeout(a.__t); a.__t = setTimeout(function () { a.classList.remove("on"); }, 9000);
  }
  function aplicarPerfil(k, agora) {
    var P = PERFIS[k], R2 = viz(), M = mapa(); if (!P || !R2 || !M) return false;
    if (P.tema === TEMA.id) aplicarTema(); else { if (EST.tema) sairTema(); try { window.__iprTemas && window.__iprTemas.aplicar(P.tema); } catch (e) {} }
    var C = catIdx();
    P.camadas.forEach(function (id) { if (estado(id, C) === "ok") try { if (activas().indexOf(id) < 0) R2.ligar(id, true); } catch (e) {} });
    var b3 = document.querySelector('#ipe [data-tool="3d"]'), em3d = !!(window.__ipe && window.__ipe.estado && window.__ipe.estado.em3d);
    if (P.d3 && !em3d && b3) b3.click();
    if (P.centro) setTimeout(function () { try { M.easeTo({ center: P.centro, zoom: P.zoom || 9, duration: agora ? 900 : 0 }); } catch (e) {} }, 350);
    aviso(t("pfAviso_" + k));
    setTimeout(injetar, 400);
    return true;
  }
  function perfilArranque() {
    var k = perfilGuardado(); if (!k) return true;
    if (window.IPR_PERFIL_ORG || (window.IPR_PERFIL && window.IPR_PERFIL.municipal)) return true;
    if (/[?&](mapa|org_camada|ll)=/.test(location.search)) return true;
    var sess = null; try { sess = sessionStorage.getItem("ipr_perfil_sess"); } catch (e) {}
    if (sess === k && !/[?&]perfil=/.test(location.search)) return true;
    if (!viz() || !mapa() || !document.getElementById("ipr-t62")) return false;
    try { sessionStorage.setItem("ipr_perfil_sess", k); } catch (e) {}
    return aplicarPerfil(k, false);
  }

  // §A6 Estilos (usam as variáveis de cor do Atlas, claras ou escuras conforme o tema da página)
  (function () {
    if (document.getElementById("ipr-ag-css")) return;
    var st = document.createElement("style"); st.id = "ipr-ag-css";
    st.textContent =
      ".ipr-ag-c .ipr-t62-l .ag-i{flex:0 0 auto;width:20px;height:20px;border-radius:50%;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--mu,#9aa08f);font:600 11px/1 Georgia,serif;font-style:italic;cursor:pointer;padding:0}.ipr-ag-c .ipr-t62-l .ag-i:hover{border-color:var(--ac,#b5c46a);color:var(--tx,#e9eadf)}" +
      ".ipr-ag-c .ag-ch p{margin:6px 0 0;font-size:12px;line-height:1.5;color:var(--tx2,#cfd2c4)}.ipr-ag-c .ag-ch summary{text-transform:none;letter-spacing:0;font-size:12px}" +
      ".ipr-ag-pf{margin:8px 0 0;font-size:11.5px;color:var(--mu,#9aa08f)}.ipr-ag-pf label{display:flex;align-items:center;justify-content:space-between;gap:8px}.ipr-ag-pf select{font:12px Inter,sans-serif;padding:3px 6px;border-radius:7px;border:1px solid var(--ln,#2c312a);background:var(--p2,#1d221c);color:var(--tx,#e9eadf);min-height:28px;max-width:60%}" +
      "#ipr-lgd .ag-r{display:flex;align-items:center;gap:7px;margin:2px 0;color:var(--tx2,#cfd2c4)}#ipr-lgd .ag-r img{flex:0 0 auto;width:18px;height:auto;padding:1px;border-radius:2px;display:inline-block}#ipr-lgd .ag-n{font-size:11px;color:var(--mu,#9aa08f)}" +
      "#ipr-ag-av{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:100003;max-width:min(460px,calc(100vw - 32px));padding:10px 14px;border-radius:10px;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ac,#b5c46a);font:13px/1.45 Inter,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s}#ipr-ag-av.on{opacity:1;pointer-events:auto}";
    (document.head || document.documentElement).appendChild(st);
  })();

  // Arranque: espera pelo painel dos temas (§62) e pelo mapa; desiste ao fim de 2 minutos.
  var t0 = Date.now();
  (function vez() {
    var ok = false; try { ok = prepararPainel(); } catch (e) {}
    var okP = false; if (ok) try { okP = perfilArranque(); } catch (e) { okP = true; }
    if ((!ok || !okP) && Date.now() - t0 < 120000) setTimeout(vez, 700);
  })();

  window.__iprAgua = {
    camadas: CAM.map(function (c) { var d = DEF[c[0]]; return { id: d.id, nome: d.n, grupo: d.g, nivel: d.niv === "i" ? "Intelligence" : "Explorer", estado: d.off ? "por activar" : (NOVAS.indexOf(d.id) >= 0 ? "no catálogo" : "fora do catálogo neste nível") }; }),
    tema: function () { return aplicarTema(); }, perfil: function (k) { gravar("ipr_perfil", PERFIS[k] ? k : null); return aplicarPerfil(k, true); }, perfis: Object.keys(PERFIS)
  };
})();
