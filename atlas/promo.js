/* IPR Atlas · promoção da Leitura Territorial: −50 % até 31 de Dezembro de 2026 (decisão do Nuno, 28/10/2026).
   O servidor (módulo 90430) já cobra metade e devolve metade nos terrenos guardados; aqui só se corrige o valor
   que o Atlas calcula sozinho na encomenda (#ipe-preco-l). Termina sozinho a 1/1/2027. */
(function () {
  'use strict';
  if (Date.now() >= 1798761600000) { return; }
  var ROT = ' · −50 % até 31/12';
  function corrige(el) {
    if (!el || el.getAttribute('data-p50') === el.textContent) { return; }
    var t = el.textContent || '';
    var m = t.match(/([0-9][0-9.  ]*)\s*€/);
    if (!m) { return; }
    var v = parseInt(m[1].replace(/[^0-9]/g, ''), 10);
    if (!v) { return; }
    var n = Math.round(v / 2).toLocaleString('pt-PT') + ' €';
    var novo = t.replace(m[0], n).replace(ROT, '') + ROT;
    el.textContent = novo;
    el.setAttribute('data-p50', novo);
  }
  function varre() { corrige(document.getElementById('ipe-preco-l')); }
  var obs = new MutationObserver(varre);
  function liga() {
    varre();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', liga); } else { liga(); }
})();
