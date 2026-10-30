/* IPR Atlas · primeiro ecrã simples (decisão do Nuno, 28/10/2026, 03h16: «esta página resumida [...] deve aparecer um
   botão a dizer quer explorar o mapa, já tenho experiência em mapas [...] sou utilizador avançado»; 03h19: «lança tudo»).
   Quem abre o /atlas/ sem nada no endereço vê primeiro: procurar o terreno, desenhar ou carregar, e os quatro documentos.
   «Explorar o mapa completo» fecha o ecrã e fica lembrado neste navegador (localStorage ipr_atlas_avancado = 1).
   Não aparece quando o endereço já traz um destino (modo, mapa, nic, v, tour, hash de vista). Não mexe no app.js:
   a pesquisa usa o formulário do próprio Atlas (#ipe-busca). Desligar: window.IPR_INICIO_OFF = true antes de carregar. */
(function () {
  'use strict';
  if (window.IPR_INICIO_OFF) { return; }
  var K = 'ipr_atlas_avancado';
  try { if (localStorage.getItem(K) === '1') { return; } } catch (e) { /* sem armazenamento: mostra */ }
  var q = new URLSearchParams(location.search);
  var destino = ['modo', 'mapa', 'nic', 'v', 'tour', 'ponto', 'c', 'f', 'grupo', 'ferramenta'].some(function (k) { return q.has(k); });
  if (destino || (location.hash && location.hash.length > 1)) { return; }
  var EN = /^en/i.test(document.documentElement.lang || '') || q.get('lang') === 'en';
  var PROMO = Date.now() < 1798761600000;
  var T = EN ? {
    h1: 'Your land, on a map.', lead: 'Find it and see the free reading straight away: constraints, water, relief and wildfire hazard. Then choose the document you need.',
    onde: 'Where is the land?', ph: 'Place, address, coordinates or NIC', proc: 'Search', des: 'Draw the boundary', fich: 'Upload a file',
    docs: [['Location Plan', '€19'], ['Quick Land Reading', 'free'], ['Territorial Reading', PROMO ? 'from €125 · −50%' : 'from €250'], ['Cartographic Base', 'from €99']],
    adv: 'Explore the full map', advs: 'I already work with maps: 100+ layers, 3D, measuring and tools. Remembered for next time.'
  } : {
    h1: 'O seu terreno, num mapa.', lead: 'Procure-o e veja logo a leitura grátis: condicionantes, água, relevo e risco de incêndio. Depois escolha o documento de que precisa.',
    onde: 'Onde fica o terreno?', ph: 'Lugar, morada, coordenadas ou NIC', proc: 'Procurar', des: 'Desenhar o limite', fich: 'Carregar ficheiro',
    docs: [['Planta de Localização', '19 €'], ['Leitura do Terreno', 'grátis'], ['Leitura Territorial', PROMO ? 'desde 125 € · −50 %' : 'desde 250 €'], ['Base Cartográfica', 'desde 99 €']],
    adv: 'Explorar o mapa completo', advs: 'Já trabalho com mapas: mais de 100 camadas, 3D, medições e ferramentas. Fica lembrado para a próxima vez.'
  };
  var css = '#ipr-ini{position:fixed;inset:0;z-index:2147481000;background:rgba(15,23,11,.86);color:#E4E2D8;font:15px/1.5 Inter,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;overflow:auto;padding:max(48px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}'
    + '#ipr-ini .w{width:100%;max-width:760px;display:flex;flex-direction:column;gap:18px;margin:auto 0}'
    + '#ipr-ini h1{margin:0;font:600 clamp(30px,5vw,44px)/1.1 Outfit,sans-serif;color:#E4E2D8}#ipr-ini p{margin:0}#ipr-ini .ld{font-size:17px;color:#C9C8BC}'
    + '#ipr-ini form{background:#14200F;border:1px solid #2E3A26;border-radius:2px;padding:16px;display:flex;flex-direction:column;gap:10px}#ipr-ini label{font-weight:600}'
    + '#ipr-ini .r{display:flex;gap:8px;flex-wrap:wrap}#ipr-ini input{flex:1 1 260px;min-width:0;font:17px Inter,sans-serif;color:#E4E2D8;background:#0F170B;border:1px solid #4A5740;border-radius:2px;padding:13px;min-height:50px}'
    + '#ipr-ini input::placeholder{color:#9AA088}#ipr-ini .p{font:600 16px Inter,sans-serif;background:#94BE39;color:#0F170B;border:0;border-radius:2px;padding:0 22px;min-height:50px;cursor:pointer}'
    + '#ipr-ini .s{font:500 14px Inter,sans-serif;background:transparent;color:#E4E2D8;border:1px solid #4A5740;border-radius:2px;padding:10px 14px;min-height:44px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}'
    + '#ipr-ini .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}#ipr-ini .g a{text-decoration:none;color:#E4E2D8;background:#14200F;border:1px solid #2E3A26;border-radius:2px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}'
    + '#ipr-ini .g span{font:13px "IBM Plex Mono",monospace;color:#9AA088}#ipr-ini .adv{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:10px;text-align:center}'
    + '#ipr-ini .adv button{font:600 15px Inter,sans-serif;background:transparent;color:#E4E2D8;border:1px solid #E4E2D8;border-radius:2px;padding:12px 20px;min-height:46px;cursor:pointer}#ipr-ini .adv small{font-size:13px;color:#9AA088}';
  function el(tag, attrs, txt) { var n = document.createElement(tag); for (var k in attrs) { n.setAttribute(k, attrs[k]); } if (txt) { n.textContent = txt; } return n; }
  function fecha(lembra) {
    var o = document.getElementById('ipr-ini'); if (o) { o.remove(); }
    if (lembra) { try { localStorage.setItem(K, '1'); } catch (e) { /* ignora */ } }
  }
  function procura(v) {
    var tenta = 0;
    (function t() {
      var f = document.getElementById('ipe-busca'), i = document.getElementById('ipe-q');
      if (!f || !i) { if (++tenta < 40) { setTimeout(t, 250); } return; }
      i.value = v;
      if (f.requestSubmit) { f.requestSubmit(); } else { f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
    })();
  }
  function monta() {
    if (document.getElementById('ipr-ini')) { return; }
    var st = el('style'); st.textContent = css; document.head.appendChild(st);
    var o = el('div', { id: 'ipr-ini', role: 'dialog', 'aria-modal': 'true', 'aria-label': T.h1 });
    var w = el('div', { class: 'w' });
    w.appendChild(el('h1', {}, T.h1));
    w.appendChild(el('p', { class: 'ld' }, T.lead));
    var f = el('form', { role: 'search' });
    f.appendChild(el('label', { for: 'ipr-ini-q' }, T.onde));
    var r = el('div', { class: 'r' });
    var inp = el('input', { id: 'ipr-ini-q', type: 'search', autocomplete: 'off', placeholder: T.ph });
    r.appendChild(inp); r.appendChild(el('button', { type: 'submit', class: 'p' }, T.proc));
    f.appendChild(r);
    var r2 = el('div', { class: 'r' });
    r2.appendChild(el('a', { class: 's', href: '/atlas/?modo=encomenda' }, T.des));
    r2.appendChild(el('a', { class: 's', href: '/atlas/?modo=encomenda' }, T.fich));
    f.appendChild(r2);
    f.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value.trim(); if (!v) { inp.focus(); return; } fecha(false); procura(v); });
    w.appendChild(f);
    var g = el('div', { class: 'g' });
    T.docs.forEach(function (d) { var a = el('a', { href: '/atlas/?modo=encomenda' }); a.appendChild(el('b', {}, d[0])); a.appendChild(el('span', {}, d[1])); g.appendChild(a); });
    w.appendChild(g);
    var adv = el('div', { class: 'adv' });
    var b = el('button', { type: 'button' }, T.adv + ' →');
    b.addEventListener('click', function () { fecha(true); });
    adv.appendChild(b); adv.appendChild(el('small', {}, T.advs));
    w.appendChild(adv);
    o.appendChild(w);
    document.body.appendChild(o);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape' && document.getElementById('ipr-ini')) { fecha(false); document.removeEventListener('keydown', esc); } });
    setTimeout(function () { inp.focus(); }, 50);
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', monta); } else { monta(); }
})();
