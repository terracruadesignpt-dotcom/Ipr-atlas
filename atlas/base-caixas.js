/* IPR Atlas · base-caixas.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Queixa do Nuno, 04/11/2026, 09h15, Base 18032 «Ensaio · Sub-bacia da Ribeira do Torgal» (/atlas/?mapa=18032):
   «as camadas à esquerda não dá para activar nem para desactivar [...] quando tento carregar não dá» e «curvas de nível
   com má leitura, muito esquisito» à escala 1:10 000 sobre o ortofoto.
   1. Causa das caixas (vista no ensaio com os ficheiros reais da Base): a abertura automática do minhas-bases.js
      (ligarIniciais, §2) espera que o mapa esteja «pronto» (isStyleLoaded) e, enquanto os PMTiles carregam, isso pode
      demorar dezenas de segundos. Quando finalmente corre, volta a ligar o limite, o MDT e o sombreamento que a pessoa
      já tinha desligado e desliga as camadas que ela já tinha ligado. No ensaio: desligados aos 20,1 s, 22,7 s e 25,2 s,
      religados todos aos 26,1 s pelo ligarIniciais. Para quem está a clicar, as caixas «não respondem».
      Aqui: a escolha feita pela pessoa (clique numa caixa da lista da Base ou da árvore, «Ligar todas», «Desligar todas»,
      «Desligar») passa a valer. Um ligar/desligar automático que a contrarie, fora de um gesto da pessoa, é ignorado.
      Ao mudar de Base (novo mapa do Atlas) a memória das escolhas recomeça.
   2. Curvas de nível: as linhas brancas densas são as «Curvas de nível (LiDAR DGT, 1 a 50 m)» de pré-visualização
      (r_curvas, Mapterhorn, ligadas por omissão), calculadas por cima de um modelo de 15 níveis de zoom (cerca de 3,7 m
      por píxel aqui) e desenhadas a branco. Com uma Base aberta que tem curvas próprias, desligam-se uma vez ao abrir a
      Base (a pessoa pode voltar a ligá-las). As curvas de 0,5 m da Base (campo ELEV) passam a ter hierarquia: até 1:20 000
      só as mestras de 5 m, perto de 1:10 000 também as de 1 m, as de 0,5 m só a partir de cerca de 1:5 000; cor castanha
      escura, legível sobre o ortofoto. A barra de opacidade continua a mandar.
   Desligar tudo: ?base-caixas=0 ou localStorage ipr_base_caixas_off = 1. Só a parte 2: ?curvas-base=0. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]base-caixas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_base_caixas_off") === "1") return; } catch (e) {}
  if (W.__iprBaseCaixas) return; W.__iprBaseCaixas = 1;
  var CURVAS = true;
  try { CURVAS = !/[?&]curvas-base=0(&|$)/.test(location.search); } catch (e) {}

  // ---------------------------------------------------------------- 1. a escolha da pessoa vale
  var gesto = false, tGesto = 0, ESCOLHA = {}, VIZ = null, ignoradas = [];
  W.__iprBaseCaixasReg = ignoradas;
  function emGesto() { gesto = true; clearTimeout(tGesto); tGesto = setTimeout(function () { gesto = false; }, 40); }
  ["pointerdown", "click", "change", "input", "keydown"].forEach(function (t) { D.addEventListener(t, emGesto, true); });
  // a caixa diz o que a pessoa quer para aquela camada (lista da Base: data-mb-c; árvore: .ipr-it[data-id])
  D.addEventListener("change", function (e) {
    var ck = e.target;
    if (!ck || ck.type !== "checkbox" || !ck.closest) return;
    var li = ck.closest("#ipr-mb [data-mb-c]"), id = li && li.getAttribute("data-mb-c");
    if (!id) { li = ck.closest("#ipe-cam .ipr-it[data-id]"); id = li && li.getAttribute("data-id"); }
    if (id) ESCOLHA[id] = !!ck.checked;
  }, true);
  function embrulhar() {
    var v = W.__ipe && W.__ipe.viz;
    if (!v || typeof v.ligar !== "function") return;
    if (v !== VIZ) { VIZ = v; ESCOLHA = {}; CURVAS_FEITO = false; CURVAS_T0 = Date.now(); }
    if (v.__iprBc) return;
    var orig = v.ligar;
    v.ligar = function (id, on) {
      try {
        var k = String(id);
        if (gesto) ESCOLHA[k] = !!on; // «Ligar todas», «Desligar», etc.
        else if (Object.prototype.hasOwnProperty.call(ESCOLHA, k) && ESCOLHA[k] !== !!on) {
          ignoradas.push(k + (on ? " +" : " -"));
          return;
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    v.__iprBc = orig;
  }

  // ---------------------------------------------------------------- 2. curvas de nível
  var CURVAS_FEITO = false, CURVAS_T0 = 0;
  function estado() { return W.__ipe && W.__ipe.estado; }
  function baseTemCurvas() {
    var P = estado(), m = P && P.modo === "cliente" && P.actual;
    if (!m || !Array.isArray(m.downloads)) return false;
    return m.downloads.some(function (d) { return /(^|\/)curvas[0-9_]*\.(pmtiles|geojson)$/i.test(String((d && d.nome) || "")); });
  }
  function m(n) { return ["==", ["%", ["to-number", ["get", "ELEV"], 0.25], n], 0]; }
  var LARG = ["interpolate", ["linear"], ["zoom"],
    14, ["case", m(5), 0.7, 0],
    15.3, ["case", m(5), 0.9, m(1), 0, 0],
    15.8, ["case", m(5), 1, m(1), 0.5, 0],
    16.8, ["case", m(5), 1.1, m(1), 0.6, 0],
    17.3, ["case", m(5), 1.2, m(1), 0.7, 0.4],
    19, ["case", m(5), 1.8, m(1), 1.1, 0.7]];
  var COR = ["case", m(5), "#3b2b18", "#5a4730"];
  function curvas() {
    if (!CURVAS) return;
    var M = W.__ipe && W.__ipe.mapa, v = VIZ;
    if (!M || !M.getLayer || !v) return;
    // as curvas de pré-visualização entram com as camadas guardadas, às vezes segundos depois do mapa: vigia-se 40 s
    if (!CURVAS_FEITO) {
      if (Date.now() - CURVAS_T0 > 40000 || Object.prototype.hasOwnProperty.call(ESCOLHA, "r_curvas")) CURVAS_FEITO = true;
      else if (baseTemCurvas()) {
        try {
          var act = (v.activas && v.activas()) || [];
          if (act.indexOf("r_curvas") >= 0) { (v.__iprBc || v.ligar).call(v, "r_curvas", false); CURVAS_FEITO = true; }
        } catch (e) {}
      }
    }
    var ids = ["iprv-l_curvas05-l", "iprv-l_curvas025-l"];
    ids.forEach(function (id) {
      try {
        if (!M.getLayer(id)) return;
        var c = M.getPaintProperty(id, "line-color");
        if (JSON.stringify(c) === JSON.stringify(COR)) return;
        M.setPaintProperty(id, "line-color", COR);
        M.setPaintProperty(id, "line-width", LARG);
        var o = M.getPaintProperty(id, "line-opacity");
        if (typeof o !== "number") M.setPaintProperty(id, "line-opacity", 0.9); // número = escolhido na barra de opacidade
      } catch (e) {}
    });
  }

  // ---------------------------------------------------------------- arranque
  var n = 0;
  (function ciclo() {
    try { embrulhar(); curvas(); } catch (e) {}
    n++; setTimeout(ciclo, n < 240 ? 250 : 1000);
  })();
})();
