/* IPR Atlas · Expropriações (26/11/2026). Terracrua Design.
   Pedido do Nuno (26/11/2026): uma só camada «Expropriações» com todas as expropriações planeadas, em curso ou a decorrer, por tema.
   Lê o índice e as geometrias da R2 pública (camadas.terracruadesign.pt/expropriacoes/): indice.json com os actos (DUP e servidões)
   e, para os actos vectorizados pelo IPR a partir das plantas parcelares, o contorno da área a expropriar (campo «geojson» do acto).
   Actos sem geometria aparecem como marcador no concelho (nunca um corredor desenhado à mão). Bloco organizado por tema, com filtro
   por estado. Ficha ao clicar. Aviso fixo em PT e EN. Dados públicos sem dados pessoais (sem nomes, moradas, matrizes nem descrições prediais).
   Desligar: ?expro=0. Abrir já ligada e centrada num acto: ?expro=<id do acto>. API: window.__iprExpro = { ligar(bool), ir(id) }.
   27/11/2026: tema «floresta» (servidões da rede primária de faixas de gestão de combustível) e camada de contexto (índice «contexto»:
   perímetros que não são expropriações, como a área concessionada de uma mina), desenhada a tracejado e listada à parte. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]expro=0(&|$)/.test(location.search) || W.__iprExpro) return;
  var DADOS = "https://camadas.terracruadesign.pt/expropriacoes/";
  var VER = new Date().toISOString().slice(0, 10);
  var TEMAS = ["alta velocidade", "ferrovia", "estradas", "minas", "energia", "água", "floresta", "turismo", "urbano", "outros"];
  var PEDIDO = (function () { var m = /[?&]expro=([^&#]+)/.exec(location.search); return m && m[1] !== "1" ? decodeURIComponent(m[1]) : ""; })();
  var TEMA = { "alta velocidade": ["Alta velocidade", "High-speed rail"], ferrovia: ["Ferrovia", "Railway"], estradas: ["Autoestradas e estradas", "Motorways and roads"], minas: ["Minas e pedreiras", "Mines and quarries"], energia: ["Energia", "Energy"], "água": ["Água", "Water"], floresta: ["Floresta e incêndios", "Forest and wildfire"], turismo: ["Turismo", "Tourism"], urbano: ["Urbano", "Urban"], outros: ["Outros", "Other"] };
  var COR = { "alta velocidade": "#a77ee0", ferrovia: "#c08be8", estradas: "#e0a84a", minas: "#9aa3ad", energia: "#e8d25a", "água": "#5aa9e0", floresta: "#6fae5a", turismo: "#e07e9b", urbano: "#d2694b", outros: "#b9b39b" };
  var ESTADOS = ["planeada", "DUP publicada", "obra em curso", "concluída", "contestada", "caducada ou revertida"];
  var EST_EN = { "planeada": "planned", "DUP publicada": "DUP published", "obra em curso": "works under way", "concluída": "completed", "contestada": "contested", "caducada ou revertida": "lapsed or reversed" };
  var S = { on: false, idx: null, area: null, ctx: null, erro: "", estado: "" };
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function temaDe(a) { var k = a && a.tema; if (k === "rodovia") k = "estradas"; if (k === "agua") k = "água"; return TEMAS.indexOf(k) >= 0 ? k : "outros"; }
  function cor(a) { return COR[temaDe(a)]; }
  function estadoTxt(e) { return en() ? (EST_EN[e] || e) : e; }
  var AVISO_PT = "Delimitação aproximada, vectorizada pelo IPR a partir das plantas parcelares publicadas no Diário da República. Não substitui as plantas oficiais nem tem valor jurídico. As entidades citadas não estão associadas ao IPR Atlas.";
  var AVISO_EN = "Approximate boundary, vectorised by IPR from the parcel plans published in the Diário da República. It does not replace the official plans and has no legal value. The entities mentioned are not associated with IPR Atlas.";

  function json(u) { return fetch(u + "?v=" + VER).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function carregar() {
    if (S.idx) return Promise.resolve();
    return json(DADOS + "indice.json").then(function (idx) {
      S.idx = idx;
      var com = (idx.actos || []).filter(function (a) { return a.geojson; });
      return Promise.all(com.map(function (a) {
        return json(DADOS + a.geojson).then(function (fc) {
          return (fc.features || []).map(function (f) { f.properties = { id: a.id, cor: cor(a), estado: a.estado || "" }; return f; });
        }).catch(function () { a._semGeo = true; return []; });
      })).then(function (L) { S.area = { type: "FeatureCollection", features: [].concat.apply([], L) }; }).then(function () {
        return Promise.all((idx.contexto || []).filter(function (c) { return c.geojson; }).map(function (c) {
          return json(DADOS + c.geojson).then(function (fc) { return (fc.features || []).map(function (f) { f.properties = { id: c.id }; return f; }); }).catch(function () { return []; });
        })).then(function (L) { S.ctx = { type: "FeatureCollection", features: [].concat.apply([], L) }; });
      });
    }).catch(function () { S.erro = t("Não foi possível carregar a camada.", "Could not load the layer."); });
  }
  function dataPt(d) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d || ""); return m ? (m[3] ? m[3] + "/" : "") + m[2] + "/" + m[1] : (d || ""); }
  function num(x) { return typeof x === "number" ? String(x).replace(".", ",") : x; }
  function temGeo(a) { return !!(a.geojson && !a._semGeo); }
  function ficha(a) {
    var k = temaDe(a), tema = t(TEMA[k][0], TEMA[k][1]);
    var h = '<div style="font:13px/1.45 Inter,system-ui,sans-serif;max-width:300px;color:inherit"><b>' + esc(a.obra) + "</b>";
    h += '<div style="opacity:.75;margin:2px 0 6px">' + esc(tema) + " · " + esc(a.acto) + (a.numero ? " n.º " + esc(a.numero) + (a.numero_confirmado ? "" : " " + t("(por confirmar)", "(to be confirmed)")) : "") + (a.data_dr ? " · " + esc(dataPt(a.data_dr)) : "") + "</div>";
    var L = [[t("Entidade", "Entity"), a.entidade], [t("Concelhos", "Municipalities"), (a.concelhos || []).join(", ")], [t("Parcelas", "Parcels"), num(a.parcelas)], [t("Área", "Area"), a.area_ha ? num(a.area_ha) + " ha" : ""], [t("Estado", "Status"), estadoTxt(a.estado)]];
    L.forEach(function (x) { if (x[1] !== null && x[1] !== undefined && x[1] !== "") h += "<div><span style=\"opacity:.75\">" + esc(x[0]) + ":</span> " + esc(x[1]) + "</div>"; });
    h += temGeo(a) ? '<div style="margin-top:4px;opacity:.75">' + t("Contorno vectorizado pelo IPR a partir das plantas parcelares", "Boundary vectorised by IPR from the parcel plans") + (a.area_vectorizada_ha ? " (" + num(a.area_vectorizada_ha) + " ha)" : "") + ".</div>"
      : '<div style="margin-top:4px;opacity:.75">' + t("Geometria ainda não disponível: marcador no concelho.", "Geometry not yet available: marker in the municipality.") + "</div>";
    if (a.ligacao_dr) h += '<div style="margin-top:4px"><a href="' + esc(a.ligacao_dr) + '" target="_blank" rel="noopener">' + t("Ver no Diário da República", "See in the Diário da República") + "</a></div>";
    h += '<div style="margin-top:6px;font-size:11px;opacity:.65">' + esc(t(AVISO_PT, AVISO_EN)) + "</div></div>";
    return h;
  }
  function fichaCtx(c) {
    var h = '<div style="font:13px/1.45 Inter,system-ui,sans-serif;max-width:300px;color:inherit"><b>' + esc(c.obra) + "</b>";
    h += '<div style="opacity:.75;margin:2px 0 6px">' + t("Contexto, não é uma expropriação", "Context, not an expropriation") + (c.acto ? " · " + esc(c.acto) : "") + (c.data_dr ? " · " + esc(dataPt(c.data_dr)) : "") + "</div>";
    if (c.frase) h += "<div>" + esc(c.frase) + "</div>";
    if (c.area_ha) h += '<div><span style="opacity:.75">' + t("Área", "Area") + ":</span> " + esc(num(c.area_ha)) + " ha</div>";
    if (c.ligacao_dr) h += '<div style="margin-top:4px"><a href="' + esc(c.ligacao_dr) + '" target="_blank" rel="noopener">' + t("Ver no Diário da República", "See in the Diário da República") + "</a></div>";
    h += '<div style="margin-top:6px;font-size:11px;opacity:.65">' + esc(t("Perímetro reconstituído pelo IPR a partir das coordenadas dos vértices publicadas no Diário da República. Sem valor jurídico.", "Perimeter rebuilt by IPR from the vertex coordinates published in the Diário da República. No legal value.")) + "</div></div>";
    return h;
  }
  function contexto() { return (S.idx && S.idx.contexto) || []; }
  function ctxId(id) { var a = contexto(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function actos() { return (S.idx && S.idx.actos) || []; }
  function visivel(a) { return !S.estado || a.estado === S.estado; }
  function porId(id) { var a = actos(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function pontos() {
    return { type: "FeatureCollection", features: actos().filter(function (a) { return !temGeo(a) && a.centro; }).map(function (a) {
      return { type: "Feature", geometry: { type: "Point", coordinates: a.centro }, properties: { id: a.id, cor: cor(a), estado: a.estado || "" } }; }) };
  }
  function filtro() { return S.estado ? ["==", ["get", "estado"], S.estado] : null; }
  var IDS = ["ipr-expro-f", "ipr-expro-l", "ipr-expro-p"], CIDS = ["ipr-expro-cf", "ipr-expro-cl"];
  function tirar() { var I = mapa(); if (!I) return; IDS.concat(CIDS).forEach(function (l) { try { if (I.getLayer(l)) I.removeLayer(l); } catch (e) {} }); ["ipr-expro-a", "ipr-expro-pt", "ipr-expro-ctx"].forEach(function (s) { try { if (I.getSource(s)) I.removeSource(s); } catch (e) {} }); }
  function desenhar() {
    var I = mapa(); if (!I || !S.on || !S.idx) return;
    tirar();
    try {
      I.addSource("ipr-expro-ctx", { type: "geojson", data: S.ctx || { type: "FeatureCollection", features: [] } });
      I.addLayer({ id: "ipr-expro-cf", type: "fill", source: "ipr-expro-ctx", minzoom: 8, paint: { "fill-color": "#d8d0b0", "fill-opacity": 0.06 } });
      I.addLayer({ id: "ipr-expro-cl", type: "line", source: "ipr-expro-ctx", minzoom: 6, paint: { "line-color": "#d8d0b0", "line-width": 1.6, "line-dasharray": [3, 2] } });
      I.addSource("ipr-expro-a", { type: "geojson", data: S.area || { type: "FeatureCollection", features: [] } });
      I.addLayer({ id: "ipr-expro-f", type: "fill", source: "ipr-expro-a", minzoom: 8, paint: { "fill-color": ["get", "cor"], "fill-opacity": 0.35 } });
      I.addLayer({ id: "ipr-expro-l", type: "line", source: "ipr-expro-a", minzoom: 6, paint: { "line-color": ["get", "cor"], "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 14, 1.2] } });
      I.addSource("ipr-expro-pt", { type: "geojson", data: pontos() });
      I.addLayer({ id: "ipr-expro-p", type: "circle", source: "ipr-expro-pt", paint: { "circle-radius": 7, "circle-color": ["get", "cor"], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5, "circle-opacity": 0.9 } });
      var f = filtro(); IDS.forEach(function (l) { try { I.setFilter(l, f); } catch (e) {} });
    } catch (e) {}
  }
  var popup = null;
  function abrir(a, ll) {
    var I = mapa(); if (!I || !W.maplibregl || !a) return;
    try { if (popup) popup.remove(); popup = new W.maplibregl.Popup({ maxWidth: "320px" }).setLngLat(ll).setHTML(ficha(a)).addTo(I); } catch (e) {}
  }
  var preso = false;
  function prender() {
    var I = mapa(); if (!I || preso) return !!preso; preso = true;
    ["ipr-expro-p", "ipr-expro-f"].forEach(function (l) {
      I.on("click", l, function (e) { var f = e.features && e.features[0]; if (f) abrir(porId(f.properties.id), e.lngLat); });
      I.on("mouseenter", l, function () { I.getCanvas().style.cursor = "pointer"; }); I.on("mouseleave", l, function () { I.getCanvas().style.cursor = ""; });
    });
    I.on("click", "ipr-expro-cf", function (e) {
      try { if (I.queryRenderedFeatures(e.point, { layers: ["ipr-expro-f", "ipr-expro-p"] }).length) return; } catch (x) {}
      var f = e.features && e.features[0]; var c = f && ctxId(f.properties.id); if (!c || !W.maplibregl) return;
      try { if (popup) popup.remove(); popup = new W.maplibregl.Popup({ maxWidth: "320px" }).setLngLat(e.lngLat).setHTML(fichaCtx(c)).addTo(I); } catch (x) {}
    });
    I.on("styledata", function () { if (S.on && S.idx && !I.getLayer("ipr-expro-p")) setTimeout(desenhar, 60); });
    return true;
  }
  function caixa(id) {
    var b = [180, 90, -180, -90], n = 0;
    ((S.area && S.area.features) || []).forEach(function (f) {
      if (f.properties.id !== id) return;
      (function per(c) { if (typeof c[0] === "number") { n++; if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; } else c.forEach(per); })(f.geometry.coordinates);
    });
    return n ? [[b[0], b[1]], [b[2], b[3]]] : null;
  }
  function voar(a) {
    var I = mapa(); if (!I || !a) return;
    var bx = temGeo(a) ? caixa(a.id) : null, ll = a.centro;
    if (bx) { try { I.fitBounds(bx, { padding: 40, maxZoom: 15 }); } catch (e) {} ll = [(bx[0][0] + bx[1][0]) / 2, (bx[0][1] + bx[1][1]) / 2]; }
    else if (a.centro) { try { I.flyTo({ center: a.centro, zoom: 10 }); } catch (e) {} }
    if (ll) setTimeout(function () { abrir(a, ll); }, 900);
  }

  function irCtx(c) {
    var I = mapa(); if (!I || !c) return; var b = [180, 90, -180, -90], n = 0;
    ((S.ctx && S.ctx.features) || []).forEach(function (f) { if (f.properties.id !== c.id) return;
      (function per(k) { if (typeof k[0] === "number") { n++; if (k[0] < b[0]) b[0] = k[0]; if (k[1] < b[1]) b[1] = k[1]; if (k[0] > b[2]) b[2] = k[0]; if (k[1] > b[3]) b[3] = k[1]; } else k.forEach(per); })(f.geometry.coordinates); });
    if (!n) return; try { I.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, maxZoom: 15 }); } catch (e) {}
    setTimeout(function () { try { if (popup) popup.remove(); popup = new W.maplibregl.Popup({ maxWidth: "320px" }).setLngLat([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]).setHTML(fichaCtx(c)).addTo(I); } catch (e) {} }, 900);
  }
  function ir(id) { ligar(true); carregar().then(function () { var a = porId(id); if (a) voar(a); else irCtx(ctxId(id)); }); }

  // ---------- painel ----------
  var CSS = "#ipr-expro{margin:0 0 10px;border:1px solid rgba(167,126,224,.45);border-radius:8px;background:rgba(20,26,16,.55);color:#e9e6da;font:13px/1.45 Inter,system-ui,sans-serif}" +
    "#ipr-expro>summary{list-style:none;cursor:pointer;padding:9px 12px;display:flex;align-items:center;gap:8px;font-weight:600}#ipr-expro>summary::-webkit-details-marker{display:none}" +
    "#ipr-expro>summary:before{content:'';width:8px;height:8px;background:#a77ee0;clip-path:polygon(100% 0,100% 100%,0 100%);transition:transform .2s}#ipr-expro[open]>summary:before{transform:rotate(45deg)}" +
    "#ipr-expro .c{padding:0 12px 12px}#ipr-expro label{display:flex;gap:8px;align-items:flex-start;margin:4px 0;cursor:pointer}" +
    "#ipr-expro select{width:100%;margin:6px 0 2px;background:rgba(0,0,0,.25);color:#e9e6da;border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:4px 6px;font:inherit}" +
    "#ipr-expro h4{margin:10px 0 2px;font-size:12px;font-weight:600;letter-spacing:.02em;color:#cfc9b4;display:flex;gap:6px;align-items:center}" +
    "#ipr-expro ul{list-style:none;margin:2px 0 4px;padding:0}#ipr-expro li{margin:3px 0}#ipr-expro li button{background:none;border:0;color:#e9e6da;text-align:left;cursor:pointer;font:inherit;padding:2px 0;display:flex;gap:6px;align-items:baseline}" +
    "#ipr-expro li button:hover{color:#cfb6f2}#ipr-expro i{display:inline-block;width:9px;height:9px;border-radius:50%;flex:none}#ipr-expro small{color:#9a9e8a;display:block;margin-top:8px}#ipr-expro .s{color:#9a9e8a;font-size:12px}";
  function pintar() {
    var d = D.getElementById("ipr-expro"); if (!d) return; var c = d.querySelector(".c"); if (!c) return;
    var h = '<label><input type="checkbox" data-expro="on"' + (S.on ? " checked" : "") + "> <span>" + t("Mostrar no mapa", "Show on the map") + "</span></label>";
    h += '<select data-expro="estado" aria-label="' + t("Filtrar por estado", "Filter by status") + '"><option value="">' + t("Todos os estados", "All statuses") + "</option>" +
      ESTADOS.map(function (e) { return '<option value="' + esc(e) + '"' + (S.estado === e ? " selected" : "") + ">" + esc(estadoTxt(e)) + "</option>"; }).join("") + "</select>";
    if (S.erro) h += '<div class="s">' + esc(S.erro) + "</div>";
    if (S.idx) {
      var n = 0;
      TEMAS.forEach(function (k) {
        var L = actos().filter(function (a) { return temaDe(a) === k && visivel(a); });
        if (!L.length) return; n += L.length;
        h += '<h4><i style="background:' + COR[k] + '"></i>' + esc(t(TEMA[k][0], TEMA[k][1])) + ' <span class="s">(' + L.length + ")</span></h4><ul>" + L.map(function (a) {
          return '<li><button type="button" data-expro-id="' + esc(a.id) + '"><span>' + esc(a.obra) + ' <span class="s">· ' + esc(dataPt(a.data_dr)) + " · " + esc(estadoTxt(a.estado)) + (temGeo(a) ? "" : " · " + t("marcador", "marker")) + "</span></span></button></li>"; }).join("") + "</ul>";
      });
      if (!n) h += '<div class="s">' + t("Nenhum acto neste estado.", "No acts with this status.") + "</div>";
      if (contexto().length) h += '<h4><i style="background:none;border:1.5px dashed #d8d0b0;border-radius:2px"></i>' + t("Contexto (não são expropriações)", "Context (not expropriations)") + "</h4><ul>" + contexto().map(function (c) {
        return '<li><button type="button" data-expro-ctx="' + esc(c.id) + '"><span>' + esc(c.obra) + (c.data_dr ? ' <span class="s">· ' + esc(dataPt(c.data_dr)) + "</span>" : "") + "</span></button></li>"; }).join("") + "</ul>";
    }
    h += "<small>" + esc(t(AVISO_PT, AVISO_EN)) + "</small>";
    c.innerHTML = h;
  }
  function ligar(v) {
    S.on = !!v;
    if (!S.on) { tirar(); pintar(); return; }
    carregar().then(function () { desenhar(); pintar(); });
  }
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-expro")) return true;
    if (!D.getElementById("ipr-expro-css")) { var st = D.createElement("style"); st.id = "ipr-expro-css"; st.textContent = CSS; D.head.appendChild(st); }
    var d = D.createElement("details"); d.id = "ipr-expro";
    d.innerHTML = "<summary>" + t("Expropriações", "Expropriations") + '</summary><div class="c"></div>';
    var ref = D.getElementById("ipr-pdmc"); cam.insertBefore(d, ref ? ref.nextSibling : cam.firstChild);
    d.addEventListener("toggle", function () { if (d.open && !S.idx) carregar().then(pintar); });
    d.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-expro");
      if (k === "on") ligar(e.target.checked);
      else if (k === "estado") { S.estado = e.target.value; pintar(); if (S.on) desenhar(); }
    });
    d.addEventListener("click", function (e) {
      var bc = e.target.closest && e.target.closest("[data-expro-ctx]");
      if (bc) { var c = ctxId(bc.getAttribute("data-expro-ctx")); if (!S.on) { var cb0 = d.querySelector('[data-expro="on"]'); if (cb0) cb0.checked = true; ligar(true); } carregar().then(function () { irCtx(c); }); return; }
      var b = e.target.closest && e.target.closest("[data-expro-id]"); if (!b) return;
      var a = porId(b.getAttribute("data-expro-id")); if (!S.on) { var cb = d.querySelector('[data-expro="on"]'); if (cb) cb.checked = true; ligar(true); }
      carregar().then(function () { voar(a); });
    });
    pintar();
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) { if (PEDIDO) { var d0 = D.getElementById("ipr-expro"); if (d0) d0.open = true; var cb = d0 && d0.querySelector('[data-expro="on"]'); if (cb) cb.checked = true; setTimeout(function () { ir(PEDIDO); }, 1200); } return; } if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  setInterval(function () { try { bloco(); } catch (e) {} }, 3000);
  W.__iprExpro = { ligar: ligar, ir: ir };
})();
