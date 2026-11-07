/* IPR Atlas · «O terreno ao longo do tempo» na Ficha da propriedade (07/11/2026). Terracrua Design. Só acrescenta.
   Nuno, 07/11/2026, 21h48: «E incluíste o histórico de imagens na ficha da propriedade?»; escolheu Ficha, Planta e Leitura.
   1. Em todas as fichas (a gratuita, a dos cartões dos projectos e a da equipa), logo a seguir a «PDM e números do terreno»
      (.ipr-fg-pdm do ficha-gratuita.js), junta uma faixa com o terreno recortado nas ortofotos da DGT de 1995 (infravermelho),
      2004 a 2006, 2015 e 2025, com o limite desenhado por cima. Pedidos GetMap directos ao WMS da DGT (CORS aberto), um por
      ano, só da caixa do terreno: é leve.
   2. Três linhas de história, medidas dentro do limite:
      - fogo: anos em que o terreno ardeu, de 1975 a 2025 (ICNF, áreas ardidas, consulta por geometria ao MapServer público);
      - árvores: área onde o coberto arbóreo desapareceu entre 2001 e 2024
        (Hansen / UMD / Global Forest Watch, 30 m, contagem de pixels nos mosaicos);
      - água: área onde houve água à superfície em algum momento desde 1984 e área com água em mais de metade do tempo
        (JRC Global Surface Water, 30 m).
   3. window.IPRTempo = { anos, imagem(F, ano, lado), fogo(F), arvores(F), agua(F) } para a Planta e para a Leitura usarem o
      mesmo cálculo.
   Desligar: ?ftempo=0 ou localStorage ipr_ftempo_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ftempo=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ftempo_off") === "1") return; } catch (e) {}
  if (W.__iprFTempo) return; W.__iprFTempo = 1;

  var WMS = "https://cartografia.dgterritorio.gov.pt/wms/";
  var ANOS = [
    { a: 1995, s: "ortos1995", l: "Ortos1995-FalsaCor", t: "1995 · infravermelho" },
    { a: 2005, s: "ortos2004-2006", l: "Ortos2004-2006-RGB", t: "2004 a 2006" },
    { a: 2015, s: "ortos2015", l: "Ortos2015-RGB", t: "2015" },
    { a: 2025, s: "ortos2025", l: "Ortos2025-RGB", t: "2025" }
  ];
  var ICNF = "https://sigservices.icnf.pt/server/rest/services/BDG/areas_ardidas/MapServer/";
  var ICNF_L = [20, 19, 18, 17, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  var GFC = "https://tiles.globalforestwatch.org/umd_tree_cover_loss/latest/dynamic/{z}/{x}/{y}.png?start_year={a}&end_year={b}&tree_cover_density_threshold=30";
  var GSW = "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png";
  var R = 6378137, MAXM = 20037508.342789244;

  function en() { return (W.IPR_LINGUA || "pt") === "en"; }
  function n(v, c) { return Number(v).toLocaleString(en() ? "en-GB" : "pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: c == null ? 1 : c }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tempo(p, ms) { return Promise.race([p, new Promise(function (r, j) { setTimeout(function () { j(new Error("tempo")); }, ms); })]); }
  function fc(g) {
    if (!g) return null;
    if (g.type === "FeatureCollection") return g;
    if (g.type === "Feature") return { type: "FeatureCollection", features: [g] };
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: g }] };
  }
  function polis(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
  function todos(F) { var o = []; F.features.forEach(function (f) { polis(f.geometry).forEach(function (p) { o.push(p); }); }); return o; }
  function m3857(c) { var la = Math.max(-85, Math.min(85, c[1])); return [R * c[0] * Math.PI / 180, R * Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360))]; }
  function caixa(F) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    todos(F).forEach(function (p) { p.forEach(function (r) { r.forEach(function (c) { var m = m3857(c);
      if (m[0] < b[0]) b[0] = m[0]; if (m[1] < b[1]) b[1] = m[1]; if (m[0] > b[2]) b[2] = m[0]; if (m[1] > b[3]) b[3] = m[1]; }); }); });
    return b[2] > b[0] ? b : null;
  }
  function quadrada(b, folga) {
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, h = Math.max(b[2] - b[0], b[3] - b[1], 120) * (0.5 + (folga || 0.12));
    return [cx - h, cy - h, cx + h, cy + h];
  }
  function lat0(F) { var b = caixa(F); return b ? Math.atan(Math.sinh(((b[1] + b[3]) / 2) / R)) : 0; }
  function blobImg(bl) {
    if (W.createImageBitmap) return W.createImageBitmap(bl);
    return new Promise(function (ok, ko) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = ko; i.src = URL.createObjectURL(bl); });
  }
  function busca(u) { return tempo(fetch(u, { mode: "cors", credentials: "omit" }), 20000).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }); }
  function tracar(x, F, bx, lado, cor, larg) {
    var sx = lado / (bx[2] - bx[0]), sy = lado / (bx[3] - bx[1]);
    x.save(); x.strokeStyle = cor || "#ffd54a"; x.lineWidth = larg || 2; x.lineJoin = "round";
    x.shadowColor = "rgba(0,0,0,.7)"; x.shadowBlur = 3;
    todos(F).forEach(function (p) { p.forEach(function (r) { x.beginPath(); r.forEach(function (c, i) { var m = m3857(c), px = (m[0] - bx[0]) * sx, py = (bx[3] - m[1]) * sy; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); x.stroke(); }); });
    x.restore();
  }

  // ---------- 1. Imagens ----------
  function imagem(F, ano, lado, folga) {
    F = fc(F); lado = lado || 320;
    var A = typeof ano === "object" ? ano : ANOS.filter(function (y) { return y.a === ano; })[0] || ANOS[ANOS.length - 1];
    var b = caixa(F); if (!b) return Promise.reject(new Error("sem limite"));
    var bx = quadrada(b, folga), px = Math.min(1024, Math.round(lado * (W.devicePixelRatio > 1 ? 2 : 1)));
    var u = WMS + A.s + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + encodeURIComponent(A.l) + "&STYLES=&CRS=EPSG:3857&BBOX=" +
      bx.map(function (v) { return v.toFixed(2); }).join(",") + "&WIDTH=" + px + "&HEIGHT=" + px + "&FORMAT=image/jpeg";
    return busca(u).then(blobImg).then(function (im) {
      var c = D.createElement("canvas"); c.width = px; c.height = px;
      var x = c.getContext("2d"); x.fillStyle = "#222"; x.fillRect(0, 0, px, px); x.drawImage(im, 0, 0, px, px);
      tracar(x, F, bx, px, "#ffd54a", Math.max(2, px / 160));
      c.dataset.ano = A.a; c.dataset.lado = Math.round((bx[2] - bx[0]) * Math.cos(lat0(F)));
      return c;
    });
  }

  // ---------- 2a. Fogo (ICNF) ----------
  function aneis(F) {
    var rs = []; todos(F).forEach(function (p) { p.forEach(function (r) { rs.push(r.map(function (c) { return [+c[0].toFixed(6), +c[1].toFixed(6)]; })); }); });
    return rs;
  }
  function fogo(F) {
    F = fc(F);
    var g = { rings: aneis(F), spatialReference: { wkid: 4326 } };
    var body = "f=json&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=Ano&returnGeometry=false&returnDistinctValues=true&geometry=" + encodeURIComponent(JSON.stringify(g));
    return Promise.all(ICNF_L.map(function (id) {
      return tempo(fetch(ICNF + id + "/query", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body, credentials: "omit" }), 20000)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j.error) throw new Error("icnf"); return (j.features || []).map(function (f) { return +f.attributes.Ano; }).filter(Boolean); });
    })).then(function (ls) {
      var s = {}; ls.forEach(function (l) { l.forEach(function (a) { s[a] = 1; }); });
      return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
    });
  }

  // ---------- 2b/2c. Mosaicos 30 m (contagem de pixels dentro do limite) ----------
  function amostra(modelo, F, teste) {
    var b = caixa(F); if (!b) return Promise.reject(new Error("sem limite"));
    var z = 12; while (z > 6) { var t = 2 * MAXM / Math.pow(2, z); if ((b[2] - b[0]) / t <= 4 && (b[3] - b[1]) / t <= 4) break; z--; }
    var T = 2 * MAXM / Math.pow(2, z);
    var x0 = Math.floor((b[0] + MAXM) / T), x1 = Math.floor((b[2] + MAXM) / T), y0 = Math.floor((MAXM - b[3]) / T), y1 = Math.floor((MAXM - b[1]) / T);
    var nx = x1 - x0 + 1, ny = y1 - y0 + 1;
    var c = D.createElement("canvas"); c.width = nx * 256; c.height = ny * 256;
    var x = c.getContext("2d", { willReadFrequently: true });
    var pedidos = [];
    for (var i = x0; i <= x1; i++) for (var j = y0; j <= y1; j++) (function (i, j) {
      pedidos.push(busca(modelo.replace("{z}", z).replace("{x}", i).replace("{y}", j)).then(blobImg).then(function (im) { x.drawImage(im, (i - x0) * 256, (j - y0) * 256, 256, 256); }).catch(function () {}));
    })(i, j);
    return Promise.all(pedidos).then(function () {
      var m = D.createElement("canvas"); m.width = c.width; m.height = c.height;
      var y = m.getContext("2d", { willReadFrequently: true }); y.fillStyle = "#000";
      var ox = x0 * T - MAXM, oy = MAXM - y0 * T, s = 256 / T;
      todos(F).forEach(function (p) { y.beginPath(); p.forEach(function (r) { r.forEach(function (cc, k) { var mm = m3857(cc), px = (mm[0] - ox) * s, py = (oy - mm[1]) * s; if (k) y.lineTo(px, py); else y.moveTo(px, py); }); y.closePath(); }); y.fill("evenodd"); });
      var dm = y.getImageData(0, 0, m.width, m.height).data, dd = x.getImageData(0, 0, c.width, c.height).data;
      var tot = 0, cont = {}, k;
      for (k = 0; k < dm.length; k += 4) { if (dm[k + 3] < 128) continue; tot++; var r2 = teste(dd[k], dd[k + 1], dd[k + 2], dd[k + 3]); if (r2) cont[r2] = (cont[r2] || 0) + 1; }
      var pxM = T / 256 * Math.cos(lat0(F)), ha = pxM * pxM / 1e4, o = { ha: tot * ha };
      for (k in cont) o[k] = cont[k] * ha;
      return o;
    });
  }
  // O mosaico dinâmico do GFW não filtra por anos (testado a 07/11: três períodos davam a mesma área): mede-se o total 2001 a 2024.
  function arvores(F) {
    F = fc(F);
    return amostra(GFC.replace("{a}", 2001).replace("{b}", 2024), F, function (r, g, b, a) { return a > 60 ? "s" : 0; })
      .then(function (o) { return { ha: o.ha, perda: o.s || 0 }; });
  }
  // Ocorrência JRC: rampa de 1 % (rosa claro) a 100 % (azul); o azul domina a partir de cerca de metade do tempo.
  function agua(F) {
    return amostra(GSW, fc(F), function (r, g, b, a) { return a < 60 ? 0 : (b > 150 && r < 140) ? "m" : "p"; })
      .then(function (o) { return { ha: o.ha, alguma: (o.m || 0) + (o.p || 0), metade: o.m || 0 }; });
  }

  W.IPRTempo = { anos: ANOS, imagem: imagem, fogo: fogo, arvores: arvores, agua: agua };

  // ---------- 3. A secção na ficha ----------
  function T(pt, en_) { return en() ? en_ : pt; }
  function linhaFogo(L) {
    if (!L.length) return T("Sem áreas ardidas registadas dentro do limite entre 1975 e 2025.", "No burnt areas recorded within the boundary between 1975 and 2025.");
    return T("Ardeu em ", "Burnt in ") + L.join(", ").replace(/, (\d+)$/, T(" e ", " and ") + "$1") + ".";
  }
  function linhaArv(A) {
    if (A.perda < 0.05) return T("Sem perda de coberto arbóreo detectada entre 2001 e 2024.", "No tree cover loss detected between 2001 and 2024.");
    return T("Perda de coberto arbóreo entre 2001 e 2024 em ", "Tree cover lost between 2001 and 2024 on ") + n(A.perda) + " ha (" + n(100 * A.perda / Math.max(A.ha, 0.01), 0) + T(" % do terreno; inclui cortes e fogos).", " % of the land; includes felling and fires).");
  }
  function linhaAgua(A) {
    if (A.alguma < 0.05) return T("Sem água à superfície detectada por satélite desde 1984 (charcas e ribeiras estreitas podem não aparecer a 30 m).", "No surface water detected by satellite since 1984 (small ponds and narrow streams may not show at 30 m).");
    return T("Houve água à superfície em ", "Surface water on ") + n(A.alguma) + " ha " + T("desde 1984", "since 1984") +
      (A.metade >= 0.05 ? T(", dos quais ", ", of which ") + n(A.metade) + T(" ha com água em mais de metade do tempo", " ha wet more than half of the time") : "") + ".";
  }
  function montar(caixaPdm, F) {
    var s = D.createElement("div"); s.className = "ipr-ft";
    s.innerHTML = "<h4>" + T("O terreno ao longo do tempo", "The land over time") + '</h4><div class="ipr-ft-f"></div>' +
      '<ul class="ipr-ft-l"><li data-k="fogo">' + T("A ler as áreas ardidas…", "Reading burnt areas…") + '</li><li data-k="arv">' + T("A medir o coberto arbóreo…", "Measuring tree cover…") +
      '</li><li data-k="agua">' + T("A medir a água à superfície…", "Measuring surface water…") + "</li></ul>" +
      '<p class="ipe-small">' + T("Ortofotos da DGT; áreas ardidas do ICNF; perda de coberto arbóreo Hansen / UMD / Global Forest Watch (30 m); água à superfície JRC Global Surface Water (30 m). Medições por satélite são indicativas. A Cronologia do Atlas mostra todos os anos sobre o mapa.",
        "DGT orthophotos; ICNF burnt areas; tree cover loss Hansen / UMD / Global Forest Watch (30 m); surface water JRC Global Surface Water (30 m). Satellite measurements are indicative. The Atlas Timeline shows every year on the map.") + "</p>";
    caixaPdm.parentNode.insertBefore(s, caixaPdm.nextSibling);
    var fx = s.querySelector(".ipr-ft-f");
    ANOS.forEach(function (A) {
      var f = D.createElement("figure"); f.innerHTML = '<div class="ipr-ft-i"></div><figcaption>' + esc(A.t) + "</figcaption>"; fx.appendChild(f);
      imagem(F, A, 180).then(function (c) { f.firstChild.appendChild(c); }).catch(function () { f.firstChild.innerHTML = "<span>" + T("sem imagem agora", "no image now") + "</span>"; });
    });
    function por(k, p, fn) { p.then(function (v) { s.querySelector('[data-k="' + k + '"]').textContent = fn(v); }).catch(function () { s.querySelector('[data-k="' + k + '"]').textContent = T("Não foi possível ler agora.", "Could not be read now."); }); }
    por("fogo", fogo(F), linhaFogo);
    por("arv", arvores(F), linhaArv);
    por("agua", agua(F), linhaAgua);
  }

  function desenho() {
    var m = W.__ipe && W.__ipe.mapa; if (!m) return null;
    var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") { try { var a = cs[i].getAll(); if (a && a.features) return a; } catch (e) {} }
    return null;
  }
  function terreno() {
    var a = desenho(); if (!a) return null;
    var fs = a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); });
    return fs.length ? { type: "FeatureCollection", features: fs } : null;
  }
  function geoDe(cx) {
    if (cx.closest(".ipr-fg-out")) return terreno();
    var E = W.__ipe && W.__ipe.estado; if (!E || !E.mapas) return null;
    var o = cx.closest("[data-res-out]"), c = cx.closest(".ipe-card");
    var i = o ? +o.getAttribute("data-res-out") : c ? +c.getAttribute("data-i") : NaN, m = E.mapas[i];
    return m && m.geojson ? fc(m.geojson) : null;
  }
  function corre() {
    t = 0;
    [].forEach.call(D.querySelectorAll(".ipr-fg-pdm"), function (p) {
      if (p.__ft || !p.offsetParent) return;
      var nx = p.nextElementSibling; if (nx && nx.classList.contains("ipr-ft")) { p.__ft = 1; return; }
      var F = geoDe(p); if (!F || !caixa(F)) return;
      p.__ft = 1; montar(p, F);
    });
  }
  var t = 0;
  function agenda() { if (!t) t = setTimeout(corre, 400); }
  function css() {
    var s = D.createElement("style");
    s.textContent = ".ipr-ft{margin:14px 0 6px}.ipr-ft-f{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 8px}" +
      ".ipr-ft-f figure{margin:0}.ipr-ft-i{aspect-ratio:1;background:rgba(127,127,127,.15);border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center}" +
      ".ipr-ft-i canvas{width:100%;height:100%;display:block}.ipr-ft-i span{font-size:11px;opacity:.6}.ipr-ft-f figcaption{font-size:11px;opacity:.8;margin-top:3px;text-align:center}" +
      ".ipr-ft-l{margin:0 0 6px;padding-left:18px;font-size:13px;line-height:1.45}@media (max-width:520px){.ipr-ft-f{grid-template-columns:repeat(2,1fr)}}";
    D.head.appendChild(s);
  }
  function ligar() {
    if (!D.body) return false;
    css();
    new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true });
    setInterval(corre, 2000); corre(); return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
