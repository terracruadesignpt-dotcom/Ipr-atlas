/* IPR Atlas · Temas guardados 1, 2 e 3, larguras dos painéis e simuladores em Processos (Nuno, 30/10/2026, 17h33:
   «tem de dar para cada user fazer presets de temas, o 1 o 2 e o 3. tem de dar para aumentar e reduzir (mexer) nos blocos
   laterais, como já teve. tem de aparecer os simuladores e o keyline. Proíbo-te de removeres cenas que estavam a funcionar
   sem autorização»). Terracrua Design.
   Só acrescenta; não esconde nem tira nada do que existe.
   1. Temas guardados: no cabeçalho dos Temas, «Os meus: 1 2 3 · Guardar». «Guardar» e depois um número guarda as camadas
      ligadas agora (e o fundo); um número já guardado repõe essas camadas. Guardar outra vez no mesmo número substitui.
      Com sessão fica na conta (módulo m90559, window.IPR_TEMAS) e segue a pessoa; sem sessão, neste navegador.
   2. Larguras: os puxadores do ajustes.js (§2, .ipr-px) ficam visíveis nos dois lados no computador, o da esquerda incluído.
   3. Simuladores e Keyline em Processos (Nuno, 17h45: «os simuladores e o keyline vão para processos, e essa barra deve
      estar bem visível»): faixa destacada no topo do separador Processos, para quem tem os simuladores no site
      (window.IPR_SIM_BASE). Os botões são os mesmos do simulador-base.js (aviso, aceitar, escolher a Base). A faixa que o
      fogo-simulador.js já põe nos Temas fica como está. Keyline: botão para a equipa, marcado «em preparação» até o motor e o
      desenho assistido estarem publicados.
   Desligar: localStorage ipr_extra_off = 1 (ou ?extra=0). */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]extra=0\b/.test(location.search) || localStorage.getItem("ipr_extra_off") === "1") return; } catch (e) {}
  if (W.__iprExtra) return; W.__iprExtra = 1;

  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(D.documentElement.lang || "pt"); }
  var TX = {
    pt: { meus: "Os meus", guardar: "Guardar", escolha: "Escolha 1, 2 ou 3", vazio: "Vazio: carregue em «Guardar» e depois aqui", repor: "Repor as camadas guardadas", guardado: "Guardado no {n}", reposto: "Reposto o {n}", semConta: "Ficou guardado neste navegador, mas não na conta. Tente de novo.", sims: "Simuladores", agua: "Simular água", fogo: "Simular fogo", keyline: "Keyline", klT: "Keyline: em preparação (motor e desenho assistido por publicar)", prep: "em preparação" },
    en: { meus: "Mine", guardar: "Save", escolha: "Choose 1, 2 or 3", vazio: "Empty: press «Save» and then here", repor: "Restore the saved layers", guardado: "Saved to {n}", reposto: "Restored {n}", semConta: "Saved in this browser but not in your account. Please try again.", sims: "Simulators", agua: "Simulate water", fogo: "Simulate fire", keyline: "Keyline", klT: "Keyline: in preparation (engine and assisted design not yet published)", prep: "in preparation" }
  };
  function tx(k, n) { return String(TX[en() ? "en" : "pt"][k]).replace("{n}", n == null ? "" : n); }
  function viz() { return W.__ipe && W.__ipe.viz; }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  var st = D.createElement("style"); st.id = "ipr-extra-css";
  st.textContent =
    ".ipr-x{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 0 4px;font:12px Inter,sans-serif;color:var(--tx2,#cfd2c4)}" +
    ".ipr-x .h{font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9aa08f);margin-right:2px}" +
    ".ipr-x button{font:600 12px Inter,sans-serif;min-width:30px;min-height:28px;padding:3px 9px;border-radius:8px;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx,#e9eadf);cursor:pointer}" +
    ".ipr-x button.vz{color:var(--mu,#9aa08f);border-style:dashed}.ipr-x button.on{border-color:var(--ac,#b5c46a);color:var(--ac,#b5c46a)}" +
    ".ipr-x button[disabled]{opacity:.55;cursor:not-allowed}.ipr-x .ms{flex:1 0 100%;font-size:11.5px;color:var(--mu,#9aa08f);min-height:0}" +
    ".ipr-x .ms:empty{display:none}.ipr-x em{font-style:normal;font-weight:500;font-size:10.5px;margin-left:4px;color:var(--mu,#9aa08f)}" +
    ".ipr-x-s{gap:8px;margin:0 0 12px;padding:12px;border:1px solid var(--ac,#b5c46a);border-radius:12px;background:var(--p3,rgba(127,127,127,.08))}" +
    ".ipr-x-s .h{flex:1 0 100%;font-size:11.5px;color:var(--tx,#e9eadf)}" +
    ".ipr-x-s button{flex:1 1 9em;min-height:44px;font-size:13.5px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;border-width:1.5px}" +
    ".ipr-x-s button svg{width:20px;height:20px}" +
    // 2. larguras: os dois puxadores à vista no computador
    "@media (min-width:901px){.ipe:not(.sem-esq) .ipr-px.ipr-px-wl,.ipe:not(.sem-dir) .ipr-px.ipr-px-wr{display:block!important;z-index:40}}";
  (D.head || D.documentElement).appendChild(st);

  // ───────── 1. Temas guardados ─────────
  function chave() { return "ipr_temas_presets"; } // cópia neste navegador (sem sessão, é a única)
  function conta() { var T = W.IPR_TEMAS; return T && typeof T === "object" && T.u && T.n && T.p && typeof T.p === "object" ? T : null; } // m90559: na conta
  function local() { try { var o = JSON.parse(ler(chave()) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function presets() { var T = conta(); return T ? JSON.parse(JSON.stringify(T.p)) : local(); }
  function enviar(P) {
    var T = conta(); if (!T || !W.fetch) return;
    var f = new URLSearchParams(); f.set("action", "tcd_m90559_gravar"); f.set("nonce", T.n); f.set("p", JSON.stringify(P));
    fetch(T.u, { method: "POST", credentials: "same-origin", body: f }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.success && j.data && j.data.p) T.p = j.data.p; else msg(tx("semConta"));
    }).catch(function () { msg(tx("semConta")); });
  }
  function gravarPresets(P) { gravar(chave(), JSON.stringify(P)); var T = conta(); if (T) { T.p = P; enviar(P); } }
  // primeira vez com sessão: o que estava só neste navegador passa para a conta
  (function () { var T = conta(); if (!T || Object.keys(T.p).length) return; var L = local(); if (Object.keys(L).length) { T.p = L; enviar(L); } })();
  function catIdx() { var m = {}; try { ((W.IPRViz && W.IPRViz.catalogo) || (viz() && viz().catalogo) || []).forEach(function (e) { m[e.id] = e; }); } catch (e) {} return m; }
  var modoGuardar = false, msgT = null;
  function msg(t) { var m = D.querySelector(".ipr-x-p .ms"); if (!m) return; m.textContent = t; clearTimeout(msgT); msgT = setTimeout(function () { m.textContent = ""; }, 3500); }
  function guardarSlot(n) {
    var R = viz(); if (!R) return;
    var on = []; try { on = R.activas(); } catch (e) {}
    var P = presets(); P[n] = { c: on, t: Date.now() }; gravarPresets(P);
    modoGuardar = false; pintarPresets(); msg(tx("guardado", n));
  }
  function reporSlot(n) {
    var R = viz(), P = presets()[n]; if (!R || !P || !P.c) return;
    var C = catIdx(), quer = {}, on = [];
    if (!Object.keys(C).length) return; // sem catálogo não se desliga nada
    P.c.forEach(function (id) { quer[id] = 1; });
    try { on = R.activas(); } catch (e) {}
    on.forEach(function (id) { var e = C[id]; if (!quer[id] && e && !e.fundo && !e.fixo) { try { R.ligar(id, false); } catch (x) {} } }); // só camadas do catálogo: o limite do terreno (aoi) e as camadas entregues ficam
    P.c.forEach(function (id) {
      var e = C[id]; if (!e) return;
      if (W.IPR_NIVEL === "explorer" && e.lic && e.lic !== "v") return; // fechada no Explorer: não se liga por aqui
      try { if (e.fundo && R.fundo) R.fundo(id); else if (on.indexOf(id) < 0) R.ligar(id, true); } catch (x) {}
    });
    msg(tx("reposto", n));
  }
  function pintarPresets() {
    var b = D.querySelector(".ipr-x-p"); if (!b) return;
    var P = presets();
    [].forEach.call(b.querySelectorAll("[data-px]"), function (x) {
      var n = x.getAttribute("data-px"), tem = !!(P[n] && P[n].c);
      x.classList.toggle("vz", !tem); x.classList.toggle("on", modoGuardar);
      x.title = modoGuardar ? tx("escolha") : (tem ? tx("repor") + " (" + P[n].c.length + ")" : tx("vazio"));
    });
    var g = b.querySelector("[data-pxg]"); if (g) { g.textContent = tx("guardar"); g.classList.toggle("on", modoGuardar); g.setAttribute("aria-pressed", String(modoGuardar)); }
    var h = b.querySelector(".h"); if (h) h.textContent = tx("meus");
  }
  function blocoPresets() {
    var d = D.createElement("div"); d.className = "ipr-x ipr-x-p";
    d.innerHTML = '<span class="h"></span><button type="button" data-px="1">1</button><button type="button" data-px="2">2</button><button type="button" data-px="3">3</button><button type="button" data-pxg></button><span class="ms" aria-live="polite"></span>';
    return d;
  }

  // ───────── 3. Simuladores e Keyline ─────────
  var IA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/></svg>';
  var IF = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-4 0-6z"/></svg>';
  var IK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 8c4-3 8 3 18 0M3 13c4-3 8 3 18 0M3 18c4-3 8 3 18 0"/></svg>';
  function blocoSims() {
    var d = D.createElement("div"); d.className = "ipr-x ipr-x-s"; return d;
  }
  function pintarSims(d, t62, sempre) {
    var S = W.IPR_SIM_BASE, temSims = !!(S && typeof S === "object" && S.pode), equipa = !!W.tcdEquipa;
    var deles = sempre ? null : t62.querySelector(":scope > .ipr-sims"); // em Processos aparece sempre
    var k = (en() ? "en" : "pt") + (temSims && !deles ? "s" : "") + (equipa ? "k" : "");
    if (d.getAttribute("data-k") === k) return;
    d.setAttribute("data-k", k);
    var h = "";
    if (temSims && !deles) h += '<button type="button" data-agua-sim>' + IA + " " + tx("agua") + '</button><button type="button" data-fogo-sim>' + IF + " " + tx("fogo") + "</button>";
    if (equipa) h += '<button type="button" disabled title="' + tx("klT") + '">' + IK + " " + tx("keyline") + "<em>" + tx("prep") + "</em></button>";
    d.innerHTML = h ? '<span class="h">' + tx("sims") + "</span>" + h : "";
    d.style.display = h ? "" : "none";
  }

  // ───────── montagem dentro do #ipr-t62 (o §62 redesenha-o; repõe-se logo) ─────────
  function montarSims() {
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="enc"]'), t62 = D.getElementById("ipr-t62") || D.createElement("div"); if (!pane) return;
    var s = pane.querySelector(":scope > .ipr-x-s");
    if (!s) { s = blocoSims(); pane.insertBefore(s, pane.firstChild); }
    else if (s !== pane.firstElementChild) pane.insertBefore(s, pane.firstChild);
    pintarSims(s, t62, true);
  }
  function montar() {
    try { montarSims(); } catch (e) {}
    var t62 = D.getElementById("ipr-t62"); if (!t62) return;
    var cab = t62.querySelector(".ipr-t62-cab");
    var p = t62.querySelector(".ipr-x-p");
    if (!p && cab) { p = blocoPresets(); cab.parentNode.insertBefore(p, cab.nextSibling); pintarPresets(); }
    if (!t62.__ix) {
      t62.__ix = 1;
      new MutationObserver(function () { try { montar(); } catch (e) {} }).observe(t62, { childList: true });
    }
  }
  D.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var g = t.closest(".ipr-x-p [data-pxg]");
    if (g) { e.preventDefault(); e.stopPropagation(); modoGuardar = !modoGuardar; pintarPresets(); if (modoGuardar) msg(tx("escolha")); return; }
    var b = t.closest(".ipr-x-p [data-px]");
    if (b) {
      e.preventDefault(); e.stopPropagation();
      var n = b.getAttribute("data-px");
      if (modoGuardar) guardarSlot(n); else if (presets()[n]) reporSlot(n); else msg(tx("vazio"));
    }
  }, true);
  D.addEventListener("ipr:lingua", function () { var s = D.querySelector(".ipr-x-s"); if (s) s.removeAttribute("data-k"); pintarPresets(); montar(); });
  setInterval(function () { if (!D.hidden) try { montar(); } catch (e) {} }, 1000);
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", montar); else montar();
})();
