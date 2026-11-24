/* IPR Atlas · funil directo (Nuno, 11/11/2026, 02h55: «quem pesquisa um terreno vai directo ao terreno e ao preço»).
 * Antes: pesquisa → «Por onde começar?» → «Preciso de uma planta» → o assistente voltava a perguntar onde fica o terreno
 * (7 opções), e o local já pesquisado perdia-se.
 * Agora, no modo simples (explorer-movel): «Preciso de uma planta» e «Quero planear» guardam o produto e põem a pessoa a
 * tocar na parcela, no sítio que já pesquisou; quando o terreno fica escolhido, abre-se logo o preço desse produto
 * (iprAssistenteComprar salta para o preço quando já há terreno).
 * Não altera nenhum ficheiro do Atlas. Desligar: window.IPR_FUNIL_DIRECTO_OFF = true, ou tirar este ficheiro do atlas.json.
 */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.IPR_FUNIL_DIRECTO_OFF || W.__iprFunilDirecto) return;
  W.__iprFunilDirecto = true;

  var CHAVE = 'ipr_fd_produto', MAP = { planta: 'planta', planear: 'base' };
  function pt() { return String(W.IPR_LINGUA || D.documentElement.lang || 'pt').toLowerCase().indexOf('en') !== 0; }
  function guardar(p) { try { if (p) sessionStorage.setItem(CHAVE, p); else sessionStorage.removeItem(CHAVE); } catch (e) {} W.__iprFdProduto = p || ''; }
  function lido() { var p = W.__iprFdProduto || ''; try { p = sessionStorage.getItem(CHAVE) || p; } catch (e) {} return p; }
  function sd(alvo) { // regista no «Sentido» como clique de compra (passa o filtro da borda)
    try { var b = D.createElement('span'); b.setAttribute('data-sd', alvo); b.hidden = true; D.body.appendChild(b); b.click(); b.remove(); } catch (e) {}
  }
  function aviso(txt) {
    var o = D.getElementById('ipr-fd-aviso');
    if (!o) {
      o = D.createElement('div'); o.id = 'ipr-fd-aviso'; o.setAttribute('role', 'status');
      o.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 64px);z-index:100000;max-width:min(92vw,420px);background:#1f2a1c;color:#f3f1e8;border:1px solid #6f8a3c;border-radius:12px;padding:10px 14px;font:500 14px/1.4 Inter,Helvetica,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
      D.body.appendChild(o);
    }
    o.textContent = txt; o.hidden = false;
    clearTimeout(o._t); o._t = setTimeout(function () { o.hidden = true; }, veioVisita ? 20000 : 9000);
  }
  function temTerreno() { return !!D.querySelector('#ipr-exm-ter [data-x="comprar"]'); }

  // 1. Escolha do perfil: com intenção de compra, primeiro o terreno (no sítio já pesquisado), depois o preço.
  // Na janela (window), em captura: corre antes do clique do explorer-movel, que está no documento.
  W.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#ipr-exm-pf [data-pf]');
    if (!b) return;
    if (W.__iprFdInterno) return;
    var pf = b.getAttribute('data-pf'), prod = MAP[pf];
    if (!prod) { guardar(''); return; }
    sd('encomendar:perfil-' + prod);
    if (temTerreno() && typeof W.iprAssistenteComprar === 'function') { guardar(''); return; } // já há terreno: segue o caminho normal
    var c = D.querySelector('#ipr-exm-pf [data-pf="conhecer"]');
    if (!c) return; // sem o botão de parcelas, deixa o comportamento antigo
    if (!D.querySelector('.maplibregl-canvas')) return; // sem mapa (WebGL desligado): fica o pedido sem mapa, como antes
    e.preventDefault(); e.stopImmediatePropagation();
    guardar(prod);
    W.__iprFdInterno = true; try { c.click(); } finally { W.__iprFdInterno = false; } // liga o cadastro e o modo de parcelas, fecha «Por onde começar?»
    setTimeout(function () {
      aviso(pt() ? (prod === 'planta' ? 'Toque na parcela do seu terreno. A seguir mostramos o preço da Planta de Localização.' : 'Toque na parcela do seu terreno. A seguir mostramos o preço da Base Cartográfica.')
                 : (prod === 'planta' ? 'Tap your parcel. Next we show the price of the Location plan.' : 'Tap your parcel. Next we show the price of the Base map.'));
    }, 350);
  }, true);

  // 2. Terreno escolhido com intenção de compra guardada: abre o preço desse produto.
  var aberto = false;
  setInterval(function () {
    var p = lido(); if (!p) { aberto = false; return; }
    if (!temTerreno()) { aberto = false; return; }
    if (aberto || typeof W.iprAssistenteComprar !== 'function') return;
    aberto = true;
    var a = D.getElementById('ipr-fd-aviso'); if (a) a.hidden = true;
    sd('encomendar:preco-' + p);
    try { W.iprAssistenteComprar(p); } catch (e) {}
    guardar('');
  }, 600);

  // 3. Quem chega por uma ficha partilhada (?f= ou ?ficha=) vê o terreno e a ficha, não a entrada com a pesquisa.
  //    O inicio.js e o explorer-pc.js não conheciam o «ficha=» que o m91740 põe no endereço antes do Atlas arrancar.
  // 3b. «Pedir visita técnica» (/servicos/diagnostico-visita-tecnica/, 3.ª página mais vista: 160 vistas de 4 a 11/11) abre
  //     /atlas/?visita=1. O app.js liga a ferramenta da visita, mas a entrada «O seu terreno, num mapa» ficava por cima e a
  //     pessoa via Planta, Leitura e Base, sem nada sobre a visita (teste de 11/11, 11h20). Agora a entrada sai e fica a
  //     instrução; tocar no mapa mostra o preço da visita com a deslocação (funil-atlas.js).
  var veioVisita = /[?&]visita=1(&|$)/.test(location.search);
  if (veioVisita) {
    try { sessionStorage.setItem('ipr_exd_bv', '1'); sessionStorage.setItem('ipr_exm_bv', '1'); } catch (e) {}
    var fimV = Date.now() + 20000, avisou = false;
    var tapaV = setInterval(function () {
      ['ipr-ini', 'ipr-exd-bv', 'ipr-exm-bv', 'ipr-exm-pf'].forEach(function (id) {
        var o = D.getElementById(id); if (!o) return;
        if (id === 'ipr-ini') { o.remove(); } else { o.hidden = true; }
      });
      if (!avisou && D.querySelector('.maplibregl-canvas')) {
        avisou = true; sd('encomendar:visita-entrada');
        aviso(pt() ? 'Visita técnica: procure o terreno na barra de cima ou aproxime o mapa, e toque no sítio da visita. Mostramos logo o preço, com a deslocação.'
                   : 'Technical visit: search for the land at the top or zoom in, then tap the spot. We show the price at once, travel included.');
      }
      if (Date.now() > fimV) clearInterval(tapaV);
    }, 250);
  }
  if (/[?&](f|ficha)=/.test(location.search)) {
    try { sessionStorage.setItem('ipr_exd_bv', '1'); sessionStorage.setItem('ipr_exm_bv', '1'); } catch (e) {}
    var fim = Date.now() + 20000;
    var tapa = setInterval(function () {
      ['ipr-ini', 'ipr-exd-bv', 'ipr-exm-bv', 'ipr-exm-pf'].forEach(function (id) {
        var o = D.getElementById(id); if (!o) return;
        if (id === 'ipr-ini') { o.remove(); } else { o.hidden = true; }
      });
      if (Date.now() > fim) clearInterval(tapa);
    }, 250);
  }

  // 5. Duas entradas empilhadas (11/11, 09h20): no Explorer (telemóvel e computador) o inicio.js abria o seu ecrã por cima
  //    da entrada do explorer-movel / explorer-pc. A pessoa escrevia o terreno no primeiro, carregava em Procurar, o primeiro
  //    fechava e aparecia o segundo, igual e com a pesquisa vazia: parecia que a pesquisa tinha falhado. No Explorer fica só a
  //    entrada do explorer-*; a do inicio.js continua para quem não é Explorer.
  function explorer() { var c = D.documentElement.classList; return c.contains('ipr-exm') || c.contains('ipr-exd'); }
  var fimIni = Date.now() + 30000;
  var tiraIni = setInterval(function () {
    if (explorer()) { var o = D.getElementById('ipr-ini'); if (o) { o.remove(); D.documentElement.classList.remove('ipr-ini-on'); } }
    if (Date.now() > fimIni) clearInterval(tiraIni);
  }, 200);

  // 6. Os cartões dos documentos na entrada do telemóvel (Ficha, Planta, Leitura, Base) eram só texto: tocar não fazia nada.
  //    Agora tocar num cartão fecha a entrada, liga as parcelas do cadastro e, escolhido o terreno, abre o preço desse documento.
  var CART = ['ficha', 'planta', 'leitura', 'base'];
  function cartoes() {
    var bv = D.getElementById('ipr-exm-bv'); if (!bv || bv.__fd) return; bv.__fd = 1;
    var lis = [].slice.call(bv.querySelectorAll('li')).filter(function (l) { return l.querySelector('h2'); });
    lis.forEach(function (l, i) {
      var k = CART[i]; if (!k) return;
      l.setAttribute('data-fd-cartao', k); l.setAttribute('role', 'button'); l.tabIndex = 0;
      l.setAttribute('data-sd', k === 'ficha' ? 'ficha:entrada' : 'encomendar:entrada-' + k);
      l.style.cursor = 'pointer';
      var h = l.querySelector('h2'); if (h && !h.querySelector('.ipr-fd-seta')) { var s = D.createElement('span'); s.className = 'ipr-fd-seta'; s.textContent = ' ›'; s.setAttribute('aria-hidden', 'true'); h.appendChild(s); }
    });
  }
  setInterval(cartoes, 700);
  function tocarCartao(k) {
    var x = D.querySelector('#ipr-exm-bv [data-x="fecharbv"]');
    if (k !== 'ficha') guardar(k); else guardar('');
    if (x) { W.__iprFdInterno = true; try { x.click(); } finally { W.__iprFdInterno = false; } }
    setTimeout(function () {
      var nome = { planta: 'Planta de Localização', leitura: 'Leitura Territorial', base: 'Base Cartográfica' }[k];
      aviso(pt() ? ('Procure o terreno na barra de cima ou aproxime o mapa, e toque na parcela. ' + (nome ? 'A seguir mostramos o preço da ' + nome + '.' : 'A Ficha da propriedade aparece em baixo, grátis.'))
                 : ('Search for the land at the top or zoom in, then tap the parcel. ' + (nome ? 'Next we show the price.' : 'The free Property sheet appears below.')));
    }, 350);
  }
  D.addEventListener('click', function (e) {
    var l = e.target && e.target.closest && e.target.closest('#ipr-exm-bv [data-fd-cartao]'); if (!l) return;
    if (e.target.closest('button, a, input')) return;
    tocarCartao(l.getAttribute('data-fd-cartao'));
  });
  D.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var l = e.target && e.target.closest && e.target.closest('#ipr-exm-bv [data-fd-cartao]'); if (!l) return;
    e.preventDefault(); tocarCartao(l.getAttribute('data-fd-cartao'));
  });

  // 7. Passo «Os seus dados» do assistente. Dados de 10-11/11: 88 terrenos chegaram ao assistente e 0 pedidos foram enviados.
  //    Decisões do Nuno: 11/11 09h45 («Sim, os três») e 10h26 (sai a caixa de renúncia: «as pessoas acham estranho»).
  //    a) a caixa de privacidade obrigatória passa a aviso com ligação (os dados servem para cumprir o pedido);
  //    b) a caixa de entrega imediata sai da vista; o pedido expresso passa a ser o próprio botão «Pagar e receber já», com a
  //       frase por cima a dizer que ao pagar pede a entrega imediata e deixa de poder desistir depois de receber
  //       (DL 24/2014, art. 17.º, n.º 1, al. m). A caixa só é marcada no momento do clique no botão, nunca antes;
  //    c) saem a frase «Se só está a explorar» e os textos sobre a caixa e os 14 dias.
  //    d) 20/11/2026 (Nuno, 12h00 e 12h44): tudo o que sai para o cliente passa primeiro pela revisão da equipa (m92700); o botão
  //       deixa de prometer entrega imediata e passa a «Pagar». O pedido expresso continua a ser o clique no botão.
  var renuncia = null;
  function folha(t) { return [].slice.call(D.querySelectorAll('p, small, div, span')).filter(function (e) { if (e.children.length > 1 || e.__fd) return false; var x = e.textContent || ''; return x.length < 260 && t.test(x) && !e.querySelector('button, input, select, textarea') && e.offsetParent; }); } // 25/11 (T-01): mesmas regras, por ordem do mais barato ao mais caro (antes lia o texto de todos os blocos da página e media cada um, de 500 em 500 ms)
  function botaoPagar(e) { return e && e.closest && e.closest('button'); }
  function ePagar(b) { return b && /^\s*(Pagar|Pay|Pagar y)\b/i.test(b.textContent || '') && b.offsetParent; }
  function aviso14() {
    return pt() ? 'Cada documento é revisto pela nossa equipa antes de lhe ser enviado; a Planta de Localização segue por e-mail até 24 horas depois do pagamento. Ao carregar em «Pagar» pede que comecemos logo a seguir ao pagamento e deixa de poder desistir da compra depois de o receber.'
                : 'Our team reviews every document before sending it; the Location plan is emailed within 24 hours of payment. By pressing «Pay» you ask us to start right after payment and lose the right to cancel once you receive it.';
  }
  function marcarRenuncia() { if (renuncia && renuncia.isConnected && !renuncia.checked) renuncia.click(); }
  W.addEventListener('click', function (e) { var b = botaoPagar(e.target); if (ePagar(b) && b.getAttribute('data-fd-pagar')) marcarRenuncia(); }, true);
  W.addEventListener('submit', function (e) { if (e.target && e.target.querySelector && e.target.querySelector('[data-fd-pagar]')) marcarRenuncia(); }, true);
  setInterval(function () {
    [].slice.call(D.querySelectorAll('label.ck')).forEach(function (l) {
      if (l.__fd || !l.offsetParent) return;
      var t = (l.textContent || '').trim(), i = l.querySelector('input[type=checkbox]'); if (!i) return;
      if (/^(Li a Pol[ií]tica de Privacidade|I have read the Privacy|He le[ií]do la Pol[ií]tica)/i.test(t)) {
        l.__fd = 1;
        if (!i.checked) i.click();
        l.style.display = 'none';
        var n = D.createElement('p'); n.className = 'ipr-fd-priv';
        n.style.cssText = 'margin:6px 0 0;font-size:12.5px;opacity:.8';
        n.innerHTML = pt() ? 'Ao encomendar, usamos estes dados só para a factura e para lhe enviar o documento (<a href="/politica-de-privacidade/" target="_blank" rel="noopener">Política de Privacidade</a>).'
                           : 'We use these details only for the invoice and to send you the document (<a href="/politica-de-privacidade/" target="_blank" rel="noopener">Privacy Policy</a>).';
        l.parentNode.insertBefore(n, l.nextSibling);
        return;
      }
      if (/^(Peço expressamente|I expressly|Solicito expresamente)/i.test(t)) {
        l.__fd = 1; renuncia = i;
        l.style.display = 'none';
        return;
      }
    });
    folha(/Se só está a explorar|just exploring/i).forEach(function (e) { if (!e.__fd) { e.__fd = 1; e.style.display = 'none'; } });
    folha(/^\s*(Sem esta caixa|Se não marcar, enviamos|Precisa do documento já)/i).forEach(function (e) { if (!e.__fd) { e.__fd = 1; e.style.display = 'none'; } });
    if (renuncia && renuncia.isConnected) {
      [].slice.call(D.querySelectorAll('button')).forEach(function (b) {
        if (!ePagar(b)) return;
        var tx = (b.textContent || '').trim(), m = tx.match(/([\d.\s]+,\d{2}\s*€|€\s*[\d.,]+)/);
        var alvo = (pt() ? 'Pagar' : 'Pay') + (m ? ' · ' + m[1].trim() : '');
        if (b.childElementCount === 0 && tx !== alvo) b.textContent = alvo;
        b.setAttribute('data-fd-pagar', '1');
        var row = b.parentNode, cx = row && row.parentNode; // por cima da linha «Voltar · Pagar», a toda a largura
        if (cx && !cx.querySelector('.ipr-fd-ja')) {
          var p = D.createElement('p'); p.className = 'ipr-fd-ja';
          var pl = getComputedStyle(row).paddingLeft || '0px', pr = getComputedStyle(row).paddingRight || '0px';
          p.style.cssText = 'margin:10px 0 6px;padding:0 ' + pr + ' 0 ' + pl + ';font-size:12.5px;line-height:1.4;opacity:.85';
          p.textContent = aviso14();
          cx.insertBefore(p, row);
        }
      });
    }
  }, 500);

  // 8. Preços sempre com e sem IVA (Nuno, 11/11 11h31: «Tudo deve mostrar com e sem IVA»). IVA a 23 % em todos os produtos,
  //    incluindo a visita técnica e a deslocação desde 11/11 (antes 6 %).
  //    a) Cartão da visita técnica no mapa (funil-atlas.js): «350 € + deslocação … = 386,50 €. Valores sem IVA» ganha a linha com IVA.
  //    b) Rótulos que só dizem «N € + IVA» ou «desde N € + IVA» (entradas do Explorer no computador, cartões) ganham «· X € com IVA».
  var IVA = 1.23;
  function num(t) { return parseFloat(String(t).replace(/\./g, '').replace(',', '.')); }
  function euro(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return p[0] + ',' + p[1]; }
  function euroEn(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p[0] + '.' + p[1]; }
  function ivaCartaoVisita() {
    [].slice.call(D.querySelectorAll('div.v')).forEach(function (el) {
      var velho = el.querySelector('.ipr-fd-iva'), t = (el.textContent || '').replace(velho ? velho.textContent : '', '');
      if (!/Valores sem IVA|excl\. VAT|without VAT/i.test(t) || el.__fdBase === t) return;
      if (velho) velho.remove();
      var m = t.match(/^\s*([\d.,]+)\s*€[\s\S]*?=\s*([\d.,]+)\s*€/), v, d;
      if (m) { v = num(m[1]); d = num(m[2]); } else { m = t.match(/^\s*([\d.,]+)\s*€/); if (!m) return; v = num(m[1]); d = 0; }
      if (!(v > 0)) return;
      el.__fdBase = t;
      var x = D.createElement('small'); x.className = 'ipr-fd-iva'; x.style.cssText = 'display:block;margin-top:4px;font-weight:600';
      x.textContent = pt() ? (d ? 'Com IVA (23 %): ' + euro(v * IVA) + ' € + ' + euro(d * IVA) + ' € de deslocação = ' + euro((v + d) * IVA) + ' €.' : 'Com IVA (23 %): ' + euro(v * IVA) + ' €.')
                           : (d ? 'Incl. VAT (23%): €' + euroEn(v * IVA) + ' + €' + euroEn(d * IVA) + ' travel = €' + euroEn((v + d) * IVA) + '.' : 'Incl. VAT (23%): €' + euroEn(v * IVA) + '.');
      el.appendChild(x);
    });
  }
  function ivaRotulos() {
    var w = D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT, null), n, alvo = [];
    while ((n = w.nextNode())) {
      var e = n.parentElement; if (!e || /^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/.test(e.tagName) || e.children.length || !e.offsetParent) continue;
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      var m = t.match(/^(desde |a partir de )?([\d.]+(?:,\d{1,2})?) ?€ ?\+ ?IVA$/i), en = false;
      if (!m) { m = t.match(/^(from )?€([\d,]+(?:\.\d{1,2})?) \+ VAT$/i); en = !!m; }
      if (!m) continue;
      var pai = e.parentElement; if (pai && /com IVA|incl\. VAT/i.test(pai.textContent || '')) continue;
      alvo.push([e, m, en]);
    }
    alvo.forEach(function (a) {
      var e = a[0], m = a[1], en = a[2], v = en ? parseFloat(m[2].replace(/,/g, '')) : num(m[2]);
      if (!(v > 0)) return;
      e.textContent = m[0] + (en ? ' · ' + (m[1] || '') + '€' + euroEn(v * IVA) + ' incl. VAT' : ' · ' + (m[1] || '') + euro(v * IVA) + ' € com IVA');
    });
  }
  setInterval(function () { try { ivaCartaoVisita(); ivaRotulos(); } catch (e) {} }, 1200);

  // 9. a) Entrada do Explorer no computador (#ipr-exd-bv) cobre o ecrã todo, barra de cima incluída: o primeiro clique em «Comprar»,
  //       «Entrar» ou na pesquisa só fechava a entrada e perdia-se (teste de 11/11, 11h40). Agora o clique no fundo fecha a entrada
  //       e chega ao botão que está por baixo.
  W.addEventListener('click', function (e) {
    var o = e.target;
    if (!o || o.id !== 'ipr-exd-bv' || o.hidden || !e.isTrusted) return;
    o.style.pointerEvents = 'none';
    var de = D.elementFromPoint(e.clientX, e.clientY);
    o.style.pointerEvents = '';
    var alvo = de && de.closest && de.closest('button, a[href], input, [role=button]');
    if (!alvo || o.contains(alvo)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    o.hidden = true; try { sessionStorage.setItem('ipr_exd_bv', '1'); } catch (x) {}
    if (alvo.tagName === 'INPUT') { alvo.focus(); } else { alvo.click(); }
  }, true);
  //    b) Separador «Processos» (Nuno, 11/11 11h31: «convém ter uma legenda a explicar o que é isso»). O Sentido regista cliques
  //       feitos por código: abrir a Base Cartográfica (cartão do «Comprar», «Desenhar no mapa») carrega no separador sozinho,
  //       por isso aparece como «atlas:Base Cartográfica e conversão de ficheiros» sem a pessoa lá ter ido.
  setInterval(function () {
    var p = D.querySelector('.ipe-pane[data-pane="enc"]');
    if (!p || p.querySelector('.ipr-fd-leg')) return;
    var l = D.createElement('p'); l.className = 'ipr-fd-leg';
    l.style.cssText = 'margin:0 0 10px;padding:8px 10px;border-left:3px solid #6f8a3c;font-size:12.5px;line-height:1.4;opacity:.9';
    l.textContent = pt() ? 'Processos: aqui encomenda a Base Cartográfica do seu terreno (relevo, curvas de nível, linhas de água, a partir do LiDAR da DGT) e converte ficheiros entre formatos (KML, KMZ, GeoJSON, Shapefile).'
                         : 'Processes: order the Base map of your land (relief, contours, water lines from DGT LiDAR) and convert files between formats (KML, KMZ, GeoJSON, Shapefile).';
    p.insertBefore(l, p.firstChild);
  }, 1000);

  // 10. Computador, assistente «Comprar» › «Consigo mostrar no mapa» › «Clicar nas parcelas do cadastro» ou «Desenhar o limite»:
  //     o assistente abre o formulário do estúdio (escondido no Explorer) e só liga a ferramenta quando ele aparece. No Explorer
  //     nunca aparece: a ferramenta ficava em «navegar», o cadastro desligado, e o clique no mapa não marcava nada (teste de
  //     11/11, 12h50). Aqui, quando o passo do mapa fica à vista e a ferramenta continua em «navegar», ligam-se pelos botões da
  //     barra da esquerda do Explorer: «Escolher no mapa» (cadastro e parcelas) ou «Desenhar».
  var passoMapa = '';
  function botaoExd(x) {
    var bs = D.querySelectorAll('[data-x="' + x + '"]');
    for (var i = 0; i < bs.length; i++) { if (!bs[i].closest('#ipr-exd-bv')) return bs[i]; }
    return null;
  }
  setInterval(function () {
    if (!D.documentElement.classList.contains('ipr-exd')) return;
    var espera = [].slice.call(D.querySelectorAll('div.esp')).filter(function (e) { return e.offsetParent && /espera do terreno|Waiting for the land/i.test(e.textContent || ''); })[0];
    if (!espera) { passoMapa = ''; return; }
    var p = W.__ipe && W.__ipe.estado, cx = espera.parentNode, k = '';
    for (var n = 0; n < 6 && cx; n++, cx = cx.parentNode) {
      var h = cx.querySelector && cx.querySelector('h2,h3');
      if (h && h.offsetParent) { k = /Desenhar o limite|Draw the boundary/.test(h.textContent) ? 'desenhar' : /parcelas|parcels/i.test(h.textContent) ? 'cadastro' : ''; if (k) break; }
    }
    if (!k || !p) return;
    if (passoMapa === k) return;
    if (k === 'desenhar' ? p.tool === 'desenhar' : p.tool === 'parcelas') { passoMapa = k; return; }
    if (p.tool !== 'nav') return;
    var b = botaoExd(k === 'desenhar' ? 'desenhar' : 'escolher');
    if (!b) return;
    passoMapa = k;
    W.__iprFdInterno = true; try { b.click(); } finally { W.__iprFdInterno = false; }
    sd('encomendar:ferramenta-' + k);
  }, 700);

  // 4. Na ficha gratuita: o que mais se pode ter deste terreno (porta de entrada para os documentos pagos) e envio por WhatsApp.
  var PROD = [
    ['planta', 'Planta de Localização', 'Location plan', '19 € + IVA · 23,37 € com IVA', '€19 + VAT · €23.37 incl. VAT', 'A planta do terreno à escala, para a câmara, o banco ou a escritura. Pronta a imprimir.', 'A scaled plan of the land for the council, the bank or the deed. Ready to print.'],
    ['leitura', 'Leitura Territorial', 'Land report', 'desde 79 € + IVA · 97,17 € com IVA', 'from €79 + VAT · €97.17 incl. VAT', 'Relatório para decidir: o que o terreno permite pelo PDM, os riscos e o potencial.', 'A report to decide: what the zoning allows, the risks and the potential.'],
    ['base', 'Base Cartográfica', 'Base map', 'desde 99 € + IVA · 121,77 € com IVA', 'from €99 + VAT · €121.77 incl. VAT', 'Relevo, água e limites do terreno em ficheiros (LiDAR da DGT), para o seu técnico e para o mapa.', 'Relief, water and boundaries from LiDAR, as files for your technician and on the map.']
  ];
  function css() {
    if (D.getElementById('ipr-fd-css')) return;
    var s = D.createElement('style'); s.id = 'ipr-fd-css';
    s.textContent = '.ipr-fd-mais{margin:14px 0 4px;padding:12px;border:1px solid rgba(111,138,60,.45);border-radius:12px;background:rgba(111,138,60,.08)}' +
      '.ipr-fd-mais h4{margin:0 0 8px;font:600 14px/1.3 Inter,Helvetica,Arial,sans-serif}' +
      '.ipr-fd-mais ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}' +
      '.ipr-fd-mais li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}' +
      '.ipr-fd-mais li b{font:600 13.5px Inter,sans-serif}.ipr-fd-mais li small{grid-column:1;opacity:.8;font-size:12.5px;line-height:1.35}' +
      '.ipr-fd-mais li i{font-style:normal;font:500 12px "IBM Plex Mono",monospace;opacity:.85}' +
      '.ipr-fd-mais li button{grid-column:2;grid-row:1/span 3;border:0;border-radius:18px;padding:8px 12px;background:#6f8a3c;color:#fff;font:600 13px Inter,sans-serif;cursor:pointer;white-space:nowrap}' +
      '.ipr-fd-wa{margin-left:6px;border:1px solid #25d366!important;color:#128c4a!important;background:#fff!important}';
    D.head.appendChild(s);
  }
  function linkCurto() { // ligação já mostrada pela partilha (campo de texto da ficha)
    var i = D.querySelector('.ipr-fg-out .ipr-fn2-lk input'); var v = i && i.value || '';
    return /^https?:\/\/\S+\/atlas\/\?(f|ficha)=\S+$/.test(v) ? v : '';
  }
  // Mesmo limite e mesmo código que a partilha do m91740 (o mesmo terreno dá sempre a mesma ligação curta).
  function polis(g) { return !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }
  function terreno() {
    var m = W.__ipe && W.__ipe.mapa; if (!m) return null; var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === 'function') { try { var a = cs[i].getAll(); if (a && a.features) { var fs = a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }); return fs.length ? { type: 'FeatureCollection', features: fs } : null; } } catch (e) {} }
    return null;
  }
  function b64u(t) { return btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function codificar(F) {
    var passo = 1, txt = '';
    for (var t = 0; t < 6; t++) {
      txt = F.features.map(function (f) { return polis(f.geometry).map(function (p) { return p.map(function (r) { var o = r.filter(function (q, i) { return i % passo === 0 || i === r.length - 1; }); return o.map(function (q) { return q[0].toFixed(5) + ',' + q[1].toFixed(5); }).join(' '); }).join('|'); }).join('!'); }).join('!');
      if (txt.length < 5000) break; passo *= 2;
    }
    return b64u(txt);
  }
  function criarLigacao() {
    var F = terreno(); if (!F) return Promise.resolve('');
    var c = codificar(F), longa = location.origin + '/atlas/?ficha=' + c, C = W.TCD_FCURTA;
    if (!C || !C.ajax) return Promise.resolve(longa);
    var fd = new FormData(); fd.append('action', 'tcd_fcurta_criar'); fd.append('c', c); if (C.es) fd.append('es', '1');
    return fetch(C.ajax, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json(); })
      .then(function (j) { return j && j.success && j.data && j.data.u ? j.data.u : longa; }).catch(function () { return longa; });
  }
  function whatsapp() {
    var abrir = function (u, depois) {
      var txt = (pt() ? 'Ficha da propriedade (grátis), com condicionantes, água, relevo e risco de incêndio: ' : 'Property sheet (free): restrictions, water, relief and fire risk: ') + u;
      var wa = 'https://wa.me/?text=' + encodeURIComponent(txt);
      if (depois) { location.href = wa; return; } // depois de esperar, o navegador bloquearia uma janela nova
      if (!W.open(wa, '_blank')) location.href = wa;
    };
    var u = linkCurto(); if (u) { abrir(u, false); return; }
    // Abre a janela já no clique (senão o navegador bloqueia) e põe lá o endereço quando a ligação curta chegar.
    var jan = null; try { jan = W.open('', '_blank'); } catch (e) {}
    criarLigacao().then(function (x) {
      if (!x) { if (jan) jan.close(); return; }
      var txt = (pt() ? 'Ficha da propriedade (grátis), com condicionantes, água, relevo e risco de incêndio: ' : 'Property sheet (free): restrictions, water, relief and fire risk: ') + x;
      var wa = 'https://wa.me/?text=' + encodeURIComponent(txt);
      if (jan) { try { jan.location.href = wa; return; } catch (e) {} }
      location.href = wa;
    });
  }
  setInterval(function () {
    var o = D.querySelector('.ipr-fg-out'); if (!o || !o.children.length) return;
    if (!o.querySelector('.ipr-fd-mais')) {
      css();
      var en = !pt(), d = D.createElement('div'); d.className = 'ipr-fd-mais';
      d.innerHTML = '<h4>' + (en ? 'For this land you can also have' : 'Deste terreno pode ter também') + '</h4><ul>' + PROD.map(function (p) {
        return '<li><b>' + (en ? p[2] : p[1]) + '</b><i>' + (en ? p[4] : p[3]) + '</i><small>' + (en ? p[6] : p[5]) + '</small><button type="button" data-fd-prod="' + p[0] + '" data-sd="encomendar:ficha-' + p[0] + '">' + (en ? 'See price' : 'Ver preço') + '</button></li>';
      }).join('') + '</ul>';
      o.appendChild(d);
    }
    var sh = o.querySelector('[data-fg-partilhar]');
    if (sh && !o.querySelector('.ipr-fd-wa')) {
      var w = D.createElement('button'); w.type = 'button'; w.className = 'ipe-b ipr-fd-wa'; w.setAttribute('data-sd', 'contacto:whatsapp-ficha');
      w.textContent = pt() ? 'Enviar por WhatsApp' : 'Send on WhatsApp';
      sh.parentNode.insertBefore(w, sh.nextSibling);
    }
  }, 800);
  D.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-fd-prod], .ipr-fd-wa'); if (!b) return;
    e.preventDefault();
    if (b.classList.contains('ipr-fd-wa')) { whatsapp(); return; }
    var k = b.getAttribute('data-fd-prod');
    if (typeof W.iprAssistenteComprar === 'function') { try { if (W.iprAssistenteComprar(k)) return; } catch (x) {} }
    location.href = '/documentos/';
  });
})();
