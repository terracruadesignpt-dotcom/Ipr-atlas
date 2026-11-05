/* IPR Atlas · bases-tipos.js (04/11/2026; v3 05/11 com «Imóveis»). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 04/11/2026, 16h04: «aqui na coluna lateral, onde estão as bases, quero ter isto por tipo de bases, na perspectiva da
   Terracrua: bases que tenham sido só pedidos, bases que pertençam a dias abertos, ou reuniões, ou projectos, e bases de
   projectos entregues, e se calhar um separador também para a implementação.» 16h05: «cada base na listagem tem aqueles três
   pontinhos com as opções de editar, de iluminar, de mover e as que façam sentido para encaixarem no ecossistema.»
   1. Separadores por tipo (só a equipa), por cima dos separadores de estado do projectos-grupos.js, que ficam por baixo
      como filtro. Escolhas do Nuno: o tipo é automático, com escolha manual que vale sempre:
        · Implementação: estado de implementação do m90553 «Em implementação», «Em acompanhamento» ou «Implementado»;
        · Pedidos: encomenda paga por um cliente no site (v2, 16h30: cliente que não é da equipa e total acima de 0 €, ou
          paga na loja com vale; as Bases de 0 € criadas pela equipa são internas, m90735 campo «pago»);
        · Projectos entregues: Base interna de um projecto da Terracrua Design, entregue;
        · Dias abertos, Reuniões e Projectos: escolhidos pela equipa no cartão;
        · Sem tipo: o resto (por exemplo Base interna ainda por entregar, ou encomenda por pagar).
      A escolha manual é gravada no servidor para a equipa toda (m90735, rotas m735/tipos e m735/tipo).
      No telemóvel (menos de 600 px) os separadores passam a uma lista de escolha simples.
   2. Em cada cartão, um botão «⋯» com: Mudar o nome (o lápis do ajustes.js), Iluminar no mapa, Abrir no Atlas, Mudar de
      tipo, Mudar de grupo (a escolha do projectos-grupos.js), Abrir na IPR Cloud (separador Cloud), Copiar ligação e, só a
      equipa, Ver a encomenda no painel. Usa os botões e funções que a página já tem; não substitui os do cartão.
   Lê o que os outros ficheiros já pediram (cache do projectos-grupos.js, campo de implementação do projectos-extra.js) e só
   pede ao servidor o que falta, uma vez por página. Desligar: ?btipos=0 ou localStorage ipr_btipos_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]btipos=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_btipos_off") === "1") return; } catch (e) {}
  if (W.__iprBTipos) return; W.__iprBTipos = 1;

  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function equipa() { var E = W.tcdEquipa; return !!(E && E.email && W.tcdNonce); }
  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function parar(n) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup", "change", "input"].forEach(function (v) { n.addEventListener(v, function (e) { e.stopPropagation(); }); }); }
  function api(rota, corpo) {
    var h = { "X-WP-Nonce": W.tcdNonce || "" }; if (corpo) h["Content-Type"] = "application/json";
    return fetch("/wp-json/tcd/v1/" + rota, { method: corpo ? "POST" : "GET", credentials: "same-origin", headers: h, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.message) || r.status); e.status = r.status; throw e; } return j; }); });
  }
  function telemovel() { return (W.innerWidth || 1000) < 600; }

  // ---------- tipos ----------
  var TIPOS = [
    ["pedido", "Pedidos", "Orders", "Pedido", "Order"],
    ["dia_aberto", "Dias abertos", "Open days", "Dia aberto", "Open day"],
    ["reuniao", "Reuniões", "Meetings", "Reunião", "Meeting"],
    ["projecto", "Projectos", "Projects", "Projecto", "Project"],
    ["imovel", "Imóveis", "Properties", "Imóvel", "Property"],
    ["entregue", "Projectos entregues", "Delivered projects", "Projecto entregue", "Delivered project"],
    ["impl", "Implementação", "Implementation", "Implementação", "Implementation"]
  ];
  function nomeTipo(k, um) { var x = TIPOS.filter(function (t) { return t[0] === k; })[0]; if (!x) return T("Sem tipo", "No type"); return um ? T(x[3], x[4]) : T(x[1], x[2]); }
  var IMPL_K = { implementacao: 1, acompanhamento: 1, implementado: 1 };

  var ES = null, ES_PED = false, IMPL = {}, IMPL_PED = false, IMPL_FEITO = false, MAN = {}, MAN_PED = false, MAN_OK = false, MAN_MUDAR = false, MAN_OFF = false, PAGO = {}, T0 = Date.now();
  function ids() { var P = est(); return ((P && P.mapas) || []).map(function (m) { return String(m.id || ""); }).filter(function (x) { return /^\d+$/.test(x); }).slice(0, 300); }
  function lerES() {
    // a mesma resposta do m599/estado que o projectos-grupos.js guardou neste separador
    try { var c = JSON.parse(sessionStorage.getItem("ipr_pg_es") || "null"); if (c && c.e && Date.now() - c.t < 600000) { ES = c.e; return; } } catch (e) {}
    if (ES || ES_PED || Date.now() - T0 < 6000) return;
    var l = ids(); if (!l.length) return;
    ES_PED = true;
    api("m599/estado?ids=" + l.join(",")).then(function (j) { ES = (j && j.estado) || {}; tudo(); }).catch(function () { ES = {}; });
  }
  function lerImpl() {
    // primeiro o campo «Implementação» que o projectos-extra.js põe em cada cartão; sem ele, um pedido ao m90553
    var n = 0;
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipr-px-im[data-px-id] select"), function (s) { IMPL[s.closest(".ipr-px-im").getAttribute("data-px-id")] = s.value || ""; n++; });
    if (n) { IMPL_FEITO = true; return; }
    if (IMPL_FEITO || IMPL_PED || Date.now() - T0 < 8000) return;
    var l = ids(); if (!l.length) return;
    IMPL_PED = true;
    api("m90553/impl?ids=" + l.slice(0, 200).join(",")).then(function (j) {
      var e = (j && j.estados) || {}; Object.keys(e).forEach(function (k) { IMPL[k] = (e[k] && e[k].k) || ""; }); IMPL_FEITO = true; tudo();
    }).catch(function () { IMPL_FEITO = true; });
  }
  function lerManual(forca) {
    if (MAN_OFF || MAN_PED || (MAN_OK && !forca)) return;
    var l = ids(); if (!l.length) return;
    MAN_PED = true;
    api("m735/tipos?ids=" + l.join(",")).then(function (j) {
      MAN_PED = false; MAN_OK = true; MAN = {}; var t = (j && j.tipos) || {}; Object.keys(t).forEach(function (k) { if (t[k] && t[k].t) MAN[k] = t[k]; });
      MAN_MUDAR = !!(j && j.mudar); PAGO = (j && j.pago) || {}; tudo();
    }).catch(function (x) { MAN_PED = false; MAN_OK = true; if (x && (x.status === 401 || x.status === 403 || x.status === 404)) MAN_OFF = true; });
  }
  function auto(m) {
    var id = String(m.id), e = ES && ES[id];
    if (IMPL_K[IMPL[id]]) return "impl";
    // v3 (05/11/2026, 13h35, Nuno): «Imóveis»: as Bases dos imóveis da Azenhas e Castelos e as feitas para oferecer a
    // agentes imobiliários. Automático pelo nome (AeC, Azenhas, URP); a escolha manual no cartão vale sempre.
    if (/\bAeC\b|Azenhas|\bURP\d|imobili/i.test(String(m.local || "") + " " + String(m.nome || "") + " " + String(m.pedido || ""))) return "imovel";
    var interna = (e ? +e.interna === 1 : false) || (id in PAGO && !+PAGO[id]);
    if (m.pagar || m.estado_k === "pending" || m.estado_k === "failed" || m.estado_k === "cancelled") return "";
    if (!interna) return e || !ES ? "pedido" : "";
    if (m.estado_k === "completed" && !m.rever) return "entregue";
    return "";
  }
  function tipoDe(m) { var x = MAN[String(m.id)]; return x && x.t ? x.t : auto(m); }

  // ---------- estilo ----------
  var css = el("style");
  css.textContent =
    "#ipe-proj .ipr-bt-esc,#ipe-proj .ipr-bt-hh{display:none!important}" +
    "#ipr-bt-f{margin:0 0 6px}" +
    "#ipr-bt-f .abas{display:flex;flex-wrap:wrap;gap:4px}" +
    "#ipr-bt-f .abas button{all:unset;box-sizing:border-box;cursor:pointer;padding:5px 10px;border:1px solid var(--ln,#3a3f30);border-radius:99px;font:600 12px/1.3 Inter,system-ui,sans-serif;color:var(--mu,#a7ab98);white-space:nowrap}" +
    "#ipr-bt-f .abas button small{font:500 11px var(--mono,monospace);opacity:.8;margin-left:4px}" +
    "#ipr-bt-f .abas button.zero{opacity:.55}" +
    "#ipr-bt-f .abas button[aria-selected=true]{color:#0f1a08;background:var(--ac,#9BC53D);border-color:var(--ac,#9BC53D);opacity:1}" +
    "#ipr-bt-f .abas button:focus-visible{outline:2px solid var(--ac,#9BC53D);outline-offset:2px}" +
    "#ipr-bt-f label{display:flex;align-items:center;gap:8px;font:600 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a7ab98)}" +
    "#ipr-bt-f select{flex:1;min-height:40px;border:1px solid var(--ln,#3a3f30);border-radius:7px;background:var(--p3,#1d2117);color:var(--tx,#e9eadf);font:14px Inter,system-ui,sans-serif;padding:6px 8px;text-transform:none;letter-spacing:0}" +
    ".ipr-bt-b{all:unset;box-sizing:border-box;float:right;margin:-2px -4px 2px 6px;width:32px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;color:var(--mu,#a7ab98);font:700 16px/1 Inter,system-ui,sans-serif;letter-spacing:1px}" +
    ".ipr-bt-b:hover,.ipr-bt-b:focus-visible,.ipr-bt-b[aria-expanded=true]{background:var(--p3,rgba(127,127,127,.18));color:var(--tx,#e9eadf)}" +
    ".ipr-bt-b:focus-visible{outline:2px solid var(--ac,#9BC53D)}" +
    ".ipr-bt-c{display:inline-block;margin:4px 6px 0 0;padding:1px 8px;border-radius:99px;border:1px solid var(--ln2,rgba(127,127,127,.35));font:600 10.5px/1.5 Inter,system-ui,sans-serif;color:var(--mu,#a7ab98)}" +
    ".ipr-bt-c.man{color:var(--tx,#e9eadf);border-color:var(--ac,#9BC53D)}" +
    "#ipr-bt-m{position:fixed;z-index:100001;min-width:220px;max-width:min(92vw,300px);max-height:70vh;overflow:auto;padding:6px;border:1px solid var(--ln,#3a3f30);border-radius:10px;background:var(--p2,#22261b);color:var(--tx,#e9eadf);box-shadow:0 10px 30px rgba(0,0,0,.4);font:13px/1.35 Inter,system-ui,sans-serif}" +
    "#ipr-bt-m button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:7px 10px;border-radius:7px;cursor:pointer}" +
    "#ipr-bt-m button:hover,#ipr-bt-m button:focus-visible{background:var(--p3,rgba(127,127,127,.18))}" +
    "#ipr-bt-m button[disabled]{opacity:.45;cursor:default}" +
    "#ipr-bt-m button .v{margin-left:auto;color:var(--ac,#9BC53D)}" +
    "#ipr-bt-m h5{margin:6px 10px 2px;font:600 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a7ab98)}" +
    "#ipr-bt-m hr{border:0;border-top:1px solid var(--ln,#3a3f30);margin:5px 4px}" +
    "#ipr-bt-m small{display:block;padding:2px 10px 6px;color:var(--mu,#a7ab98)}";
  (D.head || D.documentElement).appendChild(css);

  // ---------- cartões ----------
  function cartoes() { return [].slice.call(D.querySelectorAll("#ipe-proj .ipe-card[data-i]")); }
  function mapa(c) { var P = est(); return P && P.mapas ? P.mapas[+c.getAttribute("data-i")] || null : null; }
  function pronto() { return !!ES && IMPL_FEITO && (MAN_OK || MAN_OFF); }
  var ABA = ls("ipr_bt_aba") || "";
  function tagCartao(c, m) {
    var ct = c.querySelector(".ipe-ct") || c;
    if (!ct.querySelector(":scope > .ipr-bt-b")) {
      var b = el("button", "ipr-bt-b", "⋯"); b.type = "button";
      b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-label", T("Opções desta Base", "Options for this base")); b.title = T("Opções", "Options");
      parar(b);
      b.addEventListener("click", function (e) { e.preventDefault(); abrirMenu(b, c); });
      ct.insertBefore(b, ct.firstChild);
    }
    if (!equipa() || !pronto()) return;
    var t = tipoDe(m), man = !!MAN[String(m.id)], k = [pt() ? 1 : 0, t, man ? 1 : 0].join("#");
    var tg = ct.querySelector(":scope > .ipr-bt-c");
    if (tg && tg.dataset.k === k) return;
    if (!tg) { tg = el("span", "ipr-bt-c"); var st = ct.querySelector(":scope > strong"); if (st && st.nextSibling) ct.insertBefore(tg, st.nextSibling); else ct.appendChild(tg); }
    tg.dataset.k = k; tg.className = "ipr-bt-c" + (man ? " man" : "");
    tg.textContent = nomeTipo(t, true);
    tg.title = man ? T("Tipo escolhido pela equipa", "Type chosen by the team") + (MAN[String(m.id)].por ? " (" + MAN[String(m.id)].por + ")" : "") : T("Tipo automático", "Automatic type");
  }
  function contar() {
    var n = { "": 0, sem: 0 }; TIPOS.forEach(function (t) { n[t[0]] = 0; });
    cartoes().forEach(function (c) { if (c.closest(".ipr-todas")) return; var m = mapa(c); if (!m) return; n[""]++; var t = tipoDe(m) || "sem"; n[t] = (n[t] || 0) + 1; });
    return n;
  }
  function filtrar() {
    cartoes().forEach(function (c) {
      var m = mapa(c), esc = !!(ABA && m && !c.closest(".ipr-todas") && (tipoDe(m) || "sem") !== ABA);
      if (c.classList.contains("ipr-bt-esc") !== esc) c.classList.toggle("ipr-bt-esc", esc);
    });
    // títulos de grupo do projectos-grupos.js sem nenhum cartão à vista neste tipo
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-cards"), function (box) {
      var it = [].slice.call(box.querySelectorAll(":scope > .ipr-pg-h, :scope > .ipe-card[data-i]")).sort(function (a, b) { return (parseInt(a.style.order, 10) || 0) - (parseInt(b.style.order, 10) || 0); });
      var h = null, vis = false;
      function fecha() { if (h) { var x = ABA && !vis; if (h.classList.contains("ipr-bt-hh") !== x) h.classList.toggle("ipr-bt-hh", x); } }
      it.forEach(function (x) {
        if (x.classList.contains("ipr-pg-h")) { fecha(); h = x; vis = false; }
        else if (!x.classList.contains("ipr-bt-esc") && !x.classList.contains("ipr-pg-esc") && !x.classList.contains("ipr-px-off")) vis = true;
      });
      fecha();
    });
  }
  function barra() {
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="proj"]'), box = D.getElementById("ipe-proj");
    var bar = D.getElementById("ipr-bt-f");
    if (!pane || !box || !equipa() || !pronto() || !(est() && est().mapas && est().mapas.length)) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = el("div"); bar.id = "ipr-bt-f"; parar(bar);
      bar.addEventListener("click", function (e) { var b = e.target.closest("[data-bt]"); if (!b) return; escolher(b.getAttribute("data-bt")); });
      bar.addEventListener("change", function (e) { if (e.target.getAttribute("data-bt-s") != null) escolher(e.target.value); });
    }
    // por cima dos separadores de estado (#ipr-pg-f) e da pesquisa (#ipr-px-f)
    var alvo = D.getElementById("ipr-pg-f"); if (!alvo || alvo.parentNode !== pane) alvo = D.getElementById("ipr-px-f"); if (!alvo || alvo.parentNode !== pane) alvo = box;
    if (bar.parentNode !== pane || bar.nextElementSibling !== alvo) {
      var px = D.getElementById("ipr-px-f");
      if (px && px.parentNode === pane && alvo !== px && (px.compareDocumentPosition(alvo) & 4)) alvo = px;
      pane.insertBefore(bar, alvo);
    }
    var n = contar();
    if (ABA && ABA !== "sem" && !TIPOS.some(function (t) { return t[0] === ABA; })) ABA = "";
    var chave = [pt() ? 1 : 0, telemovel() ? 1 : 0, ABA, JSON.stringify(n)].join("#");
    if (bar.dataset.k === chave) return;
    bar.dataset.k = chave; bar.textContent = "";
    var op = [["", T("Todas", "All"), n[""]]].concat(TIPOS.map(function (t) { return [t[0], T(t[1], t[2]), n[t[0]]]; }));
    if (n.sem || ABA === "sem") op.push(["sem", T("Sem tipo", "No type"), n.sem]);
    if (telemovel()) {
      var l = el("label"), s = el("select"); s.setAttribute("data-bt-s", ""); l.appendChild(D.createTextNode(T("Tipo", "Type")));
      op.forEach(function (o) { var x = el("option", "", o[1] + " (" + o[2] + ")"); x.value = o[0]; if (o[0] === ABA) x.selected = true; s.appendChild(x); });
      l.appendChild(s); bar.appendChild(l); return;
    }
    var ab = el("div", "abas"); ab.setAttribute("role", "tablist"); ab.setAttribute("aria-label", T("Tipo de Base", "Base type"));
    op.forEach(function (o) {
      var b = el("button", o[0] && !o[2] ? "zero" : "", o[1]); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("data-bt", o[0]);
      b.setAttribute("aria-selected", o[0] === ABA ? "true" : "false"); b.appendChild(el("small", "", o[2]));
      if (o[0] === "pedido") b.title = T("Encomendas pagas feitas no site", "Paid orders placed on the site");
      else if (o[0] === "entregue") b.title = T("Bases de projectos da Terracrua Design já entregues", "Bases of delivered Terracrua Design projects");
      else if (o[0] === "impl") b.title = T("Projectos em implementação, em acompanhamento ou implementados", "Projects being implemented, in follow-up or implemented");
      else if (o[0] && o[0] !== "sem") b.title = T("Escolhido pela equipa no «⋯» de cada cartão", "Chosen by the team in each card's «⋯» menu");
      ab.appendChild(b);
    });
    bar.appendChild(ab);
  }
  function escolher(v) { ABA = v || ""; ls("ipr_bt_aba", ABA); var b = D.getElementById("ipr-bt-f"); if (b) b.dataset.k = ""; tudo(); }

  // ---------- menu «⋯» ----------
  var MENU = null, MENU_B = null;
  function fecharMenu() { if (MENU) { MENU.remove(); MENU = null; } if (MENU_B) { MENU_B.setAttribute("aria-expanded", "false"); try { MENU_B.focus({ preventScroll: true }); } catch (e) {} MENU_B = null; } }
  function aviso(txt) {
    var a = el("div", "", txt); a.setAttribute("role", "status");
    a.style.cssText = "position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:100002;max-width:min(92vw,460px);background:#14200F;color:#F2EFE6;border:1px solid #9BC53D;border-radius:8px;padding:10px 14px;font:13px/1.4 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)";
    D.body.appendChild(a); setTimeout(function () { try { a.remove(); } catch (e) {} }, 5000);
  }
  function item(M, txt, fn, extra) {
    var b = el("button", "", txt); b.type = "button"; b.setAttribute("role", "menuitem");
    if (extra) b.appendChild(el("span", "v", extra));
    if (!fn) b.disabled = true; else b.addEventListener("click", function (e) { e.preventDefault(); fn(); });
    M.appendChild(b); return b;
  }
  function abrirMenu(b, c, sub) {
    var antes = MENU_B; fecharMenu();
    if (antes === b && !sub) return;
    var m = mapa(c); if (!m) return;
    var id = String(m.id), e = ES && ES[id], M = el("div"); M.id = "ipr-bt-m"; M.setAttribute("role", "menu"); parar(M);
    M.addEventListener("keydown", function (ev) {
      var its = [].slice.call(M.querySelectorAll("button:not([disabled])")), i = its.indexOf(D.activeElement);
      if (ev.key === "Escape") { ev.preventDefault(); fecharMenu(); }
      else if (ev.key === "ArrowDown") { ev.preventDefault(); (its[i + 1] || its[0]).focus(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); (its[i - 1] || its[its.length - 1]).focus(); }
    });
    if (sub === "tipo") {
      M.appendChild(el("h5", "", T("Tipo desta Base", "Type of this base")));
      var at = MAN[id] && MAN[id].t, au = auto(m);
      item(M, T("Automático", "Automatic") + " · " + nomeTipo(au, true), function () { gravarTipo(c, m, ""); }, at ? "" : "✓");
      M.appendChild(el("hr"));
      TIPOS.forEach(function (t) { item(M, T(t[3], t[4]), function () { gravarTipo(c, m, t[0]); }, at === t[0] ? "✓" : ""); });
      M.appendChild(el("small", "", T("A escolha da equipa vale sempre sobre a automática.", "The team's choice always overrides the automatic one.")));
      M.appendChild(el("hr"));
      item(M, T("← Voltar", "← Back"), function () { abrirMenu(b, c, "raiz"); });
    } else {
      var ren = c.querySelector(".ipr-ren");
      item(M, T("Mudar o nome", "Rename"), ren ? function () { fecharMenu(); ren.click(); } : null);
      item(M, T("Iluminar no mapa", "Highlight on the map"), function () { fecharMenu(); iluminar(m); });
      item(M, T("Abrir no Atlas", "Open in the Atlas"), function () { fecharMenu(); abrir(c, m); });
      if (equipa() && pronto()) {
        M.appendChild(el("hr"));
        item(M, T("Mudar de tipo", "Change type"), MAN_MUDAR && !MAN_OFF ? function () { abrirMenu(b, c, "tipo"); } : null, nomeTipo(tipoDe(m), true) + " ›");
        var sg = D.getElementById("ipr-pg-s-" + id);
        item(M, T("Mudar de grupo", "Change group"), sg ? function () { fecharMenu(); try { sg.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (x) {} sg.focus(); if (sg.showPicker) try { sg.showPicker(); } catch (x) {} } : null);
      }
      if (W.__iprBAtalhos && W.__iprBAtalhos.menu) try { W.__iprBAtalhos.menu(M, c, item, fecharMenu); } catch (x) {} // atalhos do bases-atalhos.js (18h18)
      M.appendChild(el("hr"));
      var tabCloud = D.querySelector('.ipe-tab[data-tab="cloud"]');
      if (tabCloud && (!e || +e.cloud)) item(M, T("Abrir na IPR Cloud", "Open in IPR Cloud"), function () { fecharMenu(); abrirCloud(tabCloud, e && e.num); });
      item(M, T("Copiar ligação", "Copy link"), function () { fecharMenu(); copiar(location.origin + "/atlas/?mapa=" + encodeURIComponent(m.id)); });
      if (equipa() && /^\d+$/.test(String(m.encomenda || m.id))) {
        item(M, T("Ver a encomenda no painel", "View the order in the dashboard"), function () { fecharMenu(); W.open("/wp-admin/post.php?post=" + encodeURIComponent(m.encomenda || m.id) + "&action=edit", "_blank", "noopener"); });
      }
    }
    D.body.appendChild(M); MENU = M; MENU_B = b; b.setAttribute("aria-expanded", "true");
    var r = b.getBoundingClientRect(), w = M.offsetWidth, h = M.offsetHeight, vw = W.innerWidth, vh = W.innerHeight;
    var x = Math.min(Math.max(8, r.right - w), vw - w - 8), y = r.bottom + 4; if (y + h > vh - 8) y = Math.max(8, r.top - h - 4);
    M.style.left = x + "px"; M.style.top = y + "px";
    var f = M.querySelector("button:not([disabled])"); if (f) f.focus({ preventScroll: true });
  }
  D.addEventListener("pointerdown", function (e) { if (MENU && !MENU.contains(e.target) && !(MENU_B && MENU_B.contains(e.target))) fecharMenu(); }, true);
  W.addEventListener("resize", function () { fecharMenu(); });
  D.addEventListener("scroll", function (e) { if (MENU && !MENU.contains(e.target)) fecharMenu(); }, true);

  function gravarTipo(c, m, t) {
    fecharMenu();
    var id = String(m.id), ant = MAN[id];
    if (t) MAN[id] = { t: t, por: "", em: Date.now() / 1000 | 0 }; else delete MAN[id];
    tudo();
    api("m735/tipo", { enc: +id, tipo: t }).then(function (j) {
      if (j && j.tipo) MAN[id] = j.tipo; else delete MAN[id];
      aviso(T("Tipo guardado: ", "Type saved: ") + nomeTipo(tipoDe(m), true) + (t ? "" : T(" (automático)", " (automatic)")));
      tudo();
    }).catch(function (x) { if (ant) MAN[id] = ant; else delete MAN[id]; aviso(T("Não foi possível guardar o tipo", "Could not save the type") + (x && x.message ? ": " + x.message : "")); tudo(); });
  }
  function abrir(c, m) {
    var P = est(); if (P && P.modo === "cliente" && P.actual === m) { iluminar(m); return; }
    var a = c.querySelector(".ipe-thumb") || c.querySelector(".ipe-ct strong"); if (a) a.click(); // o app.js abre a Base e enquadra o terreno
  }
  function abrirCloud(tab, num) {
    tab.click();
    if (!num) return;
    var t0 = Date.now();
    (function ver() {
      var alvo = null;
      [].some.call(D.querySelectorAll(".ipc-cod"), function (x) { if (String(x.textContent).indexOf(num) >= 0) { alvo = x; return true; } return false; });
      if (alvo) { try { alvo.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} return; }
      if (Date.now() - t0 < 4000) setTimeout(ver, 300);
    })();
  }
  function copiar(u) {
    var ok = function () { aviso(T("Ligação copiada: ", "Link copied: ") + u); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).then(ok, function () { W.prompt(T("Copie a ligação:", "Copy the link:"), u); }); return; } } catch (e) {}
    W.prompt(T("Copie a ligação:", "Copy the link:"), u);
  }

  // ---------- iluminar ----------
  var LUZ_T = 0;
  function caixa(g) {
    var b = [180, 90, -180, -90];
    (function p(x) {
      if (!x) return;
      if (typeof x[0] === "number") { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); return; }
      if (Array.isArray(x)) { x.forEach(p); return; }
      if (x.type === "FeatureCollection") (x.features || []).forEach(p); else if (x.type === "Feature") p(x.geometry); else if (x.coordinates) p(x.coordinates);
    })(g);
    return b[0] <= b[2] ? b : null;
  }
  function iluminar(m) {
    var g = m.geojson;
    if (typeof g === "string") try { g = JSON.parse(g); } catch (e) { g = null; }
    if (g) return luz(g);
    if (!equipa()) return aviso(T("Esta Base não tem limite para iluminar.", "This base has no boundary to highlight."));
    api("m90553/limite?enc=" + encodeURIComponent(m.encomenda || m.id)).then(function (j) {
      if (j && j.geojson) luz(j.geojson); else aviso(T("Esta Base não tem limite para iluminar.", "This base has no boundary to highlight."));
    }).catch(function () { aviso(T("Não foi possível ler o limite desta Base.", "Could not read this base's boundary.")); });
  }
  function luz(g) {
    var M = W.__ipe && W.__ipe.mapa; if (!M || !M.addSource) return;
    var b = caixa(g); if (!b) return aviso(T("Esta Base não tem limite para iluminar.", "This base has no boundary to highlight."));
    if (g.type !== "FeatureCollection" && g.type !== "Feature") g = { type: "Feature", properties: {}, geometry: g };
    try {
      apagarLuz(M);
      M.addSource("ipr-bt-luz", { type: "geojson", data: g });
      M.addLayer({ id: "ipr-bt-luz-f", type: "fill", source: "ipr-bt-luz", paint: { "fill-color": "#ffd54a", "fill-opacity": 0.18 } });
      M.addLayer({ id: "ipr-bt-luz-h", type: "line", source: "ipr-bt-luz", paint: { "line-color": "#ffd54a", "line-width": 9, "line-opacity": 0.35, "line-blur": 3 } });
      M.addLayer({ id: "ipr-bt-luz-l", type: "line", source: "ipr-bt-luz", paint: { "line-color": "#ffd54a", "line-width": 3 } });
    } catch (e) {}
    try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, maxZoom: 17, duration: 900 }); } catch (e) {}
    clearTimeout(LUZ_T); LUZ_T = setTimeout(function () { apagarLuz(M); }, 8000);
  }
  function apagarLuz(M) { try { ["ipr-bt-luz-l", "ipr-bt-luz-h", "ipr-bt-luz-f"].forEach(function (l) { if (M.getLayer(l)) M.removeLayer(l); }); if (M.getSource("ipr-bt-luz")) M.removeSource("ipr-bt-luz"); } catch (e) {} }

  // ---------- ciclo ----------
  function limpar() {
    [].forEach.call(D.querySelectorAll("#ipr-bt-f, #ipe-proj .ipr-bt-c"), function (x) { x.remove(); });
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipr-bt-esc, #ipe-proj .ipr-bt-hh"), function (x) { x.classList.remove("ipr-bt-esc", "ipr-bt-hh"); });
  }
  function tudo() {
    var P = est(); if (!P || !P.mapas) return;
    var cs = cartoes(); if (!cs.length) return;
    if (equipa()) { lerES(); lerImpl(); lerManual(false); }
    cs.forEach(function (c) { var m = mapa(c); if (m) try { tagCartao(c, m); } catch (e) {} });
    if (!equipa()) return;
    try { barra(); } catch (e) {}
    try { if (pronto() && D.getElementById("ipr-bt-f")) filtrar(); else limpar(); } catch (e) {}
  }
  setInterval(function () { if (!D.hidden) tudo(); }, 1500);
  D.addEventListener("ipr:lingua", function () { var b = D.getElementById("ipr-bt-f"); if (b) b.dataset.k = ""; [].forEach.call(D.querySelectorAll(".ipr-bt-c"), function (x) { x.dataset.k = ""; }); tudo(); });
  W.__iprBTipos = { actualizar: function () { lerManual(true); }, tipo: function (m) { return tipoDe(m); } };
})();
