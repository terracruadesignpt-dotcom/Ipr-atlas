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
    function pôr() {
      var arv = cam.querySelector(".ipr-arv") || cam;
      if (loc.style.display === "none") loc.style.display = "";
      loc.classList.remove("ipr-loc-dir");
      if (loc.parentNode !== arv || arv.firstElementChild !== loc) arv.insertBefore(loc, arv.firstChild);
      var gn = loc.querySelector(".ipr-gn"); if (gn && gn.textContent !== "Os meus locais") gn.textContent = "Os meus locais";
    }
    if (!document.getElementById("ipr-loc-css")) { var cs = document.createElement("style"); cs.id = "ipr-loc-css"; cs.textContent = "#ipe #ipc-loc.ipr-g:not(.ipr-fechou)>.ipe-sbc{display:block!important}#ipe #ipc-loc.ipr-g:not(.ipr-fechou) .ipr-car{transform:rotate(90deg)}#ipe #ipc-loc.ipr-g.ipr-fechou>.ipe-sbc{display:none!important}#ipe #ipc-loc .ipe-loc-s,#ipe #ipc-loc .ipe-loc-p:has([data-am]){display:none!important}#ipe #ipc-loc>.ipe-sbc{max-height:30vh;overflow:auto}"; document.head.appendChild(cs); }
    var gtb = loc.querySelector(".ipr-gt"); if (gtb && !gtb.__iprM) { gtb.__iprM = 1; gtb.addEventListener("click", function () { loc.classList.toggle("ipr-fechou"); }, true); }
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
      if (p0._z === undefined) return; // camada sem simbologia: fica como o org.js a desenhou
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
  function separadores() {
    var tabs = document.getElementById("ipe-tabs"); if (!tabs) return false;
    function arrumar() {
      var ordem = ["enc", "proj", "org", "com"], bs = [].slice.call(tabs.querySelectorAll(".ipe-tab"));
      ordem.forEach(function (k) { var b = tabs.querySelector('.ipe-tab[data-tab="' + k + '"]'); if (b) tabs.appendChild(b); });
      bs.forEach(function (b) { if (ordem.indexOf(b.dataset.tab) < 0) tabs.appendChild(b); });
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
    var MEUS = [];
    function projectos() {
      var s = document.getElementById("ipr-conv-p"); if (!s || s.options.length > 1) return;
      var g1 = document.createElement("optgroup"); g1.label = "Os meus projectos"; MEUS = [];
      document.querySelectorAll("#ipe-proj .ipe-card").forEach(function (c) {
        var m = /#(\d+)/.exec((c.querySelector(".mono") || {}).textContent || ""); if (!m) return;
        var nome = ((c.querySelector(".ipe-ct strong") || {}).textContent || "Terreno").trim();
        if (MEUS.some(function (x) { return x[0] === m[1]; })) return; MEUS.push([m[1], nome]);
        var o = document.createElement("option"); o.value = m[1]; o.textContent = nome + " · #" + m[1]; g1.appendChild(o);
      });
      if (g1.children.length) s.appendChild(g1);
      // 25/10, 18h56 (Nuno): os projectos da organização também («os que estão na organização não me aparecem»).
      if (logado) api("org/grupos-meus").then(function (j) {
        if (!j || !j.org || !j.pode) return; var vistos = {}, ps = [];
        (j.grupos || []).forEach(function (g) { var m = /^(\d+\s[^·]{2,40}?)(?:\s·|$)/.exec((g.nome || "").trim()); if (m && !vistos[m[1]]) { vistos[m[1]] = 1; ps.push(m[1]); } });
        if (!ps.length) return;
        ps.sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
        var g2 = document.createElement("optgroup"); g2.label = "Organização · " + (j.nome || "");
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
        var fs = j.ficheiros || [];
        L.innerHTML = fs.slice(0, 20).map(function (x) {
          var ac = FORM_S.filter(function (f) { return x[f[0]]; }).map(function (f) { return '<a href="' + esc48(x[f[0]]) + (f[0] === "geojson" ? "&dl=1" : "") + '" download>' + f[1] + "</a>"; }).join("");
          if (x.geojson) ac = '<button type="button" data-mapa="' + x.id + '">Ver no mapa</button>' + ac + '<button type="button" data-org="' + x.id + '">Juntar à organização</button>';
          if (x.estado === "erro" || x.estado === "georref") ac = '<button type="button" data-rep="' + x.id + '">Tentar outra vez</button>' + ac;
          ac += '<button type="button" data-lixo="' + x.id + '">Apagar</button>';
          var cls = x.estado === "pronto" ? "ok" : (x.estado === "erro" || x.estado === "georref") ? "mau" : "";
          return '<li>' + (x.estado === "pronto" ? '<label class="esc"><input type="checkbox" data-esc="' + x.id + '"> </label>' : "") + '<b>' + esc48(x.nome) + '</b><span class="e ' + cls + '">' + esc48(EST[x.estado] || x.estado) + (x.enc ? " · #" + x.enc : "") + "</span>" + (x.msg && x.estado !== "fila" ? '<div class="e">' + esc48(x.msg) + "</div>" : "") + '<div class="ac">' + ac + "</div></li>";
        }).join("") || '<li class="e">Ainda não converteu nenhum ficheiro.</li>';
        // 25/10, 19h44 (Nuno): escolher ficheiros convertidos e ligá-los a um projecto.
        var bar = document.getElementById("ipr-conv-ligar");
        if (fs.some(function (x) { return x.estado === "pronto"; })) {
          if (!bar) { bar = document.createElement("div"); bar.id = "ipr-conv-ligar"; L.parentNode.insertBefore(bar, L); }
          bar.innerHTML = '<span>Ligar os escolhidos a</span><select>' + MEUS.map(function (p) { return '<option value="' + esc48(p[0]) + '">' + esc48(p[1]) + " · #" + esc48(p[0]) + "</option>"; }).join("") + '</select><button type="button">Ligar</button>';
          bar.querySelector("button").onclick = function () {
            var ids = [].map.call(L.querySelectorAll("[data-esc]:checked"), function (c) { return +c.dataset.esc; }), pj = +bar.querySelector("select").value;
            if (!ids.length) { msg.textContent = "Escolha primeiro os ficheiros (caixa à esquerda do nome)."; return; }
            if (!pj) { msg.textContent = "Não tem projectos para ligar."; return; }
            api("carregar/ligar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: ids, projecto: pj }) }).then(function (j) { msg.textContent = (j.n || 0) + " ficheiro(s) ligado(s) ao projecto #" + pj + "."; lista(); }, function (x) { msg.textContent = x.message; });
          };
        } else if (bar) bar.remove();
        clearTimeout(rel); if (fs.some(function (x) { return x.estado === "fila" || x.estado === "converter"; })) rel = setTimeout(lista, 8000);
      }).catch(function (e) { L.innerHTML = '<li class="e mau">' + esc48(e.message) + "</li>"; });
    }
    L.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
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
      "#ipr-orgv .ov-p>summary em{white-space:normal}#ipr-orgv .ov-p>summary b{font:700 12px Inter,sans-serif;color:var(--mu);min-width:38px}#ipr-orgv .ov-s>summary{font-weight:500;padding-left:18px}#ipr-orgv .ov-s .ov-s>summary{padding-left:30px}" +
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
    var cloud = null, ligadas = {};
    try { fetch("/wp-json/tcd/v1/cloud/meus", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { cloud = (j && (j.terrenos || j)) || []; if (!Array.isArray(cloud)) cloud = []; desenhar(); }).catch(function () { cloud = []; }); } catch (e) { cloud = []; }
    function num(s) { var m = /^(\d{2,6})\s/.exec(String(s || "")); return m ? m[1] : ""; }
    function sobrepoe(a, b) { return a && b && a.length === 4 && b.length === 4 && a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]; }
    function detalhe(cls, k, html, porOmissao) { var abre = k in EST ? EST[k] : porOmissao; return '<details class="' + cls + '" data-k="' + esc(k) + '"' + (abre ? " open" : "") + "><summary>" + html + "</summary>"; }
    function contas(cs) { var l = cs.filter(function (c) { return ligadas[c.id]; }).length; return cs.length + (cs.length === 1 ? " camada" : " camadas") + (l ? " · " + l + " ligada" + (l > 1 ? "s" : "") : ""); }
    function linha(c, prefixo) {
      var nome = c.nome; if (prefixo && nome.indexOf(prefixo + " · ") === 0) nome = nome.slice(prefixo.length + 3);
      return '<div class="ov-c"><label title="' + esc(c.nome) + '"><input type="checkbox" data-ov-c="' + c.id + '"' + (ligadas[c.id] ? " checked" : "") + '><span>' + esc(nome) + "</span></label><small>" + nf(c.n) + (c.ha > 0 ? " · " + nf(Math.round(c.ha * 10) / 10) + " ha" : "") + '</small><button type="button" class="ov-z" data-ov-z="' + c.id + '" title="Ajustar o mapa a esta camada">⤢</button></div>';
    }
    var ORD = { "análise": 0, "analise": 0, "projecto terracrua design": 1, "projeto terracrua design": 1, "autocads": 2, "autocad": 2 };
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
      (cloud || []).forEach(function (t) {
        var n2 = num(t.nome) || num(t.codigo) || ""; var alvo = n2 && projs[n2];
        if (!alvo) Object.keys(projs).some(function (k) { if (projs[k].cs.some(function (c) { return sobrepoe(c.bbox, t.bbox); })) { alvo = projs[k]; return true; } });
        if (alvo) { alvo.cloud = t; return; }
        var k = n2 || "c:" + (t.codigo || t.nome); projs[k] = { num: n2, nome: n2 ? String(t.nome).replace(/^\d+\s+/, "") : t.nome, prefixo: "", secs: [], cs: [], cloud: t, soCloud: 1 };
      });
      var lista = Object.keys(projs).map(function (k) { return projs[k]; }).sort(function (a, b) { var x = a.num ? +a.num : 1e9, y = b.num ? +b.num : 1e9; return x - y || String(a.nome).localeCompare(String(b.nome), "pt"); });
      var O = window.IPR_ORGS, h = '<div class="ov-cab"><div>';
      if (O && O.lista && O.lista.length > 1) { h += '<select class="ipr-orgsel" aria-label="Organização activa">' + O.lista.map(function (o) { return '<option value="' + esc(o.id) + '"' + (+o.id === +O.activa ? " selected" : "") + ">" + esc(o.nome) + "</option>"; }).join("") + "</select>"; }
      else h += "<h3>" + esc(d.org.nome) + "</h3>";
      h += "<small>" + lista.length + (lista.length === 1 ? " projecto" : " projectos") + (d.org.estado === "activa" ? "" : " · só leitura") + '</small></div><a href="/oficina/#camadas">Gerir na Oficina</a></div>';
      h += '<div class="ov-lbl">Projectos</div>';
      if (!lista.length) h += '<div class="ipe-vazio">Ainda não há projectos nesta organização.</div>';
      lista.forEach(function (p) {
        var t = p.cloud, sub = (t && t.local ? esc(t.local) : "") || (p.cs.length ? contas(p.cs) : "");
        var nomeCloud = t && t.nome && String(t.nome).replace(/^\d+\s+/, "") !== p.nome ? " · " + String(t.nome).replace(/^\d+\s+/, "") : "";
        h += detalhe("ov-p", "p:" + (p.num || p.nome), (p.num ? "<b>" + esc(p.num) + "</b>" : "") + "<em>" + esc(p.nome + nomeCloud) + "</em>" + (t ? '<span class="ov-cl" title="Está na IPR Cloud">Cloud</span>' : "") + "<small>" + sub + "</small>", false);
        h += '<div class="ov-acc">' + (p.cs.length || (t && t.bbox) ? '<button type="button" data-ov-ir="' + esc(p.num || p.nome) + '">Ir para o terreno</button>' : "") + (p.cs.length ? '<button type="button" data-ov-todas="' + esc(p.num || p.nome) + '">Ligar todas</button><button type="button" data-ov-nenhuma="' + esc(p.num || p.nome) + '">Desligar</button>' : "") + (t ? '<button type="button" data-ov-cloud="1">Abrir na Cloud</button>' : "") + "</div>";
        // secções como no Drive
        var secs = {}, ordem = [];
        p.secs.forEach(function (s) { var k = s.sec || ""; if (!secs[k]) { secs[k] = { nome: k, itens: [] }; ordem.push(k); } secs[k].itens.push(s); });
        ordem.sort(function (a, b) { var x = ORD[a.toLowerCase()], y = ORD[b.toLowerCase()]; x = x == null ? 5 : x; y = y == null ? 5 : y; return x - y; });
        ordem.forEach(function (k) {
          var S = secs[k], todas = []; S.itens.forEach(function (s) { todas = todas.concat(s.cs); });
          if (!k) { todas.forEach(function (c) { h += linha(c, p.prefixo); }); return; }
          h += detalhe("ov-s", "s:" + p.num + "|" + k, "<em>" + esc(k) + "</em><small>" + (todas.length ? contas(todas) : "vazia") + "</small>", false);
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
    function proj(k) { var V = P.querySelector("#ipr-orgv"), ps = V && V.__ov && V.__ov.projs || {}; return ps[k] || Object.keys(ps).map(function (x) { return ps[x]; }).filter(function (p) { return p.nome === k; })[0]; }
    function caixa(cs) { var b = null; cs.forEach(function (c) { if (!c.bbox) return; b = b ? [Math.min(b[0], c.bbox[0]), Math.min(b[1], c.bbox[1]), Math.max(b[2], c.bbox[2]), Math.max(b[3], c.bbox[3])] : c.bbox.slice(); }); return b; }
    function porId(id) { var d = window.tcdOrg.dados(); return ((d && d.camadas) || []).filter(function (c) { return c.id === id; })[0]; }
    function liga(id, sim) { ligadas[id] = sim; if (sim) window.tcdOrg.ligar(id); else window.tcdOrg.desligar(id); var o = P.querySelector('[data-ipo-c="' + id + '"]'); if (o) o.checked = sim; }
    P.addEventListener("toggle", function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.k && !desenhando) { EST[d.dataset.k] = d.open; guardar(); } }, true);
    P.addEventListener("change", function (ev) { var cb = ev.target; if (!cb || !cb.dataset || !cb.dataset.ovC) return; liga(+cb.dataset.ovC, cb.checked); actualizar(); });
    P.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("button"); if (!b || !P.querySelector("#ipr-orgv").contains(b)) return;
      if (b.dataset.ovZ) { var c = porId(+b.dataset.ovZ); if (c) { liga(c.id, true); window.tcdOrg.ajustar(c.bbox); var cb = P.querySelector('[data-ov-c="' + c.id + '"]'); if (cb) cb.checked = true; actualizar(); } return; }
      if (b.dataset.ovCloud) { var t = document.querySelector('.ipe-tab[data-tab="cloud"]'); if (t) t.click(); return; }
      var p = proj(b.dataset.ovIr || b.dataset.ovTodas || b.dataset.ovNenhuma); if (!p) return;
      if (b.dataset.ovIr) { var bx = caixa(p.cs) || (p.cloud && p.cloud.bbox); if (bx) window.tcdOrg.ajustar(bx); return; }
      var sim = !!b.dataset.ovTodas; p.cs.forEach(function (c) { liga(c.id, sim); }); P.querySelectorAll("#ipr-orgv [data-ov-c]").forEach(function (cb) { if (p.cs.some(function (c) { return c.id === +cb.dataset.ovC; })) cb.checked = sim; });
      if (sim) { var bx2 = caixa(p.cs); if (bx2) window.tcdOrg.ajustar(bx2); } actualizar();
    });
    var desenhando = false;
    function actualizar() { clearTimeout(actualizar.t); actualizar.t = setTimeout(function () { var y = P.scrollTop; desenhar(); P.scrollTop = y; }, 60); }
    new MutationObserver(function () { if (desenhando) return; var outro = [].slice.call(P.children).some(function (el) { return el.id !== "ipr-orgv" && !el.hidden; }); if (outro) actualizar(); }).observe(P, { childList: true });
    desenhar();
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
      "#ipe-proj .ipe-card.ipr-arq{display:none}#ipe-proj.ipr-ver-arq .ipe-card.ipr-arq{display:block;opacity:.55}#ipr-arq-b{all:unset;cursor:pointer;display:block;margin:6px 0;font:600 12px Inter,sans-serif;color:var(--mu)}";
    document.head.appendChild(st);
    function enc(c) { var m = /#(\d+)/.exec((c.querySelector(".mono") || {}).textContent || ""); return m ? +m[1] : 0; }
    function aplicar() {
      var n = 0;
      P.querySelectorAll(".ipe-card").forEach(function (c) {
        var id = enc(c); if (!id) return;
        var a = arq.indexOf(id) >= 0; c.classList.toggle("ipr-arq", a); if (a) n++;
        var ct = c.querySelector(".ipe-ct"); if (!ct || ct.querySelector(".ipr-ca")) { var bt = ct && ct.querySelector("[data-arq]"); if (bt) bt.textContent = a ? "Desarquivar" : "Arquivar"; return; }
        var d = document.createElement("div"); d.className = "ipr-ca";
        d.innerHTML = '<button type="button" data-arq="' + id + '">' + (a ? "Desarquivar" : "Arquivar") + '</button><button type="button" data-jorg="' + id + '">Juntar à organização</button>';
        ct.appendChild(d);
      });
      var b = document.getElementById("ipr-arq-b");
      if (n && !b) { b = document.createElement("button"); b.type = "button"; b.id = "ipr-arq-b"; P.insertBefore(b, P.firstChild); b.addEventListener("click", function () { mostrarArq = !mostrarArq; P.classList.toggle("ipr-ver-arq", mostrarArq); aplicar(); }); }
      if (b) { b.hidden = !n; b.textContent = (mostrarArq ? "Esconder" : "Mostrar") + " arquivados (" + n + ")"; }
    }
    var orgsJ = null;
    P.addEventListener("click", function (e) {
      var b = e.target.closest("[data-arq],[data-jorg]"); if (!b) return; e.stopPropagation(); e.preventDefault();
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
  function correr() {
    voltas++;
    [["marca", marca], ["puxadores", puxadores], ["creditos", creditos], ["estado", estado], ["formiga", formiga], ["projectos", projectos], ["editavel", editavel], ["semBug", semBug], ["rosa", rosa], ["arrumar", arrumar], ["projDir", projDir], ["testarEsq", testarEsq], ["contaTopo", contaTopo], ["camadasTopo", camadasTopo], ["sintetizar", sintetizar], ["opcoesCamadas", opcoesCamadas], ["projFechados", projFechados], ["todasMais", todasMais], ["painelTopo", painelTopo], ["qfieldQR", qfieldQR], ["temas", temas], ["natural", natural], ["aprenderDesenho", aprenderDesenho], ["fichas", fichasCamada], ["natureza", fichasNatureza], ["parcelas", parcelasPonto], ["partilhaQR", partilhaQR], ["teclado", tecladoVirtual], ["prefs", prefsConta], ["cronologia", cronologia], ["alcanena", pilotoAlcanena], ["estilosOrg", estilosOrg], ["fimDoVoo", fimDoVoo], ["orgNomes", orgNomes], ["projRecolhidos", projRecolhidos], ["instalarApp", instalarApp], ["temaEscuro", temaEscuro], ["orgPastas", orgVista], ["discricao", discricao], ["estradas", estradas], ["cloudLimpo", cloudLimpo], ["navEsquerda", navEsquerda], ["encomendaCompacta", encomendaCompacta], ["testarLigacao", testarLigacao], ["linguetaEsq", linguetaEsq], ["longe", longe], ["arrumarCamadas", arrumarCamadas], ["separadores", separadores], ["processar", processar], ["cartoes", cartoes], ["diagMundo", diagMundo], ["foraDoPais", foraDoPais], ["subPastas", subPastas]].forEach(function (f) { if (!feito[f[0]]) { try { feito[f[0]] = f[1](); } catch (e) {} } });
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
