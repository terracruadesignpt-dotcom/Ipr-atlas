/* IPR Atlas · Habitats do Anexo I em manchas diferentes (Nuno, 28/10/2026: «os habitats era importante termos tudo em
   manchas diferentes»; escolheu fase 1, fase 2, carta ao ICNF e juntar o PSRN2000 e as quadrículas de 10 km).
   Fase 1 (este ficheiro): só catálogo. Usa os serviços ArcGIS REST do ICNF (pasta BDG, dados abertos com citação) com
   «dynamicLayers» no pedido «export»: cada entrada leva os seus filtros (definitionExpression) e as suas cores, e o viz.js
   já passa a chave «dyn» tal qual (como no «icnfpa»). Não mexe no viz.js nem no app.js; junta camadas por IPRViz.juntar e
   fichas por window.IPR_FICHAS, como o agua.js.
   Fontes lidas a 28/10/2026 (auditoria research_notes/apa_icnf_auditoria_2026-10-28.md, secção 3):
   · BDG/habitats_zec, camada 1: 38 754 polígonos em 59 ZEC terrestres, 1:5 000, até três habitats por polígono
     (h1_cod, h2_cod, h3_cod, com subtipos «pt» e maiúsculas inconsistentes, por isso os filtros usam UPPER e LIKE).
   · BDG/PSRN2000_habitats, camada 1: Plano Sectorial da Rede Natura 2000, 1:100 000, um código por polígono (cod_hab_n3).
   · BDG/rel_art17_habitats, camada 0: relatório do art. 17.º da Directiva Habitats (2013–2018), quadrícula de 10 km,
     com o estado de conservação global (a_global: FV, U1, U2, XX).
   Licença «a» (âmbar) até o ICNF confirmar por escrito a exibição num serviço pago.
   3/11/2026, resposta do ICNF (Lia Godinho, DAGAC; decisão do Nuno, caixas das 12h30): podemos usar e mostrar os dados com
   a referência à propriedade do ICNF, mas não consumir directamente os serviços do Geocatálogo; e o PSRN2000 está obsoleto
   fora das ZEC Arquipélago da Berlenga e Alvito/Cuba. Por isso a camada hab_psrn passa a ser uma cópia nossa, só da
   Berlenga (dados/psrn2000_habitats_PTCON0006.geojson, 10 polígonos, descarregada a 3/11/2026; Alvito/Cuba não tem
   polígonos no PSRN2000). As restantes camadas passam a cópias nossas na migração das camadas do ICNF. */
(function () {
  "use strict";
  if (window.__iprHabitats) return;
  window.__iprHabitats = 1;
  var EXPL = window.IPR_NIVEL === "explorer";
  var B = "https://sigservices.icnf.pt/server/rest/services/BDG/";
  var ZEC = B + "habitats_zec/MapServer", PSRN = B + "PSRN2000_habitats/MapServer", A17 = B + "rel_art17_habitats/MapServer";
  var DATA = "28/10/2026";
  function lg() { var l = String(window.IPR_LINGUA || "pt").toLowerCase(); return l.indexOf("pt") === 0 ? "pt" : "en"; }

  function rgba(h, a) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16), a]; }
  function camada(id, layer, where, cor, a, contorno) {
    return { id: id, source: { type: "mapLayer", mapLayerId: layer }, definitionExpression: where, minScale: 0, maxScale: 0,
      drawingInfo: { renderer: { type: "simple", symbol: { type: "esriSFS", style: "esriSFSSolid", color: rgba(cor, a),
        outline: { type: "esriSLS", style: "esriSLSSolid", color: rgba(contorno || cor, 230), width: 0.6 } } } } };
  }
  function em3(cod) { var c = String(cod).toUpperCase(); return "UPPER(h1_cod) LIKE '" + c + "%' OR UPPER(h2_cod) LIKE '" + c + "%' OR UPPER(h3_cod) LIKE '" + c + "%'"; }

  // Grupos do Anexo I (primeiro algarismo do código), cores da auditoria (secção 3.3).
  var GR = [
    ["1", "#4f8fa6", "Costeiros e halófitos", "Coastal and halophytic"],
    ["2", "#e3c770", "Dunas", "Dunes"],
    ["3", "#2b7bb9", "Águas doces", "Freshwater"],
    ["4", "#a05a8c", "Charnecas e urzais", "Heaths"],
    ["5", "#c08a3e", "Matos esclerófilos", "Sclerophyllous scrub"],
    ["6", "#9cc35a", "Prados, arrelvados e montados", "Grasslands and dehesas"],
    ["7", "#5c7a3a", "Turfeiras e nascentes", "Bogs, mires and springs"],
    ["8", "#9e9e9e", "Rochosos e grutas", "Rocky habitats and caves"],
    ["9", "#2e7d32", "Florestas", "Forests"]
  ];
  // Habitats com camada própria: os que mais contam no planeamento do interior (Alentejo, Algarve, Beira, Trás-os-Montes).
  // [código, cor, nome pt, nome en, prioritário]
  var HB = [
    ["6310", "#c7b65a", "Montados de sobro e azinho", "Cork and holm oak dehesas (montados)", 0],
    ["9330", "#4e7d3a", "Sobreirais", "Cork oak woodland", 0],
    ["9340", "#6b8e23", "Azinhais", "Holm oak woodland", 0],
    ["9230", "#3d6b1f", "Carvalhais de carvalho-negral", "Pyrenean oak woodland", 0],
    ["92A0", "#1b6e5a", "Galerias de salgueiros e choupos", "Willow and poplar riparian galleries", 0],
    ["92D0", "#3f8f6b", "Galerias termomediterrânicas (loendrais, tamargais)", "Southern riparian thickets (oleander, tamarisk)", 0],
    ["91E0", "#2f6b4f", "Amiais e freixiais ribeirinhos", "Alluvial alder and ash forests", 1],
    ["5330", "#c99a52", "Matos termomediterrânicos", "Thermo-Mediterranean scrub", 0],
    ["4030", "#b07aa1", "Urzais secos", "Dry heaths", 0],
    ["6220", "#d6e27a", "Arrelvados anuais (subestepes)", "Annual grasslands (pseudo-steppe)", 1],
    ["6420", "#7fae4e", "Juncais mediterrânicos húmidos", "Mediterranean tall-herb wet meadows", 0],
    ["3170", "#00a3c4", "Charcos temporários mediterrânicos", "Mediterranean temporary ponds", 1],
    ["3260", "#6baed6", "Cursos de água com vegetação aquática", "Watercourses with floating vegetation", 0],
    ["2130", "#d8b24a", "Dunas cinzentas", "Grey dunes", 1],
    ["1150", "#3a7d94", "Lagunas costeiras", "Coastal lagoons", 1],
    ["1310", "#7fb3c4", "Sapais de salicórnias", "Salicornia mudflats", 0]
  ];
  var ESTADO = [["FV", "#2e7d32", "Favorável", "Favourable"], ["U1", "#f9a825", "Desfavorável-inadequado", "Unfavourable-inadequate"],
    ["U2", "#c62828", "Desfavorável-mau", "Unfavourable-bad"], ["XX", "#9e9e9e", "Desconhecido", "Unknown"]];

  var SUB = { zec: ["Habitats (Anexo I) · ZEC", "Habitats (Annex I) · SAC"], nac: ["Habitats · Rede Natura e país", "Habitats · Natura 2000 and country"] };
  var LIST = [];
  function junta(e) { LIST.push(e); }

  // 1. Mapa-mãe: habitat dominante (h1) por grupo, num só pedido.
  junta({ id: "hab_grupos", sub: "zec", n: "Habitats por grupo (dominante)", en: "Habitats by group (dominant)", url: ZEC, layers: "show:1", cor: "#2e7d32", op: .7, niv: "e", fam: "grupos",
    dyn: GR.map(function (g, i) { return camada(101 + i, 1, "h1_cod LIKE '" + g[0] + "%'", g[1], 200, "#ffffff"); }),
    leg: GR.map(function (g) { return [g[1], g[0] + " · " + g[2]]; }), legEn: GR.map(function (g) { return [g[1], g[0] + " · " + g[3]]; }) });
  // 2. Um grupo de cada vez, incluindo onde o habitat é secundário.
  GR.forEach(function (g) {
    junta({ id: "hab_g" + g[0], sub: "zec", n: "Grupo " + g[0] + " · " + g[2], en: "Group " + g[0] + " · " + g[3], url: ZEC, layers: "show:1", cor: g[1], op: .75, niv: "e", fam: "grupo", grupo: g,
      dyn: [camada(201, 1, "h1_cod LIKE '" + g[0] + "%' OR h2_cod LIKE '" + g[0] + "%' OR h3_cod LIKE '" + g[0] + "%'", g[1], 190)] });
  });
  // 3. Habitats com camada própria.
  HB.forEach(function (h) {
    var ast = h[4] ? "*" : "";
    junta({ id: "hab_" + h[0].toLowerCase(), sub: "zec", n: h[0] + ast + " · " + h[2], en: h[0] + ast + " · " + h[3], url: ZEC, layers: "show:1", cor: h[1], op: .8, niv: "i", fam: "hab", hab: h,
      dyn: [camada(301, 1, em3(h[0]), h[1], 200, "#ffffff")] });
  });
  // 4. PSRN2000 (1:100 000), só onde ainda é a referência (Berlenga), a partir da nossa cópia.
  var AQUI = (function () { try { var c = document.currentScript && document.currentScript.src; if (c) return c.replace(/[^\/]*$/, ""); } catch (e) {} return ""; })();
  var PSRN_COPIA = (AQUI || "https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@main/atlas/") + "dados/psrn2000_habitats_PTCON0006.geojson";
  var PSRN_DATA = "3/11/2026";
  function ligarPsrn(c) {
    var M = c.mapa, id = c.id, op = c.op == null ? .6 : c.op;
    return fetch(PSRN_COPIA).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (gj) {
      if (!M.getSource(id)) M.addSource(id, { type: "geojson", data: gj, attribution: c.atrib });
      var cor = ["match", ["get", "cod_hab_n1"]]; GR.forEach(function (g) { cor.push(g[0], g[1]); }); cor.push("#5a8f3a");
      c.camada({ id: id + "-f", type: "fill", source: id, paint: { "fill-color": cor, "fill-opacity": .7 * op } }, "fill");
      c.camada({ id: id + "-l", type: "line", source: id, paint: { "line-color": cor, "line-width": 1, "line-opacity": op } }, "line");
    });
  }
  junta({ id: "hab_psrn", sub: "nac", n: "Habitats do Plano Sectorial Rede Natura (1:100 000) · Berlenga", en: "Natura 2000 Sectoral Plan habitats (1:100,000) · Berlenga", t: "ext", ligar: ligarPsrn, cor: "#5a8f3a", op: .6, niv: "e", fam: "psrn",
    leg: GR.map(function (g) { return [g[1], g[0] + " · " + g[2]]; }), legEn: GR.map(function (g) { return [g[1], g[0] + " · " + g[3]]; }) });
  // 5. Quadrícula de 10 km do art. 17.º, por habitat, com o estado de conservação.
  HB.forEach(function (h) {
    junta({ id: "hab17_" + h[0].toLowerCase(), sub: "nac", n: h[0] + " · " + h[2] + " · país (10 km)", en: h[0] + " · " + h[3] + " · country (10 km)", url: A17, layers: "show:0", cor: h[1], op: .55, niv: "i", fam: "art17", hab: h,
      dyn: ESTADO.map(function (s, i) { return camada(501 + i, 0, "code = '" + h[0] + "' AND a_global = '" + s[0] + "'", s[1], 140); }),
      leg: ESTADO.map(function (s) { return [s[1], s[2]]; }), legEn: ESTADO.map(function (s) { return [s[1], s[3]]; }) });
  });

  function registar() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function") return false;
    var en = lg() === "en";
    LIST.forEach(function (d) {
      if (EXPL && d.niv === "i") return;
      var e = d.t === "ext" ? { id: d.id, g: "nat", sub: SUB[d.sub][0], subEn: SUB[d.sub][1], n: d.n, en: d.en, t: "ext", ligar: d.ligar, lic: "v", op: d.op, cor: d.cor, fonte: "ICNF (cópia de " + PSRN_DATA + ")", nota: "", niv: d.niv, minz: 6 }
        : { id: d.id, g: "nat", sub: SUB[d.sub][0], subEn: SUB[d.sub][1], n: d.n, en: d.en, t: "ags", url: d.url, layers: d.layers,
        dyn: JSON.stringify(d.dyn), lic: "a", op: d.op, cor: d.cor, fonte: "ICNF", nota: d.niv === "i" ? "Intelligence" : "", niv: d.niv, minz: 6 };
      if (d.leg) e.leg = en && d.legEn ? d.legEn : d.leg;
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 40) setTimeout(function () { vez(n + 1); }, 50); })(0);

  // Fichas de camada (formato do §28). Textos escritos em português e em inglês.
  var CIT = { pt: "ICNF, {c}, {u}, consultado em " + DATA + ". Dados abertos com citação; exibição num serviço pago por confirmar com o ICNF (âmbar).",
    en: "ICNF, {c}, {u}, accessed " + DATA + ". Open data with attribution; use in a paid service to be confirmed with ICNF (amber)." };
  var ZEC_LIM = { pt: "Só cobre as 59 ZEC terrestres do continente com cartografia nova (faltam, por exemplo, Alvito/Cuba e Berlenga). Fora delas, a falta de mancha não quer dizer falta de habitat. Cada polígono pode ter até três habitats, por ordem decrescente de cobertura. Classes de cobertura (ICNF): A, mais de 75 %; B, 30 a 75 %; C, até 30 %.",
    en: "Only covers the 59 mainland terrestrial SACs with new mapping (Alvito/Cuba and Berlenga, for example, are missing). Outside them, no patch does not mean no habitat. Each polygon can hold up to three habitats, in decreasing order of cover. Cover classes (ICNF): A, over 75%; B, 30 to 75%; C, up to 30%." };
  var FAM = {
    grupos: {
      pt: { s: "Ver de relance que tipo de natureza ocupa cada parte de uma ZEC: florestas, matos, prados e montados, águas doces.", l: "Cada cor é um grupo do Anexo I da Directiva Habitats, pelo habitat dominante do polígono. Clique para ver os três habitats e a cobertura.", d: "Cartografia de habitats naturais e seminaturais em ZEC, 2018 a 2023 (ICNF, ISA, Floradata, Aqualogus, Território XXI).", c: "59 ZEC terrestres do continente.", e: "1:5 000 (alguns 1:10 000).", ex: "Perceber se um terreno dentro de uma ZEC tem montado, galeria ripícola ou charcos temporários antes de planear charcas ou caminhos." },
      en: { s: "See at a glance what kind of nature fills each part of a SAC: forests, scrub, grasslands and dehesas, freshwater.", l: "Each colour is an Annex I group of the Habitats Directive, by the polygon's dominant habitat. Click to see the three habitats and their cover.", d: "Mapping of natural and semi-natural habitats in SACs, 2018 to 2023 (ICNF, ISA, Floradata, Aqualogus, Território XXI).", c: "59 mainland terrestrial SACs.", e: "1:5,000 (some 1:10,000).", ex: "Check whether a plot inside a SAC holds dehesa, riparian gallery or temporary ponds before planning ponds or tracks." } },
    grupo: {
      pt: { s: "Isolar um grupo de habitats, também onde aparece como secundário no polígono.", l: "A mancha inclui o polígono se o grupo estiver em qualquer das três posições (h1, h2 ou h3).", d: "Cartografia de habitats em ZEC, 2018 a 2023.", c: "59 ZEC terrestres do continente.", e: "1:5 000.", ex: "Ligar só as florestas para ver a continuidade dos bosques numa ZEC." },
      en: { s: "Isolate one habitat group, including where it is secondary in the polygon.", l: "A polygon is shown if the group appears in any of its three positions (h1, h2 or h3).", d: "Habitat mapping in SACs, 2018 to 2023.", c: "59 mainland terrestrial SACs.", e: "1:5,000.", ex: "Turn on forests only to see how continuous the woodland is across a SAC." } },
    hab: {
      pt: { s: "Saber onde está um habitat concreto, com o pormenor que conta para o projecto: limites de intervenção, faixas, charcas, pastoreio.", l: "Mancha com contorno branco: polígonos onde o habitat aparece em qualquer posição. O asterisco marca os prioritários da Directiva.", d: "Cartografia de habitats em ZEC, 2018 a 2023.", c: "59 ZEC terrestres do continente.", e: "1:5 000.", ex: "Desenhar uma intervenção num monte alentejano evitando os charcos temporários (3170*) e mantendo o montado (6310)." },
      en: { s: "Find where a specific habitat lies, at the detail that matters for a project: works boundaries, fuel breaks, ponds, grazing.", l: "Patch with a white outline: polygons where the habitat appears in any position. The asterisk marks priority habitats under the Directive.", d: "Habitat mapping in SACs, 2018 to 2023.", c: "59 mainland terrestrial SACs.", e: "1:5,000.", ex: "Plan works on an Alentejo farm while avoiding temporary ponds (3170*) and keeping the dehesa (6310)." } },
    psrn: {
      pt: { s: "Ver os habitats da ZEC Arquipélago da Berlenga, que ainda não tem a cartografia nova.", l: "Cores por grupo do Anexo I, como no mapa das ZEC. Um habitat por polígono.", d: "Plano Sectorial da Rede Natura 2000 (RCM n.º 115-A/2008).", c: "Só a ZEC Arquipélago da Berlenga (PTCON0006). Nas outras ZEC vale a cartografia nova, que é a homologada e de referência (indicação do ICNF, 3/11/2026). A ZEC Alvito/Cuba não tem habitats no PSRN2000.", e: "1:100 000, generalizado e indicativo.", lim: "Escala regional e carácter indicativo: serve para enquadrar, não para desenhar uma intervenção. Fica até o ICNF publicar a cartografia nova da Berlenga.", ex: "Ver que habitats costeiros o plano sectorial assinala na Berlenga." },
      en: { s: "See the habitats of the Berlengas Archipelago SAC, which has no new mapping yet.", l: "Colours by Annex I group, as in the SAC map. One habitat per polygon.", d: "Natura 2000 Sectoral Plan (Council of Ministers Resolution 115-A/2008).", c: "Berlengas Archipelago SAC only (PTCON0006). In every other SAC the new mapping applies, as the approved reference (ICNF guidance, 3 Nov 2026). The Alvito/Cuba SAC has no habitats in the Sectoral Plan.", e: "1:100,000, generalised and indicative.", lim: "Regional scale and indicative: good for context, not for designing works. Kept until ICNF publishes new mapping for the Berlengas.", ex: "See which coastal habitats the sectoral plan marks on the Berlengas." } },
    art17: {
      pt: { s: "Saber se um habitat existe na região, mesmo fora da Rede Natura, e em que estado de conservação está no país.", l: "Quadrículas de 10 km onde o habitat foi reportado, pintadas pelo estado de conservação global da região biogeográfica: verde favorável, amarelo inadequado, vermelho mau, cinzento desconhecido.", d: "Relatório nacional do art. 17.º da Directiva Habitats, 2013 a 2018.", c: "Todo o país, incluindo fora da Rede Natura.", e: "Quadrícula de 10 km (grelha europeia da EEA).", lim: "Presença na quadrícula, não no terreno: um quadrado de 10 km pode ter o habitat só num canto. O estado é o da região biogeográfica, não o do sítio.", ex: "Ver se um terreno fora da Rede Natura está numa quadrícula com montado ou charcos temporários reportados." },
      en: { s: "Find whether a habitat occurs in the area, even outside Natura 2000, and its conservation status nationally.", l: "10 km cells where the habitat was reported, coloured by the overall status in the biogeographical region: green favourable, yellow inadequate, red bad, grey unknown.", d: "National Article 17 report under the Habitats Directive, 2013 to 2018.", c: "Whole country, including outside Natura 2000.", e: "10 km grid (EEA reference grid).", lim: "Presence in the cell, not on the ground: a 10 km square may hold the habitat in one corner only. Status refers to the biogeographical region, not the site.", ex: "Check whether a plot outside Natura 2000 lies in a cell with reported dehesa or temporary ponds." } }
  };
  var SVC = { zec: ["Habitats naturais e seminaturais em ZEC", ZEC], psrn: ["Habitats do PSRN2000", PSRN], art17: ["Relatório art. 17.º, habitats 2013–2018", A17] };
  var CIT_COPIA = { pt: "ICNF, {c}, {u}. Cópia do IPR descarregada a " + PSRN_DATA + "; dados do ICNF, com referência à propriedade do ICNF.",
    en: "ICNF, {c}, {u}. IPR copy downloaded on " + PSRN_DATA + "; ICNF data, credited to ICNF as owner." };
  function ficha(d, l) {
    var F = FAM[d.fam][l], sv = d.fam === "psrn" ? SVC.psrn : d.fam === "art17" ? SVC.art17 : SVC.zec, cit = d.fam === "psrn" ? CIT_COPIA : CIT;
    var nome = l === "pt" ? d.n : d.en, o = nome + ".";
    if (d.hab) o = (l === "pt" ? "Habitat " : "Habitat ") + d.hab[0] + (d.hab[4] ? (l === "pt" ? " (prioritário)" : " (priority)") : "") + ": " + (l === "pt" ? d.hab[2] : d.hab[3]) + ".";
    return { id: d.id, n: nome, g: (l === "pt" ? "Natureza e clima · " : "Nature and climate · ") + SUB[d.sub][l === "pt" ? 0 : 1] + (d.niv === "i" ? " · Intelligence" : ""),
      o: o, s: F.s, l: F.l, f: cit[l].replace("{c}", sv[0]).replace("{u}", sv[1]), d: F.d, c: F.c, e: F.e,
      lim: F.lim || ZEC_LIM[l], ex: F.ex, est: l === "pt" ? "disponível" : "available", porConfirmar: [] };
  }
  function fichas() {
    var F = window.IPR_FICHAS; if (!F) return false;
    var l = lg(); LIST.forEach(function (d) { if (!(EXPL && d.niv === "i")) F[d.id] = ficha(d, l); });
    return true;
  }
  (function vez(n) { if (!fichas() && n < 150) setTimeout(function () { vez(n + 1); }, 800); })(0);
  document.addEventListener("ipr:lingua", function () { try { fichas(); } catch (e) {} });
})();
