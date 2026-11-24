/* IPR Atlas · Analisar, Desenhar e Recolher: ferramentas de planeamento (24/11/2026, 17h24). Terracrua Design.
   Nuno: «é para avançar com isso tudo [...] analisar, desenhar e recolher, todas estas ferramentas» (maqueta «IPR Atlas ·
   ambiente novo», prancha «Analisar, Desenhar e Recolher»); 17h20: «ao desenhar [...] pontos, linhas e polígonos [...] por
   tipos, acessos, água [...] de uma forma super lógica [...] é sempre ponto, linha e polígono».
   Por baixo da faixa de cada modo (#ipr-modos-acc, que continua com as ferramentas de antes) aparece uma segunda faixa:
   - Desenhar: forma (ponto, linha, polígono) → tipo (Água, Acessos, Vegetação, Edificado, Limites e zonas) → subtipo.
     Ajudas: seguir a curva de nível (vala, keyline), volume da charca, declive do caminho, linhas de plantação, faixa à
     volta, medidas ao vivo, desfazer, exportar GeoJSON.
   - Analisar: O que há aqui, Caminho da água, Bacia a partir de um ponto.
   - Recolher: Amostra de solo, Ponto de água, Árvore, Problema no terreno, Gravar percurso (fichas com fotografia).
   O relevo vem dos mosaicos de elevação já usados na ficha gratuita (mapterhorn, até z15); o PDM, o cadastro, a COS e as
   freguesias da OGC API da DGT. O desenho fica guardado neste navegador (localStorage ipr_desenho_v1) e exporta-se.
   Azul só para linhas de água; caminhos castanhos. Desligar: ?trabalho=0 ou localStorage ipr_trabalho=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]trabalho=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_trabalho") === "0") return; } catch (e) {}
  if (W.__iprTrab) return; W.__iprTrab = 1;

  var DEM = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp";
  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/";
  var LIB = {
    turf: "https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js",
    d3a: "https://cdn.jsdelivr.net/npm/d3-array@3.2.4/dist/d3-array.min.js",
    d3c: "https://cdn.jsdelivr.net/npm/d3-contour@4.0.2/dist/d3-contour.min.js"
  };
  var CHAVE = "ipr_desenho_v1";

  var TIPOS = {
    agua: { n: "Água", cor: "#3d8fd6", p: ["Nascente", "Poço", "Furo", "Depósito"], l: ["Vala em curva de nível", "Keyline", "Tubagem", "Linha de água"], g: ["Charca", "Zona húmida", "Bacia de retenção"] },
    acessos: { n: "Acessos", cor: "#b98a52", p: ["Portão", "Cancela", "Passagem"], l: ["Caminho", "Estrada", "Trilho"], g: ["Eira e parque", "Zona de manobra"] },
    veg: { n: "Vegetação", cor: "#6fa83a", p: ["Árvore", "Árvore notável"], l: ["Sebe", "Linha de plantação", "Corta-vento"], g: ["Pomar", "Horta", "Mata", "Pastagem"] },
    edif: { n: "Edificado", cor: "#d9d6c8", p: ["Poste", "Colmeia", "Painel solar"], l: ["Muro", "Vedação", "Rede eléctrica"], g: ["Casa", "Armazém", "Estufa"] },
    lim: { n: "Limites e zonas", cor: "#e5484d", p: ["Marco"], l: ["Estrema", "Faixa de servidão"], g: ["Terreno", "Zona 0 a 5", "Faixa de combustível"] }
  };
  var RECOLHA = { solo: { n: "Amostra de solo", cor: "#a0785a" }, aguaP: { n: "Ponto de água", cor: "#3d8fd6" }, arvore: { n: "Árvore", cor: "#6fa83a" }, prob: { n: "Problema no terreno", cor: "#e5484d" } };

  function $(id) { return D.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function desenho() { var M = mapa(); return M && (M._controls || []).filter(function (x) { return x && typeof x.getAll === "function" && typeof x.changeMode === "function"; })[0]; }
  var libs = {};
  function lib(k) {
    if (libs[k]) return libs[k];
    libs[k] = new Promise(function (ok, ko) { var s = D.createElement("script"); s.src = LIB[k]; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = function () { delete libs[k]; ko(new Error("não carregou " + k)); }; D.head.appendChild(s); });
    return libs[k];
  }
  function turf() { return lib("turf").then(function () { return W.turf; }); }
  function d3c() { return lib("d3a").then(function () { return lib("d3c"); }).then(function () { return W.d3; }); }
  function n(v, c) { return Number(v).toLocaleString("pt-PT", { minimumFractionDigits: c || 0, maximumFractionDigits: c == null ? 1 : c }); }

  // ---------- geometria simples ----------
  var R = 6371008.8;
  function dist(a, b) { var f1 = a[1] * Math.PI / 180, f2 = b[1] * Math.PI / 180, df = f2 - f1, dl = (b[0] - a[0]) * Math.PI / 180; var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  function comp(cs) { var s = 0; for (var i = 1; i < cs.length; i++) s += dist(cs[i - 1], cs[i]); return s; }
  function area(ring) { var k = Math.cos(ring[0][1] * Math.PI / 180), s = 0; for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) { var xi = ring[i][0] * k, xj = ring[j][0] * k; s += (xj + xi) * (ring[j][1] - ring[i][1]); } return Math.abs(s / 2) * Math.pow(Math.PI / 180 * R, 2); }
  function txtMed(g) {
    if (!g) return "";
    if (g.type === "LineString") return n(comp(g.coordinates), 0) + " m";
    if (g.type === "Polygon" && g.coordinates[0] && g.coordinates[0].length > 3) { var a = area(g.coordinates[0]); return (a > 5000 ? n(a / 1e4, 2) + " ha" : n(a, 0) + " m²") + " · perímetro " + n(comp(g.coordinates[0]), 0) + " m"; }
    return "";
  }

  // ---------- relevo (mosaicos de elevação, 512 px) ----------
  function mx(l) { return (l + 180) / 360; }
  function my(f) { var s = Math.sin(f * Math.PI / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); }
  function ilat(y) { return 360 / Math.PI * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - 90; }
  function relevo(c, raio, zmax) {
    var dl = raio / (111320 * Math.cos(c[1] * Math.PI / 180)), df = raio / 110540;
    var b = [c[0] - dl, c[1] - df, c[0] + dl, c[1] + df], x0 = mx(b[0]), x1 = mx(b[2]), y0 = my(b[3]), y1 = my(b[1]), z;
    for (z = zmax || 15; z >= 9; z--) { var N = Math.pow(2, z); if ((Math.floor(x1 * N) - Math.floor(x0 * N) + 1) * (Math.floor(y1 * N) - Math.floor(y0 * N) + 1) <= 9) break; }
    var N2 = Math.pow(2, z), tx0 = Math.floor(x0 * N2), tx1 = Math.floor(x1 * N2), ty0 = Math.floor(y0 * N2), ty1 = Math.floor(y1 * N2);
    var G = { z: z, x0: tx0 / N2, y0: ty0 / N2, w: (tx1 - tx0 + 1) / N2, h: (ty1 - ty0 + 1) / N2, W: (tx1 - tx0 + 1) * 512, H: (ty1 - ty0 + 1) * 512 };
    G.pxM = G.w / G.W * 40075016.686 * Math.cos(c[1] * Math.PI / 180);
    var cv = D.createElement("canvas"); cv.width = G.W; cv.height = G.H; var x = cv.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false;
    var ts = []; for (var i = tx0; i <= tx1; i++) for (var j = ty0; j <= ty1; j++) ts.push([i, j]);
    return Promise.all(ts.map(function (t) {
      return fetch(DEM.replace("{z}", z).replace("{x}", t[0]).replace("{y}", t[1])).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(createImageBitmap)
        .then(function (im) { x.drawImage(im, (t[0] - tx0) * 512, (t[1] - ty0) * 512, 512, 512); }).catch(function () {});
    })).then(function () {
      var d = x.getImageData(0, 0, G.W, G.H).data, a = new Float32Array(G.W * G.H), ok = new Uint8Array(G.W * G.H);
      for (var k = 0; k < a.length; k++) if (d[k * 4 + 3] === 255) { a[k] = 256 * d[k * 4] + d[k * 4 + 1] + d[k * 4 + 2] / 256 - 32768; ok[k] = a[k] > -500 && a[k] < 3000 ? 1 : 0; }
      G.a = a; G.ok = ok;
      G.px = function (p) { return [(mx(p[0]) - G.x0) / G.w * G.W, (my(p[1]) - G.y0) / G.h * G.H]; };
      G.ll = function (px, py) { return [(G.x0 + px / G.W * G.w) * 360 - 180, ilat(G.y0 + py / G.H * G.h)]; };
      G.z_ = function (p) { var q = G.px(p), xi = Math.max(0, Math.min(G.W - 2, Math.floor(q[0]))), yi = Math.max(0, Math.min(G.H - 2, Math.floor(q[1]))), fx = q[0] - xi, fy = q[1] - yi, i0 = yi * G.W + xi; return a[i0] * (1 - fx) * (1 - fy) + a[i0 + 1] * fx * (1 - fy) + a[i0 + G.W] * (1 - fx) * fy + a[i0 + G.W + 1] * fx * fy; };
      return G;
    });
  }
  function declive(G, p) {
    var q = G.px(p), i = Math.round(q[1]) * G.W + Math.round(q[0]), a = G.a, Wp = G.W;
    var sx = (a[i + 1] - a[i - 1]) / (2 * G.pxM), sy = (a[i + Wp] - a[i - Wp]) / (2 * G.pxM);
    var s = 100 * Math.sqrt(sx * sx + sy * sy), asp = (Math.atan2(-sx, sy) * 180 / Math.PI + 360) % 360;
    var R8 = ["Norte", "Nordeste", "Este", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"];
    return { pct: s, exp: s < 2 ? "Plano" : R8[Math.round(asp / 45) % 8] };
  }

  // ---------- armazenamento e camadas ----------
  var FC = { type: "FeatureCollection", features: [] };
  try { var g0 = JSON.parse(W.localStorage.getItem(CHAVE) || "null"); if (g0 && g0.features) FC = g0; } catch (e) {}
  var AN = { type: "FeatureCollection", features: [] };
  function guardar() { try { W.localStorage.setItem(CHAVE, JSON.stringify(FC)); } catch (e) { aviso("O desenho é grande demais para guardar neste navegador; exporte-o."); } pintar(); contagem(); }
  function pintar() { var M = mapa(); if (!M) return; var s = M.getSource("ipr-dz"); if (s) s.setData(FC); var t = M.getSource("ipr-an"); if (t) t.setData(AN); }
  function camadas() {
    var M = mapa(); if (!M || !M.getStyle) return false;
    if (M.getSource("ipr-dz")) return true;
    try { M.getStyle(); } catch (e) { return false; }
    M.addSource("ipr-dz", { type: "geojson", data: FC });
    M.addSource("ipr-an", { type: "geojson", data: AN });
    M.addLayer({ id: "ipr-an-f", type: "fill", source: "ipr-an", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["coalesce", ["get", "cor"], "#3d8fd6"], "fill-opacity": 0.18 } });
    M.addLayer({ id: "ipr-an-l", type: "line", source: "ipr-an", paint: { "line-color": ["coalesce", ["get", "cor"], "#3d8fd6"], "line-width": ["coalesce", ["get", "w"], 2.5], "line-dasharray": [1, 0] } });
    M.addLayer({ id: "ipr-dz-f", type: "fill", source: "ipr-dz", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["get", "cor"], "fill-opacity": ["coalesce", ["get", "op"], 0.22] } });
    M.addLayer({ id: "ipr-dz-l", type: "line", source: "ipr-dz", filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": ["get", "cor"], "line-width": 2.4 } });
    M.addLayer({ id: "ipr-dz-p", type: "circle", source: "ipr-dz", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": ["get", "cor"], "circle-radius": 6, "circle-stroke-color": "#11160d", "circle-stroke-width": 1.5 } });
    M.addLayer({ id: "ipr-dz-t", type: "symbol", source: "ipr-dz", minzoom: 15, layout: { "text-field": ["get", "sub"], "text-size": 11, "text-offset": [0, 1.2], "text-anchor": "top", "text-optional": true }, paint: { "text-color": "#f2f0e6", "text-halo-color": "#11160d", "text-halo-width": 1.2 } });
    ["ipr-dz-f", "ipr-dz-l", "ipr-dz-p"].forEach(function (l) {
      M.on("click", l, function (e) { if (armado) return; var f = e.features && e.features[0]; if (f) ficha(f, e.lngLat); });
      M.on("mouseenter", l, function () { if (!armado) M.getCanvas().style.cursor = "pointer"; });
      M.on("mouseleave", l, function () { if (!armado) M.getCanvas().style.cursor = ""; });
    });
    return true;
  }

  // ---------- interface ----------
  var CSS =
    "#ipr-trb{position:fixed;z-index:2147480050;display:none;flex-direction:column;align-items:center;gap:6px;transform:translateX(-50%);max-width:min(1100px,calc(100vw - 1300px));min-width:520px}" +
    "#ipr-trb.on{display:flex}" +
    "#ipr-trb .fx{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(13,17,11,.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 14px 32px -12px rgba(0,0,0,.6)}" +
    "#ipr-trb button{height:30px;padding:0 13px;border-radius:999px;border:0;background:none;color:#bdbcb0;font:450 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}" +
    "#ipr-trb button:hover{color:#f2f0e6;background:rgba(255,255,255,.06)}" +
    "#ipr-trb button.on{background:rgba(236,234,224,.94);color:#11160d;font-weight:550}" +
    "#ipr-trb button.ac{background:rgba(148,190,57,.18);color:#d3e79b}" +
    "#ipr-trb .sq{width:8px;height:8px;border-radius:2px;display:inline-block}" +
    "#ipr-trb .sep{width:1px;height:16px;background:rgba(255,255,255,.1);margin:0 4px}" +
    "#ipr-trb .lb{font:500 10px 'Geist Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:#8d907f;padding:0 8px 0 10px}" +
    "#ipr-trb-med{position:fixed;z-index:2147480050;padding:6px 12px;border-radius:999px;background:rgba(13,17,11,.85);color:#e6e4d9;font:500 12px 'Geist Mono',ui-monospace,monospace;pointer-events:none;display:none;border:1px solid rgba(255,255,255,.1)}" +
    "#ipr-trb-c{position:fixed;z-index:2147480060;width:340px;max-height:70vh;overflow:auto;padding:16px;border-radius:16px;background:rgba(13,17,11,.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);box-shadow:0 18px 40px -10px rgba(0,0,0,.6);color:#e6e4d9;font:13px/1.5 Geist,Inter,system-ui,sans-serif;display:none}" +
    "#ipr-trb-c.on{display:block}" +
    "#ipr-trb-c h4{margin:0 26px 8px 0;font:550 14px Geist,Inter,system-ui,sans-serif;letter-spacing:-.01em}" +
    "#ipr-trb-c .x{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.06);color:#e6e4d9;cursor:pointer}" +
    "#ipr-trb-c dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:8px 0}#ipr-trb-c dt{color:#8d907f}#ipr-trb-c dd{margin:0}" +
    "#ipr-trb-c label{display:flex;flex-direction:column;gap:3px;margin:8px 0 0;font-size:11.5px;color:#a9ab98}" +
    "#ipr-trb-c input,#ipr-trb-c select,#ipr-trb-c textarea{font:13px Geist,Inter,system-ui,sans-serif;color:#e6e4d9;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 8px}" +
    "#ipr-trb-c .bt{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}" +
    "#ipr-trb-c .bt button{height:32px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:none;color:#e6e4d9;font:500 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-trb-c .bt button.p{background:#94BE39;color:#11160d;border:0}" +
    "#ipr-trb-c .nt{color:#8d907f;font-size:11.5px;margin:8px 0 0}" +
    "#ipr-trb-c img{max-width:100%;border-radius:8px;margin-top:8px}";

  var estado = { modo: "", forma: "l", tipo: "agua", sub: "" }, armado = null, gravar = null;
  function ui() {
    if ($("ipr-trb")) return;
    var s = D.createElement("style"); s.id = "ipr-trb-css"; s.textContent = CSS; D.head.appendChild(s);
    var b = D.createElement("div"); b.id = "ipr-trb"; D.body.appendChild(b);
    var m = D.createElement("div"); m.id = "ipr-trb-med"; D.body.appendChild(m);
    var c = D.createElement("div"); c.id = "ipr-trb-c"; D.body.appendChild(c);
    b.addEventListener("click", clique);
  }
  function aviso(t) { var M = $("ipr-trb-med"); if (!M) return; M.textContent = t; M.style.display = "block"; posMed(); clearTimeout(aviso.t); aviso.t = setTimeout(function () { M.style.display = "none"; }, 4000); }
  function posMed() { var b = $("ipr-trb"), M = $("ipr-trb-med"); if (!b || !M) return; var r = b.getBoundingClientRect(); M.style.left = Math.round(r.left + r.width / 2 - M.offsetWidth / 2) + "px"; M.style.top = Math.round((r.height ? r.bottom : 140) + 8) + "px"; }

  function render() {
    var b = $("ipr-trb"); if (!b) return;
    var h = "";
    if (estado.modo === "Desenhar") {
      var T = TIPOS[estado.tipo], L = T[estado.forma];
      h += '<div class="fx"><span class="lb">Forma</span>' +
        [["p", "Ponto"], ["l", "Linha"], ["g", "Polígono"]].map(function (f) { return '<button type="button" data-f="' + f[0] + '" class="' + (estado.forma === f[0] ? "on" : "") + '">' + f[1] + "</button>"; }).join("") +
        '<span class="sep"></span><span class="lb">Tipo</span>' +
        Object.keys(TIPOS).map(function (k) { return '<button type="button" data-t="' + k + '" class="' + (estado.tipo === k ? "on" : "") + '"><span class="sq" style="background:' + TIPOS[k].cor + '"></span>' + TIPOS[k].n + "</button>"; }).join("") + "</div>";
      h += '<div class="fx">' + L.map(function (x) { return '<button type="button" data-s="' + esc(x) + '" class="' + (estado.sub === x && armado ? "ac" : "") + '">' + esc(x) + "</button>"; }).join("") +
        '<span class="sep"></span><button type="button" data-a="desfazer">Desfazer</button><button type="button" data-a="exportar">Exportar</button><button type="button" data-a="limpar">Limpar</button><span class="lb" id="ipr-tr-n"></span></div>';
    } else if (estado.modo === "Analisar") {
      h += '<div class="fx"><span class="lb">Novo</span>' +
        [["aqui", "O que há aqui"], ["caminho", "Caminho da água"], ["bacia", "Bacia a partir de um ponto"]].map(function (x) { return '<button type="button" data-n="' + x[0] + '" class="' + (armado && armado.k === x[0] ? "ac" : "") + '">' + x[1] + "</button>"; }).join("") +
        '<span class="sep"></span><button type="button" data-a="limpar-an">Limpar análise</button></div>';
    } else if (estado.modo === "Recolher") {
      h += '<div class="fx"><span class="lb">Fichas de campo</span>' +
        Object.keys(RECOLHA).map(function (k) { return '<button type="button" data-r="' + k + '"><span class="sq" style="background:' + RECOLHA[k].cor + '"></span>' + RECOLHA[k].n + "</button>"; }).join("") +
        '<span class="sep"></span><button type="button" data-a="percurso" class="' + (gravar ? "ac" : "") + '">' + (gravar ? "Parar o percurso" : "Gravar percurso") + '</button><button type="button" data-a="exportar">Exportar</button></div>';
    }
    b.innerHTML = h; contagem();
  }
  function contagem() { var e = $("ipr-tr-n"); if (e) e.textContent = FC.features.length ? FC.features.length + " no desenho" : ""; }

  function clique(e) {
    var x = e.target.closest("button"); if (!x) return;
    var f = x.getAttribute("data-f"), t = x.getAttribute("data-t"), s = x.getAttribute("data-s"), a = x.getAttribute("data-a"), nn = x.getAttribute("data-n"), r = x.getAttribute("data-r");
    if (f) { estado.forma = f; estado.sub = ""; desarmar(); render(); return; }
    if (t) { estado.tipo = t; estado.sub = ""; desarmar(); render(); return; }
    if (s) { estado.sub = s; armarDesenho(); render(); return; }
    if (nn) { armarClique(nn); render(); return; }
    if (r) { recolher(r); return; }
    if (a === "desfazer") { var u = FC.features.pop(); if (u) { guardar(); aviso("Desfeito: " + (u.properties.sub || "")); } else aviso("Não há nada para desfazer."); }
    else if (a === "exportar") exportar();
    else if (a === "limpar") pedirLimpar();
    else if (a === "limpar-an") { AN.features = []; pintar(); fecharC(); }
    else if (a === "percurso") percurso();
  }

  // ---------- Desenhar ----------
  var MODOS = { p: "draw_point", l: "draw_line_string", g: "draw_polygon" };
  function desarmar() {
    var dr = desenho(); armado = null;
    try { if (dr && dr.getMode && dr.getMode().indexOf("draw_") === 0) dr.changeMode("simple_select"); } catch (e) {}
    var M = mapa(); if (M) M.getCanvas().style.cursor = "";
    var m = $("ipr-trb-med"); if (m) m.style.display = "none";
  }
  function armarDesenho() {
    var dr = desenho(); desarmar();
    if (estado.tipo === "agua" && estado.forma === "l" && /curva de nível|keyline/i.test(estado.sub)) { armarClique("curva"); aviso("Clique no ponto de partida: a linha segue a cota desse ponto."); return; }
    if (!dr) { aviso("O desenho ainda não está pronto; tente daqui a nada."); return; }
    armado = { k: "draw", tipo: estado.tipo, sub: estado.sub, forma: estado.forma };
    try { dr.changeMode(MODOS[estado.forma]); } catch (e) { aviso("Não consegui abrir o desenho."); armado = null; return; }
    aviso(estado.forma === "p" ? "Clique no mapa para pôr o ponto." : "Clique para cada vértice; duplo clique para acabar.");
  }
  function criado(e) {
    if (!armado || armado.k !== "draw") return;
    var dr = desenho(), fs = (e && e.features) || [];
    fs.forEach(function (f) {
      try { dr.delete(f.id); } catch (x) {}
      var a = armado, T = TIPOS[a.tipo];
      var nf = { type: "Feature", geometry: f.geometry, properties: { tipo: a.tipo, tn: T.n, sub: a.sub, cor: T.cor, t: Date.now(), op: a.sub === "Faixa de combustível" ? 0.12 : 0.22 } };
      FC.features.push(nf); guardar();
      depois(nf);
    });
    armado = null; render();
    var m = $("ipr-trb-med"); if (m) m.style.display = "none";
  }
  function aoVivo() {
    if (!armado || armado.k !== "draw" || armado.forma === "p") return;
    var dr = desenho(); if (!dr) return;
    var all = dr.getAll().features, f = all[all.length - 1]; if (!f) return;
    var t = txtMed(f.geometry); if (!t) return;
    var m = $("ipr-trb-med"); m.textContent = t; m.style.display = "block"; posMed();
  }
  function depois(f) {
    var s = f.properties.sub, g = f.geometry;
    if (g.type === "Polygon" && f.properties.tipo === "agua" && /charca|bacia de retenção/i.test(s)) return charca(f);
    if (g.type === "LineString" && f.properties.tipo === "acessos") return caminhoDeclive(f, 8);
    if (g.type === "LineString" && /linha de plantação/i.test(s)) return plantacao(f);
    ficha(f);
  }

  // seguir a curva de nível
  function curva(p) {
    aviso("A calcular a curva de nível…");
    return Promise.all([relevo(p, 700, 13), d3c()]).then(function (r) {
      var G = r[0], d3 = r[1], z0 = G.z_(p);
      if (!isFinite(z0)) throw new Error("sem relevo aqui");
      // alisa o relevo (média 3×3) para a curva não se partir em ruído
      var Wp = G.W, a = G.a, arr = new Array(a.length);
      for (var y = 0; y < G.H; y++) for (var x = 0; x < Wp; x++) { var sm = 0, c = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= G.H || xx >= Wp) continue; sm += a[yy * Wp + xx]; c++; } arr[y * Wp + x] = sm / c; }
      var cs = d3.contours().size([G.W, G.H]).thresholds([z0])(arr)[0];
      var q = G.px(p), best = null;
      (cs.coordinates || []).forEach(function (poly) { poly.forEach(function (ring) {
        var dm = 1e9, im = 0; ring.forEach(function (pt, i) { var d = (pt[0] - q[0]) * (pt[0] - q[0]) + (pt[1] - q[1]) * (pt[1] - q[1]); if (d < dm) { dm = d; im = i; } });
        var perto = dm < 9; // a menos de 3 píxeis
        if (!best || (perto && (!best.perto || ring.length > best.ring.length)) || (!perto && !best.perto && dm < best.d)) best = { d: dm, ring: ring, i: im, perto: perto };
      }); });
      if (!best) throw new Error("sem curva");
      var ring = best.ring, Lr = ring.length, borda = function (pt) { return pt[0] <= 1 || pt[1] <= 1 || pt[0] >= G.W - 1 || pt[1] >= G.H - 1; };
      var out = [ring[best.i]], i, k;
      for (k = 1; k < Lr; k++) { i = (best.i + k) % Lr; if (borda(ring[i])) break; out.push(ring[i]); }
      var tras = [];
      for (k = 1; k < Lr; k++) { i = (best.i - k + Lr) % Lr; if (borda(ring[i])) break; tras.push(ring[i]); if (out.length + tras.length >= Lr) break; }
      var pts = tras.reverse().concat(out).filter(function (pt, j, arr2) { var k2 = Math.max(1, Math.round(arr2.length / 600)); return j % k2 === 0 || j === arr2.length - 1; }).map(function (pt) { return G.ll(pt[0], pt[1]); });
      if (pts.length < 2) throw new Error("curva curta");
      var T = TIPOS.agua, nf = { type: "Feature", geometry: { type: "LineString", coordinates: pts }, properties: { tipo: "agua", tn: T.n, sub: estado.sub || "Vala em curva de nível", cor: T.cor, cota: Math.round(z0 * 10) / 10, t: Date.now() } };
      FC.features.push(nf); guardar();
      cartao("Curva de nível", "<dl><dt>Cota</dt><dd>" + n(z0, 1) + " m</dd><dt>Comprimento</dt><dd>" + n(comp(pts), 0) + " m</dd><dt>Resolução</dt><dd>" + n(G.pxM, 1) + " m</dd></dl><p class='nt'>A linha segue a mesma cota até 700 m do ponto. Para a keyline, desloque-a ligeiramente para fora do vale no terreno.</p>");
    }).catch(function (e) { aviso("Não consegui traçar a curva: " + (e && e.message || "erro")); });
  }

  // volume da charca
  function charca(f, cota) {
    var g = f.geometry.coordinates[0], c = centro(g), raio = Math.max(60, maxDist(c, g) * 1.3);
    relevo(c, raio, 15).then(function (G) {
      var anel = g.map(G.px), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      anel.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      var bordo = g.map(G.z_), zmin = Math.min.apply(null, bordo), fundo = 1e9, cel = [];
      for (var y = Math.floor(y0); y <= Math.ceil(y1); y++) for (var x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        if (x < 0 || y < 0 || x >= G.W || y >= G.H) continue;
        if (!dentro([x + 0.5, y + 0.5], anel)) continue; var v = G.a[y * G.W + x]; cel.push(v); fundo = Math.min(fundo, v);
      }
      var cd = cota == null ? zmin : cota, vol = 0, ar = 0, px2 = G.pxM * G.pxM;
      cel.forEach(function (v) { if (v < cd) { vol += (cd - v) * px2; ar += px2; } });
      f.properties.cota = Math.round(cd * 10) / 10; f.properties.volume = Math.round(vol); guardar();
      cartao(f.properties.sub, "<dl><dt>Área do desenho</dt><dd>" + n(area(g), 0) + " m²</dd><dt>Fundo (relevo actual)</dt><dd>" + n(fundo, 1) + " m</dd><dt>Cota do descarregador</dt><dd><input id='ipr-tr-cota' type='number' step='0.1' value='" + cd.toFixed(1) + "' style='width:90px'> m</dd><dt>Área inundada</dt><dd>" + n(ar, 0) + " m²</dd><dt>Volume armazenado</dt><dd><b>" + n(vol, 0) + " m³</b></dd></dl><p class='nt'>Calculado sobre o relevo actual (" + n(G.pxM, 1) + " m por píxel), sem escavação. A cota proposta é a do ponto mais baixo do contorno desenhado.</p>",
        [["Recalcular", function () { var v = parseFloat($("ipr-tr-cota").value); if (isFinite(v)) charca(f, v); }, 1], ["Bacia que a alimenta", function () { bacia(menor(g, G)); }]]);
    }).catch(function () { ficha(f); });
  }
  function menor(g, G) { var b = g[0], zb = 1e9; g.forEach(function (p) { var z = G.z_(p); if (z < zb) { zb = z; b = p; } }); return b; }
  function centro(g) { var x = 0, y = 0; g.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / g.length, y / g.length]; }
  function maxDist(c, g) { var m = 0; g.forEach(function (p) { m = Math.max(m, dist(c, p)); }); return m; }
  function dentro(p, anel) { var c = false; for (var i = 0, j = anel.length - 1; i < anel.length; j = i++) { var a = anel[i], b = anel[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

  // declive do caminho
  function caminhoDeclive(f, max) {
    var cs = f.geometry.coordinates, L = comp(cs), c = cs[Math.floor(cs.length / 2)];
    relevo(c, Math.min(2500, L * 0.6 + 80), 15).then(function (G) {
      var pts = [], passo = Math.max(5, G.pxM * 2);
      for (var i = 1; i < cs.length; i++) { var d = dist(cs[i - 1], cs[i]), k = Math.max(1, Math.round(d / passo)); for (var j = 0; j < k; j++) { var t = j / k; pts.push([cs[i - 1][0] + (cs[i][0] - cs[i - 1][0]) * t, cs[i - 1][1] + (cs[i][1] - cs[i - 1][1]) * t]); } }
      pts.push(cs[cs.length - 1]);
      var z = pts.map(G.z_), maxd = 0, sub = 0, desc = 0, ingr = [], seg = null;
      for (var q = 1; q < pts.length; q++) {
        var dd = dist(pts[q - 1], pts[q]), dz = z[q] - z[q - 1], s = dd > 0 ? 100 * dz / dd : 0;
        if (dz > 0) sub += dz; else desc -= dz;
        var j0 = Math.max(0, q - 3), sl = Math.abs(100 * (z[q] - z[j0]) / Math.max(1, dist(pts[j0], pts[q])));
        maxd = Math.max(maxd, sl);
        if (sl > max) { if (!seg) { seg = [pts[q - 1]]; ingr.push(seg); } seg.push(pts[q]); } else seg = null;
      }
      AN.features = AN.features.filter(function (x) { return x.properties.de !== f.properties.t; });
      ingr.forEach(function (s) { if (s.length > 1) AN.features.push({ type: "Feature", geometry: { type: "LineString", coordinates: s }, properties: { cor: "#e5484d", w: 5, de: f.properties.t } }); });
      pintar();
      var mt = 0; ingr.forEach(function (s) { mt += comp(s); });
      f.properties.declive_max = Math.round(maxd * 10) / 10; guardar();
      cartao(f.properties.sub, "<dl><dt>Comprimento</dt><dd>" + n(L, 0) + " m</dd><dt>Sobe / desce</dt><dd>" + n(sub, 0) + " m / " + n(desc, 0) + " m</dd><dt>Declive máximo</dt><dd><b>" + n(maxd, 1) + " %</b></dd><dt>Acima de " + max + " %</dt><dd>" + n(mt, 0) + " m (a vermelho)</dd><dt>Declive limite</dt><dd><input id='ipr-tr-max' type='number' value='" + max + "' style='width:70px'> %</dd></dl>",
        [["Recalcular", function () { var v = parseFloat($("ipr-tr-max").value); if (isFinite(v)) caminhoDeclive(f, v); }, 1]]);
    }).catch(function () { ficha(f); });
  }

  // linhas de plantação
  function plantacao(f, esp, nl, arv) {
    esp = esp || 6; nl = nl || 5; arv = arv || 4;
    cartao("Linha de plantação", "<label>Distância entre linhas (m)<input id='ipr-tr-e' type='number' value='" + esp + "'></label><label>Número de linhas<input id='ipr-tr-nl' type='number' value='" + nl + "'></label><label>Distância entre árvores na linha (m)<input id='ipr-tr-a' type='number' value='" + arv + "'></label><p class='nt'>As linhas repetem a desenhada para o lado de baixo e de cima, com a distância escolhida.</p>",
      [["Criar linhas", function () {
        var e = +$("ipr-tr-e").value || 6, k = Math.max(1, Math.min(60, +$("ipr-tr-nl").value || 5)), a = +$("ipr-tr-a").value || 4;
        turf().then(function (T) {
          var base = T.lineString(f.geometry.coordinates), tot = 0, novas = [];
          for (var i = 1; i < k; i++) { var o = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * e; try { novas.push(T.lineOffset(base, o, { units: "meters" })); } catch (x) {} }
          [f].concat(novas.map(function (l) { return { type: "Feature", geometry: l.geometry, properties: { tipo: "veg", tn: TIPOS.veg.n, sub: "Linha de plantação", cor: TIPOS.veg.cor, t: Date.now() } }; })).forEach(function (l, j) { if (j) FC.features.push(l); tot += Math.floor(comp(l.geometry.coordinates) / a) + 1; });
          guardar();
          cartao("Linhas de plantação", "<dl><dt>Linhas</dt><dd>" + k + "</dd><dt>Entre linhas</dt><dd>" + e + " m</dd><dt>Entre árvores</dt><dd>" + a + " m</dd><dt>Árvores</dt><dd><b>" + n(tot, 0) + "</b></dd></dl>");
        }).catch(function () { aviso("Não consegui carregar a geometria."); });
      }, 1]]);
  }

  // faixa à volta
  function faixa(f, m) {
    turf().then(function (T) {
      var b = T.buffer(f, m, { units: "meters" }); if (!b) return;
      var nf = { type: "Feature", geometry: b.geometry, properties: { tipo: "lim", tn: TIPOS.lim.n, sub: "Faixa de " + m + " m", cor: "#e5484d", op: 0.1, t: Date.now() } };
      FC.features.push(nf); guardar(); aviso("Faixa de " + m + " m criada.");
    }).catch(function () { aviso("Não consegui carregar a geometria."); });
  }

  // ---------- Analisar ----------
  function armarClique(k) {
    desarmar(); var M = mapa(); if (!M) return;
    armado = { k: k }; M.getCanvas().style.cursor = "crosshair";
    if (k !== "curva") aviso(k === "aqui" ? "Clique no ponto que quer conhecer." : k === "caminho" ? "Clique onde cai a água." : "Clique no vale ou na charca: o Atlas desenha a área que drena para lá.");
  }
  function cliqueMapa(e) {
    if (!armado || armado.k === "draw") return;
    var k = armado.k, p = [e.lngLat.lng, e.lngLat.lat];
    armado = null; var M = mapa(); M.getCanvas().style.cursor = ""; render();
    if (k === "aqui") aqui(p); else if (k === "caminho") caminhoAgua(p); else if (k === "bacia") bacia(p); else if (k === "curva") curva(p);
    else if (RECOLHA[k]) fichaCampo(k, p);
  }

  function aqui(p) {
    cartao("O que há aqui", "<p class='nt'>A consultar o relevo, o PDM, o cadastro e a ocupação do solo…</p>");
    var d = 0.00012, bb = [p[0] - d, p[1] - d, p[0] + d, p[1] + d].map(function (v) { return v.toFixed(6); }).join(",");
    function ogc(col) { return fetch(OGC + col + "/items?f=json&limit=20&bbox=" + bb, { headers: { Accept: "application/geo+json" } }).then(function (r) { return r.ok ? r.json() : { features: [] }; }).then(function (j) { return (j.features || []).filter(function (f) { return f.geometry && contem(f.geometry, p); }).map(function (f) { return f.properties || {}; }); }).catch(function () { return null; }); }
    var M = mapa(), vis = [];
    try { var px = M.project(p), seen = {}; M.queryRenderedFeatures([[px.x - 3, px.y - 3], [px.x + 3, px.y + 3]]).forEach(function (f) { var id = f.layer && f.layer.id; if (!id || /^ipr-dz|^ipr-an|^gl-draw|^mapbox-gl-draw/.test(id) || f.layer.type === "symbol") return; var nome = (f.properties && (f.properties.nome || f.properties.name || f.properties.designacao)) || ""; var k = id + nome; if (seen[k]) return; seen[k] = 1; vis.push(nomeCamada(id) + (nome ? ": " + nome : "")); }); } catch (e) {}
    Promise.all([relevo(p, 60, 15).catch(function () { return null; }), ogc("crus"), ogc("cadastro"), ogc("cos2023v1"), ogc("freguesias")]).then(function (r) {
      var G = r[0], h = "<dl>";
      h += "<dt>Coordenadas</dt><dd>" + p[1].toFixed(5) + ", " + p[0].toFixed(5) + "</dd>";
      if (G) { var z = G.z_(p), dc = declive(G, p); h += "<dt>Altitude</dt><dd>" + n(z, 0) + " m</dd><dt>Declive</dt><dd>" + n(dc.pct, 1) + " %</dd><dt>Exposição</dt><dd>" + dc.exp + "</dd>"; }
      var fr = r[4] && r[4][0]; if (fr) h += "<dt>Freguesia</dt><dd>" + esc(fr.freguesia || fr.nome || "") + (fr.municipio ? " · " + esc(fr.municipio) : "") + "</dd>";
      var cr = r[1] && r[1][0]; h += "<dt>PDM (CRUS)</dt><dd>" + (cr ? esc(cr.designacao_no_plano || cr.categoria_2021 || "") + (cr.classe_2021 ? " · " + esc(cr.classe_2021) : "") : r[1] ? "sem classe publicada aqui" : "não respondeu") + "</dd>";
      var ca = r[2] && r[2][0]; h += "<dt>Cadastro</dt><dd>" + (ca ? esc(ca.nationalcadastralreference || ca.nationalCadastralReference || ca.inspireid || ca.label || "parcela") + (ca.areavalue ? " · " + n(ca.areavalue / 1e4, 2) + " ha" : "") : r[2] ? "sem parcela no cadastro aqui" : "não respondeu") + "</dd>";
      var co = r[3] && r[3][0]; h += "<dt>Uso do solo (COS 2023)</dt><dd>" + (co ? esc(co.cos23_n4_l || co.COS23_n4_L || co.legenda || co.designacao || JSON.stringify(co).slice(0, 60)) : r[3] ? "—" : "não respondeu") + "</dd>";
      h += "</dl>";
      if (vis.length) h += "<p class='nt'>Camadas ligadas neste ponto:</p><ul style='margin:4px 0 0 16px;padding:0'>" + vis.slice(0, 12).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>";
      h += "<p class='nt'>Fontes: DGT (CRUS, cadastro, COS 2023, CAOP) e relevo LiDAR/Copernicus. Informação indicativa; quem decide é a Câmara.</p>";
      cartao("O que há aqui", h);
      AN.features = AN.features.filter(function (x) { return x.properties.k !== "aqui"; });
      AN.features.push({ type: "Feature", geometry: { type: "Point", coordinates: p }, properties: { k: "aqui" } }); pintar();
    });
  }
  function contem(g, p) { var ps = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; return ps.some(function (pl) { return dentro(p, pl[0]) && !pl.slice(1).some(function (h) { return dentro(p, h); }); }); }
  function nomeCamada(id) {
    var el = D.querySelector('[data-cam="' + id + '"], [data-id="' + id + '"], [data-k="' + id + '"]');
    var t = el && (el.closest("label") || el).textContent; return (t && t.trim().slice(0, 50)) || id;
  }

  var VIZ = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  function receptor(G) {
    var Wp = G.W, H = G.H, a = G.a, ok = G.ok, rec = new Int32Array(Wp * H).fill(-1), dg = Math.SQRT2;
    for (var y = 1; y < H - 1; y++) for (var x = 1; x < Wp - 1; x++) {
      var i = y * Wp + x; if (!ok[i]) continue; var best = 0, bi = -1;
      for (var k = 0; k < 8; k++) { var j = i + VIZ[k][1] * Wp + VIZ[k][0]; if (!ok[j]) continue; var s = (a[i] - a[j]) / (k % 2 ? dg : 1); if (s > best) { best = s; bi = j; } }
      rec[i] = bi;
    }
    return rec;
  }
  function caminhoAgua(p) {
    aviso("A seguir a água…");
    relevo(p, 1600, 14).then(function (G) {
      var q = G.px(p), i = Math.round(q[1]) * G.W + Math.round(q[0]), Wp = G.W, a = G.a, vis = {}, pts = [G.ll(q[0], q[1])], z0 = a[i];
      for (var passo = 0; passo < 6000; passo++) {
        vis[i] = 1; var x = i % Wp, y = (i / Wp) | 0; if (x < 2 || y < 2 || x > Wp - 3 || y > G.H - 3) break;
        var bi = -1, bz = a[i];
        for (var k = 0; k < 8; k++) { var j = i + VIZ[k][1] * Wp + VIZ[k][0]; if (!vis[j] && a[j] < bz) { bz = a[j]; bi = j; } }
        if (bi < 0) { // poça ou plano: procura a saída mais baixa até 6 píxeis
          var mz = 1e9; for (var dy = -6; dy <= 6; dy++) for (var dx = -6; dx <= 6; dx++) { var jj = i + dy * Wp + dx; if (jj < 0 || jj >= a.length || vis[jj]) continue; if (a[jj] < a[i] + 0.05 && a[jj] < mz && (dx || dy)) { mz = a[jj]; bi = jj; } }
          if (bi < 0) break;
        }
        i = bi; pts.push(G.ll(i % Wp + 0.5, ((i / Wp) | 0) + 0.5));
      }
      var L = comp(pts), zf = a[i];
      AN.features.push({ type: "Feature", geometry: { type: "LineString", coordinates: pts }, properties: { cor: "#3d8fd6", w: 3 } }); pintar();
      cartao("Caminho da água", "<dl><dt>Percurso</dt><dd>" + n(L, 0) + " m</dd><dt>Desce</dt><dd>" + n(z0 - zf, 1) + " m</dd><dt>Declive médio</dt><dd>" + n(L ? 100 * (z0 - zf) / L : 0, 1) + " %</dd></dl><p class='nt'>Segue sempre o vizinho mais baixo no relevo (" + n(G.pxM, 1) + " m por píxel), até 1,6 km do ponto ou até uma zona plana. Serve para localizar valas, entradas de charca e erosão.</p>");
    }).catch(function () { aviso("Não consegui ler o relevo aqui."); });
  }
  function bacia(p) {
    cartao("Bacia a partir de um ponto", "<p class='nt'>A calcular a área que drena para este ponto…</p>");
    Promise.all([relevo(p, 2200, 13), d3c()]).then(function (r) {
      var G = r[0], d3 = r[1], Wp = G.W, H = G.H, N = Wp * H, rec = receptor(G), a = G.a;
      // acumulação: ordena por altitude e soma para o receptor
      var ord = new Uint32Array(N); for (var k = 0; k < N; k++) ord[k] = k;
      ord.sort(function (x, y) { return a[y] - a[x]; });
      var acc = new Float32Array(N).fill(1); for (k = 0; k < N; k++) { var c = ord[k], t = rec[c]; if (t >= 0) acc[t] += acc[c]; }
      var q = G.px(p), cx = Math.round(q[0]), cy = Math.round(q[1]), alvo = cy * Wp + cx, ba = 0, rr = Math.max(2, Math.round(25 / G.pxM));
      for (var dy = -rr; dy <= rr; dy++) for (var dx = -rr; dx <= rr; dx++) { var j = (cy + dy) * Wp + cx + dx; if (j >= 0 && j < N && acc[j] > ba) { ba = acc[j]; alvo = j; } }
      var m = new Uint8Array(N), fila = [alvo], borda = false; m[alvo] = 1;
      while (fila.length) { var i = fila.pop(), x = i % Wp, y = (i / Wp) | 0; if (x < 2 || y < 2 || x > Wp - 3 || y > H - 3) borda = true;
        for (var v = 0; v < 8; v++) { var nb = i + VIZ[v][1] * Wp + VIZ[v][0]; if (nb >= 0 && nb < N && !m[nb] && rec[nb] === i) { m[nb] = 1; fila.push(nb); } } }
      var cnt = 0; for (k = 0; k < N; k++) cnt += m[k];
      var mm = Array.prototype.slice.call(m), cs = d3.contours().size([Wp, H]).thresholds([0.5])(mm)[0];
      var geom = { type: "MultiPolygon", coordinates: (cs.coordinates || []).map(function (pl) { return pl.map(function (ring) { return ring.map(function (pt) { return G.ll(pt[0], pt[1]); }); }); }) };
      var ha = cnt * G.pxM * G.pxM / 1e4, sai = G.ll(alvo % Wp + 0.5, ((alvo / Wp) | 0) + 0.5);
      AN.features.push({ type: "Feature", geometry: geom, properties: { cor: "#3d8fd6", w: 2 } });
      AN.features.push({ type: "Feature", geometry: { type: "Point", coordinates: sai }, properties: {} }); pintar();
      var mm2 = 600; // mm por ano, valor de referência para o Alentejo; o escoamento real depende do solo e do coberto
      cartao("Bacia a partir de um ponto", "<dl><dt>Área que drena</dt><dd><b>" + n(ha, 2) + " ha</b></dd><dt>Altitude máxima</dt><dd>" + n(maxM(a, m), 0) + " m</dd><dt>Saída</dt><dd>" + n(a[alvo], 0) + " m</dd><dt>Chuva caída (600 mm/ano)</dt><dd>" + n(ha * 1e4 * mm2 / 1000, 0) + " m³/ano</dd><dt>Escorrência (10 a 20 %)</dt><dd>" + n(ha * 1e4 * mm2 / 1000 * 0.1, 0) + " a " + n(ha * 1e4 * mm2 / 1000 * 0.2, 0) + " m³/ano</dd></dl>" +
        (borda ? "<p class='nt'><b>A bacia continua para lá de 2 km:</b> a área real é maior.</p>" : "") +
        "<p class='nt'>Calculada no relevo (" + n(G.pxM, 1) + " m por píxel). A escorrência é uma ordem de grandeza: depende do solo, do coberto e da chuva do ano.</p>");
    }).catch(function () { cartao("Bacia a partir de um ponto", "<p class='nt'>Não consegui ler o relevo aqui.</p>"); });
  }
  function maxM(a, m) { var v = -1e9; for (var i = 0; i < a.length; i++) if (m[i] && a[i] > v) v = a[i]; return v; }

  // ---------- Recolher ----------
  var CAMPOS = {
    solo: [["prof", "Profundidade (cm)", "number"], ["textura", "Textura", ["Arenosa", "Franco-arenosa", "Franca", "Franco-argilosa", "Argilosa", "Limosa"]], ["cor", "Cor", "text"], ["pedra", "Pedregosidade", ["Baixa", "Média", "Alta"]], ["garrafa", "Teste da garrafa (areia/limo/argila %)", "text"], ["amostra", "N.º da amostra", "text"]],
    aguaP: [["tipoA", "Tipo", ["Nascente", "Poço", "Furo", "Charca", "Linha de água", "Depósito"]], ["verao", "Tem água no verão", ["Sim", "Não", "Não sei"]], ["caudal", "Caudal estimado (L/min)", "number"]],
    arvore: [["esp", "Espécie", "text"], ["porte", "Porte", ["Pequeno", "Médio", "Grande", "Notável"]], ["estado", "Estado", ["Bom", "Razoável", "Mau", "Morta"]], ["manter", "Manter", ["Sim", "Não", "A decidir"]]],
    prob: [["tipoP", "Tipo", ["Erosão", "Ravina", "Entulho", "Invasoras", "Vedação partida", "Outro"]], ["grav", "Gravidade", ["Baixa", "Média", "Alta"]]]
  };
  function recolher(k) {
    var M = mapa();
    if (navigator.geolocation && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      aviso("A obter a sua posição…");
      navigator.geolocation.getCurrentPosition(function (pos) { var p = [pos.coords.longitude, pos.coords.latitude]; if (M) M.easeTo({ center: p, zoom: Math.max(M.getZoom(), 17) }); fichaCampo(k, p, pos.coords.accuracy); },
        function () { armarClique(k); aviso("Sem posição: clique no mapa onde está."); }, { enableHighAccuracy: true, timeout: 15000 });
    } else { armarClique(k); aviso("Clique no mapa onde fez a observação."); }
  }
  function fichaCampo(k, p, prec, f) {
    var R = RECOLHA[k], cps = CAMPOS[k], v = (f && f.properties) || {};
    var h = cps.map(function (c) {
      var id = "ipr-tr-" + c[0], val = v[c[0]] || "";
      if (Array.isArray(c[2])) return "<label>" + c[1] + "<select id='" + id + "'><option value=''>—</option>" + c[2].map(function (o) { return "<option" + (o === val ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></label>";
      return "<label>" + c[1] + "<input id='" + id + "' type='" + c[2] + "' value='" + esc(val) + "'></label>";
    }).join("") + "<label>Nota<textarea id='ipr-tr-nota' rows='2'>" + esc(v.nota || "") + "</textarea></label><label>Fotografia<input id='ipr-tr-foto' type='file' accept='image/*' capture='environment'></label>" +
      (v.foto ? "<img src='" + v.foto + "' alt='Fotografia'>" : "") +
      "<p class='nt'>" + p[1].toFixed(6) + ", " + p[0].toFixed(6) + (prec ? " · precisão " + Math.round(prec) + " m" : "") + "</p>";
    cartao(R.n, h, [["Guardar", function () {
      var props = f ? f.properties : { tipo: "campo", campo: k, tn: R.n, sub: R.n, cor: R.cor, t: Date.now(), prec: prec ? Math.round(prec) : null };
      cps.forEach(function (c) { var e = $("ipr-tr-" + c[0]); if (e) props[c[0]] = e.value; });
      props.nota = $("ipr-tr-nota").value;
      if (props.esp || props.tipoA || props.tipoP) props.sub = props.esp || props.tipoA || props.tipoP;
      var fi = $("ipr-tr-foto").files && $("ipr-tr-foto").files[0];
      (fi ? miniatura(fi) : Promise.resolve(null)).then(function (u) {
        if (u) props.foto = u;
        if (!f) FC.features.push({ type: "Feature", geometry: { type: "Point", coordinates: p }, properties: props });
        guardar(); fecharC(); aviso(R.n + " guardada.");
      });
    }, 1]]);
  }
  function miniatura(file) {
    return new Promise(function (ok) {
      var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var s = Math.min(1, 480 / Math.max(im.width, im.height)), c = D.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.7)); }; im.onerror = function () { ok(null); }; im.src = rd.result; }; rd.onerror = function () { ok(null); }; rd.readAsDataURL(file);
    });
  }
  function percurso() {
    if (gravar) { navigator.geolocation.clearWatch(gravar.id); var cs = gravar.cs; gravar = null; render();
      if (cs.length > 1) { FC.features.push({ type: "Feature", geometry: { type: "LineString", coordinates: cs }, properties: { tipo: "campo", campo: "percurso", tn: "Percurso", sub: "Percurso", cor: "#c9a36b", t: Date.now() } }); guardar(); aviso("Percurso guardado: " + n(comp(cs), 0) + " m."); }
      else aviso("Percurso sem pontos suficientes.");
      return; }
    if (!navigator.geolocation) { aviso("Este aparelho não dá a posição."); return; }
    gravar = { cs: [], id: navigator.geolocation.watchPosition(function (pos) { if (pos.coords.accuracy > 40) return; var p = [pos.coords.longitude, pos.coords.latitude], u = gravar && gravar.cs[gravar.cs.length - 1]; if (gravar && (!u || dist(u, p) > 4)) { gravar.cs.push(p); AN.features = AN.features.filter(function (x) { return x.properties.k !== "trk"; }); if (gravar.cs.length > 1) AN.features.push({ type: "Feature", geometry: { type: "LineString", coordinates: gravar.cs }, properties: { k: "trk", cor: "#c9a36b", w: 3 } }); pintar(); } }, function () { aviso("Sem posição."); }, { enableHighAccuracy: true }) };
    render(); aviso("A gravar o percurso. Carregue outra vez para parar.");
  }

  // ---------- cartão, ficha de um desenho, exportar ----------
  function cartao(t, h, bts) {
    var c = $("ipr-trb-c"); if (!c) return;
    c.innerHTML = "<button type='button' class='x' aria-label='Fechar'>×</button><h4>" + esc(t) + "</h4>" + h + (bts && bts.length ? "<div class='bt'>" + bts.map(function (b, i) { return "<button type='button' data-i='" + i + "' class='" + (b[2] ? "p" : "") + "'>" + esc(b[0]) + "</button>"; }).join("") + "</div>" : "");
    c.classList.add("on");
    var d = $("ipe-dir"), r = d && d.getBoundingClientRect();
    c.style.top = "150px"; c.style.right = Math.round(r && r.width ? W.innerWidth - r.left + 12 : 24) + "px";
    c.querySelector(".x").onclick = fecharC;
    [].forEach.call(c.querySelectorAll(".bt button"), function (b) { b.onclick = function () { bts[+b.getAttribute("data-i")][1](); }; });
  }
  function fecharC() { var c = $("ipr-trb-c"); if (c) c.classList.remove("on"); }
  function ficha(f, ll) {
    var real = FC.features.filter(function (x) { return x.properties.t === f.properties.t; })[0] || f, P = real.properties, g = real.geometry;
    if (P.tipo === "campo" && P.campo && CAMPOS[P.campo]) return fichaCampo(P.campo, g.coordinates, P.prec, real);
    var h = "<dl><dt>Tipo</dt><dd>" + esc(P.tn || "") + "</dd><dt>Subtipo</dt><dd>" + esc(P.sub || "") + "</dd>";
    var m = txtMed(g); if (m) h += "<dt>Medida</dt><dd>" + m + "</dd>";
    if (P.cota != null) h += "<dt>Cota</dt><dd>" + n(P.cota, 1) + " m</dd>";
    if (P.volume != null) h += "<dt>Volume</dt><dd>" + n(P.volume, 0) + " m³</dd>";
    if (P.declive_max != null) h += "<dt>Declive máximo</dt><dd>" + n(P.declive_max, 1) + " %</dd>";
    h += "</dl><label>Faixa à volta (m)<input id='ipr-tr-fx' type='number' value='" + (P.tipo === "edif" ? 50 : 10) + "'></label>";
    var bts = [["Faixa à volta", function () { var v = +$("ipr-tr-fx").value; if (v > 0) faixa(real, v); }, 1], ["Apagar", function () { FC.features = FC.features.filter(function (x) { return x !== real; }); guardar(); fecharC(); }]];
    if (g.type === "Polygon" && P.tipo === "agua") bts.splice(1, 0, ["Volume", function () { charca(real); }]);
    if (g.type === "LineString" && P.tipo === "acessos") bts.splice(1, 0, ["Declive", function () { caminhoDeclive(real, 8); }]);
    cartao(P.sub || P.tn || "Desenho", h, bts);
  }
  function exportar() {
    if (!FC.features.length) { aviso("O desenho está vazio."); return; }
    var b = new Blob([JSON.stringify(FC)], { type: "application/geo+json" }), a = D.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "IPR-Atlas-desenho-" + new Date().toISOString().slice(0, 10) + ".geojson"; D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function pedirLimpar() {
    if (!FC.features.length) { aviso("O desenho já está vazio."); return; }
    cartao("Limpar o desenho", "<p>Apagar os " + FC.features.length + " elementos deste desenho? Pode exportá-los antes.</p>", [["Exportar primeiro", exportar], ["Apagar tudo", function () { FC.features = []; guardar(); fecharC(); }, 1]]);
  }

  // ---------- ligar aos modos ----------
  function modoAtual() {
    var acc = $("ipr-modos-acc"); if (!acc || !acc.getClientRects().length) return "";
    var b = acc.querySelector("b"); var t = ((b && b.textContent) || acc.textContent || "").trim().split(":")[0];
    return { Analyse: "Analisar", Analyze: "Analisar", Draw: "Desenhar", Collect: "Recolher" }[t] || t;
  }
  function posicionar() {
    var acc = $("ipr-modos-acc"), b = $("ipr-trb"); if (!b) return;
    var r = acc && acc.getBoundingClientRect();
    if (r && r.width) { b.style.left = Math.round(r.left + r.width / 2) + "px"; b.style.top = Math.round(r.bottom + 6) + "px"; }
  }
  var ligado = false;
  function correr() {
    var M = mapa(); if (!M || !D.body) return;
    ui();
    if (!ligado) {
      ligado = true;
      M.on("click", cliqueMapa);
      M.on("draw.create", criado);
      M.on("draw.render", aoVivo);
      M.on("style.load", function () { setTimeout(camadas, 300); });
      D.addEventListener("keydown", function (e) { if (e.key === "Escape") { desarmar(); fecharC(); render(); } });
    }
    camadas();
    var m = modoAtual(), b = $("ipr-trb");
    if (m !== estado.modo) { estado.modo = m; if (!m) desarmar(); render(); }
    b.classList.toggle("on", !!m && /Desenhar|Analisar|Recolher/.test(m));
    if (m) posicionar();
  }
  (function vez(k) { try { correr(); } catch (e) {} if (k < 80) setTimeout(function () { vez(k + 1); }, 300); })(0);
  setInterval(function () { try { correr(); } catch (e) {} }, 700);
  W.__iprTrabalho = { aqui: aqui, bacia: bacia, caminho: caminhoAgua, curva: curva, FC: function () { return FC; } };
})();
