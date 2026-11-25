/* IPR Atlas · Símbolos do desenho (24/11/2026, 21h27). Terracrua Design.
   Nuno: «as ferramentas de desenho [...] aparecesse o nome e depois o símbolo [...] um muro ou uma vedação é uma linha de cores
   diferentes. Quando é água, uns são linhas, outros são polígonos [...] meter o desenhozinho por baixo do nome ou por cima».
   1. Cada botão de subtipo da faixa «Desenhar» (#ipr-trb, nt1124-trabalho.js) ganha por cima do nome o símbolo com que o
      desenho aparece no mapa: ponto, linha (cheia, tracejada, pontilhada) ou polígono (preenchimento e contorno).
   2. No mapa, cada subtipo passa a ter cor e traço próprios (antes era uma cor por tipo). Azul só para a água; caminhos castanhos.
   Só acrescenta: não edita o nt1124-trabalho.js; muda a pintura das camadas ipr-dz-* e junta três camadas de traço.
   3. (25/11/2026, 19h20) Nuno: «ainda são muito parecidos [...] tem que haver mancha de pomar irrigado, olival, pomar de
      sequeiro, gestão florestal, zona 5, selvagem», «as zonas», «os diferentes tipos de produção agrícola de Portugal».
      Cada mancha (polígono) ganha um padrão próprio, igual no botão e no mapa: pontos em quadrícula (pomares), filas
      (olival intensivo, vinha), copas (mata, montado), clareiras (gestão florestal), riscas de rega, círculos (pivô),
      erva (prados), manchas irregulares (zona selvagem) e tracejado com a cor de cada zona 0 a 5.
   Desligar: ?simbolos=0 ou localStorage ipr_simb=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]simbolos=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_simb") === "0") return; } catch (e) {}
  if (W.__iprSimb) return; W.__iprSimb = 1;

  // [cor, traço] · traço: "" cheio, "t" tracejado, "p" pontilhado, "tp" traço-ponto · largura opcional
  var S = {
    // Água
    "Nascente": ["#5fb4f0"], "Poço": ["#1f5f9e"], "Furo": ["#2f7fc8"], "Depósito": ["#9ccdf2"],
    "Vala em curva de nível": ["#3d8fd6", "t"], "Keyline": ["#1f5f9e", "", 3.2], "Tubagem": ["#7fb8e8", "p"], "Linha de água": ["#2f7fc8", "", 2.4],
    "Charca": ["#2f7fc8"], "Zona húmida": ["#6fc2d0"], "Bacia de retenção": ["#9ccdf2"],
    // Acessos
    "Portão": ["#8a5a2b"], "Cancela": ["#b98a52"], "Passagem": ["#d8b98c"],
    "Caminho": ["#b98a52", "", 2.6], "Estrada": ["#7a4e22", "", 3.6], "Trilho": ["#c9a26f", "t", 2],
    "Eira e parque": ["#d8b98c"], "Zona de manobra": ["#b98a52"],
    // Vegetação
    "Árvore": ["#6fa83a"], "Árvore notável": ["#2f6b1f"],
    "Sebe": ["#4f8f2a", "", 3.4], "Linha de plantação": ["#8cc152", "t"], "Corta-vento": ["#2f6b1f", "tp", 3],
    "Pomar": ["#8cc152"], "Horta": ["#b5d96b"], "Mata": ["#2f6b1f"], "Pastagem": ["#d6d36a"],
    // Edificado
    "Poste": ["#8f8a7e"], "Colmeia": ["#e0a526"], "Painel solar": ["#4a5568"],
    "Muro": ["#8f8a7e", "", 3.6], "Vedação": ["#e8c34a", "t", 2], "Rede eléctrica": ["#f08a24", "tp", 1.8],
    "Casa": ["#d9d6c8"], "Armazém": ["#a9a59a"], "Estufa": ["#e6efe9"],
    // Limites e zonas
    "Marco": ["#e5484d"], "Estrema": ["#e5484d", "", 2.4], "Faixa de servidão": ["#e5484d", "t"],
    "Terreno": ["#e5484d"], "Zona 0 a 5": ["#e888b0"], "Faixa de combustível": ["#f5a623"],
    // Floresta e vegetação (novos)
    "Arbusto": ["#7fa64a"], "Gestão florestal": ["#3f7a2a"], "Montado": ["#b9a85e"], "Galeria ripícola": ["#3c8f6a"],
    "Matos": ["#7a8f4a"], "Zona selvagem": ["#2b4a2b"],
    // Produção agrícola
    "Árvore de fruto": ["#e07a3a"], "Oliveira": ["#8f9a5a"],
    "Linha de rega": ["#3d8fd6", "p", 2], "Bardo de vinha": ["#7b3f8c", "t", 2.2], "Socalco": ["#a0785a", "", 3],
    "Pomar irrigado": ["#7cbf4a"], "Pomar de sequeiro": ["#b8b45a"], "Citrinos": ["#f2a33a"],
    "Olival tradicional": ["#a3ab72"], "Olival intensivo": ["#8a9356"], "Amendoal": ["#e6c2b8"], "Vinha": ["#9b5fa8"],
    "Souto": ["#8a6a3a"], "Frutos vermelhos": ["#c8394f"], "Cereal de sequeiro": ["#e6cc63"], "Culturas de regadio": ["#5fbf6a"],
    "Pivô de rega": ["#76c28a"], "Arrozal": ["#9fd6c4"], "Prado e forragem": ["#bcd46e"], "Pastagem melhorada": ["#a9c95a"],
    "Pousio": ["#d4c39a"], "Agrofloresta": ["#5f9e3a"],
    // Zonas
    "Zona 0 · casa": ["#c9a66b"], "Zona 1": ["#e07a5f"], "Zona 2": ["#f2b45f"], "Zona 3": ["#81b29a"], "Zona 4": ["#3d8b5a"],
    "Zona 5 · selvagem": ["#2b4a2b"]
  };
  // padrão de cada mancha: [desenho, cor do desenho]
  var PAT = {
    "Pomar": ["pontos", "#3f6b1f"], "Horta": ["xadrez", "#5f7f2a"], "Mata": ["copas", "#a9d48a"], "Pastagem": ["erva", "#7f7a2a"],
    "Gestão florestal": ["clareiras", "#e3d9a8"], "Montado": ["copasEsp", "#3f5a1f"], "Galeria ripícola": ["copasAgua", "#3d8fd6"],
    "Matos": ["selv", "#c4d48a"], "Zona selvagem": ["selv", "#8fbf6a"],
    "Pomar irrigado": ["irrig", "#2f5f1a"], "Pomar de sequeiro": ["pontos", "#6b5a22"], "Citrinos": ["pontos", "#2f6b1f"],
    "Olival tradicional": ["pontosLargos", "#4f5a2a"], "Olival intensivo": ["filas", "#4a5426"], "Amendoal": ["pontos", "#8a4f45"],
    "Vinha": ["linhas", "#4a1f57"], "Souto": ["copas", "#e0c48a"], "Frutos vermelhos": ["linhas", "#6f1424"],
    "Cereal de sequeiro": ["espigas", "#a07a1a"], "Culturas de regadio": ["riscasAgua", "#2f7fc8"], "Pivô de rega": ["circulos", "#2f7fc8"],
    "Arrozal": ["ondas", "#2f7fc8"], "Prado e forragem": ["erva", "#5a7a1f"], "Pastagem melhorada": ["erva", "#3f6b1f"],
    "Pousio": ["pontinhos", "#8a7448"], "Agrofloresta": ["copasFilas", "#e8f0c8"],
    "Zona 0 · casa": ["xadrez", "#7a5a2a"], "Zona 1": ["diag", "#8f3a26"], "Zona 2": ["diag", "#9a6420"], "Zona 3": ["diag", "#3d6b54"],
    "Zona 4": ["diag", "#1f4f30"], "Zona 5 · selvagem": ["selv", "#8fbf6a"], "Zona 0 a 5": ["diag", "#8f3f62"],
    "Faixa de combustível": ["diag", "#9a5a10"], "Zona húmida": ["ondas", "#1f5f9e"], "Estufa": ["linhas", "#a9b5ad"]
  };
  // desenha um ladrilho de 16 unidades (k = pixels por unidade)
  function ladrilho(ctx, tp, c, c2, k) {
    var u = function (v) { return v * k; };
    ctx.fillStyle = c; ctx.globalAlpha = 0.7; ctx.fillRect(0, 0, u(16), u(16)); ctx.globalAlpha = 1;
    ctx.fillStyle = c2; ctx.strokeStyle = c2; ctx.lineCap = "round";
    function dot(x, y, r) { ctx.beginPath(); ctx.arc(u(x), u(y), u(r), 0, 6.2832); ctx.fill(); }
    function ring(x, y, r, w) { ctx.lineWidth = u(w); ctx.beginPath(); ctx.arc(u(x), u(y), u(r), 0, 6.2832); ctx.stroke(); }
    function ln(x1, y1, x2, y2, w) { ctx.lineWidth = u(w); ctx.beginPath(); ctx.moveTo(u(x1), u(y1)); ctx.lineTo(u(x2), u(y2)); ctx.stroke(); }
    switch (tp) {
      case "pontos": dot(4, 4, 1.7); dot(12, 4, 1.7); dot(4, 12, 1.7); dot(12, 12, 1.7); break;
      case "pontosLargos": dot(4, 4, 1.5); dot(12, 12, 1.5); break;
      case "pontinhos": dot(3, 5, .6); dot(10, 2, .6); dot(13, 10, .6); dot(6, 13, .6); break;
      case "irrig": ctx.strokeStyle = "#3d8fd6"; ln(0, 4, 16, 4, .8); ln(0, 12, 16, 12, .8); ctx.fillStyle = c2; dot(4, 4, 1.8); dot(12, 4, 1.8); dot(4, 12, 1.8); dot(12, 12, 1.8); break;
      case "filas": ln(0, 4, 16, 4, .6); ln(0, 12, 16, 12, .6); dot(2, 4, 1.2); dot(6, 4, 1.2); dot(10, 4, 1.2); dot(14, 4, 1.2); dot(2, 12, 1.2); dot(6, 12, 1.2); dot(10, 12, 1.2); dot(14, 12, 1.2); break;
      case "linhas": ln(0, 2, 16, 2, 1.3); ln(0, 6, 16, 6, 1.3); ln(0, 10, 16, 10, 1.3); ln(0, 14, 16, 14, 1.3); break;
      case "riscasAgua": ln(0, 3, 16, 3, 1); ln(0, 11, 16, 11, 1); ctx.strokeStyle = "#5a8f2a"; ln(0, 7, 16, 7, 1.6); ln(0, 15, 16, 15, 1.6); break;
      case "copas": ring(4, 4, 3, 1.2); ring(12, 12, 3, 1.2); break;
      case "copasEsp": dot(4, 4, 2.6); dot(12.5, 11.5, 2.2); break;
      case "copasAgua": ring(4, 4, 3, 1.2); ring(12, 12, 3, 1.2); ctx.strokeStyle = "#3d8fd6"; ln(0, 16, 16, 0, .9); break;
      case "copasFilas": ring(4, 4, 2.5, 1.1); ring(12, 4, 2.5, 1.1); ln(0, 10.5, 16, 10.5, 1); ln(0, 14, 16, 14, 1); break;
      case "clareiras": ctx.fillStyle = "#2f6b1f"; dot(4, 4, 2.6); dot(12, 12, 2.6); ctx.strokeStyle = c2; ln(0, 16, 16, 0, 1.6); break;
      case "erva": ln(3, 6, 3, 3, .8); ln(4.5, 6, 5.5, 3.5, .8); ln(11, 14, 11, 11, .8); ln(12.5, 14, 13.5, 11.5, .8); break;
      case "espigas": ln(2, 14, 6, 10, .9); ln(6, 14, 10, 10, .9); ln(10, 14, 14, 10, .9); ln(4, 6, 8, 2, .9); ln(10, 6, 14, 2, .9); break;
      case "circulos": ring(8, 8, 6.5, 1); ring(8, 8, 3, .8); dot(8, 8, .9); break;
      case "ondas": ctx.lineWidth = u(.9); [4, 12].forEach(function (y) { ctx.beginPath(); ctx.moveTo(0, u(y)); ctx.bezierCurveTo(u(4), u(y - 2.5), u(4), u(y + 2.5), u(8), u(y)); ctx.bezierCurveTo(u(12), u(y - 2.5), u(12), u(y + 2.5), u(16), u(y)); ctx.stroke(); }); break;
      case "xadrez": ctx.globalAlpha = .55; ctx.fillRect(0, 0, u(8), u(8)); ctx.fillRect(u(8), u(8), u(8), u(8)); ctx.globalAlpha = 1; break;
      case "diag": ln(-2, 6, 6, -2, 1.4); ln(-2, 14, 14, -2, 1.4); ln(2, 18, 18, 2, 1.4); ln(10, 18, 18, 10, 1.4); break;
      case "selv": dot(3, 4, 2.2); dot(6, 3, 1.6); dot(11, 9, 2.6); dot(13.5, 12, 1.6); dot(4, 13, 1.3); break;
    }
  }
  function tela(nome, k, w, h) {
    var P = PAT[nome], c = (S[nome] || ["#e6e4d9"])[0]; if (!P || !D.createElement) return null;
    var cv = D.createElement("canvas"); cv.width = w || 16 * k; cv.height = h || 16 * k;
    var x = cv.getContext("2d"); if (!x) return null;
    if (!w) { ladrilho(x, P[0], c, P[1], k); return cv; }
    var t = tela(nome, k); if (!t) return null;
    x.fillStyle = x.createPattern(t, "repeat"); x.fillRect(0, 0, cv.width, cv.height);
    x.strokeStyle = c; x.lineWidth = 2 * k / 2; x.strokeRect(k / 2, k / 2, cv.width - k, cv.height - k);
    return cv;
  }
  var CACHE = {};
  function svgMancha(nome) {
    if (CACHE[nome] !== undefined) return CACHE[nome];
    var cv = null; try { cv = tela(nome, 4, 120, 60); } catch (e) {}
    return (CACHE[nome] = cv ? '<svg class="ar" viewBox="0 0 60 30" aria-hidden="true"><image href="' + cv.toDataURL() + '" width="60" height="30"/></svg>' : "");
  }
  var DASH = { t: [3, 2], p: [0.6, 1.8], tp: [4, 2, 0.6, 2] };
  var SVGD = { t: "5 3", p: "1.2 2.6", tp: "6 3 1.5 3" };
  function cor(n) { return (S[n] || [])[0]; }

  function simbolo(nome, forma) {
    var s = S[nome] || ["#e6e4d9"], c = s[0], tr = s[1] || "", w = Math.min(4, Math.max(2, (s[2] || 2.4)));
    if (forma === "p") return '<svg viewBox="0 0 30 14" aria-hidden="true"><circle cx="15" cy="7" r="' + (nome === "Árvore notável" ? 5.5 : 4.5) + '" fill="' + c + '" stroke="#11160d" stroke-width="1.3"/></svg>';
    if (forma === "g" && PAT[nome]) { var m = svgMancha(nome); if (m) return m; }
    if (forma === "g") return '<svg viewBox="0 0 30 14" aria-hidden="true"><rect x="3" y="1.5" width="24" height="11" rx="2" fill="' + c + '" fill-opacity=".45" stroke="' + c + '" stroke-width="1.8"/></svg>';
    return '<svg viewBox="0 0 30 14" aria-hidden="true"><path d="M2 10 C9 2, 17 13, 28 4" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (tr ? ' stroke-dasharray="' + SVGD[tr] + '"' : "") + "/></svg>";
  }

  var CSS =
    "#ipr-trb button[data-s]{display:inline-flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.15;padding-top:5px!important;padding-bottom:5px!important;height:auto!important;min-height:44px}" +
    "#ipr-trb button[data-s] .ipr-sb{display:block;width:30px;height:14px;pointer-events:none}" +
    "#ipr-trb button[data-s] .ipr-sb svg{width:30px;height:14px;display:block}";

  function forma() { var b = D.querySelector("#ipr-trb button[data-f].on"); return b ? b.getAttribute("data-f") : "l"; }
  function botoes() {
    var bs = D.querySelectorAll("#ipr-trb button[data-s]"); if (!bs.length) return;
    var f = forma();
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i]; if (b.querySelector(".ipr-sb")) continue;
      var n = b.getAttribute("data-s"), sp = D.createElement("span"); sp.className = "ipr-sb"; sp.innerHTML = simbolo(n, f);
      b.insertBefore(sp, b.firstChild); b.title = n;
    }
  }

  // ───── mapa ─────
  function lista(f) { return Object.keys(S).filter(function (k) { return (S[k][1] || "") === f; }); }
  function corExpr() { var e = ["match", ["get", "sub"]]; Object.keys(S).forEach(function (k) { e.push(k, S[k][0]); }); e.push(["coalesce", ["get", "cor"], "#e6e4d9"]); return e; }
  function largExpr() { var e = ["match", ["get", "sub"]], n = 0; Object.keys(S).forEach(function (k) { if (S[k][2]) { e.push(k, S[k][2]); n++; } }); e.push(2.4); return n ? e : 2.4; }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function aplicar() {
    var M = mapa(); if (!M || !M.getLayer || !M.getLayer("ipr-dz-l")) return;
    try {
      var tr = lista("t").concat(lista("p"), lista("tp"));
      if (!M.__iprSimbL || M.__iprSimbL !== M.getLayer("ipr-dz-l")) {
        M.setFilter("ipr-dz-l", ["all", ["!=", ["geometry-type"], "Point"], ["!", ["all", ["==", ["geometry-type"], "LineString"], ["in", ["get", "sub"], ["literal", tr]]]]]);
        M.setPaintProperty("ipr-dz-l", "line-color", corExpr());
        M.setPaintProperty("ipr-dz-l", "line-width", largExpr());
        if (M.getLayer("ipr-dz-f")) M.setPaintProperty("ipr-dz-f", "fill-color", corExpr());
        if (M.getLayer("ipr-dz-p")) M.setPaintProperty("ipr-dz-p", "circle-color", corExpr());
        ["t", "p", "tp"].forEach(function (k) {
          var id = "ipr-sb-" + k; if (M.getLayer(id)) return;
          M.addLayer({ id: id, type: "line", source: "ipr-dz", filter: ["all", ["==", ["geometry-type"], "LineString"], ["in", ["get", "sub"], ["literal", lista(k)]]],
            layout: { "line-cap": k === "p" ? "round" : "butt" }, paint: { "line-color": corExpr(), "line-width": largExpr(), "line-dasharray": DASH[k] } }, M.getLayer("ipr-dz-p") ? "ipr-dz-p" : undefined);
        });
        padroesMapa(M);
        M.__iprSimbL = M.getLayer("ipr-dz-l");
      }
    } catch (e) { if (W.console) console.warn("[simbolos]", e && e.message); }
  }

  function padroesMapa(M) {
    try {
      var nomes = Object.keys(PAT), e = ["match", ["get", "sub"]];
      nomes.forEach(function (n) {
        var id = "ipr-pat-" + n;
        if (!M.hasImage(id)) { var cv = tela(n, 2); if (!cv) return; var d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height); M.addImage(id, { width: cv.width, height: cv.height, data: new Uint8Array(d.data.buffer) }, { pixelRatio: 2 }); }
        e.push(n, id);
      });
      e.push("");
      if (!M.getLayer("ipr-sb-pat")) M.addLayer({ id: "ipr-sb-pat", type: "fill", source: "ipr-dz", filter: ["all", ["==", ["geometry-type"], "Polygon"], ["in", ["get", "sub"], ["literal", nomes]]], paint: { "fill-pattern": e, "fill-opacity": 0.9 } }, "ipr-dz-l");
    } catch (x) { if (W.console) console.warn("[simbolos padrões]", x && x.message); }
  }

  function correr() {
    if (!D.getElementById("ipr-sb-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-sb-css"; s.textContent = CSS; D.head.appendChild(s); }
    var t = D.getElementById("ipr-trb");
    if (t && !t.__sb && W.MutationObserver) { t.__sb = 1; new MutationObserver(botoes).observe(t, { childList: true, subtree: true }); }
    botoes(); aplicar();
  }
  (function vez(n) { correr(); if (n < 80) setTimeout(function () { vez(n + 1); }, 500); })(0);
  setInterval(correr, 3000);
  W.IPR_SIMBOLOS = { estilo: S, cor: cor, svg: simbolo, padrao: PAT };
})();
