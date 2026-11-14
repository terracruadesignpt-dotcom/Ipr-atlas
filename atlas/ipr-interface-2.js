;/* ===== tb2-js ===== */
(function () {
  if (window.__tb) return; window.__tb = 1;
  var D = document, bar = null, sc = null, xb = null, pan = null, qg = null, ult = '';
  function t62() { return D.getElementById('ipr-t62'); }
  function chave(o) { return o.getAttribute('data-t62') ? 't:' + o.getAttribute('data-t62') : 'a:' + o.getAttribute('data-agt'); }
  function orig(k) { var t = t62(); if (!t) return null; var p = k.split(':'); return t.querySelector(p[0] === 't' ? '[data-t62="' + p[1] + '"]' : '[data-agt="' + p[1] + '"]'); }
  function poe(bs) {
    sc.innerHTML = '';
    bs.forEach(function (o) {
      var c = D.createElement('button'), n = o.querySelector('.n'), sv = o.querySelector('svg'), nm = n ? n.textContent.trim() : o.textContent.trim();
      c.type = 'button'; c.className = 'tb-t'; c.setAttribute('data-k', chave(o)); c.setAttribute('data-n', nm); c.setAttribute('aria-label', nm); c.setAttribute('aria-pressed', 'false');
      c.innerHTML = (sv ? sv.outerHTML : '') + '<span class="n"></span>'; c.querySelector('.n').textContent = nm;
      sc.appendChild(c);
    });
  }
  function monta() {
    var M = D.getElementById('ipe-mapa'), t = t62();
    if (!M) return false; if (!t) return false;
    var bs = t.querySelectorAll('button[data-t62],button[data-agt]'); if (!bs.length) return false;
    bar = D.createElement('div'); bar.id = 'tb-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Temas');
    bar.innerHTML = '<span class="tb-h">Temas</span><div class="tb-sc"></div><button type="button" class="tb-mais" aria-label="Mais temas" title="Mais temas">\u203a</button><span class="tb-m"><span class="tb-h">Os meus</span><button type="button" data-px="1">1</button><button type="button" data-px="2">2</button><button type="button" data-px="3">3</button><button type="button" class="g" data-pxg="">Guardar</button></span>';
    sc = bar.querySelector('.tb-sc');
    poe(bs);
    M.appendChild(bar);
    qg = D.createElement('div'); qg.className = 'ipe-tg'; qg.id = 'tb-qg';
    qg.innerHTML = '<button type="button" class="ipe-t tb-q" title="Por onde come\u00e7ar?" aria-label="Por onde come\u00e7ar?">?<span class="ipe-tip">Por onde come\u00e7ar?</span></button>';
    qg.addEventListener('click', function () { var t = t62(); var q = t ? t.querySelector('.ipr-70-com') : null; if (q) q.click(); D.documentElement.classList.remove('tb-fechado'); });
    pan = D.createElement('div'); pan.id = 'tb-pan'; pan.hidden = true; M.appendChild(pan);
    var par = t.parentNode, P = Node.prototype, ap = P.appendChild, ib = P.insertBefore;
    function preso(n) { return n ? (n.id === 'ipr-t62' ? n.parentNode === pan : false) : false; }
    P.appendChild = function (n) { if (this !== pan) { if (preso(n)) return n; } return ap.call(this, n); };
    P.insertBefore = function (n, r) { if (this !== pan) { if (preso(n)) return n; } return ib.call(this, n, r); };
    ap.call(pan, t);
    xb = D.createElement('button'); xb.type = 'button'; xb.id = 'tb-x'; xb.title = 'Fechar o painel (o tema continua ligado)'; xb.setAttribute('aria-label', 'Fechar o painel'); xb.textContent = '\u00d7'; xb.hidden = true; M.appendChild(xb);
    xb.addEventListener('click', function () { D.documentElement.classList.add('tb-fechado'); sinc(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('tb-mais')) { var fim = sc.scrollLeft + sc.clientWidth > sc.scrollWidth - 4; sc.scrollTo({ left: fim ? 0 : sc.scrollLeft + Math.round(sc.clientWidth * 0.7), behavior: 'auto' }); return; }
      var t = t62(); if (!t) return;
      if (b.classList.contains('tb-q')) { var q = t.querySelector('.ipr-70-com'); if (q) q.click(); D.documentElement.classList.remove('tb-fechado'); return; }
      if (b.hasAttribute('data-px')) { var p = t.querySelector('[data-px="' + b.getAttribute('data-px') + '"]'); if (p) p.click(); setTimeout(sinc, 60); return; }
      if (b.hasAttribute('data-pxg')) { var g = t.querySelector('[data-pxg]'); if (g) g.click(); setTimeout(sinc, 60); return; }
      var k = b.getAttribute('data-k'); if (!k) return;
      var o = orig(k); if (!o) return;
      var fech = D.documentElement.classList.contains('tb-fechado');
      if (o.getAttribute('aria-pressed') === 'true') { if (fech) { D.documentElement.classList.remove('tb-fechado'); sinc(); return; } }
      D.documentElement.classList.remove('tb-fechado');
      o.click(); setTimeout(sinc, 60);
    });
    D.documentElement.classList.add('tb-on');
    new MutationObserver(function () { if (ult) return; ult = 'x'; setTimeout(function () { ult = ''; sinc(); }, 120); }).observe(pan, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class', 'title'] });
    window.addEventListener('resize', sinc); sc.addEventListener('scroll', mais);
    sinc(); return true;
  }
  function mais() {
    var mb = bar.querySelector('.tb-mais'), sobra = sc.scrollWidth > sc.clientWidth + 2, fim = sc.scrollLeft + sc.clientWidth > sc.scrollWidth - 4;
    mb.hidden = !sobra; sc.classList.toggle('mf', sobra ? !fim : false);
    mb.textContent = fim ? '\u2039' : '\u203a'; mb.title = fim ? 'Voltar ao in\u00edcio' : 'Mais temas';
  }
  function sinc() {
    if (!bar) return; var t = t62(); if (!t) return;
    var bs = t.querySelectorAll('button[data-t62],button[data-agt]'); if (bs.length !== sc.children.length) poe(bs);
    var tl = D.querySelector('#ipe-mapa .ipe-tools'); if (tl) { if (qg.parentNode !== tl) tl.appendChild(qg); } qg.hidden = !t.querySelector('.ipr-70-com');
    sc.querySelectorAll('.tb-t').forEach(function (c) { var o = orig(c.getAttribute('data-k')); c.setAttribute('aria-pressed', o ? (o.getAttribute('aria-pressed') === 'true' ? 'true' : 'false') : 'false'); });
    bar.querySelectorAll('.tb-m [data-px]').forEach(function (c) { var o = t.querySelector('[data-px="' + c.getAttribute('data-px') + '"]'); if (!o) return; c.title = o.title || ''; c.classList.toggle('ch', !o.classList.contains('vz')); c.setAttribute('aria-pressed', o.getAttribute('aria-pressed') === 'true' ? 'true' : 'false'); });
    var g = t.querySelector('[data-pxg]'), gb = bar.querySelector('[data-pxg]'); if (g) { gb.setAttribute('aria-pressed', g.getAttribute('aria-pressed') === 'true' ? 'true' : 'false'); gb.textContent = g.textContent.trim() || 'Guardar'; }
    if (t.parentNode !== pan) pan.appendChild(t);
    var s = t.querySelector('.ipr-t62-c');
    var vis = s ? !D.documentElement.classList.contains('tb-fechado') : false;
    xb.hidden = !vis; pan.hidden = !vis;
    mais();
  }
  var n = 0;
  (function espera() { if (monta()) return; n++; if (n < 2000) setTimeout(espera, 150); })();
})();

;/* ===== mi-js ===== */
(function () {
  if (window.__mi) return; window.__mi = 1;
  var D = document, cx = null, aberto = '';
  function tao() { return D.getElementById('tao'); }
  function titulo(lb) { var s = lb.querySelector('span'), t = ''; if (!s) return ''; s.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.nodeValue; }); return t.trim(); }
  function desc(lb) { var i = lb.querySelector('span > i'); return i ? i.textContent.trim() : ''; }
  function sub(lb) { var e = lb.previousElementSibling; while (e) { if (e.tagName === 'H5') return e.textContent.trim(); e = e.previousElementSibling; } return ''; }
  function caixa() {
    if (cx) return cx;
    cx = D.createElement('div'); cx.id = 'mi-ii'; cx.setAttribute('role', 'dialog'); cx.hidden = true;
    D.body.appendChild(cx);
    cx.addEventListener('click', function (e) { if (e.target.closest('.x')) fecha(); });
    return cx;
  }
  function fecha() { if (cx) cx.hidden = true; aberto = ''; }
  function esc(x) { return String(x).replace(/[<>"]/g, function (c) { return c === '<' ? '&lt;' : (c === '>' ? '&gt;' : '&quot;'); }); }
  function abre(b) {
    var lb = b.closest('label'), id = b.getAttribute('data-mi');
    if (aberto === id) { if (!cx.hidden) { fecha(); return; } }
    var o = D.getElementById('ipr-ii'); if (o) { if (!o.hidden) { var x = o.querySelector('.x'); if (x) x.click(); else o.hidden = true; } }
    var c = caixa(), d = desc(lb), sg = sub(lb);
    c.innerHTML = '<button type="button" class="x" aria-label="Fechar">\u00d7</button><h3>' + esc(titulo(lb)) + '</h3><div class="ii-g">Mundo \u00b7 fontes globais' + (sg ? ' \u00b7 ' + esc(sg) : '') + '</div>' +
      (d ? '<h4>O que \u00e9</h4><p>' + esc(d) + '</p>' : '<p class="ii-m">Sem descri\u00e7\u00e3o para esta camada.</p>');
    c.hidden = false; aberto = id;
    var t = tao().getBoundingClientRect(), r = lb.getBoundingClientRect(), w = c.offsetWidth, h = c.offsetHeight;
    var x0 = t.right + 8; if (x0 + w > innerWidth - 8) x0 = Math.max(8, t.left - w - 8);
    var y0 = Math.max(8, Math.min(r.top - 6, innerHeight - h - 8));
    c.style.left = x0 + 'px'; c.style.right = 'auto'; c.style.top = y0 + 'px';
  }
  function poe() {
    var t = tao(); if (!t) return;
    [].forEach.call(t.querySelectorAll('label'), function (lb) {
      var inp = lb.querySelector('input[data-tao]'); if (!inp) return;
      var meu = lb.querySelector('.mi-b');
      if (lb.querySelector('.ipr-ii-b')) { if (meu) meu.remove(); return; }
      if (meu) return;
      var b = D.createElement('button'); b.type = 'button'; b.className = 'mi-b'; b.textContent = 'i';
      b.setAttribute('data-mi', inp.getAttribute('data-tao'));
      b.title = 'Sobre esta camada'; b.setAttribute('aria-label', b.title);
      lb.appendChild(b);
    });
  }
  D.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#tao .mi-b') : null;
    if (b) { e.preventDefault(); e.stopPropagation(); abre(b); return; }
    var o = e.target.closest ? e.target.closest('#tao .ipr-ii-b') : null;
    if (o) {
      fecha();
      var p = D.getElementById('ipr-ii'), id = o.getAttribute('data-ii');
      if (p) { if (!p.hidden) { if (p.__mi === id) { e.preventDefault(); e.stopPropagation(); var x = p.querySelector('.x'); if (x) x.click(); else p.hidden = true; p.__mi = ''; return; } } }
      setTimeout(function () { var q = D.getElementById('ipr-ii'); if (q) q.__mi = id; }, 0);
      return;
    }
    if (cx) { if (!cx.hidden) { if (!cx.contains(e.target)) fecha(); } }
  }, true);
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });
  var tm = null;
  new MutationObserver(function () { if (tm) return; tm = setTimeout(function () { tm = null; poe(); }, 150); }).observe(D.documentElement, { childList: true, subtree: true });
  poe();
})();
;/* ===== tp-js ===== */
(function(){
  var LOGO = '\u003csvg class="tp-logo" viewBox="0 0 174 27" role="img" aria-label="IPR Atlas">\u003cg transform="translate(-12.5 -7.9)">\u003cpath fill="#94BE39" d="M28.9 7.9L28.9 13.9L21.6 13.9L28.9 7.9ZM28.9 14.1L28.9 20.2L21.6 20.2L28.9 14.1ZM28.9 20.4L28.9 26.4L21.6 26.4L28.9 20.4ZM21.6 26.4L21.6 20.4L28.9 20.4L21.6 26.4ZM28.9 26.6L28.9 32.6L21.6 32.6L28.9 26.6ZM21.6 32.6L21.6 26.6L28.9 26.6L21.6 32.6ZM36.5 7.9L36.5 13.9L29.1 13.9L36.5 7.9ZM29.1 13.9L29.1 7.9L36.5 7.9L29.1 13.9ZM36.5 20.4L36.5 26.4L29.1 26.4L36.5 20.4ZM29.1 26.4L29.1 20.4L36.5 20.4L29.1 26.4ZM44 7.9L44 13.9L36.6 13.9L44 7.9ZM36.6 13.9L36.6 7.9L44 7.9L36.6 13.9ZM44 20.4L44 26.4L36.6 26.4L44 20.4ZM36.6 26.4L36.6 20.4L44 20.4L36.6 26.4ZM44.1 7.9L44.1 13.9L51.5 13.9L44.1 7.9ZM51.5 14.1L51.5 20.2L44.1 20.2L51.5 14.1ZM44.1 20.2L44.1 14.1L51.5 14.1L44.1 20.2ZM44.1 26.4L44.1 20.4L51.5 20.4L44.1 26.4ZM61.1 7.9L61.1 13.9L53.8 13.9L61.1 7.9ZM53.8 13.9L53.8 7.9L61.1 7.9L53.8 13.9ZM61.1 14.1L61.1 20.2L53.8 20.2L61.1 14.1ZM61.1 20.4L61.1 26.4L53.8 26.4L61.1 20.4ZM53.8 26.4L53.8 20.4L61.1 20.4L53.8 26.4ZM61.1 26.6L61.1 32.6L53.8 32.6L61.1 26.6ZM53.8 32.6L53.8 26.6L61.1 26.6L53.8 32.6ZM68.6 7.9L68.6 13.9L61.3 13.9L68.6 7.9ZM61.3 13.9L61.3 7.9L68.6 7.9L61.3 13.9ZM68.6 20.4L68.6 26.4L61.3 26.4L68.6 20.4ZM61.3 26.4L61.3 20.4L68.6 20.4L61.3 26.4ZM76.1 7.9L76.1 13.9L68.8 13.9L76.1 7.9ZM68.8 13.9L68.8 7.9L76.1 7.9L68.8 13.9ZM76.1 20.4L76.1 26.4L68.8 26.4L76.1 20.4ZM68.8 26.4L68.8 20.4L76.1 20.4L68.8 26.4ZM76.1 32.6L76.1 26.6L68.8 26.6L76.1 32.6ZM76.3 7.9L76.3 13.9L83.6 13.9L76.3 7.9ZM83.6 14.1L83.6 20.2L76.3 20.2L83.6 14.1ZM76.3 20.2L76.3 14.1L83.6 14.1L76.3 20.2ZM76.3 26.4L76.3 20.4L83.6 20.4L76.3 26.4ZM76.3 26.6L76.3 32.6L83.6 32.6L76.3 26.6ZM12.5 13.9L12.5 7.9L19.9 7.9L12.5 13.9ZM19.9 7.9L19.9 13.9L12.5 13.9L19.9 7.9ZM19.9 14.1L19.9 20.2L12.5 20.2L19.9 14.1ZM19.9 20.4L19.9 26.4L12.5 26.4L19.9 20.4ZM12.5 26.4L12.5 20.4L19.9 20.4L12.5 26.4ZM19.9 26.6L19.9 32.6L12.5 32.6L19.9 26.6ZM12.5 32.6L12.5 26.6L19.9 26.6L12.5 32.6Z"/>\u003c/g>\u003crect x="78.2" y="0" width="0.8" height="24.7" fill="#383A33"/>\u003ctext x="84" y="24.7" font-family="Outfit,sans-serif" font-weight="400" font-size="35.3" letter-spacing="-0.6" fill="#F5F4EE">Atlas\u003c/text>\u003cpath class="tp-cur" fill="#94BE39" d="M166 29.5H172V22.9Z"/>\u003c/svg>';
  var D = document, POS = null;
  function pega(){
    var t = D.querySelector('#ipe-mapa .ipe-tools');
    if (!t) return;
    var h = t.querySelector(':scope > .tp-pega');
    if (!h) {
      h = D.createElement('div'); h.className = 'tp-pega'; h.title = 'Arrastar'; h.setAttribute('aria-label', 'Arrastar ferramentas');
      h.appendChild(D.createElement('span'));
      h.addEventListener('pointerdown', comeca);
      h.addEventListener('dblclick', function(){ POS = null; repor(t); });
    }
    if (t.firstElementChild !== h) t.insertBefore(h, t.firstChild);
    if (POS) aplica(t);
  }
  function repor(t){ ['left','top','right','bottom'].forEach(function(k){ t.style.removeProperty(k); }); t.classList.remove('tp-solto'); }
  function aplica(t){
    t.style.setProperty('left', POS.x + 'px', 'important');
    t.style.setProperty('top', POS.y + 'px', 'important');
    t.style.setProperty('right', 'auto', 'important');
    t.style.setProperty('bottom', 'auto', 'important');
    t.classList.add('tp-solto');
  }
  function comeca(e){
    var t = D.querySelector('#ipe-mapa .ipe-tools'), m = D.getElementById('ipe-mapa');
    if (!t) return;
    if (!m) return;
    e.preventDefault();
    var rt = t.getBoundingClientRect();
    var k = t.offsetWidth ? rt.width / t.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, l0 = t.offsetLeft, t0 = t.offsetTop;
    var W0 = m.clientWidth - t.offsetWidth - 4, H0 = m.clientHeight - t.offsetHeight - 4;
    var h = e.currentTarget;
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
    D.documentElement.classList.add('tp-arrasta');
    t.style.setProperty('transition', 'none', 'important');
    POS = { x: l0, y: t0 }; aplica(t);
    function mexe(ev){
      var x = l0 + (ev.clientX - x0) / k, y = t0 + (ev.clientY - y0) / k;
      x = Math.max(4, Math.min(x, W0));
      y = Math.max(48, Math.min(y, H0));
      POS = { x: Math.round(x), y: Math.round(y) }; aplica(t);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
      t.style.removeProperty('transition');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function go(){
    var top = D.querySelector('#ipe header.ipe-top');
    if (!top) return;
    var m = top.querySelector(':scope > .ipe-marca');
    if (m) { if (!m.querySelector('.tp-logo')) m.insertAdjacentHTML('beforeend', LOGO); }
    pega();
    var pq = D.getElementById('ipr-be-pq');
    if (!pq) return;
    var sep = top.querySelector(':scope > .ipe-vsep');
    var ref = sep ? sep.nextSibling : null;
    if (pq.parentNode !== top) top.insertBefore(pq, ref);
    else if (sep) { if (pq.previousElementSibling !== sep) top.insertBefore(pq, ref); }
    var b = D.querySelector('#ipe [data-sb="busca"]');
    if (b) { if (b.parentNode !== pq) pq.appendChild(b); }
  }
  var n = 0;
  (function ciclo(){ try { go(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 250); })();
})();

(function(){
  var RE = /^([\s\S]*?\S)\s*\(([^()]{2,80})\)\s*$/;
  function parte(el){
    if (el.querySelector('.tp-sec')) return;
    for (var i = 0; i < el.childNodes.length; i++) {
      var t = el.childNodes[i];
      if (t.nodeType !== 3) continue;
      var m = RE.exec(t.nodeValue);
      if (!m) continue;
      var s = document.createElement('span'); s.className = 'tp-sec'; s.textContent = m[2];
      t.nodeValue = m[1];
      el.insertBefore(s, t.nextSibling);
      return;
    }
  }
  function corre(){
    document.querySelectorAll('#ipe-esq .ipr-it .ipr-nome, #tao label, #tao label > span, #ipr-t62 .ipr-t62-c label').forEach(parte);
  }
  var n = 0;
  (function ciclo(){ try { corre(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1200 : 300); })();
})();

(function(){
  var W = window, D = document, SEL = '.ipr-ii-b, .c2-i, .mi-b, .tp-li';
  var pin = null, hov = null, tf = 0, passa = false;
  function botao(t){ return (t ? (t.closest ? t.closest(SEL) : null) : null); }
  function caixas(){ return ['ipr-ii', 'mi-ii', 'c2-pop', 'tp-lpop'].map(function(i){ return D.getElementById(i); }).filter(Boolean); }
  function aberta(c){ return c.id === 'c2-pop' ? c.classList.contains('ab') : !c.hidden; }
  function fecharTudo(){
    caixas().forEach(function(c){
      if (!aberta(c)) return;
      var x = c.querySelector('.x, .c2-x');
      passa = true;
      try { if (x) x.click(); else c.hidden = true; } catch (e) {}
      passa = false;
    });
  }
  function abrir(b){ fecharTudo(); if (b.classList.contains('tp-li')) { if (W.__tpLeg) W.__tpLeg(b); if (W.__tpAlinha) W.__tpAlinha(b); return; } passa = true; try { b.click(); } catch (e) {} passa = false; if (W.__tpAlinha) W.__tpAlinha(b); }
  function marca(){
    D.querySelectorAll('.tp-pin, .tp-hov').forEach(function(b){ if (b !== pin) b.classList.remove('tp-pin'); if (b !== hov) b.classList.remove('tp-hov'); });
    if (pin) pin.classList.add('tp-pin');
    if (hov) hov.classList.add('tp-hov');
  }
  W.addEventListener('click', function(e){
    if (passa) return;
    var b = botao(e.target);
    if (b) {
      e.preventDefault(); e.stopImmediatePropagation();
      clearTimeout(tf);
      if (pin === b) { pin = null; hov = null; fecharTudo(); }
      else { pin = b; hov = null; abrir(b); }
      marca(); return;
    }
    var x = e.target.closest ? e.target.closest('#ipr-ii .x, #mi-ii .x, #c2-pop .c2-x, #tp-lpop .x') : null;
    if (x) { pin = null; hov = null; marca(); }
  }, true);
  W.addEventListener('keydown', function(e){ if (e.key === 'Escape') { pin = null; hov = null; marca(); } }, true);
  function naCaixa(t){ return t ? (t.closest ? t.closest('#ipr-ii, #mi-ii, #c2-pop, #tp-lpop') : null) : null; }
  W.addEventListener('pointerover', function(e){
    if (e.pointerType === 'touch') return;
    var b = botao(e.target);
    if (b) {
      clearTimeout(tf);
      if (pin) return;
      if (hov !== b) { hov = b; marca(); }
      return;
    }
    if (naCaixa(e.target)) clearTimeout(tf);
  }, true);
  W.addEventListener('pointerout', function(e){
    if (pin) return;
    if (!hov) return;
    var de = botao(e.target) || naCaixa(e.target);
    if (!de) return;
    var para = e.relatedTarget;
    if (para) { if (botao(para) === hov) return; if (naCaixa(para)) return; }
    clearTimeout(tf);
    tf = setTimeout(function(){ hov = null; marca(); }, 60);
  }, true);
})();

(function(){
  var IC = {limites: '\u003cpath d="M4 4h16v16H4z" stroke-dasharray="3 2.5"/>\u003ccircle cx="12" cy="12" r="1.6"/>', sat: '\u003cpath d="M5 7l3-3 4 4-3 3z"/>\u003cpath d="M15 17l3-3 4 4-3 3z"/>\u003cpath d="M10 12l2-2 4 4-2 2z"/>\u003cpath d="M4 15a5 5 0 0 0 5 5"/>', relevo: '\u003cpath d="M2 19l6-9 4 5 3-4 7 8z"/>', clima: '\u003cpath d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 17.6 9 3.5 3.5 0 0 1 17 16H7z"/>\u003cpath d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/>', veg: '\u003cpath d="M12 3l6 8h-3.5l4.5 6H5l4.5-6H6z"/>\u003cpath d="M12 17v4"/>', pop: '\u003ccircle cx="9" cy="8" r="3"/>\u003cpath d="M3 20a6 6 0 0 1 12 0"/>\u003ccircle cx="17" cy="9" r="2.4"/>\u003cpath d="M16.5 14a4.5 4.5 0 0 1 4.5 5"/>', risco: '\u003cpath d="M12 3l10 18H2z"/>\u003cpath d="M12 10v5M12 18v.5"/>', europa: '\u003ccircle cx="12" cy="12" r="9"/>\u003cpath d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', ocup: '\u003cpath d="M3 3h18v18H3z"/>\u003cpath d="M3 10h18M10 3v18M10 15h11"/>', agua: '\u003cpath d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>', solo: '\u003cpath d="M3 7c3-2 6 2 9 0s6-2 9 0"/>\u003cpath d="M3 12h18M3 17h18"/>\u003cpath d="M7 14.5v.5M14 14.5v.5M10 19.5v.5M17 19.5v.5"/>'};
  var RG = [['limites', /^limit/i], ['sat', /^sat/i], ['relevo', /^relev/i], ['clima', /^clima/i], ['veg', /^veget/i], ['pop', /^popul/i], ['risco', /^risc/i], ['europa', /^europ/i], ['ocup', /^ocupa/i], ['agua', /^.gua/i], ['solo', /^solo/i]];
  function poe(){
    document.querySelectorAll('#tao h5').forEach(function(h){
      if (h.querySelector('.tp-ic')) return;
      var t = (h.textContent || '').trim(), k = '';
      RG.forEach(function(r){ if (!k) { if (r[1].test(t)) k = r[0]; } });
      if (!k) return;
      h.insertAdjacentHTML('afterbegin', '\u003csvg class="tp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '\u003c/svg>');
    });
  }
  var n = 0;
  (function ciclo(){ try { poe(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var W = window, D = document, POSL = null, LIM = 26;
  var HIP = [['#FF0000','1100 m'],['#FF5500','600'],['#FFAA00','400'],['#FFFF00','200'],['#B0E000','100'],['#6FC400','50'],['#38A800','']];
  function el(t, c, tx){ var e = D.createElement(t); if (c) e.className = c; if (tx) e.textContent = tx; return e; }
  function pop(){
    var p = D.getElementById('tp-lpop');
    if (p) return p;
    p = el('div'); p.id = 'tp-lpop'; p.hidden = true; p.setAttribute('role', 'dialog');
    var x = el('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar');
    x.addEventListener('click', function(){ p.hidden = true; });
    p.appendChild(x); p.appendChild(el('b')); p.appendChild(el('span')); p.appendChild(el('div', 'im'));
    D.body.appendChild(p);
    return p;
  }
  W.__tpLeg = function(b){
    var p = pop();
    p.querySelector('b').textContent = b.getAttribute('data-t') || '';
    p.querySelector('span').textContent = b.getAttribute('data-x') || '';
    var im = p.querySelector('.im'); im.textContent = '';
    var src = b.getAttribute('data-img');
    if (src) { var i = el('img'); i.alt = ''; i.src = src; im.appendChild(i); }
    p.hidden = false;
    var r = b.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    var x = r.right + 12; if (x + w > W.innerWidth - 8) x = Math.max(8, r.left - w - 12);
    var y = Math.max(8, Math.min(r.top - 10, W.innerHeight - h - 8));
    p.style.left = Math.round(x) + 'px'; p.style.top = Math.round(y) + 'px';
  };
  function botaoI(alvo, t, x, img){
    var b = alvo.querySelector(':scope > .tp-li');
    if (!b) { b = el('button', 'tp-li', 'i'); b.type = 'button'; b.setAttribute('aria-label', 'Mais informa\u00e7\u00e3o'); alvo.appendChild(b); }
    b.setAttribute('data-t', t || ''); b.setAttribute('data-x', x || '');
    if (img) b.setAttribute('data-img', img); else b.removeAttribute('data-img');
    return b;
  }
  function barra(blk, img){
    if (blk.querySelector('.tp-vb')) return;
    var vb = el('div', 'tp-vb'), br = el('div', 'br'), lb = el('div', 'lb');
    HIP.forEach(function(c, i){
      var s = el('i'); s.style.background = c[0]; br.appendChild(s);
      if (c[1]) { var t = el('span', null, c[1]); t.style.top = ((i + 1) * 14 - 6) + 'px'; lb.appendChild(t); }
    });
    var u = el('em', null, 'm'); lb.appendChild(u);
    vb.appendChild(br); vb.appendChild(lb);
    img.parentNode.insertBefore(vb, img);
    blk.classList.add('tp-hip');
  }
  function linhas(box){
    var c = box.querySelector('.c'); if (!c) return;
    c.querySelectorAll('.ipr-76').forEach(function(blk){
      var nome = blk.querySelector(':scope > b'), nm = '';
      if (nome) { nome.childNodes.forEach(function(n){ if (n.nodeType === 3) nm += n.nodeValue; }); nm = nm.trim(); }
      blk.querySelectorAll(':scope > img.w').forEach(function(img){
        if (/hipsometria/i.test(img.src)) { barra(blk, img); return; }
        if (!img.getAttribute('data-tp')) {
          img.setAttribute('data-tp', '1');
          if (img.src.indexOf('?') > 0) { if (!/TRANSPARENT=/i.test(img.src)) img.src = img.src + '\u0026TRANSPARENT=TRUE'; }
        }
        blk.classList.add('tp-wi');
        var tl = blk.querySelector(':scope > .tp-li');
        if (blk.querySelector('.ipr-ii-b')) { if (tl) tl.remove(); } else botaoI(blk, nm, 'Legenda do servi\u00e7o:', img.src);
      });
      blk.querySelectorAll('.r > span, .sh').forEach(function(s){
        var tx = (s.getAttribute('data-tpx') || s.textContent || '').trim();
        if (!(tx.length > LIM)) return;
        if (!s.getAttribute('data-tpx')) s.setAttribute('data-tpx', tx);
        var cur = tx.slice(0, LIM).replace(/\s+\S*$/, '') + '\u2026';
        if (s.firstChild) { if (s.firstChild.nodeType === 3) s.firstChild.nodeValue = cur; }
        botaoI(s.parentNode.classList.contains('r') ? s.parentNode : s, nm, tx);
      });
    });
    [].forEach.call([], function(o){
      var nc = o.querySelector('.n5-nc'), sp = o.querySelector(':scope > span:not(.n5-nc):not(.n5-rp)');
      if (!sp) return;
      var tx = (sp.getAttribute('data-tpx') || sp.firstChild ? (sp.getAttribute('data-tpx') || sp.firstChild.nodeValue || '') : '').trim();
      var extra = nc ? (nc.textContent || '').trim() : '';
      if (tx.length > LIM) {
        if (!sp.getAttribute('data-tpx')) sp.setAttribute('data-tpx', tx);
        if (sp.firstChild.nodeType === 3) sp.firstChild.nodeValue = tx.slice(0, LIM).replace(/\s+\S*$/, '') + '\u2026';
        if (!o.querySelector('.ipr-ii-b')) botaoI(o, tx, extra);
      }
    });
  }
  function aplica(box){
    box.style.setProperty('left', POSL.x + 'px', 'important');
    box.style.setProperty('top', POSL.y + 'px', 'important');
    box.style.setProperty('right', 'auto', 'important');
    box.style.setProperty('bottom', 'auto', 'important');
  }
  W.__tpPosL = function(x, y){ var b = D.getElementById('ipr-lgd'); POSL = { x: x, y: y }; if (b) aplica(b); };
  function arrasta(e){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var pai = box.offsetParent; if (!pai) return;
    e.preventDefault(); e.stopPropagation();
    var rb = box.getBoundingClientRect(), k = box.offsetWidth ? rb.width / box.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, l0 = box.offsetLeft, t0 = box.offsetTop;
    var W0 = pai.clientWidth - box.offsetWidth - 4, H0 = pai.clientHeight - box.offsetHeight - 4;
    POSL = { x: l0, y: t0 }; aplica(box);
    D.documentElement.classList.add('tp-arrasta');
    function mexe(ev){
      POSL = { x: Math.round(Math.max(4, Math.min(l0 + (ev.clientX - x0) / k, W0))), y: Math.round(Math.max(4, Math.min(t0 + (ev.clientY - y0) / k, H0))) };
      aplica(box);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    if (!box.querySelector(':scope > .tp-lpega')) {
      var pg = el('div', 'tp-lpega'); pg.title = 'Arrastar'; pg.appendChild(el('span'));
      pg.addEventListener('pointerdown', arrasta);
      box.insertBefore(pg, box.firstChild);
    }
    var mb = box.querySelector(':scope > .tp-lmin');
    if (!mb) {
      mb = el('button', 'tp-lmin'); mb.type = 'button';
      mb.addEventListener('click', function(ev){ ev.stopPropagation(); var h = box.querySelector(':scope > .h'); if (h) h.click(); });
      box.appendChild(mb);
    }
    var mn = box.classList.contains('min'), q = mn ? '+' : '\u2013';
    if (mb.textContent !== q) { mb.textContent = q; mb.title = mn ? 'Abrir a legenda' : 'Minimizar'; mb.setAttribute('aria-label', mb.title); }
    if (POSL) aplica(box);
    linhas(box);
  }
  var obs = null;
  (function liga(){
    var box = D.getElementById('ipr-lgd');
    if (!box) { setTimeout(liga, 600); return; }
    try { deco(); } catch (e) {}
    if (W.MutationObserver) {
      obs = new MutationObserver(function(){ obs.disconnect(); try { deco(); } catch (e) {} obs.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] }); });
      obs.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] });
    }
    setInterval(function(){ try { deco(); } catch (e) {} }, 1500);
  })();
})();

(function(){
  var D = document, aberto = false;
  function prox(){
    var bar = D.getElementById('tb-bar'), org = D.getElementById('ipr-be-cq-b');
    if (!bar) return;
    if (!org) return;
    var b = D.getElementById('tp-cq');
    if (!b) {
      b = D.createElement('button'); b.type = 'button'; b.id = 'tp-cq'; b.className = 'tp-cq';
      b.title = 'Camadas ligadas'; b.setAttribute('aria-label', 'Camadas ligadas');
      b.innerHTML = '\u003csvg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="m12 3 9 5-9 5-9-5z"/>\u003cpath d="m3 13 9 5 9-5"/>\u003c/svg>\u003cem>\u003c/em>';
      b.addEventListener('click', function(ev){
        ev.stopPropagation();
        var o = D.getElementById('ipr-be-cq-b'); if (!o) return;
        if (aberto) { aberto = false; return; }
        o.click();
        var p = D.getElementById('ipr-be-cqp');
        if (p) { if (!p.hidden) { var r = b.getBoundingClientRect(); p.style.left = Math.round(Math.max(8, r.left)) + 'px'; p.style.top = Math.round(r.bottom + 6) + 'px'; } }
      });
    }
    if (bar.firstElementChild !== b) bar.insertBefore(b, bar.firstChild);
    var n = org.querySelector('.ipr-be-n'), em = b.querySelector('em'), v = n ? n.textContent : '';
    if (em.textContent !== v) em.textContent = v;
    b.hidden = org.hidden;
  }
  window.addEventListener('pointerdown', function(e){ var t = e.target; if (!t.closest) return; if (!t.closest('#tp-cq')) return; var p = D.getElementById('ipr-be-cqp'); aberto = p ? !p.hidden : false; }, true);
  var k = 0;
  (function ciclo(){ try { prox(); } catch (e) {} k++; setTimeout(ciclo, k > 60 ? 1000 : 300); })();
})();

(function(){
  var D = document, OPV = 100, ABRE = false;
  function marca(n){ if (n) { if (n.id === 'ipr-lgd') n.__iprJanb = 1; } }
  try {
    marca(D.getElementById('ipr-lgd'));
    var mo0 = new MutationObserver(function(ms){ ms.forEach(function(m){ [].forEach.call(m.addedNodes, function(n){ if (n.nodeType === 1) { marca(n); if (n.querySelector) marca(n.querySelector('#ipr-lgd')); } }); }); if (D.getElementById('ipr-lgd')) mo0.disconnect(); });
    mo0.observe(D.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  function esconderJanb(box){
    var r = box.getBoundingClientRect();
    D.querySelectorAll('.ipr-janb').forEach(function(b){
      if (b.classList.contains('tp-janb-off')) return;
      var bl = parseFloat(b.style.left), bt = parseFloat(b.style.top), bw = b.offsetWidth || 96, bh = b.offsetHeight || 30;
      var xe = Math.max(4, Math.min(innerWidth - bw - 4, r.right - bw - 44)), ye = r.top - bh - 2; if (!(ye > 2)) ye = r.top + 4;
      if (Math.abs(bl - xe) > 3) return;
      if (Math.abs(bt - ye) > 3) return;
      b.classList.add('tp-janb-off');
    });
  }
  function aplica(box){ box.style.setProperty('opacity', String(OPV / 100), 'important'); }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    if (!box.__iprJanb) box.__iprJanb = 1;
    esconderJanb(box);
    var h = box.querySelector(':scope > .h');
    var fb = box.querySelector(':scope > .tp-lfade');
    if (!fb) {
      fb = D.createElement('button'); fb.type = 'button'; fb.className = 'tp-lfade'; fb.title = 'Transpar\u00eancia da legenda'; fb.setAttribute('aria-label', fb.title);
      fb.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">\u003ccircle cx="12" cy="12" r="8"/>\u003cpath d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>\u003c/svg>';
      fb.addEventListener('click', function(ev){ ev.stopPropagation(); ABRE = !ABRE; deco(); });
      box.appendChild(fb);
    }
    fb.classList.toggle('on', ABRE);
    var row = box.querySelector(':scope > .tp-lop');
    if (!row) {
      row = D.createElement('div'); row.className = 'tp-lop';
      var r = D.createElement('input'); r.type = 'range'; r.min = '35'; r.max = '100'; r.step = '5'; r.className = 'tp-lr'; r.setAttribute('aria-label', 'Transpar\u00eancia da legenda');
      var s = D.createElement('span'); s.className = 'tp-lp';
      row.appendChild(r); row.appendChild(s);
      r.addEventListener('input', function(){ OPV = +r.value; pinta(row); aplica(box); });
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel'].forEach(function(k){ row.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
      if (h) { if (h.nextSibling) box.insertBefore(row, h.nextSibling); else box.appendChild(row); } else box.appendChild(row);
    } else if (h) { if (row.previousElementSibling !== h) box.insertBefore(row, h.nextSibling); }
    row.hidden = !ABRE;
    pinta(row);
    if (OPV !== 100) aplica(box);
  }
  function pinta(row){
    var r = row.querySelector('input'), s = row.querySelector('span');
    if (String(r.value) !== String(OPV)) r.value = String(OPV);
    r.style.setProperty('--v', ((OPV - 35) / 65 * 100) + '%');
    s.textContent = OPV + '%';
  }
  (function liga(){
    var box = D.getElementById('ipr-lgd');
    if (!box) { setTimeout(liga, 400); return; }
    try { deco(); } catch (e) {}
    var mo = new MutationObserver(function(){ mo.disconnect(); try { deco(); } catch (e) {} mo.observe(box, { childList: true }); });
    mo.observe(box, { childList: true });
    setInterval(function(){ try { deco(); } catch (e) {} }, 1000);
  })();
})();

(function(){
  var CR = [[/^limit/i, '#C9B27C'], [/^sat/i, '#8FB8DE'], [/^relev/i, '#C08A5B'], [/^clima/i, '#6FC6D8'], [/^veget/i, '#94BE39'], [/^popul/i, '#CFA083'], [/^risc/i, '#D9876C'], [/^europ/i, '#A99BD6'], [/^ocupa/i, '#D8C25A'], [/^.gua/i, '#4FA3D9'], [/^solo/i, '#A8805A']];
  function cores(){
    var cor = '';
    document.querySelectorAll('#tao > *').forEach(function(el){
      if (el.tagName === 'H5') {
        var t = (el.textContent || '').trim(); cor = '';
        CR.forEach(function(c){ if (!cor) { if (c[0].test(t)) cor = c[1]; } });
        if (cor) { if (el.style.getPropertyValue('--tc') !== cor) el.style.setProperty('--tc', cor); el.classList.add('tp-tc'); }
        return;
      }
      if (el.tagName !== 'LABEL') return;
      if (!cor) return;
      if (el.style.getPropertyValue('--k') !== cor) el.style.setProperty('--k', cor);
    });
  }
  var n = 0;
  (function ciclo(){ try { cores(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var niv = 0;
  function tao(){ return document.getElementById('tao'); }
  function aplicar(){
    var t = tao(); if (!t) return;
    t.classList.toggle('tp-n0', niv === 0);
    t.classList.toggle('tp-n1', niv === 1);
    if (niv === 2) t.classList.add('aberto'); else t.classList.remove('aberto');
    var ab = false, h = null;
    Array.prototype.forEach.call(t.children, function(el){
      if (el.tagName === 'H5') { ab = el.classList.contains('tp-ab'); h = el; h.__tpOn = 0; return; }
      if (el.tagName !== 'LABEL') return;
      el.classList.toggle('tp-vis', ab);
      var i = el.querySelector('input');
      if (h) { if (i) { if (i.checked) h.__tpOn = 1; } }
    });
    Array.prototype.forEach.call(t.querySelectorAll(':scope > h5'), function(x){ x.classList.toggle('tp-on', x.__tpOn === 1); });
  }
  window.addEventListener('click', function(e){
    var h = e.target.closest ? e.target.closest('#tao > h4, #tao > h5') : null;
    if (!h) return;
    if (h.tagName === 'H5') {
      if (niv !== 1) return;
      h.classList.toggle('tp-ab'); aplicar(); return;
    }
    e.stopImmediatePropagation(); e.preventDefault();
    niv = (niv + 1) % 3;
    if (niv === 0) Array.prototype.forEach.call(tao().querySelectorAll('h5.tp-ab'), function(x){ x.classList.remove('tp-ab'); });
    aplicar();
  }, true);
  window.addEventListener('change', function(e){ if (e.target.closest) { if (e.target.closest('#tao')) setTimeout(aplicar, 0); } }, true);
  var n = 0;
  (function ciclo(){ try { var t = tao(); if (t) { if (!t.__tpNiv) { t.__tpNiv = 1; aplicar(); } else aplicar(); } } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var B = [
    ['tp-crono-t', 'Cronologia: comparar o terreno em anos diferentes', '\u003csvg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/>\u003cpath d="M3.5 4.5v4h4"/>\u003cpath d="M12 7.5V12l3 2"/>\u003c/svg>', '.ipr-crono-b'],
    ['tp-net-t', 'Testar internet: verifica se chega para carregar as camadas', '\u003csvg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/>\u003ccircle cx="12" cy="19.5" r="1.2" fill="currentColor"/>\u003c/svg>', '#ipr-lig-b'],
    ['tp-pa-t', 'Pergunte ao Atlas', '\u003cspan class="tp-pa-ic">\u003csvg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">\u003cpath d="M4 5h16v11H9l-5 4z"/>\u003c/svg>\u003c/span>', '#ipr-pa-b']
  ];
  var R = {};
  function por(){
    var tema = document.getElementById('ipe-tema'); if (!tema) return;
    B.forEach(function(d){
      var b = R[d[0]];
      if (!b) {
        b = document.createElement('button'); b.type = 'button'; b.id = d[0]; b.className = 'ipe-ib tp-tb';
        b.title = d[1]; b.setAttribute('aria-label', d[1]); b.innerHTML = d[2];
        b.addEventListener('click', function(e){ e.preventDefault(); var o = document.querySelector(d[3]); if (o) o.click(); setTimeout(est, 50); });
        R[d[0]] = b;
      }
    });
    var a = R['tp-crono-t'], c = R['tp-net-t'], q = R['tp-pa-t'];
    if (tema.nextElementSibling !== a) tema.parentNode.insertBefore(a, tema.nextSibling);
    if (a.nextElementSibling !== q) tema.parentNode.insertBefore(q, a.nextSibling);
    if (c.nextElementSibling !== tema) tema.parentNode.insertBefore(c, tema);
    est();
  }
  function est(){
    B.forEach(function(d){
      var b = R[d[0]], o = document.querySelector(d[3]);
      if (!b) return;
      b.classList.toggle('tp-on', o ? o.getAttribute('aria-expanded') === 'true' : false);
    });
  }
  var n = 0;
  (function ciclo(){ try { por(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var L = null;
  function lingueta(){
    var ipe = document.getElementById('ipe'), cam = document.getElementById('ipe-camadas'), mapa = document.getElementById('ipe-mapa');
    if (!ipe) return; if (!cam) return; if (!mapa) return;
    if (!L) {
      L = document.createElement('button'); L.type = 'button'; L.id = 'tp-ling';
      L.addEventListener('click', function(e){ e.stopPropagation(); cam.click(); setTimeout(lingueta, 60); });
    }
    if (L.parentNode !== mapa) mapa.appendChild(L);
    var largo = window.innerWidth > 900, fechado = largo ? ipe.classList.contains('sem-esq') : !ipe.classList.contains('esq-aberto');
    var d = fechado ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7';
    var tt = fechado ? 'Abrir o painel das camadas' : 'Recolher o painel das camadas';
    if (L.getAttribute('data-d') !== d) {
      L.setAttribute('data-d', d); L.title = tt; L.setAttribute('aria-label', tt);
      L.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="' + d + '"/>\u003c/svg>';
    }
    L.hidden = largo ? false : !fechado;
  }
  var n = 0;
  (function ciclo(){ try { lingueta(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ try { lingueta(); } catch (e) {} });
})();

(function(){
  var IC = {fundo: '\u003cpath d="m12 3 9 5-9 5-9-5z"/>\u003cpath d="m3 13 9 5 9-5"/>', prop: '\u003cpath d="M4 4h16v16H4z" stroke-dasharray="3 2.5"/>\u003ccircle cx="12" cy="12" r="1.6"/>', cond: '\u003cpath d="M12 3l8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6z"/>', agua: '\u003cpath d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'};
  var RG = [['fundo', /^fundo/i, '#B9B4A2'], ['prop', /^propr/i, '#C9B27C'], ['cond', /^condic/i, '#D9876C'], ['agua', /^.gua/i, '#4FA3D9']];
  var SVG0 = '\u003csvg class="tp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var niv = 0;
  function g(){ return document.getElementById('tes'); }
  function aplicar(){
    var t = g(); if (!t) return;
    t.classList.toggle('tp-n0', niv === 0);
    t.classList.toggle('tp-n1', niv === 1);
    if (niv === 2) t.classList.add('aberto'); else t.classList.remove('aberto');
    var ab = false, h = null, cor = '';
    Array.prototype.forEach.call(t.children, function(el){
      if (el.tagName === 'H5') {
        h = el; h.__tpOn = 0; ab = el.classList.contains('tp-ab'); cor = '';
        var tx = (el.textContent || '').trim();
        RG.forEach(function(r){ if (!cor) { if (r[1].test(tx)) { cor = r[2]; if (!el.querySelector('.tp-ic')) el.insertAdjacentHTML('afterbegin', SVG0 + IC[r[0]] + '\u003c/svg>'); } } });
        if (cor) { if (el.style.getPropertyValue('--tc') !== cor) el.style.setProperty('--tc', cor); el.classList.add('tp-tc'); }
        return;
      }
      if (el.tagName !== 'LABEL') return;
      el.classList.toggle('tp-vis', ab);
      if (cor) { if (el.style.getPropertyValue('--k') !== cor) el.style.setProperty('--k', cor); }
      var i = el.querySelector('input');
      if (h) { if (i) { if (i.checked) h.__tpOn = 1; } }
    });
    Array.prototype.forEach.call(t.querySelectorAll(':scope > h5'), function(x){ x.classList.toggle('tp-on', x.__tpOn === 1); });
  }
  window.addEventListener('click', function(e){
    var h = e.target.closest ? e.target.closest('#tes > h4, #tes > h5') : null;
    if (!h) return;
    if (h.tagName === 'H5') { if (niv !== 1) return; h.classList.toggle('tp-ab'); aplicar(); return; }
    e.stopImmediatePropagation(); e.preventDefault();
    niv = (niv + 1) % 3;
    if (niv === 0) Array.prototype.forEach.call(g().querySelectorAll('h5.tp-ab'), function(x){ x.classList.remove('tp-ab'); });
    aplicar();
  }, true);
  window.addEventListener('change', function(e){ if (e.target.closest) { if (e.target.closest('#tes')) setTimeout(aplicar, 0); } }, true);
  var n = 0;
  (function ciclo(){ try { aplicar(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ });
})();

(function(){
  var L = null;
  function aba(){
    var ipe = document.getElementById('ipe'), pn = document.getElementById('ipe-pn'), mapa = document.getElementById('ipe-mapa');
    if (!ipe) return; if (!pn) return; if (!mapa) return;
    if (!L) {
      L = document.createElement('button'); L.type = 'button'; L.id = 'tp-lingd';
      L.addEventListener('click', function(e){ e.stopPropagation(); pn.click(); setTimeout(aba, 60); });
    }
    if (L.parentNode !== mapa) mapa.appendChild(L);
    var fechado = ipe.classList.contains('sem-dir');
    var d = fechado ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
    var tt = fechado ? 'Abrir o painel da direita' : 'Recolher o painel da direita';
    if (L.getAttribute('data-d') !== d) {
      L.setAttribute('data-d', d); L.title = tt; L.setAttribute('aria-label', tt);
      L.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="' + d + '"/>\u003c/svg>';
    }
    L.hidden = !(window.innerWidth > 900);
  }
  var n = 0;
  (function ciclo(){ try { aba(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ try { aba(); } catch (e) {} });
})();

(function(){
  var KW = [[/topon/i, '#F5F4EE'], [/curvas/i, '#FFFFFF'], [/hipsom/i, '#94BE39'], [/picos/i, '#D8C25A'], [/relevo/i, '#C08A5B'], [/.gua/i, '#4FA3D9'], [/sat.lite/i, '#8FB8DE'], [/orto/i, '#C9B27C'], [/cadastr/i, '#F3E3B5']];
  var SEL = '';
  function lum(c){
    var m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return 1;
    return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255;
  }
  function corDe(li, nome){
    var sw = li.querySelector('.iac-sw'), c = '';
    if (sw) c = sw.style.backgroundColor || '';
    if (!c) {
      document.querySelectorAll('#tao label, #tes label').forEach(function(l){ if (!c) { if ((l.textContent || '').trim().indexOf(nome) === 0) c = l.style.getPropertyValue('--k'); } });
    }
    if (!c) KW.forEach(function(k){ if (!c) { if (k[0].test(nome)) c = k[1]; } });
    if (!c) c = '#94BE39';
    if (!(lum(c) >= 0.28)) c = '#8A8D82';
    return c;
  }
  function arruma(){
    var p = document.getElementById('ipr-be-cqp'); if (!p) return;
    p.querySelectorAll('li.ipr-cq-it').forEach(function(li){
      var nt = li.querySelector('.iac-nt'), n = li.querySelector('.ipr-cq-n');
      if (!nt) return; if (!n) return;
      var cur = (nt.textContent || '').trim();
      var full = nt.getAttribute('data-tp-base') === cur ? nt.getAttribute('data-tp-full') : cur;
      var m = full.match(/^(.*?)\s*\(([^)]*)\)/), base = m ? m[1] : full;
      nt.setAttribute('data-tp-full', full); nt.setAttribute('data-tp-base', base);
      if (!m) { var o = n.querySelector('.tp-sub'); if (o) o.remove(); }
      if (m) {
        if (nt.textContent !== base) nt.textContent = base;
        var sb = n.querySelector('.tp-sub');
        if (!sb) { sb = document.createElement('small'); sb.className = 'tp-sub'; nt.insertAdjacentElement('afterend', sb); }
        if (sb.textContent !== m[2]) sb.textContent = m[2];
      }
      var c = corDe(li, base);
      if (li.style.getPropertyValue('--lc') !== c) li.style.setProperty('--lc', c);
      if (!n.querySelector('.tp-bl')) { var b = document.createElement('span'); b.className = 'tp-bl'; n.insertBefore(b, n.firstChild); }
      var rem = li.querySelector('.iac-rem');
      li.classList.toggle('tp-fundo', rem ? rem.classList.contains('iac-off') : false);
      li.classList.toggle('tp-sel', (li.getAttribute('data-id') || base) === SEL);
    });
  }
  window.addEventListener('click', function(e){
    var n = e.target.closest ? e.target.closest('#ipr-be-cqp li.ipr-cq-it .ipr-cq-n') : null;
    if (!n) return;
    if (e.target.closest('button')) return;
    var li = n.closest('li'), id = li.getAttribute('data-id') || (li.querySelector('.iac-nt') || {}).textContent;
    SEL = SEL === id ? '' : id; arruma();
  }, true);
  var n = 0;
  (function ciclo(){ try { arruma(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 600 : 300); })();
})();

(function(){
  function conta(){
    var s = document.getElementById('ipe-locais'); if (!s) return;
    var h = s.parentElement.querySelector(':scope > .ipe-sbh'); if (!h) return;
    var u = document.getElementById('ipe-user'), nome = u ? (u.textContent || '').trim() : '';
    var txt = nome ? (nome + ' \u00b7 a sua conta') : 'sem sess\u00e3o \u00b7 entre para guardar';
    if (h.getAttribute('data-conta') !== txt) h.setAttribute('data-conta', txt);
    var av = h.querySelector('.tp-av');
    if (!av) { av = document.createElement('span'); av.className = 'tp-av'; var car = h.querySelector('.ipe-car'); if (car) car.insertAdjacentElement('afterend', av); else h.insertBefore(av, h.firstChild); }
    var ini = nome ? nome.charAt(0).toUpperCase() : '?';
    if (av.textContent !== ini) av.textContent = ini;
  }
  var n = 0;
  (function ciclo(){ try { conta(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var D = document, OPV = 100, ABRE = false;
  function aplica(){ var p = D.getElementById('ipr-be-cqp'); if (p) p.style.setProperty('opacity', String(OPV / 100), 'important'); }
  function pinta(row){
    var r = row.querySelector('input'), s = row.querySelector('span');
    if (String(r.value) !== String(OPV)) r.value = String(OPV);
    r.style.setProperty('--v', ((OPV - 35) / 65 * 100) + '%');
    s.textContent = OPV + '%';
  }
  function deco(){
    var sec = D.getElementById('ipr-cq'); if (!sec) return;
    var h = sec.querySelector(':scope > .ipr-cq-h'); if (!h) return;
    var fb = sec.querySelector(':scope > .tp-cqfade');
    if (!fb) {
      fb = D.createElement('button'); fb.type = 'button'; fb.className = 'tp-cqfade'; fb.title = 'Transpar\u00eancia do painel'; fb.setAttribute('aria-label', fb.title);
      fb.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">\u003ccircle cx="12" cy="12" r="8"/>\u003cpath d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>\u003c/svg>';
      fb.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault(); ABRE = !ABRE; deco(); });
      sec.appendChild(fb);
    }
    fb.classList.toggle('on', ABRE);
    var row = sec.querySelector(':scope > .tp-cqop');
    if (!row) {
      row = D.createElement('div'); row.className = 'tp-cqop';
      var r = D.createElement('input'); r.type = 'range'; r.min = '35'; r.max = '100'; r.step = '5'; r.className = 'tp-cqr'; r.setAttribute('aria-label', 'Transpar\u00eancia do painel');
      var s = D.createElement('span'); s.className = 'tp-cqp';
      row.appendChild(r); row.appendChild(s);
      r.addEventListener('input', function(){ OPV = +r.value; pinta(row); aplica(); });
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel'].forEach(function(k){ row.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
    }
    if (row.previousElementSibling !== h) sec.insertBefore(row, h.nextSibling);
    row.hidden = !ABRE;
    pinta(row);
    if (OPV !== 100) aplica();
  }
  var n = 0;
  (function ciclo(){ try { deco(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1000 : 300); })();
})();

(function(){
  /* Subgrupos (12/11): o titulo, o triangulo e a bola levam a cor do primeiro sub-item; mostra so o numero de camadas ligadas; a bola desliga tudo do subgrupo. */
  function sub(){
    document.querySelectorAll('#ipe-esq ul.ipr-lista').forEach(function(ul){
      var cab = null, cores = [], cor1 = '', cks = [], cksOn = [];
      function fecha(){
        if (!cab) return;
        var d = cab.querySelector(':scope > .tp-dots');
        if (!d) { d = document.createElement('span'); d.className = 'tp-dots'; var sm = cab.querySelector(':scope > small'); if (sm) cab.insertBefore(d, sm); else cab.appendChild(d); }
        var h = cores.map(function(c){ return '\u003ci style="background:' + c + '">\u003c/i>'; }).join('');
        if (d.getAttribute('data-h') !== h) { d.setAttribute('data-h', h); d.innerHTML = h; }
        /* 12/11: cada bola de cor desliga a sua camada */
        Array.prototype.forEach.call(d.children, function(x, i){ x.__ck = cksOn[i] || null; if (x.title !== (x.__ck ? 'Desligar ' + (x.__ck.__nm || '') : '')) x.title = x.__ck ? 'Desligar ' + (x.__ck.__nm || '') : ''; });
        if (!d.__tpCl) {
          d.__tpCl = 1;
          ['pointerdown', 'mousedown', 'touchstart'].forEach(function(k){ d.addEventListener(k, function(e){ if (e.target.__ck) e.stopPropagation(); }, { passive: true }); });
          d.addEventListener('click', function(e){
            var c = e.target.__ck; if (!c) return;
            e.stopPropagation(); e.preventDefault();
            if (c.checked) c.click();
            setTimeout(function(){ try { sub(); } catch (er) {} }, 50);
          });
        }
        cab.classList.toggle('tp-on', cores.length > 0);
        var sc = cor1 || cores[0] || '';
        if (sc) { if (cab.style.getPropertyValue('--sc') !== sc) cab.style.setProperty('--sc', sc); }
        var nl = cab.querySelector(':scope > .tp-nl');
        if (!nl) { nl = document.createElement('span'); nl.className = 'tp-nl'; cab.appendChild(nl); }
        var tx = cores.length ? String(cores.length) : '';
        if (nl.textContent !== tx) nl.textContent = tx;
        var b = cab.querySelector(':scope > .tp-sb');
        if (!b) {
          b = document.createElement('span'); b.className = 'tp-sb'; b.setAttribute('role', 'button'); b.tabIndex = 0;
          ['pointerdown', 'mousedown', 'touchstart'].forEach(function(k){ b.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
          b.addEventListener('click', function(e){
            e.stopPropagation(); e.preventDefault();
            var cs = b.__cks || [], alg = cs.some(function(c){ return c.checked; });
            /* Com camadas ligadas desliga todas; sem nenhuma, liga todas (12/11) */
            cs.forEach(function(c){ if (c.checked === alg) c.click(); });
            setTimeout(function(){ try { sub(); } catch (er) {} }, 50);
          });
        }
        if (b.parentNode !== cab) cab.appendChild(b);
        if (cab.lastElementChild !== b) cab.appendChild(b);
        b.__cks = cks.slice();
        var off = cores.length === 0;
        b.classList.toggle('off', off);
        var tt = off ? 'Ligar todas' : 'Desligar todas';
        if (b.title !== tt) { b.title = tt; b.setAttribute('aria-label', tt); }
      }
      Array.prototype.forEach.call(ul.children, function(li){
        if (li.classList.contains('ipr-sub')) { fecha(); cab = li; cores = []; cor1 = ''; cks = []; cksOn = []; return; }
        if (!cab) return;
        if (!li.classList.contains('ipr-it')) return;
        var k = li.style.getPropertyValue('--k');
        if (!cor1) cor1 = k || '';
        var ck = li.querySelector('input.ipr-ck');
        if (ck) { var nm = li.querySelector('.ipr-nome'); ck.__nm = nm ? (nm.firstChild ? nm.firstChild.textContent : nm.textContent).trim() : ''; cks.push(ck); if (ck.checked) { cores.push(k || '#94BE39'); cksOn.push(ck); } }
      });
      fecha();
    });
  }
  window.addEventListener('change', function(){ setTimeout(function(){ try { sub(); } catch (e) {} }, 0); }, true);
  var n = 0;
  (function ciclo(){ try { sub(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1200 : 400); })();
})();
(function(){
  var D = document, W = window, TAM = null, SIG = '';
  try { localStorage.removeItem('atl_lgd_tam'); } catch (e) {}
  function poe(box){
    if (!TAM) return;
    if (TAM.w) { box.style.setProperty('width', TAM.w + 'px', 'important'); box.style.setProperty('max-width', 'none', 'important'); box.style.setProperty('min-width', '160px', 'important'); }
    if (box.classList.contains('min')) { box.style.removeProperty('height'); box.style.removeProperty('max-height'); return; }
    if (TAM.h) { box.style.setProperty('height', TAM.h + 'px', 'important'); box.style.setProperty('max-height', 'none', 'important'); }
  }
  function puxa(e, lado){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var pai = box.offsetParent; if (!pai) return;
    e.preventDefault(); e.stopPropagation();
    var rb = box.getBoundingClientRect(), k = box.offsetWidth ? rb.width / box.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, w0 = box.offsetWidth, h0 = box.offsetHeight, l0 = box.offsetLeft, t0 = box.offsetTop;
    var maxW = pai.clientWidth - 8, maxH = pai.clientHeight - t0 - 6;
    if (W.__tpPosL) W.__tpPosL(l0, t0);
    TAM = { w: w0, h: TAM ? TAM.h : 0 };
    if (lado.indexOf('s') >= 0) TAM.h = h0;
    D.documentElement.classList.add('tp-arrasta');
    function mexe(ev){
      var dx = (ev.clientX - x0) / k, dy = (ev.clientY - y0) / k;
      if (lado.indexOf('e') >= 0) TAM.w = Math.round(Math.max(160, Math.min(w0 + dx, maxW - l0)));
      if (lado.indexOf('w') >= 0) {
        var nw = Math.round(Math.max(160, Math.min(w0 - dx, l0 + w0 - 4)));
        TAM.w = nw; if (W.__tpPosL) W.__tpPosL(l0 + w0 - nw, t0);
      }
      if (lado.indexOf('s') >= 0) TAM.h = Math.round(Math.max(90, Math.min(h0 + dy, maxH)));
      poe(box);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    ['e', 'w', 's', 'se'].forEach(function(l){
      if (box.querySelector(':scope > .tp-rz-' + l)) return;
      var h = D.createElement('div'); h.className = 'tp-rz tp-rz-' + l; h.title = 'Arrastar para mudar o tamanho';
      h.addEventListener('pointerdown', function(ev){ puxa(ev, l); });
      h.addEventListener('dblclick', function(ev){ ev.stopPropagation(); TAM = null; try { localStorage.removeItem('atl_lgd_tam'); } catch (e) {} ['width', 'max-width', 'min-width', 'height', 'max-height'].forEach(function(q){ box.style.removeProperty(q); }); });
      box.appendChild(h);
    });
    var hi = box.querySelector(':scope > .h i'), sg = (hi ? hi.textContent : '') + ':' + box.querySelectorAll('.c > .one, .c > .l').length;
    if (sg !== SIG) { SIG = sg; if (TAM) { TAM = null; ['width', 'max-width', 'min-width', 'height', 'max-height'].forEach(function(q){ box.style.removeProperty(q); }); } }
    box.classList.toggle('tp-rzon', !!TAM);
    poe(box);
  }
  (function liga(){
    if (!D.getElementById('ipr-lgd')) { setTimeout(liga, 700); return; }
    try { deco(); } catch (e) {}
    var ob = null, bx = null;
    setInterval(function(){
      try { deco(); } catch (e) {}
      var b = D.getElementById('ipr-lgd');
      if (b !== bx) { if (ob) ob.disconnect(); bx = b; if (b) { if (W.MutationObserver) { ob = new MutationObserver(function(){ if (!bx.querySelector(':scope > .tp-rz-e')) { try { deco(); } catch (e) {} } }); ob.observe(b, { childList: true }); } } }
    }, 1200);
  })();
})();
(function(){
  var RX = /^Entre\s+(\S+)\s+e\s+(\S+)$/;
  function curto(){
    document.querySelectorAll('#ipr-lgd .ipr-ii-auto .ii-r > span').forEach(function(s){
      if (s.getAttribute('data-tp-c')) return;
      var m = RX.exec((s.textContent || '').trim());
      s.setAttribute('data-tp-c', '1');
      if (!m) return;
      s.title = s.textContent; s.textContent = m[1] + ' \u2013 ' + m[2];
    });
  }
  setInterval(function(){ try { curto(); } catch (e) {} }, 900);
})();
(function(){
  var D = document;
  var NUM = /^[\u003c>]?\s*-?\d/;
  var ORD = /muito|alt[oa]|m\u00e9di|baix|elevad|reduzid|moderad/i;
  function nums(t){ return t.match(/-?\d+(?:[.,]\d+)?/g) || []; }
  function cor(r){ var s = r.querySelector('s'); if (!s) return ''; var c = s.style.backgroundColor || ''; return c; }
  function txt(r){ var s = r.querySelector('span'); if (!s) return ''; return (s.getAttribute('title') || s.textContent || '').trim(); }
  function curto(r){ var s = r.querySelector('span'); return s ? (s.textContent || '').trim() : ''; }
  function el(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function titulo(a){ var e = a.previousElementSibling; while (e) { if (e.classList.contains('one')) return e; if (e.classList.contains('l')) return e; if (e.classList.contains('ipr-ii-auto')) return null; e = e.previousElementSibling; } return null; }
  function faz(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var ant = '';
    box.querySelectorAll('.c > .ipr-ii-auto').forEach(function(a){
      if (getComputedStyle(a).display === 'none') { if (!a.classList.contains('tp-b1')) return; }
      var rs = [].slice.call(a.querySelectorAll(':scope > .ii-r'));
      if (!rs.length) return;
      var sig = rs.map(function(r){ return cor(r) + '=' + curto(r); }).join('|');
      if (a.getAttribute('data-tp-b') === sig) { ant = (rs.length > 1) ? sig : ''; return; }
      a.setAttribute('data-tp-b', sig);
      var v = a.querySelector(':scope > .tp-b'); if (v) v.remove();
      a.classList.remove('tp-b1', 'tp-bm');
      a.classList.add('tp-bx');
      a.title = rs.map(txt).join('\n');
      var uc = {}; rs.forEach(function(r){ uc[cor(r)] = 1; });
      if (rs.length === 1 || Object.keys(uc).length === 1) {
        a.classList.add('tp-b1');
        var t = titulo(a), c = cor(rs[0]);
        if (t) { var sw = t.querySelector(':scope > s'); if (sw) { if (c) sw.style.background = c; } }
        ant = ''; return;
      }
      var b = el('div', 'tp-b');
      if (sig === ant) { a.classList.add('tp-bm'); b.appendChild(el('em', 'tp-me', 'mesma escala de cima')); a.appendChild(b); return; }
      ant = sig;
      var labs = rs.map(curto), cs = rs.map(cor);
      var tudoNum = labs.every(function(l){ return NUM.test(l); });
      var dif = {}; labs.forEach(function(l){ dif[l] = 1; });
      var tudoOrd = labs.every(function(l){ return ORD.test(l); });
      if (Object.keys(dif).length !== labs.length) tudoOrd = false;
      if (labs.length === 2) tudoOrd = false;
      labs = labs.map(function(l){ var k = l.indexOf(', '); var r = k > 0 ? l.slice(0, k) : l; return r.replace(/^Entre\s+(\S+)\s+e\s+(\S+)$/, '$1 \u2013 $2'); });
      if (tudoNum) {
        var g = el('div', 'tp-bg'); g.style.background = 'linear-gradient(90deg,' + cs.join(',') + ')'; b.appendChild(g);
        var n0 = nums(labs[0]), n1 = nums(labs[labs.length - 1]);
        var e0 = n0.length ? n0[0] : labs[0], e1 = n1.length ? n1[n1.length - 1] : labs[labs.length - 1];
        if (/^\s*>/.test(labs[labs.length - 1])) e1 = e1 + '+';
        var gl = el('div', 'tp-gl'); gl.appendChild(el('span', '', e0)); gl.appendChild(el('span', '', e1)); b.appendChild(gl);
      } else if (tudoOrd) {
        var sg = el('div', 'tp-seg'); cs.forEach(function(c){ var i = el('i'); i.style.background = c; sg.appendChild(i); }); b.appendChild(sg);
        var gl2 = el('div', 'tp-gl'); gl2.appendChild(el('span', '', labs[0])); gl2.appendChild(el('span', '', labs[labs.length - 1])); b.appendChild(gl2);
      } else {
        var ch = el('div', 'tp-ch');
        var vis = {};
        rs.forEach(function(r, k){ var l = labs[k]; if (vis[l + cs[k]]) return; vis[l + cs[k]] = 1; var s = el('span'); var q = el('s'); q.style.background = cs[k] || 'transparent'; s.appendChild(q); s.appendChild(D.createTextNode(l)); ch.appendChild(s); });
        b.appendChild(ch);
      }
      a.appendChild(b);
    });
  }
  setInterval(function(){ try { faz(); } catch (e) {} }, 1000);
})();
(function(){
  var D = document;
  var NUM = /^[\u003c>]?\s*-?\d/;
  var ORD = /muito|alt[oa]|m\u00e9di|baix|elevad|reduzid|moderad/i;
  function nums(t){ return t.match(/-?\d+(?:[.,]\d+)?/g) || []; }
  function el(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function corImg(im){
    if (!im) return '';
    if (!im.complete) return null;
    if (!im.naturalWidth) return '';
    try {
      var cv = D.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      var x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      var d = x.getImageData(Math.floor(cv.width / 2), Math.floor(cv.height / 2), 1, 1).data;
      if (!(d[3] >= 20)) return '';
      return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    } catch (e) { return ''; }
  }
  function curta(l){ var k = l.indexOf(', '); var r = k > 0 ? l.slice(0, k) : l; return r.replace(/^Entre\s+(\S+)\s+e\s+(\S+)$/, '$1 \u2013 $2'); }
  function faz(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    box.querySelectorAll('.c > .l.ag-l').forEach(function(L){
      var rs = [].slice.call(L.querySelectorAll(':scope > .ag-r'));
      if (!rs.length) return;
      var labs = rs.map(function(r){ var s = r.querySelector('span'); return s ? (s.textContent || '').trim() : ''; });
      var sig = labs.join('|');
      if (L.getAttribute('data-tp-b') === sig) return;
      var cs = [], falta = false;
      rs.forEach(function(r){ var c = corImg(r.querySelector('img')); if (c === null) falta = true; cs.push(c || ''); });
      if (falta) return;
      L.setAttribute('data-tp-b', sig);
      var v = L.querySelector(':scope > .tp-b'); if (v) v.remove();
      L.classList.add('tp-agx');
      L.title = labs.join('\n');
      var b = el('div', 'tp-b');
      var dif = {}; labs.forEach(function(l){ dif[l] = 1; });
      var semCor = cs.some(function(c){ return !c; });
      var tudoNum = labs.every(function(l){ return NUM.test(l); });
      var tudoOrd = labs.every(function(l){ return ORD.test(l); });
      if (Object.keys(dif).length !== labs.length) { tudoOrd = false; tudoNum = false; }
      if (!(labs.length >= 3)) { tudoOrd = false; tudoNum = false; }
      if (semCor) { tudoOrd = false; tudoNum = false; }
      var cl = labs.map(curta);
      var uc2 = {}; cs.forEach(function(c){ uc2[c] = 1; });
      if (Object.keys(uc2).length === 1) { if (!semCor) { rs = rs.slice(0, 1); cl = cl.slice(0, 1); } }
      if (tudoNum) {
        var g = el('div', 'tp-bg'); g.style.background = 'linear-gradient(90deg,' + cs.join(',') + ')'; b.appendChild(g);
        var n0 = nums(cl[0]), n1 = nums(cl[cl.length - 1]);
        var gl = el('div', 'tp-gl'); gl.appendChild(el('span', '', n0.length ? n0[0] : cl[0])); gl.appendChild(el('span', '', (n1.length ? n1[n1.length - 1] : cl[cl.length - 1]) + (/^\s*>/.test(cl[cl.length - 1]) ? '+' : ''))); b.appendChild(gl);
      } else if (tudoOrd) {
        var sg = el('div', 'tp-seg'); cs.forEach(function(c){ var i = el('i'); i.style.background = c; sg.appendChild(i); }); b.appendChild(sg);
        var gl2 = el('div', 'tp-gl'); gl2.appendChild(el('span', '', cl[0])); gl2.appendChild(el('span', '', cl[cl.length - 1])); b.appendChild(gl2);
      } else {
        var ch = el('div', 'tp-ch'), vis = {};
        rs.forEach(function(r, k){ var l = cl[k]; if (vis[l]) return; vis[l] = 1; var s = el('span'); var im = r.querySelector('img'); if (im) { var q = im.cloneNode(); q.className = 'tp-im'; s.appendChild(q); } s.appendChild(D.createTextNode(l)); ch.appendChild(s); });
        b.appendChild(ch);
      }
      var bb = L.querySelector(':scope > b');
      if (bb) bb.insertAdjacentElement('afterend', b); else L.insertBefore(b, L.firstChild);
    });
  }
  setInterval(function(){ try { faz(); } catch (e) {} }, 1000);
})();
(function(){
  var D = document;
  function liga(i){
    var w = i.parentElement;
    if (!w.classList.contains('tp-bw')) {
      var cs = getComputedStyle(i);
      w = D.createElement('span'); w.className = 'tp-bw';
      w.style.flex = cs.flex; w.style.order = cs.order; w.style.margin = cs.margin;
      i.parentNode.insertBefore(w, i); w.appendChild(i);
    }
    if (w.querySelector(':scope > .tp-bx')) { w.classList.toggle('tp-cv', !!i.value); return; }
    var x = D.createElement('button'); x.type = 'button'; x.className = 'tp-bx';
    x.title = 'Apagar o que foi escrito'; x.setAttribute('aria-label', x.title); x.textContent = '\u00d7';
    x.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      i.value = '';
      ['input', 'search', 'change', 'keyup'].forEach(function(t){ try { i.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} });
      w.classList.remove('tp-cv'); i.focus();
    });
    i.addEventListener('input', function(){ w.classList.toggle('tp-cv', !!i.value); });
    w.appendChild(x);
    w.classList.toggle('tp-cv', !!i.value);
  }
  setInterval(function(){ try { D.querySelectorAll('input.ipr-busca').forEach(liga); } catch (e) {} }, 800);
})();
(function(){
  var D = document;
  function conta(box){
    var hs = box.querySelectorAll(':scope > h5');
    hs.forEach(function(h){
      var n = 0, e = h.nextElementSibling;
      while (e) {
        if (e.tagName === 'H5') break;
        if (e.tagName === 'H4') break;
        var cs = e.querySelectorAll('input[type=checkbox]');
        cs.forEach(function(c){ if (c.checked) n++; });
        e = e.nextElementSibling;
      }
      var b = h.querySelector(':scope > .tp-cnt');
      if (!b) { b = D.createElement('span'); b.className = 'tp-cnt'; b.innerHTML = String.fromCharCode(60)+'i>'+String.fromCharCode(60)+'/i>'+String.fromCharCode(60)+'b>'+String.fromCharCode(60)+'/b>'; h.appendChild(b); }
      var t = String(n);
      if (b.lastChild.textContent !== t) b.lastChild.textContent = t;
      b.classList.toggle('on', n > 0);
      b.title = n === 1 ? '1 camada ligada' : n + ' camadas ligadas';
    });
  }
  function corre(){ try { D.querySelectorAll('#tao, #tes').forEach(conta); } catch (e) {} }
  D.addEventListener('change', function(){ setTimeout(corre, 30); }, true);
  setInterval(corre, 900);
})();
(function(){
  var D = document, alvo = null, ro = null;
  function caixa(){
    var ids = ['ipr-ii', 'tp-lpop'];
    for (var i = 0; i !== ids.length; i++) { var c = D.getElementById(ids[i]); if (c) { if (!c.hidden) { if (c.offsetHeight) return c; } } }
    return null;
  }
  function poe(){
    if (!alvo) return;
    var L = D.getElementById('ipr-lgd'), c = caixa();
    if (!L) return; if (!c) return;
    if (!alvo.isConnected) return;
    var lr = L.getBoundingClientRect(), h = c.offsetHeight;
    var y = Math.max(8, lr.bottom - h);
    c.style.top = Math.round(y) + 'px'; c.style.bottom = 'auto';
  }
  window.__tpAlinha = function(b){
    alvo = b.closest('#ipr-lgd') ? b : null;
    if (!alvo) return;
    [0, 40, 150, 400, 900, 1600].forEach(function(t){ setTimeout(poe, t); });
    try {
      if (!ro) ro = new ResizeObserver(function(){ poe(); });
      ro.disconnect();
      var c = D.getElementById('ipr-ii'); if (c) ro.observe(c);
      var p2 = D.getElementById('tp-lpop'); if (p2) ro.observe(p2);
      var L = D.getElementById('ipr-lgd'); if (L) ro.observe(L);
    } catch (e) {}
  };
})();
(function(){
  var D = document, SV = 'http:' + String.fromCharCode(47, 47) + 'www.w3.org/2000/svg';
  var ICO = '0 0 24 24';
  function alvo(el){
    if (el.classList.contains('maplibregl-popup')) { var c = el.querySelector('.maplibregl-popup-content'); return c || el; }
    return el;
  }
  function visivel(el){ if (el.hidden) return false; var s = getComputedStyle(el); if (s.display === 'none') return false; if (s.visibility === 'hidden') return false; return el.offsetWidth > 0; }
  function opac(el){ el.style.setProperty('opacity', String((el.__tpO || 100) / 100), 'important'); }
  function mexe(el){
    var dx = el.__tpDx || 0, dy = el.__tpDy || 0;
    if (dx === 0) { if (dy === 0) { el.style.removeProperty('translate'); return; } }
    el.style.setProperty('translate', Math.round(dx) + 'px ' + Math.round(dy) + 'px', 'important');
  }
  function icone(){
    var s = D.createElementNS(SV, 'svg'); s.setAttribute('viewBox', ICO); s.setAttribute('width', '14'); s.setAttribute('height', '14'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.7');
    var c = D.createElementNS(SV, 'circle'); c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '8'); s.appendChild(c);
    var pa = D.createElementNS(SV, 'path'); pa.setAttribute('d', 'M12 4a8 8 0 0 1 0 16z'); pa.setAttribute('fill', 'currentColor'); s.appendChild(pa);
    return s;
  }
  function pinta(el, row){
    var r = row.querySelector('input'), s = row.querySelector('span'), v = el.__tpO || 100;
    if (String(r.value) !== String(v)) r.value = String(v);
    r.style.setProperty('--v', ((v - 35) / 65 * 100) + '%');
    s.textContent = v + '%';
  }
  function temFechar(t){
    var cs = t.querySelectorAll('button, [role=button], a');
    for (var i = 0; i !== cs.length; i++) {
      var c = cs[i]; if (c.closest('.tp-wtop')) continue;
      var tx = ((c.getAttribute('aria-label') || '') + ' ' + (c.title || '')).toLowerCase(), t2 = (c.textContent || '').trim();
      if (/fechar|cancelar|close|cancel/.test(tx)) return true;
      if (/^(\u00d7|\u2715|\u2716|x)$/i.test(t2)) return true;
    }
    return false;
  }
  function deco(el){
    var t = alvo(el);
    if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
    var top = t.querySelector(':scope > .tp-wtop');
    if (!top) {
      top = D.createElement('div'); top.className = 'tp-wtop';
      var fb = D.createElement('button'); fb.type = 'button'; fb.className = 'tp-wfade'; fb.title = 'Transpar\u00eancia'; fb.setAttribute('aria-label', fb.title); fb.appendChild(icone());
      var pg = D.createElement('div'); pg.className = 'tp-wpega'; pg.title = 'Arrastar (duplo clique rep\u00f5e)'; pg.appendChild(D.createElement('span'));
      top.appendChild(fb); top.appendChild(pg);
      var row = D.createElement('div'); row.className = 'tp-wop';
      var r = D.createElement('input'); r.type = 'range'; r.min = '35'; r.max = '100'; r.step = '5'; r.setAttribute('aria-label', 'Transpar\u00eancia');
      var sp = D.createElement('span');
      row.appendChild(r); row.appendChild(sp);
      top.appendChild(row);
      fb.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); el.__tpAb = !el.__tpAb; deco(el); });
      r.addEventListener('input', function(){ el.__tpO = +r.value; pinta(el, row); opac(el); });
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel', 'keydown'].forEach(function(k){ top.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
      var A = null;
      pg.addEventListener('pointerdown', function(e){ e.preventDefault(); A = { x: e.clientX, y: e.clientY, dx: el.__tpDx || 0, dy: el.__tpDy || 0 }; pg.classList.add('on'); try { pg.setPointerCapture(e.pointerId); } catch (x) {} });
      pg.addEventListener('pointermove', function(e){ if (!A) return; el.__tpDx = A.dx + e.clientX - A.x; el.__tpDy = A.dy + e.clientY - A.y; mexe(el); });
      function fim(e){ if (!A) return; A = null; pg.classList.remove('on'); try { pg.releasePointerCapture(e.pointerId); } catch (x) {} }
      pg.addEventListener('pointerup', fim); pg.addEventListener('pointercancel', fim);
      pg.addEventListener('dblclick', function(){ el.__tpDx = 0; el.__tpDy = 0; mexe(el); });
      if (!temFechar(t)) {
        var fx = D.createElement('button'); fx.type = 'button'; fx.className = 'tp-wx'; fx.title = 'Fechar'; fx.setAttribute('aria-label', 'Fechar'); fx.textContent = '\u00d7';
        fx.addEventListener('click', function(ev){
          ev.preventDefault(); ev.stopPropagation();
          /* 12/11: fechar pela propria app (medidas: volta a Navegar; Perfil: o seu Fechar), senao esconde */
          if (el.id === 'ipe-hud') { var nv = D.querySelector('#ipe [data-tool=nav]'); if (nv) nv.click(); setTimeout(function(){ if (el.classList.contains('on')) el.classList.remove('on'); }, 80); return; }
          if (el.id === 'ipr-pf') { var fe = Array.prototype.filter.call(el.querySelectorAll('button'), function(b){ return b.textContent.trim() === 'Fechar'; })[0]; if (fe) { fe.click(); return; } }
          el.hidden = true; el.style.display = 'none';
        });
        top.appendChild(fx);
      }
      t.insertBefore(top, t.firstChild);
    } else if (top !== t.firstElementChild) t.insertBefore(top, t.firstChild);
    top.querySelector('.tp-wfade').classList.toggle('on', !!el.__tpAb);
    var rw = top.querySelector('.tp-wop'); rw.hidden = !el.__tpAb; pinta(el, rw);
    if ((el.__tpO || 100) !== 100) opac(el);
    if (!el.__tpMo) {
      try {
        el.__tpMo = new MutationObserver(function(){ var tt = alvo(el); if (!tt.querySelector(':scope > .tp-wtop')) { try { deco(el); } catch (e) {} } });
        el.__tpMo.observe(el, { childList: true, subtree: true });
      } catch (e) {}
    }
  }
  function corre(){
    D.querySelectorAll('[id], .maplibregl-popup, [role=dialog]').forEach(function(el){
      /* 12/11: as janelas das ferramentas (Sol, Imagens historicas, Perfil, medidas) tambem levam pega e transparencia. */
      if (!el.__iprJanb) { if (!el.matches('#ipe-pan, #ipe-hud, #ipr-pf')) return; }
      if (el.id === 'ipr-lgd') return;
      if (!visivel(el)) return;
      try { deco(el); } catch (e) {}
    });
  }
  setInterval(corre, 700);
})();
(function(){
  /* 12/11/2026: assinatura Bug'Studio na barra de baixo do Atlas, no lugar de Web design Bug Studio. Mais pequena que o texto do IPR. */
  var RX = /Web design Bug.?Studio/i;
  function st(){
    if (document.getElementById('ipr-bs-css')) return;
    var s = document.createElement('style'); s.id = 'ipr-bs-css';
    s.textContent = '.ipr-bs-sig{font-family:inherit;font-weight:inherit;font-size:.7em;letter-spacing:inherit;text-transform:uppercase;white-space:nowrap}.ipr-bs-sig .o,.ipr-bs-sig .a{color:#94BE39}.ipr-bs-sig .o{margin-right:.35em}.ipr-rep{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;gap:5px!important;width:max-content!important;min-width:0!important;max-width:none!important;height:auto!important;flex:0 0 auto!important;white-space:nowrap!important;padding:4px 8px!important;letter-spacing:0!important;transition:none!important;animation:none!important}.ipr-rep>*{margin:0!important;flex:none!important}.ipr-rep:hover,.ipr-rep:focus{width:max-content!important;padding:4px 8px!important;transform:none!important}.ipr-rep:hover,.ipr-rep:hover *,.ipr-rep:focus-visible,.ipr-rep:focus-visible *{color:#94BE39!important}.ipr-rep-w{width:max-content!important;min-width:0!important;max-width:none!important;padding:0!important;flex:0 0 auto!important;left:auto}.ipr-rep svg{flex:none!important;color:#94BE39!important}.ipr-rep svg [stroke]:not([stroke=none]){stroke:#94BE39!important}.ipr-rep svg [fill]:not([fill=none]){fill:#94BE39!important}';
    document.head.appendChild(s);
  }
  function faz(){
    var s = document.createElement('span'); s.className = 'ipr-bs-sig';
    var o = document.createElement('span'); o.className = 'o'; o.textContent = '⦿';
    var a = document.createElement('span'); a.className = 'a'; a.textContent = "'";
    s.appendChild(o); s.appendChild(document.createTextNode('Bug')); s.appendChild(a); s.appendChild(document.createTextNode('Studio'));
    return s;
  }
  function corre(){
    if (!document.body) return;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, l = [];
    while ((n = w.nextNode())) { if (RX.test(n.nodeValue)) l.push(n); }
    l.forEach(function(n){
      var p = n.parentNode; if (!p) return;
      if (p.closest('.ipr-bs-sig')) return;
      st();
      var v = n.nodeValue, m = v.match(RX);
      p.insertBefore(document.createTextNode(v.slice(0, m.index)), n);
      p.insertBefore(faz(), n);
      p.insertBefore(document.createTextNode(v.slice(m.index + m[0].length)), n);
      p.removeChild(n);
    });
    document.querySelectorAll('a, span').forEach(function(e){
      if (e.closest('.ipr-bs-sig')) return;
      if (!/^\s*Bug.?Studio\s*$/i.test(e.textContent)) return;
      var t = e.previousSibling;
      if (!t) return;
      if (t.nodeType !== 3) return;
      if (!/Web design\s*$/i.test(t.nodeValue)) return;
      st();
      t.nodeValue = t.nodeValue.replace(/Web design\s*$/i, '');
      e.textContent = ''; e.appendChild(faz());
    });
  }
  function rep(){
    document.querySelectorAll('button, a, [role=button]').forEach(function(e){
      if (e.classList.contains('ipr-rep')) return;
      if (!/^\s*(Reportar( um)? problema|Report a problem)\s*$/i.test(e.textContent)) return;
      st(); e.classList.add('ipr-rep');
      var p = e.parentElement;
      if (p) { if (p.children.length === 1) p.classList.add('ipr-rep-w'); }
    });
  }
  /* 12/11: no inicio do texto IPR da barra de baixo, cursor-triangulo verde fixo (sem piscar) e as letras IPR a verde */
  function marca(){
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, l = [];
    while ((n = w.nextNode())) { if (/^\s*IPR\s*\u2013\s*Instituto/.test(n.nodeValue)) l.push(n); }
    l.forEach(function(n){
      var p = n.parentNode; if (!p) return;
      if (p.closest('.ipr-bs-ipr')) return;
      if (!document.getElementById('ipr-bs-ipr-css')) { var c = document.createElement('style'); c.id = 'ipr-bs-ipr-css'; c.textContent = '.ipr-bs-ipr{white-space:nowrap}.ipr-bs-ipr svg{display:inline-block;width:.62em;height:.68em;margin-right:.45em;vertical-align:baseline;fill:#94BE39}.ipr-bs-ipr b{font-weight:inherit;color:#94BE39}'; document.head.appendChild(c); }
      var v = n.nodeValue, i = v.indexOf('IPR');
      var s = document.createElement('span'); s.className = 'ipr-bs-ipr';
      var NS = 'http:' + String.fromCharCode(47, 47) + 'www.w3.org/2000/svg';
      var sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 6 6.6'); sv.setAttribute('aria-hidden', 'true');
      var pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', 'M0 6.6H6V0Z'); sv.appendChild(pa);
      var b = document.createElement('b'); b.textContent = 'IPR';
      s.appendChild(sv); s.appendChild(b);
      p.insertBefore(document.createTextNode(v.slice(0, i)), n);
      p.insertBefore(s, n);
      p.insertBefore(document.createTextNode(v.slice(i + 3)), n);
      p.removeChild(n);
    });
  }
  corre(); rep(); marca(); setInterval(function(){ corre(); rep(); marca(); }, 1500);
})();

/* Demonstracao do Atlas 2 (Ver como, Comunidade de exemplo): so corre na pagina de ensaio */
if (window.IPR_A2_DEMO) (function(){
  if (window.__cm) return; window.__cm = 1;
  var D = document, K = 'a2_modo', L = '\u003c';
  var V = { com: 'act', aviso: 1, menu: 0, mapa: 0, pub: 1, res: 0, cor: 3, sel: { t: ['Consultoria', 'Design de propriedade', 'Gest\u00e3o da \u00e1gua'], p: ['SIG e cartografia'] } };
  var TRAB = ['Consultoria', 'Assessoria', 'Acompanhamento t\u00e9cnico', 'Design de propriedade', 'Paisagismo', 'Permacultura', 'Agrofloresta', 'Keyline', 'Gest\u00e3o da \u00e1gua', 'Solos', 'Pastoreio', 'Floresta', 'Constru\u00e7\u00e3o em terra', 'Restauro ecol\u00f3gico', 'Fogo e preven\u00e7\u00e3o'];
  var TEC = ['SIG e cartografia', 'Levantamento de campo', 'Licenciamento', 'Charcas', 'Valas de infiltra\u00e7\u00e3o', 'Cobertura do solo', 'Pastoreio rotativo', 'Rega gota a gota', 'Planta\u00e7\u00e3o de \u00e1rvores', 'Sebes vivas', 'Biochar', 'Cultura sem mobiliza\u00e7\u00e3o', 'Recolha de \u00e1gua da chuva'];
  var CORES = ['#6f8f3a', '#2f7d5b', '#c9773f', '#a85a24', '#4f6fbf', '#8e5ea2', '#3f4630'];
  var IC = {
    doc: 'path d="M4 1.5h5.5L12.5 4.5V14.5H4z"/>' + L + 'path d="M9.5 1.5v3h3M6 8h4.5M6 10.5h4.5"/>',
    pin: 'path d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15z"/>' + L + 'circle cx="8" cy="6.5" r="1.8"/>',
    usr: 'circle cx="8" cy="5.5" r="2.8"/>' + L + 'path d="M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/>',
    grp: 'circle cx="5.5" cy="6" r="2.2"/>' + L + 'circle cx="11" cy="6" r="2.2"/>' + L + 'path d="M1.5 13.5c.6-2.3 2.2-3.4 4-3.4s3.4 1.1 4 3.4M9.5 10.3c.5-.2 1-.2 1.5-.2 1.8 0 3.4 1.1 4 3.4"/>',
    chk: 'path d="M3 8.5l3 3 7-7"/>'
  };
  function svg(k){ return L + 'svg viewBox="0 0 16 16">' + L + IC[k] + L + '/svg>'; }
  function modo(){ try { return localStorage.getItem(K) === 'intel' ? 'intel' : 'exp'; } catch (e) { return 'exp'; } }
  function h(tag, cls, txt, at){
    var e = D.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (at) Object.keys(at).forEach(function(k){ e.setAttribute(k, at[k]); });
    return e;
  }
  function ap(p){ [].slice.call(arguments, 1).forEach(function(c){ if (c) p.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); }); return p; }
  function ic(k){ var s = h('span', 'cm-ic'); s.innerHTML = svg(k); return s; }
  function btn(t, cls, at){ return h('button', 'cm-btn' + (cls ? ' ' + cls : ''), t, Object.assign({ type: 'button' }, at || {})); }
  function lbl(t){ return h('div', 'cm-l', t); }
  function txtB(parts){ var p = h('div'); parts.forEach(function(x){ if (typeof x === 'string') p.appendChild(D.createTextNode(x)); else p.appendChild(h('b', '', x[0])); }); return p; }
  function av(t, s){ return h('span', 'cm-av' + (s ? ' s' : ''), t); }
  function tg(t){ return h('span', 'cm-tg', t); }
  function ex(){ return h('div', 'cm-ex', 'Pr\u00e9 visualiza\u00e7\u00e3o \u00b7 dados de exemplo'); }

  function nav(){
    var n = h('div', 'ipc-nav cm-nav');
    [['act', 'Actividade'], ['perfil', 'Perfil'], ['pessoas', 'Pessoas'], ['grupos', 'Grupos'], ['notif', 'Avisos']].forEach(function(x){
      var b = h('button', '', x[1], { type: 'button', 'data-cm': x[0], 'aria-pressed': String(V.com === x[0] ? true : (V.com === 'ver' ? x[0] === 'pessoas' : false)) });
      if (x[0] === 'notif') { if (V.aviso) b.appendChild(h('span', 'cm-n', '1')); }
      n.appendChild(b);
    });
    return n;
  }
  function mapa(){
    var m = h('div', 'cm-mapa');
    var s = h('span', 'cm-sw' + (V.mapa ? ' on' : ''), null, { 'data-cm-mapa': '1', role: 'switch', 'aria-checked': String(!!V.mapa) });
    var t = h('div', '', 'Mapa comunit\u00e1rio', { 'data-cm-mapa': '1' });
    t.appendChild(h('small', 'cm-sub', 'Locais, pedidos e ofertas'));
    ap(m, s, t, btn('+ Publicar', '', { 'data-cm-nota': 'Publicar no mapa: escolhe um local, um pedido ou uma oferta.' }));
    return m;
  }
  function eu(){
    var hd = h('div', 'cm-hd'); var c = h('div'); c.style.flex = '1';
    ap(c, h('b', '', 'Perfil de exemplo'), h('div', 'cm-at', '@exemplo'));
    var pr = h('div', 'cm-pr', 'Perfil completo a 45%'); var bar = h('div', 'cm-bar'); var i = h('i'); i.style.width = '45%'; bar.appendChild(i); pr.appendChild(bar);
    c.appendChild(pr);
    var e2 = av('PE'); e2.style.background = CORES[V.cor]; e2.style.borderColor = 'rgba(245,244,238,.55)'; ap(hd, e2, c);
    return hd;
  }
  function act(){
    var f = D.createDocumentFragment();
    ap(f, mapa(), eu());
    var r = h('div'); r.style.cssText = 'text-align:right;margin-top:8px'; r.appendChild(btn('Completar perfil', 'o', { 'data-cm': 'perfil' })); f.appendChild(r);
    f.appendChild(lbl('Recente'));
    var a = h('div', 'cm-feed'); var t = txtB(['Convite de ', ['Membro de exemplo'], ' para ler o projecto ', ['Sub-bacia da Ribeira do Torgal'], '.']); t.appendChild(h('small', '', 'h\u00e1 19 dias')); ap(a, ic('doc'), t); f.appendChild(a);
    var b = h('div', 'cm-feed'); var u = h('div', '', 'Sem publica\u00e7\u00f5es no mapa comunit\u00e1rio perto dos seus terrenos.'); u.appendChild(h('small', '', 'Ligue o mapa comunit\u00e1rio para ver locais, pedidos e ofertas.')); ap(b, ic('pin'), u); f.appendChild(b);
    f.appendChild(lbl('Para come\u00e7ar'));
    [['usr', 'Seguir pessoas', 'Equipa IPR e vizinhos do seu concelho', 'Ver', 'pessoas'], ['grp', 'Juntar-se a um grupo', 'Por bacia, concelho ou tema', 'Ver', 'grupos'], ['pin', 'Publicar no mapa', 'Um local, um pedido ou uma oferta', 'Publicar', '']].forEach(function(x){
      var s = h('div', 'cm-sug'); var d = h('div', '', x[1]); d.appendChild(h('small', 'cm-sub', x[2]));
      ap(s, ic(x[0]), d, btn(x[3], '', x[4] ? { 'data-cm': x[4] } : { 'data-cm-nota': 'Publicar no mapa: escolhe um local, um pedido ou uma oferta.' }));
      f.appendChild(s);
    });
    return f;
  }
  function chips(lista, k, max){
    var w = h('div', 'cm-chs'); var n = 0;
    lista.forEach(function(t){
      var on = V.sel[k].indexOf(t) + 1;
      if (V['mais' + k]) { } else { if (n + 1 > max) return; }
      n++;
      w.appendChild(h('button', 'cm-ch' + (on ? ' on' : ''), t, { type: 'button', 'data-cm-ch': k, 'aria-pressed': String(!!on) }));
    });
    if (V['mais' + k]) { } else { if (lista.length > max) w.appendChild(h('button', 'cm-ch', '+ ' + (lista.length - max), { type: 'button', 'data-cm-mais': k, style: 'color:#B5D86A;border-style:dashed!important' })); }
    return w;
  }
  function campo(l, v, ph){ var f = h('div', 'cm-f'); f.appendChild(h('label', '', l)); var i = h('input', 'cm-in', null, { value: v || '', placeholder: ph || '' }); f.appendChild(i); return f; }
  function perfil(){
    var f = D.createDocumentFragment();
    var hd = h('div', 'cm-hd'); var c = h('div'); var t = h('div', 'cm-tags'); ap(t, tg('Intelligence'), tg('Equipa IPR'));
    ap(c, h('b', '', 'Perfil de exemplo'), h('div', 'cm-at', '@exemplo'), t);
    var a = av('PE'); a.style.background = CORES[V.cor]; a.style.borderColor = 'rgba(245,244,238,.55)'; ap(hd, a, c); f.appendChild(hd);
    f.appendChild(lbl('Identidade'));
    var fo = h('div', 'cm-f'); fo.appendChild(h('label', '', 'Fotografia'));
    var dz = h('label', 'cm-dz'); var sp = h('span'); sp.innerHTML = svg('usr').replace('svg ', 'svg width="14" height="14" style="stroke:#94BE39;fill:none;stroke-width:1.6" ');
    var fi = h('input', '', null, { type: 'file', accept: 'image/*', hidden: '' });
    ap(dz, sp, 'Escolher fotografia', h('span', '', '\u00b7 JPG ou PNG', { style: 'color:var(--mu2,#737761)' }), fi); fo.appendChild(dz); f.appendChild(fo);
    var dd = h('div', 'cm-2'); ap(dd, campo('Nome a mostrar', 'Perfil de exemplo'), campo('Alcunha', '@exemplo')); f.appendChild(dd);
    f.appendChild(campo('Concelho', '', 'Ex.: Mira'));
    f.appendChild(lbl('Trabalho')); f.appendChild(chips(TRAB, 't', 10));
    f.appendChild(lbl('T\u00e9cnicas que domina')); f.appendChild(chips(TEC, 'p', 5));
    f.appendChild(lbl('Cor do perfil'));
    var cs = h('div', 'cm-cores'); CORES.forEach(function(c, i){ var x = h('i', i === V.cor ? 'on' : '', null, { 'data-cm-cor': String(i), title: 'Cor ' + (i + 1) }); x.style.background = c; cs.appendChild(x); }); f.appendChild(cs);
    f.appendChild(lbl('Visibilidade'));
    [['pub', 'Perfil p\u00fablico', 'O perfil fica vis\u00edvel: outras pessoas podem ver, seguir e encontrar.'], ['res', 'Resumo semanal por e-mail', '']].forEach(function(x){
      var r = h('div', 'cm-tg2', null, { 'data-cm-tg': x[0] }); var d = h('div', '', x[1]); if (x[2]) d.appendChild(h('small', 'cm-sub', x[2]));
      ap(r, h('span', 'cm-sw' + (V[x[0]] ? ' on' : '')), d); f.appendChild(r);
    });
    var sv = h('div', 'cm-save'); ap(sv, h('span', '', 'Por guardar'), btn('Ver como os outros', '', { 'data-cm': 'ver' }), btn('Guardar', 'g', { 'data-cm-nota': 'Perfil guardado (exemplo).' }));
    f.appendChild(sv);
    return f;
  }
  function pessoas(){
    var f = D.createDocumentFragment();
    f.appendChild(h('input', 'cm-in', null, { type: 'search', placeholder: 'Nome, concelho ou interesse' }));
    var fl = h('div', 'cm-chs'); fl.style.marginTop = '8px';
    ['Todas', 'Equipa IPR', 'A seguir', 'Perto de mim'].forEach(function(t, i){ fl.appendChild(h('button', 'cm-ch' + (i ? '' : ' on'), t, { type: 'button' })); });
    f.appendChild(fl);
    var p = h('div', 'cm-pp', null, { 'data-cm': 'ver' }); var d = h('div'); ap(d, h('b', '', 'Membro de exemplo'), h('small', 'cm-sub', 'Equipa IPR \u00b7 Mira \u00b7 12 terrenos'));
    ap(p, av('ME', 1), d, btn(V.segue ? 'A seguir' : 'Seguir', 'o', { 'data-cm-seg': '1' })); f.appendChild(p);
    f.appendChild(lbl('A seguir'));
    f.appendChild(h('div', 'cm-sub', V.segue ? 'Membro de exemplo' : 'Ainda n\u00e3o segue ningu\u00e9m.'));
    return f;
  }
  function ver(){
    var f = D.createDocumentFragment();
    var bk = btn('\u2190 Pessoas', '', { 'data-cm': 'pessoas' }); bk.style.marginBottom = '10px'; f.appendChild(bk);
    var hd = h('div', 'cm-hd'); var c = h('div'); var t = h('div', 'cm-tags'); t.appendChild(tg('Equipa IPR'));
    ap(c, h('b', '', 'Membro de exemplo'), h('div', 'cm-at', '@membro-exemplo \u00b7 Mira'), t); ap(hd, av('ME'), c); f.appendChild(hd);
    var st = h('div', 'cm-st');
    [['12', 'terrenos'], ['340,5 ha', '\u00e1rea cartografada']].forEach(function(x){ var d = h('div'); ap(d, h('b', '', x[0]), h('small', '', x[1])); st.appendChild(d); });
    f.appendChild(st);
    f.appendChild(h('div', 'cm-sub', (V.segue ? '1 seguidor' : '0 seguidores') + ' \u00b7 0 a seguir'));
    f.appendChild(lbl('Conquistas'));
    var cq = h('div', 'cm-cq');
    ['Terreno cartografado', 'Leitor do territ\u00f3rio'].forEach(function(t){ var s = h('span'); s.innerHTML = svg('chk').replace('svg ', 'svg width="12" height="12" style="stroke:#94BE39;fill:none;stroke-width:2" '); s.appendChild(D.createTextNode(t)); cq.appendChild(s); });
    f.appendChild(cq);
    var ac = h('div', 'cm-acts');
    ap(ac, btn(V.segue ? 'A seguir' : 'Seguir', V.segue ? 'o' : 'g', { 'data-cm-seg': '1' }), btn('Mensagem', '', { 'data-cm-nota': 'Mensagem: abre uma conversa privada.' }), h('button', 'cm-dots', '\u00b7\u00b7\u00b7', { type: 'button', 'data-cm-menu': '1', 'aria-label': 'Mais op\u00e7\u00f5es' }));
    if (V.menu) { var m = h('div', 'cm-menu'); ap(m, h('button', '', 'Bloquear', { type: 'button', 'data-cm-nota': 'Bloquear: deixam de se ver na comunidade.' }), h('button', '', 'Denunciar', { type: 'button', 'data-cm-nota': 'Denunciar: a equipa IPR recebe o aviso.' })); ac.appendChild(m); }
    f.appendChild(ac);
    return f;
  }
  function grupos(){
    var f = D.createDocumentFragment();
    var vz = h('div', 'cm-vz', 'Ainda n\u00e3o h\u00e1 grupos.'); vz.appendChild(h('small', 'cm-sub', 'Grupos por bacia, concelho ou tema: vizinhos que partilham caminhos, \u00e1gua e preven\u00e7\u00e3o de fogos.')); f.appendChild(vz);
    f.appendChild(lbl('Criar um grupo'));
    f.appendChild(campo('Nome', '', 'Ex.: Bacia do Mira, Odemira'));
    var tf = h('div', 'cm-f'); tf.appendChild(h('label', '', 'Tipo')); var s = h('select', 'cm-in ipe-in'); ['Bacia hidrogr\u00e1fica', 'Concelho', 'Tema'].forEach(function(t){ s.appendChild(h('option', '', t)); }); tf.appendChild(s); f.appendChild(tf);
    var df = h('div', 'cm-f'); df.appendChild(h('label', '', 'Para qu\u00ea e para quem')); df.appendChild(h('textarea', 'cm-in', null, { rows: '3', placeholder: 'Objectivo do grupo e quem deve entrar' })); f.appendChild(df);
    var r = h('div', 'cm-tg2', null, { 'data-cm-tg': 'priv' }); var d = h('div', '', 'Grupo privado'); d.appendChild(h('small', 'cm-sub', 'S\u00f3 por convite')); ap(r, h('span', 'cm-sw' + (V.priv ? ' on' : '')), d); r.style.borderBottom = '0'; f.appendChild(r);
    var b = h('div'); b.style.textAlign = 'right'; b.appendChild(btn('Criar grupo', 'g', { 'data-cm-nota': 'Grupo criado (exemplo).' })); f.appendChild(b);
    return f;
  }
  function notif(){
    var f = D.createDocumentFragment();
    var a = h('div', 'cm-av-n'); var t = txtB([['Membro de exemplo'], ' enviou um convite para ler o projecto ', ['Sub-bacia da Ribeira do Torgal'], '.']);
    ap(t, h('small', '', 'h\u00e1 19 dias'), btn('Abrir projecto', 'o', { 'data-cm-nota': 'Abre o projecto partilhado no Atlas.' }));
    ap(a, ic('doc'), t); f.appendChild(a);
    f.appendChild(h('div', 'cm-sub', 'Sem mais avisos', { style: 'text-align:center' }));
    V.aviso = 0;
    return f;
  }
  function desenha(){
    var c = D.getElementById('ipe-com'); if (!c) return;
    var w = h('div', 'cm-demo');
    ap(w, ex(), nav());
    var corpo = { act: act, perfil: perfil, pessoas: pessoas, ver: ver, grupos: grupos, notif: notif }[V.com] || act;
    w.appendChild(corpo());
    w.appendChild(h('div', 'cm-nota', '', { 'aria-live': 'polite' }));
    c.innerHTML = ''; c.appendChild(w);
  }
  function bases(){
    var p = D.querySelector('#ipe-corpo .ipe-pane[data-pane=a2b]');
    if (p) return p;
    p = h('section', 'ipe-pane', null, { 'data-pane': 'a2b', hidden: '' });
    var w = h('div', 'cm-demo'); w.style.padding = '14px';
    ap(w, ex(), lbl('As minhas Bases'));
    var c = h('div', 'cm-card'); ap(c, h('div', 'cm-at', 'Projecto de demonstra\u00e7\u00e3o \u00b7 LiDAR'), h('b', '', 'Sub-bacia da Ribeira do Torgal (Mira)'), h('p', '', '16 409 ha de LiDAR da DGT tratados pelo IPR: relevo, declives, linhas de \u00e1gua, humidade, eros\u00e3o e curvas de n\u00edvel.'), btn('Abrir no mapa', 'g', { 'data-cm-nota': 'Abre a Base e liga as suas camadas.' }));
    w.appendChild(c);
    var v = h('div', 'cm-vz', 'As Bases que encomendar aparecem aqui.'); v.appendChild(h('small', 'cm-sub', 'Cada Base traz as camadas de relevo, \u00e1gua e cadastro do seu terreno.')); w.appendChild(v);
    w.appendChild(h('div', 'cm-nota', '', { 'aria-live': 'polite' }));
    p.appendChild(w);
    var corpo = D.getElementById('ipe-corpo'); if (corpo) corpo.appendChild(p);
    return p;
  }
  function tabs(){ return D.getElementById('ipe-tabs'); }
  function seleciona(t){
    var T = tabs(); if (!T) return;
    T.querySelectorAll('.ipe-tab').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    D.querySelectorAll('#ipe-corpo .ipe-pane').forEach(function(p){ p.hidden = p.dataset.pane !== t; });
  }
  function ativo(){ var b = D.querySelector('#ipe-tabs .ipe-tab[aria-selected=true]'); return b ? b.dataset.tab : ''; }
  function barra(){
    var T = tabs(); if (!T) return;
    var b = D.getElementById('cm-modo');
    if (!b) {
      b = h('div', '', null, { id: 'cm-modo' });
      var s = h('div', 'cm-seg');
      [['exp', 'Explorer'], ['intel', 'Intelligence']].forEach(function(x){ s.appendChild(h('button', '', x[1], { type: 'button', 'data-cm-modo': x[0] })); });
      ap(b, h('span', '', 'Ver como'), s);
    }
    if (b.nextSibling !== T) T.parentNode.insertBefore(b, T);
    var m = modo();
    b.querySelectorAll('[data-cm-modo]').forEach(function(x){ x.setAttribute('aria-pressed', String(x.dataset.cmModo === m)); });
    if (T.querySelector('[data-tab=a2b]')) { } else { var t = h('button', 'ipe-tab', 'Bases', { type: 'button', role: 'tab', 'data-tab': 'a2b', 'aria-selected': 'false' }); t.appendChild(h('i')); T.insertBefore(t, T.firstChild); }
  }
  function repoeCom(){
    var c = D.getElementById('ipe-com'); if (!c) return;
    if (c.querySelector('.cm-demo')) { var x = h('button', '', '', { type: 'button', 'data-com': 'pessoas', hidden: '' }); c.appendChild(x); x.click(); }
  }
  var ultimo = '';
  function aplica(){
    var m = modo();
    D.documentElement.classList.toggle('cm-intel', m === 'intel');
    barra();
    if (m === 'intel') {
      bases();
      var a = ativo();
      if (a === 'sobre') seleciona('a2b');
      var c = D.getElementById('ipe-com');
      if (c) { if (c.querySelector('.cm-demo')) { } else { desenha(); } }
    } else {
      if (ativo() === 'a2b') seleciona('enc');
      if (ultimo === 'intel') repoeCom();
    }
    ultimo = m;
  }
  function nota(el, t){ var w = el.closest('.cm-demo'); var n = w ? w.querySelector('.cm-nota') : null; if (n) n.textContent = t; }
  D.addEventListener('click', function(e){
    var t = e.target; if (t.closest) { } else return;
    var x = t.closest('[data-cm-modo]');
    if (x) { var antes = modo(); try { localStorage.setItem(K, x.dataset.cmModo); } catch (er) {} if (antes !== modo()) { try { window.parent.location.reload(); } catch (er) {} return; } if (x.dataset.cmModo === 'intel') { V.com = 'act'; } aplica(); return; }
    x = t.closest('#ipe-tabs .ipe-tab[data-tab=a2b]');
    if (x) { e.preventDefault(); e.stopImmediatePropagation(); bases(); seleciona('a2b'); return; }
    x = t.closest('#ipe-tabs .ipe-tab');
    if (x) { var p = D.querySelector('#ipe-corpo .ipe-pane[data-pane=a2b]'); if (p) p.hidden = true; var tb = tabs().querySelector('[data-tab=a2b]'); if (tb) tb.setAttribute('aria-selected', 'false'); return; }
    if (t.closest('.cm-demo')) { } else return;
    e.stopPropagation();
    if (t.closest('.cm-dz')) return;
    x = t.closest('[data-cm]'); if (x) { V.com = x.dataset.cm; V.menu = 0; desenha(); return; }
    x = t.closest('[data-cm-mapa]'); if (x) { V.mapa = V.mapa ? 0 : 1; desenha(); return; }
    x = t.closest('[data-cm-ch]'); if (x) { var k = x.dataset.cmCh, l = V.sel[k], i = l.indexOf(x.textContent); if (i + 1) l.splice(i, 1); else l.push(x.textContent); desenha(); return; }
    x = t.closest('[data-cm-mais]'); if (x) { V['mais' + x.dataset.cmMais] = 1; desenha(); return; }
    x = t.closest('[data-cm-cor]'); if (x) { V.cor = +x.dataset.cmCor; desenha(); return; }
    x = t.closest('[data-cm-tg]'); if (x) { var q = x.dataset.cmTg; V[q] = V[q] ? 0 : 1; desenha(); return; }
    x = t.closest('[data-cm-seg]'); if (x) { V.segue = V.segue ? 0 : 1; desenha(); return; }
    x = t.closest('[data-cm-menu]'); if (x) { V.menu = V.menu ? 0 : 1; desenha(); return; }
    x = t.closest('[data-cm-nota]'); if (x) { nota(x, x.dataset.cmNota); return; }
  }, true);
  var n = 0;
  (function ciclo(){ try { aplica(); } catch (e) {} n++; setTimeout(ciclo, n > 40 ? 900 : 250); })();
})();



/* Pacote 13/11: Converter A, Acesso A, falha do cookie (demo) */
(function(){
  if (window.__pk1) return; window.__pk1 = 1;
  function conv(){
  var c = document.getElementById('ipr-conv'); if (!c) return;
  document.documentElement.setAttribute('title', '');
  var fm = c.querySelector('.fm');
  if (fm) { if (c.querySelector('.fmn')) { } else { var n = document.createElement('div'); n.className = 'fmn'; n.innerHTML = '\u003ci>\u003c/i>AutoCAD, com cotas, layers e tracejados'; fm.after(n); } }
  var g = c.querySelector('.sai input[data-sai=gpkg]');
  if (g) { var s = g.parentNode.querySelector('span'); if (s.querySelector('.sp')) { } else { var b = document.createElement('em'); b.className = 'sp'; b.textContent = 'sempre'; s.insertBefore(b, s.querySelector('small')); } }
  var o = c.querySelector('#ipr-conv-p option[value="0"]'); if (o) o.textContent = 'Nenhum, o desenho j\u00e1 tem coordenadas';
  var ps = c.querySelectorAll('p.m'); var p = ps[ps.length - 1];
  if (p) { if (p.querySelector('b')) { var d = document.createElement('div'); d.className = 'ent'; d.innerHTML = '\u003cdiv>\u003cb>Entre na sua conta para converter.\u003c/b>A convers\u00e3o corre nos nossos servidores e os ficheiros ficam s\u00f3 para si.\u003c/div>\u003ca href="#">Entrar\u003c/a>'; p.replaceWith(d); } }
}
  function aces(){
  var S = document.querySelector('#ipe-corpo .ipe-pane[data-pane=sobre]'); if (!S) return;
  document.documentElement.setAttribute('title', '');
  S.querySelectorAll('.ipe-niveis td').forEach(function(td){ var t = td.textContent.trim(); if (t === '\u2713') td.className = 's'; else if (t === '\u2013') { td.className = 'n'; td.textContent = '\u2013'; } });
  var acc = S.querySelector('.ipe-acc');
  if (acc) { var b = acc.querySelectorAll('.ipe-b'); var w = document.createElement('div'); w.className = 'ac-cta'; var r = document.createElement('div'); r.className = 'r'; w.appendChild(b[0]); r.appendChild(b[1]); r.appendChild(b[2]); w.appendChild(r); b[3].className = 'lk'; w.appendChild(b[3]); acc.replaceWith(w); }
  var tabs = S.querySelectorAll('table.ipe-tab2'); var k = tabs[tabs.length - 1];
  if (k) { if (k.classList.contains('ipe-niveis')) { } else { k.className = 'ac-kb'; k.querySelectorAll('tr').forEach(function(tr){ var td = tr.children[0]; var ks = td.textContent.split('\u00b7').map(function(x){ return x.trim(); }); td.innerHTML = ''; ks.forEach(function(x){ var e = document.createElement('kbd'); e.textContent = x; td.appendChild(e); }); }); } }
}
  function corre(){ try { conv(); } catch (e) {} try { aces(); } catch (e) {} }
  var t = 0;
  new MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = 0; corre(); }, 80); }).observe(document.body, { childList: true, subtree: true });
  corre();
})();
/* 13/11 (revisão antes de produção): a resposta vazia às rotas social/* é só da página de ensaio; em produção a Comunidade usa as rotas verdadeiras */
if (window.IPR_A2_DEMO) (function(){
  if (window.__socOk) return; window.__socOk = 1;
  var f0 = window.fetch;
  window.fetch = function(u, o){
    var s = String(typeof u === 'string' ? u : (u ? u.url : ''));
    if (s.indexOf('/wp-json/tcd/v1/social/') === -1) return f0.apply(this, arguments);
    return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };
})();
/* 13/11: etiqueta do topo acompanha o modo (Explorer ou Intelligence) da página de ensaio; em produção a etiqueta continua a vir do nível do servidor */
if (window.IPR_A2_DEMO) (function(){
  if (window.__nivOk) return; window.__nivOk = 1;
  function poe(){
    var e = document.querySelector('.ipe-top .ipe-nivel'); if (!e) return;
    var t = document.documentElement.classList.contains('cm-intel') ? 'Intelligence' : 'Explorer';
    if (e.textContent !== t) e.textContent = t;
    e.classList.toggle('cm-niv-i', t === 'Intelligence');
  }
  new MutationObserver(poe).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  setInterval(poe, 1000);
  poe();
})();
/* Pacote 2 13/11: Base Cartografica A, botao Comprar A */
(function(){
  if (window.__pk2) return; window.__pk2 = 1;
  function bc(){
  var f = document.getElementById('ipe-form'); if (!f) return;
  f.querySelectorAll('.ipe-h.n6-sec').forEach(function(h){ var b = h.querySelector('b'); if (b) { b.remove(); h.textContent = h.textContent.replace(/^[\s\u00b7]+/, ''); } });
}
  function cp(){
  var b = document.getElementById('ipr-as-b'); if (!b) return;
  if (b.querySelector('.cp-et')) return;
  if (b.querySelector('.cp-min')) return;
  var tx = b.children[1]; if (!tx) return;
  tx.innerHTML = '';
  var et = document.createElement('span'); et.className = 'cp-et'; et.innerHTML = 'Base\u003ci>/\u003c/i>Leitura\u003ci>/\u003c/i>Planta';
  var l = document.createElement('span'); l.className = 'cp-l1'; l.textContent = 'Comprar passo a passo';
  tx.appendChild(et); tx.appendChild(l);
  var m = document.createElement('span'); m.className = 'cp-min'; m.title = 'Reduzir'; m.setAttribute('role', 'button'); m.setAttribute('aria-label', 'Reduzir'); b.appendChild(m);
  b.setAttribute('aria-label', 'Base, Leitura ou Planta. Comprar passo a passo');
  m.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); b.classList.add('cp-mini'); b.title = 'Comprar: Base, Leitura ou Planta'; });
  b.addEventListener('click', function(e){ if (b.classList.contains('cp-mini')) { b.classList.remove('cp-mini'); b.title = 'Abrir o assistente de compra'; } }, true);
  try { localStorage.removeItem('a2_cp_mini'); } catch (e) {}
}
  var cpAb = false;
  function cpVis(){ var c = document.getElementById('ipr-as-pn'); if (!c) return false; if (c.hidden) return false; var s = getComputedStyle(c); if (s.display === 'none') return false; if (s.visibility === 'hidden') return false; return c.getClientRects().length > 0; }
  function janela(){ var v = cpVis(); if (cpAb) { if (!v) { var b = document.getElementById('ipr-as-b'); if (b) { b.classList.add('cp-mini'); b.title = 'Comprar: Base, Leitura ou Planta'; } } } cpAb = v; }
  setInterval(function(){ var b = document.getElementById('ipr-as-b'); if (!b) return; if (!b.classList.contains('cp-mini')) return; b.classList.remove('cp-pisca'); void b.offsetWidth; b.classList.add('cp-pisca'); setTimeout(function(){ b.classList.remove('cp-pisca'); }, 1900); }, 480000);
  function corre(){ try { bc(); } catch (e) {} try { cp(); } catch (e) {} try { janela(); } catch (e) {} }
  var t = 0;
  new MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = 0; corre(); }, 80); }).observe(document.body, { childList: true, subtree: true });
  corre();
})();
/* Pacote 3 13/11: ao desenhar o terreno as abas ficam abertas */
(function(){
  if (window.__terOk) return; window.__terOk = 1;
  function solta(){
    var R = document.getElementById('ipe'); if (!R) return;
    var st = document.getElementById('ipe-st');
    if (st) R.style.setProperty('--a2-rod', Math.round(st.getBoundingClientRect().height) + 'px');
    if (R.classList.contains('ipr-cp-foco')) {
      R.classList.remove('ipr-cp-foco');
      [60, 320].forEach(function(ms){ setTimeout(function(){ try { window.__ipe.mapa.resize(); } catch (e) {} }, ms); });
    }
  }
  function liga(){
    var R = document.getElementById('ipe'); if (!R) { setTimeout(liga, 400); return; }
    new MutationObserver(solta).observe(R, { attributes: true, attributeFilter: ['class'] });
    solta();
  }
  window.addEventListener('resize', solta);
  liga();
})();
(function(){
  function el(t, c, x){ var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function val(q){ var e = document.querySelector(q); return e ? (e.value || e.textContent || '').trim() : ''; }
  function arruma(st){
    if (st.getAttribute('data-mx') === '1') return;
    if (st.className.indexOf('erro') === -1) return;
    var t = st.textContent;
    if (t.indexOf('10 000 ha') === -1) return;
    var area = val('#ipr-cp-ct .ipr-cp-ar strong');
    var nome = val('#ipe-nome');
    var mail = val('#ipe-form [name=email]');
    var tel = val('#ipe-form [name=telefone]');
    var corpo = 'Bom dia,\n\nGostaria de pedir um or\u00e7amento para a Base Cartogr\u00e1fica de um terreno com mais de 10 000 ha.\n\n' +
      '\u00c1rea: ' + (area || 'acima de 10 000 ha') + '\n' +
      'Nome: ' + nome + '\n' + 'E-mail: ' + mail + '\n' + (tel ? 'Telefone: ' + tel + '\n' : '') +
      '\nO terreno foi desenhado no IPR Atlas.\n\nObrigado.';
    var assunto = 'Pedido de or\u00e7amento \u00b7 Base Cartogr\u00e1fica' + (area ? ' \u00b7 ' + area : '');
    var href = 'mailto:info@regenerativo.pt?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
    st.setAttribute('data-mx', '1');
    st.className = 'ipe-estado erro ipr-mx';
    st.textContent = '';
    st.appendChild(el('span', 'ipr-mx-k', '\u00c1rea acima do limite autom\u00e1tico'));
    st.appendChild(el('strong', 'ipr-mx-t', 'Para terrenos com mais de 10\u00a0000\u00a0ha preparamos um or\u00e7amento \u00e0 medida.'));
    st.appendChild(el('p', 'ipr-mx-p', 'Envie-nos o pedido por e-mail. Os dados do terreno j\u00e1 v\u00e3o preenchidos e a equipa responde com a proposta.'));
    var a = el('a', 'ipr-mx-b', 'Pedir or\u00e7amento por e-mail');
    a.href = href;
    st.appendChild(a);
    var m = el('a', 'ipr-mx-m', 'info@regenerativo.pt');
    m.href = 'mailto:info@regenerativo.pt';
    st.appendChild(m);
  }
  function liga(){
    var st = document.getElementById('ipe-estado');
    if (!st) { setTimeout(liga, 800); return; }
    new MutationObserver(function(){
      if (st.getAttribute('data-mx') === '1') {
        if (st.className.indexOf('ipr-mx') === -1 || !st.querySelector('.ipr-mx-b')) st.removeAttribute('data-mx'); else return;
      }
      arruma(st);
    }).observe(st, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    arruma(st);
  }
  liga();
})();
(function(){
  var NS = 'http:\u002f\u002fwww.w3.org/2000/svg';
  function sv(t, a, pai){ var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (pai) pai.appendChild(e); return e; }
  function poe(){
    var g = document.querySelector('.ipe-rosa-r');
    if (!g) return;
    if (g.querySelector('.n2')) return;
    var n = sv('g', { 'class': 'n2' }, g);
    var m = sv('mask', { id: 'ipr-rosa-m' }, n);
    sv('rect', { width: '100', height: '100', fill: '#fff' }, m);
    sv('circle', { cx: '50', cy: '50', r: '7', fill: '#000' }, m);
    sv('circle', { cx: '50', cy: '50', r: '44', fill: 'none', stroke: '#F5F4EE', 'stroke-width': '4.5' }, n);
    var a = sv('g', { mask: 'url(#ipr-rosa-m)' }, n);
    sv('polygon', { points: '50,12 59,50 41,50', fill: '#94BE39' }, a);
    sv('polygon', { points: '50,88 59,50 41,50', fill: '#94BE39', 'fill-opacity': '.38' }, a);
  }
  var t = 0;
  new MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = 0; poe(); }, 80); }).observe(document.body, { childList: true, subtree: true });
  poe();
})();
(function(){
  var NS = 'http:\u002f\u002fwww.w3.org/2000/svg';
  function v(i){ var mn = parseFloat(i.min || 0), mx = parseFloat(i.max || 100), x = parseFloat(i.value); var p = Math.round(x); if (mx !== 100) p = Math.round((x - mn) * 100 / (mx - mn)); i.style.setProperty('--v', Math.round((x - mn) * 100 / (mx - mn)) + '%'); var s = i.parentNode.querySelector('.ipr-op-v'); if (s) s.textContent = Math.round(x) + ' %'; }
  function icone(){
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('width', '14'); s.setAttribute('height', '14'); s.setAttribute('aria-hidden', 'true');
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '8'); c.setAttribute('cy', '8'); c.setAttribute('r', '6.2'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', 'currentColor'); c.setAttribute('stroke-width', '1.4'); s.appendChild(c);
    var h = document.createElementNS(NS, 'path'); h.setAttribute('d', 'M8 1.8a6.2 6.2 0 0 1 0 12.4z'); h.setAttribute('fill', 'currentColor'); s.appendChild(h);
    return s;
  }
  function poe(){
    var j = document.querySelector('#ipr-cp-ct .ipr-jan');
    if (!j) return;
    var i = j.querySelector('input[type=range]');
    if (!i) return;
    if (j.getAttribute('data-op') === '1') { v(i); return; }
    j.setAttribute('data-op', '1');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ipr-op-b'; b.title = 'Transpar\u00eancia'; b.setAttribute('aria-label', 'Transpar\u00eancia'); b.appendChild(icone());
    var cx = document.createElement('span'); cx.className = 'ipr-op-cx';
    var s = document.createElement('span'); s.className = 'ipr-op-v';
    j.insertBefore(b, i); cx.appendChild(i); cx.appendChild(s); j.appendChild(cx);
    b.addEventListener('click', function(e){ e.stopPropagation(); j.classList.toggle('op-on'); });
    cx.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(){ j.classList.remove('op-on'); });
    i.addEventListener('input', function(){ v(i); });
    v(i);
  }
  var t = 0;
  new MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = 0; poe(); }, 120); }).observe(document.body, { childList: true, subtree: true });
  poe();
})();
(function(){
  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t.closest) return;
    var sw = t.closest('.ipr-gc > .ipr-gsw');
    if (!sw) return;
    var gc = sw.parentNode;
    var gt = gc.querySelector('.ipr-gt');
    if (!gt) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    gt.click();
  }, true);
})();

;/* ===== a2-js ===== */
(function(){
  /* Menu de ferramentas A2 (11/11/2026): duas colunas, 5 grupos, sem barra lateral e sem Mais.
     Move os botoes existentes (nao os recria), por isso as funcoes e os estados aria-pressed continuam os da app. */
  var D = document;
  var GR = [
    ['[data-tool=nav]', '[data-tool=regua]', '[data-tool=area]', '#ipr-perfil-b', '[data-tool=desenhar]', '#tp-borracha'],
    ['[data-tool=marcador]', '[data-tool=importar]', '[data-tool=parcelas]', '#ipr-pp-aqui'],
    ['[data-tool=sol]', '[data-tool=historico]', '[data-tool="3d"]'],
    ['[data-tool=visita]', '[data-tool=foto]'],
    ['SLOT', '.maplibregl-ctrl-zoom-in', '[data-tool=gps]', '.maplibregl-ctrl-zoom-out', '.tb-q', '.ipr-78']
  ];
  /* Borracha (12/11/2026): faz o mesmo que o botao Apagar do quadro Terrenos no mapa
     (carrega no Apagar do ultimo terreno da lista). Desactivada enquanto nao houver terreno. */
  function borracha(T){
    var b = D.getElementById('tp-borracha');
    if (!b) {
      b = D.createElement('button'); b.type = 'button'; b.id = 'tp-borracha'; b.className = 'ipe-t';
      b.title = 'Apagar terreno'; b.setAttribute('aria-label', 'Apagar terreno');
      var SV = 'http:' + String.fromCharCode(47, 47) + 'www.w3.org/2000/svg';
      var sv = D.createElementNS(SV, 'svg'); sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '1.7'); sv.setAttribute('stroke-linecap', 'round'); sv.setAttribute('stroke-linejoin', 'round');
      ['m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21', 'M22 21H7', 'm5 11 9 9'].forEach(function(d){ var pa = D.createElementNS(SV, 'path'); pa.setAttribute('d', d); sv.appendChild(pa); });
      b.appendChild(sv);
      b.addEventListener('click', function(){ var as = D.querySelectorAll('#ipe [data-px-a="apagar"]'); if (as.length) as[as.length - 1].click(); setTimeout(function(){ borracha(T); }, 60); });
      T.appendChild(b);
    }
    var off = !D.querySelector('#ipe [data-px-a="apagar"]');
    if (b.disabled !== off) b.disabled = off;
  }
  function arruma(){
    var T = D.querySelector('#ipe .ipe-tools'); if (!T) return;
    T.classList.add('tp-a2');
    borracha(T);
    var ref = T.querySelector(':scope > .tp-pega');
    GR.forEach(function(sels, gi){
      var g = T.querySelector(':scope > .tp-a2g[data-g="' + gi + '"]');
      if (!g) {
        g = D.createElement('div'); g.className = 'ipe-tg tp-a2g'; g.setAttribute('data-g', String(gi));
        var antes = gi === 0 ? (ref ? ref.nextSibling : T.firstChild) : T.querySelector(':scope > .tp-a2g[data-g="' + (gi - 1) + '"]').nextSibling;
        T.insertBefore(g, antes);
      }
      var els = sels.map(function(s, si){
        if (s === 'SLOT') { var sl = g.querySelector(':scope > .tp-rslot') || T.querySelector('.tp-rslot'); if (!sl) { sl = D.createElement('span'); sl.className = 'tp-rslot'; } return sl; }
        var b = T.querySelector(s) || D.querySelector('#ipe ' + s);
        if (b) return b;
        /* Botao ainda nao criado pela app: casa vazia, para a caixa nao mudar de altura quando ele chegar. */
        var vz = g.querySelector(':scope > .tp-vz[data-i="' + si + '"]');
        if (!vz) { vz = D.createElement('span'); vz.className = 'tp-vz'; vz.setAttribute('data-i', String(si)); }
        return vz;
      }).filter(Boolean);
      g.querySelectorAll(':scope > .tp-vz').forEach(function(v){ if (els.indexOf(v) === -1) v.remove(); });
      var certo = els.length === g.children.length;
      if (certo) els.forEach(function(e, i){ if (g.children[i] !== e) certo = false; });
      if (!certo) els.forEach(function(e){ g.appendChild(e); });
    });
    /* A rosa fica no seu contentor (.ipr-nav), que a app volta a usar; so se coloca por cima da casa reservada. */
    var nav = T.querySelector(':scope > .ipr-nav'), slot = T.querySelector('.tp-rslot');
    if (nav) { if (slot) {
      nav.classList.add('tp-a2nav');
      /* Acerto pela diferenca entre a casa e a posicao actual da rosa: funciona com qualquer contentor (Safari incluido). */
      var sr = slot.getBoundingClientRect(), nr = nav.getBoundingClientRect();
      var x0 = parseFloat(nav.style.getPropertyValue('left')) || 0, y0 = parseFloat(nav.style.getPropertyValue('top')) || 0;
      if (nav.style.getPropertyValue('left') === '') { x0 = nav.offsetLeft; y0 = nav.offsetTop; }
      var x = Math.round(x0 + sr.left - nr.left), y = Math.round(y0 + sr.top - nr.top);
      if (nav.style.getPropertyValue('left') !== x + 'px') nav.style.setProperty('left', x + 'px', 'important');
      if (nav.style.getPropertyValue('top') !== y + 'px') nav.style.setProperty('top', y + 'px', 'important');
    } }
  }
  /* Corre no head do iframe: um observador arruma a caixa logo que a app a cria (sem mostrar a versao antiga).
     Depois de 15 s fica so a verificacao a cada 500 ms. */
  var pend = false;
  function agenda(){ if (pend) return; pend = true; requestAnimationFrame(function(){ pend = false; try { arruma(); } catch (e) {} }); }
  try {
    var mo = new MutationObserver(agenda);
    mo.observe(D.documentElement, { childList: true, subtree: true });
    setTimeout(function(){ mo.disconnect(); }, 15000);
  } catch (e) {}
  /* Janelas das ferramentas (Sol, Imagens historicas, Perfil, medidas): encostadas a esquerda da caixa,
     com a base alinhada pela base da caixa. Respeita o arrastar (translate de __tpDx/__tpDy). */
  /* Caixa das medidas compacta (12/11, proposta 2): textos mais curtos; o resto e CSS. A app volta a escrever a caixa, por isso repete-se. */
  function hudCurto(){
    var h = D.getElementById('ipe-hud'); if (!h) return;
    /* Proposta B Tabela (12/11): valor e segundo dado em duas linhas, nome a esquerda e valor a direita */
    var v = h.querySelector(':scope > .v');
    if (v) {
      var h5 = h.querySelector(':scope > h5'), ehArea = h5 ? h5.textContent.indexOf('\u00c1rea') === 0 : false;
      var sm = v.querySelector('small'), val = v.firstChild ? v.firstChild.textContent : '', sub = sm ? sm.textContent : '';
      var a1 = ehArea ? '\u00e1rea' : 'dist\u00e2ncia', a2 = ehArea ? 'per\u00edmetro' : 'segmentos';
      var b2 = ehArea ? sub.replace('per\u00edmetro ', '') : sub.split(' ')[0];
      var k = a1 + '|' + val + '|' + b2;
      var tb = h.querySelector(':scope > .tp-mtab');
      if (!tb) { tb = D.createElement('div'); tb.className = 'tp-mtab'; v.parentNode.insertBefore(tb, v.nextSibling); }
      if (tb.__k !== k) {
        tb.__k = k; tb.textContent = '';
        [[a1, val], [a2, b2]].forEach(function(l){ var x = D.createElement('span'); x.textContent = l[0]; var y = D.createElement('b'); y.textContent = l[1]; tb.appendChild(x); tb.appendChild(y); });
      }
    }
    /* Ajuda numa linha; a verde a pulsar enquanto a medicao nao esta fechada */
    var p = h.querySelector(':scope > p');
    if (p) {
      var t = p.textContent, t2 = t, pul = false;
      if (t.indexOf('Para fechar') > -1) { t2 = 'Feche no 1\u00ba ponto.'; pul = true; }
      else if (t.indexOf('Para acabar') > -1) { t2 = 'Acabe no \u00faltimo ponto.'; pul = true; }
      else if (t.indexOf('Feche no') === 0) { pul = true; }
      else if (t.indexOf('Acabe no') === 0) { pul = true; }
      else if (t.indexOf('Medi\u00e7\u00e3o terminada') === 0) { t2 = 'Medi\u00e7\u00e3o terminada.'; }
      if (t2 !== t) { p.title = t; p.textContent = t2; }
      if (p.classList.contains('tp-pulsa') !== pul) p.classList.toggle('tp-pulsa', pul);
    }
    var d = h.querySelector('[data-med=desf]'); if (d) { if (d.textContent !== 'Desfazer') { d.textContent = 'Desfazer'; d.title = 'Desfazer ponto'; } }
    if (!h.__tpHo) { try { h.__tpHo = new MutationObserver(function(){ hudCurto(); }); h.__tpHo.observe(h, { childList: true, subtree: true, characterData: true }); } catch (e) {} }
  }
  /* Janela do Sol (proposta B): marca a janela, poe azimute e altura em numeros e a escala por baixo da barra.
     Classes tp-solH e tp-solD nos rotulos para o Safari antigo, sem :has. */
  function solB(){
    var pan = D.getElementById('ipe-pan'); if (!pan) return;
    var r = pan.querySelector('#ipe-sol-r');
    pan.classList.toggle('tp-solB', !!r);
    if (!r) return;
    var h = pan.querySelector('#ipe-sol-h'), d = pan.querySelector('#ipe-sol-d');
    if (h) { if (h.parentElement !== pan) h.parentElement.classList.add('tp-solH'); }
    if (d) { if (d.parentElement !== pan) d.parentElement.classList.add('tp-solD'); }
    var n = pan.querySelector(':scope > .tp-soln');
    if (!n) { n = D.createElement('div'); n.className = 'tp-soln'; pan.appendChild(n); }
    var es = pan.querySelector(':scope > .tp-solesc');
    if (!es) {
      es = D.createElement('div'); es.className = 'tp-solesc';
      var mn = +r.min || 4, mx = +r.max || 22;
      [mn, 6, 12, 18, mx].forEach(function(v){ var s = D.createElement('span'); s.textContent = v + 'h'; s.style.left = ((v - mn) / (mx - mn) * 100) + '%'; es.appendChild(s); });
      pan.appendChild(es);
      r.addEventListener('input', function(){ setTimeout(solB, 0); });
    }
    var i = pan.querySelector('#ipe-sol-i'), t = i ? i.textContent : '';
    var m = /Azimute\s+(-?[0-9]+)\u00b0.*altura\s+(-?[0-9]+)\u00b0/.exec(t);
    var chave = m ? (m[1] + '|' + m[2]) : 'baixo';
    if (n.getAttribute('data-k') !== chave) {
      n.setAttribute('data-k', chave); n.textContent = '';
      if (m) {
        [['azimute ', m[1]], ['altura ', m[2]]].forEach(function(par){ var s = D.createElement('span'); s.appendChild(D.createTextNode(par[0])); var b = D.createElement('b'); b.textContent = par[1] + '\u00b0'; s.appendChild(b); n.appendChild(s); });
      } else { var s2 = D.createElement('span'); s2.textContent = 'sol abaixo do horizonte'; n.appendChild(s2); }
    }
  }
  var JAN = ['#ipe-hud', '#ipr-pf', '#ipe-pan'];
  /* 12/11: cada janela leva o icone da ferramenta a verde antes da transparencia, e o cursor do IPR no canto (pisca a cada 10 s) */
  var JANF = { '#ipe-pan': ['sol', 'historico'], '#ipr-pf': [], '#ipe-hud': ['regua', 'area', 'desenhar', 'marcador', 'visita', 'foto'] };
  var ULT = {};
  D.addEventListener('click', function(ev){
    var b = ev.target.closest ? ev.target.closest('.tp-a2g > *') : null; if (!b) return;
    var t = b.getAttribute('data-tool');
    if (b.id === 'ipr-perfil-b') ULT['#ipr-pf'] = b;
    Object.keys(JANF).forEach(function(k){ if (JANF[k].indexOf(t) > -1) ULT[k] = b; });
  }, true);
  function fonteIcone(sel){
    if (sel === '#ipr-pf') return D.getElementById('ipr-perfil-b');
    var r = null;
    JANF[sel].forEach(function(t){ if (r) return; var b = D.querySelector('.tp-a2g [data-tool=\"' + t + '\"]'); if (b) { if (b.getAttribute('aria-pressed') === 'true') r = b; } });
    return r || ULT[sel] || null;
  }
  function marcas(){
    JAN.forEach(function(sel){
      var el = D.querySelector(sel); if (!el) return;
      var top = el.querySelector(':scope > .tp-wtop');
      if (top) {
        var src = fonteIcone(sel), ic = top.querySelector(':scope > .tp-wic');
        if (!src) { if (ic) ic.remove(); }
        else if (!ic) { ic = null; }
        if (src) {
          if (!ic) { ic = D.createElement('span'); ic.className = 'tp-wic'; top.insertBefore(ic, top.firstChild); }
          if (ic.__src !== src) { ic.__src = src; ic.textContent = ''; var sv = src.querySelector('svg'); if (sv) ic.appendChild(sv.cloneNode(true)); ic.title = src.title || src.getAttribute('aria-label') || ''; }
        }
      }
      if (!el.querySelector(':scope > i.tp-cu')) { var cu = D.createElement('i'); cu.className = 'tp-cu'; cu.setAttribute('aria-hidden', 'true'); el.appendChild(cu); }
    });
  }
  setInterval(function(){
    var n = 0;
    (function pisca(){
      Array.prototype.forEach.call(D.querySelectorAll('i.tp-cu'), function(c){ c.style.backgroundColor = (n % 2) ? '' : '#0B0C0A'; });
      n++; if (n !== 6) setTimeout(pisca, 530);
    })();
  }, 10000);
  /* 12/11: o cartao do projecto de demonstracao LiDAR passa para depois da Base Cartografica (fim da lista do grupo Relevo) */
  function demoFim(){
    Array.prototype.forEach.call(D.querySelectorAll('.ipr-g[data-g=\"lidar\"] ul.ipr-lista'), function(ul){
      var c = ul.querySelector(':scope > li.ipr-dl'); if (!c) return;
      if (ul.lastElementChild !== c) ul.appendChild(c);
    });
  }
  /* 12/11: bola do grupo como grafico circular a verde: parte ligada = camadas ligadas / camadas do grupo.
     Com o grupo fechado usa o numero do cabecalho e o total visto da ultima vez que esteve aberto. */
  var TOT = {};
  function pies(){
    Array.prototype.forEach.call(D.querySelectorAll('#ipe-esq .ipr-g'), function(g){
      var sw = g.querySelector('.ipr-gc input.ipr-gsw'); if (!sw) return;
      var k = g.getAttribute('data-g') || '', on = 0, tot = 0;
      var cks = Array.prototype.filter.call(g.querySelectorAll('ul.ipr-lista input.ipr-ck'), function(c){ return !c.disabled; });
      if (cks.length) { tot = cks.length; on = cks.filter(function(c){ return c.checked; }).length; TOT[k] = tot; }
      else { var nn = g.querySelector('.ipr-gc .ipr-n'); on = nn ? (parseInt(nn.textContent, 10) || 0) : 0; tot = TOT[k] || 0; }
      var pf = sw.checked ? 100 : (tot ? Math.round(Math.min(on, tot) * 100 / tot) : 50);
      if (!sw.indeterminate) { if (!sw.checked) pf = 0; }
      if (sw.style.getPropertyValue('--pf') !== pf + '%') sw.style.setProperty('--pf', pf + '%');
    });
  }
  function encosta(){
    try { pies(); } catch (e) {}
    try { demoFim(); } catch (e) {}
    try { marcas(); } catch (e) {}
    try { hudCurto(); } catch (e) {}
    try { solB(); } catch (e) {}
    var T = D.querySelector('#ipe .ipe-tools.tp-a2'); if (!T) return;
    var M = D.getElementById('ipe-mapa') || D.body, mr = M.getBoundingClientRect(), tr = T.getBoundingClientRect();
    if (!tr.width) return;
    /* Varias janelas abertas: ficam lado a lado para a esquerda, 8 px entre elas, todas com a base alinhada. */
    var baseX = tr.left;
    JAN.forEach(function(sel){
      /* 12/11: o Perfil de elevacao fica na posicao da app (em baixo, ao centro), nao encostado as ferramentas */
      if (sel === '#ipr-pf') {
        /* 12/11: o Perfil nunca passa por cima da barra de baixo; se for mais alto que o mapa, ganha barra de deslocamento */
        var pf = D.querySelector(sel); if (!pf) return; if (pf.offsetWidth === 0) return;
        var lim = mr.bottom - 8, mh = Math.floor(lim - (mr.top + 8));
        if (pf.style.getPropertyValue('max-height') !== mh + 'px') { pf.style.setProperty('max-height', mh + 'px', 'important'); pf.style.setProperty('overflow-y', 'auto', 'important'); }
        var pr = pf.getBoundingClientRect();
        if (pr.bottom > lim + 0.5) { var py = parseFloat(getComputedStyle(pf).top) || 0; pf.style.setProperty('top', Math.round(py - (pr.bottom - lim)) + 'px', 'important'); pf.style.setProperty('bottom', 'auto', 'important'); }
        return;
      }
      var e = D.querySelector(sel); if (!e) return;
      if (e.offsetWidth === 0) return;
      var cs = getComputedStyle(e); if (cs.display === 'none') return; if (cs.visibility === 'hidden') return;
      if (!e.__tpEnc) { e.style.setProperty('right', 'auto', 'important'); e.style.setProperty('bottom', 'auto', 'important'); e.style.setProperty('transform', 'none', 'important'); e.style.setProperty('margin', '0', 'important'); e.__tpEnc = 1; }
      /* Janela mais larga que o espaco livre a esquerda da caixa: encolhe para caber. */
      var livre = Math.floor(baseX - 8 - (mr.left + 8));
      if (livre > 200) { if (e.style.getPropertyValue('max-width') !== livre + 'px') { e.style.setProperty('max-width', livre + 'px', 'important'); e.style.setProperty('box-sizing', 'border-box', 'important'); } }
      var r = e.getBoundingClientRect(), dx = e.__tpDx || 0, dy = e.__tpDy || 0;
      var alvoX = Math.max(mr.left + 8, baseX - 8 - r.width), alvoY = Math.max(mr.top + 8, tr.bottom - r.height);
      baseX = alvoX;
      var x0 = parseFloat(cs.left) || 0, y0 = parseFloat(cs.top) || 0;
      var x = Math.round(x0 + alvoX - (r.left - dx)), y = Math.round(y0 + alvoY - (r.top - dy));
      if (Math.abs(x - x0) > 0.5) e.style.setProperty('left', x + 'px', 'important');
      if (Math.abs(y - y0) > 0.5) e.style.setProperty('top', y + 'px', 'important');
    });
  }
  (function ciclo2(){ try { encosta(); } catch (e) {} setTimeout(ciclo2, 250); })();
  (function ciclo(){ try { arruma(); } catch (e) {} setTimeout(ciclo, 500); })();
})();

;/* ===== c2-js ===== */

(function () {
  var LUPA = '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4 4M6.5 4.5v4M4.5 6.5h4"/></svg>';
  var aberto = null, pop = null;
  function cls(el, c, on) { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }
  function esq() { return document.getElementById('ipe-esq'); }
  function txtNome(li) {
    var n = li.querySelector('.ipr-nome'); if (!n) return '';
    var t = ''; n.childNodes.forEach(function (c) { if (c.nodeType === 3) t += c.nodeValue; });
    return t.trim();
  }
  function caixa() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.id = 'c2-pop'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = '<button type="button" class="c2-x" aria-label="Fechar">\u00d7</button><b></b><span></span>';
    document.body.appendChild(pop);
    pop.querySelector('.c2-x').addEventListener('click', function () { fecha(); });
    return pop;
  }
  function liDe(id) { var e = esq(); return e ? e.querySelector('.ipr-it[data-id="' + id + '"]') : null; }
  function posiciona() {
    if (!aberto || !pop) return;
    var li = liDe(aberto), e = esq();
    if (!li || !li.querySelector('.c2-i')) { fecha(); return; }
    var re = e.getBoundingClientRect(), rl = li.getBoundingClientRect();
    if (rl.bottom < re.top || rl.top > re.bottom) { pop.style.visibility = 'hidden'; return; }
    pop.style.visibility = '';
    pop.style.left = (re.right + 12) + 'px';
    pop.style.top = Math.max(8, rl.top - 4) + 'px';
  }
  function abre(li) {
    var p = caixa();
    aberto = li.getAttribute('data-id');
    p.querySelector('b').textContent = txtNome(li);
    p.querySelector('span').textContent = li.getAttribute('data-c2d') || '';
    p.classList.add('ab');
    marca(); posiciona();
  }
  function fecha() { aberto = null; if (pop) pop.classList.remove('ab'); marca(); }
  function marca() {
    var e = esq(); if (!e) return;
    e.querySelectorAll('.c2-i').forEach(function (b) {
      var on = b.closest('.ipr-it').getAttribute('data-id') === aberto;
      cls(b, 'ab', on); b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  function pct(r) {
    var v = Math.round((r.value - r.min) / (r.max - r.min) * 100);
    r.style.setProperty('--v', v + '%');
    var s = r.nextElementSibling;
    if (s) { if (s.classList.contains('c2-pct')) { if (s.textContent !== r.value + '%') s.textContent = r.value + '%'; } }
  }
  function trata(li) {
    var cor = li.querySelector('.ipr-cor'), ck = li.querySelector('input.ipr-ck');
    if (cor) li.style.setProperty('--k', cor.style.background || cor.style.backgroundColor);
    if (ck) { if (ck.type === 'checkbox') { if (cor) cls(li, 'c2-t', true); } }
    var lab = li.querySelector('label'), opc = li.querySelector('.ipr-opc-b');
    var desc = null, est = null;
    li.querySelectorAll('.ipr-nome small').forEach(function (s) {
      if (s.classList.contains('ipr-cad')) return;
      if (s.classList.contains('ipr-est')) { est = s; } else { desc = s; }
    });
    cls(li, 'c2-far', !!est);
    if (est) {
      cls(est, 'c2-esc', true);
      if (!li.querySelector('.c2-z')) {
        var z = document.createElement('button'); z.type = 'button'; z.className = 'c2-z';
        z.title = 'Aproximar o mapa para ver'; z.setAttribute('aria-label', z.title); z.innerHTML = LUPA;
        lab.insertBefore(z, opc || null);
      }
    }
    if (desc) {
      cls(desc, 'c2-esc', true);
      if (li.getAttribute('data-c2d') !== desc.textContent.trim()) li.setAttribute('data-c2d', desc.textContent.trim());
      if (!li.querySelector('.c2-i')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'c2-i'; b.textContent = 'i';
        b.title = 'Mais informa\u00e7\u00e3o'; b.setAttribute('aria-label', b.title);
        lab.insertBefore(b, opc || null);
      }
    }
    var r = li.querySelector('input.ipr-op');
    if (r) {
      if (!r.nextElementSibling || !r.nextElementSibling.classList.contains('c2-pct')) {
        var sp = document.createElement('span'); sp.className = 'c2-pct'; r.parentNode.insertBefore(sp, r.nextSibling);
      }
      pct(r);
    }
  }
  function cabecalhos(e) {
    e.querySelectorAll('.ipr-sub small').forEach(function (s) {
      if (/ligadas$/.test(s.textContent)) return;
      var b = s.querySelector('b'); if (!b) return;
      var tot = parseInt(s.textContent, 10); if (isNaN(tot)) return;
      s.textContent = b.textContent + ' de ' + tot + ' ligadas';
    });
  }
  var pend = false;
  function corre() {
    pend = false;
    var e = esq(); if (!e) return;
    e.querySelectorAll('.ipr-it').forEach(trata);
    cabecalhos(e); marca();
    if (aberto) { var li = liDe(aberto); if (li) { if (pop) pop.querySelector('span').textContent = li.getAttribute('data-c2d') || ''; } }
    posiciona();
  }
  function agenda() { if (!pend) { pend = true; requestAnimationFrame(corre); } }
  function zoom(li) {
    var id = li.getAttribute('data-id'), n = 0;
    (function passo() {
      var l = liDe(id);
      if (!l) return;
      if (!l.classList.contains('c2-far')) return;
      if (n > 7) return;
      var bz = document.querySelector('.maplibregl-ctrl-zoom-in');
      if (!bz) return;
      bz.click(); n++; setTimeout(passo, 450);
    })();
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var bi = t.closest ? t.closest('#ipe-esq .c2-i') : null;
    var bzz = t.closest ? t.closest('#ipe-esq .c2-z') : null;
    if (bi) {
      ev.preventDefault(); ev.stopPropagation();
      var li = bi.closest('.ipr-it');
      if (aberto === li.getAttribute('data-id')) fecha(); else abre(li);
      return;
    }
    if (bzz) { ev.preventDefault(); ev.stopPropagation(); zoom(bzz.closest('.ipr-it')); }
  }, true);
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.classList) { if (t.classList.contains('ipr-op')) pct(t); }
  }, true);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (aberto) fecha(); } });
  window.addEventListener('resize', posiciona);
  document.addEventListener('scroll', posiciona, true);
  function liga() {
    var e = esq();
    if (!e) { setTimeout(liga, 300); return; }
    new MutationObserver(agenda).observe(e, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    corre();
  }
  liga();
})();

;/* ===== prod-js ===== */
/* 14/11 (Nuno: «o Atlas ainda não carregou as alterações da barra lateral»): em produção o admin.js (20/10) tira o corpo de
   «Os meus locais» da sua secção e mete-o num grupo dentro de Camadas (#ipc-loc). O Atlas 2 não carrega o admin.js, por isso a
   barra lateral do Bolito conta com a secção no topo. Aqui devolve-se o corpo à secção e tira-se o grupo; a secção fica com a
   marca ipc-movido para o admin.js não voltar a mudá-la, e mostra-se por cima da regra dele que a esconde. O separador «Rever»
   do admin.js fica igual. */
(function () {
  if (window.__tpLoc) return; window.__tpLoc = 1;
  var D = document;
  function css() {
    if (D.getElementById('tp-loc-css')) return;
    var s = D.createElement('style'); s.id = 'tp-loc-css';
    s.textContent = '#ipe #ipe-esq .ipe-sb[data-sb=locais].ipc-movido{display:block!important}';
    (D.head || D.documentElement).appendChild(s);
  }
  function repor() {
    var g = D.getElementById('ipc-loc'), sec = D.querySelector('#ipe-esq .ipe-sb[data-sb="locais"]');
    if (!sec) return;
    css();
    if (!g) return;
    var corpo = g.querySelector(':scope > .ipe-sbc');
    if (corpo) { corpo.style.display = ''; var velho = sec.querySelector(':scope > .ipe-sbc'); if (velho && velho !== corpo) velho.remove(); sec.appendChild(corpo); }
    sec.classList.add('ipc-movido');
    if (!g.classList.contains('fechado')) sec.classList.remove('fechado');
    g.remove();
  }
  var n = 0;
  (function ciclo() { try { repor(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1200 : 250); })();
})();
