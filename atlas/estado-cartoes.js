/* IPR Atlas · estado-cartoes.js (31/10/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 01h54: «quero ter ali um botãozinho a dizer, de cada projecto, base cartográfica carregada, projecto carregado,
   outros ficheiros». Cada cartão do separador Projectos passa a ter uma linha com três indicações:
   1. Base Cartográfica: «carregada · 18 camadas» quando a entrega tem as camadas todas; «faltam N camadas» (com a lista ao
      passar o rato) quando está entregue mas incompleta; o estado da encomenda quando ainda está a ser preparada ou revista.
      Lido da lista dos projectos que o Atlas já tem (sem pedidos novos).
   2. Projecto Terracrua Design: «carregado» quando há na organização um grupo de desenhos com o número do projecto (o que
      o «Carregar ficheiros» e a conversão põem no mapa); senão «por carregar». Um só pedido por página (org/grupos-meus).
   3. Ficheiros: quantos há em «Ficheiros do projecto» desse cartão. Tocar abre essa caixa. Lidos um de cada vez, com pausa,
      só para os cartões à vista, e guardados 15 minutos neste separador (regra de carga de 31/10: nada de pedidos em massa).
   As indicações são texto, não botões, excepto «Ficheiros», que abre a caixa real.
   Desligar: ?ecartoes=0 ou localStorage ipr_ecartoes_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ecartoes=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ecartoes_off") === "1") return; } catch (e) {}
  var CAMADAS = ["mdt", "somb_bw", "curvas025", "curvas05", "curvas1", "curvas2", "curvas5", "declives", "exposicao", "geomorphons", "vento", "streams", "festos", "acumulacao", "bacias_l", "twi", "erosao", "escorrencia"];
  var NOMES = { mdt: "MDT", somb_bw: "sombreamento", curvas025: "curvas 0,25 m", curvas05: "curvas 0,5 m", curvas1: "curvas 1 m", curvas2: "curvas 2 m", curvas5: "curvas 5 m", declives: "declives", exposicao: "exposição", geomorphons: "geomorfologia", vento: "vento", streams: "linhas de água", festos: "festos", acumulacao: "acumulação", bacias_l: "bacias", twi: "humidade (TWI)", erosao: "erosão", escorrencia: "escorrência" };
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function est() { return W.__ipe && W.__ipe.estado || null; }

  var css = D.createElement("style");
  css.textContent =
    ".ipr-ec{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 2px}" +
    "#ipe-proj .ipr-ec span,#ipe-proj .ipr-ec button,.ipr-ec span,.ipr-ec button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:99px;font:600 10.5px/1.5 Inter,system-ui,sans-serif;letter-spacing:.01em;border:1px solid var(--ln2,rgba(127,127,127,.3));color:var(--mu,#9aa08f);white-space:normal;max-width:100%}" +
    ".ipr-ec i{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}" +
    ".ipr-ec .ok{color:#9BC53D;border-color:rgba(155,197,61,.45)}" +
    ".ipr-ec .av{color:#d9a441;border-color:rgba(217,164,65,.5)}" +
    "#ipe-proj .ipr-ec button{cursor:pointer}#ipe-proj .ipr-ec button:hover,#ipe-proj .ipr-ec button:focus-visible{border-color:var(--ac,#b5c46a);color:var(--tx,#e9eadf)}";
  (D.head || D.documentElement).appendChild(css);

  // 1. Base Cartográfica, a partir do cartão já carregado
  function base(m) {
    var tem = {};
    (m.downloads || []).forEach(function (d) {
      var n = String(d && d.nome || "").split("/").pop().toLowerCase();
      var x = /^([a-z0-9_]+)\.(pmtiles|geojson)$/.exec(n); if (x) tem[x[1]] = 1;
    });
    var falta = CAMADAS.filter(function (c) { return !tem[c]; });
    var n = CAMADAS.length - falta.length;
    if (m.estado_k && m.estado_k !== "completed") return { c: "", t: T("Base: ", "Base: ") + (m.estado || T("em preparação", "in preparation")).toLowerCase(), d: "" };
    if (!n) return { c: "av", t: T("Base: sem camadas no mapa", "Base: no map layers"), d: T("A entrega não tem camadas para o mapa. A equipa foi avisada no registo.", "") };
    if (!falta.length) return { c: "ok", t: T("Base Cartográfica carregada · " + n + " camadas", "Base map loaded · " + n + " layers"), d: "" };
    return { c: "av", t: T("Base carregada · faltam " + falta.length, "Base loaded · " + falta.length + " missing"), d: T("Em falta: ", "Missing: ") + falta.map(function (c) { return NOMES[c] || c; }).join(", ") };
  }

  // 2. Projecto Terracrua Design: grupos de desenhos da organização (um pedido por página)
  var GR = null, grPedido = false;
  function api(rota) {
    return fetch("/wp-json/tcd/v1/" + rota, { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce || "" } })
      .then(function (r) { if (!r.ok) throw new Error("" + r.status); return r.json(); });
  }
  function grupos() {
    if (GR || grPedido || !W.tcdNonce) return;
    grPedido = true;
    api("org/grupos-meus").then(function (j) {
      GR = {};
      ((j && j.grupos) || []).forEach(function (g) { var x = /^\s*(\d{2,4}(?:\.\d{2})?)\s/.exec(String(g.nome || "")); if (x) GR[x[1]] = (GR[x[1]] || 0) + 1; });
      tudo();
    }).catch(function () { GR = {}; tudo(); });
  }
  function numProj(m) { var x = /^\s*(\d{2,4}(?:\.\d{2})?)\s/.exec(String(m.local || "")); return x ? x[1] : ""; }

  // 3. Ficheiros do projecto: um pedido de cada vez, só para os cartões à vista, com cache de 15 min
  var FX = {}, fila = [], aCorrer = false;
  try { FX = JSON.parse(sessionStorage.getItem("ipr_ec_fx") || "{}") || {}; } catch (e) { FX = {}; }
  function guardaFx() { try { sessionStorage.setItem("ipr_ec_fx", JSON.stringify(FX)); } catch (e) {} }
  function fresco(id) { var f = FX[id]; return f && Date.now() - f.t < 15 * 60000; }
  function pedeFx(id) { if (!W.tcdNonce || fresco(id) || fila.indexOf(id) >= 0) return; fila.push(id); corre(); }
  function corre() {
    if (aCorrer || !fila.length || D.hidden) return;
    aCorrer = true;
    var id = fila.shift();
    api("pfich?alvo=" + encodeURIComponent("e:" + id)).then(function (j) {
      FX[id] = { t: Date.now(), n: ((j && j.ficheiros) || []).length }; guardaFx(); tudo();
    }).catch(function () {}).then(function () { setTimeout(function () { aCorrer = false; corre(); }, 1200); });
  }
  var vista = null;
  try {
    vista = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && e.target.dataset.ecId) { pedeFx(e.target.dataset.ecId); vista.unobserve(e.target); } });
    });
  } catch (e) {}

  function chip(cl, txt, dica) {
    var s = D.createElement("span"); if (cl) s.className = cl;
    s.appendChild(D.createElement("i")); s.appendChild(D.createTextNode(txt));
    if (dica) s.title = dica;
    return s;
  }
  function linha(card, m) {
    var id = String(m.id || m.encomenda || ""); if (!id) return;
    var b = base(m), np = numProj(m);
    var chave = [b.t, np && GR ? (GR[np] ? 1 : 0) : "-", fresco(id) ? FX[id].n : "-"].join("|");
    var L = card.querySelector(".ipr-ec");
    if (L && L.dataset.k === chave) return;
    if (!L) {
      L = D.createElement("div"); L.className = "ipr-ec";
      ["click", "mousedown", "pointerdown", "touchstart"].forEach(function (t) { L.addEventListener(t, function (e) { if (!e.target.closest("button")) return; e.stopPropagation(); }); });
      var ct = card.querySelector(".ipe-ct") || card, st = ct.querySelector("strong");
      if (st && st.parentNode === ct && st.nextSibling) ct.insertBefore(L, st.nextSibling); else ct.appendChild(L);
      card.dataset.ecId = id;
      if (vista) vista.observe(card); else pedeFx(id);
    }
    L.dataset.k = chave; L.textContent = "";
    L.appendChild(chip(b.c, b.t, b.d));
    if (np) {
      if (!GR) L.appendChild(chip("", T("Projecto: a ver…", "Project: checking…")));
      else if (GR[np]) L.appendChild(chip("ok", T("Projecto Terracrua Design carregado", "Terracrua Design project loaded"), T(GR[np] + (GR[np] === 1 ? " grupo" : " grupos") + " de desenhos na organização com o número " + np, "")));
      else L.appendChild(chip("", T("Projecto Terracrua Design por carregar", "Terracrua Design project not loaded"), T("Ainda não há desenhos do projecto " + np + " na organização. Carregue-os em «Ficheiros do projecto».", "")));
    }
    if (W.tcdNonce) {
      var bt = D.createElement("button"); bt.type = "button";
      var n = fresco(id) ? FX[id].n : null;
      if (n) bt.className = "ok";
      bt.appendChild(D.createElement("i"));
      bt.appendChild(D.createTextNode(n === null ? T("Ficheiros", "Files") : n ? T("Ficheiros: " + n, "Files: " + n) : T("Sem outros ficheiros", "No other files")));
      bt.title = T("Abrir «Ficheiros do projecto» deste cartão", "Open this card's project files");
      bt.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var cx = card.querySelector(".ipr-pf73");
        if (cx && getComputedStyle(cx).display === "none") { var mais = card.querySelector('.ipr-pc-t[aria-expanded="false"]'); if (mais) mais.click(); }
        if (cx) { cx.open = true; try { cx.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (x) {} delete FX[id]; guardaFx(); setTimeout(function () { pedeFx(id); }, 4000); }
      });
      L.appendChild(bt);
    }
  }
  function tudo() {
    var P = est(); if (!P || !P.mapas) return;
    var cs = D.querySelectorAll("#ipe-proj .ipe-card[data-i]"); if (!cs.length) return;
    if (W.tcdNonce) grupos();
    for (var i = 0; i < cs.length; i++) { var m = P.mapas[+cs[i].dataset.i]; if (m) try { linha(cs[i], m); } catch (e) {} }
  }
  setInterval(function () { if (!D.hidden) tudo(); }, 1500);
  D.addEventListener("visibilitychange", function () { if (!D.hidden) corre(); });
})();
