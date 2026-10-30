/* IPR Atlas · Levar para o campo (QField). Pedido do Nuno, 30/10/2026, 17h49: «Ponte para o QField: "Levar para o campo"
   em cada Base, que gera o pacote QField com as camadas ligadas. É o que a equipa já faz à mão.»
   O que faz (só acrescenta; não muda nada do que existe):
   1. No cartão de cada Base do separador Projectos (#ipe-proj .ipe-card) e na linha aberta da Base em «Os meus projectos»
      (minhas-bases.js, #ipr-mb) aparece o botão «Levar para o campo (QField)».
   2. O botão abre uma janela com duas linhas sobre o QField, a lista das camadas públicas ligadas no IPR Atlas que vão junto
      (e das que ficam de fora, com o motivo) e as instruções curtas para abrir no QField.
   3. «Preparar e descarregar»: descarrega o pacote QField que o worker já produz (<nome>_QField.zip, pela rota
      /tcd/v1/mapa-ficheiro do m14513, com a sessão da pessoa), abre-o no navegador (JSZip), junta ao projecto .qgz as camadas
      de serviço ligadas (WMS, XYZ, ArcGIS MapServer e mosaicos vectoriais da DGT) em dois grupos, «IPR Atlas · camadas
      ligadas» no topo e «IPR Atlas · fundo» em baixo, e devolve o .zip pronto a importar no QField. O resto do pacote
      (GeoPackages, rasters, levantamento, LICENCA-IPR.txt, comentário do zip) fica tal como veio.
   4. Sem pacote QField na entrega (Bases antigas) ou com um pacote grande demais para o aparelho: «Projecto leve» com o
      limite do terreno, as camadas ligadas (precisam de rede) e uma camada de notas de campo editável (notas_campo.gpkg em
      EPSG:3763, feito no navegador com o sql.js, carregado só ao clicar; se o sql.js falhar, notas_campo.geojson em WGS84).
   Nada sai para fora do navegador; não grava nada no servidor.
   Desligar: ?qfield=0 no endereço ou localStorage ipr_qfield_off=1. Cada parte num try/catch; falha em silêncio. */
(function () {
  "use strict";
  if (window.__iprQField) return;
  window.__iprQField = 1;
  try {
    if (new URLSearchParams(location.search).get("qfield") === "0") return;
    if (localStorage.getItem("ipr_qfield_off") === "1") return;
  } catch (e) {}
  // Sem sessão não há Bases; o tcdNonce pode chegar depois deste ficheiro (ver o arranque, no fim).

  // ---------- textos (PT pré-acordo e EN) ----------
  var TX = {
    pt: {
      botao: "Levar para o campo (QField)", botaoT: "Gerar o pacote QField desta Base com as camadas ligadas no IPR Atlas",
      titulo: "Levar para o campo",
      l1: "O QField é a aplicação gratuita (Android, iPhone e iPad) que abre esta Base no telemóvel ou no tablet, com o GPS sobre o mapa e registo de pontos, linhas e fotografias, mesmo sem rede.",
      l2: "Preparamos aqui um pacote .zip com o projecto da sua Base e, se quiser, as camadas públicas que tem ligadas no IPR Atlas.",
      vao: "Camadas ligadas que vão junto", vaoN: "precisam de rede no terreno",
      fora: "Ficam de fora", nenhuma: "Não tem camadas públicas ligadas no IPR Atlas. Ligue as que quiser levar (cadastro, ortofotos, REN, RAN…) e volte a abrir esta janela.",
      juntar: "Juntar ao projecto as camadas ligadas no IPR Atlas",
      preparar: "Preparar e descarregar", original: "Descarregar o pacote da Base tal como está",
      leve: "Projecto leve: limite, camadas ligadas e notas de campo", leveT: "O limite do terreno, as camadas ligadas e uma camada de notas editável no QField, sem os dados da Base",
      semPac: "Esta entrega não tem pacote QField. Pode levar um projecto leve com o limite do terreno, as camadas ligadas e uma camada de notas de campo; para ter a Base no QField, peça o pacote à equipa (info@terracruadesign.pt).",
      grande: "O pacote da Base tem %s. Num telemóvel ou tablet pode faltar memória para o juntar aqui; se falhar, descarregue o pacote tal como está e, à parte, o projecto leve.",
      fechar: "Fechar", como: "Como abrir no QField",
      c1: "Instale o QField (gratuito) a partir da loja de aplicações.",
      c2: "Ponha o .zip no aparelho: descarregue-o lá directamente, ou copie-o por cabo, AirDrop ou pasta na nuvem.",
      c3: "No QField: «Abrir ficheiro local», botão +, «Importar projecto a partir de ZIP» e escolha o ficheiro.",
      c4: "Abra o projecto. A Base e o levantamento funcionam sem rede; as camadas do IPR Atlas precisam de rede.",
      c5: "No computador, com o QGIS e o módulo QFieldSync, também pode abrir o .qgz e usar «Pacote para o QField». Para trabalhar em equipa, com sincronização, use a IPR Cloud.",
      aDescarregar: "A descarregar o pacote da Base…", aAbrir: "A abrir o pacote…", aJuntar: "A juntar as camadas ao projecto…",
      aGerar: "A preparar o ficheiro…", pronto: "Pronto: %s. Se não começou a transferência, toque aqui.",
      erroDesc: "Não foi possível descarregar o pacote da Base (%s).", erroZip: "O pacote não tem um projecto QGIS (.qgz) que se possa abrir aqui.",
      grandeMax: "O pacote da Base passa de %s, demasiado para juntar no navegador sem risco de faltar memória (sobretudo no iPad e no telemóvel). Descarregue o pacote tal como está e, à parte, o projecto leve com as camadas ligadas.",
      cancelado: "Cancelado.",
      erroMem: "O aparelho ficou sem memória para juntar o pacote. Descarregue o pacote tal como está e, à parte, o projecto leve.",
      erro: "Não foi possível preparar o pacote: %s",
      grupoNotas: "IPR Atlas · notas de campo", juntarN: "Juntar notas de campo (camada de pontos editável no QField, com fotografia)", grupoCam: "IPR Atlas · camadas ligadas (precisam de rede)", grupoFundo: "IPR Atlas · fundo (precisa de rede)",
      limite: "Limite do terreno",
      motivo: { tipo: "tipo de camada que o QField não lê directamente", proprio: "serviço do IPR, fica no Atlas", base: "já está no pacote da Base",
        semCamada: "serviço sem nome de camada", dyn: "estilo dinâmico do ArcGIS, não passa para o QGIS" },
      leia: "CAMADAS DO IPR ATLAS NESTE PROJECTO", semNome: "Terreno sem nome",
      notas: "Notas de campo", aNotas: "A preparar a camada de notas de campo…",
      notasG: "NOTAS DE CAMPO: camada de pontos editável no QField (notas_campo.gpkg, EPSG:3763), com data, autor, tipo (observação, problema, foto, medição), texto e fotografia tirada com a câmara. Toque na camada «Notas de campo», no lápis e marque no mapa.",
      notasJ: "NOTAS DE CAMPO: não foi possível criar o GeoPackage neste navegador; a camada vai em GeoJSON (notas_campo.geojson, coordenadas WGS84), também editável no QField, com um ponto de exemplo que pode apagar. Para EPSG:3763 em GeoPackage, gere o projecto leve noutro navegador ou num computador.",
      tipos: [["observacao", "Observação"], ["problema", "Problema"], ["foto", "Foto"], ["medicao", "Medição"]],
      exemplo: "Exemplo: pode apagar este ponto."
    },
    en: {
      botao: "Take to the field (QField)", botaoT: "Build the QField package for this Base with the layers turned on in IPR Atlas",
      titulo: "Take to the field",
      l1: "QField is the free app (Android, iPhone and iPad) that opens this Base on a phone or tablet, with GPS over the map and recording of points, lines and photos, even offline.",
      l2: "Here we build a .zip package with your Base project and, if you wish, the public layers you have turned on in IPR Atlas.",
      vao: "Layers turned on that go along", vaoN: "need a network connection in the field",
      fora: "Left out", nenhuma: "You have no public layers turned on in IPR Atlas. Turn on the ones you want to take (land registry, orthophotos, REN, RAN…) and open this window again.",
      juntar: "Add the layers turned on in IPR Atlas to the project",
      preparar: "Build and download", original: "Download the Base package as it is",
      leve: "Light project: boundary, layers turned on and field notes", leveT: "The site boundary, the layers turned on and a notes layer editable in QField, without the Base data",
      semPac: "This delivery has no QField package. You can take a light project with the site boundary, the layers turned on and a field notes layer; to have the Base in QField, ask the team for the package (info@terracruadesign.pt).",
      grande: "The Base package is %s. A phone or tablet may run out of memory to merge it here; if it fails, download the package as it is and, separately, the light project.",
      fechar: "Close", como: "How to open it in QField",
      c1: "Install QField (free) from the app store.",
      c2: "Put the .zip on the device: download it there directly, or copy it by cable, AirDrop or a cloud folder.",
      c3: "In QField: “Open local file”, the + button, “Import project from ZIP” and pick the file.",
      c4: "Open the project. The Base and the survey layers work offline; the IPR Atlas layers need a network connection.",
      c5: "On a computer with QGIS and the QFieldSync plugin you can also open the .qgz and use “Package for QField”. For team work with synchronisation, use IPR Cloud.",
      aDescarregar: "Downloading the Base package…", aAbrir: "Opening the package…", aJuntar: "Adding the layers to the project…",
      aGerar: "Preparing the file…", pronto: "Ready: %s. If the download did not start, tap here.",
      erroDesc: "Could not download the Base package (%s).", erroZip: "The package has no QGIS project (.qgz) that can be opened here.",
      grandeMax: "The Base package is larger than %s, too much to merge in the browser without risking running out of memory (especially on iPad and phones). Download the package as it is and, separately, the light project with the layers turned on.",
      cancelado: "Cancelled.",
      erroMem: "The device ran out of memory to merge the package. Download the package as it is and, separately, the light project.",
      erro: "Could not build the package: %s",
      grupoNotas: "IPR Atlas · field notes", juntarN: "Add field notes (a point layer editable in QField, with photo)", grupoCam: "IPR Atlas · layers turned on (need network)", grupoFundo: "IPR Atlas · background (needs network)",
      limite: "Site boundary",
      motivo: { tipo: "layer type QField cannot read directly", proprio: "IPR service, stays in the Atlas", base: "already in the Base package",
        semCamada: "service without a layer name", dyn: "ArcGIS dynamic style, does not carry over to QGIS" },
      leia: "IPR ATLAS LAYERS IN THIS PROJECT", semNome: "Unnamed site",
      notas: "Field notes", aNotas: "Preparing the field notes layer…",
      notasG: "FIELD NOTES: a point layer editable in QField (notas_campo.gpkg, EPSG:3763), with date, author, type (observation, problem, photo, measurement), text and a photo taken with the camera. Tap the \u201cField notes\u201d layer, the pencil, and mark on the map.",
      notasJ: "FIELD NOTES: the GeoPackage could not be created in this browser; the layer goes as GeoJSON (notas_campo.geojson, WGS84 coordinates), also editable in QField, with a sample point you can delete. For EPSG:3763 in a GeoPackage, build the light project in another browser or on a computer.",
      tipos: [["observacao", "Observation"], ["problema", "Problem"], ["foto", "Photo"], ["medicao", "Measurement"]],
      exemplo: "Sample: you can delete this point."
    }
  };
  function lg() { return (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; }
  function t(k) { var v = TX[lg()][k]; return v != null ? v : TX.pt[k]; }
  function fmt(s, a) { return String(s).replace("%s", a); }

  // ---------- utilidades ----------
  function I() { return window.__ipe || null; }
  function est() { var i = I(); return i && i.estado; }
  function viz() { var i = I(); return i && i.viz; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function x(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]; }); }
  function mb(n) { n = +n || 0; return n >= 1048576 ? (n / 1048576).toFixed(n >= 104857600 ? 0 : 1) + " MB" : Math.max(1, Math.round(n / 1024)) + " kB"; }
  function nomeFich(d) { return String(d && d.nome || "").split("· ").pop().split("/").pop().trim(); }
  var ROTA = /\/tcd\/v1\/mapa-ficheiro(\?|$)|[?&]rest_route=(%2F|\/)tcd(%2F|\/)v1(%2F|\/)mapa-ficheiro(&|$)/i;
  // Número entre 0 e 1 (opacidade); o que não for número dá o valor por omissão.
  function op01(v, d) { return typeof v === "number" && isFinite(v) ? Math.max(0.05, Math.min(1, v)) : d; }
  function qfDe(m) {
    var l = (m && Array.isArray(m.downloads)) ? m.downloads : [];
    // Só a rota autenticada do m14513 (/tcd/v1/mapa-ficheiro); os download_url do WooCommerce ficam de fora.
    for (var i = 0; i < l.length; i++) {
      var a = nomeFich(l[i]), u = String(l[i] && l[i].url || "");
      if (/_qfield\.zip$/i.test(a) && ROTA.test(u)) return { nome: a, url: u };
    }
    return null;
  }
  function entregue(m) { return !!(m && (qfDe(m) || (m.estado_k === "completed" && m.geojson))); }
  function movel() { return /iPad|iPhone|iPod|Android/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function seguro(nome) { return String(nome || "base").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "base"; }

  // ---------- camadas ligadas no Atlas, passadas para o QGIS ----------
  var PROPRIOS = /(^|\.)(terracruadesign\.pt|regenerativo\.pt|redeipr\.pt|paisagemviva\.pt|lidar\.pt)$/i;
  // Valor de um parâmetro de URI do QGIS (chave=valor&chave=valor): '&' e '=' dentro do valor ficam codificados.
  function uv(v) { return String(v).replace(/%/g, "%25").replace(/&/g, "%26").replace(/=/g, "%3D"); }
  function host(u) { try { return new URL(u, location.href).host; } catch (e) { return ""; } }
  function rgb(c, a) {
    c = String(c || "").trim(); var m;
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) c = "#" + m[1].split("").map(function (h) { return h + h; }).join("");
    if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c))) {
      var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(255 * (a == null ? 1 : a))].join(",");
    }
    if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(c))) {
      return [+m[1] | 0, +m[2] | 0, +m[3] | 0, Math.round(255 * (a != null ? a : m[4] != null ? +m[4] : 1))].join(",");
    }
    return null;
  }
  function catalogo() { var c = window.IPRViz && window.IPRViz.catalogo; return Array.isArray(c) ? c : []; }
  function activas() { var v = viz(); try { return v && v.activas ? v.activas() : []; } catch (e) { return []; } }

  // Devolve { vao: [def], fora: [{n, motivo}] }. Cada def: {id, n, grupo: "cam"|"fundo", tipo: "raster"|"vt", prov, fonte, op, ...}
  function servicos() {
    var por = {}, out = { vao: [], fora: [] }, M = TX[lg()].motivo;
    catalogo().forEach(function (e) { if (e && e.id) por[e.id] = e; });
    activas().forEach(function (id) {
      var e = por[id]; if (!e) return;
      var n = e.n || e.id, g = (e.fundo || e.g === "fundo") ? "fundo" : "cam", op = op01(e.op, 1);
      var base = { id: "ipr_atlas_" + String(e.id).replace(/[^A-Za-z0-9_]/g, "_"), n: n, grupo: g, op: op, fonte: e.fonte || host(e.url) || "" };
      if (e.t === "lidar" || e.t === "aoi" || /^l_/.test(e.id)) { out.fora.push({ n: n, motivo: M.base }); return; }
      if (e.url && PROPRIOS.test(host(e.url))) { out.fora.push({ n: n, motivo: M.proprio }); return; }
      if (e.t === "wms") {
        if (!e.layer) { out.fora.push({ n: n, motivo: M.semCamada }); return; }
        base.tipo = "raster"; base.prov = "wms"; base.url = e.url;
        base.fonteDados = "crs=EPSG:3857&dpiMode=7&format=" + uv(e.fmt || "image/png") + "&layers=" + uv(e.layer) + "&styles=&tilePixelRatio=0&url=" + uv(e.url);
        out.vao.push(base); return;
      }
      if (e.t === "xyz") {
        if (!e.url) { out.fora.push({ n: n, motivo: M.semCamada }); return; }
        var u = String(e.url).replace("@Hx", "@1x"); // GBIF: densidade de píxeis
        base.tipo = "raster"; base.prov = "wms"; base.url = u;
        base.fonteDados = "type=xyz&url=" + uv(u) + "&zmax=" + (+e.mz || 19) + "&zmin=0";
        out.vao.push(base); return;
      }
      if (e.t === "ags") {
        if (e.dyn) { out.fora.push({ n: n, motivo: M.dyn }); return; }
        var ids = String(e.layers || "").replace(/^show:/, "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return /^\d+$/.test(s); });
        base.tipo = "raster"; base.prov = "arcgismapserver"; base.url = String(e.url).replace(/\/+$/, ""); base.ags = ids; // vazio: resolve-se pelo ?f=json
        out.vao.push(base); return;
      }
      if (e.t === "mvt" && e.col && e.src) {
        var st = e.e || {}, tipo = st.tipo === "fill" ? "fill" : st.tipo === "circle" ? "circle" : "line";
        var cor = (typeof st.cor === "string" && st.cor) || e.cor || "#888888";
        base.tipo = "vt"; base.prov = "xyzvectortiles";
        base.url = "https://ogcapi.dgterritorio.gov.pt/collections/" + e.col + "/tiles/WebMercatorQuad/{z}/{y}/{x}?f=mvt";
        base.fonteDados = "type=xyz&url=" + uv(base.url) + "&zmax=15&zmin=0";
        base.vt = { camada: e.src, tipo: tipo, cor: cor, op: op01(st.op, tipo === "fill" ? 0.35 : 1), larg: typeof st.larg === "number" ? st.larg : 1, raio: +st.raio || 3, dash: Array.isArray(st.dash) };
        base.minz = +e.minz || 0;
        out.vao.push(base); return;
      }
      out.fora.push({ n: n, motivo: M.tipo });
    });
    return out;
  }

  // ArcGIS MapServer sem lista de camadas: pergunta ao serviço quais as de topo visíveis por omissão (com limite de tempo).
  function resolverAgs(defs) {
    return Promise.all(defs.map(function (d) {
      if (d.prov !== "arcgismapserver") return Promise.resolve(d);
      var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { try { ctl && ctl.abort(); } catch (e) {} }, 6000);
      return fetch(d.url + "?f=json", { signal: ctl ? ctl.signal : undefined, credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
        clearTimeout(tm);
        var nomes = {}, topo = [];
        if (j && Array.isArray(j.layers)) j.layers.forEach(function (l) {
          var id = String(l && l.id); if (!/^\d+$/.test(id)) return; // só ids numéricos entram no URI do QGIS
          nomes[id] = typeof l.name === "string" ? l.name.slice(0, 120) : null;
          if ((l.parentLayerId == null || l.parentLayerId === -1) && l.defaultVisibility !== false) topo.push(id);
        });
        var ids = (d.ags.length ? d.ags : topo.length ? topo : ["0"]).filter(function (id) { return /^\d+$/.test(id); });
        d.sub = ids.map(function (id) { return { id: id, n: nomes[id] || null }; });
        return d;
      });
    }));
  }

  // ---------- XML do projecto QGIS ----------
  // O QGIS 3.34 só lê o SRC do projecto com srsid/srid (só authid fica vazio); confirmado com o QGIS 3.34.4.
  var SRS3857 = '<spatialrefsys nativeFormat="Wkt"><srsid>3857</srsid><srid>3857</srid><authid>EPSG:3857</authid><description>WGS 84 / Pseudo-Mercator</description><projectionacronym>merc</projectionacronym><ellipsoidacronym>EPSG:7030</ellipsoidacronym><geographicflag>false</geographicflag></spatialrefsys>';
  var SRS4326 = '<spatialrefsys nativeFormat="Wkt"><authid>EPSG:4326</authid></spatialrefsys>';
  function opt(n, v) { return '<Option type="QString" name="' + n + '" value="' + x(v) + '"/>'; }
  function pipe(op) {
    return '<pipe><rasterrenderer type="singlebandcolordata" band="1" alphaBand="-1" opacity="' + op + '" nodataColor=""><rasterTransparency/></rasterrenderer>' +
      '<brightnesscontrast brightness="0" contrast="0" gamma="1"/><huesaturation saturation="0" grayscaleMode="0" colorizeOn="0" colorizeGreen="128" colorizeBlue="128" colorizeRed="255" colorizeStrength="100" invertColors="0"/>' +
      '<rasterresampler maxOversampling="2"/><resamplingStage>resamplingFilter</resamplingStage></pipe>';
  }
  function simbolo(v) {
    var c = rgb(v.cor, 1) || "136,136,136,255", cf = rgb(v.cor, v.op) || "136,136,136,90";
    if (v.tipo === "fill") return '<symbol type="fill" name="0" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleFill" enabled="1" locked="0" pass="0"><Option type="Map">' +
      opt("color", cf) + opt("outline_color", c) + opt("outline_style", "solid") + opt("outline_width", "0.26") + opt("outline_width_unit", "MM") + opt("style", "solid") + '</Option></layer></symbol>';
    if (v.tipo === "circle") return '<symbol type="marker" name="0" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleMarker" enabled="1" locked="0" pass="0"><Option type="Map">' +
      opt("color", c) + opt("name", "circle") + opt("outline_color", "255,255,255,255") + opt("outline_width", "0.2") + opt("outline_width_unit", "MM") + opt("size", String(Math.max(1.2, Math.min(6, v.raio * 0.6)).toFixed(1))) + opt("size_unit", "MM") + '</Option></layer></symbol>';
    return '<symbol type="line" name="0" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleLine" enabled="1" locked="0" pass="0"><Option type="Map">' +
      opt("line_color", c) + opt("line_style", v.dash ? "dash" : "solid") + opt("line_width", String(Math.max(0.2, Math.min(1.2, v.larg * 0.3)).toFixed(2))) + opt("line_width_unit", "MM") + '</Option></layer></symbol>';
  }
  function geomVT(tipo) { return tipo === "fill" ? 2 : tipo === "circle" ? 0 : 1; }
  // Uma ou mais camadas QGIS por camada do Atlas (ArcGIS: uma por subcamada). Devolve [{id, nome, prov, src, xml}].
  function camadasQgis(d) {
    var out = [];
    if (d.prov === "arcgismapserver") {
      (d.sub || []).forEach(function (s, i) {
        var nome = d.sub.length > 1 ? d.n + " · " + (s.n || s.id) : d.n, id = d.id + "_" + s.id;
        var src = "crs='EPSG:3857' format='PNG32' layer='" + s.id + "' url='" + String(d.url).replace(/'/g, "%27") + "'";
        out.push({ id: id, nome: nome, prov: d.prov, src: src, xml: rasterXml(id, nome, src, d.prov, d.op, d.fonte) });
      });
      return out;
    }
    if (d.tipo === "vt") {
      var v = d.vt, xml = '<maplayer type="vector-tile" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" minScale="0" maxScale="0" autoRefreshMode="Disabled" autoRefreshTime="0">' +
        "<id>" + x(d.id) + "</id><datasource>" + x(d.fonteDados) + "</datasource><layername>" + x(d.n) + "</layername><srs>" + SRS3857 + "</srs>" +
        "<resourceMetadata><abstract>" + x(d.fonte) + "</abstract></resourceMetadata><provider>xyzvectortiles</provider>" +
        '<renderer type="basic"><styles><style name="' + x(d.n) + '" layer="' + x(v.camada) + '" geometry="' + geomVT(v.tipo) + '" enabled="1" expression="" min-zoom="' + (d.minz > 0 ? Math.max(0, d.minz - 1) : -1) + '" max-zoom="-1"><symbols>' + simbolo(v) + "</symbols></style></styles></renderer>" +
        '<labeling type="basic"><styles/></labeling><blendMode>0</blendMode><layerOpacity>1</layerOpacity></maplayer>';
      out.push({ id: d.id, nome: d.n, prov: d.prov, src: d.fonteDados, xml: xml });
      return out;
    }
    out.push({ id: d.id, nome: d.n, prov: d.prov, src: d.fonteDados, xml: rasterXml(d.id, d.n, d.fonteDados, d.prov, d.op, d.fonte) });
    return out;
  }
  function rasterXml(id, nome, src, prov, op, fonte) {
    return '<maplayer type="raster" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" minScale="1e+08" maxScale="0" autoRefreshMode="Disabled" autoRefreshTime="0">' +
      "<id>" + x(id) + "</id><datasource>" + x(src) + "</datasource><layername>" + x(nome) + "</layername><srs>" + SRS3857 + "</srs>" +
      "<resourceMetadata><type>dataset</type><abstract>" + x(fonte) + "</abstract></resourceMetadata><provider>" + x(prov) + "</provider>" +
      '<noData><noDataList bandNo="1" useSrcNoData="0"/></noData>' + pipe(op) + "<blendMode>0</blendMode></maplayer>";
  }
  function noArvore(c, ligada) {
    return '<layer-tree-layer id="' + x(c.id) + '" name="' + x(c.nome) + '" source="' + x(c.src) + '" providerKey="' + x(c.prov) + '" checked="' + (ligada ? "Qt::Checked" : "Qt::Unchecked") + '" expanded="0" legend_exp="" patch_size="-1,-1" legend_split_behavior="0"><customproperties><Option/></customproperties></layer-tree-layer>';
  }
  function grupoXml(nome, cs) {
    return '<layer-tree-group name="' + x(nome) + '" checked="Qt::Checked" expanded="1" groupLayer=""><customproperties><Option/></customproperties>' +
      cs.map(function (c) { return noArvore(c, true); }).join("") + "</layer-tree-group>";
  }
  // Divide as definições em camadas QGIS, sem repetir fontes que o projecto já tem.
  function preparar(defs, jaTem) {
    var cam = [], fundo = [];
    defs.forEach(function (d) {
      camadasQgis(d).forEach(function (c) {
        if (jaTem && jaTem(c)) return;
        (d.grupo === "fundo" ? fundo : cam).push(c);
      });
    });
    return { cam: cam, fundo: fundo, todas: cam.concat(fundo) };
  }

  // Junta as camadas ao .qgs da Base (texto). Devolve o novo texto.
  // nc (opcional): camada de notas de campo (notasXml), num grupo próprio no topo da árvore.
  function juntarAoQgs(txt, defs, nc) {
    var doc = new DOMParser().parseFromString(txt, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new Error("qgs");
    var raiz = doc.documentElement, pl = null, arv = null, i, n;
    for (i = 0; i < raiz.childNodes.length; i++) {
      n = raiz.childNodes[i]; if (n.nodeType !== 1) continue;
      if (n.nodeName === "projectlayers") pl = n;
      if (n.nodeName === "layer-tree-group" && !arv) arv = n;
    }
    if (!pl || !arv) throw new Error("qgs");
    var fontes = [].map.call(pl.getElementsByTagName("datasource"), function (d) { return d.textContent; });
    var ids = {}; [].forEach.call(pl.getElementsByTagName("id"), function (d) { ids[d.textContent] = 1; });
    var p = preparar(defs, function (c) { return ids[c.id] || fontes.indexOf(c.src) >= 0; });
    if (nc && (ids[nc.id] || fontes.indexOf(nc.src) >= 0)) nc = null; // já lá está
    if (!p.todas.length && !nc) return { txt: txt, n: 0, notas: false };
    function frag(s) {
      var d = new DOMParser().parseFromString("<r>" + s + "</r>", "application/xml");
      if (d.getElementsByTagName("parsererror").length) throw new Error("xml");
      return [].slice.call(d.documentElement.childNodes).map(function (k) { return doc.importNode(k, true); });
    }
    var novas = (nc ? [nc] : []).concat(p.todas);
    novas.forEach(function (c) { frag(c.xml).forEach(function (k) { pl.appendChild(k); }); });
    // Grupo das camadas por cima de tudo (logo a seguir às propriedades do grupo de topo); fundo por baixo de tudo.
    var primeiro = null, ordem = null;
    for (i = 0; i < arv.childNodes.length; i++) {
      n = arv.childNodes[i]; if (n.nodeType !== 1) continue;
      if (n.nodeName === "custom-order") { ordem = n; continue; }
      if (n.nodeName !== "customproperties" && !primeiro) primeiro = n;
    }
    if (p.cam.length) frag(grupoXml(t("grupoCam"), p.cam)).forEach(function (k) { arv.insertBefore(k, primeiro || ordem); });
    if (nc) { // grupo das notas no topo de tudo
      var topo = null;
      for (i = 0; i < arv.childNodes.length; i++) { n = arv.childNodes[i]; if (n.nodeType === 1 && (n.nodeName === "layer-tree-group" || n.nodeName === "layer-tree-layer")) { topo = n; break; } }
      frag(grupoXml(t("grupoNotas"), [nc])).forEach(function (k) { arv.insertBefore(k, topo || ordem); });
    }
    if (p.fundo.length) frag(grupoXml(t("grupoFundo"), p.fundo)).forEach(function (k) { arv.insertBefore(k, ordem); });
    if (ordem) {
      p.cam.forEach(function (c) { var it = doc.createElement("item"); it.textContent = c.id; ordem.insertBefore(it, ordem.firstChild); });
      p.fundo.forEach(function (c) { var it = doc.createElement("item"); it.textContent = c.id; ordem.appendChild(it); });
      if (nc) { var it = doc.createElement("item"); it.textContent = nc.id; ordem.insertBefore(it, ordem.firstChild); }
    }
    var lo = raiz.getElementsByTagName("layerorder")[0];
    if (lo) novas.forEach(function (c) { var l = doc.createElement("layer"); l.setAttribute("id", c.id); lo.appendChild(l); });
    var s = new XMLSerializer().serializeToString(doc);
    if (!/^<\?xml|^<!DOCTYPE/i.test(s)) s = "<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>\n" + s;
    return { txt: s, n: novas.length, notas: !!nc };
  }

  // Projecto leve (sem a Base): notas de campo, limite do terreno em GeoJSON e as camadas ligadas.
  function caixa(g) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (function col(o) { if (!o) return []; if (o.type === "FeatureCollection") return (o.features || []).map(col); if (o.type === "Feature") return col(o.geometry); if (o.type === "GeometryCollection") return (o.geometries || []).map(col); return o.coordinates || []; })(g));
    return isFinite(b[0]) && b[0] <= b[2] ? b : null;
  }
  function geo(m) { var g = m && m.geojson; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { g = null; } } return g && typeof g === "object" ? g : null; }
  // Camada de notas de campo editável (pedido do Nuno, 30/10/2026, 18h22): GeoPackage EPSG:3763, ou GeoJSON se o sql.js falhar.
  // Formulário igual ao do levantamento do worker (projecto.py): lista de tipos, texto multilinha, foto como anexo de câmara
  // (ExternalResource, caminho relativo ao projecto), data e autor automáticos. Estrutura conferida com o QGIS 3.34.4.
  function notasXml(formato) {
    var gp = formato === "gpkg", src = gp ? "./notas_campo.gpkg|layername=notas_campo" : "./notas_campo.geojson";
    function w(campo, tipo, cfg) { return '<field configurationFlags="NoFlag" name="' + campo + '"><editWidget type="' + tipo + '"><config>' + (cfg ? '<Option type="Map">' + cfg + "</Option>" : "<Option/>") + "</config></editWidget></field>"; }
    function o(n, v, ty) { return '<Option name="' + x(n) + '" value="' + x(v) + '" type="' + (ty || "QString") + '"/>'; }
    var mapa = '<Option name="map" type="List">' + t("tipos").map(function (k) { return '<Option type="Map">' + o(k[1], k[0]) + "</Option>"; }).join("") + "</Option>";
    var campos = (gp ? ["fid", "data", "autor", "tipo", "texto", "foto"] : ["data", "autor", "tipo", "texto", "foto"]);
    var en = lg() === "en", alias = { data: en ? "Date" : "Data", autor: en ? "Author" : "Autor", tipo: en ? "Type" : "Tipo", texto: en ? "Text" : "Texto", foto: en ? "Photo" : "Fotografia" };
    var def = { data: "now()", autor: "coalesce(@cloud_username, @user_full_name, '')", tipo: "'observacao'" };
    var c = { id: "ipr_notas_campo", nome: t("notas"), prov: "ogr", src: src };
    c.xml = '<maplayer type="vector" geometry="Point" wkbType="Point" readOnly="0" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" minScale="1e+08" maxScale="0" autoRefreshMode="Disabled" autoRefreshTime="0">' +
      "<id>" + c.id + "</id><datasource>" + x(src) + "</datasource><layername>" + x(c.nome) + "</layername><srs>" +
      (gp ? '<spatialrefsys nativeFormat="Wkt"><authid>EPSG:3763</authid></spatialrefsys>' : SRS4326) + '</srs><provider encoding="UTF-8">ogr</provider>' +
      '<renderer-v2 type="singleSymbol" symbollevels="0" enableorderby="0" forceraster="0" referencescale="-1"><symbols><symbol type="marker" name="0" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleMarker" enabled="1" locked="0" pass="0"><Option type="Map">' +
      opt("color", "228,87,46,255") + opt("name", "circle") + opt("outline_color", "255,255,255,255") + opt("outline_width", "0.4") + opt("outline_width_unit", "MM") + opt("size", "3") + opt("size_unit", "MM") +
      "</Option></layer></symbol></symbols><rotation/><sizescale/></renderer-v2>" +
      "<fieldConfiguration>" + campos.map(function (k) {
        if (k === "fid") return w(k, "Hidden");
        if (k === "data") return w(k, "DateTime", o("allow_null", "true", "bool") + o("calendar_popup", "true", "bool") + o("display_format", "dd/MM/yyyy HH:mm") + o("field_format", "yyyy-MM-dd HH:mm:ss"));
        if (k === "tipo") return w(k, "ValueMap", mapa);
        if (k === "texto") return w(k, "TextEdit", o("IsMultiline", "true", "bool"));
        if (k === "foto") return w(k, "ExternalResource", o("DocumentViewer", "1", "int") + o("DocumentViewerHeight", "0", "int") + o("DocumentViewerWidth", "0", "int") + o("FileWidget", "true", "bool") + o("FileWidgetButton", "true", "bool") + o("RelativeStorage", "1", "int") + o("StorageMode", "0", "int"));
        return w(k, "TextEdit", o("IsMultiline", "false", "bool"));
      }).join("") + "</fieldConfiguration>" +
      "<aliases>" + campos.map(function (k, i) { return '<alias index="' + i + '" field="' + k + '" name="' + x(alias[k] || "") + '"/>'; }).join("") + "</aliases>" +
      "<defaults>" + campos.map(function (k) { return '<default field="' + k + '" applyOnUpdate="0" expression="' + x(def[k] || "") + '"/>'; }).join("") + "</defaults>" +
      "<blendMode>0</blendMode><featureBlendMode>0</featureBlendMode><layerOpacity>1</layerOpacity></maplayer>";
    return c;
  }
  var SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/"; // a mesma versão que o ajustes.js (§75) já usa no Atlas
  var SQLP = null;
  function sqljs() { // só se carrega ao gerar o projecto leve
    if (SQLP) return SQLP;
    SQLP = new Promise(function (res, rej) {
      var tm = setTimeout(function () { rej(new Error("sqljs")); }, 20000);
      function ok() { window.initSqlJs({ locateFile: function (f) { return SQLJS + f; } }).then(function (S) { clearTimeout(tm); res(S); }, function (e) { clearTimeout(tm); rej(e); }); }
      if (window.initSqlJs) return ok();
      var sc = document.createElement("script"); sc.src = SQLJS + "sql-wasm.js"; sc.crossOrigin = "anonymous"; sc.onload = ok;
      sc.onerror = function () { clearTimeout(tm); rej(new Error("sqljs")); };
      document.head.appendChild(sc);
    });
    SQLP.catch(function () { SQLP = null; });
    return SQLP;
  }
  // GeoPackage 1.2 mínimo com a tabela de pontos vazia «notas_campo» em EPSG:3763 (mesma estrutura que o GDAL escreve).
  var W3763 = 'PROJCS["ETRS89 / Portugal TM06",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6258"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4258"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",39.6682583333333],PARAMETER["central_meridian",-8.13310833333333],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","3763"]]', W4326 = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AXIS["Latitude",NORTH],AXIS["Longitude",EAST],AUTHORITY["EPSG","4326"]]';
  function notasGpkg(SQL) {
    var db = new SQL.Database();
    try {
      db.run("PRAGMA application_id=1196444487; PRAGMA user_version=10200;" +
        "CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL,srs_id INTEGER NOT NULL PRIMARY KEY,organization TEXT NOT NULL,organization_coordsys_id INTEGER NOT NULL,definition TEXT NOT NULL,description TEXT);" +
        "CREATE TABLE gpkg_contents (table_name TEXT NOT NULL PRIMARY KEY,data_type TEXT NOT NULL,identifier TEXT UNIQUE,description TEXT DEFAULT '',last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),min_x DOUBLE,min_y DOUBLE,max_x DOUBLE,max_y DOUBLE,srs_id INTEGER,CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id));" +
        "CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL,column_name TEXT NOT NULL,geometry_type_name TEXT NOT NULL,srs_id INTEGER NOT NULL,z TINYINT NOT NULL,m TINYINT NOT NULL,CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),CONSTRAINT uk_gc_table_name UNIQUE (table_name),CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id));" +
        "CREATE TABLE gpkg_ogr_contents(table_name TEXT NOT NULL PRIMARY KEY,feature_count INTEGER DEFAULT NULL);" +
        'CREATE TABLE "notas_campo" ("fid" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,"geom" POINT,"data" DATETIME,"autor" TEXT(80),"tipo" TEXT(20),"texto" TEXT(1000),"foto" TEXT(255));' +
        "CREATE TRIGGER \"trigger_insert_feature_count_notas_campo\" AFTER INSERT ON \"notas_campo\" BEGIN UPDATE gpkg_ogr_contents SET feature_count = feature_count + 1 WHERE lower(table_name) = lower('notas_campo'); END;" +
        "CREATE TRIGGER \"trigger_delete_feature_count_notas_campo\" AFTER DELETE ON \"notas_campo\" BEGIN UPDATE gpkg_ogr_contents SET feature_count = feature_count - 1 WHERE lower(table_name) = lower('notas_campo'); END;");
      var ins = "INSERT INTO gpkg_spatial_ref_sys VALUES (?,?,?,?,?,?)";
      db.run(ins, ["Undefined Cartesian SRS", -1, "NONE", -1, "undefined", "undefined Cartesian coordinate reference system"]);
      db.run(ins, ["Undefined geographic SRS", 0, "NONE", 0, "undefined", "undefined geographic coordinate reference system"]);
      db.run(ins, ["WGS 84 geodetic", 4326, "EPSG", 4326, W4326, "longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid"]);
      db.run(ins, ["ETRS89 / Portugal TM06", 3763, "EPSG", 3763, W3763, null]);
      db.run("INSERT INTO gpkg_contents (table_name,data_type,identifier,description,srs_id) VALUES ('notas_campo','features','notas_campo','',3763)");
      db.run("INSERT INTO gpkg_geometry_columns VALUES ('notas_campo','geom','POINT',3763,0,0)");
      db.run("INSERT INTO gpkg_ogr_contents VALUES ('notas_campo',0)");
      return db.export();
    } finally { try { db.close(); } catch (e) {} }
  }
  function notasGeojson(g) {
    var b = g && caixa(g), c = b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [-8.1331, 39.6683];
    return JSON.stringify({ type: "FeatureCollection", name: "notas_campo", features: [{ type: "Feature",
      properties: { data: new Date().toISOString().slice(0, 19).replace("T", " "), autor: "", tipo: "observacao", texto: t("exemplo"), foto: "" },
      geometry: { type: "Point", coordinates: c } }] });
  }

  function qgsLeve(m, defs, notas) {
    var titulo = (m.local || t("semNome")) + " · IPR Atlas", g = geo(m), b = g && caixa(g), p = preparar(defs, null), cs = [];
    var nc = notas ? notasXml(notas) : null; if (nc) cs.push(nc);
    var limite = null;
    if (g) {
      limite = { id: "ipr_limite_terreno", nome: t("limite"), prov: "ogr", src: "./limite.geojson" };
      limite.xml = '<maplayer type="vector" geometry="Polygon" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" minScale="1e+08" maxScale="0" readOnly="0" autoRefreshMode="Disabled" autoRefreshTime="0">' +
        "<id>" + limite.id + "</id><datasource>./limite.geojson</datasource><layername>" + x(limite.nome) + "</layername><srs>" + SRS4326 + "</srs>" +
        '<provider encoding="UTF-8">ogr</provider><renderer-v2 type="singleSymbol" symbollevels="0" enableorderby="0" forceraster="0" referencescale="-1"><symbols>' +
        '<symbol type="fill" name="0" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleFill" enabled="1" locked="0" pass="0"><Option type="Map">' +
        opt("color", "255,154,60,30") + opt("outline_color", "255,154,60,255") + opt("outline_style", "solid") + opt("outline_width", "0.8") + opt("outline_width_unit", "MM") + opt("style", "solid") +
        "</Option></layer></symbol></symbols><rotation/><sizescale/></renderer-v2><blendMode>0</blendMode><featureBlendMode>0</featureBlendMode><layerOpacity>1</layerOpacity></maplayer>";
      cs.push(limite);
    }
    var todas = cs.concat(p.todas);
    var arv = '<layer-tree-group><customproperties><Option/></customproperties>' + (nc ? noArvore(nc, true) : "") + (limite ? noArvore(limite, true) : "") +
      (p.cam.length ? grupoXml(t("grupoCam"), p.cam) : "") + (p.fundo.length ? grupoXml(t("grupoFundo"), p.fundo) : "") +
      '<custom-order enabled="0">' + todas.map(function (c) { return "<item>" + x(c.id) + "</item>"; }).join("") + "</custom-order></layer-tree-group>";
    var vista = "";
    if (b) {
      var dx = (b[2] - b[0]) * 0.25 + 0.002, dy = (b[3] - b[1]) * 0.25 + 0.002;
      vista = '<ProjectViewSettings UseProjectScales="0" rotation="0"><Scales/><DefaultViewExtent xmin="' + (b[0] - dx) + '" ymin="' + (b[1] - dy) + '" xmax="' + (b[2] + dx) + '" ymax="' + (b[3] + dy) + '">' + SRS4326 + "</DefaultViewExtent></ProjectViewSettings>";
    }
    var qgs = "<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>\n" +
      '<qgis version="3.34.0" projectname="' + x(titulo) + '"><homePath path=""/><title>' + x(titulo) + "</title>" +
      "<projectCrs>" + SRS3857 + "</projectCrs>" + arv + "<projectlayers>" + todas.map(function (c) { return c.xml; }).join("") + "</projectlayers>" + vista +
      '<properties><Paths><Absolute type="bool">false</Absolute></Paths><SpatialRefSys><ProjectionsEnabled type="int">1</ProjectionsEnabled></SpatialRefSys></properties></qgis>';
    return { qgs: qgs, n: p.todas.length, geojson: g };
  }

  function leiaMe(defs, ext) {
    var l = [t("leia"), ""];
    defs.forEach(function (d) { l.push("- " + d.n + (d.fonte ? " (" + d.fonte + ")" : "")); });
    l.push("", t("vaoN") + ".", "", t("como") + ":", "1. " + t("c1"), "2. " + t("c2"), "3. " + t("c3"), "4. " + t("c4"), "5. " + t("c5"));
    if (ext) l.push("", ext);
    l.push("", "IPR Atlas · Terracrua Design · info@terracruadesign.pt");
    return l.join("\r\n");
  }

  // ---------- descarregar, abrir, juntar, devolver ----------
  var LIMITE = 314572800; // 300 MB: acima disto não se junta no navegador
  function grande() { var e = new Error("grande"); e.limite = 1; return e; }
  // Devolve um Blob (os pedaços não se copiam para um só bloco de memória). Pára acima do LIMITE ou ao cancelar.
  function baixar(url, prog, sinal) {
    return fetch(url, { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" }, signal: sinal }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      var total = +r.headers.get("Content-Length") || 0;
      if (total > LIMITE) { try { if (r.body) r.body.cancel().catch(function () {}); } catch (e) {} throw grande(); }
      if (!r.body || !r.body.getReader) return r.blob().then(function (b) { if (b.size > LIMITE) throw grande(); return b; });
      var rd = r.body.getReader(), partes = [], tem = 0;
      return (function ler() {
        return rd.read().then(function (o) {
          if (o.done) { var b = new Blob(partes, { type: "application/zip" }); partes = null; return b; }
          tem += o.value.length;
          if (tem > LIMITE) { try { rd.cancel().catch(function () {}); } catch (e) {} partes = null; throw grande(); }
          partes.push(o.value); prog(tem, total); return ler();
        });
      })();
    });
  }
  function entregar(blob, nome, msg, sinal) {
    if (sinal && sinal.aborted) return;
    var u = URL.createObjectURL(blob), a = el("a"); a.href = u; a.download = nome; a.rel = "noopener";
    document.body.appendChild(a); a.click(); setTimeout(function () { try { a.remove(); } catch (e) {} }, 0);
    setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 300000);
    msg.textContent = ""; var l = el("a", "", fmt(t("pronto"), nome + " · " + mb(blob.size))); l.href = u; l.download = nome; msg.appendChild(l);
  }
  // Notas de campo: GeoPackage pelo sql.js ou, se falhar, GeoJSON (ver notasGpkg e notasGeojson).
  function prepararNotas(g) {
    return sqljs().then(function (SQL) { return { f: "gpkg", nome: "notas_campo.gpkg", b: notasGpkg(SQL) }; })
      .catch(function () { return { f: "geojson", nome: "notas_campo.geojson", b: notasGeojson(g) }; });
  }
  function pacoteCompleto(m, defs, juntar, notas, msg, sinal) {
    var qf = qfDe(m), Z = window.JSZip;
    msg.textContent = t("aDescarregar");
    var avisar = 0, comCamadas = !!(juntar && defs.length);
    return baixar(qf.url, function (a, tot) {
      msg.textContent = t("aDescarregar") + " " + mb(a) + (tot ? " / " + mb(tot) : "");
      if (tot > 157286400 && movel()) avisar = tot; // mais de 150 MB num telemóvel ou tablet: avisa já
      if (avisar) msg.textContent += " " + fmt(t("grande"), mb(avisar));
    }, sinal).then(function (blob) {
      // Nada a acrescentar (nem camadas nem notas): entrega-se o zip tal como veio, sem o abrir nem recomprimir.
      if (!comCamadas && !notas) { entregar(blob, qf.nome, msg, sinal); return null; }
      msg.textContent = t("aAbrir");
      return Z.loadAsync(blob).then(function (zip) {
        var qgz = zip.file(/(^|\/)[^/]+\.qgz$/i).sort(function (a, b) { return a.name.split("/").length - b.name.split("/").length; })[0];
        if (!qgz) throw new Error("semqgz");
        var pasta = qgz.name.indexOf("/") >= 0 ? qgz.name.replace(/[^/]+$/, "") : ""; // as notas ficam ao lado do projecto
        return Promise.all([comCamadas ? resolverAgs(defs) : Promise.resolve([]), notas ? (msg.textContent = t("aNotas"), prepararNotas(geo(m))) : Promise.resolve(null)]).then(function (rs) {
          var ds = rs[0], nt = rs[1];
          if (nt && zip.file(pasta + nt.nome)) nt = null; // o pacote já tem esta camada
          if (sinal && sinal.aborted) return null;
          msg.textContent = t("aJuntar");
          return qgz.async("uint8array").then(function (b) { return Z.loadAsync(b); }).then(function (iz) {
            var qgs = iz.file(/\.qgs$/i)[0]; if (!qgs) throw new Error("semqgz");
            return qgs.async("string").then(function (txt) {
              var r = juntarAoQgs(txt, ds, nt ? notasXml(nt.f) : null);
              if (!r.n) { entregar(blob, qf.nome, msg, sinal); return null; } // tudo já presente: o original
              iz.file(qgs.name, r.txt);
              return iz.generateAsync({ type: "uint8array", compression: "DEFLATE" }).then(function (nb) {
                zip.file(qgz.name, nb, { date: new Date() });
                if (r.notas) { zip.file(pasta + nt.nome, nt.b); zip.folder(pasta + "DCIM"); } // DCIM: as fotografias do QField
                zip.file("CAMADAS-IPR-ATLAS.txt", leiaMe(ds, r.notas ? t(nt.f === "gpkg" ? "notasG" : "notasJ") : ""));
                if (sinal && sinal.aborted) return null;
                msg.textContent = t("aGerar");
                return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, comment: zip.comment || undefined, mimeType: "application/zip" }).then(function (out) {
                  entregar(out, qf.nome.replace(/_qfield\.zip$/i, "") + "_QField_campo.zip", msg, sinal);
                });
              });
            });
          });
        });
      });
    });
  }
  function pacoteLeve(m, defs, msg, sinal) {
    var Z = window.JSZip; msg.textContent = t("aJuntar");
    return resolverAgs(defs).then(function (ds) {
      if (sinal && sinal.aborted) return null;
      msg.textContent = t("aNotas");
      return sqljs().then(function (SQL) { return { f: "gpkg", b: notasGpkg(SQL) }; }).catch(function () { return { f: "geojson" }; }).then(function (nt) {
      var r = qgsLeve(m, ds, nt.f), zip = new Z(), nome = seguro(m.local || ("base_" + (m.encomenda || m.id)));
      zip.file(nome + ".qgs", r.qgs);
      if (r.geojson) zip.file("limite.geojson", JSON.stringify(r.geojson));
      if (nt.f === "gpkg") zip.file("notas_campo.gpkg", nt.b); else zip.file("notas_campo.geojson", notasGeojson(r.geojson));
      zip.folder("DCIM"); // as fotografias do QField ficam aqui, com caminho relativo
      zip.file("CAMADAS-IPR-ATLAS.txt", leiaMe(ds, t(nt.f === "gpkg" ? "notasG" : "notasJ") + "\r\n\r\n" + (m.local || "") + (m.encomenda ? " · #" + m.encomenda : "")));
      msg.textContent = t("aGerar");
      return zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/zip" }).then(function (blob) { entregar(blob, nome + "_QField_leve.zip", msg, sinal); });
      });
    });
  }

  // ---------- janela ----------
  var CSS = ".ipr-qf-campo{margin:10px 0 4px;display:flex;flex-wrap:wrap;gap:6px}" +
    ".ipr-qf-b{min-height:40px;display:inline-flex;align-items:center;gap:6px}" +
    ".ipr-qf-b svg{flex:none}" +
    "#ipr-mb .ipr-mb-acc button.ipr-qf-mb{min-height:40px}" +
    ".ipr-qfd{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45)}" +
    ".ipr-qfd-c{background:var(--p1,var(--bg,#fff));color:var(--tx,#222);border:1px solid var(--ln,#ccc);border-radius:12px;max-width:560px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:18px 18px 14px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif}" +
    ".ipr-qfd-c h3{margin:0 0 8px;font:600 17px/1.3 Inter,system-ui,sans-serif}" +
    ".ipr-qfd-c p{margin:0 0 8px}" +
    ".ipr-qfd-c h4{margin:12px 0 4px;font:600 12px/1.3 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#666)}" +
    ".ipr-qfd-c h4 small{text-transform:none;letter-spacing:0;font-weight:400}" +
    ".ipr-qfd-c ul{margin:0;padding-left:18px}.ipr-qfd-c li{margin:1px 0}" +
    ".ipr-qfd-c li small{color:var(--mu,#666)}" +
    ".ipr-qfd-c label.ipr-qfd-j{display:flex;gap:8px;align-items:center;margin:12px 0 4px;min-height:40px;cursor:pointer}" +
    ".ipr-qfd-c label.ipr-qfd-j input{width:20px;height:20px}" +
    ".ipr-qfd-acc{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px}" +
    ".ipr-qfd-acc button,.ipr-qfd-acc a{min-height:40px;padding:8px 14px;border-radius:8px;border:1px solid var(--ln,#ccc);background:transparent;color:var(--tx,#222);font:600 13px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}" +
    ".ipr-qfd-acc .ac{background:var(--ac,#c49a3c);border-color:var(--ac,#c49a3c);color:var(--bg,#fff)}" +
    ".ipr-qfd-acc button:disabled{opacity:.5;cursor:default}" +
    ".ipr-qfd-msg{min-height:20px;margin:4px 0;font-size:13px;color:var(--ac2,var(--tx,#222))}.ipr-qfd-msg a{color:inherit}" +
    ".ipr-qfd-c details{margin-top:8px;border-top:1px solid var(--ln,#ccc);padding-top:8px}" +
    ".ipr-qfd-c summary{cursor:pointer;font-weight:600;min-height:32px;display:flex;align-items:center}" +
    ".ipr-qfd-c ol{margin:6px 0 0;padding-left:20px}.ipr-qfd-c ol li{margin:3px 0}" +
    ".ipr-qfd-x{float:right;min-width:40px;min-height:40px;margin:-8px -8px 0 0;border:0;background:transparent;color:var(--mu,#666);font-size:22px;cursor:pointer}";
  function estilo() { if (document.getElementById("ipr-qf-css")) return; var s = el("style"); s.id = "ipr-qf-css"; s.textContent = CSS; document.head.appendChild(s); }
  var ICONE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M12 7.5c-1.7 0-3 1.3-3 3 0 2.2 3 5 3 5s3-2.8 3-5c0-1.7-1.3-3-3-3z"/><circle cx="12" cy="10.5" r=".8"/></svg>';

  var aberta = null, emCurso = null; // emCurso: AbortController do trabalho em curso
  function fecharJanela() {
    if (emCurso) { try { emCurso.abort(); } catch (e) {} emCurso = null; } // fechar pelo × cancela a transferência
    if (aberta) { try { aberta.remove(); } catch (e) {} aberta = null; document.removeEventListener("keydown", tecla); }
  }
  function tecla(e) { if (e.key === "Escape" && !emCurso) fecharJanela(); } // durante um trabalho, Esc não fecha
  function janela(m) {
    fecharJanela(); estilo();
    var S = servicos(), qf = qfDe(m), temZip = !!(window.JSZip && qf), ocupado = false;
    var fundo = el("div", "ipr-qfd"); fundo.setAttribute("role", "dialog"); fundo.setAttribute("aria-modal", "true"); fundo.setAttribute("aria-labelledby", "ipr-qfd-t");
    var c = el("div", "ipr-qfd-c"); fundo.appendChild(c);
    var xb = el("button", "ipr-qfd-x", "×"); xb.type = "button"; xb.setAttribute("aria-label", t("fechar")); xb.title = t("fechar"); c.appendChild(xb);
    var h = el("h3", "", t("titulo") + " · " + (m.local || t("semNome"))); h.id = "ipr-qfd-t"; c.appendChild(h);
    c.appendChild(el("p", "", t("l1"))); c.appendChild(el("p", "", t("l2")));
    if (!qf) c.appendChild(el("p", "", t("semPac")));
    if (S.vao.length) {
      var h4 = el("h4", "", t("vao") + " "); h4.appendChild(el("small", "", "(" + t("vaoN") + ")")); c.appendChild(h4);
      var ul = el("ul"); S.vao.forEach(function (d) { var li = el("li", "", d.n); if (d.fonte) { li.appendChild(document.createTextNode(" ")); li.appendChild(el("small", "", "· " + d.fonte)); } ul.appendChild(li); }); c.appendChild(ul);
    } else c.appendChild(el("p", "", t("nenhuma")));
    if (S.fora.length) {
      c.appendChild(el("h4", "", t("fora")));
      var uf = el("ul"); S.fora.forEach(function (f) { var li = el("li", "", f.n + " "); li.appendChild(el("small", "", "· " + f.motivo)); uf.appendChild(li); }); c.appendChild(uf);
    }
    var ck = null, ckN = null;
    if (S.vao.length && temZip) {
      var lb = el("label", "ipr-qfd-j"); ck = el("input"); ck.type = "checkbox"; ck.checked = true; lb.appendChild(ck); lb.appendChild(el("span", "", t("juntar") + " (" + S.vao.length + ")")); c.appendChild(lb);
    }
    if (temZip) { // decisão do Nuno, 30/10, 18h40: notas de campo também no pacote completo, ligadas por omissão
      var lbN = el("label", "ipr-qfd-j"); ckN = el("input"); ckN.type = "checkbox"; ckN.checked = true; ckN.setAttribute("data-ipr-qf-notas", "1"); lbN.appendChild(ckN); lbN.appendChild(el("span", "", t("juntarN"))); c.appendChild(lbN);
    }
    var acc = el("div", "ipr-qfd-acc"), msg = el("div", "ipr-qfd-msg"); msg.setAttribute("aria-live", "polite");
    var bP = null, bL = null;
    if (temZip) { bP = el("button", "ac", t("preparar")); bP.type = "button"; acc.appendChild(bP); }
    if (qf) { var ao = el("a", "", t("original")); ao.href = qf.url; ao.download = qf.nome; ao.target = "_blank"; ao.rel = "noopener"; acc.appendChild(ao); }
    if (window.JSZip) { bL = el("button", qf ? "" : "ac", t("leve")); bL.type = "button"; bL.title = t("leveT"); acc.appendChild(bL); }
    c.appendChild(acc); c.appendChild(msg);
    var det = el("details"); det.appendChild(el("summary", "", t("como")));
    var ol = el("ol"); ["c1", "c2", "c3", "c4", "c5"].forEach(function (k) { ol.appendChild(el("li", "", t(k))); }); det.appendChild(ol);
    if (!qf || movel()) det.open = true;
    c.appendChild(det);
    function trancar(v) {
      ocupado = v; [bP, bL].forEach(function (b) { if (b) b.disabled = v; });
      if (v) emCurso = window.AbortController ? new AbortController() : { abort: function () { this.signal.aborted = true; }, signal: { aborted: false } };
      else emCurso = null;
      return emCurso && emCurso.signal;
    }
    function falhou(e) {
      var s = String(e && e.message || e || "");
      if (e && e.name === "AbortError") { msg.textContent = t("cancelado"); return; }
      if (e && e.limite) { msg.textContent = fmt(t("grandeMax"), mb(LIMITE)); if (bL) { bL.classList.add("ac"); try { bL.focus(); } catch (x) {} } return; }
      msg.textContent = s === "semqgz" ? t("erroZip") : /^HTTP/.test(s) ? fmt(t("erroDesc"), s) : (e && (e.name === "RangeError" || /memory|allocation/i.test(s))) ? t("erroMem") : fmt(t("erro"), s || "?");
    }
    if (bP) bP.addEventListener("click", function () {
      if (ocupado) return; var sinal = trancar(true);
      pacoteCompleto(m, S.vao, !ck || ck.checked, !ckN || ckN.checked, msg, sinal).catch(falhou).then(function () { trancar(false); });
    });
    if (bL) bL.addEventListener("click", function () {
      if (ocupado) return; var sinal = trancar(true);
      pacoteLeve(m, S.vao, msg, sinal).catch(falhou).then(function () { trancar(false); });
    });
    xb.addEventListener("click", fecharJanela);
    fundo.addEventListener("click", function (e) { if (e.target === fundo && !ocupado) fecharJanela(); });
    document.addEventListener("keydown", tecla);
    (document.getElementById("ipe") || document.body).appendChild(fundo);
    aberta = fundo;
    try { (bP || bL || xb).focus(); } catch (e) {}
  }

  // ---------- botões nos cartões e na linha aberta de «Os meus projectos» ----------
  function botao(m, cls) {
    var b = el("button", cls); b.type = "button"; b.setAttribute("data-ipr-qf", String(m.id)); b.title = t("botaoT");
    b.innerHTML = ICONE; b.appendChild(el("span", "", t("botao")));
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); try { janela(m); } catch (x) {} });
    return b;
  }
  function porId(id) { var P = est(); var l = (P && P.mapas) || []; for (var i = 0; i < l.length; i++) if (String(l[i] && l[i].id) === String(id)) return l[i]; return null; }
  function injectar() {
    var P = est(); if (!P || !Array.isArray(P.mapas)) return;
    estilo();
    // 1. Cartões do separador Projectos (app.js): depois da lista de descargas, ou no fim do corpo do cartão.
    document.querySelectorAll("#ipe-proj article.ipe-card[data-i]").forEach(function (card) {
      try {
        var m = P.mapas[+card.getAttribute("data-i")];
        var ja = card.querySelector(".ipr-qf-campo");
        if (ja) { if (m && ja.getAttribute("data-m") === String(m.id)) return; ja.remove(); }
        if (!entregue(m)) return;
        var box = el("div", "ipr-qf-campo"); box.setAttribute("data-m", String(m.id));
        box.appendChild(botao(m, "ipe-b ipe-b--s ipr-qf-b"));
        var fl = card.querySelector("ul.ipe-fl"), cx = card.querySelector(".ipe-cx") || card;
        if (fl && fl.parentNode) fl.parentNode.insertBefore(box, fl.nextSibling); else cx.appendChild(box);
      } catch (e) {}
    });
    // 2. Linha aberta da Base na barra da esquerda (minhas-bases.js).
    document.querySelectorAll("#ipr-mb li.ipr-mb-b[data-mb] .ipr-mb-acc").forEach(function (acc) {
      try {
        if (acc.querySelector("[data-ipr-qf]")) return;
        var li = acc.closest("li.ipr-mb-b"), m = porId(li && li.getAttribute("data-mb"));
        if (!entregue(m)) return;
        acc.appendChild(botao(m, "ipr-qf-mb"));
      } catch (e) {}
    });
  }
  function relinguar() {
    document.querySelectorAll("[data-ipr-qf]").forEach(function (b) { try { b.title = t("botaoT"); var s = b.querySelector("span"); if (s) s.textContent = t("botao"); } catch (e) {} });
  }

  var tm = null;
  function nosso(n) { return n && n.nodeType === 1 && n.matches && (n.matches(".ipr-qfd, .ipr-qf-campo, [data-ipr-qf], #ipr-qf-css") || (n.closest && n.closest(".ipr-qfd"))); }
  function soNosso(ms) {
    return ms.every(function (r) {
      var alvo = r.target && r.target.nodeType === 1 ? r.target : r.target && r.target.parentElement;
      if (alvo && alvo.closest && alvo.closest(".ipr-qfd")) return true; // texto e progresso dentro da janela
      var ns = [].slice.call(r.addedNodes || []).concat([].slice.call(r.removedNodes || []));
      return ns.length > 0 && ns.every(nosso);
    });
  }
  function agendar(ms) { if (ms && soNosso(ms)) return; if (tm) return; tm = setTimeout(function () { tm = null; try { injectar(); } catch (e) {} }, 150); }
  function arrancar() {
    try { injectar(); } catch (e) {}
    try { new MutationObserver(agendar).observe(document.getElementById("ipe") || document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  document.addEventListener("ipr:lingua", function () { try { relinguar(); } catch (e) {} });
  function comNonce() {
    if (window.tcdNonce) { arrancar(); return; }
    var n = 0, iv = setInterval(function () { if (window.tcdNonce) { clearInterval(iv); arrancar(); } else if (++n > 240) clearInterval(iv); }, 500); // até 2 minutos
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comNonce); else comNonce();

  // Para ensaio (sem efeitos): window.__iprQFieldTeste.juntarAoQgs(texto, defs), .qgsLeve(m, defs), .servicos()
  window.__iprQFieldTeste = { juntarAoQgs: juntarAoQgs, qgsLeve: qgsLeve, servicos: servicos, camadasQgis: camadasQgis, resolverAgs: resolverAgs };
})();
