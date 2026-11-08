/* IPR Atlas · escolha de parcelas do cadastro firme (Nuno, 7/11/2026, 23h59, no telemóvel: «falhou na selecção de um
   terreno, não permitiu seleccionar pelo cadastro. Os clientes perdem-se sem comprar»). Terracrua Design. Só acrescenta.
   Causa medida a 8/11 às 00h10: o serviço do cadastro da DGT (snicws, WFS inspire:cadastralparcel) responde, mas devagar
   (cerca de 10 s em Santa Clara-a-Nova, 0,6 a 2 s noutros sítios). O app.js:
   - carrega as parcelas da vista com um pedido grande que é cancelado sempre que o mapa mexe: no telemóvel, qualquer
     arrasto cancela o pedido lento e as parcelas nunca chegam a aparecer;
   - ao tocar sem parcela carregada, procura a parcela no ponto com um limite de 15 s e desiste.
   Agora (só para os pedidos ao cadastro):
   - os pedidos já não são cancelados a meio; os da vista juntam-se num só (o mais recente espera pelo anterior);
   - limite de 45 s e uma nova tentativa automática se a DGT falhar;
   - respostas guardadas 15 minutos, para não pedir duas vezes a mesma zona;
   - aviso discreto «A carregar as parcelas do cadastro…» enquanto espera, e, se falhar, como continuar (tocar outra vez,
     desenhar o limite ou carregar um ficheiro).
   Desligar: ?cadfirme=0 ou localStorage ipr_cadfirme_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]cadfirme=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_cadfirme_off") === "1") return; } catch (e) {}
  if (W.__iprCadFirme || !W.fetch) return; W.__iprCadFirme = 1;
  var EN = (W.IPR_LINGUA || "pt") === "en";
  function T(pt, en) { return EN ? en : pt; }
  var RX = /snicws\.dgterritorio\.gov\.pt\/geoserver\/inspire\/ows\?[^#]*typeNames=inspire:cadastralparcel/i;
  var orig = W.fetch.bind(W);
  var CACHE = {}, pend = 0, vistaEmCurso = null, vistaProxima = null;

  function aviso(txt, mau) {
    var a = D.getElementById("ipr-cadf");
    if (!txt) { if (a) a.remove(); return; }
    if (!a) {
      a = D.createElement("div"); a.id = "ipr-cadf"; a.setAttribute("role", "status");
      a.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));z-index:100040;max-width:min(92vw,460px);padding:8px 12px;border-radius:2px;font:500 13px/1.35 Inter,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none";
      D.body.appendChild(a);
    }
    a.style.background = mau ? "#3a1d16" : "rgba(18,22,15,.94)"; a.style.color = "#E4E2D8"; a.style.border = "1px solid " + (mau ? "#E0705A" : "#3C4B32");
    a.textContent = txt;
    clearTimeout(a.__t); if (mau) a.__t = setTimeout(function () { aviso(""); }, 9000);
  }
  function semSinal(init) { var o = {}; if (init) for (var k in init) if (k !== "signal") o[k] = init[k]; return o; }
  function pedir(url, init, tent) {
    var ctl = W.AbortController ? new AbortController() : null, t = ctl ? setTimeout(function () { ctl.abort(); }, 45000) : 0;
    var o = semSinal(init); if (ctl) o.signal = ctl.signal;
    return orig(url, o).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error("http " + r.status);
      return r.text().then(function (txt) { JSON.parse(txt); return txt; });   // só guarda JSON válido
    }).catch(function (e) {
      clearTimeout(t);
      if ((tent || 0) < 1) return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return pedir(url, init, 1); });
      throw e;
    });
  }
  function resposta(txt) { return new Response(txt, { status: 200, headers: { "Content-Type": "application/json" } }); }
  function comAviso(p, vista) {
    pend++; if (vista) aviso(T("A carregar as parcelas do cadastro…", "Loading land registry parcels…"));
    return p.then(function (txt) { if (--pend <= 0) { pend = 0; aviso(""); } return txt; }, function (e) {
      if (--pend <= 0) pend = 0;
      aviso(T("O cadastro da DGT não respondeu. Toque de novo na parcela, ou desenhe o limite ou carregue um ficheiro.", "The DGT land registry did not answer. Tap the parcel again, or draw the boundary or upload a file."), true);
      throw e;
    });
  }
  W.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (!RX.test(url)) return orig(input, init);
    var c = CACHE[url]; if (c && Date.now() - c.t < 900000) return Promise.resolve(resposta(c.txt));
    var vista = /[?&]count=1500(&|$)/.test(url);
    if (!vista) {
      return comAviso(pedir(url, init), false).then(function (txt) { CACHE[url] = { t: Date.now(), txt: txt }; return resposta(txt); });
    }
    // pedidos da vista: um de cada vez; o mais recente espera e corre a seguir (os intermédios são respondidos com ele)
    if (vistaEmCurso) {
      if (vistaProxima) vistaProxima.res.forEach(function (f) { f.rej(new DOMException("substituido", "AbortError")); });
      var item = { url: url, init: init, res: [] };
      vistaProxima = item;
      return new Promise(function (ok, ko) { item.res.push({ ok: ok, rej: ko }); });
    }
    function correr(u, i) {
      vistaEmCurso = comAviso(pedir(u, i), true).then(function (txt) { CACHE[u] = { t: Date.now(), txt: txt }; return txt; });
      var esta = vistaEmCurso;
      esta.then(depois, depois);
      return esta;
    }
    function depois() {
      vistaEmCurso = null;
      var n = vistaProxima; vistaProxima = null;
      if (n) correr(n.url, n.init).then(function (txt) { n.res.forEach(function (f) { f.ok(resposta(txt)); }); }, function (e) { n.res.forEach(function (f) { f.rej(e); }); });
    }
    return correr(url, init).then(resposta);
  };
})();
