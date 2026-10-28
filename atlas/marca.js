/* IPR Atlas · Marca IPR nos textos do ecrã (Nuno, 28/10/2026, 16h33: «É tudo IPR, não é Terracrua Design»).
   Troca, à medida que aparecem no ecrã, as frases do Atlas que ainda dizem Terracrua Design (levantamento em
   terracrua/marca-ipr-2026-10-28.md, secção 3) e o contacto info@terracruadesign.pt por info@regenerativo.pt.
   Só frases exactas e ligações; não toca em nomes de organizações nem em textos escritos pelas pessoas.
   Fica até o app.js ser corrigido na origem. Desligar: window.IPR_MARCA_OFF = true. */
(function () {
  "use strict";
  if (window.IPR_MARCA_OFF || window.__iprMarca) return;
  window.__iprMarca = 1;
  var M = "info@regenerativo.pt";
  var F = [
    ["Terracrua Design ↗", "IPR · regenerativo.pt ↗"],
    ["O Intelligence abre com qualquer serviço contratado à Terracrua Design, começando na Base Cartográfica, ou por assinatura.", "O Intelligence abre com a Base Cartográfica ou por assinatura."],
    ["Abre com qualquer serviço contratado à Terracrua Design ou por assinatura.", "Abre com a Base Cartográfica ou por assinatura."],
    [" ou WhatsApp +351 910 748 670", ""],
    ["equipa Terracrua", "equipa IPR"], ["Equipa Terracrua", "Equipa IPR"],
    ["verificado pela Terracrua", "verificado pelo IPR"], ["acompanhados pela Terracrua", "acompanhados pelo IPR"],
    ["Ficha preparada pela Terracrua Design", "Ficha preparada pelo IPR"],
    ["pedir a Leitura do Terreno à Terracrua Design", "pedir a Leitura Territorial ao IPR"],
    ["Emitido por IPR Atlas · Terracrua Design", "Emitido pelo IPR Atlas · IPR – Instituto de Planeamento Regenerativo, Lda."],
    ["IPR Atlas · Terracrua Design", "IPR Atlas · IPR – Instituto de Planeamento Regenerativo, Lda."],
    ["Projectos IPR da Terracrua Design na vizinhança", "Projectos acompanhados pelo IPR na vizinhança"],
    ["registados pelo IPR e pela Terracrua Design", "registados pelo IPR"],
    ["Tem um vale da Terracrua Design?", "Tem um vale ou código de oferta?"],
    ["Recebeu um vale de oferta da Terracrua Design e não o escreveu?", "Recebeu um vale de oferta e não o escreveu?"],
    ["O tratamento, a leitura e os desenhos são da Terracrua Design.", "O tratamento, a leitura e os desenhos são do IPR – Instituto de Planeamento Regenerativo, Lda."],
    ["Prepared by Terracrua Design", "Prepared by IPR"], ["Terracrua Design team", "IPR team"],
    ["info@terracruadesign.pt", M], ["shop@terracruadesign.pt", M]
  ];
  function tr(s) {
    if (!s || s.indexOf("erracrua") < 0) return s;
    for (var i = 0; i < F.length; i++) if (s.indexOf(F[i][0]) >= 0) s = s.split(F[i][0]).join(F[i][1]);
    return s;
  }
  function no(n) {
    if (n.nodeType === 3) { var v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
    if (n.nodeType !== 1 || n.nodeName === "SCRIPT" || n.nodeName === "STYLE" || n.isContentEditable) return;
    ["title", "placeholder", "aria-label", "alt"].forEach(function (a) {
      var v = n.getAttribute && n.getAttribute(a); if (v && v.indexOf("erracrua") >= 0) n.setAttribute(a, tr(v));
    });
    if (n.nodeName === "A") {
      var h = n.getAttribute("href") || "";
      if (/^mailto:(info|shop)@terracruadesign\.pt/i.test(h)) n.setAttribute("href", "mailto:" + M);
      else if (/^https?:\/\/(www\.)?terracruadesign\.pt\/?$/i.test(h) && /regenerativo|Terracrua Design ↗/.test(n.textContent)) n.setAttribute("href", "https://regenerativo.pt");
    }
    if (n.nodeName === "INPUT" || n.nodeName === "TEXTAREA") return; // o que as pessoas escrevem fica como está
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), x;
    while ((x = w.nextNode())) {
      if (x.nodeType === 3) { var p = x.parentNode; if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE" || p.isContentEditable || p.nodeName === "TEXTAREA")) continue; var t = tr(x.nodeValue); if (t !== x.nodeValue) x.nodeValue = t; }
      else if (x.nodeName === "A" || x.getAttribute("title") || x.getAttribute("aria-label")) no1(x);
    }
  }
  function no1(e) {
    ["title", "aria-label"].forEach(function (a) { var v = e.getAttribute(a); if (v && v.indexOf("erracrua") >= 0) e.setAttribute(a, tr(v)); });
    if (e.nodeName === "A") {
      var h = e.getAttribute("href") || "";
      if (/^mailto:(info|shop)@terracruadesign\.pt/i.test(h)) e.setAttribute("href", "mailto:" + M);
      else if (/^https?:\/\/(www\.)?terracruadesign\.pt\/?$/i.test(h) && /regenerativo|Terracrua Design ↗/.test(e.textContent)) e.setAttribute("href", "https://regenerativo.pt");
    }
  }
  // 28/10/2026, 17h31 (Nuno): «Os simuladores têm que ficar com botões mais discretos.» Contorno fino em vez de cheio.
  try { var st = document.createElement("style"); st.id = "ipr-sims-discretos"; st.textContent = ".ipr-sims{gap:6px!important;margin:0 0 10px!important;padding:0!important;border:0!important;background:none!important}.ipr-sims .h{font-size:10px!important;margin-bottom:-2px}.ipr-sims .s{flex:0 1 auto!important;min-height:30px!important;padding:5px 11px!important;border-radius:6px!important;font:500 12.5px Inter,sans-serif!important;background:transparent!important;filter:none!important}.ipr-sims .s.f{border:1px solid rgba(224,122,63,.55)!important;color:#e9a37a!important}.ipr-sims .s.a{border:1px solid rgba(63,143,201,.55)!important;color:#8fc0e4!important}.ipr-sims .s:hover{background:rgba(255,255,255,.05)!important}.ipr-sims .s svg{width:14px;height:14px}"; (document.head || document.documentElement).appendChild(st); } catch (e) {}
  function arrancar() {
    no(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") no(m.target);
        else m.addedNodes.forEach(function (n) { no(n); });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();
