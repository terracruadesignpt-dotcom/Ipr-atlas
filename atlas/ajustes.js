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
    if (tab && tab.firstChild && tab.firstChild.nodeType === 3 && tab.firstChild.nodeValue !== "Processar") { tab.firstChild.nodeValue = "Processar"; tab.title = "Processar a Base Cartográfica (equipa)"; }
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
  function arrumar() {
    var loc = document.getElementById("ipc-loc"), tme = document.getElementById("tme");
    var pp = document.querySelector('#ipe .ipe-pane[data-pane="proj"]'), pe = document.querySelector('#ipe .ipe-pane[data-pane="enc"]');
    if (window.tcdNonce) {
      if (!loc || !pp) return false;
      if (loc.parentNode !== pp) { loc.classList.add("ipr-loc-dir"); pp.insertBefore(loc, pp.firstChild); }
      if (loc.classList.contains("fechado")) { var g = loc.querySelector(".ipr-gt"); if (g) g.click(); }
      return true;
    }
    if (loc) loc.style.display = "none"; // sem sessão não há projectos: a esquerda fica só com Pesquisar e Camadas
    if (!tme || !pe) return false;
    if (tme.parentNode !== pe) { tme.classList.add("tme-dir"); pe.insertBefore(tme, pe.firstChild); }
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

  var feito = {}, voltas = 0;
  function correr() {
    voltas++;
    [["marca", marca], ["puxadores", puxadores], ["creditos", creditos], ["estado", estado], ["formiga", formiga], ["projectos", projectos], ["editavel", editavel], ["semBug", semBug], ["rosa", rosa], ["arrumar", arrumar], ["projDir", projDir], ["testarEsq", testarEsq], ["contaTopo", contaTopo], ["camadasTopo", camadasTopo], ["sintetizar", sintetizar], ["opcoesCamadas", opcoesCamadas], ["projFechados", projFechados]].forEach(function (f) { if (!feito[f[0]]) { try { feito[f[0]] = f[1](); } catch (e) {} } });
    try { nomes(); } catch (e) {}
    try { equipa(); } catch (e) {}
    try { if (window.__iprTodas && !document.getElementById("ipr-todas")) todasBases(); } catch (e) {}
    try { posicoes(); } catch (e) {}
    if (voltas < 60) setTimeout(correr, voltas < 10 ? 500 : 2000);
  }
  window.addEventListener("resize", function () { try { posicoes(); } catch (e) {} });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", correr); else correr();
})();
