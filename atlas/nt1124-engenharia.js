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
    "#ipr-eng{margin:0 0 10px;color:var(--tx,#e9e6da);font:13px/1.45 Inter,system-ui,sans-serif}" +
    "#ipr-eng .eh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:2px 2px 6px}" +
    "#ipr-eng .eh b{font-weight:600;color:var(--ac2,#cfe3a0)}#ipr-eng .eh button,#ipr-eng .ev button{background:none;border:0;color:var(--ac,#94BE39);cursor:pointer;font:inherit;font-size:12px;padding:0;text-decoration:underline}" +
    "#ipr-eng .ef{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}#ipr-eng .ef button{border:1px solid var(--ln2,rgba(255,255,255,.16));background:var(--p3,rgba(255,255,255,.04));color:var(--tx,#e9e6da);border-radius:6px;padding:3px 8px;font:12px Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-eng .ef button[aria-pressed=true]{border-color:var(--ac,#94BE39);background:var(--acs,rgba(148,190,57,.18));font-weight:600}" +
    "#ipr-eng details{border-top:1px solid var(--ln,rgba(255,255,255,.08));padding:5px 0}#ipr-eng summary{cursor:pointer;font-weight:600;list-style:none;display:flex;align-items:center;gap:0;text-align:left}" +
    "#ipr-eng summary::-webkit-details-marker{display:none}#ipr-eng summary:before{content:'▸';margin-right:6px;color:var(--ac,#94BE39)}#ipr-eng details[open]>summary:before{content:'▾'}" +
    "#ipr-eng summary span.n{margin-left:auto;color:var(--ac,#94BE39);font-weight:600;font-size:12px}" +
    "#ipr-eng label{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:flex-start;margin:3px 0 3px 14px;cursor:pointer}#ipr-eng label>span{flex:1 1 0;min-width:0;overflow-wrap:anywhere}#ipr-eng label input{flex:none;margin-top:3px}#ipr-eng label.bl{opacity:.55;cursor:default}" +
    "#ipr-eng label small{flex:none;white-space:nowrap;color:var(--mu,#9a9e8a);margin-left:auto;font-size:11px;padding-top:2px}#ipr-eng .ev{color:var(--mu,#9a9e8a);font-size:12px;margin-top:8px}#ipr-eng .es{color:var(--mu,#9a9e8a);font-size:12px;margin:-2px 0 8px}" +
    "#ipr-eng-off{margin:0 0 8px;font:12px Inter,system-ui,sans-serif}#ipr-eng-off button{background:none;border:0;color:var(--ac,#94BE39);text-decoration:underline;cursor:pointer;font:inherit;padding:0}" +
    /* 26/11, 18h30: fora de Portugal o essencial mostra o grupo do país (#tfr, #tes, #teu, que já se escondem sozinhos
       quando o mapa sai desse país) e esconde os grupos portugueses. */
    "html.ipr-pais-ext #ipe-cam.ipr-eng-on>#tfr#tfr#tfr:not([hidden]),html.ipr-pais-ext #ipe-cam.ipr-eng-on>#tes#tes#tes:not([hidden]),html.ipr-pais-ext #ipe-cam.ipr-eng-on>#teu#teu#teu:not([hidden]){display:block!important}html.ipr-pais-ext #ipe-cam.ipr-eng-on>#ipr-expro#ipr-expro#ipr-expro,html.ipr-pais-ext #ipe-cam.ipr-eng-on>#ipr-pdmc#ipr-pdmc#ipr-pdmc{display:none!important}" +
    "#ipr-eng .eo{flex:0 0 100%;display:flex;align-items:center;gap:6px;margin:0 0 2px 22px;font-size:11px;color:var(--mu,#9a9e8a)}#ipr-eng .eo input{flex:1 1 auto;min-width:60px;max-width:150px;height:14px;accent-color:var(--ac,#94BE39)}#ipr-eng .eo b{font-weight:500;min-width:30px;text-align:right}";
  function nome(x) { return String((en() && x.en) || x.n || x.id); }
  // «i» em todas as camadas do essencial: o que é, fonte e licença (Nuno, 26/11/2026, 16h08: «Em todas as camadas de
  // informação tem que ter o i a dizer onde é que vem [...] inclusive no essencial»).
  function bi(i) { return '<button type="button" class="eng-i" data-eng-i="' + esc(i) + '" title="' + t("Sobre esta camada: o que é, fonte, licença", "About this layer: what it is, source, licence") + '" aria-label="' + t("Sobre esta camada", "About this layer") + '">i</button>'; }
  var IC = null, IA = "";
  function iFecha() { if (IC) IC.hidden = true; IA = ""; }
  function iAbre(b) {
    var id = b.getAttribute("data-eng-i"); if (IA === id && IC && !IC.hidden) { iFecha(); return; }
    var x = cat()[id]; if (!x) return;
    if (!IC) {
      IC = D.createElement("div"); IC.id = "ipr-eng-ii"; IC.hidden = true;
      IC.style.cssText = "position:fixed;z-index:9999;max-width:320px;background:#1b1c19;color:#f1ece4;border:1px solid rgba(181,211,52,.35);border-radius:10px;padding:12px 14px;font:13px/1.45 Geist,Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)";
      D.body.appendChild(IC);
      IC.addEventListener("click", function (e) { if (e.target.closest(".x")) iFecha(); });
    }
    var sub = String((en() && x.subEn) || x.sub || ""), fonte = String(x.fonte || ""), lic = x.lic === "r" ? "IPR Atlas Intelligence" : "Explorer";
    var leg = typeof x.leg === "string" && /^https?:\/\//.test(x.leg) ? x.leg : "";
    IC.innerHTML = '<button type="button" class="x" aria-label="' + t("Fechar", "Close") + '" style="float:right;background:none;border:0;color:inherit;font-size:16px;cursor:pointer">×</button>' +
      '<b style="display:block;margin:0 18px 6px 0;color:#fff">' + esc(nome(x)) + "</b>" +
      (sub ? '<div style="margin:0 0 6px;color:#cfd6bd">' + esc(sub) + "</div>" : "") +
      '<div style="color:#b5d334;font-size:12px">' + t("Fonte", "Source") + '</div><div style="margin:0 0 6px">' + esc(fonte || t("Fonte por indicar", "Source not stated")) + "</div>" +
      '<div style="color:#9a9e8a;font-size:12px">' + t("Disponível em", "Available in") + " " + esc(lic) + "</div>" +
      (leg ? '<img src="' + esc(leg) + '" alt="" style="display:block;max-width:100%;margin-top:8px;background:#fff;border-radius:4px">' : "");
    IC.hidden = false; IA = id;
    var r = b.getBoundingClientRect(), w = IC.offsetWidth, h = IC.offsetHeight, x0 = r.right + 10;
    if (x0 + w > innerWidth - 8) x0 = Math.max(8, r.left - w - 10);
    IC.style.left = x0 + "px"; IC.style.top = Math.max(8, Math.min(r.top - 8, innerHeight - h - 8)) + "px";
  }
  D.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("#ipr-eng .eng-i") : null;
    if (b) { e.preventDefault(); e.stopPropagation(); iAbre(b); return; }
    if (IC && !IC.hidden && !IC.contains(e.target)) iFecha();
  }, true);
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") iFecha(); });
  (function () { var st = D.createElement("style"); st.textContent = "#ipr-eng label{position:relative}#ipr-eng .eng-i{margin-left:auto;flex:0 0 18px;width:18px;height:18px;border-radius:50%;border:1px solid rgba(241,236,228,.45);background:transparent;color:#f1ece4;font:italic 600 11px/16px Georgia,serif;cursor:pointer;padding:0}#ipr-eng .eng-i:hover{border-color:#b5d334;color:#b5d334}"; D.head.appendChild(st); })();
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
    // Camadas da Base aberta (grupo «lidar» do catálogo): primeiro grupo, aberto. Nuno, 26/11/2026.
    var BX = Object.keys(C).filter(function (i) { return C[i].g === "lidar" && /^l_/.test(i); }), bxo = {}; BX.forEach(function (i) { bxo[i] = 1; });
    var ba0 = (W.__ipe && W.__ipe.estado && W.__ipe.estado.actual) || null;
    var temBase = !!(ba0 && (ba0.downloads || []).some(function (d) { return /\.(pmtiles|geojson)$/i.test((d && d.nome) || ""); }));
    if (!temBase) { BX = []; bxo = {}; }
    if (BX.length) {
      var ba = ba0 || {}, bn = String(ba.local || "").split(" · ")[0];
      var lgB = BX.filter(function (i) { return on[i]; }).length, abB = "base" in abertos ? abertos.base : true;
      h += '<details data-g="base"' + (abB ? " open" : "") + "><summary>" + esc(t("Esta Base", "This Base") + (bn ? " · " + bn : "")) + (lgB ? '<span class="n">' + lgB + "</span>" : "") + "</summary>";
      BX.forEach(function (i) {
        h += '<label><input type="checkbox" data-cam="' + esc(i) + '"' + (on[i] ? " checked" : "") + "> <span>" + esc(nome(C[i])) + "</span>" + bi(i);
        if (on[i]) { var o = opac(i); h += '<span class="eo" title="' + t("Transparência", "Transparency") + '">' + t("Opacidade", "Opacity") + ' <input type="range" min="0" max="100" step="5" value="' + o + '" data-op="' + esc(i) + '" aria-label="' + t("Opacidade de ", "Opacity of ") + esc(nome(C[i])) + '"><b>' + o + " %</b></span>"; }
        h += "</label>";
      });
      h += "</details>";
    }
    if (fora()) {
      h += '<div class="ev">' + t("Fora de Portugal: abaixo, as camadas oficiais deste país.", "Outside Portugal: below, this country's official layers.") + "</div>";
      if (!box) { box = D.createElement("div"); box.id = "ipr-eng"; var r0 = D.getElementById("ipr-pdmc"); cam.insertBefore(box, r0 ? r0.nextSibling : cam.firstChild); ouvir(box); }
      box.innerHTML = h; paisAbaixo(cam, box); return;
    }
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
      h += '<label' + (bl ? ' class="bl"' : "") + '><input type="checkbox" data-cam="' + esc(i) + '"' + (on[i] ? " checked" : "") + (bl ? " disabled" : "") + "> <span>" + esc(nome(x) + (LOC.nome ? " · " + LOC.nome : "")) + "</span>" + (bl ? "<small>Intelligence</small>" : "") + bi(i) + "</label>";
    });
    if (!LOC.nome) h += '<div class="es" style="margin:4px 0 0 14px">' + t("Aproxime o mapa a um concelho para ver o que há dele.", "Zoom in to a municipality to see what is available.") + "</div>";
    else if (LOC.np === 0) h += '<div class="es" style="margin:4px 0 0 14px">' + t("As plantas originais desta câmara ainda estão a ser copiadas. O ordenamento IPR já cobre o concelho.", "This municipality's original plans are still being copied. The IPR zoning already covers it.") + "</div>";
    h += "</details>";
    GRUPOS.forEach(function (g) {
      var ids = g[3].filter(function (i) { return C[i] && !bxo[i]; }); if (!ids.length) return;
      var lig = ids.filter(function (i) { return on[i]; }).length; n += ids.length;
      var ab = g[0] in abertos ? abertos[g[0]] : !!ABERTOS[g[0]];
      h += '<details data-g="' + g[0] + '"' + (ab ? " open" : "") + "><summary>" + esc(t(g[1], g[2])) + (lig ? '<span class="n">' + lig + "</span>" : "") + "</summary>";
      ids.forEach(function (i) {
        var x = C[i], bl = explorer() && x.lic === "r";
        h += '<label' + (bl ? ' class="bl" title="' + esc(t("IPR Atlas Intelligence", "IPR Atlas Intelligence")) + '"' : "") + '><input type="checkbox" data-cam="' + esc(i) + '"' + (on[i] ? " checked" : "") + (bl ? " disabled" : "") + "> <span>" + esc(nome(x)) + "</span>" + (bl ? "<small>Intelligence</small>" : "") + bi(i) + "</label>";
      });
      h += "</details>";
    });
    h += '<div class="ev">' + t("Fonte: Direção-Geral do Território (DGT), CC BY 4.0; também APA, ICNF e câmaras. Informação de apoio: prevalece o publicado em Diário da República.", "Source: Direção-Geral do Território (DGT), CC BY 4.0; also APA, ICNF and municipalities. Supporting information only.") + "</div>";
    if (!box) {
      box = D.createElement("div"); box.id = "ipr-eng";
      var ref2 = D.getElementById("ipr-pdmc"); cam.insertBefore(box, ref2 ? ref2.nextSibling : cam.firstChild);
      ouvir(box);
    }
    box.innerHTML = h;
  }
  function ouvir(box) {
      box.addEventListener("input", function (e) {
        var i = e.target.getAttribute && e.target.getAttribute("data-op"); if (!i) return;
        OP[i] = +e.target.value; guardarOp(); aplicarOp(i);
        var b = e.target.nextElementSibling; if (b) b.textContent = e.target.value + " %";
      });
      box.addEventListener("change", function (e) {
        if (e.target.hasAttribute("data-op")) return;
        if (e.target.hasAttribute("data-pdm")) {
          var P = pdm(); try { if (P) P.ligar(e.target.checked); } catch (er) {}
          var pd = D.getElementById("ipr-pdmc"); if (pd && e.target.checked) pd.open = true;
          setTimeout(pintar, 300); setTimeout(pintar, 2500); return;
        }
        var i = e.target.getAttribute("data-cam"); if (!i) return;
        var z = viz(); try { if (z) z.ligar(i, e.target.checked); } catch (er) {}
        setTimeout(pintar, 300); setTimeout(function () { aplicarOp(i); }, 400);
      });
  }
  // ---------- país (26/11/2026, 18h30) ----------
  // Nuno: «quando saio de Portugal [...] à esquerda as camadas automaticamente mudam de país». O m91589 marca o html com
  // ipr-pais-ext fora de Portugal; os grupos #tfr, #tes e #teu mostram-se só no seu país.
  function fora() { return D.documentElement.classList.contains("ipr-pais-ext"); }
  function paisAbaixo(cam, box) {
    ["tfr", "tes", "teu"].forEach(function (id) {
      var g = D.getElementById(id); if (!g || g.hidden) return;
      if (box.nextSibling !== g) cam.insertBefore(g, box.nextSibling);
      if (!g.__iprAberto) { g.__iprAberto = 1; g.classList.add("aberto"); if (g.tagName === "DETAILS") g.open = true; }
    });
  }
  // ---------- transparência das camadas da Base (26/11/2026, 18h29) ----------
  // Nuno: «todas as camadas da base cartográfica podem [...] ter um nível de transparência». Uma régua por camada ligada;
  // muda a opacidade das camadas do mapa com o prefixo iprv-<id>- e fica lembrada neste navegador (ipr_eng_op).
  var OP = {}; try { OP = JSON.parse(W.localStorage.getItem("ipr_eng_op") || "{}") || {}; } catch (e) { OP = {}; }
  function guardarOp() { try { W.localStorage.setItem("ipr_eng_op", JSON.stringify(OP)); } catch (e) {} }
  var PROP = { raster: ["raster-opacity"], line: ["line-opacity"], fill: ["fill-opacity"], circle: ["circle-opacity", "circle-stroke-opacity"], symbol: ["text-opacity", "icon-opacity"], hillshade: ["hillshade-exaggeration"] };
  function camadasDe(i) { var I = W.__ipe && W.__ipe.mapa; if (!I || !I.getStyle) return []; var p = "iprv-" + i + "-"; return ((I.getStyle() || {}).layers || []).filter(function (l) { return l.id.indexOf(p) === 0; }); }
  function opac(i) {
    if (OP[i] != null) return OP[i];
    var I = W.__ipe && W.__ipe.mapa, L = camadasDe(i)[0]; if (!I || !L || !PROP[L.type] || L.type === "hillshade") return 100;
    var v = I.getPaintProperty(L.id, PROP[L.type][0]); return typeof v === "number" ? Math.round(v * 100) : 100;
  }
  function aplicarOp(i) {
    if (OP[i] == null) return;
    var I = W.__ipe && W.__ipe.mapa; if (!I) return; var f = Math.max(0, Math.min(1, OP[i] / 100));
    camadasDe(i).forEach(function (L) {
      (PROP[L.type] || []).forEach(function (k) {
        if (k === "hillshade-exaggeration") return;
        try { if (I.getPaintProperty(L.id, k) !== f) I.setPaintProperty(L.id, k, f); } catch (e) {}
      });
    });
  }
  function aplicarTodas() { Object.keys(OP).forEach(aplicarOp); }
  // Camadas da Base à vista no mapa mas desligadas na lista (Nuno, 18h27: «tenho as curvas não seleccionadas, mas aparecem
  // no mapa»): o que está desligado esconde-se.
  function esconderDesligadas() {
    var I = W.__ipe && W.__ipe.mapa, C = cat(); if (!I || !I.getStyle) return;
    var A = {}; activas().forEach(function (i) { A[i] = 1; });
    Object.keys(C).forEach(function (i) {
      if (C[i].g !== "lidar" || !/^l_/.test(i) || A[i]) return;
      camadasDe(i).forEach(function (L) { try { if (I.getLayoutProperty(L.id, "visibility") !== "none") I.setLayoutProperty(L.id, "visibility", "none"); } catch (e) {} });
    });
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
      var k = activas().join(",") + (pdmOn() ? "|p" : "") + (fora() ? "|x" : ""); if (k !== ult) { ult = k; pintar(); setTimeout(aplicarTodas, 300); }
      aplicarTodas(); esconderDesligadas();
      if (fora()) paisAbaixo(D.getElementById("ipe-cam"), box);
    } catch (e) {}
  }, 1500);
  D.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#ipr-modos")) setTimeout(porAcc, 60); }, true);
  W.addEventListener("resize", function () { setTimeout(porAcc, 100); });
  W.__iprEngenharia = { ligar: function (v) { ON = !!v; guardar(); pintar(); }, pintar: pintar };
})();
