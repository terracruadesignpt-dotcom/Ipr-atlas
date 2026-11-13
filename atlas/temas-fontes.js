/* IPR Atlas · Temas mais completos e fonte em todas as camadas (Nuno, 13/11/2026, 15h56: «os outros temas, elabora-os
   também um bocadinho. Em todos os temas deve sempre mostrar a origem dos dados, naquele i, e sempre com os estilos do
   Bolito»). Só acrescenta; não edita os ficheiros dos temas de outras sessões. Terracrua Design.
   1. Fonte completa nas camadas do catálogo que não a tinham (as da OGC API da DGT: SRUP, CRUS, COS, SGIFR).
   2. Cada tema ganha camadas em «Mais camadas deste tema» (só ids que existem no catálogo) e um texto «O que está a ver»
      mais completo: para que serve, como se lê, o que está ligado e o que há nas ilhas.
   3. Por baixo do texto, a linha «Fontes deste tema», feita das camadas ligadas.
   4. Botão «i» (o mesmo do camadas-info, com os mesmos estilos) em cada camada do cartão do tema, ligadas e «mais camadas».
   O tema Biológico tem texto próprio no aptidao-bio.js. Desligar: ?temasmais=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]temasmais=0(&|$)/.test(location.search) || W.__iprTemasMais) return;
  W.__iprTemasMais = 1;
  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(D.documentElement.lang || "pt"); }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]; }); }

  var DGT = "DGT · OGC API (ogcapi.dgterritorio.gov.pt), dados abertos CC BY 4.0";
  var FONTES = {
    crus: "DGT · SNIT, PDM em vigor: qualificação do solo (CRUS), CC BY 4.0 · indicativo: faz fé a planta publicada em DR",
    albuf: DGT + " · SRUP, albufeiras de águas públicas classificadas",
    arv: DGT + " · SRUP, árvores e arvoredo de interesse público (ICNF)",
    marcos: DGT + " · SRUP, marcos da rede geodésica",
    aero: DGT + " · SRUP, servidões aeronáuticas (ANAC)",
    defesa: DGT + " · SRUP, servidões de defesa nacional",
    eletr: DGT + " · SRUP, rede eléctrica (REN e E-Redes)",
    perig_s: DGT + " · SRUP, perigosidade de incêndio rural dos PMDFCI",
    cos23: "DGT · Carta de Uso e Ocupação do Solo 2023 (COS2023 v1), CC BY 4.0",
    cos18: "DGT · Carta de Uso e Ocupação do Solo 2018 (COS2018 v4), CC BY 4.0",
    sgifr_a: DGT + " · SGIFR, faixas e mosaicos de gestão de combustível (AGIF e ICNF)",
    sgifr_l: DGT + " · SGIFR, rede de gestão de combustível, linhas (AGIF e ICNF)",
    aquif_s: DGT + " · SRUP, perímetros de protecção de captações de água subterrânea (APA)"
  };
  function catalogo() { try { return W.IPRViz && W.IPRViz.catalogo || []; } catch (e) { return []; } }
  function cat() { var m = {}; catalogo().forEach(function (e) { m[e.id] = e; }); return m; }
  function preencherFontes() {
    var C = cat(), n = 0; Object.keys(FONTES).forEach(function (id) { if (C[id] && !C[id].fonte) { C[id].fonte = FONTES[id]; n++; } });
    // Qualquer outra camada sem fonte fica pelo menos com a entidade do serviço.
    catalogo().forEach(function (e) { if (e.fonte) return; if (e.t === "mvt" || e.col) e.fonte = DGT; else if (/apambiente/.test(e.url || "")) e.fonte = "APA · SNIAmb, CC BY 4.0"; else if (/icnf/.test(e.url || "")) e.fonte = "ICNF · dados abertos, CC BY 4.0"; else if (/dgterritorio/.test(e.url || "")) e.fonte = "DGT, CC BY 4.0"; });
    return Object.keys(C).length > 0;
  }

  var MAIS = {
    terreno: ["cos23", "r_hipso", "l_declives", "bupi", "caop", "scs"],
    cond: ["pgri_perigo", "inund100", "albzr", "zprot", "viaria", "ferro", "pdm_0202"],
    relevo: ["r_hipso", "l_exposicao", "l_twi", "l_geomorphons", "l_festos", "precip"],
    solo: ["carbono", "erosiv", "aridez", "l_erosao", "nitratos", "cos18"],
    fogo: ["fogo_ult", "sev25", "loc_crit", "freg_dfci", "fogo_ret", "perig_s"],
    campo: ["bupi", "hidro", "l_declives", "r_cotas", "icnfpa"],
    ecologia: ["ramsar", "biosfera", "zec_so", "zpe_so", "n_gbif_plantas", "hidro", "arv"]
  };
  var ILHAS = {pt: " Nos Açores e na Madeira, as camadas regionais aparecem no grupo «Açores e Madeira» quando o mapa está sobre as ilhas.", en: " In the Azores and Madeira, regional layers appear in the «Azores and Madeira» group when the map is over the islands."};
  var TXT = {
    terreno: {
      pt: "O ponto de partida para conhecer um terreno: relevo sombreado e curvas de nível do LiDAR da DGT, cadastro predial, linhas de água, caminhos e topónimos. Leia primeiro a forma do relevo (encostas, vales, cumeadas), depois por onde corre a água e por fim os limites e os acessos. Em «Mais camadas» estão a ocupação do solo (COS 2023), a altitude por cores, os declives, os prédios do BUPi, os limites administrativos e os solos por grupo hidrológico.",
      en: "The starting point to get to know a piece of land: hillshade and contours from the DGT LiDAR, land registry, watercourses, tracks and place names. Read the shape of the relief first (slopes, valleys, ridges), then where the water runs and finally the boundaries and access. «More layers» has land cover (COS 2023), colour elevation, slopes, BUPi plots, administrative limits and soils by hydrological group."
    },
    cond: {
      pt: "O que a lei e os planos dizem sobre o sítio: qualificação do solo do PDM, REN, RAN, Rede Natura 2000, domínio público hídrico, perigosidade de incêndio e linhas de água com bacia maior que 350 ha. Serve para saber, antes de desenhar, onde se pode construir, plantar, abrir caminhos ou captar água, e com que regras. Em «Mais camadas» estão as áreas protegidas, as servidões (albufeiras, captações, rede eléctrica, estradas, ferrovia, defesa, aeronáutica), as zonas inundáveis e as áreas de risco. É leitura indicativa: faz fé a planta publicada em Diário da República.",
      en: "What the law and plans say about the site: municipal plan land qualification, REN, RAN, Natura 2000, public water domain, fire hazard and watercourses with catchments over 350 ha. Use it before designing to know where you may build, plant, open tracks or abstract water, and under which rules. «More layers» has protected areas, easements (reservoirs, abstractions, power lines, roads, railways, defence, aviation), flood zones and risk areas. Indicative only: the plan published in the official gazette prevails."
    },
    relevo: {
      pt: "O relevo e a água em três dimensões: relevo sombreado, curvas de nível, rede hidrográfica, bacias e troços de bacia. Incline o mapa para ver por onde a água se junta e onde abranda: vales, linhas de festo, encostas viradas a sul e a norte, sítios para charcas e para infiltrar. Em «Mais camadas» estão a acumulação de fluxo, as linhas de escoamento do LiDAR, os declives, a exposição, o índice de humidade (TWI), as formas do relevo, as linhas de festo e a precipitação anual.",
      en: "Relief and water in three dimensions: hillshade, contours, river network, catchments and sub-catchments. Tilt the map to see where water gathers and slows down: valleys, ridgelines, south- and north-facing slopes, places for ponds and infiltration. «More layers» has flow accumulation, LiDAR drainage lines, slopes, aspect, wetness index (TWI), landforms, ridgelines and annual rainfall."
    },
    solo: {
      pt: "O solo e o que cresce nele: ocupação do solo (COS 2023), solos por grupo hidrológico, capacidade de uso do solo (SROA) e densidade de copa. Serve para ler a vocação de cada parcela, a fertilidade e onde a cobertura vegetal está mais fechada ou mais aberta. Em «Mais camadas» estão o carbono orgânico, a erosividade da chuva, a aridez, o risco de erosão do LiDAR, as zonas vulneráveis a nitratos, a COS 2018 para comparar, a desertificação, a geologia, as invasoras e a carta de solos.",
      en: "Soil and what grows on it: land cover (COS 2023), soils by hydrological group, land capability (SROA) and tree cover density. Use it to read what each plot is suited for, its fertility and where vegetation is denser or more open. «More layers» has soil organic carbon, rainfall erosivity, aridity, LiDAR erosion risk, nitrate vulnerable zones, COS 2018 for comparison, desertification, geology, invasive species and the soil map."
    },
    fogo: {
      pt: "O fogo no território: perigosidade de incêndio rural, áreas ardidas de 2015 a 2025, rede primária de faixas de gestão de combustível e zonas de intervenção florestal. Serve para perceber por onde o fogo já passou, de onde costuma vir e onde a paisagem pode ser desenhada para o travar: mosaicos, faixas, pontos de água, sebes húmidas. Em «Mais camadas» estão os últimos incêndios, a severidade de 2025, os aglomerados críticos, as freguesias prioritárias, o tempo de retorno do fogo e a perigosidade dos planos municipais. O simulador de fogo está nas ferramentas.",
      en: "Fire in the territory: rural fire hazard, burnt areas 2015 to 2025, primary fuel break network and forest intervention zones. Use it to see where fire has passed, where it tends to come from and where the landscape can be designed to stop it: mosaics, fuel breaks, water points, moist hedges. «More layers» has the latest fires, 2025 severity, critical settlements, priority parishes, fire return time and municipal hazard maps. The fire simulator is in the tools."
    },
    campo: {
      pt: "Para levar para o terreno: cadastro, curvas de nível, caminhos, pontos de água, pontos de água de combate a incêndios, vedações e topónimos, sobre a imagem mais recente. Com o GPS do telemóvel vê onde está, marca pontos e mede distâncias; o QField leva o projecto para trabalhar sem rede. Em «Mais camadas» estão os prédios do BUPi, a rede hidrográfica, os declives e os pontos cotados.",
      en: "To take to the field: land registry, contours, tracks, water points, firefighting water points, fences and place names, over the most recent imagery. With the phone GPS you see where you are, mark points and measure distances; QField takes the project offline. «More layers» has BUPi plots, the river network, slopes and spot heights."
    },
    ecologia: {
      pt: "A vida do lugar: habitats, Rede Natura 2000, áreas protegidas, densidade de copa, pequenos elementos lenhosos (sebes e árvores isoladas) e registos de espécies do GBIF. Serve para ver o que já existe e merece ser cuidado, por onde passam os corredores ecológicos e onde vale a pena ligar manchas. Em «Mais camadas» estão os sítios Ramsar, as reservas da biosfera, as zonas especiais de conservação e de protecção de aves, os registos de plantas, a rede hidrográfica, as árvores de interesse público e as invasoras.",
      en: "The life of the place: habitats, Natura 2000, protected areas, tree cover density, small woody features (hedges and lone trees) and GBIF species records. Use it to see what already exists and deserves care, where ecological corridors run and where patches are worth connecting. «More layers» has Ramsar sites, biosphere reserves, special conservation and bird protection areas, plant records, the river network, heritage trees and invasive species."
    }
  };
  function temaDef(id) { try { return (W.__iprTemas.defs() || []).filter(function (t) { return t && t.id === id; })[0]; } catch (e) { return null; } }
  function juntarMais() {
    var T = W.__iprTemas; if (!T || typeof T.defs !== "function") return false;
    var C = cat(); if (!Object.keys(C).length) return false;
    Object.keys(MAIS).forEach(function (id) {
      var t = temaDef(id); if (!t || t.__mais) return; t.__mais = 1;
      if (!t.extra) t.extra = [];
      MAIS[id].forEach(function (c) { if (C[c] && t.c.indexOf(c) < 0 && t.extra.indexOf(c) < 0) t.extra.push(c); });
    });
    return true;
  }
  function entidade(f) {
    var s = String(f || ""); var m = /^([^·,(]+)/.exec(s); var e = m ? m[1].trim() : s;
    if (/OGC API|dgterritorio|^DGT/i.test(s)) e = "DGT";
    return e;
  }
  function ativo(w) { var b = w.querySelector("[data-t62][aria-pressed=\"true\"]"); return b ? b.getAttribute("data-t62") : null; }
  function cartao(w) {
    var id = ativo(w); if (!id) return;
    var ver = w.querySelector(".ipr-t62-c:not(.ipr-ag-c) .ipr-t62-ver") || w.querySelector(".ipr-t62-ver"); if (!ver) return;
    var E = en();
    if (TXT[id]) {
      var p = ver.querySelector("p:not(.ipr-tf)"), txt = TXT[id][E ? "en" : "pt"] + ILHAS[E ? "en" : "pt"];
      if (p && p.textContent !== txt) p.textContent = txt;
    }
    // Fontes deste tema (das camadas do tema)
    var t = temaDef(id), C = cat();
    if (t) {
      var ents = []; (t.c || []).forEach(function (c) { var e = C[c]; if (!e) return; var n = entidade(e.fonte); if (n && ents.indexOf(n) < 0) ents.push(n); });
      if (id === "bio") ["APA", "ICNF", "DGADR", "INE"].forEach(function (n) { if (ents.indexOf(n) < 0) ents.push(n); });
      var linha = (E ? "Sources in this theme: " : "Fontes deste tema: ") + ents.join(", ") + (E ? ". Tap the i next to each layer for the full source, licence and legend." : ". Carregue no i de cada camada para ver a fonte completa, a licença e a legenda.");
      var f = ver.querySelector("p.ipr-tf");
      if (!f) { f = D.createElement("p"); f.className = "ipr-tf"; ver.appendChild(f); }
      if (f.textContent !== linha) f.textContent = linha;
    }
    // «i» em cada camada do cartão (o mesmo botão e estilos do camadas-info)
    [].forEach.call(w.querySelectorAll("input[data-c62]"), function (inp) {
      var cid = inp.getAttribute("data-c62"), lb = inp.closest("label"); if (!lb || !C[cid] || lb.querySelector(".ipr-ii-b")) return;
      var b = D.createElement("button"); b.type = "button"; b.className = "ipr-ii-b"; b.textContent = "i"; b.dataset.ii = cid;
      b.title = E ? "About this layer: what it is, source, legend" : "Sobre esta camada: o que é, fonte, legenda"; b.setAttribute("aria-label", b.title);
      lb.appendChild(b);
    });
  }
  var CSS = "#ipr-t62 p.ipr-tf{margin:6px 0 0;font-size:11.5px;line-height:1.45;color:var(--mu,#9a9b90)}" +
    // Todos os «i» alinhados à direita: a linha passa a flex, o nome ocupa o espaço que sobra.
    "#ipr-t62 label:has(> .ipr-ii-b){display:flex!important;align-items:center;gap:6px}#ipr-t62 label:has(> .ipr-ii-b)>span{flex:1 1 auto;min-width:0}#ipr-t62 label>.ipr-ii-b{margin-left:auto!important;flex:none}";
  (function arrancar(n) {
    var ok = preencherFontes() && juntarMais();
    var w = D.getElementById("ipr-t62");
    if (!ok || !w || !W.MutationObserver) { if (n < 120) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var tm = 0;
    new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(function () { try { cartao(w); } catch (e) {} }, 80); }).observe(w, {subtree: true, childList: true, attributes: true, attributeFilter: ["aria-pressed"]});
    try { cartao(w); } catch (e) {}
  })(0);
})();
