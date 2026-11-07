/* IPR Atlas · PDF das Plantas e Leituras dentro do Atlas no iPad e no telemóvel (Nuno, 7/11/2026, 23h19: «As plantas e
   leituras abrem sempre numa janela nova»). Terracrua Design. Só acrescenta.
   Causa: a Planta de Localização é feita no navegador (jsPDF) e grava-se com doc.save(); no Safari e no Chrome do iPad
   isso abre o PDF num separador novo. As Leituras e os outros ficheiros entregues abrem por ligações com target=_blank.
   Agora, em aparelhos de toque:
   - doc.save() do jsPDF mostra o PDF numa janela por cima do Atlas, com «Descarregar», «Partilhar ou guardar» (folha de
     partilha do iPad: Ficheiros, Mail, AirDrop) e «Fechar»;
   - as ligações «Abrir» de PDFs do site (mesmo domínio) abrem na mesma janela por cima do Atlas;
   - as páginas são desenhadas com o PDF.js (carregado só quando é preciso), por isso o PDF inteiro vê-se em qualquer
     navegador; se o PDF.js não carregar, o PDF abre num quadro (iframe).
   No computador nada muda (descarrega como antes). Desligar: ?pdfjanela=0 ou localStorage ipr_pdfjanela_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]pdfjanela=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_pdfjanela_off") === "1") return; } catch (e) {}
  if (W.__iprPdfJanela) return; W.__iprPdfJanela = 1;
  var toque = (navigator.maxTouchPoints || 0) > 1 && (/iPad|iPhone|Android|Mobile/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in D));
  if (!toque) return;
  var EN = (W.IPR_LINGUA || "pt") === "en";
  function T(pt, en) { return EN ? en : pt; }
  var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  var PDFJSW = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  var pdfjsP = null;
  function carregarPdfjs() {
    if (W.pdfjsLib) return Promise.resolve(W.pdfjsLib);
    if (pdfjsP) return pdfjsP;
    pdfjsP = new Promise(function (ok, ko) {
      var s = D.createElement("script"); s.src = PDFJS; s.crossOrigin = "anonymous";
      s.onload = function () { if (W.pdfjsLib) { W.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSW; ok(W.pdfjsLib); } else ko(new Error("pdfjs")); };
      s.onerror = function () { pdfjsP = null; ko(new Error("pdfjs")); };
      D.head.appendChild(s);
    });
    return pdfjsP;
  }
  function css() {
    if (D.getElementById("ipr-pdfj-css")) return;
    var s = D.createElement("style"); s.id = "ipr-pdfj-css";
    s.textContent = "#ipr-pdfj{position:fixed;inset:0;z-index:2147483100;display:flex;flex-direction:column;background:rgba(10,12,9,.96);color:#E4E2D8;font:14px/1.4 Inter,system-ui,sans-serif}" +
      "#ipr-pdfj .pj-cab{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;border-bottom:1px solid #2E3A26;flex-wrap:wrap}" +
      "#ipr-pdfj .pj-n{flex:1 1 200px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}" +
      "#ipr-pdfj .pj-b{display:inline-flex;align-items:center;min-height:40px;padding:8px 14px;border-radius:2px;border:1px solid #3C4B32;background:transparent;color:#E4E2D8;font:500 14px Inter,sans-serif;text-decoration:none;cursor:pointer}" +
      "#ipr-pdfj .pj-b.pri{background:#94BE39;border-color:#94BE39;color:#141814;font-weight:600}" +
      "#ipr-pdfj .pj-c{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;align-items:center;gap:12px}" +
      "#ipr-pdfj .pj-c canvas{max-width:100%;height:auto;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.4)}" +
      "#ipr-pdfj .pj-c iframe{width:100%;flex:1 1 auto;min-height:70vh;border:0;background:#fff}" +
      "#ipr-pdfj .pj-s{opacity:.75;font-size:13px}";
    D.head.appendChild(s);
  }
  var aberto = null;
  function fechar() { if (!aberto) return; try { if (aberto.url) URL.revokeObjectURL(aberto.url); } catch (e) {} aberto.el.remove(); aberto = null; }
  function mostrar(blob, nome) {
    css(); fechar();
    nome = String(nome || "documento.pdf"); if (!/\.pdf$/i.test(nome)) nome += ".pdf";
    var url = URL.createObjectURL(blob);
    var el = D.createElement("div"); el.id = "ipr-pdfj"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", nome);
    el.innerHTML = '<div class="pj-cab"><span class="pj-n"></span><a class="pj-b pri" data-pj="dl">' + T("Descarregar", "Download") + "</a>" +
      (navigator.canShare ? '<button type="button" class="pj-b" data-pj="sh">' + T("Partilhar ou guardar", "Share or save") + "</button>" : "") +
      '<button type="button" class="pj-b" data-pj="x" aria-label="' + T("Fechar", "Close") + '">' + T("Fechar", "Close") + ' ×</button></div><div class="pj-c"><p class="pj-s">' + T("A abrir o PDF…", "Opening the PDF…") + "</p></div>";
    el.querySelector(".pj-n").textContent = nome;
    var dl = el.querySelector('[data-pj="dl"]'); dl.href = url; dl.setAttribute("download", nome);
    D.body.appendChild(el); aberto = { el: el, url: url };
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-pj]"); if (!b) return;
      var a = b.getAttribute("data-pj");
      if (a === "x") { e.preventDefault(); fechar(); }
      else if (a === "sh") {
        e.preventDefault();
        try { var f = new File([blob], nome, { type: "application/pdf" }); if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: nome }).catch(function () {}); else dl.click(); } catch (x) { dl.click(); }
      }
    });
    D.addEventListener("keydown", function esc(e) { if (e.key === "Escape" && aberto && aberto.el === el) { fechar(); D.removeEventListener("keydown", esc); } });
    var c = el.querySelector(".pj-c");
    carregarPdfjs().then(function (lib) {
      return blob.arrayBuffer().then(function (buf) { return lib.getDocument({ data: buf }).promise; }).then(function (pdf) {
        if (!aberto || aberto.el !== el) return;
        c.innerHTML = "";
        var larg = Math.min(c.clientWidth - 24, 1400), dpr = Math.min(2, W.devicePixelRatio || 1), n = pdf.numPages, i = 1;
        function prox() {
          if (i > n || !aberto || aberto.el !== el) return;
          var k = i++;
          pdf.getPage(k).then(function (pg) {
            var v0 = pg.getViewport({ scale: 1 }), esc = larg / v0.width, v = pg.getViewport({ scale: esc * dpr });
            var cv = D.createElement("canvas"); cv.width = Math.round(v.width); cv.height = Math.round(v.height); cv.style.width = Math.round(v.width / dpr) + "px";
            c.appendChild(cv);
            return pg.render({ canvasContext: cv.getContext("2d"), viewport: v }).promise;
          }).then(prox, prox);
        }
        prox();
      });
    }).catch(function () {
      if (!aberto || aberto.el !== el) return;
      c.innerHTML = ""; var fr = D.createElement("iframe"); fr.src = url; fr.title = nome; c.appendChild(fr);
    });
  }
  // outro tipo de ficheiro (ou erro a ler): mostra a própria página num quadro, sem sair do Atlas
  function quadro(href, nome) {
    css(); fechar();
    var el = D.createElement("div"); el.id = "ipr-pdfj"; el.setAttribute("role", "dialog");
    el.innerHTML = '<div class="pj-cab"><span class="pj-n"></span><a class="pj-b" target="_blank" rel="noopener">' + T("Abrir noutro separador", "Open in another tab") + '</a><button type="button" class="pj-b" data-pj="x">' + T("Fechar", "Close") + ' ×</button></div><div class="pj-c"><iframe></iframe></div>';
    el.querySelector(".pj-n").textContent = nome || href; el.querySelector("a").href = href; el.querySelector("iframe").src = href;
    D.body.appendChild(el); aberto = { el: el, url: "" };
    el.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest('[data-pj="x"]'); if (b) { e.preventDefault(); fechar(); } });
  }
  W.iprMostrarPdf = mostrar;

  // jsPDF: doc.save() → janela por cima do Atlas
  function ligarJsPdf() {
    var J = (W.jspdf && W.jspdf.jsPDF) || W.jsPDF;
    if (!J || !J.API || J.API.__iprPdfj) return !!(J && J.API && J.API.__iprPdfj);
    var orig = J.API.save;
    J.API.save = function (nome, op) {
      try { if (op && op.returnPromise) return orig.apply(this, arguments); mostrar(this.output("blob"), nome); return this; }
      catch (e) { return orig.apply(this, arguments); }
    };
    J.API.__iprPdfj = 1;
    return true;
  }
  var n = 0, iv = setInterval(function () { if (ligarJsPdf() || ++n > 600) clearInterval(iv); }, 1000);

  // ligações «Abrir» de PDFs do site em target=_blank
  D.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[target=_blank][href]"); if (!a || !a.closest("#ipe, #ipr-mb, .ipe")) return;
    if (a.hasAttribute("download") || /[?&]dl=1(&|$)/.test(a.href)) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin) return;
    if (!/\.pdf($|\?)|pfich|ficheiro|entrega|leitura|planta|\/tcd\/v1\//i.test(u.pathname + u.search)) return;
    e.preventDefault(); e.stopPropagation();
    var nome = (a.getAttribute("title") || a.textContent || "").trim();
    fetch(u.href, { credentials: "same-origin" }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      if (!r.ok || !/pdf/i.test(ct)) throw new Error("nao-pdf");
      var cd = r.headers.get("content-disposition") || "", m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
      return r.blob().then(function (b) { mostrar(b, m ? decodeURIComponent(m[1]) : (nome && nome.length > 3 ? nome : "documento.pdf")); });
    }).catch(function () { quadro(u.href, nome); });
  }, true);
})();
