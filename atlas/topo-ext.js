/* IPR Atlas · Topografia fora de Portugal (Nuno, 26/11/2026, 20h42).
   Para quem vem de França, Bélgica, Países Baixos e Luxemburgo: uma versão simplificada do Atlas, dedicada a vender
   a Base Cartográfica (levantamento topográfico LiDAR). Mostra só o mapa, as camadas oficiais desse país e três passos:
   encontrar o terreno, desenhar o limite, encomendar. O formulário de encomenda é o do próprio Atlas (#ipe-dir), que já
   sabe tratar cada país (França: compra; os outros: pedido ou interesse, conforme o registo /tcd/v1/eu/paises).
   Liga-se quando o mapa está num desses países (ou com ?pais=fr|be|nl|lu). Intelligence e equipa ficam com o Atlas completo.
   Desligar: ?topo=0 ou localStorage ipr_topo_off = "1". */
(function () {
  'use strict';
  var W = window, D = document, H = D.documentElement;
  if (W.__iprTopoExt) return; W.__iprTopoExt = 1;
  var q = location.search;
  try { if (/[?&]topo=0(&|$)/.test(q) || localStorage.getItem('ipr_topo_off') === '1') return; } catch (e) {}
  function intel() { return String(W.IPR_NIVEL || '').toLowerCase() === 'intelligence'; }
  function equipa() { return !!(W.tcdEquipa || W.tcdAdmin); }
  if (intel() || equipa()) return;
  var TRABALHO = /[?&](mapa|ficha|servico|org_camada|projecto|base|partilha|convite|camada|camadas|org)=/;
  if (TRABALHO.test(q)) return;
  function $(id) { return D.getElementById(id); }
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function gtag(n, p) { try { if (W.gtag) W.gtag('event', n, p || {}); } catch (e) {} }

  // ---------- país ----------
  var PAISES = ['FR', 'BE', 'NL', 'LU'];
  var pedido = (q.match(/[?&]pais=(fr|be|nl|lu)(&|$)/i) || [])[1];
  pedido = pedido ? pedido.toUpperCase() : '';
  function paisEm(x, y) {
    try { if (W.__tcdFrCamadas && W.__tcdFrCamadas.dentro(x, y)) return 'FR'; } catch (e) {}
    try { var c = W.__tcdEuCamadas && W.__tcdEuCamadas.pais(x, y); if (c && PAISES.indexOf(c) >= 0) return c; } catch (e) {}
    return '';
  }
  function paisActual() { var m = mapa(); if (!m || !m.getCenter) return pedido; var c = m.getCenter(); return paisEm(c.lng, c.lat) || ''; }

  // ---------- língua ----------
  var LG = (function () {
    var m = q.match(/[?&]lang=(fr|nl|en|pt)(&|$)/i); if (m) return m[1].toLowerCase();
    var n = String((navigator.languages && navigator.languages[0]) || navigator.language || '').slice(0, 2).toLowerCase();
    return ['fr', 'nl', 'en', 'pt'].indexOf(n) >= 0 ? n : '';
  })();
  var lg = LG || 'fr';
  try { var g0 = localStorage.getItem('ipr_topo_lg'); if (g0 && !/[?&]lang=/.test(q)) lg = g0; } catch (e) {}
  function lgPorPais(cc) { if (LG) return; if (cc === 'NL') lg = 'nl'; else if (cc === 'FR' || cc === 'LU') lg = 'fr'; }
  var TX = {
    marca: ['Topographie', 'Topografie', 'Topography', 'Topografia'],
    pais: { FR: ['France', 'Frankrijk', 'France', 'França'], BE: ['Belgique', 'België', 'Belgium', 'Bélgica'], NL: ['Pays-Bas', 'Nederland', 'Netherlands', 'Países Baixos'], LU: ['Luxembourg', 'Luxemburg', 'Luxembourg', 'Luxemburgo'] },
    h1: ['Le relief de votre terrain, en LiDAR.', 'Het reliëf van uw terrein, in LiDAR.', 'The relief of your land, in LiDAR.', 'O relevo do seu terreno, em LiDAR.'],
    sub: ['Une Base Cartographique faite à partir des données LiDAR officielles : courbes de niveau, pentes, écoulement de l’eau et modèle 3D, en cartes PDF et en fichiers SIG.',
      'Een kaartbasis op basis van de officiële LiDAR-gegevens: hoogtelijnen, hellingen, afstroming van water en 3D-model, als PDF-kaarten en GIS-bestanden.',
      'A Base Map made from the official LiDAR data: contour lines, slopes, water flow and a 3D model, as PDF maps and GIS files.',
      'Uma Base Cartográfica feita a partir do LiDAR oficial: curvas de nível, declives, escoamento da água e modelo 3D, em mapas PDF e ficheiros SIG.'],
    p1: ['1. Trouver le terrain', '1. Zoek het terrein', '1. Find the land', '1. Encontrar o terreno'],
    ph: ['Commune, adresse ou coordonnées', 'Gemeente, adres of coördinaten', 'Town, address or coordinates', 'Localidade, morada ou coordenadas'],
    proc: ['Chercher', 'Zoeken', 'Search', 'Procurar'],
    p2: ['2. Indiquer la limite', '2. Teken de grens', '2. Mark the boundary', '2. Indicar o limite'],
    des: ['Dessiner sur la carte', 'Tekenen op de kaart', 'Draw on the map', 'Desenhar no mapa'],
    fic: ['Importer un fichier', 'Bestand laden', 'Upload a file', 'Carregar ficheiro'],
    dica: ['Cliquez sur chaque angle du terrain, puis sur le premier point pour fermer.', 'Klik op elke hoek van het terrein en daarna op het eerste punt om te sluiten.', 'Click each corner of the land, then the first point to close.', 'Clique em cada canto do terreno e depois no primeiro ponto para fechar.'],
    nenhum: ['Aucun terrain indiqué pour l’instant.', 'Nog geen terrein aangeduid.', 'No land marked yet.', 'Ainda não indicou nenhum terreno.'],
    area: ['Terrain indiqué : ', 'Aangeduid terrein: ', 'Land marked: ', 'Terreno indicado: '],
    trocar: ['Recommencer', 'Opnieuw', 'Start again', 'Recomeçar'],
    p3: ['3. Commander', '3. Bestellen', '3. Order', '3. Encomendar'],
    enc: ['Commander la Base Cartographique', 'De kaartbasis aanvragen', 'Order the Base Map', 'Encomendar a Base Cartográfica'],
    int: ['Être prévenu pour ce terrain', 'Op de hoogte blijven voor dit terrein', 'Keep me posted for this land', 'Avisar-me para este terreno'],
    precoFR: ['À partir de {p} HT. Paiement après confirmation de la couverture LiDAR.', 'Vanaf {p} excl. btw. Betaling na bevestiging van de LiDAR-dekking.', 'From {p} excl. VAT. Payment after the LiDAR coverage is confirmed.', 'Desde {p} + IVA. Pagamento depois de confirmada a cobertura LiDAR.'],
    pedidoT: ['Sur demande : nous vérifions les données et vous envoyons un devis.', 'Op aanvraag: we controleren de gegevens en sturen u een offerte.', 'On request: we check the data and send you a quote.', 'A pedido: verificamos os dados e enviamos orçamento.'],
    interT: ['Bientôt disponible dans ce pays. Indiquez votre terrain et nous vous prévenons dès l’ouverture, sans engagement.', 'Binnenkort beschikbaar in dit land. Duid uw terrein aan en we laten het u weten zodra het kan, zonder verplichting.', 'Coming soon in this country. Mark your land and we will let you know when it opens, with no commitment.', 'Em breve neste país. Indique o terreno e avisamos quando abrir, sem compromisso.'],
    precisa: ['Indiquez d’abord le terrain (étape 2).', 'Duid eerst het terrein aan (stap 2).', 'Mark the land first (step 2).', 'Indique primeiro o terreno (passo 2).'],
    cam: ['Couches officielles', 'Officiële kaartlagen', 'Official layers', 'Camadas oficiais'],
    fontes: ['Sources officielles du pays. Information indicative ; la référence opposable est celle de chaque organisme.', 'Officiële bronnen van het land. Indicatieve informatie; de bindende referentie is die van elke instantie.', 'Official national sources. For guidance only; the binding reference is the one published by each authority.', 'Fontes oficiais do país. Informação indicativa; a referência vinculativa é a de cada organismo.'],
    completo: ['Atlas complet', 'Volledige Atlas', 'Full Atlas', 'Atlas completo'],
    voltar: ['Retour à la carte', 'Terug naar de kaart', 'Back to the map', 'Voltar ao mapa'],
    sem: ['La recherche n’a rien trouvé dans ce pays.', 'Niets gevonden in dit land.', 'Nothing found in this country.', 'Nada encontrado neste país.'],
    erro: ['La recherche n’a pas répondu. Réessayez.', 'Het zoeken gaf geen antwoord. Probeer opnieuw.', 'Search did not respond. Try again.', 'A pesquisa não respondeu. Tente outra vez.'],
    inclui: ['Ce que vous recevez', 'Wat u ontvangt', 'What you receive', 'O que recebe'],
    i1: ['Courbes de niveau fines et modèle numérique de terrain', 'Fijne hoogtelijnen en digitaal terreinmodel', 'Fine contour lines and digital terrain model', 'Curvas de nível finas e modelo digital do terreno'],
    i2: ['Pentes, expositions et lignes d’écoulement', 'Hellingen, oriëntatie en afstroomlijnen', 'Slopes, aspect and flow lines', 'Declives, exposições e linhas de escoamento'],
    i3: ['Vue 3D et fichiers pour SIG', '3D-weergave en GIS-bestanden', '3D view and GIS files', 'Vista 3D e ficheiros SIG']
  };
  var IX = { fr: 0, nl: 1, en: 2, pt: 3 };
  function T(k) { var v = TX[k]; return v ? v[IX[lg]] : k; }
  function nomePais(cc) { var v = TX.pais[cc]; return v ? v[IX[lg]] : cc; }

  // ---------- camadas de cada país (as caixas são as dos grupos #tfr / #teu do Atlas) ----------
  var CAMS = {
    FR: [['fr-ortho', 'tfr'], ['fr-plan', 'tfr'], ['fr-cadastro', 'tfr'], ['fr-relevo', 'tfr'], ['fr-curvas', 'tfr']],
    NL: [['nl-orto', 'teu'], ['nl-cad', 'teu'], ['nl-ahn', 'teu']],
    BE: [['vl-orto', 'teu'], ['wa-orto', 'teu'], ['be-cp', 'teu'], ['vl-relevo', 'teu'], ['wa-relevo', 'teu']],
    LU: [['lu-orto', 'teu'], ['lu-cad', 'teu'], ['lu-relevo', 'teu']]
  };
  var NOMES_CAM = {
    'fr-ortho': ['Photographies aériennes', 'Luchtfoto', 'Aerial photos', 'Ortofoto'], 'fr-plan': ['Plan IGN', 'Plan IGN', 'IGN map', 'Plano IGN'],
    'fr-cadastro': ['Cadastre', 'Kadaster', 'Cadastre', 'Cadastro'], 'fr-relevo': ['Relief LiDAR HD', 'Reliëf LiDAR HD', 'LiDAR HD relief', 'Relevo LiDAR HD'],
    'fr-curvas': ['Courbes de niveau', 'Hoogtelijnen', 'Contour lines', 'Curvas de nível'],
    'nl-orto': ['Photographies aériennes', 'Luchtfoto', 'Aerial photos', 'Ortofoto'], 'nl-cad': ['Cadastre', 'Kadaster', 'Cadastre', 'Cadastro'], 'nl-ahn': ['Altimétrie AHN', 'Hoogtekaart AHN', 'AHN elevation', 'Altimetria AHN'],
    'vl-orto': ['Photos aériennes, Flandre', 'Luchtfoto Vlaanderen', 'Flanders aerial photos', 'Ortofoto da Flandres'], 'wa-orto': ['Photos aériennes, Wallonie', 'Luchtfoto Wallonië', 'Wallonia aerial photos', 'Ortofoto da Valónia'],
    'be-cp': ['Cadastre', 'Kadaster', 'Cadastre', 'Cadastro'], 'vl-relevo': ['Relief LiDAR, Flandre', 'Reliëf LiDAR Vlaanderen', 'Flanders LiDAR relief', 'Relevo LiDAR da Flandres'],
    'wa-relevo': ['Relief LiDAR, Wallonie', 'Reliëf LiDAR Wallonië', 'Wallonia LiDAR relief', 'Relevo LiDAR da Valónia'],
    'lu-orto': ['Photographies aériennes', 'Luchtfoto', 'Aerial photos', 'Ortofoto'], 'lu-cad': ['Cadastre', 'Kadaster', 'Cadastre', 'Cadastro'], 'lu-relevo': ['Relief LiDAR', 'Reliëf LiDAR', 'LiDAR relief', 'Relevo LiDAR']
  };
  function caixaCam(id, g) { return D.querySelector('#' + g + ' input[data-' + g + '="' + id + '"]'); }
  function camOn(id, g) { var c = caixaCam(id, g); return !!(c && c.checked); }
  function camLigar(id, g, on) {
    var c = caixaCam(id, g); if (!c) return false;
    if (c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); }
    return true;
  }

  // ---------- estado do país (aberto, a pedido, interesse) ----------
  var REG = null;
  function lerRegisto() {
    fetch('/wp-json/tcd/v1/eu/paises', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { REG = j || {}; pintar(); }).catch(function () {});
  }
  function estado(cc) { var e = REG && REG[cc] && REG[cc].estado; if (cc === 'FR' && !e) return 'aberto'; return e || 'interesse'; }
  function precoBase() {
    var P = W.IPR_PRECOS || {}, b = P.base, v = (b && (b.desde || b.preco || b.min)) || (typeof b === 'number' ? b : 0);
    v = +v || 99;
    return (Math.round(v * 100) / 100).toLocaleString(lg === 'nl' ? 'nl-NL' : lg === 'en' ? 'en-GB' : lg === 'pt' ? 'pt-PT' : 'fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  }

  // ---------- terreno desenhado ----------
  function desenho() {
    var m = mapa(), cs = (m && m._controls) || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === 'function') try { return cs[i].getAll(); } catch (e) {}
    return null;
  }
  function poligonos() { var a = desenho(); return a ? a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }) : []; }
  function areaHa() {
    var tot = 0, R = 6378137;
    poligonos().forEach(function (f) {
      var polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      polys.forEach(function (pl) { pl.forEach(function (ring, ri) { var s = 0; for (var i = 0; i < ring.length - 1; i++) { var a = ring[i], b = ring[i + 1]; s += (b[0] - a[0]) * Math.PI / 180 * (2 + Math.sin(a[1] * Math.PI / 180) + Math.sin(b[1] * Math.PI / 180)); } s = Math.abs(s * R * R / 2); tot += ri ? -s : s; }); });
    });
    return tot / 10000;
  }
  function ferramenta(t) { var b = D.querySelector('.ipe-tools [data-tool="' + t + '"]'); if (!b) return false; var e = ipe() && ipe().estado; if (e && e.tool === t) return true; b.click(); return true; }

  // ---------- estilo ----------
  var TOPO_H = 56, LARG = 340;
  function css() {
    if ($('ipr-tx-css')) return;
    var s = D.createElement('style'); s.id = 'ipr-tx-css';
    s.textContent =
      'html.ipr-topo .ipe-top,html.ipr-topo #ipe-esq,html.ipr-topo #ipe-dir,html.ipr-topo .ipe-tools,html.ipr-topo #ipe-st,html.ipr-topo #ipr-tri,html.ipr-topo #ipr-as-b,html.ipr-topo .ipe-tour,html.ipr-topo #ipr-lingueta,html.ipr-topo #ipr-pb-barra,html.ipr-topo .ipr-be-p,html.ipr-topo #ipr-cq,html.ipr-topo #ipr-cp-ct,html.ipr-topo .maplibregl-ctrl-top-left.ipr-nav,html.ipr-topo #tb-bar,html.ipr-topo #ipr-lgd,html.ipr-topo #ipr-ger-b,' +
      'html.ipr-topo [id^="ipr-exd-"],html.ipr-topo [id^="ipr-exm-"],html.ipr-topo .ipr-exd-ui,html.ipr-topo .ipr-exm-ui{display:none!important}' +
      'html.ipr-topo .ipe-mapa{position:fixed!important;top:' + TOPO_H + 'px!important;left:' + LARG + 'px!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;margin:0!important}' +
      'html.ipr-topo.ipr-topo-form #ipe-dir{display:flex!important;position:fixed!important;top:' + TOPO_H + 'px!important;right:0!important;bottom:0!important;left:auto!important;width:380px!important;max-width:100vw!important;height:auto!important;z-index:30}' +
      'html.ipr-topo.ipr-topo-form .ipe-mapa{right:380px!important}' +
      '.ipr-tx{--vn:#10170d;--p1:#161e13;--p2:#1f2a1a;--ln:#2e3a28;--tx:#eef0e6;--mu:#a7ae9b;--ac:#94BE39;font:14px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--tx);box-sizing:border-box;-webkit-font-smoothing:antialiased}' +
      '.ipr-tx .tp-wtop{display:none!important}.ipr-tx *{box-sizing:border-box}.ipr-tx button,.ipr-tx input,.ipr-tx select{font:inherit;color:inherit}' +
      '#ipr-tx-top{position:fixed;top:0;left:0;right:0;height:' + TOPO_H + 'px;z-index:99992;display:flex;align-items:center;gap:14px;padding:0 16px;background:var(--vn);border-bottom:1px solid var(--ln)}' +
      '#ipr-tx-top .m{font-weight:600;white-space:nowrap}#ipr-tx-top .m small{font-weight:400;color:var(--mu);margin-left:6px}' +
      '#ipr-tx-top .d{margin-left:auto;display:flex;gap:10px;align-items:center}#ipr-tx-top select{background:var(--p2);border:1px solid var(--ln);border-radius:6px;padding:5px 8px}' +
      '#ipr-tx-top a{color:var(--mu);text-decoration:underline;font-size:13px;white-space:nowrap}' +
      '#ipr-tx-esq{position:fixed;top:' + TOPO_H + 'px;left:0;bottom:0;width:' + LARG + 'px;z-index:99991;overflow:auto;background:var(--p1);border-right:1px solid var(--ln);padding:18px 18px 28px}' +
      '#ipr-tx-esq .k{margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ac)}' +
      '#ipr-tx-esq h1{margin:0 0 8px;font-size:21px;line-height:1.25;font-weight:600}#ipr-tx-esq p{margin:0 0 10px}#ipr-tx-esq .mu{color:var(--mu);font-size:13px}' +
      '#ipr-tx-esq h2{margin:18px 0 8px;font-size:14px;font-weight:600}' +
      '#ipr-tx-esq form{display:flex;gap:6px;position:relative}#ipr-tx-esq input[type=search]{flex:1;min-width:0;background:var(--p2);border:1px solid var(--ln);border-radius:6px;padding:8px 10px}' +
      '.ipr-tx .ac{background:var(--ac);color:#10170d!important;border:0;border-radius:6px;padding:9px 12px;font-weight:600;cursor:pointer}.ipr-tx .ac[disabled]{opacity:.45;cursor:not-allowed}' +
      '.ipr-tx .ol{background:transparent;border:1px solid var(--ln);border-radius:6px;padding:8px 10px;cursor:pointer}.ipr-tx .ol:hover{border-color:var(--ac)}' +
      '#ipr-tx-esq .lin{display:flex;gap:6px;flex-wrap:wrap}#ipr-tx-esq .lin .ol{flex:1}' +
      '#ipr-tx-res{list-style:none;margin:6px 0 0;padding:0;border:1px solid var(--ln);border-radius:6px;background:var(--p2);max-height:220px;overflow:auto}' +
      '#ipr-tx-res button{display:block;width:100%;text-align:left;background:none;border:0;padding:7px 10px;cursor:pointer}#ipr-tx-res button:hover{background:var(--ln)}#ipr-tx-res small{display:block;color:var(--mu);font-size:12px}' +
      '#ipr-tx-ter{background:var(--p2);border:1px solid var(--ln);border-radius:6px;padding:9px 10px;margin-top:8px;font-size:13px}#ipr-tx-ter b{color:var(--ac)}' +
      '#ipr-tx-ter button{margin-left:8px;background:none;border:0;color:var(--mu);text-decoration:underline;cursor:pointer;padding:0}' +
      '#ipr-tx-esq ul.inc{margin:0;padding-left:18px;color:var(--mu);font-size:13px}#ipr-tx-esq ul.inc li{margin:2px 0}' +
      '#ipr-tx-enc{width:100%;margin-top:4px}#ipr-tx-nota{margin-top:8px!important}' +
      '#ipr-tx-cam label{display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-size:13.5px}#ipr-tx-cam input{accent-color:#94BE39}' +
      '#ipr-tx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99995;background:var(--vn);border:1px solid var(--ln);border-radius:8px;padding:10px 14px;max-width:90vw}' +
      '#ipr-tx-voltar{display:none}html.ipr-topo-form #ipr-tx-voltar{display:inline-block}' +
      '@media (max-width:760px){html.ipr-topo .ipe-mapa{left:0!important;bottom:46vh!important}#ipr-tx-esq{top:auto;height:46vh;width:auto;right:0;border-right:0;border-top:1px solid var(--ln)}' +
      '#ipr-tx-top .m small{display:none}html.ipr-topo.ipr-topo-form #ipe-dir{width:100vw!important}html.ipr-topo.ipr-topo-form #ipr-tx-esq{display:none}html.ipr-topo.ipr-topo-form .ipe-mapa{right:0!important;bottom:0!important}}';
    (D.head || H).appendChild(s);
  }

  // ---------- peças ----------
  var CC = '', montado = false, relogio = null;
  function entrarLink() { var a = $('ipe-user') || $('ipe-entrar'); return a ? { href: a.getAttribute('href') || '/conta/', txt: (a.textContent || '').trim() } : null; }
  function topo() {
    var o = $('ipr-tx-top') || D.createElement('header'); o.id = 'ipr-tx-top'; o.className = 'ipr-tx';
    var en = entrarLink();
    o.innerHTML = '<span class="m">IPR Atlas · ' + esc(T('marca')) + '<small>Terracrua Design</small></span>' +
      '<div class="d"><button type="button" class="ol" id="ipr-tx-voltar" data-tp="voltar">' + esc(T('voltar')) + '</button>' +
      '<select id="ipr-tx-lg" aria-label="Langue / Taal / Language">' + ['fr', 'nl', 'en', 'pt'].map(function (l) { return '<option value="' + l + '"' + (l === lg ? ' selected' : '') + '>' + l.toUpperCase() + '</option>'; }).join('') + '</select>' +
      '<a href="?simples=0&topo=0" data-tp="completo">' + esc(T('completo')) + '</a>' +
      (en ? '<a href="' + esc(en.href) + '">' + esc(en.txt || 'Conta') + '</a>' : '') + '</div>';
    return o;
  }
  function blocoEncomenda() {
    var e = estado(CC), tem = poligonos().length > 0;
    var lbl = e === 'interesse' ? T('int') : T('enc');
    var nota = e === 'aberto' ? T('precoFR').replace('{p}', precoBase()) : e === 'a_pedido' ? T('pedidoT') : T('interT');
    return '<button type="button" class="ac" id="ipr-tx-enc" data-tp="encomendar"' + (tem ? '' : ' disabled') + '>' + esc(lbl) + '</button>' +
      '<p class="mu" id="ipr-tx-nota">' + esc(tem ? nota : T('precisa') + ' ' + nota) + '</p>';
  }
  function camadasHtml() {
    return (CAMS[CC] || []).map(function (c) {
      var n = NOMES_CAM[c[0]] ? NOMES_CAM[c[0]][IX[lg]] : c[0];
      return '<label><input type="checkbox" data-tpc="' + c[0] + '" data-tpg="' + c[1] + '"' + (camOn(c[0], c[1]) ? ' checked' : '') + '> ' + esc(n) + '</label>';
    }).join('');
  }
  function terrenoHtml() {
    var ps = poligonos();
    if (!ps.length) return '<span class="mu">' + esc(T('nenhum')) + '</span>';
    var ha = areaHa();
    return esc(T('area')) + '<b>' + ha.toLocaleString(lg === 'en' ? 'en-GB' : lg === 'nl' ? 'nl-NL' : lg === 'pt' ? 'pt-PT' : 'fr-FR', { maximumFractionDigits: ha < 10 ? 2 : 1 }) + ' ha</b><button type="button" data-tp="trocar">' + esc(T('trocar')) + '</button>';
  }
  function esquerda() {
    var o = $('ipr-tx-esq') || D.createElement('aside'); o.id = 'ipr-tx-esq'; o.className = 'ipr-tx';
    o.innerHTML = '<p class="k">' + esc(nomePais(CC)) + '</p><h1>' + esc(T('h1')) + '</h1><p class="mu">' + esc(T('sub')) + '</p>' +
      '<h2>' + esc(T('p1')) + '</h2><form role="search" id="ipr-tx-f"><input id="ipr-tx-q" type="search" autocomplete="off" placeholder="' + esc(T('ph')) + '"><button type="submit" class="ac">' + esc(T('proc')) + '</button></form>' +
      '<p class="mu" id="ipr-tx-err" hidden></p><ul id="ipr-tx-res" hidden></ul>' +
      '<h2>' + esc(T('p2')) + '</h2><div class="lin"><button type="button" class="ol" data-tp="desenhar">' + esc(T('des')) + '</button><button type="button" class="ol" data-tp="ficheiro">' + esc(T('fic')) + '</button></div>' +
      '<div id="ipr-tx-ter">' + terrenoHtml() + '</div>' +
      '<h2>' + esc(T('p3')) + '</h2><div id="ipr-tx-encb">' + blocoEncomenda() + '</div>' +
      '<h2>' + esc(T('inclui')) + '</h2><ul class="inc"><li>' + esc(T('i1')) + '</li><li>' + esc(T('i2')) + '</li><li>' + esc(T('i3')) + '</li></ul>' +
      '<h2>' + esc(T('cam')) + '</h2><div id="ipr-tx-cam">' + camadasHtml() + '</div><p class="mu" style="margin-top:8px;font-size:12px">' + esc(T('fontes')) + '</p>';
    return o;
  }
  function pintar() {
    if (!montado) return;
    var t = $('ipr-tx-ter'); if (t) { var h = terrenoHtml(); if (t.innerHTML !== h) t.innerHTML = h; }
    var b = $('ipr-tx-encb'); if (b) { var h2 = blocoEncomenda(); if (b.innerHTML !== h2) b.innerHTML = h2; }
    [].forEach.call(D.querySelectorAll('#ipr-tx-cam [data-tpc]'), function (c) { var on = camOn(c.getAttribute('data-tpc'), c.getAttribute('data-tpg')); if (c.checked !== on) c.checked = on; });
  }
  function toast(txt) {
    var o = $('ipr-tx-toast'); if (!o) { o = D.createElement('div'); o.id = 'ipr-tx-toast'; o.className = 'ipr-tx'; D.body.appendChild(o); }
    o.textContent = txt; o.hidden = false; clearTimeout(o._t); o._t = setTimeout(function () { o.hidden = true; }, 6000);
  }
  function redimensionar() { var m = mapa(); setTimeout(function () { try { if (m) m.resize(); } catch (e) {} }, 80); }

  // ---------- acções ----------
  function mostrarForm(on) { H.classList.toggle('ipr-topo-form', on); redimensionar(); if (on) gtag('topo_formulario', { pais: CC }); }
  function encomendar() {
    if (!poligonos().length) { toast(T('precisa')); return; }
    gtag('topo_encomendar', { pais: CC, estado: estado(CC) });
    mostrarForm(true); // o formulário da Base vive no painel da direita do Atlas (#ipe-dir)
    // fora de França ainda não se vende: o formulário regista o interesse (m90301); o assistente falaria de pagamento
    if (estado(CC) !== 'aberto') { toast(estado(CC) === 'a_pedido' ? T('pedidoT') : T('interT')); return; }
    // o assistente de compra calcula o preço do terreno desenhado e leva ao formulário
    try { if (typeof W.iprAssistenteComprar === 'function' && W.iprAssistenteComprar('base') !== false) return; } catch (e) {}
    try { if (typeof W.__iprAssistenteAbrir === 'function') W.__iprAssistenteAbrir('base'); } catch (e) {}
  }
  function trocar() {
    var m = mapa(), cs = (m && m._controls) || [];
    cs.forEach(function (c) { if (c && typeof c.deleteAll === 'function') try { c.deleteAll(); m.fire('draw.delete', { features: [] }); } catch (e) {} });
    mostrarForm(false); pintar();
  }
  function procurar(txt) {
    txt = String(txt || '').trim(); if (!txt) return;
    var err = $('ipr-tx-err'), lst = $('ipr-tx-res'); if (err) err.hidden = true;
    var cc = /^\s*-?\d{1,3}[.,]\d+\s*[,; ]\s*-?\d{1,3}[.,]\d+\s*$/.test(txt) ? null : txt;
    if (!cc) { var p = txt.replace(/,(\d)/g, '.$1').split(/[\s;,]+/).map(Number); var la = p[0], lo = p[1]; if (Math.abs(la) <= 90) { voar({ lat: la, lon: lo }); return; } }
    var cods = (CC ? CC.toLowerCase() : 'fr,be,nl,lu');
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=' + cods + '&accept-language=' + lg + '&q=' + encodeURIComponent(txt))
      .then(function (r) { return r.json(); })
      .then(function (a) {
        if (!a || !a.length) { if (err) { err.textContent = T('sem'); err.hidden = false; } if (lst) lst.hidden = true; return; }
        lst.innerHTML = a.map(function (r, i) { var p = String(r.display_name || '').split(', '); return '<li><button type="button" data-r="' + i + '"><b>' + esc(p[0]) + '</b><small>' + esc(p.slice(1, 4).join(', ')) + '</small></button></li>'; }).join('');
        lst.hidden = false;
        lst.onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; voar(a[+b.getAttribute('data-r')]); lst.hidden = true; };
      })
      .catch(function () { if (err) { err.textContent = T('erro'); err.hidden = false; } });
  }
  function voar(r) {
    var m = mapa(); if (!m) return; gtag('topo_procurar', { pais: CC });
    try {
      if (r.boundingbox) { var b = r.boundingbox.map(Number); m.fitBounds([[b[2], b[0]], [b[3], b[1]]], { padding: 40, maxZoom: 16, duration: 900 }); }
      else m.flyTo({ center: [+r.lon, +r.lat], zoom: 16, duration: 900 });
    } catch (e) {}
  }
  function cliques(e) {
    var b = e.target.closest && e.target.closest('[data-tp]'); if (!b || !b.closest('.ipr-tx')) return;
    var a = b.getAttribute('data-tp');
    if (a === 'desenhar') { e.preventDefault(); mostrarForm(false); ferramenta('desenhar'); toast(T('dica')); gtag('topo_desenhar', { pais: CC }); }
    else if (a === 'ficheiro') { e.preventDefault(); var i = $('ipe-file'); if (i) i.click(); else ferramenta('importar'); }
    else if (a === 'encomendar') { e.preventDefault(); encomendar(); }
    else if (a === 'trocar') { e.preventDefault(); trocar(); }
    else if (a === 'voltar') { e.preventDefault(); mostrarForm(false); }
    else if (a === 'completo') { try { localStorage.setItem('ipr_topo_off', '1'); } catch (x) {} }
  }
  function mudancas(e) {
    var c = e.target;
    if (c && c.id === 'ipr-tx-lg') { lg = c.value; try { localStorage.setItem('ipr_topo_lg', lg); } catch (x) {} reconstruir(); return; }
    if (c && c.hasAttribute && c.hasAttribute('data-tpc')) { if (!camLigar(c.getAttribute('data-tpc'), c.getAttribute('data-tpg'), c.checked)) c.checked = false; gtag('topo_camada', { id: c.getAttribute('data-tpc'), on: c.checked ? 1 : 0 }); }
  }
  function reconstruir() {
    if (!montado) return;
    D.body.appendChild(topo()); D.body.appendChild(esquerda());
    $('ipr-tx-f').addEventListener('submit', function (e) { e.preventDefault(); procurar($('ipr-tx-q').value); });
  }
  function ligarPadrao() {
    // primeira vez neste país: fotografia aérea e cadastro ligados, para se ver o terreno
    var k = 'ipr_topo_ini_' + CC; try { if (localStorage.getItem(k) === '1') return; localStorage.setItem(k, '1'); } catch (e) {}
    var cs = CAMS[CC] || [];
    var n = 0; (function tentar() {
      var ok = true; cs.forEach(function (c) { if (/orto|ortho|-cad|cadastro|be-cp/.test(c[0])) { if (!camLigar(c[0], c[1], true)) ok = false; } });
      if (!ok && ++n < 20) setTimeout(tentar, 600); else pintar();
    })();
  }
  function montar(cc) {
    CC = cc; lgPorPais(cc); css();
    H.classList.add('ipr-topo'); W.__iprTopo = cc; montado = true;
    reconstruir();
    D.addEventListener('click', cliques, true); D.addEventListener('change', mudancas, true);
    ligarPadrao(); redimensionar();
    if (!REG) lerRegisto();
    gtag('topo_entrada', { pais: cc });
    if (/[?&]modo=encomenda/.test(q) && poligonos().length) setTimeout(encomendar, 800);
  }
  function desmontar() {
    if (!montado) return; montado = false; CC = ''; W.__iprTopo = '';
    H.classList.remove('ipr-topo', 'ipr-topo-form');
    ['ipr-tx-top', 'ipr-tx-esq', 'ipr-tx-toast'].forEach(function (id) { var x = $(id); if (x) x.remove(); });
    D.removeEventListener('click', cliques, true); D.removeEventListener('change', mudancas, true);
    redimensionar();
  }
  function verificar() {
    if (intel() || equipa() || (($('ipe') || {}).classList || { contains: function () { return false; } }).contains('cli')) { desmontar(); return; }
    var cc = paisActual();
    if (!cc) { if (montado) desmontar(); return; }
    if (!montado) montar(cc);
    else if (cc !== CC) { CC = cc; lgPorPais(cc); reconstruir(); ligarPadrao(); }
    else pintar();
  }
  function arrancar(n) {
    var m = mapa();
    if (!D.body || !m || !$('ipe') || !(W.__tcdFrCamadas || W.__tcdEuCamadas)) { if (n < 120) setTimeout(function () { arrancar(n + 1); }, 400); return; }
    var CENTRO = { BE: [[4.6, 50.6], 7.3], NL: [[5.4, 52.2], 7], LU: [[6.1, 49.75], 9] }, mexeu = false;
    try { m.on('dragstart', function (e) { if (e && e.originalEvent) mexeu = true; }); m.on('wheel', function () { mexeu = true; }); } catch (e) {}
    if (pedido && CENTRO[pedido]) [0, 1500, 3500, 6000].forEach(function (t) { setTimeout(function () { if (!mexeu && paisActual() !== pedido) try { m.jumpTo({ center: CENTRO[pedido][0], zoom: CENTRO[pedido][1] }); } catch (e) {} }, t); });
    verificar();
    if (m.on) m.on('moveend', verificar);
    relogio = setInterval(function () { if (!D.hidden) verificar(); }, 1500);
  }
  arrancar(0);
})();
