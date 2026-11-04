/* IPR Atlas · bases-painel.js (04/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 04/11/2026, 18h20, para os cartões do separador «Bases» (só a equipa, tablet e computador; no telemóvel não aparece):
   A. «Ficheiros»: «seja que ficheiro for, desde que interesse à equipa». Uma zona para largar ou escolher ficheiros em cada
      cartão (GeoPackage, shp/zip, kml/kmz, geojson, tif, dwg/dxf, Excel/CSV, imagens, PDF), com o limite à vista, o progresso e
      a lista. Decisões das 18h35: vão direto para a Cloudflare R2 (m90777, endereços assinados no servidor, partes de 16 MB);
      rasters aceites até 2 GB. A lista é a mesma do m90381 («Ficheiros do projecto»); retirar usa o m90381 (lixo, recuperável).
   B. «Linha do projecto»: uma linha cronológica com as notas da encomenda, os ficheiros, a implementação, as versões da Base, o
      tipo e os comentários da equipa (m90778). Os comentários ficam num registo só da equipa, com autor e data.
   Desligar: ?bpainel=0 ou localStorage ipr_bpainel_off = 1 (tudo); só os ficheiros ?bficheiros=0; só a linha ?blinha=0. */
(function () {
  "use strict";
  var W = window, D = document, S = location.search;
  try { if (/[?&]bpainel=0(&|$)/.test(S) || W.localStorage.getItem("ipr_bpainel_off") === "1") return; } catch (e) {}
  if (W.__iprBPainel) return; W.__iprBPainel = 1;
  var COM_F = !/[?&]bficheiros=0(&|$)/.test(S), COM_L = !/[?&]blinha=0(&|$)/.test(S);

  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function equipa() { var E = W.tcdEquipa; return !!(E && E.email && W.tcdNonce); }
  function movel() { return (W.innerWidth || 1000) < 600 || D.documentElement.classList.contains("ipr-tl"); }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function parar(n) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup", "dragstart"].forEach(function (v) { n.addEventListener(v, function (e) { e.stopPropagation(); }); }); }
  function api(rota, corpo) {
    var h = { "X-WP-Nonce": W.tcdNonce || "" }; if (corpo) h["Content-Type"] = "application/json";
    return fetch("/wp-json/tcd/v1/" + rota, { method: corpo ? "POST" : "GET", credentials: "same-origin", headers: h, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.message) || r.status); e.status = r.status; throw e; } return j; }); });
  }
  function tam(n) { n = +n || 0; if (n >= 1073741824) return (n / 1073741824).toFixed(2).replace(".", ",") + " GB"; if (n >= 1048576) return (n / 1048576).toFixed(1).replace(".", ",") + " MB"; return Math.max(1, Math.round(n / 1024)) + " kB"; }
  function data(t) { try { return new Date(typeof t === "number" ? t * 1000 : t).toLocaleString(pt() ? "pt-PT" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  var EXT = "pdf jpg jpeg png webp heic gif tif tiff doc docx odt rtf txt md xls xlsx ods csv ppt pptx odp dwg dxf gpkg kml kmz geojson json gpx zip rar 7z qgz qgs shp shx dbf prj cpg vrt jp2 ecw asc img dem mp4 mov mp3 m4a".split(" ");
  var MAX = 2147483648, PARALELO = 3;

  var css = el("style");
  css.textContent =
    ".ipr-bp{display:flex;flex-wrap:wrap;gap:5px;margin:5px 0 2px}html.ipr-tl .ipr-bp,html.ipr-tl .ipr-bpp{display:none!important}@media (max-width:599px){.ipr-bp,.ipr-bpp{display:none!important}}" +
    "#ipe-proj .ipr-bp button,.ipr-bpp button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;min-height:28px;padding:3px 10px;border:1px solid var(--ln,#3a3f30);border-radius:7px;font:600 11.5px/1.3 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf)}" +
    ".ipr-bp button[aria-expanded=true]{border-color:var(--ac,#9BC53D);color:var(--ac,#9BC53D)}.ipr-bp button:focus-visible,.ipr-bpp button:focus-visible{outline:2px solid var(--ac,#9BC53D)}" +
    ".ipr-bpp{margin:6px 0 4px;padding:8px;border:1px solid var(--ln,#3a3f30);border-radius:9px;background:var(--p2,rgba(127,127,127,.06));font:12px/1.4 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf)}" +
    ".ipr-bpp .zona{display:block;padding:12px;border:1.5px dashed var(--ln,#5a604c);border-radius:8px;text-align:center;cursor:pointer;color:var(--mu,#a7ab98)}" +
    ".ipr-bpp .zona.sobre{border-color:var(--ac,#9BC53D);color:var(--tx,#e9eadf);background:rgba(155,197,61,.08)}" +
    ".ipr-bpp .zona b{color:var(--tx,#e9eadf)}.ipr-bpp ul{list-style:none;margin:8px 0 0;padding:0;max-height:260px;overflow:auto}" +
    ".ipr-bpp li{display:flex;gap:6px;align-items:baseline;padding:4px 0;border-top:1px solid var(--ln,#3a3f30)}.ipr-bpp li:first-child{border-top:0}" +
    ".ipr-bpp li a{color:var(--tx,#e9eadf);word-break:break-all;flex:1}.ipr-bpp small{color:var(--mu,#a7ab98)}" +
    ".ipr-bpp .bar{height:5px;border-radius:3px;background:var(--ln,#3a3f30);overflow:hidden;margin-top:3px}.ipr-bpp .bar i{display:block;height:100%;width:0;background:var(--ac,#9BC53D)}" +
    ".ipr-bpp .mau{color:#e07a5f}.ipr-bpp textarea{box-sizing:border-box;width:100%;min-height:54px;margin:0 0 5px;border:1px solid var(--ln,#3a3f30);border-radius:7px;background:var(--p3,#1d2117);color:var(--tx,#e9eadf);font:12.5px/1.4 Inter,system-ui,sans-serif;padding:6px}" +
    ".ipr-bpp .ev{display:block;padding:5px 0;border-top:1px solid var(--ln,#3a3f30)}.ipr-bpp .ev:first-child{border-top:0}.ipr-bpp .ev .k{font:600 10px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mu,#a7ab98);margin-right:6px}" +
    ".ipr-bpp .ev.comentario{border-left:2px solid var(--ac,#9BC53D);padding-left:7px}.ipr-bpp .ev p{margin:2px 0 0;white-space:pre-wrap}.ipr-bpp .lst{max-height:320px;overflow:auto;margin-top:6px}";
  (D.head || D.documentElement).appendChild(css);

  function cartoes() { return [].slice.call(D.querySelectorAll("#ipe-proj .ipe-card[data-i]")); }
  function mapa(c) { var P = est(); return P && P.mapas ? P.mapas[+c.getAttribute("data-i")] || null : null; }
  var ABERTO = {}; // id -> "f" | "l"

  // ---------- A. ficheiros ----------
  var ENVIOS = {}; // id -> [{nome, tam, feito, xhr[], token, erro, fim}]
  function listar(id, P) {
    var ul = P.querySelector("ul") || P.appendChild(el("ul"));
    api("pfich?alvo=e:" + id).then(function (j) {
      ul.textContent = "";
      var fs = (j && j.ficheiros) || [];
      if (!fs.length) ul.appendChild(el("li", "", T("Ainda sem ficheiros.", "No files yet.")));
      fs.forEach(function (f) {
        var li = el("li"), a = el("a", "", f.nome); a.href = f.url + (f.url.indexOf("?") >= 0 ? "&" : "?") + "_wpnonce=" + encodeURIComponent(W.tcdNonce || ""); a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(a); li.appendChild(el("small", "", tam(f.tamanho) + " · " + (f.por || "") + " · " + data(f.quando)));
        if (f.meu || (j && j.pode)) {
          var x = el("button", "", T("Retirar", "Remove")); x.type = "button"; x.title = T("Vai para o lixo (recuperável)", "Goes to the bin (recoverable)");
          x.addEventListener("click", function () { if (x.dataset.c !== "1") { x.dataset.c = "1"; x.textContent = T("Confirmar", "Confirm"); return; } x.disabled = true; api("pfich/retirar?id=" + f.id, {}).then(function () { listar(id, P); }).catch(function (e) { x.textContent = e.message; }); });
          li.appendChild(x);
        }
        ul.appendChild(li);
      });
    }).catch(function (e) { ul.textContent = ""; ul.appendChild(el("li", "mau", T("Não foi possível ler os ficheiros: ", "Could not read the files: ") + e.message)); });
  }
  function pintarEnvios(id, P) {
    var box = P.querySelector(".env") || P.insertBefore(el("div", "env"), P.querySelector("ul"));
    box.textContent = "";
    (ENVIOS[id] || []).forEach(function (e) {
      if (e.fim && Date.now() - e.fim > 8000) return;
      var d = el("div"); d.appendChild(el("span", e.erro ? "mau" : "", e.nome + " · " + tam(e.tam) + " · " + (e.erro ? e.erro : e.fim ? T("guardado na R2", "saved to R2") : Math.floor(100 * e.feito / e.tam) + " %")));
      if (!e.fim && !e.erro) { var c = el("button", "", T("Cancelar", "Cancel")); c.type = "button"; c.style.marginLeft = "6px"; c.addEventListener("click", function () { cancelar(e); }); d.appendChild(c); }
      var b = el("div", "bar"), i = el("i"); i.style.width = Math.min(100, 100 * e.feito / e.tam) + "%"; b.appendChild(i); d.appendChild(b);
      box.appendChild(d);
    });
  }
  function cancelar(e) { e.cancelado = true; (e.xhr || []).forEach(function (x) { try { x.abort(); } catch (y) {} }); e.erro = T("cancelado", "cancelled"); if (e.token) api("m777/cancelar", { token: e.token }).catch(function () {}); }
  function enviar(id, f, P) {
    var ext = String(f.name.split(".").pop() || "").toLowerCase();
    var e = { nome: f.name, tam: f.size, feito: 0, xhr: [], partes: [] };
    (ENVIOS[id] = ENVIOS[id] || []).push(e);
    var pinta = function () { pintarEnvios(id, P); };
    if (EXT.indexOf(ext) < 0) { e.erro = T("tipo não aceite", "type not accepted"); pinta(); return Promise.resolve(); }
    if (f.size > MAX) { e.erro = T("acima de 2 GB", "over 2 GB"); pinta(); return Promise.resolve(); }
    if (!f.size) { e.erro = T("ficheiro vazio", "empty file"); pinta(); return Promise.resolve(); }
    pinta();
    return api("m777/iniciar", { alvo: "e:" + id, nome: f.name, tamanho: f.size, tipo: f.type || "" }).then(function (j) {
      e.token = j.token; var urls = j.urls || [], P16 = j.parte || 16777216, prox = 0, vivos = 0, feitoP = {};
      return new Promise(function (ok, nao) {
        function proximo() {
          if (e.cancelado) return nao(new Error(T("cancelado", "cancelled")));
          if (prox >= urls.length && !vivos) return ok();
          while (vivos < PARALELO && prox < urls.length) (function (n) {
            vivos++;
            var blob = f.slice(n * P16, Math.min(f.size, (n + 1) * P16)), x = new XMLHttpRequest(), tentativa = 0;
            function vai() {
              x = new XMLHttpRequest(); e.xhr.push(x);
              x.open("PUT", urls[n]);
              x.upload.onprogress = function (ev) { feitoP[n] = ev.loaded; e.feito = Object.keys(feitoP).reduce(function (s, k) { return s + feitoP[k]; }, 0); pinta(); };
              x.onload = function () {
                var et = x.getResponseHeader("ETag");
                if (x.status >= 200 && x.status < 300 && et) { e.partes.push({ n: n + 1, etag: et }); feitoP[n] = blob.size; vivos--; proximo(); }
                else if (tentativa++ < 2 && !e.cancelado) setTimeout(vai, 1500 * tentativa);
                else nao(new Error(et ? "R2 " + x.status : T("a R2 não devolveu a etiqueta da parte (regra CORS?)", "R2 returned no part tag (CORS rule?)")));
              };
              x.onerror = function () { if (tentativa++ < 2 && !e.cancelado) setTimeout(vai, 1500 * tentativa); else nao(new Error(T("ligação à R2 falhou", "connection to R2 failed"))); };
              x.send(blob);
            }
            vai();
          })(prox++);
        }
        proximo();
      });
    }).then(function () { return api("m777/concluir", { token: e.token, partes: e.partes }); })
      .then(function () { e.fim = Date.now(); e.feito = e.tam; pinta(); listar(id, P); setTimeout(pinta, 8500); })
      .catch(function (x) { if (!e.cancelado) { e.erro = x.message || String(x); if (e.token) api("m777/cancelar", { token: e.token }).catch(function () {}); } pinta(); });
  }
  function painelF(c, m, P) {
    var id = String(m.id);
    var inp = el("input"); inp.type = "file"; inp.multiple = true; inp.hidden = true; inp.accept = EXT.map(function (x) { return "." + x; }).join(",");
    var z = el("label", "zona"); z.appendChild(el("b", "", T("Largar ficheiros aqui ou escolher", "Drop files here or choose")));
    z.appendChild(D.createElement("br"));
    z.appendChild(el("small", "", T("Até 2 GB por ficheiro, guardados na Cloudflare R2. GeoPackage, SIG (shp, kml, geojson, tif), AutoCAD, Excel, CSV, imagens, PDF.", "Up to 2 GB per file, stored on Cloudflare R2.")));
    z.appendChild(inp);
    var lanca = function (fl) { var arr = [].slice.call(fl || []); var seq = Promise.resolve(); arr.forEach(function (f) { seq = seq.then(function () { return enviar(id, f, P); }); }); };
    inp.addEventListener("change", function () { lanca(inp.files); inp.value = ""; });
    P.__lanca = lanca;
    ["dragenter", "dragover"].forEach(function (t) { z.addEventListener(t, function (ev) { ev.preventDefault(); ev.stopPropagation(); z.classList.add("sobre"); }); });
    ["dragleave", "drop"].forEach(function (t) { z.addEventListener(t, function (ev) { ev.preventDefault(); ev.stopPropagation(); z.classList.remove("sobre"); }); });
    z.addEventListener("drop", function (ev) { lanca(ev.dataTransfer && ev.dataTransfer.files); });
    P.appendChild(z); P.appendChild(el("div", "env")); P.appendChild(el("ul"));
    pintarEnvios(id, P); listar(id, P);
  }

  // ---------- B. linha do projecto ----------
  var KN = { enc: ["Encomenda", "Order"], pago: ["Pagamento", "Payment"], fim: ["Concluída", "Completed"], nota: ["Nota", "Note"], nota_cliente: ["Nota ao cliente", "Note to client"], ficheiro: ["Ficheiro", "File"], impl: ["Implementação", "Implementation"], versao: ["Base", "Base"], tipo: ["Tipo", "Type"], comentario: ["Comentário", "Comment"] };
  function painelL(c, m, P) {
    var id = String(m.id), lst = el("div", "lst");
    var ta = el("textarea"); ta.maxLength = 2000; ta.placeholder = T("Comentário para a equipa (só a equipa vê)", "Comment for the team (team only)"); ta.setAttribute("aria-label", T("Comentário da equipa", "Team comment"));
    var b = el("button", "", T("Comentar", "Comment")); b.type = "button"; var msg = el("small");
    b.addEventListener("click", function () {
      var v = ta.value.trim(); if (!v) return; b.disabled = true; msg.className = ""; msg.textContent = "…";
      api("m778/comentar", { enc: +id, texto: v }).then(function () { ta.value = ""; msg.textContent = T("Guardado", "Saved"); b.disabled = false; ler(); })
        .catch(function (e) { b.disabled = false; msg.className = "mau"; msg.textContent = e.message; });
    });
    ta.addEventListener("keydown", function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") b.click(); });
    P.appendChild(ta); P.appendChild(b); P.appendChild(el("span", "", " ")); P.appendChild(msg); P.appendChild(lst);
    function ler() {
      api("m778/linha?enc=" + id).then(function (j) {
        lst.textContent = ""; if (!(j && j.pode)) { ta.hidden = b.hidden = true; }
        var L = (j && j.linha) || [];
        if (j && j.grupo) { var g = el("div", "ev"); g.appendChild(el("span", "k", T("Grupo", "Group"))); g.appendChild(D.createTextNode(j.grupo)); lst.appendChild(g); }
        if (!L.length) lst.appendChild(el("div", "ev", T("Sem registos.", "Nothing recorded.")));
        L.forEach(function (x) {
          var d = el("div", "ev " + x.k); d.appendChild(el("span", "k", (KN[x.k] ? T(KN[x.k][0], KN[x.k][1]) : x.k)));
          d.appendChild(el("small", "", data(x.t) + (x.por ? " · " + x.por : "")));
          d.appendChild(el("p", "", String(x.txt || "").slice(0, 1500)));
          if (x.k === "comentario" && x.meu) {
            var r = el("button", "", T("Retirar", "Remove")); r.type = "button";
            r.addEventListener("click", function () { if (r.dataset.c !== "1") { r.dataset.c = "1"; r.textContent = T("Confirmar", "Confirm"); return; } api("m778/retirar", { id: x.id }).then(ler).catch(function (e) { r.textContent = e.message; }); });
            d.appendChild(r);
          }
          lst.appendChild(d);
        });
      }).catch(function (e) { lst.textContent = ""; lst.appendChild(el("div", "ev mau", T("Não foi possível ler a linha: ", "Could not read the timeline: ") + e.message)); });
    }
    ler();
  }

  // ---------- cartões ----------
  function abrir(c, m, q) {
    var id = String(m.id), ct = c.querySelector(".ipe-ct") || c, ant = ct.querySelector(":scope > .ipr-bpp");
    if (ant) ant.remove();
    ABERTO[id] = ABERTO[id] === q ? "" : q;
    var R = ct.querySelector(":scope > .ipr-bp");
    [].forEach.call(R ? R.querySelectorAll("button[data-bp]") : [], function (b) { b.setAttribute("aria-expanded", b.getAttribute("data-bp") === ABERTO[id] ? "true" : "false"); });
    if (!ABERTO[id]) return;
    var P = el("div", "ipr-bpp"); parar(P);
    if (R && R.nextSibling) ct.insertBefore(P, R.nextSibling); else ct.appendChild(P);
    if (q === "f") painelF(c, m, P); else painelL(c, m, P);
  }
  function pintar(c) {
    var m = mapa(c); if (!m || !/^\d+$/.test(String(m.id))) return;
    var ct = c.querySelector(".ipe-ct") || c, R = ct.querySelector(":scope > .ipr-bp");
    var k = (pt() ? 1 : 0) + "|" + m.id;
    if (R && R.dataset.k === k) return;
    if (R) R.remove();
    R = el("div", "ipr-bp"); R.dataset.k = k; parar(R);
    [[COM_F, "f", T("Ficheiros", "Files")], [COM_L, "l", T("Linha do projecto", "Project timeline")]].forEach(function (x) {
      if (!x[0]) return; var b = el("button", "", x[2]); b.type = "button"; b.setAttribute("data-bp", x[1]); b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function (ev) { ev.preventDefault(); abrir(c, m, x[1]); }); R.appendChild(b);
    });
    var ba = ct.querySelector(":scope > .ipr-ba"), ec = ct.querySelector(":scope > .ipr-ec"), depois = ba || ec;
    if (depois && depois.nextSibling) ct.insertBefore(R, depois.nextSibling); else ct.appendChild(R);
  }
  function tudo() {
    if (!equipa() || movel() || !(COM_F || COM_L)) return;
    var P = est(); if (!P || !P.mapas) return;
    cartoes().forEach(function (c) { try { pintar(c); } catch (e) {} });
  }
  setInterval(function () { if (!D.hidden) tudo(); }, 1500);
  // largar um ficheiro em cima de um cartão abre o painel dos ficheiros desse cartão
  D.addEventListener("dragover", function (ev) { var c = ev.target.closest && ev.target.closest("#ipe-proj .ipe-card[data-i]"); if (!c || !COM_F || !equipa() || movel()) return; if (ev.dataTransfer && [].indexOf.call(ev.dataTransfer.types || [], "Files") >= 0) { ev.preventDefault(); var m = mapa(c); if (m && ABERTO[String(m.id)] !== "f") abrir(c, m, "f"); } }, true);
  D.addEventListener("drop", function (ev) {
    var c = ev.target.closest && ev.target.closest("#ipe-proj .ipe-card[data-i]"); if (!c || (ev.target.closest && ev.target.closest(".zona"))) return;
    if (!(ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length)) return;
    ev.preventDefault(); ev.stopPropagation();
    var P = c.querySelector(".ipr-bpp"); if (P && P.__lanca) P.__lanca(ev.dataTransfer.files);
  }, true);
  W.__iprBPainel = { abrir: function (c, q) { var m = mapa(c); if (m) abrir(c, m, q || "f"); } };
})();
