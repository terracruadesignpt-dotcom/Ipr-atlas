/* IPR Atlas · Plantas do PDM da câmara (cópia IPR do SNIT da DGT). Terracrua Design.
   Nuno, 24/11/2026, 12h23: «As plantas do PDM [...] têm que entrar de forma organizada nas camadas do Atlas. Eu não quero ver
   ali milhares de cenas, tem que ser tudo [recolhido]».
   Uma só entrada no topo das camadas, «Plantas do PDM da câmara», fechada por omissão. Ligada, o Atlas vê em que concelho está o
   centro do mapa (CAOP, pela rota do site /tcd/v1/pedido-produto/caop), lê camadas.terracruadesign.pt/snit/<DICO>/servico.json
   (copiado pelo fluxo dados-snit-pdm) e mostra só as plantas dessa câmara, em dois grupos recolhidos (Ordenamento e
   Condicionantes). Uma planta de cada vez, com a legenda da câmara e a opacidade. Muda de concelho sozinho quando o mapa sai dele.
   Mosaicos: PMTiles raster em camadas.terracruadesign.pt/pmtiles/snit/<srv>__<camada>.pmtiles (z12 a z16).
   Câmara ainda não copiada: diz que a cópia está a decorrer e lembra a camada «Ordenamento (PDM)» (CRUS) que já existe.
   Não mexe no viz.js nem no app.js. Mapa: window.__ipe.mapa. API: window.__iprPdmCamara = {ligar(bool), estado()}.
   Desligar: ?pdmcamara=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]pdmcamara=0(&|$)/.test(location.search) || W.__iprPdmCamara) return;
  var R2 = "https://camadas.terracruadesign.pt/";
  var PMT = "https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js";
  var SRC = "ipr-pdmc", LAY = "ipr-pdmc-l";
  var S = { on: false, dico: "", nome: "", srv: "", camadas: [], escolhida: "", op: 0.75, estado: "", ultimoCentro: "" };
  try { var g = JSON.parse(W.localStorage.getItem("ipr_pdmc") || "{}"); S.op = typeof g.op === "number" ? g.op : 0.75; S.preferida = g.pref || ""; } catch (e) {}
  function guardar() { try { W.localStorage.setItem("ipr_pdmc", JSON.stringify({ op: S.op, pref: S.preferida || "" })); } catch (e) {} }
  function en() { return (D.documentElement.lang || "").slice(0, 2) === "en" || /[?&]lang=en/.test(location.search); }
  function t(pt, e) { return en() ? e : pt; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }

  // ---------- protocolo pmtiles (o Atlas pode já o ter registado) ----------
  var pmPronto = null;
  function pmtiles() {
    if (pmPronto) return pmPronto;
    pmPronto = new Promise(function (ok, mau) {
      function reg() { try { if (!W.__iprPmProto) { var p = new W.pmtiles.Protocol(); W.maplibregl.addProtocol("pmtiles", p.tile); W.__iprPmProto = p; } } catch (e) {} ok(); }
      if (W.pmtiles) return reg();
      var s = D.createElement("script"); s.src = PMT; s.onload = reg; s.onerror = function () { pmPronto = null; mau(new Error("pmtiles")); }; D.head.appendChild(s);
    });
    return pmPronto;
  }

  // ---------- concelho no centro do mapa ----------
  var CACHE = {};
  function dicoDe(p) {
    var v = p.dtmnfr || p.DTMNFR || p.dicofre || p.DICOFRE || p.dtmn || p.DTMN || p.cod_freg || "";
    v = String(v).replace(/\D/g, "");
    return v.length >= 4 ? v.slice(0, 4) : "";
  }
  function concelho(lng, lat, cb) {
    var k = lng.toFixed(2) + "," + lat.toFixed(2);
    if (CACHE[k]) return cb(CACHE[k]);
    var d = 0.002, bb = [lng - d, lat - d, lng + d, lat + d].map(function (x) { return x.toFixed(5); }).join(",");
    fetch("/wp-json/tcd/v1/pedido-produto/caop?bbox=" + bb, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      var f = j && j.features && j.features[0], p = (f && f.properties) || {};
      var r = { dico: dicoDe(p), nome: p.municipio || p.concelho || p.Concelho || p.Municipio || "" };
      CACHE[k] = r; cb(r);
    }).catch(function () { cb({ dico: "", nome: "" }); });
  }

  // ---------- plantas da câmara ----------
  var SERV = {};
  function servico(dico, cb) {
    if (SERV[dico] !== undefined) return cb(SERV[dico]);
    fetch(R2 + "snit/" + dico + "/servico.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      SERV[dico] = j && j.srv && j.camadas && j.camadas.length ? j : null; cb(SERV[dico]);
    }).catch(function () { SERV[dico] = null; cb(null); });
  }
  function grupo(nome) { return /condicionant/i.test(nome) ? "cond" : "ord"; }
  function rotulo(nome) {
    return String(nome).replace(/^Planta\s+de\s+(Ordenamento|Condicionantes)\s*[-–]?\s*/i, "").replace(/^[\dIVX.]+\s*[-–]\s*/, "").trim() || nome;
  }
  function escolherInicial() {
    if (!S.camadas.length) return "";
    var pref = S.preferida || "";
    var c = S.camadas.filter(function (x) { return pref && x[0].indexOf(pref) >= 0; })[0]
      || S.camadas.filter(function (x) { return /Classifica|Qualifica/i.test(x[0]); })[0]
      || S.camadas.filter(function (x) { return grupo(x[1]) === "ord"; })[0] || S.camadas[0];
    return c[0];
  }

  // ---------- desenho ----------
  function tirar() {
    var I = mapa(); if (!I) return;
    try { if (I.getLayer(LAY)) I.removeLayer(LAY); } catch (e) {}
    try { if (I.getSource(SRC)) I.removeSource(SRC); } catch (e) {}
  }
  function desenhar() {
    var I = mapa(); if (!I || !I.getStyle) return;
    tirar();
    if (!S.on || !S.srv || !S.escolhida) return;
    pmtiles().then(function () {
      var I2 = mapa(); if (!I2) return;
      try {
        I2.addSource(SRC, { type: "raster", url: "pmtiles://" + R2 + "pmtiles/snit/" + S.srv + "__" + S.escolhida + ".pmtiles", tileSize: 256,
          attribution: "Plantas do PDM: Câmara Municipal / DGT · SNIT (cópia IPR)" });
        I2.addLayer({ id: LAY, type: "raster", source: SRC, minzoom: 10, paint: { "raster-opacity": S.op, "raster-resampling": "nearest" } });
      } catch (e) {}
    }).catch(function () { S.estado = t("Não foi possível carregar o leitor de mosaicos.", "Could not load the tile reader."); pintar(); });
  }

  // ---------- painel ----------
  var CSS = "#ipr-pdmc{margin:0 0 10px;border:1px solid rgba(148,190,57,.35);border-radius:8px;background:rgba(20,26,16,.55);color:#e9e6da;font:13px/1.45 Inter,system-ui,sans-serif}" +
    "#ipr-pdmc>summary{list-style:none;cursor:pointer;padding:9px 12px;display:flex;align-items:center;gap:8px;font-weight:600}" +
    "#ipr-pdmc>summary::-webkit-details-marker{display:none}#ipr-pdmc>summary:before{content:'';width:8px;height:8px;background:#94BE39;clip-path:polygon(100% 0,100% 100%,0 100%);transition:transform .2s}" +
    "#ipr-pdmc[open]>summary:before{transform:rotate(45deg)}#ipr-pdmc .c{padding:0 12px 12px}#ipr-pdmc label{display:flex;gap:8px;align-items:flex-start;margin:4px 0;cursor:pointer}" +
    "#ipr-pdmc details{margin:6px 0;border-top:1px solid rgba(255,255,255,.08);padding-top:6px}#ipr-pdmc details summary{cursor:pointer;font-weight:600;color:#cfe3a0}" +
    "#ipr-pdmc .es{color:#b9bda8;font-size:12px;margin:6px 0}#ipr-pdmc img{max-width:100%;background:#fff;border-radius:4px;margin-top:6px}" +
    "#ipr-pdmc input[type=range]{width:100%}#ipr-pdmc small{color:#9a9e8a;display:block;margin-top:8px}";
  function pintar() {
    var d = D.getElementById("ipr-pdmc"); if (!d) return;
    var c = d.querySelector(".c"); if (!c) return;
    if (W.IPR_NIVEL === "explorer") {
      c.innerHTML = "<small>" + t("As plantas do PDM de cada câmara fazem parte do IPR Atlas Intelligence (condicionantes). Membros da Ordem dos Engenheiros: regenerativo.pt/ordem-dos-engenheiros.",
        "Municipal PDM plans are part of IPR Atlas Intelligence (constraints).") + "</small>";
      return;
    }
    var h = '<label><input type="checkbox" data-pdmc="on"' + (S.on ? " checked" : "") + "> <span>" + t("Mostrar a planta da câmara onde está o mapa", "Show the plan of the municipality in view") + "</span></label>";
    if (S.on) {
      if (S.estado) h += '<div class="es">' + esc(S.estado) + "</div>";
      if (S.camadas.length) {
        ["ord", "cond"].forEach(function (gr) {
          var l = S.camadas.filter(function (x) { return grupo(x[1]) === gr; }); if (!l.length) return;
          var aberto = l.some(function (x) { return x[0] === S.escolhida; });
          h += "<details" + (aberto ? " open" : "") + "><summary>" + (gr === "ord" ? t("Planta de Ordenamento", "Zoning plan") : t("Planta de Condicionantes", "Constraints plan")) + " (" + l.length + ")</summary>";
          l.forEach(function (x) { h += '<label><input type="radio" name="ipr-pdmc-r" data-pdmc-c="' + esc(x[0]) + '"' + (x[0] === S.escolhida ? " checked" : "") + "> <span>" + esc(rotulo(x[1])) + "</span></label>"; });
          h += "</details>";
        });
        h += '<label style="display:block">' + t("Opacidade", "Opacity") + ' <input type="range" min="0.2" max="1" step="0.05" value="' + S.op + '" data-pdmc="op"></label>';
        if (S.escolhida) h += '<img alt="' + esc(t("Legenda da planta", "Plan legend")) + '" src="' + esc(R2 + "snit/" + S.srv + "/" + S.escolhida + "/leg.png") + '" onerror="this.remove()">';
        h += "<small>" + t("Fonte: Câmara Municipal, plantas do PDM publicadas no SNIT (DGT), copiadas pelo IPR. Informação indicativa: não substitui as plantas oficiais nem a consulta à câmara.",
          "Source: Municipality, PDM plans published on SNIT (DGT), copied by IPR. Indicative only.") + "</small>";
      }
    } else {
      h += "<small>" + t("Uma câmara de cada vez: ao ligar, aparecem só as plantas do concelho onde está o mapa, e mudam sozinhas quando muda de concelho.",
        "One municipality at a time: only the plans of the municipality in view appear, and they change by themselves.") + "</small>";
    }
    c.innerHTML = h;
  }
  function bloco() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("ipr-pdmc")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("details"); d.id = "ipr-pdmc";
    d.innerHTML = "<summary>" + t("Plantas do PDM da câmara", "Municipal PDM plans") + '</summary><div class="c"></div>';
    cam.insertBefore(d, cam.firstChild);
    d.addEventListener("change", function (e) {
      var x = e.target;
      if (x.getAttribute("data-pdmc") === "on") { ligar(x.checked); return; }
      if (x.getAttribute("data-pdmc-c")) { S.escolhida = x.getAttribute("data-pdmc-c"); S.preferida = rotulo(S.escolhida).slice(0, 12); guardar(); desenhar(); pintar(); }
    });
    d.addEventListener("input", function (e) {
      var x = e.target; if (x.getAttribute("data-pdmc") !== "op") return;
      S.op = parseFloat(x.value) || 0.75; guardar();
      var I = mapa(); try { if (I && I.getLayer(LAY)) I.setPaintProperty(LAY, "raster-opacity", S.op); } catch (er) {}
    });
    pintar();
    return true;
  }

  // ---------- seguir o mapa ----------
  function actualizar() {
    var I = mapa(); if (!S.on || !I) return;
    if (I.getZoom() < 10) { S.estado = t("Aproxime o mapa a um concelho (zoom 10 ou mais).", "Zoom in to a municipality (zoom 10+)."); pintar(); return; }
    var c = I.getCenter(), k = c.lng.toFixed(2) + "," + c.lat.toFixed(2);
    if (k === S.ultimoCentro && S.dico) return; S.ultimoCentro = k;
    concelho(c.lng, c.lat, function (r) {
      if (!r.dico) { S.estado = t("Fora do continente ou concelho por identificar.", "Outside mainland Portugal or municipality not found."); S.dico = ""; S.camadas = []; S.srv = ""; tirar(); pintar(); return; }
      if (r.dico === S.dico) return;
      S.dico = r.dico; S.nome = r.nome;
      servico(r.dico, function (j) {
        if (r.dico !== S.dico) return;
        if (!j) {
          S.srv = ""; S.camadas = []; S.escolhida = ""; tirar();
          S.estado = (r.nome ? r.nome + ": " : "") + t("as plantas desta câmara ainda estão a ser copiadas do SNIT. Entretanto, use a camada «Ordenamento (PDM)».",
            "this municipality's plans are still being copied. Meanwhile use the «Zoning (PDM)» layer.");
        } else {
          S.srv = j.srv; S.camadas = j.camadas; S.escolhida = escolherInicial();
          S.estado = (r.nome || t("Concelho ", "Municipality ") + r.dico) + " · " + j.camadas.length + " " + t("plantas", "plans");
          desenhar();
        }
        pintar();
      });
    });
  }
  function ligar(v) {
    S.on = !!v;
    if (!S.on) { tirar(); S.estado = ""; pintar(); return; }
    S.dico = ""; S.ultimoCentro = ""; pintar(); actualizar();
  }
  var preso = false;
  function prender() {
    var I = mapa(); if (!I || preso) return !!preso;
    preso = true;
    var tmp = null;
    I.on("moveend", function () { clearTimeout(tmp); tmp = setTimeout(actualizar, 400); });
    I.on("styledata", function () { if (S.on && S.srv && !I.getLayer(LAY)) setTimeout(desenhar, 50); });
    return true;
  }
  (function vez(n) { var a = false, b = false; try { a = bloco(); b = prender(); } catch (e) {} if (a && b) return; if (n < 200) setTimeout(function () { vez(n + 1); }, 150); })(0);
  setInterval(function () { try { bloco(); } catch (e) {} }, 3000);
  W.__iprPdmCamara = { ligar: ligar, estado: function () { return JSON.parse(JSON.stringify(S)); } };
})();
