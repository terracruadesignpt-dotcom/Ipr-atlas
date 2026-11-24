/* IPR Atlas · Símbolos do desenho (24/11/2026, 21h27). Terracrua Design.
   Nuno: «as ferramentas de desenho [...] aparecesse o nome e depois o símbolo [...] um muro ou uma vedação é uma linha de cores
   diferentes. Quando é água, uns são linhas, outros são polígonos [...] meter o desenhozinho por baixo do nome ou por cima».
   1. Cada botão de subtipo da faixa «Desenhar» (#ipr-trb, nt1124-trabalho.js) ganha por cima do nome o símbolo com que o
      desenho aparece no mapa: ponto, linha (cheia, tracejada, pontilhada) ou polígono (preenchimento e contorno).
   2. No mapa, cada subtipo passa a ter cor e traço próprios (antes era uma cor por tipo). Azul só para a água; caminhos castanhos.
   Só acrescenta: não edita o nt1124-trabalho.js; muda a pintura das camadas ipr-dz-* e junta três camadas de traço.
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
    "Terreno": ["#e5484d"], "Zona 0 a 5": ["#e888b0"], "Faixa de combustível": ["#f5a623"]
  };
  var DASH = { t: [3, 2], p: [0.6, 1.8], tp: [4, 2, 0.6, 2] };
  var SVGD = { t: "5 3", p: "1.2 2.6", tp: "6 3 1.5 3" };
  function cor(n) { return (S[n] || [])[0]; }

  function simbolo(nome, forma) {
    var s = S[nome] || ["#e6e4d9"], c = s[0], tr = s[1] || "", w = Math.min(4, Math.max(2, (s[2] || 2.4)));
    if (forma === "p") return '<svg viewBox="0 0 30 14" aria-hidden="true"><circle cx="15" cy="7" r="' + (nome === "Árvore notável" ? 5.5 : 4.5) + '" fill="' + c + '" stroke="#11160d" stroke-width="1.3"/></svg>';
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
        M.__iprSimbL = M.getLayer("ipr-dz-l");
      }
    } catch (e) { if (W.console) console.warn("[simbolos]", e && e.message); }
  }

  function correr() {
    if (!D.getElementById("ipr-sb-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-sb-css"; s.textContent = CSS; D.head.appendChild(s); }
    var t = D.getElementById("ipr-trb");
    if (t && !t.__sb && W.MutationObserver) { t.__sb = 1; new MutationObserver(botoes).observe(t, { childList: true, subtree: true }); }
    botoes(); aplicar();
  }
  (function vez(n) { correr(); if (n < 80) setTimeout(function () { vez(n + 1); }, 500); })(0);
  setInterval(correr, 3000);
  W.IPR_SIMBOLOS = { estilo: S, cor: cor, svg: simbolo };
})();
