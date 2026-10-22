/* IPR Atlas · ajustes do ecrã de computador (pedido do Miguel, reporte #15889, 22/10/2026, 22h14; aprovado pelo Nuno às 23h32).
   Só acrescenta: não altera o app.js nem retira funções. Cada ajuste falha em silêncio se o elemento não existir.
   1. Marca: IPR (sigla de regenerativo.pt) e «Instituto de Planeamento Regenerativo» no lugar do logótipo e do nome da Terracrua Design.
   2. Painéis da esquerda e da direita mais estreitos por omissão e com largura ajustável (arrastar a margem; duplo clique repõe).
   3. Créditos do mapa recolhidos num «i» também no computador.
   4. Nome ao passar o rato em todos os botões da barra de ferramentas e dos controlos do mapa (em português).
   5. Barra de estado: um só sistema de coordenadas de cada vez (clique troca WGS84 / PT-TM06); «Z» passa a «Zoom» com explicação.
   6. Janela da Formiga arrastável pelo cabeçalho (computador).
   7. Com sessão, «Os meus projectos» na barra da esquerda lista os terrenos e os projectos da IPR Cloud (ver abaixo). */
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
    var im = a.querySelector("img"); if (im) { im.src = SIGLA; im.alt = "IPR"; im.className = "ipr-sigla"; }
    var sp = a.querySelector("span"); if (sp) sp.textContent = "Instituto de Planeamento Regenerativo";
    return true;
  }

  // 2. Larguras ajustáveis
  var LIM = { wl: [200, 520, 260], wr: [240, 560, 320] };
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
        function up() { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); ipe.classList.remove("ipr-arrastar"); var I = mapa(); if (I && I.resize) I.resize(); }
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

  // 6. Formiga arrastável
  function formiga() {
    var p = document.getElementById("tcdfm"); if (!p || p.getAttribute("data-ipr")) return !!p;
    var h = p.querySelector("header"); if (!h) return false;
    p.setAttribute("data-ipr", "1"); h.style.cursor = "move"; h.title = "Arraste para mudar a janela de sítio";
    h.addEventListener("pointerdown", function (ev) {
      if (!desk() || ev.target.closest("button")) return;
      var r = p.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      ev.preventDefault(); h.setPointerCapture(ev.pointerId);
      function mv(e) {
        var x = Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - dx)), y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dy));
        p.style.setProperty("left", x + "px", "important"); p.style.setProperty("top", y + "px", "important");
        p.style.setProperty("bottom", "auto", "important"); p.style.setProperty("right", "auto", "important");
      }
      function up() { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); }
      h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up);
    });
    return true;
  }

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

  var feito = {}, voltas = 0;
  function correr() {
    voltas++;
    [["marca", marca], ["puxadores", puxadores], ["creditos", creditos], ["estado", estado], ["formiga", formiga], ["projectos", projectos]].forEach(function (f) { if (!feito[f[0]]) { try { feito[f[0]] = f[1](); } catch (e) {} } });
    try { nomes(); } catch (e) {}
    if (voltas < 60) setTimeout(correr, voltas < 10 ? 500 : 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", correr); else correr();
})();
