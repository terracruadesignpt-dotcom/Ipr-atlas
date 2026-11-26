/* IPR Atlas · Topografia fora de Portugal (Nuno, 26/11/2026, 20h42).
   Para quem vem de França, Bélgica, Países Baixos e Luxemburgo (e, desde 26/11 23h15, Dinamarca, Suíça, Eslovénia, Eslováquia, Polónia, Estónia e Inglaterra): uma versão simplificada do Atlas, dedicada a vender
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
  var PAISES = ['FR', 'BE', 'NL', 'LU', 'DK', 'CH', 'SI', 'SK', 'PL', 'EE', 'GB'];  // 26/11, 23h15: mais sete países (Nuno)
  var pedido = (q.match(/[?&]pais=(fr|be|nl|lu|dk|ch|si|sk|pl|ee|gb)(&|$)/i) || [])[1];
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
  function lgPorPais(cc) { if (LG) return; if (cc === 'NL') lg = 'nl'; else if (cc === 'FR' || cc === 'LU') lg = 'fr'; else if (cc && cc !== 'BE') lg = 'en'; }
  var TX = {
    marca: ['Topographie', 'Topografie', 'Topography', 'Topografia'],
    pais: { FR: ['France', 'Frankrijk', 'France', 'França'], BE: ['Belgique', 'België', 'Belgium', 'Bélgica'], NL: ['Pays-Bas', 'Nederland', 'Netherlands', 'Países Baixos'], LU: ['Luxembourg', 'Luxemburg', 'Luxembourg', 'Luxemburgo'], DK: ['Danemark', 'Denemarken', 'Denmark', 'Dinamarca'], CH: ['Suisse', 'Zwitserland', 'Switzerland', 'Suíça'], SI: ['Slovénie', 'Slovenië', 'Slovenia', 'Eslovénia'], SK: ['Slovaquie', 'Slowakije', 'Slovakia', 'Eslováquia'], PL: ['Pologne', 'Polen', 'Poland', 'Polónia'], EE: ['Estonie', 'Estland', 'Estonia', 'Estónia'], GB: ['Angleterre', 'Engeland', 'England', 'Inglaterra'] },
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

  // ---------- tradução do assistente de compra e do formulário da Base (Nuno, 26/11, 21h24: «para cada língua tem tudo traduzido») ----------
  // Chaves em português (o Atlas fica em português por baixo); valores [fr, nl, en].
  var DIC = {
    'Base Cartográfica': ['Base Cartographique', 'Kaartbasis', 'Base Map'],
    'Produto': ['Produit', 'Product', 'Product'], 'Terreno': ['Terrain', 'Terrein', 'Land'], 'Preço': ['Prix', 'Prijs', 'Price'], 'Dados': ['Coordonnées', 'Gegevens', 'Details'],
    'À espera do terreno no mapa · tocar para abrir o assistente': ['En attente du terrain sur la carte · toucher pour ouvrir l’assistant', 'Wacht op het terrein op de kaart · tik om de assistent te openen', 'Waiting for the land on the map · tap to open the assistant'],
    'Os seus dados': ['Vos coordonnées', 'Uw gegevens', 'Your details'],
    'Preencha os seus dados no formulário de encomenda e carregue em «Enviar pedido». Com cobertura LiDAR total, paga logo a seguir; sem ela, confirmamos antes de qualquer pagamento.': [
      'Remplissez vos coordonnées dans le formulaire de commande et cliquez sur « Envoyer la demande ». Si le LiDAR couvre tout le terrain, vous payez aussitôt ; sinon, nous confirmons avant tout paiement.',
      'Vul uw gegevens in op het bestelformulier en klik op «Aanvraag versturen». Als de LiDAR het hele terrein dekt, betaalt u meteen; anders bevestigen we eerst, vóór elke betaling.',
      'Fill in your details in the order form and click “Send request”. If LiDAR covers the whole land, you pay straight away; if not, we confirm before any payment.'],
    'sem IVA': ['HT', 'excl. btw', 'excl. VAT'], 'com IVA': ['TTC', 'incl. btw', 'incl. VAT'],
    'Paga-se logo a seguir ao pedido: cartão, Multibanco, Apple Pay ou Google Pay.': ['Paiement juste après la demande : carte bancaire, Apple Pay ou Google Pay.', 'Betaling direct na de aanvraag: kaart, Apple Pay of Google Pay.', 'Payment right after the request: card, Apple Pay or Google Pay.'],
    'Ir para o formulário': ['Aller au formulaire', 'Naar het formulier', 'Go to the form'], 'Voltar': ['Retour', 'Terug', 'Back'],
    'Mover (duplo toque repõe)': ['Déplacer (double toucher pour replacer)', 'Verplaatsen (dubbel tikken zet terug)', 'Move (double tap resets)'],
    'Transparência': ['Transparence', 'Transparantie', 'Transparency'], 'Fechar': ['Fermer', 'Sluiten', 'Close'],
    'Que informação tem do terreno?': ['Quelles informations avez-vous sur le terrain ?', 'Welke informatie heeft u over het terrein?', 'What information do you have about the land?'],
    'Escolha a primeira que tiver. Quanto mais exacta, mais rápido.': ['Choisissez la première dont vous disposez. Plus elle est précise, plus c’est rapide.', 'Kies de eerste die u heeft. Hoe nauwkeuriger, hoe sneller.', 'Choose the first one you have. The more precise, the faster.'],
    'Sei a morada ou o nome do sítio': ['Je connais l’adresse ou le nom du lieu', 'Ik ken het adres of de naam van de plek', 'I know the address or place name'],
    'Rua, lugar, aldeia ou nome da quinta.': ['Rue, lieu-dit, village ou nom du domaine.', 'Straat, plaats, dorp of naam van de boerderij.', 'Street, locality, village or estate name.'],
    'Tenho o número do prédio': ['J’ai la référence cadastrale', 'Ik heb het perceelnummer', 'I have the parcel number'],
    'Referência cadastral (NIC), por exemplo AAA000742446. Está na caderneta ou no BUPi.': ['Référence cadastrale portugaise (NIC), par exemple AAA000742446.', 'Portugese kadastrale referentie (NIC), bijvoorbeeld AAA000742446.', 'Portuguese cadastral reference (NIC), e.g. AAA000742446.'],
    'Usar o terreno que já está no mapa': ['Utiliser le terrain déjà sur la carte', 'Het terrein gebruiken dat al op de kaart staat', 'Use the land already on the map'],
    'Recomendado': ['Recommandé', 'Aanbevolen', 'Recommended'],
    'Estou no terreno agora': ['Je suis sur le terrain', 'Ik ben nu op het terrein', 'I am on the land now'],
    'Usamos a localização do telemóvel.': ['Nous utilisons la position du téléphone.', 'We gebruiken de locatie van uw telefoon.', 'We use your phone’s location.'],
    'Tenho as coordenadas': ['J’ai les coordonnées', 'Ik heb de coördinaten', 'I have the coordinates'],
    'Latitude e longitude, ou PT-TM06.': ['Latitude et longitude.', 'Breedte- en lengtegraad.', 'Latitude and longitude.'],
    'Tenho um ficheiro do terreno': ['J’ai un fichier du terrain', 'Ik heb een bestand van het terrein', 'I have a file of the land'],
    'KML, KMZ, Shapefile, GeoJSON, GPX, DXF ou DWG.': ['KML, KMZ, Shapefile, GeoJSON, GPX, DXF ou DWG.', 'KML, KMZ, Shapefile, GeoJSON, GPX, DXF of DWG.', 'KML, KMZ, Shapefile, GeoJSON, GPX, DXF or DWG.'],
    'Consigo mostrar no mapa': ['Je peux l’indiquer sur la carte', 'Ik kan het op de kaart aanwijzen', 'I can show it on the map'],
    'Clicar nas parcelas do cadastro ou desenhar o limite.': ['Cliquer sur les parcelles du cadastre ou dessiner la limite.', 'Op de kadastrale percelen klikken of de grens tekenen.', 'Click the cadastral parcels or draw the boundary.'],
    'Não tenho nada disto': ['Je n’ai rien de tout cela', 'Ik heb niets hiervan', 'I have none of these'],
    'Diga-nos o concelho e a freguesia: nós encontramos o terreno.': ['Indiquez-nous la commune : nous trouvons le terrain.', 'Geef ons de gemeente: wij vinden het terrein.', 'Tell us the municipality: we will find the land.'],
    'Olá! O que precisa para o seu terreno?': ['Bonjour ! De quoi avez-vous besoin pour votre terrain ?', 'Hallo! Wat heeft u nodig voor uw terrein?', 'Hello! What do you need for your land?'],
    'Responda a umas perguntas rápidas. Não precisa de saber usar o mapa.': ['Répondez à quelques questions rapides. Pas besoin de savoir utiliser la carte.', 'Beantwoord een paar korte vragen. U hoeft de kaart niet te kunnen gebruiken.', 'Answer a few quick questions. No need to know how to use the map.'],
    'Sem conta': ['Sans compte', 'Zonder account', 'No account'],
    'O relevo do terreno em mapas e ficheiros (LiDAR da DGT): curvas de nível, declives, linhas de água, modelo 3D.': ['Le relief du terrain en cartes et fichiers (LiDAR officiel) : courbes de niveau, pentes, lignes d’eau, modèle 3D.', 'Het reliëf van het terrein in kaarten en bestanden (officiële LiDAR): hoogtelijnen, hellingen, waterlijnen, 3D-model.', 'The relief of the land as maps and files (official LiDAR): contour lines, slopes, water lines, 3D model.'],
    'Não sei bem o que preciso': ['Je ne sais pas trop ce qu’il me faut', 'Ik weet niet goed wat ik nodig heb', 'I am not sure what I need'],
    'Ajudamos a escolher em 10 segundos.': ['Nous vous aidons à choisir en 10 secondes.', 'We helpen u kiezen in 10 seconden.', 'We help you choose in 10 seconds.'],
    'Só quero explorar o mapa': ['Je veux juste explorer la carte', 'Ik wil alleen de kaart verkennen', 'I just want to explore the map'],
    'Encontrámos o terreno': ['Nous avons trouvé le terrain', 'We hebben het terrein gevonden', 'We found the land'],
    'Confira no mapa. Está certo?': ['Vérifiez sur la carte. Est-ce bien cela ?', 'Controleer op de kaart. Klopt het?', 'Check it on the map. Is it right?'],
    'Terreno no mapa': ['Terrain sur la carte', 'Terrein op de kaart', 'Land on the map'],
    'Sim, é este': ['Oui, c’est celui-ci', 'Ja, dit is het', 'Yes, this is it'],
    'Continuar para o preço.': ['Continuer vers le prix.', 'Verder naar de prijs.', 'Continue to the price.'],
    'Falta uma parte ou não é bem este': ['Il manque une partie ou ce n’est pas tout à fait cela', 'Er ontbreekt een deel of het klopt niet helemaal', 'A part is missing or it is not quite right'],
    'Corrigir no mapa: juntar ou retirar parcelas.': ['Corriger sur la carte : ajouter ou retirer des parties.', 'Corrigeren op de kaart: delen toevoegen of verwijderen.', 'Correct it on the map: add or remove parts.'],
    'Enganei-me: começar de novo': ['Je me suis trompé : recommencer', 'Vergist: opnieuw beginnen', 'My mistake: start again'],
    'Limpa o terreno marcado e volta ao mapa.': ['Efface le terrain indiqué et revient à la carte.', 'Wist het aangeduide terrein en gaat terug naar de kaart.', 'Clears the marked land and goes back to the map.'],
    'Cobertura': ['Couverture', 'Dekking', 'Coverage'], 'Enviar': ['Envoyer', 'Versturen', 'Send'],
    'Falta preencher nome, e-mail e aceitar a política de privacidade.': ['Il manque le nom, l’e-mail et l’acceptation de la politique de confidentialité.', 'Naam, e-mail en het aanvaarden van het privacybeleid ontbreken nog.', 'Name, e-mail and accepting the privacy policy are still missing.'],
    'Ir para os dados': ['Aller aux coordonnées', 'Naar de gegevens', 'Go to details'],
    'Parcelas do cadastro': ['Parcelles du cadastre', 'Kadastrale percelen', 'Cadastral parcels'],
    'Desenhar no mapa': ['Dessiner sur la carte', 'Tekenen op de kaart', 'Draw on the map'],
    'Carregar ficheiro': ['Importer un fichier', 'Bestand laden', 'Upload a file'],
    'Usar um dos meus locais': ['Utiliser un de mes lieux', 'Een van mijn locaties gebruiken', 'Use one of my places'],
    'Aproxime-se do terreno e clique em cada parcela; clique de novo para a retirar. Onde não houver cadastro geométrico, desenhe o limite.': ['Zoomez sur le terrain et cliquez sur chaque parcelle ; cliquez à nouveau pour la retirer. Là où il n’y a pas de cadastre, dessinez la limite.', 'Zoom in op het terrein en klik op elk perceel; klik opnieuw om het te verwijderen. Waar geen kadaster is, tekent u de grens.', 'Zoom in on the land and click each parcel; click again to remove it. Where there is no cadastre, draw the boundary.'],
    'Localizar': ['Localiser', 'Zoeken', 'Locate'],
    'Clique em cada canto do terreno. Feche no primeiro ponto ou com duplo clique. Pode desenhar várias parcelas.': ['Cliquez sur chaque angle du terrain. Fermez sur le premier point ou par un double-clic. Vous pouvez dessiner plusieurs parcelles.', 'Klik op elke hoek van het terrein. Sluit af op het eerste punt of met een dubbelklik. U kunt meerdere percelen tekenen.', 'Click each corner of the land. Close on the first point or with a double click. You can draw several parcels.'],
    'Desenhar parcela': ['Dessiner une parcelle', 'Perceel tekenen', 'Draw a parcel'],
    'KML, KMZ, GeoJSON, GPX ou Shapefile em .zip aparecem no mapa. GeoPackage e Shapefile (.zip ou os ficheiros .shp, .dbf, .shx e .prj juntos) também aparecem no mapa. DXF e DWG seguem em anexo. Até 50 MB. Também pode largar o ficheiro sobre o mapa.': [
      'KML, KMZ, GeoJSON, GPX ou Shapefile en .zip s’affichent sur la carte. GeoPackage et Shapefile (.zip ou les fichiers .shp, .dbf, .shx et .prj ensemble) aussi. DXF et DWG sont joints en annexe. Jusqu’à 50 Mo. Vous pouvez aussi déposer le fichier sur la carte.',
      'KML, KMZ, GeoJSON, GPX of Shapefile in .zip verschijnen op de kaart. GeoPackage en Shapefile (.zip of de bestanden .shp, .dbf, .shx en .prj samen) ook. DXF en DWG gaan als bijlage mee. Tot 50 MB. U kunt het bestand ook op de kaart neerzetten.',
      'KML, KMZ, GeoJSON, GPX or zipped Shapefile appear on the map. GeoPackage and Shapefile (.zip or the .shp, .dbf, .shx and .prj files together) too. DXF and DWG are sent as attachments. Up to 50 MB. You can also drop the file on the map.'],
    'Escolher ficheiro': ['Choisir un fichier', 'Bestand kiezen', 'Choose file'],
    'Terrenos no mapa': ['Terrains sur la carte', 'Terreinen op de kaart', 'Land on the map'],
    'Editar pontos': ['Modifier les points', 'Punten bewerken', 'Edit points'], 'Apagar': ['Supprimer', 'Verwijderen', 'Delete'],
    'Limpar terreno': ['Effacer le terrain', 'Terrein wissen', 'Clear land'], 'Guardar terreno': ['Enregistrer le terrain', 'Terrein bewaren', 'Save land'],
    'Estimativa': ['Estimation', 'Schatting', 'Estimate'], 'Área': ['Surface', 'Oppervlakte', 'Area'],
    'Não foi possível verificar a cobertura agora. Tente de novo dentro de momentos.': ['Impossible de vérifier la couverture pour l’instant. Réessayez dans quelques instants.', 'De dekking kon nu niet worden gecontroleerd. Probeer het zo opnieuw.', 'Coverage could not be checked right now. Try again in a moment.'],
    'Encomendar a Base Cartográfica': ['Commander la Base Cartographique', 'De kaartbasis bestellen', 'Order the Base Map'],
    'Valores sem IVA, por escalões.': ['Montants HT, par tranches.', 'Bedragen excl. btw, per schijf.', 'Amounts excl. VAT, by tier.'],
    'Com cobertura LiDAR total': ['Si le LiDAR couvre tout le terrain', 'Als de LiDAR het hele terrein dekt', 'With full LiDAR coverage'],
    ', a ligação de pagamento aparece logo a seguir ao pedido. Sem ela, confirmamos os dados e enviamos o preço por e-mail.': [', le lien de paiement apparaît juste après la demande. Sinon, nous vérifions les données et vous envoyons le prix par e-mail.', ', verschijnt de betaallink direct na de aanvraag. Anders controleren we de gegevens en sturen we u de prijs per e-mail.', ', the payment link appears right after the request. Otherwise we check the data and e-mail you the price.'],
    'Acima de 5 000 ha, sob consulta. Máximo de 10 000 ha por pedido.': ['Au-delà de 5 000 ha, sur devis. Maximum 10 000 ha par demande.', 'Boven 5 000 ha op aanvraag. Maximaal 10 000 ha per aanvraag.', 'Above 5,000 ha, on request. Maximum 10,000 ha per request.'],
    'Nome *': ['Nom *', 'Naam *', 'Name *'], 'Telefone': ['Téléphone', 'Telefoon', 'Phone'], 'NIF': ['N° de TVA', 'Btw-nummer', 'VAT number'],
    'País de facturação': ['Pays de facturation', 'Factuurland', 'Billing country'],
    'Espanha': ['Espagne', 'Spanje', 'Spain'], 'França': ['France', 'Frankrijk', 'France'], 'Países Baixos': ['Pays-Bas', 'Nederland', 'Netherlands'],
    'Alemanha': ['Allemagne', 'Duitsland', 'Germany'], 'Reino Unido': ['Royaume-Uni', 'Verenigd Koninkrijk', 'United Kingdom'], 'Brasil': ['Brésil', 'Brazilië', 'Brazil'],
    'Estados Unidos': ['États-Unis', 'Verenigde Staten', 'United States'], 'Outro': ['Autre', 'Ander', 'Other'], 'Bélgica': ['Belgique', 'België', 'Belgium'], 'Luxemburgo': ['Luxembourg', 'Luxemburg', 'Luxembourg'], 'Dinamarca': ['Danemark', 'Denemarken', 'Denmark'], 'Suíça': ['Suisse', 'Zwitserland', 'Switzerland'], 'Eslovénia': ['Slovénie', 'Slovenië', 'Slovenia'], 'Eslováquia': ['Slovaquie', 'Slowakije', 'Slovakia'], 'Polónia': ['Pologne', 'Polen', 'Poland'], 'Estónia': ['Estonie', 'Estland', 'Estonia'], 'Reino Unido': ['Royaume-Uni', 'Verenigd Koninkrijk', 'United Kingdom'],
    'Notas': ['Notes', 'Opmerkingen', 'Notes'], 'Vale de oferta (opcional)': ['Bon cadeau (facultatif)', 'Cadeaubon (optioneel)', 'Gift voucher (optional)'],
    'O código OFERTA-… que recebeu. Sem o código, reconhecemos o vale pelo seu nome.': ['Le code OFERTA-… que vous avez reçu. Sans code, nous reconnaissons le bon à votre nom.', 'De code OFERTA-… die u ontving. Zonder code herkennen we de bon aan uw naam.', 'The OFERTA-… code you received. Without it, we recognise the voucher by your name.'],
    'Li a': ['J’ai lu la', 'Ik heb het', 'I have read the'], 'Política de Privacidade': ['politique de confidentialité', 'privacybeleid', 'Privacy Policy'],
    'e aceito que usem estes dados para responder ao pedido. *': ['et j’accepte que ces données servent à répondre à la demande. *', 'gelezen en ga akkoord dat deze gegevens dienen om op de aanvraag te antwoorden. *', 'and agree that this data is used to answer the request. *'],
    'Enviar pedido': ['Envoyer la demande', 'Aanvraag versturen', 'Send request'],
    'Com cobertura LiDAR total, paga logo a seguir ao pedido e a Base é processada e entregue automaticamente na sua área de cliente assim que o processamento termina (de minutos a algumas horas, conforme a área). Sem cobertura total, confirmamos os dados antes de qualquer pagamento.': [
      'Si le LiDAR couvre tout le terrain, vous payez juste après la demande ; la Base est traitée puis livrée automatiquement dans votre espace client (de quelques minutes à quelques heures selon la surface). Sinon, nous vérifions les données avant tout paiement.',
      'Als de LiDAR het hele terrein dekt, betaalt u direct na de aanvraag; de kaartbasis wordt verwerkt en automatisch geleverd in uw klantenzone (van enkele minuten tot enkele uren, afhankelijk van de oppervlakte). Anders controleren we de gegevens vóór elke betaling.',
      'With full LiDAR coverage, you pay right after the request; the Base is processed and delivered automatically to your client area (from minutes to a few hours, depending on the area). Otherwise we check the data before any payment.'],
    'Forma de indicar o terreno': ['Comment indiquer le terrain', 'Manier om het terrein aan te duiden', 'How to mark the land'],
    'Escolha uma área guardada em «Os meus locais» para terreno desta encomenda.': ['Choisissez une zone enregistrée dans « Mes lieux » comme terrain de cette commande.', 'Kies een bewaarde zone uit «Mijn locaties» als terrein voor deze bestelling.', 'Choose an area saved in “My places” as the land for this order.'],
    'Guardar este limite nos seus terrenos': ['Enregistrer cette limite dans vos terrains', 'Deze grens bewaren bij uw terreinen', 'Save this boundary to your land'],
    'O que pretende fazer no terreno.': ['Ce que vous souhaitez faire sur le terrain.', 'Wat u met het terrein van plan bent.', 'What you intend to do with the land.'],
    'Nome do projecto': ['Nom du projet', 'Projectnaam', 'Project name'],
    'Tudo pronto. Reveja a estimativa e envie o pedido.': ['Tout est prêt. Vérifiez l’estimation et envoyez la demande.', 'Alles klaar. Controleer de schatting en verstuur de aanvraag.', 'All set. Review the estimate and send the request.']
  };
  var DIC_RE = [
    [/^Passo (\d+) de (\d+)$/, ['Étape $1 sur $2', 'Stap $1 van $2', 'Step $1 of $2']],
    [/^Outras formas \((\d+)\)$/, ['Autres façons ($1)', 'Andere manieren ($1)', 'Other ways ($1)']],
    [/^Terreno (\d+)$/, ['Terrain $1', 'Terrein $1', 'Land $1']],
    [/^Área (.+)$/, ['Surface $1', 'Oppervlakte $1', 'Area $1']],
    [/^(\d+) Terreno$/, ['$1 Terrain', '$1 Terrein', '$1 Land']]
  ];
  var DIC_PRECO = [[/€ \+ IVA/g, ['€ HT', '€ excl. btw', '€ excl. VAT']], [/€ com IVA/g, ['€ TTC', '€ incl. btw', '€ incl. VAT']], [/^desde /, ['à partir de ', 'vanaf ', 'from ']]];
  // o que só serve em Portugal sai do ecrã (artigo matricial, NIC, ficha gratuita, Planta e Leitura)
  var ESCONDER = ['Artigo matricial ou caderneta', 'Conversor NIC ⇄ artigo e secção', 'Ver a ficha gratuita da propriedade', 'Tenho a caderneta ou o artigo matricial', 'Planta de Localização', 'Leitura Territorial', 'Tenho o número do prédio', 'Ficha gratuita da propriedade'];
  var ORIG = typeof WeakMap === 'function' ? new WeakMap() : null;
  function trad(pt, l) {
    var k = IX[l || lg]; if ((l || lg) === 'pt' || k == null) return pt;
    var v = DIC[pt]; if (v) return v[k];
    var s = pt, mud = false;
    for (var i = 0; i < DIC_RE.length; i++) if (DIC_RE[i][0].test(s)) { s = s.replace(DIC_RE[i][0], DIC_RE[i][1][k]); mud = true; break; }
    for (var j = 0; j < DIC_PRECO.length; j++) if (DIC_PRECO[j][0].test(s)) { s = s.replace(DIC_PRECO[j][0], DIC_PRECO[j][1][k]); mud = true; }
    return mud ? s : pt;
  }
  function eVersao(t, pt) { // t é o português original ou uma das suas traduções (para poder mudar de língua)
    if (t === pt) return true;
    for (var l in IX) if (l !== 'pt' && trad(pt, l).trim() === t) return true;
    return false;
  }
  function esconder(n, pt) {
    if (ESCONDER.indexOf(pt) < 0 || lg === 'pt') return;
    var e = n.parentElement && n.parentElement.closest('button,summary,[role=button],label'); if (!e) e = n.parentElement;
    if (e && !e.hasAttribute('data-tx-esc')) { e.setAttribute('data-tx-esc', '1'); e.style.display = 'none'; }
  }
  function traduzirEm(root) {
    if (!root || !ORIG) return;
    var w = D.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var cur = n.nodeValue, t = cur.trim(); if (!t || !/[A-Za-zÀ-ú]/.test(t)) continue;
      var pt = ORIG.get(n);
      if (pt == null || !eVersao(t, pt)) { pt = t; ORIG.set(n, pt); } // texto novo escrito pelo Atlas
      var alvo = trad(pt);
      if (cur.trim() !== alvo) n.nodeValue = cur.replace(cur.trim(), alvo);
      esconder(n, pt);
    }
    [].forEach.call(root.querySelectorAll('[placeholder],[title],[aria-label]'), function (e) {
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var v = e.getAttribute(a); if (!v) return;
        var ka = 'data-tx-' + a, pt = e.getAttribute(ka);
        if (pt == null || !eVersao(v, pt)) { pt = v; e.setAttribute(ka, pt); }
        var al = trad(pt); if (v !== al) e.setAttribute(a, al);
      });
    });
    if (lg === 'pt') [].forEach.call(root.querySelectorAll('[data-tx-esc]'), function (e) { e.removeAttribute('data-tx-esc'); e.style.display = ''; });
  }
  var txUlt = 0, txPend = 0;
  function traduzir() {
    var ag = Date.now(); if (ag - txUlt < 250) { if (!txPend) txPend = setTimeout(function () { txPend = 0; traduzir(); }, 260); return; }
    txUlt = ag;
    if (!montado) return;
    RAIZES.forEach(function (id) { traduzirEm($(id)); });
  }
  var RAIZES = ['ipr-as-pn', 'ipr-as-b', 'ipe-form'];
  function naRaiz(n) { var e = n && (n.nodeType === 1 ? n : n.parentElement); return !!(e && e.closest && e.closest('#ipr-as-pn,#ipr-as-b,#ipe-form')); }
  var obsTx = null;
  function vigiarTx() {
    if (obsTx || typeof MutationObserver !== 'function') return;
    obsTx = new MutationObserver(function (rs) {
      if (!montado || lg === 'pt') return;
      for (var i = 0; i < rs.length; i++) if (naRaiz(rs[i].target) || (rs[i].addedNodes[0] && (naRaiz(rs[i].addedNodes[0]) || (rs[i].addedNodes[0].id || '').indexOf('ipr-as') === 0))) { traduzir(); return; }
    });
    obsTx.observe(D.body, { subtree: true, childList: true, characterData: true });
  }
  function cookieLingua() { try { D.cookie = 'tcd_lingua=' + lg + ';path=/;max-age=31536000;SameSite=Lax'; } catch (e) {} }
  function atlasEmPt() { // as chaves são portuguesas: com o Atlas em inglês e a página em fr/nl, volta-se ao português por baixo
    if (lg !== 'fr' && lg !== 'nl') return;
    if (String(W.IPR_LINGUA || '').toLowerCase() === 'en') { var b = D.querySelector('.ipe-top [data-lg="pt"]'); if (b) try { b.click(); } catch (e) {} }
  }

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
    if (c && c.id === 'ipr-tx-lg') { lg = c.value; try { localStorage.setItem('ipr_topo_lg', lg); } catch (x) {} cookieLingua(); atlasEmPt(); reconstruir(); txUlt = 0; traduzir(); return; }
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
    cookieLingua(); atlasEmPt(); vigiarTx(); traduzir();
    if (!REG) lerRegisto();
    gtag('topo_entrada', { pais: cc });
    if (/[?&]modo=encomenda/.test(q) && poligonos().length) setTimeout(encomendar, 800);
  }
  function desmontar() {
    if (!montado) return; montado = false; CC = ''; W.__iprTopo = '';
    var l0 = lg; lg = 'pt'; try { RAIZES.forEach(function (id) { traduzirEm($(id)); }); } catch (e) {} lg = l0;
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
    else if (cc !== CC) { CC = cc; lgPorPais(cc); reconstruir(); ligarPadrao(); cookieLingua(); traduzir(); }
    else pintar();
  }
  function arrancar(n) {
    var m = mapa();
    if (!D.body || !m || !$('ipe') || !(W.__tcdFrCamadas || W.__tcdEuCamadas)) { if (n < 120) setTimeout(function () { arrancar(n + 1); }, 400); return; }
    var CENTRO = { BE: [[4.6, 50.6], 7.3], NL: [[5.4, 52.2], 7], LU: [[6.1, 49.75], 9], DK: [[10.0, 56.0], 6.3], CH: [[8.2, 46.8], 7], SI: [[14.9, 46.1], 7.5], SK: [[19.5, 48.7], 6.8], PL: [[19.4, 52.0], 5.6], EE: [[25.5, 58.7], 6.5], GB: [[-1.6, 52.6], 6] }, mexeu = false;
    try { m.on('dragstart', function (e) { if (e && e.originalEvent) mexeu = true; }); m.on('wheel', function () { mexeu = true; }); } catch (e) {}
    if (pedido && CENTRO[pedido]) [0, 1500, 3500, 6000].forEach(function (t) { setTimeout(function () { if (!mexeu && paisActual() !== pedido) try { m.jumpTo({ center: CENTRO[pedido][0], zoom: CENTRO[pedido][1] }); } catch (e) {} }, t); });
    verificar();
    if (m.on) m.on('moveend', verificar);
    relogio = setInterval(function () { if (!D.hidden) verificar(); }, 1500);
  }
  arrancar(0);
})();
