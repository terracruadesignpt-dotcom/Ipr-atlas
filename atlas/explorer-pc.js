/* IPR Atlas · Explorer simples no computador e no tablet (Nuno, 10/11/2026, 13h40: «quero o Explorer em versão simplificada
 * para desktop [...] o Explorer é para o cidadão comum, super simples, e o Intelligence tem as camadas, o estúdio e as
 * simulações [...] quero que no Explorer tenha uma cena a dizer o que é que o Intelligence tem»; 13h41: «não vais estragar
 * nada que estivesse a funcionar, nem quebrar links, e o carrinho e o processo de vendas tudo a funcionar»).
 *
 * Irmão do explorer-movel.js (telemóvel, até 700 px). Este cobre os ecrãs maiores (mais de 700 px).
 * Quem: nível que não é Intelligence (IPR_NIVEL), fora da equipa (tcdEquipa), sem Bases nem projectos na conta (o Atlas
 * marca #ipe.cli) e sem endereço de trabalho (?mapa=, ?ficha=, ?servico=, ?org_camada=, ?ll=, ?assistente=, ?modo=, …).
 * Essas pessoas ficam no Atlas completo, como até aqui.
 *
 * O que faz, por cima do Atlas que já existe (não altera nenhum ficheiro dele; usa as funções que ele publica):
 *  1. Topo mínimo: marca, procurar (local, coordenadas ou NIC, com sugestões), língua, Entrar e Comprar.
 *  2. Barra da esquerda: «O que quer saber sobre o terreno?» (quatro perguntas que ligam as camadas certas e explicam numa
 *     frase o que se vê), seis interruptores (Fotografia aérea, Cadastro, Relevo, Água, Restrições, Incêndio), três
 *     ferramentas (área, distância, a minha posição) e o cartão «O que o Intelligence tem a mais».
 *  3. Escolher o terreno (parcelas do cadastro, desenhar ou ficheiro) abre à direita a Ficha da propriedade, grátis, e os
 *     três documentos com preço, que abrem o assistente de compra do Atlas (o mesmo carrinho e o mesmo checkout).
 *  4. Entrada na primeira visita da sessão, com pesquisa, escolha do terreno e os documentos.
 *  5. Decisão do Nuno (10/11, 15h12): «quem é Explorer não abre estúdio nem simuladores; só vê as coisas básicas, para vender
 *     muito; não complicar». Por isso não há saída para o mapa completo (nem aqui nem no telemóvel: a preferência antiga
 *     ipr_exm = completo é apagada para quem é Explorer), e os botões de simuladores e estúdio abrem o cartão do
 *     Intelligence em vez da ferramenta, também nas ligações de trabalho (?mapa=, ?ficha=…) que continuam no Atlas completo.
 * Desligar: ?simples=0, localStorage ipr_exd_off = 1, ou window.IPR_EXD_OFF. Forçar: ?simples=1.
 * Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. Terracrua Design. */
(function () {
  'use strict';
  var W = window, D = document, H = D.documentElement;
  if (W.__iprExd || W.IPR_EXD_OFF) return; W.__iprExd = 1;
  var q = location.search, forcar = /[?&]simples=1(&|$)/.test(q);
  try {
    if (/[?&]simples=0(&|$)/.test(q) || localStorage.getItem('ipr_exd_off') === '1') return;
    if (forcar) localStorage.removeItem('ipr_exm');
    if (/[?&]completo=1(&|$)/.test(q)) localStorage.setItem('ipr_exm', 'completo');
  } catch (e) {}
  function largo() { return W.innerWidth > 700; }
  function intel() { return String(W.IPR_NIVEL || '').toLowerCase() === 'intelligence'; }
  function equipa() { return !!(W.tcdEquipa || W.tcdAdmin); }
  var EXPLORER = !intel() && !equipa();
  if (EXPLORER) {
    try { if (localStorage.getItem('ipr_exm') === 'completo') localStorage.removeItem('ipr_exm'); } catch (e) {}
    try { var s0 = D.createElement('style'); s0.id = 'ipr-exd-sem-completo'; s0.textContent = '.ipr-exm-ui [data-x="completo"],.ipr-exm-ui [data-pf="profissional"]{display:none!important}'; (D.head || H).appendChild(s0); } catch (e) {}
  }
  var MOVEL = !largo(); // o telemóvel é do explorer-movel.js; aqui só a trava
  var TRABALHO = /[?&](mapa|ficha|servico|org_camada|projecto|base|partilha|convite|camada|camadas|org)=/;
  var EN = function () { return W.IPR_LINGUA === 'en'; };
  function T(pt, en) { return EN() ? en : pt; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function eur(v) { return (Math.round(v * 100) / 100).toLocaleString(EN() ? 'en-GB' : 'pt-PT', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; }
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa; }
  function viz() { var i = ipe(); return i && i.viz && typeof i.viz.ligar === 'function' ? i.viz : null; }
  function gtag(n, p) { try { if (W.gtag) W.gtag('event', n, p || {}); } catch (e) {} }
  function $(id) { return D.getElementById(id); }

  // ───────── preços (os mesmos do site: IPR_PRECOS) ─────────
  function P() { return W.IPR_PRECOS || {}; }
  function preco(k) {
    var p = P();
    if (k === 'planta') return (p.planta && p.planta.preco) || 19;
    if (k === 'leitura') return (p.leitura && p.leitura.desde) || 79;
    if (k === 'base') return (p.base && p.base.desde) || 99;
    return 0;
  }
  function linhaPreco(k, desde) { var v = preco(k); return (desde ? T('desde ', 'from ') : '') + eur(v) + T(' + IVA', ' + VAT'); }
  function intelPreco() { var i = P().intel || {}; return { mes: (i.mes && i.mes.preco) || 12, ano: (i.ano && i.ano.preco) || 120, umes: i.mes && i.mes.url, uano: i.ano && i.ano.url, planos: P().planos || '/ipr-cloud/' }; }

  // ───────── camadas ─────────
  var CAM = [
    { k: 'foto', ids: [], pt: 'Fotografia aérea', en: 'Aerial photo', d: ['Ortofotomapa da DGT (2023). Desligada: mapa de estradas.', 'DGT orthophoto (2023). Off: road map.'] },
    { k: 'cad', ids: ['cad'], pt: 'Cadastro', en: 'Land registry', d: ['Limites das parcelas, ao aproximar.', 'Parcel boundaries, when zoomed in.'] },
    { k: 'relevo', ids: ['r_somb', 'r_curvas'], pt: 'Relevo', en: 'Relief', d: ['Sombreado e curvas de nível (LiDAR).', 'Hillshade and contours (LiDAR).'] },
    { k: 'agua', ids: ['hidro'], pt: 'Água', en: 'Water', d: ['Rios, ribeiras e linhas de água.', 'Rivers, streams and water lines.'] },
    { k: 'restr', ids: ['ren', 'ran', 'n2k'], pt: 'Restrições', en: 'Restrictions', d: ['REN, RAN e Rede Natura 2000.', 'REN, RAN and Natura 2000.'] },
    { k: 'fogo', ids: ['perig_e'], pt: 'Incêndio', en: 'Wildfire', d: ['Perigosidade 2020 a 2030.', 'Hazard 2020 to 2030.'] }
  ];
  var PERG = [
    { k: 'limites', liga: ['foto', 'cad'], pt: 'Onde fica e quais são os limites', en: 'Where it is and its boundaries',
      x: ['A fotografia aérea e o cadastro. Aproxime-se e toque na parcela do terreno para a escolher.', 'Aerial photo and land registry. Zoom in and tap the parcel to select it.'] },
    { k: 'fazer', liga: ['foto', 'cad', 'restr'], pt: 'O que posso fazer lá', en: 'What I can do there',
      x: ['Azul: REN (água, solo e riscos; em regra não se constrói). Amarelo: RAN (solos agrícolas protegidos). Verde: Rede Natura 2000. O que o PDM permite em concreto vem na Leitura Territorial.', 'Blue: REN (water, soil and hazards; building is generally not allowed). Yellow: RAN (protected farmland). Green: Natura 2000. What the municipal plan allows in detail comes in the Territorial Reading.'] },
    { k: 'aguafogo', liga: ['foto', 'cad', 'agua', 'fogo'], pt: 'Água e fogo', en: 'Water and fire',
      x: ['Linhas de água a azul e perigosidade de incêndio do verde (baixa) ao vermelho (muito alta).', 'Water lines in blue and wildfire hazard from green (low) to red (very high).'] },
    { k: 'antes', liga: ['foto', 'cad'], hist: true, pt: 'Como era antes', en: 'What it looked like before',
      x: ['Fotografias aéreas antigas, de 1995 até hoje. Escolha o ano no painel que abre.', 'Old aerial photos, from 1995 to today. Pick the year in the panel that opens.'] }
  ];
  var ligado = {}; // k da CAM -> true/false
  // O mapa-simples.js liga curvas e hipsometria ao escolher parcelas; aqui ficam desligadas até a pessoa pedir o Relevo
  // (como no telemóvel: curvas e cadastro da mesma cor não se lêem).
  var querRelevo = false;
  function limparRelevo() { var v = viz(); if (querRelevo || !v || !v.activas) return; ['r_curvas', 'r_hipso', 'r_cdgt', 'r_somb'].forEach(function (id) { if (v.activas().indexOf(id) >= 0) try { v.ligar(id, false); } catch (e) {} }); }
  function camLigar(k, on) {
    var c = CAM.filter(function (x) { return x.k === k; })[0], v = viz(); if (!c || !v) return;
    ligado[k] = on;
    if (k === 'relevo') querRelevo = on;
    if (k === 'foto') { try { v.fundo(on ? 'f_ortosat' : 'f_mapa'); } catch (e) {} }
    else c.ids.forEach(function (id) { try { var a = v.activas ? v.activas() : []; if (on !== (a.indexOf(id) >= 0)) v.ligar(id, on); } catch (e) {} });
    pintarCam();
  }
  function lerCam() {
    var v = viz(); if (!v || !v.activas) return; var a = v.activas();
    CAM.forEach(function (c) {
      if (c.k === 'foto') ligado.foto = a.indexOf('f_mapa') < 0 && a.indexOf('f_otm') < 0;
      else ligado[c.k] = c.ids.some(function (id) { return a.indexOf(id) >= 0; });
    });
  }
  function pintarCam() {
    [].forEach.call(D.querySelectorAll('#ipr-exd-esq [data-cam]'), function (b) { b.setAttribute('aria-pressed', ligado[b.getAttribute('data-cam')] ? 'true' : 'false'); });
  }

  // ───────── estilos (sistema de design do IPR: verde-noite, verde IPR #94BE39, Outfit e Inter) ─────────
  var LE = 336, LD = 380;
  function css() {
    if ($('ipr-exd-css')) return;
    var s = D.createElement('style'); s.id = 'ipr-exd-css';
    s.textContent =
      'html.ipr-exd .ipe-top,html.ipr-exd #ipe-esq,html.ipr-exd #ipe-dir,html.ipr-exd .ipe-tools,html.ipr-exd #ipe-st,html.ipr-exd #ipr-tri,html.ipr-exd #ipr-as-b,html.ipr-exd .ipe-tour,html.ipr-exd #ipr-lingueta,html.ipr-exd #ipr-pb-barra,html.ipr-exd .maplibregl-ctrl-top-right,html.ipr-exd .ipr-be-p,html.ipr-exd #ipr-cq,html.ipr-exd #ipr-cp-ct,html.ipr-exd .maplibregl-ctrl-top-left.ipr-nav{display:none!important}' +
      'html.ipr-exd .ipe-mapa{position:fixed!important;top:60px!important;left:' + LE + 'px!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;margin:0!important}' +
      'html.ipr-exd.ipr-exd-d .ipe-mapa{right:' + LD + 'px!important}' +
      // o formulário de encomenda da Base vive no painel da direita do Atlas (#ipe-dir): quando o assistente o abre, mostra-se
      'html.ipr-exd.ipr-exd-form #ipe-dir{display:flex!important;position:fixed!important;top:60px!important;right:0!important;bottom:0!important;left:auto!important;width:380px!important;max-width:100vw!important;height:auto!important}' +
      'html.ipr-exd.ipr-exd-form .ipe-mapa{right:380px!important}html.ipr-exd.ipr-exd-form #ipr-exd-dir,html.ipr-exd.ipr-exd-form #ipr-exd-zoom{display:none!important}' +
      // com o assistente de compra aberto, o painel da direita deste modo sai, para o assistente ter o mapa todo
      'html.ipr-exd.ipr-exd-as #ipr-exd-dir{display:none!important}html.ipr-exd.ipr-exd-as .ipe-mapa{right:0!important}html.ipr-exd.ipr-exd-as #ipr-exd-zoom{right:14px!important}' +
      '#ipr-exd-fform{display:none}html.ipr-exd-form #ipr-exd-fform{display:inline-flex}' +
      '@media (max-width:1100px){html.ipr-exd .ipe-mapa{left:300px!important}html.ipr-exd.ipr-exd-d .ipe-mapa{right:0!important}#ipr-exd-esq{width:300px!important}}' +
      '.ipr-exd-ui{--vn:#10170d;--p1:#161e13;--p2:#1f2a1a;--ln:#2e3a28;--tx:#eef0e6;--mu:#a7ae9b;--ac:#94BE39;font:14px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--tx);letter-spacing:normal;-webkit-font-smoothing:antialiased;box-sizing:border-box}' +
      '.ipr-exd-ui *,.ipr-exd-ui *::before,.ipr-exd-ui *::after{box-sizing:border-box}' +
      '.ipr-exd-ui button{font:inherit;color:inherit;cursor:pointer}' +
      '.ipr-exd-ui h1,.ipr-exd-ui h3,.ipr-exd-cx h2,#ipr-exd-dir .cab h2{letter-spacing:-.005em;text-transform:none}' +
      '#ipr-exd-esq>*,#ipr-exd-dir>*{flex:none}' +
      '.ipr-exd-ui :focus-visible{outline:2px solid var(--ac);outline-offset:2px}' +
      // topo
      '#ipr-exd-top{position:fixed;z-index:99992;top:0;left:0;right:0;height:60px;display:flex;align-items:center;gap:14px;padding:0 16px;background:var(--vn);border-bottom:1px solid var(--ln)}' +
      '#ipr-exd-top .m{font:600 18px/1 Outfit,Inter,sans-serif;letter-spacing:.01em;white-space:nowrap;display:flex;align-items:baseline;gap:8px;color:var(--tx);text-decoration:none}' +
      '#ipr-exd-top .m small{font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ac)}' +
      '#ipr-exd-top form{flex:1 1 auto;max-width:520px;margin:0 auto;position:relative;display:flex}' +
      '#ipr-exd-top input{flex:1;min-width:0;height:40px;border-radius:999px;border:1px solid var(--ln);background:var(--p1);color:var(--tx);padding:0 16px 0 40px;font:inherit;font-size:14px}' +
      '#ipr-exd-top form::before{content:"";position:absolute;left:15px;top:13px;width:11px;height:11px;border:2px solid var(--mu);border-radius:50%;pointer-events:none}' +
      '#ipr-exd-top form::after{content:"";position:absolute;left:27px;top:26px;width:6px;height:2px;background:var(--mu);transform:rotate(45deg);pointer-events:none}' +
      '#ipr-exd-top .d{display:flex;align-items:center;gap:8px;flex:none}' +
      '.ipr-exd-ol{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--ln);background:transparent;color:var(--tx);text-decoration:none;font-weight:500;white-space:nowrap}' +
      '.ipr-exd-ol:hover{border-color:var(--mu)}' +
      '.ipr-exd-ac{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 18px;border-radius:999px;border:0;background:var(--ac);color:#10170d!important;font-weight:600;white-space:nowrap;text-decoration:none}' +
      '.ipr-exd-ac:hover{filter:brightness(1.07)}' +
      // esquerda
      '#ipr-exd-esq{position:fixed;z-index:99991;top:60px;left:0;bottom:0;width:' + LE + 'px;overflow:auto;overscroll-behavior:contain;background:var(--vn);border-right:1px solid var(--ln);padding:16px 16px 24px;display:flex;flex-direction:column;gap:20px}' +
      '.ipr-exd-sec h2{margin:0 0 10px;font:500 11px/1.2 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}' +
      '.ipr-exd-pg{display:flex;flex-direction:column;gap:6px}' +
      '.ipr-exd-pg button{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:10px 12px;border-radius:10px;border:1px solid var(--ln);background:var(--p1);text-align:left;font-weight:500}' +
      '.ipr-exd-pg button::after{content:"";margin-left:auto;width:7px;height:7px;border-right:2px solid var(--mu);border-bottom:2px solid var(--mu);transform:rotate(-45deg);flex:none}' +
      '.ipr-exd-pg button[aria-pressed=true]{border-color:var(--ac);background:#1d2a15}' +
      '.ipr-exd-x{margin:8px 0 0;padding:10px 12px;border-radius:10px;background:var(--p2);color:var(--tx);font-size:13px}' +
      '.ipr-exd-cam{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
      '.ipr-exd-cam button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:58px;padding:9px 10px;border-radius:10px;border:1px solid var(--ln);background:var(--p1);text-align:left}' +
      '.ipr-exd-cam button b{font-weight:600;font-size:13px;display:flex;align-items:center;gap:7px}' +
      '.ipr-exd-cam button b::before{content:"";width:28px;height:16px;border-radius:999px;background:radial-gradient(circle at 8px 8px,#a7ae9b 5px,transparent 5.5px) #3a4633;flex:none}' +
      '.ipr-exd-cam button[aria-pressed=true]{border-color:#4d6230}' +
      '.ipr-exd-cam button[aria-pressed=true] b::before{background:radial-gradient(circle at 20px 8px,#10170d 5px,transparent 5.5px) var(--ac)}' +
      '.ipr-exd-cam button small{color:var(--mu);font-size:11.5px;line-height:1.3}' +
      '.ipr-exd-fe{display:flex;flex-wrap:wrap;gap:6px}' +
      '.ipr-exd-fe button{height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--ln);background:var(--p1);font-size:13px}' +
      '.ipr-exd-fe button[aria-pressed=true]{border-color:var(--ac);color:var(--ac)}' +
      '.ipr-exd-ter{display:flex;flex-direction:column;gap:6px}' +
      '.ipr-exd-ter .ipr-exd-ac{width:100%}' +
      '.ipr-exd-ter .lin{display:flex;gap:6px}.ipr-exd-ter .lin .ipr-exd-ol{flex:1;height:36px;font-size:13px;padding:0 8px}' +
      '.ipr-exd-int{margin-top:auto;border:1px solid #3d4a2c;border-radius:12px;padding:14px;background:linear-gradient(160deg,#18230f,#121a0e)}' +
      '.ipr-exd-int h3{margin:0 0 4px;font:600 15px/1.25 Outfit,Inter,sans-serif;display:flex;align-items:center;gap:8px}' +
      '.ipr-exd-int h3 i{font:500 10px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#10170d;background:var(--ac);border-radius:4px;padding:3px 5px;font-style:normal}' +
      '.ipr-exd-int p{margin:0 0 8px;color:var(--mu);font-size:12.5px}' +
      '.ipr-exd-int ul{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:5px}' +
      '.ipr-exd-int li{display:flex;gap:8px;font-size:13px}' +
      '.ipr-exd-int li::before{content:"";flex:none;width:9px;height:7px;margin-top:5px;border:1.5px solid var(--mu);border-radius:2px;box-shadow:0 -4px 0 -1.5px var(--p1),0 -4px 0 0 var(--mu)}' +
      '.ipr-exd-int .ipr-exd-ol{width:100%;height:36px;font-size:13px;border-color:var(--ac);color:var(--ac)}' +
      '.ipr-exd-lnk{background:none;border:0;padding:0;color:var(--mu);font-size:12.5px;text-decoration:underline;text-underline-offset:3px;text-align:left}' +
      // direita
      '#ipr-exd-dir{position:fixed;z-index:99991;top:60px;right:0;bottom:0;width:' + LD + 'px;max-width:100vw;overflow:auto;overscroll-behavior:contain;background:var(--vn);border-left:1px solid var(--ln);padding:16px 16px 24px;display:flex;flex-direction:column;gap:14px}' +
      '#ipr-exd-dir[hidden]{display:none!important}' +
      '#ipr-exd-dir .cab{display:flex;align-items:center;gap:8px}#ipr-exd-dir .cab h2{margin:0;font:600 17px/1.2 Outfit,Inter,sans-serif;flex:1}' +
      '#ipr-exd-dir .fx{width:34px;height:34px;border-radius:50%;border:1px solid var(--ln);background:transparent;font-size:18px;line-height:1}' +
      '.ipr-exd-doc{display:flex;flex-direction:column;gap:6px}' +
      '.ipr-exd-doc button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--ln);background:var(--p1);text-align:left}' +
      '.ipr-exd-doc button:hover{border-color:var(--ac)}' +
      '.ipr-exd-doc b{font-weight:600}.ipr-exd-doc small{color:var(--mu);font-size:12.5px}.ipr-exd-doc em{font:500 12px/1.3 "IBM Plex Mono",monospace;color:var(--ac);font-style:normal}' +
      '#ipr-exd-ficha:empty{display:none}#ipr-exd-ficha{border-top:1px solid var(--ln);padding-top:12px}' +
      '.ipr-exd-nota{color:var(--mu);font-size:13px;margin:0}' +
      // zoom
      '#ipr-exd-zoom{position:fixed;z-index:99991;right:14px;bottom:28px;display:flex;flex-direction:column;border:1px solid var(--ln);border-radius:10px;overflow:hidden;background:var(--vn)}' +
      'html.ipr-exd-d #ipr-exd-zoom{right:' + (LD + 14) + 'px}' +
      '@media (max-width:1100px){html.ipr-exd-d #ipr-exd-zoom{right:14px}}' +
      '#ipr-exd-zoom button{width:40px;height:40px;border:0;background:transparent;font-size:20px;line-height:1}#ipr-exd-zoom button+button{border-top:1px solid var(--ln)}' +
      // entrada e janela do Intelligence
      '.ipr-exd-fu{position:fixed;inset:0;z-index:100001;background:rgba(6,10,5,.62);display:flex;align-items:center;justify-content:center;padding:20px}' +
      '.ipr-exd-fu[hidden]{display:none!important}' +
      '.ipr-exd-cx{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:var(--vn);border:1px solid var(--ln);border-radius:16px;padding:26px 26px 20px;box-shadow:0 24px 60px rgba(0,0,0,.5)}' +
      '.ipr-exd-cx .k{margin:0 0 6px;font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ac)}' +
      '.ipr-exd-cx h1,.ipr-exd-cx h2{margin:0 0 6px;font:600 28px/1.15 Outfit,Inter,sans-serif;text-wrap:balance}' +
      '.ipr-exd-cx h2{font-size:22px}' +
      '.ipr-exd-cx .sub{margin:0 0 16px;color:var(--mu)}' +
      '.ipr-exd-cx form{display:flex;gap:8px;position:relative}.ipr-exd-cx input{flex:1;min-width:0;height:46px;border-radius:12px;border:1px solid var(--ln);background:var(--p1);color:var(--tx);padding:0 14px;font:inherit;font-size:15px}' +
      '.ipr-exd-cx .err{margin:6px 0 0;color:#e6b35a;font-size:13px}' +
      '.ipr-exd-cx .alt{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px}.ipr-exd-cx .alt .ipr-exd-ol{flex:1}' +
      '.ipr-exd-cx h3{margin:0 0 8px;font:500 11px/1.2 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}' +
      '.ipr-exd-cx .pe{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}' +
      '.ipr-exd-cx .res{list-style:none;margin:8px 0 0;padding:0;border:1px solid var(--ln);border-radius:10px;overflow:hidden}.ipr-exd-cx .res[hidden]{display:none}' +
      '.ipr-exd-cx .res button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;background:var(--p1)}.ipr-exd-cx .res li+li button{border-top:1px solid var(--ln)}.ipr-exd-cx .res small{display:block;color:var(--mu)}' +
      '.ipr-exd-cx .int2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}' +
      '.ipr-exd-cx .int2 div{border:1px solid var(--ln);border-radius:10px;padding:10px 12px;background:var(--p1)}.ipr-exd-cx .int2 b{display:block;font-weight:600;margin-bottom:2px}.ipr-exd-cx .int2 small{color:var(--mu);font-size:12.5px}' +
      '.ipr-exd-cx .bts{display:flex;gap:8px;flex-wrap:wrap}' +
      // sugestões
      '.ipr-exd-sug{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 4px);list-style:none;margin:0;padding:4px;background:var(--p1);border:1px solid var(--ln);border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.45)}' +
      '.ipr-exd-sug[hidden]{display:none}.ipr-exd-sug li{padding:8px 10px;border-radius:8px;cursor:pointer}.ipr-exd-sug li[aria-selected=true],.ipr-exd-sug li:hover{background:var(--p2)}' +
      '.ipr-exd-sug b{display:block;font-weight:500}.ipr-exd-sug small{color:var(--mu)}.ipr-exd-sug .cr{cursor:default;font-size:11px;color:var(--mu);text-align:right;padding:2px 8px}.ipr-exd-sug .cr:hover{background:none}' +
      '#ipr-exd-toast{position:fixed;z-index:100003;top:72px;left:50%;transform:translateX(-50%);max-width:min(560px,calc(100vw - 32px));background:var(--vn);border:1px solid var(--ac);border-radius:12px;padding:10px 14px;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.4)}' +
      '#ipr-exd-toast[hidden]{display:none}' +
      '#ipr-exd-volta{position:fixed;z-index:99991;right:64px;top:58px;height:34px;padding:0 12px;border-radius:999px;border:1px solid #2e3a28;background:#10170d;color:#eef0e6;font:500 12.5px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
      '@media (prefers-reduced-motion:reduce){.ipr-exd-ui *{transition:none!important}}';
    (D.head || H).appendChild(s);
  }

  // ───────── peças ─────────
  function entrarLink() { var a = $('ipe-entrar'); return a ? { href: a.getAttribute('href') || '/conta/', txt: (a.textContent || '').trim() } : { href: '/conta/?redirect_to=%2Fatlas%2F', txt: '' }; }
  function topo() {
    var b = D.createElement('header'); b.id = 'ipr-exd-top'; b.className = 'ipr-exd-ui';
    var en = entrarLink(), logado = D.body.classList.contains('logged-in');
    b.innerHTML = '<a class="m" href="/atlas/" aria-label="IPR Atlas Explorer">IPR Atlas<small>Explorer</small></a>' +
      '<form role="search"><input id="ipr-exd-q" type="search" autocomplete="off" placeholder="' + esc(T('Procurar local, morada, coordenadas ou artigo (NIC)', 'Search place, address, coordinates or parcel ID')) + '" aria-label="' + esc(T('Procurar', 'Search')) + '"></form>' +
      '<div class="d"><button type="button" class="ipr-exd-ol" id="ipr-exd-fform" data-x="fecharform">' + esc(T('Fechar o formulário', 'Close the form')) + '</button><button type="button" class="ipr-exd-ol" data-x="lingua" lang="' + (EN() ? 'pt' : 'en') + '">' + (EN() ? 'PT' : 'EN') + '</button>' +
      '<a class="ipr-exd-ol" href="' + esc(en.href) + '">' + esc(en.txt || (logado ? T('A minha conta', 'My account') : T('Entrar', 'Sign in'))) + '</a>' +
      (logado ? '<a class="ipr-exd-ol" href="' + esc(SAIR) + '">' + esc(T('Sair', 'Sign out')) + '</a>' : '') +
      '<button type="button" class="ipr-exd-ac" data-x="comprar">' + esc(T('Comprar', 'Buy')) + '</button></div>';
    b.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); procurar(b.querySelector('input').value, null); });
    return b;
  }
  function esquerda() {
    var o = D.createElement('aside'); o.id = 'ipr-exd-esq'; o.className = 'ipr-exd-ui'; o.setAttribute('aria-label', T('Explorar o terreno', 'Explore the land'));
    var ip = intelPreco();
    o.innerHTML =
      '<section class="ipr-exd-sec"><h2>' + esc(T('O seu terreno', 'Your land')) + '</h2><div class="ipr-exd-ter" id="ipr-exd-ter"></div></section>' +
      '<section class="ipr-exd-sec"><h2>' + esc(T('O que quer saber?', 'What do you want to know?')) + '</h2><div class="ipr-exd-pg">' +
        PERG.map(function (p) { return '<button type="button" data-pg="' + p.k + '" aria-pressed="false">' + esc(EN() ? p.en : p.pt) + '</button>'; }).join('') +
      '</div><div id="ipr-exd-x" class="ipr-exd-x" hidden></div></section>' +
      '<section class="ipr-exd-sec"><h2>' + esc(T('No mapa', 'On the map')) + '</h2><div class="ipr-exd-cam">' +
        CAM.map(function (c) { return '<button type="button" data-cam="' + c.k + '" aria-pressed="false" title="' + esc(EN() ? c.d[1] : c.d[0]) + '"><b>' + esc(EN() ? c.en : c.pt) + '</b><small>' + esc(EN() ? c.d[1] : c.d[0]) + '</small></button>'; }).join('') +
      '</div></section>' +
      '<section class="ipr-exd-sec"><h2>' + esc(T('Medir', 'Measure')) + '</h2><div class="ipr-exd-fe">' +
        '<button type="button" data-fe="area" aria-pressed="false">' + esc(T('Área', 'Area')) + '</button>' +
        '<button type="button" data-fe="regua" aria-pressed="false">' + esc(T('Distância', 'Distance')) + '</button>' +
        '<button type="button" data-fe="gps" aria-pressed="false">' + esc(T('A minha posição', 'My location')) + '</button>' +
      '</div></section>' +
      '<section class="ipr-exd-int" aria-labelledby="ipr-exd-intt"><h3 id="ipr-exd-intt">' + esc(T('O que o Intelligence tem a mais', 'What Intelligence adds')) + ' <i>Pro</i></h3>' +
        '<p>' + esc(T('Para quem desenha, planeia e decide sobre o território.', 'For people who design, plan and decide about land.')) + '</p><ul>' +
        '<li>' + esc(T('Todas as camadas técnicas: condicionantes completas, solos, geologia, ocupação do solo, habitats e clima', 'Every technical layer: full restrictions, soils, geology, land cover, habitats and climate')) + '</li>' +
        '<li>' + esc(T('Estúdio de desenho: keyline, charcas, caminhos e projectos', 'Design studio: keyline, ponds, tracks and projects')) + '</li>' +
        '<li>' + esc(T('Simuladores de água e de fogo sobre o relevo do terreno', 'Water and wildfire simulators on the terrain')) + '</li>' +
        '<li>' + esc(T('Imagens de satélite, perfis e vista 3D', 'Satellite imagery, profiles and 3D view')) + '</li>' +
        '<li>' + esc(T('Exportar para QGIS e levar para o campo no QField', 'Export to QGIS and take it to the field in QField')) + '</li>' +
        '</ul><button type="button" class="ipr-exd-ol" data-x="intel">' + esc(T('Conhecer o Intelligence · ', 'About Intelligence · ') + eur(ip.mes) + T('/mês', '/month')) + '</button></section>' +
      '';
    return o;
  }
  function direita() {
    var o = D.createElement('aside'); o.id = 'ipr-exd-dir'; o.className = 'ipr-exd-ui'; o.hidden = true; o.setAttribute('aria-label', T('O terreno escolhido', 'Selected land'));
    o.innerHTML = '<div class="cab"><h2>' + esc(T('O terreno escolhido', 'Selected land')) + '</h2><button type="button" class="fx" data-x="fechardir" aria-label="' + esc(T('Fechar', 'Close')) + '">×</button></div>' +
      '<p class="ipr-exd-nota" id="ipr-exd-ha"></p>' +
      '<button type="button" class="ipr-exd-ac" data-x="ficha">' + esc(T('Ver a Ficha da propriedade (grátis)', 'See the Property sheet (free)')) + '</button>' +
      '<div id="ipr-exd-ficha"></div>' +
      '<section class="ipr-exd-sec"><h2>' + esc(T('Documentos para este terreno', 'Documents for this land')) + '</h2><div class="ipr-exd-doc">' + docs() + '</div></section>' +
      '<button type="button" class="ipr-exd-ol" data-x="trocar">' + esc(T('Escolher outro terreno', 'Choose other land')) + '</button>';
    return o;
  }
  function docs() {
    return [
      ['planta', T('Planta de Localização', 'Location Plan'), T('PDF à escala sobre o ortofotomapa, para a câmara, o banco ou a escritura.', 'Scaled PDF on the orthophoto, for the town hall, the bank or the deed.'), linhaPreco('planta', false)],
      ['leitura', T('Leitura Territorial', 'Territorial Reading'), T('Relatório da nossa equipa: REN, RAN, PDM, Natura 2000, água e fogo, e o que isso permite.', 'Report by our team: REN, RAN, PDM, Natura 2000, water and fire, and what they allow.'), linhaPreco('leitura', true)],
      ['base', T('Base Cartográfica', 'Base Map'), T('O relevo do terreno em mapas e ficheiros (LiDAR da DGT): curvas, declives, linhas de água, 3D.', 'The relief of your land as maps and files (DGT LiDAR): contours, slopes, water lines, 3D.'), linhaPreco('base', true)]
    ].map(function (d) { return '<button type="button" data-doc="' + d[0] + '"><b>' + esc(d[1]) + '</b><small>' + esc(d[2]) + '</small><em>' + esc(d[3]) + '</em></button>'; }).join('');
  }
  function zoomBts() {
    var o = D.createElement('div'); o.id = 'ipr-exd-zoom'; o.className = 'ipr-exd-ui';
    o.innerHTML = '<button type="button" data-x="zmais" aria-label="' + esc(T('Aproximar', 'Zoom in')) + '">+</button><button type="button" data-x="zmenos" aria-label="' + esc(T('Afastar', 'Zoom out')) + '">−</button>';
    return o;
  }
  function entrada() {
    var o = D.createElement('div'); o.id = 'ipr-exd-bv'; o.className = 'ipr-exd-ui ipr-exd-fu'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ipr-exd-bvt');
    o.innerHTML = '<div class="ipr-exd-cx"><p class="k">IPR Atlas · Explorer</p><h1 id="ipr-exd-bvt">' + esc(T('O seu terreno, num mapa.', 'Your land, on a map.')) + '</h1>' +
      '<p class="sub">' + esc(T('Veja os limites, as restrições, a água e o risco de incêndio de qualquer terreno em Portugal. Grátis e sem conta.', 'See the boundaries, restrictions, water and wildfire risk of any land in Portugal. Free, no account needed.')) + '</p>' +
      '<form role="search"><input id="ipr-exd-q2" type="search" autocomplete="off" placeholder="' + esc(T('Local, morada, coordenadas ou artigo (NIC)', 'Place, address, coordinates or parcel ID')) + '" aria-label="' + esc(T('Procurar', 'Search')) + '"><button type="submit" class="ipr-exd-ac">' + esc(T('Procurar', 'Search')) + '</button></form>' +
      '<p class="err" hidden></p><ul class="res" id="ipr-exd-res" hidden></ul>' +
      '<div class="alt"><button type="button" class="ipr-exd-ol" data-x="escolher">' + esc(T('Escolher no mapa', 'Pick on the map')) + '</button><button type="button" class="ipr-exd-ol" data-x="desenhar">' + esc(T('Desenhar o limite', 'Draw the boundary')) + '</button><button type="button" class="ipr-exd-ol" data-x="ficheiro">' + esc(T('Carregar ficheiro', 'Upload a file')) + '</button></div>' +
      '<h3>' + esc(T('Ou peça já um documento', 'Or order a document now')) + '</h3><div class="ipr-exd-doc">' + docs() + '</div>' +
      '<div class="pe"><button type="button" class="ipr-exd-ol" data-x="fecharbv">' + esc(T('Só quero explorar o mapa', 'I just want to explore the map')) + '</button><button type="button" class="ipr-exd-lnk" data-x="intel">' + esc(T('Trabalha com território? Conheça o Intelligence', 'Working with land? Meet Intelligence')) + '</button></div></div>';
    o.addEventListener('click', function (e) { if (e.target === o) fecharEntrada(); });
    o.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); procurar(o.querySelector('#ipr-exd-q2').value, o); });
    return o;
  }
  function janelaIntel() {
    var o = $('ipr-exd-in');
    if (!o) { o = D.createElement('div'); o.id = 'ipr-exd-in'; o.className = 'ipr-exd-ui ipr-exd-fu'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ipr-exd-int2'); o.addEventListener('click', function (e) { if (e.target === o) o.hidden = true; }); D.body.appendChild(o); }
    var ip = intelPreco();
    o.innerHTML = '<div class="ipr-exd-cx"><p class="k">IPR Atlas · Intelligence</p><h2 id="ipr-exd-int2">' + esc(T('O Atlas inteiro, para quem trabalha o território', 'The whole Atlas, for people who work the land')) + '</h2>' +
      '<p class="sub">' + esc(T('O Explorer mostra o essencial de qualquer terreno. O Intelligence abre tudo o resto:', 'Explorer shows the essentials of any land. Intelligence opens everything else:')) + '</p><div class="int2">' +
      [[T('Todas as camadas', 'Every layer'), T('Condicionantes completas, solos, geologia, ocupação do solo, habitats, clima e água subterrânea.', 'Full restrictions, soils, geology, land cover, habitats, climate and groundwater.')],
       [T('Estúdio de desenho', 'Design studio'), T('Keyline, charcas, caminhos e projectos guardados, sobre o relevo LiDAR.', 'Keyline, ponds, tracks and saved projects, on LiDAR relief.')],
       [T('Simuladores', 'Simulators'), T('Para onde corre a água numa chuvada e como avança um incêndio no terreno.', 'Where water runs in a storm and how a fire spreads across the land.')],
       [T('Para o campo e o QGIS', 'Field and QGIS'), T('Satélite, perfis, 3D, exportação para QGIS e QField.', 'Satellite, profiles, 3D, export to QGIS and QField.')]
      ].map(function (x) { return '<div><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></div>'; }).join('') + '</div>' +
      '<p class="sub">' + esc(eur(ip.mes) + T(' + IVA por mês, ou ', ' + VAT a month, or ') + eur(ip.ano) + T(' + IVA por ano.', ' + VAT a year.')) + '</p>' +
      '<div class="bts">' + (ip.umes ? '<a class="ipr-exd-ac" data-g="intel_mes" href="' + esc(ip.umes) + '">' + esc(T('Assinar por mês', 'Subscribe monthly')) + '</a>' : '') +
      (ip.uano ? '<a class="ipr-exd-ol" data-g="intel_ano" href="' + esc(ip.uano) + '">' + esc(T('Assinar por ano', 'Subscribe yearly')) + '</a>' : '') +
      '<a class="ipr-exd-ol" data-g="intel_planos" href="' + esc(ip.planos) + '">' + esc(T('Ver planos e pormenores', 'Plans and details')) + '</a>' +
      '<button type="button" class="ipr-exd-ol" data-x="fecharin">' + esc(T('Fechar', 'Close')) + '</button></div></div>';
    o.hidden = false; gtag('exd_intel');
    var f = o.querySelector('a,button'); if (f) try { f.focus(); } catch (e) {}
  }

  // ───────── terreno escolhido ─────────
  function desenho() {
    var m = mapa(); if (!m) return null; var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === 'function') { try { var a = cs[i].getAll(); if (a && a.features) return a; } catch (e) {} }
    return null;
  }
  function poligonos() { var a = desenho(); return a ? a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }) : []; }
  function temTerreno() { return poligonos().length > 0; }
  function areaHa() { // aproximação esférica (só para mostrar; os preços são calculados pelo assistente)
    var R = 6378137, tot = 0;
    poligonos().forEach(function (f) {
      var polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      polys.forEach(function (pl) { pl.forEach(function (ring, ri) { var s = 0; for (var i = 0; i < ring.length - 1; i++) { var a = ring[i], b = ring[i + 1]; s += (b[0] - a[0]) * Math.PI / 180 * (2 + Math.sin(a[1] * Math.PI / 180) + Math.sin(b[1] * Math.PI / 180)); } s = Math.abs(s * R * R / 2); tot += ri ? -s : s; }); });
    });
    return tot / 10000;
  }
  var ultimoTer = null, dirFechada = false;
  function pintarTerreno() {
    var el = $('ipr-exd-ter'); if (!el) return;
    var tem = temTerreno(), chave = tem ? 'sim' + poligonos().length + ':' + Math.round(areaHa() * 100) : 'nao';
    if (chave === ultimoTer) return; var antes = ultimoTer; ultimoTer = chave;
    if (tem) {
      var ha = areaHa();
      el.innerHTML = '<p class="ipr-exd-nota">' + esc(T('Terreno escolhido', 'Land selected') + ' · ' + ha.toLocaleString(EN() ? 'en-GB' : 'pt-PT', { maximumFractionDigits: ha < 10 ? 2 : 1 }) + ' ha') + '</p>' +
        '<button type="button" class="ipr-exd-ac" data-x="abrirdir">' + esc(T('Ficha e documentos', 'Sheet and documents')) + '</button>' +
        '<div class="lin"><button type="button" class="ipr-exd-ol" data-x="trocar">' + esc(T('Outro terreno', 'Other land')) + '</button></div>';
      var h = $('ipr-exd-ha'); if (h) h.textContent = T('Área aproximada: ', 'Approximate area: ') + ha.toLocaleString(EN() ? 'en-GB' : 'pt-PT', { maximumFractionDigits: ha < 10 ? 2 : 1 }) + ' ha. ' + T('Pode tocar noutras parcelas para as juntar.', 'You can tap other parcels to add them.');
      if (!antes || antes === 'nao') { dirFechada = false; var f = $('ipr-exd-ficha'); if (f) f.innerHTML = ''; }
      if (!dirFechada) abrirDir(true);
    } else {
      el.innerHTML = '<p class="ipr-exd-nota">' + esc(T('Procure o local em cima, aproxime-se e toque na parcela do terreno. Também pode desenhar o limite ou carregar um ficheiro (KML, KMZ, GeoJSON, Shapefile).', 'Search the place above, zoom in and tap the parcel. You can also draw the boundary or upload a file (KML, KMZ, GeoJSON, Shapefile).')) + '</p>' +
        '<button type="button" class="ipr-exd-ac" data-x="escolher">' + esc(T('Escolher no mapa', 'Pick on the map')) + '</button>' +
        '<div class="lin"><button type="button" class="ipr-exd-ol" data-x="desenhar">' + esc(T('Desenhar', 'Draw')) + '</button><button type="button" class="ipr-exd-ol" data-x="ficheiro">' + esc(T('Ficheiro', 'File')) + '</button></div>';
      abrirDir(false); var f2 = $('ipr-exd-ficha'); if (f2) f2.innerHTML = '';
    }
  }
  function abrirDir(on) {
    var o = $('ipr-exd-dir'); if (!o) return; var antes = !o.hidden;
    o.hidden = !on; H.classList.toggle('ipr-exd-d', on);
    if (antes !== on) redimensionar();
  }
  // Abre-se por intenção: o assistente («Ir para o formulário»), um botão «Encomendar a Base…», ou o Atlas a pôr o foco num
  // campo desse painel. Fecha-se no botão «Fechar o formulário» do topo ou ao trocar de terreno.
  function mostrarForm(on) { if (H.classList.contains('ipr-exd-form') === on) return; H.classList.toggle('ipr-exd-form', on); redimensionar(); if (on) gtag('exd_formulario'); }
  function intencaoForm(e) {
    var b = e.target && e.target.closest && e.target.closest('button,a'); if (!b || b.closest('.ipr-exd-ui')) return;
    var t = (b.textContent || '').trim();
    if (/formul[aá]rio|order form|^Encomendar a Base|Order the Base|Pedir a Base|Ir para o pedido/i.test(t)) setTimeout(function () { mostrarForm(true); }, 250);
  }
  function focoForm(e) { var d = $('ipe-dir'); if (d && d.contains(e.target) && !H.classList.contains('ipr-exd-form')) mostrarForm(true); }
  function verAssistente() {
    var x = $('ipr-as-pn'), on = !!(x && x.offsetParent !== null && x.getBoundingClientRect().width > 0);
    if (on !== H.classList.contains('ipr-exd-as')) { H.classList.toggle('ipr-exd-as', on); redimensionar(); }
  }
  function redimensionar() { var m = mapa(); setTimeout(function () { try { if (m) m.resize(); } catch (e) {} }, 60); }
  function enquadrar() {
    var m = mapa(), ps = poligonos(); if (!m || !ps.length) return;
    var x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    ps.forEach(function (f) { JSON.stringify(f.geometry.coordinates).replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, function (_, x, y) { x = +x; y = +y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; return ''; }); });
    if (x0 > x1) return;
    setTimeout(function () { try { m.fitBounds([[x0, y0], [x1, y1]], { padding: 60, maxZoom: 17, duration: 600 }); } catch (e) {} }, 300);
  }

  // ───────── acções ─────────
  function ferramenta(t) { var b = D.querySelector('.ipe-tools [data-tool="' + t + '"]'); if (!b) return false; var e = ipe() && ipe().estado; if (e && e.tool === t) return true; b.click(); return true; }
  function histAberto() { var b = D.querySelector('.ipe-tools [data-tool="historico"]'); return !!(b && b.getAttribute('aria-pressed') === 'true'); }
  function ferramentaActiva() { var e = ipe() && ipe().estado; return e ? e.tool : ''; }
  function modoParcelas() { var e = ipe() && ipe().estado; if (!e) return; if (e.tool === 'nav') ferramenta('parcelas'); }
  function escolher() {
    fecharEntrada();
    if (!ligado.cad) camLigar('cad', true);
    ferramenta('parcelas');
    var m = mapa(); if (m && m.getZoom() < 14) toast(T('Procure o local em cima ou aproxime-se. As parcelas do cadastro aparecem a partir de perto; toque na do seu terreno.', 'Search the place above or zoom in. Cadastre parcels appear up close; tap yours.'));
    else toast(T('Toque na parcela do seu terreno. Pode tocar em várias para as juntar.', 'Tap your parcel. You can tap several to join them.'));
  }
  function desenhar() {
    fecharEntrada();
    if (!ferramenta('desenhar')) { comprar(); return; }
    toast(T('Clique no mapa em cada canto do terreno. Clique no primeiro ponto para fechar.', 'Click the map at each corner. Click the first point to close.'));
  }
  function ficheiro() { fecharEntrada(); var i = $('ipe-file'); if (i) i.click(); else if (!ferramenta('importar')) comprar(); }
  function trocar() {
    var m = mapa(), cs = (m && m._controls) || [];
    cs.forEach(function (c) { if (c && typeof c.deleteAll === 'function') try { c.deleteAll(); m.fire('draw.delete', { features: [] }); } catch (e) {} });
    ultimoTer = null; mostrarForm(false); pintarTerreno(); escolher();
  }
  function ficha() {
    gtag('exd_ficha');
    if (typeof W.__iprFichaGratuita !== 'function' || !temTerreno()) return;
    var alvo = $('ipr-exd-ficha'); if (!alvo) return;
    alvo.innerHTML = '<p class="ipr-exd-nota">' + esc(T('A cruzar o terreno com os dados públicos. Leva cerca de 10 segundos.', 'Crossing the land with public data. Takes about 10 seconds.')) + '</p>';
    try { W.__iprFichaGratuita(true); } catch (e) {}
    var t0 = Date.now();
    (function mover() { // a ficha é feita pelo Atlas em #ipe-res; aqui só se mostra dentro do painel da direita
      var out = D.querySelector('#ipe-res .ipr-fg-out') || alvo.querySelector('.ipr-fg-out');
      if (out && out.parentNode !== alvo) { alvo.innerHTML = ''; alvo.appendChild(out); }
      if (Date.now() - t0 < 30000) setTimeout(mover, 400);
    })();
  }
  function comprar(produto) {
    gtag('exd_comprar', { produto: produto || '' });
    fecharEntrada();
    try { if (produto && typeof W.iprAssistenteComprar === 'function' && W.iprAssistenteComprar(produto) !== false) return; } catch (e) {}
    if (typeof W.__iprAssistenteAbrir === 'function') { try { W.__iprAssistenteAbrir(produto); return; } catch (e) {} }
    location.href = '/atlas/?assistente=' + (produto || '1');
  }
  function lingua() {
    var b = D.querySelector('.ipe-top [data-lg="' + (EN() ? 'pt' : 'en') + '"]');
    if (b) { b.click(); gtag('exd_lingua'); setTimeout(reconstruir, 500); }
  }
  function pergunta(k) {
    var p = PERG.filter(function (x) { return x.k === k; })[0]; if (!p) return;
    gtag('exd_pergunta', { k: k });
    CAM.forEach(function (c) { var on = p.liga.indexOf(c.k) >= 0; if (!!ligado[c.k] !== on) camLigar(c.k, on); });
    [].forEach.call(D.querySelectorAll('#ipr-exd-esq [data-pg]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pg') === k ? 'true' : 'false'); });
    var x = $('ipr-exd-x'); if (x) { x.textContent = EN() ? p.x[1] : p.x[0]; x.hidden = false; }
    if (!!p.hist !== histAberto()) { var hb = D.querySelector('.ipe-tools [data-tool="historico"]'); if (hb) hb.click(); }
    if (!temTerreno() && ferramentaActiva() === 'nav') modoParcelas();
  }
  function medir(t) {
    gtag('exd_medir', { t: t });
    var act = ferramentaActiva();
    if (t === 'gps') { ferramenta('gps'); return; }
    if (act === t) ferramenta(temTerreno() ? 'nav' : 'parcelas'); else ferramenta(t);
    setTimeout(pintarFe, 120);
  }
  function pintarFe() { var act = ferramentaActiva(); [].forEach.call(D.querySelectorAll('#ipr-exd-esq [data-fe]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-fe') === act ? 'true' : 'false'); }); }

  // ───────── pesquisa (Nominatim ao procurar; Photon para sugestões ao escrever) ─────────
  function voar(r) {
    var m = mapa(); if (!m) return;
    var t = String(r.addresstype || r.type || ''), z = 16;
    if (/^(house|building|road|residential|postcode|farm|farmyard|isolated_dwelling|allotments)$/.test(t)) z = 17;
    else if (/^(town|city|suburb|borough|quarter)$/.test(t)) z = 15;
    else if (/^(municipality|county|state|region|province|administrative|country)$/.test(t)) z = 14;
    try { m.flyTo({ center: [+r.lon, +r.lat], zoom: z, duration: 1200, essential: true }); } catch (e) {}
    if (!ligado.cad) camLigar('cad', true);
    if (!temTerreno()) setTimeout(modoParcelas, 300);
  }
  function porApp(txt) { // NIC e coordenadas: a pesquisa do próprio Atlas sabe tratar
    var i = $('ipe-q'), f = $('ipe-busca'); if (!i || !f) return false;
    i.value = txt;
    try { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } catch (e) { return false; }
    setTimeout(function () { if (!ligado.cad) camLigar('cad', true); }, 1500); return true;
  }
  function procurar(txt, ctx) {
    txt = String(txt || '').trim(); if (!txt) return;
    gtag('exd_pesquisa');
    var err = ctx && ctx.querySelector('.err'), lst = ctx && ctx.querySelector('.res');
    if (err) err.hidden = true;
    var nic = /^[A-Za-z]{3}\s?\d{3}\s?\d{3}\s?\d{3}$/.test(txt) || /^\d{1,6}\s*[-\/]\s*\d/.test(txt), coord = /^\s*-?\d{1,2}(?:[.,]\d+)?\s*[,; ]\s*-?\d{1,3}(?:[.,]\d+)?\s*$/.test(txt);
    if (nic || coord) { porApp(txt); fecharEntrada(); return; }
    if (err) { err.textContent = T('A procurar…', 'Searching…'); err.hidden = false; }
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=pt&accept-language=pt&q=' + encodeURIComponent(txt))
      .then(function (r) { return r.json(); })
      .then(function (a) {
        if (!a || !a.length) { if (err) { err.textContent = T('Não encontrámos esse local. Escreva de outra forma, use coordenadas ou o NIC.', 'Place not found. Try another spelling, coordinates or the parcel ID.'); err.hidden = false; } else toast(T('Não encontrámos esse local.', 'Place not found.')); return; }
        if (err) err.hidden = true;
        if (a.length === 1 || !lst) { voar(a[0]); fecharEntrada(); return; }
        lst.innerHTML = a.map(function (r, i) { var p = String(r.display_name || '').split(', '); return '<li><button type="button" data-r="' + i + '"><b>' + esc(p[0]) + '</b><small>' + esc(p.slice(1, 4).join(', ')) + '</small></button></li>'; }).join('');
        lst.hidden = false;
        lst.onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; voar(a[+b.getAttribute('data-r')]); lst.hidden = true; fecharEntrada(); };
      })
      .catch(function () { if (err) { err.textContent = T('A pesquisa não respondeu. Tente outra vez ou use coordenadas.', 'Search did not respond. Try again or use coordinates.'); err.hidden = false; } });
  }
  var TIPO = { farm: ['Herdade ou quinta', 'Farm'], farmyard: ['Herdade ou quinta', 'Farm'], isolated_dwelling: ['Lugar', 'Place'], locality: ['Lugar', 'Place'],
    hamlet: ['Aldeia', 'Hamlet'], village: ['Aldeia ou vila', 'Village'], town: ['Vila', 'Town'], city: ['Cidade', 'City'], suburb: ['Bairro', 'Suburb'],
    neighbourhood: ['Bairro', 'Neighbourhood'], quarter: ['Bairro', 'Quarter'], peak: ['Serra ou monte', 'Peak'], stream: ['Ribeira', 'Stream'], river: ['Rio', 'River'],
    administrative: ['Concelho ou freguesia', 'Municipality or parish'], residential: ['Rua', 'Street'], tertiary: ['Rua', 'Street'], secondary: ['Estrada', 'Road'],
    unclassified: ['Caminho', 'Road'], track: ['Caminho', 'Track'], primary: ['Estrada', 'Road'], house: ['Morada', 'Address'] };
  function zTipo(v, k) { if (/^(farm|farmyard|isolated_dwelling|house|residential|tertiary|unclassified|track|locality)$/.test(v) || k === 'highway' || k === 'building') return 'farm'; if (/^(city|town|suburb|quarter|borough)$/.test(v)) return 'town'; if (v === 'administrative') return 'administrative'; return 'village'; }
  function sugestoes(inp, aoEscolher) {
    if (!inp || inp.__iprSug || !W.fetch) return; inp.__iprSug = 1;
    var f = inp.form || inp.parentNode; if (getComputedStyle(f).position === 'static') f.style.position = 'relative';
    var ul = D.createElement('ul'); ul.className = 'ipr-exd-sug'; ul.hidden = true; ul.setAttribute('role', 'listbox'); ul.id = inp.id + '-sug';
    f.appendChild(ul); inp.setAttribute('aria-autocomplete', 'list'); inp.setAttribute('aria-controls', ul.id); inp.setAttribute('aria-expanded', 'false');
    var lista = [], act = -1, tmo = 0, ctl = null, ult = '';
    function fechar() { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); act = -1; }
    function marcar(i) { act = i; [].forEach.call(ul.querySelectorAll('[role=option]'), function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); if (j === i) inp.setAttribute('aria-activedescendant', b.id); }); }
    function escolherS(i) { var r = lista[i]; if (!r) return; inp.value = r.nome; fechar(); gtag('exd_sugestao', { tipo: r.addresstype }); aoEscolher(r); }
    function mostrar() {
      if (!lista.length) { fechar(); return; }
      ul.innerHTML = lista.map(function (r, i) { return '<li role="option" id="' + ul.id + '-' + i + '" aria-selected="false" data-i="' + i + '"><b>' + esc(r.nome) + '</b><small>' + esc([r.tipo, r.onde].filter(Boolean).join(' · ')) + '</small></li>'; }).join('') +
        '<li class="cr" aria-hidden="true">© OpenStreetMap</li>';
      ul.hidden = false; inp.setAttribute('aria-expanded', 'true'); act = -1;
    }
    function pedir(qq) {
      if (ctl) try { ctl.abort(); } catch (e) {}
      ctl = W.AbortController ? new AbortController() : null;
      fetch('https://photon.komoot.io/api/?limit=7&lang=default&bbox=-31.6,32.3,-6.1,42.2&q=' + encodeURIComponent(qq), ctl ? { signal: ctl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (inp.value.trim() !== qq) return;
          var vistos = {};
          lista = (j.features || []).filter(function (x) { return x.properties && x.properties.countrycode === 'PT'; }).map(function (x) {
            var p = x.properties, c = x.geometry.coordinates, nome = p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || p.postcode || '';
            var onde = [p.district && p.district !== nome ? p.district : '', p.city && p.city !== nome ? p.city : '', p.county && p.county !== p.city ? p.county : ''].filter(Boolean).slice(0, 2).join(', ');
            var t = TIPO[p.osm_value] || (p.osm_key === 'highway' ? ['Rua ou caminho', 'Road'] : null);
            return { nome: nome, onde: onde, tipo: t ? (EN() ? t[1] : t[0]) : '', lat: String(c[1]), lon: String(c[0]), addresstype: zTipo(p.osm_value, p.osm_key) };
          }).filter(function (r) { var k = (r.nome + '|' + r.onde).toLowerCase(); if (!r.nome || vistos[k]) return false; vistos[k] = 1; return true; }).slice(0, 6);
          mostrar();
        }).catch(function () {});
    }
    inp.addEventListener('input', function () {
      var qq = inp.value.trim(); clearTimeout(tmo);
      if (qq.length < 3 || qq === ult || /^[A-Za-z]{3}\s?\d{3}/.test(qq) || /^\s*-?\d{1,2}[.,]\d/.test(qq)) { if (qq.length < 3) fechar(); return; }
      tmo = setTimeout(function () { ult = qq; pedir(qq); }, 280);
    });
    inp.addEventListener('keydown', function (e) {
      if (ul.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(Math.min(lista.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(Math.max(0, act - 1)); }
      else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); e.stopPropagation(); escolherS(act); }
      else if (e.key === 'Escape') fechar();
    });
    ul.addEventListener('mousedown', function (e) { e.preventDefault(); });
    ul.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) escolherS(+li.getAttribute('data-i')); });
    inp.addEventListener('blur', function () { setTimeout(fechar, 150); });
    if (inp.form) inp.form.addEventListener('submit', function () { fechar(); }, true);
  }

  var tt = null;
  function toast(m) {
    var t = $('ipr-exd-toast');
    if (!t) { t = D.createElement('div'); t.id = 'ipr-exd-toast'; t.className = 'ipr-exd-ui'; t.setAttribute('role', 'status'); D.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 7000);
  }
  function fecharEntrada() { var o = $('ipr-exd-bv'); if (o && !o.hidden) { o.hidden = true; } try { sessionStorage.setItem('ipr_exd_bv', '1'); } catch (e) {} }

  function cliques(e) {
    setTimeout(verAssistente, 350);
    var b = e.target.closest('[data-x],[data-cam],[data-pg],[data-fe],[data-doc],[data-g]'); if (!b || !b.closest('.ipr-exd-ui')) return;
    if (b.hasAttribute('data-g')) { gtag('exd_' + b.getAttribute('data-g')); return; } // ligação normal (carrinho, planos)
    e.preventDefault();
    if (b.hasAttribute('data-cam')) { var k = b.getAttribute('data-cam'), on = b.getAttribute('aria-pressed') !== 'true'; camLigar(k, on); gtag('exd_camada', { k: k, on: on }); return; }
    if (b.hasAttribute('data-pg')) { pergunta(b.getAttribute('data-pg')); return; }
    if (b.hasAttribute('data-fe')) { medir(b.getAttribute('data-fe')); return; }
    if (b.hasAttribute('data-doc')) { comprar(b.getAttribute('data-doc')); return; }
    var x = b.getAttribute('data-x'), m = mapa();
    if (x === 'comprar') comprar();
    else if (x === 'lingua') lingua();
    else if (x === 'intel') janelaIntel();
    else if (x === 'fecharin') { var i = $('ipr-exd-in'); if (i) i.hidden = true; }
    else if (x === 'fecharbv') { fecharEntrada(); if (!temTerreno()) modoParcelas(); }
    else if (x === 'escolher') escolher();
    else if (x === 'desenhar') desenhar();
    else if (x === 'ficheiro') ficheiro();
    else if (x === 'ficha') ficha();
    else if (x === 'trocar') trocar();
    else if (x === 'abrirdir') { dirFechada = false; abrirDir(true); enquadrar(); }
    else if (x === 'fechardir') { dirFechada = true; abrirDir(false); }
    else if (x === 'fecharform') mostrarForm(false);
    else if (x === 'zmais') { try { m.zoomIn(); } catch (er) {} }
    else if (x === 'zmenos') { try { m.zoomOut(); } catch (er) {} }
  }
  function teclas(e) {
    if (e.key !== 'Escape') return;
    var i = $('ipr-exd-in'); if (i && !i.hidden) { i.hidden = true; return; }
    var bv = $('ipr-exd-bv'); if (bv && !bv.hidden) fecharEntrada();
  }

  // ───────── montar, desmontar ─────────
  var montado = false, relogio = 0;
  function reconstruir() {
    if (!montado) return;
    ['ipr-exd-top', 'ipr-exd-esq', 'ipr-exd-dir', 'ipr-exd-zoom'].forEach(function (id) { var x = $(id); if (x) x.remove(); });
    var bv = $('ipr-exd-bv'), aberto = bv && !bv.hidden; if (bv) bv.remove();
    pecas(aberto); ultimoTer = null; lerCam(); pintarCam(); pintarTerreno();
  }
  function pecas(comEntrada) {
    D.body.appendChild(topo()); D.body.appendChild(esquerda()); D.body.appendChild(direita()); D.body.appendChild(zoomBts());
    var bv = entrada(); bv.hidden = !comEntrada; D.body.appendChild(bv);
    sugestoes($('ipr-exd-q'), function (r) { voar(r); });
    sugestoes($('ipr-exd-q2'), function (r) { voar(r); fecharEntrada(); });
  }
  function desmontar() {
    if (!montado) return; montado = false; clearInterval(relogio);
    H.classList.remove('ipr-exd', 'ipr-exd-d', 'ipr-exd-form', 'ipr-exd-as');
    ['ipr-exd-top', 'ipr-exd-esq', 'ipr-exd-dir', 'ipr-exd-zoom', 'ipr-exd-bv', 'ipr-exd-in', 'ipr-exd-toast'].forEach(function (id) { var x = $(id); if (x) x.remove(); });
    D.removeEventListener('click', cliques, true); D.removeEventListener('click', intencaoForm, true); D.removeEventListener('focusin', focoForm, true); D.removeEventListener('keydown', teclas);
    redimensionar();
  }
  function podeFicar() { return !intel() && !equipa() && !(($('ipe') || {}).classList || { contains: function () { return false; } }).contains('cli'); }
  function montar() {
    if (!D.body || !$('ipe') || !viz() || !$('ipe-ctx-t')) return false;
    if (!podeFicar()) return true;
    css();
    H.classList.add('ipr-exd');
    var visto = false; try { visto = sessionStorage.getItem('ipr_exd_bv') === '1'; } catch (e) {}
    pecas(!visto);
    D.addEventListener('click', cliques, true); D.addEventListener('click', intencaoForm, true); D.addEventListener('focusin', focoForm, true); D.addEventListener('keydown', teclas);
    montado = true;
    lerCam(); limparRelevo(); if (!ligado.cad) camLigar('cad', true); pintarCam(); pintarTerreno(); redimensionar();
    relogio = setInterval(function () {
      if (D.hidden || !montado) return;
      if (!podeFicar()) { desmontar(); return; } // a conta tem Bases ou passou a Intelligence: Atlas completo
      if (!largo()) { desmontar(); return; }
      verAssistente(); limparRelevo(); pintarTerreno(); pintarFe(); lerCam(); pintarCam();
    }, 1200);
    gtag('exd_entrada');
    if (/[?&]modo=encomenda/.test(location.search)) setTimeout(function () { fecharEntrada(); mostrarForm(true); }, 1500);
    if (/[?&]assistente=/.test(location.search)) fecharEntrada();
    if (/[?&]simulador=/.test(location.search)) setTimeout(function () { fecharEntrada(); janelaIntel(); }, 1500);
    return true;
  }
  // Trava do Explorer (Nuno, 10/11, 15h12): simuladores e estúdio são do Intelligence. Um clique nesses botões abre o cartão
  // do Intelligence em vez da ferramenta. Não mexe em mais nada (desenhar o terreno, medir e comprar ficam como estão).
  var RE_INT = /^(simular (a )?água|simular (o )?fogo|simulate (water|fire|wildfire)|simulador de (água|fogo)|water simulator|fire simulator|abrir o simulador|estúdio|studio|desenho de projecto|project design|keyline)/i;
  function trava() {
    if (W.__iprExdTrava) return; W.__iprExdTrava = 1;
    function parar(e) {
      if (!EXPLORER || intel() || (($('ipe') || {}).classList || { contains: function () { return false; } }).contains('cli')) return;
      var b = e.target && e.target.closest && e.target.closest('button,a,[role=button]'); if (!b || b.closest('.ipr-exd-ui')) return;
      var t = (b.getAttribute('aria-label') || b.textContent || b.title || '').trim().replace(/\s+/g, ' ');
      if (!RE_INT.test(t)) return;
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (e.type === 'click') { gtag('exd_trava', { t: t.slice(0, 40) }); css(); janelaIntel(); }
    }
    ['pointerdown', 'mousedown', 'touchstart', 'pointerup', 'mouseup', 'click'].forEach(function (ev) { W.addEventListener(ev, parar, true); });
  }
  // Botão «Sair» ao lado do nome (Nuno, 10/11, 16h00), no Atlas completo e no topo do telemóvel, para quem tem sessão.
  // Usa a saída do site (m90935: fecha a sessão no servidor e volta à página inicial).
  var SAIR = '/conta/customer-logout/';
  function botaoSair() {
    if (!D.body || !D.body.classList.contains('logged-in')) return;
    var en = $('ipe-entrar');
    if (en && en.parentNode && !$('ipr-sair-topo')) {
      var a = D.createElement('a'); a.id = 'ipr-sair-topo'; a.href = SAIR; a.className = en.className; a.textContent = T('Sair', 'Sign out');
      a.title = T('Terminar a sessão', 'Sign out'); a.style.marginLeft = '6px';
      en.parentNode.insertBefore(a, en.nextSibling);
    }
    var mt = $('ipr-exm-top');
    if (mt && !$('ipr-sair-movel')) {
      var b = D.createElement('a'); b.id = 'ipr-sair-movel'; b.href = SAIR; b.textContent = T('Sair', 'Sign out');
      b.style.cssText = 'margin-left:6px;font:500 13px/1 Inter,system-ui,sans-serif;color:#a7ae9b;text-decoration:underline;white-space:nowrap';
      mt.appendChild(b);
    }
  }
  (function sairCiclo(n) { try { botaoSair(); } catch (e) {} if (n < 40) setTimeout(function () { sairCiclo(n + 1); }, 1500); })(0);
  function arrancar(n) {
    if (MOVEL) { if (EXPLORER) trava(); return; }
    if (!n && EXPLORER) trava();
    if (!forcar && TRABALHO.test(location.search)) return; // endereços de trabalho (Bases, partilhas, convites): Atlas completo, com a trava
    // O «Comprar passo a passo» não abre sozinho por cima da entrada deste modo (abre pelo Comprar e pelos documentos).
    if (!n && !intel() && !equipa()) try { sessionStorage.setItem('ipr_as_auto', '1'); } catch (e) {}
    // Com conta: monta já; se a resposta das Bases marcar a conta como cliente (#ipe.cli), o relógio desmonta e volta o Atlas
    // completo. (Esperar com vários setTimeout não servia: o ritmo.js pára os temporizadores quando a página está quieta.)
    if (montar()) return;
    if (n < 160) setTimeout(function () { arrancar(n + 1); }, 250);
  }
  arrancar(0);
})();
