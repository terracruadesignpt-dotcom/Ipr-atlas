/* IPR Atlas · camadas arrumadas por tipo de informação (Nuno, 7/11/2026, 21h27: «Gosto da forma de organizar, avança»).
   Proposta: documento «IPR Atlas · Reorganização das camadas e dos temas». Carrega-se logo a seguir ao viz.js e antes
   do app.js. Antes de o painel ser desenhado (IPRViz.criar), troca os grupos do catálogo pelas 12 categorias e
   reparte cada camada pela subcategoria nova. Junta ao mesmo catálogo as camadas do grupo Mundo (mundo-camadas.js),
   com a etiqueta de cobertura no nome, para deixarem de estar num grupo à parte.
   Nada sai do Atlas: os identificadores das camadas não mudam (as camadas ligadas continuam ligadas) e o nível de
   acesso de cada camada continua a ser decidido pelo grupo antigo (campo _g, lido pelo viz.js).
   Fase de equipa: liga com ?arrumo=1 (fica guardado neste navegador) ou para quem tem a barra de administração;
   desliga com ?arrumo=0. Para ligar a todos: window.IPR_ARRUMO_TODOS = true (ou atlas.json com arrumo-todos.js). */
(function (W) {
  "use strict";
  if (!W.IPRViz || W.__iprArrumo) return; W.__iprArrumo = true;
  function ligado() {
    try {
      var q = location.search;
      if (/[?&]arrumo=0(&|$)/.test(q)) { localStorage.removeItem("ipr_arrumo"); return false; }
      if (/[?&]arrumo=1(&|$)/.test(q)) { localStorage.setItem("ipr_arrumo", "1"); return true; }
      if (localStorage.getItem("ipr_arrumo") === "1") return true;
    } catch (e) {}
    if (W.IPR_ARRUMO_TODOS) return true;
    return !!(document.body && document.body.classList.contains("admin-bar"));
  }
  var GRUPOS = [
    ["fundo", "Fundo do mapa"], ["base", "A minha Base Cartográfica"], ["meus", "O meu terreno"],
    ["prop", "1. Propriedade e limites"], ["lidar", "2. Relevo e terreno"], ["agua", "3. Água"],
    ["solo", "4. Solo e geologia"], ["ocup", "5. Ocupação do solo e vegetação"], ["nat", "6. Natureza e biodiversidade"],
    ["fogo", "7. Fogo"], ["clima", "8. Clima e tempo"], ["riscos", "9. Riscos"],
    ["cond", "10. Ordenamento e condicionantes"], ["ref", "11. Pessoas e infra-estruturas"], ["ipr", "12. Projectos e estudos IPR"]
  ];
  var EN = { fundo: "Map background", base: "My Base Map", meus: "My land", prop: "1. Property and boundaries", lidar: "2. Terrain and relief",
    agua: "3. Water", solo: "4. Soil and geology", ocup: "5. Land cover and vegetation", nat: "6. Nature and biodiversity", fogo: "7. Fire",
    clima: "8. Climate and weather", riscos: "9. Hazards", cond: "10. Planning and constraints", ref: "11. People and infrastructure", ipr: "12. IPR projects and studies" };
  // grupo antigo|subgrupo antigo → [grupo novo, subgrupo novo]. Sem entrada para o subgrupo: vale a do grupo («*»).
  var M = {
    "fundo|Actual": ["fundo", "Imagem actual"], "fundo|Satélite": ["fundo", "Satélite"], "fundo|Histórico": ["fundo", "Imagem histórica"], "fundo|Cartográfico": ["fundo", "Mapa"],
    "prop|Propriedade": ["prop", "Cadastro e prédios"], "prop|Rede IPR": ["prop", "Cadastro e prédios"], "prop|Limites administrativos (CAOP 2025)": ["prop", "Limites administrativos"],
    "cond|Ordenamento (PDM)": ["cond", "PDM"], "cond|PDM · planta de condicionantes (imagem)": ["cond", "PDM"], "cond|Litoral": ["cond", "Litoral e planos especiais"],
    "cond|Reservas": ["cond", "RAN e REN"], "cond|Natureza": ["nat", "Áreas classificadas"], "cond|Áreas classificadas": ["nat", "Áreas classificadas"],
    "cond|Água": ["cond", "Servidões e restrições"], "cond|Inundações": ["agua", "Cheias e inundações"], "cond|Servidões": ["cond", "Servidões e restrições"],
    "cond|Servidões oficiais (SRUP · DGT)": ["cond", "Servidões e restrições"], "cond|Caça e lazer": ["cond", "Avaliação ambiental e outros"],
    "fogo|Perigosidade": ["fogo", "Perigosidade e recorrência"], "fogo|Recorrência e severidade": ["fogo", "Perigosidade e recorrência"], "fogo|Áreas ardidas": ["fogo", "Áreas ardidas"],
    "fogo|Gestão de combustível": ["fogo", "Gestão de combustível e defesa"], "fogo|Prioridades de defesa": ["fogo", "Gestão de combustível e defesa"],
    "agua|Superficial": ["agua", "Rios, ribeiras e bacias"], "agua|IPR basins (LiDAR)": ["agua", "Rios, ribeiras e bacias"], "agua|Bacias IPR (LiDAR)": ["agua", "Rios, ribeiras e bacias"],
    "agua|Armazenamento": ["agua", "Água superficial e zonas húmidas"], "agua|Cheias": ["agua", "Cheias e inundações"], "agua|Subterrânea": ["agua", "Água subterrânea"],
    "agua|Pontos de água": ["agua", "Usos e captações"], "agua|Estações": ["agua", "Usos e captações"], "agua|Captações": ["agua", "Usos e captações"], "agua|Banhos": ["agua", "Usos e captações"],
    "agua|Estado das águas": ["agua", "Estado, pressões e protecção"], "agua|Pressões": ["agua", "Estado, pressões e protecção"], "agua|Protecção": ["agua", "Estado, pressões e protecção"],
    "agua|Escassez": ["agua", "Seca e escassez"], "agua|Hidrologia do solo": ["solo", "Solos"], "agua|Clima": ["clima", "Clima de referência"],
    "solo|Solo": ["solo", "Solos"], "solo|Geologia": ["solo", "Geologia"], "solo|Ocupação": ["ocup", "Ocupação do solo"], "solo|Vegetação": ["ocup", "Vigor da vegetação"],
    "solo|Floresta": ["ocup", "Floresta e árvores"], "solo|Corredores e ordenamento florestal": ["nat", "Corredores e ecologia"],
    "ref|*": ["ref", "Estradas, caminhos e edifícios"],
    "nat|Biodiversidade (GBIF)": ["nat", "Espécies"], "nat|Espécies (quadrículas)": ["nat", "Espécies"], "nat|Água e clima (NASA GIBS)": ["clima", "Agora"],
    "nat|Clima (Atlas do Ambiente)": ["clima", "Clima de referência"], "nat|Áreas classificadas": ["nat", "Áreas classificadas"],
    "nat|Corredores e ordenamento florestal": ["nat", "Corredores e ecologia"], "nat|Bioclima e ecologia (Atlas do Ambiente)": ["nat", "Corredores e ecologia"],
    "nat|Caça e lazer": ["cond", "Avaliação ambiental e outros"],
    "amb|AIA": ["cond", "Avaliação ambiental e outros"], "amb|Riscos industriais": ["riscos", "Tecnológicos"]
  };
  function destino(g, sub) {
    if (M[g + "|" + sub]) return M[g + "|" + sub];
    if (g === "nat" && /^Habitats/.test(sub)) return ["nat", "Habitats"];
    if (M[g + "|*"]) return M[g + "|*"];
    return null;
  }
  function arrumar(e) {
    if (!e || e._arr) return;
    e._arr = 1; if (!e._g) e._g = e.g;
    var d = destino(e.g, String(e.sub || ""));
    if (d) { e.g = d[0]; e.sub = d[1]; }
  }
  // Camadas do grupo Mundo → catálogo. Cobertura no nome.
  var MU = {
    "mu-viirs": ["clima", "Agora", "Mundo"], "mu-luzes": ["ref", "População", "Mundo"], "mu-aster": ["lidar", "Relevo sombreado e altitude", "Mundo"],
    "mu-chuva": ["clima", "Agora", "Mundo"], "mu-temp": ["clima", "Clima de referência", "Mundo"],
    "mu-cheia": ["agua", "Cheias e inundações", "Mundo"], "mu-cheia-s1": ["agua", "Cheias e inundações", "Europa e mundo"], "mu-rcheia": ["agua", "Cheias e inundações", "Mundo"],
    "mu-humid": ["agua", "Seca e escassez", "Mundo"], "mu-rseca": ["agua", "Seca e escassez", "Mundo"],
    "mu-evi": ["ocup", "Vigor da vegetação", "Mundo"], "mu-perda": ["ocup", "Floresta e árvores", "Mundo"], "mu-altura": ["ocup", "Floresta e árvores", "Mundo"],
    "mu-biomassa": ["ocup", "Floresta e árvores", "Mundo"], "mu-pop": ["ref", "População", "Mundo"], "mu-rdesl": ["riscos", "Naturais", "Mundo"],
    "mu-fwi": ["fogo", "Perigo hoje", "Europa"],
    "eu-past": ["ocup", "Pastagens e agricultura", "Europa"], "eu-past-mud": ["ocup", "Pastagens e agricultura", "Europa"],
    "eu-sebes": ["ocup", "Sebes e vegetação lenhosa", "Europa"], "eu-sebes5": ["ocup", "Sebes e vegetação lenhosa", "Europa"],
    "eu-lenhosa": ["ocup", "Sebes e vegetação lenhosa", "Europa"], "eu-ripar": ["ocup", "Sebes e vegetação lenhosa", "Europa"],
    "eu-copa-mud": ["ocup", "Floresta e árvores", "Europa"], "eu-humidas": ["agua", "Água superficial e zonas húmidas", "Europa"],
    "eu-clcplus": ["ocup", "Ocupação do solo", "Europa"], "ao-lulc": ["ocup", "Ocupação do solo", "Mundo"],
    "eu-prod": ["solo", "Produtividade e degradação", "Europa"], "eu-tend": ["solo", "Produtividade e degradação", "Europa"],
    "eu-hidro": ["agua", "Rios, ribeiras e bacias", "Europa"],
    "ao-agua-oc": ["agua", "Água superficial e zonas húmidas", "Mundo"], "ao-agua-saz": ["agua", "Água superficial e zonas húmidas", "Mundo"],
    "ao-solo-c": ["solo", "Solos", "Mundo"], "ao-solo-ph": ["solo", "Solos", "Mundo"], "ao-solo-arg": ["solo", "Solos", "Mundo"],
    "mu-solo-areia": ["solo", "Solos", "Mundo"], "mu-solo-n": ["solo", "Solos", "Mundo"]
  };
  function juntarMundo() {
    var CAT = W.IPR_MUNDO_CAT; if (!CAT) return;
    CAT.forEach(function (gr) {
      gr[1].forEach(function (it) {
        if (it.vec || !MU[it.id]) return;
        var d = MU[it.id];
        W.IPRViz.juntar({ id: "mx-" + it.id, g: d[0], sub: d[1], n: it.nome + " · " + d[2], t: "xyz", url: it.url, ts: 256,
          mz: it.max > 19 ? 19 : it.max, minz: it.min || 0, op: it.op, fonte: it.attr, nota: it.nota || "",
          lic: it.intel ? "v" : "a", _g: it.intel ? "solo" : "ref", _arr: 1, bb: [-180, -85, 180, 85] });
      });
    });
  }
  var orig = W.IPRViz.criar;
  W.IPRViz.criar = function () {
    try {
      if (ligado()) {
        W.IPR_ARRUMO = true;
        var v = W.IPRViz.grupos, en = W.IPR_LANG === "en" || W.IPR_LINGUA === "en";
        var velhos = {}; v.forEach(function (x) { velhos[x.id] = x; });
        var novos = GRUPOS.map(function (p) { var o = velhos[p[0]] || { id: p[0] }; o.nome = en ? EN[p[0]] : p[1]; if (en) o.en = EN[p[0]]; return o; });
        v.length = 0; novos.forEach(function (x) { v.push(x); });
        juntarMundo();
        W.IPRViz.catalogo.forEach(arrumar);
        var j = W.IPRViz.juntar;
        W.IPRViz.juntar = function (e) { arrumar(e); return j.apply(this, arguments); };
      }
    } catch (x) { if (W.console) console.warn("[arrumo]", x && x.message); }
    return orig.apply(this, arguments);
  };
})(window);
