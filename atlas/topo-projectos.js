/* IPR Atlas · topo-projectos.js (30/10/2026, pedidos do Nuno)
   Ficheiro acrescentado: não altera nenhum ficheiro existente; liga-se em tempo de execução ao DOM do Atlas.
   1. Texto do topo sem repetir «IPR»: o assistente.js escreve «IPR Atlas · plataforma territorial do IPR» no #ipe-ctx-t.
      Esse texto não é tocado (o observador do assistente.js voltaria a escrevê-lo); fica escondido por CSS e mostra-se
      «Plataforma territorial» / «Ver, medir e encomendar o seu terreno» por ::before, a partir de atributos data-*.
      Com um projecto de cliente aberto (sem .ipr-as-eco), o texto original fica como está.
   2. Mais espaço entre os elementos do topo no computador.
   3. Botão «Comprar passo a passo» no centro do topo (abre o assistente). O botão de baixo (#ipr-as-b) continua.
      Em ?modo=encomenda o assistente abre sozinho uma vez por sessão do navegador, se não houver terreno nem outra janela.
   4. «Os meus projectos» (bloco da esquerda, #ipr-mb do minhas-bases.js) mostra só o projecto aberto, com o título
      «Projecto aberto»; o cabeçalho abre e fecha. A lista completa continua no painel da direita (separador Projectos).
   5. Puxadores das larguras dos painéis (.ipr-px do ajustes.js §2): arrasto próprio, mais robusto, com as mesmas chaves
      (tcd_atlas_wl / tcd_atlas_wr) e os mesmos limites.
   6. Separador «Organização» do painel da direita escondido (autorização do Nuno, 30/10, 19h30). Volta a ver-se com
      localStorage ipr_topo_org=1.
   Desligar tudo: ?topo=0 ou localStorage ipr_topo_off=1. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.__iprTopoProj) return; W.__iprTopoProj = 1;
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v === "" || v == null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch (e) {} }
  try { if (/[?&]topo=0(&|$)/.test(location.search) || ler("ipr_topo_off") === "1") return; } catch (e) {}

  function $(id) { return D.getElementById(id); }
  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2).toLowerCase() === "en"; }
  var TX = {
    pt: { t: "Plataforma territorial", r: "Ver, medir e encomendar o seu terreno", b: "Comprar passo a passo", bs: "Base · Leitura · Planta", bt: "Abrir o assistente de compra", mb: "Projecto aberto", mbA: "Mostrar ou esconder o projecto aberto" },
    en: { t: "Land platform", r: "See, measure and order your land", b: "Buy step by step", bs: "Base · Reading · Plan", bt: "Open the purchase assistant", mb: "Open project", mbA: "Show or hide the open project" }
  };
  function t(k) { return (en() ? TX.en : TX.pt)[k]; }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function desk() { return !W.matchMedia || W.matchMedia("(min-width:901px)").matches; }

  // ───────── estilos ─────────
  var CSS =
    // 1. texto do topo
    "#ipe .ipe-ctx.ipr-as-eco #ipe-ctx-t[data-ipr-as=\"1\"][data-ipr-tp],#ipe .ipe-ctx.ipr-as-eco #ipe-ctx-r[data-ipr-tp]{font-size:0!important;color:transparent!important;letter-spacing:0!important}" +
    "#ipe .ipe-ctx.ipr-as-eco #ipe-ctx-t[data-ipr-as=\"1\"][data-ipr-tp]::before{content:attr(data-ipr-tp);font-size:var(--ipr-tp-fs,14px);letter-spacing:var(--ipr-tp-ls,normal);color:var(--tx,#e9eadf)}" +
    "#ipe .ipe-ctx.ipr-as-eco #ipe-ctx-r[data-ipr-tp]::before{content:attr(data-ipr-tp);font-size:var(--ipr-tp-fs,11px);letter-spacing:var(--ipr-tp-ls,normal);color:var(--mu,#9aa08f)}" +
    "#ipe .ipe-ctx.ipr-as-eco:hover #ipe-ctx-r[data-ipr-tp]::before{color:#94BE39}" +
    // 2. espaço no topo (computador)
    "@media (min-width:901px){#ipe header.ipe-top{column-gap:20px;padding-left:20px;padding-right:18px}#ipe header.ipe-top>.ipe-vsep{margin-left:2px;margin-right:2px}}" +
    // 3. botão do assistente no centro do topo
    "#ipr-tp-meio{display:none}" +
    "@media (min-width:1100px){#ipe header.ipe-top>#ipr-tp-meio{display:flex;flex:1 1 0;min-width:0;overflow:hidden;justify-content:center;align-items:center;align-self:stretch}}" +
    "#ipr-tp-meio.ipr-tp-aperto #ipr-tp-as{visibility:hidden}#ipe header.ipe-top>#ipr-tp-meio[hidden]{display:none!important}" +
    "#ipr-tp-as{display:inline-flex;align-items:center;gap:10px;min-height:40px;max-width:100%;padding:4px 16px 4px 6px;border-radius:2px;border:1px solid #94BE39;background:#14200F;color:#E4E2D8;cursor:pointer;font:600 13.5px/1.15 Inter,system-ui,sans-serif;text-align:left;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "#ipr-tp-as:hover,#ipr-tp-as:focus-visible{background:#1B2816;outline:none;box-shadow:0 0 0 2px rgba(148,190,57,.45)}" +
    "#ipr-tp-as .ic{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:2px;background:#94BE39;color:#0F170B}" +
    "#ipr-tp-as small{display:block;margin-top:2px;font:500 10.5px/1.2 'IBM Plex Mono',monospace;color:#9AA088;text-transform:uppercase;letter-spacing:.06em}" +
    "#ipe.ipr-as-on #ipr-tp-meio #ipr-tp-as{visibility:hidden}" +
    // 4. «Os meus projectos» no bloco da esquerda: só o projecto aberto
    // (o assistente.js força #ipr-mb a display:block!important com «#ipe #ipe-esq .ipe-sb.ipc-movido #ipr-mb:not([hidden])»; estas
    // regras têm mais especificidade). As versões com :has valem já na primeira pintura, antes de o JavaScript pôr as classes.
    "#ipe #ipr-mb.ipr-tp-so,#ipe #ipr-mb:has(>ul.ipr-mb-l){max-height:38vh}" +
    "#ipe #ipe-esq #ipr-mb.ipr-tp-nada.ipr-tp-nada.ipr-tp-nada.ipr-tp-nada," +
    "#ipe #ipe-esq #ipr-mb:has(>ul.ipr-mb-l>li.ipr-mb-b):not(:has(>ul.ipr-mb-l>li.ipr-mb-b.actual)):not(:has(>ul.ipr-mb-l>li.ipr-mb-b.ab)){display:none!important}" +
    "#ipe #ipe-esq .ipe-sb.ipc-movido.ipc-movido:has(#ipr-mb.ipr-tp-nada){display:none!important}" +
    "#ipe #ipr-mb.ipr-tp-a>ul.ipr-mb-l>li.ipr-mb-b:not(.actual),#ipe #ipr-mb.ipr-tp-b>ul.ipr-mb-l>li.ipr-mb-b:not(.ab)," +
    "#ipe #ipr-mb:has(>ul.ipr-mb-l>li.ipr-mb-b.actual)>ul.ipr-mb-l>li.ipr-mb-b:not(.actual)," +
    "#ipe #ipr-mb:not(:has(>ul.ipr-mb-l>li.ipr-mb-b.actual)):has(>ul.ipr-mb-l>li.ipr-mb-b.ab)>ul.ipr-mb-l>li.ipr-mb-b:not(.ab){display:none!important}" +
    "#ipe #ipr-mb>.ipr-mb-cab em{display:none}" +
    "#ipr-mb .ipr-mb-cab[data-ipr-tp]{cursor:pointer;user-select:none;min-height:30px;align-items:center;padding-top:6px;padding-bottom:6px}" +
    "#ipr-mb .ipr-mb-cab[data-ipr-tp]::before{content:'\\25BE';display:inline-block;width:10px;font-size:11px;color:var(--mu,#9aa08f)}" +
    "#ipr-mb.ipr-tp-min .ipr-mb-cab[data-ipr-tp]::before{content:'\\25B8'}" +
    "#ipr-mb .ipr-mb-cab[data-ipr-tp]:hover,#ipr-mb .ipr-mb-cab[data-ipr-tp]:focus-visible{color:var(--tx,#e9eadf);outline:none}" +
    "#ipe #ipr-mb.ipr-tp-min{max-height:none!important;overflow:visible}" +
    "#ipe #ipr-mb.ipr-tp-min>ul.ipr-mb-l{display:none!important}" +
    // 5. puxadores: um pouco mais largos para acertar com o rato
    "@media (min-width:901px) and (pointer:fine){#ipe .ipr-px{width:9px}#ipe .ipr-px-wl{left:calc(var(--wl) - 4px)}#ipe .ipr-px-wr{right:calc(var(--wr) - 4px)}}" +
    "#ipe.ipr-tp-arr,#ipe.ipr-tp-arr *{cursor:col-resize!important;user-select:none!important}" +
    "#ipe.ipr-tp-arr .ipr-px{background:rgba(148,190,57,.35)}";
  var CSS_ORG = "#ipe .ipe-tab[data-tab=\"org\"]{display:none!important}";
  function estilos() {
    if ($("ipr-tp-css")) return;
    var s = D.createElement("style"); s.id = "ipr-tp-css"; s.textContent = CSS + (ler("ipr_topo_org") === "1" ? "" : CSS_ORG);
    (D.head || D.documentElement).appendChild(s);
  }

  // ───────── 1. texto do topo ─────────
  function topo() {
    var tt = $("ipe-ctx-t"), tr = $("ipe-ctx-r"); if (!tt || !tr) return;
    [[tt, "t"], [tr, "r"]].forEach(function (p) {
      var el = p[0], v = t(p[1]);
      if (el.getAttribute("data-ipr-tp") == null) { // tamanho e espaçamento originais, medidos antes de esconder o texto
        var cs = getComputedStyle(el);
        el.style.setProperty("--ipr-tp-fs", cs.fontSize);
        if (cs.letterSpacing && cs.letterSpacing !== "normal") el.style.setProperty("--ipr-tp-ls", cs.letterSpacing);
      }
      if (el.getAttribute("data-ipr-tp") !== v) el.setAttribute("data-ipr-tp", v);
    });
  }

  // ───────── 3. botão do assistente no topo e abertura automática ─────────
  function icone() {
    var ns = "http://www.w3.org/2000/svg", s = D.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "18"); s.setAttribute("height", "18"); s.setAttribute("aria-hidden", "true");
    var p = D.createElementNS(ns, "path"); p.setAttribute("d", "M5 12.5l4.2 4.2L19 7"); p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2.4"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    s.appendChild(p); return s;
  }
  function botaoTopo() {
    var top = D.querySelector("#ipe header.ipe-top"); if (!top) return;
    var w = $("ipr-tp-meio");
    if (typeof W.__iprAssistenteAbrir !== "function") { if (w) w.hidden = true; return; }
    if (!w) {
      w = D.createElement("span"); w.id = "ipr-tp-meio";
      var b = D.createElement("button"); b.type = "button"; b.id = "ipr-tp-as";
      var ic = D.createElement("span"); ic.className = "ic"; ic.appendChild(icone()); b.appendChild(ic);
      var tx = D.createElement("span"), l1 = D.createElement("span"), l2 = D.createElement("small");
      l1.className = "l1"; tx.appendChild(l1); tx.appendChild(l2); b.appendChild(tx);
      b.addEventListener("click", function (e) { e.preventDefault(); try { W.__iprAssistenteAbrir(); } catch (x) {} });
      w.appendChild(b);
    }
    w.hidden = false;
    var bt = w.firstChild, l1b = bt.querySelector(".l1"), l2b = bt.querySelector("small");
    if (l1b.textContent !== t("b")) l1b.textContent = t("b");
    if (l2b.textContent !== t("bs")) l2b.textContent = t("bs");
    if (bt.title !== t("bt")) { bt.title = t("bt"); bt.setAttribute("aria-label", t("b") + ". " + t("bs")); }
    var tr = top.querySelector(":scope > .ipe-tr"), ctx = top.querySelector(":scope > .ipe-ctx");
    if (tr) { if (w.nextElementSibling !== tr || w.parentNode !== top) top.insertBefore(w, tr); }
    else if (ctx) { if (w.previousElementSibling !== ctx) top.insertBefore(w, ctx.nextSibling); }
    else if (w.parentNode !== top) top.appendChild(w);
    // sem espaço livre suficiente (ecrãs mais estreitos, textos longos), o botão não aparece em vez de tapar o resto
    var cabe = !w.clientWidth || bt.offsetWidth + 16 <= w.clientWidth;
    w.classList.toggle("ipr-tp-aperto", !cabe);
  }
  function janelaAberta() { // devolve o motivo (texto) ou ""
    var R = $("ipe"); if (R && R.classList.contains("ipr-as-on")) return "assistente";
    if (D.documentElement.classList.contains("ipr-tri-on")) return "tri-on";
    var tri = $("ipr-tri"); if (tri && !tri.hidden && !tri.classList.contains("min") && tri.offsetParent !== null) return "tri";
    if ($("ipr-ini") || $("ipr-as-eco") || $("ipr-as-pn")) return "inicio/eco/pn";
    var ds = D.querySelectorAll('[role="dialog"],[aria-modal="true"],dialog[open]');
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i]; if (d.closest && d.closest("#ipr-tri.min")) continue;
      var r = d.getBoundingClientRect(); if (r.width > 40 && r.height > 40 && getComputedStyle(d).visibility !== "hidden") return "dialog:" + (d.id || d.className || d.tagName);
    }
    return "";
  }
  function terrenoEscolhido() {
    var a = $("ipe-area"); var s = a ? String(a.textContent || "").trim() : "";
    return !!(s && s !== "—" && s !== "-");
  }
  function autoAbrir() {
    if (!/[?&]modo=encomenda(&|$)/.test(location.search)) return;
    try { if (sessionStorage.getItem("ipr_topo_as_auto") || sessionStorage.getItem("ipr_as_auto") === "1") return; } catch (e) { return; }
    var n = 0;
    (function tentar() {
      if (typeof W.__iprAssistenteAbrir !== "function" || !$("ipe-area") || !mapa()) { if (++n < 40) setTimeout(tentar, 500); return; }
      if (!tentar.pronto) { tentar.pronto = 1; setTimeout(tentar, 1500); return; } // cerca de 1,5 s depois de o Atlas estar pronto
      W.__iprTopoAuto = terrenoEscolhido() ? "terreno" : $("ipr-tri") ? "triagem" : janelaAberta();
      // o aviso dos cookies (#tcdck) aparece na primeira visita: espera-se que a pessoa responda e abre-se a seguir
      if (/^dialog:tcdck/.test(W.__iprTopoAuto)) { if (++n < 200) { tentar.pronto = 0; setTimeout(tentar, 1000); } return; }
      // a triagem do ajustes.js §63 (#ipr-tri) já apareceu nesta visita: é ela que orienta, o assistente não se abre por cima
      if (W.__iprTopoAuto) return; // não interrompe: fica para outra visita nesta sessão
      // o assistente.js v2 (30/10, 19h36) já abre sozinho uma vez por sessão (ipr_as_auto): se já o fez, não se repete
      try { if (sessionStorage.getItem("ipr_as_auto") === "1") return; sessionStorage.setItem("ipr_topo_as_auto", "1"); sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) { return; }
      try { W.__iprAssistenteAbrir(); } catch (e) {}
    })();
  }

  // ───────── 4. «Os meus projectos»: só o projecto aberto, cabeçalho que abre e fecha ─────────
  function mbDecorar() {
    var box = $("ipr-mb"); if (!box) return;
    var cab = box.querySelector(":scope > .ipr-mb-cab");
    var lis = box.querySelectorAll(":scope > ul.ipr-mb-l > li.ipr-mb-b");
    var temA = box.querySelector(":scope > ul.ipr-mb-l > li.ipr-mb-b.actual"), temB = box.querySelector(":scope > ul.ipr-mb-l > li.ipr-mb-b.ab");
    var cl = box.classList;
    cl.add("ipr-tp-so");
    cl.toggle("ipr-tp-a", !!temA);
    cl.toggle("ipr-tp-b", !temA && !!temB);
    cl.toggle("ipr-tp-nada", !!lis.length && !temA && !temB);
    var min = ler("ipr_tp_mb_min") === "1";
    cl.toggle("ipr-tp-min", min);
    if (!cab) return;
    var sp = cab.querySelector("span");
    if (sp && sp.textContent !== t("mb")) sp.textContent = t("mb");
    if (cab.getAttribute("data-ipr-tp") !== "1") {
      cab.setAttribute("data-ipr-tp", "1"); cab.setAttribute("role", "button"); cab.tabIndex = 0; cab.title = t("mbA");
    }
    var ex = String(!min); if (cab.getAttribute("aria-expanded") !== ex) cab.setAttribute("aria-expanded", ex);
  }
  function mbAlternar() {
    var box = $("ipr-mb"); if (!box) return;
    gravar("ipr_tp_mb_min", box.classList.contains("ipr-tp-min") ? "0" : "1");
    mbDecorar();
  }
  D.addEventListener("click", function (e) {
    try {
      var c = e.target && e.target.closest && e.target.closest("#ipr-mb > .ipr-mb-cab[data-ipr-tp]"); if (!c) return;
      if (e.target.closest("button,a,input,select,textarea")) return;
      e.preventDefault(); mbAlternar();
    } catch (x) {}
  }, true);
  D.addEventListener("keydown", function (e) {
    try {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      var c = e.target && e.target.closest && e.target.closest("#ipr-mb > .ipr-mb-cab[data-ipr-tp]"); if (!c || c !== e.target) return;
      e.preventDefault(); mbAlternar();
    } catch (x) {}
  }, true);
  var mbObs = null, mbVisto = null;
  function mbVigiar() {
    var box = $("ipr-mb"); if (!box) return;
    if (mbVisto === box) return; mbVisto = box;
    if (mbObs) try { mbObs.disconnect(); } catch (e) {}
    // só childList do próprio #ipr-mb (o minhas-bases.js refaz os filhos); as nossas mudanças são classes e texto dentro do
    // cabeçalho, que não disparam este observador, por isso não há ciclo
    try { mbObs = new MutationObserver(function () { try { mbDecorar(); } catch (e) {} }); mbObs.observe(box, { childList: true }); } catch (e) {}
    mbDecorar();
  }

  // ───────── 5. puxadores das larguras ─────────
  // Ver o relatório: o arrasto do ajustes.js depende de setPointerCapture no próprio puxador e de pointermove nesse elemento.
  // Aqui o arrasto escuta na janela (não perde o rato se o puxador for tapado ou deixar de ter a captura) e escreve as duas
  // variáveis (--ipr-* e --wl/--wr com !important em linha, que ganha às folhas do ajustes.js §65/§67).
  var LIM = { wl: [180, 560, 260], wr: [200, 600, 320] };
  var ARR = null;
  function aplicar(ipe, k, v) {
    ipe.style.setProperty("--ipr-" + k, v + "px");
    ipe.style.setProperty("--" + k, v + "px", "important");
  }
  function redim() { var M = mapa(); if (M && M.resize) try { M.resize(); } catch (e) {} }
  function puxadorEm(ev) {
    var h = ev.target && ev.target.closest && ev.target.closest("#ipe > .ipr-px");
    if (h) return h;
    // se outro elemento tapar o puxador, procura-o pela posição do rato
    if (!D.elementsFromPoint) return null;
    var els = D.elementsFromPoint(ev.clientX, ev.clientY);
    for (var i = 0; i < els.length && i < 6; i++) {
      if (els[i].classList && els[i].classList.contains("ipr-px") && els[i].parentNode === $("ipe")) {
        // só se o que está por cima não for um controlo
        for (var j = 0; j < i; j++) if (els[j].closest && els[j].closest("button,a,input,select,textarea,label,[role=button],[role=dialog]")) return null;
        return els[i];
      }
    }
    return null;
  }
  function inicio(ev) {
    try {
      if (ev.button !== 0 && ev.pointerType === "mouse") return;
      if (!desk()) return;
      var h = puxadorEm(ev); if (!h) return;
      var ipe = $("ipe"); if (!ipe) return;
      var k = h.classList.contains("ipr-px-wl") ? "wl" : h.classList.contains("ipr-px-wr") ? "wr" : ""; if (!k) return;
      ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      ARR = { k: k, id: ev.pointerId, ipe: ipe, h: h, raf: 0, x: ev.clientX };
      try { h.setPointerCapture(ev.pointerId); } catch (e) {}
      ipe.classList.add("ipr-tp-arr");
    } catch (e) { ARR = null; }
  }
  function valor(x) {
    var k = ARR.k, r = ARR.ipe.getBoundingClientRect();
    var v = k === "wl" ? x - r.left : r.right - x;
    return Math.max(LIM[k][0], Math.min(LIM[k][1], Math.round(v)));
  }
  function mover(ev) {
    if (!ARR || (ARR.id != null && ev.pointerId !== ARR.id)) return;
    try {
      ev.preventDefault(); ARR.x = ev.clientX;
      if (ARR.raf) return;
      ARR.raf = requestAnimationFrame(function () {
        if (!ARR) return; ARR.raf = 0;
        aplicar(ARR.ipe, ARR.k, valor(ARR.x)); redim();
      });
    } catch (e) {}
  }
  function fim(ev) {
    if (!ARR || (ARR.id != null && ev.pointerId !== ARR.id)) return;
    var A = ARR; ARR = null;
    try {
      if (A.raf) cancelAnimationFrame(A.raf);
      ARR = A; var v = valor(ev.type === "pointercancel" ? A.x : ev.clientX); ARR = null;
      aplicar(A.ipe, A.k, v); gravar("tcd_atlas_" + A.k, v);
      try { A.h.releasePointerCapture(A.id); } catch (e) {}
      A.ipe.classList.remove("ipr-tp-arr");
      redim(); setTimeout(redim, 80);
      try { W.dispatchEvent(new Event("resize")); } catch (e) {} // o ajustes.js reposiciona a Formiga e os «Cookies» no resize
    } catch (e) { try { A.ipe.classList.remove("ipr-tp-arr"); } catch (x) {} }
  }
  function repor(ev) {
    try {
      var h = ev.target && ev.target.closest && ev.target.closest("#ipe > .ipr-px"); if (!h) return;
      var ipe = $("ipe"), k = h.classList.contains("ipr-px-wl") ? "wl" : "wr";
      // o ajustes.js também trata o duplo clique (tira --ipr-*); aqui tira também --wl/--wr e a chave guardada
      ipe.style.removeProperty("--ipr-" + k); ipe.style.removeProperty("--" + k); gravar("tcd_atlas_" + k, "");
      setTimeout(redim, 50);
    } catch (e) {}
  }
  // Larguras guardadas e painéis fechados: --wl/--wr em linha só com o painel aberto (fechado manda o estudio.css, 0 px).
  // Faz o mesmo que o paineis-extra.js §2b, para não depender dele; só escreve quando o valor muda (sem ciclo).
  function larguras() {
    var ipe = $("ipe"); if (!ipe || ARR) return;
    ["wl", "wr"].forEach(function (k) {
      var fechado = ipe.classList.contains(k === "wl" ? "sem-esq" : "sem-dir");
      var v = ipe.style.getPropertyValue("--ipr-" + k).trim(), act = ipe.style.getPropertyValue("--" + k).trim();
      if (!v) { var g = +ler("tcd_atlas_" + k); if (g >= LIM[k][0] && g <= LIM[k][1] && desk()) { v = g + "px"; ipe.style.setProperty("--ipr-" + k, v); } }
      if (fechado || !desk()) { if (act) ipe.style.removeProperty("--" + k); }
      else if (v && (act !== v || ipe.style.getPropertyPriority("--" + k) !== "important")) ipe.style.setProperty("--" + k, v, "important");
      else if (!v && act) ipe.style.removeProperty("--" + k);
    });
  }
  var largObs = null;
  function largVigiar() {
    var ipe = $("ipe"); if (!ipe || largObs === ipe) return; largObs = ipe;
    larguras();
    try { new MutationObserver(function () { try { larguras(); } catch (e) {} }).observe(ipe, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
  }
  W.addEventListener("pointerdown", inicio, true);
  W.addEventListener("pointermove", mover, true);
  W.addEventListener("pointerup", fim, true);
  W.addEventListener("pointercancel", fim, true);
  D.addEventListener("dblclick", repor, true);

  // ───────── 6. separador «Organização» ─────────
  var orgAte = Date.now() + 30000;
  function org() {
    if (ler("ipr_topo_org") === "1" || Date.now() > orgAte) return;
    var tab = D.querySelector('#ipe .ipe-tab[data-tab="org"]'); if (!tab) return;
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="org"]');
    var sel = tab.getAttribute("aria-selected") === "true" || (pane && !pane.hidden && pane.offsetParent !== null);
    if (!sel) return;
    var alt = D.querySelector('#ipe .ipe-tab[data-tab="proj"]') || D.querySelector('#ipe .ipe-tab[data-tab="enc"]');
    if (alt) alt.click();
  }

  // ───────── arranque ─────────
  function tudo() {
    try { estilos(); } catch (e) {}
    try { topo(); } catch (e) {}
    try { botaoTopo(); } catch (e) {}
    try { mbVigiar(); } catch (e) {}
    try { largVigiar(); } catch (e) {}
    try { org(); } catch (e) {}
  }
  function arrancar() {
    tudo();
    try { autoAbrir(); } catch (e) {}
    setInterval(function () { if (!D.hidden) tudo(); }, 1200);
    var rz = 0; W.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { try { botaoTopo(); } catch (e) {} }, 150); });
    D.addEventListener("ipr:lingua", function () { try { topo(); botaoTopo(); mbDecorar(); } catch (e) {} });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
