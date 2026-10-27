/* IPR Atlas · separador «Organização» (21/10/2026, m90254 v2).
   Mostra no mapa as camadas da organização a que a pessoa pertence (GET /tcd/v1/org/camadas),
   por grupo, com interruptor por camada, ajuste à extensão e janela com os atributos.
   ?org_camada=<id> liga essa camada e ajusta o mapa; ?org_aviso=<id> marca um alerta (m90257).
   Não mexe no app.js: junta um botão a #ipe-tabs e um painel .ipe-pane (padrão do cloud.js).
   Outros módulos usam window.tcdOrg: ligar(id), ajustar(bbox), marcar(lon,lat,html), mapa(). */
(function () {
  "use strict";
  var NONCE = window.tcdNonce || "";
  if (!NONCE) return;
  var REST = "/wp-json/tcd/v1/";
  var dados = null, ligadas = {}, marcas = [];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function n(x) { return Number(x || 0).toLocaleString("pt-PT"); }
  function pedir(rota) {
    return fetch(REST + rota, { credentials: "same-origin", headers: { "X-WP-Nonce": NONCE } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || "Erro"); return j; }); });
  }

  var CSS = ".ipo-g{margin:10px 0 4px;font:600 12px Inter,sans-serif;letter-spacing:.02em;color:var(--mu);display:flex;align-items:center;gap:6px}" +
    ".ipo-g i{width:10px;height:10px;border-radius:50%;display:inline-block}" +
    ".ipo-c{display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--ln2);font-size:13px;color:var(--tx)}" +
    ".ipo-c label{flex:1;min-width:0;display:flex;gap:8px;align-items:center;cursor:pointer}.ipo-c label b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ipo-c small{color:var(--mu);white-space:nowrap}.ipo-c button{font:12px Inter,sans-serif;border:1px solid var(--ln);background:var(--p3);color:var(--ac2);border-radius:6px;padding:3px 8px;cursor:pointer}" +
    ".ipo-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.ipo-top a{font-size:12px;color:var(--ac2)}" +
    ".ipo-pill{font-size:11px;border:1px solid var(--ln);border-radius:99px;padding:1px 7px;color:var(--mu)}" +
    ".ipo-pop{font:12.5px Inter,sans-serif;max-width:260px}.ipo-pop b{display:block;margin-bottom:4px}.ipo-pop table{border-collapse:collapse}.ipo-pop td{padding:1px 6px 1px 0;vertical-align:top}.ipo-pop td:first-child{color:#777}";

  function montar() {
    var tabs = document.getElementById("ipe-tabs");
    var conta = document.querySelector('.ipe-pane[data-pane="conta"]') || document.querySelector(".ipe-pane");
    if (!tabs || !conta) return false;
    if (document.querySelector('.ipe-tab[data-tab="org"]')) return true;
    var st = document.getElementById("ipo-css") || document.createElement("style");
    if (!st.parentNode) { st.id = "ipo-css"; st.textContent = CSS; document.head.appendChild(st); }
    var b = document.createElement("button");
    b.type = "button"; b.className = "ipe-tab"; b.setAttribute("role", "tab"); b.dataset.tab = "org"; b.setAttribute("aria-selected", "false"); b.textContent = "Organização";
    var antes = tabs.querySelector('.ipe-tab[data-tab="cloud"]') || tabs.querySelector('.ipe-tab[data-tab="conta"]');
    tabs.insertBefore(b, antes || null);
    var p = document.querySelector('.ipe-pane[data-pane="org"]') || document.createElement("div");
    p.className = "ipe-pane"; p.dataset.pane = "org"; p.hidden = true;
    if (!p.parentNode) { p.innerHTML = '<div class="ipe-vazio">A carregar…</div>'; conta.parentNode.insertBefore(p, conta); }
    var carregado = !!p.dataset.ok;
    b.addEventListener("click", function () { if (!carregado) { carregado = true; p.dataset.ok = "1"; carregar(p); } });
    var q = new URLSearchParams(location.search);
    if (q.get("separador") === "org" || q.get("org_camada") || q.get("org_aviso")) setTimeout(function () { b.click(); }, 300);
    return true;
  }

  function carregar(p) {
    pedir("org/camadas").then(function (d) { dados = d; desenhar(p); arranque(); })
      .catch(function (e) { p.innerHTML = '<div class="ipe-vazio">Não foi possível ler a organização: ' + esc(e.message) + "</div>"; });
  }

  function desenhar(p) {
    var d = dados, g = d.grupos || [], cs = d.camadas || [];
    var h = '<div class="ipo-top"><span class="ipe-lbl" style="margin:0">' + esc(d.org.nome) + '</span><span class="ipo-pill">' + esc(d.org.estado === "activa" ? "activa" : "só leitura") + "</span></div>";
    h += '<div class="ipo-top"><a href="/oficina/#camadas">Gerir na Oficina</a><a href="#" data-ipo="todas">Ligar todas</a><a href="#" data-ipo="nenhuma">Desligar</a></div>';
    if (!cs.length) h += '<div class="ipe-vazio">Ainda não há camadas. Carregue-as na Oficina.</div>';
    g.forEach(function (gr) {
      var do_ = cs.filter(function (c) { return c.grupo === gr.id; }); if (!do_.length) return;
      h += '<div class="ipo-g"><i style="background:' + esc(gr.cor) + '"></i>' + esc(gr.nome) + (gr.sensivel ? " · sensível" : "") + "</div>";
      do_.forEach(function (c) {
        h += '<div class="ipo-c"><label><input type="checkbox" data-ipo-c="' + c.id + '"' + (ligadas[c.id] ? " checked" : "") + "><b>" + esc(c.nome) + "</b></label><small>" + n(c.n) + (c.ha > 0 ? " · " + n(Math.round(c.ha)) + " ha" : "") + '</small><button type="button" data-ipo-z="' + c.id + '" title="Ajustar o mapa a esta camada">⤢</button></div>';
      });
    });
    p.innerHTML = h;
    p.querySelectorAll("[data-ipo-c]").forEach(function (cb) { cb.addEventListener("change", function () { if (cb.checked) ligar(+cb.dataset.ipoC); else desligar(+cb.dataset.ipoC); }); });
    p.querySelectorAll("[data-ipo-z]").forEach(function (bt) { bt.addEventListener("click", function () { var c = porId(+bt.dataset.ipoZ); if (c) { ligar(c.id); ajustar(c.bbox); var cb = p.querySelector('[data-ipo-c="' + c.id + '"]'); if (cb) cb.checked = true; } }); });
    p.querySelectorAll("[data-ipo]").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); var todas = a.dataset.ipo === "todas"; cs.forEach(function (c) { if (todas) ligar(c.id); else desligar(c.id); }); p.querySelectorAll("[data-ipo-c]").forEach(function (cb) { cb.checked = todas; }); if (todas) ajustar(bboxTodas()); }); });
  }
  function porId(id) { return (dados && dados.camadas || []).filter(function (c) { return c.id === id; })[0]; }
  function bboxTodas() { var b = null; (dados.camadas || []).forEach(function (c) { if (!ligadas[c.id] || !c.bbox) return; b = b ? [Math.min(b[0], c.bbox[0]), Math.min(b[1], c.bbox[1]), Math.max(b[2], c.bbox[2]), Math.max(b[3], c.bbox[3])] : c.bbox.slice(); }); return b; }

  function ligar(id) {
    var m = mapa(), c = porId(id); if (!m || !c) return;
    if (ligadas[id]) { ["f", "l", "p"].forEach(function (s) { if (m.getLayer("org-" + id + "-" + s)) m.setLayoutProperty("org-" + id + "-" + s, "visibility", "visible"); }); return; }
    ligadas[id] = true;
    pedir("org/camada/" + id).then(function (gj) {
      if (!ligadas[id] || !mapa()) return;
      var src = "org-" + id, cor = c.cor || "#75834a";
      if (!m.getSource(src)) m.addSource(src, { type: "geojson", data: gj });
      if (!m.getLayer(src + "-f")) m.addLayer({ id: src + "-f", type: "fill", source: src, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": cor, "fill-opacity": 0.22 } });
      if (!m.getLayer(src + "-l")) m.addLayer({ id: src + "-l", type: "line", source: src, filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "LineString"]], paint: { "line-color": cor, "line-width": 2 } });
      if (!m.getLayer(src + "-p")) m.addLayer({ id: src + "-p", type: "circle", source: src, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": cor, "circle-radius": 5, "circle-stroke-color": "#fff", "circle-stroke-width": 1.2 } });
      ["f", "l", "p"].forEach(function (s) { m.on("click", src + "-" + s, function (e) { janela(e, c); }); m.on("mouseenter", src + "-" + s, function () { m.getCanvas().style.cursor = "pointer"; }); m.on("mouseleave", src + "-" + s, function () { m.getCanvas().style.cursor = ""; }); });
    }).catch(function () { ligadas[id] = false; });
  }
  function desligar(id) { var m = mapa(); if (!m) return; ligadas[id] = false; ["f", "l", "p"].forEach(function (s) { if (m.getLayer("org-" + id + "-" + s)) m.setLayoutProperty("org-" + id + "-" + s, "visibility", "none"); }); }
  function ajustar(b) { var m = mapa(); if (!m || !b || b.length !== 4) return; if (b[0] === b[2] && b[1] === b[3]) { m.flyTo({ center: [b[0], b[1]], zoom: 14 }); return; } m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 48, maxZoom: 16, duration: 800 }); }
  function janela(e, c) {
    var m = mapa(); if (!m || !window.maplibregl || !e.features || !e.features[0]) return;
    var pr = e.features[0].properties || {}, ks = Object.keys(pr).filter(function (k) { return pr[k] !== null && pr[k] !== ""; }).slice(0, 10);
    var h = '<div class="ipo-pop"><b>' + esc(c.nome) + "</b>" + (ks.length ? "<table>" + ks.map(function (k) { return "<tr><td>" + esc(k) + "</td><td>" + esc(pr[k]) + "</td></tr>"; }).join("") + "</table>" : '<span style="color:#777">Sem atributos</span>') + "</div>";
    new maplibregl.Popup({ closeButton: true, maxWidth: "280px" }).setLngLat(e.lngLat).setHTML(h).addTo(m);
  }
  function marcar(lon, lat, html, cor) {
    var m = mapa(); if (!m || !window.maplibregl) return null;
    var el = document.createElement("div"); el.style.cssText = "width:18px;height:18px;border-radius:50%;background:" + (cor || "#d0482c") + ";border:2px solid #fff;box-shadow:0 0 0 3px rgba(208,72,44,.35)";
    var mk = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]);
    if (html) mk.setPopup(new maplibregl.Popup({ maxWidth: "280px" }).setHTML('<div class="ipo-pop">' + html + "</div>"));
    mk.addTo(m); marcas.push(mk); return mk;
  }
  function arranque() {
    var q = new URLSearchParams(location.search), id = +q.get("org_camada"), av = q.get("org_aviso");
    if (id) { var c = porId(id); if (c) { ligar(id); ajustar(c.bbox); var cb = document.querySelector('[data-ipo-c="' + id + '"]'); if (cb) cb.checked = true; } }
    if (av) pedir("org/avisos?id=" + encodeURIComponent(av)).then(function (d) { var a = (d.avisos || d || [])[0]; if (!a || !a.lon) return; var mk = marcar(a.lon, a.lat, "<b>" + esc(a.titulo || a.fonte) + "</b>" + esc(a.quando || "") + (a.texto ? "<br>" + esc(a.texto) : "")); mapa().flyTo({ center: [a.lon, a.lat], zoom: 13 }); if (mk) mk.togglePopup(); }).catch(function () {});
  }
  window.tcdOrg = { ligar: ligar, desligar: desligar, ajustar: ajustar, marcar: marcar, mapa: mapa, dados: function () { return dados; } };

  var k = 0;
  (function tentar() {
    if (montar()) { var tabs = document.getElementById("ipe-tabs"); new MutationObserver(function () { montar(); }).observe(tabs, { childList: true }); }
    else if (k++ < 120) setTimeout(tentar, 250);
  })();
})();
