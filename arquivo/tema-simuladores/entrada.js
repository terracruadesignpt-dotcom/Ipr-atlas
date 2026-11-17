/* IPR Atlas · «O meu terreno» e barra da esquerda simplificada (pedido do Nuno, 20/10/2026, 17h27).
   14/11/2026: as áreas do «Simular sem Base» (m91234) ainda em preparação dizem «Área de simulação a preparar», não «Base encomendada».
   1. No topo da barra da esquerda, um cartão destacado:
      - sem sessão: «Ver o projecto exemplo», «Encomendar a Base do meu terreno», «Entrar»;
      - com sessão: os terrenos da pessoa. Com Base entregue, ligação bem visível «Abrir o meu terreno»
        (/atlas/?mapa=ID). Sem Base entregue, o limite da Base encomendada fica desenhado no mapa e há
        um botão para o ver. «Projecto exemplo» só enquanto a pessoa não tem terrenos nem projectos na Cloud
        (21/10, 22h11: depois disso o exemplo sai da barra, botão e camadas); «Na IPR Cloud» se houver.
   2. Camadas: modo simples por omissão (Fundo, a minha Base, o meu terreno, Relevo, Propriedade, Água,
      Condicionantes); «Mostrar todas as camadas» abre o resto (Fogo, Solo e ocupação, Referência).
      Fica lembrado neste navegador. Locais começa fechado quando está vazio.
   3. Vista inicial (A-1, 28/10/2026): sem parâmetros de destino, o mapa abre enquadrado nos terrenos da
      pessoa (um: o terreno; vários: todos, com o nome). Desliga-se com a opção tcd_entrada_vista_off.
   Não mexe no app.js: lê window.__ipe (mapa e estado) e usa só CSS e elementos novos. Segue as variáveis
   de cor do Atlas (tema claro e escuro). */
(function () {
  "use strict";
  var EXEMPLO = 14629; // projecto de exemplo (ver procedimentos/fila-codigo-adenda-2026-10-20-atlas-abertura.md)
  var ESCONDIDOS = ["fogo", "solo", "ref"];
  var CHAVE = "tcd_atlas_todas";
  var T = window.IPR_TXT_ENTRADA || {};
  function t(k, pt) { return T[k] || pt; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ha(n) { n = +n; return n ? (n >= 100 ? Math.round(n) : n.toFixed(1)).toString().replace(".", ",") + " ha" : ""; }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    "html.tme-sem-exemplo .ipe-loc-p,html.tme-sem-exemplo .ipe-loc-s{display:none!important}" +
    ".tme{margin:0 0 10px;padding:12px;border:1px solid var(--ac);background:var(--acs,rgba(176,90,50,.08));border-radius:8px}" +
    ".tme h3{margin:0 0 2px;font:600 14px/1.3 Inter,system-ui,sans-serif;color:var(--tx)}" +
    ".tme p{margin:0 0 10px;font-size:12.5px;line-height:1.45;color:var(--mu)}" +
    ".tme-l{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:6px}" +
    ".tme-t{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center;padding:8px 10px;border:1px solid var(--ln2);background:var(--p2);border-radius:6px}" +
    ".tme-t b{font:600 13px Inter,system-ui,sans-serif;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".tme-t small{grid-column:1;font:11.5px var(--mono,monospace);color:var(--mu)}" +
    ".tme-t .tme-b{grid-column:2;grid-row:1/span 2}" +
    ".tme-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 12px;border-radius:6px;border:1px solid var(--ac);background:var(--ac);color:#fff;font:600 12.5px Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}" +
    ".tme-b:hover{filter:brightness(1.08)}" +
    ".tme-b:focus-visible{outline:2px solid var(--tx);outline-offset:2px}" +
    ".tme-b--s{background:transparent;color:var(--ac)}" +
    ".tme-acc{display:flex;flex-wrap:wrap;gap:6px}" +
    ".tme-acc .tme-b{flex:1 1 auto}" +
    ".tme-todas{all:unset;box-sizing:border-box;display:block;width:100%;margin:6px 0 2px;padding:7px 10px;border:1px dashed var(--ln2);border-radius:6px;text-align:center;font:500 12px Inter,system-ui,sans-serif;color:var(--ac);cursor:pointer}" +
    ".tme-todas:hover{background:var(--p3)}" +
    "#ipe-cam.tme-simples .ipr-g[data-g=\"" + ESCONDIDOS.join("\"],#ipe-cam.tme-simples .ipr-g[data-g=\"") + "\"]{display:none}";

  function estado() { return window.__ipe && window.__ipe.estado ? window.__ipe.estado : null; }
  function mapa() { return window.__ipe && window.__ipe.mapa ? window.__ipe.mapa : null; }

  function caixa(g) {
    var b = [180, 90, -180, -90];
    (function anda(c) {
      if (!c) return;
      if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); return; }
      for (var i = 0; i < c.length; i++) anda(c[i]);
    })(g && (g.coordinates || (g.geometry && g.geometry.coordinates) || (g.features && g.features.map(function (f) { return f.geometry && f.geometry.coordinates; }))));
    return b[0] <= b[2] ? b : null;
  }
  function entregue(m) { return m && m.estado_k === "completed" && (m.downloads || []).length > 0; }

  // Desenha no mapa o limite das Bases encomendadas e ainda não entregues.
  function desenharPedidos(ms) {
    var I = mapa(); if (!I || !I.getStyle) return;
    var fs = [];
    ms.forEach(function (m) { if (!entregue(m) && m.geojson) { var g = m.geojson; (g.features || [g]).forEach(function (f) { var geo = f.geometry || f; if (geo && geo.type) fs.push({ type: "Feature", properties: { nome: m.local || ("#" + m.encomenda) }, geometry: geo }); }); } });
    var dados = { type: "FeatureCollection", features: fs };
    try {
      if (I.getSource("tme-pedidos")) { I.getSource("tme-pedidos").setData(dados); return; }
      if (!fs.length) return;
      I.addSource("tme-pedidos", { type: "geojson", data: dados });
      I.addLayer({ id: "tme-pedidos-f", type: "fill", source: "tme-pedidos", paint: { "fill-color": "#c0623a", "fill-opacity": 0.08 } });
      I.addLayer({ id: "tme-pedidos-l", type: "line", source: "tme-pedidos", paint: { "line-color": "#c0623a", "line-width": 2.5, "line-dasharray": [2, 1.5] } });
    } catch (e) {}
  }
  function irPara(m) {
    var I = mapa(), b = caixa(m.geojson); if (!I || !b) return;
    var pad = window.innerWidth < 760 ? 40 : { top: 60, bottom: 60, left: 360, right: 420 };
    try { I.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: pad, maxZoom: 16.5, duration: 900, pitch: 0, bearing: 0 }); } catch (e) {}
  }

  function cartao(ms, cloud) {
    var sessao = !!window.tcdNonce;
    var h = "";
    if (!sessao) {
      h = "<h3>" + t("comecar", "Comece aqui") + "</h3><p>" + t("comecar_p", "Veja um projecto real de exemplo ou indique o seu terreno para encomendar a Base Cartográfica.") + "</p>" +
        "<div class=\"tme-acc\"><button type=\"button\" class=\"tme-b\" data-tme=\"exemplo\">" + t("ver_exemplo", "Ver o projecto exemplo") + "</button>" +
        "<button type=\"button\" class=\"tme-b tme-b--s\" data-tme=\"encomendar\">" + t("encomendar", "Encomendar a Base do meu terreno") + "</button>" +
        "<a class=\"tme-b tme-b--s\" href=\"/conta/?redirect_to=" + encodeURIComponent(location.pathname) + "\">" + t("entrar", "Já é cliente? Entrar") + "</a></div>";
      return h;
    }
    var proprios = ms.filter(function (m) { return m.dono !== false && !m.rever; });
    var partilhados = ms.filter(function (m) { return m.dono === false && !m.rever; });
    var lista = proprios.concat(partilhados);
    h = "<h3>" + t("meus", "Os meus terrenos") + "</h3>";
    if (!lista.length) {
      h += "<p>" + t("sem_terrenos", "Ainda não tem terrenos. Veja o exemplo ou indique o seu terreno.") + "</p>";
    } else {
      h += "<ul class=\"tme-l\">" + lista.map(function (m) {
        var nome = esc(m.local || ("Terreno #" + m.encomenda)), meta = [ha(m.area_ha), m.dono === false ? t("partilhado", "partilhado consigo") : ""].filter(Boolean).join(" · ");
        if (entregue(m)) {
          var aberto = estado() && estado().actual && String(estado().actual.id) === String(m.id);
          return "<li class=\"tme-t\"><b>" + nome + "</b><small>" + esc(meta || t("base_pronta", "Base Cartográfica pronta")) + "</small>" +
            (aberto ? "<span class=\"tme-b tme-b--s\" aria-current=\"true\">" + t("aberto", "Aberto") + "</span>" :
              "<a class=\"tme-b\" href=\"/atlas/?mapa=" + encodeURIComponent(m.id) + "\">" + t("abrir", "Abrir o meu terreno") + "</a>") + "</li>";
        }
        return "<li class=\"tme-t\"><b>" + nome + "</b><small>" + esc([/^Área de simulação/.test(m.local || "") ? t("area_a_preparar", "Área de simulação a preparar") : t("base_encomendada", "Base encomendada"), m.estado].filter(Boolean).join(": ")) + "</small>" +
          (m.geojson ? "<button type=\"button\" class=\"tme-b tme-b--s\" data-tme=\"ver\" data-id=\"" + esc(m.id) + "\">" + t("ver_limite", "Ver no mapa") + "</button>" : "") + "</li>";
      }).join("") + "</ul>";
    }
    // 21/10/2026, 22h11 (Nuno): com Base própria, terreno partilhado ou projectos na Cloud, o exemplo sai da barra da esquerda.
    var comTrabalho = lista.length > 0 || cloud > 0;
    document.documentElement.classList.toggle("tme-sem-exemplo", comTrabalho);
    h += "<div class=\"tme-acc\">";
    if (cloud > 0) h += "<button type=\"button\" class=\"tme-b\" data-tme=\"cloud\">" + t("cloud", "Na IPR Cloud") + " (" + cloud + ")</button>";
    if (!comTrabalho) h += "<a class=\"tme-b tme-b--s\" href=\"/atlas/?mapa=" + EXEMPLO + "\">" + t("exemplo", "Projecto exemplo") + "</a>";
    if (!lista.length) h += "<button type=\"button\" class=\"tme-b tme-b--s\" data-tme=\"encomendar\">" + t("encomendar", "Encomendar a Base do meu terreno") + "</button>";
    return h + "</div>";
  }

  function separador(nome) { var b = document.querySelector("#ipe-tabs [data-tab=\"" + nome + "\"]"); if (b) b.click(); var dir = document.getElementById("ipe-dir"); if (dir && dir.scrollIntoView && window.innerWidth < 760) dir.scrollIntoView({ behavior: "smooth" }); }

  function montar() {
    var esq = document.getElementById("ipe-esq"); if (!esq || document.getElementById("tme")) return !!esq;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var sec = document.createElement("section"); sec.id = "tme"; sec.className = "tme"; sec.setAttribute("aria-label", t("meus", "Os meus terrenos"));
    esq.insertBefore(sec, esq.firstChild);
    sec.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tme]"); if (!b) return;
      var a = b.getAttribute("data-tme");
      if (a === "exemplo") { var am = document.querySelector("[data-am=\"ir\"]"); if (am) am.click(); else location.href = "/atlas/?mapa=" + EXEMPLO; }
      else if (a === "encomendar") separador("enc");
      else if (a === "cloud") separador("cloud");
      else if (a === "ver") { var ms = mapas(); for (var i = 0; i < ms.length; i++) if (String(ms[i].id) === b.getAttribute("data-id")) irPara(ms[i]); }
    });
    simplificarCamadas();
    return true;
  }

  function simplificarCamadas() {
    var cam = document.getElementById("ipe-cam"); if (!cam || cam.getAttribute("data-tme")) return;
    cam.setAttribute("data-tme", "1");
    var todas = ler(CHAVE) === "1";
    cam.classList.toggle("tme-simples", !todas);
    var bt = document.createElement("button"); bt.type = "button"; bt.className = "tme-todas";
    function rot() { bt.textContent = cam.classList.contains("tme-simples") ? t("todas", "Mostrar todas as camadas") : t("menos", "Mostrar só as principais"); }
    rot();
    bt.addEventListener("click", function () { var s = cam.classList.toggle("tme-simples"); gravar(CHAVE, s ? "0" : "1"); rot(); });
    cam.parentNode.appendChild(bt);
    // Locais: fechado quando não há nada guardado.
    var loc = document.querySelector("[data-sb=\"locais\"]"), n = document.getElementById("ipe-loc-n");
    if (loc && !loc.classList.contains("fechado") && (!n || !(+String(n.textContent).replace(/\D/g, "")))) { var hb = loc.querySelector(".ipe-sbh"); if (hb) hb.click(); }
  }

  function mapas() { var s = estado(); return (s && s.mapas && s.mapas.length ? s.mapas : (s && s.dados && s.dados.mapas) || []) || []; }

  // 3. Vista inicial nos terrenos da própria pessoa (A-1, pedido do Nuno de 20/10/2026, 16h44).
  //    Só sem parâmetros de destino no endereço; com um terreno, enquadra-o; com vários, enquadra todos e
  //    põe o nome de cada um; sem terrenos, fica como hoje. Sem rotação nem inclinação. Margem do lado do
  //    painel aberto. Enquanto a lista não chega não se mexe no mapa (e trava a abertura antes de voar
  //    para o exemplo). Interruptor próprio: opção tcd_entrada_vista_off (window.TCD_ENT_VISTA_OFF).
  var LIVRES = /^(utm_[a-z_]+|gclid|fbclid|msclkid|_gl|mc_cid|mc_eid)$/i;
  function semDestino() {
    if (window.TCD_ENT_VISTA_OFF) return false;
    if (location.hash && location.hash.length > 1) return false;
    var ok = true;
    try { new URLSearchParams(location.search).forEach(function (v, k) { if (!LIVRES.test(k)) ok = false; }); } catch (e) { return false; }
    return ok;
  }
  function bboxDe(m) {
    var b = m && m.bbox;
    if (Array.isArray(b) && b.length === 4) { b = b.map(Number); if (b.every(isFinite) && b[0] <= b[2] && b[1] <= b[3] && Math.abs(b[0]) <= 180 && Math.abs(b[2]) <= 180 && Math.abs(b[1]) <= 90 && Math.abs(b[3]) <= 90) return b; }
    return m && m.geojson ? caixa(m.geojson) : null;
  }
  function escolher(ms) {
    var vivos = ms.filter(function (m) { return !m.rever; });
    var proprios = vivos.filter(function (m) { return m.dono !== false; });
    var lista = proprios.length ? proprios : vivos.filter(function (m) { return m.dono === false; });
    return lista.map(function (m) { return { m: m, b: bboxDe(m) }; }).filter(function (x) { return x.b; });
  }
  function uniao(xs) {
    return xs.reduce(function (u, x) { return [Math.min(u[0], x.b[0]), Math.min(u[1], x.b[1]), Math.max(u[2], x.b[2]), Math.max(u[3], x.b[3])]; }, [180, 90, -180, -90]);
  }
  // Margens: 40 px mais o que cada painel visível tapa do mapa, do lado onde está.
  function margens(I) {
    var p = { top: 40, bottom: 40, left: 40, right: 40 }, C;
    try { C = I.getContainer().getBoundingClientRect(); } catch (e) { return p; }
    var W = C.width || window.innerWidth, H = C.height || window.innerHeight;
    ["ipe-esq", "ipe-dir"].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var cs = window.getComputedStyle ? getComputedStyle(el) : null;
      if (cs && (cs.display === "none" || cs.visibility === "hidden")) return;
      var r = el.getBoundingClientRect();
      var x0 = Math.max(r.left, C.left), x1 = Math.min(r.right, C.left + W), y0 = Math.max(r.top, C.top), y1 = Math.min(r.bottom, C.top + H);
      var w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
      if (h >= H * 0.5 && w < W * 0.9) { if ((x0 + x1) / 2 < C.left + W / 2) p.left += w; else p.right += w; }
      else if (w >= W * 0.5) { if ((y0 + y1) / 2 > C.top + H / 2) p.bottom += h; else p.top += h; }
    });
    // Nunca tapar mais de 70 % do mapa num sentido.
    var fx = Math.min(1, W * 0.7 / (p.left + p.right)), fy = Math.min(1, H * 0.7 / (p.top + p.bottom));
    p.left = Math.round(p.left * fx); p.right = Math.round(p.right * fx); p.top = Math.round(p.top * fy); p.bottom = Math.round(p.bottom * fy);
    return p;
  }
  function rotulos(I, xs) {
    if (!window.maplibregl || !window.maplibregl.Marker) return;
    var st = document.createElement("style");
    st.textContent = ".tme-rot{all:unset;box-sizing:border-box;max-width:180px;padding:4px 8px;border-radius:12px;background:var(--p1,#fff);color:var(--tx,#222);border:1px solid var(--ac,#b05a32);font:600 12px/1.2 Inter,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.25)}.tme-rot:focus-visible{outline:2px solid var(--tx,#222)}";
    document.head.appendChild(st);
    xs.forEach(function (x) {
      var m = x.m, el = document.createElement("button");
      el.type = "button"; el.className = "tme-rot"; el.textContent = m.local || ("Terreno #" + m.encomenda);
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        if (entregue(m)) location.href = "/atlas/?mapa=" + encodeURIComponent(m.id); else irPara(m);
      });
      try { new window.maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([(x.b[0] + x.b[2]) / 2, (x.b[1] + x.b[3]) / 2]).addTo(I); } catch (e) {}
    });
  }
  function desenharTodos(I, xs) {
    var fs = [];
    xs.forEach(function (x) { var g = x.m.geojson; if (!g || !entregue(x.m)) return; /* as encomendas por pagar já têm o tracejado */ (g.features || [g]).forEach(function (f) { var geo = f.geometry || f; if (geo && geo.type) fs.push({ type: "Feature", properties: {}, geometry: geo }); }); });
    if (!fs.length) return;
    try {
      if (I.getSource("tme-vista")) return;
      if (!desenharTodos.ligado && I.on) { desenharTodos.ligado = 1; I.on("styledata", function () { if (!I.getSource("tme-vista")) desenharTodos(I, xs); }); }
      I.addSource("tme-vista", { type: "geojson", data: { type: "FeatureCollection", features: fs } });
      I.addLayer({ id: "tme-vista-l", type: "line", source: "tme-vista", paint: { "line-color": "#c0623a", "line-width": 2 } });
    } catch (e) {}
  }
  function saltarAbertura() {
    if (window.__ipeAb !== 1) return false;
    var s = document.querySelector(".ipe-ab-saltar [data-ab=\"s\"]"); if (!s) return false;
    s.click(); return true;
  }
  function enquadrar(I, xs, dur) {
    var b = xs.length === 1 ? xs[0].b : uniao(xs);
    try { I.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: margens(I), maxZoom: xs.length === 1 ? 16.5 : 14, duration: dur, pitch: 0, bearing: 0 }); } catch (e) {}
  }
  function aplicarVista(I, xs, mexeu) {
    enquadrar(I, xs, saltarAbertura() ? 0 : 900);
    if (xs.length > 1) { desenharTodos(I, xs); rotulos(I, xs); }
    // Durante 3 s: se a abertura do Atlas arrancar depois (separador em segundo plano), salta-se e volta-se
    // a enquadrar; se o painel abrir e o mapa mudar de tamanho, enquadra-se outra vez, uma só vez.
    var t0 = Date.now(), redim = false;
    try { I.on("resize", function () { if (!redim && !mexeu() && Date.now() - t0 < 1500) { redim = true; enquadrar(I, xs, 0); } }); } catch (e) {}
    var iv = setInterval(function () {
      if (mexeu() || Date.now() - t0 > 3000 || mapa() !== I) { clearInterval(iv); return; }
      if (saltarAbertura()) enquadrar(I, xs, 0);
    }, 100);
  }
  var vistaFeita = false;
  function vistaInicial() {
    if (vistaFeita || !window.tcdNonce || !semDestino()) return;
    vistaFeita = true;
    var mexeu = false, ligados = [], t0 = Date.now();
    function marca() { mexeu = true; }
    function ligar(I) {
      if (!I || ligados.indexOf(I) >= 0) return; ligados.push(I);
      try { I.on("movestart", function (e) { if (e && e.originalEvent) marca(); }); } catch (e) {}
      try { var c = I.getContainer(); ["mousedown", "touchstart", "wheel"].forEach(function (ev) { c.addEventListener(ev, function (e) { if (!e.target.closest || !e.target.closest(".ipe-ab-saltar, .tme-rot")) marca(); }, { passive: true }); }); } catch (e) {}
    }
    var iv = setInterval(function () {
      var I = mapa(), s = estado();
      ligar(I);
      var pronto = I && I.loaded && I.loaded() && !document.hidden;
      var lista = s && s.dados !== null && s.dados !== undefined;
      if (mexeu || Date.now() - t0 > 20000) { clearInterval(iv); return; }
      if (!pronto || !lista) return;
      clearInterval(iv);
      // Dar tempo ao Atlas para decidir a sua abertura (corre 60 ms depois de o mapa carregar).
      setTimeout(function () {
        if (mexeu || mapa() !== I) return;
        var xs = escolher(mapas());
        if (xs.length) aplicarVista(I, xs, function () { return mexeu; });
      }, 120);
    }, 200);
  }

  var cloudN = 0, feito = false;
  function actualizar() {
    var sec = document.getElementById("tme"); if (!sec) return;
    var ms = mapas();
    sec.innerHTML = cartao(ms, cloudN);
    if (ms.length) desenharPedidos(ms);
  }

  function arrancar(tentativa) {
    if (!montar()) { if (tentativa < 60) setTimeout(function () { arrancar(tentativa + 1); }, 500); return; }
    actualizar();
    vistaInicial();
    // Os mapas do cliente chegam depois do arranque do Atlas: esperar por eles até 20 s.
    if (window.tcdNonce && !feito) {
      var n = 0, iv = setInterval(function () {
        n++;
        if (mapas().length || n > 40) { clearInterval(iv); feito = true; actualizar(); var I = mapa(); if (I && I.on) I.on("styledata", function () { if (!I.getSource("tme-pedidos")) desenharPedidos(mapas()); }); }
      }, 500);
      fetch("/wp-json/tcd/v1/cloud/meus", { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { cloudN = d && d.terrenos ? d.terrenos.length : 0; if (cloudN) actualizar(); })
        .catch(function () {});
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
