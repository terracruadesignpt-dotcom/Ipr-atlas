/* IPR Atlas · Pesquisa de locais mais firme (9/11/2026, análise de experiência: «Almodôvar» com acento não encontrava e
 * a lista mostrava resultados repetidos). Só mexe nos pedidos de pesquisa ao Nominatim (search), em qualquer parte do Atlas:
 *  1. resultados repetidos (mesmo nome à vista e quase o mesmo sítio) passam a um só;
 *  2. se a pesquisa não devolve nada, ou falha, tenta outra vez sem acentos e depois só com a primeira parte do texto.
 * Não muda o aspecto nem o comportamento de mais nada. Desliga-se com localStorage ipr_pesquisa_firme_off=1. Terracrua Design. */
(function () {
  'use strict';
  var W = window;
  try { if (W.localStorage && localStorage.getItem('ipr_pesquisa_firme_off') === '1') return; } catch (e) {}
  if (!W.fetch || W.__iprPesquisaFirme) return;
  W.__iprPesquisaFirme = 1;
  var orig = W.fetch.bind(W);
  var RE = /^https:\/\/nominatim\.openstreetmap\.org\/search\?/;

  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function chave(r) {
    // O mesmo nome à vista é o mesmo resultado para quem escolhe (o Nominatim devolve, por exemplo, a vila e o concelho
    // de Almodôvar com o mesmo texto); fica o primeiro, que é o mais relevante.
    return semAcento(String(r.display_name || '')).toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function limpar(arr) {
    if (!Array.isArray(arr)) return arr;
    var vistos = {}, out = [];
    arr.forEach(function (r) { var k = chave(r); if (vistos[k]) return; vistos[k] = 1; out.push(r); });
    return out;
  }
  function comQ(url, q) { var u = new URL(url); u.searchParams.set('q', q); return u.toString(); }
  function resposta(arr, base) {
    return new Response(JSON.stringify(arr), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  function tentar(url) {
    return orig(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  W.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!RE.test(url) || (init && init.method && init.method !== 'GET')) return orig(input, init);
    var q = '';
    try { q = new URL(url).searchParams.get('q') || ''; } catch (e) { return orig(input, init); }
    var alternativas = [];
    var s = semAcento(q); if (s !== q) alternativas.push(s);
    var parte = s.split(/[,;]/)[0].trim(); if (parte && parte !== s && parte.length >= 3) alternativas.push(parte);
    function seguinte(i) {
      if (i >= alternativas.length) return Promise.resolve([]);
      return tentar(comQ(url, alternativas[i])).then(function (a) { return a && a.length ? a : seguinte(i + 1); }, function () { return seguinte(i + 1); });
    }
    return tentar(url).then(function (a) { return a && a.length ? a : seguinte(0); }, function (e) {
      return seguinte(0).then(function (a) { if (!a.length) throw e; return a; });
    }).then(function (a) { return resposta(limpar(a)); });
  };
})();
