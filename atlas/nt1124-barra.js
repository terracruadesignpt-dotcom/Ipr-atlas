/* IPR Atlas · Barra de cima arrumada (24/11/2026). Terracrua Design.
   Pedido do Nuno (15h35): a barra mistura o utilizador comum e o técnico; pesquisa curta; botões soltos.
   Linha 1 (para todos): marca · pesquisa larga · «Encontrar a minha terra» · … · Oficina · Comprar · conta (menu).
   Linha 2 (técnica, sobre o mapa): Camadas · Ferramentas (Analisar, Desenhar, Recolher) · Vistas guardadas · 3D e Vol.
   Só muda o sítio e o rótulo de botões que já existem (os mesmos elementos, com os mesmos eventos). Nada é apagado.
   Desligar: ?barra=0 ou localStorage ipr_barra=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]barra=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_barra") === "0") return; } catch (e) {}
  if (W.__iprBarra) return; W.__iprBarra = 1;
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function $(id) { return D.getElementById(id); }

  var CSS =
    /* linha 1 */
    ".ipe-top{gap:10px}.ipe-top>#ipe-beta,.ipe-top>.ipe-beta,.ipe-top>.ipe-vsep{display:none!important}" +
    ".ipe-top>#ipr-be-pq{flex:1 1 560px!important;max-width:760px!important;min-width:300px!important;width:auto!important}" +
    "#ipr-be-pq .ipe-sb,#ipr-be-pq .ipe-sbc,#ipr-be-pq #ipe-busca{width:100%!important;max-width:none!important}" +
    "#ipr-be-pq #ipe-busca{height:38px;border-radius:10px}#ipr-be-pq #ipe-q{flex:1 1 auto;min-width:0;font-size:14px}" +
    ".ipe-top>#ipr-tp-meio:not(:has(>:not([hidden]):not([style*='none'])))" + "{display:none!important}" +
    "#tb-bar>#ipr-pz-top{display:none!important}.ipe-top>#ipr-terra-topo{flex:0 0 auto;height:36px;padding:0 14px;border-radius:10px;border:1px solid #94BE39;background:rgba(148,190,57,.14);color:#e9f2cf;font:600 13px Inter,system-ui,sans-serif;white-space:nowrap;cursor:pointer}" +
    ".ipe-top>#ipr-terra-topo:hover{background:rgba(148,190,57,.28)}" +
    ".ipe-tr{gap:6px}.ipe-tr>#ipe-user,.ipe-tr>#ipr-sair-topo,.ipe-tr>#ipr-simh-top,.ipe-tr>#ipr-z67,.ipe-tr>#ipr-lg-topo{display:none!important}" +
    "#ipr-conta{position:relative}#ipr-conta>button{height:34px;padding:0 12px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#e9e6da;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}" +
    "#ipr-conta>button:after{content:' ▾';color:#94BE39}" +
    "#ipr-conta-m{position:absolute;right:0;top:40px;min-width:240px;padding:8px;border-radius:10px;background:#1b2014;border:1px solid rgba(148,190,57,.35);box-shadow:0 10px 30px rgba(0,0,0,.45);z-index:2147480100;display:none;flex-direction:column;gap:4px;font:13px Inter,system-ui,sans-serif;color:#e9e6da}" +
    "#ipr-conta.ab #ipr-conta-m{display:flex}" +
    "#ipr-conta-m>*{display:flex!important;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:6px;text-decoration:none;color:inherit;background:none;border:0;text-align:left;font:inherit;cursor:pointer;width:100%;box-sizing:border-box}" +
    "#ipr-conta-m>a:hover,#ipr-conta-m>button:hover{background:rgba(148,190,57,.14)}" +
    "#ipr-conta-m .rt{color:#9a9e8a;font-size:12px;cursor:default}#ipr-conta-m .sep{height:1px;padding:0;margin:4px 0;background:rgba(255,255,255,.1);cursor:default}" +
    "#ipr-conta-m #ipr-z67,#ipr-conta-m #ipr-lg-topo{display:inline-flex!important;padding:0;width:auto}" +
    /* linha 2 */
    /* um só sítio para comprar: os produtos estão no separador Começar; o «Comprar» abre-o */
    ".ipe-top>#ipr-be-topo{display:none!important}" +
        "#tb-bar .ipr-bt-l{font:600 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#9a9e8a;margin:0 4px 0 10px;align-self:center;white-space:nowrap}" +
    "";

  function contaMenu() {
    var tr = D.querySelector(".ipe-top .ipe-tr"), user = $("ipe-user");
    if (!tr || !user) return false;
    var box = $("ipr-conta");
    if (!box) {
      box = D.createElement("div"); box.id = "ipr-conta";
      var b = D.createElement("button"); b.type = "button"; b.setAttribute("aria-haspopup", "true");
      var m = D.createElement("div"); m.id = "ipr-conta-m"; m.setAttribute("role", "menu");
      box.appendChild(b); box.appendChild(m);
      var comprar = $("ipr-cp-b"); tr.insertBefore(box, comprar ? comprar.nextSibling : null);
      b.addEventListener("click", function (e) { e.stopPropagation(); box.classList.toggle("ab"); });
      D.addEventListener("click", function (e) { if (!box.contains(e.target)) box.classList.remove("ab"); });
      D.addEventListener("keydown", function (e) { if (e.key === "Escape") box.classList.remove("ab"); });
    }
    var bt = box.firstChild, menu = $("ipr-conta-m");
    var nome = (user.textContent || "").trim() || t("Conta", "Account");
    if (bt.textContent !== nome) bt.textContent = nome;
    // conteúdo: os próprios elementos (mesmos eventos), na ordem certa
    function linha(id, rotulo, el) {
      var l = $(id); if (!l) { l = D.createElement("div"); l.id = id; l.className = "rt"; menu.appendChild(l); }
      if (rotulo !== null && l.getAttribute("data-r") !== rotulo) { l.setAttribute("data-r", rotulo); l.innerHTML = "<span>" + rotulo + "</span>"; }
      if (el && el.parentNode !== l) l.appendChild(el);
      return l;
    }
    var sim = $("ipr-simh-top"), sair = $("ipr-sair-topo"), z = $("ipr-z67"), lg = $("ipr-lg-topo");
    var ord = [];
    if (user.parentNode !== menu) { user.style.removeProperty("display"); }
    ord.push(user);
    if (sim) ord.push(sim);
    var sep1 = $("ipr-conta-s1") || (function () { var s = D.createElement("div"); s.id = "ipr-conta-s1"; s.className = "sep"; return s; })(); ord.push(sep1);
    if (z) ord.push(linha("ipr-conta-z", t("Tamanho do ecrã", "Screen size"), z));
    if (lg) ord.push(linha("ipr-conta-lg", t("Língua", "Language"), lg));
    var beta = $("ipr-conta-beta") || (function () { var s = D.createElement("div"); s.id = "ipr-conta-beta"; s.className = "rt"; s.textContent = t("Versão beta: diga-nos o que falha (balão verde).", "Beta version: tell us what fails (green balloon)."); return s; })(); ord.push(beta);
    var sep2 = $("ipr-conta-s2") || (function () { var s = D.createElement("div"); s.id = "ipr-conta-s2"; s.className = "sep"; return s; })(); ord.push(sep2);
    if (sair) ord.push(sair);
    ord.forEach(function (el) { if (el.parentNode !== menu || el !== menu.children[ord.indexOf(el)]) menu.appendChild(el); });
    if (user.textContent.trim() !== t("A minha conta", "My account")) { user.setAttribute("data-nome", nome); user.textContent = t("A minha conta", "My account"); }
    if (sim && !/simula/i.test(sim.getAttribute("data-r") || "")) sim.setAttribute("data-r", "simula");
    return true;
  }
  function nomeConta() { var u = $("ipe-user"); return u ? (u.getAttribute("data-nome") || "") : ""; }

  function procurarTerra() {
    // botão próprio no topo (o original fica na linha técnica, escondido; outro módulo volta a pô-lo lá)
    var p = $("ipr-pz-top"), pq = $("ipr-be-pq"), top = D.querySelector(".ipe-top");
    if (!p || !pq || !top) return;
    var b = $("ipr-terra-topo");
    if (!b) {
      b = D.createElement("button"); b.type = "button"; b.id = "ipr-terra-topo";
      b.addEventListener("click", function () { var o = $("ipr-pz-top"); if (o) o.click(); });
    }
    b.textContent = t("Encontrar a minha terra", "Find my land");
    b.title = t("Mostre no mapa o seu terreno e veja a ficha gratuita", "Show your plot on the map and see the free sheet");
    if (b.parentNode !== top || b.previousElementSibling !== pq) top.insertBefore(b, pq.nextSibling);
  }

  function linha2() {
    var tb = $("tb-bar"); if (!tb) return;
    var modos = $("ipr-modos");
    if (modos && !(modos.previousElementSibling && modos.previousElementSibling.id === "ipr-bt-lf")) {
      var l = $("ipr-bt-lf") || D.createElement("span"); l.id = "ipr-bt-lf"; l.className = "ipr-bt-l"; l.textContent = t("Ferramentas", "Tools");
      tb.insertBefore(l, modos);
    }
    // «OS MEUS» → «Vistas guardadas»
    var m = tb.querySelector(".tb-m");
    if (m) {
      var w = D.createTreeWalker(m, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) { if (/^\s*os meus\s*$/i.test(n.nodeValue)) n.nodeValue = t("Vistas guardadas", "Saved views"); }
    }
  }

  var cpPreso = false;
  function comprar() {
    var b = $("ipr-cp-b"); if (!b || cpPreso) return; cpPreso = true;
    b.addEventListener("click", function (e) {
      var tb = D.querySelector('#ipe-tabs [data-tab="enc"]'); if (!tb) return;
      e.preventDefault(); e.stopImmediatePropagation();
      tb.click();
      var enc = D.getElementById("ipr-sep-enc"); if (enc) enc.scrollIntoView({ behavior: "smooth", block: "start" });
    }, true);
  }

  function correr() {
    if (!D.querySelector(".ipe-top")) return;
    if (!$("ipr-barra-css")) { var s = D.createElement("style"); s.id = "ipr-barra-css"; s.textContent = CSS; D.head.appendChild(s); }
    try { var q = $("ipe-q"); if (q && !q.getAttribute("data-ph")) { q.setAttribute("data-ph", "1"); q.placeholder = t("Morada, lugar, coordenadas ou NIC", "Address, place, coordinates or parcel ID"); } } catch (e) {}
    try { procurarTerra(); } catch (e) {}
    try { contaMenu(); var b = $("ipr-conta"); if (b && nomeConta() && b.firstChild.textContent !== nomeConta()) b.firstChild.textContent = nomeConta(); } catch (e) {}
    try { linha2(); } catch (e) {}
    try { comprar(); } catch (e) {}
  }
  (function vez(n) { correr(); if (n < 40) setTimeout(function () { vez(n + 1); }, 250); })(0);
  setInterval(correr, 2500);
  W.__iprBarraApi = { correr: correr };
})();
