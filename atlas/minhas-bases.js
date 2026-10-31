/* IPR Atlas · As minhas Bases na barra da esquerda (pedido do Nuno, 29/10/2026, 14h36: «à esquerda tem tudo o que é camadas»).
   1. Com sessão, o bloco «Os meus locais» da esquerda passa a ter, no topo, «Os meus projectos»: as Bases Cartográficas da
      pessoa (suas e partilhadas consigo), cada uma recolhida numa linha. Ao abrir a linha aparecem as camadas dessa Base, com
      a caixa de ligar, a cor e a opacidade, como na árvore das camadas (a legenda fica no painel «Legenda» do mapa).
   2. Ao abrir o Atlas a partir da ficha do projecto (/atlas/?mapa=N), ou na primeira vez que a pessoa entra com uma só Base,
      essa Base aparece já aberta, com o limite, o MDT, o sombreamento, as curvas de nível e as linhas de água ligados (decisão
      do Nuno, 29/10, 15h05; as outras ficam na lista, desligadas), e o mapa enquadra-a. Nunca com ?modo=encomenda, nem fora
      do modo cliente, nem mudando de Base ou de endereço sozinho. Com ?mapa=, o enquadramento continua a
      ser feito pelo enquadrar.js; aqui só se enquadra na primeira visita, depois da abertura animada e se a pessoa não mexeu.
   3. Não há camadas repetidas: as fichas «Camadas da Base Cartográfica» do cartão do projecto (painel da direita) saem, e
      os grupos «A minha Base Cartográfica» e «O meu terreno» da árvore continuam escondidos (§47 do ajustes.js). Ligar,
      desligar e a opacidade usam o próprio Atlas (window.__ipe.viz e a barra de opacidade da árvore), por isso a legenda,
      a ordem das camadas, os níveis de acesso (Explorer e Intelligence) e o que fica guardado são os mesmos.
   4. Sem sessão, ou com a área de cliente fechada (meus-mapas «bloqueado»), não aparece nada.
   Não mexe no app.js. Texto todo escapado (só textContent e atributos). Cores pelas variáveis do Atlas (tema claro e escuro).
   Desligar: window.IPR_MINHAS_BASES_OFF = true antes de carregar, ou ?minhas_bases=0 no endereço.
   31/10/2026 (Nuno, 02h17: «Devia ter Base Cartográfica e Terracrua Design, as duas»): o corpo de cada projecto passa a ter
   duas partes, «Base Cartográfica» (o que já havia) e «Design Terracrua Design», desenhada pelo design-projecto.js
   (window.IPRDesign.parte). Um projecto sem camadas da Base mas com desenhos convertidos também se abre. Sem o
   design-projecto.js tudo fica como antes, só com o título «Base Cartográfica». */
(function () {
  "use strict";
  if (window.__iprMinhasBases || window.IPR_MINHAS_BASES_OFF) return;
  window.__iprMinhasBases = 1;
  var Q = new URLSearchParams(location.search);
  if (Q.get("minhas_bases") === "0") return;
  if (!window.tcdNonce) return; // sem sessão, nada

  var CHAVE = "ipr_mb_v1";
  var TX = {
    pt: { titulo: "Os meus projectos", camadas: "camadas", camada: "camada", partilhado: "partilhado consigo", rever: "para rever",
      prep: "Em preparação", sem: "Sem camadas para o mapa nesta entrega.", ligar: "Ligar todas", desligar: "Desligar todas",
      ficha: "Ficha do projecto", ver: "Ver", verT: "Enquadrar esta Base no mapa", abrir: "Abrir no mapa",
      fora: "Esta Base não está aberta no mapa. Abra-a para ligar as camadas.", op: "Opacidade de ", limite: "Limite do terreno",
      entrega: "Da entrega", aberta: "aberta no mapa", semNome: "Terreno sem nome", parteBase: "Base Cartográfica" },
    en: { titulo: "My projects", camadas: "layers", camada: "layer", partilhado: "shared with you", rever: "to review",
      prep: "Being prepared", sem: "No map layers in this delivery.", ligar: "Turn all on", desligar: "Turn all off",
      ficha: "Project sheet", ver: "View", verT: "Fit this Base on the map", abrir: "Open on the map",
      fora: "This Base is not open on the map. Open it to turn the layers on.", op: "Opacity of ", limite: "Site boundary",
      entrega: "From the delivery", aberta: "open on the map", semNome: "Unnamed site", parteBase: "Base Cartográfica" }
  };
  function t(k) { var l = (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; return TX[l][k] || TX.pt[k]; }

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null") || {}; } catch (e) { return {}; } }
  function gravar(o) { try { var v = JSON.stringify(o); localStorage.setItem(CHAVE, v); return localStorage.getItem(CHAVE) === v; } catch (e) { return false; } }
  var MEM = ler(); if (!MEM.ab || typeof MEM.ab !== "object") MEM.ab = {};

  function I() { return window.__ipe || null; }
  function est() { var i = I(); return i && i.estado; }
  function viz() { var i = I(); return i && i.viz; }
  function mapa() { var i = I(); return i && i.mapa; }
  function activas() { var v = viz(); try { return v && v.activas ? v.activas() : []; } catch (e) { return []; } }
  function cor(c) { c = String(c || ""); return /^#[0-9a-f]{3,8}$/i.test(c) || /^rgba?\([\d.,\s%]+\)$/i.test(c) ? c : "#888"; }
  function num(n, d) { n = +n; return isFinite(n) ? n.toLocaleString((window.IPR_LINGUA || "pt") === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d, minimumFractionDigits: d }) : ""; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function sel(id) { return window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/["\\]/g, ""); }

  // ---------- dados: as Bases e as camadas de cada uma (as mesmas regras do viz.js) ----------
  var CAT = null;
  function catalogo() {
    if (CAT) return CAT;
    var c = window.IPRViz && window.IPRViz.catalogo; if (!c || !c.length) return null;
    CAT = { por: {}, ordem: {} };
    c.forEach(function (e, i) { if (e && e.id && e.t === "lidar") { CAT.por[e.id] = e; CAT.ordem[e.id] = i; } });
    return CAT;
  }
  function camadasDe(m) {
    var C = catalogo(); if (!C) return [];
    var out = [], ent = [], n = 0;
    (Array.isArray(m.downloads) ? m.downloads : []).forEach(function (d) {
      var f = String(d && d.nome || "").split("/").pop(), a = f.match(/^(.+)\.(geojson|json|pmtiles)$/i);
      if (!a || /^visualizador\.json$/i.test(f)) return;
      var id = "l_" + a[1].toLowerCase();
      if (C.por[id]) { if (!out.some(function (x) { return x.id === id; })) out.push(id); }
      else if (/geojson/i.test(a[2])) ent.push({ id: "ent" + (n++), chave: a[1].toLowerCase(), nome: f.replace(/\.geojson$/i, "").replace(/[-_]+/g, " "), sub: t("entrega"), cor: ["#e07b39", "#4f8edc", "#7bb661", "#c74b50", "#9b6bc3", "#d9a521"][(n - 1) % 6] });
    });
    out.sort(function (a, b) { return C.ordem[a] - C.ordem[b]; });
    var lista = [];
    if (m.geojson) lista.push({ id: "aoi", chave: "aoi", nome: t("limite"), sub: "", cor: "#ff9a3c", fixo: 1 });
    out.forEach(function (id) {
      var e = C.por[id];
      lista.push({ id: id, chave: id.slice(2), nome: e.n, sub: String(e.sub || "").replace(/^Base Cartogr[aá]fica\s*·\s*/, ""), cor: e.cor, leg: e.leg, raster: e.forma === "raster" });
    });
    return lista.concat(ent);
  }
  // Desenhos do projecto (design-projecto.js): há convertidos prontos para o mapa?
  function design(m) { try { return !!(window.IPRDesign && window.IPRDesign.tem && window.IPRDesign.tem(m)); } catch (e) { return false; } }
  function nCamadas(cs) { return cs.filter(function (c) { return c.id !== "aoi"; }).length; }
  function bases() {
    var P = est(); if (!P || !P.dados || P.dados.bloqueado) return null;
    var act = P.modo === "cliente" ? P.actual : null;
    return (P.mapas || []).filter(function (m) { return m && (!m.rever || m === act); });
  }
  function actual(m) { var P = est(); return !!(P && P.modo === "cliente" && P.actual && m && String(P.actual.id) === String(m.id)); }
  function caixa(g) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (function col(o) { if (!o) return []; if (o.type === "FeatureCollection") return (o.features || []).map(function (f) { return col(f); }); if (o.type === "Feature") return col(o.geometry); if (o.type === "GeometryCollection") return (o.geometries || []).map(col); return o.coordinates || []; })(typeof g === "string" ? (function () { try { return JSON.parse(g); } catch (e) { return null; } })() : g));
    return isFinite(b[0]) && b[0] <= b[2] ? b : null;
  }

  // ---------- o Atlas: ligar, opacidade e linha da árvore (escondida) que tem a barra de opacidade ----------
  function linhaArvore(id) { return document.querySelector('#ipe-cam .ipr-it[data-id="' + sel(id) + '"]'); }
  function ligar(id, on) { var v = viz(); if (v && v.ligar) { try { v.ligar(id, on); } catch (e) {} } }
  function opacidade(id) { var r = linhaArvore(id); r = r && r.querySelector(".ipr-op"); return r ? +r.value : null; }
  function mudarOpacidade(id, v) {
    var li = linhaArvore(id), r = li && li.querySelector(".ipr-op");
    if (r) { r.value = String(v); r.dispatchEvent(new Event("input", { bubbles: true })); return; }
    var M = mapa(), st = M && M.getStyle && M.getStyle(); if (!st) return; // sem a linha (árvore filtrada): directo no mapa
    st.layers.forEach(function (l) {
      if (l.id.indexOf("iprv-" + id + "-") !== 0 && l.id !== "iprv-" + id) return;
      var p = { raster: "raster-opacity", line: "line-opacity", fill: "fill-opacity", circle: "circle-opacity" }[l.type];
      if (p) { try { M.setPaintProperty(l.id, p, v / 100); } catch (e) {} }
    });
  }
  // Para ligar: sem linha na árvore não se sabe se a camada está trancada, por isso trata-se como trancada.
  function travada(id) { var li = linhaArvore(id); return !li || li.classList.contains("bl"); }
  function bloqueio(id) { var li = linhaArvore(id); if (!li || !li.classList.contains("bl")) return ""; var s = li.querySelector(".ipr-cad"); return (s && s.textContent) || "Intelligence"; }
  function enquadrar(m, dur) {
    var M = mapa(), b = m && caixa(m.geojson); if (!M || !b) return;
    try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: window.innerWidth < 700 ? 30 : 70, maxZoom: 17.5, duration: dur == null ? 700 : dur }); } catch (e) {}
  }
  function cartao(m) {
    var P = est(), i = P && P.mapas ? P.mapas.indexOf(m) : -1;
    return i < 0 ? null : document.querySelector('#ipe-proj .ipe-card[data-i="' + i + '"]');
  }
  // Abrir uma Base no mapa pelo mesmo caminho do cartão do separador Projectos (o Atlas refaz o mapa e põe ?mapa= no endereço).
  function abrir(m, auto) {
    if (actual(m)) return true;
    if (auto) return false; // na abertura automática nunca se muda de Base nem de endereço (?modo=, vale e o resto ficam)
    var c = cartao(m);
    if (c) { c.click(); return true; }
    location.href = "/atlas/?mapa=" + encodeURIComponent(m.id);
    return false;
  }
  function verFicha(m) {
    var tab = document.querySelector('#ipe-tabs .ipe-tab[data-tab="proj"]'); if (tab) tab.click();
    var raiz = document.getElementById("ipe");
    if (raiz && raiz.classList.contains("sem-dir")) { var pn = document.getElementById("ipe-pn"); if (pn) pn.click(); }
    setTimeout(function () { var c = cartao(m); if (c && c.scrollIntoView) c.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 120);
  }

  // Pedidos à espera de a Base estar aberta e o mapa pronto (ligar camadas de uma Base que ainda não estava no mapa).
  var PEND = null;
  function pronto(m) {
    var M = mapa();
    return actual(m) && M && M.loaded && (M.isStyleLoaded ? M.isStyleLoaded() : true) && !!document.querySelector("#ipe-cam .ipr-it");
  }
  function quando(m, fn, limite) {
    var t0 = Date.now();
    (function v() { if (pronto(m)) { fn(); return; } if (Date.now() - t0 < (limite || 20000)) setTimeout(v, 250); })();
  }
  function ligarTodas(m, on) {
    var act = activas();
    camadasDe(m).forEach(function (c) {
      if (c.fixo && !on) return; // o limite do terreno fica, como no «Desligar» da árvore
      if (on && travada(c.id)) return;
      if ((act.indexOf(c.id) >= 0) !== on) ligar(c.id, on);
    });
    pintar();
  }
  // Abertura automática (decisão do Nuno, 29/10, 15h05): só o limite, o MDT, o sombreamento, as curvas de nível e as linhas
  // de água ficam ligados; as outras camadas da Base ficam na lista, desligadas. «Ligar todas» continua a ligar tudo.
  var INICIAIS = ["aoi", "mdt", "somb_bw", "curvas1", "curvas5", "curvas025", "streams"];
  function ligarIniciais(m) {
    var act = activas();
    camadasDe(m).forEach(function (c) {
      var quer = INICIAIS.indexOf(c.chave) >= 0, esta = act.indexOf(c.id) >= 0;
      if (quer && !esta && !travada(c.id)) ligar(c.id, true);
      else if (!quer && esta && !c.fixo) ligar(c.id, false);
    });
    pintar(true);
  }

  // ---------- desenho ----------
  var ESTILO = "#ipr-mb{border-bottom:1px solid var(--ln);max-height:52vh;overflow-y:auto;overscroll-behavior:contain}" +
    ".ipe-sb.fechado #ipr-mb{display:none}" +
    "#ipr-mb .ipr-mb-cab{display:flex;align-items:baseline;gap:6px;padding:9px 12px 4px;font:600 11px/1.2 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}" +
    "#ipr-mb .ipr-mb-cab em{font-style:normal;color:var(--ac2)}" +
    "#ipr-mb ul{list-style:none;margin:0;padding:0}" +
    "#ipr-mb .ipr-mb-b{margin:0 8px 6px;border:1px solid var(--ln);border-radius:8px;background:var(--p2)}" +
    "#ipr-mb .ipr-mb-b.actual{border-color:var(--ac)}" +
    "#ipr-mb .ipr-mb-bc{display:flex;align-items:stretch}" +
    "#ipr-mb .ipr-mb-bt{flex:1;min-width:0;display:flex;align-items:flex-start;gap:8px;border:0;background:transparent;color:var(--tx);text-align:left;padding:8px 6px 8px 10px;cursor:pointer;font:600 13px/1.3 Inter,system-ui,sans-serif}" +
    "#ipr-mb .ipr-mb-bt:disabled{cursor:default}" +
    "#ipr-mb .ipr-mb-car{flex:none;width:0;height:0;margin-top:5px;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;opacity:.7;transition:transform .12s}" +
    "#ipr-mb .ipr-mb-b.ab .ipr-mb-car{transform:rotate(90deg)}" +
    "#ipr-mb .ipr-mb-bt:disabled .ipr-mb-car{opacity:.25}" +
    "#ipr-mb .ipr-mb-t{flex:1;min-width:0}" +
    "#ipr-mb .ipr-mb-t b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ipr-mb .ipr-mb-t small{display:block;font:400 11.5px/1.35 var(--mono,monospace);color:var(--mu2,var(--mu));margin-top:2px}" +
    "#ipr-mb .ipr-mb-t small i{font-style:normal;color:var(--ac2)}" +
    "#ipr-mb .ipr-mb-ir{flex:none;border:0;border-left:1px solid var(--ln);background:transparent;color:var(--mu);font:600 12px Inter,system-ui,sans-serif;padding:0 10px;cursor:pointer;border-radius:0 8px 8px 0}" +
    "#ipr-mb .ipr-mb-ir:hover,#ipr-mb .ipr-mb-bt:not(:disabled):hover{color:var(--ac2)}" +
    "#ipr-mb .ipr-mb-corpo{border-top:1px solid var(--ln);padding:4px 0 6px}" +
    "#ipr-mb .ipr-mb-acc{display:flex;flex-wrap:wrap;gap:4px;padding:4px 8px 6px}" +
    "#ipr-mb .ipr-mb-acc button{border:1px solid var(--ln);background:transparent;color:var(--tx);border-radius:6px;padding:3px 8px;font:600 11.5px Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-mb .ipr-mb-acc button:hover{border-color:var(--ac);color:var(--ac2)}" +
    "#ipr-mb .ipr-mb-acc button.ac{background:var(--ac);border-color:var(--ac);color:var(--bg)}" +
    "#ipr-mb .ipr-mb-nota{margin:2px 10px 6px;font:12px/1.4 Inter,system-ui,sans-serif;color:var(--mu)}" +
    "#ipr-mb .ipr-mb-parte{padding:6px 10px 3px;font:600 11px/1.2 var(--mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--ac2)}" +
    "#ipr-mb .ipr-mb-sub{padding:7px 10px 2px 12px;font:600 10px/1.2 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}" +
    "#ipr-mb .ipr-mb-it{padding:0 8px 0 6px}" +
    "#ipr-mb .ipr-mb-it label{display:flex;align-items:flex-start;gap:7px;padding:4px 4px 4px 6px;cursor:pointer;font:13px/1.3 Inter,system-ui,sans-serif;color:var(--tx)}" +
    "#ipr-mb .ipr-mb-it input[type=checkbox]{width:15px;height:15px;margin:1px 0 0;flex:none;accent-color:var(--ac);cursor:pointer}" +
    "#ipr-mb .ipr-mb-cor{width:10px;height:10px;border-radius:2px;flex:none;margin-top:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}" +
    "#ipr-mb .ipr-mb-n{flex:1;min-width:0}" +
    "#ipr-mb .ipr-mb-n small{display:block;font-size:11px;color:var(--mu)}" +
    "#ipr-mb .ipr-mb-it.bl label{cursor:default;opacity:.7}" +
    "#ipr-mb .ipr-mb-it.fora label{opacity:.6}" +
    "#ipr-mb .ipr-mb-op{display:block;width:calc(100% - 36px);margin:0 0 4px 30px;height:14px;accent-color:var(--ac)}" +
    // As camadas da Base vivem agora à esquerda: as fichas repetidas do cartão do projecto (direita) saem.
    // Só quando o bloco da esquerda está à vista (classe ipr-mb-on em #ipe, posta em marcar()).
    "#ipe.ipr-mb-on #ipe-proj .ipe-basecam{display:none!important}";

  function caixaMontar() {
    var sec = document.querySelector('#ipe-esq .ipe-sb[data-sb="locais"]'), loc = document.getElementById("ipe-locais");
    if (!sec || !loc) return null;
    if (!document.getElementById("ipr-mb-css")) { var s = el("style"); s.id = "ipr-mb-css"; s.textContent = ESTILO; document.head.appendChild(s); }
    var box = document.getElementById("ipr-mb");
    if (!box) {
      box = el("div"); box.id = "ipr-mb"; box.setAttribute("role", "group"); box.hidden = true;
      box.addEventListener("click", aoClicar); box.addEventListener("change", aoMudar); box.addEventListener("input", aoDeslizar);
    }
    // 30/10/2026: quando «Os meus locais» foi levado para o painel das camadas (ipc-movido), #ipe-locais deixa de ser filho
    // da secção e o insertBefore dava NotFoundError em ciclo. Só se insere antes dele quando ainda está na secção.
    if (loc.parentNode === sec) { if (box.parentNode !== sec || box.nextElementSibling !== loc) sec.insertBefore(box, loc); }
    else if (box.parentNode !== sec) sec.appendChild(box);
    return box;
  }

  function marcar() {
    var raiz = document.getElementById("ipe"), box = document.getElementById("ipr-mb"); if (!raiz) return;
    var sec = box && box.closest(".ipe-sb");
    raiz.classList.toggle("ipr-mb-on", !!(box && !box.hidden && sec && !sec.classList.contains("fechado")));
  }
  document.addEventListener("click", function (e) { try { if (e.target.closest && e.target.closest('.ipe-sb[data-sb="locais"] .ipe-sbh')) setTimeout(marcar, 0); } catch (x) {} });

  var ULT = "";
  // Para o design-projecto.js pedir um redesenho quando tem dados novos.
  window.IPRMinhasBases = { pintar: function () { try { pintar(true); } catch (e) {} } };
  function assinatura(bs) {
    var P = est() || {}, v = viz();
    if (v && !v.__mbN) v.__mbN = ++assinatura.n;
    return [v ? v.__mbN : 0, P.modo, P.actual && P.actual.id, (bs || []).map(function (m) { return m.id + ":" + (Array.isArray(m.downloads) ? m.downloads.length : 0) + ":" + (MEM.ab[m.id] ? 1 : 0); }).join(","),
      activas().join(","), window.IPR_LINGUA || "pt", !!document.querySelector("#ipe-cam .ipr-it"), window.IPRDesign && window.IPRDesign.versao ? window.IPRDesign.versao() : 0].join("|");
  }
  assinatura.n = 0;

  function pintar(forca) {
    var box = caixaMontar(); if (!box) return;
    var bs = bases();
    if (!bs || !bs.length) { box.hidden = true; box.textContent = ""; ULT = ""; marcar(); return; }
    var a = assinatura(bs);
    if (!forca && a === ULT) return;
    var foco = document.activeElement;
    if (!forca && foco && box.contains(foco) && foco.type === "range") return; // não refazer enquanto se arrasta a opacidade
    ULT = a;
    var focoId = foco && box.contains(foco) ? (foco.getAttribute("data-mb-foco") || "") : "";
    box.hidden = false;
    box.setAttribute("aria-label", t("titulo"));
    box.textContent = "";
    var cab = el("div", "ipr-mb-cab"); cab.appendChild(el("span", "", t("titulo"))); cab.appendChild(el("em", "", bs.length)); box.appendChild(cab);
    var ul = el("ul", "ipr-mb-l"), act = activas();
    bs.forEach(function (m) {
      var cs = camadasDe(m), n = nCamadas(cs), na = actual(m), dz = design(m), ab = !!MEM.ab[m.id] && (cs.length > 0 || dz);
      var li = el("li", "ipr-mb-b" + (ab ? " ab" : "") + (na ? " actual" : "")); li.setAttribute("data-mb", String(m.id));
      var bc = el("div", "ipr-mb-bc");
      var bt = el("button", "ipr-mb-bt"); bt.type = "button"; bt.setAttribute("data-mb-acc", "ab"); bt.setAttribute("data-mb-foco", "ab" + m.id);
      bt.setAttribute("aria-expanded", String(ab)); if (!cs.length && !dz) bt.disabled = true;
      bt.appendChild(el("span", "ipr-mb-car"));
      var tt = el("span", "ipr-mb-t"); tt.appendChild(el("b", "", m.local || t("semNome")));
      var meta = [m.area_ha ? num(m.area_ha, 2) + " ha" : "", n ? n + " " + (n === 1 ? t("camada") : t("camadas")) : (m.estado_k === "completed" ? "" : (m.estado || t("prep")))];
      if (m.rever) meta.push(t("rever")); else if (m.dono === false) meta.push(t("partilhado"));
      var sm = el("small", "", meta.filter(Boolean).join(" · "));
      if (na) { sm.appendChild(document.createTextNode(" · ")); sm.appendChild(el("i", "", t("aberta"))); }
      tt.appendChild(sm); bt.appendChild(tt); bc.appendChild(bt);
      if (m.geojson) { var ir = el("button", "ipr-mb-ir", t("ver")); ir.type = "button"; ir.title = t("verT"); ir.setAttribute("aria-label", t("verT")); ir.setAttribute("data-mb-acc", "ver"); ir.setAttribute("data-mb-foco", "ver" + m.id); bc.appendChild(ir); }
      li.appendChild(bc);
      if (ab) li.appendChild(corpo(m, cs, na, act));
      else if (!cs.length && m.estado_k === "completed") { /* entregue sem camadas para o mapa: só a linha */ }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    marcar();
    if (focoId) { var f = box.querySelector('[data-mb-foco="' + sel(focoId) + '"]'); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
  }

  function corpo(m, cs, na, act) {
    var c = el("div", "ipr-mb-corpo");
    c.appendChild(el("div", "ipr-mb-parte", t("parteBase")));
    if (!na) { c.appendChild(el("p", "ipr-mb-nota", t("fora"))); }
    var acc = el("div", "ipr-mb-acc");
    function b(acao, txt, cl) { var x = el("button", cl || "", txt); x.type = "button"; x.setAttribute("data-mb-acc", acao); x.setAttribute("data-mb-foco", acao + m.id); acc.appendChild(x); }
    if (na) { b("todas", t("ligar")); b("nenhuma", t("desligar")); } else b("abrir", t("abrir"), "ac");
    b("ficha", t("ficha"));
    c.appendChild(acc);
    var ul = el("ul", "ipr-mb-cam"), sub = null;
    cs.forEach(function (k) {
      if (k.sub && k.sub !== sub) { ul.appendChild(el("li", "ipr-mb-sub", k.sub)); sub = k.sub; }
      var on = na && act.indexOf(k.id) >= 0, bl = na ? bloqueio(k.id) : "";
      var li = el("li", "ipr-mb-it" + (on ? " on" : "") + (bl ? " bl" : "") + (na ? "" : " fora")); li.setAttribute("data-mb-c", k.id);
      var lab = el("label"), ck = el("input"); ck.type = "checkbox"; ck.checked = on; ck.disabled = !!bl; ck.setAttribute("data-mb-foco", "c" + m.id + k.id);
      lab.appendChild(ck);
      var q = el("i", "ipr-mb-cor"); q.style.background = cor(k.cor); lab.appendChild(q);
      var nm = el("span", "ipr-mb-n", k.nome); if (bl) nm.appendChild(el("small", "", bl)); lab.appendChild(nm);
      li.appendChild(lab);
      if (on && !k.fixo) {
        var v = opacidade(k.id);
        if (v != null) {
          var r = el("input", "ipr-mb-op"); r.type = "range"; r.min = "10"; r.max = "100"; r.value = String(v);
          r.setAttribute("aria-label", t("op") + k.nome); r.setAttribute("data-mb-foco", "o" + m.id + k.id); li.appendChild(r);
        }
      }
      ul.appendChild(li);
    });
    c.appendChild(ul);
    if (!cs.length) c.appendChild(el("p", "ipr-mb-nota", t("sem")));
    // Segunda parte: os desenhos do projecto da Terracrua Design (design-projecto.js). Uma falha ali não estraga a Base.
    if (window.IPRDesign && window.IPRDesign.parte) { try { var dp = window.IPRDesign.parte(m); if (dp) c.appendChild(dp); } catch (e) {} }
    return c;
  }

  // Uma Base aberta de cada vez na lista, para as outras ficarem à vista.
  function so(m) { MEM.ab = {}; MEM.ab[m.id] = 1; }
  function baseDe(no) {
    var li = no && no.closest && no.closest("[data-mb]"); if (!li) return null;
    var id = li.getAttribute("data-mb"), bs = bases() || [];
    for (var i = 0; i < bs.length; i++) if (String(bs[i].id) === id) return bs[i];
    return null;
  }
  function aoClicar(e) { try { aoClicar2(e); } catch (x) {} }
  function aoClicar2(e) {
    var b = e.target.closest && e.target.closest("[data-mb-acc]"); if (!b) return;
    var m = baseDe(b); if (!m) return;
    var a = b.getAttribute("data-mb-acc");
    if (a === "ab") { if (MEM.ab[m.id]) delete MEM.ab[m.id]; else so(m); gravar(MEM); pintar(true); }
    else if (a === "ver") { if (actual(m)) enquadrar(m); else { abrir(m); quando(m, function () { enquadrar(m); pintar(true); }); } }
    else if (a === "abrir") { so(m); gravar(MEM); abrir(m); quando(m, function () { pintar(true); }); }
    else if (a === "todas") ligarTodas(m, true);
    else if (a === "nenhuma") ligarTodas(m, false);
    else if (a === "ficha") verFicha(m);
  }
  function aoMudar(e) { try { aoMudar2(e); } catch (x) {} }
  function aoMudar2(e) {
    var ck = e.target; if (!ck || ck.type !== "checkbox") return;
    var li = ck.closest("[data-mb-c]"), m = baseDe(ck); if (!li || !m) return;
    var id = li.getAttribute("data-mb-c"), on = ck.checked;
    if (actual(m)) { if (!on || !travada(id)) ligar(id, on); pintar(true); return; }
    // Camada de uma Base que não está no mapa: abre-se a Base e liga-se a camada quando o mapa estiver pronto.
    PEND = { m: m, ids: on ? [id] : [] };
    so(m); gravar(MEM);
    abrir(m);
    quando(m, function () { if (PEND && PEND.m === m) { PEND.ids.forEach(function (x) { if (!travada(x)) ligar(x, true); }); PEND = null; } pintar(true); });
  }
  function aoDeslizar(e) { try { aoDeslizar2(e); } catch (x) {} }
  function aoDeslizar2(e) {
    var r = e.target; if (!r || r.type !== "range") return;
    var li = r.closest("[data-mb-c]"); if (!li) return;
    mudarOpacidade(li.getAttribute("data-mb-c"), +r.value);
  }

  // ---------- abertura: a partir da ficha do projecto (?mapa=N) ou na primeira visita com uma só Base ----------
  var mexeu = false, mapaVigiado = null;
  function vigiar() {
    var M = mapa(); if (!M || M === mapaVigiado) return; mapaVigiado = M;
    try { var c = M.getCanvasContainer(); ["mousedown", "touchstart", "wheel", "keydown"].forEach(function (v) { c.addEventListener(v, function () { mexeu = true; }, { passive: true }); }); } catch (e) {}
  }
  function abrirSeccao() {
    var sec = document.querySelector('#ipe-esq .ipe-sb[data-sb="locais"]'); if (!sec || !sec.classList.contains("fechado")) return;
    sec.classList.remove("fechado"); // sem gravar: a preferência da pessoa (ipe_sb_v1) fica como estava
    var h = sec.querySelector(".ipe-sbh"); if (h) h.setAttribute("aria-expanded", "true");
  }
  function sessaoFeita() { try { return sessionStorage.getItem("ipr_mb_auto") === "1"; } catch (e) { return false; } }
  function sessaoMarcar() { try { sessionStorage.setItem("ipr_mb_auto", "1"); } catch (e) {} }
  function arranque() {
    // Nunca tomar conta da encomenda: com ?modo=encomenda, ou com o Atlas fora do modo cliente, não há abertura automática.
    if (Q.get("modo") === "encomenda") return true;
    var P = est();
    if (P && P.modo && P.modo !== "cliente") return true;
    var bs = bases(); if (!bs) return false;
    if (window.__iprMbAuto) return true;
    window.__iprMbAuto = 1; // uma vez por página
    var alvo = null, origem = "";
    var pedido = Q.get("mapa");
    var comCamadas = bs.filter(function (m) { return nCamadas(camadasDe(m)) > 0; });
    if (pedido) { alvo = comCamadas.filter(function (m) { return String(m.id) === String(pedido); })[0] || null; origem = "ficha"; }
    else if (!MEM.visto && !sessaoFeita() && comCamadas.length === 1 && bs.filter(function (m) { return !m.rever; }).length === 1) {
      // primeira visita: só se o registo de «já visto» ficar guardado (sem isso repetir-se-ia a cada entrada)
      MEM.visto = 1;
      if (gravar(MEM)) { alvo = comCamadas[0]; origem = "primeira"; sessaoMarcar(); }
    }
    if (bs.length && !MEM.visto) { MEM.visto = 1; gravar(MEM); }
    if (!alvo) return true;
    if (!actual(alvo) && !abrir(alvo, true)) return true; // a Base aberta é outra: não se muda nada sozinho
    so(alvo); gravar(MEM);
    abrirSeccao();
    quando(alvo, function () {
      vigiar();
      ligarIniciais(alvo);
      pintar(true);
      var sec = document.querySelector('#ipe-esq .ipe-sb[data-sb="locais"]');
      if (sec && sec.scrollIntoView) try { sec.scrollIntoView({ block: "nearest" }); } catch (e) {}
      // Enquadrar: com ?mapa= faz o enquadrar.js (salta a abertura animada); sem ele, ou desligado, enquadra-se aqui.
      var porMim = origem === "primeira" || !window.__iprEnquadrar;
      if (origem === "ficha" && (window.IPR_ENQUADRAR_OFF || Q.get("enquadrar") === "0" || /[?&](c|ll|cam|v)=/.test(location.search))) porMim = false;
      if (origem === "primeira" && /[?&](v|c|ll|cam|nic)=/.test(location.search)) porMim = false;
      if (porMim) {
        var t0 = Date.now();
        (function esperar() {
          if (mexeu || Date.now() - t0 > 30000) return;
          if (window.__ipeAb || document.querySelector(".ipe-ab-saltar")) { setTimeout(esperar, 400); return; }
          enquadrar(alvo, 800);
        })();
      }
    }, 30000);
    return true;
  }

  // ---------- ciclo ----------
  var arrancou = false, n = 0;
  function ciclo() {
    n++;
    try {
      if (!arrancou) arrancou = arranque() || false;
      if (!arrancou && n > 80) arrancou = true; // 40 s sem os mapas da conta: segue sem a abertura automática
      pintar();
      marcar();
      // Dados carregados e nada para mostrar (sem Bases ou área fechada): pára.
      var P = est();
      if (P && P.dados && (P.dados.bloqueado || !(bases() || []).length)) return;
    } catch (e) {}
    setTimeout(ciclo, arrancou ? 2000 : 500);
  }
  setTimeout(ciclo, 500);
  function observar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) { setTimeout(observar, 500); return; }
    try { new MutationObserver(function () { clearTimeout(observar.t); observar.t = setTimeout(function () { try { pintar(); } catch (e) {} }, 120); }).observe(cam, { childList: true, subtree: true }); } catch (e) {}
  }
  observar();
  document.addEventListener("ipr:lingua", function () { try { pintar(true); } catch (e) {} });
})();
