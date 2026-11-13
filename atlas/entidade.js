/* IPR Atlas · entidade.js (12/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 12/11/2026, 20h52: «Gostava de termos este assistente e que este assistente realmente funcione. [...] para este tipo
   de entidade, o painel vem [...] no bloco lateral direito. Da esquerda fica as camadas, o da direita fica o bloco de painel.
   [...] Quando uma pessoa seleciona, tem mesmo que aparecer.» Primeira entidade: ADXTUR (Aldeias do Xisto).
   Base: SOT-IPR v3.0, A Arquitectura Bioregional, Regras Canónicas do Método Terracrua Design, catálogo do viz.js.
   Só corre com window.IPR_ENTIDADE (módulo m91120, membros da entidade e administradores com ?entidade=<id>).
   1. Assistente de seis passos (perfil, bacias, módulos, repovoamento, acessos e mapa público, rever) guardado no site.
   2. Esquerda: a árvore de camadas mostra só as camadas dos módulos activos («Ver todas» repõe a árvore inteira).
   3. Direita: painel da entidade, um bloco por módulo, com as suas camadas para ligar e os indicadores (sem números
      inventados: o que só existe depois das auditorias diz «após a Fase 1»).
   Ligar ou desligar um módulo muda já a esquerda e a direita. A ordem não se configura: o design só abre com a água.
   Desligar: ?ent=0 ou localStorage ipr_ent_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ent=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ent_off") === "1") return; } catch (e) {}
  if (W.__iprEnt) return; W.__iprEnt = 1;

  // ---------- Administradores sem entidade escolhida: só um atalho para escolher ----------
  if (!W.IPR_ENTIDADE) {
    if (W.IPR_ENTIDADES && W.IPR_ENTIDADES.length) {
      espera(function () {
        var top = D.querySelector("#ipe .ipe-top"); if (!top || D.getElementById("ipr-ent-escolha")) return;
        var s = D.createElement("select"); s.id = "ipr-ent-escolha"; s.setAttribute("aria-label", "Abrir como entidade");
        s.innerHTML = '<option value="">Entidades…</option>' + W.IPR_ENTIDADES.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.nome) + "</option>"; }).join("");
        s.style.cssText = "margin-left:8px;background:#1d1f1a;color:#C3C5BC;border:1px solid #383A33;border-radius:2px;padding:4px 6px;font:500 12px Inter,sans-serif";
        s.addEventListener("change", function () { if (s.value) location.href = "/atlas/?entidade=" + encodeURIComponent(s.value); });
        top.appendChild(s);
      });
    }
    return;
  }
  var ENT = W.IPR_ENTIDADE, PODE = ENT.papel === "coordenacao";

  // ---------- Catálogo do configurador ----------
  var GRUPOS = [
    ["base", "Território e base", "Parte II · a bacia como unidade"],
    ["agua", "Água", "Parte II · estrutura natural"],
    ["solo", "Solo, vegetação e biodiversidade", "Parte II · capital natural"],
    ["fogo", "Fogo e risco", "SOT · risco integrado"],
    ["ord", "Ordenamento e condicionantes", "SOT · auditoria institucional"],
    ["hum", "Povoamento e presença humana", "Parte III · estrutura humana"],
    ["eco", "Economia e terra", "Parte I · estrutura financeira"],
    ["cult", "Cultura e memória", "Parte III · estrutura cultural"],
    ["repo", "Repovoamento", "Cap. 13-A · sequência do repovoamento"],
    ["des", "Design do sistema territorial", "SOT · Fase 3"],
    ["gov", "Governação e comunidade", "Partes IV e V"],
    ["obs", "Implementação e Observatório", "Parte VI · Fases 4 a 6"],
    ["agro", "Produção e rede agrícola", "Parte I · capital produtivo e circuitos curtos"]
  ];
  var AGRO = ENT.id === "agrobio";
  if (AGRO) GRUPOS.splice(1, 0, GRUPOS.pop()); // numa associação agrícola, a produção vem logo a seguir ao território
  // ids = camadas do catálogo do viz.js; liga = as que se ligam ao aplicar (poucas, para o mapa não ficar pesado).
  var MOD = [
    {id: "delim", g: "base", n: "Delimitação de bacias e sub-bacias", d: "Bacias, sub-bacias e troços; limites administrativos só como referência", eb: "Finder", lock: 1, ids: ["bip_23", "bacias", "bac_troco", "l_bacias_l", "rh", "concelhos", "caop"], liga: ["bip_23", "bacias"], k: [["Bacias da entidade", "bacias"], ["Sub-bacias delimitadas", "f1"]]},
    {id: "base", g: "base", n: "Base cartográfica LiDAR", d: "Ortofoto, relevo, MDT, curvas, declives, exposição, geomorfologia", eb: "Analyzer", lock: 1, ids: ["f_ortosat", "r_somb", "r_curvas", "l_mdt", "l_curvas5", "l_declives", "l_exposicao", "l_geomorphons", "r_hipso"], liga: ["r_somb"], k: [["Cobertura LiDAR verificada", "f1"]]},
    {id: "hidro", g: "agua", n: "Hidrografia e escoamento", d: "Rede hidrográfica, linhas de água de Strahler, acumulação, escorrência, massas de água", eb: "Analyzer", ids: ["hidro", "hidro_g", "l_streams", "l_acumulacao", "l_escorrencia", "massas", "ma_ecol"], liga: ["hidro"], k: [["Km de linhas de água", "f1"], ["Galerias ripícolas em bom estado", "f1"]]},
    {id: "keyline", g: "agua", n: "Cumeadas, selas e humidade topográfica", d: "Festos, TWI, bacias LiDAR: base dos keypoints e keylines", eb: "Analyzer", ids: ["l_festos", "l_twi", "l_bacias_l"], k: []},
    {id: "infil", g: "agua", n: "Infiltração, precipitação e humidade do solo", d: "Número de escoamento, grupo hidrológico, precipitação, humidade das raízes", eb: "Analyzer", ids: ["cn", "scs", "esc_med", "precip", "erosiv", "n_gibs_humsolo", "etr"], k: [["Infiltração nas cabeceiras", "f1"]]},
    {id: "nasc", g: "agua", n: "Nascentes, captações e pontos de água", d: "Nascentes e fontes, pontos de água DFCI, captações, barragens e açudes", eb: "Analyzer", ids: ["o_aguapts", "icnfpa", "apasub", "capt_p", "capt_sup", "barragens"], k: [["Nascentes activas no fim do Verão", "f1"]]},
    {id: "cheias", g: "agua", n: "Cheias e simulador de água", d: "Zonas inundáveis, marcas e cotas de cheia, estações; o simulador corre no Atlas", eb: "Synthesis", ids: ["inund20", "inund100", "arpsi", "marcas", "cotas_cheia", "hidrom"], k: [["Última simulação", "f1"]]},
    {id: "solos", g: "solo", n: "Solos e erosão", d: "Capacidade de uso, carta de solos, carbono, erosão, aridez, desertificação", eb: "Analyzer", ids: ["sroa", "solos", "carbono", "l_erosao", "aridez", "desert"], k: [["Área com erosão activa", "f1"]]},
    {id: "ocup", g: "solo", n: "Ocupação do solo e vegetação", d: "COS 2023 e 2025, densidade de copa, árvores isoladas e sebes, IFN", eb: "Analyzer", ids: ["cos23", "cos25", "cosc25", "copa18", "swf21", "ifn15"], k: []},
    {id: "bio", g: "solo", n: "Habitats, Rede Natura e corredores", d: "Rede Natura, áreas protegidas, habitats, corredores PROF, invasoras, ocorrências", eb: "Analyzer", ids: ["n2k", "rnap", "habitats", "hab_grupos", "prof_cor", "invasoras", "n_gbif_todas"], k: [["Conectividade dos corredores", "f1"]]},
    {id: "fogo", g: "fogo", n: "Fogo: histórico e gestão", d: "Áreas ardidas, retorno e último fogo, severidade, faixas SGIFR, rede primária, ZIF", eb: "Analyzer", ids: ["ard15", "ard75", "fogo_ret", "fogo_ult", "sev25", "sgifr_a", "redeprim", "zif"], liga: ["ard15"], k: [["Área ardida nos últimos 20 anos", "f1"]]},
    {id: "perigo", g: "fogo", n: "Perigosidade e simulador de fogo", d: "Perigosidade estrutural e conjuntural, locais críticos, exposição ao vento", eb: "Synthesis", ids: ["perig_e", "perig", "loc_crit", "l_vento"], k: [["Última simulação", "f1"]]},
    {id: "risco", g: "fogo", n: "Risco integrado", d: "Fogo, seca, erosão, cheia, abandono e risco demográfico lidos em conjunto", eb: "Synthesis", ids: ["wei", "pgri_perigo", "desert"], k: [["Sub-bacias em risco alto", "f1"]]},
    {id: "cond", g: "ord", n: "REN, RAN, PDM e servidões", d: "Cópia própria do IPR, actualizada todos os meses", eb: "Finder", ids: ["ren", "ran", "crus", "dph", "srup_rf", "srup_ic", "srup_cpir"], k: []},
    {id: "cadastro", g: "ord", n: "Cadastro e prédios", d: "Cadastro predial, BUPi, parcelas IFAP: referência de quem decide, nunca unidade de planeamento", eb: "Finder", ids: ["cad", "bupi", "ifap_p"], k: []},
    {id: "aldeias", g: "hum", n: "Aldeias, lugares e edificado", d: "Toponímia, edifícios, freguesias; o levantamento de campo entra por cima", eb: "Finder", lock: 1, ids: ["o_nomes", "o_edif", "caop"], liga: ["o_nomes"], k: [["Aldeias na rede", "rede"], ["Aldeias do piloto", "piloto"]]},
    {id: "presenca", g: "hum", n: "Presença humana e demografia", d: "Residentes, casas devolutas, presença extractiva, abandonada ou regenerativa", eb: "Analyzer", ids: ["o_usos"], k: [["Residentes todo o ano", "f1"], ["Casas devolutas recuperáveis", "f1"], ["Presença regenerativa", "f1"]]},
    {id: "serv", g: "hum", n: "Acessos, serviços e energia", d: "Estradas, caminhos, rede rodoviária, linhas eléctricas", eb: "Analyzer", ids: ["o_estradas", "o_caminhos", "viaria", "o_energia", "eletr"], k: [["Distância média à escola", "f1"], ["Distância ao centro de saúde", "f1"]]},
    {id: "econ", g: "eco", n: "Economia local e parcelas agrícolas", d: "Ocupação das parcelas IFAP, operadores e produtores", eb: "Analyzer", ids: ["ifap_o"], k: [["Empresas activas", "f1"], ["Emprego local", "f1"]]},
    {id: "terras", g: "eco", n: "Banco de terras", d: "Parcelas abandonadas, baldios, heranças indivisas, para activar", eb: "Analyzer", ids: ["cad", "bupi"], k: [["Parcelas disponíveis", "f1"], ["Hectares activáveis", "f1"]]},
    {id: "capitais", g: "eco", n: "As cinco formas de capital", d: "Natural, financeiro, social, cultural, infra-estrutural", eb: "Synthesis", ids: [], cap: 1, k: []},
    {id: "patr", g: "cult", n: "Património, percursos e saber local", d: "Património, imóveis classificados, percursos, geossítios", eb: "Analyzer", ids: ["o_patrimonio", "srup_ic", "percursos", "geossitios"], k: []},
    {id: "capac", g: "repo", n: "Capacidade de suporte e cenários", d: "Tecto de famílias por sub-bacia a 5, 10, 20 e 50 anos", eb: "Synthesis", ids: [], k: [["Tecto de famílias, hoje", "f2"], ["Tecto a 20 anos", "f2"]]},
    {id: "acolh", g: "repo", n: "Sequência de chegada e fichas de acolhimento", d: "Quem chega primeiro e o que falta a cada aldeia", eb: "Synthesis", ids: [], seq: 1, k: [["Famílias instaladas", "f1"], ["Ficaram ao fim de 3 anos", "f1"]]},
    {id: "dagua", g: "des", n: "Estrutura hídrica", d: "Primeira estrutura: cabeceiras, galerias, recarga, nascentes", eb: "Planner", precisa: ["hidro"], ids: [], k: [["Estado", "Por propor"]]},
    {id: "dresto", g: "des", n: "Estruturas ecológica, produtiva, habitacional, energética e económica", d: "Abrem depois da água validada", eb: "Planner", precisa: ["dagua"], ids: [], k: [["Ordem", "água, acessos, zonas, infra-estruturas"]]},
    {id: "comissao", g: "gov", n: "Comissão de Bacia e escalas de decisão", d: "Casa, aldeia, sub-bacia, bacia, rede: cada decisão na menor escala capaz", eb: "Planner", ids: [], k: [["Papéis", "coordenação, equipa IPR, municípios, aldeias, público"]]},
    {id: "publico", g: "gov", n: "Mapa público participativo", d: "Serviços visíveis, contributos moderados que alimentam as auditorias", eb: "Analyzer", ids: [], k: [["Contributos por moderar", "0"]]},
    {id: "ancora", g: "obs", n: "Projectos âncora e fichas", d: "Por bacia, com responsável, prazo e manutenção", eb: "Planner", ids: ["r_projipr"], k: [["Projectos em curso", "0"]]},
    {id: "obsv", g: "obs", n: "Observatório Territorial", d: "Indicadores definidos no dia 1, comuns à Rede IPR, relatório anual", eb: "Monitoring", lock: 1, ids: [], k: [["Indicadores definidos", "13"], ["Linha de base fechada", "f1"]]},
    {id: "rprod", g: "agro", n: "Rede de associados e explorações", d: "Cada exploração no mapa, na sua bacia: área, culturas, estado da certificação", eb: "Finder", ids: ["ifap_p", "concelhos", "caop"], liga: ["concelhos"], k: [["Explorações no mapa", "f1"], ["Hectares em modo de produção biológico", "f1"], ["Bacias com associados", "f1"]]},
    {id: "mercados", g: "agro", n: "Mercados e circuitos curtos", d: "Mercados, lojas e cabazes; distância de cada exploração ao seu ponto de venda", eb: "Finder", ids: ["o_nomes", "o_estradas"], k: [["Mercados no mapa", "mercados"], ["Distância média produtor-mercado", "f1"]]},
    {id: "conv", g: "agro", n: "Conversão e certificação", d: "Parcelas e ocupação IFAP, zonas vulneráveis a nitratos, vizinhos convencionais e faixas junto à água", eb: "Analyzer", ids: ["ifap_p", "ifap_o", "nitratos", "cos23", "ran"], k: [["Hectares em conversão", "f1"], ["Parcelas com vizinho convencional", "f1"]]},
    {id: "fert", g: "agro", n: "Fertilidade e solo vivo", d: "Capacidade de uso, carta de solos, carbono orgânico, erosão; análises de solo dos associados por cima", eb: "Analyzer", ids: ["sroa", "solos", "carbono", "l_erosao"], k: [["Carbono orgânico médio", "f1"], ["Análises de solo carregadas", "f1"]]},
    {id: "rega", g: "agro", n: "Água de rega", d: "Captações, aquíferos, massas de água e escassez; a rega dimensiona-se pela bacia, não pela parcela", eb: "Analyzer", ids: ["capt_p", "capt_sup", "aquif", "massas", "wei"], k: [["Explorações em bacia com escassez", "f1"]]},
    {id: "clima", g: "agro", n: "Clima e calendário agrícola", d: "Temperatura, geadas, precipitação, insolação, radiação, humidade, evapotranspiração", eb: "Analyzer", ids: ["temp_med", "geada_ano", "geada_dias", "precip", "insolacao", "radiacao", "humidade", "etr", "aridez"], k: [["Dias de geada, média da rede", "f1"]]},
    {id: "pecu", g: "agro", n: "Pecuária, pastagens e apicultura biológicas", d: "Pastagens e montado, encabeçamento, ocupação IFAP; leite, carne e mel em modo biológico", eb: "Analyzer", ids: ["cos23", "ifap_o", "hab_6310", "swf21"], k: [["Cabeças normais por hectare, média da rede", "f1"], ["Apiários no mapa", "f1"]]},
    {id: "sem", g: "agro", n: "Sementes e variedades regionais", d: "Bancos e trocas de sementes, variedades tradicionais, produtores de semente biológica", eb: "Finder", ids: [], k: [["Variedades registadas", "f1"]]},
    {id: "biof", g: "agro", n: "Biodiversidade funcional", d: "Sebes e pequenos bosquetes, densidade de copa, ocorrências de aves e plantas", eb: "Analyzer", ids: ["swf21", "copa18", "n_gbif_aves", "n_gbif_plantas", "habitats"], k: [["Metros de sebe por hectare", "f1"]]},
    {id: "tecn", g: "agro", n: "Assistência técnica e BioAssistência", d: "Visitas, pedidos e diagnósticos georreferenciados: pragas, doenças, fertilização", eb: "Monitoring", ids: [], k: [["Pedidos este ano", "0"], ["Pragas registadas no mapa", "0"]]},
    {id: "educ", g: "agro", n: "Formação e hortas escolares", d: "Cursos, escolas com hortas biológicas, dias abertos nas explorações", eb: "Monitoring", ids: [], k: [["Escolas no mapa", "f1"], ["Formandos este ano", "f1"]]}
  ];
  var TODOS = MOD.map(function (m) { return m.id; });
  var PERFIS = [
    {id: "rede", n: "Rede de aldeias", d: "Redes e associações de desenvolvimento local", a: "sub-bacia de cada aldeia e mapa público", on: TODOS},
    {id: "municipio", n: "Município", d: "Câmaras municipais e juntas de freguesia", a: "bacias do concelho e plano de fixação", on: ["delim", "base", "hidro", "infil", "fogo", "perigo", "risco", "cond", "cadastro", "aldeias", "presenca", "serv", "econ", "terras", "capitais", "capac", "acolh", "dagua", "comissao", "publico", "ancora", "obsv"]},
    {id: "bacia", n: "Bacia", d: "Comissões de bacia e associações de regantes", a: "estrutura hídrica e Observatório", on: ["delim", "base", "hidro", "keyline", "infil", "nasc", "cheias", "solos", "ocup", "bio", "fogo", "risco", "cond", "dagua", "dresto", "comissao", "obsv"]},
    {id: "propriedade", n: "Propriedade", d: "Herdades, quintas e investidores", a: "Base Cartográfica na parcela", on: ["delim", "base", "hidro", "keyline", "infil", "solos", "ocup", "fogo", "perigo", "cond", "cadastro", "dagua", "dresto", "obsv"]},
    {id: "associacao", n: "Associação agrícola", d: "Associações de produtores e de agricultura biológica", a: "mapa dos associados, mercados e métricas da produção", on: ["delim", "base", "hidro", "infil", "solos", "ocup", "bio", "fogo", "cond", "cadastro", "econ", "terras", "capitais", "rprod", "mercados", "conv", "fert", "rega", "clima", "pecu", "sem", "biof", "tecn", "educ", "publico", "ancora", "obsv"]},
    {id: "conservacao", n: "Conservação e renaturalização", d: "Organizações de conservação, rewilding e restauro ecológico", a: "habitats, corredores e fogo", on: ["delim", "base", "hidro", "keyline", "nasc", "solos", "ocup", "bio", "fogo", "perigo", "risco", "cond", "cadastro", "terras", "capitais", "patr", "dagua", "publico", "ancora", "obsv"]},
    {id: "profissional", n: "Profissional", d: "Projectistas da Rede IPR", a: "ferramentas de desenho", on: ["delim", "base", "hidro", "keyline", "infil", "solos", "ocup", "bio", "fogo", "cond", "dagua", "dresto", "obsv"]}
  ];
  var BACIAS = ENT.id === "adxtur" ? [
    {id: "ceira", n: "Mondego, pelo rio Ceira", a: ["Cepos", "Fajão", "Caterredor", "Candal", "Campelo"], nota: "3 sub-bacias"},
    {id: "zezere", n: "Zêzere", a: ["Coentral Grande", "Álvaro"], nota: "cabeceira no Santo António da Neve"},
    {id: "ocreza", n: "Tejo, pelo rio Ocreza", a: ["Martim Branco", "Foz do Cobrão", "Ortiga"], nota: "Foz do Cobrão na fronteira; Ortiga fora do limite"}
  ] : AGRO ? [
    // As dez regiões hidrográficas da Lei da Água (RH1 a RH10), as mesmas da camada «Regiões hidrográficas».
    {id: "rh1", n: "RH1 · Minho e Lima", a: ["Alto Minho"], nota: "a confirmar com a Agrobio"},
    {id: "rh2", n: "RH2 · Cávado, Ave e Leça", a: ["Braga", "Porto"], nota: "a confirmar com a Agrobio"},
    {id: "rh3", n: "RH3 · Douro", a: ["Trás-os-Montes", "Douro", "Beira Alta"], nota: "a confirmar com a Agrobio"},
    {id: "rh4", n: "RH4 · Vouga, Mondego e Lis", a: ["Aveiro", "Coimbra", "Leiria"], nota: "a confirmar com a Agrobio"},
    {id: "rh5", n: "RH5 · Tejo e ribeiras do Oeste", a: ["Lisboa", "Oeiras", "Cascais", "Amadora", "Loures", "Oeste", "Ribatejo", "Beira Baixa"], nota: "sede e a maioria dos mercados"},
    {id: "rh6", n: "RH6 · Sado e Mira", a: ["Alentejo Litoral", "Setúbal"], nota: "a confirmar com a Agrobio"},
    {id: "rh7", n: "RH7 · Guadiana", a: ["Alentejo interior"], nota: "a confirmar com a Agrobio"},
    {id: "rh8", n: "RH8 · Ribeiras do Algarve", a: ["Algarve"], nota: "a confirmar com a Agrobio"},
    {id: "rh9", n: "RH9 · Açores", a: ["nove ilhas"], nota: "muitas camadas do IPR só cobrem o continente"},
    {id: "rh10", n: "RH10 · Madeira", a: ["Madeira", "Porto Santo"], nota: "muitas camadas do IPR só cobrem o continente"}
  ] : [];
  var ZONA = ENT.id === "adxtur" ? [[-8.45, 39.55], [-7.35, 40.35]] : AGRO ? [[-9.6, 36.9], [-6.1, 42.2]] : null;
  var CATS = AGRO ? [["merc", "Mercados, lojas e cabazes"], ["terra", "Terra disponível para arrendar ou ceder"], ["sem", "Sementes e trocas"], ["praga", "Pragas e doenças observadas"], ["agua", "Água e regadio"], ["vol", "Voluntariado e estágios nas explorações"]] : [["serv", "Serviços: alojamento, restauração, loja, transporte"], ["casa", "Casas devolutas, à venda ou para arrendar"], ["agua", "Nascentes e linhas de água secas ou entupidas"], ["risco", "Caminhos fechados e acumulação de combustível"], ["pat", "Património e saber local"], ["vol", "Voluntariado e trabalho"]];
  var PASSOS = ["Perfil", "Bacias", "Módulos", "Repovoamento", "Acessos e mapa público", "Rever e guardar"];

  // ---------- Estado ----------
  var C = ENT.cfg || {};
  var S = {perfil: C.perfil || (AGRO ? "associacao" : "rede"), bacias: {}, mods: {}, cats: {}, feito: !!C.feito, passo: 1, so: true, aberto: {}};
  (C.bacias && C.bacias.length ? C.bacias : BACIAS.map(function (b) { return b.id; })).forEach(function (b) { S.bacias[b] = true; });
  (C.cats && C.cats.length ? C.cats : CATS.map(function (c) { return c[0]; })).forEach(function (c) { S.cats[c] = true; });
  if (C.modulos && C.modulos.length) C.modulos.forEach(function (m) { S.mods[m] = true; }); else perfil(S.perfil);
  function perfil(p) { S.mods = {}; PERFIS.filter(function (x) { return x.id === p; })[0].on.forEach(function (m) { S.mods[m] = true; }); }
  function mod(id) { return MOD.filter(function (m) { return m.id === id; })[0]; }
  function on(m) { return !!(m.lock || S.mods[m.id]); }
  function falta(m) { return (m.precisa || []).filter(function (p) { return !on(mod(p)); }); }
  function activos() { return MOD.filter(function (m) { return on(m) && !falta(m).length; }); }
  function existe(id) { return !!(W.IPRViz && W.IPRViz.catalogo.some(function (e) { return e.id === id; })); }
  function cat(id) { return W.IPRViz ? W.IPRViz.catalogo.filter(function (e) { return e.id === id; })[0] : null; }
  function camadasEnt() { var o = {}; activos().forEach(function (m) { m.ids.forEach(function (i) { if (existe(i)) o[i] = 1; }); }); return Object.keys(o); }
  function nBacias() { return BACIAS.filter(function (b) { return S.bacias[b.id]; }).length; }
  function viz() { return W.__ipe && W.__ipe.viz; }
  function act() { var v = viz(); try { return v && v.activas ? v.activas() : []; } catch (e) { return []; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function espera(f) { var n = 0, t = setInterval(function () { n++; if ((W.__ipe && W.__ipe.viz && D.querySelector("#ipe .ipe-top")) || n > 120) { clearInterval(t); try { f(); } catch (e) { if (W.console) console.warn("entidade.js", e); } } }, 250); }

  // ---------- Estilo (tema escuro do Atlas) ----------
  var css =
    "#ipr-ent-dir.dentro{top:0;left:0;width:auto}#ipr-ent-dir{position:absolute;top:56px;right:0;bottom:0;width:340px;z-index:30;background:#16170f;border-left:1px solid #383A33;color:#C3C5BC;font:13px/1.45 Inter,system-ui,sans-serif;display:flex;flex-direction:column}" +
    "#ipr-ent-dir.fechado{top:auto;left:auto;bottom:140px;right:12px;width:auto;border:1px solid #383A33;border-radius:6px;background:#16170f;box-shadow:0 4px 14px rgba(0,0,0,.35)}#ipr-ent-dir.fechado .h{border-bottom:0;padding:6px 8px}" +
    "#ipr-ent-dir .h{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #2a2c25}" +
    "#ipr-ent-dir .h b{flex:1;color:#E6E7E0;font:600 14px Outfit,Inter,sans-serif}" +
    "#ipr-ent-dir.fechado .h b,#ipr-ent-dir.fechado .c{display:none}" +
    "#ipr-ent-dir .c{overflow:auto;flex:1;padding:10px 12px 20px}" +
    "html.ipr-ent-cli #ipe .ipe-tab[data-tab=\"proj\"],html.ipr-ent-cli #ipe .ipe-tab[data-tab=\"org\"]{display:none!important}" +
    "#ipr-ent-dir .tb{display:flex;border-bottom:1px solid #2a2c25}#ipr-ent-dir .tb button{flex:1;background:none;border:0;border-bottom:2px solid transparent;color:#9aa08f;font:600 12px Inter,sans-serif;padding:8px 2px;cursor:pointer}#ipr-ent-dir .tb button[aria-selected=true]{color:#E6E7E0;border-bottom-color:#94BE39}#ipr-ent-dir.fechado .tb{display:none}" +
    "#ipr-ent-dir .s,#ipr-ent-esq .s{color:#8b8f80;font-size:12px}#ipr-ent-dir #ipe-com{position:static}" +
    ".ipr-ent-og{margin-top:8px;border-top:1px solid #2a2c25;padding-top:8px;font:12px/1.4 Inter,sans-serif;color:#C3C5BC}.ipr-ent-og .t{font:600 11px Inter;letter-spacing:.06em;text-transform:uppercase;color:#B8A83A;margin-bottom:4px}" +
    ".ipr-ent-og .g{display:flex;align-items:center;gap:6px;margin:6px 0 2px;font-weight:600}.ipr-ent-og .g small{margin-left:auto;color:#8b8f80}.ipr-ent-og .cor{width:10px;height:10px;border-radius:2px;flex:0 0 10px}" +
    ".ipr-ent-og label.c{display:flex;align-items:center;gap:6px;padding:2px 0 2px 16px;cursor:pointer}.ipr-ent-og label.c span{flex:1;min-width:0}.ipr-ent-og label.c button{background:none;border:0;color:#94BE39;cursor:pointer;font-size:13px}" +
    ".ipr-ent-fe{display:flex;flex-wrap:wrap;gap:6px}.ipr-ent-fe .s{flex-basis:100%}" +
    "#ipr-ent-dir .q .tipo{font:600 11px Inter;letter-spacing:.06em;text-transform:uppercase;color:#B8A83A}#ipr-ent-dir .q h2{margin:2px 0 12px;font:600 20px/1.2 Outfit,Inter,sans-serif;color:#E6E7E0}" +
    "#ipr-ent-dir .nums{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:14px}#ipr-ent-dir .nums .n{border:1px solid #2a2c25;border-radius:6px;padding:10px}#ipr-ent-dir .nums b{display:block;font:600 24px/1 Outfit,Inter,sans-serif;color:#94BE39}#ipr-ent-dir .nums span{font-size:12px;color:#9aa08f}" +
    "#ipr-ent-dir .px{border-left:3px solid #94BE39;background:#1d1f17;padding:10px 12px;margin-bottom:16px}#ipr-ent-dir .px p{margin:4px 0 8px;color:#D6D8CF}#ipr-ent-dir a.ipr-ent-b{display:inline-block;text-decoration:none}" +
    "#ipr-ent-dir .t{font:600 11px Inter;letter-spacing:.06em;text-transform:uppercase;color:#B8A83A;margin-bottom:6px}#ipr-ent-dir .sec{margin-bottom:16px}" +
    "#ipr-ent-dir .g{display:flex;align-items:center;gap:6px;margin:8px 0 4px;font-weight:600;color:#C3C5BC}#ipr-ent-dir .g .cor{width:10px;height:10px;border-radius:2px}" +
    "#ipr-ent-dir button.it{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;background:#1b1c16;border:1px solid #2a2c25;border-radius:6px;color:#E6E7E0;padding:8px 10px;margin:4px 0;cursor:pointer;font:13px Inter,sans-serif}#ipr-ent-dir button.it span{color:#9aa08f;font-size:12px;white-space:nowrap}#ipr-ent-dir button.it:hover{border-color:#94BE39}" +
    "#ipr-ent-dir a.mais{display:inline-block;margin-top:6px;color:#94BE39;font-size:12px;text-decoration:none}#ipr-ent-dir .rod{display:flex;gap:8px;flex-wrap:wrap}" +
    "html.ipr-ent-so #ipe li.ipr-dl{display:none!important}" +
    "#ipr-ent-dir .add{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#ipr-ent-dir .ipr-ent-b.bc{margin:-2px 0 6px;font-size:11px}" +
    ".ipr-ent-toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:99999;background:#16170f;color:#E6E7E0;border:1px solid #94BE39;border-radius:6px;padding:10px 14px;font:13px Inter,sans-serif;max-width:420px;box-shadow:0 6px 20px rgba(0,0,0,.4)}" +
    "#ipr-ent-esq .ap{display:flex;align-items:center;justify-content:space-between;margin-top:10px;font:600 11px Inter;letter-spacing:.06em;text-transform:uppercase;color:#B8A83A}" +
    ".ipr-ent-b{all:unset;box-sizing:border-box;cursor:pointer;min-height:32px;padding:5px 10px;border:1px solid #383A33;border-radius:2px;color:#C3C5BC;font:500 12px/1.3 Inter,sans-serif;display:inline-flex;align-items:center;gap:6px}" +
    ".ipr-ent-b:hover{border-color:#94BE39;color:#94BE39}.ipr-ent-b:focus-visible{outline:2px solid #94BE39;outline-offset:1px}" +
    ".ipr-ent-b.p{background:#94BE39;border-color:#94BE39;color:#0f100b;font-weight:600}.ipr-ent-b[disabled]{opacity:.45;cursor:default}" +
    ".ipr-ent-k{border:1px solid #2a2c25;border-radius:4px;background:#1d1f1a;margin:0 0 10px;padding:10px 12px}" +
    ".ipr-ent-k h4{margin:0 0 2px;color:#E6E7E0;font:600 13.5px Outfit,Inter,sans-serif;display:flex;justify-content:space-between;gap:8px}" +
    ".ipr-ent-k .s{font-size:11.5px;color:#8E9186;margin-bottom:6px}" +
    ".ipr-ent-k .r{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-top:1px solid #2a2c25}.ipr-ent-k .r:first-of-type{border-top:0}" +
    ".ipr-ent-k .r b{color:#E6E7E0;white-space:nowrap}.ipr-ent-k .na{color:#8E9186;font-weight:500;font-size:11.5px}" +
    ".ipr-ent-cam{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}" +
    ".ipr-ent-cam button{all:unset;box-sizing:border-box;cursor:pointer;padding:3px 7px;border:1px solid #383A33;border-radius:2px;font-size:11.5px;color:#C3C5BC}" +
    ".ipr-ent-cam button.on{background:#000;color:#94BE39;border-color:#000;box-shadow:inset 3px 0 0 #B8A83A}" +
    ".ipr-ent-cap{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-top:6px}.ipr-ent-cap span{font-size:10.5px;text-align:center;padding:6px 1px;border:1px solid #383A33;color:#94BE39}" +
    ".ipr-ent-seq{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin:6px 0}.ipr-ent-seq span{font-size:10.5px;text-align:center;padding:5px 1px;border:1px solid #383A33}" +
    ".ipr-ent-aviso{border:1px solid #6b5a1e;background:#2a2512;color:#E3D49A;border-radius:4px;padding:8px 10px;font-size:12px;margin:0 0 10px}" +
    "#ipr-ent-esq{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #2a2c25;font:12px Inter,sans-serif;color:#C3C5BC}" +
    "#ipr-ent-esq b{color:#94BE39}" +
    "html.ipr-ent-so #ipe .ipr-it.ipr-ent-fora{display:none!important}" +
    "#ipr-ent-wiz{position:fixed;inset:0;z-index:100000;background:rgba(10,11,8,.72);display:flex;align-items:center;justify-content:center;padding:16px}" +
    "#ipr-ent-wiz>div{width:min(1040px,100%);max-height:100%;display:flex;flex-direction:column;background:#16170f;color:#C3C5BC;border:1px solid #383A33;border-radius:4px;font:14px/1.5 Inter,system-ui,sans-serif}" +
    "#ipr-ent-wiz .wh{padding:14px 20px 10px;border-bottom:1px solid #2a2c25}" +
    "#ipr-ent-wiz .wh small{color:#8E9186;font-size:12px}#ipr-ent-wiz .bar{height:4px;background:#2a2c25;margin-top:8px}#ipr-ent-wiz .bar i{display:block;height:4px;background:#94BE39}" +
    "#ipr-ent-wiz .wb{overflow:auto;padding:16px 20px;flex:1}" +
    "#ipr-ent-wiz h2{margin:0 0 4px;color:#E6E7E0;font:600 22px/1.25 Outfit,Inter,sans-serif}#ipr-ent-wiz .lead{color:#A9AC9F;margin:0 0 14px;max-width:760px}" +
    "#ipr-ent-wiz .gr{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}" +
    "#ipr-ent-wiz .gh{margin:14px 0 6px;color:#E6E7E0;font:600 14px Outfit,Inter,sans-serif}#ipr-ent-wiz .gh span{color:#8E9186;font:400 12px Inter,sans-serif;margin-left:8px}" +
    "#ipr-ent-wiz .op{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid #383A33;border-radius:2px;min-height:44px}" +
    "#ipr-ent-wiz .op[aria-pressed=true]{background:#000;border-color:#000;box-shadow:inset 3px 0 0 #B8A83A}#ipr-ent-wiz .op[aria-pressed=true] b{color:#94BE39}" +
    "#ipr-ent-wiz .op.lock{cursor:default}#ipr-ent-wiz .op.bl{opacity:.55}#ipr-ent-wiz .op:focus-visible{outline:2px solid #94BE39}" +
    "#ipr-ent-wiz .op .x{flex:none;width:16px;height:16px;border:1px solid #6b6e63;margin-top:2px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#0f100b}" +
    "#ipr-ent-wiz .op[aria-pressed=true] .x{background:#94BE39;border-color:#94BE39}" +
    "#ipr-ent-wiz .op .t{display:flex;flex-direction:column;gap:2px;flex:1}#ipr-ent-wiz .op .t b{color:#E6E7E0;font-weight:600}#ipr-ent-wiz .op .t span{font-size:12.5px;color:#A9AC9F}" +
    "#ipr-ent-wiz .tag{font-size:11px;color:#B8A83A;flex:0 1 auto;max-width:34%;text-align:right;line-height:1.3}" +
    "#ipr-ent-wiz .op .t{min-width:0}#ipr-ent-wiz .wb{overflow-x:hidden}" +
    "#ipr-ent-wiz .wf{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 20px;border-top:1px solid #2a2c25;flex-wrap:wrap}" +
    "#ipr-ent-wiz .res{font-size:12.5px;color:#A9AC9F}" +
    "@media (max-width:800px){#ipr-ent-dir{top:auto;left:0;width:auto;max-height:55%;border-left:0;border-top:1px solid #383A33}#ipr-ent-dir.fechado{left:auto;right:8px;bottom:70px}}";
  var st = D.createElement("style"); st.id = "ipr-ent-css"; st.textContent = css; (D.head || D.documentElement).appendChild(st);

  // ---------- Aplicar ao mapa ----------
  function aplicar(primeira) {
    var v = viz(); if (!v) return;
    var setE = {}; camadasEnt().forEach(function (i) { setE[i] = 1; });
    // Desliga camadas de módulos que saíram (só as do catálogo do configurador, nunca as escolhas do utilizador fora dele).
    var conhecidas = {}; MOD.forEach(function (m) { m.ids.forEach(function (i) { conhecidas[i] = 1; }); });
    act().forEach(function (i) { if (conhecidas[i] && !setE[i]) try { v.ligar(i, false); } catch (e) {} });
    if (primeira) activos().forEach(function (m) { (m.liga || []).forEach(function (i) { if (existe(i) && act().indexOf(i) < 0) try { v.ligar(i, true); } catch (e) {} }); });
    if (primeira && ZONA && W.__ipe.mapa && W.__ipe.mapa.fitBounds) try { W.__ipe.mapa.fitBounds(ZONA, {padding: 40, duration: 0}); } catch (e) {}
    marcarEsq(); painel();
  }
  function marcarEsq() {
    var setE = {}; apoio().forEach(function (i) { setE[i] = 1; }); act().forEach(function (i) { setE[i] = 1; });
    [].forEach.call(D.querySelectorAll("#ipe .ipr-it[data-id]"), function (li) {
      var id = li.getAttribute("data-id"), c = cat(id), fundo = c && c.g === "fundo";
      li.classList.toggle("ipr-ent-fora", !setE[id] && !fundo);
    });
    D.documentElement.classList.toggle("ipr-ent-so", S.so);
    var esq = D.getElementById("ipe-esq"); if (!esq) return;
    var b = D.getElementById("ipr-ent-esq");
    if (!b) { b = D.createElement("div"); b.id = "ipr-ent-esq"; esq.insertBefore(b, esq.firstChild); }
    var hh = orgBloco() + '<div class="ap"><span>Camadas de apoio</span><button type="button" class="ipr-ent-b" data-ent="so">' + (S.so ? "Ver todas" : "Só as de apoio") + "</button></div>";
    if (b.innerHTML !== hh) b.innerHTML = hh;
  }

  // ---------- Organização ligada à entidade (Nuno, 13/11, 10h36: camadas deles à esquerda; à direita o que precisam) ----------
  var ORGID = 0, ORG = null, ORGON = {}, TAB = "painel", COMV = null;
  // Quem entra por uma organização não precisa dos separadores Bases e Organização de sempre: o que é dela está no painel
  // da entidade. A equipa continua a vê-los quando fecha o painel.
  if (!W.tcdEquipa) D.documentElement.classList.add("ipr-ent-cli");
  (function () { var m = W.IPR_ORG_ENT || {}; Object.keys(m).forEach(function (k) { if (m[k] === ENT.id) ORGID = +k; }); })();
  function orgCarregar() {
    if (!ORGID) return;
    var O = W.IPR_ORGS;
    if (O && O.nonce && +O.activa !== ORGID && (O.lista || []).some(function (o) { return +o.id === ORGID; })) {
      // A organização desta entidade passa a ser a activa (o mesmo pedido do selector do Atlas) e volta-se aqui.
      try { W.sessionStorage.setItem("ipr_ent_volta", ENT.id); } catch (e) {}
      location.href = "/atlas/?ipr_org=" + ORGID + "&_ipr_org=" + encodeURIComponent(O.nonce) + "&separador=org"; return;
    }
    var n = 0;
    (function pedir() {
      fetch("/wp-json/tcd/v1/org/camadas", {credentials: "same-origin", headers: {"X-WP-Nonce": ENT.nonce}})
        .then(function (r) { return r.json(); })
        .then(function (d) {
          W.__iprEntOrg = {quando: Date.now(), org: d && d.org ? d.org.id : null, camadas: d && d.camadas ? d.camadas.length : null};
          if (!d || !d.org || +d.org.id !== ORGID) throw new Error("org");
          ORG = d;
          orgMapa();
          if (!ZONA) { var bx = null; (d.camadas || []).forEach(function (c) { var b = c.bbox; if (!b || b.length !== 4) return; bx = bx ? [Math.min(bx[0], b[0]), Math.min(bx[1], b[1]), Math.max(bx[2], b[2]), Math.max(bx[3], b[3])] : b.slice(); });
            if (bx) { ZONA = [[bx[0], bx[1]], [bx[2], bx[3]]]; if (W.__ipe && W.__ipe.mapa) try { if (bx[0] === bx[2]) W.__ipe.mapa.flyTo({center: [bx[0], bx[1]], zoom: 12}); else W.__ipe.mapa.fitBounds(ZONA, {padding: 48, maxZoom: 14, duration: 0}); } catch (e) {} } }
          try { marcarEsq(); if (D.getElementById("ipr-ent-dir")) painel(); } catch (e) {}
        })
        .catch(function (e) { W.__iprEntOrgErro = String(e); if (++n < 6) setTimeout(pedir, 2500); });
    })();
  }
  var ORGMAPA = false;
  function orgMapa() {
    if (!ORG || ORGMAPA || !(W.__ipe && W.__ipe.mapa && W.__ipe.viz)) return;
    ORGMAPA = true; (ORG.camadas || []).forEach(function (c) { try { orgLigar(c, true); } catch (e) {} });
  }
  function orgCam(id) { return ORG ? (ORG.camadas || []).filter(function (c) { return +c.id === +id; })[0] : null; }
  function orgLigar(c, on) {
    var m = W.__ipe && W.__ipe.mapa; if (!m || !c) return;
    var sid = "ent-org-" + c.id, ls = [sid + "-f", sid + "-l", sid + "-p"];
    ORGON[c.id] = !!on;
    if (m.getSource(sid)) { ls.forEach(function (l) { if (m.getLayer(l)) m.setLayoutProperty(l, "visibility", on ? "visible" : "none"); }); return; }
    if (!on) return;
    fetch(c.url, {credentials: "same-origin", headers: {"X-WP-Nonce": ENT.nonce}}).then(function (r) { return r.json(); }).then(function (gj) {
      if (!gj || gj.type !== "FeatureCollection" || m.getSource(sid)) return;
      var cor = c.cor || "#94BE39";
      m.addSource(sid, {type: "geojson", data: gj});
      m.addLayer({id: sid + "-f", type: "fill", source: sid, filter: ["==", ["geometry-type"], "Polygon"], paint: {"fill-color": cor, "fill-opacity": 0.15}});
      m.addLayer({id: sid + "-l", type: "line", source: sid, filter: ["!=", ["geometry-type"], "Point"], paint: {"line-color": cor, "line-width": 2}});
      m.addLayer({id: sid + "-p", type: "circle", source: sid, filter: ["==", ["geometry-type"], "Point"], paint: {"circle-color": cor, "circle-radius": 6, "circle-stroke-color": "#111", "circle-stroke-width": 1.5}});
      if (W.maplibregl) m.on("click", sid + "-p", function (e) {
        var f = e.features && e.features[0]; if (!f) return; var pr = f.properties || {};
        new W.maplibregl.Popup({closeButton: true}).setLngLat(f.geometry.coordinates).setHTML('<div style="max-width:260px;font:13px/1.4 Inter,sans-serif;color:#222"><b>' + esc(pr.nome || "") + "</b>" + (pr.o_que ? "<br>" + esc(pr.o_que) : "") + (pr.local ? '<br><span style="color:#555">' + esc(pr.local) + "</span>" : "") + (pr.dia ? "<br>" + esc(pr.dia) : "") + (pr.fonte ? '<br><span style="color:#777;font-size:11px">Fonte: ' + esc(pr.fonte) + "</span>" : "") + (pr.estado ? '<br><span style="color:#8a6d00;font-size:11px">' + esc(pr.estado) + "</span>" : "") + "</div>").addTo(m);
      });
    }).catch(function () {});
  }
  function orgIr(c) { var m = W.__ipe && W.__ipe.mapa; if (!m || !c || !c.bbox) return; var b = c.bbox; if (b[0] === b[2] && b[1] === b[3]) m.flyTo({center: [b[0], b[1]], zoom: 13}); else m.fitBounds([[b[0], b[1]], [b[2], b[3]]], {padding: 48, maxZoom: 15, duration: 700}); }
  function orgBloco(todos) {
    if (!ORG) return ORGID ? '<div class="ipr-ent-og"><div class="s">A carregar as camadas da organização…</div></div>' : "";
    var gs = ORG.grupos || [], cs = ORG.camadas || [];
    var h = '<div class="ipr-ent-og"><div class="t">Camadas da organização</div>';
    gs.forEach(function (g) {
      var dele = cs.filter(function (c) { return c.grupo === g.id; });
      if (!dele.length && !todos) return;
      h += '<div class="g"><span class="cor" style="background:' + esc(g.cor || "#666") + '"></span>' + esc(g.nome) + "<small>" + dele.length + "</small></div>";
      dele.forEach(function (c) { h += '<label class="c"><input type="checkbox" data-ent-org="' + c.id + '"' + (ORGON[c.id] ? " checked" : "") + "><span>" + esc(c.nome) + '</span><button type="button" data-ent-orgir="' + c.id + '" title="Ir para">↗</button></label>'; });
      if (!dele.length) h += '<div class="s">Ainda sem camadas.</div>';
    });
    return h + "</div>";
  }
  // Ferramentas: as do Atlas, filtradas pelo que a entidade tem ligado.
  var FERR = [
    ["data-agua-sim", "Simular água", "cheias"], ["data-fogo-sim", "Simular fogo", "perigo"],
    ['data-tool="desenhar"', "Desenhar"], ['data-tool="marcador"', "Notas no mapa"], ['data-tool="importar"', "Carregar ficheiro"],
    ['data-tool="area"', "Medir área"], ['data-tool="regua"', "Medir distância"], ['data-tool="parcelas"', "Parcelas do cadastro", "cadastro"],
    ['data-tool="foto"', "Fotografia georreferenciada"], ['data-tool="gps"', "A minha posição"], ['data-tool="3d"', "Vista 3D"],
    ['data-tool="sol"', "Sol e sombras"], ['data-tool="historico"', "Imagens antigas"]
  ];
  function ferrHtml() {
    var h = '<div class="ipr-ent-fe">', n = 0;
    FERR.forEach(function (f, i) {
      if (f[2] && !S.mods[f[2]]) return;
      if (!D.querySelector("[" + f[0] + "]")) return;
      n++; h += '<button type="button" class="ipr-ent-b" data-ent-ferr="' + i + '">' + esc(f[1]) + "</button>";
    });
    if (!S.mods.cheias && !S.mods.perigo) h += '<p class="s">Os simuladores de água e de fogo entram com os módulos «Cheias e simulador de água» e «Perigosidade e simulador de fogo».</p>';
    return n ? h + "</div>" : '<p class="s">As ferramentas do Atlas ainda estão a carregar.</p>';
  }
  function comMostrar(on) {
    var c = D.getElementById("ipe-com"); if (!c) return;
    if (on) {
      if (!COMV) COMV = {pai: c.parentNode, prox: c.nextSibling};
      var alvo = D.getElementById("ipr-ent-comc"); if (alvo && c.parentNode !== alvo) alvo.appendChild(c);
    } else if (COMV && c.parentNode !== COMV.pai) { COMV.pai.insertBefore(c, COMV.prox && COMV.prox.parentNode === COMV.pai ? COMV.prox : null); }
  }

  // ---------- Painel da direita ----------
  function valor(v) {
    if (v === "f1") return '<span class="na">após a Fase 1</span>';
    if (v === "f2") return '<span class="na">após a Fase 2</span>';
    if (v === "bacias") return BACIAS.length ? nBacias() : '<span class="na">por delimitar</span>';
    if (v === "mercados") return W.IPR_ENT_MERCADOS ? String(W.IPR_ENT_MERCADOS) : '<span class="na">por carregar</span>';
    if (v === "rede") return ENT.id === "adxtur" ? "27" : '<span class="na">por carregar</span>';
    if (v === "piloto") return BACIAS.filter(function (b) { return S.bacias[b.id]; }).reduce(function (s, b) { return s + b.a.length; }, 0) || '<span class="na">por definir</span>';
    return esc(v);
  }
  // Painel da organização (Nuno, 13/11, 11h15-11h16): ocupa o bloco da direita inteiro; diz quem é a organização, os números
  // que já têm valor, os locais e projectos dela (o mais importante do mapa), o próximo passo e as ferramentas. Módulos,
  // fases e camadas ficam no «Configurar».
  var APOIO = {
    associacao: ["solos", "sroa", "carbono", "ran", "nitratos", "ifap_p", "cos23", "capt_p", "aquif", "precip", "geada_ano", "temp_med"],
    rede: ["o_nomes", "hidro", "bip_23", "percursos", "o_aguapts", "ard15", "perig_e", "ren", "ran", "cos23"],
    municipio: ["caop", "o_edif", "viaria", "ren", "ran", "crus", "cad", "ard15", "perig_e", "cos23", "hidro"],
    bacia: ["bacias", "hidro", "l_streams", "o_aguapts", "capt_p", "aquif", "massas", "inund100", "cos23", "sroa"],
    conservacao: ["n2k", "rnap", "habitats", "prof_cor", "invasoras", "copa18", "ard15", "perig_e", "hidro", "cos23"],
    propriedade: ["cad", "ren", "ran", "sroa", "l_declives", "l_curvas5", "hidro", "capt_p", "ard15", "perig_e", "cos23"],
    profissional: ["cad", "ren", "ran", "crus", "l_declives", "l_curvas5", "hidro", "ard15", "perig_e", "cos23"]
  };
  var BASE_SEMPRE = ["f_ortosat", "r_somb", "concelhos", "caop"];
  function apoio() { var o = {}; BASE_SEMPRE.concat(APOIO[S.perfil] || APOIO.propriedade).forEach(function (i) { if (existe(i)) o[i] = 1; }); return Object.keys(o); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function numeros() {
    var cs = ORG ? ORG.camadas || [] : [], tot = 0, ha = 0, porG = {};
    cs.forEach(function (c) { tot += +c.n || 0; if (c.geom === "poligono") ha += +c.ha || 0; porG[c.grupo] = (porG[c.grupo] || 0) + (+c.n || 0); });
    var r = [];
    if (AGRO) { r.push(["Explorações no mapa", porG.exploracoes || 0]); r.push(["Mercados e pontos de venda", Math.max(0, (porG.mercados || 0) - 1)]); }
    else if (ENT.id === "adxtur") { r.push(["Aldeias na rede", 27]); r.push(["Bacias de trabalho", nBacias()]); }
    else r.push(["Locais e áreas no mapa", tot]);
    if (ha) r.push(["Hectares desenhados", ha]);
    if (BACIAS.length && !AGRO && ENT.id !== "adxtur") r.push(["Bacias", nBacias()]);
    if (AGRO) r.push(["Bacias com associados", nBacias()]);
    r.push(["Camadas próprias", cs.length]);
    return r;
  }
  function proximo() {
    var cs = ORG ? ORG.camadas || [] : [];
    var principal = AGRO ? "exploracoes" : null;
    var temPrincipal = principal ? cs.some(function (c) { return c.grupo === principal && +c.n > 0; }) : cs.length > 0;
    if (!temPrincipal) return ["Ponha no mapa os " + (AGRO ? "locais e as parcelas dos produtores associados" : "seus locais, terrenos e projectos") + ". Pode carregar KML, KMZ, GeoJSON, GPX, shapefile (zip), GeoPackage, DXF ou DWG, uma lista CSV com coordenadas, ou desenhar no mapa.", "Carregar ficheiro", "#carregar"];
    if (!S.feito && PODE) return ["Confirme o tipo de organização e as bacias em que trabalha. Leva dois minutos.", "Configurar", "#wiz"];
    return ["Peça à equipa do IPR a leitura do território (Fase 1): água, solo, fogo e condicionantes, sobre os seus locais.", "Pedir à equipa", "/contacto/"];
  }
  function painel() {
    var p = D.getElementById("ipr-ent-dir"), dir = D.getElementById("ipe-dir"), ipe = D.getElementById("ipe");
    if (!p) { p = D.createElement("aside"); p.id = "ipr-ent-dir"; p.setAttribute("aria-label", "Painel da organização"); }
    var casa = dir || ipe || D.body;
    if (p.parentNode !== casa) { if (dir && getComputedStyle(dir).position === "static") dir.style.position = "relative"; casa.appendChild(p); p.classList.toggle("dentro", !!dir); }
    if (TAB === "com") { painelCom(p); return; }
    comMostrar(false);
    var O = W.IPR_ORGS, papel = ""; if (O && O.lista) O.lista.forEach(function (o) { if (+o.id === ORGID) papel = o.papel || ""; });
    var tipo = (PERFIS.filter(function (x) { return x.id === S.perfil; })[0] || {}).n || "";
    var h = '<div class="q"><div class="tipo">' + esc(tipo) + (papel ? " · " + esc(papel) : "") + '</div><h2>' + esc(ENT.nome) + "</h2></div>";
    h += '<div class="nums">' + numeros().map(function (n) { return '<div class="n"><b>' + fmt(n[1]) + "</b><span>" + esc(n[0]) + "</span></div>"; }).join("") + "</div>";
    var px = proximo();
    h += '<div class="px"><div class="t">Próximo passo</div><p>' + esc(px[0]) + '</p>' + (px[2] === "#wiz" ? '<button type="button" class="ipr-ent-b p" data-ent="wiz">' + esc(px[1]) + "</button>" : px[2] === "#carregar" ? '<button type="button" class="ipr-ent-b p" data-ent-carregar="f">' + esc(px[1]) + "</button>" : '<a class="ipr-ent-b p" href="' + px[2] + '" target="_blank" rel="noopener">' + esc(px[1]) + "</a>") + "</div>";
    h += '<div class="sec"><div class="t">Os nossos locais e projectos</div>';
    var cs = ORG ? ORG.camadas || [] : [];
    if (!ORG) h += '<p class="s">A carregar…</p>';
    else if (!cs.length) h += '<p class="s">Ainda não há nada no mapa da organização.</p>';
    else (ORG.grupos || []).forEach(function (g) {
      var dele = cs.filter(function (c) { return c.grupo === g.id; }); if (!dele.length) return;
      h += '<div class="g"><span class="cor" style="background:' + esc(g.cor || "#666") + '"></span>' + esc(g.nome) + "</div>";
      dele.forEach(function (c) {
        var nn = +c.n || 0, pt = /^ponto/.test(c.geom || ""), info = nn + (pt ? (nn === 1 ? " local" : " locais") : (nn === 1 ? " área" : " áreas")) + (c.ha ? " · " + fmt(c.ha) + " ha" : "");
        h += '<button type="button" class="it" data-ent-orgir="' + c.id + '"><b>' + esc(c.nome) + "</b><span>" + info + "</span></button>";
        if (!pt && W.IPR_ENT_BASES) h += '<button type="button" class="ipr-ent-b bc" data-ent-base="' + c.id + '">Fazer a Base Cartográfica desta área</button>';
      });
    });
    h += '<div class="add"><button type="button" class="ipr-ent-b" data-ent-carregar="f">Carregar ficheiro</button><button type="button" class="ipr-ent-b" data-ent-carregar="csv">Lista CSV</button><button type="button" class="ipr-ent-b" data-ent-carregar="d">Desenhar</button></div>' +
      '<p class="s">KML, KMZ, GeoJSON, GPX, shapefile (zip), GeoPackage, DXF, DWG. CSV com colunas nome, latitude e longitude (de Excel: «Guardar como CSV»). O que carregar fica nos seus Locais.</p></div>';
    var B = W.IPR_ENT_BASES;
    if (B) h += '<div class="sec bcs"><div class="t">Bases Cartográficas</div><div class="nums"><div class="n"><b>' + (+B.restam || 0) + '</b><span>gratuitas por usar, de ' + (+B.total || 0) + '</span></div></div>' +
      '<p class="s">Cada Base Cartográfica cobre um produtor ou terreno sob gestão' + (B.ha ? ", até " + fmt(B.ha) + " ha somados" : "") + '. Desenhe ou carregue a área, carregue em «Fazer a Base Cartográfica» e use o vale <b>' + esc(B.codigo) + '</b>. A Base fica na lista de Bases e no mapa, sobre o local.</p>' +
      '<button type="button" class="ipr-ent-b p" data-ent-base="0">Fazer uma Base Cartográfica</button></div>';
    h += '<div class="sec"><div class="t">Ferramentas</div>' + ferrHtml() + "</div>";
    h += '<div class="sec rod"><button type="button" class="ipr-ent-b" data-ent-tab="com">Comunidade e avisos</button>' + (PODE ? '<button type="button" class="ipr-ent-b" data-ent="wiz">Configurar</button>' : "") + "</div>";
    if (W.IPR_NIVEL === "explorer") h += '<p class="s">Parte das camadas de apoio (condicionantes, água, solo) precisa do Intelligence.</p>';
    p.innerHTML = '<div class="h"><b>Organização</b>' + (W.tcdEquipa ? '<button type="button" class="ipr-ent-b" data-ent="fechar" title="' + (p.classList.contains("fechado") ? "Abrir o painel da organização" : "Fechar e ver o Atlas da equipa") + '">' + (p.classList.contains("fechado") ? "Organização" : "×") + "</button>" : "") + '</div><div class="c">' + h + "</div>";
  }
  // Carregar: ficheiros pelo importador do Atlas (os formatos são os dele); CSV com coordenadas lido aqui.
  function aviso(txt) { var a = D.createElement("div"); a.className = "ipr-ent-toast"; a.textContent = txt; D.body.appendChild(a); setTimeout(function () { a.remove(); }, 6000); }
  function carregar(k) {
    if (k === "d") { var d = D.querySelector('#ipe [data-tool="desenhar"]'); if (d) d.click(); aviso("Desenhe a área no mapa; quando fechar o polígono, fica nos seus Locais."); return; }
    if (k === "f") { var f = D.getElementById("ipe-file") || D.getElementById("ipe-lfile"); if (f) f.click(); else aviso("O importador do Atlas ainda está a carregar."); return; }
    var i = D.createElement("input"); i.type = "file"; i.accept = ".csv,.txt,text/csv";
    i.addEventListener("change", function () { var fl = i.files && i.files[0]; if (!fl) return; var r = new FileReader(); r.onload = function () { csvLer(String(r.result || "")); }; r.readAsText(fl); });
    i.click();
  }
  function csvLer(txt) {
    var ls = txt.replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (l) { return l.trim(); }); if (ls.length < 2) { aviso("O CSV está vazio."); return; }
    var sep = (ls[0].match(/;/g) || []).length >= (ls[0].match(/,/g) || []).length ? ";" : (ls[0].indexOf("\t") >= 0 ? "\t" : ",");
    var cab = ls[0].split(sep).map(function (x) { return x.trim().toLowerCase().replace(/^"|"$/g, ""); });
    function col(re) { for (var j = 0; j < cab.length; j++) if (re.test(cab[j])) return j; return -1; }
    var ci = col(/^(lat|latitude|y)$/), cj = col(/^(lon|lng|long|longitude|x)$/), cn = col(/^(nome|name|produtor|explora|local|designa)/);
    if (ci < 0 || cj < 0) { aviso("Não encontrei as colunas latitude e longitude no CSV."); return; }
    var n = 0, bx = null, L = W.__ipe && W.__ipe.locais;
    ls.slice(1).forEach(function (l) {
      var v = l.split(sep).map(function (x) { return x.trim().replace(/^"|"$/g, ""); });
      var la = parseFloat(String(v[ci]).replace(",", ".")), lo = parseFloat(String(v[cj]).replace(",", "."));
      if (!isFinite(la) || !isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return;
      try { L.juntar("ponto", [lo, la], cn >= 0 ? v[cn] : ""); n++; bx = bx ? [Math.min(bx[0], lo), Math.min(bx[1], la), Math.max(bx[2], lo), Math.max(bx[3], la)] : [lo, la, lo, la]; } catch (e) {}
    });
    aviso(n ? n + " locais carregados para os seus Locais." : "Nenhuma linha com coordenadas válidas.");
    if (bx && W.__ipe.mapa) try { if (bx[0] === bx[2]) W.__ipe.mapa.flyTo({center: [bx[0], bx[1]], zoom: 13}); else W.__ipe.mapa.fitBounds([[bx[0], bx[1]], [bx[2], bx[3]]], {padding: 60, maxZoom: 13}); } catch (e) {}
  }
  // Base Cartográfica: a área entra nos Locais da pessoa e abre-se o formulário de sempre (Processos › Base Cartográfica),
  // com o nome e o vale da organização já escritos. O formulário e o pagamento são os do Atlas.
  function fazerBase(camId) {
    var B = W.IPR_ENT_BASES || {};
    function abrirForm(nome) {
      var p = D.getElementById("ipr-ent-dir"); if (p && !p.classList.contains("fechado")) { p.classList.add("fechado"); painel(); }
      var tab = D.querySelector('#ipe .ipe-tab[data-tab="enc"]'); if (tab) tab.click();
      var n = 0;
      (function encher() {
        var bt = [].filter.call(D.querySelectorAll("#ipe button, #ipe a"), function (x) { return /^\s*Base Cartogr/i.test(x.textContent) && x.offsetParent; })[0];
        if (bt && !bt.dataset.entFeito) { bt.dataset.entFeito = 1; bt.click(); }
        var nm = [].filter.call(D.querySelectorAll("#ipe input"), function (x) { return /Herdade do Vale|nome do pedido/i.test(x.placeholder || ""); })[0];
        var vl = [].filter.call(D.querySelectorAll("#ipe input"), function (x) { return /OFERTA/i.test(x.placeholder || ""); })[0];
        if (nm || vl) {
          function por(x, v) { if (!x || !v || x.value) return; x.value = v; x.dispatchEvent(new Event("input", {bubbles: true})); x.dispatchEvent(new Event("change", {bubbles: true})); }
          por(nm, nome); por(vl, B.codigo);
          aviso(camId ? "A área está nos seus Locais: carregue em «Usar um dos meus locais» e escolha-a." : "Desenhe ou escolha a área em «01 · Terreno»; o vale da organização já está escrito.");
          return;
        }
        if (++n < 30) setTimeout(encher, 300);
      })();
    }
    if (!camId) { abrirForm(""); return; }
    var c = orgCam(camId); if (!c) return;
    fetch(c.url, {credentials: "same-origin", headers: {"X-WP-Nonce": ENT.nonce}}).then(function (r) { return r.json(); }).then(function (gj) {
      var L = W.__ipe && W.__ipe.locais, k = 0;
      (gj.features || []).forEach(function (f) {
        var g = f.geometry || {}, nm = (f.properties && (f.properties.nome || f.properties.name)) || c.nome;
        if (g.type === "Polygon") { try { L.juntar("area", g.coordinates, nm); k++; } catch (e) {} }
        if (g.type === "MultiPolygon") (g.coordinates || []).forEach(function (pc) { try { L.juntar("area", pc, nm); k++; } catch (e) {} });
      });
      if (!k) { aviso("Esta camada não tem polígonos. Desenhe a área do terreno para fazer a Base Cartográfica."); return; }
      abrirForm(c.nome);
    }).catch(function () { aviso("Não consegui ler a camada."); });
  }
  function painelCom(p) {
    p.innerHTML = '<div class="h"><button type="button" class="ipr-ent-b" data-ent-tab="painel">← Organização</button><b>Comunidade</b></div><div class="c"><div id="ipr-ent-comc"></div></div>';
    var nt = D.querySelector('#ipe .ipe-tab[data-tab="com"]'), ic = D.getElementById("ipe-com");
    if (nt && ic && !ic.querySelector(".ipc-nav")) try { nt.click(); } catch (e) {}
    setTimeout(function () { comMostrar(true); }, 60); setTimeout(function () { if (TAB === "com") comMostrar(true); }, 900);
  }

  // ---------- Assistente ----------
  function op(attr, val, onv, titulo, sub, tag, extra) {
    return '<button type="button" class="op' + (extra || "") + '" aria-pressed="' + onv + '" ' + attr + '="' + val + '"><span class="x">' + (onv ? "✓" : "") + '</span><span class="t"><b>' + esc(titulo) + "</b>" + (sub ? "<span>" + sub + "</span>" : "") + "</span>" + (tag ? '<span class="tag">' + esc(tag) + "</span>" : "") + "</button>";
  }
  function listaMods() {
    return GRUPOS.map(function (g) {
      var ms = MOD.filter(function (m) { return m.g === g[0]; });
      return '<div class="gh">' + esc(g[1]) + "<span>" + esc(g[2]) + '</span></div><div class="gr">' + ms.map(function (m) {
        var f = falta(m), n = m.ids.filter(existe).length;
        var sub = esc(m.d) + "<br>" + n + " camadas do Atlas" + (m.lock ? " · obrigatório" : "") + (f.length ? '<br><span style="color:#E3D49A">Precisa de: ' + f.map(function (x) { return esc(mod(x).n); }).join(", ") + "</span>" : "");
        return op("data-ent-mod", m.id, on(m), m.n, sub, m.eb, (m.lock ? " lock" : "") + (f.length ? " bl" : ""));
      }).join("") + "</div>";
    }).join("");
  }
  function passo() {
    var s = S.passo, h = "";
    if (s === 1) {
      h = "<h2>Que tipo de entidade vai usar a plataforma?</h2><p class='lead'>O perfil escolhe os módulos de partida; no passo 3 pode mudá-los um a um. O método é o mesmo para todos: o que muda são os números de cada território.</p><div class='gr'>" +
        PERFIS.map(function (p) { return op("data-ent-perfil", p.id, S.perfil === p.id, p.n, esc(p.d) + "<br>Arranca por: " + esc(p.a), p.on.length + " módulos"); }).join("") + "</div>";
    } else if (s === 2) {
      h = AGRO ? "<h2>Em que bacias estão os vossos associados?</h2><p class='lead'>Uma rede nacional também se lê pela água: cada exploração é colocada na sua bacia, e as métricas da rede somam-se por bacia antes de se somarem pelo país.</p>"
        : "<h2>Em que bacias está o vosso território?</h2><p class='lead'>A primeira decisão é sempre a bacia. A água não reconhece concelhos: cada aldeia é colocada na sua sub-bacia antes de qualquer outra camada.</p>";
      h += BACIAS.length ? "<div class='gr'>" + BACIAS.map(function (b) { return op("data-ent-bacia", b.id, !!S.bacias[b.id], b.n, esc(b.a.join(", ")), b.nota); }).join("") + "</div>" + (nBacias() ? "" : "<p class='ipr-ent-aviso'>Escolha pelo menos uma bacia.</p>")
        : "<p class='ipr-ent-aviso'>As bacias desta entidade ainda não estão carregadas. A equipa do IPR delimita-as com o LiDAR na Fase 1; até lá, use a camada Bacias hidrográficas no mapa.</p>";
    } else if (s === 3) {
      h = "<h2>Que módulos ligar?</h2><p class='lead'>Os módulos seguem as estruturas de <i>A Arquitectura Bioregional</i> e as fases do SOT-IPR. A ordem não se configura: o design só abre com a água; desligar a hidrografia desliga a estrutura hídrica e o que depende dela.</p>" + listaMods();
    } else if (s === 4) {
      h = (AGRO ? "<h2>Novos agricultores: quantos, onde, por que ordem</h2><p class='lead'>Cada produtor que se instala é uma família no território. O número de novas explorações por bacia vem da capacidade de suporte (solo, água, mercado), não de uma meta.</p><div class='gr'>"
        : "<h2>Repovoamento: quanta gente, que perfis, por que ordem</h2><p class='lead'>O tecto de famílias de cada sub-bacia vem da capacidade de suporte, não de uma meta. Dentro do tecto, cada fase de chegada só abre quando a anterior criou as condições.</p><div class='gr'>") +
        [["1 · Os que mantêm", "Parcelas abandonadas, casas recuperáveis, manutenção de floresta, água e caminhos", "água e acessos mantidos"], ["2 · Os que produzem para dentro", "Solos com aptidão, água no Verão, zonas de uso diário junto à aldeia", "base alimentar local"], ["3 · Os que produzem para fora", "Cadeias de valor compatíveis com a bacia", "rendimento a entrar na bacia"], ["4 · Os que prestam serviços", "Massa crítica por aldeia face ao limiar de cada serviço", "uma família com filhos pode ficar"]].map(function (c) {
          return '<div class="op lock" style="cursor:default"><span class="t"><b>' + c[0] + "</b><span>" + c[1] + '</span><span style="color:#B8A83A">Abre a seguinte quando: ' + c[2] + "</span></span></div>"; }).join("") + "</div><div class='gr' style='margin-top:10px'>" +
        op("data-ent-mod", "capac", on(mod("capac")), mod("capac").n, esc(mod("capac").d)) + op("data-ent-mod", "acolh", on(mod("acolh")), mod("acolh").n, esc(mod("acolh").d)) + "</div>";
    } else if (s === 5) {
      h = "<h2>Quem acede e o que fica público</h2><p class='lead'>Cada decisão fica na menor escala capaz de a resolver bem. Nenhum contributo do mapa público aparece sem moderação, e nada identifica proprietários ou residentes.</p>" +
        "<div class='gh'>Papéis</div><div class='gr'>" + (AGRO ? [["Direcção", "Tudo · configura e modera"], ["Equipa técnica do IPR", "Tudo · camadas e validação"], ["Técnicos da associação", "Assistência técnica e formação, todas as explorações"], ["Associado", "A sua exploração e a sua bacia"], ["Público", "Mercados e mapa público, contributos moderados"]] : [["Coordenação", "Tudo · configura e modera"], ["Equipa técnica do IPR", "Tudo · camadas e validação"], ["Município", "O seu concelho e as suas bacias"], ["Aldeia", "A sua aldeia e a sua sub-bacia"], ["Público", "Mapa público, contributos moderados"]]).map(function (r) { return '<div class="op lock"><span class="t"><b>' + r[0] + "</b><span>" + r[1] + "</span></span></div>"; }).join("") +
        "</div><div class='gh'>Categorias do mapa público</div><div class='gr'>" + CATS.map(function (c) { return op("data-ent-cat", c[0], !!S.cats[c[0]], c[1]); }).join("") + "</div>" +
        (on(mod("publico")) ? "" : "<p class='ipr-ent-aviso'>O módulo Mapa público está desligado no passo 3.</p>");
    } else {
      var am = activos();
      h = "<h2>Rever e guardar</h2><p class='lead'>A plataforma é vossa durante a subscrição. Em cada renovação podem sair e levar o Atlas Territorial Integrado completo (GeoPackage, projecto QGIS e QField, base de dados, documentos e configuração) e uma cópia das camadas do IPR recortada à vossa área, pela bacia e com margem.</p><div class='gr'>" +
        '<div class="op lock"><span class="t"><b>' + esc(PERFIS.filter(function (p) { return p.id === S.perfil; })[0].n) + "</b><span>" + (BACIAS.length ? nBacias() + " bacias · " : "") + am.length + " módulos · " + camadasEnt().length + " camadas à esquerda · " + am.length + " blocos no painel</span></span></div>" +
        '<div class="op lock"><span class="t"><b>Acompanhamento técnico do IPR</b><span>Incluído na Fase 1: delimitação, auditorias e linha de base do Observatório</span></span></div></div>';
    }
    return h;
  }
  function resumo() { return activos().length + " módulos · " + camadasEnt().length + " camadas · " + activos().length + " blocos no painel"; }
  function wiz(abrir) {
    var w = D.getElementById("ipr-ent-wiz");
    if (abrir === false) { if (w) w.remove(); return; }
    if (!w) { w = D.createElement("div"); w.id = "ipr-ent-wiz"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-label", "Configurar a plataforma da entidade"); D.body.appendChild(w); }
    var y = w.querySelector(".wb") ? w.querySelector(".wb").scrollTop : 0, s = S.passo, bloq = s === 2 && BACIAS.length && !nBacias();
    w.innerHTML = "<div><div class='wh'><small>IPR Atlas · Sistema Operativo Territorial · " + esc(ENT.nome) + (PODE ? "" : " · só leitura") + "</small><div style='display:flex;justify-content:space-between;font-size:12.5px;margin-top:4px'><span>Passo " + s + " de 6 · " + PASSOS[s - 1] + "</span><span>Pode voltar atrás em qualquer passo</span></div><div class='bar'><i style='width:" + Math.round(s / 6 * 100) + "%'></i></div></div>" +
      "<div class='wb'>" + passo() + "</div><div class='wf'><button type='button' class='ipr-ent-b' data-ent='voltar'" + (s === 1 ? " disabled" : "") + ">← Voltar</button><span class='res'>" + resumo() + "</span><span style='display:flex;gap:8px'><button type='button' class='ipr-ent-b' data-ent='sair'>Fechar</button>" +
      (s < 6 ? "<button type='button' class='ipr-ent-b p' data-ent='seguinte'" + (bloq ? " disabled" : "") + ">Seguinte →</button>" : (PODE ? "<button type='button' class='ipr-ent-b p' data-ent='guardar'>Guardar e aplicar</button>" : "")) + "</span></div></div>";
    var wb = w.querySelector(".wb"); if (wb) wb.scrollTop = y;
  }
  function guardar(btn) {
    var cfg = {perfil: S.perfil, bacias: Object.keys(S.bacias).filter(function (k) { return S.bacias[k]; }), modulos: Object.keys(S.mods).filter(function (k) { return S.mods[k]; }), cats: Object.keys(S.cats).filter(function (k) { return S.cats[k]; }), feito: true};
    if (btn) { btn.disabled = true; btn.textContent = "A guardar…"; }
    fetch(ENT.rest, {method: "POST", credentials: "same-origin", headers: {"Content-Type": "application/json", "X-WP-Nonce": ENT.nonce}, body: JSON.stringify({cfg: cfg})})
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function () { S.feito = true; wiz(false); aplicar(true); })
      .catch(function (e) { if (btn) { btn.disabled = false; btn.textContent = "Não foi possível guardar (" + e.message + "). Tentar outra vez"; } });
  }
  function mudaMod(id) {
    var m = mod(id); if (!m || m.lock || !PODE) return;
    S.mods[id] = !S.mods[id];
    if (!S.mods[id]) MOD.forEach(function (x) { if ((x.precisa || []).indexOf(id) >= 0) S.mods[x.id] = false; });
  }

  // ---------- Eventos ----------
  D.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-ent],[data-ent-mod],[data-ent-perfil],[data-ent-bacia],[data-ent-cat],[data-ent-cam],[data-ent-abrir],[data-ent-tab],[data-ent-org],[data-ent-orgir],[data-ent-ferr],[data-ent-carregar],[data-ent-base]");
    if (!t) return;
    if (t.hasAttribute("data-ent-org")) { var oc = orgCam(t.getAttribute("data-ent-org")); orgLigar(oc, t.checked); setTimeout(function () { marcarEsq(); if (TAB === "proj") painel(); }, 0); return; }
    if (t.hasAttribute("data-ent-orgir")) { e.preventDefault(); e.stopPropagation(); var oi = orgCam(t.getAttribute("data-ent-orgir")); if (oi && !ORGON[oi.id]) orgLigar(oi, true); orgIr(oi); marcarEsq(); return; }
    if (t.hasAttribute("data-ent-carregar")) { e.preventDefault(); e.stopPropagation(); carregar(t.getAttribute("data-ent-carregar")); return; }
    if (t.hasAttribute("data-ent-base")) { e.preventDefault(); e.stopPropagation(); fazerBase(+t.getAttribute("data-ent-base")); return; }
    if (t.hasAttribute("data-ent-tab")) { e.preventDefault(); e.stopPropagation(); TAB = t.getAttribute("data-ent-tab"); painel(); return; }
    if (t.hasAttribute("data-ent-ferr")) { e.preventDefault(); e.stopPropagation(); var fe = FERR[+t.getAttribute("data-ent-ferr")], nb = fe && D.querySelector("[" + fe[0] + "]"); if (nb) nb.click(); return; }
    var a = t.getAttribute("data-ent"), v = viz();
    e.preventDefault(); e.stopPropagation();
    if (a === "wiz") { S.passo = 1; wiz(true); return; }
    if (a === "sair") { wiz(false); return; }
    if (a === "seguinte") { if (S.passo < 6) S.passo++; var wb = D.querySelector("#ipr-ent-wiz .wb"); if (wb) wb.scrollTop = 0; wiz(true); return; }
    if (a === "voltar") { if (S.passo > 1) S.passo--; wiz(true); return; }
    if (a === "guardar") { guardar(t); return; }
    if (a === "so") { S.so = !S.so; marcarEsq(); return; }
    if (a === "fechar") { var p = D.getElementById("ipr-ent-dir"); p.classList.toggle("fechado"); painel(); return; }
    if (t.hasAttribute("data-ent-cam") && v) { var id = t.getAttribute("data-ent-cam"); v.ligar(id, act().indexOf(id) < 0); setTimeout(painel, 150); return; }
    if (t.hasAttribute("data-ent-abrir")) { var m = t.getAttribute("data-ent-abrir"); S.aberto[m] = !S.aberto[m]; painel(); return; }
    if (!PODE) return;
    if (t.hasAttribute("data-ent-perfil")) { S.perfil = t.getAttribute("data-ent-perfil"); perfil(S.perfil); }
    else if (t.hasAttribute("data-ent-bacia")) { var b = t.getAttribute("data-ent-bacia"); S.bacias[b] = !S.bacias[b]; }
    else if (t.hasAttribute("data-ent-cat")) { var c = t.getAttribute("data-ent-cat"); S.cats[c] = !S.cats[c]; }
    else if (t.hasAttribute("data-ent-mod")) { mudaMod(t.getAttribute("data-ent-mod")); }
    wiz(true); aplicar(false); // ao seleccionar, aparece já à esquerda e à direita
  }, true);
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && D.getElementById("ipr-ent-wiz")) wiz(false); });

  // ---------- Arranque ----------
  try { orgCarregar(); } catch (e) {} // as camadas da organização pedem-se logo, sem esperar pelo mapa
  espera(function () {
    aplicar(true);
    try { orgMapa(); if (ORG) { marcarEsq(); painel(); } } catch (e) {}
    // O mapa é da organização: fecha o tema que o Atlas abre sozinho ao arrancar, enquanto a pessoa não mexer.
    [2500, 6000, 11000].forEach(function (ms) { setTimeout(function () { var x = D.querySelector("#ipr-t62 .ipr-t62-x"); if (x && x.offsetParent !== null) try { x.click(); } catch (e) {} }, ms); });
    // O arranque do Atlas (vista inicial, camadas guardadas da visita anterior) corre depois e repõe o país inteiro e as
    // camadas de sempre. Nos primeiros 10 s volta-se a pôr a zona e as camadas de partida, enquanto a pessoa não mexer no mapa.
    var mexeu = false, m0 = W.__ipe.mapa;
    if (m0 && m0.on) m0.on("movestart", function (e) { if (e && e.originalEvent) mexeu = true; });
    // Se o Atlas afastar o mapa sozinho (vista do país ao arrancar, mesmo com o separador em segundo plano), volta à zona.
    var t0 = Date.now();
    if (ZONA && m0 && m0.on) m0.on("moveend", function (e) {
      if (mexeu || (e && e.originalEvent) || Date.now() - t0 > 45000) return;
      if (m0.getZoom() < 7.5) setTimeout(function () { if (!mexeu) try { m0.fitBounds(ZONA, {padding: 40, duration: 0}); } catch (x) {} }, 50);
    });
    [1500, 3500, 6500, 10000].forEach(function (ms) {
      setTimeout(function () {
        if (mexeu) return;
        var v = viz(), a = act(), falta = false;
        activos().forEach(function (m) { (m.liga || []).forEach(function (i) { if (existe(i) && a.indexOf(i) < 0) { falta = true; try { v.ligar(i, true); } catch (e) {} } }); });
        if (ZONA && m0 && m0.getZoom && m0.getZoom() < 7.5) try { m0.fitBounds(ZONA, {padding: 40, duration: 0}); } catch (e) {}
        if (falta) painel();
      }, ms);
    });
    // A árvore de camadas redesenha-se (pesquisa, grupos, línguas): voltar a marcar o que é da entidade.
    var esq = D.getElementById("ipe-esq"), tm = 0;
    if (esq && W.MutationObserver) new MutationObserver(function (ms) {
      var deles = ms.some(function (m) { var n = m.target; return !(n && n.closest && n.closest("#ipr-ent-esq")); });
      if (!deles) return;
      clearTimeout(tm); tm = setTimeout(marcarEsq, 120);
    }).observe(esq, {childList: true, subtree: true});
    var mp = W.__ipe.mapa; if (mp && mp.on) mp.on("idle", function () { if (D.getElementById("ipr-ent-dir")) { var x = D.activeElement; if (!x || !x.closest || !x.closest("#ipr-ent-dir")) painel(); } });
    if (!S.feito && PODE && !ENT.admin) wiz(true);
  });
})();
