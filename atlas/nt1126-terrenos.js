/* IPR Atlas · Os seus terrenos (terrenos guardados na conta). Terracrua Design.
   26/11/2026, Nuno: «Tens de ter a certeza absoluta que ele vai encontrar o polígono na conta dele.» A lista «Terrenos guardados»
   do app.js está desligada; este módulo volta a mostrá-los, sem mexer no app.js:
   - quem entra com conta vê no topo das camadas «Os seus terrenos» (aberto), com cada terreno guardado (GET tcd/v1/projectos);
   - todos os terrenos desenham-se no mapa (contorno vermelho, preenchimento leve);
   - ao abrir o Atlas com ?terreno=<id>, ou na primeira vez que a conta tem terrenos, o mapa vai ao terreno e liga o cadastro e as
     plantas do PDM da câmara;
   - clicar num terreno da lista leva o mapa até ele e liga as mesmas camadas.
   Desligar: ?terrenos=0. API: window.__iprTerrenos = {lista(), ir(id)}. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]terrenos=0(&|$)/.test(location.search) || W.__iprTerrenos || !W.tcdNonce) return;
  var V = "#94BE39", SRC = "ipr-terrenos", LISTA = [];
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function q(n) { var m = new RegExp("[?&]" + n + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  function caixa(gj) {
    var x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    (function andar(c) { if (typeof c[0] === "number") { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(andar); })
      ((gj.features || []).map(function (f) { return f.geometry && f.geometry.coordinates; }).filter(Boolean));
    return [[x0, y0], [x1, y1]];
  }
  function desenhar() {
    var I = mapa(); if (!I || !LISTA.length) return false;
    var fc = { type: "FeatureCollection", features: [] };
    LISTA.forEach(function (p) { ((p.geojson && p.geojson.features) || []).forEach(function (f) { fc.features.push({ type: "Feature", properties: { nome: p.nome || "" }, geometry: f.geometry }); }); });
    try {
      if (I.getSource(SRC)) I.getSource(SRC).setData(fc);
      else {
        I.addSource(SRC, { type: "geojson", data: fc });
        I.addLayer({ id: SRC + "-f", type: "fill", source: SRC, paint: { "fill-color": "#ff3b30", "fill-opacity": 0.06 } });
        I.addLayer({ id: SRC + "-l", type: "line", source: SRC, paint: { "line-color": "#ff3b30", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 15, 3] } });
      }
    } catch (e) { return false; }
    return true;
  }
  function camadas() {
    try { var z = W.__ipe && W.__ipe.viz; if (z && typeof z.ligar === "function") z.ligar("cad", true); } catch (e) {}
    setTimeout(function () { try { if (W.__iprPdmCamara && W.__iprPdmCamara.ligar) W.__iprPdmCamara.ligar(true); } catch (e) {} }, 1500);
  }
  function ir(id) {
    var p = LISTA.filter(function (x) { return x.id === id; })[0] || LISTA[0]; var I = mapa(); if (!p || !I) return;
    try { I.fitBounds(caixa(p.geojson), { padding: 70, duration: 1200 }); } catch (e) {}
    I.once("moveend", camadas);
  }
  var CSS = "#ipr-terrenos{margin:0 0 6px;padding:6px 0 8px;color:#e9e6da;font:13px/1.45 Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;border-bottom:1px solid rgba(233,230,218,.12)}" +
    "#ipr-terrenos summary{list-style:none;cursor:pointer;display:flex;align-items:center;font-weight:600;color:#e9e6da;user-select:none}" +
    "#ipr-terrenos summary::-webkit-details-marker{display:none}" +
    "#ipr-terrenos summary:before{content:'▾';color:" + V + ";margin:0 6px 0 0;display:inline-block;transform:rotate(-90deg);transition:transform .15s}" +
    "#ipr-terrenos[open]>summary:before{transform:none}#ipr-terrenos summary b{margin-left:auto;color:" + V + ";font-size:12px}" +
    "#ipr-terrenos button{display:flex;justify-content:space-between;gap:8px;width:calc(100% - 14px);margin:4px 0 0 14px;padding:6px 10px;border:1px solid rgba(255,59,48,.5);border-radius:6px;background:rgba(255,59,48,.08);color:#e9e6da;font:600 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer;text-align:left}" +
    "#ipr-terrenos button:hover{background:rgba(255,59,48,.18)}#ipr-terrenos button em{font-style:normal;font-weight:400;color:#cfd6bd;white-space:nowrap}" +
    "#ipr-terrenos small{display:block;margin:6px 0 0 14px;color:#9a9e8a;font-size:11.5px}";
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam || !LISTA.length) return false;
    var d = D.getElementById("ipr-terrenos");
    if (!d) {
      var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
      d = D.createElement("details"); d.id = "ipr-terrenos"; d.open = true;
      d.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-terreno]") : null; if (b) { e.preventDefault(); ir(b.getAttribute("data-terreno")); } });
    }
    if (cam.firstChild !== d) cam.insertBefore(d, cam.firstChild);
    d.innerHTML = "<summary>Os seus terrenos<b>" + LISTA.length + "</b></summary>" + LISTA.map(function (p) {
      return '<button type="button" data-terreno="' + esc(p.id) + '"><span>' + esc(p.nome || "Terreno") + "</span><em>" + (p.area_ha ? String(Math.round(p.area_ha)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ha" : "") + "</em></button>";
    }).join("") + "<small>Clique no terreno para o ver no mapa, com o cadastro e as plantas do PDM da câmara.</small>";
    return true;
  }
  fetch("/wp-json/tcd/v1/projectos", { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      LISTA = ((j && j.projectos) || []).filter(function (p) { return p && p.geojson && p.geojson.features && p.geojson.features.length; });
      if (!LISTA.length) return;
      var alvo = q("terreno"), chave = "ipr_terrenos_visto";
      var primeira = false; try { primeira = !W.localStorage.getItem(chave); W.localStorage.setItem(chave, "1"); } catch (e) {}
      (function vez(n) {
        var ok = false; try { ok = desenhar() && bloco(); } catch (e) {}
        if (ok) { if (alvo || (primeira && !/[?&]v=/.test(location.search))) setTimeout(function () { ir(alvo); }, 1500); return; }
        if (n < 200) setTimeout(function () { vez(n + 1); }, 200);
      })(0);
      setInterval(function () { try { bloco(); var I = mapa(); if (I && !I.getSource(SRC)) desenhar(); } catch (e) {} }, 4000);
    }).catch(function () {});
  W.__iprTerrenos = { lista: function () { return LISTA.slice(); }, ir: ir };
})();
