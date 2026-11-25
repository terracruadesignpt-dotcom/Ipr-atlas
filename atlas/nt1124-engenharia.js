/* IPR Atlas · Vista de engenharia (24/11/2026). Terracrua Design.
   Nuno, 13h35: «O Atlas continua a ter muita coisa [...] vamos simplificar. Um engenheiro entra neste Atlas, isto tem que
   estar atrativo para o engenheiro.»
   1. Painel das camadas: em vez da árvore de ~370 camadas, uma lista curta escolhida para engenharia (fundo, relevo LiDAR,
      propriedade, condicionantes e servidões, riscos, água, infra-estruturas, solo), em grupos recolhidos. A árvore completa
      continua a um clique («Ver todas as camadas»), e a escolha fica lembrada neste navegador. Nada é apagado nem desligado:
      as camadas ligam-se pelo próprio visualizador (window.__ipe.viz.ligar / fundo).
   2. Modos Analisar / Desenhar / Recolher (nt1117-modos.js): a barra das ferramentas de cada modo abria por trás da barra
      de cima (position fixed, top 58px) e não se via. Passa a abrir logo abaixo dos três botões.
   Desligar: ?engenharia=0 (tudo) ou ?vistaeng=0 (só a lista curta). */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]engenharia=0(&|$)/.test(location.search) || W.__iprEng) return; W.__iprEng = 1;
  var SEM_VISTA = /[?&]vistaeng=0(&|$)/.test(location.search);
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function viz() { return W.__ipe && W.__ipe.viz; }
  function cat() { var c = W.IPRViz && W.IPRViz.catalogo; var o = {}; (c || []).forEach(function (x) { if (x && x.id) o[x.id] = x; }); return o; }
  function explorer() { return W.IPR_NIVEL === "explorer"; }

  // ---------- 2. modos: barra das ferramentas abaixo dos botões ----------
  function porAcc() {
    var a = D.getElementById("ipr-modos-acc"), m = D.getElementById("ipr-modos");
    if (!a || !m || a.hidden || getComputedStyle(a).display === "none") return;
    var r = m.getBoundingClientRect(); if (!r.width) return;
    var top = Math.round(r.bottom + 6) + "px", left = Math.round(r.left) + "px";
    if (a.style.top !== top || a.style.left !== left) {
      a.style.setProperty("top", top, "important"); a.style.setProperty("left", left, "important");
      a.style.setProperty("transform", "none", "important"); a.style.setProperty("z-index", "2147480000", "important");
      a.style.setProperty("justify-content", "flex-start", "important");
    }
  }

  // ---------- 1. vista de engenharia ----------
  var FUNDOS = [["f_ortosat", "Ortofoto 2023", "Orthophoto 2023"], ["f_orto18", "Ortofoto 2018", "Orthophoto 2018"], ["f_mapa", "Mapa", "Map"], ["f_relevo", "Relevo", "Relief"]];
  var GRUPOS = [
    ["rel", "Relevo (LiDAR da DGT)", "Terrain (DGT LiDAR)", ["r_curvas", "r_somb", "r_hipso", "l_declives", "l_streams", "r_cotas", "r_cdgt"]],
    ["prop", "Propriedade e limites", "Property and boundaries", ["cad", "bupi", "caop", "concelhos"]],
    ["cond", "Condicionantes e servidões", "Constraints and easements", ["n2k", "rnap", "dph", "poc_area", "srup_rf", "srup_eaf", "srup_ic", "srup_mg", "srup_go", "srup_aa", "srup_dn", "srup_rg"]],
    ["risco", "Riscos", "Hazards", ["perig_s", "perig", "inund"]],
    ["agua", "Água", "Water", ["hidro", "bacias", "srup_casap", "srup_aapc"]],
    ["infra", "Infra-estruturas", "Infrastructure", ["o_estradas", "o_energia", "o_edif"]],
    ["solo", "Solo e ocupação", "Soil and land cover", ["cos23", "geo"]]
  ];
  var ABERTOS = { aqui: 1, rel: 1, cond: 1 };
  // camadas «deste sítio»: o concelho no centro do mapa (mesma rota CAOP do bloco do PDM; uma consulta por ~5 km, só com a lista à vista)
  var AQUI = ["ren", "ran", "crus"], LOC = { nome: "", k: "", dico: "", np: -1 }, LCACHE = {}, ltmp = null;
  function pdm() { return W.__iprPdmCamara || null; }
  function fmt(n) { n = String(n || ""); if (n !== n.toUpperCase()) return n; return n.toLowerCase().replace(/(^|[\s-])(\S)/g, function (a, b, x) { return b + x.toUpperCase(); }).replace(/ (De|Da|Do|Das|Dos|E) /g, function (a) { return a.toLowerCase(); }); }
  function pdmOn() { try { return !!(pdm() && pdm().estado().on); } catch (e) { return false; } }
  // 25/11 (Nuno, 12h30: «quando muda de concelho, o painel tem que actualizar e adaptar ao concelho e apresentar o que existe»):
  // o concelho vem da CAOP da DGT pela mesma procura do bloco do PDM (rápida e certa junto às fronteiras); a rota do site só
  // fica de recurso. Para cada concelho diz quantas plantas da câmara já estão copiadas.
  function local() {
    var I = W.__ipe && W.__ipe.mapa, box = D.getElementById("ipr-eng"); if (!I || !box || !box.offsetParent) return;
    if (I.getZoom() < 9) { if (LOC.nome) { LOC.nome = ""; LOC.k = ""; LOC.dico = ""; LOC.np = -1; pintar(); } return; }
    var c = I.getCenter(), k = (Math.round(c.lng * 50) / 50).toFixed(2) + "," + (Math.round(c.lat * 50) / 50).toFixed(2);
    if (k === LOC.k) return; LOC.k = k;
    function poe(n, dico) {
      n = fmt(n || "");
      if (n === LOC.nome && dico === LOC.dico) return;
      LOC.nome = n; LOC.dico = dico || ""; LOC.np = -1; pintar();
      var P = pdm(); if (P && P.plantasDe && LOC.dico) P.plantasDe(LOC.dico, function (np) { if (LOC.dico === dico) { LOC.np = np; pintar(); } });
    }
    if (LCACHE[k] !== undefined) { poe(LCACHE[k][0], LCACHE[k][1]); return; }
    var P = pdm();
    if (P && P.concelhoEm) { P.concelhoEm(c.lng, c.lat, function (r) { r = r || {}; if (r.nome) LCACHE[k] = [r.nome, r.dico || ""]; if (LOC.k === k) poe(r.nome, r.dico); }); return; }
    var d = 0.002, bb = [c.lng - d, c.lat - d, c.lng + d, c.lat + d].map(function (x) { return x.toFixed(5); }).join(",");
    fetch("/wp-json/tcd/v1/pedido-produto/caop?bbox=" + bb, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      var f = j && j.features && j.features[0], q = (f && f.properties) || {};
      var n = String(q.municipio || q.concelho || q.Concelho || q.Municipio || "");
      LCACHE[k] = [n, ""]; if (LOC.k === k) poe(n, "");
    }).catch(function () {});
  }
  var lpreso = false;
  function prenderLocal() { var I = W.__ipe && W.__ipe.mapa; if (!I || lpreso) return; lpreso = true; I.on("moveend", function () { clearTimeout(ltmp); ltmp = setTimeout(local, 800); }); setTimeout(local, 1200); }
  var ON; try { ON = W.localStorage.getItem("ipr_eng") !== "0"; } catch (e) { ON = true; }
  function guardar() { try { W.localStorage.setItem("ipr_eng", ON ? "1" : "0"); } catch (e) {} }
  var CSS = "#ipe-cam.ipr-eng-on>:not(#ipr-pdmc):not(#ipr-eng):not(#ipr-expro){display:none!important}#ipe-cam.ipr-eng-on:not(.ipr-pdm-on)>#ipr-pdmc{display:none!important}" +
    ".ipe-sb--cam:has(#ipe-cam.ipr-eng-on) .tme-todas{display:none!important}" +
    "#ipr-eng{margin:0 0 10px;color:#e9e6da;font:13px/1.45 Inter,system-ui,sans-serif}" +
    "#ipr-eng .eh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:2px 2px 6px}" +
    "#ipr-eng .eh b{font-weight:600;color:#cfe3a0}#ipr-eng .eh button,#ipr-eng .ev button{background:none;border:0;color:#94BE39;cursor:pointer;font:inherit;font-size:12px;padding:0;text-decoration:underline}" +
    "#ipr-eng .ef{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}#ipr-eng .ef button{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#e9e6da;border-radius:6px;padding:3px 8px;font:12px Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-eng .ef button[aria-pressed=true]{border-color:#94BE39;background:rgba(148,190,57,.18)}" +
    "#ipr-eng details{border-top:1px solid rgba(255,255,255,.08);padding:5px 0}#ipr-eng summary{cursor:pointer;font-weight:600;list-style:none;display:flex;align-items:center;gap:0;text-align:left}" +
    "#ipr-eng summary::-webkit-details-marker{display:none}#ipr-eng summary:before{content:'▸';margin-right:6px;color:#94BE39}#ipr-eng details[open]>summary:before{content:'▾'}" +
    "#ipr-eng summary span.n{margin-left:auto;color:#94BE39;font-weight:600;font-size:12px}" +
    "#ipr-eng label{display:flex;gap:8px;align-items:flex-start;margin:3px 0 3px 14px;cursor:pointer}#ipr-eng label.bl{opacity:.55;cursor:default}" +
    "#ipr-eng label small{color:#9a9e8a;margin-left:auto;font-size:11px}#ipr-eng .ev{color:#9a9e8a;font-size:12px;margin-top:8px}#ipr-eng .es{color:#9a9e8a;font-size:12px;margin:-2px 0 8px}" +
    "#ipr-eng-off{margin:0 0 8px;font:12px Inter,system-ui,sans-serif}#ipr-eng-off button{background:none;border:0;color:#94BE39;text-decoration:underline;cursor:pointer;font:inherit;padding:0}";
  function nome(x) { return String((en() && x.en) || x.n || x.id); }
  function activas() { var z = viz(); try { return z && z.activas ? z.activas() : []; } catch (e) { return []; } }
  function pintar() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return;
    var box = D.getElementById("ipr-eng"), off = D.getElementById("ipr-eng-off");
    cam.classList.toggle("ipr-eng-on", ON);
    if (!ON) {
      if (box) box.remove();
      if (!off) { off = D.createElement("div"); off.id = "ipr-eng-off"; var ref = D.getElementById("ipr-pdmc"); cam.insertBefore(off, ref ? ref.nextSibling : cam.firstChild); }
      off.innerHTML = '<button type="button" data-eng="on">' + t("Voltar ao essencial", "Back to the essentials") + "</button>";
      return;
    }
    if (off) off.remove();
    var C = cat(), A = activas(), on = {}; A.forEach(function (i) { on[i] = 1; });
    var abertos = {}; if (box) [].forEach.call(box.querySelectorAll("details[data-g]"), function (d) { abertos[d.getAttribute("data-g")] = d.open; });
    var total = Object.keys(C).length, n = 0;
    var curta = 0; GRUPOS.forEach(function (g) { curta += g[3].filter(function (i) { return C[i]; }).length; });
    var h = '<div class="eh"><b>' + t("O essencial", "The essentials") + '</b><button type="button" data-eng="off">' + t("Ver todas", "Show all") + (total ? " (" + total + ")" : "") + "</button></div>" +
      '<div class="es">' + t("Selecção técnica de " + curta + " camadas para projecto. O Atlas tem " + total + ".", "A technical selection of " + curta + " layers for design work. The Atlas has " + total + ".") + "</div>";
    h += '<div class="ef">' + FUNDOS.filter(function (f) { return C[f[0]]; }).map(function (f) {
      return '<button type="button" data-fundo="' + f[0] + '" aria-pressed="' + (on[f[0]] ? "true" : "false") + '">' + esc(t(f[1], f[2])) + "</button>"; }).join("") + "</div>";
    var aq = AQUI.filter(function (i) { return C[i]; }), pOn = pdmOn(), lgA = aq.filter(function (i) { return on[i]; }).length + (pOn ? 1 : 0);
    cam.classList.toggle("ipr-pdm-on", pOn);
    var abA = "aqui" in abertos ? abertos.aqui : true;
    h += '<details data-g="aqui"' + (abA ? " open" : "") + "><summary>" + esc(LOC.nome ? t("Neste concelho · ", "In this municipality · ") + LOC.nome : t("Neste concelho", "In this municipality")) + (lgA ? '<span class="n">' + lgA + "</span>" : "") + "</summary>";
    if (pdm()) {
      var npT = !LOC.nome ? "" : LOC.np > 0 ? t(LOC.np + " plantas", LOC.np + " plans") : LOC.np === 0 ? t("em cópia", "being copied") : "";
      h += '<label><input type="checkbox" data-pdm="1"' + (pOn ? " checked" : "") + (LOC.nome && LOC.np === 0 ? " disabled" : "") + "> <span>" + esc(LOC.nome ? t("Plantas originais do PDM de ", "Original PDM plans of ") + LOC.nome : t("Plantas originais do PDM da câmara", "Original municipal PDM plans")) + "</span>" + (npT ? "<small>" + esc(npT) + "</small>" : "") + "</label>";
    }
    aq.forEach(function (i) {
      var x = C[i], bl = explorer() && x.lic === "r";
      h += '<label' + (bl ? ' class="bl"' : "") + '><input type="checkbox" data-cam="' + esc(i) + '"' + (on[i] ? " checked" : "") + (bl ? " disabled" : "") + "> <span>" + esc(nome(x) + (LOC.nome ? " · " + LOC.nome : "")) + "</span>" + (bl ? "<small>Intelligence</small>" : "") + "</label>";
    });
    if (!LOC.nome) h += '<div class="es" style="margin:4px 0 0 14px">' + t("Aproxime o mapa a um concelho para ver o que há dele.", "Zoom in to a municipality to see what is available.") + "</div>";
    else if (LOC.np === 0) h += '<div class="es" style="margin:4px 0 0 14px">' + t("As plantas originais desta câmara ainda estão a ser copiadas. O ordenamento IPR já cobre o concelho.", "This municipality's original plans are still being copied. The IPR zoning already covers it.") + "</div>";
    h += "</details>";
    GRUPOS.forEach(function (g) {
      var ids = g[3].filter(function (i) { return C[i]; }); if (!ids.length) return;
      var lig = ids.filter(function (i) { return on[i]; }).length; n += ids.length;
      var ab = g[0] in abertos ? abertos[g[0]] : !!ABERTOS[g[0]];
      h += '<details data-g="' + g[0] + '"' + (ab ? " open" : "") + "><summary>" + esc(t(g[1], g[2])) + (lig ? '<span class="n">' + lig + "</span>" : "") + "</summary>";
      ids.forEach(function (i) {
        var x = C[i], bl = explorer() && x.lic === "r";
        h += '<label' + (bl ? ' class="bl" title="' + esc(t("IPR Atlas Intelligence", "IPR Atlas Intelligence")) + '"' : "") + '><input type="checkbox" data-cam="' + esc(i) + '"' + (on[i] ? " checked" : "") + (bl ? " disabled" : "") + "> <span>" + esc(nome(x)) + "</span>" + (bl ? "<small>Intelligence</small>" : "") + "</label>";
      });
      h += "</details>";
    });
    h += '<div class="ev">' + t("Fontes oficiais (DGT, APA, ICNF, câmaras). Informação de apoio: prevalece o publicado em Diário da República.", "Official sources (DGT, APA, ICNF, municipalities). Supporting information only.") + "</div>";
    if (!box) {
      box = D.createElement("div"); box.id = "ipr-eng";
      var ref2 = D.getElementById("ipr-pdmc"); cam.insertBefore(box, ref2 ? ref2.nextSibling : cam.firstChild);
      box.addEventListener("change", function (e) {
        if (e.target.hasAttribute("data-pdm")) {
          var P = pdm(); try { if (P) P.ligar(e.target.checked); } catch (er) {}
          var pd = D.getElementById("ipr-pdmc"); if (pd && e.target.checked) pd.open = true;
          setTimeout(pintar, 300); setTimeout(pintar, 2500); return;
        }
        var i = e.target.getAttribute("data-cam"); if (!i) return;
        var z = viz(); try { if (z) z.ligar(i, e.target.checked); } catch (er) {}
        setTimeout(pintar, 300);
      });
    }
    box.innerHTML = h;
  }
  D.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-eng],[data-fundo]"); if (!b || !b.closest("#ipe-cam")) return;
    e.preventDefault();
    if (b.hasAttribute("data-eng")) { ON = b.getAttribute("data-eng") === "on"; guardar(); pintar(); return; }
    var z = viz(); try { if (z && z.fundo) z.fundo(b.getAttribute("data-fundo")); } catch (er) {}
    setTimeout(pintar, 300);
  });
  function arrancar() {
    if (!D.getElementById("ipr-eng-css")) { var s = D.createElement("style"); s.id = "ipr-eng-css"; s.textContent = CSS; D.head.appendChild(s); }
    if (!SEM_VISTA && D.getElementById("ipe-cam") && viz() && W.IPRViz && W.IPRViz.catalogo) {
      var cam = D.getElementById("ipe-cam");
      if ((ON && !D.getElementById("ipr-eng")) || (!ON && !D.getElementById("ipr-eng-off")) || cam.classList.contains("ipr-eng-on") !== ON) pintar();
    }
    porAcc(); prenderLocal();
  }
  var ult = "";
  setInterval(function () {
    try {
      arrancar();
      // sincroniza as caixas com o que está ligado (só quando a lista está à vista)
      var box = D.getElementById("ipr-eng"); if (!box || !box.offsetParent) return;
      local();
      var k = activas().join(",") + (pdmOn() ? "|p" : ""); if (k !== ult) { ult = k; pintar(); }
    } catch (e) {}
  }, 1500);
  D.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#ipr-modos")) setTimeout(porAcc, 60); }, true);
  W.addEventListener("resize", function () { setTimeout(porAcc, 100); });
  W.__iprEngenharia = { ligar: function (v) { ON = !!v; guardar(); pintar(); }, pintar: pintar };
})();
