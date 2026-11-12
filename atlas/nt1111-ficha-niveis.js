/* IPR Atlas · nt1111-ficha-niveis.js · Ficha da propriedade mais completa e os três níveis à vista (Nuno, 11/11/2026, 18h47:
   «ficou com muito pouca informação na ficha da propriedade [...] a visualização 3D, o valor estimativo da propriedade,
   utilizações. As fotos históricas não estão a funcionar [...] São 3 níveis e isso deve ser transparente»; caixas:
   «Faz e testo eu no iPhone» e «Valor só com conta grátis»). Terracrua Design. Só acrescenta; não edita ficha-gratuita.js,
   ficha-tempo.js, nt1110-valor.js nem nt1111-funil-direto.js.
   1. Fotos históricas: o ficha-tempo.js recorta a caixa de todos os polígonos do desenho; com um polígono antigo longe, a
      caixa fica enorme e as ortofotos saem brancas. Aqui, quando há mais de um polígono, as quatro imagens são refeitas só
      com o terreno escolhido (o polígono mais perto do centro do mapa), pelo mesmo window.IPRTempo.imagem.
   2. «Ver o terreno em 3D»: botão na ficha gratuita que abre um modelo 3D do terreno (relevo do Worker ipr-relevo, imagem
      de satélite, limite a amarelo), só quando se carrega e com «Fechar», para não pesar no telemóvel.
   3. Valor indicativo: sem sessão, uma linha «entre com a sua conta grátis para ver o intervalo» (o valor continua só com
      sessão, como decidido a 28/10).
   4. Três níveis: quadro «Ficha · Planta · Leitura» com o que cada um traz e o preço, e uma linha para a Base Cartográfica;
      os botões usam a compra que já existe (window.iprAssistenteComprar, do funil directo). Com o quadro à vista, o bloco
      «Deste terreno pode ter também» do funil directo fica escondido (só por CSS), para não repetir os mesmos produtos.
   5. (19h2x, Nuno: «avança com a explicação curta») «O que se sobrepõe a este terreno»: os nomes das camadas que tocam no
      limite (resultado do nt1110-terreno-camadas.js), cada uma com uma frase, sem percentagens nem mapa; no fim, o que a
      Planta e a Leitura acrescentam.
   6. (11/11, 22h23, Nuno: «voltar a ter percentagens REN, RAN e edificabilidade, se está ao abrigo de algo que permita
      construir, como teaser para as pessoas depois comprarem a planta e a leitura») «Pode construir? Primeira leitura»:
      REN e RAN em % (do cruzamento do nt1110-terreno-camadas.js), classe do solo e categorias do PDM em % (CRUS da DGT,
      medida aqui sobre o limite), o mínimo fora de REN e RAN, e um indício (favorável, condicionado, muito condicionado)
      com o regime que o PDM costuma prever para esse espaço. Sem índices nem áreas de construção: isso é a Leitura.
      Desligar só esta parte: ?fedif=0.
   Desligar: ?fniv=0 ou window.IPR_FICHA_NIVEIS_OFF = true. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.IPR_FICHA_NIVEIS_OFF || /[?&]fniv=0\b/.test(location.search) || W.__iprFNiv) return;
  W.__iprFNiv = 1;
  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en"; }
  function T(p, e) { return en() ? e : p; }
  function M() { return W.__ipe && W.__ipe.mapa; }
  function sessao() { var c = W.TCD_M1537; if (c && typeof c.sessao !== "undefined") return !!c.sessao; return /wordpress_logged_in/.test(D.cookie) || !!W.tcdValor; }
  function entrar() { var c = W.TCD_M1537; return (c && c.entrar) || "/conta/?redirect_to=" + encodeURIComponent(location.pathname + location.search); }

  // ---------- geometria ----------
  function desenho() {
    var m = M(); if (!m) return null; var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") { try { var a = cs[i].getAll(); if (a && a.features) return a; } catch (e) {} }
    return null;
  }
  function anel(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
  function caixaF(f) { var b = [180, 90, -180, -90]; anel(f.geometry).forEach(function (p) { p.forEach(function (r) { r.forEach(function (c) { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); }); }); }); return b; }
  function polis() { var a = desenho(); return a ? a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }) : []; }
  function escolhido() {
    var fs = polis(); if (!fs.length) return null; if (fs.length === 1) return fs[0];
    var m = M(), c = m ? m.getCenter() : { lng: 0, lat: 0 }, melhor = null, dm = Infinity;
    fs.forEach(function (f) { var b = caixaF(f), dentro = c.lng >= b[0] && c.lng <= b[2] && c.lat >= b[1] && c.lat <= b[3];
      var d = dentro ? -1 / Math.max(1e-9, (b[2] - b[0]) * (b[3] - b[1])) : Math.pow((b[0] + b[2]) / 2 - c.lng, 2) + Math.pow((b[1] + b[3]) / 2 - c.lat, 2);
      if (d < dm) { dm = d; melhor = f; } });
    return melhor;
  }

  // ---------- 1. fotos históricas ----------
  function fotos(out) {
    var ft = out.querySelector(".ipr-ft"); if (!ft || ft.__fniv || !W.IPRTempo || !W.IPRTempo.imagem) return;
    if (polis().length < 2) { ft.__fniv = 1; return; }
    var f = escolhido(); if (!f) return; ft.__fniv = 1;
    var F = { type: "FeatureCollection", features: [f] }, figs = ft.querySelectorAll(".ipr-ft-f figure"), anos = W.IPRTempo.anos || [];
    [].forEach.call(figs, function (fig, i) {
      var A = anos[i]; if (!A) return; var box = fig.querySelector(".ipr-ft-i"); if (!box) return;
      box.classList.add("fniv"); W.IPRTempo.imagem(F, A, 180).then(function (c) { c.classList.add("fniv"); [].forEach.call(box.querySelectorAll("canvas,span"), function (x) { x.remove(); }); box.appendChild(c); }).catch(function () {});
    });
  }

  // ---------- 2. 3D ----------
  var m3 = null;
  function fechar3d(w) { try { if (m3) m3.remove(); } catch (e) {} m3 = null; if (w) w.innerHTML = ""; }
  function abrir3d(w) {
    var f = escolhido(); if (!f || !W.maplibregl) return;
    fechar3d(w);
    w.innerHTML = '<div class="ipr-3d-c tcd-fn3"><div class="m"></div><div class="b"><button type="button" data-v="n">N</button><button type="button" data-v="x">' + T("Fechar", "Close") + '</button></div><div class="s"></div></div>';
    var b = caixaF(f), lim = { type: "FeatureCollection", features: anel(f.geometry).reduce(function (o, p) { p.forEach(function (r) { o.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: r } }); }); return o; }, []) };
    var C = w.querySelector(".m");
    try {
      m3 = new W.maplibregl.Map({ container: C, attributionControl: false, pitch: 60, bearing: -20, maxPitch: 80, interactive: true,
        style: { version: 8, sources: {
          sat: { type: "raster", tiles: ["https://ortos.dgterritorio.gov.pt/wms/ortosat2023?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ortoSat2023-CorVerdadeira&STYLES=&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg&BBOX={bbox-epsg-3857}"], tileSize: 256, maxzoom: 19, attribution: "DGT · OrtoSat 2023, CC BY 4.0" },
          dem: { type: "raster-dem", tiles: [location.origin + "/ipr-relevo/{z}/{x}/{y}.webp"], encoding: "terrarium", tileSize: 512, maxzoom: 14 },
          lim: { type: "geojson", data: lim } },
          layers: [{ id: "sat", type: "raster", source: "sat" },
            { id: "lim-s", type: "line", source: "lim", paint: { "line-color": "#000", "line-width": 5, "line-opacity": 0.35 } },
            { id: "lim", type: "line", source: "lim", paint: { "line-color": "#ffd23f", "line-width": 2.5 } }],
          terrain: { source: "dem", exaggeration: 1.4 } } });
      var ini = function () { m3.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 30, pitch: 60, bearing: -20, duration: 0 }); };
      m3.on("load", ini);
      w.querySelector(".s").textContent = T("Relevo LiDAR da DGT (Mapterhorn) · imagem Esri · exagero vertical 1,4×. Dois dedos para rodar e inclinar.", "DGT LiDAR relief (Mapterhorn) · Esri imagery · 1.4× vertical. Two fingers to rotate and tilt.");
      w.querySelector(".b").addEventListener("click", function (e) { var v = e.target.dataset && e.target.dataset.v; if (v === "n" && m3) m3.easeTo({ bearing: 0, duration: 400 }); if (v === "x") fechar3d(w); });
    } catch (e) { w.innerHTML = '<p class="ipe-small">' + T("Não foi possível abrir o 3D neste aparelho.", "3D could not open on this device.") + "</p>"; }
  }


  // ---------- 5. O que se sobrepõe a este terreno (explicação curta) ----------
  // Lê o resultado do cruzamento do nt1110-terreno-camadas.js (elemento .ipr-tcam, __tcam[0] = [{e: camada, r: resultado}]).
  // Mostra só os nomes e uma frase; sem percentagens nem mapa (isso fica para a Planta e a Leitura).
  var EXP = [
    [/reserva ecol|\bren\b/i, "Reserva Ecológica Nacional: protege solos, linhas de água e encostas; limita construir e mexer no terreno nessas áreas.", "National Ecological Reserve: protects soils, streams and slopes; limits building and earthworks there."],
    [/reserva agr|\bran\b/i, "Reserva Agrícola Nacional: solos de melhor aptidão agrícola; fora da agricultura, os usos precisam de parecer.", "National Agricultural Reserve: best farmland; non-farming uses need approval."],
    [/natura|\bzec\b|\bzpe\b|\bsic\b|habitat/i, "Rede Natura 2000 ou habitats protegidos: algumas obras e cortes pedem avaliação ambiental.", "Natura 2000 or protected habitats: some works and clearing need environmental assessment."],
    [/área protegida|area protegida|parque natural|reserva natural|paisagem protegida/i, "Área protegida: há um plano próprio com regras de uso.", "Protected area: its own management plan sets the rules."],
    [/domínio hídrico|dominio hidrico|linha.? de água|linhas de agua|rede hidrogr|curso.? de água/i, "Linhas de água e domínio hídrico: faixas junto à água com regras para construir, limpar e captar.", "Watercourses and water domain: strips along water with rules for building, clearing and abstraction."],
    [/albufeira|captaç|captac|perímetro de protec|perimetro de protec/i, "Albufeiras e captações: zonas de protecção da água, com usos condicionados.", "Reservoirs and water intakes: water protection zones with restricted uses."],
    [/aquífer|aquifer|vulnerável|vulneravel|nitrat/i, "Águas subterrâneas: zona sensível; adubos, efluentes e furos têm regras.", "Groundwater: sensitive zone; fertilisers, effluents and boreholes have rules."],
    [/perigosidade|risco de incênd|risco de incend/i, "Perigosidade de incêndio: pesa nas licenças para construir e nas faixas de gestão de combustível.", "Fire hazard: affects building permits and fuel management strips."],
    [/ardid|incêndio|incendio|fogo/i, "Áreas ardidas: o terreno ou parte dele ardeu; há restrições temporárias em zonas de povoamento florestal.", "Burnt areas: the land or part of it burned; temporary restrictions apply in forest stands."],
    [/faixa|gestão de combust|gestao de combust|\bfgc\b|\brede primária|rede primaria/i, "Faixas de gestão de combustível: limpeza obrigatória da vegetação numa largura definida.", "Fuel management strips: vegetation must be kept cleared within a set width."],
    [/sobreir|azinheir|montado/i, "Sobreiros e azinheiras: árvores protegidas; cortes e arranques precisam de autorização.", "Cork and holm oaks: protected trees; felling needs authorisation."],
    [/arvoredo|interesse público|interesse publico/i, "Arvoredo de interesse público: árvores classificadas com zona de protecção.", "Trees of public interest: classified trees with a protection zone."],
    [/estrada|rodovi|ferrovi|linha.? férrea|ip\d|ic\d|\ben\d/i, "Rede viária ou ferroviária: servidão com afastamentos obrigatórios para construir e vedar.", "Road or rail network: easement with mandatory setbacks for building and fencing."],
    [/eléctric|electric|elétric|alta tensão|alta tensao|\brnt\b|gasod|oleod|condut/i, "Linhas eléctricas ou condutas: servidão com faixa de protecção.", "Power lines or pipelines: easement with a protection strip."],
    [/patrimóni|patrimoni|monumento|arqueol/i, "Património e arqueologia: obras perto de bens classificados ou sítios arqueológicos pedem parecer.", "Heritage and archaeology: works near listed assets or sites need approval."],
    [/pdm|ordenamento|crus|regime de uso/i, "Plano Director Municipal: define a classe do solo e o que se pode construir.", "Municipal Master Plan: sets the land class and what can be built."],
    [/cadastr|bupi|prédio|predio|parcel/i, "Cadastro e limites: os prédios e parcelas que o terreno toca.", "Cadastre and boundaries: the plots the land touches."],
    [/ocupação do solo|ocupacao do solo|\bcos\b|clc|corine/i, "Ocupação do solo: o que existe hoje no terreno (mato, floresta, agricultura, construção).", "Land cover: what is on the land today (scrub, forest, farming, buildings)."],
    [/solo|capacidade de uso|geolog|litolog/i, "Solos e geologia: aptidão do solo e o que está por baixo.", "Soils and geology: soil capability and what lies beneath."],
    [/clima|precipita|temperatura|evapotr/i, "Clima: chuva e temperatura da zona, para escolher culturas e gerir a água.", "Climate: local rainfall and temperature, to choose crops and manage water."]
  ];
  var GRUPO = { cond: ["Condicionantes e servidões", "Constraints and easements"], fogo: ["Fogo", "Fire"], agua: ["Água", "Water"], nat: ["Natureza e clima", "Nature and climate"], solo: ["Solo e vegetação", "Soil and vegetation"], prop: ["Limites e cadastro", "Boundaries and cadastre"] };
  function nomeC(c) { return (en() && c.en) || c.n || c.id || ""; }
  function frase(c) { var t = nomeC(c) + " " + (c.id || ""); for (var i = 0; i < EXP.length; i++) if (EXP[i][0].test(t)) return en() ? EXP[i][2] : EXP[i][1]; return ""; }
  function sobre(out) {
    var box = out.querySelector(".tcd-fn-s"); if (!box) return;
    var tc = out.querySelector(".ipr-tcam"), res = tc && tc.__tcam && tc.__tcam[0];
    if (!res || !res.length) { if (!box.__vazio) { box.__vazio = 1; box.innerHTML = ""; } return; }
    var chave = res.map(function (x) { return x.e && x.e.id; }).join(",");
    if (box.__chave === chave) return; box.__chave = chave; box.__vazio = 0;
    var vistos = {}, linhas = [], ordem = ["cond", "fogo", "agua", "nat", "solo", "prop"];
    res.slice().sort(function (a, b) { return ordem.indexOf(a.e.g) - ordem.indexOf(b.e.g); }).forEach(function (x) {
      var c = x.e || {}, fr = frase(c), k = fr || nomeC(c); if (!k || vistos[k]) return; vistos[k] = 1;
      linhas.push('<li><b>' + nomeC(c).replace(/</g, "&lt;") + "</b>" + (fr ? "<span>" + fr + "</span>" : "<span>" + T("Camada do grupo ", "Layer in group ") + ((GRUPO[c.g] || [c.g || ""])[en() ? 1 : 0]) + ".</span>") + "</li>");
    });
    var mx = 8, mais = linhas.length > mx ? linhas.length - mx : 0;
    box.innerHTML = "<h4>" + T("O que se sobrepõe a este terreno", "What overlaps this land") + "</h4><ul class=\"tcd-fn-l\">" + linhas.slice(0, mx).join("") + "</ul>" +
      (mais ? '<p class="tcd-fn-m">' + T("e mais " + mais + " camadas.", "and " + mais + " more layers.") + "</p>" : "") +
      '<p class="tcd-fn-m">' + T("Isto diz só o que toca no terreno. A <b>Planta de Localização</b> põe estas camadas em mapa, com os limites; a <b>Leitura Territorial</b> explica o que cada uma permite e impede neste terreno e quanto ocupa.", "This only says what touches the land. The <b>Location plan</b> puts these layers on a map with their limits; the <b>Land report</b> explains what each one allows or prevents here and how much it covers.") + "</p>";
  }


  // ---------- 6. Pode construir? Primeira leitura (teaser da Planta e da Leitura) ----------
  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/", EDIF_OFF = /[?&]fedif=0\b/.test(location.search), crusCache = {};
  function sa(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function nf(v) { return Number(v).toLocaleString(en() ? "en-GB" : "pt-PT", { maximumFractionDigits: v < 10 ? 1 : 0 }); }
  function chaveF(f) { var s = JSON.stringify(f.geometry), h = 0; for (var i = 0; i < s.length; i++) h = 31 * h + s.charCodeAt(i) | 0; return "c" + h; }
  function mxp(l) { return (l + 180) / 360; }
  function myp(a) { var r = a * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; }
  function pintar(G, geoms) {
    var c = D.createElement("canvas"); c.width = G.W; c.height = G.H; var x = c.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#000";
    geoms.forEach(function (g) { anel(g).forEach(function (p) { x.beginPath(); p.forEach(function (r) { r.forEach(function (q, i) {
      var px = (mxp(q[0]) - G.x0) / G.w * G.W, py = (myp(q[1]) - G.y0) / G.h * G.H; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); }); x.fill("evenodd"); }); });
    var d = x.getImageData(0, 0, G.W, G.H).data, m = new Uint8Array(G.W * G.H); for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0; return m;
  }
  function crusMedir(f) {
    var k = chaveF(f); if (crusCache[k]) return crusCache[k];
    var b = caixaF(f), x0 = mxp(b[0]), x1 = mxp(b[2]), y0 = myp(b[3]), y1 = myp(b[1]), w = x1 - x0, h = y1 - y0, S = 400;
    var G = { x0: x0, y0: y0, w: w, h: h, W: w >= h ? S : Math.max(8, Math.round(S * w / h)), H: w >= h ? Math.max(8, Math.round(S * h / w)) : S };
    var M = pintar(G, [f.geometry]), tot = 0; for (var i = 0; i < M.length; i++) tot += M[i];
    var u = OGC + "crus/items?f=json&limit=500&bbox=" + b.map(function (v) { return v.toFixed(6); }).join(",");
    function pedir(url) { return Promise.race([fetch(url, { headers: { Accept: "application/geo+json, application/json" } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      new Promise(function (_, ko) { setTimeout(function () { ko(new Error("tempo")); }, 20000); })]); }
    crusCache[k] = pedir(u).catch(function () { return pedir("/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(u)); }).then(function (j) {
      var gr = {};
      (j.features || []).forEach(function (ft) { var p = ft.properties || {}, d = p.designacao_no_plano || p.categoria_2021 || ""; if (!d || !ft.geometry) return;
        (gr[d] || (gr[d] = { d: d, classe: p.classe_2021 || "", cat: p.categoria_2021 || "", mun: p.municipio || "", g: [] })).g.push(ft.geometry); });
      var out = [];
      Object.keys(gr).forEach(function (d) { var A = pintar(G, gr[d].g), c = 0; for (var i = 0; i < M.length; i++) if (M[i] && A[i]) c++;
        if (c && tot) { var pct = Math.round(1000 * c / tot) / 10; if (pct >= 0.5) out.push({ d: d, classe: gr[d].classe, cat: gr[d].cat, mun: gr[d].mun, pct: pct }); } });
      return out.sort(function (a, z) { return z.pct - a.pct; });
    }).catch(function () { return null; });
    return crusCache[k];
  }
  // Tipo de espaço pela designação ou categoria da CRUS: u (edificável no plano), e (rústico com edificação prevista),
  // r (rústico agrícola, florestal ou agroflorestal: só os casos do regulamento), n (natural, protecção, água: muito restrito).
  function tipoEsp(c) {
    var s = sa(c.d + " " + c.cat + " " + c.classe);
    if (/urban|habitac|residenc|centralidad|consolidad|urbaniz|aglomerado urbano|baixa densidade|actividades economic|atividades economic|industr|equipament|turistic/.test(s) && !/rustic/.test(sa(c.classe))) return "u";
    if (/aglomerado rural|edificacao dispersa|edificacao em solo rural|area de edificacao|turism|equipamento|actividades|atividades|ocupacao turistica/.test(s)) return "e";
    if (/natura|protecc|protec|valorizacao ambiental|conservacao|ribeir|agua|maritim|praia|duna|aribas|arriba|recursos geologic|estrutura ecologica/.test(s)) return "n";
    if (/urban/.test(sa(c.classe))) return "u";
    return "r";
  }
  // 11/11/2026 (Nuno, 23h01: «nas fichas deve dizer logo se temos info de alta confiança ou se não há dados»): confiança das
  // regras do PDM de cada categoria, da tabela do worker 1.0.88 (pdm-confianca.json: a alta, m média, b por confirmar;
  // m = habitação sem área máxima; v = regra lida antes de uma alteração ao PDM).
  var confP = null, BASE = ((D.currentScript && D.currentScript.src) || "").split("?")[0].replace(/[^\/]*$/, "");
  function chv(s) { return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9;]+/g, " ").replace(/\s+/g, " ").replace(/^[ ;]+|[ ;]+$/g, ""); }
  function confJ() {
    if (!confP) { var u = W.TCD_PDM_CONF || "https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@de4255fe946e5c8f88a845212465bd4e9667a322/atlas/dados/pdm-confianca.json";
      confP = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function () { return null; }); }
    return confP;
  }
  function confDe(J, c) {
    if (!J) return null;
    var cc = J.c[chv(c.mun)]; if (!cc) return "s";
    var k = chv(c.d), v = cc.k[k];
    if (!v && k.indexOf(";") >= 0) { var ps = k.split(";").map(function (x) { return x.trim(); }).filter(Boolean), vs = ps.map(function (x) { return cc.k[x]; }).filter(Boolean); if (vs.length) v = vs.sort(function (a, z) { return "bma".indexOf(a[0]) - "bma".indexOf(z[0]); })[0]; }
    return v || "s";
  }
  // Rating do concelho (Nuno, 23h02: «Há município com e sem dados e PDMs em revisão etc, deve haver um rating para isso»):
  // A alta confiança · B boa · C média · D fraca (de resumo ou por confirmar) · E sem dados. Revisão em curso tira o A;
  // suspensões, medidas preventivas e CRUS de plano anterior descem para C. Calculado no worker 1.0.88 (pdm-confianca.json).
  var RAT = { A: ["ok", "Alta confiança", "High confidence"], B: ["ok", "Boa confiança", "Good confidence"], C: ["pc", "Confiança média", "Medium confidence"],
    D: ["dv", "Confiança fraca", "Low confidence"], E: ["dv", "Sem dados", "No data"] };
  var FLG = { revisao: ["PDM em revisão", "PDM under review"], suspensao: ["suspensão ou medidas preventivas", "suspension or preventive measures"],
    normas: ["normas provisórias", "provisional rules"], crus_anterior: ["carta de um plano anterior", "map from a previous plan"], hab_sem_max: ["habitação sem área máxima confirmada", "housing without confirmed maximum area"] };
  function confLinha(J, C) {
    if (!J || !C || !C.length) return "";
    var mun = {}, t = { a: 0, m: 0, b: 0, s: 0 };
    C.forEach(function (c) { var cc = J.c[chv(c.mun)], v = confDe(J, c) || "s"; t[v[0]] += c.pct; var k = cc ? cc.n : (c.mun || "?"); (mun[k] || (mun[k] = { cc: cc, p: 0 })).p += c.pct; });
    var tot = t.a + t.m + t.b + t.s || 1;
    var ms = Object.keys(mun).sort(function (a, z) { return mun[z].p - mun[a].p; });
    var pior = "A", ord = "ABCDE";
    var partes = ms.map(function (k) { var cc = mun[k].cc, r = cc ? cc.r : "E"; if (ord.indexOf(r) > ord.indexOf(pior)) pior = r;
      var fl = cc ? cc.f.map(function (x) { return FLG[x] ? T(FLG[x][0], FLG[x][1]) : x; }) : [T("regras do PDM ainda não reunidas", "PDM rules not yet gathered")];
      return "<b>" + k.replace(/</g, "&lt;") + "</b> " + r + (fl.length ? " (" + fl.join(", ") + ")" : ""); });
    if (100 * (t.s + t.b) / tot >= 50 && ord.indexOf(pior) < 3) pior = "D";
    var R = RAT[pior], det = [[t.a, T("alta", "high")], [t.m, T("média", "medium")], [t.b, T("por confirmar", "to confirm")], [t.s, T("sem dados", "no data")]]
      .filter(function (x) { return x[0] >= 0.5; }).map(function (x) { return x[1] + " " + nf(Math.min(100, 100 * x[0] / tot)) + " %"; }).join(" · ");
    var txt = { A: T("as regras do PDM para este terreno foram lidas no regulamento em vigor.", "the PDM rules for this land were read in the regulation in force."),
      B: T("quase todas as regras foram lidas no regulamento em vigor; o que falta vem assinalado na Leitura.", "almost all rules were read in the regulation in force; the rest is flagged in the report."),
      C: T("parte das regras vem de resumo ou de versão anterior, ou o PDM tem suspensões; a Leitura diz o que confirmar.", "part of the rules come from a summary or earlier version, or the PDM has suspensions; the report says what to confirm."),
      D: T("a maior parte das regras ainda não está conferida no regulamento; a Leitura vai ao texto e diz o que fica por confirmar.", "most rules are not yet checked in the regulation; the report goes to the text and says what remains to confirm."),
      E: T("ainda não temos as regras do PDM deste concelho; a Leitura vai ao regulamento.", "we do not yet have this municipality's PDM rules; the report goes to the regulation.") }[pior];
    return '<p class="tcd-fe-v"><span class="tcd-fe-t ' + R[0] + '">' + pior + " · " + T(R[1], R[2]) + "</span> " + T("Dados do PDM: ", "PDM data: ") + txt +
      '<br><span style="opacity:.8;font-size:.92em">' + partes.join(" · ") + (det ? " · " + T("área do terreno: ", "site area: ") + det : "") + "</span></p>";
  }
  // 11/11/2026, 23h05 (Nuno: «Ran e ren apuros», REN e RAN presas em «a calcular…»): a ficha mede ela própria a REN e a RAN nas
  // PMTiles próprias (camadas.terracruadesign.pt, cópia da DGT), sem depender dos mosaicos da DGT, que demoram ou falham.
  var PM = "https://camadas.terracruadesign.pt/pmtiles/dgt/", PMJS = "https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js", pmP = null, pmI = {}, rrCache = {};
  function pmLib() {
    if (W.pmtiles) return Promise.resolve(W.pmtiles);
    if (!pmP) pmP = new Promise(function (ok, ko) { var sc = D.createElement("script"); sc.src = PMJS; sc.crossOrigin = "anonymous"; sc.onload = function () { W.pmtiles ? ok(W.pmtiles) : ko(new Error("pmtiles")); }; sc.onerror = ko; (D.head || D.documentElement).appendChild(sc); });
    return pmP;
  }
  function renRan(f) {
    var k = chaveF(f); if (rrCache[k]) return rrCache[k];
    var b = caixaF(f), x0 = mxp(b[0]), x1 = mxp(b[2]), y0 = myp(b[3]), y1 = myp(b[1]), w = x1 - x0, h = y1 - y0, S = 400;
    var G = { x0: x0, y0: y0, w: w, h: h, W: w >= h ? S : Math.max(8, Math.round(S * w / h)), H: w >= h ? Math.max(8, Math.round(S * h / w)) : S };
    var M = pintar(G, [f.geometry]), tot = 0; for (var i = 0; i < M.length; i++) tot += M[i];
    var z = 14; function nt(z) { var n = Math.pow(2, z); return (Math.floor((x0 + w) * n) - Math.floor(x0 * n) + 1) * (Math.floor((y0 + h) * n) - Math.floor(y0 * n) + 1); }
    while (z > 7 && nt(z) > 9) z--;
    var n = Math.pow(2, z), tiles = [];
    for (var tx = Math.floor(x0 * n); tx <= Math.floor((x0 + w) * n); tx++) for (var ty = Math.floor(y0 * n); ty <= Math.floor((y0 + h) * n); ty++) tiles.push([tx, ty]);
    function medir(col) {
      var dec = W.IPRDiag && W.IPRDiag.mvtDecode; if (!dec || !tot) return Promise.resolve(null);
      return pmLib().then(function (L) {
        var P = pmI[col] || (pmI[col] = new L.PMTiles(PM + col + ".pmtiles"));
        var c = D.createElement("canvas"); c.width = G.W; c.height = G.H; var x = c.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#000";
        return Promise.all(tiles.map(function (t) { return P.getZxy(z, t[0], t[1]).then(function (r) {
          if (!r || !r.data) return;
          dec(r.data).forEach(function (ft) { if (ft.tipo !== 3) return; var e = ft.ext || 4096; x.beginPath();
            ft.aneis.forEach(function (an) { an.forEach(function (q, i2) { var px = ((t[0] + q[0] / e) / n - G.x0) / G.w * G.W, py = ((t[1] + q[1] / e) / n - G.y0) / G.h * G.H; if (i2) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); });
            x.fill("evenodd"); });
        }); })).then(function () { var d = x.getImageData(0, 0, G.W, G.H).data, cnt = 0; for (var i3 = 0; i3 < M.length; i3++) if (M[i3] && d[i3 * 4 + 3] > 127) cnt++; return Math.round(1000 * cnt / tot) / 10; });
      });
    }
    var to = new Promise(function (ok) { setTimeout(function () { ok(null); }, 20000); });
    rrCache[k] = Promise.race([Promise.all([medir("srup_ren_areal").catch(function () { return null; }), medir("srup_ran").catch(function () { return null; })]), to.then(function () { return [null, null]; })]);
    return rrCache[k];
  }
  function pctCam(res, id) { var x = (res || []).filter(function (r) { return r.e && r.e.id === id; })[0]; return x ? (x.r.pct != null ? x.r.pct : null) : 0; }
  function edif(out) {
    var box = out.querySelector(".tcd-fn-e"); if (!box || EDIF_OFF) return;
    var f = escolhido(); if (!f) return;
    var tc = out.querySelector(".ipr-tcam"), T4 = tc && tc.__tcam, res = T4 && T4[0], fim = !!(T4 && T4[3]);
    var ren = res ? pctCam(res, "ren") : null, ran = res ? pctCam(res, "ran") : null;
    if (!fim) { if (ren === 0) ren = null; if (ran === 0) ran = null; }
    var kf = chaveF(f);
    var rrJa = box.__rr && box.__rr[0] === kf ? box.__rr[1] : null;
    if (!rrJa) renRan(f).then(function (rr) { box.__rr = [kf, rr]; if (rr && (rr[0] != null || rr[1] != null)) { box.__chave = ""; edif(out); } });
    if (rrJa) { if (rrJa[0] != null) ren = rrJa[0]; if (rrJa[1] != null) ran = rrJa[1]; if (rrJa[0] != null && rrJa[1] != null) fim = true; }
    Promise.all([crusMedir(f), confJ()]).then(function (CJ) {
      var C = CJ[0], J = CJ[1];
      var chave = kf + "|" + ren + "|" + ran + "|" + fim + "|" + (C ? C.length : "x") + "|" + (J ? 1 : 0);
      if (box.__chave === chave) return; box.__chave = chave;
      var L = [], urb = 0, ed = 0, rus = 0, nat = 0;
      (C || []).forEach(function (c) { var t = tipoEsp(c); if (t === "u") urb += c.pct; else if (t === "e") ed += c.pct; else if (t === "n") nat += c.pct; else rus += c.pct; });
      var foraMin = (ren != null && ran != null) ? Math.max(0, 100 - ren - ran) : null;
      // indício
      var nivel, txt;
      if (!C || !C.length) { nivel = ["pc", T("Por apurar", "To be checked")]; txt = T("A carta de ordenamento da DGT não respondeu ou não cobre este terreno. A Leitura Territorial vai ao regulamento do PDM.", "The DGT zoning map did not respond or does not cover this land. The Land report goes to the PDM regulation."); }
      else if (urb >= 50 && (ren || 0) < 50) { nivel = ["ok", T("Favorável", "Favourable")]; txt = T("A maior parte do terreno está em solo que o PDM destina a construção. Quanto, com que altura e afastamentos depende dos índices dessa categoria.", "Most of the land is in zoning intended for building. How much, how high and the setbacks depend on that category's ratios."); }
      else if (urb + ed >= 10 && (ren || 0) < 90) { nivel = ["pc", T("Possível em parte", "Possible in part")]; txt = T("Parte do terreno está num espaço onde o PDM prevê edificação. O resto segue as regras do solo rústico.", "Part of the land is in a zone where the PDM provides for building. The rest follows rural land rules."); }
      else if (nat >= 80 || (ren != null && ren >= 95)) { nivel = ["dv", T("Muito condicionada", "Very restricted")]; txt = T("O terreno está quase todo em espaço natural ou de protecção, ou em REN. Construir de novo é raro; obras em edifícios existentes têm regras próprias.", "Almost all the land is in natural or protection zoning, or in REN. New building is rare; works on existing buildings have their own rules."); }
      else { nivel = ["pc", T("Condicionada", "Conditional")]; txt = T("Solo rústico: o PDM admite construir só nos casos que o regulamento prevê para este espaço, como habitação do agricultor, apoio agrícola, turismo em espaço rural ou ampliação de construções existentes, cada um com área e condições próprias.", "Rural land: the PDM allows building only in the cases its regulation sets for this zone, such as a farmer's house, farm buildings, rural tourism or extending existing buildings, each with its own area and conditions."); }
      var h = "<h4>" + T("Pode construir? Primeira leitura", "Can you build? First reading") + '</h4>' + confLinha(J, C) + '<p class="tcd-fe-v"><span class="tcd-fe-t ' + nivel[0] + '">' + nivel[1] + "</span> " + txt + "</p>";
      var lin = [];
      if (C && C.length) {
        var cls = {}; C.forEach(function (c) { var k = c.classe || T("Classe por indicar", "Class not given"); cls[k] = (cls[k] || 0) + c.pct; });
        lin.push("<b>" + T("Classe do solo (PDM)", "Land class (PDM)") + "</b>" + Object.keys(cls).sort(function (a, z) { return cls[z] - cls[a]; }).map(function (k) { return k.replace(/</g, "&lt;") + " " + nf(Math.min(100, cls[k])) + " %"; }).join(" · "));
        lin.push("<b>" + T("Categorias de espaço", "Zoning categories") + "</b>" + C.slice(0, 4).map(function (c) { return c.d.replace(/</g, "&lt;") + " " + nf(c.pct) + " %"; }).join(" · ") + (C.length > 4 ? T(" e mais " + (C.length - 4), " and " + (C.length - 4) + " more") : ""));
      }
      lin.push("<b>REN</b>" + (ren == null ? T("a calcular…", "calculating…") : nf(ren) + " %" + (ren === 0 ? T(" (não toca no terreno)", " (does not touch the land)") : "")));
      lin.push("<b>RAN</b>" + (ran == null ? T("a calcular…", "calculating…") : nf(ran) + " %" + (ran === 0 ? T(" (não toca no terreno)", " (does not touch the land)") : "")));
      if (foraMin != null) lin.push("<b>" + T("Fora de REN e RAN", "Outside REN and RAN") + "</b>" + (ren + ran <= 100 && (ren === 0 || ran === 0) ? nf(foraMin) + " %" : T("pelo menos ", "at least ") + nf(foraMin) + " %" + T(" (REN e RAN podem sobrepor-se)", " (REN and RAN may overlap)")));
      h += '<ul class="tcd-fe-l"><li>' + lin.join("</li><li>") + "</li></ul>";
      h += '<p class="tcd-fn-m">' + T("Isto é um indício a partir da cartografia pública (DGT, carta de ordenamento e SRUP), não um parecer. <b>Quanto pode construir</b>, em que parte do terreno, com que índices e artigos do PDM, e o que a REN e a RAN admitem aqui: está na <b>Leitura Territorial</b>. A <b>Planta de Localização</b> põe REN, RAN e PDM em mapa para o técnico ou a Câmara. Quem decide é a Câmara, pelo pedido de informação prévia.",
        "This is an indication from public maps (DGT zoning and easements), not an opinion. <b>How much you can build</b>, where on the land, with which PDM ratios and articles, and what REN and RAN allow here: that is in the <b>Land report</b>. The <b>Location plan</b> maps REN, RAN and PDM for your technician or the council. The council decides, through a prior information request.") + "</p>" +
        '<div class="tcd-fn-b"><button type="button" data-fniv="leitura" data-sd="encomendar:edif-leitura">' + T("Leitura Territorial: ver preço", "Land report: see price") + '</button><button type="button" data-fniv="planta" data-sd="encomendar:edif-planta">' + T("Planta de Localização: 19 € + IVA", "Location plan: €19 + VAT") + "</button></div>";
      box.innerHTML = h;
    });
  }

  // ---------- 3 e 4. valor e três níveis ----------
  function comprar(k) { if (typeof W.iprAssistenteComprar === "function") { try { if (W.iprAssistenteComprar(k)) return; } catch (e) {} } location.href = "/documentos/"; }
  function quadro() {
    var L = en() ? [
      ["Property sheet", "Free · what you are seeing", "Restrictions, water, slope, altitude, fire risk, zoning class and the land over time. A first look, in minutes.", ""],
      ["Location plan", "€19 + VAT", "The land on a printable map: orthophoto, boundary, cadastre, zoning (land use and restrictions), LiDAR topography, land cover 2023 and fire hazard. For the council, the bank or the deed.", "planta"],
      ["Land report", "from €79 + VAT", "What it all means for your land: what the zoning allows and possible uses, each restriction explained, water, fire, soil and potential. To decide.", "leitura"]
    ] : [
      ["Ficha da propriedade", "Grátis · é o que está a ver", "Condicionantes, água, declive, altitude, risco de incêndio, classe do PDM e o terreno ao longo do tempo. Uma primeira leitura, em minutos.", ""],
      ["Planta de Localização", "19 € + IVA", "O terreno numa planta para imprimir: ortofoto, limite, cadastro, PDM (ordenamento e condicionantes), topografia LiDAR, ocupação do solo 2023 e perigosidade de incêndio. Para a câmara, o banco ou a escritura.", "planta"],
      ["Leitura Territorial", "desde 79 € + IVA", "O que tudo isto quer dizer para o seu terreno: o que o PDM permite e os usos possíveis, cada condicionante explicada, água, fogo, solo e potencial. Para decidir.", "leitura"]
    ];
    return '<h4>' + T("Três níveis, do grátis ao relatório", "Three levels, from free to report") + '</h4><ol class="tcd-fn-n">' + L.map(function (l, i) {
      return '<li' + (i ? "" : ' class="on"') + '><b>' + l[0] + '</b><i>' + l[1] + '</i><span>' + l[2] + '</span>' + (l[3] ? '<button type="button" data-fniv="' + l[3] + '" data-sd="encomendar:niveis-' + l[3] + '">' + T("Ver preço e pedir", "See price and order") + "</button>" : "") + "</li>";
    }).join("") + "</ol>" +
      '<p class="tcd-fn-base">' + T("Para o seu técnico: <b>Base Cartográfica</b>, relevo, água e limites em ficheiros (LiDAR da DGT), desde 99 € + IVA. ", "For your technician: <b>Base map</b>, relief, water and boundaries as files (DGT LiDAR), from €99 + VAT. ") + '<button type="button" data-fniv="base" data-sd="encomendar:niveis-base">' + T("Ver preço", "See price") + "</button></p>";
  }
  function css() {
    if (D.getElementById("tcd-fniv-css")) return;
    var s = D.createElement("style"); s.id = "tcd-fniv-css";
    s.textContent = ".tcd-fn{margin:14px 0 6px;display:grid;gap:10px}.tcd-fn .tcd-fn-b{display:flex;flex-wrap:wrap;gap:8px}" +
      ".tcd-fn .tcd-fn-b button,.tcd-fn-n button{font:600 13px Inter,sans-serif;min-height:40px;padding:8px 12px;border-radius:10px;border:1px solid rgba(111,138,60,.6);background:transparent;color:inherit;cursor:pointer}" +
      ".tcd-fn .tcd-fn-v{font-size:13.5px;line-height:1.45;border-left:3px solid #b9a24a;padding:4px 10px}.tcd-fn .tcd-fn-v a{color:inherit;font-weight:600}" +
      ".tcd-fn .ipr-3d-c{position:relative;background:#0d100d;border-radius:10px;overflow:hidden;height:260px}.tcd-fn .ipr-3d-c .m{position:absolute;inset:0}" +
      ".tcd-fn .ipr-3d-c .b{position:absolute;top:6px;right:6px;display:flex;gap:4px;z-index:2}.tcd-fn .ipr-3d-c .b button{font:600 12px Inter,sans-serif;padding:6px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(20,24,20,.8);color:#fff;min-height:32px}" +
      ".tcd-fn .ipr-3d-c .s{position:absolute;left:8px;bottom:6px;right:8px;z-index:2;font:500 11px Inter,sans-serif;color:#fff;background:rgba(20,24,20,.6);padding:3px 7px;border-radius:6px;pointer-events:none}" +
      ".tcd-fn-n{list-style:none;margin:0;padding:0;display:grid;gap:8px}.tcd-fn-n li{border:1px solid rgba(127,127,127,.3);border-radius:12px;padding:10px 12px;display:grid;gap:4px}" +
      ".tcd-fn-n li.on{border-color:rgba(111,138,60,.7);background:rgba(111,138,60,.08)}.tcd-fn-n b{font-size:15px}.tcd-fn-n i{font-style:normal;font-weight:600;color:#9bb85a}" +
      ".tcd-fn-n span{font-size:13px;line-height:1.45;opacity:.9}.tcd-fn-n button{justify-self:start;margin-top:4px}" +
      ".ipr-fg-out .tcd-fn~.ipr-fd-mais{display:none}.tcd-fn-base{font-size:13px;line-height:1.45;margin:8px 0 0}.tcd-fn-base button{margin-left:6px;min-height:34px!important;padding:4px 10px!important;font:600 13px Inter,sans-serif!important;border-radius:10px!important;border:1px solid rgba(111,138,60,.6)!important;background:transparent!important;color:inherit!important;cursor:pointer;-webkit-appearance:none;appearance:none}" +
      ".ipr-ft-i.fniv canvas:not(.fniv){display:none!important}" +
      ".tcd-fn-e{border:1px solid rgba(111,138,60,.45);border-radius:12px;padding:10px 12px}.tcd-fn-e h4{margin:0 0 6px}.tcd-fe-v{font-size:13.5px;line-height:1.45;margin:0 0 6px}" +
      ".tcd-fe-t{display:inline-block;font:600 11.5px Inter,sans-serif;padding:2px 8px;border-radius:999px;margin-right:4px}.tcd-fe-t.ok{background:rgba(111,160,60,.22);color:#6f9a2e}.tcd-fe-t.pc{background:rgba(185,162,74,.22);color:#a8902f}.tcd-fe-t.dv{background:rgba(190,80,60,.2);color:#c0573e}" +
      ".tcd-fe-l{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:3px}.tcd-fe-l li{font-size:13px;line-height:1.4;display:grid;grid-template-columns:120px minmax(0,1fr);gap:8px}.tcd-fe-l b{font-weight:600}" +
      ".tcd-fn-l{margin:4px 0 6px;padding-left:18px;display:grid;gap:5px}.tcd-fn-l li{font-size:13.5px;line-height:1.45}.tcd-fn-l b{display:block}.tcd-fn-l span{opacity:.85}.tcd-fn-m{font-size:12.5px;line-height:1.45;opacity:.85;margin:4px 0}" +
      "@media(min-width:720px){.tcd-fn-n{grid-template-columns:repeat(3,minmax(0,1fr))}}";
    D.head.appendChild(s);
  }
  function montar(out) {
    if (out.querySelector(".tcd-fn")) return;
    css();
    var d = D.createElement("div"); d.className = "tcd-fn";
    d.innerHTML = '<div class="tcd-fn-b"><button type="button" data-fniv3d="1">' + T("Ver o terreno em 3D", "See the land in 3D") + '</button></div><div class="tcd-fn-3"></div>' +
      (sessao() ? "" : '<p class="tcd-fn-v">' + T("<b>Valor indicativo da propriedade:</b> ", "<b>Indicative value of the property:</b> ") + '<a href="' + entrar().replace(/"/g, "&quot;") + '">' + T("entre com a sua conta grátis", "sign in with your free account") + "</a>" + T(" para ver o intervalo calculado para este terreno.", " to see the range calculated for this land.") + "</p>") +
      (EDIF_OFF ? "" : '<div class="tcd-fn-e"></div>') + '<div class="tcd-fn-s"></div><div class="tcd-fn-q">' + quadro() + "</div>";
    var mais = out.querySelector(".ipr-fd-mais");
    if (mais) out.insertBefore(d, mais); else out.appendChild(d);
  }
  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-fniv3d],[data-fniv]"); if (!b) return;
    e.preventDefault();
    if (b.hasAttribute("data-fniv3d")) { var w = b.closest(".tcd-fn").querySelector(".tcd-fn-3"); if (m3) { fechar3d(w); b.textContent = T("Ver o terreno em 3D", "See the land in 3D"); } else { abrir3d(w); b.textContent = T("Fechar o 3D", "Close 3D"); } return; }
    comprar(b.getAttribute("data-fniv"));
  });
  setInterval(function () {
    var out = D.querySelector(".ipr-fg-out"); if (!out || !out.children.length) { if (m3) fechar3d(null); return; }
    montar(out); fotos(out); edif(out); sobre(out);
  }, 1000);
})();
