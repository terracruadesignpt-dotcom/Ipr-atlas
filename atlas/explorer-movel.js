/* IPR Atlas · Explorer no telemóvel, simples (Nuno, 09/11/2026, 23h22, sobre o protótipo «IPR Atlas · Explorer»: «para a
 * versão mobile, para o explorer e para utilizadores que não estão habituados a mapas»; escolhas de 23h26: telemóvel e sem
 * Intelligence, sistema de design do IPR, entrada como no protótipo).
 *
 * Quem: ecrã estreito (até 700 px) e nível que não é Intelligence (IPR_NIVEL; a equipa e os assinantes ficam no Atlas
 * completo). «Abrir o mapa completo» sai deste modo e fica lembrado (localStorage ipr_exm = completo); ?simples=1 volta.
 *
 * O que faz, por cima do Atlas que já existe (não altera nenhum ficheiro dele, usa as funções que ele publica):
 *  1. Esconde no telemóvel a barra de cima, as barras laterais, as ferramentas de SIG e a barra de estado; o mapa fica.
 *  2. Entrada «O seu terreno, num mapa»: pesquisa (local, coordenadas ou NIC), desenhar ou carregar ficheiro, os quatro
 *     produtos com preço sem e com IVA (IPR_PRECOS), e «Já trabalho com mapas, abrir o mapa completo».
 *     O «Comprar passo a passo» deixa de abrir sozinho neste modo; abre pelo botão Comprar.
 *  3. Resultados da pesquisa com concelho e distrito antes de saltar; depois, «Por onde começar?» com quatro perfis.
 *  4. Painel de baixo: «O que quer ver?» com camadas por pergunta (REN, RAN, linhas de água, relevo, incêndio), explicação
 *     de cada sigla ao toque, Satélite ou Mapa, e a Ficha da propriedade do terreno escolhido, dentro do mesmo painel.
 *  5. Barra de cima mínima: marca, pesquisa e Comprar.
 * Nomes fixos: Ficha da propriedade, Planta de Localização, Leitura Territorial, Base Cartográfica.
 * Desligar: localStorage ipr_exm_off = 1 ou ?simples=0. Terracrua Design. */
(function () {
  'use strict';
  var W = window, D = document;
  var q = location.search;
  try {
    if (/[?&]simples=0(&|$)/.test(q) || localStorage.getItem('ipr_exm_off') === '1') return;
    if (/[?&]simples=1(&|$)/.test(q)) localStorage.removeItem('ipr_exm');
    if (/[?&]completo=1(&|$)/.test(q)) localStorage.setItem('ipr_exm', 'completo');
  } catch (e) {}
  if (W.__iprExm) return; W.__iprExm = 1;

  function estreito() { return W.matchMedia ? W.matchMedia('(max-width: 700px)').matches : W.innerWidth <= 700; }
  function intel() { return String(W.IPR_NIVEL || '').toLowerCase() === 'intelligence'; }
  function completo() { try { return localStorage.getItem('ipr_exm') === 'completo'; } catch (e) { return false; } }
  if (!estreito() || completo()) return;
  // O «Comprar passo a passo» não abre sozinho por cima da entrada (abre pelo botão Comprar).
  try { sessionStorage.setItem('ipr_as_auto', '1'); } catch (e) {}

  var EN = function () { return W.IPR_LINGUA === 'en'; };
  function T(pt, en) { return EN() ? en : pt; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function eur(v) { return (Math.round(v * 100) / 100).toLocaleString('pt-PT', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; }
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa; }
  function viz() { var i = ipe(); return i && i.viz && typeof i.viz.ligar === 'function' ? i.viz : null; }
  function gtag(n, p) { try { if (W.gtag) W.gtag('event', n, p || {}); } catch (e) {} }

  var P = W.IPR_PRECOS || {};
  function preco(k) {
    if (k === 'planta') return (P.planta && P.planta.preco) || 19;
    if (k === 'leitura') return (P.leitura && P.leitura.desde) || 79;
    if (k === 'base') return (P.base && P.base.desde) || 99;
    return 0;
  }
  function linhaPreco(k, desde) {
    var v = preco(k);
    return (desde ? T('desde ', 'from ') : '') + eur(v) + T(' + IVA', ' + VAT') + ' · ' + eur(v * 1.23) + T(' com IVA', ' with VAT');
  }

  // Camadas por pergunta: id do catálogo do Atlas, cor e explicação curta da sigla.
  var CAM = [
    { id: 'ren', cor: '#5aa9e6', pt: 'O que não posso construir (REN)', en: 'Where building is restricted (REN)', g: ['REN · Reserva Ecológica Nacional: áreas protegidas por causa da água, do solo e dos riscos naturais. Em regra não se constrói nelas.', 'REN · National Ecological Reserve: land protected for water, soil and natural hazards. Building is generally not allowed.'] },
    { id: 'ran', cor: '#c9a227', pt: 'Solos agrícolas protegidos (RAN)', en: 'Protected farmland (RAN)', g: ['RAN · Reserva Agrícola Nacional: os melhores solos para agricultura, reservados para esse uso.', 'RAN · National Agricultural Reserve: the best farming soils, kept for agriculture.'] },
    { id: 'hidro', cor: '#2f7fd8', pt: 'Linhas de água', en: 'Streams and rivers' },
    { id: 'r_curvas', cor: '#d9d3c4', pt: 'Relevo e curvas de nível', en: 'Relief and contour lines' },
    { id: 'perig_e', cor: '#e0592a', pt: 'Risco de incêndio', en: 'Wildfire hazard' }
  ];
  var ligadas = {};

  // ───────── estilos (sistema de design do IPR: verde-noite, verde IPR #94BE39, Outfit e Inter) ─────────
  function css() {
    if (D.getElementById('ipr-exm-css')) return;
    var s = D.createElement('style'); s.id = 'ipr-exm-css';
    s.textContent =
      'html.ipr-exm .ipe-top,html.ipr-exm #ipe-esq,html.ipr-exm #ipe-dir,html.ipr-exm .ipe-tools,html.ipr-exm #ipe-st,html.ipr-exm #ipr-tri,html.ipr-exm #ipr-as-b,html.ipr-exm .ipe-tour,html.ipr-exm #ipr-lingueta,html.ipr-exm #ipr-pb-barra,html.ipr-exm .maplibregl-ctrl-top-right,html.ipr-exm .maplibregl-ctrl-bottom-right .maplibregl-ctrl-scale{display:none!important}' +
      'html.ipr-exm .ipe-mapa{position:fixed!important;top:56px!important;left:0!important;right:0!important;bottom:60px!important;width:auto!important;height:auto!important;margin:0!important}' +
      '.ipr-exm-ui{--vn:#10170d;--vn2:#18221400;--p1:#161e13;--p2:#1f2a1a;--ln:#2e3a28;--tx:#eef0e6;--mu:#a7ae9b;--ac:#94BE39;font:15px/1.45 Inter,system-ui,sans-serif;color:var(--tx);letter-spacing:normal}.ipr-exm-ui *{letter-spacing:inherit}' +
      'html.ipr-exm #tcdck{z-index:2147480400!important}html.ipr-exm #tcdatdq-b{top:66px!important;bottom:auto!important}html.ipr-exm #tcdatdq{top:116px!important;bottom:auto!important}html.ipr-exm #tcdck *{letter-spacing:0!important}html.ipr-exm #tcdck p{font-size:12px!important;line-height:1.35!important;margin:2px 0 8px!important}html.ipr-exm #tcdck h2,html.ipr-exm #tcdck h3,html.ipr-exm #tcdck strong:first-child{font-size:13px!important;margin:0 0 2px!important}html.ipr-exm #tcdck .tcdck-c{padding:10px 12px!important}html.ipr-exm #tcdck button{min-height:40px!important;padding:8px 10px!important}html.ipr-exm body:has(#ipr-exm-bv:not([hidden])) #ipr-ca,html.ipr-exm body:has(#ipr-exm-pf:not([hidden])) #ipr-ca{display:none!important}' +
      '.ipr-exm-ui h1,.ipr-exm-ui h2,.ipr-exm-ui h3{font-family:Outfit,Inter,sans-serif;font-weight:600;letter-spacing:-.01em;margin:0}' +
      '.ipr-exm-ui button{font:inherit;color:inherit;cursor:pointer}' +
      '#ipr-exm-top{position:fixed;left:0;right:0;top:0;height:56px;z-index:2147480100;display:flex;align-items:center;gap:8px;padding:0 10px;background:var(--vn);border-bottom:1px solid var(--ln)}' +
      '#ipr-exm-top .m{font:600 15px Outfit,sans-serif;white-space:nowrap}#ipr-exm-top .m small{display:block;font:500 10px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--ac)}' +
      '#ipr-exm-top form{flex:1;min-width:0}#ipr-exm-top input{width:100%;height:38px;border-radius:10px;border:1px solid var(--ln);background:var(--p1);color:var(--tx);padding:0 10px;font:16px Inter,sans-serif}' +
      '.ipr-exm-ac{background:var(--ac);color:#14200F!important;border:0;border-radius:10px;font-weight:600!important;padding:0 14px;min-height:44px}' +
      '.ipr-exm-ol{background:transparent;border:1px solid var(--ln);border-radius:10px;padding:0 14px;min-height:44px}' +
      '#ipr-exm-bv,#ipr-exm-pf{position:fixed;inset:0;z-index:2147480300;background:#0f140c;overflow:auto;-webkit-overflow-scrolling:touch;padding:24px 16px 32px}' +
      '#ipr-exm-bv[hidden],#ipr-exm-pf[hidden],#ipr-exm-sh[hidden],#ipr-exm-res[hidden]{display:none}.ipr-exm-sug{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5;list-style:none;margin:0;padding:0;background:#151b11;border:1px solid var(--ln);border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.45);max-height:60vh;overflow-y:auto}.ipr-exm-sug[hidden]{display:none}.ipr-exm-sug li[role=option]{padding:11px 14px;min-height:48px;border-bottom:1px solid var(--ln);cursor:pointer;color:#ecebe2}.ipr-exm-sug li[role=option] b{display:block;font-weight:600;font-size:15px}.ipr-exm-sug li[role=option] small{display:block;opacity:.7;font-size:12.5px;margin-top:2px}.ipr-exm-sug li[aria-selected=true],.ipr-exm-sug li[role=option]:hover{background:rgba(148,190,57,.16)}.ipr-exm-sug .cr{font-size:10.5px;opacity:.5;padding:5px 14px;text-align:right}' +
      '.ipr-exm-k{font:500 11px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--ac);margin:0 0 6px}' +
      '#ipr-exm-bv h1{font-size:28px;line-height:1.15;margin-bottom:8px}#ipr-exm-bv .sub{color:var(--mu);margin:0 0 18px}' +
      '.ipr-exm-f{display:flex;gap:8px;margin-bottom:6px}.ipr-exm-f input{flex:1;min-width:0;height:48px;border-radius:12px;border:1px solid var(--ln);background:var(--p1);color:var(--tx);padding:0 12px;font:16px Inter,sans-serif}' +
      '.ipr-exm-alt{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 20px}' +
      '.ipr-exm-err{color:#f0b37e;font-size:13px;margin:4px 0}' +
      '#ipr-exm-res{list-style:none;margin:6px 0 0;padding:0;border:1px solid var(--ln);border-radius:12px;overflow:hidden;background:var(--p1)}' +
      '#ipr-exm-res button{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--ln);padding:12px;min-height:48px}#ipr-exm-res li:last-child button{border-bottom:0}#ipr-exm-res small{display:block;color:var(--mu);font-size:12.5px}' +
      '.ipr-exm-pr{list-style:none;margin:0;padding:0;display:grid;gap:10px}' +
      '.ipr-exm-pr li{border:1px solid var(--ln);border-radius:14px;padding:14px;background:var(--p1)}.ipr-exm-pr li.d{border-color:rgba(148,190,57,.6);background:rgba(148,190,57,.08)}' +
      '.ipr-exm-pr h2{font-size:17px}.ipr-exm-pr .v{color:var(--ac);font-weight:600;margin:4px 0}.ipr-exm-pr p{margin:0;color:var(--mu);font-size:14px}' +
      '.ipr-exm-ln{display:block;margin:20px auto 0;background:none;border:0;color:var(--mu);text-decoration:underline;min-height:44px}' +
      '#ipr-exm-pf h2{font-size:24px;margin-bottom:6px}#ipr-exm-pf .sub{color:var(--mu);margin:0 0 16px}' +
      '.ipr-exm-pp{display:grid;gap:10px}.ipr-exm-pp button{display:flex;gap:12px;text-align:left;border:1px solid var(--ln);border-radius:14px;background:var(--p1);padding:14px}' +
      '.ipr-exm-pp b{display:block;font:600 16px Outfit,sans-serif}.ipr-exm-pp small{color:var(--mu);font-size:13.5px}.ipr-exm-pp i{flex:0 0 30px;height:30px;border-radius:50%;background:rgba(148,190,57,.18);color:var(--ac);font:600 14px/30px Outfit,sans-serif;text-align:center;font-style:normal}' +
      '#ipr-exm-sh{position:fixed;left:0;right:0;bottom:0;z-index:2147480200;background:var(--vn);border-top:1px solid var(--ln);border-radius:16px 16px 0 0;box-shadow:0 -8px 24px rgba(0,0,0,.35);max-height:52vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom)}' +
      '#ipr-exm-sh .pega{border:0;background:none;padding:8px 16px 4px;display:flex;align-items:center;gap:10px;min-height:44px;width:100%}#ipr-exm-sh .pega:before{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:var(--ln)}' +
      '#ipr-exm-sh .pega b{font:600 15px Outfit,sans-serif}#ipr-exm-sh .pega span{color:var(--mu);font-size:13px;margin-left:auto}' +
      '#ipr-exm-sh .corpo{overflow:auto;-webkit-overflow-scrolling:touch;padding:4px 16px 16px}#ipr-exm-sh.fechado .corpo{display:none}' +
      '.ipr-exm-ch{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.ipr-exm-ch button{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--ln);border-radius:999px;background:var(--p1);padding:8px 12px;min-height:44px;font-size:14px}' +
      '.ipr-exm-ch button[aria-pressed=true]{border-color:var(--ac);background:rgba(148,190,57,.16)}.ipr-exm-ch .p{width:12px;height:12px;border-radius:50%;flex:0 0 12px}' +
      '.ipr-exm-ch .g{width:20px;height:20px;border-radius:50%;border:1px solid currentColor;font:italic 600 11px/18px Georgia,serif;text-align:center;opacity:.75}' +
      '.ipr-exm-gl{background:var(--p2);border-radius:10px;padding:10px 12px;font-size:13.5px;color:var(--tx);margin:4px 0 8px}' +
      '.ipr-exm-h{font:600 13px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);margin:14px 0 4px}' +
      '.ipr-exm-ter{border:1px solid var(--ln);border-radius:12px;padding:12px;background:var(--p1);margin-top:8px}.ipr-exm-ter p{margin:0 0 10px;color:var(--mu);font-size:14px}' +
      '.ipr-exm-ter .ipr-exm-ac{width:100%}#ipr-exm-ficha .ipr-fg-out{margin-top:10px}' +
      '.ipr-exm-nota{font-size:12px;color:var(--mu);margin:10px 0 0}';
    (D.head || D.documentElement).appendChild(s);
  }

  // ───────── barra de cima ─────────
  function topo() {
    var b = D.createElement('div'); b.id = 'ipr-exm-top'; b.className = 'ipr-exm-ui';
    b.innerHTML = '<div class="m">IPR Atlas<small>Explorer</small></div>' +
      '<form role="search"><label class="ipr-sr" style="position:absolute;left:-9999px" for="ipr-exm-q2">' + esc(T('Procurar local, coordenadas ou NIC', 'Search place, coordinates or parcel ID')) + '</label>' +
      '<input id="ipr-exm-q2" type="search" autocomplete="off" placeholder="' + esc(T('Local, coordenadas ou NIC', 'Place, coordinates or ID')) + '"></form>' +
      '<button type="button" class="ipr-exm-ac" data-x="comprar">' + esc(T('Comprar', 'Buy')) + '</button>';
    b.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); procurar(b.querySelector('input').value, null); });
    return b;
  }

  // ───────── entrada ─────────
  function entrada() {
    var o = D.createElement('div'); o.id = 'ipr-exm-bv'; o.className = 'ipr-exm-ui'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ipr-exm-bvt');
    o.innerHTML = '<p class="ipr-exm-k">IPR Atlas · Explorer</p><h1 id="ipr-exm-bvt">' + esc(T('O seu terreno, num mapa.', 'Your land, on a map.')) + '</h1>' +
      '<p class="sub">' + esc(T('Encontre-o e veja logo a Ficha da propriedade, grátis: condicionantes, água, relevo e risco de incêndio. Depois escolha o documento de que precisa.', 'Find it and see the free Property sheet right away: restrictions, water, relief and wildfire hazard. Then choose the document you need.')) + '</p>' +
      '<form class="ipr-exm-f" role="search"><label for="ipr-exm-q" style="position:absolute;left:-9999px">' + esc(T('Onde está o terreno?', 'Where is the land?')) + '</label>' +
      '<input id="ipr-exm-q" type="search" autocomplete="off" placeholder="' + esc(T('Onde está o terreno?', 'Where is the land?')) + '"><button type="submit" class="ipr-exm-ac">' + esc(T('Procurar', 'Search')) + '</button></form>' +
      '<p class="ipr-exm-nota" style="margin:0">' + esc(T('Localidade, morada, coordenadas ou NIC.', 'Town, address, coordinates or parcel ID.')) + '</p>' +
      '<p class="ipr-exm-err" role="status" hidden></p><ul id="ipr-exm-res" hidden></ul>' +
      '<div class="ipr-exm-alt"><button type="button" class="ipr-exm-ol" data-x="desenhar">' + esc(T('Desenhar o limite', 'Draw the boundary')) + '</button>' +
      '<button type="button" class="ipr-exm-ol" data-x="ficheiro">' + esc(T('Carregar um ficheiro', 'Upload a file')) + '</button></div>' +
      '<ul class="ipr-exm-pr">' +
      '<li class="d"><h2>' + esc(T('Ficha da propriedade', 'Property sheet')) + '</h2><p class="v">' + esc(T('grátis', 'free')) + '</p><p>' + esc(T('O que já se sabe do terreno: condicionantes, água, relevo e incêndio. No ecrã, sem conta.', 'What is already known: restrictions, water, relief and fire. On screen, no account.')) + '</p></li>' +
      '<li><h2>' + esc(T('Planta de Localização', 'Location plan')) + '</h2><p class="v">' + esc(linhaPreco('planta')) + '</p><p>' + esc(T('A planta do terreno para a câmara, o banco ou a escritura. Pronta a imprimir.', 'The plan for the town hall, the bank or the deed. Ready to print.')) + '</p></li>' +
      '<li><h2>' + esc(T('Leitura Territorial', 'Land report')) + '</h2><p class="v">' + esc(linhaPreco('leitura', 1)) + '</p><p>' + esc(T('Relatório para decidir: o que o terreno permite, os riscos e o potencial.', 'A report to decide: what the land allows, its risks and potential.')) + '</p></li>' +
      '<li><h2>' + esc(T('Base Cartográfica', 'Base map')) + '</h2><p class="v">' + esc(linhaPreco('base', 1)) + '</p><p>' + esc(T('Para trabalhar: relevo, água e limites do terreno, em ficheiros para o seu técnico (QGIS, QField).', 'To work with: relief, water and boundaries as files for your technician (QGIS, QField).')) + '</p></li></ul>' +
      '<button type="button" class="ipr-exm-ln" data-x="completo">' + esc(T('Já trabalho com mapas: abrir o mapa completo', 'I work with maps: open the full map')) + '</button>' +
      '<button type="button" class="ipr-exm-ln" data-x="fecharbv" style="margin-top:0">' + esc(T('Ver só o mapa', 'Just show the map')) + '</button>';
    o.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); procurar(o.querySelector('#ipr-exm-q').value, o); });
    return o;
  }

  // ───────── perfis ─────────
  function perfis() {
    var o = D.createElement('div'); o.id = 'ipr-exm-pf'; o.className = 'ipr-exm-ui'; o.hidden = true; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ipr-exm-pft');
    var L = [
      ['conhecer', T('Quero conhecer um terreno', 'I want to know a piece of land'), T('Ver as condicionantes, a água, o relevo e o risco. Começa pela Ficha da propriedade, grátis.', 'See restrictions, water, relief and risk. Starts with the free Property sheet.')],
      ['planta', T('Preciso de uma planta do terreno', 'I need a plan of the land'), T('Uma Planta de Localização à escala para a câmara, o banco ou a escritura.', 'A scaled Location plan for the town hall, the bank or the deed.')],
      ['planear', T('Quero planear ou trabalhar o terreno', 'I want to plan or work the land'), T('Relevo, água e limites em ficheiros: a Base Cartográfica.', 'Relief, water and boundaries as files: the Base map.')],
      ['profissional', T('Trabalho com terrenos', 'I work with land'), T('Arquitectos, engenheiros, topógrafos, consultores e agentes: o mapa completo.', 'Architects, engineers, surveyors and agents: the full map.')]
    ];
    o.innerHTML = '<h2 id="ipr-exm-pft">' + esc(T('Por onde começar?', 'Where to start?')) + '</h2><p class="sub">' + esc(T('Diga-nos o que procura. Mostramos o caminho, a começar pelo que é grátis.', 'Tell us what you need. We show the way, starting with what is free.')) + '</p>' +
      '<div class="ipr-exm-pp">' + L.map(function (x, i) { return '<button type="button" data-pf="' + x[0] + '"><i>' + (i + 1) + '</i><span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span></button>'; }).join('') + '</div>' +
      '<button type="button" class="ipr-exm-ln" data-x="fecharpf">' + esc(T('Explorar por minha conta', 'Explore on my own')) + '</button>';
    return o;
  }

  // ───────── painel de baixo ─────────
  function painel() {
    var o = D.createElement('div'); o.id = 'ipr-exm-sh'; o.className = 'ipr-exm-ui fechado';
    o.innerHTML = '<button type="button" class="pega" aria-expanded="false" data-x="painel"><b>' + esc(T('O seu terreno', 'Your land')) + '</b><span id="ipr-exm-est">' + esc(T('Toque para ver camadas e a ficha', 'Tap for layers and the sheet')) + '</span></button>' +
      '<div class="corpo"><div class="ipr-exm-ter" id="ipr-exm-ter"></div>' +
      '<div id="ipr-exm-ficha"></div>' +
      '<p class="ipr-exm-h">' + esc(T('O que quer ver?', 'What do you want to see?')) + '</p>' +
      '<div class="ipr-exm-ch" role="group" aria-label="' + esc(T('Camadas por pergunta', 'Layers by question')) + '">' +
      CAM.map(function (c) { return '<button type="button" data-cam="' + c.id + '" aria-pressed="false"><span class="p" style="background:' + c.cor + '"></span>' + esc(EN() ? c.en : c.pt) + (c.g ? '<span class="g" data-gl="' + c.id + '" role="button" aria-label="' + esc(T('O que é', 'What is it')) + '">i</span>' : '') + '</button>'; }).join('') +
      '</div><div id="ipr-exm-gl"></div>' +
      '<p class="ipr-exm-h">' + esc(T('Imagem de fundo', 'Background')) + '</p><div class="ipr-exm-ch" role="group">' +
      '<button type="button" data-fundo="f_ortosat" aria-pressed="true">' + esc(T('Satélite', 'Satellite')) + '</button><button type="button" data-fundo="f_mapa" aria-pressed="false">' + esc(T('Mapa', 'Map')) + '</button></div>' +
      '<p class="ipr-exm-nota">' + esc(T('Leitura indicativa, sem valor jurídico. Confirme junto das entidades oficiais.', 'Indicative only, no legal value. Confirm with the official bodies.')) + '</p>' +
      '<button type="button" class="ipr-exm-ln" data-x="completo">' + esc(T('Abrir o mapa completo', 'Open the full map')) + '</button></div>';
    return o;
  }

  // ───────── terreno escolhido (o que o Atlas tem no desenho: parcelas tocadas, limite desenhado ou ficheiro) ─────────
  function desenho() {
    var m = mapa(); if (!m) return null; var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === 'function') { try { var a = cs[i].getAll(); if (a && a.features) return a; } catch (e) {} }
    return null;
  }
  function temTerreno() { var a = desenho(); return !!(a && a.features.some(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); })); }
  var ultimoTer = null;
  function pintarTerreno() {
    var el = D.getElementById('ipr-exm-ter'); if (!el) return;
    var tem = temTerreno(); if (tem === ultimoTer) return; ultimoTer = tem;
    var est = D.getElementById('ipr-exm-est');
    if (tem) {
      el.innerHTML = '<p>' + esc(T('Terreno escolhido. Veja já o que se sabe sobre ele.', 'Land selected. See what is known about it.')) + '</p><button type="button" class="ipr-exm-ac" data-x="ficha">' + esc(T('Ver a Ficha da propriedade (grátis)', 'See the Property sheet (free)')) + '</button>' +
        '<div class="ipr-exm-alt" style="margin:10px 0 0"><button type="button" class="ipr-exm-ol" data-x="comprar">' + esc(T('Escolher um documento', 'Choose a document')) + '</button><button type="button" class="ipr-exm-ol" data-x="trocar">' + esc(T('Trocar terreno', 'Change land')) + '</button></div>';
      if (est) est.textContent = T('Terreno escolhido', 'Land selected');
      abrirPainel(true);
      enquadrar();
    } else {
      el.innerHTML = '<p>' + esc(T('Toque no seu terreno no mapa (as parcelas do cadastro aparecem ao aproximar) ou desenhe o limite.', 'Tap your land on the map (cadastre parcels appear as you zoom in) or draw the boundary.')) + '</p><div class="ipr-exm-alt" style="margin:0"><button type="button" class="ipr-exm-ol" data-x="desenhar">' + esc(T('Desenhar o limite', 'Draw the boundary')) + '</button><button type="button" class="ipr-exm-ol" data-x="ficheiro">' + esc(T('Carregar ficheiro', 'Upload file')) + '</button></div>';
      if (est) est.textContent = T('Toque no seu terreno', 'Tap your land');
      perto();
      var f = D.getElementById('ipr-exm-ficha'); if (f) f.innerHTML = '';
    }
  }
  // O terreno fica à vista por cima do painel de baixo («Voltar ao terreno» sem afastar e arrastar).
  // Longe de mais para haver parcelas: dizê-lo, e um toque no mapa aproxima até lá.
  function perto() {
    var m = mapa(), est = D.getElementById('ipr-exm-est'); if (!m || !est || temTerreno()) return;
    var longe = m.getZoom() < 14;
    est.textContent = longe ? T('Aproxime-se do terreno', 'Zoom in to your land') : T('Toque no seu terreno', 'Tap your land');
  }
  function ligarPerto() {
    var m = mapa(); if (!m || m.__iprExmPerto) return; m.__iprExmPerto = 1;
    m.on('zoomend', perto);
    m.on('click', function (e) {
      if (temTerreno() || m.getZoom() >= 13) return;
      var bv = D.getElementById('ipr-exm-bv'), pf = D.getElementById('ipr-exm-pf');
      if ((bv && !bv.hidden) || (pf && !pf.hidden)) return;
      try { m.flyTo({ center: e.lngLat, zoom: 16, duration: 900, essential: true }); } catch (x) {}
      toast(T('Aproximámos. Agora toque na parcela do seu terreno.', 'Zoomed in. Now tap the parcel of your land.'));
    });
  }
  function enquadrar() {
    var m = mapa(), a = desenho(); if (!m || !a) return;
    var x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    a.features.forEach(function (f) { var g = f.geometry; if (!g || !/Polygon/.test(g.type)) return; JSON.stringify(g.coordinates).replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, function (_, x, y) { x = +x; y = +y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; return ''; }); });
    if (x0 > x1) return;
    var sh = D.getElementById('ipr-exm-sh'), hb = Math.round(Math.min((sh && sh.offsetHeight) || 300, W.innerHeight * 0.52));
    setTimeout(function () { try { m.fitBounds([[x0, y0], [x1, y1]], { padding: { top: 30, left: 30, right: 30, bottom: hb + 20 }, maxZoom: 17, duration: 600 }); } catch (e) {} }, 350);
  }
  function abrirPainel(on) {
    var o = D.getElementById('ipr-exm-sh'); if (!o) return;
    o.classList.toggle('fechado', !on);
    var p = o.querySelector('.pega'); if (p) p.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  // ───────── acções ─────────
  function ligarCam(id, on) { var v = viz(); if (!v) return; try { v.ligar(id, on); ligadas[id] = on; } catch (e) {} }
  // O «mapa simples» do Atlas (mapa-simples.js) liga curvas e hipsometria ao entrar na escolha de parcelas. No Explorer ficam
  // desligadas até a pessoa carregar em «Relevo e curvas de nível» (querRelevo).
  var querRelevo = false;
  function limparRelevo() {
    var v = viz(); if (querRelevo || !v || !v.activas) return;
    ['r_curvas', 'r_hipso', 'r_cdgt'].forEach(function (id) { if (v.activas().indexOf(id) >= 0) ligarCam(id, false); });
    [].forEach.call(D.querySelectorAll('#ipr-exm-sh [data-cam]'), function (b) { b.setAttribute('aria-pressed', v.activas().indexOf(b.getAttribute('data-cam')) >= 0 ? 'true' : 'false'); });
  }
  function cadastro() { limparRelevo(); if (!ligadas.cad) ligarCam('cad', true); setTimeout(modoParcelas, 300); }
  function voar(r) {
    var m = mapa(); if (!m) return;
    // Ao ponto do lugar, já com as parcelas à vista (o cadastro só aparece a partir do zoom 13; a caixa do Nominatim de
    // uma aldeia é muitas vezes a freguesia inteira e deixava a pessoa no zoom 10, sem parcelas para tocar).
    var t = String(r.addresstype || r.type || ''), z = 16;
    if (/^(house|building|road|residential|postcode|farm|farmyard|isolated_dwelling|allotments)$/.test(t)) z = 17;
    else if (/^(town|city|suburb|borough|quarter)$/.test(t)) z = 15;
    else if (/^(municipality|county|state|region|province|administrative|country)$/.test(t)) z = 14;
    try { m.flyTo({ center: [+r.lon, +r.lat], zoom: z, duration: 1200, essential: true }); } catch (e) {}
    cadastro();
  }
  function porApp(txt) { // NIC e coordenadas: a pesquisa do próprio Atlas sabe tratar
    var i = D.getElementById('ipe-q'), f = D.getElementById('ipe-busca'); if (!i || !f) return false;
    i.value = txt;
    try { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } catch (e) { return false; }
    setTimeout(cadastro, 1500); return true;
  }
  function procurar(txt, ctx) {
    txt = String(txt || '').trim(); if (!txt) return;
    gtag('exm_pesquisa');
    var err = ctx && ctx.querySelector('.ipr-exm-err'), lst = ctx && ctx.querySelector('#ipr-exm-res');
    if (err) err.hidden = true;
    var nic = /^[A-Za-z]{3}\s?\d{3}\s?\d{3}\s?\d{3}$/.test(txt), coord = /^\s*-?\d{1,2}(?:[.,]\d+)?\s*[,; ]\s*-?\d{1,3}(?:[.,]\d+)?\s*$/.test(txt);
    if (nic || coord) { porApp(txt); fecharEntrada(); depoisDeProcurar(); return; }
    if (err) { err.textContent = T('A procurar…', 'Searching…'); err.hidden = false; }
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=pt&accept-language=pt&q=' + encodeURIComponent(txt))
      .then(function (r) { return r.json(); })
      .then(function (a) {
        if (!a || !a.length) { if (err) { err.textContent = T('Não encontrámos esse local. Escreva de outra forma, use coordenadas ou o NIC.', 'Place not found. Try another spelling, coordinates or the parcel ID.'); err.hidden = false; } return; }
        if (err) err.hidden = true;
        if (a.length === 1 || !lst) { voar(a[0]); fecharEntrada(); depoisDeProcurar(); return; }
        lst.innerHTML = a.map(function (r, i) { var p = String(r.display_name || '').split(', '); return '<li><button type="button" data-r="' + i + '"><b>' + esc(p[0]) + '</b><small>' + esc(p.slice(1, 4).join(', ')) + '</small></button></li>'; }).join('');
        lst.hidden = false;
        lst.onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; voar(a[+b.getAttribute('data-r')]); lst.hidden = true; fecharEntrada(); depoisDeProcurar(); };
      })
      .catch(function () { if (err) { err.textContent = T('A pesquisa não respondeu. Tente outra vez ou use coordenadas.', 'Search did not respond. Try again or use coordinates.'); err.hidden = false; } });
  }
  // ───────── sugestões ao escrever (Nuno, 10/11: «auto preenchimento no nome/localização de terrenos») ─────────
  // Photon (OpenStreetMap, feito para escrever e sugerir; o Nominatim não permite sugestões ao escrever). Só Portugal.
  // Inclui herdades, quintas e lugares. Se falhar, a pesquisa normal (Enter / Procurar) continua igual.
  var TIPO = { farm: ['Herdade ou quinta', 'Farm'], farmyard: ['Herdade ou quinta', 'Farm'], isolated_dwelling: ['Lugar', 'Place'], locality: ['Lugar', 'Place'],
    hamlet: ['Aldeia', 'Hamlet'], village: ['Aldeia ou vila', 'Village'], town: ['Vila', 'Town'], city: ['Cidade', 'City'], suburb: ['Bairro', 'Suburb'],
    neighbourhood: ['Bairro', 'Neighbourhood'], quarter: ['Bairro', 'Quarter'], peak: ['Serra ou monte', 'Peak'], stream: ['Ribeira', 'Stream'], river: ['Rio', 'River'],
    administrative: ['Concelho ou freguesia', 'Municipality or parish'], residential: ['Rua', 'Street'], tertiary: ['Rua', 'Street'], secondary: ['Estrada', 'Road'],
    unclassified: ['Caminho', 'Road'], track: ['Caminho', 'Track'], primary: ['Estrada', 'Road'], house: ['Morada', 'Address'] };
  function zTipo(v, k) { if (/^(farm|farmyard|isolated_dwelling|house|residential|tertiary|unclassified|track|locality)$/.test(v) || k === 'highway' || k === 'building') return 'farm'; if (/^(city|town|suburb|quarter|borough)$/.test(v)) return 'town'; if (v === 'administrative') return 'municipality'; return 'village'; }
  function sugestoes(inp, aoEscolher) {
    if (!inp || inp.__iprSug || !W.fetch) return; inp.__iprSug = 1;
    var f = inp.form || inp.parentNode; if (getComputedStyle(f).position === 'static') f.style.position = 'relative';
    var ul = D.createElement('ul'); ul.className = 'ipr-exm-sug'; ul.hidden = true; ul.setAttribute('role', 'listbox'); ul.id = inp.id + '-sug';
    f.appendChild(ul); inp.setAttribute('aria-autocomplete', 'list'); inp.setAttribute('aria-controls', ul.id); inp.setAttribute('aria-expanded', 'false');
    var lista = [], act = -1, tmo = 0, ctl = null, ult = '';
    function fechar() { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); act = -1; }
    function marcar(i) { act = i; [].forEach.call(ul.querySelectorAll('[role=option]'), function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); if (j === i) inp.setAttribute('aria-activedescendant', b.id); }); }
    function escolher(i) { var r = lista[i]; if (!r) return; inp.value = r.nome; fechar(); gtag('exm_sugestao', { tipo: r.addresstype }); aoEscolher(r); }
    function mostrar() {
      if (!lista.length) { fechar(); return; }
      ul.innerHTML = lista.map(function (r, i) { return '<li role="option" id="' + ul.id + '-' + i + '" aria-selected="false" data-i="' + i + '"><b>' + esc(r.nome) + '</b><small>' + esc([r.tipo, r.onde].filter(Boolean).join(' · ')) + '</small></li>'; }).join('') +
        '<li class="cr" aria-hidden="true">© OpenStreetMap</li>';
      ul.hidden = false; inp.setAttribute('aria-expanded', 'true'); act = -1;
    }
    function pedir(q) {
      if (ctl) try { ctl.abort(); } catch (e) {}
      ctl = W.AbortController ? new AbortController() : null;
      fetch('https://photon.komoot.io/api/?limit=7&lang=default&bbox=-31.6,32.3,-6.1,42.2&q=' + encodeURIComponent(q), ctl ? { signal: ctl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (inp.value.trim() !== q) return;
          var vistos = {};
          lista = (j.features || []).filter(function (x) { return x.properties && x.properties.countrycode === 'PT'; }).map(function (x) {
            var p = x.properties, c = x.geometry.coordinates, nome = p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || p.postcode || '';
            var onde = [p.district && p.district !== nome ? p.district : '', p.city && p.city !== nome ? p.city : '', p.county && p.county !== p.city ? p.county : ''].filter(Boolean).slice(0, 2).join(', ');
            var t = TIPO[p.osm_value] || (p.osm_key === 'highway' ? ['Rua ou caminho', 'Road'] : null);
            return { nome: nome, onde: onde, tipo: t ? (EN() ? t[1] : t[0]) : '', lat: String(c[1]), lon: String(c[0]), addresstype: zTipo(p.osm_value, p.osm_key), display_name: [nome, onde].filter(Boolean).join(', ') };
          }).filter(function (r) { var k = (r.nome + '|' + r.onde).toLowerCase(); if (!r.nome || vistos[k]) return false; vistos[k] = 1; return true; }).slice(0, 6);
          mostrar();
        }).catch(function () {});
    }
    inp.addEventListener('input', function () {
      var q = inp.value.trim(); clearTimeout(tmo);
      if (q.length < 3 || q === ult || /^[A-Za-z]{3}\s?\d{3}/.test(q) || /^\s*-?\d{1,2}[.,]\d/.test(q)) { if (q.length < 3) fechar(); return; }
      tmo = setTimeout(function () { ult = q; pedir(q); }, 280);
    });
    inp.addEventListener('keydown', function (e) {
      if (ul.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(Math.min(lista.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(Math.max(0, act - 1)); }
      else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); e.stopPropagation(); escolher(act); }
      else if (e.key === 'Escape') fechar();
    });
    ul.addEventListener('mousedown', function (e) { e.preventDefault(); });
    ul.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) escolher(+li.getAttribute('data-i')); });
    inp.addEventListener('blur', function () { setTimeout(fechar, 150); });
    if (inp.form) inp.form.addEventListener('submit', function () { fechar(); }, true);
  }
  var jaPerfis = false;
  function depoisDeProcurar() {
    pintarTerreno();
    if (jaPerfis) return; jaPerfis = true;
    var p = D.getElementById('ipr-exm-pf'); if (p) p.hidden = false;
  }
  function fecharEntrada() { var o = D.getElementById('ipr-exm-bv'); if (o) o.hidden = true; try { sessionStorage.setItem('ipr_exm_bv', '1'); } catch (e) {} }
  function irCompleto() {
    try { localStorage.setItem('ipr_exm', 'completo'); } catch (e) {}
    gtag('exm_completo');
    location.href = location.pathname + (location.search.replace(/[?&]simples=1/, '') || '') + location.hash;
  }
  function comprar(produto) {
    gtag('exm_comprar', { produto: produto || '' });
    if (typeof W.__iprAssistenteAbrir === 'function') { try { W.__iprAssistenteAbrir(produto); return; } catch (e) {} }
    location.href = '/documentos/';
  }
  // 10/11 (Nuno, 08h27: «não consigo carregar no cadastro»): no Atlas, tocar numa parcela só a escolhe com a ferramenta
  // «parcelas» activa (a barra de ferramentas está escondida neste modo). Liga-se aqui sempre que ainda não há terreno.
  function ferramenta(t) { var b = D.querySelector('.ipe-tools [data-tool="' + t + '"]'); if (!b) return false; var e = ipe() && ipe().estado; if (e && e.tool === t) return true; b.click(); return true; }
  // 10/11 09h25 (Nuno: «não vejo o cadastro, não consigo seleccionar o terreno»): depois de escolher uma parcela, o Atlas
  // desligava o cadastro e voltava à navegação; ao recarregar, o terreno guardado deixava o mapa sem parcelas e sem toque.
  // Agora o modo de parcelas e o cadastro mantêm-se sempre (tocar noutra parcela junta-a; «Trocar terreno» recomeça).
  function modoParcelas() { var e = ipe() && ipe().estado; if (!e) return; if (e.tool === 'nav') ferramenta('parcelas'); }
  function manterCadastro() { var v = viz(); if (!v || !v.activas) return; if (v.activas().indexOf('cad') < 0) ligarCam('cad', true); }
  function clicarFerramenta(re) {
    var b = [].filter.call(D.querySelectorAll('.ipe-tools button,[data-tool]'), function (x) { return re.test(x.getAttribute('aria-label') || x.title || x.textContent || ''); })[0];
    if (b) { b.click(); return true; } return false;
  }
  function desenhar() {
    fecharEntrada(); abrirPainel(false);
    if (!ferramenta('desenhar') && !clicarFerramenta(/Desenhar o terreno|Draw the land|Draw/i)) comprar();
    toast(T('Toque no mapa para marcar cada canto do terreno. Toque no primeiro ponto para fechar.', 'Tap the map at each corner. Tap the first point to close.'));
  }
  function ficheiro() { fecharEntrada(); var i = D.getElementById('ipe-file'); if (i) i.click(); else comprar(); }
  function trocar() {
    var m = mapa(), cs = (m && m._controls) || [];
    cs.forEach(function (c) { if (c && typeof c.deleteAll === 'function') try { c.deleteAll(); m.fire('draw.delete', { features: [] }); } catch (e) {} });
    ultimoTer = null; pintarTerreno(); cadastro();
    toast(T('Toque na parcela do seu terreno. Pode tocar em várias para as juntar.', 'Tap your parcel. You can tap several to join them.'));
  }
  // 10/11, 23h28 (Nuno: «aqui só deixa escolher uma parcela»): com o cartão de compra aberto, a parcela escolhida enchia o
  // pouco mapa que sobra e as vizinhas ficavam por baixo do cartão; tocar de novo dentro da parcela retirava-a. O cartão passa
  // a ter «+ Juntar outra parcela»: fecha o cartão (o Atlas mostra «Ver os preços» para voltar), afasta o mapa um nível para
  // as vizinhas aparecerem e explica que se toca nelas para as juntar e numa escolhida para a retirar. Ao abrir o cartão, o
  // terreno fica enquadrado na parte do mapa que o cartão não tapa.
  var cartaoVisto = null;
  function juntarParcela() {
    var c = D.getElementById('ipr-cp-ct');
    if (!c) { cartaoVisto = null; return; }
    if (c === cartaoVisto) return; cartaoVisto = c;
    abrirPainel(false); // o painel do Explorer e o cartão de compra não ficam abertos ao mesmo tempo
    var m = mapa(), a = desenho();
    if (m && a && a.features.length) {
      var x0 = 180, y0 = 90, x1 = -180, y1 = -90;
      a.features.forEach(function (f) { var g = f.geometry; if (!g || !/Polygon/.test(g.type)) return; JSON.stringify(g.coordinates).replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, function (_, x, y) { x = +x; y = +y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; return _; }); });
      var hb = Math.round(Math.min(c.offsetHeight || 380, W.innerHeight * 0.62));
      if (x0 <= x1) setTimeout(function () { try { m.fitBounds([[x0, y0], [x1, y1]], { padding: { top: 70, left: 40, right: 40, bottom: hb + 30 }, maxZoom: 16, duration: 500 }); } catch (e) {} }, 250);
    }
    if (c.querySelector('[data-x="juntar"]')) return;
    var b = D.createElement('button'); b.type = 'button'; b.className = 'ipr-cp-a'; b.setAttribute('data-x', 'juntar');
    b.textContent = T('+ Juntar outra parcela', '+ Add another parcel');
    b.style.cssText = 'width:100%;margin:8px 0 4px';
    var nv = c.querySelector('.ipr-cp-nv'); if (nv && nv.parentNode) nv.parentNode.insertBefore(b, nv.nextSibling); else c.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var mu = c.querySelector('[data-cp="mudar"]'); if (mu) mu.click(); else if (typeof W.iprFecharCartao === 'function') W.iprFecharCartao();
      modoParcelas();
      var mm = mapa(); if (mm) setTimeout(function () { try { mm.easeTo({ zoom: Math.max(14, mm.getZoom() - 1), duration: 500 }); } catch (er) {} }, 200);
      toast(T('Toque nas parcelas vizinhas para as juntar. Tocar numa já escolhida retira-a. Depois carregue em «Ver os preços».', 'Tap neighbouring parcels to add them. Tapping a chosen one removes it. Then tap «See prices».'));
      gtag('exm_juntar');
    }, true);
  }
  function ficha() {
    gtag('exm_ficha');
    if (typeof W.__iprFichaGratuita !== 'function' || !temTerreno()) return;
    var alvo = D.getElementById('ipr-exm-ficha'); if (!alvo) return;
    alvo.innerHTML = '<p class="ipr-exm-nota">' + esc(T('A cruzar o terreno com os dados públicos. Leva cerca de 10 segundos.', 'Crossing the land with public data. Takes about 10 seconds.')) + '</p>';
    try { W.__iprFichaGratuita(true); } catch (e) {}
    var t0 = Date.now();
    (function mover() { // a ficha é feita pelo Atlas em #ipe-res; aqui só se mostra dentro do painel
      var out = D.querySelector('#ipe-res .ipr-fg-out') || alvo.querySelector('.ipr-fg-out');
      if (out && out.parentNode !== alvo) { alvo.innerHTML = ''; alvo.appendChild(out); }
      if (Date.now() - t0 < 30000) setTimeout(mover, 400);
    })();
  }
  var tt = null;
  function toast(m) {
    var t = D.getElementById('ipr-exm-toast');
    if (!t) { t = D.createElement('div'); t.id = 'ipr-exm-toast'; t.className = 'ipr-exm-ui'; t.setAttribute('role', 'status'); t.style.cssText = 'position:fixed;left:12px;right:12px;top:66px;z-index:2147480250;background:#10170d;border:1px solid #2e3a28;border-radius:12px;padding:10px 12px;font-size:14px'; D.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 7000);
  }

  function cliques(e) {
    var gl = e.target.closest('.ipr-exm-ui [data-gl]');
    if (gl) { e.preventDefault(); e.stopPropagation(); var c = CAM.filter(function (x) { return x.id === gl.getAttribute('data-gl'); })[0], box = D.getElementById('ipr-exm-gl'); if (c && box) box.innerHTML = box.getAttribute('data-id') === c.id ? '' : '<div class="ipr-exm-gl">' + esc(EN() ? c.g[1] : c.g[0]) + '</div>'; if (box) box.setAttribute('data-id', box.innerHTML ? c.id : ''); return; }
    var b = e.target.closest('[data-x],[data-cam],[data-fundo],[data-pf]'); if (!b || !b.closest('.ipr-exm-ui')) return;
    var x = b.getAttribute('data-x');
    if (b.hasAttribute('data-cam')) { var id = b.getAttribute('data-cam'), on = b.getAttribute('aria-pressed') !== 'true'; if (id === 'r_curvas') querRelevo = on; b.setAttribute('aria-pressed', on ? 'true' : 'false'); ligarCam(id, on); gtag('exm_camada', { id: id, on: on }); return; }
    if (b.hasAttribute('data-fundo')) { var v = viz(); if (v && typeof v.fundo === 'function') try { v.fundo(b.getAttribute('data-fundo')); } catch (er) {} [].forEach.call(b.parentNode.children, function (s) { s.setAttribute('aria-pressed', s === b ? 'true' : 'false'); }); return; }
    if (b.hasAttribute('data-pf')) {
      var pf = b.getAttribute('data-pf'); D.getElementById('ipr-exm-pf').hidden = true; gtag('exm_perfil', { p: pf });
      if (pf === 'conhecer') { cadastro(); abrirPainel(false); toast(T('Aproxime e toque na parcela do seu terreno. Pode tocar em várias para as juntar. A ficha aparece em baixo.', 'Zoom in and tap your parcel. You can tap several. The sheet appears below.')); }
      else if (pf === 'planta') comprar('planta');
      else if (pf === 'planear') comprar('base');
      else irCompleto();
      return;
    }
    if (x === 'comprar') comprar();
    else if (x === 'completo') irCompleto();
    else if (x === 'fecharbv') { fecharEntrada(); cadastro(); }
    else if (x === 'fecharpf') { D.getElementById('ipr-exm-pf').hidden = true; cadastro(); }
    else if (x === 'painel') { var sh = D.getElementById('ipr-exm-sh'); abrirPainel(sh.classList.contains('fechado')); }
    else if (x === 'desenhar') desenhar();
    else if (x === 'ficheiro') ficheiro();
    else if (x === 'ficha') ficha();
    else if (x === 'trocar') trocar();
  }

  function montar() {
    if (!D.body || !D.getElementById('ipe')) return false;
    if (intel()) return true; // assinantes e equipa: Atlas completo
    css();
    D.documentElement.classList.add('ipr-exm');
    D.body.appendChild(topo());
    D.body.appendChild(painel());
    D.body.appendChild(perfis());
    var bv = entrada(); D.body.appendChild(bv);
    var irPara = function (r) { voar(r); fecharEntrada(); var l = D.getElementById('ipr-exm-res'); if (l) l.hidden = true; depoisDeProcurar(); };
    sugestoes(D.getElementById('ipr-exm-q'), irPara); sugestoes(D.getElementById('ipr-exm-q2'), irPara);
    var visto = false; try { visto = sessionStorage.getItem('ipr_exm_bv') === '1'; } catch (e) {}
    if (visto || /[?&](mapa|ficha|servico|assistente)=/.test(location.search)) bv.hidden = true;
    D.addEventListener('click', cliques, true);
    // 10/11 (Nuno: «curvas de nível e cadastro tudo da mesma cor, não tem leitura»): só fotografia e cadastro (limparRelevo).
    pintarTerreno();
    setInterval(function () { if (!D.hidden) { pintarTerreno(); var bv = D.getElementById('ipr-exm-bv'), pf = D.getElementById('ipr-exm-pf'); if ((!bv || bv.hidden) && (!pf || pf.hidden)) { modoParcelas(); manterCadastro(); juntarParcela(); } limparRelevo(); ligarPerto(); } }, 1200);
    // quem roda o telemóvel para o lado ou alarga a janela volta ao Atlas normal ao recarregar; aqui só se mantém
    gtag('exm_entrada');
    return true;
  }
  (function esperar(n) { if (montar()) return; if (n < 120) setTimeout(function () { esperar(n + 1); }, 250); })(0);
})();
