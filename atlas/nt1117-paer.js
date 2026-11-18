/* IPR Atlas · Potenciais Áreas de Aceleração de Energias Renováveis (PAER). Terracrua Design.
   Pedido do Nuno (17/11/2026, 22h56: «as áreas de aceleração ... avançar já»).
   Fonte (ArcGIS REST, lida a 17/11/2026): LNEG, sig.lneg.pt/server/rest/services/AreasAceleracaoEnergiasRenovaveis/MapServer,
   cinco cenários (A id 6, B id 1, C id 2, D id 3, E id 4), polígonos, situação de Fevereiro/Março de 2024. Trabalho do GTAER
   (Despacho n.º 11912/2023). Não são as AER formais: contribuem para a sua definição futura. Licença: confirmar na ficha
   (dados.gov.pt, conjunto de dados de elevado valor).
   Mesmo padrão do nt1117-geologia.js: só acrescenta ao catálogo por IPRViz.juntar; não mexe no viz.js nem no app.js.
   Grupo Solo, subgrupo «Energias renováveis (PAER)». Desligar: ?paer=0. */
(function () {
  "use strict";
  var W = window;
  if (/[?&]paer=0(&|$)/.test(location.search) || W.__iprPaer1117) return; W.__iprPaer1117 = 1;
  var URL = "https://sig.lneg.pt/server/rest/services/AreasAceleracaoEnergiasRenovaveis/MapServer";
  var SUB = ["Energias renováveis (PAER)", "Renewable energy (PAER)"];
  var FONTE = "LNEG / GTAER · Potenciais Áreas de Aceleração de Energias Renováveis";
  var NOTA = "Áreas potenciais, Fev./Mar. 2024; não são a definição formal das AER";
  // [id, nome pt, nome en, camada, cor, opacidade, zoom mínimo, nota]
  var C = [
    ["paer_a", "PAER · Cenário A", "PAER · Scenario A", "show:6", "#2e7d32", .5, 6, NOTA],
    ["paer_b", "PAER · Cenário B", "PAER · Scenario B", "show:1", "#558b2f", .5, 6, NOTA],
    ["paer_c", "PAER · Cenário C", "PAER · Scenario C", "show:2", "#9e9d24", .5, 6, NOTA],
    ["paer_d", "PAER · Cenário D", "PAER · Scenario D", "show:3", "#f9a825", .5, 6, NOTA],
    ["paer_e", "PAER · Cenário E", "PAER · Scenario E", "show:4", "#ef6c00", .5, 6, NOTA]
  ];
  function registar() {
    var V = W.IPRViz; if (!V || typeof V.juntar !== "function" || !V.catalogo) return false;
    var ja = {}; V.catalogo.forEach(function (e) { if (e && e.id) ja[e.id] = 1; });
    C.forEach(function (d) {
      if (ja[d[0]]) return;
      var e = { id: d[0], g: "solo", sub: SUB[0], subEn: SUB[1], n: d[1], en: d[2], t: "ags", url: URL, layers: d[3],
                lic: "a", op: d[5], cor: d[4], minz: d[6], fonte: FONTE, nota: d[7] };
      e._sub = SUB[0];
      V.juntar(e);
    });
    return true;
  }
  (function vez(n) { try { if (registar()) return; } catch (e) {} if (n < 60) setTimeout(function () { vez(n + 1); }, 100); })(0);
})();
