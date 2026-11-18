/* IPR Atlas · «Procurar zonas» (17/11/2026, ponto 12 da lista da manhã; documento «IPR Atlas e Cloud – Especificação», secção 1;
   decisão do Nuno de 17/11/2026: «no Atlas Explorer a entrada é Procurar zonas»; tema Biológico: «requisitos obrigatórios podem
   excluir zonas»).
   Percurso: tema → condições → manchas → ficha da mancha → pontos e oferta → propriedade. Passo X de 4 e botão «Voltar» sempre.
   Primeiro tema com dados: Agricultura biológica, sobre a malha de aptidão que o Atlas já tem (aptidao-bio.json, 10 critérios
   de 0 a 100, hexágonos de 3 km no continente e 1,2 km nas ilhas). Os outros temas do documento aparecem «em preparação».
   Cada critério pode ser ignorado, preferência (ordena) ou obrigatório (com limiar). Cada hexágono fica Cumpre, Fora do limite
   ou Por confirmar (sem dado). Um obrigatório falhado exclui; falta de dado deixa «Por confirmar». Hexágonos contíguos não
   excluídos formam manchas. A ficha mostra área total, avaliada, que cumpre, cobertura por critério, fontes e lacunas.
   Não muda nenhum ficheiro do Atlas; só acrescenta uma fonte e duas camadas próprias (ipr-pz) ao mapa enquanto está aberto.
   Desligar: ?zonas=0 ou tcd_m92453_off = 1. Terracrua Design. */
(function (W, D) {
  "use strict";
  if (W.__iprPZ) return; W.__iprPZ = true;
  if (/[?&]zonas=0\b/.test(location.search)) return;

  var BASE = "/wp-content/plugins/terracrua-nucleo/assets/atlas/";
  var CORES = ["#d5e3a4", "#a9cc6b", "#6fa83c", "#3f8f34", "#1f6b2a"];
  function lg() { var l = (W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2); return l === "en" ? "en" : l === "es" ? "es" : "pt"; }
  var TX = {
    pt: { nome: "Procurar zonas", passo: "Passo", de: "de", voltar: "Voltar", fechar: "Fechar", seguinte: "Ver manchas",
      t1: "O que procura?", t2: "As suas condições", t3: "Manchas encontradas", t4: "Ficha da mancha",
      prep: "em preparação", disp: "disponível", ign: "Ignorar", pref: "Preferência", obr: "Obrigatório", min: "pelo menos",
      onde: "Onde procurar", cont: "Portugal continental", acor: "Açores", mad: "Madeira", tudo: "Portugal (tudo)", vis: "Só a área visível do mapa",
      esp: "Espanha: este tema ainda não tem dados comparáveis para Espanha (lacuna registada).",
      nenhuma: "Nenhuma mancha com estas condições. Experimente baixar um limiar ou passar um critério a preferência.",
      cumpre: "Cumpre", fora: "Fora do limite", conf: "Por confirmar", area: "Área total", aval: "Área avaliada", ok: "Área que cumpre",
      poraval: "ficaram por avaliar", cob: "Critérios", fontes: "Fontes", lacunas: "Lacunas", ver: "Ver no mapa",
      pontos: "Ligar perímetros de rega públicos", oferta: "Oferta de terra: ainda sem anúncios de fontes autorizadas nesta zona. A classificação territorial mantém-se.",
      prop: "Escolher a propriedade nesta zona", propNota: "Aproxime e clique numa parcela do cadastro (ou desenhe o limite) para abrir a Ficha da propriedade.",
      det: "Critérios determinantes", hex: "hexágonos", media: "média", comDado: "com dado", passa: "cumpre",
      metodo: "Método: malha de aptidão IPR v1 (13/11/2026), critérios de 0 a 100; os limiares e pesos são seus e ainda estão por calibrar.",
      minp: "Pontuação mínima das preferências", minpN: "Só aparecem as zonas cuja média das preferências chega a este valor; suba para manchas mais pequenas e melhores.",
      ajuda: "Escolha um tema, diga o que é obrigatório e o que só conta como preferência, e o Atlas mostra as manchas que cumprem." },
    en: { nome: "Find areas", passo: "Step", de: "of", voltar: "Back", fechar: "Close", seguinte: "Show areas",
      t1: "What are you looking for?", t2: "Your conditions", t3: "Areas found", t4: "Area sheet",
      prep: "in preparation", disp: "available", ign: "Ignore", pref: "Preference", obr: "Required", min: "at least",
      onde: "Where to search", cont: "Mainland Portugal", acor: "Azores", mad: "Madeira", tudo: "Portugal (all)", vis: "Only the visible map area",
      esp: "Spain: this theme has no comparable data for Spain yet (gap recorded).",
      nenhuma: "No area meets these conditions. Try a lower threshold or turn a criterion into a preference.",
      cumpre: "Meets", fora: "Out of limit", conf: "To confirm", area: "Total area", aval: "Assessed area", ok: "Area that meets",
      poraval: "not assessed", cob: "Criteria", fontes: "Sources", lacunas: "Gaps", ver: "Show on map",
      pontos: "Turn on public irrigation schemes", oferta: "Land on offer: no listings from authorised sources in this area yet. The territorial classification stands.",
      prop: "Choose the property in this area", propNota: "Zoom in and click a cadastral parcel (or draw the boundary) to open the Property sheet.",
      det: "Deciding criteria", hex: "hexagons", media: "mean", comDado: "with data", passa: "meets",
      metodo: "Method: IPR suitability grid v1 (13/11/2026), criteria 0–100; thresholds and weights are yours and not yet calibrated.",
      minp: "Minimum preference score", minpN: "Only areas whose preference average reaches this value are shown; raise it for smaller, better areas.",
      ajuda: "Pick a theme, say what is required and what is only a preference, and the Atlas shows the areas that meet them." }
  };
  TX.es = Object.assign({}, TX.pt, { nome: "Buscar zonas", voltar: "Volver", fechar: "Cerrar", seguinte: "Ver manchas", t1: "¿Qué busca?",
    t2: "Sus condiciones", t3: "Manchas encontradas", t4: "Ficha de la mancha", prep: "en preparación", disp: "disponible",
    ign: "Ignorar", pref: "Preferencia", obr: "Obligatorio", min: "al menos", onde: "Dónde buscar", cumpre: "Cumple",
    fora: "Fuera del límite", conf: "Por confirmar" });
  function t(k) { return (TX[lg()] || TX.pt)[k] || TX.pt[k] || k; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function nf(x, d) { return Number(x).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 0 : d }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }

  var TEMAS = [
    { id: "bio", pt: "Agricultura biológica", en: "Organic farming", ok: 1 },
    { id: "campo", pt: "Mudar para o campo", en: "Move to the countryside" },
    { id: "produzir", pt: "Viver e produzir", en: "Live and produce" },
    { id: "comunidade", pt: "Viver perto de uma comunidade ou em grupo", en: "Live near a community or as a group" },
    { id: "quinta", pt: "Investir numa quinta ou recuperar um monte", en: "Invest in a farm or restore a homestead" },
    { id: "restauro", pt: "Restauro ecológico e capital natural", en: "Ecological restoration and natural capital" },
    { id: "bacias", pt: "Recuperar bacias hidrográficas", en: "Restore river basins" },
    { id: "pastoreio", pt: "Pastoreio extensivo", en: "Extensive grazing" }
  ];
  // Condições de partida (por calibrar, como diz o documento): solo e afastamento de pressões obrigatórios; o resto ordena.
  var PADRAO = { e1: ["o", 40], e3: ["o", 40], e2: ["p", 0], a1: ["p", 0], a2: ["p", 0], a3: ["p", 0], m1: ["p", 0], m2: ["p", 0], s1: ["p", 0], s2: ["p", 0] };

  var ST = { passo: 1, tema: "bio", cond: JSON.parse(JSON.stringify(PADRAO)), onde: "cont", min: 65, res: null, sel: null };
  var DADOS = null, A_CARREGAR = null;
  function dados() {
    if (DADOS) return Promise.resolve(DADOS);
    if (!A_CARREGAR) A_CARREGAR = fetch(BASE + "aptidao-bio.json", { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (d) { DADOS = d; return d; }).catch(function (e) { A_CARREGAR = null; throw e; });
    return A_CARREGAR;
  }

  // ───── cálculo ─────
  function avaliar(d) {
    var crit = d.criterios, pesos = d.pesos || [], M = mapa(), bb = null;
    if (ST.onde === "vis" && M) { var b = M.getBounds(); bb = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]; }
    var cel = [];
    d.h.forEach(function (r, i) {
      var reg = r[2];
      if (ST.onde === "cont" && reg !== "pt") return;
      if (ST.onde === "acor" && !/^az/.test(reg)) return;
      if (ST.onde === "mad" && reg !== "mad") return;
      if (bb && (r[0] < bb[0] || r[0] > bb[2] || r[1] < bb[1] || r[1] > bb[3])) return;
      var excl = false, falta = false, sp = 0, sw = 0, est = [];
      crit.forEach(function (c, k) {
        var cf = ST.cond[c[0]] || ["i", 0], v = r[6 + k];
        if (cf[0] === "i") { est.push("i"); return; }
        if (v == null || v < 0) { falta = true; est.push("c"); return; }
        if (cf[0] === "o" && v < cf[1]) { excl = true; est.push("f"); return; }
        est.push("ok");
        if (cf[0] === "p") { var w = pesos[k] || 1; sp += v * w; sw += w; }
      });
      if (excl) return;
      var pt = sw ? sp / sw : (falta ? null : 100);
      if (pt != null && pt < ST.min) return; // só as zonas com a pontuação mínima pedida (as preferências ordenam e filtram)
      cel.push({ i: i, r: r, est: est, falta: falta, pont: pt });
    });
    return manchas(d, cel);
  }
  function manchas(d, cel) {
    // vizinhança: centros a menos de 1,15 × √3 R (em km, pelos factores da região)
    var reg = d.regioes, chave = {}, i;
    function km(r) { var g = reg[r[2]] || reg.pt; return [r[0] / g.kx, r[1] / g.ky, g.s]; }
    cel.forEach(function (c, n) { var p = km(c.r); c.k = p; var gx = Math.floor(p[0] / 6), gy = Math.floor(p[1] / 6), kk = c.r[2] + ":" + gx + ":" + gy; (chave[kk] = chave[kk] || []).push(n); });
    var grupo = new Array(cel.length), ms = [];
    for (i = 0; i < cel.length; i++) {
      if (grupo[i] != null) continue;
      var m = { id: ms.length, cel: [] }, fila = [i]; grupo[i] = m.id;
      while (fila.length) {
        var n = fila.pop(), c = cel[n]; m.cel.push(c);
        var gx = Math.floor(c.k[0] / 6), gy = Math.floor(c.k[1] / 6), lim = 1.15 * Math.sqrt(3) * c.k[2];
        for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
          var l = chave[c.r[2] + ":" + (gx + dx) + ":" + (gy + dy)]; if (!l) continue;
          l.forEach(function (o) { if (grupo[o] != null) return; var e = cel[o]; if (Math.hypot(e.k[0] - c.k[0], e.k[1] - c.k[1]) <= lim) { grupo[o] = m.id; fila.push(o); } });
        }
      }
      ms.push(m);
    }
    ms.forEach(function (m) { resumo(d, m); });
    ms.sort(function (a, b) { return b.pont - a.pont || b.okHa - a.okHa; });
    return { cel: cel, ms: ms };
  }
  function haHex(r, d) { var s = (d.regioes[r[2]] || d.regioes.pt).s; return 1.5 * Math.sqrt(3) * s * s * 100; }
  function resumo(d, m) {
    var tot = 0, ok = 0, aval = 0, sp = 0, np = 0, conc = {}, bb = [180, 90, -180, -90];
    var cob = d.criterios.map(function () { return { n: 0, comDado: 0, passa: 0, soma: 0 }; });
    m.cel.forEach(function (c) {
      var a = haHex(c.r, d); tot += a; if (!c.falta) { aval += a; ok += a; }
      if (c.pont != null) { sp += c.pont; np++; }
      var nm = d.conc && d.conc[c.r[5]] ? d.conc[c.r[5]][0] : ""; if (nm) conc[nm] = (conc[nm] || 0) + 1;
      bb = [Math.min(bb[0], c.r[0]), Math.min(bb[1], c.r[1]), Math.max(bb[2], c.r[0]), Math.max(bb[3], c.r[1])];
      d.criterios.forEach(function (cr, k) {
        var v = c.r[6 + k]; cob[k].n++;
        if (v != null && v >= 0) { cob[k].comDado++; cob[k].soma += v; if (c.est[k] === "ok" || c.est[k] === "i") cob[k].passa++; }
      });
    });
    var nomes = Object.keys(conc).sort(function (a, b) { return conc[b] - conc[a]; });
    m.totHa = tot; m.okHa = ok; m.avalHa = aval; m.pont = np ? sp / np : 0; m.nomes = nomes; m.bb = bb; m.cob = cob;
  }

  // ───── mapa ─────
  var SID = "ipr-pz";
  function hexGeo(r, d) {
    var g = d.regioes[r[2]] || d.regioes.pt, R = g.s * 0.98, cs = [];
    for (var k = 0; k <= 6; k++) { var a = Math.PI / 3 * (k % 6); cs.push([r[0] + R * Math.cos(a) * g.kx, r[1] + R * Math.sin(a) * g.ky]); }
    return { type: "Polygon", coordinates: [cs] };
  }
  function classe(p) { if (p == null) return -1; return p >= 80 ? 4 : p >= 70 ? 3 : p >= 60 ? 2 : p >= 50 ? 1 : 0; }
  function desenhar() {
    var M = mapa(); if (!M || !M.getStyle) return;
    var fs = [];
    if (ST.res && DADOS) ST.res.ms.forEach(function (m) {
      m.cel.forEach(function (c) { fs.push({ type: "Feature", properties: { m: m.id, cl: c.falta ? -1 : classe(c.pont), s: ST.sel === m.id ? 1 : 0 }, geometry: hexGeo(c.r, DADOS) }); });
    });
    var fc = { type: "FeatureCollection", features: fs };
    try {
      if (M.getSource(SID)) M.getSource(SID).setData(fc);
      else {
        M.addSource(SID, { type: "geojson", data: fc });
        M.addLayer({ id: SID + "-f", type: "fill", source: SID, paint: {
          "fill-color": ["match", ["get", "cl"], -1, "#9e9e9e", 0, CORES[0], 1, CORES[1], 2, CORES[2], 3, CORES[3], CORES[4]],
          "fill-opacity": ["case", ["==", ["get", "s"], 1], 0.78, ["==", ["get", "cl"], -1], 0.3, 0.55] } });
        M.addLayer({ id: SID + "-l", type: "line", source: SID, filter: ["==", ["get", "s"], 1], paint: { "line-color": "#E3D49A", "line-width": 1.6 } });
        M.on("click", SID + "-f", function (e) { var f = e.features && e.features[0]; if (f) { ST.sel = f.properties.m; ST.passo = 4; pintar(); desenhar(); } });
        M.on("mouseenter", SID + "-f", function () { M.getCanvas().style.cursor = "pointer"; });
        M.on("mouseleave", SID + "-f", function () { M.getCanvas().style.cursor = ""; });
      }
      M.setLayoutProperty(SID + "-f", "visibility", fs.length ? "visible" : "none");
      M.setLayoutProperty(SID + "-l", "visibility", fs.length ? "visible" : "none");
    } catch (e) {}
  }
  function limparMapa() { var M = mapa(); try { if (M && M.getSource(SID)) M.getSource(SID).setData({ type: "FeatureCollection", features: [] }); } catch (e) {} }
  function enquadrar(bb) { var M = mapa(); if (!M) return; try { M.fitBounds([[bb[0] - 0.04, bb[1] - 0.04], [bb[2] + 0.04, bb[3] + 0.04]], { padding: 60, maxZoom: 12, duration: 900 }); } catch (e) {} }

  // ───── painel ─────
  function css() {
    if (D.getElementById("ipr-pz-css")) return;
    var s = D.createElement("style"); s.id = "ipr-pz-css";
    s.textContent = "#ipr-pz{position:fixed;z-index:100000;top:64px;left:12px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;background:#1d2316;color:#efeee6;border:1px solid rgba(227,212,154,.35);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:13px/1.45 Inter,Helvetica,Arial,sans-serif}" +
      "#ipr-pz .pz-cab{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.1);position:sticky;top:0;background:#1d2316}" +
      "#ipr-pz .pz-cab b{flex:1;font-size:14px}#ipr-pz button{font:inherit;color:inherit;cursor:pointer}" +
      "#ipr-pz .pz-x,#ipr-pz .pz-v{background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:3px 9px}" +
      "#ipr-pz .pz-prog{padding:8px 12px 0;font-size:11.5px;opacity:.8}#ipr-pz .pz-bar{height:4px;background:rgba(255,255,255,.12);border-radius:3px;margin-top:4px}#ipr-pz .pz-bar i{display:block;height:100%;background:#94be39;border-radius:3px}" +
      "#ipr-pz .pz-c{padding:10px 12px 14px}#ipr-pz h4{margin:4px 0 8px;font-size:13.5px}" +
      "#ipr-pz .pz-tema{display:flex;justify-content:space-between;width:100%;text-align:left;margin:0 0 6px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04)}" +
      "#ipr-pz .pz-tema[disabled]{opacity:.5;cursor:default}#ipr-pz .pz-tema small{opacity:.75}" +
      "#ipr-pz .pz-cr{border-top:1px solid rgba(255,255,255,.08);padding:7px 0}#ipr-pz .pz-cr label{display:block;font-weight:600}#ipr-pz .pz-cr small{display:block;opacity:.7;font-size:11px}" +
      "#ipr-pz select{font:inherit;background:#2a3220;color:inherit;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:2px 4px;margin-top:3px}" +
      "#ipr-pz input[type=range]{width:110px;vertical-align:middle}#ipr-pz .pz-go{width:100%;margin-top:10px;padding:8px;border-radius:8px;border:0;background:#94be39;color:#1d2316;font-weight:700}" +
      "#ipr-pz .pz-m{display:block;width:100%;text-align:left;margin:0 0 6px;padding:7px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04)}" +
      "#ipr-pz .pz-m i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}#ipr-pz .pz-n{opacity:.8;font-size:12px;margin:6px 0}" +
      "#ipr-pz table{width:100%;border-collapse:collapse;font-size:11.5px}#ipr-pz td,#ipr-pz th{padding:3px 2px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;vertical-align:top}" +
      "#ipr-pz .pz-k{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin:4px 0 8px}#ipr-pz .pz-a{display:block;width:100%;margin-top:6px;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:transparent}" +
      ".ipr-pz-btn{font:inherit;cursor:pointer;border-radius:8px;border:1px solid #94be39;background:rgba(148,190,57,.16);color:inherit;padding:5px 11px;font-weight:600;margin:0 6px;white-space:nowrap}" +
      "#ipr-exd-esq .ipr-pz-btn{display:block;width:calc(100% - 16px);margin:8px;padding:9px;text-align:left}";
    D.head.appendChild(s);
  }
  function abrir() { css(); ST.aberto = true; pintar(); }
  function fechar() { ST.aberto = false; var P = D.getElementById("ipr-pz"); if (P) P.remove(); limparMapa(); }
  function nomeTema(x) { return lg() === "en" ? x.en : x.pt; }
  function pintar() {
    if (!ST.aberto) return;
    var P = D.getElementById("ipr-pz");
    if (!P) {
      P = D.createElement("div"); P.id = "ipr-pz"; D.body.appendChild(P);
      ["mousedown", "pointerdown", "wheel", "keydown"].forEach(function (v) { P.addEventListener(v, function (e) { e.stopPropagation(); }); });
      P.addEventListener("click", clique); P.addEventListener("change", mudanca); P.addEventListener("input", mudanca);
    }
    var h = '<div class="pz-cab">' + (ST.passo > 1 ? '<button class="pz-v" data-a="voltar">‹ ' + esc(t("voltar")) + '</button>' : "") +
      "<b>" + esc(t("nome")) + '</b><button class="pz-x" data-a="fechar" aria-label="' + esc(t("fechar")) + '">×</button></div>' +
      '<div class="pz-prog">' + esc(t("passo")) + " " + ST.passo + " " + esc(t("de")) + ' 4<div class="pz-bar"><i style="width:' + ST.passo * 25 + '%"></i></div></div><div class="pz-c">';
    if (ST.passo === 1) {
      h += "<h4>" + esc(t("t1")) + '</h4><div class="pz-n">' + esc(t("ajuda")) + "</div>";
      TEMAS.forEach(function (x) { h += '<button class="pz-tema" data-a="tema" data-t="' + x.id + '"' + (x.ok ? "" : " disabled") + "><span>" + esc(nomeTema(x)) + "</span><small>" + esc(x.ok ? t("disp") : t("prep")) + "</small></button>"; });
    } else if (ST.passo === 2) {
      h += "<h4>" + esc(t("t2")) + "</h4>";
      if (!DADOS) { h += '<div class="pz-n">…</div>'; }
      else {
        DADOS.criterios.forEach(function (c) {
          var cf = ST.cond[c[0]] || ["i", 0];
          h += '<div class="pz-cr"><label>' + esc(c[1]) + "</label><small>" + esc(c[2]) + "</small>" +
            '<select data-c="' + c[0] + '" data-k="m"><option value="i"' + (cf[0] === "i" ? " selected" : "") + ">" + esc(t("ign")) + '</option><option value="p"' + (cf[0] === "p" ? " selected" : "") + ">" + esc(t("pref")) + '</option><option value="o"' + (cf[0] === "o" ? " selected" : "") + ">" + esc(t("obr")) + "</option></select>" +
            (cf[0] === "o" ? ' <span>' + esc(t("min")) + ' <input type="range" min="0" max="100" step="5" value="' + cf[1] + '" data-c="' + c[0] + '" data-k="v"> <b>' + cf[1] + "</b></span>" : "") + "</div>";
        });
        h += '<div class="pz-cr"><label>' + esc(t("minp")) + '</label><input type="range" min="0" max="90" step="5" value="' + ST.min + '" data-k="min"> <b>' + ST.min + '</b>/100<small>' + esc(t("minpN")) + '</small></div>';
        h += '<div class="pz-cr"><label>' + esc(t("onde")) + '</label><select data-k="onde">' + ["cont", "acor", "mad", "tudo", "vis"].map(function (o) { return '<option value="' + o + '"' + (ST.onde === o ? " selected" : "") + ">" + esc(t(o)) + "</option>"; }).join("") + '</select><small>' + esc(t("esp")) + "</small></div>";
        h += '<button class="pz-go" data-a="calcular">' + esc(t("seguinte")) + "</button>";
      }
    } else if (ST.passo === 3) {
      h += "<h4>" + esc(t("t3")) + "</h4>";
      var ms = ST.res ? ST.res.ms.filter(function (m) { return m.okHa > 0; }) : [];
      if (!ms.length) h += '<div class="pz-n">' + esc(t("nenhuma")) + "</div>";
      else {
        var tot = ms.reduce(function (a, m) { return a + m.okHa; }, 0);
        h += '<div class="pz-n">' + nf(ms.length) + " · " + nf(tot / 100) + " km² " + esc(t("passa").toLowerCase()) + "</div>";
        ms.slice(0, 15).forEach(function (m) {
          h += '<button class="pz-m" data-a="mancha" data-m="' + m.id + '"><i style="background:' + CORES[Math.max(0, classe(m.pont))] + '"></i><b>' + esc(m.nomes.slice(0, 2).join(", ") || "—") + "</b> · " + nf(m.okHa) + " ha · " + nf(m.pont) + "/100</button>";
        });
      }
      h += '<div class="pz-n">' + esc(t("oferta")) + '</div><div class="pz-n">' + esc(t("metodo")) + "</div>";
    } else if (ST.passo === 4) {
      var m = ST.res && ST.res.ms.filter(function (x) { return x.id === ST.sel; })[0];
      if (!m) { ST.passo = 3; return pintar(); }
      h += "<h4>" + esc(t("t4")) + " · " + esc(m.nomes.slice(0, 3).join(", ")) + "</h4>";
      var porAval = m.totHa - m.avalHa;
      h += '<div class="pz-k"><span>' + esc(t("area")) + "</span><b>" + nf(m.totHa) + " ha</b><span>" + esc(t("aval")) + "</span><b>" + nf(m.avalHa) + " ha</b><span>" + esc(t("ok")) + "</span><b>" + nf(m.okHa) + " ha</b></div>";
      if (porAval > 0) h += '<div class="pz-n">' + nf(porAval) + " ha " + esc(t("poraval")) + " (" + esc(t("conf")) + ").</div>";
      h += "<table><tr><th>" + esc(t("cob")) + "</th><th>" + esc(t("comDado")) + "</th><th>" + esc(t("media")) + "</th><th>" + esc(t("passa")) + "</th></tr>";
      var lac = [], det = [];
      DADOS.criterios.forEach(function (c, k) {
        var cf = ST.cond[c[0]] || ["i", 0]; if (cf[0] === "i") return;
        var q = m.cob[k], med = q.comDado ? q.soma / q.comDado : null;
        h += "<tr><td>" + esc(c[1]) + (cf[0] === "o" ? " <small>(" + esc(t("obr").toLowerCase()) + " ≥ " + cf[1] + ")</small>" : "") + "</td><td>" + nf(100 * q.comDado / q.n) + " %</td><td>" + (med == null ? "—" : nf(med)) + "</td><td>" + (q.comDado ? nf(100 * q.passa / q.comDado) + " %" : "—") + "</td></tr>";
        if (q.comDado < q.n) lac.push(c[1] + ": " + nf(100 - 100 * q.comDado / q.n) + " % " + t("conf").toLowerCase());
        if (med != null) det.push([cf[0] === "o" ? med - cf[1] : -med, c[1], med]);
      });
      h += "</table>";
      det.sort(function (a, b) { return a[0] - b[0]; });
      h += '<div class="pz-n"><b>' + esc(t("det")) + ":</b> " + esc(det.slice(0, 3).map(function (x) { return x[1] + " (" + nf(x[2]) + ")"; }).join("; ")) + "</div>";
      h += '<div class="pz-n"><b>' + esc(t("fontes")) + ":</b> " + esc(DADOS.criterios.filter(function (c) { return (ST.cond[c[0]] || ["i"])[0] !== "i"; }).map(function (c) { return c[2]; }).join(" · ")) + "</div>";
      h += '<div class="pz-n"><b>' + esc(t("lacunas")) + ":</b> " + esc(lac.length ? lac.join("; ") : "—") + " " + esc(t("esp")) + "</div>";
      h += '<div class="pz-n">' + esc(t("oferta")) + "</div>";
      h += '<button class="pz-a" data-a="ver">' + esc(t("ver")) + "</button>";
      if (W.__iprAptidao && typeof W.__iprAptidao.regadio === "function") h += '<button class="pz-a" data-a="rega">' + esc(t("pontos")) + "</button>";
      h += '<button class="pz-go" data-a="prop">' + esc(t("prop")) + '</button><div class="pz-n">' + esc(t("propNota")) + "</div>";
    }
    h += "</div>";
    if (P.__h !== h) { P.innerHTML = h; P.__h = h; }
  }
  function clique(e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.getAttribute("data-a");
    if (a === "fechar") return fechar();
    if (a === "voltar") { ST.passo = Math.max(1, ST.passo - 1); if (ST.passo < 4) ST.sel = null; pintar(); desenhar(); return; }
    if (a === "tema") { ST.tema = b.getAttribute("data-t"); ST.passo = 2; pintar(); dados().then(pintar, function () { var P = D.getElementById("ipr-pz"); if (P) P.querySelector(".pz-c").innerHTML = '<div class="pz-n">Não foi possível carregar os dados do tema.</div>'; }); return; }
    if (a === "calcular") { dados().then(function (d) { ST.res = avaliar(d); ST.passo = 3; ST.sel = null; pintar(); desenhar(); var ms = ST.res.ms.filter(function (m) { return m.okHa > 0; }); if (ms.length && ST.onde !== "vis") { var bb = [180, 90, -180, -90]; ms.slice(0, 15).forEach(function (m) { bb = [Math.min(bb[0], m.bb[0]), Math.min(bb[1], m.bb[1]), Math.max(bb[2], m.bb[2]), Math.max(bb[3], m.bb[3])]; }); enquadrar(bb); } }); return; }
    if (a === "mancha") { ST.sel = +b.getAttribute("data-m"); ST.passo = 4; pintar(); desenhar(); var m = ST.res.ms.filter(function (x) { return x.id === ST.sel; })[0]; if (m) enquadrar(m.bb); return; }
    if (a === "ver") { var m2 = ST.res.ms.filter(function (x) { return x.id === ST.sel; })[0]; if (m2) enquadrar(m2.bb); return; }
    if (a === "rega") { try { W.__iprAptidao.regadio(true); } catch (x) {} return; }
    if (a === "prop") { var m3 = ST.res.ms.filter(function (x) { return x.id === ST.sel; })[0]; var M = mapa(); if (m3 && M) { try { M.flyTo({ center: [(m3.bb[0] + m3.bb[2]) / 2, (m3.bb[1] + m3.bb[3]) / 2], zoom: Math.max(M.getZoom(), 13.5), duration: 1000 }); } catch (x) {} } var P = D.getElementById("ipr-pz"); if (P) P.style.opacity = ".92"; return; }
  }
  function mudanca(e) {
    var el = e.target, k = el.getAttribute("data-k"), c = el.getAttribute("data-c");
    if (k === "m") { var v = el.value; ST.cond[c] = [v, v === "o" ? (ST.cond[c] && ST.cond[c][1]) || 40 : 0]; pintar(); }
    else if (k === "v") { ST.cond[c][1] = +el.value; var bl = el.nextElementSibling; if (bl) bl.textContent = el.value; }
    else if (k === "onde") { ST.onde = el.value; }
    else if (k === "min") { ST.min = +el.value; var bm = el.nextElementSibling; if (bm) bm.textContent = el.value; }
  }

  // ───── botões de entrada ─────
  function botoes() {
    css();
    var esq = D.getElementById("ipr-exd-esq");
    if (esq && !esq.querySelector(".ipr-pz-btn")) {
      var b = D.createElement("button"); b.type = "button"; b.className = "ipr-pz-btn"; b.textContent = "⌕ " + t("nome");
      b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); ST.passo = 1; abrir(); });
      esq.insertBefore(b, esq.firstChild);
    }
    var q = D.getElementById("ipe-q");
    if (q && !D.getElementById("ipr-pz-top")) {
      var b2 = D.createElement("button"); b2.type = "button"; b2.id = "ipr-pz-top"; b2.className = "ipr-pz-btn"; b2.textContent = t("nome");
      b2.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); ST.passo = 1; abrir(); });
      var alvo = q.parentElement && q.parentElement !== D.body ? q.parentElement : q;
      alvo.insertAdjacentElement("afterend", b2);
    }
    // 18/11/2026 (Miguel: «bugs»): dentro da caixa da pesquisa, o botão e os modos dobravam-lhe a altura, a pesquisa saía
    // por cima e os botões tapavam a fila dos temas. Ficam na fila dos temas (#tb-bar), antes de «Temas».
    var bar = D.getElementById("tb-bar"), th = bar && bar.querySelector(".tb-h");
    if (th) {
      ["ipr-pz-top", "ipr-modos"].forEach(function (id) {
        var el = D.getElementById(id);
        if (el && el.parentElement !== bar) bar.insertBefore(el, th);
      });
      if (!D.getElementById("ipr-pz-bar-css")) {
        var c = D.createElement("style"); c.id = "ipr-pz-bar-css";
        c.textContent = "#tb-bar #ipr-pz-top,#tb-bar #ipr-modos{flex:0 0 auto;align-self:center}#tb-bar #ipr-pz-top{margin:0 4px 0 6px}";
        D.head.appendChild(c);
      }
    }
  }
  W.IPR_PROCURAR_ZONAS = { abrir: abrir, fechar: fechar, estado: ST };
  var ult = 0, pend = null;
  function rever() { var n = Date.now(); if (n - ult < 250) { if (!pend) pend = setTimeout(function () { pend = null; rever(); }, 250); return; } ult = n; botoes(); }
  new MutationObserver(rever).observe(D.documentElement, { childList: true, subtree: true });
  rever();
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && ST.aberto && ST.passo === 1) fechar(); });
  var M0 = null; setInterval(function () { var M = mapa(); if (M && M !== M0) { M0 = M; M.on("styledata", function () { if (ST.aberto && ST.res && !M.getSource(SID)) desenhar(); }); } }, 1000);
})(window, document);
