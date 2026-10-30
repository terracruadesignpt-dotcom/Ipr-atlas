/* IPR Atlas · Camadas ligadas à maneira do QGIS (Nuno, 30/10/2026, 17h49: «Painel de camadas à QGIS: arrastar camadas para
   mudar a ordem, transparência em cada camada e clique direito com "Ir para", "Propriedades" e "Exportar»). Terracrua Design.
   Só acrescenta; não altera nada do que existe. Liga-se em tempo de execução a window.__ipe (mapa, viz) e a window.IPRViz.
   Desliga-se com ?camadas-qgis=0 ou localStorage ipr_camadas-qgis_off=1. Cada parte falha em silêncio.

   1. Secção nova e recolhível «Camadas ligadas» na barra da esquerda, logo acima da secção «Camadas». Ordem de desenho
      como no QGIS: a de cima desenha por cima. Arrasta-se pela pega (rato, toque e caneta; também setas do teclado na pega).
      As camadas MapLibre de cada entrada do catálogo são as do viz.js: «iprv-<id>-<sufixo>» (-r, -lzr, -f, -l, -c, -t,
      -q ...), fonte «iprv-<id>». A ordem só é imposta depois de o utilizador arrastar pela primeira vez (até lá fica a ordem
      do viz.js, por categoria); é guardada neste navegador e reaplicada quando o viz.js volta a criar as camadas.
      Deslizador de transparência (opacidade) por camada, com a mesma regra por tipo do mudarOpacidade do viz.js; quando a
      linha da camada está aberta na árvore, o deslizador da árvore acompanha (e vice-versa). Guardado neste navegador.
      Menu de clique direito (toque longo no iPad; também botão «...»): Ir para, Propriedades, Exportar.
      Exportar sem servidor: GeoJSON dos elementos visíveis (camadas vectoriais; fontes GeoJSON com a geometria completa,
      mosaicos vectoriais com a geometria desenhada); camadas raster e WMS: o endereço do serviço para abrir no QGIS.
      Camadas «só consulta» (licença) e ficheiros privados (Base Cartográfica, entregas) não mostram endereço.
   2. Reportes do técnico Bernardo:
      17048 Contador do número de camadas ligadas sempre visível ao fazer scroll (barra fixa no topo da zona que rola;
            repete o texto do rodapé da árvore, que fica onde está).
      16456 Acumulação de fluxo quase invisível (mapa 15896): o viz.js e o app.js desenham-na com opacidade 0,45 e a rampa
            começa em #c6dbef. Ao ligar, só nessa camada: raster mais opaco e mais escuro (brilho máximo 0,72, contraste);
            se vier em linhas, linha azul-escura e mais grossa.
      16462 Bacias diferentes com a mesma cor: a correcção d542d64 colore pelo rótulo (A1, A2 ... B1) com 4 cores em ciclo
            ((letra x 10 + número) mod 4), por isso A1, A5, A9 ou A3 e B1 repetem cor, e bacias vizinhas podem ficar iguais.
            Aqui, ao ligar «Bacias hidrográficas» da Base, lêem-se as bacias, calcula-se quem toca em quem e pinta-se com 8
            cores de modo que vizinhas nunca fiquem iguais (fill-color por rótulo). */
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
    var g = lerJ(K_OP, {}); if (typeof g[id] === "number") return g[id];
    var s = opDaArvore(id); if (s) return (+s.value || 100) / 100;
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
  function temOpacidade(id) { var e = entrada(id); return !(e && (e.fundo || e.t === "aoi")) && id !== "aoi"; }
  function mudarOp(id, o, deArvore) {
    var M = mapa(); if (!M) return;
    var g = lerJ(K_OP, {}); g[id] = Math.round(o * 100) / 100; gravar(K_OP, JSON.stringify(g));
    if (!deArvore) {
      // A árvore do viz.js guarda a opacidade dela (S[id].op), que usa ao recriar a camada: acompanha-se pelo próprio deslizador.
      var s = opDaArvore(id);
      if (s) { B.emitir = 1; try { s.value = String(Math.max(+s.min || 10, Math.round(o * 100))); s.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {} B.emitir = 0; }
      aplicarOp(M, id, o);
    }
  }

  // ---------- 16456 acumulação ----------
  var RE_ACUM = /^(iprv-l_acumulacao|ipe-am-acumulacao)(-|$)/;
  function corrigirAcumulacao(M, lid) {
    try {
      var r = M.getLayer(lid); if (!r) return;
      var g = lerJ(K_OP, {}), op = typeof g.l_acumulacao === "number" ? g.l_acumulacao : 0.9;
      if (r.type === "raster") {
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
  function rotulo(p) { p = p || {}; var v = p.label != null ? p.label : (p.LABEL != null ? p.LABEL : p.rotulo); return v == null ? null : String(v); }
  function coresBacias(feats) {
    var CEL = 0.0002, cel = {}, lista = {};
    feats.forEach(function (f) {
      var lb = rotulo(f && f.properties); if (lb == null || !f.geometry) return;
      lista[lb] = 1;
      (function andar(c) {
        if (!c || !c.length) return;
        if (typeof c[0] === "number") { var k = Math.round(c[0] / CEL) + ":" + Math.round(c[1] / CEL); (cel[k] = cel[k] || {})[lb] = 1; return; }
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
  function corrigirBacias(M, lid) {
    try {
      var r = M.getLayer(lid); if (!r) return;
      var src = r.source, sl = r.sourceLayer || r["source-layer"];
      var pintar = function (feats) {
        if (!feats || !feats.length) return false;
        var c = coresBacias(feats), k = Object.keys(c.cor); if (k.length < 2) return false;
        var ex = ["match", ["to-string", ["coalesce", ["get", "label"], ["get", "LABEL"], ["get", "rotulo"], ""]]];
        k.forEach(function (r) { ex.push(r, CORES_BAC[c.cor[r] % CORES_BAC.length]); });
        ex.push(CORES_BAC[0]);
        if (!M.getLayer(lid)) return false;
        M.setPaintProperty(lid, "fill-color", ex);
        W.__iprCqBacias = c; // para diagnóstico
        return true;
      };
      lerDados(M, src).then(function (d) {
        if (d && d.features) { pintar(d.features); return; }
        // Mosaicos vectoriais (PMTiles): só se conhecem as bacias já carregadas; volta a pintar quando chegam mais.
        var t = null, ultimo = -1;
        var tentar = function () {
          try {
            if (!M.getLayer(lid)) { M.off("idle", tentar); return; }
            var f = M.querySourceFeatures(src, sl ? { sourceLayer: sl } : {});
            if (f.length !== ultimo) { ultimo = f.length; pintar(f); }
          } catch (e) {}
        };
        M.on("idle", tentar); tentar();
      }).catch(function () {});
    } catch (e) {}
  }

  // ---------- estado ----------
  var B = { emitir: 0, M: null, vistos: {}, sec: null, lista: null, cont: null, menu: null, dlg: null, arrastar: null, assin: "", tRef: 0 };

  function activasOrdenadas(M, V) {
    var act = []; try { act = (V.activas() || []).slice(); } catch (e) {}
    act = act.filter(function (id) { return !ehFundo(id); });
    var L = estiloCamadas(M), qual = dono(act), topo = {};
    for (var i = 0; i < L.length; i++) { var d = qual(L[i].id); if (d) topo[d] = i; }
    // ordem actual de desenho, de cima para baixo; as que ainda não têm camadas (a carregar) ficam no topo
    var ordem = act.slice().sort(function (a, b) { return (topo[b] == null ? 1e9 : topo[b]) - (topo[a] == null ? 1e9 : topo[a]); });
    var g = lerJ(K_ORDEM, null);
    if (g && g.length) {
      var dentro = g.filter(function (id) { return act.indexOf(id) >= 0; });
      ordem.forEach(function (id, i) {
        if (dentro.indexOf(id) >= 0) return;
        // camada nova: entra junto da vizinha de cima na ordem actual, ou no topo
        var pos = 0;
        for (var j = i - 1; j >= 0; j--) { var k = dentro.indexOf(ordem[j]); if (k >= 0) { pos = k + 1; break; } }
        dentro.splice(pos, 0, id);
      });
      return { ordem: dentro, imposta: true, act: act };
    }
    return { ordem: ordem, imposta: false, act: act };
  }

  function impor(M, ordem) {
    var L = estiloCamadas(M), qual = dono(ordem), seq = [], geridas = [];
    for (var i = 0; i < L.length; i++) { var d = qual(L[i].id); if (d) { geridas.push(L[i].id); if (seq[seq.length - 1] !== d) seq.push(d); } }
    var desejada = ordem.slice().reverse().filter(function (id) { return seq.indexOf(id) >= 0; });
    if (seq.join("\n") === desejada.join("\n")) return;
    var ultima = geridas[geridas.length - 1], idx = -1, ancora;
    for (i = 0; i < L.length; i++) if (L[i].id === ultima) idx = i;
    var conj = {}; geridas.forEach(function (g) { conj[g] = 1; });
    for (i = idx + 1; i < L.length; i++) if (!conj[L[i].id]) { ancora = L[i].id; break; }
    desejada.forEach(function (id) {
      camadasDe(id, L).forEach(function (lid) { try { M.moveLayer(lid, ancora); } catch (e) {} });
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
    "#ipr-cq .ipr-cq-it.fixa .ipr-cq-pega{visibility:hidden}" +
    "#ipr-cq .ipr-cq-pega{width:40px;height:40px;border:0;background:none;color:var(--mu,#6b6f5c);cursor:grab;touch-action:none;display:flex;align-items:center;justify-content:center;padding:0}" +
    "#ipr-cq .ipr-cq-pega:active{cursor:grabbing}#ipr-cq .ipr-cq-pega svg{width:16px;height:16px}" +
    "#ipr-cq .ipr-cq-n{min-width:0;font-size:13px;line-height:1.25;padding:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ipr-cq .ipr-cq-n small{display:block;font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis}" +
    "#ipr-cq .ipr-cq-mais{width:40px;height:40px;border:0;background:none;color:var(--tx,#222);font-size:18px;line-height:1;cursor:pointer;border-radius:4px}" +
    "#ipr-cq .ipr-cq-mais:hover{background:var(--p3,#f4f2ea)}" +
    "#ipr-cq .ipr-cq-op{grid-column:2/4;display:flex;align-items:center;gap:8px;font:11px var(--mono,monospace);color:var(--mu2,#737761);padding-right:8px}" +
    "#ipr-cq .ipr-cq-op input{flex:1;min-width:0;height:28px;accent-color:var(--ac,#75834a)}#ipr-cq .ipr-cq-op output{width:38px;text-align:right}" +
    "#ipr-cq .ipr-cq-vazio{padding:10px 12px;font-size:12px;opacity:.75}" +
    "#ipr-cq .ipr-cq-rod{display:flex;justify-content:flex-end;padding:0 8px 6px}" +
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
      '<div class="ipr-cq-c"><ul class="ipr-cq-l" role="list"></ul><div class="ipr-cq-rod"><button type="button" class="ipr-cq-repor" hidden></button></div></div>';
    esq.insertBefore(s, cam);
    B.sec = s; B.lista = s.querySelector(".ipr-cq-l");
    s.querySelector(".ipr-cq-h").addEventListener("click", function () {
      var f = s.classList.toggle("fech"); this.setAttribute("aria-expanded", String(!f)); gravar(K_ABERTO, f ? "0" : "1");
    });
    s.querySelector(".ipr-cq-repor").addEventListener("click", function () {
      gravar(K_ORDEM, null); B.assin = ""; refrescar();
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
    rp.hidden = !(lerJ(K_ORDEM, null) || []).length;
  }

  function linha(id, fixa) {
    var e = entrada(id), M = mapa(), op = temOpacidade(id) && M ? opLida(M, id) : null;
    var g = e && W.IPRViz && W.IPRViz.grupos ? (W.IPRViz.grupos.filter(function (x) { return x.id === e.g; })[0] || {}).nome : "";
    var sub = e ? ((en() && e.subEn) || e.sub || g || "") : "";
    return '<li class="ipr-cq-it' + (fixa ? " fixa" : "") + '" data-id="' + esc(id) + '">' +
      '<button type="button" class="ipr-cq-pega" aria-label="' + esc(T("Arrastar para mudar a ordem: ", "Drag to reorder: ") + nomeDe(e, id)) + '"' + (fixa ? ' tabindex="-1" disabled' : "") + ">" + PEGA + "</button>" +
      '<span class="ipr-cq-n" title="' + esc(nomeDe(e, id)) + '">' + esc(nomeDe(e, id)) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" +
      '<button type="button" class="ipr-cq-mais" aria-haspopup="menu" aria-label="' + esc(T("Opções de ", "Options for ") + nomeDe(e, id)) + '">&#8943;</button>' +
      (op != null ? '<label class="ipr-cq-op"><span>' + esc(T("Opacidade", "Opacity")) + '</span><input type="range" min="0" max="100" step="1" value="' + Math.round(op * 100) + '" aria-label="' + esc(T("Opacidade de ", "Opacity of ") + nomeDe(e, id)) + '"><output>' + Math.round(op * 100) + " %</output></label>" : "") +
      "</li>";
  }

  function desenharLista(ordem, fundos) {
    if (!B.lista) return;
    var h = ordem.map(function (id) { return linha(id, false); }).join("") + fundos.map(function (id) { return linha(id, true); }).join("");
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
      var assin = r.ordem.join("|") + "#" + fundos.join("|") + "#" + (en() ? "en" : "pt");
      if (assin !== B.assin && !B.arrastar) { B.assin = assin; desenharLista(r.ordem, fundos); }
      textoCabecalho(r.ordem.length);
      contador(r.act.filter(function (id) { return id !== "aoi"; }).length);
    } catch (e) {}
  }
  function agendar() { clearTimeout(B.tRef); B.tRef = setTimeout(refrescar, 180); }

  // ---------- arrastar, menu, toque longo ----------
  function idDe(el) { var li = el && el.closest && el.closest(".ipr-cq-it"); return li ? li.getAttribute("data-id") : null; }
  function gravarOrdemDoDom() {
    var ids = [].map.call(B.lista.querySelectorAll(".ipr-cq-it:not(.fixa)"), function (li) { return li.getAttribute("data-id"); });
    gravar(K_ORDEM, JSON.stringify(ids));
    var M = mapa(); if (M) impor(M, ids);
    textoCabecalho(ids.length);
  }
  function ligarLista() {
    var L = B.lista, sup = 0;
    L.addEventListener("pointerdown", function (ev) {
      var pega = ev.target.closest(".ipr-cq-pega");
      var li = ev.target.closest(".ipr-cq-it");
      if (!li) return;
      if (pega && !li.classList.contains("fixa")) {
        ev.preventDefault();
        try { pega.setPointerCapture(ev.pointerId); } catch (e) {}
        B.arrastar = { li: li, y: ev.clientY, pid: ev.pointerId, mexeu: false };
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
      a.mexeu = true;
      var irmaos = [].slice.call(L.querySelectorAll(".ipr-cq-it:not(.fixa)"));
      var i = irmaos.indexOf(a.li);
      var acima = irmaos[i - 1], abaixo = irmaos[i + 1];
      if (acima) { var ra = acima.getBoundingClientRect(); if (ev.clientY < ra.top + ra.height / 2) { L.insertBefore(a.li, acima); } }
      if (abaixo) { var rb = abaixo.getBoundingClientRect(); if (ev.clientY > rb.top + rb.height / 2) { L.insertBefore(a.li, abaixo.nextSibling); } }
      var C = B.sec.querySelector(".ipr-cq-c"), rc = C.getBoundingClientRect();
      if (ev.clientY < rc.top + 24) C.scrollTop -= 12; else if (ev.clientY > rc.bottom - 24) C.scrollTop += 12;
    });
    var fim = function (ev) {
      var a = B.arrastar; if (!a || ev.pointerId !== a.pid) return;
      a.li.classList.remove("arr"); B.arrastar = null;
      if (a.mexeu) gravarOrdemDoDom();
      B.assin = ""; agendar();
    };
    L.addEventListener("pointerup", fim); L.addEventListener("pointercancel", fim);
    L.addEventListener("keydown", function (ev) {
      var pega = ev.target.closest(".ipr-cq-pega"); if (!pega) return;
      var li = pega.closest(".ipr-cq-it");
      if (ev.key === "ArrowUp" && li.previousElementSibling) { L.insertBefore(li, li.previousElementSibling); }
      else if (ev.key === "ArrowDown" && li.nextElementSibling && !li.nextElementSibling.classList.contains("fixa")) { L.insertBefore(li.nextElementSibling, li); }
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
      var id = idDe(s), v = (+s.value || 0) / 100; var o = s.parentNode.querySelector("output"); if (o) o.textContent = s.value + " %";
      mudarOp(id, v, false);
    });
  }
  // deslizador da árvore do viz.js -> esta lista
  D.addEventListener("input", function (ev) {
    try {
      var s = ev.target; if (!s || !s.classList || !s.classList.contains("ipr-op") || !s.closest("#ipe-cam")) return;
      if (B.emitir) return; // o próprio eco desta lista
      var li = s.closest(".ipr-it"), id = li && li.getAttribute("data-id"); if (!id) return;
      mudarOp(id, (+s.value || 0) / 100, true);
      var m = B.lista && B.lista.querySelector('.ipr-cq-it[data-id="' + (W.CSS && CSS.escape ? CSS.escape(id) : id) + '"] .ipr-cq-op');
      if (m) { m.querySelector("input").value = s.value; m.querySelector("output").textContent = s.value + " %"; }
    } catch (e) {}
  }, true);

  function fecharMenu() { if (B.menu) { try { B.menu.remove(); } catch (e) {} B.menu = null; } }
  function abrirMenu(id, x, y) {
    fecharMenu(); if (!id) return;
    var m = D.createElement("div"); m.className = "ipr-cq-menu"; m.setAttribute("role", "menu");
    m.innerHTML = '<button type="button" role="menuitem" data-a="ir">' + esc(T("Ir para", "Zoom to")) + "</button>" +
      '<button type="button" role="menuitem" data-a="prop">' + esc(T("Propriedades", "Properties")) + "</button>" +
      '<button type="button" role="menuitem" data-a="exp">' + esc(T("Exportar", "Export")) + "</button>";
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
    if (!e || SEM_URL[e.t] || e.lic === "r") return null;
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
    try { ligarMapa(); if (B.M) refrescar(); } catch (e) {}
    voltas++;
    setTimeout(esperar, voltas < 120 ? 500 : 3000); // o Atlas pode recriar o mapa (troca de terreno): verifica-se de vez em quando
  })();
  W.addEventListener("ipr:lingua", function () { B.assin = ""; agendar(); });
  W.addEventListener("resize", agendar);
})();
