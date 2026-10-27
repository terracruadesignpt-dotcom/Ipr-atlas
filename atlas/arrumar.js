/* IPR Atlas · arrumação (Nuno, 27/10/2026, 10h06: «avançar hoje com tudo o que está pendente»). Terracrua Design.
   Carrega-se depois de todos os outros ficheiros do Atlas (camadas.js, viz.js, app.js, arranque.js, ajustes.js,
   mundo-camadas.js, intervencao.js, agua.js) e só estende em tempo de execução. Cada parte falha em silêncio.
   §77 Legendas oficiais: as camadas WMS e ArcGIS do catálogo sem `leg` passam a mostrar, na caixa de legenda do §71, a
       legenda do próprio serviço: WMS por GetLegendGraphic (imagem), ArcGIS MapServer e ImageServer por /legend?f=json
       (uma imagem por classe). O §71 não muda: a caixa é completada depois de desenhada. Cache em sessionStorage; quando o
       serviço falha (ou não deixa ler por CORS), fica a legenda simples do §71.
   §78 Carta de solos: a camada `solos` (DGADR) não responde desde 16/10 e só existe no modo Cloud. Nos temas «Solo e
       vegetação» e «Design · organização» passa a «mais camadas», com a nota «serviço do DGADR sem resposta»; no lugar
       entram `scs` (grupo hidrológico do solo) e `sroa` (capacidade de uso do solo). Usa window.__iprTemas.defs (ajustes.js).
   §79 Ecrã inteiro à vista: botão junto ao zoom e à rosa dos ventos (acompanha o grupo onde o §65 e o §73 o põem), tecla F.
       Usa o #ipe-fs do app.js. Onde não há ecrã inteiro (iPhone) ou o navegador o recusa, liga o «modo mapa»: esconde a
       barra de cima, os painéis e as barras e mostra um botão para sair (também Esc). ?ecra=1 abre já em modo mapa.
   §80 Perfis iniciais por função (formato do §68: tema, camadas, ferramentas): Autarquia, Investigação e candidaturas,
       Engenharia. Registo comum window.IPR_PERFIS (agua.js junta «agua» e «pc» ao mesmo registo). Um só selector
       (#ipr-perfis) por cima dos temas, que lista o que estiver no registo; activa-se também por ?perfil=<id> e fica em
       localStorage ipr_perfil. Formato de cada entrada:
         { id, nome: {pt, en}, desc: {pt, en}, tema, camadas: [ids ligados], mais: [ids à mão, desligados],
           ferr: [marcador|gps|desenhar|area|regua|perfil|3d|historico|crono|planta|analise|qfield], centro?, zoom?, bbox?,
           aplicar?: function (P) {} (substitui a aplicação genérica), ordem? }
   A Cronologia (§31) já tem 2010, 2021 e 2025 (commit a4c998b): nada a fazer aqui. */
(function () {
  "use strict";
  var W = window;
  function viz() { return W.__ipe && W.__ipe.viz; }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(document.documentElement.lang || "pt"); }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function catIdx() { var m = {}; try { (W.IPRViz.catalogo || []).forEach(function (e) { m[e.id] = e; }); } catch (e) {} return m; }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function sLer(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sGravar(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function css(id, txt) { if (document.getElementById(id)) return; var st = document.createElement("style"); st.id = id; st.textContent = txt; (document.head || document.documentElement).appendChild(st); }
  function cada(ms, f) { setInterval(function () { if (!document.hidden) try { f(); } catch (e) {} }, ms); }

  var TX = {
    pt: {
      fs: "Ecrã inteiro (F)", fsSair: "Sair do ecrã inteiro (F)", mmSair: "Sair do modo mapa", mmT: "Modo mapa: painéis e barras escondidos (Esc para sair)",
      perfil: "Perfil", semPerfil: "Sem perfil", perfilT: "Perfil de trabalho: abre o tema, liga as camadas e põe à mão as ferramentas da função. Pode mudar tudo depois.",
      ferr: "Ferramentas", mais: "Mais camadas do perfil", dgadr: "serviço do DGADR sem resposta",
      f_marcador: "Nota no mapa", f_gps: "A minha posição", f_desenhar: "Desenhar o terreno", f_area: "Medir área", f_regua: "Medir distância",
      f_perfil: "Perfil de elevação", f_3d: "Vista 3D", f_historico: "Imagens antigas", f_crono: "Cronologia", f_planta: "Planta de Localização",
      f_analise: "Análise prévia da intervenção", f_qfield: "QField",
      plantaSem: "A Planta de Localização faz-se a partir de um terreno guardado num projecto (separador Projectos)."
    },
    en: {
      fs: "Full screen (F)", fsSair: "Exit full screen (F)", mmSair: "Leave map mode", mmT: "Map mode: panels and bars hidden (Esc to leave)",
      perfil: "Profile", semPerfil: "No profile", perfilT: "Working profile: opens the theme, turns on the layers and puts the tools for the role at hand. You can change everything afterwards.",
      ferr: "Tools", mais: "More layers in this profile", dgadr: "DGADR service not responding",
      f_marcador: "Note on the map", f_gps: "My position", f_desenhar: "Draw the plot", f_area: "Measure area", f_regua: "Measure distance",
      f_perfil: "Elevation profile", f_3d: "3D view", f_historico: "Older imagery", f_crono: "Timeline", f_planta: "Location Plan",
      f_analise: "Preliminary intervention check", f_qfield: "QField",
      plantaSem: "The Location Plan is made from a plot saved in a project (Projects tab)."
    }
  };
  function tx(k) { var l = en() ? "en" : "pt"; return TX[l][k] != null ? TX[l][k] : (TX.pt[k] != null ? TX.pt[k] : k); }

  // ───────────────────────── §77 Legendas oficiais (WMS GetLegendGraphic, ArcGIS /legend) ─────────────────────────
  var LG = { mem: {}, pend: {}, chave: "ipr_leg76_v1:" };
  css("ipr-76-css",
    "#ipr-lgd .ipr-76 .r{align-items:flex-start}#ipr-lgd .ipr-76 .r img{flex:0 0 18px;width:18px;height:18px;max-width:18px;padding:0;margin:0;background:none;border-radius:0;object-fit:contain;display:block}" +
    "#ipr-lgd .ipr-76 .r span{min-width:0;overflow-wrap:anywhere}#ipr-lgd .ipr-76 .sh{font-size:11px;color:var(--mu,#9aa08f);margin:5px 0 1px}#ipr-lgd .ipr-76 .mais{font-size:11px;color:var(--mu,#9aa08f);margin-top:2px}" +
    "#ipr-lgd .ipr-76 img.w{margin-top:2px;max-height:240px;width:auto}");
  function candidato(e) {
    if (!e || (e.leg && e.leg.length) || e.srup || e.pdm) return false;
    var g = e.g || e.grupo; if (g === "fundo" || g === "ref" || g === "base") return false;
    if (!/^https:\/\//i.test(e.url || "")) return false;
    if (e.t === "wms") return !!e.layer && e.layer !== "*";
    return e.t === "ags" || e.t === "img";
  }
  function cacheLer(id) {
    if (LG.mem.hasOwnProperty(id)) return LG.mem[id];
    var s = sLer(LG.chave + id); if (s) { try { LG.mem[id] = JSON.parse(s); return LG.mem[id]; } catch (e) {} }
    return undefined;
  }
  function cacheGravar(id, d) { LG.mem[id] = d; try { sessionStorage.setItem(LG.chave + id, JSON.stringify(d)); } catch (e) {} }
  function wmsLegendas(e) {
    var base = e.url + (e.url.indexOf("?") < 0 ? "?" : "&");
    return String(e.layer).split(",").slice(0, 3).map(function (l) {
      return base + "SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.3.0&SLD_VERSION=1.1.0&FORMAT=image%2Fpng&STYLE=&LAYER=" + encodeURIComponent(l.trim());
    });
  }
  function agsIds(e) {
    if (e.dyn) { try { return JSON.parse(e.dyn).map(function (d) { return d.id; }); } catch (x) { return []; } }
    var m = /show:([\d,\s]+)/.exec(e.layers || ""); return m ? m[1].split(",").map(function (x) { return +x; }) : [];
  }
  function pedir(e) {
    var id = e.id; if (LG.pend[id]) return; LG.pend[id] = 1;
    if (e.t === "wms") { cacheGravar(id, { k: "wms", u: wmsLegendas(e) }); LG.pend[id] = 0; decorar(); return; }
    var u = e.url.replace(/\/+$/, "") + "/legend?f=json" + (e.dyn ? "&dynamicLayers=" + encodeURIComponent(e.dyn) : "");
    var ctl = W.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    fetch(u, { mode: "cors", credentials: "omit", signal: ctl ? ctl.signal : undefined }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (j) {
      var ids = agsIds(e), L = (j && j.layers) || [], linhas = [], n = 0, tot = 0;
      if (ids.length) L = L.filter(function (l) { return ids.indexOf(l.layerId) > -1; });
      L = L.filter(function (l) { return (l.legend || []).length; });
      L.forEach(function (l) {
        if (L.length > 1) linhas.push({ h: l.layerName || "" });
        l.legend.forEach(function (x) {
          tot++; if (n >= 40 || !x.imageData) return; n++;
          var rot = x.label || (l.legend.length === 1 ? l.layerName : "") || "";
          linhas.push({ i: "data:" + (x.contentType || "image/png") + ";base64," + x.imageData, l: rot });
        });
      });
      cacheGravar(id, n ? { k: "ags", r: linhas, f: tot - n } : { x: 1 });
    }).catch(function () { cacheGravar(id, { x: 1 }); }).then(function () { clearTimeout(tm); LG.pend[id] = 0; decorar(); });
  }
  function activasLeg(C) {
    var V = viz(); if (!V || typeof V.activas !== "function") return null;
    try { return V.activas().filter(function (id) { var e = C[id], g = e && (e.g || e.grupo); return e && g !== "fundo" && g !== "ref" && g !== "base"; }); } catch (e) { return null; }
  }
  function nomeDe(el) { var b = el.querySelector("b") || el.querySelector("span"); return b ? b.textContent : ""; }
  function bloco(id, d, el) {
    var nome = nomeDe(el), div = document.createElement("div");
    div.className = "l ipr-76"; div.setAttribute("data-ar76", id);
    if (d.k === "wms") {
      div.innerHTML = "<b>" + esc(nome) + "</b>" + d.u.map(function (u) { return '<img class="w" alt="" loading="lazy" src="' + esc(u) + '">'; }).join("");
      var falhas = 0, imgs = div.querySelectorAll("img");
      [].forEach.call(imgs, function (im) {
        im.addEventListener("error", function () {
          im.remove(); falhas++;
          if (falhas === imgs.length) { cacheGravar(id, { x: 1 }); if (div.parentNode) div.parentNode.replaceChild(el, div); }
        });
      });
      return div;
    }
    div.innerHTML = "<b>" + esc(nome) + "</b>" + d.r.map(function (x) {
      return x.h != null ? '<div class="sh">' + esc(x.h) + "</div>" : '<div class="r"><img alt="" src="' + esc(x.i) + '"><span>' + esc(x.l) + "</span></div>";
    }).join("") + (d.f ? '<div class="mais">+ ' + d.f + "</div>" : "");
    return div;
  }
  function decorar() {
    var box = document.getElementById("ipr-lgd"); if (!box || box.hidden) return;
    var c = box.querySelector(".c"); if (!c) return;
    var C = catIdx(), ids = activasLeg(C); if (!ids) return;
    var kids = [].slice.call(c.children); if (kids.length !== ids.length) return;
    ids.forEach(function (id, i) {
      var el = kids[i], e = C[id]; if (!el || el.getAttribute("data-ar76") || !candidato(e)) return;
      var d = cacheLer(id); if (d === undefined) { pedir(e); return; }
      if (!d || d.x) return;
      try { c.replaceChild(bloco(id, d, el), el); } catch (x) {}
    });
  }
  (function vigiar76() {
    var box = document.getElementById("ipr-lgd");
    if (!box || !W.MutationObserver) { setTimeout(vigiar76, 1500); return; }
    new MutationObserver(function () { try { decorar(); } catch (e) {} }).observe(box, { childList: true });
    decorar();
  })();

  // ───────────────────────── §78 Carta de solos fora dos temas principais ─────────────────────────
  function solos77() {
    var T = W.__iprTemas; if (!T || typeof T.defs !== "function") return false;
    T.defs().forEach(function (t) {
      if (!t || (t.id !== "solo" && t.id !== "org") || !t.c || t.__a77) return;
      var i = t.c.indexOf("solos"); if (i < 0) { t.__a77 = 1; return; }
      var novos = ["scs", "sroa"].filter(function (x) { return t.c.indexOf(x) < 0; });
      Array.prototype.splice.apply(t.c, [i, 1].concat(novos)); // no mesmo array: o menu «Os meus» (§25) partilha-o
      if (!t.extra) t.extra = [];
      if (t.extra.indexOf("solos") < 0) t.extra.push("solos");
      if (t.leg) { for (var k = t.leg.length - 1; k >= 0; k--) if (t.leg[k][0] === "l_solos") t.leg.splice(k, 1); }
      t.__a77 = 1;
    });
    return true;
  }
  (function tentar77(n) { if (!solos77() && n < 40) setTimeout(function () { tentar77(n + 1); }, 500); })(0);
  function notaSolos() {
    var w = document.getElementById("ipr-t62"); if (!w) return;
    var cb = w.querySelector('[data-c62="solos"]'), l = cb && cb.closest(".ipr-t62-l"); if (!l || l.querySelector(".ipr-77")) return;
    var em = document.createElement("em"); em.className = "ipr-77"; em.textContent = tx("dgadr"); l.appendChild(em);
  }
  css("ipr-77-css", "#ipr-t62 .ipr-t62-l em.ipr-77{font-style:normal;font-size:11px;color:var(--mu,#9aa08f);white-space:nowrap}");
  (function vigiar77() {
    var w = document.getElementById("ipr-t62");
    if (!w || !W.MutationObserver) { setTimeout(vigiar77, 1500); return; }
    new MutationObserver(function () { try { notaSolos(); } catch (e) {} }).observe(w, { childList: true, subtree: true });
    notaSolos();
  })();

  // ───────────────────────── §79 Ecrã inteiro à vista e modo mapa ─────────────────────────
  var IC_FS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var IC_SAI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  css("ipr-78-css",
    "#ipe .ipr-78g button.ipr-78{display:flex;align-items:center;justify-content:center;color:var(--tx,#e9eadf);cursor:pointer}#ipe .ipr-78g button.ipr-78[aria-pressed=true]{color:var(--ac,#b5c46a)}" +
    "#ipe .ipe-tools>.ipr-nav .ipr-78g button.ipr-78 svg{width:16px;height:16px}" +
    "@media (max-width:760px){#ipe.esq-aberto:not(.ipr-78-mm) .ipr-78g{display:none!important}}" + // no telemóvel, com a barra da esquerda aberta, não tapa o painel

    "#ipe.ipr-78-mm>.ipe-top,#ipe.ipr-78-mm>#ipe-esq,#ipe.ipr-78-mm>#ipe-dir,#ipe.ipr-78-mm>#ipe-st,#ipe.ipr-78-mm>.ipr-px,#ipe.ipr-78-mm .ipe-tools>*:not(.ipr-nav),#ipe.ipr-78-mm #ipr-lingueta{display:none!important}" +
    "#ipe.ipr-78-mm .ipe-tools:not(:has(.ipr-nav)){display:none!important}#ipe.ipr-78-mm #ipe-mapa{position:fixed!important;inset:0!important;width:auto!important;height:auto!important;z-index:5}" +
    "#ipr-78-sair{position:fixed;z-index:100003;top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));display:none;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--ln,#2c312a);background:var(--p1,#141814);color:var(--tx,#e9eadf);font:600 13px Inter,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer}" +
    "#ipe.ipr-78-mm #ipr-78-sair{display:inline-flex}#ipr-78-sair:hover{border-color:var(--ac,#b5c46a)}");
  var MM = false;
  function raiz() { return document.getElementById("ipe"); }
  function emFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function haFs() { var r = raiz(); return !!(r && (document.fullscreenEnabled || document.webkitFullscreenEnabled) && (r.requestFullscreen || r.webkitRequestFullscreen)); }
  function redimensionar() { setTimeout(function () { var M = mapa(); if (M) try { M.resize(); } catch (e) {} }, 80); }
  function modoMapa(on) {
    var r = raiz(); if (!r) return; MM = !!on; r.classList.toggle("ipr-78-mm", MM);
    var s = document.getElementById("ipr-78-sair");
    if (MM && !s) {
      s = document.createElement("button"); s.type = "button"; s.id = "ipr-78-sair";
      s.addEventListener("click", function (e) { e.stopPropagation(); modoMapa(false); });
      r.appendChild(s);
    }
    if (s) { s.innerHTML = IC_SAI + "<span>" + esc(tx("mmSair")) + "</span>"; s.title = tx("mmT"); }
    estado78(); redimensionar();
  }
  function alternar78() {
    if (MM) { modoMapa(false); return; }
    if (haFs()) {
      var antes = emFs(), b = document.getElementById("ipe-fs");
      if (b) b.click();
      else { var r = raiz(); try { if (antes) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { var p = (r.requestFullscreen || r.webkitRequestFullscreen).call(r); if (p && p.catch) p.catch(function () {}); } } catch (e) {} }
      if (!antes) setTimeout(function () { if (!emFs()) modoMapa(true); }, 700); // o navegador recusou: modo mapa
      return;
    }
    modoMapa(true);
  }
  function estado78() {
    var b = document.querySelector("#ipe .ipr-78"); if (!b) return;
    var on = emFs() || MM; b.setAttribute("aria-pressed", String(on));
    var t = on ? (MM ? tx("mmSair") : tx("fsSair")) : tx("fs"); b.title = t; b.setAttribute("aria-label", t);
    b.innerHTML = on ? IC_SAI : IC_FS;
  }
  function botao78() {
    var nav = document.querySelector("#ipe .ipr-nav"); if (!nav) return;
    var g = document.querySelector("#ipe .ipr-78g");
    if (g && g.parentNode === nav) return;
    if (!g) {
      g = document.createElement("div"); g.className = "maplibregl-ctrl maplibregl-ctrl-group ipr-78g";
      var b = document.createElement("button"); b.type = "button"; b.className = "ipr-78";
      b.addEventListener("click", function (e) { e.stopPropagation(); alternar78(); });
      g.appendChild(b);
      ["mousedown", "touchstart", "dblclick"].forEach(function (ev) { g.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    nav.appendChild(g); estado78();
  }
  ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) { document.addEventListener(ev, function () { estado78(); redimensionar(); }); });
  document.addEventListener("keydown", function (e) {
    var t = e.target, ed = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === "Escape" && MM) { modoMapa(false); return; }
    if (ed || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "f" && e.key !== "F")) return;
    if (!raiz() || !document.querySelector("#ipe .ipr-78")) return;
    e.preventDefault(); alternar78();
  });
  document.addEventListener("ipr:lingua", function () { estado78(); if (MM) modoMapa(true); });
  cada(1500, botao78); setTimeout(function () { try { botao78(); } catch (e) {} }, 600);
  if (/[?&]ecra=1\b/.test(location.search)) (function esperar(n) { if (raiz() && mapa()) modoMapa(true); else if (n < 40) setTimeout(function () { esperar(n + 1); }, 300); })(0);

  // ───────────────────────── §80 Perfis iniciais por função ─────────────────────────
  var IPR_PERFIS = W.IPR_PERFIS = W.IPR_PERFIS || {};
  var MEUS = {
    autarquia: {
      id: "autarquia", ordem: 10, dono: "arrumar",
      nome: { pt: "Autarquia", en: "Local authority" },
      desc: { pt: "Freguesia ou concelho: limites administrativos, cadastro, caminhos, linhas de água, perigosidade de incêndio e ordenamento. Notas no mapa, GPS e QField para o trabalho de campo; Planta de Localização para os processos.",
              en: "Parish or municipality: administrative boundaries, land registry, tracks, watercourses, wildfire hazard and zoning. Map notes, GPS and QField for fieldwork; the Location Plan for applications." },
      tema: "terreno", camadas: ["caop", "concelhos", "cad", "o_caminhos", "hidro", "perig_e", "crus"],
      mais: ["bupi", "ren", "ran", "icnfpa", "cos23", "o_edif"],
      ferr: ["marcador", "gps", "desenhar", "area", "crono", "planta", "qfield"]
    },
    investigacao: {
      id: "investigacao", ordem: 20, dono: "arrumar",
      nome: { pt: "Investigação e candidaturas", en: "Research and funding bids" },
      desc: { pt: "Ecologia e mudança da paisagem: habitats, Rede Natura 2000, áreas protegidas, densidade de copa e ocupação do solo, com carbono, aridez, desertificação, água e fogo à mão. A Cronologia compara ortofotos de 1995 a 2025.",
              en: "Ecology and landscape change: habitats, Natura 2000, protected areas, canopy density and land cover, with soil carbon, aridity, desertification, water and fire at hand. The Timeline compares orthophotos from 1995 to 2025." },
      tema: "ecologia", camadas: ["habitats", "n2k", "rnap", "copa18", "cos23"],
      mais: ["swf21", "n_gbif_todas", "cos18", "cos25", "carbono", "desert", "aridez", "precip", "erosiv", "wei", "ma_ecol", "inund", "perig_e", "ard15"],
      ferr: ["crono", "historico", "area", "perfil"]
    },
    engenharia: {
      id: "engenharia", ordem: 30, dono: "arrumar",
      nome: { pt: "Engenharia", en: "Engineering" },
      desc: { pt: "Condicionantes e terreno: cadastro, REN, RAN, domínio hídrico, servidões oficiais, curvas de nível, geologia e hidrologia do solo. Perfil de elevação, medições, análise prévia da intervenção e Planta de Localização em PT-TM06.",
              en: "Constraints and terrain: land registry, REN, RAN, public water domain, official easements, contour lines, geology and soil hydrology. Elevation profile, measurements, preliminary intervention check and Location Plan in PT-TM06." },
      tema: "cond", camadas: ["cad", "crus", "ren", "ran", "dph", "r_curvas"],
      mais: ["bupi", "la350", "inund", "zadj", "capt", "eletr", "viaria", "ferro", "marcos", "aero", "r_cdgt", "r_cotas", "geo", "scs", "cn", "esc_med", "l_declives", "l_acumulacao", "l_streams", "l_mdt"],
      ferr: ["perfil", "regua", "area", "analise", "planta"]
    }
  };
  Object.keys(MEUS).forEach(function (k) { if (!IPR_PERFIS[k]) IPR_PERFIS[k] = MEUS[k]; });
  // agua.js (27/10) tem os perfis «agua» e «pc» no seu próprio selector (.ipr-ag-pf) e no window.__iprAgua. Entram no registo
  // comum com a aplicação do próprio agua.js; o selector dele fica escondido, para haver um só selector de perfis. O arranque
  // por ?perfil=agua|pc continua a ser feito pelo agua.js.
  function agua79() {
    var A = W.__iprAgua; if (!A || typeof A.perfil !== "function" || !A.perfis) return false;
    var NM = { agua: { pt: "Água", en: "Water" }, pc: { pt: "Protecção Civil", en: "Civil Protection" } };
    A.perfis.forEach(function (k, i) {
      if (IPR_PERFIS[k]) return;
      IPR_PERFIS[k] = { id: k, ordem: 40 + i, dono: "agua", nome: NM[k] || { pt: k, en: k }, aplicar: function () { try { A.perfil(k); } catch (e) {} } };
    });
    return true;
  }
  (function tentarAgua(n) { if (!agua79() && n < 30) setTimeout(function () { tentarAgua(n + 1); }, 1000); })(0);
  css("ipr-79b-css", "#ipr-t62 .ipr-ag-pf{display:none!important}");

  function txt(v, alt) {
    if (v && typeof v === "object") return (en() ? v.en : v.pt) || v.pt || v.en || alt || "";
    return v || alt || "";
  }
  function nomeP(P) { return en() ? txt(P.nome_en || P.perfil_en || P.en, txt(P.nome, P.perfil_nome || P.id)) : txt(P.nome, P.perfil_nome || P.id); }
  function descP(P) { return en() ? txt(P.desc_en, txt(P.desc, "")) : txt(P.desc, ""); }
  function listaP() {
    return Object.keys(IPR_PERFIS).map(function (k) { var P = IPR_PERFIS[k]; if (P && !P.id) P.id = k; return P; }).filter(Boolean)
      .sort(function (a, b) { return (a.ordem || 50) - (b.ordem || 50) || String(nomeP(a)).localeCompare(String(nomeP(b))); });
  }
  function fecharPainelMovel() { if (W.innerWidth > 760) return; var lb = document.querySelector('#ipe [data-tool="lado"][aria-pressed="true"]'); if (lb) lb.click(); }
  function separador(t) { var b = document.querySelector('#ipe .ipe-tab[data-tab="' + t + '"]'); if (b) { b.click(); return true; } return false; }
  function avisar(m) {
    var a = document.getElementById("ipr-av62");
    if (!a) { a = document.createElement("div"); a.id = "ipr-av62"; a.setAttribute("role", "status"); (raiz() || document.body).appendChild(a); }
    a.textContent = m; a.classList.add("on"); clearTimeout(a.__t79); a.__t79 = setTimeout(function () { a.classList.remove("on"); }, 6000);
  }
  var SEL_F = { marcador: '[data-tool="marcador"]', gps: '[data-tool="gps"]', desenhar: '[data-tool="desenhar"]', area: '[data-tool="area"]', regua: '[data-tool="regua"]',
    "3d": '[data-tool="3d"]', historico: '[data-tool="historico"]', sol: '[data-tool="sol"]', parcelas: '[data-tool="parcelas"]', perfil: "#ipr-perfil-b" };
  function ferrDisponivel(f) {
    if (f === "analise") return !!(W.IPR_INTERVENCAO && W.IPR_INTERVENCAO.abrir);
    if (f === "crono") return !!document.querySelector(".ipr-crono-b");
    if (f === "planta" || f === "qfield") return true;
    return !!(SEL_F[f] && document.querySelector("#ipe " + SEL_F[f]));
  }
  function usarFerr(f) {
    if (f === "analise") { try { W.IPR_INTERVENCAO.abrir(); } catch (e) {} return; }
    if (f === "crono") { var c = document.querySelector(".ipr-crono-b"); if (c) c.click(); return; }
    if (f === "qfield") { separador("proj"); return; }
    if (f === "planta") {
      separador("proj"); var bs = document.querySelectorAll("#ipe [data-ppl]");
      if (bs.length === 1) { bs[0].click(); return; }
      if (bs.length) { try { bs[0].scrollIntoView({ block: "center" }); } catch (e) {} }
      avisar(tx("plantaSem")); return;
    }
    var b = SEL_F[f] && document.querySelector("#ipe " + SEL_F[f]); if (!b) return;
    if (f === "3d" && W.__ipe && W.__ipe.estado && W.__ipe.estado.em3d) return;
    fecharPainelMovel(); b.click();
  }
  function aplicarP(P, centrar) {
    if (!P) return;
    if (typeof P.aplicar === "function") { try { P.aplicar(P); } catch (e) {} P.__ap = Date.now(); return; }
    var R = viz(); if (!R) return;
    var ag = document.querySelector("#ipr-t62 [data-agsair]"); if (ag) try { ag.click(); } catch (e) {} // sai do tema Água (agua.js) e desliga as camadas dele
    if (P.tema && W.__iprTemas) { try { W.__iprTemas.aplicar(P.tema); } catch (e) {} }
    var C = catIdx();
    (P.camadas || []).forEach(function (id) { if (!C[id]) return; try { if (R.activas().indexOf(id) < 0) R.ligar(id, true); } catch (e) {} });
    if (centrar !== false) {
      var M = mapa(), b = P.bbox;
      try { if (M && b && b.length === 4) M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 900 }); else if (M && P.centro) M.easeTo({ center: P.centro, zoom: P.zoom || 11, duration: 900 }); } catch (e) {}
    }
    P.__ap = Date.now();
  }
  function activoId() { var v = ler("ipr_perfil"); return v && IPR_PERFIS[v] ? v : ""; }
  css("ipr-79-css",
    "#ipe .ipr-arv>#ipr-79#ipr-79{display:block!important}#ipr-79{padding:8px 10px 6px;border-bottom:1px solid var(--ln,#2c312a);font:12.5px/1.4 Inter,sans-serif;color:var(--tx,#e9eadf)}" +
    "#ipr-79 .ipr-79-s{display:flex;align-items:center;gap:8px}#ipr-79 .ipr-79-s .ipr-t62-h{margin:0;flex:0 0 auto}" +
    "#ipr-79 select{flex:1 1 auto;min-width:0;font:500 12.5px Inter,sans-serif;padding:5px 8px;min-height:32px;border-radius:8px;border:1px solid var(--ln,#2c312a);background:var(--p2,#1d221c);color:var(--tx,#e9eadf)}" +
    "#ipr-79 .ipr-79-d{margin:6px 0 4px;color:var(--tx2,#cfd2c4);font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}#ipr-79 .ipr-79-d.on{display:block}" +
    "#ipr-79 .ipr-t62-f button{min-height:28px;padding:4px 8px;font-size:11.5px}#ipr-79 .ipr-t62-f{margin:4px 0 2px}#ipr-79 details{margin-top:4px}" +
    "#ipr-79 summary{cursor:pointer;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f);padding:4px 0}#ipr-79 summary i{font-style:normal;color:var(--ac,#b5c46a);margin-left:4px}");
  function opcoes(sel) {
    var act = activoId(), h = '<option value="">' + esc(tx("semPerfil")) + "</option>";
    listaP().forEach(function (P) { h += '<option value="' + esc(P.id) + '"' + (P.id === act ? " selected" : "") + ">" + esc(nomeP(P)) + "</option>"; });
    sel.innerHTML = h; sel.value = act;
  }
  function pintarCartao() {
    var w = document.getElementById("ipr-79"); if (!w) return;
    var c = w.querySelector(".ipr-79-c"), P = IPR_PERFIS[activoId()];
    w.__sig79 = sig79();
    if (!P) { c.innerHTML = ""; return; }
    var C = catIdx(), on = []; try { on = viz().activas(); } catch (e) {}
    var h = descP(P) ? '<p class="ipr-79-d" title="' + esc(descP(P)) + '">' + esc(descP(P)) + "</p>" : "";
    var fs = (P.ferr || []).filter(ferrDisponivel);
    if (fs.length) h += '<div class="ipr-t62-f"><span class="ipr-t62-h">' + esc(tx("ferr")) + "</span>" + fs.map(function (f) { return '<button type="button" data-f79="' + esc(f) + '">' + esc(tx("f_" + f)) + "</button>"; }).join("") + "</div>";
    var mais = (P.mais || []).filter(function (id) { var e = C[id]; return e && !(W.IPR_NIVEL === "explorer" && e.lic === "r"); });
    if (mais.length) {
      h += '<details><summary>' + esc(tx("mais")) + "<i>" + mais.length + "</i></summary>" + mais.map(function (id) {
        var e = C[id], nm = en() && e.en ? e.en : e.n;
        return '<div class="ipr-t62-l"><label><input type="checkbox" data-c79="' + esc(id) + '"' + (on.indexOf(id) > -1 ? " checked" : "") + "> <span>" + esc(nm) + "</span></label></div>";
      }).join("") + "</details>";
    }
    var aberto = c.querySelector("details") && c.querySelector("details").open;
    c.innerHTML = h; if (aberto && c.querySelector("details")) c.querySelector("details").open = true;
  }
  function sig79() { var P = IPR_PERFIS[activoId()]; return P ? P.id + ":" + (P.ferr || []).filter(ferrDisponivel).join(",") + ":" + en() : ""; }
  function escolher(id, porUtilizador) {
    var P = IPR_PERFIS[id];
    gravar("ipr_perfil", P ? id : null);
    if (P && porUtilizador) aplicarP(P, true);
    pintarCartao();
  }
  function selector79() {
    var t62 = document.getElementById("ipr-t62"); if (!t62) return;
    var ext = document.getElementById("ipr-perfis");
    if (ext && !ext.closest("#ipr-79")) {
      // agua.js (ou outro) já criou o selector: só se juntam as opções que faltam e trata-se das entradas deste ficheiro
      if (ext.tagName === "SELECT") {
        listaP().forEach(function (P) { if (!ext.querySelector('option[value="' + P.id + '"]')) { var o = document.createElement("option"); o.value = P.id; o.textContent = nomeP(P); ext.appendChild(o); } });
        if (!ext.__a79) { ext.__a79 = 1; ext.addEventListener("change", function () { var P = IPR_PERFIS[ext.value]; if (P && P.dono === "arrumar") { gravar("ipr_perfil", P.id); aplicarP(P, true); } }); }
      }
      return;
    }
    var w = document.getElementById("ipr-79");
    if (w && w.nextSibling === t62) { var s0 = w.querySelector("select"); if (s0 && s0.options.length !== listaP().length + 1) opcoes(s0); return; }
    if (!w) {
      w = document.createElement("div"); w.id = "ipr-79";
      w.innerHTML = '<div class="ipr-79-s"><label class="ipr-t62-h" for="ipr-perfis"></label><select id="ipr-perfis"></select></div><div class="ipr-79-c"></div>';
      var sel = w.querySelector("select");
      sel.addEventListener("change", function () { escolher(sel.value, true); });
      w.addEventListener("click", function (e) { var d = e.target.closest && e.target.closest(".ipr-79-d"); if (d) { d.classList.toggle("on"); return; }
        var b = e.target.closest && e.target.closest("[data-f79]"); if (b) { e.stopPropagation(); usarFerr(b.getAttribute("data-f79")); } });
      w.addEventListener("change", function (e) { var c = e.target.closest && e.target.closest("[data-c79]"); if (!c) return; var R = viz(); if (R) try { R.ligar(c.getAttribute("data-c79"), c.checked); } catch (x) {} });
    }
    t62.parentNode.insertBefore(w, t62);
    rotulos();
  }
  function rotulos() {
    var w = document.getElementById("ipr-79"); if (!w) return;
    var l = w.querySelector("label.ipr-t62-h"); l.textContent = tx("perfil"); l.title = tx("perfilT");
    w.querySelector("select").title = tx("perfilT");
    opcoes(w.querySelector("select")); pintarCartao();
  }
  document.addEventListener("ipr:lingua", rotulos);
  // ?perfil=<id> no endereço: fica guardado; com perfil, a triagem genérica do §63 não abre sozinha (como no §68)
  // Nota: o app.js também lê ?perfil=<alcunha> (perfil da Comunidade). Quando o valor é um perfil de trabalho registado, o
  // separador Comunidade que o app.js abriu volta a Processos. ?perfil_atlas=<id> faz o mesmo sem tocar na Comunidade.
  var URLP = (/[?&]perfil_atlas=([a-z0-9_-]+)/i.exec(location.search) || [])[1] || ""; // ?perfil= fica para a Comunidade (app.js)
  URLP = URLP.toLowerCase();
  if (URLP === "nenhum" || URLP === "none") gravar("ipr_perfil", null);
  else if (URLP && IPR_PERFIS[URLP]) { gravar("ipr_perfil", URLP); if (!ler("ipr_triagem_v1")) gravar("ipr_triagem_v1", JSON.stringify({ q: null, p: 0, t: Date.now(), m79: 1 })); }
  function municipal() { var p = W.IPR_PERFIL_ORG || (W.IPR_PERFIL && W.IPR_PERFIL.municipal); return !!(p && p.perfil); }
  (function arranque79(n) {
    // o registo pode receber perfis de outros ficheiros depois deste: o ?perfil= volta a ser lido quando o mapa está pronto
    if (URLP && IPR_PERFIS[URLP] && ler("ipr_perfil") !== URLP) gravar("ipr_perfil", URLP);
    var id = activoId(), P = IPR_PERFIS[id];
    if (!P || municipal() || P.dono === "agua") return;
    if (!(viz() && mapa() && W.__iprTemas)) { if (n < 60) setTimeout(function () { arranque79(n + 1); }, 400); return; }
    if (P.__ap) return; // outro ficheiro já o aplicou nesta abertura
    var k = "ipr_perfil_s_" + id, proprio = /[?&](mapa|org_camada|ll)=/.test(location.search);
    if (proprio || (sLer(k) && URLP !== id)) return;
    sGravar(k, "1"); aplicarP(P, true);
    if (URLP === id && /[?&]perfil_atlas=/.test(location.search)) setTimeout(function () {
      var com = document.querySelector('#ipe .ipe-tab[data-tab="com"][aria-selected="true"]'), enc = document.querySelector('#ipe .ipe-tab[data-tab="enc"]');
      if (com && enc) enc.click();
    }, 900);
  })(0);
  cada(1500, function () {
    selector79();
    var w = document.getElementById("ipr-79"); if (!w) return;
    if (w.__sig79 !== sig79()) pintarCartao();
    var on = []; try { on = viz().activas(); } catch (e) {}
    w.querySelectorAll("[data-c79]").forEach(function (c) { var v = on.indexOf(c.getAttribute("data-c79")) > -1; if (c.checked !== v) c.checked = v; });
  });
})();
