/* IPR Atlas · promoção da Leitura Territorial: −50 % até 31 de Dezembro de 2026 (decisão do Nuno, 28/10/2026).
   O servidor (módulo 90430) já cobra metade e devolve metade nos terrenos guardados; aqui só se corrige o valor
   que o Atlas calcula sozinho na encomenda (#ipe-preco-l), e avisa do pacote: Base e Leitura juntas, −10 % nas duas.
   A metade termina sozinha a 1/1/2027; o aviso do pacote fica. */
(function () {
  'use strict';
  var PROMO = Date.now() < 1798761600000;
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
  function pacote() {
    var c = document.querySelector('input[name="leitura"]');
    if (!c) { return; }
    var lab = c.closest('label') || c.parentNode;
    var n = document.getElementById('ipe-pacote');
    if (!n) {
      n = document.createElement('p');
      n.id = 'ipe-pacote';
      n.className = 'ipe-nota';
      n.textContent = 'Base e Leitura Territorial juntas: mais 10 % de desconto nas duas, aplicado no pagamento.';
      lab.parentNode.insertBefore(n, lab.nextSibling);
    }
    n.hidden = !c.checked;
  }
  function varre() { if (PROMO) { corrige(document.getElementById('ipe-preco-l')); } pacote(); }
  document.addEventListener('change', function (e) { if (e.target && e.target.name === 'leitura') { pacote(); } }, true);
  var obs = new MutationObserver(varre);
  function liga() {
    varre();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', liga); } else { liga(); }
})();
