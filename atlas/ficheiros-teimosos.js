/* IPR Atlas · camadas que não ligam por causa da página «One moment, please...» do alojamento (2/11/2026, 12h35: vídeo
   do Miguel Clemente, Base 290 José Matos | Garvão: carrega numa camada e ela não liga; Nuno: «porque é que faltam as
   camadas nas bases?»).
   Causa encontrada: o servidor do alojamento, quando está carregado, responde a alguns pedidos de ficheiros com uma
   página HTML de espera (200, text/html, «One moment, please...», recarrega em 5 s) em vez do ficheiro; a Cloudflare
   chegou a guardar essa página em cache para camadas inteiras (ex.: streams.geojson da Base E17061). O mapa recebe HTML
   onde esperava GeoJSON ou PMTiles, a camada falha e a caixa volta a ficar desligada.
   Este acrescento (sem mexer no viz.js nem no minhas-bases.js) envolve o fetch do Atlas: quando um pedido de dados da
   Base (tcd-web, mapa-ficheiro, carregar/f, pfich/f, descarga) volta como HTML, espera e repete até 5 vezes, com um
   parâmetro novo no endereço para não apanhar a cópia errada da cache. Os pedidos com Range (PMTiles) mantêm o Range.
   Desligar: ?teimoso=0. */
(function () {
  "use strict";
  var W = window;
  try { if (/[?&]teimoso=0\b/.test(W.location.search)) return; } catch (e) {}
  if (W.__iprTeimoso || typeof W.fetch !== "function") return; W.__iprTeimoso = 1;
  var orig = W.fetch.bind(W);
  var DADOS = /\/wp-content\/uploads\/tcd-web\/|\/tcd\/v1\/(mapa-ficheiro|carregar\/f|pfich\/f|descarga)|tcd-web/;
  var ESPERAS = [1200, 2500, 4000, 6000, 8000];
  W.__iprTeimosoReg = [];
  function urlDe(r) { try { return typeof r === "string" ? r : (r && r.url) || String(r); } catch (e) { return ""; } }
  function comMarca(u, n) {
    try { var x = new URL(u, W.location.href); x.searchParams.set("_r", String(Date.now()) + "_" + n); return x.toString(); } catch (e) { return u; }
  }
  function eHtml(res, u) {
    if (!res || !res.headers) return false;
    var ct = String(res.headers.get("content-type") || "").toLowerCase();
    return ct.indexOf("text/html") >= 0 && !/\.html?(\?|$)/i.test(u);
  }
  function dormir(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  W.fetch = function (input, init) {
    var u = urlDe(input);
    if (!DADOS.test(u)) return orig(input, init);
    var opts = init;
    if (!opts && input && typeof input === "object" && input.headers) {
      opts = { headers: input.headers, method: input.method, credentials: input.credentials, signal: input.signal };
    }
    function tentar(n, alvo) {
      return orig(alvo, opts).then(function (res) {
        if (!eHtml(res, u) || n >= ESPERAS.length) {
          if (n > 0) W.__iprTeimosoReg.push((eHtml(res, u) ? "falhou " : "ok ") + n + " " + u.split("?")[0].split("/").pop());
          return res;
        }
        return dormir(ESPERAS[n]).then(function () { return tentar(n + 1, comMarca(u, n + 1)); });
      });
    }
    return tentar(0, input);
  };
})();
