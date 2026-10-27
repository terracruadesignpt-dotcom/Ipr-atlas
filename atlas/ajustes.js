/* IPR Atlas · ajustes do ecrã de computador (pedido do Miguel, reporte #15889, 22/10/2026, 22h14; aprovado pelo Nuno às 23h32).
   Só acrescenta: não altera o app.js nem retira funções. Cada ajuste falha em silêncio se o elemento não existir.
   1. Marca: IPR (sigla de regenerativo.pt) e «Instituto de Planeamento Regenerativo» no lugar do logótipo e do nome da Terracrua Design.
   2. Painéis da esquerda e da direita mais estreitos por omissão e com largura ajustável (arrastar a margem; duplo clique repõe).
   3. Créditos do mapa recolhidos num «i» também no computador.
   4. Nome ao passar o rato em todos os botões da barra de ferramentas e dos controlos do mapa (em português).
   5. Barra de estado: um só sistema de coordenadas de cada vez (clique troca WGS84 / PT-TM06); «Z» passa a «Zoom» com explicação.
   6. Janela da Formiga arrastável pelo cabeçalho (computador).
   7. Com sessão, «Os meus projectos» na barra da esquerda lista os terrenos e os projectos da IPR Cloud (ver abaixo).
   10. Barra de estado editável (pedido do Nuno, 22/10, 23h52): clicar na escala, no zoom, na rotação, na inclinação ou na altitude
       do olho e escrever o valor (ex.: 25000 ou 1:25 000). A rotação mostra também o rumo (N, NE, SSO…). Nova casa «Incl.».
   11. «Reportar problema» da barra de estado escondido quando há Formiga (pedido do Nuno, 22/10, 23h53: evitar redundância;
       a Formiga já reporta com imagem e áudio). O botão continua no código e volta se a Formiga não existir.
   12. Roda do rato sobre a rosa dos ventos inclina a vista (3D).
   13. Caderneta predial em PDF: lê o artigo e a freguesia e leva o mapa ao terreno.
   14. Equipa: «Processar» sem formulário de cliente (dados da sessão, via m90297).
   15. Barra da esquerda só com Pesquisar e Camadas; projectos e «Comece aqui» no painel da direita.
   16. Separador Projectos: sem título repetido, projectos em linhas curtas, ficha do terreno na lista de ficheiros (equipa). */
(function () {
  "use strict";
  // §44 No máximo 3 pedidos ao site ao mesmo tempo (24/10, 22h04: «Error establishing a database connection» durante um
  // minuto, quando o Atlas pediu de uma vez muitas camadas da organização, notas, locais e diário; o alojamento tem um
  // limite de ligações à base de dados). Só os pedidos a /wp-json/ deste site esperam na fila; tudo o resto segue igual.
  (function filaPedidos() {
    if (!window.fetch || window.__iprFila) return; window.__iprFila = 1;
    // mosaicos pelo proxy do site (viz/px, wms) têm fila própria de 4, para o mapa não ficar à espera das outras leituras
    var orig = window.fetch.bind(window), F = { api: { max: 3, n: 0, q: [] }, mos: { max: 4, n: 0, q: [] } };
    function tipo(u) { try { var x = new URL(typeof u === "string" ? u : (u && u.url) || "", location.href); if (x.origin !== location.origin || x.pathname.indexOf("/wp-json/") !== 0) return null; return /\/tcd\/v1\/(viz\/px|wms\/)/.test(x.pathname) ? "mos" : "api"; } catch (e) { return null; } }
    function proximo(f) { while (f.n < f.max && f.q.length) { var t = f.q.shift(); f.n++; t(); } }
    window.fetch = function (u, o) {
      var k = tipo(u); if (!k) return orig(u, o);
      var f = F[k];
      return new Promise(function (res, rej) {
        f.q.push(function () { orig(u, o).then(res, rej).finally(function () { f.n--; proximo(f); }); });
        proximo(f);
      });
    };
  })();
  // §70 Erros de JavaScript registados (tcd_acp_erros, 21/10 a 26/10/2026: «this.style is undefined», «reading 'getSource'»,
  // «h.getStyle().layers», «reading 'shaderPreludeCode'»). O mapa principal é destruído e criado de novo quando se muda de modo
  // (encomenda, projecto de cliente); várias funções ficam com a referência ao mapa antigo e chamam-no em respostas que chegam
  // depois (fetch, setTimeout, observadores). Num mapa já removido o MapLibre apaga o estilo e o pintor, e qualquer chamada
  // rebenta. Guarda única, no protótipo: num mapa removido (ou sem estilo) estas leituras e escritas não fazem nada e devolvem
  // um valor neutro. Num mapa vivo nada muda.
  (function guardaMapa() {
    var ML = window.maplibregl, P = ML && ML.Map && ML.Map.prototype; if (!P || P.__iprGuarda) return; P.__iprGuarda = 1;
    function morto(m) { return !m || m._removed || !m.style; }
    // Revisão de 27/10: a guarda não pode esconder as referências antigas ao mapa. Um aviso por método e por sessão na consola
    // e no registo de erros da equipa (tcd_acp_erros, pelo window.onerror existente), para continuarem visíveis.
    var avisados = {};
    function avisar(k) {
      if (avisados[k]) return; avisados[k] = 1;
      try { console.warn("IPR Atlas: chamada a um mapa já removido (" + k + "); a referência ao mapa ficou antiga."); } catch (e) {}
      try { setTimeout(function () { throw new Error("IPR Atlas §70: mapa removido, " + k); }, 0); } catch (e) {}
    }
    var neutro = { queryRenderedFeatures: function () { return []; }, querySourceFeatures: function () { return []; },
      getStyle: function () { return { version: 8, sources: {}, layers: [] }; }, isStyleLoaded: function () { return false; },
      hasImage: function () { return false; }, getLayersOrder: function () { return []; } };
    ["getSource", "getLayer", "addSource", "removeSource", "addLayer", "removeLayer", "moveLayer", "setPaintProperty", "setLayoutProperty",
      "getPaintProperty", "getLayoutProperty", "setFilter", "getFilter", "setTerrain", "getTerrain", "addImage", "removeImage", "setFeatureState",
      "removeFeatureState", "getFeatureState", "queryRenderedFeatures", "querySourceFeatures", "getStyle", "isStyleLoaded", "hasImage",
      "getLayersOrder", "setSky", "setLight"].forEach(function (k) {
      var f = P[k]; if (typeof f !== "function") return;
      P[k] = function () {
        if (morto(this)) { avisar(k); return neutro[k] ? neutro[k]() : (/^(add|remove|set|move)/.test(k) ? this : undefined); }
        return f.apply(this, arguments);
      };
    });
    // «Cannot read properties of undefined (reading 'bind')» em cada fotograma (reporte 16262 e registo de 26/10): quando uma
    // fonte raster é recarregada (setTiles no fundo 3D, refreshTiles, mudança de dados), o MapLibre 5.24 passa os mosaicos que
    // tinham falhado a «expired»; nesse estado conta como tendo dados e o pintor tenta desenhar um mosaico sem textura.
    // Correcção: um mosaico raster sem textura que volta a ser pedido fica «loading» (não se desenha) até chegar a imagem.
    function corrigirRaster(src) {
      var Q = src && src.type === "raster" && Object.getPrototypeOf(src);
      if (!Q || Q.__iprTex || typeof Q.loadTile !== "function") return; Q.__iprTex = 1;
      var lt = Q.loadTile;
      Q.loadTile = function (tile) {
        if (tile && !tile.texture && (tile.state === "expired" || tile.state === "reloading")) tile.state = "loading";
        var r = lt.apply(this, arguments);
        // Revisão de 27/10: se o pedido terminar sem imagem nem erro, o mosaico não pode ficar «loading» para sempre.
        Promise.resolve(r).then(function () { if (tile && tile.state === "loading" && !tile.texture) tile.state = "errored"; }, function () {});
        return r;
      };
    }
    var addS = P.addSource;
    if (typeof addS === "function") P.addSource = function (id) { var r = addS.apply(this, arguments); try { corrigirRaster(this.getSource(id)); } catch (e) {} return r; };
    (function existentes(n) { // fontes que já existiam antes deste ficheiro carregar
      var M = window.__ipe && window.__ipe.mapa;
      if (M && M.style && M.style.tileManagers) { try { Object.keys(M.style.tileManagers).forEach(function (k) { corrigirRaster(M.getSource(k)); }); } catch (e) {} }
      if (n < 20) setTimeout(function () { existentes(n + 1); }, 1500);
    })(0);
    // Movimentos e redimensionamentos num mapa removido também saem sem fazer nada (o pintor já não existe).
    ["resize", "easeTo", "flyTo", "jumpTo", "fitBounds", "setBearing", "setPitch", "setZoom", "setCenter", "triggerRepaint"].forEach(function (k) {
      var f = P[k]; if (typeof f !== "function") return;
      P[k] = function () { if (this && this._removed) return this; return f.apply(this, arguments); };
    });
  })();
  var SIGLA = "https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@3c382ba8826863c1dc0de2142ba8c2c5038e532b/atlas/marca/ipr-sigla.png";
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }
  function desk() { return window.matchMedia && window.matchMedia("(min-width:901px)").matches; }

  // 1. Marca IPR
  function marca() {
    var a = document.querySelector(".ipe-marca"); if (!a || a.getAttribute("data-ipr")) return !!a;
    a.setAttribute("data-ipr", "1");
    a.title = "IPR Atlas · Instituto de Planeamento Regenerativo";
    var im = a.querySelector("img"); if (im) { im.style.display = "none"; im.alt = ""; } // 22/10, 23h47: sem imagem, só o nome (pedido do Nuno)
    a.classList.add("ipr-marca-txt");
    var sp = a.querySelector("span"); if (sp) sp.textContent = "Instituto de Planeamento Regenerativo";
    return true;
  }

  // 2. Larguras ajustáveis
  var LIM = { wl: [180, 560, 260], wr: [200, 600, 320] };
  function aplicarLarg(ipe) {
    ["wl", "wr"].forEach(function (k) { var v = +ler("tcd_atlas_" + k); if (v >= LIM[k][0] && v <= LIM[k][1]) ipe.style.setProperty("--ipr-" + k, v + "px"); });
  }
  function puxadores() {
    var ipe = document.getElementById("ipe"); if (!ipe || document.querySelector(".ipr-px")) return !!ipe;
    aplicarLarg(ipe);
    ["wl", "wr"].forEach(function (k) {
      var h = document.createElement("div"); h.className = "ipr-px ipr-px-" + k; h.title = "Arraste para ajustar a largura (duplo clique repõe)";
      h.setAttribute("role", "separator"); h.setAttribute("aria-orientation", "vertical");
      ipe.appendChild(h);
      h.addEventListener("pointerdown", function (ev) {
        if (!desk()) return; ev.preventDefault(); h.setPointerCapture(ev.pointerId); ipe.classList.add("ipr-arrastar");
        function mv(e) {
          var v = k === "wl" ? e.clientX : window.innerWidth - e.clientX;
          v = Math.max(LIM[k][0], Math.min(LIM[k][1], Math.round(v)));
          ipe.style.setProperty("--ipr-" + k, v + "px"); gravar("tcd_atlas_" + k, v);
          var I = mapa(); if (I && I.resize) I.resize();
        }
        function up() { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); ipe.classList.remove("ipr-arrastar"); var I = mapa(); if (I && I.resize) I.resize(); posicoes(); }
        h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up);
      });
      h.addEventListener("dblclick", function () { ipe.style.removeProperty("--ipr-" + k); gravar("tcd_atlas_" + k, ""); var I = mapa(); if (I && I.resize) setTimeout(function () { I.resize(); }, 50); });
    });
    var I = mapa(); if (I && I.resize) setTimeout(function () { I.resize(); }, 300);
    return true;
  }

  // 3. Créditos num «i»
  function creditos() {
    var at = document.querySelector("#ipe .maplibregl-ctrl-attrib"); if (!at) return false;
    function compacto() { if (!at.classList.contains("maplibregl-compact")) at.classList.add("maplibregl-compact"); }
    compacto();
    if (!at.getAttribute("data-ipr")) {
      at.setAttribute("data-ipr", "1"); at.classList.remove("maplibregl-compact-show");
      try { new MutationObserver(compacto).observe(at, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
    }
    return true;
  }

  // 4. Nomes ao passar o rato
  var PT = { "Zoom in": "Aproximar", "Zoom out": "Afastar", "Drag to rotate map, click to reset north": "Rodar o mapa (arrastar); clique para voltar ao norte", "Reset bearing to north": "Voltar ao norte", "Find my location": "A minha localização", "Location not available": "Localização indisponível", "Toggle attribution": "Créditos do mapa", "Enter fullscreen": "Ecrã inteiro", "Exit fullscreen": "Sair do ecrã inteiro" };
  function nomes() {
    var n = 0;
    [].forEach.call(document.querySelectorAll("#ipe .ipe-tools button, #ipe .ipe-t, #ipe .ipe-ib, #ipe .maplibregl-ctrl button"), function (b) {
      var al = b.getAttribute("aria-label") || ""; var t = PT[al] || PT[b.title] || "";
      if (t) { b.title = t; b.setAttribute("aria-label", t); n++; }
      else if (!b.title && al) { b.title = al; n++; }
    });
    return n > 0;
  }

  // 5. Barra de estado: um sistema de coordenadas de cada vez; «Zoom»
  function estado() {
    var st = document.querySelector("#ipe .ipe-st"); if (!st) return false;
    var cs = [].filter.call(st.children, function (e) { var b = e.firstElementChild; return b && /^(WGS84|PT-TM06)$/.test((b.textContent || "").trim()); });
    if (cs.length === 2 && !st.getAttribute("data-ipr")) {
      st.setAttribute("data-ipr", "1");
      var vis = ler("tcd_atlas_crs") === "PT-TM06" ? 1 : 0;
      function mostrar() { cs.forEach(function (e, i) { e.classList.toggle("ipr-oculto", i !== vis); e.classList.add("ipr-crs"); e.title = (i === 0 ? "Coordenadas geográficas (WGS84)" : "Coordenadas PT-TM06 / ETRS89") + ". Clique para trocar de sistema."; }); }
      cs.forEach(function (e) { e.addEventListener("click", function () { vis = vis ? 0 : 1; gravar("tcd_atlas_crs", vis ? "PT-TM06" : "WGS84"); mostrar(); }); });
      mostrar();
    }
    [].forEach.call(st.children, function (e) { var b = e.firstElementChild; if (b && (b.textContent || "").trim() === "Z") { b.textContent = "Zoom"; e.title = "Nível de aproximação do mapa: 0 é o mundo inteiro, 20 é o pormenor máximo."; } });
    return true;
  }

  // 6. Janelas da Formiga e do «Reportar» arrastáveis pelo cabeçalho, em qualquer ecrã (rato, dedo ou caneta).
  //    22/10, 00h30 (reporte #15893, iPad): a janela do reporte não abria toda e ficava presa; passa a caber no ecrã e a mexer.
  function formiga() {
    var p = document.getElementById("tcdfm"); if (!p || p.getAttribute("data-ipr")) return !!p;
    var h = p.querySelector("header"); if (!h) return false;
    p.setAttribute("data-ipr", "1"); h.style.cursor = "move"; h.style.touchAction = "none"; h.title = "Arraste para mudar a janela de sítio";
    return true;
  }
  document.addEventListener("pointerdown", function (ev) {
    var t = ev.target; if (!t.closest || t.closest("button,a,input,textarea,select")) return;
    var h = t.closest("#tcdfm header, .tcdr2-p h3"); if (!h) return;
    var p = h.closest("#tcdfm, .tcdr2-p"); if (!p) return;
    var r = p.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    ev.preventDefault(); try { h.setPointerCapture(ev.pointerId); } catch (e) {}
    function mv(e) {
      var x = Math.max(0, Math.min(window.innerWidth - Math.min(r.width, window.innerWidth), e.clientX - dx)), y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dy));
      p.style.setProperty("left", x + "px", "important"); p.style.setProperty("top", y + "px", "important");
      p.style.setProperty("bottom", "auto", "important"); p.style.setProperty("right", "auto", "important");
      p.style.setProperty("width", r.width + "px", "important");
      p.style.setProperty("max-height", "calc(100dvh - " + Math.round(y + 12) + "px)", "important");
    }
    function up() { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up); }
    h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up);
  }, true);

  // 7. «Os meus projectos» (reportes #15886 do Nuno e #15889 do Miguel): com sessão, a lista do entrada.js (cartão «Os meus
  //    terrenos») passa para dentro do grupo «Os meus projectos» da barra, que abre só quando a pessoa quer; junta os
  //    projectos da IPR Cloud; botões leves que dizem só «Abrir». Sem sessão, o cartão «Comece aqui» fica como está.
  var nuvem = null;
  function haTxt(n) { n = +n; return n ? (n >= 100 ? Math.round(n) : n.toFixed(1)).toString().replace(".", ",") + " ha" : ""; }
  function escH(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function irNuvem(c) {
    var I = mapa(); if (!I) return; var b = c.bbox;
    try {
      if (b && b.length === 4) I.fitBounds([[+b[0], +b[1]], [+b[2], +b[3]]], { padding: 80, maxZoom: 16.5, duration: 900 });
      else if (c.centro && c.centro.length === 2) I.flyTo({ center: [+c.centro[0], +c.centro[1]], zoom: 15, duration: 900 });
    } catch (e) {}
  }
  function acertarLista(sec) {
    if (sec.getAttribute("data-ipr-a")) return; sec.setAttribute("data-ipr-a", "1");
    var h3 = sec.querySelector("h3"); if (h3) h3.textContent = "Os meus projectos";
    [].forEach.call(sec.querySelectorAll("a.tme-b"), function (a) { if (/Abrir/.test(a.textContent)) a.textContent = "Abrir"; });
    [].forEach.call(sec.querySelectorAll("p"), function (p) { p.textContent = p.textContent.replace("Ainda não tem terrenos", "Ainda não tem projectos"); });
    var lista = (nuvem || []).filter(function (c) { return c && (c.nome || c.codigo); });
    if (lista.length) {
      var ul = sec.querySelector(".tme-l");
      if (!ul) { ul = document.createElement("ul"); ul.className = "tme-l"; var pp = sec.querySelector("p"); if (pp && /projectos/.test(pp.textContent)) pp.remove(); var acc = sec.querySelector(".tme-acc"); sec.insertBefore(ul, acc || null); }
      lista.forEach(function (c, i) {
        var li = document.createElement("li"); li.className = "tme-t ipr-nuvem";
        li.innerHTML = "<b>" + escH(c.nome || c.codigo) + "</b><small>" + escH([haTxt(c.area_ha), c.local, "IPR Cloud"].filter(Boolean).join(" · ")) + "</small><button type=\"button\" class=\"tme-b\">Abrir</button>";
        li.querySelector("button").addEventListener("click", function () { irNuvem(c); });
        ul.appendChild(li);
      });
    }
    var n = sec.querySelectorAll(".tme-t").length, cont = document.getElementById("ipc-loc-n");
    if (cont && n) { cont.textContent = String(n); cont.title = n + " projecto(s)"; }
  }
  function projectos() {
    if (!window.tcdNonce) return true;
    var sec = document.getElementById("tme"), dentro = document.getElementById("ipe-locais");
    if (!sec || !dentro) return false;
    if (sec.parentNode !== dentro) { sec.classList.add("tme-dentro"); dentro.insertBefore(sec, dentro.firstChild); }
    acertarLista(sec);
    if (!sec.getAttribute("data-ipr-o")) {
      sec.setAttribute("data-ipr-o", "1");
      try { new MutationObserver(function () { sec.removeAttribute("data-ipr-a"); acertarLista(sec); }).observe(sec, { childList: true }); } catch (e) {}
    }
    if (nuvem === null) {
      nuvem = [];
      fetch("/wp-json/tcd/v1/cloud/meus", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { nuvem = d && d.terrenos ? d.terrenos : []; sec.removeAttribute("data-ipr-a"); acertarLista(sec); })
        .catch(function () {});
    }
    return true;
  }

  // 8. Botão da Formiga no canto inferior esquerdo do mapa (não por cima da barra das camadas) e «Cookies» acima da barra de estado.
  function posicoes() {
    var esq = document.getElementById("ipe-esq"), ipe = document.getElementById("ipe"); if (!ipe) return;
    var x = 14; if (desk() && esq && !ipe.classList.contains("sem-esq")) { var r = esq.getBoundingClientRect(); if (r.width > 40) x = Math.round(r.right) + 14; }
    document.documentElement.style.setProperty("--ipr-fm-left", x + "px");
    var ck = document.getElementById("tcdck-l"); if (ck) { if (desk()) { ck.style.setProperty("bottom", "36px", "important"); ck.style.setProperty("left", x + "px", "important"); } else { ck.style.removeProperty("bottom"); ck.style.removeProperty("left"); } }
  }
  // 9. «Ver no mapa» nos projectos da IPR Cloud (e outras ligações /atlas/?v=lat,lng,zoom dentro do Atlas): voa até ao terreno
  //    sem recarregar a página. Antes, a página recarregava e a apresentação de abertura levava o mapa para outro sítio.
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("#ipe a[href*='/atlas/?v=']"); if (!a) return;
    var m = /[?&]v=([-0-9.]+),([-0-9.]+),([0-9.]+)/.exec(a.getAttribute("href") || ""), I = mapa(); if (!m || !I) return;
    var p = +m[1], q = +m[2], z = +m[3] || 15, lat = Math.abs(p) >= Math.abs(q) ? p : q, lng = lat === p ? q : p;
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 85) return;
    ev.preventDefault(); ev.stopPropagation();
    try {
      I.stop(); I.flyTo({ center: [lng, lat], zoom: z, pitch: 0, bearing: 0, duration: 1200 });
      setTimeout(function () { try { var c = I.getCenter(); if (Math.abs(c.lng - lng) > 0.01 || Math.abs(c.lat - lat) > 0.01) { I.stop(); I.jumpTo({ center: [lng, lat], zoom: z, pitch: 0, bearing: 0 }); } } catch (e) {} }, 1800);
    } catch (e) { location.href = a.href; }
    if (!desk()) { var f = document.querySelector("#ipe .ipe-dir-x, #ipe [data-fechar-dir]"); if (f) f.click(); }
  }, true);

  // 10. Barra de estado editável
  var RUMOS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  function num(t) { t = String(t || "").trim().replace(/[\s ]/g, "").replace(",", "."); var k = /km$/i.test(t); t = t.replace(/[a-z°º]+$/i, ""); var v = parseFloat(t); if (!isFinite(v)) return NaN; return k ? v * 1000 : v; }
  function escala(t) { t = String(t || "").replace(/[\s ]/g, ""); if (/:/.test(t) || (t.match(/\./g) || []).length > 1) t = t.replace(/^1[:.](?=\d)/, ""); t = t.replace(/\D/g, ""); return t ? +t : NaN; }
  function rumo(b) { return RUMOS[Math.round(((b % 360) + 360) % 360 / 22.5) % 16]; }
  function mpp(I) { return 156543.03392 * Math.cos(I.getCenter().lat * Math.PI / 180); }
  var CAMPOS = {
    "ipe-esc": { t: "Escala do ecrã. Clique e escreva a escala que quer (ex.: 25000 ou 1:25 000).", f: function (I, v) { if (v < 50) return; I.jumpTo({ zoom: Math.log2(mpp(I) * 96 / 0.0254 / v) }); } },
    "ipe-z": { t: "Nível de aproximação do mapa: 0 é o mundo inteiro, 20 é o pormenor máximo. Clique para escrever um valor.", f: function (I, v) { I.jumpTo({ zoom: Math.max(0, Math.min(22, v)) }); } },
    "ipe-rot": { t: "Rotação do mapa em graus, de 0 a 360, contados a partir do norte no sentido dos ponteiros do relógio: é o rumo para onde aponta o topo do ecrã (0° norte, 90° este, 180° sul, 270° oeste). Clique para escrever; 0 volta ao norte.", f: function (I, v) { I.jumpTo({ bearing: ((v % 360) + 360) % 360 }); } },
    "ipr-incl": { t: "Inclinação da vista em graus: 0° é a vista de cima, até 85° é a vista rasante. Clique para escrever.", f: function (I, v) { I.jumpTo({ pitch: Math.max(0, Math.min(85, v)) }); } },
    "ipe-olho": { t: "Altitude do ponto de vista (como num globo). Clique e escreva o valor: só o número usa a unidade que está à vista (com 3 km, escrever 2 vai para 2 km); também aceita 500 m ou 2 km.", f: function (I, v) { if (v < 20) return; var c = I.getCanvas(), h = (c && c.clientHeight) || 600, k = h / 2 / Math.tan(0.32175) * Math.cos(I.getPitch() * Math.PI / 180); I.jumpTo({ zoom: Math.log2(mpp(I) * k / v) }); } }
  };
  function editavel() {
    var st = document.querySelector("#ipe .ipe-st"), I = mapa(); if (!st || !I || st.getAttribute("data-ipr-ed")) return !!(st && st.getAttribute("data-ipr-ed"));
    var rot = document.getElementById("ipe-rot"); if (!rot) return false;
    st.setAttribute("data-ipr-ed", "1");
    var sp = document.createElement("span"); sp.innerHTML = "<b>Incl.</b><em id=\"ipr-incl\">0°</em>"; rot.parentNode.parentNode.insertBefore(sp, rot.parentNode.nextSibling);
    var ru = document.createElement("small"); ru.className = "ipr-rumo"; rot.parentNode.appendChild(ru);
    function act() { try { document.getElementById("ipr-incl").textContent = Math.round(I.getPitch()) + "°"; var b = I.getBearing(); ru.textContent = rumo(b); } catch (e) {} }
    I.on("move", act); act();
    Object.keys(CAMPOS).forEach(function (id) {
      var em = document.getElementById(id); if (!em) return; var c = CAMPOS[id], s = em.parentNode;
      s.classList.add("ipr-ed"); s.title = c.t; em.setAttribute("tabindex", "0"); em.setAttribute("role", "button");
      function abrir() {
        if (s.querySelector("input.ipr-in")) return;
        var inp = document.createElement("input"); inp.className = "ipr-in"; inp.type = "text"; inp.inputMode = "decimal"; inp.value = (em.textContent || "").replace(/ /g, " ").replace(/°$/, ""); inp.setAttribute("aria-label", (s.querySelector("b") || {}).textContent || "");
        inp.style.width = Math.max(5, inp.value.length + 2) + "ch"; em.style.display = "none"; s.insertBefore(inp, em.nextSibling); inp.focus(); inp.select();
        var fim = false;
        function fechar(aplicar) { if (fim) return; fim = true; if (aplicar) { var v = id === "ipe-esc" ? escala(inp.value) : num(inp.value); if (id === "ipe-olho" && /^[\s\d.,]+$/.test(inp.value) && /km/.test(em.textContent || "")) v *= 1000; if (isFinite(v)) { try { I.stop(); c.f(I, v); } catch (e) {} } } inp.remove(); em.style.display = ""; }
        inp.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); fechar(true); } else if (e.key === "Escape") { fechar(false); } });
        inp.addEventListener("blur", function () { fechar(true); });
      }
      em.addEventListener("click", function (e) { e.stopPropagation(); abrir(); });
      em.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); abrir(); } });
    });
    return true;
  }

  // 11. Sem «Reportar problema» na barra quando há Formiga
  function semBug() {
    var b = document.getElementById("ipe-bug"); if (!b) return false;
    var fm = document.getElementById("tcdfmb"), s = b.parentNode;
    if (s) s.style.display = fm ? "none" : "";
    var bt = document.querySelector("#ipe .ipe-beta"); if (bt && fm) bt.title = "Plataforma em versão beta: pode encontrar falhas; conte à Formiga (canto de baixo, à esquerda).";
    return !!fm;
  }

  // 12. Rosa dos ventos: arrastar roda o mapa (já existia); a roda do rato por cima da rosa inclina a vista (3D).
  //     Pedido do Nuno, 23/10, 00h31. Não mexe no arrastar nem no clique que repõe o norte.
  function rosa() {
    var z = document.querySelector("#ipe .ipe-rosa"), I = mapa(); if (!z || !I) return false; if (z.getAttribute("data-ipr")) return true;
    z.setAttribute("data-ipr", "1");
    z.title = "Arraste a rosa para rodar o mapa. Com o rato por cima, a roda inclina a vista em 3D. Clique para orientar a norte e tirar a inclinação.";
    z.addEventListener("wheel", function (e) {
      e.preventDefault(); e.stopPropagation();
      var d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      try { I.stop(); I.setPitch(Math.max(0, Math.min(85, I.getPitch() - d * 0.12))); } catch (x) {}
    }, { passive: false, capture: true });
    return true;
  }

  // 13. Caderneta predial em PDF (reporte #15895, Nuno): ao escolher o PDF no método «Artigo matricial ou caderneta», lê o texto
  //     no próprio navegador (nada é enviado antes do pedido), preenche o artigo e a localidade e leva o mapa ao terreno:
  //     pelo NIC, quando a caderneta o tem (cadastro predial), senão pela freguesia. O ficheiro continua a seguir com o pedido.
  var PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/";
  function pdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (ok, ko) {
      var sc = document.createElement("script"); sc.src = PDFJS + "pdf.min.js"; sc.crossOrigin = "anonymous";
      sc.onload = function () {
        var L = window.pdfjsLib; if (!L) return ko();
        fetch(PDFJS + "pdf.worker.min.js").then(function (r) { return r.text(); }).then(function (t) {
          L.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([t], { type: "text/javascript" })); ok(L);
        }).catch(function () { L.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; ok(L); });
      };
      sc.onerror = ko; document.head.appendChild(sc);
    });
  }
  function textoPdf(f) {
    return pdfjs().then(function (L) { return f.arrayBuffer().then(function (b) { return L.getDocument({ data: b }).promise; }); }).then(function (doc) {
      var n = Math.min(doc.numPages, 4), ps = [];
      for (var i = 1; i <= n; i++) ps.push(doc.getPage(i).then(function (pg) { return pg.getTextContent(); }).then(function (c) { return c.items.map(function (it) { return it.str; }).join(" "); }));
      return Promise.all(ps).then(function (a) { return a.join("\n"); });
    });
  }
  function lerCaderneta(t) {
    t = t.replace(/\s+/g, " ");
    function g(re) { var m = re.exec(t); return m ? m[1].trim() : ""; }
    var o = {
      nic: g(/\b([A-Z]{3}\d{9})\b/),
      artigo: g(/ARTIGO\s+MATRICIAL\s*(?:N\.?\s*º|Nº|N\.º|:)?\s*:?\s*(\d+)/i) || g(/\bARTIGO\s*:?\s*(\d+)/i),
      seccao: g(/SEC[ÇC][ÃA]O\s*:?\s*([A-Z0-9]{1,4})\b/i),
      freguesia: g(/FREGUESIA\s*:?\s*\d*\s*-?\s*([A-ZÀ-Ý][A-ZÀ-Ý0-9 .,'()\/-]+?)(?=\s+(?:ARTIGO|SEC[ÇC][ÃA]O|NOME|LOCALIZA|LUGAR|S[ÍI]TIO|TIPO|DESCRI|NIP|CONFRONTA|$))/i),
      concelho: g(/CONCELHO\s*:?\s*\d*\s*-?\s*([A-ZÀ-Ý][A-ZÀ-Ý .'-]+?)(?=\s+FREGUESIA)/i),
      sitio: g(/(?:NOME\s*\/\s*LOCALIZA[ÇC][ÃA]O(?:\s+(?:DO\s+)?PR[ÉE]DIO)?|LOCALIZA[ÇC][ÃA]O\s+DO\s+PR[ÉE]DIO|S[ÍI]TIO|LUGAR)\s*:?\s*([A-ZÀ-Ý0-9][^:]{2,60}?)(?=\s+(?:CONFRONTA|[ÁA]REA|TIPO|NIP|DESCRI|ARTIGO|MATRIZ|VALOR|ANO)|\s+[A-ZÀ-Ý]{4,}\s*:|$)/i)
    };
    function cap(x) { return x.toLowerCase().replace(/(^|[\s(\/-])([a-zà-ý])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\b(De|Da|Do|Das|Dos|E|A)\b/g, function (m) { return m.toLowerCase(); }); }
    if (o.freguesia) o.freguesia = cap(o.freguesia.replace(/^UNI[ÃA]O DAS FREGUESIAS DE\s+/i, ""));
    if (o.concelho) o.concelho = cap(o.concelho);
    if (o.sitio) o.sitio = cap(o.sitio);
    return o;
  }
  function aviso(inp, msg) {
    var s = document.getElementById("ipr-cad-msg");
    if (!s) { s = document.createElement("small"); s.id = "ipr-cad-msg"; s.className = "ipe-small"; s.setAttribute("aria-live", "polite"); inp.parentNode.insertBefore(s, inp.nextSibling); }
    s.textContent = msg;
  }
  document.addEventListener("change", function (ev) {
    var inp = ev.target; if (!inp || inp.id !== "ipe-cad" || !inp.files || !inp.files[0]) return;
    var f = inp.files[0]; if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { aviso(inp, "Imagem recebida: segue com o pedido. Para localizar o terreno sozinho, use o PDF da caderneta."); return; }
    aviso(inp, "A ler a caderneta…");
    textoPdf(f).then(function (t) {
      var o = lerCaderneta(t), art = document.getElementById("ipe-artigo"), loc = document.getElementById("ipe-local"), feito = [];
      if (o.artigo && art && !art.value.trim()) { art.value = "artigo " + o.artigo + (o.seccao ? ", secção " + o.seccao : ""); feito.push("artigo " + o.artigo + (o.seccao ? " (secção " + o.seccao + ")" : "")); }
      var lugar = [o.sitio, o.freguesia, o.concelho].filter(Boolean).join(", ");
      if (lugar && loc && !loc.value.trim()) { loc.value = lugar; feito.push(lugar); }
      [art, loc].forEach(function (e) { if (e) e.dispatchEvent(new Event("input", { bubbles: true })); });
      var nic = document.getElementById("ipe-nic");
      if (o.nic && nic) {
        nic.value = o.nic; nic.dispatchEvent(new Event("input", { bubbles: true }));
        nic.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        aviso(inp, "Caderneta lida: " + (feito.join(" · ") || o.nic) + ". A procurar o prédio pelo NIC " + o.nic + " no cadastro.");
      } else if (o.freguesia) {
        var q = document.getElementById("ipe-q");
        if (q && q.form) {
          q.value = o.freguesia; try { q.form.requestSubmit(); } catch (e) {}
          var n = 0, cc = (o.concelho || "").toLowerCase();
          (function escolher() {
            var bs = [].slice.call(document.querySelectorAll("#ipe-qres button[data-res]"));
            if (!bs.length) { if (++n < 16) setTimeout(escolher, 400); return; }
            var b = bs.filter(function (x) { return cc && (x.textContent || "").toLowerCase().indexOf(cc) >= 0; })[0] || bs[0]; b.click();
          })();
        }
        aviso(inp, "Caderneta lida: " + feito.join(" · ") + ". O mapa vai à freguesia; escolha a parcela no mapa (o pedido também segue só com a caderneta).");
      } else {
        aviso(inp, feito.length ? "Caderneta lida: " + feito.join(" · ") + "." : "Não consegui ler o artigo nesta caderneta (pode ser uma imagem digitalizada). Segue com o pedido e nós localizamos.");
      }
    }).catch(function () { aviso(inp, "Não consegui ler este PDF aqui. Segue com o pedido e nós localizamos o terreno."); });
  }, true);

  // 14. Equipa: «Processar» em vez de «Encomendar», sem formulário de cliente (pedido do Nuno, 23/10, 00h43).
  //     window.tcdEquipa vem do m90297 (só contas @terracruadesign.pt com sessão). O servidor já trata estes pedidos como
  //     internos: sem custo, sem factura, directos para processamento. Os campos ficam no formulário, só escondidos e preenchidos.
  function equipa() {
    var E = window.tcdEquipa; if (!E || !E.email) return true;
    var f = document.getElementById("ipe-form"); if (!f) return false;
    var tab = document.querySelector('#ipe-tabs .ipe-tab[data-tab="enc"]');
    if (tab && tab.firstChild && tab.firstChild.nodeType === 3 && tab.firstChild.nodeValue !== "Processos") { tab.firstChild.nodeValue = "Processos"; tab.title = "Processar a Base Cartográfica (equipa)"; }
    var nome = document.getElementById("ipe-nome"), em = document.getElementById("ipe-email");
    if (nome && !nome.value) nome.value = E.nome || E.email; if (em) em.value = E.email;
    var ck = f.querySelector('input[name="consentimento"]'); if (ck) ck.checked = true;
    var bt = document.getElementById("ipe-enviar"); if (bt && /Enviar pedido/.test(bt.textContent)) bt.textContent = "Processar";
    if (f.getAttribute("data-ipr-eq")) return true;
    f.setAttribute("data-ipr-eq", "1");
    var esc = false;
    [].forEach.call(f.children, function (e) {
      if (e.tagName === "H3" && /03/.test(e.textContent)) { esc = true; }
      if (e.id === "ipe-notas") { var l = e.previousElementSibling; if (l) { l.style.display = ""; l.textContent = "Notas para o processamento"; } e.style.display = ""; return; }
      if (esc && (e.querySelector && e.querySelector('input[name="consentimento"]'))) { e.style.display = "none"; esc = false; return; }
      if (esc && !(e.nextElementSibling && e.nextElementSibling.id === "ipe-notas")) e.style.display = "none";
      if (e.classList && e.classList.contains("ipe-nota") && /paga|IVA/.test(e.textContent)) e.style.display = "none";
    });
    var g = document.getElementById("ipe-guia"); if (g) { [].forEach.call(g.querySelectorAll("*"), function (x) { if (x.children.length === 0 && /^Dados$/.test((x.textContent || "").trim())) { var li = x.closest("li,span,div"); if (li && li !== g) li.style.display = "none"; } }); }
    // 23/10, 01h07 (Nuno): só os botões directos, sem tutorial, sem valores, Leitura sempre incluída, sem notas nem vale.
    var gu = document.getElementById("ipe-guia"); if (gu) gu.style.display = "none";
    [].forEach.call(f.querySelectorAll(".ipe-mp > p.ipe-p"), function (p) { p.style.display = "none"; });
    var pr = document.getElementById("ipe-preco"); if (pr && pr.parentNode) pr.parentNode.style.display = "none";
    var lt = f.querySelector('input[name="leitura"]'); if (lt) { lt.checked = true; lt.dispatchEvent(new Event("change", { bubbles: true })); var ll = lt.closest("label"); if (ll) ll.style.display = "none"; }
    var nt = document.getElementById("ipe-notas"); if (nt) { nt.style.display = "none"; if (nt.previousElementSibling) nt.previousElementSibling.style.display = "none"; }
    [].forEach.call(f.querySelectorAll(".ipe-nota"), function (x) { if (x.id !== "ipe-lidar") x.style.display = "none"; });
    if (bt) { bt.addEventListener("click", function () { cascata(bt); }, true); }
    // Nome do projecto (Nuno, 23/10, 01h27): vai como nome da encomenda; o local tirado do mapa segue nas notas.
    if (!document.getElementById("ipr-pnome")) {
      var w = document.createElement("div"); w.className = "ipr-pnome-w";
      w.innerHTML = '<label class="ipe-lbl" for="ipr-pnome">Nome do projecto</label><input class="ipe-in" id="ipr-pnome" maxlength="120" placeholder="Ex.: Herdade do Vale (o nome do pedido ou do cliente)">';
      var h1 = [].filter.call(f.querySelectorAll("h3.ipe-h"), function (h) { return /01/.test(h.textContent); })[0];
      f.insertBefore(w, h1 || f.firstChild);
    }
    return true;
  }

  // 15. Barra da esquerda só com «Pesquisar» e «Camadas»; «Os meus projectos» e «Comece aqui» passam para o painel da
  //     direita (Nuno, 23/10, 00h55: «à esquerda fica só camadas e o procurar [...] à direita projectos, processar,
  //     comunidade, cloud e conta»). Nada se perde: os blocos mudam de sítio com tudo o que já faziam.
  // 25/10, 19h17 (Nuno): «saca fora os terrenos guardados [...] ali à esquerda pode ter uma coisa chamada Os meus locais [...]
  // guardar pontos, polígonos, linhas». A lista dos projectos fica à direita (separador Projectos); o grupo dos locais volta
  // para a esquerda, no topo das camadas, para todos (sem sessão guarda no navegador), com Ponto, Linha e Área.
  function arrumar() {
    var loc = document.getElementById("ipc-loc"), tme = document.getElementById("tme"), cam = document.getElementById("ipe-cam");
    var pp = document.querySelector('#ipe .ipe-pane[data-pane="proj"]'), pe = document.querySelector('#ipe .ipe-pane[data-pane="enc"]');
    if (!loc || !cam) return false;
    var dest = window.tcdNonce ? pp : pe;
    if (tme && dest && tme.parentNode !== dest) { tme.classList.add(window.tcdNonce ? "tme-dentro" : "tme-dir"); dest.insertBefore(tme, dest.firstChild); }
    // 26/10, 18h52 (Nuno): o #ipc-loc é a lista dos projectos (terrenos guardados), já no separador Projectos à direita;
    // aparecia em cima com o nome «Os meus locais» e duplicava os locais verdadeiros. Fica escondido à esquerda.
    // 27/10 (reportes 16262, 16263, 16328): o #ipc-loc é, afinal, o grupo dos locais (Ponto, Linha, Área, Importar, KML); escondê-lo
    // tirava «Os meus locais» a quem não tem sessão. Só se esconde se não tiver esses botões. Fechar e abrir pelo título passa a
    // ser tratado aqui, num só sítio, e o estado mantém-se quando o app.js redesenha a árvore das camadas.
    function pôr() {
      var l = document.getElementById("ipc-loc") || loc;
      l.classList.toggle("ipr-proj-fora", !l.querySelector("[data-loc]"));
      l.classList.toggle("ipr-fechou", ler("ipr_locais_fech") === "1");
      var t = l.querySelector(":scope>.ipr-gc .ipr-gt, :scope>.ipr-gt"); if (t) t.setAttribute("aria-expanded", l.classList.contains("ipr-fechou") ? "false" : "true");
    }
    if (!document.getElementById("ipr-loc-css")) { var cs = document.createElement("style"); cs.id = "ipr-loc-css"; cs.textContent = "#ipe #ipc-loc.ipr-g:not(.ipr-fechou)>.ipe-sbc{display:block!important}#ipe #ipc-loc.ipr-g:not(.ipr-fechou) .ipr-car{transform:rotate(90deg)}#ipe #ipc-loc.ipr-g.ipr-fechou>.ipe-sbc{display:none!important}#ipe #ipc-loc .ipe-loc-s,#ipe #ipc-loc .ipe-loc-p:has([data-am]){display:none!important}#ipe #ipc-loc>.ipe-sbc{max-height:30vh;overflow:auto}" +
      // 27/10 (reporte 16262): o grupo dos locais fica à vista no topo mesmo com «Todas as camadas» recolhido
      "#ipe .ipr-arv.ipr-t62-rec>.ipr-66-loc:not(.ipr-proj-fora){display:block!important}"; document.head.appendChild(cs); }
    if (!arrumar.del) { arrumar.del = 1; document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("#ipc-loc .ipr-gt"), l = document.getElementById("ipc-loc");
      if (!t || !l || t.closest(".ipr-g") !== l) return;
      e.preventDefault(); e.stopPropagation();
      gravar("ipr_locais_fech", l.classList.contains("ipr-fechou") ? "0" : "1"); pôr();
    }, true); }
    pôr();
    if (!arrumar.obs) { arrumar.obs = 1; new MutationObserver(function () { clearTimeout(arrumar.t); arrumar.t = setTimeout(pôr, 60); }).observe(cam, { childList: true, subtree: true }); }
    return true;
  }

  // 16. Separador Projectos (Nuno, 23/10, 01h03): sem o título «Os seus projectos» (redundante com o separador); projectos em
  //     linhas curtas que se abrem; para a equipa, a ficha do terreno passa para a lista de ficheiros, com «Abrir».
  //     O app.js redesenha a lista; um observador volta a aplicar. A ficha continua a ser a mesma (mesmo botão, escondido).
  function projDir() {
    var box = document.getElementById("ipe-proj"); if (!box) return false;
    function aplicar() {
      [].forEach.call(box.querySelectorAll("h3.ipe-h"), function (h) { if (/^Os seus projectos/.test((h.textContent || "").trim())) h.classList.add("ipr-oculto-h"); });
      if (window.tcdNonce) [].forEach.call(box.querySelectorAll(".ipe-card"), function (c) { if (c.querySelector(".ipc-cmp") || /#\d+/.test(c.textContent)) renomear(c); });
      if (!window.tcdEquipa) return;
      [].forEach.call(box.querySelectorAll(".ipe-card .ipe-res--proj:not(.ipr-ficha-eq)"), function (r) {
        r.classList.add("ipr-ficha-eq");
        var card = r.closest(".ipe-card"), bt = r.querySelector("[data-res-proj]"), out = r.querySelector("[data-res-out]");
        var fl = card && card.querySelector(".ipe-cx > ul.ipe-fl:not([data-sh-lista])");
        var li = document.createElement("li"); li.innerHTML = '<span>Ficha do terreno (indicativa)</span><a href="#" data-ipr-ficha>Abrir</a>';
        if (!fl) { var h4 = [].filter.call(card.querySelectorAll(".ipe-cx > h4.ipe-h"), function (x) { return /^Ficheiros/.test(x.textContent); })[0]; fl = document.createElement("ul"); fl.className = "ipe-fl"; if (h4) { var nx = h4.nextElementSibling; if (nx && nx.tagName === "P") nx.remove(); h4.parentNode.insertBefore(fl, h4.nextSibling); } else { r.parentNode.insertBefore(fl, r); } }
        fl.appendChild(li);
        if (out) { out.classList.add("ipr-ficha-out"); fl.parentNode.insertBefore(out, fl.nextSibling); }
        li.querySelector("a").addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); if (bt) bt.click(); });
      });
    }
    if (!box.getAttribute("data-ipr")) { box.setAttribute("data-ipr", "1"); try { new MutationObserver(function () { aplicar(); }).observe(box, { childList: true }); } catch (e) {} }
    aplicar();
    return true;
  }

  // Cascata das camadas ao carregar em «Processar» (equipa). É só visual: o pedido segue como sempre para o worker.
  var CAMADAS_BASE = ["MDT · hipsometria", "Sombreamento", "Curvas de nível 0,5 m", "Curvas de nível 1 m", "Curvas de nível 2 m", "Curvas de nível 5 m", "Declives · 7 classes", "Exposição solar", "Formas do relevo", "Exposição ao vento", "Linhas de água (Strahler)", "Festos e cumeadas", "Acumulação de fluxo", "Bacias hidrográficas", "Humidade topográfica (TWI)", "Erosão", "Leitura Territorial"];
  function cascata(bt) {
    var v = document.getElementById("ipr-casc"); if (v) v.remove();
    v = document.createElement("div"); v.id = "ipr-casc"; v.className = "ipr-casc"; v.setAttribute("aria-live", "polite");
    v.innerHTML = "<b>A preparar o processamento</b><ul>" + CAMADAS_BASE.map(function (n) { return "<li><i></i>" + n + "</li>"; }).join("") + '</ul><div class="fim">Go: enviado para o worker.</div>';
    bt.parentNode.insertBefore(v, bt.nextSibling);
    var li = v.querySelectorAll("li"), i = 0;
    (function prox() { if (i < li.length) { li[i++].classList.add("on"); setTimeout(prox, 140); } else { v.querySelector(".fim").classList.add("on"); } })();
  }

  // «Testar camadas» passa da barra do mapa para a barra da esquerda, por cima das camadas (Nuno, 23/10, 01h08).
  function testarEsq() {
    var b = document.getElementById("tcd-testar-cam"), arv = document.querySelector("#ipe-cam .ipr-arv"); if (!b || !arv) return !window.tcdNonce;
    var cab = arv.querySelector(".ipr-arv-cab");
    if (b.parentNode !== arv) { b.classList.remove("ipe-t"); arv.insertBefore(b, cab ? cab.nextSibling : arv.firstChild); }
    return true;
  }

  // Caixa de texto curta ao passar o rato nos ícones da barra do mapa e nos controlos.
  (function dicas() {
    if (!window.matchMedia || !window.matchMedia("(hover:hover)").matches) return;
    var tip = null;
    document.addEventListener("mouseover", function (e) {
      var b = e.target.closest && e.target.closest("#ipe .ipe-tools button, #ipe .maplibregl-ctrl button, #ipe .ipe-rosa");
      if (!b) return;
      var t = b.getAttribute("data-ipr-tip") || b.getAttribute("title") || b.getAttribute("aria-label"); if (!t) return;
      if (b.getAttribute("title")) { b.setAttribute("data-ipr-tip", t); b.removeAttribute("title"); }
      if (!tip) { tip = document.createElement("div"); tip.className = "ipr-tip"; document.body.appendChild(tip); }
      tip.textContent = t.split(". ")[0];
      var r = b.getBoundingClientRect(); tip.style.left = "0px"; tip.style.top = "0px"; tip.classList.add("on");
      var w = tip.offsetWidth, h = tip.offsetHeight, x = r.left - w - 8; if (x < 4) x = r.right + 8;
      tip.style.left = x + "px"; tip.style.top = Math.max(4, r.top + r.height / 2 - h / 2) + "px";
    });
    document.addEventListener("mouseout", function (e) { if (tip && e.target.closest && e.target.closest("#ipe .ipe-tools button, #ipe .maplibregl-ctrl button, #ipe .ipe-rosa")) tip.classList.remove("on"); });
  })();

  // 17. Canto superior direito = conta e ecrã (Nuno, 23/10, 01h17): o separador «Conta» sai do painel da direita e abre-se no
  //     nome da pessoa, lá em cima; o botão «Camadas» do topo desaparece no computador (as camadas já estão sempre na barra da
  //     esquerda). No telemóvel e no iPad ao alto o botão fica, porque é ele que abre as camadas.
  function contaTopo() {
    var u = document.getElementById("ipe-user"), tab = document.querySelector('#ipe-tabs .ipe-tab[data-tab="conta"]'), corpo = document.getElementById("ipe-conta");
    if (!u || !tab || !corpo) return !window.tcdNonce;
    if (u.getAttribute("data-ipr")) return true;
    u.setAttribute("data-ipr", "1"); tab.style.display = "none"; u.title = "A sua conta: dados, facturação e guardados";
    var pop = document.createElement("div"); pop.className = "ipr-userpop"; pop.hidden = true; pop.appendChild(corpo); document.body.appendChild(pop);
    function fechar() { pop.hidden = true; }
    u.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation();
      if (!pop.hidden) { fechar(); return; }
      if (!corpo.getAttribute("data-ipr-c")) { // o app.js só preenche a conta quando se abre o separador: abre-o e volta ao que estava
        corpo.setAttribute("data-ipr-c", "1"); var act = document.querySelector('#ipe-tabs .ipe-tab[aria-selected="true"]'); tab.click(); if (act && act !== tab) setTimeout(function () { act.click(); }, 30);
      }
      var r = u.getBoundingClientRect(); pop.style.top = Math.round(r.bottom + 8) + "px"; pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right - 40)) + "px"; pop.hidden = false;
    });
    document.addEventListener("click", function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== u) fechar(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });
    return true;
  }
  function camadasTopo() {
    var b = document.getElementById("ipe-camadas"), ipe = document.getElementById("ipe"); if (!b || !ipe) return false;
    if (desk()) { if (ipe.classList.contains("sem-esq")) b.click(); b.classList.add("ipr-so-movel"); }
    return true;
  }

  // Envio do «Processar» com o nome do projecto (só equipa). Não muda o pedido de mais nenhuma forma.
  (function () {
    if (!window.fetch || window.__iprFetchNome) return; window.__iprFetchNome = 1;
    var of = window.fetch;
    window.fetch = function (url, op) {
      try {
        var nm = document.getElementById("ipr-pnome");
        if (window.tcdEquipa && nm && nm.value.trim() && op && op.method === "POST" && /pedido-base/.test(String(url)) && op.body && op.body.set) {
          var orig = op.body.get("local") || "", nt = op.body.get("notas") || "";
          op.body.set("local", nm.value.trim());
          if (orig) op.body.set("notas", (nt ? nt + "\n" : "") + "Local: " + orig);
        }
      } catch (e) {}
      var pr = of.apply(this, arguments);
      try {
        if (/meus-mapas/.test(String(url)) && (!op || !op.method || op.method === "GET")) {
          pr.then(function (r) { if (r && r.ok) r.clone().json().then(function (d) { if (d && d.todas) { window.__iprTodas = d.todas; try { todasBases(); } catch (e) {} } }).catch(function () {}); });
        }
      } catch (e) {}
      return pr;
    };
  })();

  // «Todas as Bases» (Nuno, Miguel e Susana; m90159): caixa no separador Projectos com as últimas 50, por estado.
  var TODAS_K = [["pedido", "Pedidos"], ["processar", "A processar"], ["revisao", "Em revisão"], ["entregue", "Entregues"]];
  function todasBases() {
    var L = window.__iprTodas, pp = document.querySelector('#ipe .ipe-pane[data-pane="proj"]'); if (!L || !pp) return;
    var box = document.getElementById("ipr-todas");
    if (!box) { box = document.createElement("section"); box.id = "ipr-todas"; box.className = "ipr-todas"; pp.insertBefore(box, pp.firstChild); }
    var sel = box.getAttribute("data-k") || "todas";
    function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    var cont = {}; L.forEach(function (x) { cont[x.k] = (cont[x.k] || 0) + 1; });
    var h = '<button type="button" class="ipr-todas-h" aria-expanded="' + (box.classList.contains("aberto") ? "true" : "false") + '">Todas as Bases <b>' + L.length + '</b><small>últimas 50</small></button><div class="ipr-todas-c"><div class="ipr-todas-f">';
    h += '<button type="button" data-k="todas"' + (sel === "todas" ? ' aria-pressed="true"' : "") + '>Todas</button>';
    TODAS_K.forEach(function (k) { h += '<button type="button" data-k="' + k[0] + '"' + (sel === k[0] ? ' aria-pressed="true"' : "") + ">" + k[1] + " <i>" + (cont[k[0]] || 0) + "</i></button>"; });
    h += "</div><ul>";
    L.filter(function (x) { return sel === "todas" || x.k === sel; }).forEach(function (x) {
      h += '<li class="k-' + x.k + '"><a href="' + esc(x.url) + '" title="Abrir no Atlas"><b>' + esc(x.local || "Terreno sem nome") + "</b><span>#" + x.id + " · " + esc(x.cliente) + (x.equipa ? " (equipa)" : "") + " · " + (x.ha ? String(Math.round(x.ha * 100) / 100).replace(".", ",") + " ha" : "") + "</span><span>" + esc(x.data) + " · " + (TODAS_K.filter(function (k) { return k[0] === x.k; })[0] || ["", x.k])[1] + (x.cloud ? " · Cloud" : "") + (x.total > 0 && x.k === "pedido" ? " · " + String(x.total.toFixed(2)).replace(".", ",") + " €" : "") + "</span></a>" + (x.admin ? '<a class="ipr-todas-adm" href="' + esc(x.admin) + '" target="_blank" rel="noopener" title="Abrir a encomenda">↗</a>' : "") + "</li>";
    });
    h += "</ul></div>";
    box.innerHTML = h;
    if (!box.getAttribute("data-ipr")) {
      box.setAttribute("data-ipr", "1");
      box.addEventListener("click", function (e) {
        var t = e.target.closest(".ipr-todas-h"); if (t) { box.classList.toggle("aberto"); t.setAttribute("aria-expanded", box.classList.contains("aberto") ? "true" : "false"); return; }
        var k = e.target.closest(".ipr-todas-f button"); if (k) { box.setAttribute("data-k", k.getAttribute("data-k")); todasBases(); }
      });
    }
  }

  // Mudar o nome de um projecto (dono ou equipa), no separador Projectos. Usa a acção tcd_pnome (m90158).
  function renomear(card) {
    var st = card.querySelector(".ipe-ct strong"), num = ((card.querySelector(".ipe-ct .mono") || {}).textContent || "").match(/#(\d+)/);
    if (!st || !num || card.querySelector(".ipr-ren")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "ipr-ren"; b.title = "Mudar o nome do projecto"; b.textContent = "✎";
    st.parentNode.insertBefore(b, st.nextSibling);
    b.addEventListener("click", function (e) {
      e.stopPropagation(); e.preventDefault();
      if (card.querySelector(".ipr-ren-in")) return;
      var i = document.createElement("input"); i.className = "ipe-in ipr-ren-in"; i.value = st.textContent; i.maxLength = 120;
      st.style.display = "none"; b.style.display = "none"; st.parentNode.insertBefore(i, st); i.focus(); i.select();
      i.addEventListener("click", function (ev) { ev.stopPropagation(); });
      var fim = false;
      function acabar(gravar) {
        if (fim) return; fim = true; var v = i.value.trim();
        if (gravar && v && v !== st.textContent) {
          var fd = new FormData(); fd.append("action", "tcd_pnome"); fd.append("_n", window.tcdNonce || ""); fd.append("id", num[1]); fd.append("nome", v);
          fetch("/wp-admin/admin-ajax.php", { method: "POST", credentials: "same-origin", body: fd }).then(function (r) { return r.json(); }).then(function (d) {
            if (d && d.success) { st.textContent = d.data.nome; st.title = d.data.nome; } else { alerta(card, (d && d.data) || "Não foi possível mudar o nome."); }
          }).catch(function () { alerta(card, "Não foi possível mudar o nome."); });
        }
        i.remove(); st.style.display = ""; b.style.display = "";
      }
      i.addEventListener("keydown", function (ev) { ev.stopPropagation(); if (ev.key === "Enter") acabar(true); else if (ev.key === "Escape") acabar(false); });
      i.addEventListener("blur", function () { acabar(true); });
    });
  }
  function alerta(card, t) { var m = document.createElement("small"); m.className = "ipe-small mau"; m.textContent = t; var ct = card.querySelector(".ipe-ct"); if (ct) { ct.appendChild(m); setTimeout(function () { m.remove(); }, 5000); } }

  // 18. «Sintetizar» (Nuno, 23/10, 01h44): cada projecto tem a caixa para o escolher; com dois ou três escolhidos aparece uma
  //     barra no topo do separador Projectos com «Sintetizar», que abre a comparação que já existia (área, relevo, REN, RAN,
  //     água, fogo). A caixa diz «escolher» e o botão do fundo passa a «Sintetizar os terrenos escolhidos».
  function sintetizar() {
    var box = document.getElementById("ipe-proj"); if (!box) return false;
    function acertar() {
      [].forEach.call(box.querySelectorAll(".ipc-cmp"), function (l) { var t = l.lastChild; if (t && t.nodeType === 3 && /comparar/.test(t.nodeValue)) t.nodeValue = " escolher"; l.title = "Escolher este terreno para sintetizar (extrair, analisar e comparar) com outros"; });
      var bt = box.querySelector("[data-comparar]"); if (bt && /Comparar/.test(bt.textContent)) bt.textContent = "Sintetizar os terrenos escolhidos";
      var n = box.querySelectorAll("[data-cmp-sel]:checked").length, bar = document.getElementById("ipr-sint");
      if (!bar) {
        bar = document.createElement("div"); bar.id = "ipr-sint"; bar.className = "ipr-sint"; bar.hidden = true;
        bar.innerHTML = '<span><b>0</b> escolhidos</span><button type="button" class="ipe-b ipe-b--ac ipe-b--s">Sintetizar</button><button type="button" class="ipr-sint-x" title="Limpar a escolha">×</button>';
        box.parentNode.insertBefore(bar, box);
        bar.querySelector(".ipe-b").addEventListener("click", function () { var c = box.querySelector("[data-comparar]"); if (c) c.click(); });
        bar.querySelector(".ipr-sint-x").addEventListener("click", function () { [].forEach.call(box.querySelectorAll("[data-cmp-sel]:checked"), function (x) { x.checked = false; }); acertar(); });
      }
      bar.querySelector("b").textContent = n; bar.hidden = n < 1;
      var sb = bar.querySelector(".ipe-b"); sb.disabled = n < 2; sb.title = n < 2 ? "Escolha pelo menos dois terrenos (até três)" : "Sintetizar os " + n + " terrenos escolhidos";
    }
    if (!box.getAttribute("data-ipr-s")) {
      box.setAttribute("data-ipr-s", "1");
      box.addEventListener("change", function (e) { if (e.target.matches && e.target.matches("[data-cmp-sel]")) { if (box.querySelectorAll("[data-cmp-sel]:checked").length > 3) { e.target.checked = false; } acertar(); } });
      box.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".ipc-cmp")) e.stopPropagation(); }, true);
      try { new MutationObserver(acertar).observe(box, { childList: true }); } catch (e) {}
    }
    acertar();
    return true;
  }

  // 19. Opções de cada camada, à maneira do QField (Nuno, 23/10, 02h23): nas camadas ligadas aparece um botão «⋯» que abre
  //     uma caixa por baixo com «Aproximar» (enquadra o mapa na extensão da camada), «Desligar» e a fonte. Não mexe no que já
  //     existia: a caixa de ligar, a legenda e a barra de opacidade ficam onde estavam.
  function limitesCamada(id) {
    var m = window.__ipe && window.__ipe.mapa; if (!m || !m.getStyle) return null;
    var b = null, pre = "iprv-" + id;
    function junta(w, s, e, n) { if (![w, s, e, n].every(isFinite)) return; if (!b) b = [w, s, e, n]; else { b[0] = Math.min(b[0], w); b[1] = Math.min(b[1], s); b[2] = Math.max(b[2], e); b[3] = Math.max(b[3], n); } }
    function coords(c) { if (typeof c[0] === "number") junta(c[0], c[1], c[0], c[1]); else c.forEach(coords); }
    function geo(g) { if (!g) return; if (g.type === "FeatureCollection") g.features.forEach(function (f) { geo(f.geometry); }); else if (g.type === "Feature") geo(g.geometry); else if (g.type === "GeometryCollection") g.geometries.forEach(geo); else if (g.coordinates) coords(g.coordinates); }
    Object.keys(m.getStyle().sources || {}).forEach(function (k) {
      if (k !== pre && k.indexOf(pre + "-") !== 0) return;
      var s = m.getSource(k); if (!s) return;
      try {
        if (s.type === "geojson" && s._data && typeof s._data === "object") { geo(s._data); return; }
        var tb = s.tileBounds && s.tileBounds.bounds;
        if (tb) { junta(tb.getWest ? tb.getWest() : tb._sw.lng, tb.getSouth ? tb.getSouth() : tb._sw.lat, tb.getEast ? tb.getEast() : tb._ne.lng, tb.getNorth ? tb.getNorth() : tb._ne.lat); return; }
        if (s.bounds && s.bounds.length === 4) { junta(s.bounds[0], s.bounds[1], s.bounds[2], s.bounds[3]); return; }
        if (m.querySourceFeatures) m.querySourceFeatures(k).forEach(function (f) { geo(f.geometry); });
      } catch (e) {}
    });
    // Camadas do mundo inteiro (fundos, serviços nacionais sem extensão) não têm onde aproximar.
    if (b && (b[2] - b[0] > 60 || b[3] - b[1] > 40)) return null;
    return b;
  }
  function aproximar(id, li) {
    var m = window.__ipe && window.__ipe.mapa, b = limitesCamada(id);
    // Camadas da Base sem extensão própria: o terreno do projecto.
    if (!b && li && li.closest('.ipr-g[data-g="base"]')) b = limitesCamada("limite") || limitesCamada("aoi");
    if (!m || !b) return false;
    if (b[2] - b[0] < 1e-6 && b[3] - b[1] < 1e-6) m.flyTo({ center: [b[0], b[1]], zoom: Math.max(m.getZoom(), 16) });
    else m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, maxZoom: 18, duration: 900 });
    return true;
  }
  var opcAberta = null;
  function opcoesCamadas() {
    var arv = document.querySelectorAll(".ipr-arv-l"); if (!arv.length) return false;
    [].forEach.call(arv, function (l) {
      if (l.getAttribute("data-ipr-opc")) return;
      l.setAttribute("data-ipr-opc", "1");
      function por() {
        [].forEach.call(l.querySelectorAll(".ipr-it.on:not(.bl)"), function (li) {
          var lab = li.querySelector("label"); if (!lab || li.querySelector(".ipr-opc-b")) return;
          var bt = document.createElement("button"); bt.type = "button"; bt.className = "ipr-opc-b"; bt.textContent = "⋯";
          bt.title = "Opções da camada"; bt.setAttribute("aria-label", "Opções da camada"); bt.setAttribute("aria-expanded", "false");
          lab.appendChild(bt);
          if (opcAberta === li.dataset.id) caixa(li, bt);
        });
      }
      function caixa(li, bt) {
        var x = li.querySelector(".ipr-opc"); if (x) { x.remove(); bt.setAttribute("aria-expanded", "false"); opcAberta = null; return; }
        [].forEach.call(l.querySelectorAll(".ipr-opc"), function (o) { o.remove(); });
        opcAberta = li.dataset.id;
        var c = document.createElement("div"); c.className = "ipr-opc";
        var nota = li.querySelector(".ipr-nome small:not(.ipr-est)");
        c.innerHTML = '<div class="ipr-opc-bts"><button type="button" class="ipe-b ipe-b--s" data-opc="zoom">Aproximar</button>' +
          '<button type="button" class="ipe-b ipe-b--s" data-opc="off">Desligar</button></div>' +
          (nota && nota.textContent ? '<p class="ipr-opc-n">' + nota.textContent.replace(/[<&]/g, "") + "</p>" : "") +
          '<p class="ipr-opc-m" hidden></p>';
        var op = li.querySelector(".ipr-op");
        li.insertBefore(c, op ? op.nextSibling : null);
        bt.setAttribute("aria-expanded", "true");
      }
      l.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".ipr-opc-b");
        if (b) { e.preventDefault(); e.stopPropagation(); caixa(b.closest(".ipr-it"), b); return; }
        var a = e.target.closest && e.target.closest("[data-opc]"); if (!a) return;
        e.preventDefault(); e.stopPropagation();
        var li = a.closest(".ipr-it");
        if (a.getAttribute("data-opc") === "zoom") {
          if (!aproximar(li.dataset.id, li)) { var m = li.querySelector(".ipr-opc-m"); m.textContent = "Esta camada cobre todo o país (ou ainda está a carregar): não há uma extensão para aproximar."; m.hidden = false; }
        } else { opcAberta = null; var ck = li.querySelector(".ipr-ck"); if (ck) ck.click(); }
      }, true);
      try { new MutationObserver(por).observe(l, { childList: true }); } catch (e) {}
      por();
    });
    return false; // continua a correr: a árvore pode ser criada de novo (outro modo, outra Base)
  }

  // 20. Projectos fechados à partida, como as categorias de camadas à esquerda (Nuno, 23/10, 03h06): o projecto aberto no
  //     mapa deixava o cartão estendido e era preciso descer duas vezes para ver os outros. Agora todos começam fechados; o
  //     que está no mapa fica marcado (ipr-actual). Clicar no cartão do projecto aberto estende-o ou fecha-o; clicar noutro
  //     abre-o no mapa, como antes, e esse fica estendido.
  var projAbrir = null;
  function projFechados() {
    var box = document.getElementById("ipe-proj"); if (!box) return false;
    function acertar() {
      [].forEach.call(box.querySelectorAll(".ipe-card[data-i]"), function (c) {
        if (c.getAttribute("data-ipr-f")) return;
        c.setAttribute("data-ipr-f", "1");
        var actual = c.classList.contains("on");
        c.classList.toggle("ipr-actual", actual);
        if (actual && projAbrir !== c.dataset.i) c.classList.remove("on");
      });
      projAbrir = null;
    }
    if (!box.getAttribute("data-ipr-pf")) {
      box.setAttribute("data-ipr-pf", "1");
      box.addEventListener("click", function (e) {
        if (!e.target.closest || e.target.closest(".ipe-cx") || e.target.closest(".ipc-cmp") || e.target.closest("button,a,input,label")) return;
        var c = e.target.closest(".ipe-card[data-i]"); if (!c) return;
        if (c.classList.contains("ipr-actual")) { e.stopPropagation(); c.classList.toggle("on"); return; }
        projAbrir = c.dataset.i;
      }, true);
      try { new MutationObserver(acertar).observe(box, { childList: true, subtree: true }); } catch (e) {}
    }
    acertar();
    return true;
  }

  // 21. «Todas as Bases» com «Ver todas» e o estado do worker (Nuno, 23/10, 10h20). Não mexe na secção do m90159: acrescenta
  //     à caixa #ipr-todas, depois de ela ser desenhada, um resumo do worker (a correr, fila, erros, último contacto, ligação ao
  //     painel) e o botão «Ver todas», que pede a lista completa (meus-mapas?todas=tudo, m90143) e a mostra na mesma caixa.
  var wkInfo = null, todasTudo = false, todasPedido = false;
  function todasMais() {
    var box = document.getElementById("ipr-todas"); if (!box || !window.tcdNonce) return false;
    function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function desenhar() {
      var c = box.querySelector(".ipr-todas-c"); if (!c) return;
      var sm = box.querySelector(".ipr-todas-h small"); if (sm && todasTudo) sm.textContent = "todas";
      if (wkInfo && !c.querySelector(".ipr-wk")) {
        var w = document.createElement("div"); w.className = "ipr-wk";
        var cor = wkInfo.erros ? "er" : (wkInfo.parado ? "av" : "ok");
        w.innerHTML = '<span class="ipr-wk-p ' + cor + '"></span><b>Worker</b> ' + esc(wkInfo.texto || "") +
          (wkInfo.a_correr && wkInfo.a_correr.length ? '<ul>' + wkInfo.a_correr.map(function (x) { return "<li>#" + esc(x.id) + " · " + esc(x.local || "") + " · " + esc(x.estado || "") + "</li>"; }).join("") + "</ul>" : "") +
          (wkInfo.painel ? ' <a href="' + esc(wkInfo.painel) + '" target="_blank" rel="noopener">Painel do worker ↗</a>' : "");
        c.insertBefore(w, c.firstChild);
      }
      if (!todasTudo && !c.querySelector(".ipr-todas-mais")) {
        var b = document.createElement("button"); b.type = "button"; b.className = "ipr-todas-mais"; b.textContent = "Ver todas as Bases";
        c.appendChild(b);
      }
    }
    if (!box.getAttribute("data-ipr21")) {
      box.setAttribute("data-ipr21", "1");
      box.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".ipr-todas-mais"); if (!b || todasPedido) return;
        todasPedido = true; b.textContent = "A carregar…";
        fetch("/wp-json/tcd/v1/meus-mapas?todas=tudo", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            todasPedido = false;
            if (d && d.todas && d.todas.length) { todasTudo = true; window.__iprTodas = d.todas; if (d.worker) wkInfo = d.worker; try { todasBases(); } catch (x) {} box.classList.add("aberto"); }
            else { b.textContent = "Não foi possível carregar. Tentar outra vez"; }
          })
          .catch(function () { todasPedido = false; b.textContent = "Não foi possível carregar. Tentar outra vez"; });
      });
      try { new MutationObserver(function () { desenhar(); }).observe(box, { childList: true }); } catch (e) {}
      fetch("/wp-json/tcd/v1/meus-mapas?todas=worker", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.worker) { wkInfo = d.worker; var o = box.querySelector(".ipr-wk"); if (o) o.remove(); desenhar(); } })
        .catch(function () {});
    }
    desenhar();
    return false; // continua: a caixa é desenhada de novo a cada mudança de filtro
  }

  var feito = {}, voltas = 0;
  // 22. Botão «Painel» no canto superior direito, ao lado da conta (pedido do Nuno, 23/10/2026, 17h23): equipa vai para
  // /area-equipa/, as outras contas para /conta/. Só aparece com sessão iniciada.
  function painelTopo() {
    var u = document.getElementById("ipe-user"); if (!u || !u.parentNode) return !window.tcdNonce && document.readyState === "complete";
    if (document.getElementById("ipr-painel")) return true;
    if (!window.tcdNonce) return true;
    var E = window.tcdEquipa, eq = !!(E && E.email);
    var a = document.createElement("a"); a.id = "ipr-painel"; a.className = "ipr-painel"; a.href = eq ? "/area-equipa/" : "/conta/";
    a.title = eq ? "Painel da equipa" : "O seu painel: encomendas, mapas, facturação"; a.setAttribute("aria-label", a.title);
    a.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5"/><rect x="13.5" y="11" width="7" height="9.5" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/></svg><span>Painel</span>';
    u.parentNode.insertBefore(a, u);
    return true;
  }
  // 23. «Abrir no QField» com QR e nota sobre o que funciona sem rede (compilação do Ecossistema IPR, §15; Nuno, 23/10/2026).
  // Acrescenta ao separador Cloud (cloud.js, sem o alterar), em cada terreno: um QR para abrir o terreno no telemóvel ou
  // no tablet (o Atlas, com sessão, mostra lá os mesmos passos) e o QR do endereço do servidor, para não ter de o escrever.
  var QRLIB = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
  function qrSvg(txt) {
    try { var q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: 3, margin: 2, scalable: true }); } catch (e) { return ""; }
  }
  function qfieldQR() {
    if (!window.tcdNonce) return true;
    var srvs = document.querySelectorAll(".ipc-srv:not([data-ipr-qr])"); if (!srvs.length) return false;
    function aplicar() {
      document.querySelectorAll(".ipc-srv:not([data-ipr-qr])").forEach(function (srv) {
        srv.setAttribute("data-ipr-qr", "1");
        var corpo = srv.closest(".ipc-corpo") || srv.parentNode, cod = srv.querySelector("code"), servidor = cod ? cod.textContent.trim() : "";
        var a = corpo.querySelector(".ipc-acc a[href]"), mapa = a ? new URL(a.getAttribute("href"), location.origin).href : location.origin + "/atlas/";
        var box = document.createElement("div"); box.className = "ipr-qf";
        box.innerHTML = '<div class="ipr-qf-qr"><figure>' + qrSvg(mapa) + '<figcaption>Abrir este terreno no telemóvel</figcaption></figure>' +
          (servidor ? '<figure>' + qrSvg(servidor) + '<figcaption>Endereço do servidor</figcaption></figure>' : "") + '</div>' +
          '<p class="ipr-qf-nota"><b>Sem rede no terreno:</b> o QField guarda o projecto no aparelho. Funcionam sem rede as camadas da Base, os seus desenhos, pontos, fotografias e notas; ' +
          'sincronize quando voltar a ter rede. As camadas vindas de serviços externos (cadastro, ortofotos, condicionantes por WMS) precisam de rede. ' +
          'Importar o pacote .zip é uma cópia, não sincroniza; para trabalhar em equipa, entre pela IPR Cloud.</p>';
        srv.parentNode.insertBefore(box, srv.nextSibling);
      });
    }
    if (window.qrcode) { aplicar(); }
    else if (!window.__iprQrLib) {
      window.__iprQrLib = 1; var s = document.createElement("script"); s.src = QRLIB; s.crossOrigin = "anonymous";
      s.onload = aplicar; document.head.appendChild(s);
    }
    if (!window.__iprQrObs) { // o cloud.js redesenha a lista: voltar a aplicar
      window.__iprQrObs = 1;
      new MutationObserver(function () { if (window.qrcode && document.querySelector(".ipc-srv:not([data-ipr-qr])")) aplicar(); }).observe(document.body, { childList: true, subtree: true });
    }
    return true;
  }
  // 24. Formiga (compilação do Ecossistema IPR §26, 24/10/2026): nome só nas 3 primeiras visitas (contadas por dia, não por
  // desenho da página), depois só o ícone com título; recolhida ao início; no Atlas fica por baixo dos botões do canto superior
  // direito do mapa (zoom, localização), sem tapar nada; com o teclado do telemóvel aberto, a janela sobe acima do teclado.
  var FM_VIS = (function () {
    var hoje = new Date().toISOString().slice(0, 10), d = { n: 0, d: "" };
    try { d = JSON.parse(localStorage.getItem("ipr_fm_visitas_v2") || "null") || d; } catch (e) {}
    if (d.d !== hoje) { d.n = (d.n || 0) + 1; d.d = hoje; try { localStorage.setItem("ipr_fm_visitas_v2", JSON.stringify(d)); } catch (e) {} }
    return d.n || 1;
  })();
  function formigaSitio() {
    var b = document.getElementById("tcdfmb"); if (!b) return false;
    if (FM_VIS > 3 && !b.classList.contains("tcd-fm-mini")) {
      var nome = (b.textContent || "").trim() || "Formiga";
      b.classList.add("tcd-fm-mini"); if (!b.title) b.title = nome; b.setAttribute("aria-label", b.title || nome);
    }
    var I = mapa(), ctr = document.querySelector("#ipe .ipe-tools") || document.querySelector("#ipe .maplibregl-ctrl-top-right"), cv = I && I.getContainer ? I.getContainer() : null;
    if (ctr && cv) {
      var rc = cv.getBoundingClientRect(), rt = ctr.getBoundingClientRect();
      if (rc.width > 100 && rt.height > 0) {
        var top = Math.round(rt.bottom + 10), dir = Math.max(8, Math.round(window.innerWidth - rc.right + 10));
        if (rt.height > rc.height * 0.45) {
          // barra de ferramentas vertical (alta): a Formiga fica em baixo, encostada à barra, alinhada com o fundo do mapa
          var dirB = Math.max(8, Math.round(window.innerWidth - rt.left + 10)), baixo = Math.max(12, Math.round(window.innerHeight - rc.bottom + 12));
          b.style.setProperty("position", "fixed", "important"); b.style.setProperty("bottom", baixo + "px", "important");
          b.style.setProperty("right", dirB + "px", "important"); b.style.setProperty("left", "auto", "important"); b.style.setProperty("top", "auto", "important");
          b.classList.add("ipr-fm-dir");
        } else if (top + 56 < rc.bottom) {
          b.style.setProperty("position", "fixed", "important"); b.style.setProperty("top", top + "px", "important");
          b.style.setProperty("right", dir + "px", "important"); b.style.setProperty("left", "auto", "important"); b.style.setProperty("bottom", "auto", "important");
          b.classList.add("ipr-fm-dir");
        }
      }
    }
    return true;
  }
  (function () { // teclado virtual: a janela da Formiga fica acima dele
    var vv = window.visualViewport; if (!vv) return;
    function ajusta() {
      var p = document.getElementById("tcdfm"); if (!p || p.offsetParent === null) return;
      var tec = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (tec > 80) { p.style.setProperty("bottom", (tec + 8) + "px", "important"); p.style.setProperty("top", "auto", "important"); p.style.setProperty("max-height", Math.round(vv.height - 16) + "px", "important"); p.setAttribute("data-ipr-tec", "1"); }
      else if (p.getAttribute("data-ipr-tec")) { p.removeAttribute("data-ipr-tec"); p.style.removeProperty("bottom"); p.style.removeProperty("top"); p.style.removeProperty("max-height"); }
    }
    vv.addEventListener("resize", ajusta); vv.addEventListener("scroll", ajusta);
  })();

  // 25. Temas de camadas (compilação §34, 24/10/2026): botão «Temas» no cabeçalho da lista de camadas com seis temas IPR fixos
  // e os temas da própria pessoa («Guardar como o meu tema», por agora no navegador). Só liga camadas que já existem no catálogo
  // (viz.js) e respeita o Explorer: camadas de Condicionantes, Água, Solo e Fogo ficam de fora para quem não tem Intelligence.
  var TEMA_GRUPO = { cond: ["crus","ren","ran","n2k","rnap","arv","la350","albzr","albuf","capt","eletr","viaria","ferro","marcos","aero","defesa"],
    agua: ["hidro","hidro_g","rh","bacias","massas","inund","arpsi","aquif","hidrog","aquif_s","icnfpa","apasub","dgegn","ma_ecol","ma_quant","wei","wei_sub","capt_p","barragens","etar","nitratos","zprot","albpub","zadj","marcas","scs","cn","esc_med","precip","erosiv","hidrom","piezo","bac_troco","bal_i","bal_c"],
    solo: ["sroa","contam","solos","carbono","aridez","desert","geo","cos_s2","cos23","cos25","cos18","cosc25","habitats","invasoras","copa18","swf21"],
    fogo: ["perig_e","perig","perig_s","ard15","ard75","sgifr_a","sgifr_l","redeprim","zif"],
    lidar: ["r_hipso","r_cdgt","r_cotas","r_somb","r_curvas"], prop: ["cad","bupi","ifap_p","ifap_o","distritos","concelhos","caop","r_projipr"],
    ref: ["o_estradas","o_edif","o_agua","o_fronteiras","o_nomes","o_picos","o_caminhos","o_cobertura","o_usos","o_planos","o_protegidas","o_aguapts","o_energia","o_patrimonio","o_vedacoes"] };
  var TEMA_CAT = {}; Object.keys(TEMA_GRUPO).forEach(function (g) { TEMA_GRUPO[g].forEach(function (id) { TEMA_CAT[id] = g; }); });
  var TEMAS_IPR = [
    { id: "terreno", nome: "Conhecer o terreno", fundo: "f_ortosat", c: ["r_somb","r_curvas","cad","hidro","o_caminhos","o_nomes"] },
    { id: "agua", nome: "Água e bacias", fundo: "f_relevo", c: ["bacias","hidro","bac_troco","aquif","inund","precip","r_somb","o_nomes"] },
    { id: "ecologia", nome: "Ecologia", fundo: "f_ortosat", c: ["habitats","n2k","rnap","cos23","copa18","swf21","invasoras","o_nomes"] },
    { id: "cond", nome: "Condicionantes", fundo: "f_ortosat", c: ["crus","ren","ran","n2k","rnap","la350","cad"] },
    { id: "campo", nome: "Campo", fundo: "f_ortosat", c: ["cad","r_curvas","o_caminhos","o_aguapts","icnfpa","o_vedacoes","o_nomes"] },
    { id: "design", nome: "Design Terracrua Design", fundo: "f_ortosat", c: ["r_curvas","r_somb","hidro","bacias","solos","cad","o_nomes"] }
  ];
  function viz() { return window.__ipe && window.__ipe.viz; }
  function trancada(id) { return window.IPR_NIVEL === "explorer" && /^(cond|agua|solo|fogo)$/.test(TEMA_CAT[id] || ""); }
  function activasCat() { var R = viz(), a = []; try { a = R.activas(); } catch (e) {} return a.filter(function (id) { return TEMA_CAT[id]; }); }
  function fundoActual() { var R = viz(), f = null; try { R.activas().forEach(function (id) { if (/^f_/.test(id)) f = id; }); } catch (e) {} return f; }
  function aplicarConjunto(ids, fundo) {
    var R = viz(); if (!R) return 0; var quer = {}, n = 0;
    ids.forEach(function (id) { if (TEMA_CAT[id] && !trancada(id)) quer[id] = 1; });
    activasCat().forEach(function (id) { if (!quer[id]) try { R.ligar(id, false); } catch (e) {} });
    Object.keys(quer).forEach(function (id) { try { R.ligar(id, true); n++; } catch (e) {} });
    if (fundo) try { R.fundo(fundo); } catch (e) {}
    return n;
  }
  function temasMeus() { try { return JSON.parse(localStorage.getItem("ipr_temas_meus") || "[]") || []; } catch (e) { return []; } }
  function temas() {
    var cab = document.querySelector(".ipr-arv-cab"); if (!cab) return false; if (cab.querySelector(".ipr-temas-b")) return true;
    if (!viz()) return false;
    var b = document.createElement("button"); b.type = "button"; b.className = "ipr-temas-b"; b.textContent = "Temas"; b.title = "Conjuntos de camadas prontos a usar";
    b.setAttribute("aria-haspopup", "true"); b.setAttribute("aria-expanded", "false");
    var m = document.createElement("div"); m.className = "ipr-temas-m"; m.hidden = true; m.setAttribute("role", "menu");
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function pinta() {
      var h = '<span class="ipr-temas-t">Temas IPR</span>';
      TEMAS_IPR.forEach(function (t) { h += '<button type="button" role="menuitem" data-tema="ipr:' + t.id + '">' + esc(t.nome) + "</button>"; });
      var meus = temasMeus();
      if (meus.length) { h += '<span class="ipr-temas-t">Os meus temas</span>'; meus.forEach(function (t, i) { h += '<div class="ipr-temas-l"><button type="button" role="menuitem" data-tema="meu:' + i + '">' + esc(t.nome) + '</button><button type="button" class="ipr-temas-x" data-tirar="' + i + '" title="Retirar este tema" aria-label="Retirar ' + esc(t.nome) + '">×</button></div>'; }); }
      h += '<button type="button" class="ipr-temas-g" data-guardar>Guardar como o meu tema</button>';
      if (window.IPR_NIVEL === "explorer") h += '<p class="ipr-temas-n">Algumas camadas dos temas são do Intelligence e ficam desligadas.</p>';
      m.innerHTML = h;
    }
    function fechar() { m.hidden = true; b.setAttribute("aria-expanded", "false"); }
    b.addEventListener("click", function (e) { e.stopPropagation(); if (!m.hidden) { fechar(); return; } pinta(); m.hidden = false; b.setAttribute("aria-expanded", "true"); });
    m.addEventListener("click", function (e) {
      e.stopPropagation(); var t = e.target;
      if (t.closest("[data-guardar]")) {
        var nome = "", w = m.querySelector(".ipr-temas-in");
        if (!w) { w = document.createElement("div"); w.className = "ipr-temas-in"; w.innerHTML = '<input type="text" maxlength="40" placeholder="Nome do tema" aria-label="Nome do tema"><button type="button" data-ok>Guardar</button>'; m.appendChild(w); w.querySelector("input").focus(); return; }
        return;
      }
      if (t.closest("[data-ok]")) {
        var inp = m.querySelector(".ipr-temas-in input"), nm = (inp && inp.value || "").trim().slice(0, 40); if (!nm) { inp && inp.focus(); return; }
        var meus = temasMeus(); meus.push({ nome: nm, fundo: fundoActual(), c: activasCat() }); try { localStorage.setItem("ipr_temas_meus", JSON.stringify(meus.slice(-20))); } catch (x) {}
        pinta(); return;
      }
      var x = t.closest("[data-tirar]"); if (x) { var l = temasMeus(); l.splice(+x.getAttribute("data-tirar"), 1); try { localStorage.setItem("ipr_temas_meus", JSON.stringify(l)); } catch (y) {} pinta(); return; }
      var q = t.closest("[data-tema]"); if (!q) return;
      var k = q.getAttribute("data-tema").split(":"), tema = k[0] === "ipr" ? TEMAS_IPR.filter(function (z) { return z.id === k[1]; })[0] : temasMeus()[+k[1]];
      if (tema) { aplicarConjunto(tema.c || [], tema.fundo); fechar(); }
    });
    m.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter" && e.target.matches(".ipr-temas-in input")) { var o = m.querySelector("[data-ok]"); o && o.click(); } if (e.key === "Escape") fechar(); });
    document.addEventListener("click", function (e) { if (!m.hidden && !m.contains(e.target) && e.target !== b) fechar(); });
    cab.insertBefore(b, cab.firstChild); cab.appendChild(m);
    return true;
  }

  // 26. Geografia natural (compilação §30, 24/10/2026): botão próprio, ao lado do claro/escuro. Mantém o enquadramento, desliga
  // limites administrativos e infra-estruturas e liga relevo, água, vegetação e habitats (o que o nível da conta permite).
  // Carregar outra vez repõe as camadas que estavam ligadas antes.
  var NAT_OFF = ["distritos","concelhos","caop","cad","bupi","ifap_p","ifap_o","r_projipr","crus","viaria","ferro","eletr","marcos","aero","defesa","o_estradas","o_edif","o_usos","o_energia","o_vedacoes","o_fronteiras","o_patrimonio","o_nomes","o_picos","o_caminhos"]; // 24/10 17h34: sem toponímia, estradas nem caminhos
  var NAT_ON = ["r_somb","hidro","o_agua","o_planos","bacias","habitats","copa18","swf21","o_cobertura"]; // água, floresta, estrutura natural, bacias
  var natAntes = null;
  function natural() {
    // 25/10, 19h33 (Nuno): «tirar esse botão por agora, porque não está a funcionar». Fica desligado até ser refeito.
    if (!natural.on) { var xb = document.getElementById("ipr-natural"); if (xb) xb.remove(); return true; }
    var tm = document.getElementById("ipe-tema"); if (!tm || !tm.parentNode) return false; if (document.getElementById("ipr-natural")) return true;
    if (!viz()) return false;
    var b = document.createElement("button"); b.type = "button"; b.id = "ipr-natural"; b.className = tm.className + " ipr-natural";
    b.setAttribute("aria-pressed", "false"); b.title = "Geografia natural: realça os sistemas naturais e baixa os limites e as infra-estruturas";
    b.setAttribute("aria-label", "Geografia natural");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19l6-9 4 5 3-4 5 8z"/><path d="M12 3c2 2.4 3.4 4.2 3.4 5.9a3.4 3.4 0 0 1-6.8 0C8.6 7.2 10 5.4 12 3z"/></svg>';
    var nota = document.createElement("div"); nota.className = "ipr-natural-n"; nota.hidden = true;
    nota.textContent = "Leitura actual dos sistemas naturais. Não reconstrói a paisagem pré-humana.";
    b.addEventListener("click", function () {
      var R = viz(); if (!R) return;
      if (!natAntes) {
        natAntes = { c: activasCat(), fundo: fundoActual() };
        NAT_OFF.forEach(function (id) { try { R.ligar(id, false); } catch (e) {} });
        NAT_ON.forEach(function (id) { if (TEMA_CAT[id] && !trancada(id)) try { R.ligar(id, true); } catch (e) {} });
        b.setAttribute("aria-pressed", "true"); b.classList.add("on"); nota.hidden = false;
        clearTimeout(b.__t); b.__t = setTimeout(function () { nota.hidden = true; }, 6000);
      } else {
        aplicarConjunto(natAntes.c, natAntes.fundo); natAntes = null;
        b.setAttribute("aria-pressed", "false"); b.classList.remove("on"); nota.hidden = true;
      }
    });
    tm.parentNode.insertBefore(b, tm.nextSibling); document.body.appendChild(nota);
    return true;
  }
  // 21. Aprendizagem com o desenho (§21, Nuno, 24/10/2026, 00h20: «com coordenadas arredondadas»; servidor no m90334).
  //     Regista a ferramenta, o tipo de elemento, a acção e se a parcela proposta pelo cadastro foi aceite ou corrigida, com a
  //     posição arredondada a 2 casas (~1 km), os vértices e a área ou o comprimento. Nunca nomes, texto, fotografias nem a conta.
  //     Só com sessão (window.TCD_APR, posto pelo m90334) e sem «Do Not Track» nem «Global Privacy Control».
  //     Envia em lotes, no máximo um pedido a cada 30 s; o que fica por enviar ao sair guarda-se e segue na visita seguinte.
  function aprenderDesenho() {
    var C = window.TCD_APR, I = mapa(); if (!C || !C.aj || !C.n) return true; // sem sessão ou com DNT/GPC: nada a fazer
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return true;
    if (!I || !I.on) return false;
    var CH = "ipr_apr_fila", fila = [], ult = 0, tm = null, corr = {}, med = 0, ferr = "";
    try { fila = JSON.parse(ler(CH) || "[]") || []; } catch (e) { fila = []; } gravar(CH, "[]");
    function r2(x) { x = +x; return isFinite(x) ? Math.round(x * 100) / 100 : null; }
    function est() { return window.__ipe && window.__ipe.estado ? window.__ipe.estado : {}; }
    function ferrAct() { var t = String(est().tool || ""); return /^(desenhar|parcelas|regua|area|marcador|importar|perfil)$/.test(t) ? t : "outra"; }
    function hav(a, b) { var R = 6371008.8, p = Math.PI / 180, dl = (b[1] - a[1]) * p, dn = (b[0] - a[0]) * p, s = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[1] * p) * Math.cos(b[1] * p) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.min(1, Math.sqrt(s))); }
    function areaAnel(c) { var R = 6378137, p = Math.PI / 180, s = 0; for (var i = 0; i < c.length - 1; i++) s += (c[i + 1][0] - c[i][0]) * p * (2 + Math.sin(c[i][1] * p) + Math.sin(c[i + 1][1] * p)); return Math.abs(s * R * R / 2); }
    function medidas(g) {
      var o = { el: "outro", v: 0, x: 0, lat: null, lon: null }, pts = [];
      if (!g || !g.coordinates) return o;
      if (g.type === "Point") { o.el = "ponto"; pts = [g.coordinates]; }
      else if (g.type === "LineString") { o.el = "linha"; pts = g.coordinates; for (var i = 1; i < pts.length; i++) o.x += hav(pts[i - 1], pts[i]); }
      else if (g.type === "Polygon") { o.el = "poligono"; pts = (g.coordinates[0] || []).slice(0, -1); o.x = areaAnel(g.coordinates[0] || []); }
      else if (g.type === "MultiPolygon") { o.el = "poligono"; g.coordinates.forEach(function (p) { pts = pts.concat((p[0] || []).slice(0, -1)); o.x += areaAnel(p[0] || []); }); }
      o.v = pts.length;
      if (pts.length) { var sx = 0, sy = 0; pts.forEach(function (q) { sx += +q[0]; sy += +q[1]; }); o.lon = r2(sx / pts.length); o.lat = r2(sy / pts.length); }
      o.x = Math.round(o.x); return o;
    }
    function por(f, a, el, extra) {
      var e = { f: f, a: a, el: el || "outro" };
      if (extra) for (var k in extra) if (extra[k] != null) e[k] = extra[k];
      if (e.lat != null) e.lat = r2(e.lat); if (e.lon != null) e.lon = r2(e.lon);
      fila.push(e); if (fila.length > 400) fila = fila.slice(-400);
      agendar();
    }
    function enviar(sair) {
      tm = null; if (!fila.length) return;
      var agora = Date.now(); if (agora - ult < 30000) { if (sair) gravar(CH, JSON.stringify(fila)); else agendar(); return; }
      ult = agora; var lote = fila.splice(0, 40), fd = new FormData();
      fd.append("action", "tcd_m334"); fd.append("n", C.n); fd.append("e", JSON.stringify(lote));
      if (sair) { var ok = false; try { ok = navigator.sendBeacon && navigator.sendBeacon(C.aj, fd); } catch (e) {} if (fila.length || !ok) gravar(CH, JSON.stringify(ok ? fila : lote.concat(fila))); return; }
      try { fetch(C.aj, { method: "POST", body: fd, credentials: "same-origin", keepalive: true }).catch(function () {}); } catch (e) {}
      if (fila.length) agendar();
    }
    function agendar() { if (!tm) tm = setTimeout(function () { enviar(false); }, Math.max(1000, 30000 - (Date.now() - ult))); }
    function desenho() { var cs = I._controls || []; for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function" && typeof cs[i].changeMode === "function") return cs[i]; return null; }
    // Desenho: criar, alterar, apagar. Alterar uma parcela vinda do cadastro (tem «ref») conta como «corrigido».
    ["draw.create", "draw.update", "draw.delete"].forEach(function (ev) {
      I.on(ev, function (e) {
        try {
          var a = { "draw.create": "criou", "draw.update": "alterou", "draw.delete": "apagou" }[ev];
          (e.features || []).forEach(function (ft) {
            var m = medidas(ft.geometry), ref = ft.properties && ft.properties.ref, f = ref ? "parcelas" : ferrAct(), r = "";
            if (f === "outra" && ev === "draw.create") f = "desenhar";
            if (ref && ev === "draw.update") { r = "corrigido"; corr[ref] = 1; }
            if (ref && ev === "draw.delete") corr[ref] = 1; // retirada: não conta como aceite
            por(f, a, m.el, { r: r, v: m.v, x: m.x, lat: m.lat, lon: m.lon });
          });
        } catch (x) {}
      });
    });
    // Ferramentas: cada escolha conta como «usou»; régua e área contam os pontos e registam «mediu» ao terminar.
    var barra = document.querySelector("#ipe .ipe-tools");
    if (barra) barra.addEventListener("click", function (e) {
      try {
        var b = e.target.closest("[data-tool]"); if (!b || b.disabled) return;
        var t = String(b.dataset.tool || ""); fimMedida();
        por(/^(desenhar|parcelas|regua|area|marcador|importar|perfil)$/.test(t) ? t : "outra", "usou", "outro");
        ferr = t;
      } catch (x) {}
    }, true);
    var pts = [];
    function fimMedida() {
      if (!pts.length || (ferr !== "regua" && ferr !== "area")) { pts = []; return; }
      var g = ferr === "area" && pts.length > 2 ? { type: "Polygon", coordinates: [pts.concat([pts[0]])] } : { type: "LineString", coordinates: pts };
      var m = medidas(g); por(ferr, "mediu", ferr === "area" ? "poligono" : "linha", { v: m.v, x: m.x, lat: m.lat, lon: m.lon }); pts = [];
    }
    I.on("click", function (e) { try { var t = ferrAct(); if (t !== "regua" && t !== "area") return; if (ferr !== t) { fimMedida(); ferr = t; } pts.push([e.lngLat.lng, e.lngLat.lat]); } catch (x) {} });
    I.on("dblclick", function () { try { setTimeout(fimMedida, 0); } catch (x) {} });
    // Ao sair: parcelas do cadastro que ficaram sem correcção contam como «aceite»; depois envia ou guarda a fila.
    window.addEventListener("pagehide", function () {
      try {
        fimMedida(); var D = desenho();
        if (D) D.getAll().features.forEach(function (ft) { var ref = ft.properties && ft.properties.ref; if (ref && !corr[ref]) { corr[ref] = 1; var m = medidas(ft.geometry); fila.push({ f: "parcelas", a: "usou", el: m.el, r: "aceite", v: m.v, x: m.x, lat: m.lat, lon: m.lon }); } });
        enviar(true);
      } catch (x) {}
    });
    if (fila.length) agendar();
    return true;
  }
  // 28. Fichas de camada: «Ficha da camada» no menu «⋯» (§19) e window.IPR_FICHAS para a Formiga.
  // Dados do catálogo do viz.js; o que não se sabe fica «a confirmar», sem números inventados.
  var FICHAS = null;
  function fichasDados() {
    if (FICHAS) return FICHAS;
    var G={"fundo":"Fundo","lidar":"Relevo e terreno","prop":"Propriedade e limites","cond":"Condicionantes","fogo":"Fogo","agua":"Água","solo":"Solo, ocupação e vegetação","ref":"Referência (OpenStreetMap)"},T={"wms":{"l":"Imagem gerada pelo serviço de origem; as cores seguem a legenda do serviço.","e":"","lim":"Imagem fixa: não permite consultar atributos aqui; depende da disponibilidade do serviço.","c":"Portugal continental"},"wmsp":{"l":"Imagem gerada pelo serviço de origem, pedida por partes.","e":"","lim":"Serviço lento; pode demorar ou falhar.","c":"Portugal continental"},"ags":{"l":"Camada servida pelo ArcGIS da entidade; cores conforme a simbologia original. Clicar para ver atributos, quando disponíveis.","e":"","lim":"Depende do servidor da entidade; a simbologia pode diferir da oficial impressa.","c":"Portugal continental"},"apa":{"l":"Pontos da APA; clicar para ver a informação da zona balnear.","e":"","lim":"Depende do serviço da APA.","c":"Portugal (zonas identificadas)"},"mvt":{"l":"Vector: as cores seguem a legenda; clicar num elemento para ver os atributos.","e":"","lim":"Cópia vectorial preparada para o Atlas: pode não reflectir a última alteração publicada.","c":"Portugal continental"},"hill":{"l":"Luz rasante simulada: encostas iluminadas a claro, encostas opostas a escuro.","e":"","lim":"Só visualização: não dá valores de altitude.","c":""},"curvas":{"l":"Linhas que unem pontos à mesma altitude; quanto mais juntas, mais inclinado.","e":"","lim":"Só para visualizar; não substitui um levantamento topográfico.","c":""},"omtbase":{"l":"Mapa de base com a simbologia habitual de estradas, povoações e nomes.","e":"","lim":"Dados colaborativos: completude variável conforme a zona.","c":"Mundial"},"xyz":{"l":"Mosaico de imagem; não tem legenda.","e":"","lim":"Fonte externa; a data das imagens varia conforme a zona.","c":"Mundial"},"img":{"l":"Imagem matricial; as cores seguem a legenda do produto Copernicus.","e":"","lim":"Produto europeu harmonizado: pode falhar pormenores locais.","c":"Europa (Copernicus)"},"omt":{"l":"Elementos do OpenStreetMap desenhados por cima do mapa.","e":"","lim":"Dados colaborativos: completude variável conforme a zona.","c":"Mundial"},"ovp":{"l":"Elementos pedidos ao OpenStreetMap só quando se aproxima; clicar para ver as etiquetas.","e":"","lim":"Só carrega a grande aproximação; completude variável e consulta por vezes lenta.","c":"Mundial"},"ent":{"l":"Pontos aproximados de projectos; clicar para ver o resumo.","e":"","lim":"Localização arredondada a cerca de 5 km, de propósito.","c":"Projectos com autorização dos clientes"},"lidar":{"l":"Derivado calculado sobre o modelo do terreno; as cores seguem a legenda.","e":"","lim":"Calculado por algoritmo: confirmar no local antes de decidir obras.","c":"Área processada de cada projecto"}},S={"fundo":"Dar contexto visual por baixo das outras camadas e comparar épocas.","lidar":"Ler a forma do terreno: cotas, declives e escoamento, para implantar caminhos, charcas e construções.","prop":"Situar o terreno nos limites de propriedade e administrativos.","cond":"Verificar condicionantes legais e servidões antes de projectar ou licenciar.","fogo":"Avaliar o risco de incêndio e as obrigações de gestão de combustível.","agua":"Compreender a água no terreno e na bacia: disponibilidade, riscos e protecção.","solo":"Conhecer o solo, a sua ocupação e a vegetação, para planear usos e plantações.","ref":"Referência geral para orientação no terreno."},SX={"Cheias":"Identificar risco de cheia e zonas onde a construção é condicionada.","Escassez":"Avaliar a pressão sobre a água disponível na bacia.","Pontos de água":"Localizar água disponível perto do terreno.","Hidrologia do solo":"Dimensionar charcas, valas e linhas de keyline e prever o escoamento.","Clima":"Estimar a água da chuva e o risco de erosão.","Ocupação":"Ver o uso actual do solo e a sua evolução.","Áreas ardidas":"Conhecer o histórico de fogo do local.","Rede IPR":"Ver projectos próximos já acompanhados."},EX={"fundo":"Ligar uma ortofoto antiga e a actual para ver o que mudou num terreno.","lidar":"Escolher onde fazer uma charca seguindo as curvas e a acumulação de fluxo.","prop":"Confirmar em que freguesia e prédio fica um ponto.","cond":"Ver se uma parcela é abrangida por esta condicionante antes de pedir licenciamento.","fogo":"Verificar se uma casa fica em área de perigosidade alta e que faixa deve limpar.","agua":"Ver se uma linha de água próxima cria margem de domínio público ou risco de cheia.","solo":"Comparar a COS 2018 com a 2025 para ver se houve abandono ou florestação.","ref":"Encontrar o caminho de acesso e os nomes do lugar."},L={"f_ortosat":["OrtoSat 2023 · 30 cm","fundo","Actual","wms","Ortofotomapa recente do continente, imagem aérea corrigida geometricamente.","DGT","2023","","30 cm",0,"",0,"","d"],"f_orto18":["Ortofotos 2018 · 25 cm","fundo","Actual","wms","Ortofotomapa de 2018, útil para comparar com a imagem actual.","DGT","2018","","25 cm",0,"",0,"","d"],"f_s2jul":["Sentinel-2 · Julho 2025","fundo","Satélite","wms","Mosaico de imagens Sentinel-2 de Verão, em cores naturais.","DGT / Copernicus","2025","","",0,"",0,"","d"],"f_s2jan":["Sentinel-2 · Janeiro 2025","fundo","Satélite","wms","Mosaico de imagens Sentinel-2 de Inverno, em cores naturais.","DGT / Copernicus","2025","","",0,"",0,"","d"],"f_s2out":["Sentinel-2 · Out. 2025 · infravermelho (cores virtuais)","fundo","Satélite","wms","Mosaico Sentinel-2 de Outono em falsa cor (infravermelho): a vegetação viva aparece em vermelho.","DGT / Copernicus","2025","","",0,"",0,"","d"],"f_o15":["Ortofotos 2015","fundo","Histórico","wms","Ortofotos históricas de 2015.","DGT","2015","","",0,"",0,"","d"],"f_o12":["Ortofotos 2012","fundo","Histórico","wms","Ortofotos históricas de 2012.","DGT","2012","","",0,"",0,"","d"],"f_o07":["Ortofotos 2007","fundo","Histórico","wms","Ortofotos históricas de 2007.","DGT","2007","","",0,"",0,"","d"],"f_o95":["Ortofotos 1995 · infravermelho (cores virtuais)","fundo","Histórico","wms","Ortofotos históricas de 1995 em infravermelho (falsa cor).","DGT","1995","","",0,"",0,"","d"],"f_relevo":["Relevo sombreado","fundo","Cartográfico","hill","Relevo sombreado calculado a partir de modelos de elevação, como fundo cartográfico.","Mapterhorn · LiDAR DGT 0,5 m","","","0,5 m",0,"",0,"","d"],"f_mapa":["Mapa (OpenStreetMap)","fundo","Cartográfico","omtbase","Mapa de base OpenStreetMap: estradas, povoações, nomes e uso do solo genérico.","© OpenStreetMap · OpenFreeMap","","","",0,"",0,"","d"],"f_esri":["Esri · imagem de satélite","fundo","Satélite","xyz","Imagem de satélite e aérea global da Esri e parceiros.","© Esri, Maxar, Earthstar Geographics e comunidade SIG","","","",0,"",0,"","d"],"f_otm":["OpenTopoMap · relevo e caminhos","fundo","Cartográfico","xyz","Mapa topográfico OpenTopoMap, com curvas de nível, relevo e caminhos.","© OpenStreetMap, SRTM · OpenTopoMap (CC BY-SA)","","","",0,"",0,"","d"],"f_s2g":["Sentinel-2 · Península e mundo (sem nuvens)","fundo","Satélite","xyz","Mosaico Sentinel-2 sem nuvens de 2016, para contexto regional e fora de Portugal.","Sentinel-2 cloudless 2016 by EOX IT Services GmbH (Copernicus Sentinel data 2016), CC BY 4.0","","Península Ibérica e mundo","",0,"Mosaico de 2016, licença aberta; os anos mais recentes da EOX são só para uso não comercial",0,"","d"],"r_somb":["Relevo sombreado","lidar","Pré-visualização pública","hill","Relevo sombreado de pormenor a partir do LiDAR da DGT.","Mapterhorn · LiDAR DGT 0,5 m","","","0,5 m",0,"",0,"","x"],"r_hipso":["Hipsometria (DGT)","lidar","Pré-visualização pública","wms","Hipsometria oficial da DGT: cores por classes de altitude.","","","","",0,"",0,"","x"],"r_curvas":["Curvas de nível (LiDAR DGT, 1 a 50 m)","lidar","Pré-visualização pública","curvas","Curvas de nível geradas para visualização, com equidistância que muda com a aproximação.","Mapterhorn · LiDAR DGT 0,5 m · PNOA-LiDAR IGN/CNIG (CC BY 4.0)","","","50 m",0,"Só para visualizar: a equidistância ajusta-se à aproximação. Os ficheiros da Base Cartográfica saem directamente do LiDAR da DGT.",0,"","x"],"r_cdgt":["Curvas de nível oficiais (DGT, 25 m)","lidar","Pré-visualização pública","mvt","Curvas de nível oficiais da DGT, com equidistância de 25 m.","DGT · altimetria","","","25 m",10,"Curvas oficiais de 25 em 25 m. A Base Cartográfica traz curvas de 0,5 a 5 m do LiDAR.",0,"","x"],"r_cotas":["Pontos cotados (DGT)","lidar","Pré-visualização pública","mvt","Pontos cotados da cartografia da DGT, com a altitude de cada ponto.","","","","",14,"",0,"","x"],"cad":["Cadastro predial","prop","Propriedade","mvt","Prédios do cadastro predial geométrico (onde existe cadastro).","DGT · Cadastro predial","","Concelhos com cadastro geométrico","",12,"",1,"","d"],"bupi":["BUPi · prédios georreferenciados","prop","Propriedade","ags","Prédios georreferenciados no BUPi (representação gráfica georreferenciada, RGG).","BUPi","","Concelhos aderentes ao BUPi","",12,"Origem instável: pode demorar ou falhar",1,"","x"],"ifap_p":["IFAP · parcelas agrícolas","prop","Propriedade","wms","Parcelas agrícolas do sistema de identificação parcelar do IFAP (iSIP).","IFAP iSIP","","","",13,"Origem instável: pode demorar ou falhar",1,"","x"],"ifap_o":["IFAP · ocupação das parcelas","prop","Propriedade","wms","Ocupação declarada das parcelas agrícolas do IFAP.","IFAP iSIP","","","",13,"Origem instável: pode demorar ou falhar",1,"","x"],"distritos":["Distritos","prop","Limites administrativos (CAOP 2025)","mvt","Limites dos distritos da Carta Administrativa Oficial (CAOP 2025).","","2025","Portugal continental e regiões autónomas","",0,"",0,"","d"],"concelhos":["Concelhos","prop","Limites administrativos (CAOP 2025)","mvt","Limites dos concelhos (municípios) da CAOP 2025.","","2025","Portugal continental e regiões autónomas","",7,"",0,"","d"],"caop":["Freguesias","prop","Limites administrativos (CAOP 2025)","mvt","Limites das freguesias da CAOP 2025.","DGT · CAOP 2025","2025","Portugal continental e regiões autónomas","",9,"",0,"","d"],"crus":["PDM · qualificação do solo (CRUS)","cond","Ordenamento (PDM)","mvt","Classificação e qualificação do solo dos PDM (Carta do Regime de Uso do Solo).","","","","",9,"Indicativo; vinculativo é o publicado em DR / SNIT",1,"Agrícola, Florestal, Agroflorestal, Natural, Urbano, Actividades económicas, Equipamentos, Recursos geológicos","d"],"ren":["REN","cond","Reservas","mvt","Reserva Ecológica Nacional: áreas com restrições de uso por valor ou risco ecológico.","DGT · SRUP","","","",11,"",1,"","d"],"ran":["RAN","cond","Reservas","mvt","Reserva Agrícola Nacional: solos de maior aptidão agrícola, com restrições de uso.","DGT · SRUP","","","",11,"",1,"","d"],"n2k":["Rede Natura 2000","cond","Natureza","ags","Sítios e zonas de protecção especial da Rede Natura 2000.","ICNF","","","",0,"",0,"","d"],"rnap":["Áreas protegidas","cond","Natureza","ags","Áreas protegidas da Rede Nacional (parques, reservas, paisagens protegidas).","ICNF","","","",0,"",0,"","d"],"arv":["Árvores de interesse público","cond","Natureza","mvt","Árvores e arvoredo classificados de interesse público.","","","","",10,"",1,"","d"],"dph":["Domínio público hídrico","cond","Água","wmsp","Domínio público hídrico: leitos e margens de águas públicas.","DGT · SNIT","","","",13,"Origem instável: pode demorar ou falhar",1,"","x"],"la350":["Linhas de água com bacia > 350 ha","cond","Água","ags","Linhas de água cuja bacia drenante excede 350 ha.","APA","","","",9,"",0,"","d"],"albzr":["Albufeiras e lagoas · zona reservada","cond","Água","ags","Zonas reservadas das albufeiras e lagoas classificadas.","APA","","","",0,"",0,"","d"],"albuf":["Albufeiras classificadas","cond","Água","mvt","Albufeiras de águas públicas classificadas.","","","","",0,"",1,"","d"],"capt":["Perímetros de protecção de captações","cond","Água","ags","Perímetros de protecção de captações de água para abastecimento público.","APA","","","",0,"",0,"","d"],"eletr":["Rede eléctrica","cond","Servidões","mvt","Servidão da rede eléctrica (linhas e instalações).","","","","",8,"",1,"","d"],"viaria":["Rede rodoviária nacional","cond","Servidões","mvt","Servidão da rede rodoviária nacional.","","","","",8,"",1,"","d"],"ferro":["Rede ferroviária","cond","Servidões","mvt","Servidão da rede ferroviária.","","","","",8,"",1,"","d"],"marcos":["Marcos geodésicos","cond","Servidões","mvt","Marcos geodésicos e respectiva zona de protecção.","","","","",10,"",1,"","d"],"aero":["Servidões aeronáuticas","cond","Servidões","mvt","Servidões aeronáuticas (zonas de protecção de aeródromos).","","","","",8,"",1,"","d"],"defesa":["Defesa nacional","cond","Servidões","mvt","Servidões militares e de defesa nacional.","","","","",8,"",1,"","d"],"perig_e":["Perigosidade estrutural 2020–2030","fogo","Perigosidade","ags","Carta de perigosidade de incêndio rural estrutural para 2020 a 2030.","ICNF","2020 a 2030","","",0,"",0,"","d"],"perig":["Perigosidade conjuntural 2026","fogo","Perigosidade","ags","Carta de perigosidade de incêndio rural conjuntural para 2026.","ICNF","2026","","",8,"",0,"","d"],"perig_s":["Perigosidade de incêndio (SRUP / PMDFCI)","fogo","Perigosidade","mvt","Perigosidade de incêndio publicada como servidão (SRUP) ou nos planos municipais (PMDFCI).","","","","",9,"",1,"Muito baixa, Baixa, Média, Alta, Muito alta","d"],"ard15":["Áreas ardidas 2015–2025","fogo","Áreas ardidas","ags","Áreas ardidas cartografadas entre 2015 e 2025.","ICNF","2015 a 2025","","",0,"",0,"","d"],"ard75":["Áreas ardidas 1975–2014","fogo","Áreas ardidas","ags","Áreas ardidas cartografadas entre 1975 e 2014.","ICNF","1975 a 2014","","",0,"",0,"","d"],"sgifr_a":["Faixas e mosaicos (SGIFR)","fogo","Gestão de combustível","mvt","Faixas e mosaicos de gestão de combustível do SGIFR.","","","","",10,"",1,"","d"],"sgifr_l":["Rede de gestão · linhas (SGIFR)","fogo","Gestão de combustível","mvt","Rede de gestão de combustível em linha do SGIFR.","","","","",10,"",1,"","d"],"redeprim":["Rede primária de faixas","fogo","Gestão de combustível","ags","Rede primária de faixas de gestão de combustível.","ICNF","","","",0,"",0,"","d"],"zif":["Zonas de intervenção florestal (ZIF)","fogo","Gestão de combustível","ags","Zonas de intervenção florestal.","ICNF","","","",0,"",0,"","d"],"hidro":["Rede hidrográfica","agua","Superficial","wms","Rede hidrográfica do continente (serviço INSPIRE da APA).","APA · INSPIRE","","","",8,"",0,"","d"],"hidro_g":["Rede hidrográfica geocodificada","agua","Superficial","ags","Rede hidrográfica geocodificada da APA, com hierarquia dos troços.","APA","","","",0,"",0,"","d"],"rh":["Regiões hidrográficas (RH1 a RH8)","agua","Superficial","ags","As oito regiões hidrográficas do continente.","APA","","Portugal continental","",0,"As oito regiões hidrográficas do continente, unidades de gestão dos planos de gestão de região hidrográfica.",0,"","d"],"bacias":["Bacias hidrográficas (Pfafstetter)","agua","Superficial","ags","Bacias hidrográficas pela codificação de Pfafstetter.","APA","","","",0,"Bacias dos troços de linha de água geocodificadas: do 2.º nível à escala do país até à bacia de cada troço quando se aproxima. O detalhe muda com o zoom.",0,"","d"],"massas":["Massas de água (PGRH 3.º ciclo)","agua","Superficial","ags","Massas de água superficiais dos planos de gestão (3.º ciclo).","APA","3.º ciclo dos PGRH","","",0,"",0,"","d"],"inund":["Zonas inundáveis (Directiva 2007/60/CE)","agua","Cheias","ags","Zonas inundáveis cartografadas ao abrigo da Directiva 2007/60/CE.","APA","","","",0,"",0,"","d"],"arpsi":["Risco potencial significativo de inundação","agua","Cheias","ags","Áreas de risco potencial significativo de inundação.","APA","","","",0,"",0,"","d"],"aquif":["Massas de água subterrâneas","agua","Subterrânea","wms","Massas de água subterrâneas.","APA · INSPIRE","","","",6,"",0,"","d"],"hidrog":["Unidades hidrogeológicas","agua","Subterrânea","ags","Unidades hidrogeológicas.","APA","","","",0,"",0,"","d"],"aquif_s":["Captações subterrâneas (SRUP)","agua","Subterrânea","mvt","Captações de água subterrânea publicadas como servidão (SRUP).","","","","",0,"",1,"","d"],"icnfpa":["Pontos de água DFCI (charcas, poços)","agua","Pontos de água","ags","Pontos de água para defesa da floresta contra incêndios (charcas, poços, tanques).","ICNF","","","",9,"",0,"","d"],"apasub":["Nascentes e piezómetros monitorizados","agua","Pontos de água","ags","Nascentes e piezómetros com monitorização da APA.","APA","","","",0,"",0,"","d"],"dgegn":["Captações de água de nascente","agua","Pontos de água","ags","Captações de água de nascente licenciadas pela DGEG.","DGEG","","","",0,"",1,"","d"],"ma_ecol":["Estado ecológico das linhas de água (PGRH 3)","agua","Estado das águas","ags","Estado ecológico das massas de água superficiais (PGRH 3.º ciclo).","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",0,"",0,"Excelente, Bom, Razoável, Medíocre, Mau","d"],"ma_quant":["Estado quantitativo das águas subterrâneas","agua","Estado das águas","ags","Estado quantitativo das massas de água subterrâneas.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",0,"Aquíferos em mau estado quantitativo limitam novas captações.",0,"","d"],"wei":["Escassez hídrica WEI+ por sub-bacia","agua","Escassez","ags","Índice de escassez WEI+ por sub-bacia.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",0,"Índice de exploração da água (1989–2015): acima de 40 % há escassez severa.",0,"","d"],"wei_sub":["Escassez hídrica WEI+ por massa subterrânea","agua","Escassez","ags","Índice de escassez WEI+ por massa de água subterrânea.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",0,"",0,"","d"],"capt_p":["Captações de água (subterrâneas e superficiais)","agua","Pressões","ags","Captações de água inventariadas como pressão nas massas de água.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",10,"",0,"","d"],"barragens":["Barragens e açudes","agua","Pressões","ags","Barragens e açudes inventariados como pressão.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",8,"",0,"","d"],"etar":["ETAR e pontos de descarga","agua","Pressões","ags","Estações de tratamento de águas residuais e pontos de descarga.","APA","","","",9,"",0,"","d"],"nitratos":["Zonas vulneráveis a nitratos","agua","Protecção","ags","Zonas vulneráveis à poluição por nitratos de origem agrícola.","APA","","","",0,"",0,"","d"],"zprot":["Zonas protegidas da Lei da Água","agua","Protecção","ags","Zonas protegidas ao abrigo da Lei da Água.","APA · PGRH 3.º ciclo","3.º ciclo dos PGRH","","",0,"",0,"","d"],"albpub":["Albufeiras de águas públicas (protecção)","agua","Protecção","ags","Albufeiras de águas públicas e respectiva protecção.","APA","","","",0,"",0,"","d"],"zadj":["Zonas adjacentes (publicadas em DR)","agua","Cheias","ags","Zonas adjacentes classificadas e publicadas em Diário da República.","APA","","","",0,"",0,"","d"],"marcas":["Marcas de cheia históricas","agua","Cheias","ags","Marcas de cheias históricas registadas no SNIRH.","APA · SNIRH","","","",0,"",0,"","d"],"scs":["Grupo hidrológico do solo (A, B, C, D)","agua","Hidrologia do solo","ags","Grupo hidrológico do solo (A a D), da maior à menor infiltração.","APA · Atlas da Água","","","",0,"Infiltração: A alta, D baixa. Útil para charcas, keyline e escoamento.",0,"","d"],"cn":["Número de escoamento (CN)","agua","Hidrologia do solo","ags","Número de escoamento (Curve Number): propensão do terreno para escoar a chuva.","APA · Atlas da Água","","","",0,"",0,"","d"],"esc_med":["Escoamento médio anual","agua","Hidrologia do solo","ags","Escoamento médio anual.","APA · Atlas da Água","","","",0,"",0,"","d"],"precip":["Precipitação total anual (1959–1991)","agua","Clima","ags","Precipitação total anual média do período 1959 a 1991.","APA · Atlas da Água","1959 a 1991","","",0,"",0,"","d"],"erosiv":["Erosividade da precipitação (factor R)","agua","Clima","ags","Erosividade da precipitação (factor R da equação universal de perda de solo).","APA · Atlas da Água","","","",0,"",0,"","d"],"hidrom":["Estações hidrométricas e udométricas (SNIRH)","agua","Estações","ags","Estações hidrométricas e udométricas da rede SNIRH.","APA · SNIRH","","","",0,"",0,"","d"],"piezo":["Piezómetros (nível das águas subterrâneas)","agua","Estações","ags","Piezómetros que medem o nível das águas subterrâneas.","APA · SNIRH","","","",0,"",0,"","d"],"bac_troco":["Bacias de cada troço de linha de água","agua","Superficial","ags","Bacia drenante de cada troço da rede hidrográfica.","APA","","","",10,"",0,"","d"],"sroa":["Capacidade de uso do solo (SROA)","solo","Solo","ags","Carta de capacidade de uso do solo (classes SROA).","APA · Atlas do Ambiente","","","",0,"",0,"","d"],"contam":["Solos contaminados e passivos ambientais","solo","Solo","ags","Solos contaminados e passivos ambientais identificados.","APA · Atlas da Qualidade dos Solos","","","",9,"",0,"","d"],"bal_i":["Zonas balneares oficiais · interiores","agua","Banhos","apa","Zonas balneares interiores oficialmente identificadas.","APA · águas balneares","","","",0,"",0,"","d"],"bal_c":["Zonas balneares oficiais · costeiras","agua","Banhos","apa","Zonas balneares costeiras oficialmente identificadas.","APA · águas balneares","","","",0,"",0,"","d"],"solos":["Carta de solos","solo","Solo","wms","Carta de solos da DGADR (tipos de solo).","DGADR","","","",0,"Serviço DGADR sem resposta a partir do servidor (16 Out)",1,"","x"],"carbono":["Carbono orgânico no solo","solo","Solo","ags","Carbono orgânico no solo.","ICNF","","","",0,"",0,"","d"],"aridez":["Índice de aridez","solo","Solo","ags","Índice de aridez.","ICNF","","","",0,"",0,"","d"],"desert":["Susceptibilidade à desertificação","solo","Solo","ags","Susceptibilidade do território à desertificação.","ICNF","","","",0,"",0,"","d"],"geo":["Geologia 1:500 000","solo","Geologia","wms","Carta geológica de Portugal à escala 1:500 000.","LNEG","","","1:500 000",6,"Origem instável: pode demorar ou falhar",1,"","x"],"cos_s2":["Uso do solo · COS 2023 (S2)","solo","Ocupação","wms","Carta de uso e ocupação do solo de 2023 obtida de Sentinel-2 (matricial).","DGT","2023","","",10,"",0,"","d"],"cos23":["COS 2023 (vector)","solo","Ocupação","mvt","Carta de uso e ocupação do solo (COS) de 2023, em vector.","","2023","","",10,"",0,"Artificializado, Agricultura, Pastagens, Agroflorestal, Floresta, Matos, Sem vegetação, Zonas húmidas","d"],"cos25":["COS 2025 (vector)","solo","Ocupação","mvt","Carta de uso e ocupação do solo (COS) de 2025, em vector.","","2025","","",10,"",0,"Artificializado, Agricultura, Pastagens, Agroflorestal, Floresta, Matos, Sem vegetação, Zonas húmidas","d"],"cos18":["COS 2018 (vector)","solo","Ocupação","mvt","Carta de uso e ocupação do solo (COS) de 2018, em vector.","","2018","","",10,"",0,"Artificializado, Agricultura, Pastagens, Agroflorestal, Floresta, Matos, Sem vegetação, Zonas húmidas","d"],"cosc25":["COS conjuntural 2025","solo","Ocupação","wms","Carta de ocupação do solo conjuntural de 2025.","DGT","2025","","",0,"",0,"","d"],"copa18":["Densidade de copa 2018","solo","Vegetação","img","Densidade de copa arbórea de 2018 (Copernicus).","Copernicus Land","2018","","",0,"",0,"","d"],"swf21":["Árvores isoladas e sebes 2021 · 5 m","solo","Vegetação","img","Pequenas formações lenhosas: árvores isoladas e sebes, 2021 (Copernicus).","Copernicus Land","2021","","5 m",12,"",0,"","d"],"habitats":["Habitats em ZEC","solo","Vegetação","ags","Habitats naturais cartografados nas zonas especiais de conservação.","ICNF","","","",0,"",0,"","d"],"invasoras":["Espécies invasoras (IFN)","solo","Vegetação","ags","Ocorrências de espécies invasoras registadas no Inventário Florestal Nacional.","ICNF","","","",0,"",0,"","d"],"o_estradas":["Estradas e caminhos","ref","Contexto (OpenStreetMap)","omt","Estradas e caminhos do OpenStreetMap.","© OpenStreetMap","","","",0,"",0,"","d"],"o_edif":["Edifícios","ref","Contexto (OpenStreetMap)","omt","Edifícios do OpenStreetMap.","© OpenStreetMap","","","",13,"",0,"","d"],"o_agua":["Cursos de água","ref","Contexto (OpenStreetMap)","omt","Cursos de água do OpenStreetMap.","© OpenStreetMap","","","",0,"",0,"","d"],"o_fronteiras":["Fronteiras e regiões","ref","Contexto (OpenStreetMap)","omt","Fronteiras e limites regionais do OpenStreetMap.","© OpenStreetMap","","","",0,"",0,"","d"],"o_nomes":["Toponímia (localidades, rios, serras)","ref","Contexto (OpenStreetMap)","omt","Toponímia do OpenStreetMap: localidades, rios e serras.","© OpenStreetMap","","","",0,"",0,"","d"],"o_picos":["Picos e vértices com cota","ref","Contexto (OpenStreetMap)","omt","Picos e vértices com cota do OpenStreetMap.","© OpenStreetMap","","","",10,"",0,"","d"],"o_caminhos":["Caminhos rurais e trilhos","ref","Contexto (OpenStreetMap)","omt","Caminhos rurais e trilhos do OpenStreetMap.","© OpenStreetMap","","","",12,"",0,"","d"],"o_cobertura":["Cobertura do solo (mata, prado, cultivo)","ref","Contexto (OpenStreetMap)","omt","Cobertura do solo do OpenStreetMap (mata, prado, cultivo).","© OpenStreetMap","","","",0,"",0,"Mata e floresta, Prado e pastagem, Cultivo, Zona húmida, Areia e rocha","d"],"o_usos":["Usos (habitação, indústria, pedreiras)","ref","Contexto (OpenStreetMap)","omt","Usos do solo do OpenStreetMap (habitação, indústria, pedreiras).","© OpenStreetMap","","","",10,"",0,"Habitação, Indústria e comércio, Pedreira, Quintas e agrícola, Cemitério e parques","d"],"o_planos":["Planos de água","ref","Contexto (OpenStreetMap)","omt","Planos de água do OpenStreetMap.","© OpenStreetMap","","","",0,"",0,"","d"],"o_protegidas":["Parques e áreas protegidas (OSM)","ref","Contexto (OpenStreetMap)","omt","Parques e áreas protegidas tal como estão no OpenStreetMap.","© OpenStreetMap","","","",0,"",0,"","d"],"o_aguapts":["Nascentes, poços, fontes e depósitos","ref","Pormenor (OpenStreetMap, ao aproximar)","ovp","Nascentes, poços, fontes e depósitos de água registados no OpenStreetMap.","© OpenStreetMap (Overpass)","","","",13,"",0,"","d"],"o_energia":["Linhas eléctricas e postos","ref","Pormenor (OpenStreetMap, ao aproximar)","ovp","Linhas eléctricas e postos de transformação do OpenStreetMap.","© OpenStreetMap (Overpass)","","","",13,"",0,"","d"],"o_patrimonio":["Património, ruínas e montes","ref","Pormenor (OpenStreetMap, ao aproximar)","ovp","Património, ruínas e montes registados no OpenStreetMap.","© OpenStreetMap (Overpass)","","","",12,"",0,"","d"],"o_vedacoes":["Muros, vedações e portões","ref","Pormenor (OpenStreetMap, ao aproximar)","ovp","Muros, vedações e portões registados no OpenStreetMap.","© OpenStreetMap (Overpass)","","","",15,"",0,"","d"],"r_projipr":["Projectos IPR na vizinhança","prop","Rede IPR","ent","Projectos IPR da Terracrua Design na vizinhança, com localização arredondada.","Terracrua Design · com autorização dos clientes, localização arredondada a cerca de 5 km","","","",0,"",0,"","d"],"l_mdt":["MDT · hipsometria","lidar","Base Cartográfica · Terreno base","lidar","Modelo digital do terreno (altitude do solo sem vegetação nem edifícios) em cores hipsométricas.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"baixo, , , alto","d"],"l_somb_bw":["Sombreamento P&B","lidar","Base Cartográfica · Terreno base","lidar","Sombreamento do terreno a preto e branco.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"","d"],"l_curvas05":["Curvas de nível 0,5 m","lidar","Base Cartográfica · Terreno base","lidar","Curvas de nível com equidistância de 0,5 m.","LiDAR DGT · processamento IPR","","","0,5 m",0,"",0,"0,5 m","d"],"l_curvas1":["Curvas de nível 1 m","lidar","Base Cartográfica · Terreno base","lidar","Curvas de nível com equidistância de 1 m.","LiDAR DGT · processamento IPR","","","1 m",0,"",0,"1 m","d"],"l_curvas2":["Curvas de nível 2 m","lidar","Base Cartográfica · Terreno base","lidar","Curvas de nível com equidistância de 2 m.","LiDAR DGT · processamento IPR","","","2 m",0,"",0,"2 m","d"],"l_curvas5":["Curvas de nível 5 m","lidar","Base Cartográfica · Terreno base","lidar","Curvas de nível com equidistância de 5 m.","LiDAR DGT · processamento IPR","","","5 m",0,"",0,"5 m","d"],"l_declives":["Declives · 7 classes","lidar","Base Cartográfica · Morfologia","lidar","Declive do terreno em 7 classes.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"< 5 %, 5 a 8 %, 8 a 15 %, 15 a 25 %, 25 a 30 %, 30 a 50 %, > 50 %","d"],"l_exposicao":["Exposição solar","lidar","Base Cartográfica · Morfologia","lidar","Orientação das encostas (para onde está voltado o terreno).","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"plano, N, NE, E, SE, S, SO, O","d"],"l_geomorphons":["Formas do relevo (geomorfologia)","lidar","Base Cartográfica · Morfologia","lidar","Formas do relevo (cumes, vertentes, vales, planaltos) classificadas automaticamente.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"plano, pico, cumeada, ombro, esporão, encosta, côncavo, sopé","d"],"l_vento":["Exposição ao vento (de noroeste)","lidar","Base Cartográfica · Morfologia","lidar","Exposição relativa ao vento dominante de noroeste.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"abrigado, pouco abrigado, neutro, pouco exposto, muito exposto","d"],"l_streams":["Linhas de água (ordem de Strahler)","lidar","Base Cartográfica · Hidrologia","lidar","Linhas de escoamento derivadas do terreno, hierarquizadas pela ordem de Strahler.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"","d"],"l_festos":["Festos / cumeadas","lidar","Base Cartográfica · Hidrologia","lidar","Festos e cumeadas: linhas de separação de águas.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"","d"],"l_acumulacao":["Acumulação de fluxo","lidar","Base Cartográfica · Hidrologia","lidar","Acumulação de fluxo: quanta área drena para cada ponto.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"baixa, média, alta","d"],"l_bacias_l":["Bacias hidrográficas","lidar","Base Cartográfica · Hidrologia","lidar","Bacias hidrográficas delimitadas a partir do terreno.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,", , , ","d"],"l_twi":["Humidade topográfica (TWI)","lidar","Base Cartográfica · Hidrologia","lidar","Índice de humidade topográfica: onde a água tende a acumular-se.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"pouco húmido, médio, muito húmido","d"],"l_erosao":["Erosão (transporte de sedimentos)","lidar","Base Cartográfica · Erosão","lidar","Capacidade de transporte de sedimentos, indicador de risco de erosão.","LiDAR DGT · processamento IPR","","","derivado do LiDAR DGT; resolução do processamento ?",0,"",0,"baixo, médio, alto","d"]};
    var AC = "a confirmar", CAMPOS = [["o", "O que representa"], ["s", "Para que serve"], ["l", "Como se lê"], ["f", "Fonte"], ["d", "Data e actualização"], ["c", "Cobertura"], ["e", "Escala e resolução"], ["lim", "Limitações"], ["ex", "Exemplo"], ["est", "Estado"]];
    var EST = { d: "disponível", x: "experimental", p: "previsto" };
    FICHAS = {};
    Object.keys(L).forEach(function (id) {
      var r = L[id], t = T[r[3]] || T.mvt, sub = r[2];
      var es = r[8] || "escala de origem ?"; if (r[9]) es += "; visível a partir da aproximação " + r[9];
      var cob = r[7] || t.c || "Portugal (? fora do continente)"; if (cob === "Portugal continental" && !r[7]) cob += " (? para as regiões autónomas)";
      var lim = (r[10] ? r[10].replace(/\.?$/, ". ") : "") + t.lim + (r[11] ? " Acesso conforme o plano." : "");
      var f = {
        id: id, n: r[0], g: (G[r[1]] || r[1]) + (sub ? " · " + sub : ""),
        o: r[4] || r[0] + ".", s: SX[sub] || (/Rede IPR/.test(sub) && SX["Rede IPR"]) || S[r[1]] || "?",
        l: t.l + (r[12] ? " Legenda: " + r[12] + "." : ""), f: r[5] || "?",
        d: r[6] ? r[6] + " (segundo o nome; actualização da origem ?)" : "?", c: cob, e: es, lim: lim,
        ex: EX[r[1]] || "?", est: EST[r[13]] || "disponível"
      };
      for (var k in f) if (typeof f[k] === "string") f[k] = f[k].replace(/\?/g, AC);
      f.porConfirmar = CAMPOS.filter(function (c) { return String(f[c[0]]).indexOf(AC) >= 0; }).map(function (c) { return c[0]; });
      FICHAS[id] = f;
    });
    Object.defineProperty(FICHAS, "_campos", { value: CAMPOS });
    return FICHAS;
  }
  function fichaHtml(f) {
    var x = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }).replace(/a confirmar/g, '<em class="ipr-ficha-ac">a confirmar</em>'); };
    return '<div class="ipr-ficha-c"><div><h3 class="ipr-ficha-t">' + x(f.n) + '</h3><p class="ipr-ficha-g">' + x(f.g) + "</p></div>" +
      '<button type="button" class="ipr-ficha-x" aria-label="Fechar a ficha">×</button></div><dl class="ipr-ficha-dl">' +
      FICHAS._campos.map(function (c) { return "<dt>" + c[1] + "</dt><dd" + (c[0] === "est" ? ' class="ipr-ficha-est ipr-ficha-est--' + (f.est === "disponível" ? "d" : f.est === "experimental" ? "x" : "p") + '"' : "") + ">" + x(f[c[0]]) + "</dd>"; }).join("") +
      '</dl><p class="ipr-ficha-p">Ficha preparada pela Terracrua Design a partir do catálogo do Atlas. Confirmar sempre na fonte oficial antes de decidir.</p>';
  }
  function fichaAbrir(id, origem) {
    var f = fichasDados()[id]; if (!f) return false;
    var p = document.querySelector(".ipr-ficha");
    if (!p) {
      p = document.createElement("aside"); p.className = "ipr-ficha"; p.setAttribute("role", "dialog"); p.setAttribute("aria-modal", "false"); p.tabIndex = -1;
      document.body.appendChild(p);
      p.addEventListener("click", function (e) { if (e.target.closest(".ipr-ficha-x")) fichaFechar(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !p.hidden) fichaFechar(); });
    }
    p.innerHTML = fichaHtml(f); p.dataset.id = id; p.setAttribute("aria-label", "Ficha da camada " + f.n); p.hidden = false;
    p._origem = origem || null; try { p.focus({ preventScroll: true }); } catch (e) { p.focus(); }
    return true;
  }
  function fichaFechar() {
    var p = document.querySelector(".ipr-ficha"); if (!p || p.hidden) return;
    p.hidden = true; if (p._origem && document.contains(p._origem)) try { p._origem.focus(); } catch (e) {}
  }
  function fichasCamada() {
    if (window.__iprFichas) return true;
    if (!document.body) return false;
    var dados = fichasDados();
    window.IPR_FICHAS = dados;
    window.IPR_FICHA_ABRIR = fichaAbrir;
    function por(raiz) {
      [].forEach.call((raiz || document).querySelectorAll(".ipr-opc-bts"), function (b) {
        if (b.querySelector("[data-ipr-ficha]")) return;
        var li = b.closest(".ipr-it"); if (!li || !dados[li.dataset.id]) return;
        var bt = document.createElement("button"); bt.type = "button"; bt.className = "ipe-b ipe-b--s"; bt.setAttribute("data-ipr-ficha", li.dataset.id);
        bt.textContent = "Ficha da camada"; b.appendChild(bt);
      });
    }
    // sem data-opc: o ouvinte do §19 trataria qualquer data-opc que não seja «zoom» como «Desligar»
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-ipr-ficha]"); if (!b) return;
      e.preventDefault(); e.stopPropagation(); fichaAbrir(b.getAttribute("data-ipr-ficha"), b);
    }, true);
    try { new MutationObserver(function () { por(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    por();
    window.__iprFichas = 1;
    return true;
  }
  // 27. Parcelas candidatas a partir de um ponto (compilação do Ecossistema IPR, §13; Nuno, 24/10/2026).
  // Depois de «A minha localização» (GeolocateControl do m90287), de um toque longo no mapa ou do botão «Parcelas aqui», liga
  // a ferramenta «Escolher parcelas» do próprio Atlas, espera pelas parcelas do cadastro (fonte ipe-cadv) e destaca como
  // candidatas: a parcela que contém o ponto (forte), o primeiro anel de contíguas (médio) e o segundo anel (discreto).
  // Não selecciona nada sozinho: tocar numa candidata usa a ferramenta do Atlas (O.on("click", He) no app.js), por isso
  // juntar e tirar funciona como sempre. «Juntar a do ponto» dispara esse mesmo clique no interior da parcela.
  // Aviso fixo: «São candidatas, não identificam a propriedade; confirme os limites.» Não edita o app.js.
  function parcelasPonto() {
    var M = window.__ipe && window.__ipe.mapa; if (!M || !M.getStyle) return false;
    if (window.__iprPP) return true; window.__iprPP = 1;
    var TOL = 6e-6, AVISO = "São candidatas, não identificam a propriedade; confirme os limites.", alvo = null, caixa = null;

    function feats() {
      var s = M.getSource("ipe-cadv"); if (!s) return [];
      try { var d = s.serialize && s.serialize().data; if (d && d.features) return d.features; } catch (e) {}
      try { return M.querySourceFeatures("ipe-cadv"); } catch (e) { return []; }
    }
    function aneis(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
    function dentro(p, g) {
      return aneis(g).some(function (poly) {
        var r = poly[0], c = false;
        for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
          if (((r[i][1] > p[1]) !== (r[j][1] > p[1])) && (p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0])) c = !c;
        }
        return c;
      });
    }
    function caixaDe(g) { var b = [1e9, 1e9, -1e9, -1e9]; aneis(g).forEach(function (p) { p[0].forEach(function (v) { b[0] = Math.min(b[0], v[0]); b[1] = Math.min(b[1], v[1]); b[2] = Math.max(b[2], v[0]); b[3] = Math.max(b[3], v[1]); }); }); return b; }
    function dSeg(p, a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0;
      t = Math.max(0, Math.min(1, t)); var x = a[0] + t * dx - p[0], y = a[1] + t * dy - p[1]; return Math.sqrt(x * x + y * y);
    }
    function tocam(f1, f2) { // vizinhas: algum vértice de uma a menos de TOL de um lado da outra
      var b1 = f1.__b || (f1.__b = caixaDe(f1.geometry)), b2 = f2.__b || (f2.__b = caixaDe(f2.geometry));
      if (b1[0] > b2[2] + TOL || b2[0] > b1[2] + TOL || b1[1] > b2[3] + TOL || b2[1] > b1[3] + TOL) return false;
      function teste(a, b) {
        var vs = []; aneis(a.geometry).forEach(function (p) { vs = vs.concat(p[0]); });
        var rb = aneis(b.geometry);
        for (var i = 0; i < vs.length; i += 1) for (var k = 0; k < rb.length; k++) { var r = rb[k][0]; for (var j = 0; j < r.length - 1; j++) if (dSeg(vs[i], r[j], r[j + 1]) < TOL) return true; }
        return false;
      }
      return teste(f1, f2) || teste(f2, f1);
    }
    function interior(g) {
      var b = caixaDe(g), c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; if (dentro(c, g)) return c;
      for (var i = 1; i < 8; i++) for (var j = 1; j < 8; j++) { var q = [b[0] + (b[2] - b[0]) * i / 8, b[1] + (b[3] - b[1]) * j / 8]; if (dentro(q, g)) return q; }
      return c;
    }
    function ref(f) { return (f.properties && f.properties.ref) || f.id; }

    function desenhar(ponto) {
      var fs = feats(); if (!fs.length) return false;
      var base = null; fs.some(function (f) { if (dentro(ponto, f.geometry)) { base = f; return true; } return false; });
      if (!base) return false;
      var a1 = fs.filter(function (f) { return ref(f) !== ref(base) && tocam(base, f); });
      var vistos = {}; vistos[ref(base)] = 1; a1.forEach(function (f) { vistos[ref(f)] = 1; });
      var a2 = []; a1.forEach(function (n) { fs.forEach(function (f) { if (!vistos[ref(f)] && tocam(n, f)) { vistos[ref(f)] = 1; a2.push(f); } }); });
      var out = [{ type: "Feature", properties: { anel: 0, ref: ref(base) }, geometry: base.geometry }]
        .concat(a1.map(function (f) { return { type: "Feature", properties: { anel: 1, ref: ref(f) }, geometry: f.geometry }; }))
        .concat(a2.map(function (f) { return { type: "Feature", properties: { anel: 2, ref: ref(f) }, geometry: f.geometry }; }));
      var d = { type: "FeatureCollection", features: out };
      if (M.getSource("ipr-cand")) M.getSource("ipr-cand").setData(d);
      else {
        M.addSource("ipr-cand", { type: "geojson", data: d });
        M.addLayer({ id: "ipr-cand-f", type: "fill", source: "ipr-cand", paint: { "fill-color": "#ffd400", "fill-opacity": ["match", ["get", "anel"], 0, 0.45, 1, 0.25, 0.1] } });
        M.addLayer({ id: "ipr-cand-c", type: "line", source: "ipr-cand", paint: { "line-color": "#1d1d1b", "line-width": ["match", ["get", "anel"], 0, 6, 1, 4, 2], "line-opacity": 0.55 } });
        M.addLayer({ id: "ipr-cand-l", type: "line", source: "ipr-cand", paint: { "line-color": "#ffd400", "line-width": ["match", ["get", "anel"], 0, 3.5, 1, 2.2, 1], "line-dasharray": [2, 1.5], "line-opacity": ["match", ["get", "anel"], 2, 0.5, 1] } });
      }
      alvo = { ponto: ponto, base: base };
      mostrarCaixa(1 + a1.length + a2.length);
      return true;
    }
    function limpar() {
      try { if (M.getLayer("ipr-cand-l")) M.removeLayer("ipr-cand-l"); if (M.getLayer("ipr-cand-c")) M.removeLayer("ipr-cand-c"); if (M.getLayer("ipr-cand-f")) M.removeLayer("ipr-cand-f"); if (M.getSource("ipr-cand")) M.removeSource("ipr-cand"); } catch (e) {}
      if (caixa) caixa.hidden = true; alvo = null;
    }
    function mostrarCaixa(n) {
      if (!caixa) {
        caixa = document.createElement("div"); caixa.className = "ipr-pp";
        caixa.innerHTML = '<p class="ipr-pp-av"></p><p class="ipr-pp-n"></p><div class="ipr-pp-b"><button type="button" class="ipe-b ipe-b--s ipe-b--ac" data-pp="juntar">Juntar a do ponto</button><button type="button" class="ipe-b ipe-b--s" data-pp="fechar">Fechar</button></div>';
        caixa.querySelector(".ipr-pp-av").textContent = AVISO;
        caixa.addEventListener("click", function (e) {
          var b = e.target.closest("[data-pp]"); if (!b) return;
          if (b.dataset.pp === "fechar") { limpar(); return; }
          if (b.dataset.pp === "juntar" && alvo) clicar(interior(alvo.base.geometry));
        });
        (M.getContainer() || document.body).appendChild(caixa);
      }
      caixa.querySelector(".ipr-pp-n").textContent = n + (n === 1 ? " parcela candidata" : " parcelas candidatas") + ". Toque numa parcela para a juntar ou tirar.";
      caixa.hidden = false;
    }
    function clicar(ll) { // o mesmo clique que a ferramenta «Escolher parcelas» trata (He)
      try { var p = M.project(ll); M.fire("click", { lngLat: new maplibregl.LngLat(ll[0], ll[1]), point: p, originalEvent: { type: "click" } }); } catch (e) {}
    }
    function ferramenta() {
      var b = document.querySelector('#ipe [data-tool="parcelas"]') || document.querySelector('[data-guia="parcelas"]');
      if (b && b.getAttribute("aria-pressed") !== "true") b.click();
      return !!b;
    }
    function partir(ll) {
      if (!ll) return; var ponto = [ll.lng, ll.lat];
      M.flyTo({ center: ll, zoom: Math.max(M.getZoom(), 16.5), pitch: 0, duration: 900 }); // vista de cima: as candidatas lêem-se melhor
      ferramenta();
      var t = 0; (function espera() {
        if (desenhar(ponto)) return;
        if (++t < 24) setTimeout(espera, 500); // até 12 s pelas parcelas do cadastro
      })();
    }

    // Origem 1: «A minha localização» (controlo do MapLibre que o m90287 junta ao mapa).
    function ligarGeo() {
      var cs = (M._controls || []).filter(function (c) { return window.maplibregl && c instanceof maplibregl.GeolocateControl; });
      cs.forEach(function (c) { if (c.__iprPP) return; c.__iprPP = 1; c.on("geolocate", function (e) { if (e && e.coords) partir({ lng: e.coords.longitude, lat: e.coords.latitude }); }); });
      return cs.length > 0;
    }
    if (!ligarGeo()) { var n = 0; (function de() { if (!ligarGeo() && ++n < 30) setTimeout(de, 1000); })(); }
    // Origem 2: toque longo (650 ms sem mexer) ou clique longo com o rato.
    var lp = null, lpFeito = 0;
    function inicio(e) { if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length > 1) return; var ll = e.lngLat, pt = e.point; lp = { pt: pt, t: setTimeout(function () { lp = null; lpFeito = Date.now(); partir(ll); }, 650) }; }
    // O clique que o rato larga no fim do toque longo não deve juntar a parcela à selecção: pára-o antes de chegar ao mapa.
    M.getContainer().addEventListener("click", function (e) { if (lpFeito && Date.now() - lpFeito < 2000 && !e.target.closest(".ipr-pp")) { e.stopPropagation(); } lpFeito = 0; }, true);
    function mexe(e) { if (lp && (Math.abs(e.point.x - lp.pt.x) > 8 || Math.abs(e.point.y - lp.pt.y) > 8)) { clearTimeout(lp.t); lp = null; } }
    function fim() { if (lp) { clearTimeout(lp.t); lp = null; } }
    M.on("touchstart", inicio); M.on("touchmove", mexe); M.on("touchend", fim); M.on("touchcancel", fim);
    M.on("mousedown", inicio); M.on("mousemove", mexe); M.on("mouseup", fim); M.on("dragstart", fim);
    // Origem 3: botão «Parcelas aqui» (centro do mapa, por exemplo depois de uma pesquisa de lugar).
    var tr = document.querySelector("#ipe .maplibregl-ctrl-top-right");
    if (tr && !document.getElementById("ipr-pp-aqui")) {
      var g = document.createElement("div"); g.className = "maplibregl-ctrl maplibregl-ctrl-group";
      g.innerHTML = '<button type="button" id="ipr-pp-aqui" title="Parcelas aqui: candidatas no centro do mapa" aria-label="Parcelas aqui"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg></button>';
      g.querySelector("button").addEventListener("click", function () { partir(M.getCenter()); });
      tr.appendChild(g);
    }
    // Ao sair da ferramenta «Escolher parcelas», as candidatas desaparecem.
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest('[data-tool]'); if (!b || !alvo) return;
      setTimeout(function () { var p = document.querySelector('#ipe [data-tool="parcelas"]'); if (p && p.getAttribute("aria-pressed") !== "true") limpar(); }, 50);
    }, true);
    return true;
  }
  // 28. «Partilhar esta vista» com QR e, para o Intelligence e as organizações, «Incorporar no meu site» (compilação do
  // Ecossistema IPR, §35; Nuno, 24/10/2026). Não altera o app.js: quando a janela de partilha abre (campo #ipe-sh-u),
  // acrescenta por baixo o QR da mesma ligação (qrcode-generator, como no §23) e, só quando window.IPR_NIVEL é
  // «intelligence» ou window.IPR_ORG é verdadeiro (m90336), o código de um iframe para /atlas/?incorporar=1. A versão
  // incorporada corre sempre como visitante (m90336): só camadas do Explorer, sem o terreno do cliente (mapa= sai).
  function partilhaQR() {
    function embedUrl(u) {
      // Sem URLSearchParams: mantém as vírgulas de v= e c= tal como o Atlas as escreve e lê.
      var p = String(u).split("#")[0].split("?"), q = (p[1] || "").split("&").filter(function (k) { return k && !/^(mapa|tour|embed|incorporar)=/.test(k); });
      q.push("incorporar=1"); return p[0] + "?" + q.join("&");
    }
    function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function aplicar() {
      var inp = document.getElementById("ipe-sh-u"); if (!inp || inp.getAttribute("data-ipr-qr") === inp.value) return;
      inp.setAttribute("data-ipr-qr", inp.value);
      var caixa = inp.parentNode, velho = caixa.querySelector(".ipr-shq"); if (velho) velho.remove();
      var pode = window.IPR_NIVEL === "intelligence" || window.IPR_ORG === true;
      var el = document.createElement("div"); el.className = "ipr-shq";
      var h = '<figure class="ipr-shq-qr">' + (window.qrcode ? qrSvg(inp.value) : "") + '<figcaption>Apontar a câmara do telemóvel para abrir esta vista</figcaption></figure>';
      if (pode) {
        var cod = '<iframe src="' + esc(embedUrl(inp.value)) + '" width="100%" height="480" style="border:0" loading="lazy" allow="fullscreen" title="IPR Atlas"></iframe>';
        h += '<div class="ipr-shq-emb"><b>Incorporar no meu site</b><p>Cole este código na sua página. Mostra só as camadas públicas (Explorer), nunca o limite do terreno nem dados dos projectos.</p>' +
          '<textarea class="ipe-in mono" id="ipr-shq-cod" readonly rows="3">' + esc(cod) + '</textarea>' +
          '<button type="button" class="ipe-b ipe-b--s" data-ipr-emb="copiar">Copiar código</button> <small class="ipe-small bom" id="ipr-shq-m"></small></div>';
      }
      el.innerHTML = h;
      var acc = caixa.querySelector(".ipe-acc"); caixa.insertBefore(el, acc ? acc.nextSibling : null);
      var b = el.querySelector('[data-ipr-emb="copiar"]');
      if (b) b.addEventListener("click", function (e) {
        e.stopPropagation(); var t = document.getElementById("ipr-shq-cod"), m = document.getElementById("ipr-shq-m");
        function ok() { if (m) m.textContent = "Código copiado."; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(ok, function () { t.select(); try { document.execCommand("copy"); ok(); } catch (x) {} });
        else { t.select(); try { document.execCommand("copy"); ok(); } catch (x) {} }
      });
    }
    function carregar(f) {
      if (window.qrcode) return f();
      if (!window.__iprQrLib) { window.__iprQrLib = 1; var s = document.createElement("script"); s.src = QRLIB; s.crossOrigin = "anonymous"; s.onload = function () { window.__iprQrOk = 1; f(); }; document.head.appendChild(s); }
      else { var n = 0; (function e() { if (window.qrcode) f(); else if (++n < 40) setTimeout(e, 250); })(); }
    }
    if (window.IPR_EMBED) return true;
    if (!window.__iprShqObs) {
      window.__iprShqObs = 1;
      new MutationObserver(function () {
        var i = document.getElementById("ipe-sh-u"); if (i && i.getAttribute("data-ipr-qr") !== i.value) carregar(aplicar);
      }).observe(document.body, { childList: true, subtree: true });
    }
    return true;
  }
  // 29. Teclado virtual e rotação (compilação do Ecossistema IPR, §22; Nuno, 24/10/2026). Com o teclado do telemóvel ou do iPad
  //     aberto (window.visualViewport), põe a altura dele na variável CSS --ipr-kb e a classe ipr-kb no body, e traz o campo
  //     em foco (pesquisa, Formiga, formulários dos painéis) para dentro da parte visível. A janela da Formiga já é tratada no §24.
  //     Ao rodar o aparelho, guarda o centro, o zoom, a rotação e a inclinação, chama map.resize() e repõe a vista.
  //     As margens das áreas de segurança (entalhe, barra inferior) ficam em --ipr-sa-t/-b/-l/-r para o CSS.
  function tecladoVirtual() {
    if (window.__iprKb) return true; window.__iprKb = 1;
    var raiz = document.documentElement, vv = window.visualViewport;
    // Áreas de segurança: env() só funciona em CSS, por isso copia-se para variáveis legíveis por todos.
    if (!document.getElementById("ipr-sa")) {
      var st = document.createElement("style"); st.id = "ipr-sa";
      st.textContent = ":root{--ipr-sa-t:env(safe-area-inset-top,0px);--ipr-sa-b:env(safe-area-inset-bottom,0px);--ipr-sa-l:env(safe-area-inset-left,0px);--ipr-sa-r:env(safe-area-inset-right,0px)}";
      document.head.appendChild(st);
    }
    function editavel(el) {
      if (!el || el === document.body) return false;
      if (el.isContentEditable) return true;
      var t = (el.tagName || "").toLowerCase(), tp = (el.type || "").toLowerCase();
      return t === "textarea" || t === "select" || (t === "input" && !/^(button|submit|checkbox|radio|range|file|color|reset|image|hidden)$/.test(tp));
    }
    var aberto = false, tAjuste = 0;
    function mostrar(el) {
      if (!vv || !editavel(el)) return;
      var r = el.getBoundingClientRect(), topo = vv.offsetTop + 8, fundo = vv.offsetTop + vv.height - 12;
      if (r.bottom > fundo || r.top < topo) {
        try { el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); } catch (e) { try { el.scrollIntoView(false); } catch (x) {} }
      }
    }
    function ajusta() {
      if (!vv) return;
      var kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      var abre = kb > 80 && editavel(document.activeElement);
      raiz.style.setProperty("--ipr-kb", (abre ? kb : 0) + "px");
      raiz.style.setProperty("--ipr-vvh", Math.round(vv.height) + "px");
      if (abre !== aberto) { aberto = abre; document.body.classList.toggle("ipr-kb", abre); }
      if (abre) { clearTimeout(tAjuste); tAjuste = setTimeout(function () { mostrar(document.activeElement); }, 120); }
    }
    if (vv) { vv.addEventListener("resize", ajusta); vv.addEventListener("scroll", ajusta); }
    document.addEventListener("focusin", function (e) { if (editavel(e.target)) setTimeout(function () { ajusta(); mostrar(e.target); }, 350); });
    document.addEventListener("focusout", function () { setTimeout(ajusta, 200); });
    // Rotação: a vista fica onde estava.
    var antes = null;
    function guardar() { var I = mapa(); if (!I || !I.getCenter) return; try { antes = { c: I.getCenter(), z: I.getZoom(), b: I.getBearing(), p: I.getPitch() }; } catch (e) { antes = null; } }
    function repor() {
      var I = mapa(); if (!I) return;
      setTimeout(function () {
        try { I.resize(); } catch (e) {}
        if (antes) { try { I.jumpTo({ center: antes.c, zoom: antes.z, bearing: antes.b, pitch: antes.p }); } catch (e) {} }
        try { if (typeof posicoes === "function") posicoes(); } catch (e) {}
        try { if (typeof formigaSitio === "function") formigaSitio(); } catch (e) {}
        ajusta();
      }, 250);
    }
    var mq = window.matchMedia ? window.matchMedia("(orientation: portrait)") : null;
    if (mq) { var mudou = function () { repor(); }; if (mq.addEventListener) mq.addEventListener("change", mudou); else if (mq.addListener) mq.addListener(mudou); }
    window.addEventListener("orientationchange", repor);
    // Guarda a vista antes da rotação: em cada movimento do mapa (barato: só lê quatro números).
    (function liga() { var I = mapa(); if (I && I.on) { I.on("moveend", guardar); guardar(); } else setTimeout(liga, 1000); })();
    ajusta();
    return true;
  }
  // 30. Preferências do Atlas na conta (compilação do Ecossistema IPR, §25; Nuno, 24/10/2026). Servidor no m90340.
  //     Só com sessão iniciada (window.TCD_PREFS, impresso pelo m90340). Guarda na conta uma lista fechada de chaves de
  //     interface: tema claro/escuro e modo leve (ipe_cfg_v1), voo de abertura (ipe_abertura_off), secções da barra
  //     (ipe_sb_v1), guias vistos (ipe_tour_*), larguras dos painéis e sistema de coordenadas (tcd_atlas_*), árvore de
  //     camadas recolhida (ipr_arv_v2), visitas da Formiga (ipr_fm_visitas_v2) e os temas da pessoa (ipr_temas_meus).
  //     Nunca guarda locais, desenhos, rascunhos, a vista do mapa nem as camadas ligadas. A reposição noutro aparelho é feita
  //     antes do Atlas arrancar, pelo próprio m90340 (só as chaves que faltam no navegador). Aqui só se envia o que mudou:
  //     verifica de 10 em 10 s, envia no máximo de 30 em 30 s e ao sair da página (sendBeacon). Até 20 KB.
  var PREF_CHAVES = /^(ipe_cfg_v1|ipe_abertura_off|ipe_sb_v1|ipe_tour_v1|ipe_tour_enc1|ipe_tour_cli1|tcd_atlas_[a-z0-9_-]{1,30}|ipr_arv_v2|ipr_fm_visitas_v2|ipr_temas_meus)$/;
  function prefsLer() {
    var o = {}, n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (!k || !PREF_CHAVES.test(k)) continue;
        var v = localStorage.getItem(k); if (v == null || v.length > 8000) continue;
        o[k] = v; n += k.length + v.length;
      }
    } catch (e) { return null; }
    return n > 20000 ? null : o;
  }
  function prefsConta() {
    var P = window.TCD_PREFS; if (!P || !P.aj || !P.n) return true; // sem sessão: nada a fazer
    if (window.__iprPrefs) return true; window.__iprPrefs = 1;
    var ultimo = JSON.stringify(P.v || {}), enviadoEm = 0, pendente = false;
    function corpo(v) { var f = new FormData(); f.append("action", "tcd_m340"); f.append("n", P.n); f.append("v", v); return f; }
    function enviar(forcar) {
      var o = prefsLer(); if (!o) return; var s = JSON.stringify(o);
      if (s === ultimo) { pendente = false; return; }
      if (!forcar && Date.now() - enviadoEm < 30000) { pendente = true; return; }
      ultimo = s; enviadoEm = Date.now(); pendente = false;
      try {
        if (forcar && navigator.sendBeacon) { navigator.sendBeacon(P.aj, corpo(s)); return; }
        fetch(P.aj, { method: "POST", body: corpo(s), credentials: "same-origin", keepalive: true }).catch(function () { ultimo = ""; });
      } catch (e) {}
    }
    setInterval(function () { enviar(false); }, 10000);
    window.addEventListener("pagehide", function () { enviar(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") enviar(true); });
    return true;
  }
  // 31. Cronologia (compilação do Ecossistema IPR, §33; Nuno, 24/10/2026): botão «Cronologia» no cabeçalho da lista de camadas,
  //     ao lado de «Temas». Abre uma régua que troca o fundo pelas ortofotos que já existem no catálogo (viz.js): 1995, 2007,
  //     2012, 2015, 2018 e 2023, com o ano e a fonte. Opcionalmente liga as áreas ardidas do período (ICNF: 1975 a 2014 ou 2015
  //     a 2025; são acumuladas do período, não de um só ano). Usa só R.fundo() e R.ligar() do próprio Atlas. Ao fechar, repõe o
  //     fundo e as áreas ardidas como estavam antes de abrir. As áreas ardidas são do Intelligence: no Explorer a caixa fica
  //     desactivada.
  var CRONO = [
    { a: 1995, id: "f_o95", t: "Ortofotos 1995 (infravermelho, cores virtuais)", f: "DGT" },
    { a: 2005, id: "f_o04", t: "Ortofotos 2004 a 2006 (voos de três anos)", f: "DGT" },
    { a: 2007, id: "f_o07", t: "Ortofotos 2007", f: "DGT" },
    { a: 2010, id: "f_o10", t: "Ortofotos 2010", f: "DGT" },
    { a: 2012, id: "f_o12", t: "Ortofotos 2012", f: "DGT" },
    { a: 2015, id: "f_o15", t: "Ortofotos 2015", f: "DGT" },
    { a: 2018, id: "f_orto18", t: "Ortofotos 2018 · 25 cm", f: "DGT" },
    { a: 2021, id: "f_o21", t: "Ortofotos 2021 · só a metade norte do país", f: "DGT" },
    { a: 2023, id: "f_ortosat", t: "OrtoSat 2023 · 30 cm", f: "DGT" },
    { a: 2025, id: "f_o25", t: "Ortofotos 2025 · 25 cm", f: "DGT" }
  ];
  function cronologia() {
    var cab = document.querySelector(".ipr-arv-cab"); if (!cab) return false; if (cab.querySelector(".ipr-crono-b")) return true;
    var R = viz(); if (!R || typeof R.fundo !== "function") return false;
    var b = document.createElement("button"); b.type = "button"; b.className = "ipr-temas-b ipr-crono-b"; b.textContent = "Cronologia";
    b.title = "Comparar o terreno em anos diferentes"; b.setAttribute("aria-expanded", "false");
    var p = document.createElement("div"); p.className = "ipr-crono"; p.hidden = true; p.setAttribute("role", "group"); p.setAttribute("aria-label", "Cronologia");
    var ardTranc = trancada("ard15");
    p.innerHTML = '<div class="ipr-crono-c"><strong class="ipr-crono-a">2023</strong><button type="button" class="ipr-crono-x" aria-label="Fechar a cronologia">×</button></div>'
      + '<input type="range" min="0" max="' + (CRONO.length - 1) + '" step="1" value="' + (CRONO.length - 1) + '" aria-label="Ano da imagem">'
      + '<div class="ipr-crono-r">' + CRONO.map(function (c) { return "<span>" + String(c.a).slice(2) + "</span>"; }).join("") + "</div>"
      + '<p class="ipr-crono-t"></p>'
      + '<label class="ipr-crono-f"><input type="checkbox"' + (ardTranc ? " disabled" : "") + '> Áreas ardidas do período (ICNF)</label>'
      + (ardTranc ? '<p class="ipr-crono-n">As áreas ardidas são do IPR Atlas Intelligence.</p>' : "")
      + '<p class="ipr-crono-n">As ortofotos só aparecem com o mapa aproximado (escala 1:50 000 ou maior). <b>Antes de 1995</b> há fotografias aéreas de arquivo, que não são ortofotos: a <a href="https://www.dgterritorio.gov.pt/node/1435" target="_blank" rel="noopener">fototeca da DGT</a> (desde 1944) e o CIGeoE (voos de 1937 a 1960, pedidos por coordenadas). Servem para documentar a antiguidade de uma construção, mas não substituem a apreciação da câmara.</p>';
    var antes = null, rg = p.querySelector("input[type=range]"), cb = p.querySelector("input[type=checkbox]");
    function ardAct() { var a = []; try { a = R.activas(); } catch (e) {} return { a15: a.indexOf("ard15") > -1, a75: a.indexOf("ard75") > -1 }; }
    function aplicar() {
      var c = CRONO[+rg.value] || CRONO[CRONO.length - 1];
      try { R.fundo(c.id); } catch (e) {}
      // 24/10 17h47: as ortofotos só aparecem a 1:50 000 ou maior; se o mapa estiver afastado, aproxima-o no mesmo sítio
      try { var M0 = mapa(); if (M0 && /^f_o/.test(c.id) && M0.getZoom() < 12.6) M0.easeTo({ zoom: 13.2, duration: 900 }); } catch (e) {}
      p.querySelector(".ipr-crono-a").textContent = c.a; p.querySelector(".ipr-crono-t").textContent = c.t + " · " + c.f;
      if (cb.checked && !ardTranc) {
        var novo = c.a >= 2015;
        try { R.ligar("ard15", novo); R.ligar("ard75", !novo); } catch (e) {}
      }
    }
    function abrir() {
      if (!p.hidden) return;
      antes = { fundo: fundoActual(), ard: ardAct() };
      var i = CRONO.map(function (c) { return c.id; }).indexOf(antes.fundo); rg.value = i > -1 ? i : CRONO.length - 1;
      p.hidden = false; b.setAttribute("aria-expanded", "true"); b.classList.add("on"); aplicar();
    }
    function fechar() {
      if (p.hidden) return; p.hidden = true; b.setAttribute("aria-expanded", "false"); b.classList.remove("on");
      if (antes) {
        try { if (antes.fundo) R.fundo(antes.fundo); } catch (e) {}
        if (!ardTranc) { try { R.ligar("ard15", antes.ard.a15); R.ligar("ard75", antes.ard.a75); } catch (e) {} }
      }
      antes = null; cb.checked = false;
    }
    b.addEventListener("click", function (e) { e.stopPropagation(); if (p.hidden) abrir(); else fechar(); });
    rg.addEventListener("input", aplicar);
    cb.addEventListener("change", function () {
      if (ardTranc) return;
      if (cb.checked) aplicar(); else { try { R.ligar("ard15", antes ? antes.ard.a15 : false); R.ligar("ard75", antes ? antes.ard.a75 : false); } catch (e) {} }
    });
    p.querySelector(".ipr-crono-x").addEventListener("click", function (e) { e.stopPropagation(); fechar(); });
    p.addEventListener("click", function (e) { e.stopPropagation(); });
    p.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Escape") fechar(); });
    var tb = cab.querySelector(".ipr-temas-b");
    if (tb && tb.nextSibling) cab.insertBefore(b, tb.nextSibling); else cab.insertBefore(b, cab.firstChild);
    cab.appendChild(p);
    return true;
  }
  // 32. Piloto de Alcanena (compilação do Ecossistema IPR, §32; Nuno, 24/10/2026): tema «Piloto de Alcanena» no menu «Temas»
  //     (§25). Liga as camadas do catálogo que servem a leitura do sistema cársico: rede hidrográfica, bacias, bacias por troço,
  //     massas e unidades hidrogeológicas, nascentes monitorizadas, geologia, áreas protegidas e Rede Natura (Parque Natural das
  //     Serras de Aire e Candeeiros), habitats, sombreado e nomes; e voa até ao Maciço Calcário Estremenho, com a nascente dos
  //     Olhos de Água do Alviela e Alcanena no enquadramento. As camadas do Intelligence ficam de fora para o Explorer (§25).
  //     Não há camada própria de carso no catálogo: a leitura faz-se pela geologia e pela hidrogeologia.
  var ALCANENA = { id: "alcanena", nome: "Piloto de Alcanena", fundo: "f_ortosat",
    c: ["hidro", "bacias", "bac_troco", "aquif", "hidrog", "apasub", "geo", "rnap", "n2k", "habitats", "r_somb", "o_agua", "o_nomes"],
    voo: { center: [-8.735, 39.485], zoom: 11.3, pitch: 50, bearing: 20 } };
  function pilotoAlcanena() {
    if (window.__iprAlc) return true;
    if (typeof TEMAS_IPR === "undefined" || !viz()) return false;
    window.__iprAlc = 1;
    if (!TEMAS_IPR.some(function (t) { return t.id === ALCANENA.id; })) TEMAS_IPR.push(ALCANENA);
    // O menu do §25 só liga as camadas; o voo acrescenta-se aqui, depois do clique dele.
    document.addEventListener("click", function (e) {
      var q = e.target && e.target.closest && e.target.closest('[data-tema="ipr:' + ALCANENA.id + '"]'); if (!q) return;
      setTimeout(function () {
        var I = mapa(); if (!I || !I.flyTo) return;
        var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try { if (reduz) I.jumpTo(ALCANENA.voo); else I.flyTo(Object.assign({ duration: 3500, essential: true }, ALCANENA.voo)); } catch (x) {}
      }, 60);
    }, true);
    return true;
  }
  // 29. Fichas das camadas de «Natureza e clima» (compilação do Ecossistema IPR, §38 e §31; 24/10/2026). As camadas entram
  //     no catálogo do viz.js (s38-viz-aplicar.py); aqui só se juntam as fichas a window.IPR_FICHAS (§28), para o botão
  //     «Ficha da camada» e para a Formiga. Corre depois do §28; sem IPR_FICHAS espera pela volta seguinte.
  function fichasNatureza() {
    var F = window.IPR_FICHAS; if (!F) return false;
    if (F.n_gbif_todas) return true;
    var gbif = {
      g: "Natureza e clima · Biodiversidade (GBIF)",
      s: "Saber que grupos de seres vivos já foram registados perto do terreno e onde vale a pena procurar ou pedir levantamentos.",
      l: "Hexágonos coloridos pelo número de registos: cores mais quentes, mais registos. Zonas vazias querem dizer sem registos, não sem espécies.",
      f: "GBIF.org (Global Biodiversity Information Facility), API de mapas v2; dados de muitas instituições, cada conjunto com a sua licença (CC0, CC BY 4.0 ou CC BY-NC 4.0).",
      d: "Actualizado pelo GBIF todos os dias a partir dos conjuntos publicados; os registos vão de colecções antigas a observações recentes.",
      c: "Mundial; mostrado aqui para Portugal, Açores, Madeira e a Península.",
      e: "Hexágonos de tamanho fixo no ecrã (40 por mosaico): ao aproximar ficam mais finos; precisão de cada registo variável.",
      lim: "Mostra o esforço de observação tanto como a biodiversidade. Espécies sensíveis podem vir generalizadas ou ocultas na origem. Para citar, usar o DOI do descarregamento no GBIF.org.",
      ex: "Num vale com muitos registos de aves junto a uma ribeira, a galeria ripícola merece protecção e um percurso de observação.",
      est: "experimental"
    };
    var gibs = {
      g: "Natureza e clima · Água e clima (NASA GIBS)",
      s: "Leitura regional do ciclo da água: onde há neve, quanta água o solo guarda e quanto se perde por evaporação.",
      l: "Cores conforme a legenda da NASA para cada produto; não permite consultar valores aqui.",
      f: "NASA EOSDIS GIBS (Global Imagery Browse Services); dados NASA sem restrições de uso, com indicação da fonte.",
      c: "Mundial; mostrado aqui para Portugal, Açores, Madeira e a Península.",
      lim: "Resolução grosseira para um terreno: serve para comparar regiões e estações, não para dimensionar obras.",
      ex: "Comparar a humidade do solo de Outubro entre o Barlavento e a Beira Interior antes de escolher espécies.",
      est: "experimental"
    };
    function junta(id, base, extra) { var f = { id: id }; for (var k in base) f[k] = base[k]; for (var k2 in extra) f[k2] = extra[k2]; f.porConfirmar = []; F[id] = f; }
    junta("n_gbif_todas", gbif, { n: "Ocorrências de espécies (todas)", o: "Número de registos de ocorrência de qualquer ser vivo reunidos pelo GBIF, agregados em hexágonos." });
    junta("n_gbif_aves", gbif, { n: "Ocorrências de aves", o: "Número de registos de aves (classe Aves) reunidos pelo GBIF, agregados em hexágonos." });
    junta("n_gbif_plantas", gbif, { n: "Ocorrências de plantas", o: "Número de registos de plantas (reino Plantae) reunidos pelo GBIF, agregados em hexágonos." });
    junta("n_gibs_neve", gibs, { n: "Neve · cobertura média em Janeiro de 2026 (MODIS)", o: "Percentagem média de dias com neve no mês, vista pelo satélite Terra (MODIS).", d: "Janeiro de 2026 (fixo; mudar a data no catálogo para outro mês).", e: "Cerca de 5 km por píxel." });
    junta("n_gibs_humsolo", gibs, { n: "Humidade do solo na zona das raízes · dia mais recente (SMAP)", o: "Água no primeiro metro de solo, estimada pelo modelo SMAP L4 com dados de satélite.", d: "Diário, com alguns dias de atraso; mostra sempre o dia mais recente disponível.", e: "Cerca de 9 km por píxel." });
    junta("n_gibs_evap", gibs, { n: "Evaporação sobre terra · Julho de 2026 (MERRA-2)", o: "Água devolvida à atmosfera a partir do solo e da vegetação, em média mensal (reanálise MERRA-2).", d: "Julho de 2026 (fixo).", e: "Cerca de 50 km por píxel." });
    return true;
  }
  // 30. Estilos e temas dos projectos QGIS nas camadas da organização (24/10/2026, Quinta Linda). O org.js (outra sessão)
  //     pinta cada camada com a cor do grupo; quando o GeoJSON traz a simbologia convertida do QGIS (propriedades _f, _s,
  //     _sw, _dk, _m, _i, _lb…, gravadas pelo importador do Núcleo), aqui troca-se a pintura por expressões por elemento,
  //     juntam-se traços, marcadores ao longo das linhas, ícones e rótulos, e ordena-se como no projecto (_z).
  //     Elementos com _img são temas inteiros renderizados pelo QGIS: entram como imagem georreferenciada, com a legenda
  //     do tema num cartão, e só um tema fica ligado de cada vez. Não altera o org.js: embrulha addLayer/setLayoutProperty.
  function estilosOrg() {
    var m = mapa(); if (!m || !m.addLayer || !window.tcdOrg) return false;
    if (m.__iprEstOrg) return true; m.__iprEstOrg = 1;
    var extra = {}, temas = {}, cor0 = {};
    var addL = m.addLayer.bind(m), setLP = m.setLayoutProperty.bind(m);
    function dados(src) { try { var s = m.getSource(src); var d = s && s.serialize && s.serialize().data; return d && d.features ? d : null; } catch (e) { return null; } }
    function px(k, d) { return ["coalesce", ["to-number", ["get", k]], d]; }
    function larg(k, d) { return ["interpolate", ["exponential", 2], ["zoom"], 13, ["*", px(k, d), 0.35], 17, px(k, d), 20, ["*", px(k, d), 3]]; }
    function vis(id) { try { return m.getLayoutProperty(id, "visibility") !== "none"; } catch (e) { return false; } }
    function juntar(id, base, def) { try { if (!m.getLayer(def.id)) addL(def); } catch (e) { return; } (extra[id] = extra[id] || []).push(def.id); }
    function legenda(id, png, nome) {
      var c = document.getElementById("ipr-leg-org");
      if (!png) { if (c && c.dataset.id === String(id)) c.remove(); return; }
      if (!c) { c = document.createElement("div"); c.id = "ipr-leg-org"; c.style.cssText = "position:absolute;left:10px;bottom:38px;z-index:5;max-height:" + (window.innerWidth <= 700 ? "38vh" : "55vh") + ";overflow:auto;background:rgba(255,255,255,.94);border:1px solid rgba(0,0,0,.15);border-radius:8px;padding:6px 8px;box-shadow:0 2px 10px rgba(0,0,0,.15);font:12px Inter,sans-serif;color:#222;max-width:260px"; (m.getContainer() || document.body).appendChild(c); }
      c.dataset.id = id; c.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:4px"><b style="font-weight:600">' + String(nome || "Legenda").replace(/[<>&]/g, "") + '</b><button type="button" aria-label="Fechar legenda" style="border:0;background:none;cursor:pointer;font-size:15px;line-height:1">×</button></div><img alt="Legenda do tema" style="display:block;max-width:' + (window.innerWidth <= 700 ? 170 : 240) + 'px;height:auto">';
      c.querySelector("img").src = png; c.querySelector("button").onclick = function () { c.remove(); };
    }
    function estilizar(id) {
      var src = "org-" + id, d = dados(src); if (!d || !d.features.length) return;
      var p0 = d.features[0].properties || {};
      if (p0._img) { // tema renderizado pelo QGIS
        temas[id] = { nome: p0._tema || "", leg: p0._leg || "" };
        ["f", "l", "p"].forEach(function (s) { try { m.setFilter(src + "-" + s, ["!", ["has", "_img"]]); } catch (e) {} });
        try { if (!m.getSource(src + "-img")) m.addSource(src + "-img", { type: "image", url: p0._img, coordinates: p0._cantos }); } catch (e) { return; }
        juntar(id, src, { id: src + "-img", type: "raster", source: src + "-img", paint: { "raster-opacity": Number(p0._ro || 1), "raster-fade-duration": 0 } });
        try { m.moveLayer(src + "-img", src + "-f"); } catch (e) {}
        // só um tema de cada vez
        Object.keys(temas).forEach(function (o) { if (+o !== +id && vis("org-" + o + "-f")) { window.tcdOrg.desligar(+o); var cb = document.querySelector('[data-ipo-c="' + o + '"]'); if (cb) cb.checked = false; } });
        legenda(id, temas[id].leg, temas[id].nome);
        return;
      }
      if (p0._z === undefined) {
        // 26/10, 01h10 (Nuno, foto do quadrado roxo): nos desenhos de AutoCAD convertidos, os textos e pontos soltos eram
        // círculos de 5 px com contorno branco, milhares por cima uns dos outros. Passam a pontos pequenos, sem contorno.
        if (d.features.some(function (f) { return f.properties && f.properties.camada !== undefined; })) {
          try {
            m.setPaintProperty(src + "-p", "circle-radius", ["interpolate", ["linear"], ["zoom"], 13, 0.6, 18, 1.6, 21, 3]);
            m.setPaintProperty(src + "-p", "circle-stroke-width", 0);
            m.setPaintProperty(src + "-p", "circle-opacity", 0.7);
            m.setPaintProperty(src + "-l", "line-width", ["interpolate", ["linear"], ["zoom"], 13, 0.6, 18, 1.2]);
          } catch (e) {}
        }
        return; // camada sem simbologia: fica como o org.js a desenhou
      }
      cor0[id] = 1;
      var tem = function (k) { return d.features.some(function (f) { return f.properties && f.properties[k] !== undefined && f.properties[k] !== null && f.properties[k] !== ""; }); };
      try {
        m.setPaintProperty(src + "-f", "fill-color", ["coalesce", ["get", "_f"], "rgba(0,0,0,0)"]);
        m.setPaintProperty(src + "-f", "fill-opacity", ["case", ["has", "_f"], px("_fo", 1), 0]);
        m.setPaintProperty(src + "-l", "line-color", ["coalesce", ["get", "_s"], "rgba(0,0,0,0)"]);
        m.setPaintProperty(src + "-l", "line-opacity", ["case", ["any", ["!", ["has", "_s"]], ["has", "_dk"]], 0, px("_so", 1)]);
        m.setPaintProperty(src + "-l", "line-width", larg("_sw", 1));
        m.setPaintProperty(src + "-p", "circle-color", ["coalesce", ["get", "_f"], "#777"]);
        m.setPaintProperty(src + "-p", "circle-opacity", ["case", ["has", "_i"], 0, px("_fo", 1)]);
        m.setPaintProperty(src + "-p", "circle-radius", ["interpolate", ["linear"], ["zoom"], 13, 2, 17, ["max", ["*", px("_r", 4), 0.55], 3], 20, ["max", ["*", px("_r", 4), 1.4], 5]]);
        m.setPaintProperty(src + "-p", "circle-stroke-color", ["coalesce", ["get", "_s"], "#fff"]);
        m.setPaintProperty(src + "-p", "circle-stroke-width", ["case", ["has", "_i"], 0, ["has", "_s"], px("_sw", 0.6), 0]);
      } catch (e) {}
      var linhas = ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "Polygon"]];
      // traços: um estrato por padrão (line-dasharray constante)
      var dk = {}; d.features.forEach(function (f) { var k = f.properties && f.properties._dk; if (k) dk[k] = 1; });
      Object.keys(dk).forEach(function (k, i) {
        var arr = k.split(",").map(Number).filter(function (x) { return x > 0; }); if (arr.length < 2) arr = [2, 2];
        juntar(id, src, { id: src + "-x-d" + i, type: "line", source: src, filter: ["all", linhas, ["==", ["get", "_dk"], k]], layout: { "line-cap": "butt" }, paint: { "line-color": ["coalesce", ["get", "_s"], "#333"], "line-opacity": px("_so", 1), "line-width": larg("_sw", 1), "line-dasharray": arr } });
      });
      if (tem("_s2")) juntar(id, src, { id: src + "-x-s2", type: "line", source: src, filter: ["all", linhas, ["has", "_s2"]], paint: { "line-color": ["get", "_s2"], "line-width": larg("_sw2", 0.5) } });
      // marcadores ao longo das linhas (árvores das keylines, drenos): pontos redondos espaçados
      if (tem("_m")) {
        var md = {}; d.features.forEach(function (f) { var v = f.properties && f.properties._md; if (v) md[v] = 1; });
        Object.keys(md).forEach(function (v, i) {
          juntar(id, src, { id: src + "-x-m" + i, type: "line", source: src, filter: ["all", linhas, ["has", "_m"], ["==", ["to-string", ["get", "_md"]], v]], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["get", "_m"], "line-opacity": px("_mo", 1), "line-width": larg("_mw", 3), "line-dasharray": [0.01, Math.max(+v, 1.2)] } });
        });
      }
      // ícones SVG convertidos (ex.: colmeias)
      if (tem("_i") && window.IPR_ORG_ICONES) {
        Object.keys(window.IPR_ORG_ICONES).forEach(function (k) {
          if (m.hasImage("org-i-" + k)) return; var im = new Image(); im.onload = function () { try { if (!m.hasImage("org-i-" + k)) m.addImage("org-i-" + k, im, { pixelRatio: 2 }); } catch (e) {} }; im.src = "data:image/png;base64," + window.IPR_ORG_ICONES[k];
        });
        juntar(id, src, { id: src + "-x-i", type: "symbol", source: src, filter: ["has", "_i"], layout: { "icon-image": ["concat", "org-i-", ["get", "_i"]], "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.35, 18, 0.8], "icon-allow-overlap": true } });
      }
      // rótulos
      if (tem("_lb")) {
        var emLinha = d.features.some(function (f) { return f.geometry && /LineString/.test(f.geometry.type) && f.properties && f.properties._lb; });
        juntar(id, src, { id: src + "-x-t", type: "symbol", source: src, filter: ["has", "_lb"], minzoom: 15,
          layout: { "text-field": ["get", "_lb"], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 15, ["*", px("_lz", 11), 0.75], 18, ["*", px("_lz", 11), 1.1]], "symbol-placement": emLinha ? "line" : "point", "text-max-angle": 40, "text-padding": 2 },
          paint: { "text-color": ["coalesce", ["get", "_lc"], "#222"], "text-halo-color": ["case", ["==", ["coalesce", ["get", "_lh"], ""], ""], "rgba(255,255,255,.75)", ["get", "_lh"]], "text-halo-width": 1.4 } });
      }
      ordenar();
    }
    function zDe(id) { var d = dados("org-" + id); return d && d.features[0] && d.features[0].properties && +d.features[0].properties._z || 0; }
    function ordenar() {
      var ids = Object.keys(cor0).sort(function (a, b) { return zDe(a) - zDe(b); });
      ids.forEach(function (id) { ["f", "l"].concat((extra[id] || []).filter(function (x) { return !/-(t|i)$/.test(x) && !/-img$/.test(x); }).map(function (x) { return x.replace("org-" + id + "-", ""); })).concat(["p"]).forEach(function (s) { var L = "org-" + id + "-" + s; try { if (m.getLayer(L)) m.moveLayer(L); } catch (e) {} }); });
      ids.forEach(function (id) { (extra[id] || []).filter(function (x) { return /-(t|i)$/.test(x); }).forEach(function (L) { try { m.moveLayer(L); } catch (e) {} }); });
    }
    m.addLayer = function (def, antes) {
      var r = addL(def, antes), g = def && def.id && /^org-(\d+)-p$/.exec(def.id);
      if (g) { var id = +g[1]; setTimeout(function () { estilizar(id); }, 0); }
      return r;
    };
    m.setLayoutProperty = function (L, k, v, o) {
      var r = setLP(L, k, v, o), g = /^org-(\d+)-f$/.exec(L);
      if (g && k === "visibility") {
        var id = +g[1]; (extra[id] || []).forEach(function (x) { try { setLP(x, "visibility", v); } catch (e) {} });
        if (temas[id]) {
          if (v === "none") legenda(id, ""); else { legenda(id, temas[id].leg, temas[id].nome); Object.keys(temas).forEach(function (o) { if (+o !== id && vis("org-" + o + "-f")) { window.tcdOrg.desligar(+o); var cb = document.querySelector('[data-ipo-c="' + o + '"]'); if (cb) cb.checked = false; } }); }
        }
      }
      return r;
    };
    // a janela de atributos do org.js mostra as propriedades todas: tirar as de estilo (começam por «_»)
    try { new MutationObserver(function () { document.querySelectorAll(".ipo-pop tr").forEach(function (tr) { var k = tr.firstChild && tr.firstChild.textContent || ""; if (k.charAt(0) === "_") tr.remove(); }); }).observe(m.getContainer(), { childList: true, subtree: true }); } catch (e) {}
    // camadas já desenhadas antes deste ajuste
    Object.keys((m.getStyle() || {}).sources || {}).forEach(function (s) { var g = /^org-(\d+)$/.exec(s); if (g && m.getLayer(s + "-p")) estilizar(+g[1]); });
    return true;
  }
  // 31. Fim do voo de entrada (24/10/2026, pedido do Nuno): o voo da abertura acaba na Melriça em 3D; quando termina (ou se
  //     salta), o mapa volta a 2D, com o norte para cima, a mostrar Portugal continental. Segue a marca window.__ipeAb do
  //     app.js (1 durante o voo, 0 cerca de 1,8 s depois de chegar). Não mexe no voo em si.
  function fimDoVoo() {
    if (window.__iprFimVoo) return true;
    if (!mapa()) return false;
    window.__iprFimVoo = 1;
    var visto = 0, n = 0;
    (function vigiar() {
      if (window.__ipeAb === 1) visto = 1;
      if (visto && window.__ipeAb === 0) {
        var m = mapa(); if (!m) return;
        try { var b3 = document.querySelector('[data-tool="3d"][aria-pressed="true"]'); if (b3) b3.click(); } catch (e) {}
        try { if (m.getTerrain && m.getTerrain()) m.setTerrain(null); } catch (e) {}
        var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try { m.fitBounds([[-9.55, 36.95], [-6.18, 42.16]], { padding: 40, pitch: 0, bearing: 0, duration: reduz ? 0 : 2500, essential: true }); } catch (e) {}
        return;
      }
      if (++n < 240) setTimeout(vigiar, 250); // até 60 s depois de o mapa existir
    })();
    return true;
  }
  // 32. Nomes das camadas da organização legíveis (24/10/2026, pedido do Nuno no telemóvel): o org.js repete em cada linha o
  //     prefixo do projecto («268 Quinta Linda · …») que já está no título do grupo, e corta o resto com reticências. Aqui
  //     tira-se esse prefixo repetido (o nome completo fica no title) e os nomes passam a partir em duas linhas.
  function orgNomes() {
    if (window.__iprOrgNomes) return true;
    window.__iprOrgNomes = 1;
    var st = document.createElement("style");
    st.textContent = ".ipo-c label b{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.25}.ipo-c{align-items:flex-start}.ipo-c small{padding-top:2px}";
    document.head.appendChild(st);
    function limpar() {
      document.querySelectorAll('.ipe-pane[data-pane="org"] .ipo-c label b').forEach(function (b) {
        if (b.dataset.ipoN) return;
        var t = b.textContent, m = /^(\d+\s[^·]{2,60}?)\s·\s(.+)$/.exec(t);
        b.dataset.ipoN = "1";
        if (!m) return;
        var g = b.closest(".ipo-c"), h = g && g.previousElementSibling;
        while (h && !h.classList.contains("ipo-g")) h = h.previousElementSibling;
        if (h && (h.textContent.indexOf(m[1]) >= 0 || /Temas do projecto/.test(h.textContent))) { b.title = t; b.textContent = m[2]; }
      });
    }
    new MutationObserver(limpar).observe(document.body, { childList: true, subtree: true });
    limpar();
    return true;
  }
  // 33. «Os meus projectos» em barras recolhidas (24/10/2026, pedido do Nuno): ao entrar sem ?mapa= nenhum projecto
  //     aparece aberto (o app.js abria o primeiro); tocar numa barra abre-a e fecha a anterior; tocar outra vez fecha-a.
  function projRecolhidos() {
    if (window.__iprProjRec) return true;
    var raiz = document.getElementById("ipe-proj"); if (!raiz) return false;
    window.__iprProjRec = 1;
    var aberto = new URLSearchParams(location.search).get("mapa") ? null : "-";
    function aplicar() {
      if (aberto === null) return;
      raiz.querySelectorAll(".ipe-card[data-i]").forEach(function (c) { var q = c.dataset.i === aberto; if (c.classList.contains("on") !== q) c.classList.toggle("on", q); });
    }
    // Botão «Ver no mapa» em todas as barras (24/10/2026, 15h56): leva o mapa ao limite do terreno, aberto ou recolhido.
    var geos = null;
    function geometrias() {
      if (geos) return geos;
      geos = fetch("/wp-json/tcd/v1/meus-mapas", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } })
        .then(function (r) { return r.json(); }).then(function (d) {
          var m = {}; ["mapas", "partilhados", "rever"].forEach(function (k) { (d[k] || []).forEach(function (x) { if (x && x.geojson) m[String(x.encomenda || x.id)] = x.geojson; }); });
          return m;
        }).catch(function () { geos = null; return {}; });
      return geos;
    }
    function caixa(gj) {
      var b = [180, 90, -180, -90];
      (function andar(c) { if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(andar); })((gj.features || [gj]).map(function (f) { return (f.geometry || f).coordinates; }));
      return b[0] <= b[2] ? b : null;
    }
    function botoes() {
      raiz.querySelectorAll(".ipe-card[data-i] .ipe-ct").forEach(function (ct) {
        if (ct.querySelector(".ipr-ver-mapa")) return;
        var m = /#\s*([0-9A-Za-z-]+)/.exec(ct.textContent || ""); if (!m) return;
        var bt = document.createElement("button"); bt.type = "button"; bt.className = "ipe-b ipe-b--s ipr-ver-mapa"; bt.textContent = "Ver no mapa"; bt.dataset.enc = m[1];
        ct.appendChild(bt);
      });
    }
    raiz.addEventListener("click", function (e) {
      var bt = e.target.closest && e.target.closest(".ipr-ver-mapa"); if (!bt) return;
      e.preventDefault(); e.stopImmediatePropagation();
      bt.disabled = true;
      geometrias().then(function (m) {
        bt.disabled = false;
        var gj = m[bt.dataset.enc], b = gj && caixa(gj), M = mapa();
        if (!b || !M) { bt.textContent = "Sem limite"; return; }
        try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, maxZoom: 17, duration: 1200 }); } catch (x) {}
        // no telemóvel, baixa o painel para se ver o mapa
        if (window.innerWidth <= 900) { try { var d = document.getElementById("ipe-dir"); if (d) d.classList.remove("aberto"); } catch (x) {} }
      });
    }, true);
    raiz.addEventListener("click", function (e) {
      var cc = e.target.closest && e.target.closest(".ipe-card[data-i] > .ipe-cc"); if (!cc || e.target.closest(".ipc-cmp")) return;
      var k = cc.parentNode.dataset.i;
      var era = aberto === null ? (cc.parentNode.classList.contains("on") ? k : "-") : aberto;
      aberto = era === k ? "-" : k;
      setTimeout(aplicar, 0); setTimeout(aplicar, 150);
    }, true);
    new MutationObserver(function () { aplicar(); botoes(); }).observe(raiz, { childList: true, subtree: true });
    aplicar(); botoes();
    return true;
  }
  // §34 Botão «App» no topo (PWA, m90348 no site; Nuno 24/10, 17h29: «quero o botão da app lá no topo»). Fica ao lado do
  // claro/escuro e da geografia natural. Android e Chrome/Edge no computador: abre o pedido de instalação do sistema.
  // iPhone, iPad e Safari: mostra os passos (Partilhar › Adicionar ao ecrã principal). Dentro da app instalada não aparece.
  var pedidoInstalar = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); pedidoInstalar = e; });
  window.addEventListener("appinstalled", function () { var b = document.getElementById("ipr-app-b"); if (b) b.remove(); });
  function naApp() { return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true; }
  function instalarApp() {
    if (naApp()) { document.documentElement.classList.add("ipr-na-app"); }
    var tm = document.getElementById("ipe-tema"); if (!tm || !tm.parentNode) return false;
    if (document.getElementById("ipr-app-b")) return true;
    // dentro da app o botão fica escondido (só serve o menu «Partilhar a app»)
    var st = document.createElement("style");
    st.textContent = "#ipr-app-b{display:inline-flex;align-items:center;gap:5px}#ipr-app-b span{font:600 12px Inter,sans-serif;letter-spacing:.02em}" +
      "#ipr-app-p{position:fixed;z-index:2147483000;top:calc(54px + env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));width:min(320px,calc(100vw - 24px));background:var(--p2,#1d1d1b);color:var(--tx,#eee);border:1px solid var(--ln,#444);border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.45 Inter,system-ui,sans-serif}" +
      "#ipr-app-p b{display:block;font-size:15px;margin-bottom:6px}#ipr-app-p ol{margin:6px 0 10px;padding-left:20px}#ipr-app-p li{margin:3px 0}#ipr-app-p small{color:var(--mu,#aaa);display:block}" +
      "#ipr-app-p .x{position:absolute;top:6px;right:8px;border:0;background:none;color:inherit;font-size:20px;cursor:pointer;line-height:1}" +
      "@media (max-width:600px){#ipr-app-b span{display:none}}.ipr-na-app #ipr-app-b{display:none!important}";
    document.head.appendChild(st);
    var b = document.createElement("button"); b.type = "button"; b.id = "ipr-app-b"; b.className = tm.className;
    b.title = "Instalar o IPR Atlas como app"; b.setAttribute("aria-label", "Instalar a app IPR Atlas");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11.5l3 3 3-3M10.5 18.5h3"/></svg><span>App</span>';
    var nat = document.getElementById("ipr-natural"); tm.parentNode.insertBefore(b, (nat || tm).nextSibling);
    function passos() {
      var ua = navigator.userAgent || "", ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      var safariMac = !ios && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua), firefox = /Firefox\//.test(ua), android = /Android/.test(ua);
      var outroIOS = ios && (!!navigator.brave || /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua));
      if (ios) return (outroIOS ? '<p style="margin:0 0 6px"><b style="display:inline">Este navegador não instala apps.</b> Abra o IPR Atlas no Safari:</p><p style="margin:0 0 8px"><button type="button" class="ipe-b ipe-b--s" data-ipr-copiar-app>Copiar a ligação</button> e cole-a no Safari.</p>' : "") +
        '<ol><li>No Safari, toque em <b style="display:inline">Partilhar</b> (o quadrado com a seta para cima).</li><li>Deslize a lista para baixo e escolha «Adicionar ao ecrã principal».</li><li>Confirme com «Adicionar».</li></ol>' +
        (outroIOS ? "" : '<small>Se não vir «Adicionar ao ecrã principal», está noutro navegador (Brave, Chrome…): abra a ligação no Safari.</small>');
      if (safariMac) return '<ol><li>No menu Ficheiro do Safari, escolha «Adicionar à Dock».</li></ol>';
      if (firefox) return '<p style="margin:0 0 8px">O Firefox não instala apps de sites. Abra o IPR Atlas no Chrome, no Edge ou no Safari.</p>';
      if (android) return '<ol><li>Toque no menu ⋮ do Chrome.</li><li>Escolha «Instalar aplicação» ou «Adicionar ao ecrã principal».</li></ol>';
      return '<ol><li>Na barra de endereço do Chrome ou do Edge, clique no ícone de instalar (um ecrã com uma seta).</li><li>Ou no menu ⋮ › «Transmitir, guardar e partilhar» › «Instalar página como app».</li></ol>';
    }
    window.__iprAppAbrir = function () { b.click(); };
    // Menu «Mais» (Nuno 24/10, 18h08): «Instalar a app» e «Partilhar a app» (partilha do sistema; sem ela, copia a ligação)
    (function menuApp() {
      var m = document.querySelector("#ipe-mais .ipe-mais-m"), sh = document.getElementById("ipe-share");
      if (!m) { setTimeout(menuApp, 1500); return; } if (document.getElementById("ipr-app-inst")) return;
      var ICO = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11.5l3 3 3-3"/></svg>';
      var ICO2 = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M9.5 12.5l5-3M9.5 12.5l5 3"/><circle cx="9.5" cy="12.5" r="1.3"/><circle cx="14.5" cy="9.5" r="1.3"/><circle cx="14.5" cy="15.5" r="1.3"/></svg>';
      function item(id, ico, txt, fn) { var x = document.createElement("button"); x.type = "button"; x.id = id; x.className = "ipe-ib ipe-ib--sh"; x.setAttribute("role", "menuitem"); x.title = txt; x.setAttribute("aria-label", txt); x.innerHTML = ico + "<span>" + txt + "</span>"; x.addEventListener("click", function (e) { e.stopPropagation(); fn(x); }); return x; }
      var inst = item("ipr-app-inst", ICO, "Instalar a app", function () { try { document.getElementById("ipe-mais-b").click(); } catch (x) {} setTimeout(function () { b.click(); }, 60); });
      var part = item("ipr-app-part", ICO2, "Partilhar a app", function (x) {
        var url = location.origin + "/atlas/", txt = "IPR Atlas: o terreno, os projectos e a Base Cartográfica no telemóvel. Abra a ligação e instale a app.";
        if (navigator.share) { navigator.share({ title: "IPR Atlas", text: txt, url: url }).catch(function () {}); return; }
        var ok = function () { var sp = x.querySelector("span"); sp.textContent = "Ligação copiada"; setTimeout(function () { sp.textContent = "Partilhar a app"; }, 2200); };
        try { navigator.clipboard.writeText(url).then(ok, function () { prompt("Copie a ligação:", url); }); } catch (e) { prompt("Copie a ligação:", url); }
      });
      var ref = sh ? sh.nextSibling : m.firstChild;
      if (!naApp()) m.insertBefore(inst, ref);
      m.insertBefore(part, sh ? sh.nextSibling : m.firstChild);
      if (!naApp()) m.insertBefore(inst, part);
      // 24/10 20h53: o «Cookies» flutuante tapava os separadores no telemóvel; no Atlas passa para este menu
      var ICO3 = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 4 3.5 3 3 0 0 0 5 5.5z"/><circle cx="9" cy="10" r="1"/><circle cx="14" cy="15" r="1"/><circle cx="9" cy="15.5" r="1"/></svg>';
      var ck = item("ipr-cookies-m", ICO3, "Preferências de cookies", function () { try { document.getElementById("ipe-mais-b").click(); } catch (x) {} var l = document.getElementById("tcdck-l"); if (l) l.click(); });
      var hr = m.querySelector("hr"); m.insertBefore(ck, hr || null);
      var stc = document.createElement("style"); stc.textContent = "#tcdck-l{display:none!important}"; document.head.appendChild(stc);
    })();
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var p = document.getElementById("ipr-app-p"); if (p) { p.remove(); return; }
      if (pedidoInstalar) { var q = pedidoInstalar; pedidoInstalar = null; q.prompt(); return; }
      p = document.createElement("div"); p.id = "ipr-app-p"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Instalar a app");
      p.innerHTML = '<button type="button" class="x" aria-label="Fechar">×</button><b>IPR Atlas como app</b><p style="margin:0 0 6px">Fica um ícone no ecrã principal e o Atlas abre directamente no mapa, em ecrã inteiro.</p>' + passos();
      document.body.appendChild(p);
      p.querySelector(".x").onclick = function () { p.remove(); };
      var cp = p.querySelector("[data-ipr-copiar-app]"); if (cp) cp.onclick = function (ev) { ev.stopPropagation(); var u = location.origin + "/atlas/"; try { navigator.clipboard.writeText(u).then(function () { cp.textContent = "Ligação copiada"; }, function () { prompt("Copie a ligação:", u); }); } catch (x) { prompt("Copie a ligação:", u); } };
      setTimeout(function () { document.addEventListener("click", function fora(ev) { if (!p.contains(ev.target)) { p.remove(); document.removeEventListener("click", fora); } }); }, 0);
    });
    return true;
  }

  // §35 Tema escuro por omissão (Nuno 24/10, 17h29) e botão claro/escuro legível: lua quando está claro, sol quando está
  // escuro, e o título diz para onde muda. Quem já escolheu claro, escuro ou automático nas definições fica como escolheu.
  function temaEscuro() {
    var tm = document.getElementById("ipe-tema"), raiz = document.getElementById("ipe"); if (!tm || !raiz) return false;
    var cfg = {}; try { cfg = JSON.parse(localStorage.getItem("ipe_cfg_v1") || "{}") || {}; } catch (e) {}
    if (!cfg.tema && raiz.classList.contains("claro")) { try { tm.click(); } catch (e) {} }
    var SOL = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>';
    var LUA = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
    function marcar() {
      var claro = raiz.classList.contains("claro");
      var t = claro ? "Tema claro. Mudar para escuro" : "Tema escuro. Mudar para claro";
      if (tm.title !== t) { tm.title = t; tm.setAttribute("aria-label", t); tm.innerHTML = claro ? LUA : SOL; }
    }
    new MutationObserver(marcar).observe(raiz, { attributes: true, attributeFilter: ["class"] });
    marcar();
    return true;
  }

  // §36 Organizações (Nuno 24/10, 17h32): quem pertence a várias escolhe a activa (lista do m90350, window.IPR_ORGS);
  // as camadas ficam em pastas por projecto («268 Quinta Linda») com subpastas («terreno e zonas», «água», «temas»),
  // todas recolhíveis; o estado fica guardado neste aparelho. Os nós do org.js só mudam de sítio: os interruptores mantêm-se.
  function orgPastas() {
    var P = document.querySelector('.ipe-pane[data-pane="org"]'); if (!P) return false;
    if (window.__iprOrgP) return true; window.__iprOrgP = 1;
    var st = document.createElement("style");
    st.textContent = ".ipr-of{margin:10px 0 2px;border:1px solid var(--ln2,rgba(127,127,127,.25));border-radius:10px;overflow:hidden}" +
      ".ipr-of>button,.ipr-sf>button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;cursor:pointer;padding:9px 10px;font:600 13px Inter,sans-serif;color:var(--tx)}" +
      ".ipr-of>button{background:var(--p3,rgba(127,127,127,.08))}.ipr-of>button i,.ipr-sf>button i{width:10px;height:10px;border-radius:50%;flex:none}" +
      ".ipr-of>button em,.ipr-sf>button em{font-style:normal;flex:1;min-width:0}.ipr-of small,.ipr-sf small{font:500 11px Inter,sans-serif;color:var(--mu)}" +
      ".ipr-of>button:after,.ipr-sf>button:after{content:'';width:7px;height:7px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);margin:0 4px 3px 2px;transition:transform .15s;opacity:.7}" +
      ".ipr-of.rec>button:after,.ipr-sf.rec>button:after{transform:rotate(-45deg);margin-bottom:0}" +
      ".ipr-of.rec>.ipr-of-b,.ipr-sf.rec>.ipr-sf-b{display:none}.ipr-of-b{padding:0 6px 6px}.ipr-sf>button{padding:8px 6px;font-weight:500;border-top:1px solid var(--ln2,rgba(127,127,127,.2))}" +
      ".ipr-sf-b{padding-left:14px}.ipr-sec>button{font-weight:600;text-transform:none;letter-spacing:.01em}.ipr-sec>button em:before{content:'';display:inline-block;width:3px;height:12px;background:var(--ac,#75834a);border-radius:2px;margin-right:8px;vertical-align:-1px}.ipe-pane[data-pane=org] .ipo-g{display:none}" +
      ".ipr-orgsel{font:600 13px Inter,sans-serif;background:var(--p3,transparent);color:var(--tx);border:1px solid var(--ln);border-radius:8px;padding:5px 8px;max-width:100%}";
    document.head.appendChild(st);
    var EST = {}; try { EST = JSON.parse(localStorage.getItem("ipr_org_pastas") || "{}") || {}; } catch (e) {}
    function guardar() { try { localStorage.setItem("ipr_org_pastas", JSON.stringify(EST)); } catch (e) {} }
    function chave(s) { return String(s).toLowerCase().replace(/\s+/g, " ").trim(); }
    function pasta(cls, k, titulo, cor, porOmissao) {
      var d = document.createElement("div"); d.className = cls; d.dataset.k = k;
      var rec = k in EST ? EST[k] : porOmissao; if (rec) d.classList.add("rec");
      var bt = document.createElement("button"); bt.type = "button"; bt.setAttribute("aria-expanded", String(!rec));
      bt.innerHTML = (cor ? '<i style="background:' + cor + '"></i>' : "") + "<em></em><small></small>"; bt.querySelector("em").textContent = titulo;
      bt.addEventListener("click", function () { var r = d.classList.toggle("rec"); EST[k] = r; guardar(); bt.setAttribute("aria-expanded", String(!r)); });
      var b = document.createElement("div"); b.className = cls.split(" ")[0] + "-b"; d.appendChild(bt); d.appendChild(b); return d;
    }
    function contar(d) {
      var t = d.querySelectorAll(".ipo-c").length, l = d.querySelectorAll(".ipo-c input:checked").length;
      var s = d.querySelector(":scope>button small"); if (s) s.textContent = t + (l ? " · " + l + " ligada" + (l > 1 ? "s" : "") : "");
    }
    function seletor() {
      var O = window.IPR_ORGS; if (!O || !O.lista || O.lista.length < 2) return;
      var top = P.querySelector(".ipo-top"); if (!top || top.querySelector(".ipr-orgsel")) return;
      var s = document.createElement("select"); s.className = "ipr-orgsel"; s.setAttribute("aria-label", "Organização activa");
      O.lista.forEach(function (o) { var op = document.createElement("option"); op.value = o.id; op.textContent = o.nome + (o.papel ? " · " + o.papel : ""); if (+o.id === +O.activa) op.selected = true; s.appendChild(op); });
      s.addEventListener("change", function () { location.href = "/atlas/?ipr_org=" + encodeURIComponent(s.value) + "&_ipr_org=" + encodeURIComponent(O.nonce) + "&separador=org"; });
      var nome = top.querySelector(".ipe-lbl"); if (nome) nome.replaceWith(s); else top.insertBefore(s, top.firstChild);
    }
    function organizar() {
      seletor();
      var gs = [].slice.call(P.querySelectorAll(":scope .ipo-g")).filter(function (g) { return !g.closest(".ipr-of"); });
      if (!gs.length) { P.querySelectorAll(".ipr-of,.ipr-sf").forEach(contar); return; }
      var projs = {}, ordem = [];
      gs.forEach(function (g) {
        var nome = g.textContent.trim(), cor = (g.querySelector("i") || {}).style ? g.querySelector("i").style.background : "";
        var m = /^(\d+\s[^·]{2,60}?)\s·\s(.+)$/.exec(nome), proj, sub, sec = "";
        if (m) { proj = m[1]; sub = m[2].charAt(0).toUpperCase() + m[2].slice(1); var pp = sub.split(" · "); if (pp.length > 1) { sec = pp[0]; sub = pp.slice(1).join(" · "); } }
        else if (/Temas do projecto/i.test(nome)) { proj = ordem.length === 1 ? ordem[0] : "Temas"; sub = "Temas do projecto (QGIS)"; }
        else { proj = nome; sub = ""; }
        var linhas = [];
        // 25/10, 19h28 (Nuno): na Organização só a lista dos projectos, cada um na sua pasta, como no Drive. Grupos sem número
        // de projecto e vazios (os grupos-modelo «Áreas e acordos», «Observações»…) escondem-se; com camadas, vão para o fim.
        var semNum = !/^\d+\s/.test(proj) && !/^\d+\s/.test(nome); var n = g.nextElementSibling; while (n && n.classList.contains("ipo-c")) { linhas.push(n); n = n.nextElementSibling; }
        linhas.forEach(function (c) { var b = c.querySelector("label b"); if (b && !b.dataset.ipoN) { b.dataset.ipoN = "1"; var mm = /^(\d+\s[^·]{2,60}?)\s·\s(.+)$/.exec(b.textContent); if (mm && (mm[1] === proj || !m)) { b.title = b.textContent; b.textContent = mm[2]; } } });
        if (semNum) { if (!linhas.length) { g.style.display = "none"; return; } sub = proj; sec = ""; proj = "Outras camadas da organização"; }
        if (!projs[proj]) { projs[proj] = { cor: cor, subs: [] }; ordem.push(proj); }
        projs[proj].subs.push({ nome: sub, sec: sec, cor: cor, g: g, linhas: linhas });
      });
      var ancora = gs[0];
      ordem.forEach(function (proj) {
        // 25/10, 18h14 (Nuno): «só ver uma vez 268 Quinta Linda». Se a pasta do projecto já existe, junta-se a ela.
        var p = projs[proj], F = P.querySelector('.ipr-of[data-k="p:' + chave(proj).replace(/"/g, "") + '"]');
        if (!F) { F = pasta("ipr-of", "p:" + chave(proj).replace(/"/g, ""), proj, p.cor, false); ancora.parentNode.insertBefore(F, ancora); }
        var FB = F.querySelector(".ipr-of-b");
        // 25/10 (Nuno, 16h55): três níveis quando o grupo se chama «268 Quinta Linda · Projecto Terracrua Design · Água»:
        // projecto, secção (Análise, Projecto Terracrua Design, AutoCADs) e subpasta. Sem secção, fica como antes.
        var secs = {};
        p.subs.forEach(function (s) {
          FB.appendChild(s.g);
          var alvo = FB;
          if (s.sec) {
            if (!secs[s.sec]) { secs[s.sec] = FB.querySelector(':scope>.ipr-sec[data-k="c:' + chave(proj + "|" + s.sec).replace(/"/g, "") + '"]') || pasta("ipr-sf ipr-sec", "c:" + chave(proj + "|" + s.sec).replace(/"/g, ""), s.sec, "", false); FB.appendChild(secs[s.sec]); }
            alvo = secs[s.sec].querySelector(".ipr-sf-b");
          }
          if (!s.nome || (!s.sec && p.subs.length === 1)) { s.linhas.forEach(function (c) { alvo.appendChild(c); }); return; }
          var S = pasta("ipr-sf", "s:" + chave(proj + "|" + s.sec + "|" + s.nome), s.nome, s.cor, true), SB = S.querySelector(".ipr-sf-b");
          s.linhas.forEach(function (c) { SB.appendChild(c); }); alvo.appendChild(S); contar(S);
        });
        Object.keys(secs).forEach(function (k) { contar(secs[k]); });
        contar(F);
      });
      // Pastas por ordem do número do projecto; «Outras camadas» no fim.
      var fs = [].slice.call(P.querySelectorAll(".ipr-of")); if (fs.length > 1) {
        var num = function (f) { var t = (f.querySelector(":scope>button em") || {}).textContent || ""; var m2 = /^(\d+)/.exec(t); return m2 ? +m2[1] : 1e9; };
        var srt = fs.slice().sort(function (a, b) { return num(a) - num(b); });
        if (srt.some(function (f, i) { return f !== fs[i]; }) && fs.every(function (f) { return f.parentNode === fs[0].parentNode; })) { var pai = fs[0].parentNode, marca = document.createComment(""); pai.insertBefore(marca, fs[0]); srt.forEach(function (f) { pai.insertBefore(f, marca); }); marca.remove(); }
      }
    }
    P.addEventListener("change", function () { setTimeout(function () { P.querySelectorAll(".ipr-of,.ipr-sf").forEach(contar); }, 0); });
    new MutationObserver(function () { clearTimeout(organizar.t); organizar.t = setTimeout(organizar, 30); }).observe(P, { childList: true, subtree: true });
    organizar();
    return true;
  }

  // §37 Discrição (Nuno 24/10, 17h35): à primeira vista os nomes das camadas e dos grupos não mostram a proveniência
  // (siglas de fontes entre parênteses); a fonte continua na ficha da camada e na atribuição do mapa, como as licenças
  // exigem. No Explorer, as camadas trancadas mostram só o nome e «Intelligence», sem ficha.
  var SIGLAS = /\s*\((?:GBIF|NASA GIBS|NASA|MODIS|SMAP|MERRA-2|DGT|ICNF|APA|SNIAmb|OpenStreetMap|OSM|IGN|CNIG|EEA|Copernicus|CLMS|LNEG|DGADR|DGEG|INE|IFAP|ESA|EOX|Esri|Mapterhorn|PNOA)(?:[^)]*)\)/g;
  function discricao() {
    if (window.__iprDisc) return true; if (!document.body) return false; window.__iprDisc = 1;
    var explorer = window.IPR_NIVEL === "explorer";
    function limpar(raiz) {
      (raiz || document).querySelectorAll(".ipr-nome, .ipr-sub, .ipr-gh, .ipr-grupo, .ipr-sg, [class*='ipr-cat'] > span, .ipr-it small").forEach(function (el) {
        [].forEach.call(el.childNodes, function (n) { if (n.nodeType === 3 && SIGLAS.test(n.nodeValue)) { SIGLAS.lastIndex = 0; n.nodeValue = n.nodeValue.replace(SIGLAS, ""); } SIGLAS.lastIndex = 0; });
      });
      if (explorer) (raiz || document).querySelectorAll("li.ipr-it.bl small.ipr-cad").forEach(function (s) { if (s.textContent !== "Intelligence") s.textContent = "Intelligence"; });
    }
    var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { limpar(); }, 40); }).observe(document.body, { childList: true, subtree: true, characterData: true });
    if (explorer) document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-ipr-ficha]"); if (b && b.closest("li.ipr-it.bl")) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    limpar();
    return true;
  }

  // §38 Estradas no mapa normal (Nuno 24/10, 17h34): ao chegar ao Atlas liga as estradas do OpenStreetMap, que vão
  // aparecendo com a aproximação (principais primeiro, depois as locais). Não liga em modo geografia natural.
  function estradas() {
    var R = viz(); if (!R || window.__ipeAb) return false;
    var nat = document.getElementById("ipr-natural"); if (nat && nat.getAttribute("aria-pressed") === "true") return true;
    try { R.ligar("o_estradas", true); } catch (e) {}
    return true;
  }
  // §39 IPR Cloud sem repetições (Nuno 24/10, 17h37): o nome do terreno não se repete na linha de baixo; quando todos os
  // terrenos têm o mesmo papel (por exemplo «Administrador»), o papel aparece uma vez no topo e não em cada cartão;
  // cartões iguais (mesmo código) só aparecem uma vez.
  function cloudLimpo() {
    var P = document.querySelector('.ipe-pane[data-pane="cloud"]') || document.getElementById("ipe-cloud"); if (!P) return false;
    if (window.__iprCloudL) return true; window.__iprCloudL = 1;
    function limpar() {
      var cs = [].slice.call(P.querySelectorAll(".ipc-ter")); if (!cs.length) return;
      var vistos = {}, papeis = {};
      cs.forEach(function (c) {
        var cod = (c.querySelector(".ipc-cod") || {}).textContent || "";
        if (cod && vistos[cod]) { c.hidden = true; return; } vistos[cod] = 1;
        var n = c.querySelector(".ipc-nome"), m = c.querySelector(".ipc-meta");
        if (n && m && !m.dataset.l) {
          m.dataset.l = "1";
          var nome = n.textContent.trim().replace(/\s*\(pelo mapa\)\s*$/, ""), partes = m.textContent.split(" · ");
          partes = partes.filter(function (x) { var y = x.trim().replace(/\s*\(pelo mapa\)\s*$/, ""); return y && y !== nome && nome.indexOf(y) !== 0; });
          m.textContent = partes.join(" · ");
        }
        var p = c.querySelector(".ipc-papel"); if (p) papeis[p.textContent.trim()] = 1;
      });
      var ks = Object.keys(papeis), so = ks.length === 1;
      P.classList.toggle("ipr-papel-unico", so);
      var top = P.querySelector(".ipc-top"); if (top) { var e = top.querySelector(".ipr-papel-t"); if (so) { if (!e) { e = document.createElement("small"); e.className = "ipr-papel-t"; top.appendChild(e); } e.textContent = ks[0]; } else if (e) e.remove(); }
    }
    var st = document.createElement("style");
    st.textContent = ".ipr-papel-unico .ipc-ter .ipc-papel{display:none}.ipr-papel-t{font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--ac2);margin-left:auto}";
    document.head.appendChild(st);
    var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(limpar, 30); }).observe(P, { childList: true, subtree: true });
    limpar();
    return true;
  }
  // §40 Barra do mapa mais limpa (Nuno 24/10, 17h44, foto do iPad): aproximar/afastar, a rosa dos ventos, «Parcelas aqui» e
  // a localização passam para o canto superior esquerdo do mapa; à direita fica só a barra das ferramentas, que sobe para o
  // topo e ganha espaço entre os grupos (seleccionar e medir, desenhar, painéis e ficheiros, tempo e vista).
  function navEsquerda() {
    var ctr = document.querySelector("#ipe .maplibregl-ctrl-top-right"), tl = document.querySelector("#ipe .maplibregl-ctrl-top-left");
    if (!ctr || !tl || !document.querySelector("#ipe .ipe-tools")) return false;
    if (window.__iprNavE) return true;
    var gs = [].slice.call(ctr.children).filter(function (g) { return g.classList.contains("maplibregl-ctrl-group"); });
    if (!gs.length) return false;
    window.__iprNavE = 1;
    var st = document.createElement("style");
    st.textContent = "#ipe .maplibregl-ctrl-top-left.ipr-nav{display:flex;flex-direction:column;gap:6px;top:8px;left:8px}" +
      "#ipe .maplibregl-ctrl-top-left.ipr-nav .maplibregl-ctrl-group{margin:0;background:var(--p1);border:1px solid var(--ln);border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.18);overflow:hidden}" +
      "#ipe .ipr-nav .maplibregl-ctrl-group:empty,#ipe .ipr-nav .maplibregl-ctrl-group:not(:has(button)){display:none}" +
      "#ipe .maplibregl-ctrl-top-left.ipr-nav .maplibregl-ctrl-group button{width:36px;height:36px;color:var(--tx)}" +
      "#ipe .ipr-nav .ipe-rosa{position:static!important;width:40px!important;min-width:0!important;margin:2px 0}#ipe .ipr-nav .ipe-rosa svg{width:40px!important;height:40px!important}#ipe .ipr-nav .ipe-rosa>:not(svg){display:none}" +
      "#ipe .ipe-tools{top:8px!important}#ipe .ipe-tools .ipe-tg+.ipe-tg{margin-top:6px}";
    document.head.appendChild(st);
    tl.classList.add("ipr-nav");
    function mover() {
      [].slice.call(ctr.children).forEach(function (g) { if (g.classList.contains("maplibregl-ctrl-group")) tl.appendChild(g); });
      var rz = document.querySelector("#ipe .ipe-rosa"); if (rz && rz.parentNode !== tl) tl.insertBefore(rz, tl.children[1] || null);
    }
    mover();
    new MutationObserver(mover).observe(document.getElementById("ipe") || document.body, { childList: true, subtree: true });
    return true;
  }
  // §41 Encomenda mais compacta e Cronologia no Intelligence (Nuno 24/10, 17h47): as quatro formas de indicar o terreno
  // ficam em botões pequenos de uma linha, sempre à vista; o vale de oferta fica com uma frase curta. No Explorer, o botão
  // Cronologia explica que é do IPR Atlas Intelligence em vez de abrir.
  function encomendaCompacta() {
    if (window.__iprEncC) return true; if (!document.querySelector(".ipe-met")) return false; window.__iprEncC = 1;
    var st = document.createElement("style");
    st.textContent = "#ipe .ipe-met{display:grid!important;grid-template-columns:1fr 1fr;gap:6px!important}" +
      "#ipe .ipe-met .ipe-mb{display:flex!important;flex-direction:row!important;align-items:center;gap:7px;min-height:0!important;padding:7px 9px!important;font-size:12.5px!important;line-height:1.2!important;text-align:left}" +
      "#ipe .ipe-met .ipe-mb svg{width:15px;height:15px;flex:none}" +
      ".ipr-crono-int{font:12.5px/1.4 Inter,sans-serif;color:var(--mu);margin:6px 0 0;padding:8px 10px;border:1px solid var(--ln);border-radius:8px}";
    document.head.appendChild(st);
    function vale() {
      var l = document.querySelector('label[for="ipe-vale"]'); if (l && l.textContent !== "Vale de oferta (opcional)") l.textContent = "Vale de oferta (opcional)";
      var n = document.getElementById("ipe-vale-nota"); if (n && !n.dataset.c) { n.dataset.c = "1"; n.textContent = "O código OFERTA-… que recebeu. Sem o código, reconhecemos o vale pelo seu nome."; }
    }
    vale(); new MutationObserver(vale).observe(document.getElementById("ipe") || document.body, { childList: true, subtree: true });
    if (window.IPR_NIVEL === "explorer") {
      document.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".ipr-crono-b"); if (!b) return;
        e.stopImmediatePropagation(); e.preventDefault();
        var cab = b.closest(".ipr-arv-cab") || b.parentNode, n = cab.parentNode.querySelector(".ipr-crono-int");
        if (n) { n.remove(); return; }
        n = document.createElement("p"); n.className = "ipr-crono-int";
        n.textContent = "A Cronologia compara o terreno em ortofotos de 1995 a 2025 e as áreas ardidas de cada período. Faz parte do IPR Atlas Intelligence.";
        cab.parentNode.insertBefore(n, cab.nextSibling);
      }, true);
    }
    return true;
  }
  // §42 Testar a ligação (Nuno 24/10, 17h50): com internet fraca as camadas demoram ou falham e parece que o Atlas não
  // funciona. O botão mede o tempo de resposta e a velocidade de descarga, experimenta os servidores dos fundos (DGT,
  // Sentinel-2, relevo) e diz em linguagem simples o que esperar e o que fazer. Não envia nada para fora: só descarrega.
  function testarLigacao() {
    var arv = document.querySelector("#ipe-cam .ipr-arv") || document.querySelector(".ipr-arv"); if (!arv) return false;
    if (document.getElementById("ipr-lig-b")) return true;
    var st = document.createElement("style");
    st.textContent = ".ipr-testes{display:flex;gap:6px;margin:6px 0 2px}.ipr-testes>*{flex:1 1 0;min-width:0;margin:0!important;width:auto!important;justify-content:center;white-space:nowrap}" +
      "#ipr-lig-b{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:6px 0 2px;padding:7px 10px;border:1px solid var(--ln);border-radius:8px;background:var(--p2,transparent);color:var(--tx);font:500 12.5px Inter,sans-serif;cursor:pointer}" +
      "#ipr-lig-r{margin:4px 0 8px;padding:9px 11px;border:1px solid var(--ln);border-radius:8px;font:12.5px/1.45 Inter,sans-serif;color:var(--tx)}#ipr-lig-r b{display:block;font-size:13.5px;margin-bottom:3px}" +
      "#ipr-lig-r ul{margin:6px 0 0;padding-left:18px;color:var(--mu)}#ipr-lig-r .ok{color:#7fae4a}#ipr-lig-r .med{color:#d9a43a}#ipr-lig-r .mau{color:#d9534f}";
    document.head.appendChild(st);
    var b = document.createElement("button"); b.type = "button"; b.id = "ipr-lig-b";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1.2" fill="currentColor"/></svg><span>Testar internet</span>';
    b.title = "Verifica se a sua internet chega para carregar as camadas";
    // 24/10 18h05: «Testar camadas» e «Testar internet» partilham a mesma linha, metade cada um
    var linha = document.createElement("div"); linha.className = "ipr-testes";
    var cab = arv.querySelector(".ipr-arv-cab"); arv.insertBefore(linha, cab ? cab.nextSibling : arv.firstChild);
    linha.appendChild(b);
    function juntar() { var t = document.getElementById("tcd-testar-cam"); if (t && t.parentNode !== linha) linha.insertBefore(t, b); }
    juntar(); new MutationObserver(juntar).observe(arv, { childList: true });
    // 25/10, 19h56 (Nuno: «porque é que tiraste o botão de testar camadas?»): o botão vem do m90295 e às vezes não chega a ser
    // criado (a página demora mais do que a espera dele). Para a equipa, se ao fim de 5 s não existir, cria-se aqui o mesmo botão.
    setTimeout(function () {
      if (document.getElementById("tcd-testar-cam") || !(window.tcdEquipa || window.tcdAdmin || document.body.classList.contains("admin-bar"))) return;
      var t = document.createElement("button"); t.type = "button"; t.id = "tcd-testar-cam"; t.title = "Testar todas as camadas (só equipa)";
      t.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg><span>Testar camadas</span>';
      t.addEventListener("click", function () { var c = document.getElementById("ipe-cfg"); if (!c) return; c.click(); var n = 0, j = setInterval(function () { var d = document.querySelector("[data-cfga=diag]"); if (d) { clearInterval(j); d.click(); } else if (++n > 40) clearInterval(j); }, 100); });
      linha.insertBefore(t, b);
    }, 5000);
    var r = document.createElement("div"); r.id = "ipr-lig-r"; r.hidden = true; linha.parentNode.insertBefore(r, linha.nextSibling);
    function tempo(u, ms) {
      var c = new AbortController(), t0 = performance.now(), to = setTimeout(function () { c.abort(); }, ms || 8000);
      return fetch(u, { cache: "no-store", mode: "cors", signal: c.signal }).then(function (x) { return x.arrayBuffer().then(function (a) { clearTimeout(to); return { ok: x.ok, ms: performance.now() - t0, kb: a.byteLength / 1024 }; }); })
        .catch(function () { clearTimeout(to); return { ok: false, ms: performance.now() - t0, kb: 0 }; });
    }
    b.addEventListener("click", function () {
      if (b.disabled) return;
      b.disabled = true; r.hidden = false; r.innerHTML = "<b>A testar…</b>Demora uns segundos.";
      if (!navigator.onLine) { r.innerHTML = '<b class="mau">Sem ligação à internet</b>O aparelho está desligado da rede. As camadas voltam quando houver internet.'; b.disabled = false; return; }
      var n = Date.now(), pings = [];
      (function ping(i) {
        if (i >= 3) return medir();
        tempo("/ipr-app.webmanifest?l=" + n + i, 6000).then(function (x) { if (x.ok) pings.push(x.ms); ping(i + 1); });
      })(0);
      function medir() {
        Promise.all([
          tempo("https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js?l=" + n, 20000),
          tempo("https://ortos.dgterritorio.gov.pt/wms/ortosat2023?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ortoSat2023-CorVerdadeira&STYLES=&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg&BBOX=-939258,4696291,-861016,4774562&l=" + n, 12000),
          tempo("https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/8/97/121.jpg?l=" + n, 12000),
          tempo("https://tiles.mapterhorn.com/8/121/97.webp?l=" + n, 12000)
        ]).then(function (v) {
          var lat = pings.length ? Math.round(pings.sort(function (a, b) { return a - b; })[Math.floor(pings.length / 2)]) : null;
          var mbps = v[0].ok && v[0].ms > 0 ? (v[0].kb * 8 / 1024) / (v[0].ms / 1000) : 0;
          var nota = lat === null ? "mau" : (mbps >= 8 && lat < 250 ? "ok" : (mbps >= 2 && lat < 700 ? "med" : "mau"));
          var tit = { ok: "Ligação boa", med: "Ligação razoável", mau: "Ligação fraca" }[nota];
          var txt = { ok: "As camadas devem carregar normalmente.", med: "As camadas carregam, mas mais devagar. Ligue poucas de cada vez.", mau: "Com esta ligação as camadas podem demorar muito ou não aparecer. Não é avaria do Atlas." }[nota];
          var srv = [["Ortofotos e serviços da DGT", v[1]], ["Imagem de satélite (Sentinel-2)", v[2]], ["Relevo", v[3]]].map(function (s) {
            return "<li>" + s[0] + ": " + (s[1].ok ? (s[1].ms < 1500 ? "responde bem" : "responde devagar") : "não respondeu") + "</li>";
          }).join("");
          var dicas = nota === "ok" ? "" : "<li>Ligue só as camadas de que precisa e desligue as outras.</li><li>Use o mapa mais afastado até as imagens aparecerem.</li><li>No terreno sem rede, use o QField com o projecto descarregado.</li>";
          var ct = navigator.connection && navigator.connection.effectiveType ? " · rede " + navigator.connection.effectiveType.toUpperCase() : "";
          r.innerHTML = '<b class="' + nota + '">' + tit + "</b>" + txt +
            '<div style="margin-top:4px;color:var(--mu)">Resposta ' + (lat === null ? "sem resposta" : lat + " ms") + " · descarga " + (mbps ? (mbps >= 10 ? Math.round(mbps) : mbps.toFixed(1)) + " Mbit/s" : "falhou") + ct + "</div>" +
            "<ul>" + srv + dicas + "</ul>";
          b.disabled = false;
        });
      }
    });
    return true;
  }
  // §43 Reabrir o painel da esquerda (Nuno 24/10, 18h09: «na app, depois de desseleccionar, já não dá para reactivar»).
  // Quando o painel das camadas está fechado e não há outro botão à vista para o abrir, aparece uma lingueta «Camadas»
  // encostada à esquerda do mapa. Usa o mesmo botão do Atlas (#ipe-camadas), por isso abre e fecha como sempre.
  function linguetaEsq() {
    var ipe = document.getElementById("ipe"), cam = document.getElementById("ipe-camadas"), mapaEl = document.getElementById("ipe-mapa");
    if (!ipe || !cam || !mapaEl) return false; if (document.getElementById("ipr-lingueta")) return true;
    var st = document.createElement("style");
    st.textContent = "#ipr-lingueta{position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:4;display:flex;align-items:center;gap:6px;padding:12px 8px 12px 6px;border:1px solid var(--ln);border-left:0;border-radius:0 10px 10px 0;background:var(--p1);color:var(--tx);font:600 12px Inter,sans-serif;writing-mode:vertical-rl;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.2)}#ipr-lingueta svg{transform:rotate(90deg)}";
    document.head.appendChild(st);
    var l = document.createElement("button"); l.type = "button"; l.id = "ipr-lingueta"; l.hidden = true; l.setAttribute("aria-label", "Abrir o painel das camadas");
    l.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="m3 14 9 5 9-5"/></svg>Camadas';
    mapaEl.appendChild(l);
    l.addEventListener("click", function (e) { e.stopPropagation(); cam.click(); setTimeout(ver, 50); });
    function visivel(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }
    function ver() {
      var largo = window.innerWidth > 900, fechado = largo ? ipe.classList.contains("sem-esq") : !ipe.classList.contains("esq-aberto");
      var barra = [].slice.call(document.querySelectorAll("#ipe .ipe-tools button")).filter(function (x) { return /Barra lateral/.test(x.title || x.getAttribute("aria-label") || x.getAttribute("data-ipr-tip") || ""); })[0];
      var outro = visivel(cam) || visivel(barra);
      l.hidden = !(fechado && !outro);
    }
    new MutationObserver(ver).observe(ipe, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", ver); ver(); setTimeout(ver, 1500);
    return true;
  }
  // §46 Portugal de longe (Nuno 25/10, 16h48: «Q merda de default mapa. Quero q seja top»). As ortofotos da DGT não são servidas
  // a escalas pequenas e, em JPEG, voltam como um rectângulo cinzento por cima do país. Abaixo do zoom 9,5 os fundos da DGT
  // escondem-se e fica o satélite sem nuvens (Sentinel-2, EOX, já usado por baixo) com o relevo sombreado do Mapterhorn por cima,
  // a esbater-se até ao zoom 11. A partir daí entra a ortofoto de 30 cm como antes. Não mexe nos outros fundos nem nas camadas.
  // 25/10, 19h13 (Nuno: «não te pedi uma camada branca à volta de Portugal [...] ortofoto com o mais detalhe possível,
  // ensombreamento meio 3D e toponímia»). A mancha branca era a cópia em PNG que o viz.js junta aos fundos da DGT para os
  // níveis de zoom pequenos (camadas «-lzr»): a DGT devolve-a quase branca. Agora, abaixo do zoom 9,5, nenhum fundo da DGT
  // (ortos, OrtoSat e mosaicos Sentinel de Portugal, com ou sem «-lzr») aparece; fica o satélite sem nuvens. O relevo
  // sombreado passa a ficar por cima de qualquer fundo de imagem a todas as escalas (forte de longe, suave sobre a ortofoto)
  // e só se esconde com os mapas desenhados (OpenStreetMap, OpenTopoMap, Relevo sombreado). A toponímia fica ligada.
  function longe() {
    var m = window.__ipe && window.__ipe.mapa; if (!m || !m.getStyle || !m.getStyle()) return false;
    var DGT = /^iprv-f_(ortosat|orto18|o\d\d|o04|s2jul|s2jan|s2out)(-lzr)?$/, DESENHO = /^iprv-f_(mapa|otm|relevo)(-|$)/, ZMIN = 9.5;
    function aplicar() {
      var st = m.getStyle(); if (!st || !st.layers) return; var ls = st.layers;
      ls.forEach(function (l) { if (DGT.test(l.id) && (l.minzoom || 0) < ZMIN) { try { m.setLayerZoomRange(l.id, ZMIN, l.maxzoom || 24); } catch (e) {} } });
      if (!m.getSource("ipr-longe-dem")) { try { m.addSource("ipr-longe-dem", { type: "raster-dem", tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"], encoding: "terrarium", tileSize: 512, maxzoom: 12, attribution: "Relevo: Mapterhorn (Copernicus GLO-30, LiDAR DGT; CC BY 4.0) · Satélite: Sentinel-2 cloudless 2016, EOX (CC BY 4.0)" }); } catch (e) {} }
      // Fica logo acima do último fundo (iprv-f_*), por baixo das camadas temáticas e da toponímia.
      var ult = -1; ls.forEach(function (l, k) { if (l.id.indexOf("iprv-f_") === 0) ult = k; });
      var antes; for (var k = ult + 1; k < ls.length; k++) { if (ls[k].id !== "ipr-longe-relevo") { antes = ls[k].id; break; } }
      if (!m.getLayer("ipr-longe-relevo")) {
        try {
          m.addLayer({ id: "ipr-longe-relevo", type: "hillshade", source: "ipr-longe-dem", paint: {
            "hillshade-exaggeration": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 9, 0.5, 12, 0.38, 16, 0.3],
            "hillshade-illumination-direction": 315,
            "hillshade-shadow-color": "rgba(18,22,14,0.6)", "hillshade-highlight-color": "rgba(255,248,228,0.25)", "hillshade-accent-color": "rgba(10,12,8,0.22)" } }, antes);
        } catch (e) {}
      } else if (ult >= 0) {
        var pos = ls.findIndex(function (l) { return l.id === "ipr-longe-relevo"; });
        if (pos >= 0 && pos < ult) { try { m.moveLayer("ipr-longe-relevo", antes); } catch (e) {} }
      }
      if (m.getLayer("ipr-longe-relevo")) {
        var desenho = ls.some(function (l) { return DESENHO.test(l.id) && m.getLayoutProperty(l.id, "visibility") !== "none"; });
        var v = desenho ? "none" : "visible";
        try { if ((m.getLayoutProperty("ipr-longe-relevo", "visibility") || "visible") !== v) m.setLayoutProperty("ipr-longe-relevo", "visibility", v); } catch (e) {}
      }
      // Toponímia sempre presente (localidades, aldeias, rios e serras), ligada pelo catálogo como se carregasse na caixa.
      if (!longe.nomes && window.IPRViz && !ls.some(function (l) { return l.id.indexOf("iprv-o_nomes-") === 0; })) {
        var cx = document.querySelector('.ipr-it[data-id="o_nomes"] input');
        if (cx) { longe.nomes = 1; if (!cx.checked) cx.click(); }
        else if (window.__ipe && window.__ipe.viz && typeof window.__ipe.viz.ligar === "function") { longe.nomes = 1; try { window.__ipe.viz.ligar("o_nomes", true); } catch (e) {} }
      }
    }
    var t = 0; m.on("styledata", function () { clearTimeout(t); t = setTimeout(aplicar, 60); });
    aplicar();
    return true;
  }
  // §47 Painel das camadas arrumado (Nuno 25/10, 17h36): o «Mundo» passa para baixo de «Testar camadas / Testar internet»,
  // como mais uma categoria; «A minha Base Cartográfica» e «O meu terreno» saem da esquerda, porque a Base e os projectos vivem
  // à direita (Projectos e Organização). As camadas entregues continuam a ligar-se pelo cartão do projecto.
  function arrumarCamadas() {
    if (!document.getElementById("ipr-arr-css")) {
      var st = document.createElement("style"); st.id = "ipr-arr-css";
      st.textContent = '#ipe-cam .ipr-g[data-g="base"],#ipe-cam .ipr-g[data-g="meus"]{display:none!important}' +
        // 25/10, 19h24 (Nuno: «duas oficinas?»): fica só o botão destacado do topo; a ligação de texto repetida sai.
        'body:has(a.ipr-painel) #ipr-painel-b{display:none!important}' +
        '#tao.ipr-mundo{padding:9px 10px;border-bottom:1px solid var(--ln,#ddd);border-top:0}#tao.ipr-mundo h4{font:600 13.5px Inter,system-ui,sans-serif}' +
        '#tao.ipr-mundo h4 svg{flex:none;opacity:.85}';
      document.head.appendChild(st);
    }
    var tao = document.getElementById("tao"), linha = document.querySelector("#ipe-cam .ipr-testes");
    if (!tao || !linha) return false;
    var depois = document.getElementById("ipr-lig-r") || linha;
    if (tao.previousElementSibling !== depois) depois.parentNode.insertBefore(tao, depois.nextSibling);
    if (!tao.classList.contains("ipr-mundo")) {
      tao.classList.add("ipr-mundo");
      var h = tao.querySelector("h4");
      if (h && !h.querySelector("svg")) { h.firstChild && (h.firstChild.nodeValue = "Mundo"); h.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" style="order:-1"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>'); }
    }
    // O Atlas redesenha a lista: volta a pôr o Mundo no sítio sempre que mexe.
    if (!window.__iprArrObs) { window.__iprArrObs = 1; new MutationObserver(function () { clearTimeout(arrumarCamadas.t); arrumarCamadas.t = setTimeout(arrumarCamadas, 50); }).observe(document.getElementById("ipe-cam"), { childList: true, subtree: false }); }
    return true;
  }
  // §48 Separadores e «Processar» (Nuno 25/10, 17h37-17h44): ordem Processar, Projectos, Organização, Comunidade; a IPR Cloud
  // deixa de ter separador próprio e abre-se a partir da Organização. «Processar» junta a Base Cartográfica (descarregar ou
  // encomendar, como antes) e a conversão de ficheiros: AutoCAD (DWG, DXF), KML, KMZ, GeoPackage, Shapefile, GeoJSON e GPX,
  // de uns para os outros (m90353 v2 e worker 1.0.26). Nos cartões dos projectos: «Arquivar» e «Juntar à organização» (m90355).
  var API = "/wp-json/tcd/v1/";
  function api(rota, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": window.tcdNonce || "" }, op.headers || {});
    return fetch(API + rota, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j && j.message || ("Erro " + r.status)); return j; }); });
  }
  function esc48(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  (function () {
    if (document.getElementById("ipr-pb-css")) return;
    var st = document.createElement("style"); st.id = "ipr-pb-css";
    st.textContent = ".ipr-pb{height:6px;border-radius:4px;background:var(--ln2,rgba(127,127,127,.2));overflow:hidden;margin:2px 0 6px}.ipr-pb i{display:block;height:100%;background:var(--ac,#9cbf4f);transition:width .6s}" +
      ".ipr-pb.mau i{background:#d9725b}.ipr-pb.fila i{background:var(--mu,#888)}.ipr-pb.vivo i{background-image:linear-gradient(45deg,rgba(255,255,255,.25) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.25) 50%,rgba(255,255,255,.25) 75%,transparent 75%);background-size:14px 14px;animation:iprpb 1s linear infinite}" +
      "@keyframes iprpb{to{background-position:14px 0}}#ipr-conv-res{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font:600 12px Inter,sans-serif;color:var(--mu);margin:8px 0}#ipr-conv-res .vivo{color:var(--ac,#9cbf4f)}#ipr-conv-res .mau{color:#d9725b}" +
      "#ipr-conv-res button{margin-left:auto;font:600 12px Inter,sans-serif;border:1px solid var(--ln);background:transparent;color:var(--tx);border-radius:6px;padding:3px 9px;cursor:pointer}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function separadores() {
    var tabs = document.getElementById("ipe-tabs"); if (!tabs) return false;
    function arrumar() {
      // 25/10, 23h50: só mexe quando a ordem está errada. Antes voltava a pôr os separadores no fim a cada mudança, o que gerava
      // outra mudança, num ciclo de 40 ms: o botão saía e voltava a entrar entre o carregar e o largar, e o clique perdia-se.
      var ordem = ["enc", "proj", "org", "com"], bs = [].slice.call(tabs.querySelectorAll(".ipe-tab"));
      var quero = ordem.map(function (k) { return tabs.querySelector('.ipe-tab[data-tab="' + k + '"]'); }).filter(Boolean).concat(bs.filter(function (b) { return ordem.indexOf(b.dataset.tab) < 0; }));
      var agora = [].slice.call(tabs.querySelectorAll(".ipe-tab"));
      if (quero.some(function (b, i) { return agora[i] !== b; })) quero.forEach(function (b) { tabs.appendChild(b); });
      var enc = tabs.querySelector('.ipe-tab[data-tab="enc"]');
      if (enc && enc.firstChild && enc.firstChild.nodeType === 3 && enc.firstChild.nodeValue !== "Processos") { enc.firstChild.nodeValue = "Processos"; enc.title = "Base Cartográfica e conversão de ficheiros"; }
      var cl = tabs.querySelector('.ipe-tab[data-tab="cloud"]'); if (cl && !cl.hidden) cl.hidden = true;
      var org = document.querySelector('.ipe-pane[data-pane="org"]');
      if (org && cl && !document.getElementById("ipr-org-cloud")) {
        var b = document.createElement("button"); b.type = "button"; b.id = "ipr-org-cloud"; b.className = "ipe-b ipe-b--s";
        b.textContent = "IPR Cloud: projectos partilhados e QField"; b.style.cssText = "margin:8px 0;width:100%";
        b.addEventListener("click", function () { cl.click(); });
        org.insertBefore(b, org.firstChild);
      }
    }
    if (!tabs.__ipr48) { tabs.__ipr48 = 1; new MutationObserver(function () { clearTimeout(arrumar.t); arrumar.t = setTimeout(arrumar, 40); }).observe(tabs, { childList: true }); }
    arrumar();
    return true;
  }

  var FORM_E = [["DWG", "AutoCAD"], ["DXF", "AutoCAD"], ["KML", "Google Earth"], ["KMZ", "Google Earth"], ["GPKG", "GeoPackage"], ["SHP", "Shapefile em .zip"], ["GeoJSON", ""], ["GPX", "GPS"]];
  var FORM_S = [["gpkg", "GeoPackage", "QGIS, com cotas, layers e estilos do AutoCAD"], ["kmz", "KMZ", "Google Earth"], ["kml", "KML", ""], ["shp", "Shapefile", ".zip"], ["dxf", "DXF", "AutoCAD"], ["gpx", "GPX", "GPS"], ["geojson", "GeoJSON", "web"]];
  function processar() {
    var P = document.querySelector('.ipe-pane[data-pane="enc"]'); if (!P) return false;
    if (document.getElementById("ipr-proc-sel")) return true;
    // O Atlas pode redesenhar o painel: se a barra desaparecer, volta a montar-se.
    if (!window.__ipr48w) { window.__ipr48w = setInterval(function () { if (!document.getElementById("ipr-proc-sel")) { try { processar(); } catch (e) {} } }, 2500); }
    var st = document.createElement("style");
    st.textContent = "#ipr-proc-sel{display:flex;gap:4px;margin:4px 0 10px;padding:3px;border:1px solid var(--ln);border-radius:10px;background:var(--p2,transparent)}" +
      "#ipr-proc-sel button{all:unset;box-sizing:border-box;flex:1;text-align:center;padding:7px 6px;border-radius:7px;font:600 12.5px Inter,sans-serif;color:var(--mu);cursor:pointer}" +
      "#ipr-proc-sel button.on{background:var(--ac,#75834a);color:#fff}" +
      "#ipr-conv h3{margin:2px 0 4px;font:600 15px Inter,sans-serif;color:var(--tx)}#ipr-conv .m{font:12.5px/1.45 Inter,sans-serif;color:var(--mu);margin:0 0 8px}" +
      "#ipr-conv .fm{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}#ipr-conv .fm span{font:600 11px 'IBM Plex Mono',monospace;padding:3px 7px;border:1px solid var(--ln);border-radius:20px;color:var(--tx)}" +
      "#ipr-conv .fm span.a{border-color:var(--ac,#75834a);color:var(--ac,#75834a)}#ipr-conv .lb{font:600 11px Inter,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);margin:8px 0 3px}" +
      "#ipr-conv .sai{display:grid;grid-template-columns:1fr 1fr;gap:2px 8px}#ipr-conv .sai label{display:flex;gap:6px;align-items:flex-start;font:12.5px/1.3 Inter,sans-serif;color:var(--tx)}#ipr-conv .sai small{display:block;color:var(--mu);font-size:11px}" +
      "#ipr-conv select{width:100%;font:13px Inter,sans-serif;padding:6px;border:1px solid var(--ln);border-radius:7px;background:var(--p1);color:var(--tx)}" +
      "#ipr-drop{margin:10px 0 6px;border:1.5px dashed var(--ln);border-radius:10px;padding:16px 10px;text-align:center;font:13px Inter,sans-serif;color:var(--mu);cursor:pointer}#ipr-drop.on{border-color:var(--ac,#75834a);color:var(--tx)}" +
      "#ipr-conv-l{list-style:none;margin:8px 0 0;padding:0}#ipr-conv-l li{border:1px solid var(--ln);border-radius:9px;padding:8px 9px;margin:0 0 6px;font:12.5px/1.4 Inter,sans-serif;color:var(--tx)}" +
      "#ipr-conv-l li b{display:block;font-size:13px;word-break:break-all}#ipr-conv-l li .e{color:var(--mu)}#ipr-conv-l li .e.ok{color:#7fae4a}#ipr-conv-l li .e.mau{color:#d9534f}" +
      "#ipr-conv-l li .esc{float:left;margin:1px 7px 0 0}#ipr-conv-ligar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 2px;font:12.5px Inter,sans-serif;color:var(--mu)}#ipr-conv-ligar select{flex:1;min-width:140px;width:auto}#ipr-conv-ligar button{font:600 12px Inter,sans-serif;padding:6px 10px;border:1px solid var(--ac,#75834a);border-radius:7px;background:var(--ac,#75834a);color:#fff;cursor:pointer}" +
      "#ipr-conv-l .ac{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}#ipr-conv-l .ac a,#ipr-conv-l .ac button{font:600 11.5px Inter,sans-serif;padding:4px 8px;border:1px solid var(--ln);border-radius:6px;color:var(--tx);background:transparent;text-decoration:none;cursor:pointer}";
    document.head.appendChild(st);
    var sel = document.createElement("div"); sel.id = "ipr-proc-sel";
    sel.innerHTML = '<button type="button" data-v="base" class="on">Base Cartográfica</button><button type="button" data-v="conv">Converter ficheiros</button>';
    var C = document.createElement("div"); C.id = "ipr-conv"; C.hidden = true;
    var logado = !!window.tcdNonce;
    C.innerHTML = '<h3>Converter ficheiros</h3><p class="m">AutoCAD para SIG e entre formatos, sem perder cotas, layers, cores e tracejados. Desenhos em coordenadas locais são acertados pelo limite de um terreno seu.</p>' +
      '<div class="lb">Entra</div><div class="fm">' + FORM_E.map(function (f) { return '<span class="' + (/DWG|DXF/.test(f[0]) ? "a" : "") + '" title="' + esc48(f[1]) + '">' + f[0] + "</span>"; }).join("") + "</div>" +
      '<div class="lb">Sai</div><div class="sai">' + FORM_S.map(function (f) { return '<label><input type="checkbox" data-sai="' + f[0] + '"' + (/gpkg|kmz|shp/.test(f[0]) ? " checked" : "") + (f[0] === "gpkg" ? " disabled" : "") + "><span>" + f[1] + (f[2] ? "<small>" + esc48(f[2]) + "</small>" : "") + "</span></label>"; }).join("") + "</div>" +
      '<div class="lb">Acertar e guardar em</div><select id="ipr-conv-p"><option value="0">Nenhum projecto (o desenho já tem coordenadas)</option></select>' +
      (logado ? '<div id="ipr-drop" tabindex="0" role="button">Largue aqui o ficheiro ou toque para escolher<br><small>até 300 MB · DWG, DXF, KML, KMZ, GPKG, ZIP, GeoJSON, GPX</small></div><input type="file" id="ipr-conv-f" hidden accept=".dwg,.dxf,.kml,.kmz,.gpkg,.zip,.geojson,.json,.gpx" multiple><div id="ipr-conv-msg" class="m"></div><ul id="ipr-conv-l"></ul>'
        : '<p class="m"><b>Entre na sua conta para converter.</b> A conversão corre nos nossos servidores e os ficheiros ficam só para si.</p>');
    P.insertBefore(C, P.firstChild); P.insertBefore(sel, P.firstChild);
    var atual = "base";
    new MutationObserver(function () { if (atual === "conv") { clearTimeout(ver.t); ver.t = setTimeout(function () { ver("conv", true); }, 30); } }).observe(P, { childList: true });
    function ver(v, so) {
      atual = v;
      [].forEach.call(sel.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.v === v); });
      [].forEach.call(P.children, function (el) { if (el === sel) return; if (el === C) { C.hidden = v !== "conv"; return; } if (v === "conv") { if (!el.hidden) { el.dataset.iprEsc = "1"; el.hidden = true; } } else if (el.dataset.iprEsc) { el.hidden = false; delete el.dataset.iprEsc; } });
      try { localStorage.setItem("ipr_proc_v", v); } catch (e) {}
      if (v === "conv" && !so) { projectos(); if (logado) lista(); }
    }
    sel.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) ver(b.dataset.v); });
    var MEUS = [], ORGP = [];
    // 26/10, 00h28 (Nuno: «não me deixa ligar isto à organização que eu quero»): o «Ligar os escolhidos a» passa a ter os
    // projectos (todos, mesmo antes de o separador Projectos estar desenhado) e as pastas da organização (ex.: 268 Quinta Linda).
    function opcoesLigar() {
      var h = MEUS.length ? '<optgroup label="Projectos">' + opcoes() + "</optgroup>" : "";
      if (ORGP.length) h += '<optgroup label="Pastas da organização">' + ORGP.map(function (o) { return '<option value="' + esc48(o[0]) + '">' + esc48(o[1]) + "</option>"; }).join("") + "</optgroup>";
      return h;
    }
    function colherProj() {
      var lst = [];
      document.querySelectorAll("#ipe-proj .ipe-card").forEach(function (c) {
        var m = /#(\d+)/.exec((c.querySelector(".mono") || {}).textContent || ""); if (!m) return;
        lst.push([m[1], ((c.querySelector(".ipe-ct strong") || {}).textContent || "Terreno").trim()]);
      });
      if (lst.length) juntarMeus(lst);
    }
    // 25/10, 22h55 (Nuno): «devia dar todos os projectos que eu tenho acesso, por ordem alfabética», incluindo os da organização.
    function ordenar() { MEUS.sort(function (a, b) { return a[1].localeCompare(b[1], "pt", { sensitivity: "base" }) || (+a[0] - +b[0]); }); }
    function opcoes() { return MEUS.map(function (p) { return '<option value="' + esc48(p[0]) + '">' + esc48(p[1]) + " · #" + esc48(p[0]) + (p[2] ? " · " + esc48(p[2]) : "") + "</option>"; }).join(""); }
    function juntarMeus(lst) {
      lst.forEach(function (p) { if (!p[0] || MEUS.some(function (x) { return x[0] === p[0]; })) return; MEUS.push(p); });
      ordenar();
      var s = document.getElementById("ipr-conv-p"), g1 = s && s.querySelector("optgroup[data-meus]");
      if (s) { var v = s.value; if (!g1) { g1 = document.createElement("optgroup"); g1.label = "Os meus projectos"; g1.dataset.meus = "1"; s.insertBefore(g1, s.options[0] ? s.options[0].nextSibling : null); } g1.innerHTML = opcoes(); s.value = v; if (s.selectedIndex < 0) s.selectedIndex = 0; }
      var bs = document.querySelector("#ipr-conv-ligar select"); if (bs) { var bv = bs.value; bs.innerHTML = opcoesLigar(); if (bv) bs.value = bv; if (bs.selectedIndex < 0) bs.selectedIndex = 0; }
    }
    var projFeito = false;
    function projectos() {
      var s = document.getElementById("ipr-conv-p"); if (!s) return;
      var lst = [];
      document.querySelectorAll("#ipe-proj .ipe-card").forEach(function (c) {
        var m = /#(\d+)/.exec((c.querySelector(".mono") || {}).textContent || ""); if (!m) return;
        lst.push([m[1], ((c.querySelector(".ipe-ct strong") || {}).textContent || "Terreno").trim()]);
      });
      juntarMeus(lst);
      if (!logado || projFeito) return; projFeito = true;
      // Projectos ligados à organização (Base inteira, acesso partilhado pelo m90355).
      api("org/projectos").then(function (j) {
        var ps = (j && (j.projectos || j.lista)) || (Array.isArray(j) ? j : []);
        juntarMeus(ps.map(function (p) { return [String(p.id || ""), String(p.nome || p.local || "Projecto").trim(), "organização"]; }));
      }).catch(function () {});
      // Grupos de desenhos da organização sem encomenda (só para acertar a posição).
      api("org/grupos-meus").then(function (j) {
        if (!j || !j.org || !j.pode) return; var vistos = {}, ps = [];
        (j.grupos || []).forEach(function (g) { var m = /^(\d+\s[^·]{2,40}?)(?:\s·|$)/.exec((g.nome || "").trim()); if (m && !vistos[m[1]]) { vistos[m[1]] = 1; ps.push(m[1]); } });
        if (!ps.length) return;
        ps.sort(function (a, b) { return a.localeCompare(b, "pt", { sensitivity: "base" }); });
        ORGP = ps.map(function (p) { return ["o:" + j.org + ":" + p, p]; });
        var bl = document.querySelector("#ipr-conv-ligar select"); if (bl) { var blv = bl.value; bl.innerHTML = opcoesLigar(); if (blv) bl.value = blv; if (bl.selectedIndex < 0) bl.selectedIndex = 0; }
        var g2 = document.createElement("optgroup"); g2.label = "Organização · " + (j.nome || "") + " · pastas";
        ps.forEach(function (p) { var o = document.createElement("option"); o.value = "o:" + j.org + ":" + p; o.textContent = p; g2.appendChild(o); });
        s.appendChild(g2);
      }).catch(function () {});
    }
    if (!logado) { try { if (localStorage.getItem("ipr_proc_v") === "conv") ver("conv"); } catch (e) {} return true; }
    var drop = document.getElementById("ipr-drop"), inp = document.getElementById("ipr-conv-f"), msg = document.getElementById("ipr-conv-msg"), L = document.getElementById("ipr-conv-l");
    drop.addEventListener("click", function () { inp.click(); });
    drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("on"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("on"); }); });
    drop.addEventListener("drop", function (e) { enviarVarios(e.dataTransfer.files); });
    inp.addEventListener("change", function () { enviarVarios(inp.files); inp.value = ""; });
    function saidas() { return [].map.call(C.querySelectorAll("[data-sai]:checked"), function (c) { return c.dataset.sai; }).concat(["gpkg", "geojson"]).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(","); }
    function sha(buf) { return crypto.subtle.digest("SHA-256", buf).then(function (h) { return [].map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }); }
    function enviarVarios(fs) { var a = [].slice.call(fs || []); (function um() { var f = a.shift(); if (f) enviar(f).then(um, um); })(); }
    function enviar(f) {
      var PARTE = 8 * 1048576, n = Math.max(1, Math.ceil(f.size / PARTE)), proj = document.getElementById("ipr-conv-p").value;
      if (f.size > 300 * 1048576) { msg.textContent = f.name + ": acima de 300 MB."; return Promise.resolve(); }
      msg.textContent = "A preparar " + f.name + "…";
      return f.arrayBuffer().then(sha).then(function (h) {
        var i = 0;
        function parte() {
          var og = /^o:(\d+):(.+)$/.exec(proj), pj = og ? "0" : proj;
          var q = "carregar/parte?projecto=" + encodeURIComponent(pj) + "&alinhar=" + encodeURIComponent(pj) + (og ? "&org=" + og[1] + "&orgproj=" + encodeURIComponent(og[2]) : "") + "&nome=" + encodeURIComponent(f.name) + "&parte=" + i + "&partes=" + n + "&tamanho=" + f.size + "&saida=" + saidas() + (i === n - 1 ? "&sha256=" + h : "");
          msg.textContent = "A enviar " + f.name + (n > 1 ? " (" + (i + 1) + " de " + n + ")" : "") + "…";
          return api(q, { method: "POST", body: f.slice(i * PARTE, (i + 1) * PARTE), headers: { "Content-Type": "application/octet-stream" } }).then(function (j) { i++; return i < n ? parte() : j; });
        }
        return parte();
      }).then(function () { msg.textContent = f.name + ": na fila. A conversão de um AutoCAD demora um a dois minutos."; lista(); }).catch(function (e) { msg.textContent = f.name + ": " + e.message; });
    }
    var EST = { fila: "Na fila", converter: "A converter…", pronto: "Pronto", erro: "Não converteu", georref: "Sem posição" }, rel = 0;
    function lista() {
      api("carregar/meus").then(function (j) {
        var fs = j.ficheiros || []; window.__iprConvFs = fs;
        L.innerHTML = fs.slice(0, 60).map(function (x) {
          var ac = FORM_S.filter(function (f) { return x[f[0]]; }).map(function (f) { return '<a href="' + esc48(x[f[0]]) + (f[0] === "geojson" ? "&dl=1" : "") + '" download>' + f[1] + "</a>"; }).join("");
          if (x.geojson) ac = '<button type="button" data-mapa="' + x.id + '">Ver no mapa</button>' + ac + '<button type="button" data-org="' + x.id + '">Juntar à organização</button>';
          // 26/10, 00h40 (Nuno): só se convertem plantas; o worker 1.0.34 recusa cortes, alçados e pormenores («Recusado: …»).
          var rec = x.estado === "erro" && /^Recusado/.test(x.msg || "");
          if (x.estado === "georref" && !rec) ac = '<button type="button" data-rep="' + x.id + '" title="Experimenta PT-TM06, Datum 73, Datum Lisboa (coordenadas militares), UTM 29N/30N e WGS84 e fica com o que põe o desenho em cima do terreno">Detectar sistema de coordenadas</button>' + ac;
          else if (x.estado === "erro" && !rec) ac = '<button type="button" data-rep="' + x.id + '">Tentar outra vez</button>' + ac;
          // 26/10, 08h17 (Nuno: «quero sempre as coisas no sítio certo»): desenhos sem posição posicionam-se à mão no mapa.
          if (x.info && x.info.local && (x.estado === "georref" || x.estado === "pronto")) ac = '<button type="button" data-pos="' + x.id + '">Posicionar no mapa</button>' + ac;
          ac += '<button type="button" data-lixo="' + x.id + '">Apagar</button>';
          var cls = x.estado === "pronto" ? "ok" : (x.estado === "erro" || x.estado === "georref") ? "mau" : "";
          // 26/10, 00h05 (Nuno): uma barra de progresso em cada processo (worker 1.0.31 envia info.passo / info.passos).
          var inf = x.info || {}, pc = x.estado === "pronto" ? 100 : x.estado === "converter" ? Math.max(8, Math.round(100 * (+inf.passo || 1) / (+inf.passos || 6))) : x.estado === "fila" ? 3 : 100;
          var barra = '<div class="ipr-pb ' + (x.estado === "converter" ? "vivo" : x.estado === "fila" ? "fila" : cls) + '"><i style="width:' + pc + '%"></i></div>' +
            (x.estado === "converter" ? '<div class="e">' + esc48(inf.fase || x.msg || "A converter") + " · passo " + (+inf.passo || 1) + " de " + (+inf.passos || 6) + (inf.seg ? " · " + inf.seg + " s" : "") + "</div>" : x.estado === "fila" ? '<div class="e">À espera de vez (' + (fs.filter(function (y) { return y.estado === "fila" && y.id < x.id; }).length + 1) + ".º da sua fila)</div>" : "");
          return '<li>' + barra.replace(/^/, "") + (x.estado === "pronto" ? '<label class="esc"><input type="checkbox" data-esc="' + x.id + '"> </label>' : "") + '<b>' + esc48(x.nome) + '</b><span class="e ' + cls + '">' + esc48(rec ? "Recusado: não é planta" : (EST[x.estado] || x.estado)) + (x.enc ? " · #" + x.enc : "") + "</span>" + (x.msg && x.estado !== "fila" ? '<div class="e">' + esc48(x.msg) + "</div>" : "") + '<div class="ac">' + ac + "</div></li>";
        }).join("") || '<li class="e">Ainda não converteu nenhum ficheiro.</li>';
        // 25/10, 19h44 (Nuno): escolher ficheiros convertidos e ligá-los a um projecto.
        var nF = fs.filter(function (x) { return x.estado === "fila"; }).length, nC = fs.filter(function (x) { return x.estado === "converter"; }).length, nP = fs.filter(function (x) { return x.estado === "pronto"; }).length, nE = fs.filter(function (x) { return (x.estado === "erro" && !/^Recusado/.test(x.msg || "")) || x.estado === "georref"; }).length, nR = fs.filter(function (x) { return x.estado === "erro" && /^Recusado/.test(x.msg || ""); }).length;
        var res = document.getElementById("ipr-conv-res");
        if (!res) { res = document.createElement("div"); res.id = "ipr-conv-res"; L.parentNode.insertBefore(res, L); }
        res.innerHTML = '<span class="' + (nC ? "vivo" : "") + '">' + (nC ? "● A converter agora: " + nC : "○ Nada a converter neste momento") + "</span><span>Na fila: " + nF + "</span><span>Prontos: " + nP + "</span>" + (nE ? '<span class="mau">Com erro: ' + nE + "</span>" : "") + (nR ? '<span class="mau" title="Não são plantas: vão para o lixo em 24 horas">Recusados: ' + nR + "</span>" : "") + '<button type="button" id="ipr-conv-act">Actualizar</button>';
        res.querySelector("#ipr-conv-act").onclick = function () { lista(); };
        var bar = document.getElementById("ipr-conv-ligar");
        if (fs.some(function (x) { return x.estado === "pronto"; })) {
          if (!bar) { bar = document.createElement("div"); bar.id = "ipr-conv-ligar"; L.parentNode.insertBefore(bar, L); }
          var bvAnt = bar.querySelector("select") ? bar.querySelector("select").value : "";
          colherProj();
          bar.innerHTML = '<span>Ligar os escolhidos a</span><select>' + opcoesLigar() + '</select><button type="button">Ligar</button>';
          if (bvAnt) { bar.querySelector("select").value = bvAnt; if (bar.querySelector("select").selectedIndex < 0) bar.querySelector("select").selectedIndex = 0; }
          bar.querySelector("button").onclick = function () {
            var ids = [].map.call(L.querySelectorAll("[data-esc]:checked"), function (c) { return +c.dataset.esc; }), sv = bar.querySelector("select").value, og = /^o:(\d+):(.+)$/.exec(sv), pj = og ? 0 : +sv;
            if (!ids.length) { msg.textContent = "Escolha primeiro os ficheiros (caixa à esquerda do nome)."; return; }
            if (!pj && !og) { msg.textContent = "Não tem projectos para ligar."; return; }
            var corpo = og ? { ids: ids, org: +og[1], orgproj: og[2] } : { ids: ids, projecto: pj };
            msg.textContent = "A ligar…";
            api("carregar/ligar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }).then(function (j) {
              msg.textContent = og ? (j.n || 0) + " ficheiro(s) copiado(s) para «" + og[2] + " › AutoCADs» na organização." + (j.erros && j.erros.length ? " Falhou: " + j.erros.join("; ") : "") : (j.n || 0) + " ficheiro(s) ligado(s) ao projecto #" + pj + ".";
              lista();
            }, function (x) { msg.textContent = x.message; });
          };
        } else if (bar) bar.remove();
        clearTimeout(rel); if (fs.some(function (x) { return x.estado === "fila" || x.estado === "converter"; })) rel = setTimeout(lista, 8000);
      }).catch(function (e) { L.innerHTML = '<li class="e mau">' + esc48(e.message) + "</li>"; });
    }
    // Posicionar à mão: escolher um ponto no desenho e o mesmo sítio no mapa, pelo menos duas vezes (escala, rotação e
    // deslocação calculadas pelo worker 1.0.36). Painel flutuante por cima do mapa; o mapa continua a mexer-se.
    function posicionar(id) {
      var x = (window.__iprConvFs || []).filter(function (f) { return +f.id === +id; })[0], pv = x && x.info && x.info.local, M = mapa();
      if (!pv || !M) { msg.textContent = "Sem prévia do desenho: carregue-o outra vez para o posicionar."; return; }
      var velho = document.getElementById("ipr-pos"); if (velho) velho.__fechar();
      if (!document.getElementById("ipr-pos-css")) { var st = document.createElement("style"); st.id = "ipr-pos-css"; st.textContent = "#ipr-pos{position:fixed;right:16px;bottom:16px;z-index:100002;width:min(380px,calc(100vw - 32px));background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#333);border-radius:12px;padding:12px;font:13px Inter,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:8px}#ipr-pos svg{width:100%;height:240px;background:#f6f4ec;border-radius:8px;cursor:crosshair}#ipr-pos .p{font-size:12px;color:var(--mu,#9aa08f)}#ipr-pos .a{display:flex;gap:8px;justify-content:flex-end}#ipr-pos button{font:600 12.5px Inter,sans-serif;padding:7px 12px;border-radius:8px;border:1px solid var(--ln,#333);background:transparent;color:var(--tx,#e9eadf);cursor:pointer}#ipr-pos button.ok{background:var(--ac,#b5c46a);color:#141814;border-color:var(--ac,#b5c46a)}#ipr-pos button:disabled{opacity:.45;cursor:default}"; document.head.appendChild(st); }
      var b0 = pv.bbox, W = 360, H = 240, sx = W / Math.max(1e-9, b0[2] - b0[0]), sy = H / Math.max(1e-9, b0[3] - b0[1]), k = Math.min(sx, sy) * 0.94;
      var ox = (W - (b0[2] - b0[0]) * k) / 2, oy = (H - (b0[3] - b0[1]) * k) / 2;
      function aS(px, py) { return [ox + (px - b0[0]) * k, H - oy - (py - b0[1]) * k]; }
      function deS(sx2, sy2) { return [b0[0] + (sx2 - ox) / k, b0[1] + (H - oy - sy2) / k]; }
      var linhas = pv.l.map(function (l) { var d = ""; for (var i = 0; i < l.length; i += 2) { var q = aS(l[i], l[i + 1]); d += (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); } return d; }).join("");
      var P = document.createElement("div"); P.id = "ipr-pos";
      P.innerHTML = '<b>Posicionar «' + esc48(x.nome) + '»</b><div class="p"></div><svg viewBox="0 0 ' + W + " " + H + '"><path d="' + linhas + '" fill="none" stroke="#3d3a33" stroke-width=".6"/><g class="m"></g></svg><div class="p l"></div><div class="a"><button type="button" data-a="desfazer">Desfazer</button><button type="button" data-a="x">Cancelar</button><button type="button" class="ok" data-a="ok" disabled>Aplicar posição</button></div>';
      document.body.appendChild(P);
      var pares = [], espera = null, marcas = [], G = P.querySelector("g.m"), INS = P.querySelector(".p"), LS = P.querySelector(".l");
      function cor(i) { return ["#d0482c", "#2f6f8f", "#4f6b3a", "#8a5a9e", "#c27a3a", "#3d3a33"][i % 6]; }
      function desenhar() {
        G.innerHTML = pares.map(function (p, i) { var q = aS(p[0], p[1]); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="4" fill="' + cor(i) + '"/><text x="' + (q[0] + 6) + '" y="' + (q[1] - 5) + '" font-size="11" fill="' + cor(i) + '">' + (i + 1) + "</text>"; }).join("") + (espera ? '<circle cx="' + aS(espera[0], espera[1])[0] + '" cy="' + aS(espera[0], espera[1])[1] + '" r="5" fill="none" stroke="#d0482c" stroke-width="2"/>' : "");
        INS.textContent = espera ? "Agora clique no mesmo sítio no mapa (ponto " + (pares.length + 1) + ")." : "Clique num ponto bem reconhecível do desenho (um canto do edifício, um cruzamento de muros) e depois no mesmo sítio no mapa. Pelo menos dois pontos, afastados um do outro.";
        LS.textContent = pares.length ? pares.length + " ponto(s) marcado(s)." + (pares.length < 2 ? " Falta pelo menos mais um." : " Pode aplicar, ou marcar mais para afinar.") : "";
        P.querySelector('[data-a="ok"]').disabled = pares.length < 2;
      }
      function noMapa(ev) {
        if (!espera) return;
        var ll = ev.lngLat; pares.push([espera[0], espera[1], +ll.lng.toFixed(7), +ll.lat.toFixed(7)]); espera = null;
        try { var el = document.createElement("div"); el.style.cssText = "width:12px;height:12px;border-radius:50%;border:2px solid #fff;background:" + cor(pares.length - 1); marcas.push(new window.maplibregl.Marker({ element: el }).setLngLat(ll).addTo(M)); } catch (e2) {}
        M.getCanvas().style.cursor = ""; desenhar();
      }
      M.on("click", noMapa);
      P.querySelector("svg").addEventListener("click", function (ev) {
        var r = this.getBoundingClientRect(), q = deS((ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height);
        espera = q; M.getCanvas().style.cursor = "crosshair"; desenhar();
      });
      P.__fechar = function () { M.off("click", noMapa); marcas.forEach(function (m) { try { m.remove(); } catch (e3) {} }); M.getCanvas().style.cursor = ""; P.remove(); };
      P.addEventListener("click", function (ev) {
        var a = ev.target.dataset && ev.target.dataset.a; if (!a) return;
        if (a === "x") { P.__fechar(); return; }
        if (a === "desfazer") { if (espera) espera = null; else if (pares.length) { pares.pop(); var mk = marcas.pop(); if (mk) mk.remove(); } desenhar(); return; }
        if (a === "ok") {
          ev.target.disabled = true; INS.textContent = "A enviar a posição…";
          api("carregar/posicionar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: +id, pontos: pares }) }).then(function (j) {
            P.__fechar(); msg.textContent = "«" + x.nome + "» na fila com a posição marcada (" + (j.n || pares.length) + " pontos). Fica pronto em um a dois minutos."; lista();
          }, function (e4) { INS.textContent = e4.message; ev.target.disabled = false; });
        }
      });
      desenhar();
    }
    L.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.pos) { posicionar(+b.dataset.pos); return; }
      if (b.dataset.rep) { b.disabled = true; api("carregar/repetir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: +b.dataset.rep }) }).then(lista, function (x) { msg.textContent = x.message; b.disabled = false; }); }
      if (b.dataset.lixo) { b.disabled = true; api("carregar/apagar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: +b.dataset.lixo }) }).then(lista, function (x) { msg.textContent = x.message; }); }
      if (b.dataset.org) { b.disabled = true; api("org/juntar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ficheiro: +b.dataset.org }) }).then(function (j) { msg.textContent = j.m || "Juntado à organização."; }, function (x) { msg.textContent = x.message; b.disabled = false; }); }
      if (b.dataset.mapa) mostrar(+b.dataset.mapa, b);
    });
    function mostrar(id, b) {
      var m = window.__ipe && window.__ipe.mapa; if (!m) return;
      var sid = "ipr-conv-" + id;
      if (m.getSource(sid)) { ["-l", "-a", "-p"].forEach(function (s) { if (m.getLayer(sid + s)) m.removeLayer(sid + s); }); m.removeSource(sid); b.textContent = "Ver no mapa"; return; }
      b.textContent = "A carregar…";
      fetch(API + "carregar/f?id=" + id + "&k=geojson", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.json(); }).then(function (gj) {
        m.addSource(sid, { type: "geojson", data: gj });
        var cor = ["coalesce", ["get", "cor"], "#ff9a3c"];
        m.addLayer({ id: sid + "-a", type: "fill", source: sid, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": cor, "fill-opacity": 0.25 } });
        m.addLayer({ id: sid + "-l", type: "line", source: sid, filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": cor, "line-width": 1.2 } });
        m.addLayer({ id: sid + "-p", type: "circle", source: sid, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": cor, "circle-radius": 2.5 } });
        var bb = [180, 90, -180, -90]; (function per(c) { if (typeof c[0] === "number") { bb[0] = Math.min(bb[0], c[0]); bb[1] = Math.min(bb[1], c[1]); bb[2] = Math.max(bb[2], c[0]); bb[3] = Math.max(bb[3], c[1]); } else c.forEach(per); })((gj.features || []).map(function (f) { return f.geometry ? f.geometry.coordinates : []; }));
        if (bb[0] < bb[2]) m.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 40, duration: 900 });
        b.textContent = "Tirar do mapa";
      }).catch(function () { b.textContent = "Ver no mapa"; msg.textContent = "Não foi possível abrir no mapa."; });
    }
    try { if (localStorage.getItem("ipr_proc_v") === "conv") ver("conv"); } catch (e) {}
    return true;
  }

  // Cartões dos projectos: «Arquivar» (esconde da lista, não apaga nada) e «Juntar à organização» (limite do terreno).
  // §49 Teste das camadas também com as camadas mundiais e europeias (Nuno 25/10, 18h20: «quando estou no mundo [...] o teste
  // das camadas vai incluir as globais»). Antes de o app.js montar o diagnóstico, junta ao catálogo, só durante esse instante,
  // as camadas do grupo Mundo (mundo-camadas.js) e as europeias do país do centro do mapa (eu-camadas.js; com o mapa muito
  // afastado, as de todos os países). Cada uma é pedida numa tesela no centro do mapa, ao nível de zoom em que existe.
  function diagMundo() {
    if (window.__iprDiagMundo) return true; window.__iprDiagMundo = 1;
    var W = 20037508.342789244;
    function tesela(url, z, lng, lat) {
      var n = Math.pow(2, z), x = Math.floor((lng + 180) / 360 * n), r = lat * Math.PI / 180;
      var y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); x = Math.max(0, Math.min(n - 1, x)); y = Math.max(0, Math.min(n - 1, y));
      var t = 2 * W / n, bb = [-W + x * t, W - (y + 1) * t, -W + (x + 1) * t, W - y * t].map(function (v) { return v.toFixed(2); }).join(",");
      return url.replace("{bbox-epsg-3857}", bb).replace("{z}", z).replace("{x}", x).replace("{y}", y).replace("{-y}", n - 1 - y);
    }
    function extra() {
      var I = window.__ipe && window.__ipe.mapa, c = I ? I.getCenter() : { lng: -8, lat: 39.5 }, zm = I ? I.getZoom() : 6, out = [], vistos = {};
      function junta(it, grupo) {
        if (!it || !it.id || vistos[it.id]) return; vistos[it.id] = 1;
        if (it.vec || it.tipo === "vector") { out.push({ id: "dgx-" + it.id, n: it.nome, g: grupo, fonte: it.attr || "", t: "omtbase" }); return; }
        if (!it.url || typeof it.url !== "string") return;
        var z = Math.max(it.min || 0, Math.min(it.max == null ? 10 : it.max, Math.max(4, Math.min(12, Math.round(zm)))));
        out.push({ id: "dgx-" + it.id, n: it.nome, g: grupo, fonte: (it.attr || "").replace(/<[^>]+>/g, ""), t: "xyz", url: tesela(it.url, z, c.lng, c.lat) });
      }
      var M = window.__tcdMundoCamadas; if (M && M.CAT) M.CAT.forEach(function (g) { (g[1] || []).forEach(function (it) { junta(it, "Mundo · " + g[0]); }); });
      var E = window.__tcdEuCamadas;
      if (E && E.itens) {
        var cc = E.pais ? E.pais(c.lng, c.lat) : "", lista = cc ? [cc] : (zm < 5 && E.CAT ? Object.keys(E.CAT) : []);
        lista.forEach(function (k) { E.itens(k).forEach(function (it) { junta(it, "Europa · " + k); }); });
        if (!lista.length && E.COMUM) E.COMUM.forEach(function (it) { junta(it, "Europa"); });
      }
      return out;
    }
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest('[data-cfga="diag"]'); if (!b || !window.IPRViz || !Array.isArray(IPRViz.catalogo)) return;
      var cat = IPRViz.catalogo, n = cat.length, x = [];
      try { x = extra(); } catch (er) { x = []; }
      if (!x.length) return;
      Array.prototype.push.apply(cat, x);
      setTimeout(function () { if (cat.length >= n + x.length) cat.splice(n, x.length); }, 0);
    }, true);
    return true;
  }

  // §50 Camadas de outro país fora do sítio (Nuno 25/10, 19h00: «que camada é esta?»). As camadas de Espanha, França e dos
  // outros países europeus ficam ligadas de uma visita para a outra, mas o seu grupo só aparece com o mapa nesse país: o
  // «Mapa IGN Base» de Espanha, por exemplo, ficava por cima de Portugal sem caixa à vista para o desligar. Agora cada uma só
  // se vê com o centro do mapa no seu país; volta a aparecer sozinha quando se regressa lá. Não desliga nada nem mexe nos módulos.
  function foraDoPais() {
    var m = window.__ipe && window.__ipe.mapa; if (!m || !m.getStyle || !m.getCenter) return false;
    function regras() {
      var r = [], c = m.getCenter(), x = c.lng, y = c.lat;
      [window.__tcdEsCamadas, window.__tcdFrCamadas].forEach(function (P) {
        if (!P || !P.CAT || !P.dentro) return; var em = false; try { em = !!P.dentro(x, y); } catch (e) {}
        P.CAT.forEach(function (g) { (g.itens || []).forEach(function (it) { r.push([it.id, em]); }); });
      });
      var E = window.__tcdEuCamadas;
      if (E && E.CAT) {
        var cc = ""; try { cc = E.pais ? E.pais(x, y) : ""; } catch (e) {}
        Object.keys(E.CAT).forEach(function (k) { E.CAT[k].forEach(function (g) { (g[1] || []).forEach(function (it) { r.push([it.id, k === cc]); }); }); });
        (E.COMUM || []).forEach(function (it) { r.push([it.id, !!cc]); });
      }
      return r;
    }
    function aplicar() {
      var st = m.getStyle(); if (!st || !st.layers) return; var R = regras(); if (!R.length) return;
      st.layers.forEach(function (l) {
        for (var i = 0; i < R.length; i++) {
          var id = R[i][0]; if (l.id !== id && l.id.indexOf(id + "-") !== 0) continue;
          var v = R[i][1] ? "visible" : "none";
          try { if ((m.getLayoutProperty(l.id, "visibility") || "visible") !== v) m.setLayoutProperty(l.id, "visibility", v); } catch (e) {}
          break;
        }
      });
    }
    var t = 0; function depois() { clearTimeout(t); t = setTimeout(aplicar, 80); }
    m.on("moveend", depois); m.on("styledata", depois); aplicar();
    return true;
  }

  // §51 Subpastas nas categorias de camadas (Nuno 25/10, 19h32: «as camadas à esquerda mais subdivididas [...] a água dá para
  // ter várias subcategorias, nas condicionantes também [...] isso devia ser tudo subcategorias»). Os subtítulos que o
  // camadas.js já desenha (Superficial, Subterrânea, Pontos de água, Propriedade, Limites administrativos…) passam a pastas
  // que se abrem e fecham, com o número de camadas e de ligadas. Abrem-se sozinhas quando têm camadas ligadas; o estado
  // fica guardado neste aparelho. Não muda as camadas nem os interruptores.
  // §52 Organização como espelho do Drive (Nuno 25/10, 19h28 e 20h03): primeiro o nome da organização, depois só a lista
  // dos projectos por ordem do número (os da organização e os da IPR Cloud), cada um na sua pasta. Dentro, as secções
  // como no Drive: Análise, Projecto Terracrua Design (com as subpastas), AutoCADs. Quinta Linda e Santa Comba Dão em
  // pastas separadas. Desenha-se a partir dos dados do org.js (window.tcdOrg.dados()), não do HTML dele.
  function orgVista() {
    var P = document.querySelector('.ipe-pane[data-pane="org"]'); if (!P || !window.tcdOrg) return false;
    if (window.__iprOrgV) return true; window.__iprOrgV = 1; window.__iprOrgP = 1; // o §36 antigo deixa de mexer aqui
    var st = document.createElement("style");
    st.textContent = "#ipr-orgv{font:13px Inter,sans-serif;color:var(--tx)}" +
      "#ipr-orgv .ov-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 0 10px;border-bottom:1px solid var(--ln2,rgba(127,127,127,.25));margin-bottom:10px}" +
      "#ipr-orgv .ov-cab h3{margin:0;font:700 15px Inter,sans-serif;letter-spacing:.01em}#ipr-orgv .ov-cab small{display:block;font:500 11px Inter,sans-serif;color:var(--mu);margin-top:2px}" +
      "#ipr-orgv .ov-cab a{font-size:12px;color:var(--ac2,#75834a);white-space:nowrap}#ipr-orgv .ov-lbl{font:600 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);margin:4px 0 6px}" +
      "#ipr-orgv details{border:1px solid var(--ln2,rgba(127,127,127,.25));border-radius:10px;margin:0 0 6px;overflow:hidden}" +
      "#ipr-orgv details details{border:0;border-top:1px solid var(--ln2,rgba(127,127,127,.18));border-radius:0;margin:0}" +
      "#ipr-orgv summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:9px 10px;font-weight:600}" +
      "#ipr-orgv summary::-webkit-details-marker{display:none}#ipr-orgv summary:before{content:'';width:6px;height:6px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(-45deg);opacity:.6;flex:none;transition:transform .15s}" +
      "#ipr-orgv details[open]>summary:before{transform:rotate(45deg)}#ipr-orgv .ov-p>summary{background:var(--p3,rgba(127,127,127,.07))}" +
      "#ipr-orgv summary em{font-style:normal;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ipr-orgv summary small{font:500 11px Inter,sans-serif;color:var(--mu);white-space:nowrap}" +
      "#ipr-orgv .ov-p>summary{flex-wrap:wrap;row-gap:2px}#ipr-orgv .ov-p>summary em{white-space:normal;flex:1 1 9em;min-width:9em}#ipr-orgv .ov-p>summary small{flex:1 0 100%;padding-left:14px;white-space:normal}#ipr-orgv .ov-p>summary b{font:700 12px Inter,sans-serif;color:var(--mu);min-width:38px}#ipr-orgv .ov-s>summary{font-weight:500;padding-left:18px}#ipr-orgv .ov-s .ov-s>summary{padding-left:30px}" +
      "#ipr-orgv .ov-c{display:flex;align-items:center;gap:8px;padding:5px 8px 5px 30px;border-top:1px solid var(--ln2,rgba(127,127,127,.12))}#ipr-orgv .ov-s .ov-s .ov-c{padding-left:42px}" +
      "#ipr-orgv .ov-c label{flex:1;min-width:0;display:flex;gap:8px;align-items:center;cursor:pointer}#ipr-orgv .ov-c label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#ipr-orgv .ov-c small{color:var(--mu);white-space:nowrap;font-size:11px}#ipr-orgv button.ov-z{font:12px Inter,sans-serif;border:1px solid var(--ln);background:var(--p3);color:var(--ac2);border-radius:6px;padding:2px 7px;cursor:pointer}" +
      "#ipr-orgv .ov-acc{display:flex;flex-wrap:wrap;gap:6px;padding:6px 10px 9px}#ipr-orgv .ov-acc button{font:12px Inter,sans-serif;border:1px solid var(--ln);background:transparent;color:var(--ac2,#75834a);border-radius:99px;padding:3px 10px;cursor:pointer}" +
      "#ipr-orgv .ov-vz{padding:5px 8px 7px 30px;color:var(--mu);font-size:12px}#ipr-orgv .ov-cl{font:500 10.5px Inter,sans-serif;border:1px solid var(--ln);border-radius:99px;padding:0 6px;color:var(--mu)}" +
      "#ipr-orgv i.ov-cor{width:9px;height:9px;border-radius:50%;flex:none}";
    document.head.appendChild(st);
    var EST = {}; try { EST = JSON.parse(localStorage.getItem("ipr_org_vista") || "{}") || {}; } catch (e) {}
    function guardar() { try { localStorage.setItem("ipr_org_vista", JSON.stringify(EST)); } catch (e) {} }
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function nf(x) { return Number(x || 0).toLocaleString("pt-PT"); }
    var cloud = null, ligadas = {}, bases = null;
    // 25/10, 21h19 (Nuno): os projectos juntados à organização levam a Base cartográfica inteira, sem cópias (m90355).
    try { fetch("/wp-json/tcd/v1/org/projectos", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { bases = (j && j.projectos) || []; desenhar(); }).catch(function () { bases = []; }); } catch (e) { bases = []; }
    try { fetch("/wp-json/tcd/v1/cloud/meus", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { cloud = (j && (j.terrenos || j)) || []; if (!Array.isArray(cloud)) cloud = []; desenhar(); }).catch(function () { cloud = []; }); } catch (e) { cloud = []; }
    function num(s) { var m = /^(\d{2,6})(\s|$)/.exec(String(s || "").trim()); return m ? m[1] : ""; }
    function sobrepoe(a, b) { return a && b && a.length === 4 && b.length === 4 && a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]; }
    function detalhe(cls, k, html, porOmissao) { var abre = k in EST ? EST[k] : porOmissao; return '<details class="' + cls + '" data-k="' + esc(k) + '"' + (abre ? " open" : "") + "><summary>" + html + "</summary>"; }
    function contas(cs) { var l = cs.filter(function (c) { return ligadas[c.id]; }).length; return cs.length + (cs.length === 1 ? " camada" : " camadas") + (l ? " · " + l + " ligada" + (l > 1 ? "s" : "") : ""); }
    function linha(c, prefixo) {
      var nome = c.nome; if (prefixo && nome.indexOf(prefixo + " · ") === 0) nome = nome.slice(prefixo.length + 3);
      return '<div class="ov-c"><label title="' + esc(c.nome) + '"><input type="checkbox" data-ov-c="' + c.id + '"' + (ligadas[c.id] ? " checked" : "") + '><span>' + esc(nome) + "</span></label><small>" + nf(c.n) + (c.ha > 0 ? " · " + nf(Math.round(c.ha * 10) / 10) + " ha" : "") + '</small><button type="button" class="ov-z" data-ov-z="' + c.id + '" title="Ajustar o mapa a esta camada">⤢</button></div>';
    }
    var ORD = { "análise": 0, "analise": 0, "projecto terracrua design": 1, "projeto terracrua design": 1, "autocads": 2, "autocad": 2 };
    // 26/10, 01h14 (Nuno): três partes fixas em cada projecto: 1 · Análise (Base Cartográfica), 2 · Projecto Terracrua Design,
    // 3 · Outros documentos (só as plantas de AutoCAD). Só muda o nome mostrado; os grupos ficam como estão.
    var SECN = { 0: "1 · Análise", 1: "2 · Projecto Terracrua Design", 2: "3 · Outros documentos" };
    function secNome(k) { var o = ORD[String(k).toLowerCase()]; return o == null ? k : SECN[o]; }
    function desenhar() {
      var d = window.tcdOrg.dados && window.tcdOrg.dados(); if (!d || !d.org) return;
      var gs = d.grupos || [], cs = d.camadas || [], projs = {}, outros = [];
      gs.forEach(function (g) {
        var m = /^(\d{2,6})\s+(.+?)(?:\s·\s(.+))?$/.exec(g.nome || ""), camadas = cs.filter(function (c) { return c.grupo === g.id; });
        if (!m) { if (camadas.length) outros.push({ g: g, cs: camadas }); return; }
        var k = m[1]; if (!projs[k]) projs[k] = { num: k, nome: m[2], prefixo: m[1] + " " + m[2], secs: [], cs: [], cor: g.cor };
        var p = projs[k]; camadas.forEach(function (c) { p.cs.push(c); });
        var resto = m[3] ? m[3].split(" · ") : [];
        p.secs.push({ sec: resto[0] || "", sub: resto.slice(1).join(" · "), g: g, cs: camadas });
      });
      (bases || []).forEach(function (b) {
        var k = String(b.id); if (!projs[k]) projs[k] = { num: k, nome: String(b.nome || "").replace(/^\d+\s+/, "") || ("Projecto " + k), prefixo: "", secs: [], cs: [], cor: "#ff9a3c" };
        projs[k].base = b;
      });
      (cloud || []).forEach(function (t) {
        var n2 = num(t.nome) || num(t.codigo) || ""; var alvo = n2 && projs[n2];
        if (!alvo) Object.keys(projs).some(function (k) { if (projs[k].cs.some(function (c) { return sobrepoe(c.bbox, t.bbox); }) || (projs[k].base && sobrepoe(projs[k].base.bbox, t.bbox))) { alvo = projs[k]; return true; } });
        if (alvo) { alvo.cloud = t; return; }
        var k = n2 || "c:" + (t.codigo || t.nome); var nm = String(t.nome || "").trim() || String(t.local || "").split(",")[0].replace(/\(pelo mapa\)/, "").trim() || String(t.codigo || "Projecto na Cloud"); projs[k] = { num: n2, nome: n2 ? nm.replace(/^\d+\s+/, "") : nm, prefixo: "", secs: [], cs: [], cloud: t, soCloud: 1 };
      });
      var lista = Object.keys(projs).map(function (k) { return projs[k]; }).sort(function (a, b) { var x = a.num ? +a.num : 1e9, y = b.num ? +b.num : 1e9; return x - y || String(a.nome).localeCompare(String(b.nome), "pt"); });
      var O = window.IPR_ORGS, h = '<div class="ov-cab"><div>';
      if (O && O.lista && O.lista.length > 1) { h += '<select class="ipr-orgsel" aria-label="Organização activa">' + O.lista.map(function (o) { return '<option value="' + esc(o.id) + '"' + (+o.id === +O.activa ? " selected" : "") + ">" + esc(o.nome) + "</option>"; }).join("") + "</select>"; }
      else h += "<h3>" + esc(d.org.nome) + "</h3>";
      h += "<small>" + lista.length + (lista.length === 1 ? " projecto" : " projectos") + (d.org.estado === "activa" ? "" : " · só leitura") + '</small></div><a href="/oficina/#camadas">Gerir na Oficina</a></div>';
      h += '<div class="ov-lbl">Projectos</div>';
      if (!lista.length) h += '<div class="ipe-vazio">Ainda não há projectos nesta organização.</div>';
      lista.forEach(function (p) {
        var t = p.cloud, sub = (p.base ? "Base cartográfica completa" + (p.cs.length ? " · " + contas(p.cs) : "") : "") || (p.cs.length ? contas(p.cs) : "") || (t && t.local ? esc(t.local) : "");
        var nomeCloud = t && t.nome && String(t.nome).replace(/^\d+\s+/, "") !== p.nome ? " · " + String(t.nome).replace(/^\d+\s+/, "") : "";
        h += detalhe("ov-p", "p:" + (p.num || p.nome), (p.num ? "<b>" + esc(p.num) + "</b>" : "") + "<em>" + esc(p.nome + nomeCloud) + "</em>" + (p.base ? '<span class="ov-cl" title="Base cartográfica do projecto, uma só cópia partilhada">Base</span>' : "") + (t ? '<span class="ov-cl" title="Está na IPR Cloud">Cloud</span>' : "") + "<small>" + sub + "</small>", false);
        h += '<div class="ov-acc">' + (p.base ? '<button type="button" data-ov-base="' + esc(p.base.id) + '">Abrir a Base cartográfica</button>' : "") + (p.cs.length || (t && t.bbox) || (p.base && p.base.bbox) ? '<button type="button" data-ov-ir="' + esc(p.num || p.nome) + '">Ir para o terreno</button>' : "") + (p.cs.length ? '<button type="button" data-ov-todas="' + esc(p.num || p.nome) + '">Ligar todas</button><button type="button" data-ov-nenhuma="' + esc(p.num || p.nome) + '">Desligar</button>' : "") + (t ? '<button type="button" data-ov-cloud="1">Abrir na Cloud</button>' : "") + "</div>";
        // secções como no Drive
        var secs = {}, ordem = [];
        p.secs.forEach(function (s) { var k = s.sec || ""; if (!secs[k]) { secs[k] = { nome: k, itens: [] }; ordem.push(k); } secs[k].itens.push(s); });
        ordem.sort(function (a, b) { var x = ORD[a.toLowerCase()], y = ORD[b.toLowerCase()]; x = x == null ? 5 : x; y = y == null ? 5 : y; return x - y; });
        ordem.forEach(function (k) {
          var S = secs[k], todas = []; S.itens.forEach(function (s) { todas = todas.concat(s.cs); });
          if (!k) { todas.forEach(function (c) { h += linha(c, p.prefixo); }); return; }
          h += detalhe("ov-s", "s:" + p.num + "|" + k, "<em>" + esc(secNome(k)) + "</em><small>" + (todas.length ? contas(todas) : "vazia") + "</small>", false);
          S.itens.forEach(function (s) {
            if (!s.sub) { s.cs.forEach(function (c) { h += linha(c, p.prefixo); }); if (!s.cs.length && S.itens.length === 1) h += '<div class="ov-vz">Ainda sem ficheiros.</div>'; return; }
            h += detalhe("ov-s", "u:" + p.num + "|" + k + "|" + s.sub, '<i class="ov-cor" style="background:' + esc(s.g.cor || "#75834a") + '"></i><em>' + esc(s.sub) + "</em><small>" + (s.cs.length ? contas(s.cs) : "vazia") + "</small>", false);
            s.cs.forEach(function (c) { h += linha(c, p.prefixo); }); if (!s.cs.length) h += '<div class="ov-vz">Ainda sem ficheiros.</div>';
            h += "</details>";
          });
          h += "</details>";
        });
        if (p.soCloud && !p.cs.length) h += '<div class="ov-vz">Projecto na IPR Cloud, ainda sem camadas na organização.</div>';
        h += "</details>";
      });
      if (outros.length) {
        h += detalhe("ov-p", "p:outras", "<em>Outras camadas da organização</em><small>" + contas([].concat.apply([], outros.map(function (o) { return o.cs; }))) + "</small>", false);
        outros.forEach(function (o) { h += detalhe("ov-s", "u:outras|" + o.g.id, '<i class="ov-cor" style="background:' + esc(o.g.cor || "#75834a") + '"></i><em>' + esc(o.g.nome) + "</em><small>" + contas(o.cs) + "</small>", false); o.cs.forEach(function (c) { h += linha(c, ""); }); h += "</details>"; });
        h += "</details>";
      }
      var V = P.querySelector("#ipr-orgv");
      [].slice.call(P.children).forEach(function (el) { if (el.id !== "ipr-orgv") el.hidden = true; });
      if (!V) { V = document.createElement("div"); V.id = "ipr-orgv"; P.appendChild(V); }
      V.__ov = { projs: projs }; desenhando = true; V.innerHTML = h; desenhando = false;
      var sel = V.querySelector(".ipr-orgsel"); if (sel && O) sel.addEventListener("change", function () { location.href = "/atlas/?ipr_org=" + encodeURIComponent(sel.value) + "&_ipr_org=" + encodeURIComponent(O.nonce) + "&separador=org"; });
    }
    // Abre a Base no separador Projectos (o mesmo cartão que o dono vê; quem é da organização recebe-o por partilha).
    function abrirBase(id) {
      var tab = document.querySelector('.ipe-tab[data-tab="proj"]'); if (tab) tab.click();
      var n = 0;
      (function procurar() {
        var c = [].slice.call(document.querySelectorAll("#ipe-proj article.ipe-card[data-i]")).filter(function (a) { return [].some.call(a.querySelectorAll(".mono"), function (m) { return new RegExp("#" + id + "\\b").test(m.textContent); }); })[0];
        if (c) { var alvo = c.querySelector(".ipe-ct strong") || c; alvo.click(); try { c.scrollIntoView({ block: "nearest" }); } catch (e) {} return; }
        if (n++ < 40) return setTimeout(procurar, 250);
        var p = proj(String(id)); if (p && p.base && p.base.bbox) window.tcdOrg.ajustar(p.base.bbox);
      })();
    }
    function proj(k) { var V = P.querySelector("#ipr-orgv"), ps = V && V.__ov && V.__ov.projs || {}; return ps[k] || Object.keys(ps).map(function (x) { return ps[x]; }).filter(function (p) { return p.nome === k; })[0]; }
    function caixa(cs) { var b = null; cs.forEach(function (c) { if (!c.bbox) return; b = b ? [Math.min(b[0], c.bbox[0]), Math.min(b[1], c.bbox[1]), Math.max(b[2], c.bbox[2]), Math.max(b[3], c.bbox[3])] : c.bbox.slice(); }); return b; }
    function porId(id) { var d = window.tcdOrg.dados(); return ((d && d.camadas) || []).filter(function (c) { return c.id === id; })[0]; }
    function liga(id, sim) { ligadas[id] = sim; if (sim) window.tcdOrg.ligar(id); else window.tcdOrg.desligar(id); var o = P.querySelector('[data-ipo-c="' + id + '"]'); if (o) o.checked = sim; }
    P.addEventListener("toggle", function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.k && !desenhando) { EST[d.dataset.k] = d.open; guardar(); } }, true);
    P.addEventListener("change", function (ev) { var cb = ev.target; if (!cb || !cb.dataset || !cb.dataset.ovC) return; liga(+cb.dataset.ovC, cb.checked); actualizar(); });
    P.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("button"); if (!b || !P.querySelector("#ipr-orgv").contains(b)) return;
      if (b.dataset.ovZ) { var c = porId(+b.dataset.ovZ); if (c) { liga(c.id, true); window.tcdOrg.ajustar(c.bbox); var cb = P.querySelector('[data-ov-c="' + c.id + '"]'); if (cb) cb.checked = true; actualizar(); } return; }
      if (b.dataset.ovBase) { abrirBase(+b.dataset.ovBase); return; }
      if (b.dataset.ovCloud) { var t = document.querySelector('.ipe-tab[data-tab="cloud"]'); if (t) t.click(); return; }
      var p = proj(b.dataset.ovIr || b.dataset.ovTodas || b.dataset.ovNenhuma); if (!p) return;
      if (b.dataset.ovIr) { var bx = caixa(p.cs) || (p.base && p.base.bbox) || (p.cloud && p.cloud.bbox); if (bx) window.tcdOrg.ajustar(bx); return; }
      var sim = !!b.dataset.ovTodas; p.cs.forEach(function (c) { liga(c.id, sim); }); P.querySelectorAll("#ipr-orgv [data-ov-c]").forEach(function (cb) { if (p.cs.some(function (c) { return c.id === +cb.dataset.ovC; })) cb.checked = sim; });
      if (sim) { var bx2 = caixa(p.cs); if (bx2) window.tcdOrg.ajustar(bx2); } actualizar();
    });
    var desenhando = false;
    function actualizar() { clearTimeout(actualizar.t); actualizar.t = setTimeout(function () { var y = P.scrollTop; desenhar(); P.scrollTop = y; }, 60); }
    new MutationObserver(function () { if (desenhando) return; var outro = [].slice.call(P.children).some(function (el) { return el.id !== "ipr-orgv" && !el.hidden; }); if (outro) actualizar(); }).observe(P, { childList: true });
    // 25/10, 22h57: o separador Projectos abre aqui um projecto da organização já desdobrado.
    window.__iprOrgAbrir = function (k) {
      EST["p:" + k] = true; guardar();
      var tab = document.querySelector('.ipe-tab[data-tab="org"]'); if (tab) tab.click();
      setTimeout(function () { desenhar(); var d = P.querySelector('#ipr-orgv details[data-k="p:' + String(k).replace(/"/g, "") + '"]'); if (d) { try { d.scrollIntoView({ block: "start" }); } catch (e) {} } var p = proj(String(k)), bx = p && (caixa(p.cs) || (p.base && p.base.bbox) || (p.cloud && p.cloud.bbox)); if (bx) window.tcdOrg.ajustar(bx); }, 120);
    };
    window.__iprOrgBase = abrirBase;
    desenhar();
    return true;
  }



  // §57 Perfil de elevação (especificação de 26/10/2026, cap. 3). Desenha-se uma linha no mapa (cliques; duplo clique ou
  // «Terminar» acaba); o Atlas amostra a altitude ao longo do percurso nos mosaicos de relevo do próprio Atlas (Mapterhorn,
  // terrarium: LiDAR DGT 0,5 m onde existe, Copernicus GLO-30 no resto) ao zoom 15, com intervalo escolhido pela extensão
  // (nunca menos de 2 m nem mais de 600 amostras). Gráfico distância horizontal / altitude, indicador ligado ao mapa,
  // comprimento horizontal, cotas, desnível, subida e descida acumuladas (limiar de 1 m contra o ruído), troço mais inclinado,
  // inverter, CSV. Falta de dados interrompe o perfil (nunca altitude zero). Não substitui levantamento topográfico.
  function perfil() {
    var bar = document.querySelector("#ipe .ipe-tools .ipe-tg"), M = mapa(); if (!bar || !M) return false;
    if (document.getElementById("ipr-perfil-b")) return true;
    var b = document.createElement("button"); b.type = "button"; b.className = "ipe-t"; b.id = "ipr-perfil-b"; b.title = "Perfil de elevação"; b.setAttribute("aria-label", "Perfil de elevação");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 19l5-8 4 5 3-6 8 9z"/><path d="M2 21h20"/></svg>';
    bar.appendChild(b);
    var st = document.createElement("style");
    st.textContent = "#ipr-pf{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:100001;width:min(760px,calc(100vw - 32px));background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#333);border-radius:12px;padding:10px 12px;font:12.5px Inter,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)}#ipr-pf .c{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}#ipr-pf .c b{font-size:13px}#ipr-pf .a{display:flex;gap:6px;flex-wrap:wrap}#ipr-pf button{font:600 12px Inter,sans-serif;padding:6px 10px;border-radius:7px;border:1px solid var(--ln,#333);background:transparent;color:var(--tx,#e9eadf);cursor:pointer}#ipr-pf button.ok{background:var(--ac,#b5c46a);color:#141814;border-color:var(--ac,#b5c46a)}#ipr-pf svg{width:100%;height:180px;display:block;margin:6px 0}#ipr-pf .k{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:4px 12px;color:var(--mu,#9aa08f)}#ipr-pf .k span b{color:var(--tx,#e9eadf);font-weight:600}#ipr-pf .n{color:var(--mu,#9aa08f);font-size:11px;margin-top:4px}";
    document.head.appendChild(st);
    var vs = [], ativo = false, P = null, dados = null, marca = null, cache = {};
    function fonte() { if (!M.getSource("ipr-pf")) { M.addSource("ipr-pf", { type: "geojson", data: { type: "FeatureCollection", features: [] } }); M.addLayer({ id: "ipr-pf-l", type: "line", source: "ipr-pf", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#d0482c", "line-width": 3 } }); M.addLayer({ id: "ipr-pf-p", type: "circle", source: "ipr-pf", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 4, "circle-color": "#fff", "circle-stroke-color": "#d0482c", "circle-stroke-width": 2 } }); } }
    function pintar() { try { fonte(); M.getSource("ipr-pf").setData({ type: "FeatureCollection", features: (vs.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: vs } }] : []).concat(vs.map(function (v) { return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: v } }; })) }); } catch (e) {} }
    function dist(a, c) { var R = 6371008.8, r = Math.PI / 180, dl = (c[1] - a[1]) * r, dg = (c[0] - a[0]) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[1] * r) * Math.cos(c[1] * r) * Math.sin(dg / 2) * Math.sin(dg / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
    function tile(z, x, y) {
      var k = z + "/" + x + "/" + y; if (cache[k]) return cache[k];
      cache[k] = new Promise(function (ok) {
        var im = new Image(); im.crossOrigin = "anonymous";
        im.onload = function () { try { var cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; var c2 = cv.getContext("2d"); c2.drawImage(im, 0, 0); ok({ w: im.width, d: c2.getImageData(0, 0, im.width, im.height).data }); } catch (e) { ok(null); } };
        im.onerror = function () { ok(null); };
        im.src = "https://tiles.mapterhorn.com/" + k + ".webp";
      });
      return cache[k];
    }
    function alt(lon, lat) {
      var z = 15, n = Math.pow(2, z), xt = (lon + 180) / 360 * n, la = lat * Math.PI / 180, yt = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n;
      var tx = Math.floor(xt), ty = Math.floor(yt);
      return tile(z, tx, ty).then(function (t) {
        if (!t) return NaN;
        alt.w = t.w; // largura do mosaico em píxeis, para a resolução no CSV
        var fx = (xt - tx) * t.w - 0.5, fy = (yt - ty) * t.w - 0.5, x0 = Math.max(0, Math.min(t.w - 2, Math.floor(fx))), y0 = Math.max(0, Math.min(t.w - 2, Math.floor(fy))), ax = Math.max(0, Math.min(1, fx - x0)), ay = Math.max(0, Math.min(1, fy - y0));
        function h(x, y) { var i = (y * t.w + x) * 4; if (t.d[i + 3] === 0) return NaN; return t.d[i] * 256 + t.d[i + 1] + t.d[i + 2] / 256 - 32768; }
        var a = h(x0, y0), b2 = h(x0 + 1, y0), c = h(x0, y0 + 1), d = h(x0 + 1, y0 + 1);
        return (a * (1 - ax) + b2 * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
      });
    }
    function amostrar() {
      var tot = 0, seg = []; for (var i = 1; i < vs.length; i++) { var d = dist(vs[i - 1], vs[i]); seg.push(d); tot += d; }
      var passo = Math.max(2, tot / 600), pts = [], acc = 0;
      for (var j = 0; j < seg.length; j++) {
        var n = Math.max(1, Math.ceil(seg[j] / passo));
        for (var k = 0; k < n; k++) { var f = k / n; pts.push({ d: acc + seg[j] * f, lon: vs[j][0] + (vs[j + 1][0] - vs[j][0]) * f, lat: vs[j][1] + (vs[j + 1][1] - vs[j][1]) * f }); }
        acc += seg[j];
      }
      pts.push({ d: tot, lon: vs[vs.length - 1][0], lat: vs[vs.length - 1][1] });
      return Promise.all(pts.map(function (p) { return alt(p.lon, p.lat).then(function (h) { p.h = Math.round(h * 10) / 10; return p; }); })).then(function (r) { return { pts: r, tot: tot, passo: passo }; });
    }
    function km(m) { return m >= 1000 ? (m / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " km" : Math.round(m) + " m"; }
    function desenhar() {
      var pts = dados.pts, val = pts.filter(function (p) { return isFinite(p.h); }); if (!val.length) { P.querySelector(".g").innerHTML = '<p class="n">Sem dados de relevo neste percurso.</p>'; return; }
      var mn = Math.min.apply(null, val.map(function (p) { return p.h; })), mx = Math.max.apply(null, val.map(function (p) { return p.h; })), W = 740, H = 180, L = 44, B = 22, Tp = 8, R = 8;
      var esp = Math.max(1, mx - mn), y0 = mn - esp * 0.08, y1 = mx + esp * 0.08;
      function X(d) { return L + d / dados.tot * (W - L - R); } function Y(h) { return Tp + (1 - (h - y0) / (y1 - y0)) * (H - Tp - B); }
      var path = "", area = "", abre = false;
      pts.forEach(function (p) { if (!isFinite(p.h)) { abre = false; return; } path += (abre ? "L" : "M") + X(p.d).toFixed(1) + " " + Y(p.h).toFixed(1); abre = true; });
      var linhas = ""; for (var i = 0; i <= 4; i++) { var hv = y0 + (y1 - y0) * i / 4; linhas += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(hv) + '" y2="' + Y(hv) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (L - 4) + '" y="' + (Y(hv) + 3) + '" font-size="9" text-anchor="end" fill="currentColor" fill-opacity=".6">' + Math.round(hv) + "</text>"; }
      for (var j = 0; j <= 4; j++) { var dv = dados.tot * j / 4; linhas += '<text x="' + X(dv) + '" y="' + (H - 6) + '" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity=".6">' + km(dv) + "</text>"; }
      var sub = 0, des = 0, ref = val[0].h; val.forEach(function (p) { var dlt = p.h - ref; if (dlt >= 1) { sub += dlt; ref = p.h; } else if (dlt <= -1) { des -= dlt; ref = p.h; } });
      var ji = Math.max(1, Math.round(20 / dados.passo)), pior = 0, piorD = 0; for (var q = ji; q < pts.length; q++) { if (isFinite(pts[q].h) && isFinite(pts[q - ji].h)) { var dc = Math.abs(pts[q].h - pts[q - ji].h) / Math.max(1e-6, pts[q].d - pts[q - ji].d) * 100; if (dc > pior) { pior = dc; piorD = pts[q].d; } } }
      var falta = pts.length - val.length;
      P.querySelector(".g").innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + linhas + '<path d="' + path + '" fill="none" stroke="#d0482c" stroke-width="1.8"/><line class="cur" y1="' + Tp + '" y2="' + (H - B) + '" stroke="currentColor" stroke-opacity=".5" visibility="hidden"/><text class="curt" font-size="10" fill="currentColor" visibility="hidden"></text></svg>';
      P.querySelector(".k").innerHTML = "<span>Comprimento horizontal <b>" + km(dados.tot) + "</b></span><span>Altitude inicial / final <b>" + (isFinite(pts[0].h) ? Math.round(pts[0].h) : "—") + " / " + (isFinite(pts[pts.length - 1].h) ? Math.round(pts[pts.length - 1].h) : "—") + " m</b></span><span>Mínima / máxima <b>" + Math.round(mn) + " / " + Math.round(mx) + " m</b></span><span>Desnível líquido <b>" + (isFinite(pts[0].h) && isFinite(pts[pts.length - 1].h) ? Math.round(pts[pts.length - 1].h - pts[0].h) : "—") + " m</b></span><span>Subida / descida acumuladas <b>" + Math.round(sub) + " / " + Math.round(des) + " m</b></span><span>Troço mais inclinado (20 m) <b>" + pior.toLocaleString("pt-PT", { maximumFractionDigits: 0 }) + " % aos " + km(piorD) + "</b></span>";
      P.querySelector(".n").textContent = "Relevo: Mapterhorn (LiDAR DGT 0,5 m onde existe; Copernicus GLO-30 no resto), mosaicos ao zoom 15, altitude ortométrica aproximada. Amostra de " + (Math.round(dados.passo * 10) / 10).toLocaleString("pt-PT") + " em " + (Math.round(dados.passo * 10) / 10).toLocaleString("pt-PT") + " m. Subida e descida com limiar de 1 m." + (falta ? " " + falta + " amostra(s) sem dados: o perfil fica interrompido nesses troços." : "") + " Apoio à leitura do território; não substitui levantamento topográfico.";
      var sv = P.querySelector("svg"), cur = sv.querySelector(".cur"), curt = sv.querySelector(".curt");
      sv.addEventListener("mousemove", function (ev) {
        var r = sv.getBoundingClientRect(), d = Math.max(0, Math.min(1, ((ev.clientX - r.left) * W / r.width - L) / (W - L - R))) * dados.tot, best = pts[0];
        pts.forEach(function (p) { if (Math.abs(p.d - d) < Math.abs(best.d - d)) best = p; });
        cur.setAttribute("x1", X(best.d)); cur.setAttribute("x2", X(best.d)); cur.setAttribute("visibility", "visible");
        curt.textContent = km(best.d) + " · " + (isFinite(best.h) ? best.h.toLocaleString("pt-PT") + " m" : "sem dados"); curt.setAttribute("x", Math.min(W - 120, X(best.d) + 4)); curt.setAttribute("y", Tp + 10); curt.setAttribute("visibility", "visible");
        try { if (!marca) { var el = document.createElement("div"); el.style.cssText = "width:12px;height:12px;border-radius:50%;background:#d0482c;border:2px solid #fff"; marca = new window.maplibregl.Marker({ element: el }); } marca.setLngLat([best.lon, best.lat]).addTo(M); } catch (e) {}
      });
      sv.addEventListener("mouseleave", function () { cur.setAttribute("visibility", "hidden"); curt.setAttribute("visibility", "hidden"); if (marca) marca.remove(); });
    }
    function calcular() {
      if (vs.length < 2) { P.querySelector(".n").textContent = "Marque pelo menos dois pontos no mapa."; return; }
      parar(); P.querySelector(".g").innerHTML = '<p class="n">A ler o relevo ao longo do percurso…</p>';
      amostrar().then(function (r) { dados = r; desenhar(); });
    }
    function csv() {
      if (!dados) return;
      // 27/10 (reporte 16261, Bernardo): colunas fonte_dados e resolucao_m. O Mapterhorn junta LiDAR DGT 0,5 m (onde existe) e
      // Copernicus GLO-30 (no resto) e não diz, ponto a ponto, qual usou; a coluna diz isso mesmo. resolucao_m é o tamanho do píxel
      // do mosaico lido (zoom 15) nessa latitude, ou seja, o passo da grelha de onde vem a altitude, não a precisão.
      var FD = "Mapterhorn z15 (LiDAR DGT 0,5 m onde existe, Copernicus GLO-30 no resto)", W = alt.w || 512;
      function res(lat) { return (40075016.686 * Math.cos(lat * Math.PI / 180) / (Math.pow(2, 15) * W)).toFixed(2); }
      var t = "distancia_m;longitude;latitude;altitude_m;fonte_dados;resolucao_m\n" + dados.pts.map(function (p) { var ok = isFinite(p.h); return Math.round(p.d * 10) / 10 + ";" + p.lon.toFixed(7) + ";" + p.lat.toFixed(7) + ";" + (ok ? p.h : "") + ";" + (ok ? '"' + FD + '"' : "sem dados") + ";" + (ok ? res(p.lat) : ""); }).join("\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + t], { type: "text/csv" })); a.download = "perfil-de-elevacao.csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
    function clique(e) { if (!ativo) return; vs.push([+e.lngLat.lng.toFixed(7), +e.lngLat.lat.toFixed(7)]); pintar(); P.querySelector(".n").textContent = vs.length + " ponto(s). Duplo clique ou «Terminar» acaba a linha."; }
    function duplo(e) { if (!ativo) return; e.preventDefault(); calcular(); }
    function parar() { ativo = false; window.__iprSemIdentificar = 0; M.getCanvas().style.cursor = ""; try { M.doubleClickZoom.enable(); } catch (e) {} }
    function fechar() { parar(); vs = []; dados = null; pintar(); if (marca) marca.remove(); if (P) P.remove(); P = null; M.off("click", clique); M.off("dblclick", duplo); b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); }
    function abrir() {
      if (P) { fechar(); return; }
      var M2 = mapa(); if (M2 && M2 !== M) M = M2; // §70: o mapa pode ter sido criado de novo (mudança de modo)
      P = document.createElement("div"); P.id = "ipr-pf";
      P.innerHTML = '<div class="c"><b>Perfil de elevação</b><div class="a"><button type="button" data-a="fim" class="ok">Terminar</button><button type="button" data-a="inv">Inverter</button><button type="button" data-a="novo">Nova linha</button><button type="button" data-a="csv">CSV</button><button type="button" data-a="x">Fechar</button></div></div><div class="g"><p class="n">Clique no mapa para marcar o percurso (um ou vários segmentos).</p></div><div class="k"></div><div class="n"></div>';
      document.body.appendChild(P); b.classList.add("on"); b.setAttribute("aria-pressed", "true");
      ativo = true; window.__iprSemIdentificar = 1; vs = []; M.getCanvas().style.cursor = "crosshair"; try { M.doubleClickZoom.disable(); } catch (e) {}
      M.on("click", clique); M.on("dblclick", duplo);
      P.addEventListener("click", function (ev) {
        var a = ev.target.dataset && ev.target.dataset.a; if (!a) return;
        if (a === "x") fechar(); else if (a === "fim") calcular(); else if (a === "csv") csv();
        else if (a === "inv") { vs.reverse(); pintar(); if (dados) calcular(); }
        else if (a === "novo") { vs = []; dados = null; pintar(); ativo = true; window.__iprSemIdentificar = 1; M.getCanvas().style.cursor = "crosshair"; try { M.doubleClickZoom.disable(); } catch (e) {} P.querySelector(".g").innerHTML = '<p class="n">Clique no mapa para marcar o percurso.</p>'; P.querySelector(".k").innerHTML = ""; }
      });
    }
    b.addEventListener("click", abrir);
    return true;
  }

  // §58 Rosa dos ventos sempre visível (especificação de 26/10, cap. 4; Nuno, 00h55: «desapareceu a rosa dos ventos e o
  // localizador»). A rosa do app.js vai para o canto superior esquerdo (§40); se, por qualquer razão, deixar de estar visível
  // (removida, escondida, fora do ecrã ou atrás de um painel), aparece no canto inferior direito a bússola nativa do mapa, que
  // acompanha a rotação e a inclinação e repõe o norte com um clique. Verificação de 2 em 2 segundos, sem duplicar.
  function rosaSegura() {
    var M = mapa(); if (!M || !window.maplibregl) return false;
    if (rosaSegura.feito) return true; rosaSegura.feito = 1;
    var ctl = null;
    function visivel(el) {
      if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return false;
      var cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
      var topo = document.elementFromPoint(cx, cy); return !!topo && (el === topo || el.contains(topo));
    }
    setInterval(function () {
      var ok = visivel(document.querySelector("#ipe .ipe-rosa"));
      if (!ok && !ctl) { ctl = new window.maplibregl.NavigationControl({ showZoom: false, showCompass: true, visualizePitch: true }); try { M.addControl(ctl, "bottom-right"); } catch (e) { ctl = null; } }
      else if (ok && ctl) { try { M.removeControl(ctl); } catch (e) {} ctl = null; }
    }, 2000);
    return true;
  }

  // §59 Vista 3D do terreno dentro da ficha do projecto (especificação de 26/10, cap. 2; Nuno, 08h24: «o polígono que
  // identifica cada projecto está ok; o 3D vai para dentro da ficha do projecto»). A miniatura do polígono fica como está.
  // Modelo navegável (não vídeo): relevo Mapterhorn (LiDAR DGT 0,5 m onde existe; Copernicus GLO-30 no resto), imagem de
  // satélite, limite do terreno por cima. Abre parado, enquadra a propriedade com margem, perspectiva oblíqua. Arrastar roda e
  // inclina, roda do rato aproxima; botões: vista inicial, norte, ecrã inteiro, exagero vertical 1× / 2×. Também por
  // «Ver em 3D» nas linhas dos projectos. Carrega só quando se abre (não atrasa a ficha).
  function vista3d(alvo, id, emJanela, vivo) {
    if (!window.maplibregl) return;
    alvo.innerHTML = '<div class="ipr-3d-c"><div class="m"></div><div class="b"><button type="button" data-v="ini" title="Vista inicial">⟲</button><button type="button" data-v="n" title="Orientar a norte">N</button><button type="button" data-v="ex" title="Exagero vertical">1×</button><button type="button" data-v="ec" title="Ecrã inteiro">⤢</button>' + (emJanela ? '<button type="button" data-v="x" title="Fechar">✕</button>' : "") + '</div><div class="s">A carregar o relevo…</div></div>';
    var C = alvo.querySelector(".m"), S = alvo.querySelector(".s");
    plGeo(id).then(function (T) {
      var gj = { type: "FeatureCollection", features: T.aneis.map(function (r) { return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: r } }; }) };
      var bx = [180, 90, -180, -90]; T.aneis.forEach(function (r) { r.forEach(function (c) { bx[0] = Math.min(bx[0], c[0]); bx[1] = Math.min(bx[1], c[1]); bx[2] = Math.max(bx[2], c[0]); bx[3] = Math.max(bx[3], c[1]); }); });
      var m = new window.maplibregl.Map({ container: C, attributionControl: false, pitch: 60, bearing: -20, maxPitch: 85, interactive: true,
        style: { version: 8, sources: { sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19 }, dem: { type: "raster-dem", tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"], encoding: "terrarium", tileSize: 512, maxzoom: 15 }, lim: { type: "geojson", data: gj } },
          layers: [{ id: "sat", type: "raster", source: "sat" }, { id: "lim-s", type: "line", source: "lim", paint: { "line-color": "#000", "line-width": 5, "line-opacity": 0.35 } }, { id: "lim", type: "line", source: "lim", paint: { "line-color": "#ffd23f", "line-width": 2.5 } }], terrain: { source: "dem", exaggeration: 1 } } });
      vista3dReg(m, C);
      var ex = 1, ini = function () { m.fitBounds([[bx[0], bx[1]], [bx[2], bx[3]]], { padding: 40, pitch: 60, bearing: -20, duration: 0 }); };
      m.on("load", function () { ini(); S.textContent = "Relevo: Mapterhorn (LiDAR DGT 0,5 m onde existe; Copernicus GLO-30 no resto) · imagem Esri World Imagery · escala vertical real (1×). Arraste para rodar e inclinar; roda do rato para aproximar."; });
      m.on("error", function () { S.textContent = "Parte do relevo ou da imagem não carregou. Tente outra vez dentro de momentos."; });
      // §60: na ficha, o modelo fica parado; ao passar o rato roda devagar; ao clicar fica navegável.
      if (vivo) {
        var hs = ["dragRotate", "dragPan", "scrollZoom", "touchZoomRotate", "doubleClickZoom", "keyboard", "touchPitch"], solto = false, gira = 0;
        hs.forEach(function (h) { try { m[h].disable(); } catch (x) {} });
        var dica = document.createElement("div"); dica.className = "ipr-fx-dica"; dica.textContent = "Passe o rato para rodar · clique para explorar"; C.parentNode.appendChild(dica);
        function rodar() { if (solto || m._removed || !C.isConnected) { gira = 0; return; } m.setBearing(m.getBearing() + 0.12); gira = requestAnimationFrame(rodar); }
        C.addEventListener("mouseenter", function () { if (!solto && !gira) gira = requestAnimationFrame(rodar); });
        C.addEventListener("mouseleave", function () { cancelAnimationFrame(gira); gira = 0; });
        C.addEventListener("click", function () { if (solto) return; solto = true; cancelAnimationFrame(gira); gira = 0; hs.forEach(function (h) { try { m[h].enable(); } catch (x) {} }); dica.textContent = "Arraste para rodar e inclinar · roda do rato para aproximar"; });
        C.addEventListener("touchstart", function () { if (!solto) { solto = true; hs.forEach(function (h) { try { m[h].enable(); } catch (x) {} }); dica.textContent = "Dois dedos para rodar e inclinar"; } }, { passive: true });
      }
      alvo.querySelector(".b").addEventListener("click", function (e) {
        var v = e.target.dataset && e.target.dataset.v; if (!v) return;
        if (v === "ini") ini(); else if (v === "n") m.easeTo({ bearing: 0, duration: 400 });
        else if (v === "ex") { ex = ex === 1 ? 2 : 1; m.setTerrain({ source: "dem", exaggeration: ex }); e.target.textContent = ex + "×"; S.textContent = ex === 1 ? "Escala vertical real (1×)." : "Exagero vertical 2× (só para leitura; as cotas e medições usam a escala real)."; }
        else if (v === "ec") { var el = alvo.querySelector(".ipr-3d-c"); try { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen(); } catch (x) {} setTimeout(function () { m.resize(); }, 300); }
        else if (v === "x") { try { m.remove(); } catch (x) {} var j = document.getElementById("ipr-3d-j"); if (j) j.remove(); }
      });
      document.addEventListener("fullscreenchange", function () { setTimeout(function () { try { if (!m._removed) m.resize(); } catch (x) {} }, 200); });
    }).catch(function (e) { S.textContent = e.message || "Sem limite do terreno para mostrar em 3D."; });
  }
  window.__iprVista3d = vista3d;
  // §70 Cada vista 3D é um mapa com contexto WebGL próprio. As fichas são redesenhadas pelo app.js e os mapas antigos ficavam
  // vivos fora da página; o navegador tem um limite de contextos (cerca de 16) e, passado esse limite, deita abaixo os mais
  // antigos, às vezes o do mapa principal («reading 'bind'», «shaderPreludeCode» em cada fotograma). Os mapas 3D cujo contentor
  // saiu da página são removidos; ficam no máximo 3 vistas 3D vivas ao mesmo tempo (as mais antigas fecham-se).
  var V3D = [];
  function vista3dLimpar() {
    V3D = V3D.filter(function (x) { if (x.m._removed) return false; if (!x.c.isConnected) { try { x.m.remove(); } catch (e) {} return false; } return true; });
    while (V3D.length > 3) { var v = V3D.shift(); try { v.m.remove(); } catch (e) {} }
  }
  function vista3dReg(m, c) {
    V3D.push({ m: m, c: c }); vista3dLimpar();
    if (!vista3dReg.obs) { vista3dReg.obs = 1; try { new MutationObserver(function () { clearTimeout(vista3dReg.t); vista3dReg.t = setTimeout(vista3dLimpar, 400); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
  }
  // §60 Ficha do projecto mais completa (Nuno, 26/10, 10h27: «tem que ser um ambiente mais completo [...] cada user quando
  // entra vê toda aquela informação, os layers, vê o 3D, que está parado, mas [...] passa o rato e ele mexe, ou clica e mexe
  // [...] dependendo dos acessos vê mais ou menos»). Dentro da ficha aberta, por baixo do cabeçalho: o 3D já carregado
  // (parado; roda ao passar o rato; navegável ao clicar), os dados do terreno calculados no próprio navegador (área, freguesia e
  // concelho, altitude mínima, média e máxima, declive médio e máximo, exposição dominante, a partir do mesmo relevo do perfil),
  // as acções (3D em ecrã inteiro, perfil de elevação, planta de localização) e o que o nível de acesso dá: no Explorer, o que
  // o Intelligence mostra neste terreno; no Intelligence, os temas activos. A miniatura do polígono fica como está.
  function vista3dFicha() {
    if (!document.getElementById("ipr-3d-css")) {
      var st = document.createElement("style"); st.id = "ipr-3d-css";
      st.textContent = ".ipr-fx{margin:8px 0 10px;display:grid;gap:8px}.ipr-fx .ipr-3d-c{position:relative;background:#0d100d;border-radius:10px;overflow:hidden;height:240px}.ipr-fx .ipr-3d-c .m{position:absolute;inset:0}.ipr-fx .ipr-3d-c .b{position:absolute;top:6px;right:6px;display:flex;gap:4px;z-index:2}.ipr-fx .ipr-3d-c .b button{font:600 11px Inter,sans-serif;padding:4px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(20,24,20,.75);color:#fff;cursor:pointer}.ipr-fx .ipr-3d-c .s{display:none}.ipr-fx-dica{position:absolute;left:8px;bottom:6px;z-index:2;font:500 11px Inter,sans-serif;color:#fff;background:rgba(20,24,20,.6);padding:3px 7px;border-radius:6px;pointer-events:none}.ipr-3d-c:fullscreen{height:100%}.ipr-fx-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}.ipr-fx-g div{border:1px solid var(--ln,#333);border-radius:8px;padding:6px 8px}.ipr-fx-g b{display:block;font:600 14px Inter,sans-serif;color:var(--tx)}.ipr-fx-g span{font:500 10px/1.3 Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--mu,#999)}.ipr-fx-a{display:flex;flex-wrap:wrap;gap:6px}.ipr-fx-a button{font:600 12px Inter,sans-serif;padding:6px 9px;border-radius:8px;border:1px solid var(--ln,#333);background:transparent;color:var(--tx);cursor:pointer}.ipr-fx-n{font:13px/1.45 Inter,sans-serif;color:var(--mu,#aaa);border-left:3px solid #75834a;padding:4px 8px}.ipr-fx-n b{color:var(--tx)}";
      document.head.appendChild(st);
    }
    var cache = {};
    function tile(z, x, y) {
      var k = z + "/" + x + "/" + y; if (cache[k]) return cache[k];
      return (cache[k] = new Promise(function (ok) { var im = new Image(); im.crossOrigin = "anonymous"; im.onload = function () { try { var cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; var c2 = cv.getContext("2d"); c2.drawImage(im, 0, 0); ok({ w: im.width, d: c2.getImageData(0, 0, im.width, im.height).data }); } catch (e) { ok(null); } }; im.onerror = function () { ok(null); }; im.src = "https://tiles.mapterhorn.com/" + k + ".webp"; }));
    }
    function alt(lon, lat, z) {
      var n = Math.pow(2, z), xt = (lon + 180) / 360 * n, la = lat * Math.PI / 180, yt = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n, tx = Math.floor(xt), ty = Math.floor(yt);
      return tile(z, tx, ty).then(function (t) { if (!t) return NaN; var px = Math.min(t.w - 1, Math.floor((xt - tx) * t.w)), py = Math.min(t.w - 1, Math.floor((yt - ty) * t.w)), i = (py * t.w + px) * 4; return t.d[i + 3] === 0 ? NaN : t.d[i] * 256 + t.d[i + 1] + t.d[i + 2] / 256 - 32768; });
    }
    function dentro(p, aneis) { var c = false; aneis.forEach(function (r) { for (var i = 0, j = r.length - 1; i < r.length; j = i++) { if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; } }); return c; }
    function terreno(T) {
      var bx = [180, 90, -180, -90]; T.aneis.forEach(function (r) { r.forEach(function (c) { bx[0] = Math.min(bx[0], c[0]); bx[1] = Math.min(bx[1], c[1]); bx[2] = Math.max(bx[2], c[0]); bx[3] = Math.max(bx[3], c[1]); }); });
      var N = 28, dx = (bx[2] - bx[0]) / N, dy = (bx[3] - bx[1]) / N, mx = 111320 * Math.cos((bx[1] + bx[3]) / 2 * Math.PI / 180), my = 110574;
      var larg = Math.max((bx[2] - bx[0]) * mx, (bx[3] - bx[1]) * my), z = larg > 20000 ? 12 : larg > 5000 ? 13 : larg > 1500 ? 14 : 15;
      var pts = []; for (var i = 0; i <= N; i++) for (var j = 0; j <= N; j++) pts.push([bx[0] + i * dx, bx[1] + j * dy, i, j]);
      return Promise.all(pts.map(function (p) { return alt(p[0], p[1], z); })).then(function (h) {
        var G = {}; pts.forEach(function (p, k) { G[p[2] + "," + p[3]] = h[k]; });
        var hs = [], dec = [], asp = [0, 0, 0, 0, 0, 0, 0, 0];
        pts.forEach(function (p, k) {
          if (!dentro(p, T.aneis) || isNaN(h[k])) return; hs.push(h[k]);
          var e = G[(p[2] + 1) + "," + p[3]], w = G[(p[2] - 1) + "," + p[3]], n = G[p[2] + "," + (p[3] + 1)], s2 = G[p[2] + "," + (p[3] - 1)];
          if ([e, w, n, s2].some(function (v) { return v === undefined || isNaN(v); })) return;
          var gx = (e - w) / (2 * dx * mx), gy = (n - s2) / (2 * dy * my), g = Math.sqrt(gx * gx + gy * gy); dec.push(g * 100);
          if (g > 0.02) { var a = (Math.atan2(-gx, -gy) * 180 / Math.PI + 360) % 360; asp[Math.round(a / 45) % 8]++; }
        });
        if (!hs.length) return null;
        hs.sort(function (a, b) { return a - b; }); dec.sort(function (a, b) { return a - b; });
        var med = hs.reduce(function (a, b) { return a + b; }, 0) / hs.length, dm = dec.length ? dec.reduce(function (a, b) { return a + b; }, 0) / dec.length : NaN;
        var rs = ["Norte", "Nordeste", "Este", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"], ai = asp.indexOf(Math.max.apply(null, asp)), at = asp.reduce(function (a, b) { return a + b; }, 0);
        return { min: hs[0], max: hs[hs.length - 1], med: med, dm: dm, dx: dec.length ? dec[Math.floor(dec.length * 0.95)] : NaN, exp: at ? rs[ai] + " (" + Math.round(asp[ai] / at * 100) + " %)" : "plano", centro: [(bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2] };
      });
    }
    function num(v, d) { return isNaN(v) ? "—" : v.toLocaleString("pt-PT", { maximumFractionDigits: d || 0 }); }
    function porCartao() {
      document.querySelectorAll("#ipe .ipe-card.on").forEach(function (c) {
        if (c.querySelector(".ipr-fx")) return;
        var id = +(c.querySelector(".mono") || {}).textContent.replace(/^#?(\d+).*/, "$1"); if (!id) return;
        var d = document.createElement("div"); d.className = "ipr-fx";
        var intel = window.IPR_NIVEL !== "explorer";
        d.innerHTML = '<div class="ipr-fx-3"></div><div class="ipr-fx-g"><div><span>A carregar</span><b>…</b></div></div><div class="ipr-fx-a"><button type="button" data-fx="ec">3D em ecrã inteiro</button><button type="button" data-fx="pf">Perfil de elevação</button><button type="button" data-fx="pl">Planta de localização</button></div>' +
          (intel ? '<p class="ipr-fx-n"><b>Intelligence activo.</b> Neste terreno pode ligar as condicionantes (PDM, REN, RAN, Rede Natura), a água, os solos e a ocupação, a perigosidade de incêndio e os ortofotos, nas camadas do Atlas.</p>' : '<p class="ipr-fx-n"><b>No Intelligence vê também, sobre este terreno:</b> condicionantes (PDM, REN, RAN, Rede Natura), água, solos e ocupação do solo, perigosidade de incêndio. Vem incluído com qualquer Base Cartográfica ou plano da IPR Cloud.</p>');
        var cc = c.querySelector(".ipe-cc"); (cc ? cc.parentNode : c).insertBefore(d, cc ? cc.nextSibling : c.firstChild);
        d.addEventListener("click", function (e) { e.stopPropagation(); }, false);
        vista3d(d.querySelector(".ipr-fx-3"), id, false, true);
        d.querySelector(".ipr-fx-a").addEventListener("click", function (e) {
          var v = e.target.dataset && e.target.dataset.fx; if (!v) return;
          if (v === "ec") { var b = d.querySelector('.ipr-3d-c .b [data-v="ec"]'); if (b) b.click(); }
          else if (v === "pf") { var p = document.getElementById("ipr-perfil-b"); if (p) p.click(); }
          else if (v === "pl" && window.__iprPlanta) window.__iprPlanta(id);
        });
        plGeo(id).then(function (T) {
          return terreno(T).then(function (r) {
            var g = d.querySelector(".ipr-fx-g"), h = '<div><span>Área</span><b>' + num(+T.ha, 2) + ' ha</b></div>';
            if (r) h += '<div><span>Altitude</span><b>' + num(r.min) + '–' + num(r.max) + ' m</b></div><div><span>Altitude média</span><b>' + num(r.med) + ' m</b></div><div><span>Declive médio</span><b>' + num(r.dm, 1) + ' %</b></div><div><span>Declive forte (95 %)</span><b>' + num(r.dx, 1) + ' %</b></div><div><span>Exposição</span><b>' + r.exp + '</b></div>';
            g.innerHTML = h + '<div class="ipr-fx-sit"><span>Freguesia · concelho</span><b>…</b></div>';
            if (r) plSitio(r.centro[0], r.centro[1]).then(function (s) { var x = g.querySelector(".ipr-fx-sit b"); if (x) x.textContent = [s.freguesia, s.municipio].filter(Boolean).join(" · ") || "—"; });
          });
        }).catch(function (e) { d.querySelector(".ipr-fx-g").innerHTML = '<div><span>Terreno</span><b>' + (e.message || "Sem limite guardado") + '</b></div>'; });
      });
    }
    porCartao();
    if (!vista3dFicha.obs) { var ipe = document.getElementById("ipe"); if (!ipe) return false; vista3dFicha.obs = 1; new MutationObserver(function () { clearTimeout(vista3dFicha.t); vista3dFicha.t = setTimeout(porCartao, 150); }).observe(ipe, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] }); }
    return true;
  }
  function vista3dJanela(id) { var j = document.getElementById("ipr-3d-j"); if (j) j.remove(); j = document.createElement("div"); j.id = "ipr-3d-j"; j.innerHTML = "<div></div>"; document.body.appendChild(j); j.addEventListener("click", function (e) { if (e.target === j) j.remove(); }); vista3d(j.firstChild, id, true); }
  // §56 «Os meus locais» só uma vez (Nuno, 26/10, 00h37: «remove os meus locais em duplicado»). O app.js chama «Os meus locais»
  // a todos os grupos .ipc-loc e o arrumar() também; quando um grupo fica dentro do outro, ou dois ficam lado a lado, o título
  // aparece duas vezes. Não se mexe em texto (evita guerra de observadores): esconde-se só a linha de título repetida e o
  // conteúdo continua visível. Um grupo repetido e vazio esconde-se todo.
  function locaisUnico() {
    if (!document.getElementById("ipr-lu-css")) { var st = document.createElement("style"); st.id = "ipr-lu-css"; st.textContent = "#ipe .ipr-lu-sem>.ipr-gt{display:none!important}#ipe .ipr-lu-sem>.ipe-sbc{display:block!important;padding-left:0}#ipe .ipr-lu-fora{display:none!important}"; document.head.appendChild(st); }
    function tit(g) { var n = g.querySelector(":scope>.ipr-gt .ipr-gn") || g.querySelector(".ipr-gn"); return n ? n.textContent.replace(/\s+/g, " ").trim().toLowerCase() : ""; }
    function vazio(g) { var b = g.querySelector(":scope>.ipe-sbc"); return !b || !b.textContent.trim() && !b.querySelector("button,input,canvas,svg,li"); }
    function rever() {
      var gs = [].slice.call(document.querySelectorAll("#ipe .ipr-g")).filter(function (g) { return /^os meus locais/.test(tit(g)); });
      gs.forEach(function (g) { g.classList.remove("ipr-lu-sem"); g.classList.remove("ipr-lu-fora"); });
      if (gs.length < 2) return;
      // aninhados: o de fora perde o título; fica o de dentro, que tem os botões Ponto, Linha e Área
      gs.forEach(function (g) { if (gs.some(function (h) { return h !== g && g.contains(h); })) g.classList.add("ipr-lu-sem"); });
      // lado a lado: fica o #ipc-loc (ou o primeiro); os outros perdem o título, ou desaparecem se estiverem vazios
      var soltos = gs.filter(function (g) { return !g.classList.contains("ipr-lu-sem") && !gs.some(function (h) { return h !== g && h.contains(g) && !h.classList.contains("ipr-lu-sem"); }); });
      var fica = soltos.filter(function (g) { return g.id === "ipc-loc" || g.closest("#ipc-loc"); })[0] || soltos[0];
      soltos.forEach(function (g) { if (g !== fica) g.classList.add(vazio(g) ? "ipr-lu-fora" : "ipr-lu-sem"); });
    }
    rever();
    if (!locaisUnico.obs) { var ipe = document.getElementById("ipe"); if (!ipe) return false; locaisUnico.obs = 1; new MutationObserver(function () { clearTimeout(locaisUnico.t); locaisUnico.t = setTimeout(rever, 120); }).observe(ipe, { childList: true, subtree: true }); }
    return true;
  }
  // §55 Planta de localização em PDF (documento de execução de 25/10/2026, P1; Nuno, 26/10, 00h37: «instala a cena da planta
  // de localização já»). Composição controlada, não captura de ecrã: o ortofotomapa da DGT é pedido em PT-TM06 (EPSG:3763) com a
  // caixa exacta do papel à escala escolhida, e o limite, a quadrícula, a escala e o norte são desenhados em vector. Primeira
  // versão: A4 ou A3, horizontal ou vertical, 1:1 000 a 1:25 000; segunda página com o quadro de vértices para processo municipal.
  // Não é PDF/A validado nem peça municipal; diz-se isso no próprio documento.
  var PL = { libs: null };
  // 27/10/2026 (Nuno, 10h06; catálogo de produtos B.4): folhas de cadastro, topografia LiDAR, perigosidade com gestão de
  // combustível, COS 2023 e COS 2018, planta de condicionantes do PDM quando o concelho a tem; carimbo com freguesia,
  // concelho e cantos da folha em PT-TM06; escolha das folhas no diálogo; dossier em português ou em inglês. A REN por
  // tipologias fica de fora enquanto a camada «Reserva_Ecologica_Nacional_-_Tipologias» não estiver no catálogo (§64).
  // Textos escritos por nós nas duas línguas; a língua do PDF escolhe-se no diálogo (por omissão, a do Atlas).
  var PLG = "pt";
  var PLX = {
    pt: {
      semLimite: "Este projecto não tem limite do terreno guardado.", naoArea: "O limite deste projecto não é uma área.",
      orto25: "Ortofotomapa 2025, 25 cm (DGT)", sat23: "OrtoSat 2023, imagem de satélite (DGT)", semOrto: "Os serviços de ortofotomapa da DGT não responderam. Tente outra vez dentro de momentos.",
      aviso: "Extracto informativo, sem valor de certidão. Algumas câmaras municipais exigem plantas emitidas por elas ou certidões: confirme antes de entregar num processo. Vinculativo é o publicado em Diário da República e no SNIT.",
      maisClasses: "… e mais {n} {c} (ver o serviço de origem)", classe: "classe", classes: "classes", escala: "Escala",
      legenda: "Legenda", oQue: "O que está a ver", projecto: "Projecto", ref: "Ref.", data: "Data", folha: "Folha",
      src: "Sistema de coordenadas: ", imprimir: "Imprimir a 100 % (sem ajustar à página) em {p}.",
      cantos: "Cantos da folha (PT-TM06, m)", freg: "Freguesia de {f}", conc: "Concelho de {c}", sitioNd: "Freguesia e concelho: sem resposta da CAOP no momento",
      outras: "Outras categorias", nenhum: "{n}: nenhum elemento nesta folha",
      mVect: "polígonos vectoriais do serviço (OGC API DGT), medidos em grelha de {px} m", mImg: "estimativa a partir da imagem do serviço (píxel de {px} m)",
      semCor: "Cor sem correspondência na legenda", dadosDe: "dados de {a}", dadosA: " a {b}", actual: "actualizado em {d}", semTipo: "tipo de serviço sem extracto",
      limite: "Limite do terreno", indisp: "{n}: serviço indisponível no momento",
      sobreOrto: " Sobre o ortofotomapa atenuado, à mesma escala e com a mesma caixa da folha de localização; o limite do terreno está a vermelho.",
      indispOQue: "Serviço indisponível no momento: não foi possível obter {n}. Gere o PDF de novo mais tarde. ",
      fonte: "Fonte: ", semResp: ", sem resposta", licenca: ". Licença: termos de utilização do serviço de origem", soConsulta: "; só consulta, sem redistribuição dos dados",
      consultado: ". Consultado em {h}. Fundo: {f}, atenuado.", extracto: "Extracto · {t}",
      sinTit: "Quadro de síntese das folhas temáticas", sinIntro: "Área do terreno: {a} ha (calculada em PT-TM06 a partir do limite indicado no IPR Atlas). Para cada tema, área do terreno que abrange e percentagem. As áreas de temas diferentes sobrepõem-se e não se somam.",
      cTema: "Tema", cCamada: "Camada", cArea: "Área (ha)", cPct: "% do terreno", cMetodo: "Método e observações",
      sinIndisp: "Serviço indisponível no momento; sem valores.", linSim: "Há linhas deste tema dentro do limite", linNao: "Nenhuma linha deste tema dentro do limite",
      linNota: " (elemento linear: a área não se aplica; a margem legal não está desenhada no serviço). ", semElem: "Nenhum elemento devolvido pelo serviço na área da folha. ",
      sinNota: "Valores calculados no momento da emissão com os serviços indicados. «Estimativa a partir da imagem do serviço»: contagem dos píxeis coloridos da imagem devolvida pelo serviço dentro do limite; depende da simbologia e da resolução. Polígonos vectoriais: medição dos polígonos devolvidos pela OGC API da DGT numa grelha fina. Nenhum destes valores substitui a planta de condicionantes do PDM nem certidões da câmara municipal.",
      preparar: "A preparar…", naoCabe25: "O terreno não cabe numa folha {p} a 1:25 000. Escolha A3 ou peça folhas de detalhe.",
      naoCabeEsc: "À escala {e} o terreno não cabe numa folha {p}. Escolha uma escala maior ({s}) ou outro papel. A escala não é reduzida sem o dizer.",
      pedirOrto: "A pedir o ortofotomapa à DGT…", pedirTemas: "A pedir as folhas temáticas ({t})…", compor: "A compor o dossier…",
      enquadr: "Enquadramento, cerca de 30 km", plTit: "Planta de localização", posicao: "Posição do terreno no enquadramento",
      dProj: "Projecto #{id}", dFin: "Finalidade: {f}", dReq: "Requerente: {r}", dArea: "Área do limite: {a} ha (calculada em PT-TM06)",
      dCentro: "Centro: M {x} · P {y} · WGS84: {lat}, {lon}", dQuad: "Quadrícula de {q} · norte da quadrícula PT-TM06", dFundo: "Fundo: {f}",
      plOQue: "Ortofotomapa da DGT ({f}) à escala {e}, com o limite do terreno a vermelho e a quadrícula PT-TM06 nas margens.",
      plOQueIx: " No canto, enquadramento de cerca de 30 km sobre imagem de satélite, com a posição do terreno.", plOQueSeg: " As folhas seguintes repetem esta caixa com os temas escolhidos.",
      plFonte: "Fontes: {f}; limites administrativos CAOP (DGT); limite do terreno indicado no IPR Atlas, sem verificação no terreno. Licença: termos de utilização dos serviços de origem. Consultado em {h}. Emitido por IPR Atlas · Terracrua Design, {d} · {id} · versão 2.",
      plAviso: "Documento informativo: não é prova de propriedade, não substitui levantamento topográfico nem é emitido pela câmara municipal.",
      indTit: "Serviço indisponível no momento", indTxt: "Não foi possível obter {t}. Gere o PDF de novo mais tarde.",
      sinFolha: "Quadro de síntese", sinLeg: "Limite do terreno (base da medição)", sinOQue: "Para cada tema pedido, a área do terreno que abrange, em hectares e em percentagem da área do limite, e o método usado em cada linha.",
      sinFonte: "Fonte: os serviços indicados em cada folha temática, consultados em {h}. Licença: termos de utilização dos serviços de origem.",
      vTit: "Quadro de vértices", vCab: "Quadro de vértices · PT-TM06/ETRS89 (EPSG:3763)", vMais: "… e mais {n} vértices (ver ficheiro do limite).", vLeg: "Limite do terreno: vértices numerados pela ordem do desenho",
      vOQue: "Coordenadas dos {n} vértices do limite em {s}, em metros, pela ordem em que foram desenhados", vAnel: "; entre parênteses, o número do anel ou parcela",
      vFonte: "Fonte: limite do terreno indicado no IPR Atlas, sem verificação no terreno; conversão para PT-TM06 com proj4. Consultado em {h}.",
      gerada: "Planta gerada: {id} · {e} · {p} · {n} {f}.", folhaS: "folha", folhasS: "folhas", falhas: " Serviço indisponível no momento: {t}.", semPdmMsg: " Sem planta de condicionantes do PDM no IPR Atlas para este concelho: a folha não foi incluída.",
      ficheiro: "Planta-de-localizacao",
      // folhas novas
      t_cad: "Cadastro predial", t_topo: "Topografia · curvas de nível (LiDAR)", t_fgc: "Perigosidade de incêndio e gestão de combustível",
      t_cos23: "Ocupação do solo · COS 2023", t_cos18: "Ocupação do solo · COS 2018 (a usada pelas câmaras)", t_pdmc: "PDM · planta de condicionantes",
      t_ran: "Reserva Agrícola Nacional (RAN)", t_ren: "Reserva Ecológica Nacional (REN)", t_natura: "Rede Natura 2000 e áreas protegidas", t_dph: "Domínio hídrico",
      t_fogo: "Perigosidade de incêndio rural", t_pdm: "PDM · ordenamento (qualificação do solo)",
      cadLeg: "Limites das parcelas do cadastro", cadToca: "Parcelas que tocam o terreno", cadSem: "Sem referência no serviço",
      cadOQue: "Limites das parcelas do cadastro predial da DGT na mesma caixa da folha de localização. As parcelas que o limite do terreno abrange estão realçadas e listadas no quadro de síntese com a área abrangida.",
      cadNota: "O cadastro da DGT não cobre todo o país e pode não coincidir com o BUPi nem com a caderneta predial; o artigo matricial e a secção confirmam-se na caderneta e na conservatória.",
      maisParc: "… e mais {n} parcelas (ver a folha do cadastro)",
      cadMetodo: "parcelas vectoriais do serviço (OGC API DGT); área da parcela dentro do limite, em grelha de {px} m",
      topoMestra: "Curva mestra (de {m} em {m} m)", topoCurva: "Curva de nível (equidistância {e} m)",
      topoOQueDem: "Curvas de nível calculadas no momento a partir do modelo de elevação Mapterhorn (LiDAR DGT 0,5 m reamostrado, nível {z}, cerca de {r} m por píxel), com equidistância de {e} m e curvas mestras de {m} em {m} m. Servem para ler o relevo; não substituem um levantamento topográfico.",
      topoOQueBase: "Curvas de nível da Base Cartográfica deste projecto ({f}), tiradas do LiDAR da DGT pelo processamento IPR, com equidistância de {e} m.",
      topoCotas: "Cotas dentro do limite: mínima {a} m, máxima {b} m, média {c} m (amostragem do modelo de elevação).",
      topoFonteDem: "Mapterhorn (tiles.mapterhorn.com) · LiDAR DGT 0,5 m · CC BY 4.0", topoFonteBase: "Base Cartográfica do projecto · LiDAR DGT · processamento IPR",
      topoMetodo: "curvas de nível: elemento linear, sem área", topoSem: "O modelo de elevação não respondeu nesta área.",
      pdmNota: "Imagem da planta de condicionantes publicada pela câmara municipal e servida pela DGT/SNIT, reprojectada para PT-TM06. Não substitui a planta em vigor nem a certidão da câmara.",
      pdmMetodo: "imagem da planta publicada: sem medição de áreas (a planta é uma imagem opaca com várias servidões sobrepostas)",
      pdmFonte: "Câmara Municipal de {m} · DGT/SNIT · CC BY 4.0", pdmNome: "Planta de condicionantes · {m}",
      // diálogo
      dlTit: "Planta de localização · projecto #{id}", dlFin: "Finalidade", fApr: "Apresentação", fTec: "Trabalho técnico", fMun: "Processo municipal",
      dlMun: "Município", dlProc: "Procedimento", dlProcEx: "ex.: comunicação prévia", dlPapel: "Papel", dlOri: "Orientação", oAuto: "Automática", oH: "Horizontal", oV: "Vertical",
      dlEsc: "Escala", eMin: "A menor possível (mais pormenor)", dlFundo: "Fundo", fOrto: "Ortofotomapa 2025", fSat: "Satélite 2023", dlReq: "Requerente (opcional)",
      dlLing: "Língua do PDF", dlFolhas: "Folhas a incluir", dlLoc: "Localização", dlSin: "Quadro de síntese (ha e %)", dlVert: "Quadro de vértices",
      dlPdmA: "a procurar o concelho…", dlPdmSim: "{m}", dlPdmNao: "{m} ainda não tem planta no IPR Atlas", dlPdmNd: "concelho por confirmar",
      dlTxt: "PDF em PT-TM06 à escala exacta: folha de localização com ortofotomapa da DGT e folhas temáticas na mesma caixa, cada uma com carimbo (freguesia, concelho, cantos da folha, escala e data), rosa dos ventos, régua, legenda, fontes e identificador. Os extractos são informativos: algumas câmaras exigem plantas emitidas por elas ou certidões.",
      dlGerar: "Gerar PDF", dlFechar: "Fechar"
    },
    en: {
      semLimite: "This project has no saved plot boundary.", naoArea: "The boundary of this project is not an area.",
      orto25: "Orthophoto 2025, 25 cm (DGT)", sat23: "OrtoSat 2023, satellite image (DGT)", semOrto: "The DGT orthophoto services did not respond. Please try again in a few moments.",
      aviso: "Information extract with no certificate value. Some municipal councils require plans issued by themselves or certificates: check before submitting it to an application. Only what is published in the Diário da República and in SNIT is binding.",
      maisClasses: "… and {n} more {c} (see the source service)", classe: "class", classes: "classes", escala: "Scale",
      legenda: "Legend", oQue: "What you are looking at", projecto: "Project", ref: "Ref.", data: "Date", folha: "Sheet",
      src: "Coordinate system: ", imprimir: "Print at 100 % (no fit to page) on {p}.",
      cantos: "Sheet corners (PT-TM06, m)", freg: "Parish of {f}", conc: "Municipality of {c}", sitioNd: "Parish and municipality: no answer from CAOP at the moment",
      outras: "Other categories", nenhum: "{n}: no features on this sheet",
      mVect: "vector polygons from the service (DGT OGC API), measured on a {px} m grid", mImg: "estimate from the service image ({px} m pixel)",
      semCor: "Colour not matched in the legend", dadosDe: "data from {a}", dadosA: " to {b}", actual: "updated on {d}", semTipo: "service type without extract",
      limite: "Plot boundary", indisp: "{n}: service unavailable at the moment",
      sobreOrto: " Over the faded orthophoto, at the same scale and with the same frame as the location sheet; the plot boundary is in red.",
      indispOQue: "Service unavailable at the moment: {n} could not be obtained. Generate the PDF again later. ",
      fonte: "Source: ", semResp: ", no answer", licenca: ". Licence: terms of use of the source service", soConsulta: "; viewing only, no redistribution of the data",
      consultado: ". Retrieved on {h}. Background: {f}, faded.", extracto: "Extract · {t}",
      sinTit: "Summary table of the theme sheets", sinIntro: "Plot area: {a} ha (computed in PT-TM06 from the boundary drawn in IPR Atlas). For each theme, the area of the plot it covers and the percentage. Areas of different themes overlap and do not add up.",
      cTema: "Theme", cCamada: "Layer", cArea: "Area (ha)", cPct: "% of plot", cMetodo: "Method and notes",
      sinIndisp: "Service unavailable at the moment; no values.", linSim: "There are lines of this theme inside the boundary", linNao: "No lines of this theme inside the boundary",
      linNota: " (linear feature: area does not apply; the legal buffer is not drawn by the service). ", semElem: "The service returned no features within the sheet. ",
      sinNota: "Values computed at the time of issue with the services listed. «Estimate from the service image»: count of the coloured pixels of the image returned by the service inside the boundary; it depends on the symbology and the resolution. Vector polygons: measurement of the polygons returned by the DGT OGC API on a fine grid. None of these values replaces the PDM constraints plan or certificates from the municipal council.",
      preparar: "Preparing…", naoCabe25: "The plot does not fit on an {p} sheet at 1:25 000. Choose A3 or ask for detail sheets.",
      naoCabeEsc: "At scale {e} the plot does not fit on an {p} sheet. Choose a larger scale ({s}) or another paper size. The scale is never reduced without saying so.",
      pedirOrto: "Requesting the orthophoto from DGT…", pedirTemas: "Requesting the theme sheets ({t})…", compor: "Composing the dossier…",
      enquadr: "Overview, about 30 km", plTit: "Location plan", posicao: "Position of the plot in the overview",
      dProj: "Project #{id}", dFin: "Purpose: {f}", dReq: "Applicant: {r}", dArea: "Boundary area: {a} ha (computed in PT-TM06)",
      dCentro: "Centre: E {x} · N {y} · WGS84: {lat}, {lon}", dQuad: "{q} grid · PT-TM06 grid north", dFundo: "Background: {f}",
      plOQue: "DGT orthophoto ({f}) at scale {e}, with the plot boundary in red and the PT-TM06 grid along the margins.",
      plOQueIx: " In the corner, an overview of about 30 km over satellite imagery, with the position of the plot.", plOQueSeg: " The following sheets repeat this frame with the chosen themes.",
      plFonte: "Sources: {f}; CAOP administrative boundaries (DGT); plot boundary drawn in IPR Atlas, not checked on the ground. Licence: terms of use of the source services. Retrieved on {h}. Issued by IPR Atlas · Terracrua Design, {d} · {id} · version 2.",
      plAviso: "Information document: it is not proof of ownership, does not replace a topographic survey and is not issued by the municipal council.",
      indTit: "Service unavailable at the moment", indTxt: "{t} could not be obtained. Generate the PDF again later.",
      sinFolha: "Summary table", sinLeg: "Plot boundary (basis of the measurement)", sinOQue: "For each theme requested, the area of the plot it covers, in hectares and as a percentage of the boundary area, and the method used on each row.",
      sinFonte: "Source: the services listed on each theme sheet, retrieved on {h}. Licence: terms of use of the source services.",
      vTit: "Vertex table", vCab: "Vertex table · PT-TM06/ETRS89 (EPSG:3763)", vMais: "… and {n} more vertices (see the boundary file).", vLeg: "Plot boundary: vertices numbered in drawing order",
      vOQue: "Coordinates of the {n} boundary vertices in {s}, in metres, in the order they were drawn", vAnel: "; in brackets, the ring or parcel number",
      vFonte: "Source: plot boundary drawn in IPR Atlas, not checked on the ground; converted to PT-TM06 with proj4. Retrieved on {h}.",
      gerada: "Plan generated: {id} · {e} · {p} · {n} {f}.", folhaS: "sheet", folhasS: "sheets", falhas: " Service unavailable at the moment: {t}.", semPdmMsg: " No PDM constraints plan in IPR Atlas for this municipality: the sheet was left out.",
      ficheiro: "Location-plan",
      t_cad: "Cadastral parcels", t_topo: "Topography · contour lines (LiDAR)", t_fgc: "Wildfire hazard and fuel management",
      t_cos23: "Land cover · COS 2023", t_cos18: "Land cover · COS 2018 (the one councils use)", t_pdmc: "PDM · constraints plan",
      t_ran: "National Agricultural Reserve (RAN)", t_ren: "National Ecological Reserve (REN)", t_natura: "Natura 2000 and protected areas", t_dph: "Water public domain",
      t_fogo: "Rural wildfire hazard", t_pdm: "PDM · zoning (land qualification)",
      cadLeg: "Cadastral parcel boundaries", cadToca: "Parcels touching the plot", cadSem: "No reference in the service",
      cadOQue: "Boundaries of the DGT cadastral parcels in the same frame as the location sheet. The parcels covered by the plot boundary are highlighted and listed in the summary table with the area covered.",
      cadNota: "The DGT cadastre does not cover the whole country and may differ from BUPi and from the land registry record; the tax article and section are confirmed in the registry documents.",
      maisParc: "… and {n} more parcels (see the cadastral sheet)",
      cadMetodo: "vector parcels from the service (DGT OGC API); parcel area inside the boundary, on a {px} m grid",
      topoMestra: "Index contour (every {m} m)", topoCurva: "Contour line ({e} m interval)",
      topoOQueDem: "Contour lines computed on the spot from the Mapterhorn elevation model (DGT LiDAR 0.5 m resampled, level {z}, about {r} m per pixel), at a {e} m interval with index contours every {m} m. They are meant for reading the relief and do not replace a topographic survey.",
      topoOQueBase: "Contour lines from this project's Base Cartográfica ({f}), derived from DGT LiDAR by IPR processing, at a {e} m interval.",
      topoCotas: "Elevations inside the boundary: lowest {a} m, highest {b} m, mean {c} m (sampled from the elevation model).",
      topoFonteDem: "Mapterhorn (tiles.mapterhorn.com) · DGT LiDAR 0.5 m · CC BY 4.0", topoFonteBase: "Project Base Cartográfica · DGT LiDAR · IPR processing",
      topoMetodo: "contour lines: linear feature, no area", topoSem: "The elevation model did not respond for this area.",
      pdmNota: "Image of the constraints plan published by the municipal council and served by DGT/SNIT, reprojected to PT-TM06. It does not replace the plan in force or the council's certificate.",
      pdmMetodo: "image of the published plan: no area measurement (the plan is an opaque image with several overlapping constraints)",
      pdmFonte: "Municipal Council of {m} · DGT/SNIT · CC BY 4.0", pdmNome: "Constraints plan · {m}",
      dlTit: "Location plan · project #{id}", dlFin: "Purpose", fApr: "Presentation", fTec: "Technical work", fMun: "Municipal application",
      dlMun: "Municipality", dlProc: "Procedure", dlProcEx: "e.g. prior notice", dlPapel: "Paper", dlOri: "Orientation", oAuto: "Automatic", oH: "Landscape", oV: "Portrait",
      dlEsc: "Scale", eMin: "Smallest possible (most detail)", dlFundo: "Background", fOrto: "Orthophoto 2025", fSat: "Satellite 2023", dlReq: "Applicant (optional)",
      dlLing: "PDF language", dlFolhas: "Sheets to include", dlLoc: "Location", dlSin: "Summary table (ha and %)", dlVert: "Vertex table",
      dlPdmA: "looking up the municipality…", dlPdmSim: "{m}", dlPdmNao: "{m} has no plan in IPR Atlas yet", dlPdmNd: "municipality to be confirmed",
      dlTxt: "PDF in PT-TM06 at exact scale: location sheet over the DGT orthophoto and theme sheets in the same frame, each with a title block (parish, municipality, sheet corners, scale and date), compass rose, scale bar, legend, sources and identifier. The extracts are for information only: some councils require plans issued by themselves or certificates.",
      dlGerar: "Generate PDF", dlFechar: "Close"
    }
  };
  function plT(k, v) {
    var d = PLX[PLG] || PLX.pt, s = d[k] != null ? d[k] : (PLX.pt[k] != null ? PLX.pt[k] : k);
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  // Nomes das camadas em inglês (o catálogo do viz.js só os tem em português).
  var PL_EN = { ran: "RAN (agricultural reserve)", ren: "REN (ecological reserve)", n2k: "Natura 2000 network", rnap: "Protected areas", la350: "Watercourses with catchment > 350 ha",
    albzr: "Reservoirs and lagoons · reserved zone", albuf: "Classified reservoirs", perig_e: "Structural wildfire hazard 2020–2030", crus: "PDM · land qualification (CRUS)",
    cad: "Cadastral parcels", r_curvas: "Contour lines (DGT LiDAR)", sgifr_a: "Fuel breaks and mosaics (SGIFR)", sgifr_l: "Fuel management network · lines (SGIFR)",
    redeprim: "Primary fuel break network", cos23: "COS 2023 land cover", cos18: "COS 2018 land cover" };
  var PL_CLS_EN = { "Artificializado": "Artificial surfaces", "Agricultura": "Agriculture", "Pastagens": "Pasture", "Agroflorestal": "Agroforestry", "Floresta": "Forest", "Matos": "Scrubland",
    "Sem vegetação": "No vegetation", "Zonas húmidas": "Wetlands", "Água": "Water", "Agrícola": "Agricultural", "Florestal": "Forestry", "Natural": "Natural", "Urbano": "Urban",
    "Actividades económicas": "Economic activities", "Recursos geológicos": "Geological resources" };
  function plNome(e) { return PLG === "en" ? (PL_EN[e.id] || e.en || e.n) : e.n; }
  function plCls(t) { return PLG === "en" && PL_CLS_EN[t] ? PL_CLS_EN[t] : t; }
  function plLoc() { return PLG === "en" ? "en-GB" : "pt-PT"; }
  function plLibs() {
    if (PL.libs) return PL.libs;
    function carregar(u) { return new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = u; s.onload = ok; s.onerror = function () { ko(new Error("Não foi possível carregar " + u)); }; document.head.appendChild(s); }); }
    PL.libs = Promise.all([window.jspdf ? 0 : carregar("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"), window.proj4 ? 0 : carregar("https://cdn.jsdelivr.net/npm/proj4@2.11.0/dist/proj4.js")]).then(function () {
      window.proj4.defs("EPSG:3763", "+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8.133108333333334 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    });
    PL.libs.catch(function () { PL.libs = null; });
    return PL.libs;
  }
  function plGeo(id) {
    return fetch("/wp-json/tcd/v1/meus-mapas", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.json(); }).then(function (d) {
      var achado = null;
      ["mapas", "partilhados", "rever"].forEach(function (k) { (d[k] || []).forEach(function (x) { if (!achado && x && +(x.encomenda || x.id) === +id && x.geojson) achado = x; }); });
      if (!achado) throw new Error(plT("semLimite"));
      var gj = achado.geojson; if (typeof gj === "string") { try { gj = JSON.parse(gj); } catch (e) { gj = null; } }
      var aneis = [];
      (function andar(g) {
        if (!g) return;
        if (g.type === "FeatureCollection") return g.features.forEach(andar);
        if (g.type === "Feature") return andar(g.geometry);
        if (g.type === "Polygon") return g.coordinates.forEach(function (r) { aneis.push(r); });
        if (g.type === "MultiPolygon") return g.coordinates.forEach(function (p) { p.forEach(function (r) { aneis.push(r); }); });
        if (g.type === "GeometryCollection") return g.geometries.forEach(andar);
      })(gj);
      if (!aneis.length) throw new Error(plT("naoArea"));
      return { nome: achado.local || achado.nome || (plT("projecto") + " " + id), aneis: aneis, ha: achado.area_ha, downloads: achado.downloads || [] };
    });
  }
  function plNice(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f >= 5 ? 5 : f >= 2 ? 2 : 1) * e; }
  function plImg(url, wpx, hpx) {
    return fetch("/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(url), { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) {
      var ct = r.headers.get("content-type") || ""; if (!r.ok || ct.indexOf("image") < 0) throw new Error("serviço " + r.status);
      return r.blob();
    }).then(function (b) { return new Promise(function (ok, ko) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = ko; fr.readAsDataURL(b); }); });
  }
  function plWms(caixa, wpx, hpx, preferir) {
    var fontes = [["https://cartografia.dgterritorio.gov.pt/wms/ortos2025", "Ortos2025-RGB", plT("orto25")], ["https://ortos.dgterritorio.gov.pt/wms/ortosat2023", "ortoSat2023-CorVerdadeira", plT("sat23")]];
    if (preferir === "sat") fontes.reverse();
    var i = 0;
    function um() {
      var f = fontes[i]; if (!f) return Promise.reject(new Error(plT("semOrto")));
      var u = f[0] + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=" + f[1] + "&STYLES=&SRS=EPSG:3763&BBOX=" + caixa.map(function (v) { return v.toFixed(2); }).join(",") + "&WIDTH=" + wpx + "&HEIGHT=" + hpx + "&FORMAT=image/jpeg";
      return plImg(u).then(function (d) { return { dados: d, fonte: f[2] }; }, function () { i++; return um(); });
    }
    return um();
  }
  function plSitio(lon, lat) {
    var u = "https://ogcapi.dgterritorio.gov.pt/collections/cont_freguesias/items?f=json&limit=1&bbox=" + [lon - 0.0001, lat - 0.0001, lon + 0.0001, lat + 0.0001].join(",");
    return fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      var p = (j.features && j.features[0] && j.features[0].properties) || {}, fr = "", mu = "";
      Object.keys(p).forEach(function (k) { if (!fr && /fregues/i.test(k) && typeof p[k] === "string") fr = p[k]; if (!mu && /munic|concelho/i.test(k) && typeof p[k] === "string") mu = p[k]; });
      return { freguesia: fr, municipio: mu };
    }).catch(function () { return { freguesia: "", municipio: "" }; });
  }
  // §61 Moldura comum dos PDF de produto e planta de localização em dossier (Nuno, 26/10, 15h17: «a planta de localização
  // passa a ser um pequeno dossier e todos os PDF dos produtos do IPR Atlas passam a ter uma moldura de excelência por
  // omissão»). Funções pm*: cartucho com marca, título, projecto, referência, escala, data, sistema de coordenadas e folha
  // n/N; rosa dos ventos em vector (o desenho da .ipe-rosa do app.js); régua de escalas com segmentos alternados; legenda;
  // caixa «O que está a ver»; fonte, licença e aviso em cada folha. As folhas de extracto usam as camadas do catálogo do
  // viz.js (mesmos URL e camadas), pedidas em PT-TM06 com a caixa exacta da folha de localização. As camadas vectoriais da
  // OGC API da DGT são desenhadas e medidas a partir dos polígonos; as de imagem (ArcGIS/WMS) são medidas por amostragem dos
  // píxeis dentro do limite, e isso fica escrito. Um serviço que falhe dá «serviço indisponível no momento» e o PDF segue.
  var PM_MARCA = "IPR Atlas · Instituto de Planeamento Regenerativo", PM_SRC = "PT-TM06/ETRS89 (EPSG:3763)";
  var PM_AVISO = "Extracto informativo, sem valor de certidão. Algumas câmaras municipais exigem plantas emitidas por elas ou certidões: confirme antes de entregar num processo. Vinculativo é o publicado em Diário da República e no SNIT.";
  var PM_OGC = "https://ogcapi.dgterritorio.gov.pt", PM_ICNF = "https://sigservices.icnf.pt/server/rest/services/BDG/", PM_APA = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/";
  // Reserva, só para quando o catálogo do viz.js não estiver carregado: os mesmos URL e camadas que lá estão.
  var PM_COS = [["#e04b4b", "Artificializado"], ["#f2d16b", "Agricultura"], ["#c7e08a", "Pastagens"], ["#a6c46a", "Agroflorestal"], ["#2e7d32", "Floresta"], ["#9ccc65", "Matos"], ["#d7ccc8", "Sem vegetação"], ["#80deea", "Zonas húmidas"], ["#4fc3f7", "Água"]];
  var PM_RES = {
    ran: { id: "ran", n: "RAN", t: "mvt", col: "srup_ran", cor: "#c9a227", fonte: "DGT · SRUP" },
    ren: { id: "ren", n: "REN", t: "mvt", col: "srup_ren_areal", cor: "#3a8a3a", fonte: "DGT · SRUP", lic: "r" },
    n2k: { id: "n2k", n: "Rede Natura 2000", t: "ags", url: PM_ICNF + "RN2000/MapServer", layers: "show:0,1", cor: "#5aa05a", fonte: "ICNF" },
    rnap: { id: "rnap", n: "Áreas protegidas", t: "ags", url: PM_ICNF + "RNAP/MapServer", layers: "show:0", cor: "#2f6f2f", fonte: "ICNF" },
    la350: { id: "la350", n: "Linhas de água com bacia > 350 ha", t: "ags", url: PM_APA + "Visualizador/DominioPublicoHidrico/MapServer", layers: "show:43", cor: "#1f78b4", fonte: "APA" },
    albzr: { id: "albzr", n: "Albufeiras e lagoas · zona reservada", t: "ags", url: PM_APA + "Visualizador/DominioPublicoHidrico/MapServer", layers: "show:34", cor: "#4fc3f7", fonte: "APA" },
    albuf: { id: "albuf", n: "Albufeiras classificadas", t: "mvt", col: "srup_albufeiras", cor: "#4fc3f7", fonte: "DGT · SRUP" },
    perig_e: { id: "perig_e", n: "Perigosidade estrutural 2020–2030", t: "ags", url: PM_ICNF + "perigosidade_estrutural/MapServer", cor: "#ef6c00", fonte: "ICNF" },
    crus: { id: "crus", n: "PDM · qualificação do solo (CRUS)", t: "mvt", col: "crus", cor: "#c7b65a", nota: "Indicativo; vinculativo é o publicado em DR / SNIT", leg: [["#e9d66b", "Agrícola"], ["#5b9a4b", "Florestal"], ["#c7b65a", "Agroflorestal"], ["#2f6b3a", "Natural"], ["#d9534f", "Urbano"], ["#9b6bb5", "Actividades económicas"], ["#8c6d4f", "Recursos geológicos"], ["#5aa0d8", "Água"]] },
    cad: { id: "cad", n: "Cadastro predial", t: "mvt", col: "cadastro", cor: "#e8dcb5", fonte: "DGT · Cadastro predial" },
    r_curvas: { id: "r_curvas", n: "Curvas de nível (LiDAR DGT)", t: "curvas", cor: "#8c5a2b" },
    sgifr_a: { id: "sgifr_a", n: "Faixas e mosaicos (SGIFR)", t: "mvt", col: "sgifr_areas", cor: "#ff8c42", fonte: "DGT · SGIFR" },
    sgifr_l: { id: "sgifr_l", n: "Rede de gestão · linhas (SGIFR)", t: "mvt", col: "sgifr_linhas", cor: "#e8590c", fonte: "DGT · SGIFR" },
    redeprim: { id: "redeprim", n: "Rede primária de faixas", t: "ags", url: PM_ICNF + "Rede_primaria/MapServer", cor: "#bf360c", fonte: "ICNF" },
    cos23: { id: "cos23", n: "COS 2023 (vector)", t: "mvt", col: "cos2023v1", cor: "#a6c46a", fonte: "DGT", leg: PM_COS },
    cos18: { id: "cos18", n: "COS 2018 (vector)", t: "mvt", col: "cos2018v4", cor: "#c7e08a", fonte: "DGT", leg: PM_COS }
  };
  // Temas das folhas de extracto. «linear»: camadas de linhas, em que só se diz se tocam o terreno (a área não se aplica).
  // «def»: ligada por omissão no diálogo. As seis folhas de 26/10 continuam ligadas; das de 27/10 só o cadastro e a topografia.
  // «pdmc»: planta de condicionantes do PDM (imagem WMS da DGT pelo proxy do site, pdm_<DICO> do §64), só quando o concelho
  // ao centro do terreno tem uma; as camadas resolvem-se no momento (pmTemaCams).
  var PM_TEMAS = [
    { k: "cad", c: ["cad"], def: 1, cad: 1 },
    { k: "topo", c: ["r_curvas"], def: 1, topo: 1 },
    { k: "ran", c: ["ran"], def: 1 },
    { k: "ren", c: ["ren"], def: 1 },
    { k: "natura", c: ["n2k", "rnap"], def: 1 },
    { k: "dph", c: ["la350", "albzr", "albuf"], linear: { la350: 1 }, def: 1 },
    { k: "fogo", c: ["perig_e"], def: 1 },
    { k: "fgc", c: ["perig_e", "sgifr_a", "sgifr_l", "redeprim"], linear: { sgifr_l: 1 } },
    { k: "pdm", c: ["crus"], def: 1 },
    { k: "pdmc", c: [], pdmc: 1 },
    { k: "cos23", c: ["cos23"] },
    { k: "cos18", c: ["cos18"] }
  ];
  PM_TEMAS.forEach(function (t) { Object.defineProperty(t, "t", { get: function () { return plT("t_" + t.k); }, enumerable: true }); });
  // Planta de condicionantes do PDM do concelho: as do §64 (PDM64) e as que o servidor publica para o país todo (§76,
  // /wp-json/tcd/v1/pdm/lista, m90387). Resolve null quando o concelho ainda não tem planta pronta.
  function plPdm(municipio) {
    var k = String(municipio || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    function entrada(id, n) { var e = pmCat(id); return e && e.t === "wmsp" ? Object.assign({}, e, { mun: n }) : { id: id, n: "Planta de condicionantes · " + n, t: "wmsp", src: id, cor: "#b07aa1", fonte: "Câmara Municipal de " + n + " · DGT/SNIT · CC BY 4.0", mun: n }; }
    if (!k) return Promise.resolve(null);
    var p = typeof PDM64 !== "undefined" && PDM64 ? PDM64[k] : null;
    if (p) return Promise.resolve(entrada("pdm_" + p.d, p.n));
    if (typeof PDM_IDS !== "undefined" && PDM_IDS[k]) return Promise.resolve(entrada(PDM_IDS[k], municipio));
    if (typeof pdm76 !== "function") return Promise.resolve(null);
    return new Promise(function (ok) {
      var t = setTimeout(function () { ok(null); }, 15000);
      try { pdm76(k, municipio, function () { clearTimeout(t); ok(PDM_IDS[k] ? entrada(PDM_IDS[k], municipio) : null); }); } catch (e) { clearTimeout(t); ok(null); }
    });
  }
  function pmHex(h) { h = String(h || "#888888").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function pmBanda(W, H) { return W >= 400 || H >= 400 ? 60 : (W < H ? 56 : 52); }
  function pmNum(v, d) { return (+v).toLocaleString(plLoc(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pmEsc(esc) { return "1:" + (+esc).toLocaleString(plLoc()); }
  function pmData(d) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }
  function pmHora(d) { return pmData(d) + " " + ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2); }
  function pmSemAc(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/actividade/g, "atividade"); }
  // Texto com quebra de linhas que não passa de ymax (corta com «…»). Devolve o y seguinte.
  function pmTexto(doc, t, x, y, w, tam, lh, ymax, estilo, cor) {
    doc.setFont("helvetica", estilo || "normal"); doc.setFontSize(tam); var c = cor || [0, 0, 0]; doc.setTextColor(c[0], c[1], c[2]);
    var ls = doc.splitTextToSize(String(t), w);
    for (var i = 0; i < ls.length; i++) {
      if (y > ymax) break;
      var l = ls[i]; if (y + lh > ymax && i < ls.length - 1) l = l.replace(/\s+\S*$/, "") + " …";
      doc.text(l, x, y); y += lh;
    }
    doc.setTextColor(0);
    return y;
  }
  // Rosa dos ventos: o mesmo desenho da .ipe-rosa do Atlas (viewBox 100 × 100), em vector. Norte da quadrícula PT-TM06.
  function pmRosa(doc, cx, cy, R) {
    var s = R / 45; function P(x, y) { return [cx + (x - 50) * s, cy + (y - 50) * s]; }
    var esc = [63, 70, 48];
    doc.setLineDashPattern([], 0);
    doc.setFillColor(250, 247, 238); doc.setDrawColor(esc[0], esc[1], esc[2]); doc.setLineWidth(1.2 * s); doc.circle(cx, cy, 45 * s, "FD");
    doc.setLineWidth(0.6 * s); doc.circle(cx, cy, 41 * s, "S");
    for (var e = 0; e < 72; e++) {
      var a = 5 * e * Math.PI / 180, t = e % 18 === 0 ? 33 : e % 2 === 0 ? 37 : 39;
      var p1 = P(50 + 41 * Math.sin(a), 50 - 41 * Math.cos(a)), p2 = P(50 + t * Math.sin(a), 50 - t * Math.cos(a));
      doc.setLineWidth((e % 18 === 0 ? 1.1 : 0.5) * s); doc.line(p1[0], p1[1], p2[0], p2[1]);
    }
    doc.setLineWidth(0.5 * s); doc.setLineDashPattern([1.5 * s, 1.5 * s], 0); doc.circle(cx, cy, 24 * s, "S"); doc.setLineDashPattern([], 0);
    function ponta(g, comp, larg, ca, cb) {
      var o = g * Math.PI / 180, i = (g + 90) * Math.PI / 180;
      var q = [P(50 + comp * Math.sin(o), 50 - comp * Math.cos(o)), P(50 + larg * Math.sin(i), 50 - larg * Math.cos(i)), P(50, 50), P(50 - larg * Math.sin(i), 50 + larg * Math.cos(i))];
      doc.setFillColor(ca[0], ca[1], ca[2]); doc.triangle(q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], "F");
      doc.setFillColor(cb[0], cb[1], cb[2]); doc.triangle(q[0][0], q[0][1], q[2][0], q[2][1], q[3][0], q[3][1], "F");
    }
    [45, 135, 225, 315].forEach(function (g) { ponta(g, 22, 4, [117, 131, 74], [227, 223, 204]); });
    [90, 180, 270].forEach(function (g) { ponta(g, 31, 6, [63, 70, 48], [201, 195, 173]); });
    ponta(0, 31, 6, [182, 67, 46], [124, 42, 28]);
    doc.setFillColor(250, 247, 238); doc.setLineWidth(0.8 * s); doc.circle(cx, cy, 2.4 * s, "FD");
    var pt = s * 2.835; doc.setFont("courier", "bold");
    doc.setFontSize(11 * pt); doc.setTextColor(182, 67, 46); var n = P(50, 13.5); doc.text("N", n[0], n[1], { align: "center" });
    doc.setFontSize(9 * pt); doc.setTextColor(esc[0], esc[1], esc[2]);
    [["E", 88, 53.2], ["S", 50, 92.5], ["O", 12, 53.2]].forEach(function (l) { var q = P(l[1], l[2]); doc.text(l[0], q[0], q[1], { align: "center" }); });
    doc.setTextColor(0); doc.setFont("helvetica", "normal");
  }
  // Régua de escalas: comprimento redondo (plNice), quatro segmentos alternados, 0, meio e fim, unidade m ou km.
  function pmRegua(doc, x, y, esc, maxmm) {
    var L = plNice(maxmm * esc / 1000), Lmm = L / esc * 1000, km = L >= 1000, u = km ? 1000 : 1;
    function r(v) { return String(Math.round(v / u * 100) / 100).replace(".", ","); }
    doc.setLineDashPattern([], 0); doc.setFillColor(255, 255, 255); doc.setDrawColor(90); doc.setLineWidth(0.2);
    doc.roundedRect(x - 3, y - 8.6, Lmm + 14, 13.4, 1.2, 1.2, "FD");
    doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text(plT("escala") + " " + pmEsc(esc), x, y - 4.4);
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    for (var k = 0; k < 4; k++) { var c = k % 2 ? 255 : 0; doc.setFillColor(c, c, c); doc.rect(x + k * Lmm / 4, y - 1.8, Lmm / 4, 1.8, "FD"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text("0", x, y + 2.8, { align: "center" }); doc.text(r(L / 2), x + Lmm / 2, y + 2.8, { align: "center" }); doc.text(r(L), x + Lmm, y + 2.8, { align: "center" });
    doc.text(km ? "km" : "m", x + Lmm + 2.6, y - 0.2);
    return L;
  }
  // Quadrícula PT-TM06 nas margens da mancha do mapa.
  function pmQuadricula(doc, F) {
    var M = F.M, fw = F.fw, fh = F.fh, caixa = F.caixa, gw = F.gw, gh = F.gh, passo = plNice(gw / 5);
    doc.setDrawColor(0); doc.setLineWidth(0.3); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(0);
    for (var x = Math.ceil(caixa[0] / passo) * passo; x < caixa[2]; x += passo) { var px = M + (x - caixa[0]) / gw * fw; doc.line(px, M, px, M + 2.5); doc.line(px, M + fh, px, M + fh - 2.5); doc.text((PLG === "en" ? "E " : "M ") + Math.round(x), px + 0.6, M + 4.5); }
    for (var y = Math.ceil(caixa[1] / passo) * passo; y < caixa[3]; y += passo) { var py = M + (caixa[3] - y) / gh * fh; doc.line(M, py, M + 2.5, py); doc.line(M + fw, py, M + fw - 2.5, py); doc.text((PLG === "en" ? "N " : "P ") + Math.round(y), M + 3.2, py - 0.6); }
    return passo;
  }
  // Limite do terreno: traço vermelho com auréola branca, para se ler por cima de qualquer tema.
  function pmLimite(doc, F) {
    function mm(p) { return [F.M + (p[0] - F.caixa[0]) / F.gw * F.fw, F.M + (F.caixa[3] - p[1]) / F.gh * F.fh]; }
    [[255, 255, 255, 1.3], [230, 30, 30, 0.6]].forEach(function (e) {
      doc.setDrawColor(e[0], e[1], e[2]); doc.setLineWidth(e[3]);
      F.an.forEach(function (r) { for (var i = 0; i < r.length - 1; i++) { var a = mm(r[i]), b = mm(r[i + 1]); doc.line(a[0], a[1], b[0], b[1]); } });
    });
    doc.setDrawColor(0);
  }
  // Legenda: itens {t: "linha"|"area"|"quadro"|"img", cor, src, iw, ih, txt}. Devolve o y seguinte.
  function pmLegenda(doc, itens, x, y, w, ymax) {
    var lh = 3.5, mostrados = 0;
    for (var i = 0; i < itens.length; i++) {
      if (y + lh > ymax) { pmTexto(doc, plT("maisClasses", { n: itens.length - i, c: plT(itens.length - i === 1 ? "classe" : "classes") }), x, y, w, 5.4, 2.4, ymax + 2, "italic", [90, 90, 90]); return y + 2.6; }
      var it = itens[i], c = it.cor || [0, 0, 0];
      if (it.t === "linha") { doc.setDrawColor(255, 255, 255); doc.setLineWidth(1.3); doc.line(x, y - 1.1, x + 6, y - 1.1); doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(0.6); doc.line(x, y - 1.1, x + 6, y - 1.1); }
      else if (it.t === "quadro") { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(0.5); doc.rect(x + 1.8, y - 2.3, 2.4, 2.4); }
      else if (it.t === "img" && it.src) { try { var ih = 2.8, iw = Math.min(6, ih * (it.iw || 1) / (it.ih || 1)); doc.addImage(it.src, "PNG", x, y - 2.6, iw, ih); } catch (e) { doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y - 2.6, 6, 2.8, "F"); } }
      else { doc.setFillColor(c[0], c[1], c[2]); doc.setDrawColor(60); doc.setLineWidth(0.15); doc.rect(x, y - 2.6, 6, 2.8, "FD"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      var nl = Math.min(2, doc.splitTextToSize(String(it.txt), w - 7.5).length);
      if (nl > 1 && y + lh + 2.4 > ymax) nl = 1;
      pmTexto(doc, it.txt, x + 7.5, y, w - 7.5, 6, 2.4, y + (nl - 1) * 2.4 + 0.1);
      y += lh + (nl - 1) * 2.4; mostrados++;
    }
    doc.setDrawColor(0);
    return y;
  }
  // Moldura de uma folha: S = { titulo, mapa (bool), legenda [itens], legendaImg {src,w,h}, dados [linhas], oQue, fonte, aviso }.
  function pmMoldura(doc, F, S, n, N) {
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = F.M, B = pmBanda(W, H), fw = W - 2 * M;
    var by = H - M - B, xa = M, xb = M + fw * 0.31, xc = M + fw * 0.655, xe = M + fw, p = 2.6, cinz = [85, 85, 85];
    doc.setLineDashPattern([], 0);
    if (S.mapa) {
      doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(M, M, F.fw, F.fh);
      pmQuadricula(doc, F);
      var R = F.A3 ? 13 : 10.5; pmRosa(doc, M + F.fw - R - 4, M + R + 7, R);
      pmRegua(doc, M + 6, M + F.fh - 6.5, F.esc, Math.min(F.A3 ? 75 : 55, F.fw * 0.28));
    }
    doc.setDrawColor(0); doc.setLineWidth(0.35); doc.setFillColor(255, 255, 255); doc.rect(M, by, fw, B, "FD");
    doc.setLineWidth(0.2); doc.line(xb, by, xb, by + B); doc.line(xc, by, xc, by + B);
    var ymax = by + B - 1.8;
    // A · legenda e dados
    var y = pmTexto(doc, plT("legenda"), xa + p, by + 4.6, xb - xa - 2 * p, 7, 3.2, ymax, "bold") + 0.6;
    var reserva = S.dados ? Math.min(S.dados.length, 9) * 2.55 + 1.5 : 0;
    if (S.legendaImg) {
      var lw = xb - xa - 2 * p, lhm = Math.max(8, ymax - reserva - y), k = Math.min(lw / S.legendaImg.w, lhm / S.legendaImg.h, 0.12);
      try { doc.addImage(S.legendaImg.src, "PNG", xa + p, y - 1.5, S.legendaImg.w * k, S.legendaImg.h * k); y += S.legendaImg.h * k + 1; } catch (e) {}
      y = pmLegenda(doc, (S.legenda || []).slice(0, 1), xa + p, y + 2, lw, ymax - reserva);
    } else y = pmLegenda(doc, S.legenda || [], xa + p, y + 1.4, xb - xa - 2 * p, ymax - reserva);
    if (S.dados) { y += 0.6; S.dados.forEach(function (t) { y = pmTexto(doc, t, xa + p, y, xb - xa - 2 * p, 5.8, 2.55, ymax); }); }
    // B · o que está a ver, fonte e licença, aviso
    var wb = xc - xb - 2 * p;
    doc.setFont("helvetica", "italic"); doc.setFontSize(5.4);
    var av = doc.splitTextToSize((S.aviso ? S.aviso + " " : "") + plT("aviso"), wb), yAv = by + B - 2 - (av.length - 1) * 2.3;
    y = pmTexto(doc, plT("oQue"), xb + p, by + 4.6, wb, 7, 3.2, ymax, "bold") + 0.4;
    y = pmTexto(doc, S.oQue || "", xb + p, y, wb, 6.2, 2.7, yAv - 9) + 1;
    pmTexto(doc, S.fonte || "", xb + p, y, wb, 5.4, 2.3, yAv - 3.2, "normal", cinz);
    doc.setDrawColor(170); doc.setLineWidth(0.15); doc.line(xb + p, yAv - 3, xc - p, yAv - 3);
    pmTexto(doc, av.join(" "), xb + p, yAv, wb, 5.4, 2.3, by + B, "italic", cinz);
    // C · cartucho
    var wc = xe - xc, cx = xc + p;
    doc.setFillColor(63, 70, 48); doc.rect(xc, by, wc, 6.2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.6); doc.setTextColor(250, 247, 238);
    doc.text(doc.splitTextToSize(PM_MARCA, wc - 2 * p)[0], cx, by + 4.1); doc.setTextColor(0);
    var yT = pmTexto(doc, String(S.titulo || "").toUpperCase(), cx, by + 10.6, wc - 2 * p, 8.4, 3.4, by + 14.2, "bold");
    var yP = Math.max(yT + 0.6, by + 17.4);
    pmTexto(doc, plT("projecto"), cx, yP, wc - 2 * p, 5, 2, yP + 1, "normal", cinz);
    pmTexto(doc, String(F.nome), cx, yP + 3.1, wc - 2 * p, 7.2, 3, yP + 3.2, "bold");
    doc.setFont("courier", "normal"); doc.setFontSize(6.2); doc.text(plT("ref") + " " + F.ident + " · #" + F.id, cx, yP + 6.3);
    var g0 = by + B - 17.5;
    // Carimbo (27/10): freguesia e concelho pela CAOP; cantos da caixa da folha em PT-TM06, nas folhas com mapa.
    var st = F.sitio || {}, sit = [st.freguesia ? plT("freg", { f: st.freguesia }) : "", st.municipio ? plT("conc", { c: st.municipio }) : ""].filter(Boolean).join(" · ") || plT("sitioNd");
    pmTexto(doc, sit, cx, yP + 9.2, wc - 2 * p, 6, 2.4, yP + 9.3, st.municipio ? "bold" : "italic", st.municipio ? [0, 0, 0] : cinz);
    if (S.mapa) {
      var k4 = F.caixa, en = PLG === "en", mx = en ? "E" : "M", py = en ? "N" : "P", r0 = function (v) { return String(Math.round(v)); };
      function canto(n, x, y) { return n + " " + mx + " " + r0(x) + " " + py + " " + r0(y); }
      var c1 = [canto(en ? "NW" : "NO", k4[0], k4[3]), canto("NE", k4[2], k4[3])], c2 = [canto(en ? "SW" : "SO", k4[0], k4[1]), canto("SE", k4[2], k4[1])];
      var w0 = Math.max(c1[0].length, c2[0].length), pad = function (t) { while (t.length < w0) t += " "; return t; };
      var l1 = pad(c1[0]) + "  " + c1[1], l2 = pad(c2[0]) + "  " + c2[1], tam = 5.4;
      doc.setFont("courier", "normal"); doc.setFontSize(tam);
      while (tam > 4 && doc.getTextWidth(l1.length > l2.length ? l1 : l2) > wc - 2 * p) { tam -= 0.2; doc.setFontSize(tam); }
      doc.setTextColor(cinz[0], cinz[1], cinz[2]); doc.setFont("helvetica", "normal"); doc.setFontSize(4.6); doc.text(plT("cantos"), cx, yP + 11.6);
      doc.setTextColor(0); doc.setFont("courier", "normal"); doc.setFontSize(tam); doc.text(l1, cx, yP + 13.9); doc.text(l2, cx, yP + 16.1);
    } doc.setDrawColor(0); doc.setLineWidth(0.2); doc.line(xc, g0, xe, g0); doc.line(xc, by + B - 9, xe, by + B - 9);
    var cw = wc / 3; doc.line(xc + cw, g0, xc + cw, by + B - 9); doc.line(xc + 2 * cw, g0, xc + 2 * cw, by + B - 9);
    [[plT("escala"), S.mapa ? pmEsc(F.esc) : "—"], [plT("data"), pmData(F.agora)], [plT("folha"), n + " / " + N]].forEach(function (c, i) {
      pmTexto(doc, c[0], xc + i * cw + p, g0 + 2.9, cw - 2 * p, 5, 2, g0 + 3, "normal", cinz);
      pmTexto(doc, c[1], xc + i * cw + p, g0 + 6.7, cw - 2 * p, 7.4, 3, g0 + 6.8, "bold");
    });
    pmTexto(doc, plT("src") + PM_SRC, cx, by + B - 5.2, wc - 2 * p, 5.8, 2.4, by + B - 5, "normal");
    pmTexto(doc, plT("imprimir", { p: W >= 400 || H >= 400 ? "A3" : "A4" }), cx, by + B - 2.2, wc - 2 * p, 5, 2.2, by + B - 2, "normal", cinz);
    doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setDrawColor(0);
  }
  // Pedidos com tempo-limite. As imagens vêm sempre pelo proxy do site (mesma origem: o canvas pode lê-las); o JSON tenta
  // primeiro directo e depois pelo proxy.
  function pmPedir(u, ms, px) {
    var ac = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ac) ac.abort(); }, ms || 25000);
    var url = px ? "/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(u) : u;
    return fetch(url, px ? { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" }, signal: ac && ac.signal } : { credentials: "omit", signal: ac && ac.signal }).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }
  function pmJson(u, ms) {
    function ler(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
    return pmPedir(u, ms, false).then(ler).catch(function () { return pmPedir(u, ms, true).then(ler); });
  }
  function pmImgPx(u, ms) {
    return pmPedir(u, ms || 30000, true).then(function (r) {
      var ct = r.headers.get("content-type") || ""; if (!r.ok || ct.indexOf("image") < 0) throw new Error("serviço " + r.status);
      return r.blob();
    }).then(function (b) { return new Promise(function (ok, ko) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = ko; fr.readAsDataURL(b); }); });
  }
  function pmImagem(src) { return new Promise(function (ok, ko) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ko(new Error("imagem inválida")); }; im.src = src; }); }
  function pmCat(id) {
    var c = window.IPRViz && window.IPRViz.catalogo, e = null;
    if (c && c.forEach) c.forEach(function (x) { if (x && x.id === id) e = x; });
    return e || PM_RES[id] || null;
  }
  function pmFicha(id) { try { return fichasDados()[id] || null; } catch (e) { return null; } }
  function pmHost(e) { try { return new URL(e.t === "mvt" ? PM_OGC : e.url).host; } catch (x) { return ""; } }
  // Máscara do limite na grelha da imagem da folha (wpx × hpx), só no rectângulo que o limite ocupa.
  function pmMascara(F) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, sx = F.wpx / F.gw, sy = F.hpx / F.gh;
    var pr = F.an.map(function (r) { return r.map(function (p) { var q = [(p[0] - F.caixa[0]) * sx, (F.caixa[3] - p[1]) * sy]; x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); return q; }); });
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(F.wpx, Math.ceil(x1)); y1 = Math.min(F.hpx, Math.ceil(y1));
    var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    var c = cv.getContext("2d"); c.translate(-x0, -y0); c.beginPath(); pr.forEach(function (r) { r.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); }); c.fill("evenodd");
    var d = c.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h), tot = 0;
    for (var i = 0; i < m.length; i++) if (d[i * 4 + 3] > 127) { m[i] = 1; tot++; }
    return { x0: x0, y0: y0, w: w, h: h, m: m, tot: tot };
  }
  function pmMedida(cnt, L, F) { var f = L.tot ? cnt / L.tot : 0; return { ha: f * F.area / 10000, pct: f * 100 }; }
  // Elementos vectoriais da OGC API da DGT na caixa da folha (bbox em graus), projectados para PT-TM06.
  function pmItems(col, F) {
    var P = window.proj4("EPSG:3763", "EPSG:4326"), c = F.caixa, bb = [180, 90, -180, -90];
    [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]].forEach(function (p) { var q = P.forward(p); bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]); bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]); });
    var u = PM_OGC + "/collections/" + col + "/items?f=json&limit=1000&bbox=" + bb.map(function (v, i) { return (v + (i < 2 ? -0.0005 : 0.0005)).toFixed(6); }).join(",");
    var fs = [], pag = 0, T = window.proj4("EPSG:4326", "EPSG:3763");
    function um(url) {
      return pmJson(url, 30000).then(function (j) {
        if (!j || !j.features) throw new Error("resposta sem elementos");
        fs = fs.concat(j.features);
        var nx = (j.links || []).filter(function (l) { return l && l.rel === "next" && l.href; })[0];
        if (nx && j.features.length && ++pag < 8) return um(nx.href);
        return fs;
      });
    }
    return um(u).then(function (fs) {
      return fs.map(function (f) {
        var g = f.geometry, pol = [], lin = [];
        function pr(r) { return r.map(function (p) { return T.forward([+p[0], +p[1]]); }); }
        (function andar(g) {
          if (!g) return;
          if (g.type === "Polygon") pol.push(g.coordinates.map(pr));
          else if (g.type === "MultiPolygon") g.coordinates.forEach(function (p) { pol.push(p.map(pr)); });
          else if (g.type === "LineString") lin.push(pr(g.coordinates));
          else if (g.type === "MultiLineString") g.coordinates.forEach(function (l) { lin.push(pr(l)); });
          else if (g.type === "GeometryCollection") g.geometries.forEach(andar);
        })(g);
        return { p: f.properties || {}, pol: pol, lin: lin };
      });
    });
  }
  // Classe de um elemento pela legenda do catálogo (nome contido num dos atributos de texto). Nomes mais longos primeiro.
  function pmClasse(props, leg) {
    if (!leg || !leg.length) return -1;
    var txt = Object.keys(props).map(function (k) { return typeof props[k] === "string" ? pmSemAc(props[k]) : ""; }).join(" | ");
    var ord = leg.map(function (l, i) { return i; }).sort(function (a, b) { return leg[b][1].length - leg[a][1].length; });
    for (var i = 0; i < ord.length; i++) if (txt.indexOf(pmSemAc(leg[ord[i]][1])) >= 0) return ord[i];
    return -1;
  }
  function pmDesenharGeo(c, fs, F, cor, preencher) {
    var sx = F.wpx / F.gw, sy = F.hpx / F.gh;
    function q(p) { return [(p[0] - F.caixa[0]) * sx, (F.caixa[3] - p[1]) * sy]; }
    fs.forEach(function (f) {
      f.pol.forEach(function (pg) {
        c.beginPath(); pg.forEach(function (r) { r.forEach(function (p, i) { var z = q(p); if (i) c.lineTo(z[0], z[1]); else c.moveTo(z[0], z[1]); }); c.closePath(); });
        if (preencher) { c.fillStyle = preencher; c.fill("evenodd"); }
        if (cor) { c.strokeStyle = cor; c.lineWidth = 1.6; c.stroke(); }
      });
      f.lin.forEach(function (l) { c.beginPath(); l.forEach(function (p, i) { var z = q(p); if (i) c.lineTo(z[0], z[1]); else c.moveTo(z[0], z[1]); }); c.strokeStyle = cor || preencher; c.lineWidth = 3; c.stroke(); });
    });
  }
  function pmRgba(h, a) { var c = pmHex(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  // Uma camada vectorial (OGC API): imagem da folha, legenda e medição dentro do limite.
  function pmCamadaMvt(e, F, L, linear) {
    return pmItems(e.col, F).then(function (fs) {
      var leg = e.leg || null, base = typeof e.cor === "string" ? e.cor : "#888888";
      var grupos = {};
      fs.forEach(function (f) { var k = pmClasse(f.p, leg); (grupos[k] || (grupos[k] = [])).push(f); });
      var cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d");
      var classes = [], tot = 0, px = F.gw / F.wpx;
      var mk = document.createElement("canvas"); mk.width = L.w; mk.height = L.h; var mc = mk.getContext("2d");
      var todos = document.createElement("canvas"); todos.width = L.w; todos.height = L.h; var tc = todos.getContext("2d"); tc.translate(-L.x0, -L.y0);
      Object.keys(grupos).forEach(function (k) {
        var cor = +k >= 0 ? leg[+k][0] : base, nome = +k >= 0 ? plCls(leg[+k][1]) : (leg ? plT("outras") : plNome(e));
        pmDesenharGeo(c, grupos[k], F, cor, linear ? null : pmRgba(cor, 0.5));
        pmDesenharGeo(tc, grupos[k], F, linear ? "#000" : null, linear ? null : "#000");
        mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, L.w, L.h); mc.translate(-L.x0, -L.y0);
        pmDesenharGeo(mc, grupos[k], F, linear ? "#000" : null, linear ? null : "#000");
        var d = mc.getImageData(0, 0, L.w, L.h).data, n = 0;
        for (var i = 0; i < L.m.length; i++) if (L.m[i] && d[i * 4 + 3] > 127) n++;
        classes.push({ n: nome, cor: cor, cnt: n });
      });
      var dt = tc.getImageData(0, 0, L.w, L.h).data;
      for (var i = 0; i < L.m.length; i++) if (L.m[i] && dt[i * 4 + 3] > 127) tot++;
      var M0 = pmMedida(tot, L, F);
      classes = classes.filter(function (k) { return k.cnt > 0; }).sort(function (a, b) { return b.cnt - a.cnt; }).map(function (k) { var m = pmMedida(k.cnt, L, F); return { n: k.n, cor: k.cor, ha: m.ha, pct: m.pct }; });
      // Legenda: só as categorias presentes na folha (a legenda completa está no Atlas).
      var itens = leg ? leg.map(function (l, i) { return grupos[i] ? { t: linear ? "linha" : "area", cor: pmHex(l[0]), txt: plCls(l[1]) } : null; }).filter(Boolean) : [{ t: linear ? "linha" : "area", cor: pmHex(base), txt: plNome(e) }];
      if (leg && grupos[-1]) itens.push({ t: "area", cor: pmHex(base), txt: plT("outras") });
      if (!fs.length) itens = [{ t: linear ? "linha" : "area", cor: pmHex(base), txt: plT("nenhum", { n: plNome(e) }) }];
      return { canvas: cv, op: 1, legenda: itens, medida: { ha: M0.ha, pct: M0.pct, presente: tot > 0, classes: leg ? classes : [], n: fs.length, metodo: plT("mVect", { px: pmNum(px, px < 1 ? 2 : 1) }) } };
    });
  }
  // Legenda de um serviço ArcGIS (legend?f=json) ou WMS (GetLegendGraphic), com a cor de cada amostra para classificar.
  function pmLegendaServico(e) {
    if (e.t === "wms") {
      var u = e.url + (e.url.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=" + encodeURIComponent(e.layer) + "&SRS=EPSG:3763";
      return pmImgPx(u, 12000).then(function (src) { return pmImagem(src).then(function (im) { return { img: { src: src, w: im.naturalWidth, h: im.naturalHeight }, itens: [] }; }); });
    }
    if (e.t !== "ags") return Promise.resolve(null);
    var ids = /^show:([\d,]+)$/.exec(e.layers || ""); ids = ids ? ids[1].split(",").map(Number) : null;
    return pmJson(e.url + "/legend?f=json", 12000).then(function (j) {
      var its = [];
      (j.layers || []).forEach(function (l) {
        if (ids && ids.indexOf(+l.layerId) < 0) return;
        (l.legend || []).forEach(function (g) { if (g.imageData) its.push({ t: "img", src: "data:" + (g.contentType || "image/png") + ";base64," + g.imageData, txt: g.label || l.layerName || e.n }); });
      });
      if (!its.length) return null;
      return Promise.all(its.map(function (it) {
        return pmImagem(it.src).then(function (im) {
          it.iw = im.naturalWidth; it.ih = im.naturalHeight;
          var cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; var c = cv.getContext("2d"); c.drawImage(im, 0, 0);
          var d = c.getImageData(0, 0, cv.width, cv.height).data, conta = {}, melhor = null, mx = 0;
          for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; var k = (d[i] >> 3) + "," + (d[i + 1] >> 3) + "," + (d[i + 2] >> 3); conta[k] = (conta[k] || 0) + 1; if (conta[k] > mx) { mx = conta[k]; melhor = [d[i], d[i + 1], d[i + 2]]; } }
          it.cor = melhor || pmHex(e.cor); return it;
        }, function () { it.cor = pmHex(e.cor); return it; });
      })).then(function (its) { return { itens: its }; });
    }).catch(function () { return null; });
  }
  // Uma camada de imagem (ArcGIS export ou WMS GetMap), em EPSG:3763 com a caixa exacta; medição por amostragem de píxeis.
  function pmCamadaImg(e, F, L, linear) {
    var bb = F.caixa.map(function (v) { return v.toFixed(2); }).join(","), u;
    if (e.t === "ags") u = e.url + "/export?bbox=" + bb + "&bboxSR=3763&imageSR=3763&size=" + F.wpx + "," + F.hpx + "&format=png32&transparent=true&dpi=96&f=image" + (e.dyn ? "&dynamicLayers=" + encodeURIComponent(e.dyn) : e.layers ? "&layers=" + encodeURIComponent(e.layers) : "");
    else u = e.url + (e.url.indexOf("?") < 0 ? "?" : "&") + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=" + encodeURIComponent(e.layer) + "&STYLES=&SRS=EPSG:3763&BBOX=" + bb + "&WIDTH=" + F.wpx + "&HEIGHT=" + F.hpx + "&FORMAT=image/png&TRANSPARENT=TRUE";
    return Promise.all([pmImgPx(u, 35000).then(pmImagem), pmLegendaServico(e)]).then(function (R) {
      var im = R[0], lg = R[1], cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d"); c.drawImage(im, 0, 0, F.wpx, F.hpx);
      var d = c.getImageData(L.x0, L.y0, L.w, L.h).data, sw = lg && lg.itens && lg.itens.length > 1 ? lg.itens : null, cont = sw ? sw.map(function () { return 0; }) : null, outras = 0, tot = 0;
      for (var i = 0; i < L.m.length; i++) {
        if (!L.m[i] || d[i * 4 + 3] < 40) continue; tot++;
        if (sw) { var bi = -1, bd = 1e9; for (var k = 0; k < sw.length; k++) { var a = d[i * 4] - sw[k].cor[0], b = d[i * 4 + 1] - sw[k].cor[1], g = d[i * 4 + 2] - sw[k].cor[2], dd = a * a + b * b + g * g; if (dd < bd) { bd = dd; bi = k; } } if (bd < 3600) cont[bi]++; else outras++; }
      }
      var px = F.gw / F.wpx, M0 = pmMedida(tot, L, F), classes = [];
      if (sw) { sw.forEach(function (s, k) { if (cont[k]) { var m = pmMedida(cont[k], L, F); classes.push({ n: s.txt, cor: s.cor, ha: m.ha, pct: m.pct }); } }); if (outras) { var m2 = pmMedida(outras, L, F); classes.push({ n: plT("semCor"), ha: m2.ha, pct: m2.pct }); } classes.sort(function (a, b) { return b.pct - a.pct; }); }
      var itens = lg && lg.itens && lg.itens.length ? lg.itens : [{ t: linear ? "linha" : "area", cor: pmHex(e.cor), txt: plNome(e) }];
      return { canvas: cv, op: 0.8, legenda: itens, legendaImg: lg && lg.img, medida: { ha: M0.ha, pct: M0.pct, presente: tot > 0, classes: classes, imagem: 1, metodo: plT("mImg", { px: pmNum(px, px < 1 ? 2 : 1) }) } };
    });
  }
  // 27/10 · Teselas XYZ (Web Mercator) reprojectadas para a caixa PT-TM06 da folha: plantas de condicionantes do PDM (proxy
  // WMS do site, que só aceita mosaicos 256 px, m90379) e modelo de elevação Mapterhorn (terrarium) para as curvas de nível.
  function pmLL(F) {
    var P = window.proj4("EPSG:3763", "EPSG:4326"), c = F.caixa, bb = [180, 90, -180, -90], mx = (c[0] + c[2]) / 2, my = (c[1] + c[3]) / 2;
    [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]], [mx, c[1]], [mx, c[3]], [c[0], my], [c[2], my]].forEach(function (p) { var q = P.forward(p); bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]); bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]); });
    return bb;
  }
  function pmTxy(lon, lat, z) { var n = Math.pow(2, z), r = lat * Math.PI / 180; return [(lon + 180) / 360 * n, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n]; }
  function pmNTeselas(F, z) { var bb = pmLL(F), a = pmTxy(bb[0], bb[3], z), b = pmTxy(bb[2], bb[1], z); return (Math.floor(b[0]) - Math.floor(a[0]) + 1) * (Math.floor(b[1]) - Math.floor(a[1]) + 1); }
  // Nível de teselas: píxel da tesela próximo de «res» metros no terreno, sem passar de «max» teselas.
  function pmNivel(F, res, ts, zmin, zmax, max) {
    var lat = window.proj4("EPSG:3763", "EPSG:4326", [(F.caixa[0] + F.caixa[2]) / 2, (F.caixa[1] + F.caixa[3]) / 2])[1];
    var z = Math.max(zmin, Math.min(zmax, Math.round(Math.log(40075016.686 * Math.cos(lat * Math.PI / 180) / (ts * res)) / Math.LN2)));
    while (z > zmin && pmNTeselas(F, z) > max) z--;
    return z;
  }
  function pmBlobImg(b) { return new Promise(function (ok, ko) { var u = URL.createObjectURL(b), im = new Image(); im.onload = function () { ok(im); setTimeout(function () { URL.revokeObjectURL(u); }, 0); }; im.onerror = function () { URL.revokeObjectURL(u); ko(new Error("imagem inválida")); }; im.src = u; }); }
  function pmMosaico(url, F, z) {
    var bb = pmLL(F), a = pmTxy(bb[0], bb[3], z), b = pmTxy(bb[2], bb[1], z), tx0 = Math.floor(a[0]), ty0 = Math.floor(a[1]), tx1 = Math.floor(b[0]), ty1 = Math.floor(b[1]);
    var lista = [], ims = [], falhas = 0, i = 0;
    for (var y = ty0; y <= ty1; y++) for (var x = tx0; x <= tx1; x++) lista.push([x, y]);
    function chk(r) { var ct = r.headers.get("content-type") || ""; if (!r.ok || ct.indexOf("image") < 0) throw new Error("serviço " + r.status); return r.blob(); }
    function um(t) {
      var u = url(z, t[0], t[1]), abs = /^https?:/.test(u);
      return (abs ? pmPedir(u, 20000, false).then(chk).catch(function () { return pmPedir(u, 20000, true).then(chk); }) : pmPedir(u, 30000, false).then(chk)).then(pmBlobImg)
        .then(function (im) { if (im.naturalWidth < 8) throw new Error("vazio"); ims.push([t, im]); }, function () { falhas++; });
    }
    function fio() { if (i >= lista.length) return Promise.resolve(); return um(lista[i++]).then(fio); }
    return Promise.all([fio(), fio(), fio(), fio()]).then(function () {
      var ts = ims.length ? ims[0][1].naturalWidth : 256, cv = document.createElement("canvas"); cv.width = (tx1 - tx0 + 1) * ts; cv.height = (ty1 - ty0 + 1) * ts;
      var c = cv.getContext("2d"); ims.forEach(function (p) { c.drawImage(p[1], (p[0][0] - tx0) * ts, (p[0][1] - ty0) * ts, ts, ts); });
      return { cv: cv, z: z, tx0: tx0, ty0: ty0, ts: ts, falhas: falhas, total: lista.length };
    });
  }
  // Função (px, py) da grelha de saída (w × h sobre a caixa) para o píxel do mosaico; proj4 de 8 em 8 e interpolação.
  function pmGrelha(mos, F, w, h) {
    var P = window.proj4("EPSG:3763", "EPSG:4326"), s = 8, gx = Math.ceil(w / s) + 2, gy = Math.ceil(h / s) + 2, ax = new Float64Array(gx * gy), ay = new Float64Array(gx * gy);
    for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) {
      var q = P.forward([F.caixa[0] + i * s / w * F.gw, F.caixa[3] - j * s / h * F.gh]), t = pmTxy(q[0], q[1], mos.z);
      ax[j * gx + i] = (t[0] - mos.tx0) * mos.ts; ay[j * gx + i] = (t[1] - mos.ty0) * mos.ts;
    }
    return function (px, py) {
      var fx = px / s, fy = py / s, i = Math.max(0, Math.min(gx - 2, Math.floor(fx))), j = Math.max(0, Math.min(gy - 2, Math.floor(fy))), u = fx - i, v = fy - j, k = j * gx + i;
      return [ax[k] * (1 - u) * (1 - v) + ax[k + 1] * u * (1 - v) + ax[k + gx] * (1 - u) * v + ax[k + gx + 1] * u * v, ay[k] * (1 - u) * (1 - v) + ay[k + 1] * u * (1 - v) + ay[k + gx] * (1 - u) * v + ay[k + gx + 1] * u * v];
    };
  }
  function pmReproj(mos, F) {
    var w = F.wpx, h = F.hpx, g = pmGrelha(mos, F, w, h), sw = mos.cv.width, sh = mos.cv.height, src = mos.cv.getContext("2d").getImageData(0, 0, sw, sh).data;
    var cv = document.createElement("canvas"); cv.width = w; cv.height = h; var c = cv.getContext("2d"), out = c.createImageData(w, h), d = out.data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var m = g(x + 0.5, y + 0.5), mx = m[0] | 0, my = m[1] | 0; if (mx < 0 || my < 0 || mx >= sw || my >= sh) continue;
      var a = (my * sw + mx) * 4, o = (y * w + x) * 4; d[o] = src[a]; d[o + 1] = src[a + 1]; d[o + 2] = src[a + 2]; d[o + 3] = src[a + 3];
    }
    c.putImageData(out, 0, 0); return cv;
  }
  // Planta de condicionantes do PDM (imagem): sem medição de áreas, legenda oficial pelo próprio proxy (?leg=1).
  function pmCamadaWmsp(e, F) {
    var o = 20037508.342789244, z = pmNivel(F, F.gw / F.wpx, 256, 10, 18, 48);
    function url(z, x, y) { var l = 2 * o / Math.pow(2, z), x0 = -o + x * l, y1 = o - y * l; return "/wp-json/tcd/v1/wms/" + e.src + "?bbox=" + [x0, y1 - l, x0 + l, y1].join(","); }
    var leg = pmPedir("/wp-json/tcd/v1/wms/" + e.src + "?leg=1", 15000, false).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      return new Promise(function (ok, ko) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = ko; fr.readAsDataURL(b); });
    }).then(function (src) { return pmImagem(src).then(function (im) { return im.naturalWidth > 8 ? { src: src, w: im.naturalWidth, h: im.naturalHeight } : null; }); }).catch(function () { return null; });
    return Promise.all([pmMosaico(url, F, z), leg]).then(function (R) {
      var mos = R[0]; if (mos.falhas >= mos.total) throw new Error("serviço sem resposta");
      var nome = e.mun ? plT("pdmNome", { m: e.mun }) : plNome(e), mun = e.mun || String(e.n || "").replace(/^.*·\s*/, "");
      return { canvas: pmReproj(mos, F), op: 0.85, legenda: [{ t: "area", cor: pmHex(e.cor || "#b07aa1"), txt: nome }], legendaImg: R[1],
        medida: { semMedida: 1, presente: true, metodo: plT("pdmMetodo") }, oQue: plT("pdmNota"), fonteTxt: plT("pdmFonte", { m: mun }) };
    });
  }
  // Cadastro: limites de todas as parcelas da folha; as que o terreno abrange ficam realçadas, com referência e área abrangida.
  function pmRefCad(p) {
    var ks = ["nationalcadastralreference", "national_cadastral_reference", "referencia", "referencia_cadastral", "label", "inspireid", "localid"];
    for (var i = 0; i < ks.length; i++) for (var k in p) if (k.toLowerCase() === ks[i] && p[k] != null && String(p[k]).trim()) return String(p[k]).trim();
    return "";
  }
  function pmCamadaCad(e, F, L) {
    return pmItems(e.col, F).then(function (fs) {
      var cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d");
      var lb = [1e12, 1e12, -1e12, -1e12]; F.an.forEach(function (r) { r.forEach(function (q) { lb[0] = Math.min(lb[0], q[0]); lb[1] = Math.min(lb[1], q[1]); lb[2] = Math.max(lb[2], q[0]); lb[3] = Math.max(lb[3], q[1]); }); });
      var mk = document.createElement("canvas"); mk.width = L.w; mk.height = L.h; var mc = mk.getContext("2d"), toca = [], tot = 0, todos = new Uint8Array(L.m.length);
      fs.forEach(function (f) {
        var b = [1e12, 1e12, -1e12, -1e12]; f.pol.forEach(function (pg) { pg[0].forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); });
        if (b[0] > lb[2] || b[2] < lb[0] || b[1] > lb[3] || b[3] < lb[1]) return;
        mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, L.w, L.h); mc.translate(-L.x0, -L.y0); pmDesenharGeo(mc, [f], F, null, "#000");
        var d = mc.getImageData(0, 0, L.w, L.h).data, n = 0;
        for (var i = 0; i < L.m.length; i++) if (L.m[i] && d[i * 4 + 3] > 127) { n++; todos[i] = 1; }
        if (n) { f.toca = 1; toca.push({ f: f, n: n, b: b }); }
      });
      for (var i = 0; i < todos.length; i++) tot += todos[i];
      pmDesenharGeo(c, fs.filter(function (f) { return f.toca; }), F, null, "rgba(244,211,94,0.42)");
      c.lineJoin = "round"; pmDesenharGeo(c, fs, F, "rgba(255,255,255,0.9)", null);
      fs.forEach(function (f) { pmDesenharGeo(c, [f], F, f.toca ? "#8a5a00" : "#5d4037", null); });
      // Referência no centro de cada parcela abrangida (até 40).
      var sx = F.wpx / F.gw, sy = F.hpx / F.gh, fsz = Math.max(11, Math.round(F.wpx / 110));
      c.font = "600 " + fsz + "px Helvetica, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      toca.sort(function (a, b) { return b.n - a.n; }).slice(0, 40).forEach(function (t, i) {
        var ref = pmRefCad(t.f.p) || String(i + 1), x = ((t.b[0] + t.b[2]) / 2 - F.caixa[0]) * sx, y = (F.caixa[3] - (t.b[1] + t.b[3]) / 2) * sy;
        c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.95)"; c.strokeText(ref, x, y); c.fillStyle = "#3e2723"; c.fillText(ref, x, y);
      });
      var px = F.gw / F.wpx, M0 = pmMedida(tot, L, F);
      var classes = toca.map(function (t, i) { var m = pmMedida(t.n, L, F); return { n: pmRefCad(t.f.p) || plT("cadSem"), ha: m.ha, pct: m.pct, cor: "#f4d35e" }; });
      var itens = [{ t: "linha", cor: [93, 64, 55], txt: plT("cadLeg") }, { t: "area", cor: [244, 211, 94], txt: plT("cadToca") + " (" + toca.length + ")" }];
      if (!fs.length) itens = [{ t: "linha", cor: [93, 64, 55], txt: plT("nenhum", { n: plNome(e) }) }];
      return { canvas: cv, op: 1, legenda: itens, oQue: plT("cadOQue") + " " + plT("cadNota"),
        medida: { ha: M0.ha, pct: M0.pct, presente: tot > 0, classes: classes, n: fs.length, metodo: plT("cadMetodo", { px: pmNum(px, px < 1 ? 2 : 1) }) } };
    });
  }
  // Curvas de nível: da Base Cartográfica do projecto quando foi entregue (GeoJSON curvasN), senão calculadas do Mapterhorn.
  var PM_EQ = { 1000: [1, 5], 2000: [1, 5], 5000: [2, 10], 10000: [5, 25], 25000: [10, 50] };
  var PM_BASE_CURVAS = { 1000: ["curvas1", "curvas05", "curvas2"], 2000: ["curvas1", "curvas2", "curvas05"], 5000: ["curvas2", "curvas5", "curvas1"], 10000: ["curvas5", "curvas2"], 25000: ["curvas5"] };
  function pmCurvasBase(F, dl) {
    var tem = {}; (dl || []).forEach(function (d) { var m = /(?:^|\/)(curvas(?:05|1|2|5))\.geojson$/i.exec(String(d && d.nome || "")); if (m && d.url) tem[m[1].toLowerCase()] = d.url; });
    var lid = (PM_BASE_CURVAS[F.esc] || ["curvas5"]).filter(function (k) { return tem[k]; })[0];
    if (!lid) return Promise.reject(new Error("sem Base"));
    var eq = { curvas05: 0.5, curvas1: 1, curvas2: 2, curvas5: 5 }[lid], ms = eq * 5, T = window.proj4("EPSG:4326", "EPSG:3763");
    return pmJson(tem[lid], 60000).then(function (j) {
      var cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d"), sx = F.wpx / F.gw, sy = F.hpx / F.gh, n = 0;
      c.lineJoin = "round"; c.lineCap = "round";
      (j.features || []).forEach(function (f) {
        var p = f.properties || {}, z = null; for (var k in p) if (/^(elev|elevation|cota|z|altitude|alt|level|value|contour)$/i.test(k) && isFinite(+p[k])) { z = +p[k]; break; }
        var mestra = z != null && Math.abs(z / ms - Math.round(z / ms)) < 1e-6, ls = [];
        (function andar(g) { if (!g) return; if (g.type === "LineString") ls.push(g.coordinates); else if (g.type === "MultiLineString") g.coordinates.forEach(function (l) { ls.push(l); }); else if (g.type === "GeometryCollection") g.geometries.forEach(andar); })(f.geometry);
        c.beginPath(); ls.forEach(function (l) { l.forEach(function (q, i) { var t = T.forward([+q[0], +q[1]]), x = (t[0] - F.caixa[0]) * sx, y = (F.caixa[3] - t[1]) * sy; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); });
        c.strokeStyle = mestra ? "#7a4a1e" : "#a8743f"; c.lineWidth = mestra ? 2.2 : 1.1; c.stroke(); n++;
      });
      if (!n) throw new Error("Base sem curvas");
      var nome = lid.replace("curvas", "curvas ").replace(" 05", " 0,5") + " m";
      return { canvas: cv, op: 1, legenda: [{ t: "linha", cor: [122, 74, 30], txt: plT("topoMestra", { m: pmNum(ms, ms % 1 ? 1 : 0) }) }, { t: "linha", cor: [168, 116, 63], txt: plT("topoCurva", { e: pmNum(eq, eq % 1 ? 1 : 0) }) }],
        medida: { topo: 1, presente: true, metodo: plT("topoMetodo") }, oQue: plT("topoOQueBase", { f: nome, e: pmNum(eq, eq % 1 ? 1 : 0) }), fonteTxt: plT("topoFonteBase") };
    });
  }
  function pmCurvasDem(F, L) {
    var cell = Math.max(F.gw / 700, 1), gw = Math.round(F.gw / cell), gh = Math.round(F.gh / cell), nx = gw + 1, ny = gh + 1, q = PM_EQ[F.esc] || [5, 25], eq = q[0], ms = q[1];
    function url(z, x, y) { return "https://tiles.mapterhorn.com/" + z + "/" + x + "/" + y + ".webp"; }
    function tentar(z, resta) { return pmMosaico(url, F, z).then(function (m) { return m.falhas * 3 > m.total && resta > 0 && z > 10 ? tentar(z - 1, resta - 1) : m; }); }
    return tentar(pmNivel(F, cell, 512, 8, 15, 36), 2).then(function (mos) {
      if (mos.falhas >= mos.total) throw new Error(plT("topoSem"));
      var g = pmGrelha(mos, F, gw, gh), sw = mos.cv.width, sh = mos.cv.height, d = mos.cv.getContext("2d").getImageData(0, 0, sw, sh).data, E0 = new Float32Array(nx * ny);
      for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
        var m = g(i, j), mx = Math.min(sw - 1, Math.max(0, Math.round(m[0] - 0.5))), my = Math.min(sh - 1, Math.max(0, Math.round(m[1] - 0.5))), a = (my * sw + mx) * 4;
        E0[j * nx + i] = d[a + 3] < 128 ? NaN : d[a] * 256 + d[a + 1] + d[a + 2] / 256 - 32768;
      }
      // Suavização 3 × 3 (o modelo é reamostrado; evita curvas em escada).
      var E = new Float32Array(nx * ny), lo = Infinity, hi = -Infinity;
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        var s = 0, n = 0; for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; var v = E0[jj * nx + ii]; if (v === v) { s += v; n++; } }
        E[j * nx + i] = n ? s / n : NaN; if (n) { lo = Math.min(lo, s / n); hi = Math.max(hi, s / n); }
      }
      if (!(hi >= lo)) throw new Error(plT("topoSem"));
      while ((hi - lo) / eq > 300) { eq *= 2; ms *= 2; }
      var cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d"), kx = F.wpx / gw, ky = F.hpx / gh;
      c.lineCap = "round";
      for (var nv = Math.ceil(lo / eq) * eq; nv <= hi; nv += eq) {
        var mestra = Math.abs(nv / ms - Math.round(nv / ms)) < 1e-6;
        c.beginPath();
        for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
          var k = j * nx + i, A = E[k], B = E[k + 1], C = E[k + nx + 1], D = E[k + nx];
          if (A !== A || B !== B || C !== C || D !== D) continue;
          var id = (A > nv ? 8 : 0) | (B > nv ? 4 : 0) | (C > nv ? 2 : 0) | (D > nv ? 1 : 0); if (id === 0 || id === 15) continue;
          var T = [i + (nv - A) / (B - A), j], R = [i + 1, j + (nv - B) / (C - B)], Bo = [i + (nv - D) / (C - D), j + 1], Le = [i, j + (nv - A) / (D - A)];
          var sg = id === 1 || id === 14 ? [Le, Bo] : id === 2 || id === 13 ? [Bo, R] : id === 3 || id === 12 ? [Le, R] : id === 4 || id === 11 ? [T, R] : id === 6 || id === 9 ? [T, Bo] : id === 7 || id === 8 ? [T, Le] : id === 5 ? [T, R, Le, Bo] : [T, Le, Bo, R];
          for (var t = 0; t < sg.length; t += 2) { c.moveTo(sg[t][0] * kx, sg[t][1] * ky); c.lineTo(sg[t + 1][0] * kx, sg[t + 1][1] * ky); }
        }
        c.strokeStyle = mestra ? "#7a4a1e" : "#a8743f"; c.lineWidth = mestra ? 2.2 : 1.1; c.stroke();
      }
      // Cotas dentro do limite.
      var cmin = Infinity, cmax = -Infinity, csum = 0, cn = 0;
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        var lx = Math.floor(i * kx) - L.x0, ly = Math.floor(j * ky) - L.y0, v2 = E[j * nx + i];
        if (lx < 0 || ly < 0 || lx >= L.w || ly >= L.h || !L.m[ly * L.w + lx] || v2 !== v2) continue;
        cmin = Math.min(cmin, v2); cmax = Math.max(cmax, v2); csum += v2; cn++;
      }
      var res = 40075016.686 * Math.cos(window.proj4("EPSG:3763", "EPSG:4326", [(F.caixa[0] + F.caixa[2]) / 2, (F.caixa[1] + F.caixa[3]) / 2])[1] * Math.PI / 180) / (mos.ts * Math.pow(2, mos.z));
      var cotas = cn ? plT("topoCotas", { a: pmNum(cmin, 1), b: pmNum(cmax, 1), c: pmNum(csum / cn, 1) }) : "";
      return { canvas: cv, op: 1, legenda: [{ t: "linha", cor: [122, 74, 30], txt: plT("topoMestra", { m: pmNum(ms) }) }, { t: "linha", cor: [168, 116, 63], txt: plT("topoCurva", { e: pmNum(eq) }) }],
        medida: { topo: 1, presente: true, metodo: plT("topoMetodo") + (cotas ? ". " + cotas : "") },
        oQue: plT("topoOQueDem", { z: mos.z, r: pmNum(res, 1), e: pmNum(eq), m: pmNum(ms) }) + (cotas ? " " + cotas : ""), fonteTxt: plT("topoFonteDem") };
    });
  }
  function pmCamadaTopo(F, L) { return pmCurvasBase(F, F.downloads).catch(function () { return pmCurvasDem(F, L); }); }
  // Data ou versão do serviço, quando o próprio serviço a declara; senão fica só a data da consulta.
  function pmMeta(e) {
    var u = e.t === "mvt" ? PM_OGC + "/collections/" + e.col + "?f=json" : e.url + (e.t === "ags" ? "?f=json" : "");
    if (e.t !== "mvt" && e.t !== "ags") return Promise.resolve("");
    return pmJson(u, 8000).then(function (j) {
      var t = [];
      if (e.t === "mvt") { var iv = j && j.extent && j.extent.temporal && j.extent.temporal.interval && j.extent.temporal.interval[0]; if (iv && iv[0]) t.push(plT("dadosDe", { a: String(iv[0]).slice(0, 10) }) + (iv[1] ? plT("dadosA", { b: String(iv[1]).slice(0, 10) }) : "")); if (j && j.updated) t.push(plT("actual", { d: String(j.updated).slice(0, 10) })); }
      else { if (j && j.copyrightText) t.push(String(j.copyrightText).replace(/\s+/g, " ").slice(0, 90)); if (j && j.currentVersion) t.push("ArcGIS Server " + j.currentVersion); }
      return t.join(", ");
    }).catch(function () { return ""; });
  }
  function pmTema(tema, F, L, fundo) {
    var cams = tema.pdmc ? [F.pdm] : tema.topo ? [pmCat("r_curvas") || PM_RES.r_curvas] : tema.c.map(pmCat);
    cams = cams.filter(Boolean);
    return Promise.all(cams.map(function (e) {
      var lin = !!(tema.linear && tema.linear[e.id]);
      var p = tema.topo ? pmCamadaTopo(F, L) : tema.cad ? pmCamadaCad(e, F, L) : e.t === "wmsp" ? pmCamadaWmsp(e, F) : e.t === "mvt" ? pmCamadaMvt(e, F, L, lin) : (e.t === "ags" || e.t === "wms") ? pmCamadaImg(e, F, L, lin) : Promise.reject(new Error(plT("semTipo")));
      return Promise.all([p, pmMeta(e)]).then(function (R) { R[0].ent = e; R[0].linear = lin; R[0].meta = R[1]; return R[0]; }, function (x) { return { ent: e, linear: lin, erro: (x && x.message) || String(x) }; });
    })).then(function (rs) {
      return pmImagem(fundo).then(function (im0) {
        var cv = document.createElement("canvas"); cv.width = F.wpx; cv.height = F.hpx; var c = cv.getContext("2d");
        c.fillStyle = "#fff"; c.fillRect(0, 0, F.wpx, F.hpx); c.globalAlpha = 0.45; c.drawImage(im0, 0, 0, F.wpx, F.hpx); c.globalAlpha = 1;
        rs.forEach(function (r) { if (r.canvas) { c.globalAlpha = r.op; c.drawImage(r.canvas, 0, 0); c.globalAlpha = 1; r.canvas = null; } });
        return { tema: tema, rs: rs, img: cv.toDataURL("image/jpeg", 0.86), indisponivel: !rs.some(function (r) { return !r.erro; }) };
      });
    });
  }
  // Textos da folha de um tema: o que está a ver, fonte e licença, legenda.
  function pmFolhaTema(T, F, fundoTxt) {
    var en = PLG === "en", leg = [{ t: "linha", cor: [230, 30, 30], txt: plT("limite") }], legImg = null;
    T.rs.forEach(function (r) {
      if (r.erro) { leg.push({ t: "area", cor: [235, 235, 235], txt: plT("indisp", { n: plNome(r.ent) }) }); return; }
      if (r.legendaImg && !legImg) legImg = r.legendaImg;
      (r.legenda || []).forEach(function (it) { leg.push(it); });
    });
    // Texto próprio da folha (cadastro, topografia, planta do PDM) ou a ficha da camada; em inglês, o nome da camada.
    var o = T.rs.map(function (r) { if (r.oQue) return r.oQue; var f = pmFicha(r.ent.id); return (!en && f && f.o && f.o.indexOf("a confirmar") < 0) ? f.o : plNome(r.ent) + "."; });
    var notas = en ? [] : T.rs.map(function (r) { return r.oQue ? "" : r.ent.nota || ""; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    var oQue = o.join(" ") + plT("sobreOrto") + (notas.length ? " " + notas.join(". ") + "." : "");
    if (T.indisponivel) oQue = plT("indispOQue", { n: T.rs.map(function (r) { return plNome(r.ent); }).join(", ") }) + T.rs.map(function (r) { var f = pmFicha(r.ent.id); return (!en && f && f.o && f.o.indexOf("a confirmar") < 0) ? f.o : plNome(r.ent) + "."; }).join(" ");
    var fonte = plT("fonte") + T.rs.map(function (r) {
      var f = pmFicha(r.ent.id), fo = r.fonteTxt || r.ent.fonte || (f && f.f && f.f.indexOf("a confirmar") < 0 ? f.f : "") || pmHost(r.ent), h = pmHost(r.ent);
      return plNome(r.ent) + " · " + fo + (h && !r.fonteTxt ? " (" + h + ")" : "") + (r.meta ? ", " + r.meta : "") + (r.erro ? plT("semResp") : "");
    }).join("; ") + plT("licenca") + (T.rs.some(function (r) { return r.ent.lic === "r"; }) ? plT("soConsulta") : "") + plT("consultado", { h: pmHora(F.agora), f: fundoTxt });
    return { titulo: plT("extracto", { t: T.tema.t }), mapa: true, legenda: leg, legendaImg: legImg, oQue: oQue, fonte: fonte };
  }
  // Quadro de síntese: área abrangida (ha) e % do terreno por condicionante; nunca números que o serviço não deu.
  function pmSintese(doc, F, temas) {
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = F.M, ymax = H - M - pmBanda(W, H) - 6;
    var x = M + 2, w = W - 2 * M - 4, cols = [0, 0.25, 0.53, 0.63, 0.71].map(function (f) { return x + w * f; });
    doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(plT("sinTit"), x, M + 7);
    var y = pmTexto(doc, plT("sinIntro", { a: pmNum(F.area / 10000, 2) }), x, M + 12.5, w, 7.5, 3.3, ymax);
    y += 2;
    function cab() {
      doc.setFillColor(63, 70, 48); doc.rect(x - 1, y - 3.6, w + 2, 5.2, "F"); doc.setTextColor(250, 247, 238); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      [plT("cTema"), plT("cCamada"), plT("cArea"), plT("cPct"), plT("cMetodo")].forEach(function (t, i) { doc.text(t, cols[i] + (i === 2 || i === 3 ? (cols[i + 1] - cols[i]) - 3 : 0), y, i === 2 || i === 3 ? { align: "right" } : undefined); });
      doc.setTextColor(0); y += 4.6;
    }
    var pags = [doc.getNumberOfPages()];
    cab();
    var fundo = 0;
    function linha(c, op) {
      op = op || {}; var ws = [cols[1] - cols[0] - 3, cols[2] - cols[1] - 3 - (op.peq ? 3 : 0), x + w - cols[4]], ls = [];
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); ls[0] = doc.splitTextToSize(String(c[0] || ""), ws[0]);
      doc.setFont("helvetica", "normal"); doc.setFontSize(op.peq ? 6.4 : 7); ls[1] = doc.splitTextToSize(String(c[1] || ""), ws[1]);
      doc.setFontSize(6.2); ls[2] = doc.splitTextToSize(String(c[4] || ""), ws[2]);
      var n = Math.max(ls[0].length, ls[1].length, ls[2].length, 1), h = n * 2.9 + 1.6;
      if (y + h > ymax) { doc.addPage(); pags.push(doc.getNumberOfPages()); y = M + 8; fundo = 0; cab(); } // continua na folha seguinte
      if (fundo++ % 2 === 0 && !op.peq) { doc.setFillColor(244, 242, 234); doc.rect(x - 1, y - 3, w + 2, h, "F"); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); ls[0].forEach(function (l, i) { doc.text(l, cols[0], y + i * 2.9); });
      doc.setFont("helvetica", "normal"); doc.setFontSize(op.peq ? 6.4 : 7); ls[1].forEach(function (l, i) { doc.text(l, cols[1] + (op.peq ? 3 : 0), y + i * 2.9); });
      if (op.cor) { doc.setFillColor(op.cor[0], op.cor[1], op.cor[2]); doc.rect(cols[1], y - 2, 2, 2, "F"); }
      doc.setFont("helvetica", op.peq ? "normal" : "bold"); doc.setFontSize(op.peq ? 6.6 : 7.4);
      if (c[2] !== "") doc.text(String(c[2]), cols[3] - 3, y, { align: "right" }); if (c[3] !== "") doc.text(String(c[3]), cols[4] - 3, y, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.2); doc.setTextColor(70); ls[2].forEach(function (l, i) { doc.text(l, cols[4], y + i * 2.9); }); doc.setTextColor(0);
      y += h; return true;
    }
    var cortado = false, vistas = {};
    temas.forEach(function (T) {
      var rs = T.rs.filter(function (r) { if (vistas[r.ent.id]) return false; vistas[r.ent.id] = 1; return true; }); // a mesma camada em duas folhas conta uma vez
      rs.forEach(function (r, i) {
        if (cortado) return;
        var tt = i === 0 ? T.tema.t : "", m = r.medida, nm = plNome(r.ent);
        if (r.erro) { cortado = !linha([tt, nm, "—", "—", plT("sinIndisp")]); return; }
        if (m.topo || m.semMedida) { cortado = !linha([tt, nm, "—", "—", (m.metodo.charAt(0).toUpperCase() + m.metodo.slice(1) + ".").replace(/\.\.$/, ".")]); return; }
        if (r.linear) { cortado = !linha([tt, nm, "—", "—", plT(m.presente ? "linSim" : "linNao") + plT("linNota") + m.metodo + "."]); return; }
        var obs = (m.n === 0 ? plT("semElem") : "") + m.metodo.charAt(0).toUpperCase() + m.metodo.slice(1) + ".";
        cortado = !linha([tt, nm, pmNum(m.ha, 2), pmNum(m.pct, 1) + " %", obs]);
        var cls = m.classes || [], lim = T.tema.cad ? 6 : 99; // cadastro: as 6 parcelas com mais área; a lista completa está na folha
        cls.slice(0, lim).forEach(function (k) { if (!cortado && (cls.length > 1 || k.n !== r.ent.n)) cortado = !linha(["", k.n, pmNum(k.ha, 2), pmNum(k.pct, 1) + " %", ""], { peq: 1, cor: k.cor ? (typeof k.cor === "string" ? pmHex(k.cor) : k.cor) : null }); });
        if (!cortado && cls.length > lim) cortado = !linha(["", plT("maisParc", { n: cls.length - lim }), "", "", ""], { peq: 1 });
      });
    });
    if (y + 10 > ymax) { doc.addPage(); pags.push(doc.getNumberOfPages()); y = M + 4; }
    pmTexto(doc, plT("sinNota"), x, y + 4, w, 6, 2.6, ymax + 5, "italic", [70, 70, 70]);
    return pags;
  }
  function plGerar(id, op, msg) {
    PLG = PLX[op.lingua] ? op.lingua : (PLX[window.IPR_LINGUA] ? window.IPR_LINGUA : "pt");
    msg(plT("preparar"));
    return plLibs().then(function () { return plGeo(id); }).then(function (T) {
      var P = window.proj4("EPSG:4326", "EPSG:3763");
      var an = T.aneis.map(function (r) { return r.map(function (c) { return P.forward([+c[0], +c[1]]); }); });
      var bx = [1e12, 1e12, -1e12, -1e12]; an.forEach(function (r) { r.forEach(function (p) { bx[0] = Math.min(bx[0], p[0]); bx[1] = Math.min(bx[1], p[1]); bx[2] = Math.max(bx[2], p[0]); bx[3] = Math.max(bx[3], p[1]); }); });
      var area = 0; an.forEach(function (r) { var a = 0; for (var i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; area += Math.abs(a) / 2; });
      var bw = bx[2] - bx[0], bh = bx[3] - bx[1];
      var A3 = op.papel === "A3", vert = op.orient === "v" || (op.orient === "auto" && bh > bw * 1.1);
      var W = A3 ? (vert ? 297 : 420) : (vert ? 210 : 297), H = A3 ? (vert ? 420 : 297) : (vert ? 297 : 210);
      var M = 10, BAND = pmBanda(W, H), fw = W - 2 * M, fh = H - 2 * M - BAND - 4;
      var escalas = [1000, 2000, 5000, 10000, 25000], esc = +op.escala;
      function cabe(e) { return bw * 1.12 <= fw / 1000 * e && bh * 1.12 <= fh / 1000 * e; }
      if (!esc) { esc = escalas.filter(cabe)[0]; if (!esc) throw new Error(plT("naoCabe25", { p: A3 ? "A3" : "A4" })); }
      else if (!cabe(esc)) throw new Error(plT("naoCabeEsc", { e: pmEsc(esc), p: A3 ? "A3" : "A4", s: escalas.filter(cabe)[0] ? pmEsc(escalas.filter(cabe)[0]) : "A3" }));
      var gw = fw / 1000 * esc, gh = fh / 1000 * esc, cx = (bx[0] + bx[2]) / 2, cy = (bx[1] + bx[3]) / 2;
      var caixa = [cx - gw / 2, cy - gh / 2, cx + gw / 2, cy + gh / 2];
      var dpi = 150, wpx = Math.min(4000, Math.round(fw / 25.4 * dpi)), hpx = Math.min(4000, Math.round(fh / 25.4 * dpi));
      var ll = window.proj4("EPSG:3763", "EPSG:4326", [cx, cy]);
      var temas = PM_TEMAS.filter(function (t) { return op["f_" + t.k] === undefined ? !!t.def : !!op["f_" + t.k]; }), sintese = op.f_sintese !== false && temas.length > 0, semPdm = false;
      var agora = new Date(), carimbo = agora.getFullYear() + ("0" + (agora.getMonth() + 1)).slice(-2) + ("0" + agora.getDate()).slice(-2) + ("0" + agora.getHours()).slice(-2) + ("0" + agora.getMinutes()).slice(-2);
      var ident = "IPR-PL-" + id + "-" + carimbo;
      var F = { M: M, W: W, H: H, fw: fw, fh: fh, A3: A3, esc: esc, caixa: caixa, gw: gw, gh: gh, wpx: wpx, hpx: hpx, an: an, area: area, id: id, nome: String(T.nome).slice(0, 80), ident: ident, agora: agora, downloads: T.downloads, sitio: {} };
      msg(plT("pedirOrto"));
      var gi = 30000, gj2 = gi * (fh / fw);
      var ixw = 52, ixh = 38;
      return Promise.all([plWms(caixa, wpx, hpx, op.fundo), plWms([cx - 15000, cy - 15000 * ixh / ixw, cx + 15000, cy + 15000 * ixh / ixw], 420, Math.round(420 * ixh / ixw), "sat").catch(function () { return null; }), plSitio(ll[0], ll[1])]).then(function (R) {
        F.sitio = R[2] || {};
        // Planta de condicionantes do PDM: só quando o concelho do centro do terreno tem uma no IPR Atlas.
        return (temas.some(function (t) { return t.pdmc; }) ? plPdm(F.sitio.municipio) : Promise.resolve(null)).then(function (pdm) {
        F.pdm = pdm; if (!pdm && temas.some(function (t) { return t.pdmc; })) { semPdm = true; temas = temas.filter(function (t) { return !t.pdmc; }); sintese = sintese && temas.length > 0; }
        if (!temas.length) return R;
        msg(plT("pedirTemas", { t: temas.map(function (t) { return t.t; }).join(", ") }));
        var L = pmMascara(F);
        return Promise.all(temas.map(function (t) { return pmTema(t, F, L, R[0].dados).catch(function (x) { return { tema: t, rs: (t.pdmc ? [F.pdm] : t.c.map(function (k) { return pmCat(k) || { id: k, n: k }; })).map(function (e) { return { ent: e, erro: (x && x.message) || String(x) }; }), indisponivel: true, img: null }; }); })).then(function (TT) { R.temas = TT; return R; });
        });
      }).then(function (R) {
        msg(plT("compor"));
        var J = window.jspdf.jsPDF, orient = W > H ? "landscape" : "portrait", fmt = A3 ? "a3" : "a4", doc = new J({ orientation: orient, unit: "mm", format: fmt, compress: true });
        var folhas = [];
        function mm(p) { return [M + (p[0] - caixa[0]) / gw * fw, M + (caixa[3] - p[1]) / gh * fh]; }
        // 1 · localização
        doc.addImage(R[0].dados, "JPEG", M, M, fw, fh, undefined, "FAST");
        pmLimite(doc, F);
        if (R[1]) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
          var iw = ixw * 0.5, ih = ixh * 0.5, tw = Math.max(iw, doc.getTextWidth(plT("enquadr"))), ix = M + fw - tw - 3, iy = M + fh - ih - 6;
          doc.setFillColor(255, 255, 255); doc.rect(ix - 1.2, iy - 1.2, tw + 2.4, ih + 5.4, "F");
          doc.addImage(R[1].dados, "JPEG", ix, iy, iw, ih, undefined, "FAST"); doc.setDrawColor(230, 30, 30); doc.setLineWidth(0.5); doc.rect(ix + iw / 2 - 1.2, iy + ih / 2 - 1.2, 2.4, 2.4);
          doc.setDrawColor(0); doc.setLineWidth(0.2); doc.rect(ix, iy, iw, ih); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5); doc.setTextColor(0); doc.text(plT("enquadr"), ix, iy + ih + 2.8);
        }
        var passo = plNice(gw / 5);
        var sitio = R[2].municipio || R[2].freguesia ? [R[2].freguesia ? plT("freg", { f: R[2].freguesia }) : "", R[2].municipio ? plT("conc", { c: R[2].municipio }) : ""].filter(Boolean).join(", ") : "";
        var fin = { apr: plT("fApr"), tec: plT("fTec"), mun: plT("fMun") }[op.finalidade] || op.finalidade || plT("fApr");
        folhas.push({ pag: 1, S: {
          titulo: plT("plTit"), mapa: true,
          legenda: [{ t: "linha", cor: [230, 30, 30], txt: plT("limite") }].concat(R[1] ? [{ t: "quadro", cor: [230, 30, 30], txt: plT("posicao") }] : []),
          dados: [plT("dProj", { id: id }) + (sitio ? " · " + sitio : ""), plT("dFin", { f: fin }) + (op.municipio ? " · " + op.municipio : "") + (op.proc ? " · " + op.proc : ""), op.requerente ? plT("dReq", { r: op.requerente }) : "", plT("dArea", { a: (area / 10000).toLocaleString(plLoc(), { maximumFractionDigits: 2 }) }), plT("dCentro", { x: Math.round(cx), y: Math.round(cy), lat: ll[1].toFixed(6), lon: ll[0].toFixed(6) }), plT("dQuad", { q: passo >= 1000 ? passo / 1000 + " km" : passo + " m" }), plT("dFundo", { f: R[0].fonte })].filter(Boolean),
          oQue: plT("plOQue", { f: R[0].fonte, e: pmEsc(esc) }) + (R[1] ? plT("plOQueIx") : "") + (temas.length ? plT("plOQueSeg") : ""),
          fonte: plT("plFonte", { f: R[0].fonte, h: pmHora(agora), d: agora.toLocaleString(plLoc()), id: ident }),
          aviso: plT("plAviso")
        } });
        // 2 · extractos das condicionantes, à mesma escala e caixa
        (R.temas || []).forEach(function (TT) {
          doc.addPage(fmt, orient);
          doc.addImage(TT.img || R[0].dados, "JPEG", M, M, fw, fh, undefined, "FAST");
          pmLimite(doc, F);
          if (TT.indisponivel) {
            var bw2 = Math.min(120, fw - 40), bx2 = M + (fw - bw2) / 2, by2 = M + fh / 2 - 9;
            doc.setFillColor(255, 255, 255); doc.setDrawColor(180, 40, 30); doc.setLineWidth(0.4); doc.roundedRect(bx2, by2, bw2, 18, 2, 2, "FD");
            doc.setTextColor(180, 40, 30); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(plT("indTit"), M + fw / 2, by2 + 7.5, { align: "center" });
            doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(60); doc.text(doc.splitTextToSize(plT("indTxt", { t: TT.tema.t }), bw2 - 8), M + fw / 2, by2 + 12.5, { align: "center" }); doc.setTextColor(0);
          }
          folhas.push({ pag: doc.getNumberOfPages(), S: pmFolhaTema(TT, F, R[0].fonte) });
        });
        // 3 · quadro de síntese
        if (sintese && R.temas) {
          doc.addPage(fmt, orient);
          pmSintese(doc, F, R.temas).forEach(function (pg) { folhas.push({ pag: pg, S: { titulo: plT("sinFolha"), legenda: [{ t: "linha", cor: [230, 30, 30], txt: plT("sinLeg") }], oQue: plT("sinOQue"), fonte: plT("sinFonte", { h: pmHora(agora) }) } }); });
        }
        // 4 · quadro de vértices (como antes, agora com a moldura)
        if (op.vertices) {
          doc.addPage(fmt, "portrait");
          var Hv = doc.internal.pageSize.getHeight(), Wv = doc.internal.pageSize.getWidth(), ylim = Hv - M - pmBanda(Wv, Hv) - 6, pv0 = doc.getNumberOfPages();
          doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text(plT("vCab"), 12, 16); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
          doc.text(String(T.nome).slice(0, 90) + " · " + ident, 12, 22);
          var vs = []; an.forEach(function (r, ri) { r.slice(0, -1).forEach(function (p) { vs.push([ri + 1, p[0], p[1]]); }); });
          var yy = 30, colx = 12; doc.setFontSize(7.5);
          vs.slice(0, 400).forEach(function (v, i) {
            if (yy > ylim) { yy = 30; colx += 64; if (colx > (A3 ? 240 : 150)) { doc.addPage(fmt, "portrait"); colx = 12; } }
            doc.text((i + 1) + (an.length > 1 ? " (" + v[0] + ")" : ""), colx, yy); doc.text((PLG === "en" ? "E " : "M ") + v[1].toFixed(2), colx + 12, yy); doc.text((PLG === "en" ? "N " : "P ") + v[2].toFixed(2), colx + 36, yy); yy += 4.2;
          });
          if (vs.length > 400) doc.text(plT("vMais", { n: vs.length - 400 }), 12, Math.min(yy + 6, ylim + 4));
          for (var pv = pv0; pv <= doc.getNumberOfPages(); pv++) folhas.push({ pag: pv, S: { titulo: plT("vTit"), legenda: [{ t: "linha", cor: [230, 30, 30], txt: plT("vLeg") }], oQue: plT("vOQue", { n: vs.length, s: PM_SRC }) + (an.length > 1 ? plT("vAnel") : "") + ".", fonte: plT("vFonte", { h: pmHora(agora) }) } });
        }
        // Moldura em todas as folhas, no fim, para saber o N de «folha n/N».
        var N = doc.getNumberOfPages();
        folhas.forEach(function (f) { doc.setPage(f.pag); pmMoldura(doc, F, f.S, f.pag, N); });
        doc.save(plT("ficheiro") + "-" + id + "-1-" + esc + ".pdf");
        var falhas = (R.temas || []).filter(function (t) { return t.indisponivel; }).map(function (t) { return t.tema.t; });
        msg(plT("gerada", { id: ident, e: pmEsc(esc), p: A3 ? "A3" : "A4", n: N, f: plT(N === 1 ? "folhaS" : "folhasS") }) + (falhas.length ? plT("falhas", { t: falhas.join(", ") }) : "") + (semPdm ? plT("semPdmMsg") : ""));
      });
    });
  }
  function plantaDialogo(id) {
    PLG = PLX[window.IPR_LINGUA] ? window.IPR_LINGUA : "pt";
    var o = document.getElementById("ipr-pl"); if (o) o.remove();
    o = document.createElement("div"); o.id = "ipr-pl"; o.lang = PLG;
    function e(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function ck(t) { return '<label class="ck"' + (t.pdmc ? ' data-pdm' : "") + '><input data-k="f_' + t.k + '" type="checkbox"' + (t.def ? " checked" : "") + (t.pdmc ? " disabled" : "") + "> <span>" + e(t.t) + (t.pdmc ? ' <small>(' + e(plT("dlPdmA")) + ")</small>" : "") + "</span></label>"; }
    o.innerHTML = '<div class="c"><b>' + e(plT("dlTit", { id: id })) + '</b>' +
      '<label>' + e(plT("dlFin")) + '<select data-k="finalidade"><option value="apr">' + e(plT("fApr")) + '</option><option value="tec">' + e(plT("fTec")) + '</option><option value="mun">' + e(plT("fMun")) + '</option></select></label>' +
      '<div class="mun" hidden><label>' + e(plT("dlMun")) + '<input data-k="municipio" type="text"></label><label>' + e(plT("dlProc")) + '<input data-k="proc" type="text" placeholder="' + e(plT("dlProcEx")) + '"></label></div>' +
      '<div class="g"><label>' + e(plT("dlPapel")) + '<select data-k="papel"><option>A4</option><option>A3</option></select></label><label>' + e(plT("dlOri")) + '<select data-k="orient"><option value="auto">' + e(plT("oAuto")) + '</option><option value="h">' + e(plT("oH")) + '</option><option value="v">' + e(plT("oV")) + '</option></select></label>' +
      '<label>' + e(plT("dlEsc")) + '<select data-k="escala"><option value="0">' + e(plT("eMin")) + '</option><option value="1000">' + pmEsc(1000) + '</option><option value="2000">' + pmEsc(2000) + '</option><option value="5000">' + pmEsc(5000) + '</option><option value="10000">' + pmEsc(10000) + '</option><option value="25000">' + pmEsc(25000) + '</option></select></label>' +
      '<label>' + e(plT("dlFundo")) + '<select data-k="fundo"><option value="orto">' + e(plT("fOrto")) + '</option><option value="sat">' + e(plT("fSat")) + '</option></select></label></div>' +
      '<div class="g"><label>' + e(plT("dlReq")) + '<input data-k="requerente" type="text"></label><label>' + e(plT("dlLing")) + '<select data-k="lingua"><option value="pt"' + (PLG === "pt" ? " selected" : "") + '>Português</option><option value="en"' + (PLG === "en" ? " selected" : "") + '>English</option></select></label></div>' +
      '<fieldset class="fl"><legend>' + e(plT("dlFolhas")) + '</legend><label class="ck"><input type="checkbox" checked disabled> <span>' + e(plT("dlLoc")) + '</span></label>' +
      PM_TEMAS.map(ck).join("") +
      '<label class="ck"><input data-k="f_sintese" type="checkbox" checked> <span>' + e(plT("dlSin")) + '</span></label><label class="ck"><input data-k="vertices" type="checkbox"> <span>' + e(plT("dlVert")) + '</span></label></fieldset>' +
      '<p class="m">' + e(plT("dlTxt")) + '</p>' +
      '<div class="a"><button type="button" data-a="ok">' + e(plT("dlGerar")) + '</button><button type="button" data-a="x">' + e(plT("dlFechar")) + '</button></div><div class="s" aria-live="polite"></div></div>';
    document.body.appendChild(o);
    // Planta de condicionantes do PDM: procura-se o concelho do terreno (CAOP) e só se deixa escolher quando há planta.
    var lp = o.querySelector("[data-pdm]");
    if (lp) plGeo(id).then(function (T) {
      var r = T.aneis[0], x = 0, y = 0; r.forEach(function (c) { x += +c[0]; y += +c[1]; });
      return plSitio(x / r.length, y / r.length);
    }).then(function (st) { return plPdm(st.municipio).then(function (p) { return [st, p]; }); }).then(function (A) {
      var st = A[0], p = A[1], sm = lp.querySelector("small"), inp = lp.querySelector("input");
      if (sm) sm.textContent = "(" + (p ? plT("dlPdmSim", { m: st.municipio }) : st.municipio ? plT("dlPdmNao", { m: st.municipio }) : plT("dlPdmNd")) + ")";
      inp.disabled = !p;
    }).catch(function () { var sm = lp.querySelector("small"); if (sm) sm.textContent = "(" + plT("dlPdmNd") + ")"; });
    var fin = o.querySelector('[data-k="finalidade"]'); fin.addEventListener("change", function () { o.querySelector(".mun").hidden = fin.value !== "mun"; if (fin.value === "mun") { o.querySelector('[data-k="escala"]').value = "1000"; o.querySelector('[data-k="vertices"]').checked = true; } });
    o.addEventListener("click", function (ev) {
      if (ev.target === o || (ev.target.dataset && ev.target.dataset.a === "x")) { o.remove(); return; }
      if (ev.target.dataset && ev.target.dataset.a === "ok") {
        var op = {}; o.querySelectorAll("[data-k]").forEach(function (el) { op[el.dataset.k] = el.type === "checkbox" ? (el.checked && !el.disabled) : el.value.trim(); });
        var s = o.querySelector(".s"), b = ev.target; b.disabled = true;
        plGerar(id, op, function (t) { s.textContent = t; }).catch(function (x) { s.textContent = x.message || String(x); }).then(function () { b.disabled = false; });
      }
    });
  }
  window.__iprPlanta = plantaDialogo;
  (function () {
    if (document.getElementById("ipr-pl-css")) return;
    var st = document.createElement("style"); st.id = "ipr-pl-css";
    st.textContent = "#ipr-pl{position:fixed;inset:0;z-index:100001;background:rgba(10,12,10,.55);display:flex;align-items:center;justify-content:center;padding:16px}#ipr-pl .c{width:min(460px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#333);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;font:13px Inter,sans-serif}" +
      "#ipr-pl label{display:flex;flex-direction:column;gap:4px;font:600 11px Inter,sans-serif;color:var(--mu,#9aa08f);text-transform:uppercase;letter-spacing:.04em}#ipr-pl label.ck{flex-direction:row;align-items:center;text-transform:none;font-size:13px;color:var(--tx)}" +
      "#ipr-pl select,#ipr-pl input[type=text]{font:13px Inter,sans-serif;padding:7px;border:1px solid var(--ln,#333);border-radius:7px;background:var(--p2,#1d221c);color:var(--tx,#e9eadf);text-transform:none}#ipr-pl .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}#ipr-pl .mun{display:grid;grid-template-columns:1fr 1fr;gap:8px}#ipr-pl .mun[hidden]{display:none}" +
      "#ipr-pl .m{margin:0;color:var(--mu,#9aa08f);font-size:12px}#ipr-pl .a{display:flex;gap:8px;justify-content:flex-end}#ipr-pl .a button{font:600 13px Inter,sans-serif;padding:8px 14px;border-radius:8px;border:1px solid var(--ln,#333);background:transparent;color:var(--tx,#e9eadf);cursor:pointer}#ipr-pl .a button[data-a=ok]{background:var(--ac,#b5c46a);border-color:var(--ac,#b5c46a);color:#141814}#ipr-pl .s{font-size:12px;color:var(--ac2,#c9d36a);min-height:16px}" +
      "#ipr-pl fieldset.fl{margin:0;border:1px solid var(--ln,#333);border-radius:8px;padding:6px 10px 8px;display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}#ipr-pl fieldset.fl legend{font:600 11px Inter,sans-serif;color:var(--mu,#9aa08f);text-transform:uppercase;letter-spacing:.04em;padding:0 4px}#ipr-pl fieldset.fl label.ck{font-size:12.5px;font-weight:500;gap:6px;align-items:flex-start}#ipr-pl fieldset.fl input{margin:2px 0 0}#ipr-pl fieldset.fl label.ck small{color:var(--mu,#9aa08f);font-weight:400}#ipr-pl fieldset.fl label.ck[data-pdm] input:disabled+span{opacity:.6}@media (max-width:480px){#ipr-pl fieldset.fl{grid-template-columns:1fr}}";
    (document.head || document.documentElement).appendChild(st);
  })();
  // 26/10, 00h05 (Nuno: «na lista de projectos continuo sem ver os botões editar, eliminar»). A lista que se vê é a do
  // entrada.js (li.tme-t, «Abrir»), não os cartões do app.js: os botões passam a ir também para cada linha dessa lista.
  var ADM = null;
  function linhasProj() {
    if (!window.tcdNonce) return false;
    if (ADM === null) { ADM = false; api("projecto/gestao").then(function (j) { ADM = !!(j && j.admin); document.querySelectorAll(".ipr-tma").forEach(function (x) { x.remove(); }); aplicarLinhas(); }).catch(function () {}); }
    if (!document.getElementById("ipr-tma-css")) { var st = document.createElement("style"); st.id = "ipr-tma-css"; st.textContent = ".ipr-tma{display:flex;flex-wrap:wrap;gap:4px 12px;flex:1 0 100%;margin-top:4px}.ipr-tma button{all:unset;cursor:pointer;font:600 11.5px Inter,sans-serif;color:var(--mu)}.ipr-tma button:hover{color:var(--tx)}.ipr-tma button.del{color:#d9725b}.ipr-tma .f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1 0 100%}.ipr-tma .f input{flex:1 1 10em;min-width:0;font:13px Inter,sans-serif;background:var(--p3,transparent);color:var(--tx);border:1px solid var(--ln);border-radius:6px;padding:4px 8px}.ipr-tma .f small{flex:1 0 100%;color:var(--mu)}li.tme-t{flex-wrap:wrap}"; document.head.appendChild(st); }
    function idDe(li) { var a = li.querySelector('a[href*="mapa="]'), b = li.querySelector("[data-id]"); var m = a && /mapa=(\d+)/.exec(a.getAttribute("href") || ""); return m ? +m[1] : (b ? +b.dataset.id : (/#(\d+)/.exec(li.textContent || "") || [])[1] | 0); }
    function aplicarLinhas() {
      document.querySelectorAll("li.tme-t").forEach(function (li) {
        if (li.querySelector(".ipr-tma")) return; var id = idDe(li); if (!id) return;
        var d = document.createElement("div"); d.className = "ipr-tma"; d.dataset.id = id;
        d.innerHTML = '<button type="button" data-a="v3d">Ver em 3D</button><button type="button" data-a="planta">Planta de localização</button><button type="button" data-a="nome">Editar nome</button><button type="button" data-a="partilhar">Partilhar</button>' + (ADM ? '<button type="button" data-a="eliminar" class="del">Eliminar</button>' : "");
        ["click", "mousedown", "pointerdown", "touchstart"].forEach(function (t) { d.addEventListener(t, function (e) { e.stopPropagation(); }); });
        d.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return; e.preventDefault();
          var nomeEl = li.querySelector("b"), f = d.querySelector(".f");
          if (b.dataset.a === "nome") { if (f) return; f = document.createElement("span"); f.className = "f"; f.innerHTML = '<input type="text" maxlength="90"><button type="button" data-a="gn">Guardar</button><button type="button" data-a="nao">Cancelar</button>'; f.querySelector("input").value = (nomeEl ? nomeEl.textContent : "").trim(); d.appendChild(f); f.querySelector("input").focus(); f.querySelector("input").addEventListener("keydown", function (ev) { ev.stopPropagation(); if (ev.key === "Enter") f.querySelector('[data-a="gn"]').click(); }); return; }
          if (b.dataset.a === "planta") { plantaDialogo(id); return; }
          if (b.dataset.a === "v3d") { vista3dJanela(id); return; }
          if (b.dataset.a === "nao") { if (f) f.remove(); return; }
          if (b.dataset.a === "gn") { b.disabled = true; api("projecto/nome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: id, nome: f.querySelector("input").value.trim() }) }).then(function (j) { if (nomeEl) nomeEl.textContent = j.nome; f.remove(); }).catch(function (x) { b.disabled = false; b.textContent = x.message; }); return; }
          if (b.dataset.a === "partilhar") { if (/[?&]mapa=(\d+)/.exec(location.search) && +RegExp.$1 === id) { var c = [].slice.call(document.querySelectorAll("#ipe-proj .ipe-card")).filter(function (k) { return new RegExp("#" + id + "\\b").test(k.textContent); })[0]; var bt = c && c.querySelector("[data-psh]"); if (bt) { bt.click(); return; } } location.href = "/atlas/?mapa=" + id + "#partilhar"; return; }
          if (b.dataset.a === "eliminar") { if (f) return; f = document.createElement("span"); f.className = "f"; f.innerHTML = "<small>Eliminar o projecto #" + id + "? Vai para o lixo e recupera-se no WooCommerce.</small>" + '<button type="button" data-a="sim" class="del">Sim, eliminar</button><button type="button" data-a="nao">Não</button>'; d.appendChild(f); return; }
          if (b.dataset.a === "sim") { b.disabled = true; api("projecto/eliminar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: id }) }).then(function () { li.remove(); }).catch(function (x) { f.innerHTML = "<small>" + String(x.message).replace(/</g, "&lt;") + "</small>"; }); }
        });
        li.appendChild(d);
      });
    }
    aplicarLinhas();
    if (!linhasProj.obs) { linhasProj.obs = 1; var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(aplicarLinhas, 200); }).observe(document.body, { childList: true, subtree: true }); }
    // «Partilhar» vindo de outra linha: abre o cartão e o campo do e-mail.
    if (location.hash === "#partilhar" && !linhasProj.ph) { linhasProj.ph = 1; var n = 0; (function ver() { var bt = document.querySelector("#ipe-proj .ipe-card [data-psh]"); var id = (/[?&]mapa=(\d+)/.exec(location.search) || [])[1]; var c = id && [].slice.call(document.querySelectorAll("#ipe-proj .ipe-card")).filter(function (k) { return new RegExp("#" + id + "\\b").test(k.textContent); })[0]; var b2 = c && c.querySelector("[data-psh]"); if (b2) { var tab = document.querySelector('.ipe-tab[data-tab="proj"]'); if (tab) tab.click(); b2.click(); } else if (n++ < 40) setTimeout(ver, 400); })(); }
    return true;
  }
  // 25/10, 22h57 (Nuno): «nos projectos aparecem todos os projectos em que eu estou envolvido», também os das organizações.
  function projOrg() {
    var P = document.getElementById("ipe-proj"); if (!P || !window.tcdNonce || !window.tcdOrg || !window.tcdOrg.dados) return false;
    if (P.__iprPO) return true;
    var d0 = window.tcdOrg.dados(); if (!d0 || !d0.org) return false;
    P.__iprPO = 1;
    var st = document.createElement("style");
    st.textContent = "#ipr-projorg{margin:14px 0 4px}#ipr-projorg .po-h{display:flex;align-items:center;gap:10px;font:500 15px Inter,sans-serif;color:var(--tx);margin:0 0 8px}#ipr-projorg .po-h:after{content:'';flex:1;height:1px;background:var(--ln2,rgba(127,127,127,.25))}#ipr-projorg .po-h b{font:600 12px var(--mono,monospace);color:var(--mu)}" +
      "#ipr-projorg .po{display:flex;align-items:center;gap:10px;border:1px solid var(--ln2,rgba(127,127,127,.25));border-radius:10px;padding:10px 12px;margin:0 0 8px}#ipr-projorg .po div{flex:1;min-width:0}#ipr-projorg .po strong{display:block;font:700 14px Inter,sans-serif;color:var(--tx)}" +
      "#ipr-projorg .po small{display:block;font:500 12px var(--mono,monospace);color:var(--mu);margin-top:3px}#ipr-projorg .po button{font:600 13px Inter,sans-serif;border:1px solid var(--ln);background:transparent;color:var(--ac,#c9d36a);border-radius:8px;padding:6px 14px;cursor:pointer;flex:none}";
    document.head.appendChild(st);
    var bases = null;
    api("org/projectos").then(function (j) { bases = (j && j.projectos) || []; desenhar(); }).catch(function () { bases = []; desenhar(); });
    function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function lista() {
      var d = window.tcdOrg.dados() || {}, projs = {}, cs = d.camadas || [];
      (d.grupos || []).forEach(function (g) {
        var m = /^(\d{2,6})\s+(.+?)(?:\s·\s(.+))?$/.exec(g.nome || ""); if (!m) return;
        var p = projs[m[1]] || (projs[m[1]] = { k: m[1], nome: m[1] + " " + m[2], n: 0 });
        p.n += cs.filter(function (c) { return c.grupo === g.id; }).length;
      });
      (bases || []).forEach(function (b) { var k = String(b.id); var p = projs[k] || (projs[k] = { k: k, nome: String(b.nome || b.local || "Projecto " + k), n: 0 }); p.base = b.id; });
      return Object.keys(projs).map(function (k) { return projs[k]; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }); });
    }
    var desenhando = false;
    function desenhar() {
      var d = window.tcdOrg.dados() || {}, org = (d.org && d.org.nome) || "Organização", ps = lista();
      var W = document.getElementById("ipr-projorg");
      if (!ps.length) { if (W) W.remove(); return; }
      var h = '<div class="po-h">Nas minhas organizações <b>' + ps.length + "</b></div>" + ps.map(function (p) {
        return '<div class="po"><div><strong>' + esc(p.nome) + "</strong><small>" + esc(org) + (p.base ? " · Base cartográfica · #" + esc(p.base) : "") + (p.n ? " · " + p.n + (p.n === 1 ? " camada" : " camadas") : "") + '</small></div><button type="button" data-po="' + esc(p.base || "") + '" data-pok="' + esc(p.k) + '">Abrir</button></div>';
      }).join("");
      desenhando = true;
      if (!W) { W = document.createElement("div"); W.id = "ipr-projorg"; }
      var parti = [].slice.call(P.children).filter(function (el) { return /Partilhados consigo/.test(el.textContent || "") && el.children.length < 4; })[0];
      if (W.innerHTML !== h) W.innerHTML = h;
      if (parti) { if (W.nextSibling !== parti) P.insertBefore(W, parti); } else if (W.parentNode !== P || P.lastElementChild !== W) P.appendChild(W);
      desenhando = false;
    }
    P.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("#ipr-projorg button"); if (!b) return; e.stopPropagation();
      if (b.dataset.po && window.__iprOrgBase) window.__iprOrgBase(+b.dataset.po); else if (window.__iprOrgAbrir) window.__iprOrgAbrir(b.dataset.pok);
    });
    // Travão: no máximo 6 redesenhos por 10 s, para nunca entrar em ciclo com o próprio Atlas.
    var vezes = [];
    new MutationObserver(function () {
      if (desenhando) return; var t = Date.now(); vezes = vezes.filter(function (x) { return t - x < 10000; }); if (vezes.length >= 6) return;
      clearTimeout(desenhar.t); desenhar.t = setTimeout(function () { vezes.push(Date.now()); try { desenhar(); } catch (e) {} }, 250);
    }).observe(P, { childList: true });
    try { desenhar(); } catch (e) {}
    return true;
  }
  function subPastas() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    if (cam.__ipr51) return true; cam.__ipr51 = 1;
    var st = document.createElement("style");
    st.textContent = "#ipe-cam li.ipr-sub.ipr-sp{cursor:pointer;display:flex;align-items:center;gap:7px;padding:7px 8px 6px 4px;margin-top:2px;border-top:1px solid var(--ln2,rgba(127,127,127,.18));font:600 11.5px Inter,system-ui,sans-serif;letter-spacing:.04em;user-select:none;color:var(--tx,#ddd)}" +
      "#ipe-cam li.ipr-sub.ipr-sp:before{content:'';width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(-45deg);transition:transform .15s;flex:none;margin-left:2px}" +
      "#ipe-cam li.ipr-sub.ipr-sp.ab:before{transform:rotate(45deg)}#ipe-cam li.ipr-sub.ipr-sp small{margin-left:auto;font:500 10.5px var(--mono,monospace);letter-spacing:0;color:var(--mu)}#ipe-cam li.ipr-sub.ipr-sp small b{color:var(--ac,#9cbf4f)}" +
      "#ipe-cam li.ipr-sp-esc{display:none!important}";
    document.head.appendChild(st);
    var EST = {}; try { EST = JSON.parse(localStorage.getItem("ipr_subpastas") || "{}") || {}; } catch (e) {}
    function guardar() { try { localStorage.setItem("ipr_subpastas", JSON.stringify(EST)); } catch (e) {} }
    function itens(li) { var r = [], n = li.nextElementSibling; while (n && !n.classList.contains("ipr-sub")) { r.push(n); n = n.nextElementSibling; } return r; }
    function chave(li) { var g = li.closest(".ipr-g"), gn = g ? ((g.querySelector(".ipr-gn") || {}).textContent || "") : ""; return gn + "|" + li.textContent.replace(/\s*\d+(\s*·\s*\d+)?\s*$/, "").trim(); }
    function aplicar() {
      if (cam.querySelector(".ipr-busca input") && cam.querySelector(".ipr-busca input").value) { cam.querySelectorAll("li.ipr-sp-esc").forEach(function (x) { x.classList.remove("ipr-sp-esc"); }); return; }
      cam.querySelectorAll("ul.ipr-lista > li.ipr-sub").forEach(function (li) {
        var its = itens(li), lig = its.filter(function (x) { return x.classList.contains("on") || !!x.querySelector("input:checked"); }).length;
        if (!li.classList.contains("ipr-sp")) { li.classList.add("ipr-sp"); li.dataset.k = chave(li); li.appendChild(document.createElement("small")); }
        var k = li.dataset.k, ab = k in EST ? !!EST[k] : lig > 0;
        li.classList.toggle("ab", ab);
        var sm = li.querySelector("small"), h = its.length + (lig ? " · <b>" + lig + "</b>" : ""); if (sm.innerHTML !== h) sm.innerHTML = h;
        its.forEach(function (x) { x.classList.toggle("ipr-sp-esc", !ab); });
      });
    }
    cam.addEventListener("click", function (e) {
      var li = e.target.closest && e.target.closest("li.ipr-sub.ipr-sp"); if (!li) return;
      EST[li.dataset.k] = !li.classList.contains("ab"); guardar(); aplicar();
    });
    cam.addEventListener("change", function () { setTimeout(aplicar, 0); });
    new MutationObserver(function () { clearTimeout(subPastas.t); subPastas.t = setTimeout(aplicar, 40); }).observe(cam, { childList: true, subtree: true });
    aplicar();
    return true;
  }

  function cartoes() {
    if (!document.getElementById("ipr-jorg-css")) { var cs = document.createElement("style"); cs.id = "ipr-jorg-css"; cs.textContent = ".ipr-jorg-esc{display:inline-flex;gap:4px;margin-left:6px;align-items:center}.ipr-jorg-esc select{font:12px Inter,sans-serif;max-width:160px;background:var(--p3,transparent);color:var(--tx);border:1px solid var(--ln);border-radius:6px;padding:2px 4px}.ipr-jorg-esc button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:6px;padding:2px 8px;background:var(--ac,#75834a);color:#fff;cursor:pointer}"; document.head.appendChild(cs); }
    var P = document.getElementById("ipe-proj"); if (!P || !window.tcdNonce) return false;
    if (P.__ipr48) return true; P.__ipr48 = 1;
    var arq = [], mostrarArq = false;
    var st = document.createElement("style");
    st.textContent = ".ipr-ca{display:flex;gap:10px;margin-top:6px}.ipr-ca button{all:unset;cursor:pointer;font:600 11.5px Inter,sans-serif;color:var(--mu)}.ipr-ca button:hover{color:var(--tx)}" +
      "#ipe-proj .ipe-card.ipr-arq{display:none}#ipe-proj.ipr-ver-arq .ipe-card.ipr-arq{display:block;opacity:.55}#ipr-arq-b{all:unset;cursor:pointer;display:block;margin:6px 0;font:600 12px Inter,sans-serif;color:var(--mu)}" +
      ".ipr-ca{flex-wrap:wrap}.ipr-ca button.ipr-del{color:#d9725b}.ipr-pf{display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex:1 0 100%}.ipr-pf input{flex:1 1 12em;min-width:0;font:13px Inter,sans-serif;background:var(--p3,transparent);color:var(--tx);border:1px solid var(--ln);border-radius:6px;padding:4px 8px}.ipr-pf small{flex:1 0 100%;color:var(--mu);font:12px Inter,sans-serif}";
    document.head.appendChild(st);
    function enc(c) { var m = /#(\d+)/.exec((c.querySelector(".mono") || {}).textContent || ""); return m ? +m[1] : 0; }
    function aplicar() {
      var n = 0;
      P.querySelectorAll(".ipe-card").forEach(function (c) {
        var id = enc(c); if (!id) return;
        var a = arq.indexOf(id) >= 0; c.classList.toggle("ipr-arq", a); if (a) n++;
        var ct = c.querySelector(".ipe-ct"); if (!ct || ct.querySelector(".ipr-ca")) { var bt = ct && ct.querySelector("[data-arq]"); var tx0 = a ? "Desarquivar" : "Arquivar"; if (bt && bt.textContent !== tx0) bt.textContent = tx0; return; }
        var d = document.createElement("div"); d.className = "ipr-ca";
        // 25/10, 22h59 (Nuno): editar, partilhar e eliminar na própria lista (m90360).
        d.innerHTML = '<button type="button" data-ppl="' + id + '">Planta de localização</button><button type="button" data-pnome="' + id + '">Editar nome</button><button type="button" data-psh="' + id + '">Partilhar</button><button type="button" data-arq="' + id + '">' + (a ? "Desarquivar" : "Arquivar") + '</button><button type="button" data-jorg="' + id + '">Juntar à organização</button>' + (ADM ? '<button type="button" data-pdel="' + id + '" class="ipr-del">Eliminar</button>' : "");
        ct.appendChild(d);
      });
      var b = document.getElementById("ipr-arq-b");
      if (n && !b) { b = document.createElement("button"); b.type = "button"; b.id = "ipr-arq-b"; P.insertBefore(b, P.firstChild); b.addEventListener("click", function () { mostrarArq = !mostrarArq; P.classList.toggle("ipr-ver-arq", mostrarArq); aplicar(); }); }
      if (b) { if (b.hidden !== !n) b.hidden = !n; var tx1 = (mostrarArq ? "Esconder" : "Mostrar") + " arquivados (" + n + ")"; if (b.textContent !== tx1) b.textContent = tx1; }
    }
    var orgsJ = null, ADM = false;
    api("projecto/gestao").then(function (j) { if (j && j.admin) { ADM = true; P.querySelectorAll(".ipr-ca").forEach(function (x) { x.remove(); }); aplicar(); } }).catch(function () {});
    function cartao(id) { return [].slice.call(P.querySelectorAll(".ipe-card")).filter(function (c) { return enc(c) === id; })[0]; }
    P.addEventListener("click", function (e) {
      var b = e.target.closest("[data-arq],[data-jorg],[data-pnome],[data-psh],[data-pdel],[data-pok],[data-pnao],[data-ppl]"); if (!b) return; e.stopPropagation(); e.preventDefault();
      if (b.dataset.ppl) { plantaDialogo(+b.dataset.ppl); return; }
      var ca = b.closest(".ipr-ca"), c, id;
      if (b.dataset.pnome) {
        id = +b.dataset.pnome; c = cartao(id); var st0 = c && c.querySelector(".ipe-ct strong"); if (!st0 || ca.querySelector("input")) return;
        var f = document.createElement("span"); f.className = "ipr-pf"; f.innerHTML = '<input type="text" maxlength="90"><button type="button" data-pok="n' + id + '">Guardar</button><button type="button" data-pnao="1">Cancelar</button>';
        f.querySelector("input").value = st0.textContent.trim(); ca.appendChild(f); f.querySelector("input").focus(); f.querySelector("input").select();
        f.addEventListener("click", function (ev) { ev.stopPropagation(); }); f.querySelector("input").addEventListener("keydown", function (ev) { ev.stopPropagation(); if (ev.key === "Enter") f.querySelector("[data-pok]").click(); if (ev.key === "Escape") f.remove(); });
        return;
      }
      if (b.dataset.pnao) { var f0 = b.closest(".ipr-pf"); if (f0) f0.remove(); return; }
      if (b.dataset.pok) {
        var tipo = b.dataset.pok[0]; id = +b.dataset.pok.slice(1); var fx = b.closest(".ipr-pf"); b.disabled = true;
        if (tipo === "n") {
          var nome = fx.querySelector("input").value.trim();
          api("projecto/nome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: id, nome: nome }) }).then(function (j) { var cc = cartao(id), s1 = cc && cc.querySelector(".ipe-ct strong"); if (s1) s1.textContent = j.nome; fx.remove(); }).catch(function (x) { b.disabled = false; b.textContent = x.message; });
        } else {
          api("projecto/eliminar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: id }) }).then(function (j) { var cc = cartao(id); if (cc) cc.remove(); }).catch(function (x) { fx.innerHTML = "<small>" + String(x.message).replace(/</g, "&lt;") + "</small>"; });
        }
        return;
      }
      if (b.dataset.pdel) {
        id = +b.dataset.pdel; if (ca.querySelector(".ipr-pf")) return;
        var fd = document.createElement("span"); fd.className = "ipr-pf"; fd.innerHTML = '<small>Eliminar o projecto #' + id + '? Vai para o lixo e recupera-se no WooCommerce.</small><button type="button" data-pok="d' + id + '" class="ipr-del">Sim, eliminar</button><button type="button" data-pnao="1">Não</button>';
        ca.appendChild(fd); return;
      }
      if (b.dataset.psh) {
        id = +b.dataset.psh; c = cartao(id); if (!c) return; var t0 = c.querySelector(".ipe-ct strong") || c; t0.click();
        var n = 0; (function ver() { var sh = P.querySelector(".ipe-sh"); if (sh && sh.offsetParent) { try { sh.scrollIntoView({ block: "center" }); } catch (e2) {} var em = sh.querySelector("[data-sh-email]"); if (em) em.focus(); return; } if (n++ < 30) setTimeout(ver, 200); })();
        return;
      }
      if (b.dataset.arq) {
        var id = +b.dataset.arq, sim = arq.indexOf(id) < 0; b.disabled = true;
        api("projecto/arquivar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: id, arquivar: sim ? 1 : 0 }) }).then(function (j) { arq = j.ids || []; aplicar(); }).catch(function (x) { b.title = x.message; }).then(function () { b.disabled = false; });
      } else {
        // 25/10, 18h31 (Nuno): com mais de uma organização, escolhe-se qual; o projecto passa inteiro para a sua pasta.
        var t = b.dataset.t || (b.dataset.t = b.textContent);
        function juntar(org) {
          b.disabled = true; b.textContent = "A juntar…";
          api("org/juntar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projecto: +b.dataset.jorg, org: org || 0 }) })
            .then(function (j) { b.textContent = "Na organização"; b.title = j.m || ""; var w = b.parentNode.querySelector(".ipr-jorg-esc"); if (w) w.remove(); })
            .catch(function (x) { b.disabled = false; b.title = x.message; b.textContent = "Não foi possível"; setTimeout(function () { b.textContent = t; }, 4000); });
        }
        (orgsJ || (orgsJ = api("org/grupos-meus"))).then(function (j) {
          var os = (j && j.orgs) || [];
          if (os.length < 2) return juntar(os[0] ? os[0].id : 0);
          var w = b.parentNode.querySelector(".ipr-jorg-esc"); if (w) { w.remove(); return; }
          w = document.createElement("span"); w.className = "ipr-jorg-esc";
          w.innerHTML = '<select aria-label="Organização"></select><button type="button">Juntar</button>';
          var sel = w.querySelector("select"); os.forEach(function (o) { var op = document.createElement("option"); op.value = o.id; op.textContent = o.nome; if (+o.id === +j.org) op.selected = true; sel.appendChild(op); });
          w.querySelector("button").addEventListener("click", function (ev) { ev.stopPropagation(); ev.preventDefault(); juntar(+sel.value); });
          w.addEventListener("click", function (ev) { ev.stopPropagation(); });
          b.insertAdjacentElement("afterend", w);
        }).catch(function () { juntar(0); });
      }
    }, true);
    api("projecto/arquivados").then(function (j) { arq = j.ids || []; aplicar(); }).catch(function () {});
    new MutationObserver(function () { clearTimeout(aplicar.t); aplicar.t = setTimeout(aplicar, 60); }).observe(P, { childList: true, subtree: true });
    aplicar();
    return true;
  }
  // §62 a §64 · Línguas (Nuno, 26/10/2026, 16h00): tudo o que estas secções mostram existe em português e em inglês, com textos
  // escritos por nós (não por tradução automática). A língua vem, por esta ordem: escolha guardada neste navegador
  // (ipr_lingua), window.IPR_LANG posto pelo site (m90071/m90245), língua do navegador (pt… fica português, o resto inglês).
  // O dicionário é {pt:{}, en:{}}; para juntar outra língua basta outra chave com os mesmos nomes (o que faltar sai em inglês).
  var L62 = {
    pt: {
      lingua: "Língua", pt: "Português", en: "English",
      temas: "Temas", temasSub: "Escolha o que quer ver. Cada tema liga as camadas certas e explica o que está no mapa.",
      todas: "Todas as camadas", todasAbrir: "Mostrar a lista completa de camadas", todasFechar: "Esconder a lista completa",
      sairTema: "Sair do tema", maisCamadas: "Mais camadas deste tema", oQueVe: "O que está a ver", legenda: "Legenda", camadas: "Camadas do tema",
      ferramentas: "Ferramentas", produto: "Produto ligado", vista3d: "Vista 3D",
      tranc: "Intelligence", trancT: "Camada do Intelligence. Abre com qualquer serviço contratado ou por assinatura.",
      daBase: "Na sua Base Cartográfica", daBaseT: "Só aparece quando a Base Cartográfica deste terreno estiver entregue.",
      porActivar: "por activar", porActivarT: "O serviço oficial da DGT ainda não está ligado no site do IPR Atlas.",
      fechadas: "{n} camadas deste tema são do Intelligence e estão fechadas.",
      t_terreno: "Conhecer o terreno", t_cond: "Condicionantes", t_relevo: "Relevo e água em 3D", t_solo: "Solo e vegetação",
      t_fogo: "Fogo", t_campo: "Campo", t_ecologia: "Ecologia", t_org: "Design · {org}",
      v_terreno: "Ortofotomapa recente com o relevo sombreado, as curvas de nível, o cadastro, as linhas de água, os caminhos e os nomes dos lugares. Serve para ler o sítio antes de lá ir.",
      v_cond: "Restrições de utilidade pública e ordenamento: REN, RAN, qualificação do solo do PDM, Rede Natura 2000, domínio público hídrico, perigosidade de incêndio e servidões oficiais da DGT. Indicam o que pode limitar construir, plantar ou mexer no terreno.",
      v_relevo: "Relevo sombreado em 3D, curvas de nível, linhas de água e bacias. Incline o mapa com dois dedos ou com o botão direito do rato para ver por onde a água corre e se junta.",
      v_solo: "Ocupação do solo (COS 2023), carta de solos, capacidade de uso, densidade de copa e carbono orgânico. Ajuda a perceber o que o solo aguenta e o que já lá cresce.",
      v_fogo: "Perigosidade estrutural de incêndio, áreas ardidas de 2015 a 2025, rede primária de faixas de gestão de combustível e zonas de intervenção florestal.",
      v_campo: "Mapa leve para usar no terreno: cadastro, curvas, caminhos, vedações, pontos de água e nomes. Marque notas com o marcador e leve o projecto para o QField.",
      v_ecologia: "Habitats, Rede Natura 2000, áreas protegidas, árvores isoladas e sebes, densidade de copa e registos de espécies (GBIF). Mostra a estrutura natural à volta do terreno.",
      v_org: "Camadas de trabalho da sua organização por cima do relevo, da água e do cadastro.",
      p_leitura: "Leitura do Terreno", p_planta: "Planta de Localização", p_base: "Base Cartográfica", p_intel: "Acesso Intelligence", p_org: "Abrir a organização",
      pr_leitura: "desde 250 € + IVA", pr_base: "desde 99 € + IVA",
      m_cadastro: "Parcelas do cadastro", m_desenhar: "Desenhar no mapa", m_ficheiro: "Carregar ficheiro", m_artigo: "Artigo matricial ou caderneta", mh_cadastro: "Clique nas parcelas do seu terreno no mapa.", mh_desenhar: "Clique nos cantos do terreno; termine no primeiro ponto.", mh_ficheiro: "KML, KMZ, GeoJSON, Shapefile ou GPX.", mh_artigo: "Sem mapa? Indique o concelho, a freguesia e o artigo; nós localizamos.", mfalta: "Abra o separador Processos à direita e escolha a forma de indicar o terreno.", f_busca: "Procurar local", f_desenhar: "Desenhar o terreno", f_parcelas: "Escolher parcelas", f_importar: "Carregar ficheiro",
      f_area: "Medir área", f_regua: "Medir distância", f_perfil: "Perfil de elevação", f_3d: "Vista 3D", f_sol: "Sol e sombra",
      f_historico: "Imagens antigas", f_marcador: "Nota no mapa", f_gps: "A minha posição", f_qfield: "QField",
      qfieldN: "A ligação ao QField está na IPR Cloud, no separador Projectos.",
      l_cad: "Cadastro predial", l_curvas: "Curvas de nível", l_agua: "Linhas de água", l_caminhos: "Caminhos", l_ren: "REN", l_ran: "RAN",
      l_pdm: "PDM · qualificação do solo", l_n2k: "Rede Natura 2000", l_dph: "Domínio público hídrico", l_perig: "Perigosidade de incêndio",
      l_srup: "Servidões oficiais (DGT)", l_bacias: "Bacias", l_cos: "Ocupação do solo (COS)", l_solos: "Carta de solos", l_copa: "Densidade de copa",
      l_ardidas: "Áreas ardidas", l_faixas: "Faixas de gestão de combustível", l_zif: "Zonas de intervenção florestal", l_habitats: "Habitats",
      l_gbif: "Registos de espécies", l_vedacoes: "Vedações", l_pontos: "Pontos de água", l_ap: "Áreas protegidas", l_relevo: "Relevo sombreado",
      avisoDR: "Informação de apoio. Prevalece o que está publicado em Diário da República.",
      licSrup: "Servidões e restrições de utilidade pública: © Direção-Geral do Território (SNIT/SRUP), licença CC BY 4.0, com as condições de utilização do SNIT.",
      pdmCentro: "PDM do município ao centro do mapa", pdmA: "A procurar o município…", pdmFora: "Centre o mapa num município de Portugal continental.",
      pdmPlanta: "Planta de condicionantes do PDM de {m} (imagem de referência)", pdmPorConf: "{m}: planta do PDM por confirmar.",
      pdmNota: "Imagem da planta publicada, servida pela DGT. Não substitui a consulta do plano em vigor.",
      // §63
      comecar: "Por onde começar?", comecarCurto: "Começar",
      triTitulo: "Por onde começar?", triSub: "Diga-nos o que procura. Mostramos o caminho passo a passo, primeiro com o que é gratuito.",
      q_conhecer: "Quero conhecer um terreno", qs_conhecer: "Ver o relevo, a água, o solo e as condicionantes de um sítio.",
      q_planta: "Preciso de uma planta do terreno", qs_planta: "Uma planta à escala para a câmara, um projecto ou uma escritura.",
      q_planear: "Quero planear ou trabalhar o meu terreno", qs_planear: "Água, relevo, solo, acessos e trabalho de campo.",
      q_prof: "Trabalho com terrenos", qs_prof: "Arquitectos, engenheiros, topógrafos, técnicos, mediadores e associações.",
      triRodape: "Pode voltar a este ecrã em Temas, na ligação «Por onde começar?».", sair: "Sair do assistente e ver o mapa", sairCurto: "Sair", explorar: "Explorar sozinho",
      fechar: "Fechar", voltar: "Voltar", seguinte: "Seguinte", inicio: "Voltar às perguntas iniciais", terminar: "Terminar",
      passo: "Passo {i} de {n}", continuar: "Continuar", minimizar: "Ver o mapa",
      s1t: "Procure o sítio", s1h: "Escreva o nome de uma localidade, uma morada, coordenadas ou o NIC do prédio na caixa de pesquisa. O mapa leva-o lá.",
      s1b: "Procurar um local",
      s2t: "Desenhe ou escolha o terreno", s2h: "Pode desenhar o limite clicando nos cantos do terreno, escolher as parcelas do cadastro quando existem, ou carregar um ficheiro (KML, KMZ, GeoJSON, Shapefile).",
      s3t: "Veja a ficha rápida", s3h: "Com o terreno fechado, aparece à direita a «Ficha do terreno», gratuita: área, altitude, declive, ocupação do solo e as principais condicionantes que tocam no terreno. É indicativa, feita a partir de dados públicos.",
      s3b: "Mostrar a ficha", s3sem: "Ainda não há terreno desenhado. Volte ao passo anterior e desenhe ou escolha o terreno.",
      s4t_conhecer: "Se quiser ir mais fundo: Leitura do Terreno",
      s4h_conhecer: "Relatório em PDF feito pela nossa equipa: condicionantes (REN, RAN, PDM, Rede Natura, água e fogo), ocupação do solo e extractos de mapas, com interpretação técnica do que permitem e do que limitam.",
      s4t_planta: "A Planta de Localização",
      s4h_planta: "PDF à escala (1:1 000 a 1:25 000), em A4 ou A3, sobre o ortofotomapa da DGT, com quadrícula, norte, escala e quadro de vértices em PT-TM06, e extractos das condicionantes. Faz-se a partir de um terreno guardado num projecto. Não é uma peça municipal certificada: confirme com a câmara o que o seu processo exige.",
      s4t_planear: "Para planear: Base Cartográfica",
      s4h_planear: "Levantamento do relevo do seu terreno a partir do LiDAR da DGT: curvas de nível de 0,5 m, declives, linhas de água, acumulação de escoamento, bacias e erosão. Fica no Atlas, em 3D, e em ficheiros para SIG e QField.",
      s4t_prof: "Para profissionais: Intelligence",
      s4h_prof: "Abre o resto do Atlas: condicionantes, água, solo e vegetação, as camadas da sua Base Cartográfica, as ferramentas de análise e o trabalho em equipa. Abre com qualquer serviço contratado à Terracrua Design ou por assinatura.",
      preco: "Preço", precoSob: "Preço a anunciar.",
      s4b_leitura: "Pedir a Leitura do Terreno", s4b_planta: "Fazer a planta", s4b_base: "Encomendar a Base Cartográfica", s4b_intel: "Ver o Intelligence",
      plantaSem: "Abra o separador Projectos, escolha o projecto e carregue em «Planta de localização». Se ainda não tem projecto, guarde primeiro o terreno.",
      s5t: "Continue no tema certo", s5h: "Os temas ligam as camadas que interessam para o seu caso e explicam o que está no mapa. Pode mudar de tema quando quiser, no painel das camadas.",
      s5b: "Abrir o tema «{t}»"
    },
    en: {
      lingua: "Language", pt: "Português", en: "English",
      temas: "Themes", temasSub: "Choose what you want to see. Each theme turns on the right layers and explains what is on the map.",
      todas: "All layers", todasAbrir: "Show the full list of layers", todasFechar: "Hide the full list",
      sairTema: "Leave theme", maisCamadas: "More layers in this theme", oQueVe: "What you are looking at", legenda: "Legend", camadas: "Layers in this theme",
      ferramentas: "Tools", produto: "Related product", vista3d: "3D view",
      tranc: "Intelligence", trancT: "Intelligence layer. Unlocked with any service you order from us, or by subscription.",
      daBase: "In your Base Map", daBaseT: "Appears once the Base Map for this plot has been delivered.",
      porActivar: "not active yet", porActivarT: "The official DGT service is not yet connected on the IPR Atlas site.",
      fechadas: "{n} layers in this theme belong to Intelligence and are locked.",
      t_terreno: "Get to know the land", t_cond: "Constraints", t_relevo: "Terrain and water in 3D", t_solo: "Soil and vegetation",
      t_fogo: "Fire", t_campo: "Fieldwork", t_ecologia: "Ecology", t_org: "Design · {org}",
      v_terreno: "Recent orthophoto with hillshade, contour lines, land registry, watercourses, tracks and place names. Use it to read the site before you go there.",
      v_cond: "Public easements and land-use planning: REN, RAN, municipal plan (PDM) land classification, Natura 2000, public water domain, wildfire hazard and official DGT easements. They show what may limit building, planting or working the land.",
      v_relevo: "3D hillshade, contour lines, watercourses and catchments. Tilt the map with two fingers or the right mouse button to see where water runs and gathers.",
      v_solo: "Land cover (COS 2023), soil map, land capability, tree canopy density and soil organic carbon. Helps you understand what the soil can take and what already grows there.",
      v_fogo: "Structural wildfire hazard, burnt areas from 2015 to 2025, the primary network of fuel breaks and forest intervention zones.",
      v_campo: "A light map for use on site: land registry, contours, tracks, fences, water points and names. Drop notes with the marker and take the project into QField.",
      v_ecologia: "Habitats, Natura 2000, protected areas, isolated trees and hedgerows, canopy density and species records (GBIF). Shows the natural structure around the plot.",
      v_org: "Your organisation's working layers on top of terrain, water and land registry.",
      p_leitura: "Land Reading", p_planta: "Location Plan", p_base: "Base Map", p_intel: "Intelligence access", p_org: "Open the organisation",
      pr_leitura: "from €250 + VAT", pr_base: "from €99 + VAT",
      m_cadastro: "Land registry parcels", m_desenhar: "Draw on the map", m_ficheiro: "Upload a file", m_artigo: "Tax article or title deed", mh_cadastro: "Click the parcels of your land on the map.", mh_desenhar: "Click the corners of the land; finish on the first point.", mh_ficheiro: "KML, KMZ, GeoJSON, Shapefile or GPX.", mh_artigo: "No map? Give the municipality, parish and article; we will locate it.", mfalta: "Open the Processes tab on the right and choose how to indicate the land.", f_busca: "Search a place", f_desenhar: "Draw the plot", f_parcelas: "Pick parcels", f_importar: "Upload a file",
      f_area: "Measure area", f_regua: "Measure distance", f_perfil: "Elevation profile", f_3d: "3D view", f_sol: "Sun and shade",
      f_historico: "Older imagery", f_marcador: "Note on the map", f_gps: "My position", f_qfield: "QField",
      qfieldN: "The QField connection is in IPR Cloud, under the Projects tab.",
      l_cad: "Land registry", l_curvas: "Contour lines", l_agua: "Watercourses", l_caminhos: "Tracks", l_ren: "REN (ecological reserve)", l_ran: "RAN (agricultural reserve)",
      l_pdm: "PDM · land classification", l_n2k: "Natura 2000", l_dph: "Public water domain", l_perig: "Wildfire hazard",
      l_srup: "Official easements (DGT)", l_bacias: "Catchments", l_cos: "Land cover (COS)", l_solos: "Soil map", l_copa: "Canopy density",
      l_ardidas: "Burnt areas", l_faixas: "Fuel breaks", l_zif: "Forest intervention zones", l_habitats: "Habitats",
      l_gbif: "Species records", l_vedacoes: "Fences", l_pontos: "Water points", l_ap: "Protected areas", l_relevo: "Hillshade",
      avisoDR: "For guidance only. What is published in the Diário da República (Portugal's official gazette) prevails.",
      licSrup: "Public utility easements and restrictions: © Direção-Geral do Território (SNIT/SRUP), CC BY 4.0 licence, subject to the SNIT terms of use.",
      pdmCentro: "Municipal plan (PDM) at the centre of the map", pdmA: "Looking up the municipality…", pdmFora: "Centre the map on a municipality in mainland Portugal.",
      pdmPlanta: "PDM constraints plan for {m} (reference image)", pdmPorConf: "{m}: PDM plan not yet confirmed.",
      pdmNota: "Image of the published plan, served by DGT. Does not replace checking the plan in force.",
      comecar: "Where to start?", comecarCurto: "Start",
      triTitulo: "Where to start?", triSub: "Tell us what you are looking for. We will show you the way step by step, starting with what is free.",
      q_conhecer: "I want to get to know a piece of land", qs_conhecer: "See the terrain, water, soil and planning constraints of a site.",
      q_planta: "I need a plan of the land", qs_planta: "A scaled plan for the council, a project or a deed.",
      q_planear: "I want to plan or work my land", qs_planear: "Water, terrain, soil, access and fieldwork.",
      q_prof: "I work with land", qs_prof: "Architects, engineers, surveyors, consultants, agents and associations.",
      triRodape: "You can come back to this screen from Themes, with the «Where to start?» link.", sair: "Leave the assistant and see the map", sairCurto: "Leave", explorar: "Explore on my own",
      fechar: "Close", voltar: "Back", seguinte: "Next", inicio: "Back to the first questions", terminar: "Finish",
      passo: "Step {i} of {n}", continuar: "Continue", minimizar: "See the map",
      s1t: "Find the place", s1h: "Type a town, an address, coordinates or the property's NIC in the search box. The map takes you there.",
      s1b: "Search a place",
      s2t: "Draw or pick the plot", s2h: "You can draw the boundary by clicking the corners of the plot, pick land registry parcels where they exist, or upload a file (KML, KMZ, GeoJSON, Shapefile).",
      s3t: "See the quick summary", s3h: "Once the plot is closed, the free «Plot summary» appears on the right: area, altitude, slope, land cover and the main constraints touching the plot. It is indicative, built from public data.",
      s3b: "Show the summary", s3sem: "There is no plot drawn yet. Go back one step and draw or pick the plot.",
      s4t_conhecer: "To go further: Land Reading",
      s4h_conhecer: "A PDF report prepared by our team: constraints (REN, RAN, PDM, Natura 2000, water and fire), land cover and map extracts, with a technical reading of what they allow and what they limit.",
      s4t_planta: "The Location Plan",
      s4h_planta: "A scaled PDF (1:1,000 to 1:25,000), A4 or A3, on the DGT orthophoto, with grid, north arrow, scale bar and a table of vertices in PT-TM06, plus extracts of the constraints. It is made from a plot saved in a project. It is not a certified municipal document: check with the council what your application requires.",
      s4t_planear: "To plan: Base Map",
      s4h_planear: "A terrain survey of your plot from DGT LiDAR: 0.5 m contour lines, slopes, watercourses, flow accumulation, catchments and erosion. It stays in the Atlas, in 3D, and comes as files for GIS and QField.",
      s4t_prof: "For professionals: Intelligence",
      s4h_prof: "Unlocks the rest of the Atlas: constraints, water, soil and vegetation, the layers of your Base Map, analysis tools and teamwork. Unlocked with any service you order from Terracrua Design, or by subscription.",
      preco: "Price", precoSob: "Price to be announced.",
      s4b_leitura: "Order the Land Reading", s4b_planta: "Make the plan", s4b_base: "Order the Base Map", s4b_intel: "See Intelligence",
      plantaSem: "Open the Projects tab, choose the project and press «Location plan». If you have no project yet, save the plot first.",
      s5t: "Carry on in the right theme", s5h: "Themes turn on the layers that matter for your case and explain what is on the map. You can switch theme at any time in the layers panel.",
      s5b: "Open the «{t}» theme"
    }
  };
  function lingua62() {
    var g = ler("ipr_lingua"); if (g && L62[g]) return g;
    var s = String(window.IPR_LANG || "").toLowerCase(); if (L62[s]) return s;
    var n = String((navigator.languages && navigator.languages[0]) || navigator.language || "pt").toLowerCase();
    return n.indexOf("pt") === 0 ? "pt" : "en";
  }
  window.IPR_LINGUA = lingua62();
  function t62(k, v) {
    var l = window.IPR_LINGUA, s = (L62[l] && L62[l][k] != null) ? L62[l][k] : (L62.en[k] != null ? L62.en[k] : (L62.pt[k] != null ? L62.pt[k] : k));
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc62(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mudarLingua(l) {
    if (!L62[l]) return; window.IPR_LINGUA = l; gravar("ipr_lingua", l);
    try { document.dispatchEvent(new CustomEvent("ipr:lingua", { detail: l })); } catch (e) {}
  }
  window.__iprLingua = { definir: mudarLingua, t: t62, dic: L62 };
  function selLingua(cls) {
    return '<div class="ipr-lg ' + (cls || "") + '" role="group" aria-label="' + esc62(t62("lingua")) + '">' + Object.keys(L62).map(function (l) {
      return '<button type="button" data-lg="' + l + '" lang="' + l + '" aria-pressed="' + (l === window.IPR_LINGUA) + '" title="' + esc62(L62[l][l]) + '">' + l.toUpperCase() + "</button>";
    }).join("") + "</div>";
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".ipr-lg [data-lg]"); if (b) { e.preventDefault(); mudarLingua(b.getAttribute("data-lg")); } });
  document.addEventListener("ipr:lingua", function () { document.querySelectorAll(".ipr-lg [data-lg]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lg") === window.IPR_LINGUA)); }); });

  // §64 Condicionantes oficiais (SRUP da DGT, Nuno 26/10/2026; fontes em propostas/condicionantes-pdm/fontes-srup.md).
  // As servidões entram no catálogo do viz.js (IPRViz.juntar, antes de o mapa se criar) como «wmsp»: passam pelo mesmo proxy
  // WMS do site que a REN, a RAN e o domínio público hídrico (/wp-json/tcd/v1/wms/<src>, m14473, com o disjuntor do m90341),
  // porque o GetMap do SNIT só responde em http. Os códigos novos (srup_*, pdm_*) precisam de ser acrescentados nesses dois
  // módulos (proposta em propostas/atlas-temas/); até lá o Atlas pergunta uma vez ao servidor e mostra-os como «a activar».
  // Grupo «cond» (fechado ao Explorer pelo viz.js e pelo §25). O que está marcado como restrito (lic «r») não entra no Explorer.
  // A rede eléctrica, as estradas e as ferrovias não são publicadas pela DGT como SRUP nacional: ficam as cópias que já existem.
  var SRUP64 = [
    // [código, nome pt, nome en, cor, restrito]
    ["aapc", "Albufeiras de águas públicas classificadas", "Classified public reservoirs", "#3f8fd2"],
    ["casap", "Captações de águas subterrâneas (abastecimento público)", "Groundwater abstractions for public supply", "#2a6db0"],
    ["rf", "Regime florestal", "Forest regime", "#2e7d32"],
    ["aip", "Árvores de interesse público", "Trees of public interest", "#5b8c2a"],
    ["eaf", "Sobreiro, azinheira e oliveira (protecção)", "Cork oak, holm oak and olive (protection)", "#7a8c3a", 1],
    ["ic", "Imóveis classificados e zonas de protecção", "Listed buildings and protection zones", "#9b4f96"],
    ["mg", "Marcos geodésicos e zona de segurança", "Survey markers and safety zone", "#c25a3a"],
    ["rg", "Recursos geológicos (pedreiras, concessões, águas minerais)", "Geological resources (quarries, concessions, mineral water)", "#8c6d4f"],
    ["go", "Gasodutos e oleodutos", "Gas and oil pipelines", "#d98b1e"],
    ["aa", "Aeroportos e aeródromos", "Airports and aerodromes", "#6c7a89"],
    ["dn", "Defesa nacional", "National defence", "#7b5e57"],
    ["cpir", "Carta de perigosidade de incêndio rural (SRUP)", "Rural wildfire hazard map (SRUP)", "#d9534f"]
  ];
  // Plantas de condicionantes do PDM confirmadas no documento de fontes (WMS raster da DGT; DICO = código do município).
  var PDM64 = { "almodovar": { d: "0202", n: "Almodôvar" }, "figueira da foz": { d: "0605", n: "Figueira da Foz" }, "alter do chao": { d: "1201", n: "Alter do Chão" } };
  var SRUP_IDS = [], PDM_IDS = {};
  function norm64(s) { return String(s || "").toLowerCase().normalize ? String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() : String(s || "").toLowerCase().trim(); }
  function registarSrup() {
    var V = window.IPRViz; if (!V || typeof V.juntar !== "function") return false;
    var expl = window.IPR_NIVEL === "explorer", sub = "Servidões oficiais (SRUP · DGT)", fonte = "DGT · SNIT/SRUP · CC BY 4.0";
    SRUP64.forEach(function (s) {
      if (s[4] && expl) return; // restrito: nem aparece no Explorer
      var id = "srup_" + s[0];
      V.juntar({ id: id, g: "cond", sub: sub, n: s[1], t: "wmsp", src: id, lic: s[4] ? "r" : "v", op: .75, cor: s[3], minz: 9,
        fonte: fonte, nota: "Informação de apoio. Prevalece o que está publicado em Diário da República.", srup: 1, en: s[2] });
      SRUP_IDS.push(id); TEMA_CAT[id] = "cond";
    });
    Object.keys(PDM64).forEach(function (k) {
      var p = PDM64[k], id = "pdm_" + p.d;
      V.juntar({ id: id, g: "cond", sub: "PDM · planta de condicionantes (imagem)", n: "Planta de condicionantes · " + p.n, t: "wmsp", src: id, lic: "v", op: .7, cor: "#b07aa1", minz: 10,
        fonte: "Câmara Municipal de " + p.n + " · DGT/SNIT · CC BY 4.0", nota: "Imagem da planta publicada. Prevalece o que está publicado em Diário da República.", pdm: 1 });
      PDM_IDS[k] = id; TEMA_CAT[id] = "cond";
    });
    return true;
  }
  ["dph"].forEach(function (id) { TEMA_CAT[id] = "cond"; });
  ["n_gbif_todas", "n_gbif_aves", "n_gbif_plantas"].forEach(function (id) { TEMA_CAT[id] = "nat"; });
  ["l_acumulacao", "l_streams", "l_bacias_l", "l_declives"].forEach(function (id) { TEMA_CAT[id] = "lidar"; });
  try { registarSrup(); } catch (e) {}
  // Pergunta uma vez ao servidor se a rota WMS já conhece os códigos novos (um mosaico de Lisboa; 404 = rota antiga).
  var SRUP_SRV = null;
  function srupServidor() {
    if (SRUP_SRV) return SRUP_SRV;
    var u = "/wp-json/tcd/v1/wms/srup_rf?bbox=-1017529.7205322663,4696291.017841229,-978393.9620502643,4735426.776323231";
    SRUP_SRV = fetch(u, { credentials: "same-origin" }).then(function (r) { return r.status !== 404 && r.status !== 400; }).catch(function () { return false; });
    return SRUP_SRV;
  }

  // §62 Temas por cima das camadas (Nuno 26/10/2026). Os sete temas passam a ser a entrada principal do painel das camadas:
  // cada um define o fundo, as camadas ligadas, a vista 3D, a legenda, uma caixa «o que está a ver», as ferramentas que
  // interessam e o produto ligado. Usa o §25 (TEMAS_IPR, aplicarConjunto, trancada, ipr_temas_meus): o menu antigo passa a
  // «Os meus temas» e mostra os mesmos sete. «Design Terracrua Design» passa a tema da organização: só aparece a quem pertence
  // a uma organização com camadas (window.tcdOrg). No Explorer as camadas fechadas aparecem com cadeado e o botão do produto;
  // as restritas não aparecem. A lista completa continua por baixo, em «Todas as camadas» (aberta ou fechada, fica guardado).
  var T62 = [
    { id: "terreno", ic: "M3 17l5-7 4 4 3-4 6 7z", fundo: "f_ortosat", c: ["r_somb", "r_curvas", "cad", "hidro", "o_caminhos", "o_nomes"], d3: false,
      leg: [["l_cad", "#f4d35e", "linha"], ["l_curvas", "#b9b4ad", "linha"], ["l_agua", "#4fa3e0", "linha"], ["l_caminhos", "#d9c9a3", "linha"]],
      ferr: ["busca", "desenhar", "parcelas", "area", "regua"], prod: "leitura" },
    { id: "cond", ic: "M12 3l8 3v6c0 4.4-3.4 8-8 9-4.6-1-8-4.6-8-9V6z", fundo: "f_ortosat", c: ["crus", "ren", "ran", "n2k", "dph", "perig_e", "la350"], d3: false,
      extra: ["rnap", "albuf", "capt", "arv", "marcos", "aero", "defesa", "eletr", "perig_s"], srup: true,
      leg: [["l_ren", "#3a8a3a", "area"], ["l_ran", "#c9a227", "area"], ["l_pdm", "#e9d66b", "area"], ["l_n2k", "#2f6b3a", "area"], ["l_dph", "#1f78b4", "linha"], ["l_perig", "#d9534f", "area"], ["l_srup", "#9b4f96", "area"]],
      ferr: ["desenhar", "parcelas", "area"], prod: "planta" },
    { id: "relevo", ic: "M2 20l7-12 4 6 3-4 6 10z", fundo: "f_relevo", c: ["r_somb", "r_curvas", "hidro", "bacias", "bac_troco"], d3: true, extra: ["l_acumulacao", "l_streams", "l_bacias_l", "l_declives", "esc_med"],
      leg: [["l_relevo", "#8d877c", "area"], ["l_curvas", "#b9b4ad", "linha"], ["l_agua", "#4fa3e0", "linha"], ["l_bacias", "#7fb3d5", "area"]],
      ferr: ["3d", "perfil", "regua", "sol"], prod: "base" },
    { id: "solo", ic: "M4 18c4-8 12-8 16 0M12 4v8M9 8l3-4 3 4", fundo: "f_ortosat", c: ["cos23", "solos", "sroa", "copa18"], d3: false, extra: ["carbono", "swf21", "desert", "geo", "invasoras"],
      leg: [["l_cos", "#f2d16b", "area"], ["l_solos", "#a1887f", "area"], ["l_copa", "#2e7d32", "area"]],
      ferr: ["area", "historico", "desenhar"], prod: "leitura" },
    { id: "fogo", ic: "M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-4 0-6z", fundo: "f_ortosat", c: ["perig_e", "ard15", "redeprim", "zif"], d3: false, extra: ["perig", "ard75", "sgifr_a", "sgifr_l", "icnfpa"],
      leg: [["l_perig", "#d9534f", "area"], ["l_ardidas", "#5d4037", "area"], ["l_faixas", "#ff9800", "linha"], ["l_zif", "#8bc34a", "area"]],
      ferr: ["area", "historico", "3d"], prod: "intel" },
    { id: "campo", ic: "M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 9v2", fundo: "f_ortosat", c: ["cad", "r_curvas", "o_caminhos", "o_aguapts", "icnfpa", "o_vedacoes", "o_nomes"], d3: false,
      leg: [["l_cad", "#f4d35e", "linha"], ["l_caminhos", "#d9c9a3", "linha"], ["l_vedacoes", "#bdbdbd", "linha"], ["l_pontos", "#4fc3f7", "ponto"]],
      ferr: ["marcador", "gps", "regua", "qfield"], prod: "base" },
    { id: "ecologia", ic: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7", fundo: "f_ortosat", c: ["habitats", "n2k", "rnap", "copa18", "swf21", "n_gbif_todas"], d3: false, extra: ["invasoras", "cos23", "o_protegidas"],
      leg: [["l_habitats", "#66bb6a", "area"], ["l_n2k", "#2f6b3a", "area"], ["l_ap", "#9ccc65", "area"], ["l_gbif", "#ff8a65", "area"]],
      ferr: ["area", "historico"], prod: "leitura" }
  ];
  var T62_ORG = { id: "org", ic: "M4 20V8l8-4 8 4v12M9 20v-6h6v6", fundo: "f_ortosat", c: ["r_curvas", "r_somb", "hidro", "bacias", "solos", "cad", "o_nomes"], d3: false,
    leg: [["l_curvas", "#b9b4ad", "linha"], ["l_agua", "#4fa3e0", "linha"], ["l_cad", "#f4d35e", "linha"]], ferr: ["desenhar", "area", "perfil", "3d"], prod: "org" };
  // O menu antigo («Os meus temas») mostra os mesmos sete; o «Design Terracrua Design» deixa a lista geral.
  (function () {
    var novos = T62.map(function (t) { return { id: t.id, nome: L62.pt["t_" + t.id], fundo: t.fundo, c: t.c } });
    var alc = TEMAS_IPR.filter(function (t) { return !/^(terreno|agua|ecologia|cond|campo|design)$/.test(t.id); });
    TEMAS_IPR.length = 0; novos.concat(alc).forEach(function (t) { TEMAS_IPR.push(t); });
  })();
  function catIdx() { var m = {}; try { (window.IPRViz.catalogo || []).forEach(function (e) { m[e.id] = e; }); } catch (e) {} return m; }
  function orgDesign() {
    try { var d = window.tcdOrg && window.tcdOrg.dados && window.tcdOrg.dados(); if (d && d.org && (d.camadas || []).length) return d; } catch (e) {} return null;
  }
  function temasLista() { var l = T62.slice(); if (orgDesign()) l.push(T62_ORG); return l; }
  function nomeTema(t) { if (t.id === "org") { var d = orgDesign(); return t62("t_org", { org: (d && d.org && d.org.nome) || "Terracrua Design" }); } return t62("t_" + t.id); }
  var EST62 = { tema: null, d3: false, abertos: { srup: 1 } };
  function estadoCamada(id, C) {
    var e = C[id]; if (!e) return "fora";
    var expl = window.IPR_NIVEL === "explorer";
    if (expl && e.lic === "r") return "fora";
    if (/^l_/.test(id)) return "base";
    if ((e.srup || e.pdm) && SRUP_ON === false) return "srv";
    if (expl && (trancada(id) || (/^(cond|agua|solo|fogo)$/.test(e.g) && e.lic === "v" && !/Pré-visualização/.test(String(e.sub || ""))))) return "tranc";
    return "ok";
  }
  var SRUP_ON = null;
  function ferramenta(k) {
    var sel = { desenhar: '[data-tool="desenhar"]', parcelas: '[data-tool="parcelas"]', importar: '[data-tool="importar"]', area: '[data-tool="area"]', regua: '[data-tool="regua"]',
      "3d": '[data-tool="3d"]', sol: '[data-tool="sol"]', historico: '[data-tool="historico"]', marcador: '[data-tool="marcador"]', gps: '[data-tool="gps"]', perfil: "#ipr-perfil-b" }[k];
    if (k === "busca") {
      var i = document.querySelector("#ipe-busca input");
      if (i && !i.offsetParent) { var lb = document.querySelector('[data-tool="lado"]') || document.getElementById("ipe-camadas"); if (lb) lb.click(); }
      setTimeout(function () { var j = document.querySelector("#ipe-busca input"); if (j) { try { j.focus(); j.select(); } catch (e) {} } }, 250);
      return true;
    }
    if (k === "qfield") { abrirSeparador("proj"); avisar62(t62("qfieldN")); return true; }
    var b = sel && document.querySelector("#ipe " + sel); if (!b) return false;
    if (k === "3d" && window.__ipe && window.__ipe.estado && window.__ipe.estado.em3d) return true;
    fecharPainelMovel(); b.click(); return true;
  }
  function fecharPainelMovel() {
    // no telemóvel, a barra lateral tapa o mapa: fecha-se antes de usar uma ferramenta de desenho
    if (window.innerWidth > 760) return;
    var lb = document.querySelector('#ipe [data-tool="lado"][aria-pressed="true"]'); if (lb) lb.click();
  }
  function abrirSeparador(tab) { var b = document.querySelector('#ipe .ipe-tab[data-tab="' + tab + '"]'); if (b) { b.click(); return true; } return false; }
  function avisar62(txt) {
    var a = document.getElementById("ipr-av62");
    if (!a) { a = document.createElement("div"); a.id = "ipr-av62"; a.setAttribute("role", "status"); (document.getElementById("ipe") || document.body).appendChild(a); }
    a.textContent = txt; a.classList.add("on"); clearTimeout(a.__t); a.__t = setTimeout(function () { a.classList.remove("on"); }, 6000);
  }
  function produto(k) {
    if (k === "intel") { location.href = "/ipr-cloud/"; return; }
    if (k === "org") { if (!abrirSeparador("org")) abrirSeparador("proj"); return; }
    if (k === "planta") {
      abrirSeparador("proj");
      var bs = document.querySelectorAll("#ipe [data-ppl]");
      if (bs.length === 1) { bs[0].click(); return; }
      if (bs.length) { try { bs[0].scrollIntoView({ block: "center" }); } catch (e) {} }
      avisar62(t62("plantaSem")); return;
    }
    abrirSeparador("enc");
    var sb = [].filter.call(document.querySelectorAll("#ipe button"), function (b) { return /^Base Cartogr/.test(b.textContent.trim()) && b.offsetParent; })[0]; if (sb) sb.click();
    if (k === "leitura") {
      setTimeout(function () {
        var lab = [].filter.call(document.querySelectorAll('#ipe [data-pane="enc"] label, #ipe [data-pane="enc"] .ipe-ck, #ipe [data-pane="enc"] div'), function (x) { return /Leitura Territorial/.test(x.textContent) && x.querySelector('input[type="checkbox"]'); }).pop();
        var ck = lab && lab.querySelector('input[type="checkbox"]');
        if (ck && !ck.checked) ck.click();
        if (lab) { try { lab.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} }
      }, 200);
    }
  }
  function aplicarTema62(t) {
    var R = viz(); if (!R) return;
    EST62.tema = t.id; gravar("ipr_t62_tema", t.id);
    aplicarConjunto(t.c, t.fundo);
    var em3d = !!(window.__ipe && window.__ipe.estado && window.__ipe.estado.em3d), b3 = document.querySelector('#ipe [data-tool="3d"]');
    if (t.d3 && !em3d && b3) { b3.click(); EST62.d3 = true; }
    else if (!t.d3 && em3d && EST62.d3 && b3) { b3.click(); EST62.d3 = false; var M0 = mapa(); if (M0) try { M0.easeTo({ pitch: 0, duration: 600 }); } catch (x) {} }
    if (t.id === "cond") { srupServidor().then(function (ok) { SRUP_ON = ok; pintar62(); }); pdmCentro(); }
    pintar62();
    var cc = document.getElementById("ipr-t62"); if (cc) try { cc.scrollIntoView({ block: "start" }); } catch (x) {}
  }
  function sairTema62() {
    EST62.tema = null; gravar("ipr_t62_tema", "");
    if (EST62.d3) { var b3 = document.querySelector('#ipe [data-tool="3d"][aria-pressed="true"]'); if (b3) b3.click(); EST62.d3 = false; var M0 = mapa(); if (M0) try { M0.easeTo({ pitch: 0, duration: 600 }); } catch (x) {} }
    pintar62();
  }
  // PDM do município ao centro do mapa (só com o tema Condicionantes aberto)
  var PDM_EST = { k: null, nome: "", a: false };
  // §76 PDM do país todo (Nuno, 27/10/2026, 10h20). O servidor (m90387) lê o catálogo do SNIG e as camadas de cada PDM e
  //     publica em /wp-json/tcd/v1/pdm/lista os municípios com planta de condicionantes pronta; o proxy (m90379) serve
  //     pdm_<DICO>. Quando o centro do mapa cai num município ainda não registado, a camada entra no catálogo nessa altura.
  var PDM76 = null, PDM76_P = null, PDM76_T = 0;
  function pdm76(k, nome, feito) {
    if (!k || PDM_IDS[k]) return feito();
    if (!PDM76_P) PDM76_T = Date.now(), PDM76_P = fetch("/wp-json/tcd/v1/pdm/lista").then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { PDM76 = {}; (j.pdm || []).forEach(function (p) { PDM76[norm64(p.n)] = p; }); }).catch(function () { PDM76 = {}; });
    PDM76_P.then(function () {
      var p = PDM76 && PDM76[k], V = window.IPRViz;
      if (!p && Date.now() - (PDM76_T || 0) > 6e5) PDM76_P = null; // 27/10: a lista enche ao longo do dia; volta a pedir passados 10 min
      if (p && V && typeof V.juntar === "function") {
        var id = "pdm_" + p.d;
        V.juntar({ id: id, g: "cond", sub: "PDM · planta de condicionantes (imagem)", n: "Planta de condicionantes · " + (nome || p.n), t: "wmsp", src: id, lic: "v", op: .7, cor: "#b07aa1", minz: 10,
          fonte: "Câmara Municipal de " + (nome || p.n) + " · DGT/SNIT · CC BY 4.0", nota: "Imagem da planta publicada. Prevalece o que está publicado em Diário da República.", pdm: 1 });
        PDM_IDS[k] = id; TEMA_CAT[id] = "cond";
      }
      feito();
    });
  }
  function pdmCentro() {
    var M = mapa(); if (!M || EST62.tema !== "cond") return;
    var c = M.getCenter(); PDM_EST.a = true; pintarPdm();
    plSitio(c.lng, c.lat).then(function (s) { PDM_EST.a = false; PDM_EST.nome = s.municipio || ""; PDM_EST.k = norm64(s.municipio); pdm76(PDM_EST.k, PDM_EST.nome, pintarPdm); });
  }
  function pintarPdm() {
    var w = document.querySelector("#ipr-t62 .ipr-t62-pdm"); if (!w) return;
    var h = '<span class="ipr-t62-h">' + esc62(t62("pdmCentro")) + "</span>";
    if (PDM_EST.a) h += '<p class="ipr-t62-n">' + esc62(t62("pdmA")) + "</p>";
    else if (!PDM_EST.nome) h += '<p class="ipr-t62-n">' + esc62(t62("pdmFora")) + "</p>";
    else if (PDM_IDS[PDM_EST.k]) { h += linhaCamada(PDM_IDS[PDM_EST.k], catIdx(), t62("pdmPlanta", { m: PDM_EST.nome })) + '<p class="ipr-t62-n">' + esc62(t62("pdmNota")) + "</p>"; }
    else h += '<p class="ipr-t62-n">' + esc62(t62("pdmPorConf", { m: PDM_EST.nome })) + "</p>";
    w.innerHTML = h;
  }
  var CAD = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function nomeCamada(e) { return window.IPR_LINGUA !== "pt" && e.en ? e.en : e.n; }
  function linhaCamada(id, C, rot) {
    var e = C[id], st = estadoCamada(id, C); if (st === "fora") return "";
    var on = false; try { on = viz().activas().indexOf(id) >= 0; } catch (x) {}
    var nome = esc62(rot || nomeCamada(e));
    if (st === "tranc") return '<div class="ipr-t62-l tranc" title="' + esc62(t62("trancT")) + '"><span class="cad">' + CAD + "</span><span>" + nome + '</span><em>' + esc62(t62("tranc")) + "</em></div>";
    if (st === "base") return '<div class="ipr-t62-l base" title="' + esc62(t62("daBaseT")) + '"><label><input type="checkbox" data-c62="' + id + '"' + (on ? " checked" : "") + "> <span>" + nome + '</span></label><em>' + esc62(t62("daBase")) + "</em></div>";
    if (st === "srv") return '<div class="ipr-t62-l srv" title="' + esc62(t62("porActivarT")) + '"><span>' + nome + '</span><em>' + esc62(t62("porActivar")) + "</em></div>";
    return '<div class="ipr-t62-l"><label><input type="checkbox" data-c62="' + id + '"' + (on ? " checked" : "") + "> <span>" + nome + "</span></label></div>";
  }
  function pintar62() {
    var w = document.getElementById("ipr-t62"); if (!w) return;
    var lista = temasLista(), C = catIdx(), t = lista.filter(function (x) { return x.id === EST62.tema; })[0];
    var h = '<div class="ipr-t62-cab"><b>' + esc62(t62("temas")) + "</b></div>";
    if (!t) h += '<p class="ipr-t62-sub">' + esc62(t62("temasSub")) + "</p>";
    h += '<div class="ipr-t62-g' + (t ? " cmp" : "") + '" role="list">'  + lista.map(function (x, i) {
      return '<button type="button" role="listitem" data-t62="' + x.id + '" aria-pressed="' + (x.id === EST62.tema) + '" lang="' + window.IPR_LINGUA + '"><span class="tp"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + x.ic + '"/></svg>' + (x.id === "org" ? "" : '<i>' + (i + 1) + "</i>") + '</span><span class="n">' + esc62(nomeTema(x)) + "</span></button>";
    }).join("") + "</div>";
    if (t) {
      var ids = t.c.concat(t.extra || []), fech = 0;
      if (t.srup) ids = ids.concat(SRUP_IDS);
      ids.forEach(function (id) { if (estadoCamada(id, C) === "tranc") fech++; });
      h += '<section class="ipr-t62-c" aria-label="' + esc62(nomeTema(t)) + '"><div class="ipr-t62-ct"><b>' + esc62(nomeTema(t)) + "</b>" + (t.d3 ? '<span class="ipr-t62-3d">3D</span>' : "") + '<button type="button" class="ipr-t62-x" data-t62sair>' + esc62(t62("sairTema")) + "</button></div>";
      h += '<div class="ipr-t62-ver"><span class="ipr-t62-h">' + esc62(t62("oQueVe")) + "</span><p>" + esc62(t62("v_" + t.id)) + "</p></div>";
      if (t.id === "cond") h += '<p class="ipr-t62-dr">' + esc62(t62("avisoDR")) + "</p>";
      h += '<div class="ipr-t62-leg"><span class="ipr-t62-h">' + esc62(t62("legenda")) + "</span>" + t.leg.map(function (l) { return '<span class="lg"><i class="' + l[2] + '" style="--c:' + l[1] + '"></i>' + esc62(t62(l[0])) + "</span>"; }).join("") + "</div>";
      h += '<div class="ipr-t62-cs"><span class="ipr-t62-h">' + esc62(t62("camadas")) + "</span>" + t.c.map(function (id) { return linhaCamada(id, C); }).join("");
      function grupo(k, rot, ids) {
        var hh = ids.map(function (id) { return linhaCamada(id, C); }).join(""), n = (hh.match(/class="ipr-t62-l/g) || []).length; if (!n) return "";
        return '<details data-d62="' + k + '"' + (EST62.abertos[k] ? " open" : "") + '><summary>' + esc62(rot) + " <i>" + n + "</i></summary>" + hh + "</details>";
      }
      if (t.extra) h += grupo(t.id + ":mais", t62("maisCamadas"), t.extra);
      if (t.srup && SRUP_IDS.length) h += grupo("srup", t62("l_srup"), SRUP_IDS);
      h += "</div>";
      if (t.id === "cond") h += '<div class="ipr-t62-pdm"></div><p class="ipr-t62-lic">' + esc62(t62("licSrup")) + "</p>";
      if (fech) h += '<p class="ipr-t62-n">' + CAD + " " + esc62(t62("fechadas", { n: fech })) + "</p>";
      h += '<div class="ipr-t62-f"><span class="ipr-t62-h">' + esc62(t62("ferramentas")) + "</span>" + t.ferr.map(function (f) { return '<button type="button" data-f62="' + f + '">' + esc62(t62("f_" + f)) + "</button>"; }).join("") + "</div>";
      var pr = t.prod, prs = L62.pt["pr_" + pr] ? t62("pr_" + pr) : "";
      h += '<div class="ipr-t62-p"><span class="ipr-t62-h">' + esc62(t62("produto")) + '</span><button type="button" data-p62="' + pr + '"><b>' + esc62(t62("p_" + pr)) + "</b>" + (prs ? "<small>" + esc62(prs) + "</small>" : "") + "</button>";
      if (fech && pr !== "intel") h += '<button type="button" class="sec" data-p62="intel"><b>' + CAD + " " + esc62(t62("p_intel")) + "</b></button>";
      h += "</div></section>";
    }
    var todas = ler("ipr_t62_todas") === "1";
    h += '<button type="button" class="ipr-t62-todas" data-t62todas aria-expanded="' + todas + '" title="' + esc62(t62(todas ? "todasFechar" : "todasAbrir")) + '"><span>' + esc62(t62("todas")) + '</span><span class="car" aria-hidden="true"></span></button>';
    w.innerHTML = h;
    var arv = w.parentNode; if (arv) arv.classList.toggle("ipr-t62-rec", !todas);
    if (t && t.id === "cond") pintarPdm();
  }
  function temas62() {
    var arv = document.querySelector("#ipe .ipr-arv"); if (!arv || !viz()) return false;
    if (document.getElementById("ipr-t62")) return true;
    var w = document.createElement("div"); w.id = "ipr-t62"; arv.insertBefore(w, arv.firstChild);
    var tb = arv.querySelector(".ipr-temas-b"); if (tb) { tb.textContent = window.IPR_LINGUA === "pt" ? "Os meus" : "Mine"; tb.title = window.IPR_LINGUA === "pt" ? "Os meus temas e os temas IPR" : "My themes and the IPR themes"; }
    var ant = ler("ipr_t62_tema"); if (ant && temasLista().some(function (x) { return x.id === ant; })) EST62.tema = ant;
    pintar62();
    w.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-t62]"))) { var t = temasLista().filter(function (x) { return x.id === b.getAttribute("data-t62"); })[0]; if (t) { if (EST62.tema === t.id) sairTema62(); else aplicarTema62(t); } return; }
      if (e.target.closest("[data-t62sair]")) { sairTema62(); return; }
      if ((b = e.target.closest("[data-t62todas]"))) { gravar("ipr_t62_todas", ler("ipr_t62_todas") === "1" ? "0" : "1"); pintar62(); return; }
      if ((b = e.target.closest("[data-f62]"))) { ferramenta(b.getAttribute("data-f62")); return; }
      if ((b = e.target.closest("[data-p62]"))) { produto(b.getAttribute("data-p62")); return; }
    });
    w.addEventListener("toggle", function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute("data-d62")) EST62.abertos[d.getAttribute("data-d62")] = d.open ? 1 : 0; }, true);
    w.addEventListener("change", function (e) {
      var c = e.target.closest("[data-c62]"); if (!c) return; var R = viz(); if (!R) return;
      try { R.ligar(c.getAttribute("data-c62"), c.checked); } catch (x) {}
    });
    document.addEventListener("ipr:lingua", function () { pintar62(); var tb2 = arv.querySelector(".ipr-temas-b"); if (tb2) { tb2.textContent = window.IPR_LINGUA === "pt" ? "Os meus" : "Mine"; tb2.title = window.IPR_LINGUA === "pt" ? "Os meus temas e os temas IPR" : "My themes and the IPR themes"; } });
    var M = mapa(); if (M) M.on("moveend", function () { clearTimeout(pdmCentro.t); pdmCentro.t = setTimeout(pdmCentro, 700); });
    // com o tema aberto, as caixas acompanham o que se liga e desliga noutros sítios
    setInterval(function () { if (EST62.tema && !document.hidden) { var C = catIdx(); document.querySelectorAll("#ipr-t62 [data-c62]").forEach(function (c) { var on = false; try { on = viz().activas().indexOf(c.getAttribute("data-c62")) >= 0; } catch (x) {} if (c.checked !== on) c.checked = on; }); } }, 1500);
    return true;
  }
  window.__iprTemas = { aplicar: function (id) { var t = temasLista().filter(function (x) { return x.id === id; })[0]; if (t) aplicarTema62(t); return !!t; }, lista: function () { return temasLista().map(function (t) { return t.id; }); } };
  window.__iprTemas.defs = function () { return T62.concat([T62_ORG]); }; // arrumar.js: definições dos temas (troca de camadas em tempo de execução)

  // §63 Triagem de entrada (Nuno 26/10/2026). Só no Atlas: na primeira visita aparece um ecrã com quatro perguntas; depois
  // abre-se pelo botão «Por onde começar?» no topo. Cada pergunta lança um assistente curto que ensina enquanto faz: primeiro a
  // leitura gratuita (procurar o sítio, desenhar ou escolher o terreno, ver a ficha), depois o produto que corresponde, com o
  // preço quando existe, e por fim o tema certo do §62. Ao usar uma ferramenta o assistente encolhe para uma barra pequena em
  // baixo, para o mapa ficar livre; volta-se a ele pela barra. Fecha sempre (×, Esc, «Explorar sozinho»). A escolha e o passo
  // ficam em ipr_triagem_v1. Na primeira visita substitui os guias antigos (geral e encomenda), que continuam nas definições.
  var Q63 = [
    { id: "conhecer", prod: "leitura", pr: "pr_leitura", tema: "terreno" },
    { id: "planta", prod: "planta", pr: null, tema: "cond" },
    { id: "planear", prod: "base", pr: "pr_base", tema: "relevo" },
    { id: "prof", prod: "intel", pr: null, tema: "cond" }
  ];
  var TRI = { q: null, p: 0, min: false };
  var N63 = 5;
  function noAtlas() { return /\/atlas\/?$/.test(location.pathname) || /\/atlas\//.test(location.pathname); }
  function guardar63() { gravar("ipr_triagem_v1", JSON.stringify({ q: TRI.q, p: TRI.p, t: Date.now() })); }
  function pintar63() {
    var o = document.getElementById("ipr-tri"); if (!o) return;
    var h, q = Q63.filter(function (x) { return x.id === TRI.q; })[0];
    o.classList.toggle("min", !!(TRI.min && q));
    if (TRI.min && q) {
      h = '<div class="ipr-tri-bar"><span class="pp">' + esc62(t62("passo", { i: TRI.p + 1, n: N63 })) + "</span><b>" + esc62(passoTitulo(q, TRI.p)) + '</b><button type="button" data-a63="max">' + esc62(t62("continuar")) + '</button><button type="button" data-a63="fechar">' + esc62(t62("sairCurto")) + '</button></div>';
      o.innerHTML = h; return;
    }
    h = '<div class="ipr-tri-c" role="dialog" aria-modal="false" aria-labelledby="ipr-tri-t"><div class="ipr-tri-top">' + selLingua("ipr-lg-t") + '<button type="button" class="x" data-a63="fechar" aria-label="' + esc62(t62("fechar")) + '" title="' + esc62(t62("fechar")) + '">×</button></div>';
    if (!q) {
      h += '<h2 id="ipr-tri-t">' + esc62(t62("triTitulo")) + "</h2><p class=\"sub\">" + esc62(t62("triSub")) + '</p><div class="ipr-tri-q">' +
        Q63.map(function (x, i) { return '<button type="button" data-q63="' + x.id + '"><i>' + (i + 1) + "</i><b>" + esc62(t62("q_" + x.id)) + "</b><small>" + esc62(t62("qs_" + x.id)) + "</small></button>"; }).join("") +
        '</div><div class="ipr-tri-r"><p>' + esc62(t62("triRodape")) + '</p><button type="button" data-a63="fechar">' + esc62(t62("explorar")) + "</button></div>";
    } else {
      h += '<p class="ipr-tri-k">' + esc62(t62("q_" + q.id)) + " · " + esc62(t62("passo", { i: TRI.p + 1, n: N63 })) + '</p><ol class="ipr-tri-pp" aria-hidden="true">' + [0, 1, 2, 3, 4].map(function (i) { return '<li class="' + (i < TRI.p ? "f" : i === TRI.p ? "a" : "") + '"></li>'; }).join("") + "</ol>";
      h += '<h2 id="ipr-tri-t">' + esc62(passoTitulo(q, TRI.p)) + "</h2>" + passoCorpo(q, TRI.p);
      h += '<div class="ipr-tri-n"><button type="button" data-a63="voltar">' + esc62(t62("voltar")) + "</button>" +
        (TRI.p < N63 - 1 ? '<button type="button" class="pri" data-a63="seguinte">' + esc62(t62("seguinte")) + "</button>" : '<button type="button" class="pri" data-a63="fechar">' + esc62(t62("terminar")) + "</button>") +
        '</div><div class="ipr-tri-sai"><button type="button" class="ipr-tri-i" data-a63="inicio">' + esc62(t62("inicio")) + '</button><button type="button" class="ipr-tri-i" data-a63="fechar">' + esc62(t62("sair")) + "</button></div>";
    }
    o.innerHTML = h + "</div>";
    var f = o.querySelector("h2"); if (f) { f.setAttribute("tabindex", "-1"); try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function passoTitulo(q, p) { return [t62("s1t"), t62("s2t"), t62("s3t"), t62("s4t_" + q.id), t62("s5t")][p]; }
  function passoCorpo(q, p) {
    function bt(a, txt, pri) { return '<button type="button" class="' + (pri ? "pri" : "") + '" data-f63="' + a + '">' + esc62(txt) + "</button>"; }
    if (p === 0) return "<p>" + esc62(t62("s1h")) + '</p><div class="ipr-tri-a">' + bt("busca", t62("s1b"), 1) + "</div>";
    if (p === 1) return "<p>" + esc62(t62("s2h")) + '</p><div class="ipr-tri-m4">' + ["cadastro", "desenhar", "ficheiro", "artigo"].map(function (m, i) { return '<button type="button" class="' + (i ? "" : "pri") + '" data-f63="m:' + m + '"><b>' + esc62(t62("m_" + m)) + "</b><small>" + esc62(t62("mh_" + m)) + "</small></button>"; }).join("") + '</div><p class="ipr-tri-m" hidden></p>';
    if (p === 2) return "<p>" + esc62(t62("s3h")) + '</p><div class="ipr-tri-a">' + bt("ficha", t62("s3b"), 1) + '</div><p class="ipr-tri-m" hidden></p>';
    if (p === 3) {
      var pr = q.pr ? t62(q.pr) : t62("precoSob");
      return "<p>" + esc62(t62("s4h_" + q.id)) + '</p><p class="ipr-tri-pr"><span>' + esc62(t62("preco")) + "</span> " + esc62(pr) + '</p><div class="ipr-tri-a">' + bt("p:" + q.prod, t62("s4b_" + q.prod), 1) + "</div>";
    }
    var tm = T62.filter(function (x) { return x.id === q.tema; })[0];
    return "<p>" + esc62(t62("s5h")) + '</p><div class="ipr-tri-a">' + bt("t:" + q.tema, t62("s5b", { t: t62("t_" + tm.id) }), 1) + (q.id === "planear" ? bt("t:solo", t62("s5b", { t: t62("t_solo") })) + bt("t:campo", t62("s5b", { t: t62("t_campo") })) : "") + "</div>";
  }
  function abrir63(q) {
    var o = document.getElementById("ipr-tri");
    if (!o) { o = document.createElement("div"); o.id = "ipr-tri"; (document.getElementById("ipe") || document.body).appendChild(o); ligar63(o); }
    TRI.q = q || null; TRI.p = 0; TRI.min = false; o.hidden = false; document.documentElement.classList.add("ipr-tri-on"); pintar63();
  }
  function fechar63() {
    var o = document.getElementById("ipr-tri"); if (o) o.hidden = true; document.documentElement.classList.remove("ipr-tri-on");
    TRI.min = false; guardar63();
    try { abrirCamadas(); } catch (x) {}
    var b = document.getElementById("ipr-comecar"); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
  }
  // Enquanto o assistente está encolhido no passo da ficha, volta a abrir sozinho quando o terreno fica escolhido.
  function vigiarTerreno63() {
    var n = 0, t = setInterval(function () {
      n++; var r = document.querySelector("#ipe .ipe-res:not([hidden])");
      if (!TRI.min || TRI.p !== 2 || n > 400) { clearInterval(t); return; }
      if (r && r.offsetParent) { clearInterval(t); TRI.min = false; document.documentElement.classList.add("ipr-tri-on"); pintar63(); }
    }, 1500);
  }
  function minimizar63() { TRI.min = true; document.documentElement.classList.remove("ipr-tri-on"); pintar63(); }
  function ligar63(o) {
    o.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-q63]"))) { TRI.q = b.getAttribute("data-q63"); TRI.p = 0; guardar63(); pintar63(); return; }
      if ((b = e.target.closest("[data-a63]"))) {
        var a = b.getAttribute("data-a63");
        if (a === "fechar") return fechar63();
        if (a === "inicio") { TRI.q = null; TRI.p = 0; pintar63(); return; }
        if (a === "voltar") { if (TRI.p > 0) TRI.p--; else TRI.q = null; guardar63(); pintar63(); return; }
        if (a === "seguinte") { TRI.p = Math.min(N63 - 1, TRI.p + 1); guardar63(); pintar63(); return; }
        if (a === "max") { TRI.min = false; document.documentElement.classList.add("ipr-tri-on"); pintar63(); return; }
      }
      if ((b = e.target.closest("[data-f63]"))) {
        var f = b.getAttribute("data-f63");
        if (f === "ficha") {
          var r = document.querySelector("#ipe .ipe-res:not([hidden])");
          if (r && r.offsetParent) { minimizar63(); abrirSeparador("enc"); setTimeout(function () { try { r.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (x) {} }, 150); }
          else { var m = o.querySelector(".ipr-tri-m"); if (m) { m.hidden = false; m.textContent = t62("s3sem"); } }
          return;
        }
        if (f.indexOf("p:") === 0) { minimizar63(); produto(f.slice(2)); return; }
        if (f.indexOf("m:") === 0) {
          // as mesmas quatro formas do separador Processos › Base Cartográfica (botões .ipe-mb[data-metodo])
          var mt = f.slice(2); abrirSeparador("enc");
          setTimeout(function () {
            var mb = document.querySelector('#ipe .ipe-mb[data-metodo="' + mt + '"]');
            if (!mb) { var w = o.querySelector(".ipr-tri-m"); if (w) { w.hidden = false; w.textContent = t62("mfalta"); } return; }
            mb.click();
            if (mt === "cadastro" || mt === "desenhar") { fecharPainelMovel(); minimizar63(); }
            else { minimizar63(); try { mb.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (x) {} }
            TRI.p = 2; guardar63(); pintar63(); vigiarTerreno63();
          }, 200);
          return;
        }
        if (f.indexOf("t:") === 0) { window.__iprTemas.aplicar(f.slice(2)); abrirCamadas(); TRI.p = N63 - 1; fechar63(); return; }
        minimizar63(); ferramenta(f); if (TRI.p < 2) { TRI.p++; guardar63(); pintar63(); }
      }
    });
    o.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); fechar63(); } });
    document.addEventListener("ipr:lingua", pintar63);
  }
  function abrirCamadas() {
    // mostra o painel das camadas (no telemóvel está escondido atrás do botão «Camadas»)
    var arv = document.querySelector("#ipe .ipr-arv"); if (arv && arv.offsetParent) return;
    var b = document.getElementById("ipe-camadas"); if (b && b.offsetParent) { b.click(); return; }
    var l = document.querySelector('#ipe [data-tool="lado"]'); if (l) l.click();
  }
  function triagem63() {
    if (!noAtlas()) return true;
    var top = document.querySelector("#ipe .ipe-top .ipe-tr") || document.querySelector("#ipe .ipe-tr"); if (!top || !viz()) return false;
    if (!document.getElementById("ipr-comecar")) {
      var b = document.createElement("button"); b.type = "button"; b.id = "ipr-comecar"; b.className = "ipr-comecar";
      function rot() { b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.1 2-2.1 3.4M12 17.2v.1"/></svg><span class="l">' + esc62(t62("comecar")) + '</span><span class="c">' + esc62(t62("comecarCurto")) + "</span>"; b.title = t62("comecar"); b.setAttribute("aria-label", t62("comecar")); }
      rot(); document.addEventListener("ipr:lingua", rot);
      b.addEventListener("click", function () { var o = document.getElementById("ipr-tri"); if (o && !o.hidden && !TRI.min) { fechar63(); return; } abrir63(null); });
      var lg = document.createElement("span"); lg.id = "ipr-lg-topo"; lg.innerHTML = selLingua("ipr-lg-top");
      top.insertBefore(lg, top.firstChild); top.insertBefore(b, lg);
    }
    var visto = ler("ipr_triagem_v1");
    if (!visto) {
      gravar("ipe_tour_v1", "1"); gravar("ipe_tour_enc1", "1");
      document.documentElement.classList.add("ipr-sem-guia"); // o guia antigo já pode estar aberto: fica escondido nesta visita
      abrir63(null); guardar63();
    }
    return true;
  }
  (function () {
    if (document.getElementById("ipr-t62-css")) return;
    var st = document.createElement("style"); st.id = "ipr-t62-css";
    st.textContent =
      // línguas
      ".ipr-lg{display:inline-flex;border:1px solid var(--ln,#3a3f36);border-radius:999px;overflow:hidden;flex:0 0 auto}.ipr-lg button{font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.06em;padding:4px 8px;border:0;background:transparent;color:var(--mu,#9aa08f);cursor:pointer;min-width:32px}.ipr-lg button[aria-pressed=true]{background:var(--ac,#b5c46a);color:#141814}" +
      "#ipr-lg-topo{display:inline-flex;align-items:center;margin-right:6px}#ipr-lg-topo .ipr-lg button{padding:5px 8px}" +
      ".ipr-comecar{display:inline-flex;align-items:center;gap:6px;font:500 13px Inter,sans-serif;padding:6px 12px;margin-right:8px;border-radius:999px;border:1px solid var(--ac,#b5c46a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer;white-space:nowrap}.ipr-comecar:hover{background:var(--acs,rgba(181,196,106,.14))}.ipr-comecar .c{display:none}" +
      "@media (max-width:760px){.ipr-comecar{padding:5px 8px;margin-right:4px;font-size:12px}.ipr-comecar .l{display:none}.ipr-comecar .c{display:inline}#ipr-lg-topo{margin-right:4px}#ipr-lg-topo .ipr-lg button{padding:4px 5px;min-width:26px;font-size:10px}}" +
      "@media (max-width:420px){.ipr-comecar .c{display:none}}" +
      // temas
      "#ipr-t62{padding:8px 10px 4px;border-bottom:1px solid var(--ln,#2c312a);font:13px Inter,sans-serif;color:var(--tx,#e9eadf)}" +
      ".ipr-t62-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px}.ipr-t62-cab b{font:600 12px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f)}" +
      ".ipr-t62-sub{margin:0 0 8px;font-size:12px;line-height:1.45;color:var(--mu,#9aa08f)}" +
      ".ipr-t62-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ipr-t62-g button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;font:500 12.5px/1.25 Inter,sans-serif;padding:7px 8px 8px;hyphens:auto;overflow-wrap:break-word;border-radius:9px;border:1px solid var(--ln,#2c312a);background:var(--p2,#1d221c);color:var(--tx,#e9eadf);cursor:pointer;min-height:44px}" +
      ".ipr-t62-g button .tp{display:flex;align-items:center;justify-content:space-between;width:100%}.ipr-t62-g button svg{flex:0 0 auto;color:var(--ac,#b5c46a)}.ipr-t62-g button i{font:600 10px 'IBM Plex Mono',monospace;font-style:normal;color:var(--mu,#9aa08f)}.ipr-t62-g button span.n{max-width:100%}.ipr-t62-g button[aria-pressed=true]{border-color:var(--ac,#b5c46a);background:var(--acs,rgba(181,196,106,.14))}.ipr-t62-g button:hover{border-color:var(--ln2,#4a5045)}" +
      ".ipr-t62-g.cmp{display:flex;flex-wrap:wrap;gap:4px}.ipr-t62-g.cmp button{flex-direction:row;align-items:center;min-height:30px;padding:4px 8px;border-radius:999px;font-size:11.5px;gap:5px}.ipr-t62-g.cmp button .tp{width:auto}.ipr-t62-g.cmp button i{display:none}.ipr-t62-g.cmp button svg{width:13px;height:13px}" +
      ".ipr-t62-c{margin:8px 0 2px;padding:10px;border:1px solid var(--ac,#b5c46a);border-radius:10px;background:var(--p1,#141814);display:flex;flex-direction:column;gap:9px}" +
      ".ipr-t62-ct{display:flex;align-items:center;gap:8px}.ipr-t62-ct b{font:600 14px Inter,sans-serif}.ipr-t62-3d{font:600 10px 'IBM Plex Mono',monospace;padding:1px 6px;border-radius:5px;border:1px solid var(--ac,#b5c46a);color:var(--ac,#b5c46a)}.ipr-t62-x{margin-left:auto;font:500 11.5px Inter,sans-serif;border:0;background:transparent;color:var(--mu,#9aa08f);cursor:pointer;text-decoration:underline;padding:4px}" +
      ".ipr-t62-h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f);margin:0 0 4px}.ipr-t62-h2{margin-top:8px}" +
      ".ipr-t62-ver p{margin:0;font-size:12.5px;line-height:1.5}.ipr-t62-dr{margin:0;padding:7px 9px;border-left:3px solid var(--ac2,#c9d36a);background:var(--p2,#1d221c);font-size:12px;line-height:1.45}" +
      ".ipr-t62-leg{display:flex;flex-wrap:wrap;gap:4px 10px}.ipr-t62-leg .ipr-t62-h{flex-basis:100%}.ipr-t62-leg .lg{display:inline-flex;align-items:center;gap:5px;font-size:11.5px}.ipr-t62-leg i{display:inline-block;width:14px;height:10px;border-radius:2px;background:var(--c);opacity:.85}.ipr-t62-leg i.linha{height:3px;border-radius:2px;opacity:1}.ipr-t62-leg i.ponto{width:9px;height:9px;border-radius:50%}" +
      ".ipr-t62-cs{display:flex;flex-direction:column;gap:1px}.ipr-t62-l{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;padding:3px 0}.ipr-t62-l label{display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0}.ipr-t62-l label span,.ipr-t62-l>span:not(.cad){min-width:0}" +
      ".ipr-t62-l em{font:500 10.5px Inter,sans-serif;font-style:normal;color:var(--mu,#9aa08f);white-space:nowrap}.ipr-t62-l.tranc{color:var(--mu,#9aa08f)}.ipr-t62-l.tranc em{color:var(--ac,#b5c46a)}.ipr-t62-l.tranc .cad{display:inline-flex;margin-right:-2px}.ipr-t62-l.tranc{justify-content:flex-start}.ipr-t62-l.tranc em{margin-left:auto}.ipr-t62-l.srv{color:var(--mu2,#7b8072)}" +
      ".ipr-t62-cs details{margin-top:6px;border-top:1px solid var(--ln,#2c312a);padding-top:4px}.ipr-t62-cs summary{cursor:pointer;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f);padding:4px 0;list-style-position:inside}.ipr-t62-cs summary i{font-style:normal;font-family:'IBM Plex Mono',monospace;color:var(--ac,#b5c46a);margin-left:4px}" +
      ".ipr-t62-pdm p{margin:0}.ipr-t62-n{margin:0;font-size:11.5px;line-height:1.45;color:var(--mu,#9aa08f)}.ipr-t62-n svg{vertical-align:-2px}.ipr-t62-lic{margin:0;font-size:10.5px;line-height:1.4;color:var(--mu2,#7b8072)}" +
      ".ipr-t62-f{display:flex;flex-wrap:wrap;gap:5px}.ipr-t62-f .ipr-t62-h{flex-basis:100%}.ipr-t62-f button{font:500 12px Inter,sans-serif;padding:6px 9px;border-radius:999px;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer;min-height:32px}.ipr-t62-f button:hover{border-color:var(--ac,#b5c46a)}" +
      ".ipr-t62-p{display:flex;flex-direction:column;gap:6px}.ipr-t62-p button{display:flex;align-items:baseline;justify-content:space-between;gap:8px;text-align:left;padding:9px 11px;border-radius:9px;border:1px solid var(--ac,#b5c46a);background:var(--ac,#b5c46a);color:#141814;cursor:pointer;font:13px Inter,sans-serif}.ipr-t62-p button b{font-weight:600}.ipr-t62-p button small{font-size:11.5px;opacity:.8}.ipr-t62-p button.sec{background:transparent;color:var(--tx,#e9eadf)}.ipr-t62-p button.sec svg{vertical-align:-2px}" +
      ".ipr-t62-todas{display:flex;align-items:center;justify-content:space-between;width:100%;margin:8px 0 2px;padding:8px 2px;border:0;border-top:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);font:600 12px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}.ipr-t62-todas .car{width:8px;height:8px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);margin:0 6px 4px 0;transition:transform .15s}.ipr-t62-todas[aria-expanded=true] .car{transform:rotate(-135deg);margin-bottom:-2px}" +
      ".ipr-arv.ipr-t62-rec>*:not(#ipr-t62):not(.ipr-arv-cab){display:none!important}" +
      "#ipr-av62{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:100003;max-width:min(440px,calc(100vw - 32px));padding:10px 14px;border-radius:10px;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ac,#b5c46a);font:13px/1.45 Inter,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s}#ipr-av62.on{opacity:1}" +
      // triagem
      "#ipr-tri{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,10,.55);font:14px Inter,sans-serif;color:var(--tx,#e9eadf)}#ipr-tri[hidden]{display:none}" +
      "#ipr-tri .ipr-tri-c{position:relative;width:min(640px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:var(--p1,#141814);border:1px solid var(--ln,#2c312a);border-radius:16px;padding:20px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.4)}" +
      "#ipr-tri .ipr-tri-top{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:-6px -8px 4px 0}#ipr-tri .ipr-tri-top .ipr-lg button{padding:5px 10px}" +
      "#ipr-tri .x{width:36px;height:36px;border-radius:50%;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);font-size:20px;line-height:1;cursor:pointer;flex:0 0 auto}" +
      "#ipr-tri h2{font:600 22px/1.25 Inter,sans-serif;margin:0 0 6px;outline:none}#ipr-tri .sub{margin:0 0 16px;color:var(--mu,#9aa08f);line-height:1.5}" +
      "#ipr-tri .ipr-tri-q{display:grid;grid-template-columns:1fr 1fr;gap:10px}#ipr-tri .ipr-tri-q button{display:flex;flex-direction:column;align-items:flex-start;gap:5px;text-align:left;padding:16px;border-radius:12px;border:1px solid var(--ln,#2c312a);background:var(--p2,#1d221c);color:var(--tx,#e9eadf);cursor:pointer;min-height:112px}" +
      "#ipr-tri .ipr-tri-q button:hover,#ipr-tri .ipr-tri-q button:focus-visible{border-color:var(--ac,#b5c46a)}#ipr-tri .ipr-tri-q i{font:600 11px 'IBM Plex Mono',monospace;font-style:normal;color:var(--ac,#b5c46a)}#ipr-tri .ipr-tri-q b{font:600 16px/1.3 Inter,sans-serif}#ipr-tri .ipr-tri-q small{font-size:12.5px;line-height:1.45;color:var(--mu,#9aa08f)}" +
      "#ipr-tri .ipr-tri-r{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}#ipr-tri .ipr-tri-r p{margin:0;font-size:12px;color:var(--mu,#9aa08f)}" +
      "#ipr-tri .ipr-tri-m4{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}#ipr-tri .ipr-tri-m4 button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;padding:10px 12px;border-radius:10px;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer;min-height:56px}#ipr-tri .ipr-tri-m4 button.pri{border-color:var(--ac,#9fb06a)}#ipr-tri .ipr-tri-m4 small{opacity:.75;font-size:12px;line-height:1.35}@media (max-width:520px){#ipr-tri .ipr-tri-m4{grid-template-columns:1fr}}" + "#ipr-tri button{font-family:Inter,sans-serif}#ipr-tri .ipr-tri-r button,#ipr-tri .ipr-tri-n button,#ipr-tri .ipr-tri-a button{font-size:13.5px;font-weight:500;padding:9px 14px;border-radius:9px;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer;min-height:40px}" +
      "#ipr-tri button.pri{background:var(--ac,#b5c46a);border-color:var(--ac,#b5c46a);color:#141814;font-weight:600}" +
      "#ipr-tri .ipr-tri-k{margin:0 0 8px;font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.04em;color:var(--mu,#9aa08f);text-transform:uppercase}" +
      "#ipr-tri .ipr-tri-pp{display:flex;gap:4px;list-style:none;padding:0;margin:0 0 14px}#ipr-tri .ipr-tri-pp li{flex:1;height:3px;border-radius:2px;background:var(--ln,#2c312a)}#ipr-tri .ipr-tri-pp li.f{background:var(--ac2,#8f9a55)}#ipr-tri .ipr-tri-pp li.a{background:var(--ac,#b5c46a)}" +
      "#ipr-tri .ipr-tri-c>p{line-height:1.55;margin:0 0 12px}#ipr-tri .ipr-tri-a{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px}#ipr-tri .ipr-tri-m{margin:0 0 12px;color:var(--ac2,#c9d36a);font-size:13px}" +
      "#ipr-tri .ipr-tri-pr{display:flex;gap:8px;align-items:baseline;margin:0 0 10px!important}#ipr-tri .ipr-tri-pr span{font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f)}" +
      "#ipr-tri .ipr-tri-n{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--ln,#2c312a);padding-top:12px}#ipr-tri .ipr-tri-i{display:block;margin:10px auto 0;border:0;background:transparent;color:var(--mu,#9aa08f);text-decoration:underline;font-size:12.5px;cursor:pointer;padding:6px}" +
      // barra pequena (assistente encolhido)
      "#ipr-tri.min{inset:auto 0 0 0;background:transparent;padding:0 12px calc(12px + env(safe-area-inset-bottom));pointer-events:none;align-items:flex-end}" +
      "#ipr-tri .ipr-tri-bar{pointer-events:auto;display:flex;align-items:center;gap:10px;width:min(560px,100%);margin:0 auto;padding:8px 8px 8px 14px;border-radius:12px;background:var(--p1,#141814);border:1px solid var(--ac,#b5c46a);box-shadow:0 8px 30px rgba(0,0,0,.35)}" +
      "#ipr-tri .ipr-tri-bar .pp{font:600 10.5px 'IBM Plex Mono',monospace;color:var(--mu,#9aa08f);white-space:nowrap}#ipr-tri .ipr-tri-bar b{flex:1;min-width:0;font:600 13px Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#ipr-tri .ipr-tri-bar button[data-a63=max]{font:600 13px Inter,sans-serif;padding:8px 12px;border-radius:8px;border:0;background:var(--ac,#b5c46a);color:#141814;cursor:pointer;white-space:nowrap}#ipr-tri .ipr-tri-bar .x{width:32px;height:32px;font-size:18px}" +
      "html.ipr-tri-on .ipe-tour,html.ipr-sem-guia .ipe-tour{display:none!important}" +
      "@media (max-width:600px){#ipr-tri{padding:0;align-items:flex-end}#ipr-tri .ipr-tri-c{width:100%;max-height:92dvh;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom))}#ipr-tri .ipr-tri-q{grid-template-columns:1fr;gap:8px}#ipr-tri .ipr-tri-q button{min-height:0;padding:12px 14px}#ipr-tri h2{font-size:19px}#ipr-tri .ipr-tri-r{flex-direction:column;align-items:stretch}#ipr-tri .ipr-tri-r button{width:100%}#ipr-tri.min{padding:0 8px calc(8px + env(safe-area-inset-bottom))}#ipr-tri .ipr-tri-bar .pp{display:none}}";
    (document.head || document.documentElement).appendChild(st);
  })();


  // §65 Ecrãs grandes, controlos do mapa junto à barra das ferramentas, temas que não desaparecem, «Os meus locais» uma vez
  // (Nuno, 26/10/2026, 18h32, com fotografias num monitor AOC grande: barras muito pequenas, rosa dos ventos e localizador
  // desaparecidos, «Os meus locais» em duplicado, temas em falta, espaço livre desequilibrado à direita).
  function grande65() {
    if (!document.getElementById("ipr-65-css")) {
      var st = document.createElement("style"); st.id = "ipr-65-css";
      function nivel(f, w) {
        var z = String(f);
        return "@media (min-width:" + w + "px) and (pointer:fine){" +
          ".ipe{--wl:" + Math.round(268 * f) + "px!important;--wr:" + Math.round(330 * f) + "px!important;grid-template-rows:calc(" + Math.round(48 * f) + "px + env(safe-area-inset-top)) minmax(0,1fr) " + Math.round(28 * f) + "px!important}" +
          "#ipe-esq>*,#ipe-dir>*,#ipe>.ipe-top>*,#ipe-st>*,#ipe .ipe-tools,#ipe .maplibregl-ctrl-top-left.ipr-nav:not(.ipe-tools *),#ipr-tri{zoom:" + z + "}}";
      }
      st.textContent = nivel(1.2, 1900) + nivel(1.4, 2400) + nivel(1.75, 3200) +
        "#ipe .ipr-tri-sai{display:flex;gap:14px;flex-wrap:wrap}#ipe .ipr-lu-cam>.ipr-gt{display:none!important}#ipe .ipr-lu-cam>.ipe-sbc{display:block!important;padding-left:0}" +
        "";
      document.head.appendChild(st);
    }
    return true;
  }
  // Rosa dos ventos, aproximar, afastar e localizar passam para dentro da barra das ferramentas (à direita do mapa), no
  // computador. O contentor do MapLibre muda de sítio inteiro, por isso os botões continuam a funcionar; no telemóvel volta
  // ao canto do mapa. Nuno, 18h46: «a rosa apareceu, mas depois [...] desapareceu»: deixa de depender de posições calculadas.
  function nav65() {
    var nav = document.querySelector("#ipe .maplibregl-ctrl-top-left.ipr-nav"), tools = document.querySelector("#ipe .ipe-tools");
    if (!nav || !tools) return false;
    var casa = nav.parentNode;
    if (!document.getElementById("ipr-65n-css")) { var st = document.createElement("style"); st.id = "ipr-65n-css";
      st.textContent = "#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl-group{background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0!important}#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl-group button{background:transparent!important;border:0!important;color:inherit}#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl-group button+button{border-top:0!important}#ipe .ipe-tools>.ipr-nav{border-top:1px solid var(--railb,rgba(255,255,255,.14));padding-top:6px!important}#ipe .ipe-tools>.ipr-nav>button:not(.ipe-rosa),#ipe .ipe-tools>.ipr-nav>.maplibregl-ctrl:not(.maplibregl-ctrl-group) button{width:30px!important;height:30px!important;background:transparent!important;border:0!important;box-shadow:none!important}" + "#ipe .ipe-tools>.ipr-nav{position:static!important;inset:auto!important;transform:none!important;display:flex!important;flex-direction:column;align-items:center;gap:6px;margin:8px 0 2px;padding:0;pointer-events:auto;float:none}#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl{margin:0!important;float:none}#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl-group button{width:30px!important;height:28px!important}#ipe .ipe-tools>.ipr-nav .maplibregl-ctrl-group button .maplibregl-ctrl-icon{transform:scale(.85)}#ipe .ipe-tools>.ipr-nav .ipe-rosa,#ipe .ipe-tools>.ipr-nav .ipe-rosa svg{width:28px!important;height:28px!important}#ipe .ipe-tools>.ipr-nav svg{max-width:28px;max-height:28px}";
      document.head.appendChild(st); }
    function pos() {
      var n = document.querySelector("#ipe .maplibregl-ctrl-top-left.ipr-nav") || nav;
      if (window.innerWidth > 900 && !pequeno70()) { if (n.parentNode !== tools) tools.appendChild(n); }
      else if (casa && n.parentNode !== casa) casa.appendChild(n);
    }
    pos(); window.addEventListener("resize", function () { clearTimeout(nav65.t); nav65.t = setTimeout(pos, 150); });
    setInterval(function () { if (!document.hidden) pos(); }, 2000);
    return true;
  }
  // Os temas voltam quando o app.js redesenha a árvore das camadas (acontece depois de entrar, quando chegam as camadas da
  // organização); o grupo que leva o nome «Os meus locais» mas contém as camadas perde esse título.
  function guarda65() {
    var cam = document.getElementById("ipe-cam"); if (!cam) return false;
    var n = 0;
    function rever() {
      if (!document.getElementById("ipr-t62") && cam.querySelector(".ipr-arv") && n < 20) { n++; try { temas62(); } catch (e) {} }
      [].forEach.call(document.querySelectorAll("#ipe .ipr-g"), function (g) {
        var gn = g.querySelector(":scope>.ipr-gt .ipr-gn"); if (!gn) return;
        var leva = !!g.querySelector('.ipr-arv-l, input[placeholder*="iltrar"], input[placeholder*="ilter"]');
        g.classList.toggle("ipr-lu-cam", /^os meus locais/i.test(gn.textContent.trim()) && leva);
      });
    }
    rever(); new MutationObserver(function () { clearTimeout(guarda65.t); guarda65.t = setTimeout(rever, 200); }).observe(cam, { childList: true, subtree: true });
    return true;
  }

  // Botão «Actualizar» ao lado do botão App (Nuno, 26/10/2026, 18h45: «a app não tem um botão de refresh»). Na app instalada
  // não há barra do navegador; o botão recarrega o Atlas sem perder o sítio (o endereço leva o #).
  function refresh65() {
    var tm = document.getElementById("ipe-tema"); if (!tm || !tm.parentNode) return false;
    if (document.getElementById("ipr-ref")) return true;
    var b = document.createElement("button"); b.type = "button"; b.id = "ipr-ref"; b.className = tm.className;
    var pt = (window.IPR_LINGUA || "pt") === "pt";
    b.title = pt ? "Actualizar o Atlas" : "Reload the Atlas"; b.setAttribute("aria-label", b.title);
    b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
    var ap = document.getElementById("ipr-app-b"); tm.parentNode.insertBefore(b, ap && ap.parentNode === tm.parentNode ? ap.nextSibling : tm.nextSibling);
    b.addEventListener("click", function () {
      b.disabled = true; b.style.opacity = ".5";
      try { var u = new URL(location.href); u.searchParams.set("r", String(Date.now()).slice(-6)); location.replace(u.toString()); } catch (e) { location.reload(); }
    });
    document.addEventListener("ipr:lingua", function () { var p2 = (window.IPR_LINGUA || "pt") === "pt"; b.title = p2 ? "Actualizar o Atlas" : "Reload the Atlas"; b.setAttribute("aria-label", b.title); });
    return true;
  }

  // §66 Barra da esquerda arrumada (Nuno, 26/10/2026, 18h52: «está desordenado e pouco intuitivo [...] repetição e uma grande
  // misturada»). Ordem fixa: Pesquisa · Os meus locais (um só, com Ponto, Linha e Área) · Temas (encolhe-se) · Camadas
  // (filtro, Cronologia, Desligar e os testes numa só faixa; a seguir os grupos). Sai o botão «Os meus» dos temas antigos,
  // que repetia os temas de cima.
  function esquerda66() {
    var cam = document.getElementById("ipe-cam"), arv = cam && cam.querySelector(".ipr-arv"); if (!arv) return false;
    if (!document.getElementById("ipr-66-css")) {
      var st = document.createElement("style"); st.id = "ipr-66-css";
      st.textContent = "#ipe .ipr-proj-fora,#ipe .ipr-g.ipc-loc:not(.ipr-66-loc){display:none!important}" +
        "#ipe .ipr-arv-cab .ipr-temas-b:not(.ipr-crono-b){display:none!important}" +
        "#ipe .ipr-arv-cab{display:flex!important;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px 4px}" +
        "#ipe .ipr-arv-cab .ipr-busca{order:-1;flex:1 1 100%!important;width:100%!important;min-width:0;height:32px;display:block!important}" +
        "#ipe .ipr-arv-cab>button{flex:0 0 auto}#ipe .ipr-testes{display:flex;gap:6px;padding:0 10px 8px;flex-wrap:wrap}" +
        "#ipe .ipr-testes button{font-size:12px!important;padding:4px 8px!important;min-height:28px!important;opacity:.85}" +
        "#ipe #ipe-tabs{flex-wrap:wrap!important;overflow:visible!important;height:auto!important;row-gap:2px}#ipe #ipe-tabs .ipe-tab{flex:1 1 auto!important;min-width:0!important;white-space:nowrap}" + "#ipr-t62 .ipr-t62-cab{cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none}" +
        "#ipr-t62 .ipr-t62-cab::after{content:'';width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-right:6px;opacity:.7;transition:transform .15s}" +
        "#ipr-t62.ipr-66-fech .ipr-t62-cab::after{transform:rotate(-45deg)}" +
        "#ipr-t62.ipr-66-fech .ipr-t62-sub,#ipr-t62.ipr-66-fech .ipr-t62-g,#ipr-t62.ipr-66-fech .ipr-t62-c{display:none!important}" +
        "#ipe .ipr-66-loc{margin-bottom:6px}";
      document.head.appendChild(st);
    }
    var t = document.getElementById("ipr-t62");
    if (t && !t.__66) {
      t.__66 = 1; if (ler("ipr_t66_temas") === "0") t.classList.add("ipr-66-fech");
      t.addEventListener("click", function (e) { if (e.target.closest(".ipr-t62-cab")) { var f = t.classList.toggle("ipr-66-fech"); gravar("ipr_t66_temas", f ? "0" : "1"); } });
    }
    // «Os meus locais»: o grupo que tem o botão Ponto vai para o topo das camadas; os outros com o mesmo nome escondem-se
    var bts = [].slice.call(document.querySelectorAll("#ipe-esq button")).filter(function (b) { return /^(Ponto|Point)$/.test((b.textContent || "").trim()); });
    var g = bts.length ? (bts[0].closest(".ipr-g") || bts[0].closest("section")) : null;
    if (g && g !== arv && arv.contains(g)) {
      g.classList.add("ipr-66-loc"); g.classList.remove("ipr-proj-fora"); // 27/10: marcado antes de ter os botões, voltava a ficar escondido
      if (arv.firstElementChild !== g) arv.insertBefore(g, arv.firstChild);
    }
    var vistos66 = 0;
    if (g) [].forEach.call(g.querySelectorAll("*"), function (el) {
      // 27/10: a linha do título do próprio grupo (.ipr-gc com o botão que fecha e abre) não se esconde
      if (el.classList.contains("ipr-gn") || el.closest(".ipr-gt") || el.closest(".ipe-sbh") || el.closest(".ipr-gc") || el.querySelector(".ipr-gt") || el.children.length > 2) return;
      if (!vistos66++ && !g.querySelector(".ipr-gt .ipr-gn, .ipe-sbh")) return;
      var tx = (el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.nodeValue : el.textContent || "").trim();
      if (/^(Os meus locais|My places)$/i.test(tx)) { var row = el.parentElement && el.parentElement !== g && el.parentElement.querySelector("svg") ? el.parentElement : el; row.style.display = "none"; }
    });
    [].forEach.call(document.querySelectorAll("#ipe-esq .ipr-gn"), function (n) {
      var gg = n.closest(".ipr-g"); if (!gg || gg === g || (g && (g.contains(gg) || gg.contains(g)))) return;
      if (/^os meus locais/i.test(n.textContent.trim())) gg.classList.add("ipr-proj-fora");
    });
    if (!esquerda66.obs) { esquerda66.obs = 1; new MutationObserver(function () { clearTimeout(esquerda66.t); esquerda66.t = setTimeout(esquerda66, 250); }).observe(cam, { childList: true, subtree: true }); }
    return true;
  }

  // Zoom geral do Atlas no topo, ao lado de PT/EN (Nuno, 26/10/2026, 19h00: «um zoom a todo o ecrã [...] para que os
  // desenhadores possam adaptar isto aos seus diferentes monitores»). «Auto» segue o tamanho do ecrã (§65); − e + fixam um
  // valor guardado neste navegador. O mapa não é ampliado (só as barras, painéis e textos), para não deformar o desenho.
  var Z67 = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.65, 1.8, 2]; // §73: desce até 60 % (Nuno, 27/10, iPad)
  function zoomAplicar67(v) {
    var st = document.getElementById("ipr-67-z"); if (!st) { st = document.createElement("style"); st.id = "ipr-67-z"; document.head.appendChild(st); }
    if (!v) { st.textContent = ""; return; }
    st.textContent = ".ipe{--wl:" + Math.round(268 * v) + "px!important;--wr:" + Math.round(330 * v) + "px!important;grid-template-rows:calc(" + Math.round(48 * v) + "px + env(safe-area-inset-top)) minmax(0,1fr) " + Math.round(28 * v) + "px!important}" +
      "#ipe-esq>*,#ipe-dir>*,#ipe>.ipe-top>*,#ipe-st>*,#ipe .ipe-tools,#ipe .maplibregl-ctrl-top-left.ipr-nav:not(.ipe-tools *),#ipr-tri{zoom:" + v + "!important}";
  }
  function zoom67() {
    var lg = document.getElementById("ipr-lg-topo"); if (!lg || !lg.parentNode) return false;
    if (document.getElementById("ipr-z67")) return true;
    if (!document.getElementById("ipr-67-css")) { var c = document.createElement("style"); c.id = "ipr-67-css";
      c.textContent = "#ipr-z67{display:inline-flex;align-items:center;border:1px solid var(--ln,#3a3f36);border-radius:999px;overflow:hidden;margin:0 6px;height:26px}#ipr-z67 button{border:0;background:transparent;color:inherit;font:600 12px Inter,sans-serif;padding:0 8px;height:26px;cursor:pointer;min-width:26px}#ipr-z67 button:hover{background:rgba(255,255,255,.08)}#ipr-z67 .v{min-width:44px;opacity:.85;font-weight:500}@media (max-width:900px){#ipr-z67{display:none}}";
      document.head.appendChild(c); }
    var w = document.createElement("span"); w.id = "ipr-z67";
    function val() { var x = parseFloat(ler("ipr_zoom67") || ""); return Z67.indexOf(x) >= 0 ? x : 0; }
    function pinta() { var v = val(), pt = (window.IPR_LINGUA || "pt") === "pt";
      w.innerHTML = '<button type="button" data-z="-" title="' + (pt ? "Reduzir a interface" : "Make the interface smaller") + '">−</button><button type="button" class="v" data-z="0" title="' + (pt ? "Tamanho automático (conforme o ecrã)" : "Automatic size (by screen)") + '">' + (v ? Math.round(v * 100) + "%" : "Auto") + '</button><button type="button" data-z="+" title="' + (pt ? "Aumentar a interface" : "Make the interface larger") + '">+</button>';
    }
    function auto() { var W = window.innerWidth; return W >= 3200 ? 1.75 : W >= 2400 ? 1.4 : W >= 1900 ? 1.2 : 1; }
    w.addEventListener("click", function (e) {
      var b = e.target.closest("[data-z]"); if (!b) return; var k = b.getAttribute("data-z"), v = val() || auto(), i;
      if (k === "0") { gravar("ipr_zoom67", ""); zoomAplicar67(0); }
      else { i = Z67.indexOf(v); if (i < 0) { i = 0; while (i < Z67.length - 1 && Z67[i] < v) i++; } i = Math.max(0, Math.min(Z67.length - 1, i + (k === "+" ? 1 : -1))); gravar("ipr_zoom67", String(Z67[i])); zoomAplicar67(Z67[i]); }
      pinta(); setTimeout(function () { try { var M = mapa(); if (M) M.resize(); } catch (x) {} window.dispatchEvent(new Event("resize")); }, 60);
    });
    document.addEventListener("ipr:lingua", pinta);
    pinta(); lg.parentNode.insertBefore(w, lg); zoomAplicar67(val());
    return true;
  }
  // §68 Perfis municipais (Município de Almodôvar, Nuno 26/10/2026; módulo m90377 do Núcleo). Quem entra por um código do
  // Município traz um perfil (Presidência, Protecção Civil / GTF, Urbanismo, Ambiente e clima, Obras, Junta de Freguesia),
  // posto pelo site em window.IPR_PERFIL_ORG (e em window.IPR_PERFIL.municipal, sem mexer no resto do IPR_PERFIL do m90208).
  // Na primeira abertura do Atlas em cada sessão (e se o endereço não pede outro sítio: ?mapa=, ?org_camada=, ?ll=), abre o
  // tema do perfil (§62), liga as camadas do perfil e centra no concelho ou na freguesia (limite CAOP quando o site o tem, senão
  // um centro aproximado). Na primeira vez neste navegador mostra boas-vindas próprias, em português e inglês, que substituem a
  // triagem do §63; voltam pelo botão com o nome da entidade no topo. Sem perfil municipal, nada disto corre.
  var L68 = {
    pt: {
      ola: "Bem-vindo ao IPR Atlas, {e}", sub: "Oferta do IPR – Instituto de Planeamento Regenerativo e da Terracrua Design ao Município de Almodôvar.",
      perfil: "Perfil", tema: "Tema aberto", ligadas: "Camadas ligadas", ferr: "Ferramentas úteis", pastas: "Pastas de trabalho",
      pastasT: "No separador Organização: Comum (todo o concelho), a pasta da sua entidade e as que lhe forem partilhadas.",
      verConcelho: "Ver o concelho", verFreguesia: "Ver a freguesia", abrirOrg: "Abrir as pastas", comecar: "Começar", rever: "Boas-vindas",
      aprox: "Centro aproximado: o limite oficial (CAOP 2025) entra quando a equipa o carregar.",
      base: "Base Cartográfica oferecida: {n} por pedir, até {ha} ha.", baseJ: "Desenhe o terreno dentro da freguesia e peça-a em Encomendar. O que passar da oferta é pago.",
      baseC: "Peça-as em Encomendar. O que passar da oferta é pago.", baseFim: "A Base Cartográfica oferecida já foi pedida. Outras Bases são pagas.", pedirBase: "Pedir a Base",
      p_pres: "Síntese do concelho: limites das freguesias, perigosidade de incêndio, ordenamento do PDM e ocupação do solo, para ver o território inteiro de uma vez.",
      p_pc: "Fogo: perigosidade estrutural, áreas ardidas, rede primária de faixas de gestão de combustível, zonas de intervenção florestal, pontos de água DFCI e caminhos. Use a vista 3D para o relevo e o QField para as notas de campo.",
      p_urb: "Condicionantes: qualificação do solo do PDM, REN, RAN, domínio público hídrico, servidões oficiais (SRUP) e cadastro. A Planta de Localização faz-se a partir de um terreno guardado num projecto.",
      p_amb: "Ecologia, água e seca, solo e vegetação: habitats, Rede Natura 2000, áreas protegidas, densidade de copa, árvores isoladas e sebes, ocupação e carta de solos, linhas de água. Serve de base ao Plano Municipal de Acção Climática.",
      p_obras: "Caminhos, linhas de água e relevo, com ortofotos de vários anos (Imagens antigas) e notas no mapa para registar o que se vê no terreno.",
      p_junta: "Conhecer o terreno da freguesia: caminhos, pontos de água, nascentes e poços, cadastro e linhas de água. Marque notas no mapa e leve o trabalho para o QField."
    },
    en: {
      ola: "Welcome to the IPR Atlas, {e}", sub: "Offered by IPR – Instituto de Planeamento Regenerativo and Terracrua Design to the Municipality of Almodôvar.",
      perfil: "Profile", tema: "Theme opened", ligadas: "Layers turned on", ferr: "Useful tools", pastas: "Working folders",
      pastasT: "In the Organisation tab: Common (the whole municipality), your own body's folder and any shared with you.",
      verConcelho: "Show the municipality", verFreguesia: "Show the parish", abrirOrg: "Open the folders", comecar: "Start", rever: "Welcome",
      aprox: "Approximate centre: the official boundary (CAOP 2025) appears once the team uploads it.",
      base: "Base Map offered: {n} left to order, up to {ha} ha.", baseJ: "Draw the plot inside the parish and order it under Order. Anything beyond the offer is paid.",
      baseC: "Order them under Order. Anything beyond the offer is paid.", baseFim: "The Base Map offered has already been ordered. Further Base Maps are paid.", pedirBase: "Order the Base Map",
      p_pres: "Overview of the municipality: parish boundaries, wildfire hazard, municipal plan (PDM) zoning and land cover, to see the whole territory at once.",
      p_pc: "Fire: structural hazard, burnt areas, the primary fuel-break network, forest intervention zones, DFCI water points and tracks. Use the 3D view for terrain and QField for field notes.",
      p_urb: "Constraints: PDM land classification, REN, RAN, public water domain, official easements (SRUP) and land registry. The Location Plan is made from a plot saved in a project.",
      p_amb: "Ecology, water and drought, soil and vegetation: habitats, Natura 2000, protected areas, canopy density, isolated trees and hedgerows, land cover, soil map and watercourses. A base for the Municipal Climate Action Plan.",
      p_obras: "Tracks, watercourses and terrain, with orthophotos from several years (Older imagery) and notes on the map to record what you see on site.",
      p_junta: "Get to know the parish: tracks, water points, springs and wells, land registry and watercourses. Drop notes on the map and take the work into QField."
    }
  };
  function t68(k, v) {
    var l = window.IPR_LINGUA, s = (L68[l] && L68[l][k] != null) ? L68[l][k] : (L68.pt[k] != null ? L68.pt[k] : k);
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function perfil68() { var p = window.IPR_PERFIL_ORG || (window.IPR_PERFIL && window.IPR_PERFIL.municipal); return p && p.perfil ? p : null; }
  // com perfil municipal, a triagem genérica do §63 não abre sozinha: as boas-vindas fazem esse papel
  (function () { if (perfil68() && !ler("ipr_triagem_v1")) gravar("ipr_triagem_v1", JSON.stringify({ q: null, p: 0, t: Date.now(), m68: 1 })); })();
  function chave68(P) { return "ipr_m68_" + P.perfil + "_" + (P.entidade || ""); }
  function centrar68(P) {
    var M = mapa(); if (!M) return;
    var b = P.bbox;
    try {
      if (b && b.length === 4) M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 900 });
      else if (P.centro) M.easeTo({ center: P.centro, zoom: P.zoom || 11, duration: 900 });
    } catch (e) {}
  }
  function pintar68() {
    var P = perfil68(), o = document.getElementById("ipr-m68"); if (!P || !o) return;
    var C = catIdx(), J = /^j_/.test(P.entidade || ""), nomePerfil = window.IPR_LINGUA === "pt" ? P.perfil_nome : (P.perfil_en || P.perfil_nome);
    var cam = (P.camadas || []).map(function (id) { return C[id] ? nomeCamada(C[id]) : ""; }).filter(Boolean);
    var h = '<div class="ipr-m68-c" role="dialog" aria-modal="false" aria-labelledby="ipr-m68-t"><div class="ipr-m68-top">' + selLingua("ipr-lg-t") + '<button type="button" class="x" data-a68="fechar" aria-label="' + esc62(t62("fechar")) + '">×</button></div>';
    h += '<h2 id="ipr-m68-t">' + esc62(t68("ola", { e: P.entidade_curta || P.entidade_nome || "" })) + '</h2><p class="sub">' + esc62(t68("sub")) + "</p>";
    h += '<p class="k">' + esc62(t68("perfil")) + " · <b>" + esc62(nomePerfil) + "</b></p><p>" + esc62(t68("p_" + P.perfil)) + "</p>";
    if (P.tema) h += '<p class="k">' + esc62(t68("tema")) + " · <b>" + esc62(t62("t_" + P.tema)) + "</b></p>";
    if (cam.length) h += '<p class="k">' + esc62(t68("ligadas")) + '</p><p class="l">' + cam.map(esc62).join(" · ") + "</p>";
    if ((P.ferr || []).length) h += '<p class="k">' + esc62(t68("ferr")) + '</p><div class="a">' + P.ferr.map(function (f) { return '<button type="button" data-f68="' + esc62(f) + '">' + esc62(t62("f_" + f)) + "</button>"; }).join("") + "</div>";
    h += '<p class="k">' + esc62(t68("pastas")) + "</p><p>" + esc62(t68("pastasT")) + "</p>";
    if (P.base) {
      if (P.base.resta_n > 0) h += '<p class="bs">' + esc62(t68("base", { n: P.base.resta_n, ha: Math.round(P.base.resta_ha) })) + " " + esc62(t68(J ? "baseJ" : "baseC")) + "</p>";
      else h += '<p class="bs">' + esc62(t68("baseFim")) + "</p>";
    }
    if (P.aprox) h += '<p class="n">' + esc62(t68("aprox")) + "</p>";
    h += '<div class="a fim"><button type="button" data-a68="centrar">' + esc62(t68(J ? "verFreguesia" : "verConcelho")) + '</button><button type="button" data-a68="org">' + esc62(t68("abrirOrg")) + "</button>" +
      (P.base && P.base.resta_n > 0 ? '<button type="button" data-a68="base">' + esc62(t68("pedirBase")) + "</button>" : "") +
      '<button type="button" class="pri" data-a68="fechar">' + esc62(t68("comecar")) + "</button></div></div>";
    o.innerHTML = h;
    var f = o.querySelector("h2"); if (f) { f.setAttribute("tabindex", "-1"); try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function abrir68() {
    var o = document.getElementById("ipr-m68");
    if (!o) {
      o = document.createElement("div"); o.id = "ipr-m68"; (document.getElementById("ipe") || document.body).appendChild(o);
      o.addEventListener("click", function (e) {
        var b, P = perfil68();
        if ((b = e.target.closest("[data-f68]"))) { fechar68(); ferramenta(b.getAttribute("data-f68")); return; }
        if (!(b = e.target.closest("[data-a68]"))) { if (e.target === o) fechar68(); return; }
        var a = b.getAttribute("data-a68");
        if (a === "fechar") return fechar68();
        if (a === "centrar") { fechar68(); centrar68(P); return; }
        if (a === "org") { fechar68(); if (!abrirSeparador("org")) abrirSeparador("proj"); return; }
        if (a === "base") { fechar68(); produto("base"); return; }
      });
      o.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); fechar68(); } });
      document.addEventListener("ipr:lingua", function () { if (!o.hidden) pintar68(); });
    }
    o.hidden = false; pintar68();
  }
  function fechar68() { var o = document.getElementById("ipr-m68"), P = perfil68(); if (o) o.hidden = true; if (P) gravar(chave68(P) + "_bv", "1"); }
  function municipal68() {
    var P = perfil68(); if (!P || !noAtlas()) return true;
    var R = viz(), M = mapa(); if (!R || !M || !window.__iprTemas) return false;
    var k = chave68(P), sess = null; try { sess = sessionStorage.getItem(k); } catch (e) {}
    var q = location.search, proprio = /[?&](mapa|org_camada|ll)=/.test(q);
    if (!sess && !proprio) {
      try { sessionStorage.setItem(k, "1"); } catch (e) {}
      if (P.tema) { try { window.__iprTemas.aplicar(P.tema); } catch (e) {} }
      (P.camadas || []).forEach(function (id) { try { if (R.activas().indexOf(id) < 0) R.ligar(id, true); } catch (e) {} });
      setTimeout(function () { centrar68(P); }, 350);
    }
    var top = document.querySelector("#ipe .ipe-top .ipe-tr") || document.querySelector("#ipe .ipe-tr");
    if (top && !document.getElementById("ipr-m68-b")) {
      var b = document.createElement("button"); b.type = "button"; b.id = "ipr-m68-b"; b.className = "ipr-comecar";
      function rot() { b.textContent = P.entidade_curta || t68("rever"); b.title = t68("rever"); b.setAttribute("aria-label", t68("rever") + " · " + (P.entidade_curta || "")); }
      rot(); document.addEventListener("ipr:lingua", rot);
      b.addEventListener("click", function () { var o = document.getElementById("ipr-m68"); if (o && !o.hidden) fechar68(); else abrir68(); });
      var ref = document.getElementById("ipr-comecar"); if (ref && ref.parentNode === top) top.insertBefore(b, ref); else top.insertBefore(b, top.firstChild);
    }
    if (!ler(k + "_bv")) abrir68();
    return true;
  }
  (function () {
    if (document.getElementById("ipr-m68-css")) return;
    var st = document.createElement("style"); st.id = "ipr-m68-css";
    st.textContent =
      "#ipr-m68{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,10,.55);font:14px Inter,sans-serif;color:var(--tx,#e9eadf)}#ipr-m68[hidden]{display:none}" +
      "#ipr-m68 .ipr-m68-c{width:min(600px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:var(--p1,#141814);border:1px solid var(--ln,#2c312a);border-radius:16px;padding:20px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.4)}" +
      "#ipr-m68 .ipr-m68-top{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:-6px -8px 4px 0}#ipr-m68 .x{width:36px;height:36px;border-radius:50%;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);font-size:20px;line-height:1;cursor:pointer}" +
      "#ipr-m68 h2{font:600 21px/1.25 Inter,sans-serif;margin:0 0 4px;outline:none}#ipr-m68 .sub{margin:0 0 12px;color:var(--mu,#9aa08f);font-size:13px;line-height:1.45}" +
      "#ipr-m68 p{margin:0 0 8px;line-height:1.5}#ipr-m68 .k{margin:12px 0 4px;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f)}#ipr-m68 .k b{text-transform:none;letter-spacing:0;font-size:13px;color:var(--tx,#e9eadf)}" +
      "#ipr-m68 .l{font-size:12.5px;color:var(--tx,#e9eadf)}#ipr-m68 .bs{padding:8px 10px;border-left:3px solid var(--ac,#b5c46a);background:var(--p2,#1d221c);font-size:13px}#ipr-m68 .n{font-size:12px;color:var(--mu,#9aa08f)}" +
      "#ipr-m68 .a{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}#ipr-m68 .a button{font:500 13px Inter,sans-serif;padding:8px 12px;border-radius:9px;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer;min-height:38px}#ipr-m68 .a button:hover{border-color:var(--ac,#b5c46a)}" +
      "#ipr-m68 .a.fim{border-top:1px solid var(--ln,#2c312a);padding-top:12px;margin-top:12px}#ipr-m68 .a button.pri{margin-left:auto;background:var(--ac,#b5c46a);border-color:var(--ac,#b5c46a);color:#141814;font-weight:600}" +
      "@media (max-width:600px){#ipr-m68{padding:0;align-items:flex-end}#ipr-m68 .ipr-m68-c{width:100%;max-height:92dvh;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom))}#ipr-m68 h2{font-size:18px}#ipr-m68 .a.fim button{flex:1 1 45%}#ipr-m68 .a button.pri{margin-left:0}#ipr-m68-b{max-width:110px;overflow:hidden;text-overflow:ellipsis}}";
    (document.head || document.documentElement).appendChild(st);
  })();

  // §70 Caixa de mensagens e medições do mapa (#ipe-hud: distância, área, avisos) por baixo da Formiga (reporte 16260 do
  // Bernardo, 26/10/2026). No computador a Formiga fica no canto de baixo, à esquerda, e a caixa abre no mesmo canto (74 px da
  // margem): tapavam-se. Quando as duas se cruzam e a Formiga está por cima, a caixa passa para a direita da Formiga; quando
  // deixam de se cruzar, volta ao sítio. A Formiga não muda de lugar (continua arrastável) e a caixa não perde nada.
  (function hudFormiga() {
    function ajustar() {
      var h = document.getElementById("ipe-hud"), f = document.getElementById("tcdfmb"); if (!h) return;
      var ch = getComputedStyle(h);
      if (!f || window.innerWidth <= 900 || ch.display === "none" || getComputedStyle(f).display === "none") { if (h.__ipr70) { h.style.removeProperty("left"); h.__ipr70 = 0; } return; }
      var tinha = h.__ipr70; if (tinha) h.style.removeProperty("left");
      var a = h.getBoundingClientRect(), b = f.getBoundingClientRect();
      var cruza = b.width > 0 && a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
      var el = cruza ? document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) : null, fmCima = !!(el && (el === f || f.contains(el)));
      if (cruza && (fmCima || tinha)) {
        var pai = (h.offsetParent || document.body).getBoundingClientRect();
        h.style.setProperty("left", Math.round(b.right - pai.left + 10) + "px", "important"); h.__ipr70 = 1;
      } else h.__ipr70 = 0;
    }
    function ligar() {
      var h = document.getElementById("ipe-hud"); if (!h) return setTimeout(ligar, 1000);
      try { new MutationObserver(function () { clearTimeout(ligar.t); ligar.t = setTimeout(ajustar, 30); }).observe(h, { attributes: true, attributeFilter: ["class", "hidden"], childList: true }); } catch (e) {}
      setInterval(function () { if (!document.hidden) ajustar(); }, 1200);
      window.addEventListener("resize", ajustar);
    }
    ligar();
  })();

  // §69 Reportes do Miguel Clemente (26/10/2026, 18h55 e 21h54).
  //  a) O quadro do perfil de elevação não saía do sítio: passa a arrastar-se pelo cabeçalho (rato, dedo ou caneta) e tem
  //     botão para encolher a uma barra fina e voltar a abrir.
  //  b) A Formiga ficava à frente do quadro do perfil: some enquanto o perfil ou a planta estão abertos e volta ao fechar.
  //  c) Planta de localização no iPhone: as caixas de escolha apareciam em branco (o Safari pinta-as de branco e o texto claro
  //     desaparecia). Passam a ter fundo, cor e seta próprios, iguais em todos os navegadores.
  (function () {
    if (document.getElementById("ipr-69-css")) return;
    var st = document.createElement("style"); st.id = "ipr-69-css";
    var seta = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239aa08f'/%3E%3C/svg%3E\")";
    st.textContent = "#ipr-pf .c{cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}#ipr-pf .c button{cursor:pointer}#ipr-pf.ipr-69-min .g,#ipr-pf.ipr-69-min .k,#ipr-pf.ipr-69-min>.n{display:none}" +
      "#ipr-pf button.ipr-69-m{min-width:30px;padding:6px 8px}" +
      "body:has(#ipr-pf) #tcdfmb,body:has(#ipr-pl) #tcdfmb,body.ipr-69-sem-fm #tcdfmb{display:none!important}" +
      "#ipr-pl select{-webkit-appearance:none;appearance:none;background-color:var(--p2,#1d221c)!important;background-image:" + seta + ";background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important;color:var(--tx,#e9eadf)!important;-webkit-text-fill-color:var(--tx,#e9eadf);opacity:1}" +
      "#ipr-pl input[type=text]{-webkit-appearance:none;appearance:none;background-color:var(--p2,#1d221c)!important;color:var(--tx,#e9eadf)!important;-webkit-text-fill-color:var(--tx,#e9eadf)}" +
      "#ipr-pl select option{background:var(--p2,#1d221c);color:var(--tx,#e9eadf)}#ipr-pl input[type=checkbox]{accent-color:var(--ac,#b5c46a)}";
    (document.head || document.documentElement).appendChild(st);
    // Sem :has (navegadores antigos): a mesma regra por classe no body.
    function marcar() { var b = document.body; if (!b) return; var on = !!(document.getElementById("ipr-pf") || document.getElementById("ipr-pl")); if (b.classList.contains("ipr-69-sem-fm") !== on) b.classList.toggle("ipr-69-sem-fm", on); }
    function botao() {
      var P = document.getElementById("ipr-pf"); if (!P || P.querySelector(".ipr-69-m")) return;
      var a = P.querySelector(".c .a"); if (!a) return;
      var m = document.createElement("button"); m.type = "button"; m.className = "ipr-69-m"; m.textContent = "–"; m.title = "Encolher"; m.setAttribute("aria-label", "Encolher o perfil"); m.setAttribute("aria-expanded", "true");
      a.insertBefore(m, a.lastElementChild);
      m.addEventListener("click", function (ev) {
        ev.stopPropagation(); var min = P.classList.toggle("ipr-69-min");
        m.textContent = min ? "+" : "–"; m.title = min ? "Abrir" : "Encolher"; m.setAttribute("aria-label", min ? "Abrir o perfil" : "Encolher o perfil"); m.setAttribute("aria-expanded", String(!min));
      });
    }
    try { new MutationObserver(function () { marcar(); botao(); }).observe(document.documentElement, { childList: true, subtree: false }); } catch (e) {}
    function obsBody() { if (!document.body) return setTimeout(obsBody, 200); try { new MutationObserver(function () { marcar(); botao(); }).observe(document.body, { childList: true }); } catch (e) {} marcar(); botao(); }
    obsBody();
    document.addEventListener("pointerdown", function (ev) {
      var t = ev.target; if (!t.closest || t.closest("button,a,input,select,textarea")) return;
      var h = t.closest("#ipr-pf .c"); if (!h) return;
      var p = h.parentNode, r = p.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      ev.preventDefault(); try { h.setPointerCapture(ev.pointerId); } catch (e) {}
      function mv(e) {
        var x = Math.max(0, Math.min(window.innerWidth - Math.min(r.width, window.innerWidth), e.clientX - dx)), y = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dy));
        p.style.setProperty("left", x + "px", "important"); p.style.setProperty("top", y + "px", "important");
        p.style.setProperty("bottom", "auto", "important"); p.style.setProperty("transform", "none", "important"); p.style.setProperty("width", r.width + "px", "important");
      }
      function up() { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up); }
      h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up);
    }, true);
  })();

  // §70 Nuno, 27/10/2026, 07h48 (iPad): menos cheio.
  //  a) «Por onde começar?» sai da barra de cima; passa a ligação discreta no cabeçalho dos Temas.
  //  b) Temas mais pequenos: uma linha por tema (ícone e nome), duas colunas.
  //  c) Em tablets e ecrãs de toque (e janelas até 1280 px) a rosa dos ventos e o zoom ficam numa barra vertical à esquerda do
  //     mapa; no computador continuam integrados na barra das ferramentas (§65).
  function pequeno70() { try { return window.innerWidth <= 1280 || window.matchMedia("(pointer:coarse)").matches; } catch (e) { return window.innerWidth <= 1280; } }
  (function () {
    if (document.getElementById("ipr-70-css")) return;
    var st = document.createElement("style"); st.id = "ipr-70-css";
    st.textContent = "#ipr-comecar{display:none!important}" +
      ".ipr-t62-g:not(.cmp){gap:4px!important}.ipr-t62-g:not(.cmp) button{flex-direction:row!important;align-items:center!important;min-height:32px!important;padding:5px 8px!important;font-size:12px!important;gap:6px!important;border-radius:8px!important}" +
      ".ipr-t62-g:not(.cmp) button .tp{width:auto!important;order:0}.ipr-t62-g:not(.cmp) button i{display:none!important}.ipr-t62-g:not(.cmp) button svg{width:14px;height:14px}" +
      ".ipr-t62-sub{display:none}.ipr-70-com{font:500 11.5px Inter,sans-serif;color:var(--ac,#b5c46a);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:2px}" +
      "#ipe .maplibregl-ctrl-top-left.ipr-nav{z-index:3}#ipe .maplibregl-ctrl-top-left.ipr-nav .maplibregl-ctrl-group{margin:10px 0 0 10px}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function comecar70() {
    var cab = document.querySelector("#ipr-t62 .ipr-t62-cab"); if (!cab) return false;
    if (cab.querySelector(".ipr-70-com")) return true;
    var b = document.createElement("button"); b.type = "button"; b.className = "ipr-70-com";
    function rot() { b.textContent = t62("comecar"); } rot(); document.addEventListener("ipr:lingua", rot);
    b.addEventListener("click", function (e) { e.stopPropagation(); try { abrir63(null); } catch (x) {} });
    cab.appendChild(b); return false; // volta a correr: o §62 redesenha o cabeçalho
  }
  setInterval(function () { if (!document.hidden) try { comecar70(); } catch (e) {} }, 1500);

  // §71 Legenda no mapa (Nuno, 27/10/2026, 08h00: «qualquer camada que tenha várias cores tem que ter uma legenda»). Caixa no
  //     canto de baixo do mapa com as camadas ligadas: as que têm classes (leg) mostram cada cor e o que é; as servidões da DGT e
  //     as plantas do PDM mostram a legenda oficial do serviço (GetLegendGraphic, pelo proxy do m90379); as restantes mostram a
  //     cor e o nome. Encolhe-se pelo cabeçalho (lembrado no navegador); no telemóvel começa encolhida.
  var L71 = { sig: "", min: null };
  try { var m71 = localStorage.getItem("ipr_lgd71"); if (m71 !== null) L71.min = m71 === "1"; } catch (e) {}
  if (L71.min === null) L71.min = window.innerWidth < 700;
  (function () {
    if (document.getElementById("ipr-71-css")) return;
    var st = document.createElement("style"); st.id = "ipr-71-css";
    st.textContent = "#ipr-lgd{position:absolute;left:40px;bottom:34px;z-index:4;max-width:min(300px,calc(100% - 90px));max-height:min(46vh,420px);display:flex;flex-direction:column;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#2c312a);border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,.35);font:12px/1.35 Inter,sans-serif}" +
      "#ipr-lgd[hidden]{display:none}#ipr-lgd .h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;cursor:pointer;user-select:none;-webkit-user-select:none;border:0;background:none;color:inherit;font:600 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;width:100%;text-align:left}" +
      "#ipr-lgd .h i{font-style:normal;color:var(--mu,#9aa08f);font-weight:500}#ipr-lgd .c{overflow:auto;padding:0 10px 8px;display:flex;flex-direction:column;gap:8px}#ipr-lgd.min .c{display:none}" +
      "#ipr-lgd .l b{display:block;font-weight:600;font-size:12px;margin-bottom:3px}#ipr-lgd .r{display:flex;align-items:center;gap:7px;margin:2px 0;color:var(--tx2,#cfd2c4)}#ipr-lgd .r s{flex:0 0 14px;height:10px;border-radius:2px;border:1px solid rgba(255,255,255,.15)}" +
      "#ipr-lgd img{max-width:100%;height:auto;background:#fff;border-radius:4px;padding:3px;display:block}#ipr-lgd .one{display:flex;align-items:center;gap:7px}#ipr-lgd .one s{flex:0 0 14px;height:10px;border-radius:2px}" +
      "@media (max-width:700px){#ipr-lgd{left:8px;bottom:30px;max-height:38vh}}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function esc71(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function legenda71() {
    var M = mapa(), V = viz(); if (!M || !V || typeof V.activas !== "function") return false;
    var cv = M.getContainer(); var box = document.getElementById("ipr-lgd");
    if (!box) {
      box = document.createElement("div"); box.id = "ipr-lgd"; box.hidden = true; cv.appendChild(box);
      box.addEventListener("click", function (e) {
        if (!e.target.closest(".h")) return; L71.min = !L71.min; box.classList.toggle("min", L71.min);
        try { localStorage.setItem("ipr_lgd71", L71.min ? "1" : "0"); } catch (x) {}
      });
      ["mousedown", "touchstart", "wheel", "dblclick"].forEach(function (ev) { box.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    var C = catIdx(), ids = [];
    try { ids = V.activas().filter(function (id) { var e = C[id], g = e && (e.g || e.grupo); return e && g !== "fundo" && g !== "ref" && g !== "base"; }); } catch (e) { ids = []; }
    var en = (window.IPR_LINGUA || document.documentElement.lang || "pt").indexOf("en") === 0;
    var sig = ids.join("|") + (en ? "#en" : "");
    if (sig === L71.sig) return true; L71.sig = sig;
    if (!ids.length) { box.hidden = true; return true; }
    var h = '<button type="button" class="h" aria-expanded="' + !L71.min + '">' + (en ? "Legend" : "Legenda") + " <i>" + ids.length + " ▾</i></button><div class=\"c\">";
    ids.forEach(function (id) {
      var e = C[id], nome = esc71((en && e.en) || e.n || e.nome || id);
      if (/^(srup_|pdm_)/.test(id)) h += '<div class="l"><b>' + nome + '</b><img loading="lazy" alt="" src="/wp-json/tcd/v1/wms/' + id + '?leg=1"></div>';
      else if (e.leg && e.leg.length > 1) h += '<div class="l"><b>' + nome + "</b>" + e.leg.map(function (x) { return '<div class="r"><s style="background:' + esc71(x[0]) + '"></s><span>' + esc71(x[1]) + "</span></div>"; }).join("") + "</div>";
      else h += '<div class="one"><s style="background:' + esc71((e.leg && e.leg[0] && e.leg[0][0]) || e.cor || "#888") + '"></s><span>' + nome + "</span></div>";
    });
    box.innerHTML = h + "</div>"; box.classList.toggle("min", L71.min); box.hidden = false;
    return true;
  }
  setInterval(function () { if (!document.hidden) try { legenda71(); } catch (e) {} }, 1200);
  document.addEventListener("ipr:lingua", function () { L71.sig = ""; });

  // §72 Projectos (Nuno, 27/10/2026, 08h06): a lista aparecia duas vezes no separador Projectos (a do entrada.js, li.tme-t, e os
  //     cartões do app.js). Fica só uma: as linhas do entrada.js que repetem um cartão (#encomenda) escondem-se; ficam as que só
  //     existem nessa lista (projectos da IPR Cloud, partilhados). E tocar num projecto abre-o logo no mapa: o cabeçalho do
  //     cartão faz «Ver no mapa»; a linha faz «Abrir».
  (function () {
    if (document.getElementById("ipr-72-css")) return;
    var st = document.createElement("style"); st.id = "ipr-72-css";
    st.textContent = "li.tme-t.ipr-72-dup{display:none!important}#ipe-proj .ipe-card .ipe-ct{cursor:pointer}#ipe-proj .ipe-card .ipe-ct:hover strong{color:var(--ac,#b5c46a)}li.tme-t{cursor:pointer}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function encDe72(el) { var a = el.querySelector('a[href*="mapa="]'), m = a && /mapa=(\d+)/.exec(a.getAttribute("href") || ""); if (m) return m[1]; m = /#(\d{3,7})\b/.exec(el.textContent || ""); return m ? m[1] : ""; }
  function projectos72() {
    var P = document.getElementById("ipe-proj"); if (!P) return false;
    var ids = {};
    P.querySelectorAll(".ipe-card").forEach(function (c) { var m = /#(\d{3,7})\b/.exec((c.querySelector(".mono") || c).textContent || ""); if (m) ids[m[1]] = 1; });
    document.querySelectorAll("li.tme-t").forEach(function (li) { var id = encDe72(li), dup = !!(id && ids[id]); if (li.classList.contains("ipr-72-dup") !== dup) li.classList.toggle("ipr-72-dup", dup); });
    return false;
  }
  setInterval(function () { if (!document.hidden) try { projectos72(); } catch (e) {} }, 1500);
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest || t.closest("button,a,input,select,textarea,label,details,summary,.ipr-tma,.ipr-ca,.ipr-pf")) return;
    var ct = t.closest("#ipe-proj .ipe-card .ipe-ct");
    if (ct) {
      var card = ct.closest(".ipe-card");
      var b = card.querySelector(".ipr-ver-mapa") || [].filter.call(card.querySelectorAll("button"), function (x) { return /^Ver no mapa$/i.test((x.textContent || "").trim()); })[0];
      if (b) { b.click(); return; }
    }
    var li = t.closest("li.tme-t");
    if (li) { var a = li.querySelector('a[href*="mapa="]') || [].filter.call(li.querySelectorAll("a,button"), function (x) { return /^Abrir$/i.test((x.textContent || "").trim()); })[0]; if (a) a.click(); }
  });

  // §73 Nuno, 27/10/2026, 08h09-08h10 (iPad):
  //  a) «Onde está a rosa dos ventos?»: depois do §70, no iPad a rosa e o zoom deixaram de se ver. Em ecrãs de toque e até 1280 px
  //     fica garantido que o grupo (zoom, rosa, localizar) está no canto de cima à esquerda do mapa, visível e por cima de tudo
  //     o que o possa tapar; revê-se de 2 em 2 segundos, sem mexer no §65/§70.
  //  b) Tira da barra de cima o botão «AutoCAD para SIG · grátis» (o conversor continua em Processar › Converter ficheiros).
  //  c) INTELLIGENCE/EXPLORER e BETA com o mesmo estilo e a barra de cima com espaços iguais.
  (function () {
    if (document.getElementById("ipr-73-css")) return;
    var st = document.createElement("style"); st.id = "ipr-73-css";
    st.textContent = "#ipr-cad-g{display:none!important}" +
      "#ipe .maplibregl-control-container>.maplibregl-ctrl-top-left.ipr-nav.ipr-73{visibility:visible!important;opacity:1!important;z-index:30!important;pointer-events:auto}" +
      "#ipe .maplibregl-control-container>.ipr-nav.ipr-73[style*=\"display: none\"]{display:flex!important}#ipe .ipr-73 .ipe-rosa,#ipe .ipr-73 .maplibregl-ctrl{visibility:visible!important;opacity:1!important}" +
      "#ipe .ipe-top .ipe-nivel,#ipe .ipe-top .ipe-beta{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;height:22px;padding:0 9px;border:1px solid var(--ac2,#b5c46a);border-radius:999px;background:transparent;color:var(--ac2,#b5c46a);font:600 10.5px/1 Inter,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;cursor:default;margin:0 0 0 8px}" +
      "#ipe .ipe-top{column-gap:10px}#ipe .ipe-top>*{margin-top:0;margin-bottom:0}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function nav73() {
    if (!pequeno70()) return;
    var n = document.querySelector("#ipe .maplibregl-ctrl-top-left.ipr-nav"), mc = document.querySelector("#ipe .maplibregl-control-container");
    if (!n || !mc) return;
    if (n.parentNode !== mc) mc.appendChild(n);
    if (!n.classList.contains("ipr-73")) n.classList.add("ipr-73");
  }
  setInterval(function () { if (!document.hidden) try { nav73(); } catch (e) {} }, 2000);
  setTimeout(function () { try { nav73(); } catch (e) {} }, 800);
  // §74 Ficheiros do projecto e da organização (Nuno, 27/10/2026, 08h11). Em cada cartão de projecto e no separador
  //     Organização: «Ficheiros» com a lista, carregar (escolher ou arrastar, por partes de 8 MB, até 300 MB), pasta 0.0 a 0.5,
  //     abrir, descarregar e retirar. Servidor: m90381. Desenhos (DWG, DXF, GPKG, KML, KMZ, GeoJSON, GPX) carregados num projecto
  //     seguem também para a conversão (m90353), que os põe no mapa.
  var PF73 = { conv: ["dwg", "dxf", "gpkg", "kml", "kmz", "geojson", "gpx"], pastas: [["", "Sem pasta"], ["0.0", "0.0 Info de Arranque"], ["0.1", "0.1 Proposta Comercial"], ["0.2", "0.2 FT´s & RC´s"], ["0.3", "0.3 Trabalho"], ["0.4", "0.4 Entregáveis"], ["0.5", "0.5 Fotos"]] };
  (function () {
    if (document.getElementById("ipr-74-css")) return;
    var st = document.createElement("style"); st.id = "ipr-74-css";
    st.textContent = ".ipr-pf73{margin-top:8px;border:1px solid var(--ln,#2c312a);border-radius:9px;font:12.5px Inter,sans-serif;color:var(--tx,#e9eadf)}.ipr-pf73>summary{cursor:pointer;list-style:none;padding:7px 10px;font-weight:600;display:flex;justify-content:space-between;gap:8px}.ipr-pf73>summary::-webkit-details-marker{display:none}" +
      ".ipr-pf73 .c{padding:0 10px 10px;display:flex;flex-direction:column;gap:8px}.ipr-pf73 .dz{border:1.5px dashed var(--ln2,#4a5045);border-radius:8px;padding:12px;text-align:center;color:var(--mu,#9aa08f);cursor:pointer}.ipr-pf73 .dz.on{border-color:var(--ac,#b5c46a);color:var(--tx)}" +
      ".ipr-pf73 .tp{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.ipr-pf73 select{font:12px Inter,sans-serif;background:var(--p2,#1d221c);color:var(--tx);border:1px solid var(--ln,#2c312a);border-radius:6px;padding:4px 6px}" +
      ".ipr-pf73 ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}.ipr-pf73 li{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;background:var(--p2,#1d221c)}.ipr-pf73 li .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".ipr-pf73 li small{color:var(--mu,#9aa08f);white-space:nowrap}.ipr-pf73 li a,.ipr-pf73 li button{all:unset;cursor:pointer;font:600 11.5px Inter,sans-serif;color:var(--ac,#b5c46a)}.ipr-pf73 li button.r{color:#d9725b}.ipr-pf73 .m{color:var(--mu,#9aa08f);font-size:12px;min-height:1em}.ipr-pf73 .g{font:600 10.5px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mu,#9aa08f);margin-top:4px}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function api73(rota, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": window.tcdNonce || "" }, op.headers || {});
    return fetch("/wp-json/tcd/v1/" + rota, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j && j.message) || ("Erro " + r.status)); return j; }); });
  }
  function tam73(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function caixa73(alvo, titulo) {
    var d = document.createElement("details"); d.className = "ipr-pf73"; d.dataset.alvo = alvo;
    d.innerHTML = "<summary><span>" + titulo + '</span><i class="q"></i></summary><div class="c"><div class="tp"><label>Pasta <select class="ps">' +
      PF73.pastas.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + "</option>"; }).join("") + '</select></label></div>' +
      '<div class="dz" role="button" tabindex="0">Carregar ficheiros: toque para escolher ou arraste para aqui<br><small>PDF, imagens, Word, Excel, AutoCAD, GeoPackage, QGIS, vídeo · até 300 MB cada<br>Dos GeoPackages só fica o projecto: rasters e base cartográfica saem</small></div>' +
      '<input type="file" multiple hidden><div class="m" role="status"></div><div class="l"></div></div>';
    ["click", "mousedown", "pointerdown", "touchstart"].forEach(function (t) { d.addEventListener(t, function (e) { e.stopPropagation(); }); });
    var dz = d.querySelector(".dz"), inp = d.querySelector("input"), msg = d.querySelector(".m"), L = d.querySelector(".l"), carregado = false;
    function lista() {
      return api73("pfich?alvo=" + encodeURIComponent(alvo)).then(function (j) {
        carregado = true; var fs = j.ficheiros || [];
        d.querySelector(".q").textContent = fs.length ? String(fs.length) : "";
        if (!j.pode) { dz.hidden = true; d.querySelector(".tp").hidden = true; }
        if (!fs.length) { L.innerHTML = '<div class="m">Ainda sem ficheiros.</div>'; return; }
        var grupos = {}; fs.forEach(function (f) { (grupos[f.pasta || ""] = grupos[f.pasta || ""] || []).push(f); });
        L.innerHTML = PF73.pastas.filter(function (p) { return grupos[p[0]]; }).map(function (p) {
          return '<div class="g">' + esc71(p[1]) + "</div><ul>" + grupos[p[0]].map(function (f) {
            return '<li><span class="n" title="' + esc71(f.nome) + '">' + esc71(f.nome) + "</span><small>" + tam73(f.tamanho) + " · " + esc71((f.quando || "").slice(0, 10).split("-").reverse().join("/")) + (f.por ? " · " + esc71(f.por) : "") +
              '</small><a href="' + esc71(f.url + "&_wpnonce=" + (window.tcdNonce || "")) + '" target="_blank" rel="noopener">Abrir</a><a href="' + esc71(f.url + "&dl=1&_wpnonce=" + (window.tcdNonce || "")) + '">Descarregar</a>' + ((f.meu || j.pode) ? '<button type="button" class="r" data-r="' + f.id + '">Retirar</button>' : "") + "</li>";
          }).join("") + "</ul>";
        }).join("");
      }).catch(function (e) { L.innerHTML = '<div class="m">' + esc71(e.message) + "</div>"; });
    }
    d.addEventListener("toggle", function () { if (d.open && !carregado) lista(); });
    L.addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]"); if (!b) return;
      if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = "Confirmar retirar"; setTimeout(function () { b.dataset.c = ""; b.textContent = "Retirar"; }, 4000); return; }
      api73("pfich/retirar?id=" + b.dataset.r, { method: "POST" }).then(lista).catch(function (x) { msg.textContent = x.message; });
    });
    function sha(buf) { return crypto.subtle.digest("SHA-256", buf).then(function (h) { return [].map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }); }
    function enviar(f0) { return prepara75(f0, msg).then(enviarJa, function (e) { msg.textContent = f0.name + ": " + e.message; }); }
    function enviarJa(f) {
      var P = 8 * 1048576, n = Math.max(1, Math.ceil(f.size / P)), pasta = d.querySelector(".ps").value, ext = (f.name.split(".").pop() || "").toLowerCase();
      if (f.size > 300 * 1048576) { msg.textContent = f.name + ": acima de 300 MB."; return Promise.resolve(); }
      msg.textContent = "A preparar " + f.name + "…";
      return f.arrayBuffer().then(sha).then(function (h) {
        var i = 0;
        function parte(rota, extra) {
          msg.textContent = "A enviar " + f.name + (n > 1 ? " (" + (i + 1) + " de " + n + ")" : "") + "…";
          return api73(rota + "&nome=" + encodeURIComponent(f.name) + "&parte=" + i + "&partes=" + n + "&tamanho=" + f.size + extra + (i === n - 1 ? "&sha256=" + h : ""), { method: "POST", body: f.slice(i * P, (i + 1) * P), headers: { "Content-Type": "application/octet-stream" } })
            .then(function (j) { i++; return i < n ? parte(rota, extra) : j; });
        }
        return parte("pfich/parte?alvo=" + encodeURIComponent(alvo), "&pasta=" + encodeURIComponent(pasta)).then(function () {
          msg.textContent = f.name + ": carregado." + (f._nota75 || ""); lista();
          var m = /^e:(\d+)$/.exec(alvo);
          if (m && PF73.conv.indexOf(ext) >= 0) { i = 0; return parte("carregar/parte?projecto=" + m[1] + "&alinhar=" + m[1], "&saida=gpkg,geojson").then(function () { msg.textContent = f.name + ": carregado e na fila para aparecer no mapa (Processar › Ficheiros e AutoCAD)." + (f._nota75 || ""); }).catch(function () {}); }
        });
      }).catch(function (e) { msg.textContent = f.name + ": " + e.message; });
    }
    function varios(fs) { var a = [].slice.call(fs || []); (function um() { var f = a.shift(); if (f) enviar(f).then(um, um); })(); }
    dz.addEventListener("click", function () { inp.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    ["dragenter", "dragover"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add("on"); }); });
    ["dragleave", "drop"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove("on"); }); });
    dz.addEventListener("drop", function (e) { varios(e.dataTransfer.files); });
    inp.addEventListener("change", function () { varios(inp.files); inp.value = ""; });
    return d;
  }
  function ficheiros73() {
    if (!window.tcdNonce) return true;
    document.querySelectorAll("#ipe-proj .ipe-card").forEach(function (c) {
      if (c.querySelector(".ipr-pf73")) return;
      var m = /#(\d{3,7})\b/.exec((c.querySelector(".mono") || c).textContent || ""); if (!m) return;
      var ct = c.querySelector(".ipe-ct") || c; ct.appendChild(caixa73("e:" + m[1], "Ficheiros do projecto"));
    });
    var P = document.querySelector('.ipe-pane[data-pane="org"]');
    if (P && window.tcdOrg && !P.querySelector(".ipr-pf73")) {
      var d = null; try { d = window.tcdOrg.dados(); } catch (e) {}
      var oid = d && d.org && (d.org.id || d.org.ID);
      if (oid) P.appendChild(caixa73("o:" + oid, "Ficheiros da organização"));
    }
    return false;
  }
  setInterval(function () { if (!document.hidden) try { ficheiros73(); } catch (e) {} }, 1500);
  // §75 Pastas dos projectos da Terracrua Design e GeoPackages só com o projecto (Nuno, 27/10/2026, 08h36).
  //     1. Cada GeoPackage, antes de ser carregado (Ficheiros de projectos, da organização e das pastas), é aberto no navegador
  //        (sql.js) e perde os rasters (tiles, coverage) e as camadas de base cartográfica (MDT, curvas de nível, ortofotos,
  //        LiDAR, cadastro, CAOP, COS, declives, exposições). «A base cartográfica é fornecida por nós.» Só ficam os vectores
  //        e as tabelas do projecto. O original não é tocado.
  //     2. As pastas dos projectos do Drive (m90382, GET /tcd/v1/tproj) entram na lista de projectos do separador Organização,
  //        por número, cada uma com «Ficheiros» (alvo t:<id>). Se o projecto já lá estiver (camadas, Base, Cloud), a caixa
  //        entra dentro dele; senão, aparece uma pasta própria no lugar do número.
  var SQL75 = null;
  function sql75() {
    if (SQL75) return SQL75;
    SQL75 = new Promise(function (res, rej) {
      var U = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/";
      function ok() { window.initSqlJs({ locateFile: function (x) { return U + x; } }).then(res, rej); }
      if (window.initSqlJs) return ok();
      var sc = document.createElement("script"); sc.src = U + "sql-wasm.js"; sc.crossOrigin = "anonymous"; sc.onload = ok;
      sc.onerror = function () { SQL75 = null; rej(new Error("não consegui abrir a ferramenta de GeoPackage; tente outra vez.")); };
      document.head.appendChild(sc);
    });
    return SQL75;
  }
  // Tira de um GeoPackage tudo o que não é o projecto: rasters (tiles, coverage) e camadas de base cartográfica pelo nome.
  var BASE75 = /(base[ _.-]*cartogr|lidar|ortofoto|ortoimag|(^|[ _.-])orto([ _.-]|$)|(^|[ _.-])(mdt|mds|dem|dtm|dsm)([ _.-]|\d|$)|hillshade|sombreamento|relevo[ _-]?sombr|curvas?[ _-]*(de[ _-]*)?n[ií]vel|contour|declive|slope|exposi[cç]|(^|[ _.-])aspect|(^|[ _.-])caop([ _.-]|$)|cadastr|(^|[ _.-])cos[ _-]?(19|20)|carta[ _-]?militar|(^|[ _.-])cmp?[ _-]?25|srtm|copernicus|hipsometr|acumula[cç]|bacias?[ _-]?hidro|linhas?[ _-]?de[ _-]?(agua|água|escorr))/i;
  function limpa75(SQL, bytes) {
    var db = new SQL.Database(new Uint8Array(bytes)), tirar = [], ficam = [];
    function q(s, p) { var r = [], st = db.prepare(s); if (p) st.bind(p); while (st.step()) r.push(st.getAsObject()); st.free(); return r; }
    function x(s) { try { db.exec(s); } catch (e) {} }
    var cts; try { cts = q("SELECT table_name t, data_type d, identifier i FROM gpkg_contents"); } catch (e) { db.close(); throw new Error("Não é um GeoPackage válido."); }
    cts.forEach(function (c) { var nome = c.t + " " + (c.i || ""); if (c.d !== "features" && c.d !== "attributes") tirar.push({ t: c.t, porque: "raster" }); else if (BASE75.test(nome)) tirar.push({ t: c.t, porque: "base" }); else ficam.push(c.t); });
    if (!tirar.length) { db.close(); return { bytes: null, tirados: [], ficam: ficam }; }
    x("PRAGMA foreign_keys=OFF");
    tirar.forEach(function (o) {
      var t = o.t, qt = '"' + String(t).replace(/"/g, '""') + '"', lit = "'" + String(t).replace(/'/g, "''") + "'";
      q("SELECT name, type FROM sqlite_master WHERE type='trigger' AND tbl_name=" + lit).forEach(function (r) { x('DROP TRIGGER "' + r.name.replace(/"/g, '""') + '"'); });
      // índice espacial (R*Tree): as tabelas-sombra apagam-se directamente, o registo virtual com writable_schema
      var rts = q("SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE 'rtree^_' || ? || '^_%' ESCAPE '^'", [t.replace(/[\^%_]/g, "^$&")]);
      rts.forEach(function (r) { if (!/VIRTUAL/i.test(r.sql || "")) x('DROP TABLE "' + r.name.replace(/"/g, '""') + '"'); });
      var vs = rts.filter(function (r) { return /VIRTUAL/i.test(r.sql || ""); });
      vs.forEach(function (r) { var ok = true; try { db.exec('DROP TABLE "' + r.name.replace(/"/g, '""') + '"'); } catch (e) { ok = false; } if (!ok) { x("PRAGMA writable_schema=ON"); x("DELETE FROM sqlite_master WHERE name=" + "'" + r.name.replace(/'/g, "''") + "'"); x("PRAGMA writable_schema=OFF"); } });
      x("DROP TABLE IF EXISTS " + qt);
      ["gpkg_contents", "gpkg_geometry_columns", "gpkg_tile_matrix", "gpkg_tile_matrix_set", "gpkg_data_columns", "gpkg_2d_gridded_coverage_ancillary"].forEach(function (m) { x("DELETE FROM " + m + " WHERE table_name=" + lit); });
      x("DELETE FROM gpkg_2d_gridded_tile_ancillary WHERE tpudt_name=" + lit);
      x("DELETE FROM gpkg_extensions WHERE table_name=" + lit + " OR table_name LIKE 'rtree^_' || " + lit + " || '^_%' ESCAPE '^'");
      x("DELETE FROM gpkg_metadata_reference WHERE table_name=" + lit); x("DELETE FROM gpkg_ogr_contents WHERE table_name=" + lit);
      x("DELETE FROM layer_styles WHERE f_table_name=" + lit);
    });
    x("VACUUM");
    var out = db.export(); db.close();
    return { bytes: out, tirados: tirar, ficam: ficam };
  }

  function prepara75(f, msg) {
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    if (ext !== "gpkg") return Promise.resolve(f);
    if (f.size > 250 * 1048576) return Promise.reject(new Error("GeoPackage acima de 250 MB. Guarde no QGIS um GeoPackage só com as camadas do projecto (sem rasters nem base cartográfica) e carregue esse."));
    msg.textContent = "A separar o projecto da base cartográfica em " + f.name + "…";
    return Promise.all([sql75(), f.arrayBuffer()]).then(function (r) {
      var x = limpa75(r[0], r[1]);
      if (!x.ficam.length) throw new Error("só tem rasters ou base cartográfica; não há camadas de projecto para guardar.");
      if (!x.bytes) return f;
      var g = new File([x.bytes], f.name, { type: "application/geopackage+sqlite3" });
      var nr = x.tirados.filter(function (t) { return t.porque === "raster"; }).length, nb = x.tirados.length - nr;
      g._nota75 = " Ficaram " + x.ficam.length + (x.ficam.length === 1 ? " camada" : " camadas") + " do projecto; saíram " + (nr ? nr + " raster" + (nr > 1 ? "s" : "") : "") + (nr && nb ? " e " : "") + (nb ? nb + " de base cartográfica (" + x.tirados.filter(function (t) { return t.porque === "base"; }).map(function (t) { return t.t; }).slice(0, 4).join(", ") + (nb > 4 ? "…" : "") + ")" : "") + ". " + tam73(f.size) + " → " + tam73(g.size) + ".";
      return g;
    });
  }
  var TP75 = { lista: null, pedido: false, caixas: {}, pastas: {} };
  function pastas75() {
    if (!window.tcdNonce) return;
    var V = document.getElementById("ipr-orgv"); if (!V) return;
    if (!TP75.pedido) { TP75.pedido = true; api73("tproj").then(function (j) { TP75.lista = j.projectos || []; pastas75(); }).catch(function () { TP75.lista = []; }); return; }
    if (!TP75.lista || !TP75.lista.length) return;
    function numDe(el) { var k = el.getAttribute("data-k") || "", m = /^p:(\d{2,6})$/.exec(k); return m ? +m[1] : (el.dataset.n75 ? +el.dataset.n75 : null); }
    TP75.lista.forEach(function (p) {
      var n = +p.num;
      var dentro = [].filter.call(V.querySelectorAll(":scope > details.ov-p"), function (el) { return numDe(el) === n && !el.dataset.n75; })[0];
      var cx = TP75.caixas[p.id] || (TP75.caixas[p.id] = caixa73("t:" + p.id, "Ficheiros do projecto"));
      if (dentro) { if (cx.parentNode !== dentro) dentro.appendChild(cx); if (TP75.pastas[p.id] && TP75.pastas[p.id].parentNode) TP75.pastas[p.id].remove(); return; }
      var meu = TP75.pastas[p.id];
      if (!meu) {
        meu = TP75.pastas[p.id] = document.createElement("details"); meu.className = "ov-p"; meu.dataset.n75 = String(n);
        meu.innerHTML = "<summary><b>" + esc71(p.num) + "</b><em>" + esc71(p.nome) + "</em><small>Pasta do projecto" + (p.membros ? " · " + esc71(p.membros.join(", ")) : "") + "</small></summary>";
      }
      if (cx.parentNode !== meu) meu.appendChild(cx);
      if (meu.parentNode !== V) {
        var depois = [].filter.call(V.querySelectorAll(":scope > details.ov-p"), function (el) { var x = numDe(el); return x === null || x > n; })[0];
        if (depois) V.insertBefore(meu, depois); else V.appendChild(meu);
      }
    });
  }
  setInterval(function () { if (!document.hidden) try { pastas75(); } catch (e) {} }, 1500);

  function correr() {
    voltas++;
    [["marca", marca], ["puxadores", puxadores], ["creditos", creditos], ["estado", estado], ["formiga", formiga], ["projectos", projectos], ["editavel", editavel], ["semBug", semBug], ["rosa", rosa], ["arrumar", arrumar], ["projDir", projDir], ["testarEsq", testarEsq], ["contaTopo", contaTopo], ["camadasTopo", camadasTopo], ["sintetizar", sintetizar], ["opcoesCamadas", opcoesCamadas], ["projFechados", projFechados], ["todasMais", todasMais], ["painelTopo", painelTopo], ["qfieldQR", qfieldQR], ["temas", temas], ["natural", natural], ["aprenderDesenho", aprenderDesenho], ["fichas", fichasCamada], ["natureza", fichasNatureza], ["parcelas", parcelasPonto], ["partilhaQR", partilhaQR], ["teclado", tecladoVirtual], ["prefs", prefsConta], ["cronologia", cronologia], ["alcanena", pilotoAlcanena], ["estilosOrg", estilosOrg], ["fimDoVoo", fimDoVoo], ["orgNomes", orgNomes], ["projRecolhidos", projRecolhidos], ["instalarApp", instalarApp], ["temaEscuro", temaEscuro], ["orgPastas", orgVista], ["discricao", discricao], ["estradas", estradas], ["cloudLimpo", cloudLimpo], ["navEsquerda", navEsquerda], ["encomendaCompacta", encomendaCompacta], ["testarLigacao", testarLigacao], ["linguetaEsq", linguetaEsq], ["longe", longe], ["arrumarCamadas", arrumarCamadas], ["separadores", separadores], ["processar", processar], ["cartoes", cartoes], ["diagMundo", diagMundo], ["foraDoPais", foraDoPais], ["subPastas", subPastas], ["projOrg", projOrg], ["linhasProj", linhasProj], ["locaisUnico", locaisUnico], ["perfil", perfil], ["rosaSegura", rosaSegura], ["vista3dFicha", vista3dFicha], ["temas62", temas62], ["triagem63", triagem63], ["grande65", grande65], ["nav65", nav65], ["guarda65", guarda65], ["refresh65", refresh65], ["esquerda66", esquerda66], ["zoom67", zoom67], ["municipal68", municipal68]].forEach(function (f) { if (!feito[f[0]]) { try { feito[f[0]] = f[1](); } catch (e) {} } });
    try { nomes(); } catch (e) {}
    try { equipa(); } catch (e) {}
    try { if (window.__iprTodas && !document.getElementById("ipr-todas")) todasBases(); } catch (e) {}
    try { posicoes(); } catch (e) {}
    try { formigaSitio(); } catch (e) {}
    if (voltas < 60) setTimeout(correr, voltas < 10 ? 500 : 2000);
  }
  window.addEventListener("resize", function () { try { posicoes(); } catch (e) {} try { formigaSitio(); } catch (e) {} });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", correr); else correr();
})();

/* §81 Painel da Oficina (m90384, 27/10/2026). O perfil escolhido em «Personalizar» passa a ser o perfil de trabalho do Atlas
   (ipr_perfil, lido pelo agua.js e pelo arrumar.js). Só se grava quando a escolha do painel muda, para não desfazer o que a
   pessoa escolher depois dentro do Atlas. O ecrã inteiro do painel liga o modo mapa no arrumar.js. Falha em silêncio. */
(function () {
  try {
    var P = window.IPR_PERFIL && window.IPR_PERFIL.painel; if (!P || !P.perfil || !/^[a-z0-9_-]{1,30}$/.test(P.perfil)) return;
    if (/[?&]perfil_atlas=/.test(location.search)) return; // o endereço manda
    var sig = P.perfil + "|" + (P.tema || "") + "|" + (P.ecra ? 1 : 0);
    if (localStorage.getItem("ipr_painel_sig") === sig) return;
    localStorage.setItem("ipr_painel_sig", sig); localStorage.setItem("ipr_perfil", P.perfil);
    if (!localStorage.getItem("ipr_triagem_v1")) localStorage.setItem("ipr_triagem_v1", JSON.stringify({ q: null, p: 0, t: Date.now(), m79: 1 })); // com perfil, a triagem não abre sozinha
    try { sessionStorage.removeItem("ipr_perfil_s_" + P.perfil); sessionStorage.removeItem("ipr_perfil_sess"); } catch (e) {}
  } catch (e) {}
})();
