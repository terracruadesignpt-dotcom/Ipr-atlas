/* IPR Atlas · base-desenho.js (10/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 10/11/2026, 21h42: «Não estou a conseguir redesenhar as extremas de uma base cartográfica. Isso era uma ferramenta
   essencial. [...] aquele bloco de notas que nós temos na base cartográfica, podia ficar no Atlas e podia dar para desenhar
   diretamente.» Caixas às 21h50: «Versão nova, original guardado»; «Dono, editores e equipa».
   1. Na Ficha da propriedade de cada Base aberta (separador Resumo) aparece «Desenhar nesta Base». Abre uma barra por cima
      do mapa com: Extremas, Nota (ponto), Linha, Área, Guardar e Fechar.
   2. Extremas: os vértices do limite da Base aparecem no mapa. Arrastar move; carregar no ponto do meio de um lado acrescenta
      um vértice; botão direito (ou toque longo) num vértice apaga-o. «Encaixar no cadastro» puxa o vértice largado para o
      vértice de parcela do cadastro mais próximo (até 12 px), quando o cadastro está ligado. Guardar cria uma versão nova do
      limite no servidor (m91530); a original fica guardada e qualquer versão pode ser reposta na mesma barra.
   3. Notas: ponto, linha ou área, com texto e cor. Ficam gravadas na Base (m91530) e aparecem a quem abre a Base;
      carregar numa nota mostra o texto. Lista das notas na barra, com editar e apagar.
   Enquanto se desenha, os cliques no mapa são só do desenho (não abrem fichas nem escolhem parcelas). Esc cancela.
   Quem só tem partilha de leitor vê as notas mas não vê o botão.
   Nuno, 21h51: «A ideia com isto de desenhar no Atlas é aproximar o Atlas do que é [o Q]Field.» As notas têm os campos das
   notas de campo do QField (texto, tipo: observação, problema, foto, medição; autor; data) e há «Nota na minha posição»
   (GPS do aparelho), como no campo.
   Desligar: ?bdes=0 ou localStorage ipr_bdes_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]bdes=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_bdes_off") === "1") return; } catch (e) {}
  if (W.__iprBDes || !W.tcdNonce) return; W.__iprBDes = 1;

  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en"; }
  function T(a, b) { return en() ? b : a; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function est() { return W.__ipe && W.__ipe.estado; }
  function rest(caminho, corpo) {
    return fetch("/wp-json/tcd/v1/" + caminho, corpo ? { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-WP-Nonce": W.tcdNonce }, body: JSON.stringify(corpo) }
      : { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || j.code) throw new Error((j && j.message) || ("HTTP " + r.status)); return j; }); });
  }
  function fcDe(g) {
    if (!g) return null; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { return null; } }
    if (g.type === "FeatureCollection") return g;
    if (g.type === "Feature") return { type: "FeatureCollection", features: [g] };
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: g }] };
  }
  function haDe(fc) {
    var R = 6378137, tot = 0;
    (fc.features || []).forEach(function (f) { var g = f.geometry; (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []).forEach(function (p) { p.forEach(function (a, i) {
      var s = 0; for (var k = 0; k < a.length - 1; k++) { var x = a[k], y = a[k + 1]; s += (y[0] - x[0]) * Math.PI / 180 * (2 + Math.sin(x[1] * Math.PI / 180) + Math.sin(y[1] * Math.PI / 180)); }
      s = Math.abs(s * R * R / 2); tot += i ? -s : s; }); }); });
    return tot / 10000;
  }
  function ha(v) { return Number(v).toLocaleString(en() ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha"; }
  var TIPOS = [["observacao", "Observação", "Observation"], ["problema", "Problema", "Problem"], ["foto", "Foto", "Photo"], ["medicao", "Medição", "Measurement"]];
  function tipoNome(k) { var t = TIPOS.filter(function (x) { return x[0] === k; })[0] || TIPOS[0]; return T(t[1], t[2]); }
  var CORES = ["#e8b84a", "#e0705a", "#94be39", "#4a9fe0", "#b06ad8", "#ffffff"];

  // ---------- estado ----------
  var S = { enc: 0, i: -1, nome: "", editar: false, notas: { type: "FeatureCollection", features: [] }, versoes: [], vigor: 0,
    modo: "", limite: null, sujo: false, sujoNotas: false, nova: null, encaixar: true, arr: null };

  // ---------- camadas no mapa ----------
  var SRC_N = "ipr-bd-notas", SRC_E = "ipr-bd-ed";
  function garantirCamadas() {
    var m = mapa(); if (!m || !m.getStyle()) return false;
    if (!m.getSource(SRC_N)) {
      m.addSource(SRC_N, { type: "geojson", data: S.notas });
      m.addLayer({ id: SRC_N + "-f", type: "fill", source: SRC_N, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["coalesce", ["get", "cor"], "#e8b84a"], "fill-opacity": 0.22 } });
      m.addLayer({ id: SRC_N + "-l", type: "line", source: SRC_N, filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": ["coalesce", ["get", "cor"], "#e8b84a"], "line-width": 2.5 } });
      m.addLayer({ id: SRC_N + "-p", type: "circle", source: SRC_N, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 7, "circle-color": ["coalesce", ["get", "cor"], "#e8b84a"], "circle-stroke-color": "#1b1d18", "circle-stroke-width": 2 } });
      m.on("click", SRC_N + "-p", popup); m.on("click", SRC_N + "-f", popup); m.on("click", SRC_N + "-l", popup);
      [SRC_N + "-p", SRC_N + "-f", SRC_N + "-l"].forEach(function (l) { m.on("mouseenter", l, function () { if (!S.modo) m.getCanvas().style.cursor = "pointer"; }); m.on("mouseleave", l, function () { if (!S.modo) m.getCanvas().style.cursor = ""; }); });
    }
    if (!m.getSource(SRC_E)) {
      m.addSource(SRC_E, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({ id: SRC_E + "-f", type: "fill", source: SRC_E, filter: ["==", ["get", "k"], "a"], paint: { "fill-color": "#e8b84a", "fill-opacity": 0.12 } });
      m.addLayer({ id: SRC_E + "-l", type: "line", source: SRC_E, filter: ["any", ["==", ["get", "k"], "a"], ["==", ["get", "k"], "l"]], paint: { "line-color": "#ffd23f", "line-width": 2.5, "line-dasharray": [2, 1] } });
      m.addLayer({ id: SRC_E + "-m", type: "circle", source: SRC_E, filter: ["==", ["get", "k"], "m"], paint: { "circle-radius": 4, "circle-color": "#ffd23f", "circle-opacity": 0.55 } });
      m.addLayer({ id: SRC_E + "-v", type: "circle", source: SRC_E, filter: ["==", ["get", "k"], "v"], paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": "#c9771d", "circle-stroke-width": 2.5 } });
    }
    return true;
  }
  function popup(e) {
    if (S.modo) return; var f = e.features && e.features[0]; if (!f || !W.maplibregl) return;
    var p = f.properties || {}, h = "<div style='font:13px/1.4 Inter,sans-serif;max-width:240px;color:#1b1d18'>" + (p.texto ? esc(p.texto).replace(/\n/g, "<br>") : "<i>" + esc(T("Nota sem texto", "Note without text")) + "</i>") +
      "<div style='opacity:.6;font-size:11px;margin-top:4px'>" + esc(tipoNome(p.tipo) + (p.quem ? " · " + p.quem : "") + (p.quando ? " · " + new Date(p.quando * 1000).toLocaleDateString(en() ? "en-GB" : "pt-PT") : "")) + "</div>" + "</div>";
    new W.maplibregl.Popup({ closeButton: true, maxWidth: "260px" }).setLngLat(e.lngLat).setHTML(h).addTo(mapa());
  }
  function pintarNotas() { var m = mapa(); if (m && m.getSource(SRC_N)) m.getSource(SRC_N).setData(S.notas); }

  // geometria em edição: anéis do limite (ou a nota nova) -> linhas, vértices e pontos do meio
  function aneisDe(fc) { var r = []; (fc.features || []).forEach(function (f, fi) { var g = f.geometry; (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []).forEach(function (p, pi) { p.forEach(function (a, ai) { r.push({ f: fi, p: pi, a: ai, c: a, mp: g.type === "MultiPolygon" }); }); }); }); return r; }
  function pintarEdicao() {
    var m = mapa(); if (!m || !m.getSource(SRC_E)) return; var fs = [];
    if (S.modo === "limite" && S.limite) {
      aneisDe(S.limite).forEach(function (r, ri) {
        fs.push({ type: "Feature", properties: { k: "a" }, geometry: { type: "Polygon", coordinates: [r.c] } });
        for (var i = 0; i < r.c.length - 1; i++) {
          fs.push({ type: "Feature", properties: { k: "v", r: ri, i: i }, geometry: { type: "Point", coordinates: r.c[i] } });
          var a = r.c[i], b = r.c[i + 1]; fs.push({ type: "Feature", properties: { k: "m", r: ri, i: i }, geometry: { type: "Point", coordinates: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] } });
        }
      });
    } else if (S.nova && S.nova.c.length) {
      var c = S.nova.c;
      if (S.nova.t === "area" && c.length >= 3) fs.push({ type: "Feature", properties: { k: "a" }, geometry: { type: "Polygon", coordinates: [c.concat([c[0]])] } });
      else if (c.length >= 2) fs.push({ type: "Feature", properties: { k: "l" }, geometry: { type: "LineString", coordinates: c } });
      c.forEach(function (q) { fs.push({ type: "Feature", properties: { k: "v" }, geometry: { type: "Point", coordinates: q } }); });
    }
    m.getSource(SRC_E).setData({ type: "FeatureCollection", features: fs });
  }

  // ---------- rato e toque no mapa (só quando se desenha) ----------
  function ponto(ev) { var m = mapa(), r = m.getCanvas().getBoundingClientRect(), t = ev.touches && ev.touches[0] || ev.changedTouches && ev.changedTouches[0] || ev; return [t.clientX - r.left, t.clientY - r.top]; }
  function lngLat(px) { var l = mapa().unproject(px); return [+l.lng.toFixed(7), +l.lat.toFixed(7)]; }
  function perto(px, tipo) {
    if (!S.limite) return null; var m = mapa(), best = null, bd = tipo === "v" ? 11 : 9;
    aneisDe(S.limite).forEach(function (r, ri) {
      for (var i = 0; i < r.c.length - 1; i++) {
        var q = tipo === "v" ? r.c[i] : [(r.c[i][0] + r.c[i + 1][0]) / 2, (r.c[i][1] + r.c[i + 1][1]) / 2], p = m.project(q), d = Math.hypot(p.x - px[0], p.y - px[1]);
        if (d < bd) { bd = d; best = { r: ri, i: i }; }
      }
    });
    return best;
  }
  function anel(ri) { return aneisDe(S.limite)[ri].c; }
  function encaixe(px) {
    if (!S.encaixar) return null; var m = mapa(), best = null, bd = 12;
    var fs = []; try { fs = m.queryRenderedFeatures([[px[0] - 14, px[1] - 14], [px[0] + 14, px[1] + 14]]).filter(function (f) { return /cad/i.test(f.layer.id) || /cadastro/i.test(String(f.sourceLayer || "")); }); } catch (e) {}
    fs.forEach(function (f) { var g = f.geometry; (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []).forEach(function (p) { p.forEach(function (a) { a.forEach(function (q) { var s = m.project(q), d = Math.hypot(s.x - px[0], s.y - px[1]); if (d < bd) { bd = d; best = [+q[0].toFixed(7), +q[1].toFixed(7)]; } }); }); }); });
    return best;
  }
  var toqueT = null;
  function baixo(ev) {
    if (!S.modo || (ev.button && ev.button !== 0)) return;
    var px = ponto(ev);
    if (S.modo === "limite") {
      var v = perto(px, "v");
      if (v) { ev.preventDefault(); ev.stopPropagation(); S.arr = v; mapa().dragPan.disable();
        if (ev.touches) { clearTimeout(toqueT); toqueT = setTimeout(function () { if (S.arr && !S.arr.mexeu) { apagarVertice(v); S.arr = null; mapa().dragPan.enable(); } }, 650); }
      }
    }
  }
  function mexe(ev) {
    if (!S.arr) return; ev.preventDefault(); ev.stopPropagation(); S.arr.mexeu = true;
    var c = anel(S.arr.r), q = lngLat(ponto(ev)); c[S.arr.i] = q; if (S.arr.i === 0) c[c.length - 1] = q;
    S.sujo = true; pintarEdicao();
  }
  function cima(ev) {
    if (!S.arr) return; ev.preventDefault(); ev.stopPropagation(); clearTimeout(toqueT);
    if (S.arr.mexeu) { var e = encaixe(ponto(ev)); if (e) { var c = anel(S.arr.r); c[S.arr.i] = e; if (S.arr.i === 0) c[c.length - 1] = e; } }
    S.arr = null; mapa().dragPan.enable(); pintarEdicao(); barra(); S.engolir = true; setTimeout(function () { S.engolir = false; }, 50);
  }
  function apagarVertice(v) { var c = anel(v.r); if (c.length <= 4) { aviso(T("Um limite precisa de pelo menos 3 vértices.", "A boundary needs at least 3 vertices.")); return; } c.splice(v.i, 1); if (v.i === 0) c[c.length - 1] = c[0]; S.sujo = true; pintarEdicao(); barra(); }
  function clique(ev) {
    if (!S.modo) return; ev.preventDefault(); ev.stopPropagation(); if (S.engolir) return;
    var px = ponto(ev);
    if (S.modo === "limite") { var m = perto(px, "m"); if (m) { var c = anel(m.r), a = c[m.i], b = c[m.i + 1]; c.splice(m.i + 1, 0, [+((a[0] + b[0]) / 2).toFixed(7), +((a[1] + b[1]) / 2).toFixed(7)]); S.sujo = true; pintarEdicao(); barra(); } return; }
    var q = lngLat(px);
    if (S.modo === "ponto") { novaNota({ type: "Point", coordinates: q }); return; }
    S.nova = S.nova || { t: S.modo, c: [] }; S.nova.c.push(q); pintarEdicao(); barra();
  }
  function duplo(ev) { if (!S.modo) return; ev.preventDefault(); ev.stopPropagation(); if (S.nova) terminar(); }
  function menu(ev) { if (S.modo !== "limite") return; var v = perto(ponto(ev), "v"); ev.preventDefault(); ev.stopPropagation(); if (v) apagarVertice(v); }
  function tecla(ev) { if (!S.modo) return; if (ev.key === "Escape") { if (S.nova) { S.nova = null; pintarEdicao(); barra(); } else modoAte(""); } if (ev.key === "Enter" && S.nova) terminar(); }
  var ligadoEv = false;
  function ligarEventos(on) {
    var m = mapa(); if (!m) return; var c = m.getCanvasContainer();
    var f = on ? "addEventListener" : "removeEventListener";
    if (on === ligadoEv) return; ligadoEv = on;
    c[f]("mousedown", baixo, true); c[f]("touchstart", baixo, { capture: true, passive: false });
    W[f]("mousemove", mexe, true); W[f]("touchmove", mexe, { capture: true, passive: false });
    W[f]("mouseup", cima, true); W[f]("touchend", cima, true);
    c[f]("click", clique, true); c[f]("dblclick", duplo, true); c[f]("contextmenu", menu, true);
    D[f]("keydown", tecla, true);
  }

  // ---------- notas ----------
  function terminar() {
    var n = S.nova; S.nova = null; if (!n) return;
    if (n.t === "linha" && n.c.length >= 2) novaNota({ type: "LineString", coordinates: n.c });
    else if (n.t === "area" && n.c.length >= 3) novaNota({ type: "Polygon", coordinates: [n.c.concat([n.c[0]])] });
    else aviso(T("Faltam pontos: uma linha precisa de 2 e uma área de 3.", "Not enough points: a line needs 2 and an area 3."));
    pintarEdicao(); barra();
  }
  function novaNota(g) {
    var f = { type: "Feature", properties: { id: "n" + Date.now().toString(36), texto: "", tipo: S.tipo || "observacao", cor: S.cor || CORES[0], quando: Math.round(Date.now() / 1000) }, geometry: g };
    S.notas.features.push(f); S.sujoNotas = true; pintarNotas(); barra(); editarTexto(f.properties.id);
  }
  function editarTexto(id) { S.aEditar = id; barra(); setTimeout(function () { var t = D.querySelector("#ipr-bd textarea"); if (t) t.focus(); }, 30); }

  // ---------- barra ----------
  function aviso(t, bom) { S.msg = t; S.msgBom = !!bom; barra(); clearTimeout(S.tMsg); S.tMsg = setTimeout(function () { S.msg = ""; barra(); }, 6000); }
  var css = D.createElement("style"); css.id = "ipr-bd-css";
  css.textContent =
    "#ipr-bd{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100002;width:min(560px,calc(100vw - 24px));max-height:min(70vh,560px);overflow:auto;background:#1b1d18;color:#f5f4ee;border:1px solid #3a3d33;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);font:13px/1.45 Inter,system-ui,sans-serif;padding:10px 12px}" +
    "#ipr-bd h4{margin:0;font:600 13.5px/1.3 Inter,system-ui,sans-serif;display:flex;gap:8px;align-items:center}#ipr-bd h4 span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ipr-bd .row{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0;align-items:center}" +
    "#ipr-bd button{font:600 12px/1 Inter,system-ui,sans-serif;padding:8px 10px;border-radius:7px;border:1px solid #4a4d43;background:#24271f;color:#f5f4ee;cursor:pointer;min-height:34px}" +
    "#ipr-bd button:hover{border-color:#94be39}#ipr-bd button.on{background:#94be39;color:#1b1d18;border-color:#94be39}#ipr-bd button.pri{background:#94be39;color:#1b1d18;border-color:#94be39}" +
    "#ipr-bd button[disabled]{opacity:.45;cursor:default}#ipr-bd .x{background:none;border:0;font-size:18px;padding:4px 8px;min-height:0}" +
    "#ipr-bd .aj{opacity:.75;font-size:12px;margin:8px 0 0}#ipr-bd .msg{margin:8px 0 0;padding:6px 8px;border-radius:6px;background:rgba(224,112,90,.18)}#ipr-bd .msg.ok{background:rgba(148,190,57,.18)}" +
    "#ipr-bd label{display:inline-flex;gap:6px;align-items:center;font-size:12px}#ipr-bd select,#ipr-bd textarea{font:13px Inter,system-ui,sans-serif;background:#24271f;color:#f5f4ee;border:1px solid #4a4d43;border-radius:7px;padding:6px}" +
    "#ipr-bd textarea{width:100%;min-height:60px;box-sizing:border-box;margin-top:6px}#ipr-bd .cores{display:inline-flex;gap:4px}#ipr-bd .cores i{width:18px;height:18px;border-radius:50%;cursor:pointer;border:2px solid transparent}#ipr-bd .cores i.on{border-color:#fff}" +
    "#ipr-bd ul{list-style:none;margin:6px 0 0;padding:0}#ipr-bd li{display:flex;gap:6px;align-items:center;padding:5px 0;border-top:1px solid #33362d}#ipr-bd li .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ipr-bd li i{width:10px;height:10px;border-radius:50%;flex:0 0 auto}" +
    "#ipr-bd li button{padding:5px 8px;min-height:0;font-size:11px}" +
    ".ipr-bd-abrir{display:block;width:100%;margin:10px 0 0;padding:9px 12px;border-radius:8px;border:1px solid rgba(148,190,57,.6);background:transparent;color:inherit;font:600 13px/1.2 Inter,system-ui,sans-serif;cursor:pointer;text-align:left}.ipr-bd-abrir:hover{background:rgba(148,190,57,.12)}";
  (D.head || D.documentElement).appendChild(css);

  function barra() {
    var b = D.getElementById("ipr-bd"); if (!S.enc) { if (b) b.remove(); return; }
    if (!b) { b = D.createElement("div"); b.id = "ipr-bd"; b.setAttribute("role", "dialog"); D.body.appendChild(b); b.addEventListener("click", acao); b.addEventListener("input", entrada); b.addEventListener("change", entrada); }
    var md = S.modo, h = "<h4><span>" + esc(T("Desenho · ", "Drawing · ") + S.nome) + "</span><button type='button' class='x' data-a='fechar' aria-label='" + esc(T("Fechar", "Close")) + "'>×</button></h4>";
    if (S.editar) {
      h += "<div class='row'>" + [["limite", T("Extremas", "Boundary")], ["ponto", T("Nota", "Note")], ["linha", T("Linha", "Line")], ["area", T("Área", "Area")]].map(function (x) {
        return "<button type='button' data-m='" + x[0] + "' class='" + (md === x[0] ? "on" : "") + "'>" + esc(x[1]) + "</button>"; }).join("") +
        (S.nova ? "<button type='button' data-a='terminar' class='pri'>" + esc(T("Terminar", "Finish")) + "</button>" : "") +
        "<button type='button' data-a='gps'>" + esc(T("◎ Nota na minha posição", "◎ Note at my position")) + "</button></div>";
      if (md === "limite") {
        var a = S.limite ? haDe(S.limite) : 0;
        h += "<p class='aj'>" + esc(T("Arraste os vértices brancos. Carregue num ponto amarelo do meio de um lado para acrescentar um vértice. Botão direito ou toque longo num vértice para o apagar.", "Drag the white vertices. Click a yellow midpoint to add a vertex. Right-click or long-press a vertex to delete it.")) + "</p>" +
          "<div class='row'><label><input type='checkbox' data-a='encaixar'" + (S.encaixar ? " checked" : "") + "> " + esc(T("Encaixar no cadastro", "Snap to cadastre")) + "</label><span style='margin-left:auto;font:500 12px \"IBM Plex Mono\",monospace'>" + esc(ha(a)) + "</span></div>" +
          "<div class='row'><button type='button' class='pri' data-a='gravar-limite'" + (S.sujo ? "" : " disabled") + ">" + esc(T("Guardar extremas (versão nova)", "Save boundary (new version)")) + "</button><button type='button' data-a='desfazer-limite'" + (S.sujo ? "" : " disabled") + ">" + esc(T("Desfazer", "Undo")) + "</button></div>";
        if (S.versoes.length > 1) h += "<div class='row'><label>" + esc(T("Versões:", "Versions:")) + " <select data-a='versao'>" + S.versoes.map(function (v) {
          return "<option value='" + v.v + "'" + (v.v === S.vigor ? " selected" : "") + ">" + esc(v.nome + (v.area_ha ? " · " + ha(v.area_ha) : "") + (v.quem ? " · " + v.quem : "") + (v.v === S.vigor ? T(" (em vigor)", " (current)") : "")) + "</option>"; }).join("") +
          "</select></label><button type='button' data-a='repor'>" + esc(T("Pôr em vigor", "Make current")) + "</button></div>";
      } else if (md) {
        h += "<p class='aj'>" + esc(md === "ponto" ? T("Carregue no mapa onde quer a nota.", "Click the map where you want the note.") : T("Carregue no mapa ponto a ponto. Duplo clique, Enter ou «Terminar» para acabar; Esc cancela.", "Click the map point by point. Double-click, Enter or «Finish» to end; Esc cancels.")) + "</p>" +
          "<div class='row'><span class='cores'>" + CORES.map(function (c) { return "<i data-cor='" + c + "' class='" + ((S.cor || CORES[0]) === c ? "on" : "") + "' style='background:" + c + "'></i>"; }).join("") + "</span></div>";
      }
    } else h += "<p class='aj'>" + esc(T("Tem acesso só de leitura a esta Base: vê as notas, mas não pode desenhar.", "You have read-only access to this Base: you can see the notes but not draw.")) + "</p>";
    var ed = S.aEditar && S.notas.features.filter(function (f) { return f.properties.id === S.aEditar; })[0];
    if (ed) h += "<div class='row'><label>" + esc(T("Tipo", "Type")) + " <select data-a='tipo'>" + TIPOS.map(function (x) { return "<option value='" + x[0] + "'" + ((ed.properties.tipo || "observacao") === x[0] ? " selected" : "") + ">" + esc(T(x[1], x[2])) + "</option>"; }).join("") + "</select></label></div>" +
      "<textarea data-a='texto' placeholder='" + esc(T("Escreva a nota…", "Write the note…")) + "'>" + esc(ed.properties.texto || "") + "</textarea><div class='row'><button type='button' data-a='ok-texto' class='pri'>OK</button></div>";
    if (S.notas.features.length) h += "<ul>" + S.notas.features.map(function (f) {
      var g = f.geometry.type, tipo = tipoNome(f.properties.tipo) + (g === "LineString" ? T(" · linha", " · line") : g === "Polygon" ? T(" · área", " · area") : "");
      return "<li><i style='background:" + esc(f.properties.cor || CORES[0]) + "'></i><span class='t'>" + esc(tipo + (f.properties.texto ? " · " + f.properties.texto : "")) + "</span><button type='button' data-ir='" + esc(f.properties.id) + "'>" + esc(T("Ver", "Show")) + "</button>" +
        (S.editar ? "<button type='button' data-ed='" + esc(f.properties.id) + "'>" + esc(T("Texto", "Text")) + "</button><button type='button' data-del='" + esc(f.properties.id) + "'>" + esc(T("Apagar", "Delete")) + "</button>" : "") + "</li>"; }).join("") + "</ul>";
    if (S.editar) h += "<div class='row'><button type='button' class='pri' data-a='gravar-notas'" + (S.sujoNotas ? "" : " disabled") + ">" + esc(T("Guardar notas", "Save notes")) + "</button></div>";
    if (S.msg) h += "<p class='msg" + (S.msgBom ? " ok" : "") + "'>" + esc(S.msg) + "</p>";
    var foco = D.activeElement && b.contains(D.activeElement) && D.activeElement.tagName === "TEXTAREA";
    if (foco) return; // não apagar o que se está a escrever
    b.innerHTML = h;
  }
  function entrada(e) {
    var a = e.target.getAttribute("data-a");
    if (a === "encaixar") { S.encaixar = e.target.checked; }
    if (a === "tipo") { var f0 = S.notas.features.filter(function (x) { return x.properties.id === S.aEditar; })[0]; if (f0) { f0.properties.tipo = e.target.value; S.tipo = e.target.value; S.sujoNotas = true; pintarNotas(); } return; }
    if (a === "texto") { var f = S.notas.features.filter(function (x) { return x.properties.id === S.aEditar; })[0]; if (f) { f.properties.texto = e.target.value.slice(0, 1000); S.sujoNotas = true; pintarNotas(); } }
  }
  function acao(e) {
    var t = e.target.closest("button,i[data-cor]"); if (!t) return;
    var m = t.getAttribute("data-m"), a = t.getAttribute("data-a");
    if (t.hasAttribute("data-cor")) { S.cor = t.getAttribute("data-cor"); barra(); return; }
    if (m) { modoAte(S.modo === m ? "" : m); return; }
    if (t.hasAttribute("data-ir")) { irPara(t.getAttribute("data-ir")); return; }
    if (t.hasAttribute("data-ed")) { editarTexto(t.getAttribute("data-ed")); return; }
    if (t.hasAttribute("data-del")) { var id = t.getAttribute("data-del"); S.notas.features = S.notas.features.filter(function (f) { return f.properties.id !== id; }); S.sujoNotas = true; pintarNotas(); barra(); return; }
    if (a === "ok-texto") { S.aEditar = null; D.activeElement && D.activeElement.blur(); barra(); return; }
    if (a === "terminar") { terminar(); return; }
    if (a === "gps") {
      if (!navigator.geolocation) { aviso(T("Este aparelho não dá a posição.", "This device does not give its position.")); return; }
      aviso(T("A pedir a posição ao aparelho…", "Asking the device for its position…"), true);
      navigator.geolocation.getCurrentPosition(function (p) { var q = [+p.coords.longitude.toFixed(7), +p.coords.latitude.toFixed(7)]; novaNota({ type: "Point", coordinates: q }); try { mapa().easeTo({ center: q, zoom: Math.max(mapa().getZoom(), 17) }); } catch (x) {} aviso(T("Nota posta na sua posição (precisão ", "Note placed at your position (accuracy ") + Math.round(p.coords.accuracy) + " m).", true); },
        function () { aviso(T("Não foi possível obter a posição. Autorize a localização no navegador.", "Could not get the position. Allow location in the browser.")); }, { enableHighAccuracy: true, timeout: 15000 });
      return;
    }
    if (a === "fechar") { fechar(); return; }
    if (a === "desfazer-limite") { S.limite = JSON.parse(S.limiteBase); S.sujo = false; pintarEdicao(); barra(); return; }
    if (a === "gravar-limite") { gravarLimite(); return; }
    if (a === "gravar-notas") { gravarNotas(); return; }
    if (a === "repor") { var sel = D.querySelector("#ipr-bd select[data-a=versao]"); if (sel) repor(+sel.value); return; }
  }
  function modoAte(m) {
    if (S.nova) { S.nova = null; }
    S.modo = m; ligarEventos(!!m);
    var mp = mapa(); if (mp) mp.getCanvas().style.cursor = m && m !== "limite" ? "crosshair" : "";
    if (m === "limite" && !S.limite) { var g = limiteActual(); if (g) { S.limite = g; S.limiteBase = JSON.stringify(g); } }
    if (m === "limite" && S.limite) enquadrar(S.limite);
    pintarEdicao(); barra();
  }
  function limiteActual() { var E = est(), p = E && E.mapas && E.mapas[S.i]; var fc = p && fcDe(p.geojson); return fc ? JSON.parse(JSON.stringify(fc)) : null; }
  function enquadrar(fc) {
    var b = [180, 90, -180, -90]; JSON.stringify(fc.features.map(function (f) { return f.geometry.coordinates; })).replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, function (_, x, y) { x = +x; y = +y; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); return ""; });
    try { mapa().fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: { top: 60, bottom: 260, left: 60, right: 60 }, maxZoom: 18, duration: 500 }); } catch (e) {}
  }
  function irPara(id) { var f = S.notas.features.filter(function (x) { return x.properties.id === id; })[0]; if (!f) return; if (f.geometry.type === "Point") { try { mapa().easeTo({ center: f.geometry.coordinates, zoom: Math.max(mapa().getZoom(), 17) }); } catch (e) {} } else enquadrar({ features: [f] }); }

  function gravarLimite() {
    if (!S.limite) return; var a = haDe(S.limite), b = S.limiteBase ? haDe(JSON.parse(S.limiteBase)) : a;
    S.msg = T("A guardar…", "Saving…"); barra();
    rest("base-limite", { enc: S.enc, geojson: S.limite }).then(function (j) {
      var E = est(), p = E && E.mapas && E.mapas[S.i]; if (p) p.geojson = JSON.parse(JSON.stringify(S.limite));
      S.limiteBase = JSON.stringify(S.limite); S.sujo = false; S.vigor = j.em_vigor;
      return carregar(true).then(function () { aviso(T("Extremas guardadas como versão nova (", "Boundary saved as a new version (") + ha(j.area_ha) + T("; antes ", "; before ") + ha(b) + T("). A original continua guardada. A ficha e as camadas do terreno passam a usar este limite.", "). The original is kept. The property sheet and land layers now use this boundary."), true); });
    }).catch(function (x) { aviso(T("Não foi possível guardar: ", "Could not save: ") + x.message); });
  }
  function gravarNotas() {
    S.msg = T("A guardar…", "Saving…"); barra();
    rest("base-desenho", { enc: S.enc, desenho: S.notas }).then(function (j) { S.sujoNotas = false; aviso(T("Notas guardadas (", "Notes saved (") + j.n + ").", true); })
      .catch(function (x) { aviso(T("Não foi possível guardar: ", "Could not save: ") + x.message); });
  }
  function repor(v) {
    rest("base-limite", { enc: S.enc, repor: v }).then(function () { return carregar(true); }).then(function () {
      var o = S.versoes.filter(function (x) { return x.v === v; })[0];
      var E = est(), p = E && E.mapas && E.mapas[S.i];
      // a geometria da versão vem do servidor na próxima leitura de meus-mapas; aqui usa-se a original ou a gravada
      aviso(T("Versão posta em vigor: ", "Version made current: ") + (o ? o.nome : v) + T(". Volte a abrir a Base para ver o limite no mapa.", ". Reopen the Base to see the boundary on the map."), true);
      S.limite = null; if (S.modo === "limite") modoAte("limite");
    }).catch(function (x) { aviso(T("Não foi possível: ", "Could not: ") + x.message); });
  }
  function carregar(soVersoes) {
    return rest("base-desenho?enc=" + S.enc).then(function (j) {
      S.editar = !!j.editar; S.versoes = j.versoes || []; S.vigor = j.em_vigor || 0;
      if (!soVersoes) { S.notas = fcDe(j.desenho) || { type: "FeatureCollection", features: [] }; S.notas.features.forEach(function (f) { f.properties = f.properties || {}; if (!f.properties.id) f.properties.id = "n" + Math.random().toString(36).slice(2, 8); }); garantirCamadas(); pintarNotas(); }
      barra();
    });
  }
  function abrir(i) {
    var E = est(), p = E && E.mapas && E.mapas[i]; if (!p) return;
    if (S.enc && S.enc !== +p.id) fechar(true);
    S.enc = +p.id; S.i = i; S.nome = p.local || ("#" + p.id); S.limite = null; S.sujo = false; S.sujoNotas = false; S.msg = "";
    garantirCamadas(); barra();
    carregar(false).catch(function (x) { aviso(x.message); });
  }
  function fechar(sem) {
    if (!sem && (S.sujo || S.sujoNotas) && !S.confirmar) { S.confirmar = true; aviso(T("Há alterações por guardar. Carregue outra vez em × para sair sem guardar.", "There are unsaved changes. Click × again to leave without saving.")); setTimeout(function () { S.confirmar = false; }, 6000); return; }
    S.confirmar = false; modoAte(""); S.enc = 0; S.limite = null; S.nova = null; pintarEdicao(); barra();
  }
  W.__iprBaseDesenho = { abrir: abrir, fechar: fechar };

  // ---------- botão na Ficha da propriedade e notas da Base aberta ----------
  var notasDe = {};
  function varrer() {
    D.querySelectorAll("#ipe .ipe-card.on .ipr-fx").forEach(function (fx) {
      if (fx.querySelector(":scope > .ipr-bd-abrir")) return;
      var c = fx.closest(".ipe-card"), i = +c.getAttribute("data-i"), E = est(), p = E && E.mapas && E.mapas[i]; if (!p || !p.id) return;
      var b = D.createElement("button"); b.type = "button"; b.className = "ipr-bd-abrir"; b.textContent = T("✎ Desenhar nesta Base: extremas e notas", "✎ Draw on this Base: boundary and notes");
      b.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); abrir(i); });
      var tc = fx.querySelector(":scope > .ipr-tcam"); fx.insertBefore(b, tc || null);
      // as notas desta Base aparecem no mapa mesmo sem abrir a barra
      if (!notasDe[p.id] && !S.enc) { notasDe[p.id] = 1; rest("base-desenho?enc=" + p.id).then(function (j) { var fc = fcDe(j.desenho); if (fc && fc.features.length && !S.enc) { S.notas = fc; garantirCamadas(); pintarNotas(); } if (!j.editar) b.textContent = T("Ver as notas desta Base", "See this Base's notes"); }).catch(function () {}); }
    });
  }
  var t = null;
  function vigia() { if (t) return; t = setTimeout(function () { t = null; try { varrer(); } catch (e) {} }, 400); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x && x.closest && x.closest("#ipr-bd")) continue; vigia(); return; } })
    .observe(D.body || D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  // o estilo do mapa pode mudar (fundos): voltar a pôr as camadas
  (function esperar(n) { var m = mapa(); if (m && m.on) { m.on("styledata", function () { if (!m.getSource(SRC_N) && (S.enc || S.notas.features.length)) { garantirCamadas(); pintarNotas(); pintarEdicao(); } }); } else if (n < 60) setTimeout(function () { esperar(n + 1); }, 500); })(0);
  vigia();
})();
