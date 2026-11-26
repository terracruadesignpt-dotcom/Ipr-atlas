/* IPR Atlas · Município de Ovar (dados abertos da câmara). Terracrua Design.
   Nuno, 26/11/2026: «Pá, integra já tudo no Atlas.»
   Uma entrada no topo das camadas, «Município de Ovar · dados da câmara», fechada por omissão, com grupos recolhidos
   (Ordenamento, Condicionantes, Património, Gestão urbanística, Grandes obras, Limites). Cada camada lê-se em directo dos
   serviços públicos ArcGIS da Câmara Municipal de Ovar (services5.arcgis.com/wug0kPCB99MOGUta, GeoJSON WGS84), só quando
   se liga, e fica em memória. Clique numa forma: ficha com os atributos.
   Dados pessoais: os processos de obras e os alvarás de loteamento têm, no serviço, nome, NIF e morada dos requerentes.
   O Atlas pede só os campos técnicos (outFields fechado); esses campos nunca chegam ao navegador.
   Não mexe no viz.js nem no app.js. Mapa: window.__ipe.mapa. API: window.__iprOvar = {ligar(id,bool), ir(), estado()}.
   Desligar: ?ovar=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]ovar=0(&|$)/.test(location.search) || W.__iprOvar) return;
  var B = "https://services5.arcgis.com/wug0kPCB99MOGUta/arcgis/rest/services/";
  var V = "#94BE39";
  var BBOX = [[-8.705, 40.80], [-8.50, 40.985]];
  function en() { return (D.documentElement.lang || "").slice(0, 2) === "en" || /[?&]lang=en/.test(location.search); }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }

  // cor por categoria (Solo urbano, REN, estado da obra)
  function cat(campo, pares, outra) { var e = ["match", ["get", campo]]; pares.forEach(function (p) { e.push(p[0], p[1]); }); e.push(outra); return e; }
  var URB = ["match", ["slice", ["coalesce", ["get", "legenda"], ""], 0, 2],
    "AE", "#8e6fb3", "BD", "#f0c987", "EC", "#c4473a", "EH", "#e3874f", "EV", "#5f9e4a", "UE", "#5b86b8", "#d9a066"];
  var RUS = cat("REFNAME", [["A-P", "#e3d27a"], ["F-P", "#7fae5a"], ["F-C", "#4f8a43"], ["NP-P", "#3f7a6a"], ["NP-R", "#6aa391"], ["EI-E", "#9a9a9a"], ["T", "#c99b6b"]], "#b9c48f");
  var REN = cat("Tipologia", [["Dunas", "#e8d8a0"], ["Praia", "#f2e6b8"], ["Zonas Ameaçadas pelas Cheias", "#4d8fd6"], ["Leitos dos Cursos de Água", "#2f6fb8"],
    ["Áreas de Máxima Infiltração", "#7fb7d9"], ["Áreas com Riscos de Erosão", "#c98a4d"], ["Cabeceiras das Linhas de Água", "#5aa0a8"],
    ["Laguna de Aveiro", "#2a5f9e"], ["Lagoa da Barrinha de Esmoriz", "#2a5f9e"], ["Faixa Marítima", "#1f4f86"]], "#6fa8c9");
  var OBRA = cat("Estado_da_Obra", [["Concluída", "#7d8170"], ["Em Curso", "#e3874f"], ["Em Concurso", "#d9c24a"], ["Em Projecto", "#5b86b8"]], "#cccccc");

  // [id, serviço/camada, rótulo pt, rótulo en, tipo, cor, campos (outFields), campo do título]
  var GR = [
    [t("Ordenamento (PDM em vigor)", "Zoning (PDM in force)"), [
      ["urb", "ORDENAMENTO/FeatureServer/18", "Solo urbano · categorias", "Urban land · categories", "fill", URB, "legenda,Area_ha", "legenda"],
      ["rus", "ORDENAMENTO/FeatureServer/19", "Solo rústico · categorias", "Rural land · categories", "fill", RUS, "REFNAME,Area_ha", "REFNAME"],
      ["pp", "Planos_de_Pormenor/FeatureServer/156", "Planos de pormenor", "Detail plans", "line", "#c4473a", "*", ""],
      ["uopg", "Unidades_Operativas_de_Planeamento_e_Gestão__UOPG_/FeatureServer/159", "UOPG", "Planning units (UOPG)", "line", "#8e6fb3", "*", ""],
      ["geo", "ORDENAMENTO/FeatureServer/16", "Área potencial de recursos geológicos", "Potential mineral resources", "fill", "#a0785a", "*", ""],
      ["rrod", "ORDENAMENTO/FeatureServer/3", "Rede rodoviária (PDM)", "Road network (PDM)", "line", "#d0d0c0", "*", ""],
      ["rprev", "ORDENAMENTO/FeatureServer/4", "Rede viária prevista", "Planned roads", "line", "#e3874f", "*", ""],
      ["alin", "Alinhamentos_Previstos/FeatureServer/0", "Alinhamentos previstos", "Planned alignments", "line", "#f0c987", "*", ""]
    ]],
    [t("Condicionantes", "Constraints"), [
      ["ren", "Reserva_Ecológica_Nacional/FeatureServer/0", "REN · tipologias", "REN (ecological reserve)", "fill", REN, "Tipologia,area_ha", "Tipologia"],
      ["ran", "Reserva_Agrícola_Nacional/FeatureServer/11", "RAN", "RAN (agricultural reserve)", "fill", "#9bbf4a", "OBJECTID", ""],
      ["inund", "Zonas_Inundáveis_em_Perímetro_Urbano/FeatureServer/154", "Zonas inundáveis em perímetro urbano", "Flood zones in urban areas", "fill", "#3f7fd0", "*", ""],
      ["arpsi4", "PTRH_ARPSI/FeatureServer/2686", "Risco de inundação · Vouga (ARPSI)", "Flood risk · Vouga (ARPSI)", "fill", "#2f6fb8", "*", ""],
      ["arpsi3", "PTRH_ARPSI/FeatureServer/2684", "Risco de inundação · costeira (ARPSI)", "Flood risk · coastal (ARPSI)", "fill", "#1f4f86", "*", ""],
      ["galg", "Faixas_de_Proteção_e_Salvaguarda/FeatureServer/7", "Salvaguarda ao galgamento e inundação", "Overtopping and flood safeguard", "fill", "#5aa0d0", "*", ""],
      ["eros", "Faixas_de_Proteção_e_Salvaguarda/FeatureServer/6", "Salvaguarda à erosão costeira", "Coastal erosion safeguard", "fill", "#c98a4d", "*", ""],
      ["salv", "Faixas_de_Proteção_e_Salvaguarda/FeatureServer/9", "Regime de salvaguarda terrestre", "Land safeguard regime", "fill", "#d9b26b", "*", ""],
      ["zprot", "Faixas_de_Proteção_e_Salvaguarda/FeatureServer/10", "Zona terrestre de protecção", "Land protection zone", "fill", "#b5a36a", "*", ""],
      ["frente", "Faixas_de_Proteção_e_Salvaguarda/FeatureServer/8", "Limite da frente urbana", "Urban front limit", "line", "#c4473a", "*", ""],
      ["perig", "Regime_de_Prevenção_de_Acidentes_Graves/FeatureServer/3117", "Acidentes graves · zonas de perigosidade", "Major accidents · hazard zones", "fill", "#d04a3a", "*", ""]
    ]],
    [t("Património", "Heritage"), [
      ["mip", "Planta_de_Ordenamento___Património/FeatureServer/49", "Monumentos de interesse público", "Monuments of public interest", "fill", "#b0413e", "*", ""],
      ["iip", "Planta_de_Ordenamento___Património/FeatureServer/51", "Imóveis de interesse público", "Buildings of public interest", "fill", "#c4473a", "*", ""],
      ["mim", "Planta_de_Ordenamento___Património/FeatureServer/52", "Monumentos de interesse municipal", "Monuments of municipal interest", "fill", "#d46a4a", "*", ""],
      ["iim", "Planta_de_Ordenamento___Património/FeatureServer/53", "Imóveis de interesse municipal", "Buildings of municipal interest", "fill", "#e3874f", "*", ""],
      ["evc", "Planta_de_Ordenamento___Património/FeatureServer/54", "Em vias de classificação", "Pending classification", "fill", "#e0a24f", "*", ""],
      ["zep", "Planta_de_Ordenamento___Património/FeatureServer/60", "Zonas especiais de protecção", "Special protection zones", "line", "#b0413e", "*", ""],
      ["aru", "Planta_de_Ordenamento___Património/FeatureServer/55", "Áreas de reabilitação urbana (ARU)", "Urban rehabilitation areas", "line", "#8e6fb3", "*", ""],
      ["arq", "Planta_de_Ordenamento___Património/FeatureServer/919", "Património arqueológico", "Archaeological heritage", "fill", "#a0785a", "*", ""],
      ["palh", "Planta_de_Ordenamento___Património/FeatureServer/64", "Palheiros", "Palheiros (traditional huts)", "fill", "#c99b6b", "*", ""],
      ["arv", "Planta_de_Ordenamento___Património/FeatureServer/913", "Árvores de interesse público", "Trees of public interest", "circle", "#4f8a43", "*", ""]
    ]],
    [t("Gestão urbanística", "Urban management"), [
      // campos fechados: sem nome, NIF, morada, sítio da obra, registo predial nem artigo matricial
      ["obras", "PObr_LOAD/FeatureServer/3", "Processos de obras", "Building permits", "fill", "#e3874f",
        "TIPO_PROC,ANO_PROC,NUM_PROC,TIPO_PEDIDO,TIPO_USO,TIPO_CONSTRUCAO,FREGUESIA,AREA_TERRENO,AREA_IMPLANT,AREA_BRUTA,N_PISOS,TIPO_ALVARA,DATA_ALVARA", "TIPO_PROC"],
      ["impl", "PObr_LOAD/FeatureServer/2", "Implantações provisórias", "Provisional footprints", "fill", "#f0c987", "TIPO_PROC,ANO_PROC,NUM_PROC,TIPO_USO", "TIPO_PROC"],
      ["lot", "Alvará_de_Loteamento/FeatureServer/4220", "Alvarás de loteamento", "Subdivision permits", "line", "#8e6fb3", "ALVARA_LOT,AREA_TOTAL,NUM_LOTES,Freguesia", "ALVARA_LOT"],
      ["casco", "PObr_LOAD/FeatureServer/161", "Casco histórico", "Historic centre", "line", "#b0413e", "OBJECTID", ""],
      ["omun", "PT_ObrasMun_emcurso/FeatureServer/0", "Obras municipais", "Municipal works", "circle", OBRA,
        "Designação_da_Obra,Estado_da_Obra,Valor_de_Adjudicação,Empresa_Adjudicada,Prazo,Freguesia", "Designação_da_Obra"]
    ]],
    [t("Grandes obras · Linha de Alta Velocidade", "Major works · High-speed rail"), [
      ["lavt", "Linha_de_Alta_Velocidade_entre_Porto_e_Lisboa/FeatureServer/1", "Traçados", "Alignments", "line", "#d04a3a", "*", ""],
      ["lavv", "Linha_de_Alta_Velocidade_entre_Porto_e_Lisboa/FeatureServer/0", "Viadutos", "Viaducts", "line", "#f0c987", "*", ""],
      ["lavtu", "Linha_de_Alta_Velocidade_entre_Porto_e_Lisboa/FeatureServer/4", "Túneis", "Tunnels", "line", "#8e6fb3", "*", ""],
      ["lavr", "Linha_de_Alta_Velocidade_entre_Porto_e_Lisboa/FeatureServer/3", "Restabelecimentos", "Road reinstatements", "line", "#d0d0c0", "*", ""],
      ["lave", "Linha_de_Alta_Velocidade_entre_Porto_e_Lisboa/FeatureServer/6", "Edificado afectado", "Affected buildings", "fill", "#c4473a", "OBJECTID", ""]
    ]],
    [t("Limites", "Boundaries"), [
      ["freg", "Freguesias/FeatureServer/1", "Freguesias", "Parishes", "line", "#e9e6da", "*", ""]
    ]]
  ];
  var IDX = {}; GR.forEach(function (g) { g[1].forEach(function (c) { IDX[c[0]] = c; }); });
  var S = { on: {}, dados: {}, estado: {} };
  var OCULTOS = /^(FID|OBJECTID(_1)?|Shape__Area|Shape__Length|Shape_Leng|SHAPE_STAr|SHAPE_STLe|Shape_STAr|Shape_STLe|GlobalID|created_user|created_date|last_edited_user|last_edited_date|X_COORD|Y_COORD|LINK_INTERNO|Foto|Vídeo_do_Projecto|Visível__Sim_Não_)$/i;

  function url(c, off) {
    return B + c[1] + "/query?where=1%3D1&outFields=" + encodeURIComponent(c[6]) + "&outSR=4326&geometryPrecision=6&f=geojson&resultRecordCount=2000&resultOffset=" + off;
  }
  function carregar(c) {
    if (S.dados[c[0]]) return Promise.resolve(S.dados[c[0]]);
    var todas = [];
    function pag(off) {
      return fetch(url(c, off)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (j) {
        var f = (j && j.features) || []; todas = todas.concat(f);
        S.estado[c[0]] = todas.length + "…"; pintarN(c[0]);
        var mais = j && (j.exceededTransferLimit || (j.properties && j.properties.exceededTransferLimit));
        if (mais && f.length) return pag(off + f.length);
        return { type: "FeatureCollection", features: todas };
      });
    }
    return pag(0).then(function (fc) { S.dados[c[0]] = fc; return fc; });
  }
  function sid(c) { return "ipr-ovar-" + c[0]; }
  function desenhar(c) {
    var I = mapa(), fc = S.dados[c[0]]; if (!I || !fc) return;
    var s = sid(c);
    try {
      if (!I.getSource(s)) I.addSource(s, { type: "geojson", data: fc });
      if (c[4] === "fill") {
        if (!I.getLayer(s + "-f")) I.addLayer({ id: s + "-f", type: "fill", source: s, paint: { "fill-color": c[5], "fill-opacity": 0.45 } });
        if (!I.getLayer(s + "-l")) I.addLayer({ id: s + "-l", type: "line", source: s, paint: { "line-color": c[5], "line-width": 0.8, "line-opacity": 0.9 } });
      } else if (c[4] === "line") {
        if (!I.getLayer(s + "-l")) I.addLayer({ id: s + "-l", type: "line", source: s, paint: { "line-color": c[5], "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 15, 2.6] } });
      } else {
        if (!I.getLayer(s + "-c")) I.addLayer({ id: s + "-c", type: "circle", source: s, paint: { "circle-color": c[5], "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 16, 7], "circle-stroke-color": "#141a10", "circle-stroke-width": 1 } });
      }
    } catch (e) { S.estado[c[0]] = t("erro ao desenhar", "draw error"); }
  }
  function tirar(c) {
    var I = mapa(); if (!I) return; var s = sid(c);
    ["-f", "-l", "-c"].forEach(function (x) { try { if (I.getLayer(s + x)) I.removeLayer(s + x); } catch (e) {} });
    try { if (I.getSource(s)) I.removeSource(s); } catch (e) {}
  }
  function camadasLigadas() {
    var I = mapa(), r = []; if (!I) return r;
    Object.keys(S.on).forEach(function (k) { if (!S.on[k]) return; ["-f", "-l", "-c"].forEach(function (x) { var id = "ipr-ovar-" + k + x; if (I.getLayer(id)) r.push(id); }); });
    return r;
  }
  function ligar(id, v) {
    var c = IDX[id]; if (!c) return;
    S.on[id] = !!v;
    if (!v) { tirar(c); S.estado[id] = ""; pintarN(id); return; }
    S.estado[id] = "…"; pintarN(id);
    carregar(c).then(function () {
      if (!S.on[id]) return;
      desenhar(c); S.estado[id] = String(S.dados[id].features.length); pintarN(id);
    }).catch(function (e) { S.estado[id] = t("sem resposta do serviço", "service did not answer"); pintarN(id); });
  }
  function ir() { var I = mapa(); if (I) try { I.fitBounds(BBOX, { padding: 30, duration: 900 }); } catch (e) {} }

  // ---------- ficha ao clicar ----------
  var popup = null;
  function ficha(e) {
    var I = mapa(); if (!I) return;
    var ls = camadasLigadas(); if (!ls.length) return;
    var f = I.queryRenderedFeatures(e.point, { layers: ls }); if (!f.length) return;
    var x = f[0], k = x.layer.id.replace(/^ipr-ovar-/, "").replace(/-[flc]$/, ""), c = IDX[k]; if (!c) return;
    var p = x.properties || {}, h = '<div style="font:12.5px/1.4 Geist,Inter,system-ui,sans-serif;color:#1d2216;max-width:280px">';
    h += "<b>" + esc(en() ? c[3] : c[2]) + "</b>";
    if (c[7] && p[c[7]]) h += "<div>" + esc(p[c[7]]) + "</div>";
    var linhas = Object.keys(p).filter(function (n) { return n !== c[7] && !OCULTOS.test(n) && p[n] !== "" && p[n] != null && p[n] !== "null"; }).slice(0, 14);
    if (linhas.length) h += '<table style="margin-top:4px;border-collapse:collapse">' + linhas.map(function (n) {
      var v = p[n]; if (/DATA|_date$/i.test(n) && /^\d{11,13}$/.test(String(v))) v = new Date(+v).toLocaleDateString("pt-PT");
      return '<tr><td style="color:#666;padding:1px 8px 1px 0;vertical-align:top">' + esc(n.replace(/_/g, " ")) + "</td><td>" + esc(v) + "</td></tr>";
    }).join("") + "</table>";
    h += '<div style="margin-top:5px;color:#777;font-size:11px">' + t("Fonte: Câmara Municipal de Ovar, dados abertos", "Source: Ovar Municipality, open data") + "</div></div>";
    try { if (popup) popup.remove(); popup = new W.maplibregl.Popup({ closeButton: true, maxWidth: "300px" }).setLngLat(e.lngLat).setHTML(h).addTo(I); } catch (er) {}
  }

  // ---------- painel ----------
  var CSS = "#ipr-ovar{margin:0 0 4px;padding:5px 0;color:#e9e6da;font:13px/1.45 Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;border-bottom:1px solid rgba(233,230,218,.08)}" +
    "#ipr-ovar summary{list-style:none;cursor:pointer;display:flex;align-items:center;font-weight:600;color:#e9e6da;user-select:none}" +
    "#ipr-ovar summary::-webkit-details-marker{display:none}" +
    "#ipr-ovar summary:before{content:'▾';color:" + V + ";margin:0 6px 0 0;display:inline-block;transform:rotate(-90deg);transition:transform .15s}" +
    "#ipr-ovar details[open]>summary:before,#ipr-ovar[open]>summary:before{transform:none}" +
    "#ipr-ovar details{margin:4px 0 2px 14px}#ipr-ovar details>summary{font-weight:600;font-size:12.5px;color:#cfd6bd}" +
    "#ipr-ovar label{display:flex;gap:8px;align-items:flex-start;margin:3px 0 3px 14px;cursor:pointer;color:#e9e6da}" +
    "#ipr-ovar label span{flex:1;min-width:0}#ipr-ovar label em{font-style:normal;color:" + V + ";font-size:11.5px;white-space:nowrap}" +
    "#ipr-ovar input[type=checkbox]{accent-color:" + V + ";margin-top:3px}" +
    "#ipr-ovar small{color:#9a9e8a;display:block;margin:6px 0 0 14px;font-size:11.5px;line-height:1.4}" +
    "#ipr-ovar button.ir{display:block;margin:6px 0 2px 14px;width:calc(100% - 14px);padding:5px 10px;border:1px solid rgba(148,190,57,.45);border-radius:999px;background:transparent;color:#e9e6da;font:600 12px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-ovar button.ir:hover{background:rgba(148,190,57,.14)}" +
    "#ipr-ovar i.sw{flex:0 0 10px;height:10px;margin-top:5px;border-radius:2px;border:1px solid rgba(244,241,230,.4)}";
  function corSimples(c) { return typeof c[5] === "string" ? c[5] : "linear-gradient(135deg,#c4473a,#e3874f,#5f9e4a,#5b86b8)"; }
  function pintarN(id) {
    var el = D.querySelector('#ipr-ovar [data-ovar-n="' + id + '"]'); if (el) el.textContent = S.estado[id] || "";
  }
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-ovar")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("details"); d.id = "ipr-ovar";
    var h = "<summary>" + t("Município de Ovar · dados da câmara", "Ovar Municipality · council data") + "</summary>";
    h += '<button class="ir" data-ovar="ir">' + t("Ir para Ovar", "Go to Ovar") + "</button>";
    GR.forEach(function (g) {
      h += "<details><summary>" + esc(g[0]) + "</summary>";
      g[1].forEach(function (c) {
        h += '<label><input type="checkbox" data-ovar-c="' + c[0] + '"><i class="sw" style="background:' + corSimples(c) + '"></i><span>' + esc(en() ? c[3] : c[2]) +
          '</span><em data-ovar-n="' + c[0] + '"></em></label>';
      });
      h += "</details>";
    });
    h += "<small>" + t("Dados abertos da Câmara Municipal de Ovar (serviços ArcGIS públicos), lidos em directo. Clique numa forma para ver a ficha. Dos processos de obras e loteamentos mostram-se só os dados técnicos, sem nomes, NIF nem moradas.",
      "Ovar Municipality open data (public ArcGIS services), read live. Click a shape for details. Building permits and subdivisions show technical data only, without names, tax numbers or addresses.") + "</small>";
    d.innerHTML = h;
    var pdm = D.getElementById("ipr-pdmc");
    if (pdm && pdm.parentNode === cam) cam.insertBefore(d, pdm.nextSibling); else cam.insertBefore(d, cam.firstChild);
    d.addEventListener("change", function (e) { var x = e.target, id = x.getAttribute && x.getAttribute("data-ovar-c"); if (id) ligar(id, x.checked); });
    d.addEventListener("click", function (e) { var x = e.target.closest ? e.target.closest("[data-ovar=ir]") : null; if (x) { e.preventDefault(); ir(); } });
    return true;
  }
  var preso = false;
  function prender() {
    var I = mapa(); if (!I || preso) return !!preso;
    preso = true;
    I.on("click", ficha);
    I.on("styledata", function () { Object.keys(S.on).forEach(function (k) { if (S.on[k] && S.dados[k] && !I.getSource("ipr-ovar-" + k)) setTimeout(function () { desenhar(IDX[k]); }, 50); }); });
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  // Só aparece em Ovar (Nuno, 26/11/2026, 16h07: aparecia na organização do Atelier do Beco da Bela Vista): mapa sobre o
  // concelho (zoom 9 ou mais), entidade Ovar aberta, ou alguma camada de Ovar ligada.
  function aqui() {
    var I = mapa(); if (!I) return false;
    if (Object.keys(S.on).some(function (k) { return S.on[k]; })) return true;
    var en = W.IPR_ENTIDADE && W.IPR_ENTIDADE.id; if (en && /ovar/i.test(String(en))) return true;
    var c = I.getCenter(), m = 0.05;
    return I.getZoom() >= 9 && c.lng > BBOX[0][0] - m && c.lng < BBOX[1][0] + m && c.lat > BBOX[0][1] - m && c.lat < BBOX[1][1] + m;
  }
  function mostrar() { var d = D.getElementById("ipr-ovar"); if (d) d.style.display = aqui() ? "" : "none"; }
  var presoM = false;
  setInterval(function () { try { bloco(); mostrar(); var I = mapa(); if (I && !presoM) { presoM = true; I.on("moveend", mostrar); } } catch (e) {} }, 1500);
  W.__iprOvar = { ligar: ligar, ir: ir, estado: function () { return { on: S.on, estado: S.estado }; }, catalogo: Object.keys(IDX) };
})();
