/* IPR Atlas · «O meu terreno» e barra da esquerda simplificada (pedido do Nuno, 20/10/2026, 17h27).
   1. No topo da barra da esquerda, um cartão destacado:
      - sem sessão: «Ver o projecto exemplo», «Encomendar a Base do meu terreno», «Entrar»;
      - com sessão: os terrenos da pessoa. Com Base entregue, ligação bem visível «Abrir o meu terreno»
        (/atlas/?mapa=ID). Sem Base entregue, o limite da Base encomendada fica desenhado no mapa e há
        um botão para o ver. Sempre: «Projecto exemplo» e, se houver, «Na IPR Cloud».
   2. Camadas: modo simples por omissão (Fundo, a minha Base, o meu terreno, Relevo, Propriedade, Água,
      Condicionantes); «Mostrar todas as camadas» abre o resto (Fogo, Solo e ocupação, Referência).
      Fica lembrado neste navegador. Locais começa fechado quando está vazio.
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
        return "<li class=\"tme-t\"><b>" + nome + "</b><small>" + esc([t("base_encomendada", "Base encomendada"), m.estado].filter(Boolean).join(": ")) + "</small>" +
          (m.geojson ? "<button type=\"button\" class=\"tme-b tme-b--s\" data-tme=\"ver\" data-id=\"" + esc(m.id) + "\">" + t("ver_limite", "Ver no mapa") + "</button>" : "") + "</li>";
      }).join("") + "</ul>";
    }
    h += "<div class=\"tme-acc\">";
    if (cloud > 0) h += "<button type=\"button\" class=\"tme-b\" data-tme=\"cloud\">" + t("cloud", "Na IPR Cloud") + " (" + cloud + ")</button>";
    h += "<a class=\"tme-b tme-b--s\" href=\"/atlas/?mapa=" + EXEMPLO + "\">" + t("exemplo", "Projecto exemplo") + "</a>";
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
