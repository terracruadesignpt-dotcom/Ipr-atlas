/* IPR Atlas · Camadas em falta da especificação de 17/11/2026, secção 6 (DGT, APA, LNEG, Copernicus) e grupo «Ambiente e
   actividades» no painel (Nuno, 17/11, 23h41: «devia aparecer no painel, certo?»; 23h42: «avança com tudo o que falta»).
   Terracrua Design. Só acrescenta ao catálogo por IPRViz.juntar; não mexe no viz.js nem no app.js.
   Causa do grupo em falta: o agua.js junta o grupo «amb» a IPRViz.grupos depois de o painel ser montado (o painel só mostra os
   grupos que existem nesse momento). Aqui junta-se o mesmo grupo, com o mesmo id, nome e posição (antes de «ref»), mais cedo.
   Se o agua.js chegar primeiro, nada muda (verifica se já existe).
   Fontes lidas a 17/11/2026:
   · DGT, GeoServer geo2.dgterritorio.gov.pt: áreas edificadas 2018, interfaces de áreas edificadas (estrutural 2018 e
     conjuntural 2025), carta de perdas de vegetação, verdura da vegetação (MIAEV). O Mapa de Construções LiDAR 2024 não tem
     serviço público: está no motor do IPR (edificado) e aparece pelo m92429/m92456 quando o motor responder.
     MACAT: sem serviço WMS/OGC API público encontrado.
   · APA, SNIAmb: PRTR (serviço «Licenciamento»), instalações CELE, qualidade do ar (estações e zonas), estações meteorológicas.
   · LNEG: TECNIBASE (sondagens e dados técnicos).
   · EEA / Copernicus Land Monitoring Service: Corine Land Cover 2018, CLC+ 2018, EU-Hydro (rede e bacias), zonas ripícolas 2018.
   Licenças: Copernicus, dados abertos com atribuição; DGT e APA a confirmar na ficha antes de publicar em lote.
   Desligar: ?camspec=0. */
(function () {
  "use strict";
  var W = window;
  if (/[?&]camspec=0(&|$)/.test(location.search) || W.__iprCamSpec1117) return; W.__iprCamSpec1117 = 1;
  var DGT = "https://geo2.dgterritorio.gov.pt/geoserver/wms";
  var APA = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/";
  var EEA = "https://image.discomap.eea.europa.eu/arcgis/rest/services/";
  var LNEG = "https://sig.lneg.pt/server/rest/services/";
  var fD = "DGT · Direção-Geral do Território (GeoServer)", fA = "APA · SNIAmb", fE = "EEA · Copernicus Land Monitoring Service, dados abertos com atribuição", fL = "LNEG · geoPortal da Energia e Geologia";
  // [id, grupo, sub pt, sub en, nome pt, nome en, tipo, url, camada(s), cor, opacidade, zoom mínimo, fonte, licença, nota]
  var C = [
    ["dgt_ae18", "solo", "Ocupação", "Land cover", "Áreas edificadas 2018", "Built-up areas 2018", "wms", DGT, "AE:AreasEdificadas2018", "#e57373", .6, 9, fD, "a", "Estrutural; não substitui o inventário de construções"],
    ["dgt_int_e18", "fogo", "Interfaces (DGT)", "Interfaces (DGT)", "Interface de áreas edificadas, estrutural 2018", "Built-up interface, structural 2018", "wms", DGT, "AE:Interface_E2018", "#ff8a65", .6, 9, fD, "a", ""],
    ["dgt_int_c25", "fogo", "Interfaces (DGT)", "Interfaces (DGT)", "Interface de áreas edificadas, conjuntural 2025", "Built-up interface, short-term 2025", "wms", DGT, "AE:Interface_C2025", "#ff7043", .6, 9, fD, "a", ""],
    ["dgt_cpv2425", "solo", "Floresta", "Forest", "Perdas de vegetação, Out. 2024 a Set. 2025", "Vegetation loss, Oct 2024 to Sep 2025", "wms", DGT, "DRFloresta:CPV_202410_202509", "#c62828", .8, 8, fD, "a", "Dinâmicas florestais (DGT, Sentinel-2)"],
    ["dgt_cpv2324", "solo", "Floresta", "Forest", "Perdas de vegetação, Out. 2023 a Set. 2024", "Vegetation loss, Oct 2023 to Sep 2024", "wms", DGT, "DRFloresta:CPV_202310_202409", "#e53935", .8, 8, fD, "a", "Dinâmicas florestais (DGT, Sentinel-2)"],
    ["dgt_miaev", "solo", "Vegetação", "Vegetation", "Verdura da vegetação (MIAEV, mensal)", "Vegetation greenness (MIAEV, monthly)", "wms", DGT, "MIAEV:miaev-vv", "#7cb342", .7, 7, fD, "a", "Vigor vegetativo a partir de Sentinel-2"],
    ["apa_prtr", "amb", "Emissões e licenciamento", "Emissions and permits", "Registo de emissões e transferência de poluentes (PRTR)", "Pollutant release and transfer register (PRTR)", "ags", APA + "Licenciamento/MapServer", "show:0", "#6d4c41", 1, 0, fA, "a", ""],
    ["apa_cele", "amb", "Emissões e licenciamento", "Emissions and permits", "Instalações abrangidas pelo CELE", "Installations under the EU ETS", "ags", APA + "CELE/MapServer", "show:0", "#8d6e63", 1, 0, fA, "a", ""],
    ["apa_ar", "amb", "Ar", "Air", "Qualidade do ar: estações, zonas e aglomerações", "Air quality: stations, zones and agglomerations", "ags", APA + "Qualidade_do_Ar/MapServer", "show:0,1", "#90a4ae", .6, 0, fA, "a", ""],
    ["apa_meteo", "agua", "Estações", "Stations", "Estações meteorológicas (SNIRH)", "Weather stations (SNIRH)", "ags", APA + "Estacoes_meteorologicas/MapServer", "show:0", "#5c6bc0", 1, 0, fA, "a", "Séries no SNIRH"],
    ["lneg_tecnibase", "solo", "Recursos minerais (LNEG)", "Mineral resources (LNEG)", "TECNIBASE · sondagens e dados técnicos", "TECNIBASE · boreholes and technical data", "ags", LNEG + "Tecnibase/MapServer", null, "#795548", 1, 8, fL, "a", ""],
    ["eu_clc18", "solo", "Ocupação (Europa)", "Land cover (Europe)", "Corine Land Cover 2018", "Corine Land Cover 2018", "ags", EEA + "Corine/CLC2018_WM/MapServer", null, "#9e9d24", .55, 0, fE, "v", "Escala europeia (25 ha); para Portugal usar a COS"],
    ["eu_clcplus", "solo", "Ocupação (Europa)", "Land cover (Europe)", "CLC+ Backbone 2018 (10 m)", "CLC+ Backbone 2018 (10 m)", "ags", EEA + "CLC_plus/CLCplus2018_WM/MapServer", null, "#827717", .55, 0, fE, "v", ""],
    ["eu_hydro", "agua", "Superficial", "Surface water", "EU-Hydro · rede hidrográfica europeia", "EU-Hydro · river network", "ags", EEA + "EUHydro/EUHydro_RiverNetworkDatabase/MapServer", null, "#1976d2", .9, 0, fE, "v", "Leitura ibérica e transfronteiriça"],
    ["eu_bacias", "agua", "Superficial", "Surface water", "EU-Hydro · bacias hidrográficas", "EU-Hydro · river basins", "ags", EEA + "EUHydro/RiverBasine/MapServer", null, "#0d47a1", .4, 0, fE, "v", ""],
    ["eu_ripicolas", "agua", "Superficial", "Surface water", "Zonas ripícolas 2018 (Copernicus)", "Riparian zones 2018 (Copernicus)", "ags", EEA + "RiparianZones/RZ_2018/MapServer", null, "#26a69a", .6, 9, fE, "v", "Galerias ripícolas e ocupação junto às linhas de água"]
  ];
  function grupo() {
    var V = W.IPRViz; if (!V || !V.grupos) return;
    if (V.grupos.some(function (g) { return g.id === "amb"; })) return;
    var i = -1; V.grupos.forEach(function (g, k) { if (g.id === "ref") i = k; });
    var G = { id: "amb", nome: "Ambiente e actividades", en: "Environment and activities" };
    if (i >= 0) V.grupos.splice(i, 0, G); else V.grupos.push(G);
  }
  function registar() {
    var V = W.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    grupo();
    var ja = {}; V.catalogo.forEach(function (e) { if (e && e.id) ja[e.id] = 1; });
    // AIA e Seveso: mesmos ids e campos do agua.js (que as junta tarde demais para o painel). Só fora do Explorer, como lá.
    if (W.IPR_NIVEL !== "explorer") {
      var RA = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/";
      [["aia", "AIA", "EIA", "Projectos sujeitos a avaliação de impacte ambiental", "Projects subject to environmental impact assessment", "AIA/AIA_externo", "41", "#6d4c41", .5],
       ["seveso", "Riscos industriais", "Industrial hazards", "Estabelecimentos Seveso (DL 150/2015)", "Seveso establishments (Decree-Law 150/2015)", "SNIAmb/Prevencao_Acidentes_Graves", "0", "#d50000", 1]
      ].forEach(function (a) {
        if (ja[a[0]]) return;
        V.juntar({ id: a[0], g: "amb", sub: a[1], subEn: a[2], n: a[3], en: a[4], t: "ags", url: RA + a[5] + "/MapServer", layers: "show:" + a[6], lic: "a",
          op: a[8], cor: a[7], fonte: "APA · SNIAmb (" + a[5].split("/").pop() + ")", nota: "Intelligence", agua: 1, niv: "i" });
        ja[a[0]] = 1;
      });
    }
    C.forEach(function (d) {
      if (ja[d[0]]) return;
      var e = { id: d[0], g: d[1], sub: d[2], subEn: d[3], n: d[4], en: d[5], t: d[6], url: d[7], lic: d[13], op: d[10], cor: d[9], fonte: d[12] };
      if (d[6] === "wms") { e.layer = d[8]; e.fmt = "image/png"; } else if (d[8]) { e.layers = d[8]; }
      if (d[11]) e.minz = d[11];
      if (d[14]) e.nota = d[14];
      e._sub = d[2];
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 60) setTimeout(function () { vez(n + 1); }, 100); })(0);

  // 18/11/2026 (Miguel: «como se tira isto», chuva da NASA por cima da Europa). As camadas da secção «Mundo»
  // (mundo-camadas.js) ficam guardadas no browser e voltam a cada visita, mas a secção vem fechada e não conta para o
  // «Desligar» do painel. Aqui: com alguma ligada, a secção abre-se e o título mostra quantas e um «Desligar»;
  // o «Desligar» do painel também as desliga. Desliga-as pelo próprio interruptor (evento change), sem mexer no mundo-camadas.js.
  var D = document;
  function caixas() { return D.querySelectorAll("input[data-tao]"); }
  function secMundo() {
    var c = caixas()[0]; if (!c) return null;
    var p = c.parentElement; while (p && !p.querySelector(":scope > h4")) p = p.parentElement;
    return p;
  }
  function desligarMundo() {
    [].forEach.call(caixas(), function (c) { if (c.checked) { c.checked = false; c.dispatchEvent(new Event("change", { bubbles: true })); } });
    setTimeout(mundo, 0);
  }
  function mundo() {
    var sec = secMundo(); if (!sec) return false;
    var h = sec.querySelector(":scope > h4"), on = [].filter.call(caixas(), function (c) { return c.checked; }).length;
    var tag = h.querySelector(".ipr-mu-n");
    if (on) {
      if (!tag) { tag = D.createElement("span"); tag.className = "ipr-mu-n"; h.appendChild(tag); }
      tag.innerHTML = " · " + on + (on > 1 ? " ligadas " : " ligada ") + '<button type="button" class="ipr-mu-off">Desligar</button>';
      // ligado no próprio botão: há um ouvinte na janela que trava os cliques do painel antes de chegarem ao documento
      tag.querySelector("button").addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); desligarMundo(); });
      sec.classList.add("aberto");
    } else if (tag) { tag.remove(); }
    return true;
  }
  if (!D.getElementById("ipr-mu-css")) {
    var cs = D.createElement("style"); cs.id = "ipr-mu-css";
    cs.textContent = ".ipr-mu-n{font-weight:400;opacity:.9}.ipr-mu-off{font:inherit;font-size:11px;margin-left:6px;padding:1px 7px;border-radius:5px;border:1px solid rgba(255,255,255,.35);background:transparent;color:inherit;cursor:pointer}.ipr-mu-off:hover{border-color:#94be39}";
    D.head.appendChild(cs);
  }
  D.addEventListener("click", function (e) {
    if (e.target.closest(".ipr-mu-off")) { e.preventDefault(); e.stopPropagation(); desligarMundo(); return; }
    if (e.target.closest(".ipr-off")) desligarMundo();
  }, true);
  D.addEventListener("change", function (e) { if (e.target.matches && e.target.matches("input[data-tao]")) setTimeout(mundo, 0); }, true);
  // a secção «Mundo» é redesenhada depois de montada; rever de 1,5 em 1,5 s (só lê o estado das caixas, sem observador de DOM)
  setInterval(function () { var s = secMundo(); if (s) { var on = [].some.call(caixas(), function (c) { return c.checked; }); var h = s.querySelector(":scope > h4"); if (on !== !!(h && h.querySelector(".ipr-mu-n"))) mundo(); } }, 1500);
  mundo();
})();
