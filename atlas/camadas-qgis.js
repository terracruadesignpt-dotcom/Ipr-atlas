/* IPR Atlas · Camadas ligadas à maneira do QGIS (Nuno, 30/10/2026, 17h49: «Painel de camadas à QGIS: arrastar camadas para
   mudar a ordem, transparência em cada camada e clique direito com "Ir para", "Propriedades" e "Exportar»). Terracrua Design.
   Só acrescenta; não altera nada do que existe. Liga-se em tempo de execução a window.__ipe (mapa, viz) e a window.IPRViz.
   Desliga-se com ?camadas-qgis=0 ou localStorage ipr_camadas-qgis_off=1. Cada parte falha em silêncio.

   1. Secção nova e recolhível «Camadas ligadas» na barra da esquerda, logo acima da secção «Camadas». Ordem de desenho
      como no QGIS: a de cima desenha por cima. Arrasta-se pela pega (rato, toque e caneta; também setas do teclado na pega);
      a linha agarrada segue o ponteiro e um marcador mostra onde vai ficar; cancelar ou perder a captura desfaz.
      As camadas MapLibre de cada entrada do catálogo são as do viz.js: «iprv-<id>-<sufixo>» (-r, -lzr, -f, -l, -c, -t,
      -q ...), fonte «iprv-<id>». A ordem só é imposta depois do primeiro arrasto e só dentro das faixas do viz.js (entre os
      sentinelas iprv-s-raster, -fill, -line, -point, -aoi, -label): imagens nunca passam por cima de linhas e uma camada
      ligada depois entra na faixa do seu tipo. Terreno (aoi) e etiquetas (o_nomes, camadas só de texto) e os fundos ficam
      fixos, sem pega. A ordem guarda-se neste navegador por mapa (?mapa= ou o terreno aberto).
      Deslizador de opacidade (10 a 100 %, como o da árvore) com a mesma regra por tipo do mudarOpacidade do viz.js; passa
      pelo deslizador da árvore quando a linha dela está aberta. Só se grava o que é mexido neste painel; mexer na árvore
      só actualiza o valor mostrado aqui (e anula o que este painel tinha guardado para essa camada). Linhas bloqueadas
      (.bl) não têm deslizador.
      Menu de clique direito (toque longo no iPad; também botão «...»): Ir para, Propriedades e, só em camadas de licença
      aberta («v») que não sejam produtos IPR (Base Cartográfica, camadas do IPR, entregas, escorrência), Exportar:
      GeoJSON dos elementos visíveis (fontes GeoJSON com a geometria completa, mosaicos vectoriais com a desenhada);
      raster e WMS: o endereço do serviço para abrir no QGIS.
   2. Reportes do técnico Bernardo:
      17048 Contador do número de camadas ligadas sempre visível ao fazer scroll (barra fixa no topo da zona que rola;
            repete o texto do rodapé da árvore, que fica onde está).
      16456 Acumulação de fluxo quase invisível (mapa 15896): o viz.js e o app.js desenham-na com opacidade 0,45 e a rampa
            começa em #c6dbef. Ao ligar, só nessa camada: raster mais opaco e mais escuro (brilho máximo 0,72, contraste);
            se vier em linhas, linha azul-escura e mais grossa.
      16462 Bacias diferentes com a mesma cor: a correcção d542d64 colore pelo rótulo (A1, A2 ... B1) com 4 cores em ciclo
            ((letra x 10 + número) mod 4), por isso A1, A5, A9 ou A3 e B1 repetem cor, e bacias vizinhas podem ficar iguais.
            Aqui, ao ligar «Bacias hidrográficas» da Base, lêem-se as bacias, calcula-se quem toca em quem e pinta-se de modo
            que vizinhas nunca fiquem iguais (8 cores e mais, se forem precisas; fill-color por rótulo). Em PMTiles há um só
            ouvinte «idle» por mapa, com espera, que só recalcula quando muda o conjunto de rótulos carregados. */
(function () {
  "use strict";
  var W = window, D = document, NOME = "camadas-qgis";
  try {
    if (new URLSearchParams(location.search).get(NOME) === "0") return;
    if (localStorage.getItem("ipr_" + NOME + "_off") === "1") return;
  } catch (e) {}
  if (W.__iprCamadasQgis) return;
  W.__iprCamadasQgis = 1;

  // ---------- utilitários ----------
  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(D.documentElement.lang || "pt"); }
  function T(pt, ing) { return en() ? ing : pt; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function lerJ(k, d) { try { var v = JSON.parse(ler(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  var K_ORDEM = "ipr_cq_ordem", K_OP = "ipr_cq_op", K_ABERTO = "ipr_cq_aberto";
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa ? i.mapa : null; }
  function viz() { var i = ipe(); return i && i.viz ? i.viz : null; }
  function catalogo() { return (W.IPRViz && W.IPRViz.catalogo) || []; }
  function entrada(id) { var c = catalogo(); for (var i = 0; i < c.length; i++) if (c[i] && c[i].id === id) return c[i]; return null; }
  function estiloCamadas(M) { try { return ((M.getStyle() || {}).layers || []); } catch (e) { return []; } }
  function nomeDe(e, id) { if (!e) return id; return (en() && (e.en || e.nEn)) || e.n || id; }
  function ehFundo(id) { var e = entrada(id); return !!(e && e.fundo) || id === "f_sub"; }

  // Camadas MapLibre de uma entrada do catálogo (a mesma regra do viz.js: prefixo «iprv-<id>-»).
  function camadasDe(id, L) {
    var p = "iprv-" + id + "-", r = [];
    for (var i = 0; i < L.length; i++) if (L[i].id.indexOf(p) === 0 || L[i].id === "iprv-" + id) r.push(L[i].id);
    return r;
  }
  // Mapa camada MapLibre -> id da entrada (ids mais compridos primeiro, para «a» não apanhar «a-b»).
  function dono(ids) {
    var ord = ids.slice().sort(function (a, b) { return b.length - a.length; });
    return function (lid) {
      for (var i = 0; i < ord.length; i++) { var p = "iprv-" + ord[i]; if (lid === p || lid.indexOf(p + "-") === 0) return ord[i]; }
      return null;
    };
  }

  // ---------- opacidade (mesma regra do mudarOpacidade do viz.js) ----------
  function aplicarOp(M, id, o) {
    var e = entrada(id) || {}, L = estiloCamadas(M);
    camadasDe(id, L).forEach(function (a) {
      try {
        var r = M.getLayer(a); if (!r) return;
        var t = r.type;
        if (t === "raster") M.setPaintProperty(a, "raster-opacity", o);
        else if (t === "fill") { if (!/-q$/.test(a)) M.setPaintProperty(a, "fill-opacity", o); }
        else if (t === "fill-extrusion") M.setPaintProperty(a, "fill-extrusion-opacity", o);
        else if (t === "line") M.setPaintProperty(a, "line-opacity", Math.min(1, e.t === "mvt" && e.e && e.e.tipo === "fill" ? o + 0.3 : o));
        else if (t === "circle") M.setPaintProperty(a, "circle-opacity", o);
        else if (t === "hillshade") M.setPaintProperty(a, "hillshade-exaggeration", 0.5 * o + 0.1);
        else if (t === "symbol") M.setPaintProperty(a, "text-opacity", o);
      } catch (x) {}
    });
  }
  function opDaArvore(id) {
    try {
      var s = D.querySelector('#ipe-cam .ipr-it[data-id="' + (W.CSS && CSS.escape ? CSS.escape(id) : id) + '"] .ipr-op');
      return s ? s : null;
    } catch (e) { return null; }
  }
  function opLida(M, id) {
    var s = opDaArvore(id); if (s) return (+s.value || 100) / 100;
    var g = lerJ(K_OP, {}); if (typeof g[id] === "number") return g[id];
    var L = estiloCamadas(M), ls = camadasDe(id, L);
    for (var i = 0; i < ls.length; i++) {
      try {
        var r = M.getLayer(ls[i]); if (!r) continue;
        var p = { raster: "raster-opacity", fill: "fill-opacity", line: "line-opacity", circle: "circle-opacity", "fill-extrusion": "fill-extrusion-opacity" }[r.type];
        if (!p || /-q$/.test(ls[i])) continue;
        var v = M.getPaintProperty(ls[i], p);
        if (typeof v === "number") return v;
      } catch (e) {}
    }
    var e = entrada(id); return e && typeof e.op === "number" ? e.op : 1;
  }
  function bloqueada(id) {
    try { var li = D.querySelector('#ipe-cam .ipr-it[data-id="' + (W.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); return !!(li && li.classList.contains("bl")); } catch (e) { return false; }
  }
  function temOpacidade(id) { var e = entrada(id); return !(e && (e.fundo || e.t === "aoi")) && id !== "aoi" && !bloqueada(id); }
  // Pela árvore do viz.js quando a linha dela está aberta (o viz.js guarda S[id].op e usa-o ao recriar a camada); sempre
  // também directamente no mapa, com a mesma regra. Só se grava o que foi mexido neste painel.
  function opPelaArvore(id, o) {
    var s = opDaArvore(id); if (!s) return false;
    B.emitir = 1;
    try { s.value = String(Math.max(+s.min || 10, Math.round(o * 100))); s.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
    B.emitir = 0; return true;
  }
  function mudarOp(id, o) {
    var M = mapa(); if (!M) return;
    o = Math.max(0.1, Math.min(1, o));
    var g = lerJ(K_OP, {}); g[id] = Math.round(o * 100) / 100; gravar(K_OP, JSON.stringify(g));
    opPelaArvore(id, o);
    aplicarOp(M, id, o);
  }

  // ---------- 16456 acumulação ----------
  var RE_ACUM = /^(iprv-l_acumulacao|ipe-am-acumulacao)(-|$)/;
  function corrigirAcumulacao(M, lid) {
    try {
      var r = M.getLayer(lid); if (!r) return;
      var g = lerJ(K_OP, {}), op = typeof g.l_acumulacao === "number" ? g.l_acumulacao : 0.9;
      if (r.type === "raster") {
        // na árvore (quando a linha está aberta) para o deslizador dela mostrar o valor aplicado e o viz.js o guardar
        if (/^iprv-l_acumulacao-/.test(lid)) opPelaArvore("l_acumulacao", op);
        M.setPaintProperty(lid, "raster-opacity", op);
        M.setPaintProperty(lid, "raster-brightness-max", 0.72);
        M.setPaintProperty(lid, "raster-contrast", 0.25);
        M.setPaintProperty(lid, "raster-saturation", 0.2);
      } else if (r.type === "line") {
        M.setPaintProperty(lid, "line-color", "#08519c");
        M.setPaintProperty(lid, "line-width", ["interpolate", ["linear"], ["zoom"], 10, 1.4, 14, 2.4, 18, 4]);
        M.setPaintProperty(lid, "line-opacity", op);
      }
    } catch (e) {}
  }

  // ---------- 16462 bacias com cores distintas entre vizinhas ----------
  var RE_BAC = /^(iprv-l_bacias_l|ipe-am-bacias_l)-f$/;
  var CORES_BAC = ["#E8A4C8", "#7ECFC0", "#B5D46A", "#9B8EC4", "#F2B37A", "#7FA8D9", "#E3CF6A", "#D98C8C"];
  function corBacia(i) {
    if (i < CORES_BAC.length) return CORES_BAC[i];
    var h = Math.round((i * 137.508) % 360); return "hsl(" + h + ",55%,68%)"; // cores extra (ângulo de ouro), nunca repetidas
  }
  function rotulo(p) { p = p || {}; var v = p.label != null ? p.label : (p.LABEL != null ? p.LABEL : p.rotulo); return v == null ? null : String(v); }
  var MAX_VERT = 250000; // limite de vértices lidos por cálculo (o resto das bacias fica com a cor do rótulo)
  function coresBacias(feats) {
    var CEL = 0.0002, cel = {}, lista = {}, n = 0;
    feats.forEach(function (f) {
      var lb = rotulo(f && f.properties); if (lb == null || !f.geometry) return;
      lista[lb] = 1;
      (function andar(c) {
        if (!c || !c.length || n > MAX_VERT) return;
        if (typeof c[0] === "number") { n++; var k = Math.round(c[0] / CEL) + ":" + Math.round(c[1] / CEL); (cel[k] = cel[k] || {})[lb] = 1; return; }
        for (var i = 0; i < c.length; i++) andar(c[i]);
      })(f.geometry.coordinates);
    });
    var vz = {}, rot = Object.keys(lista);
    rot.forEach(function (r) { vz[r] = {}; });
    Object.keys(cel).forEach(function (k) {
      var p = k.split(":"), x = +p[0], y = +p[1], aqui = Object.keys(cel[k]);
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
        var o = cel[(x + dx) + ":" + (y + dy)]; if (!o) continue;
        for (var a = 0; a < aqui.length; a++) for (var b in o) if (b !== aqui[a]) { vz[aqui[a]][b] = 1; vz[b][aqui[a]] = 1; }
      }
    });
    rot.sort(function (a, b) { return Object.keys(vz[b]).length - Object.keys(vz[a]).length || (a < b ? -1 : 1); });
    var cor = {};
    rot.forEach(function (r) {
      var usadas = {}; Object.keys(vz[r]).forEach(function (v) { if (cor[v] != null) usadas[cor[v]] = 1; });
      var i = 0; while (usadas[i]) i++; cor[r] = i;
    });
    return { cor: cor, viz: vz };
  }
  function lerDados(M, src) {
    var s = M.getSource(src); if (!s) return Promise.resolve(null);
    if (s.type === "geojson") {
      try { if (typeof s.getData === "function") { var p = s.getData(); if (p && p.then) return p; if (p) return Promise.resolve(p); } } catch (e) {}
      try { if (s._data && typeof s._data === "object") return Promise.resolve(s._data); } catch (e) {}
      try { var z = s.serialize && s.serialize(); if (z && z.data && typeof z.data === "object") return Promise.resolve(z.data); } catch (e) {}
      return Promise.resolve(null);
    }
    return Promise.resolve(null);
  }
  function pintarBacias(M, lid, feats) {
    if (!feats || !feats.length || !M.getLayer(lid)) return false;
    var c = coresBacias(feats), k = Object.keys(c.cor); if (k.length < 2) return false;
    var ex = ["match", ["to-string", ["coalesce", ["get", "label"], ["get", "LABEL"], ["get", "rotulo"], ""]]];
    k.forEach(function (r) { ex.push(r, corBacia(c.cor[r])); });
    ex.push(CORES_BAC[0]);
    M.setPaintProperty(lid, "fill-color", ex);
    W.__iprCqBacias = c; // para diagnóstico
    return true;
  }
  // Mosaicos vectoriais (PMTiles): só se conhecem as bacias já carregadas. Um só ouvinte «idle» por mapa, com espera, que só
  // recalcula quando muda o conjunto de rótulos carregados (não a contagem por vista).
  function vigiarBacias(M) {
    if (M.__iprCqBac) return;
    M.__iprCqBac = 1;
    var t = 0;
    M.on("idle", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        try {
          var a = B.bac; if (!a || a.M !== M || !M.getLayer(a.lid)) return;
          var f = M.querySourceFeatures(a.src, a.sl ? { sourceLayer: a.sl } : {});
          var r = {}; f.forEach(function (x) { var l = rotulo(x && x.properties); if (l != null) r[l] = 1; });
          var ass = Object.keys(r).sort().join("|");
          if (ass === a.ass) return;
          a.ass = ass; pintarBacias(M, a.lid, f);
        } catch (e) {}
      }, 400);
    });
  }
  function corrigirBacias(M, lid) {
    try {
      var r = M.getLayer(lid); if (!r) return;
      var src = r.source, sl = r.sourceLayer || r["source-layer"];
      B.bac = null;
      lerDados(M, src).then(function (d) {
        if (d && d.features) { pintarBacias(M, lid, d.features); return; }
        B.bac = { M: M, lid: lid, src: src, sl: sl, ass: "" };
        vigiarBacias(M);
      }).catch(function () {});
    } catch (e) {}
  }

  // ---------- estado ----------
  var B = { emitir: 0, M: null, vistos: {}, sec: null, lista: null, cont: null, menu: null, dlg: null, arrastar: null, assin: "", tRef: 0 };

  // A ordem guarda-se por mapa (?mapa=<id> ou o terreno aberto); sem mapa, a da conta.
  function chaveOrdem() {
    var m = "";
    try { m = new URLSearchParams(location.search).get("mapa") || ""; } catch (e) {}
    if (!m) { try { var a = ipe().estado.actual; if (a && a.id != null) m = String(a.id); } catch (e) {} }
    return K_ORDEM + (m ? "_" + m.replace(/[^\w-]/g, "_").slice(0, 60) : "");
  }
  // Fora do arrasto: o limite do terreno e as etiquetas (só camadas de texto), que o viz.js mantém sempre por cima.
  function fixa(id, L) {
    if (id === "aoi" || id === "o_nomes") return true;
    var e = entrada(id); if (e && e.t === "aoi") return true;
    var ls = camadasDe(id, L); if (!ls.length) return false;
    return ls.every(function (l) { var x = null; try { x = mapa().getLayer(l); } catch (err) {} return x && x.type === "symbol"; });
  }
  function activasOrdenadas(M, V) {
    var act = []; try { act = (V.activas() || []).slice(); } catch (e) {}
    act = act.filter(function (id) { return !ehFundo(id); });
    var L = estiloCamadas(M), qual = dono(act), topo = {};
    for (var i = 0; i < L.length; i++) { var d = qual(L[i].id); if (d) topo[d] = i; }
    var porTopo = function (a, b) { return (topo[b] == null ? 1e9 : topo[b]) - (topo[a] == null ? 1e9 : topo[a]); };
    var fixas = act.filter(function (id) { return fixa(id, L); }).sort(porTopo);
    var mov = act.filter(function (id) { return fixas.indexOf(id) < 0; });
    // ordem actual de desenho, de cima para baixo; as que ainda não têm camadas (a carregar) ficam no topo
    var ordem = mov.slice().sort(porTopo);
    var g = lerJ(chaveOrdem(), null);
    if (g && g.length) {
      var dentro = g.filter(function (id) { return mov.indexOf(id) >= 0; });
      ordem.forEach(function (id, i) {
        if (dentro.indexOf(id) >= 0) return;
        // camada nova: entra junto da vizinha de cima na ordem actual, ou no topo
        var pos = 0;
        for (var j = i - 1; j >= 0; j--) { var k = dentro.indexOf(ordem[j]); if (k >= 0) { pos = k + 1; break; } }
        dentro.splice(pos, 0, id);
      });
      return { ordem: dentro, fixas: fixas, imposta: true, act: act };
    }
    return { ordem: ordem, fixas: fixas, imposta: false, act: act };
  }

  // Respeita as faixas do viz.js: cada camada fica entre os mesmos sentinelas (iprv-s-raster, -fill, -line, -point, -aoi,
  // -label) e só se reordena dentro da sua faixa. Uma raster nunca passa por cima das linhas, e uma camada ligada depois
  // entra na faixa do seu tipo (nunca fica escondida por baixo das imagens). Sem sentinelas no mapa, não se mexe em nada.
  function impor(M, ordem) {
    var L = estiloCamadas(M), qual = dono(ordem), faixas = [], cur = [], tem = false;
    for (var i = 0; i < L.length; i++) {
      var id = L[i].id;
      if (id.indexOf("iprv-s-") === 0) { tem = true; faixas.push({ ancora: id, ls: cur }); cur = []; continue; }
      if (qual(id)) cur.push(id);
    }
    if (!tem) return;
    if (cur.length) {
      // por cima do último sentinela: âncora é a primeira camada não gerida acima da mais alta gerida
      var conj = {}; cur.forEach(function (x) { conj[x] = 1; });
      var idx = -1; for (i = 0; i < L.length; i++) if (L[i].id === cur[cur.length - 1]) idx = i;
      var anc; for (i = idx + 1; i < L.length; i++) if (!conj[L[i].id]) { anc = L[i].id; break; }
      faixas.push({ ancora: anc, ls: cur });
    }
    var baixoCima = ordem.slice().reverse();
    faixas.forEach(function (f) {
      if (!f.ls.length) return;
      var seq = [];
      f.ls.forEach(function (lid) { var d = qual(lid); if (seq[seq.length - 1] !== d) seq.push(d); });
      var desejada = baixoCima.filter(function (id) { return seq.indexOf(id) >= 0; });
      if (seq.join("\n") === desejada.join("\n")) return;
      desejada.forEach(function (id) {
        f.ls.forEach(function (lid) { if (qual(lid) === id) { try { M.moveLayer(lid, f.ancora); } catch (e) {} } });
      });
    });
  }

  function novasCamadas(M, act) {
    var L = estiloCamadas(M), agora = {}, novas = {};
    var qual = dono(act);
    for (var i = 0; i < L.length; i++) {
      // o objecto da camada muda quando o viz.js a apaga e volta a criar: conta como nova
      var lid = L[i].id, obj = null; try { obj = M.getLayer(lid) || 1; } catch (e) { obj = 1; }
      agora[lid] = obj;
      if (B.vistos[lid] === obj) continue;
      if (RE_ACUM.test(lid)) corrigirAcumulacao(M, lid);
      if (RE_BAC.test(lid)) corrigirBacias(M, lid);
      var d = qual(lid); if (d) novas[d] = 1;
    }
    B.vistos = agora;
    var g = lerJ(K_OP, {});
    Object.keys(novas).forEach(function (id) { if (typeof g[id] === "number" && temOpacidade(id)) aplicarOp(M, id, g[id]); });
  }

  // ---------- interface ----------
  var CSS_TXT =
    "#ipr-cq{flex:none;border-bottom:1px solid var(--ln,#e3dfcc);background:var(--p1,#fff);color:var(--tx,#222)}" +
    "#ipr-cq .ipr-cq-h{display:flex;align-items:center;gap:8px;width:100%;border:0;background:var(--p2,#fff);color:var(--tx,#222);font:600 12px/1 var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;text-align:left;padding:10px 12px;min-height:40px;cursor:pointer}" +
    "#ipr-cq .ipr-cq-h:hover{background:var(--p3,#f4f2ea)}#ipr-cq .ipr-cq-h em{font-style:normal;color:var(--ac2,#5f6b3a);margin-left:2px}" +
    "#ipr-cq .ipr-cq-car{width:0;height:0;border-left:5px solid var(--mu,#6b6f5c);border-top:4px solid transparent;border-bottom:4px solid transparent;transform:rotate(90deg);transition:transform .12s}" +
    "#ipr-cq.fech .ipr-cq-car{transform:none}#ipr-cq.fech .ipr-cq-c{display:none}" +
    "#ipr-cq .ipr-cq-c{max-height:38vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}" +
    "#ipr-cq .ipr-cq-l{list-style:none;margin:0;padding:4px 0}" +
    "#ipr-cq .ipr-cq-it{display:grid;grid-template-columns:40px minmax(0,1fr) 40px;align-items:center;padding:0 4px 2px 0;border-top:1px solid transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;background:var(--p1,#fff)}" +
    "#ipr-cq .ipr-cq-it.arr{background:var(--acs,rgba(117,131,74,.14));box-shadow:0 2px 10px rgba(0,0,0,.18);position:relative;z-index:2}" +
    "#ipr-cq .ipr-cq-it.fixa .ipr-cq-pega{visibility:hidden}#ipr-cq .ipr-cq-ph{height:4px;margin:2px 8px;border-radius:2px;background:var(--ac,#75834a)}" +
    "#ipr-cq .ipr-cq-pega{width:40px;height:40px;border:0;background:none;color:var(--mu,#6b6f5c);cursor:grab;touch-action:none;display:flex;align-items:center;justify-content:center;padding:0}" +
    "#ipr-cq .ipr-cq-pega:active{cursor:grabbing}#ipr-cq .ipr-cq-pega svg{width:16px;height:16px}" +
    "#ipr-cq .ipr-cq-n{min-width:0;font-size:13px;line-height:1.25;padding:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ipr-cq .ipr-cq-n small{display:block;font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis}" +
    "#ipr-cq .ipr-cq-mais{width:40px;height:40px;border:0;background:none;color:var(--tx,#222);font-size:18px;line-height:1;cursor:pointer;border-radius:4px}" +
    "#ipr-cq .ipr-cq-mais:hover{background:var(--p3,#f4f2ea)}" +
    "#ipr-cq .ipr-cq-op{grid-column:2/4;display:flex;align-items:center;gap:8px;font:11px var(--mono,monospace);color:var(--mu2,#737761);padding-right:8px}" +
    "#ipr-cq .ipr-cq-op input{flex:1;min-width:0;height:28px;accent-color:var(--ac,#75834a)}#ipr-cq .ipr-cq-op output{width:38px;text-align:right}" +
    "#ipr-cq .ipr-cq-vazio{padding:10px 12px;font-size:12px;opacity:.75}" +
    "#ipr-cq .ipr-cq-rod{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:4px;padding:0 8px 6px 12px}#ipr-cq .ipr-cq-nota{flex:1 1 100%;margin:0;font-size:11px;line-height:1.35;opacity:.7}" +
    "#ipr-cq .ipr-cq-rod button{border:0;background:none;color:var(--ac2,#5f6b3a);font-size:12px;text-decoration:underline;min-height:40px;padding:0 6px;cursor:pointer}" +
    "#ipr-cq-cont{position:sticky;top:0;z-index:5;flex:none;padding:6px 12px;font:600 11px/1.3 var(--mono,monospace);letter-spacing:.04em;background:var(--p2,#fff);color:var(--ac2,#5f6b3a);border-bottom:1px solid var(--ln,#e3dfcc)}" +
    ".ipr-cq-menu{position:fixed;z-index:100000;min-width:190px;background:var(--p1,#fff);color:var(--tx,#222);border:1px solid var(--ln2,#cfc9b4);border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:4px;font-family:inherit}" +
    ".ipr-cq-menu button{display:block;width:100%;min-height:40px;border:0;background:none;color:inherit;text-align:left;padding:0 12px;font-size:14px;border-radius:4px;cursor:pointer}" +
    ".ipr-cq-menu button:hover,.ipr-cq-menu button:focus{background:var(--p3,#f4f2ea);outline:0}" +
    ".ipr-cq-fundo{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".ipr-cq-dlg{background:var(--p1,#fff);color:var(--tx,#222);border-radius:8px;max-width:520px;width:100%;max-height:86vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:14px}" +
    ".ipr-cq-dlg header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 10px 10px 16px;border-bottom:1px solid var(--ln,#e3dfcc)}" +
    ".ipr-cq-dlg header strong{font-size:15px}.ipr-cq-dlg header button{width:40px;height:40px;border:0;background:none;color:inherit;font-size:22px;cursor:pointer}" +
    ".ipr-cq-dlg .ipr-cq-cp{padding:12px 16px 16px}.ipr-cq-dlg dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 12px;margin:0}" +
    ".ipr-cq-dlg dt{font-weight:600;opacity:.75}.ipr-cq-dlg dd{margin:0;overflow-wrap:anywhere}" +
    ".ipr-cq-dlg input[type=text]{width:100%;box-sizing:border-box;font:12px var(--mono,monospace);padding:8px;border:1px solid var(--ln2,#cfc9b4);border-radius:4px;background:var(--bg,#faf8f1);color:inherit}" +
    ".ipr-cq-dlg .ipr-cq-bt{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;margin:8px 8px 0 0;border:1px solid var(--ac,#75834a);border-radius:4px;background:var(--ac,#75834a);color:#fff;font-size:14px;cursor:pointer}" +
    ".ipr-cq-dlg .ipr-cq-bt.sec{background:none;color:var(--ac2,#5f6b3a)}.ipr-cq-dlg p{margin:0 0 10px}.ipr-cq-dlg .ipr-cq-nota{font-size:12px;opacity:.75}";

  var PEGA = '<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="currentColor"><circle cx="5" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/><circle cx="5" cy="8" r="1.4"/><circle cx="11" cy="8" r="1.4"/><circle cx="5" cy="13" r="1.4"/><circle cx="11" cy="13" r="1.4"/></g></svg>';

  function montar() {
    var esq = D.getElementById("ipe-esq"), cam = esq && esq.querySelector("[data-sb=cam]");
    if (!esq || !cam) return false;
    if (!D.getElementById("ipr-cq-css")) { var st = D.createElement("style"); st.id = "ipr-cq-css"; st.textContent = CSS_TXT; D.head.appendChild(st); }
    if (B.sec && B.sec.isConnected) return true;
    var s = D.createElement("section"); s.id = "ipr-cq"; s.setAttribute("aria-label", "Camadas ligadas");
    if (ler(K_ABERTO) === "0") s.className = "fech";
    s.innerHTML = '<button type="button" class="ipr-cq-h" aria-expanded="' + (ler(K_ABERTO) === "0" ? "false" : "true") + '"><span class="ipr-cq-car"></span><span class="ipr-cq-ht"></span><em></em></button>' +
      '<div class="ipr-cq-c"><ul class="ipr-cq-l" role="list"></ul><div class="ipr-cq-rod"><p class="ipr-cq-nota"></p><button type="button" class="ipr-cq-repor" hidden></button></div></div>';
    esq.insertBefore(s, cam);
    B.sec = s; B.lista = s.querySelector(".ipr-cq-l");
    s.querySelector(".ipr-cq-h").addEventListener("click", function () {
      var f = s.classList.toggle("fech"); this.setAttribute("aria-expanded", String(!f)); gravar(K_ABERTO, f ? "0" : "1");
    });
    s.querySelector(".ipr-cq-repor").addEventListener("click", function () {
      gravar(chaveOrdem(), null); B.assin = ""; refrescar();
      aviso(T("A ordem própria foi retirada. As camadas voltam à ordem do Atlas quando forem ligadas de novo.", "Custom order removed. Layers return to the Atlas order when switched on again."));
    });
    ligarLista();
    return true;
  }

  function textoCabecalho(n) {
    if (!B.sec) return;
    B.sec.querySelector(".ipr-cq-ht").textContent = T("Camadas ligadas", "Active layers");
    B.sec.querySelector(".ipr-cq-h em").textContent = n ? String(n) : "";
    B.sec.setAttribute("aria-label", T("Camadas ligadas", "Active layers"));
    var rp = B.sec.querySelector(".ipr-cq-repor");
    rp.textContent = T("Repor a ordem do Atlas", "Reset to Atlas order");
    rp.hidden = !(lerJ(chaveOrdem(), null) || []).length;
    var nt = B.sec.querySelector(".ipr-cq-nota");
    if (nt) nt.textContent = T("A ordem aplica-se entre camadas do mesmo tipo (imagens, áreas, linhas, pontos). Linhas e pontos ficam sempre por cima das imagens, e as etiquetas e o terreno por cima de tudo.", "Order applies among layers of the same kind (images, areas, lines, points). Lines and points always stay above images, and labels and the site above everything.");
  }

  function linha(id, fixa) {
    var e = entrada(id), M = mapa(), op = temOpacidade(id) && M ? opLida(M, id) : null;
    var g = e && W.IPRViz && W.IPRViz.grupos ? (W.IPRViz.grupos.filter(function (x) { return x.id === e.g; })[0] || {}).nome : "";
    var sub = e ? ((en() && e.subEn) || e.sub || g || "") : "";
    return '<li class="ipr-cq-it' + (fixa ? " fixa" : "") + '" data-id="' + esc(id) + '">' +
      '<button type="button" class="ipr-cq-pega" aria-label="' + esc(T("Arrastar para mudar a ordem: ", "Drag to reorder: ") + nomeDe(e, id)) + '"' + (fixa ? ' tabindex="-1" disabled' : "") + ">" + PEGA + "</button>" +
      '<span class="ipr-cq-n" title="' + esc(nomeDe(e, id)) + '">' + esc(nomeDe(e, id)) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" +
      '<button type="button" class="ipr-cq-mais" aria-haspopup="menu" aria-label="' + esc(T("Opções de ", "Options for ") + nomeDe(e, id)) + '">&#8943;</button>' +
      (op != null ? '<label class="ipr-cq-op"><span>' + esc(T("Opacidade", "Opacity")) + '</span><input type="range" min="10" max="100" step="1" value="' + Math.max(10, Math.round(op * 100)) + '" aria-label="' + esc(T("Opacidade de ", "Opacity of ") + nomeDe(e, id)) + '"><output>' + Math.max(10, Math.round(op * 100)) + " %</output></label>" : "") +
      "</li>";
  }

  function desenharLista(ordem, fixas) {
    if (!B.lista) return;
    // fixas = etiquetas e terreno (sempre por cima), "--", fundos (sempre por baixo)
    var k = fixas.indexOf("--"), cima = fixas.slice(0, k), baixo = fixas.slice(k + 1);
    var h = cima.map(function (id) { return linha(id, true); }).join("") + ordem.map(function (id) { return linha(id, false); }).join("") + baixo.map(function (id) { return linha(id, true); }).join("");
    B.lista.innerHTML = h || '<li class="ipr-cq-vazio">' + esc(T("Nenhuma camada ligada.", "No layers switched on.")) + "</li>";
  }

  // ---------- 17048 contador sempre visível ----------
  function rolante(de, ate) {
    var el = de, cand = null;
    while (el && el !== D.body) {
      var oy = ""; try { oy = getComputedStyle(el).overflowY; } catch (e) {}
      if (oy === "auto" || oy === "scroll") {
        if (el.scrollHeight > el.clientHeight + 1) return el;
        if (!cand) cand = el;
      }
      if (el === ate) break;
      el = el.parentElement;
    }
    return cand;
  }
  function contador(n) {
    var esq = D.getElementById("ipe-esq"), cam = D.getElementById("ipe-cam");
    if (!esq || !cam) return;
    var arv = cam.querySelector(".ipr-arv"), arvL = arv && arv.querySelector(".ipr-arv-l");
    var c = B.cont;
    if (!c || !c.isConnected) { c = D.createElement("div"); c.id = "ipr-cq-cont"; c.setAttribute("role", "status"); c.setAttribute("aria-live", "polite"); B.cont = c; }
    var tot = arv && arv.querySelector(".ipr-rod .ipr-tot");
    var tx = tot && tot.textContent.trim() ? tot.textContent.trim() : (n + " " + T(n === 1 ? "camada temática ligada" : "camadas temáticas ligadas", n === 1 ? "thematic layer on" : "thematic layers on"));
    if (c.textContent !== tx) c.textContent = tx;
    // Onde pôr: logo acima do que rola, para ficar fixo no topo dessa zona.
    var S = rolante(arvL || cam, esq), pai, antes;
    if (S && arvL && S === arvL) { pai = arv; antes = arvL; }          // a lista da árvore rola sozinha: fica entre o cabeçalho e a lista
    else if (S && S === cam) { pai = cam; antes = cam.firstChild; }      // a secção das camadas rola: primeiro filho, fixo no topo
    else { pai = esq; antes = cam.closest("[data-sb=cam]") || null; if (antes && antes.parentNode !== esq) antes = null; } // a barra toda rola
    if (c.parentNode !== pai || (antes && c.nextSibling !== antes && antes !== c)) { try { pai.insertBefore(c, antes === c ? c.nextSibling : antes); } catch (e) {} }
  }

  // ---------- refrescar ----------
  function refrescar() {
    try {
      var M = mapa(), V = viz(); if (!M || !V || typeof V.activas !== "function") return;
      if (!montar()) return;
      var r = activasOrdenadas(M, V);
      novasCamadas(M, r.act);
      if (r.imposta && !B.arrastar) impor(M, r.ordem);
      var fundos = []; try { fundos = (V.activas() || []).filter(ehFundo); } catch (e) {}
      var assin = r.fixas.join("|") + "#" + r.ordem.join("|") + "#" + fundos.join("|") + "#" + (en() ? "en" : "pt");
      if (assin !== B.assin && !B.arrastar) { B.assin = assin; desenharLista(r.ordem, r.fixas.concat(["--"]).concat(fundos)); }
      textoCabecalho(r.ordem.length);
      contador(r.act.filter(function (id) { return id !== "aoi"; }).length);
    } catch (e) {}
  }
  function agendar() { clearTimeout(B.tRef); B.tRef = setTimeout(refrescar, 180); }

  // ---------- arrastar, menu, toque longo ----------
  function idDe(el) { var li = el && el.closest && el.closest(".ipr-cq-it"); return li ? li.getAttribute("data-id") : null; }
  function gravarOrdemDoDom() {
    var ids = [].map.call(B.lista.querySelectorAll(".ipr-cq-it:not(.fixa)"), function (li) { return li.getAttribute("data-id"); });
    gravar(chaveOrdem(), JSON.stringify(ids));
    var M = mapa(); if (M) impor(M, ids);
    textoCabecalho(ids.length);
  }
  // Arrastar: a linha agarrada não sai do sítio no DOM (fica com a captura do ponteiro); segue o dedo com transform e é um
  // marcador que muda de lugar. Ao largar, a linha vai para o lugar do marcador. Cancelar ou perder a captura desfaz.
  function acabarArrasto(confirmar) {
    var a = B.arrastar; if (!a) return;
    B.arrastar = null;
    try { a.li.classList.remove("arr"); a.li.style.transform = ""; } catch (e) {}
    if (confirmar && a.mexeu && a.ph.parentNode) { try { a.ph.parentNode.insertBefore(a.li, a.ph); } catch (e) {} }
    try { a.ph.remove(); } catch (e) {}
    if (confirmar && a.mexeu) gravarOrdemDoDom();
    B.assin = ""; agendar();
  }
  function ligarLista() {
    var L = B.lista, sup = 0;
    L.addEventListener("pointerdown", function (ev) {
      var pega = ev.target.closest(".ipr-cq-pega");
      var li = ev.target.closest(".ipr-cq-it");
      if (!li) return;
      if (pega && !li.classList.contains("fixa")) {
        ev.preventDefault();
        if (B.arrastar) acabarArrasto(false);
        try { pega.setPointerCapture(ev.pointerId); } catch (e) {}
        var ph = D.createElement("li"); ph.className = "ipr-cq-ph"; ph.setAttribute("aria-hidden", "true");
        li.parentNode.insertBefore(ph, li.nextSibling);
        B.arrastar = { li: li, pega: pega, ph: ph, y0: ev.clientY, pid: ev.pointerId, mexeu: false, top0: li.getBoundingClientRect().top };
        li.classList.add("arr");
        return;
      }
      // toque longo (iPad) abre o menu
      if (ev.pointerType !== "mouse" && !ev.target.closest("input,button")) {
        var x0 = ev.clientX, y0 = ev.clientY, t = setTimeout(function () { sup = Date.now(); abrirMenu(li.getAttribute("data-id"), x0, y0); }, 550);
        var parar = function (e2) {
          if (e2.type === "pointermove" && Math.abs(e2.clientX - x0) < 9 && Math.abs(e2.clientY - y0) < 9) return;
          clearTimeout(t); L.removeEventListener("pointermove", parar); L.removeEventListener("pointerup", parar); L.removeEventListener("pointercancel", parar);
        };
        L.addEventListener("pointermove", parar); L.addEventListener("pointerup", parar); L.addEventListener("pointercancel", parar);
      }
    });
    L.addEventListener("pointermove", function (ev) {
      var a = B.arrastar; if (!a || ev.pointerId !== a.pid) return;
      ev.preventDefault();
      if (Math.abs(ev.clientY - a.y0) > 3) a.mexeu = true;
      a.li.style.transform = "translateY(" + (ev.clientY - a.y0) + "px)";
      // lugar do marcador: antes da primeira linha móvel (sem contar a agarrada) cujo meio fica abaixo do ponteiro
      var outras = [].slice.call(L.querySelectorAll(".ipr-cq-it:not(.fixa)")).filter(function (x) { return x !== a.li; });
      var antes = null;
      for (var i = 0; i < outras.length; i++) { var r = outras[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { antes = outras[i]; break; } }
      if (!antes) { var ult = outras[outras.length - 1]; antes = ult ? ult.nextSibling : a.ph; }
      if (antes !== a.ph && a.ph.nextSibling !== antes) { try { L.insertBefore(a.ph, antes); } catch (e) {} }
      var C = B.sec.querySelector(".ipr-cq-c"), rc = C.getBoundingClientRect();
      if (ev.clientY < rc.top + 24) C.scrollTop -= 12; else if (ev.clientY > rc.bottom - 24) C.scrollTop += 12;
    });
    L.addEventListener("pointerup", function (ev) { var a = B.arrastar; if (a && ev.pointerId === a.pid) acabarArrasto(true); });
    L.addEventListener("pointercancel", function (ev) { var a = B.arrastar; if (a && ev.pointerId === a.pid) acabarArrasto(false); });
    L.addEventListener("lostpointercapture", function (ev) { var a = B.arrastar; if (a && ev.pointerId === a.pid) acabarArrasto(false); });
    L.addEventListener("keydown", function (ev) {
      var pega = ev.target.closest(".ipr-cq-pega"); if (!pega) return;
      var li = pega.closest(".ipr-cq-it"), ac = li.previousElementSibling, ab = li.nextElementSibling;
      if (ev.key === "ArrowUp" && ac && !ac.classList.contains("fixa")) { L.insertBefore(li, ac); }
      else if (ev.key === "ArrowDown" && ab && !ab.classList.contains("fixa")) { L.insertBefore(ab, li); }
      else return;
      ev.preventDefault(); pega.focus(); gravarOrdemDoDom(); B.assin = "";
    });
    L.addEventListener("contextmenu", function (ev) { var id = idDe(ev.target); if (!id) return; ev.preventDefault(); abrirMenu(id, ev.clientX, ev.clientY); });
    L.addEventListener("click", function (ev) {
      if (Date.now() - sup < 700) { ev.preventDefault(); return; }
      var b = ev.target.closest(".ipr-cq-mais"); if (!b) return;
      var r = b.getBoundingClientRect(); abrirMenu(idDe(b), r.left, r.bottom);
    });
    L.addEventListener("input", function (ev) {
      var s = ev.target; if (!s.matches || !s.matches(".ipr-cq-op input")) return;
      var id = idDe(s), v = (+s.value || 10) / 100; var o = s.parentNode.querySelector("output"); if (o) o.textContent = s.value + " %";
      mudarOp(id, v);
    });
  }
  // Deslizador da árvore do viz.js -> esta lista: só se mostra o mesmo valor. Não se grava; e o valor que este painel tinha
  // guardado para essa camada deixa de valer (a última escolha passa a ser a da árvore, que o viz.js guarda).
  D.addEventListener("input", function (ev) {
    try {
      var s = ev.target; if (!s || !s.classList || !s.classList.contains("ipr-op") || !s.closest("#ipe-cam")) return;
      if (B.emitir) return; // o próprio eco desta lista
      var li = s.closest(".ipr-it"), id = li && li.getAttribute("data-id"); if (!id) return;
      var g = lerJ(K_OP, {}); if (id in g) { delete g[id]; gravar(K_OP, JSON.stringify(g)); }
      var m = B.lista && B.lista.querySelector('.ipr-cq-it[data-id="' + (W.CSS && CSS.escape ? CSS.escape(id) : id) + '"] .ipr-cq-op');
      if (m) { m.querySelector("input").value = s.value; m.querySelector("output").textContent = s.value + " %"; }
    } catch (e) {}
  }, true);

  function fecharMenu() { if (B.menu) { try { B.menu.remove(); } catch (e) {} B.menu = null; } }
  // Exportar só para camadas de licença aberta («v») que não sejam produtos IPR (Base Cartográfica, camadas do IPR, entregas,
  // terreno); as restantes só têm Ir para e Propriedades.
  var PRODUTO_IPR = { lidar: 1, ext: 1, ent: 1, aoi: 1 };
  function exportavel(id) {
    var e = entrada(id); if (!e || e.lic !== "v") return false;
    if (PRODUTO_IPR[e.t] || /^l_/.test(id) || /escorrencia/.test(id) || e.g === "base" || e.g === "meus") return false;
    return true;
  }
  function abrirMenu(id, x, y) {
    fecharMenu(); if (!id) return;
    var m = D.createElement("div"); m.className = "ipr-cq-menu"; m.setAttribute("role", "menu");
    m.innerHTML = '<button type="button" role="menuitem" data-a="ir">' + esc(T("Ir para", "Zoom to")) + "</button>" +
      '<button type="button" role="menuitem" data-a="prop">' + esc(T("Propriedades", "Properties")) + "</button>" +
      (exportavel(id) ? '<button type="button" role="menuitem" data-a="exp">' + esc(T("Exportar", "Export")) + "</button>" : "");
    D.body.appendChild(m); B.menu = m;
    var w = m.offsetWidth || 200, h = m.offsetHeight || 130;
    m.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + "px";
    m.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + "px";
    m.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-a]"); if (!b) return;
      fecharMenu();
      var a = b.getAttribute("data-a");
      if (a === "ir") irPara(id); else if (a === "prop") propriedades(id); else exportar(id);
    });
    setTimeout(function () { try { m.querySelector("button").focus(); } catch (e) {} }, 0);
  }
  D.addEventListener("pointerdown", function (ev) { if (B.menu && !B.menu.contains(ev.target)) fecharMenu(); }, true);
  D.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { fecharMenu(); fecharDlg(); } });

  function fecharDlg() { if (B.dlg) { try { B.dlg.remove(); } catch (e) {} B.dlg = null; } }
  function dialogo(titulo, html) {
    fecharDlg();
    var f = D.createElement("div"); f.className = "ipr-cq-fundo";
    f.innerHTML = '<div class="ipr-cq-dlg" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><header><strong>' + esc(titulo) + '</strong><button type="button" class="ipr-cq-x" aria-label="' + esc(T("Fechar", "Close")) + '">&times;</button></header><div class="ipr-cq-cp">' + html + "</div></div>";
    f.addEventListener("click", function (ev) { if (ev.target === f || ev.target.closest(".ipr-cq-x")) fecharDlg(); });
    D.body.appendChild(f); B.dlg = f;
    return f;
  }
  function aviso(t) {
    var f = dialogo(T("Camadas ligadas", "Active layers"), "<p>" + esc(t) + "</p>");
    setTimeout(function () { if (B.dlg === f) fecharDlg(); }, 3500);
  }

  // ---------- Ir para ----------
  function bboxDe(g) {
    var b = [180, 90, -180, -90], ok = false;
    (function andar(c) {
      if (!c || !c.length) return;
      if (typeof c[0] === "number") { if (Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90) { ok = true; if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; } return; }
      for (var i = 0; i < c.length; i++) andar(c[i]);
    })(g && g.type === "FeatureCollection" ? (g.features || []).map(function (f) { return f.geometry && f.geometry.coordinates; }) : g && g.type === "Feature" ? g.geometry && g.geometry.coordinates : g && g.coordinates);
    return ok ? b : null;
  }
  var PT_TODO = [-31.6, 30, -6.1, 42.2];
  function extensao(id) {
    var M = mapa(), e = entrada(id) || {};
    if (e.bb && e.bb.length === 4 && e.bb.join() !== PT_TODO.join()) return Promise.resolve(e.bb);
    var src = M && M.getSource("iprv-" + id);
    return (src ? lerDados(M, "iprv-" + id) : Promise.resolve(null)).then(function (d) {
      var b = d && bboxDe(d); if (b) return b;
      try { if (src && src.bounds && src.bounds.length === 4 && src.bounds.join() !== PT_TODO.join()) return src.bounds; } catch (x) {}
      // senão, o terreno aberto
      return lerDados(M, "iprv-aoi").then(function (a) {
        var t = a && bboxDe(a); if (t) return t;
        try { var c = ipe().cfg; if (c && c.aoi) { t = bboxDe(c.aoi); if (t) return t; } } catch (x) {}
        return e.bb && e.bb.length === 4 ? e.bb : null;
      });
    });
  }
  function irPara(id) {
    var M = mapa(); if (!M) return;
    extensao(id).then(function (b) {
      if (!b) { aviso(T("A extensão desta camada não é conhecida e não há terreno aberto.", "This layer's extent is unknown and no site is open.")); return; }
      if (b[0] === b[2] && b[1] === b[3]) { M.flyTo({ center: [b[0], b[1]], zoom: Math.max(M.getZoom(), 15) }); return; }
      M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, maxZoom: 17, duration: 700 });
    }).catch(function () {});
  }

  // ---------- Propriedades ----------
  var TIPOS = {
    wms: "WMS", wmsp: "WMS (através do IPR Atlas)", ags: "ArcGIS REST (MapServer)", img: "ArcGIS REST (ImageServer)",
    mvt: "Mosaico vectorial (OGC API Tiles)", xyz: "Mosaico raster (XYZ)", omt: "Mosaico vectorial (OpenMapTiles)",
    omtbase: "Mosaico vectorial (OpenMapTiles)", ovp: "OpenStreetMap (Overpass)", hill: "Relevo (modelo digital do terreno)",
    curvas: "Curvas de nível (modelo digital do terreno)", lidar: "Base Cartográfica (LiDAR)", ent: "GeoJSON da entrega",
    aoi: "O meu terreno", apa: "GeoJSON (APA)", ext: "Camada do IPR"
  };
  var TIPOS_EN = {
    wmsp: "WMS (through IPR Atlas)", mvt: "Vector tiles (OGC API Tiles)", xyz: "Raster tiles (XYZ)", omt: "Vector tiles (OpenMapTiles)",
    omtbase: "Vector tiles (OpenMapTiles)", hill: "Relief (digital terrain model)", curvas: "Contours (digital terrain model)",
    lidar: "Cartographic Base (LiDAR)", ent: "Delivery GeoJSON", aoi: "My site", ext: "IPR layer"
  };
  var SEM_URL = { lidar: 1, ent: 1, wmsp: 1, ext: 1, aoi: 1 };
  function urlServico(e) {
    if (!e || SEM_URL[e.t] || e.lic !== "v") return null;
    var u = /^https?:\/\//.test(e.url || "") ? e.url : null;
    if (!u) {
      try { var f = (W.IPRViz.fontes() || []).filter(function (x) { return x.id === e.id; })[0]; if (f && /^https?:\/\//.test(f.u || "")) u = f.u; } catch (x) {}
    }
    if (u && e.t === "mvt") u = u.replace(/\/\d+\/\d+\/\d+\?f=mvt$/, "/{z}/{y}/{x}?f=mvt");
    return u;
  }
  function propriedades(id) {
    var e = entrada(id) || { id: id }, M = mapa(), L = M ? estiloCamadas(M) : [];
    var g = W.IPRViz && W.IPRViz.grupos ? (W.IPRViz.grupos.filter(function (x) { return x.id === e.g; })[0] || {}).nome : "";
    var u = urlServico(e), ls = camadasDe(id, L);
    var tipos = ls.map(function (l) { try { return M.getLayer(l).type; } catch (x) { return ""; } }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var lic = e.lic === "r" ? T("Só consulta (licença da fonte)", "View only (source licence)") : T("Conforme os termos da fonte", "As per the source's terms");
    var linhas = [
      [T("Nome", "Name"), nomeDe(e, id)],
      [T("De que é", "What it shows"), [g, (en() && e.subEn) || e.sub].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(" · ")],
      [T("Fonte", "Source"), e.fonte || (u ? (function () { try { return new URL(u).host; } catch (x) { return ""; } })() : "")],
      [T("Licença", "Licence"), lic],
      [T("Tipo", "Type"), ((en() && TIPOS_EN[e.t]) || TIPOS[e.t] || e.t || "") + (tipos.length ? " · " + tipos.join(", ") : "")],
      [T("URL do serviço", "Service URL"), u || (SEM_URL[e.t] ? T("Ficheiro ou serviço privado (sem endereço público)", "Private file or service (no public address)") : "")],
      [T("Camada no serviço", "Service layer"), e.layer || e.layers || e.col || ""],
      [T("Nota", "Note"), (en() && e.notaEn) || e.nota || ""],
      [T("Identificador", "Identifier"), id],
      [T("Camadas no mapa", "Map layers"), ls.join(", ")]
    ].filter(function (r) { return r[1]; });
    dialogo(T("Propriedades", "Properties") + " · " + nomeDe(e, id), "<dl>" + linhas.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>");
  }

  // ---------- Exportar ----------
  function descarregar(nome, txt) {
    try {
      var b = new Blob([txt], { type: "application/geo+json" }), a = D.createElement("a");
      a.href = URL.createObjectURL(b); a.download = nome; D.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 4000);
      return true;
    } catch (e) { return false; }
  }
  function interseca(b, v) { return b && !(b[2] < v[0] || b[0] > v[2] || b[3] < v[1] || b[1] > v[3]); }
  function visiveis(id) {
    var M = mapa(), L = estiloCamadas(M), ls = camadasDe(id, L).filter(function (l) { try { var t = M.getLayer(l).type; return t !== "raster" && t !== "hillshade" && t !== "background"; } catch (e) { return false; } });
    if (!ls.length) return Promise.resolve(null);
    var src = (function () { try { return M.getLayer(ls[0]).source; } catch (e) { return null; } })();
    var vb = M.getBounds(), v = [vb.getWest(), vb.getSouth(), vb.getEast(), vb.getNorth()];
    var s = src && M.getSource(src);
    if (s && s.type === "geojson") {
      return lerDados(M, src).then(function (d) {
        if (!d || !d.features) return porDesenho();
        return d.features.filter(function (f) { return interseca(bboxDe(f), v); });
      });
    }
    return Promise.resolve(porDesenho());
    function porDesenho() {
      var vistos = {}, r = [];
      (M.queryRenderedFeatures(undefined, { layers: ls }) || []).forEach(function (f) {
        try {
          var g = f.geometry, k = (f.id != null ? f.id + "|" : "") + JSON.stringify(f.properties || {}) + "|" + (g && JSON.stringify(g.coordinates).slice(0, 200));
          if (vistos[k]) return; vistos[k] = 1;
          var p = {}; for (var q in f.properties || {}) p[q] = f.properties[q];
          if (f.sourceLayer) p._camada = f.sourceLayer;
          r.push({ type: "Feature", properties: p, geometry: g });
        } catch (e) {}
      });
      return r;
    }
  }
  function exportar(id) {
    if (!exportavel(id)) return;
    var e = entrada(id) || { id: id }, M = mapa(), nome = nomeDe(e, id);
    if (e.lic === "r") {
      dialogo(T("Exportar", "Export") + " · " + nome, "<p>" + esc(T("Esta camada é só de consulta: a licença da fonte não permite exportar.", "This layer is view-only: the source licence does not allow export.")) + "</p>");
      return;
    }
    var ls = camadasDe(id, estiloCamadas(M));
    var vect = ls.some(function (l) { try { var t = M.getLayer(l).type; return t === "fill" || t === "line" || t === "circle" || t === "symbol" || t === "fill-extrusion"; } catch (x) { return false; } });
    var u = urlServico(e), h = "";
    if (vect) h += '<p>' + esc(T("Elementos visíveis no mapa, em GeoJSON (WGS84). Nas camadas em mosaico vectorial a geometria é a desenhada no ecrã e pode vir cortada nos limites dos mosaicos.", "Features visible on the map, as GeoJSON (WGS84). For vector tile layers the geometry is the one drawn on screen and may be clipped at tile edges.")) + '</p><button type="button" class="ipr-cq-bt" data-x="gj">' + esc(T("Descarregar GeoJSON", "Download GeoJSON")) + '</button><p class="ipr-cq-nota" data-x="res"></p>';
    if (u) {
      var qg = { wms: T("No QGIS: Camada > Adicionar camada > WMS/WMTS, nova ligação com este endereço; camada «", "In QGIS: Layer > Add Layer > WMS/WMTS, new connection with this address; layer «") + (e.layer || "") + "».",
        ags: T("No QGIS: Navegador > ArcGIS REST Servers > nova ligação com este endereço.", "In QGIS: Browser > ArcGIS REST Servers > new connection with this address."),
        img: T("No QGIS: Navegador > ArcGIS REST Servers > nova ligação com este endereço.", "In QGIS: Browser > ArcGIS REST Servers > new connection with this address."),
        xyz: T("No QGIS: Navegador > XYZ Tiles > nova ligação com este endereço.", "In QGIS: Browser > XYZ Tiles > new connection with this address."),
        mvt: T("No QGIS: Navegador > Vector Tiles > nova ligação genérica com este endereço.", "In QGIS: Browser > Vector Tiles > new generic connection with this address.") }[e.t] || T("Endereço do serviço para abrir no QGIS.", "Service address to open in QGIS.");
      h += (vect ? "<hr>" : "") + "<p>" + esc(qg) + '</p><input type="text" readonly value="' + esc(u) + '"><button type="button" class="ipr-cq-bt sec" data-x="cp">' + esc(T("Copiar endereço", "Copy address")) + "</button>";
      if (e.t === "wms") { var cap = u + (u.indexOf("?") >= 0 ? "&" : "?") + "SERVICE=WMS&REQUEST=GetCapabilities"; h += '<p class="ipr-cq-nota" style="margin-top:10px">GetCapabilities: ' + esc(cap) + "</p>"; }
    }
    if (!vect && !u) h = "<p>" + esc(e.t === "lidar" ? T("Esta camada vem da Base Cartográfica: o ficheiro completo está no GeoPackage da encomenda.", "This layer comes from the Cartographic Base: the full file is in the order's GeoPackage.") : T("Esta camada não tem exportação possível sem o servidor.", "This layer cannot be exported without the server.")) + "</p>";
    var f = dialogo(T("Exportar", "Export") + " · " + nome, h);
    f.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-x]"); if (!b) return;
      if (b.getAttribute("data-x") === "cp") {
        var inp = f.querySelector("input[type=text]");
        var ok = function () { b.textContent = T("Copiado", "Copied"); };
        try { navigator.clipboard.writeText(inp.value).then(ok, function () { inp.select(); D.execCommand("copy"); ok(); }); } catch (x) { try { inp.select(); D.execCommand("copy"); ok(); } catch (y) {} }
      } else if (b.getAttribute("data-x") === "gj") {
        var res = f.querySelector('[data-x="res"]');
        visiveis(id).then(function (fs) {
          if (!fs || !fs.length) { res.textContent = T("Não há elementos desta camada à vista. Aproxime ou desloque o mapa.", "No features of this layer in view. Zoom or pan the map."); return; }
          var d = new Date(), dt = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
          var fc = { type: "FeatureCollection", name: nome, features: fs };
          descarregar("ipr-atlas-" + String(id).replace(/[^a-z0-9_-]+/gi, "_") + "-" + dt + ".geojson", JSON.stringify(fc));
          res.textContent = fs.length + " " + T(fs.length === 1 ? "elemento exportado." : "elementos exportados.", fs.length === 1 ? "feature exported." : "features exported.");
        }).catch(function () { res.textContent = T("Não foi possível exportar.", "Export failed."); });
      }
    });
  }

  // ---------- ligação ao mapa ----------
  function ligarMapa() {
    var M = mapa(); if (!M || M === B.M) return;
    B.M = M; B.vistos = {}; B.assin = "";
    try { M.on("styledata", agendar); M.on("idle", agendar); } catch (e) {}
    refrescar();
  }
  var voltas = 0;
  (function esperar() {
    try {
      ligarMapa();
      // a verificação periódica só corre com o separador visível e a secção aberta (o resto vem dos eventos do mapa)
      if (B.M && !D.hidden && !(B.sec && B.sec.classList.contains("fech"))) refrescar();
    } catch (e) {}
    voltas++;
    setTimeout(esperar, voltas < 120 ? 500 : 3000); // o Atlas pode recriar o mapa (troca de terreno): verifica-se de vez em quando
  })();
  W.addEventListener("ipr:lingua", function () { B.assin = ""; agendar(); });
  W.addEventListener("resize", agendar);
})();
