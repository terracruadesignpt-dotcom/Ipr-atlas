/* IPR Atlas · Município do Nordeste (São Miguel, Açores): PDM e cartografia do Geoportal da câmara. Terracrua Design.
   26/11/2026: o Presidente da Câmara Municipal de Nordeste autorizou o uso da informação para divulgação (e-mail de
   arquitectura@cmnordeste.pt, 15h32). Regra do Nuno: autorização recebida, ligar o WMS no Atlas e responder.
   Fonte: GeoServer da câmara, sigweb.cmnordeste.pt/geoserver/wms (WMS 1.3.0, EPSG:3857, CORS aberto). Imagens, uma por grupo,
   pedidas só quando se ligam. Painel fechado por omissão, logo a seguir ao de Ovar. Mapa: window.__ipe.mapa.
   API: window.__iprNordeste = {ligar(id,bool), ir()}. Desligar: ?nordeste=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]nordeste=0(&|$)/.test(location.search) || W.__iprNordeste) return;
  var WMS = "https://sigweb.cmnordeste.pt/geoserver/wms";
  var V = "#94BE39";
  var BBOX = [[-25.335, 37.735], [-25.125, 37.875]];
  function en() { return (D.documentElement.lang || "").slice(0, 2) === "en" || /[?&]lang=en/.test(location.search); }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function L(ws, nomes) { return nomes.map(function (n) { return ws + ":" + n; }).join(","); }
  var O = "igv.pdm_ordenamento", C = "igv.pdm_condicionantes", R = "igv.pdm_condicionantes_rer", E = "igv.pdm_estrutura_ecologica", A = "igr.amraa";
  // [id, rótulo pt, rótulo en, camadas WMS]
  var GR = [
    [t("PDM · Ordenamento", "PDM · Zoning"), [
      ["ord", "Classes e categorias de espaço", "Land classes and categories", L(O, ["espacos_agricolas", "espacos_agroflorestais", "espacos_naturais_culturais", "espacos_ocupacao_turistica", "espacos_exploracao_recursos_geologicos", "solos_urbanizados", "solos_urbanizacao_programada", "perimetros_urbanos"])],
      ["uopg", "UOPG e planos de pormenor", "Planning units and detail plans", L(O, ["limite_uopg", "pp_vila_nordeste", "pp_salga", "pooc_costa_sul", "zonas_risco_pooc"])],
      ["redes", "Rede viária e trilhos (PDM)", "Roads and trails (PDM)", L(O, ["rede_viaria_regional", "rede_viaria_municipal", "rede_rural_florestal_agricola", "trilhos_pedestres", "scut"])]
    ]],
    [t("PDM · Condicionantes", "PDM · Constraints"), [
      ["rar", "Reserva Agrícola Regional (RAR)", "Regional Agricultural Reserve (RAR)", L(C, ["rar"])],
      ["rer", "Reserva Ecológica Regional (RER)", "Regional Ecological Reserve (RER)", L(R, ["areas_instabilidade_vertentes", "areas_protecao_recarga_aquiferos", "areas_risco_erosao_hidrica", "arribas_faixas_protecao", "cursos_agua_leitos_margens", "praias"])],
      ["agua", "Domínio hídrico e captações", "Water domain and abstraction", L(C, ["leitos_margens_cursos_agua", "margens_aguas_mar", "captacoes_zonaprotecao_imediata", "captacoes_zona_protecao_intermedia", "captacoes_zona_protecao_alargada", "nascentes_abastecimento", "furos_abastecimento"])],
      ["nat", "Áreas protegidas e perímetro florestal", "Protected areas and forest perimeter", L(C, ["reserva_natural_pico_vara", "zpe_ribeira_guilherme", "perimetro_florestal", "reservas_florestais_recreio", "especies_tronqueira_e_planalto_graminhais", "especies_faial_da_terra", "especies_ponta_arnel"])],
      ["infra", "Infraestruturas e servidões", "Infrastructure and easements", L(C, ["rede_eletrica", "adutoras", "scut_70m", "antenas_transmissao", "pedreiras", "imoveis_interesse_municipal"])]
    ]],
    [t("Estrutura ecológica e riscos", "Ecological structure and hazards"), [
      ["eem", "Estrutura ecológica municipal", "Municipal ecological structure", L(E, ["fundamental", "complementar"])],
      ["eros", "Risco de erosão hídrica", "Water erosion hazard", L(A, ["amraa_riscos_nordeste_erosao_hidrica"])],
      ["mov", "Movimentos de massa", "Landslides", L(A, ["amraa_riscos_nordeste_movimentos_massas"])],
      ["sism", "Risco sísmico", "Seismic hazard", L(A, ["amraa_riscos_nordeste_risco_sismico"])],
      ["vulc", "Risco vulcânico (pliniano e estromboliano)", "Volcanic hazard", L(A, ["amraa_riscos_nordeste_vulcanico_pliniano", "amraa_riscos_nordeste_vulcanico_stromb"])]
    ]],
    [t("Cartografia de base", "Base mapping"), [
      ["orto95", "Ortofotos de 1995 (preto e branco)", "1995 orthophotos (b/w)", "igr.ortos_1995:ortos_1995_mosaico_nordeste_preto_branco"],
      ["uso", "Uso actual do solo (PDM)", "Current land use (PDM)", "igv.pdm_uso_atual_solo:pdm_uso_atual_solo"],
      ["trilhos", "Rotas de caminhada", "Walking routes", "igv.trilhos_nordeste:rotas_caminhada"]
    ]]
  ];
  var IDX = {}; GR.forEach(function (g) { g[1].forEach(function (c) { IDX[c[0]] = c; }); });
  var S = { on: {}, op: 0.75 };
  function sid(id) { return "ipr-nordeste-" + id; }
  function tiles(c) {
    return WMS + "?service=WMS&version=1.3.0&request=GetMap&layers=" + encodeURIComponent(c[3]) +
      "&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true";
  }
  function desenhar(c) {
    var I = mapa(); if (!I) return; var s = sid(c[0]);
    try {
      if (!I.getSource(s)) I.addSource(s, { type: "raster", tiles: [tiles(c)], tileSize: 256, bounds: [-25.40, 37.70, -25.08, 37.90],
        attribution: "Câmara Municipal de Nordeste" });
      if (!I.getLayer(s)) I.addLayer({ id: s, type: "raster", source: s, paint: { "raster-opacity": c[0] === "orto95" ? 1 : S.op } });
    } catch (e) {}
  }
  function tirar(c) {
    var I = mapa(); if (!I) return; var s = sid(c[0]);
    try { if (I.getLayer(s)) I.removeLayer(s); } catch (e) {}
    try { if (I.getSource(s)) I.removeSource(s); } catch (e) {}
  }
  function ligar(id, v) { var c = IDX[id]; if (!c) return; S.on[id] = !!v; if (v) desenhar(c); else tirar(c); }
  function ir() { var I = mapa(); if (I) try { I.fitBounds(BBOX, { padding: 30, duration: 900 }); } catch (e) {} }

  var CSS = "#ipr-nordeste{margin:0 0 4px;padding:5px 0;color:#e9e6da;font:13px/1.45 Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;border-bottom:1px solid rgba(233,230,218,.08)}" +
    "#ipr-nordeste summary{list-style:none;cursor:pointer;display:flex;align-items:center;font-weight:600;color:#e9e6da;user-select:none}" +
    "#ipr-nordeste summary::-webkit-details-marker{display:none}" +
    "#ipr-nordeste summary:before{content:'▾';color:" + V + ";margin:0 6px 0 0;display:inline-block;transform:rotate(-90deg);transition:transform .15s}" +
    "#ipr-nordeste details[open]>summary:before,#ipr-nordeste[open]>summary:before{transform:none}" +
    "#ipr-nordeste details{margin:4px 0 2px 14px}#ipr-nordeste details>summary{font-weight:600;font-size:12.5px;color:#cfd6bd}" +
    "#ipr-nordeste label{display:flex;gap:8px;align-items:flex-start;margin:3px 0 3px 14px;cursor:pointer;color:#e9e6da}" +
    "#ipr-nordeste input[type=checkbox]{accent-color:" + V + ";margin-top:3px}" +
    "#ipr-nordeste .op{display:flex;align-items:center;gap:8px;margin:6px 0 2px 14px;font-size:12px;color:#b9bda8}#ipr-nordeste .op input{flex:1;accent-color:" + V + "}" +
    "#ipr-nordeste small{color:#9a9e8a;display:block;margin:6px 0 0 14px;font-size:11.5px;line-height:1.4}" +
    "#ipr-nordeste button.ir{display:block;margin:6px 0 2px 14px;width:calc(100% - 14px);padding:5px 10px;border:1px solid rgba(148,190,57,.45);border-radius:999px;background:transparent;color:#e9e6da;font:600 12px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-nordeste button.ir:hover{background:rgba(148,190,57,.14)}";
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-nordeste")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("details"); d.id = "ipr-nordeste";
    var h = "<summary>" + t("Município do Nordeste (Açores) · dados da câmara", "Nordeste Municipality (Azores) · council data") + "</summary>";
    h += '<button class="ir" data-nord="ir">' + t("Ir para o Nordeste", "Go to Nordeste") + "</button>";
    GR.forEach(function (g) {
      h += "<details><summary>" + esc(g[0]) + "</summary>";
      g[1].forEach(function (c) { h += '<label><input type="checkbox" data-nord-c="' + c[0] + '"><span>' + esc(en() ? c[2] : c[1]) + "</span></label>"; });
      h += "</details>";
    });
    h += '<div class="op"><span>' + t("Opacidade", "Opacity") + '</span><input type="range" min="0.2" max="1" step="0.05" value="' + S.op + '" data-nord="op"></div>';
    h += "<small>" + t("Fonte: Câmara Municipal de Nordeste, Geoportal municipal (sigweb.cmnordeste.pt). Uso autorizado pelo Presidente da Câmara para divulgação, 26/11/2026. Imagens com as cores e a legenda da câmara.",
      "Source: Nordeste Municipality geoportal (sigweb.cmnordeste.pt). Use authorised by the Mayor for dissemination, 26/11/2026. Images with the council's colours and legend.") + "</small>";
    d.innerHTML = h;
    var ov = D.getElementById("ipr-ovar"), pdm = D.getElementById("ipr-pdmc"), ref = ov || pdm;
    if (ref && ref.parentNode === cam) cam.insertBefore(d, ref.nextSibling); else cam.insertBefore(d, cam.firstChild);
    d.addEventListener("change", function (e) { var x = e.target, id = x.getAttribute && x.getAttribute("data-nord-c"); if (id) ligar(id, x.checked); });
    d.addEventListener("input", function (e) {
      var x = e.target; if (x.getAttribute("data-nord") !== "op") return;
      S.op = parseFloat(x.value) || 0.75; var I = mapa(); if (!I) return;
      Object.keys(S.on).forEach(function (k) { if (S.on[k] && k !== "orto95") try { I.setPaintProperty(sid(k), "raster-opacity", S.op); } catch (er) {} });
    });
    d.addEventListener("click", function (e) { var x = e.target.closest ? e.target.closest("[data-nord=ir]") : null; if (x) { e.preventDefault(); ir(); } });
    return true;
  }
  var preso = false;
  function prender() {
    var I = mapa(); if (!I || preso) return !!preso; preso = true;
    I.on("styledata", function () { Object.keys(S.on).forEach(function (k) { if (S.on[k] && !I.getSource(sid(k))) setTimeout(function () { desenhar(IDX[k]); }, 50); }); });
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  setInterval(function () { try { bloco(); } catch (e) {} }, 3000);
  W.__iprNordeste = { ligar: ligar, ir: ir, catalogo: Object.keys(IDX) };
})();
