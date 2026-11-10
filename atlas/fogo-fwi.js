/* IPR Atlas · Simulador de Fogo: humidade dos combustíveis proposta pelo perigo de incêndio do dia (Nuno, 7/11/2026,
   21h27: «do fogo executa»). Quando o painel «Simular fogo» mostra a escolha do cenário de humidade, lê no EFFIS
   (Copernicus EMS) a classe do índice FWI previsto para hoje no centro do mapa e propõe o cenário de Scott e Burgan
   correspondente. Se o utilizador já escolheu um cenário, não mexe. Mostra a origem por baixo da escolha.
   Classes do EFFIS → cenário: muito baixo D4L4 · baixo D4L4 · moderado D3L3 · alto D2L2 · muito alto D1L2 · extremo D1L1.
   10/11/2026: «baixo» passa de D3L4 a D4L4, como no email de 07/11 (baixo e muito baixo = mortos 12/13/14 %).
   A classe lê-se pela cor do mapa do EFFIS no ponto (o serviço não devolve o valor por consulta). Não mexe no
   fogo-simulador.js: liga-se pelo DOM (select[data-k=cenario]). Desligar: localStorage ipr_fogo_fwi_off = 1. */
(function (W, D) {
  "use strict";
  try { if (W.localStorage.getItem("ipr_fogo_fwi_off") === "1") return; } catch (e) {}
  var EN = W.IPR_LINGUA === "en" || W.IPR_LANG === "en";
  var CL = [
    { rgb: [156, 255, 192], cen: "D4L4", pt: "muito baixo", en: "very low" },
    { rgb: [205, 226, 78], cen: "D4L4", pt: "baixo", en: "low" },
    { rgb: [230, 172, 0], cen: "D3L3", pt: "moderado", en: "moderate" },
    { rgb: [217, 112, 16], cen: "D2L2", pt: "alto", en: "high" },
    { rgb: [173, 6, 14], cen: "D1L2", pt: "muito alto", en: "very high" },
    { rgb: [58, 0, 21], cen: "D1L1", pt: "extremo", en: "extreme" }
  ];
  var manual = false, pedido = null, ultimo = null;
  function classe(p) {
    if (!p || p[3] < 128) return null;
    var best = null, bd = 1e9;
    CL.forEach(function (c) { var d = Math.pow(c.rgb[0] - p[0], 2) + Math.pow(c.rgb[1] - p[1], 2) + Math.pow(c.rgb[2] - p[2], 2); if (d < bd) { bd = d; best = c; } });
    return bd < 2500 ? best : null;
  }
  function ler(lon, lat) {
    var d = 0.02, u = "https://maps.effis.emergency.copernicus.eu/effis?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=mf010.fwi&STYLES=&SRS=EPSG:4326&BBOX=" +
      (lon - d) + "," + (lat - d) + "," + (lon + d) + "," + (lat + d) + "&WIDTH=5&HEIGHT=5&FORMAT=image/png&TRANSPARENT=true";
    return fetch(u).then(function (r) { return r.blob(); }).then(function (b) { return createImageBitmap(b); }).then(function (bm) {
      var c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(5, 5) : Object.assign(D.createElement("canvas"), { width: 5, height: 5 });
      var x = c.getContext("2d"); x.drawImage(bm, 0, 0); var px = x.getImageData(2, 2, 1, 1).data; return classe([px[0], px[1], px[2], px[3]]);
    });
  }
  function nota(sel, c) {
    var n = sel.parentNode && sel.parentNode.parentNode && sel.parentNode.parentNode.querySelector(".ipr-fwi-nota");
    if (!n) { n = D.createElement("small"); n.className = "ipr-fwi-nota"; n.style.cssText = "display:block;margin:4px 0 8px;opacity:.8;font-size:12px;line-height:1.35"; sel.parentNode.insertAdjacentElement("afterend", n); }
    n.textContent = EN
      ? "Suggested from today's fire danger (FWI, EFFIS · Copernicus EMS): " + c.en + ". You can change it."
      : "Proposto pelo perigo de incêndio de hoje (FWI, EFFIS · Copernicus EMS): " + c.pt + ". Pode mudar.";
  }
  function aplicar(sel) {
    if (sel.__iprFwi) return; sel.__iprFwi = true;
    sel.addEventListener("change", function (e) { if (e.isTrusted) manual = true; });
    var M = W.__ipe && W.__ipe.mapa; if (!M || !M.getCenter) return;
    var c0 = M.getCenter(), chave = c0.lng.toFixed(2) + "," + c0.lat.toFixed(2);
    var feito = function (c) {
      if (!c || !D.body.contains(sel)) return;
      ultimo = c; nota(sel, c);
      if (manual || sel.value === c.cen) return;
      if (![].some.call(sel.options, function (o) { return o.value === c.cen; })) return;
      sel.value = c.cen;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    };
    if (pedido && pedido.k === chave) { pedido.p.then(feito); return; }
    pedido = { k: chave, p: ler(c0.lng, c0.lat).catch(function () { return null; }) };
    pedido.p.then(feito);
  }
  var q = 0;
  new MutationObserver(function () {
    clearTimeout(q);
    q = setTimeout(function () { var s = D.querySelector('select[data-k="cenario"]'); if (s) aplicar(s); }, 150);
  }).observe(D.documentElement, { childList: true, subtree: true });
})(window, document);
