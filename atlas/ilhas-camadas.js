/* IPR Atlas · camadas dos Açores e da Madeira, 3/11/2026. Só acrescenta; não mexe noutros ficheiros (mesmo modelo do
   edia-camadas.js). Pedido do Nuno (3/11, 13h53): «Avança com tudo para as ilhas, máxima qualidade como no continente».
   Só entram camadas com licença que permite uso comercial (levantamento em atlas/ilhas-fontes-2026-11-03.md no projecto):
   · Açores: relevo sombreado 1:1000 (SRAAC, «acesso e uso sem condições»), COS.A 2018 e 2007, Rede Natura 2000 e áreas
     protegidas (SRAAC, CC BY 4.0, metadados de 29/10/2026).
   · Madeira: COSRAM 2018 (DROTe, CC BY 4.0) e Rede Natura 2000 (Agência Europeia do Ambiente, CC BY 4.0).
   As camadas de licença não comercial (ortofotos, MDT 10 m, cadastro, cheias da Madeira) ficam de fora até haver
   autorização escrita (pedidos enviados a 3/11 à SRAAC e ao IFCN; DROTe e DRAM a seguir).
   Os GeoServer wssig3 e wssig4 dos Açores não aceitam pedidos de outros sítios (sem CORS): passam pelo Worker ipr-ilhas
   (Cloudflare, cache de 7 dias). O grupo só aparece quando o mapa está sobre um dos arquipélagos.
   Desligar: ?ilhas=0 ou localStorage ipr_ilhas_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ilhas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ilhas_off") === "1") return; } catch (e) {}
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var RELE = "https://ipr-ilhas.terracrua-ipr.workers.dev/";
  var CCBY = '<a href="https://creativecommons.org/licenses/by/4.0/deed.pt" target="_blank" rel="noopener">CC BY 4.0</a>';
  var A_SRAAC = "© Secretaria Regional do Ambiente e Ação Climática / Governo dos Açores · " + CCBY;
  var A_RELEVO = "© Secretaria Regional do Ambiente e Ação Climática / Governo dos Açores (relevo VRICON, 2012–2017)";
  var A_DROTE = "© Direção Regional do Ordenamento do Território / Governo Regional da Madeira · " + CCBY;
  var A_AEA = "© Agência Europeia do Ambiente (Natura 2000) · " + CCBY;
  function wms(base, camada) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "service=WMS&version=1.3.0&request=GetMap&layers=" + encodeURIComponent(camada) +
      "&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true";
  }
  var COSA = "https://visualizador-idea.ambiente.azores.gov.pt/postgresql/idea/public/cosa/cgi-bin/qgis_mapserv.fcgi";
  var AEA = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer/export" +
    "?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=png32&transparent=true&f=image";
  var REG = {
    acores: { nome: "Açores", cx: [-31.6, 36.8, -24.8, 39.95] },
    madeira: { nome: "Madeira", cx: [-17.4, 32.3, -16.1, 33.2] }
  };
  var CAT = [
    { reg: "acores", sub: t("Açores · relevo e ocupação", "Azores · relief and land cover"), itens: [
      { id: "ilh-az-relevo", nome: t("Relevo sombreado 1:1000 (9 ilhas)", "Hillshade 1:1,000 (9 islands)"), url: wms(RELE + "wssig4.azores.gov.pt/geoserver/relevo/wms", "azo"), op: 0.75, min: 8, at: A_RELEVO },
      { id: "ilh-az-cosa18", nome: t("Ocupação do solo COS.A 2018 (nível 1)", "Land cover COS.A 2018 (level 1)"), url: wms(COSA, "cosa2018_n1"), op: 0.6, min: 9, at: A_SRAAC },
      { id: "ilh-az-cosa07", nome: t("Ocupação do solo COS.A 2007", "Land cover COS.A 2007"), url: wms(COSA, "cosa_2007"), op: 0.6, min: 9, at: A_SRAAC }
    ] },
    { reg: "acores", sub: t("Açores · conservação da natureza", "Azores · nature conservation"), itens: [
      { id: "ilh-az-n2000", nome: t("Rede Natura 2000 (ZEC e ZPE)", "Natura 2000 (SAC and SPA)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatura2000"), op: 0.7, min: 7, at: A_SRAAC },
      { id: "ilh-az-ap", nome: t("Áreas protegidas (parques naturais de ilha)", "Protected areas (island natural parks)"), url: wms(RELE + "wssig3.azores.gov.pt/geoserver/ps/wms", "PS.ProtectedSitesNatureConservation"), op: 0.7, min: 7, at: A_SRAAC }
    ] },
    { reg: "madeira", sub: t("Madeira e Porto Santo", "Madeira and Porto Santo"), itens: [
      { id: "ilh-md-cosram", nome: t("Ocupação do solo COSRAM 2018", "Land cover COSRAM 2018"), url: wms("https://geoservices.madeira.gov.pt/geoserver/LC_COSRAM_2018/wms", "LC.LandCoverSurfaces"), op: 0.6, min: 9, at: A_DROTE },
      { id: "ilh-md-n2000", nome: t("Rede Natura 2000 (Agência Europeia do Ambiente)", "Natura 2000 (European Environment Agency)"), url: AEA, op: 0.7, min: 7, at: A_AEA }
    ] }
  ];
  var CHAVE = "tcd_atlas_ilhas";
  var ligados = {};
  try { ligados = JSON.parse(W.localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { W.localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return { it: CAT[g].itens[i], reg: CAT[g].reg }; return null; }
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno|^iprv-l_|^ipr-ter/.test(L[i].id)) return L[i].id; return undefined; }
  var falhas = {};
  function ligar(x) {
    var it = x.it, cx = REG[x.reg].cx, I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(x); }, 0); }); return; }
    try {
      if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.at, minzoom: 6, maxzoom: 19, bounds: cx });
      if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op, "raster-fade-duration": 150 } }, antes(I));
    } catch (e) { if (W.console) console.warn("[ilhas-camadas]", it.id, e && e.message); }
  }
  function desligar(x) {
    var it = x.it, I = mapa(); if (!I || !I.getLayer) return;
    try { if (I.getLayer(it.id)) I.removeLayer(it.id); } catch (e) {}
    try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {}
  }
  var CSS = ".tilh:not(.aberto)>*:not(h4){display:none}.tilh h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tilh h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tilh.aberto h4::before{transform:rotate(90deg)}" +
    ".tilh h4 em{font:500 10.5px Inter,system-ui,sans-serif;font-style:normal;color:var(--mu,#777);margin-left:auto}" +
    ".tilh h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tilh label{display:flex;gap:7px;align-items:flex-start;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tilh label input{margin-top:2px}" +
    ".tilh small{display:block;margin-top:6px;font-size:11px;line-height:1.4;color:var(--mu,#777)}.tilh small a{color:inherit}" +
    ".tilh .av{display:none;margin-top:6px;font-size:11.5px;color:#b6432e}.tilh.falha .av{display:block}.tilh [data-reg][hidden]{display:none}";
  function montar() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("tilh")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("div"); d.id = "tilh"; d.className = "tilh ipr-g"; d.setAttribute("data-g", "ilhas"); d.hidden = true;
    var h = "<h4><span class=\"tilh-t\">" + t("Açores e Madeira", "Azores and Madeira") + "</span><em>" + t("dados regionais", "regional data") + "</em></h4>";
    CAT.forEach(function (g) {
      h += '<div data-reg="' + g.reg + '"><h5>' + g.sub + "</h5>";
      g.itens.forEach(function (it) { h += '<label><input type="checkbox" data-tilh="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> <span>" + it.nome + "</span></label>"; });
      h += "</div>";
    });
    h += '<p class="av" role="status">' + t("Um dos serviços regionais não respondeu. Tente mais tarde.", "One of the regional services did not respond. Please try later.") + "</p>";
    h += "<small>" + t("Dados dos governos regionais dos Açores e da Madeira e da Agência Europeia do Ambiente, com as licenças indicadas em cada mapa. As entidades não estão associadas ao IPR Atlas. Informação indicativa: não substitui a consulta às entidades.",
      "Data from the regional governments of the Azores and Madeira and the European Environment Agency, under the licences shown on each map. These bodies are not associated with IPR Atlas. Indicative information: it does not replace consulting the authorities.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (W.localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { W.localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tilh]"); if (!c) return;
      var x = itemPor(c.getAttribute("data-tilh")); if (!x) return;
      if (c.checked) { ligados[x.it.id] = 1; ligar(x); } else { delete ligados[x.it.id]; desligar(x); }
      guardar();
    });
    return true;
  }
  function regiao(c) { for (var k in REG) { var b = REG[k].cx; if (c.lng >= b[0] && c.lng <= b[2] && c.lat >= b[1] && c.lat <= b[3]) return k; } return null; }
  function verificar() {
    var I = mapa(), d = D.getElementById("tilh"); if (!I || !d || !I.getCenter) return;
    var r = regiao(I.getCenter());
    if (d.hidden === !!r) d.hidden = !r;
    if (r) {
      d.querySelectorAll("[data-reg]").forEach(function (n) { n.hidden = n.getAttribute("data-reg") !== r; });
      var tt = d.querySelector(".tilh-t"); if (tt) tt.textContent = REG[r].nome;
    }
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var x = itemPor(id); if (x) ligar(x); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor();
    if (I.on) {
      I.on("moveend", verificar);
      I.on("styledata", function () { setTimeout(repor, 0); });
      I.on("error", function (e) {
        var sid = e && (e.sourceId || (e.source && e.source.id)); if (!sid || !/^ilh-/.test(sid)) return;
        falhas[sid] = (falhas[sid] || 0) + 1;
        if (falhas[sid] === 6) { var d = D.getElementById("tilh"); if (d) d.classList.add("falha"); }
      });
    }
  }
  W.__tcdIlhasCamadas = { CAT: CAT, regiao: regiao };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
