/* IPR Atlas · Simular sem Base (módulo m91234). Terracrua Design.
   Nuno, 14/11/2026, 01h05: «Ok vamos avançar sem base então». Quem tem o Intelligence desenha no mapa uma área pequena
   (até window.IPR_SIM_AREA.max_ha, 10 ha por omissão) em qualquer sítio de Portugal continental; o site prepara o terreno
   (LiDAR da DGT, MDT e camadas, pelo worker, como uma Base) e, quando fica pronta, abre o simulador sobre essa área.
   Entra pelo botão «Desenhar uma área (sem Base)» da escolha da Base (simulador-base.js chama IPR_SIM_AREA.desenhar).
   Só existe com window.IPR_SIM_AREA (o m91234 só o põe a contas Intelligence e à equipa). Não mexe noutros ficheiros. */
(function (W) {
  "use strict";
  if (W.__iprSimArea) return; W.__iprSimArea = 1;
  var C = W.IPR_SIM_AREA = W.IPR_SIM_AREA || {};
  var REST = typeof C.rest === "string" ? C.rest : "/wp-json/tcd/v1/";
  var PEND = "ipr_sa_pend";
  var TX = {
    pt: {
      dica: "Clique no mapa para marcar os cantos da área. Feche no primeiro ponto ou em «Usar esta área».",
      max: "máximo {m} ha", desfazer: "Desfazer", cancelar: "Cancelar", usar: "Usar esta área", grande: "Área acima do máximo",
      poucos: "Marque pelo menos 3 cantos.", enviar: "A pedir a área…",
      t: "Área de simulação", tempo: "Depois de começar, a preparação leva normalmente 5 a 15 minutos. Se o servidor estiver ocupado com outro terreno, a espera pode ser maior. Pode continuar a usar o Atlas; esta caixa avisa quando estiver pronta.",
      ocupado: "À espera que o servidor acabe outro trabalho{n}.",
      fila: "Na fila de preparação{n}.", antes: " ({k} antes desta)",
      a_descarregar: "A descarregar o LiDAR da DGT…", a_processar: "A gerar o terreno e as camadas…", fim: "A terminar…",
      pronta: "A área está pronta.", abrir_agua: "Abrir o simulador de água", abrir_fogo: "Abrir o simulador de fogo",
      erro: "Não foi possível preparar o terreno desta área (por exemplo, por não haver LiDAR da DGT nesse sítio). Experimente outra área.",
      fechar: "Fechar", zoom: "Aproxime o mapa ao sítio que quer simular e marque os cantos."
    },
    en: {
      dica: "Click on the map to mark the corners of the area. Close on the first point or use «Use this area».",
      max: "maximum {m} ha", desfazer: "Undo", cancelar: "Cancel", usar: "Use this area", grande: "Area above the maximum",
      poucos: "Mark at least 3 corners.", enviar: "Requesting the area…",
      t: "Simulation area", tempo: "Once started, preparation usually takes 5 to 15 minutes. If the server is busy with another site, the wait may be longer. You can keep using the Atlas; this box tells you when it is ready.",
      ocupado: "Waiting for the server to finish another job{n}.",
      fila: "Queued for preparation{n}.", antes: " ({k} ahead)",
      a_descarregar: "Downloading DGT LiDAR…", a_processar: "Building the terrain and layers…", fim: "Finishing…",
      pronta: "The area is ready.", abrir_agua: "Open the water simulator", abrir_fogo: "Open the fire simulator",
      erro: "The land for this area could not be prepared (for example, no DGT LiDAR there). Try another area.",
      fechar: "Close", zoom: "Zoom the map to the place you want to simulate and mark the corners."
    }
  };
  function L() { return String(W.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { return TX[L()][k] || TX.pt[k]; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nf(x, d) { return (+x || 0).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: d == null ? 1 : 0 }); }
  function mapa() { return W.__ipe && W.__ipe.mapa || null; }
  function maxHa() { return +C.max_ha || 10; }
  function api(c, op) {
    op = op || {};
    var h = { "Accept": "application/json" }; if (W.tcdNonce) h["X-WP-Nonce"] = W.tcdNonce;
    if (op.body) h["Content-Type"] = "application/json";
    return fetch(REST + c, { method: op.method || "GET", credentials: "same-origin", headers: h, body: op.body ? JSON.stringify(op.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { if (!r.ok) throw new Error(j && j.message || ("HTTP " + r.status)); return j; }); });
  }
  function ha(pts) {   // mesma conta do m91234 (projecção local)
    if (pts.length < 3) return 0;
    var la = 0; pts.forEach(function (p) { la += p[1]; }); la = la / pts.length * Math.PI / 180;
    var k = 6371008.8 * Math.PI / 180, s = 0, n = pts.length;
    for (var i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; s += a[0] * k * Math.cos(la) * b[1] * k - b[0] * k * Math.cos(la) * a[1] * k; }
    return Math.abs(s) / 2 / 10000;
  }

  // ───── estilo ─────
  function css() {
    if (document.getElementById("ipr-sa-css")) return;
    var s = document.createElement("style"); s.id = "ipr-sa-css";
    s.textContent =
      "#ipr-sa-bar,#ipr-sa-card{position:fixed;z-index:2147483000;font:14px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;color:#1f2a24;background:#fff;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.22)}" +
      "#ipr-sa-bar{left:50%;top:12px;transform:translateX(-50%);max-width:min(640px,calc(100vw - 32px));padding:10px 12px}" +
      "#ipr-sa-card{left:16px;bottom:16px;width:min(360px,calc(100vw - 32px));padding:12px 14px}" +
      "#ipr-sa-bar p,#ipr-sa-card p{margin:0 0 8px}#ipr-sa-card h3{margin:0 0 6px;font-size:15px}" +
      ".sa-ha{font-weight:600}.sa-ha.mau{color:#b3261e}.sa-err{color:#b3261e}" +
      ".sa-a{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}" +
      ".sa-b{font:inherit;border:1px solid #9aa79f;background:#fff;color:#1f2a24;border-radius:7px;padding:6px 11px;cursor:pointer;min-height:36px}" +
      ".sa-b.pri{background:#2f5d46;border-color:#2f5d46;color:#fff}.sa-b[disabled]{opacity:.5;cursor:default}" +
      ".sa-prog{height:4px;background:#e3e8e5;border-radius:2px;overflow:hidden;margin:6px 0 8px}.sa-prog i{display:block;height:100%;width:35%;background:#2f5d46;animation:saP 1.6s ease-in-out infinite}" +
      "@keyframes saP{0%{margin-left:-35%}100%{margin-left:100%}}" +
      "@media (prefers-color-scheme:dark){#ipr-sa-bar,#ipr-sa-card{background:#1f2622;color:#e7ece9}.sa-b{background:#2a332e;color:#e7ece9;border-color:#5b6a62}.sa-b.pri{background:#4f8a6b;border-color:#4f8a6b}}";
    document.head.appendChild(s);
  }

  // ───── desenho ─────
  var D = null;   // { tipo, pts, cursor }
  var SRC = "ipr-sa", LAY = ["ipr-sa-f", "ipr-sa-l", "ipr-sa-p"];
  function camadas(Mp) {
    if (!Mp.getSource(SRC)) Mp.addSource(SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    if (!Mp.getLayer(LAY[0])) Mp.addLayer({ id: LAY[0], type: "fill", source: SRC, filter: ["==", "$type", "Polygon"], paint: { "fill-color": "#2f8f5f", "fill-opacity": 0.18 } });
    if (!Mp.getLayer(LAY[1])) Mp.addLayer({ id: LAY[1], type: "line", source: SRC, filter: ["in", "$type", "LineString", "Polygon"], paint: { "line-color": "#1d6b44", "line-width": 2.5 } });
    if (!Mp.getLayer(LAY[2])) Mp.addLayer({ id: LAY[2], type: "circle", source: SRC, filter: ["==", "$type", "Point"], paint: { "circle-radius": 5, "circle-color": "#fff", "circle-stroke-color": "#1d6b44", "circle-stroke-width": 2 } });
  }
  function desenharGeo(pts, cursor, fechado) {
    var Mp = mapa(); if (!Mp) return;
    try { camadas(Mp); } catch (x) { return; }
    var f = [];
    var linha = pts.slice(); if (cursor && !fechado) linha.push(cursor);
    if (fechado && pts.length >= 3) f.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [pts.concat([pts[0]])] } });
    else {
      if (linha.length >= 3) f.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [linha.concat([linha[0]])] } });
      else if (linha.length >= 2) f.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: linha } });
      pts.forEach(function (p) { f.push({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p } }); });
    }
    try { Mp.getSource(SRC).setData({ type: "FeatureCollection", features: f }); } catch (x) {}
  }
  function limparGeo() { var Mp = mapa(); if (Mp && Mp.getSource(SRC)) { try { Mp.getSource(SRC).setData({ type: "FeatureCollection", features: [] }); } catch (x) {} } }

  function barra() {
    var b = document.getElementById("ipr-sa-bar");
    if (!D) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "ipr-sa-bar"; b.setAttribute("role", "dialog"); b.setAttribute("aria-label", t("t")); document.body.appendChild(b); b.addEventListener("click", cliqueBarra); }
    var h = ha(D.pts), mau = h > maxHa(), Mp = mapa(), z = Mp ? Mp.getZoom() : 20;
    var s = "<p>" + esc(z < 13 && !D.pts.length ? t("zoom") : t("dica")) + "</p>";
    s += '<p><span class="sa-ha' + (mau ? " mau" : "") + '">' + nf(h) + " ha</span> · " + esc(t("max").replace("{m}", nf(maxHa(), 0))) + (mau ? ' · <span class="sa-err">' + esc(t("grande")) + "</span>" : "") + "</p>";
    if (D.erro) s += '<p class="sa-err">' + esc(D.erro) + "</p>";
    s += '<div class="sa-a"><button type="button" class="sa-b" data-sa="x">' + esc(t("cancelar")) + '</button><button type="button" class="sa-b" data-sa="u"' + (D.pts.length && !D.ocupado ? "" : " disabled") + ">" + esc(t("desfazer")) + '</button><button type="button" class="sa-b pri" data-sa="ok"' + (D.pts.length >= 3 && !mau && !D.ocupado ? "" : " disabled") + ">" + esc(D.ocupado ? t("enviar") : t("usar")) + "</button></div>";
    b.innerHTML = s;
  }
  function cliqueBarra(e) {
    var el = e.target.closest && e.target.closest("[data-sa]"); if (!el || !D) return;
    var a = el.getAttribute("data-sa");
    if (a === "x") return parar();
    if (a === "u") { D.pts.pop(); D.erro = ""; desenharGeo(D.pts, null); barra(); return; }
    if (a === "ok") return enviar();
  }
  function emClique(e) {
    if (!D || D.ocupado) return;
    var p = [Math.round(e.lngLat.lng * 1e7) / 1e7, Math.round(e.lngLat.lat * 1e7) / 1e7], Mp = mapa();
    if (D.pts.length >= 3 && Mp) {   // clique sobre o primeiro ponto fecha a área
      var a = Mp.project(D.pts[0]); if (Math.abs(a.x - e.point.x) < 12 && Math.abs(a.y - e.point.y) < 12) return enviar();
    }
    if (D.pts.length >= 300) return;
    D.pts.push(p); D.erro = ""; desenharGeo(D.pts, null); barra();
  }
  function emMover(e) { if (D && !D.ocupado && D.pts.length) desenharGeo(D.pts, [e.lngLat.lng, e.lngLat.lat]); }
  function emTecla(e) {
    if (!D || D.ocupado) return;
    var tg = e.target && e.target.tagName; if (tg === "INPUT" || tg === "TEXTAREA") return;
    if (e.key === "Escape") { e.preventDefault(); parar(); }
    else if (e.key === "Backspace" && D.pts.length) { e.preventDefault(); D.pts.pop(); desenharGeo(D.pts, null); barra(); }
    else if (e.key === "Enter" && D.pts.length >= 3) { e.preventDefault(); enviar(); }
  }
  function emZoom() { if (D && !D.pts.length) barra(); }
  function iniciar(tipo) {
    var Mp = mapa(); if (!Mp) return;
    if (D) parar();
    css();
    D = { tipo: tipo === "fogo" ? "fogo" : "agua", pts: [], dz: Mp.doubleClickZoom && Mp.doubleClickZoom.isEnabled && Mp.doubleClickZoom.isEnabled() };
    try { if (Mp.doubleClickZoom) Mp.doubleClickZoom.disable(); } catch (x) {}
    try { Mp.getCanvas().style.cursor = "crosshair"; } catch (x) {}
    Mp.on("click", emClique); Mp.on("mousemove", emMover); Mp.on("zoomend", emZoom);
    document.addEventListener("keydown", emTecla, true);
    barra();
  }
  function parar(manter) {
    var Mp = mapa();
    if (Mp) {
      Mp.off("click", emClique); Mp.off("mousemove", emMover); Mp.off("zoomend", emZoom);
      try { if (D && D.dz && Mp.doubleClickZoom) Mp.doubleClickZoom.enable(); } catch (x) {}
      try { Mp.getCanvas().style.cursor = ""; } catch (x) {}
    }
    document.removeEventListener("keydown", emTecla, true);
    if (!manter) limparGeo();
    D = null; barra();
  }
  function enviar() {
    if (!D || D.ocupado) return;
    if (D.pts.length < 3) { D.erro = t("poucos"); barra(); return; }
    if (ha(D.pts) > maxHa()) { barra(); return; }
    D.ocupado = true; barra();
    var d = D, anel = d.pts.concat([d.pts[0]]);
    desenharGeo(d.pts, null, true);
    api("sim-area", { method: "POST", body: { tipo: d.tipo, geojson: { type: "Polygon", coordinates: [anel] } } }).then(function (j) {
      if (D !== d) return;
      var a = j && j.area; if (!a || !a.id) throw new Error(t("erro"));
      parar(true);
      guardar({ id: a.id, tipo: d.tipo });
      cartao(a, d.tipo); vigiar(a.id, d.tipo);
    }).catch(function (er) { if (D !== d) return; d.ocupado = false; d.erro = er && er.message || t("erro"); desenharGeo(d.pts, null); barra(); });
  }

  // ───── espera e entrega ─────
  function guardar(p) { try { if (p) localStorage.setItem(PEND, JSON.stringify(p)); else localStorage.removeItem(PEND); } catch (x) {} }
  function lido() { try { return JSON.parse(localStorage.getItem(PEND) || "null"); } catch (x) { return null; } }
  var vigia = null;
  function vigiar(id, tipo) {
    clearTimeout(vigia);
    (function v() {
      api("sim-area?id=" + encodeURIComponent(id)).then(function (j) {
        var a = j && j.areas && j.areas[0];
        if (!a) { guardar(null); fecharCartao(); return; }
        cartao(a, tipo);
        if (a.estado === "pronta" || a.estado === "erro") return;
        vigia = setTimeout(v, document.hidden ? 60000 : 15000);
      }).catch(function () { vigia = setTimeout(v, 60000); });
    })();
  }
  function etapa(a) {
    if (a.estado === "fila") return t(a.ocupado ? "ocupado" : "fila").replace("{n}", a.antes ? t("antes").replace("{k}", a.antes) : "");
    if (a.etapa === "a_descarregar") return t("a_descarregar");
    if (a.etapa === "a_processar") return t("a_processar");
    return t("fim");
  }
  function cartao(a, tipo) {
    css();
    var c = document.getElementById("ipr-sa-card");
    if (!c) { c = document.createElement("div"); c.id = "ipr-sa-card"; c.setAttribute("role", "status"); c.setAttribute("aria-live", "polite"); document.body.appendChild(c); c.addEventListener("click", cliqueCartao); }
    c.setAttribute("data-id", a.id); c.setAttribute("data-tipo", tipo);
    var s = "<h3>" + esc(t("t")) + "</h3><p>" + esc(a.local || "") + "</p>";
    if (a.estado === "pronta") {
      s += "<p><b>" + esc(t("pronta")) + "</b></p><div class=\"sa-a\"><button type=\"button\" class=\"sa-b\" data-sa=\"fechar\">" + esc(t("fechar")) + "</button><button type=\"button\" class=\"sa-b pri\" data-sa=\"abrir\">" + esc(t("abrir_" + tipo)) + "</button></div>";
    } else if (a.estado === "erro") {
      s += '<p class="sa-err">' + esc(t("erro")) + '</p><div class="sa-a"><button type="button" class="sa-b" data-sa="fechar">' + esc(t("fechar")) + "</button></div>";
    } else {
      s += '<div class="sa-prog"><i></i></div><p>' + esc(etapa(a)) + '</p><p style="font-size:12.5px;opacity:.8">' + esc(t("tempo")) + "</p>";
      s += '<div class="sa-a"><button type="button" class="sa-b" data-sa="esconder">' + esc(t("fechar")) + "</button></div>";
    }
    c.innerHTML = s;
  }
  function fecharCartao() { var c = document.getElementById("ipr-sa-card"); if (c) c.remove(); }
  function cliqueCartao(e) {
    var el = e.target.closest && e.target.closest("[data-sa]"); if (!el) return;
    var c = document.getElementById("ipr-sa-card"), id = c && c.getAttribute("data-id"), tipo = c && c.getAttribute("data-tipo") || "agua";
    var a = el.getAttribute("data-sa");
    if (a === "esconder") { fecharCartao(); return; }   // continua a preparar; volta a aparecer ao recarregar
    if (a === "fechar") { guardar(null); clearTimeout(vigia); fecharCartao(); limparGeo(); return; }
    if (a === "abrir" && id) {
      guardar(null);
      try { sessionStorage.setItem("ipr_sim_base", JSON.stringify({ tipo: tipo, id: String(id), t: Date.now() })); } catch (x) {}
      // 14/11/2026 (teste como conta Intelligence): a visita guiada do terreno (capitulos-cliente.js) abria por cima do
      // simulador numa área acabada de preparar; quem vem simular não a vê (fica no botão «Visita guiada», minimizada).
      // O guia da área de cliente (app.js, ipe_tour_cli1, uma vez por navegador) também abria por cima; continua no menu de ajuda.
      try { localStorage.setItem("ipr_cap_bv_" + id, "1"); localStorage.setItem("ipr_cap_min_" + id, "1"); if (!localStorage.getItem("ipe_tour_cli1")) localStorage.setItem("ipe_tour_cli1", "1"); } catch (x) {}
      var q = new URLSearchParams(location.search); q.set("mapa", id); q.delete("modo");
      location.href = location.pathname + "?" + q.toString();
    }
  }

  C.desenhar = function (tipo) {
    var n = 0;
    (function v() { if (mapa()) return iniciar(tipo); if (++n < 50) setTimeout(v, 200); })();
  };
  // Área pedida antes de recarregar a página: retoma o aviso.
  (function retomar() {
    var p = lido(); if (!p || !p.id) return;
    var n = 0;
    (function v() { if (W.tcdNonce || ++n > 40) return vigiar(p.id, p.tipo || "agua"); setTimeout(v, 250); })();
  })();
})(window);
