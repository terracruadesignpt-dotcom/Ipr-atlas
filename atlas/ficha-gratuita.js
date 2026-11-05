/* IPR Atlas · Ficha gratuita da propriedade: visível e com o PDM (05/11/2026). Terracrua Design. Só acrescenta.
   Nuno, 05/11/2026, 12h35: «todas as fichas de propriedade também tenham algumas métricas, as mais interessantes, percentis
   e coisas do género em relação ao PDM»; 12h36: «A ficha [...] gratuita tem que ser bastante visível para qualquer utilizador
   que ainda não tem conta e que tem conta [...] quando seleciona a coisa, cria-se um local [...] ficha gratuita da propriedade».
   1. Visível: quando há terreno escolhido (parcelas do cadastro, desenho ou ficheiro; secção #ipe-res do app.js), aparece
      um botão destacado «Ficha gratuita da propriedade» sobre o mapa e dentro da secção. Ao carregar, a ficha é calculada
      ali (IPRDiag.calcular, o mesmo cálculo dos cartões), sem conta e sem guardar o terreno.
   2. Em todas as fichas (esta e a dos cartões dos projectos) junta «PDM e números do terreno»:
      - classes da carta de ordenamento (CRUS, DGT, OGC API pública) medidas dentro do limite: % e ha por designação, classe
        (solo rústico ou urbano), concelho, data de origem e situação;
      - percentis do relevo dentro do terreno (P10, mediana, P90 da altitude e do declive; área acima de 25 % e de 15 %);
      - nos projectos da própria pessoa, com sessão: as regras do PDM que o servidor já entrega pela rota que existe
        (/tcd/v1/meus-mapas?tcd_pdm=<id>, m90711): índice × área, área máxima, prédio mínimo comparado com o terreno, artigo
        e confiança. A tabela de regras não está neste ficheiro nem neste repositório.
      Fecho: «Quem decide é a Câmara, pelo Pedido de Informação Prévia (PIP).»
   4. 3D no cartão aberto pelas linhas finas e secção do PDM também na ficha da equipa (.ipr-ficha-out), 05/11, 13h38.
   5. «Partilhar esta ficha»: /atlas/?ficha=<limite> abre o Atlas com o terreno e a ficha (05/11, 15h58).
   Desligar: ?fgrat=0 ou localStorage ipr_fgrat_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]fgrat=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_fgrat_off") === "1") return; } catch (e) {}
  if (W.__iprFGrat) return; W.__iprFGrat = 1;

  var OGC = "https://ogcapi.dgterritorio.gov.pt/collections/";
  var DEM = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp";
  var FECHO = "Quem decide é a Câmara, pelo Pedido de Informação Prévia (PIP).";
  function en() { return (W.IPR_LINGUA || "pt") === "en"; }
  function n(v, c) { return Number(v).toLocaleString("pt-PT", { minimumFractionDigits: c || 0, maximumFractionDigits: c == null ? 2 : c }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function semAc(s) { return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9;]+/g, " ").replace(/\s+/g, " ").replace(/^[ ;]+|[ ;]+$/g, ""); }
  function linha(a, b) { return "<tr><td>" + esc(a) + "</td><td>" + b + "</td></tr>"; }
  function tempo(p, ms) { return Promise.race([p, new Promise(function (r, j) { setTimeout(function () { j(new Error("tempo")); }, ms); })]); }

  // ---------- geometria em Web Mercator ----------
  function mx(l) { return (l + 180) / 360; }
  function my(f) { var a = f * Math.PI / 180; return (1 - Math.log(Math.tan(a) + 1 / Math.cos(a)) / Math.PI) / 2; }
  function polis(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
  function fc(g) {
    if (!g) return null;
    if (g.type === "FeatureCollection") return g;
    if (g.type === "Feature") return { type: "FeatureCollection", features: [g] };
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: g }] };
  }
  function bbox(F) {
    var b = [180, 90, -180, -90];
    F.features.forEach(function (f) { polis(f.geometry).forEach(function (p) { p.forEach(function (r) { r.forEach(function (c) {
      if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; }); }); }); });
    return b[2] > b[0] ? b : null;
  }
  function grelha(b, lado) {
    var x0 = mx(b[0]), x1 = mx(b[2]), y0 = my(b[3]), y1 = my(b[1]), w = x1 - x0, h = y1 - y0, m = 0.02 * Math.max(w, h);
    x0 -= m; y0 -= m; w += 2 * m; h += 2 * m;
    var Wp = w >= h ? lado : Math.max(8, Math.round(lado * w / h)), Hp = w >= h ? Math.max(8, Math.round(lado * h / w)) : lado;
    var lat = (b[1] + b[3]) / 2;
    return { x0: x0, y0: y0, w: w, h: h, W: Wp, H: Hp, pxM: w / Wp * 40075016.686 * Math.cos(lat * Math.PI / 180) };
  }
  function pinta(G, geoms) {
    var c = D.createElement("canvas"); c.width = G.W; c.height = G.H;
    var x = c.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#000";
    // Cada polígono pintado à parte (furos com evenodd dentro dele); polígonos repetidos ou sobrepostos somam-se, não se anulam.
    geoms.forEach(function (g) { polis(g).forEach(function (p) { x.beginPath(); p.forEach(function (r) { r.forEach(function (q, i) {
      var px = (mx(q[0]) - G.x0) / G.w * G.W, py = (my(q[1]) - G.y0) / G.h * G.H; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); }); x.fill("evenodd"); }); });
    var d = x.getImageData(0, 0, G.W, G.H).data, m = new Uint8Array(G.W * G.H);
    for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
    return m;
  }
  function conta(a, b) { var k = 0; for (var i = 0; i < a.length; i++) if (a[i] && (!b || b[i])) k++; return k; }

  // ---------- PDM: classes da CRUS dentro do limite ----------
  function crus(F, b, G, M, tot) {
    var u = OGC + "crus/items?f=json&limit=500&bbox=" + b.map(function (v) { return v.toFixed(6); }).join(",");
    return tempo(fetch(u, { headers: { Accept: "application/geo+json, application/json" } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), 25000).then(function (j) {
      var gr = {};
      (j.features || []).forEach(function (f) {
        var p = f.properties || {}, d = p.designacao_no_plano || p.categoria_2021 || ""; if (!d || !f.geometry) return;
        var k = d + "|" + (p.municipio || "");
        (gr[k] || (gr[k] = { designacao: d, classe: p.classe_2021 || "", categoria: p.categoria_2021 || "", municipio: p.municipio || "", situacao: p.situacao_pdm || "",
          data: String(p.data_pub_origem || "").slice(0, 10).replace(/\//g, "-"), escala: p.escala_origem || "", geoms: [] })).geoms.push(f.geometry);
      });
      var out = [], cls = {};
      Object.keys(gr).forEach(function (k) {
        var g = gr[k], c = conta(M, pinta(G, g.geoms)); if (!c) return;
        g.pct = Math.round(1000 * c / tot) / 10; g.ha = c * G.pxM * G.pxM / 1e4; delete g.geoms;
        if (g.pct >= 0.1) out.push(g);
        if (g.classe) cls[g.classe] = (cls[g.classe] || 0) + g.pct;
      });
      out.sort(function (a, z) { return z.pct - a.pct; });
      var soma = out.reduce(function (s, g) { return s + g.pct; }, 0);
      var mu = {};
      out.forEach(function (g) { var k = g.municipio; if (!mu[k]) mu[k] = { nome: k.toLowerCase().replace(/(^|[\s-])(\S)/g, function (a, b, c) { return b + c.toUpperCase(); }).replace(/ (De|Do|Da|Dos|Das|E) /g, function (a) { return a.toLowerCase(); }), pct: 0, data: g.data, situacao: g.situacao }; mu[k].pct += g.pct; });
      return { muns: Object.keys(mu).map(function (k) { return mu[k]; }).sort(function (a, z) { return z.pct - a.pct; }), classes: out, solo: Object.keys(cls).map(function (k) { return { l: k, pct: Math.round(10 * Math.min(100, cls[k])) / 10 }; }).sort(function (a, z) { return z.pct - a.pct; }), coberto: Math.min(100, Math.round(soma)) };
    });
  }

  // ---------- Relevo: percentis dentro do terreno ----------
  function relevo(F, b) {
    var x0 = mx(b[0]), x1 = mx(b[2]), y0 = my(b[3]), y1 = my(b[1]), z;
    for (z = 15; z >= 8; z--) { var N = Math.pow(2, z); if ((x1 - x0) * N * 512 <= 1100 && (y1 - y0) * N * 512 <= 1100) break; }
    var N2 = Math.pow(2, z), tx0 = Math.floor(x0 * N2), tx1 = Math.floor(x1 * N2), ty0 = Math.floor(y0 * N2), ty1 = Math.floor(y1 * N2);
    var G = { x0: tx0 / N2, y0: ty0 / N2, w: (tx1 - tx0 + 1) / N2, h: (ty1 - ty0 + 1) / N2, W: (tx1 - tx0 + 1) * 512, H: (ty1 - ty0 + 1) * 512 };
    G.pxM = G.w / G.W * 40075016.686 * Math.cos(((b[1] + b[3]) / 2) * Math.PI / 180);
    var c = D.createElement("canvas"); c.width = G.W; c.height = G.H; var x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false;
    var ts = []; for (var i = tx0; i <= tx1; i++) for (var j = ty0; j <= ty1; j++) ts.push([i, j]);
    if (ts.length > 9) return Promise.resolve(null);
    return Promise.all(ts.map(function (t) {
      return tempo(fetch(DEM.replace("{z}", z).replace("{x}", t[0]).replace("{y}", t[1])).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(createImageBitmap), 20000)
        .then(function (im) { x.drawImage(im, (t[0] - tx0) * 512, (t[1] - ty0) * 512, 512, 512); }).catch(function () {});
    })).then(function () {
      var M = pinta(G, F.features.map(function (f) { return f.geometry; })), d = x.getImageData(0, 0, G.W, G.H).data, Wp = G.W, a = new Float32Array(Wp * G.H), ok = new Uint8Array(Wp * G.H);
      for (var k = 0; k < a.length; k++) if (d[k * 4 + 3] === 255) { a[k] = 256 * d[k * 4] + d[k * 4 + 1] + d[k * 4 + 2] / 256 - 32768; ok[k] = a[k] > -500 && a[k] < 3000 ? 1 : 0; }
      var alt = [], dec = [];
      for (var yy = 1; yy < G.H - 1; yy++) for (var xx = 1; xx < Wp - 1; xx++) {
        var q = yy * Wp + xx; if (!M[q] || !ok[q]) continue; alt.push(a[q]);
        if (ok[q - 1] && ok[q + 1] && ok[q - Wp] && ok[q + Wp]) { var sx = (a[q + 1] - a[q - 1]) / (2 * G.pxM), sy = (a[q + Wp] - a[q - Wp]) / (2 * G.pxM), s = 100 * Math.sqrt(sx * sx + sy * sy); if (s < 400) dec.push(s); }
      }
      if (alt.length < 4) return null;
      function pc(v, p) { var s = v.slice().sort(function (m, o) { return m - o; }); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; }
      function acima(v, l) { var k = 0; v.forEach(function (s) { if (s > l) k++; }); return v.length ? Math.round(1000 * k / v.length) / 10 : null; }
      return { alt: [pc(alt, 0.1), pc(alt, 0.5), pc(alt, 0.9)], dec: dec.length ? [pc(dec, 0.1), pc(dec, 0.5), pc(dec, 0.9)] : null,
        d25: acima(dec, 25), d15: acima(dec, 15), res: Math.round(G.pxM * 10) / 10 };
    });
  }

  // ---------- Regras do PDM (só projectos da própria pessoa, vindas do servidor) ----------
  function regras(id) {
    if (!id || !W.tcdNonce) return Promise.resolve(null);
    return tempo(fetch("/wp-json/tcd/v1/meus-mapas?tcd_pdm=" + encodeURIComponent(id), { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } }).then(function (r) { return r.ok ? r.json() : null; }), 30000)
      .then(function (d) {
        var it = null; if (!d) return null;
        ["mapas", "partilhados", "rever"].forEach(function (k) { (d[k] || []).forEach(function (x) { if (!it && x && String(x.encomenda || x.id) === String(id)) it = x; }); });
        return it && it.pdm_regras || null;
      }).catch(function () { return null; });
  }
  function mostra(p, cf, un) {
    if (!p) return null; var c = p.conf || cf || "baixa"; if (c === "baixa") return "confirmar no regulamento";
    var t = p.v != null ? (un === "i" ? String(+(+p.v).toFixed(4)).replace(".", ",") : n(p.v)) + (un && un !== "i" ? un : "") + (p.tipo ? " (" + p.tipo + ")" : "") : (p.tipo || p.txt || "");
    return t + (c === "media" ? " · confiança média" : "");
  }
  function htmlRegras(P, C, areaHa) {
    if (!P || !P.concelhos) return "";
    var med = {}, mun = {}; (C && C.classes || []).forEach(function (g) { med[semAc(g.designacao) + "|" + semAc(g.municipio)] = g; mun[semAc(g.municipio)] = 1; });
    var h = "";
    P.concelhos.forEach(function (g) {
      var gm = semAc(g.municipio); if (C && C.classes.length && !mun[gm]) return; // concelho vizinho que só toca o envolvente
      if (g.estado === "em_preparacao") { h += '<p class="ipe-small">' + esc(g.municipio) + ": regras deste concelho ainda em preparação.</p>"; return; }
      var v = g.em_vigor || {};
      h += '<p class="ipe-small"><b>PDM de ' + esc(g.concelho) + "</b>: " + esc(v.diploma || "diploma por confirmar") + (g.alteracoes ? " · " + g.alteracoes + (g.alteracoes === 1 ? " alteração" : " alterações") : "") + "</p>";
      if (g.estado === "indicativo") { h += '<p class="ipe-small mau">O PDM foi revisto e a carta de ordenamento ainda tem o plano anterior: classes só indicativas. ' + esc(g.crus_nota || "") + "</p>"; return; }
      var rows = "";
      (g.classes || []).forEach(function (c) {
        var m = med[semAc(c.designacao) + "|" + gm]; if (!m) return;
        (c.regras || []).forEach(function (r) {
          if (r.conf === "baixa") { rows += linha(c.designacao, "valores a confirmar no regulamento <small>" + esc(r.artigos && r.artigos.length ? "art. " + r.artigos.join(", ") : "") + "</small>"); return; }
          [["hab", "Habitação"], ["apoio", "Apoio agrícola"], ["tur", "Turismo"]].forEach(function (u) {
            var s = r[u[0]]; if (!s) return; var cel = [];
            var p = s.indice, base = m.pct >= 99.5 ? areaHa * 1e4 : m.ha * 1e4;
            if (p && p.v != null && (p.conf || r.conf) !== "baixa" && p.v > 0 && p.v <= 3 && !/impermeab/i.test(p.tipo || "")) {
              var calc = p.v * base, am = s.area_max_m2, lim = am && am.v != null && (am.conf || r.conf) !== "baixa" && calc > am.v;
              cel.push("até " + n(lim ? am.v : calc, 0) + " m² de " + (/implant|ocupa/i.test(p.tipo || "") ? "implantação" : "construção") + " <small>índice " + mostra(p, r.conf, "i") + " × " + n(base / 1e4, 2) + " ha" + (lim ? ", limitado pela área máxima" : "") + "</small>");
            } else if (s.area_max_m2) { var t = mostra(s.area_max_m2, r.conf, " m²"); if (t) cel.push("área máxima " + t); }
            var pm = s.predio_min_ha;
            if (pm && pm.v != null && (pm.conf || r.conf) !== "baixa") cel.push((areaHa >= pm.v ? "cumpre o" : "<b>abaixo do</b>") + " prédio mínimo de " + n(pm.v, 2) + " ha" + (areaHa < 2 * pm.v ? " <small>(o terreno tem " + Math.round(100 * areaHa / pm.v) + " % do mínimo)</small>" : ""));
            var ps = mostra(s.pisos, r.conf, ""); if (ps && ps !== "confirmar no regulamento") cel.push("pisos: " + ps);
            if (s.condicao_agricultor === true) cel.push("exige a condição de agricultor");
            if (cel.length) rows += linha(u[1] + " · " + c.designacao, cel.join("<br>") + "<small>" + esc(r.artigos && r.artigos.length ? "art. " + r.artigos.join(", ") : "artigo por confirmar") + " · confiança " + esc(r.conf === "media" ? "média" : r.conf) + "</small>");
          });
        });
      });
      if (rows) h += '<table class="ipe-tab2 ipe-res-t"><tbody>' + rows + "</tbody></table>";
      var av = [];
      [["suspensoes", "Suspensão"], ["medidas_preventivas", "Medidas preventivas"], ["normas_provisorias", "Normas provisórias"]].forEach(function (k) { (g[k[0]] || []).forEach(function (x) { av.push(k[1] + ": " + (x.diploma || "") + (x.texto ? ", " + x.texto : "")); }); });
      if (g.crus_nota) av.push(g.crus_nota);
      if (av.length) h += '<p class="ipe-small mau">' + esc(av.slice(0, 4).join(" · ")) + "</p>";
    });
    return h;
  }

  // ---------- Secção «PDM e números do terreno» ----------
  function medir(F) {
    var b = bbox(F); if (!b) return null;
    var G = grelha(b, 700), M = pinta(G, F.features.map(function (f) { return f.geometry; })), tot = conta(M);
    if (!tot) return null;
    return { b: b, G: G, M: M, tot: tot, areaHa: tot * G.pxM * G.pxM / 1e4 };
  }
  function extras(F, id) {
    var m = medir(F); if (!m) return Promise.resolve(null);
    return Promise.all([crus(F, m.b, m.G, m.M, m.tot).catch(function () { return null; }), relevo(F, m.b).catch(function () { return null; }), regras(id)])
      .then(function (r) { return { C: r[0], R: r[1], P: r[2], areaHa: m.areaHa }; });
  }
  function htmlSeccao(X, id) {
    var C = X.C, R = X.R, P = X.P, areaHa = X.areaHa, h = "<h4>PDM e números do terreno</h4>";
    if (C && C.classes.length) {
      h += '<table class="ipe-tab2 ipe-res-t"><tbody>' +
        linha(C.muns.length > 1 ? "Concelhos" : "Concelho", C.muns.map(function (m) { return esc(m.nome) + (C.muns.length > 1 ? " " + n(m.pct, 1) + " %" : "") + "<small>carta de ordenamento de " + esc(m.data || "data por confirmar") + (m.situacao ? " · " + esc(m.situacao) : "") + "</small>"; }).join("")) +
        (C.solo.length ? linha("Classe do solo", C.solo.map(function (s) { return esc(s.l) + " " + n(s.pct, 1) + " %"; }).join("<br>")) : "") +
        C.classes.slice(0, 6).map(function (g) { return linha(g.designacao, n(g.pct, 1) + " % <small>" + n(g.ha, g.ha < 1 ? 2 : 1) + " ha" + (g.categoria && g.categoria !== g.designacao ? " · " + esc(g.categoria) : "") + "</small>"); }).join("") +
        "</tbody></table>";
      if (C.coberto < 95) h += '<p class="ipe-small">A carta de ordenamento cobre cerca de ' + C.coberto + " % do terreno; o resto pode ser outra classe ou estar fora da carta.</p>";
      if (C.classes.length > 1) h += '<p class="ipe-small">O terreno tem ' + C.classes.length + " classes do PDM: as regras aplicam-se a cada parte.</p>";
    } else {
      h += '<p class="ipe-small">' + (C ? "A carta de ordenamento (CRUS) não tem classe neste limite." : "O serviço da carta de ordenamento (CRUS, DGT) não respondeu agora.") + "</p>";
    }
    if (P) h += htmlRegras(P, C, areaHa);
    else h += '<p class="ipe-small">' + (id && W.tcdNonce ? "Regras do PDM deste concelho: ainda sem resposta." : "Os índices, o prédio mínimo e os artigos do regulamento para estas classes estão na Leitura Territorial e na Planta de Localização" + (W.tcdNonce ? " (guarde o terreno e abra a ficha no cartão do projecto para os ver aqui)." : ".")) + "</p>";
    if (R) {
      h += '<table class="ipe-tab2 ipe-res-t"><tbody>' +
        linha("Área medida", n(areaHa, areaHa < 1 ? 3 : 2) + " ha <small>" + n(areaHa * 1e4, 0) + " m²</small>") +
        linha("Altitude (P10 · mediana · P90)", n(R.alt[0], 0) + " · " + n(R.alt[1], 0) + " · " + n(R.alt[2], 0) + " m") +
        (R.dec ? linha("Declive (P10 · mediana · P90)", n(R.dec[0], 1) + " · " + n(R.dec[1], 1) + " · " + n(R.dec[2], 1) + " %") : "") +
        (R.d15 != null ? linha("Área com declive acima de 15 %", n(R.d15, 1) + " %") : "") +
        (R.d25 != null ? linha("Área com declive acima de 25 %", n(R.d25, 1) + " % <small>declives fortes pesam na REN (áreas de elevado risco de erosão) e na implantação</small>") : "") +
        "</tbody></table><p class=\"ipe-small\">P10 e P90: 10 % do terreno fica abaixo e 10 % acima desses valores. Modelo de elevação com cerca de " + n(R.res, 0) + " m por pixel; a Base Cartográfica usa o LiDAR da DGT, muito mais fino.</p>";
    }
    h += '<p class="ipe-small"><b>' + FECHO + "</b> Fonte: carta de regimes de uso do solo (CRUS, DGT, OGC API); regulamentos do PDM publicados em Diário da República e depositados no SNIT; relevo Mapterhorn.</p>";
    return h;
  }
  function seccao(geo, id, alvo, pronto) {
    var F = fc(geo); if (!F) return;
    var caixa = D.createElement("div"); caixa.className = "ipr-fg-pdm";
    caixa.innerHTML = '<h4>PDM e números do terreno</h4><p class="ipe-small">A medir a carta de ordenamento e o relevo dentro do limite…</p>';
    var nota = alvo.querySelector(".ipe-nota"); if (nota) alvo.insertBefore(caixa, nota); else alvo.appendChild(caixa);
    (pronto || extras(F, id)).then(function (X) { if (!X) { caixa.remove(); return; } caixa.innerHTML = htmlSeccao(X, id); });
  }

  // ---------- Ficha gratuita em cartões (Nuno, 05/11/2026, 15h10: «tem que ser uma cena super cativante [...] dar aquelas
  // métricas todas que as pessoas querem ver [...] e depois quando já tem uma base [...] pedir planta de localização, leitura
  // territorial, base cartográfica»). Abre sozinha ao escolher o terreno; os quadros completos ficam em «Ver todos os dados». ----------
  function tom(v, a, b) { return v == null ? "" : v >= a ? "alto" : v >= b ? "medio" : "ok"; }
  function cartao(k, t, v, f, cl) { return '<div class="ipr-c ' + (cl || "") + '" data-c="' + k + '"><span class="ipr-c-t">' + t + '</span><b class="ipr-c-v">' + v + '</b><span class="ipr-c-f">' + f + "</span></div>"; }
  function pct(v) { return v == null || typeof v !== "number" ? "—" : n(v, v < 10 ? 1 : 0) + " %"; }
  // Preços e compra pelos caminhos que já existem (05/11, 15h50, Nuno: «Tudo tem que bater certo [...] estar tudo ligado.
  // Não podemos perder clientes, nem dificultar a entrada nem a compra»): Base e Leitura com o preço que o próprio Atlas
  // calcula para este terreno (#ipe-preco, #ipe-preco-l, com a promoção do promo.js); Planta com window.IPR_PRECOS
  // (m90550, 19 €); a compra segue pelo assistente (assistente.js, window.iprAssistenteComprar: Planta e Leitura sem conta
  // pelo m90590, Base com conta pelo formulário de encomenda). Visita técnica: produto 14533 da loja.
  function precoDom(id) { var x = D.getElementById(id); var t = x && (x.textContent || "").trim(); return t && /\d/.test(t) ? t : ""; }
  function escada() {
    var P = W.IPR_PRECOS || {}, pl = P.planta && P.planta.preco ? n(P.planta.preco, 0) + " €" : "";
    var pb = precoDom("ipe-preco") || (P.base && P.base.desde ? "desde " + n(P.base.desde, 0) + " €" : "");
    var plt = precoDom("ipe-preco-l") || (P.leitura && P.leitura.desde ? "desde " + n(P.leitura.desde, 0) + " €" : "");
    function li(k, tit, txt, preco, bt, pri) {
      return '<li' + (pri ? ' class="ipr-fn2-pri"' : "") + '><div><b>' + tit + (preco ? ' <em class="ipr-fn2-pr" data-pr="' + k + '">' + esc(preco) + "</em>" : "") + "</b><span>" + txt + "</span></div>" + bt + "</li>";
    }
    function bt(k, rot, ac) { return '<button type="button" class="ipe-b' + (ac ? " ipe-b--ac" : "") + '" data-fg-compra="' + k + '">' + rot + "</button>"; }
    return '<div class="ipr-fn2-esc"><h4>O que pode fazer neste terreno</h4><ol>' +
      li("planta", "Planta de Localização", "PDF à escala, em PT-TM06, com o PDM, a REN, a RAN e as coordenadas dos vértices · sem conta", pl, bt("planta", "Comprar")) +
      li("leitura", "Leitura Territorial", "o que o PDM permite, as condicionantes e os riscos, explicado num relatório · sem conta", plt, bt("leitura", "Comprar")) +
      li("base", "Base Cartográfica", "LiDAR da DGT, curvas de nível, 3D do terreno e projecto QGIS pronto a usar", pb, bt("base", "Encomendar", true), true) +
      li("visita", "Visita técnica", "a equipa da Terracrua Design no terreno", "350 €", '<a class="ipe-b" href="/carrinho/?add-to-cart=14533">Marcar</a>') +
      '</ol><p class="ipe-small">Preços sem IVA (23 %), calculados para a área deste terreno. Planta e Leitura compram-se sem conta; a Base pede conta, que se cria no momento.</p></div>';
  }
  D.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("[data-fg-compra]"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    var k = b.getAttribute("data-fg-compra");
    if (typeof W.iprAssistenteComprar === "function" && W.iprAssistenteComprar(k) !== false) return;
    if (k === "base") { var e = D.querySelector('#ipe-res [data-res="enc"]'); if (e) { e.click(); return; } }
    location.href = "/contacto/?tipo=" + encodeURIComponent(k === "planta" ? "Planta de Localização" : k === "leitura" ? "Leitura Territorial" : "Base Cartográfica");
  }, true);
  // os preços do Atlas chegam depois da área: actualiza-os enquanto a ficha está aberta
  setInterval(function () {
    var pb = precoDom("ipe-preco"), pl = precoDom("ipe-preco-l");
    [].forEach.call(D.querySelectorAll('.ipr-fn2-pr[data-pr="base"]'), function (x) { if (pb && x.textContent !== pb) x.textContent = pb; });
    [].forEach.call(D.querySelectorAll('.ipr-fn2-pr[data-pr="leitura"]'), function (x) { if (pl && x.textContent !== pl) x.textContent = pl; });
  }, 1500);
  function htmlCartoes(e, area) {
    var c = e.condicionantes || {}, l = c.natura || {}, r = e.relevo, a = e.agua, f = e.fogo, s = e.solo;
    var fogoT = f ? (/muito alta|alta/i.test(f.predominante) ? "alto" : /m[eé]dia/i.test(f.predominante) ? "medio" : "ok") : "";
    var h = '<div class="ipr-fn2-cab"><div><span class="ipr-fn2-lug" data-lugar>Terreno escolhido</span><b>' + n(area, area < 1 ? 2 : 1) + ' ha</b><small>' + n(area * 1e4, 0) + ' m²</small></div>' +
      '<span class="ipr-fn2-dir"><span class="ipr-fn2-sel">Ficha gratuita · dados públicos</span><button type="button" class="ipe-b ipr-fn2-sh" data-fg-partilhar>Partilhar esta ficha</button></span></div><p class="ipr-fn2-lk" hidden></p><div class="ipr-fn2-g">';
    h += cartao("pdm", "PDM", "…", "a ler a carta de ordenamento", "ipr-c-lg");
    h += cartao("ren", "REN", pct(c.ren), c.ren > 0 ? "Reserva Ecológica: usos condicionados" : "fora da REN", tom(c.ren, 50, 0.5));
    h += cartao("ran", "RAN", pct(c.ran), c.ran > 0 ? "Reserva Agrícola: construção muito restrita" : "fora da RAN", tom(c.ran, 50, 0.5));
    h += cartao("nat", "Natura 2000", pct(l.pct), l.sitios && l.sitios.length ? esc(l.sitios[0]) : (l.pct > 0 ? "área classificada" : "fora da Rede Natura"), tom(l.pct, 50, 0.5));
    h += cartao("dec", "Declive", r && r.declive != null ? n(r.declive, 0) + " %" : "—", "médio; a medir a área íngreme…", r ? tom(r.declive, 25, 12) : "");
    h += cartao("alt", "Altitude", r ? n(r.min, 0) + "–" + n(r.max, 0) + " m" : "—", r ? "média " + n(r.media, 0) + " m" : "", "");
    h += cartao("fogo", "Incêndio", f ? esc(f.predominante) : "—", "perigosidade estrutural 2020–2030", fogoT);
    h += cartao("agua", "Linhas de água", a ? (a.linhas ? n(a.comprimento, 0) + " m" : "nenhuma") : "—", a && a.linhas ? a.linhas + (a.linhas === 1 ? " linha" : " linhas") + " dentro do terreno" : "na rede da APA", "");
    if (s && s.grupos && s.grupos[0]) h += cartao("solo", "Ocupação", s && s.grupos && s.grupos[0] ? esc(s.grupos[0].l) : "—", s && s.grupos && s.grupos[0] ? n(s.grupos[0].p, 0) + " % do terreno · COS 2023" : "", "");
    h += "</div>";
    h += escada();
    h += '<details class="ipr-fn2-mais"><summary>Ver todos os dados</summary>' + htmlBase(e, area) + "</details>";
    return h;
  }
  function encherCartoes(out, X) {
    if (!X) return;
    var C = X.C, R = X.R;
    function por(k, v, f, cl) { var c = out.querySelector('.ipr-c[data-c="' + k + '"]'); if (!c) return; if (v != null) c.querySelector(".ipr-c-v").innerHTML = v; if (f != null) c.querySelector(".ipr-c-f").innerHTML = f; if (cl != null) { c.classList.remove("alto", "medio", "ok"); if (cl) c.classList.add(cl); } }
    if (C && C.classes.length) {
      var g = C.classes[0], rust = C.solo.filter(function (x) { return /r[uú]stico/i.test(x.l); })[0];
      por("pdm", esc(g.designacao.replace(/^Solo R[uú]stico - /i, "")) + " <small>" + n(g.pct, 0) + " %</small>",
        (rust ? "solo rústico " + n(rust.pct, 0) + " %: construção limitada pelas regras do PDM" : "solo urbano: regras do perímetro urbano") + (C.classes.length > 1 ? " · " + C.classes.length + " classes" : ""), rust && rust.pct > 50 ? "medio" : "ok");
      var lug = out.querySelector("[data-lugar]"); if (lug) lug.textContent = C.muns.map(function (m) { return m.nome; }).join(" · ");
    } else por("pdm", "—", C ? "sem classe na carta de ordenamento" : "a carta de ordenamento não respondeu agora", "");
    if (R && R.dec) por("dec", n(R.dec[1], 0) + " %", "mediana · " + n(R.d25, 0) + " % do terreno acima de 25 %", tom(R.d25, 40, 15));
    if (R) por("alt", n(R.alt[0], 0) + "–" + n(R.alt[2], 0) + " m", "mediana " + n(R.alt[1], 0) + " m", null);
  }

  // ---------- 1. Ficha para o terreno escolhido (sem guardar) ----------
  function desenho() {
    var m = W.__ipe && W.__ipe.mapa; if (!m) return null;
    var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") { try { var a = cs[i].getAll(); if (a && a.features) return a; } catch (e) {} }
    return null;
  }
  function terreno() {
    var a = desenho(); if (!a) return null;
    var fs = a.features.filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type); });
    return fs.length ? { type: "FeatureCollection", features: fs } : null;
  }
  function chave(F) { try { return JSON.stringify(F.features.map(function (f) { return f.geometry.coordinates; })).length + ":" + JSON.stringify(bbox(F)); } catch (e) { return ""; } }

  function htmlBase(e, area) {
    var c = e.condicionantes || {}, l = c.natura, r = e.relevo, a = e.agua, f = e.fogo, s = e.solo;
    function pc(v) { return v == null || typeof v !== "number" ? "<i>sem dados agora</i>" : n(v, 1) + " %"; }
    var h = '<div class="ipe-res-r"><h4>Condicionantes</h4><table class="ipe-tab2 ipe-res-t"><tbody>' +
      linha("REN", pc(c.ren)) + linha("RAN", pc(c.ran)) +
      linha("Rede Natura 2000", l ? pc(l.pct) + (l.sitios && l.sitios.length ? "<small>" + esc(l.sitios.join(", ")) + "</small>" : "") : pc(null)) +
      linha("Faixa de 10 m das linhas de água", pc(c.dph) + "<small>estimativa do domínio hídrico</small>") + "</tbody></table>";
    h += "<h4>Relevo</h4>" + (r ? '<table class="ipe-tab2 ipe-res-t"><tbody>' + linha("Altitude", n(r.min, 0) + " a " + n(r.max, 0) + " m <small>média " + n(r.media, 0) + " m</small>") + linha("Declive médio", r.declive != null ? n(r.declive, 1) + " %" : "—") + "</tbody></table>" : '<p class="ipe-small">Sem dados de relevo agora.</p>');
    h += '<h4>Água e fogo</h4><table class="ipe-tab2 ipe-res-t"><tbody>' +
      linha("Linhas de água", a ? (a.linhas ? a.linhas + " <small>cerca de " + n(a.comprimento, 0) + " m dentro do terreno" + (a.ordem ? " · ordem de Strahler até " + a.ordem : "") + "</small>" : "nenhuma na rede da APA") : pc(null)) +
      linha("Perigosidade de incêndio", f ? esc(f.predominante) + " <small>máxima: " + esc(f.maxima) + " · estrutural 2020–2030</small>" : pc(null)) + "</tbody></table>";
    h += "<h4>Solo e ocupação <small>COS 2023</small></h4>" + (s ? '<table class="ipe-tab2 ipe-res-t"><tbody>' + s.grupos.slice(0, 5).map(function (g) { return linha(g.l, n(g.p, 1) + " %"); }).join("") + "</tbody></table>" : '<p class="ipe-small">Sem dados de ocupação agora.</p>');
    h += '<div class="ipe-res-cta"><div class="ipe-acc"><button type="button" class="ipe-b ipe-b--ac ipe-b--s" data-res="enc">Encomendar a Base Cartográfica</button>' +
      '<a class="ipe-b ipe-b--s" href="/contacto/?tipo=' + encodeURIComponent("Leitura Territorial") + '">Pedir a Leitura Territorial deste terreno</a></div></div>';
    h += '<p class="ipe-nota">Dados indicativos de fontes públicas: DGT (SRUP, CRUS, COS 2023), ICNF e APA. Não substituem a Leitura Territorial nem a consulta à Câmara.</p></div>';
    return h;
  }

  var ultimo = "";
  function abrir(auto) {
    var sec = D.getElementById("ipe-res"), F = terreno();
    if (!sec || !F) return;
    var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="enc"]'); if (tab && !tab.classList.contains("on") && sec.offsetParent === null) tab.click();
    var out = sec.querySelector(".ipr-fg-out");
    if (!out) { out = D.createElement("div"); out.className = "ipr-fg-out"; var acc = sec.querySelector(".ipe-acc"); sec.insertBefore(out, acc || null); }
    var k = chave(F);
    if (!auto) setTimeout(function () { try { sec.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }, 120);
    if (k === ultimo && out.children.length) return;
    ultimo = k;
    var bt = sec.querySelector(".ipr-fg-bt"); if (bt) { bt.disabled = true; bt.textContent = "A calcular a ficha…"; }
    out.innerHTML = '<p class="ipe-small">A cruzar o terreno com os dados públicos. Leva cerca de 10 segundos.</p>';
    var b = bbox(F), G = grelha(b, 700), area = conta(pinta(G, F.features.map(function (f) { return f.geometry; }))) * G.pxM * G.pxM / 1e4;
    (W.IPRDiag ? W.IPRDiag.calcular(F) : Promise.reject(new Error("sem IPRDiag"))).then(function (e) {
      if (ultimo !== k) return;
      var X = extras(F, null);
      out.innerHTML = htmlCartoes(e, area);
      X.then(function (x) { if (ultimo === k) encherCartoes(out, x); });
      seccao(F, null, out.querySelector(".ipr-fn2-mais .ipe-res-r"), X);
      if (bt) { bt.disabled = false; bt.textContent = "Actualizar a ficha gratuita"; }
    }).catch(function () {
      out.innerHTML = '<p class="ipe-small mau">Não foi possível preparar a ficha agora. Tente de novo dentro de momentos.</p>';
      if (bt) { bt.disabled = false; bt.textContent = "Ver a ficha gratuita da propriedade"; }
      ultimo = "";
    });
  }
  W.__iprFichaGratuita = abrir;

  var css = D.createElement("style"); css.id = "ipr-fg-css";
  css.textContent =
    "#ipr-fg-flut{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(28px + env(safe-area-inset-bottom,0px));z-index:6;display:none;align-items:center;gap:8px;" +
    "padding:10px 16px;border:0;border-radius:999px;background:#e9a15a;color:#1d1a14;font:700 14px/1.2 Inter,system-ui,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.35);cursor:pointer;white-space:nowrap}" +
    "#ipr-fg-flut small{font-weight:500;opacity:.8}#ipr-fg-flut.on{display:inline-flex}#ipr-fg-flut:hover{filter:brightness(1.06)}" +
    "#ipe-res .ipr-fg-bt{margin:6px 0 10px;width:100%;justify-content:center;font-weight:700}" +
    "#ipe-res .ipr-fg-out:empty{display:none}.ipr-fg-pdm{margin-top:10px}.ipr-fg-pdm h4{margin-top:12px}" +
    "#ipe-res-t.ipr-fg-t{font-size:1.05em}" +
    ".ipr-fn2-cab{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin:4px 0 10px;flex-wrap:wrap}" +
    ".ipr-fn2-cab>div{display:flex;flex-direction:column}.ipr-fn2-lug{font-size:12px;opacity:.8;text-transform:capitalize}" +
    ".ipr-fn2-cab b{font:700 26px/1.1 Outfit,Inter,system-ui,sans-serif}.ipr-fn2-cab small{opacity:.7;font-size:11px}" +
    ".ipr-fn2-sel{font-size:11px;padding:2px 8px;border-radius:99px;background:rgba(233,161,90,.16);color:#e9a15a}" +
    ".ipr-fn2-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:14px}" +
    ".ipr-c{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-left:4px solid rgba(255,255,255,.18);min-width:0}" +
    ".ipr-c.ok{border-left-color:#7fb069}.ipr-c.medio{border-left-color:#e9c46a}.ipr-c.alto{border-left-color:#e76f51}" +
    ".ipr-c-lg{grid-column:1/-1}.ipr-c-t{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7}" +
    ".ipr-c-v{font:700 17px/1.2 Outfit,Inter,system-ui,sans-serif;overflow-wrap:anywhere}.ipr-c-v small{font-weight:500;opacity:.75;font-size:12px}" +
    ".ipr-c-f{font-size:11.5px;line-height:1.3;opacity:.8}" +
    ".ipr-fn2-esc ol{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px}" +
    ".ipr-fn2-esc li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.04)}" +
    ".ipr-fn2-esc li>div{display:flex;flex-direction:column;min-width:0}.ipr-fn2-esc li span{font-size:11.5px;opacity:.8}" +
    ".ipr-fn2-esc li.ipr-fn2-pri{background:rgba(233,161,90,.12);border:1px solid rgba(233,161,90,.4)}" +
    ".ipr-fn2-mais summary{cursor:pointer;font-weight:600;margin:6px 0}" +
    ".ipr-fn2-dir{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.ipr-fn2-sh{padding:3px 10px;font-size:12px}" +
    ".ipr-fn2-lk{font-size:12px;margin:0 0 10px;display:flex;gap:6px;align-items:center}.ipr-fn2-in{flex:1;min-width:0;font-size:11px;padding:3px 6px}" +
    ".ipr-fn2-pr{font-style:normal;font-weight:600;color:#e9a15a;margin-left:6px;white-space:nowrap}";
  (D.head || D.documentElement).appendChild(css);

  function botoes() {
    var sec = D.getElementById("ipe-res"), visivel = !!(sec && !sec.hidden && terreno());
    var fl = D.getElementById("ipr-fg-flut"), mapa = W.__ipe && W.__ipe.mapa && W.__ipe.mapa.getContainer && W.__ipe.mapa.getContainer();
    if (!fl && mapa) {
      fl = D.createElement("button"); fl.type = "button"; fl.id = "ipr-fg-flut";
      fl.innerHTML = "Ficha gratuita da propriedade <small>sem conta</small>";
      fl.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); abrir(); });
      mapa.appendChild(fl);
    }
    if (fl) fl.classList.toggle("on", visivel);
    if (visivel) { var Fv = terreno(), kv = Fv && chave(Fv); if (kv && kv !== ultimo) { if (botoes.k !== kv) { botoes.k = kv; botoes.t = Date.now(); } else if (Date.now() - botoes.t > 900) abrir(true); } }
    if (!sec) return;
    var t = D.getElementById("ipe-res-t");
    if (t && !t.classList.contains("ipr-fg-t")) { t.classList.add("ipr-fg-t"); t.innerHTML = "Ficha gratuita da propriedade <small>sem conta, indicativa</small>"; }
    if (!sec.querySelector(".ipr-fg-bt")) {
      var b = D.createElement("button"); b.type = "button"; b.className = "ipe-b ipe-b--ac ipr-fg-bt"; b.textContent = "Ver a ficha gratuita da propriedade";
      b.addEventListener("click", function (e) { e.preventDefault(); abrir(); });
      var p = sec.querySelector(".ipe-p"); if (p && p.nextSibling) sec.insertBefore(b, p.nextSibling); else sec.appendChild(b);
    }
    if (!visivel) { var o = sec.querySelector(".ipr-fg-out"); if (o && o.children.length && ultimo && chave(terreno() || { features: [] }) !== ultimo) { o.innerHTML = ""; ultimo = ""; var bb = sec.querySelector(".ipr-fg-bt"); if (bb) bb.textContent = "Ver a ficha gratuita da propriedade"; } }
  }

  // ---------- Partilhar a ficha (Nuno, 05/11/2026, 15h58): /atlas/?ficha=<limite> abre o Atlas com o terreno e a ficha, sem
  // conta. A ligação leva só o limite (coordenadas arredondadas a ~1 m), sem dados pessoais nem da conta. ----------
  function b64u(t) { return btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function u64(t) { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return decodeURIComponent(escape(atob(t))); }
  function codificar(F) {
    var passo = 1, txt = "";
    for (var tent = 0; tent < 6; tent++) {
      txt = F.features.map(function (f) { return polis(f.geometry).map(function (p) { return p.map(function (r) {
        var o = r.filter(function (q, i) { return i % passo === 0 || i === r.length - 1; });
        return o.map(function (q) { return q[0].toFixed(5) + "," + q[1].toFixed(5); }).join(" "); }).join("|"); }).join("!"); }).join("!");
      if (txt.length < 5000) break; passo *= 2;
    }
    return b64u(txt);
  }
  function descodificar(c) {
    try {
      var polys = u64(c).split("!").map(function (p) { return p.split("|").map(function (r) { return r.split(" ").map(function (q) { var v = q.split(","); return [+v[0], +v[1]]; }); }); });
      polys = polys.filter(function (p) { return p[0] && p[0].length >= 4 && p[0].every(function (q) { return isFinite(q[0]) && isFinite(q[1]) && Math.abs(q[0]) <= 180 && Math.abs(q[1]) <= 90; }); });
      return polys.length ? { type: "FeatureCollection", features: polys.map(function (p) { return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: p } }; }) } : null;
    } catch (e) { return null; }
  }
  D.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("[data-fg-partilhar]"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    var F = terreno(); if (!F) return;
    var url = location.origin + "/atlas/?ficha=" + codificar(F);
    var lk = b.closest(".ipr-fg-out") && b.closest(".ipr-fg-out").querySelector(".ipr-fn2-lk");
    function mostra(t) { if (!lk) return; lk.hidden = false; lk.textContent = ""; var s1 = D.createElement("span"); s1.textContent = t + " "; var a = D.createElement("input"); a.readOnly = true; a.value = url; a.className = "ipr-fn2-in"; a.addEventListener("focus", function () { a.select(); }); lk.appendChild(s1); lk.appendChild(a); }
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ title: "Ficha da propriedade · IPR Atlas", url: url }).catch(function () {}); mostra("Ligação:"); return; }
    mostra("Copie a ligação:");
    try { navigator.clipboard.writeText(url).then(function () { mostra("Ligação copiada:"); }, function () {}); } catch (e) {}
  }, true);
  // Abrir uma ficha partilhada
  (function abrirPartilhada() {
    var m = /[?&]ficha=([A-Za-z0-9_-]{8,})/.exec(location.search); if (!m) return;
    var F = descodificar(m[1]); if (!F) return;
    // O app.js repõe ipe_terreno_v1 no arranque do mapa; com uma ficha partilhada, guarda-se à parte para não se somar.
    try { var ant = localStorage.getItem("ipe_terreno_v1"); if (ant) { localStorage.setItem("ipe_terreno_v1_antes", ant); localStorage.removeItem("ipe_terreno_v1"); } } catch (e) {}
    var t0 = Date.now();
    (function espera() {
      var A = W.__ipe && W.__ipe.mapa, dr = A && (A._controls || []).filter(function (x) { return x && typeof x.getAll === "function"; })[0];
      var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="enc"]');
      if (!A || !dr || !tab || !A.loaded || !A.loaded()) { if (Date.now() - t0 < 60000) setTimeout(espera, 500); return; }
      tab.click();
      // O terreno guardado da última visita (ipe_terreno_v1) é reposto pelo Atlas: a ficha partilhada substitui-o, para não somar dois terrenos.
      try { dr.deleteAll(); } catch (e) {}
      var novos = [], ids = {}; F.features.forEach(function (f) { dr.add(f).forEach(function (k) { ids[k] = 1; novos.push(dr.get(k)); }); });
      A.fire("draw.create", { features: novos });
      setTimeout(function () {
        try { var c = A.getCenter(); if (c.lng < b[0] || c.lng > b[2] || c.lat < b[1] || c.lat > b[3]) A.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, duration: 0, maxZoom: 17 }); } catch (e) {} }, 3000);
      var b = bbox(F); try { A.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, duration: 0, maxZoom: 17 }); } catch (e) {}
      setTimeout(function () { var sec = D.getElementById("ipe-res"); if (sec && sec.hidden) sec.hidden = false; abrir(); }, 3800);
    })();
  })();

  // ---------- 2. Cartões dos projectos: junta a secção à ficha já feita ----------
  function cartoes() {
    var E = W.__ipe && W.__ipe.estado; if (!E || !E.mapas) return;
    // A ficha está em [data-res-out] (clientes) ou em .ipr-ficha-out (equipa, ajustes.js).
    [].forEach.call(D.querySelectorAll("#ipe-proj [data-res-out] .ipe-res-r, #ipe-proj .ipr-ficha-out .ipe-res-r"), function (r) {
      if (r.querySelector(".ipr-fg-pdm")) return;
      var o = r.closest("[data-res-out]"), c = r.closest(".ipe-card");
      var i = o ? +o.getAttribute("data-res-out") : c ? +c.getAttribute("data-i") : NaN, m = E.mapas[i]; if (!m || !m.geojson) return;
      seccao(m.geojson, m.encomenda || m.id, r);
    });
    tres(E);
  }
  // 3D da propriedade no cartão aberto (Nuno, 13h38: «Onde é que está o 3D das bases? Antes aparecia tudo na ficha»). O §59
  // do ajustes.js só o põe nos cartões com a classe «on»; as linhas finas (bases-finas.js) abrem o cartão sem ela.
  function tres(E) {
    if (typeof W.__iprVista3d !== "function") return;
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-card.ipr-fn-on, #ipe-proj .ipe-card.on"), function (c) {
      if (!c.offsetParent || c.querySelector(".ipr-fx, .ipr-fg-3d")) return;
      var m = E.mapas[+c.getAttribute("data-i")], id = m && +(m.encomenda || m.id); if (!id) return;
      var d = D.createElement("div"); d.className = "ipr-fx ipr-fg-3d"; d.innerHTML = '<div class="ipr-fx-3"></div>';
      var cx = c.querySelector(".ipe-cx"); if (!cx) return; cx.insertBefore(d, cx.firstChild);
      d.addEventListener("click", function (e) { e.stopPropagation(); }, false);
      try { W.__iprVista3d(d.firstChild, id, false, true); } catch (e) { d.remove(); }
    });
  }

  var t = 0;
  function corre() { t = 0; try { botoes(); cartoes(); } catch (e) {} }
  function agenda() { if (!t) t = setTimeout(corre, 250); }
  function ligar() {
    if (!D.body) return false;
    new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    setInterval(corre, 1500); // o desenho muda no mapa sem mexer no DOM
    corre(); return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
