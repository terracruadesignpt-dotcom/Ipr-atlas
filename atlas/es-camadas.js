/* IPR Atlas · camadas de Espanha (21/10/2026). Grupo próprio na barra de camadas, que só aparece quando o mapa está em
   Espanha. Todas as fontes foram verificadas a 21/10 a partir de um navegador (resposta 200 e CORS aberto):
   ortofoto PNOA e mapa IGN Base (WMTS do IGN), Catastro (WMS INSPIRE da DG del Catastro), recintos SIGPAC (MVT do FEGA),
   limites administrativos (WMS do IGN), Rede Natura 2000 (WMS da Agência Europeia do Ambiente; o WMS do MITECO estava
   com erro interno nesse dia), zonas inundáveis T10/T100/T500 (WMS do IDEE), pontos de água (WMS do IGME) e curvas de
   nível (WMS MDT do IDEE). Não mexe no app.js: usa window.__ipe.mapa. Textos em castelhano em /es (IPR_LANG). */
(function () {
  "use strict";
  var ES = (window.IPR_LANG === "es");
  function t(pt, es) { return ES ? es : pt; }
  var ANEL = [-8.79,42.62,-8.83,42.65,-8.86,42.6,-9.04,42.53,-9.09,42.6,-9.05,42.72,-8.98,42.78,-9.11,42.74,-9.15,42.9,-9.19,42.93,-9.27,42.87,-9.29,42.89,-9.3,43.06,-9.17,43.13,-9.23,43.14,-9.23,43.17,-8.97,43.24,-9.0,43.3,-8.83,43.36,-8.69,43.32,-8.39,43.4,-8.36,43.38,-8.33,43.43,-8.22,43.35,-8.2,43.4,-8.35,43.46,-8.33,43.58,-8.07,43.66,-8.07,43.73,-7.91,43.79,-7.83,43.72,-7.68,43.81,-7.61,43.72,-7.54,43.75,-7.36,43.7,-7.26,43.58,-7.04,43.58,-7.02,43.56,-6.07,43.59,-5.92,43.61,-5.85,43.68,-5.67,43.58,-5.42,43.58,-5.4,43.53,-5.3,43.56,-4.48,43.4,-3.77,43.5,-3.75,43.47,-3.58,43.54,-3.42,43.49,-3.46,43.43,-3.04,43.35,-3.04,43.39,-2.95,43.45,-2.77,43.47,-2.69,43.4,-2.66,43.43,-2.13,43.31,-1.79,43.41,-1.73,43.31,-1.39,43.26,-1.46,43.08,-1.45,43.06,-1.38,43.06,-1.36,43.11,-1.28,43.13,-1.28,43.08,-1.14,43.02,-0.75,42.96,-0.72,42.9,-0.57,42.79,-0.32,42.86,-0.23,42.81,-0.15,42.81,-0.11,42.73,-0.04,42.71,0.17,42.75,0.27,42.69,0.35,42.74,0.62,42.71,0.64,42.85,0.81,42.85,1.1,42.79,1.16,42.73,1.35,42.72,1.45,42.6,1.43,42.54,1.47,42.51,1.44,42.48,1.46,42.46,1.71,42.52,1.94,42.45,2.02,42.37,2.28,42.45,2.53,42.35,2.63,42.36,2.63,42.38,2.68,42.42,2.93,42.49,3.19,42.45,3.21,42.37,3.34,42.32,3.27,42.22,3.14,42.21,3.25,41.94,3.16,41.83,2.94,41.69,2.31,41.45,2.14,41.28,1.03,41.03,0.73,40.8,0.89,40.74,0.87,40.67,0.68,40.55,0.57,40.57,0.37,40.27,-0.08,39.83,-0.3,39.51,-0.28,39.33,-0.11,38.97,0.16,38.85,0.26,38.74,0.09,38.61,-0.03,38.59,-0.06,38.52,-0.32,38.45,-0.4,38.35,-0.49,38.32,-0.49,38.2,-0.61,38.15,-0.64,37.98,-0.7,37.93,-0.75,37.78,-0.79,37.79,-0.83,37.74,-0.69,37.63,-0.69,37.6,-0.92,37.54,-1.08,37.56,-1.11,37.51,-1.32,37.54,-1.49,37.41,-1.66,37.35,-1.79,37.2,-1.88,36.93,-1.98,36.88,-2.12,36.72,-2.37,36.82,-2.55,36.8,-2.6,36.71,-2.72,36.66,-2.94,36.73,-3.32,36.73,-3.41,36.68,-3.84,36.73,-4.39,36.7,-4.51,36.56,-4.65,36.49,-4.91,36.48,-5.16,36.4,-5.32,36.13,-5.41,36.15,-5.42,36.05,-5.61,35.99,-5.92,36.16,-6.05,36.18,-6.33,36.52,-6.31,36.55,-6.25,36.51,-6.3,36.59,-6.41,36.63,-6.46,36.75,-6.4,36.79,-6.51,36.94,-6.91,37.16,-7.1,37.2,-7.43,37.18,-7.53,37.6,-7.32,37.86,-7.29,37.99,-7.13,38.06,-7.04,38.04,-6.98,38.17,-7.12,38.16,-7.38,38.45,-7.29,38.62,-7.29,38.74,-7.07,38.87,-7.0,39.02,-7.03,39.08,-7.17,39.09,-7.19,39.16,-7.27,39.2,-7.27,39.26,-7.35,39.34,-7.33,39.45,-7.48,39.54,-7.58,39.69,-7.04,39.71,-6.91,40.01,-7.06,40.19,-6.82,40.36,-6.88,40.44,-6.84,40.51,-6.87,40.57,-6.84,40.85,-6.96,41.02,-6.83,41.07,-6.66,41.28,-6.5,41.31,-6.33,41.43,-6.23,41.56,-6.37,41.64,-6.56,41.64,-6.6,41.74,-6.55,41.86,-6.61,41.94,-6.73,41.91,-6.82,41.96,-6.85,41.92,-7.05,41.92,-7.15,41.96,-7.21,41.86,-7.44,41.79,-7.49,41.83,-7.61,41.81,-7.63,41.86,-7.72,41.88,-7.9,41.84,-7.92,41.88,-8.04,41.8,-8.19,41.79,-8.25,41.91,-8.13,42.03,-8.22,42.06,-8.24,42.13,-8.62,42.03,-8.89,41.87,-8.91,42.13,-8.72,42.29,-8.88,42.24,-8.85,42.35,-8.8,42.38,-8.96,42.47,-8.88,42.52,-8.84,42.5,-8.84,42.58,-8.79,42.62];
  function dentro(x, y) {
    var dentro = false, n = ANEL.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = ANEL[2 * i], yi = ANEL[2 * i + 1], xj = ANEL[2 * j], yj = ANEL[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi) dentro = !dentro;
    }
    return dentro || (x >= 1.1 && x <= 4.4 && y >= 38.6 && y <= 40.2); // Baleares
  }
  function wms(base, camada, extra, fmt) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + encodeURIComponent(camada) +
      "&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=" + (fmt || "image/png") + (fmt ? "" : "&TRANSPARENT=true") + (extra || "");
  }
  var HIST = "https://www.ign.es/wms/pnoa-historico", MIT = "https://wms.mapama.gob.es/sig/Biodiversidad/";
  function wmts(base, camada, fmt) {
    return base + "?layer=" + camada + "&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=" +
      fmt + "&TileMatrix={z}&TileCol={x}&TileRow={y}";
  }
  var IGN = "CC BY 4.0 scne.es";
  /* 14/11/2026 (Nuno: «quero mais camadas em Espanha [...] Copernicus e aquelas coisas todas europeias avançadas»). Fontes
     testadas a 14/11 a partir do servidor do site (POST /tcd/v1/viz/diag): resposta 200, imagem e CORS aberto para
     terracruadesign.pt. Mesma regra de níveis de Portugal: ocupação do solo, água, floresta e solo/geologia são do
     Intelligence (no Explorer aparecem trancadas). */
  var EXPL = window.IPR_NIVEL === "explorer";
  var GL = "https://image.discomap.eea.europa.eu/arcgis/rest/services/GioLandPublic/", CLMS = "Copernicus Land Monitoring Service (EEA)";
  function img(svc) { return GL + svc + "/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image"; }
  function msx(base) { return base + "/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&dpi=96&f=image"; }
  var IGME = "https://mapas.igme.es/gis/services/";
  /* 17/11/2026 (Nuno: «avança com todas as camadas que sugeriste»). Camadas novas, ver espanha/diagnostico-camadas-fontes-
     2026-11-17 no projecto. Testes a 17/11 a partir do navegador em terracruadesign.pt/es/atlas: IGN geofísica, Caminho de
     Santiago, CartoCiudad, SoilGrids (ISRIC), urbanismo de Castilla y León e zonas ripárias da Copernicus deram imagem com
     CORS. O servidor WMS do MITECO (wms.mapama.gob.es) devolvia «Referencia a objeto no establecida» em todos os serviços:
     as camadas do MITECO levam sonda e só aparecem quando o serviço volta. A REDIAM (Andaluzia) não tem CORS e vai pelo
     proxy do site (m14554). O ICGC (Catalunha) respondia ao GetCapabilities mas os mapas eram lentos: leva sonda. A IDE de
     Extremadura tem o certificado com outro nome (falha SSL) e ficou de fora. */
  var MA = "https://wms.mapama.gob.es/sig/", PX = location.origin + "/wp-json/tcd/v1/viz/px?u=";
  function px(raw) { return PX + encodeURIComponent(raw.replace("{bbox-epsg-3857}", "__BBOX__")) + "&bbox={bbox-epsg-3857}&ttl=604800"; }
  function isric(prop, camada) { return wms("https://maps.isric.org/mapserv?map=/map/" + prop + ".map", camada); }
  var R_CYL = [-7.1, 40.05, -1.75, 43.25], R_CAT = [0.15, 40.5, 3.35, 42.9], R_AND = [-7.55, 35.9, -1.6, 38.75];
  var ISRIC = "SoilGrids 2.0, ISRIC CC BY 4.0", MITA = "MITECO CC BY 4.0";
  var CAT = [
    { sub: t("Fundo", "Fondo"), itens: [
      { id: "es-pnoa", nome: t("Ortofoto PNOA (IGN)", "Ortofoto PNOA (IGN)"), tipo: "raster", fundo: 1, url: wmts("https://www.ign.es/wmts/pnoa-ma", "OI.OrthoimageCoverage", "image/jpeg"), min: 0, max: 20, op: 1, attr: "PNOA " + IGN },
      { id: "es-ignbase", nome: t("Mapa IGN Base", "Mapa IGN Base"), tipo: "raster", fundo: 1, url: wmts("https://www.ign.es/wmts/ign-base", "IGNBaseTodo", "image/png"), min: 0, max: 18, op: 1, attr: "IGN Base " + IGN }
    ] },
    { sub: t("Propriedade e limites", "Propiedad y límites"), itens: [
      { id: "es-catastro", nome: t("Cadastro (Catastro)", "Catastro (parcelas)"), tipo: "raster", url: wmws("https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx", "CP.CadastralParcel"), min: 15, max: 22, op: 0.9, attr: "Fuente: Dirección General del Catastro" },
      { id: "es-sigpac", nome: t("Recintos SIGPAC (uso agrícola)", "Recintos SIGPAC (uso agrícola)"), tipo: "sigpac", min: 13, max: 22, attr: "Fuente: SIGPAC - FEGA" },
      /* 17/11/2026: planeamento urbanístico do SIU (Ministerio de Vivienda), classes de solo; ArcGIS REST testado a 17/11 a
         partir do navegador (200, imagem, CORS). É um mosaico nacional simplificado: o plano vigente de cada município
         está no seu ayuntamiento ou no serviço da comunidade autónoma. */
      { id: "es-siu", nome: t("Classes de solo do planeamento (SIU)", "Clases de suelo del planeamiento (SIU)"), tipo: "raster", url: msx("https://mapas.fomento.gob.es/arcgis/rest/services/SIU/CLASES_DE_SUELO/MapServer"), min: 9, max: 22, op: 0.6, attr: "SIU - Ministerio de Vivienda y Agenda Urbana" },
      { id: "es-limites", nome: t("Limites administrativos", "Límites administrativos"), tipo: "raster", url: wms("https://www.ign.es/wms-inspire/unidades-administrativas", "AU.AdministrativeBoundary"), min: 6, max: 22, op: 0.9, attr: "Límites " + IGN }
    ] },
    { sub: t("Condicionantes", "Condicionantes"), itens: [
      { id: "es-natura", nome: t("Rede Natura 2000", "Red Natura 2000"), tipo: "raster", url: wms("https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WMSServer", "0,1,2"), min: 7, max: 22, op: 0.6, attr: "Natura 2000 © EEA" },
      /* 17/11/2026: espaços naturais protegidos nacionais e autonómicos (base CDDA da Agência Europeia do Ambiente, que
         recebe os ENP do MITECO). O WMS do MITECO para ENP, montes, vias pecuárias e Mapa Florestal devolvia erro interno
         a 17/11 (ConstruirServiceArcGISBaseUrl); as três camadas só do MITECO levam «sonda»: antes de as pôr no mapa
         pergunta-se ao serviço se está a responder e, se não estiver, avisa-se em vez de mostrar um mapa vazio. */
      { id: "es-enp", nome: t("Espaços naturais protegidos (ENP)", "Espacios naturales protegidos (ENP)"), tipo: "raster", url: wms("https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/CDDA_Dyna_WM/MapServer/WMSServer", "0,1,2,3,4"), min: 6, max: 22, op: 0.6, attr: "CDDA © EEA, MITECO" },
      { id: "es-montes", nome: t("Montes de utilidade pública (MITECO)", "Montes de utilidad pública (MITECO)"), tipo: "raster", sonda: MIT + "PropiedadMontes_UP/wms.aspx", url: wms(MIT + "PropiedadMontes_UP/wms.aspx", "PS.ProtectedSite"), min: 8, max: 22, op: 0.6, attr: "MITECO CC BY 4.0" },
      { id: "es-vp", nome: t("Vias pecuárias (MITECO)", "Vías pecuarias (MITECO)"), tipo: "raster", sonda: MIT + "ViasPecuarias", url: wms(MIT + "ViasPecuarias", "TN.RoadTransportNetwork.RoadLink"), min: 9, max: 22, op: 0.9, attr: "MITECO CC BY 4.0" },
      { id: "es-inund10", nome: t("Zona inundável T10", "Zona inundable T10"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT10"), min: 9, max: 22, op: 0.6, attr: "SNCZI - MITECO" },
      { id: "es-inund100", nome: t("Zona inundável T100", "Zona inundable T100"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT100"), min: 9, max: 22, op: 0.6, attr: "SNCZI - MITECO" },
      { id: "es-inund500", nome: t("Zona inundável T500", "Zona inundable T500"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones", "NZ.Flood.FluvialT500"), min: 9, max: 22, op: 0.5, attr: "SNCZI - MITECO" },
      { id: "es-dph", nome: t("Domínio público hídrico, servidão e polícia (MITECO)", "Dominio público hidráulico, servidumbre y policía (MITECO)"), tipo: "raster", sonda: MA + "Agua/DPHCartografico/wms.aspx", url: wms(MA + "Agua/DPHCartografico/wms.aspx", "DPHCartografico"), min: 11, max: 22, op: 0.7, attr: "SNCZI, " + MITA },
      { id: "es-dphd", nome: t("Domínio público hídrico deslindado (MITECO)", "Dominio público hidráulico deslindado (MITECO)"), tipo: "raster", sonda: MA + "agua/DPHDeslindado/wms.aspx", url: wms(MA + "agua/DPHDeslindado/wms.aspx", "DPHDeslindado"), min: 11, max: 22, op: 0.8, attr: "SNCZI, " + MITA },
      { id: "es-dpmt", nome: t("Domínio público marítimo-terrestre (Costas)", "Dominio público marítimo-terrestre (Costas)"), tipo: "raster", sonda: MA + "Costas/DPMT/wms.aspx", url: wms(MA + "Costas/DPMT/wms.aspx", "DPMT"), min: 11, max: 22, op: 0.9, attr: "Costas, " + MITA },
      { id: "es-nitratos", nome: t("Zonas vulneráveis a nitratos 2024", "Zonas vulnerables a nitratos 2024"), tipo: "raster", sonda: MA + "Agua/ZonasVulnerables/2024", url: wms(MA + "Agua/ZonasVulnerables/2024", "AM.NitrateVulnerableZone"), min: 7, max: 22, op: 0.55, attr: MITA },
      { id: "es-fv", nome: t("Sensibilidade ambiental para fotovoltaica", "Sensibilidad ambiental para fotovoltaica"), tipo: "raster", wmts: "https://wmts.mapama.gob.es/sig/evaluacionambiental/ea_clasificacion_energia_fotovoltaica", url: "", min: 7, max: 22, op: 0.6, attr: "Evaluación ambiental, " + MITA },
      { id: "es-eolica", nome: t("Sensibilidade ambiental para eólica", "Sensibilidad ambiental para eólica"), tipo: "raster", wmts: "https://wmts.mapama.gob.es/sig/evaluacionambiental/ea_clasificacion_energia_eolica", url: "", min: 7, max: 22, op: 0.6, attr: "Evaluación ambiental, " + MITA }
    ] },
    { sub: t("Riscos", "Riesgos"), itens: [
      { id: "es-sismo", nome: t("Perigosidade sísmica, aceleração 475 anos (IGN)", "Peligrosidad sísmica, aceleración 475 años (IGN)"), tipo: "raster", url: wms("https://www.ign.es/wms-inspire/geofisica", "HazardArea2015.PGA475_c"), min: 5, max: 22, op: 0.55, attr: "Peligrosidad sísmica 2015 " + IGN },
      { id: "es-sismos", nome: t("Sismos do último ano (IGN)", "Terremotos del último año (IGN)"), tipo: "raster", url: wms("https://www.ign.es/wms-inspire/geofisica", "Ultimos365dias"), min: 5, max: 22, op: 1, attr: "Red Sísmica Nacional " + IGN },
      { id: "es-inesl", nome: t("Erosão laminar e em regueiros (INES)", "Erosión laminar y en regueros (INES)"), tipo: "raster", sonda: MIT + "INESErosionLaminarRaster/wms.aspx", url: wms(MIT + "INESErosionLaminarRaster/wms.aspx", "NZ.HazardArea"), min: 8, max: 22, op: 0.6, attr: "INES, " + MITA, intel: 1 },
      { id: "es-inesm", nome: t("Movimentos em massa (INES)", "Movimientos en masa (INES)"), tipo: "raster", sonda: MIT + "INESMovimientosMasa/wms.aspx", url: wms(MIT + "INESMovimientosMasa/wms.aspx", "NZ.HazardArea"), min: 8, max: 22, op: 0.6, attr: "INES, " + MITA, intel: 1 },
      { id: "es-ardidas", nome: t("Áreas ardidas (EFFIS, Copernicus)", "Áreas quemadas (EFFIS, Copernicus)"), tipo: "raster", url: wms("https://maps.effis.emergency.copernicus.eu/effis", "modis.ba.poly"), min: 6, max: 22, op: 0.8, attr: "EFFIS, Copernicus Emergency Management Service" },
      { id: "es-inese", nome: t("Erosão eólica (INES)", "Erosión eólica (INES)"), tipo: "raster", sonda: MIT + "INESErosionEolica/wms.aspx", url: wms(MIT + "INESErosionEolica/wms.aspx", "NZ.HazardArea"), min: 8, max: 22, op: 0.6, attr: "INES, " + MITA, intel: 1 }
    ] },
    { sub: t("Água e relevo", "Agua y relieve"), itens: [
      { id: "es-pontosagua", nome: t("Pontos de água (IGME)", "Puntos de agua (IGME)"), tipo: "raster", url: wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_PuntosAgua/MapServer/WMSServer", "0,1"), min: 10, max: 22, op: 1, attr: "IGME-CSIC CC BY 4.0" },
      { id: "es-curvas", nome: t("Curvas de nível (IGN)", "Curvas de nivel (IGN)"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/mdt", "EL.ContourLine"), min: 13, max: 22, op: 0.9, attr: "MDT " + IGN },
      { id: "es-masas", nome: t("Massas de água (IGN)", "Masas de agua (IGN)"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/hidrografia", "HY.PhysicalWaters.Waterbodies"), min: 8, max: 22, op: 0.9, attr: "Hidrografía " + IGN },
      { id: "es-eudem", nome: t("Relevo europeu (EU-DEM)", "Relieve europeo (EU-DEM)"), tipo: "raster", url: msx(GL + "DEM/MapServer"), min: 5, max: 22, op: 0.6, attr: "EU-DEM, " + CLMS },
      { id: "es-hrlagua", nome: t("Água e zonas húmidas 2018 (Copernicus)", "Agua y zonas húmedas 2018 (Copernicus)"), tipo: "raster", url: img("HRL_WaterWetness_2018"), min: 8, max: 22, op: 0.8, attr: CLMS, intel: 1 }
    ] },
    { sub: t("Ocupação do solo e floresta", "Ocupación del suelo y bosque"), itens: [
      { id: "es-siose", nome: t("Ocupação do solo SIOSE (IGN)", "Ocupación del suelo SIOSE (IGN)"), tipo: "raster", url: wms("https://servicios.idee.es/wms-inspire/ocupacion-suelo", "LC.LandCoverSurfaces"), min: 11, max: 22, op: 0.65, attr: "SIOSE " + IGN, intel: 1 },
      { id: "es-clc", nome: t("CORINE Land Cover 2018", "CORINE Land Cover 2018"), tipo: "raster", url: msx("https://image.discomap.eea.europa.eu/arcgis/rest/services/Corine/CLC2018_WM/MapServer"), min: 6, max: 22, op: 0.55, attr: "CORINE 2018, " + CLMS, intel: 1 },
      { id: "es-mfe", nome: t("Mapa Florestal de Espanha (MITECO)", "Mapa Forestal de España (MITECO)"), tipo: "raster", sonda: MIT + "MFE/wms.aspx", url: wms(MIT + "MFE/wms.aspx", "LC.LandCoverSurfaces"), min: 9, max: 22, op: 0.6, attr: "MFE, MITECO CC BY 4.0", intel: 1 },
      { id: "es-copa", nome: t("Densidade de copa 2018 (Copernicus)", "Densidad de copa 2018 (Copernicus)"), tipo: "raster", url: img("HRL_TreeCoverDensity_2018"), min: 8, max: 22, op: 0.7, attr: CLMS, intel: 1 },
      { id: "es-folha", nome: t("Folhosas e resinosas 2018 (Copernicus)", "Frondosas y coníferas 2018 (Copernicus)"), tipo: "raster", url: img("HRL_DominantLeafType2018"), min: 8, max: 22, op: 0.7, attr: CLMS, intel: 1 },
      { id: "es-floresta", nome: t("Tipo de floresta 2018 (Copernicus)", "Tipo de bosque 2018 (Copernicus)"), tipo: "raster", url: img("HRL_ForestType_2018"), min: 8, max: 22, op: 0.7, attr: CLMS, intel: 1 },
      { id: "es-copamud", nome: t("Perda e ganho de copa 2015 a 2018 (Copernicus)", "Cambio de copa 2015 a 2018 (Copernicus)"), tipo: "raster", url: img("HRL_TreeCoverChangeMask_15_18"), min: 8, max: 22, op: 0.85, attr: CLMS, intel: 1 },
      { id: "es-sebes", nome: t("Sebes e árvores isoladas 2021, 5 m (Copernicus)", "Setos y árboles aislados 2021, 5 m (Copernicus)"), tipo: "raster", url: img("HRL_SmallWoodyFeatures_2021_005m"), min: 12, max: 22, op: 0.85, attr: CLMS, intel: 1 },
      { id: "es-sebesd", nome: t("Densidade de sebes 2021 (Copernicus)", "Densidad de setos 2021 (Copernicus)"), tipo: "raster", url: img("HRL_SmallWoodyFeaturesDensity_2021_100m"), min: 7, max: 22, op: 0.7, attr: CLMS, intel: 1 },
      { id: "es-imperm", nome: t("Solo impermeabilizado 2018 (Copernicus)", "Suelo sellado 2018 (Copernicus)"), tipo: "raster", url: img("HRL_ImperviousnessDensity_2018"), min: 8, max: 22, op: 0.75, attr: CLMS, intel: 1 },
      { id: "es-edif", nome: t("Área edificada 2018 (Copernicus)", "Área edificada 2018 (Copernicus)"), tipo: "raster", url: img("HRL_BuiltUp_2018"), min: 9, max: 22, op: 0.8, attr: CLMS, intel: 1 }
    ] },
    { sub: t("Ecologia e paisagem", "Ecología y paisaje"), itens: [
      { id: "es-hic", nome: t("Habitats de interesse comunitário 2013-2018", "Hábitats de interés comunitario 2013-2018"), tipo: "raster", sonda: MIT + "HabitatArt17/2013-2018/wms.aspx", url: wms(MIT + "HabitatArt17/2013-2018/wms.aspx", "HB.Habitat"), min: 7, max: 22, op: 0.6, attr: "Art. 17 Directiva Hábitats, " + MITA, intel: 1 },
      { id: "es-mab", nome: t("Reservas da Biosfera (UNESCO)", "Reservas de la Biosfera (UNESCO)"), tipo: "raster", sonda: MIT + "MAB", url: wms(MIT + "MAB", "PS.ProtectedSite"), min: 5, max: 22, op: 0.5, attr: "MaB, " + MITA },
      { id: "es-paisagem", nome: t("Atlas das Paisagens de Espanha", "Atlas de los Paisajes de España"), tipo: "raster", sonda: MIT + "Paisaje/wms.aspx", url: wms(MIT + "Paisaje/wms.aspx", "LC.LandCoverSurfaces"), min: 6, max: 22, op: 0.55, attr: MITA, intel: 1 },
      { id: "es-ripar", nome: t("Zonas ripárias, uso do solo (Copernicus)", "Zonas de ribera, uso del suelo (Copernicus)"), tipo: "raster", url: msx("https://image.discomap.eea.europa.eu/arcgis/rest/services/RiparianZones/LCLU/MapServer"), min: 10, max: 22, op: 0.7, attr: "Riparian Zones, " + CLMS, intel: 1 }
    ] },
    { sub: t("Solo e geologia", "Suelo y geología"), itens: [
      { id: "es-magna", nome: t("Geologia MAGNA 1:50 000 (IGME)", "Geología MAGNA 1:50.000 (IGME)"), tipo: "raster", url: wms(IGME + "Cartografia_Geologica/IGME_MAGNA_50/MapServer/WMSServer", "0"), min: 10, max: 22, op: 0.65, attr: "IGME-CSIC CC BY 4.0", intel: 1 },
      { id: "es-geode", nome: t("Geologia contínua GEODE 1:50 000 (IGME)", "Geología continua GEODE 1:50.000 (IGME)"), tipo: "raster", url: wms(IGME + "Cartografia_Geologica/IGME_Geode_50/MapServer/WMSServer", "0"), min: 9, max: 22, op: 0.65, attr: "IGME-CSIC CC BY 4.0", intel: 1 },
      { id: "es-perm", nome: t("Permeabilidade 1:200 000 (IGME)", "Permeabilidad 1:200.000 (IGME)"), tipo: "raster", url: wms(IGME + "Cartografia_Tematica/IGME_Permeabilidad_200/MapServer/WMSServer", "0"), min: 7, max: 22, op: 0.65, attr: "IGME-CSIC CC BY 4.0", intel: 1 },
      { id: "es-ph", nome: t("pH do solo, 0-5 cm (SoilGrids)", "pH del suelo, 0-5 cm (SoilGrids)"), tipo: "raster", url: isric("phh2o", "phh2o_0-5cm_mean"), min: 5, max: 22, op: 0.6, attr: ISRIC, intel: 1 },
      { id: "es-soc", nome: t("Carbono orgânico do solo, 0-5 cm (SoilGrids)", "Carbono orgánico del suelo, 0-5 cm (SoilGrids)"), tipo: "raster", url: isric("soc", "soc_0-5cm_mean"), min: 5, max: 22, op: 0.6, attr: ISRIC, intel: 1 },
      { id: "es-argila", nome: t("Argila, 0-5 cm (SoilGrids)", "Arcilla, 0-5 cm (SoilGrids)"), tipo: "raster", url: isric("clay", "clay_0-5cm_mean"), min: 5, max: 22, op: 0.6, attr: ISRIC, intel: 1 }
    ] },
    { sub: t("Referências", "Referencias"), itens: [
      { id: "es-camino", nome: t("Caminhos de Santiago (IGN)", "Caminos de Santiago (IGN)"), tipo: "raster", url: wms("https://www.ign.es/wms-inspire/camino-santiago", "camino_frances,caminos_galicia,caminos_norte,caminos_andaluces,caminos_centro,caminos_este,caminos_nordeste,caminos_sureste,caminos_insulares,caminos_portugueses"), min: 6, max: 22, op: 1, attr: "Camino de Santiago " + IGN },
      { id: "es-cp", nome: t("Códigos postais (CartoCiudad)", "Códigos postales (CartoCiudad)"), tipo: "raster", url: wms("https://www.cartociudad.es/wms-inspire/direcciones-ccpp", "codigo-postal"), min: 9, max: 22, op: 0.8, attr: "CartoCiudad " + IGN }
    ] },
    /* Camadas regionais: cada uma só aparece na lista quando o centro do mapa está dentro da comunidade autónoma. */
    { sub: t("Regional", "Autonómico"), itens: [
      { id: "es-cyl-clas", reg: R_CYL, nome: t("Castilla y León: classificação do solo (planeamento)", "Castilla y León: clasificación del suelo (planeamiento)"), tipo: "raster", url: wms("https://idecyl.jcyl.es/geoserver/urbanismo/wms", "plau_cyl_clasificacion"), min: 10, max: 22, op: 0.6, attr: "PLAU, Junta de Castilla y León" },
      { id: "es-cyl-cat", reg: R_CYL, nome: t("Castilla y León: categorias do solo", "Castilla y León: categorías del suelo"), tipo: "raster", url: wms("https://idecyl.jcyl.es/geoserver/urbanismo/wms", "plau_cyl_categorias_desagrupa"), min: 11, max: 22, op: 0.6, attr: "PLAU, Junta de Castilla y León" },
      { id: "es-cat-sols", reg: R_CAT, nome: t("Catalunha: solos, classificação WRB (ICGC)", "Cataluña: suelos, clasificación WRB (ICGC)"), tipo: "raster", sonda: "https://geoserveis.icgc.cat/servei/catalunya/edafologia/wms", url: wms("https://geoserveis.icgc.cat/servei/catalunya/edafologia/wms", "11_WRB_PA"), min: 9, max: 22, op: 0.6, attr: "ICGC CC BY 4.0", intel: 1 },
      { id: "es-cat-agro", reg: R_CAT, nome: t("Catalunha: capacidade agrológica (ICGC)", "Cataluña: capacidad agrológica (ICGC)"), tipo: "raster", sonda: "https://geoserveis.icgc.cat/servei/catalunya/capacitat-agrologica/wms", url: wms("https://geoserveis.icgc.cat/servei/catalunya/capacitat-agrologica/wms", "capacitat-agrologica"), min: 9, max: 22, op: 0.6, attr: "ICGC CC BY 4.0", intel: 1 },
      { id: "es-cat-cob", reg: R_CAT, nome: t("Catalunha: coberturas do solo 2023 (ICGC)", "Cataluña: cubiertas del suelo 2023 (ICGC)"), tipo: "raster", sonda: "https://geoserveis.icgc.cat/servei/catalunya/cobertes-sol/wms", url: wms("https://geoserveis.icgc.cat/servei/catalunya/cobertes-sol/wms", "cobertes_2023"), min: 9, max: 22, op: 0.6, attr: "ICGC CC BY 4.0", intel: 1 },
      { id: "es-and-hic", reg: R_AND, nome: t("Andaluzia: habitats de interesse comunitário (REDIAM)", "Andalucía: hábitats de interés comunitario (REDIAM)"), tipo: "raster", proxy: 1, sonda: "https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_habitats_interes_comunitario", raw: wms("https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_habitats_interes_comunitario", "habitats_interes_comunitario"), url: "", min: 9, max: 22, op: 0.6, attr: "REDIAM, Junta de Andalucía", intel: 1 }
    ] }
  ];
  CAT.forEach(function (g) { g.itens.forEach(function (it) { if (it.proxy && it.raw) it.url = px(it.raw); }); });
  function tranc(it) { return EXPL && it.intel; }
  function wmws(b, c) { return wms(b, c); }
  /* 17/11/2026: cronologia de Espanha (voos do IGN, WMS pnoa-historico, testado a 17/11 a partir do navegador: 200, imagem,
     CORS *). A Cronologia do Atlas usa as ortofotos da DGT, que só cobrem Portugal; em Espanha a régua deste grupo troca o
     fundo pelos voos do IGN, do voo americano de 1956 ao PNOA mais recente. Fica por baixo de todas as outras camadas. */
  var CRONO_ES = [
    { a: "1956", c: "AMS_1956-1957", t: t("Voo americano, série B (1956-1957)", "Vuelo americano, serie B (1956-1957)") },
    { a: "1977", c: "Interministerial_1973-1986", t: t("Voo interministerial (1973-1986)", "Vuelo interministerial (1973-1986)") },
    { a: "1984", c: "Nacional_1981-1986", t: t("Voo nacional (1981-1986)", "Vuelo nacional (1981-1986)") },
    { a: "2004", c: "PNOA2004", t: "PNOA 2004" }, { a: "2008", c: "PNOA2008", t: "PNOA 2008" }, { a: "2012", c: "PNOA2012", t: "PNOA 2012" },
    { a: "2016", c: "PNOA2016", t: "PNOA 2016" }, { a: "2020", c: "PNOA2020", t: "PNOA 2020" }, { a: "2024", c: "PNOA2024", t: "PNOA 2024" }
  ];
  var cronoSel = -1;
  function cronoMostrar(k) {
    var I = mapa(); if (!I || !I.getStyle) return;
    try { if (I.getLayer("es-crono")) I.removeLayer("es-crono"); if (I.getSource("es-crono")) I.removeSource("es-crono"); } catch (e) {}
    cronoSel = k; if (k < 0) return;
    var c = CRONO_ES[k];
    try {
      I.addSource("es-crono", { type: "raster", tiles: [wms(HIST, c.c, "", "image/jpeg")], tileSize: 256, attribution: c.t + " " + IGN, maxzoom: 19 });
      I.addLayer({ id: "es-crono", type: "raster", source: "es-crono", paint: { "raster-opacity": 1 } }, antesFundo(I));
    } catch (e) { if (window.console) console.warn("[es-camadas] crono", e && e.message); }
  }
  var CHAVE = "tcd_atlas_es";
  var ligados = {};
  try { ligados = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { ligados = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(ligados)); } catch (e) {} }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function itemPor(id) { for (var g = 0; g < CAT.length; g++) for (var i = 0; i < CAT[g].itens.length; i++) if (CAT[g].itens[i].id === id) return CAT[g].itens[i]; return null; }
  var CORES = { TA: "#e0c36b", TH: "#e8d48a", PS: "#9bc46a", PR: "#b8d68c", PA: "#7fae55", FO: "#3f7d3a", OV: "#8a9a3c", VI: "#a0558a", FY: "#c48a4a", CI: "#e39d3a", IM: "#9a9a9a", ZU: "#c9c9c9", AG: "#6aa6d8", CA: "#bdbdbd" };
  /* Fundos (ortofoto, mapa base, voos antigos) ficam por baixo de todas as outras camadas: logo acima da primeira camada do estilo. */
  function antesFundo(I) { if (I.getLayer && I.getLayer("iprv-s-raster")) return "iprv-s-raster"; /* marcador do Atlas: fim dos fundos, antes do relevo sombreado */ var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 1; i < L.length; i++) if (!/^es-(pnoa|ignbase|crono)$/.test(L[i].id)) return L[i].id; return antes(I); }
  var SONDA = {};
  function aviso(txt) {
    var a = document.createElement("div"); a.textContent = txt;
    a.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;max-width:440px;background:#2b2b2b;color:#fff;font:13px Inter,system-ui,sans-serif;padding:10px 14px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.25)";
    document.body.appendChild(a); setTimeout(function () { a.remove(); }, 7000);
  }
  function sondar(it, depois) {
    if (it.wmts) return sondarWmts(it, depois);
    if (!it.sonda) return depois(true);
    if (SONDA[it.sonda] !== undefined) return depois(SONDA[it.sonda]);
    var feito = false, c = window.AbortController ? new AbortController() : null;
    var tm = setTimeout(function () { if (c) c.abort(); fim(false); }, 12000);
    function fim(ok) { if (feito) return; feito = true; clearTimeout(tm); SONDA[it.sonda] = ok; setTimeout(function () { delete SONDA[it.sonda]; }, 600000); depois(ok); }
    var capU = it.sonda + (it.sonda.indexOf("?") < 0 ? "?" : "&") + "request=GetCapabilities&service=WMS";
    fetch(it.proxy ? PX + encodeURIComponent(capU) : capU, c ? { signal: c.signal } : {})
      .then(function (r) { return r.text(); }).then(function (x) {
        var ok = /<(WMS_)?Capabilities/i.test(x) && !/ServiceException/.test(x.slice(0, 400));
        /* Os nomes das camadas do MITECO não puderam ser confirmados a 17/11 (serviço em baixo): se o nome previsto não
           existir no GetCapabilities, usa-se a primeira camada com nome que não seja a raiz. */
        if (ok) {
          var nomes = [], m, re = /<Layer[^>]*>\s*<Name>([^<]+)<\/Name>/g; while ((m = re.exec(x))) nomes.push(m[1]);
          var base = it.proxy ? it.raw : it.url;
          var cur = decodeURIComponent((base.match(/LAYERS=([^&]+)/) || [])[1] || "");
          if (nomes.length && cur.split(",").some(function (k) { return nomes.indexOf(k) < 0; })) {
            var n = nomes.length > 1 ? nomes[1] : nomes[0]; base = base.replace(/LAYERS=[^&]+/, "LAYERS=" + encodeURIComponent(n));
            if (it.proxy) { it.raw = base; it.url = px(base); } else it.url = base;
          }
        }
        fim(ok);
      })
      .catch(function () { fim(false); });
  }
  /* WMTS do MITECO (sensibilidade ambiental para renováveis): o nome da camada e o conjunto de matrizes em 3857 lêem-se
     do GetCapabilities; se não houver conjunto em 3857 (GoogleMapsCompatible ou EPSG:3857), a camada não é mostrada. */
  function sondarWmts(it, depois) {
    if (SONDA[it.wmts] !== undefined) return depois(SONDA[it.wmts]);
    var feito = false, c = window.AbortController ? new AbortController() : null;
    var tm = setTimeout(function () { if (c) c.abort(); fim(false); }, 12000);
    function fim(ok) { if (feito) return; feito = true; clearTimeout(tm); SONDA[it.wmts] = ok; setTimeout(function () { delete SONDA[it.wmts]; }, 600000); depois(ok); }
    fetch(it.wmts + "?REQUEST=GetCapabilities&SERVICE=WMTS", c ? { signal: c.signal } : {}).then(function (r) { return r.ok ? r.text() : ""; }).then(function (x) {
      var cam = (x.match(/<Layer>[\s\S]*?<ows:Identifier>([^<]+)<\/ows:Identifier>/) || [])[1];
      var sets = []; var m, re = /<TileMatrixSet>([^<]+)<\/TileMatrixSet>/g; while ((m = re.exec(x))) sets.push(m[1]);
      var tms = sets.filter(function (s) { return /GoogleMaps|3857|900913/i.test(s); })[0];
      var fmt = (x.match(/<Format>(image\/(?:png|jpeg))<\/Format>/) || [])[1] || "image/png";
      if (!cam || !tms) return fim(false);
      it.url = it.wmts + "?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + encodeURIComponent(cam) + "&STYLE=default&FORMAT=" + encodeURIComponent(fmt) +
        "&TILEMATRIXSET=" + encodeURIComponent(tms) + "&TILEMATRIX=" + (/^EPSG:/.test(tms) ? encodeURIComponent(tms) + ":" : "") + "{z}&TILEROW={y}&TILECOL={x}";
      fim(true);
    }).catch(function () { fim(false); });
  }
  function antes(I) { var L = (I.getStyle() && I.getStyle().layers) || []; for (var i = 0; i < L.length; i++) if (/^tme-|^gl-draw|^tcd-terreno/.test(L[i].id)) return L[i].id; return undefined; }
  function ligar(it) {
    var I = mapa(); if (!I || !I.getStyle) return;
    if (I.style ? I.style._loaded === false : (I.isStyleLoaded && !I.isStyleLoaded())) { if (I.once) I.once("styledata", function () { setTimeout(function () { if (ligados[it.id]) ligar(it); }, 0); }); return; } /* 22/10: o estilo basta; à espera de «idle» a camada só aparecia depois de todas as teselas */
    try {
      if (it.tipo === "sigpac") {
        if (!I.getSource(it.id)) I.addSource(it.id, { type: "vector", tiles: ["https://sigpac-hubcloud.es/mvt/recinto@3857@pbf/{z}/{x}/{y}.pbf"], minzoom: 13, maxzoom: 15, attribution: it.attr });
        var cor = ["match", ["get", "uso_sigpac"]]; Object.keys(CORES).forEach(function (k) { cor.push(k, CORES[k]); }); cor.push("#d6cfa8");
        if (!I.getLayer(it.id + "-f")) I.addLayer({ id: it.id + "-f", type: "fill", source: it.id, "source-layer": "recinto", minzoom: it.min, paint: { "fill-color": cor, "fill-opacity": 0.35 } }, antes(I));
        if (!I.getLayer(it.id + "-l")) I.addLayer({ id: it.id + "-l", type: "line", source: it.id, "source-layer": "recinto", minzoom: it.min, paint: { "line-color": "#6b5a2e", "line-width": 0.6 } }, antes(I));
      } else {
        if (!I.getSource(it.id)) I.addSource(it.id, { type: "raster", tiles: [it.url], tileSize: 256, attribution: it.attr, minzoom: 0, maxzoom: it.max > 19 ? 19 : it.max });
        if (!I.getLayer(it.id)) I.addLayer({ id: it.id, type: "raster", source: it.id, minzoom: it.min, paint: { "raster-opacity": it.op } }, it.fundo ? antesFundo(I) : antes(I));
      }
    } catch (e) { if (window.console) console.warn("[es-camadas]", it.id, e && e.message); }
  }
  function desligar(it) {
    var I = mapa(); if (!I || !I.getLayer) return;
    [it.id, it.id + "-f", it.id + "-l"].forEach(function (l) { try { if (I.getLayer(l)) I.removeLayer(l); } catch (e) {} });
    try { if (I.getSource(it.id)) I.removeSource(it.id); } catch (e) {}
  }
  var CSS = ".tes:not(.aberto)>*:not(h4){display:none}.tes h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important}.tes h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tes.aberto h4::before{transform:rotate(90deg)}.tes.aberto h4{margin:0 0 6px!important}" + ".tes{margin:8px 0 4px;border:1px solid var(--ln2,#ddd);border-radius:8px;padding:8px 10px;background:var(--p2,transparent)}" +
    ".tes h4{margin:0 0 6px;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}.tes h5{margin:8px 0 3px;font:600 11.5px Inter,system-ui,sans-serif;color:var(--mu,#666);text-transform:uppercase;letter-spacing:.04em}" +
    ".tes label{display:flex;gap:7px;align-items:center;font:13px Inter,system-ui,sans-serif;color:var(--tx,#222);padding:3px 0;cursor:pointer}.tes small{display:block;margin-top:6px;font-size:11px;color:var(--mu,#777)}.tes [hidden]{display:none!important}";
  function montar() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (document.getElementById("tes")) return true;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("div"); d.id = "tes"; d.className = "tes ipr-g"; d.setAttribute("data-g", "es"); d.hidden = true;
    var h = "<h4>" + t("Espanha", "España") + "</h4>";
    CAT.forEach(function (g) {
      h += "<h5" + (g.itens.every(function (i) { return i.reg; }) ? " data-regional" : "") + ">" + g.sub + "</h5>";
      g.itens.forEach(function (it) {
        if (tranc(it)) { h += '<label class="bl" title="IPR Atlas Intelligence"' + (it.reg ? ' data-reg="' + it.reg.join(",") + '"' : "") + '><input type="checkbox" disabled> ' + it.nome + ' <i style="font-style:normal;font-size:11px;color:var(--mu,#777)">Intelligence</i></label>'; return; }
        h += '<label' + (it.reg ? ' data-reg="' + it.reg.join(",") + '"' : "") + '><input type="checkbox" data-tes="' + it.id + '"' + (ligados[it.id] ? " checked" : "") + "> " + it.nome + "</label>";
      });
    });
    h += "<h5>" + t("Cronologia (voos do IGN)", "Cronología (vuelos del IGN)") + "</h5>" +
      '<label><input type="checkbox" data-tes-crono> ' + t("Ver o terreno noutro ano", "Ver el terreno en otro año") + "</label>" +
      '<div class="tes-crono" hidden><input type="range" min="0" max="' + (CRONO_ES.length - 1) + '" step="1" value="0" style="width:100%" aria-label="' + t("Ano", "Año") + '">' +
      '<div style="display:flex;justify-content:space-between;font:10.5px Inter,system-ui,sans-serif;color:var(--mu,#777)">' + CRONO_ES.map(function (c) { return "<span>" + c.a.slice(2) + "</span>"; }).join("") + "</div>" +
      '<p class="tes-crono-t" style="margin:4px 0 0;font:12px Inter,system-ui,sans-serif"></p></div>';
    h += "<small>" + t("Fontes oficiais espanholas e europeias. Informação indicativa; a referência vinculativa é a publicada pelo organismo.", "Fuentes oficiales españolas y europeas. Información orientativa; la referencia vinculante es la publicada por cada organismo.") + "</small>";
    d.innerHTML = h;
    cam.insertBefore(d, cam.firstChild);
    try { if (localStorage.getItem(CHAVE + "_ab") === "1" || Object.keys(ligados).length) d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) { if (!e.target.closest("h4")) return; var a = d.classList.toggle("aberto"); try { localStorage.setItem(CHAVE + "_ab", a ? "1" : "0"); } catch (x) {} });
    var cx = d.querySelector("[data-tes-crono]"), cd = d.querySelector(".tes-crono"), cr = cd.querySelector("input"), ct = cd.querySelector(".tes-crono-t");
    function cronoAplicar() { var k = +cr.value; cronoMostrar(k); ct.textContent = CRONO_ES[k].t + " · IGN"; }
    cx.addEventListener("change", function () { cd.hidden = !cx.checked; if (cx.checked) cronoAplicar(); else cronoMostrar(-1); });
    cr.addEventListener("input", cronoAplicar);
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-tes]"); if (!c) return;
      var it = itemPor(c.getAttribute("data-tes")); if (!it || tranc(it)) return;
      if (c.checked) {
        ligados[it.id] = 1; guardar();
        sondar(it, function (ok) {
          if (!ligados[it.id]) return;
          if (ok) { ligar(it); return; }
          delete ligados[it.id]; guardar(); c.checked = false;
          aviso(t("O serviço desta camada (" + it.attr.split(/[,·]/)[0].trim() + ") não está a responder neste momento. Tente mais tarde.", "El servicio de esta capa (" + it.attr.split(/[,·]/)[0].trim() + ") no responde en este momento. Inténtelo más tarde."));
        });
      } else { delete ligados[it.id]; desligar(it); guardar(); }
    });
    return true;
  }
  function verificar() {
    var I = mapa(), d = document.getElementById("tes"); if (!I || !d || !I.getCenter) return;
    var c = I.getCenter(), em = dentro(c.lng, c.lat);
    if (d.hidden === em) d.hidden = !em;
    if (em) pnoaAuto();
    if (em) {
      var vis = 0;
      Array.prototype.forEach.call(d.querySelectorAll("[data-reg]"), function (l) {
        var b = l.getAttribute("data-reg").split(",").map(Number), ok = c.lng >= b[0] && c.lng <= b[2] && c.lat >= b[1] && c.lat <= b[3];
        l.hidden = !ok; if (ok) vis++;
      });
      var h5 = d.querySelector("h5[data-regional]"); if (h5) h5.hidden = !vis;
    }
  }
  function repor() { if (cronoSel > -1) { var I0 = mapa(); if (I0 && I0.getLayer && !I0.getLayer("es-crono")) cronoMostrar(cronoSel); } Object.keys(ligados).forEach(function (id) { var it = itemPor(id); if (it && !tranc(it)) sondar(it, function (ok) { if (ok && ligados[id]) ligar(it); }); }); }
  /* 17/11/2026 (Nuno: ortofoto PNOA por omissão em Espanha). Na primeira vez que o mapa entra em Espanha, se a pessoa
     ainda não escolheu nada neste grupo, liga-se a ortofoto PNOA (fica por baixo de tudo). Depois respeita-se a escolha. */
  var CH_AUTO = CHAVE + "_pnoa_auto";
  function pnoaAuto() {
    try { if (localStorage.getItem(CH_AUTO)) return; localStorage.setItem(CH_AUTO, "1"); } catch (e) { return; }
    if (Object.keys(ligados).length) return;
    var it = itemPor("es-pnoa"); if (!it) return;
    ligados[it.id] = 1; guardar(); ligar(it);
    var c = document.querySelector('[data-tes="es-pnoa"]'); if (c) c.checked = true;
  }
  function arrancar(n) {
    if (!montar() || !mapa()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    var I = mapa();
    verificar(); repor(); ligarModo();
    if (I.on) { I.on("moveend", verificar); I.on("styledata", function () { setTimeout(repor, 0); }); }
  }
  /* 17/11/2026 (Nuno: «deve haver botões que só funcionam para Portugal, isso é para sair fora»). Modo Espanha: com o centro
     do mapa em Espanha (a) escondem-se os botões e produtos que só existem em Portugal (temas, Plano de situação, Leitura
     Territorial, pacote dos três, projecto de demonstração do Torgal) e a caixa da Leitura na encomenda é desmarcada (a
     Leitura usa o PDM e a DGT; vendê-la em Espanha seria cobrar um produto que não se faz); (b) com o mapa todo fora de
     Portugal, as camadas portuguesas ligadas (hipsometria e curvas da DGT, cadastro da DGT...) são desligadas e voltam a
     ligar-se quando o mapa regressa a Portugal; os fundos da DGT (ortofoto Sentinel/ortosat), que fora de Portugal pintam
     branco por cima da PNOA, ficam escondidos no mapa. A linha «Fora de Portugal: ... camadas escondidas» sai em castelhano. */
  var PTB = [-9.7, 36.8, -6.0, 42.25], PTH = /dgterritorio\.gov\.pt|apambiente\.pt|icnf\.pt|dgeg\.gov\.pt|bupi\.gov\.pt|ifap\.pt|dgadr\.pt|lneg\.pt|madeira\.gov\.pt|azores\.gov\.pt/i;
  var GLOBAL = /OpenStreetMap|Copernicus|Sentinel|NASA|GBIF|ESA\b|EEA|EOX|SoilGrids|CORINE|Natural Earth|WorldPop|JRC|Esri|GEBCO|FAO|World|Global|Mundo/i;
  var CH_DESL = CHAVE + "_pt_desligadas", escMapa = {}, modoES = null;
  function ptCat(id) {
    var V = window.IPRViz; if (!V || !V.catalogo) return false;
    var L = Array.isArray(V.catalogo) ? V.catalogo : Object.keys(V.catalogo).map(function (k) { return V.catalogo[k]; });
    for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === id) {
      var c = L[i], g = String(c.g || ""), f = String(c.fonte || "") + " " + String(c.n || "");
      if (/^(es|fr|eu|ao)$/.test(g)) return false;
      if (/Mapterhorn/.test(f) && !/DGT/.test(f)) return false;
      if (GLOBAL.test(f) && !/DGT/.test(f)) return false;
      return true;
    }
    return false;
  }
  function lerDesl() { try { return JSON.parse(localStorage.getItem(CH_DESL) || "[]") || []; } catch (e) { return []; } }
  function srcPT(I, l) {
    var so = l.source && I.getStyle().sources[l.source]; if (!so) return false;
    var u = (so.tiles || []).concat(so.url ? [so.url] : []).join(" "); try { u = decodeURIComponent(u); } catch (e) {}
    return PTH.test(u);
  }
  function modoEspanha() {
    var I = mapa(); if (!I || !I.getCenter || !I.getStyle()) return;
    var c = I.getCenter(), em = dentro(c.lng, c.lat), bb = I.getBounds();
    var toca = !(bb.getEast() < PTB[0] || bb.getWest() > PTB[2] || bb.getNorth() < PTB[1] || bb.getSouth() > PTB[3]);
    var forte = em && !toca;
    document.body.classList.toggle("tcd-es", em);
    if (em) {
      var ck = document.querySelector('#ipe-form input[name="leitura"]');
      if (ck && ck.checked) { ck.checked = false; ck.setAttribute("data-tcd-es", "1"); ["input", "change"].forEach(function (ev) { ck.dispatchEvent(new Event(ev, { bubbles: true })); }); }
    } else {
      var ck2 = document.querySelector('#ipe-form input[name="leitura"][data-tcd-es]');
      if (ck2 && !ck2.checked) { ck2.checked = true; ck2.removeAttribute("data-tcd-es"); ["input", "change"].forEach(function (ev) { ck2.dispatchEvent(new Event(ev, { bubbles: true })); }); }
    }
    /* mapa: fontes portuguesas (DGT e afins) escondidas com o mapa todo fora de Portugal */
    (I.getStyle().layers || []).forEach(function (l) {
      if (/^es-|^tme-|^ipe-|^gl-draw/.test(l.id)) return;
      if (forte) {
        if (srcPT(I, l) && I.getLayoutProperty(l.id, "visibility") !== "none") { try { I.setLayoutProperty(l.id, "visibility", "none"); escMapa[l.id] = 1; } catch (e) {} }
      } else if (escMapa[l.id]) { try { I.setLayoutProperty(l.id, "visibility", "visible"); } catch (e) {} delete escMapa[l.id]; }
    });
    /* lista: camadas portuguesas ligadas desligam-se (e voltam em Portugal) */
    var desl = lerDesl(), mudou = false;
    if (forte) {
      [].forEach.call(document.querySelectorAll("#ipe li.ipr-it[data-id]"), function (li) {
        var inp = li.querySelector("input.ipr-ck, input[type=checkbox]"); if (!inp || !inp.checked || !ptCat(li.dataset.id)) return;
        inp.click(); if (desl.indexOf(li.dataset.id) < 0) desl.push(li.dataset.id); mudou = true;
      });
    } else if (desl.length && !em) {
      var c2 = I.getCenter();
      if (c2.lng >= PTB[0] && c2.lng <= PTB[2] && c2.lat >= PTB[1] && c2.lat <= PTB[3]) {
        desl.forEach(function (id) { var li = document.querySelector('#ipe li.ipr-it[data-id="' + id + '"]'), inp = li && li.querySelector("input.ipr-ck, input[type=checkbox]"); if (inp && !inp.checked) inp.click(); });
        desl = []; mudou = true;
      }
    }
    if (mudou) { try { localStorage.setItem(CH_DESL, JSON.stringify(desl)); } catch (e) {} }
    modoES = em;
  }
  var CSS_ES = "body.tcd-es #tb-bar,body.tcd-es #ipe [data-be-prod=planta],body.tcd-es #ipe [data-be-prod=leitura],body.tcd-es #ipr-pacote," +
    "body.tcd-es #ipe li.ipr-mb-b[data-mb='18032'],body.tcd-es #ipe-form label.ipe-chk:has(input[name=leitura])," +
    "body.tcd-es #ipe-res .tcd-fn,body.tcd-es #ipe-res .ipr-tcam,body.tcd-es #ipe-res details.ipv,body.tcd-es #ipe-res [data-tcd-lt]{display:none!important}" +
    "#tcd-es-misto{margin:8px 0;padding:8px 10px;border-left:3px solid #c9a227;background:rgba(201,162,39,.12);font-size:13px;line-height:1.4}";
  /* terrenos desenhados: quantos em Espanha e quantos em Portugal (um pedido com os dois países falha no motor: #20179) */
  function terrenos() {
    var I = mapa(), cs = (I && I._controls) || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") {
      try { return (cs[i].getAll().features || []).filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); }); } catch (e) {}
    }
    return [];
  }
  function centro(f) {
    var r = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0], x = 0, y = 0;
    r.forEach(function (c) { x += c[0]; y += c[1]; }); return [x / r.length, y / r.length];
  }
  function avisoMisto() {
    var fm = document.getElementById("ipe-form"); if (!fm) return;
    var nES = 0, nPT = 0;
    terrenos().forEach(function (f) { var c = centro(f); if (dentro(c[0], c[1])) nES++; else if (c[0] >= PTB[0] && c[0] <= PTB[2] && c[1] >= PTB[1] && c[1] <= PTB[3]) nPT++; });
    var av = document.getElementById("tcd-es-misto"), bts = fm.querySelectorAll("button[type=submit],input[type=submit]");
    if (nES && nPT) {
      if (!av) { av = document.createElement("p"); av.id = "tcd-es-misto"; fm.insertBefore(av, fm.firstChild); }
      var t = ES ? "Hay terrenos en España y en Portugal en el mismo pedido. Cada país tiene su Base: encargue primero los de un país y después los del otro."
                 : "Há terrenos em Espanha e em Portugal no mesmo pedido. Cada país tem a sua Base: encomende primeiro os de um país e depois os do outro.";
      if (av.textContent !== t) av.textContent = t;
      [].forEach.call(bts, function (b) { if (!b.disabled) { b.disabled = true; b.setAttribute("data-tcd-misto", "1"); } });
    } else {
      if (av) av.parentNode.removeChild(av);
      [].forEach.call(fm.querySelectorAll("[data-tcd-misto]"), function (b) { b.disabled = false; b.removeAttribute("data-tcd-misto"); });
    }
  }
  /* frases da ficha que remetem para a Leitura Territorial (só existe em Portugal) */
  function marcaLT() {
    var r = document.getElementById("ipe-res"); if (!r) return;
    [].forEach.call(r.querySelectorAll("p,li,small"), function (e) {
      if (!e.hasAttribute("data-tcd-lt") && /Le(c|i)tura Territorial/i.test(e.textContent) && !e.querySelector("button,input,.ipr-fg-out")) e.setAttribute("data-tcd-lt", "1");
    });
  }
  var RG = [[/Fora de Portugal: /, "Fuera de Portugal: "], [/ camadas de outras regiões escondidas/, " capas de otras regiones ocultas"], [/ camada de outra região escondida/, " capa de otra región oculta"],
    [/A mostrar todas as camadas\./, "Mostrando todas las capas."], [/Só as desta zona/, "Solo las de esta zona"]];
  function traduzRegn() {
    if (!ES) return; var x = document.getElementById("ipr-regn"); if (!x) return;
    var h = x.innerHTML, n = h; RG.forEach(function (r) { n = n.replace(r[0], r[1]); }); if (n !== h) x.innerHTML = n;
  }
  function ligarModo() {
    var st = document.createElement("style"); st.textContent = CSS_ES; document.head.appendChild(st);
    var cam = document.getElementById("ipe-cam") || document.body;
    if (window.MutationObserver) new MutationObserver(traduzRegn).observe(cam, { childList: true, subtree: true, characterData: true });
    var tmo = 0, I = mapa(); function ag() { clearTimeout(tmo); tmo = setTimeout(modoEspanha, 300); }
    if (I && I.on) { I.on("moveend", ag); I.on("styledata", ag); }
    setInterval(function () { modoEspanha(); avisoMisto(); marcaLT(); }, 2000); modoEspanha(); traduzRegn();
  }
  window.__tcdEsCamadas = { dentro: dentro, CAT: CAT, modo: modoEspanha };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
