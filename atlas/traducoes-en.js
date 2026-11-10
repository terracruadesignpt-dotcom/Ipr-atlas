/* IPR Atlas · traduções EN em falta (Nuno, 10/11/2026, 23h09: «a versão portuguesa e a versão inglesa têm de estar
   integralmente perfeitas, todas as traduções»). Junta ao dicionário do §73c do ajustes.js (window.__ipr73c.dic):
   os textos da navegação nova do Bolito (nav2.js), das legendas, da ficha e do valor indicativo; os nomes, subtítulos
   e notas das camadas do catálogo sem versão inglesa (também postos em e.en, e.subEn, e.notaEn para quem os lê);
   e padrões com números, datas, estados de encomenda e decimais (12,77 ha → 12.77 ha), que vão entrando no dicionário
   à medida que aparecem, para o ajustes.js os pôr e repor ao voltar a PT. Não toca no português.
   Desligar: window.IPR_TREN_OFF = true. Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.IPR_TREN_OFF || W.__iprTrEn) return;
  var N = {"f_ortosat": "OrtoSat 2023 · 30 cm", "f_orto18": "Orthophotos 2018 · 25 cm", "f_s2jul": "Sentinel-2 · July 2025", "f_s2jan": "Sentinel-2 · January 2025", "f_s2out": "Sentinel-2 · Oct. 2025 · infrared (false colour)", "f_o25": "Orthophotos 2025 · 25 cm", "f_o21": "Orthophotos 2021 · northern half of the country", "f_o15": "Orthophotos 2015", "f_o10": "Orthophotos 2010", "f_o12": "Orthophotos 2012", "f_o07": "Orthophotos 2007", "f_o04": "Orthophotos 2004 to 2006", "f_o95": "Orthophotos 1995 · infrared (false colour)", "f_relevo": "Shaded relief", "f_mapa": "Map (OpenStreetMap)", "f_esri": "Esri · satellite image", "f_otm": "OpenTopoMap · relief and paths", "f_s2g": "Sentinel-2 · Iberia and world (cloudless)", "r_somb": "Shaded relief", "r_hipso": "Hypsometry (DGT)", "r_curvas": "Contour lines (DGT LiDAR, 1 to 50 m)", "r_cdgt": "Official contour lines (DGT, 25 m)", "r_cotas": "Spot heights (DGT)", "cad": "Land registry parcels", "bupi": "BUPi · georeferenced properties", "ifap_p": "IFAP · agricultural parcels", "ifap_o": "IFAP · parcel land use", "distritos": "Districts", "concelhos": "Municipalities", "caop": "Parishes", "crus": "PDM · land classification (CRUS)", "pdm_0202": "Constraints plan · Almodôvar", "pdm_0605": "Constraints plan · Figueira da Foz", "pdm_1201": "Constraints plan · Alter do Chão", "ren": "REN (National Ecological Reserve)", "ran": "RAN (National Agricultural Reserve)", "n2k": "Natura 2000 network", "rnap": "Protected areas", "arv": "Trees of public interest", "perig_e": "Structural wildfire hazard 2020–2030", "perig": "Short-term wildfire hazard 2026", "perig_s": "Wildfire hazard (SRUP / PMDFCI)", "ard15": "Burnt areas 2015–2025", "ard75": "Burnt areas 1975–2014", "sgifr_a": "Fuel breaks and mosaics (SGIFR)", "sgifr_l": "Fuel management network · lines (SGIFR)", "redeprim": "Primary fuel break network", "zif": "Forest intervention zones (ZIF)", "hidro": "River network", "hidro_g": "Geocoded river network", "rh": "River basin districts (RH1 to RH8)", "bacias": "River basins (Pfafstetter)", "massas": "Water bodies (RBMP 3rd cycle)", "inund": "Flood zones (Directive 2007/60/EC)", "arpsi": "Areas of potential significant flood risk", "aquif": "Groundwater bodies", "hidrog": "Hydrogeological units", "aquif_s": "Protection perimeters of public water abstractions (SRUP)", "icnfpa": "DFCI water points (ponds, wells, tanks) · 17,112", "apasub": "Groundwater monitoring network (springs and piezometers)", "dgegn": "Licensed spring waters (bottling)", "dgegm": "Licensed natural mineral waters", "ma_ecol": "Ecological status of watercourses (RBMP 3)", "ma_quant": "Quantitative status of groundwater", "wei": "Water scarcity WEI+ by sub-basin", "wei_sub": "Water scarcity WEI+ by groundwater body", "capt_p": "Licensed groundwater abstractions (boreholes and wells) · 86,551", "capt_sup": "Licensed surface water abstractions · 4,948", "barragens": "Dams and weirs", "etar": "Wastewater treatment plants and discharge points", "nitratos": "Nitrate vulnerable zones", "zprot": "Protected zones under the Water Law", "albpub": "Public water reservoirs (protection)", "zadj": "Adjacent zones (published in the official gazette)", "marcas": "Historical flood marks", "scs": "Hydrologic soil group (A, B, C, D)", "cn": "Runoff curve number (CN)", "esc_med": "Mean annual runoff", "precip": "Total annual precipitation (1959–1991)", "erosiv": "Rainfall erosivity (R factor)", "hidrom": "Hydrometric and rain gauge stations (SNIRH)", "piezo": "Piezometers (groundwater level)", "bac_troco": "Catchment of each watercourse reach", "sroa": "Land use capability (SROA)", "contam": "Contaminated soils and environmental liabilities", "bal_i": "Official bathing areas · inland", "bal_c": "Official bathing areas · coastal", "solos": "Soil map", "carbono": "Soil organic carbon", "aridez": "Aridity index", "desert": "Susceptibility to desertification", "geo": "Geology 1:500,000", "cos_s2": "Land use · COS 2023 (S2)", "cos23": "COS 2023 (vector)", "cos25": "COS 2025 (vector)", "cos18": "COS 2018 (vector)", "cosc25": "Short-term COS 2025", "copa18": "Canopy density 2018", "swf21": "Single trees and hedgerows 2021 · 5 m", "habitats": "Habitats in SACs", "invasoras": "Invasive species (IFN)", "o_estradas": "Roads and tracks", "o_edif": "Buildings", "o_agua": "Watercourses", "o_fronteiras": "Borders and regions", "o_nomes": "Place names (towns, rivers, mountains)", "o_picos": "Peaks and summits with height", "o_caminhos": "Rural tracks and trails", "o_cobertura": "Land cover (woodland, grassland, crops)", "o_usos": "Land uses (housing, industry, quarries)", "o_planos": "Water surfaces", "o_protegidas": "Parks and protected areas (OSM)", "o_aguapts": "Springs, wells, fountains and tanks", "o_energia": "Power lines and substations", "o_patrimonio": "Heritage, ruins and farmsteads", "o_vedacoes": "Walls, fences and gates", "n_gbif_todas": "Species occurrences (all)", "n_gbif_aves": "Bird occurrences", "n_gbif_plantas": "Plant occurrences", "n_gibs_neve": "Snow · mean cover in January 2026 (MODIS)", "n_gibs_humsolo": "Root-zone soil moisture · latest day (SMAP)", "n_gibs_evap": "Evaporation over land · July 2026 (MERRA-2)", "r_projipr": "IPR projects nearby", "l_mdt": "DTM · hypsometry", "l_somb_bw": "Hillshade (black and white)", "l_curvas05": "Contour lines 0.5 m", "l_curvas1": "Contour lines 1 m", "l_curvas2": "Contour lines 2 m", "l_curvas5": "Contour lines 5 m", "l_declives": "Slopes · 7 classes", "l_exposicao": "Solar aspect", "l_geomorphons": "Landforms (geomorphology)", "l_vento": "Wind exposure (from the north-west)", "l_streams": "Watercourses (Strahler order)", "l_festos": "Ridges / crests", "l_acumulacao": "Flow accumulation", "l_bacias_l": "Catchments", "l_twi": "Topographic wetness (TWI)", "l_erosao": "Erosion (sediment transport)", "dph": "Public water domain", "la350": "Watercourses with catchment > 350 ha", "albzr": "Reservoirs and lagoons · reserved zone", "albuf": "Classified reservoirs", "capt": "Protection perimeters of water abstractions", "eletr": "Power grid", "viaria": "National road network", "ferro": "Railway network", "marcos": "Survey markers", "aero": "Aviation easements", "defesa": "National defence"};
  var SUB = {"AIA": "EIA", "Actual": "Current", "Armazenamento": "Storage", "Banhos": "Bathing", "Base Cartográfica · Erosão": "Base Map · Erosion", "Base Cartográfica · Hidrologia": "Base Map · Hydrology", "Base Cartográfica · Morfologia": "Base Map · Morphology", "Base Cartográfica · Terreno base": "Base Map · Base terrain", "Bioclima e ecologia (Atlas do Ambiente)": "Bioclimate and ecology (Environment Atlas)", "Biodiversidade (GBIF)": "Biodiversity (GBIF)", "Captações": "Abstractions", "Cartográfico": "Cartographic", "Caça e lazer": "Hunting and leisure", "Cheias": "Floods", "Clima": "Climate", "Clima (Atlas do Ambiente)": "Climate (Environment Atlas)", "Contexto (OpenStreetMap)": "Context (OpenStreetMap)", "Corredores e ordenamento florestal": "Corridors and forest planning", "Escassez": "Scarcity", "Espécies (quadrículas)": "Species (grid squares)", "Estado das águas": "Water status", "Estações": "Stations", "Floresta": "Forest", "Geologia": "Geology", "Gestão de combustível": "Fuel management", "Hidrologia do solo": "Soil hydrology", "Histórico": "Historical", "Limites administrativos (CAOP 2025)": "Administrative boundaries (CAOP 2025)", "Litoral": "Coast", "Natureza": "Nature", "Ocupação": "Land cover", "Ordenamento (PDM)": "Land-use planning (PDM)", "PDM · planta de condicionantes (imagem)": "PDM · constraints plan (image)", "Perigosidade": "Hazard", "Pontos de água": "Water points", "Pormenor (OpenStreetMap, ao aproximar)": "Detail (OpenStreetMap, when zoomed in)", "Pressões": "Pressures", "Prioridades de defesa": "Protection priorities", "Propriedade": "Property", "Protecção": "Protection", "Pré-visualização pública": "Public preview", "Recorrência e severidade": "Recurrence and severity", "Rede IPR": "IPR Network", "Reservas": "Reserves", "Riscos industriais": "Industrial hazards", "Satélite": "Satellite", "Servidões": "Easements", "Servidões oficiais (SRUP · DGT)": "Official easements (SRUP · DGT)", "Solo": "Soil", "Subterrânea": "Groundwater", "Superficial": "Surface water", "Vegetação": "Vegetation", "Água": "Water", "Água e clima (NASA GIBS)": "Water and climate (NASA GIBS)", "Áreas ardidas": "Burnt areas", "Áreas classificadas": "Classified areas"};
  var NOTA = {"Mosaico de 2016, licença aberta; os anos mais recentes da EOX são só para uso não comercial": "2016 mosaic, open licence; EOX's more recent years are for non-commercial use only", "Só para visualizar: a equidistância ajusta-se à aproximação. Os ficheiros da Base Cartográfica saem directamente do LiDAR da DGT.": "For viewing only: the contour interval adapts to the zoom. The Base Map files come straight from the DGT LiDAR.", "Curvas oficiais de 25 em 25 m. A Base Cartográfica traz curvas de 0,5 a 5 m do LiDAR.": "Official contours every 25 m. The Base Map includes 0.5 to 5 m contours from LiDAR.", "Origem instável: pode demorar ou falhar": "Unstable source: it may be slow or fail", "Indicativo; vinculativo é o publicado em DR / SNIT": "For guidance; what is published in the official gazette (DR) / SNIT is binding", "Imagem da planta publicada. Prevalece o que está publicado em Diário da República.": "Image of the published plan. What is published in the Diário da República (official gazette) prevails.", "Indicativo; vinculativo é o publicado em DR e na APA": "For guidance; what is published in the official gazette (DR) and by APA is binding", "As oito regiões hidrográficas do continente, unidades de gestão dos planos de gestão de região hidrográfica.": "The eight river basin districts of mainland Portugal, the management units of the river basin management plans.", "Bacias dos troços de linha de água geocodificadas: do 2.º nível à escala do país até à bacia de cada troço quando se aproxima. O detalhe muda com o zoom.": "Catchments of the geocoded watercourse reaches: from level 2 at national scale down to the catchment of each reach as you zoom in. The detail changes with the zoom.", "Aquíferos em mau estado quantitativo limitam novas captações.": "Aquifers in poor quantitative status restrict new abstractions.", "Índice de exploração da água (1989–2015): acima de 40 % há escassez severa.": "Water exploitation index (1989–2015): above 40 % there is severe scarcity.", "Infiltração: A alta, D baixa. Útil para charcas, keyline e escoamento.": "Infiltration: A high, D low. Useful for ponds, keyline and runoff.", "Serviço DGADR sem resposta a partir do servidor (16 Out)": "DGADR service not responding from the server (16 Oct)", "Densidade de registos, não de espécies: mostra onde se observou mais, o que também reflecte onde há mais observadores. Espécies sensíveis podem estar generalizadas na origem.": "Density of records, not of species: it shows where more was observed, which also reflects where there are more observers. Sensitive species may be generalised at source.", "Média mensal, cerca de 5 km por píxel; serve para ler serras e bacias, não para um terreno.": "Monthly mean, about 5 km per pixel; good for reading mountain ranges and basins, not a single plot.", "Modelo com dados de satélite, cerca de 9 km por píxel, actualizado diariamente com alguns dias de atraso.": "Model with satellite data, about 9 km per pixel, updated daily with a few days' delay.", "Reanálise mensal, cerca de 50 km por píxel: só leitura regional, nunca de parcela.": "Monthly reanalysis, about 50 km per pixel: regional reading only, never for a parcel.", "Informação de apoio. Prevalece o que está publicado em Diário da República.": "For guidance only. What is published in the Diário da República (official gazette) prevails."};
  var X = {"Os meus": "Mine", "Temas": "Themes", "Por onde começar?": "Where to start?", "Pergunte ao Atlas": "Ask the Atlas", "Testar internet: verifica se chega para carregar as camadas": "Test connection: checks whether it is fast enough to load the layers", "Cronologia: comparar o terreno em anos diferentes": "Timeline: compare the land across different years", "Recolher o painel das camadas": "Collapse the layers panel", "Abrir o painel das camadas": "Open the layers panel", "Recolher o painel da direita": "Collapse the right panel", "Abrir o painel da direita": "Open the right panel", "Transparência da legenda": "Legend transparency", "Transparência do painel": "Panel transparency", "Arrastar para mudar o tamanho": "Drag to resize", "Camadas ligadas": "Layers on", "1 camada ligada": "1 layer on", "Mais temas": "More themes", "Voltar ao início": "Back to the start", "Fechar o painel (o tema continua ligado)": "Close the panel (the theme stays on)", "Fechar o painel": "Close the panel", "Minimizar": "Minimise", "Arrastar": "Drag", "Arrastar ferramentas": "Drag the tools", "Abrir a legenda": "Open the legend", "Apagar o que foi escrito": "Clear what was typed", "Aproximar o mapa para ver": "Zoom in to see it", "Mais informação": "More information", "Sobre esta camada": "About this layer", "Legenda do serviço:": "Service legend:", "mesma escala de cima": "same scale as above", "sem sessão · entre para guardar": "not signed in · sign in to save", "Os meus terrenos": "My plots", "Abrir a pesquisa": "Open search", "Hipsometria": "Hypsometry", "Cadastro predial": "Land registry parcels", "Escolher": "Select", "escolher": "select", "Ficheiros do projecto": "Project files", "Pasta": "Folder", "Ficheiros e AutoCAD": "Files and AutoCAD", "Mudar entre relevo e imagem de satélite": "Switch between relief and satellite image", "Vista inicial": "Initial view", "Exagero vertical": "Vertical exaggeration", "MDT": "DTM", "Sombreamento": "Hillshade", "Curvas 0,5 m": "Contours 0.5 m", "Curvas 1 m": "Contours 1 m", "Curvas 2 m": "Contours 2 m", "Curvas 5 m": "Contours 5 m", "Declives": "Slopes", "Exposição": "Aspect", "Formas do relevo": "Landforms", "Vento": "Wind", "Linhas de água": "Watercourses", "Festos": "Ridges", "Bacias": "Catchments", "Acumulação": "Flow accumulation", "Humidade (TWI)": "Wetness (TWI)", "Erosão": "Erosion", "Muito Baixa": "Very low", "Baixa": "Low", "Alta": "High", "Muito Alta": "Very high", "Muito baixa": "Very low", "Muito alta": "Very high", "Zonas de Proteção Especial": "Special Protection Areas", "Zonas de Protecção Especial": "Special Protection Areas", "Sítios de Importância Comunitária": "Sites of Community Importance", "Rústico sem construção habitável": "Rural land without a habitable building", "Rústico com construção habitável": "Rural land with a habitable building", "Urbano: terreno para construção": "Urban: building plot", "Urbano: moradia ou edifício": "Urban: house or building", "Poucos comparáveis perto deste terreno: o intervalo foi alargado (20 % abaixo e 25 % acima dos extremos) e a confiança é muito baixa.": "Few comparables near this plot: the range was widened (20 % below and 25 % above the extremes) and confidence is very low.", "Dimensão: o preço por m² de cada comparável foi ajustado à área deste terreno (terrenos maiores valem menos por m²) e os de dimensão parecida pesam mais.": "Size: the price per m² of each comparable was adjusted to the area of this plot (larger plots are worth less per m²) and those of similar size weigh more.", "Preços pedidos descontados 12 % (diferença habitual entre o pedido e o fecho).": "Asking prices discounted by 12 % (the usual gap between asking and closing prices).", "Não entram nesta versão: estado e área da construção, água, acessos, solo, REN, RAN, Rede Natura e potencial do PDM.": "Not included in this version: condition and floor area of buildings, water, access, soil, REN, RAN, Natura 2000 and PDM development potential.", "O potencial construtivo depende do PDM (classe de solo, índices e condicionantes) e ainda não é calculado aqui. Use a «Análise prévia da intervenção» e confirme na câmara municipal.": "Development potential depends on the PDM (land class, indices and constraints) and is not calculated here yet. Use the «Preliminary intervention check» and confirm with the municipal council.", "Valor indicativo: ainda não há comparáveis suficientes perto deste imóvel.": "Indicative value: there are not yet enough comparables near this property.", "Valor indicativo: o imóvel ainda não tem limite desenhado.": "Indicative value: the property has no boundary drawn yet.", "Entregue": "Delivered", "Em produção": "In production", "Em processamento": "Processing", "Pagamento pendente": "Awaiting payment", "Pendente": "Pending", "Cancelada": "Cancelled", "Cancelado": "Cancelled", "Reembolsada": "Refunded", "Reembolsado": "Refunded", "Em espera": "On hold", "Falhada": "Failed", "Falhou": "Failed", "Concluída": "Completed", "Concluído": "Completed", "Rascunho": "Draft", "Terreno base": "Base terrain", "Morfologia": "Morphology", "Hidrologia": "Hydrology", "Linhas de água com bacia hidrográfica > 350 Ha": "Watercourses with catchment > 350 ha", "Projecto de demonstração · LiDAR": "Demonstration project · LiDAR", "Sub-bacia da Ribeira do Torgal (Mira)": "Ribeira do Torgal sub-basin (Mira)", "16 409 ha de LiDAR da DGT tratados pelo IPR: relevo, declives, linhas de água, humidade (TWI), erosão, formas do relevo, curvas de nível. Serve para ver a qualidade dos dados antes de encomendar e para correr os simuladores de água e de fogo sem Base própria.": "16,409 ha of DGT LiDAR processed by IPR: relief, slopes, watercourses, wetness (TWI), erosion, landforms, contour lines. Use it to check the data quality before ordering and to run the water and fire simulators without a Base of your own.", "Abrir o projecto de demonstração": "Open the demonstration project", "Projecto de demonstração": "Demonstration project", "Base Cartográfica (LiDAR DGT)": "Base Map (DGT LiDAR)"};
  var MESES = { Janeiro: "January", Fevereiro: "February", "Março": "March", Abril: "April", Maio: "May", Junho: "June", Julho: "July", Agosto: "August", Setembro: "September", Outubro: "October", Novembro: "November", Dezembro: "December" };
  var ESTADOS = "Entregue|Em produção|Em processamento|Pagamento pendente|Pendente|Cancelada|Cancelado|Reembolsada|Reembolsado|Em espera|Falhada|Falhou|Concluída|Concluído|Rascunho";
  var PERIGO = { "Muito Baixa": "Very low", "Muito baixa": "Very low", "Baixa": "Low", "Média": "Moderate", "Alta": "High", "Muito Alta": "Very high", "Muito alta": "Very high" };
  function dec(s) { return String(s).replace(/(\d),(\d)/g, "$1.$2").replace(/(\d) (\d{3})(?!\d)/g, "$1,$2"); }
  var PAD = [
    [/^(\d+) camadas ligadas$/, "$1 layers on"],
    [/^from ([\d.,]+) €( \+ VAT)?$/, function (m, v, i) { return "from €" + v + (i || ""); }],
    [/^(\d+) de (\d+) ligadas$/, "$1 of $2 on"],
    [/^(.+) · a sua conta$/, "$1 · your account"],
    [/^(\d+) comparáveis$/, "$1 comparables"],
    [/^(\d+) comparáveis do mesmo uso até (\d+) km \((\d+) vendas, (\d+) preços pedidos\); peso maior para vendas, para os mais próximos e para os mais recentes\.$/,
      "$1 comparables of the same use within $2 km ($3 sales, $4 asking prices); more weight for sales, for the nearest and for the most recent."],
    [/^Distância mediana aos comparáveis: (.+) km\.$/, function (m, x) { return "Median distance to the comparables: " + dec(x) + " km."; }],
    [/^Habitação vendida no concelho de (.+): mediana de (.+) €\/m² de área de habitação \((.+)\)\.$/,
      function (m, c, v, f) { return "Housing sold in the municipality of " + c + ": median of " + dec(v) + " €/m² of floor area (" + f + ")."; }],
    [/^Não foi possível ligar «(.+)» \((.+)\)\.$/, function (m, x, y) { return "Could not turn on «" + tr(x) + "» (" + y + ")."; }],
    [/^Curvas de nível ([\d,]+) m$/, function (m, x) { return "Contour lines " + dec(x) + " m"; }],
    [/^(\d{1,2}) de (Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro) de (\d{4})$/, function (m, d, mm, a) { return d + " " + MESES[mm] + " " + a; }],
    [new RegExp("^(●\\s*)(" + ESTADOS + ")$"), function (m, p, s) { return p + X[s]; }],
    [new RegExp("^(.+) · (" + ESTADOS + ")$"), function (m, p, s) { return dec(p) + " · " + X[s]; }],
    [/^(#\d+ · )?(\d+),(\d+) ha$/, function (m, a, i, f) { return (a || "") + i + "." + f + " ha"; }],
    [/^(\d+),(\d+) ha · (\d+) camadas?$/, function (m, i, f, n) { return i + "." + f + " ha · " + n + (n === "1" ? " layer" : " layers"); }],
    // classes de perigosidade em lista (vêm dos serviços: «Muito Baixa · Baixa · Média»)
    [/^((Muito [Bb]aixa|Baixa|Média|Alta|Muito [Aa]lta)( · |$))+$/, function (m) { return m.split(" · ").map(function (x) { return PERIGO[x] || x; }).join(" · "); }],
    [/^(.+?) · ((?:(?:Muito [Bb]aixa|Baixa|Média|Alta|Muito [Aa]lta)(?: · |$))+)$/, function (m, p, c) { return tr(p) + " · " + c.split(" · ").map(function (x) { return PERIGO[x] || x; }).join(" · "); }]
  ];
  function tr(k) { var d = dic(); return (d && Object.prototype.hasOwnProperty.call(d, k)) ? d[k] : (X[k] || k); }
  function emIngles() { return String(W.IPR_LINGUA || "pt").toLowerCase().indexOf("pt") !== 0; }
  function dic() { return W.__ipr73c && W.__ipr73c.dic; }
  function porPadrao(k) {
    for (var i = 0; i < PAD.length; i++) { var p = PAD[i]; if (p[0].test(k)) { var r = k.replace(p[0], p[1]); return r !== k ? r : null; } }
    return null;
  }
  // nomes, subtítulos e notas das camadas: no catálogo (para quem lê e.en) e no dicionário (para quem escreve o nome em português)
  var catFeito = 0;
  function catalogo() {
    var C = (W.IPRViz && W.IPRViz.catalogo) || [], d = dic(); if (!C.length || !d) return false;
    if (catFeito === C.length) return true;
    C.forEach(function (e) {
      if (!e) return;
      if (!e.en && N[e.id]) e.en = N[e.id];
      if (e.sub && !e.subEn && SUB[e.sub]) e.subEn = SUB[e.sub];
      if (e.nota && !e.notaEn) { if (NOTA[e.nota]) e.notaEn = NOTA[e.nota]; else if (e.nota === "Intelligence") e.notaEn = "Intelligence"; }
      // siglas sozinhas (REN, RAN, MDT…) não entram no dicionário: «REN» aparece em muitos sítios onde basta a sigla
      if (e.en && e.n && /[a-zà-ú]/.test(e.n) && !Object.prototype.hasOwnProperty.call(d, e.n)) d[e.n] = e.en;
      if (e.subEn && e.sub && !Object.prototype.hasOwnProperty.call(d, e.sub)) d[e.sub] = e.subEn;
      if (e.notaEn && e.nota && e.nota !== "Intelligence" && !Object.prototype.hasOwnProperty.call(d, e.nota)) d[e.nota] = e.notaEn;
    });
    catFeito = C.length; return true;
  }
  var EXCL = ".ipe-ct strong,.ipo-pop,.maplibregl-popup,[contenteditable],script,style,textarea,.ipr-sem-traducao,.ipe-proj .t";
  function fora(el) { try { return !el || !!(el.closest && el.closest(EXCL)); } catch (e) { return false; } }
  // «Média» é «Mean» nas estatísticas de declives, mas «Moderate» nas classes de perigosidade das legendas
  var MOD = new WeakMap();
  function moderado() {
    D.querySelectorAll("#ipr-lgd, .ipr-tcam").forEach(function (box) {
      var tw = D.createTreeWalker(box, NodeFilter.SHOW_TEXT), n, ts = [];
      while ((n = tw.nextNode())) ts.push(n);
      var perigo = ts.some(function (t) { return /^(Very low|Low|High|Very high)$/.test(t.nodeValue.trim()); });
      if (!perigo) return;
      ts.forEach(function (t) { if (t.nodeValue.trim() === "Mean") { MOD.set(t, 1); t.nodeValue = t.nodeValue.replace("Mean", "Moderate"); } });
    });
  }
  function reporModerado() {
    var tw = D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) if (MOD.has(n) && n.nodeValue.trim() === "Moderate") { n.nodeValue = n.nodeValue.replace("Moderate", "Média"); MOD.delete(n); }
  }
  function varrer() {
    if (!D.body) return;
    if (!emIngles()) { reporModerado(); return; }
    var d = dic(); if (!d) return;
    catalogo();
    var novo = false, tw = D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) {
      var v = n.nodeValue; if (!v || v.length > 600) continue;
      var k = v.trim(); if (!k || Object.prototype.hasOwnProperty.call(d, k) || !/[a-zà-ú]/i.test(k)) continue;
      if (fora(n.parentNode)) continue;
      var r = porPadrao(k); if (r) { d[k] = r; novo = true; }
    }
    D.querySelectorAll("[title],[aria-label],[placeholder]").forEach(function (el) {
      ["title", "aria-label", "placeholder"].forEach(function (a) {
        var v = el.getAttribute(a); if (!v) return; v = v.trim();
        if (Object.prototype.hasOwnProperty.call(d, v) || el.getAttribute("data-tr-" + a + "-en") === v) return;
        var r = porPadrao(v); if (r) { d[v] = r; novo = true; }
      });
    });
    if (W.__ipr73c && W.__ipr73c.aplicar) W.__ipr73c.aplicar();
    moderado();
    return novo;
  }
  // Depois de rajadas de redesenho (por exemplo ao abrir uma Base), o tradutor do ajustes.js desiste de um elemento por uns
  // segundos para não entrar em ping-pong; esta varredura volta a passar no fim, para nada ficar em português.
  var tA = 0, tB = 0, ultima = 0;
  function agendar() {
    if (!emIngles()) return;
    var agora = Date.now();
    if (!tA) tA = setTimeout(function () { tA = 0; ultima = Date.now(); varrer(); }, Math.max(0, 900 - (agora - ultima)));
    clearTimeout(tB); tB = setTimeout(varrer, 3400);
  }
  function arrancar() {
    function juntar() {
      var d = dic(); if (!d) return false;
      Object.keys(X).forEach(function (k) { if (!Object.prototype.hasOwnProperty.call(d, k)) d[k] = X[k]; });
      // termos que o dicionário antigo traduzia de duas maneiras: fica uma só
      Object.keys(d).forEach(function (k) {
        var v = d[k]; if (typeof v !== "string") return;
        var n = v.replace(/Natura Network/g, "Natura 2000").replace(/\bWater public domain\b/g, "Public water domain");
        if (n === "Streams") n = "Watercourses";
        if (n !== v) d[k] = n;
      });
      return true;
    }
    var n = 0;
    (function espera() {
      if (!juntar() && n++ < 120) { setTimeout(espera, 250); return; }
      varrer();
      new MutationObserver(agendar).observe(D.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label", "placeholder"] });
      D.addEventListener("ipr:lingua", function () { setTimeout(varrer, 50); setTimeout(varrer, 1200); });
      // o catálogo de camadas cresce depois do arranque (camadas das ilhas, habitats, Base Cartográfica)
      var k = 0; (function cat() { catalogo(); if (k++ < 20) setTimeout(cat, 3000); })();
    })();
  }
  // o MapLibre põe «Map» no aria-label do mapa; em português fica «Mapa»
  function rotuloMapa() { D.querySelectorAll(".maplibregl-canvas[aria-label='Map']").forEach(function (c) { if (!emIngles()) c.setAttribute("aria-label", "Mapa"); }); }
  [3000, 10000, 25000].forEach(function (t) { setTimeout(rotuloMapa, t); });
  D.addEventListener("ipr:lingua", function () { setTimeout(rotuloMapa, 100); });
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  W.__iprTrEn = { padrao: porPadrao, varrer: varrer };
})();
