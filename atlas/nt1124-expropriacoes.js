/* IPR Atlas · Grandes obras e expropriações (24/11/2026). Terracrua Design.
   Documento «Camada de expropriações do IPR Atlas · achados, estratégia e passagem» (24/11/2026); Nuno, 13h58: «Publica já».
   Um bloco no painel das camadas com os actos (DUP e servidões) do índice: o corredor do Subtroço 3 da LAV (DUP 13198/2026)
   desenhado a partir das plantas parcelares vectorizadas pelo IPR; os outros actos, ainda sem geometria, aparecem como
   marcador no concelho (nunca um corredor desenhado à mão). Ficha ao clicar. Aviso fixo em PT e EN.
   Dados públicos sem dados pessoais (sem nomes, moradas, matrizes nem descrições prediais), servidos por commit fixo.
   Cores: #a77ee0 obras e expropriações; #9aa3ad minas e pedreiras (as mesmas da zona de imprensa, m92538).
   Desligar: ?expro=0. API: window.__iprExpro = { ligar(bool) }. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]expro=0(&|$)/.test(location.search) || W.__iprExpro) return;
  var DADOS = "https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@9610be85b35537c39a92ca914021abcd7f6aa122/dados/expropriacoes/";
  var COR = { ferrovia: "#a77ee0", rodovia: "#a77ee0", agua: "#a77ee0", energia: "#a77ee0", urbano: "#a77ee0", minas: "#9aa3ad" };
  var TEMA = { ferrovia: ["Ferrovia", "Railway"], rodovia: ["Rodovia", "Road"], minas: ["Minas e pedreiras", "Mines and quarries"], urbano: ["Urbano", "Urban"], agua: ["Água", "Water"], energia: ["Energia", "Energy"] };
  var S = { on: false, idx: null, area: null, erro: "" };
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  var AVISO_PT = "Delimitação aproximada, vectorizada pelo IPR a partir das plantas parcelares publicadas no Diário da República. Não substitui as plantas oficiais nem tem valor jurídico. As entidades citadas não estão associadas ao IPR Atlas.";
  var AVISO_EN = "Approximate boundary, vectorised by IPR from the parcel plans published in the Diário da República. It does not replace the official plans and has no legal value. The entities mentioned are not associated with IPR Atlas.";

  function carregar() {
    if (S.idx) return Promise.resolve();
    return Promise.all([
      fetch(DADOS + "indice.json").then(function (r) { return r.json(); }),
      fetch(DADOS + "lav-st3-area.geojson").then(function (r) { return r.json(); })
    ]).then(function (v) { S.idx = v[0]; S.area = v[1]; }).catch(function () { S.erro = t("Não foi possível carregar a camada.", "Could not load the layer."); });
  }
  function dataPt(d) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d || ""); return m ? (m[3] ? m[3] + "/" : "") + m[2] + "/" + m[1] : (d || ""); }
  function ficha(a) {
    var tema = TEMA[a.tema] ? t(TEMA[a.tema][0], TEMA[a.tema][1]) : a.tema;
    var h = '<div style="font:13px/1.45 Inter,system-ui,sans-serif;max-width:300px;color:#1d2316"><b>' + esc(a.obra) + "</b>";
    h += '<div style="color:#5b6150;margin:2px 0 6px">' + esc(tema) + " · " + esc(a.acto) + (a.numero ? " n.º " + esc(a.numero) + (a.numero_confirmado ? "" : " " + t("(por confirmar)", "(to be confirmed)")) : "") + (a.data_dr ? " · " + esc(dataPt(a.data_dr)) : "") + "</div>";
    var L = [[t("Entidade", "Entity"), a.entidade], [t("Concelhos", "Municipalities"), (a.concelhos || []).join(", ")], [t("Parcelas", "Parcels"), a.parcelas], [t("Área", "Area"), a.area_ha ? String(a.area_ha).replace(".", ",") + " ha" : ""], [t("Estado", "Status"), a.estado]];
    L.forEach(function (x) { if (x[1] !== null && x[1] !== undefined && x[1] !== "") h += "<div><span style=\"color:#5b6150\">" + esc(x[0]) + ":</span> " + esc(x[1]) + "</div>"; });
    h += a.geojson ? '<div style="margin-top:4px;color:#5b6150">' + t("Geometria vectorizada pelo IPR (contorno a cerca de 0,7 m dos vértices oficiais).", "Geometry vectorised by IPR (within about 0.7 m of the official vertices).") + "</div>"
      : '<div style="margin-top:4px;color:#5b6150">' + t("Geometria ainda não disponível: marcador no concelho.", "Geometry not yet available: marker in the municipality.") + "</div>";
    if (a.ligacao_dr) h += '<div style="margin-top:4px"><a href="' + esc(a.ligacao_dr) + '" target="_blank" rel="noopener">' + t("Ver no Diário da República", "See in the Diário da República") + "</a></div>";
    h += '<div style="margin-top:6px;font-size:11px;color:#6b7060">' + esc(t(AVISO_PT, AVISO_EN)) + "</div></div>";
    return h;
  }
  function porId(id) { var a = (S.idx && S.idx.actos) || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function pontos() {
    return { type: "FeatureCollection", features: ((S.idx && S.idx.actos) || []).filter(function (a) { return !a.geojson && a.centro; }).map(function (a) {
      return { type: "Feature", geometry: { type: "Point", coordinates: a.centro }, properties: { id: a.id, cor: COR[a.tema] || "#a77ee0" } }; }) };
  }
  var IDS = ["ipr-expro-f", "ipr-expro-l", "ipr-expro-p"];
  function tirar() { var I = mapa(); if (!I) return; IDS.forEach(function (l) { try { if (I.getLayer(l)) I.removeLayer(l); } catch (e) {} }); ["ipr-expro-a", "ipr-expro-pt"].forEach(function (s) { try { if (I.getSource(s)) I.removeSource(s); } catch (e) {} }); }
  function desenhar() {
    var I = mapa(); if (!I || !S.on || !S.idx) return;
    tirar();
    try {
      I.addSource("ipr-expro-a", { type: "geojson", data: S.area });
      I.addLayer({ id: "ipr-expro-f", type: "fill", source: "ipr-expro-a", minzoom: 9, paint: { "fill-color": "#a77ee0", "fill-opacity": 0.35 } });
      I.addLayer({ id: "ipr-expro-l", type: "line", source: "ipr-expro-a", minzoom: 7, paint: { "line-color": "#7d4fc4", "line-width": ["interpolate", ["linear"], ["zoom"], 7, 2, 14, 1.2] } });
      I.addSource("ipr-expro-pt", { type: "geojson", data: pontos() });
      I.addLayer({ id: "ipr-expro-p", type: "circle", source: "ipr-expro-pt", paint: { "circle-radius": 7, "circle-color": ["get", "cor"], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5, "circle-opacity": 0.9 } });
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
    I.on("click", "ipr-expro-p", function (e) { var f = e.features && e.features[0]; if (f) abrir(porId(f.properties.id), e.lngLat); });
    I.on("click", "ipr-expro-f", function (e) { abrir(porId("lav-st3"), e.lngLat); });
    ["ipr-expro-p", "ipr-expro-f"].forEach(function (l) { I.on("mouseenter", l, function () { I.getCanvas().style.cursor = "pointer"; }); I.on("mouseleave", l, function () { I.getCanvas().style.cursor = ""; }); });
    I.on("styledata", function () { if (S.on && S.idx && !I.getLayer("ipr-expro-p")) setTimeout(desenhar, 60); });
    return true;
  }
  function voar(a) {
    var I = mapa(); if (!I || !a) return;
    if (a.id === "lav-st3" && S.area) { try { I.fitBounds([[-8.612, 40.828], [-8.555, 40.971]], { padding: 40 }); } catch (e) {} }
    else if (a.centro) { try { I.flyTo({ center: a.centro, zoom: 10 }); } catch (e) {} }
    setTimeout(function () { abrir(a, a.id === "lav-st3" ? [-8.58, 40.90] : a.centro); }, 900);
  }

  // ---------- painel ----------
  var CSS = "#ipr-expro{margin:0 0 10px;border:1px solid rgba(167,126,224,.45);border-radius:8px;background:rgba(20,26,16,.55);color:#e9e6da;font:13px/1.45 Inter,system-ui,sans-serif}" +
    "#ipr-expro>summary{list-style:none;cursor:pointer;padding:9px 12px;display:flex;align-items:center;gap:8px;font-weight:600}#ipr-expro>summary::-webkit-details-marker{display:none}" +
    "#ipr-expro>summary:before{content:'';width:8px;height:8px;background:#a77ee0;clip-path:polygon(100% 0,100% 100%,0 100%);transition:transform .2s}#ipr-expro[open]>summary:before{transform:rotate(45deg)}" +
    "#ipr-expro .c{padding:0 12px 12px}#ipr-expro label{display:flex;gap:8px;align-items:flex-start;margin:4px 0;cursor:pointer}" +
    "#ipr-expro ul{list-style:none;margin:6px 0;padding:0}#ipr-expro li{margin:3px 0}#ipr-expro li button{background:none;border:0;color:#e9e6da;text-align:left;cursor:pointer;font:inherit;padding:2px 0;display:flex;gap:6px;align-items:baseline}" +
    "#ipr-expro li button:hover{color:#cfb6f2}#ipr-expro i{display:inline-block;width:9px;height:9px;border-radius:50%;flex:none}#ipr-expro small{color:#9a9e8a;display:block;margin-top:8px}#ipr-expro .s{color:#9a9e8a;font-size:12px}";
  function pintar() {
    var d = D.getElementById("ipr-expro"); if (!d) return; var c = d.querySelector(".c"); if (!c) return;
    var h = '<label><input type="checkbox" data-expro="on"' + (S.on ? " checked" : "") + "> <span>" + t("Mostrar no mapa", "Show on the map") + "</span></label>";
    if (S.erro) h += '<div class="s">' + esc(S.erro) + "</div>";
    if (S.idx) {
      h += "<ul>" + S.idx.actos.map(function (a) {
        return '<li><button type="button" data-expro-id="' + esc(a.id) + '"><i style="background:' + (COR[a.tema] || "#a77ee0") + '"></i><span>' + esc(a.obra) + ' <span class="s">· ' + esc(dataPt(a.data_dr)) + (a.geojson ? "" : " · " + t("marcador", "marker")) + "</span></span></button></li>"; }).join("") + "</ul>";
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
    d.innerHTML = "<summary>" + t("Grandes obras e expropriações", "Major works and expropriations") + '</summary><div class="c"></div>';
    var ref = D.getElementById("ipr-pdmc"); cam.insertBefore(d, ref ? ref.nextSibling : cam.firstChild);
    d.addEventListener("toggle", function () { if (d.open && !S.idx) carregar().then(pintar); });
    d.addEventListener("change", function (e) { if (e.target.getAttribute("data-expro") === "on") ligar(e.target.checked); });
    d.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-expro-id]"); if (!b) return;
      var a = porId(b.getAttribute("data-expro-id")); if (!S.on) { var cb = d.querySelector('[data-expro="on"]'); if (cb) cb.checked = true; ligar(true); }
      voar(a);
    });
    pintar();
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  setInterval(function () { try { bloco(); } catch (e) {} }, 3000);
  W.__iprExpro = { ligar: ligar };
})();
