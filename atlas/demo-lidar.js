/* IPR Atlas · Projecto de demonstração do LiDAR no grupo «Relevo e terreno» (Nuno, 4/11/2026, 18h59: «faz o grupo
 * lidar para meter o projeto de demonstração da qualidade do lidar, que é a bacia do Torgal»).
 * Mostra no topo do grupo um cartão da sub-bacia da Ribeira do Torgal (Base #18032, módulo m90892 no site):
 *  - quem a tem na lista de projectos (contas com área de cliente: vem como «Projecto de demonstração») abre-a como uma
 *    Base, com todas as camadas, curvas de nível incluídas, e os simuladores de água e de fogo;
 *  - quem não tem sessão ou Base paga vê o exemplo público (as mesmas camadas raster, servidas por partes).
 * Não carrega nada até ao clique. Terracrua Design. */
(function () {
  'use strict';
  var ID = String(window.IPR_DEMO_ID || 18032);
  var T = 'Sub-bacia da Ribeira do Torgal (Mira)';
  var D = '16 409 ha de LiDAR da DGT tratados pelo IPR: relevo, declives, linhas de água, humidade (TWI), erosão, ' +
    'formas do relevo, curvas de nível. Serve para ver a qualidade dos dados antes de encomendar e para correr os ' +
    'simuladores de água e de fogo sem Base própria.';

  function css() {
    if (document.getElementById('ipr-dl-css')) return;
    var s = document.createElement('style');
    s.id = 'ipr-dl-css';
    s.textContent =
      '.ipr-dl{list-style:none;margin:4px 0 8px;padding:9px 10px;border:1px solid rgba(148,190,57,.45);border-radius:6px;background:rgba(148,190,57,.08)}' +
      '.ipr-dl b{display:block;font-size:12.5px;line-height:1.3}' +
      '.ipr-dl small{display:block;margin:3px 0 7px;font-size:11.5px;line-height:1.35;opacity:.8}' +
      '.ipr-dl button{font:600 12px/1 inherit;background:#94BE39;color:#14200F;border:0;border-radius:4px;padding:7px 10px;cursor:pointer}' +
      '.ipr-dl button:hover{filter:brightness(1.08)}' +
      '.ipr-dl .ipr-dl-k{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:3px}';
    document.head.appendChild(s);
  }

  function naLista() {
    var e = window.__ipe && window.__ipe.estado;
    return !!(e && e.mapas && e.mapas.some(function (m) { return String(m.id) === ID; }));
  }

  function abrir() {
    if (naLista()) { location.href = '/atlas/?mapa=' + ID; return; }
    var b = document.querySelector('[data-am="ir"]');
    if (b) {
      b.click();
      // Relevo sombreado e MDT ligados de facto: uma caixa pode vir marcada de uma visita anterior sem a camada no mapa.
      setTimeout(function () {
        var m = window.__ipe && window.__ipe.mapa;
        ['somb_bw', 'mdt'].forEach(function (id) {
          var q = function () { return document.querySelector('input[data-am="' + id + '"]'); };
          var i = q();
          if (!i || (i.checked && m && m.getLayer('ipe-am-' + id + '-r'))) return;
          if (i.checked) { i.click(); i = q(); }
          if (i && !i.checked) i.click();
        });
      }, 300);
      return;
    }
    location.href = '/atlas/?mapa=' + ID;
  }

  function cartao() {
    var li = document.createElement('li');
    li.className = 'ipr-dl';
    li.innerHTML = '<div class="ipr-dl-k">Projecto de demonstração · LiDAR</div><b></b><small></small>' +
      '<button type="button">Abrir o projecto de demonstração</button>';
    li.querySelector('b').textContent = T;
    li.querySelector('small').textContent = D;
    li.querySelector('button').addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); abrir(); });
    return li;
  }

  function por() {
    document.querySelectorAll('.ipr-g[data-g="lidar"] ul.ipr-lista').forEach(function (ul) {
      if (ul.querySelector('.ipr-dl')) return;
      ul.insertBefore(cartao(), ul.firstChild);
    });
  }

  function iniciar() {
    css();
    por();
    new MutationObserver(function () { por(); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
