/* IPR Atlas · camadas de França (21/10/2026). Grupo próprio na barra de camadas, que só aparece quando o mapa está em
   França (continente e Córsega). Fontes verificadas a 21/10 no navegador (teselas 200 e CORS aberto), todas da
   Géoplateforme do IGN (data.geopf.fr/wmts, TILEMATRIXSET=PM): ortofoto, Plan IGN, relevo LiDAR HD, cadastro (PCI
   Express), RPG, Natura 2000 (SIC e ZPS), ZNIEFF 1 e 2, parques naturais regionais e curvas de nível.
   Zonas inundáveis (Géorisques) ficam de fora até se verificar o serviço (em manutenção a 21/10).
   Não mexe no app.js: usa window.__ipe.mapa. Textos em francês em /fr (IPR_LANG). */
(function () {
  "use strict";
  var FR = (window.IPR_LANG === "fr");
  function t(pt, fr) { return FR ? fr : pt; }
  var ANEL = [-2.121,47.278,-2.354,47.259,-2.513,47.294,-2.549,47.388,-2.457,47.467,-2.491,47.493,-2.556,47.507,-2.777,47.495,-2.817,47.536,-2.768,47.595,-2.79,47.605,-2.968,47.581,-3.073,47.604,-3.166,47.675,-3.267,47.665,-3.334,47.694,-3.448,47.691,-3.516,47.734,-3.904,47.818,-4.069,47.828,-4.226,47.79,-4.321,47.805,-4.391,47.866,-4.441,47.952,-4.686,48.021,-4.699,48.041,-4.637,48.104,-4.516,48.117,-4.387,48.147,-4.366,48.165,-4.556,48.23,-4.596,48.283,-4.588,48.307,-4.533,48.33,-4.403,48.313,-4.298,48.32,-4.397,48.348,-4.724,48.344,-4.767,48.401,-4.781,48.459,-4.732,48.556,-4.537,48.639,-4.061,48.727,-3.856,48.715,-3.719,48.73,-3.555,48.784,-3.477,48.832,-3.234,48.861,-2.993,48.808,-2.781,48.617,-2.691,48.56,-2.448,48.668,-2.077,48.665,-2.009,48.613,-1.907,48.717,-1.841,48.686,-1.815,48.651,-1.447,48.661,-1.495,48.684,-1.584,48.799,-1.603,49.194,-1.707,49.302,-1.888,49.586,-1.895,49.634,-1.867,49.701,-1.589,49.688,-1.365,49.727,-1.252,49.699,-1.239,49.681,-1.245,49.601,-1.214,49.504,-1.13,49.408,-0.958,49.413,-0.764,49.38,-0.518,49.374,-0.164,49.317,-0.018,49.349,0.129,49.42,0.271,49.444,0.12,49.491,0.09,49.552,0.109,49.61,0.178,49.721,0.611,49.882,0.92,49.93,1.238,50.017,1.395,50.104,1.501,50.22,1.559,50.258,1.532,50.293,1.56,50.742,1.593,50.83,1.661,50.902,1.908,51.01,2.441,51.086,2.522,51.117,2.542,51.107,2.555,51.057,2.62,50.963,2.602,50.912,2.613,50.888,2.769,50.768,2.843,50.733,3.018,50.786,3.114,50.798,3.196,50.746,3.252,50.674,3.289,50.545,3.322,50.527,3.605,50.495,3.644,50.467,3.692,50.33,3.746,50.363,3.953,50.356,4.051,50.34,4.186,50.263,4.189,50.218,4.158,50.153,4.212,50.094,4.202,50.044,4.157,49.995,4.181,49.98,4.369,49.965,4.541,49.98,4.641,50.018,4.693,50.112,4.765,50.158,4.824,50.172,4.88,50.14,4.814,49.965,4.86,49.922,4.882,49.808,5.012,49.798,5.132,49.74,5.286,49.697,5.513,49.531,5.792,49.558,5.833,49.524,6.012,49.466,6.177,49.518,6.246,49.514,6.347,49.473,6.464,49.462,6.545,49.412,6.592,49.331,6.745,49.179,6.774,49.175,6.842,49.22,6.891,49.228,7.012,49.197,7.039,49.136,7.119,49.148,7.2,49.134,7.453,49.172,7.535,49.104,7.615,49.081,8.006,49.03,8.141,48.993,8.155,48.977,8.156,48.874,7.854,48.623,7.814,48.54,7.784,48.404,7.724,48.272,7.635,48.147,7.606,48.065,7.628,48.004,7.613,47.903,7.558,47.769,7.55,47.678,7.579,47.624,7.631,47.606,7.632,47.581,7.508,47.531,7.431,47.438,7.347,47.413,7.199,47.413,7.131,47.47,7.058,47.469,6.979,47.436,6.927,47.39,7.015,47.354,7.016,47.309,6.678,47.01,6.468,46.931,6.427,46.745,6.175,46.596,6.083,46.436,6.143,46.383,6.114,46.271,6.046,46.221,5.99,46.201,5.991,46.167,6.009,46.162,6.082,46.167,6.189,46.21,6.245,46.256,6.205,46.314,6.22,46.346,6.314,46.412,6.424,46.45,6.581,46.457,6.762,46.435,6.793,46.417,6.802,46.324,6.837,46.275,6.796,46.17,6.967,46.032,7.041,45.926,6.95,45.851,6.819,45.799,6.811,45.746,6.821,45.725,6.896,45.684,7.028,45.515,7.173,45.4,7.089,45.223,6.988,45.196,6.847,45.116,6.696,45.124,6.65,45.105,6.653,45.079,6.708,45.034,6.755,44.934,6.809,44.902,6.948,44.877,7.012,44.834,7.049,44.709,7.019,44.673,6.973,44.66,6.867,44.512,6.913,44.434,6.897,44.391,6.917,44.348,6.978,44.297,7.324,44.157,7.371,44.148,7.598,44.188,7.654,44.176,7.696,44.076,7.666,44.02,7.504,43.859,7.509,43.755,7.441,43.731,7.404,43.747,7.387,43.714,7.191,43.642,6.875,43.421,6.729,43.357,6.673,43.249,6.579,43.181,6.499,43.15,6.31,43.119,6.117,43.052,6.027,43.081,5.805,43.078,5.664,43.159,5.399,43.21,5.31,43.326,5.113,43.33,5.058,43.354,5.04,43.42,4.916,43.407,4.849,43.375,4.809,43.384,4.794,43.36,4.709,43.354,4.217,43.461,4.152,43.487,4.1,43.547,4.05,43.572,3.921,43.545,3.794,43.444,3.272,43.177,3.071,42.908,3.063,42.839,3.11,42.6,3.215,42.471,3.231,42.432,3.215,42.412,2.969,42.447,2.896,42.437,2.707,42.389,2.685,42.378,2.652,42.32,2.202,42.4,2.038,42.334,1.984,42.339,1.915,42.41,1.693,42.488,1.687,42.51,1.72,42.564,1.7,42.586,1.505,42.622,1.423,42.577,1.338,42.674,1.204,42.694,0.761,42.818,0.684,42.819,0.661,42.695,0.636,42.67,0.254,42.673,0.198,42.699,-0.042,42.669,-0.305,42.806,-0.479,42.779,-0.593,42.78,-0.774,42.921,-0.94,42.93,-1.292,43.041,-1.318,43.07,-1.358,43.022,-1.39,43.013,-1.475,43.038,-1.5,43.076,-1.44,43.159,-1.43,43.227,-1.477,43.248,-1.633,43.263,-1.761,43.306,-1.81,43.363,-1.814,43.411,-1.8,43.426,-1.64,43.457,-1.502,43.575,-1.365,44.025,-1.264,44.567,-1.184,44.676,-1.115,44.699,-1.154,44.737,-1.234,44.65,-1.264,44.661,-1.209,45.166,-1.168,45.349,-1.095,45.547,-1.071,45.55,-0.811,45.394,-0.748,45.323,-0.664,45.098,-0.751,45.376,-0.805,45.454,-0.891,45.521,-1.181,45.669,-1.214,45.706,-1.23,45.77,-1.219,45.789,-1.067,45.774,-1.124,45.921,-1.163,46.293,-1.315,46.307,-1.398,46.331,-1.801,46.501,-1.936,46.671,-2.074,46.797,-2.111,46.858,-2.109,46.927,-2.044,47.036,-2.093,47.094,-2.153,47.109,-2.217,47.163,-2.121,47.278];
  var CORSEGA = [9.5,42.806,9.475,42.661,9.546,42.556,9.57,42.126,9.421,41.92,9.415,41.729,9.392,41.67,9.348,41.616,9.27,41.448,9.181,41.366,8.886,41.498,8.791,41.578,8.813,41.639,8.863,41.687,8.701,41.751,8.7,41.811,8.737,41.873,8.726,41.905,8.604,41.922,8.597,41.967,8.682,42.051,8.681,42.082,8.631,42.101,8.57,42.152,8.549,42.229,8.597,42.275,8.642,42.293,8.616,42.324,8.554,42.342,8.546,42.361,8.625,42.44,8.698,42.563,8.807,42.626,9.033,42.679,9.133,42.752,9.297,42.726,9.317,42.768,9.303,42.813,9.311,42.947,9.354,43.035,9.421,43.041,9.48,42.992,9.5,42.806];
  function noAnel(A, x, y) {
    var d = false, n = A.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = A[2 * i], yi = A[2 * i + 1], xj = A[2 * j], yj = A[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi) d = !d;
    }
    return d;
  }
  function dentro(x, y) { return noAnel(ANEL, x, y) || noAnel(CORSEGA, x, y); }
  function wmts(camada, estilo, fmt) {
    return "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + camada + "&STYLE=" + encodeURIComponent(estilo) +
      "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=" + fmt;
  }
  var LO = "Licence Ouverte 2.0";
  var PN = "MNHN / PatriNat (INPN), " + LO;
  var CAT = [
    { sub: t("Fundo", "Fond"), itens: [
      { id: "fr-ortho", nome: t("Ortofoto (IGN)", "Photographies aériennes (IGN)"), url: wmts("ORTHOIMAGERY.ORTHOPHOTOS", "normal", "image/jpeg"), min: 0, max: 19, op: 1, attr: "© IGN, Géoplateforme" },
      { id: "fr-plan", nome: t("Plan IGN", "Plan IGN"), url: wmts("GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2", "normal", "image/png"), min: 0, max: 19, op: 1, attr: "© IGN, Géoplateforme" },
      { id: "fr-relevo", nome: t("Relevo LiDAR HD", "Relief LiDAR HD"), url: wmts("PLANIGN.LIDAR.TERRAIN", "normal", "image/png"), min: 6, max: 18, op: 0.8, attr: "IGN, LiDAR HD, " + LO }
    ] },
    { sub: t("Propriedade e limites", "Propriété et limites"), itens: [
      { id: "fr-cadastro", nome: t("Cadastro (PCI)", "Cadastre (parcelles)"), url: wmts("CADASTRALPARCELS.PARCELLAIRE_EXPRESS", "PCI vecteur", "image/png"), min: 14, max: 19, op: 0.9, attr: "DGFiP / IGN, PCI Express, " + LO },
      { id: "fr-rpg", nome: t("Parcelas agrícolas (RPG)", "Parcelles agricoles (RPG)"), url: wmts("LANDUSE.AGRICULTURE.LATEST", "normal", "image/png"), min: 11, max: 16, op: 0.7, attr: "ASP / IGN, RPG, " + LO }
    ] },
    { sub: t("Condicionantes", "Contraintes"), itens: [
      { id: "fr-sic", nome: t("Natura 2000, habitats (SIC/ZSC)", "Natura 2000, habitats (SIC/ZSC)"), url: wmts("Patrinat_SIC", "normal", "image/png"), min: 7, max: 16, op: 0.6, attr: PN },
      { id: "fr-zps", nome: t("Natura 2000, aves (ZPS)", "Natura 2000, oiseaux (ZPS)"), url: wmts("Patrinat_ZPS", "normal", "image/png"), min: 7, max: 16, op: 0.6, attr: PN },
      { id: "fr-znieff1", nome: t("ZNIEFF tipo 1", "ZNIEFF de type 1"), url: wmts("Patrinat_ZNIEFF1", "normal", "image/png"), min: 8, max: 16, op: 0.5, attr: PN },
      { id: "fr-znieff2", nome: t("ZNIEFF tipo 2", "ZNIEFF de type 2"), url: wmts("Patrinat_ZNIEFF2", "normal", "image/png"), min: 8, max: 16, op: 0.4, attr: PN },
      { id: "fr-pnr", nome: t("Parques naturais regionais", "Parcs naturels régionaux"), url: wmts("Patrinat_PNR", "normal", "image/png"), min: 6, max: 16, op: 0.4, attr: PN }
    ] },
    { sub: t("Água e relevo", "Eau et relief"), itens: [
      { id: "fr-curvas", nome: t("Curvas de nível (IGN)", "Courbes de niveau (IGN)"), url: wmts("ELEVATION.CONTOUR.LINE", "normal", "image/png"), min: 13, max: 18, op: 0.9, attr: "© IGN, Géoplateforme" }
    ] }
  ];
  var CHAVE = "tcd_atlas_fr";
  var ligados = {};
  try { ligados = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return CAT[g].itens[i]; return null; }
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno/.test(L[i].id)) return L[i].id; return undefined; }
  function ligar(it) {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(it); }, 0); }); return; } /* 22/10: o estilo basta; à espera de «idle» a camada só aparecia depois de todas as teselas */
    try {
      if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.attr, minzoom: 0, maxzoom: it.max });
      if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op } }, antes(I));
    } catch (e) { if (window.console) console.warn("[fr-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    try { if (I.getLayer(it.id)) I.removeLayer(it.id); } catch (e) {}
    try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {}
  }
  var CSS = ".tfr:not(.aberto)>*:not(h4){display:none}.tfr h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important}.tfr h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tfr.aberto h4::before{transform:rotate(90deg)}.tfr.aberto h4{margin:0 0 6px!important}" + ".tfr{margin:8px 0 4px;border:1px solid var(--ln2,#ddd);border-radius:8px;padding:8px 10px;background:var(--p2,transparent)}" +
    ".tfr h4{margin:0 0 6px;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}.tfr h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tfr label{display:flex;gap:7px;align-items:center;font:13px Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tfr small{display:block;margin-top:6px;font-size:11px;color:var(--mu,#777)}";
  function montar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (document.getElementById("tfr")) return true;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("div"); d.id = "tfr"; d.className = "tfr ipr-g"; d.setAttribute("data-g", "fr"); d.hidden = true;
    var h = "<h4>" + t("França", "France") + "</h4>";
    CAT.forEach(function (g) {
      h += "<h5>" + g.sub + "</h5>";
      g.itens.forEach(function (it) { h += '<label><input type="checkbox" data-tfr="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> " + it.nome + "</label>"; });
    });
    h += "<small>" + t("Fontes oficiais francesas (IGN, Géoplateforme). Informação indicativa; a referência vinculativa é a publicada por cada organismo.", "Sources officielles françaises (IGN, Géoplateforme). Information indicative ; la référence opposable est celle publiée par chaque organisme.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tfr]"); if (!c) return;
      var it = itemPor(c.getAttribute("data-tfr")); if (!it) return;
      if (c.checked) { ligados[it.id] = 1; ligar(it); } else { delete ligados[it.id]; desligar(it); }
      guardar();
    });
    return true;
  }
  function verificar() {
    var I = mapa(), d = document.getElementById("tfr"); if (!I || !d || !I.getCenter) return;
    var c = I.getCenter(), em = dentro(c.lng, c.lat);
    if (d.hidden === em) d.hidden = !em;
  }
  function repor() { Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it) ligar(it); }); }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor();
    if (I.on) { I.on("moveend", verificar); I.on("styledata", function () { setTimeout(repor, 0); }); }
  }
  window.__tcdFrCamadas = { dentro: dentro, CAT: CAT };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
