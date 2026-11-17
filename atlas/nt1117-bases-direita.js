/* IPR Atlas · As Bases ficam só à direita (Nuno, 17/11/2026, 21h07: «se temos este aqui [o botão «Bases» no mapa], do que é que
   serve termos lá à direita o bases também?»; caixa de escolha: «Juntar à direita»). Terracrua Design.
   O separador «Bases» da direita ganha, em cada Base que tem relevo na Cloud, o interruptor que estava no botão «Bases» do mapa:
   liga e desliga o relevo, as curvas, as linhas de água e o limite dessa Base sem a abrir (usa window.iprBasesLista, do
   nt1114-bases-lista.js, que continua a fazer o trabalho). Por cima da lista: «Ligar no mapa sem abrir» e «Desligar todas».
   O botão «Bases» do canto do mapa deixa de aparecer. «Abrir» continua igual. Nada é apagado.
   Desligar (volta o botão do mapa): ?bdireita=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]bdireita=0(&|$)/.test(location.search) || W.__iprBDir) return; W.__iprBDir = 1;
  function en() { return /^en/i.test(D.documentElement.lang || ""); }
  function t(pt, e) { return en() ? e : pt; }
  function api() { return W.iprBasesLista; }
  function est() { return (W.__ipe && W.__ipe.estado) || {}; }
  function comRelevo() {
    var st = est(), s = {};
    [].concat(st.mapas || [], (st.dados && st.dados.partilhados) || []).forEach(function (m) {
      if (m && (m.downloads || []).some(function (x) { return /\.(pmtiles|geojson)$/i.test((x && x.nome) || ""); })) s[String(m.id)] = 1;
    });
    return s;
  }
  function actual() { var a = est().actual; return a && a.id ? String(a.id) : ""; }
  var css = D.createElement("style");
  css.textContent = "#ipr-bl-wrap{display:none!important}" +
    ".ipr-bd-sw{display:inline-flex;align-items:center;gap:4px;margin-right:6px;font-size:11px;opacity:.9;cursor:pointer;white-space:nowrap}" +
    ".ipr-bd-sw input{accent-color:#94be39;cursor:pointer}.ipr-bd-cab{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;font-size:12px;opacity:.9}" +
    ".ipr-bd-cab button{font:inherit;font-size:11.5px;background:transparent;color:inherit;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:2px 8px;cursor:pointer}";
  D.head.appendChild(css);

  function pintar() {
    var A = api(), pane = D.querySelector('#ipe-dir .ipe-pane[data-pane="proj"]');
    if (!A || !pane) return;
    var rel = comRelevo(), lig = {}, cur = actual();
    (A.ligadas() || []).forEach(function (id) { lig[String(id)] = 1; });
    var algum = false;
    pane.querySelectorAll('li a[href*="mapa="]').forEach(function (a) {
      var m = /[?&]mapa=(\d+)/.exec(a.getAttribute("href") || ""); if (!m) return;
      var id = m[1], li = a.closest("li"); if (!li || !rel[id] || id === cur) return;
      algum = true;
      var sw = li.querySelector(".ipr-bd-sw");
      if (!sw) {
        sw = D.createElement("label"); sw.className = "ipr-bd-sw"; sw.title = t("Ligar no mapa sem abrir (relevo, curvas, linhas de água e limite)", "Show on the map without opening");
        sw.innerHTML = '<input type="checkbox" data-bd="' + id + '"><span>' + t("no mapa", "on map") + "</span>";
        a.parentNode.insertBefore(sw, a);
      }
      var cb = sw.querySelector("input"); if (cb.checked !== !!lig[id]) cb.checked = !!lig[id];
    });
    var lista = pane.querySelector("section.tme");
    if (algum && lista && !pane.querySelector(".ipr-bd-cab")) {
      var c = D.createElement("div"); c.className = "ipr-bd-cab";
      c.innerHTML = "<span>" + t("Interruptor «no mapa»: liga a Base no mapa sem a abrir.", "«On map» switch: shows a Base without opening it.") + '</span><button type="button" data-bd-todas>' + t("Desligar todas", "Turn all off") + "</button>";
      lista.parentNode.insertBefore(c, lista);
    }
  }
  D.addEventListener("change", function (e) {
    var cb = e.target; if (!cb || !cb.matches || !cb.matches("input[data-bd]")) return;
    var A = api(); if (!A) return;
    var id = cb.getAttribute("data-bd");
    if (cb.checked) A.ligar(id); else A.desligar(id);
    setTimeout(pintar, 300);
  }, true);
  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-bd-todas]"); if (!b) return;
    var A = api(); if (!A) return; e.preventDefault();
    (A.ligadas() || []).forEach(function (id) { A.desligar(id); });
    setTimeout(pintar, 300);
  }, true);
  var ult = 0, pend = null;
  function rever() { var n = Date.now(); if (n - ult < 250) { if (!pend) pend = setTimeout(function () { pend = null; rever(); }, 250); return; } ult = n; try { pintar(); } catch (x) {} }
  new MutationObserver(rever).observe(D.documentElement, { childList: true, subtree: true });
  rever();
})();
