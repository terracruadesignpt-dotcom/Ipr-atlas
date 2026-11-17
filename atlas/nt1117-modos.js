/* IPR Atlas · Modos Analisar / Desenhar / Recolher e separador «Projecto» (17/11/2026, documento «IPR Atlas e Cloud –
   Especificação», secção 5; Nuno, 21h27: «avança com tudo»). Terracrua Design.
   Só acrescenta; usa as ferramentas que o Atlas já tem e não muda nenhuma:
   · Barra de três modos ao lado da pesquisa (o mapa, a pesquisa e o painel de camadas ficam onde estão):
       Analisar  · Procurar zonas, medir área e distância, perfil de elevação, parcelas (cadastro), 3D;
       Desenhar  · abre o desenho da Base aberta por tipos (ponto, linha, área, notas: o base-desenho do Atlas), desenho livre,
                   carregar ficheiro; sem Base aberta explica como abrir uma;
       Recolher  · a minha posição (GPS), nota no mapa, fotografia georreferenciada, carregar ficheiro, e o QField com o mesmo
                   projecto na Cloud (separador Cloud).
     O modo escolhido fica lembrado neste navegador.
   · Separador «Projecto» (a seguir a «Bases») com o que pertence à Base aberta: desenhos, dados importados, observações de
     campo (QField / Cloud) e resultados dos simuladores (as minhas simulações). Sem Base aberta, diz como abrir.
   Só para quem tem o Atlas completo (equipa e Intelligence); o Explorer continua com a sua entrada simples.
   Desligar: ?modos=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]modos=0(&|$)/.test(location.search) || W.__iprModos) return; W.__iprModos = 1;
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function completo() { return String(W.IPR_NIVEL || "").toLowerCase() === "intelligence" || !!W.tcdEquipa || !!W.tcdAdmin; }
  function est() { return (W.__ipe && W.__ipe.estado) || {}; }
  function aberta() { var a = est().actual; return a && a.id ? a : null; }
  function idxAberta() { var a = aberta(); if (!a) return -1; return (est().mapas || []).findIndex(function (m) { return String(m.id) === String(a.id); }); }
  function ferr(sel) { var b = D.querySelector(sel); if (b) { b.click(); return true; } return false; }
  function tool(n) { return ferr('[data-tool="' + n + '"]'); }
  var MODO; try { MODO = W.localStorage.getItem("ipr_modo") || "analisar"; } catch (e) { MODO = "analisar"; }

  var ACC = {
    analisar: [
      [t("Procurar zonas", "Find areas"), function () { if (W.IPR_PROCURAR_ZONAS) W.IPR_PROCURAR_ZONAS.abrir(); }],
      [t("Medir área", "Measure area"), function () { tool("area"); }],
      [t("Medir distância", "Measure distance"), function () { tool("regua"); }],
      [t("Perfil", "Profile"), function () { ferr("#ipr-perfil-b"); }],
      [t("Parcelas", "Parcels"), function () { tool("parcelas"); }],
      [t("3D", "3D"), function () { tool("3d"); }]
    ],
    desenhar: [
      [t("Desenhar na Base (ponto, linha, área)", "Draw on the Base (point, line, area)"), function () { desenharBase(); }],
      [t("Desenho livre", "Free drawing"), function () { tool("desenhar"); }],
      [t("Carregar ficheiro", "Load file"), function () { tool("importar"); }]
    ],
    recolher: [
      [t("A minha posição", "My position"), function () { tool("gps"); }],
      [t("Nota", "Note"), function () { tool("marcador"); }],
      [t("Fotografia", "Photo"), function () { tool("foto"); }],
      [t("Carregar ficheiro", "Load file"), function () { tool("importar"); }],
      [t("QField e Cloud", "QField and Cloud"), function () { abrirTab("cloud"); }]
    ]
  };
  function msg(txt) {
    var b = D.getElementById("ipr-modos-msg"); if (!b) return;
    b.textContent = txt || ""; b.hidden = !txt;
    clearTimeout(b.__t); if (txt) b.__t = setTimeout(function () { b.hidden = true; }, 7000);
  }
  function desenharBase() {
    var i = idxAberta();
    if (i < 0 || !W.__iprBaseDesenho) { msg(t("Abra primeiro uma Base (separador «Bases» › Abrir) para desenhar propostas sobre ela. Para um esboço rápido use «Desenho livre».", "Open a Base first (Bases tab › Open) to draw on it. For a quick sketch use «Free drawing».")); return; }
    W.__iprBaseDesenho.abrir(i);
  }
  function abrirTab(n) { var b = D.querySelector('.ipe-tab[data-tab="' + n + '"]'); if (b) b.click(); }

  function css() {
    if (D.getElementById("ipr-modos-css")) return;
    var s = D.createElement("style"); s.id = "ipr-modos-css";
    s.textContent = "#ipr-modos{display:inline-flex;align-items:center;gap:2px;margin:0 6px;border:1px solid rgba(255,255,255,.22);border-radius:8px;padding:2px;white-space:nowrap}" +
      "#ipr-modos button{font:inherit;font-size:12px;background:transparent;color:inherit;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;opacity:.8}" +
      "#ipr-modos button[aria-pressed=true]{background:#94be39;color:#1d2316;opacity:1;font-weight:700}" +
      "#ipr-modos-acc{position:fixed;z-index:9000;left:50%;transform:translateX(-50%);top:58px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:min(900px,90vw);padding:6px 8px;border-radius:10px;background:rgba(29,35,22,.92);border:1px solid rgba(227,212,154,.3);font:12px/1.3 Inter,Helvetica,Arial,sans-serif;color:#efeee6}" +
      "#ipr-modos-acc b{opacity:.85;margin-right:4px;align-self:center}#ipr-modos-acc button{font:inherit;background:transparent;color:inherit;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:4px 9px;cursor:pointer}" +
      "#ipr-modos-acc button:hover{border-color:#94be39}#ipr-modos-acc .x{border:0;opacity:.7}" +
      "#ipr-modos-msg{position:fixed;z-index:9000;left:50%;transform:translateX(-50%);top:100px;max-width:min(560px,90vw);padding:7px 10px;border-radius:8px;background:#2a3220;color:#efeee6;border:1px solid rgba(227,212,154,.35);font:12.5px/1.4 Inter,Helvetica,Arial,sans-serif}" +
      ".ipr-pj{padding:6px 2px}.ipr-pj h4{margin:10px 0 4px;font-size:12.5px}.ipr-pj p{margin:2px 0 6px;opacity:.85;font-size:12px}.ipr-pj button{font:inherit;font-size:12px;margin:2px 4px 2px 0;padding:4px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:inherit;cursor:pointer}";
    D.head.appendChild(s);
  }
  var accFechada = true; // a barra de acções só aparece quando se escolhe um modo
  function pintarAcc() {
    var a = D.getElementById("ipr-modos-acc");
    if (accFechada) { if (a) a.remove(); return; }
    if (!a) {
      a = D.createElement("div"); a.id = "ipr-modos-acc"; D.body.appendChild(a);
      a.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; e.stopPropagation();
        if (b.classList.contains("x")) { accFechada = true; pintarAcc(); return; }
        var f = ACC[MODO][+b.getAttribute("data-i")]; if (f) f[1](); });
      ["mousedown", "pointerdown", "wheel"].forEach(function (v) { a.addEventListener(v, function (e) { e.stopPropagation(); }); });
    }
    var nome = { analisar: t("Analisar", "Analyse"), desenhar: t("Desenhar", "Draw"), recolher: t("Recolher", "Collect") }[MODO];
    var h = "<b>" + esc(nome) + ":</b>" + ACC[MODO].map(function (x, i) { return '<button type="button" data-i="' + i + '">' + esc(x[0]) + "</button>"; }).join("") +
      '<button type="button" class="x" title="' + esc(t("Esconder", "Hide")) + '">×</button>';
    if (a.__h !== h) { a.innerHTML = h; a.__h = h; }
  }
  function barra() {
    if (!completo() || W.innerWidth < 900) return;
    var q = D.getElementById("ipe-q"); if (!q) return;
    if (D.getElementById("ipr-modos")) return;
    css();
    var b = D.createElement("div"); b.id = "ipr-modos"; b.setAttribute("role", "group"); b.setAttribute("aria-label", t("Modo de trabalho", "Work mode"));
    [["analisar", t("Analisar", "Analyse")], ["desenhar", t("Desenhar", "Draw")], ["recolher", t("Recolher", "Collect")]].forEach(function (m) {
      var x = D.createElement("button"); x.type = "button"; x.setAttribute("data-modo", m[0]); x.textContent = m[1];
      x.setAttribute("aria-pressed", m[0] === MODO ? "true" : "false"); b.appendChild(x);
    });
    b.addEventListener("click", function (e) {
      var x = e.target.closest("[data-modo]"); if (!x) return; e.preventDefault(); e.stopPropagation();
      MODO = x.getAttribute("data-modo"); try { W.localStorage.setItem("ipr_modo", MODO); } catch (z) {}
      b.querySelectorAll("[data-modo]").forEach(function (y) { y.setAttribute("aria-pressed", y === x ? "true" : "false"); });
      D.documentElement.setAttribute("data-ipr-modo", MODO);
      accFechada = false; pintarAcc();
    });
    var ref = D.getElementById("ipr-pz-top") || q.parentElement;
    ref.insertAdjacentElement("afterend", b);
    D.documentElement.setAttribute("data-ipr-modo", MODO);
  }

  // ───── separador Projecto ─────
  function pane() { return D.querySelector('#ipe-corpo > .ipe-pane[data-pane="iprproj"]'); }
  function pintarProjecto() {
    var P = pane(); if (!P || P.hidden) return;
    var a = aberta(), h = '<div class="ipr-pj">';
    if (!a) h += "<p>" + esc(t("O separador Projecto reúne o que pertence a uma Base: desenhos, dados importados, observações de campo e simulações. Abra uma Base no separador «Bases» (Abrir).", "The Project tab gathers what belongs to a Base. Open a Base in the Bases tab.")) + '</p><button type="button" data-pj="bases">' + esc(t("Ir para Bases", "Go to Bases")) + "</button>";
    else {
      h += "<p><b>" + esc(a.local || ("#" + a.id)) + "</b></p>";
      h += "<h4>" + esc(t("Desenhos e propostas", "Drawings and proposals")) + "</h4><p>" + esc(t("Retenções de água, acessos, notas e o resto do desenho por tipos, guardado com a Base.", "Water retention, access, notes and the rest of the typed drawing, saved with the Base.")) + '</p><button type="button" data-pj="desenho">' + esc(t("Abrir desenho da Base", "Open Base drawing")) + "</button>";
      h += "<h4>" + esc(t("Dados importados", "Imported data")) + "</h4><p>" + esc(t("Ficheiros carregados para o mapa (GeoJSON, KML, Shapefile, GeoPackage) e camadas da organização.", "Files loaded on the map and organisation layers.")) + '</p><button type="button" data-pj="importar">' + esc(t("Carregar ficheiro", "Load file")) + '</button><button type="button" data-pj="org">' + esc(t("Camadas da organização", "Organisation layers")) + "</button>";
      h += "<h4>" + esc(t("Observações de campo", "Field observations")) + "</h4><p>" + esc(t("O que se recolhe no QField sincroniza com o mesmo projecto na Cloud.", "What is collected in QField syncs with the same project in the Cloud.")) + '</p><button type="button" data-pj="cloud">' + esc(t("QField e Cloud", "QField and Cloud")) + "</button>";
      h += "<h4>" + esc(t("Simulações", "Simulations")) + "</h4><p>" + esc(t("Resultados guardados dos simuladores de água e fogo, cada um como cenário.", "Saved water and fire simulation results, each as a scenario.")) + '</p><button type="button" data-pj="sims">' + esc(t("As minhas simulações", "My simulations")) + "</button>";
    }
    h += "</div>";
    if (P.__h !== h) { P.innerHTML = h; P.__h = h; }
  }
  function separador() {
    if (!completo()) return;
    var bar = D.getElementById("ipe-tabs"), corpo = D.getElementById("ipe-corpo"); if (!bar || !corpo) return;
    if (!bar.querySelector('[data-tab="iprproj"]')) {
      css();
      var tb = D.createElement("button"); tb.type = "button"; tb.className = "ipe-tab"; tb.setAttribute("role", "tab"); tb.setAttribute("data-tab", "iprproj");
      tb.setAttribute("aria-selected", "false"); tb.style.order = "2"; /* logo a seguir a «Bases» (a barra ordena por CSS order) */ tb.title = t("Desenhos, dados, observações e simulações da Base aberta", "Drawings, data, observations and simulations of the open Base"); tb.textContent = t("Projecto", "Project");
      var ref = bar.querySelector('[data-tab="proj"]'); if (ref && ref.nextSibling) bar.insertBefore(tb, ref.nextSibling); else bar.appendChild(tb);
      tb.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        bar.querySelectorAll(".ipe-tab").forEach(function (x) { x.setAttribute("aria-selected", x === tb ? "true" : "false"); x.classList.toggle("on", x === tb); });
        corpo.querySelectorAll(":scope > .ipe-pane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== "iprproj"; });
        pintarProjecto();
      });
      // outro separador: o nosso painel esconde-se e o separador deixa de estar marcado (o Atlas trata do resto)
      bar.addEventListener("click", function (e) {
        var x = e.target.closest(".ipe-tab"); if (!x || x === tb) return;
        var P = pane(); if (P) P.hidden = true; tb.setAttribute("aria-selected", "false"); tb.classList.remove("on");
      }, true);
    }
    if (!pane()) {
      var p = D.createElement("div"); p.className = "ipe-pane"; p.setAttribute("data-pane", "iprproj"); p.hidden = true; corpo.appendChild(p);
      p.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pj]"); if (!b) return; e.preventDefault();
        var k = b.getAttribute("data-pj");
        if (k === "bases") abrirTab("proj");
        else if (k === "desenho") desenharBase();
        else if (k === "importar") tool("importar");
        else if (k === "org") abrirTab("org");
        else if (k === "cloud") abrirTab("cloud");
        else if (k === "sims" && W.IPR_SIM_HIST) W.IPR_SIM_HIST.abrir();
      });
    }
    pintarProjecto();
  }

  function tudo() {
    barra(); separador();
    if (D.getElementById("ipr-modos")) pintarAcc();
    if (!D.getElementById("ipr-modos-msg") && D.getElementById("ipr-modos")) { var m = D.createElement("div"); m.id = "ipr-modos-msg"; m.hidden = true; D.body.appendChild(m); }
  }
  W.IPR_MODOS = { modo: function () { return MODO; } };
  var ult = 0, pend = null;
  function rever() { var n = Date.now(); if (n - ult < 250) { if (!pend) pend = setTimeout(function () { pend = null; rever(); }, 250); return; } ult = n; try { tudo(); } catch (x) {} }
  new MutationObserver(rever).observe(D.documentElement, { childList: true, subtree: true });
  rever();
})();
