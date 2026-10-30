/* IPR Atlas · Projectos e terreno: reportes do Bernardo Sampaio (técnico da Terracrua Design), pedido do Nuno, 30/10/2026, 17h49.
   Só acrescenta; não esconde nem muda o que já existe. Liga-se por DOM e window (__ipe, tcdNonce, tcdEquipa, IPR_LINGUA).
   1. Reporte 17040: no separador Projectos, uma barra com caixa de pesquisa (nome, número, pedido, cliente) e filtros por
      estado (entregue, a preparar, em análise, em revisão) e por dono (meus, partilhados comigo). Os cartões que não
      correspondem ficam fora da lista só enquanto o filtro estiver escolhido; «Limpar» repõe tudo. Nada fica gravado.
   2. Reporte 17046: para a equipa (window.tcdEquipa), o estado de implementação de cada projecto ao lado do estado da
      encomenda, com escolha e gravação no servidor (m90553, rota tcd/v1/m90553/impl, só equipa). Também entra nos filtros.
   3. Reporte 17050: no formulário de encomenda (#ipe-form, «01 Terreno»), «Usar um dos meus locais»: as áreas guardadas em
      «Os meus locais» (deste navegador, da conta e dos projectos) passam a ser o terreno da encomenda, pelo mesmo caminho
      do «Carregar ficheiro» do Atlas (GeoJSON com o nome do local).
   4. Reporte 17051: com /atlas/?mapa=N, se a encomenda N não abre como projecto (por exemplo, em análise e de outra pessoa,
      vista pela equipa) ou vem sem limite, o limite é pedido ao servidor (m90553, rota tcd/v1/m90553/limite) e desenhado
      no mapa por cima, com uma etiqueta que diz o número e o estado, «Enquadrar» e «Fechar».
   5. Reporte 16427: no formulário de encomenda, a lista dos terrenos que estão no mapa (desenhados, do cadastro ou de um
      ficheiro KML), cada um com a área e com «Editar pontos» (mover, juntar e apagar vértices, com o mapbox-gl-draw que o
      Atlas já usa), «Separar» (polígono com várias partes), «Só este» e «Apagar». «Só este» deixa no mapa um terreno para
      esta encomenda e guarda os outros neste navegador; depois de enviar, «Carregar o seguinte» põe o próximo no mapa.
   Desligar: ?projectos-extra=0 (ou ?projectos_extra=0) no endereço, ou localStorage ipr_projectos-extra_off = 1. Cada parte
   corre dentro de try/catch e falha em silêncio. */
(function () {
  "use strict";
  if (window.__iprProjectosExtra) return;
  window.__iprProjectosExtra = 1;
  try {
    var Q0 = new URLSearchParams(location.search);
    if (Q0.get("projectos-extra") === "0" || Q0.get("projectos_extra") === "0") return;
    if (localStorage.getItem("ipr_projectos-extra_off") === "1" || localStorage.getItem("ipr_projectos_extra_off") === "1") return;
  } catch (e) {}

  var REST = "/wp-json/tcd/v1/";
  var TX = {
    pt: {
      procurar: "Procurar por nome ou número", procurarL: "Procurar projectos",
      estado: "Estado", eTodos: "Estado: todos", eEnt: "Entregue", ePrep: "A preparar", eAn: "Em análise", eRev: "Em revisão", eOutro: "Outros",
      dono: "Projectos", dTodos: "Dono: todos", dMeus: "Só os meus", dPart: "Partilhados comigo",
      impl: "Implementação", iTodos: "Implementação: todas", iSem: "Sem estado",
      mostrar: function (a, b) { return "A mostrar " + a + " de " + b; }, nenhum: "Nenhum projecto corresponde à pesquisa.", limpar: "Limpar",
      implT: "Estado de implementação do projecto (só a equipa vê)", gravado: "Guardado", erroG: "Não foi possível guardar",
      por: function (q, d) { return "Mudado" + (q ? " por " + q : "") + (d ? " em " + d : ""); },
      locBotao: "Usar um dos meus locais", locT: "Escolha uma área guardada em «Os meus locais» para terreno desta encomenda.",
      locVazio: "Ainda não há áreas em «Os meus locais». Desenhe uma área nesse bloco, à esquerda, ou importe um KML.",
      locConta: "Os meus locais", locProj: "Locais do projecto ", locSem: "Área sem nome", locUsar: "Usar",
      locFeito: function (n) { return "«" + n + "» passou a ser o terreno da encomenda."; }, locFalhou: "Este navegador não deixou carregar o local. Exporte-o em KML e use «Carregar ficheiro».",
      polT: "Terrenos no mapa", polAj: "Cada terreno pode ser corrigido ponto a ponto. Uma Base Cartográfica por terreno: use «Só este» e encomende os outros a seguir.",
      terreno: "Terreno ", partes: " partes", editar: "Editar pontos", separar: "Separar", soEste: "Só este", apagar: "Apagar",
      editando: "A editar: arraste um ponto para o mover, toque no ponto do meio de um lado para juntar outro, toque num ponto para o escolher.",
      apagarPonto: "Apagar ponto escolhido", concluir: "Concluir",
      fila: function (n) { return n === 1 ? "1 terreno à espera de encomenda neste navegador" : n + " terrenos à espera de encomenda neste navegador"; },
      seguinte: "Carregar o seguinte", esquecer: "Esquecer", esquecerT: "Tirar os terrenos à espera deste navegador",
      guardados: function (n) { return n === 1 ? "O outro terreno ficou à espera: depois de enviar este pedido, carregue-o aqui." : "Os outros " + n + " terrenos ficaram à espera: depois de enviar este pedido, carregue-os aqui."; },
      limTit: "Limite da encomenda #", limSem: "Encomenda #", limSemTxt: " sem limite desenhado (indicado por artigo matricial ou caderneta).", enquadrar: "Enquadrar", fechar: "Fechar"
    },
    en: {
      procurar: "Search by name or number", procurarL: "Search projects",
      estado: "Status", eTodos: "Status: all", eEnt: "Delivered", ePrep: "Being prepared", eAn: "Under review", eRev: "In team review", eOutro: "Other",
      dono: "Projects", dTodos: "Owner: all", dMeus: "Mine only", dPart: "Shared with me",
      impl: "Implementation", iTodos: "Implementation: all", iSem: "No status",
      mostrar: function (a, b) { return "Showing " + a + " of " + b; }, nenhum: "No project matches the search.", limpar: "Clear",
      implT: "Project implementation status (team only)", gravado: "Saved", erroG: "Could not save",
      por: function (q, d) { return "Changed" + (q ? " by " + q : "") + (d ? " on " + d : ""); },
      locBotao: "Use one of my places", locT: "Choose an area saved in «My places» as the plot for this order.",
      locVazio: "There are no areas in «My places» yet. Draw an area in that block, on the left, or import a KML.",
      locConta: "My places", locProj: "Places of project ", locSem: "Unnamed area", locUsar: "Use",
      locFeito: function (n) { return "«" + n + "» is now the plot for this order."; }, locFalhou: "This browser did not allow loading the place. Export it as KML and use «Upload file».",
      polT: "Plots on the map", polAj: "Each plot can be corrected point by point. One Base Map per plot: use «Only this one» and order the others next.",
      terreno: "Plot ", partes: " parts", editar: "Edit points", separar: "Split", soEste: "Only this one", apagar: "Delete",
      editando: "Editing: drag a point to move it, tap the midpoint of a side to add one, tap a point to select it.",
      apagarPonto: "Delete selected point", concluir: "Done",
      fila: function (n) { return n === 1 ? "1 plot waiting to be ordered in this browser" : n + " plots waiting to be ordered in this browser"; },
      seguinte: "Load the next one", esquecer: "Forget", esquecerT: "Remove the waiting plots from this browser",
      guardados: function (n) { return n === 1 ? "The other plot is waiting: after sending this order, load it here." : "The other " + n + " plots are waiting: after sending this order, load them here."; },
      limTit: "Boundary of order #", limSem: "Order #", limSemTxt: " has no drawn boundary (given by land registry article or document).", enquadrar: "Fit", fechar: "Close"
    }
  };
  function lg() { return (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; }
  function t(k) { var v = TX[lg()][k]; return v == null ? TX.pt[k] : v; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function botao(txt, cls, attrs) { var b = el("button", cls, txt); b.type = "button"; for (var k in (attrs || {})) b.setAttribute(k, attrs[k]); return b; }
  function I() { return window.__ipe || null; }
  function est() { var i = I(); return i && i.estado || null; }
  function mapa() { var i = I(); return i && i.mapa || null; }
  function sessao() { return !!window.tcdNonce; }
  function equipa() { var E = window.tcdEquipa; return !!(E && E.email); }
  function num(n, d) { n = +n; return isFinite(n) ? n.toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d, minimumFractionDigits: d }) : ""; }
  function norm(s) { s = String(s == null ? "" : s).toLowerCase(); try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {} return s.replace(/<[^>]*>/g, " "); }
  function api(rota, op) {
    op = op || {};
    var h = { "X-WP-Nonce": window.tcdNonce || "" }; if (op.body) h["Content-Type"] = "application/json";
    return fetch(REST + rota, { method: op.method || "GET", credentials: "same-origin", headers: h, body: op.body ? JSON.stringify(op.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.message) || ("HTTP " + r.status)); e.status = r.status; throw e; } return j; }); });
  }
  function parar(no) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup"].forEach(function (v) { no.addEventListener(v, function (e) { e.stopPropagation(); }); }); }

  // Área geodésica (a mesma fórmula do geojson-area que o Atlas usa), em hectares.
  function rad(x) { return x * Math.PI / 180; }
  function anel(c) {
    var n = c ? c.length : 0, a = 0; if (n < 3) return 0;
    for (var i = 0; i < n; i++) { var p1 = c[i], p2 = c[(i + 1) % n], p3 = c[(i + 2) % n]; a += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1])); }
    return Math.abs(a * 6378137 * 6378137 / 2);
  }
  function areaPol(r) { var a = anel(r[0]); for (var i = 1; i < r.length; i++) a -= anel(r[i]); return Math.max(0, a); }
  function areaHa(g) {
    if (!g) return 0;
    if (g.type === "Polygon") return areaPol(g.coordinates) / 1e4;
    if (g.type === "MultiPolygon") return g.coordinates.reduce(function (s, p) { return s + areaPol(p); }, 0) / 1e4;
    return 0;
  }
  function caixa(g) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (function col(o) { if (!o) return []; if (o.type === "FeatureCollection") return (o.features || []).map(col); if (o.type === "Feature") return col(o.geometry); return o.coordinates || []; })(g));
    return isFinite(b[0]) && b[0] <= b[2] ? b : null;
  }

  var ESTILO =
    "#ipr-px-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px;padding:8px;border:1px solid var(--ln);border-radius:9px;background:var(--p2)}" +
    "#ipr-px-f[hidden]{display:none}" +
    "#ipr-px-f input,#ipr-px-f select{min-height:40px;box-sizing:border-box;border:1px solid var(--ln);border-radius:7px;background:var(--p3,var(--bg));color:var(--tx);font:13px/1.2 Inter,system-ui,sans-serif;padding:6px 8px;min-width:0}" +
    "#ipr-px-f input{flex:1 1 100%}" +
    "#ipr-px-f select{flex:1 1 9.5em;max-width:100%}#ipr-px-f select[data-px-f=i]{flex-basis:100%}" +
    "#ipr-px-f input:focus-visible,#ipr-px-f select:focus-visible,#ipr-px-f button:focus-visible{outline:2px solid var(--ac);outline-offset:1px}" +
    "#ipr-px-f .ipr-px-n{flex:1 1 auto;font:12px/1.3 var(--mono,monospace);color:var(--mu)}" +
    "#ipr-px-f .ipr-px-l{min-height:40px;padding:0 12px;border:1px solid var(--ln);border-radius:7px;background:transparent;color:var(--tx);font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-px-f .ipr-px-l[hidden]{display:none}" +
    "#ipe-proj .ipr-px-off{display:none!important}" +
    "#ipe-proj .ipr-px-im{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin-top:6px}" +
    "#ipe-proj .ipr-px-im span{font:600 10.5px/1.2 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu)}" +
    "#ipe-proj .ipr-px-im select{min-height:40px;max-width:100%;border:1px solid var(--ln);border-radius:7px;background:var(--p3,var(--bg));color:var(--tx);font:13px Inter,system-ui,sans-serif;padding:4px 6px}" +
    "#ipe-proj .ipr-px-im select.tem{border-color:var(--ac)}" +
    "#ipe-proj .ipr-px-im small{font:11.5px Inter,system-ui,sans-serif;color:var(--mu)}" +
    "#ipe-proj .ipr-px-im small.mau{color:#d9725b}" +
    ".ipr-px-bloco{margin:8px 0;padding:8px;border:1px solid var(--ln);border-radius:9px;background:var(--p2);font:12.5px/1.45 Inter,system-ui,sans-serif;color:var(--tx)}" +
    ".ipr-px-bloco[hidden]{display:none}" +
    ".ipr-px-bloco p{margin:0 0 6px;color:var(--mu)}" +
    ".ipr-px-bloco b.ipr-px-h{display:block;margin:0 0 4px;font:600 12px Inter,system-ui,sans-serif;color:var(--tx)}" +
    ".ipr-px-bloco ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;overscroll-behavior:contain}" +
    ".ipr-px-bloco li{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 0;border-top:1px solid var(--ln)}" +
    ".ipr-px-bloco li:first-child{border-top:0}" +
    ".ipr-px-bloco li .ipr-px-nm{flex:1 1 9em;min-width:0;overflow-wrap:anywhere}" +
    ".ipr-px-bloco li .ipr-px-nm small{display:block;font:11.5px var(--mono,monospace);color:var(--mu)}" +
    ".ipr-px-bloco .ipr-px-sub{padding:6px 0 2px;font:600 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);border:0}" +
    ".ipr-px-b{min-height:40px;padding:0 11px;border:1px solid var(--ln);border-radius:7px;background:transparent;color:var(--tx);font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".ipr-px-b:hover{border-color:var(--ac)}" +
    ".ipr-px-b:disabled{opacity:.45;cursor:default}" +
    ".ipr-px-b.ac{background:var(--ac);border-color:var(--ac);color:var(--bg)}" +
    ".ipr-px-b.mau{color:#d9725b}" +
    ".ipr-px-b:focus-visible{outline:2px solid var(--ac);outline-offset:1px}" +
    ".ipr-px-acc{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}" +
    ".ipr-px-msg{display:block;margin-top:4px;font:12px Inter,system-ui,sans-serif;color:var(--ac2,var(--ac))}" +
    ".ipr-px-msg.mau{color:#d9725b}" +
    "#ipr-px-chip{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);z-index:4;display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:calc(100% - 120px);box-sizing:border-box;padding:4px 4px 4px 12px;border:1px solid #ff9a3c;border-radius:10px;background:var(--p1,var(--bg,#121410));color:var(--tx,#ebe7d8);font:12.5px/1.3 Inter,system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25)}" +
    "#ipr-px-chip span{flex:1 1 12em;min-width:0}" +
    "#ipr-px-chip button{min-height:40px;min-width:40px;padding:0 10px;border:1px solid var(--ln,#444);border-radius:8px;background:transparent;color:inherit;font:600 12px Inter,system-ui,sans-serif;cursor:pointer}" +
    "@media (max-width:600px){#ipr-px-chip{max-width:calc(100% - 24px);bottom:70px}#ipr-px-f select{flex-basis:100%}}";
  function css() { if (document.getElementById("ipr-px-css")) return; var s = el("style"); s.id = "ipr-px-css"; s.textContent = ESTILO; (document.head || document.documentElement).appendChild(s); }

  // ===================== 1 e 2. Pesquisa, filtros e estado de implementação (17040, 17046) =====================
  var F = { q: "", e: "", d: "", i: "" };
  var IMPL = {}, IMPL_LISTA = null, IMPL_OFF = false, IMPL_IDS = "", IMPL_PEDIDO = false;

  function estadoDe(m) {
    if (!m) return "";
    if (m.rever || /revis/i.test(String(m.estado || ""))) return "rev";
    if (m.estado_k === "completed") return "ent";
    if (m.estado_k === "on-hold" || m.estado_k === "pending" || m.estado_k === "failed" || /an[aá]lise/i.test(String(m.estado || ""))) return "an";
    if (m.estado_k === "processing") return "prep";
    return "outro";
  }
  function mapaDoCartao(c) {
    var P = est(), i = c.getAttribute("data-i"); if (!P || !P.mapas || i == null || !/^\d+$/.test(i)) return null;
    var m = P.mapas[+i]; if (!m) return null;
    var mono = c.querySelector(".ipe-ct .mono"), txt = mono ? mono.textContent : "";
    return (txt.indexOf("#" + m.encomenda) >= 0 || txt.indexOf("#" + m.id) >= 0) ? m : null;
  }
  function filtroActivo() { return !!(F.q || F.e || F.d || F.i); }
  function corresponde(c, m) {
    if (F.q) {
      var q = norm(F.q).trim().replace(/^#/, ""), h = m ? norm([m.local, "#" + m.encomenda, "#" + m.id, m.id, m.encomenda, m.pedido, m.de, m.data].join(" ")) : norm(c.textContent);
      if (q.split(/\s+/).some(function (p) { return p && h.indexOf(p) < 0; })) return false;
    }
    if (F.e) { var e = m ? estadoDe(m) : ""; if (e !== F.e) return false; }
    if (F.d) { if (!m) return false; var meu = m.dono !== false && !m.rever; if ((F.d === "meus") !== meu) return false; }
    if (F.i) { if (!m) return false; var k = (IMPL[String(m.id)] || {}).k || "sem"; if (k !== F.i) return false; }
    return true;
  }
  function cartoes() { var b = document.getElementById("ipe-proj"); return b ? [].slice.call(b.querySelectorAll(".ipe-card")) : []; }
  function aplicarFiltro() {
    var box = document.getElementById("ipe-proj"); if (!box) return;
    var cs = cartoes(), on = filtroActivo(), vis = 0, tot = 0;
    cs.forEach(function (c) {
      if (c.closest(".ipr-todas")) return;
      tot++;
      var ok = !on || corresponde(c, mapaDoCartao(c));
      if (c.classList.contains("ipr-px-off") === ok) c.classList.toggle("ipr-px-off", !ok);
      if (ok) vis++;
    });
    // Títulos dos grupos («Os seus projectos», «Partilhados consigo», «Para rever») sem nenhum cartão à vista
    [].forEach.call(box.querySelectorAll(".ipe-cards"), function (g) {
      var h = g.previousElementSibling; if (!h || !h.matches("h3.ipe-h")) return;
      var algum = !on || [].some.call(g.querySelectorAll(".ipe-card"), function (c) { return !c.classList.contains("ipr-px-off"); });
      if (h.classList.contains("ipr-px-off") === algum) h.classList.toggle("ipr-px-off", !algum);
    });
    var bar = document.getElementById("ipr-px-f");
    if (bar) {
      var n = bar.querySelector(".ipr-px-n"); if (n) n.textContent = on ? (vis ? t("mostrar")(vis, tot) : t("nenhum")) : "";
      var l = bar.querySelector(".ipr-px-l"); if (l) l.hidden = !on;
    }
  }
  function opcoes(sel, lista, actual) {
    sel.textContent = "";
    lista.forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; if (o[0] === actual) op.selected = true; sel.appendChild(op); });
  }
  function implLista() {
    return IMPL_LISTA || [["por_iniciar", "Por iniciar", "Not started"], ["desenho", "Em desenho", "In design"], ["proposta", "Proposta enviada", "Proposal sent"],
      ["adjudicado", "Adjudicado", "Awarded"], ["implementacao", "Em implementação", "Being implemented"], ["acompanhamento", "Em acompanhamento", "Follow-up"],
      ["implementado", "Implementado", "Implemented"], ["parado", "Parado", "On hold"]];
  }
  function implNome(k) { var x = implLista().filter(function (o) { return o[0] === k; })[0]; return x ? (lg() === "en" ? x[2] : x[1]) : ""; }
  var BAR_LG = "";
  function barra() {
    var pane = document.querySelector('#ipe .ipe-pane[data-pane="proj"]'), box = document.getElementById("ipe-proj");
    if (!pane || !box || box.parentNode !== pane) return null;
    var P = est(), n = P && P.mapas ? P.mapas.length : 0;
    var pode = sessao() && P && P.dados && !P.dados.bloqueado && n >= 2;
    var bar = document.getElementById("ipr-px-f");
    if (!pode) { if (bar) bar.hidden = true; return null; }
    css();
    if (!bar) {
      bar = el("div"); bar.id = "ipr-px-f"; bar.setAttribute("role", "search");
      bar.addEventListener("input", function (e) { try { if (e.target.id === "ipr-px-q") { F.q = e.target.value; aplicarFiltro(); } } catch (x) {} });
      bar.addEventListener("change", function (e) { try { var k = e.target.getAttribute("data-px-f"); if (k) { F[k] = e.target.value; aplicarFiltro(); } } catch (x) {} });
      bar.addEventListener("click", function (e) { try { if (e.target.closest(".ipr-px-l")) { F = { q: "", e: "", d: "", i: "" }; BAR_LG = ""; desenharBarra(bar); aplicarFiltro(); var q = document.getElementById("ipr-px-q"); if (q) q.focus(); } } catch (x) {} });
      parar(bar);
    }
    if (bar.nextElementSibling !== box) pane.insertBefore(bar, box);
    bar.hidden = false;
    var assin = lg() + "|" + (equipa() && !IMPL_OFF ? 1 : 0) + "|" + (IMPL_LISTA ? 1 : 0) + "|" + contagens();
    if (BAR_LG !== assin) { BAR_LG = assin; desenharBarra(bar); }
    return bar;
  }
  function contagens() {
    var P = est(), c = { ent: 0, prep: 0, an: 0, rev: 0, outro: 0 };
    ((P && P.mapas) || []).forEach(function (m) { var e = estadoDe(m); if (c[e] != null) c[e]++; });
    return [c.ent, c.prep, c.an, c.rev, c.outro].join(",");
  }
  function desenharBarra(bar) {
    var foco = document.activeElement && bar.contains(document.activeElement) ? document.activeElement.id || document.activeElement.getAttribute("data-px-f") : "";
    bar.textContent = "";
    var q = el("input"); q.type = "search"; q.id = "ipr-px-q"; q.placeholder = t("procurar"); q.setAttribute("aria-label", t("procurarL")); q.value = F.q; q.autocomplete = "off";
    bar.appendChild(q);
    var c = contagens().split(",").map(Number);
    var se = el("select"); se.setAttribute("data-px-f", "e"); se.setAttribute("aria-label", t("estado"));
    var le = [["", t("eTodos")], ["ent", t("eEnt") + " (" + c[0] + ")"], ["prep", t("ePrep") + " (" + c[1] + ")"], ["an", t("eAn") + " (" + c[2] + ")"], ["rev", t("eRev") + " (" + c[3] + ")"]];
    if (c[4]) le.push(["outro", t("eOutro") + " (" + c[4] + ")"]);
    opcoes(se, le, F.e); bar.appendChild(se);
    var sd = el("select"); sd.setAttribute("data-px-f", "d"); sd.setAttribute("aria-label", t("dono"));
    opcoes(sd, [["", t("dTodos")], ["meus", t("dMeus")], ["part", t("dPart")]], F.d); bar.appendChild(sd);
    if (equipa() && !IMPL_OFF) {
      var si = el("select"); si.setAttribute("data-px-f", "i"); si.setAttribute("aria-label", t("impl"));
      opcoes(si, [["", t("iTodos")], ["sem", t("iSem")]].concat(implLista().map(function (o) { return [o[0], lg() === "en" ? o[2] : o[1]]; })), F.i);
      bar.appendChild(si);
    }
    var n = el("span", "ipr-px-n"); n.setAttribute("aria-live", "polite"); bar.appendChild(n);
    var l = botao(t("limpar"), "ipr-px-l"); l.hidden = !filtroActivo(); bar.appendChild(l);
    if (foco) { var f = bar.querySelector("#" + foco) || bar.querySelector('[data-px-f="' + foco + '"]'); if (f) try { f.focus({ preventScroll: true }); } catch (x) {} }
  }

  // Estado de implementação: um campo em cada cartão (só equipa).
  function idsDosMapas() { var P = est(); return ((P && P.mapas) || []).map(function (m) { return String(m.id); }).filter(function (x) { return /^\d+$/.test(x); }).slice(0, 200); }
  function carregarImpl() {
    if (IMPL_OFF || IMPL_PEDIDO || !equipa() || !sessao()) return;
    var ids = idsDosMapas(); if (!ids.length) return;
    var chave = ids.slice().sort().join(","); if (chave === IMPL_IDS) return;
    IMPL_PEDIDO = true;
    api("m90553/impl?ids=" + encodeURIComponent(ids.join(","))).then(function (j) {
      IMPL_PEDIDO = false; IMPL_IDS = chave;
      if (j && Array.isArray(j.lista) && j.lista.length) IMPL_LISTA = j.lista;
      var e = (j && j.estados) || {}; Object.keys(e).forEach(function (k) { IMPL[k] = e[k] || {}; });
      pintarImpl(true); barra(); aplicarFiltro();
    }).catch(function (x) { IMPL_PEDIDO = false; if (x && (x.status === 403 || x.status === 404 || x.status === 401)) { IMPL_OFF = true; tirarImpl(); barra(); } else IMPL_IDS = chave; });
  }
  function tirarImpl() { [].forEach.call(document.querySelectorAll("#ipe-proj .ipr-px-im"), function (x) { x.remove(); }); }
  function dataTxt(s) { if (!s) return ""; try { return new Date(s * 1000).toLocaleDateString(lg() === "en" ? "en-GB" : "pt-PT"); } catch (e) { return ""; } }
  function pintarImpl(forca) {
    if (IMPL_OFF || !equipa() || !IMPL_IDS) return;
    cartoes().forEach(function (c) {
      var m = mapaDoCartao(c), ct = c.querySelector(".ipe-ct"); if (!m || !ct) return;
      var id = String(m.id), w = ct.querySelector(":scope > .ipr-px-im"), d = IMPL[id] || {}, assin = lg() + "|" + (d.k || "") + "|" + (d.em || "");
      if (w && w.__pxAte && Date.now() < w.__pxAte) return; // «Guardado» fica à vista um momento
      if (w && !forca && w.getAttribute("data-px") === assin) return;
      if (w && w.contains(document.activeElement) && !forca) return;
      if (!w) {
        w = el("div", "ipr-px-im"); w.setAttribute("data-px-id", id); parar(w);
        w.addEventListener("change", function (e) { try { gravarImpl(w, e.target); } catch (x) {} });
        var pill = ct.querySelector(":scope > .ipe-pill");
        if (pill && pill.nextSibling) ct.insertBefore(w, pill.nextSibling); else ct.appendChild(w);
      }
      w.setAttribute("data-px", assin);
      w.textContent = "";
      var sid = "ipr-px-im-" + id, lab = el("label", "", t("impl")); lab.htmlFor = sid;
      var sp = el("span"); sp.appendChild(lab); w.appendChild(sp);
      var s = el("select"); s.id = sid; s.title = t("implT");
      opcoes(s, [["", "—"]].concat(implLista().map(function (o) { return [o[0], lg() === "en" ? o[2] : o[1]]; })), d.k || "");
      if (d.k) s.classList.add("tem");
      w.appendChild(s);
      if (d.k && (d.por || d.em)) { var sm = el("small", "", t("por")(d.por, dataTxt(d.em))); w.appendChild(sm); }
    });
  }
  function gravarImpl(w, s) {
    if (!s || s.tagName !== "SELECT") return;
    var id = w.getAttribute("data-px-id"), k = s.value;
    s.disabled = true;
    var msg = w.querySelector("small") || w.appendChild(el("small")); msg.className = ""; msg.textContent = "…";
    api("m90553/impl", { method: "POST", body: { enc: +id, k: k } }).then(function (j) {
      IMPL[id] = (j && j.estado) || {};
      s.disabled = false; msg.textContent = t("gravado"); s.classList.toggle("tem", !!k); w.__pxAte = Date.now() + 1500;
      setTimeout(function () { try { pintarImpl(true); aplicarFiltro(); } catch (x) {} }, 1600);
    }).catch(function (x) { s.disabled = false; s.value = (IMPL[id] || {}).k || ""; msg.className = "mau"; msg.textContent = t("erroG") + (x && x.message ? ": " + x.message : ""); });
  }

  // ===================== 3. Usar um local guardado como terreno (17050) =====================
  function locaisAreas() {
    var Ta = {}; try { Ta = JSON.parse(localStorage.getItem("ipe_locais_v1") || "{}") || {}; } catch (e) { Ta = {}; }
    var P = est(), grupos = [], vistos = {};
    var nomeProj = function (id) { var m = ((P && P.mapas) || []).filter(function (x) { return String(x.id) === id; })[0]; return m ? (m.local || "#" + (m.encomenda || id)) : "#" + id; };
    Object.keys(Ta).sort(function (a, b) { return (a[0] === "p") - (b[0] === "p"); }).forEach(function (k) {
      var l = Ta[k]; if (!Array.isArray(l)) return;
      var itens = l.filter(function (x) {
        if (!x || x.tipo !== "area" || !Array.isArray(x.c) || !Array.isArray(x.c[0]) || x.c[0].length < 4) return false;
        var ch = JSON.stringify(x.c).slice(0, 400); if (vistos[ch]) return false; vistos[ch] = 1; return true;
      });
      if (!itens.length) return;
      var nome = k[0] === "p" ? t("locProj") + nomeProj(k.slice(1)) : t("locConta");
      var g = grupos.filter(function (x) { return x.nome === nome; })[0];
      if (g) g.itens = g.itens.concat(itens); else grupos.push({ nome: nome, itens: itens });
    });
    return grupos;
  }
  function ficheiroDe(nome, geoms) {
    var fc = { type: "FeatureCollection", features: geoms.map(function (g) { return { type: "Feature", properties: { name: nome }, geometry: g }; }) };
    var base = String(nome || "terreno").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || "terreno";
    var txt = JSON.stringify(fc);
    try { return new File([txt], base + ".geojson", { type: "application/geo+json" }); }
    catch (e) { var b = new Blob([txt], { type: "application/geo+json" }); b.name = base + ".geojson"; b.lastModified = Date.now(); return b; }
  }
  // Pelo caminho do próprio Atlas: o mesmo que escolher o ficheiro em «Carregar ficheiro» (ou largá-lo sobre o mapa).
  function porNoTerreno(f) {
    var novo = document.querySelector('#ipe-guia [data-guia="novo"]'); if (novo) novo.click(); // depois de um pedido enviado
    var limpar = document.getElementById("ipe-limpar"); if (limpar && !limpar.disabled) limpar.click();
    var inp = document.getElementById("ipe-file");
    if (inp && typeof DataTransfer === "function") {
      try { var dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; if (inp.files && inp.files.length) { inp.dispatchEvent(new Event("change", { bubbles: true })); return true; } } catch (e) {}
    }
    var alvo = document.getElementById("ipe-mapa");
    if (alvo) {
      try { var ev = new Event("drop", { bubbles: true, cancelable: true }); Object.defineProperty(ev, "dataTransfer", { value: { files: [f] } }); alvo.dispatchEvent(ev); return true; } catch (e) {}
    }
    return false;
  }
  var LOC_AB = false;
  function blocoLocais() {
    var form = document.getElementById("ipe-form"), met = form && form.querySelector(".ipe-met"); if (!form || !met) return;
    css();
    var b = document.getElementById("ipr-px-loc");
    if (!b) {
      b = el("div", "ipr-px-bloco"); b.id = "ipr-px-loc";
      b.addEventListener("click", function (e) { try { cliqueLocais(e); } catch (x) {} });
    }
    if (met.nextElementSibling !== b) met.parentNode.insertBefore(b, met.nextSibling);
    if (b.getAttribute("data-lg") !== lg() + (LOC_AB ? 1 : 0)) desenharLocais(b);
  }
  function desenharLocais(b, msg, mau) {
    b.setAttribute("data-lg", lg() + (LOC_AB ? 1 : 0));
    b.textContent = "";
    var tg = botao(t("locBotao"), "ipr-px-b" + (LOC_AB ? " ac" : ""), { "data-px-loc": "abrir", "aria-expanded": String(LOC_AB), "aria-controls": "ipr-px-loc-l" });
    tg.title = t("locT");
    b.appendChild(tg);
    if (LOC_AB) {
      var gs = locaisAreas(), box = el("div"); box.id = "ipr-px-loc-l"; box.style.marginTop = "6px";
      if (!gs.length) box.appendChild(el("p", "", t("locVazio")));
      else {
        box.appendChild(el("p", "", t("locT")));
        var ul = el("ul");
        gs.forEach(function (g, gi) {
          ul.appendChild(el("li", "ipr-px-sub", g.nome));
          g.itens.forEach(function (x, xi) {
            var li = el("li"), nm = el("span", "ipr-px-nm", x.nome || t("locSem"));
            nm.appendChild(el("small", "", num(areaHa({ type: "Polygon", coordinates: x.c }), 2) + " ha"));
            li.appendChild(nm);
            li.appendChild(botao(t("locUsar"), "ipr-px-b ac", { "data-px-loc": "usar", "data-g": String(gi), "data-x": String(xi) }));
            ul.appendChild(li);
          });
        });
        box.appendChild(ul);
      }
      b.appendChild(box);
    }
    if (msg) { var m = el("small", "ipr-px-msg" + (mau ? " mau" : ""), msg); m.setAttribute("role", "status"); b.appendChild(m); }
  }
  function cliqueLocais(e) {
    var a = e.target.closest("[data-px-loc]"); if (!a) return;
    var b = document.getElementById("ipr-px-loc");
    if (a.getAttribute("data-px-loc") === "abrir") { LOC_AB = !LOC_AB; desenharLocais(b); return; }
    var gs = locaisAreas(), g = gs[+a.getAttribute("data-g")], x = g && g.itens[+a.getAttribute("data-x")];
    if (!x) return;
    var nome = x.nome || t("locSem");
    var ok = porNoTerreno(ficheiroDe(nome, [{ type: "Polygon", coordinates: x.c }]));
    LOC_AB = false; desenharLocais(b, ok ? t("locFeito")(nome) : t("locFalhou"), !ok);
  }

  // ===================== 5. Terrenos no mapa: editar pontos, separar, um por encomenda (16427) =====================
  var FILA = "ipr_projectos_extra_fila_v1";
  function lerFila() { try { var o = JSON.parse(localStorage.getItem(FILA) || "null"); if (!o || !Array.isArray(o.itens) || Date.now() - (+o.t || 0) > 14 * 864e5) return []; return o.itens.filter(function (x) { return x && x.g && /Polygon$/.test(x.g.type); }); } catch (e) { return []; } }
  function gravarFila(l) { try { if (l.length) localStorage.setItem(FILA, JSON.stringify({ t: Date.now(), itens: l.slice(0, 50) })); else localStorage.removeItem(FILA); } catch (e) {} }
  function desenho() {
    var M = mapa(); if (!M) return null;
    var cs = M._controls || [];
    for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (c && typeof c.getAll === "function" && typeof c.changeMode === "function" && typeof c.trash === "function" && typeof c.add === "function") return c; }
    return null;
  }
  function terrenos(D) { try { return D.getAll().features.filter(function (f) { return f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"); }); } catch (e) { return []; } }
  // Avisar o Atlas como o próprio mapbox-gl-draw faria (área, preço, parcelas do cadastro e terreno guardado).
  function avisar(tipo, fs) { var M = mapa(); if (M && M.fire) try { M.fire(tipo, { features: fs || [], action: "change_coordinates" }); } catch (e) {} }
  var ED = null; // id do terreno em edição
  function modo(D) { try { return D.getMode(); } catch (e) { return ""; } }
  function pontosEscolhidos(D) { try { return D.getSelectedPoints().features.length; } catch (e) { return 0; } }
  function tirar3d() {
    var P = est(); if (!P || !P.em3d) return;
    var b = document.querySelector('#ipe [data-tool="3d"]'); if (b) b.click();
  }
  function ferramentaNav() {
    var P = est(); if (!P || P.tool === "nav") return;
    var b = document.querySelector('#ipe .ipe-t[data-tool="nav"]'); if (b) b.click();
  }
  function editar(D, id) {
    tirar3d(); ferramentaNav();
    try { D.changeMode("direct_select", { featureId: id }); ED = id; } catch (e) { ED = null; }
    var f = null; try { f = D.get(id); } catch (e) {}
    var M = mapa(), b = f && caixa(f.geometry);
    if (M && b) { var c = M.getBounds && M.getBounds(); var dentro = c && c.contains([b[0], b[1]]) && c.contains([b[2], b[3]]); if (!dentro) try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, maxZoom: 18, duration: 500 }); } catch (e) {} }
  }
  function concluir(D) { ED = null; try { D.changeMode("simple_select"); } catch (e) {} }
  function apagar(D, ids) {
    var fs = ids.map(function (id) { try { return D.get(id); } catch (e) { return null; } }).filter(Boolean);
    if (!fs.length) return;
    if (ED && ids.indexOf(ED) >= 0) concluir(D);
    try { D.delete(ids); } catch (e) {}
    avisar("draw.delete", fs);
  }
  function separar(D, id) {
    var f = null; try { f = D.get(id); } catch (e) {}
    if (!f || f.geometry.type !== "MultiPolygon") return;
    if (ED === id) concluir(D);
    try { D.delete(id); } catch (e) {}
    avisar("draw.delete", [f]);
    var novos = [];
    f.geometry.coordinates.forEach(function (p) { try { var nid = D.add({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: p } })[0]; var nf = D.get(nid); if (nf) novos.push(nf); } catch (e) {} });
    avisar("draw.update", novos);
  }
  function soEste(D, id) {
    var todos = terrenos(D), resto = todos.filter(function (f) { return f.id !== id; }), fila = lerFila();
    if (!resto.length) {
      var f = todos[0]; if (f && f.geometry.type === "MultiPolygon" && f.geometry.coordinates.length > 1) { separar(D, id); var t2 = terrenos(D); if (t2.length) soEste(D, t2[0].id); }
      return;
    }
    var nomes = [], idx = 0;
    todos.forEach(function (f, i) { if (f.id !== id) { idx = i + 1; nomes.push({ nome: t("terreno") + idx, g: f.geometry }); } });
    gravarFila(fila.concat(nomes));
    apagar(D, resto.map(function (f) { return f.id; }));
    MSG = t("guardados")(resto.length);
  }
  function carregarSeguinte() {
    var fila = lerFila(); if (!fila.length) return;
    var x = fila.shift(); gravarFila(fila);
    ED = null;
    var ok = porNoTerreno(ficheiroDe(x.nome, [x.g]));
    if (!ok) { fila.unshift(x); gravarFila(fila); MSG = t("locFalhou"); }
    else MSG = "";
  }
  var MSG = "", POL_ASS = "";
  function blocoTerrenos() {
    var form = document.getElementById("ipe-form"), plist = document.getElementById("ipe-plist"); if (!form || !plist) return;
    var P = est(), D = desenho(), ts = D && P && P.modo === "encomenda" ? terrenos(D) : [], fila = lerFila();
    var b = document.getElementById("ipr-px-pol");
    if (!ts.length && !fila.length) { if (b) { b.hidden = true; b.textContent = ""; } POL_ASS = ""; if (ED) ED = null; return; }
    css();
    if (!b) {
      b = el("div", "ipr-px-bloco"); b.id = "ipr-px-pol"; b.setAttribute("aria-label", t("polT"));
      b.addEventListener("click", function (e) { try { cliqueTerrenos(e); } catch (x) {} });
    }
    if (plist.nextElementSibling !== b) plist.parentNode.insertBefore(b, plist.nextSibling);
    b.hidden = false;
    var md = D ? modo(D) : "";
    if (ED && (md !== "direct_select" || !ts.some(function (f) { return f.id === ED; }))) ED = null;
    var ass = [lg(), md, ED, D ? pontosEscolhidos(D) : 0, fila.length, MSG, ts.map(function (f) { return f.id + ":" + f.geometry.type + ":" + Math.round(areaHa(f.geometry) * 100); }).join(",")].join("|");
    if (ass === POL_ASS) return;
    POL_ASS = ass;
    var foco = document.activeElement && b.contains(document.activeElement) ? document.activeElement.getAttribute("data-px-k") : "";
    b.textContent = "";
    if (ts.length) {
      b.appendChild(el("b", "ipr-px-h", t("polT")));
      var partes = ts.reduce(function (s, f) { return s + (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.length : 1); }, 0);
      if (partes > 1) b.appendChild(el("p", "", t("polAj")));
      var ul = el("ul");
      ts.forEach(function (f, i) {
        var li = el("li"), multi = f.geometry.type === "MultiPolygon" && f.geometry.coordinates.length > 1;
        var nm = el("span", "ipr-px-nm", t("terreno") + (i + 1));
        nm.appendChild(el("small", "", num(areaHa(f.geometry), 2) + " ha" + (multi ? " · " + f.geometry.coordinates.length + t("partes") : "")));
        li.appendChild(nm);
        if (!multi) li.appendChild(botao(t("editar"), "ipr-px-b" + (ED === f.id ? " ac" : ""), { "data-px-a": "editar", "data-px-id": String(f.id), "data-px-k": "e" + i, "aria-pressed": String(ED === f.id) }));
        if (multi) li.appendChild(botao(t("separar"), "ipr-px-b", { "data-px-a": "separar", "data-px-id": String(f.id), "data-px-k": "s" + i }));
        if (partes > 1) li.appendChild(botao(t("soEste"), "ipr-px-b", { "data-px-a": "so", "data-px-id": String(f.id), "data-px-k": "o" + i }));
        li.appendChild(botao(t("apagar"), "ipr-px-b mau", { "data-px-a": "apagar", "data-px-id": String(f.id), "data-px-k": "a" + i }));
        ul.appendChild(li);
      });
      b.appendChild(ul);
      if (ED) {
        b.appendChild(el("p", "", t("editando")));
        var acc = el("div", "ipr-px-acc");
        var ap = botao(t("apagarPonto"), "ipr-px-b", { "data-px-a": "ponto", "data-px-k": "p" }); ap.disabled = !pontosEscolhidos(D); acc.appendChild(ap);
        acc.appendChild(botao(t("concluir"), "ipr-px-b ac", { "data-px-a": "concluir", "data-px-k": "c" }));
        b.appendChild(acc);
      }
    }
    if (fila.length) {
      var fb = el("div"); fb.style.marginTop = ts.length ? "8px" : "0";
      fb.appendChild(el("b", "ipr-px-h", t("fila")(fila.length)));
      var acc2 = el("div", "ipr-px-acc");
      acc2.appendChild(botao(t("seguinte"), "ipr-px-b ac", { "data-px-a": "seguinte", "data-px-k": "n" }));
      var es = botao(t("esquecer"), "ipr-px-b", { "data-px-a": "esquecer", "data-px-k": "x" }); es.title = t("esquecerT"); acc2.appendChild(es);
      fb.appendChild(acc2);
      b.appendChild(fb);
    }
    if (MSG) { var m = el("small", "ipr-px-msg", MSG); m.setAttribute("role", "status"); b.appendChild(m); }
    if (foco) { var fe = b.querySelector('[data-px-k="' + foco + '"]'); if (fe && !fe.disabled) try { fe.focus({ preventScroll: true }); } catch (x) {} }
  }
  function cliqueTerrenos(e) {
    var a = e.target.closest("[data-px-a]"); if (!a || a.disabled) return;
    var D = desenho(), k = a.getAttribute("data-px-a"), id = a.getAttribute("data-px-id");
    if (k !== "seguinte" && k !== "esquecer") MSG = "";
    if (k === "seguinte") carregarSeguinte();
    else if (k === "esquecer") { gravarFila([]); MSG = ""; }
    else if (!D) return;
    else if (k === "editar") { if (ED === id) concluir(D); else editar(D, id); }
    else if (k === "concluir") concluir(D);
    else if (k === "ponto") { try { D.trash(); } catch (x) {} }
    else if (k === "separar") separar(D, id);
    else if (k === "so") soEste(D, id);
    else if (k === "apagar") apagar(D, [id]);
    POL_ASS = ""; blocoTerrenos();
  }
  var MAPA_OUVIDO = null;
  function ouvirMapa() {
    var M = mapa(); if (!M || M === MAPA_OUVIDO || !M.on) return; MAPA_OUVIDO = M;
    ["draw.create", "draw.update", "draw.delete", "draw.modechange", "draw.selectionchange"].forEach(function (v) {
      M.on(v, function () { setTimeout(function () { try { blocoTerrenos(); } catch (x) {} }, 0); });
    });
  }

  // ===================== 4. Limite de uma encomenda que não abre como projecto (17051) =====================
  var LIM = { estado: 0, dados: null, fechado: false, mapa: null, enq: false, mexeu: false };
  var LIM_N = (function () { try { var n = new URLSearchParams(location.search).get("mapa"); return n && /^\d{1,9}$/.test(n) ? n : ""; } catch (e) { return ""; } })();
  function limitePrecisa() {
    var P = est(); if (!P) return false;
    return !(P.modo === "cliente" && P.actual && String(P.actual.id) === LIM_N && P.actual.geojson);
  }
  function limitePedir() {
    if (!LIM_N || !sessao() || LIM.estado) return;
    var P = est(); if (!P || P.dados === null || P.dados === undefined) { if (!limitePedir.t0) limitePedir.t0 = Date.now(); if (Date.now() - limitePedir.t0 < 40000) return; }
    if (!limitePrecisa()) { LIM.estado = 3; return; }
    LIM.estado = 1;
    api("m90553/limite?enc=" + encodeURIComponent(LIM_N)).then(function (j) { LIM.dados = j; LIM.estado = 2; limiteDesenhar(); }).catch(function () { LIM.estado = 3; });
  }
  function limiteTirar(M) {
    M = M || mapa(); if (!M || !M.getLayer) return;
    ["ipr-px-lim-f", "ipr-px-lim-c", "ipr-px-lim-l"].forEach(function (id) { try { if (M.getLayer(id)) M.removeLayer(id); } catch (e) {} });
    try { if (M.getSource("ipr-px-lim")) M.removeSource("ipr-px-lim"); } catch (e) {}
  }
  function limiteEnquadrar(dur) {
    var M = mapa(), b = LIM.dados && caixa(LIM.dados.geojson); if (!M || !b) return;
    try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: window.innerWidth < 700 ? 40 : 90, maxZoom: 17, duration: dur == null ? 700 : dur }); } catch (e) {}
  }
  function limiteChip() {
    var alvo = document.getElementById("ipe-mapa"), d = LIM.dados;
    var c = document.getElementById("ipr-px-chip");
    if (!alvo || !d || LIM.fechado || !limitePrecisa()) { if (c) c.remove(); return; }
    css();
    var txt = d.geojson ? t("limTit") + d.id + (d.local ? " · " + d.local : "") + (d.estado ? " · " + d.estado : "") : t("limSem") + d.id + t("limSemTxt");
    if (c && c.parentNode === alvo && c.getAttribute("data-t") === txt + lg()) return;
    if (!c) {
      c = el("div"); c.id = "ipr-px-chip"; c.setAttribute("role", "status"); parar(c);
      c.addEventListener("click", function (e) { try { var a = e.target.closest("[data-px-c]"); if (!a) return; if (a.getAttribute("data-px-c") === "fechar") { LIM.fechado = true; limiteTirar(); limiteChip(); } else limiteEnquadrar(); } catch (x) {} });
    }
    if (c.parentNode !== alvo) alvo.appendChild(c);
    c.setAttribute("data-t", txt + lg());
    c.textContent = "";
    c.appendChild(el("span", "", txt));
    if (d.geojson) c.appendChild(botao(t("enquadrar"), "", { "data-px-c": "enq" }));
    var x = botao("×", "", { "data-px-c": "fechar", "aria-label": t("fechar"), title: t("fechar") }); c.appendChild(x);
  }
  function limiteDesenhar() {
    if (LIM.estado !== 2 || !LIM.dados) return;
    var M = mapa(), precisa = limitePrecisa() && !LIM.fechado;
    limiteChip();
    if (!M || !M.getSource || !LIM.dados.geojson) return;
    if (!precisa) { limiteTirar(M); return; }
    if (!(M.isStyleLoaded ? M.isStyleLoaded() : M.loaded())) return;
    if (M.getSource("ipr-px-lim")) return;
    try {
      M.addSource("ipr-px-lim", { type: "geojson", data: LIM.dados.geojson });
      M.addLayer({ id: "ipr-px-lim-f", type: "fill", source: "ipr-px-lim", paint: { "fill-color": "#ff9a3c", "fill-opacity": 0.12 } });
      M.addLayer({ id: "ipr-px-lim-c", type: "line", source: "ipr-px-lim", paint: { "line-color": "#3f4630", "line-width": 5, "line-opacity": 0.55 } });
      M.addLayer({ id: "ipr-px-lim-l", type: "line", source: "ipr-px-lim", paint: { "line-color": "#ff9a3c", "line-width": 3 } });
    } catch (e) { return; }
    if (M !== LIM.mapa) {
      LIM.mapa = M;
      try { var cv = M.getCanvasContainer(); ["mousedown", "touchstart", "wheel"].forEach(function (v) { cv.addEventListener(v, function () { LIM.mexeu = true; }, { passive: true }); }); } catch (e) {}
    }
    if (!LIM.enq) {
      LIM.enq = true; var t0 = Date.now();
      (function esperar() {
        if (LIM.mexeu || Date.now() - t0 > 20000) return;
        if (window.__ipeAb || document.querySelector(".ipe-ab-saltar")) { setTimeout(esperar, 400); return; }
        limiteEnquadrar(800);
      })();
    }
  }

  // ===================== ciclo =====================
  var OBS = null;
  function observar() {
    var box = document.getElementById("ipe-proj"); if (!box || box.__iprPx) return;
    box.__iprPx = 1;
    try { OBS = new MutationObserver(function () { clearTimeout(observar.t); observar.t = setTimeout(function () { try { pintarImpl(false); aplicarFiltro(); } catch (e) {} }, 80); }); OBS.observe(box, { childList: true, subtree: true }); } catch (e) {}
  }
  function passo() {
    try { if (barra()) { observar(); aplicarFiltro(); } } catch (e) {}
    try { carregarImpl(); pintarImpl(false); } catch (e) {}
    try { blocoLocais(); } catch (e) {}
    try { ouvirMapa(); blocoTerrenos(); } catch (e) {}
    try { limitePedir(); limiteDesenhar(); } catch (e) {}
  }
  function ciclo() { passo(); setTimeout(ciclo, document.getElementById("ipe-form") ? 1200 : 400); }
  setTimeout(ciclo, 300);
  document.addEventListener("ipr:lingua", function () { try { BAR_LG = ""; POL_ASS = ""; var l = document.getElementById("ipr-px-loc"); if (l) l.removeAttribute("data-lg"); pintarImpl(true); passo(); } catch (e) {} });
})();
