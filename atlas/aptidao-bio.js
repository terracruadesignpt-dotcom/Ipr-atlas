/* IPR Atlas · Aptidão para jovens agricultores biológicos e regadio público, 13/11/2026.
   Pedido do Nuno (13/11, 12h30 e 14h00): o tema Biológico mostra as zonas boas para quem se quer instalar como jovem
   agricultor biológico. Só critérios positivos (não há triagem de zonas más), a água de rega conta, e as zonas pouco
   procuradas sobem, para não irem todos para os mesmos sítios. Continente, Açores e Madeira.
   Dados: aptidao-bio.json (malha hexagonal de 3 km no continente e 1,2 km nas ilhas, dez critérios de 0 a 100, classes
   por quintis do continente) e regadio-dgadr.json (74 aproveitamentos hidroagrícolas em exploração, DGADR, Set. 2024,
   CC BY 4.0, simplificados). Ambos no plugin Núcleo, ao lado do atlas.json.
   Interface: bloco no topo das camadas («Biológico · onde instalar-se») com duas caixas, legenda e nota de leitura.
   Liga-se sozinho a primeira vez que o tema Biológico é escolhido. Clicar num hexágono abre a leitura dos dez critérios.
   API: window.__iprAptidao = {ligar(bool), regadio(bool), dados(cb), ligada()}. Desligar: ?aptidao=0. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]aptidao=0(&|$)/.test(location.search)) return;
  var BASE = "/wp-content/plugins/terracrua-nucleo/assets/atlas/";
  var CORES = ["#efe7cf", "#d5e3a4", "#a9cc6b", "#6fa83c", "#2e7d32"];
  var NOMES = ["Boa", "Muito boa", "Excelente", "Entre as melhores", "As melhores"];
  function en() { return (D.documentElement.lang || "").slice(0, 2) === "en" || /[?&]lang=en/.test(location.search); }
  function t(pt, e) { return en() ? e : pt; }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  var DADOS = null, ESPERA = [], A_PEDIR = false, ON = {apt: false, reg: false, pts: false};
  /* 13/11 (Nuno): a camada de aptidão cobre o país todo de verde e atrasa a abertura; já não se repõe ao abrir o Atlas, liga-se quando se pede. */
  try { var g = JSON.parse(W.localStorage.getItem("ipr_aptidao") || "{}"); ON.apt = false; ON.reg = !!g.reg; ON.pts = !!g.pts; } catch (e) {}
  // Só se guarda o que a pessoa ligou à mão; o que o tema ligou desliga-se ao sair dele e não fica para a visita seguinte.
  function guardar() { try { var g = {}; Object.keys(ON).forEach(function (k) { g[k] = !!ON[k] && !(typeof AUTO === "object" && AUTO && AUTO[k]); }); W.localStorage.setItem("ipr_aptidao", JSON.stringify(g)); } catch (e) {} }
  function dados(cb) {
    if (DADOS) return cb(DADOS);
    ESPERA.push(cb); if (A_PEDIR) return; A_PEDIR = true;
    fetch(BASE + "aptidao-bio.json?v=2").then(function (r) { return r.json(); }).then(function (d) {
      DADOS = d; var l = ESPERA; ESPERA = []; l.forEach(function (f) { try { f(d); } catch (e) {} });
    }).catch(function () { A_PEDIR = false; });
  }
  function hexes(d) {
    var A = [30, 90, 150, 210, 270, 330].map(function (a) { return a * Math.PI / 180; }), feats = [];
    // Hexágono «flat-top»: vértices a 0, 60… graus; o raio é o lado da malha.
    var V = [0, 60, 120, 180, 240, 300].map(function (a) { return a * Math.PI / 180; });
    d.h.forEach(function (r, i) {
      var m = d.regioes[r[2]]; if (!m || r[4] < 1) return;
      var ring = V.map(function (a) { return [+(r[0] + m.s * Math.cos(a) * m.kx).toFixed(5), +(r[1] + m.s * Math.sin(a) * m.ky).toFixed(5)]; });
      ring.push(ring[0]);
      feats.push({type: "Feature", id: i, properties: {i: i, c: r[4], s: r[3]}, geometry: {type: "Polygon", coordinates: [ring]}});
    });
    return {type: "FeatureCollection", features: feats};
  }
  function antes(I) {
    var L = (I.getStyle() && I.getStyle().layers) || [];
    for (var i = 0; i < L.length; i++) if (/^ent-org|^iprv-s-line|^gl-draw|^tcd-terreno|label|^iprv-r_curvas/.test(L[i].id)) return L[i].id;
    return undefined;
  }
  function desenharApt() {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (!ON.apt) { ["ipr-apt-f", "ipr-apt-l"].forEach(function (l) { try { if (I.getLayer(l)) I.setLayoutProperty(l, "visibility", "none"); } catch (e) {} }); return; }
    dados(function (d) {
      if (!ON.apt) return;
      try {
        if (!I.getSource("ipr-apt")) I.addSource("ipr-apt", {type: "geojson", data: hexes(d)});
        var pos = antes(I);
        if (!I.getLayer("ipr-apt-f")) I.addLayer({id: "ipr-apt-f", type: "fill", source: "ipr-apt", paint: {
          "fill-color": ["match", ["get", "c"], 1, CORES[0], 2, CORES[1], 3, CORES[2], 4, CORES[3], 5, CORES[4], "rgba(0,0,0,0)"],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.62, 10, 0.5, 13, 0.32]}}, pos);
        if (!I.getLayer("ipr-apt-l")) I.addLayer({id: "ipr-apt-l", type: "line", source: "ipr-apt", minzoom: 8, paint: {"line-color": "rgba(255,255,255,0.35)", "line-width": 0.5}}, pos);
        ["ipr-apt-f", "ipr-apt-l"].forEach(function (l) { I.setLayoutProperty(l, "visibility", "visible"); });
      } catch (e) { if (W.console) console.warn("[aptidao]", e && e.message); }
    });
  }
  var REG = null;
  function desenharReg() {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (!ON.reg) { ["ipr-reg-f", "ipr-reg-l"].forEach(function (l) { try { if (I.getLayer(l)) I.setLayoutProperty(l, "visibility", "none"); } catch (e) {} }); return; }
    function por(gj) {
      try {
        if (!I.getSource("ipr-reg")) I.addSource("ipr-reg", {type: "geojson", data: gj, attribution: "DGADR · aproveitamentos hidroagrícolas, CC BY 4.0"});
        var pos = antes(I);
        if (!I.getLayer("ipr-reg-f")) I.addLayer({id: "ipr-reg-f", type: "fill", source: "ipr-reg", paint: {"fill-color": "#1e88e5", "fill-opacity": 0.28}}, pos);
        if (!I.getLayer("ipr-reg-l")) I.addLayer({id: "ipr-reg-l", type: "line", source: "ipr-reg", paint: {"line-color": "#0d47a1", "line-width": 1.2}}, pos);
        ["ipr-reg-f", "ipr-reg-l"].forEach(function (l) { I.setLayoutProperty(l, "visibility", "visible"); });
      } catch (e) {}
    }
    if (REG) return por(REG);
    fetch(BASE + "regadio-dgadr.json?v=1").then(function (r) { return r.json(); }).then(function (gj) { REG = gj; if (ON.reg) por(gj); }).catch(function () {});
  }
  // A identificação nativa do Atlas abre ao mesmo clique: some durante 2,5 s para ficar só a nossa janela.
  function limpaNativo() { var t0 = Date.now(); (function l() { [].forEach.call(D.querySelectorAll(".iprv-pop"), function (x) { x.remove(); }); if (Date.now() - t0 < 2500) setTimeout(l, 120); })(); }
  function barra(v) { return v < 0 ? '<span class="sd">' + t("sem dados", "no data") + "</span>" : '<span class="b"><i style="width:' + v + '%"></i></span><b>' + v + "</b>"; }
  function popup(e) {
    if (!DADOS || !e.features || !e.features.length) return;
    // Os pontos das organizações e as fichas têm prioridade sobre a malha.
    var I = mapa(), ls = (I.getStyle().layers || []).filter(function (l) { return /^ent-org-.*-p$|^ent-org-fichas|^ipr-biop$/.test(l.id); }).map(function (l) { return l.id; });
    if (ls.length && I.queryRenderedFeatures(e.point, {layers: ls}).length) return;
    var r = DADOS.h[e.features[0].properties.i]; if (!r) return;
    var c = DADOS.conc[r[5]] || [];
    var ilha = r[2] !== "pt";
    var h = '<div class="ipr-apt-pop"><div class="k">' + t("Aptidão para jovens agricultores biológicos", "Suitability for young organic farmers") + "</div>" +
      '<div class="t"><span class="sw" style="background:' + CORES[r[4] - 1] + '"></span>' + NOMES[r[4] - 1] + " · " + r[3] + "/100</div>" +
      '<div class="cc">' + (c[0] || "") + (c[1] ? ", " + c[1] : "") + (c[2] != null ? " · " + t("média do concelho ", "municipality mean ") + c[2] : "") + "</div><table>";
    DADOS.criterios.forEach(function (k, j) { h += "<tr><td title=\"" + k[2].replace(/"/g, "") + "\">" + k[1] + "</td><td>" + barra(r[6 + j]) + "</td></tr>"; });
    h += "</table>" + (ilha ? '<p class="n">' + t("Nas ilhas ainda não há dados públicos de solo, água e pressões com esta cobertura: a leitura usa mercado, terra, procura e rede de apoio, e as classes comparam as ilhas entre si.", "On the islands there is no public soil, water or pressure data with this coverage yet: the reading uses market, land, demand and support network, and classes compare the islands with each other.") + "</p>" : "") +
      '<p class="n">' + t("Leitura indicativa para escolher zonas a visitar. Não substitui a visita, a análise de solo nem a consulta à DRAP.", "Indicative reading to choose areas to visit. It does not replace a site visit, a soil test or advice from the regional agriculture office.") + "</p></div>";
    try { new W.maplibregl.Popup({maxWidth: "320px", className: "ipr-apt-pp"}).setLngLat(e.lngLat).setHTML(h).addTo(I); limpaNativo(); } catch (x) {}
  }
  var CSS = "#ipr-apt{margin:0 0 10px;padding:10px 10px 8px;border:1px solid var(--ln,#383A33);border-radius:6px;background:var(--bg2,rgba(148,190,57,.06))}" +
    "#ipr-apt h4{margin:0 0 6px;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#e8e8e0)}#ipr-apt label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#ddd);padding:3px 0;cursor:pointer}" +
    "#ipr-apt label input{margin-top:2px}#ipr-apt label .ipr-ii-b{margin-left:auto;flex:none}#ipr-apt .lg{display:flex;gap:2px;margin:6px 0 2px}#ipr-apt .lg span{flex:1;height:8px;border-radius:2px}#ipr-apt .lgt{display:flex;justify-content:space-between;font-size:10.5px;color:var(--mu,#9a9b90)}" +
    "#ipr-apt small{display:block;margin-top:6px;font-size:11px;line-height:1.4;color:var(--mu,#9a9b90)}" +
    ".ipr-apt-pp .maplibregl-popup-content{background:#16170f;color:#d8dacf;border:1px solid #383A33;border-radius:6px;padding:10px 12px}.ipr-apt-pp .maplibregl-popup-tip{border-top-color:#16170f;border-bottom-color:#16170f}" +
    ".ipr-apt-pop{font:12px/1.4 Inter,system-ui,sans-serif}.ipr-apt-pop .k{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#94BE39}.ipr-apt-pop .t{font:600 14px Inter,sans-serif;margin:3px 0;display:flex;align-items:center;gap:6px;color:#fff}" +
    ".ipr-apt-pop .sw{width:12px;height:12px;border-radius:2px;display:inline-block}.ipr-apt-pop .cc{color:#9a9b90;margin-bottom:6px}.ipr-apt-pop table{width:100%;border-collapse:collapse}.ipr-apt-pop td{padding:2px 0;vertical-align:middle}" +
    ".ipr-apt-pop table,.ipr-apt-pop tr,.ipr-apt-pop td{border:0!important;background:none!important}.ipr-apt-pop td:first-child{padding-right:8px;white-space:nowrap}.ipr-apt-pop td:last-child{display:flex;align-items:center;gap:6px;justify-content:flex-end}.ipr-apt-pop .b{width:80px;height:6px;background:#2a2c25;border-radius:3px;overflow:hidden}" +
    ".ipr-apt-pop .b i{display:block;height:100%;background:#94BE39}.ipr-apt-pop b{width:22px;text-align:right;font-weight:600}.ipr-apt-pop .sd{color:#77786f;font-size:11px}.ipr-apt-pop .n{margin:6px 0 0;color:#9a9b90;font-size:11px}";
  // «i» das três camadas próprias: abre o mesmo painel do camadas-info (#ipr-ii), com o mesmo aspecto.
  function iBot(k) { var tt = t("Sobre esta camada: o que é, fonte, legenda", "About this layer: what it is, source, legend"); return '<button type="button" class="ipr-ii-b" data-iia="' + k + '" title="' + tt + '" aria-label="' + tt + '">i</button>'; }
  function infoHtml(k) {
    var E = en(), h = '<button type="button" class="x" aria-label="' + (E ? "Close" : "Fechar") + '">×</button>';
    function dl(rows) { return "<dl>" + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>"; }
    if (k === "apt") {
      h += "<h3>" + t("Aptidão para jovens agricultores biológicos", "Suitability for young organic farmers") + '</h3><div class="ii-g">' + t("Biológico · produção IPR", "Organic · IPR product") + "</div>";
      h += "<h4>" + t("O que é", "What it is") + "</h4><p>" + t("Zonas boas para um jovem agricultor biológico se instalar. Só critérios positivos, numa malha hexagonal de 3 km no continente e 1,2 km nas ilhas. Cada critério vai de 0 a 100; a nota é a média pesada. As classes comparam os hexágonos do continente entre si (quintis), e os das ilhas entre si.", "Areas suited for a young organic farmer to settle. Positive criteria only, on a 3 km hexagonal grid on the mainland and 1.2 km on the islands. Each criterion runs from 0 to 100; the score is the weighted mean. Classes compare mainland hexagons with each other (quintiles), and island hexagons with each other.") + "</p>";
      h += "<h4>" + t("Critérios e fontes", "Criteria and sources") + "</h4>";
      if (DADOS) h += dl(DADOS.criterios.map(function (c, j) { return [esc(c[1]) + " · " + (DADOS.pesos[j] || 0) + "%", esc(c[2])]; }));
      else h += "<p>" + t("A carregar…", "Loading…") + "</p>";
      h += "<h4>" + t("Fonte", "Source") + "</h4>" + dl([[t("Entidade", "Entity"), "IPR · Terracrua Design (cálculo próprio)"], [t("Dados", "Data"), "APA (SNIAmb, Atlas do Ambiente, Atlas da Qualidade dos Solos), ICNF, DGADR, INE, CAOP, Agrobio"], [t("Licença", "Licence"), t("Dados de origem em CC BY 4.0 ou de uso livre com indicação da fonte; leitura indicativa.", "Source data under CC BY 4.0 or free use with attribution; indicative reading.")], [t("Data", "Date"), esc(DADOS ? DADOS.data : "")]]);
      h += "<h4>" + t("Legenda", "Legend") + '</h4><div class="ii-leg">' + CORES.map(function (c, i) { return '<div style="display:flex;align-items:center;gap:8px;margin:2px 0"><span style="width:14px;height:14px;border-radius:2px;background:' + c + '"></span>' + NOMES[i] + "</div>"; }).join("") + "</div>";
    } else if (k === "reg") {
      h += "<h3>" + t("Perímetros de rega públicos", "Public irrigation schemes") + '</h3><div class="ii-g">' + t("Água · Biológico", "Water · Organic") + "</div>";
      h += "<h4>" + t("O que é", "What it is") + "</h4><p>" + t("Limites das áreas beneficiadas pelos 74 aproveitamentos hidroagrícolas públicos em exploração (cerca de 159 mil ha), com o nome, a entidade gestora, o grupo e a área. Não inclui o Alqueva (EFMA), cujos limites a EDIA não publica em dados abertos. Geometria simplificada para o mapa.", "Boundaries of the areas served by the 74 public irrigation schemes in operation (about 159,000 ha), with name, managing body, group and area. Alqueva (EFMA) is not included: EDIA does not publish its boundaries as open data. Geometry simplified for the map.") + "</p>";
      h += "<h4>" + t("Fonte", "Source") + "</h4>" + dl([[t("Entidade", "Entity"), '<a href="https://www.dgadr.gov.pt/" target="_blank" rel="noopener">DGADR, Direção-Geral de Agricultura e Desenvolvimento Rural</a>'], [t("Conjunto", "Dataset"), "Limites dos Aproveitamentos Hidroagrícolas · AH_Portugal_Exploracao_Set24"], [t("Licença", "Licence"), "CC BY 4.0 (dados.gov.pt / SNIG)"], [t("Serviço", "Service"), "geoservices.dgadr.pt/geoserver/ahportugal"]]);
      h += "<h4>" + t("Legenda", "Legend") + '</h4><div class="ii-leg"><div style="display:flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border-radius:2px;background:rgba(30,136,229,.35);border:1.5px solid #0d47a1"></span>' + t("Área beneficiada", "Area served") + "</div></div>";
    } else {
      h += "<h3>" + t("Mercados, quintas, cabazes e escolas", "Markets, farms, box schemes and schools") + '</h3><div class="ii-g">' + t("Biológico · referências públicas", "Organic · public references") + "</div>";
      h += "<h4>" + t("O que é", "What it is") + "</h4><p>" + t("Pontos de referência da agricultura biológica no continente, nos Açores e na Madeira: mercados, feiras e lojas, quintas e produtores, cabazes e AMAP, escolas agrárias e certificação, bio-regiões. Cada ponto tem ficha com o que é, onde, dia e horário, visitas, venda, sítio e a fonte própria. Posições aproximadas pela localidade.", "Organic farming reference points on the mainland, the Azores and Madeira: markets, fairs and shops, farms and producers, box schemes and CSAs, agricultural schools and certification, bio-regions. Each point has a profile with what it is, where, day and hours, visits, sales, website and its own source. Positions approximated by locality.") + "</p>";
      h += "<h4>" + t("Fonte", "Source") + "</h4>" + dl([[t("Entidade", "Entity"), "IPR · Terracrua Design (levantamento)"], [t("Origem", "Origin"), "agrobio.pt, reformaagraria.pt, Agroportal (Lusa), Governo Regional da Madeira, Visit Madeira, Campo Aberto, sítios dos produtores e municípios"], [t("Estado", "Status"), t("Referências públicas por confirmar; cada ficha indica a sua fonte.", "Public references to be confirmed; each profile gives its source.")]]);
      h += "<h4>" + t("Legenda", "Legend") + '</h4><div class="ii-leg">' + [["#e0a42b", "#111", t("Quinta ou produtor", "Farm or producer")], ["#94BE39", "#111", t("Mercado, feira ou loja", "Market, fair or shop")], ["#ffffff", "#8e5fb3", t("Cabazes e AMAP", "Box schemes and CSAs")], ["#5c9bd5", "#111", t("Ensino e certificação", "Education and certification")], ["transparent", "#2e7d32", t("Bio-região", "Bio-region")]].map(function (r) { return '<div style="display:flex;align-items:center;gap:8px;margin:2px 0"><span style="width:12px;height:12px;border-radius:50%;background:' + r[0] + ";border:2px solid " + r[1] + '"></span>' + r[2] + "</div>"; }).join("") + "</div>";
    }
    return h;
  }
  function infoAbrir(k, b) {
    var p = D.getElementById("ipr-ii");
    if (!p && W.__iprInfoAbrir) { try { W.__iprInfoAbrir("sroa"); } catch (e) {} p = D.getElementById("ipr-ii"); }
    if (!p) return;
    function por() { p.innerHTML = infoHtml(k); p.hidden = false;
      var r = b.getBoundingClientRect(), w = p.offsetWidth || 380, vw = W.innerWidth, vh = W.innerHeight, hh = p.offsetHeight || 300;
      if (vw > 700 && r.width) { var x = r.right + 14; if (x + w > vw - 8) x = r.left - w - 14; if (x < 8) x = 8; p.style.left = x + "px"; p.style.right = "auto"; p.style.top = Math.min(Math.max(56, r.top - 24), Math.max(56, vh - hh - 16)) + "px"; } }
    if (k === "apt" && !DADOS) dados(function () { por(); });
    por();
  }
  W.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-iia]"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation(); infoAbrir(b.getAttribute("data-iia"), b);
  }, true);
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-apt")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("div"); d.id = "ipr-apt";
    d.innerHTML = "<h4>" + t("Biológico · onde instalar-se", "Organic · where to settle") + "</h4>" +
      '<label><input type="checkbox" data-apt="apt"' + (ON.apt ? " checked" : "") + "> <span>" + t("Aptidão para jovens agricultores biológicos", "Suitability for young organic farmers") + "</span>" + iBot("apt") + "</label>" +
      '<div class="lg">' + CORES.map(function (c) { return '<span style="background:' + c + '"></span>'; }).join("") + '</div><div class="lgt"><span>' + t("Boa", "Good") + "</span><span>" + t("As melhores", "The best") + "</span></div>" +
      '<label><input type="checkbox" data-apt="reg"' + (ON.reg ? " checked" : "") + "> <span>" + t("Perímetros de rega públicos (DGADR)", "Public irrigation schemes (DGADR)") + "</span>" + iBot("reg") + "</label>" +
      '<label><input type="checkbox" data-apt="pts"' + (ON.pts ? " checked" : "") + "> <span>" + t("Mercados, quintas, cabazes e escolas (com ficha)", "Markets, farms, box schemes and schools (with profile)") + "</span>" + iBot("pts") + "</label>" +
      "<small>" + t("Dez critérios positivos: solo, matéria orgânica, longe de pressões, chuva, água subterrânea, água de rega, mercado, terra acessível, zonas pouco procuradas e rede de apoio. Carregue num hexágono para ver a leitura. Fontes: APA, ICNF, DGADR, INE, Agrobio.", "Ten positive criteria: soil, organic matter, distance from pressures, rain, groundwater, irrigation water, market, affordable land, less sought-after areas and support network. Click a hexagon to see the reading. Sources: APA, ICNF, DGADR, INE, Agrobio.") + "</small>";
    cam.insertBefore(d, cam.firstChild);
    d.addEventListener("change", function (e) { var c = e.target.closest("[data-apt]"); if (!c) return; var k = c.getAttribute("data-apt"); ON[k] = c.checked; if (AUTO) delete AUTO[k]; guardar(); if (k === "apt") desenharApt(); else if (k === "reg") desenharReg(); else desenharPts(); });
    return true;
  }
  function sinc() { var d = D.getElementById("ipr-apt"); if (!d) return; d.querySelectorAll("[data-apt]").forEach(function (c) { var v = !!ON[c.getAttribute("data-apt")]; if (c.checked !== v) c.checked = v; }); }
  // Pontos públicos do tema (mercados, feiras, lojas, quintas, cabazes, escolas, bio-regiões), com ficha ao carregar.
  var TIPOS = {produtor: "Produtor", mercado: "Mercado", feira: "Feira", loja: "Loja", cabaz: "Cabazes / AMAP", escola: "Ensino", cert: "Certificação", bioregiao: "Bio-região", territorio: "Território", sede: "Sede", sementes: "Sementes", demo: "Demonstração"};
  var CAMPOS = [["o_que", "O que é"], ["local", "Onde"], ["dia", "Dia"], ["horario", "Horário"], ["organiza", "Organiza"], ["visitas", "Visitas"], ["venda", "Venda"], ["terras", "Terra para jovens agricultores"], ["certificacao", "Certificação"], ["cabaz", "Faz parte de"]];
  var PTS = null;
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]; }); }
  function desenharPts() {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (!ON.pts) { ["ipr-biop"].forEach(function (l) { try { if (I.getLayer(l)) I.setLayoutProperty(l, "visibility", "none"); } catch (e) {} }); return; }
    function por(gj) {
      try {
        if (!I.getSource("ipr-biop")) I.addSource("ipr-biop", {type: "geojson", data: gj});
        if (!I.getLayer("ipr-biop")) I.addLayer({id: "ipr-biop", type: "circle", source: "ipr-biop", paint: {
          "circle-color": ["match", ["get", "tipo"], "produtor", "#e0a42b", "mercado", "#94BE39", "feira", "#94BE39", "loja", "#94BE39", "cabaz", "#ffffff", "bioregiao", "rgba(0,0,0,0)", "#5c9bd5"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, ["match", ["get", "tipo"], "bioregiao", 10, 4], 10, ["match", ["get", "tipo"], "bioregiao", 14, 6.5], 14, 8],
          "circle-stroke-color": ["match", ["get", "tipo"], "cabaz", "#8e5fb3", "bioregiao", "#2e7d32", "#111"],
          "circle-stroke-width": ["match", ["get", "tipo"], "cabaz", 3, "bioregiao", 2.5, 1.2]}});
        I.setLayoutProperty("ipr-biop", "visibility", "visible");
      } catch (e) {}
    }
    if (PTS) return por(PTS);
    fetch(BASE + "bio-pontos.json?v=1").then(function (r) { return r.json(); }).then(function (gj) { PTS = gj; if (ON.pts) por(gj); }).catch(function () {});
  }
  function fichaPt(e) {
    var f = e.features && e.features[0]; if (!f) return;
    var p = f.properties || {}, h = '<div class="ipr-apt-pop"><div class="k">' + esc(TIPOS[p.tipo] || p.tipo || "") + '</div><div class="t">' + esc(p.nome) + "</div><table>";
    CAMPOS.forEach(function (c) { if (p[c[0]]) h += "<tr><td>" + c[1] + "</td><td style=\"justify-content:flex-start;text-align:left\">" + esc(p[c[0]]) + "</td></tr>"; });
    h += "</table>";
    if (p.site) h += '<p class="n"><a href="' + esc(p.site) + '" target="_blank" rel="noopener" style="color:#94BE39">' + t("Abrir o sítio", "Open website") + "</a></p>";
    h += '<p class="n">' + t("Fonte: ", "Source: ") + esc(p.fonte || "referência pública") + ". " + esc(p.estado || "") + (p.posicao ? " · " + t("posição ", "position ") + esc(p.posicao) : "") + "</p></div>";
    try { new W.maplibregl.Popup({maxWidth: "320px", className: "ipr-apt-pp"}).setLngLat(f.geometry.coordinates).setHTML(h).addTo(mapa()); limpaNativo(); } catch (x) {}
  }
  // O tema Biológico passa a ser «onde instalar-se como jovem agricultor biológico»: só leituras positivas por defeito.
  // Mexe-se no objecto do tema por referência (não se edita o arrumar.js de outra sessão): camadas ligadas, legenda e texto.
  var TXT = {
    pt: "Onde instalar-se como jovem agricultor biológico. A aptidão (hexágonos, do verde-claro «boa» ao verde-escuro «as melhores») junta dez critérios positivos: solo, matéria orgânica, longe de pressões, chuva, água subterrânea, água de rega, mercado ao alcance, terra mais acessível, zonas pouco procuradas e rede de apoio. Por cima: capacidade de uso do solo, carbono orgânico, RAN, rede hidrográfica, os perímetros de rega públicos e os pontos de referência (mercados, feiras, lojas, quintas, cabazes, escolas, bio-regiões), cada um com ficha. Continente, Açores e Madeira. Em «Mais camadas deste tema» estão a ocupação do solo, os nitratos, a erosão, as captações, o clima e a biodiversidade.",
    en: "Where to settle as a young organic farmer. The suitability layer (hexagons, from light green «good» to dark green «the best») combines ten positive criteria: soil, organic matter, distance from pressures, rain, groundwater, irrigation water, market within reach, more affordable land, less sought-after areas and support network. On top: land capability, soil organic carbon, RAN, rivers, public irrigation schemes and reference points (markets, fairs, shops, farms, box schemes, schools, bio-regions), each with a profile. Mainland, Azores and Madeira. «More layers in this theme» has land cover, nitrates, erosion, abstractions, climate and biodiversity."
  };
  function ajustarTema() {
    var T = W.__iprTemas; if (!T || typeof T.defs !== "function") return false;
    var b = (T.defs() || []).filter(function (x) { return x && x.id === "bio"; })[0]; if (!b) return false;
    if (b.__apt) return true; b.__apt = 1;
    var c = ["sroa", "carbono", "ran", "hidro"]; b.c.splice.apply(b.c, [0, b.c.length].concat(c));
    ["cos23", "nitratos"].forEach(function (id) { if (b.extra && b.extra.indexOf(id) < 0) b.extra.unshift(id); });
    if (b.leg) b.leg.splice.apply(b.leg, [0, b.leg.length].concat([["l_sroa", "#9e9d24", "area"], ["l_carbono", "#5d4037", "area"], ["l_ran", "#c9a227", "area"], ["l_agua", "#2b7bb9", "linha"]]));
    return true;
  }
  function textoTema(w) {
    var ver = w.querySelector(".ipr-t62-c:not(.ipr-ag-c) .ipr-t62-ver"); if (!ver) return;
    var p = ver.querySelector("p") || ver; var txt = TXT[en() ? "en" : "pt"];
    if (p.getAttribute("data-apt") === "1" && p.textContent === txt) return;
    // o primeiro parágrafo do bloco «O que está a ver»
    var alvo = null; [].some.call(ver.querySelectorAll("p"), function (x) { if (x.textContent.length > 120) { alvo = x; return true; } return false; });
    if (!alvo) { [].some.call(w.querySelectorAll("p"), function (x) { if (/Ocupação do solo \(COS 2023\)|Land cover \(COS 2023\)/.test(x.textContent)) { alvo = x; return true; } return false; }); }
    if (alvo && alvo.textContent !== txt) { alvo.textContent = txt; alvo.setAttribute("data-apt", "1"); }
  }
  var BIO = false, AUTO = {};
  function vigiarTema() {
    ajustarTema();
    var w = D.getElementById("ipr-t62"); if (!w || !W.MutationObserver) { setTimeout(vigiarTema, 1500); return; }
    var tm = 0;
    function ver() {
      ajustarTema();
      var on = !!w.querySelector('[data-t62="bio"][aria-pressed="true"]');
      if (on) textoTema(w);
      if (on === BIO) return; BIO = on;
      if (on) { var abrir = !ver.ja; ["apt", "reg", "pts"].forEach(function (k) { if (k === "apt" && abrir) return; if (k === "pts" && /[?&]entidade=/.test(location.search)) return; if (!ON[k]) { ON[k] = true; AUTO[k] = 1; } }); }
      else { Object.keys(AUTO).forEach(function (k) { ON[k] = false; }); AUTO = {}; }
      guardar(); sinc(); desenharApt(); desenharReg(); desenharPts();
    }
    setTimeout(function () { ver.ja = 1; }, 8000);
    new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(ver, 60); }).observe(w, {subtree: true, childList: true, attributes: true, attributeFilter: ["aria-pressed"]});
    ver();
  }
  W.__iprAptidao = {
    ligar: function (v) { ON.apt = v !== false; guardar(); sinc(); desenharApt(); },
    regadio: function (v) { ON.reg = v !== false; guardar(); sinc(); desenharReg(); },
    pontos: function (v) { ON.pts = v !== false; guardar(); sinc(); desenharPts(); },
    ligada: function () { return ON.apt; },
    dados: dados
  };
  (function cedo(n) { if (!ajustarTema() && n < 60) setTimeout(function () { cedo(n + 1); }, 250); })(0);
  (function arrancar(n) {
    var I = mapa();
    if (!I || !bloco()) { if (n < 80) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var feito = false;
    function repor() { desenharApt(); desenharReg(); desenharPts(); }
    if (I.isStyleLoaded && I.isStyleLoaded()) repor(); else I.once("idle", repor);
    I.on("styledata", function () { if (ON.apt && !I.getLayer("ipr-apt-f")) setTimeout(desenharApt, 0); if (ON.reg && !I.getLayer("ipr-reg-f")) setTimeout(desenharReg, 0); if (ON.pts && !I.getLayer("ipr-biop")) setTimeout(desenharPts, 0); });
    // Se o tema já vinha ligado e o estilo ainda não estava pronto, volta a tentar quando o mapa assenta.
    var ult = 0;
    I.on("idle", function () { if (Date.now() - ult < 1500) return; ult = Date.now(); if (ON.apt && !I.getLayer("ipr-apt-f")) desenharApt(); if (ON.reg && !I.getLayer("ipr-reg-f")) desenharReg(); if (ON.pts && !I.getLayer("ipr-biop")) desenharPts(); });
    I.on("click", "ipr-apt-f", popup);
    I.on("click", "ipr-biop", fichaPt);
    I.on("mouseenter", "ipr-biop", function () { I.getCanvas().style.cursor = "pointer"; });
    I.on("mouseleave", "ipr-biop", function () { I.getCanvas().style.cursor = ""; });
    I.on("mouseenter", "ipr-apt-f", function () { I.getCanvas().style.cursor = "pointer"; });
    I.on("mouseleave", "ipr-apt-f", function () { I.getCanvas().style.cursor = ""; });
    I.on("click", "ipr-reg-f", function (e) {
      var I2 = mapa(); if (I2.queryRenderedFeatures(e.point, {layers: ["ipr-apt-f"]}).length && ON.apt) return;
      var p = e.features[0].properties;
      try { new W.maplibregl.Popup({maxWidth: "280px", className: "ipr-apt-pp"}).setLngLat(e.lngLat).setHTML('<div class="ipr-apt-pop"><div class="k">' + t("Regadio público", "Public irrigation") + '</div><div class="t">' + (p.nome || "") + '</div><div class="cc">' + (p.gestor || "") + "</div>" + (p.ha ? "<div>" + Math.round(p.ha).toLocaleString("pt-PT") + " ha · " + (p.grupo || "") + "</div>" : "") + '<p class="n">DGADR, ' + t("aproveitamentos em exploração", "schemes in operation") + ", Set. 2024. " + t("Não inclui o Alqueva (EFMA).", "Alqueva (EFMA) not included.") + "</p></div>").addTo(I2); limpaNativo(); } catch (x) {}
    });
    vigiarTema();
  })(0);
})();
