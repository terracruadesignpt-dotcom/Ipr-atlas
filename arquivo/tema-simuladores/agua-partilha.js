/* IPR Atlas · «Partilhar resultados» do Simulador de Água e leitura da ligação só de ver (04/11/2026). Pedido do Nuno,
   10h44-10h50, escolha «Ligação só de ver»: abre o mapa com o resultado, sem conta e sem descarga, leve, expira em 30 dias
   e quem partilha pode revogar. O site guarda uma cópia leve do resultado (m90740) e dá o código (m90742).
   1. Em cada simulação concluída, no painel «Simular água» (#ipr-as, agua-simulador.js, Bases) e no painel da
      demonstração (#ipr-ad, agua-demo.js), um bloco «Partilhar resultados» com a ligação, «Copiar» e «Revogar».
   2. Com ?agua=<código> no endereço do Atlas, mostra o resultado partilhado num cartão só de leitura (legenda, números
      principais, data de expiração) e desenha as camadas leves; nada para descarregar.
   Só acrescenta: não mexe no agua-simulador.js nem no agua-demo.js (liga-se pelo DOM e por window.IPR_AGUA_SIM._estado).
   Desliga-se com ?agua-partilha=0 ou localStorage ipr_agua_part_off=1. Terracrua Design. */
(function (W) {
  "use strict";
  var Doc = document;
  try {
    if (/[?&]agua-partilha=0\b/.test(location.search) || W.localStorage.getItem("ipr_agua_part_off") === "1") return;
  } catch (e) {}
  if (W.__iprAguaPartilha) return; W.__iprAguaPartilha = 1;

  var TX = {
    pt: {
      partilhar: "Partilhar resultados", aCriar: "A preparar a ligação…", copiar: "Copiar", copiado: "Copiado", enviar: "Enviar…", revogar: "Revogar",
      nota: "Ligação só de ver: abre o mapa com este resultado, sem conta e sem descargas. Expira em 30 dias e pode revogá-la quando quiser.",
      notaBase: "Quem tiver a ligação vê onde fica o terreno desta Base.", expira: "Expira a {d}.", revogada: "Ligação revogada.",
      t_ret: "Onde a água pára", t_2d: "Chuva no terreno", t_ad: "Antes e depois", titulo: "Resultado partilhado", demo: "Simulação no mapa de demonstração da bacia do Mira.",
      soVer: "Ligação só de ver · expira a {d}", aCarregar: "A carregar o resultado…", fechar: "Fechar", min: "Minimizar", enquadrar: "Enquadrar",
      e404: "Esta ligação não existe.", e410: "Esta ligação expirou ou foi revogada por quem a partilhou.", e429: "Demasiados pedidos. Tente daqui a pouco.", eOutro: "Não foi possível abrir o resultado.",
      chuvaUtil: "Chuva útil", retido: "Retido", saido: "Saiu do terreno", depressoes: "Depressões", capacidade: "Capacidade total",
      pico: "Caudal de pico à saída", aos: "aos", saida: "Saída medida", infiltracao: "Infiltração", armazenado: "Ficou no terreno", erro: "Erro do balanço",
      ganho: "Ganho de retenção", reducao: "Redução do pico", pontos: "Zonas com água acima de {l} m: {z}",
      aviso: "Estimativas de um modelo em testes (IPR Atlas, Terracrua Design). Não servem para decisões de segurança. Emergência: 112."
    },
    en: {
      partilhar: "Share results", aCriar: "Preparing the link…", copiar: "Copy", copiado: "Copied", enviar: "Send…", revogar: "Revoke",
      nota: "View-only link: opens the map with this result, no account and no downloads. It expires in 30 days and you can revoke it at any time.",
      notaBase: "Anyone with the link sees where this Base's land is.", expira: "Expires on {d}.", revogada: "Link revoked.",
      t_ret: "Where water stops", t_2d: "Rain on the land", t_ad: "Before and after", titulo: "Shared result", demo: "Simulation on the Mira basin demo map.",
      soVer: "View-only link · expires on {d}", aCarregar: "Loading the result…", fechar: "Close", min: "Minimise", enquadrar: "Zoom to",
      e404: "This link does not exist.", e410: "This link has expired or was revoked.", e429: "Too many requests. Try again shortly.", eOutro: "Could not open the result.",
      chuvaUtil: "Effective rain", retido: "Retained", saido: "Left the terrain", depressoes: "Depressions", capacidade: "Total capacity",
      pico: "Peak outflow", aos: "at", saida: "Measured outflow", infiltracao: "Infiltration", armazenado: "Stayed on the land", erro: "Balance error",
      ganho: "Retention gain", reducao: "Peak reduction", pontos: "Areas with water above {l} m: {z}",
      aviso: "Estimates from a model in testing (IPR Atlas, Terracrua Design). Not for safety decisions. Emergency: 112."
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
    return fetch(REST + c, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j && j.message || ("HTTP " + r.status)); er.estado = r.status; throw er; } return j; }); });
  }
  function nomeProc(p) { return t({ "retencao-rapida": "t_ret", "simulacao-2d": "t_2d", "antes-depois": "t_ad" }[p] || "t_ret"); }

  function css() {
    if (Doc.getElementById("ipr-ap-css")) return;
    var st = Doc.createElement("style"); st.id = "ipr-ap-css";
    st.textContent =
      "[data-partilha]{margin:8px 0;padding:8px 10px;border:1px dashed var(--ac,#a8b878);border-radius:9px;font-size:12px}" +
      "[data-partilha] .ap-l{display:flex;gap:6px;align-items:center;margin:6px 0}[data-partilha] input{flex:1;min-width:0;height:30px;padding:3px 7px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:12px 'IBM Plex Mono',monospace}" +
      "[data-partilha] button{font:500 12px Inter,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:32px}[data-partilha] button.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}[data-partilha] button:disabled{opacity:.5}" +
      "[data-partilha] .ap-n{color:var(--mu,#a3a690);font-size:11.5px;margin:4px 0}[data-partilha] .ap-e{color:#e6a19e;margin:4px 0}" +
      "#ipr-ap{position:fixed;z-index:100000;top:64px;right:56px;width:340px;max-width:calc(100% - 24px);max-height:calc(100vh - 90px);overflow:auto;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif}" +
      "#ipr-ap *{box-sizing:border-box}#ipr-ap .ap-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-ap .ap-cab b{flex:1;font:600 13.5px Raleway,Inter,sans-serif}" +
      "#ipr-ap .ap-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-ap.min .ap-corpo{display:none}" +
      "#ipr-ap .ap-corpo{padding:10px 12px 12px}#ipr-ap p{margin:0 0 8px}#ipr-ap .sub{color:var(--mu,#a3a690);font-size:12px}#ipr-ap .h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:10px 0 6px}" +
      "#ipr-ap .kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12px;margin:0 0 6px}#ipr-ap .kv span:nth-child(2n){font:500 12px 'IBM Plex Mono',monospace;text-align:right}" +
      "#ipr-ap .leg{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:2px 0 1px}#ipr-ap .leg i{flex:1}#ipr-ap .legv{display:flex;justify-content:space-between;font:500 10px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690)}" +
      "#ipr-ap .faixa{padding:6px 9px;border-radius:8px;background:rgba(217,164,65,.14);border:1px solid #d9a441;font-size:11.5px}#ipr-ap .b{font:500 12px Inter,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:32px}" +
      "@media (max-width:600px){#ipr-ap{left:8px;right:8px;top:auto;bottom:60px;width:auto;max-width:none;max-height:55vh}}";
    Doc.head.appendChild(st);
  }

  // ═════════════ 1. Bloco «Partilhar resultados» ═════════════
  var EST = {};   // por ref: { lig: {codigo,url,expira}, aCriar, erro, visto }
  function bloco(tipo, ref, id, enc) {
    var e = EST[ref] || (EST[ref] = {});
    if (!e.visto && W.tcdNonce) {   // ligação já criada (painel reaberto): pergunta uma vez
      e.visto = true;
      api("agua-partilha/minhas?ref=" + encodeURIComponent(ref)).then(function (r) { var p = (r.partilhas || [])[0]; if (p && !e.lig) { e.lig = p; repintar(); } }).catch(function () {});
    }
    var h = '<div data-partilha="' + esc(ref) + '" data-tipo="' + esc(tipo) + '" data-id="' + esc(id) + '" data-enc="' + esc(enc || "") + '">';
    if (e.lig) {
      h += '<div class="ap-l"><input type="text" readonly value="' + esc(e.lig.url) + '" aria-label="' + esc(t("partilhar")) + '"><button type="button" data-ap="copiar">' + esc(e.copiado ? t("copiado") : t("copiar")) + "</button></div>";
      h += '<div class="ap-l">' + (navigator.share ? '<button type="button" data-ap="enviar">' + esc(t("enviar")) + "</button>" : "") + '<button type="button" data-ap="revogar">' + esc(t("revogar")) + '</button><span class="ap-n">' + esc(t("expira").replace("{d}", data(e.lig.expira))) + "</span></div>";
    } else {
      h += '<button type="button" class="pri" data-ap="criar"' + (e.aCriar ? " disabled" : "") + ">" + esc(e.aCriar ? t("aCriar") : t("partilhar")) + "</button>";
      h += '<p class="ap-n">' + esc(t("nota")) + (tipo === "base" ? " " + esc(t("notaBase")) : "") + "</p>";
      if (e.revogada) h += '<p class="ap-n">' + esc(t("revogada")) + "</p>";
    }
    if (e.erro) h += '<p class="ap-e">' + esc(e.erro) + "</p>";
    return h + "</div>";
  }
  function acao(el) {
    var b = el.closest("[data-partilha]"); if (!b) return;
    var ref = b.getAttribute("data-partilha"), e = EST[ref] || (EST[ref] = {}), a = el.getAttribute("data-ap");
    if (a === "criar") {
      e.aCriar = true; e.erro = ""; e.revogada = false; repintar();
      var corpo = { tipo: b.getAttribute("data-tipo"), id: b.getAttribute("data-id") };
      if (corpo.tipo === "base") corpo.enc = +b.getAttribute("data-enc"); else corpo.id = +corpo.id;
      api("agua-partilha", { method: "POST", body: corpo }).then(function (r) { e.aCriar = false; e.lig = r.partilha; repintar(); })
        .catch(function (er) { e.aCriar = false; e.erro = er.message; repintar(); });
    } else if (a === "copiar" && e.lig) {
      var fim = function () { e.copiado = true; repintar(); setTimeout(function () { e.copiado = false; repintar(); }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(e.lig.url).then(fim, function () { selec(b); });
      else selec(b);
    } else if (a === "enviar" && e.lig && navigator.share) {
      navigator.share({ title: "IPR Atlas · " + t("titulo"), url: e.lig.url }).catch(function () {});
    } else if (a === "revogar" && e.lig) {
      api("agua-partilha/revogar", { method: "POST", body: { codigo: e.lig.codigo } }).then(function () { e.lig = null; e.revogada = true; repintar(); })
        .catch(function (er) { e.erro = er.message; repintar(); });
    }
  }
  function selec(b) { var i = b.querySelector("input"); if (i) { i.focus(); i.select(); } }
  Doc.addEventListener("click", function (ev) { var el = ev.target.closest && ev.target.closest("[data-partilha] [data-ap]"); if (el) { ev.preventDefault(); ev.stopPropagation(); acao(el); } }, true);

  // Painel das Bases (#ipr-as): por baixo do título «Resultados», quando há um resultado concluído aberto.
  function noPainelBase() {
    var P = Doc.getElementById("ipr-as"); if (!P || P.hidden) return;
    var S = W.IPR_AGUA_SIM && W.IPR_AGUA_SIM._estado, a = W.__ipe && W.__ipe.estado && W.__ipe.estado.actual;
    var antigo = P.querySelector("[data-partilha]");
    if (!S || !S.res || !S.res.id || !/^[0-9a-f]{32}$/.test(S.res.id) || !a || !a.id || !W.tcdNonce) { if (antigo) antigo.remove(); return; }
    if (antigo && antigo.getAttribute("data-partilha") === S.res.id && !antigo.__sujo) return;
    var hs = P.querySelectorAll(".as-corpo .as-h"), h = null;
    for (var i = 0; i < hs.length; i++) { if (/^(resultados|results)$/i.test((hs[i].textContent || "").trim())) { h = hs[i]; break; } }
    if (!h) return;
    if (antigo) antigo.remove();
    css();
    var d = Doc.createElement("div"); d.innerHTML = bloco("base", S.res.id, S.res.id, a.id);
    h.parentNode.insertBefore(d.firstChild, h.nextSibling);
  }
  // Painel da demonstração (#ipr-ad): dentro do resultado aberto.
  function noPainelDemo() {
    var P = Doc.getElementById("ipr-ad"); if (!P || P.hidden || !W.tcdNonce) return;
    var r = P.querySelector(".ad-res[data-demo-id]"); if (!r) return;
    var id = r.getAttribute("data-demo-id"), ref = "d" + id, antigo = r.querySelector("[data-partilha]");
    if (antigo && antigo.getAttribute("data-partilha") === ref && !antigo.__sujo) return;
    if (antigo) antigo.remove();
    css();
    var d = Doc.createElement("div"); d.innerHTML = bloco("demo", ref, id, "");
    r.appendChild(d.firstChild);
  }
  function repintar() {
    Array.prototype.forEach.call(Doc.querySelectorAll("[data-partilha]"), function (x) { x.__sujo = true; });
    noPainelBase(); noPainelDemo();
  }
  function vigiar(id) {
    var P = Doc.getElementById(id); if (!P || P.__apVigia) return;
    P.__apVigia = true;
    new MutationObserver(function () { clearTimeout(P.__apT); P.__apT = setTimeout(function () { noPainelBase(); noPainelDemo(); }, 30); }).observe(P, { childList: true, subtree: false });
    noPainelBase(); noPainelDemo();
  }
  setInterval(function () { if (!Doc.hidden) { vigiar("ipr-as"); vigiar("ipr-ad"); } }, 1500);
  Doc.addEventListener("ipr:agua-demo-pintado", function () { setTimeout(noPainelDemo, 0); });
  Doc.addEventListener("ipr:lingua", repintar);

  // ═════════════ 2. Leitura de uma ligação (?agua=<código>) ═════════════
  var COD = null;
  try { COD = new URLSearchParams(location.search).get("agua"); } catch (e) {}
  if (!COD || !/^[A-Za-z0-9]{12}$/.test(COD)) return;

  var R = null, ERR = "", C = null, IDS = [];
  function cartao() {
    css();
    if (!C) {
      C = Doc.createElement("div"); C.id = "ipr-ap"; C.setAttribute("role", "dialog"); C.setAttribute("aria-label", t("titulo"));
      var host = Doc.body;
      host.appendChild(C);
      C.addEventListener("click", function (ev) {
        var b = ev.target.closest && ev.target.closest("[data-apc]"); if (!b) return; ev.preventDefault();
        var a = b.getAttribute("data-apc");
        if (a === "x") { C.remove(); C = null; tirar(); }
        else if (a === "min") C.classList.toggle("min");
        else if (a === "enq") enquadrar();
      });
    }
    var h = '<div class="ap-cab"><b>' + esc(t("titulo")) + (R ? " · " + esc(nomeProc(R.processo)) : "") + '</b><button class="ap-ib" data-apc="min" aria-label="' + esc(t("min")) + '">–</button><button class="ap-ib" data-apc="x" aria-label="' + esc(t("fechar")) + '">×</button></div><div class="ap-corpo">';
    if (ERR) h += '<p class="faixa">' + esc(ERR) + "</p>";
    else if (!R) h += '<p class="sub">' + esc(t("aCarregar")) + "</p>";
    else {
      if (R.demo) h += '<p class="sub">' + esc(t("demo")) + "</p>";
      h += numeros(R.processo, R.resumo || {});
      (R.camadas || []).forEach(function (c) {
        if (!c.legenda) return;
        var q = c.legenda.pontos;
        h += '<span class="h">' + esc(c.legenda.titulo || c.id) + '</span><div class="leg">' + q.map(function (x) { return '<i style="background:' + esc(x[1]) + '"></i>'; }).join("") + '</div><div class="legv"><span>' + n(q[0][0], 2) + "</span><span>" + n(q[q.length - 1][0], 2) + "+</span></div>";
      });
      h += '<p style="margin-top:10px"><button class="b" data-apc="enq">' + esc(t("enquadrar")) + "</button></p>";
      h += '<p class="sub">' + esc(t("soVer").replace("{d}", data(R.expira))) + "</p>";
      h += '<p class="faixa">' + esc(t("aviso")) + "</p>";
    }
    C.innerHTML = h + "</div>";
  }
  function numeros(proc, s) {
    var h = "";
    if (proc === "retencao-rapida") {
      (s.cenarios || []).forEach(function (c) { h += '<div class="kv"><span><b>' + n(c.chuva_mm, 0) + " mm</b></span><span></span><span>" + esc(t("chuvaUtil")) + "</span><span>" + n(c.chuva_util_m3, 0) + " m³</span><span>" + esc(t("retido")) + "</span><span>" + n(c.retido_m3, 0) + " m³ (" + n(c.retido_pct) + " %)</span><span>" + esc(t("saido")) + "</span><span>" + n(c.saido_m3, 0) + " m³</span></div>"; });
      if (s.depressoes != null) h += '<div class="kv"><span>' + esc(t("depressoes")) + "</span><span>" + n(s.depressoes, 0) + "</span><span>" + esc(t("capacidade")) + "</span><span>" + n(s.capacidade_total_m3, 0) + " m³</span></div>";
    } else if (proc === "simulacao-2d") {
      var b = s.balanco || {};
      h += '<div class="kv"><span>' + esc(t("pico")) + "</span><span>" + n(s.caudal_pico_saida_m3s, 3) + " m³/s " + esc(t("aos")) + " " + n(s.tempo_pico_saida_min, 0) + " min</span><span>" + esc(t("saida")) + "</span><span>" + n(b.saida_medida_m3, 0) + " m³</span><span>" + esc(t("infiltracao")) + "</span><span>" + n(b.infiltracao_m3, 0) + " m³</span><span>" + esc(t("armazenado")) + "</span><span>" + n(b.armazenado_fim_m3, 0) + " m³</span>";
      if (b.erro_rel != null) h += "<span>" + esc(t("erro")) + "</span><span>" + n(100 * b.erro_rel, 2) + " %</span>";
      h += "</div>";
    } else {
      (s.comparacao || []).forEach(function (c) {
        if (c.ganho_m3 != null) h += '<div class="kv"><span><b>' + n(c.chuva_mm, 0) + " mm</b></span><span></span><span>" + esc(t("ganho")) + "</span><span>" + n(c.ganho_m3, 0) + " m³</span><span>" + esc(t("retido")) + "</span><span>" + n(c.retido_antes_m3, 0) + " → " + n(c.retido_depois_m3, 0) + " m³</span></div>";
        else h += '<div class="kv"><span>' + esc(t("reducao")) + "</span><span>" + n(c.reducao_pico_pct) + " %</span><span>" + esc(t("pico")) + "</span><span>" + n(c.pico_antes_m3s, 3) + " → " + n(c.pico_depois_m3s, 3) + " m³/s</span></div>";
      });
    }
    var pi = s.pontos_inundacao;
    if (pi && pi.zonas != null) h += '<p class="sub">' + esc(t("pontos").replace("{l}", n(pi.limiar_m, 2)).replace("{z}", n(pi.zonas, 0))) + "</p>";
    return h;
  }
  function tirar() { var M = mapa(); if (!M) return; IDS.forEach(function (sid) { [sid + "-l", sid + "-c"].forEach(function (l) { try { if (M.getLayer(l)) M.removeLayer(l); } catch (e) {} }); try { if (M.getSource(sid)) M.removeSource(sid); } catch (e) {} }); IDS = []; }
  function por() {
    var M = mapa(); if (!M || !R || !C) return;
    (R.camadas || []).forEach(function (c, i) {
      var sid = "ipr-ap-" + i; if (M.getSource(sid)) return;
      try {
        if (c.tipo === "imagem" && c.cantos) {
          M.addSource(sid, { type: "image", url: c.url, coordinates: c.cantos });
          M.addLayer({ id: sid + "-l", type: "raster", source: sid, paint: { "raster-opacity": 0.85, "raster-resampling": "nearest" } });
        } else if (c.tipo === "pontos") {
          M.addSource(sid, { type: "geojson", data: c.url });
          M.addLayer({ id: sid + "-l", type: "circle", source: sid, paint: { "circle-color": ["match", ["get", "classe"], "grave", "#922b21", "perigo", "#e67e22", "#f4d03f"], "circle-radius": ["interpolate", ["linear"], ["coalesce", ["get", "altura_max_m"], 0], 0.2, 5, 1, 9, 3, 14], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
        } else {
          M.addSource(sid, { type: "geojson", data: c.url });
          M.addLayer({ id: sid + "-l", type: "fill", source: sid, paint: { "fill-color": "#17a589", "fill-opacity": 0.2 } });
          M.addLayer({ id: sid + "-c", type: "line", source: sid, paint: { "line-color": "#0e6655", "line-width": 1.2 } });
        }
        if (IDS.indexOf(sid) < 0) IDS.push(sid);
      } catch (e) {}
    });
  }
  function enquadrar() { var M = mapa(), b = R && R.bbox; if (!M || !b) return; try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: W.innerWidth < 700 ? 24 : 60, maxZoom: 16, duration: 700 }); } catch (e) {} }

  // Pedido sem cookies (a leitura é pública: não precisa de sessão nem de nonce).
  var pedido = api("agua-partilha/ver/" + COD, { credentials: "omit" }).then(function (r) { R = r; }).catch(function (er) {
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
      // O mapa pode nascer depois do cartão (site lento): espera por ele até 90 s e só então põe as camadas.
      var n = 0;
      (function ligar() {
        var M2 = mapa();
        if (!M2 || !(M2.style && M2.style._loaded)) { if (++n < 180) setTimeout(ligar, 500); return; }
        por(); enquadrar();
        // o Atlas ainda reposiciona o mapa no arranque: volta a enquadrar uma vez quando ele assentar
        var mexeu = false; M2.once("dragstart", function () { mexeu = true; }); M2.once("wheel", function () { mexeu = true; });
        [3000, 8000, 15000].forEach(function (ms) { setTimeout(function () { if (!mexeu) enquadrar(); }, ms); });
        var subir = function () { var ls = (M2.getStyle() || {}).layers || []; var nossas = ls.filter(function (l) { return /^ipr-ap-/.test(l.id); }).length; if (!nossas || ls.slice(-nossas).every(function (l) { return /^ipr-ap-/.test(l.id); })) return; IDS.forEach(function (sid) { [sid + "-l", sid + "-c"].forEach(function (l) { try { if (M2.getLayer(l)) M2.moveLayer(l); } catch (e) {} }); }); };
        subir();
        M2.on("styledata", function () { if (C && R) { IDS = IDS.filter(function (sid) { return !!M2.getSource(sid); }); por(); subir(); } });
        M2.on("idle", subir);
      })();
    });
  })();
  Doc.addEventListener("ipr:lingua", function () { if (C) cartao(); });
})(window);
