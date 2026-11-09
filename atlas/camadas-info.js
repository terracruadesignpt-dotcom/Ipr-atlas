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
  // dos serviços nem do proxy do site. Lidas a 4/11/2026 (drawingInfo de cada camada).
  var FIXAS = /*LEGENDAS*/{"poc_area":[{"t":"","r":[["#000000","Área de intervenção"]]}],"poc_ztp":[{"t":"","r":[["#3c6400","Faixa de proteção costeira"],["#6ec800","Faixa de proteção complementar"]]}],"poc_margem":[{"t":"","r":[["#ffff00","Margem das águas do mar"]]}],"poc_faixas":[{"t":"Faixa de salvaguarda ao galgamento e inundação costeira","r":[["#730000","Nível I"],["#730000","Nível II"]]},{"t":"Faixa de salvaguarda à erosão costeira","r":[["#ff0000","Nível I"],["#ff0000","Nível II"]]},{"t":"Faixa de salvaguarda ao galgamento e inundação costeira","r":[["#730000","Nível I"],["#730000","Nível II"]]},{"t":"Faixa de salvaguarda à erosão costeira","r":[["#ff0000","Nível I"],["#ff0000","Nível II"]]},{"t":"Faixa de salvaguarda para o mar","r":[["#004b96","Faixa de salvaguarda para o mar"]]},{"t":"Faixa de salvaguarda para terra","r":[["#a500fa","Nível I"],["#a900e6","Nível II"]]},{"t":"Área de instabilidade potencial","r":[["#ff73df","Área de instabilidade potencial"]]},{"t":"Faixas de salvaguarda à erosão costeira – Nível I","r":[["#ff0000","Faixas de salvaguarda à erosão costeira – Nível I"]]},{"t":"Faixas de salvaguarda à erosão costeira – Nível II","r":[["#ff0000","Faixas de salvaguarda à erosão costeira – Nível II"]]},{"t":"Faixas de salvaguarda ao galgamento e inundação costeira – Nível I","r":[["#730000","Faixas de salvaguarda ao galgamento e inundação costeira – Nível I"]]},{"t":"Faixas de salvaguarda ao galgamento e inundação costeira – Nível II","r":[["#730000","Faixas de salvaguarda ao galgamento e inundação costeira – Nível II"]]},{"t":"Faixa de salvaguarda para o mar","r":[["#004b96","Faixa de salvaguarda para o mar"]]},{"t":"Faixa de salvaguarda para terra","r":[["#a500fa","Nível I"],["#a500fa","Nível II"]]},{"t":"Área de instabilidade potencial","r":[["#ff73df","Área de instabilidade potencial"]]},{"t":"Faixas de salvaguarda à erosão costeira  (mt_fsl_arenoso_fsec_2020_03_03)","r":[["#fa3411","Nivel I"],["#fa3411","Nivel II"]]},{"t":"Faixas de salvaguarda ao galgamento e inundação costeira  (mt_fsl_arenoso_fsgic_2020_03_03)","r":[["#730000","Nivel I"],["#730000","Nivel II"]]},{"t":"Faixa de salvaguarda para terra  (mt_fsl_arriba_2022_08_04)","r":[["#a500fa","Nível I"],["#a900e6","Nível II"]]},{"t":"Áreas de Instabilidade Potencial  (mt_fsl_arriba_aip_2022_08_04)","r":[["#f57ab6","Áreas de Instabilidade Potencial  (mt_fsl_arriba_aip_2022_08_04)"]]},{"t":"Faixa de salvaguarda para o mar  (mt_fsl_arriba_mar_2022_08_04)","r":[["#004b96","Faixa de salvaguarda para o mar  (mt_fsl_arriba_mar_2022_08_04)"]]}],"poc_critica":[{"t":"","r":[["#000000","Proteção"],["#000000","Acomodação"],["#000000","Requalificação"],["#000000","Proteção/Acomodação"],["#000000","Recuo planeado"],["#c500ff","Recuo planeado/Acomodação"],["#0070ff","Recuo planeado/Proteção"],["#000000","Área sujeita a estudo"],["#000000","Contenção"],["#000000","Relocalização"],["#ff7f7f","Reabilitação urbana / Regeneração"],["#ff7f7f","Reabilitação urbana / Regeneração"],["#ff7f7f","Reconversão"]]}],"hidro_g":[{"t":"Rede hidrográfica GeoCodificada (zoom 4)","r":[["#33ccff","Rede hidrográfica GeoCodificada (zoom 4)"]]},{"t":"Rede hidrográfica GeoCodificada (zoom 3)","r":[["#33ccff","Rede hidrográfica GeoCodificada (zoom 3)"]]},{"t":"Rede hidrográfica GeoCodificada (zoom 2)","r":[["#33ccff","Rede hidrográfica GeoCodificada (zoom 2)"]]},{"t":"Rede hidrográfica GeoCodificada (zoom 1)","r":[["#33ccff","Rede hidrográfica GeoCodificada (zoom 1)"]]}],"rh":[{"t":"","r":[["#9966ff","Regiao hidrografica"]]}],"bacias":[{"t":"Bacias dos troços de linha de água GeoCodificadas","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (4º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (4º nível)"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (3º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (3º nível)"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (2º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (2º nível)"]]}],"massas":[{"t":"","r":[["#5893a9","Excelente"],["#6eb327","Bom"],["#fff6a6","Razoável"],["#f6a800","Medíocre"],["#e63d5b","Mau"],["#cccccc","Desconhecido"]]}],"inund":[{"t":"","r":[["#97dbf2","Limite"]]}],"arpsi":[{"t":"","r":[["#e60000","Zonas c/ risco potencial signif. de inundação"]]}],"hidrog":[{"t":"","r":[["#bee8ff","T - Bacia Tejo-Sado"],["#ffffbe","A - Maciço Antigo"],["#d1ff73","M - Orla Meridional"],["#ffbebe","O - Orla Ocidental"]]}],"apasub":[{"t":"","r":[[null,"Ponto de observação"]]}],"ma_ecol":[{"t":"SWB: Estado/Potencial Rios","r":[["#5893a9","1 = Excelente/Máximo"],["#6eb327","2 = Bom"],["#fff6a6","3 = Razoável"],["#f6a800","4 = Medíocre"],["#e63d5b","5"]]},{"t":"SWB: Estado/Potencial Lagos (Albufeiras)","r":[["#6eb327","2 = Bom"],["#fff6a6","3 = Razoável"],["#f6a800","4 = Medíocre"],["#e63d5b","5 = Mau"],["#cccccc","U = Desconhecido"]]}],"ma_quant":[{"t":"","r":[["#5893a9","2 = Bom"],["#e63d5b","3 = Medíocre"]]}],"wei":[{"t":"","r":[["#fff2cc","[0% - 10%["],["#ffe699","[10% - 20%["],["#ffd966","[0% - 30%["],["#bf8e00","[30% - 50%["],["#806000","[50% - 70%["],["#c00000","[70% - 100%]"]]}],"wei_sub":[{"t":"","r":[["#fff2cc","[0% - 10%["],["#ffe699","[10% - 20%["],["#ffd966","[0% - 30%["],["#bf8e00","[30% - 50%["],["#806000","[50% - 70%["],["#c00000","[70% - 100%]"]]}],"barragens":[{"t":"Grandes barragens (RSB)","r":[[null,"Grandes barragens (RSB)"]]},{"t":"Barragens (RPB) e açudes","r":[[null,"RPB - altura >=10m e <15m"],[null,"RPB - altura >=5m e <10m"],[null,"RPB - altura >=2m e <5m"],[null,"RPB - altura >=2m"],[null,"Altura < 2m"],[null,"Reservatório"]]},{"t":"Açudes com altura inferior 2 m","r":[[null,"Açudes com altura inferior 2 m"]]}],"etar":[{"t":"ETARs","r":[[null,"ETARs"]]},{"t":"Pontos de descarga","r":[[null,"Pontos de descarga"]]}],"nitratos":[{"t":"","r":[["#ffffad","Zona vulnerável"]]}],"zprot":[{"t":"PA_BA: Águas Balneares","r":[[null,"PA_BA: Águas Balneares"]]},{"t":"PA_A7: Captação de água superficial","r":[[null,"PA_A7: Captação de água superficial"]]},{"t":"PA_FI: Águas Piscícolas","r":[["#bed2ff","PA_FI: Águas Piscícolas"]]},{"t":"PA_SH: Águas conquícolas","r":[["#dee9ff","PA_SH: Águas conquícolas"]]},{"t":"PA_UW: Zonas Sensíveis","r":[["#feffb3","PA_UW: Zonas Sensíveis"]]},{"t":"PA_NI: Zonas Vulneráveis","r":[["#feffb3","PA_NI: Zonas Vulneráveis"]]}],"albpub":[{"t":"","r":[["#ccffff","Albufeira de águas públicas"]]}],"zadj":[{"t":"","r":[["#ffaa00","Ocupação edificada condicionada"],["#ff0000","Ocupação edificada proibida"],["#828282","Ocupação edificada: consultar legislação"]]}],"marcas":[{"t":"","r":[[null,"Marca de cheia SNIRH"]]}],"scs":[{"t":"","r":[["#6ea122","A"],["#3e93b5","B"],["#267300","C"],["#ffff73","D"]]}],"cn":[{"t":"","r":[[null,"30"],[null,"31 - 40"],[null,"41 - 50"],[null,"51 - 55"],[null,"56 - 60"],[null,"61 - 65"],[null,"66 - 70"],[null,"71 - 75"],[null,"76 - 80"],[null,"81 - 85"],[null,"86 - 90"],[null,"91 - 95"],[null,"96 - 100"]]}],"esc_med":[{"t":"","r":[[null,"Inferior a 25 mm"],[null,"Entre 25 e 50 mm"],[null,"Entre 50 e 100 mm"],[null,"Entre 100 e 150 mm"],[null,"Entre 150 e 200 mm"],[null,"Entre 200 e 300 mm"],[null,"Entre 300 e 400 mm"],[null,"Entre 400 e 600 mm"],[null,"Entre 600 e 800 mm"],[null,"Entre 800 e 1000 mm"],[null,"Entre 1000 e 1400 mm"],[null,"Entre 1400 e 1800 mm"],[null,"Entre 1800 e 2200 mm"],[null,"Superior a 2200 mm"]]}],"precip":[{"t":"","r":[[null,"386 - 400"],[null,"401 - 500"],[null,"501 - 600"],[null,"601 - 700"],[null,"701 - 800"],[null,"801 - 900"],[null,"901 - 1 000"],[null,"1 001 - 1 200"],[null,"1 201 - 1 400"],[null,"1 401 - 1 600"],[null,"1 601 - 1 800"],[null,"1 801 - 2 000"],[null,"2 001 - 2 200"],[null,"2 201 - 2 400"],[null,"2 401 - 2 600"],[null,"2 601 - 2 800"],[null,"2 801 - 3 000"],[null,"3 001 - 3 829"]]}],"erosiv":[{"t":"","r":[[null,"<100"],[null,"101 - 200"],[null,"201 - 300"],[null,"301 - 400"],[null,"401 - 500"],[null,"501 - 600"],[null,"601 - 700"],[null,"701 - 800"],[null,">800"]]}],"hidrom":[{"t":"Estações Hidrométricas Activas","r":[[null,"Estações Hidrométricas Activas"]]},{"t":"Rede Meteorológica","r":[[null,"indeterminado"],[null,"Climatológica"],[null,"Climatológica flutuante"],[null,"Udográfica"]]}],"piezo":[{"t":"","r":[[null,"Rede de Monit. do Estado Quant. das Águas Subterrâneas"]]}],"bac_troco":[{"t":"Bacias dos troços de linha de água GeoCodificadas","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (4º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (4º nível)"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (3º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (3º nível)"]]},{"t":"Bacias dos troços de linha de água GeoCodificadas (2º nível)","r":[["#0066ff","Bacias dos troços de linha de água GeoCodificadas (2º nível)"]]}],"sroa":[{"t":"","r":[["#0070ff","Classe A (Agrícola) - Sem limitações"],["#73dfff","Classe B (Agrícola) - Limitações moderadas"],["#ff5500","Classe C (Agrícola) - Condicionada por limitações acentuadas"],["#ffaa00","Classe D (Não Agrícola, Florestal) - Limitações moderadas"],["#ffff73","Classe E (Não Agrícola, Florestal) - Limitações severas"],["#38a800","Classes A ou B+C (Complexos)"],["#c500ff","Classes A ou B+D ou E (Complexos)"],["#a87000","Classes C+D ou E  (Complexos)"],["#73b2ff","Classe A (Agrícola)"],["#ff5500","Classe C (Agrícola Condicionada)"],["#ffed82","Classe F (Não Agrícola, Florestal)"],["#38a800","Classes A+C (Complexos)"],["#c500ff","Classes A+F  (Complexos)"],["#a87000","Classes C+F  (Complexos)"],["#00a9e6","Salinas e Sapais"],["#cccccc","Áreas Sociais"],["#bee8ff","Rios, Lagoas e Albufeiras"]]}],"contam":[{"t":"Postos de abastecimento (ponto)","r":[[null,"1 - Local avaliado não contaminado"],[null,"2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],[null,"3 - Local remediado, com ou sem monitorização pós-remediação"],[null,"4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],[null,"5 - Local em remediação"],[null,"6 - Local potencialmente contaminado"],[null,"7 - Local contaminado sem AQR"],[null,"8 - Local contaminado, com risco inaceitável"]]},{"t":"Passivos ambientais mineiros (ponto)","r":[[null,"1 - Local avaliado não contaminado"],[null,"2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],[null,"3 - Local remediado, com ou sem monitorização pós-remediação"],[null,"4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],[null,"5 - Local em remediação"],[null,"6 - Local potencialmente contaminado"],[null,"7 - Local contaminado sem AQR"],[null,"8 - Local contaminado, com risco inaceitável"]]},{"t":"Outras atividades industriais e comerciais (ponto)","r":[[null,"1 - Local avaliado não contaminado"],[null,"2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],[null,"3 - Local remediado, com ou sem monitorização pós-remediação"],[null,"4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],[null,"5 - Local em remediação"],[null,"6 - Local potencialmente contaminado"],[null,"7 - Local contaminado sem AQR"],[null,"8 - Local contaminado, com risco inaceitável"]]},{"t":"Antigas lixeiras municipais encerradas (ponto)","r":[[null,"1 - Local avaliado não contaminado"],[null,"2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],[null,"3 - Local remediado, com ou sem monitorização pós-remediação"],[null,"4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],[null,"5 - Local em remediação"],[null,"6 - Local potencialmente contaminado"],[null,"7 - Local contaminado sem AQR"],[null,"8 - Local contaminado, com risco inaceitável"]]},{"t":"PCIP e PAG (ponto)","r":[[null,"1 - Local avaliado não contaminado"],[null,"2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],[null,"3 - Local remediado, com ou sem monitorização pós-remediação"],[null,"4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],[null,"5 - Local em remediação"],[null,"6 - Local potencialmente contaminado"],[null,"7 - Local contaminado sem AQR"],[null,"8 - Local contaminado, com risco inaceitável"]]},{"t":"Locais onde tenham sido abandonados resíduos perigosos (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Postos de abastecimentos privados ou desativos (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Passivos ambientais mineiros (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Passivos ambientais industriais (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Outras atividades industriais e comerciais (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Novos passivos ambientais (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Exploração hidrocarbonetos e outros combustíveis fósseis (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Exploração de depósitos minerais radioativos (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Exploração de depósitos minerais metálicos (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"PCIP e PAG I (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"PCIP e PAG II (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Locais contaminados objeto de operações urbanísticas (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]},{"t":"Locais contaminados por acidentes com resíduos perigosos (polígono)","r":[["#bdd6ee","1 - Local avaliado não contaminado"],["#8aa527","2 - Local avaliado com risco aceitável, sem necessidade de medidas de gestão de risco"],["#a8d08d","3 - Local remediado, com ou sem monitorização pós-remediação"],["#c5e0b3","4 - Local remediado, mas com necessidade de medidas de gestão de risco, com ou sem monitorização pós-remediação"],["#ffd55d","5 - Local em remediação"],["#fe9306","6 - Local potencialmente contaminado"],["#fc4f20","7 - Local contaminado sem AQR"],["#ff0000","8 - Local contaminado, com risco inaceitável"]]}],"la350":[{"t":"","r":[["#005ce6","Linhas de água com bacia hidrográfica > 350 Ha"]]}],"albzr":[{"t":"","r":[["#00c5ff","Albufeiras, Lagoas ou Lagos de Águas Públicas: Zona Reservada (100m)"]]}],"capt":[{"t":"Proteção imediata captação subterrânea","r":[["#e60000","Proteção imediata captação subterrânea"]]},{"t":"Proteção intermédia captação subterrânea","r":[["#e6e600","Proteção intermédia captação subterrânea"]]},{"t":"Proteção alargada captação subterrânea","r":[["#38a800","Proteção alargada captação subterrânea"]]},{"t":"Proteção especial captação subterrânea","r":[["#000000","Proteção especial captação subterrânea"]]},{"t":"Proteção imediata captação superficial","r":[["#ffff00","Proteção imediata captação superficial"]]},{"t":"Proteção alargada captação superficial","r":[["#38a800","Proteção alargada captação superficial"]]}],"dph_dem":[{"t":"LMPAVE","r":[["#0070ff","LMPAVE"]]},{"t":"LLL","r":[["#ff0000","LLL"]]},{"t":"CRISTA ARRIBA","r":[["#c500ff","CRISTA_ARRIBA"]]},{"t":"LLM","r":[["#ffff00","LLM"]]},{"t":"LLJANA","r":[["#e69800","LLJANA"]]}],"dph_autos":[{"t":"Vértices de delimitação do DH","r":[[null,"Vértices de delimitação do DH"]]},{"t":"Poligonais de delimitação do DH","r":[["#f255e0","DPH"],["#55ff00","DPE"]]}],"lagoas_pub":[{"t":"","r":[["#ccffff","Lagoa ou lago de águas públicas"]]}],"poaap":[{"t":"","r":[["#a80000","Zona de respeito da barragem e dos órgãos de segurança e de utilização da albufeira"],["#a80000","Zona de respeito da barragem e dos órgãos de segurança e utilização da albufeira"],["#a80000","Zona de respeito à barragem e orgãos de segurança"],["#bed2ff","Zona com aptidão para a instalação de um clube náutico"],["#004da8","Zona de protecção às estruturas submersas"],["#6e6e6e","Zona de pesca"],["#6e6e6e","Zona preferenciais para a pesca desportiva"],["#732600","Zona para instalação de rampa varadouro e pontão flutuante"],["#734c00","Zona para fundear embarcações"],["#ffaa00","Zona de navegação condicionada"],["#e60000","Zona de navegação restrita (R)"],["#e60000","Zona reservada (50m)"],["#e60000","Zona reservada"],["#00c5ff","Zona condicionada"],["#97dbf2","Zona de navegação livre (L)"],["#beffe8","Zona para a prática de navegação sem motor"],["#beffe8","Zona de navegação recreativa"],["#b6f4fc","Zona de utilização livre"],["#e9ffbe","Zonas de lazer ribeirinho"],["#e9ffbe","Zona de recreio e lazer"]]}],"pgri_perigo":[{"t":"","r":[["#ff0000","Alto - Muito Alto"],["#ffff00","Médio"],["#38a800","Baixo - Muito Baixo"]]}],"inund20":[{"t":"","r":[["#004c73","Área de Inundação - Probabilidade Elevada"]]}],"inund100":[{"t":"Área de Inundação - Probabilidade Média","r":[["#005ce6","Área de Inundação - Probabilidade Média"]]},{"t":"Área de Inundação - Probabilidade Média","r":[["#6dbb43","Área de Inundação - Probabilidade Média"]]}],"inund1000":[{"t":"","r":[["#00a9e6","Área de Inundação - Probabilidade Baixa"]]}],"perigo_igt":[{"t":"","r":[["#ff0000","Alto - Muito Alto"],["#ffff00","Médio"],["#38a800","Baixo - Muito Baixo"]]}],"cotas_cheia":[{"t":"","r":[["#ffffbf","Cotas de Cheia"]]}],"eventos_cheia":[{"t":"","r":[[null,"Eventos Reportados"]]}],"arpsi3":[{"t":"","r":[["#704489","União"],["#4ce600","Extensão"],["#e69800","Nova ARPSI"]]}],"alb_snirh":[{"t":"","r":[[null,"Albufeiras (Barragem)"]]}],"alb_bacia":[{"t":"","r":[["#73dfff","Albufeiras (Barragem) - Bacias drenantes"]]}],"precmax":[{"t":"","r":[[null,"50-60"],[null,"61 - 75"],[null,"76 - 100"],[null,"101 - 125"],[null,"126 - 150"],[null,"151 - 175"],[null,"176 - 200"],[null,"201 - 225"],[null,"226 - 250"],[null,"251 - 275"],[null,"276 - 300"]]}],"etr":[{"t":"","r":[["#e6d3d9","Inferior a 400"],["#d9b2d4","Entre 400 e 450"],["#cd92d1","Entre 450 e 500"],["#bf72cc","Entre 500 e 600"],["#b254c7","Entre 600 e 700"],["#a134bf","Entre 700 e 800"],["#9200ba","Superior a 800"]]}],"temp_med":[{"t":"","r":[["#ffffe8","Inferior a 7.5"],["#fffbc2","Entre 7.5 e 10.0"],["#fff39c","Entre 10.0 e 12.5"],["#ffe875","Entre 12.5 e 15.0"],["#ffd94f","Entre 15.0 e 16.0"],["#ffc629","Entre 16.0 e 17.5"],["#ffae00","Superior a 17.5"]]}],"geada_ano":[{"t":"","r":[["#e3dcdc","Inferior a 1"],["#ced2d6","Entre 1 e 2"],["#b6c7cf","Entre 2 e 3"],["#9fbcc7","Entre 3 e 4"],["#88b0bf","Entre 4 e 5"],["#73a7ba","Entre 5 e 6"],["#5d9cb3","Entre 6 e 7"],["#4692ab","Entre 7 e 8"],["#2e8aa6","Entre 8 e 9"],["#007e9e","Superior a 9"]]}],"geada_dias":[{"t":"","r":[["#e3d4c8","Inferior a 1"],["#e3cec1","Entre 1 e 5"],["#e3c7ba","Entre 5 e 10"],["#e3c0b6","Entre 10 e 20"],["#e6bbb3","Entre 20 e 30"],["#e6b5b1","Entre 30 e 40"],["#e3acae","Entre 40 e 50"],["#e3a8b0","Entre 50 e 60"],["#e0a2b1","Entre 60 e 70"],["#de9eb4","Entre 70 e 80"],["#d998b7","Superior a 80"]]}],"est_qual":[{"t":"","r":[[null,"Est. de monitorização da qualidade das águas superficiais"]]}],"zon_eco":[{"t":"","r":[["#ffffdc","OA - Oro-atlântica"],["#ffffdc","OA - Oro-atlântica"],["#ffffdc","A.SA.OA"],["#ffffdc","A.SA.OA"],["#ffffdc","SA.OA"],["#d7d79e","A.SA"],["#a8a800","SA - Subatlântica"],["#cd8966","I.SA"],["#000000","I - Ibérica (s/ representação Cont. Português)"],["#00a884","SA.A.MA"],["#66cdab","SA.MA"],["#b4d79e","SA.MA.AM"],["#000000","SA.MA.AM (variante litoral)"],["#ffff73","SA.AM"],["#ffd37f","SA.SM"],["#ffbebe","SA.SM.IM"],["#00a69e","SÄ - Termo-subatlântica"],["#38a800","SÄ.SM"],["#000000","A - Atlântica (s/ representação Cont. Português)"],["#66cdab","MA - Mediterrâneo-atlântica"]]}],"reg_nat":[{"t":"","r":[["#ff0000","5a. Reg. Naturais (Divisão Regional)"]]}],"paisagem":[{"t":"","r":[["#00e6a9","Ribeira atlântica (regadio estreme)"],["#bfd7b0","Ribeira subatlântica (regadio dominante)"],["#4ce600","Ribeira subatlântica (regadio dominado)"],["#00c5ff","Leziria, regadios mediterrâneos"],["#d3ffbe","Policultura submediterrânea"],["#ffbee8","Policultura algarvia (eumediterranea)"],["#73b273","Gândara (tojal, sub-serra nordestina)"],["#cdaa66","Montanhas de granito e xisto (nível pastoril)"],["#d4e1e1","Montanhas de granito e xisto (nível florestal)"],["#ffff73","Terra quente transmontana (policultura)"],["#deb866","Meia-encosta nordestina"],["#de9e66","Terra fria transmontana"],["#f6c567","Douro vinhateiro (monocultural)"],["#adbf00","Sub-serra erminiana"],["#89cd66","Charneca (mata baixa durifólia)"],["#ffe5be","Campina (sequeiro estreme)"],["#ffcfbe","Montado (sobro e azinho)"],["#448970","Marinha (pinhal denso em dunas)"],["#e1e1c4","Dunas litorais"],["#ffe0f0","Relevos calcários"],["#004da8","Formações lagunares e sapais"],["#0070ff","Rios, lagoas e albufeiras"],["#000000","Áreas metropolitanas"]]}],"fitogeo":[{"t":"","r":[["#beffe8","Noroeste Ocidental"],["#d3ffbe","Noroeste Montanhoso"],["#96dbf2","Nordeste Leonês"],["#829482","Nordeste ultrabásico"],["#74b374","Terra Fria"],["#4d7811","Terra Quente"],["#ffff00","Centro-Oeste arenoso"],["#f5d800","Centro-Oeste calcário"],["#edb600","Centro-Oeste olissiponense"],["#e69900","Centro-Oeste cintrano"],["#ffff73","Centro-Norte"],["#e6d26e","Centro-Leste montanhoso"],["#ccaa66","Centro-Leste de campina"],["#fff5bf","Centro-Sul Miocénico"],["#d4b350","Centro-Sul Plistocénico"],["#a87000","Centro-Sul arrabidense"],["#ffebbf","Sudoeste setentrional"],["#e8d6ff","Sudoeste meridional"],["#8400a8","Sudoeste montanhoso"],["#d69c9c","Sudeste setentrional"],["#c985bd","Sudeste meridional"],["#3d9bff","Barrocal algarvio"],["#deb87a","Barlavento"],["#fa7900","Sotavento"],["#000000","Área metropolitana"],["#bfe9ff","Planos de água"],["#bfe9ff","Planos de água"]]}],"insolacao":[{"t":"","r":[["#ffffd4","Inferior a 1800"],["#fffac7","Entre 1800 e 1900"],["#fff4b8","Entre 1900 e 2000"],["#ffeca8","Entre 2000 e 2100"],["#ffe099","Entre 2100 e 2200"],["#ffd48a","Entre 2200 e 2300"],["#ffc67a","Entre 2300 e 2400"],["#ffb56b","Entre 2400 e 2500"],["#ffa05c","Entre 2500 e 2600"],["#ff8b4d","Entre 2600 e 2700"],["#ff743d","Entre 2700 e 2800"],["#ff582e","Entre 2800 e 2900"],["#ff3d1f","Entre 2900 e 3000"],["#ff1f0f","Entre 3000 e 3100"],["#ff0000","Superior a 3100"]]}],"radiacao":[{"t":"","r":[["#ffffe8","Inferior a 140"],["#fffbc2","Entre 140 e 145"],["#fff39c","Entre 145 e 150"],["#ffe875","Entre 150 e 155"],["#ffd94f","Entre 155 e 160"],["#ffc629","Entre 160 e 165"],["#ffae00","Superior a 165"]]}],"humidade":[{"t":"","r":[["#edffff","Inferior a 65"],["#bff9ff","Entre 65 e 70"],["#8fe7ff","Entre 70 e 75"],["#61caff","Entre 75 e 80"],["#30a2ff","Entre 80 e 85"],["#006fff","Superior a 85"]]}],"aq_residuo":[{"t":"","r":[["#b5f7dc","Entre 20 e 60"],["#6fdec0","Entre 60 e 150"],["#00c2ae","Entre 60 e 250"],["#dbf5c4","Entre 100 e 400"],["#c1f59d","Entre 200 e 400"],["#a5f57a","Entre 300 e 600"],["#ffdbb0","Entre 400 e 800"],["#ffc599","Entre 500 e 1000"],["#ffa880","Entre 600 e 1200"],["#ffbfbf","Entre 600 e 1500"],["#ff887d","Entre 700 e 1000"],["#ff5d38","Entre 800 e 1500"]]}],"aq_cloretos":[{"t":"","r":[["#b5f7dc","Entre 5 e 20"],["#70e6c0","Entre 5 e 25"],["#35d4b1","Entre 10 e 25"],["#00c2ae","Entre 10 e 30"],["#dbf5c4","Entre 20 e 50"],["#c3f59f","Entre 30 e 50"],["#a5f57a","Entre 30 e 75"],["#ffdbb0","Entre 30 e 100"],["#ffcda1","Entre 50 e 100"],["#ffbb91","Entre 50 e 200"],["#ffa880","Entre 75 e 200"],["#ffbfbf","Entre 100 e 300"],["#ff887d","Entre 200 e 500"],["#ff5d38","Entre 300 e 500"]]}],"aq_sulfatos":[{"t":"","r":[["#b2dbc2","Entre 0 e 5"],["#6dc9a9","Entre 0 e 10"],["#32b8af","Entre 0 e 20"],["#0084a8","Entre 10 e 20"],["#b5f7dc","Entre 0 e 30"],["#51dbb6","Entre 5 e 30"],["#00c2ae","Entre 10 e 30"],["#d6eb8a","Entre 5 e 50"],["#a5d455","Entre 10 e 50"],["#6fbd26","Entre 20 e 50"],["#38a800","Entre 30 e 50"],["#dbf5c4","Entre 20 e 75"],["#cbf5ab","Entre 30 e 75"],["#baf593","Entre 30 e 100"],["#a5f57a","Entre 30 e 125"]]}],"aq_dureza":[{"t":"","r":[["#b2dbc2","Entre 0 e 50, Inferior a 50, Inferior a 50"],["#4fc2ab","Entre 0 e 100, Entre 0 e 50, Entre 0 e 50"],["#0084a8","Entre 50 e 100, Entre 0 e 50, Entre 0 e 50"],["#dbf5c4","Entre 50 e 200, Entre 0 e 100, Entre 0 e 100"],["#a5f57a","Entre 100 e 200, Entre 50 e 150, Entre 0 e 100"],["#ffffe8","Entre 100 e 300, Entre 0 e 100, Entre 100 e 200"],["#fffeb0","Entre 100 e 300, Entre 50 e 150, Entre 50 e 200"],["#fffd75","Entre 100 e 300, Entre 50 e 200, Entre 50 e 150"],["#fff83b","Entre 200 e 300, Entre 100 e 150, Entre 50 e 150"],["#fff700","Entre 200 e 300, Entre 150 e 200, Entre 50 e 100"],["#ffdbb0","Entre 200 e 400, Entre 100 e 200, Entre 100 e 200"],["#ffc599","Entre 200 e 400, Entre 150 e 250, Entre 50 e 200"],["#ffa880","Entre 300 e 400, Entre 150 e 250, Entre 100 e 150"],["#ffbfbf","Entre 300 e 500, Entre 150 e 200, Entre 150 e 300"],["#ff9994","Entre 300 e 500, Entre 200 e 350, Entre 100 e 200"],["#ff7866","Entre 400 e 500, Entre 200 e 300, Entre 150 e 200"],["#ff5d38","Entre 400 e 500, Entre 250 e 350, Entre 150 e 200"]]}],"bupi":[{"t":"","r":[["#85add2","Dados Abertos - RGG Continente"]]}],"n2k":[{"t":"Zonas de Proteção Especial","r":[["#00a9e6","ZPE"]]},{"t":"Sítios de Importância Comunitária","r":[["#f5ca7a","SIC"]]}],"rnap":[{"t":"","r":[["#a7c7b3","RNAP - Limites"]]}],"peap_rp":[{"t":"","r":[["#00b04f","Parcial Tipo I"],["#00ff00","Parcial Tipo II"],["#964706","Complementar Tipo I"],["#ffbf00","Complementar Tipo I"],["#808080","Área Não Abrangida por Regimes de Proteção"]]}],"peap_aie":[{"t":"Áreas de Intervenção Específica - Polígono","r":[["#000000","Áreas de Intervenção Específica - Polígono"]]},{"t":"Áreas de Intervenção Específica - Ponto","r":[[null,"Áreas de Intervenção Específica - Ponto"]]}],"zec_so":[{"t":"","r":[["#f5ca7a","SIC"]]}],"perig_e":[{"t":"","r":[[null,"Muito Baixa"],[null,"Baixa"],[null,"Média"],[null,"Alta"],[null,"Muito Alta"]]}],"perig":[{"t":"","r":[[null,"Muito Baixa"],[null,"Baixa"],[null,"Média"],[null,"Alta"],[null,"Muito Alta"]]}],"ard15":[{"t":"Áreas Ardidas 2025","r":[["#fbc4bb","Áreas Ardidas 2025"]]},{"t":"Áreas Ardidas 2024","r":[["#f0dbd8","Áreas Ardidas 2024"]]},{"t":"Áreas Ardidas 2023","r":[["#ffebaf","Áreas Ardidas 2023"]]},{"t":"Áreas Ardidas 2022","r":[["#ffebaf","Áreas Ardidas 2022"]]},{"t":"Áreas Ardidas 2021","r":[["#ffebaf","Áreas Ardidas 2021"]]},{"t":"Áreas Ardidas 2020","r":[["#ffebaf","Áreas Ardidas 2020"]]},{"t":"Áreas Ardidas 2019","r":[["#ffebaf","Áreas Ardidas 2019"]]},{"t":"Áreas Ardidas 2018","r":[["#ffebaf","Áreas Ardidas 2018"]]},{"t":"Áreas Ardidas 2017","r":[["#ffebaf","Áreas Ardidas 2017"]]},{"t":"Áreas Ardidas 2016","r":[["#ffebaf","Áreas Ardidas 2016"]]},{"t":"Áreas Ardidas 2015","r":[["#ffebaf","Áreas Ardidas 2015"]]}],"ard75":[{"t":"Áreas Ardidas 2014","r":[["#ffebaf","Áreas Ardidas 2014"]]},{"t":"Áreas Ardidas 2013","r":[["#ffebaf","Áreas Ardidas 2013"]]},{"t":"Áreas Ardidas 2012","r":[["#ffebaf","Áreas Ardidas 2012"]]},{"t":"Áreas Ardidas 2011","r":[["#ffebaf","Áreas Ardidas 2011"]]},{"t":"Áreas Ardidas 2010","r":[["#ffebaf","Áreas Ardidas 2010"]]},{"t":"Áreas Ardidas 2009","r":[["#ffebaf","Áreas Ardidas 2009"]]},{"t":"Áreas Ardidas 2000_2008","r":[["#e6e600","Áreas Ardidas 2000_2008"]]},{"t":"Áreas Ardidas 1990_1999","r":[["#a87000","Áreas Ardidas 1990_1999"]]},{"t":"Áreas Ardidas 1975_1989","r":[["#e9ffbe","Áreas Ardidas 1975_1989"]]}],"redeprim":[{"t":"Rede Primária FGC","r":[["#ff5500","Rede Primária FGC"]]},{"t":"RPFGC em concurso","r":[["#fcd1bf","RPFGC em concurso"]]}],"zif":[{"t":"","r":[["#cdcd66","ZIF"]]}],"dgegn":[{"t":"","r":[["#00e6a9","Produção"],["#e69800","Suspensa"]]}],"dgegm":[{"t":"","r":[["#004da8","Contrato concedido"],["#e6e600","Não atribuída"],["#00c5ff","Pedido"]]}],"carbono":[{"t":"","r":[["#afffe6","10 - 30"],["#97fe95","31 - 60"],["#fef880","61 - 80"],["#7acb00","81 - 100"],["#058003","101 - 130"],["#e6a203","131 - 150"],["#e87c19","151 - 170"],["#db6700","171 - 200"],["#c84926","201 - 220"],["#ac0000","221 - 240"],["#563512","241 - 270"],["#b9b9b9","271 - 290"],["#fe0000","291 - 310"]]}],"aridez":[{"t":"Índice de aridez 1980-2010","r":[["#e60000","Semiárido"],["#ffff00","Sub-húmido Seco"],["#73b2ff","Sub-húmido Húmido"],["#0070ff","Humido"]]},{"t":"Índice de aridez 1960-1990","r":[["#e60000","Semiárido"],["#ffff73","Sub-húmido seco"],["#73b2ff","Sub-húmido húmido"],["#005ce6","Húmido"]]},{"t":"Índice de aridez 1970-2000","r":[["#e60000","Semiárido"],["#ffff00","Sub-húmido Seco"],["#73b2ff","Sub-húmido Húmido"],["#0070ff","Humido"]]},{"t":"Índice de aridez 2000-2010","r":[["#e60000","Semiárido"],["#ffff00","Sub-húmido Seco"],["#73b2ff","Sub-húmido Húmido"],["#0070ff","Humido"]]}],"desert":[{"t":"Suscetibilidade à desertificação 2000-2010","r":[["#005ce6","Não suscetível"],["#e60000","Suscetível"]]},{"t":"Suscetibilidade à desertificação 1960-1990","r":[["#005ce6","Não suscetível"],["#e60000","Suscetível"]]},{"t":"Suscetibilidade à desertificação 1970-2000","r":[["#005ce6","Não suscetível"],["#e60000","Suscetível"]]},{"t":"Suscetibilidade à desertificação 1980-2010","r":[["#005ce6","Não suscetível"],["#e60000","Suscetível"]]}],"copa18":[{"t":"","r":[[null,"0: All non-tree and non-forest areas"],[null,"10% tree cover density"],[null,"20% tree cover density"],[null,"30% tree cover density"],[null,"40% tree cover density"],[null,"50% tree cover density"],[null,"60% tree cover density"],[null,"70% tree cover density"],[null,"80% tree cover density"],[null,"90% tree cover density"],[null,"100% tree cover density"],[null,"(valores intermédios de 1 em 1 %)"]]}],"swf21":[{"t":"","r":[[null,"Non SWF area"],[null,"SWF area"]]}],"habitats":[{"t":"Complexos","r":[["#f0e7df","Complexos"]]},{"t":"Habitats","r":[["#d3ffbe","Habitats"]]}],"invasoras":[{"t":"","r":[["#e60000","densa"],["#ffaa00","agrupada"],["#ffe800","dispersa"],["#ffffa2","vestigial"]]}],"zpe_so":[{"t":"","r":[["#00a9e6","ZPE"]]}],"ramsar":[{"t":"","r":[["#cd6699","RAMSAR"]]}],"biosfera":[{"t":"Limites das Reservas da Biosfera","r":[["#0070ff","Limites - RB"]]},{"t":"Zonamento das Reservas da Biosfera","r":[["#f57a7a","Nucleo"],["#ffd37f","Tampao"],["#ffffbe","Transicao"]]}],"geossitios":[{"t":"Inventário Nacional de Geossítios","r":[["#e69800","Geossítios"]]},{"t":"Geossítios do Cadastro dos Valores Naturais","r":[["#aaff00","Geossítios do Cadastro dos Valores Naturais"]]}],"prof_cor":[{"t":"","r":[["#70a800","Corredores ecológicos"]]}],"prof_sub":[{"t":"","r":[["#38a800","Sub-regiões"]]}],"prof_reg":[{"t":"","r":[["#4c7300","Regiões"]]}],"fogo_ret":[{"t":"","r":[["#730000","0,0 - 0,25"],["#ff0000","0,25 - 0,50"],["#f5a300","0,50 - 0,75"],["#ffd37f","0,75 - 0,99"],["#ffff00","1,0"],["#d1ff73","1,01 - 1,5"],["#55ff00","1,5 - 2,1"],["#38a800","2,1 - 5,0"],["#267300","5,0 - 47,0"],["#00a9e6","0 (Ardido 1x)"]]}],"fogo_n":[{"t":"","r":[["#00ace6","1"],["#287800","2"],["#339900","3"],["#3eba00","4"],["#49db00","5"],["#68e800","6"],["#94f000","7"],["#bcf500","8"],["#e9fa00","9"],["#ffea00","10"],["#ffbf00","11"],["#ff9900","12"],["#ff7300","13"],["#fa4700","14"],["#f02000","15"],["#de0000","16"],["#a80000","17"],["#730000","18"],["#343434","> 18"]]}],"fogo_ult":[{"t":"","r":[["#730000","1975"],["#850000","1976"],["#990000","1977"],["#ad0000","1978"],["#c20000","1979"],["#d60000","1980"],["#e80000","1981"],["#f00000","1982"],["#f70000","1983"],["#ff0800","1984"],["#ff2600","1985"],["#ff4400","1986"],["#ff5900","1987"],["#ff6a00","1988"],["#ff7700","1989"],["#ff8800","1990"],["#ff9500","1991"],["#ffa600","1992"],["#ffb300","1993"],["#ffc300","1994"]]}],"sev25":[{"t":"","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]}],"sev19":[{"t":"Severidade_2024","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]},{"t":"Severidade_2023","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]},{"t":"Severidade_2022","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]},{"t":"Severidade_2021","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]},{"t":"Severidade_2020","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]},{"t":"Severidade_2019","r":[["#98e600","Severidade baixa (3"],["#ffff00","Severidade moderada (4"],["#ffaa00","Severidade alta (5"],["#e60000","Severidade muito alta (6"],["#730000","Severidade extrema (7"]]}],"freg_dfci":[{"t":"","r":[["#ff0000","Freguesias prioritárias 2025"]]}],"loc_crit":[{"t":"","r":[["#a8528f","Locais críticos incêndio"]]}],"nematodo":[{"t":"Nemátodo - Freguesias tampão","r":[["#73b2ff","Nemátodo - Freguesias tampão"]]},{"t":"Nemátodo - Freguesias afetadas","r":[["#d3ffbe","Nemátodo - Freguesias afetadas"]]}],"ldi":[{"t":"","r":[["#bee8ff","Base / estática"],["#bdd2ff","Base / flutuante"],["#f0b1d0","Base / incremento"],["#a2d5f2","Base / regressiva"],["#ffff00","Degradada / estática"],["#feff73","Degradada / flutuante"],["#d0ff73","Degradada / incremento"],["#ffb413","Degradada / regressiva"],["#00ff01","Madura / estática"],["#6fc452","Madura / flutuante"],["#4de600","Madura / incremento"],["#a8b331","Madura / regressiva"],["#ff5500","Muito degradada / estática"],["#f08018","Muito degradada / flutuante"],["#1cbce8","Muito degradada / incremento"],["#e60000","Muito degradada / regressiva"],["#ffeabf","Produtiva / estática"],["#fcbdbd","Produtiva / flutuante"],["#50e600","Produtiva / incremento"],["#d5c355","Produtiva / regressiva"],["#935001","Referência / estática"],["#e69800","Referência / flutuante"],["#267300","Referência / incremento"],["#ffaa01","Referência / regressiva"],["#97dbf2","Sobredesempenho / estática"],["#74b164","Sobredesempenho / flutuante"],["#0000fe","Sobredesempenho / incremento"],["#3b72b3","Sobredesempenho / regressiva"],["#808080","Subdesempenho / estática"],["#b0b0b0","Subdesempenho / flutuante"],["#d1d1d1","Subdesempenho / incremento"],["#000000","Subdesempenho / regressiva"],["#000000","Não classificado"]]}],"ifn15":[{"t":"","r":[["#ffd37f","Acácias"],["#a80084","Alfarrobeira"],["#ffbee8","Azinheira"],["#a80000","Carvalhos"],["#a87000","Castanheiro"],["#7af5ca","Eucaliptos"],["#898944","Outras folhosas"],["#267300","Outras resinosas"],["#38a800","Pinheiro-bravo"],["#55ff00","Pinheiro-manso"],["#ffaa00","Sobreiro"]]}],"percursos":[{"t":"","r":[["#ffaa00","Rodoviários"],["#cd6699","Cicloturisticos"],["#a83800","Equestres"],["#005ce6","Pedestres"],["#828282","Rodoviários de ligação"]]}],"zonas_caca":[{"t":"","r":[["#6c2ca8","Zonas de caça associativa"],["#36a367","Zonas de caça municipal"],["#8c1d23","Zonas de caça nacional"],["#00a9e6","Zonas de caça turística"],["#a89136","Zonas de caça em área militar"],["#a14a7f","Zonas de caça em terrenos do Min. da Justiça"]]}]}/*FIM*/;
  function fotoLeg(e) { return e.g === "fundo" && /wms|xyz|omtbase/.test(e.t) && !LEG[e.id]; }

  // ── Fonte, licença e atribuição ────────────────────────────────────────────────────────────────────────────────────
  // Por entidade (primeiro padrão que bater no texto da fonte ou no endereço do serviço). Verificado a 4/11/2026.
  var LIC = [
    [/azores|SRAAC|Açores/i, "SRAAC, Secretaria Regional do Ambiente e Ação Climática (Governo dos Açores)", "CC BY 4.0, uso comercial sem autorização específica (resposta da SRAAC de 4/11/2026). Atribuição: «© SRAAC/GRA».", "https://idea.azores.gov.pt/"],
    [/^IPR · motor/i, "IPR · Terracrua Design", "Resultado de simulação, produção própria. Indicativo.", "https://terracruadesign.pt/"],
    [/EDIA, S\.A\.|edia\.pt/, "EDIA, Empresa de Desenvolvimento e Infra-estruturas do Alqueva", "Serviço EDIA_DadosAbertos, CC BY 4.0. Atribuição: «© EDIA, S.A.».", "https://www.edia.pt/"],
    [/DROTe|madeira\.gov/i, "DROTe, Governo Regional da Madeira", "CC BY 4.0 (metadados da COSRAM 2018).", "https://geoservices.madeira.gov.pt/"],
    [/Agência Europeia do Ambiente|discomap\.eea\.europa\.eu\/arcgis\/(rest\/)?services\/ProtectedSites/i, "Agência Europeia do Ambiente (Natura 2000)", "Dados Natura 2000 da AEA, CC BY 4.0, com indicação da fonte.", "https://www.eea.europa.eu/en/legal-notice"],
    [/Catastro/i, "Dirección General del Catastro (Espanha)", "Cartografia cadastral INSPIRE; reutilização com indicação da fonte, nos termos da DG del Catastro.", "https://www.catastro.hacienda.gob.es/"],
    [/SIGPAC|FEGA/i, "FEGA, Fondo Español de Garantía Agraria (SIGPAC)", "Visualização pública do SIGPAC, com indicação da fonte.", "https://sigpac-hubcloud.es/"],
    [/SNCZI|MITECO/i, "MITECO, Espanha (SNCZI)", "Cartografia de zonas inundáveis do SNCZI, com indicação da fonte.", "https://www.miteco.gob.es/"],
    [/IGME/i, "IGME-CSIC (Espanha)", "CC BY 4.0.", "https://www.igme.es/"],
    [/SoilGrids|ISRIC/i, "ISRIC, World Soil Information (SoilGrids 2.0)", "CC BY 4.0. Citar Poggio et al. (2021), SOIL 7, 217-240.", "https://www.isric.org/explore/soilgrids"],
    [/Global Forest Watch|Hansen/i, "Hansen / UMD / Google / USGS / NASA, via Global Forest Watch", "CC BY 4.0.", "https://www.globalforestwatch.org/"],
    [/Global Surface Water|JRC/i, "Comissão Europeia, JRC (Global Surface Water)", "Dados abertos do JRC, com indicação da fonte (Pekel et al. 2016).", "https://global-surface-water.appspot.com/"],
    [/Impact Observatory/i, "Impact Observatory, Microsoft e Esri", "CC BY 4.0.", "https://livingatlas.arcgis.com/landcover/"],
    [/cnig|PNOA|IGN \/ CNIG/i, "CNIG / IGN, Espanha (PNOA)", "CC BY 4.0 (scne.es). Citar como obra derivada do PNOA, com o produto e o ano.", "https://centrodedescargas.cnig.es/"],
    [/dgterritorio|DGT|SNIT|SRUP|CAOP/i, "DGT, Direção-Geral do Território", "Dados abertos da DGT, licença CC BY 4.0 (COS, LiDAR, ortofotos, CAOP confirmados nos metadados do SNIG). Atribuição: «Informação geográfica cedida pela Direção-Geral do Território».", "https://snig.dgterritorio.gov.pt/"],
    [/apambiente|APA|SNIRH|SNIAmb/i, "APA, Agência Portuguesa do Ambiente", "Serviço público de visualização do SNIAmb. Os metadados não indicam licença (só «© SNIRH» em várias camadas): citar a APA; para reproduzir em relatórios, confirmar com a APA.", "https://sniamb.apambiente.pt/"],
    [/icnf|ICNF/i, "ICNF, Instituto da Conservação da Natureza e das Florestas", "Propriedade do ICNF. Citar «Fonte: ICNF» e a data da versão. A pedido do ICNF (3/11/2026), estas camadas vão passar a ser servidas a partir de cópias do IPR, actualizadas periodicamente.", "https://geocatalogo.icnf.pt/"],
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
    if (!cor) return '<s style="background:none;border:0"></s>';
    var c = esc(cor);
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
      var fx = function () { alvo.innerHTML = FIXAS[e.id].map(function (g) { return (g.t ? '<div class="ii-sh">' + esc(g.t) + "</div>" : "") + htmlLinhas(g.r.map(function (x) { return [x[0], x[1], x[2]]; })); }).join("") + (L && L.txt ? '<p class="ii-m">' + esc(L.txt) + "</p>" : ""); };
      var semCor = FIXAS[e.id].some(function (g) { return g.r.some(function (x) { return !x[0]; }); });
      fx();
      // Classes sem cor guardada (rasters): tentar as imagens do próprio serviço; se não vierem, ficam os nomes.
      if (semCor && (e.t === "ags" || e.t === "img") && e.url) legendaAgs(e).then(function (b) {
        alvo.innerHTML = b.map(function (g) { return (g.t ? '<div class="ii-sh">' + esc(g.t) + "</div>" : "") + g.r.map(function (x) { return '<div class="ii-r"><img alt="" src="' + esc(x.img) + '"><span>' + esc(x.txt) + "</span></div>"; }).join(""); }).join("");
      }).catch(function () {});
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
  // ── Camadas de fora do catálogo (4/11/2026, 18h12: «para a frente com isso tudo»): Açores e Madeira (ilhas-camadas.js),
  //    EDIA (edia-camadas.js), Espanha (es-camadas.js), mundo (mundo-camadas.js) e resultados dos simuladores. Cada uma
  //    entra com a mesma forma das do catálogo, para o painel e a legenda funcionarem igual.
  var WMS = function (id, n, sub, base, layer, fonte, d, x) { var o = { id: id, n: n, sub: sub, t: "wms", url: base, layer: layer, fonte: fonte, lic: "v" }; for (var k in x || {}) o[k] = x[k]; DESC[id] = d; return o; };
  var AGS = function (id, n, sub, base, ids, fonte, d, x) { var o = { id: id, n: n, sub: sub, t: "ags", url: base, layers: "show:" + ids, fonte: fonte, lic: "v" }; for (var k in x || {}) o[k] = x[k]; DESC[id] = d; return o; };
  var OUT = function (id, n, sub, url, fonte, d, leg, x) { var o = { id: id, n: n, sub: sub, t: "xyz", url: url, fonte: fonte, lic: "v" }; for (var k in x || {}) o[k] = x[k]; DESC[id] = d; if (leg) LEG[id] = leg; return o; };
  var IGN = "IGN / CNIG (Espanha), CC BY 4.0 scne.es", GIBS = "https://gibs.earthdata.nasa.gov/", SGM = "https://maps.isric.org/mapserv?map=/map/";
  var EDIA_S = "https://sigims2.edia.pt/ediaags2/rest/services/publico/EDIA_DadosAbertos/MapServer", EEA_N2K = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer";
  var COR_REAL = { txt: "Imagem em cor real: não tem classes." }, IV = { txt: "Falsa-cor de infravermelho: vegetação viva em vermelho, água em azul-escuro, solo nu e construído em tons claros." };
  var EXTRA = [
    // Açores e Madeira
    OUT("ilh-az-relevo", "Relevo sombreado 1:1000 (9 ilhas)", "Açores · relevo e ocupação", "https://wssig4.azores.gov.pt/geoserver/relevo/wms", "© SRAAC/GRA · CC BY 4.0", "Relevo sombreado das nove ilhas a partir do modelo de superfície VRICON (2012-2017), à escala 1:1000.", { txt: "Sombra calculada com luz de noroeste. Não tem classes." }),
    WMS("ilh-az-cosa18", "Ocupação do solo COS.A 2018 (nível 1)", "Açores · relevo e ocupação", "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/idea/public/cosa/cgi-bin/qgis_mapserv.fcgi", "cosa2018_n1", "© SRAAC/GRA · CC BY 4.0", "Carta de Ocupação do Solo da Região Autónoma dos Açores de 2018, no primeiro nível de classes."),
    WMS("ilh-az-cosa07", "Ocupação do solo COS.A 2007", "Açores · relevo e ocupação", "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/idea/public/cosa/cgi-bin/qgis_mapserv.fcgi", "cosa_2007", "© SRAAC/GRA · CC BY 4.0", "Carta de Ocupação do Solo dos Açores de 2007, para comparar com a de 2018."),
    WMS("ilh-az-n2000", "Rede Natura 2000 (ZEC e ZPE)", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatura2000", "© SRAAC/GRA · CC BY 4.0", "Zonas Especiais de Conservação e Zonas de Protecção Especial da Rede Natura 2000 nos Açores."),
    WMS("ilh-az-ap", "Áreas protegidas (parques naturais de ilha)", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatureConservation", "© SRAAC/GRA · CC BY 4.0", "Áreas protegidas dos parques naturais de cada ilha, com as suas categorias."),
    WMS("ilh-az-sitios", "Sítios protegidos (todas as figuras)", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSites", "© SRAAC/GRA · CC BY 4.0", "Todos os sítios protegidos da Região, em todas as figuras de protecção."),
    WMS("ilh-az-biosfera", "Reservas da Biosfera", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesBiosphereReserve", "© SRAAC/GRA · CC BY 4.0", "Reservas da Biosfera da UNESCO nos Açores (Corvo, Graciosa, Flores e Fajãs de São Jorge)."),
    WMS("ilh-az-hab", "Habitats da Directiva (relatório 2013-2018)", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/hbd/wms", "HBD.HabitatDistribution_2013_2018", "© SRAAC/GRA · CC BY 4.0", "Distribuição dos habitats do Anexo I da Directiva Habitats comunicada no relatório de 2013-2018."),
    WMS("ilh-az-biotopos", "Biótopos Corine", "Açores · conservação da natureza", "https://wssig3.azores.gov.pt/geoserver/hb/wms", "HB.Habitat", "© SRAAC/GRA · CC BY 4.0", "Biótopos Corine: áreas de interesse para a conservação inventariadas no programa europeu Corine."),
    WMS("ilh-az-inund", "Zonas com risco de inundação (PGRIA)", "Açores · água e riscos", "https://wssig3.azores.gov.pt/geoserver/nz/wms", "NZ.RiskZone", "© SRAAC/GRA · CC BY 4.0", "Zonas com risco de inundação do Plano de Gestão de Riscos de Inundações dos Açores (PGRIA)."),
    WMS("ilh-az-capt", "Zonas de protecção às captações de água", "Açores · água e riscos", "https://wssig3.azores.gov.pt/geoserver/am/wms", "AM.DrinkingWaterProtectionArea", "© SRAAC/GRA · CC BY 4.0", "Perímetros de protecção das captações de água para consumo humano, com usos condicionados."),
    WMS("ilh-az-nitr", "Zonas vulneráveis a nitratos", "Açores · água e riscos", "https://wssig3.azores.gov.pt/geoserver/am/wms", "AM.NitrateVulnerableZone", "© SRAAC/GRA · CC BY 4.0", "Zonas vulneráveis à poluição por nitratos de origem agrícola (bacias de lagoas), com regras de fertilização."),
    WMS("ilh-md-cosram", "Ocupação do solo COSRAM 2018", "Madeira e Porto Santo", "https://geoservices.madeira.gov.pt/geoserver/LC_COSRAM_2018/wms", "LC.LandCoverSurfaces", "© DROTe, Governo Regional da Madeira · CC BY 4.0", "Carta de Ocupação do Solo da Região Autónoma da Madeira de 2018."),
    AGS("ilh-md-n2000", "Rede Natura 2000 (Agência Europeia do Ambiente)", "Madeira e Porto Santo", EEA_N2K, "0,1,2", "© Agência Europeia do Ambiente (Natura 2000) · CC BY 4.0", "Sítios da Rede Natura 2000 na Madeira, a partir da base de dados europeia da AEA."),
    // EDIA (Alqueva)
    AGS("edia-2025", "Ortofotomapa 2025 · cor real (EDIA)", "Alqueva (EDIA)", EDIA_S, "75", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2025, 25 cm, em cor real, da área do Empreendimento de Fins Múltiplos de Alqueva."),
    AGS("edia-2025iv", "Ortofotomapa 2025 · infravermelho (EDIA)", "Alqueva (EDIA)", EDIA_S, "73", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2025 em falsa-cor de infravermelho: ajuda a ver vegetação viva, regadio e linhas de água."),
    AGS("edia-2022", "Ortofotomapa 2022 (EDIA)", "Alqueva (EDIA)", EDIA_S, "56", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2022 da área do Alqueva."),
    AGS("edia-2022iv", "Ortofotomapa 2022 · infravermelho (EDIA)", "Alqueva (EDIA)", EDIA_S, "70", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2022 em falsa-cor de infravermelho."),
    AGS("edia-2019", "Ortofotomapa 2019 (EDIA)", "Alqueva (EDIA)", EDIA_S, "28", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2019 da área do Alqueva."),
    AGS("edia-2019iv", "Ortofotomapa 2019 · infravermelho (EDIA)", "Alqueva (EDIA)", EDIA_S, "37", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2019 em falsa-cor de infravermelho."),
    AGS("edia-2017", "Ortofotomapa 2017 (EDIA)", "Alqueva (EDIA)", EDIA_S, "4", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2017 da área do Alqueva."),
    AGS("edia-2015", "Ortofotomapa 2015 (EDIA)", "Alqueva (EDIA)", EDIA_S, "12", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2015 da área do Alqueva."),
    AGS("edia-2004", "Ortofotomapa 2004 (EDIA)", "Alqueva (EDIA)", EDIA_S, "13", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 2004: a paisagem antes do enchimento completo e do regadio."),
    AGS("edia-1995", "Ortofotomapa 1995 (EDIA)", "Alqueva (EDIA)", EDIA_S, "14", "© EDIA, S.A. · CC BY 4.0", "Ortofotomapa de 1995: a paisagem antes da barragem de Alqueva."),
    AGS("edia-aptidao", "Carta de aptidão ao regadio (EDIA)", "Alqueva (EDIA)", EDIA_S, "17", "© EDIA, S.A. · CC BY 4.0", "Aptidão dos solos ao regadio na área do Alqueva, em classes."),
    AGS("edia-curvas", "Curvas de nível 1995, 1:5000 (EDIA)", "Alqueva (EDIA)", EDIA_S, "1", "© EDIA, S.A. · CC BY 4.0", "Curvas de nível da cartografia 1:5000 de 1995 da EDIA."),
    // Espanha
    OUT("es-pnoa", "Ortofoto PNOA (IGN)", "Espanha", "https://www.ign.es/wmts/pnoa-ma", IGN, "Ortofotografia aérea mais recente do Plano Nacional de Ortofotografia Aérea de Espanha.", COR_REAL),
    OUT("es-ignbase", "Mapa IGN Base", "Espanha", "https://www.ign.es/wmts/ign-base", IGN, "Mapa base topográfico do Instituto Geográfico Nacional de Espanha.", { txt: "Mapa topográfico com a simbologia do IGN." }),
    WMS("es-catastro", "Cadastro (Catastro)", "Espanha", "https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx", "CP.CadastralParcel", "Dirección General del Catastro", "Parcelas cadastrais de Espanha (INSPIRE), da Dirección General del Catastro."),
    OUT("es-sigpac", "Recintos SIGPAC (uso agrícola)", "Espanha", "https://sigpac-hubcloud.es/", "SIGPAC, FEGA", "Recintos do SIGPAC, o sistema de identificação de parcelas agrícolas de Espanha, coloridos pelo uso declarado.",
      { leg: [["#e0c36b", "TA · terra arável"], ["#e8d48a", "TH · horta"], ["#9bc46a", "PS · pastagem"], ["#b8d68c", "PR · pasto arbustivo"], ["#7fae55", "PA · pasto com arvoredo"], ["#3f7d3a", "FO · floresta"], ["#8a9a3c", "OV · olival"], ["#a0558a", "VI · vinha"], ["#c48a4a", "FY · frutos (frutales)"], ["#e39d3a", "CI · citrinos"], ["#9a9a9a", "IM · improdutivo"], ["#c9c9c9", "ZU · zona urbana"], ["#6aa6d8", "AG · água"], ["#bdbdbd", "CA · caminhos"], ["#d6cfa8", "outros usos"]] }),
    WMS("es-limites", "Limites administrativos (Espanha)", "Espanha", "https://www.ign.es/wms-inspire/unidades-administrativas", "AU.AdministrativeBoundary", IGN, "Limites de comunidades autónomas, províncias e municípios de Espanha (INSPIRE)."),
    WMS("es-natura", "Rede Natura 2000 (Espanha)", "Espanha", "https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WMSServer", "0,1,2", "© Agência Europeia do Ambiente · CC BY 4.0", "Sítios da Rede Natura 2000 em Espanha, a partir da base de dados europeia da AEA."),
    WMS("es-inund10", "Zona inundável T10 (Espanha)", "Espanha", "https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT10", "SNCZI, MITECO", "Zona inundável para um período de retorno de 10 anos (Sistema Nacional de Cartografía de Zonas Inundables)."),
    WMS("es-inund100", "Zona inundável T100 (Espanha)", "Espanha", "https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT100", "SNCZI, MITECO", "Zona inundável para um período de retorno de 100 anos."),
    WMS("es-inund500", "Zona inundável T500 (Espanha)", "Espanha", "https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT500", "SNCZI, MITECO", "Zona inundável para um período de retorno de 500 anos."),
    WMS("es-pontosagua", "Pontos de água (IGME)", "Espanha", "https://mapas.igme.es/gis/services/BasesDatos/IGME_PuntosAgua/MapServer/WMSServer", "0,1", "IGME-CSIC · CC BY 4.0", "Inventário de pontos de água (furos, poços, nascentes) do Instituto Geológico y Minero de España."),
    WMS("es-curvas", "Curvas de nível (IGN, Espanha)", "Espanha", "https://servicios.idee.es/wms-inspire/mdt", "EL.ContourLine", IGN, "Curvas de nível do modelo digital do terreno do IGN."),
    // Mundo
    OUT("ao-prov", "Regiões e províncias (mundo)", "Mundo · fontes globais", "https://tiles.openfreemap.org/planet", "© OpenStreetMap · OpenFreeMap", "Limites de regiões e províncias de qualquer país, a partir do OpenStreetMap.", { leg: [["#f2e6c9", "limite de região ou província", "L"]] }),
    OUT("ao-mun", "Municípios e concelhos (mundo)", "Mundo · fontes globais", "https://tiles.openfreemap.org/planet", "© OpenStreetMap · OpenFreeMap", "Limites de municípios e concelhos de qualquer país, a partir do OpenStreetMap.", { leg: [["#e8dcc0", "limite de município", "d"]] }),
    OUT("mu-viirs", "Imagem de satélite do dia", "Mundo · fontes globais", GIBS, "NASA EOSDIS GIBS (VIIRS)", "Imagem de satélite VIIRS de há dois dias, a 375 m: nuvens, fumo, cheias e cor da vegetação neste momento.", COR_REAL),
    OUT("mu-luzes", "Luzes nocturnas", "Mundo · fontes globais", GIBS, "Black Marble 2016, NASA Earth Observatory", "Luzes nocturnas vistas de satélite (2016): povoamento e infra-estruturas.", { leg: [["#000000", "sem luz"], ["#f5d27a", "luz fraca"], ["#ffffff", "luz intensa"]] }),
    OUT("mu-aster", "Relevo a cores (altitude e sombra)", "Mundo · fontes globais", GIBS, "ASTER GDEM, NASA e METI", "Altitude em cores, com sombra, a 30 m, para qualquer país.", { leg: [["#2a7a3a", "cotas baixas"], ["#d7c46a", "cotas médias"], ["#8b5a2b", "cotas altas"], ["#f2f2f2", "cumes"]] }),
    OUT("mu-chuva", "Chuva · último dia", "Mundo · fontes globais", GIBS, "IMERG, NASA GPM, via GIBS", "Intensidade média da chuva no último dia disponível (satélites GPM, cerca de 10 km).", { leg: [["#a6d8ff", "chuva fraca"], ["#2b83ba", "moderada"], ["#fdae61", "forte"], ["#d7191c", "muito forte"]] }),
    OUT("mu-temp", "Temperatura do ar · último mês", "Mundo · fontes globais", GIBS, "MERRA-2, NASA GMAO, via GIBS", "Temperatura média mensal a 2 m do solo, cerca de 50 km: o clima da região, não o do terreno.", { leg: [["#313695", "frio"], ["#ffffbf", "ameno"], ["#a50026", "quente"]] }),
    OUT("mu-cheia", "Cheias · últimos 3 dias", "Mundo · fontes globais", GIBS, "NASA LANCE MODIS, via GIBS", "Água fora do sítio habitual detectada por satélite nos últimos 3 dias (cerca de 250 m).", { txt: "Água detectada fora do leito habitual (cheia) e água permanente, conforme a cor do produto MODIS da NASA." }),
    OUT("mu-evi", "Vigor da vegetação · últimos 8 dias", "Mundo · fontes globais", GIBS, "NASA MODIS, via GIBS", "Índice de vegetação melhorado (EVI) a 250 m.", { leg: [["#d8c79a", "pouca vegetação"], ["#9cc35a", "vegetação moderada"], ["#1f6b2a", "vegetação muito activa"]] }),
    OUT("mu-perda", "Perda de floresta 2001 a 2024", "Mundo · fontes globais", "https://tiles.globalforestwatch.org/", "Hansen/UMD/Google/USGS/NASA, via Global Forest Watch, CC BY 4.0", "Áreas onde o coberto arbóreo desapareceu entre 2001 e 2024 (Landsat, 30 m).", { txt: "Cor-de-rosa e vermelho: píxeis onde se perdeu coberto arbóreo (densidade de copa acima de 30 %); a cor muda com o ano da perda." }),
    OUT("mu-altura", "Altura do coberto vegetal", "Mundo · fontes globais", GIBS, "GEDI, NASA e Universidade de Maryland, via GIBS", "Altura média das árvores medida por laser a partir da estação espacial (1 km; entre 52°N e 52°S).", { leg: [["#f7fcb9", "coberto baixo"], ["#78c679", "médio"], ["#004529", "árvores altas"]] }),
    OUT("mu-biomassa", "Biomassa aérea", "Mundo · fontes globais", GIBS, "GEDI L4B, NASA, via GIBS", "Toneladas de biomassa aérea por hectare (1 km; entre 52°N e 52°S).", { leg: [["#ffffcc", "pouca biomassa"], ["#41ab5d", "média"], ["#00441b", "muita biomassa"]] }),
    OUT("mu-pop", "Densidade de população 2020", "Mundo · fontes globais", GIBS, "GPWv4, NASA SEDAC / CIESIN, CC BY 4.0", "Pessoas por km², a cerca de 1 km.", { leg: [["#fff5eb", "muito pouca gente"], ["#fd8d3c", "média"], ["#7f2704", "muita gente"]] }),
    OUT("mu-rcheia", "Frequência de cheias", "Mundo · fontes globais", GIBS, "Natural Disaster Hotspots, NASA SEDAC / CIESIN, Banco Mundial", "Cheias registadas de 1985 a 2003, em classes de frequência.", { leg: [["#c6dbef", "pouco frequentes"], ["#4292c6", "frequentes"], ["#08306b", "muito frequentes"]] }),
    OUT("mu-rseca", "Frequência de secas", "Mundo · fontes globais", GIBS, "Natural Disaster Hotspots, NASA SEDAC / CIESIN, Banco Mundial", "Secas de 1980 a 2000, em classes de frequência.", { leg: [["#fee6ce", "pouco frequentes"], ["#fd8d3c", "frequentes"], ["#a63603", "muito frequentes"]] }),
    OUT("mu-rdesl", "Perigo de deslizamentos", "Mundo · fontes globais", GIBS, "Natural Disaster Hotspots, NASA SEDAC / NGI, Banco Mundial", "Perigo de deslizamento de terras, em classes.", { leg: [["#fee0d2", "perigo baixo"], ["#fb6a4a", "médio"], ["#a50f15", "alto"]] }),
    OUT("ao-lulc", "Ocupação do solo 10 m (Sentinel-2, 2024)", "Mundo · fontes globais", "https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer", "Impact Observatory, Microsoft e Esri (Sentinel-2 10 m), CC BY 4.0", "Ocupação do solo mundial a 10 m em 2024, em nove classes.",
      { leg: [["#419bdf", "água"], ["#397d49", "árvores"], ["#7a87c6", "vegetação inundada"], ["#e49635", "culturas"], ["#c4281b", "área construída"], ["#a59b8f", "solo nu"], ["#a8ebff", "neve e gelo"], ["#616161", "nuvens"], ["#e3e2c3", "pastagem e mato"]] }),
    OUT("ao-agua-oc", "Água superficial · frequência 1984 a 2021", "Mundo · fontes globais", "https://storage.googleapis.com/global-surface-water/", "Global Surface Water, EC JRC / Google (Pekel et al. 2016)", "Percentagem do tempo em que houve água em cada ponto, de 1984 a 2021 (Landsat).", { leg: [["#ffd9e6", "água rara"], ["#8c96c6", "água às vezes"], ["#0000ff", "água quase sempre"]] }),
    OUT("ao-agua-saz", "Água superficial · sazonalidade", "Mundo · fontes globais", "https://storage.googleapis.com/global-surface-water/", "Global Surface Water, EC JRC / Google (Pekel et al. 2016)", "Número de meses por ano com água.", { leg: [["#99d9ea", "poucos meses"], ["#0000aa", "todo o ano"]] }),
    WMS("ao-solo-c", "Carbono orgânico do solo (0-5 cm)", "Mundo · fontes globais", SGM + "soc.map", "soc_0-5cm_mean", "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Carbono orgânico no solo, 0 a 5 cm, modelo mundial a 250 m: serve para comparar zonas, não substitui análise de solo."),
    WMS("ao-solo-ph", "pH do solo (0-5 cm)", "Mundo · fontes globais", SGM + "phh2o.map", "phh2o_0-5cm_mean", "SoilGrids 2.0 © ISRIC, CC BY 4.0", "pH em água do solo, 0 a 5 cm, modelo mundial a 250 m."),
    WMS("ao-solo-arg", "Argila (0-5 cm)", "Mundo · fontes globais", SGM + "clay.map", "clay_0-5cm_mean", "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Teor de argila do solo, 0 a 5 cm, modelo mundial a 250 m."),
    WMS("mu-solo-areia", "Areia (0-5 cm)", "Mundo · fontes globais", SGM + "sand.map", "sand_0-5cm_mean", "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Teor de areia do solo, 0 a 5 cm, modelo mundial a 250 m."),
    WMS("mu-solo-n", "Azoto total (0-5 cm)", "Mundo · fontes globais", SGM + "nitrogen.map", "nitrogen_0-5cm_mean", "SoilGrids 2.0 © ISRIC, CC BY 4.0", "Azoto total do solo, 0 a 5 cm, modelo mundial a 250 m."),
    // Resultados dos simuladores (a legenda de cada resultado vem do motor e aparece no próprio painel)
    OUT("sim-agua", "Resultado do simulador de água", "Simuladores IPR", "", "IPR · motor de simulação, sobre a Base Cartográfica (LiDAR DGT) e o número de escoamento", "Resultado calculado pelo simulador de água do IPR para este terreno: altura e velocidade máximas da água, onde a água pára ou pontos de inundação, conforme o cálculo escolhido. É uma simulação: indicativa, depende da chuva escolhida, do MDT e do CN.", { txt: "A escala de cores de cada resultado aparece por baixo dele, no painel do simulador, com os valores." }),
    OUT("sim-fogo", "Resultado do simulador de fogo", "Simuladores IPR", "", "IPR · motor de simulação, sobre a Base Cartográfica e os modelos de combustível", "Resultado calculado pelo simulador de fogo do IPR: tempo de chegada, intensidade ou probabilidade de ardido, conforme o cenário. É uma simulação: indicativa, depende do vento, da humidade e dos combustíveis considerados.", { txt: "A escala de cores de cada resultado aparece por baixo dele, no painel do simulador, com os valores." })
  ];
  var EXT = {}; EXTRA.forEach(function (e) { EXT[e.id] = e; });
  function catTudo() { var c = cat(); for (var k in EXT) if (!c[k]) c[k] = EXT[k]; return c; }

  var painel = null;
  function abrir(id) {
    var e = catTudo()[id]; if (!e) return; css();
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
    // Grupos de fora do catálogo: Açores e Madeira, EDIA, Espanha, mundo, e resultados dos simuladores.
    [["data-tilh", ""], ["data-tedia", ""], ["data-tes", ""], ["data-tao", ""]].forEach(function (a) {
      [].forEach.call(D.querySelectorAll("input[" + a[0] + "]"), function (inp) {
        var id = inp.getAttribute(a[0]), lb = inp.closest("label"); if (!EXT[id] || !lb || lb.querySelector(".ipr-ii-b")) return;
        lb.appendChild(botao(id));
      });
    });
    [].forEach.call(D.querySelectorAll("#ipr-as input[data-cam], #ipr-fs input[data-cam]"), function (inp) {
      var lb = inp.closest("label"); if (!lb || lb.querySelector(".ipr-ii-b")) return;
      lb.appendChild(botao(inp.closest("#ipr-fs") ? "sim-fogo" : "sim-agua"));
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
