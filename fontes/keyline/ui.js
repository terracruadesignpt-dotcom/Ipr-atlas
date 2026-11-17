/* IPR Atlas · Motor keyline (fase 2, desenho assistido, em teste). Pedido do Nuno, 17/11/2026: «Publica já».
   Só aparece a quem tem a funcionalidade «keyline» (m90503, tcd_func_pode: administradores e convidados) e uma Base aberta.
   Tudo corre no navegador, num Web Worker: o MDT vem dos mosaicos Mapterhorn (LiDAR DGT, CC BY 4.0) que o Atlas já usa
   para o relevo, recortado à caixa da Base com margem. O motor (iprKeylineMotor) devolve vales, cumeadas, keypoints,
   keyline-mestre e paralelas; o painel desenha-os no mapa, regista cada proposta e a opinião de quem testou no m90800
   (POST tcd/v1/keyline/ensaio e /ensaio/opiniao) e deixa descarregar o desenho em GeoJSON.
   Não mexe em nenhum ficheiro existente. Carregado pelo m92020. Desligar: tcd_m92020_off = 1. Terracrua Design. */
(function (W, D) {
  "use strict";
  if (W.__iprKeyline) return; W.__iprKeyline = 1;
  var CFG = W.IPR_KL_CFG || {};
  var VERSAO = "keyline-0.2 (17/11/2026)";
  var TILE = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp", TS = 512, MAXCEL = 1400000;
  var TX = {
    pt: {
      botao: "Keyline", tit: "Keyline", teste: "em teste", fechar: "Fechar", semBase: "Abra uma Base no Atlas para propor o desenho keyline sobre o terreno.",
      base: "Terreno", esp: "Espaçamento entre linhas", desc: "Descida da keyline (do vale para as cumeadas)", vale: "Vales a partir de", suav: "Suavização do relevo",
      ha: "ha drenados", propor: "Propor keyline", outra: "Propor de novo", aCarregar: "A carregar o relevo…", aCalcular: "A calcular vales, cumeadas e keypoints…",
      falhou: "Não foi possível calcular: ", semKp: "Não encontrei keypoints neste terreno com estes valores. Experimente vales a partir de uma área menor ou menos suavização.",
      area: "Área", celula: "Resolução do MDT", cotas: "Cotas", decl: "Declive médio", vales: "Vales", cumeadas: "Cumeadas", kps: "Keypoints",
      mestre: "Keyline-mestre (no terreno)", parals: "Paralelas", tempo: "Cálculo", principal: "Keypoint da keyline-mestre", bacia: "bacia",
      ver: "Mostrar no mapa", vVales: "vales", vCum: "cumeadas", vPar: "paralelas", vOutras: "outras keylines",
      geojson: "Descarregar GeoJSON", limpar: "Limpar do mapa",
      registado: "Proposta registada para afinar o modelo.", naoReg: "Proposta não registada (só se registam as propostas em Bases encomendadas).",
      op: "Isto bate certo com o que conhece do terreno?", certo: "Bate certo", parcial: "Em parte", errado: "Não bate certo",
      ver2: "O que fez com a proposta", aceite: "Aceitei", corrigido: "Corrigi", recusado: "Recusei", texto: "O que está bem ou mal (opcional)",
      correcao: "Desenho corrigido em GeoJSON (linhas e pontos, opcional)", enviar: "Enviar opinião", obrigado: "Obrigado. A opinião ficou registada.",
      escolha: "Escolha se bate certo e o que fez com a proposta.", corrErr: "O ficheiro tem de ser um GeoJSON de linhas ou pontos.",
      aviso: "Desenho assistido, em teste: ajuda a ler a estrutura hidrológica do terreno. Não é dimensionamento nem localização definitiva de valas, caminhos ou charcas; confirme sempre no terreno.",
      fonte: "Relevo: Mapterhorn (LiDAR DGT, CC BY 4.0). Método: priority-flood, acumulação D8, quebra de declive nos perfis dos vales, linha de descida constante e paralelas equidistantes.",
      m: "m", pc: "%"
    },
    en: {
      botao: "Keyline", tit: "Keyline", teste: "in testing", fechar: "Close", semBase: "Open a Base in the Atlas to propose a keyline design on the land.",
      base: "Land", esp: "Spacing between lines", desc: "Keyline fall (from valley to ridges)", vale: "Valleys from", suav: "Relief smoothing",
      ha: "ha drained", propor: "Propose keyline", outra: "Propose again", aCarregar: "Loading relief…", aCalcular: "Computing valleys, ridges and keypoints…",
      falhou: "Could not compute: ", semKp: "No keypoints found on this land with these values. Try valleys from a smaller area or less smoothing.",
      area: "Area", celula: "DTM resolution", cotas: "Elevations", decl: "Mean slope", vales: "Valleys", cumeadas: "Ridges", kps: "Keypoints",
      mestre: "Master keyline (on the land)", parals: "Parallels", tempo: "Computation", principal: "Keypoint of the master keyline", bacia: "catchment",
      ver: "Show on the map", vVales: "valleys", vCum: "ridges", vPar: "parallels", vOutras: "other keylines",
      geojson: "Download GeoJSON", limpar: "Clear from map",
      registado: "Proposal recorded to improve the model.", naoReg: "Proposal not recorded (only proposals on ordered Bases are recorded).",
      op: "Does this match what you know of the land?", certo: "It matches", parcial: "Partly", errado: "It does not match",
      ver2: "What you did with the proposal", aceite: "Accepted", corrigido: "Corrected", recusado: "Rejected", texto: "What is right or wrong (optional)",
      correcao: "Corrected design as GeoJSON (lines and points, optional)", enviar: "Send feedback", obrigado: "Thank you. Your feedback was recorded.",
      escolha: "Choose whether it matches and what you did with the proposal.", corrErr: "The file must be a GeoJSON of lines or points.",
      aviso: "Assisted design, in testing: it helps read the land's hydrological structure. It is not sizing nor the final location of swales, roads or ponds; always check on the ground.",
      fonte: "Relief: Mapterhorn (DGT LiDAR, CC BY 4.0). Method: priority-flood, D8 accumulation, slope break on valley profiles, constant-fall line and equidistant parallels.",
      m: "m", pc: "%"
    }
  };
  function L() { var l = String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2); return l === "en" ? "en" : "pt"; }
  function t(k) { return TX[L()][k] || TX.pt[k] || k; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nf(x, d) { return Number(x).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 1 : d }); }
  function ipe() { return W.__ipe || {}; }
  function mapa() { return ipe().mapa || null; }
  function actual() { var e = ipe().estado; return e && e.actual; }
  function pode() { var f = W.IPR_FUNC && W.IPR_FUNC.keyline; return !!(CFG.admin || (f && f.acesso)); }
  if (!pode()) return;

  /*__MOTOR__*/

  // ───────── geometria da Base ─────────
  function baseFeicoes() {
    var a = actual(); if (!a || !a.geojson) return null;
    var g = a.geojson; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { return null; } }
    var fs = g.type === "FeatureCollection" ? g.features : g.type === "Feature" ? [g] : [{ type: "Feature", geometry: g, properties: {} }];
    fs = (fs || []).filter(function (f) { return f && f.geometry && /Polygon/.test(f.geometry.type); });
    return fs.length ? fs : null;
  }
  function aneis(fs) { var r = []; fs.forEach(function (f) { var g = f.geometry; (g.type === "Polygon" ? [g.coordinates] : g.coordinates).forEach(function (p) { p.forEach(function (a) { r.push(a); }); }); }); return r; }

  // Web Mercator em píxeis do mundo (mosaicos de 512)
  function WS(z) { return TS * Math.pow(2, z); }
  function lx(lon, z) { return (lon + 180) / 360 * WS(z); }
  function ly(lat, z) { var s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WS(z); }
  function ilon(px, z) { return px / WS(z) * 360 - 180; }
  function ilat(py, z) { var n = Math.PI - 2 * Math.PI * py / WS(z); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }

  // ───────── relevo ─────────
  var CACHE = null; // {chave, z, ox, oy, Wd, Hd, cell, dem, mask}
  function prepararGrelha(fs) {
    var rr = aneis(fs), lo0 = 180, lo1 = -180, la0 = 90, la1 = -90;
    rr.forEach(function (a) { a.forEach(function (c) { lo0 = Math.min(lo0, c[0]); lo1 = Math.max(lo1, c[0]); la0 = Math.min(la0, c[1]); la1 = Math.max(la1, c[1]); }); });
    var latc = (la0 + la1) / 2, z, x0, x1, y0, y1, cell, Wd, Hd;
    for (z = 16; z >= 12; z--) {
      cell = 40075016.686 * Math.cos(latc * Math.PI / 180) / WS(z);
      var marg = Math.max(80, 0.25 * Math.max((lx(lo1, z) - lx(lo0, z)), (ly(la0, z) - ly(la1, z))) * cell) / cell;
      x0 = Math.floor(lx(lo0, z) - marg); x1 = Math.ceil(lx(lo1, z) + marg); y0 = Math.floor(ly(la1, z) - marg); y1 = Math.ceil(ly(la0, z) + marg);
      Wd = x1 - x0; Hd = y1 - y0;
      if (Wd * Hd <= MAXCEL) break;
    }
    if (Wd * Hd > MAXCEL * 1.6) throw new Error(L() === "en" ? "the land is too large for this test version" : "o terreno é grande demais para esta versão de teste");
    // máscara do terreno
    var cv = D.createElement("canvas"); cv.width = Wd; cv.height = Hd; var cx = cv.getContext("2d");
    cx.fillStyle = "#fff"; cx.beginPath();
    rr.forEach(function (a) { a.forEach(function (c, i) { var px = lx(c[0], z) - x0, py = ly(c[1], z) - y0; if (i) cx.lineTo(px, py); else cx.moveTo(px, py); }); cx.closePath(); });
    cx.fill("evenodd");
    var md = cx.getImageData(0, 0, Wd, Hd).data, mask = new Uint8Array(Wd * Hd);
    for (var i = 0; i < mask.length; i++) mask[i] = md[i * 4 + 3] > 127 ? 1 : 0;
    return { z: z, ox: x0, oy: y0, Wd: Wd, Hd: Hd, cell: cell, mask: mask };
  }
  function carregarMDT(G) {
    var tx0 = Math.floor(G.ox / TS), tx1 = Math.floor((G.ox + G.Wd - 1) / TS), ty0 = Math.floor(G.oy / TS), ty1 = Math.floor((G.oy + G.Hd - 1) / TS);
    var dem = new Float32Array(G.Wd * G.Hd), tarefas = [];
    for (var tx = tx0; tx <= tx1; tx++) for (var ty = ty0; ty <= ty1; ty++) tarefas.push([tx, ty]);
    var cv = D.createElement("canvas"); cv.width = TS; cv.height = TS; var cx = cv.getContext("2d", { willReadFrequently: true });
    function um(tt) {
      var url = TILE.replace("{z}", G.z).replace("{x}", tt[0]).replace("{y}", tt[1]);
      return fetch(url, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("MDT " + r.status); return r.blob(); })
        .then(function (b) { return createImageBitmap(b); })
        .then(function (im) {
          cx.clearRect(0, 0, TS, TS); cx.drawImage(im, 0, 0, TS, TS); var d = cx.getImageData(0, 0, TS, TS).data;
          var bx = tt[0] * TS - G.ox, by = tt[1] * TS - G.oy;
          for (var y = Math.max(0, -by); y < TS && by + y < G.Hd; y++) for (var x = Math.max(0, -bx); x < TS && bx + x < G.Wd; x++) {
            var k = (y * TS + x) * 4; dem[(by + y) * G.Wd + bx + x] = d[k] * 256 + d[k + 1] + d[k + 2] / 256 - 32768;
          }
        });
    }
    var i = 0;
    function proximo() { if (i >= tarefas.length) return Promise.resolve(); var tt = tarefas[i++]; return um(tt).then(proximo); }
    return Promise.all([proximo(), proximo(), proximo(), proximo()]).then(function () { G.dem = dem; return G; });
  }

  // ───────── worker ─────────
  var WK = null;
  function correrMotor(G, params) {
    return new Promise(function (ok, ko) {
      try {
        if (!WK) {
          var src = "var iprKeylineMotor=" + iprKeylineMotor.toString() + ";\nself.onmessage=function(e){try{self.postMessage({ok:true,r:iprKeylineMotor(e.data)});}catch(x){self.postMessage({ok:false,erro:String(x&&x.message||x)});}};";
          WK = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
        }
        WK.onmessage = function (e) { if (e.data && e.data.ok) ok(e.data.r); else ko(new Error(e.data && e.data.erro || "motor")); };
        WK.onerror = function (e) { ko(new Error(e.message || "worker")); };
        WK.postMessage({ W: G.Wd, H: G.Hd, cell: G.cell, dem: G.dem, mask: G.mask, params: params });
      } catch (x) { // sem Worker: corre aqui mesmo
        try { ok(iprKeylineMotor({ W: G.Wd, H: G.Hd, cell: G.cell, dem: G.dem, mask: G.mask, params: params })); } catch (y) { ko(y); }
      }
    });
  }

  // ───────── resultado → GeoJSON ─────────
  function ll(G, p) { return [+ilon(G.ox + p[0] + 0.5, G.z).toFixed(7), +ilat(G.oy + p[1] + 0.5, G.z).toFixed(7)]; }
  function paraGeo(G, r) {
    var fs = [];
    r.vales.forEach(function (l) { fs.push({ type: "Feature", properties: { tipo: "vale" }, geometry: { type: "LineString", coordinates: l.map(function (p) { return ll(G, p); }) } }); });
    r.cumeadas.forEach(function (l) { fs.push({ type: "Feature", properties: { tipo: "cumeada" }, geometry: { type: "LineString", coordinates: l.map(function (p) { return ll(G, p); }) } }); });
    r.paralelas.forEach(function (p) { fs.push({ type: "Feature", properties: { tipo: "paralela", ordem: p.ordem, espacamento_m: R.params.espac }, geometry: { type: "LineString", coordinates: p.linha.map(function (q) { return ll(G, q); }) } }); });
    r.mestres.forEach(function (m) { m.troços.forEach(function (tr) { fs.push({ type: "Feature", properties: { tipo: m.primaria ? "mestre" : "mestre2", keypoint: m.kp + 1, descida_pct: R.params.grade * 100 }, geometry: { type: "LineString", coordinates: tr.map(function (q) { return ll(G, q); }) } }); }); });
    r.keypoints.forEach(function (k, i) { fs.push({ type: "Feature", properties: { tipo: "keypoint", n: i + 1, cota: k.z, bacia_ha: k.bacia_ha, declive_acima_pct: k.decl_cima_pct, declive_abaixo_pct: k.decl_baixo_pct, primario: i === R.params.primario }, geometry: { type: "Point", coordinates: ll(G, [k.x, k.y]) } }); });
    return { type: "FeatureCollection", features: fs };
  }

  // ───────── mapa ─────────
  var SRC = "ipr-kl", CAM = [
    { id: "ipr-kl-cum", tipo: "cumeada", p: { "line-color": "#a0642a", "line-width": 1.6, "line-dasharray": [2, 1.5] } },
    { id: "ipr-kl-vale", tipo: "vale", p: { "line-color": "#2f74d0", "line-width": 2 } },
    { id: "ipr-kl-par", tipo: "paralela", p: { "line-color": "#3e9b4f", "line-width": 1.2, "line-opacity": 0.9 } },
    { id: "ipr-kl-m2", tipo: "mestre2", p: { "line-color": "#f2a23a", "line-width": 2.5, "line-dasharray": [3, 1.5] } },
    { id: "ipr-kl-m", tipo: "mestre", p: { "line-color": "#e0402a", "line-width": 3.6 } }
  ];
  var VIS = { vale: true, cumeada: true, paralela: true, mestre2: true };
  function desenhar() {
    var M = mapa(); if (!M || !R || !R.geo) return;
    try {
      if (!M.isStyleLoaded || M.isStyleLoaded() !== false) {}
      var s = M.getSource(SRC); if (s) s.setData(R.geo); else M.addSource(SRC, { type: "geojson", data: R.geo });
      CAM.forEach(function (c) {
        if (!M.getLayer(c.id)) M.addLayer({ id: c.id, type: "line", source: SRC, filter: ["==", ["get", "tipo"], c.tipo], layout: { "line-cap": "round", "line-join": "round" }, paint: c.p });
        M.setLayoutProperty(c.id, "visibility", c.tipo === "mestre" || VIS[c.tipo] ? "visible" : "none");
      });
      if (!M.getLayer("ipr-kl-kp")) M.addLayer({ id: "ipr-kl-kp", type: "circle", source: SRC, filter: ["==", ["get", "tipo"], "keypoint"],
        paint: { "circle-radius": ["case", ["get", "primario"], 7, 5], "circle-color": "#111", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
    } catch (e) {}
  }
  function apagarMapa() {
    var M = mapa(); if (!M) return;
    try { ["ipr-kl-kp"].concat(CAM.map(function (c) { return c.id; })).forEach(function (id) { if (M.getLayer(id)) M.removeLayer(id); }); if (M.getSource(SRC)) M.removeSource(SRC); } catch (e) {}
  }

  // ───────── registo no m90800 ─────────
  function api(c, body) {
    return fetch("/wp-json/tcd/v1/" + c, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-WP-Nonce": W.tcdNonce || CFG.nonce || "" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { if (!r.ok) { var e = new Error(j && j.message || ("HTTP " + r.status)); e.estado = r.status; throw e; } return j; }); });
  }
  function hex32() { var a = new Uint8Array(16); (W.crypto || W.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function registar() {
    var a = actual(); if (!a || !R) return;
    var G = CACHE, m = R.r.mestres.filter(function (x) { return x.primaria; })[0];
    var mestre = m ? m.troços.map(function (tr) { var passo = Math.max(1, Math.ceil(tr.length / 150)); return tr.filter(function (_, i) { return i % passo === 0 || i === tr.length - 1; }).map(function (p) { return ll(G, p); }); }) : [];
    var resumo = Object.assign({}, R.r.resumo, { zoom_mdt: G.z, keypoints_geo: R.r.keypoints.map(function (k) { return { c: ll(G, [k.x, k.y]), z: k.z, bacia_ha: k.bacia_ha, acima: k.decl_cima_pct, abaixo: k.decl_baixo_pct, fim: k.fim }; }), mestre: mestre });
    R.enc = a.id;
    api("keyline/ensaio", { enc: a.id, id: R.id, respostas: R.params, resumo: resumo, versao: VERSAO })
      .then(function () { R.reg = 1; pintar(); }).catch(function () { R.reg = -1; pintar(); });
  }

  // ───────── painel ─────────
  var R = null, ESTADO = "", ABERTO = false, OP = { nota: "", veredicto: "", texto: "", correcao: null, enviado: false, erro: "" };
  var PARAM = { espac: 20, grade: 0.003, haVale: 0.5, suav: 4, primario: 0 };
  function css() {
    if (D.getElementById("ipr-kl-css")) return;
    var s = D.createElement("style"); s.id = "ipr-kl-css";
    s.textContent = "#ipr-kl{position:fixed;right:14px;top:84px;width:350px;max-width:calc(100vw - 28px);max-height:calc(100vh - 110px);overflow:auto;z-index:60;background:#fff;color:#222;border-radius:10px;box-shadow:0 6px 28px rgba(0,0,0,.25);font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;padding:14px 16px}" +
      "#ipr-kl h3{margin:0 0 8px;font-size:17px;display:flex;align-items:center;gap:8px}#ipr-kl h3 small{font-size:11px;font-weight:600;background:#fde7c2;color:#7a4b00;border-radius:10px;padding:2px 8px}" +
      "#ipr-kl .x{margin-left:auto;border:0;background:none;font-size:20px;cursor:pointer;color:#666}#ipr-kl label{display:block;margin:8px 0 2px;font-weight:600;font-size:12.5px;color:#444}" +
      "#ipr-kl select,#ipr-kl textarea{width:100%;padding:6px;border:1px solid #ccc;border-radius:6px;font:inherit;font-size:13px;background:#fff}#ipr-kl .b{display:inline-block;margin:10px 6px 0 0;padding:8px 14px;border-radius:6px;border:0;background:#4a5a2e;color:#fff;font-weight:600;cursor:pointer}" +
      "#ipr-kl .b.s{background:#eee;color:#333}#ipr-kl .b:disabled{opacity:.5;cursor:default}#ipr-kl .est{margin-top:10px;font-size:13px;color:#555}#ipr-kl table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}" +
      "#ipr-kl td{padding:3px 0;border-bottom:1px solid #f0f0f0}#ipr-kl td+td{text-align:right;font-variant-numeric:tabular-nums}#ipr-kl .ch{display:inline-flex;align-items:center;gap:4px;margin:4px 10px 0 0;font-size:13px;font-weight:400}" +
      "#ipr-kl .av{font-size:12px;color:#666;margin-top:12px;border-top:1px solid #eee;padding-top:8px}#ipr-kl .op{margin-top:12px;padding:10px;background:#f6f7f2;border-radius:8px}#ipr-kl .op .r{display:flex;flex-wrap:wrap;gap:4px}" +
      "#ipr-kl .op .r button{border:1px solid #ccc;background:#fff;border-radius:14px;padding:4px 10px;font-size:12.5px;cursor:pointer}#ipr-kl .op .r button.on{background:#4a5a2e;color:#fff;border-color:#4a5a2e}" +
      "#ipr-kl .ok{color:#2d6a2d}#ipr-kl .er{color:#b3261e}#ipr-kl .lg{display:inline-block;width:16px;height:3px;vertical-align:middle;margin-right:4px}" +
      "#ipr-kl-btn{position:fixed;left:14px;bottom:118px;z-index:55;border:0;border-radius:18px;padding:8px 14px;background:#e0402a;color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);cursor:pointer}" +
      "@media (max-width:700px){#ipr-kl{top:auto;bottom:10px;right:10px;max-height:70vh}#ipr-kl-btn{bottom:150px}}";
    D.head.appendChild(s);
  }
  function opt(v, txt, cur) { return '<option value="' + v + '"' + (String(v) === String(cur) ? " selected" : "") + ">" + esc(txt) + "</option>"; }
  function html() {
    var fs = baseFeicoes(), a = actual(), h = '<h3>' + esc(t("tit")) + ' <small>' + esc(t("teste")) + '</small><button class="x" data-kl="fechar" aria-label="' + esc(t("fechar")) + '">×</button></h3>';
    if (!fs) return h + '<p>' + esc(t("semBase")) + "</p>";
    h += '<div style="font-size:13px;color:#555">' + esc(t("base")) + ": <b>" + esc(a.nome || a.titulo || ("#" + a.id)) + "</b></div>";
    h += "<label>" + esc(t("esp")) + '</label><select data-kp="espac">' + [6, 10, 15, 20, 30, 50].map(function (v) { return opt(v, v + " m", PARAM.espac); }).join("") + "</select>";
    h += "<label>" + esc(t("desc")) + '</label><select data-kp="grade">' + [0.001, 0.002, 0.003, 0.005, 0.01].map(function (v) { return opt(v, nf(v * 100, 1) + " %", PARAM.grade); }).join("") + "</select>";
    h += "<label>" + esc(t("vale")) + '</label><select data-kp="haVale">' + [0.1, 0.25, 0.5, 1, 2, 5].map(function (v) { return opt(v, nf(v, 2) + " " + t("ha"), PARAM.haVale); }).join("") + "</select>";
    h += "<label>" + esc(t("suav")) + '</label><select data-kp="suav">' + [2, 4, 8, 12].map(function (v) { return opt(v, v + " m", PARAM.suav); }).join("") + "</select>";
    var ocup = /^a /.test(ESTADO);
    h += '<button class="b" data-kl="propor"' + (ocup ? " disabled" : "") + ">" + esc(R ? t("outra") : t("propor")) + "</button>";
    if (R) h += '<button class="b s" data-kl="geojson">' + esc(t("geojson")) + '</button><button class="b s" data-kl="limpar">' + esc(t("limpar")) + "</button>";
    if (ESTADO) h += '<div class="est' + (/^!/.test(ESTADO) ? " er" : "") + '">' + esc(ESTADO.replace(/^[!a] /, "")) + "</div>";
    if (R) {
      var s = R.r.resumo;
      if (R.r.keypoints.length > 1) {
        h += "<label>" + esc(t("principal")) + '</label><select data-kp="primario">' + R.r.keypoints.map(function (k, i) { return opt(i, "KP" + (i + 1) + " · " + nf(k.z, 1) + " m · " + t("bacia") + " " + nf(k.bacia_ha, 2) + " ha", PARAM.primario); }).join("") + "</select>";
      }
      h += "<table>" +
        "<tr><td>" + esc(t("area")) + "</td><td>" + nf(s.area_ha, 2) + " ha</td></tr>" +
        "<tr><td>" + esc(t("celula")) + "</td><td>" + nf(s.celula_m, 2) + " m</td></tr>" +
        "<tr><td>" + esc(t("cotas")) + "</td><td>" + nf(s.cotas[0], 0) + "–" + nf(s.cotas[1], 0) + " m</td></tr>" +
        "<tr><td>" + esc(t("decl")) + "</td><td>" + nf(s.declive_medio_pct, 1) + " %</td></tr>" +
        '<tr><td><span class="lg" style="background:#2f74d0"></span>' + esc(t("vales")) + "</td><td>" + nf(s.vales_m, 0) + " m</td></tr>" +
        '<tr><td><span class="lg" style="background:#a0642a"></span>' + esc(t("cumeadas")) + "</td><td>" + nf(s.cumeadas_m, 0) + " m</td></tr>" +
        '<tr><td>● ' + esc(t("kps")) + "</td><td>" + s.keypoints + "</td></tr>" +
        '<tr><td><span class="lg" style="background:#e0402a;height:4px"></span>' + esc(t("mestre")) + "</td><td>" + nf(s.mestre_m, 0) + " m</td></tr>" +
        '<tr><td><span class="lg" style="background:#3e9b4f"></span>' + esc(t("parals")) + "</td><td>" + s.paralelas + " · " + nf(s.paralelas_m, 0) + " m</td></tr>" +
        "<tr><td>" + esc(t("tempo")) + "</td><td>" + nf((s.tempo_ms + (R.tCarga || 0)) / 1000, 1) + " s</td></tr></table>";
      h += "<label>" + esc(t("ver")) + "</label>" + [["vale", "vVales"], ["cumeada", "vCum"], ["paralela", "vPar"], ["mestre2", "vOutras"]].map(function (v) {
        return '<label class="ch"><input type="checkbox" data-kv="' + v[0] + '"' + (VIS[v[0]] ? " checked" : "") + ">" + esc(t(v[1])) + "</label>"; }).join("");
      h += '<div class="est ' + (R.reg === 1 ? "ok" : "") + '">' + (R.reg === 1 ? esc(t("registado")) : R.reg === -1 ? esc(t("naoReg")) : "") + "</div>";
      if (R.reg === 1) {
        if (OP.enviado) h += '<div class="op ok">' + esc(t("obrigado")) + "</div>";
        else {
          h += '<div class="op"><label style="margin-top:0">' + esc(t("op")) + '</label><div class="r">' + ["certo", "parcial", "errado"].map(function (v) { return '<button data-on="nota" data-v="' + v + '"' + (OP.nota === v ? ' class="on"' : "") + ">" + esc(t(v)) + "</button>"; }).join("") + "</div>";
          h += "<label>" + esc(t("ver2")) + '</label><div class="r">' + ["aceite", "corrigido", "recusado"].map(function (v) { return '<button data-on="veredicto" data-v="' + v + '"' + (OP.veredicto === v ? ' class="on"' : "") + ">" + esc(t(v)) + "</button>"; }).join("") + "</div>";
          h += "<label>" + esc(t("texto")) + '</label><textarea rows="3" data-op="texto">' + esc(OP.texto) + "</textarea>";
          if (OP.veredicto === "corrigido") h += "<label>" + esc(t("correcao")) + '</label><input type="file" accept=".geojson,.json,application/geo+json,application/json" data-op="ficheiro">' + (OP.correcao ? ' <span class="ok">✓</span>' : "");
          if (OP.erro) h += '<div class="est er">' + esc(OP.erro) + "</div>";
          h += '<button class="b" data-kl="opiniao">' + esc(t("enviar")) + "</button></div>";
        }
      }
    }
    h += '<div class="av">' + esc(t("aviso")) + "<br><br>" + esc(t("fonte")) + "</div>";
    return h;
  }
  function painel() { var p = D.getElementById("ipr-kl"); if (!p) { css(); p = D.createElement("div"); p.id = "ipr-kl"; D.body.appendChild(p); ligar(p); } return p; }
  function pintar() { if (!ABERTO) return; var p = painel(), ae = D.activeElement, foco = ae && p.contains(ae) && ae.tagName === "TEXTAREA"; if (foco) return; p.innerHTML = html(); }
  function abrir() { ABERTO = true; painel().hidden = false; pintar(); }
  function fechar() { ABERTO = false; var p = D.getElementById("ipr-kl"); if (p) p.hidden = true; }
  function ligar(p) {
    p.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kl],[data-on]"); if (!b) return;
      var a = b.getAttribute("data-kl");
      if (b.hasAttribute("data-on")) { OP[b.getAttribute("data-on")] = b.getAttribute("data-v"); OP.erro = ""; pintar(); return; }
      if (a === "fechar") fechar();
      else if (a === "propor") propor(false);
      else if (a === "limpar") { apagarMapa(); R = null; ESTADO = ""; pintar(); }
      else if (a === "geojson" && R) { var bl = new Blob([JSON.stringify(R.geo)], { type: "application/geo+json" }), u = URL.createObjectURL(bl), l = D.createElement("a"); l.href = u; l.download = "keyline-" + (actual() && actual().id || "base") + ".geojson"; D.body.appendChild(l); l.click(); setTimeout(function () { URL.revokeObjectURL(u); l.remove(); }, 1000); }
      else if (a === "opiniao") enviarOpiniao();
    });
    p.addEventListener("change", function (e) {
      var el = e.target;
      if (el.hasAttribute("data-kp")) {
        var k = el.getAttribute("data-kp"); PARAM[k] = +el.value;
        if (k === "primario" && R) propor(true);
      } else if (el.hasAttribute("data-kv")) { VIS[el.getAttribute("data-kv")] = el.checked; desenhar(); }
      else if (el.getAttribute("data-op") === "ficheiro" && el.files && el.files[0]) {
        el.files[0].text().then(function (s) {
          try { var g = JSON.parse(s); if (g.type !== "FeatureCollection" || !(g.features || []).every(function (f) { return f.geometry && /^(Multi)?(Point|LineString)$/.test(f.geometry.type); })) throw 0; OP.correcao = g; OP.erro = ""; }
          catch (x) { OP.correcao = null; OP.erro = t("corrErr"); }
          pintar();
        });
      }
    });
    p.addEventListener("input", function (e) { if (e.target.getAttribute("data-op") === "texto") OP.texto = e.target.value; });
  }
  function enviarOpiniao() {
    if (!R || !OP.nota || !OP.veredicto) { OP.erro = t("escolha"); pintar(); return; }
    var corpo = { enc: R.enc, id: R.id, veredicto: OP.veredicto, nota: OP.nota, texto: OP.texto.slice(0, 2000) };
    if (OP.veredicto === "corrigido" && OP.correcao) corpo.correcao = OP.correcao;
    api("keyline/ensaio/opiniao", corpo).then(function () { OP.enviado = true; pintar(); }).catch(function (e) { OP.erro = e.message; pintar(); });
  }
  function propor(soPrimario) {
    var fs = baseFeicoes(); if (!fs) { pintar(); return; }
    var a = actual(), chave = String(a.id) + "|" + JSON.stringify(fs.map(function (f) { return f.geometry; })).length;
    var params = { espac: PARAM.espac, grade: PARAM.grade, areaVale: PARAM.haVale * 10000, areaCumeada: PARAM.haVale * 10000, suav: PARAM.suav, janela: 20, maxKp: 6, primario: soPrimario ? PARAM.primario : 0 };
    if (!soPrimario) PARAM.primario = 0;
    var t0 = Date.now(), tCarga = 0;
    ESTADO = "a " + t("aCarregar"); pintar();
    var passo = (CACHE && CACHE.chave === chave) ? Promise.resolve(CACHE) : new Promise(function (ok) { ok(prepararGrelha(fs)); }).then(carregarMDT).then(function (G) { G.chave = chave; CACHE = G; return G; });
    passo.then(function (G) {
      tCarga = Date.now() - t0; ESTADO = "a " + t("aCalcular"); pintar();
      return correrMotor(G, params).then(function (r) { return { G: G, r: r }; });
    }).then(function (x) {
      if (!x.r.keypoints.length) { R = null; apagarMapa(); ESTADO = "! " + t("semKp"); pintar(); return; }
      R = { id: hex32(), params: params, r: x.r, tCarga: tCarga };
      R.geo = paraGeo(x.G, x.r); OP = { nota: "", veredicto: "", texto: "", correcao: null, enviado: false, erro: "" };
      ESTADO = ""; desenhar(); pintar(); registar();
    }).catch(function (e) { ESTADO = "! " + t("falhou") + (e && e.message || e); pintar(); });
  }

  // ───────── botão de entrada ─────────
  function botao() {
    var tem = !!baseFeicoes(), b = D.getElementById("ipr-kl-btn");
    if (!tem) { if (b) b.hidden = true; return; }
    if (!b) { css(); b = D.createElement("button"); b.id = "ipr-kl-btn"; b.type = "button"; b.addEventListener("click", function () { ABERTO ? fechar() : abrir(); }); D.body.appendChild(b); }
    b.hidden = false; b.textContent = t("botao") + " · " + t("teste");
    // também no painel Processos, no bloco dos simuladores
    var sims = D.querySelector("#ipr-t62 .ipr-sims");
    if (sims && !sims.querySelector("[data-kl-ent]")) { var x = D.createElement("button"); x.type = "button"; x.className = "button"; x.setAttribute("data-kl-ent", "1"); x.textContent = t("botao") + " (" + t("teste") + ")"; x.addEventListener("click", abrir); sims.appendChild(x); }
  }
  var BASE = null;
  setInterval(function () {
    botao();
    var a = actual(), id = a && a.id != null ? String(a.id) : null;
    if (id !== BASE) { BASE = id; if (R) { apagarMapa(); R = null; } ESTADO = ""; PARAM.primario = 0; pintar(); }
    var M = mapa(); if (M && R && !M.getSource(SRC)) desenhar(); // o estilo do mapa mudou: volta a desenhar
  }, 700);
  D.addEventListener("ipr:lingua", function () { pintar(); botao(); });
  W.IPR_KEYLINE = { abrir: abrir, versao: VERSAO, motor: iprKeylineMotor, ultimo: function () { return R; } };
})(window, document);
