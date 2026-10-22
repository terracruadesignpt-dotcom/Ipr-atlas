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
   13. Caderneta predial em PDF: lê o artigo e a freguesia e leva o mapa ao terreno. */
(function () {
  "use strict";
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
        if (q) { q.value = o.freguesia + (o.concelho ? ", " + o.concelho : ""); q.dispatchEvent(new Event("input", { bubbles: true })); if (q.form) { try { q.form.requestSubmit(); } catch (e) {} } }
        aviso(inp, "Caderneta lida: " + feito.join(" · ") + ". O mapa vai à freguesia; escolha a parcela no mapa (o pedido também segue só com a caderneta).");
      } else {
        aviso(inp, feito.length ? "Caderneta lida: " + feito.join(" · ") + "." : "Não consegui ler o artigo nesta caderneta (pode ser uma imagem digitalizada). Segue com o pedido e nós localizamos.");
      }
    }).catch(function () { aviso(inp, "Não consegui ler este PDF aqui. Segue com o pedido e nós localizamos o terreno."); });
  }, true);

  var feito = {}, voltas = 0;
  function correr() {
    voltas++;
    [["marca", marca], ["puxadores", puxadores], ["creditos", creditos], ["estado", estado], ["formiga", formiga], ["projectos", projectos], ["editavel", editavel], ["semBug", semBug], ["rosa", rosa]].forEach(function (f) { if (!feito[f[0]]) { try { feito[f[0]] = f[1](); } catch (e) {} } });
    try { nomes(); } catch (e) {}
    try { posicoes(); } catch (e) {}
    if (voltas < 60) setTimeout(correr, voltas < 10 ? 500 : 2000);
  }
  window.addEventListener("resize", function () { try { posicoes(); } catch (e) {} });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", correr); else correr();
})();
