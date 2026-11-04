/* IPR Atlas · Opacidade em todas as camadas da Base aberta e do exemplo (Nuno, 4/11/2026, 23h31: «é super importante que
 * as camadas tenham um coisinho de transparência», com o Torgal aberto em /atlas/?mapa=18032).
 * Causa: a lista «Os meus projectos» (minhas-bases.js) só põe a barra de opacidade quando encontra a linha da camada na
 * árvore; com o grupo «A minha Base Cartográfica» escondido não a encontra e as camadas ligadas ficam sem barra.
 * Aqui: cada camada ligada da Base que não tenha barra ganha uma, com o valor lido do próprio mapa. O arrastar é tratado
 * pelo minhas-bases.js (mudarOpacidade, que já muda o mapa directamente quando não há linha na árvore).
 * O mesmo para o exemplo público (lista com data-am): barra por camada ligada, aplicada às camadas ipe-am-<id>-*.
 * Só acrescenta; não altera outros ficheiros. Desligar: ?base-opacidade=0. Falha em silêncio. Terracrua Design. */
(function () {
  'use strict';
  try { if (/[?&]base-opacidade=0(&|$)/.test(location.search)) return; } catch (e) {}
  if (window.__iprBaseOp) return; window.__iprBaseOp = 1;
  var PROP = { raster: 'raster-opacity', line: 'line-opacity', fill: 'fill-opacity', circle: 'circle-opacity', symbol: 'icon-opacity' };

  function mapa() { var i = window.__ipe; return i && i.mapa; }
  function camadas(pref) {
    var M = mapa(), st = M && M.getStyle && M.getStyle();
    if (!st) return [];
    return st.layers.filter(function (l) { return l.id === pref || l.id.indexOf(pref + '-') === 0; });
  }
  function ler(pref) {
    var M = mapa(), ls = camadas(pref);
    for (var i = 0; i < ls.length; i++) {
      var p = PROP[ls[i].type]; if (!p || ls[i].type === 'fill') continue;
      try { var v = M.getPaintProperty(ls[i].id, p); if (typeof v === 'number') return Math.round(v * 100); } catch (e) {}
    }
    return ls.length ? 100 : null;
  }
  function aplicar(pref, v) {
    var M = mapa();
    camadas(pref).forEach(function (l) {
      var p = PROP[l.type]; if (!p || l.type === 'fill') return; // o preenchimento ténue dos polígonos fica como está
      try { M.setPaintProperty(l.id, p, v / 100); } catch (e) {}
    });
  }
  function barra(v, nome) {
    var r = document.createElement('input');
    r.type = 'range'; r.min = '10'; r.max = '100'; r.value = String(v);
    r.className = 'ipr-mb-op ipr-bo';
    r.setAttribute('aria-label', 'Opacidade de ' + nome);
    r.title = 'Opacidade';
    return r;
  }

  function base() {
    document.querySelectorAll('#ipr-mb li.ipr-mb-it.on[data-mb-c]').forEach(function (li) {
      if (li.querySelector('input[type=range]')) return;
      var id = li.getAttribute('data-mb-c'), v = ler('iprv-' + id);
      if (v == null) return; // ainda não está no mapa; volta a tentar na próxima mudança
      var n = li.querySelector('.ipr-mb-n');
      li.appendChild(barra(v, n ? n.textContent : id));
    });
  }

  function exemplo() {
    document.querySelectorAll('input[type=checkbox][data-am]').forEach(function (ck) {
      var row = ck.closest('li') || ck.parentElement; if (!row) return;
      var r = row.querySelector('input[type=range]');
      if (!ck.checked) { if (r && r.classList.contains('ipr-bo')) r.remove(); return; }
      if (r) return;
      var id = ck.getAttribute('data-am'), v = ler('ipe-am-' + id);
      if (v == null) return;
      r = barra(v, (row.textContent || id).trim());
      r.style.cssText = 'display:block;width:calc(100% - 30px);margin:2px 0 4px 26px;height:14px;accent-color:#94BE39';
      r.addEventListener('input', function () { aplicar('ipe-am-' + id, +r.value); });
      r.addEventListener('click', function (e) { e.stopPropagation(); });
      row.appendChild(r);
    });
  }

  var agendado = false;
  function correr() {
    if (agendado) return; agendado = true;
    setTimeout(function () { agendado = false; try { base(); exemplo(); } catch (e) {} }, 120);
  }
  function iniciar() {
    correr();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t && t.classList && t.classList.contains('ipr-bo')) return; }
      correr();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'checked'] });
    // as camadas chegam ao mapa depois do clique: voltar a ver quando o mapa acaba de desenhar
    var t = setInterval(function () { var M = mapa(); if (M && M.on) { clearInterval(t); M.on('idle', correr); } }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
