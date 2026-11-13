/* IPR Atlas · organizacoes.js (13/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Nuno, 13/11/2026, 09h57: «Dá-me um link para eu visitá-la como proprietário no Atlas [...] e na comunidade eu quero ver
   as organizações que eu faço parte.»
   1. Comunidade: bloco «As minhas organizações» no topo do separador, com cada organização de window.IPR_ORGS (nome, papel,
      «activa»), um botão «Abrir» e, quando a organização tem configurador SOT-IPR, o botão «Configurador».
   2. Ligação directa: /atlas/?org=<id> torna essa organização a activa (o mesmo pedido do selector do ajustes.js §36,
      ipr_org + _ipr_org) e abre o separador «Organização».
   3. Quem abre uma organização por aqui volta a ver o separador «Organização» neste navegador: usa o interruptor
      previsto no topo-projectos.js (localStorage ipr_topo_org = 1). Quem nunca abre continua sem o separador.
   Desligar: ?orgs=0 ou localStorage ipr_orgs_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]orgs=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_orgs_off") === "1") return; } catch (e) {}
  if (W.__iprOrgs) return; W.__iprOrgs = 1;

  var ENT = W.IPR_ORG_ENT || { "19065": "adxtur" }; // organização → entidade do configurador (m91120; lista escrita pelo m91122)
  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function en() { return String(W.IPR_LINGUA || "pt").slice(0, 2) === "en"; }
  function O() { var o = W.IPR_ORGS; return o && o.lista && o.lista.length ? o : null; }

  function mostrarSeparador() {
    if (ls("ipr_topo_org") !== "1") return;
    if (D.getElementById("ipr-orgs-css2")) return;
    var s = D.createElement("style"); s.id = "ipr-orgs-css2";
    s.textContent = 'html #ipe .ipe-tab[data-tab="org"]{display:block!important}';
    (D.head || D.documentElement).appendChild(s);
  }
  // O arranque do Atlas escolhe outro separador depois de carregar: insiste até 12 s, e pára logo que a pessoa mexe.
  function abrirSeparador(insistir) {
    var fim = Date.now() + (insistir ? 12000 : 3000), parou = false;
    function parar() { parou = true; }
    if (insistir) ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (v) { D.addEventListener(v, parar, { capture: true, once: true }); });
    (function t() {
      if (parou) return;
      var tab = D.querySelector('#ipe .ipe-tab[data-tab="org"]');
      if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
      if (Date.now() < fim) setTimeout(t, 400);
    })();
  }
  function abrir(id, url) {
    var o = O(); if (!o) return;
    ls("ipr_topo_org", "1"); mostrarSeparador();
    if (+id !== +o.activa && o.nonce) {
      location.href = "/atlas/?ipr_org=" + encodeURIComponent(id) + "&_ipr_org=" + encodeURIComponent(o.nonce) + "&separador=org";
      return;
    }
    abrirSeparador(!!url);
  }
  W.iprAbrirOrganizacao = abrir;

  // 2. ?org=<id>. Sem sessão iniciada, vai primeiro ao «Entrar» e volta a esta mesma ligação.
  (function () {
    var m0 = /[?&]org=(\d+)(&|$)/.exec(location.search); if (!m0 || O()) return;
    function ver() {
      if (O() || !D.body || D.body.classList.contains("logged-in")) return;
      location.href = "/wp-login.php?redirect_to=" + encodeURIComponent(location.pathname + location.search);
    }
    if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", ver); else ver();
  })();
  (function () {
    var m = /[?&]org=(\d+)(&|$)/.exec(location.search); if (!m) return;
    var o = O(); if (!o) return;
    if (!o.lista.some(function (x) { return +x.id === +m[1]; })) return;
    abrir(m[1], true);
  })();
  mostrarSeparador();
  if (ls("ipr_topo_org") === "1" && /[?&]separador=org(&|$)/.test(location.search) && !/[?&]org=\d/.test(location.search)) abrirSeparador(true);

  // 1. Comunidade
  var CSS = "#ipr-orgs{margin:10px 10px 12px;border:1px solid var(--ln,#3a3f33);border-radius:10px;padding:10px 12px;font:13px/1.35 Inter,sans-serif;color:var(--tx,#e9eadf)}" +
    "#ipr-orgs h3{margin:0 0 8px;font:600 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mu,#9aa08f)}" +
    "#ipr-orgs .l{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--ln,#3a3f33)}#ipr-orgs .l:first-of-type{border-top:0}" +
    "#ipr-orgs .n{flex:1 1 auto;min-width:0}#ipr-orgs .n b{display:block;font-weight:600;overflow-wrap:anywhere}" +
    "#ipr-orgs .n small{color:var(--mu,#9aa08f)}#ipr-orgs .act{color:#94BE39}" +
    "#ipr-orgs button{flex:0 0 auto;font:600 12px Inter,sans-serif;border-radius:7px;padding:5px 9px;cursor:pointer;border:1px solid var(--ln,#3a3f33);background:transparent;color:var(--tx,#e9eadf)}" +
    "#ipr-orgs button.p{background:#94BE39;border-color:#94BE39;color:#111}";
  function bloco() {
    var o = O(), com = D.getElementById("ipe-com"); if (!o || !com) return;
    var b = D.getElementById("ipr-orgs");
    if (b && b.parentNode === com && com.firstChild === b) return;
    if (!D.getElementById("ipr-orgs-css")) { var s = D.createElement("style"); s.id = "ipr-orgs-css"; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }
    if (!b) {
      b = D.createElement("section"); b.id = "ipr-orgs"; b.setAttribute("aria-label", en() ? "My organisations" : "As minhas organizações");
      var h = "<h3>" + (en() ? "My organisations" : "As minhas organizações") + "</h3>";
      o.lista.forEach(function (x) {
        var act = +x.id === +o.activa, ent = ENT[String(x.id)];
        h += '<div class="l"><div class="n"><b title="' + esc(x.nome) + '">' + esc(x.nome) + "</b><small>" + esc(x.papel || "") +
          (act ? ' · <span class="act">' + (en() ? "active" : "activa") + "</span>" : "") + "</small></div>" +
          (ent ? '<button type="button" data-orgs-ent="' + esc(ent) + '" title="' + (en() ? "SOT-IPR configurator" : "Configurador SOT-IPR") + '">' + (en() ? "Configurator" : "Configurador") + "</button>" : "") +
          '<button type="button" class="p" data-orgs-abrir="' + esc(x.id) + '">' + (en() ? "Open" : "Abrir") + "</button></div>";
      });
      b.innerHTML = h;
      ["mousedown", "pointerdown", "touchstart", "keydown"].forEach(function (v) { b.addEventListener(v, function (e) { e.stopPropagation(); }); });
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var a = e.target.closest("[data-orgs-abrir]"); if (a) { abrir(a.getAttribute("data-orgs-abrir")); return; }
        var c = e.target.closest("[data-orgs-ent]"); if (c) location.href = "/atlas/?entidade=" + encodeURIComponent(c.getAttribute("data-orgs-ent"));
      });
    }
    com.insertBefore(b, com.firstChild);
  }
  var t = 0;
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x && x.closest && x.closest("#ipr-orgs")) continue; clearTimeout(t); t = setTimeout(function () { try { bloco(); } catch (e) {} }, 150); return; }
  }).observe(D.documentElement, { childList: true, subtree: true });
  try { bloco(); } catch (e) {}
})();
