/* IPR Atlas · Mão e lápis, e limpar o mapa (24/11/2026, 21h37). Terracrua Design.
   Nuno (21h37): «devia haver um coisinho para a mão, só para a mão e o lápis, como no QField [...] eu carrego na peça do cadastro
   e agora o gajo vai mexer nos vértices. Portanto tem que ter o edit, que é passar da mão para o lápis, que fica ali ao lado das
   ferramentas [...] com uma informaçãozinha: para desenhar é preciso o lápis.»
   E (21h32): «era fixe que um gajo pudesse apagar tudo o que está no mapa, porque há polígonos para aqui perdidos».
   1. Ao lado da barra das ferramentas (#tb-bar), dois botões: Mão (navegar e escolher, sem mexer em nada) e Lápis (desenhar e
      editar vértices). Começa na mão.
      Na mão: escolher uma parcela do cadastro continua a funcionar, mas o desenho não fica seleccionado (nem vértices nem
      arrastar). Se uma ferramenta começar a desenhar, passa sozinho para o lápis e avisa «Para desenhar é preciso o lápis».
   2. Botão «Limpar o mapa»: pede confirmação na própria página e apaga os desenhos e polígonos (terreno escolhido, desenhos
      das ferramentas e resultados das análises). Não mexe em camadas nem em projectos guardados.
   Só acrescenta; não edita outros ficheiros. Desligar: ?maolapis=0 ou localStorage ipr_ml=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]maolapis=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ml") === "0") return; } catch (e) {}
  if (W.__iprML) return; W.__iprML = 1;
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function desenho() { var M = mapa(); return M && (M._controls || []).filter(function (x) { return x && typeof x.getAll === "function" && typeof x.changeMode === "function"; })[0]; }

  function pc() { try { return W.matchMedia("(min-width: 1024px)").matches; } catch (e) { return W.innerWidth >= 1024; } }
  var modo = "mao";
  try { if (W.localStorage.getItem("ipr_ml_modo") === "lapis") modo = "lapis"; } catch (e) {}

  var I_MAO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V4a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.6 15.6a1.6 1.6 0 0 1 2.4-2.1L8 14.5"/></svg>';
  var I_LAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z"/><path d="M13.5 7.5l3 3"/></svg>';
  var I_LIX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

  var CSS =
    "#ipr-ml{display:inline-flex;align-items:center;gap:2px;margin-left:8px;padding:3px;border-radius:999px;background:rgba(13,17,11,.72);border:1px solid rgba(255,255,255,.1);pointer-events:auto}" +
    "#ipr-ml button{width:34px;height:30px;border:0;border-radius:999px;background:none;color:#bdbcb0;cursor:pointer;display:grid;place-items:center;padding:0}" +
    "#ipr-ml button svg{width:18px;height:18px}" +
    "#ipr-ml button:hover{color:#f2f0e6;background:rgba(255,255,255,.07)}" +
    "#ipr-ml button.on{background:#a6cc4f;color:#11160d}" +
    "#ipr-ml .sep{width:1px;height:16px;background:rgba(255,255,255,.14);margin:0 3px}" +
    "#ipr-ml-av{position:fixed;z-index:2147480070;padding:8px 14px;border-radius:12px;background:rgba(13,17,11,.92);color:#e6e4d9;font:500 12.5px Geist,Inter,system-ui,sans-serif;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 28px -10px rgba(0,0,0,.6);display:none;max-width:320px}" +
    "#ipr-ml-av b{color:#c8e27a;font-weight:600}" +
    "#ipr-ml-av .bt{display:flex;gap:6px;margin-top:10px}" +
    "#ipr-ml-av .bt button{height:30px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:none;color:#e6e4d9;font:500 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-ml-av .bt button.p{background:#e5484d;border:0;color:#fff}" +
    "@media (max-width:1023px){#ipr-ml{display:none!important}}"; /* telemóvel: fica como estava (sem mão nem lápis) */

  function aviso(html, ms, botoes) {
    var a = D.getElementById("ipr-ml-av"); if (!a) { a = D.createElement("div"); a.id = "ipr-ml-av"; D.body.appendChild(a); }
    var g = D.getElementById("ipr-ml"); if (!g) return;
    a.innerHTML = html + (botoes ? '<div class="bt">' + botoes.map(function (b, i) { return '<button type="button" data-i="' + i + '"' + (b[2] ? ' class="p"' : "") + ">" + b[0] + "</button>"; }).join("") + "</div>" : "");
    a.style.display = "block";
    var r = g.getBoundingClientRect();
    a.style.left = Math.max(8, Math.min(W.innerWidth - a.offsetWidth - 8, Math.round(r.left))) + "px";
    a.style.top = Math.round(r.bottom + 8) + "px";
    a.onclick = function (e) { var b = e.target.closest("button[data-i]"); if (!b) return; var f = botoes[+b.getAttribute("data-i")][1]; a.style.display = "none"; if (f) f(); };
    clearTimeout(aviso.t); if (ms) aviso.t = setTimeout(function () { a.style.display = "none"; }, ms);
  }

  function pintar() {
    var g = D.getElementById("ipr-ml"); if (!g) return;
    g.querySelector('[data-m="mao"]').classList.toggle("on", modo === "mao");
    g.querySelector('[data-m="lapis"]').classList.toggle("on", modo === "lapis");
    D.documentElement.classList.toggle("ipr-ml-mao", modo === "mao" && pc());
  }
  function mudar(m, avisar) {
    modo = m; try { W.localStorage.setItem("ipr_ml_modo", m); } catch (e) {}
    pintar();
    if (m === "mao") soltar();
    if (avisar) aviso(m === "mao" ? t("<b>Mão</b>: navegar e escolher. Nada se mexe no desenho.", "<b>Hand</b>: pan and pick. Nothing in the drawing moves.") : t("<b>Lápis</b>: desenhar e mexer nos vértices.", "<b>Pencil</b>: draw and edit vertices."), 2500);
  }
  var aSoltar = false;
  function soltar() {
    var d = desenho(); if (!d || aSoltar || !pc()) return;
    try { var md = d.getMode(); if (md === "direct_select" || (md === "simple_select" && d.getSelectedIds().length)) { aSoltar = true; d.changeMode("simple_select", { featureIds: [] }); aSoltar = false; } } catch (e) { aSoltar = false; }
  }

  function ligarMapa() {
    var M = mapa(); if (!M || M.__iprML) return; M.__iprML = 1;
    M.on("draw.modechange", function (e) {
      if (modo !== "mao" || aSoltar || !pc()) return;
      var md = e && e.mode || "";
      if (/^draw_/.test(md) || md === "draw_polygon") { mudar("lapis"); aviso(t("Para desenhar é preciso o <b>lápis</b>. Passei para o lápis.", "Drawing needs the <b>pencil</b>. Switched to pencil."), 3500); return; }
      if (md === "direct_select") setTimeout(soltar, 0);
    });
    M.on("draw.selectionchange", function () { if (modo === "mao" && pc()) setTimeout(soltar, 0); });
  }

  // ferramentas de desenho do nt1124-trabalho (faixa «Desenhar»): com a mão, passam ao lápis com o aviso
  D.addEventListener("click", function (e) {
    if (modo !== "mao" || !pc()) return;
    var b = e.target.closest && e.target.closest("#ipr-trb button[data-s], #ipr-modos-acc button");
    if (!b) return;
    var s = (b.getAttribute("data-s") || b.textContent || "");
    if (b.hasAttribute("data-s") || /desenhar|draw|marcador|marker|medir|measure/i.test(s)) { mudar("lapis"); aviso(t("Para desenhar é preciso o <b>lápis</b>. Passei para o lápis.", "Drawing needs the <b>pencil</b>. Switched to pencil."), 3500); }
  }, true);

  function limpar() {
    var d = desenho(), M = mapa(), n = 0;
    try { if (d) { var fs = d.getAll().features; n += fs.length; d.deleteAll(); if (M && fs.length) M.fire("draw.delete", { features: fs }); } } catch (e) {}
    try { ["ipr-an"].forEach(function (s) { var src = M && M.getSource(s); if (src && src.setData) src.setData({ type: "FeatureCollection", features: [] }); }); } catch (e) {}
    // desenhos das ferramentas (nt1124-trabalho): usa o próprio botão «Limpar» e confirma no cartão dele
    try {
      var trb = D.getElementById("ipr-trb");
      if (trb) {
        var x = D.createElement("button"); x.type = "button"; x.setAttribute("data-a", "limpar-an"); x.style.display = "none"; trb.appendChild(x); x.click();
        var y = D.createElement("button"); y.type = "button"; y.setAttribute("data-a", "limpar"); y.style.display = "none"; trb.appendChild(y); y.click();
        setTimeout(function () { var c = D.getElementById("ipr-trb-c"), ok = c && [].filter.call(c.querySelectorAll("button"), function (b) { return /apagar tudo/i.test(b.textContent); })[0]; if (ok) ok.click(); }, 60);
      }
    } catch (e) {}
    aviso(t("Mapa limpo. Pode escolher outro terreno.", "Map cleared. You can pick another plot."), 2500);
  }
  function pedirLimpar() {
    aviso(t("<b>Limpar o mapa?</b><br>Apaga o terreno escolhido, os desenhos e as análises que estão no mapa. As camadas e os projectos guardados ficam.", "<b>Clear the map?</b><br>Removes the chosen plot, drawings and analyses on the map. Layers and saved projects stay."), 0,
      [[t("Cancelar", "Cancel"), null], [t("Limpar", "Clear"), limpar, 1]]);
  }

  function montar() {
    var bar = D.getElementById("tb-bar"); if (!bar || D.getElementById("ipr-ml")) return;
    var g = D.createElement("div"); g.id = "ipr-ml"; g.setAttribute("role", "group");
    g.innerHTML = '<button type="button" data-m="mao" title="' + t("Mão: navegar e escolher, sem mexer no desenho", "Hand: pan and pick, without changing the drawing") + '" aria-label="' + t("Mão", "Hand") + '">' + I_MAO + "</button>" +
      '<button type="button" data-m="lapis" title="' + t("Lápis: para desenhar e mexer nos vértices é preciso o lápis", "Pencil: needed to draw and edit vertices") + '" aria-label="' + t("Lápis", "Pencil") + '">' + I_LAP + "</button>" +
      '<span class="sep"></span><button type="button" data-a="limpar" title="' + t("Limpar o mapa: apagar terreno, desenhos e análises", "Clear the map: remove plot, drawings and analyses") + '" aria-label="' + t("Limpar o mapa", "Clear the map") + '">' + I_LIX + "</button>";
    var modos = D.getElementById("ipr-modos");
    if (modos && modos.parentNode === bar) bar.insertBefore(g, modos.nextSibling); else bar.appendChild(g);
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.getAttribute("data-a") === "limpar") { pedirLimpar(); return; }
      mudar(b.getAttribute("data-m"), true);
    });
    pintar();
  }

  function correr() {
    if (!D.getElementById("ipr-ml-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-ml-css"; s.textContent = CSS; D.head.appendChild(s); }
    montar(); ligarMapa();
    if (modo === "mao") soltar();
  }
  (function vez(n) { correr(); if (n < 80) setTimeout(function () { vez(n + 1); }, 500); })(0);
  setInterval(correr, 3000);
  W.IPR_MAO_LAPIS = { modo: function () { return modo; }, mudar: mudar, limpar: pedirLimpar };
})();
