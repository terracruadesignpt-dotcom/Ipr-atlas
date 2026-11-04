/* IPR Atlas · base-zoom.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Pedido do Nuno, 04/11/2026, 12h39, Base 18032 «Ensaio · Sub-bacia da Ribeira do Torgal» (16 410 ha): «já que não temos
   as camadas todas disponíveis, não devíamos as mostrar ali, senão parece que falta qualquer coisa. [...] é uma área muito
   grande, de alguma forma as pessoas têm que entender isso.» Resposta à pergunta: são as «caixas que não acendem».
   Causa (ficheiros reais da Base, cabeçalhos PMTiles lidos a 04/11): as camadas raster (MDT, sombreamento, declives,
   exposição, geomorfologia, vento, acumulação, TWI, erosão) só têm mosaicos dos níveis 12 a 16 e as curvas de 0,5 m dos
   níveis 14 a 17. Numa Base pequena o mapa abre perto do nível 15 e tudo aparece; a Base do Torgal enquadrada inteira fica
   perto do nível 11, abaixo do primeiro nível que existe: a caixa liga-se e o mapa não mostra nada.
   Aqui, na lista da Base aberta («Os meus projectos», minhas-bases.js):
   1. lê-se o nível mínimo de cada camada PMTiles da Base (os primeiros 127 bytes do ficheiro, uma vez por ficheiro);
   2. as camadas que, à escala actual, não teriam nada para mostrar saem da lista (e o subtítulo do grupo, se ficar vazio);
   3. no topo da Base aparece uma nota: a área é grande, estas camadas aparecem ao aproximar, com o botão «Aproximar»;
   4. ao aproximar o mapa, voltam à lista sozinhas (e a nota sai quando já não há nenhuma escondida).
   As camadas ligadas continuam ligadas: aparecem no mapa logo que a escala o permita. Nada muda nas Bases em que todas as
   camadas se vêem à escala do mapa. Desligar: ?base-zoom=0 ou localStorage ipr_base_zoom_off = 1. Falha em silêncio.
   Correcção de fundo (por fazer, no worker): gerar também os níveis 9 a 11 nas Bases grandes. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]base-zoom=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_base_zoom_off") === "1") return; } catch (e) {}
  if (W.__iprBaseZoom) return; W.__iprBaseZoom = 1;

  var TX = {
    pt: { nota: "Área grande ({ha} ha): {n} aparecem só ao aproximar o mapa. Com a Base inteira à vista, estes mosaicos não existem; o mapa ficaria vazio.",
      uma: "1 camada", varias: "{n} camadas", ap: "Aproximar", apT: "Aproximar o mapa até as camadas aparecerem" },
    en: { nota: "Large area ({ha} ha): {n} only show when you zoom in. With the whole Base in view these tiles do not exist and the map would be empty.",
      uma: "1 layer", varias: "{n} layers", ap: "Zoom in", apT: "Zoom the map in until the layers show" }
  };
  function t(k) { var l = (W.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; return TX[l][k] || TX.pt[k]; }
  function I() { return W.__ipe || null; }
  function est() { var i = I(); return i && i.estado; }
  function mapa() { var i = I(); return i && i.mapa; }
  function actual() { var P = est(); return P && P.modo === "cliente" && P.actual ? P.actual : null; }

  var MINZ = {}, PEDIDO = {};   // url -> nível mínimo (ou null se não for PMTiles / falhou)
  function urlDe(m, lid) {
    var ds = Array.isArray(m && m.downloads) ? m.downloads : [];
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i] || {}, f = String(d.nome || "").split("/").pop().split(" · ").pop();
      if (f.toLowerCase() === lid + ".pmtiles" && d.url) return d.url;
    }
    return null;
  }
  function lerMinz(url) {
    if (url in MINZ || PEDIDO[url]) return;
    PEDIDO[url] = 1;
    var c = W.AbortController ? new AbortController() : null;
    if (c) setTimeout(function () { try { c.abort(); } catch (e) {} }, 20000);
    fetch(url, { headers: { Range: "bytes=0-126" }, credentials: "same-origin", signal: c ? c.signal : undefined })
      .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
      .then(function (b) {
        var u = b && new Uint8Array(b);
        MINZ[url] = u && u.length >= 102 && String.fromCharCode.apply(null, u.subarray(0, 7)) === "PMTiles" ? u[100] : null;
      })
      .catch(function () { MINZ[url] = null; })
      .then(function () { delete PEDIDO[url]; aplicar(); });
  }

  function num(n) { n = +n; return isFinite(n) ? n.toLocaleString((W.IPR_LINGUA || "pt") === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 0 }) : ""; }

  var ocupado = false;
  function aplicar() {
    if (ocupado) return;
    ocupado = true;
    try { aplicar2(); } catch (e) {} finally { ocupado = false; }
  }
  function aplicar2() {
    var m = actual(), M = mapa(), box = D.getElementById("ipr-mb");
    if (!box) return;
    var li = m && box.querySelector('li.ipr-mb-b[data-mb="' + String(m.id).replace(/["\\]/g, "") + '"]');
    // limpar o que foi feito noutras Bases
    Array.prototype.forEach.call(box.querySelectorAll("[data-bz-esc]"), function (x) {
      if (!li || !li.contains(x)) { x.hidden = false; x.removeAttribute("data-bz-esc"); }
    });
    Array.prototype.forEach.call(box.querySelectorAll(".ipr-bz-nota"), function (x) { if (!li || !li.contains(x)) x.remove(); });
    if (!li || !M || typeof M.getZoom !== "function") return;
    var corpo = li.querySelector(".ipr-mb-corpo"); if (!corpo) return;
    var z = M.getZoom(), esc = [], precisa = 99;
    Array.prototype.forEach.call(corpo.querySelectorAll("li.ipr-mb-it[data-mb-c]"), function (it) {
      var id = it.getAttribute("data-mb-c"); if (id.indexOf("l_") !== 0) return;
      var url = urlDe(m, id.slice(2)); if (!url) return;
      if (!(url in MINZ)) { lerMinz(url); return; }
      var mz = MINZ[url];
      var fora = mz != null && z < mz - 0.5;
      if (fora) {
        if (!it.hidden) { it.hidden = true; it.setAttribute("data-bz-esc", "1"); }
        var n = it.querySelector(".ipr-mb-n"); esc.push(n ? n.firstChild && n.firstChild.nodeType === 3 ? n.firstChild.nodeValue : n.textContent : id);
        precisa = Math.min(precisa, mz);   // o botão aproxima até à primeira que aparece (as rasters, nível 12)
      } else if (it.getAttribute("data-bz-esc")) { it.hidden = false; it.removeAttribute("data-bz-esc"); }
    });
    // subtítulos de grupo sem nenhuma camada à vista
    var subs = corpo.querySelectorAll("li.ipr-mb-sub");
    Array.prototype.forEach.call(subs, function (s) {
      var x = s.nextElementSibling, algum = false;
      while (x && !x.classList.contains("ipr-mb-sub")) { if (!x.hidden) { algum = true; break; } x = x.nextElementSibling; }
      if (!algum && !s.hidden) { s.hidden = true; s.setAttribute("data-bz-esc", "1"); }
      else if (algum && s.getAttribute("data-bz-esc")) { s.hidden = false; s.removeAttribute("data-bz-esc"); }
    });
    var nota = corpo.querySelector(".ipr-bz-nota");
    if (!esc.length) { if (nota) nota.remove(); return; }
    var txt = t("nota").replace("{ha}", num(m.area_ha)).replace("{n}", esc.length === 1 ? t("uma") : t("varias").replace("{n}", esc.length));
    var chave = txt + "|" + esc.join(",") + "|" + precisa;
    if (nota && nota.getAttribute("data-k") === chave) return;
    if (!nota) {
      nota = D.createElement("div"); nota.className = "ipr-bz-nota";
      nota.style.cssText = "margin:6px 0 8px;padding:8px 10px;border:1px solid var(--ln,rgba(128,128,128,.35));border-radius:8px;font-size:12px;line-height:1.45;color:var(--tx,inherit)";
      var acc = corpo.querySelector(".ipr-mb-acc");
      corpo.insertBefore(nota, acc ? acc.nextSibling : corpo.firstChild);
    }
    nota.setAttribute("data-k", chave);
    nota.textContent = "";
    var p = D.createElement("p"); p.style.margin = "0 0 6px"; p.textContent = txt; nota.appendChild(p);
    var q = D.createElement("p"); q.style.cssText = "margin:0 0 6px;opacity:.8"; q.textContent = esc.join(" · "); nota.appendChild(q);
    var b = D.createElement("button"); b.type = "button"; b.textContent = t("ap"); b.title = t("apT");
    b.setAttribute("data-bz-z", String(precisa));
    nota.appendChild(b);
  }

  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-bz-z]"); if (!b) return;
    var M = mapa(); if (!M) return;
    try { M.easeTo({ zoom: Math.max(M.getZoom(), +b.getAttribute("data-bz-z") + 0.2), duration: 800 }); } catch (x) {}
  }, true);

  var ligado = null, obs = null;
  function vigiar() {
    var M = mapa();
    if (M && M !== ligado && M.on) { ligado = M; try { M.on("zoomend", aplicar); } catch (e) {} }
    var box = D.getElementById("ipr-mb");
    if (box && W.MutationObserver && (!obs || obs.__box !== box)) {
      if (obs) obs.disconnect();
      obs = new MutationObserver(function () { setTimeout(aplicar, 0); }); obs.__box = box;
      obs.observe(box, { childList: true, subtree: true });
    }
    aplicar();
  }
  setInterval(vigiar, 1500);
  vigiar();
})();
