/* IPR Atlas · terreno-camadas.js (10/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 10/11/2026, 18h44 (chamada com o Norbert): «em vez de estar a ir às camadas para ver o que é que há, eu gostava
   que em cada propriedade soubesse logo o que é que está nas camadas em relação a ele [...] condicionantes, zonas
   protegidas, charcos temporários».
   «O que há neste terreno»: cruza o limite do terreno com as camadas do catálogo do Atlas (IPRViz.catalogo) e lista só as
   que tocam no terreno, por grupos, com a percentagem (áreas), o número de elementos (pontos e linhas) e os nomes ou
   códigos (ex.: habitat 3170* Charcos temporários mediterrânicos), e um botão «Ver no mapa» que liga a camada.
   - Camadas ArcGIS (ICNF, APA, DGEG, BUPi): pergunta query?geometry=<limite>&returnGeometry=false (só atributos).
   - Camadas vectoriais da DGT (OGC API, mosaicos MVT): desenha os mosaicos e o limite numa grelha e mede a sobreposição.
   - Imagens (WMS) e camadas próprias em PMTiles ficam de fora desta versão.
   Onde aparece: no separador Resumo da Ficha da propriedade de cada Base (por baixo do valor indicativo), e por baixo da
   ficha gratuita de um terreno desenhado ou escolhido no cadastro (Atlas completo e modo simples do Explorer).
   Explorer: vê tudo o que é condicionante, fogo e limites; de água, solo e natureza vê quantas camadas têm dados no
   terreno e o convite para o Intelligence (regra do Nuno de 24/10: perceber que há mais, sem os detalhes).
   Resultados guardados por terreno nesta sessão. No máximo 6 pedidos de cada vez; cada um desiste aos 15 s.
   Desligar: ?tcam=0 ou localStorage ipr_tcam_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]tcam=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_tcam_off") === "1") return; } catch (e) {}
  if (W.__iprTCam) return; W.__iprTCam = 1;

  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en"; }
  function T(a, b) { return en() ? b : a; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v, c) { return Number(v).toLocaleString(en() ? "en-GB" : "pt-PT", { maximumFractionDigits: c == null ? 1 : c }); }
  function intel() {
    if (String(W.IPR_NIVEL || "").toLowerCase() === "intelligence") return true;
    var q = W.tcdEquipa; return !!(q && typeof q === "object" && q.email);
  }
  var ABERTOS = { cond: 1, fogo: 1, prop: 1 }; // o que o Explorer vê por inteiro
  var GRUPOS = [
    ["cond", "Condicionantes e servidões", "Constraints and easements"],
    ["fogo", "Fogo", "Fire"],
    ["agua", "Água", "Water"],
    ["nat", "Natureza e clima", "Nature and climate"],
    ["solo", "Solo e vegetação", "Soil and vegetation"],
    ["prop", "Limites e cadastro", "Boundaries and cadastre"]
  ];
  // Fora: fundos, relevo LiDAR (já está na Base), referência OSM, e camadas de contexto nacional sem sentido por terreno
  var FORA = /^(rh|bacias|massas|prof_reg|reg_nat|distritos|concelhos|caop|bupi|freg_dfci|nematodo|hidrom|est_qual|apasub|piezo|percursos|ifn15|alb_snirh|alb_bacia)$/;

  // Habitats do Anexo I mais frequentes (códigos do ICNF)
  var HAB = {
    "3110": "Águas oligotróficas muito pouco mineralizadas", "3120": "Águas oligotróficas sobre solos arenosos",
    "3130": "Águas paradas oligotróficas a mesotróficas", "3150": "Lagos eutróficos naturais",
    "3170": "Charcos temporários mediterrânicos", "3260": "Cursos de água com vegetação flutuante",
    "3280": "Cursos de água mediterrânicos permanentes", "3290": "Cursos de água mediterrânicos intermitentes",
    "4030": "Charnecas secas europeias", "5330": "Matos termomediterrânicos pré-desérticos",
    "6220": "Subestepes de gramíneas e anuais", "6310": "Montados de Quercus spp.", "6420": "Pradarias húmidas mediterrânicas",
    "91B0": "Freixiais termófilos", "91E0": "Florestas aluviais de amieiro e freixo", "92A0": "Florestas-galerias de salgueiro e choupo",
    "92D0": "Galerias e matos ribeirinhos meridionais", "9230": "Carvalhais de carvalho-negral", "9240": "Carvalhais de carvalho-cerquinho",
    "9330": "Florestas de sobreiro", "9340": "Florestas de azinheira", "9560": "Florestas endémicas de zimbro"
  };
  function habNome(c) { var k = String(c || "").replace(/[*\s]/g, "").toUpperCase(); return HAB[k] ? c + " " + HAB[k] : c; }

  // ---------- geometria ----------
  function polis(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
  function fcDe(g) {
    if (!g) return null; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { return null; } }
    if (g.type === "FeatureCollection") return g;
    if (g.type === "Feature") return { type: "FeatureCollection", features: [g] };
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: g }] };
  }
  function aneis(F) { var r = []; (F.features || []).forEach(function (f) { polis(f.geometry).forEach(function (p) { p.forEach(function (a) { r.push(a); }); }); }); return r; }
  function caixa(F) { var b = [180, 90, -180, -90]; aneis(F).forEach(function (a) { a.forEach(function (c) { if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; }); }); return b[2] > b[0] ? b : null; }
  function aligeirar(a, max) { if (a.length <= max) return a; var p = Math.ceil(a.length / max), o = a.filter(function (c, i) { return i % p === 0; }); o.push(a[a.length - 1]); return o; }
  function chave(F) { var s = JSON.stringify(aneis(F)), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return "t" + h + ":" + s.length; }
  function mx(l) { return (l + 180) / 360; }
  function my(f) { var a = f * Math.PI / 180; return (1 - Math.log(Math.tan(a) + 1 / Math.cos(a)) / Math.PI) / 2; }

  // ---------- pedidos ----------
  var fila = [], aCorrer = 0, MAX = 6;
  function correr() {
    while (aCorrer < MAX && fila.length) {
      var t = fila.shift(); aCorrer++;
      (function (t) { t.f().then(t.ok, t.ko).then(function () { aCorrer--; correr(); }); })(t);
    }
  }
  function agendar(f) { return new Promise(function (ok, ko) { fila.push({ f: f, ok: ok, ko: ko }); correr(); }); }
  function comTempo(p, ms) { return Promise.race([p, new Promise(function (o, j) { setTimeout(function () { j(new Error("tempo")); }, ms); })]); }
  function pxUrl(u) { return "/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(u); }
  function json(u) {
    function ler(x) { return comTempo(fetch(x, { referrerPolicy: "no-referrer" }), 15000).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
    return ler(u).catch(function () { return ler(pxUrl(u)); });
  }
  function buffer(u) {
    function ler(x) { return comTempo(fetch(x), 15000).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); }); }
    return ler(u).catch(function () { return ler(pxUrl(u)); });
  }

  // ---------- nomes a partir dos atributos ----------
  var BONS = /^(site_name|nome|name|nametext|designacao|designação|desig|denominacao|denominação|classe|class|categoria|tipo|tipologia|descricao|descrição|desc|label|valor|value|zona|regime|h[123]_cod|cod_hab|habitat|nivel|grau|perigo|perigosidade|classe_desc|legenda|qualificacao|qualificação|subcategoria|indaride|suscetibili|ldi|paisagem|srh)$|_n4_l$|_l$/i;
  var MAUS = /^(objectid|fid|ogc_fid|shape|globalid|id|gid|gml_id|inspireid|localid|beginlifespan.*|endlifespan.*|area.*|perim.*|st_area.*|st_length.*|sde_.*|simbolo|cod.*|data.*|date.*|url|link|x|y|lat|lon|aviso|funcoes)$/i;
  function bom(v) { v = String(v).trim(); return v && v.length <= 80 && !/^-?[\d.,]+$/.test(v) && !/^https?:/.test(v) && /[A-Za-zÀ-ú]/.test(v) ? v : ""; }
  function rotulosDe(attrs) {
    var r = [], resto = [];
    Object.keys(attrs || {}).forEach(function (k0) {
      var k = k0.split(".").pop(), v = attrs[k0]; if (v == null || MAUS.test(k)) return;
      if (/^h[123]_cod|cod_hab|habitat/i.test(k) && String(v).trim()) { v = habNome(String(v).trim()); if (r.indexOf(v) < 0) r.push(v); return; }
      v = bom(v); if (!v) return;
      if (BONS.test(k)) { if (r.indexOf(v) < 0) r.push(v); } else if (resto.indexOf(v) < 0) resto.push(v);
    });
    return (r.length ? r : resto).slice(0, 2);
  }
  function juntar(lista) { var c = {}; lista.forEach(function (rs) { rs.forEach(function (v) { c[v] = (c[v] || 0) + 1; }); }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }); }

  // ---------- ArcGIS ----------
  function agsCamadas(e) { var m = /show:([\d,]+)/.exec(e.layers || ""); return m ? m[1].split(",").map(Number) : [0]; }
  function agsOnde(e) { try { var d = JSON.parse(e.dyn || "null"); if (d && d[0] && d[0].definitionExpression) return d[0].definitionExpression; } catch (x) {} return "1=1"; }
  function perguntarAgs(e, F) {
    var rings = aneis(F).map(function (a) { return aligeirar(a, 80).map(function (c) { return [+c[0].toFixed(6), +c[1].toFixed(6)]; }); });
    var g = encodeURIComponent(JSON.stringify({ rings: rings, spatialReference: { wkid: 4326 } }));
    var onde = encodeURIComponent(agsOnde(e));
    return Promise.all(agsCamadas(e).map(function (id) {
      var u = e.url.replace(/\/+$/, "") + "/" + id + "/query?where=" + onde + "&geometry=" + g + "&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&resultRecordCount=40&f=json";
      return agendar(function () { return json(u); }).then(function (j) { if (j && j.error) throw new Error(j.error.message || "erro"); return (j && j.features) || []; });
    })).then(function (ls) {
      var fs = [].concat.apply([], ls); if (!fs.length) return null;
      return { n: fs.length, mais: fs.length >= 40, rot: juntar(fs.map(function (f) { return rotulosDe(f.attributes); })).slice(0, 4) };
    });
  }

  // ---------- mosaicos vectoriais da DGT ----------
  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/";
  function grelha(F, lado) {
    var b = caixa(F), x0 = mx(b[0]), x1 = mx(b[2]), y0 = my(b[3]), y1 = my(b[1]), w = x1 - x0, h = y1 - y0, m = 0.02 * Math.max(w, h);
    x0 -= m; y0 -= m; w += 2 * m; h += 2 * m;
    var Wp = w >= h ? lado : Math.max(8, Math.round(lado * w / h)), Hp = w >= h ? Math.max(8, Math.round(lado * h / w)) : lado;
    return { x0: x0, y0: y0, w: w, h: h, W: Wp, H: Hp };
  }
  function tela(G) { var c = D.createElement("canvas"); c.width = G.W; c.height = G.H; return c.getContext("2d", { willReadFrequently: true }); }
  function mascara(G, F) {
    var x = tela(G); x.fillStyle = "#000";
    aneis(F).length && (F.features || []).forEach(function (f) { polis(f.geometry).forEach(function (p) { x.beginPath(); p.forEach(function (a) { a.forEach(function (q, i) { var px = (mx(q[0]) - G.x0) / G.w * G.W, py = (my(q[1]) - G.y0) / G.h * G.H; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); }); x.fill("evenodd"); }); });
    var d = x.getImageData(0, 0, G.W, G.H).data, m = new Uint8Array(G.W * G.H); for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0; return m;
  }
  function mosaicos(G, z) { var n = Math.pow(2, z), r = []; for (var i = Math.floor(G.x0 * n); i <= Math.floor((G.x0 + G.w) * n); i++) for (var j = Math.floor(G.y0 * n); j <= Math.floor((G.y0 + G.h) * n); j++) r.push([z, i, j]); return r; }
  function perguntarMvt(e, F, G, M, area) {
    var dec = W.IPRDiag && W.IPRDiag.mvtDecode; if (!dec) return Promise.resolve(null);
    var z = 14; while (z > Math.max(10, e.minz || 0) && mosaicos(G, z).length > 9) z--;
    var n = Math.pow(2, z), ts = mosaicos(G, z), MB = [G.W, G.H, 0, 0];
    for (var q = 0; q < M.length; q++) if (M[q]) { var qx = q % G.W, qy = (q / G.W) | 0; if (qx < MB[0]) MB[0] = qx; if (qx > MB[2]) MB[2] = qx; if (qy < MB[1]) MB[1] = qy; if (qy > MB[3]) MB[3] = qy; }
    return Promise.all(ts.map(function (t) {
      return agendar(function () { return buffer(OGC + e.col + "/tiles/WebMercatorQuad/" + t[0] + "/" + t[2] + "/" + t[1] + "?f=mvt"); })
        .then(function (b) { return { t: t, f: b && b.byteLength ? dec(b) : [] }; }).catch(function () { return { t: t, f: [] }; });
    })).then(function (rs) {
      var tot = 0, pts = 0, rot = [], uniao = tela(G);
      rs.forEach(function (r) {
        var t = r.t, ox = (t[1] / n - G.x0) / G.w * G.W, oy = (t[2] / n - G.y0) / G.h * G.H, lado = G.W / (G.w * n), ladoY = lado * (G.H / G.h) / (G.W / G.w);
        r.f.forEach(function (f) {
          var s = lado / f.ext, sy = ladoY / f.ext;
          // fora da caixa do terreno: nem se desenha
          var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
          f.aneis.forEach(function (a) { a.forEach(function (q) { var px = ox + q[0] * s, py = oy + q[1] * sy; if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py; }); });
          if (bx1 < MB[0] - 4 || bx0 > MB[2] + 4 || by1 < MB[1] - 4 || by0 > MB[3] + 4) return;
          var x = tela(G);
          x.fillStyle = "#000"; x.strokeStyle = "#000"; x.lineWidth = 3;
          x.beginPath();
          f.aneis.forEach(function (a) { a.forEach(function (q, i) { var px = ox + q[0] * s, py = oy + q[1] * sy; if (f.tipo === 1) { x.moveTo(px + 3, py); x.arc(px, py, 3, 0, 7); } else if (i) x.lineTo(px, py); else x.moveTo(px, py); }); if (f.tipo === 3) x.closePath(); });
          if (f.tipo === 3) x.fill("evenodd"); else if (f.tipo === 1) x.fill(); else x.stroke();
          var d = x.getImageData(0, 0, G.W, G.H).data, k = 0;
          for (var i = 0; i < M.length; i++) if (M[i] && d[i * 4 + 3] > 127) k++;
          if (k) { pts++; rot.push(rotulosDe(f.props)); if (f.tipo === 3) uniao.drawImage(x.canvas, 0, 0); }
        });
      });
      if (!pts) return null;
      var du = uniao.getImageData(0, 0, G.W, G.H).data; for (var i = 0; i < M.length; i++) if (M[i] && du[i * 4 + 3] > 127) tot++;
      var poli = tot > 0;
      return { n: pts, pct: poli ? Math.round(1000 * tot / area) / 10 : null, rot: juntar(rot).slice(0, 4) };
    });
  }

  // ---------- cálculo para um terreno ----------
  var MEMO = {};
  function cruzar(F, aoPasso) {
    var k = chave(F); if (MEMO[k]) return MEMO[k];
    var cat = ((W.IPRViz && W.IPRViz.catalogo) || []).filter(function (e) {
      if (!e || !e.id || FORA.test(e.id) || e.fundo) return false;
      if (!/^(cond|fogo|agua|nat|solo|prop)$/.test(e.g)) return false;
      return (e.t === "ags" && e.url) || (e.t === "mvt" && e.col);
    });
    var G = grelha(F, 400), M = mascara(G, F), area = 0; for (var i = 0; i < M.length; i++) area += M[i];
    var feitos = 0, res = [];
    MEMO[k] = Promise.all(cat.map(function (e) {
      var p = e.t === "ags" ? perguntarAgs(e, F) : perguntarMvt(e, F, G, M, area || 1);
      return p.then(function (r) { if (r) res.push({ e: e, r: r }); }, function () {}).then(function () { feitos++; if (aoPasso) aoPasso(feitos, cat.length, res); });
    })).then(function () { return res; });
    return MEMO[k];
  }
  W.__iprTerrenoCamadas = cruzar;

  // ---------- desenho ----------
  var css = D.createElement("style"); css.id = "ipr-tcam-css";
  css.textContent =
    ".ipr-tcam{margin:12px 0 4px;border:1px solid rgba(127,127,127,.28);border-radius:10px;padding:10px 12px;font:13px/1.45 Inter,system-ui,sans-serif}" +
    ".ipr-tcam h4{margin:0 0 2px;font:600 13.5px/1.3 Inter,system-ui,sans-serif;letter-spacing:0;text-transform:none}" +
    ".ipr-tcam .st{opacity:.7;font-size:12px;margin:0 0 6px}" +
    ".ipr-tcam .bar{height:3px;border-radius:2px;background:rgba(127,127,127,.2);margin:4px 0 8px;overflow:hidden}.ipr-tcam .bar i{display:block;height:100%;background:#94BE39;transition:width .3s}" +
    ".ipr-tcam .gr{margin:8px 0 2px;font:600 10.5px/1.2 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;opacity:.7}" +
    ".ipr-tcam ul{list-style:none;margin:0;padding:0}.ipr-tcam li{display:block;padding:6px 0;border-bottom:1px solid rgba(127,127,127,.15);min-width:0}" +
    ".ipr-tcam li:last-child{border-bottom:0}.ipr-tcam li .t{display:block;min-width:0;overflow-wrap:anywhere}.ipr-tcam li .t b{font-weight:600}.ipr-tcam li .t small{display:block;opacity:.72;font-size:11.5px;overflow-wrap:anywhere}" +
    ".ipr-tcam li .r{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:4px}" +
    ".ipr-tcam li .v{font:500 12px/1.4 'IBM Plex Mono',ui-monospace,monospace;opacity:.9;white-space:nowrap}" +
    ".ipr-tcam li button{flex:0 0 auto;margin-left:auto;font:600 11px/1 Inter,system-ui,sans-serif;padding:5px 8px;border-radius:6px;border:1px solid rgba(127,127,127,.4);background:transparent;color:inherit;cursor:pointer}" +
    ".ipr-tcam li button:hover{border-color:#94BE39;color:#94BE39}" +
    ".ipr-tcam .lk{margin:8px 0 0;padding:8px 10px;border-radius:8px;background:rgba(148,190,57,.1);font-size:12.5px}.ipr-tcam .lk a,.ipr-tcam .lk button{color:#94BE39;font-weight:600;background:none;border:0;padding:0;cursor:pointer;font:inherit;text-decoration:underline}" +
    ".ipr-tcam .nota{opacity:.6;font-size:11px;margin:8px 0 0}";
  (D.head || D.documentElement).appendChild(css);

  function nome(e) { return (en() && e.en) || e.n || e.id; }
  function valor(r) {
    if (r.pct == null && r.n === 1 && r.rot.length) return "";
    if (r.pct != null) return (r.pct < 0.1 ? "<0,1" : num(r.pct)) + " %";
    return r.n + (r.mais ? "+" : "") + " " + (r.n === 1 ? T("elemento", "feature") : T("elementos", "features"));
  }
  function pintar(caixaEl, res, feitos, total, fim) {
    var ver = intel(), html = "<h4>" + esc(T("O que há neste terreno", "What is on this land")) + "</h4>";
    html += '<p class="st">' + esc(fim ? T("Cruzado com ", "Checked against ") + total + T(" camadas do Atlas. Só aparecem as que tocam no terreno.", " Atlas layers. Only those that touch the land are shown.")
      : T("A cruzar o terreno com as camadas do Atlas… ", "Checking the land against the Atlas layers… ") + feitos + " / " + total) + "</p>";
    if (!fim) html += '<div class="bar"><i style="width:' + Math.round(100 * feitos / Math.max(1, total)) + '%"></i></div>';
    var escondidas = 0;
    GRUPOS.forEach(function (g) {
      var it = res.filter(function (x) { return x.e.g === g[0]; });
      if (!it.length) return;
      if (!ver && !ABERTOS[g[0]]) { escondidas += it.length; return; }
      it.sort(function (a, b) { return (b.r.pct || 0) - (a.r.pct || 0) || b.r.n - a.r.n; });
      html += '<div class="gr">' + esc(T(g[1], g[2])) + "</div><ul>" + it.map(function (x) {
        return '<li><span class="t"><b>' + esc(nome(x.e)) + "</b>" + (x.r.rot.length ? "<small>" + esc(x.r.rot.join(" · ")) + "</small>" : "") +
          '</span><span class="r"><span class="v">' + esc(valor(x.r)) + '</span><button type="button" data-tcam="' + esc(x.e.id) + '">' + esc(T("Ver no mapa", "Show on map")) + "</button></span></li>";
      }).join("") + "</ul>";
    });
    if (fim && !res.length) html += '<p class="st">' + esc(T("Nenhuma das camadas consultadas toca neste terreno.", "None of the checked layers touch this land.")) + "</p>";
    if (escondidas) html += '<div class="lk">' + esc(T("Mais " + escondidas + " camadas de água, solo e natureza têm dados neste terreno. ", escondidas + " more water, soil and nature layers have data on this land. ")) +
      (caixaEl.closest(".ipr-exd-ui,#ipr-exd-dir") ? '<button type="button" data-x="intel">' + esc(T("Ver no Intelligence", "See them in Intelligence")) + "</button>" : '<a href="/ipr-cloud/">' + esc(T("Ver no Intelligence", "See them in Intelligence")) + "</a>") + "</div>";
    if (fim) html += '<p class="nota">' + esc(T("Indicativo: cruzamento automático com os serviços públicos (DGT, ICNF, APA, DGEG) no momento da consulta. Não substitui a Leitura Territorial nem a consulta à Câmara.", "Indicative: automatic check against public services (DGT, ICNF, APA, DGEG) at the time of the query. It does not replace the Land report or the municipality.")) + "</p>";
    caixaEl.innerHTML = html;
  }
  function montar(alvo, F, antes) {
    if (!alvo || !F || !caixa(F)) return;
    var k = chave(F), el = alvo.querySelector(":scope > .ipr-tcam");
    // A ficha gratuita muda de sítio (o modo simples do Explorer leva-a para o painel da direita): o bloco vai atrás dela
    if (antes) { el = D.querySelector(".ipr-tcam[data-fg]"); if (el && (el.parentNode !== alvo || el.previousElementSibling !== antes)) alvo.insertBefore(el, antes.nextSibling); }
    if (el && el.getAttribute("data-k") === k) return;
    if (!el) { el = D.createElement("div"); el.className = "ipr-tcam"; if (antes) el.setAttribute("data-fg", "1"); if (antes && antes.parentNode === alvo) alvo.insertBefore(el, antes.nextSibling); else alvo.appendChild(el); }
    el.setAttribute("data-k", k);
    var total = 0;
    pintar(el, [], 0, 1, false);
    cruzar(F, function (f, t, r) { total = t; if (el.getAttribute("data-k") === k && (f % 6 === 0 || f === t)) pintar(el, r.slice(), f, t, false); })
      .then(function (r) { if (el.getAttribute("data-k") === k) pintar(el, r, total || r.length, total || r.length, true); });
  }

  // «Ver no mapa»
  D.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("[data-tcam]"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    var id = b.getAttribute("data-tcam"), v = W.__ipe && W.__ipe.viz;
    try { if (v && typeof v.ligar === "function") v.ligar(id, true); } catch (e) {}
    b.textContent = T("Ligada", "On");
  }, true);

  // ---------- onde aparece ----------
  function terrenoDoCartao(c) {
    var E = W.__ipe && W.__ipe.estado, i = +c.getAttribute("data-i"), m = E && E.mapas && E.mapas[i];
    return m && m.geojson ? fcDe(m.geojson) : null;
  }
  function desenhado() {
    var m = W.__ipe && W.__ipe.mapa, cs = (m && m._controls) || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") { try { var a = cs[i].getAll(); var fs = a && a.features && a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }); if (fs && fs.length) return { type: "FeatureCollection", features: fs }; } catch (e) {} }
    return null;
  }
  function varrer() {
    // 1. Ficha da propriedade de cada Base aberta: por baixo do 3D e do valor indicativo (separador Resumo)
    D.querySelectorAll("#ipe .ipe-card.on .ipr-fx").forEach(function (fx) {
      var c = fx.closest(".ipe-card"); if (!c) return;
      var F = terrenoDoCartao(c); if (F) montar(fx, F);
    });
    // 2. Ficha gratuita de um terreno desenhado ou escolhido (Atlas completo e modo simples do Explorer)
    D.querySelectorAll(".ipr-fg-out").forEach(function (o) {
      if (o.closest(".ipe-card")) return;
      var F = desenhado(); if (!F) return;
      var pai = o.parentNode; if (pai) montar(pai, F, o);
    });
  }
  var t = null;
  function vigia() { if (t) return; t = setTimeout(function () { t = null; try { varrer(); } catch (e) {} }, 400); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x && x.closest && x.closest(".ipr-tcam")) continue; vigia(); return; }
  }).observe(D.body || D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  D.addEventListener("ipr:lingua", function () { D.querySelectorAll(".ipr-tcam").forEach(function (e) { e.removeAttribute("data-k"); }); vigia(); });
  vigia();
})();
