/* IPR Atlas · «Design Terracrua Design» em cada projecto de «Os meus projectos» (pedido do Nuno, 31/10/2026, 02h17:
   «Carreguei os ficheiros todos e não me aparece na Quinta da Boavista visualizar o projecto Terracrua Design. Devia ter
   Base Cartográfica e Terracrua Design, as duas.» e «Não percas os estilos, é muito importante.»).
   1. Cada projecto (encomenda da Base) passa a ter duas partes na barra da esquerda: «Base Cartográfica» (o minhas-bases.js,
      como estava) e «Design Terracrua Design» (este ficheiro). O minhas-bases.js chama window.IPRDesign.parte(m) no fim do
      corpo de cada projecto aberto.
   2. A parte Design lê os ficheiros convertidos do projecto (GET /tcd/v1/carregar?projecto=<encomenda>, m90353; só quem tem
      acesso ao projecto os recebe) e liga-os no mapa com as mesmas fontes «ipr-conv-<id>» do «Processar › Ficheiros › Ver no
      mapa» (GeoJSON de carregar/f?id=<id>&k=geojson). Ligar e desligar cada camada, «Ligar todas», «Como no QGIS» (as que
      estão visíveis no projecto QGIS) e «Desligar todas». Opacidade por camada.
   3. Estilos: do projecto QGIS (.qgs ou .qgz) dos «Ficheiros do projecto» (GET /tcd/v1/pfich?alvo=e:<encomenda>, m90381):
      nome e ordem das camadas como na árvore do QGIS, grupos, e o renderer de cada camada (singleSymbol, categorizedSymbol,
      graduatedSymbol, RuleRenderer com filtros simples): preenchimento, contorno, espessura, tracejado, opacidade, padrões
      de linhas e de pontos, linhas de marcadores, símbolos de ponto simples (círculo, quadrado, triângulo, losango, polígonos,
      seta, linha) e rótulos com um campo simples. Sem .qgs, vem da tabela layer_styles do GeoPackage (QML; SLD básico).
      O que não dá para traduzir cai num estilo simples legível e fica registado (lista «O que não se traduziu» na própria
      parte e window.IPRDesign.registo(<encomenda>)).
   4. O GeoJSON do mapa (conv.py) só traz a geometria e «camada»: os atributos que os estilos e os rótulos pedem lêem-se no
      navegador do GeoPackage original dos «Ficheiros do projecto» (sql.js, o mesmo do §75 do ajustes.js) e juntam-se ao
      GeoJSON pela ordem dos elementos, conferida pelo primeiro vértice (PT-TM06 convertido aqui para WGS84). Se a ordem não
      bater, não se junta nada e a camada fica com um só símbolo (registado).
   Só acrescenta camadas e fontes; não mexe no app.js, no viz.js nem nas camadas da Base. Texto escapado (textContent).
   Desligar: window.IPR_DESIGN_OFF = true antes de carregar, ou ?design=0 no endereço. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.IPRDesign || W.IPR_DESIGN_OFF) return;
  try { if (new URLSearchParams(location.search).get("design") === "0") return; } catch (e) {}

  // =====================================================================================================================
  // 1. Tradução QGIS -> MapLibre (sem rede nem mapa; testável à parte)
  // =====================================================================================================================
  var PX_MM = 96 / 25.4, PX_PT = 96 / 72;
  // MapLibre usa mosaicos de 512 px: metros por pixel ao nível z = 78271.517 · cos(lat) / 2^z.
  var MPP0 = 78271.51696402048;

  function nota(lista, txt) { if (lista && lista.indexOf(txt) < 0) lista.push(txt); }
  function filhos(no, nome) { var r = []; if (!no) return r; for (var c = no.firstElementChild; c; c = c.nextElementSibling) if (!nome || c.tagName === nome) r.push(c); return r; }
  function filho(no, nome) { return filhos(no, nome)[0] || null; }
  // Opções de um elemento <layer> do QGIS: <Option type="Map"><Option name=".." value=".."/></Option> (3.x) ou <prop k v> (antigo).
  function opcoes(no) {
    var o = {}, m = filho(no, "Option");
    if (m) filhos(m, "Option").forEach(function (x) { var n = x.getAttribute("name"); if (n) o[n] = x.getAttribute("value"); });
    filhos(no, "prop").forEach(function (x) { var k = x.getAttribute("k"); if (k && o[k] == null) o[k] = x.getAttribute("v"); });
    return o;
  }
  // Propriedades definidas por dados activas (cor por expressão, etc.): ignoradas e registadas.
  function temDefinidasPorDados(no) {
    var dd = filho(no, "data_defined_properties"); if (!dd) return false;
    var tem = false;
    Array.prototype.forEach.call(dd.getElementsByTagName("Option"), function (x) { if (x.getAttribute("name") === "active" && x.getAttribute("value") === "true") tem = true; });
    return tem;
  }

  // Cores do QGIS: «r,g,b,a» (3.x), «r,g,b,a,rgb:...» (3.38 e seguintes), «rgb:f,f,f,f», «#rrggbb».
  function cor(s, notas) {
    s = String(s == null ? "" : s).trim();
    var m = /^(\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(\d{1,3}))?/.exec(s);
    if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4] / 255];
    m = /^rgb:([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?/.exec(s);
    if (m) return [Math.round(m[1] * 255), Math.round(m[2] * 255), Math.round(m[3] * 255), m[4] == null ? 1 : +m[4]];
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), m[2] ? parseInt(m[2], 16) / 255 : 1];
    if (s) nota(notas, "cor não reconhecida («" + s.slice(0, 30) + "»): cinzento");
    return [128, 128, 128, 1];
  }
  function rgba(c, a) { var o = Math.max(0, Math.min(1, (c[3] == null ? 1 : c[3]) * (a == null ? 1 : a))); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + +o.toFixed(3) + ")"; }
  function hex(c) { return "#" + [c[0], c[1], c[2]].map(function (v) { return ("0" + Math.max(0, Math.min(255, v | 0)).toString(16)).slice(-2); }).join(""); }

  // Medidas: {v, u:"px"} ou {v, u:"m"} (metros no terreno: RenderMetersInMapUnits e MapUnit em PT-TM06).
  function medida(v, unidade, notas) {
    v = parseFloat(v); if (!isFinite(v)) v = 0;
    var u = String(unidade || "MM");
    if (u === "MM") return { v: v * PX_MM, u: "px" };
    if (u === "Pixel") return { v: v, u: "px" };
    if (u === "Point") return { v: v * PX_PT, u: "px" };
    if (u === "Inch") return { v: v * 96, u: "px" };
    if (u === "MapUnit" || u === "RenderMetersInMapUnits") return { v: v, u: "m" };
    nota(notas, "unidade «" + u + "» lida como milímetros");
    return { v: v * PX_MM, u: "px" };
  }
  function pxEm(med, z, lat) { return med.u === "px" ? med.v : med.v * Math.pow(2, z) / (MPP0 * Math.cos((lat || 39.5) * Math.PI / 180)); }
  // Medida em expressão MapLibre (constante em píxeis; em metros, interpolação exponencial de base 2 com o zoom).
  function mlMedida(med, lat, min) {
    min = min == null ? 0 : min;
    if (med.u === "px") return Math.max(min, +med.v.toFixed(2));
    return ["interpolate", ["exponential", 2], ["zoom"], 0, Math.max(min, pxEm(med, 0, lat)), 24, Math.max(min, pxEm(med, 24, lat))];
  }

  // Tracejados do QGIS (em múltiplos da espessura, como o MapLibre).
  var TRACOS = { dash: [4, 2], dot: [1, 2], "dash dot": [4, 2, 1, 2], "dash dot dot": [4, 2, 1, 2, 1, 2] };
  function tracejado(o, larg, notas) {
    if (o.use_custom_dash === "1" && o.customdash) {
      var p = String(o.customdash).split(";").map(parseFloat).filter(isFinite), u = o.customdash_unit || "MM";
      if (!p.length) return null;
      var lw = larg.u === "px" ? larg.v : null;
      var pm = p.map(function (x) { return medida(x, u, notas); });
      if (pm[0].u !== larg.u) { nota(notas, "tracejado e espessura em unidades diferentes: aproximado ao nível 17"); return pm.map(function (x) { return +(pxEm(x, 17, 39.5) / Math.max(1, pxEm(larg, 17, 39.5))).toFixed(2); }); }
      return pm.map(function (x) { return +(x.v / Math.max(lw == null ? larg.v : lw, larg.u === "px" ? 1 : 0.01)).toFixed(2); });
    }
    var s = o.line_style || o.outline_style || "solid";
    return TRACOS[s] ? TRACOS[s].slice() : null;
  }

  // Símbolo do QGIS -> lista de camadas de símbolo intermédias:
  //  {k:"fill", cor, padrao?} · {k:"line", cor, larg, dash, cap, join, offset, pontos?} · {k:"marker", forma, cor, contorno, contL, tam, ang}
  var PADROES_PINCEL = { horizontal: [0], vertical: [90], cross: [0, 90], b_diagonal: [135], f_diagonal: [45], diagonal_x: [45, 135] };
  function simbolo(sym, notas) {
    var out = [], alfa = parseFloat(sym.getAttribute("alpha")); if (!isFinite(alfa)) alfa = 1;
    filhos(sym, "layer").forEach(function (l) {
      if (l.getAttribute("enabled") === "0") return;
      var c = l.getAttribute("class"), o = opcoes(l), sub = filho(l, "symbol");
      if (temDefinidasPorDados(l)) nota(notas, c + ": propriedades definidas por dados ignoradas");
      function contorno(estilo, corS, largS, unid) {
        if ((estilo || "solid") === "no") return;
        var larg = medida(largS, unid, notas); if (!larg.v) larg = { v: 1, u: "px" }; // espessura 0 no QGIS = linha fina
        out.push({ k: "line", cor: cor(corS, notas), larg: larg, dash: TRACOS[estilo] ? TRACOS[estilo].slice() : null, cap: "butt", join: { miter: "miter", round: "round" }[o.joinstyle] || "bevel" });
      }
      if (c === "SimpleFill") {
        var st = o.style || "solid", cf = cor(o.color, notas);
        if (st === "solid") out.push({ k: "fill", cor: cf });
        else if (PADROES_PINCEL[st]) out.push({ k: "fill", cor: cf, padrao: { tipo: "linhas", angs: PADROES_PINCEL[st], dist: { v: 8, u: "px" }, larg: { v: 1, u: "px" }, cor: cf } });
        else if (/^dense(\d)$/.test(st)) { var dn = +RegExp.$1; out.push({ k: "fill", cor: [cf[0], cf[1], cf[2], cf[3] * (1 - (dn - 1) / 7)] }); nota(notas, "preenchimento «" + st + "» como cor sólida mais clara"); }
        else if (st !== "no") { out.push({ k: "fill", cor: cf }); nota(notas, "preenchimento «" + st + "» como cor sólida"); }
        contorno(o.outline_style, o.outline_color, o.outline_width, o.outline_width_unit);
      } else if (c === "LinePatternFill") {
        var sl = sub ? simbolo(sub, notas).filter(function (x) { return x.k === "line"; })[0] : null;
        var ang = Math.round((parseFloat(o.angle) || 0) / 45) * 45 % 180;
        if ((parseFloat(o.angle) || 0) % 45) nota(notas, "padrão de linhas a " + o.angle + "° aproximado a " + ang + "°");
        out.push({ k: "fill", cor: [0, 0, 0, 0], padrao: { tipo: "linhas", angs: [ang], dist: medida(o.distance, o.distance_unit, notas), larg: sl ? sl.larg : medida(o.line_width, o.line_width_unit, notas), cor: sl ? sl.cor : cor(o.color, notas) } });
      } else if (c === "PointPatternFill") {
        var sm = sub ? simbolo(sub, notas).filter(function (x) { return x.k === "marker"; })[0] : null;
        out.push({ k: "fill", cor: [0, 0, 0, 0], padrao: { tipo: "pontos", dx: medida(o.distance_x, o.distance_x_unit, notas), dy: medida(o.distance_y, o.distance_y_unit, notas), marcador: sm || { forma: "circle", cor: [0, 0, 0, 1], tam: { v: 3, u: "px" } } } });
      } else if (c === "GradientFill" || c === "ShapeburstFill") {
        out.push({ k: "fill", cor: cor(o.color || o.color1, notas) }); nota(notas, c + " como cor sólida");
      } else if (c === "SVGFill" || c === "RasterFill" || c === "RandomMarkerFill") {
        var cs = cor(o.color, notas); out.push({ k: "fill", cor: [cs[0], cs[1], cs[2], cs[3] * 0.35] }); nota(notas, c + " (imagem ou SVG) como cor translúcida");
      } else if (c === "CentroidFill") {
        nota(notas, "marcador no centróide do polígono não desenhado");
      } else if (c === "SimpleLine") {
        if ((o.line_style || "solid") === "no") return;
        var lg = medida(o.line_width, o.line_width_unit, notas); if (!lg.v) lg = { v: 1, u: "px" };
        var ofs = parseFloat(o.offset) ? medida(o.offset, o.offset_unit, notas) : null;
        out.push({ k: "line", cor: cor(o.line_color || o.color, notas), larg: lg, dash: tracejado(o, lg, notas), cap: { flat: "butt", square: "square", round: "round" }[o.capstyle] || "square", join: { miter: "miter", round: "round" }[o.joinstyle] || "bevel", offset: ofs });
      } else if (c === "MarkerLine" || c === "HashedLine") {
        // Marcadores ao longo da linha: linha pontilhada (círculos: traço 0 com ponta redonda) ou tracejada.
        var pl = o.placements || o.placement || "Interval";
        if (!/Interval/i.test(pl)) { nota(notas, c + " com colocação «" + pl + "» não desenhada"); return; }
        var mk = sub ? simbolo(sub, notas).filter(function (x) { return x.k === "marker" || x.k === "line"; })[0] : null;
        var tam = c === "HashedLine" ? medida(o.hash_length || 3, o.hash_length_unit, notas) : (mk && mk.tam) || { v: 2, u: "px" };
        var corM = mk ? (mk.k === "marker" ? (mk.cor[3] > 0.05 ? mk.cor : mk.contorno) : mk.cor) : [0, 0, 0, 1];
        var iv = medida(o.interval || 3, o.interval_unit, notas);
        var ivN = iv.u === tam.u ? iv.v / Math.max(tam.v, 1e-6) : pxEm(iv, 17, 39.5) / Math.max(pxEm(tam, 17, 39.5), 0.5);
        if (iv.u !== tam.u) nota(notas, c + ": intervalo e marcador em unidades diferentes, aproximado ao nível 17");
        var redondo = mk && mk.k === "marker" && mk.forma === "circle";
        if (!redondo) nota(notas, c + ": marcador «" + (mk && mk.forma || "?") + "» desenhado como traço");
        var lgM = c === "HashedLine" ? (sub ? (simbolo(sub, notas)[0] || {}).larg : null) || { v: 1, u: "px" } : tam;
        var ofs2 = parseFloat(o.offset) ? medida(o.offset, o.offset_unit, notas) : null;
        out.push({ k: "line", cor: corM, larg: redondo ? tam : (c === "HashedLine" ? lgM : { v: tam.v * 0.6, u: tam.u }), dash: redondo ? [0, +Math.max(1.2, ivN).toFixed(2)] : [1, +Math.max(0.5, ivN - 1).toFixed(2)], cap: redondo ? "round" : "butt", join: "round", offset: ofs2, pontos: 1 });
      } else if (c === "ArrowLine") {
        var sa = sub ? simbolo(sub, notas).filter(function (x) { return x.k === "fill"; })[0] : null;
        out.push({ k: "line", cor: sa ? sa.cor : [0, 0, 0, 1], larg: medida(o.arrow_width || 1, o.arrow_width_unit, notas), dash: null, cap: "butt", join: "round" });
        nota(notas, "seta (ArrowLine) desenhada como linha");
      } else if (c === "GeometryGenerator") {
        nota(notas, "gerador de geometria («" + String(o.geometryModifier || "").replace(/\s+/g, " ").slice(0, 40) + "») ignorado: desenha-se o símbolo interior na geometria original");
        if (sub) Array.prototype.push.apply(out, simbolo(sub, notas));
      } else if (c === "SimpleMarker" || c === "FilledMarker" || c === "EllipseMarker") {
        var forma = String(o.name || "circle"), corP = cor(o.color, notas), corC = cor(o.outline_color, notas), contL = medida(o.outline_width, o.outline_width_unit, notas);
        if (o.outline_style === "no") corC = [0, 0, 0, 0];
        if (c === "FilledMarker" && sub) {
          var f = simbolo(sub, notas), ff = f.filter(function (x) { return x.k === "fill"; })[0], fl = f.filter(function (x) { return x.k === "line"; })[0];
          corP = ff ? ff.cor : corP; corC = fl ? fl.cor : [0, 0, 0, 0]; contL = fl ? fl.larg : contL;
        }
        if (c === "EllipseMarker") { forma = { circle: "circle", rectangle: "square", triangle: "triangle", cross: "cross", diamond: "diamond" }[o.symbolName] || "circle"; nota(notas, "elipse desenhada como «" + forma + "»"); }
        out.push({ k: "marker", forma: forma, cor: corP, contorno: corC, contL: contL, tam: medida(o.size || (c === "EllipseMarker" ? o.symbol_width : 2), o.size_unit || o.symbol_width_unit, notas), ang: parseFloat(o.angle) || 0 });
      } else if (c === "SvgMarker" || c === "FontMarker" || c === "RasterMarker" || c === "AnimatedMarker") {
        out.push({ k: "marker", forma: "circle", cor: cor(o.color, notas), contorno: cor(o.outline_color || "35,35,35,255", notas), contL: { v: 1, u: "px" }, tam: medida(o.size || 3, o.size_unit, notas), ang: 0 });
        nota(notas, c + " desenhado como círculo");
      } else {
        nota(notas, "camada de símbolo «" + c + "» não traduzida");
      }
    });
    if (alfa !== 1) out.forEach(function (x) { x.alfa = alfa; });
    return out;
  }
  function simbolos(rd, notas) {
    var m = {}; filhos(filho(rd, "symbols"), "symbol").forEach(function (s) { m[s.getAttribute("name")] = simbolo(s, notas); }); return m;
  }

  // ---------- expressões do QGIS (filtros das regras e campos) -> expressões MapLibre ----------
  // Aceita: "campo" ou campo, 'texto', números, NULL, TRUE, FALSE, + - * / %, = != <> < > <= >=, AND, OR, NOT, IN (...),
  // NOT IN, IS [NOT] NULL, ||. Funções, $area, $length, LIKE e o resto: não traduzido (devolve null).
  function expr(src) {
    var s = String(src == null ? "" : src), i = 0, toks = [];
    var re = /\s+|("(?:[^"]|"")*")|('(?:[^']|'')*')|(\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|(<=|>=|<>|!=|\|\||[=<>+\-*/%(),])|([A-Za-z_À-ɏ][\wÀ-ɏ]*)|(\$\w+|@\w+|.)/g, m;
    while ((m = re.exec(s))) {
      if (m[1]) toks.push({ t: "campo", v: m[1].slice(1, -1).replace(/""/g, '"') });
      else if (m[2]) toks.push({ t: "txt", v: m[2].slice(1, -1).replace(/''/g, "'") });
      else if (m[3]) toks.push({ t: "num", v: +m[3] });
      else if (m[4]) toks.push({ t: "op", v: m[4] });
      else if (m[5]) { var u = m[5].toUpperCase(); toks.push(["AND", "OR", "NOT", "IN", "IS", "NULL", "TRUE", "FALSE", "LIKE", "ILIKE"].indexOf(u) >= 0 ? { t: "kw", v: u } : { t: "id", v: m[5] }); }
      else if (m[6]) toks.push({ t: "mau", v: m[6] });
    }
    function ver(t, v) { var k = toks[i]; return k && k.t === t && (v == null || k.v === v); }
    function come(t, v) { if (!ver(t, v)) throw new Error("esperava " + (v || t)); return toks[i++]; }
    // Tipo de cada nó: "n" número, "s" texto, "b" lógico, "c" campo (sem tipo), "z" nulo.
    function num(n) { return n.k === "n" ? n.e : n.k === "c" ? ["to-number", n.e] : n.k === "s" ? ["to-number", n.e] : null; }
    function txt(n) { return n.k === "s" ? n.e : ["to-string", n.e]; }
    function primario() {
      var k = toks[i];
      if (!k) throw new Error("fim inesperado");
      if (k.t === "num") { i++; return { k: "n", e: k.v }; }
      if (k.t === "txt") { i++; return { k: "s", e: k.v }; }
      if (k.t === "campo") { i++; return { k: "c", e: ["get", k.v], campo: k.v }; }
      if (k.t === "id") { i++; if (ver("op", "(")) throw new Error("função " + k.v); return { k: "c", e: ["get", k.v], campo: k.v }; }
      if (k.t === "kw" && k.v === "NULL") { i++; return { k: "z", e: null }; }
      if (k.t === "kw" && (k.v === "TRUE" || k.v === "FALSE")) { i++; return { k: "b", e: k.v === "TRUE" }; }
      if (k.t === "op" && k.v === "(") { i++; var r = ou(); come("op", ")"); return r; }
      if (k.t === "op" && k.v === "-") { i++; var p = primario(); return { k: "n", e: ["-", 0, num(p)] }; }
      throw new Error("não traduzível: " + k.v);
    }
    function mult() {
      var a = primario();
      while (ver("op", "*") || ver("op", "/") || ver("op", "%")) { var o = toks[i++].v, b = primario(); a = { k: "n", e: [o, num(a), num(b)] }; }
      return a;
    }
    function soma() {
      var a = mult();
      while (ver("op", "+") || ver("op", "-") || ver("op", "||")) {
        var o = toks[i++].v, b = mult();
        a = o === "||" ? { k: "s", e: ["concat", txt(a), txt(b)] } : { k: "n", e: [o, num(a), num(b)] };
      }
      return a;
    }
    function compara(o, a, b) {
      var mo = { "=": "==", "!=": "!=", "<>": "!=", "<": "<", ">": ">", "<=": "<=", ">=": ">=" }[o];
      if (a.k === "z" || b.k === "z") return { k: "b", e: [mo === "!=" ? "!=" : "==", (a.k === "z" ? b : a).e, null] };
      if (a.k === "n" || b.k === "n") return { k: "b", e: [mo, num(a), num(b)] };
      if (a.k === "s" || b.k === "s") return { k: "b", e: [mo, txt(a), txt(b)] };
      return { k: "b", e: [mo, a.e, b.e] };
    }
    function comp() {
      var a = soma(), neg = false;
      if (ver("op") && ["=", "!=", "<>", "<", ">", "<=", ">="].indexOf(toks[i].v) >= 0) { var o = toks[i++].v; return compara(o, a, soma()); }
      if (ver("kw", "IS")) { i++; if (ver("kw", "NOT")) { i++; neg = true; } come("kw", "NULL"); return { k: "b", e: [neg ? "!=" : "==", a.e, null] }; }
      if (ver("kw", "NOT") && toks[i + 1] && toks[i + 1].t === "kw" && toks[i + 1].v === "IN") { i++; neg = true; }
      if (ver("kw", "IN")) {
        i++; come("op", "("); var l = [];
        do { var v = soma(); if (v.k !== "n" && v.k !== "s") throw new Error("lista IN com expressões"); l.push(v); } while (ver("op", ",") && ++i);
        come("op", ")");
        var nums = l.every(function (x) { return x.k === "n"; });
        var e = ["in", nums ? num(a) : txt(a), ["literal", l.map(function (x) { return nums ? x.e : String(x.e); })]];
        return { k: "b", e: neg ? ["!", e] : e };
      }
      if (ver("kw", "LIKE") || ver("kw", "ILIKE")) throw new Error("LIKE");
      return a;
    }
    function nao() { if (ver("kw", "NOT")) { i++; var a = nao(); return { k: "b", e: ["!", bool(a)] }; } return comp(); }
    function bool(n) { return n.k === "b" ? n.e : n.k === "n" ? ["!=", n.e, 0] : ["to-boolean", n.e]; }
    function e() { var a = nao(); while (ver("kw", "AND")) { i++; a = { k: "b", e: ["all", bool(a), bool(nao())] }; } return a; }
    function ou() { var a = e(); while (ver("kw", "OR")) { i++; a = { k: "b", e: ["any", bool(a), bool(e())] }; } return a; }
    try {
      if (toks.some(function (k) { return k.t === "mau"; })) throw new Error("variável ou função");
      if (!toks.length) return null;
      var r = ou(); if (i !== toks.length) throw new Error("sobra texto");
      return r;
    } catch (x) { return { erro: x.message }; }
  }
  W.__iprDesignExpr = expr;
  function filtroDe(src, notas) {
    var r = expr(src); if (!r) return null;
    if (r.erro) { nota(notas, "filtro «" + String(src).trim().slice(0, 60) + "» não traduzido (" + r.erro + ")"); return false; }
    return r.k === "b" ? r.e : ["to-boolean", r.e];
  }
  // Campo de um renderer ou de um rótulo: nome simples ou expressão traduzível.
  function campoDe(attr, eExpr, notas) {
    attr = String(attr || "").trim(); if (!attr) return null;
    if (!eExpr && !/^".*"$/.test(attr) && /^[\wÀ-ɏ]+$/.test(attr)) return { e: ["get", attr], campo: attr };
    var r = expr(attr);
    if (!r || r.erro) { nota(notas, "campo «" + attr.slice(0, 60) + "» é uma expressão não traduzida"); return null; }
    return { e: r.e, campo: r.campo || null, expr: true };
  }

  // Escala do QGIS (1:N) -> nível de zoom MapLibre (512 px, 96 ppp, à latitude dada).
  function zoomDeEscala(n, lat) { n = +n; if (!(n > 0)) return null; return Math.log(MPP0 * Math.cos((lat || 39.5) * Math.PI / 180) * 96 / 0.0254 / n) / Math.LN2; }

  // Renderer -> {classes:[{rotulo, filtro (expressão MapLibre ou null = todos), sl:[camadas de símbolo], ver}], notas}
  function renderer(rd, notas, lat) {
    var tipo = rd.getAttribute("type"), S = simbolos(rd, notas), classes = [];
    if (tipo === "singleSymbol") {
      classes.push({ rotulo: "", filtro: null, sl: S["0"] || S[Object.keys(S)[0]] || [], ver: true });
    } else if (tipo === "categorizedSymbol") {
      var c = campoDe(rd.getAttribute("attr"), false, notas), outras = [];
      filhos(filho(rd, "categories"), "category").forEach(function (k) {
        var vals = filhos(k, "val").map(function (v) { return v.getAttribute("value"); });
        var v = vals.length ? vals : [k.getAttribute("value")];
        var dflt = v.length === 1 && (v[0] === "" || v[0] == null); // «todos os outros valores»
        if (!dflt) outras = outras.concat(v.map(String));
        classes.push({ rotulo: k.getAttribute("label") || v.join(", "), _v: v.map(String), _dflt: dflt, sl: S[k.getAttribute("symbol")] || [], ver: k.getAttribute("render") !== "false" });
      });
      classes.forEach(function (k) {
        if (!c) { k.filtro = false; return; }
        var a = ["to-string", c.e];
        k.filtro = k._dflt ? ["!", ["in", a, ["literal", outras]]] : (k._v.length === 1 ? ["==", a, k._v[0]] : ["in", a, ["literal", k._v]]);
        delete k._v; delete k._dflt;
      });
      if (!c) nota(notas, "categorias sem campo legível: um só símbolo");
      classes.campos = c && c.campo ? [c.campo] : [];
    } else if (tipo === "graduatedSymbol") {
      var g = campoDe(rd.getAttribute("attr"), false, notas);
      filhos(filho(rd, "ranges"), "range").forEach(function (r, j) {
        var lo = parseFloat(r.getAttribute("lower")), hi = parseFloat(r.getAttribute("upper")), a = g ? ["to-number", g.e] : null;
        classes.push({ rotulo: r.getAttribute("label") || (lo + " - " + hi), filtro: a ? ["all", [j === 0 ? ">=" : ">", a, lo], ["<=", a, hi]] : false, sl: S[r.getAttribute("symbol")] || [], ver: r.getAttribute("render") !== "false" });
      });
      classes.campos = g && g.campo ? [g.campo] : [];
    } else if (tipo === "RuleRenderer") {
      var campos = [];
      (function regras(pai, filtroPai, zPai) {
        var irmaos = [];
        filhos(pai, "rule").forEach(function (r) {
          if (r.getAttribute("active") === "0") return;
          var fs = r.getAttribute("filter"), f;
          if (fs && /^\s*ELSE\s*$/i.test(fs)) f = irmaos.length ? ["!", ["any"].concat(irmaos.filter(function (x) { return x; }))] : null;
          else { f = fs ? filtroDe(fs, notas) : null; if (f) irmaos.push(f); }
          if (f === false) return;
          (String(fs || "").match(/"([^"]+)"/g) || []).forEach(function (q) { campos.push(q.slice(1, -1)); });
          var tot = filtroPai && f ? ["all", filtroPai, f] : (filtroPai || f || null);
          var mn = zoomDeEscala(r.getAttribute("scalemaxdenom"), lat), mx = zoomDeEscala(r.getAttribute("scalemindenom"), lat);
          var z = { min: Math.max(zPai.min || 0, mn || 0) || null, max: Math.min(zPai.max || 24, mx || 24) };
          if (z.max >= 24) z.max = null;
          var sy = r.getAttribute("symbol");
          if (sy != null && S[sy]) classes.push({ rotulo: r.getAttribute("label") || fs || "", filtro: tot, sl: S[sy], ver: true, minz: z.min, maxz: z.max });
          regras(r, tot, z);
        });
      })(filho(rd, "rules"), null, {});
      if (!classes.length) { nota(notas, "regras sem filtros traduzíveis: primeiro símbolo para todos"); var k0 = Object.keys(S)[0]; if (k0) classes.push({ rotulo: "", filtro: null, sl: S[k0], ver: true }); }
      classes.campos = campos;
    } else if (tipo === "pointCluster" || tipo === "pointDisplacement" || tipo === "invertedPolygonRenderer" || tipo === "mergedFeatureRenderer") {
      var dentro = filho(rd, "renderer-v2");
      nota(notas, "renderer «" + tipo + "»: desenha-se o renderer interior, sem o efeito");
      if (dentro) return renderer(dentro, notas, lat);
    } else if (tipo === "nullSymbol") {
      return { classes: [], nada: true };
    } else {
      nota(notas, "renderer «" + tipo + "» não traduzido: um só símbolo");
      var k1 = Object.keys(S)[0]; classes.push({ rotulo: "", filtro: null, sl: k1 ? S[k1] : [], ver: true });
      classes.campos = [];
    }
    return { classes: classes, campos: classes.campos || [] };
  }

  // Rótulos: simples com um campo (ou expressão traduzível); regras só se houver uma única regra traduzível.
  function rotulos(no, ligados, notas) {
    if (!no || !ligados) return null;
    var tp = no.getAttribute("type"), set = null, filtro = null;
    if (tp === "simple") set = filho(no, "settings");
    else if (tp === "rule-based") {
      var rs = Array.prototype.slice.call(no.getElementsByTagName("rule")).filter(function (r) { return r.getAttribute("active") !== "0" && filho(r, "settings"); });
      if (!rs.length) return null; // regras todas desligadas no QGIS
      if (rs.length !== 1) { nota(notas, "rótulos com " + rs.length + " regras não traduzidos"); return null; }
      set = filho(rs[0], "settings");
      if (rs[0].getAttribute("filter")) { filtro = filtroDe(rs[0].getAttribute("filter"), notas); if (filtro === false) { nota(notas, "rótulos: filtro não traduzido, mostram-se em todos"); filtro = null; } }
    } else return null;
    var ts = set && filho(set, "text-style"); if (!ts) return null;
    var cp = campoDe(ts.getAttribute("fieldName"), ts.getAttribute("isExpression") === "1", notas);
    if (!cp) { nota(notas, "rótulos não traduzidos (expressão «" + String(ts.getAttribute("fieldName") || "").slice(0, 50) + "»)"); return null; }
    var tb = filho(ts, "text-buffer"), bg = filho(ts, "background");
    var tam = medida(ts.getAttribute("fontSize") || 10, ts.getAttribute("fontSizeUnit") || "Point", notas);
    if (bg && bg.getAttribute("shapeDraw") === "1") nota(notas, "rótulos: fundo do rótulo não desenhado (só auréola)");
    var r = {
      e: cp.e, campo: cp.campo, tam: tam, cor: cor(ts.getAttribute("textColor") || "0,0,0,255", notas), op: parseFloat(ts.getAttribute("textOpacity")) || 1,
      negrito: (+ts.getAttribute("fontWeight") || 50) >= 63 || ts.getAttribute("forcedBold") === "1", italico: ts.getAttribute("fontItalic") === "1",
      filtro: filtro
    };
    if (tb && tb.getAttribute("bufferDraw") === "1") { r.halo = cor(tb.getAttribute("bufferColor"), notas); r.haloL = medida(tb.getAttribute("bufferSize") || 1, tb.getAttribute("bufferSizeUnits") || "MM", notas); }
    else if (bg && bg.getAttribute("shapeDraw") === "1") { r.halo = cor(bg.getAttribute("shapeFillColor"), notas); r.haloL = { v: 2, u: "px" }; }
    return r;
  }

  // Uma camada do QGIS (maplayer do .qgs ou raiz <qgis> de um QML) -> estilo intermédio.
  function estiloDe(no, notas, lat) {
    var rd = filho(no, "renderer-v2"); if (!rd) return null;
    var R = renderer(rd, notas, lat);
    var op = parseFloat((filho(no, "layerOpacity") || {}).textContent); if (!isFinite(op)) op = 1;
    var e = { classes: R.classes, campos: (R.campos || []).slice(), opac: op, nada: !!R.nada };
    // Visibilidade por escala: minScale é o limite mais afastado (zoom mínimo), maxScale o mais próximo (zoom máximo).
    if (no.getAttribute("hasScaleBasedVisibilityFlag") === "1") {
      var mn = zoomDeEscala(no.getAttribute("minScale"), lat), mx = zoomDeEscala(no.getAttribute("maxScale"), lat);
      e.minz = mn > 0 ? mn : null; e.maxz = mx && mx < 24 ? mx : null;
    }
    e.rot = rotulos(filho(no, "labeling"), no.getAttribute("labelsEnabled") === "1", notas);
    if (e.rot && e.rot.campo) e.campos.push(e.rot.campo);
    return e;
  }

  // SLD básico (layer_styles sem QML): primeira FeatureTypeStyle, regras com PropertyIsEqualTo, cores e espessuras.
  function estiloSld(xml, notas) {
    var dp = new DOMParser().parseFromString(xml, "application/xml");
    function tg(n, nome) { return Array.prototype.slice.call(n.getElementsByTagNameNS("*", nome)); }
    function param(n, nome) { var p = tg(n, "SvgParameter").concat(tg(n, "CssParameter")).filter(function (x) { return x.getAttribute("name") === nome; })[0]; return p ? p.textContent.trim() : null; }
    function corH(h, o) { var c = cor(h || "#808080", notas); if (o != null && isFinite(+o)) c[3] = +o; return c; }
    var classes = [], campos = [];
    tg(dp, "Rule").forEach(function (r) {
      var sl = [], f = null;
      var eq = tg(r, "PropertyIsEqualTo")[0];
      if (eq) { var pn = tg(eq, "PropertyName")[0], lt = tg(eq, "Literal")[0]; if (pn && lt) { f = ["==", ["to-string", ["get", pn.textContent.trim()]], lt.textContent.trim()]; campos.push(pn.textContent.trim()); } }
      else if (tg(r, "Filter").length) { nota(notas, "SLD: filtro não traduzido"); return; }
      tg(r, "PolygonSymbolizer").forEach(function (p) {
        var fi = tg(p, "Fill")[0], st = tg(p, "Stroke")[0];
        if (fi) sl.push({ k: "fill", cor: corH(param(fi, "fill"), param(fi, "fill-opacity")) });
        if (st) sl.push({ k: "line", cor: corH(param(st, "stroke"), param(st, "stroke-opacity")), larg: { v: parseFloat(param(st, "stroke-width")) || 1, u: "px" }, dash: param(st, "stroke-dasharray") ? param(st, "stroke-dasharray").split(/\s+/).map(parseFloat) : null, cap: "butt", join: "bevel" });
      });
      tg(r, "LineSymbolizer").forEach(function (p) {
        var st = tg(p, "Stroke")[0]; if (st) sl.push({ k: "line", cor: corH(param(st, "stroke"), param(st, "stroke-opacity")), larg: { v: parseFloat(param(st, "stroke-width")) || 1, u: "px" }, dash: null, cap: "butt", join: "bevel" });
      });
      tg(r, "PointSymbolizer").forEach(function (p) {
        var wk = tg(p, "WellKnownName")[0], fi = tg(p, "Fill")[0], st = tg(p, "Stroke")[0], sz = tg(p, "Size")[0];
        sl.push({ k: "marker", forma: wk ? wk.textContent.trim() : "circle", cor: corH(fi && param(fi, "fill")), contorno: corH(st && param(st, "stroke")), contL: { v: st ? parseFloat(param(st, "stroke-width")) || 1 : 0, u: "px" }, tam: { v: sz ? parseFloat(sz.textContent) || 6 : 6, u: "px" }, ang: 0 });
      });
      if (sl.length) classes.push({ rotulo: (tg(r, "Title")[0] || tg(r, "Name")[0] || { textContent: "" }).textContent.trim(), filtro: f, sl: sl, ver: true });
    });
    if (!classes.length) return null;
    return { classes: classes, campos: campos, opac: 1 };
  }
  function estiloQml(xml, notas, lat) {
    var dp = new DOMParser().parseFromString(xml, "application/xml"), raiz = dp.documentElement;
    if (!raiz || raiz.tagName !== "qgis") return null;
    return estiloDe(raiz, notas, lat);
  }

  // Estilo simples legível (sem estilo ou quando a tradução falha): as cores do «Ver no mapa».
  var PALETA = ["#e07b39", "#4f8edc", "#7bb661", "#c74b50", "#9b6bc3", "#d9a521", "#3fa7a0", "#b5651d"];
  function estiloSimples(i) {
    var h = PALETA[(i || 0) % PALETA.length], c = cor(h);
    return { classes: [{ rotulo: "", filtro: null, ver: true, sl: [{ k: "fill", cor: [c[0], c[1], c[2], 0.25] }, { k: "line", cor: c, larg: { v: 1.4, u: "px" }, dash: null, cap: "round", join: "round" }, { k: "marker", forma: "circle", cor: c, contorno: [255, 255, 255, 1], contL: { v: 1, u: "px" }, tam: { v: 6, u: "px" }, ang: 0 }] }], campos: [], opac: 1, simples: 1 };
  }
  // Quando os atributos não chegam: cada classe com filtro perde o filtro e fica só a primeira visível.
  function semAtributos(e) {
    if (!e || !e.classes.some(function (k) { return k.filtro; })) return e;
    var k0 = e.classes.filter(function (k) { return k.ver && k.sl.length; })[0];
    return { classes: k0 ? [{ rotulo: "", filtro: null, sl: k0.sl, ver: true }] : [], campos: [], opac: e.opac, minz: e.minz, maxz: e.maxz, rot: null, semAtr: 1 };
  }

  // Projecto QGIS inteiro: camadas vectoriais de GeoPackage, pela ordem da árvore (a de cima primeiro), com os grupos.
  function lerProjecto(xml) {
    var dp = new DOMParser().parseFromString(xml, "application/xml"), raiz = dp.documentElement;
    if (!raiz || raiz.tagName !== "qgis") throw new Error("não é um projecto QGIS");
    var porId = {}, notasGerais = [];
    Array.prototype.forEach.call(raiz.getElementsByTagName("maplayer"), function (ml) { var id = (filho(ml, "id") || {}).textContent; if (id) porId[id] = ml; });
    var ordem = [];
    (function anda(g, grupos, visivel) {
      filhos(g).forEach(function (c) {
        if (c.tagName === "layer-tree-group") anda(c, grupos.concat([c.getAttribute("name") || ""]), visivel && c.getAttribute("checked") !== "Qt::Unchecked");
        else if (c.tagName === "layer-tree-layer") ordem.push({ id: c.getAttribute("id"), nome: c.getAttribute("name"), grupo: grupos.join(" / "), visivel: visivel && c.getAttribute("checked") !== "Qt::Unchecked" });
      });
    })(filho(raiz, "layer-tree-group") || raiz, [], true);
    Object.keys(porId).forEach(function (id) { if (!ordem.some(function (o) { return o.id === id; })) ordem.push({ id: id, nome: (filho(porId[id], "layername") || {}).textContent, grupo: "", visivel: false }); });
    var camadas = [];
    ordem.forEach(function (o, n) {
      var ml = porId[o.id]; if (!ml) return;
      var ds = String((filho(ml, "datasource") || {}).textContent || ""), prov = String((filho(ml, "provider") || {}).textContent || "");
      if (ml.getAttribute("type") !== "vector") { nota(notasGerais, "«" + o.nome + "»: camada " + (ml.getAttribute("type") || "?") + " (" + (prov || "sem fornecedor") + ") fica de fora: a base cartográfica é do IPR"); return; }
      var m = /^(.*?\.(gpkg|geojson|json|kml|kmz|dxf|dwg|gpx|shp))(?:\|(.*))?$/i.exec(ds);
      if (!m) { nota(notasGerais, "«" + o.nome + "»: fonte «" + prov + "» que não é um ficheiro do projecto, fica de fora"); return; }
      var fich = m[1].replace(/\\/g, "/").split("/").pop(), nomeC = null;
      try { fich = decodeURIComponent(fich); } catch (e) {}
      String(m[3] || "").split("|").forEach(function (p) { var q = /^layername=(.*)$/.exec(p); if (q) nomeC = q[1]; });
      camadas.push({ id: o.id, nome: o.nome || (filho(ml, "layername") || {}).textContent || fich, grupo: o.grupo, visivel: o.visivel, ordem: n, ficheiro: fich, camada: nomeC, geom: ml.getAttribute("geometry") || "", no: ml });
    });
    return { camadas: camadas, notas: notasGerais, versao: raiz.getAttribute("version") || "" };
  }

  // ---------- estilo intermédio -> camadas MapLibre ----------
  function filtroGeom(g) {
    if (g === "Polygon") return ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false];
    if (g === "Line") return ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];
    if (g === "Point") return ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false];
    return null;
  }
  function todos(fs) { fs = fs.filter(function (f) { return f != null && f !== true; }); return fs.length === 0 ? null : fs.length === 1 ? fs[0] : ["all"].concat(fs); }
  function chave(o) { var s = JSON.stringify(o), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  // Imagens (padrões e marcadores) a criar no mapa: {id, tipo:"padrao"|"marcador", def}
  function camadasMapLibre(e, o) {
    // o: {fonte, prefixo, camada (valor de «camada» no GeoJSON ou null), geom ("Polygon"|"Line"|"Point"|""), lat, opUser}
    var L = [], imgs = [], lat = o.lat || 39.5, base = todos([o.camada != null ? ["==", ["get", "camada"], o.camada] : null]);
    var geoms = o.geom ? [o.geom] : ["Polygon", "Line", "Point"], n = 0;
    function id() { return o.prefixo + "-" + (n++); }
    function zoom(l, k) {
      var mn = Math.max(e.minz || 0, k.minz || 0), mx = Math.min(e.maxz || 24, k.maxz || 24);
      if (mn > 0) l.minzoom = +mn.toFixed(2); if (mx < 24) l.maxzoom = +mx.toFixed(2);
      return l;
    }
    function meta(l, props) { l.metadata = { "ipr-dp": 1, "ipr-dp-op": props }; return l; }
    e.classes.forEach(function (k) {
      if (!k.ver || k.filtro === false) return;
      geoms.forEach(function (g) {
        var f = todos([base, filtroGeom(o.geom ? null : g), k.filtro]);
        k.sl.forEach(function (s) {
          var a = (s.alfa == null ? 1 : s.alfa) * (e.opac == null ? 1 : e.opac);
          if (s.k === "fill" && g === "Polygon") {
            if (s.padrao) {
              var pid = "ipr-dp-p-" + chave(s.padrao); if (!imgs.some(function (x) { return x.id === pid; })) imgs.push({ id: pid, tipo: "padrao", def: s.padrao, lat: lat });
              L.push(zoom(meta({ id: id(), type: "fill", source: o.fonte, filter: f, paint: { "fill-pattern": pid, "fill-opacity": a } }, { "fill-opacity": a }), k));
            } else if (s.cor[3] > 0.004) {
              L.push(zoom(meta({ id: id(), type: "fill", source: o.fonte, filter: f, paint: { "fill-color": rgba(s.cor, 1), "fill-opacity": a, "fill-antialias": true } }, { "fill-opacity": a }), k));
            }
          } else if (s.k === "line" && (g === "Polygon" || g === "Line")) {
            if (s.cor[3] <= 0.004) return;
            var p = { "line-color": rgba(s.cor, 1), "line-opacity": a, "line-width": mlMedida(s.larg, lat, 0.5) };
            if (s.dash && s.dash.length) p["line-dasharray"] = s.dash;
            if (s.offset) p["line-offset"] = mlMedida(s.offset, lat, -1e9);
            L.push(zoom(meta({ id: id(), type: "line", source: o.fonte, filter: f, layout: { "line-cap": s.cap || "butt", "line-join": s.join || "bevel" }, paint: p }, { "line-opacity": a }), k));
          } else if (s.k === "marker" && g === "Point") {
            if (s.forma === "circle") {
              var raio = s.tam.u === "px" ? Math.max(1, +(s.tam.v / 2).toFixed(2)) : mlMedida({ v: s.tam.v / 2, u: "m" }, lat, 0.5);
              var cp = { "circle-color": rgba(s.cor, 1), "circle-opacity": a, "circle-radius": raio, "circle-stroke-color": rgba(s.contorno || [0, 0, 0, 0], 1), "circle-stroke-opacity": a, "circle-stroke-width": s.contL && s.contL.v ? mlMedida(s.contL, lat, 0) : (s.contorno && s.contorno[3] > 0 ? 1 : 0) };
              L.push(zoom(meta({ id: id(), type: "circle", source: o.fonte, filter: f, paint: cp }, { "circle-opacity": cp["circle-opacity"], "circle-stroke-opacity": cp["circle-stroke-opacity"] }), k));
            } else {
              // Outras formas: imagem desenhada à medida (40 px de lado útil), escalada com icon-size.
              var def = { forma: s.forma, cor: s.cor, contorno: s.contorno, contL: s.contL && s.contL.u === "px" ? s.contL.v : 1, ang: 0 };
              var mid = "ipr-dp-m-" + chave(def); if (!imgs.some(function (x) { return x.id === mid; })) imgs.push({ id: mid, tipo: "marcador", def: def });
              var tamPx = s.tam.u === "px" ? s.tam.v : null;
              L.push(zoom(meta({ id: id(), type: "symbol", source: o.fonte, filter: f, layout: { "icon-image": mid, "icon-size": tamPx != null ? +(tamPx / 40).toFixed(3) : ["interpolate", ["exponential", 2], ["zoom"], 0, pxEm(s.tam, 0, lat) / 40, 24, pxEm(s.tam, 24, lat) / 40], "icon-rotate": s.ang || 0, "icon-rotation-alignment": "map", "icon-allow-overlap": true, "icon-ignore-placement": true }, paint: { "icon-opacity": a } }, { "icon-opacity": a }), k));
            }
          }
        });
      });
    });
    if (e.rot) {
      var r = e.rot, fonte = r.negrito ? "Noto Sans Bold" : (r.italico ? "Noto Sans Italic" : "Noto Sans Regular");
      var lp = { "text-field": ["to-string", r.e], "text-font": ["literal", [fonte]], "text-size": mlMedida(r.tam, lat, 6), "text-max-width": 12, "text-padding": 2 };
      if (o.geom === "Line") { lp["symbol-placement"] = "line"; lp["symbol-spacing"] = 300; }
      var tp = { "text-color": rgba(r.cor, 1), "text-opacity": r.op * (e.opac == null ? 1 : e.opac) };
      if (r.halo) { tp["text-halo-color"] = rgba(r.halo, 1); tp["text-halo-width"] = mlMedida(r.haloL, lat, 0.5); }
      L.push(zoom(meta({ id: id(), type: "symbol", source: o.fonte, filter: todos([base, r.filtro]), layout: lp, paint: tp }, { "text-opacity": tp["text-opacity"] }), {}));
    }
    return { camadas: L, imagens: imgs };
  }

  // Desenho das imagens (padrões e marcadores) num canvas; devolve {width, height, data} para map.addImage.
  function imagem(def, tipo, lat) {
    var c = D.createElement("canvas"), x, R = 2; // R: densidade (pixelRatio 2, nítido no iPad)
    if (tipo === "marcador") {
      var t = 40 * R + 8 * R; c.width = c.height = t; x = c.getContext("2d"); if (!x) return null;
      x.translate(t / 2, t / 2); x.rotate((def.ang || 0) * Math.PI / 180);
      var r = 20 * R, f = def.forma; x.beginPath();
      function poli(nv, rot, rr) { for (var i = 0; i < nv; i++) { var a = rot + i * 2 * Math.PI / nv; x[i ? "lineTo" : "moveTo"](Math.cos(a) * (rr || r), Math.sin(a) * (rr || r)); } x.closePath(); }
      if (f === "square" || f === "square_with_corners" || f === "rectangle") x.rect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
      else if (f === "diamond") poli(4, -Math.PI / 2);
      else if (f === "triangle" || f === "equilateral_triangle") poli(3, -Math.PI / 2);
      else if (f === "pentagon") poli(5, -Math.PI / 2);
      else if (f === "hexagon") poli(6, 0);
      else if (f === "octagon") poli(8, Math.PI / 8);
      else if (f === "decagon") poli(10, 0);
      else if (f === "star") { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); }
      else if (f === "arrowhead") { x.moveTo(-r * 0.7, -r * 0.6); x.lineTo(r * 0.5, 0); x.lineTo(-r * 0.7, r * 0.6); }
      else if (f === "line") { x.moveTo(0, -r); x.lineTo(0, r); }
      else if (f === "cross" || f === "cross2" || f === "cross_fill") { x.moveTo(-r, 0); x.lineTo(r, 0); x.moveTo(0, -r); x.lineTo(0, r); }
      else x.arc(0, 0, r, 0, 2 * Math.PI);
      var aberto = f === "arrowhead" || f === "line" || f === "cross" || f === "cross2";
      if (!aberto) { x.fillStyle = rgba(def.cor, 1); x.fill(); }
      var cc = aberto ? (def.cor[3] > 0.05 ? def.cor : def.contorno) : def.contorno;
      if (cc && cc[3] > 0) { x.strokeStyle = rgba(cc, 1); x.lineWidth = Math.max(1, (aberto ? 3 : def.contL || 1) * R); x.lineJoin = "round"; x.stroke(); }
      var im = x.getImageData(0, 0, t, t); return { img: { width: t, height: t, data: new Uint8Array(im.data.buffer) }, pixelRatio: R };
    }
    // padrões
    if (def.tipo === "linhas") {
      var d = Math.max(3, Math.round(pxEm(def.dist, 17, lat) * R)), lw = Math.max(1, pxEm(def.larg, 17, lat) * R);
      c.width = c.height = d; x = c.getContext("2d"); if (!x) return null;
      x.strokeStyle = rgba(def.cor, 1); x.lineWidth = lw; x.lineCap = "square";
      def.angs.forEach(function (ag) {
        x.beginPath();
        if (ag === 0) { x.moveTo(0, d / 2); x.lineTo(d, d / 2); }
        else if (ag === 90) { x.moveTo(d / 2, 0); x.lineTo(d / 2, d); }
        else if (ag === 45) { x.moveTo(-1, d + 1); x.lineTo(d + 1, -1); x.moveTo(-d / 2, d / 2); x.lineTo(d / 2, -d / 2); x.moveTo(d / 2, d * 1.5); x.lineTo(d * 1.5, d / 2); }
        else { x.moveTo(-1, -1); x.lineTo(d + 1, d + 1); x.moveTo(d / 2, -d / 2); x.lineTo(d * 1.5, d / 2); x.moveTo(-d / 2, d / 2); x.lineTo(d / 2, d * 1.5); }
        x.stroke();
      });
    } else {
      var dx = Math.max(4, Math.round(pxEm(def.dx, 17, lat) * R)), dy = Math.max(4, Math.round(pxEm(def.dy, 17, lat) * R)), mk = def.marcador || {};
      c.width = dx; c.height = dy; x = c.getContext("2d"); if (!x) return null;
      var rp = Math.max(1, Math.min(pxEm(mk.tam || { v: 3, u: "px" }, 17, lat) * R / 2, Math.min(dx, dy) / 2 - 1));
      x.beginPath(); x.arc(dx / 2, dy / 2, rp, 0, 2 * Math.PI); x.fillStyle = rgba(mk.cor && mk.cor[3] > 0.02 ? mk.cor : (mk.contorno || [0, 0, 0, 1]), 1); x.fill();
    }
    var id2 = x.getImageData(0, 0, c.width, c.height);
    return { img: { width: c.width, height: c.height, data: new Uint8Array(id2.data.buffer) }, pixelRatio: R };
  }

  // Amostra de cor de uma classe (para a lista e a legenda).
  function amostra(k) {
    var s = (k && k.sl) || [], f = s.filter(function (x) { return x.k === "fill"; })[0], l = s.filter(function (x) { return x.k === "line"; })[0], m = s.filter(function (x) { return x.k === "marker"; })[0];
    if (f && f.padrao) return { fundo: rgba(f.padrao.cor || (f.padrao.marcador || {}).cor || [128, 128, 128, 1], 0.55), borda: l ? rgba(l.cor, 1) : "" };
    if (f && f.cor[3] > 0.02) return { fundo: rgba(f.cor, Math.max(0.35, f.cor[3]) / Math.max(f.cor[3], 0.01)), borda: l ? rgba(l.cor, 1) : "" };
    if (l) return { fundo: rgba(l.cor, 1), linha: 1 };
    if (m) return { fundo: rgba(m.cor[3] > 0.05 ? m.cor : m.contorno, 1), ponto: 1 };
    return { fundo: "#888" };
  }

  // =====================================================================================================================
  // 2. GeoPackage no navegador (sql.js): atributos, layer_styles e primeiro vértice de cada elemento
  // =====================================================================================================================
  // PT-TM06 (EPSG:3763, GRS80) -> WGS84 (graus). Inverso da projecção transversa de Mercator (Snyder); ETRS89 = WGS84 aqui.
  function tm06(x, y) {
    var a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    var la0 = 39.66825833333333 * Math.PI / 180, lo0 = -8.133108333333334 * Math.PI / 180;
    var A0 = 1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256;
    function M(p) { return a * (A0 * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * p) + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * p) - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * p)); }
    var mu = (M(la0) + y) / (a * A0), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
    var s = Math.sin(p1), c = Math.cos(p1), tn = Math.tan(p1), C1 = ep2 * c * c, T1 = tn * tn, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), Dd = x / N1;
    var lat = p1 - (N1 * tn / R1) * (Dd * Dd / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * Math.pow(Dd, 4) / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * Math.pow(Dd, 6) / 720);
    var lon = lo0 + (Dd - (1 + 2 * T1 + C1) * Math.pow(Dd, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * Math.pow(Dd, 5) / 120) / c;
    return [lon * 180 / Math.PI, lat * 180 / Math.PI];
  }
  // Primeiro vértice de uma geometria GeoPackage (cabeçalho GP + WKB); null se vazia ou curva.
  function primeiroGpkg(b) {
    if (!b || b.length < 8 || b[0] !== 0x47 || b[1] !== 0x50) return null;
    var fl = b[3]; if ((fl >> 4) & 1) return null;
    var env = [0, 32, 48, 48, 64][(fl >> 1) & 7]; if (env == null) return null;
    var dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    function wkb(o, prof) {
      if (o + 5 > b.length || prof > 4) return null;
      var le = b[o] === 1, t = dv.getUint32(o + 1, le), tb = (t & 0x0fffffff) % 1000;
      if (tb === 1) { var X = dv.getFloat64(o + 5, le), Y = dv.getFloat64(o + 13, le); return isNaN(X) ? null : [X, Y]; }
      if (tb === 2) return dv.getUint32(o + 5, le) ? [dv.getFloat64(o + 9, le), dv.getFloat64(o + 17, le)] : null;
      if (tb === 3) return dv.getUint32(o + 5, le) && dv.getUint32(o + 9, le) ? [dv.getFloat64(o + 13, le), dv.getFloat64(o + 21, le)] : null;
      if (tb >= 4 && tb <= 7) return dv.getUint32(o + 5, le) ? wkb(o + 9, prof + 1) : null;
      return null;
    }
    try { return wkb(8 + env, 0); } catch (e) { return null; }
  }
  function primeiroGeoJson(g) {
    var c = g && g.coordinates; if (!c) return null;
    while (Array.isArray(c) && Array.isArray(c[0])) c = c[0];
    return Array.isArray(c) && typeof c[0] === "number" ? c : null;
  }
  // Lê um GeoPackage: por tabela de elementos, os atributos e o primeiro vértice (em WGS84 quando o SRC é 3763 ou 4326),
  // só dos elementos com geometria; e os estilos da tabela layer_styles (QML e SLD, o de omissão primeiro).
  function lerGpkg(SQL, bytes) {
    var db = new SQL.Database(new Uint8Array(bytes)), out = { tabelas: {}, estilos: {} };
    function q(s) { var r = []; try { var st = db.prepare(s); while (st.step()) r.push(st.getAsObject()); st.free(); } catch (e) {} return r; }
    try {
      var gc = {}; q("SELECT table_name t, column_name c, srs_id s FROM gpkg_geometry_columns").forEach(function (r) { gc[r.t] = r; });
      var srs = {}; q("SELECT srs_id s, organization o, organization_coordsys_id c FROM gpkg_spatial_ref_sys").forEach(function (r) { srs[r.s] = String(r.o || "").toUpperCase() === "EPSG" ? +r.c : +r.s; });
      q("SELECT table_name t FROM gpkg_contents WHERE data_type='features'").forEach(function (r) {
        var g = gc[r.t]; if (!g) return;
        var epsg = srs[g.s] || +g.s, qt = '"' + String(r.t).replace(/"/g, '""') + '"', linhas = [], vert = [];
        var st; try { st = db.prepare("SELECT * FROM " + qt + " ORDER BY rowid"); } catch (e) { return; }
        while (st.step()) {
          var o = st.getAsObject(), gb = o[g.c], p = primeiroGpkg(gb);
          if (!p) continue; // elementos sem geometria não chegam ao GeoJSON do conv.py
          var pr = {};
          Object.keys(o).forEach(function (k) { if (k === g.c) return; var v = o[k]; if (v instanceof Uint8Array) return; pr[k] = v; });
          linhas.push(pr); vert.push(epsg === 3763 ? tm06(p[0], p[1]) : epsg === 4326 ? p : null);
        }
        st.free();
        out.tabelas[r.t] = { linhas: linhas, vert: vert, epsg: epsg };
      });
      q("SELECT f_table_name t, styleQML q, styleSLD s, useAsDefault d FROM layer_styles ORDER BY useAsDefault DESC, id DESC").forEach(function (r) {
        if (!out.estilos[r.t]) out.estilos[r.t] = { qml: r.q || "", sld: r.s || "" };
      });
    } finally { db.close(); }
    return out;
  }
  // Junta os atributos do GeoPackage aos elementos do GeoJSON de uma camada, pela ordem; confere o primeiro vértice do
  // primeiro, do do meio e do último (até 3 m). Devolve {ok, n, porque}.
  function juntar(feats, tab) {
    if (!tab) return { ok: false, porque: "tabela não encontrada no GeoPackage" };
    if (feats.length !== tab.linhas.length) return { ok: false, porque: feats.length + " elementos no mapa e " + tab.linhas.length + " no GeoPackage" };
    if (!feats.length) return { ok: true, n: 0 };
    var idx = [0, feats.length >> 1, feats.length - 1], conferidos = 0;
    for (var j = 0; j < idx.length; j++) {
      var a = primeiroGeoJson(feats[idx[j]].geometry), b = tab.vert[idx[j]];
      if (!a || !b) continue;
      var dx = (a[0] - b[0]) * 111320 * Math.cos(a[1] * Math.PI / 180), dy = (a[1] - b[1]) * 110540;
      if (Math.sqrt(dx * dx + dy * dy) > 3) return { ok: false, porque: "a ordem dos elementos não confere (elemento " + (idx[j] + 1) + ")" };
      conferidos++;
    }
    feats.forEach(function (f, i) {
      var pr = tab.linhas[i], p = f.properties || (f.properties = {});
      Object.keys(pr).forEach(function (k) { if (k !== "camada" && k !== "f") p[k] = pr[k]; });
    });
    return { ok: true, n: feats.length, conferido: conferidos > 0, epsg: tab.epsg };
  }

  // =====================================================================================================================
  // 3. Dados de cada projecto (rotas do Núcleo)
  // =====================================================================================================================
  var API = "/wp-json/tcd/v1/";
  function pedir(rota, tipo) {
    return fetch(API + rota, { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce || "" } }).then(function (r) {
      if (!r.ok) { var e = new Error("Erro " + r.status); e.status = r.status; throw e; }
      return tipo === "bin" ? r.arrayBuffer() : tipo === "txt" ? r.text() : r.json();
    });
  }
  var SQLP = null;
  function sqljs() {
    if (SQLP) return SQLP;
    SQLP = new Promise(function (res, rej) {
      var U = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/";
      function ok() { W.initSqlJs({ locateFile: function (x) { return U + x; } }).then(res, rej); }
      if (W.initSqlJs) return ok();
      var sc = D.createElement("script"); sc.src = U + "sql-wasm.js"; sc.crossOrigin = "anonymous"; sc.onload = ok;
      sc.onerror = function () { SQLP = null; rej(new Error("não consegui abrir a ferramenta de GeoPackage")); };
      D.head.appendChild(sc);
    });
    return SQLP;
  }
  function norm(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\.[a-z0-9]{2,7}$/, "").replace(/[^a-z0-9]+/g, ""); }

  var P = {};       // por encomenda: {fase, conv, pf, qgs, entradas, notas, pode, erro}
  var GJ = {};      // GeoJSON por ficheiro convertido: Promise
  var GP = {};      // GeoPackage lido por id dos Ficheiros do projecto: Promise
  var VER = 0;      // muda quando há algo novo para desenhar
  function mudou() { VER++; try { if (W.IPRMinhasBases && W.IPRMinhasBases.pintar) W.IPRMinhasBases.pintar(); } catch (e) {} }
  var MEMK = "ipr_dp_v1";
  function memLer() { try { return JSON.parse(localStorage.getItem(MEMK) || "{}") || {}; } catch (e) { return {}; } }
  function memGravar(o) { try { localStorage.setItem(MEMK, JSON.stringify(o)); } catch (e) {} }
  var MEM = memLer(); if (!MEM.on) MEM.on = {}; if (!MEM.op) MEM.op = {};

  function latDe(enc) { var x = P[enc]; return (x && x.lat) || 39.5; }
  // Duas fases: as listas (convertidos e ficheiros do projecto, para saber se há Design) logo que o projecto aparece na
  // barra; o projecto QGIS (pode ter alguns MB) só quando a pessoa abre o projecto ou tinha camadas ligadas da última vez.
  function projecto(m) {
    var enc = String(m.id);
    if (P[enc]) return P[enc];
    var x = P[enc] = { fase: "a-ler", entradas: [], notas: [], enc: enc, lat: 39.5 };
    try { var b = m.geojson && (typeof m.geojson === "string" ? JSON.parse(m.geojson) : m.geojson), c = primeiroGeoJson(b && (b.type === "FeatureCollection" ? (b.features[0] || {}).geometry : b.type === "Feature" ? b.geometry : b)); if (c) x.lat = c[1]; } catch (e) {}
    x.listas = pedir("carregar?projecto=" + encodeURIComponent(enc)).then(function (j) {
      x.pode = !!j.pode;
      x.conv = (j.ficheiros || []).filter(function (f) { return f && f.id; });
      return pedir("pfich?alvo=" + encodeURIComponent("e:" + enc)).then(function (k) { x.pf = k.ficheiros || []; }, function () { x.pf = []; });
    }).then(function () {
      x.fase = "listas"; mudou();
      if ((MEM.on[enc] || []).length) completar(x);
    }, function (e) {
      x.fase = e && e.status === 403 ? "sem-acesso" : "erro"; x.erro = e && e.message; mudou();
    });
    return x;
  }
  function completar(x) {
    if (x.fase !== "listas") return;
    x.fase = "a-montar";
    var qs = (x.pf || []).filter(function (f) { return /^(qgs|qgz)$/i.test(f.ext || ""); });
    // O .qgs mais recente, de preferência na pasta Design.
    qs.sort(function (a, b) { return ((b.pasta === "design") - (a.pasta === "design")) || (b.id - a.id); });
    x.qgs = qs[0] || null;
    if (qs.length > 1) nota(x.notas, "há " + qs.length + " projectos QGIS: usa-se «" + x.qgs.nome + "» (o mais recente)");
    var p = !x.qgs ? Promise.resolve(null) : pedir("pfich/f?id=" + x.qgs.id + "&dl=1", x.qgs.ext === "qgz" ? "bin" : "txt").then(function (t) {
      if (x.qgs.ext !== "qgz") return t;
      if (!W.JSZip) throw new Error("sem JSZip para abrir o .qgz");
      return W.JSZip.loadAsync(t).then(function (z) { var n = Object.keys(z.files).filter(function (k) { return /\.qgs$/i.test(k); })[0]; if (!n) throw new Error(".qgz sem .qgs"); return z.files[n].async("string"); });
    }).then(function (xml) { return lerProjecto(xml); }).catch(function (e) { nota(x.notas, "projecto QGIS «" + x.qgs.nome + "» não lido (" + e.message + "): estilos dos GeoPackages"); x.qgs = null; return null; });
    p.then(function (qp) { montar(x, qp); x.fase = "pronto"; mudou(); repor(x); })
      .catch(function (e) { x.fase = "erro"; x.erro = e && e.message; mudou(); });
  }

  // Entradas da lista: as camadas do QGIS (ordem e nomes do projecto) e, depois, o que foi convertido e o QGIS não usa.
  function montar(x, qp) {
    var conv = (x.conv || []).filter(function (f) { return f.estado === "pronto" && f.geojson; }), usados = {}, ents = [];
    function convDe(fich) { var n = norm(fich); return (x.conv || []).filter(function (f) { return norm(f.nome) === n; })[0] || null; }
    function camadaDe(f, nome) {
      var cs = (f && f.info && f.info.camadas) || []; if (!cs.length) return { nome: null, n: 0 };
      if (nome == null) return cs.length === 1 ? cs[0] : null;
      var n = norm(nome); return cs.filter(function (c) { return norm(c.nome) === n; })[0] || (cs.length === 1 ? cs[0] : null);
    }
    if (qp) {
      Array.prototype.push.apply(x.notas, qp.notas);
      qp.camadas.forEach(function (q) {
        var f = convDe(q.ficheiro), notas = [], ent = { k: "q" + norm(q.id), nome: q.nome, grupo: q.grupo, visivelQgis: q.visivel, ordem: q.ordem, ficheiro: q.ficheiro, notas: notas, origem: "QGIS" };
        if (!f) { ent.estado = "fora"; ent.msg = "o ficheiro " + q.ficheiro + " não está nos ficheiros do projecto"; ents.push(ent); return; }
        if (f.estado !== "pronto" || !f.geojson) { ent.estado = "fora"; ent.msg = f.estado === "erro" ? (f.msg || "não convertido") : "ainda a converter"; ents.push(ent); return; }
        var c = camadaDe(f, q.camada);
        if (!c) { ent.estado = "fora"; ent.msg = "camada «" + q.camada + "» não encontrada em " + f.nome; ents.push(ent); return; }
        usados[f.id + "|" + c.nome] = 1;
        ent.conv = f; ent.camada = c.nome; ent.n = c.n; ent.estado = c.n ? "ok" : "vazia";
        ent.geom = /Polygon/i.test(q.geom) ? "Polygon" : /Line/i.test(q.geom) ? "Line" : /Point/i.test(q.geom) ? "Point" : "";
        try { ent.estilo = estiloDe(q.no, notas, x.lat); } catch (er) { nota(notas, "estilo não lido (" + er.message + ")"); }
        if (!ent.estilo || ent.estilo.nada) { if (!ent.estilo) nota(notas, "sem estilo: estilo simples"); ent.estilo = ent.estilo || estiloSimples(ents.length); }
        ents.push(ent);
      });
    }
    var extra = 0;
    conv.forEach(function (f) {
      ((f.info && f.info.camadas) || [{ nome: null, n: 0 }]).forEach(function (c) {
        if (usados[f.id + "|" + c.nome]) return;
        var multi = ((f.info && f.info.camadas) || []).length > 1;
        ents.push({ k: "c" + f.id + "-" + norm(c.nome || "x").slice(0, 30), nome: f.nome.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") + (multi ? " · " + c.nome : ""), grupo: qp ? "Outros ficheiros do projecto" : "", visivelQgis: false, ordem: 1000 + extra, conv: f, camada: c.nome, n: c.n, estado: c.n ? "ok" : "vazia", estilo: estiloSimples(extra), notas: [], origem: "gpkg", geom: "" });
        extra++;
      });
    });
    x.entradas = ents;
  }

  // GeoJSON de um ficheiro convertido (uma vez por página), com os atributos juntados quando os estilos os pedem.
  function geojson(f) {
    if (!GJ[f.id]) GJ[f.id] = pedir("carregar/f?id=" + f.id + "&k=geojson").catch(function (e) { delete GJ[f.id]; throw e; });
    return GJ[f.id];
  }
  function gpkgOriginal(x, f) {
    var n = norm(f.nome), pf = (x.pf || []).filter(function (p) { return (p.ext || "") === "gpkg" && norm(p.nome) === n; }).sort(function (a, b) { return b.id - a.id; })[0];
    if (!pf) return Promise.resolve(null);
    if (!GP[pf.id]) GP[pf.id] = Promise.all([sqljs(), pedir("pfich/f?id=" + pf.id + "&dl=1", "bin")]).then(function (r) { return lerGpkg(r[0], r[1]); }).catch(function (e) { delete GP[pf.id]; throw e; });
    return GP[pf.id];
  }
  function tabelaDe(g, camada) { if (!g) return null; var n = norm(camada); var k = Object.keys(g.tabelas).filter(function (t) { return norm(t) === n; })[0]; return k ? g.tabelas[k] : (Object.keys(g.tabelas).length === 1 ? g.tabelas[Object.keys(g.tabelas)[0]] : null); }
  function estiloDoGpkg(g, camada) { if (!g) return null; var n = norm(camada); var k = Object.keys(g.estilos).filter(function (t) { return norm(t) === n; })[0]; return k ? g.estilos[k] : null; }

  // Prepara uma entrada para o mapa: GeoJSON, atributos (se precisa) e, sem QGIS, o estilo da layer_styles.
  function preparar(x, ent) {
    if (ent.pronta) return ent.pronta;
    ent.pronta = geojson(ent.conv).then(function (gj) {
      var precisaAtr = ent.estilo && ((ent.estilo.campos || []).length || ent.estilo.classes.some(function (k) { return k.filtro; }) || ent.estilo.rot);
      var precisaEst = ent.origem === "gpkg";
      if (!precisaAtr && !precisaEst) return gj;
      return gpkgOriginal(x, ent.conv).then(function (g) {
        if (precisaEst) {
          var es = estiloDoGpkg(g, ent.camada), notas = ent.notas, e = null;
          if (es && es.qml) { try { e = estiloQml(es.qml, notas, x.lat); if (e) ent.origem = "layer_styles (QML)"; } catch (er) { nota(notas, "QML não lido: " + er.message); } }
          if (!e && es && es.sld) { try { e = estiloSld(es.sld, notas); if (e) ent.origem = "layer_styles (SLD)"; } catch (er2) { nota(notas, "SLD não lido: " + er2.message); } }
          if (e && !e.nada) ent.estilo = e; else { ent.origem = "estilo simples"; if (!es) nota(notas, g ? "sem estilo no GeoPackage: estilo simples" : "GeoPackage original não encontrado: estilo simples"); }
        }
        var precisa2 = ent.estilo && ((ent.estilo.campos || []).length || ent.estilo.classes.some(function (k) { return k.filtro; }) || ent.estilo.rot);
        if (!precisa2) return gj;
        var tab = tabelaDe(g, ent.camada);
        var feats = (gj.features || []).filter(function (f) { return !ent.camada || (f.properties && f.properties.camada) === ent.camada; });
        var r = g ? (feats.length && feats[0].properties && "__dp" in feats[0].properties ? { ok: true } : juntar(feats, tab)) : { ok: false, porque: "GeoPackage original não encontrado nos ficheiros do projecto" };
        if (r.ok) feats.forEach(function (f) { f.properties.__dp = 1; });
        if (!r.ok) { nota(ent.notas, "atributos não juntados (" + r.porque + "): um só símbolo, sem rótulos"); ent.estilo = semAtributos(ent.estilo); }
        else if (r.ok && r.conferido === false) nota(ent.notas, "atributos juntados só pela contagem (SRC " + r.epsg + ")");
        gj.__dpJunto = (gj.__dpJunto || 0) + 1;
        return gj;
      }, function (e) {
        nota(ent.notas, "GeoPackage original não lido (" + e.message + "): um só símbolo"); ent.estilo = semAtributos(ent.estilo); if (precisaEst) ent.origem = "estilo simples"; return gj;
      });
    }).catch(function (e) { ent.pronta = null; throw e; });
    return ent.pronta;
  }

  // =====================================================================================================================
  // 4. Mapa: ligar, desligar, ordem como na árvore do QGIS, opacidade, repor depois de o Atlas refazer o mapa
  // =====================================================================================================================
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  var ON = {}; // chave global (enc|k) -> {x, ent, ids, mapa}
  function gk(x, ent) { return x.enc + "|" + ent.k; }
  function fonteDe(ent) { return "ipr-conv-" + ent.conv.id; }
  function prefixo(x, ent) { return "ipr-dp-" + ent.conv.id + "-" + chave(x.enc + "|" + ent.k); }
  function idsDe(M, pre) { var st = M && M.getStyle && M.getStyle(); return st ? st.layers.filter(function (l) { return l.id.indexOf(pre + "-") === 0; }).map(function (l) { return l.id; }) : []; }
  function opUser(x, ent) { var v = MEM.op[gk(x, ent)]; return v == null ? 100 : v; }
  function antesDe(M, x, ent) {
    // A camada entra logo abaixo da camada ligada mais próxima que está acima dela na árvore do QGIS.
    var acima = null;
    Object.keys(ON).forEach(function (k) {
      var o = ON[k]; if (o.ent === ent || o.mapa !== M) return;
      if (o.ent.ordem < ent.ordem && (!acima || o.ent.ordem > acima.ent.ordem)) acima = o;
    });
    if (!acima) return undefined;
    var ids = idsDe(M, prefixo(acima.x, acima.ent)); return ids[0];
  }
  function desenhar(x, ent, gj) {
    var M = mapa(); if (!M || !M.isStyleLoaded || !M.isStyleLoaded()) return false;
    var sid = fonteDe(ent), pre = prefixo(x, ent);
    var src = M.getSource(sid);
    if (!src) M.addSource(sid, { type: "geojson", data: gj });
    else if (gj.__dpJunto && src.__dpJunto !== gj.__dpJunto) { try { src.setData(gj); src.__dpJunto = gj.__dpJunto; } catch (e) {} }
    if (!src) M.getSource(sid).__dpJunto = gj.__dpJunto;
    idsDe(M, pre).forEach(function (id) { try { M.removeLayer(id); } catch (e) {} });
    var R = camadasMapLibre(ent.estilo, { fonte: sid, prefixo: pre, camada: ent.camada, geom: ent.geom, lat: x.lat });
    R.imagens.forEach(function (im) {
      if (M.hasImage && M.hasImage(im.id)) return;
      try { var d = imagem(im.def, im.tipo, im.lat || x.lat); if (d) M.addImage(im.id, d.img, { pixelRatio: d.pixelRatio }); } catch (e) { nota(ent.notas, "padrão ou marcador não desenhado (" + e.message + ")"); }
    });
    var antes = antesDe(M, x, ent), u = opUser(x, ent) / 100;
    R.camadas.forEach(function (l) {
      if (u !== 1) Object.keys(l.metadata["ipr-dp-op"]).forEach(function (p) { l.paint[p] = +(l.metadata["ipr-dp-op"][p] * u).toFixed(3); });
      if (l.type === "symbol" && l.layout && l.layout["icon-image"] && M.hasImage && !M.hasImage(l.layout["icon-image"])) { l.type = "circle"; l.paint = { "circle-radius": 4, "circle-color": "#888", "circle-opacity": u }; delete l.layout; }
      try { M.addLayer(l, antes && M.getLayer(antes) ? antes : undefined); } catch (e) { nota(ent.notas, "camada do mapa recusada (" + e.message + ")"); }
    });
    ON[gk(x, ent)] = { x: x, ent: ent, mapa: M };
    return true;
  }
  function ligar(x, ent, on, calado) {
    var key = gk(x, ent);
    if (!on) {
      var M = mapa(); delete ON[key];
      if (M && M.getStyle) {
        idsDe(M, prefixo(x, ent)).forEach(function (id) { try { M.removeLayer(id); } catch (e) {} });
        // A fonte só sai se mais nada a usar (o «Ver no mapa» do Processar usa a mesma).
        var sid = fonteDe(ent), st = M.getStyle(); if (st && !st.layers.some(function (l) { return l.source === sid; }) && M.getSource(sid)) { try { M.removeSource(sid); } catch (e) {} }
      }
      ent.aLigar = false;
      if (MEM.on[x.enc]) { MEM.on[x.enc] = MEM.on[x.enc].filter(function (k) { return k !== ent.k; }); memGravar(MEM); }
      if (!calado) mudou();
      return Promise.resolve();
    }
    if (ent.estado !== "ok") return Promise.resolve();
    ent.aLigar = true; ent.erro = ""; if (!calado) mudou();
    MEM.on[x.enc] = (MEM.on[x.enc] || []).filter(function (k) { return k !== ent.k; }).concat([ent.k]); memGravar(MEM);
    return preparar(x, ent).then(function (gj) {
      if (!ent.aLigar) return;
      ent.gj = gj;
      if (!desenhar(x, ent, gj)) ON[key] = { x: x, ent: ent, mapa: null }; // o ciclo desenha quando o mapa estiver pronto
      ent.aLigar = false; mudou();
    }, function (e) { ent.aLigar = false; ent.erro = e.message; delete ON[key]; mudou(); });
  }
  function ligado(x, ent) { return !!ON[gk(x, ent)] || !!ent.aLigar; }
  function varias(x, quais, on) {
    var lista = x.entradas.filter(function (e) { return e.estado === "ok" && quais(e); });
    // De baixo para cima, para a ordem do mapa ficar a do QGIS.
    lista.sort(function (a, b) { return b.ordem - a.ordem; });
    var p = Promise.resolve();
    lista.forEach(function (e) { p = p.then(function () { if (ligado(x, e) !== on) return ligar(x, e, on, true); }); });
    return p.then(mudou);
  }
  function opacidade(x, ent, v) {
    MEM.op[gk(x, ent)] = v; memGravar(MEM);
    var M = mapa(); if (!M || !M.getStyle) return;
    M.getStyle().layers.forEach(function (l) {
      if (l.id.indexOf(prefixo(x, ent) + "-") !== 0 || !l.metadata || !l.metadata["ipr-dp-op"]) return;
      var o = l.metadata["ipr-dp-op"]; Object.keys(o).forEach(function (p) { try { M.setPaintProperty(l.id, p, +(o[p] * v / 100).toFixed(3)); } catch (e) {} });
    });
  }
  // O que estava ligado da última vez volta a ligar-se quando o projecto fica pronto.
  function repor(x) { var ks = MEM.on[x.enc] || []; if (!ks.length) return; varias(x, function (e) { return ks.indexOf(e.k) >= 0; }, true); }
  // O Atlas refaz o mapa (mudar de Base, de fundo): as camadas ligadas voltam a desenhar-se, de baixo para cima.
  var VIGIADO = null;
  function repoe() {
    var M = mapa(); if (!M) return;
    if (M !== VIGIADO && M.on) { VIGIADO = M; try { M.on("styledata", function () { clearTimeout(repoe.t); repoe.t = setTimeout(repoe, 250); }); } catch (e) {} }
    if (!M.isStyleLoaded || !M.isStyleLoaded()) return;
    var falta = Object.keys(ON).map(function (k) { return ON[k]; }).filter(function (o) { return o.ent.gj && (o.mapa !== M || !idsDe(M, prefixo(o.x, o.ent)).length); });
    if (!falta.length) return;
    falta.sort(function (a, b) { return b.ent.ordem - a.ent.ordem; }).forEach(function (o) { try { desenhar(o.x, o.ent, o.ent.gj); } catch (e) { nota(o.ent.notas, "não voltou ao mapa (" + e.message + ")"); } });
  }
  setInterval(function () { if (!D.hidden) repoe(); }, 1500);
  function enquadrar(x, ent) {
    var M = mapa(), gj = ent.gj; if (!M || !gj) return;
    var b = [180, 90, -180, -90];
    (gj.features || []).forEach(function (f) { if (ent.camada && f.properties && f.properties.camada !== ent.camada) return; (function per(c) { if (!c) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(f.geometry && f.geometry.coordinates); });
    if (b[0] <= b[2]) try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 50, maxZoom: 18, duration: 700 }); } catch (e) {}
  }

  // =====================================================================================================================
  // 5. Interface: a parte «Design Terracrua Design» dentro do projecto aberto em «Os meus projectos»
  // =====================================================================================================================
  var TX = {
    pt: { titulo: "Design Terracrua Design", lendo: "A ler os ficheiros do projecto…", sem: "Ainda sem desenhos do projecto convertidos para o mapa.",
      semPode: "Carregue o projecto QGIS e os GeoPackages em «Ficheiros do projecto» (pasta Design).", erro: "Não foi possível ler os desenhos do projecto.",
      ligar: "Ligar todas", qgis: "Como no QGIS", desligar: "Desligar todas", qgisT: "Liga só as camadas visíveis no projecto QGIS",
      estilos: "Estilos: ", deQgs: "projecto QGIS ", deGpkg: "GeoPackages (layer_styles)", notas: "O que não se traduziu", vazia: "sem elementos",
      op: "Opacidade de ", ir: "Ir", irT: "Enquadrar esta camada", aLigar: "a abrir…", fora: "não está no mapa" },
    en: { titulo: "Terracrua Design project", lendo: "Reading the project files…", sem: "No project drawings converted for the map yet.",
      semPode: "Upload the QGIS project and the GeoPackages in «Project files» (Design folder).", erro: "Could not read the project drawings.",
      ligar: "Turn all on", qgis: "As in QGIS", desligar: "Turn all off", qgisT: "Turns on only the layers visible in the QGIS project",
      estilos: "Styles: ", deQgs: "QGIS project ", deGpkg: "GeoPackages (layer_styles)", notas: "What could not be translated", vazia: "no features",
      op: "Opacity of ", ir: "Go", irT: "Fit this layer", aLigar: "opening…", fora: "not on the map" }
  };
  function t(k) { var l = (W.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; return TX[l][k] || TX.pt[k]; }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  var CSS_ = "#ipr-mb .ipr-dp{border-top:1px dashed var(--ln);margin-top:6px;padding-top:2px}" +
    "#ipr-mb .ipr-dp-g{padding:6px 10px 2px 14px;font:600 10px/1.2 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu2,var(--mu))}" +
    "#ipr-mb .ipr-dp-it{padding:0 8px 0 6px}" +
    "#ipr-mb .ipr-dp-it .ipr-dp-l{display:flex;align-items:flex-start;gap:7px}" +
    "#ipr-mb .ipr-dp-it label{flex:1;min-width:0;display:flex;align-items:flex-start;gap:7px;padding:4px 4px 4px 6px;cursor:pointer;font:13px/1.3 Inter,system-ui,sans-serif;color:var(--tx)}" +
    "#ipr-mb .ipr-dp-it input[type=checkbox]{width:15px;height:15px;margin:1px 0 0;flex:none;accent-color:var(--ac);cursor:pointer}" +
    "#ipr-mb .ipr-dp-it.fora label{cursor:default;opacity:.55}" +
    "#ipr-mb .ipr-dp-cor{width:12px;height:10px;border-radius:2px;flex:none;margin-top:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}" +
    "#ipr-mb .ipr-dp-cor.lin{height:3px;margin-top:7px;border-radius:2px}#ipr-mb .ipr-dp-cor.pt{width:9px;height:9px;border-radius:50%;margin-top:3px}" +
    "#ipr-mb .ipr-dp-n{flex:1;min-width:0;overflow-wrap:anywhere}#ipr-mb .ipr-dp-n small{display:block;font-size:11px;color:var(--mu)}" +
    "#ipr-mb .ipr-dp-ir{flex:none;border:0;background:transparent;color:var(--mu);font:600 11.5px Inter,system-ui,sans-serif;padding:5px 4px;cursor:pointer}#ipr-mb .ipr-dp-ir:hover{color:var(--ac2)}" +
    "#ipr-mb .ipr-dp-leg{list-style:none;margin:0 0 4px 30px;padding:0}#ipr-mb .ipr-dp-leg li{display:flex;gap:6px;align-items:flex-start;font:11.5px/1.35 Inter,system-ui,sans-serif;color:var(--mu);padding:1px 0}" +
    "#ipr-mb .ipr-dp-op{display:block;width:calc(100% - 36px);margin:0 0 4px 30px;height:14px;accent-color:var(--ac)}" +
    "#ipr-mb .ipr-dp-reg{margin:4px 10px 6px;font:11.5px/1.4 Inter,system-ui,sans-serif;color:var(--mu)}#ipr-mb .ipr-dp-reg summary{cursor:pointer}#ipr-mb .ipr-dp-reg li{margin:2px 0}";
  function css() { if (D.getElementById("ipr-dp-css")) return; var s = el("style"); s.id = "ipr-dp-css"; s.textContent = CSS_; D.head.appendChild(s); }

  function tem(m) {
    if (!m || !W.tcdNonce) return false;
    var x = projecto(m);
    return !!(x.conv && x.conv.some(function (f) { return f.estado === "pronto" && f.geojson; }));
  }

  function parte(m) {
    if (!W.tcdNonce || !m) return null;
    css();
    var x = projecto(m);
    if (x.fase === "sem-acesso") return null;
    if (x.fase === "listas") completar(x);
    var semNada = x.conv && !x.conv.length;
    if (semNada && !x.pode) return null;
    var c = el("div", "ipr-dp"); c.setAttribute("data-dp", x.enc);
    c.appendChild(el("div", "ipr-mb-parte", t("titulo")));
    if (semNada) { c.appendChild(el("p", "ipr-mb-nota", t("sem") + " " + t("semPode"))); return c; }
    if (x.fase !== "pronto" && x.fase !== "erro") { c.appendChild(el("p", "ipr-mb-nota", t("lendo"))); return c; }
    if (x.fase === "erro") { c.appendChild(el("p", "ipr-mb-nota", t("erro") + (x.erro ? " (" + x.erro + ")" : ""))); return c; }
    if (!x.entradas.length) { c.appendChild(el("p", "ipr-mb-nota", t("sem") + (x.pode ? " " + t("semPode") : ""))); return c; }
    var acc = el("div", "ipr-mb-acc");
    function b(a, txt, tit) { var y = el("button", "", txt); y.type = "button"; y.setAttribute("data-dp-acc", a); y.setAttribute("data-mb-foco", "dp" + a + x.enc); if (tit) y.title = tit; acc.appendChild(y); }
    b("todas", t("ligar")); if (x.qgs) b("qgis", t("qgis"), t("qgisT")); b("nenhuma", t("desligar"));
    c.appendChild(acc);
    var ul = el("ul", "ipr-mb-cam"), grupo = null;
    x.entradas.slice().sort(function (a, b2) { return a.ordem - b2.ordem; }).forEach(function (e) {
      if ((e.grupo || "") !== grupo) { grupo = e.grupo || ""; if (grupo) ul.appendChild(el("li", "ipr-dp-g", grupo)); }
      var on = ligado(x, e), li = el("li", "ipr-dp-it" + (e.estado === "ok" ? "" : " fora")); li.setAttribute("data-dp-c", e.k);
      var lin = el("div", "ipr-dp-l"), lab = el("label"), ck = el("input"); ck.type = "checkbox"; ck.checked = on; ck.disabled = e.estado !== "ok"; ck.setAttribute("data-mb-foco", "dpc" + x.enc + e.k);
      lab.appendChild(ck);
      var k0 = e.estilo && e.estilo.classes.filter(function (k) { return k.ver && k.sl.length; })[0], am = amostra(k0);
      var q = el("i", "ipr-dp-cor" + (am.linha ? " lin" : am.ponto ? " pt" : "")); q.style.background = am.fundo; if (am.borda) q.style.boxShadow = "inset 0 0 0 1.5px " + am.borda; lab.appendChild(q);
      var nm = el("span", "ipr-dp-n", e.nome);
      var sub = e.estado === "ok" ? (e.ficheiro || (e.conv && e.conv.nome) || "") + (e.n != null ? " · " + e.n : "") : (e.estado === "vazia" ? t("vazia") : e.msg || t("fora"));
      if (e.aLigar) sub = t("aLigar"); else if (e.erro) sub = e.erro;
      nm.appendChild(el("small", "", sub)); lab.appendChild(nm); lin.appendChild(lab);
      if (on && e.gj) { var ir = el("button", "ipr-dp-ir", t("ir")); ir.type = "button"; ir.title = t("irT"); ir.setAttribute("aria-label", t("irT") + ": " + e.nome); ir.setAttribute("data-dp-ir", e.k); lin.appendChild(ir); }
      li.appendChild(lin);
      if (on && e.estilo) {
        var cl = e.estilo.classes.filter(function (k) { return k.ver && k.rotulo && k.filtro !== false; });
        if (cl.length > 1 || (cl.length === 1 && cl[0].filtro)) {
          var lg = el("ul", "ipr-dp-leg");
          cl.forEach(function (k) { var a2 = amostra(k), l2 = el("li"), s2 = el("i", "ipr-dp-cor" + (a2.linha ? " lin" : a2.ponto ? " pt" : "")); s2.style.background = a2.fundo; if (a2.borda) s2.style.boxShadow = "inset 0 0 0 1.5px " + a2.borda; l2.appendChild(s2); l2.appendChild(el("span", "", k.rotulo)); lg.appendChild(l2); });
          li.appendChild(lg);
        }
        var r = el("input", "ipr-dp-op"); r.type = "range"; r.min = "10"; r.max = "100"; r.value = String(opUser(x, e)); r.setAttribute("aria-label", t("op") + e.nome); r.setAttribute("data-mb-foco", "dpo" + x.enc + e.k); li.appendChild(r);
      }
      ul.appendChild(li);
    });
    c.appendChild(ul);
    var origem = x.qgs ? t("deQgs") + "«" + x.qgs.nome + "»" : t("deGpkg");
    var notas = registo(x.enc);
    var reg = el("details", "ipr-dp-reg"), sm = el("summary", "", t("estilos") + origem + (notas.length ? " · " + t("notas") + " (" + notas.length + ")" : ""));
    reg.appendChild(sm);
    if (notas.length) { var ln = el("ul"); notas.forEach(function (n) { ln.appendChild(el("li", "", n)); }); reg.appendChild(ln); }
    if (ABERTO[x.enc]) reg.open = true;
    reg.addEventListener("toggle", function () { ABERTO[x.enc] = reg.open; });
    c.appendChild(reg);
    c.addEventListener("click", function (ev) {
      var y = ev.target.closest && ev.target.closest("[data-dp-acc]");
      if (y) { var a = y.getAttribute("data-dp-acc"); if (a === "todas") varias(x, function () { return true; }, true); else if (a === "nenhuma") varias(x, function () { return true; }, false); else if (a === "qgis") { varias(x, function (e2) { return !e2.visivelQgis; }, false).then(function () { varias(x, function (e2) { return e2.visivelQgis; }, true); }); } return; }
      var z = ev.target.closest && ev.target.closest("[data-dp-ir]");
      if (z) { var en = x.entradas.filter(function (e3) { return e3.k === z.getAttribute("data-dp-ir"); })[0]; if (en) enquadrar(x, en); }
    });
    c.addEventListener("change", function (ev) {
      var ck2 = ev.target; if (!ck2 || ck2.type !== "checkbox") return;
      var li2 = ck2.closest("[data-dp-c]"), en = li2 && x.entradas.filter(function (e4) { return e4.k === li2.getAttribute("data-dp-c"); })[0];
      if (en) ligar(x, en, ck2.checked);
    });
    c.addEventListener("input", function (ev) {
      var r2 = ev.target; if (!r2 || r2.type !== "range") return;
      var li3 = r2.closest("[data-dp-c]"), en = li3 && x.entradas.filter(function (e5) { return e5.k === li3.getAttribute("data-dp-c"); })[0];
      if (en) opacidade(x, en, +r2.value);
    });
    return c;
  }
  var ABERTO = {};
  // O registo do que não se traduziu: notas gerais do projecto e de cada camada, com o nome da camada.
  function registo(enc) {
    var x = P[String(enc)]; if (!x) return [];
    var r = x.notas.slice();
    x.entradas.forEach(function (e) { (e.notas || []).forEach(function (n) { r.push("«" + e.nome + "»: " + n); }); });
    return r;
  }

  W.IPRDesign = {
    parte: parte, tem: tem, registo: registo, versao: function () { return VER; },
    estado: function (enc) { return P[String(enc)] || null; },
    // para os testes (sem rede nem mapa)
    _t: { lerProjecto: lerProjecto, estiloDe: estiloDe, estiloQml: estiloQml, estiloSld: estiloSld, camadasMapLibre: camadasMapLibre, expr: expr, tm06: tm06, lerGpkg: lerGpkg, juntar: juntar, primeiroGpkg: primeiroGpkg, semAtributos: semAtributos, estiloSimples: estiloSimples, montar: montar, norm: norm, amostra: amostra, imagem: imagem }
  };
  try { delete W.__iprDesignExpr; } catch (e) { W.__iprDesignExpr = undefined; }
})();
