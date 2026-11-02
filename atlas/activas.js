/* IPR Atlas · activas.js (02/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Pedido de um cliente (Calvin): «the active layer tabs can get confusing and overwhelming. There are a lot of tabs and
   settings which can make the map look complicated and messy». Três melhorias aprovadas pelo Nuno:
   1. Fichas das camadas ligadas fechadas por omissão. No painel «Camadas ligadas» (#ipr-cq, do camadas-qgis.js) cada
      camada passa a ser uma linha: pega, legenda curta (cor), nome, olho (ver/esconder sem desligar), ⚙ e remover (×).
      O ⚙ abre e fecha a ficha, que mostra tudo o que já lá estava (subtítulo, opacidade, menu «⋯» com Ir para,
      Propriedades e Exportar). Nada é retirado: só fica atrás do ⚙. O clique direito e o toque longo continuam a abrir o
      menu, e a pega continua a mudar a ordem.
      Quem tem window.IPR_PERFIL.modo === "avancado" vê as fichas abertas, como antes. A escolha de cada camada (aberta ou
      fechada) fica lembrada neste navegador (localStorage, em try/catch).
      «Limpar mapa»: desliga todas as camadas ligadas menos o fundo e o terreno / a Base do próprio cliente, depois de
      uma confirmação na própria barra (sem alert nem confirm do navegador). Há «Desfazer».
   2. «Vistas»: combinações prontas (Água, Relevo e declives, Condicionantes, Fogo, Solo e ocupação). Cada vista desliga o
      que está ligado (menos fundo e terreno próprio), liga 3 ou 4 camadas do catálogo com opacidades pensadas para
      funcionarem juntas e mostra uma frase simples sobre o que se está a ver. Há «Desfazer».
      As definições estão logo abaixo, em VISTAS: é uma PROPOSTA para o Nuno rever. O site pode substituí-las sem novo
      commit com window.IPR_VISTAS (mesmo formato).
   3. «Explique-me este mapa», discreto: abre o assistente na Leitura Territorial (window.iprAssistenteComprar("leitura"),
      o mesmo caminho do cartão do comprar.js); se o assistente não existir, vai para a página da Leitura no site.
   Línguas: pt, en e es (o Atlas usa window.IPR_LINGUA, posto pelo ajustes.js, e o evento «ipr:lingua»; o es fica pronto
   para /es/atlas/ ou IPR_LINGUA === "es").
   Desliga-se com ?activas=0 ou localStorage ipr_activas_off=1. Cada parte falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document, NOME = "activas";
  try {
    if (new URLSearchParams(location.search).get(NOME) === "0") return;
    if (localStorage.getItem("ipr_" + NOME + "_off") === "1") return;
  } catch (e) {}
  if (W.__iprActivas) return;
  W.__iprActivas = 1;

  // =====================================================================================================================
  // VISTAS · PROPOSTA PARA O NUNO REVER
  // camadas: [id do catálogo do Atlas (IPRViz.catalogo), opacidade 0,1 a 1]. Ids que não existam ou não liguem (por
  // exemplo, camadas da Base sem Base) são saltados em silêncio; nesse caso junta-se a frase «semBase», se houver.
  // =====================================================================================================================
  var VISTAS = [
    {
      id: "agua",
      nome: { pt: "Água", en: "Water", es: "Agua" },
      camadas: [["r_somb", 0.45], ["bacias", 0.3], ["hidro", 1], ["inund", 0.6]],
      frase: {
        pt: "Linhas de água, bacias hidrográficas e zonas que podem inundar, sobre o relevo. Mostra para onde corre a água e onde se junta.",
        en: "Streams, river basins and flood-prone areas over the terrain relief. Shows where water flows and where it gathers.",
        es: "Cauces, cuencas hidrográficas y zonas inundables sobre el relieve. Muestra hacia dónde corre el agua y dónde se acumula."
      }
    },
    {
      id: "relevo",
      nome: { pt: "Relevo e declives", en: "Relief and slopes", es: "Relieve y pendientes" },
      camadas: [["r_hipso", 0.45], ["r_somb", 0.6], ["r_curvas", 0.85], ["l_declives", 0.6]],
      frase: {
        pt: "Altitude em cores, sombra do relevo e curvas de nível. Quanto mais juntas as curvas, mais inclinado é o terreno.",
        en: "Elevation in colour, hillshade and contour lines. The closer the contours, the steeper the ground.",
        es: "Altitud en colores, sombreado del relieve y curvas de nivel. Cuanto más juntas las curvas, más inclinado es el terreno."
      },
      semBase: {
        pt: "Os declives em classes vêm com a Base Cartográfica do terreno.",
        en: "Slope classes come with the plot's Cartographic Base.",
        es: "Las pendientes por clases vienen con la Base Cartográfica del terreno."
      }
    },
    {
      id: "condicionantes",
      nome: { pt: "Condicionantes", en: "Constraints", es: "Condicionantes" },
      camadas: [["ren", 0.45], ["ran", 0.45], ["n2k", 0.4], ["dph", 0.6]],
      frase: {
        pt: "Restrições legais ao uso do solo: REN, RAN, Rede Natura 2000 e domínio público hídrico. Onde há cor pode haver limites ao que se constrói ou planta.",
        en: "Legal land-use constraints: REN (ecological reserve), RAN (agricultural reserve), Natura 2000 and public water domain. Coloured areas may limit what can be built or planted.",
        es: "Restricciones legales al uso del suelo: REN, RAN, Red Natura 2000 y dominio público hidráulico. Donde hay color puede haber límites a lo que se construye o planta."
      }
    },
    {
      id: "fogo",
      nome: { pt: "Fogo", en: "Fire", es: "Fuego" },
      camadas: [["perig_e", 0.55], ["ard15", 0.5], ["redeprim", 0.8]],
      frase: {
        pt: "Perigo de incêndio para os próximos anos, áreas que arderam desde 2015 e faixas da rede primária de gestão de combustível.",
        en: "Wildfire hazard for the coming years, areas burnt since 2015 and the primary fuel-break network.",
        es: "Peligro de incendio para los próximos años, áreas quemadas desde 2015 y fajas de la red primaria de gestión de combustible."
      }
    },
    {
      id: "solo",
      nome: { pt: "Solo e ocupação", en: "Soil and land cover", es: "Suelo y ocupación" },
      camadas: [["sroa", 0.4], ["cos23", 0.5], ["swf21", 0.8]],
      frase: {
        pt: "Aptidão do solo para cultivo (SROA), o que cobre o terreno hoje (COS 2023) e as árvores isoladas e sebes.",
        en: "Soil capability for farming (SROA), what covers the land today (COS 2023) and isolated trees and hedgerows.",
        es: "Aptitud del suelo para el cultivo (SROA), lo que cubre el terreno hoy (COS 2023) y los árboles aislados y setos."
      }
    }
  ];

  // ---------- textos ----------
  var TX = {
    pt: {
      vistas: "Vistas", vistasT: "Combinações prontas de camadas", limpar: "Limpar mapa", explicar: "Explique-me este mapa",
      explicarT: "Leitura Territorial: um técnico explica o que o mapa mostra para o seu terreno",
      conf: "Desligar {n} camadas? Ficam o fundo, os nomes dos lugares e o seu terreno.", conf1: "Desligar 1 camada? Ficam o fundo, os nomes dos lugares e o seu terreno.",
      sim: "Limpar", nao: "Cancelar", nada: "Não há camadas para desligar.", limpo: "Mapa limpo: {n} camadas desligadas.",
      desfazer: "Desfazer", fechar: "Fechar", vista: "Vista", ajustes: "Ajustes de ", ver: "Ver ", esconder: "Esconder ",
      remover: "Desligar ", aCarregar: "A carregar as camadas…"
    },
    en: {
      vistas: "Views", vistasT: "Ready-made layer combinations", limpar: "Clear map", explicar: "Explain this map to me",
      explicarT: "Territorial Reading: a specialist explains what the map shows for your plot",
      conf: "Switch off {n} layers? The base map, place names and your plot stay.", conf1: "Switch off 1 layer? The base map, place names and your plot stay.",
      sim: "Clear", nao: "Cancel", nada: "There are no layers to switch off.", limpo: "Map cleared: {n} layers switched off.",
      desfazer: "Undo", fechar: "Close", vista: "View", ajustes: "Settings for ", ver: "Show ", esconder: "Hide ",
      remover: "Switch off ", aCarregar: "Loading layers…"
    },
    es: {
      vistas: "Vistas", vistasT: "Combinaciones de capas listas", limpar: "Limpiar mapa", explicar: "Explíqueme este mapa",
      explicarT: "Lectura Territorial: un técnico explica lo que el mapa muestra de su terreno",
      conf: "¿Apagar {n} capas? Se mantienen el fondo, los topónimos y su terreno.", conf1: "¿Apagar 1 capa? Se mantienen el fondo, los topónimos y su terreno.",
      sim: "Limpiar", nao: "Cancelar", nada: "No hay capas para apagar.", limpo: "Mapa limpio: {n} capas apagadas.",
      desfazer: "Deshacer", fechar: "Cerrar", vista: "Vista", ajustes: "Ajustes de ", ver: "Mostrar ", esconder: "Ocultar ",
      remover: "Apagar ", aCarregar: "Cargando las capas…"
    }
  };
  function lingua() {
    var l = String(W.IPR_LINGUA || "").toLowerCase();
    if (l === "es" || /^\/es(\/|$)/.test(location.pathname) || /^es/i.test(D.documentElement.lang || "")) return "es";
    if (l) return l === "pt" ? "pt" : "en";
    return /^pt/i.test(D.documentElement.lang || "pt") ? "pt" : "en";
  }
  function t(k, v) {
    var s = (TX[lingua()] || TX.pt)[k]; if (s == null) s = TX.pt[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function tl(o) { if (!o) return ""; var l = lingua(); return o[l] || o.en || o.pt || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- utilitários ----------
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function lerJ(k, d) { try { var v = JSON.parse(ler(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  var K_FICHAS = "ipr_activas_fichas", K_OP = "ipr_cq_op"; // K_OP: o mesmo registo de opacidades do camadas-qgis.js
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa ? i.mapa : null; }
  function viz() { var i = ipe(); return i && i.viz ? i.viz : null; }
  function catalogo() { return (W.IPRViz && W.IPRViz.catalogo) || []; }
  function entrada(id) { var c = catalogo(); for (var i = 0; i < c.length; i++) if (c[i] && c[i].id === id) return c[i]; return null; }
  function activas() { try { var V = viz(); return V && V.activas ? (V.activas() || []).slice() : []; } catch (e) { return []; } }
  function ligar(id, on) { try { var V = viz(); if (V && V.ligar) V.ligar(id, on !== false); } catch (e) {} }
  function avancado() { var p = W.IPR_PERFIL; return !!(p && p.modo === "avancado"); }
  function ehFundo(id) { var e = entrada(id); return id === "f_sub" || !!(e && e.fundo); }
  // O que «Limpar mapa» e as vistas nunca desligam: fundos, a toponímia, o terreno do cliente (aoi, grupo «meus», entradas fixas) e a
  // Base Cartográfica (camadas l_*, tipo «lidar», que o app.js liga com a Base do terreno aberto).
  function fica(id) {
    // o_nomes: o ajustes.js mantém a toponímia sempre presente (volta a ligá-la), por isso também fica
    if (ehFundo(id) || id === "aoi" || id === "o_nomes") return true;
    var e = entrada(id);
    return !!(e && (e.t === "aoi" || e.g === "meus" || e.fixo || e.t === "lidar")) || /^l_/.test(id);
  }
  function camadasDe(M, id) {
    var p = "iprv-" + id + "-", r = [], L = [];
    try { L = (M.getStyle() || {}).layers || []; } catch (e) {}
    for (var i = 0; i < L.length; i++) if (L[i].id.indexOf(p) === 0 || L[i].id === "iprv-" + id) r.push(L[i].id);
    return r;
  }
  function nomeDe(id) { var e = entrada(id); if (!e) return id; return (lingua() !== "pt" && (e.en || e.nEn)) || e.n || id; }

  // ---------- opacidade (mesma regra do camadas-qgis.js / mudarOpacidade do viz.js) ----------
  function aplicarOp(M, id, o) {
    var e = entrada(id) || {};
    camadasDe(M, id).forEach(function (a) {
      try {
        var r = M.getLayer(a); if (!r) return;
        var ty = r.type;
        if (ty === "raster") M.setPaintProperty(a, "raster-opacity", o);
        else if (ty === "fill") { if (!/-q$/.test(a)) M.setPaintProperty(a, "fill-opacity", o); }
        else if (ty === "fill-extrusion") M.setPaintProperty(a, "fill-extrusion-opacity", o);
        else if (ty === "line") M.setPaintProperty(a, "line-opacity", Math.min(1, e.t === "mvt" && e.e && e.e.tipo === "fill" ? o + 0.3 : o));
        else if (ty === "circle") M.setPaintProperty(a, "circle-opacity", o);
        else if (ty === "hillshade") M.setPaintProperty(a, "hillshade-exaggeration", 0.5 * o + 0.1);
        else if (ty === "symbol") M.setPaintProperty(a, "text-opacity", o);
      } catch (x) {}
    });
  }
  function opNaLista(id, o) {
    try {
      var li = D.querySelector('#ipr-cq .ipr-cq-it[data-id="' + (W.CSS && CSS.escape ? CSS.escape(id) : id) + '"] .ipr-cq-op');
      if (li) { var v = String(Math.max(10, Math.round(o * 100))); li.querySelector("input").value = v; li.querySelector("output").textContent = v + " %"; }
    } catch (e) {}
  }

  // ---------- olho: esconder sem desligar (visibility das camadas MapLibre «iprv-<id>-*»; o viz.js não mexe nela) ----------
  var ESC = {};
  function aplicarVis(M, id) {
    var v = ESC[id] ? "none" : "visible";
    camadasDe(M, id).forEach(function (a) {
      try { if ((M.getLayoutProperty(a, "visibility") || "visible") !== v) M.setLayoutProperty(a, "visibility", v); } catch (e) {}
    });
  }
  var tVis = 0;
  function reaplicarVis() {
    clearTimeout(tVis);
    tVis = setTimeout(function () {
      var M = mapa(); if (!M) return;
      var act = activas();
      Object.keys(ESC).forEach(function (id) { if (act.indexOf(id) < 0) { delete ESC[id]; return; } aplicarVis(M, id); });
    }, 60);
  }

  // ---------- legenda curta (uma cor) ----------
  var RE_COR = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i;
  function primeiraCor(v) {
    if (typeof v === "string") return RE_COR.test(v.trim()) ? v.trim() : null;
    if (Array.isArray(v)) {
      // numa expressão «match»/«step»/«interpolate» a primeira cor é uma das classes: chega para a legenda curta
      for (var i = 1; i < v.length; i++) { var c = primeiraCor(v[i]); if (c) return c; }
    }
    return null;
  }
  function corDaLegenda(id) {
    // a legenda do Atlas (#ipr-lgd) escreve as entradas pelo nome da camada
    try {
      var n = (entrada(id) || {}).n; if (!n) return null;
      var it = D.querySelectorAll("#ipr-lgd .one, #ipr-lgd .l");
      for (var i = 0; i < it.length; i++) {
        var sp = it[i].querySelector(":scope > span, :scope > b"); if (!sp) continue;
        var tx = (sp.firstChild && sp.firstChild.nodeType === 3 ? sp.firstChild.nodeValue : sp.textContent || "").trim();
        if (tx && (n === tx || n.indexOf(tx + " (") === 0 || n.indexOf(tx + " ·") === 0)) {
          var s = it[i].querySelector("s"); if (s && s.style.background) return { cor: s.style.background, rampa: it[i].classList.contains("rampa") };
        }
      }
    } catch (e) {}
    return null;
  }
  function legendaCurta(id) {
    var M = mapa(); if (!M) return null;
    var ls = camadasDe(M, id), alt = null;
    for (var i = 0; i < ls.length; i++) {
      try {
        var r = M.getLayer(ls[i]); if (!r) continue;
        var p = { fill: "fill-color", line: "line-color", circle: "circle-color", "fill-extrusion": "fill-extrusion-color" }[r.type];
        if (p) { var c = primeiraCor(M.getPaintProperty(ls[i], p)); if (c) { if (r.type === "fill") return { cor: c }; if (!alt) alt = { cor: c, linha: r.type === "line" }; } }
      } catch (e) {}
    }
    return alt || corDaLegenda(id);
  }

  // ---------- ícones ----------
  var SVG = function (p) { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + "</svg>"; };
  var I_OLHO = SVG('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>');
  var I_OLHO_N = SVG('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.3 6.3C3.7 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.7-1.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
  var I_ENG = SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>');
  var I_X = SVG('<path d="M6 6l12 12M18 6 6 18"/>');
  var I_VISTAS = SVG('<path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="m3 14 9 5 9-5"/>');
  var I_LIMPAR = SVG('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>');
  var I_AJUDA = SVG('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.8"/><path d="M12 17h.01"/>');

  // ---------- estilos ----------
  var CSS_TXT =
    // linha compacta: pega | nome (com a cor) | olho ⚙ × | ⋯ (só com a ficha aberta); a ficha ocupa a largura toda
    "#ipr-cq.iac .ipr-cq-it{grid-template-columns:26px minmax(0,1fr) auto auto;padding:0 2px 0 0;min-height:38px}" +
    "#ipr-cq.iac .ipr-cq-pega{width:26px;height:38px}" +
    "#ipr-cq.iac .ipr-cq-n{display:flex;align-items:center;gap:7px;padding:2px 0;flex-wrap:wrap}" +
    "#ipr-cq.iac .ipr-cq-n .iac-nt{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ipr-cq.iac .ipr-cq-n small{flex:1 1 100%;margin-left:0}" +
    "#ipr-cq.iac .ipr-cq-it:not(.iac-ab) .ipr-cq-n small,#ipr-cq.iac .ipr-cq-it:not(.iac-ab) .ipr-cq-op,#ipr-cq.iac .ipr-cq-it:not(.iac-ab) .ipr-cq-mais{display:none}" +
    "#ipr-cq.iac .ipr-cq-op{grid-column:1/-1;padding:0 10px 6px 26px}" +
    "#ipr-cq.iac .ipr-cq-it.iac-ab{background:var(--p2,#f7f5ee)}" +
    "#ipr-cq.iac .ipr-cq-mais{width:34px;height:34px}" +
    "#ipr-cq .iac-sw{flex:none;width:12px;height:12px;border-radius:2px;border:1px solid rgba(0,0,0,.25);box-sizing:border-box}" +
    "#ipr-cq .iac-sw.ln{height:4px;border-radius:2px;border:0}#ipr-cq .iac-sw.rp{background-image:linear-gradient(90deg,#3d8a3d,#c8e06a,#b07a3c)!important}" +
    "#ipr-cq .iac-ctl{display:flex;align-items:center}" +
    "#ipr-cq .iac-b{width:30px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:none;color:var(--mu,#6b6f5c);cursor:pointer;padding:0}" +
    "#ipr-cq .iac-b:hover,#ipr-cq .iac-b:focus-visible{background:var(--p3,#f4f2ea);color:var(--tx,#222);outline:0}" +
    "#ipr-cq .iac-b[aria-expanded=true]{color:var(--ac2,#5f6b3a);background:var(--p3,#f4f2ea)}" +
    "#ipr-cq .iac-b.iac-off{visibility:hidden}" +
    "#ipr-cq .ipr-cq-it.iac-esc .ipr-cq-n{opacity:.45}#ipr-cq .ipr-cq-it.iac-esc .iac-olho{color:var(--ac2,#5f6b3a)}" +
    "@media (pointer:coarse){#ipr-cq .iac-b{width:38px;height:38px}#ipr-cq.iac .ipr-cq-pega{width:30px;height:42px}#ipr-cq.iac .ipr-cq-it{grid-template-columns:30px minmax(0,1fr) auto auto}}" +
    // barra: Vistas, Limpar mapa, Explique-me
    "#ipr-cq .iac-bar{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;padding:6px 8px 4px 10px}" +
    "#ipr-cq .iac-bt{display:inline-flex;align-items:center;gap:5px;min-height:32px;padding:0 9px;border:1px solid var(--ln2,#cfc9b4);border-radius:4px;background:none;color:var(--tx,#222);font:inherit;font-size:12px;cursor:pointer}" +
    "#ipr-cq .iac-bt:hover,#ipr-cq .iac-bt:focus-visible{border-color:var(--ac,#75834a);outline:0}" +
    "#ipr-cq .iac-bt[aria-expanded=true]{border-color:var(--ac,#75834a);color:var(--ac2,#5f6b3a)}" +
    "#ipr-cq .iac-bt svg{width:14px;height:14px}" +
    "#ipr-cq .iac-ex{display:inline-flex;align-items:center;gap:4px;margin-left:auto;min-height:32px;padding:0 2px;border:0;background:none;color:var(--ac2,#5f6b3a);font:inherit;font-size:11.5px;text-decoration:underline;text-underline-offset:2px;cursor:pointer;opacity:.85}" +
    "#ipr-cq .iac-ex:hover{opacity:1}#ipr-cq .iac-ex svg{width:13px;height:13px}" +
    "#ipr-cq .iac-vl{display:flex;flex-wrap:wrap;gap:4px;padding:2px 8px 6px 10px}#ipr-cq .iac-vl[hidden],#ipr-cq .iac-cx[hidden]{display:none}" +
    "#ipr-cq .iac-vl button{min-height:32px;padding:0 10px;border:1px solid var(--ln2,#cfc9b4);border-radius:16px;background:none;color:var(--tx,#222);font:inherit;font-size:12px;cursor:pointer}" +
    "#ipr-cq .iac-vl button:hover,#ipr-cq .iac-vl button:focus-visible,#ipr-cq .iac-vl button.on{border-color:var(--ac,#75834a);background:var(--acs,rgba(117,131,74,.14));outline:0}" +
    "#ipr-cq .iac-cx{margin:2px 8px 6px 10px;padding:8px 10px;border-left:3px solid var(--ac,#75834a);background:var(--p2,#f7f5ee);font-size:12px;line-height:1.4}" +
    "#ipr-cq .iac-cx p{margin:0 0 6px}#ipr-cq .iac-cx b{display:block;margin-bottom:2px}" +
    "#ipr-cq .iac-cx .iac-acc{display:flex;flex-wrap:wrap;gap:6px}" +
    "#ipr-cq .iac-cx .iac-acc button{min-height:30px;padding:0 10px;border:1px solid var(--ac,#75834a);border-radius:4px;background:none;color:var(--ac2,#5f6b3a);font:inherit;font-size:12px;cursor:pointer}" +
    "#ipr-cq .iac-cx .iac-acc button.pri{background:var(--ac,#75834a);color:#fff}";

  // ---------- estado ----------
  var S = { sec: null, bar: null, vl: null, cx: null, obs: null, vista: null, antes: null, tEsp: 0 };
  function prefs() { return lerJ(K_FICHAS, {}); }
  function aberta(id) { var p = prefs(); return typeof p[id] === "number" ? p[id] === 1 : avancado(); }
  function lembrar(id, ab) { var p = prefs(); p[id] = ab ? 1 : 0; gravar(K_FICHAS, JSON.stringify(p)); }

  // ---------- linhas ----------
  function decorar(li) {
    if (!li || !li.classList || !li.classList.contains("ipr-cq-it")) return;
    var id = li.getAttribute("data-id"); if (!id) return;
    var n = li.querySelector(".ipr-cq-n"); if (!n) return;
    if (!li.querySelector(".iac-ctl")) {
      // nome num span próprio para as reticências; a cor antes; o subtítulo (small) fica e só se vê com a ficha aberta
      if (!n.querySelector(".iac-nt")) {
        var nt = D.createElement("span"); nt.className = "iac-nt";
        var no = n.firstChild; while (no && !(no.nodeType === 1 && no.tagName === "SMALL")) { var nx = no.nextSibling; nt.appendChild(no); no = nx; }
        n.insertBefore(nt, n.firstChild);
      }
      var nome = nomeDe(id), fundo = ehFundo(id), terreno = id === "aoi" || ((entrada(id) || {}).t === "aoi");
      var c = D.createElement("span"); c.className = "iac-ctl";
      c.innerHTML =
        '<button type="button" class="iac-b iac-olho' + (fundo ? " iac-off" : "") + '"' + (fundo ? ' tabindex="-1" aria-hidden="true"' : "") + "></button>" +
        '<button type="button" class="iac-b iac-eng" aria-expanded="false" title="' + esc(t("ajustes") + nome) + '" aria-label="' + esc(t("ajustes") + nome) + '">' + I_ENG + "</button>" +
        '<button type="button" class="iac-b iac-rem' + (fundo || terreno ? " iac-off" : "") + '"' + (fundo || terreno ? ' tabindex="-1" aria-hidden="true"' : "") + ' title="' + esc(t("remover") + nome) + '" aria-label="' + esc(t("remover") + nome) + '">' + I_X + "</button>";
      n.parentNode.insertBefore(c, n.nextSibling);
    }
    estadoLinha(li, id);
    corLinha(li, id);
  }
  function estadoLinha(li, id) {
    var ab = aberta(id), nome = nomeDe(id);
    li.classList.toggle("iac-ab", ab);
    var g = li.querySelector(".iac-eng"); if (g) g.setAttribute("aria-expanded", String(ab));
    li.classList.toggle("iac-esc", !!ESC[id]);
    var o = li.querySelector(".iac-olho");
    if (o && !o.classList.contains("iac-off")) {
      var r = (ESC[id] ? t("ver") : t("esconder")) + nome;
      o.innerHTML = ESC[id] ? I_OLHO_N : I_OLHO; o.title = r; o.setAttribute("aria-label", r); o.setAttribute("aria-pressed", String(!ESC[id]));
    }
  }
  function corLinha(li, id) {
    var n = li.querySelector(".ipr-cq-n"); if (!n) return;
    var sw = n.querySelector(".iac-sw");
    if (sw && sw.getAttribute("data-ok") === "1") return;
    if (ehFundo(id)) return;
    var l = legendaCurta(id); if (!l) return;
    if (!sw) { sw = D.createElement("i"); sw.setAttribute("aria-hidden", "true"); n.insertBefore(sw, n.firstChild); }
    sw.className = "iac-sw" + (l.linha ? " ln" : "") + (l.rampa ? " rp" : "");
    sw.style.background = l.cor; sw.setAttribute("data-ok", "1");
  }
  function decorarTudo() {
    if (!S.sec) return;
    [].forEach.call(S.sec.querySelectorAll(".ipr-cq-l > .ipr-cq-it"), decorar);
  }

  // ---------- barra ----------
  function montar() {
    var sec = D.getElementById("ipr-cq");
    if (!sec) return false;
    if (!D.getElementById("ipr-activas-css")) { var st = D.createElement("style"); st.id = "ipr-activas-css"; st.textContent = CSS_TXT; D.head.appendChild(st); }
    if (S.sec === sec && S.bar && S.bar.isConnected) return true;
    S.sec = sec; sec.classList.add("iac");
    var c = sec.querySelector(".ipr-cq-c"), ul = sec.querySelector(".ipr-cq-l"); if (!c || !ul) return false;
    var bar = D.createElement("div"); bar.className = "iac-bar";
    var vl = D.createElement("div"); vl.className = "iac-vl"; vl.hidden = true; vl.setAttribute("role", "group");
    var cx = D.createElement("div"); cx.className = "iac-cx"; cx.hidden = true; cx.setAttribute("role", "status"); cx.setAttribute("aria-live", "polite");
    c.insertBefore(bar, ul); c.insertBefore(vl, ul); c.insertBefore(cx, ul);
    S.bar = bar; S.vl = vl; S.cx = cx;
    textos();
    bar.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.classList.contains("iac-vistas")) { var ab = vl.hidden; vl.hidden = !ab; b.setAttribute("aria-expanded", String(ab)); if (ab) { var f = vl.querySelector("button"); if (f) f.focus(); } }
      else if (b.classList.contains("iac-limpar")) pedirLimpar();
      else if (b.classList.contains("iac-ex")) explicar();
    });
    vl.addEventListener("click", function (ev) { var b = ev.target.closest("[data-vista]"); if (b) aplicarVista(b.getAttribute("data-vista")); });
    cx.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc]"); if (!b) return;
      var a = b.getAttribute("data-acc");
      if (a === "sim") limpar();
      else if (a === "desfazer") desfazer();
      else fecharCx();
    });
    // linhas: o camadas-qgis.js volta a escrever a lista quando muda o conjunto de camadas; decora-se cada vez
    if (S.obs) { try { S.obs.disconnect(); } catch (e) {} }
    S.obs = new MutationObserver(function () { decorarTudo(); });
    S.obs.observe(ul, { childList: true });
    ul.addEventListener("click", cliqueLinha);
    decorarTudo();
    return true;
  }
  function textos() {
    if (!S.bar) return;
    S.bar.innerHTML =
      '<button type="button" class="iac-bt iac-vistas" aria-expanded="' + (S.vl && !S.vl.hidden ? "true" : "false") + '" title="' + esc(t("vistasT")) + '">' + I_VISTAS + "<span>" + esc(t("vistas")) + "</span></button>" +
      '<button type="button" class="iac-bt iac-limpar">' + I_LIMPAR + "<span>" + esc(t("limpar")) + "</span></button>" +
      '<button type="button" class="iac-ex" title="' + esc(t("explicarT")) + '">' + I_AJUDA + "<span>" + esc(t("explicar")) + "</span></button>";
    S.vl.setAttribute("aria-label", t("vistasT"));
    S.vl.innerHTML = vistas().map(function (v) { return '<button type="button" data-vista="' + esc(v.id) + '"' + (S.vista === v.id ? ' class="on"' : "") + ">" + esc(tl(v.nome)) + "</button>"; }).join("");
  }
  function vistas() { var v = W.IPR_VISTAS; return Array.isArray(v) && v.length ? v : VISTAS; }

  function cliqueLinha(ev) {
    var b = ev.target.closest(".iac-b"); if (!b || b.classList.contains("iac-off")) return;
    var li = b.closest(".ipr-cq-it"), id = li && li.getAttribute("data-id"); if (!id) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.classList.contains("iac-eng")) {
      var ab = !li.classList.contains("iac-ab"); lembrar(id, ab); estadoLinha(li, id);
    } else if (b.classList.contains("iac-olho")) {
      if (ESC[id]) delete ESC[id]; else ESC[id] = 1;
      var M = mapa(); if (M) aplicarVis(M, id);
      estadoLinha(li, id);
    } else if (b.classList.contains("iac-rem")) {
      delete ESC[id];
      // o foco passa para a linha seguinte (ou para a barra) antes de a linha desaparecer
      var prox = li.nextElementSibling || li.previousElementSibling;
      ligar(id, false);
      setTimeout(function () { try { var f = prox && prox.isConnected && prox.querySelector(".iac-rem:not(.iac-off), .iac-eng"); (f || S.bar.querySelector("button")).focus(); } catch (e) {} }, 250);
    }
  }

  // ---------- caixa de mensagens (confirmação, frase da vista, desfazer) ----------
  function mostrarCx(html) { S.cx.innerHTML = html; S.cx.hidden = false; }
  function fecharCx() { S.cx.hidden = true; S.cx.innerHTML = ""; }
  function botoes(lista) { return '<div class="iac-acc">' + lista.map(function (b) { return '<button type="button" data-acc="' + b[0] + '"' + (b[2] ? ' class="pri"' : "") + ">" + esc(b[1]) + "</button>"; }).join("") + "</div>"; }
  function aDesligar() { return activas().filter(function (id) { return !fica(id); }); }
  function pedirLimpar() {
    var n = aDesligar().length;
    if (!n) { mostrarCx("<p>" + esc(t("nada")) + "</p>" + botoes([["fechar", t("fechar")]])); return; }
    mostrarCx("<p>" + esc(n === 1 ? t("conf1") : t("conf", { n: n })) + "</p>" + botoes([["sim", t("sim"), 1], ["nao", t("nao")]]));
    try { S.cx.querySelector('[data-acc="sim"]').focus(); } catch (e) {}
  }
  function guardarAntes() {
    var M = mapa(), ops = {};
    var act = activas();
    act.forEach(function (id) { if (!fica(id)) { var g = lerJ(K_OP, {}); if (typeof g[id] === "number") ops[id] = g[id]; } });
    S.antes = { act: act, ops: ops, esc: JSON.parse(JSON.stringify(ESC)) };
    return M;
  }
  function limpar() {
    var ids = aDesligar(); guardarAntes();
    ids.forEach(function (id) { delete ESC[id]; ligar(id, false); });
    S.vista = null; textos();
    mostrarCx("<p>" + esc(t("limpo", { n: ids.length })) + "</p>" + botoes([["desfazer", t("desfazer")], ["fechar", t("fechar")]]));
  }
  function desfazer() {
    var a = S.antes; if (!a) { fecharCx(); return; }
    S.antes = null;
    var g = lerJ(K_OP, {});
    // opacidades como estavam (as que a vista mudou e não existiam antes saem do registo)
    (S.vistaOps || []).forEach(function (id) { if (!(id in a.ops)) delete g[id]; });
    Object.keys(a.ops).forEach(function (id) { g[id] = a.ops[id]; });
    gravar(K_OP, JSON.stringify(g)); S.vistaOps = null;
    activas().forEach(function (id) { if (!fica(id) && a.act.indexOf(id) < 0) ligar(id, false); });
    a.act.forEach(function (id) { if (!fica(id)) ligar(id, true); });
    ESC = a.esc || {};
    var M = mapa();
    if (M) setTimeout(function () { Object.keys(a.ops).forEach(function (id) { aplicarOp(M, id, a.ops[id]); opNaLista(id, a.ops[id]); }); reaplicarVis(); }, 900);
    S.vista = null; textos(); fecharCx();
  }

  // ---------- vistas ----------
  function aplicarVista(vid) {
    var v = vistas().filter(function (x) { return x.id === vid; })[0]; if (!v) return;
    var M = mapa(), V = viz(); if (!M || !V) return;
    guardarAntes();
    var quer = (v.camadas || []).filter(function (c) { return c && entrada(c[0]); });
    var ids = quer.map(function (c) { return c[0]; });
    activas().forEach(function (id) { if (!fica(id) && ids.indexOf(id) < 0) { delete ESC[id]; ligar(id, false); } });
    // opacidade gravada no registo do painel «Camadas ligadas»: o camadas-qgis.js aplica-a quando as camadas aparecem
    var g = lerJ(K_OP, {});
    quer.forEach(function (c) { var o = Math.max(0.1, Math.min(1, +c[1] || 1)); g[c[0]] = Math.round(o * 100) / 100; });
    gravar(K_OP, JSON.stringify(g));
    S.vistaOps = ids.slice();
    quer.forEach(function (c) { delete ESC[c[0]]; ligar(c[0], true); });
    var aplicar = function () {
      quer.forEach(function (c) { var o = Math.max(0.1, Math.min(1, +c[1] || 1)); aplicarOp(M, c[0], o); opNaLista(c[0], o); });
    };
    [400, 1500, 4000].forEach(function (ms) { setTimeout(aplicar, ms); });
    S.vista = vid; textos();
    if (S.vl) S.vl.hidden = true;
    var bv = S.bar && S.bar.querySelector(".iac-vistas"); if (bv) bv.setAttribute("aria-expanded", "false");
    var frase = function () {
      var falta = ids.filter(function (id) { return activas().indexOf(id) < 0; });
      var extra = falta.length && v.semBase ? " " + tl(v.semBase) : "";
      return "<b>" + esc(t("vista") + " · " + tl(v.nome)) + "</b><p>" + esc(tl(v.frase) + extra) + "</p>" + botoes([["desfazer", t("desfazer")], ["fechar", t("fechar")]]);
    };
    mostrarCx(frase());
    // as camadas ligam-se de forma assíncrona: confirma-se a frase (e o aviso da Base) quando já estão ligadas
    setTimeout(function () { if (S.vista === vid && !S.cx.hidden) mostrarCx(frase()); }, 1500);
  }

  // ---------- Explique-me este mapa ----------
  function explicar() {
    if (typeof W.iprAssistenteComprar === "function") {
      try { if (W.iprAssistenteComprar("leitura") !== false) return; } catch (e) {}
    }
    location.href = (lingua() === "es" ? "/cartografia/" : "/cartografia/") + "#leitura";
  }

  // ---------- ligação ----------
  var Mlig = null;
  function ligarMapa() {
    var M = mapa(); if (!M || M === Mlig) return;
    Mlig = M;
    try {
      M.on("styledata", function () { reaplicarVis(); clearTimeout(S.tEsp); S.tEsp = setTimeout(function () { if (S.sec) [].forEach.call(S.sec.querySelectorAll(".ipr-cq-l > .ipr-cq-it"), function (li) { corLinha(li, li.getAttribute("data-id")); }); }, 400); });
    } catch (e) {}
  }
  var voltas = 0;
  (function esperar() {
    try { ligarMapa(); montar(); } catch (e) {}
    voltas++;
    setTimeout(esperar, voltas < 120 ? 500 : 3000); // o Atlas pode recriar o mapa e o painel (troca de terreno)
  })();
  var relingua = function () { try { textos(); if (S.sec) [].forEach.call(S.sec.querySelectorAll(".ipr-cq-l > .ipr-cq-it"), function (li) { var c = li.querySelector(".iac-ctl"); if (c) c.remove(); decorar(li); }); } catch (e) {} };
  D.addEventListener("ipr:lingua", function () { setTimeout(relingua, 300); });
  W.addEventListener("ipr:lingua", function () { setTimeout(relingua, 300); });
  W.__iprActivasVistas = function () { return vistas(); }; // para diagnóstico e revisão
})();
