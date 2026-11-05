/* IPR Atlas · «Partilhar resultados» do Simulador de Fogo e leitura da ligação só de ver (05/11/2026). Pedido do Nuno,
   04/11/2026: «Não estou a encontrar o botão de partilhar nas simulações.» / «Sim, é bem claro.» Igual à da água: ligação
   só de ver, sem conta e sem descargas, expira em 30 dias e quem partilha pode revogar. O site guarda uma cópia leve do
   resultado e dá o código (m90766).
   1. Em cada simulação concluída do painel «Simular fogo» (#ipr-fs, fogo-simulador.js), por baixo de «Resultados», um
      bloco «Partilhar resultados» com a ligação, «Copiar», «Enviar…» e «Revogar».
   2. Com ?fogo=<código> no endereço do Atlas, mostra o resultado partilhado num cartão só de leitura (números
      principais, hora do dia, legenda, data de expiração) e desenha as camadas leves; nada para descarregar.
   Só acrescenta: não mexe no fogo-simulador.js (liga-se pelo DOM e por window.IPR_FOGO_SIM._estado).
   Desliga-se com ?fogo-partilha=0 ou localStorage ipr_fogo_part_off=1. Terracrua Design. */
(function (W) {
  "use strict";
  var Doc = document;
  try {
    if (/[?&]fogo-partilha=0\b/.test(location.search) || W.localStorage.getItem("ipr_fogo_part_off") === "1") return;
  } catch (e) {}
  if (W.__iprFogoPartilha) return; W.__iprFogoPartilha = 1;

  var TX = {
    pt: {
      partilhar: "Partilhar resultados", aCriar: "A preparar a ligação…", copiar: "Copiar", copiado: "Copiado", enviar: "Enviar…", revogar: "Revogar",
      nota: "Ligação só de ver: abre o mapa com este resultado, sem conta e sem descargas. Expira em 30 dias e pode revogá-la quando quiser. Quem tiver a ligação vê onde fica o terreno desta Base.",
      expira: "Expira a {d}.", revogada: "Ligação revogada.",
      p_tempo: "Cenário no tempo", p_ad: "Antes e depois", p_muitas: "Muitas ignições", p_chuva: "Fogo e primeira chuva", titulo: "Fogo partilhado",
      soVer: "Ligação só de ver · expira a {d}", aCarregar: "A carregar o resultado…", fechar: "Fechar", min: "Minimizar", enquadrar: "Enquadrar",
      e404: "Esta ligação não existe.", e410: "Esta ligação expirou ou foi revogada por quem a partilhou.", e429: "Demasiados pedidos. Tente daqui a pouco.", eOutro: "Não foi possível abrir o resultado.",
      area: "Área ardida", areaProp: "Dentro da propriedade", chegada: "Primeira chegada à propriedade", duracao: "Duração simulada", truncado: "A simulação parou no limite da zona calculada.",
      antes: "Antes", depois: "Depois", difA: "Diferença de área", corridas: "Ignições simuladas", freqMax: "Frequência máxima", freqNota: "A frequência conta em quantas ignições cada sítio ardeu; não é uma probabilidade.",
      dia: "Hora do dia", das: "das {a} às {b}", diaCol: ["Hora", "°C", "HR", "Comb. fino", "Vento", "Rajada"], vento: "Vento", isocronas: "Frente de fogo de {p} em {p} min",
      aviso: "Estimativas de um modelo em testes (IPR Atlas, Terracrua Design). Não servem para decidir ficar ou sair nem para agir num incêndio real. Emergência: 112."
    },
    en: {
      partilhar: "Share results", aCriar: "Preparing the link…", copiar: "Copy", copiado: "Copied", enviar: "Send…", revogar: "Revoke",
      nota: "View-only link: opens the map with this result, no account and no downloads. It expires in 30 days and you can revoke it at any time. Anyone with the link sees where this Base's land is.",
      expira: "Expires on {d}.", revogada: "Link revoked.",
      p_tempo: "Scenario over time", p_ad: "Before and after", p_muitas: "Many ignitions", p_chuva: "Fire and first rain", titulo: "Shared fire",
      soVer: "View-only link · expires on {d}", aCarregar: "Loading the result…", fechar: "Close", min: "Minimise", enquadrar: "Zoom to",
      e404: "This link does not exist.", e410: "This link has expired or was revoked.", e429: "Too many requests. Try again shortly.", eOutro: "Could not open the result.",
      area: "Burnt area", areaProp: "Inside the property", chegada: "First arrival at the property", duracao: "Simulated duration", truncado: "The simulation stopped at the edge of the computed area.",
      antes: "Before", depois: "After", difA: "Area difference", corridas: "Simulated ignitions", freqMax: "Highest frequency", freqNota: "Frequency counts how many ignitions burnt each place; it is not a probability.",
      dia: "Time of day", das: "from {a} to {b}", diaCol: ["Time", "°C", "RH", "Fine fuel", "Wind", "Gust"], vento: "Wind", isocronas: "Fire front every {p} min",
      aviso: "Estimates from a model in testing (IPR Atlas, Terracrua Design). Not for deciding to stay or leave, nor for acting on a real fire. Emergency: 112."
    }
  };
  function L() { return (W.IPR_LINGUA || Doc.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var d = TX[L()]; return k in d ? d[k] : (TX.pt[k] || k); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n(x, d) { if (x == null || isNaN(x)) return "–"; return Number(x).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 1 : d }); }
  function data(iso) { try { return new Date(iso).toLocaleDateString(L() === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return ""; } }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  var REST = "/wp-json/tcd/v1/";
  function api(c, op) {
    op = op || {}; op.credentials = op.credentials || "same-origin"; op.headers = op.headers || {};
    if (W.tcdNonce && op.credentials !== "omit") op.headers["X-WP-Nonce"] = W.tcdNonce;
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return fetch(REST + c, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j && j.message || ("HTTP " + r.status)); er.estado = r.status; er.codigo = j && j.code; throw er; } return j; }); });
  }
  function nomeProc(p) { return t({ "cenario-tempo": "p_tempo", "antes-depois": "p_ad", "muitas-ignicoes": "p_muitas", "fogo-chuva": "p_chuva" }[p] || "p_tempo"); }
  var COR_ISO = ["interpolate", ["linear"], ["coalesce", ["get", "t_min"], 0], 0, "#fff3b0", 60, "#f4a259", 180, "#bc4b51", 720, "#5b2333"];

  function css() {
    if (Doc.getElementById("ipr-fp-css")) return;
    var st = Doc.createElement("style"); st.id = "ipr-fp-css";
    st.textContent =
      "[data-fpartilha]{margin:8px 0;padding:8px 10px;border:1px dashed #e07a3f;border-radius:9px;font-size:12px}" +
      "[data-fpartilha] .fp-l{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}[data-fpartilha] input{flex:1;min-width:0;height:30px;padding:3px 7px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:12px 'IBM Plex Mono',monospace}" +
      "[data-fpartilha] button{font:500 12px Inter,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:32px}[data-fpartilha] button.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}[data-fpartilha] button:disabled{opacity:.5}" +
      "[data-fpartilha] .fp-n{color:var(--mu,#a3a690);font-size:11.5px;margin:4px 0}[data-fpartilha] .fp-e{color:#e6a19e;margin:4px 0}" +
      "#ipr-fp{position:fixed;z-index:100000;top:64px;right:56px;width:350px;max-width:calc(100% - 24px);max-height:calc(100vh - 90px);overflow:auto;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif}" +
      "#ipr-fp *{box-sizing:border-box}#ipr-fp .fp-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-fp .fp-cab b{flex:1;font:600 13.5px Raleway,Inter,sans-serif}" +
      "#ipr-fp .fp-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-fp.min .fp-corpo{display:none}" +
      "#ipr-fp .fp-corpo{padding:10px 12px 12px}#ipr-fp p{margin:0 0 8px}#ipr-fp .sub{color:var(--mu,#a3a690);font-size:12px}#ipr-fp .h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:10px 0 6px}" +
      "#ipr-fp .kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12px;margin:0 0 6px}#ipr-fp .kv span:nth-child(2n){font:500 12px 'IBM Plex Mono',monospace;text-align:right}" +
      "#ipr-fp .leg{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:2px 0 1px}#ipr-fp .leg i{flex:1}#ipr-fp .legv{display:flex;justify-content:space-between;font:500 10px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690)}" +
      "#ipr-fp table{width:100%;border-collapse:collapse;font:500 11px 'IBM Plex Mono',monospace;margin:0 0 6px}#ipr-fp th{font:600 10px Inter,sans-serif;color:var(--mu,#a3a690);text-align:right;padding:2px 3px}#ipr-fp td{text-align:right;padding:2px 3px;border-top:1px solid var(--ln,#2b3024)}#ipr-fp th:first-child,#ipr-fp td:first-child{text-align:left}" +
      "#ipr-fp .faixa{padding:6px 9px;border-radius:8px;background:rgba(217,164,65,.14);border:1px solid #d9a441;font-size:11.5px}#ipr-fp .b{font:500 12px Inter,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:32px}" +
      "@media (max-width:600px){#ipr-fp{left:8px;right:8px;top:auto;bottom:60px;width:auto;max-width:none;max-height:55vh}}";
    Doc.head.appendChild(st);
  }

  // ═════════════ 1. Bloco «Partilhar resultados» no painel «Simular fogo» ═════════════
  var EST = {};   // por id do trabalho: { lig, aCriar, erro, visto, copiado, revogada }
  function bloco(id, enc) {
    var e = EST[id] || (EST[id] = {});
    if (!e.visto && W.tcdNonce) {   // ligação já criada (painel reaberto): pergunta uma vez
      e.visto = true;
      api("fogo-partilha/minhas?ref=" + encodeURIComponent(id)).then(function (r) { var p = (r.partilhas || [])[0]; if (p && !e.lig) { e.lig = p; repintar(); } }).catch(function () {});
    }
    var h = '<div data-fpartilha="' + esc(id) + '" data-enc="' + esc(enc) + '">';
    if (e.lig) {
      h += '<div class="fp-l"><input type="text" readonly value="' + esc(e.lig.url) + '" aria-label="' + esc(t("partilhar")) + '"><button type="button" data-fp="copiar">' + esc(e.copiado ? t("copiado") : t("copiar")) + "</button></div>";
      h += '<div class="fp-l">' + (navigator.share ? '<button type="button" data-fp="enviar">' + esc(t("enviar")) + "</button>" : "") + '<button type="button" data-fp="revogar">' + esc(t("revogar")) + '</button><span class="fp-n">' + esc(t("expira").replace("{d}", data(e.lig.expira))) + "</span></div>";
    } else {
      h += '<button type="button" class="pri" data-fp="criar"' + (e.aCriar ? " disabled" : "") + ">" + esc(e.aCriar ? t("aCriar") : t("partilhar")) + "</button>";
      h += '<p class="fp-n">' + esc(t("nota")) + "</p>";
      if (e.revogada) h += '<p class="fp-n">' + esc(t("revogada")) + "</p>";
    }
    if (e.erro) h += '<p class="fp-e">' + esc(e.erro) + "</p>";
    return h + "</div>";
  }
  function acao(el) {
    var b = el.closest("[data-fpartilha]"); if (!b) return;
    var id = b.getAttribute("data-fpartilha"), e = EST[id] || (EST[id] = {}), a = el.getAttribute("data-fp");
    if (a === "criar") {
      if (e.aCriar) return;
      e.aCriar = true; e.erro = ""; e.revogada = false; repintar();
      api("fogo-partilha", { method: "POST", body: { id: id, enc: +b.getAttribute("data-enc") } }).then(function (r) { e.aCriar = false; e.lig = r.partilha; repintar(); })
        .catch(function (er) { e.aCriar = false; e.erro = er.message; repintar(); });
    } else if (a === "copiar" && e.lig) {
      var fim = function () { e.copiado = true; repintar(); setTimeout(function () { e.copiado = false; repintar(); }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(e.lig.url).then(fim, function () { selec(b); });
      else selec(b);
    } else if (a === "enviar" && e.lig && navigator.share) {
      navigator.share({ title: "IPR Atlas · " + t("titulo"), url: e.lig.url }).catch(function () {});
    } else if (a === "revogar" && e.lig) {
      api("fogo-partilha/revogar", { method: "POST", body: { codigo: e.lig.codigo } }).then(function () { e.lig = null; e.revogada = true; repintar(); })
        .catch(function (er) { e.erro = er.message; repintar(); });
    }
  }
  function selec(b) { var i = b.querySelector("input"); if (i) { i.focus(); i.select(); } }
  Doc.addEventListener("click", function (ev) { var el = ev.target.closest && ev.target.closest("[data-fpartilha] [data-fp]"); if (el) { ev.preventDefault(); ev.stopPropagation(); acao(el); } }, true);

  function noPainel() {
    var P = Doc.getElementById("ipr-fs"); if (!P || P.hidden) return;
    var S = W.IPR_FOGO_SIM && W.IPR_FOGO_SIM._estado, a = W.__ipe && W.__ipe.estado && W.__ipe.estado.actual;
    var antigo = P.querySelector("[data-fpartilha]");
    if (!S || !S.res || !S.res.id || !/^[0-9a-f]{32}$/.test(S.res.id) || !a || !a.id || !W.tcdNonce) { if (antigo) antigo.remove(); return; }
    if (antigo && antigo.getAttribute("data-fpartilha") === S.res.id && !antigo.__sujo) return;
    var hs = P.querySelectorAll(".fs-corpo .fs-h"), h = null;
    for (var i = 0; i < hs.length; i++) { if (/^(resultados|results)$/i.test((hs[i].textContent || "").trim())) { h = hs[i]; break; } }
    if (!h) return;
    if (antigo) antigo.remove();
    css();
    var d = Doc.createElement("div"); d.innerHTML = bloco(S.res.id, a.id);
    h.parentNode.insertBefore(d.firstChild, h.nextSibling);
  }
  function repintar() {
    Array.prototype.forEach.call(Doc.querySelectorAll("[data-fpartilha]"), function (x) { x.__sujo = true; });
    noPainel();
  }
  function vigiar() {
    var P = Doc.getElementById("ipr-fs"); if (!P || P.__fpVigia) return;
    P.__fpVigia = true;
    new MutationObserver(function () { clearTimeout(P.__fpT); P.__fpT = setTimeout(noPainel, 30); }).observe(P, { childList: true, subtree: false });
    noPainel();
  }
  setInterval(function () { if (!Doc.hidden) { vigiar(); noPainel(); } }, 1500);
  Doc.addEventListener("ipr:lingua", repintar);

  // ═════════════ 2. Leitura de uma ligação (?fogo=<código>) ═════════════
  var COD = null;
  try { COD = new URLSearchParams(location.search).get("fogo"); } catch (e) {}
  if (!COD || !/^[A-Za-z0-9]{12}$/.test(COD)) return;

  var R = null, ERR = "", C = null, IDS = [];
  function cartao() {
    css();
    if (!C) {
      C = Doc.createElement("div"); C.id = "ipr-fp"; C.setAttribute("role", "dialog"); C.setAttribute("aria-label", t("titulo"));
      Doc.body.appendChild(C);
      C.addEventListener("click", function (ev) {
        var b = ev.target.closest && ev.target.closest("[data-fpc]"); if (!b) return; ev.preventDefault();
        var a = b.getAttribute("data-fpc");
        if (a === "x") { C.remove(); C = null; tirar(); }
        else if (a === "min") C.classList.toggle("min");
        else if (a === "enq") enquadrar();
      });
    }
    var h = '<div class="fp-cab"><b>' + esc(t("titulo")) + (R ? " · " + esc(nomeProc(R.processo)) : "") + '</b><button class="fp-ib" data-fpc="min" aria-label="' + esc(t("min")) + '">–</button><button class="fp-ib" data-fpc="x" aria-label="' + esc(t("fechar")) + '">×</button></div><div class="fp-corpo">';
    if (ERR) h += '<p class="faixa">' + esc(ERR) + "</p>";
    else if (!R) h += '<p class="sub">' + esc(t("aCarregar")) + "</p>";
    else {
      h += numeros(R.processo, R.resumo || {});
      (R.camadas || []).forEach(function (c) {
        if (c.legenda && c.legenda.pontos && c.legenda.pontos.length) {
          var q = c.legenda.pontos;
          h += '<span class="h">' + esc(c.legenda.titulo || c.id) + '</span><div class="leg">' + q.map(function (x) { return '<i style="background:' + esc(x[1]) + '"></i>'; }).join("") + '</div><div class="legv"><span>' + n(q[0][0], 2) + "</span><span>" + n(q[q.length - 1][0], 2) + "+</span></div>";
        } else if (/isocronas/.test(c.id) && R.passo_min) {
          h += '<span class="h">' + esc(t("isocronas").replace(/\{p\}/g, n(R.passo_min, 0))) + "</span>";
        }
      });
      h += '<p style="margin-top:10px"><button class="b" data-fpc="enq">' + esc(t("enquadrar")) + "</button></p>";
      h += '<p class="sub">' + esc(t("soVer").replace("{d}", data(R.expira))) + "</p>";
      h += '<p class="faixa">' + esc(t("aviso")) + "</p>";
    }
    C.innerHTML = h + "</div>";
  }
  function kvCenario(s) {
    var h = '<div class="kv"><span>' + esc(t("area")) + "</span><span>" + n(s.area_ardida_ha, 2) + " ha</span>";
    if (s.propriedade) h += "<span>" + esc(t("areaProp")) + "</span><span>" + n(s.propriedade.area_ardida_ha, 2) + " ha</span><span>" + esc(t("chegada")) + "</span><span>" + (s.propriedade.primeira_chegada_min == null ? "–" : n(s.propriedade.primeira_chegada_min, 0) + " min") + "</span>";
    if (s.duracao_h != null) h += "<span>" + esc(t("duracao")) + "</span><span>" + n(s.duracao_h, 1) + " h</span>";
    return h + "</div>" + (s.truncado ? '<p class="sub">' + esc(t("truncado")) + "</p>" : "");
  }
  function numeros(proc, s) {
    var h = "";
    if (proc === "antes-depois") {
      h += '<span class="h">' + esc(t("antes")) + "</span>" + kvCenario(s.antes || {}) + '<span class="h">' + esc(t("depois")) + "</span>" + kvCenario(s.depois || {});
      if (s.diferenca_area_ha != null) h += '<div class="kv"><span>' + esc(t("difA")) + "</span><span>" + n(s.diferenca_area_ha, 2) + " ha</span></div>";
    } else if (proc === "muitas-ignicoes") {
      h += '<div class="kv"><span>' + esc(t("corridas")) + "</span><span>" + n(s.n, 0) + "</span><span>" + esc(t("freqMax")) + "</span><span>" + n(s.frequencia_max, 3) + "</span></div>";
      h += '<p class="sub">' + esc(t("freqNota")) + "</p>";
    } else {
      h += kvCenario(s);
    }
    var base = s.antes || s, dd = base.dia;
    if (dd && dd.por_horas && dd.por_horas.length) {
      var c = t("diaCol");
      h += '<span class="h">' + esc(t("dia")) + " · " + esc(t("das").replace("{a}", dd.hora_inicio).replace("{b}", dd.hora_fim)) + "</span>";
      h += "<table><tr>" + c.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr>" + dd.por_horas.filter(function (x, i, a) { return i % 2 === 0 || i === a.length - 1; }).map(function (x) {
        return "<tr><td>" + esc(x.hora) + "</td><td>" + n(x.temp_c, 0) + "</td><td>" + n(x.hr_pc, 0) + " %</td><td>" + n(x.m1h_pc, 1) + " %</td><td>" + n(x.vento_kmh, 0) + "</td><td>" + n(x.rajada_kmh, 0) + "</td></tr>";
      }).join("") + "</table>";
    }
    if (base.vento && (base.vento.campo || base.vento.origem)) h += '<p class="sub">' + esc(t("vento")) + ": " + esc(base.vento.campo || base.vento.origem) + "</p>";
    return h;
  }
  function tirar() { var M = mapa(); if (!M) return; IDS.forEach(function (sid) { [sid + "-l", sid + "-t"].forEach(function (l) { try { if (M.getLayer(l)) M.removeLayer(l); } catch (e) {} }); try { if (M.getSource(sid)) M.removeSource(sid); } catch (e) {} }); IDS = []; }
  function por() {
    var M = mapa(); if (!M || !R || !C) return;
    (R.camadas || []).forEach(function (c, i) {
      var sid = "ipr-fp-" + i; if (M.getSource(sid)) return;
      try {
        if (c.tipo === "imagem" && c.cantos) {
          M.addSource(sid, { type: "image", url: c.url, coordinates: c.cantos });
          M.addLayer({ id: sid + "-l", type: "raster", source: sid, paint: { "raster-opacity": 0.8, "raster-resampling": "nearest" } });
        } else {
          M.addSource(sid, { type: "geojson", data: c.url });
          M.addLayer({ id: sid + "-l", type: "line", source: sid, paint: { "line-color": COR_ISO, "line-width": 1.6 } });
          M.addLayer({ id: sid + "-t", type: "symbol", source: sid, layout: { "symbol-placement": "line", "text-field": ["concat", ["to-string", ["get", "t_min"]], " min"], "text-size": 10 },
            paint: { "text-color": "#fff", "text-halo-color": "#141814", "text-halo-width": 1.2 } });
        }
        if (IDS.indexOf(sid) < 0) IDS.push(sid);
      } catch (e) {}
    });
  }
  function enquadrar() { var M = mapa(), b = R && R.bbox; if (!M || !b) return; try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: W.innerWidth < 700 ? 24 : 60, maxZoom: 16, duration: 700 }); } catch (e) {} }

  // Pedido sem cookies (a leitura é pública: não precisa de sessão nem de nonce).
  var pedido = api("fogo-partilha/ver/" + COD, { credentials: "omit" }).then(function (r) { R = r; }).catch(function (er) {
    ERR = er.estado === 404 ? t("e404") : er.estado === 410 ? t("e410") : er.estado === 429 ? t("e429") : t("eOutro");
  });
  var tent = 0;
  (function esperar() {
    var M = mapa();
    if (!M || !M.loaded || !(M.isStyleLoaded ? M.isStyleLoaded() : M.loaded())) { if (++tent < 12) return setTimeout(esperar, 500); }
    cartao();
    pedido.then(function () {
      cartao();
      if (!R) return;
      var k = 0;
      (function ligar() {
        var M2 = mapa();
        if (!M2 || !(M2.style && M2.style._loaded)) { if (++k < 180) setTimeout(ligar, 500); return; }
        por(); enquadrar();
        var mexeu = false; M2.once("dragstart", function () { mexeu = true; }); M2.once("wheel", function () { mexeu = true; });
        [3000, 8000, 15000].forEach(function (ms) { setTimeout(function () { if (!mexeu) enquadrar(); }, ms); });
        var subir = function () { var ls = (M2.getStyle() || {}).layers || []; var nossas = ls.filter(function (l) { return /^ipr-fp-/.test(l.id); }).length; if (!nossas || ls.slice(-nossas).every(function (l) { return /^ipr-fp-/.test(l.id); })) return; IDS.forEach(function (sid) { [sid + "-l", sid + "-t"].forEach(function (l) { try { if (M2.getLayer(l)) M2.moveLayer(l); } catch (e) {} }); }); };
        subir();
        M2.on("styledata", function () { if (C && R) { IDS = IDS.filter(function (sid) { return !!M2.getSource(sid); }); por(); subir(); } });
        M2.on("idle", subir);
      })();
    });
  })();
  Doc.addEventListener("ipr:lingua", function () { if (C) cartao(); });
})(window);
