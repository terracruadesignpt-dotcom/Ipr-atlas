/* IPR Atlas · caixa dos convites à vista (2/11/2026, 13h40; Nuno: «Em que ponto é que isso está [os convites]?»).
   Causa encontrada: as ligações dos convites (/atlas/?acesso=IPR-XXXXXX, m90573, e /atlas/?convite=PRO-XXXXXX, m90136)
   põem a caixa «Confirme o e-mail para activar» por cima do Atlas, no fluxo da página. Desde que o Atlas passou a ocupar o
   ecrã inteiro, essa caixa fica por baixo do mapa; desde 28/10 fica também por baixo do primeiro ecrã («O seu terreno,
   num mapa.», inicio.js), que não conta o acesso nem o convite como destino. Ninguém via o botão «Activar»: 0 códigos
   usados em 567, e a Junta de Moncarapacho acabou por criar conta pela página da conta, sem a oferta.
   Este acrescento (sem mexer no inicio.js nem nos módulos PHP): com ?acesso= ou ?convite= no endereço, não deixa abrir o
   primeiro ecrã e mostra a caixa do convite numa janela por cima de tudo, com «Fechar» para ir ao mapa.
   Desligar: ?convjanela=0. */
(function () {
  'use strict';
  var W = window, D = document, q;
  try { q = new URLSearchParams(W.location.search); } catch (e) { return; }
  if (!(q.has('acesso') || q.has('convite')) || q.get('convjanela') === '0') { return; }
  W.IPR_INICIO_OFF = true;
  if (W.__iprConvJanela) { return; } W.__iprConvJanela = 1;
  var EN = /^en/i.test(D.documentElement.lang || '') || q.get('lang') === 'en';
  function monta() {
    var cx = D.querySelector('.tcvsr, .tcvr');
    if (!cx || D.getElementById('ipr-convj')) { return !!cx; }
    var ini = D.getElementById('ipr-ini'); if (ini) { ini.remove(); }
    D.documentElement.classList.remove('ipr-ini-on');
    var st = D.createElement('style'); st.id = 'ipr-convj-css';
    st.textContent = '#ipr-convj{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,11,.72);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(24px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}' +
      '#ipr-convj>.ipr-convj-in{width:100%;max-width:720px;margin:auto 0}' +
      '#ipr-convj .tcvsr,#ipr-convj .tcvr{margin:0 auto!important;max-width:720px;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
      '#ipr-convj .ipr-convj-f{display:block;margin:12px auto 0;padding:9px 18px;border:1px solid #E4E2D8;border-radius:8px;background:transparent;color:#E4E2D8;font:14px/1.2 Inter,system-ui,sans-serif;cursor:pointer}';
    (D.head || D.documentElement).appendChild(st);
    var j = D.createElement('div'); j.id = 'ipr-convj'; j.setAttribute('role', 'dialog'); j.setAttribute('aria-modal', 'true');
    var dentro = D.createElement('div'); dentro.className = 'ipr-convj-in';
    var f = D.createElement('button'); f.type = 'button'; f.className = 'ipr-convj-f';
    f.textContent = EN ? 'Close and go to the map' : 'Fechar e ir para o mapa';
    f.addEventListener('click', function () { j.remove(); });
    D.querySelectorAll('.tcvsr, .tcvr').forEach(function (c) { dentro.appendChild(c); });
    dentro.appendChild(f); j.appendChild(dentro); D.body.appendChild(j);
    var em = j.querySelector('input[type="email"]'); if (em) { try { em.focus({ preventScroll: true }); } catch (e) {} }
    return true;
  }
  function tenta(n) { if (monta() || n > 40) { return; } setTimeout(function () { tenta(n + 1); }, 250); }
  if (D.readyState === 'loading') { D.addEventListener('DOMContentLoaded', function () { tenta(0); }); } else { tenta(0); }
})();
