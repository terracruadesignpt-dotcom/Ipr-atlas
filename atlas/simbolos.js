/* IPR Atlas · código de símbolos dos pontos, igual para todas as organizações (Nuno, 14/11/2026).
   Cada ponto pertence a uma família (água, património, saúde, ...) pelo seu tipo; cada família tem uma cor e um ícone.
   window.IPR_SIMB.familia(tipo) -> id da família; .preparar(mapa) regista os ícones; .anotar(gj) escreve _fam em cada ponto;
   .legenda(gjs) devolve o HTML da legenda com as famílias presentes. Os tipos vêm do OpenStreetMap ("chave=valor") ou
   são os do Atlas (produtor, mercado, sede, ...). */
(function () {
  "use strict";
  var W = window;
  if (W.IPR_SIMB) return;
  // id, nome, cor, ícone (caminho SVG em 24 x 24)
  var FAM = [
    ["agua", "Água", "#2f7fd0", "M12 3C9 7.5 6 10.6 6 14a6 6 0 0 0 12 0c0-3.4-3-6.5-6-11z"],
    ["patrimonio", "Património e arqueologia", "#8a5a2b", "M12 2 3 7h18zM5 8h14v2H5zM6 11h2.5v7H6zm4.75 0h2.5v7h-2.5zM15.5 11H18v7h-2.5zM4 19h16v3H4z"],
    ["culto", "Culto e cemitérios", "#6d4fa0", "M10.5 2h3v5h5v3h-5v12h-3V10h-5V7h5z"],
    ["educacao", "Educação e cultura", "#d99a00", "M3 5.5C6 4.5 9.5 4.6 12 6.5c2.5-1.9 6-2 9-1V19c-3-1-6.5-.9-9 1-2.5-1.9-6-2-9-1z"],
    ["saude", "Saúde e apoio social", "#d23b3b", "M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z"],
    ["emergencia", "Emergência e segurança", "#c2185b", "M12 2c1 4 6.5 6 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3 1.8-5.2 3-7 .2 2 1 3.2 2.2 3.6C10.5 8 10.4 5 12 2z"],
    ["administracao", "Administração e serviços públicos", "#455a64", "M2 9.5 12 3l10 6.5V21h-7v-6H9v6H2z"],
    ["lazer", "Desporto e lazer", "#2e9e6a", "M5 2h2.5v20H5zM7.5 3H19l-3 4.5 3 4.5H7.5z"],
    ["turismo", "Turismo, alojamento e restauração", "#ef7d22", "M12 2l3 7h7.5l-6 4.6 2.3 7.4L12 16.6 5.2 21l2.3-7.4L1.5 9H9z"],
    ["comercio", "Comércio e serviços", "#78838f", "M5 8h14l1.2 13H3.8zM8.5 8a3.5 3.5 0 0 1 7 0h-2a1.5 1.5 0 0 0-3 0z"],
    ["agro", "Agricultura e produtores", "#7fa62e", "M4 20C4 10 10.5 4 21 4c0 10.5-6 16-17 16z"],
    ["natureza", "Natureza e paisagem", "#3d7f3a", "M12 2 5 12h4l-3.5 5H11v5h2v-5h5.5L15 12h4z"],
    ["infra", "Infra-estruturas e transportes", "#5d6b74", "M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z"],
    ["outro", "Outros", "#9aa38f", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"]
  ];
  var POR = {}; FAM.forEach(function (f) { POR[f[0]] = f; });
  // Regras por ordem: a primeira que bate decide.
  var REGRAS = [
    ["agro", /^(produtor|mercado|feira|loja|cabaz|quinta|horta|agro)|landuse=(farmyard|orchard|vineyard|greenhouse_horticulture)|shop=(farm|greengrocer)|amenity=marketplace|craft=(beekeeper|winery)|place=farm/],
    ["agua", /^(agua|charca|ponto_agua|nascente|poco|furo|acude|barragem)|natural=(water|spring|hot_spring)|man_made=(water_|reservoir|tailings_pond|watermill|storage_tank)|amenity=(fountain|drinking_water|water_point|watering_place)|waterway=|landuse=reservoir/],
    ["emergencia", /^(incendio|vigia|bombeiros|risco)|amenity=(fire_station|police)|emergency=|man_made=(surveillance|tower).*fire|tower:type=fire/],
    ["patrimonio", /^(patrimonio|arqueologia|monumento)|historic=|heritage|tourism=museum|man_made=windmill/],
    ["culto", /amenity=(place_of_worship|grave_yard|monastery)|landuse=cemetery|building=(church|chapel)/],
    ["educacao", /^(escola|educacao)|amenity=(school|kindergarten|library|college|university|arts_centre|theatre|cinema)|tourism=gallery/],
    ["saude", /^(saude|apoio_social)|amenity=(pharmacy|clinic|doctors|hospital|dentist|social_facility|nursing_home|veterinary)|healthcare=/],
    ["administracao", /^(sede|junta|camara|administracao)|amenity=(townhall|post_office|community_centre|courthouse|public_building)|office=government/],
    ["lazer", /^(desporto|lazer|parque)|leisure=|sport=|amenity=(bbq|bench)/],
    ["turismo", /^(turismo|alojamento|restaurante)|tourism=|amenity=(restaurant|cafe|bar|pub|fast_food|shelter)/],
    ["comercio", /^(comercio|servico)|shop=|amenity=(bank|atm|fuel|marketplace|car_wash)|craft=/],
    ["natureza", /^(natureza|habitat|reserva|comedouro|abrigo_fauna|bioregiao|observacao)|natural=|leisure=nature_reserve|boundary=protected_area|tourism=viewpoint/],
    ["infra", /^(infra|transporte)|amenity=(parking|bus_station|toilets|recycling|charging_station|waste)|power=|highway=|railway=|public_transport=|man_made=/]
  ];
  var cacheF = {};
  function familia(tipo) {
    var t = String(tipo || "").toLowerCase().trim(); if (!t) return "outro";
    if (cacheF[t]) return cacheF[t];
    var r = "outro"; for (var i = 0; i < REGRAS.length; i++) if (REGRAS[i][1].test(t)) { r = REGRAS[i][0]; break; }
    return (cacheF[t] = r);
  }
  function icone(f, px) {
    var c = document.createElement("canvas"); c.width = c.height = px; var g = c.getContext("2d"), r = px / 2;
    g.beginPath(); g.arc(r, r, r - 2, 0, Math.PI * 2); g.fillStyle = f[2]; g.fill(); g.lineWidth = Math.max(2, px / 14); g.strokeStyle = "#ffffff"; g.stroke();
    try { g.save(); var e = (px * 0.56) / 24; g.translate(r - 12 * e, r - 12 * e); g.scale(e, e); g.fillStyle = "#ffffff"; g.fill(new Path2D(f[3])); g.restore(); } catch (x) {}
    return g.getImageData(0, 0, px, px);
  }
  function preparar(m) {
    if (!m || !m.hasImage) return;
    FAM.forEach(function (f) { var id = "ipr-s-" + f[0]; if (!m.hasImage(id)) try { m.addImage(id, icone(f, 64), {pixelRatio: 2}); } catch (e) {} });
    if (!m.__iprSimb) { m.__iprSimb = 1; m.on("styleimagemissing", function (e) { var f = POR[String(e.id || "").replace("ipr-s-", "")]; if (f && !m.hasImage(e.id)) try { m.addImage(e.id, icone(f, 64), {pixelRatio: 2}); } catch (x) {} }); }
  }
  function anotar(gj) {
    (gj && gj.features || []).forEach(function (f) { if (!f || !f.geometry || f.geometry.type !== "Point") return; var p = f.properties || (f.properties = {}); if (!p._fam) p._fam = familia(p.tipo || p.categoria || p.type || ""); });
    return gj;
  }
  // Camada de ícones por cima da camada de círculos (que fica a receber os toques).
  function camadaIcones(m, src, id, antes) {
    if (!m || m.getLayer(id)) return;
    preparar(m);
    m.addLayer({id: id, type: "symbol", source: src, filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "_fam"]], layout: {
      "icon-image": ["concat", "ipr-s-", ["get", "_fam"]], "icon-allow-overlap": true, "icon-ignore-placement": true,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.38, 10, 0.55, 13, 0.75, 16, 0.9]}}, antes);
  }
  function cor(id) { return (POR[id] || POR.outro)[2]; }
  function nome(id) { return (POR[id] || POR.outro)[1]; }
  function legenda(gjs) {
    var n = {}; (gjs || []).forEach(function (gj) { (gj && gj.features || []).forEach(function (f) { var k = f && f.properties && f.properties._fam; if (k) n[k] = (n[k] || 0) + 1; }); });
    var ks = FAM.map(function (f) { return f[0]; }).filter(function (k) { return n[k]; }); if (!ks.length) return "";
    return '<div class="ipr-simb">' + ks.map(function (k) { var f = POR[k]; return '<span class="it"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="' + f[2] + '" stroke="#fff" stroke-width="1.5"/><g transform="translate(5.3 5.3) scale(.56)"><path d="' + f[3] + '" fill="#fff"/></g></svg>' + f[1] + ' <small>' + n[k] + "</small></span>"; }).join("") + "</div>";
  }
  try { var st = document.createElement("style"); st.textContent = ".ipr-simb{display:flex;flex-wrap:wrap;gap:4px 10px;margin:6px 0 2px}.ipr-simb .it{display:inline-flex;align-items:center;gap:5px;font-size:12px;line-height:1.3}.ipr-simb small{opacity:.6}"; document.head.appendChild(st); } catch (e) {}
  W.IPR_SIMB = {familias: FAM, familia: familia, preparar: preparar, anotar: anotar, camadaIcones: camadaIcones, cor: cor, nome: nome, legenda: legenda};
})();
