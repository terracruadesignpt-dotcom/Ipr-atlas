/* IPR · Conversores (25/11/2026). Terracrua Design. Página /conversores/ e menu Ferramentas do IPR Atlas.
   Nuno (00h06): «a página Conversores, onde tem DWG packages, KML e todas as versões dos engenheiros, topógrafos e 3Ds. Tudo a
   funcionar. Gratuito até 7 conversões. A partir daí [...] cada conversão custa 1 € e tem que carregar com saldo.» (00h25: «7 são muitas, mete 3».)
   Quatro conversores:
   1. AutoCAD e SIG no servidor (worker do IPR, /tcd/v1/carregar/parte): DWG, DXF, GPKG, Shapefile, KML/KMZ, GeoJSON, GPX.
   2. Topografia no navegador: pontos CSV/TXT/PNEZD e LandXML, entre PT-TM06, Datum 73, Datum Lisboa, UTM e WGS84.
   3. SIG no navegador: KML, KMZ, GeoJSON, GPX, Shapefile (.zip) e DXF, de uns para os outros, com o sistema de coordenadas
      escolhido para DXF, Shapefile e CSV.
   4. 3D no navegador: OBJ, STL, PLY, GLB/GLTF e nuvens de pontos XYZ/LAS.
   Cada conversão conta no saldo da conta (m93963: /tcd/v1/conversores/gastar). Os ficheiros convertidos no navegador não
   saem do computador da pessoa. */
(function () {
  "use strict";
  var W = window, D = document, C = W.IPR_CV || {};
  var raiz = D.getElementById("ipr-cv");
  if (!raiz || W.__iprCv) return; W.__iprCv = 1;
  var EST = C.estado || { sessao: false, gratis: 3, preco_c: 100 };
  var NPM = "https://cdn.jsdelivr.net/npm/";

  // ---------------------------------------------------------------- sistemas de coordenadas
  var CRS = [
    { c: 3763, n: "PT-TM06 / ETRS89 (Portugal continental)", p: "+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8.133108333333334 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" },
    { c: 27493, n: "Datum 73 / Hayford-Gauss IPCC (antigo, ~2 m)", p: "+proj=tmerc +lat_0=39.66666666666666 +lon_0=-8.131906111111112 +k=1 +x_0=180.598 +y_0=-86.99 +ellps=intl +towgs84=-230.994,102.591,25.199,0.633,-0.239,0.9,1.95 +units=m +no_defs" },
    { c: 20790, n: "Datum Lisboa / Hayford-Gauss militar (IGeoE, ~2,5 m)", p: "+proj=tmerc +lat_0=39.66666666666666 +lon_0=1 +k=1 +x_0=200000 +y_0=300000 +ellps=intl +pm=lisbon +towgs84=-303.861,-60.693,103.607,0,0,0,0 +units=m +no_defs" },
    { c: 5018, n: "Datum Lisboa / Hayford-Gauss IPCC (~2,5 m)", p: "+proj=tmerc +lat_0=39.66666666666666 +lon_0=-8.131906111111112 +k=1 +x_0=0 +y_0=0 +ellps=intl +towgs84=-303.861,-60.693,103.607,0,0,0,0 +units=m +no_defs" },
    { c: 25829, n: "ETRS89 / UTM 29N", p: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" },
    { c: 32629, n: "WGS84 / UTM 29N (GPS)", p: "+proj=utm +zone=29 +datum=WGS84 +units=m +no_defs" },
    { c: 23029, n: "ED50 / UTM 29N (~5 m)", p: "+proj=utm +zone=29 +ellps=intl +towgs84=-87.987,-108.639,-121.593,0,0,0,0 +units=m +no_defs" },
    { c: 25830, n: "ETRS89 / UTM 30N (Espanha)", p: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" },
    { c: 5015, n: "PTRA08 / UTM 26N (Açores)", p: "+proj=utm +zone=26 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" },
    { c: 5016, n: "PTRA08 / UTM 28N (Madeira)", p: "+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" },
    { c: 4326, n: "WGS84 graus (longitude, latitude)", p: "+proj=longlat +datum=WGS84 +no_defs" },
    { c: 3857, n: "Web Mercator (Google, OSM)", p: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs" }
  ];
  var WKT = __WKT__;

  // ---------------------------------------------------------------- utilidades
  function el(t, cls, html) { var e = D.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function xmlEsc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function euro(c) { return (c / 100).toFixed(2).replace(".", ",") + " €"; }
  var carregados = {};
  function script(url) {
    if (carregados[url]) return carregados[url];
    return (carregados[url] = new Promise(function (ok, ko) { var s = D.createElement("script"); s.src = url; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = function () { delete carregados[url]; ko(new Error("Não consegui carregar " + url.split("/npm/")[1])); }; D.head.appendChild(s); }));
  }
  function esm(url) { return import(/* webpackIgnore: true */ url); }
  function proj4L() { return W.proj4 ? Promise.resolve(W.proj4) : script(NPM + "proj4@2.12.1/dist/proj4.js").then(function () { CRS.forEach(function (k) { W.proj4.defs("EPSG:" + k.c, k.p); }); return W.proj4; }); }
  function zipL() { return W.JSZip ? Promise.resolve(W.JSZip) : script(NPM + "jszip@3.10.2/dist/jszip.min.js").then(function () { return W.JSZip; }); }
  function tgL() { return W.toGeoJSON ? Promise.resolve(W.toGeoJSON) : script(NPM + "@tmcw/togeojson@7.1.3/dist/togeojson.umd.js").then(function () { return W.toGeoJSON; }); }
  function shpL() { return W.shp ? Promise.resolve(W.shp) : script(NPM + "shpjs@6.2.0/dist/shp.min.js").then(function () { return W.shp; }); }
  function ler(f, como) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { ko(r.error); }; if (como === "texto") r.readAsText(f); else r.readAsArrayBuffer(f); }); }
  function ext(nome) { var m = /\.([a-z0-9]+)$/i.exec(nome || ""); return m ? m[1].toLowerCase() : ""; }
  function base(nome) { return String(nome || "ficheiro").replace(/\.[^.]+$/, "").replace(/[^\w.\-À-ÿ ]+/g, "_").slice(0, 80); }
  function descarregar(conteudo, nome, tipo) {
    var b = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo || "application/octet-stream" });
    var a = D.createElement("a"); a.href = URL.createObjectURL(b); a.download = nome; D.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function api(rota, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = op.headers || {};
    if (C.nonce) op.headers["X-WP-Nonce"] = C.nonce;
    return fetch(C.rest + rota, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.message || ("Erro " + r.status)); e.status = r.status; throw e; } return j; }); });
  }
  function gastar(de, para, nome) {
    if (!EST.sessao) { pedirConta(); return Promise.reject(new Error("Entre na sua conta (é grátis) para converter.")); }
    var pedido = "nav-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    return api("conversores/gastar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: pedido, de: de, para: para, nome: nome }) })
      .then(function (j) { if (j.estado) { EST = j.estado; conta(); } return j; })
      .catch(function (e) { if (e.status === 402) { mostrarSaldo(true); } throw e; });
  }

  // ---------------------------------------------------------------- estilo
  var css = el("style", null, "");
  css.textContent =
    ".ipr-cv{--f:#0f150c;--p:#151d11;--p2:#1b2516;--l:#2b3826;--t:#e8e6db;--t2:#a7ab98;--v:#94BE39;--a:#e8b04a;--e:#e06a5a;max-width:1180px;margin:0 auto;padding:28px max(16px,env(safe-area-inset-left,0px)) 60px;color:var(--t);font:15px/1.55 Geist,Inter,system-ui,sans-serif}" +
    "body:has(.ipr-cv){background:#0f150c}" +
    ".ipr-cv *{box-sizing:border-box}.ipr-cv h1{font:600 30px/1.15 Geist,Inter,system-ui,sans-serif;margin:0 0 6px;color:var(--t)!important;text-align:left!important;letter-spacing:-.01em}" +
    ".ipr-cv .sub{color:var(--t2);margin:0 0 22px;max-width:760px}" +
    ".ipr-cv .eyb{font:500 11px/1 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--v);margin:0 0 10px}" +
    ".ipr-cv .conta{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;background:var(--p);border:1px solid var(--l);border-radius:14px;padding:14px 16px;margin:0 0 22px}" +
    ".ipr-cv .conta b{color:var(--t)}.ipr-cv .conta .k{color:var(--t2)}.ipr-cv .conta .sp{flex:1}" +
    ".ipr-cv .bt{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid var(--l);background:var(--p2);color:var(--t);font:600 14px Geist,Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}" +
    ".ipr-cv .bt:hover{border-color:var(--v)}.ipr-cv .bt.pr{background:var(--v);border-color:var(--v);color:#11160d}.ipr-cv .bt[disabled]{opacity:.5;cursor:wait}" +
    ".ipr-cv .tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.ipr-cv .tab{padding:10px 16px;border-radius:12px;border:1px solid var(--l);background:transparent;color:var(--t2);font:600 14px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    ".ipr-cv .tab.on{background:var(--p2);color:var(--t);border-color:var(--v)}" +
    ".ipr-cv .pn{background:var(--p);border:1px solid var(--l);border-radius:16px;padding:20px}" +
    ".ipr-cv .pn h2{font:600 19px/1.3 Geist,Inter,system-ui,sans-serif;margin:0 0 4px;color:var(--t)!important;text-align:left!important}.ipr-cv .pn .ds{color:var(--t2);margin:0 0 16px}" +
    ".ipr-cv .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}" +
    ".ipr-cv label.c{display:block;font-size:13px;color:var(--t2);margin:0 0 6px}" +
    ".ipr-cv select,.ipr-cv input[type=text]{width:100%;min-height:42px;border-radius:10px;border:1px solid var(--l);background:#0c120a;color:var(--t);padding:0 12px;font:14px Geist,Inter,system-ui,sans-serif}" +
    ".ipr-cv .zona{border:1.5px dashed #3b4b33;border-radius:14px;padding:26px 16px;text-align:center;color:var(--t2);cursor:pointer;background:#10170d;margin:0 0 14px}" +
    ".ipr-cv .zona.sobre{border-color:var(--v);color:var(--t)}.ipr-cv .zona b{color:var(--t)}" +
    ".ipr-cv .chips{display:flex;flex-wrap:wrap;gap:8px}.ipr-cv .chip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;border:1px solid var(--l);font-size:13px;cursor:pointer;user-select:none}" +
    ".ipr-cv .chip input{accent-color:#94BE39}.ipr-cv .chip:has(input:checked){border-color:var(--v);color:var(--t)}" +
    ".ipr-cv .msg{margin:14px 0 0;padding:12px 14px;border-radius:12px;background:#10170d;border:1px solid var(--l);font-size:14px}" +
    ".ipr-cv .msg.er{border-color:var(--e);color:#ffd9d3}.ipr-cv .msg.ok{border-color:var(--v)}" +
    ".ipr-cv .acc{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0}" +
    ".ipr-cv .nota{font-size:12.5px;color:var(--t2);margin:10px 0 0}.ipr-cv .lst{margin:12px 0 0;display:grid;gap:8px}" +
    ".ipr-cv .it{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:10px 12px;border:1px solid var(--l);border-radius:12px;background:#10170d;font-size:14px}" +
    ".ipr-cv .it .nm{font-weight:600;flex:1 1 220px;min-width:0;overflow-wrap:anywhere}.ipr-cv .it a{color:var(--v)}" +
    ".ipr-cv .saldo{margin:0 0 22px;padding:18px;border-radius:16px;border:1px solid var(--a);background:#1d1a10}.ipr-cv .saldo h3{margin:0 0 6px;font:600 17px Geist,Inter,system-ui,sans-serif;color:var(--t)!important;text-align:left!important}" +
    ".ipr-cv .prev{max-height:220px;overflow:auto;font:12px/1.5 'IBM Plex Mono',ui-monospace,monospace;background:#0b1009;border:1px solid var(--l);border-radius:10px;padding:10px;margin:12px 0 0;white-space:pre}" +
    "@media (max-width:640px){.ipr-cv{padding-top:18px}.ipr-cv h1{font-size:24px}.ipr-cv .pn{padding:16px}.ipr-cv .tab{flex:1 1 calc(50% - 8px)}}";
  D.head.appendChild(css);

  // ---------------------------------------------------------------- estrutura
  raiz.classList.add("ipr-cv");
  raiz.innerHTML =
    '<p class="eyb">IPR · Ferramentas</p><h1>Conversores</h1>' +
    '<p class="sub">AutoCAD, SIG, topografia e 3D, de um formato para o outro e entre os sistemas de coordenadas usados em Portugal. ' +
    'As ' + (EST.gratis || 3) + ' primeiras conversões são grátis; depois, 1 € + IVA cada, do seu saldo. Os conversores do navegador não enviam os seus ficheiros para lado nenhum.</p>' +
    '<div class="conta" data-conta></div><div data-saldo hidden></div>' +
    '<div class="tabs" role="tablist">' +
    '<button class="tab on" data-t="cad" role="tab">AutoCAD e SIG</button><button class="tab" data-t="topo" role="tab">Topografia</button>' +
    '<button class="tab" data-t="sig" role="tab">SIG rápido</button><button class="tab" data-t="3d" role="tab">3D</button></div>' +
    '<div data-p="cad" class="pn"></div><div data-p="topo" class="pn" hidden></div><div data-p="sig" class="pn" hidden></div><div data-p="3d" class="pn" hidden></div>';
  function $(s, c) { return (c || raiz).querySelector(s); }
  raiz.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () {
      raiz.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === b); });
      raiz.querySelectorAll("[data-p]").forEach(function (p) { p.hidden = p.getAttribute("data-p") !== b.getAttribute("data-t"); });
      try { history.replaceState(null, "", "#" + b.getAttribute("data-t")); } catch (e) {}
    });
  });
  var h = (location.hash || "").slice(1); if (h) { var tb = $('.tab[data-t="' + h + '"]'); if (tb) tb.click(); }

  function conta() {
    var c = $("[data-conta]");
    if (!EST.sessao) {
      c.innerHTML = '<span><b>Conta grátis</b> <span class="k">para converter: ' + (EST.gratis || 3) + ' conversões incluídas.</span></span><span class="sp"></span>' +
        '<a class="bt pr" href="' + esc(C.registar) + '">Criar conta grátis</a><a class="bt" href="' + esc(C.entrar) + '">Entrar</a>';
      return;
    }
    if (EST.ilimitado) { c.innerHTML = '<span><b>Sem limite</b> <span class="k">(Intelligence ou equipa). Conversões feitas: ' + (EST.total || 0) + '.</span></span>'; return; }
    c.innerHTML = '<span><span class="k">Grátis por usar</span> <b>' + Math.max(0, EST.gratis_resta || 0) + ' de ' + EST.gratis + '</b></span>' +
      '<span><span class="k">Saldo</span> <b>' + euro(EST.saldo_c || 0) + '</b> <span class="k">(' + Math.floor((EST.saldo_c || 0) / EST.preco_c) + ' conversões)</span></span>' +
      '<span class="sp"></span><button class="bt" data-carregar>Carregar saldo</button>';
    $("[data-carregar]", c).onclick = function () { mostrarSaldo(false); };
  }
  function mostrarSaldo(semSaldo) {
    var s = $("[data-saldo]"); var P = (C.produtos || EST.produtos || []);
    s.hidden = false; s.className = "saldo";
    s.innerHTML = '<h3>' + (semSaldo ? "Já usou as " + (EST.gratis || 3) + " conversões grátis" : "Carregar saldo de conversões") + '</h3>' +
      '<p class="nota" style="margin:0 0 12px">Cada conversão custa 1 € + IVA (1,23 €). O saldo fica na sua conta e a factura é emitida na compra.</p>' +
      '<div class="acc" style="margin:0">' + (P.length ? P.map(function (p) { return '<a class="bt pr" href="' + esc(p.url) + '">' + euro(p.valor_c) + ' + IVA · ' + Math.round(p.valor_c / 100) + ' conversões</a>'; }).join("") : '<span class="nota">Os carregamentos estão a ser preparados. Escreva-nos para cloud@regenerativo.pt.</span>') +
      '<button class="bt" data-fechar>Fechar</button></div>';
    $("[data-fechar]", s).onclick = function () { s.hidden = true; };
    try { s.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
  }
  function pedirConta() {
    var s = $("[data-saldo]"); s.hidden = false; s.className = "saldo";
    s.innerHTML = '<h3>Crie a sua conta grátis</h3><p class="nota" style="margin:0 0 12px">Com conta e e-mail confirmado tem ' + (EST.gratis || 3) + ' conversões grátis. Depois, 1 € + IVA cada.</p>' +
      '<div class="acc" style="margin:0"><a class="bt pr" href="' + esc(C.registar) + '">Criar conta grátis</a><a class="bt" href="' + esc(C.entrar) + '">Entrar</a></div>';
  }
  function crsSelect(def, so) {
    return '<select>' + CRS.filter(function (k) { return !so || so.indexOf(k.c) >= 0; }).map(function (k) { return '<option value="' + k.c + '"' + (k.c === def ? " selected" : "") + ">" + esc(k.n) + " · EPSG:" + k.c + "</option>"; }).join("") + "</select>";
  }
  function zona(painel, aceita, texto, cb) {
    var z = el("div", "zona", '<b>' + texto + '</b><br><span>Largue aqui o ficheiro ou toque para escolher. Aceita: ' + aceita.join(", ").toUpperCase() + "</span>");
    var inp = el("input"); inp.type = "file"; inp.hidden = true; inp.accept = aceita.map(function (a) { return "." + a; }).join(",");
    z.appendChild(inp); z.onclick = function () { inp.click(); };
    inp.onchange = function () { if (inp.files[0]) cb(inp.files[0]); inp.value = ""; };
    z.addEventListener("dragover", function (e) { e.preventDefault(); z.classList.add("sobre"); });
    z.addEventListener("dragleave", function () { z.classList.remove("sobre"); });
    z.addEventListener("drop", function (e) { e.preventDefault(); z.classList.remove("sobre"); var f = e.dataTransfer.files[0]; if (f) cb(f); });
    painel.appendChild(z); return z;
  }
  function aviso(painel, txt, tipo) { var m = $(".msg", painel); if (!m) { m = el("div", "msg"); painel.appendChild(m); } m.className = "msg" + (tipo ? " " + tipo : ""); m.innerHTML = txt; return m; }

  // ================================================================= 1. AutoCAD e SIG no servidor
  (function () {
    var p = $('[data-p="cad"]');
    p.innerHTML = '<h2>AutoCAD e SIG (no servidor do IPR)</h2><p class="ds">DWG de todas as versões, DXF, GeoPackage, Shapefile (.zip), KML/KMZ, GeoJSON e GPX. O desenho fica em PT-TM06 com cotas, layers, cores e tracejados. Até 300 MB.</p>' +
      '<div class="grid"><div><label class="c">Sistema de coordenadas do desenho (AutoCAD)</label><span data-crs></span></div>' +
      '<div><label class="c">Formatos a receber (GeoPackage e GeoJSON vêm sempre)</label><div class="chips" data-sai>' +
      ["kml", "kmz", "shp", "dxf", "gpx"].map(function (k) { return '<label class="chip"><input type="checkbox" value="' + k + '"' + (k === "kml" || k === "shp" || k === "dxf" ? " checked" : "") + "> " + (k === "shp" ? "Shapefile" : k.toUpperCase()) + "</label>"; }).join("") + "</div></div></div>";
    $("[data-crs]", p).innerHTML = '<select><option value="">Detectar sozinho (recomendado)</option>' + CRS.filter(function (k) { return [3763, 27493, 5018, 20790, 25829, 23029, 32629].indexOf(k.c) >= 0; }).map(function (k) { return '<option value="' + k.c + '">' + esc(k.n) + "</option>"; }).join("") + "</select>";
    var z = zona(p, ["dwg", "dxf", "gpkg", "zip", "kml", "kmz", "geojson", "json", "gpx"], "Ficheiro AutoCAD ou SIG", enviar);
    var lst = el("div", "lst"); p.appendChild(lst);
    var a = {};
    function sha256(buf) { return crypto.subtle.digest("SHA-256", buf).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }); }
    function enviar(f) {
      if (!EST.sessao) { pedirConta(); return; }
      if (f.size > 300 * 1048576) { aviso(p, "O ficheiro tem mais de 300 MB.", "er"); return; }
      var saida = [].map.call(p.querySelectorAll("[data-sai] input:checked"), function (i) { return i.value; }).join(",");
      var crs = $("[data-crs] select", p).value;
      var PARTE = 8 * 1048576, partes = Math.max(1, Math.ceil(f.size / PARTE));
      var it = el("div", "it", '<span class="nm">' + esc(f.name) + '</span><span data-e>A enviar…</span>'); lst.prepend(it);
      ler(f).then(function (buf) {
        return sha256(buf).then(function (sha) {
          var i = 0;
          function proxima() {
            var q = "carregar/parte?projecto=0&nome=" + encodeURIComponent(f.name) + "&parte=" + i + "&partes=" + partes + "&tamanho=" + f.size + "&saida=" + encodeURIComponent(saida) + (crs ? "&crs=" + crs : "") + (i === partes - 1 ? "&sha256=" + sha : "");
            $("[data-e]", it).textContent = "A enviar " + Math.round(i / partes * 100) + "%";
            return api(q, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: buf.slice(i * PARTE, Math.min(f.size, (i + 1) * PARTE)) }).then(function (j) {
              i++; if (i < partes) return proxima(); return j;
            });
          }
          return proxima();
        });
      }).then(function (j) {
        var fid = j && j.ficheiro && j.ficheiro.id; $("[data-e]", it).textContent = "Na fila de conversão…";
        api("conversores/estado").then(function (e) { if (e && e.sessao) { EST = e; conta(); } });
        if (fid) vigiar(fid, it);
      }).catch(function (e) {
        $("[data-e]", it).innerHTML = '<span style="color:#ffb3a7">' + esc(e.message) + "</span>";
        if (e.status === 402) mostrarSaldo(true);
      });
    }
    function vigiar(fid, it) {
      var n = 0;
      (function volta() {
        api("carregar/meus").then(function (j) {
          var f = (j.ficheiros || []).filter(function (x) { return x.id === fid; })[0];
          if (!f) return;
          var links = ["gpkg", "geojson", "kml", "kmz", "shp", "dxf", "gpx"].filter(function (k) { return f[k]; }).map(function (k) { return '<a href="' + esc(f[k]) + '">' + (k === "shp" ? "Shapefile" : k === "gpkg" ? "GeoPackage" : k.toUpperCase()) + "</a>"; }).join(" · ");
          $("[data-e]", it).innerHTML = esc(f.msg || f.estado) + (links ? "<br>" + links : "");
          if (/^(pronto|erro|georref)$/.test(f.estado)) return;
          if (++n < 240) setTimeout(volta, n < 12 ? 5000 : 15000);
        }).catch(function () { if (++n < 240) setTimeout(volta, 15000); });
      })();
    }
    // os ficheiros já enviados (com sessão)
    if (EST.sessao) api("carregar/meus").then(function (j) {
      (j.ficheiros || []).filter(function (f) { return !f.enc; }).slice(0, 8).forEach(function (f) {
        var it = el("div", "it", '<span class="nm">' + esc(f.nome) + '</span><span data-e></span>'); lst.appendChild(it);
        var links = ["gpkg", "geojson", "kml", "kmz", "shp", "dxf", "gpx"].filter(function (k) { return f[k]; }).map(function (k) { return '<a href="' + esc(f[k]) + '">' + (k === "shp" ? "Shapefile" : k === "gpkg" ? "GeoPackage" : k.toUpperCase()) + "</a>"; }).join(" · ");
        $("[data-e]", it).innerHTML = esc(f.msg || f.estado) + (links ? "<br>" + links : "");
      });
    }).catch(function () {});
  })();

  // ================================================================= geometria comum (GeoJSON em WGS84)
  function reprojectar(fc, de, para) {
    if (String(de) === String(para)) return Promise.resolve(fc);
    return proj4L().then(function (P) {
      var t = P("EPSG:" + de, "EPSG:" + para);
      function c(x) { if (typeof x[0] === "number") { var r = t.forward([x[0], x[1]]); return x.length > 2 ? [r[0], r[1], x[2]] : r; } return x.map(c); }
      return { type: "FeatureCollection", features: fc.features.map(function (f) { if (!f.geometry) return f; var g = f.geometry; return { type: "Feature", properties: f.properties || {}, geometry: g.type === "GeometryCollection" ? { type: g.type, geometries: g.geometries.map(function (x) { return { type: x.type, coordinates: c(x.coordinates) }; }) } : { type: g.type, coordinates: c(g.coordinates) } }; }) };
    });
  }
  function achatar(fc) { // Multi* e colecções em partes simples
    var out = [];
    fc.features.forEach(function (f) {
      var g = f.geometry; if (!g) return;
      var gs = g.type === "GeometryCollection" ? g.geometries : [g];
      gs.forEach(function (x) {
        if (/^Multi/.test(x.type)) x.coordinates.forEach(function (c) { out.push({ type: "Feature", properties: f.properties || {}, geometry: { type: x.type.slice(5), coordinates: c } }); });
        else out.push({ type: "Feature", properties: f.properties || {}, geometry: x });
      });
    });
    return out;
  }
  // ---- DXF: leitor próprio (POINT, LINE, LWPOLYLINE, POLYLINE/VERTEX, CIRCLE, ARC, TEXT/MTEXT, 3DFACE, INSERT como ponto)
  function lerDXF(txt) {
    var L = txt.split(/\r?\n/), i = 0, feats = [], emEnt = false;
    function par() { if (i + 1 >= L.length) return null; var c = parseInt(L[i], 10), v = L[i + 1]; i += 2; return [c, v == null ? "" : v.trim()]; }
    var p, ent = null, poly = null;
    function fecha() {
      if (!ent) return; var e = ent; ent = null;
      var lay = e[8] || "0", props = { layer: lay };
      if (e._t === "POINT") feats.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [+e[10], +e[20], +(e[30] || 0)] } });
      else if (e._t === "LINE") feats.push({ type: "Feature", properties: props, geometry: { type: "LineString", coordinates: [[+e[10], +e[20], +(e[30] || 0)], [+e[11], +e[21], +(e[31] || 0)]] } });
      else if (e._t === "LWPOLYLINE") { var c = e._xs.map(function (x, k) { return [x, e._ys[k], +(e[38] || 0)]; }); if ((+e[70] & 1) && c.length > 2) { c.push(c[0]); feats.push({ type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [c] } }); } else if (c.length > 1) feats.push({ type: "Feature", properties: props, geometry: { type: "LineString", coordinates: c } }); }
      else if (e._t === "CIRCLE" || e._t === "ARC") {
        var cx = +e[10], cy = +e[20], r = +e[40], a0 = e._t === "ARC" ? +e[50] : 0, a1 = e._t === "ARC" ? +e[51] : 360; if (a1 <= a0) a1 += 360;
        var pts = [], n = Math.max(12, Math.round((a1 - a0) / 6));
        for (var k = 0; k <= n; k++) { var a = (a0 + (a1 - a0) * k / n) * Math.PI / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), +(e[30] || 0)]); }
        feats.push({ type: "Feature", properties: props, geometry: e._t === "CIRCLE" ? { type: "Polygon", coordinates: [pts] } : { type: "LineString", coordinates: pts } });
      }
      else if (e._t === "TEXT" || e._t === "MTEXT") { props.texto = (e[1] || "").replace(/\\P/g, " ").replace(/\{\\[^;]*;|\}/g, ""); feats.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [+e[10], +e[20], +(e[30] || 0)] } }); }
      else if (e._t === "3DFACE") { var q = [[+e[10], +e[20], +(e[30] || 0)], [+e[11], +e[21], +(e[31] || 0)], [+e[12], +e[22], +(e[32] || 0)], [+e[13], +e[23], +(e[33] || 0)]]; if (q[3][0] === q[2][0] && q[3][1] === q[2][1]) q.pop(); q.push(q[0]); feats.push({ type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [q] } }); }
      else if (e._t === "INSERT") { props.bloco = e[2] || ""; feats.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [+e[10], +e[20], +(e[30] || 0)] } }); }
    }
    while ((p = par())) {
      if (p[0] === 0 && p[1] === "SECTION") { var nm = par(); emEnt = nm && nm[1] === "ENTITIES"; continue; }
      if (!emEnt) continue;
      if (p[0] === 0) {
        if (poly && p[1] === "VERTEX") { fecha(); ent = { _t: "VERTEX" }; continue; }
        if (poly && p[1] === "SEQEND") { if (ent && ent._t === "VERTEX") { poly._c.push([+ent[10], +ent[20], +(ent[30] || 0)]); ent = null; } var pp = poly; poly = null; var cc = pp._c; var props2 = { layer: pp[8] || "0" }; if ((+pp[70] & 1) && cc.length > 2) { cc.push(cc[0]); feats.push({ type: "Feature", properties: props2, geometry: { type: "Polygon", coordinates: [cc] } }); } else if (cc.length > 1) feats.push({ type: "Feature", properties: props2, geometry: { type: "LineString", coordinates: cc } }); continue; }
        if (ent && ent._t === "VERTEX" && poly) { poly._c.push([+ent[10], +ent[20], +(ent[30] || 0)]); ent = null; }
        fecha();
        if (p[1] === "ENDSEC") { emEnt = false; continue; }
        if (p[1] === "POLYLINE") { poly = { _t: "POLYLINE", _c: [] }; ent = null; continue; }
        ent = { _t: p[1], _xs: [], _ys: [] };
        continue;
      }
      var alvo = poly && !ent ? poly : ent; if (!alvo) continue;
      if (alvo._t === "LWPOLYLINE" && p[0] === 10) alvo._xs.push(+p[1]);
      else if (alvo._t === "LWPOLYLINE" && p[0] === 20) alvo._ys.push(+p[1]);
      else if (alvo[p[0]] == null || p[0] === 1) alvo[p[0]] = alvo[p[0]] != null && p[0] === 1 ? alvo[p[0]] + p[1] : p[1];
    }
    fecha();
    return { type: "FeatureCollection", features: feats };
  }
  // ---- escritores
  function cStr(c) { return c.map(function (x) { return x[0].toFixed(8) + "," + x[1].toFixed(8) + (x.length > 2 ? "," + (+x[2]).toFixed(3) : ""); }).join(" "); }
  function kmlGeom(g) {
    if (!g) return "";
    if (g.type === "Point") return "<Point><coordinates>" + cStr([g.coordinates]) + "</coordinates></Point>";
    if (g.type === "LineString") return "<LineString><tessellate>1</tessellate><coordinates>" + cStr(g.coordinates) + "</coordinates></LineString>";
    if (g.type === "Polygon") return "<Polygon>" + g.coordinates.map(function (r, k) { return (k ? "<innerBoundaryIs>" : "<outerBoundaryIs>") + "<LinearRing><coordinates>" + cStr(r) + "</coordinates></LinearRing>" + (k ? "</innerBoundaryIs>" : "</outerBoundaryIs>"); }).join("") + "</Polygon>";
    if (/^Multi/.test(g.type)) return "<MultiGeometry>" + g.coordinates.map(function (c) { return kmlGeom({ type: g.type.slice(5), coordinates: c }); }).join("") + "</MultiGeometry>";
    if (g.type === "GeometryCollection") return "<MultiGeometry>" + g.geometries.map(kmlGeom).join("") + "</MultiGeometry>";
    return "";
  }
  function paraKML(fc, nome) {
    var s = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' + xmlEsc(nome) + '</name>' +
      '<Style id="ipr"><LineStyle><color>ff39be94</color><width>2</width></LineStyle><PolyStyle><color>4039be94</color></PolyStyle></Style>';
    fc.features.forEach(function (f, i) {
      var pr = f.properties || {}, nm = pr.name || pr.nome || pr.Name || pr.texto || pr.P || pr.ponto || ("Elemento " + (i + 1));
      s += "<Placemark><name>" + xmlEsc(nm) + "</name><styleUrl>#ipr</styleUrl><ExtendedData>" + Object.keys(pr).map(function (k) { var v = pr[k]; if (v != null && typeof v === "object") v = JSON.stringify(v); return '<Data name="' + xmlEsc(k) + '"><value>' + xmlEsc(v) + "</value></Data>"; }).join("") + "</ExtendedData>" + kmlGeom(f.geometry) + "</Placemark>";
    });
    return s + "</Document></kml>";
  }
  function paraGPX(fc) {
    var w = "", t = "";
    achatar(fc).forEach(function (f, i) {
      var g = f.geometry, pr = f.properties || {}, nm = xmlEsc(pr.name || pr.nome || pr.texto || pr.P || ("E" + (i + 1)));
      function pt(c, tag) { return "<" + tag + ' lat="' + c[1].toFixed(8) + '" lon="' + c[0].toFixed(8) + '">' + (c.length > 2 ? "<ele>" + (+c[2]).toFixed(3) + "</ele>" : "") + (tag === "wpt" ? "<name>" + nm + "</name>" : "") + "</" + tag + ">"; }
      if (g.type === "Point") w += pt(g.coordinates, "wpt");
      else if (g.type === "LineString") t += "<trk><name>" + nm + "</name><trkseg>" + g.coordinates.map(function (c) { return pt(c, "trkpt"); }).join("") + "</trkseg></trk>";
      else if (g.type === "Polygon") t += "<trk><name>" + nm + "</name>" + g.coordinates.map(function (r) { return "<trkseg>" + r.map(function (c) { return pt(c, "trkpt"); }).join("") + "</trkseg>"; }).join("") + "</trk>";
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="IPR Conversores · regenerativo.pt" xmlns="http://www.topografix.com/GPX/1/1">' + w + t + "</gpx>";
  }
  function paraDXF(fc, textos) { // R12 ASCII: POINT, POLYLINE 3D, TEXT; layer pela propriedade layer/Layer/camada ou pelo tipo
    var o = ["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"];
    function lay(f, def) { var p = f.properties || {}; return String(p.layer || p.Layer || p.camada || p.codigo || p.Codigo || def).replace(/[^A-Za-z0-9_\-$À-ÿ ]/g, "_").slice(0, 60) || def; }
    function v(c, k) { o.push("10", String(c[0]), "20", String(c[1]), "30", String(c[2] || 0)); }
    achatar(fc).forEach(function (f) {
      var g = f.geometry;
      if (g.type === "Point") {
        var l = lay(f, "PONTOS"); o.push("0", "POINT", "8", l); v(g.coordinates);
        var tx = textos && (f.properties.P || f.properties.ponto || f.properties.texto || f.properties.name);
        if (tx != null && tx !== "") { o.push("0", "TEXT", "8", l + "_TEXTO", "10", String(g.coordinates[0] + 0.3), "20", String(g.coordinates[1] + 0.3), "30", String(g.coordinates[2] || 0), "40", "0.5", "1", String(tx)); }
      } else {
        var rings = g.type === "LineString" ? [g.coordinates] : g.coordinates;
        rings.forEach(function (r) {
          o.push("0", "POLYLINE", "8", lay(f, g.type === "Polygon" ? "POLIGONOS" : "LINHAS"), "66", "1", "10", "0", "20", "0", "30", "0", "70", g.type === "Polygon" ? "9" : "8");
          r.forEach(function (c) { o.push("0", "VERTEX", "8", lay(f, "LINHAS"), "10", String(c[0]), "20", String(c[1]), "30", String(c[2] || 0), "70", "32"); });
          o.push("0", "SEQEND");
        });
      }
    });
    o.push("0", "ENDSEC", "0", "EOF");
    return o.join("\r\n") + "\r\n";
  }
  function paraCSVwkt(fc) {
    var keys = {}; fc.features.forEach(function (f) { Object.keys(f.properties || {}).forEach(function (k) { keys[k] = 1; }); });
    var K = Object.keys(keys);
    function wkt(g) {
      function cs(c) { return c.map(function (x) { return x.slice(0, 3).join(" "); }).join(", "); }
      if (!g) return "";
      if (g.type === "Point") return "POINT Z (" + g.coordinates.slice(0, 3).concat(g.coordinates.length < 3 ? [0] : []).join(" ") + ")";
      if (g.type === "LineString") return "LINESTRING (" + cs(g.coordinates) + ")";
      if (g.type === "Polygon") return "POLYGON (" + g.coordinates.map(function (r) { return "(" + cs(r) + ")"; }).join(", ") + ")";
      if (g.type === "MultiPoint") return "MULTIPOINT (" + g.coordinates.map(function (c) { return "(" + c.slice(0, 3).join(" ") + ")"; }).join(", ") + ")";
      if (g.type === "MultiLineString") return "MULTILINESTRING (" + g.coordinates.map(function (l) { return "(" + cs(l) + ")"; }).join(", ") + ")";
      if (g.type === "MultiPolygon") return "MULTIPOLYGON (" + g.coordinates.map(function (p) { return "(" + p.map(function (r) { return "(" + cs(r) + ")"; }).join(", ") + ")"; }).join(", ") + ")";
      return "";
    }
    function q(v) { v = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v)); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    return ["WKT"].concat(K).join(";") + "\n" + fc.features.map(function (f) { return [q(wkt(f.geometry))].concat(K.map(function (k) { return q((f.properties || {})[k]); })).join(";"); }).join("\n") + "\n";
  }
  // Shapefile (.zip com .shp .shx .dbf .prj .cpg), um por tipo de geometria
  function paraSHP(fc, epsg, nome) {
    var grupos = { pontos: [], linhas: [], poligonos: [] };
    fc.features.forEach(function (f) {
      var g = f.geometry; if (!g) return;
      var t = /Point/.test(g.type) ? "pontos" : /LineString/.test(g.type) ? "linhas" : /Polygon/.test(g.type) ? "poligonos" : null; if (t) grupos[t].push(f);
    });
    return zipL().then(function (JSZip) {
      var z = new JSZip();
      Object.keys(grupos).forEach(function (t) {
        var fs = grupos[t]; if (!fs.length) return;
        var tipo = t === "pontos" ? 11 : t === "linhas" ? 13 : 15; // PointZ, PolyLineZ, PolygonZ
        var recs = fs.map(function (f) {
          var g = f.geometry, partes;
          if (t === "pontos") partes = g.type === "Point" ? [[g.coordinates]] : g.coordinates.map(function (c) { return [c]; });
          else if (t === "linhas") partes = g.type === "LineString" ? [g.coordinates] : g.coordinates;
          else { partes = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map(function (pol) { return pol.map(function (r, k) { var ar = 0; for (var q = 0; q < r.length - 1; q++) ar += r[q][0] * r[q + 1][1] - r[q + 1][0] * r[q][1]; return (k === 0) === (ar > 0) ? r.slice().reverse() : r; }); }); partes = [].concat.apply([], partes); } // exterior no sentido dos ponteiros, buracos ao contrário
          return partes;
        });
        // pontos múltiplos viram vários registos
        if (t === "pontos") { var nr = [], nf = []; recs.forEach(function (r, i) { r.forEach(function (pp) { nr.push([pp]); nf.push(fs[i]); }); }); recs = nr; fs = nf; }
        var bb = [Infinity, Infinity, -Infinity, -Infinity, Infinity, -Infinity];
        function bx(c) { bb[0] = Math.min(bb[0], c[0]); bb[1] = Math.min(bb[1], c[1]); bb[2] = Math.max(bb[2], c[0]); bb[3] = Math.max(bb[3], c[1]); var zz = +(c[2] || 0); bb[4] = Math.min(bb[4], zz); bb[5] = Math.max(bb[5], zz); }
        recs.forEach(function (r) { r.forEach(function (pp) { pp.forEach(bx); }); });
        var conteudos = recs.map(function (r) {
          if (t === "pontos") { var c = r[0][0]; var b = new DataView(new ArrayBuffer(4 + 32)); b.setInt32(0, 11, true); b.setFloat64(4, c[0], true); b.setFloat64(12, c[1], true); b.setFloat64(20, +(c[2] || 0), true); b.setFloat64(28, 0, true); return b.buffer; }
          var np = r.length, n = r.reduce(function (a, pp) { return a + pp.length; }, 0);
          var tam = 4 + 32 + 4 + 4 + 4 * np + 16 * n + 16 + 8 * n + 16 + 8 * n;
          var d = new DataView(new ArrayBuffer(tam)), o = 0, lb = [Infinity, Infinity, -Infinity, -Infinity, Infinity, -Infinity];
          r.forEach(function (pp) { pp.forEach(function (c) { lb[0] = Math.min(lb[0], c[0]); lb[1] = Math.min(lb[1], c[1]); lb[2] = Math.max(lb[2], c[0]); lb[3] = Math.max(lb[3], c[1]); var zz = +(c[2] || 0); lb[4] = Math.min(lb[4], zz); lb[5] = Math.max(lb[5], zz); }); });
          d.setInt32(o, tipo, true); o += 4; [0, 1, 2, 3].forEach(function (k) { d.setFloat64(o, lb[k], true); o += 8; });
          d.setInt32(o, np, true); o += 4; d.setInt32(o, n, true); o += 4;
          var ac = 0; r.forEach(function (pp) { d.setInt32(o, ac, true); o += 4; ac += pp.length; });
          r.forEach(function (pp) { pp.forEach(function (c) { d.setFloat64(o, c[0], true); o += 8; d.setFloat64(o, c[1], true); o += 8; }); });
          d.setFloat64(o, lb[4], true); o += 8; d.setFloat64(o, lb[5], true); o += 8;
          r.forEach(function (pp) { pp.forEach(function (c) { d.setFloat64(o, +(c[2] || 0), true); o += 8; }); });
          d.setFloat64(o, 0, true); o += 8; d.setFloat64(o, 0, true); o += 8;
          r.forEach(function (pp) { pp.forEach(function () { d.setFloat64(o, 0, true); o += 8; }); });
          return d.buffer;
        });
        function cab(tot) { var b = new DataView(new ArrayBuffer(100)); b.setInt32(0, 9994, false); b.setInt32(24, tot / 2, false); b.setInt32(28, 1000, true); b.setInt32(32, tipo, true); [0, 1, 2, 3].forEach(function (k) { b.setFloat64(36 + 8 * k, isFinite(bb[k]) ? bb[k] : 0, true); }); b.setFloat64(68, isFinite(bb[4]) ? bb[4] : 0, true); b.setFloat64(76, isFinite(bb[5]) ? bb[5] : 0, true); return b; }
        var totShp = 100 + conteudos.reduce(function (a, c) { return a + 8 + c.byteLength; }, 0), totShx = 100 + 8 * conteudos.length;
        var shp = new Uint8Array(totShp), shx = new Uint8Array(totShx);
        shp.set(new Uint8Array(cab(totShp).buffer), 0); shx.set(new Uint8Array(cab(totShx).buffer), 0);
        var off = 100, sx = new DataView(shx.buffer);
        conteudos.forEach(function (c, i) {
          var rh = new DataView(new ArrayBuffer(8)); rh.setInt32(0, i + 1, false); rh.setInt32(4, c.byteLength / 2, false);
          sx.setInt32(100 + 8 * i, off / 2, false); sx.setInt32(104 + 8 * i, c.byteLength / 2, false);
          shp.set(new Uint8Array(rh.buffer), off); shp.set(new Uint8Array(c), off + 8); off += 8 + c.byteLength;
        });
        // DBF: campos de texto (até 254), nomes até 10 caracteres
        var nomes = {}; fs.forEach(function (f) { Object.keys(f.properties || {}).forEach(function (k) { nomes[k] = 1; }); });
        var K = Object.keys(nomes).slice(0, 120); if (!K.length) K = ["id"];
        var usados = {}, campos = K.map(function (k) { var n = k.normalize("NFD").replace(/[^\w]/g, "").slice(0, 10) || "campo"; var b2 = n, j = 1; while (usados[n.toUpperCase()]) n = b2.slice(0, 8) + (j++); usados[n.toUpperCase()] = 1; return n; });
        var enc = new TextEncoder();
        var larg = K.map(function (k) { var m = 1; fs.forEach(function (f) { var v = (f.properties || {})[k]; if (v != null) m = Math.max(m, enc.encode(typeof v === "object" ? JSON.stringify(v) : String(v)).length); }); return Math.min(254, m); });
        var recLen = 1 + larg.reduce(function (a, b) { return a + b; }, 0), hl = 32 + 32 * K.length + 1;
        var dbf = new Uint8Array(hl + recLen * fs.length + 1), dv = new DataView(dbf.buffer), hoje = new Date();
        dbf[0] = 3; dbf[1] = hoje.getFullYear() - 1900; dbf[2] = hoje.getMonth() + 1; dbf[3] = hoje.getDate();
        dv.setInt32(4, fs.length, true); dv.setInt16(8, hl, true); dv.setInt16(10, recLen, true); dbf[29] = 0;
        K.forEach(function (k, i) { var o2 = 32 + 32 * i; dbf.set(enc.encode(campos[i]).slice(0, 10), o2); dbf[o2 + 11] = 67; dbf[o2 + 16] = larg[i]; });
        dbf[hl - 1] = 13;
        fs.forEach(function (f, r) {
          var o2 = hl + r * recLen; dbf[o2] = 32; var c2 = o2 + 1;
          K.forEach(function (k, i) { var v = (f.properties || {})[k]; var b3 = enc.encode(v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v))).slice(0, larg[i]); dbf.fill(32, c2, c2 + larg[i]); dbf.set(b3, c2); c2 += larg[i]; });
        });
        dbf[dbf.length - 1] = 26;
        var nm = base(nome) + "_" + t;
        z.file(nm + ".shp", shp); z.file(nm + ".shx", shx); z.file(nm + ".dbf", dbf); z.file(nm + ".cpg", "UTF-8");
        if (WKT[epsg]) z.file(nm + ".prj", WKT[epsg]);
      });
      return z.generateAsync({ type: "blob", compression: "DEFLATE" });
    });
  }

  // ================================================================= 2. Topografia
  (function () {
    var p = $('[data-p="topo"]');
    p.innerHTML = '<h2>Topografia (no navegador)</h2><p class="ds">Pontos de levantamento em CSV, TXT ou PNEZD e LandXML (pontos e superfícies). Muda o sistema de coordenadas e o formato. As cotas (Z) não mudam.</p>' +
      '<div class="grid"><div><label class="c">Sistema de origem</label><span data-de></span></div><div><label class="c">Sistema de destino</label><span data-para></span></div>' +
      '<div><label class="c">Ordem das colunas (CSV/TXT)</label><select data-ord><option value="auto">Detectar pelo cabeçalho</option><option value="PXYZD">Ponto, X (M), Y (P), Z, Código</option><option value="PYXZD">Ponto, Y (P), X (M), Z, Código (PNEZD)</option><option value="XYZ">X, Y, Z</option><option value="YXZ">Y, X, Z</option><option value="XYZD">X, Y, Z, Código</option></select></div>' +
      '<div><label class="c">Formato de saída</label><select data-sai><option value="csv">CSV (Ponto;X;Y;Z;Código)</option><option value="txt">TXT PNEZD (espaços)</option><option value="dxf">DXF (pontos e números)</option><option value="kml">KML (Google Earth)</option><option value="geojson">GeoJSON</option><option value="gpx">GPX (GPS)</option><option value="landxml">LandXML</option><option value="shp">Shapefile (.zip)</option></select></div></div>';
    $("[data-de]", p).innerHTML = crsSelect(3763); $("[data-para]", p).innerHTML = crsSelect(4326);
    zona(p, ["csv", "txt", "xyz", "pnezd", "xml", "landxml"], "Ficheiro de pontos ou LandXML", function (f) {
      var de = +$("[data-de] select", p).value, para = +$("[data-para] select", p).value, sai = $("[data-sai]", p).value, ord = $("[data-ord]", p).value;
      ler(f, "texto").then(function (txt) {
        var pts = /^(xml|landxml)$/.test(ext(f.name)) || /<LandXML/i.test(txt.slice(0, 800)) ? lerLandXML(txt) : lerPontos(txt, ord);
        if (!pts.pts.length) throw new Error("Não encontrei pontos no ficheiro. Verifique a ordem das colunas.");
        return gastar(ext(f.name), sai, f.name).then(function () { return converterPontos(pts, de, para, sai, f.name); });
      }).then(function (r) { aviso(p, "Feito: " + r + ".", "ok"); }).catch(function (e) { aviso(p, esc(e.message), "er"); });
    });
    p.appendChild(el("p", "nota", "Datum 73 e Datum Lisboa usam os parâmetros oficiais de 7 e 3 parâmetros (exactidão de 2 a 2,5 m, a da EPSG e da DGT). Para trabalhos ao centímetro nesses sistemas antigos use a grelha da DGT no QGIS."));
  })();
  function num(s) { s = String(s).trim(); if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, ""); return parseFloat(s.replace(",", ".")); }
  function lerPontos(txt, ord) {
    var L = txt.replace(/^﻿/, "").split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!L.length) return { pts: [] };
    var sep = /;/.test(L[0]) ? ";" : /\t/.test(L[0]) ? "\t" : /,/.test(L[0]) && !/\d,\d/.test(L[0].replace(/,\s*\D/g, "")) ? "," : /,/.test(L[0]) && (L[0].match(/,/g) || []).length >= 2 ? "," : /\s+/;
    function cols(l) { return (typeof sep === "string" ? l.split(sep) : l.trim().split(sep)).map(function (x) { return x.trim().replace(/^"|"$/g, ""); }); }
    var c0 = cols(L[0]), cab = c0.some(function (x) { return /[a-zA-Z]{2,}/.test(x) && isNaN(num(x)); }), mapa = null;
    if (ord === "auto") {
      if (cab) {
        var low = c0.map(function (x) { return x.toLowerCase(); });
        function idx(re) { for (var i = 0; i < low.length; i++) if (re.test(low[i])) return i; return -1; }
        mapa = { P: idx(/^(p|pt|ponto|point|name|nome|id|n[ºo]?)$/), X: idx(/^(x|m|e|este|easting|est|lon|longitude)$/), Y: idx(/^(y|p|n|norte|northing|nor|lat|latitude)$/), Z: idx(/^(z|h|cota|alt|altitude|elev|elevation|cota z)$/), D: idx(/^(d|cod|codigo|código|code|desc|descricao|descrição)$/) };
        if (mapa.X < 0 || mapa.Y < 0) mapa = null;
        else if (mapa.Y === mapa.P) mapa.P = -1;
      }
      if (!mapa) { var n = cols(L[cab ? 1 : 0]).length; ord = n >= 4 && isNaN(num(cols(L[cab ? 1 : 0])[0])) ? "PXYZD" : n >= 4 ? (isNaN(num(cols(L[cab ? 1 : 0])[3])) ? "XYZD" : "PXYZD") : "XYZ"; }
    }
    if (!mapa) { mapa = { P: -1, X: -1, Y: -1, Z: -1, D: -1 }; ord.split("").forEach(function (k, i) { mapa[k] = i; }); }
    var pts = [];
    L.slice(cab ? 1 : 0).forEach(function (l, i) {
      var c = cols(l); var x = num(c[mapa.X]), y = num(c[mapa.Y]);
      if (!isFinite(x) || !isFinite(y)) return;
      pts.push({ P: mapa.P >= 0 ? c[mapa.P] : String(i + 1), x: x, y: y, z: mapa.Z >= 0 ? num(c[mapa.Z]) : NaN, d: mapa.D >= 0 ? (c[mapa.D] || "") : "" });
    });
    return { pts: pts };
  }
  function lerLandXML(txt) {
    var x = new DOMParser().parseFromString(txt, "application/xml"), pts = [], faces = [];
    [].forEach.call(x.getElementsByTagName("CgPoint"), function (e, i) { var v = e.textContent.trim().split(/\s+/).map(Number); if (v.length >= 2) pts.push({ P: e.getAttribute("name") || e.getAttribute("pntRef") || String(i + 1), y: v[0], x: v[1], z: v.length > 2 ? v[2] : NaN, d: e.getAttribute("code") || e.getAttribute("desc") || "" }); });
    var srf = x.getElementsByTagName("Surface")[0];
    if (srf) {
      var idm = {}, base0 = pts.length;
      [].forEach.call(srf.getElementsByTagName("P"), function (e) { var v = e.textContent.trim().split(/\s+/).map(Number); idm[e.getAttribute("id")] = pts.length; pts.push({ P: "S" + e.getAttribute("id"), y: v[0], x: v[1], z: v[2], d: "superficie" }); });
      [].forEach.call(srf.getElementsByTagName("F"), function (e) { if (e.getAttribute("i") === "1") return; var v = e.textContent.trim().split(/\s+/); if (v.length >= 3) faces.push(v.slice(0, 3).map(function (k) { return idm[k]; })); });
      if (!faces.length) faces = null; void base0;
    }
    return { pts: pts, faces: faces && faces.length ? faces : null };
  }
  function converterPontos(dados, de, para, sai, nome) {
    return proj4L().then(function (P) {
      var t = P("EPSG:" + de, "EPSG:" + para), tg = P("EPSG:" + de, "EPSG:4326");
      var geo = String(para) === "4326";
      var pts = dados.pts.map(function (p) { var r = t.forward([p.x, p.y]); var g = tg.forward([p.x, p.y]); return { P: p.P, x: r[0], y: r[1], z: p.z, d: p.d, lon: g[0], lat: g[1] }; });
      var nd = geo ? 8 : 3, b = base(nome) + "_EPSG" + para;
      function zz(p) { return isFinite(p.z) ? p.z.toFixed(3) : ""; }
      if (sai === "csv") { descarregar("﻿Ponto;" + (geo ? "Longitude;Latitude" : "X (M);Y (P)") + ";Z;Codigo\n" + pts.map(function (p) { return [p.P, p.x.toFixed(nd).replace(".", ","), p.y.toFixed(nd).replace(".", ","), zz(p).replace(".", ","), p.d].join(";"); }).join("\n") + "\n", b + ".csv", "text/csv;charset=utf-8"); return b + ".csv"; }
      if (sai === "txt") { descarregar(pts.map(function (p) { return [p.P, p.y.toFixed(nd), p.x.toFixed(nd), zz(p) || "0", p.d].join(" "); }).join("\r\n") + "\r\n", b + "_PNEZD.txt", "text/plain"); return b + "_PNEZD.txt"; }
      var fcProj = { type: "FeatureCollection", features: pts.map(function (p) { return { type: "Feature", properties: { P: p.P, codigo: p.d, cota: zz(p) }, geometry: { type: "Point", coordinates: [p.x, p.y, isFinite(p.z) ? p.z : 0] } }; }) };
      var fcGeo = { type: "FeatureCollection", features: pts.map(function (p) { return { type: "Feature", properties: { P: p.P, codigo: p.d, cota: zz(p) }, geometry: { type: "Point", coordinates: [p.lon, p.lat, isFinite(p.z) ? p.z : 0] } }; }) };
      if (dados.faces) {
        var tri = dados.faces.filter(function (f) { return f.every(function (k) { return k != null && pts[k]; }); });
        var faceF = function (pp, usarGeo) { return tri.map(function (f) { var r = f.map(function (k) { var q = pts[k]; return usarGeo ? [q.lon, q.lat, q.z || 0] : [q.x, q.y, q.z || 0]; }); r.push(r[0]); return { type: "Feature", properties: { layer: "SUPERFICIE" }, geometry: { type: "Polygon", coordinates: [r] } }; }); };
        fcProj.features = fcProj.features.concat(faceF(pts, false)); fcGeo.features = fcGeo.features.concat(faceF(pts, true));
      }
      if (sai === "dxf") { descarregar(paraDXF(fcProj, true), b + ".dxf", "application/dxf"); return b + ".dxf"; }
      if (sai === "kml") { descarregar(paraKML(fcGeo, base(nome)), base(nome) + ".kml", "application/vnd.google-earth.kml+xml"); return base(nome) + ".kml"; }
      if (sai === "gpx") { descarregar(paraGPX(fcGeo), base(nome) + ".gpx", "application/gpx+xml"); return base(nome) + ".gpx"; }
      if (sai === "geojson") { var gj = geo ? fcGeo : fcProj; if (!geo) gj.crs = { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::" + para } }; descarregar(JSON.stringify(gj), b + ".geojson", "application/geo+json"); return b + ".geojson"; }
      if (sai === "shp") return paraSHP(fcProj, para, nome).then(function (bl) { descarregar(bl, b + "_shapefile.zip"); return b + "_shapefile.zip"; });
      if (sai === "landxml") {
        var s = '<?xml version="1.0" encoding="UTF-8"?>\n<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" version="1.2" date="' + new Date().toISOString().slice(0, 10) + '"><Units><Metric linearUnit="meter" areaUnit="squareMeter" volumeUnit="cubicMeter" angularUnit="decimal degrees" directionUnit="decimal degrees"/></Units>' +
          '<CoordinateSystem epsgCode="' + para + '"/><Application name="IPR Conversores" manufacturer="IPR · regenerativo.pt"/><CgPoints>' +
          pts.map(function (p) { return '<CgPoint name="' + xmlEsc(p.P) + '"' + (p.d ? ' code="' + xmlEsc(p.d) + '"' : "") + ">" + p.y.toFixed(nd) + " " + p.x.toFixed(nd) + (isFinite(p.z) ? " " + p.z.toFixed(3) : "") + "</CgPoint>"; }).join("") + "</CgPoints>";
        if (dados.faces) s += '<Surfaces><Surface name="Superficie"><Definition surfType="TIN"><Pnts>' + pts.map(function (p, i) { return '<P id="' + (i + 1) + '">' + p.y.toFixed(nd) + " " + p.x.toFixed(nd) + " " + (p.z || 0).toFixed(3) + "</P>"; }).join("") + "</Pnts><Faces>" + dados.faces.map(function (f) { return "<F>" + f.map(function (k) { return k + 1; }).join(" ") + "</F>"; }).join("") + "</Faces></Definition></Surface></Surfaces>";
        descarregar(s + "</LandXML>", b + ".xml", "application/xml"); return b + ".xml";
      }
      throw new Error("Formato de saída desconhecido.");
    });
  }

  // ================================================================= 3. SIG rápido
  (function () {
    var p = $('[data-p="sig"]');
    p.innerHTML = '<h2>SIG rápido (no navegador)</h2><p class="ds">KML, KMZ, GeoJSON, GPX, Shapefile (.zip) e DXF simples. Para DWG ou desenhos de arquitectura use «AutoCAD e SIG».</p>' +
      '<div class="grid"><div><label class="c">Sistema do ficheiro de entrada (só DXF e GeoJSON sem sistema)</label><span data-de></span></div>' +
      '<div><label class="c">Formato de saída</label><select data-sai><option value="kml">KML (Google Earth)</option><option value="kmz">KMZ</option><option value="geojson">GeoJSON (WGS84)</option><option value="gpx">GPX (GPS)</option><option value="shp">Shapefile (.zip)</option><option value="dxf">DXF (AutoCAD)</option><option value="csv">CSV com WKT</option></select></div>' +
      '<div><label class="c">Sistema de saída (Shapefile, DXF e CSV)</label><span data-para></span></div></div>';
    $("[data-de]", p).innerHTML = crsSelect(3763); $("[data-para]", p).innerHTML = crsSelect(3763);
    zona(p, ["kml", "kmz", "geojson", "json", "gpx", "zip", "dxf"], "Ficheiro SIG", function (f) {
      var de = +$("[data-de] select", p).value, sai = $("[data-sai]", p).value, para = +$("[data-para] select", p).value, e = ext(f.name);
      aviso(p, "A ler " + esc(f.name) + "…");
      lerSIG(f, de).then(function (fc) {
        if (!fc.features.length) throw new Error("O ficheiro não tem elementos com geometria.");
        return gastar(e, sai, f.name).then(function () { return escreverSIG(fc, sai, para, f.name); }).then(function (n) { aviso(p, "Feito: " + esc(n) + " (" + fc.features.length + (fc.features.length === 1 ? " elemento)." : " elementos)."), "ok"); });
      }).catch(function (er) { aviso(p, esc(er.message), "er"); });
    });
  })();
  function lerSIG(f, de) {
    var e = ext(f.name);
    if (e === "zip") return Promise.all([shpL(), ler(f)]).then(function (r) { return r[0](r[1]); }).then(function (g) { if (Array.isArray(g)) return { type: "FeatureCollection", features: [].concat.apply([], g.map(function (x) { return x.features; })) }; return g; });
    if (e === "kmz") return Promise.all([zipL(), tgL(), ler(f)]).then(function (r) { return r[0].loadAsync(r[2]).then(function (z) { var k = Object.keys(z.files).filter(function (n) { return /\.kml$/i.test(n); })[0]; if (!k) throw new Error("O KMZ não tem KML dentro."); return z.files[k].async("string"); }).then(function (t) { return r[1].kml(new DOMParser().parseFromString(t, "text/xml")); }); });
    if (e === "kml" || e === "gpx") return Promise.all([tgL(), ler(f, "texto")]).then(function (r) { return r[0][e](new DOMParser().parseFromString(r[1], "text/xml")); });
    if (e === "dxf") return ler(f, "texto").then(function (t) { return reprojectar(lerDXF(t), de, 4326); });
    return ler(f, "texto").then(function (t) {
      var g = JSON.parse(t); if (g.type === "Feature") g = { type: "FeatureCollection", features: [g] }; else if (g.type !== "FeatureCollection") g = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: g }] };
      var nm = g.crs && g.crs.properties && g.crs.properties.name, m = /EPSG:{1,2}(\d+)/.exec(nm || "");
      var src = m ? +m[1] : (looksProj(g) ? de : 4326);
      if (src === 4326 || /CRS84/.test(nm || "")) return g;
      return reprojectar(g, src, 4326);
    });
  }
  function looksProj(fc) { var c = null; (function f(x) { if (c) return; if (typeof x[0] === "number") c = x; else x.forEach(f); })((fc.features.find(function (f) { return f.geometry && f.geometry.coordinates; }) || { geometry: { coordinates: [0, 0] } }).geometry.coordinates); return c && (Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90); }
  function escreverSIG(fc, sai, para, nome) {
    var b = base(nome);
    if (sai === "kml") { descarregar(paraKML(fc, b), b + ".kml", "application/vnd.google-earth.kml+xml"); return Promise.resolve(b + ".kml"); }
    if (sai === "kmz") return zipL().then(function (Z) { var z = new Z(); z.file("doc.kml", paraKML(fc, b)); return z.generateAsync({ type: "blob", compression: "DEFLATE" }); }).then(function (bl) { descarregar(bl, b + ".kmz"); return b + ".kmz"; });
    if (sai === "geojson") { descarregar(JSON.stringify(fc), b + ".geojson", "application/geo+json"); return Promise.resolve(b + ".geojson"); }
    if (sai === "gpx") { descarregar(paraGPX(fc), b + ".gpx", "application/gpx+xml"); return Promise.resolve(b + ".gpx"); }
    return reprojectar(fc, 4326, para).then(function (fp) {
      var nm = b + "_EPSG" + para;
      if (sai === "dxf") { descarregar(paraDXF(fp, true), nm + ".dxf", "application/dxf"); return nm + ".dxf"; }
      if (sai === "csv") { descarregar("﻿" + paraCSVwkt(fp), nm + ".csv", "text/csv;charset=utf-8"); return nm + ".csv"; }
      return paraSHP(fp, para, nome).then(function (bl) { descarregar(bl, nm + "_shapefile.zip"); return nm + "_shapefile.zip"; });
    });
  }

  // ================================================================= 4. 3D
  (function () {
    var p = $('[data-p="3d"]');
    p.innerHTML = '<h2>3D (no navegador)</h2><p class="ds">Modelos OBJ, STL, PLY e GLB/GLTF (um só ficheiro) e nuvens de pontos XYZ/TXT e LAS (sem compressão). Para LAZ use o QGIS ou peça-nos a Base Cartográfica.</p>' +
      '<div class="grid"><div><label class="c">Formato de saída</label><select data-sai><option value="glb">GLB (web, Blender, SketchUp)</option><option value="obj">OBJ</option><option value="stl">STL (impressão 3D)</option><option value="ply">PLY (modelos e nuvens)</option><option value="xyz">XYZ (nuvem de pontos)</option></select></div>' +
      '<div><label class="c">Coordenadas grandes (PT-TM06)</label><select data-cen><option value="1">Centrar na origem (guardar o deslocamento no nome)</option><option value="0">Manter as coordenadas</option></select></div></div>';
    zona(p, ["obj", "stl", "ply", "glb", "gltf", "xyz", "txt", "csv", "pts", "las"], "Modelo 3D ou nuvem de pontos", function (f) {
      var sai = $("[data-sai]", p).value, cen = $("[data-cen]", p).value === "1";
      aviso(p, "A ler " + esc(f.name) + "…");
      converter3D(f, sai, cen, function () { return gastar(ext(f.name), sai, f.name); }).then(function (n) { aviso(p, "Feito: " + esc(n) + ".", "ok"); }).catch(function (e) { aviso(p, esc(e.message), "er"); });
    });
  })();
  var T3 = NPM + "three@0.160.0/";
  function three() { return esm(T3 + "+esm"); }
  function lerNuvem(txt) {
    var pts = []; txt.split(/\r?\n/).forEach(function (l) { var c = l.trim().split(/[\s,;]+/); if (c.length < 3) return; var x = parseFloat(c[0]), y = parseFloat(c[1]), z = parseFloat(c[2]); if (isFinite(x) && isFinite(y) && isFinite(z)) pts.push(x, y, z); });
    return new Float64Array(pts);
  }
  function lerLAS(buf) {
    var d = new DataView(buf); if (String.fromCharCode(d.getUint8(0), d.getUint8(1), d.getUint8(2), d.getUint8(3)) !== "LASF") throw new Error("Não é um ficheiro LAS.");
    var off = d.getUint32(96, true), fmt = d.getUint8(104) & 63, rl = d.getUint16(105, true), n = d.getUint32(107, true);
    if (d.getUint8(104) & 128) throw new Error("Este LAS está comprimido (LAZ). Use o QGIS ou o LAStools.");
    if (!n && buf.byteLength > 255) { try { n = Number(d.getBigUint64(247, true)); } catch (e) {} }
    var sx = d.getFloat64(131, true), sy = d.getFloat64(139, true), sz = d.getFloat64(147, true), ox = d.getFloat64(155, true), oy = d.getFloat64(163, true), oz = d.getFloat64(171, true);
    var max = Math.min(n, Math.floor((buf.byteLength - off) / rl), 20000000), out = new Float64Array(max * 3);
    for (var i = 0; i < max; i++) { var o = off + i * rl; out[3 * i] = d.getInt32(o, true) * sx + ox; out[3 * i + 1] = d.getInt32(o + 4, true) * sy + oy; out[3 * i + 2] = d.getInt32(o + 8, true) * sz + oz; }
    void fmt; return out;
  }
  function converter3D(f, sai, centrar, cobrar) {
    var e = ext(f.name), b = base(f.name);
    var nuvem = /^(xyz|txt|csv|pts|las)$/.test(e);
    if (nuvem) {
      return (e === "las" ? ler(f).then(lerLAS) : ler(f, "texto").then(lerNuvem)).then(function (P) {
        if (!P.length) throw new Error("Não encontrei pontos (x y z) no ficheiro.");
        var n = P.length / 3, c = [0, 0, 0];
        if (centrar) { for (var i = 0; i < n; i++) { c[0] += P[3 * i] / n; c[1] += P[3 * i + 1] / n; c[2] += P[3 * i + 2] / n; } c = c.map(function (v) { return Math.round(v); }); }
        var sufixo = centrar ? "_desloc_" + c.join("_") : "";
        return cobrar().then(function () {
          if (sai === "xyz" || sai === "obj") {
            var linhas = new Array(n); for (var i2 = 0; i2 < n; i2++) linhas[i2] = (sai === "obj" ? "v " : "") + (P[3 * i2] - c[0]).toFixed(3) + " " + (P[3 * i2 + 1] - c[1]).toFixed(3) + " " + (P[3 * i2 + 2] - c[2]).toFixed(3);
            descarregar(linhas.join("\n") + "\n", b + sufixo + "." + sai, "text/plain"); return b + sufixo + "." + sai;
          }
          if (sai === "ply") {
            var cab = "ply\nformat binary_little_endian 1.0\ncomment IPR Conversores" + (centrar ? " deslocamento " + c.join(" ") : "") + "\nelement vertex " + n + "\nproperty " + (centrar ? "float" : "double") + " x\nproperty " + (centrar ? "float" : "double") + " y\nproperty " + (centrar ? "float" : "double") + " z\nend_header\n";
            var tb = centrar ? 4 : 8, bufv = new DataView(new ArrayBuffer(n * 3 * tb));
            for (var k = 0; k < n * 3; k++) { var v = P[k] - c[k % 3]; if (centrar) bufv.setFloat32(k * 4, v, true); else bufv.setFloat64(k * 8, v, true); }
            descarregar(new Blob([cab, bufv.buffer]), b + sufixo + ".ply"); return b + sufixo + ".ply";
          }
          throw new Error("Uma nuvem de pontos sai em XYZ, PLY ou OBJ (vértices). Para GLB ou STL é preciso uma malha.");
        });
      });
    }
    return three().then(function (THREE) {
      var carregador = { obj: "OBJLoader", stl: "STLLoader", ply: "PLYLoader", glb: "GLTFLoader", gltf: "GLTFLoader" }[e];
      if (!carregador) throw new Error("Formato 3D não suportado.");
      return Promise.all([esm(T3 + "examples/jsm/loaders/" + carregador + ".js/+esm"), e === "obj" ? ler(f, "texto") : ler(f)]).then(function (r) {
        var L = new r[0][carregador](), dados = r[1];
        if (e === "obj") return L.parse(dados);
        if (e === "stl" || e === "ply") { var g = L.parse(dados); if (!g.attributes.normal) g.computeVertexNormals(); return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x94be39, vertexColors: !!g.attributes.color })); }
        return new Promise(function (ok, ko) { L.parse(dados, "", function (gl) { ok(gl.scene); }, ko); });
      }).then(function (obj) {
        var caixa = new THREE.Box3().setFromObject(obj), c = new THREE.Vector3(); caixa.getCenter(c);
        var sufixo = "";
        if (centrar && (Math.abs(c.x) > 10000 || Math.abs(c.y) > 10000 || Math.abs(c.z) > 10000)) { c.set(Math.round(c.x), Math.round(c.y), Math.round(c.z)); obj.position.sub(c); obj.updateMatrixWorld(true); sufixo = "_desloc_" + c.x + "_" + c.y + "_" + c.z; }
        return cobrar().then(function () {
          var exp = { glb: "GLTFExporter", obj: "OBJExporter", stl: "STLExporter", ply: "PLYExporter" }[sai];
          if (!exp) throw new Error("Um modelo sai em GLB, OBJ, STL ou PLY.");
          return esm(T3 + "examples/jsm/exporters/" + exp + ".js/+esm").then(function (m) {
            var X = new m[exp](), nm = b + sufixo + "." + sai;
            if (sai === "glb") return new Promise(function (ok, ko) { X.parse(obj, function (res) { descarregar(new Blob([res], { type: "model/gltf-binary" }), nm); ok(nm); }, ko, { binary: true }); });
            if (sai === "obj") { descarregar(X.parse(obj), nm, "text/plain"); return nm; }
            if (sai === "stl") { descarregar(new Blob([X.parse(obj, { binary: true })]), nm, "model/stl"); return nm; }
            return new Promise(function (ok) { X.parse(obj, function (res) { descarregar(new Blob([res]), nm); ok(nm); }, { binary: true }); });
          });
        });
      });
    });
  }

  conta();
  // estado fresco (a página pode vir da cache sem sessão)
  if (C.rest) api("conversores/estado").then(function (e) { if (e) { C.produtos = e.produtos; if (e.sessao && !EST.sessao) { EST = e; conta(); } else if (e.sessao) { EST = e; conta(); } } }).catch(function () {});
  W.IPR_CONVERSORES = { lerDXF: lerDXF, paraDXF: paraDXF, paraKML: paraKML, paraGPX: paraGPX, lerPontos: lerPontos, lerLandXML: lerLandXML, paraSHP: paraSHP, reprojectar: reprojectar, CRS: CRS };
})();
