/* IPR Atlas · ficha-documentos.js (05/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 05/11/2026, 15h04: «Quando eu faço uma planta localização, deve ficar dentro da ficha da propriedade. E continuo sem
   ver lá a cena para a leitura territorial.»
   1. A ficha da propriedade sobe para logo a seguir ao 3D do cartão (antes ficava no fundo, depois das descargas).
   2. No topo da ficha, «Documentos da propriedade»: a Leitura Territorial (abrir o PDF, ou em preparação, ou pedir), o
      relatório da Base e as Plantas de Localização guardadas, com o botão para fazer uma nova.
   3. Cada Planta de Localização gerada (ajustes.js, plantaDialogo → doc.save) é guardada também nos ficheiros do projecto
      (m90381, POST /tcd/v1/pfich/parte, pasta 0.4 Entregáveis), se quem a fez puder escrever no projecto. A descarga no
      computador continua igual.
   Desligar: ?fdoc=0 ou localStorage ipr_fdoc_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]fdoc=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_fdoc_off") === "1") return; } catch (e) {}
  if (W.__iprFDoc) return; W.__iprFDoc = 1;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function hdr() { return { "X-WP-Nonce": W.tcdNonce || "" }; }
  function mapa(id) { var E = est(); return E && (E.mapas || []).filter(function (m) { return String(m.encomenda || m.id) === String(id); })[0] || null; }
  function data(s) { try { return new Date(s).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }

  var css = D.createElement("style"); css.id = "ipr-fdoc-css";
  css.textContent =
    ".ipr-fdoc{margin:0 0 12px;padding:10px 12px;border:1px solid rgba(233,161,90,.45);border-radius:8px;background:rgba(233,161,90,.07)}" +
    ".ipr-fdoc h4{margin:0 0 6px!important}.ipr-fdoc ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}" +
    ".ipr-fdoc li{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;font-size:13px}" +
    ".ipr-fdoc li b{font-weight:600}.ipr-fdoc li small{opacity:.75}.ipr-fdoc .ipe-b{padding:3px 10px;font-size:12px}" +
    ".ipr-fdoc .ipr-fdoc-msg{margin-top:6px;font-size:12px;color:#e9a15a}";
  (D.head || D.documentElement).appendChild(css);

  var cache = {};
  function plantas(id, forcar) {
    if (!W.tcdNonce) return Promise.resolve({ ficheiros: [], pode: false });
    if (!forcar && cache[id] && Date.now() - cache[id].t < 60000) return cache[id].p;
    var p = fetch("/wp-json/tcd/v1/pfich?alvo=e:" + encodeURIComponent(id), { credentials: "same-origin", headers: hdr() })
      .then(function (r) { return r.ok ? r.json() : { ficheiros: [], pode: false }; }).catch(function () { return { ficheiros: [], pode: false }; });
    cache[id] = { t: Date.now(), p: p };
    return p;
  }

  function bloco(card, m) {
    var id = m.encomenda || m.id, dl = m.downloads || [];
    function achar(re) { for (var i = 0; i < dl.length; i++) { var n = String(dl[i].nome || dl[i].name || dl[i].label || ""); if (re.test(n) && dl[i].url) return dl[i]; } return null; }
    var lt = achar(/Leitura_Territorial|Leitura Territorial/i), rb = achar(/Relatorio_Base|Relatório da Base/i);
    var h = '<h4>Documentos da propriedade</h4><ul>';
    h += "<li><span><b>Leitura Territorial</b> <small>" + (lt ? "PDF com o PDM, as condicionantes e as coordenadas" : m.leitura ? "em preparação" : "ainda não pedida") + "</small></span>" +
      (lt ? '<a class="ipe-b ipe-b--ac" target="_blank" rel="noopener" href="' + esc(lt.url) + '">Abrir</a>'
        : m.leitura ? "" : '<a class="ipe-b ipe-b--ac" href="/contacto/?tipo=' + encodeURIComponent("Leitura Territorial") + "&base=" + encodeURIComponent(id) + '">Pedir a Leitura Territorial</a>') + "</li>";
    if (rb) h += '<li><span><b>Relatório da Base Cartográfica</b> <small>PDF</small></span><a class="ipe-b" target="_blank" rel="noopener" href="' + esc(rb.url) + '">Abrir</a></li>';
    h += '<li class="ipr-fdoc-pl"><span><b>Plantas de Localização</b> <small>a ver…</small></span><button type="button" class="ipe-b ipe-b--ac" data-fdoc-pl="' + esc(id) + '">Fazer a Planta de Localização</button></li>';
    h += "</ul><div class=\"ipr-fdoc-msg\" hidden></div>";
    var d = D.createElement("div"); d.className = "ipr-fdoc"; d.setAttribute("data-fdoc", id); d.innerHTML = h;
    lista(d, id, false);
    return d;
  }
  function lista(d, id, forcar) {
    plantas(id, forcar).then(function (r) {
      var li = d.querySelector(".ipr-fdoc-pl"); if (!li) return;
      var fs = (r.ficheiros || []).filter(function (f) { return /plan|localiza/i.test(f.nome) && /pdf$/i.test(f.ext || f.nome); });
      var old = d.querySelectorAll(".ipr-fdoc-pf"); [].forEach.call(old, function (x) { x.remove(); });
      li.querySelector("small").textContent = fs.length ? fs.length + (fs.length === 1 ? " guardada" : " guardadas") : "nenhuma guardada ainda; as novas ficam aqui";
      fs.slice(0, 8).forEach(function (f) {
        var x = D.createElement("li"); x.className = "ipr-fdoc-pf";
        x.innerHTML = "<span>" + esc(f.nome) + " <small>" + esc(data(f.quando)) + (f.por ? " · " + esc(f.por) : "") + "</small></span><a class=\"ipe-b\" target=\"_blank\" rel=\"noopener\" href=\"" + esc(f.url) + "\">Abrir</a>";
        li.parentNode.insertBefore(x, li.nextSibling);
      });
    });
  }
  function msg(id, t) {
    [].forEach.call(D.querySelectorAll('.ipr-fdoc[data-fdoc="' + id + '"] .ipr-fdoc-msg'), function (m) { m.hidden = !t; m.textContent = t || ""; });
  }

  // 1 e 2: ficha logo a seguir ao 3D, com os documentos no topo.
  function arrumar() {
    var E = est(); if (!E || !E.mapas) return;
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-card.ipr-fn-on, #ipe-proj .ipe-card.on"), function (c) {
      if (!c.offsetParent) return;
      var cx = c.querySelector(".ipe-cx"); if (!cx) return;
      var m = E.mapas[+c.getAttribute("data-i")]; if (!m) return;
      var f = c.querySelector(".ipr-ficha-out"), r = c.querySelector(".ipe-res--proj");
      var ficha = f && f.offsetParent !== null || (f && !r) ? f : r; if (!ficha) return;
      var tres = cx.querySelector(":scope > .ipr-fx");
      var antes = tres ? tres.nextSibling : cx.firstChild;
      if (ficha.parentNode === cx && ficha !== antes && !(tres && ficha.previousSibling === tres)) cx.insertBefore(ficha, antes);
      if (!ficha.querySelector(".ipr-fdoc")) ficha.insertBefore(bloco(c, m), ficha.firstChild);
    });
  }

  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-fdoc-pl]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (typeof W.__iprPlanta === "function") W.__iprPlanta(+b.getAttribute("data-fdoc-pl"));
  }, true);

  // 3: guardar cada Planta gerada nos ficheiros do projecto.
  function sha(buf) { return crypto.subtle.digest("SHA-256", buf).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }); }
  function guardar(id, nome, blob) {
    return plantas(id, true).then(function (r) {
      if (!r.pode) return;
      msg(id, "A guardar a Planta na ficha da propriedade…");
      return blob.arrayBuffer().then(function (buf) {
        return sha(buf).then(function (h) {
          var P = 8000000, n = Math.max(1, Math.ceil(buf.byteLength / P)), i = 0;
          function envia() {
            var q = "alvo=e:" + encodeURIComponent(id) + "&nome=" + encodeURIComponent(nome) + "&parte=" + i + "&partes=" + n + "&tamanho=" + buf.byteLength + "&pasta=0.4" + (i === n - 1 ? "&sha256=" + h : "");
            return fetch("/wp-json/tcd/v1/pfich/parte?" + q, { method: "POST", credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce, "Content-Type": "application/octet-stream" }, body: buf.slice(i * P, Math.min(buf.byteLength, (i + 1) * P)) })
              .then(function (x) { if (!x.ok) throw new Error(x.status); i++; return i < n ? envia() : x.json(); });
          }
          return envia();
        });
      }).then(function () {
        msg(id, "Planta guardada na ficha da propriedade.");
        [].forEach.call(D.querySelectorAll('.ipr-fdoc[data-fdoc="' + id + '"]'), function (d) { lista(d, id, true); });
      });
    }).catch(function () { msg(id, "A Planta foi descarregada, mas não ficou guardada na ficha. Pode carregá-la à mão nos ficheiros do projecto."); });
  }
  function ligarPdf() {
    var J = W.jspdf && W.jspdf.jsPDF; if (!J || !J.API || J.API.__iprFDoc) return !!(J && J.API && J.API.__iprFDoc);
    var orig = J.API.save; if (typeof orig !== "function") return false;
    J.API.save = function (nome) {
      try {
        var m = /-(\d{3,})-1-[^\/]*\.pdf$/i.exec(String(nome || ""));
        if (m && /plan|localiza/i.test(String(nome)) && mapa(m[1])) guardar(m[1], String(nome), this.output("blob"));
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    J.API.__iprFDoc = 1;
    return true;
  }

  var t = 0;
  function corre() { t = 0; try { arrumar(); ligarPdf(); } catch (e) {} }
  function agenda() { if (!t) t = setTimeout(corre, 200); }
  function ligar() {
    if (!D.body) return false;
    new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    setInterval(corre, 2000);
    corre(); return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
