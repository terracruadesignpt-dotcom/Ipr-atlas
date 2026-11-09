/* IPR Atlas · Aviso de carregamento do mapa (9/11/2026, análise de experiência: «fundo bege sem indicador de progresso
 * durante ~10 s»). Mostra «A preparar o mapa…» ao centro até o mapa desenhar a primeira vez; some sozinho ao fim de 25 s
 * no máximo. Não toca no mapa nem em nada do resto do Atlas. Desliga-se com localStorage ipr_carregar_aviso_off=1.
 * Terracrua Design. */
(function () {
  'use strict';
  var W = window, D = document;
  try { if (W.localStorage && localStorage.getItem('ipr_carregar_aviso_off') === '1') return; } catch (e) {}
  if (W.__iprCarregarAviso) return; W.__iprCarregarAviso = 1;
  var EN = function () { return W.IPR_LINGUA === 'en' || (D.documentElement.lang || '').indexOf('en') === 0; };
  var el = null, t0 = Date.now(), fim = false;
  function css() {
    if (D.getElementById('ipr-ca-css')) return;
    var s = D.createElement('style'); s.id = 'ipr-ca-css';
    s.textContent = '#ipr-ca{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147480000;display:flex;align-items:center;gap:10px;' +
      'padding:10px 16px;border-radius:999px;background:rgba(20,24,20,.92);color:#e9eadf;font:500 13px/1.2 Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;transition:opacity .3s}' +
      '#ipr-ca i{width:16px;height:16px;border-radius:50%;border:2px solid rgba(148,190,57,.35);border-top-color:#94BE39;animation:ipr-ca-r .8s linear infinite}' +
      '#ipr-ca.fora{opacity:0}@keyframes ipr-ca-r{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){#ipr-ca i{animation:none}}';
    (D.head || D.documentElement).appendChild(s);
  }
  function mostrar() {
    if (fim || el || !D.body) return; css();
    el = D.createElement('div'); el.id = 'ipr-ca'; el.setAttribute('role', 'status');
    el.innerHTML = '<i aria-hidden="true"></i><span></span>';
    el.querySelector('span').textContent = EN() ? 'Preparing the map…' : 'A preparar o mapa…';
    D.body.appendChild(el);
  }
  function tirar() {
    if (fim) return; fim = true;
    if (el) { el.classList.add('fora'); setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 350); }
  }
  function pronto() {
    var m = W.__ipe && W.__ipe.mapa;
    if (m && typeof m.loaded === 'function') {
      try { if (m.loaded() && m.areTilesLoaded && m.areTilesLoaded()) return true; } catch (e) {}
      if (!m.__iprCa) { m.__iprCa = 1; try { m.once('idle', tirar); } catch (e) {} }
    }
    return false;
  }
  function volta() {
    if (fim) return;
    if (pronto() || Date.now() - t0 > 25000) return tirar();
    if (Date.now() - t0 > 600) mostrar(); // carregamentos rápidos não chegam a ver o aviso
    setTimeout(volta, 250);
  }
  if (!D.getElementById('ipe') && !/\/atlas\//.test(location.pathname)) return;
  volta();
})();
