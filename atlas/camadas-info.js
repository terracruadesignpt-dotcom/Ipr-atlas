/* IPR Atlas · Sobre cada camada (Nuno, 4/11/2026, 16h13: «todas as camadas no atlas devem dizer o que são, ter a fonte
   e mostrar legenda bem completa»). Terracrua Design.
   Carrega-se depois dos outros ficheiros e só acrescenta; cada parte falha em silêncio.
   1. Botão «i» em cada camada do catálogo (li.ipr-it), na lista das ligadas (li.ipr-cq-it) e em cada camada da caixa de
      legenda (#ipr-lgd). Abre um painel com: o que é a camada, a fonte (entidade, serviço, licença e atribuição, período ou
      escala) e a legenda completa.
   2. Legenda completa: classes do catálogo (leg); WMS por GetLegendGraphic; ArcGIS MapServer/ImageServer por /legend?f=json,
      primeiro directo e, se o serviço não deixar (CORS), pelo proxy do site (/tcd/v1/viz/px, só para os anfitriões que o
      m14554 já permite); servidões e PDM pelo ?leg=1 do m90379; para as restantes, a legenda escrita aqui (LEG).
   3. Na caixa de legenda (§71), cada camada passa a ter a linha «Fonte: …», e as camadas ArcGIS ou WMS que lá ficaram só
      com o nome (o serviço não respondeu ao §77/§A3) recebem a legenda pelo mesmo caminho do ponto 2.
   Textos PT (EN nos títulos do painel). Desligar: ?info=0 ou localStorage ipr_info_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]info=0/.test(location.search) || localStorage.getItem("ipr_info_off") === "1") return; } catch (e) {}
  if (W.__iprInfo) return; W.__iprInfo = 1;

  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(D.documentElement.lang || "pt"); }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cat() { var m = {}; try { (W.IPRViz.catalogo || []).forEach(function (e) { m[e.id] = e; }); } catch (e) {} return m; }
  function parse(x) { if (x == null) return null; if (typeof x !== "string") return x; try { return JSON.parse(x); } catch (e) { return null; } }

  // ── O que é cada camada ────────────────────────────────────────────────────────────────────────────────────────────
  var ORTO = "Fotografia aérea ortorrectificada (sem deformação, sobreponível ao mapa). Serve de fundo e para ler o terreno, a vegetação e as construções nessa data.";
  var DESC = {
    f_ortosat: "Imagem de satélite de muito alta resolução (30 cm) de todo o continente, de 2023, em cor verdadeira. É o fundo mais actual e uniforme do país.",
    f_orto18: ORTO + " Voo de 2018, 25 cm.", f_o25: ORTO + " Voo de 2025, 25 cm.", f_o21: ORTO + " Voo de 2021; cobre só a metade norte do país.",
    f_o15: ORTO + " Voo de 2015.", f_o10: ORTO + " Voo de 2010.", f_o12: ORTO + " Voo de 2012.", f_o07: ORTO + " Voo de 2007.", f_o04: ORTO + " Voos de 2004 a 2006.",
    f_o95: ORTO + " Voo de 1995 em infravermelho: a vegetação viva aparece em vermelho, o que ajuda a ver sebes, linhas de água e regeneração.",
    f_s2jul: "Mosaico Sentinel-2 (satélite europeu Copernicus, 10 m) de Julho de 2025, em cor verdadeira: o país no pico do Verão seco.",
    f_s2jan: "Mosaico Sentinel-2 (10 m) de Janeiro de 2025, em cor verdadeira: o país no Inverno, com pastagens e culturas de sequeiro verdes.",
    f_s2out: "Mosaico Sentinel-2 (10 m) de Outubro de 2025 em infravermelho (cores virtuais): vegetação activa em vermelho, solo nu e áreas ardidas em tons escuros.",
    f_relevo: "Relevo sombreado calculado a partir de modelos digitais do terreno (em Portugal, o LiDAR da DGT a 0,5 m). Mostra só a forma do terreno, iluminada de noroeste.",
    f_mapa: "Mapa de base vectorial do OpenStreetMap (estradas, localidades, rios, nomes), desenhado pelo OpenFreeMap.",
    f_esri: "Imagem de satélite e aérea mundial da Esri (World Imagery). Útil fora de Portugal; dentro do país o fundo da DGT é mais actual e mais preciso.",
    f_otm: "Mapa topográfico do OpenTopoMap: curvas de nível, relevo sombreado e caminhos sobre dados do OpenStreetMap e do SRTM.",
    f_s2g: "Mosaico mundial sem nuvens Sentinel-2 de 2016 (EOX). Fundo para a Península e o resto do mundo.",
    r_somb: "Relevo sombreado do terreno a partir do LiDAR da DGT, para ler encostas, linhas de água e cumeadas antes de encomendar a Base Cartográfica.",
    r_hipso: "Hipsometria oficial da DGT: cores por classe de altitude em todo o continente.",
    r_curvas: "Curvas de nível calculadas no momento a partir do LiDAR (equidistância de 1 a 50 m, conforme a aproximação). Servem para ver; as curvas para projecto vêm na Base Cartográfica.",
    r_cdgt: "Curvas de nível oficiais da DGT, de 25 em 25 m, da cartografia de referência nacional.",
    r_cotas: "Pontos cotados oficiais da DGT: altitude medida em pontos notáveis (cabeços, vértices, cruzamentos).",
    cad: "Prédios rústicos e urbanos do cadastro predial geométrico da DGT, onde o cadastro existe (sobretudo no Sul). Não substitui a certidão matricial nem o registo predial.",
    bupi: "Representações gráficas georreferenciadas de prédios feitas no BUPi (balcão único do prédio), nos concelhos sem cadastro geométrico. Declaradas pelos proprietários; não provam limites.",
    ifap_p: "Parcelas agrícolas do Sistema de Identificação Parcelar (iSIP) do IFAP, usadas nas candidaturas às ajudas da PAC.",
    ifap_o: "Ocupação de cada parcela agrícola declarada no iSIP do IFAP (culturas, pastagens, floresta).",
    distritos: "Limites dos distritos da Carta Administrativa Oficial de Portugal (CAOP) 2025.",
    concelhos: "Limites dos concelhos (municípios) da CAOP 2025.",
    caop: "Limites das freguesias da CAOP 2025, a referência oficial dos limites administrativos.",
    crus: "Qualificação do solo dos Planos Directores Municipais (classes e categorias de espaço), compilada pela DGT. Indicativa: vale a planta de ordenamento publicada em Diário da República.",
    poc_area: "Área abrangida pelos Programas da Orla Costeira (POC), onde se aplicam regras próprias de uso do litoral.",
    poc_ztp: "Zona terrestre de protecção dos Programas da Orla Costeira: faixa em terra onde há restrições à construção e a outros usos.",
    poc_margem: "Margem das águas do mar definida nos Programas da Orla Costeira (domínio público marítimo).",
    poc_faixas: "Faixas de salvaguarda à erosão costeira e ao galgamento oceânico definidas nos Programas da Orla Costeira.",
    poc_critica: "Áreas críticas dos Programas da Orla Costeira: troços com risco elevado de erosão ou galgamento.",
    ren: "Reserva Ecológica Nacional em vigor (SRUP, DGT): áreas com valor ecológico ou risco natural (cheias, erosão, recarga de aquíferos) onde a construção e as mudanças de uso estão condicionadas.",
    ran: "Reserva Agrícola Nacional em vigor (SRUP, DGT): solos de maior aptidão agrícola, onde os usos não agrícolas precisam de parecer da entidade regional da RAN.",
    n2k: "Rede Natura 2000: Zonas Especiais de Conservação (habitats e espécies) e Zonas de Protecção Especial (aves). Projectos que possam afectar estes sítios precisam de avaliação.",
    rnap: "Rede Nacional de Áreas Protegidas: parques e reservas naturais, paisagens protegidas e monumentos naturais, com plano de ordenamento ou programa especial próprio.",
    arv: "Árvores e conjuntos arbóreos classificados de interesse público (SRUP). Têm uma zona de protecção à volta onde não se pode cortar nem mexer no solo.",
    peap_rp: "Regimes de protecção dos programas especiais das áreas protegidas (PEAP): protecção total, parcial e complementar, com regras diferentes em cada um.",
    peap_aie: "Áreas de intervenção específica dos programas especiais das áreas protegidas: zonas com medidas próprias de conservação ou recuperação.",
    zec_so: "Sítios de Importância Comunitária e Zonas Especiais de Conservação da Rede Natura 2000 (habitats e espécies não aves).",
    zpe_so: "Zonas de Protecção Especial da Rede Natura 2000, classificadas para as aves.",
    ramsar: "Sítios Ramsar: zonas húmidas de importância internacional ao abrigo da Convenção de Ramsar.",
    biosfera: "Reservas da Biosfera da UNESCO em Portugal, com as zonas núcleo, tampão e de transição.",
    perig_e: "Perigosidade de incêndio rural estrutural 2020-2030 (ICNF): perigo de base, que depende do relevo, da ocupação e do histórico de fogo. Serve ao ordenamento.",
    perig: "Perigosidade de incêndio rural conjuntural do ano (ICNF): ajusta a estrutural com o estado da vegetação. Define onde se aplicam as regras do ano.",
    perig_s: "Carta de perigosidade de incêndio rural publicada como servidão (SRUP, PMDFCI), em cinco classes.",
    ard15: "Áreas ardidas de 2015 a 2025, cartografadas pelo ICNF a partir de imagens de satélite.",
    ard75: "Áreas ardidas de 1975 a 2014, cartografadas pelo ICNF.",
    sgifr_a: "Faixas e mosaicos de gestão de combustível do Sistema de Gestão Integrada de Fogos Rurais (áreas).",
    sgifr_l: "Rede de faixas de gestão de combustível do SGIFR (linhas): ao longo de estradas, linhas eléctricas e à volta de edifícios.",
    redeprim: "Rede primária de faixas de gestão de combustível: faixas largas que compartimentam o território para travar grandes incêndios.",
    zif: "Zonas de Intervenção Florestal: áreas de prédios florestais com gestão e plano comuns, geridas por uma entidade gestora.",
    hidro: "Rede hidrográfica oficial da APA (INSPIRE): rios e ribeiras do continente.",
    hidro_g: "Rede hidrográfica geocodificada da APA: cada troço tem código e pertence a uma bacia.",
    rh: "As oito regiões hidrográficas do continente (RH1 a RH8), unidades de gestão dos Planos de Gestão de Região Hidrográfica.",
    bacias: "Bacias hidrográficas da APA, codificadas pelo método de Pfafstetter, do 2.º nível à escala do troço.",
    massas: "Massas de água superficiais dos Planos de Gestão de Região Hidrográfica (3.º ciclo): a unidade em que o estado da água é avaliado.",
    inund: "Zonas inundáveis cartografadas ao abrigo da Directiva 2007/60/CE (avaliação e gestão dos riscos de inundação).",
    arpsi: "Áreas de Risco Potencial Significativo de Inundação (ARPSI) identificadas pela APA.",
    aquif: "Massas de água subterrâneas (aquíferos) definidas pela APA (INSPIRE).",
    hidrog: "Unidades hidrogeológicas do continente: grandes conjuntos de aquíferos com comportamento semelhante.",
    aquif_s: "Perímetros de protecção de captações de água subterrânea para abastecimento público (SRUP). Dentro deles há actividades proibidas ou condicionadas.",
    icnfpa: "Pontos de água para combate a incêndios (DFCI) do ICNF: charcas, poços, tanques e albufeiras acessíveis a meios terrestres ou aéreos.",
    apasub: "Rede de monitorização das águas subterrâneas da APA: nascentes e piezómetros com medições periódicas.",
    dgegn: "Concessões de águas de nascente para engarrafamento (DGEG).",
    dgegm: "Concessões de águas minerais naturais (DGEG), com os seus perímetros.",
    ma_ecol: "Estado ecológico das massas de água de rios (PGRH 3.º ciclo): de excelente a mau.",
    ma_quant: "Estado quantitativo das massas de água subterrâneas (PGRH 3.º ciclo). Aquíferos em mau estado limitam novas captações.",
    wei: "Índice de escassez WEI+ por sub-bacia (PGRH 3.º ciclo): razão entre a água usada e a disponível. Acima de 40 % há escassez severa.",
    wei_sub: "Índice de escassez WEI+ por massa de água subterrânea.",
    capt_p: "Captações subterrâneas licenciadas (furos e poços) segundo os títulos de utilização dos recursos hídricos (PGRH 3.º ciclo, 2018).",
    capt_sup: "Captações de água superficial licenciadas (PGRH 3.º ciclo).",
    barragens: "Barragens e açudes inventariados nos PGRH como pressões sobre as massas de água.",
    etar: "Estações de tratamento de águas residuais e pontos de descarga, com as zonas sensíveis e menos sensíveis.",
    nitratos: "Zonas vulneráveis a nitratos de origem agrícola: aplicam-se programas de acção com regras de fertilização.",
    zprot: "Zonas protegidas ao abrigo da Lei da Água (captações, zonas balneares, zonas sensíveis, Rede Natura ligada à água).",
    albpub: "Albufeiras de águas públicas classificadas e as suas zonas de protecção.",
    zadj: "Zonas adjacentes publicadas em Diário da República: áreas ameaçadas pelas cheias, com restrições à construção.",
    marcas: "Marcas de cheias históricas registadas pela APA/SNIRH (local e cota atingida).",
    scs: "Grupo hidrológico do solo (A a D) do Atlas da Água (APA), à escala 1:1 000 000. A infiltra muito e D quase nada. Grosseiro para um terreno; a IPR está a fazer uma carta a 1:25 000.",
    cn: "Número de escoamento CN II (método SCS-CN) do Atlas da Água (APA), em células de 500 m: quanto mais alto, mais a chuva escorre em vez de infiltrar.",
    esc_med: "Escoamento médio anual (mm) do Atlas da Água: a parte da chuva que chega às linhas de água num ano médio.",
    precip: "Precipitação total anual média de 1959 a 1991 (mm), do Atlas da Água.",
    erosiv: "Erosividade da precipitação (factor R da equação universal de perda de solo): a força da chuva para arrancar solo.",
    hidrom: "Estações hidrométricas (caudais) e udométricas (chuva) do SNIRH, com séries de dados.",
    piezo: "Piezómetros da rede de monitorização: nível das águas subterrâneas.",
    bac_troco: "Bacia drenante de cada troço de linha de água geocodificado da APA.",
    sroa: "Capacidade de uso do solo (carta do antigo SROA, Atlas do Ambiente): classes A a E, da maior à menor aptidão agrícola.",
    contam: "Solos contaminados e passivos ambientais registados pela APA.",
    bal_i: "Zonas balneares interiores oficiais (rios e albufeiras), identificadas pela APA.",
    bal_c: "Zonas balneares costeiras e de transição oficiais, identificadas pela APA.",
    solos: "Carta de Solos de Portugal da DGADR. O serviço da DGADR não responde a partir do site desde 16/10; existe no modo Cloud.",
    carbono: "Carbono orgânico no solo (ICNF): stock estimado nos primeiros centímetros do solo.",
    aridez: "Índice de aridez (ICNF): razão entre a precipitação e a evapotranspiração potencial. Abaixo de 0,65 o clima é semiárido ou sub-húmido seco.",
    desert: "Susceptibilidade à desertificação (ICNF), a partir do clima, do solo e da vegetação.",
    geo: "Carta Geológica de Portugal 1:500 000 (LNEG): idade e tipo das rochas.",
    cos_s2: "Carta de uso e ocupação do solo 2023 a partir de Sentinel-2 (DGT), em imagem.",
    cos23: "Carta de Uso e Ocupação do Solo 2023 (DGT), em polígonos com unidade mínima de 1 ha e 83 classes no nível 4. No mapa as cores são as do nível 1; clique num polígono para ver a classe completa.",
    cos25: "Carta de Uso e Ocupação do Solo 2025 (DGT, versão 1), em polígonos. Cores do nível 1; o clique mostra a classe completa.",
    cos18: "Carta de Uso e Ocupação do Solo 2018 (DGT), em polígonos. Útil para comparar com 2023 e 2025.",
    cosc25: "Carta de ocupação do solo conjuntural de 2025 (DGT), feita todos os anos a partir de satélite, com menos classes que a COS.",
    copa18: "Densidade de copa das árvores em 2018 (Copernicus, camada de alta resolução Tree Cover Density, 10 m): percentagem do solo coberta por copas.",
    swf21: "Pequenas formações lenhosas em 2021 (Copernicus Small Woody Features, 5 m): árvores isoladas, sebes e bosquetes fora da floresta.",
    habitats: "Habitats naturais (Anexo I da Directiva Habitats) cartografados dentro das Zonas Especiais de Conservação.",
    invasoras: "Ocorrências de espécies lenhosas invasoras registadas no Inventário Florestal Nacional.",
    o_estradas: "Estradas e caminhos do OpenStreetMap, por categoria.", o_edif: "Edifícios do OpenStreetMap (aparecem ao aproximar).",
    o_agua: "Rios, ribeiras e canais do OpenStreetMap.", o_fronteiras: "Fronteiras de países e limites regionais do OpenStreetMap.",
    o_nomes: "Toponímia do OpenStreetMap: localidades, rios, serras e outros nomes.", o_picos: "Picos e vértices com cota do OpenStreetMap.",
    o_caminhos: "Caminhos rurais, estradões e trilhos do OpenStreetMap.", o_cobertura: "Cobertura do solo desenhada no OpenStreetMap (mata, prado, cultivo, zonas húmidas, areia).",
    o_usos: "Usos do solo desenhados no OpenStreetMap (habitação, indústria, pedreiras, quintas, parques).",
    o_planos: "Lagos, albufeiras e charcas do OpenStreetMap.", o_protegidas: "Parques e áreas protegidas tal como estão no OpenStreetMap (podem não coincidir com os limites oficiais do ICNF).",
    o_aguapts: "Nascentes, poços, fontes, bebedouros e depósitos de água registados no OpenStreetMap (consulta Overpass, ao aproximar).",
    o_energia: "Linhas eléctricas, postes e postos de transformação do OpenStreetMap.",
    o_patrimonio: "Património, ruínas, montes e marcos históricos registados no OpenStreetMap.",
    o_vedacoes: "Muros, vedações, sebes e portões registados no OpenStreetMap.",
    n_gbif_todas: "Densidade de registos de ocorrência de espécies (todos os grupos) no GBIF, em hexágonos. Mostra onde se observou mais, não quantas espécies há.",
    n_gbif_aves: "Densidade de registos de aves no GBIF, em hexágonos.", n_gbif_plantas: "Densidade de registos de plantas no GBIF, em hexágonos.",
    n_gibs_neve: "Cobertura de neve média de Janeiro de 2026 (MODIS, NASA), cerca de 5 km por píxel.",
    n_gibs_humsolo: "Humidade do solo na zona das raízes no dia mais recente (SMAP, NASA), cerca de 9 km por píxel.",
    n_gibs_evap: "Evaporação sobre terra em Julho de 2026 (reanálise MERRA-2, NASA), cerca de 50 km por píxel.",
    r_projipr: "Projectos da IPR e da Terracrua Design na vizinhança, com autorização dos clientes e localização arredondada a cerca de 5 km.",
    l_mdt: "Modelo digital do terreno da Base Cartográfica, a partir do LiDAR da DGT, colorido por altitude (hipsometria).",
    l_somb_bw: "Sombreamento do terreno da Base Cartográfica (preto e branco), para ler a forma fina do relevo.",
    l_curvas05: "Curvas de nível de 0,5 em 0,5 m da Base Cartográfica (LiDAR). Para projecto de pormenor.",
    l_curvas1: "Curvas de nível de 1 em 1 m da Base Cartográfica (LiDAR).", l_curvas2: "Curvas de nível de 2 em 2 m da Base Cartográfica (LiDAR).", l_curvas5: "Curvas de nível de 5 em 5 m da Base Cartográfica (LiDAR).",
    l_declives: "Declive do terreno em sete classes, calculado do MDT LiDAR. Ajuda a decidir onde há máquinas, caminhos, charcas ou só floresta.",
    l_exposicao: "Exposição das encostas (para onde estão viradas), do MDT LiDAR. As encostas a sul e sudoeste recebem mais sol e secam mais.",
    l_geomorphons: "Formas do relevo (geomorphons): cada célula classificada como pico, cumeada, encosta, vale, depressão, etc.",
    l_vento: "Exposição ao vento de noroeste (o dominante no Verão), do MDT LiDAR: onde o terreno abriga e onde fica exposto.",
    l_streams: "Linhas de água calculadas do MDT LiDAR, com a ordem de Strahler (1 = nascentes; a ordem sobe quando duas linhas iguais se juntam).",
    l_festos: "Festos e cumeadas calculados do MDT LiDAR: as linhas que separam as águas.",
    l_acumulacao: "Acumulação de fluxo: quantas células drenam para cada ponto. Mostra os caminhos da água à superfície, mesmo onde não há linha de água.",
    l_bacias_l: "Bacias hidrográficas calculadas do MDT LiDAR dentro do terreno e à volta.",
    l_twi: "Índice topográfico de humidade (TWI): onde o relevo faz a água juntar-se e o solo ficar mais húmido.",
    l_erosao: "Índice de transporte de sedimentos (LS): onde a forma e o comprimento da encosta favorecem a erosão.",
    l_escorrencia: "Linhas de escorrência: a acumulação de fluxo desenhada em linhas, por área drenada.",
    dph: "Domínio público hídrico (SNIT): leitos e margens das águas públicas, que pertencem ao Estado.",
    la350: "Linhas de água com bacia drenante maior que 350 ha (APA), relevantes para o domínio hídrico e a REN.",
    albzr: "Zonas reservadas das albufeiras e lagoas de águas públicas (faixa de protecção à volta do plano de água).",
    albuf: "Albufeiras de águas públicas classificadas (SRUP).",
    capt: "Perímetros de protecção das captações de água para consumo humano (APA).",
    dph_dem: "Linhas demarcadas do domínio público hídrico: limite do leito (LLL), da margem (LLM) e arriba.",
    dph_autos: "Autos de delimitação do domínio hídrico publicados.",
    lagoas_pub: "Lagoas e lagos de águas públicas.",
    poaap: "Âmbito dos Planos de Ordenamento de Albufeiras de Águas Públicas (POAAP).",
    pgri_perigo: "Perigo de inundação para integrar nos PDM (Planos de Gestão dos Riscos de Inundação, 2.º ciclo). Indicativo.",
    eletr: "Rede eléctrica de transporte e distribuição com servidão (SRUP).",
    inund20: "Zonas inundáveis para um período de retorno de 20 anos (probabilidade elevada), PGRI 2.º ciclo.",
    inund100: "Zonas inundáveis para 100 anos (probabilidade média), fluviais e costeiras, PGRI 2.º ciclo.",
    inund1000: "Zonas inundáveis para 1000 anos (probabilidade baixa), PGRI 2.º ciclo.",
    perigo_igt: "Perigo de inundação para os instrumentos de gestão territorial (PGRI 2.º ciclo).",
    cotas_cheia: "Cotas de cheia calculadas no PGRI 2.º ciclo.",
    eventos_cheia: "Eventos de inundação reportados na avaliação preliminar do 3.º ciclo (APRI).",
    arpsi3: "Proposta de Áreas de Risco Potencial Significativo de Inundação do 3.º ciclo, em consulta pública.",
    alb_snirh: "Albufeiras da rede SNIRH, com ligação à ficha de cada barragem.",
    alb_bacia: "Bacias drenantes das albufeiras do SNIRH.",
    precmax: "Precipitação máxima diária anual (mm), do Atlas da Água.",
    etr: "Evapotranspiração real anual (mm), do Atlas do Ambiente.",
    temp_med: "Temperatura média anual do ar (Atlas do Ambiente).",
    geada_ano: "Duração do período de geada no ano agrícola (Atlas do Ambiente).", geada_dias: "Número médio de dias com geada por ano (Atlas do Ambiente).",
    viaria: "Rede rodoviária nacional e as suas zonas de servidão non aedificandi (SRUP).",
    ferro: "Rede ferroviária e a sua servidão (SRUP).", marcos: "Marcos geodésicos e a sua zona de protecção (SRUP).",
    aero: "Servidões aeronáuticas: limites à altura de construções e obstáculos perto de aeroportos (SRUP).",
    defesa: "Servidões militares e de defesa nacional (SRUP).",
    est_qual: "Estações de monitorização da qualidade das águas superficiais (APA).",
    hab_grupos: "Habitats do Anexo I dentro das ZEC, coloridos pelo grupo dominante (1 a 9).",
    hab_g1: "Habitats costeiros e vegetação halófita (grupo 1 do Anexo I) dentro das ZEC.", hab_g2: "Dunas marítimas e interiores (grupo 2).",
    hab_g3: "Habitats de água doce (grupo 3).", hab_g4: "Charnecas e urzais (grupo 4).", hab_g5: "Matos esclerófilos (grupo 5).",
    hab_g6: "Formações herbáceas naturais e seminaturais, incluindo montados (grupo 6).", hab_g7: "Turfeiras altas, turfeiras baixas e pântanos (grupo 7).",
    hab_g8: "Habitats rochosos e grutas (grupo 8).", hab_g9: "Florestas (grupo 9).",
    hab_psrn: "Habitats do Plano Sectorial da Rede Natura 2000 (1:100 000), cópia de 3/11/2026 dos dados do ICNF.",
    srup_aapc: "Albufeiras de águas públicas classificadas (servidão oficial, SRUP).", srup_casap: "Captações de águas subterrâneas para abastecimento público e os seus perímetros (SRUP).",
    srup_rf: "Terrenos submetidos ao regime florestal (total ou parcial), geridos ou tutelados pelo ICNF (SRUP).",
    srup_aip: "Árvores de interesse público e zona de protecção (SRUP).", srup_ic: "Imóveis classificados (monumentos, conjuntos, sítios) e as suas zonas de protecção (SRUP).",
    srup_mg: "Marcos geodésicos e zona de segurança (SRUP).", srup_rg: "Recursos geológicos: pedreiras, concessões mineiras e de águas minerais (SRUP).",
    srup_go: "Gasodutos e oleodutos e a sua faixa de servidão (SRUP).", srup_aa: "Aeroportos e aeródromos e as suas servidões (SRUP).",
    srup_dn: "Servidões de defesa nacional (SRUP).", srup_cpir: "Carta de perigosidade de incêndio rural (servidão, SRUP).",
    geossitios: "Geossítios inventariados: locais de interesse geológico.",
    prof_cor: "Corredores ecológicos dos Programas Regionais de Ordenamento Florestal (PROF).",
    prof_sub: "Sub-regiões homogéneas dos PROF, cada uma com funções e espécies florestais recomendadas.",
    prof_reg: "Regiões dos Programas Regionais de Ordenamento Florestal.",
    fogo_ret: "Intervalo médio entre incêndios em cada local (1975-2022).", fogo_n: "Número de vezes que cada local ardeu (1975-2022).",
    fogo_ult: "Ano do último incêndio em cada local (1975-2022).", sev25: "Severidade do fogo nas áreas ardidas em 2025 (dNBR, satélite).",
    sev19: "Severidade do fogo nas áreas ardidas de 2019 a 2024.",
    freg_dfci: "Freguesias prioritárias para a fiscalização da gestão de combustível em 2025.",
    loc_crit: "Locais críticos para incêndio rural identificados pelo ICNF.",
    nematodo: "Freguesias afectadas pelo nemátodo da madeira do pinheiro e zona tampão, com regras de corte e transporte.",
    ldi: "Tendência da produtividade das terras de 2000 a 2010 (indicador de degradação do solo).",
    zon_eco: "Zonas ecológicas (andares bioclimáticos) do Atlas do Ambiente.", reg_nat: "Regiões naturais de Portugal (divisão regional) do Atlas do Ambiente.",
    paisagem: "Tipos de paisagem do Atlas do Ambiente.", fitogeo: "Zonas fitogeográficas predominantes do Atlas do Ambiente.",
    insolacao: "Insolação: horas de sol descoberto por ano (Atlas do Ambiente).", radiacao: "Radiação solar global anual (Atlas do Ambiente).",
    humidade: "Humidade relativa média do ar (Atlas do Ambiente).",
    aq_residuo: "Resíduo seco das águas subterrâneas (sais dissolvidos), Atlas do Ambiente.", aq_cloretos: "Cloretos nas águas subterrâneas, Atlas do Ambiente.",
    aq_sulfatos: "Sulfatos nas águas subterrâneas, Atlas do Ambiente.", aq_dureza: "Dureza das águas subterrâneas, Atlas do Ambiente.",
    ifn15: "Espécies florestais registadas nos fotopontos do Inventário Florestal Nacional de 2015.",
    percursos: "Percursos pedestres em áreas classificadas (ICNF).",
    zonas_caca: "Zonas de caça associativas, municipais, turísticas e nacionais (ICNF)."
  };
  function desc(e) {
    if (DESC[e.id]) return DESC[e.id];
    if (/^pdm_/.test(e.id)) return "Planta de condicionantes do PDM deste concelho, em imagem, tal como publicada no SNIT. Prevalece o que está publicado em Diário da República.";
    if (/^bip_/.test(e.id)) return "Bacias, sub-bacias e micro-bacias calculadas pela IPR a partir do MDT LiDAR da DGT (WhiteboxTools), com os nomes dos rios das massas de água da APA.";
    return e.nota || "";
  }

  // ── Legendas escritas aqui (onde o serviço não tem legenda ou a do catálogo está incompleta) ──────────────────────
  var RAMPA_DENS = [["#fed976", "poucos registos"], ["#fd8d3c", "alguns"], ["#e31a1c", "muitos"], ["#800026", "muitíssimos"]];
  var LEG = {
    f_relevo: { txt: "Sombra calculada com luz de noroeste: encostas viradas a noroeste claras, a sudeste escuras. Não tem classes." },
    r_somb: { txt: "Sombra calculada com luz de noroeste. Não tem classes." },
    l_somb_bw: { txt: "Sombra calculada com luz de noroeste, em cinzentos. Não tem classes." },
    r_curvas: { leg: [["#ffffff", "curva de nível (equidistância conforme a aproximação)"], ["#ffffff", "curva mestra, mais grossa, com cota"]] },
    l_festos: { leg: [["#e09a3a", "festo ou cumeada (divisória de águas)"]] },
    l_bacias_l: { leg: [["#E8A4C8", "bacia"], ["#7ECFC0", "bacia vizinha"], ["#B5D46A", "bacia vizinha"], ["#9B8EC4", "bacia vizinha"]], txt: "As cores só distinguem bacias vizinhas; não medem nada." },
    l_mdt: { txt: "Cores relativas ao terreno: verde nas cotas mais baixas da Base, castanho nas mais altas. As cotas mínima e máxima vêm no relatório da Base." },
    hab_psrn: { leg: [["#4f8fa6", "1 · Costeiros e halófitos"], ["#e3c770", "2 · Dunas"], ["#2b7bb9", "3 · Águas doces"], ["#a05a8c", "4 · Charnecas e urzais"], ["#c08a3e", "5 · Matos esclerófilos"], ["#9cc35a", "6 · Prados, arrelvados e montados"], ["#5c7a3a", "7 · Turfeiras e nascentes"], ["#9e9e9e", "8 · Rochosos e grutas"], ["#2e7d32", "9 · Florestas"]] },
    n_gbif_todas: { leg: RAMPA_DENS, txt: "Hexágonos coloridos pelo número de registos." }, n_gbif_aves: { leg: RAMPA_DENS }, n_gbif_plantas: { leg: RAMPA_DENS },
    n_gibs_neve: { leg: [["#e0f3ff", "pouca neve"], ["#6baed6", "neve frequente"], ["#08306b", "neve quase permanente"]] },
    n_gibs_humsolo: { leg: [["#a6611a", "solo seco"], ["#dfc27d", ""], ["#80cdc1", ""], ["#018571", "solo húmido"]] },
    n_gibs_evap: { leg: [["#ffffcc", "pouca evaporação"], ["#41b6c4", ""], ["#253494", "muita evaporação"]] },
    o_estradas: { leg: [["#333333", "auto-estradas e vias principais"], ["#666666", "estradas secundárias"], ["#999999", "caminhos"]] },
    o_caminhos: { leg: [["#8b6b3e", "caminho rural, estradão"], ["#b08d57", "trilho, carreiro"]] },
    o_agua: { leg: [["#4a90c2", "rio, ribeira, canal"]] }, o_planos: { leg: [["#8fc3e6", "lago, albufeira, charca"]] },
    o_edif: { leg: [["#c9b8a6", "edifício"]] }, o_fronteiras: { leg: [["#f5efe0", "fronteira ou limite regional"]] },
    o_picos: { leg: [["#5a4a3a", "pico ou vértice, com cota"]] }, o_nomes: { txt: "Nomes de lugares; o tamanho da letra segue a importância." },
    o_protegidas: { leg: [["#4f9b55", "parque ou área protegida (OSM)"]] },
    o_aguapts: { leg: [["#1f78b4", "nascente, poço, fonte ou depósito"]] }, o_energia: { leg: [["#d4a017", "linha eléctrica"], ["#d4a017", "poste ou posto de transformação"]] },
    o_patrimonio: { leg: [["#8e5a2b", "património, ruína ou monte"]] }, o_vedacoes: { leg: [["#6d6d6d", "muro, vedação, sebe ou portão"]] },
    r_projipr: { leg: [["#b8652f", "projecto (posição arredondada a cerca de 5 km)", "p"]] },
    // Camadas vectoriais de uma só classe: o símbolo do mapa e o que quer dizer.
    r_cdgt: { leg: [["#f3e7b8", "curva de nível de 25 m", "l"], ["#f3e7b8", "curva mestra (mais grossa)", "L"]] },
    r_cotas: { leg: [["#6d4c41", "ponto cotado (altitude no rótulo)", "p"]] },
    cad: { leg: [["#fff1d6", "limite de prédio cadastrado", "l"]] },
    distritos: { leg: [["#ffd400", "limite de distrito", "L"]] }, concelhos: { leg: [["#ffe44d", "limite de concelho (nome no rótulo)", "L"]] },
    caop: { leg: [["#fff3a0", "limite de freguesia (nome no rótulo)", "d"]] },
    ren: { leg: [["#3a8a3a", "área de REN em vigor (todas as tipologias)"]], txt: "O Atlas desenha a REN numa só cor. As tipologias (leitos, zonas ameaçadas pelas cheias, áreas de elevado risco de erosão, etc.) estão na carta publicada do concelho." },
    ran: { leg: [["#c9a227", "solo da RAN"]] },
    arv: { leg: [["#2e7d32", "árvore ou conjunto classificado", "p"]] },
    sgifr_a: { leg: [["#ff8c42", "faixa ou mosaico de gestão de combustível"]] }, sgifr_l: { leg: [["#e8590c", "faixa linear de gestão de combustível", "l"]] },
    aquif_s: { leg: [["#29b6f6", "perímetro de protecção de captação pública"]] }, albuf: { leg: [["#4fc3f7", "albufeira classificada"]] },
    eletr: { leg: [["#8e24aa", "linha eléctrica com servidão", "l"]] }, viaria: { leg: [["#e65100", "estrada da rede nacional", "l"]] },
    ferro: { leg: [["#212121", "linha de caminho-de-ferro", "d"]] }, marcos: { leg: [["#000000", "marco geodésico", "p"]] },
    aero: { leg: [["#9575cd", "área com servidão aeronáutica"]] }, defesa: { leg: [["#795548", "área com servidão militar"]] },
    l_curvas05: { leg: [["#cdc9c2", "curva de 0,5 m", "l"]] }, l_curvas1: { leg: [["#b9b4ad", "curva de 1 m", "l"]] },
    l_curvas2: { leg: [["#8d877c", "curva de 2 m", "l"]] }, l_curvas5: { leg: [["#6b6459", "curva de 5 m", "l"]] },
    bal_i: { leg: [["#0d47a1", "zona balnear interior"]] }, bal_c: { leg: [["#0d47a1", "zona balnear costeira ou de transição"]] }
  };
  ["bip_1", "bip_2", "bip_4", "bip_5", "bip_6", "bip_8"].forEach(function (id) {
    LEG[id] = { leg: [["#1f4e79", "limite de bacia", "L"], ["#1f4e79", "limite de sub-bacia", "l"], ["#1f4e79", "micro-bacia (ao aproximar)", "l"], ["#1f4e79", "bacia cortada pelo limite do cálculo", "d"]] };
  });
  // Legendas dos serviços ArcGIS lidas uma vez (drawingInfo de cada camada) e guardadas aqui, para não depender do CORS
  // dos serviços nem do proxy do site (o /viz/px está em pausa na Cloudflare desde antes de 4/11). Lidas a 4/11/2026.
  var FIXAS = /*LEGENDAS*/{}/*FIM*/;
  function fotoLeg(e) { return e.g === "fundo" && /wms|xyz|omtbase/.test(e.t) && !LEG[e.id]; }

  // ── Fonte, licença e atribuição ────────────────────────────────────────────────────────────────────────────────────
  // Por entidade (primeiro padrão que bater no texto da fonte ou no endereço do serviço). Verificado a 4/11/2026.
  var LIC = [
    [/dgterritorio|DGT|SNIT|SRUP|CAOP/i, "DGT, Direção-Geral do Território", "Dados abertos da DGT, licença CC BY 4.0 (COS, LiDAR, ortofotos, CAOP confirmados nos metadados do SNIG). Atribuição: «Informação geográfica cedida pela Direção-Geral do Território».", "https://snig.dgterritorio.gov.pt/"],
    [/apambiente|APA|SNIRH|SNIAmb/i, "APA, Agência Portuguesa do Ambiente", "Serviço público de visualização do SNIAmb. Os metadados não indicam licença (só «© SNIRH» em várias camadas): citar a APA; para reproduzir em relatórios, confirmar com a APA.", "https://sniamb.apambiente.pt/"],
    [/icnf|ICNF/i, "ICNF, Instituto da Conservação da Natureza e das Florestas", "Dados geográficos abertos do ICNF, com indicação da fonte.", "https://geocatalogo.icnf.pt/"],
    [/dgadr|DGADR/i, "DGADR, Direção-Geral de Agricultura e Desenvolvimento Rural", "Metadados do SNIG da Carta dos Solos 1:25 000: «acesso público sem restrições», «uso sem condições», sem licença formal. Termos pedidos por escrito à DGADR a 4/11/2026.", "https://snisolos.dgadr.gov.pt/"],
    [/lneg|LNEG/i, "LNEG, Laboratório Nacional de Energia e Geologia", "Visualização no serviço do LNEG; só consulta, sem descarga nem redistribuição sem autorização.", "https://geoportal.lneg.pt/"],
    [/dgeg|DGEG/i, "DGEG, Direção-Geral de Energia e Geologia", "Serviço público de visualização da DGEG, com indicação da fonte.", "https://www.dgeg.gov.pt/"],
    [/bupi|BUPi/i, "BUPi, Balcão Único do Prédio (eBUPi)", "Dados abertos publicados no dados.gov.pt, com indicação da fonte.", "https://bupi.gov.pt/"],
    [/ifap|IFAP/i, "IFAP, Instituto de Financiamento da Agricultura e Pescas", "Serviço público do iSIP para consulta, com indicação da fonte.", "https://www.ifap.pt/isip"],
    [/eea\.europa|Copernicus Land/i, "Copernicus Land Monitoring Service (EEA)", "Acesso livre, completo e gratuito (política de dados do CLMS). Atribuição: «Generated using European Union's Copernicus Land Monitoring Service information».", "https://land.copernicus.eu/"],
    [/Copernicus|Sentinel/i, "Copernicus (União Europeia, ESA)", "Dados Sentinel de acesso livre e gratuito: «contém dados Copernicus Sentinel modificados».", "https://sentinels.copernicus.eu/"],
    [/EOX/i, "EOX IT Services", "Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contém dados Copernicus Sentinel 2016), CC BY 4.0.", "https://s2maps.eu/"],
    [/OpenTopoMap/i, "OpenTopoMap", "Mapa © OpenTopoMap (CC BY-SA 3.0); dados © contribuidores do OpenStreetMap (ODbL), SRTM.", "https://opentopomap.org/"],
    [/OpenStreetMap|OpenFreeMap|Overpass/i, "OpenStreetMap", "© contribuidores do OpenStreetMap, dados sob a licença ODbL 1.0.", "https://www.openstreetmap.org/copyright"],
    [/Esri|arcgisonline/i, "Esri World Imagery", "© Esri, Maxar, Earthstar Geographics e comunidade SIG. Só visualização no mapa, nos termos da Esri.", "https://www.esri.com/en-us/legal/terms/data-attributions"],
    [/GBIF/i, "GBIF, Global Biodiversity Information Facility", "Mapa de densidade do GBIF.org. Cada conjunto de dados tem a sua licença (CC0, CC BY 4.0 ou CC BY-NC 4.0).", "https://www.gbif.org/terms"],
    [/NASA|GIBS/i, "NASA EOSDIS GIBS", "Imagens da NASA sem restrições de uso, com indicação da fonte (NASA EOSDIS GIBS).", "https://www.earthdata.nasa.gov/engage/open-data-services-software-policies"],
    [/Mapterhorn/i, "Mapterhorn (LiDAR DGT e outras fontes abertas)", "Relevo do Mapterhorn a partir de modelos abertos; em Portugal, LiDAR da DGT (CC BY 4.0).", "https://mapterhorn.com/"],
    [/LiDAR DGT · processamento IPR|processamento IPR/i, "IPR, a partir do LiDAR da DGT", "Produto da Base Cartográfica IPR, feito sobre o LiDAR da DGT (CC BY 4.0). Uso nos termos da encomenda.", "https://terracruadesign.pt/"],
    [/IPR|Terracrua/i, "IPR · Terracrua Design", "Produção própria.", "https://terracruadesign.pt/"]
  ];
  function fonte(e) {
    var txt = String(e.fonte || "") + " " + String(e.url || "");
    for (var i = 0; i < LIC.length; i++) if (LIC[i][0].test(txt)) return { ent: LIC[i][1], lic: LIC[i][2], link: LIC[i][3] };
    if (e.t === "mvt" || e.t === "wmsp") return { ent: LIC[0][1], lic: LIC[0][2], link: LIC[0][3] };
    return { ent: e.fonte || "", lic: "", link: "" };
  }
  function servico(e) {
    if (/^https?:\/\//.test(e.url || "")) return e.url.replace(/\{.*$/, "").replace(/\?.*$/, "");
    if (e.t === "mvt" && e.col) return "https://ogcapi.dgterritorio.gov.pt/collections/" + e.col;
    return "";
  }
  var LICVIS = { v: "", a: "Uso com atenção aos termos da fonte", r: "Só consulta: a licença não permite descarregar nem redistribuir" };

  // ── Legenda completa (busca) ───────────────────────────────────────────────────────────────────────────────────────
  var PX = ["sniambgeoogc.apambiente.pt/getogc/rest/services/", "sigservices.icnf.pt/server/rest/services/BDG/", "image.discomap.eea.europa.eu/arcgis/rest/services/GioLandPublic/",
    "servergeo.dgeg.gov.pt/arcgis/rest/services/Visualizadores/", "geo.bupi.gov.pt/gisbupi/rest/services/opendata/", "ortos.dgterritorio.gov.pt/wms/", "cartografia.dgterritorio.gov.pt/wms/",
    "geo2.dgterritorio.gov.pt/", "inspire.apambiente.pt/getogc/services/INSPIRE/", "www.ifap.pt/isip/ows/", "sig.lneg.pt/server/services/"];
  function viaProxy(u) { return PX.some(function (p) { return u.indexOf("https://" + p) === 0; }) ? "/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(u) : ""; }
  var MEM = {};
  function obterJson(u) {
    function f(x) { var c = W.AbortController ? new AbortController() : null; var t = setTimeout(function () { if (c) c.abort(); }, 12000);
      return fetch(x, c ? { signal: c.signal } : {}).then(function (r) { clearTimeout(t); if (!r.ok) throw 0; return r.json(); }).then(function (j) { if (!j || j.error) throw 0; return j; }); }
    return f(u).catch(function () { var p = viaProxy(u); if (!p) throw 0; return f(p); });
  }
  function agsIds(e) {
    if (e.dyn) { var d = parse(e.dyn); return d ? d.map(function (x) { return x.id; }) : []; }
    var m = /show:([\d,\s]+)/.exec(e.layers || ""); return m ? m[1].split(",").map(function (x) { return +x; }) : [];
  }
  function legendaAgs(e) {
    if (MEM[e.id]) return MEM[e.id];
    var u = e.url.replace(/\/+$/, "") + "/legend?f=json" + (e.dyn ? "&dynamicLayers=" + encodeURIComponent(typeof e.dyn === "string" ? e.dyn : JSON.stringify(e.dyn)) : "");
    MEM[e.id] = obterJson(u).then(function (j) {
      var ids = agsIds(e), out = [];
      (j.layers || []).forEach(function (l) {
        if (ids.length && ids.indexOf(l.layerId) < 0) return;
        var linhas = (l.legend || []).map(function (x) { return { img: x.imageData ? "data:" + (x.contentType || "image/png") + ";base64," + x.imageData : x.url, txt: x.label || "" }; });
        if (linhas.length) out.push({ t: (j.layers.length > 1 && (ids.length !== 1)) ? l.layerName : "", r: linhas });
      });
      if (!out.length) throw 0; return out;
    });
    MEM[e.id].catch(function () { delete MEM[e.id]; });
    return MEM[e.id];
  }
  function wmsLeg(e) {
    var base = e.url + (e.url.indexOf("?") < 0 ? "?" : "&");
    return String(e.layer || "").split(",").filter(function (l) { return l && l !== "*"; }).slice(0, 4).map(function (l) {
      var u = base + "SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.3.0&SLD_VERSION=1.1.0&FORMAT=image%2Fpng&STYLE=&LAYER=" + encodeURIComponent(l.trim());
      return { u: u, p: viaProxy(u) };
    });
  }
  function amostra(cor, forma) {
    var c = esc(cor || "#888");
    if (forma === "l" || forma === "L" || forma === "d") return '<s class="ln" style="background:none;border:0;border-top:' + (forma === "L" ? 3 : 2) + "px " + (forma === "d" ? "dashed" : "solid") + " " + c + ';height:0;align-self:center"></s>';
    if (forma === "p") return '<s style="background:' + c + ';border-radius:50%;flex-basis:9px;height:9px"></s>';
    return '<s style="background:' + c + '"></s>';
  }
  function htmlLinhas(leg) { return leg.map(function (x) { return '<div class="ii-r">' + amostra(x[0], x[2]) + "<span>" + esc(x[1] || "") + "</span></div>"; }).join(""); }
  function rgb(a) { return a && a.length >= 3 ? "#" + a.slice(0, 3).map(function (v) { return ("0" + (+v).toString(16)).slice(-2); }).join("") : null; }
  function dynLeg(e) {
    var d = parse(e.dyn); if (!d || !d.length) return null; var out = [];
    d.forEach(function (x) {
      var r = x.drawingInfo && x.drawingInfo.renderer; if (!r) return;
      var simb = function (s) { return s ? [rgb(s.color) || rgb(s.outline && s.outline.color), /SMS|PMS/.test(s.type || "") ? "p" : /SLS/.test(s.type || "") ? "l" : ""] : [null, ""]; };
      if (r.type === "simple") { var a = simb(r.symbol); out.push([a[0], r.label || e.n, a[1]]); }
      (r.uniqueValueInfos || r.classBreakInfos || []).forEach(function (u) { var a = simb(u.symbol); out.push([a[0], u.label || u.value || "", a[1]]); });
    });
    return out.length ? out : null;
  }
  function legendaHtml(e, alvo) {
    var L = LEG[e.id], leg = parse(e.leg);
    if (L && L.leg) leg = L.leg;
    if ((!leg || !leg.length) && e.dyn) leg = dynLeg(e);
    if ((!leg || !leg.length) && FIXAS[e.id]) {
      alvo.innerHTML = FIXAS[e.id].map(function (g) { return (g.t ? '<div class="ii-sh">' + esc(g.t) + "</div>" : "") + htmlLinhas(g.r.map(function (x) { return [x[0] || "#888", x[1], x[2]]; })); }).join("") + (L && L.txt ? '<p class="ii-m">' + esc(L.txt) + "</p>" : "");
      return;
    }
    var h = "";
    if (leg && leg.length) h += htmlLinhas(leg);
    if (L && L.txt) h += '<p class="ii-m">' + esc(L.txt) + "</p>";
    if (h) { alvo.innerHTML = h; return; }
    if (fotoLeg(e)) { alvo.innerHTML = '<p class="ii-m">' + (/infravermelho/i.test(e.n) ? "Cores virtuais de infravermelho: vegetação viva em vermelho, água em azul-escuro, solo nu e construído em tons claros." : "Imagem em cor real: não tem classes.") + "</p>"; return; }
    if (e.srup || e.pdm || /^(srup_|pdm_)/.test(e.id)) { alvo.innerHTML = '<img class="ii-w" alt="" loading="lazy" src="/wp-json/tcd/v1/wms/' + esc(e.src || e.id) + '?leg=1">'; return; }
    if (e.t === "wms" && e.url) {
      alvo.innerHTML = wmsLeg(e).map(function (x) { return '<img class="ii-w" alt="" loading="lazy" src="' + esc(x.u) + '"' + (x.p ? ' data-px="' + esc(x.p) + '"' : "") + ">"; }).join("") || simples(e);
      [].forEach.call(alvo.querySelectorAll("img[data-px]"), function (im) { im.onerror = function () { if (im.dataset.px && im.src.indexOf("/viz/px") < 0) im.src = im.dataset.px; else im.remove(); }; });
      return;
    }
    if ((e.t === "ags" || e.t === "img") && e.url) {
      alvo.innerHTML = '<p class="ii-m">A ler a legenda do serviço…</p>';
      legendaAgs(e).then(function (b) {
        alvo.innerHTML = b.map(function (g) { return (g.t ? '<div class="ii-sh">' + esc(g.t) + "</div>" : "") + g.r.map(function (x) { return '<div class="ii-r"><img alt="" src="' + esc(x.img) + '"><span>' + esc(x.txt || (g.r.length === 1 ? (e.n || "") : "")) + "</span></div>"; }).join(""); }).join("");
      }).catch(function () { alvo.innerHTML = simples(e) + '<p class="ii-m">O serviço não deu a legenda agora. <a href="' + esc(e.url.replace(/\/+$/, "") + "/legend") + '" target="_blank" rel="noopener">Ver no serviço</a></p>'; });
      return;
    }
    alvo.innerHTML = simples(e);
  }
  function simples(e) { return '<div class="ii-r"><s style="background:' + esc(e.cor || "#888") + '"></s><span>' + esc(e.n || e.id) + "</span></div>"; }

  // ── Painel ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  var CSS = "#ipr-ii{position:fixed;right:16px;top:90px;z-index:2147481500;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#2c312a);border-radius:12px;box-shadow:0 10px 32px rgba(0,0,0,.4);font:13px/1.45 Inter,sans-serif;padding:14px 16px 16px}" +
    "#ipr-ii[hidden]{display:none}#ipr-ii h3{margin:0 28px 2px 0;font:600 15px/1.3 Inter,sans-serif}#ipr-ii .ii-g{color:var(--mu,#9aa08f);font-size:11.5px;margin-bottom:10px}" +
    "#ipr-ii h4{margin:12px 0 4px;font:600 10.5px Inter,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--mu,#9aa08f)}#ipr-ii p{margin:0 0 6px}#ipr-ii a{color:#9fc7e8}" +
    "#ipr-ii .x{position:absolute;right:8px;top:8px;border:0;background:none;color:inherit;font-size:20px;line-height:1;cursor:pointer;padding:4px 8px}" +
    "#ipr-ii .ii-r{display:flex;align-items:center;gap:8px;margin:3px 0}#ipr-ii .ii-r s{flex:0 0 16px;height:11px;border-radius:2px;border:1px solid rgba(255,255,255,.18)}#ipr-ii .ii-r img{flex:0 0 20px;width:20px;height:20px;object-fit:contain}" +
    "#ipr-ii .ii-w{max-width:100%;height:auto;background:#fff;border-radius:4px;padding:4px;display:block;margin:4px 0}#ipr-ii .ii-m{color:var(--tx2,#cfd2c4);font-size:12px}#ipr-ii .ii-sh{font-size:11.5px;color:var(--mu,#9aa08f);margin:6px 0 2px}" +
    "#ipr-ii dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px}#ipr-ii dt{color:var(--mu,#9aa08f)}#ipr-ii dd{margin:0;overflow-wrap:anywhere}" +
    ".ipr-ii-b{flex:0 0 auto;width:18px;height:18px;border-radius:50%;border:1px solid currentColor;background:none;color:var(--mu,#9aa08f);font:italic 600 11px/16px Georgia,serif;text-align:center;cursor:pointer;padding:0;margin-left:4px;opacity:.8}.ipr-ii-b:hover{opacity:1;color:var(--tx,#e9eadf)}" +
    "#ipr-lgd .ipr-ii-f{display:block;font-size:10.5px;color:var(--mu,#9aa08f);margin:-1px 0 3px;font-weight:400}#ipr-lgd .ipr-ii-b{width:15px;height:15px;font-size:9.5px;line-height:13px;vertical-align:1px}" +
    "@media (max-width:700px){#ipr-ii{right:8px;left:8px;width:auto;top:auto;bottom:70px;max-height:60vh}}";
  function css() { if (D.getElementById("ipr-ii-css")) return; var s = D.createElement("style"); s.id = "ipr-ii-css"; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }
  var painel = null;
  function abrir(id) {
    var e = cat()[id]; if (!e) return; css();
    if (!painel) {
      painel = D.createElement("div"); painel.id = "ipr-ii"; painel.setAttribute("role", "dialog"); painel.hidden = true; D.body.appendChild(painel);
      painel.addEventListener("click", function (ev) { if (ev.target.closest(".x")) fechar(); });
      D.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && painel && !painel.hidden) fechar(); });
      ["mousedown", "touchstart", "wheel"].forEach(function (k) { painel.addEventListener(k, function (ev) { ev.stopPropagation(); }, { passive: true }); });
    }
    var E = en(), f = fonte(e), sv = servico(e), nome = (E && e.en) || e.n || id;
    var h = '<button type="button" class="x" aria-label="' + (E ? "Close" : "Fechar") + '">×</button><h3>' + esc(nome) + "</h3>" +
      '<div class="ii-g">' + esc([e.sub, e.g && e.g !== e.sub ? "" : ""].filter(Boolean).join(" · ")) + "</div>" +
      "<h4>" + (E ? "What it is" : "O que é") + "</h4><p>" + esc(desc(e) || (E ? "No description yet." : "Sem descrição.")) + "</p>" +
      (e.nota && DESC[e.id] && e.nota !== DESC[e.id] ? '<p class="ii-m">' + esc(e.nota) + "</p>" : "") +
      "<h4>" + (E ? "Source" : "Fonte") + "</h4><dl>" +
      "<dt>" + (E ? "Entity" : "Entidade") + "</dt><dd>" + (f.link ? '<a href="' + esc(f.link) + '" target="_blank" rel="noopener">' + esc(f.ent) + "</a>" : esc(f.ent)) + "</dd>" +
      (e.fonte && e.fonte !== f.ent ? "<dt>" + (E ? "Credit" : "Crédito") + "</dt><dd>" + esc(e.fonte) + "</dd>" : "") +
      (f.lic ? "<dt>" + (E ? "Licence" : "Licença") + "</dt><dd>" + esc(f.lic) + "</dd>" : "") +
      (LICVIS[e.lic] ? "<dt>" + (E ? "Use" : "Uso") + "</dt><dd>" + esc(LICVIS[e.lic]) + "</dd>" : "") +
      (sv ? "<dt>" + (E ? "Service" : "Serviço") + '</dt><dd><a href="' + esc(sv) + '" target="_blank" rel="noopener">' + esc(sv.replace(/^https?:\/\//, "").slice(0, 70)) + "</a></dd>" : "") +
      (e.minz ? "<dt>" + (E ? "Visible" : "Visível") + "</dt><dd>" + (E ? "from zoom " : "a partir do nível ") + esc(e.minz) + "</dd>" : "") +
      "</dl><h4>" + (E ? "Legend" : "Legenda") + '</h4><div class="ii-leg"></div>';
    painel.innerHTML = h; painel.hidden = false;
    legendaHtml(e, painel.querySelector(".ii-leg"));
    var b = painel.querySelector(".x"); if (b) b.focus();
  }
  function fechar() { if (painel) painel.hidden = true; }
  W.__iprInfoAbrir = abrir;

  // ── Botões nas listas e na caixa de legenda ────────────────────────────────────────────────────────────────────────
  function botao(id) {
    var b = D.createElement("button"); b.type = "button"; b.className = "ipr-ii-b"; b.textContent = "i"; b.dataset.ii = id;
    b.title = en() ? "About this layer: what it is, source, legend" : "Sobre esta camada: o que é, fonte, legenda"; b.setAttribute("aria-label", b.title);
    return b;
  }
  D.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".ipr-ii-b"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation(); abrir(b.dataset.ii);
  }, true);
  function nomeLeg(t) { return String(t || "").trim(); }
  function decorar() {
    css(); var C = cat(); if (!Object.keys(C).length) return;
    [].forEach.call(D.querySelectorAll("li.ipr-it[data-id], li.ipr-cq-it[data-id]"), function (li) {
      var id = li.getAttribute("data-id"); if (!C[id] || li.querySelector(".ipr-ii-b")) return;
      var alvo = li.querySelector(".ipr-nome, .ipr-cq-n") || li; alvo.appendChild(botao(id));
    });
    var box = D.getElementById("ipr-lgd"); if (!box || box.hidden) return;
    var porNome = {}; Object.keys(C).forEach(function (id) { var e = C[id]; porNome[nomeLeg(e.n)] = id; if (e.en) porNome[nomeLeg(e.en)] = id; });
    [].forEach.call(box.querySelectorAll(".c > .l > b, .c > .one > span"), function (t) {
      if (t.querySelector(".ipr-ii-b") || (t.nextSibling && t.nextSibling.className === "ipr-ii-f")) return;
      var id = porNome[nomeLeg(t.textContent)]; if (!id) return; var e = C[id], f = fonte(e);
      t.appendChild(botao(id));
      var fs = D.createElement("span"); fs.className = "ipr-ii-f"; fs.textContent = (en() ? "Source: " : "Fonte: ") + (e.fonte || f.ent);
      if (t.tagName === "B") t.parentNode.insertBefore(fs, t.nextSibling);
      else t.parentNode.parentNode.insertBefore(fs, t.parentNode.nextSibling);
      // Camada ArcGIS/WMS que ficou só com o nome: completar com a legenda do serviço (directo ou pelo proxy).
      if (t.tagName === "SPAN" && !LEG[id] && ((e.t === "ags" || e.t === "img" || e.t === "wms") && e.url) && !(parse(e.leg) || []).length) {
        var d = D.createElement("div"); d.className = "ipr-ii-auto"; fs.parentNode.insertBefore(d, fs.nextSibling);
        legendaHtml(e, d);
        d.style.cssText = "margin:0 0 4px 21px";
      }
    });
  }
  setInterval(function () { if (!D.hidden) try { decorar(); } catch (e) {} }, 1300);
})();
