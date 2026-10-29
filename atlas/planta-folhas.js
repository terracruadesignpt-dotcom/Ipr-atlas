/* IPR Atlas · Planta de localização: folhas por omissão e serviços que falham (29/10/2026, reporte do Nuno, 18h49:
   «A ideia era termos na planta de localização também os usos de solos e PDM. E pelo menos no Vale da Vinha não encontrei.
   E havia lá um mapa que estava sem ligação.»). Complemento do §55/§61 do ajustes.js; não mexe nesse ficheiro.
   1. Diálogo: liga por omissão a COS 2023 (f_cos23) e o PDM · ordenamento (f_pdm); liga a planta de condicionantes do PDM
      (f_pdmc) assim que o concelho é encontrado e a caixa fica activa. A COS 2018 fica à escolha. O que a pessoa mudar à mão
      não volta a ser mudado.
   2. Concelho do terreno: o pedido directo à OGC API da DGT (cont_freguesias) que falhe é repetido uma vez pelo proxy do
      site (/wp-json/tcd/v1/viz/px?u=…, como o pmPedir do ajustes.js).
   3. Mosaicos vazios: os proxies do site (m14554 /viz/px e m90379 /wms/pdm_*, /wms/srup_*) respondem 200 com um PNG
      transparente de 1 × 1 quando estão ocupados ou a origem falha, e a planta aceitava-o como imagem: saía um mapa em
      branco sem aviso. Durante a geração de uma planta, e só para os pedidos do código da planta, este ficheiro:
      - limita os pedidos em simultâneo (3 para /viz/px, 1 para /wms/, o que o m90379 aceita);
      - repete uma vez, passados cerca de 2 s e com um parâmetro novo, uma imagem com menos de 100 bytes (ou um 503 do
        travão m90190);
      - se voltar a vir vazia, devolve 503, e o ajustes.js mostra «Serviço indisponível no momento» na folha e no diálogo;
      - conta os mosaicos da planta de condicionantes do PDM que falharam e acrescenta uma nota à linha de estado.
   Âmbito: só entre o clique em «Gerar PDF» e o fim da geração (o botão volta a ficar activo; tecto de 10 min), só para
   pedidos feitos com um endereço em texto e um objecto de opções (o pmPedir e o plImg); o MapLibre pede com objectos
   Request e nunca é interceptado. As imagens da planta vêm todas por fetch (o Image() só lê blob: e data:).
   Desligar: window.IPR_PLANTA_FOLHAS_OFF = true antes de carregar, ou ?planta_folhas=0 no endereço. */
(function () {
  "use strict";
  if (window.__iprPlantaFolhas) return;
  try { if (window.IPR_PLANTA_FOLHAS_OFF || /[?&]planta_folhas=0(?:&|$)/.test(location.search)) return; } catch (e) {}
  if (typeof window.fetch !== "function") return;
  window.__iprPlantaFolhas = 1;

  var TX = {
    pt: { pdmFalhas: " Planta de condicionantes do PDM: {f} de {t} mosaicos sem resposta do serviço; a folha pode estar incompleta. Gere o PDF de novo mais tarde.",
      repetidos: " Pedidos repetidos por o serviço não ter respondido: {n}." },
    en: { pdmFalhas: " PDM constraints plan: {f} of {t} tiles got no answer from the service; the sheet may be incomplete. Generate the PDF again later.",
      repetidos: " Requests repeated because the service did not answer: {n}." }
  };
  function tx(k, v) {
    var d = TX[(document.getElementById("ipr-pl") || {}).lang === "en" || window.IPR_LINGUA === "en" ? "en" : "pt"], s = d[k];
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }

  var PX = "/wp-json/tcd/v1/viz/px", WMS_RE = /^\/wp-json\/tcd\/v1\/wms\/(pdm_\d{4}|srup_[a-z]+)(?:\?|$)/;
  var FREG_RE = /^https:\/\/ogcapi\.dgterritorio\.gov\.pt\/collections\/cont_freguesias\/items\?/;
  var IMG_RE = /GetMap|\/export\?|exportImage/i;
  var nativo = window.fetch.bind(window);

  // ---------- estado de uma geração ----------
  var G = { activa: false, ate: 0, pdmTot: 0, pdmFalhas: 0, repetidos: 0 };
  function activa() { if (G.activa && Date.now() > G.ate) G.activa = false; return G.activa; }
  window.__iprPlantaFolhasEstado = G; // para diagnóstico e testes

  // ---------- filas ----------
  function Fila(max) { this.max = max; this.n = 0; this.q = []; }
  Fila.prototype.entrar = function (sinal) {
    var f = this;
    return new Promise(function (ok, ko) {
      if (sinal && sinal.aborted) return ko(abortado());
      var it = { ok: ok };
      if (sinal) sinal.addEventListener("abort", function () { var i = f.q.indexOf(it); if (i >= 0) { f.q.splice(i, 1); ko(abortado()); } });
      if (f.n < f.max) { f.n++; ok(); } else f.q.push(it);
    });
  };
  Fila.prototype.sair = function () { var it = this.q.shift(); if (it) it.ok(); else this.n--; };
  function abortado() { try { return new DOMException("Aborted", "AbortError"); } catch (e) { var x = new Error("Aborted"); x.name = "AbortError"; return x; } }
  var FILA_PX = new Fila(3), FILA_WMS = new Fila(1);

  function esperar(ms, sinal) {
    return new Promise(function (ok, ko) {
      var t = setTimeout(ok, ms);
      if (sinal) sinal.addEventListener("abort", function () { clearTimeout(t); ko(abortado()); });
    });
  }
  function comR(u) { return u + (u.indexOf("?") < 0 ? "?" : "&") + "_r=" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function indisponivel(motivo) {
    return new Response("Serviço indisponível no momento (" + motivo + ").", { status: 503, statusText: "Service Unavailable", headers: { "Content-Type": "text/plain; charset=utf-8", "X-IPR-Planta": motivo } });
  }
  // Uma resposta «vazia»: imagem com menos de 100 bytes (o PNG de 1 × 1 dos proxies) ou 503 do travão.
  function lerResp(r) {
    if (r.status === 503) return Promise.resolve({ vazio: true, r: r });
    var ct = r.headers.get("content-type") || "";
    if (!r.ok || ct.indexOf("image") < 0) return Promise.resolve({ vazio: false, r: r });
    return r.blob().then(function (b) {
      var nova = new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers });
      return { vazio: b.size < 100, r: nova };
    });
  }

  // ---------- pedidos da planta ----------
  function pedidoPlanta(u, init, fila, tipo) {
    var sinal = init && init.signal;
    return fila.entrar(sinal).then(function () {
      function tentar(url) { return nativo(url, init).then(lerResp); }
      return tentar(u).then(function (a) {
        if (!a.vazio || tipo === "json") return a.r;
        G.repetidos++;
        return esperar(1800 + Math.round(Math.random() * 400), sinal).then(function () { return tentar(comR(u)); }).then(function (b) {
          return b.vazio ? indisponivel("vazio") : b.r;
        });
      }).then(function (r) { fila.sair(); return r; }, function (x) { fila.sair(); throw x; });
    });
  }
  function contarPdm(u, p) {
    if (!/\/wms\/pdm_\d{4}/.test(u) || /[?&]leg=1/.test(u)) return p;
    G.pdmTot++;
    return p.then(function (r) { if (!r.ok) G.pdmFalhas++; return r; }, function (x) { G.pdmFalhas++; throw x; });
  }

  // ---------- concelho (cont_freguesias) ----------
  function viaProxy(u) {
    return nativo(PX + "?u=" + encodeURIComponent(u), { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } });
  }
  function concelho(u, init) {
    return nativo(u, init).then(function (r) {
      if (r.ok) return r;
      return viaProxy(u).then(function (p) { return p.ok ? p : r; }, function () { return r; });
    }, function (x) {
      return viaProxy(u).then(function (p) { if (!p.ok) throw x; return p; }, function () { throw x; });
    });
  }

  window.fetch = function (input, init) {
    try {
      if (typeof input === "string") {
        if (FREG_RE.test(input)) return concelho(input, init);
        if (init && typeof init === "object" && activa()) {
          if (input.indexOf(PX + "?") === 0) {
            var alvo = ""; try { alvo = decodeURIComponent((/[?&]u=([^&]*)/.exec(input) || [])[1] || ""); } catch (e) {}
            return pedidoPlanta(input, init, FILA_PX, IMG_RE.test(alvo) ? "img" : "json");
          }
          if (WMS_RE.test(input)) return contarPdm(input, pedidoPlanta(input, init, FILA_WMS, /[?&]leg=1/.test(input) ? "leg" : "img"));
        }
      }
    } catch (e) {}
    return nativo(input, init);
  };

  // ---------- diálogo ----------
  function marcar(inp) {
    if (!inp || inp.disabled || inp.checked || inp.__iprMexido) return;
    inp.checked = true;
    try { inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
  }
  function prepararDialogo(o) {
    if (!o || o.__iprFolhas) return;
    o.__iprFolhas = 1;
    o.addEventListener("change", function (ev) { if (ev.isTrusted && ev.target && ev.target.dataset) ev.target.__iprMexido = 1; }, true);
    marcar(o.querySelector('[data-k="f_cos23"]'));
    marcar(o.querySelector('[data-k="f_pdm"]'));
    var pdmc = o.querySelector('[data-k="f_pdmc"]');
    if (pdmc) {
      marcar(pdmc);
      new MutationObserver(function () { marcar(pdmc); }).observe(pdmc, { attributes: true, attributeFilter: ["disabled"] });
    }
    // Geração: do clique em «Gerar PDF» até o botão voltar a ficar activo.
    var b = o.querySelector('[data-a="ok"]'), s = o.querySelector(".s");
    if (!b) return;
    b.addEventListener("click", function () {
      if (b.disabled) return;
      G.activa = true; G.ate = Date.now() + 6e5; G.pdmTot = 0; G.pdmFalhas = 0; G.repetidos = 0;
    }, true);
    new MutationObserver(function () {
      if (b.disabled || !G.activa) return;
      G.activa = false;
      var nota = "";
      if (G.pdmFalhas > 0) nota += tx("pdmFalhas", { f: G.pdmFalhas, t: G.pdmTot });
      if (G.repetidos > 0) nota += tx("repetidos", { n: G.repetidos });
      if (nota && s) setTimeout(function () { s.textContent = (s.textContent || "") + nota; }, 0);
    }).observe(b, { attributes: true, attributeFilter: ["disabled"] });
  }
  function procurar() { var o = document.getElementById("ipr-pl"); if (o) prepararDialogo(o); }
  new MutationObserver(procurar).observe(document.body || document.documentElement, { childList: true });
  procurar();
})();
