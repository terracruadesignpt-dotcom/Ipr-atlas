/* IPR Atlas · camadas da EDIA (Alqueva), 31/10/2026. Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Pedido do Nuno (31/10, 16h41, notícia das ortofotos de 2025 da EDIA): «Avança e pesquisa isto»; escolha às 17h00:
   «Grupo Alqueva (EDIA) no Atlas».
   Fonte: serviço aberto da EDIA, S.A. (ArcGIS, pasta «publico», EDIA_DadosAbertos), licença CC BY 4.0 com uso comercial.
   Ortofotomapas de 2025 a 25 cm em cor real e em infravermelho (falsa-cor), a série 2022, 2019, 2017, 2015, 2004 e 1995,
   as curvas de nível de 1995 (1:5000) e a Carta de aptidão ao regadio. Cobertura: só a área do Empreendimento de Fins
   Múltiplos de Alqueva; o grupo só aparece quando o mapa está nessa zona (como o es-camadas.js para Espanha).
   Atribuição obrigatória (CC BY 4.0): «© EDIA, S.A. · CC BY 4.0», sem sugerir que a EDIA apoia o uso.
   Investigação: cartografia/edia-dados-abertos-2026-10-31.md no projecto.
   Desligar: ?edia=0 ou localStorage ipr_edia_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]edia=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_edia_off") === "1") return; } catch (e) {}
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var SRV = "https://sigims2.edia.pt/ediaags2/rest/services/publico/EDIA_DadosAbertos/MapServer/export";
  var ATTR = "© EDIA, S.A. · <a href=\"https://creativecommons.org/licenses/by/4.0/deed.pt\" target=\"_blank\" rel=\"noopener\">CC BY 4.0</a>";
  // Extensão do serviço (PT-TM06 x -40 000 a 115 000, y -265 000 a -80 000), em graus, com folga.
  var CX = [-8.25, 37.55, -6.85, 39.25];
  function exp(ids, fmt) {
    return SRV + "?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=" + (fmt || "jpg") +
      "&transparent=" + (fmt === "png32" ? "true" : "false") + "&layers=show:" + ids + "&f=image";
  }
  var CAT = [
    { sub: t("Ortofotomapas 2025 · 25 cm", "Orthophotos 2025 · 25 cm"), itens: [
      { id: "edia-2025", nome: t("Cor real 2025", "True colour 2025"), url: exp("75"), op: 1, min: 9 },
      { id: "edia-2025iv", nome: t("Infravermelho 2025 (falsa-cor: vegetação viva a vermelho)", "Infrared 2025 (false colour: live vegetation in red)"), url: exp("73"), op: 1, min: 9 }
    ] },
    { sub: t("Série histórica", "Historical series"), itens: [
      { id: "edia-2022", nome: "2022", url: exp("56"), op: 1, min: 9 },
      { id: "edia-2022iv", nome: t("2022 · infravermelho", "2022 · infrared"), url: exp("70"), op: 1, min: 9 },
      { id: "edia-2019", nome: "2019", url: exp("28"), op: 1, min: 9 },
      { id: "edia-2019iv", nome: t("2019 · infravermelho", "2019 · infrared"), url: exp("37"), op: 1, min: 9 },
      { id: "edia-2017", nome: "2017", url: exp("4"), op: 1, min: 9 },
      { id: "edia-2015", nome: "2015", url: exp("12"), op: 1, min: 9 },
      { id: "edia-2004", nome: "2004", url: exp("13"), op: 1, min: 9 },
      { id: "edia-1995", nome: "1995", url: exp("14"), op: 1, min: 9 }
    ] },
    { sub: t("Terreno e regadio", "Terrain and irrigation"), itens: [
      { id: "edia-aptidao", nome: t("Carta de aptidão ao regadio", "Irrigation suitability map"), url: exp("17", "png32"), op: 0.6, min: 9 },
      { id: "edia-curvas", nome: t("Curvas de nível 1995 (1:5000)", "Contour lines 1995 (1:5000)"), url: exp("1", "png32"), op: 0.9, min: 14 }
    ] }
  ];
  var CHAVE = "tcd_atlas_edia";
  var ligados = {};
  try { ligados = JSON.parse(W.localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { W.localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return CAT[g].itens[i]; return null; }
  // Por baixo dos desenhos, do terreno e das camadas da Base; as ortofotos ficam por cima do fundo.
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno|^iprv-l_|^ipr-ter/.test(L[i].id)) return L[i].id; return undefined; }
  var falhas = {};
  function ligar(it) {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(it); }, 0); }); return; } // o estilo basta (o «idle» pode não chegar com mosaicos a carregar)
    try {
      if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: ATTR, minzoom: 6, maxzoom: 20,
        bounds: [CX[0], CX[1], CX[2], CX[3]] });
      if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op, "raster-fade-duration": 150 } }, antes(I));
    } catch (e) { if (W.console) console.warn("[edia-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    try { if (I.getLayer(it.id)) I.removeLayer(it.id); } catch (e) {}
    try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {}
  }
  var CSS = ".tedia:not(.aberto)>*:not(h4){display:none}.tedia h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tedia h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tedia.aberto h4::before{transform:rotate(90deg)}" +
    ".tedia h4 em{font:500 10.5px Inter,system-ui,sans-serif;font-style:normal;color:var(--mu,#777);margin-left:auto}" +
    ".tedia h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tedia label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tedia label input{margin-top:2px}" +
    ".tedia small{display:block;margin-top:6px;font-size:11px;line-height:1.4;color:var(--mu,#777)}.tedia small a{color:inherit}" +
    ".tedia .av{display:none;margin-top:6px;font-size:11.5px;color:#b6432e}.tedia.falha .av{display:block}";
  function montar() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("tedia")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("div"); d.id = "tedia"; d.className = "tedia ipr-g"; d.setAttribute("data-g", "edia"); d.hidden = true;
    var h = "<h4>" + t("Alqueva (EDIA)", "Alqueva (EDIA)") + "<em>" + t("2025 · 25 cm", "2025 · 25 cm") + "</em></h4>";
    CAT.forEach(function (g) {
      h += "<h5>" + g.sub + "</h5>";
      g.itens.forEach(function (it) { h += '<label><input type="checkbox" data-tedia="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> <span>" + it.nome + "</span></label>"; });
    });
    h += '<p class="av" role="status">' + t("O serviço da EDIA não respondeu. Tente mais tarde.", "The EDIA service did not respond. Please try later.") + "</p>";
    h += "<small>" + t("Dados abertos da EDIA, S.A., licença ", "Open data from EDIA, S.A., licence ") + '<a href="https://creativecommons.org/licenses/by/4.0/deed.pt" target="_blank" rel="noopener">CC BY 4.0</a>' +
      t(". Só a área do Empreendimento de Fins Múltiplos de Alqueva. A EDIA não está associada ao IPR Atlas.", ". Alqueva Multi-Purpose Project area only. EDIA is not associated with IPR Atlas.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (W.localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { W.localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tedia]"); if (!c) return;
      var it = itemPor(c.getAttribute("data-tedia")); if (!it) return;
      if (c.checked) { ligados[it.id] = 1; ligar(it); } else { delete ligados[it.id]; desligar(it); }
      guardar();
    });
    return true;
  }
  function dentro(c) { return c.lng >= CX[0] && c.lng <= CX[2] && c.lat >= CX[1] && c.lat <= CX[3]; }
  function verificar() {
    var I = mapa(), d = D.getElementById("tedia"); if (!I || !d || !I.getCenter) return;
    var em = dentro(I.getCenter());
    if (d.hidden === em) d.hidden = !em;
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it) ligar(it); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor();
    if (I.on) {
      I.on("moveend", verificar);
      I.on("styledata", function () { setTimeout(repor, 0); });
      I.on("error", function (e) {
        var sid = e && (e.sourceId || (e.source && e.source.id)); if (!sid || !/^edia-/.test(sid)) return;
        falhas[sid] = (falhas[sid] || 0) + 1;
        if (falhas[sid] === 6) { var d = D.getElementById("tedia"); if (d) d.classList.add("falha"); }
      });
    }
  }
  W.__tcdEdiaCamadas = { CAT: CAT, dentro: dentro };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
